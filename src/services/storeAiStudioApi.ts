import { apiFetch } from '../api/client';

export interface StudioModelOption {
  id: string;
  name_en: string;
  name_ar: string;
  tier: 'standard' | 'balanced' | 'pro';
  capabilities: string[];
  supports_image_generation: boolean;
  supports_image_editing: boolean;
  is_default: boolean;
}

export interface StoreStudioQuota {
  store_id: string;
  ai_enabled: boolean;
  is_paused: boolean;
  pause_reason: string | null;
  remaining_credits: number;
  daily_limit: number;
  daily_used: number;
  daily_remaining: number;
  monthly_limit: number;
  monthly_used: number;
  monthly_remaining: number;
  max_images_per_request: number;
  models: StudioModelOption[];
  default_model: string;
  default_aspect: string;
  allowed_aspects: string[];
  max_resolution: '1K' | '2K' | '4K';
  features: {
    text_to_image: boolean;
    image_to_image: boolean;
    product_photography: boolean;
    background_replacement: boolean;
    lifestyle_scenes: boolean;
    promotional_banners: boolean;
    social_creatives: boolean;
    product_variations: boolean;
  };
}

export interface StudioGeneratedImage {
  id: string;
  media_id: string;
  url: string;
  preview_data_url: string;
  prompt: string;
  model: string;
  aspect_ratio: string;
  action_type: string;
  created_at: string;
}

export interface StudioHistoryItem {
  id: string;
  store_id: string;
  model_id: string;
  action_type: string;
  prompt: string;
  revised_prompt: string | null;
  aspect_ratio: string;
  image_size: string;
  style: string | null;
  media_id: string | null;
  image_url: string;
  size_bytes: number;
  mime_type: string;
  execution_time_ms: number;
  status: 'success' | 'failed';
  created_at: string;
}

export async function fetchStudioQuota(): Promise<{ data: StoreStudioQuota }> {
  return apiFetch('/ai-studio/quota');
}

export async function generateStudioImage(payload: {
  prompt: string;
  model_id?: string;
  aspect_ratio?: string;
  image_size?: '1K' | '2K' | '4K';
  style?: string;
  action_type?: 'text_to_image' | 'edit' | 'remove_bg' | 'replace_bg' | 'banner' | 'lifestyle' | 'product_photography';
  product_image_base64?: string;
  product_image_mime?: string;
}): Promise<{
  ok: boolean;
  image: StudioGeneratedImage;
  quota: StoreStudioQuota;
  message: string;
}> {
  return apiFetch('/ai-studio/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchStudioHistory(page = 1): Promise<{
  data: StudioHistoryItem[];
  current_page: number;
  last_page: number;
  total: number;
}> {
  return apiFetch(`/ai-studio/history?page=${page}`);
}

export async function saveStudioImageToMedia(historyId: string, folder = 'ai-studio'): Promise<{
  ok: boolean;
  message: string;
  media: Record<string, unknown>;
}> {
  return apiFetch('/ai-studio/save-to-media', {
    method: 'POST',
    body: JSON.stringify({ history_id: historyId, folder }),
  });
}
