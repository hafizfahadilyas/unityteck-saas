import fs from 'fs';

const parsed = JSON.parse(fs.readFileSync('scripts/parsed_seat_covers.json', 'utf8'));

parsed.forEach((item, idx) => {
  const p = item.prod;
  const mainImg = p.image || item.imgs[0];
  console.log(`\n=== PRODUCT ${idx + 1} ===`);
  console.log('Name:', p.name);
  console.log('Price:', p.offers?.price);
  console.log('Brand:', p.brand?.name || p.brand);
  console.log('SKU:', p.sku);
  console.log('Main Image:', mainImg);
  console.log('Gallery Images (' + item.imgs.length + '):', item.imgs);
});
