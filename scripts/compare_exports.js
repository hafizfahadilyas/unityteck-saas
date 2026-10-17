import fs from 'fs';

const bak = fs.readFileSync('src/data/blecoStoreData.ts.bak', 'utf8');
const cur = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');

const bakExports = bak.match(/export\s+(const|interface|type)\s+([A-Za-z0-9_]+)/g) || [];
const curExports = cur.match(/export\s+(const|interface|type)\s+([A-Za-z0-9_]+)/g) || [];

console.log('Exports in bak but missing in cur:');
bakExports.forEach(e => {
  if (!curExports.includes(e)) {
    console.log('Missing:', e);
  }
});
