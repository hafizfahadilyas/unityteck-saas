const fs = require('fs');
const path = require('path');

const tsContent = fs.readFileSync(path.join(__dirname, '../src/data/hadayaMeccaData.ts'), 'utf8');

// Let's create a temporary JS file from hadayaMeccaData to require it
const jsReady = tsContent
  .replace(/import type \{ Product \} from '\.\.\/types';/, '')
  .replace(/: Product\[\]/g, '')
  .replace(/: MeccaHeroSlide\[\]/g, '')
  .replace(/export /g, '');

const vm = require('vm');
const context = {};
vm.createContext(context);
vm.runInContext(jsReady, context);

const products = context.HADAAYA_MAKKAH_PRODUCTS;
console.log('Total products loaded:', products.length);

function phpVal(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) {
    return '[' + v.map(phpVal).join(', ') + ']';
  }
  return JSON.stringify(String(v));
}

let phpCode = '<?php\n\nnamespace Database\\Seeders;\n\n// Seed array generated from hadayaMeccaData.ts\nreturn [\n';
for (const p of products) {
  phpCode += '    [\n';
  phpCode += '        \'id\' => ' + phpVal(p.id) + ',\n';
  phpCode += '        \'name\' => ' + phpVal(p.name) + ',\n';
  phpCode += '        \'name_ar\' => ' + phpVal(p.nameAr || p.name) + ',\n';
  phpCode += '        \'sku\' => ' + phpVal(p.sku) + ',\n';
  phpCode += '        \'category\' => ' + phpVal(p.category) + ',\n';
  phpCode += '        \'price\' => ' + Number(p.price) + ',\n';
  if (p.originalPrice) {
    phpCode += '        \'original_price\' => ' + Number(p.originalPrice) + ',\n';
  }
  if (p.costPrice) {
    phpCode += '        \'cost_price\' => ' + Number(p.costPrice) + ',\n';
  }
  phpCode += '        \'stock\' => ' + Number(p.stock || 20) + ',\n';
  phpCode += '        \'weight_kg\' => ' + Number(p.weightKg || 1.5) + ',\n';
  phpCode += '        \'image_url\' => ' + phpVal(p.image) + ',\n';
  phpCode += '        \'description\' => ' + phpVal(p.description || '') + ',\n';
  phpCode += '        \'gallery_urls\' => ' + phpVal(p.galleryUrls || [p.image]) + ',\n';
  phpCode += '        \'tags\' => ' + phpVal(p.tags || ['ورد طبيعي', 'هدايا مكة']) + ',\n';
  phpCode += '        \'seo_title\' => ' + phpVal(p.seoTitle || (p.name + ' | هدايا مكة')) + ',\n';
  phpCode += '        \'status\' => \'published\',\n';
  phpCode += '        \'is_active\' => true,\n';
  phpCode += '    ],\n';
}
phpCode += '];\n';

fs.writeFileSync(path.join(__dirname, '../apps/api/database/seeders/makkah_products.php'), phpCode, 'utf8');
console.log('Saved makkah_products.php successfully!');
