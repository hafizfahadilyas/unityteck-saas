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

  const client = new ftp.Client(60000);
  client.ftp.verbose = false;

  console.log('Connecting to Hostinger FTP...');
  await client.access({
    host: env.FTP_CENTRAL_HOST,
    user: env.FTP_CENTRAL_USER,
    password: env.FTP_CENTRAL_PASSWORD,
    secure: false,
  });
  console.log('Connected.');

  // 1. Upload root files
  for (const rootDir of ['/', '/public_html']) {
    console.log(`\n--- Uploading to ${rootDir} ---`);
    await client.cd(rootDir);
    await client.uploadFrom('dist/index.html', 'index.html');
    console.log(`  Uploaded ${rootDir}/index.html`);
    await client.uploadFrom('dist/storefront-shell.php', 'storefront-shell.php');
    console.log(`  Uploaded ${rootDir}/storefront-shell.php`);
    await client.uploadFrom('dist/.htaccess', '.htaccess');
    console.log(`  Uploaded ${rootDir}/.htaccess`);
  }

  // 2. Upload souq-default bridge
  for (const subDir of ['/souq-default', '/public_html/souq-default']) {
    console.log(`\n--- Uploading to ${subDir} ---`);
    await client.ensureDir(subDir);
    await client.cd(subDir);
    await client.uploadFrom('scripts/hostinger-souq-default-bridge/index.php', 'index.php');
    console.log(`  Uploaded ${subDir}/index.php`);
    await client.uploadFrom('scripts/hostinger-souq-default-bridge/.htaccess', '.htaccess');
    console.log(`  Uploaded ${subDir}/.htaccess`);
  }

  // 3. Upload all assets from dist/assets to /assets and /public_html/assets
  const allAssets = fs.readdirSync('dist/assets');
  console.log(`\n--- Checking and uploading ${allAssets.length} assets ---`);

  for (const assetsDir of ['/assets', '/public_html/assets']) {
    await client.ensureDir(assetsDir);
    await client.cd(assetsDir);
    const existingList = await client.list();
    const existingMap = new Map();
    for (const item of existingList) {
      existingMap.set(item.name, item.size);
    }

    let uploaded = 0;
    for (const file of allAssets) {
      const localPath = path.join('dist/assets', file);
      const localSize = fs.statSync(localPath).size;
      if (existingMap.get(file) !== localSize) {
        let ok = false;
        let attempts = 0;
        while (!ok && attempts < 3) {
          try {
            await client.uploadFrom(localPath, file);
            ok = true;
            uploaded++;
          } catch (e) {
            attempts++;
            console.warn(`Retry ${attempts} for ${file}: ${e.message}`);
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
    }
    console.log(`  Finished ${assetsDir}: uploaded ${uploaded} new/updated files.`);
  }

  client.close();
  console.log('\nFTP deployment complete!');

  // 4. Verify live response
  console.log('\n--- Verifying live response ---');
  const resp = await fetch('https://souq-default.mieraf-ksa.com/?store=souq-default');
  console.log('HTTP Status:', resp.status);
  const text = await resp.text();
  const title = text.match(/<title>(.*?)<\/title>/)?.[1];
  console.log('Title:', title);
  const m = text.match(/index-[A-Za-z0-9_-]+\.js/);
  console.log('Active JS Bundle:', m ? m[0] : 'NONE');

  if (m) {
    const jsResp = await fetch('https://mieraf-ksa.com/assets/' + m[0]);
    console.log('Bundle fetch status:', jsResp.status);
    const js = await jsResp.text();
    console.log('Bundle has Starter Featured Product:', js.includes('Starter Featured Product'));
    console.log('Bundle has theme-souq-common-retail:', js.includes('theme-souq-common-retail'));
  }
}

main().catch(console.error);
