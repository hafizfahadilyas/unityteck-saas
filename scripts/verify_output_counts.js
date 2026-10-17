import { BLECO_STORE_PRODUCTS, HOME_PAGE_PRODUCTS, TOP_10_SEAT_COVERS, CAR_BRANDS, CAR_MODELS_MAP } from '../src/data/blecoStoreData.js';

console.log('Total BLECO_STORE_PRODUCTS:', BLECO_STORE_PRODUCTS.length);
console.log('HOME_PAGE_PRODUCTS count:', HOME_PAGE_PRODUCTS.length);
console.log('TOP_10_SEAT_COVERS count:', TOP_10_SEAT_COVERS.length);

const brandCounts = {};
BLECO_STORE_PRODUCTS.forEach(p => {
  brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
});
console.log('Brand distribution:', brandCounts);

// Check image uniqueness and validity
const brokenImages = BLECO_STORE_PRODUCTS.filter(p => !p.image || p.image.includes('placeholder'));
console.log('Broken images count:', brokenImages.length);
