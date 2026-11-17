/**
 * CW-07 — Model Comparison: empty, select one, sync specs, form gates.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emptyModelComparison } from '../../../../themes/settings/coffeeModularSettings.ts';
import {
  MODEL_COMPARISON_MAX_MODELS,
  MODEL_COMPARISON_MAX_SPECS,
  blankModel,
  blankSpec,
  modelComparisonShowsOnDevice,
  removeModelKeepingSpecs,
  reorderModels,
  selectModel,
  syncSpecValuesToModels,
  visibleModels,
  visibleSpecs,
} from '../../../../themes/coffeeRoasters/components/coffeeModelComparisonLogic.ts';

assert.equal(MODEL_COMPARISON_MAX_MODELS, 6);
assert.equal(MODEL_COMPARISON_MAX_SPECS, 20);

const off = emptyModelComparison(false);
assert.equal(visibleModels(off).length, 0);
assert.equal(modelComparisonShowsOnDevice(off, 'desktop'), false);

const base = emptyModelComparison(true);
assert.equal(visibleModels(base).length, 0);

const models = [
  blankModel({ id: 'm1', nameEn: 'H10', enabled: true, selected: true }),
  blankModel({ id: 'm2', nameEn: 'G5', enabled: false }),
  blankModel({ id: 'm3', nameEn: '', nameAr: '', image: '', productId: '', enabled: true }),
  blankModel({ id: 'm4', nameAr: 'ماكينة', enabled: true }),
];
assert.deepEqual(
  visibleModels({ ...base, models }).map((m) => m.id),
  ['m1', 'm4'],
);

const selected = selectModel(models, 'm4');
assert.equal(selected.find((m) => m.id === 'm4')?.selected, true);
assert.equal(selected.find((m) => m.id === 'm1')?.selected, false);

let specs = [blankSpec(['m1', 'm4'], { id: 's1', nameEn: 'Pressure' })];
specs[0].values.m1 = { valueEn: '20 bar', valueAr: '20 بار' };
specs = syncSpecValuesToModels(specs, [models[0], { ...models[3], id: 'm5', nameEn: 'New' }]);
assert.ok(specs[0].values.m5);
assert.equal(specs[0].values.m1.valueEn, '20 bar');
assert.equal(Object.prototype.hasOwnProperty.call(specs[0].values, 'm4'), false);

const pair = [models[0], models[3]];
const pairSpecs = syncSpecValuesToModels([blankSpec(['m1', 'm4'], { id: 's2', nameEn: 'Tank' })], pair);
const removed = removeModelKeepingSpecs(pair, pairSpecs, 'm1');
assert.equal(removed.models.map((m) => m.id).join(','), 'm4');
assert.equal(Object.prototype.hasOwnProperty.call(removed.specs[0].values, 'm1'), false);
assert.ok(removed.specs[0].values.m4);

assert.deepEqual(reorderModels(models.slice(0, 3), 0, 2).map((m) => m.id), ['m2', 'm3', 'm1']);
assert.equal(visibleSpecs({ ...base, specs: [blankSpec([], { id: 'x', nameEn: '' })] }).length, 0);
assert.equal(modelComparisonShowsOnDevice({ ...base, showOnMobile: false }, 'mobile'), false);

const formPath = join(process.cwd(), 'src/components/store/themeSettings/coffee/CoffeeModelComparisonForm.tsx');
assert.ok(existsSync(formPath));
const form = readFileSync(formPath, 'utf8');
assert.match(form, /data-model-comparison-tab/);
assert.match(form, /data-model-comparison-panel="models"/);
assert.match(form, /data-model-comparison-panel="specs"/);
assert.match(form, /data-model-comparison-edit-model/);
assert.match(form, /data-model-comparison-edit-spec/);
assert.match(form, /GlobalModal/);

const sfPath = join(process.cwd(), 'src/themes/coffeeRoasters/components/CoffeeModelComparisonSection.tsx');
assert.ok(existsSync(sfPath));
assert.match(readFileSync(sfPath, 'utf8'), /data-customize-section="C-CMP"/);

const refPath = join(process.cwd(), 'docs/reference/coffee-widget-ui/14-model-comparison.png');
assert.ok(existsSync(refPath), 'CW-07 ref PNG missing');

console.log('coffee model comparison controls ok');
