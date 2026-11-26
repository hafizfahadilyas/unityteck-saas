import fs from 'fs';
import path from 'path';

const site = 'https://giftshop-sa.com';
const h = await fetch(site + '/').then((r) => r.text());
const assets = [...h.matchAll(/src="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
console.log('live assets', assets.slice(0, 10));

const prodId = 'pd-prod-store-1-mwe8pmzx';
const p = await fetch(`${site}/api/products/${prodId}`, {
  headers: { 'X-Store-Id': 'store-1', Accept: 'application/json' },
}).then((r) => r.json());
console.log('description=', JSON.stringify(p.data?.description));
console.log('desc keys', Object.keys(p.data || {}).filter((k) => /desc/i.test(k)));

let foundCatalog = false;
let foundUseApi = false;
for (const a of assets) {
  const js = await fetch(site + a).then((r) => r.text());
  if (js.includes('storefront/catalog')) {
    console.log('catalog FOUND in', a, 'len', js.length);
    foundCatalog = true;
  }
  if (js.includes('VITE_USE_API') || /USE_API/.test(js.slice(0, 500))) {
    foundUseApi = true;
  }
  // Vite inlines import.meta.env.VITE_USE_API as "true"
  const trueHits = (js.match(/"true"/g) || []).length;
  if (a.includes('index-') && js.includes('/api')) {
    console.log(a, 'has /api', js.includes('/api'), 'storefront', js.includes('storefront'), 'catalog path parts', js.includes('storefront') && js.includes('catalog'));
  }
}
console.log({ foundCatalog, foundUseApi });

// Local dist check
const distAssets = path.resolve('dist/assets');
if (fs.existsSync(distAssets)) {
  const files = fs.readdirSync(distAssets).filter((f) => f.endsWith('.js'));
  for (const f of files) {
    const js = fs.readFileSync(path.join(distAssets, f), 'utf8');
    if (js.includes('storefront/catalog')) console.log('LOCAL dist has catalog in', f);
  }
  const index = files.find((f) => f.startsWith('index-'));
  if (index) {
    const js = fs.readFileSync(path.join(distAssets, index), 'utf8');
    console.log('local index', index, 'len', js.length, 'catalog', js.includes('storefront/catalog'), 'isApiEnabled PROD', js.includes('PROD'));
  }
}
