import fs from 'fs';

const sm1 = fs.readFileSync('scripts/sitemap-1.xml', 'utf8');
const sm2 = fs.readFileSync('scripts/sitemap-2.xml', 'utf8');

const locs1 = (sm1.match(/<loc>(.*?)<\/loc>/g) || []).map(l => decodeURIComponent(l.replace(/<\/?loc>/g, '')));
const locs2 = (sm2.match(/<loc>(.*?)<\/loc>/g) || []).map(l => decodeURIComponent(l.replace(/<\/?loc>/g, '')));

const allLocs = [...new Set([...locs1, ...locs2])];
console.log('Total URLs:', allLocs.length);

const products = allLocs.filter(url => url.includes('/p') && !url.includes('/p/'));
console.log('Total product URLs:', products.length);

const mats = allLocs.filter(url => url.includes('أرضيات') || url.includes('ارضيات') || url.includes('دايموند') || url.includes('ليزر') || url.includes('مثلثات') || url.includes('AewApO'));
console.log('Mats related URLs:', mats);

const seatCovers = products.filter(url => url.includes('تلبيسة') || url.includes('مقاعد') || url.includes('مراتب'));
console.log('Seat covers count:', seatCovers.length);
console.log('Sample 15 seat covers:');
seatCovers.slice(0, 15).forEach((p, idx) => console.log(`${idx + 1}: ${p}`));
