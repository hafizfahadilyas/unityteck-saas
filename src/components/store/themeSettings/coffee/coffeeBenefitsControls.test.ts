/**
 * CW-04 — Benefits: unavailable faded, buttons, reorder.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ExclusiveBenefitsSettings } from '../../../../themes/settings/coffeeModularSettings.ts';
import {
  BENEFITS_MAX_ITEMS,
  blankBenefitItem,
  benefitCardFaded,
  duplicateBenefit,
  reorderBenefits,
  visibleBenefitItems,
} from '../../../../themes/coffeeRoasters/components/coffeeBenefitsLogic.ts';

const settings: ExclusiveBenefitsSettings = {
  enabled: true,
  titleEn: 'Perks',
  titleAr: 'مزايا',
  subtitleEn: '',
  subtitleAr: '',
  items: [
    blankBenefitItem({ id: '1', titleEn: 'Warranty', titleAr: 'ضمان', unavailable: false }),
    blankBenefitItem({ id: '2', titleEn: 'VIP', titleAr: 'خاص', unavailable: true }),
    blankBenefitItem({ id: '3', titleEn: '', titleAr: '', enabled: true }),
    blankBenefitItem({ id: '4', titleEn: 'Hidden', enabled: false }),
  ],
};

assert.equal(BENEFITS_MAX_ITEMS, 12);
const visible = visibleBenefitItems(settings);
assert.equal(visible.length, 2);
assert.equal(benefitCardFaded(visible[1]), true);
assert.equal(benefitCardFaded(visible[0]), false);
assert.equal(visibleBenefitItems({ ...settings, enabled: false }).length, 0);

const reordered = reorderBenefits(settings.items, 0, 1);
assert.deepEqual(reordered.map((i) => i.id), ['2', '1', '3', '4']);
const copy = duplicateBenefit(settings.items[0]);
assert.notEqual(copy.id, '1');
assert.equal(copy.titleEn, 'Warranty');

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeBenefitsForm.tsx');
assert.ok(existsSync(formPath));
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-benefits-tab/);
assert.match(form, /data-benefits-status/);
assert.match(form, /GlobalModal/);
assert.match(form, /Show as Unavailable|غير متاح/);

console.log('coffee benefits controls ok');
