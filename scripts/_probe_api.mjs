import * as ftp from 'basic-ftp';
import fs from 'fs';

async function main() {
  const env = Object.fromEntries(
    fs.readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
      })
  );

  const client = new ftp.Client(30000);
  await client.access({
    host: env.FTP_CENTRAL_HOST,
    user: env.FTP_CENTRAL_USER,
    password: env.FTP_CENTRAL_PASSWORD,
    secure: false,
  });

  console.log('List /public_html/api:');
  try {
    const list = await client.list('/public_html/api');
    for (const item of list) {
      console.log('  ', item.type === 2 ? 'DIR' : 'FILE', item.name);
    }
  } catch (e) {
    console.log('Error listing /public_html/api:', e.message);
  }

  client.close();
}

main().catch(console.error);
