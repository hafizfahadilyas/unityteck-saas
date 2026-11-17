/**
 * CW-14 — #3–7 core section polish (hero / FSB / FP / image / footer).
 * Run: node --experimental-strip-types src/components/store/themeSettings/coffee/coffeeCoreSectionsPolish.test.ts
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const hero = readFileSync(join(root, 'src/components/store/themeSettings/coffee/CoffeeHeroBannersForm.tsx'), 'utf8');
assert.match(hero, /data-hero-tab/);
assert.match(hero, /data-hero-panel="layout"/);
assert.match(hero, /data-hero-panel="style"/);
assert.match(hero, /tabletImage/);
assert.match(hero, /showWhatsapp/);
assert.match(hero, /whatsappEnabled/);
assert.match(hero, /customOrderEnabled/);
assert.equal(hero.includes('bg-[#2563EB]'), false, 'Hero form must use Holst CTA not hardcoded blue');

const sectionForms = readFileSync(join(root, 'src/components/store/themeSettings/coffee/CoffeeSectionForms.tsx'), 'utf8');
assert.match(sectionForms, /data-fsb-panel="heights"/);
assert.match(sectionForms, /data-fsb-panel="overlay"/);
assert.match(sectionForms, /heightDesktop/);
assert.match(sectionForms, /data-fp-panel="sort"/);
assert.match(sectionForms, /sortBy/);
assert.match(sectionForms, /showBuyNow/);
assert.match(sectionForms, /data-img-panel="layout"/);
assert.match(sectionForms, /data-img-panel="overlay"/);
assert.match(sectionForms, /columnsDesktop/);
assert.match(sectionForms, /data-footer-tab="content"/);
assert.match(sectionForms, /data-footer-controls="social"/);

const modular = readFileSync(join(root, 'src/themes/settings/coffeeModularSettings.ts'), 'utf8');
assert.match(modular, /tabletImage\?:/);
assert.match(modular, /FeaturedProductsSort/);
assert.match(modular, /ImageBannersLayout/);
assert.match(modular, /heightDesktop\?:/);

const homeModules = readFileSync(join(root, 'src/themes/coffeeRoasters/components/CoffeeHomeModules.tsx'), 'utf8');
assert.match(homeModules, /images\.layout/);
assert.match(homeModules, /it\.overlay/);

const heroSf = readFileSync(join(root, 'src/themes/coffeeRoasters/components/HeroSlider3D.tsx'), 'utf8');
assert.match(heroSf, /tabletImage/);
assert.match(heroSf, /mobileImage/);

assert.ok(existsSync(join(root, 'docs/reference/coffee-widget-ui/03-hero-banners.png')));
assert.ok(existsSync(join(root, 'docs/reference/coffee-widget-ui/04-featured-section-banners.png')));
assert.ok(existsSync(join(root, 'docs/reference/coffee-widget-ui/05-featured-products.png')));
assert.ok(existsSync(join(root, 'docs/reference/coffee-widget-ui/06-image-banner.png')));
assert.ok(existsSync(join(root, 'docs/reference/coffee-widget-ui/07-footer.png')));
assert.ok(existsSync(join(root, 'docs/reference/coffee-widget-ui/17b-hero-banner-extended.png')));

console.log('coffee core sections polish ok');
