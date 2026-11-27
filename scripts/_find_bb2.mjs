import * as ftp from 'basic-ftp';
import fs from 'fs';

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

  const client = new ftp.Client(30000);
  await client.access({
    host: env.FTP_CENTRAL_HOST,
    user: env.FTP_CENTRAL_USER,
    password: env.FTP_CENTRAL_PASSWORD,
    secure: false,
  });

  const checkFiles = [
    '/index.html',
    '/public_html/index.html',
    '/storefront-shell.php',
    '/public_html/storefront-shell.php',
    '/souq-default/index.php',
    '/public_html/souq-default/index.php',
    '/souq/index.html',
    '/public_html/souq/index.html',
  ];

  for (const f of checkFiles) {
    try {
      const tmp = 'scripts/_tmp_search.txt';
      await client.downloadTo(tmp, f);
      const text = fs.readFileSync(tmp, 'utf8');
      const m = text.match(/index-[A-Za-z0-9_-]+\.js/);
      console.log(f, 'size:', text.length, 'has index js:', m ? m[0] : 'NONE');
      fs.unlinkSync(tmp);
    } catch (e) {
      console.log(f, 'not found or error:', e.message);
    }
  }

  client.close();
}

main().catch(console.error);
