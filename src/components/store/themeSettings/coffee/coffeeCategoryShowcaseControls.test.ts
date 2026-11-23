/**
 * CW-03 — Category Showcase: banners, products, layout helpers.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FeaturedCategoriesProductsSettings } from '../../../../themes/settings/coffeeModularSettings.ts';
import {
  CATEGORY_SHOWCASE_MAX_BANNERS,
  CATEGORY_SHOWCASE_MAX_PRODUCTS,
  blankShowcaseBanner,
  colsForDevice,
  resolveShowcaseCardChrome,
  resolveShowcaseProductIds,
  resolveShowcaseShopTarget,
  visibleShowcaseBanners,
} from '../../../../themes/coffeeRoasters/components/coffeeCategoryShowcaseLogic.ts';

const base: FeaturedCategoriesProductsSettings = {
  enabled: true,
  titleEn: 'Showcase',
  titleAr: 'عرض',
  banners: [
    blankShowcaseBanner({ id: 'b1', titleEn: 'A', image: 'https://cdn.example/a.jpg', enabled: true }),
    blankShowcaseBanner({ id: 'b2', titleEn: 'B', image: '', enabled: false }),
    blankShowcaseBanner({ id: 'b3', titleEn: '', titleAr: '', image: '', enabled: true }),
  ],
  productIds: ['p1', 'p2'],
  productSource: 'selected',
  productsPerRowDesktop: 5,
  productsPerRowTablet: 3,
  productsPerRowMobile: 2,
  buyLabelEn: 'Shop',
  buyLabelAr: 'تسوق',
  equalCardHeights: true,
  showMoreProducts: true,
  moreProductsUrl: 'products',
  maxVisibleProducts: 5,
  sections: [],
};

assert.equal(CATEGORY_SHOWCASE_MAX_BANNERS, 6);
assert.equal(CATEGORY_SHOWCASE_MAX_PRODUCTS, 20);
assert.equal(visibleShowcaseBanners(base).length, 1);
assert.equal(visibleShowcaseBanners({ ...base, enabled: false }).length, 0);
assert.deepEqual(resolveShowcaseProductIds(base), ['p1', 'p2']);
assert.deepEqual(resolveShowcaseProductIds({ ...base, productIds: [] }), []);
assert.equal(colsForDevice(base, 'desktop'), 5);
assert.equal(colsForDevice(base, 'mobile'), 2);

const chrome = resolveShowcaseCardChrome(base);
assert.equal(chrome.buyLabelEn, 'Shop');
assert.equal(chrome.buyLabelAr, 'تسوق');
assert.equal(chrome.equalCardHeights, true);
assert.equal(chrome.showMoreProducts, true);
assert.equal(chrome.moreProductsUrl, 'products');
assert.equal(resolveShowcaseShopTarget('products'), 'products');
assert.equal(resolveShowcaseShopTarget('shop'), 'products');
assert.deepEqual(resolveShowcaseShopTarget('https://example.com/shop'), { href: 'https://example.com/shop' });

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeCategoryShowcaseForm.tsx');
assert.ok(existsSync(formPath));
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-category-showcase-tab/);
assert.match(form, /data-category-showcase-panel="layout"/);
assert.match(form, /data-category-showcase-panel="style"/);
assert.match(form, /equalCardHeights/);
assert.match(form, /moreProductsUrl/);
assert.match(form, /titleFontSizePx/);
assert.match(form, /GlobalModal/);

console.log('coffee category showcase controls ok');
