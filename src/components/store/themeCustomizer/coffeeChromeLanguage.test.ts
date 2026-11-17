/**
 * CT-02 / CT-08 — Coffee customizer + widget chrome: AR strings must not embed Latin words.
 * CT-03 — Announcement CTA locale pick (mirrors announcementButtonLabel).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COFFEE_CUSTOMIZER_SECTIONS } from './coffeeCustomizerCatalog.ts';

const LATIN = /[A-Za-z]{2,}/;
const here = path.dirname(fileURLToPath(import.meta.url));

for (const section of COFFEE_CUSTOMIZER_SECTIONS) {
  assert.equal(LATIN.test(section.titleAr), false, `titleAr mix: ${section.id} → ${section.titleAr}`);
  assert.equal(LATIN.test(section.descAr), false, `descAr mix: ${section.id} → ${section.descAr}`);
  assert.ok(section.titleEn.trim(), `titleEn empty: ${section.id}`);
  assert.ok(section.descEn.trim(), `descEn empty: ${section.id}`);
}

function assertTitleArFileClean(relFromHere: string) {
  const full = path.resolve(here, relFromHere);
  const text = fs.readFileSync(full, 'utf8');
  const re = /titleAr:\s*'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const ar = m[1];
    assert.equal(LATIN.test(ar), false, `${path.basename(full)} titleAr mix: ${ar}`);
  }
}

assertTitleArFileClean('../visualBuilder/widgets/BuilderWidgetLibrary.tsx');
assertTitleArFileClean('./coffeeCustomizerCatalog.ts');

function announcementButtonLabel(
  bar: { buttonText?: string; buttonTextEn?: string; buttonTextAr?: string },
  locale: 'ar' | 'en',
): string {
  if (locale === 'ar') return (bar.buttonTextAr || bar.buttonText || '').trim();
  return (bar.buttonTextEn || bar.buttonText || '').trim();
}

assert.equal(
  announcementButtonLabel(
    { buttonText: 'Shop Now', buttonTextEn: 'Shop Now', buttonTextAr: 'تسوق الآن' },
    'ar',
  ),
  'تسوق الآن',
);
assert.equal(
  announcementButtonLabel(
    { buttonText: 'Shop Now', buttonTextEn: 'Shop Now', buttonTextAr: 'تسوق الآن' },
    'en',
  ),
  'Shop Now',
);
assert.equal(announcementButtonLabel({ buttonText: '', buttonTextEn: '', buttonTextAr: '' }, 'ar'), '');

console.log('coffee chrome language + announcement CTA ok');
