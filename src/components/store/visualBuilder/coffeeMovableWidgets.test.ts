/**
 * CT-06 — Movable coffee widgets vs fixed chrome.
 */
import assert from 'node:assert/strict';
import {
  COFFEE_BUILDER_BLOCK_TYPES,
  COFFEE_FULL_BLEED_TYPES,
  COFFEE_MOVABLE_BLOCK_TYPES,
} from './coffeeBlockTypes.ts';
import { isFixedChromeBlock, applyChromeSafeDrop } from './builderInteractions.ts';

const FIXED = ['announcement', 'announcement_bar', 'header', 'navbar', 'footer'];
for (const type of FIXED) {
  assert.equal(isFixedChromeBlock({ type, id: type }), true, `fixed: ${type}`);
  assert.equal(COFFEE_MOVABLE_BLOCK_TYPES.has(type), false, `not movable: ${type}`);
}

const mustMove = [
  'hero_banners',
  'featured_section_banners',
  'featured_products',
  'image_banners',
  'store_features_bar',
  'product_carousel',
  'featured_categories_products',
  'exclusive_benefits',
  'events_masterclasses',
  'model_comparison',
  'reviews',
  'faq',
  'commercial_hero',
  'product_slider',
  'product_catalog',
  'product_collection',
];
for (const type of mustMove) {
  assert.equal(COFFEE_MOVABLE_BLOCK_TYPES.has(type), true, `movable set: ${type}`);
  assert.equal(COFFEE_BUILDER_BLOCK_TYPES.has(type), true, `builder set: ${type}`);
  assert.equal(isFixedChromeBlock({ type, id: type }), false, `not chrome: ${type}`);
}

const tree = [
  { id: 'announcement_bar', type: 'announcement_bar' },
  { id: 'header', type: 'header' },
  { id: 'hero_banners', type: 'hero_banners' },
  { id: 'featured_products', type: 'featured_products' },
  { id: 'footer', type: 'footer' },
];
const body = applyChromeSafeDrop(tree, 2, 3);
assert.equal(body.accepted, true);
assert.deepEqual(
  body.items.map((b) => b.id),
  ['announcement_bar', 'header', 'featured_products', 'hero_banners', 'footer'],
);
assert.equal(applyChromeSafeDrop(tree, 1, 3).accepted, false);

for (const type of COFFEE_FULL_BLEED_TYPES) {
  assert.equal(COFFEE_BUILDER_BLOCK_TYPES.has(type), true);
}

console.log('coffee movable widgets ok');
