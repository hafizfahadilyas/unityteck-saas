/**
 * Upload Google OAuth API gateway files to reachable Hostinger FTP targets.
 * node scripts/deploy-google-api-fix.js
 */
import * as ftp from 'basic-ftp';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env'), quiet: true });

const files = ['index.php', 'commerce.php', 'live_extensions.php', 'google_oauth.php', 'session_lite.php', '.env'];

async function openClient(host, user, password) {
  const client = new ftp.Client(120000);
  client.ftp.verbose = false;
  try {
    await client.access({ host, user, password, secure: false });
  } catch {
    await client.access({
      host,
      user,
      password,
      secure: true,
      secureOptions: { rejectUnauthorized: false },
    });
  }
  return client;
}

async function uploadTo(label, host, user, password, dirs) {
  console.log(`\n→ ${label} @ ${host}`);
  let client;
  try {
    client = await openClient(host, user, password);
  } catch (err) {
    console.log(`  connect FAIL: ${err.message}`);
    return false;
  }
  try {
    for (const dir of dirs) {
      try {
        await client.ensureDir(dir);
      } catch (err) {
        console.log(`  ensure ${dir}: ${err.message}`);
        continue;
      }
      for (const name of files) {
        const local = path.join(rootDir, 'public', 'api', name);
        if (!fs.existsSync(local)) continue;
        const remote = `${dir.replace(/\/$/, '')}/${name}`;
        await client.uploadFrom(local, remote);
        console.log(`  uploaded ${remote}`);
      }
    }
    return true;
  } catch (err) {
    console.log(`  upload FAIL: ${err.message}`);
    return false;
  } finally {
    client.close();
  }
}

async function main() {
  const flowersHost = String(process.env.FTP_FLOWERS_HOST || process.env.FTP_HOST || '').trim();
  const flowersUser = String(process.env.FTP_FLOWERS_USER || process.env.FTP_USER || '').trim();
  const flowersPass = String(process.env.FTP_FLOWERS_PASSWORD || process.env.FTP_PASSWORD || '')
    .trim()
    .replace(/^"|"$/g, '');

  const centralUser = String(process.env.FTP_CENTRAL_USER || '').trim();
  const centralPass = String(process.env.FTP_CENTRAL_PASSWORD || '').trim();
  const centralHostEnv = String(process.env.FTP_CENTRAL_HOST || '').trim();

  let ok = 0;
  if (flowersHost && flowersUser && flowersPass) {
    if (await uploadTo('flowers/giftshop', flowersHost, flowersUser, flowersPass, ['/api', '/public_html/api'])) {
      ok += 1;
    }
  }

  const centralHosts = [
    centralHostEnv,
    'ftp.hostinger.com',
    flowersHost,
  ].filter(Boolean);

  for (const host of [...new Set(centralHosts)]) {
    if (!centralUser || !centralPass) break;
    if (await uploadTo(`central/${host}`, host, centralUser, centralPass, ['/api', '/public_html/api'])) {
      ok += 1;
      break;
    }
  }

  if (ok === 0) {
    console.error('\nNo FTP upload succeeded.');
    process.exit(1);
  }
  console.log(`\nDone (${ok} target(s)). Probe live /api/google/auth-url`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
