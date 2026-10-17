import fs from 'fs';

const sm2 = fs.readFileSync('scripts/sitemap-2.xml', 'utf8');
const locs = (sm2.match(/<loc>(.*?)<\/loc>/g) || []).map(l => l.replace(/<\/?loc>/g, ''));

console.log('Sample raw locs from sitemap-2:');
locs.slice(0, 20).forEach((l, i) => console.log(`${i+1}: ${decodeURIComponent(l)}`));
