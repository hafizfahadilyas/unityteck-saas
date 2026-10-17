import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/parsed_seat_covers.json', 'utf8'));
const urls = [];
data.forEach(d => {
  if (d.prod.image) urls.push({ url: d.prod.image, prod: d.prod.name });
  if (d.imgs) d.imgs.forEach(i => urls.push({ url: i, prod: d.prod.name }));
});

console.log('Total entries:', urls.length);
const seen = new Set();
urls.forEach((u, idx) => {
  if (!seen.has(u.url)) {
    seen.add(u.url);
    console.log(`${seen.size}. [${u.prod.substring(0, 35)}...] -> ${u.url}`);
  }
});
