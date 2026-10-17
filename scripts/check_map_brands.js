import fs from 'fs';

const bleco = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');
const mapMatch = bleco.match(/export const CAR_MODELS_MAP:[\s\S]*?^};/m);
if (mapMatch) {
  const content = mapMatch[0];
  const brands = content.match(/^\s*([a-z0-9_-]+):\s*\[/gm);
  console.log('Brands in CAR_MODELS_MAP:', brands);
}
