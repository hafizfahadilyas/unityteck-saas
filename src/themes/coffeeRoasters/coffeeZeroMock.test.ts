/**
 * DF-01 — Zero-mock: home must not invent hero/events/icons/catalog decorate.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const home = fs.readFileSync(path.join(here, 'components/HomePage.tsx'), 'utf8');
const hero = fs.readFileSync(path.join(here, 'components/HeroSlider3D.tsx'), 'utf8');
const blocks = fs.readFileSync(
  path.join(here, '../../components/store/visualBuilder/CoffeeBuilderBlocks.tsx'),
  'utf8',
);

assert.equal(home.includes('HONOR_EVENTS'), false, 'HomePage must not use HONOR_EVENTS');
assert.equal(home.includes('mixkit.co'), false, 'HomePage must not use Mixkit invent video');
assert.equal(home.includes('Fast Free Express'), false, 'HomePage must not hardcode feature-icon fallback copy');
assert.equal(home.includes('Truck'), false, 'HomePage must not hardcode Truck feature icon');

assert.equal(hero.includes('ORIGINAL_HOME_SLIDES'), false, 'Hero must not keep ORIGINAL_HOME_SLIDES');
assert.equal(
  /fallback = ORIGINAL_HOME_SLIDES/.test(hero),
  false,
  'Hero must not fill merchant gaps from ORIGINAL slides',
);

assert.equal(
  blocks.includes('catalog.slice(0, count)'),
  false,
  'Builder must not decorate category miss with catalog.slice',
);

const perks = fs.readFileSync(path.join(here, 'components/ExclusivePerksBar.tsx'), 'utf8');
assert.equal(perks.includes('coffeeModularSeed'), false, 'ExclusivePerksBar must not seed-decorate empty benefits');

console.log('coffee zero-mock DF-01 ok');
