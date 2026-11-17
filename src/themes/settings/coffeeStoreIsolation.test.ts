/**
 * CT-07 — Coffee vs second store isolation matrix (chrome + widgets keys/slices).
 */
import assert from 'node:assert/strict';
import {
  applyStoreThemeSlice,
  builderDraftStorageKey,
  builderKeysDiffer,
  builderPublishedStorageKey,
  sliceLacksForeignMarkers,
  themeSettingsKey,
  themeSettingsKeysDiffer,
} from './coffeeStoreIsolation.ts';
import { isFixedChromeBlock, applyChromeSafeDrop } from '../../components/store/visualBuilder/builderInteractions.ts';

const COFFEE = 'store-coffee';
const OTHER = 'store-bleco';
const THEME = 'theme-coffee-artisan';

assert.equal(themeSettingsKeysDiffer(COFFEE, OTHER, THEME), true);
assert.equal(themeSettingsKeysDiffer(COFFEE, COFFEE, THEME), false);
assert.equal(builderKeysDiffer(COFFEE, OTHER, THEME), true);

assert.ok(themeSettingsKey(COFFEE, THEME).includes(COFFEE));
assert.ok(!themeSettingsKey(COFFEE, THEME).includes(OTHER));
assert.equal(themeSettingsKey(COFFEE, THEME), `unityteck_theme_settings_${COFFEE}_${THEME}`);
assert.ok(builderDraftStorageKey(COFFEE, THEME).includes(COFFEE));
assert.ok(builderPublishedStorageKey(OTHER, THEME).includes(OTHER));

const coffeeSlice = applyStoreThemeSlice(
  {},
  {
    announcementBar: {
      messages: [{ textEn: 'COFFEE-ANN-ONLY', textAr: 'إعلان-قهوة-فقط' }],
    },
    footer: {
      aboutEn: 'COFFEE-FOOT-ONLY',
      aboutAr: 'تذييل-قهوة-فقط',
      copyrightEn: '© Coffee',
    },
    customHeader: {
      announcement: { messages: [{ textEn: 'COFFEE-HEADER-ANN' }] },
    },
  },
);

const otherSlice = applyStoreThemeSlice(
  {},
  {
    announcementBar: {
      messages: [{ textEn: 'BLECO-ANN-ONLY', textAr: 'إعلان-بليكو' }],
    },
    footer: { aboutEn: 'BLECO-FOOT-ONLY', aboutAr: 'تذييل-بليكو' },
  },
);

assert.equal(
  sliceLacksForeignMarkers(otherSlice, ['COFFEE-ANN-ONLY', 'COFFEE-FOOT-ONLY', 'COFFEE-HEADER-ANN']),
  true,
);
assert.equal(sliceLacksForeignMarkers(coffeeSlice, ['BLECO-ANN-ONLY', 'BLECO-FOOT-ONLY']), true);

const mergedOther = applyStoreThemeSlice({}, otherSlice);
assert.equal(JSON.stringify(mergedOther).includes('COFFEE'), false);

const tree = [
  { id: 'header', type: 'header' },
  { id: 'hero_banners', type: 'hero_banners' },
  { id: 'footer', type: 'footer' },
];
assert.equal(isFixedChromeBlock(tree[0]), true);
assert.equal(isFixedChromeBlock(tree[1]), false);
assert.equal(applyChromeSafeDrop(tree, 0, 1).accepted, false);
assert.equal(
  applyChromeSafeDrop(
    [
      { id: 'header', type: 'header' },
      { id: 'hero_banners', type: 'hero_banners' },
      { id: 'featured_products', type: 'featured_products' },
      { id: 'footer', type: 'footer' },
    ],
    1,
    2,
  ).accepted,
  true,
);

console.log('coffee store isolation matrix ok');
