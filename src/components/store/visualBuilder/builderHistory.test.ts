import assert from 'node:assert/strict';
import {
  isClipboardShortcut,
  isHistoryShortcut,
  pushHistory,
  redoHistory,
  seedHistory,
  undoHistory,
} from './builderHistory.ts';
import { blocksFromLayout, builderPageMeta } from './builderPages.ts';

const treeA = [{ id: 'header' }];
const treeB = [{ id: 'hero' }];
let state = seedHistory(treeA);
state = pushHistory(state, treeB, (a, b) => a === b);
const undone = undoHistory(state);
assert.deepEqual(undone.stack[undone.index], treeA);
const redone = redoHistory(undone);
assert.deepEqual(redone.stack[redone.index], treeB);
assert.equal(
  isHistoryShortcut({ key: 'z', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }),
  'undo',
);
assert.equal(
  isHistoryShortcut({ key: 'z', ctrlKey: true, metaKey: false, shiftKey: true, altKey: false }),
  'redo',
);
assert.equal(
  isClipboardShortcut({ key: 'c', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }),
  'copy',
);
assert.equal(
  isClipboardShortcut({ key: 'v', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }),
  'paste',
);
assert.equal(
  isClipboardShortcut({ key: 'd', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }),
  'duplicate',
);
assert.equal(builderPageMeta('catalog').slug, 'shop');
assert.equal(builderPageMeta('home').type, 'home');
assert.deepEqual(blocksFromLayout({ blocks: treeB }), treeB);
assert.equal(blocksFromLayout({ sections: [] }), null);
console.log('builder history ok');
