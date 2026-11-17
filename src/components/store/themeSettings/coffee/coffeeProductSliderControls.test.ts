/**
 * CW-11 — Product Slider: source resolve, device gates, reorder (≠ productCarousel).
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ProductSliderSettings } from '../../../../themes/settings/coffeeModularSettings.ts';
import { emptyProductSlider } from '../../../../themes/settings/coffeeModularSettings.ts';
import {
  PRODUCT_SLIDER_MAX_ITEMS,
  blankProductSliderItem,
  duplicateProductSliderItem,
  itemsPerView,
  productSliderShowsOnDevice,
  reorderProductSliderItems,
  resolveProductSliderCards,
} from '../../../../themes/coffeeRoasters/components/coffeeProductSliderLogic.ts';

const catalog = [
  { id: 'a', name: 'Machine A', nameAr: 'ماكينة أ', category: 'machines', basePrice: 1000, isFeatured: true, salesCount: 5 },
  { id: 'b', name: 'Mill B', nameAr: 'مطحنة ب', category: 'mills', basePrice: 400, salesCount: 0 },
  { id: 'c', name: 'Cab C', nameAr: 'خزانة ج', category: 'cabinets', basePrice: 800, isFeatured: true, salesCount: 12 },
];

const manual: ProductSliderSettings = {
  ...emptyProductSlider(true),
  sourceType: 'manual',
  items: [
    blankProductSliderItem({ id: '1', productId: 'a', nameEn: 'A', nameAr: 'أ' }),
    blankProductSliderItem({ id: '2', productId: '', nameEn: '', nameAr: '', enabled: true }),
    blankProductSliderItem({ id: '3', productId: 'b', nameEn: 'Hidden', enabled: false }),
    blankProductSliderItem({ id: '4', productId: 'c', nameEn: 'C', nameAr: 'ج' }),
  ],
};

assert.equal(PRODUCT_SLIDER_MAX_ITEMS, 24);
const cards = resolveProductSliderCards(manual, catalog);
assert.equal(cards.length, 2);
assert.deepEqual(cards.map((c) => c.item.id), ['1', '4']);
assert.equal(resolveProductSliderCards({ ...manual, enabled: false }, catalog).length, 0);

const featured = resolveProductSliderCards({ ...emptyProductSlider(true), sourceType: 'featured', productCount: 10 }, catalog);
assert.equal(featured.length, 2);

const best = resolveProductSliderCards({ ...emptyProductSlider(true), sourceType: 'best_selling', productCount: 10 }, catalog);
assert.equal(best.length, 2);
assert.equal(best[0].item.productId, 'c');

const noSales = resolveProductSliderCards(
  { ...emptyProductSlider(true), sourceType: 'best_selling' },
  [{ id: 'x', name: 'X', basePrice: 1 }],
);
assert.equal(noSales.length, 0, 'best_selling without sales metrics stays empty');

assert.equal(productSliderShowsOnDevice(manual, 'desktop'), true);
assert.equal(productSliderShowsOnDevice({ ...manual, showOnMobile: false }, 'mobile'), false);
assert.equal(itemsPerView(manual, 'desktop'), 4);

const reordered = reorderProductSliderItems(manual.items, 0, 3);
assert.deepEqual(reordered.map((i) => i.id), ['2', '3', '4', '1']);
const copy = duplicateProductSliderItem(manual.items[0]);
assert.notEqual(copy.id, '1');

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeProductSliderForm.tsx');
assert.ok(existsSync(formPath), 'Product Slider form missing');
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-product-slider-tab/);
assert.match(form, /data-product-slider-panel="source"/);
assert.match(form, /data-product-slider-panel="layout"/);
assert.match(form, /useCoffeeDraft\('productSlider'\)/);
assert.equal(form.includes('productCarousel'), false, 'Product Slider must not use productCarousel draft');
assert.equal(form.includes('coffeeModularSeed'), false);

const sf = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/CoffeeProductSliderSection.tsx'), 'utf8');
assert.match(sf, /data-customize-section="C-PSL"/);
assert.equal(sf.includes('coffeeModularSeed'), false);

const home = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/HomePage.tsx'), 'utf8');
assert.match(home, /CoffeeProductSliderSection/);
assert.match(home, /productSlider/);

const blocks = readFileSync(join(process.cwd(), 'src/components/store/visualBuilder/CoffeeBuilderBlocks.tsx'), 'utf8');
assert.match(blocks, /case 'product_slider':/);
assert.match(blocks, /CoffeeProductSliderSection|ProductSliderBuilderPreview/);
assert.match(blocks, /resolveProductSliderCards/);
assert.equal(
  /case 'product_slider':[\s\S]*?only="productCarousel"/.test(blocks),
  false,
  'product_slider must not render productCarousel module',
);

assert.ok(existsSync(join(process.cwd(), 'docs/reference/coffee-widget-ui/18-product-slider.png')));

console.log('coffee product slider controls ok');
