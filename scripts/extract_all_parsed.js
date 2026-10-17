import fs from 'fs';

const steps = [87, 127, 169, 175, 177, 179, 181];
const prods = [];

for (const s of steps) {
  const p = `C:/Users/fahad/.gemini/antigravity/brain/7f186f52-e583-45d4-a653-6515ea018cb5/.system_generated/steps/${s}/content.md`;
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, 'utf8');
  const jsonLd = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (jsonLd) {
    jsonLd.forEach((j) => {
      try {
        const parsed = JSON.parse(j.replace(/<script type="application\/ld\+json">|<\/script>/g, ''));
        if (parsed['@graph']) {
          const prod = parsed['@graph'].find(x => x['@type'] === 'Product');
          if (prod) {
            // also get images
            const imgs = [...new Set(content.match(/https:\/\/cdn\.salla\.sa\/wYYVD\/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)/g) || [])];
            prods.push({ prod, imgs: imgs.filter(img => !img.includes('hDQA2Sdhq57Pu48SLcQHt8CGC8jfeqgm4wf6ZWZK') && !img.includes('OZbzrkkW0icMZlcDNOiZnU4PSjwq6WxXgCkwT0PQ')) });
          }
        }
      } catch(e){}
    });
  }
}

console.log(`Extracted ${prods.length} products:`);
prods.forEach((item, idx) => {
  console.log(`\n--- Product ${idx+1} ---`);
  console.log('Name:', item.prod.name);
  console.log('Price:', item.prod.offers?.price, item.prod.offers?.priceCurrency);
  console.log('Brand:', item.prod.brand?.name);
  console.log('SKU:', item.prod.sku);
  console.log('Image:', item.prod.image || item.imgs[0]);
  console.log('Gallery:', item.imgs.slice(0, 3));
});
