import fs from 'fs';

const top10 = JSON.parse(fs.readFileSync('scripts/formatted_top_10.json', 'utf8'));

// Verify that each of top10 has all required fields
console.log('Top 10 items:');
top10.forEach((p, i) => {
  console.log(`${i+1}. [${p.brand}] ${p.name.substring(0, 45)}... | SAR ${p.price} | Gallery: ${p.galleryUrls.length}`);
});
