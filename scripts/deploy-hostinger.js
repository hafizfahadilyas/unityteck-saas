/**
 * One production build, two Hostinger accounts.
 * central = coffee + car + every new store (one docroot).
 * flowers = store-1 only, separate Hostinger.
 *
 * npm run deploy:all
 * npm run deploy:central
 * npm run deploy:flowers
 */

import * as ftp from 'basic-ftp';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

dotenv.config({ path: path.resolve(rootDir, '.env') });

const args = process.argv.slice(2);
const getArg = (key, fallback) => {
  const found = args.find((a) => a.startsWith(`--${key}=`));
  if (found) return found.split('=').slice(1).join('=');
  return fallback;
};

const requested = String(getArg('target', 'all')).toLowerCase();

function account(name, source) {
  const host = String(source.host || '').trim();
  const user = String(source.user || '').trim();
  const password = String(source.password || '').trim();
  if (!host || !user || !password) return null;
  return {
    name,
    label: source.label,
    host,
    user,
    password,
    dir: source.dir || '/',
    url: source.url,
  };
}

const central = account('central', {
  label: 'Central Hostinger (coffee, car, new stores)',
  host: process.env.FTP_CENTRAL_HOST,
  user: process.env.FTP_CENTRAL_USER,
  password: process.env.FTP_CENTRAL_PASSWORD,
  dir: process.env.FTP_CENTRAL_DIR || '/',
  url: process.env.FTP_CENTRAL_URL || 'https://mieraf-ksa.com/',
});

const flowers = account('flowers', {
  label: 'Flowers Hostinger (store-1)',
  host: process.env.FTP_FLOWERS_HOST || process.env.FTP_HOST,
  user: process.env.FTP_FLOWERS_USER || process.env.FTP_USER,
  password: process.env.FTP_FLOWERS_PASSWORD || process.env.FTP_PASSWORD,
  dir: process.env.FTP_FLOWERS_DIR || process.env.FTP_REMOTE_DIR || '/public_html',
  url: process.env.FTP_FLOWERS_URL || process.env.FTP_TARGET_URL || 'https://giftshop-sa.com/',
});

const catalog = { central, flowers };
const selected = requested === 'all' ? ['central', 'flowers'] : [requested];

if (!catalog[requested] && requested !== 'all') {
  console.error('Use --target=central, --target=flowers, or --target=all');
  process.exit(1);
}

function verifyLiveSite(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    console.log(`\nChecking ${url}`);
    const getter = url.startsWith('https') ? https : http;
    const req = getter.get(url, { timeout: 10000 }, (res) => {
      res.resume();
      console.log(`HTTP ${res.statusCode}`);
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', (err) => {
      console.warn(`Site check skipped: ${err.message}`);
      resolve(false);
    });
    req.on('timeout', () => {
      req.destroy();
      console.warn('Site check timed out.');
      resolve(false);
    });
  });
}

function collectFiles(dir, root, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'coffee-theme-refs' || entry.name === 'robots.txt') continue;
    if (entry.name.endsWith('.sqlite') || entry.name.endsWith('.sqlite-journal')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, root, out);
    else {
      out.push({
        full,
        rel: path.relative(root, full).split(path.sep).join('/'),
        size: fs.statSync(full).size,
      });
    }
  }
}

async function openClient(target) {
  const client = new ftp.Client(90000);
  client.ftp.verbose = false;
  const base = {
    host: target.host,
    user: target.user,
    password: target.password,
  };
  try {
    await client.access({
      ...base,
      secure: true,
      secureOptions: { rejectUnauthorized: false },
    });
  } catch (tlsErr) {
    console.log(`Secure FTP failed (${tlsErr.message}). Trying plain FTP.`);
    await client.access({ ...base, secure: false });
  }
  return client;
}

async function uploadTarget(target) {
  const files = [];
  collectFiles(distDir, distDir, files);
  const remoteRoot = (target.dir.startsWith('/') ? target.dir : `/${target.dir}`).replace(/\/$/, '') || '';
  console.log(`Connecting ${target.label} (${target.host}) ...`);
  console.log(`Uploading ${files.length} files`);
  let client = await openClient(target);
  try {
    await client.remove(`${remoteRoot}/robots.txt`.replace(/\/{2,}/g, '/'));
  } catch {
    /* no old robots file */
  }
  const readyDirs = new Set();
  try {
    let sent = 0;
    for (const file of files) {
      const remotePath = `${remoteRoot}/${file.rel}`.replace(/\/{2,}/g, '/');
      const parent = path.posix.dirname(remotePath);
      let attempts = 0;
      while (attempts < 4) {
        try {
          if (!readyDirs.has(parent)) {
            await client.ensureDir(parent);
            readyDirs.add(parent);
          }
          const replaceAlways = /^(index\.html|\.htaccess)$/.test(file.rel) || /\.(php|html)$/.test(file.rel);
          let same = false;
          if (!replaceAlways) {
            try {
              same = (await client.size(remotePath)) === file.size;
            } catch {
              same = false;
            }
          }
          if (!same) await client.uploadFrom(file.full, remotePath);
          sent += 1;
          if (sent % 50 === 0 || sent === files.length) console.log(`  ${sent}/${files.length}`);
          break;
        } catch (err) {
          attempts += 1;
          console.warn(`  ${file.rel} attempt ${attempts}: ${err.message}`);
          try { client.close(); } catch { /* already closed */ }
          if (attempts >= 4) throw err;
          readyDirs.clear();
          client = await openClient(target);
        }
      }
    }
    console.log(`Uploaded ${target.label}`);
    await verifyLiveSite(target.url);
  } finally {
    client.close();
  }
}

async function deploy() {
  if (!fs.existsSync(distDir)) {
    console.error('dist/ is missing. Run npm run build first.');
    process.exit(1);
  }

  const htaccessSource = path.join(rootDir, 'public', '.htaccess');
  const htaccessDist = path.join(distDir, '.htaccess');
  if (fs.existsSync(htaccessSource)) {
    fs.copyFileSync(htaccessSource, htaccessDist);
  }

  const refsDir = path.join(distDir, 'coffee-theme-refs');
  if (fs.existsSync(refsDir)) {
    fs.rmSync(refsDir, { recursive: true, force: true });
  }

  const ready = selected.map((name) => catalog[name]).filter(Boolean);
  const missing = selected.filter((name) => !catalog[name]);

  if (ready.length === 0) {
    console.error('No FTP account is configured.');
    console.error('Central: FTP_CENTRAL_HOST, FTP_CENTRAL_USER, FTP_CENTRAL_PASSWORD');
    console.error('Flowers: FTP_FLOWERS_HOST, FTP_FLOWERS_USER, FTP_FLOWERS_PASSWORD');
    process.exit(1);
  }

  for (const name of missing) {
    console.warn(`Skipping ${name}: FTP login is not in .env yet.`);
  }

  for (const target of ready) {
    console.log(`\n==== ${target.label} ====`);
    await uploadTarget(target);
  }

  console.log('\nDeploy finished. Store data stays isolated by store id.');
  console.log('Central upload covers coffee, car, and new stores on that account.');
  console.log('Flowers upload covers only the flowers Hostinger.');
}

deploy().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
