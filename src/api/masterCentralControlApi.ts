/**
 * SOUQ PLATFORM — MASTER ADMIN CENTRAL CONTROL CENTER API CLIENT
 * Connects directly to authoritative Laravel 11 + MySQL endpoints.
 */

import { apiFetch } from './client';

export interface CentralOverviewData {
  counts: {
    total_merchants: number;
    total_stores: number;
    active_stores: number;
    store_subscriptions: number;
    ai_subscriptions: number;
    pending_payments: number;
    total_credits_in_circulation: number;
    ai_features_total: number;
    ai_features_active: number;
    dashboard_pages: number;
    ui_components: number;
  };
  recent_activity: Array<{
    id: string;
    action: string;
    domain: string;
    store_id: string | null;
    reason: string | null;
    created_at: string;
  }>;
  system_health: {
    database_status: string;
    gemini_api: string;
    zatca_service: string;
    realtime_channel: string;
  };
}

export interface MerchantListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  store: {
    id: string;
    name: string;
    slug: string;
    status: string;
    domain: string;
    orders_count: number;
    revenue: number;
  } | null;
  store_plan: {
    code: string;
    status: string;
    ends_at: string | null;
  };
  ai_plan: {
    code: string;
    status: string;
    ends_at: string | null;
  };
  wallet: {
    remaining_credits: number;
    daily_limit: number;
    monthly_limit: number;
    ai_enabled: boolean;
    is_paused: boolean;
  };
  pending_payments_count: number;
}

export interface AiPlanItem {
  id: string;
  code: string;
  billing_cycle: 'monthly' | 'yearly';
  tier: 'basic' | 'advanced' | 'popular';
  name_en: string;
  name_ar: string;
  price_sar: number;
  currency: string;
  credits: number;
  daily_limit: number;
  monthly_limit: number;
  image_generation_limit: number;
  calling_minutes: number;
  bonus_credits: number;
  is_popular: boolean;
  is_active: boolean;
  model_permissions: string[] | string;
  features: string[] | string;
  subscriptions_count?: number;
}

export interface AiFeatureItem {
  id: string;
  feature_code: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  category: string;
  global_status: boolean | number;
  credit_cost: number;
  daily_limit: number;
  monthly_limit: number;
  default_provider: string;
  default_model: string;
  page_route: string;
  page_visible: boolean | number;
  is_active: boolean | number;
  overrides_count?: number;
}

export interface DashboardPageItem {
  id: string;
  route_key: string;
  name_en: string;
  name_ar: string;
  category: string;
  icon: string;
  default_visibility: boolean | number;
  global_visibility: boolean | number;
  display_order: number;
  overrides_count?: number;
}

export interface UiComponentItem {
  id: string;
  component_key: string;
  page_route: string;
  name_en: string;
  name_ar: string;
  component_type: string;
  default_visibility: boolean | number;
  global_visibility: boolean | number;
  display_order: number;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  allowed_settings?: Record<string, unknown>;
  overrides_count?: number;
}

export interface PaymentRequestItem {
  id: string;
  store_id: string;
  package_id: string;
  package_name: string;
  amount_sar: number;
  payment_method: string;
  transaction_ref: string;
  sender_name?: string;
  proof_path?: string;
  proof_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  store?: {
    id: string;
    name: string;
  };
}

export interface AuditLogItem {
  id: string;
  admin_id: string;
  admin_name?: string;
  merchant_id?: string;
  store_id?: string;
  domain: string;
  action: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  reason?: string;
  ip_address?: string;
  created_at: string;
}

// ── Overview & Global Settings ──────────────────────────────────────────

export async function fetchCentralOverview(): Promise<CentralOverviewData> {
  const res = await apiFetch<any>('/master/control-center/overview', { portal: 'master' });
  return res.data;
}

export async function fetchGlobalSettings(): Promise<Record<string, any>> {
  const res = await apiFetch<any>('/master/control-center/global-settings', { portal: 'master' });
  return res.data;
}

export async function updateGlobalSetting(data: {
  setting_key: string;
  setting_value: unknown;
  setting_group?: string;
  description?: string;
  reason: string;
}): Promise<void> {
  await apiFetch('/master/control-center/global-settings', {
    method: 'PATCH',
    body: data,
    portal: 'master',
  });
}

// ── Merchant Management & 360 Profiles ──────────────────────────────────

export async function fetchMerchantsList(params?: {
  search?: string;
  plan?: string;
  ai_plan?: string;
  status?: string;
  page?: number;
}): Promise<{ data: MerchantListItem[]; pagination: any }> {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.plan) q.set('plan', params.plan);
  if (params?.ai_plan) q.set('ai_plan', params.ai_plan);
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));

  const res = await apiFetch<any>(`/master/merchants?${q.toString()}`, { portal: 'master' });
  return { data: res.data, pagination: res.pagination };
}

export async function fetchMerchantProfile(id: string): Promise<any> {
  const res = await apiFetch<any>(`/master/merchants/${id}`, { portal: 'master' });
  return res.data;
}

export async function updateMerchantProfile(
  id: string,
  data: {
    name?: string;
    status?: 'active' | 'suspended';
    store_id?: string;
    remaining_credits?: number;
    daily_image_limit?: number;
    monthly_image_limit?: number;
    ai_enabled?: boolean;
    is_paused?: boolean;
    reason: string;
  }
): Promise<void> {
  await apiFetch(`/master/merchants/${id}`, {
    method: 'PATCH',
    body: data,
    portal: 'master',
  });
}

export async function executeBulkMerchantAction(data: {
  merchant_ids: string[];
  action: 'add_credits' | 'set_limits' | 'enable_ai' | 'disable_ai' | 'extend_trial' | 'suspend' | 'activate';
  credit_amount?: number;
  daily_limit?: number;
  monthly_limit?: number;
  trial_days?: number;
  reason: string;
}): Promise<any> {
  const res = await apiFetch<any>('/master/merchants/bulk-action', {
    method: 'POST',
    body: data,
    portal: 'master',
  });
  return res.data;
}

// ── Store Plans Management ──────────────────────────────────────────────

export async function fetchStorePlans(): Promise<any[]> {
  const res = await apiFetch<any>('/master/store-plans', { portal: 'master' });
  return res.data;
}

export async function updateStorePlan(
  id: string,
  data: {
    name?: string;
    price_sar?: number;
    product_limit?: number;
    storage_mb?: number;
    team_seats?: number;
    features?: string[];
    is_active?: boolean;
    reason: string;
  }
): Promise<void> {
  await apiFetch(`/master/store-plans/${id}`, {
    method: 'PATCH',
    body: data,
    portal: 'master',
  });
}

export async function assignStorePlan(data: {
  store_id: string;
  plan_id: string;
  status?: string;
  duration_days?: number;
  reason: string;
}): Promise<any> {
  const res = await apiFetch<any>('/master/store-plans/assign', {
    method: 'POST',
    body: data,
    portal: 'master',
  });
  return res.data;
}

// ── AI Subscriptions (6 Offers) ─────────────────────────────────────────

export async function fetchAiPlans(): Promise<AiPlanItem[]> {
  const res = await apiFetch<any>('/master/ai-plans', { portal: 'master' });
  return res.data;
}

export async function updateAiPlan(
  id: string,
  data: Partial<AiPlanItem> & { reason: string }
): Promise<void> {
  await apiFetch(`/master/ai-plans/${id}`, {
    method: 'PATCH',
    body: data,
    portal: 'master',
  });
}

export async function assignAiSubscription(data: {
  store_id: string;
  plan_id: string;
  merchant_id?: string;
  status?: string;
  duration_days?: number;
  custom_limits?: Record<string, unknown>;
  reason: string;
}): Promise<any> {
  const res = await apiFetch<any>('/master/ai-plans/assign', {
    method: 'POST',
    body: data,
    portal: 'master',
  });
  return res.data;
}

export async function toggleAiSubscriptionStatus(
  id: string,
  status: 'active' | 'suspended',
  reason: string
): Promise<void> {
  await apiFetch(`/master/ai-plans/${id}/toggle-status`, {
    method: 'POST',
    body: { status, reason },
    portal: 'master',
  });
}

// ── AI Feature Registry ─────────────────────────────────────────────────

export async function fetchAiFeaturesRegistry(): Promise<AiFeatureItem[]> {
  const res = await apiFetch<any>('/master/ai-features', { portal: 'master' });
  return res.data;
}

export async function updateGlobalAiFeature(
  id: string,
  data: {
    global_status?: boolean;
    credit_cost?: number;
    daily_limit?: number;
    monthly_limit?: number;
    default_model?: string;
    is_active?: boolean;
    reason: string;
  }
): Promise<void> {
  await apiFetch(`/master/ai-features/${id}`, {
    method: 'PATCH',
    body: data,
    portal: 'master',
  });
}

export async function setMerchantFeatureOverride(data: {
  store_id: string;
  feature_id: string;
  merchant_id?: string;
  is_enabled: boolean;
  custom_credit_cost?: number;
  custom_daily_limit?: number;
  custom_monthly_limit?: number;
  notes?: string;
  reason: string;
}): Promise<void> {
  await apiFetch('/master/ai-features/override', {
    method: 'POST',
    body: data,
    portal: 'master',
  });
}

export async function bulkToggleAiFeature(data: {
  store_ids: string[];
  feature_id: string;
  is_enabled: boolean;
  reason: string;
}): Promise<void> {
  await apiFetch('/master/ai-features/bulk-toggle', {
    method: 'POST',
    body: data,
    portal: 'master',
  });
}

export async function resetStoreFeatureOverrides(storeId: string, reason?: string): Promise<void> {
  await apiFetch(`/master/ai-features/stores/${storeId}/reset`, {
    method: 'POST',
    body: { reason },
    portal: 'master',
  });
}

// ── Credit Management & Wallets ─────────────────────────────────────────

export async function fetchCreditWallets(): Promise<any[]> {
  const res = await apiFetch<any>('/master/credits/wallets', { portal: 'master' });
  return res.data;
}

export async function fetchCreditTransactions(params?: {
  store_id?: string;
  type?: string;
  page?: number;
}): Promise<any> {
  const q = new URLSearchParams();
  if (params?.store_id) q.set('store_id', params.store_id);
  if (params?.type) q.set('type', params.type);
  if (params?.page) q.set('page', String(params.page));

  const res = await apiFetch<any>(`/master/credits/transactions?${q.toString()}`, { portal: 'master' });
  return res;
}

export async function adjustMerchantCredits(data: {
  store_id: string;
  merchant_id?: string;
  amount: number;
  transaction_type: string;
  reason: string;
}): Promise<any> {
  const res = await apiFetch<any>('/master/credits/adjust', {
    method: 'POST',
    body: data,
    portal: 'master',
  });
  return res.data;
}

export async function bulkCreditGrant(data: {
  scope: 'all' | 'selected';
  store_ids?: string[];
  amount: number;
  reason: string;
}): Promise<void> {
  await apiFetch('/master/credits/bulk-grant', {
    method: 'POST',
    body: data,
    portal: 'master',
  });
}

// ── Payment Approvals ───────────────────────────────────────────────────

export async function fetchPaymentRequests(params?: {
  status?: string;
  store_id?: string;
  page?: number;
}): Promise<{ data: PaymentRequestItem[]; pagination: any }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.store_id) q.set('store_id', params.store_id);
  if (params?.page) q.set('page', String(params.page));

  const res = await apiFetch<any>(`/master/payments?${q.toString()}`, { portal: 'master' });
  return { data: res.data, pagination: res.pagination };
}

export async function approvePaymentRequest(
  id: string,
  data?: { notes?: string; reason?: string }
): Promise<any> {
  const res = await apiFetch<any>(`/master/payments/${id}/approve`, {
    method: 'POST',
    body: data || {},
    portal: 'master',
  });
  return res.data;
}

export async function rejectPaymentRequest(
  id: string,
  rejection_reason: string
): Promise<any> {
  const res = await apiFetch<any>(`/master/payments/${id}/reject`, {
    method: 'POST',
    body: { rejection_reason },
    portal: 'master',
  });
  return res.data;
}

// ── Page Visibility Management ──────────────────────────────────────────

export async function fetchPagesRegistry(): Promise<DashboardPageItem[]> {
  const res = await apiFetch<any>('/master/pages', { portal: 'master' });
  return res.data;
}

export async function toggleGlobalPage(
  id: string,
  global_visibility: boolean,
  reason: string
): Promise<void> {
  await apiFetch(`/master/pages/${id}/toggle-global`, {
    method: 'PATCH',
    body: { global_visibility, reason },
    portal: 'master',
  });
}

export async function setStorePageOverride(data: {
  store_id: string;
  page_id: string;
  merchant_id?: string;
  is_visible: boolean;
  reason: string;
}): Promise<void> {
  await apiFetch('/master/pages/override', {
    method: 'POST',
    body: data,
    portal: 'master',
  });
}

export async function resetStorePageOverrides(storeId: string, reason?: string): Promise<void> {
  await apiFetch(`/master/pages/stores/${storeId}/reset`, {
    method: 'POST',
    body: { reason },
    portal: 'master',
  });
}

// ── UI Components Management ────────────────────────────────────────────

export async function fetchComponentsRegistry(): Promise<UiComponentItem[]> {
  const res = await apiFetch<any>('/master/components', { portal: 'master' });
  return res.data;
}

export async function toggleGlobalComponent(
  id: string,
  global_visibility: boolean,
  reason: string
): Promise<void> {
  await apiFetch(`/master/components/${id}/toggle-global`, {
    method: 'PATCH',
    body: { global_visibility, reason },
    portal: 'master',
  });
}

export async function setStoreComponentOverride(data: {
  store_id: string;
  component_id: string;
  merchant_id?: string;
  is_visible: boolean;
  custom_order?: number;
  custom_title_en?: string;
  custom_title_ar?: string;
  custom_settings?: Record<string, unknown>;
  reason: string;
}): Promise<void> {
  await apiFetch('/master/components/override', {
    method: 'POST',
    body: data,
    portal: 'master',
  });
}

export async function resetStoreComponentOverrides(storeId: string, reason?: string): Promise<void> {
  await apiFetch(`/master/components/stores/${storeId}/reset`, {
    method: 'POST',
    body: { reason },
    portal: 'master',
  });
}

// ── Master Audit Logs ───────────────────────────────────────────────────

export async function fetchCentralAuditLogs(params?: {
  admin_id?: string;
  store_id?: string;
  domain?: string;
  action?: string;
  page?: number;
}): Promise<{ data: AuditLogItem[]; pagination: any }> {
  const q = new URLSearchParams();
  if (params?.admin_id) q.set('admin_id', params.admin_id);
  if (params?.store_id) q.set('store_id', params.store_id);
  if (params?.domain) q.set('domain', params.domain);
  if (params?.action) q.set('action', params.action);
  if (params?.page) q.set('page', String(params.page));

  const res = await apiFetch<any>(`/master/audit-logs?${q.toString()}`, { portal: 'master' });
  return { data: res.data, pagination: res.pagination };
}

// ── Real-Time Dynamic Configuration Sync ────────────────────────────────

export async function fetchDynamicConfigSync(storeId?: string): Promise<any> {
  const url = storeId ? `/config/sync?store_id=${encodeURIComponent(storeId)}` : '/config/sync';
  const res = await apiFetch<any>(url, {
    storeId,
    allowNotFound: true,
  });
  return res?.data;
}
