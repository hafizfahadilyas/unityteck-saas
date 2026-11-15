/**
 * Run: npx tsx src/services/canvaTimeline.test.ts
 */
import assert from 'node:assert/strict';
import {
  applyEase,
  clipTextByTypeProgress,
  defaultTimelineMs,
  sampleLayerMotion,
} from './canvaTimeline';

assert.equal(applyEase(0, 'linear'), 0);
assert.equal(applyEase(1, 'linear'), 1);
assert.ok(applyEase(0.5, 'easeOut') > 0.5);

assert.equal(clipTextByTypeProgress('Hello', 0), '');
assert.equal(clipTextByTypeProgress('Hello', 1), 'Hello');
assert.equal(clipTextByTypeProgress('Hello', 0.4).length, 2);

const before = sampleLayerMotion(
  { animIn: 'fade', animDurationMs: 500, animDelayMs: 0 },
  0,
  3000,
);
assert.equal(before.visible, false);

const mid = sampleLayerMotion(
  { animIn: 'fade', animDurationMs: 500, animDelayMs: 0 },
  250,
  3000,
);
assert.ok(mid.opacity > 0.2 && mid.opacity < 1);

const hold = sampleLayerMotion(
  { animIn: 'slideUp', animDurationMs: 400, animDelayMs: 100 },
  2000,
  3000,
);
assert.equal(hold.visible, true);
assert.equal(hold.opacity, 1);

const tw = sampleLayerMotion(
  { animIn: 'typewriter', animDurationMs: 1000, animEase: 'linear' },
  500,
  3000,
);
assert.ok(tw.typeProgress > 0.45 && tw.typeProgress < 0.55);

assert.ok(defaultTimelineMs([{ animDelayMs: 1000, animDurationMs: 800 }]) >= 2600);

console.log('canvaTimeline.test.ts OK');
