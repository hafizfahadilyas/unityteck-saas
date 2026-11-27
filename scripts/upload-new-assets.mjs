import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';

async function uploadDirFiles(client, localDir, remoteDir) {
  await client.ensureDir(remoteDir);
  await client.cd(remoteDir);
  const files = fs.readdirSync(localDir);
  console.log(`Uploading ${files.length} files from ${localDir} to ${remoteDir}...`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const localPath = path.join(localDir, file);
    if (!fs.statSync(localPath).isFile()) continue;

    let success = false;
    let attempts = 0;
    while (!success && attempts < 3) {
      try {
        await client.uploadFrom(localPath, file);
        success = true;
      } catch (err) {
        attempts++;
        console.warn(`Retry ${attempts} for ${file}: ${err.message}`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if ((i + 1) % 25 === 0 || i === files.length - 1) {
      console.log(`  Progress: ${i + 1}/${files.length}`);
    }
  }
}

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

  // 1. Upload critical files first
  console.log('1. Uploading critical index and bridge files...');
  let c1 = await getClient();
  try {
    for (const root of ['/', '/public_html']) {
      await c1.cd(root);
      await c1.uploadFrom('dist/index.html', 'index.html');
      await c1.uploadFrom('dist/storefront-shell.php', 'storefront-shell.php');
      await c1.uploadFrom('dist/.htaccess', '.htaccess');
    }
    for (const sub of ['/souq-default', '/public_html/souq-default']) {
      await c1.ensureDir(sub);
      await c1.cd(sub);
      await c1.uploadFrom('scripts/hostinger-souq-default-bridge/index.php', 'index.php');
      await c1.uploadFrom('scripts/hostinger-souq-default-bridge/.htaccess', '.htaccess');
    }
  } finally {
    c1.close();
  }

  // 2. Upload /assets
  console.log('2. Uploading assets to /assets...');
  let c2 = await getClient();
  try {
    await uploadDirFiles(c2, 'dist/assets', '/assets');
  } finally {
    c2.close();
  }

  // 3. Upload /public_html/assets
  console.log('3. Uploading assets to /public_html/assets...');
  let c3 = await getClient();
  try {
    await uploadDirFiles(c3, 'dist/assets', '/public_html/assets');
  } finally {
    c3.close();
  }

  console.log('All uploads completed successfully!');
}

main().catch(console.error);
