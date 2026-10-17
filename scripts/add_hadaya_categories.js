import fs from 'fs';

const content = fs.readFileSync('src/data/hadayaMeccaData.ts', 'utf8');

const map = {
  'باقات الورود الطبيعية': { ar: 'باقات الورود الطبيعية', en: 'Natural Flower Bouquets' },
  'هدايا عيد الحب والرومانسية': { ar: 'هدايا عيد الحب والرومانسية', en: 'Valentine & Romance Gifts' },
  'فازات ورد طبيعي': { ar: 'فازات ورد طبيعي', en: 'Natural Flower Vases' },
  'هدايا رجالية ملكية': { ar: 'هدايا رجالية ملكية', en: "Royal Men's Gifts" },
  'هدايا الزواج والعرائس': { ar: 'هدايا الزواج والعرائس', en: 'Wedding & Bridal Gifts' },
  'باقات فاخرة': { ar: 'باقات فاخرة', en: 'Luxury Bouquets' },
  'ورد أبيض': { ar: 'ورد أبيض', en: 'White Roses' },
  'ورد أحمر': { ar: 'ورد أحمر', en: 'Red Roses' },
  'هدايا وخطوبة': { ar: 'هدايا وخطوبة', en: 'Gifts & Engagement' },
  'هدايا رومانسية': { ar: 'هدايا رومانسية', en: 'Romantic Gifts' },
  'ورد وشوكولاتة بلجيكية فاخرة': { ar: 'ورد وشوكولاتة بلجيكية فاخرة', en: 'Belgian Chocolate & Luxury Roses' },
  'ورد و شوكليت باتشي': { ar: 'ورد و شوكليت باتشي', en: 'Roses & Patchi Chocolate' },
  'ورد وشوكوليت بستاني': { ar: 'ورد وشوكوليت بستاني', en: 'Roses & Bostani Chocolate' },
  'عيد ميلاد': { ar: 'عيد ميلاد', en: 'Birthday Gifts' },
  'ورد مع كيك': { ar: 'ورد مع كيك', en: 'Roses with Cake' },
  'هدايا رجالية': { ar: 'هدايا رجالية', en: "Men's Gifts" },
  'تقديمة ورد مع قهوة وحلا': { ar: 'تقديمة ورد مع قهوة وحلا', en: 'Roses with Coffee & Sweets' },
  'لوحات مواجيب': { ar: 'لوحات مواجيب', en: 'Mawajib Wooden Plaques' },
  'هدايا المواليد': { ar: 'هدايا المواليد', en: 'Newborn Welcome Gifts' },
  'هدايا التخرج': { ar: 'هدايا التخرج', en: 'Graduation Milestones' },
  'هدايا نسائية': { ar: 'هدايا نسائية', en: "Luxury Women's Gifts" },
  'حبوب القهوة المختصة': { ar: 'حبوب القهوة المختصة', en: 'Specialty Coffee Beans' },
  'أدوات التحضير المقطرة': { ar: 'أدوات التحضير المقطرة', en: 'Drip Brewing Tools' },
  'معدات الإسبريسو': { ar: 'معدات الإسبريسو', en: 'Espresso Equipment' },
  'القهوة الباردة': { ar: 'القهوة الباردة', en: 'Cold Brew' }
};

let count = 0;
const updated = content.replace(/(category:\s*'([^']+)',)(\r?\n\s*productType:)/g, (match, catLine, catName, nextLine) => {
  if (map[catName]) {
    count++;
    const eol = nextLine.startsWith('\r\n') ? '\r\n' : '\n';
    return `${catLine}${eol}    categoryAr: '${map[catName].ar}',${eol}    categoryEn: '${map[catName].en}',${nextLine}`;
  }
  return match;
});

console.log('Replacements count:', count);
fs.writeFileSync('src/data/hadayaMeccaData.ts', updated, 'utf8');
console.log('Updated src/data/hadayaMeccaData.ts successfully');
