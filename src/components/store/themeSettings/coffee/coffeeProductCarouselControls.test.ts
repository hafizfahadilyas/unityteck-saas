/**
 * CW-02 — Product Carousel: empty, manual vs catalog, reorder, max items.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ProductCarouselSettings } from '../../../../themes/settings/coffeeModularSettings.ts';
import {
  PRODUCT_CAROUSEL_MAX_ITEMS,
  blankCarouselItem,
  cardWidthForDevice,
  duplicateCarouselItem,
  reorderCarouselItems,
  resolveCarouselCards,
} from '../../../../themes/coffeeRoasters/components/coffeeProductCarouselLogic.ts';

const catalog = [
  { id: 'p1', name: 'Mill', nameAr: 'مطحنة', category: 'mills', basePrice: 900, stock: 3, images: ['https://cdn.example/a.jpg'] },
  { id: 'p2', name: 'Espresso', nameAr: 'إسبريسو', category: 'machines', basePrice: 4500, stock: 0, images: [] },
  { id: 'p3', name: 'Cup', nameAr: 'كوب', category: 'accessories', basePrice: 40, stock: 10, images: ['https://cdn.example/c.jpg'] },
];

const base: ProductCarouselSettings = {
  enabled: true,
  titleEn: 'New',
  titleAr: 'جديد',
  subtitleEn: '',
  subtitleAr: '',
  categoryId: 'machines',
  productCount: 2,
  autoplay: false,
  productsPerRowDesktop: 3,
  productsPerRowTablet: 2,
  productsPerRowMobile: 1,
  items: [],
};

assert.equal(PRODUCT_CAROUSEL_MAX_ITEMS, 20);

const off = resolveCarouselCards({ ...base, enabled: false }, catalog);
assert.equal(off.cards.length, 0);

const fromCat = resolveCarouselCards(base, catalog);
assert.equal(fromCat.kind, 'catalog');
assert.equal(fromCat.cards.length, 1);
assert.equal(fromCat.cards[0].catalog?.id, 'p2');

const emptyCat = resolveCarouselCards({ ...base, categoryId: 'missing' }, catalog);
assert.equal(emptyCat.cards.length, 0);

const manual = resolveCarouselCards(
  {
    ...base,
    items: [
      blankCarouselItem({ id: 'a', productId: 'p1', nameEn: 'Mill Override', enabled: true }),
      blankCarouselItem({ id: 'b', productId: 'p2', enabled: false, nameEn: 'Hidden' }),
      blankCarouselItem({ id: 'c', productId: '', nameEn: '', nameAr: '', imageUrl: '', enabled: true }),
      blankCarouselItem({ id: 'd', productId: 'p3', nameEn: 'Cup', enabled: true }),
    ],
  },
  catalog,
);
assert.equal(manual.kind, 'manual');
assert.equal(manual.cards.length, 2);
assert.deepEqual(
  manual.cards.map((c) => c.item.id),
  ['a', 'd'],
);

const blank = blankCarouselItem();
assert.equal(blank.enabled, true);
assert.equal(blank.showBuyNow, true);
assert.equal(blank.showAddToCart, true);
assert.equal(blank.showLearnMore, true);

const list = [
  blankCarouselItem({ id: '1', productId: 'p1', nameEn: 'A' }),
  blankCarouselItem({ id: '2', productId: 'p2', nameEn: 'B' }),
  blankCarouselItem({ id: '3', productId: 'p3', nameEn: 'C' }),
];
assert.deepEqual(reorderCarouselItems(list, 0, 2).map((x) => x.id), ['2', '3', '1']);
const copy = duplicateCarouselItem(list[0]);
assert.notEqual(copy.id, list[0].id);
assert.equal(copy.productId, 'p1');

assert.ok(cardWidthForDevice(base, 'desktop') >= 140);
assert.ok(cardWidthForDevice(base, 'mobile') >= 140);
assert.ok(cardWidthForDevice({ ...base, productsPerRowDesktop: 2 }, 'desktop') > cardWidthForDevice(base, 'desktop'));

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeProductCarouselForm.tsx');
assert.ok(existsSync(formPath));
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-product-carousel-tab/);
assert.match(form, /GlobalModal/);
assert.match(form, /data-product-carousel-panel="layout"/);
assert.match(form, /Edit Product|تعديل المنتج/);

console.log('coffee product carousel controls ok');
