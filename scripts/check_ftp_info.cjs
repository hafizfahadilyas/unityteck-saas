const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
for (const line of lines) {
  if (line.startsWith('FTP_')) {
    const [k, ...v] = line.split('=');
    const val = v.join('=').trim();
    if (k === 'FTP_PASSWORD') {
      console.log(k, 'length:', val.length, 'firstChar:', val[0], 'lastChar:', val[val.length-1]);
    } else {
      console.log(k, '=', val);
    }
  }
}
