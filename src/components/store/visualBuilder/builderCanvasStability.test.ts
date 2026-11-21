import assert from 'node:assert/strict';
import {
  BLOCK_FLASH_CLASS,
  BLOCK_SELECTED_CLASS,
  builderCanvasRailInset,
  builderRailAsideClass,
  flashBlockSelection,
  scrollBlockIntoCanvasView,
} from './builderCanvasStability.ts';

assert.equal(BLOCK_SELECTED_CLASS, 'vb-block-selected');
assert.equal(BLOCK_FLASH_CLASS, 'vb-block-flash');

const startRail = builderRailAsideClass(true);
assert.match(startRail, /lg:absolute/);
assert.doesNotMatch(startRail, /lg:static/);
assert.match(startRail, /start-0/);

const endRail = builderRailAsideClass(false);
assert.match(endRail, /end-0/);
assert.match(endRail, /lg:absolute/);

assert.deepEqual(
  builderCanvasRailInset({
    leftOpen: true,
    rightOpen: false,
    leftWidth: 280,
    rightWidth: 370,
    singleRail: true,
    desktop: true,
  }),
  { startPx: 280, endPx: 0 },
);
assert.deepEqual(
  builderCanvasRailInset({
    leftOpen: false,
    rightOpen: true,
    leftWidth: 280,
    rightWidth: 370,
    singleRail: true,
    desktop: true,
  }),
  { startPx: 370, endPx: 0 },
);
assert.deepEqual(
  builderCanvasRailInset({
    leftOpen: true,
    rightOpen: true,
    leftWidth: 280,
    rightWidth: 370,
    singleRail: false,
    desktop: true,
  }),
  { startPx: 280, endPx: 370 },
);
assert.deepEqual(
  builderCanvasRailInset({
    leftOpen: true,
    rightOpen: true,
    leftWidth: 280,
    rightWidth: 370,
    singleRail: true,
    desktop: false,
  }),
  { startPx: 0, endPx: 0 },
);

let scrolled = false;
const fakeEl = {
  scrollIntoView(opts: ScrollIntoViewOptions) {
    scrolled = true;
    assert.equal(opts.block, 'nearest');
    assert.equal(opts.inline, 'nearest');
  },
  classList: {
    add() {},
    remove() {},
  },
} as unknown as HTMLElement;

scrollBlockIntoCanvasView(null);
assert.equal(scrolled, false);
scrollBlockIntoCanvasView(fakeEl);
assert.equal(scrolled, true);

flashBlockSelection(null);
flashBlockSelection(fakeEl, 1);

console.log('builder canvas stability ok');
