import assert from 'node:assert/strict';
import { downscaleDataUrlToPng } from './canvaStudioPreview';

// SSR / no document — passthrough
await downscaleDataUrlToPng('data:image/png;base64,aaaa').then((out) => {
  assert.equal(out, 'data:image/png;base64,aaaa');
});

console.log('canvaStudioPreview.test.ts ok');