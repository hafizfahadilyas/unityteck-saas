/**
 * Per-store Canva-style designs — Laravel MySQL (not permanent localStorage).
 */

import { apiFetch, isApiEnabled } from '../api/client';

export type StudioEditorType = 'banner' | 'logo' | 'product_card';

export interface StoreStudioDesignRow {
  id: string;
  store_id: string;
  editor_type: StudioEditorType;
  category: string;
  title: string;
  width: number;
  height: number;
  design_json: Record<string, unknown>;
  preview_media_id?: string | null;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudioDesignsListMeta {
  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
}

export interface StudioDesignsListResult {
  data: StoreStudioDesignRow[];
  meta: StudioDesignsListMeta;
}

export async function listStudioDesigns(
  storeId: string,
  editorType?: StudioEditorType,
  opts?: { page?: number; perPage?: number },
): Promise<StoreStudioDesignRow[]> {
  const result = await listStudioDesignsPaged(storeId, editorType, opts);
  return result.data;
}

/** Paginated lean list — never pulls full design_json layers. */
export async function listStudioDesignsPaged(
  storeId: string,
  editorType?: StudioEditorType,
  opts?: { page?: number; perPage?: number },
): Promise<StudioDesignsListResult> {
  const emptyMeta: StudioDesignsListMeta = {
    page: 1,
    per_page: opts?.perPage ?? 10,
    total: 0,
    has_more: false,
  };
  if (!isApiEnabled()) return { data: [], meta: emptyMeta };
  const page = Math.max(1, opts?.page ?? 1);
  const perPage = Math.min(50, Math.max(1, opts?.perPage ?? 10));
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('per_page', String(perPage));
  if (editorType) qs.set('editor_type', editorType);
  const res = await apiFetch<{ data: StoreStudioDesignRow[]; meta?: Partial<StudioDesignsListMeta> }>(
    `/studio-designs?${qs.toString()}`,
    { storeId },
  );
  const data = Array.isArray(res.data) ? res.data : [];
  const meta: StudioDesignsListMeta = {
    page: Number(res.meta?.page ?? page),
    per_page: Number(res.meta?.per_page ?? perPage),
    total: Number(res.meta?.total ?? data.length),
    has_more: Boolean(
      res.meta?.has_more ?? (Number(res.meta?.total ?? 0) > page * perPage),
    ),
  };
  return { data, meta };
}

/** Full design row (layers included) — Hostinger list may omit layers for size. */
export async function getStudioDesign(
  storeId: string,
  id: string,
): Promise<StoreStudioDesignRow | null> {
  if (!isApiEnabled() || !storeId || !id) return null;
  try {
    const res = await apiFetch<{ data: StoreStudioDesignRow }>(`/studio-designs/${encodeURIComponent(id)}`, {
      storeId,
    });
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function saveStudioDesign(
  storeId: string,
  payload: {
    id?: string;
    editor_type: StudioEditorType;
    category?: string;
    title: string;
    width: number;
    height: number;
    design_json: Record<string, unknown>;
    preview_media_id?: string | null;
    source?: string;
  },
): Promise<StoreStudioDesignRow> {
  if (!isApiEnabled()) {
    throw new Error('API_DISABLED');
  }
  if (payload.id) {
    const res = await apiFetch<{ data: StoreStudioDesignRow }>(`/studio-designs/${payload.id}`, {
      method: 'PUT',
      storeId,
      body: {
        title: payload.title,
        width: payload.width,
        height: payload.height,
        design_json: payload.design_json,
        preview_media_id: payload.preview_media_id,
      },
    });
    if (!res.data) throw new Error('SAVE_FAILED');
    return res.data;
  }
  const res = await apiFetch<{ data: StoreStudioDesignRow }>('/studio-designs', {
    method: 'POST',
    storeId,
    body: {
      editor_type: payload.editor_type,
      category: payload.category,
      title: payload.title,
      width: payload.width,
      height: payload.height,
      design_json: payload.design_json,
      preview_media_id: payload.preview_media_id,
      source: payload.source || 'studio',
    },
  });
  if (!res.data) throw new Error('SAVE_FAILED');
  return res.data;
}

export async function deleteStudioDesign(storeId: string, id: string): Promise<void> {
  if (!isApiEnabled()) return;
  await apiFetch(`/studio-designs/${id}`, { method: 'DELETE', storeId });
}

export interface DailyTemplatePick {
  date: string;
  category: string;
  template_ids: string[];
  seed: string;
  store_id: string;
}

export async function fetchDailyDesignTemplates(
  storeId: string,
  category: 'banner' | 'logo' | 'product' | 'social' | 'category',
): Promise<DailyTemplatePick | null> {
  if (!isApiEnabled()) return null;
  const qs = new URLSearchParams({ category });
  const res = await apiFetch<{ data: DailyTemplatePick }>(`/design-templates/daily?${qs}`, { storeId });
  return res.data ?? null;
}
