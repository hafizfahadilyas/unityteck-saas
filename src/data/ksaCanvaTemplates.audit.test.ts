/**
 * Zero-mock audit for KSA Canva template pack.
 * Run: npx tsx src/data/ksaCanvaTemplates.audit.test.ts
 */
import {
  listCanvaTemplates,
  resolveCanvaLayerLabel,
  resolveStoreCanvaNiche,
} from './ksaCanvaTemplates';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const FAKE_PRICE_RE =
  /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*SAR\b|من\s*[٠-٩0-9]+|ر\.س\s*[٠-٩0-9]|[٠-٩0-9]+\s*ر\.س|Save\s+\d+|Extra\s+\d+%|\d+%\s*Off/i;

const FAKE_BRAND_RE = /\bHIBREW\b|\bMAKKAH FLOWERS\b|\bFlora Luxe\b|\bstore-1\b/i;

const pack = listCanvaTemplates();
assert(pack.length > 20, `expected full pack, got ${pack.length}`);

let priceLayers = 0;
let priceBound = 0;
let issues: string[] = [];

for (const tpl of pack) {
  if (tpl.sampleImageUrl) {
    issues.push(`${tpl.id}: sampleImageUrl must be empty (cross-tenant fake preview)`);
  }

  for (const [i, layer] of tpl.elements.entries()) {
    const en = layer.textEn || '';
    const ar = layer.textAr || '';
    const blob = `${en} ${ar}`;

    if (FAKE_PRICE_RE.test(blob) && layer.bind !== 'price') {
      issues.push(`${tpl.id}[${i}]: fake price copy without bind=price → "${en || ar}"`);
    }
    if (FAKE_BRAND_RE.test(blob) && layer.bind !== 'store') {
      issues.push(`${tpl.id}[${i}]: hardcoded brand → "${en || ar}"`);
    }

    if (layer.type === 'price') {
      priceLayers += 1;
      if (layer.bind === 'price') priceBound += 1;
      else issues.push(`${tpl.id}[${i}]: price layer missing bind=price`);
    }

    if (layer.bind === 'price' && (FAKE_PRICE_RE.test(en) || FAKE_PRICE_RE.test(ar))) {
      issues.push(`${tpl.id}[${i}]: price bind still has hardcoded SAR fallback`);
    }
  }

  // Banner / ads landscape: left text should not sit under product (x < 0.55 when product on right)
  if (
    (tpl.category === 'banner' || tpl.category === 'ads') &&
    tpl.width > tpl.height &&
    tpl.productPosPct.x >= 0.7 &&
    tpl.productPosPct.scale > 0
  ) {
    for (const [i, layer] of tpl.elements.entries()) {
      if (layer.type === 'shape' || layer.type === 'icon') continue;
      if ((layer.textAlign || 'center') === 'left' && layer.xPct > 0.45) {
        issues.push(
          `${tpl.id}[${i}]: left-aligned layer xPct=${layer.xPct} too far right (overlaps product zone)`,
        );
      }
    }
  }
}

assert(priceLayers === priceBound, `price layers ${priceLayers} vs bound ${priceBound}`);
assert(issues.length === 0, `audit issues:\n- ${issues.join('\n- ')}`);

// Dynamic resolve: empty product → no invented SAR
const emptyPrice = resolveCanvaLayerLabel(
  { type: 'price', bind: 'price', xPct: 0.5, yPct: 0.9, textEn: '', textAr: '' },
  { isAr: false, priceLabel: '' },
);
assert(emptyPrice === '', 'empty price must stay empty');

const livePrice = resolveCanvaLayerLabel(
  { type: 'price', bind: 'price', xPct: 0.5, yPct: 0.9, textEn: '199 SAR', textAr: '١٩٩ ر.س' },
  { isAr: false, priceLabel: '120 SAR' },
);
assert(livePrice === '120 SAR', 'live price wins over any leftover fallback');

const storeBind = resolveCanvaLayerLabel(
  { type: 'badge', bind: 'store', xPct: 0.5, yPct: 0.1, textEn: 'Store', textAr: 'المتجر' },
  { isAr: true, storeName: 'زهور مكة' },
);
assert(storeBind === 'زهور مكة', 'store bind must use live name');

const productBind = resolveCanvaLayerLabel(
  { type: 'headline', bind: 'product', xPct: 0.5, yPct: 0.5, textEn: 'Fallback', textAr: 'بديل' },
  { isAr: false, productName: 'Korean Bento Cake' },
);
assert(productBind === 'Korean Bento Cake', 'product bind must use live name');

// Niche isolation: coffee id ≠ flowers pack identity
assert(resolveStoreCanvaNiche({ id: 'store-coffee' }) === 'coffee', 'coffee niche');
assert(resolveStoreCanvaNiche({ id: 'store-1', name: 'Makkah Flowers' }) === 'flowers', 'flowers niche');
assert(resolveStoreCanvaNiche({ id: 'store-bleco', name: 'Bleco' }) === 'general', 'general niche');

console.log(
  `ksaCanvaTemplates.audit.test.ts OK — ${pack.length} templates, ${priceBound} price binds, 0 fake SAR/brand layers`,
);
