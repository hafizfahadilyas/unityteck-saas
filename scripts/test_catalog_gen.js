import fs from 'fs';

// Read formatted top 10
const top10 = JSON.parse(fs.readFileSync('scripts/formatted_top_10.json', 'utf8'));

console.log('Top 10 count:', top10.length);

// Let's verify how many models are in CAR_MODELS_MAP
const bleco = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');
const brandsMatch = bleco.match(/export const CAR_BRANDS: CarBrandItem\[\] = \[([\s\S]*?)\];/);

console.log('Script loaded successfully.');
