/**
 * Shared product source filter — all / category / brand / selected / mix.
 */
import assert from 'node:assert/strict';
import {
  emptyProductSource,
  normalizeProductSource,
  resolveProductIdsBySource,
  uniqueCatalogBrands,
  uniqueCatalogCategories,
} from '../../../../themes/coffeeRoasters/components/coffeeProductSourceLogic.ts';

const catalog = [
  { id: 'a', name: 'A', category: 'machines', brand: 'HiBrew', isFeatured: true, salesCount: 5 },
  { id: 'b', name: 'B', category: 'mills', brand: 'HiBrew', salesCount: 2 },
  { id: 'c', name: 'C', category: 'machines', brand: 'Other', salesCount: 9 },
  { id: 'd', name: 'D', category: 'accessories', brand: 'Other' },
];

assert.deepEqual(uniqueCatalogCategories(catalog).sort(), ['accessories', 'machines', 'mills']);
assert.deepEqual(uniqueCatalogBrands(catalog).sort(), ['HiBrew', 'Other']);

assert.deepEqual(
  resolveProductIdsBySource(emptyProductSource({ mode: 'all', productCount: 2 }), catalog),
  ['a', 'b'],
);

assert.deepEqual(
  resolveProductIdsBySource(
    emptyProductSource({ mode: 'category', categoryIds: ['machines'], productCount: 10 }),
    catalog,
  ),
  ['a', 'c'],
);

assert.deepEqual(
  resolveProductIdsBySource(
    emptyProductSource({ mode: 'brand', brandIds: ['HiBrew'], productCount: 10 }),
    catalog,
  ),
  ['a', 'b'],
);

assert.deepEqual(
  resolveProductIdsBySource(
    emptyProductSource({ mode: 'selected', productIds: ['c', 'missing', 'a'], productCount: 10 }),
    catalog,
  ),
  ['c', 'a'],
);

assert.deepEqual(
  resolveProductIdsBySource(
    emptyProductSource({
      mode: 'mix',
      categoryIds: ['machines'],
      brandIds: ['HiBrew'],
      productIds: ['d'],
      productCount: 10,
    }),
    catalog,
  ),
  ['d', 'a'],
);

assert.deepEqual(
  resolveProductIdsBySource(emptyProductSource({ mode: 'featured', productCount: 10 }), catalog),
  ['a'],
);

assert.deepEqual(
  resolveProductIdsBySource(emptyProductSource({ mode: 'best_selling', productCount: 2 }), catalog),
  ['c', 'a'],
);

assert.equal(resolveProductIdsBySource(emptyProductSource({ mode: 'category', categoryIds: [] }), catalog).length, 0);
assert.equal(resolveProductIdsBySource(emptyProductSource({ mode: 'all' }), []).length, 0);

const legacy = normalizeProductSource({ sourceType: 'category', categoryId: 'mills', productCount: 3 });
assert.equal(legacy.mode, 'category');
assert.deepEqual(legacy.categoryIds, ['mills']);

console.log('coffee product source controls ok');
