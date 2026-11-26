import { apiFetch } from '../api/client';

export interface GeminiProviderInfo {
  id: string;
  slug: string;
  name: string;
  display_name_ar: string;
  display_name_en: string;
  status: 'active' | 'disabled' | 'maintenance';
  is_default: boolean;
  api_endpoint: string;
  connection_status: 'connected' | 'failed' | 'untested';
  last_connection_test_at: string | null;
  last_connection_error: string | null;
}

export interface GeminiApiKeyInfo {
  has_key: boolean;
  masked: string;
  preview: string;
  length: number;
}

export interface GeminiProviderConfig {
  id: string;
  provider_id: string;
  enabled: boolean;
  default_model: string;
  default_text_model: string;
  default_image_model: string;
  default_language: 'ar' | 'en' | 'auto';
  default_image_quality: 'standard' | 'balanced' | 'pro';
  default_aspect_ratio: string;
  max_image_resolution: '1K' | '2K' | '4K';
  default_generation_mode: string;
  feature_text_to_image: boolean;
  feature_image_to_image: boolean;
  feature_product_photography: boolean;
  feature_background_replacement: boolean;
  feature_lifestyle_scenes: boolean;
  feature_promotional_banners: boolean;
  feature_social_creatives: boolean;
  feature_product_variations: boolean;
  allowed_aspect_ratios: string[];
  output_format: 'webp' | 'png' | 'jpeg';
  storage_location: string;
  compression_quality: number;
  max_upload_size_mb: number;
  all_merchants_enabled: boolean;
  default_daily_image_limit: number;
  default_monthly_image_limit: number;
  default_daily_credit_allowance: number;
  default_monthly_credit_allowance: number;
  max_images_per_request: number;
  monthly_spending_limit_usd: number;
  api_timeout_seconds: number;
  retry_enabled: boolean;
  max_retries: number;
  request_concurrency_limit: number;
  rate_limit_per_minute: number;
  provider_fallback_enabled: boolean;
  fallback_model: string;
  failure_alerts_enabled: boolean;
  global_maintenance_mode: boolean;
  notes: string | null;
}

export interface GeminiModelRow {
  id: string;
  provider_id: string;
  model_id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  tier: 'standard' | 'balanced' | 'pro';
  capabilities: string[];
  supports_image_generation: boolean;
  supports_image_editing: boolean;
  input_modalities: string[];
  output_modalities: string[];
  availability_status: 'available' | 'preview' | 'deprecated';
  is_enabled: boolean;
  is_default: boolean;
  priority: number;
  input_token_price_per_1m_usd: number;
  output_token_price_per_1m_usd: number;
  image_generation_price_usd: number;
}

export interface MerchantLimitRow {
  store_id: string;
  store_name: string;
  plan_code: string;
  ai_enabled: boolean;
  is_paused: boolean;
  pause_reason: string | null;
  daily_image_limit: number;
  daily_used: number;
  monthly_image_limit: number;
  monthly_used: number;
  daily_credits_allowance: number;
  monthly_credits_allowance: number;
  remaining_credits: number;
  max_images_per_request: number;
}

export interface PricingOverview {
  currency: string;
  models: GeminiModelRow[];
  monthly_spending_limit_usd: number;
  actual_spending_this_month_usd: number;
  spending_percentage: number;
}

export interface AnalyticsCards {
  total_generated_images: number;
  total_api_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  estimated_api_cost_usd: number;
  monthly_usage: number;
}

export interface DailyChartPoint {
  date: string;
  label: string;
  images: number;
  requests: number;
}

export interface AnalyticsOverview {
  cards: AnalyticsCards;
  chart_daily: DailyChartPoint[];
  model_breakdown: { model: string; count: number }[];
  filter_applied: Record<string, unknown>;
}

export interface ApiLogRow {
  id: string;
  request_id: string | null;
  store_id: string | null;
  store_name: string;
  merchant_id: string | null;
  model_id: string;
  endpoint: string | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  response_time_ms: number;
  http_status: number;
  status: 'success' | 'failed' | 'blocked';
  error_code: string | null;
  error_message: string | null;
  created_at: string;
}

export interface HistoryRow {
  id: string;
  store_id: string;
  store_name: string;
  model_id: string;
  action_type: string;
  prompt: string;
  aspect_ratio: string;
  image_size: string;
  image_url: string | null;
  status: 'success' | 'failed';
  execution_time_ms: number;
  error_message: string | null;
  created_at: string;
}

export async function fetchGeminiSettings(): Promise<{
  provider: GeminiProviderInfo;
  api_key: GeminiApiKeyInfo;
  config: GeminiProviderConfig;
}> {
  return apiFetch('/master/gemini/settings');
}

export async function saveGeminiSettings(payload: Partial<GeminiProviderConfig> & {
  provider_name?: string;
  status?: string;
  api_endpoint?: string;
}): Promise<{ ok: boolean; message: string; config: GeminiProviderConfig }> {
  return apiFetch('/master/gemini/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function testGeminiConnection(): Promise<{
  ok: boolean;
  status: 'connected' | 'failed' | 'disconnected';
  message: string;
  latency_ms: number;
  tested_at: string;
  models_count?: number;
  api_version?: string;
}> {
  return apiFetch('/master/gemini/test-connection', { method: 'POST' });
}

export async function updateGeminiApiKey(apiKey: string): Promise<{
  ok: boolean;
  message: string;
  api_key: GeminiApiKeyInfo;
  connection_test: Awaited<ReturnType<typeof testGeminiConnection>>;
}> {
  return apiFetch('/master/gemini/api-key', {
    method: 'POST',
    body: JSON.stringify({ api_key: apiKey }),
  });
}

export async function fetchGeminiModels(): Promise<{ models: GeminiModelRow[]; count: number }> {
  return apiFetch('/master/gemini/models');
}

export async function refreshGeminiModels(): Promise<{ ok: boolean; models: GeminiModelRow[] }> {
  return apiFetch('/master/gemini/models/refresh', { method: 'POST' });
}

export async function updateGeminiModel(
  id: string,
  payload: Partial<GeminiModelRow>
): Promise<{ ok: boolean; model: GeminiModelRow }> {
  return apiFetch(`/master/gemini/models/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchMerchantLimits(): Promise<{ merchants: MerchantLimitRow[]; count: number }> {
  return apiFetch('/master/gemini/merchant-limits');
}

export async function updateMerchantLimit(payload: {
  store_id: string;
  ai_enabled?: boolean;
  is_paused?: boolean;
  pause_reason?: string | null;
  daily_image_limit?: number;
  monthly_image_limit?: number;
  max_images_per_request?: number;
}): Promise<{ ok: boolean; message: string; limit: Record<string, unknown> }> {
  return apiFetch('/master/gemini/merchant-limits', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adjustMerchantCredits(payload: {
  store_id: string;
  amount: number;
  reason: string;
}): Promise<{ ok: boolean; message: string; limit: Record<string, unknown> }> {
  return apiFetch('/master/gemini/merchant-credits/adjust', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchPricingOverview(): Promise<PricingOverview> {
  return apiFetch('/master/gemini/pricing');
}

export async function fetchAnalytics(filters: {
  period?: 'today' | '7d' | '30d' | 'custom';
  store_id?: string;
  model_id?: string;
  start_date?: string;
  end_date?: string;
} = {}): Promise<AnalyticsOverview> {
  const params = new URLSearchParams();
  if (filters.period) params.set('period', filters.period);
  if (filters.store_id) params.set('store_id', filters.store_id);
  if (filters.model_id) params.set('model_id', filters.model_id);
  if (filters.start_date) params.set('start_date', filters.start_date);
  if (filters.end_date) params.set('end_date', filters.end_date);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/master/gemini/analytics${q}`);
}

export async function fetchApiLogs(page = 1, filters: { store_id?: string; status?: string } = {}): Promise<{
  data: ApiLogRow[];
  current_page: number;
  last_page: number;
  total: number;
}> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  if (filters.store_id) params.set('store_id', filters.store_id);
  if (filters.status) params.set('status', filters.status);
  return apiFetch(`/master/gemini/logs?${params.toString()}`);
}

export async function fetchMasterHistory(page = 1, storeId?: string): Promise<{
  data: HistoryRow[];
  current_page: number;
  last_page: number;
  total: number;
}> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  if (storeId) params.set('store_id', storeId);
  return apiFetch(`/master/gemini/history?${params.toString()}`);
}
