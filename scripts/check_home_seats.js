import fs from 'fs';

const bleco = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');
const seatMatch = bleco.match(/export const FEATURED_HOME_SEATS: Product\[\] = \[([\s\S]*?)\];\s*\/\//);
if (seatMatch) {
  const ids = seatMatch[1].match(/id:\s*['"][^'"]+['"]/g);
  console.log('FEATURED_HOME_SEATS count:', ids ? ids.length : 0);
  if (ids) console.log(ids);
}
