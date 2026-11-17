/**
 * CW-09 — FAQ: visible rows, device gates, reorder, bilingual form wiring.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FaqSettings } from '../../../../themes/settings/coffeeModularSettings.ts';
import { emptyFaq } from '../../../../themes/settings/coffeeModularSettings.ts';
import {
  FAQ_MAX_ITEMS,
  blankFaqItem,
  duplicateFaqItem,
  faqShowsOnDevice,
  reorderFaqItems,
  visibleFaqItems,
} from '../../../../themes/coffeeRoasters/components/coffeeFaqLogic.ts';

const settings: FaqSettings = {
  ...emptyFaq(true),
  badgeEn: 'SUPPORT',
  badgeAr: 'الدعم',
  titleEn: 'FAQ',
  titleAr: 'أسئلة',
  items: [
    blankFaqItem({ id: '1', qEn: 'Shipping?', qAr: 'الشحن؟', aEn: 'Fast', aAr: 'سريع' }),
    blankFaqItem({ id: '2', qEn: '', qAr: '', enabled: true }),
    blankFaqItem({ id: '3', qEn: 'Hidden', qAr: 'مخفي', enabled: false }),
    blankFaqItem({ id: '4', qEn: 'Warranty?', qAr: 'الضمان؟' }),
  ],
};

assert.equal(FAQ_MAX_ITEMS, 40);
const visible = visibleFaqItems(settings);
assert.equal(visible.length, 2);
assert.deepEqual(visible.map((i) => i.id), ['1', '4']);
assert.equal(visibleFaqItems({ ...settings, enabled: false }).length, 0);

assert.equal(faqShowsOnDevice(settings, 'desktop'), true);
assert.equal(faqShowsOnDevice({ ...settings, showOnMobile: false }, 'mobile'), false);

const reordered = reorderFaqItems(settings.items, 0, 3);
assert.deepEqual(reordered.map((i) => i.id), ['2', '3', '4', '1']);
const copy = duplicateFaqItem(settings.items[0]);
assert.notEqual(copy.id, '1');
assert.match(copy.qEn, /Shipping/);

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeFaqForm.tsx');
assert.ok(existsSync(formPath), 'FAQ form missing');
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-faq-tab/);
assert.match(form, /data-faq-panel="layout"/);
assert.match(form, /data-faq-panel="items"/);
assert.match(form, /GlobalModal/);
assert.match(form, /useCoffeeDraft\('faq'\)/);
assert.match(form, /qEn/);
assert.match(form, /qAr/);
assert.equal(form.includes('coffeeModularSeed'), false);

const sf = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/CoffeeFaqSection.tsx'), 'utf8');
assert.match(sf, /data-customize-section="C-FAQ"/);
assert.equal(sf.includes('coffeeModularSeed'), false);

const home = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/HomePage.tsx'), 'utf8');
assert.match(home, /CoffeeFaqSection/);
assert.match(home, /themeSettings\?\.faq|settings=\{themeSettings\?\.faq\}/);

const blocks = readFileSync(join(process.cwd(), 'src/components/store/visualBuilder/CoffeeBuilderBlocks.tsx'), 'utf8');
assert.match(blocks, /case 'faq':/);
assert.match(blocks, /CoffeeFaqSection/);
assert.match(blocks, /visibleFaqItems/);

assert.ok(existsSync(join(process.cwd(), 'docs/reference/coffee-widget-ui/16-faq.png')));

console.log('coffee faq controls ok');
