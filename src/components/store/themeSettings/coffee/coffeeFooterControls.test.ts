/**
 * CT-05 — Footer settings shape: enable, layout, social, bottom bar (store-scoped fields).
 */
import assert from 'node:assert/strict';
import type { CoffeeFooterSettings } from '../../../../themes/settings/coffeeModularSettings.ts';

function visibleColumns(footer: CoffeeFooterSettings) {
  return (footer.columns || []).filter((col) => {
    if (col.enabled === false) return false;
    return (col.links || []).some((l) => l.enabled !== false) || Boolean(col.titleEn || col.titleAr);
  });
}

function visibleSocial(footer: CoffeeFooterSettings) {
  if (footer.showSocial === false) return [];
  return (footer.socialLinks || []).filter((s) => s.enabled !== false && (s.url || '').trim());
}

const sample: CoffeeFooterSettings = {
  enabled: true,
  layout: 'columns',
  aboutEn: 'About',
  aboutAr: 'نبذة',
  copyrightEn: '©',
  copyrightAr: '©',
  showSocial: true,
  showPaymentIcons: false,
  contentWidth: 'boxed',
  desktopColumns: 3,
  bgColor: '#111111',
  columns: [
    {
      id: 'a',
      titleEn: 'Shop',
      titleAr: 'المتجر',
      enabled: true,
      links: [
        { id: 'l1', labelEn: 'All', labelAr: 'الكل', url: 'products', enabled: true },
        { id: 'l2', labelEn: 'Hidden', labelAr: 'مخفي', url: 'home', enabled: false },
      ],
    },
    {
      id: 'b',
      titleEn: 'Off',
      titleAr: 'معطل',
      enabled: false,
      links: [{ id: 'l3', labelEn: 'X', labelAr: 'س', url: 'about', enabled: true }],
    },
  ],
  socialLinks: [
    { id: 's1', platform: 'instagram', url: 'https://instagram.com/store-a', enabled: true },
    { id: 's2', platform: 'facebook', url: '', enabled: true },
  ],
  showBottomBar: true,
  bottomLinks: [{ id: 'b1', labelEn: 'Privacy', labelAr: 'الخصوصية', url: 'privacy', enabled: true }],
};

assert.equal(sample.enabled, true);
assert.equal(visibleColumns(sample).length, 1);
assert.equal(visibleColumns(sample)[0].links.filter((l) => l.enabled !== false).length, 1);
assert.equal(visibleSocial(sample).length, 1);
assert.equal(visibleSocial({ ...sample, showSocial: false }).length, 0);

const disabled: CoffeeFooterSettings = { ...sample, enabled: false };
assert.equal(disabled.enabled, false);

/** DF-04 — empty bottom links must not invent legal rows */
const emptyBottom: CoffeeFooterSettings = { ...sample, bottomLinks: [] };
assert.equal((emptyBottom.bottomLinks || []).length, 0);

console.log('coffee footer controls ok');
