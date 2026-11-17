/**
 * CW-10 — Commercial Hero controls + SF/builder wiring.
 * Run: node --experimental-strip-types src/components/store/themeSettings/coffee/coffeeCommercialHeroControls.test.ts
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  blankCommercialHeroFeature,
  blankCommercialHeroSlide,
  commercialHeroShowsOnDevice,
  duplicateCommercialHeroSlide,
  reorderCommercialHeroSlides,
  visibleCommercialHeroFeatures,
  visibleCommercialHeroSlides,
} from '../../../../themes/coffeeRoasters/components/coffeeCommercialHeroLogic.ts';
import { emptyCommercialHero } from '../../../../themes/settings/coffeeModularSettings.ts';

const settings = emptyCommercialHero(true);
assert.equal(commercialHeroShowsOnDevice(settings, 'desktop'), true);
assert.equal(commercialHeroShowsOnDevice({ ...settings, showOnMobile: false }, 'mobile'), false);
assert.deepEqual(visibleCommercialHeroSlides(settings), []);

const slide = blankCommercialHeroSlide({
  titleEn: 'Dual Boiler',
  titleAr: 'غلاية مزدوجة',
  image: 'https://cdn.example/hero.jpg',
  features: [
    blankCommercialHeroFeature({ labelEn: 'Pump', labelAr: 'مضخة', valueEn: '20 bar', valueAr: '٢٠ بار' }),
    blankCommercialHeroFeature({ enabled: false, labelEn: 'Hidden' }),
  ],
});
const withSlide = { ...settings, slides: [slide] };
assert.equal(visibleCommercialHeroSlides(withSlide).length, 1);
assert.equal(visibleCommercialHeroFeatures(slide).length, 1);

const copy = duplicateCommercialHeroSlide(slide);
assert.notEqual(copy.id, slide.id);
assert.match(copy.titleEn, /copy/);

const a = blankCommercialHeroSlide({ titleEn: 'A' });
const b = blankCommercialHeroSlide({ titleEn: 'B' });
const reordered = reorderCommercialHeroSlides([a, b], 0, 1);
assert.equal(reordered[0].id, b.id);
assert.equal(reordered[1].id, a.id);

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeCommercialHeroForm.tsx');
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-commercial-hero-tab/);
assert.match(form, /data-commercial-hero-panel="layout"/);
assert.match(form, /data-commercial-hero-panel="slides"/);
assert.match(form, /data-commercial-hero-edit/);
assert.match(form, /useCoffeeDraft\('commercialHero'\)/);

const sf = readFileSync(
  join(process.cwd(), 'src/themes/coffeeRoasters/components/CoffeeCommercialHeroSection.tsx'),
  'utf8',
);
assert.match(sf, /data-customize-section="C-COMM"/);
assert.match(sf, /visibleCommercialHeroSlides/);

const home = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/HomePage.tsx'), 'utf8');
assert.match(home, /CoffeeCommercialHeroSection/);
assert.match(home, /commercialHero/);

const blocks = readFileSync(
  join(process.cwd(), 'src/components/store/visualBuilder/CoffeeBuilderBlocks.tsx'),
  'utf8',
);
const commercialCase = blocks.split("case 'commercial_hero':")[1]?.split(/case ['"]/)[0] || '';
assert.match(commercialCase, /CoffeeCommercialHeroSection/);
assert.equal(commercialCase.includes('CoffeeFlagshipSection'), false, 'commercial_hero must not render FlagshipThreeJs');

assert.ok(existsSync(join(process.cwd(), 'docs/reference/coffee-widget-ui/17-commercial-hero.png')));
assert.ok(existsSync(join(process.cwd(), 'docs/reference/coffee-widget-ui/17b-hero-banner-extended.png')));

console.log('coffee commercial hero controls ok');
