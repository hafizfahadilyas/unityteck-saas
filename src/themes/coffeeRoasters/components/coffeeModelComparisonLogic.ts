/** Pure Model Comparison helpers — node-test safe. */

import type {
  ModelComparisonModel,
  ModelComparisonSettings,
  ModelComparisonSpec,
  ModelComparisonSpecValue,
} from '../../settings/coffeeModularSettings';

export const MODEL_COMPARISON_MAX_MODELS = 6;
export const MODEL_COMPARISON_MAX_SPECS = 20;

export type ModelComparisonDevice = 'desktop' | 'tablet' | 'mobile';

export function blankModel(partial?: Partial<ModelComparisonModel>): ModelComparisonModel {
  return {
    id: `mdl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    enabled: true,
    productId: '',
    image: '',
    nameEn: '',
    nameAr: '',
    price: null,
    buttonEn: 'Select Model',
    buttonAr: 'اختر الموديل',
    selected: false,
    ...partial,
  };
}

export function blankSpec(
  modelIds: string[] = [],
  partial?: Partial<ModelComparisonSpec>,
): ModelComparisonSpec {
  const values: Record<string, ModelComparisonSpecValue> = {};
  for (const id of modelIds) {
    values[id] = { valueEn: '', valueAr: '' };
  }
  return {
    id: `spc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    enabled: true,
    nameEn: '',
    nameAr: '',
    values,
    ...partial,
  };
}

export function reorderModels(
  models: ModelComparisonModel[],
  from: number,
  to: number,
): ModelComparisonModel[] {
  if (from === to || from < 0 || to < 0 || from >= models.length || to >= models.length) return models;
  const next = [...models];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function reorderSpecs(
  specs: ModelComparisonSpec[],
  from: number,
  to: number,
): ModelComparisonSpec[] {
  if (from === to || from < 0 || to < 0 || from >= specs.length || to >= specs.length) return specs;
  const next = [...specs];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function modelHasContent(model: ModelComparisonModel): boolean {
  return Boolean(
    (model.nameEn || '').trim() ||
      (model.nameAr || '').trim() ||
      (model.image || '').trim() ||
      (model.productId || '').trim(),
  );
}

export function visibleModels(
  settings: ModelComparisonSettings | null | undefined,
): ModelComparisonModel[] {
  if (!settings || settings.enabled === false) return [];
  return (settings.models || []).filter((m) => m.enabled !== false && modelHasContent(m));
}

export function visibleSpecs(
  settings: ModelComparisonSettings | null | undefined,
): ModelComparisonSpec[] {
  if (!settings || settings.enabled === false) return [];
  return (settings.specs || []).filter(
    (s) => s.enabled !== false && Boolean((s.nameEn || '').trim() || (s.nameAr || '').trim()),
  );
}

export function modelComparisonShowsOnDevice(
  settings: ModelComparisonSettings | null | undefined,
  device: ModelComparisonDevice,
): boolean {
  if (!settings || settings.enabled === false) return false;
  if (device === 'desktop') return settings.showOnDesktop !== false;
  if (device === 'tablet') return settings.showOnTablet !== false;
  return settings.showOnMobile !== false;
}

/** Only one selected model at a time. */
export function selectModel(
  models: ModelComparisonModel[],
  selectedId: string,
): ModelComparisonModel[] {
  return models.map((m) => ({ ...m, selected: m.id === selectedId }));
}

/** Keep spec values keyed only to current model ids. */
export function syncSpecValuesToModels(
  specs: ModelComparisonSpec[],
  models: ModelComparisonModel[],
): ModelComparisonSpec[] {
  const ids = models.map((m) => m.id);
  return specs.map((spec) => {
    const values: Record<string, ModelComparisonSpecValue> = {};
    for (const id of ids) {
      values[id] = spec.values?.[id] || { valueEn: '', valueAr: '' };
    }
    return { ...spec, values };
  });
}

export function removeModelKeepingSpecs(
  models: ModelComparisonModel[],
  specs: ModelComparisonSpec[],
  modelId: string,
): { models: ModelComparisonModel[]; specs: ModelComparisonSpec[] } {
  const nextModels = models.filter((m) => m.id !== modelId);
  return {
    models: nextModels,
    specs: syncSpecValuesToModels(specs, nextModels),
  };
}

export function specValueFor(
  spec: ModelComparisonSpec,
  modelId: string,
  lang: 'ar' | 'en',
): string {
  const cell = spec.values?.[modelId];
  if (!cell) return '';
  return (lang === 'ar' ? cell.valueAr : cell.valueEn) || '';
}
