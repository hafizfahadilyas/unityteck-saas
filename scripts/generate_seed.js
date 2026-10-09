import fs from 'fs';
import { HADAAYA_MAKKAH_PRODUCTS } from '../src/data/hadayaMeccaData.ts';

const categories = [
  { id: 'cat-nat-bouquets', slug: 'natural-bouquets', name: 'Natural Flower Bouquets', name_ar: 'باقات الورود الطبيعية', image_url: 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png' },
  { id: 'cat-roses-patchi', slug: 'roses-patchi', name: 'Roses & Patchi Chocolate', name_ar: 'ورد و شوكليت باتشي', image_url: 'https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png' },
  { id: 'cat-roses-bostani', slug: 'roses-bostani', name: 'Roses & Bostani Chocolate', name_ar: 'ورد وشوكوليت بستاني', image_url: 'https://cdn.salla.sa/form-builder/JEDxluyY7LbYdo5So7sLrPqqupntM3LUhIxV3gXD.png' },
  { id: 'cat-flower-vases', slug: 'flower-vases', name: 'Natural Flower Vases', name_ar: 'فازات ورد طبيعي', image_url: 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png' },
  { id: 'cat-vases-chocolate', slug: 'vases-chocolate', name: 'Flower Vases with Chocolate', name_ar: 'فازات الورود مع شوكليت', image_url: 'https://cdn.salla.sa/form-builder/qk6gpVW76xoVeFb6kZrmFFGOFOXQ4q8JalQmKw0R.png' },
  { id: 'cat-roses-fish', slug: 'roses-fish', name: 'Roses with Aquarium Fish', name_ar: 'ورود مع أسماك زينة', image_url: 'https://cdn.salla.sa/form-builder/ykMusuoNPFuZdMPHsJcYHJb6fejLSpaoSZxKGAwh.png' },
  { id: 'cat-roses-lovebirds', slug: 'roses-lovebirds', name: 'Roses with Lovebirds', name_ar: 'ورود مع عصافير الحب', image_url: 'https://cdn.salla.sa/form-builder/dZpSzihLrTks3koUrmlpfNV0AcHVSx3bE1KNFQTQ.png' },
  { id: 'cat-roses-coffee', slug: 'roses-coffee', name: 'Roses & Coffee Presentation', name_ar: 'تقديمة ورد وقهوة', image_url: 'https://cdn.salla.sa/form-builder/2fomvXwpTYOOx8h3JMZGP3r5dnXelUxxIUDuzepj.png' },
  { id: 'cat-roses-coffee-sweets', slug: 'roses-coffee-sweets', name: 'Roses with Coffee & Sweets', name_ar: 'تقديمة ورد مع قهوة وحلا', image_url: 'https://cdn.salla.sa/form-builder/zf3HeZ6jT4wON2ZEbeJfdMTc4bMLWQLkFvCndepr.png' },
  { id: 'cat-roses-cake', slug: 'roses-cake', name: 'Roses with Gourmet Cake', name_ar: 'ورد مع كيك', image_url: 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png' },
  { id: 'cat-korean-cake', slug: 'korean-cake', name: 'Korean Lunchbox Bento Cake', name_ar: 'تقديمة كيك الكوري', image_url: 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png' },
  { id: 'cat-mawajeeb', slug: 'mawajeeb', name: 'Mawajeeb Wooden Plaques & Heritage', name_ar: 'لوحات مواجيب وتراث حجازي', image_url: 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp' },
  { id: 'cat-newborn', slug: 'newborn', name: 'Newborn Welcome Gifts', name_ar: 'هدايا المواليد', image_url: 'https://cdn.salla.sa/form-builder/h7hTylc4cMiriSfxe2sGsX0mL5Sc7akjxHAAUqHp.png' },
  { id: 'cat-graduation', slug: 'graduation', name: 'Graduation Milestones', name_ar: 'هدايا التخرج', image_url: 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png' },
  { id: 'cat-valentine', slug: 'valentine', name: 'Valentine & Love Blooms', name_ar: 'هدايا عيد الحب', image_url: 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png' },
  { id: 'cat-wedding', slug: 'wedding', name: 'Wedding & Bridal Keepsakes', name_ar: 'هدايا الزواج والعرائس', image_url: 'https://cdn.salla.sa/form-builder/Z8aMbQ8cDkf9OnQakCZwnH4GvpnqLlXsCqBk70ik.png' },
  { id: 'cat-birthday', slug: 'birthday', name: 'Birthday Celebrations', name_ar: 'هدايا عيد ميلاد', image_url: 'https://cdn.salla.sa/form-builder/nm5BDgkXRslZvqTetu5wTrCTTTTLTrsBhWwjHMyI.png' },
  { id: 'cat-men-gifts', slug: 'men-gifts', name: 'Royal Men Luxury Gifts', name_ar: 'هدايا رجالية ملكية', image_url: '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg' },
  { id: 'cat-women-gifts', slug: 'women-gifts', name: 'Luxury Women Gifts & Perfumes', name_ar: 'هدايا نسائية فاخرة', image_url: 'https://cdn.files.salla.network/homepage/246985580/67a93505-20fe-4f5e-ad46-0e0b1d2c4390.webp' }
];

function escapeSql(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

function resolveCategory(p) {
  const text = ((p.category || '') + ' ' + (p.nameAr || '') + ' ' + (p.name || '') + ' ' + (p.id || '')).toLowerCase();
  
  if (text.includes('باتشي') || text.includes('patchi')) return categories.find(c => c.id === 'cat-roses-patchi');
  if (text.includes('بستاني') || text.includes('bostani')) return categories.find(c => c.id === 'cat-roses-bostani');
  if (text.includes('كوري') || text.includes('bento') || text.includes('korean')) return categories.find(c => c.id === 'cat-korean-cake');
  if (text.includes('كيك') || text.includes('cake') || text.includes('كب كيك')) return categories.find(c => c.id === 'cat-roses-cake');
  if (text.includes('حلا') || text.includes('sweets') || (text.includes('قهوة') && text.includes('حلا'))) return categories.find(c => c.id === 'cat-roses-coffee-sweets');
  if (text.includes('قهوة') || text.includes('coffee')) return categories.find(c => c.id === 'cat-roses-coffee');
  if (text.includes('سمك') || text.includes('أسماك') || text.includes('fish')) return categories.find(c => c.id === 'cat-roses-fish');
  if (text.includes('عصافير') || text.includes('birds') || text.includes('lovebirds')) return categories.find(c => c.id === 'cat-roses-lovebirds');
  if (text.includes('فاز') || text.includes('vase')) {
    if (text.includes('شوك') || text.includes('choc')) return categories.find(c => c.id === 'cat-vases-chocolate');
    return categories.find(c => c.id === 'cat-flower-vases');
  }
  if (text.includes('مواجيب') || text.includes('mawajeeb') || text.includes('تراث')) return categories.find(c => c.id === 'cat-mawajeeb');
  if (text.includes('مولود') || text.includes('مواليد') || text.includes('newborn')) return categories.find(c => c.id === 'cat-newborn');
  if (text.includes('تخرج') || text.includes('grad')) return categories.find(c => c.id === 'cat-graduation');
  if (text.includes('حب') || text.includes('valentine') || text.includes('رومانس')) return categories.find(c => c.id === 'cat-valentine');
  if (text.includes('زواج') || text.includes('عروس') || text.includes('wedding') || text.includes('bride')) return categories.find(c => c.id === 'cat-wedding');
  if (text.includes('ميلاد') || text.includes('birthday')) return categories.find(c => c.id === 'cat-birthday');
  if (text.includes('نساء') || text.includes('نسائية') || text.includes('women')) return categories.find(c => c.id === 'cat-women-gifts');
  if (text.includes('رجالي') || text.includes('رجال') || text.includes('men')) return categories.find(c => c.id === 'cat-men-gifts');
  
  return categories.find(c => c.id === 'cat-nat-bouquets');
}

let catSql = `-- Categories (${categories.length} Real Makkah Flowers Categories)\n`;
catSql += `INSERT INTO \`categories\` (\`id\`,\`store_id\`,\`name\`,\`name_ar\`,\`slug\`,\`image_url\`,\`sort_order\`,\`is_active\`,\`created_at\`,\`updated_at\`) VALUES\n`;

const catValues = categories.map((c, idx) => {
  return `  (${escapeSql(c.id)}, 'store-1', ${escapeSql(c.name)}, ${escapeSql(c.name_ar)}, ${escapeSql(c.slug)}, ${escapeSql(c.image_url)}, ${idx + 1}, 1, NOW(), NOW())`;
});

catSql += catValues.join(',\n') + '\n';
catSql += `ON DUPLICATE KEY UPDATE\n  \`name\`=VALUES(\`name\`),\n  \`name_ar\`=VALUES(\`name_ar\`),\n  \`slug\`=VALUES(\`slug\`),\n  \`image_url\`=VALUES(\`image_url\`),\n  \`sort_order\`=VALUES(\`sort_order\`),\n  \`is_active\`=VALUES(\`is_active\`),\n  \`updated_at\`=VALUES(\`updated_at\`);\n\n`;

let prodSql = `-- Products (${HADAAYA_MAKKAH_PRODUCTS.length} Real Makkah Flowers & Luxury Gifts Products)\n`;
prodSql += `INSERT INTO \`products\` (\n  \`id\`,\`store_id\`,\`category_id\`,\`name\`,\`name_ar\`,\`slug\`,\`sku\`,\`category\`,\`category_ar\`,\`price\`,\`original_price\`,\`cost_price\`,\`stock\`,\`image_url\`,\`status\`,\`is_active\`,\`image_version\`,\`created_at\`,\`updated_at\`\n) VALUES\n`;

const prodValues = HADAAYA_MAKKAH_PRODUCTS.map(p => {
  const matchedCat = resolveCategory(p);
  const catId = matchedCat.id;
  const catName = matchedCat.name;
  const catNameAr = matchedCat.name_ar;
  const origPrice = p.originalPrice ? p.originalPrice.toFixed(2) : 'NULL';
  const costPrice = p.costPrice ? p.costPrice.toFixed(2) : 'NULL';
  return `  (${escapeSql(p.id)}, 'store-1', ${escapeSql(catId)}, ${escapeSql(p.name)}, ${escapeSql(p.nameAr || p.name)}, ${escapeSql(p.id)}, ${escapeSql(p.sku)}, ${escapeSql(catName)}, ${escapeSql(catNameAr)}, ${p.price.toFixed(2)}, ${origPrice}, ${costPrice}, ${p.stock || 25}, ${escapeSql(p.image)}, 'published', 1, '1', NOW(), NOW())`;
});

prodSql += prodValues.join(',\n') + '\n';
prodSql += `ON DUPLICATE KEY UPDATE\n  \`category_id\`=VALUES(\`category_id\`),\n  \`name\`=VALUES(\`name\`),\n  \`name_ar\`=VALUES(\`name_ar\`),\n  \`slug\`=VALUES(\`slug\`),\n  \`sku\`=VALUES(\`sku\`),\n  \`category\`=VALUES(\`category\`),\n  \`category_ar\`=VALUES(\`category_ar\`),\n  \`price\`=VALUES(\`price\`),\n  \`original_price\`=VALUES(\`original_price\`),\n  \`cost_price\`=VALUES(\`cost_price\`),\n  \`stock\`=VALUES(\`stock\`),\n  \`image_url\`=VALUES(\`image_url\`),\n  \`status\`=VALUES(\`status\`),\n  \`is_active\`=VALUES(\`is_active\`),\n  \`updated_at\`=VALUES(\`updated_at\`);\n`;

fs.writeFileSync('database/hostinger/generated_catalog_seed.sql', catSql + '\n' + prodSql, 'utf8');
console.log('Successfully generated catalog seed with', categories.length, 'categories and', HADAAYA_MAKKAH_PRODUCTS.length, 'products.');
