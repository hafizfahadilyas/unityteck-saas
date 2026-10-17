import fs from 'fs';

const bleco = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');
const mapMatch = bleco.match(/export const CAR_MODELS_MAP:[\s\S]*?^};/m);
if (mapMatch) {
  console.log(mapMatch[0].substring(0, 1000));
}
