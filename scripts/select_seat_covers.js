import fs from 'fs';

const sm2 = fs.readFileSync('scripts/sitemap-2.xml', 'utf8');
const locs = (sm2.match(/<loc>(.*?)<\/loc>/g) || []).map(l => decodeURIComponent(l.replace(/<\/?loc>/g, '')));

const brands = [
  { brand: 'تويوتا', en: 'Toyota' },
  { brand: 'هيونداي', en: 'Hyundai' },
  { brand: 'جمس', en: 'GMC' },
  { brand: 'فورد', en: 'Ford' },
  { brand: 'هوندا', en: 'Honda' },
  { brand: 'نيسان', en: 'Nissan' },
  { brand: 'كيا', en: 'Kia' },
  { brand: 'لكزس', en: 'Lexus' },
  { brand: 'شيفروليه', en: 'Chevrolet' },
  { brand: 'مازدا', en: 'Mazda' }
];

const selected = [];
for (const b of brands) {
  const match = locs.find(l => l.includes(b.brand) && !selected.includes(l));
  if (match) {
    selected.push({ brand: b.brand, brandEn: b.en, url: match });
  }
}

console.log('Selected 10 products:');
selected.forEach((s, idx) => {
  console.log(`${idx + 1}. [${s.brandEn}] ${s.url}`);
});
