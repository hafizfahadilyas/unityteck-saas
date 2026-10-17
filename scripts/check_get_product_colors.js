import fs from 'fs';

const file = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');
console.log('Has getProductColors:', file.includes('getProductColors'));

const bak = fs.readFileSync('src/data/blecoStoreData.ts.bak', 'utf8');
console.log('Bak has getProductColors:', bak.includes('getProductColors'));
if (bak.includes('getProductColors')) {
  const m = bak.match(/export const getProductColors[\s\S]*?\n\};/);
  if (m) console.log(m[0]);
}
