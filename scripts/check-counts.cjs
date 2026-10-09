const fs = require('fs');

const meccaData = fs.readFileSync('src/data/hadayaMeccaData.ts', 'utf8');
const themeData = fs.readFileSync('src/themes/meccaGifts/data/mockData.ts', 'utf8');

// Extract products from PRODUCTS in mockData.ts
// Match all objects with id: '...' and name: '...'
const themeProducts = [];
const regex = /id:\s*'([^']+)',\s*\n\s*name:\s*'([^']+)'/g;
let m;
while ((m = regex.exec(themeData)) !== null) {
  themeProducts.push({ id: m[1], name: m[2] });
}

console.log('Total Theme Products found:', themeProducts.length);
themeProducts.forEach((p, idx) => {
  console.log(`${idx + 1}. [${p.id}] ${p.name}`);
});
