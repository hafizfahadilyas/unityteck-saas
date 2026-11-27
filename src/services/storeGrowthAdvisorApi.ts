import { apiFetch } from '../api/client';

export type GrowthCategory =
  | 'upselling'
  | 'cross_selling'
  | 'product_recommendations'
  | 'seo_optimization'
  | 'abandoned_cart'
  | 'whatsapp_automation'
  | 'ai_chatbot'
  | 'ai_calling'
  | 'marketing_campaigns'
  | 'social_automation'
  | 'homepage_optimization'
  | 'checkout_optimization'
  | 'customer_retention'
  | 'loyalty_programs'
  | 'sales_analytics';

export type ExecutionMode =
  | 'recommendation_only'
  | 'merchant_approval'
  | 'preapproved_automation';

export interface GrowthHealth {
  score: number;
  grade: string;
  breakdown: {
    payments?: number;
    shipping?: number;
    catalog?: number;
    seo?: number;
    conversion?: number;
    retention?: number;
  };
}

export interface GrowthWallet {
  remaining_credits: number;
  daily_limit: number;
  monthly_limit: number;
  used_today: number;
  used_month: number;
}

export interface GrowthSettings {
  execution_mode: ExecutionMode;
  auto_daily_audit: boolean;
  auto_apply_seo: boolean;
  auto_apply_cart_recovery: boolean;
  last_audited_at?: string | null;
}

export interface GrowthRecommendation {
  id: string;
  store_id: string;
  category: GrowthCategory;
  feature_name: string;
  problem_identified: string;
  reason: string;
  supporting_store_data?: Record<string, unknown> | null;
  expected_benefit: string;
  implementation_steps: string[];
  required_credits: number;
  action_key: string;
  manual_config_url?: string | null;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'skipped' | 'failed';
  created_at?: string;
  updated_at?: string;
}

export interface GrowthAction {
  id: string;
  store_id: string;
  recommendation_id?: string | null;
  action_type: string;
  merchant_user_id?: string | null;
  execution_mode: ExecutionMode;
  credits_cost: number;
  credits_refunded: number;
  proposed_changes?: Record<string, unknown> | null;
  before_state: Record<string, unknown>;
  after_state?: Record<string, unknown> | null;
  execution_result: 'pending' | 'success' | 'failed' | 'rolled_back';
  error_message?: string | null;
  is_rolled_back: boolean;
  rolled_back_at?: string | null;
  created_at: string;
  recommendation?: GrowthRecommendation | null;
}

export interface GrowthOverviewResponse {
  ok: boolean;
  health: GrowthHealth;
  wallet: GrowthWallet;
  settings: GrowthSettings;
  stats: {
    pending_recommendations: number;
    completed_recommendations: number;
  };
  recent_actions: GrowthAction[];
}

export interface GrowthPlanResponse {
  ok: boolean;
  data: {
    can_execute: boolean;
    feature_available: boolean;
    subscription_permission: boolean;
    plan_code: string;
    required_credits: number;
    current_balance: number;
    has_enough_credits: boolean;
    recommendation: GrowthRecommendation;
    proposed_changes: {
      target: string;
      action: string;
      safe_html: boolean;
    };
  };
}

export interface GrowthExecuteResponse {
  ok: boolean;
  message: string;
  code?: string;
  action?: GrowthAction;
  new_balance?: number;
  current_balance?: number;
  required_credits?: number;
}

export async function fetchGrowthOverview(storeId: string): Promise<GrowthOverviewResponse> {
  return apiFetch('/growth-advisor/overview', {
    method: 'GET',
    storeId,
  });
}

export async function analyzeStoreGrowth(storeId: string): Promise<{ ok: boolean; data: unknown }> {
  return apiFetch('/growth-advisor/analyze', {
    method: 'POST',
    storeId,
  });
}

export async function fetchGrowthRecommendations(
  storeId: string,
  status?: string
): Promise<{ ok: boolean; data: GrowthRecommendation[]; count: number }> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch(`/growth-advisor/recommendations${query}`, {
    method: 'GET',
    storeId,
  });
}

export async function fetchRecommendationPlan(
  storeId: string,
  recId: string
): Promise<GrowthPlanResponse> {
  return apiFetch(`/growth-advisor/recommendations/${recId}/plan`, {
    method: 'GET',
    storeId,
  });
}

export async function executeGrowthRecommendation(
  storeId: string,
  recId: string
): Promise<GrowthExecuteResponse> {
  return apiFetch(`/growth-advisor/recommendations/${recId}/execute`, {
    method: 'POST',
    storeId,
  });
}

export async function skipGrowthRecommendation(
  storeId: string,
  recId: string
): Promise<{ ok: boolean; message: string }> {
  return apiFetch(`/growth-advisor/recommendations/${recId}/skip`, {
    method: 'POST',
    storeId,
  });
}

export async function rollbackGrowthAction(
  storeId: string,
  actionId: string
): Promise<{ ok: boolean; message: string }> {
  return apiFetch(`/growth-advisor/actions/${actionId}/rollback`, {
    method: 'POST',
    storeId,
  });
}

export async function updateGrowthSettings(
  storeId: string,
  settings: Partial<GrowthSettings & { daily_credit_limit?: number; monthly_credit_limit?: number }>
): Promise<{ ok: boolean; message: string; data: unknown }> {
  return apiFetch('/growth-advisor/settings', {
    method: 'PUT',
    storeId,
    body: settings,
  });
}

export async function fetchGrowthHistory(
  storeId: string
): Promise<{ ok: boolean; data: { data: GrowthAction[]; total: number } }> {
  return apiFetch('/growth-advisor/history', {
    method: 'GET',
    storeId,
  });
}
