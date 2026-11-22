/**
 * Coffee Layers: heading from theme slice + soft-hide enabled sync.
 */
import assert from 'node:assert/strict';
import {
  coffeeLayerTitle,
  coffeeSettingsKeyForBlock,
  coffeeSliceHeading,
  setCoffeeSliceEnabled,
} from './coffeeBuilderSectionMap.ts';

const fcpSlice = {
  enabled: true,
  sections: [
    {
      id: 'fcp-1',
      titleEn: 'Shop HiBrew by Category',
      titleAr: 'تسوّق هايبرو حسب التصنيف',
    },
  ],
};

assert.equal(coffeeSliceHeading(fcpSlice, false), 'Shop HiBrew by Category');
assert.equal(coffeeSliceHeading(fcpSlice, true), 'تسوّق هايبرو حسب التصنيف');

const block = { type: 'featured_categories_products', id: 'featured_categories_products' };
assert.equal(coffeeSettingsKeyForBlock(block), 'featuredCategoriesProducts');

const titled = coffeeLayerTitle(block, false, {
  featuredCategoriesProducts: fcpSlice,
});
assert.equal(titled, 'Shop HiBrew by Category');

const hidden = setCoffeeSliceEnabled(
  { featuredCategoriesProducts: fcpSlice },
  block,
  false,
) as { featuredCategoriesProducts: { enabled: boolean } };
assert.equal(hidden.featuredCategoriesProducts.enabled, false);

const restored = setCoffeeSliceEnabled(hidden, block, true) as {
  featuredCategoriesProducts: { enabled: boolean };
};
assert.equal(restored.featuredCategoriesProducts.enabled, true);

console.log('coffeeLayerTitle + soft-hide enabled sync ok');
