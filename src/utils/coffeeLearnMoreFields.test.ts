/**
 * Run: node --experimental-strip-types src/utils/coffeeLearnMoreFields.test.ts
 */
import assert from 'node:assert/strict';
import {
  isCoffeeProductEditorStore,
  isLearnMoreSectionField,
  isLearnMoreSpecField,
  isPurchaseCustomField,
  specsFromLearnMoreFields,
} from './coffeeLearnMoreFields.ts';

assert.equal(isCoffeeProductEditorStore({ storeId: 'store-coffee' }), true);
assert.equal(isCoffeeProductEditorStore({ themeId: 'theme-coffee-artisan' }), true);
assert.equal(isCoffeeProductEditorStore({ storeId: 'store-1', themeId: 'theme-flowers' }), false);

const section = {
  id: 'learn-more-1',
  type: 'Content',
  name: 'Dual Boiler',
  nameAr: 'دبل بويلر',
  contentEn: 'PID',
  contentAr: 'تحكم',
  imageUrl: '/img.png',
};
assert.equal(isLearnMoreSectionField(section), true);
assert.equal(isLearnMoreSpecField(section), false);
assert.equal(isPurchaseCustomField(section), false);

const spec = {
  id: 'catalog-spec-1',
  type: 'Content',
  name: 'Pressure',
  nameAr: 'الضغط',
  contentEn: '20 bar',
  contentAr: '20 بار',
};
assert.equal(isLearnMoreSpecField(spec), true);
assert.equal(isLearnMoreSectionField(spec), false);

const purchase = { id: 'field_1', type: 'Short Text', name: 'Note' };
assert.equal(isPurchaseCustomField(purchase), true);

const specs = specsFromLearnMoreFields([spec, section]);
assert.equal(specs.length, 1);
assert.equal(specs[0].label, 'Pressure');
assert.equal(specs[0].valueAr, '20 بار');

console.log('coffeeLearnMoreFields ok');
