/**
 * Design Studio multi-page (Canva-style) — blank / duplicate / hide / lock / reorder.
 * Active page layers stay in the editor; other pages live in this snapshot list.
 */

import type { CanvaProjectLayer, CanvaStudioPageJson } from './canvaDesignProject';

export type { CanvaStudioPageJson };

export function newStudioPageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultPageName(index: number, isAr: boolean): string {
  return isAr ? `الصفحة ${index + 1}` : `Page ${index + 1}`;
}

export function remapLayerIds<T extends { id: string }>(layers: T[]): T[] {
  const stamp = Date.now();
  return layers.map((layer, idx) => ({
    ...layer,
    id: `${layer.id}-dup-${stamp}-${idx}`,
  }));
}

export function insertAfterIndex<T>(list: T[], index: number, item: T): T[] {
  const i = Math.max(0, Math.min(index, list.length - 1));
  return [...list.slice(0, i + 1), item, ...list.slice(i + 1)];
}

export function moveListItem<T>(list: T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) {
    return list;
  }
  const next = [...list];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function normalizeProjectPages(input: {
  pages?: CanvaStudioPageJson[] | null;
  activePageId?: string | null;
  fallback: Omit<CanvaStudioPageJson, 'id' | 'name'> & { id?: string; name?: string };
  isAr: boolean;
}): { pages: CanvaStudioPageJson[]; activePageId: string } {
  const raw = Array.isArray(input.pages) ? input.pages.filter((p) => p && Array.isArray(p.layers)) : [];
  if (raw.length === 0) {
    const id = input.fallback.id || newStudioPageId();
    const page: CanvaStudioPageJson = {
      id,
      name: input.fallback.name || defaultPageName(0, input.isAr),
      locked: false,
      hidden: false,
      backdrop: input.fallback.backdrop,
      customSolidColor: input.fallback.customSolidColor,
      product: input.fallback.product,
      filters: input.fallback.filters,
      bgRemoved: input.fallback.bgRemoved ?? false,
      bgTolerance: input.fallback.bgTolerance ?? 38,
      layers: input.fallback.layers || ([] as CanvaProjectLayer[]),
    };
    return { pages: [page], activePageId: id };
  }
  const pages = raw.map((p, idx) => ({
    ...p,
    id: String(p.id || newStudioPageId()),
    name: String(p.name || defaultPageName(idx, input.isAr)).slice(0, 80),
    locked: Boolean(p.locked),
    hidden: Boolean(p.hidden),
    layers: Array.isArray(p.layers) ? p.layers : [],
  }));
  const active =
    (input.activePageId && pages.find((p) => p.id === input.activePageId)?.id) || pages[0].id;
  return { pages, activePageId: active };
}
