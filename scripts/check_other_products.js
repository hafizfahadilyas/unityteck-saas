import fs from 'fs';

const sm1 = fs.readFileSync('scripts/sitemap-1.xml', 'utf8');
const sm2 = fs.readFileSync('scripts/sitemap-2.xml', 'utf8');

const locs1 = (sm1.match(/<loc>(.*?)<\/loc>/g) || []).map(l => decodeURIComponent(l.replace(/<\/?loc>/g, '')));
const locs2 = (sm2.match(/<loc>(.*?)<\/loc>/g) || []).map(l => decodeURIComponent(l.replace(/<\/?loc>/g, '')));

const allLocs = [...new Set([...locs1, ...locs2])];

const categories = allLocs.filter(u => u.includes('/c'));
console.log('Categories count:', categories.length);
console.log('Categories sample:', categories.slice(0, 30));

const nonSeatCovers = allLocs.filter(u => u.includes('/p') && !u.includes('تلبيسة') && !u.includes('مقاعد') && !u.includes('مراتب'));
console.log('Non-seat-cover products:', nonSeatCovers);
