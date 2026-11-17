/**
 * CW-13 — Product Collection controls + SF/builder wiring.
 * Run: node --experimental-strip-types src/components/store/themeSettings/coffee/coffeeProductCollectionControls.test.ts
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { emptyProductCollection } from '../../../../themes/settings/coffeeModularSettings.ts';
import {
  blankProductCollectionBenefit,
  blankProductCollectionItem,
  collectionHasVisibleContent,
  collectionShowsBenefits,
  collectionShowsPromo,
  collectionUsesSlider,
  duplicateProductCollectionBenefit,
  productCollectionShowsOnDevice,
  promoHasContent,
  resolveProductCollectionCards,
  visibleProductCollectionBenefits,
} from '../../../../themes/coffeeRoasters/components/coffeeProductCollectionLogic.ts';

const settings = emptyProductCollection(true);
assert.equal(productCollectionShowsOnDevice(settings, 'desktop'), true);
assert.equal(productCollectionShowsOnDevice({ ...settings, showOnMobile: false }, 'mobile'), false);
assert.equal(collectionHasVisibleContent(settings), false);
assert.equal(collectionUsesSlider('promo_slider'), true);
assert.equal(collectionUsesSlider('products_only'), false);
assert.equal(collectionShowsPromo('products_only'), false);
assert.equal(collectionShowsBenefits('promo_slider_benefits'), true);

const withItem = {
  ...settings,
  items: [blankProductCollectionItem({ nameEn: 'Dual', image: 'https://cdn.example/a.jpg' })],
};
assert.equal(resolveProductCollectionCards(withItem).length, 1);
assert.equal(collectionHasVisibleContent(withItem), true);

const ben = blankProductCollectionBenefit({ titleEn: 'Warranty', titleAr: 'ضمان' });
const withBen = { ...settings, benefits: [ben, blankProductCollectionBenefit({ enabled: false, titleEn: 'Hidden' })] };
assert.equal(visibleProductCollectionBenefits(withBen).length, 1);
const copy = duplicateProductCollectionBenefit(ben);
assert.notEqual(copy.id, ben.id);

assert.equal(promoHasContent(settings), false);
assert.equal(
  promoHasContent({
    ...settings,
    promo: { ...settings.promo, titleEn: 'Pro Series', image: 'https://cdn.example/p.jpg' },
  }),
  true,
);

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeProductCollectionForm.tsx');
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-product-collection-tab/);
assert.match(form, /data-product-collection-panel="promo"/);
assert.match(form, /data-product-collection-panel="benefits"/);
assert.match(form, /data-product-collection-promo-edit/);
assert.match(form, /data-product-collection-benefit-edit/);
assert.match(form, /useCoffeeDraft\('productCollection'\)/);

const sf = readFileSync(
  join(process.cwd(), 'src/themes/coffeeRoasters/components/CoffeeProductCollectionSection.tsx'),
  'utf8',
);
assert.match(sf, /data-customize-section="C-COLL"/);
assert.match(sf, /resolveProductCollectionCards/);

const home = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/HomePage.tsx'), 'utf8');
assert.match(home, /CoffeeProductCollectionSection/);
assert.match(home, /productCollection/);

const blocks = readFileSync(
  join(process.cwd(), 'src/components/store/visualBuilder/CoffeeBuilderBlocks.tsx'),
  'utf8',
);
const collCase = blocks.split("case 'product_collection':")[1]?.split(/case ['"]/)[0] || '';
assert.match(collCase, /ProductCollectionBuilderPreview|CoffeeProductCollectionSection/);
assert.equal(collCase.includes('productCarouselBanner'), false, 'product_collection must not render PCB');

assert.ok(existsSync(join(process.cwd(), 'docs/reference/coffee-widget-ui/20-product-collection.png')));

console.log('coffee product collection controls ok');
