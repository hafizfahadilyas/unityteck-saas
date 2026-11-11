/**
 * Ultra-fast Hostinger deploy: upload ONLY files whose content hash changed.
 * Parallel targets. No remote size() round-trip for unchanged hashed assets.
 *
 * npm run deploy:fast -- --target=flowers
 * npm run deploy:fast -- --target=all
 * npm run deploy:fast -- --target=central
 */
import * as ftp from 'basic-ftp';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const manifestDir = path.resolve(rootDir, '.deploy-manifests');

dotenv.config({ path: path.resolve(rootDir, '.env') });

const args = process.argv.slice(2);
const getArg = (key, fallback) => {
  const found = args.find((a) => a.startsWith(`--${key}=`));
  if (found) return found.split('=').slice(1).join('=');
  return fallback;
};
const requested = String(getArg('target', 'flowers')).toLowerCase();
const forceFull = args.includes('--full');

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
  label: 'Central Hostinger',
  host: process.env.FTP_CENTRAL_HOST,
  user: process.env.FTP_CENTRAL_USER,
  password: process.env.FTP_CENTRAL_PASSWORD,
  dir: process.env.FTP_CENTRAL_DIR || '/',
  url: process.env.FTP_CENTRAL_URL || 'https://mieraf-ksa.com/',
});

const flowers = account('flowers', {
  label: 'Flowers Hostinger',
  host: process.env.FTP_FLOWERS_HOST || process.env.FTP_HOST,
  user: process.env.FTP_FLOWERS_USER || process.env.FTP_USER,
  password: process.env.FTP_FLOWERS_PASSWORD || process.env.FTP_PASSWORD,
  dir: process.env.FTP_FLOWERS_DIR || process.env.FTP_REMOTE_DIR || '/public_html',
  url: process.env.FTP_FLOWERS_URL || process.env.FTP_TARGET_URL || 'https://giftshop-sa.com/',
});

const catalog = { central, flowers };
const selected = requested === 'all' ? ['central', 'flowers'] : [requested];

function fileHash(fullPath) {
  const buf = fs.readFileSync(fullPath);
  return crypto.createHash('sha1').update(buf).digest('hex');
}

function collectFiles(dir, root, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'coffee-theme-refs' || entry.name === 'robots.txt') continue;
    if (entry.name.endsWith('.sqlite') || entry.name.endsWith('.sqlite-journal')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, root, out);
    else {
      const rel = path.relative(root, full).split(path.sep).join('/');
      out.push({ full, rel, size: fs.statSync(full).size, hash: fileHash(full) });
    }
  }
}

function loadManifest(targetName) {
  const p = path.join(manifestDir, `${targetName}.json`);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) || {};
  } catch {
    return {};
  }
}

function saveManifest(targetName, map) {
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(path.join(manifestDir, `${targetName}.json`), JSON.stringify(map, null, 0));
}

function verifyLiveSite(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const getter = url.startsWith('https') ? https : http;
    const req = getter.get(url, { timeout: 10000 }, (res) => {
      res.resume();
      console.log(`Check ${url} → HTTP ${res.statusCode}`);
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function openClient(target, tries = 4) {
  const base = { host: target.host, user: target.user, password: target.password };
  let lastErr;
  for (let i = 1; i <= tries; i++) {
    const client = new ftp.Client(90_000);
    client.ftp.verbose = false;
    try {
      try {
        await client.access({ ...base, secure: true, secureOptions: { rejectUnauthorized: false } });
      } catch {
        try {
          client.close();
        } catch {
          /* ignore */
        }
        const plain = new ftp.Client(90_000);
        plain.ftp.verbose = false;
        await plain.access({ ...base, secure: false });
        return plain;
      }
      return client;
    } catch (err) {
      lastErr = err;
      try {
        client.close();
      } catch {
        /* ignore */
      }
      await new Promise((r) => setTimeout(r, 1200 * i));
    }
  }
  throw lastErr || new Error('FTP connect failed');
}

async function uploadTarget(target) {
  const all = [];
  collectFiles(distDir, distDir, all);
  const prev = forceFull ? {} : loadManifest(target.name);
  const hasManifest = !forceFull && Object.keys(prev).length > 0;

  // Cold start (no manifest): ONLY entry + JS/CSS bundles + API (skip images/fonts).
  // Warm: ship anything whose sha1 changed vs last successful deploy.
  const coldKeep = (rel) =>
    rel === 'index.html' ||
    rel === '.htaccess' ||
    rel.startsWith('api/') ||
    /\.(php|html)$/i.test(rel) ||
    (rel.startsWith('assets/') && /\.(js|css)$/i.test(rel));

  const changed = all.filter((f) => {
    if (!hasManifest) return coldKeep(f.rel);
    return prev[f.rel] !== f.hash;
  });

  const must = all.filter(
    (f) =>
      f.rel === 'index.html' ||
      f.rel === '.htaccess' ||
      f.rel.startsWith('api/') ||
      /\.(php|html)$/.test(f.rel),
  );
  const byRel = new Map();
  for (const f of [...changed, ...must]) byRel.set(f.rel, f);
  const queue = [...byRel.values()];

  console.log(
    `\n==== ${target.label} ====`,
  );
  console.log(`Delta: ${queue.length} changed / ${all.length} total${forceFull ? ' (FULL)' : ''}`);

  if (queue.length === 0) {
    console.log('Nothing to upload.');
    await verifyLiveSite(target.url);
    return;
  }

  const remoteRoot = (target.dir.startsWith('/') ? target.dir : `/${target.dir}`).replace(/\/$/, '') || '';
  let client = await openClient(target);
  const readyDirs = new Set();
  const nextManifest = { ...prev };
  let sent = 0;
  try {
    for (const file of queue) {
      const remotePath = `${remoteRoot}/${file.rel}`.replace(/\/{2,}/g, '/');
      const parent = path.posix.dirname(remotePath);
      let attempts = 0;
      while (attempts < 5) {
        try {
          if (!readyDirs.has(parent)) {
            await client.ensureDir(parent);
            readyDirs.add(parent);
          }
          await client.uploadFrom(file.full, remotePath);
          nextManifest[file.rel] = file.hash;
          sent += 1;
          if (sent % 20 === 0 || sent === queue.length) {
            console.log(`  ${sent}/${queue.length}`);
          }
          break;
        } catch (err) {
          attempts += 1;
          console.warn(`  ${file.rel} retry ${attempts}: ${err.message}`);
          const baseName = path.posix.basename(remotePath);
          const tempPath = `${parent}/.in.${baseName}.`;
          try {
            await client.remove(tempPath);
          } catch {
            /* ignore */
          }
          try {
            client.close();
          } catch {
            /* ignore */
          }
          if (attempts >= 5) throw err;
          readyDirs.clear();
          await new Promise((r) => setTimeout(r, 1000 * attempts));
          client = await openClient(target);
        }
      }
    }
    // Keep hashes for unchanged files still present in dist
    for (const f of all) {
      if (!nextManifest[f.rel]) nextManifest[f.rel] = f.hash;
    }
    saveManifest(target.name, nextManifest);
    console.log(`Uploaded ${sent} files → ${target.label}`);
    await verifyLiveSite(target.url);
  } finally {
    try {
      client.close();
    } catch {
      /* ignore */
    }
  }
}

function bundleApiIntoDist() {
  const htaccessSource = path.join(rootDir, 'public', '.htaccess');
  const htaccessDist = path.join(distDir, '.htaccess');
  if (fs.existsSync(htaccessSource)) fs.copyFileSync(htaccessSource, htaccessDist);

  const publicApiDir = path.join(rootDir, 'public', 'api');
  const distApiDir = path.join(distDir, 'api');
  if (fs.existsSync(publicApiDir)) {
    fs.mkdirSync(distApiDir, { recursive: true });
    for (const name of [
      'index.php',
      'commerce.php',
      'live_extensions.php',
      'google_oauth.php',
      'session_lite.php',
      '.env',
    ]) {
      const src = path.join(publicApiDir, name);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distApiDir, name));
    }
  }
  for (const php of ['sitemap.php', 'robots.php', 'storefront-shell.php']) {
    const src = path.join(rootDir, 'public', php);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distDir, php));
  }
}

async function main() {
  if (!fs.existsSync(distDir)) {
    console.error('dist/ missing. Run: npm run build');
    process.exit(1);
  }
  bundleApiIntoDist();

  const ready = selected.map((n) => catalog[n]).filter(Boolean);
  if (!ready.length) {
    console.error('No FTP target. Check .env FTP_* credentials.');
    process.exit(1);
  }

  // Parallel hosts = half the wall time when deploying all
  await Promise.all(ready.map((t) => uploadTarget(t)));
  console.log('\nFast delta deploy finished.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
