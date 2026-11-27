import * as ftp from 'basic-ftp';
import https from 'https';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function check() {
  const client = new ftp.Client(30000);
  try {
    await client.access({
      host: process.env.FTP_CENTRAL_HOST,
      user: process.env.FTP_CENTRAL_USER,
      password: process.env.FTP_CENTRAL_PASSWORD,
      secure: true,
      secureOptions: { rejectUnauthorized: false }
    });
    
    // Check if /public_html/assets/index-CUCxWf99.js exists
    const list = await client.list('/public_html/assets');
    const match = list.filter(x => x.name.startsWith('index-'));
    console.log('index files in /public_html/assets:', match.map(x => x.name + ' (' + x.size + 'B)'));

    // Check what /public_html/index.html imports
    const str = await new Promise(async (resolve) => {
      const Writable = (await import('stream')).Writable;
      let d = '';
      const w = new Writable({ write(chunk, enc, cb) { d += chunk; cb(); } });
      w.on('finish', () => resolve(d));
      await client.downloadTo(w, '/public_html/index.html');
    });
    const m = str.match(/assets\/index-[^.]+?\.js/);
    console.log('/public_html/index.html imports:', m ? m[0] : 'not found');
  } finally {
    client.close();
  }
}

check().catch(console.error);
