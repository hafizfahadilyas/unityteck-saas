/**
 * Upload critical Laravel API PHP files to Hostinger (central + flowers).
 * Usage: node scripts/deploy-laravel-hotfiles.js --target=all
 */
import * as ftp from 'basic-ftp';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });

const targetArg = (process.argv.find((a) => a.startsWith('--target=')) || '--target=all')
  .split('=')[1]
  .toLowerCase();

/** Local path → remote path under Laravel app root (or public_html/../api laravel). */
const files = [
  {
    local: 'apps/api/app/Models/Store.php',
    remote: 'app/Models/Store.php',
  },
  {
    local: 'apps/api/app/Models/Product.php',
    remote: 'app/Models/Product.php',
  },
  {
    local: 'apps/api/app/Models/OrderItem.php',
    remote: 'app/Models/OrderItem.php',
  },
  {
    local: 'apps/api/app/Support/ProductStorefront.php',
    remote: 'app/Support/ProductStorefront.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/ProductController.php',
    remote: 'app/Http/Controllers/Api/ProductController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/OrderController.php',
    remote: 'app/Http/Controllers/Api/OrderController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreReviewsController.php',
    remote: 'app/Http/Controllers/Api/StoreReviewsController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreController.php',
    remote: 'app/Http/Controllers/Api/StoreController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/AuthController.php',
    remote: 'app/Http/Controllers/Api/AuthController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/AnalyticsReportController.php',
    remote: 'app/Http/Controllers/Api/AnalyticsReportController.php',
  },
  {
    local: 'apps/api/routes/api.php',
    remote: 'routes/api.php',
  },
  {
    local: 'apps/api/scripts/ensure-login-email-active-column.php',
    remote: 'scripts/ensure-login-email-active-column.php',
  },
  {
    local: 'apps/api/scripts/ensure-product-order-isolation-columns.php',
    remote: 'scripts/ensure-product-order-isolation-columns.php',
  },
];

function account(name, source) {
  if (!source.host || !source.user || !source.password) return null;
  return { name, ...source };
}

const catalog = {
  central: account('central', {
    label: 'Central Laravel',
    host: process.env.FTP_CENTRAL_HOST,
    user: process.env.FTP_CENTRAL_USER,
    password: process.env.FTP_CENTRAL_PASSWORD,
    // Prefer explicit Laravel dir; fallback to common Hostinger layouts.
    dir:
      process.env.FTP_CENTRAL_LARAVEL_DIR ||
      process.env.FTP_CENTRAL_API_LARAVEL_DIR ||
      '',
  }),
  flowers: account('flowers', {
    label: 'Flowers Laravel',
    host: process.env.FTP_FLOWERS_HOST || process.env.FTP_HOST,
    user: process.env.FTP_FLOWERS_USER || process.env.FTP_USER,
    password: process.env.FTP_FLOWERS_PASSWORD || process.env.FTP_PASSWORD,
    dir:
      process.env.FTP_FLOWERS_LARAVEL_DIR ||
      process.env.FTP_FLOWERS_API_LARAVEL_DIR ||
      '',
  }),
};

const selected = targetArg === 'all' ? ['central', 'flowers'] : [targetArg];

async function openClient(target) {
  const client = new ftp.Client(120000);
  try {
    await client.access({
      host: target.host,
      user: target.user,
      password: target.password,
      secure: true,
      secureOptions: { rejectUnauthorized: false },
    });
  } catch {
    client.close();
    const plain = new ftp.Client(120000);
    await plain.access({
      host: target.host,
      user: target.user,
      password: target.password,
      secure: false,
    });
    return plain;
  }
  return client;
}

async function tryUpload(client, remoteRoot, localAbs, remoteRel) {
  const remotePath = `${remoteRoot}/${remoteRel}`.replace(/\/{2,}/g, '/');
  const parent = path.posix.dirname(remotePath);
  await client.ensureDir(parent);
  await client.uploadFrom(localAbs, remotePath);
  console.log(`  uploaded ${remoteRel}`);
}

async function upload(target) {
  if (!target.dir) {
    console.warn(
      `\n==== ${target.label}: skip — set FTP_*_LARAVEL_DIR in .env (Laravel app root on Hostinger) ====`,
    );
    return;
  }
  const remoteRoot = (target.dir.startsWith('/') ? target.dir : `/${target.dir}`).replace(/\/$/, '');
  console.log(`\n==== ${target.label} → ${remoteRoot} ====`);
  const client = await openClient(target);
  try {
    for (const f of files) {
      const localAbs = path.join(root, f.local);
      if (!fs.existsSync(localAbs)) {
        console.warn(`  skip missing ${f.local}`);
        continue;
      }
      await tryUpload(client, remoteRoot, localAbs, f.remote);
    }
  } finally {
    client.close();
  }
}

for (const name of selected) {
  const t = catalog[name];
  if (!t) {
    console.warn(`skip ${name}: no FTP creds`);
    continue;
  }
  await upload(t);
}
console.log('\nLaravel hotfiles deploy done.');
