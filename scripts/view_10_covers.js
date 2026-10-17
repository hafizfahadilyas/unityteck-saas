import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/parsed_seat_covers.json', 'utf8'));

console.log('--- 10 EXTRACTED REAL SEAT COVERS ---');
data.forEach((item, idx) => {
  console.log(`\n#${idx + 1}:`);
  console.log('Name:', item.prod.name);
  console.log('Price:', item.prod.offers?.price, item.prod.offers?.priceCurrency);
  console.log('Brand:', item.prod.brand?.name || item.prod.brand);
  console.log('SKU:', item.prod.sku);
  console.log('Image:', item.prod.image);
  console.log('Gallery Images:', item.imgs);
  console.log('Description:', item.prod.description?.substring(0, 100));
});
