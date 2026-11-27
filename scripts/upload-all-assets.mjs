import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';

async function main() {
  const env = Object.fromEntries(
    fs.readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      })
  );

  const client = new ftp.Client(120000);
  client.ftp.verbose = false;

  console.log('Connecting to FTP for complete asset sync...');
  await client.access({
    host: env.FTP_CENTRAL_HOST,
    user: env.FTP_CENTRAL_USER,
    password: env.FTP_CENTRAL_PASSWORD,
    secure: false,
  });
  console.log('Connected.');

  // Pre-ensure directories
  await client.ensureDir('/assets');
  await client.ensureDir('/public_html/assets');

  const assets = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js') || f.endsWith('.css'));
  console.log(`Found ${assets.length} assets to check & upload...`);

  let count = 0;
  for (const asset of assets) {
    const local = path.join('dist/assets', asset);
    const localSize = fs.statSync(local).size;

    for (const prefix of ['', '/public_html']) {
      const remote = `${prefix}/assets/${asset}`;
      let exists = false;
      try {
        const remoteSize = await client.size(remote);
        if (remoteSize === localSize) {
          exists = true;
        }
      } catch {
        exists = false;
      }

      if (!exists) {
        let uploaded = false;
        let retries = 0;
        while (!uploaded && retries < 3) {
          try {
            await client.uploadFrom(local, remote);
            uploaded = true;
            count++;
          } catch (e) {
            retries++;
            console.warn(`Retry ${retries} for ${remote}: ${e.message}`);
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
    }

    if (count % 20 === 0 && count > 0) {
      console.log(`Uploaded ${count} new/updated files...`);
    }
  }

  // Also ensure critical HTML and bridge files are uploaded
  console.log('Uploading index.html and storefront-shell.php...');
  await client.uploadFrom('dist/index.html', '/index.html');
  await client.uploadFrom('dist/index.html', '/public_html/index.html');
  await client.uploadFrom('dist/storefront-shell.php', '/storefront-shell.php');
  await client.uploadFrom('dist/storefront-shell.php', '/public_html/storefront-shell.php');
  await client.uploadFrom('dist/.htaccess', '/.htaccess');
  await client.uploadFrom('dist/.htaccess', '/public_html/.htaccess');

  // Bridge
  await client.ensureDir('/souq-default');
  await client.uploadFrom('scripts/hostinger-souq-default-bridge/index.php', '/souq-default/index.php');
  await client.uploadFrom('scripts/hostinger-souq-default-bridge/.htaccess', '/souq-default/.htaccess');

  await client.ensureDir('/public_html/souq-default');
  await client.uploadFrom('scripts/hostinger-souq-default-bridge/index.php', '/public_html/souq-default/index.php');
  await client.uploadFrom('scripts/hostinger-souq-default-bridge/.htaccess', '/public_html/souq-default/.htaccess');

  client.close();
  console.log(`Finished! Total ${count} assets uploaded.`);
}

main().catch(console.error);
