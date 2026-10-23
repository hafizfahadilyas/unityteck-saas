const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

(async () => {
  const client = new ftp.Client(120000);
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: (process.env.FTP_PASSWORD || '').replace(/^['"]|['"]$/g, '').trim(),
      secure: false
    });
    console.log('Connected to Hostinger FTP!');
    await client.cd('/public_html');

    // 1. Upload api directory
    console.log('Uploading api directory to /public_html...');
    const apiDist = path.join(__dirname, '..', 'dist', 'api');
    if (fs.existsSync(apiDist)) {
      await client.uploadFromDir(apiDist, 'api');
      console.log('✅ api uploaded to /public_html!');
    }

    // 2. Upload favicon
    const favIco = path.join(__dirname, '..', 'public', 'favicon.ico');
    if (fs.existsSync(favIco)) {
      await client.uploadFrom(favIco, 'favicon.ico');
    }
    const favSvg = path.join(__dirname, '..', 'public', 'favicon.svg');
    if (fs.existsSync(favSvg)) {
      await client.uploadFrom(favSvg, 'favicon.svg');
    }

    // 3. Upload index.html & assets
    const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(distIndex)) {
      await client.uploadFrom(distIndex, 'index.html');
      console.log('✅ index.html uploaded!');
    }

    const distAssets = path.join(__dirname, '..', 'dist', 'assets');
    if (fs.existsSync(distAssets)) {
      console.log('Uploading latest dist/assets...');
      await client.uploadFromDir(distAssets, 'assets');
      console.log('✅ assets uploaded!');
    }

    console.log('🎉 Deployment to Hostinger completed successfully!');
  } catch (e) {
    console.error('Upload Error:', e);
  } finally {
    client.close();
  }
})();
