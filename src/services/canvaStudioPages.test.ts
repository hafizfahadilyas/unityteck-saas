/**
 * Run: npx tsx src/services/canvaStudioPages.test.ts
 */
import assert from 'node:assert/strict';
import {
  defaultPageName,
  insertAfterIndex,
  moveListItem,
  normalizeProjectPages,
  remapLayerIds,
} from './canvaStudioPages';

assert.equal(defaultPageName(0, false), 'Page 1');
assert.equal(defaultPageName(1, true), 'الصفحة 2');

const remapped = remapLayerIds([{ id: 'a' }, { id: 'b' }]);
assert.equal(remapped.length, 2);
assert.notEqual(remapped[0].id, 'a');
assert.ok(remapped[0].id.includes('dup'));

assert.deepEqual(insertAfterIndex(['a', 'b', 'c'], 0, 'x'), ['a', 'x', 'b', 'c']);
assert.deepEqual(moveListItem(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a']);

const single = normalizeProjectPages({
  pages: null,
  activePageId: null,
  isAr: false,
  fallback: {
    backdrop: 'soft-ivory',
    customSolidColor: '#faf8f5',
    layers: [{ id: 'l1', type: 'headline', text: 'Hi', x: 0, y: 0, fontSize: 24, fontColor: '#000' }],
  },
});
assert.equal(single.pages.length, 1);
assert.equal(single.pages[0].layers.length, 1);
assert.equal(single.activePageId, single.pages[0].id);

const multi = normalizeProjectPages({
  pages: [
    {
      id: 'p1',
      name: 'One',
      backdrop: 'a',
      customSolidColor: '#fff',
      layers: [],
    },
    {
      id: 'p2',
      name: 'Two',
      backdrop: 'b',
      customSolidColor: '#000',
      layers: [],
      hidden: true,
    },
  ],
  activePageId: 'p2',
  isAr: false,
  fallback: { backdrop: 'x', customSolidColor: '#fff', layers: [] },
});
assert.equal(multi.activePageId, 'p2');
assert.equal(multi.pages[1].hidden, true);

console.log('canvaStudioPages.test.ts OK');
