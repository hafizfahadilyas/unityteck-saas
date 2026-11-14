/**
 * Fast upload: only Hostinger gateway PHP + env (AI media / auth lite).
 * Usage: node scripts/deploy-api-hotfiles.js --target=flowers|central|all
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

const files = [
  'index.php',
  'commerce.php',
  'live_extensions.php',
  'google_oauth.php',
  'session_lite.php',
  'master_phase1_ops.php',
];
// Only upload .env when explicitly requested — overwriting Hostinger DB host
// (localhost vs srvXXX) silently drops MySQL → SQLite and looks like data loss.
if (process.argv.includes('--with-env')) {
  files.push('.env');
}

function account(name, source) {
  if (!source.host || !source.user || !source.password) return null;
  return { name, ...source };
}

const catalog = {
  central: account('central', {
    label: 'Central',
    host: process.env.FTP_CENTRAL_HOST,
    user: process.env.FTP_CENTRAL_USER,
    password: process.env.FTP_CENTRAL_PASSWORD,
    dir: process.env.FTP_CENTRAL_DIR || '/',
  }),
  flowers: account('flowers', {
    label: 'Flowers',
    host: process.env.FTP_FLOWERS_HOST || process.env.FTP_HOST,
    user: process.env.FTP_FLOWERS_USER || process.env.FTP_USER,
    password: process.env.FTP_FLOWERS_PASSWORD || process.env.FTP_PASSWORD,
    dir: process.env.FTP_FLOWERS_DIR || process.env.FTP_REMOTE_DIR || '/',
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

async function upload(target) {
  const remoteRoot = (target.dir.startsWith('/') ? target.dir : `/${target.dir}`).replace(/\/$/, '') || '';
  const apiDir = `${remoteRoot}/api`.replace(/\/{2,}/g, '/');
  console.log(`\n==== ${target.label} hot API files → ${apiDir} ====`);
  const client = await openClient(target);
  try {
    await client.ensureDir(apiDir);
    for (const name of files) {
      const src = path.join(root, 'public', 'api', name);
      if (!fs.existsSync(src)) {
        console.warn(`skip missing ${name}`);
        continue;
      }
      const remote = `${apiDir}/${name}`.replace(/\/{2,}/g, '/');
      await client.uploadFrom(src, remote);
      console.log(`uploaded ${name}`);
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
console.log('\nHot API deploy done.');
