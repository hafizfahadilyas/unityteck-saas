/**
 * Upload souq-default subdomain bridge + central PHP host routing hotfiles.
 * DNS/subdomain must still be created in Hostinger hPanel (see console tip).
 */
import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(root, '.env');
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        let v = l.slice(i + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        return [l.slice(0, i).trim(), v];
      }),
  );
}

async function uploadFile(client, local, remote) {
  await client.uploadFrom(local, remote);
  console.log('UP', remote);
}

async function ensureDir(client, remoteDir) {
  await client.ensureDir(remoteDir);
  console.log('DIR', remoteDir);
}

async function main() {
  const env = loadEnv();
  const client = new ftp.Client(120000);
  client.ftp.verbose = false;
  await client.access({
    host: env.FTP_CENTRAL_HOST,
    user: env.FTP_CENTRAL_USER,
    password: env.FTP_CENTRAL_PASSWORD,
    secure: false,
  });

  // Prefer real web root (account /) which has storefront-shell.php
  try {
    await client.cd('/');
  } catch {
    /* stay */
  }
  console.log('PWD', await client.pwd());

  const bridgeLocal = path.join(__dirname, 'hostinger-souq-default-bridge');
  const targets = ['/souq-default', '/public_html/souq-default'];

  for (const remoteDir of targets) {
    try {
      await ensureDir(client, remoteDir);
      await uploadFile(
        client,
        path.join(bridgeLocal, 'index.php'),
        `${remoteDir}/index.php`,
      );
      await uploadFile(
        client,
        path.join(bridgeLocal, '.htaccess'),
        `${remoteDir}/.htaccess`,
      );
    } catch (e) {
      console.log('SKIP', remoteDir, String(e?.message || e));
    }
  }

  // Hot PHP routing (apex + subdomain host → correct store_id)
  const hot = [
    ['public/api/index.php', '/api/index.php'],
    ['public/api/commerce.php', '/api/commerce.php'],
    ['public/includes/souq-seo-mysql.php', '/includes/souq-seo-mysql.php'],
  ];
  for (const [localRel, remote] of hot) {
    const local = path.join(root, localRel);
    if (!fs.existsSync(local)) {
      console.log('MISS', localRel);
      continue;
    }
    try {
      await uploadFile(client, local, remote);
    } catch (e) {
      console.log('FAIL', remote, String(e?.message || e));
    }
  }

  // Also try public_html-prefixed paths used by some deploys
  for (const [localRel, remote] of hot) {
    const local = path.join(root, localRel);
    const alt = `/public_html${remote}`;
    try {
      await uploadFile(client, local, alt);
    } catch {
      /* optional */
    }
  }

  client.close();
  console.log(
    JSON.stringify(
      {
        ok: true,
        tip_en:
          'In Hostinger hPanel → Domains → Subdomains: create souq-default.mieraf-ksa.com with folder public_html/souq-default (or same as public_html). Wait DNS, then open https://souq-default.mieraf-ksa.com/',
        tip_ar:
          'في Hostinger: أنشئ النطاق الفرعي souq-default.mieraf-ksa.com ومجلد public_html/souq-default ثم انتظر DNS.',
        interim: 'https://mieraf-ksa.com/store/souq-default',
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error('FAIL', e?.message || e);
  process.exit(1);
});
