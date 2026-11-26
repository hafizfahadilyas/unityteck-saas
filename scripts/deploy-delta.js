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
  // Flowers FTP is usually already chrooted to public_html — use `/` so files land on web root
  // (using `/public_html` again creates a nested folder and SEO files never go live).
  dir: process.env.FTP_FLOWERS_DIR || process.env.FTP_REMOTE_DIR || '/',
  url: process.env.FTP_FLOWERS_URL || process.env.FTP_TARGET_URL || 'https://giftshop-sa.com/',
});

const catalog = { central, flowers };
const selected = requested === 'all' ? ['central', 'flowers'] : [requested];

function fileHash(fullPath) {
  const buf = fs.readFileSync(fullPath);
  return crypto.createHash('sha1').update(buf).digest('hex');
}

function collectFiles(dir, root, out) {
  let entries = [];
  try {
    if (!fs.existsSync(dir)) return;
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.warn(`  skip unreadable dir during collect: ${path.relative(root, dir)} (${err.message})`);
    return;
  }
  for (const entry of entries) {
    if (entry.name === 'coffee-theme-refs' || entry.name === 'pptx-studio-pack' || entry.name === 'robots.txt') continue;
    if (entry.name.endsWith('.sqlite') || entry.name.endsWith('.sqlite-journal')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!fs.existsSync(full)) continue;
      collectFiles(full, root, out);
      continue;
    }
    const rel = path.relative(root, full).split(path.sep).join('/');
    try {
      if (!fs.existsSync(full)) {
        console.warn(`  skip vanished during collect: ${rel}`);
        continue;
      }
      out.push({ full, rel, size: fs.statSync(full).size, hash: fileHash(full) });
    } catch (err) {
      console.warn(`  skip unreadable during collect: ${rel} (${err.message})`);
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
        if (target.name === 'flowers') {
          throw new Error('flowers_plain_ftp');
        }
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

function isCriticalRel(rel) {
  return (
    rel === 'index.html' ||
    rel === '.htaccess' ||
    rel === 'storefront-shell.php' ||
    (rel.startsWith('assets/') && /^assets\/index-[^/]+\.(js|css)$/i.test(rel))
  );
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
  // Re-verify disk right before queue (parallel/clean races used to skip index.html)
  const queue = [...byRel.values()].filter((f) => {
    if (fs.existsSync(f.full)) return true;
    if (isCriticalRel(f.rel)) {
      throw new Error(`Critical dist file missing before upload: ${f.rel}`);
    }
    console.warn(`  drop missing from queue: ${f.rel}`);
    return false;
  });

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
  // Only hashes we successfully upload (or already had from a prior real upload).
  // Never invent hashes for files that never left the laptop — that caused 404 SPA shells.
  const nextManifest = { ...prev };
  let sent = 0;

  const resetCwd = async () => {
    try {
      await client.cd(remoteRoot || '/');
    } catch {
      try {
        await client.cd('/');
      } catch {
        /* ignore */
      }
    }
  };

  try {
    await resetCwd();
    // Never leave a static robots.txt — it bypasses robots.php and can poison SEO for weeks via cache.
    try {
      const remoteRobots = `${remoteRoot}/robots.txt`.replace(/\/{2,}/g, '/');
      await client.remove(remoteRobots);
      console.log('  removed static robots.txt (robots.php is source of truth)');
    } catch {
      try {
        await client.remove('robots.txt');
        console.log('  removed static robots.txt from cwd');
      } catch {
        /* none */
      }
    }
    for (const file of queue) {
      const remotePath = `${remoteRoot}/${file.rel}`.replace(/\/{2,}/g, '/');
      const parent = path.posix.dirname(remotePath);
      let attempts = 0;
      while (attempts < 5) {
        try {
          if (!fs.existsSync(file.full)) {
            // Mid-upload AV/clean races: regenerate SPA .htaccess / public PHP from public/
            if (file.rel === '.htaccess') {
              writeCleanHtaccess(file.full);
            } else if (
              file.rel === 'storefront-shell.php' ||
              file.rel === 'sitemap.php' ||
              file.rel === 'robots.php' ||
              file.rel === 'llms.php' ||
              file.rel === 'seo-files.php'
            ) {
              const src = path.join(rootDir, 'public', file.rel);
              if (fs.existsSync(src)) {
                fs.mkdirSync(path.dirname(file.full), { recursive: true });
                fs.copyFileSync(src, file.full);
              }
            }
            if (!fs.existsSync(file.full)) {
              if (isCriticalRel(file.rel)) {
                throw new Error(`Critical dist file missing during upload: ${file.rel}`);
              }
              console.warn(`  skip missing local file: ${file.rel}`);
              break;
            }
          }
          if (!readyDirs.has(parent)) {
            await client.ensureDir(parent);
            // basic-ftp ensureDir leaves CWD inside that folder — absolute uploads then
            // land under nested paths and the SPA gets 404 for /assets/*.js
            await resetCwd();
            readyDirs.add(parent);
          }
          await client.uploadFrom(file.full, remotePath);
          nextManifest[file.rel] = file.hash;
          sent += 1;
          if (sent % 20 === 0 || sent === queue.length) {
            console.log(`  ${sent}/${queue.length}`);
            saveManifest(target.name, nextManifest);
          }
          break;
        } catch (err) {
          attempts += 1;
          console.warn(`  ${file.rel} retry ${attempts}: ${err.message}`);
          if (String(err.message || err).includes('ENOENT') && !fs.existsSync(file.full)) {
            console.warn(`  skip missing local file: ${file.rel}`);
            break;
          }
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
          await resetCwd();
        }
      }
    }
    // Drop manifest entries for files no longer in dist (stale hashes).
    const liveRels = new Set(all.map((f) => f.rel));
    for (const key of Object.keys(nextManifest)) {
      if (!liveRels.has(key)) delete nextManifest[key];
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

/** Strip Hostinger LiteShield captcha-drop block (causes site-wide 403 when quota is exceeded). */
function writeCleanHtaccess(destPath) {
  const htaccessSource = path.join(rootDir, 'public', '.htaccess');
  if (!fs.existsSync(htaccessSource)) return;
  let txt = fs.readFileSync(htaccessSource, 'utf8');
  txt = txt.replace(
    /### HOSTINGER LITESHIELD RECAPTCHA[\s\S]*?### HOSTINGER LITESHIELD RECAPTCHA, DO NOT REMOVE THIS LINE ###\s*/gi,
    '',
  );
  txt = txt.replace(/^\s*LsRecaptcha\s+\d+\s*$/gim, '');
  txt = txt.replace(/^\s*RewriteRule\s+\.\*\s+-\s+\[E=verifycaptcha:drop\]\s*$/gim, '');
  fs.writeFileSync(destPath, txt);
}

function bundleApiIntoDist() {
  const htaccessDist = path.join(distDir, '.htaccess');
  writeCleanHtaccess(htaccessDist);

  // Preserve legacy compatibility hashes & sync fallback rules with latest built hash
  const distAssets = path.join(distDir, 'assets');
  if (fs.existsSync(distAssets)) {
    const files = fs.readdirSync(distAssets);
    const mainJs = files.find((f) => /^index-[A-Za-z0-9_-]+\.js$/.test(f) && f !== 'index-DFJOKphv.js');
    const mainCss = files.find((f) => /^index-[A-Za-z0-9_-]+\.css$/.test(f) && f !== 'index-JfJHEEIZ.css');
    if (mainJs) {
      fs.copyFileSync(path.join(distAssets, mainJs), path.join(distAssets, 'index-DFJOKphv.js'));
    }
    if (mainCss) {
      fs.copyFileSync(path.join(distAssets, mainCss), path.join(distAssets, 'index-JfJHEEIZ.css'));
    }
    if (mainJs && mainCss && fs.existsSync(htaccessDist)) {
      let ht = fs.readFileSync(htaccessDist, 'utf8');
      ht = ht.replace(/RewriteRule \^assets\/index-\[\^\/\]\+\\\.js\$ \/assets\/index-[^.]+\.js/g, `RewriteRule ^assets/index-[^/]+\\.js$ /assets/${mainJs}`);
      ht = ht.replace(/RewriteRule \^assets\/index-\[\^\/\]\+\\\.css\$ \/assets\/index-[^.]+\.css/g, `RewriteRule ^assets/index-[^/]+\\.css$ /assets/${mainCss}`);
      fs.writeFileSync(htaccessDist, ht);
    }
  }

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
  for (const php of ['sitemap.php', 'robots.php', 'llms.php', 'storefront-shell.php', 'seo-files.php']) {
    const src = path.join(rootDir, 'public', php);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distDir, php));
  }
  const includesSrc = path.join(rootDir, 'public', 'includes');
  const includesDest = path.join(distDir, 'includes');
  if (fs.existsSync(includesSrc)) {
    fs.mkdirSync(includesDest, { recursive: true });
    for (const name of fs.readdirSync(includesSrc)) {
      const from = path.join(includesSrc, name);
      if (fs.statSync(from).isFile()) {
        fs.copyFileSync(from, path.join(includesDest, name));
      }
    }
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

  // Sequential hosts — parallel FTP + shared dist caused skip-missing / stale mobile SPA
  for (const t of ready) {
    await uploadTarget(t);
  }
  console.log('\nFast delta deploy finished.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
