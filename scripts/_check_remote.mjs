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

  const checkPaths = ['/index.html', '/public_html/index.html'];
  for (const p of checkPaths) {
    try {
      const tmp = 'scripts/_temp_' + p.replace(/[\/\\]/g, '_');
      await client.downloadTo(tmp, p);
      const c = fs.readFileSync(tmp, 'utf8');
      const scripts = Array.from(c.matchAll(/src=["']([^"']+)["']/g)).map(m => m[1]);
      console.log(p, 'scripts:', scripts);
      fs.unlinkSync(tmp);
    } catch (e) {
      console.log(p, 'error:', e.message);
    }
  }

  // Also check souq-default index.php
  const subPaths = ['/souq-default/index.php', '/public_html/souq-default/index.php'];
  for (const p of subPaths) {
    try {
      const tmp = 'scripts/_temp_' + p.replace(/[\/\\]/g, '_');
      await client.downloadTo(tmp, p);
      const c = fs.readFileSync(tmp, 'utf8');
      console.log(p, 'exists, length:', c.length);
      fs.unlinkSync(tmp);
    } catch (e) {
      console.log(p, 'error:', e.message);
    }
  }

  client.close();
}

main().catch(console.error);
