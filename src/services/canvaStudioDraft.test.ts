/**
 * Run: npx tsx src/services/canvaStudioDraft.test.ts
 */
import assert from 'node:assert/strict';

const mem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => {
    mem.set(k, String(v));
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
};

const {
  buildDraftProject,
  canvaDraftScope,
  clearCanvaStudioDraft,
  draftHasWork,
  loadCanvaStudioDraft,
  saveCanvaStudioDraft,
} = await import('./canvaStudioDraft');

const storeId = 'store-test-draft';
const scope = canvaDraftScope({ masterMode: false, editorKind: 'studio', assetId: null });
assert.equal(scope, 'store:studio:blank');

clearCanvaStudioDraft(storeId, scope);
assert.equal(loadCanvaStudioDraft(storeId, scope), null);

const empty = buildDraftProject({
  title: 'Empty',
  width: 1080,
  height: 1080,
  backdrop: 'soft-ivory',
  customSolidColor: '#faf8f5',
  layers: [],
});
const emptyRow = saveCanvaStudioDraft({
  storeId,
  scope,
  selectedTemplateId: 'blank-square',
  project: empty,
});
assert.ok(emptyRow);
assert.equal(draftHasWork(emptyRow), false);

const withLayer = buildDraftProject({
  title: 'Offer',
  width: 1080,
  height: 1080,
  backdrop: 'soft-ivory',
  customSolidColor: '#faf8f5',
  layers: [
    {
      id: 'l1',
      type: 'headline',
      text: 'خصم خاص',
      x: 540,
      y: 200,
      fontSize: 48,
      fontColor: '#0f172a',
    },
  ],
});
saveCanvaStudioDraft({
  storeId,
  scope,
  selectedTemplateId: 'tpl-1',
  project: withLayer,
});

const loaded = loadCanvaStudioDraft(storeId, scope);
assert.ok(loaded);
assert.equal(loaded!.storeId, storeId);
assert.equal(loaded!.project.layers.length, 1);
assert.equal(loaded!.project.layers[0].text, 'خصم خاص');
assert.equal(draftHasWork(loaded), true);

// Cross-tenant isolation
assert.equal(loadCanvaStudioDraft('other-store', scope), null);

clearCanvaStudioDraft(storeId, scope);
assert.equal(loadCanvaStudioDraft(storeId, scope), null);

console.log('canvaStudioDraft.test.ts OK');
