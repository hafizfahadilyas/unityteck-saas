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

  console.log('List /:');
  const rootList = await client.list('/');
  for (const item of rootList) {
    console.log('  ', item.type === 2 ? 'DIR' : 'FILE', item.name);
  }

  try {
    console.log('\nList /domains:');
    const domList = await client.list('/domains');
    for (const item of domList) {
      console.log('  ', item.type === 2 ? 'DIR' : 'FILE', item.name);
    }
  } catch (e) {
    console.log('No /domains:', e.message);
  }

  try {
    console.log('\nList /public_html:');
    const pubList = await client.list('/public_html');
    for (const item of pubList) {
      if (item.type === 2 || item.name.includes('index') || item.name.includes('shell')) {
        console.log('  ', item.type === 2 ? 'DIR' : 'FILE', item.name);
      }
    }
  } catch (e) {
    console.log('No /public_html:', e.message);
  }

  client.close();
}

main().catch(console.error);
