import assert from 'node:assert/strict';
import {
  applyDrop,
  blocksForPublish,
  columnTemplate,
  countVisibleH1,
  createCoalescedSaver,
  duplicateBlock,
  moveBlock,
  nestIntoColumns,
  removeBlock,
  rowSection,
  widgetPosition,
  withVisibility,
} from './builderInteractions.ts';
import { pushHistory, redoHistory, seedHistory, undoHistory } from './builderHistory.ts';
import { stashPageDraft } from './builderPages.ts';

const row = rowSection('25-25-50', 'sec-1');
const reloaded = JSON.parse(JSON.stringify(row));
assert.equal(reloaded.columns.length, 3);
assert.equal(reloaded.columns[2].width, '50%');
assert.equal(rowSection('4', 'sec-4').columns.length, 4);
assert.equal(columnTemplate('4', 390), '1fr');
assert.equal(columnTemplate('25-25-50', 1280), '25% 25% 50%');
assert.equal(widgetPosition({}), 'relative');
assert.equal(widgetPosition({ overlap: true }), 'absolute');

const dropped = applyDrop(['a', 'b', 'c'], 0, 2);
assert.deepEqual(dropped.items, ['b', 'c', 'a']);
assert.equal(applyDrop(['a'], 0, 5).accepted, false);
assert.equal(applyDrop(['a'], 0, 5).items[0], 'a');

const nested = nestIntoColumns({ 0: [] }, 2, 1, { id: 'w1' });
assert.equal(nested.accepted, true);
assert.equal(nested.columnsData[1][0].id, 'w1');
const snapped = nestIntoColumns({ 0: [{ id: 'keep' }] }, 1, 4, { id: 'nope' });
assert.equal(snapped.accepted, false);
assert.equal(snapped.columnsData[0][0].id, 'keep');

const copied = duplicateBlock([{ id: 'a', title: 'Hero' }], 'a', 'a-copy');
assert.equal(copied[1].id, 'a-copy');
assert.notEqual(copied[0].id, copied[1].id);
assert.deepEqual(moveBlock(copied, 'a-copy', -1).map((item) => item.id), ['a-copy', 'a']);
assert.equal(removeBlock(copied, 'a').length, 1);

const hidden = withVisibility({ id: 'x', visible: true }, { visible: false, visibleMobile: false });
assert.equal(blocksForPublish([hidden, { id: 'y', visible: true }]).length, 1);
assert.equal(countVisibleH1([
  { type: 'heading', settings: { tag: 'h1', textEn: 'One' } },
  { type: 'heading', visible: false, settings: { tag: 'h1', textEn: 'Hidden' } },
  { type: 'heading', settings: { htmlTag: 'h3', textEn: 'Three' } },
]), 1);
assert.equal(countVisibleH1([{ type: 'heading', settings: { tag: 'h2' } }]), 0);

const home = [{ id: 'a', visible: true }, { id: 'b', visible: true }];
const matrixDropped = applyDrop(home, 0, 1);
assert.equal(matrixDropped.accepted, true);
const matrixHidden = withVisibility(matrixDropped.items[0], { visible: false });
assert.equal(matrixHidden.visible, false);
const matrixCopied = duplicateBlock(matrixDropped.items, 'b', 'b-copy');
assert.equal(matrixCopied.length, 3);
const moved = moveBlock(matrixCopied, 'b-copy', -1);
const ids = moved.map((block) => block.id);
assert.equal(new Set(ids).size, ids.length);
let history = seedHistory(home);
history = pushHistory(history, moved, (a, b) => JSON.stringify(a) === JSON.stringify(b));
const undone = undoHistory(history);
assert.deepEqual(undone.stack[undone.index], home);
const redone = redoHistory(undone);
assert.deepEqual(redone.stack[redone.index], moved);
const pages = stashPageDraft({}, 'home', moved);
const switched = stashPageDraft(pages, 'custom', [{ id: 'c', visible: true }]);
const matrixReloaded = JSON.parse(JSON.stringify(switched.home));
assert.deepEqual(matrixReloaded, moved);
assert.notDeepEqual(switched.custom, switched.home);
assert.equal(columnTemplate('4', 390), '1fr');
assert.equal(columnTemplate('4', 768), 'repeat(4, 1fr)');
assert.equal(columnTemplate('4', 1280), 'repeat(4, 1fr)');

const saver = createCoalescedSaver(30, () => {});
saver.push();
saver.push();
saver.push();
setTimeout(() => {
  assert.equal(saver.puts, 1);
  console.log('builder interactions ok');
}, 80);
