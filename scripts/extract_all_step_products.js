import fs from 'fs';
import path from 'path';

const stepsDir = 'C:/Users/fahad/.gemini/antigravity/brain/7f186f52-e583-45d4-a653-6515ea018cb5/.system_generated/steps';
const allSteps = fs.readdirSync(stepsDir);

const allProducts = [];

for (const s of allSteps) {
  const p = path.join(stepsDir, s, 'content.md');
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, 'utf8');

  // Look for application/ld+json
  const jsonLd = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (jsonLd) {
    jsonLd.forEach((j) => {
      try {
        const cleaned = j.replace(/<script type="application\/ld\+json">|<\/script>/g, '');
        const parsed = JSON.parse(cleaned);
        const graph = parsed['@graph'] || [parsed];
        graph.forEach(item => {
          if (item['@type'] === 'Product') {
            const imgs = [...new Set(content.match(/https:\/\/cdn\.salla\.sa\/wYYVD\/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)/g) || [])];
            allProducts.push({
              step: s,
              name: item.name,
              sku: item.sku,
              price: item.offers?.price,
              currency: item.offers?.priceCurrency,
              brand: item.brand?.name || item.brand,
              image: item.image,
              gallery: imgs.filter(img => !img.includes('hDQA2Sdhq57Pu48SLcQHt8CGC8jfeqgm4wf6ZWZK') && !img.includes('OZbzrkkW0icMZlcDNOiZnU4PSjwq6WxXgCkwT0PQ')),
              description: item.description,
            });
          }
        });
      } catch (e) {}
    });
  }
}

console.log(`Found ${allProducts.length} total products from steps!`);
allProducts.forEach((prod, i) => {
  console.log(`${i + 1}. [Step ${prod.step}] ${prod.name} | Price: ${prod.price} | Brand: ${prod.brand} | Gallery: ${prod.gallery.length}`);
});

fs.writeFileSync('scripts/extracted_step_products.json', JSON.stringify(allProducts, null, 2), 'utf8');
