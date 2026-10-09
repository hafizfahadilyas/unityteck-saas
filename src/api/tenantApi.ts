import { apiFetch } from './client';
import { readAuthSession } from '../auth/session';
import {
  mapCoupon,
  mapCustomer,
  mapOrder,
  mapProduct,
  mapSeo,
  mapShipping,
  mapStore,
  seoPatchToApi,
  type ApiCouponRow,
  type ApiCustomerRow,
  type ApiOrderRow,
  type ApiProductRow,
  type ApiSeoRow,
  type ApiShippingRow,
  type ApiStoreRow,
} from './mappers';
import type {
  CouponItem,
  Customer,
  Order,
  Product,
  ProductVariation,
  StoreCategory,
  ShippingZone,
  Store,
  StoreSEOConfig,
  MediaAsset,
  MediaUsage,
} from '../types';

type ListResponse<T> = { data: T[] };
type ItemResponse<T> = { data: T };

export async function fetchHealth(): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>('/health');
}

export async function fetchStores(): Promise<Store[]> {
  const session = readAuthSession();
  const portal = session?.portal === 'store' ? 'store' : 'master';
  const storeId =
    portal === 'store' && session?.storeId ? String(session.storeId) : undefined;

  const res = await apiFetch<ListResponse<ApiStoreRow>>('/stores', {
    portal: portal === 'master' ? 'master' : undefined,
    storeId,
  });
  let rows = (res.data ?? []).map(mapStore);
  if (storeId) {
    rows = rows.filter((s) => s.id === storeId);
  }
  return rows;
}

export async function createStore(
  payload: Record<string, unknown>,
): Promise<Store> {
  const res = await apiFetch<ItemResponse<ApiStoreRow>>('/stores', {
    method: 'POST',
    portal: 'master',
    body: payload,
  });
  return mapStore(res.data);
}

export async function updateStore(
  id: string,
  patch: Record<string, unknown>,
): Promise<Store> {
  const res = await apiFetch<ItemResponse<ApiStoreRow>>(`/stores/${id}`, {
    method: 'PATCH',
    portal: 'master',
    body: patch,
  });
  return mapStore(res.data);
}

export async function deleteStoreApi(id: string): Promise<void> {
  await apiFetch(`/stores/${id}`, {
    method: 'DELETE',
    portal: 'master',
  });
}

export type ProductListQuery = {
  q?: string;
  status?: string;
  category?: string;
  is_active?: boolean;
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  all?: boolean;
};

export type ProductListResult = {
  data: Product[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
    sort: string;
    dir: string;
  };
};

export async function fetchProducts(
  storeId: string,
  query: ProductListQuery = { all: true },
): Promise<Product[]> {
  const res = await fetchProductsPage(storeId, query);
  return res.data;
}

export async function fetchProductsPage(
  storeId: string,
  query: ProductListQuery = {},
): Promise<ProductListResult> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.status) params.set('status', query.status);
  if (query.category) params.set('category', query.category);
  if (query.is_active !== undefined) params.set('is_active', String(query.is_active));
  if (query.sort) params.set('sort', query.sort);
  if (query.dir) params.set('dir', query.dir);
  if (query.page) params.set('page', String(query.page));
  if (query.per_page) params.set('per_page', String(query.per_page));
  if (query.all) params.set('all', '1');

  const qs = params.toString();
  const res = await apiFetch<
    ListResponse<ApiProductRow> & { meta?: ProductListResult['meta'] }
  >(`/products${qs ? `?${qs}` : ''}`, { storeId });

  const data = (res.data ?? []).map(mapProduct);
  return {
    data,
    meta: res.meta ?? {
      total: data.length,
      page: 1,
      per_page: data.length || 25,
      last_page: 1,
      sort: query.sort ?? 'updated_at',
      dir: query.dir ?? 'desc',
    },
  };
}

export type CreateProductPayload = {
  name: string;
  price: number;
  sku: string;
  stock?: number;
  category?: string;
  image_url?: string;
  original_price?: number | null;
  description?: string | null;
  gallery_urls?: string[];
  video_url?: string | null;
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  status?: Product['status'];
  is_active?: boolean;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export async function createProduct(
  storeId: string,
  payload: CreateProductPayload,
): Promise<Product> {
  const res = await apiFetch<ItemResponse<ApiProductRow>>('/products', {
    method: 'POST',
    storeId,
    body: payload,
  });
  return mapProduct(res.data);
}

export async function updateProduct(
  storeId: string,
  id: string,
  payload: UpdateProductPayload,
): Promise<Product> {
  const res = await apiFetch<ItemResponse<ApiProductRow>>(`/products/${id}`, {
    method: 'PATCH',
    storeId,
    body: payload,
  });
  return mapProduct(res.data);
}

export async function deleteProduct(
  storeId: string,
  id: string,
): Promise<void> {
  await apiFetch(`/products/${id}`, { method: 'DELETE', storeId });
}

export async function togglePublishProduct(
  storeId: string,
  id: string,
): Promise<Product> {
  const res = await apiFetch<ItemResponse<ApiProductRow>>(
    `/products/${id}/toggle-publish`,
    { method: 'POST', storeId },
  );
  return mapProduct(res.data);
}

function mapVariation(row: Record<string, unknown>): ProductVariation {
  const optsRaw = row.options;
  let options: Record<string, string> = {};
  if (optsRaw && typeof optsRaw === 'object' && !Array.isArray(optsRaw)) {
    options = Object.fromEntries(
      Object.entries(optsRaw as Record<string, unknown>)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => [k, String(v)]),
    );
  }
  return {
    id: String(row.id ?? ''),
    storeId: String(row.store_id ?? ''),
    productId: String(row.product_id ?? ''),
    sku: String(row.sku ?? ''),
    options,
    price: row.price == null || row.price === '' ? null : Number(row.price),
    stock: Number(row.stock ?? 0),
    imageUrl: row.image_url == null || row.image_url === '' ? null : String(row.image_url),
    isActive: row.is_active === undefined ? true : Boolean(row.is_active),
  };
}

export type VariationPayload = {
  sku: string;
  options?: Record<string, string>;
  price?: number | null;
  stock?: number;
  image_url?: string | null;
  is_active?: boolean;
};

export async function fetchVariations(
  storeId: string,
  productId: string,
): Promise<ProductVariation[]> {
  const res = await apiFetch<ListResponse<Record<string, unknown>>>(
    `/products/${productId}/variations`,
    { storeId },
  );
  return (res.data ?? []).map(mapVariation);
}

export async function createVariation(
  storeId: string,
  productId: string,
  payload: VariationPayload,
): Promise<ProductVariation> {
  const res = await apiFetch<ItemResponse<Record<string, unknown>>>(
    `/products/${productId}/variations`,
    { method: 'POST', storeId, body: payload },
  );
  return mapVariation(res.data);
}

export async function updateVariation(
  storeId: string,
  productId: string,
  id: string,
  payload: Partial<VariationPayload>,
): Promise<ProductVariation> {
  const res = await apiFetch<ItemResponse<Record<string, unknown>>>(
    `/products/${productId}/variations/${id}`,
    { method: 'PATCH', storeId, body: payload },
  );
  return mapVariation(res.data);
}

export async function deleteVariation(
  storeId: string,
  productId: string,
  id: string,
): Promise<void> {
  await apiFetch(`/products/${productId}/variations/${id}`, {
    method: 'DELETE',
    storeId,
  });
}

function mapCategory(row: Record<string, unknown>): StoreCategory {
  return {
    id: String(row.id ?? ''),
    storeId: String(row.store_id ?? ''),
    parentId: row.parent_id == null || row.parent_id === '' ? null : String(row.parent_id),
    name: String(row.name ?? ''),
    nameAr: row.name_ar == null || row.name_ar === '' ? null : String(row.name_ar),
    slug: String(row.slug ?? ''),
    imageUrl: row.image_url == null || row.image_url === '' ? null : String(row.image_url),
    sortOrder: Number(row.sort_order ?? 0),
    metaTitle: row.meta_title == null || row.meta_title === '' ? null : String(row.meta_title),
    metaDescription:
      row.meta_description == null || row.meta_description === ''
        ? null
        : String(row.meta_description),
    isActive: row.is_active === undefined ? true : Boolean(row.is_active),
  };
}

export type CategoryPayload = {
  name: string;
  name_ar?: string | null;
  slug?: string | null;
  parent_id?: string | null;
  image_url?: string | null;
  sort_order?: number;
  meta_title?: string | null;
  meta_description?: string | null;
  is_active?: boolean;
};

export async function fetchCategories(
  storeId: string,
  query: { q?: string; parent_id?: string; roots?: boolean; all?: boolean } = {
    all: true,
  },
): Promise<StoreCategory[]> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.parent_id) params.set('parent_id', query.parent_id);
  if (query.roots) params.set('roots', '1');
  if (query.all !== false) params.set('all', '1');
  const qs = params.toString();
  const res = await apiFetch<ListResponse<Record<string, unknown>>>(
    `/categories${qs ? `?${qs}` : ''}`,
    { storeId },
  );
  return (res.data ?? []).map(mapCategory);
}

export async function createCategory(
  storeId: string,
  payload: CategoryPayload,
): Promise<StoreCategory> {
  const res = await apiFetch<ItemResponse<Record<string, unknown>>>('/categories', {
    method: 'POST',
    storeId,
    body: payload,
  });
  return mapCategory(res.data);
}

export async function updateCategory(
  storeId: string,
  id: string,
  payload: Partial<CategoryPayload>,
): Promise<StoreCategory> {
  const res = await apiFetch<ItemResponse<Record<string, unknown>>>(
    `/categories/${id}`,
    { method: 'PATCH', storeId, body: payload },
  );
  return mapCategory(res.data);
}

export async function deleteCategory(storeId: string, id: string): Promise<void> {
  await apiFetch(`/categories/${id}`, { method: 'DELETE', storeId });
}

export async function fetchOrders(storeId: string): Promise<Order[]> {
  const res = await apiFetch<ListResponse<ApiOrderRow>>('/orders', { storeId });
  return (res.data ?? []).map(mapOrder);
}

export async function createOrder(
  storeId: string,
  payload: Record<string, unknown>,
): Promise<{ order: Order; customer?: Customer }> {
  const res = await apiFetch<{ data: ApiOrderRow; customer?: ApiCustomerRow }>('/orders', {
    method: 'POST',
    storeId,
    body: payload,
  });
  return {
    order: mapOrder(res.data),
    customer: res.customer ? mapCustomer(res.customer) : undefined,
  };
}

export async function updateOrderStatus(
  storeId: string,
  id: string,
  status: Order['status'],
): Promise<Order> {
  const res = await apiFetch<ItemResponse<ApiOrderRow>>(`/orders/${id}`, {
    method: 'PATCH',
    storeId,
    body: { status },
  });
  return mapOrder(res.data);
}

export async function deleteOrder(storeId: string, id: string): Promise<void> {
  await apiFetch(`/orders/${id}`, { method: 'DELETE', storeId });
}

export async function fetchCustomers(storeId: string): Promise<Customer[]> {
  const res = await apiFetch<ListResponse<ApiCustomerRow>>('/customers', {
    storeId,
  });
  return (res.data ?? []).map(mapCustomer);
}

export async function createCustomer(
  storeId: string,
  payload: Record<string, unknown>,
): Promise<Customer> {
  const res = await apiFetch<ItemResponse<ApiCustomerRow>>('/customers', {
    method: 'POST',
    storeId,
    body: payload,
  });
  return mapCustomer(res.data);
}

export async function updateCustomer(
  storeId: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<Customer> {
  const res = await apiFetch<ItemResponse<ApiCustomerRow>>(
    `/customers/${id}`,
    { method: 'PATCH', storeId, body: payload },
  );
  return mapCustomer(res.data);
}

export async function deleteCustomer(
  storeId: string,
  id: string,
): Promise<void> {
  await apiFetch(`/customers/${id}`, { method: 'DELETE', storeId });
}

export async function fetchCoupons(storeId: string): Promise<CouponItem[]> {
  const res = await apiFetch<ListResponse<ApiCouponRow>>('/coupons', {
    storeId,
  });
  return (res.data ?? []).map(mapCoupon);
}

export async function fetchShipping(storeId: string): Promise<ShippingZone[]> {
  const res = await apiFetch<ListResponse<ApiShippingRow>>('/shipping', {
    storeId,
  });
  return (res.data ?? []).map(mapShipping);
}

export async function fetchSeo(storeId: string): Promise<StoreSEOConfig> {
  const res = await apiFetch<{ data: ApiSeoRow | null }>('/seo', { storeId });
  return mapSeo(res.data, storeId);
}

export async function updateSeo(
  storeId: string,
  patch: Partial<StoreSEOConfig>,
): Promise<StoreSEOConfig> {
  const res = await apiFetch<ItemResponse<ApiSeoRow>>('/seo', {
    method: 'PATCH',
    storeId,
    body: seoPatchToApi(patch),
  });
  return mapSeo(res.data, storeId);
}

export async function fetchMedia(
  storeId: string,
  params?: Record<string, string>,
): Promise<MediaAsset[]> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await apiFetch<ListResponse<any>>(`/media${query}`, { storeId });
  return (res.data ?? []).map((row: any) => ({
    id: row.id,
    storeId: row.store_id || storeId,
    fileName: row.file_name || 'media-asset',
    title: row.title || row.file_name || 'Media Asset',
    fileType: row.file_type || 'image',
    mimeType: row.mime || 'image/jpeg',
    fileSize: row.size_bytes || 0,
    width: row.width,
    height: row.height,
    originalUrl: row.url,
    optimizedUrl: row.optimized_url || row.url,
    webpUrl: row.webp_url || row.url,
    avifUrl: row.avif_url,
    thumbnailUrl: row.thumbnail_url || row.url,
    posterUrl: row.poster_url,
    altText: row.alt,
    caption: row.caption,
    folder: row.folder || 'general',
    tags: row.tags || [],
    uploadDate: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    version: row.version || 1,
    processingStatus: row.processing_status || 'ready',
    optimizationStatus: row.optimization_status || 'optimized',
    source: (row.metadata?.gdriveFileId ? 'gdrive' : 'upload') as any,
    metadata: row.metadata,
  }));
}

export async function createMedia(
  storeId: string,
  asset: Partial<MediaAsset>,
): Promise<MediaAsset> {
  const res = await apiFetch<ItemResponse<any>>('/media', {
    method: 'POST',
    storeId,
    body: {
      file_name: asset.fileName,
      file_type: asset.fileType,
      mime: asset.mimeType,
      size_bytes: asset.fileSize,
      width: asset.width,
      height: asset.height,
      url: asset.originalUrl,
      optimized_url: asset.optimizedUrl,
      webp_url: asset.webpUrl,
      avif_url: asset.avifUrl,
      thumbnail_url: asset.thumbnailUrl,
      poster_url: asset.posterUrl,
      alt: asset.altText,
      caption: asset.caption,
      folder: asset.folder,
      metadata: asset.metadata,
    },
  });
  const row = res.data;
  return {
    id: row.id,
    storeId: row.store_id || storeId,
    fileName: row.file_name,
    title: row.file_name,
    fileType: row.file_type,
    mimeType: row.mime,
    fileSize: row.size_bytes,
    width: row.width,
    height: row.height,
    originalUrl: row.url,
    optimizedUrl: row.optimized_url || row.url,
    webpUrl: row.webp_url || row.url,
    thumbnailUrl: row.thumbnail_url || row.url,
    posterUrl: row.poster_url,
    altText: row.alt,
    caption: row.caption,
    folder: row.folder,
    uploadDate: row.created_at,
    updatedAt: row.updated_at,
    version: row.version || 1,
    processingStatus: row.processing_status || 'ready',
    optimizationStatus: row.optimization_status || 'optimized',
    source: 'upload',
  };
}

export async function replaceMedia(
  storeId: string,
  id: string,
  payload: any,
): Promise<void> {
  await apiFetch(`/media/${id}/replace`, {
    method: 'POST',
    storeId,
    body: {
      url: payload.url,
      file_name: payload.fileName,
      file_type: payload.fileType,
      mime: payload.mimeType,
      size_bytes: payload.fileSize,
      width: payload.width,
      height: payload.height,
      optimized_url: payload.optimizedUrl,
      webp_url: payload.webpUrl,
      thumbnail_url: payload.thumbnailUrl,
      poster_url: payload.posterUrl,
    },
  });
}

export async function deleteMedia(
  storeId: string,
  id: string,
  force = false,
): Promise<void> {
  await apiFetch(`/media/${id}?force=${force ? 'true' : 'false'}`, {
    method: 'DELETE',
    storeId,
  });
}

export async function fetchMediaUsages(
  storeId: string,
  id: string,
): Promise<MediaUsage[]> {
  const res = await apiFetch<ListResponse<any>>(`/media/${id}/usages`, { storeId });
  return (res.data ?? []).map((u: any) => ({
    id: u.id,
    type: u.entity_type,
    label: `${u.entity_type}: ${u.entity_id}`,
    referenceId: u.entity_id,
  }));
}

// ── Google Cloud / Site Kit Integration APIs ──

export interface GoogleStatusResponse {
  is_connected: boolean;
  store_id: string;
  integration?: {
    id: string;
    store_id: string;
    is_connected: boolean;
    google_account_email: string | null;
    google_account_name: string | null;
    google_account_picture: string | null;
    ga4_property_id: string | null;
    ga4_property_name: string | null;
    ga4_measurement_id: string | null;
    gsc_site_url: string | null;
    gtm_account_id: string | null;
    gtm_container_id: string | null;
    google_ads_customer_id: string | null;
    google_ads_account_name: string | null;
    sync_status: 'not_connected' | 'connected' | 'syncing' | 'synced' | 'error';
    last_synced_at: string | null;
    last_error: string | null;
    analytics_snapshot?: any;
    search_console_snapshot?: any;
    pagespeed_mobile_snapshot?: any;
    pagespeed_desktop_snapshot?: any;
  };
}

export async function fetchGoogleStatus(storeId: string): Promise<GoogleStatusResponse> {
  return apiFetch<GoogleStatusResponse>('/google/status', { storeId });
}

export async function fetchGoogleAuthUrl(storeId: string, redirectUri?: string): Promise<{ auth_url: string; client_id: string; redirect_uri: string }> {
  const q = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : '';
  return apiFetch<{ auth_url: string; client_id: string; redirect_uri: string }>(`/google/auth-url${q}`, { storeId });
}

export async function submitGoogleCallback(
  storeId: string,
  payload: {
    code?: string;
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    email?: string;
    name?: string;
    redirect_uri?: string;
  },
): Promise<any> {
  return apiFetch('/google/callback', {
    method: 'POST',
    storeId,
    body: payload,
  });
}

export async function fetchGoogleProperties(storeId: string): Promise<{
  is_connected: boolean;
  current_selection?: Record<string, string | null>;
  properties: {
    analytics: { propertyId: string; displayName: string; account: string }[];
    search_console: { siteUrl: string; permissionLevel: string }[];
    tag_manager: { accountId: string; accountName: string; containerId: string; name: string }[];
    google_ads: { customerId: string; name: string }[];
  };
}> {
  return apiFetch('/google/properties', { storeId });
}

export async function saveGoogleProperties(storeId: string, properties: Record<string, any>): Promise<any> {
  return apiFetch('/google/properties', {
    method: 'POST',
    storeId,
    body: properties,
  });
}

export async function syncGoogleData(storeId: string): Promise<any> {
  return apiFetch('/google/sync', {
    method: 'POST',
    storeId,
  });
}

export async function disconnectGoogleAccountApi(storeId: string): Promise<any> {
  return apiFetch('/google/disconnect', {
    method: 'POST',
    storeId,
  });
}

export async function fetchGoogleAnalyticsData(storeId: string): Promise<any> {
  return apiFetch('/google/analytics', { storeId });
}

export async function fetchGoogleSearchConsoleData(storeId: string): Promise<any> {
  return apiFetch('/google/search-console', { storeId });
}

export async function fetchGooglePageSpeedData(storeId: string, strategy: 'mobile' | 'desktop' = 'mobile', refresh = false): Promise<any> {
  return apiFetch(`/google/pagespeed?strategy=${strategy}${refresh ? '&refresh=1' : ''}`, { storeId });
}

export async function fetchMasterGoogleIntegrations(): Promise<{
  data: {
    store_id: string;
    store_name: string;
    store_slug: string;
    is_connected: boolean;
    account_email: string | null;
    ga4_connected: boolean;
    ga4_id: string | null;
    gtm_connected: boolean;
    gtm_id: string | null;
    search_console_connected: boolean;
    gsc_site: string | null;
    google_ads_connected: boolean;
    ads_customer_id: string | null;
    sync_status: string;
    last_synced_at: string | null;
  }[];
  total_stores: number;
  total_connected: number;
}> {
  return apiFetch('/master/google/integrations', { portal: 'master' });
}

// ── Real Shipping Methods & Zones APIs ──

export async function fetchShippingMethods(storeId: string): Promise<any[]> {
  const res = await apiFetch<ListResponse<any>>('/shipping-methods', { storeId });
  return res.data ?? [];
}

export async function createShippingMethod(storeId: string, payload: Record<string, unknown>): Promise<any> {
  const res = await apiFetch<ItemResponse<any>>('/shipping-methods', {
    method: 'POST',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function updateShippingMethod(storeId: string, id: string, payload: Record<string, unknown>): Promise<any> {
  const res = await apiFetch<ItemResponse<any>>(`/shipping-methods/${id}`, {
    method: 'PATCH',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function deleteShippingMethod(storeId: string, id: string): Promise<void> {
  await apiFetch(`/shipping-methods/${id}`, {
    method: 'DELETE',
    storeId,
  });
}

export async function createShippingZone(storeId: string, payload: Record<string, unknown>): Promise<any> {
  const res = await apiFetch<ItemResponse<any>>('/shipping', {
    method: 'POST',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function deleteShippingZone(storeId: string, id: string): Promise<void> {
  await apiFetch(`/shipping/${id}`, {
    method: 'DELETE',
    storeId,
  });
}

export async function calculateShippingRates(
  storeId: string,
  payload: { city: string; order_total: number; total_weight_kg?: number },
): Promise<{
  matched_zone: any;
  calculated_shipping_fee: number;
  is_free_shipping: boolean;
  available_methods: any[];
}> {
  return apiFetch('/shipping/calculate', {
    method: 'POST',
    storeId,
    body: payload,
  });
}

// ── Real Courier Integrations APIs ──

export async function fetchCouriers(storeId: string): Promise<any[]> {
  const res = await apiFetch<ListResponse<any>>('/couriers', { storeId });
  return res.data ?? [];
}

export async function saveCourierConnection(storeId: string, payload: Record<string, unknown>): Promise<any> {
  const res = await apiFetch<ItemResponse<any>>('/couriers', {
    method: 'POST',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function testCourierConnection(storeId: string, id: string): Promise<{ test_result: any; connection_status: string }> {
  return apiFetch(`/couriers/${id}/test`, {
    method: 'POST',
    storeId,
  });
}

export async function syncCourierConnection(storeId: string, id: string): Promise<any> {
  return apiFetch(`/couriers/${id}/sync`, {
    method: 'POST',
    storeId,
  });
}

export async function createCourierShipment(
  storeId: string,
  payload: { order_id: string; courier_provider: string; weight_kg?: number },
): Promise<any> {
  return apiFetch('/couriers/create-shipment', {
    method: 'POST',
    storeId,
    body: payload,
  });
}

export async function trackCourierShipment(storeId: string, trackingNumber: string): Promise<any> {
  return apiFetch(`/couriers/track/${encodeURIComponent(trackingNumber)}`, { storeId });
}

// ── Real Online Payment Gateway APIs ──

export async function fetchPaymentGateways(storeId: string): Promise<any[]> {
  const res = await apiFetch<ListResponse<any>>('/payment-gateways', { storeId });
  return res.data ?? [];
}

export async function savePaymentGateway(storeId: string, payload: Record<string, unknown>): Promise<any> {
  const res = await apiFetch<ItemResponse<any>>('/payment-gateways', {
    method: 'POST',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function testPaymentGateway(storeId: string, id: string): Promise<{ test_result: any; gateway_status: string }> {
  return apiFetch(`/payment-gateways/${id}/test`, {
    method: 'POST',
    storeId,
  });
}

export async function verifyPaymentServerSide(
  storeId: string,
  payload: {
    order_id: string;
    gateway_provider: string;
    transaction_reference: string;
    amount: number;
    payment_method: string;
    payload?: Record<string, unknown>;
  },
): Promise<any> {
  return apiFetch('/payments/verify', {
    method: 'POST',
    storeId,
    body: payload,
  });
}

export async function refundPaymentTransaction(
  storeId: string,
  transactionId: string,
  amount: number,
  reason?: string,
): Promise<any> {
  return apiFetch(`/payments/refund/${transactionId}`, {
    method: 'POST',
    storeId,
    body: { amount, reason },
  });
}

export async function fetchPaymentTransactions(storeId: string, params?: Record<string, string>): Promise<any> {
  const q = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(`/payments/transactions${q}`, { storeId });
}

// ── Real Analytics Reports (Database Aggregated) ──

export async function fetchPaymentReportsApi(storeId: string): Promise<any> {
  return apiFetch('/analytics/payments', { storeId });
}

export async function fetchShippingReportsApi(storeId: string): Promise<any> {
  return apiFetch('/analytics/shipping', { storeId });
}


