import assert from 'node:assert/strict';
import {
  applyChromeSafeDrop,
  applyDrop,
  blocksForPublish,
  clampInsertIndexForChrome,
  columnTemplate,
  countVisibleH1,
  cloneBlockWithNewIds,
  createCoalescedSaver,
  duplicateBlock,
  duplicateBlockChromeSafe,
  isFixedChromeBlock,
  moveBlock,
  moveBlockChromeSafe,
  nestIntoColumns,
  pasteBlockChromeSafe,
  removeBlock,
  removeBlockChromeSafe,
  resolveMediaAssetUrl,
  rowSection,
  snapshotBlockForClipboard,
  stripHeavyDataUrls,
  widgetPosition,
  withVisibility,
} from './builderInteractions.ts';
import {
  isClipboardShortcut,
  pushHistory,
  redoHistory,
  seedHistory,
  undoHistory,
} from './builderHistory.ts';
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

// CT-01: top bar / navbar / footer fixed chrome
assert.equal(isFixedChromeBlock({ type: 'announcement', id: 'announcement' }), true);
assert.equal(isFixedChromeBlock({ type: 'header', id: 'header' }), true);
assert.equal(isFixedChromeBlock({ type: 'navbar', id: 'navbar' }), true);
assert.equal(isFixedChromeBlock({ type: 'footer', id: 'footer' }), true);
assert.equal(isFixedChromeBlock({ type: 'hero_banners', id: 'hero' }), false);

const chromeTree = [
  { id: 'announcement', type: 'announcement' },
  { id: 'header', type: 'header' },
  { id: 'hero', type: 'hero_banners' },
  { id: 'products', type: 'featured_products' },
  { id: 'footer', type: 'footer' },
];
assert.equal(applyChromeSafeDrop(chromeTree, 0, 2).accepted, false);
assert.equal(applyChromeSafeDrop(chromeTree, 4, 2).accepted, false);
assert.equal(applyChromeSafeDrop(chromeTree, 2, 0).accepted, false);
const bodyDrop = applyChromeSafeDrop(chromeTree, 2, 3);
assert.equal(bodyDrop.accepted, true);
assert.deepEqual(bodyDrop.items.map((b) => b.id), ['announcement', 'header', 'products', 'hero', 'footer']);
assert.equal(moveBlockChromeSafe(chromeTree, 'header', 1), chromeTree);
assert.deepEqual(
  moveBlockChromeSafe(chromeTree, 'hero', 1).map((b) => b.id),
  ['announcement', 'header', 'products', 'hero', 'footer'],
);
assert.equal(duplicateBlockChromeSafe(chromeTree, 'footer', 'footer_copy').length, chromeTree.length);
assert.equal(snapshotBlockForClipboard(chromeTree, 'footer'), null);
assert.equal(snapshotBlockForClipboard(chromeTree, 'announcement'), null);
const clipHero = snapshotBlockForClipboard(chromeTree, 'hero');
assert.ok(clipHero);
assert.equal(clipHero!.id, 'hero');
assert.notEqual(clipHero, chromeTree[2]);
const pasted = pasteBlockChromeSafe(chromeTree, clipHero, 'hero_paste', 'hero');
assert.deepEqual(
  pasted.map((b) => b.id),
  ['announcement', 'header', 'hero', 'hero_paste', 'products', 'footer'],
);
assert.equal(pasteBlockChromeSafe(chromeTree, { id: 'x', type: 'footer' }, 'x2').length, chromeTree.length);
const nestedClone = cloneBlockWithNewIds(
  { id: 'row', columns: [{ id: 'old-c0', widgets: [{ id: 'old-w0' }] }] },
  'row_new',
);
assert.equal(nestedClone.id, 'row_new');
assert.equal(nestedClone.columns[0].id, 'row_new-c0');
assert.equal((nestedClone.columns[0].widgets[0] as { id: string }).id, 'row_new-c0-w0');
assert.equal(
  isClipboardShortcut({ key: 'c', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }),
  'copy',
);
assert.equal(
  isClipboardShortcut({ key: 'v', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }),
  'paste',
);
assert.equal(
  isClipboardShortcut({ key: 'd', metaKey: true, ctrlKey: false, shiftKey: false, altKey: false }),
  'duplicate',
);
assert.equal(removeBlockChromeSafe(chromeTree, 'announcement').length, chromeTree.length);
assert.equal(removeBlockChromeSafe(chromeTree, 'hero').length, 4);
assert.equal(clampInsertIndexForChrome(chromeTree, 0), 2);
assert.equal(clampInsertIndexForChrome(chromeTree, 99), 4);
assert.equal(clampInsertIndexForChrome(chromeTree, 3), 3);

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

const heavy = `data:image/png;base64,${'A'.repeat(9000)}`;
assert.equal(stripHeavyDataUrls({ image: heavy, ok: 'https://cdn.example/a.jpg' }).image, '');
assert.equal(stripHeavyDataUrls({ image: heavy, ok: 'https://cdn.example/a.jpg' }).ok, 'https://cdn.example/a.jpg');
assert.equal(resolveMediaAssetUrl({ optimizedUrl: '', originalUrl: '', thumbnailUrl: 'https://cdn.example/t.jpg' }), 'https://cdn.example/t.jpg');
assert.equal(resolveMediaAssetUrl({ optimizedUrl: heavy, originalUrl: 'https://cdn.example/a.jpg' }), 'https://cdn.example/a.jpg');
assert.equal(resolveMediaAssetUrl({ optimizedUrl: '', originalUrl: heavy }), '');
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
