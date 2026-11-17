/**
 * CW wave — 20-element parity doc + reference PNGs on disk.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd());
const refDir = join(root, 'docs/reference/coffee-widget-ui');
const docPath = join(root, 'docs/34-coffee-20-elements-widget-parity.md');
const formPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeFeatureIconsForm.tsx');

assert.ok(existsSync(docPath), 'docs/34 missing');
const doc = readFileSync(docPath, 'utf8');
const form = readFileSync(formPath, 'utf8');

for (let n = 1; n <= 20; n++) {
  const row = new RegExp(`\\|\\s*${n}\\s*\\|`);
  assert.match(doc, row, `matrix row ${n}`);
}

const requiredRefs = [
  '08-feature-icons.png',
  '12-events-masterclasses.png',
  '13-features-section.png',
  '19-product-catalog.png',
  '20-product-collection.png',
];
const onDisk = readdirSync(refDir);
assert.ok(onDisk.length >= 20, `expected >=20 ref PNGs, got ${onDisk.length}`);
for (const name of requiredRefs) {
  assert.ok(existsSync(join(refDir, name)), `missing ref ${name}`);
}

assert.match(doc, /CW-01.*DONE/, 'CW-01 should be DONE');
assert.match(doc, /CW-02.*DONE/, 'CW-02 should be DONE');
assert.match(doc, /CW-03.*DONE/, 'CW-03 should be DONE');
assert.match(doc, /CW-04.*DONE/, 'CW-04 should be DONE');
assert.match(doc, /CW-05.*DONE/, 'CW-05 should be DONE');
assert.match(doc, /CW-06.*DONE/, 'CW-06 should be DONE');
assert.match(doc, /CW-07.*DONE/, 'CW-07 should be DONE');
assert.match(doc, /CW-08.*DONE/, 'CW-08 should be DONE');
assert.match(doc, /CW-09.*DONE/, 'CW-09 should be DONE');
assert.match(doc, /CW-10.*DONE/, 'CW-10 should be DONE');
assert.match(doc, /CW-11.*DONE/, 'CW-11 should be DONE');
assert.match(doc, /CW-12.*DONE/, 'CW-12 should be DONE');
assert.match(doc, /CW-13.*DONE/, 'CW-13 should be DONE');
assert.match(doc, /CW-14.*DONE/, 'CW-14 should be DONE');
assert.match(doc, /CW-15.*DONE/, 'CW-15 should be DONE');
assert.match(doc, /CW-16.*DONE/, 'CW-16 should be DONE');
assert.match(doc, /CLOSED/, 'docs/34 wave should be CLOSED');

const annFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeAnnouncementsForm.tsx');
assert.ok(existsSync(annFormPath), 'Announcements form missing');
assert.match(readFileSync(annFormPath, 'utf8'), /data-ann-tab/);
assert.match(readFileSync(annFormPath, 'utf8'), /data-ann-panel="layout"/);

const headerFormPath = join(root, 'src/components/store/themeSettings/HeaderElementsForm.tsx');
assert.ok(existsSync(headerFormPath), 'Header elements form missing');
assert.match(readFileSync(headerFormPath, 'utf8'), /data-menu-panel="products"/);
assert.match(readFileSync(headerFormPath, 'utf8'), /data-menu-panel="devices"/);
assert.ok(existsSync(join(refDir, '01-promotional-announcements.png')));
assert.ok(existsSync(join(refDir, '02-main-menu.png')));
assert.match(form, /data-feature-icons-tab/, 'Feature Icons tabs present');
assert.match(form, /GlobalModal/, 'Feature Icons item modal present');
assert.match(form, /data-feature-icons-panel="layout"/, 'Layout panel present');

const pcFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeProductCarouselForm.tsx');
assert.ok(existsSync(pcFormPath), 'Product Carousel form missing');
const pcForm = readFileSync(pcFormPath, 'utf8');
assert.match(pcForm, /data-product-carousel-tab/, 'Product Carousel tabs present');
assert.match(pcForm, /GlobalModal/, 'Product Carousel edit modal present');
assert.match(pcForm, /data-product-carousel-panel="layout"/, 'Product Carousel layout panel present');

const csFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeCategoryShowcaseForm.tsx');
assert.ok(existsSync(csFormPath), 'Category Showcase form missing');
assert.match(readFileSync(csFormPath, 'utf8'), /data-category-showcase-tab/);
assert.match(readFileSync(csFormPath, 'utf8'), /data-category-showcase-panel="layout"/);

const benFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeBenefitsForm.tsx');
assert.ok(existsSync(benFormPath), 'Benefits form missing');
assert.match(readFileSync(benFormPath, 'utf8'), /data-benefits-status/);
assert.match(readFileSync(benFormPath, 'utf8'), /data-benefits-buttons/);

const evtFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeEventsForm.tsx');
assert.ok(existsSync(evtFormPath), 'Events form missing');
assert.match(readFileSync(evtFormPath, 'utf8'), /data-events-tab/);
assert.match(readFileSync(evtFormPath, 'utf8'), /data-events-panel="layout"/);

const featFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeFeaturesSectionForm.tsx');
assert.ok(existsSync(featFormPath), 'Features Section form missing');
assert.match(readFileSync(featFormPath, 'utf8'), /data-features-section-tab/);
assert.match(readFileSync(featFormPath, 'utf8'), /data-features-section-panel="layout"/);
assert.match(readFileSync(featFormPath, 'utf8'), /data-features-section-edit/);
assert.equal(readFileSync(featFormPath, 'utf8').includes('enhancedFeatures'), false);

const cmpFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeModelComparisonForm.tsx');
assert.ok(existsSync(cmpFormPath), 'Model Comparison form missing');
assert.match(readFileSync(cmpFormPath, 'utf8'), /data-model-comparison-tab/);
assert.match(readFileSync(cmpFormPath, 'utf8'), /data-model-comparison-panel="layout"/);
assert.match(readFileSync(cmpFormPath, 'utf8'), /data-model-comparison-panel="specs"/);

const revFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeCustomerReviewsForm.tsx');
assert.ok(existsSync(revFormPath), 'Customer Reviews form missing');
assert.match(readFileSync(revFormPath, 'utf8'), /data-customer-reviews-tab/);
assert.match(readFileSync(revFormPath, 'utf8'), /data-customer-reviews-panel="form"/);
assert.match(readFileSync(revFormPath, 'utf8'), /data-customer-reviews-panel="moderation"/);

const faqFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeFaqForm.tsx');
assert.ok(existsSync(faqFormPath), 'FAQ form missing');
assert.match(readFileSync(faqFormPath, 'utf8'), /data-faq-tab/);
assert.match(readFileSync(faqFormPath, 'utf8'), /data-faq-panel="layout"/);
assert.match(readFileSync(faqFormPath, 'utf8'), /data-faq-edit/);

const commFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeCommercialHeroForm.tsx');
assert.ok(existsSync(commFormPath), 'Commercial Hero form missing');
assert.match(readFileSync(commFormPath, 'utf8'), /data-commercial-hero-tab/);
assert.match(readFileSync(commFormPath, 'utf8'), /data-commercial-hero-panel="slides"/);

const pslFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeProductSliderForm.tsx');
assert.ok(existsSync(pslFormPath), 'Product Slider form missing');
assert.match(readFileSync(pslFormPath, 'utf8'), /data-product-slider-tab/);
assert.match(readFileSync(pslFormPath, 'utf8'), /data-product-slider-panel="source"/);

const catFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeProductCatalogForm.tsx');
assert.ok(existsSync(catFormPath), 'Product Catalog form missing');
assert.match(readFileSync(catFormPath, 'utf8'), /data-product-catalog-tab/);
assert.match(readFileSync(catFormPath, 'utf8'), /data-product-catalog-panel="filters"/);

const collFormPath = join(root, 'src/components/store/themeSettings/coffee/CoffeeProductCollectionForm.tsx');
assert.ok(existsSync(collFormPath), 'Product Collection form missing');
assert.match(readFileSync(collFormPath, 'utf8'), /data-product-collection-tab/);
assert.match(readFileSync(collFormPath, 'utf8'), /data-product-collection-panel="benefits"/);
assert.match(readFileSync(collFormPath, 'utf8'), /data-product-collection-promo-edit/);

assert.match(readFileSync(headerFormPath, 'utf8'), /data-header-tab/);
assert.match(readFileSync(headerFormPath, 'utf8'), /data-nav-controls="mega-source"/);

const perks = readFileSync(join(root, 'src/themes/coffeeRoasters/components/ExclusivePerksBar.tsx'), 'utf8');
assert.equal(perks.includes('coffeeModularSeed'), false, 'ExclusivePerksBar must not seed-decorate benefits');
assert.ok(existsSync(join(refDir, '10-category-showcase.png')));
assert.ok(existsSync(join(refDir, '11-benefits-editor.png')));
assert.ok(existsSync(join(refDir, '11-benefits-storefront.png')));
assert.ok(existsSync(join(refDir, '13-features-section.png')));
assert.ok(existsSync(join(refDir, '14-model-comparison.png')));
assert.ok(existsSync(join(refDir, '15-customer-reviews.png')));
assert.ok(existsSync(join(refDir, '16-faq.png')));
assert.ok(existsSync(join(refDir, '17-commercial-hero.png')));
assert.ok(existsSync(join(refDir, '17b-hero-banner-extended.png')));
assert.ok(existsSync(join(refDir, '18-product-slider.png')));
assert.ok(existsSync(join(refDir, '19-product-catalog.png')));
assert.ok(existsSync(join(refDir, '20-product-collection.png')));

console.log('coffee widget parity ref ok');