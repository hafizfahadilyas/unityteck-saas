/**
 * Grouped parent → child comparison rows (real price/stock/sku/details/specs only).
 */
import assert from 'node:assert/strict';
import {
  buildGroupCompareRows,
  childComparePricing,
} from './groupChildrenComparisonLogic.ts';
import type { Product } from '../types.ts';

function child(partial: Partial<Product> & { id: string }): Product {
  return {
    name: 'EN',
    tagline: '',
    category: 'machines',
    basePrice: 100,
    reviewCount: 0,
    rating: 0,
    colors: [],
    storageOptions: [],
    specs: [],
    images: [],
    overview: '',
    ...partial,
  };
}

const kids = [
  child({
    id: 'a',
    name: 'A',
    nameAr: 'أ',
    basePrice: 1999,
    price: 1999,
    originalPrice: 2299,
    stock: 12,
    sku: 'SKU-A',
    brand: 'HiBrew',
    overview: 'Desc child 1',
    overviewAr: 'وصف ١',
    productOptions: [
      {
        name: 'Profile',
        values: [{ label: 'Standard 15 Bar' }, { label: 'Commercial 20 Bar' }],
      },
    ],
    specs: [{ label: 'Pump', value: '20 bar', labelAr: 'مضخة', valueAr: '20 بار' }],
  }),
  child({
    id: 'b',
    name: 'B',
    nameAr: 'ب',
    basePrice: 749,
    price: 749,
    stock: 0,
    sku: 'SKU-B',
    brand: 'HiBrew',
    overview: 'Desc child 2',
    specs: [{ label: 'Pump', value: '15 bar', labelAr: 'مضخة', valueAr: '15 بار' }],
  }),
];

assert.equal(childComparePricing(kids[0]).price, 1999);
assert.equal(childComparePricing(kids[0]).compareAt, 2299);

const en = buildGroupCompareRows(kids, false);
assert.equal(en.find((r) => r.key === 'price')?.values.a?.includes('1'), true);
assert.match(en.find((r) => r.key === 'price')?.values.a || '', /1,?999/);
assert.equal(en.find((r) => r.key === 'stock')?.values.b, 'Out of stock');
assert.equal(en.find((r) => r.key === 'sku')?.values.a, 'SKU-A');
assert.equal(en.find((r) => r.key === 'brand')?.values.a, 'HiBrew');
assert.equal(en.find((r) => r.key === 'overview')?.values.a, 'Desc child 1');
assert.match(en.find((r) => r.key === 'options')?.values.a || '', /Profile/);
assert.equal(en.find((r) => r.key === 'spec:pump')?.values.a, '20 bar');
assert.equal(en.find((r) => r.key === 'spec:pump')?.values.b, '15 bar');
assert.equal(en.find((r) => r.key === 'save')?.emphasizeDiff, true);

const ar = buildGroupCompareRows(kids, true);
assert.equal(ar.find((r) => r.key === 'spec:pump')?.labelAr, 'مضخة');
assert.equal(ar.find((r) => r.key === 'spec:pump')?.values.a, '20 بار');
assert.equal(ar.find((r) => r.key === 'overview')?.values.a, 'وصف ١');
assert.deepEqual(buildGroupCompareRows([], false), []);

console.log('groupChildrenComparisonLogic.test.ts: ok');
