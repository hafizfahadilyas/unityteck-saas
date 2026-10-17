import fs from 'fs';

const sm1 = fs.readFileSync('scripts/sitemap-1.xml', 'utf8');
const sm2 = fs.readFileSync('scripts/sitemap-2.xml', 'utf8');
const all = sm1 + sm2;
const locs = all.match(/<loc>(https:\/\/tanjeedmakkah\.com\/[^<]+)<\/loc>/g) || [];
const decoded = locs.map(l => decodeURIComponent(l.replace(/<\/?loc>/g, '')));
const seatCoverUrls = decoded.filter(u => u.includes('/p') && (u.includes('تلبيس') || u.includes('تنجيد') || u.includes('مقاعد') || u.includes('مراتب')));

// Map models to company
const modelToBrand = {
  // Toyota
  'كامري': 'Toyota', 'Camry': 'Toyota',
  'كورولا': 'Toyota', 'Corolla': 'Toyota',
  'لاند-كروزر': 'Toyota', 'Land Cruiser': 'Toyota',
  'برادو': 'Toyota', 'Prado': 'Toyota',
  'هايلوكس': 'Toyota', 'Hilux': 'Toyota',
  'راف-فور': 'Toyota', 'RAV4': 'Toyota',
  'افالون': 'Toyota', 'Avalon': 'Toyota',
  'انوفا': 'Toyota', 'Innova': 'Toyota',
  'يارس': 'Toyota', 'Yaris': 'Toyota',
  'فورتشنر': 'Toyota', 'Fortuner': 'Toyota',
  'كورولا-كروس': 'Toyota', 'Corolla Cross': 'Toyota',
  'راش': 'Toyota', 'Rush': 'Toyota',
  'افجي': 'Toyota', 'FJ Cruiser': 'Toyota',
  'هايلاند': 'Toyota', 'Highlander': 'Toyota',
  'هايلندر': 'Toyota',
  'فيلوز': 'Toyota', 'Veloz': 'Toyota',

  // Hyundai
  'النترا': 'Hyundai', 'Elantra': 'Hyundai',
  'سوناتا': 'Hyundai', 'Sonata': 'Hyundai',
  'توسان': 'Hyundai', 'Tucson': 'Hyundai',
  'اكسنت': 'Hyundai', 'Accent': 'Hyundai',
  'سنتافي': 'Hyundai', 'Santa Fe': 'Hyundai',
  'ازيرا': 'Hyundai', 'Azera': 'Hyundai',
  'كريتا': 'Hyundai', 'Creta': 'Hyundai',
  'باليسايد': 'Hyundai', 'Palisade': 'Hyundai',

  // Ford
  'اكسبلورار': 'Ford', 'Explorer': 'Ford',
  'اكسبديشن': 'Ford', 'Expedition': 'Ford',
  'تورس': 'Ford', 'Taurus': 'Ford',
  'ايفرست': 'Ford', 'Everest': 'Ford',
  'فورد': 'Ford',

  // Honda
  'اكورد': 'Honda', 'Accord': 'Honda',
  'سيفيك': 'Honda', 'Civic': 'Honda',

  // Kia
  'سبورتاج': 'Kia', 'Sportage': 'Kia',
  'سيراتو': 'Kia', 'Cerato': 'Kia',
  'كارنيفال': 'Kia', 'Carnival': 'Kia',
  'اوبتما': 'Kia', 'Optima': 'Kia',
  'اوبتيما': 'Kia',
  'ks': 'Kia', 'K5': 'Kia',

  // Nissan
  'التيما': 'Nissan', 'Altima': 'Nissan',
  'اكس-ترايل': 'Nissan', 'X-Trail': 'Nissan',
  'اكستيرا': 'Nissan', 'Xterra': 'Nissan',
  'نيسان': 'Nissan',

  // GMC
  'جمس-يوكن': 'GMC', 'Yukon': 'GMC',

  // Mazda
  'مازدا': 'Mazda', 'Mazda 6': 'Mazda', 'Mazda CX9': 'Mazda', 'سكوبا': 'Mazda',

  // Chevrolet
  'ترافس': 'Chevrolet', 'Traverse': 'Chevrolet',
  'كابتيفا': 'Chevrolet', 'Captiva': 'Chevrolet',

  // Lexus
  'لكزس': 'Lexus',

  // Mitsubishi
  'باجيرو': 'Mitsubishi', 'Pajero': 'Mitsubishi',
  'اوتلاندر': 'Mitsubishi', 'Outlander': 'Mitsubishi',

  // Isuzu
  'ايسوزو': 'Isuzu', 'D-Max': 'Isuzu',
};

const brandModels = {};
seatCoverUrls.forEach(u => {
  const m = u.match(/مع-\(([^)]+)\)/) || u.match(/مع-([^(/-]+)/);
  const rawModel = m ? m[1] : 'unknown';
  const brand = modelToBrand[rawModel] || 'Other';
  if (!brandModels[brand]) brandModels[brand] = new Set();
  brandModels[brand].add(rawModel);
});

console.log('--- MODELS PER BRAND IN TANJEED MAKKAH ---');
let totalUniqueModels = 0;
for (const [b, models] of Object.entries(brandModels)) {
  console.log(`${b}: ${models.size} models ->`, [...models].join(', '));
  totalUniqueModels += models.size;
}
console.log('\nTOTAL UNIQUE CAR MODELS ACROSS STORE:', totalUniqueModels);
