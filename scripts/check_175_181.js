import fs from 'fs';

for (const s of [175, 181]) {
  const p = `C:/Users/fahad/.gemini/antigravity/brain/7f186f52-e583-45d4-a653-6515ea018cb5/.system_generated/steps/${s}/content.md`;
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, 'utf8');
  const title = content.match(/<title>([^<]+)<\/title>/)?.[1];
  const ogImg = content.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  const jsonLd = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  console.log(`Step ${s}: Title =`, title);
  console.log(`Step ${s}: og:image =`, ogImg);
  if (jsonLd) {
    jsonLd.forEach(j => {
      try {
        const parsed = JSON.parse(j.replace(/<script type="application\/ld\+json">|<\/script>/g, ''));
        console.log(`Step ${s} JSON-LD type:`, parsed['@type'] || (parsed['@graph'] ? 'graph' : 'unknown'));
        if (parsed['@type'] === 'Product' || parsed['@graph']) {
          console.log('Product data:', JSON.stringify(parsed, null, 2));
        }
      }catch(e){
        console.log('parse error:', e.message);
      }
    });
  }
}
