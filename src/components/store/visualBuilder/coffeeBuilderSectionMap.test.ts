import assert from 'node:assert/strict';
import {
  COFFEE_BUILDER_SECTION_BY_TYPE,
  COFFEE_DOC_WIDGET_TITLES,
  COFFEE_REF_REQUIRED_BLOCK_TYPES,
  coffeeCustomizerSectionForBlock,
  coffeeLayerTitle,
} from './coffeeBuilderSectionMap.ts';

assert.equal(coffeeCustomizerSectionForBlock({ type: 'hero_banners' }), 'C-HERO');
assert.equal(coffeeCustomizerSectionForBlock({ type: 'store_features_bar' }), 'C-ICON');
assert.equal(coffeeCustomizerSectionForBlock({ type: 'features' }), 'C-FEAT');
assert.equal(coffeeCustomizerSectionForBlock({ type: 'featured_categories_products' }), 'C-FCP');
assert.equal(coffeeCustomizerSectionForBlock({ type: 'product_catalog' }), 'C-SHOP');
assert.equal(coffeeCustomizerSectionForBlock({ type: 'product_carousel_banner' }), 'C-PCB');
assert.equal(coffeeCustomizerSectionForBlock({ type: 'newsletter' }), 'C-NEWS');
assert.equal(coffeeCustomizerSectionForBlock({ type: 'custom_order' }), 'C-CPB');
assert.equal(coffeeCustomizerSectionForBlock({ id: 'header', type: 'header' }), '00_header_builder');
assert.equal(coffeeCustomizerSectionForBlock({ id: 'announcement' }), 'C-ANN');
assert.equal(coffeeCustomizerSectionForBlock({ id: 'footer', type: 'footer' }), 'C-FOOT');
assert.equal(coffeeCustomizerSectionForBlock({ type: 'columns_container' }), null);

for (const t of COFFEE_REF_REQUIRED_BLOCK_TYPES) {
  const section = coffeeCustomizerSectionForBlock({ type: t });
  assert.ok(section, `block type ${t} must map to a Coffee*Form section`);
}

assert.ok(COFFEE_BUILDER_SECTION_BY_TYPE.product_collection);
assert.equal(COFFEE_DOC_WIDGET_TITLES.w_product_grid.titleEn, 'Featured Products');
assert.equal(COFFEE_DOC_WIDGET_TITLES.w_features.titleEn, 'Feature Icons');
assert.equal(COFFEE_DOC_WIDGET_TITLES.w_features_section.titleEn, 'Features Section');
assert.equal(coffeeLayerTitle({ type: 'store_features_bar', titleEn: 'Old' }, false), 'Feature Icons');
assert.equal(coffeeLayerTitle({ type: 'header' }, true), 'القائمة الرئيسية');

console.log('coffee builder section map ok');
