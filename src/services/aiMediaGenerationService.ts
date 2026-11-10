/**
 * Per-store AI image/video generation client.
 * Quota + Gemini + brand identity live on Laravel — never invent fake assets.
 */

import { apiFetch } from '../api/client';
import type {
  AiBrandPersona,
  AiBrandProfile,
  AiCampaignPreset,
  AiLogoPosition,
  AiOutputTemplate,
} from './aiBrandIdentity';

export type AiMediaKind = 'image' | 'video';
export type AiMediaAspect =
  | '1:1'
  | '4:5'
  | '5:4'
  | '3:4'
  | '4:3'
  | '2:3'
  | '3:2'
  | '9:16'
  | '16:9'
  | '21:9';
export type AiMediaImageSize = '1K' | '2K' | '4K';
export type AiMediaStyle =
  | 'default'
  | 'studio'
  | 'lifestyle'
  | 'flat'
  | 'cinematic'
  | 'minimal';

export type AiMediaModelId =
  | 'gemini-2.5-flash-image'
  | 'gemini-3.1-flash-lite-image'
  | 'gemini-3.1-flash-image'
  | 'gemini-3-pro-image'
  | string;

export interface AiMediaModelOption {
  id: AiMediaModelId;
  label_en: string;
  label_ar: string;
  tier: string;
}

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
  models?: AiMediaModelOption[];
  default_model?: string;
  image_sizes?: AiMediaImageSize[];
  aspects?: AiMediaAspect[];
  personas?: string[];
  campaign_presets?: string[];
  output_templates?: Record<string, string>;
  logo_positions?: string[];
}

export interface AiMediaGenerated {
  kind: 'image' | 'video';
  saved: boolean;
  quota: AiMediaQuota;
  prompt_used?: string;
  prompt_merged?: string;
  brand_lock?: boolean;
  logo_overlay_applied?: boolean;
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
type EnhanceResponse = {
  data: {
    prompt: string;
    prompt_seed?: string;
    brand_lock?: boolean;
    model: string;
    store_id?: string;
  };
  message?: string;
};
type BrandProfileResponse = { data: AiBrandProfile; store_id?: string };

export const DEFAULT_AI_MODELS: AiMediaModelOption[] = [
  {
    id: 'gemini-2.5-flash-image',
    label_en: 'Flash Image (fast)',
    label_ar: 'فلاش صورة (سريع)',
    tier: 'standard',
  },
  {
    id: 'gemini-3.1-flash-lite-image',
    label_en: 'Flash Lite (fastest)',
    label_ar: 'فلاش لايت (الأسرع)',
    tier: 'standard',
  },
  {
    id: 'gemini-3.1-flash-image',
    label_en: 'Flash Image 3.1 (balanced)',
    label_ar: 'فلاش صورة ٣٫١ (متوازن)',
    tier: 'balanced',
  },
  {
    id: 'gemini-3-pro-image',
    label_en: 'Pro Image (highest quality)',
    label_ar: 'برو صورة (أعلى جودة)',
    tier: 'pro',
  },
];

/** AI generate can take 30–90s on Gemini — do not use default 25s write timeout. */
const AI_GENERATE_TIMEOUT_MS = 130_000;
const AI_ENHANCE_TIMEOUT_MS = 60_000;

export async function fetchAiMediaQuota(storeId: string): Promise<AiMediaQuota> {
  const res = await apiFetch<QuotaResponse>('/ai-media/quota', {
    method: 'GET',
    storeId,
  });
  return res.data;
}

export async function fetchAiBrandProfile(storeId: string): Promise<AiBrandProfile> {
  const res = await apiFetch<BrandProfileResponse>('/ai-media/brand-profile', {
    method: 'GET',
    storeId,
  });
  return res.data;
}

export async function saveAiBrandProfile(
  storeId: string,
  payload: {
    palette_hex?: string[];
    persona?: AiBrandPersona;
    brand_lock_default?: boolean;
    logo_overlay_enabled?: boolean;
    logo_overlay_position?: AiLogoPosition;
    logo_url?: string | null;
    style_reference_urls?: string[];
  },
): Promise<AiBrandProfile> {
  const res = await apiFetch<BrandProfileResponse>('/ai-media/brand-profile', {
    method: 'PUT',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function enhanceAiMediaPrompt(
  storeId: string,
  payload: {
    prompt: string;
    locale?: 'ar' | 'en';
    aspect?: AiMediaAspect;
    style?: AiMediaStyle | string;
    brandLock?: boolean;
    campaignPreset?: AiCampaignPreset;
    persona?: AiBrandPersona;
    outputTemplate?: AiOutputTemplate;
  },
): Promise<{ prompt: string; promptSeed?: string; brandLock?: boolean }> {
  const res = await apiFetch<EnhanceResponse>('/ai-media/enhance-prompt', {
    method: 'POST',
    storeId,
    timeoutMs: AI_ENHANCE_TIMEOUT_MS,
    body: {
      prompt: payload.prompt,
      locale: payload.locale || 'en',
      aspect: payload.aspect || '1:1',
      style: payload.style && payload.style !== 'default' ? payload.style : undefined,
      brand_lock: payload.brandLock,
      campaign_preset: payload.campaignPreset || 'none',
      persona: payload.persona,
      output_template: payload.outputTemplate,
    },
  });
  return {
    prompt: res.data.prompt,
    promptSeed: res.data.prompt_seed,
    brandLock: res.data.brand_lock,
  };
}

export async function generateAiMedia(
  storeId: string,
  payload: {
    kind: AiMediaKind;
    prompt: string;
    aspect?: AiMediaAspect;
    model?: AiMediaModelId;
    imageSize?: AiMediaImageSize;
    style?: AiMediaStyle | string;
    negativePrompt?: string;
    autoEnhance?: boolean;
    locale?: 'ar' | 'en';
    saveToLibrary?: boolean;
    title?: string;
    brandLock?: boolean;
    campaignPreset?: AiCampaignPreset;
    persona?: AiBrandPersona;
    outputTemplate?: AiOutputTemplate;
    logoOverlay?: boolean;
    matchPerspective?: boolean;
    productImageBase64?: string;
    productImageMime?: string;
    productImageUrl?: string;
  },
): Promise<AiMediaGenerated> {
  const res = await apiFetch<GenerateResponse>('/ai-media/generate', {
    method: 'POST',
    storeId,
    timeoutMs: AI_GENERATE_TIMEOUT_MS,
    body: {
      kind: payload.kind,
      prompt: payload.prompt,
      aspect: payload.aspect || '1:1',
      model: payload.model,
      image_size: payload.imageSize || '1K',
      style: payload.style && payload.style !== 'default' ? payload.style : undefined,
      negative_prompt: payload.negativePrompt || undefined,
      auto_enhance: Boolean(payload.autoEnhance),
      locale: payload.locale || 'en',
      save_to_library: payload.saveToLibrary !== false,
      title: payload.title,
      brand_lock: payload.brandLock,
      campaign_preset: payload.campaignPreset || 'none',
      persona: payload.persona,
      output_template: payload.outputTemplate,
      logo_overlay: payload.logoOverlay,
      match_perspective: payload.matchPerspective !== false,
      product_image_base64: payload.productImageBase64,
      product_image_mime: payload.productImageMime,
      product_image_url: payload.productImageUrl,
    },
  });
  return res.data;
}
