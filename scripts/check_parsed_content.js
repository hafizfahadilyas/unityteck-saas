import fs from 'fs';

const content = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');

// Match TOP_10_SEAT_COVERS
const top10Match = content.match(/export const TOP_10_SEAT_COVERS: Product\[\] = (\[[\s\S]*?\]);\s*\/\//);
if (top10Match) {
  const top10 = JSON.parse(top10Match[1]);
  console.log('TOP_10_SEAT_COVERS count:', top10.length);
}

// Check models map
const modelsMapMatch = content.match(/export const CAR_MODELS_MAP: Record<string, CarModelDef\[\]> = (\{[\s\S]*?\n\};)/);
if (modelsMapMatch) {
  // count models
  const modelLines = content.match(/modelAr:\s*'[^']+'/g);
  console.log('Total car models mapped:', modelLines ? modelLines.length : 0);
}

console.log('Contains HOME_PAGE_PRODUCTS:', content.includes('export const HOME_PAGE_PRODUCTS: Product[] = BLECO_STORE_PRODUCTS.slice(0, 108);'));
console.log('Contains BLECO_STORE_PRODUCTS:', content.includes('export const BLECO_STORE_PRODUCTS: Product[] = generateFullCatalog();'));
