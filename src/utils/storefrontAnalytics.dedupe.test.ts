import assert from 'node:assert/strict';
import {
  PAGE_VIEW_DEDUPE_MS,
  resetPageViewDedupeForTests,
  shouldSkipDuplicatePageView,
} from './storefrontPageViewDedupe.ts';

resetPageViewDedupeForTests();
const t0 = 1_700_000_000_000;
assert.equal(shouldSkipDuplicatePageView('store-1', 's1', '/', t0), false);
assert.equal(shouldSkipDuplicatePageView('store-1', 's1', '/', t0 + 100), true);
assert.equal(shouldSkipDuplicatePageView('store-1', 's1', '/cart', t0 + 100), false);
assert.equal(shouldSkipDuplicatePageView('store-2', 's1', '/', t0 + 100), false);
assert.equal(
  shouldSkipDuplicatePageView('store-1', 's1', '/', t0 + PAGE_VIEW_DEDUPE_MS + 1),
  false,
);
console.log('storefront analytics dedupe ok');
