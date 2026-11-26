import { apiFetch } from '../api/client';

export type OpenAiApiKeyStatus = { configured: boolean; masked: string | null };

export type OpenAiStoreRow = {
  store_id: string;
  store_name: string;
  plan: string;
  pro_eligible: boolean;
  enabled: boolean;
  intelligence_level: string;
  model: string;
  daily_usage: Record<string, unknown>;
  monthly_usage: Record<string, unknown>;
  monthly_budget_usd: number;
  actual_cost_usd: number;
  payment_status: string;
  usage_unlocked: boolean;
  config_status: string;
};

export type OpenAiStoreConfig = {
  store_id: string;
  store_name: string;
  store_plan: string;
  pro_eligible: boolean;
  enabled: boolean;
  intelligence_level: 'low' | 'medium' | 'high';
  text_model: string | null;
  reasoning_effort: string | null;
  prompt_caching_enabled: boolean | null;
  daily_token_limit: number;
  monthly_token_limit: number;
  max_input_tokens: number;
  max_output_tokens: number;
  daily_request_limit: number;
  monthly_request_limit: number;
  daily_budget_usd: number;
  monthly_budget_usd: number;
  max_cost_per_request_usd: number;
  warning_threshold_pct: number;
  auto_stop_at_budget: boolean;
  allow_admin_override: boolean;
  payment_required_for_usage: boolean;
  usage_unlocked: boolean;
  payment_status: string;
  usage_unlocked_until: string | null;
  store_isolation_enforced: boolean;
  audit_logging_enabled: boolean;
  rate_limit_per_minute: number;
  config_status: string;
  level_catalog: Record<string, unknown>;
};

export async function fetchOpenAiOverview() {
  return apiFetch<{
    global: {
      enabled: boolean;
      emergency_disabled: boolean;
      default_text_model: string;
      prompt_caching_enabled: boolean;
    };
    api_key: OpenAiApiKeyStatus;
    overview: {
      total_requests: number;
      total_tokens: number;
      total_cost_usd: number;
      active_stores: number;
      stores_near_limit: number;
      stores_disabled: number;
    };
    levels: Record<string, unknown>;
    pricing: Array<Record<string, unknown>>;
  }>('/master/openai/overview', { portal: 'master' });
}

export async function updateOpenAiGlobal(body: Record<string, unknown>) {
  return apiFetch('/master/openai/global', {
    method: 'PUT',
    portal: 'master',
    body,
  });
}

export async function fetchOpenAiStores() {
  return apiFetch<{ data: OpenAiStoreRow[]; count: number }>('/master/openai/stores', {
    portal: 'master',
  });
}

export async function fetchOpenAiStore(storeId: string) {
  return apiFetch<{
    config: OpenAiStoreConfig;
    usage: Record<string, unknown>;
    config_history: Array<Record<string, unknown>>;
    usage_logs: Array<Record<string, unknown>>;
    security_events: Array<Record<string, unknown>>;
    api_key: OpenAiApiKeyStatus;
  }>(`/master/openai/stores/${encodeURIComponent(storeId)}`, { portal: 'master' });
}

export async function saveOpenAiStore(storeId: string, body: Record<string, unknown>) {
  return apiFetch<{ ok: boolean; config: OpenAiStoreConfig }>(
    `/master/openai/stores/${encodeURIComponent(storeId)}`,
    { method: 'PUT', portal: 'master', body },
  );
}

export async function resetOpenAiStore(storeId: string) {
  return apiFetch<{ ok: boolean; config: OpenAiStoreConfig }>(
    `/master/openai/stores/${encodeURIComponent(storeId)}/reset`,
    { method: 'POST', portal: 'master', body: {} },
  );
}

export async function unlockOpenAiPayment(
  storeId: string,
  method: 'mark_paid' | 'comp' | 'services_points',
  days = 30,
) {
  return apiFetch<{ ok: boolean; config: OpenAiStoreConfig }>(
    `/master/openai/stores/${encodeURIComponent(storeId)}/unlock-payment`,
    { method: 'POST', portal: 'master', body: { method, days } },
  );
}

export async function runOpenAiComplete(storeId: string, prompt: string, system?: string) {
  return apiFetch<{
    ok: boolean;
    code?: string;
    message?: string;
    payment_required?: boolean;
    data?: Record<string, unknown>;
  }>(`/master/openai/stores/${encodeURIComponent(storeId)}/complete`, {
    method: 'POST',
    portal: 'master',
    body: { prompt, system },
    timeoutMs: 120000,
  });
}

export type OpenAiImageConfig = {
  store_id: string;
  store_name: string;
  pro_eligible: boolean;
  enabled: boolean;
  default_model: string;
  default_quality: string;
  monthly_image_quota: number;
  daily_quota: null;
  monthly_budget_usd: number;
  max_cost_per_image_usd: number;
  warning_threshold_pct: number;
  auto_stop_at_quota: boolean;
  payment_required_for_usage: boolean;
  usage_unlocked: boolean;
  payment_status: string;
  config_status: string;
  usage: {
    period_key: string;
    images_success: number;
    images_failed: number;
    images_remaining: number;
    cost_usd: number;
    hard_stopped: boolean;
  };
};

export async function fetchOpenAiImage(storeId: string) {
  return apiFetch<{ config: OpenAiImageConfig; events: Array<Record<string, unknown>> }>(
    `/master/openai/stores/${encodeURIComponent(storeId)}/image`,
    { portal: 'master' },
  );
}

export async function saveOpenAiImage(storeId: string, body: Record<string, unknown>) {
  return apiFetch<{ ok: boolean; config: OpenAiImageConfig }>(
    `/master/openai/stores/${encodeURIComponent(storeId)}/image`,
    { method: 'PUT', portal: 'master', body },
  );
}

export async function unlockOpenAiImagePayment(
  storeId: string,
  method: 'mark_paid' | 'comp' | 'services_points',
  days = 30,
) {
  return apiFetch<{ ok: boolean; config: OpenAiImageConfig }>(
    `/master/openai/stores/${encodeURIComponent(storeId)}/image/unlock-payment`,
    { method: 'POST', portal: 'master', body: { method, days } },
  );
}

export async function generateOpenAiImage(storeId: string, prompt: string) {
  return apiFetch<{
    ok: boolean;
    code?: string;
    message?: string;
    payment_required?: boolean;
    data?: Record<string, unknown>;
  }>(`/master/openai/stores/${encodeURIComponent(storeId)}/image/generate`, {
    method: 'POST',
    portal: 'master',
    body: { prompt },
    timeoutMs: 150000,
  });
}

export type OpenAiAutomationConfig = {
  store_id: string;
  store_name: string;
  pro_eligible: boolean;
  enabled: boolean;
  intelligence_level: string;
  text_model: string | null;
  monthly_question_quota: number;
  daily_question_quota: number;
  max_output_tokens: number;
  own_store_data_only: boolean;
  block_cross_store: boolean;
  block_sql_and_secrets: boolean;
  payment_required_for_usage: boolean;
  usage_unlocked: boolean;
  payment_status: string;
  config_status: string;
  usage: Record<string, unknown>;
  policy: Record<string, unknown>;
};

export async function fetchOpenAiAutomation(storeId: string) {
  return apiFetch<{ config: OpenAiAutomationConfig }>(
    `/master/openai/stores/${encodeURIComponent(storeId)}/automation`,
    { portal: 'master' },
  );
}

export async function saveOpenAiAutomation(storeId: string, body: Record<string, unknown>) {
  return apiFetch<{ ok: boolean; config: OpenAiAutomationConfig }>(
    `/master/openai/stores/${encodeURIComponent(storeId)}/automation`,
    { method: 'PUT', portal: 'master', body },
  );
}

export async function unlockOpenAiAutomationPayment(
  storeId: string,
  method: 'mark_paid' | 'comp' | 'services_points',
  days = 30,
) {
  return apiFetch<{ ok: boolean; config: OpenAiAutomationConfig }>(
    `/master/openai/stores/${encodeURIComponent(storeId)}/automation/unlock-payment`,
    { method: 'POST', portal: 'master', body: { method, days } },
  );
}

export async function askOpenAiAutomation(storeId: string, question: string) {
  return apiFetch<{
    ok: boolean;
    code?: string;
    message?: string;
    payment_required?: boolean;
    data?: Record<string, unknown>;
  }>(`/master/openai/stores/${encodeURIComponent(storeId)}/automation/ask`, {
    method: 'POST',
    portal: 'master',
    body: { question },
    timeoutMs: 120000,
  });
}

export type UnlockSuiteResult = {
  ok: boolean;
  scope: 'store' | 'all';
  method: string;
  days: number;
  unlocked_count: number;
  skipped_count: number;
  unlocked: Array<{ store_id: string; store_name: string }>;
  skipped: Array<{ store_id: string; store_name: string; reason: string }>;
};

/** Instant unlock text + image + automation for one store or all Pro stores. */
export async function unlockOpenAiSuite(body: {
  scope: 'store' | 'all';
  store_id?: string;
  method: 'mark_paid' | 'comp' | 'services_points';
  days?: number;
}) {
  return apiFetch<UnlockSuiteResult>('/master/openai/unlock-suite', {
    method: 'POST',
    portal: 'master',
    body,
    timeoutMs: 120000,
  });
}

export type IncrementAiLimitsResult = {
  ok: boolean;
  store_id: string;
  store_name?: string;
  payment_status: string;
  until: string;
  limits: {
    images_monthly: number;
    images_daily: number;
    text_daily_tokens: number;
    text_monthly_tokens: number;
    auto_daily_questions: number;
    auto_monthly_questions: number;
  };
};

/** Master raises AI quotas and re-unlocks (no auto-relock). */
export async function incrementAiLimits(
  storeId: string,
  body: {
    images_monthly_delta?: number;
    images_daily_delta?: number;
    text_daily_delta?: number;
    text_monthly_delta?: number;
    auto_daily_delta?: number;
    auto_monthly_delta?: number;
    method?: 'comp' | 'mark_paid' | 'services_points';
    days?: number;
  },
): Promise<IncrementAiLimitsResult> {
  return apiFetch<IncrementAiLimitsResult>(
    `/master/openai/stores/${encodeURIComponent(storeId)}/increment-limits`,
    { method: 'POST', portal: 'master', body, timeoutMs: 60000 },
  );
}
