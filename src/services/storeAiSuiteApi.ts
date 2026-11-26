/**
 * Store AI Tools suite — status + text/automation + central engine modules.
 * Payment unlock is Master-owned; store only reads gates + runs unlocked modules.
 */

import { apiFetch } from '../api/client';

export type AiSuiteModule = 'images' | 'text' | 'automation';

export type AiSuiteModuleStatus = {
  module: AiSuiteModule;
  pro_eligible: boolean;
  enabled: boolean;
  unlocked: boolean;
  payment_status: string;
  usage_unlocked_until?: string | null;
  payment_required_for_usage?: boolean;
  intelligence_level?: string;
  [key: string]: unknown;
};

export type AiTrialStatus = {
  limit: number;
  used: number;
  remaining: number;
  status: string;
  is_active: boolean;
  is_paid?: boolean;
};

export type BankTransferDetails = {
  bank_name_ar: string;
  bank_name_en: string;
  beneficiary_name_ar: string;
  beneficiary_name_en: string;
  iban: string;
  account_number: string;
  stc_pay_phone: string;
  vat_number: string;
};

export type AiPaymentRecord = {
  id: string;
  store_id: string;
  package_id: string;
  package_name: string;
  amount_sar: number;
  payment_method: string;
  transaction_ref: string;
  sender_name?: string | null;
  proof_path?: string | null;
  proof_url?: string | null;
  proof_type: 'image' | 'pdf' | string;
  status: 'pending' | 'approved' | 'rejected' | string;
  limits_granted?: {
    image_quota?: number;
    text_tokens?: number;
    auto_questions?: number;
    calling_minutes?: number;
  } | null;
  notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at?: string;
};

export type AiPaymentPackage = {
  id: string;
  level: 'low' | 'medium' | 'high' | string;
  label_en: string;
  label_ar: string;
  price_sar: number;
  includes_en: string;
  includes_ar: string;
  image_quota?: number;
  text_tokens?: number;
  auto_questions?: number;
  calling_minutes?: number;
};

export type AiEngineModule = {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  status: 'available' | 'blocked' | string;
  gate: 'text' | 'images' | 'automation' | 'none' | string;
  provider: string;
  unlocked: boolean;
  pro_eligible: boolean;
  payment_status: string;
};

export type AiAddonPrice = {
  id: string;
  category: string;
  name_en: string;
  name_ar: string;
  price_sar: number;
  billing: string;
  currency?: string;
  unlocked?: boolean;
  description_en?: string;
  description_ar?: string;
  master_must_approve?: boolean;
};

export type AiSuiteStatus = {
  store_id: string;
  pro_eligible: boolean;
  plan_code: string;
  openai_key_configured: boolean;
  gemini_ready: boolean;
  trial?: AiTrialStatus;
  bank_transfer_details?: BankTransferDetails;
  payments?: AiPaymentRecord[];
  modules: {
    images: AiSuiteModuleStatus;
    text: AiSuiteModuleStatus;
    automation: AiSuiteModuleStatus;
  };
  engine_modules?: AiEngineModule[];
  payment_packages: AiPaymentPackage[];
  addons?: AiAddonPrice[];
  levels: Record<string, unknown>;
  master_owned: boolean;
  note_en: string;
  note_ar: string;
};

export async function fetchAiSuiteStatus(storeId: string): Promise<AiSuiteStatus> {
  const res = await apiFetch<{ data: AiSuiteStatus }>('/ai-suite/status', {
    method: 'GET',
    storeId,
  });
  return res.data;
}

export async function runAiSuiteText(
  storeId: string,
  prompt: string,
): Promise<{ ok: boolean; data?: { content?: string }; message?: string; code?: string; payment_required?: boolean }> {
  return apiFetch('/ai-suite/text', {
    method: 'POST',
    storeId,
    timeoutMs: 90_000,
    body: { prompt },
  });
}

export async function askAiSuiteAutomation(
  storeId: string,
  question: string,
): Promise<{ ok: boolean; data?: { content?: string }; message?: string; code?: string; payment_required?: boolean }> {
  return apiFetch('/ai-suite/automation/ask', {
    method: 'POST',
    storeId,
    timeoutMs: 90_000,
    body: { question },
  });
}

export async function runAiEngineModule(
  storeId: string,
  module: string,
  prompt: string,
): Promise<{
  ok: boolean;
  status?: string;
  module?: string;
  data?: { content?: string };
  message?: string;
  message_ar?: string;
  code?: string;
  payment_required?: boolean;
  redirect?: string;
}> {
  return apiFetch('/ai-suite/run', {
    method: 'POST',
    storeId,
    timeoutMs: 90_000,
    body: { module, prompt },
  });
}

export function moduleNeedsPayment(mod: AiSuiteModuleStatus | undefined, isTrialActive?: boolean): boolean {
  if (isTrialActive) return false;
  if (!mod) return true;
  return !mod.unlocked;
}

export function engineGateToSuiteModule(gate: string): AiSuiteModule | null {
  if (gate === 'images' || gate === 'text' || gate === 'automation') return gate;
  return null;
}

export type AiDevSupportRequest = {
  id: string;
  store_id: string;
  status: string;
  priority: string;
  category: string;
  title: string;
  description: string;
  created_at?: string;
};

export async function fetchStoreAiDevRequests(storeId: string): Promise<AiDevSupportRequest[]> {
  const res = await apiFetch<{ data: AiDevSupportRequest[] }>('/ai-suite/dev-requests', {
    method: 'GET',
    storeId,
  });
  return Array.isArray(res?.data) ? res.data : [];
}

export async function createStoreAiDevRequest(
  storeId: string,
  payload: {
    title: string;
    description: string;
    category?: string;
    priority?: string;
  },
): Promise<{ data: AiDevSupportRequest; message?: string; message_ar?: string }> {
  return apiFetch('/ai-suite/dev-requests', {
    method: 'POST',
    storeId,
    body: payload,
  });
}

export async function submitAiPaymentProof(
  storeId: string,
  payload: {
    package_id: string;
    transaction_ref: string;
    amount_sar: number;
    sender_name?: string;
    payment_method?: string;
    notes?: string;
    proof_base64?: string;
    proof_filename?: string;
  },
): Promise<{ ok: boolean; message?: string; message_ar?: string; data?: { payment: AiPaymentRecord; suite: AiSuiteStatus } }> {
  return apiFetch('/ai-suite/payment/submit', {
    method: 'POST',
    storeId,
    body: payload,
  });
}

export async function fetchAiPayments(storeId: string): Promise<AiPaymentRecord[]> {
  const res = await apiFetch<{ ok: boolean; data: AiPaymentRecord[] }>('/ai-suite/payments', {
    method: 'GET',
    storeId,
  });
  return Array.isArray(res?.data) ? res.data : [];
}
