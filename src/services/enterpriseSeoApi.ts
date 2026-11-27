import { apiFetch } from '../api/client';

export interface SeoDashboardData {
  store_id: string;
  live_domain: string;
  health_score: number;
  technical_score: number;
  product_seo_score: number;
  meta_completion_score: number;
  aeo_readiness_score: number;
  geo_readiness_score: number;
  speed_mobile_score: number;
  speed_desktop_score: number;
  pages_crawled: number;
  broken_links_count: number;
  indexed_pages_count: number;
  verified_backlinks_count: number;
  total_backlink_records: number;
  open_issues_count: number;
  critical_issues_count: number;
  latest_issues: SeoIssueItem[];
  gsc_connected: boolean;
  gsc_property?: string | null;
  automation_mode: 'manual' | 'approval_required' | 'pre_approved';
  last_audited_at?: string | null;
}

export interface SeoIssueItem {
  id: string;
  audit_id?: string;
  store_id: string;
  category: 'technical' | 'meta' | 'speed' | 'content' | 'link' | 'schema' | 'aeo' | 'geo' | 'mobile';
  severity: 'critical' | 'warning' | 'info';
  affected_url: string;
  title_en: string;
  title_ar: string;
  issue_description_en: string;
  issue_description_ar: string;
  why_it_matters_en: string;
  why_it_matters_ar: string;
  suggested_solution_en: string;
  suggested_solution_ar: string;
  ai_credits_cost: number;
  auto_fixable: boolean;
  status: 'open' | 'in_progress' | 'resolved' | 'ignored';
  proposed_payload?: Record<string, unknown> | null;
  created_at?: string;
}

export interface ProductSeoGeneratedData {
  seo_title_ar: string;
  seo_title_en: string;
  meta_description_ar: string;
  meta_description_en: string;
  product_seo_description_ar: string;
  product_seo_description_en: string;
  short_description_ar: string;
  short_description_en: string;
  long_description_ar: string;
  long_description_en: string;
  focus_keyword: string;
  secondary_keywords: string[];
  search_intent: string;
  image_alt_text_ar: string;
  image_alt_text_en: string;
  image_title_ar: string;
  image_title_en: string;
  image_description_ar: string;
  image_description_en: string;
  og_title_ar: string;
  og_title_en: string;
  og_description_ar: string;
  og_description_en: string;
  social_sharing_content_ar: string;
  social_sharing_content_en: string;
  faq_suggestions: Array<{
    q_ar: string;
    a_ar: string;
    q_en: string;
    a_en: string;
  }>;
}

export interface MasterSeoOverviewData {
  total_stores: number;
  avg_health_score: number;
  avg_technical_score: number;
  open_issues_count: number;
  critical_issues_count: number;
  connected_gsc_count: number;
  connected_indexnow_count: number;
  recent_audits: Array<Record<string, unknown>>;
  providers: {
    primary_ai: string;
    optional_ai: string[];
    free_tools: string[];
  };
}

export interface MasterStoreSeoItem {
  store_id: string;
  name: string;
  name_ar?: string;
  slug: string;
  live_domain: string;
  health_score: number;
  technical_score: number;
  product_seo_score: number;
  meta_completion_score: number;
  open_issues: number;
  gsc_connected: boolean;
  indexnow_connected: boolean;
  last_audited_at?: string | null;
}

// Master Admin Endpoints
export async function fetchMasterSeoOverview(): Promise<MasterSeoOverviewData> {
  const res = await apiFetch<MasterSeoOverviewData>('/master/seo/overview');
  return res.data;
}

export async function fetchMasterSeoStores(): Promise<MasterStoreSeoItem[]> {
  const res = await apiFetch<{ data: MasterStoreSeoItem[] }>('/master/seo/stores');
  return res.data.data;
}

export async function triggerMasterStoreAudit(storeId: string): Promise<Record<string, unknown>> {
  const res = await apiFetch<Record<string, unknown>>(`/master/seo/stores/${storeId}/audit`, {
    method: 'POST',
  });
  return res.data;
}

// Merchant Dashboard & Isolated Operations
export async function fetchMerchantSeoDashboard(storeId: string): Promise<SeoDashboardData> {
  const res = await apiFetch<SeoDashboardData>('/seo/dashboard', {
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function triggerMerchantSeoAudit(storeId: string, auditType = 'full'): Promise<Record<string, unknown>> {
  const res = await apiFetch<Record<string, unknown>>('/seo/audit', {
    method: 'POST',
    headers: { 'X-Store-Id': storeId },
    body: JSON.stringify({ audit_type: auditType }),
  });
  return res.data;
}

export async function fetchSeoIssues(storeId: string, params: { category?: string; severity?: string; status?: string } = {}): Promise<any> {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const res = await apiFetch<any>(`/seo/issues${query ? `?${query}` : ''}`, {
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function resolveSeoIssue(storeId: string, issueId: string, payload?: Record<string, unknown>): Promise<any> {
  const res = await apiFetch<any>(`/seo/issues/${issueId}/resolve`, {
    method: 'POST',
    headers: { 'X-Store-Id': storeId },
    body: JSON.stringify({ payload }),
  });
  return res.data;
}

export async function ignoreSeoIssue(storeId: string, issueId: string): Promise<any> {
  const res = await apiFetch<any>(`/seo/issues/${issueId}/ignore`, {
    method: 'POST',
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function generateProductSeo(storeId: string, productId: string): Promise<{ success: boolean; data: ProductSeoGeneratedData; credits_deducted: number }> {
  const res = await apiFetch<{ success: boolean; data: ProductSeoGeneratedData; credits_deducted: number }>(
    `/seo/products/${productId}/generate`,
    {
      method: 'POST',
      headers: { 'X-Store-Id': storeId },
    }
  );
  return res.data;
}

export async function bulkGenerateProductSeo(
  storeId: string,
  params: { product_ids?: string[]; category_id?: string }
): Promise<any> {
  const res = await apiFetch<any>('/seo/products/bulk-generate', {
    method: 'POST',
    headers: { 'X-Store-Id': storeId },
    body: JSON.stringify(params),
  });
  return res.data;
}

export async function saveSeoMetadata(
  storeId: string,
  data: {
    entity_type: string;
    entity_id: string;
    url_path: string;
    payload: Record<string, unknown>;
    recommendation_id?: string;
  }
): Promise<any> {
  const res = await apiFetch<any>('/seo/metadata', {
    method: 'POST',
    headers: { 'X-Store-Id': storeId },
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function fetchSeoImplementations(storeId: string): Promise<any> {
  const res = await apiFetch<any>('/seo/implementations', {
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function rollbackSeoImplementation(storeId: string, implementationId: string): Promise<any> {
  const res = await apiFetch<any>(`/seo/implementations/${implementationId}/rollback`, {
    method: 'POST',
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function generateAeoContent(storeId: string, productId?: string): Promise<any> {
  const res = await apiFetch<any>('/seo/aeo/generate', {
    method: 'POST',
    headers: { 'X-Store-Id': storeId },
    body: JSON.stringify({ product_id: productId }),
  });
  return res.data;
}

export async function generateGeoContent(storeId: string): Promise<any> {
  const res = await apiFetch<any>('/seo/geo/generate', {
    method: 'POST',
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function fetchSeoSpeedReport(storeId: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<any> {
  const res = await apiFetch<any>(`/seo/speed?strategy=${strategy}`, {
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function fetchSeoBacklinks(storeId: string): Promise<any> {
  const res = await apiFetch<any>('/seo/backlinks', {
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function fetchSeoKeywords(storeId: string): Promise<any> {
  const res = await apiFetch<{ data: any[] }>('/seo/keywords', {
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function addSeoKeyword(storeId: string, keywordData: Record<string, unknown>): Promise<any> {
  const res = await apiFetch<any>('/seo/keywords', {
    method: 'POST',
    headers: { 'X-Store-Id': storeId },
    body: JSON.stringify(keywordData),
  });
  return res.data;
}

export async function fetchSearchConsoleData(storeId: string): Promise<any> {
  const res = await apiFetch<any>('/seo/search-console', {
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function submitIndexNowUrls(storeId: string, urls: string[]): Promise<any> {
  const res = await apiFetch<any>('/seo/indexnow/submit', {
    method: 'POST',
    headers: { 'X-Store-Id': storeId },
    body: JSON.stringify({ urls }),
  });
  return res.data;
}

export async function fetchIndexNowKey(storeId: string): Promise<{ key: string; verification_file_url: string }> {
  const res = await apiFetch<{ key: string; verification_file_url: string }>('/seo/indexnow/key', {
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function fetchSeoSettings(storeId: string): Promise<any> {
  const res = await apiFetch<{ data: any }>('/seo/settings', {
    headers: { 'X-Store-Id': storeId },
  });
  return res.data;
}

export async function updateSeoSettings(storeId: string, settings: Record<string, unknown>): Promise<any> {
  const res = await apiFetch<any>('/seo/settings', {
    method: 'PATCH',
    headers: { 'X-Store-Id': storeId },
    body: JSON.stringify(settings),
  });
  return res.data;
}
