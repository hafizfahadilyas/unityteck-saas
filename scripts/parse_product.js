import fs from 'fs';

const path = 'C:/Users/fahad/.gemini/antigravity/brain/7f186f52-e583-45d4-a653-6515ea018cb5/.system_generated/steps/127/content.md';
const content = fs.readFileSync(path, 'utf8');

// Check OpenGraph and JSON-LD
const ogTitle = content.match(/<meta property="og:title" content="([^"]+)"/)?.[1];
const ogDesc = content.match(/<meta property="og:description" content="([^"]+)"/)?.[1];
const ogImage = content.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
const jsonLd = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);

console.log('og:title:', ogTitle);
console.log('og:desc:', ogDesc);
console.log('og:image:', ogImage);

if (jsonLd) {
  jsonLd.forEach((j, i) => {
    const raw = j.replace(/<script type="application\/ld\+json">|<\/script>/g, '');
    try {
      const data = JSON.parse(raw);
      console.log(`JSON-LD ${i}:`, JSON.stringify(data, null, 2));
    } catch (e) {
      console.log(`JSON-LD ${i} (raw):`, raw.substring(0, 300));
    }
  });
}

// look for price, images, specifications
const imgs = content.match(/https:\/\/cdn\.salla\.sa\/[^\s"'<>]+/g) || [];
console.log('Images found:');
[...new Set(imgs)].forEach(img => console.log('IMG:', img));

