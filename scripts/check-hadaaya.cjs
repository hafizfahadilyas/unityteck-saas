const fs = require('fs');

const meccaData = fs.readFileSync('src/data/hadayaMeccaData.ts', 'utf8');

// Match products inside HADAAYA_MAKKAH_PRODUCTS
const match = meccaData.match(/export const HADAAYA_MAKKAH_PRODUCTS:\s*Product\[\]\s*=\s*\[([\s\S]*?)\];/);
if (!match) {
  console.log('HADAAYA_MAKKAH_PRODUCTS not found!');
  process.exit(1);
}

const block = match[1];
const ids = [];
const regex = /id:\s*'([^']+)'/g;
let m;
while ((m = regex.exec(block)) !== null) {
  ids.push(m[1]);
}

console.log('HADAAYA_MAKKAH_PRODUCTS count:', ids.length);
console.log('Product IDs:', ids);
