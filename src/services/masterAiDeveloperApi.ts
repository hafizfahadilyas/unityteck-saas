/**
 * Phase 3 — Master AI developer diagnostics (read-only).
 * Auto-deploy endpoints must always fail closed.
 */

import { apiFetch } from '../api/client';

export type AiDevRequestRow = {
  id: string;
  store_id: string;
  status: string;
  priority: string;
  category: string;
  title: string;
  description: string;
  diagnosis?: Record<string, unknown> | null;
  master_notes?: string | null;
  auto_deploy_allowed?: boolean;
  created_at?: string;
  diagnosed_at?: string | null;
};

export async function fetchMasterAiDevRequests(storeId?: string) {
  const q = storeId ? `?store_id=${encodeURIComponent(storeId)}` : '';
  return apiFetch<{ data: AiDevRequestRow[]; count: number }>(`/master/ai-developer/requests${q}`, {
    portal: 'master',
  });
}

export async function runMasterAiDiagnose(storeId: string, requestId?: string) {
  return apiFetch<{ ok: boolean; data: Record<string, unknown>; request?: AiDevRequestRow }>(
    '/master/ai-developer/diagnose',
    {
      method: 'POST',
      portal: 'master',
      timeoutMs: 60_000,
      body: {
        store_id: storeId,
        ...(requestId ? { request_id: requestId } : {}),
      },
    },
  );
}

export async function closeMasterAiDevRequest(
  id: string,
  status: 'closed' | 'rejected',
  masterNotes?: string,
) {
  return apiFetch(`/master/ai-developer/requests/${encodeURIComponent(id)}/close`, {
    method: 'POST',
    portal: 'master',
    body: { status, master_notes: masterNotes || undefined },
  });
}
