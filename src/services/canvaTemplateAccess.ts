/**
 * Canva template Free/Pro unlock — mirrors API Plans + Master override.
 * Free/Paid: first N per category within store niche pack (default 5). Pro / masterGrantedPro: all.
 */

import type { Store } from '../types';
import { effectivePlanCode } from '../auth/plans';
import {
  CANVA_FREE_TEMPLATES_PER_CATEGORY,
  type CanvaDesignTemplate,
  type CanvaTemplateCategory,
  listCanvaTemplatesByCategory,
  listCanvaTemplatesForStore,
  resolveStoreCanvaNiche,
} from '../data/ksaCanvaTemplates';

type StoreCanvaAccess = Pick<
  Store,
  'id' | 'slug' | 'name' | 'category' | 'plan' | 'masterGrantedPro' | 'canvaTemplatesPerCategory'
>;

export function resolveCanvaTemplatesPerCategory(
  store: Pick<Store, 'plan' | 'masterGrantedPro' | 'canvaTemplatesPerCategory'>,
): number | null {
  const effective = effectivePlanCode(store);
  if (effective === 'pro' || effective === 'premium' || effective === 'custom') {
    return null; // unlimited catalog
  }
  const override = store.canvaTemplatesPerCategory;
  if (typeof override === 'number' && override > 0) {
    return override;
  }
  return CANVA_FREE_TEMPLATES_PER_CATEGORY;
}

function siblingsForUnlock(
  template: CanvaDesignTemplate,
  store: StoreCanvaAccess,
): CanvaDesignTemplate[] {
  const niche = resolveStoreCanvaNiche(store);
  return listCanvaTemplatesByCategory(template.category).filter(
    (t) =>
      t.niche !== 'blank' &&
      (t.niche === niche || t.niche === 'general'),
  );
}

export function isCanvaTemplateUnlocked(
  template: CanvaDesignTemplate,
  store: StoreCanvaAccess,
): boolean {
  // Blank canvases are always free for every store
  if (template.niche === 'blank' || (template.tier === 'free' && template.sort === 0)) {
    return true;
  }
  const limit = resolveCanvaTemplatesPerCategory(store);
  if (limit === null) return true;
  if (template.tier === 'pro') return false;
  const siblings = siblingsForUnlock(template, store);
  const index = siblings.findIndex((t) => t.id === template.id);
  if (index < 0) {
    // Other niche (e.g. flowers pack while on coffee) — still allow free tier by sort
    return template.tier === 'free' && template.sort <= limit;
  }
  return index < limit;
}

export function countUnlockedInCategory(
  category: CanvaTemplateCategory,
  store: StoreCanvaAccess,
): { unlocked: number; total: number; limit: number | null } {
  const all = listCanvaTemplatesForStore(store, category).filter((t) => t.niche !== 'blank');
  const blanks = listCanvaTemplatesForStore(store, category).filter((t) => t.niche === 'blank');
  const limit = resolveCanvaTemplatesPerCategory(store);
  if (limit === null) {
    return {
      unlocked: all.length + blanks.length,
      total: all.length + blanks.length,
      limit: null,
    };
  }
  const unlockedPaid = Math.min(limit, all.length);
  return {
    unlocked: unlockedPaid + blanks.length,
    total: all.length + blanks.length,
    limit,
  };
}
