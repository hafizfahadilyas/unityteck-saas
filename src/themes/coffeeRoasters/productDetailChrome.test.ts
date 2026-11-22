/**
 * Shared PDP chrome — All vs Specific scope.
 * Run: node --experimental-strip-types src/themes/coffeeRoasters/productDetailChrome.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  productDetailScopeApplies,
  resolveProductDetailChrome,
} from './productDetailChrome.ts';

const root = process.cwd();

const allScope = {
  enabled: true,
  applyScope: 'all' as const,
  productIds: [] as string[],
  showVideo: false,
  showSpecs: true,
  showFeatures: true,
  showWarranty: true,
  showFloatingBuy: true,
};

assert.equal(productDetailScopeApplies(allScope, 'hb-h10a-dualboiler'), true);
assert.equal(resolveProductDetailChrome(allScope, 'hb-h10a-dualboiler').showVideo, false);
assert.equal(resolveProductDetailChrome(allScope, 'other-sku').showVideo, false);

const specific = {
  enabled: true,
  applyScope: 'selected' as const,
  productIds: ['hb-h10a-dualboiler'],
  showVideo: false,
  showFeatures: false,
  showSpecs: true,
  showWarranty: true,
  showFloatingBuy: true,
};

assert.equal(productDetailScopeApplies(specific, 'hb-h10a-dualboiler'), true);
assert.equal(productDetailScopeApplies(specific, 'hb-other'), false);
assert.equal(resolveProductDetailChrome(specific, 'hb-h10a-dualboiler').showVideo, false);
assert.equal(resolveProductDetailChrome(specific, 'hb-h10a-dualboiler').showFeatures, false);
assert.equal(resolveProductDetailChrome(specific, 'hb-other').showVideo, true);
assert.equal(resolveProductDetailChrome(specific, 'hb-other').showFeatures, true);

const emptySelected = {
  enabled: true,
  applyScope: 'selected' as const,
  productIds: [] as string[],
  showVideo: false,
  showFeatures: true,
  showSpecs: true,
  showWarranty: true,
  showFloatingBuy: true,
};
assert.equal(productDetailScopeApplies(emptySelected, 'hb-h10a-dualboiler'), false);
assert.equal(resolveProductDetailChrome(emptySelected, 'hb-h10a-dualboiler').showVideo, true);

const disabled = { ...allScope, enabled: false };
assert.equal(productDetailScopeApplies(disabled, 'hb-h10a-dualboiler'), false);
assert.equal(resolveProductDetailChrome(disabled, 'hb-h10a-dualboiler').showVideo, true);

assert.ok(existsSync(join(root, 'src/components/store/themeSettings/coffee/CoffeeProductDetailPageForm.tsx')));
const form = readFileSync(
  join(root, 'src/components/store/themeSettings/coffee/CoffeeProductDetailPageForm.tsx'),
  'utf8',
);
assert.match(form, /data-pdp-scope=\{opt\.id\}/);
assert.match(form, /id: 'all'/);
assert.match(form, /id: 'selected'/);
assert.match(form, /data-pdp-picker/);

const catalog = readFileSync(
  join(root, 'src/components/store/themeCustomizer/coffeeCustomizerCatalog.ts'),
  'utf8',
);
assert.match(catalog, /id: 'C-PDP'/);

const sections = readFileSync(
  join(root, 'src/components/store/themeCustomizer/customizerPageSections.ts'),
  'utf8',
);
assert.match(sections, /C-PDP/);

const pdp = readFileSync(
  join(root, 'src/themes/coffeeRoasters/components/ProductDetailPage.tsx'),
  'utf8',
);
assert.match(pdp, /resolveProductDetailChrome/);
assert.match(pdp, /chrome\.showVideo/);

const modular = readFileSync(join(root, 'src/themes/settings/coffeeModularSettings.ts'), 'utf8');
assert.match(modular, /productDetail: ProductDetailPageSettings/);
assert.match(modular, /emptyProductDetailPage/);

console.log('productDetailChrome ok');
