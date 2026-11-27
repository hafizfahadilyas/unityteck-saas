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

  console.log('Connecting to Central Hostinger FTP...');
  await client.access({
    host: env.FTP_CENTRAL_HOST,
    user: env.FTP_CENTRAL_USER,
    password: env.FTP_CENTRAL_PASSWORD,
    secure: false,
  });
  console.log('Connected successfully.');

  // 1. Upload Critical HTML, Shell, and Bridge
  const critical = [
    { local: 'dist/index.html', remotes: ['/index.html', '/public_html/index.html'] },
    { local: 'dist/storefront-shell.php', remotes: ['/storefront-shell.php', '/public_html/storefront-shell.php'] },
    { local: 'dist/.htaccess', remotes: ['/.htaccess', '/public_html/.htaccess'] },
    { local: 'scripts/hostinger-souq-default-bridge/index.php', remotes: ['/souq-default/index.php', '/public_html/souq-default/index.php'] },
    { local: 'scripts/hostinger-souq-default-bridge/.htaccess', remotes: ['/souq-default/.htaccess', '/public_html/souq-default/.htaccess'] },
  ];

  for (const item of critical) {
    for (const remote of item.remotes) {
      await client.ensureDir(path.posix.dirname(remote));
      await client.uploadFrom(item.local, remote);
      console.log('✓ Critical UP:', remote);
    }
  }

  // 2. Upload assets from dist/assets
  const allFiles = fs.readdirSync('dist/assets');
  console.log(`\nScanning ${allFiles.length} assets in dist/assets...`);

  for (const dir of ['/assets', '/public_html/assets']) {
    await client.ensureDir(dir);
    await client.cd(dir);
    const existing = await client.list();
    const existingMap = new Map(existing.map(e => [e.name, e.size]));

    let uploaded = 0;
    for (const f of allFiles) {
      const localPath = path.join('dist/assets', f);
      let stat;
      try {
        stat = fs.statSync(localPath);
      } catch (err) {
        continue;
      }
      if (!stat || !stat.isFile()) continue;

      if (existingMap.get(f) !== stat.size) {
        let ok = false;
        let attempts = 0;
        while (!ok && attempts < 3) {
          try {
            await client.uploadFrom(localPath, f);
            ok = true;
            uploaded++;
            console.log(`  Uploaded ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
          } catch (e) {
            attempts++;
            console.warn(`  Retry ${attempts} for ${f}: ${e.message}`);
            try {
              client.close();
            } catch (_) {}
            await new Promise(r => setTimeout(r, 1500));
            try {
              await client.access(ftpConfig);
              await client.cd(dir);
            } catch (err2) {
              console.warn(`  Reconnect failed: ${err2.message}`);
            }
          }
        }
      }
    }
    console.log(`✓ Uploaded ${uploaded} new/updated assets to ${dir}`);
  }

  client.close();
  console.log('\nDeployment finished! Testing live site...');

  // Verification
  const url = 'https://souq-default.mieraf-ksa.com/?store=souq-default';
  const html = await fetch(url).then(r => r.text());
  const m = html.match(/index-[A-Za-z0-9_-]+\.js/);
  console.log('Live HTML bundle:', m ? m[0] : 'NONE');

  if (m) {
    const bundleUrl = 'https://mieraf-ksa.com/assets/' + m[0];
    const bResp = await fetch(bundleUrl);
    console.log('Bundle HTTP Status:', bResp.status);
    const bText = await bResp.text();
    console.log('Bundle length:', bText.length);
    console.log('Has Starter Featured Product:', bText.includes('Starter Featured Product'));
    console.log('Has theme-souq-common-retail:', bText.includes('theme-souq-common-retail'));
  }
}

main().catch(console.error);
