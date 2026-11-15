/**
 * Node assert suite (same pattern as canvaTextContrast.test.ts).
 * Run: npx tsx src/services/canvaDesignProject.test.ts
 */
import assert from 'node:assert/strict';
import {
  buildCanvaDesignProject,
  isCanvaDesignProject,
  parseCanvaDesignProject,
} from './canvaDesignProject';

const project = buildCanvaDesignProject({
  title: 'KSA Promo',
  width: 1080,
  height: 1080,
  category: 'social',
  backdrop: 'custom',
  customSolidColor: '#ffffff',
  layers: [
    {
      id: 'txt-1',
      type: 'headline',
      text: 'عرض خاص',
      x: 540,
      y: 200,
      fontSize: 48,
      fontColor: '#0f172a',
      textAlign: 'center',
      isBold: true,
    },
    {
      id: 'img-1',
      type: 'image',
      text: 'Layer',
      x: 540,
      y: 540,
      width: 400,
      height: 400,
      fontSize: 16,
      fontColor: '#0f172a',
      imageUrl: 'data:image/png;base64,abc',
      brightness: 110,
      contrast: 105,
    },
  ],
});

assert.equal(project.kind, 'unityteck-canva-studio');
assert.equal(project.layers.length, 2);
assert.equal(isCanvaDesignProject(project), true);

const again = parseCanvaDesignProject(JSON.stringify(project));
assert.equal(again.title, 'KSA Promo');
assert.equal(again.layers[0].text, 'عرض خاص');
assert.equal(again.layers[1].brightness, 110);

assert.throws(() => parseCanvaDesignProject('{'), /PROJECT_JSON_INVALID/);
assert.throws(
  () => parseCanvaDesignProject(JSON.stringify({ kind: 'other' })),
  /PROJECT_JSON_UNSUPPORTED/,
);
assert.throws(
  () =>
    parseCanvaDesignProject(
      JSON.stringify({
        kind: 'unityteck-canva-studio',
        width: 10,
        height: 10,
        layers: [],
      }),
    ),
  /PROJECT_SIZE_INVALID/,
);

console.log('canvaDesignProject.test.ts OK');
