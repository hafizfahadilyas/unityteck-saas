/**
 * Coffee page builder — 18 ref widgets in catalog (doc #3–6, 8–18 + inner column row).
 */
import assert from 'node:assert/strict';
import {
  COFFEE_PAGE_BUILDER_WIDGET_IDS,
  getCoffeePageBuilderWidgetCatalog,
} from './widgets/BuilderWidgetLibrary.tsx';

assert.equal(COFFEE_PAGE_BUILDER_WIDGET_IDS.length, 18, 'expected 18 coffee widget ids');

const catalog = getCoffeePageBuilderWidgetCatalog();
assert.equal(catalog.length, 18, 'catalog must resolve all 18 ids');

const types = new Set(catalog.map((w) => w.type));
const requiredTypes = [
  'hero_banners',
  'featured_section_banners',
  'image_banners',
  'featured_products',
  'store_features_bar',
  'product_carousel',
  'featured_categories_products',
  'exclusive_benefits',
  'events_masterclasses',
  'features',
  'model_comparison',
  'reviews',
  'faq',
  'commercial_hero',
  'product_slider',
  'product_catalog',
  'product_collection',
  'columns_container',
];
for (const t of requiredTypes) {
  assert.ok(types.has(t), `missing widget type ${t}`);
}

const byId = new Map(catalog.map((w) => [w.id, w]));
assert.equal(byId.get('w_product_grid')?.titleEn, 'Featured Products');
assert.equal(byId.get('w_features')?.titleEn, 'Feature Icons');
assert.equal(byId.get('w_features_section')?.titleEn, 'Features Section');
assert.equal(byId.get('w_featured_categories')?.titleEn, 'Category Showcase');
assert.equal(byId.get('w_faq')?.titleEn, 'FAQ');

console.log('coffee page builder 18 widgets ok');