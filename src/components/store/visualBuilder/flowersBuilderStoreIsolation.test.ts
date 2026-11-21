/**
 * Flowers (store-1) must never get HiBrew coffee widget catalog in page builder.
 */
import assert from 'node:assert/strict';
import {
  getCoffeePageBuilderWidgetCatalog,
  BUILDER_WIDGETS,
} from './widgets/BuilderWidgetLibrary.tsx';

const coffeeCatalog = getCoffeePageBuilderWidgetCatalog();
const coffeeTypes = new Set(coffeeCatalog.map((w) => w.type));
const flowerTypes = new Set(BUILDER_WIDGETS.map((w) => w.type));

assert.equal(coffeeCatalog.length, 18);

for (const t of ['product_section_natural', 'best_sellers', 'discounted_bouquets_3d', 'promo_banners_pair']) {
  assert.ok(flowerTypes.has(t), `flowers widget library must include ${t}`);
  assert.equal(coffeeTypes.has(t), false, `coffee catalog must not include flower type ${t}`);
}

for (const t of ['events_masterclasses', 'commercial_hero', 'product_collection', 'exclusive_benefits']) {
  assert.ok(coffeeTypes.has(t), `coffee catalog must include ${t}`);
  assert.equal(flowerTypes.has(t), false, `flowers default library must not include coffee-only ${t}`);
}

assert.ok(BUILDER_WIDGETS.length > coffeeCatalog.length, 'flowers page builder has wider widget set');

console.log('flowers builder store isolation ok');