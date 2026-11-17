/**
 * CW-08 — Customer Reviews: approved filter, tabs, rating summary, form clamps.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emptyCustomerReviews } from '../../../../themes/settings/coffeeModularSettings.ts';
import {
  approvedReviews,
  averageRating,
  clampCharacterLimit,
  clampPhotoLimit,
  filterReviewsByTab,
  reviewsShowsOnDevice,
  starDistribution,
  starPercent,
} from '../../../../themes/coffeeRoasters/components/coffeeCustomerReviewsLogic.ts';

const rows = [
  { id: '1', rating: 5, active: true, comment: 'Great', photos: ['a.jpg'] },
  { id: '2', rating: 4, active: true, comment: 'Good', photos: [] },
  { id: '3', rating: 3, active: false, comment: 'Pending' },
  { id: '4', rating: 5, active: true, comment: 'Photo', images: ['b.png'] },
];

const approved = approvedReviews(rows);
assert.equal(approved.length, 3);
assert.equal(filterReviewsByTab(approved, 'photos').length, 2);
assert.equal(filterReviewsByTab(approved, 'all').length, 3);
assert.equal(averageRating(rows), 4.7);
const dist = starDistribution(rows);
assert.equal(dist[5], 2);
assert.equal(dist[4], 1);
assert.equal(starPercent(2, 3), 67);

assert.equal(clampCharacterLimit(10), 500);
assert.equal(clampCharacterLimit(800), 800);
assert.equal(clampPhotoLimit(-1), 5);
assert.equal(clampPhotoLimit(3), 3);

const settings = emptyCustomerReviews(true);
assert.equal(reviewsShowsOnDevice(settings, 'desktop'), true);
assert.equal(reviewsShowsOnDevice({ ...settings, showOnMobile: false }, 'mobile'), false);
assert.equal(reviewsShowsOnDevice({ ...settings, enabled: false }, 'desktop'), false);

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeCustomerReviewsForm.tsx');
assert.ok(existsSync(formPath));
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-customer-reviews-tab/);
assert.match(form, /data-customer-reviews-panel="form"/);
assert.match(form, /data-customer-reviews-panel="layout"/);
assert.match(form, /data-customer-reviews-panel="moderation"/);
assert.match(form, /useCoffeeDraft\('customerReviews'\)/);
assert.equal(form.includes('coffeeModularSeed'), false);

const sf = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/CoffeeCustomerReviewsSection.tsx'), 'utf8');
assert.match(sf, /data-customize-section="C-REV"/);
assert.match(sf, /No approved reviews yet|لا تقييمات معتمدة بعد/);
assert.equal(sf.includes('coffeeModularSeed'), false);
assert.equal(sf.includes('fetchStoreReviewsApi'), false, 'Presentational section must not fetch');

const host = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/CoffeeCustomerReviewsHome.tsx'), 'utf8');
assert.match(host, /fetchStoreReviewsApi/);
assert.match(host, /submitStoreReviewApi/);
assert.match(host, /CoffeeCustomerReviewsSection/);

const home = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/HomePage.tsx'), 'utf8');
assert.match(home, /CoffeeCustomerReviewsHome/);
assert.match(home, /customerReviews/);

const blocks = readFileSync(join(process.cwd(), 'src/components/store/visualBuilder/CoffeeBuilderBlocks.tsx'), 'utf8');
assert.match(blocks, /CoffeeReviewsBlockPreview|CoffeeCustomerReviewsSection/);
assert.match(blocks, /fetchStoreReviewsApi/);
assert.equal(blocks.includes('ReviewsWidget'), false);

assert.ok(existsSync(join(process.cwd(), 'docs/reference/coffee-widget-ui/15-customer-reviews.png')));
assert.ok(existsSync(join(process.cwd(), 'docs/reference/coffee-widget-ui/16b-reviews-admin.png')));

console.log('coffee customer reviews controls ok');
