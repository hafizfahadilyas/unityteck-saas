/**
 * WhatsApp Manager API Service
 * 100% Real API integration with multi-tenant store_id isolation.
 * Strictly NO dummy/mock data.
 */

import { apiFetch } from '../api/client';
import type {
  WhatsAppOverviewData,
  WhatsAppMessageItem,
  WhatsAppPaginationInfo,
  WhatsAppFilterParams,
  WhatsAppTemplateItem,
  SendWhatsAppPayload,
  MasterStoreWhatsAppQuota,
} from '../types/whatsapp';

export async function fetchWhatsAppOverview(storeId: string): Promise<WhatsAppOverviewData> {
  const res = await apiFetch<{ success: boolean; data: WhatsAppOverviewData }>('/whatsapp/overview', {
    storeId,
  });
  return res.data;
}

export async function fetchWhatsAppMessages(
  storeId: string,
  filters: WhatsAppFilterParams = {},
): Promise<{ data: WhatsAppMessageItem[]; pagination: WhatsAppPaginationInfo }> {
  const queryParams = new URLSearchParams();

  if (filters.category && filters.category !== 'all') queryParams.set('category', filters.category);
  if (filters.status && filters.status !== 'all') queryParams.set('status', filters.status);
  if (filters.search && filters.search.trim()) queryParams.set('search', filters.search.trim());
  if (filters.date_from) queryParams.set('date_from', filters.date_from);
  if (filters.date_to) queryParams.set('date_to', filters.date_to);
  if (filters.message_type && filters.message_type !== 'all') queryParams.set('message_type', filters.message_type);
  if (filters.template && filters.template !== 'all') queryParams.set('template', filters.template);
  if (filters.agent && filters.agent !== 'all') queryParams.set('agent', filters.agent);
  if (filters.page) queryParams.set('page', String(filters.page));
  if (filters.per_page) queryParams.set('per_page', String(filters.per_page));

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/whatsapp/messages?${queryString}` : '/whatsapp/messages';

  const res = await apiFetch<{
    success: boolean;
    data: WhatsAppMessageItem[];
    pagination: WhatsAppPaginationInfo;
  }>(endpoint, {
    storeId,
  });

  return {
    data: res.data || [],
    pagination: res.pagination || {
      current_page: 1,
      last_page: 1,
      per_page: 12,
      total: 0,
    },
  };
}

export async function sendWhatsAppMessageApi(
  storeId: string,
  payload: SendWhatsAppPayload,
): Promise<{
  success: boolean;
  message: string;
  data: WhatsAppMessageItem;
  direct_url?: string;
  is_direct_free?: boolean;
  daily_remaining?: number;
}> {
  return apiFetch<{
    success: boolean;
    message: string;
    data: WhatsAppMessageItem;
    direct_url?: string;
    is_direct_free?: boolean;
    daily_remaining?: number;
  }>('/whatsapp/messages', {
    method: 'POST',
    storeId,
    body: payload,
  });
}

export async function fetchWhatsAppTemplates(storeId: string): Promise<WhatsAppTemplateItem[]> {
  const res = await apiFetch<{ success: boolean; data: WhatsAppTemplateItem[] }>('/whatsapp/templates', {
    storeId,
  });
  return res.data || [];
}

export async function fetchWhatsAppLogs(
  storeId: string,
): Promise<{ recent_logs: WhatsAppMessageItem[]; error_logs: WhatsAppMessageItem[] }> {
  const res = await apiFetch<{
    success: boolean;
    data: { recent_logs: WhatsAppMessageItem[]; error_logs: WhatsAppMessageItem[] };
  }>('/whatsapp/logs', {
    storeId,
  });
  return res.data;
}

export async function fetchWhatsAppSettings(storeId: string): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any }>('/whatsapp/settings', {
    storeId,
  });
  return res.data;
}

export async function updateWhatsAppSettingsApi(storeId: string, payload: any): Promise<any> {
  return apiFetch<{ success: boolean; message: string; data: any }>('/whatsapp/settings', {
    method: 'PUT',
    storeId,
    body: payload,
  });
}

export async function testWhatsAppConnectionApi(storeId: string): Promise<any> {
  return apiFetch<{ success: boolean; message: string; status: string }>('/whatsapp/test-connection', {
    method: 'POST',
    storeId,
  });
}

export async function fetchWhatsAppContacts(
  storeId: string,
  params: { search?: string; page?: number; per_page?: number } = {},
): Promise<{ data: any[]; metrics: any; pagination: any }> {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.per_page) q.set('per_page', String(params.per_page));

  const endpoint = q.toString() ? `/whatsapp/contacts?${q.toString()}` : '/whatsapp/contacts';
  const res = await apiFetch<{ success: boolean; data: any[]; metrics: any; pagination: any }>(endpoint, {
    storeId,
  });
  return res;
}

export async function fetchWhatsAppSegments(storeId: string): Promise<any[]> {
  const res = await apiFetch<{ success: boolean; data: any[] }>('/whatsapp/segments', {
    storeId,
  });
  return res.data || [];
}

export async function fetchWhatsAppAutomations(storeId: string): Promise<any[]> {
  const res = await apiFetch<{ success: boolean; data: any[] }>('/whatsapp/automations', {
    storeId,
  });
  return res.data || [];
}

export async function updateWhatsAppAutomationsApi(storeId: string, automations: any[]): Promise<any> {
  return apiFetch<{ success: boolean; message: string; data: any[] }>('/whatsapp/automations', {
    method: 'PUT',
    storeId,
    body: { automations },
  });
}

export async function fetchWhatsAppCampaigns(storeId: string): Promise<any[]> {
  const res = await apiFetch<{ success: boolean; data: any[] }>('/whatsapp/campaigns', {
    storeId,
  });
  return res.data || [];
}

export async function createWhatsAppCampaignApi(storeId: string, payload: any): Promise<any> {
  return apiFetch<{ success: boolean; message: string; data: any }>('/whatsapp/campaigns', {
    method: 'POST',
    storeId,
    body: payload,
  });
}

export async function deleteWhatsAppCampaignApi(storeId: string, id: string): Promise<any> {
  return apiFetch<{ success: boolean; message: string }>(`/whatsapp/campaigns/${id}`, {
    method: 'DELETE',
    storeId,
  });
}

export async function createWhatsAppTemplateApi(storeId: string, payload: any): Promise<any> {
  return apiFetch<{ success: boolean; message: string; data: any }>('/whatsapp/templates', {
    method: 'POST',
    storeId,
    body: payload,
  });
}

export async function fetchMasterWhatsAppQuotas(): Promise<MasterStoreWhatsAppQuota[]> {
  const res = await apiFetch<{ success: boolean; data: MasterStoreWhatsAppQuota[] }>('/master/whatsapp/quotas');
  return res.data || [];
}

export async function updateMasterWhatsAppQuotaApi(
  storeId: string,
  payload: { daily_limit: number; monthly_limit: number },
): Promise<{ success: boolean; message: string; data: any }> {
  return apiFetch<{ success: boolean; message: string; data: any }>(`/master/whatsapp/quotas/${storeId}`, {
    method: 'PUT',
    body: payload,
  });
}

