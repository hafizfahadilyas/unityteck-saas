import fs from 'fs';
import path from 'path';
import { HADAAYA_MAKKAH_PRODUCTS, COFFEE_STORE_PRODUCTS } from '../src/data/hadayaMeccaData';

function phpVal(v: any): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) {
    return '[' + v.map(phpVal).join(', ') + ']';
  }
  return JSON.stringify(String(v));
}

let phpCode = '<?php\n\nnamespace Database\\Seeders;\n\nreturn [\n';
for (const p of HADAAYA_MAKKAH_PRODUCTS) {
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

fs.writeFileSync(path.join(process.cwd(), 'apps/api/database/seeders/makkah_products.php'), phpCode, 'utf8');
console.log('Saved makkah_products.php with ' + HADAAYA_MAKKAH_PRODUCTS.length + ' products!');
