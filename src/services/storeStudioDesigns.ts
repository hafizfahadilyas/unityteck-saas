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

export async function listStudioDesigns(
  storeId: string,
  editorType?: StudioEditorType,
): Promise<StoreStudioDesignRow[]> {
  if (!isApiEnabled()) return [];
  const qs = editorType ? `?editor_type=${encodeURIComponent(editorType)}` : '';
  const res = await apiFetch<{ data: StoreStudioDesignRow[] }>(`/studio-designs${qs}`, { storeId });
  return Array.isArray(res.data) ? res.data : [];
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
