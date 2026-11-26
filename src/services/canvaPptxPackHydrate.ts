/**
 * Hydrate Master-distributed PPTX packs into per-store IndexedDB My Templates.
 * Source of truth: Hostinger `store_studio_designs` (store_id isolated).
 *
 * SPEED RULE: never download full layer JSON for every pack on home open.
 * Home = lean stubs (list API, page size 10). Click = fetch ONE full design by id.
 * Public `/pptx-studio-pack` (~200MB) is opt-in only — never auto on mount.
 */

import type { CanvaTemplateCategory } from '../data/ksaCanvaTemplates';
import type { ImportedStudioLayer } from './canvaPsdImport';
import { getStudioDesign, listStudioDesignsPaged } from './storeStudioDesigns';
import {
  listMyCanvaTemplates,
  saveMyCanvaTemplate,
  saveManyMyCanvaTemplates,
  type CanvaMyTemplate,
} from './canvaMyTemplates';
import { MASTER_MEDIA_STORE_ID } from './masterCanvaDistribute';
import { optimizeHomeThumb } from './canvaStudioPreview';
import { resolveDesignTitle } from './canvaTemplateTitles';

const PACK_INDEX_URL = '/pptx-studio-pack/index.json';
const DEFAULT_HOME_PAGE_SIZE = 10;

type PackIndexItem = {
  packKey: string;
  nameEn: string;
  nameAr: string;
  width: number;
  height: number;
  category: CanvaTemplateCategory | string;
  layerCount: number;
  file: string;
};

type PackFile = {
  packKey: string;
  name?: string;
  nameEn?: string;
  nameAr?: string;
  width: number;
  height: number;
  category: CanvaTemplateCategory | string;
  layers: ImportedStudioLayer[];
  previewDataUrl?: string;
};

function asCategory(raw: string | undefined): CanvaTemplateCategory {
  const c = String(raw || 'social');
  if (c === 'banner' || c === 'social' || c === 'ads' || c === 'logo' || c === 'product' || c === 'category') {
    return c;
  }
  return 'social';
}

function templateIdFor(storeId: string, packKey: string): string {
  return `mytpl-pptx-${storeId}-${packKey}`.slice(0, 120);
}

function isPptxApiRow(row: {
  id: string;
  source?: string;
  design_json?: Record<string, unknown>;
}): boolean {
  const dj = row.design_json || {};
  return (
    Boolean(dj.fromPptxPack) ||
    row.source === 'master' ||
    row.source === 'pptx' ||
    String(row.id || '').startsWith('dsd-pptx-')
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function upsertPack(
  storeId: string,
  pack: PackFile,
  fromMaster: boolean,
  fixedId?: string,
): Promise<boolean> {
  if (!storeId || !pack?.layers?.length) return false;
  const packKey = pack.packKey || 'pack';
  const id = fixedId || templateIdFor(storeId, packKey);
  const existing = await listMyCanvaTemplates(storeId);
  const already = existing.find((t) => t.id === id);
  if (already && already.layers?.length === pack.layers.length) {
    return false;
  }
  await saveMyCanvaTemplate({
    id,
    storeId,
    category: asCategory(pack.category),
    nameEn: resolveDesignTitle({ nameEn: pack.nameEn || pack.name, nameAr: pack.nameAr || pack.name, packKey }, false),
    nameAr: resolveDesignTitle({ nameEn: pack.nameEn || pack.name, nameAr: pack.nameAr || pack.name, packKey }, true),
    width: pack.width || 1080,
    height: pack.height || 1080,
    source: 'master',
    fromMaster: fromMaster || storeId !== MASTER_MEDIA_STORE_ID,
    layers: pack.layers.map((l, i) => ({
      ...l,
      id: l.id || `el-${storeId}-${i}`,
    })),
    previewDataUrl: await optimizeHomeThumb(
      pack.previewDataUrl || pack.layers.find((l) => l.imageUrl)?.imageUrl,
    ),
  });
  return true;
}

/** Lean stubs only — paginated, no design_json layers, no heavy thumb work on home. */
export async function hydratePptxPackStubsFromApi(
  storeId: string,
  opts?: { page?: number; perPage?: number },
): Promise<{ added: number; scanned: number; hasMore: boolean; page: number }> {
  if (!storeId) return { added: 0, scanned: 0, hasMore: false, page: 1 };
  let added = 0;
  let scanned = 0;
  const page = Math.max(1, opts?.page ?? 1);
  const perPage = Math.min(50, Math.max(1, opts?.perPage ?? DEFAULT_HOME_PAGE_SIZE));
  try {
    const { data: rows, meta } = await withTimeout(
      listStudioDesignsPaged(storeId, undefined, { page, perPage }),
      12_000,
      'STUDIO_LIST',
    );
    const existing = await listMyCanvaTemplates(storeId);
    const byId = new Map(existing.map((t) => [t.id, t]));

    const toInsert: Array<Omit<CanvaMyTemplate, 'createdAt' | 'updatedAt'> & { id: string }> = [];
    for (const row of rows) {
      const dj = (row.design_json || {}) as Record<string, unknown>;
      if (!isPptxApiRow(row)) continue;
      scanned += 1;

      const already = byId.get(row.id);
      // Keep rows that already have layers or stubs; only insert missing
      if (already) continue;

      const packKey =
        typeof dj.packKey === 'string' && dj.packKey
          ? dj.packKey
          : String(row.id || row.title || 'design')
              .toLowerCase()
              .replace(/[^\p{L}\p{N}]+/gu, '-')
              .slice(0, 72);

      const layerCount =
        typeof dj.layerCount === 'number'
          ? dj.layerCount
          : Array.isArray(dj.layers)
            ? dj.layers.length
            : 0;

      toInsert.push({
        id: row.id,
        storeId,
        category: asCategory(
          (typeof dj.category === 'string' ? dj.category : row.category) || 'social',
        ),
        nameEn: resolveDesignTitle({ nameEn: row.title, nameAr: row.title, packKey, id: row.id }, false),
        nameAr: resolveDesignTitle({ nameEn: row.title, nameAr: row.title, packKey, id: row.id }, true),
        width: row.width || 1080,
        height: row.height || 1080,
        source: row.source === 'pptx' ? 'pptx' : 'master',
        fromMaster: true,
        layers: [],
        layerCount,
        previewDataUrl: undefined,
      });
    }

    if (toInsert.length > 0) {
      await saveManyMyCanvaTemplates(storeId, toInsert);
      added = toInsert.length;
    }

    return {
      added,
      scanned,
      hasMore: Boolean(meta.has_more),
      page: meta.page,
    };
  } catch {
    return { added: 0, scanned: 0, hasMore: false, page };
  }
}

/**
 * On click: load ONE full design into IndexedDB (store_id isolated).
 */
export async function ensurePptxTemplateLayers(
  storeId: string,
  template: CanvaMyTemplate,
): Promise<CanvaMyTemplate> {
  if (!storeId || !template?.id) return template;
  if (template.layers && template.layers.length > 0) return template;

  const apiId =
    String(template.id).startsWith('dsd-pptx-') || String(template.id).startsWith('dsd-')
      ? template.id
      : null;

  if (apiId) {
    const full = await withTimeout(getStudioDesign(storeId, apiId), 45_000, 'STUDIO_SHOW');
    const dj = (full?.design_json || {}) as Record<string, unknown>;
    const layers = Array.isArray(dj.layers) ? (dj.layers as ImportedStudioLayer[]) : [];
    if (layers.length) {
      const rawPreview =
        typeof (dj as { previewDataUrl?: string }).previewDataUrl === 'string'
          ? (dj as { previewDataUrl?: string }).previewDataUrl
          : layers.find((l) => l.imageUrl)?.imageUrl || template.previewDataUrl;
      const saved = await saveMyCanvaTemplate({
        id: template.id,
        storeId,
        category: template.category,
        nameEn: resolveDesignTitle({ nameEn: template.nameEn, nameAr: template.nameAr, id: template.id }, false),
        nameAr: resolveDesignTitle({ nameEn: template.nameEn, nameAr: template.nameAr, id: template.id }, true),
        width: full?.width || template.width,
        height: full?.height || template.height,
        source: template.source === 'pptx' ? 'pptx' : 'master',
        fromMaster: true,
        layers,
        previewDataUrl: await optimizeHomeThumb(rawPreview),
      });
      return saved;
    }
  }

  return template;
}

/** @deprecated Prefer stubs + ensurePptxTemplateLayers — kept for rare force-sync */
export async function hydratePptxPackFromApi(storeId: string): Promise<{ added: number; scanned: number }> {
  const r = await hydratePptxPackStubsFromApi(storeId, { page: 1, perPage: DEFAULT_HOME_PAGE_SIZE });
  return { added: r.added, scanned: r.scanned };
}

/**
 * Public pack fallback — OPT-IN only. Full pack is ~200MB; never call from home mount.
 */
export async function hydratePptxPackFromPublic(
  storeId: string,
  opts?: { maxFiles?: number },
): Promise<{ added: number; scanned: number }> {
  if (!storeId || typeof fetch === 'undefined') return { added: 0, scanned: 0 };
  let added = 0;
  let scanned = 0;
  const maxFiles = Math.max(1, opts?.maxFiles ?? 3);
  try {
    const idxRes = await fetch(`${PACK_INDEX_URL}?v=${Date.now()}`, { cache: 'no-store' });
    if (!idxRes.ok) return { added: 0, scanned: 0 };
    const idx = (await idxRes.json()) as { items?: PackIndexItem[] };
    const items = (Array.isArray(idx.items) ? idx.items : []).slice(0, maxFiles);
    for (const item of items) {
      scanned += 1;
      try {
        const fileRes = await fetch(`/pptx-studio-pack/${item.file}?v=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!fileRes.ok) continue;
        const pack = (await fileRes.json()) as PackFile;
        const ok = await upsertPack(
          storeId,
          {
            ...pack,
            packKey: pack.packKey || item.packKey,
            nameEn: pack.nameEn || item.nameEn,
            nameAr: pack.nameAr || item.nameAr,
            category: pack.category || item.category,
          },
          true,
        );
        if (ok) added += 1;
      } catch {
        /* skip one */
      }
    }
  } catch {
    return { added, scanned };
  }
  return { added, scanned };
}

/**
 * Fast path for Canva home / editor open: lean API stubs only (top page).
 * Never auto-downloads public pack or full layer payloads.
 */
export async function hydratePptxStudioPackForStore(
  storeId: string,
  opts?: {
    includePublic?: boolean;
    publicMaxFiles?: number;
    page?: number;
    perPage?: number;
  },
): Promise<{
  added: number;
  from: 'api' | 'public' | 'none' | 'api+public';
  hasMore: boolean;
  page: number;
}> {
  if (!storeId) return { added: 0, from: 'none', hasMore: false, page: 1 };
  const api = await hydratePptxPackStubsFromApi(storeId, {
    page: opts?.page ?? 1,
    perPage: opts?.perPage ?? DEFAULT_HOME_PAGE_SIZE,
  });
  if (api.scanned > 0 || api.added > 0) {
    return {
      added: api.added,
      from: 'api',
      hasMore: api.hasMore,
      page: api.page,
    };
  }
  if (opts?.includePublic) {
    const pub = await hydratePptxPackFromPublic(storeId, {
      maxFiles: opts.publicMaxFiles ?? 3,
    });
    if (pub.added > 0) {
      return { added: pub.added, from: 'public', hasMore: false, page: 1 };
    }
  }
  return {
    added: 0,
    from: api.scanned > 0 ? 'api' : 'none',
    hasMore: api.hasMore,
    page: api.page,
  };
}
