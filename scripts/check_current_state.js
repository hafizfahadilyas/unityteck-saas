import fs from 'fs';

const bleco = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');
const prodsMatch = bleco.match(/export const BLECO_PRODUCTS: Product\[\] = \[([\s\S]*?)\];/);
if (prodsMatch) {
  const ids = prodsMatch[1].match(/id:\s*['"][^'"]+['"]/g);
  console.log('Total BLECO_PRODUCTS currently:', ids ? ids.length : 0);
}

if (fs.existsSync('scripts/parsed_seat_covers.json')) {
  const parsed = JSON.parse(fs.readFileSync('scripts/parsed_seat_covers.json', 'utf8'));
  console.log('parsed_seat_covers.json count:', parsed.length);
}
