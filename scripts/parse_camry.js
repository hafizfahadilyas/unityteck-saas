import fs from 'fs';

const path = 'C:/Users/fahad/.gemini/antigravity/brain/7f186f52-e583-45d4-a653-6515ea018cb5/.system_generated/steps/169/content.md';
const content = fs.readFileSync(path, 'utf8');

const jsonLd = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
if (jsonLd) {
  jsonLd.forEach((j) => {
    try {
      const parsed = JSON.parse(j.replace(/<script type="application\/ld\+json">|<\/script>/g, ''));
      if (parsed['@graph']) {
        const prod = parsed['@graph'].find(x => x['@type'] === 'Product');
        if (prod) console.log('Product:', JSON.stringify(prod, null, 2));
      }
    } catch(e){}
  });
}

const imgs = content.match(/https:\/\/cdn\.salla\.sa\/wYYVD\/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)/g) || [];
console.log('Images:', [...new Set(imgs)]);
