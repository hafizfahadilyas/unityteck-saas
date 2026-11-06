import assert from 'node:assert/strict';
import { coffeeCanvasMode, showRestoreAllBanner } from './coffeeCanvasMode.ts';

const types = new Set(['header', 'hero_banners', 'footer']);

assert.equal(coffeeCanvasMode(true, 0, null, types), 'empty');
assert.equal(coffeeCanvasMode(true, 3, 'hero_banners', types), 'storefront');
assert.equal(coffeeCanvasMode(true, 3, 'product_section_natural', types), 'compact');
assert.equal(coffeeCanvasMode(false, 0, 'hero', types), 'other');
assert.equal(showRestoreAllBanner(true, 2), false);
assert.equal(showRestoreAllBanner(false, 0), false);
assert.equal(showRestoreAllBanner(false, 3), true);
console.log('coffee canvas mode ok');
