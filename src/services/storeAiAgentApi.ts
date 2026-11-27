import { apiFetch } from '../api/client';

export interface StoreAuditIssue {
  id: string;
  category: 'payment' | 'shipping' | 'tax' | 'store' | 'legal' | 'seo' | 'catalog';
  severity: 'critical' | 'warning';
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  is_resolved: boolean;
  is_skipped?: boolean;
  details_en?: string;
  details_ar?: string;
  nav_tab: string;
  can_ai_fix: boolean;
  ai_action: string;
  ai_fix_label_en: string;
  ai_fix_label_ar: string;
  fee_status: string;
}

export interface StoreAuditResponse {
  health_score: number;
  grade: string;
  total_checks: number;
  completed_checks: number;
  critical_count: number;
  warning_count: number;
  skipped_count: number;
  issues: StoreAuditIssue[];
  skipped: StoreAuditIssue[];
  resolved: StoreAuditIssue[];
  store_name: string;
  store_category: string;
  pricing_info: {
    model: string;
    tier: string;
    platform_fee: string;
    status: string;
  };
  last_audited_at: string;
}

export async function fetchStoreAudit(storeId: string): Promise<StoreAuditResponse> {
  const res = await apiFetch<{ success: boolean; data: StoreAuditResponse }>('/ai-agent/audit', {
    storeId,
  });
  return res.data;
}

export async function fixStoreAuditIssue(
  storeId: string,
  issueType: string,
): Promise<{ success: boolean; message: string; message_ar?: string; data?: any }> {
  return apiFetch<{ success: boolean; message: string; message_ar?: string; data?: any }>('/ai-agent/fix', {
    method: 'POST',
    storeId,
    body: { issue_type: issueType },
  });
}

export async function skipStoreAuditIssue(
  storeId: string,
  issueId: string,
): Promise<{ success: boolean; message: string; skipped_count: number }> {
  return apiFetch<{ success: boolean; message: string; skipped_count: number }>('/ai-agent/skip', {
    method: 'POST',
    storeId,
    body: { issue_id: issueId },
  });
}

export async function unskipStoreAuditIssue(
  storeId: string,
  issueId: string,
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/ai-agent/unskip', {
    method: 'POST',
    storeId,
    body: { issue_id: issueId },
  });
}
