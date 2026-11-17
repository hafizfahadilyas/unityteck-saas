/**
 * CW-05 — Events & Masterclasses: empty, large/small split, reorder.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { EventsMasterclassesSettings } from '../../../../themes/settings/coffeeModularSettings.ts';
import { emptyEventsMasterclasses } from '../../../../themes/settings/coffeeModularSettings.ts';
import {
  EVENTS_MAX_ITEMS,
  blankEventItem,
  duplicateEvent,
  reorderEvents,
  splitLargeSmall,
  visibleEvents,
} from '../../../../themes/coffeeRoasters/components/coffeeEventsLogic.ts';

const base: EventsMasterclassesSettings = {
  ...emptyEventsMasterclasses(true),
  titleEn: 'Events',
  titleAr: 'فعاليات',
  events: [
    blankEventItem({ id: '1', cardSize: 'large', titleEn: 'Masterclass', titleAr: 'ورشة', image: 'https://cdn.example/a.jpg' }),
    blankEventItem({ id: '2', cardSize: 'small', titleEn: 'Workshop', titleAr: 'دورة', image: 'https://cdn.example/b.jpg' }),
    blankEventItem({ id: '3', cardSize: 'small', titleEn: '', titleAr: '', image: '', enabled: true }),
    blankEventItem({ id: '4', cardSize: 'small', titleEn: 'Hidden', enabled: false, image: 'https://cdn.example/c.jpg' }),
  ],
};

assert.equal(EVENTS_MAX_ITEMS, 10);
assert.equal(visibleEvents(base).length, 2);
assert.equal(visibleEvents({ ...base, enabled: false }).length, 0);
assert.equal(visibleEvents(emptyEventsMasterclasses(true)).length, 0);

const { large, small } = splitLargeSmall(visibleEvents(base));
assert.equal(large?.id, '1');
assert.equal(small.length, 1);
assert.equal(small[0].id, '2');

const reordered = reorderEvents(base.events, 0, 2);
assert.deepEqual(reordered.map((e) => e.id), ['2', '3', '1', '4']);
const copy = duplicateEvent(base.events[0]);
assert.notEqual(copy.id, '1');
assert.equal(copy.titleEn, 'Masterclass');

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeEventsForm.tsx');
assert.ok(existsSync(formPath));
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-events-tab/);
assert.match(form, /data-events-panel="layout"/);
assert.match(form, /GlobalModal/);

const home = readFileSync(join(process.cwd(), 'src/themes/coffeeRoasters/components/HomePage.tsx'), 'utf8');
assert.match(home, /CoffeeEventsSection/);
assert.equal(home.includes('HONOR_EVENTS'), false);
assert.equal(home.includes('mixkit.co'), false);

console.log('coffee events controls ok');
