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

  const getClient = async () => {
    const client = new ftp.Client(60000);
    client.ftp.verbose = false;
    await client.access({
      host: env.FTP_CENTRAL_HOST,
      user: env.FTP_CENTRAL_USER,
      password: env.FTP_CENTRAL_PASSWORD,
      secure: false,
    });
    return client;
  };

  const safeUpload = async (localPath, remotePath) => {
    if (!fs.existsSync(localPath)) {
      console.warn('Local file does not exist:', localPath);
      return;
    }
    for (let attempt = 1; attempt <= 3; attempt++) {
      let client;
      try {
        client = await getClient();
        const dir = path.posix.dirname(remotePath);
        await client.ensureDir(dir);
        await client.uploadFrom(localPath, remotePath);
        console.log('✓ Uploaded:', remotePath, '(' + fs.statSync(localPath).size + ' bytes)');
        client.close();
        return;
      } catch (err) {
        if (client) {
          try { client.close(); } catch (_) {}
        }
        console.warn(`Attempt ${attempt} failed for ${remotePath}: ${err.message}`);
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  };

  // Find current index bundle in dist/
  const distHtml = fs.readFileSync('dist/index.html', 'utf8');
  const indexJsMatch = distHtml.match(/src=["'](\/assets\/index-[^"']+\.js)/);
  const indexCssMatch = distHtml.match(/href=["'](\/assets\/index-[^"']+\.css)/);
  const currentJsRel = indexJsMatch ? indexJsMatch[1].replace(/^\//, '') : null;
  const currentCssRel = indexCssMatch ? indexCssMatch[1].replace(/^\//, '') : null;

  console.log('Current HTML entry points:', { currentJsRel, currentCssRel });

  const filesToUpload = [
    { local: 'dist/index.html', remotes: ['/index.html', '/public_html/index.html'] },
    { local: 'dist/.htaccess', remotes: ['/.htaccess', '/public_html/.htaccess'] },
    { local: 'dist/storefront-shell.php', remotes: ['/storefront-shell.php', '/public_html/storefront-shell.php'] },
  ];

  if (currentJsRel) {
    filesToUpload.push({
      local: path.join('dist', currentJsRel),
      remotes: [`/${currentJsRel}`, `/public_html/${currentJsRel}`],
    });
  }
  if (currentCssRel) {
    filesToUpload.push({
      local: path.join('dist', currentCssRel),
      remotes: [`/${currentCssRel}`, `/public_html/${currentCssRel}`],
    });
  }

  // Also include theme chunk and catalog chunk
  const distAssets = fs.readdirSync('dist/assets');
  const themeChunk = distAssets.find(f => f.startsWith('MeccaGiftsThemeView-'));
  if (themeChunk) {
    filesToUpload.push({
      local: path.join('dist/assets', themeChunk),
      remotes: [`/assets/${themeChunk}`, `/public_html/assets/${themeChunk}`],
    });
  }
  const catalogChunk = distAssets.find(f => f.startsWith('CatalogPage-'));
  if (catalogChunk) {
    filesToUpload.push({
      local: path.join('dist/assets', catalogChunk),
      remotes: [`/assets/${catalogChunk}`, `/public_html/assets/${catalogChunk}`],
    });
  }

  // Subdomain bridge files
  const bridgeIndex = 'scripts/hostinger-souq-default-bridge/index.php';
  const bridgeHtaccess = 'scripts/hostinger-souq-default-bridge/.htaccess';
  filesToUpload.push(
    { local: bridgeIndex, remotes: ['/souq-default/index.php', '/public_html/souq-default/index.php'] },
    { local: bridgeHtaccess, remotes: ['/souq-default/.htaccess', '/public_html/souq-default/.htaccess'] }
  );

  for (const item of filesToUpload) {
    for (const remote of item.remotes) {
      await safeUpload(item.local, remote);
    }
  }

  console.log('\nAll critical files uploaded successfully!');

  // Verify live responses
  console.log('\nVerifying live sites...');
  const mierafHtml = await fetch('https://mieraf-ksa.com/').then(r => r.text());
  console.log('https://mieraf-ksa.com/ has index-Ck-9Cb3x.js:', mierafHtml.includes('index-Ck-9Cb3x.js'));

  const souqHtml = await fetch('https://souq-default.mieraf-ksa.com/?store=souq-default').then(r => r.text());
  console.log('https://souq-default.mieraf-ksa.com/?store=souq-default has index-Ck-9Cb3x.js:', souqHtml.includes('index-Ck-9Cb3x.js'));
  const titleMatch = souqHtml.match(/<title>(.*?)<\/title>/)?.[1];
  console.log('souq-default title:', titleMatch);
}

main().catch(console.error);
