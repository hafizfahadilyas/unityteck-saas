import { apiFetch, isApiEnabled } from '../api/client';
import type { Store } from '../types';
import {
  listCanvaTemplatesForStore,
  type CanvaDesignTemplate,
  type CanvaTemplateCategory,
} from '../data/ksaCanvaTemplates';
import { isCanvaTemplateUnlocked } from './canvaTemplateAccess';

export type DailyTemplatePick = {
  date: string;
  category: CanvaTemplateCategory;
  per_day: number;
  start_index: number;
};

/** Client fallback when API off — same algorithm as Laravel KsaCanvaTemplateCatalog. */
function localDailyPick(storeId: string, category: CanvaTemplateCategory, date: string): DailyTemplatePick {
  const seed = `${storeId}|${date}|${category}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return {
    date,
    category,
    per_day: 5,
    start_index: hash % 97,
  };
}

export async function fetchDailyTemplatePick(
  storeId: string,
  category: CanvaTemplateCategory,
  dateYmd?: string,
): Promise<DailyTemplatePick> {
  const date = dateYmd || new Date().toISOString().slice(0, 10);
  if (!isApiEnabled()) {
    return localDailyPick(storeId, category, date);
  }
  try {
    const res = await apiFetch<{
      data: DailyTemplatePick & { store_id?: string };
    }>(`/design-templates/daily?category=${encodeURIComponent(category)}&date=${encodeURIComponent(date)}`, {
      storeId,
    });
    if (res.data?.per_day) {
      return {
        date: res.data.date || date,
        category: (res.data.category as CanvaTemplateCategory) || category,
        per_day: res.data.per_day,
        start_index: res.data.start_index ?? 0,
      };
    }
  } catch {
    /* fallback */
  }
  return localDailyPick(storeId, category, date);
}

export function resolveDailyTemplates(
  store: Pick<Store, 'id' | 'slug' | 'name' | 'category' | 'plan' | 'masterGrantedPro' | 'canvaTemplatesPerCategory'>,
  category: CanvaTemplateCategory,
  pick: DailyTemplatePick,
): CanvaDesignTemplate[] {
  const pool = listCanvaTemplatesForStore(store, category).filter((t) => t.niche !== 'blank');
  if (pool.length === 0) return [];
  const out: CanvaDesignTemplate[] = [];
  const n = pool.length;
  for (let i = 0; i < pick.per_day; i++) {
    const idx = (pick.start_index + i) % n;
    const tpl = pool[idx];
    if (tpl && isCanvaTemplateUnlocked(tpl, store)) {
      out.push(tpl);
    }
  }
  return out;
}
