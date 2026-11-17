/**
 * CW-06 — Features Section: visible rows, device gates, columns, reorder (≠ Feature Icons).
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FeaturesSectionSettings } from '../../../../themes/settings/coffeeModularSettings.ts';
import { emptyFeaturesSection } from '../../../../themes/settings/coffeeModularSettings.ts';
import {
  FEATURES_SECTION_MAX_ITEMS,
  blankFeaturesSectionItem,
  duplicateFeaturesSectionItem,
  featuresSectionColumns,
  featuresSectionShowsOnDevice,
  reorderFeaturesSectionItems,
  visibleFeaturesSectionItems,
} from '../../../../themes/coffeeRoasters/components/coffeeFeaturesSectionLogic.ts';

const settings: FeaturesSectionSettings = {
  ...emptyFeaturesSection(true),
  badgeEn: 'FLAGSHIP',
  badgeAr: 'رائدة',
  titleEn: 'Architecture',
  titleAr: 'الهيكل',
  items: [
    blankFeaturesSectionItem({ id: '1', titleEn: 'Pressure', titleAr: 'ضغط' }),
    blankFeaturesSectionItem({ id: '2', titleEn: '', titleAr: '', enabled: true }),
    blankFeaturesSectionItem({ id: '3', titleEn: 'Hidden', enabled: false }),
    blankFeaturesSectionItem({ id: '4', titleEn: 'Heat', titleAr: 'حرارة' }),
  ],
};

assert.equal(FEATURES_SECTION_MAX_ITEMS, 12);
const visible = visibleFeaturesSectionItems(settings);
assert.equal(visible.length, 2);
assert.deepEqual(visible.map((i) => i.id), ['1', '4']);
assert.equal(visibleFeaturesSectionItems({ ...settings, enabled: false }).length, 0);

assert.equal(featuresSectionShowsOnDevice(settings, 'desktop'), true);
assert.equal(featuresSectionShowsOnDevice({ ...settings, showOnMobile: false }, 'mobile'), false);
assert.equal(featuresSectionColumns(settings, 'desktop'), 3);
assert.equal(featuresSectionColumns({ ...settings, columnsMobile: 2 }, 'mobile'), 2);

const reordered = reorderFeaturesSectionItems(settings.items, 0, 3);
assert.deepEqual(reordered.map((i) => i.id), ['2', '3', '4', '1']);
const copy = duplicateFeaturesSectionItem(settings.items[0]);
assert.notEqual(copy.id, '1');
assert.equal(copy.titleEn, 'Pressure');

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeFeaturesSectionForm.tsx');
assert.ok(existsSync(formPath), 'Features Section form missing');
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-features-section-tab/);
assert.match(form, /data-features-section-panel="layout"/);
assert.match(form, /GlobalModal/);
assert.match(form, /useCoffeeDraft\('featuresSection'\)/);
assert.equal(form.includes('enhancedFeatures'), false, 'Features Section must not use enhancedFeatures');

const sf = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/CoffeeFeaturesSection.tsx'), 'utf8');
assert.match(sf, /data-customize-section="C-FEAT"/);
assert.equal(sf.includes('coffeeModularSeed'), false);

const home = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/HomePage.tsx'), 'utf8');
assert.match(home, /CoffeeFeaturesSection/);
assert.match(home, /featuresSection/);

const blocks = readFileSync(join(process.cwd(), 'src/components/store/visualBuilder/CoffeeBuilderBlocks.tsx'), 'utf8');
assert.match(blocks, /case 'features':/);
assert.match(blocks, /visibleFeaturesSectionItems/);

console.log('coffee features section controls ok');
