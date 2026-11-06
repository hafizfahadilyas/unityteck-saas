import assert from 'node:assert/strict';
import { BUILDER_PAGE_IDS, builderPageFromQuery, builderPageMeta, stashPageDraft } from './builderPages.ts';
import { defaultCoffeeSectionOrder, keepMerchantSectionOrder } from './coffeeSections.ts';
import { thankYouOrderNumber } from '../../../themes/coffeeRoasters/thankYouOrder.ts';
import { learnMoreHref } from '../../../themes/coffeeRoasters/learnMoreHref.ts';

assert.deepEqual(defaultCoffeeSectionOrder(), [
  'announcement', 'hero', 'categories', 'products', 'image_banners', 'carousel', 'features', 'benefits', 'newsletter', 'footer',
]);
const reordered = [
  { type: 'footer' },
  { type: 'hero' },
  { type: 'banners' },
  { type: 'newsletter' },
];
assert.deepEqual(keepMerchantSectionOrder(reordered).map((b) => b.type), ['footer', 'hero', 'newsletter']);

assert.equal(builderPageFromQuery(new URLSearchParams('page=faq')), 'faq');
assert.equal(builderPageFromQuery(new URLSearchParams('page=crm')), null);
assert.equal(builderPageMeta('faq').slug, 'faq');
assert.equal(builderPageMeta('404').type, '404');
for (const id of ['home', 'catalog', 'product', 'cart', 'checkout', 'thankyou', 'faq', 'reviews', 'about', 'contact', '404', 'custom']) {
  assert.equal(BUILDER_PAGE_IDS.includes(id), true);
}
assert.equal(BUILDER_PAGE_IDS.includes('crm'), false);
const drafts = stashPageDraft({ home: [{ id: 'a' }] }, 'faq', [{ id: 'b' }]);
assert.equal(drafts.home[0].id, 'a');
assert.equal(drafts.faq[0].id, 'b');

assert.equal(thankYouOrderNumber({ orderNumber: 'ORD-44' }), 'ORD-44');
assert.equal(thankYouOrderNumber({ orderNumber: 'SAMPLE-1001' }), null);
assert.equal(thankYouOrderNumber(null), null);

assert.equal(learnMoreHref('#products', 'store-a'), '#products');
assert.equal(learnMoreHref('/offers', 'store-a'), '/offers');
assert.equal(learnMoreHref('/stores/store-a/offers', 'store-a'), '/stores/store-a/offers');
assert.equal(learnMoreHref('/stores/store-b/offers', 'store-a'), '');
assert.equal(learnMoreHref('https://shop.test/?store_id=store-b', 'store-a'), '');

console.log('builder next ten helpers ok');
