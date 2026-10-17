import fs from 'fs';

const cur = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');
const lines = cur.split('\n');
console.log(lines.slice(115, 140).join('\n'));
