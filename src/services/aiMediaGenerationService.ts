/**
 * Per-store AI image/video generation client.
 * Quota + Gemini calls live on Laravel — never invent fake assets.
 */

import { apiFetch } from '../api/client';

export type AiMediaKind = 'image' | 'video';
export type AiMediaAspect = '1:1' | '4:5' | '9:16' | '16:9';

export interface AiMediaQuota {
  store_id: string;
  period_key: string;
  plan_code: string;
  images_limit: number;
  images_used: number;
  images_remaining: number;
  videos_limit: number;
  videos_used: number;
  videos_remaining: number;
  image_provider_ready: boolean;
  video_provider_ready: boolean;
}

export interface AiMediaGenerated {
  kind: 'image' | 'video';
  saved: boolean;
  quota: AiMediaQuota;
  media: {
    id?: string;
    file_name: string;
    file_type: string;
    mime: string;
    size_bytes: number;
    width?: number | null;
    height?: number | null;
    url: string;
    prompt?: string;
    aspect?: string;
    model?: string;
    folder?: string;
    preview_data_url?: string;
  };
}

type QuotaResponse = { data: AiMediaQuota };
type GenerateResponse = { data: AiMediaGenerated; message?: string };

export async function fetchAiMediaQuota(storeId: string): Promise<AiMediaQuota> {
  const res = await apiFetch<QuotaResponse>('/ai-media/quota', {
    method: 'GET',
    storeId,
  });
  return res.data;
}

export async function generateAiMedia(
  storeId: string,
  payload: {
    kind: AiMediaKind;
    prompt: string;
    aspect?: AiMediaAspect;
    saveToLibrary?: boolean;
    title?: string;
  },
): Promise<AiMediaGenerated> {
  const res = await apiFetch<GenerateResponse>('/ai-media/generate', {
    method: 'POST',
    storeId,
    body: {
      kind: payload.kind,
      prompt: payload.prompt,
      aspect: payload.aspect || '1:1',
      save_to_library: payload.saveToLibrary !== false,
      title: payload.title,
    },
  });
  return res.data;
}
