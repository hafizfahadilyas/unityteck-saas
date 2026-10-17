import fs from 'fs';

const sm2 = fs.readFileSync('scripts/sitemap-2.xml', 'utf8');
const locs = (sm2.match(/<loc>(.*?)<\/loc>/g) || []).map(l => decodeURIComponent(l.replace(/<\/?loc>/g, '')));

const queryList = ['تويوتا', 'كامري', 'كورولا', 'يارس', 'هايلوكس', 'هيونداي', 'النترا', 'اكسنت', 'سوناتا', 'هوندا', 'أكورد', 'اكورد', 'كيا', 'سيراتو', 'سبورتاج', 'شيفروليه', 'كابرس', 'تاهو', 'ترافرس', 'جمس', 'يوكن', 'فورد', 'اكسبديشن', 'نيسان', 'التيما', 'لكزس', 'مازدا'];

for (const q of queryList) {
  const matches = locs.filter(l => l.includes(q));
  console.log(`Query "${q}": found ${matches.length} products. Sample: ${matches[0] || 'none'}`);
}
