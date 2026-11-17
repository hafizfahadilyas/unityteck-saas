/**
 * CW-01 — Feature Icons controls: isolation, empty, enable, reorder, device rows.
 */
import assert from 'node:assert/strict';
import {
  featureItemDescription,
  featureItemTitle,
  featureItemsForDevice,
  featureShowsOn,
  type EnhancedFeatureItem,
  type EnhancedFeaturesSettings,
} from '../../../../themes/coffeeRoasters/components/coffeeFeatureIconsLogic.ts';
import {
  FEATURE_ICONS_MAX_ITEMS,
  blankFeatureItem,
  duplicateFeatureItem,
  reorderFeatureItems,
} from './coffeeFeatureIconsControls.ts';

function sampleSettings(over: Partial<EnhancedFeaturesSettings> = {}): EnhancedFeaturesSettings {
  const items: EnhancedFeatureItem[] = [
    {
      id: 'a',
      icon: 'Truck',
      title: 'Fast',
      titleEn: 'Fast',
      titleAr: 'سريع',
      description: 'Ship',
      descriptionEn: 'Ship',
      descriptionAr: 'شحن',
      enabled: true,
      showDesktop: true,
      showTablet: true,
      showMobile: true,
    },
    {
      id: 'b',
      icon: 'ShieldCheck',
      title: 'Safe',
      titleEn: 'Safe',
      titleAr: 'آمن',
      description: 'Pay',
      descriptionEn: 'Pay',
      descriptionAr: 'دفع',
      enabled: false,
      showDesktop: true,
      showTablet: true,
      showMobile: false,
    },
    {
      id: 'c',
      icon: 'Headphones',
      title: 'Help',
      titleEn: 'Help',
      titleAr: 'مساعدة',
      description: 'Chat',
      descriptionEn: 'Chat',
      descriptionAr: 'دردشة',
      enabled: true,
      showDesktop: false,
      showTablet: true,
      showMobile: true,
    },
  ];
  return {
    enabled: true,
    mainTitle: '',
    mainTitleEn: 'Why Us',
    mainTitleAr: 'لماذا نحن',
    subtitle: '',
    subtitleEn: '',
    subtitleAr: '',
    layoutStyle: 'classic-cards',
    itemsPerRowDesktop: 4,
    itemsPerRowTablet: 2,
    itemsPerRowMobile: 1,
    features: items,
    cardBackground: 'white',
    cardBorder: 'soft',
    borderRadius: 16,
    shadow: true,
    iconAnimation: 'none',
    hoverEffect: 'zoom',
    bgColor: '#F8FAFC',
    contentAlign: 'center',
    itemSpacingDesktop: 32,
    itemSpacingTablet: 20,
    itemSpacingMobile: 16,
    sectionPaddingDesktop: 24,
    sectionPaddingTablet: 16,
    sectionPaddingMobile: 12,
    ...over,
  };
}

assert.equal(FEATURE_ICONS_MAX_ITEMS, 4);

const base = sampleSettings();
assert.equal(featureItemsForDevice(base, 'desktop').length, 1, 'desktop: only enabled+visible');
assert.equal(featureItemsForDevice(base, 'tablet').length, 2, 'tablet: a+c');
assert.equal(featureItemsForDevice(base, 'mobile').length, 2, 'mobile: a+c');
assert.equal(featureItemsForDevice({ ...base, enabled: false }, 'desktop').length, 0);

const empty = sampleSettings({ features: [] });
assert.equal(featureItemsForDevice(empty, 'desktop').length, 0);

const blankOnly = sampleSettings({
  features: [
    {
      ...blankFeatureItem(),
      id: 'empty',
      title: '',
      titleEn: '',
      titleAr: '',
      description: '',
      descriptionEn: '',
      descriptionAr: '',
    },
  ],
});
assert.equal(featureItemsForDevice(blankOnly, 'desktop').length, 0, 'blank item hidden on storefront');
assert.equal(featureItemsForDevice(blankOnly, 'desktop', { includeEmpty: true }).length, 1);

const a = base.features[0];
assert.equal(featureItemTitle(a, 'ar'), 'سريع');
assert.equal(featureItemTitle(a, 'en'), 'Fast');
assert.equal(featureItemDescription(a, 'ar'), 'شحن');
assert.equal(featureShowsOn(a, 'desktop'), true);
assert.equal(featureShowsOn(base.features[2], 'desktop'), false);

const reordered = reorderFeatureItems(base.features, 0, 2);
assert.deepEqual(
  reordered.map((f) => f.id),
  ['b', 'c', 'a'],
);
assert.deepEqual(reorderFeatureItems(base.features, 1, 1).map((f) => f.id), ['a', 'b', 'c']);

const copy = duplicateFeatureItem(a);
assert.notEqual(copy.id, a.id);
assert.equal(copy.titleEn, a.titleEn);
assert.equal(copy.enabled, true);

assert.ok(blankFeatureItem().enabled !== false);
assert.equal(base.itemsPerRowDesktop, 4);
assert.equal(base.itemsPerRowTablet, 2);
assert.equal(base.itemsPerRowMobile, 1);
assert.equal(base.itemSpacingTablet, 20);
assert.equal(base.sectionPaddingTablet, 16);

console.log('coffee feature icons controls ok');
