#!/usr/bin/env node
/**
 * Snapshot dist → temp, then resilient per-file FTP (flowers + central).
 * Avoids ENOENT when another clean-dist races, and clears Hostinger .in.* temps.
 */
import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { acquireDeployLock } from './deploy-lock.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });
const release =
  process.env.SOUQ_SKIP_DEPLOY_LOCK === '1'
    ? () => {}
    : acquireDeployLock('hot-checkout-ui');

try {
  const dist = path.join(root, 'dist');
  const assetsDir = path.join(dist, 'assets');
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    console.error('dist/index.html missing — run vite build first');
    process.exit(1);
  }

  function pick(re) {
    return fs
      .readdirSync(assetsDir)
      .filter((f) => re.test(f))
      .sort()
      .pop();
  }

  const indexJs = pick(/^index-(?!latest).+\.js$/);
  const indexCss = pick(/^index-(?!latest).+\.css$/);
  if (!indexJs || !indexCss) {
    console.error('missing index bundle');
    process.exit(1);
  }

  const only =
    (process.argv.find((a) => a.startsWith('--target=')) || '')
      .split('=')[1]
      ?.toLowerCase() || process.env.SOUQ_HOT_TARGETS || 'all';

  const themeRe =
    only === 'flowers'
      ? /^(MeccaGiftsThemeView-)/
      : /^(MeccaGiftsThemeView-|CheckoutPage-|CoffeeRoastersThemeView-|SaudiaTransportThemeView-)/;
  const themeChunks = fs.readdirSync(assetsDir).filter((f) => themeRe.test(f));

  const snap = fs.mkdtempSync(path.join(os.tmpdir(), 'souq-checkout-ui-'));
  const snapAssets = path.join(snap, 'assets');
  fs.mkdirSync(snapAssets, { recursive: true });
  fs.copyFileSync(path.join(dist, 'index.html'), path.join(snap, 'index.html'));
  fs.copyFileSync(path.join(assetsDir, indexJs), path.join(snapAssets, indexJs));
  fs.copyFileSync(path.join(assetsDir, indexCss), path.join(snapAssets, indexCss));
  fs.copyFileSync(path.join(assetsDir, indexJs), path.join(snapAssets, 'index-latest-bundle.js'));
  fs.copyFileSync(path.join(assetsDir, indexCss), path.join(snapAssets, 'index-latest-bundle.css'));
  for (const f of themeChunks) {
    fs.copyFileSync(path.join(assetsDir, f), path.join(snapAssets, f));
  }

  const files = [
    { local: path.join(snap, 'index.html'), remote: 'index.html' },
    { local: path.join(snapAssets, indexJs), remote: `assets/${indexJs}` },
    { local: path.join(snapAssets, indexCss), remote: `assets/${indexCss}` },
    { local: path.join(snapAssets, 'index-latest-bundle.js'), remote: 'assets/index-latest-bundle.js' },
    { local: path.join(snapAssets, 'index-latest-bundle.css'), remote: 'assets/index-latest-bundle.css' },
    ...themeChunks.map((f) => ({
      local: path.join(snapAssets, f),
      remote: `assets/${f}`,
    })),
  ].sort((a, b) => fs.statSync(a.local).size - fs.statSync(b.local).size);

  const allTargets = [
    {
      name: 'central',
      host: process.env.FTP_CENTRAL_HOST,
      user: process.env.FTP_CENTRAL_USER,
      password: process.env.FTP_CENTRAL_PASSWORD,
      dir: process.env.FTP_CENTRAL_DIR || '/',
    },
    {
      name: 'flowers',
      host: process.env.FTP_FLOWERS_HOST || process.env.FTP_HOST,
      user: process.env.FTP_FLOWERS_USER || process.env.FTP_USER,
      password: process.env.FTP_FLOWERS_PASSWORD || process.env.FTP_PASSWORD,
      dir: process.env.FTP_FLOWERS_DIR || process.env.FTP_REMOTE_DIR || '/',
    },
  ];
  const targets = allTargets.filter((t) => {
    if (!t.host || !t.user || !t.password) return false;
    if (only === 'all') return true;
    return only.split(',').includes(t.name);
  });

  async function openClient(t, preferPlain = false) {
    const tryAccess = async (secure) => {
      const client = new ftp.Client(300000);
      await client.access({
        host: t.host,
        user: t.user,
        password: t.password,
        secure,
        secureOptions: secure ? { rejectUnauthorized: false } : undefined,
      });
      return client;
    };
    if (preferPlain) {
      try {
        return await tryAccess(false);
      } catch {
        return await tryAccess(true);
      }
    }
    try {
      return await tryAccess(true);
    } catch {
      return await tryAccess(false);
    }
  }

  async function uploadOne(t, file) {
    let lastErr;
    for (let attempt = 1; attempt <= 6; attempt++) {
      const client = await openClient(t, attempt > 1 || t.name === 'flowers');
      try {
        // Match deploy-delta: when dir is `/` or `/public_html`, stay at FTP home (usually public_html).
        // `cd('/')` leaves the docroot and causes Hostinger 550 on assets.
        const remoteRoot =
          t.dir && t.dir !== '/' && t.dir !== '/public_html' ? t.dir.replace(/\/$/, '') : '';
        if (remoteRoot) {
          await client.cd(remoteRoot);
        }
        const base = path.posix.basename(file.remote);
        const dirPart = path.posix.dirname(file.remote);
        if (dirPart && dirPart !== '.') {
          // basic-ftp ensureDir already CWD into the folder — do NOT cd again
          // (second `cd assets` from inside assets → 550 No such file).
          await client.ensureDir(dirPart);
        }
        // Wipe Hostinger atomic leftovers (.in.*) that cause persistent 550.
        try {
          const listing = await client.list();
          for (const row of listing) {
            const n = String(row.name || '');
            if (n.startsWith('.in.') || n === `${base}.tmp` || n === `${base}.new`) {
              try {
                await client.remove(n);
              } catch {
                /* ignore */
              }
            }
          }
        } catch {
          /* ignore list failures */
        }
        const staging = `${base}.__uploading`;
        try {
          await client.remove(staging);
        } catch {
          /* ignore */
        }
        await client.uploadFrom(file.local, staging);
        try {
          await client.remove(base);
        } catch {
          /* ignore */
        }
        await client.rename(staging, base);
        client.close();
        return;
      } catch (e) {
        lastErr = e;
        try {
          client.close();
        } catch {
          /* ignore */
        }
        console.warn(`  retry ${attempt}/6 ${t.name} ${file.remote}: ${e.code || e.message}`);
        await new Promise((r) => setTimeout(r, 2500 * attempt));
      }
    }
    throw lastErr;
  }

  const must = new Set([
    'index.html',
    `assets/${indexJs}`,
    `assets/${indexCss}`,
    'assets/index-latest-bundle.js',
    'assets/index-latest-bundle.css',
  ]);
  let hardFail = 0;

  console.log('Bundles', { indexJs, indexCss, snap, files: files.length, targets: targets.map((t) => t.name) });

  for (const t of targets) {
    console.log(`\n==== ${t.name} ====`);
    for (const file of files) {
      try {
        await uploadOne(t, file);
        console.log('  ok', file.remote, `(${Math.round(fs.statSync(file.local).size / 1024)}kb)`);
      } catch (e) {
        console.error('  FAIL', file.remote, e.code || e.message);
        if (must.has(file.remote)) hardFail += 1;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    console.log(hardFail ? `DONE_WITH_FAILS ${t.name}` : `OK ${t.name}`);
  }

  console.log(hardFail ? `\nHOT CHECKOUT UI PARTIAL fails=${hardFail}` : '\nHOT CHECKOUT UI DONE');
  process.exitCode = hardFail ? 1 : 0;
} finally {
  release();
}
