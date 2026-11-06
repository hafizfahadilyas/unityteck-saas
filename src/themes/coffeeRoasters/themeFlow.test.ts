import assert from 'node:assert/strict';
import { chromeOffset, draftAfterSave, applyChosen, headingFlowStyle, sliderStageStyle, themeDirection, themeLayers, viewportNotes, warningIds } from './themeFlow.ts';

assert.equal(themeDirection(true), 'rtl');
assert.equal(themeDirection(false), 'ltr');
assert.equal(headingFlowStyle().overflowWrap, 'anywhere');
assert.equal(chromeOffset(64, 36), 100);
assert.equal(sliderStageStyle().aspectRatio, '16 / 7');
assert.equal(sliderStageStyle().overflow, 'hidden');
assert.deepEqual(themeLayers, { section: 0, header: 50, menu: 60, modal: 70 });
assert.deepEqual(warningIds(['multiple-h1', 'h1:a', 'h1:b', 'missing-alt:bare'], 'h1:'), ['a', 'b']);
assert.deepEqual(warningIds(['missing-alt:bare', 'missing-alt:captioned'], 'missing-alt:'), ['bare', 'captioned']);
assert.deepEqual(
  applyChosen({ seo_title_en: 'Old', seo_title_ar: 'قديم' }, { seo_title_en: 'Chosen' }, ['seo_title_en']),
  { seo_title_en: 'Chosen', seo_title_ar: 'قديم' },
);
assert.deepEqual(draftAfterSave({ id: 'local' }, null, false), { draft: { id: 'local' }, error: true });
assert.deepEqual(draftAfterSave({ id: 'local' }, { id: 'api' }, true), { draft: { id: 'api' }, error: false });
for (const width of [1280, 768, 390]) {
  for (const locale of ['ar', 'en'] as const) {
    const note = viewportNotes(width, locale);
    assert.equal(note.dir, locale === 'ar' ? 'rtl' : 'ltr');
    assert.equal(note.overflowX, 'hidden');
    assert.equal(note.columns, width <= 390 ? '1fr' : 'multi');
  }
}
