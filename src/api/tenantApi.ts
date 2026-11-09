import { apiFetch } from './client';
import { readAuthSession } from '../auth/session';
import {
  mapCoupon,
  mapCustomer,
  mapOrder,
  orderPatchToApi,
  mapProduct,
  mapSeo,
  mapShipping,
  mapStore,
  mapDomain,
  seoPatchToApi,
  type ApiCouponRow,
  type ApiCustomerRow,
  type ApiOrderRow,
  type ApiProductRow,
  type ApiSeoRow,
  type ApiShippingRow,
  type ApiStoreRow,
  type ApiDomainRow,
} from './mappers';
import type { MediaFolderRecord } from '../types/media';
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
  CategoryFieldDefinition,
  DomainRecord,
  DomainResolutionResult,
  StorefrontPaymentMethod,
  StorefrontPaymentSession,
  PaymentVerifyResponse,
} from '../types';
import type {
  BlogApiResponse,
  BlogArticleItem,
  BlogPostSettings,
  BlogSeoSettings,
  ArticleCommerceToolsConfig,
} from '../types/blog';
import type { CashbackCampaign } from '../services/cashbackService';
import { mapApiCashbackRow } from '../services/cashbackService';
import type { SpecialOffer } from '../services/specialOfferService';
import { mapApiSpecialOfferRow } from '../services/specialOfferService';

type ListResponse<T> = { data: T[] };
type ItemResponse<T> = { data: T };

export async function fetchHealth(): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>('/health');
}

export type AuthMeResponse = {
  portal: 'master' | 'store';
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    role_label?: string;
    role_level?: number;
  };
  store_id: string | null;
  store_name: string | null;
  abilities: string[];
};

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>('/auth/me');
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
  stock?: '0' | 'out' | 'low';
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
    counts?: {
      total: number;
      active: number;
      out_of_stock: number;
      draft: number;
    };
  };
};

export async function fetchProducts(
  storeId: string,
  query: ProductListQuery = { all: true },
): Promise<Product[]> {
  try {
    const res = await fetchProductsPage(storeId, query);
    return res.data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Stale Sanctum token must not blank the catalog. Public catalog is the lifetime read path.
    if (!/401|unauth|session expired|sign in again/i.test(msg)) throw err;
    return fetchStorefrontCatalog(storeId);
  }
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
  if (query.stock) params.set('stock', query.stock);
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
  name_ar?: string | null;
  price: number;
  sku: string;
  stock?: number;
  category?: string;
  category_ar?: string | null;
  image_url?: string;
  original_price?: number | null;
  description?: string | null;
  subtitle?: string | null;
  subtitle_ar?: string | null;
  gallery_urls?: string[];
  video_url?: string | null;
  tags?: string[];
  product_options?: Product['productOptions'];
  custom_fields?: Product['customFields'];
  conditional_rules?: Product['conditionalRules'];
  badge?: string | null;
  badge_en?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  status?: Product['status'];
  is_active?: boolean;
  is_featured?: boolean;
  weight_kg?: number | null;
  shipping_mode?: 'store_default' | 'own_delivery' | 'shipping_company' | null;
  shipping_method_id?: string | null;
  delivery_fee?: number | null;
  estimated_delivery_text?: string | null;
  requires_own_driver?: boolean;
  allow_own_delivery?: boolean;
  allow_shipping_company?: boolean;
  shipping_rate_mode?: 'fixed' | 'per_kg' | 'per_km' | 'zone' | null;
  shipping_per_kg_rate?: number | null;
  shipping_per_km_rate?: number | null;
  shipping_payment_options?: Array<'cod' | 'online' | 'bank_transfer'> | null;
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
    barcode: row.barcode == null || row.barcode === '' ? null : String(row.barcode),
    options,
    price: row.price == null || row.price === '' ? null : Number(row.price),
    compareAtPrice:
      row.compare_at_price == null || row.compare_at_price === ''
        ? null
        : Number(row.compare_at_price),
    stock: Number(row.stock ?? 0),
    weight: row.weight == null || row.weight === '' ? null : Number(row.weight),
    weightUnit: row.weight_unit == null || row.weight_unit === '' ? 'kg' : String(row.weight_unit),
    lowStockAlert:
      row.low_stock_alert == null || row.low_stock_alert === ''
        ? null
        : Number(row.low_stock_alert),
    unlimitedStock: Boolean(row.unlimited_stock ?? false),
    imageUrl: row.image_url == null || row.image_url === '' ? null : String(row.image_url),
    isActive: row.is_active === undefined ? true : Boolean(row.is_active),
  };
}

export type VariationPayload = {
  id?: string;
  sku: string;
  barcode?: string | null;
  options?: Record<string, string>;
  price?: number | null;
  compare_at_price?: number | null;
  stock?: number;
  weight?: number | null;
  weight_unit?: string | null;
  low_stock_alert?: number | null;
  unlimited_stock?: boolean;
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

/** Create, update, or remove variant rows so the matrix matches the editor. */
export async function syncProductVariations(
  storeId: string,
  productId: string,
  variations: ProductVariation[],
): Promise<ProductVariation[]> {
  const remote = await fetchVariations(storeId, productId);
  const remoteIds = new Set(remote.map((row) => row.id));
  const kept = new Set<string>();
  const saved: ProductVariation[] = [];

  for (const v of variations) {
    const payload: VariationPayload = {
      id: v.id || undefined,
      sku: v.sku,
      barcode: v.barcode ?? null,
      options: v.options || {},
      price: v.price,
      compare_at_price: v.compareAtPrice ?? null,
      stock: Number(v.stock) || 0,
      weight: v.weight ?? null,
      weight_unit: v.weightUnit ?? 'kg',
      low_stock_alert: v.lowStockAlert ?? null,
      unlimited_stock: !!v.unlimitedStock,
      image_url: v.imageUrl || null,
      is_active: v.isActive !== false,
    };
    if (v.id && remoteIds.has(v.id)) {
      saved.push(await updateVariation(storeId, productId, v.id, payload));
      kept.add(v.id);
    } else {
      const created = await createVariation(storeId, productId, payload);
      saved.push(created);
      kept.add(created.id);
    }
  }

  for (const row of remote) {
    if (!kept.has(row.id)) {
      await deleteVariation(storeId, productId, row.id);
    }
  }

  return saved;
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
    metaTitleEn:
      row.meta_title_en == null || row.meta_title_en === ''
        ? undefined
        : String(row.meta_title_en),
    metaDescriptionEn:
      row.meta_description_en == null || row.meta_description_en === ''
        ? undefined
        : String(row.meta_description_en),
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

export type OrderListQuery = {
  q?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  source?: string;
  from_date?: string;
  to_date?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  all?: boolean;
  /** Skip line-item eager load. List uses items_summary; open row loads items. */
  lean?: boolean;
};

export type OrderListResult = {
  data: Order[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
    sort: string;
    dir: string;
  };
};

export type OrderSummaryResult = {
  store_id: string;
  total: number;
  by_status: Record<string, number>;
};

export async function fetchOrders(
  storeId: string,
  query: OrderListQuery = { all: true },
): Promise<Order[]> {
  const res = await fetchOrdersPage(storeId, query);
  return res.data;
}

export async function fetchOrdersPage(
  storeId: string,
  query: OrderListQuery = {},
): Promise<OrderListResult> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.status) params.set('status', query.status);
  if (query.payment_status) params.set('payment_status', query.payment_status);
  if (query.payment_method) params.set('payment_method', query.payment_method);
  if (query.source) params.set('source', query.source);
  if (query.from_date) params.set('from_date', query.from_date);
  if (query.to_date) params.set('to_date', query.to_date);
  if (query.sort) params.set('sort', query.sort);
  if (query.dir) params.set('dir', query.dir);
  if (query.page) params.set('page', String(query.page));
  if (query.per_page) params.set('per_page', String(query.per_page));
  if (query.all) params.set('all', '1');
  if (query.lean) params.set('lean', '1');

  const qs = params.toString();
  const res = await apiFetch<
    ListResponse<ApiOrderRow> & { meta?: OrderListResult['meta'] }
  >(`/orders${qs ? `?${qs}` : ''}`, { storeId });

  const data = (res.data ?? []).map(mapOrder);
  return {
    data,
    meta: res.meta ?? {
      total: data.length,
      page: 1,
      per_page: data.length || 25,
      last_page: 1,
      sort: query.sort ?? 'order_date',
      dir: query.dir ?? 'desc',
    },
  };
}

export async function fetchOrdersSummary(
  storeId: string,
): Promise<OrderSummaryResult> {
  return await apiFetch<OrderSummaryResult>('/orders?summary=1', { storeId });
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

export async function fetchOrder(storeId: string, id: string): Promise<Order> {
  const res = await apiFetch<{ data: ApiOrderRow }>(`/orders/${id}`, { storeId });
  return mapOrder(res.data);
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

export async function updateOrder(
  storeId: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<Order> {
  const res = await apiFetch<ItemResponse<ApiOrderRow>>(`/orders/${id}`, {
    method: 'PATCH',
    storeId,
    body: orderPatchToApi(payload),
  });
  return mapOrder(res.data);
}

export async function createStorefrontOrder(
  storeId: string,
  payload: Record<string, unknown>,
): Promise<{ order: Order; customer?: Customer }> {
  const res = await apiFetch<{ data: ApiOrderRow; customer?: ApiCustomerRow }>(
    '/storefront/orders',
    {
      method: 'POST',
      storeId,
      body: payload,
    },
  );
  return {
    order: mapOrder(res.data),
    customer: res.customer ? mapCustomer(res.customer) : undefined,
  };
}

export type StorefrontTrackOrderPayload = {
  order_number: string;
  phone: string;
  store_id?: string;
};

export type StorefrontTrackOrderResult = {
  order_number: string;
  status: string;
  shipping_status?: string | null;
  tracking_number?: string | null;
  courier_code?: string | null;
  items_summary?: string | null;
  items_count?: number;
  delivery_location?: string | null;
  order_date?: string | null;
  estimated_delivery?: string | null;
};

export async function trackStorefrontOrder(
  storeId: string,
  payload: StorefrontTrackOrderPayload,
): Promise<StorefrontTrackOrderResult> {
  const res = await apiFetch<{ data: StorefrontTrackOrderResult }>(
    '/storefront/orders/track',
    {
      method: 'POST',
      storeId,
      body: payload,
    },
  );
  return res.data;
}

export async function processOrderReturn(
  storeId: string,
  id: string,
  payload: {
    reason: string;
    reason_details?: string;
    refund_amount?: number;
    restock_inventory?: boolean;
    admin_notes?: string;
    status?: string;
  },
): Promise<{ order: Order; returnRecord: any }> {
  const res = await apiFetch<{ order: ApiOrderRow; return: any }>(`/orders/${id}/return`, {
    method: 'POST',
    storeId,
    body: payload,
  });
  return {
    order: mapOrder(res.order),
    returnRecord: res.return,
  };
}

export async function fetchOrderReturns(storeId: string): Promise<any[]> {
  const res = await apiFetch<any>('/orders-returns', { storeId });
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export async function updateOrderCodStatus(
  storeId: string,
  id: string,
  cod_status: string,
  cod_notes?: string,
): Promise<Order> {
  const res = await apiFetch<{ order: ApiOrderRow }>(`/orders/${id}/cod-status`, {
    method: 'POST',
    storeId,
    body: { cod_status, cod_notes },
  });
  return mapOrder(res.order);
}

export async function fetchCodSummary(
  storeId: string,
): Promise<{
  total_orders: number;
  total_amount: number;
  pending_collection: { count: number; amount: number };
  collected_by_courier: { count: number; amount: number };
  remitted_to_bank: { count: number; amount: number };
}> {
  const res = await apiFetch<{ summary: any }>('/orders-cod-summary', { storeId });
  return res.summary;
}

export async function deleteOrder(
  storeId: string,
  id: string,
  opts?: { reason?: string },
): Promise<void> {
  const reason = opts?.reason?.trim();
  // Prefer JSON body; also append reason as query for hosts that strip DELETE bodies.
  const path =
    reason && reason.length > 0
      ? `/orders/${encodeURIComponent(id)}?reason=${encodeURIComponent(reason)}`
      : `/orders/${encodeURIComponent(id)}`;
  await apiFetch(path, {
    method: 'DELETE',
    storeId,
    body: reason ? { reason } : undefined,
  });
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

export type CustomerWalletSnapshot = {
  balance: number;
  loyaltyPoints: number;
};

export type ApiWalletTransactionRow = {
  id: number | string;
  store_id: string;
  customer_id: string;
  type: 'add' | 'deduct';
  amount: number | string;
  balance_before: number | string;
  balance_after: number | string;
  reason?: string | null;
  employee_id?: string | null;
  employee_name?: string | null;
  notify_channel?: string | null;
  reset_loyalty?: boolean;
  created_at: string;
};

function mapWalletTransaction(row: ApiWalletTransactionRow): import('../types').CustomerWalletTransaction {
  return {
    id: row.id,
    storeId: String(row.store_id),
    customerId: String(row.customer_id),
    type: row.type,
    amount: Number(row.amount),
    balanceBefore: Number(row.balance_before),
    balanceAfter: Number(row.balance_after),
    reason: row.reason,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    notifyChannel: row.notify_channel,
    resetLoyalty: Boolean(row.reset_loyalty),
    createdAt: String(row.created_at),
  };
}

export type CustomerActivityRow = {
  id: string;
  activity_type: string;
  customer_name?: string | null;
  product_name?: string | null;
  order_id?: string | null;
  meta?: Record<string, unknown> | null;
  occurred_at?: string | null;
};

export async function fetchCustomerActivitiesApi(
  storeId: string,
  customerId: string,
): Promise<CustomerActivityRow[]> {
  const res = await apiFetch<{ data: CustomerActivityRow[] }>(
    `/customers/${customerId}/activities?per_page=50`,
    { storeId },
  );
  return Array.isArray(res?.data) ? res.data : [];
}

export async function fetchCustomerWalletApi(
  storeId: string,
  customerId: string,
): Promise<CustomerWalletSnapshot> {
  const res = await apiFetch<{
    data: { balance: number; loyalty_points: number };
  }>(`/customers/${customerId}/wallet`, { storeId });
  return {
    balance: Number(res.data?.balance ?? 0),
    loyaltyPoints: Number(res.data?.loyalty_points ?? 0),
  };
}

export async function fetchCustomerWalletTransactionsApi(
  storeId: string,
  customerId: string,
): Promise<import('../types').CustomerWalletTransaction[]> {
  const res = await apiFetch<{ data: ApiWalletTransactionRow[] }>(
    `/customers/${customerId}/wallet/transactions`,
    { storeId },
  );
  return (res.data ?? []).map(mapWalletTransaction);
}

export type AdjustCustomerWalletPayload = {
  type: 'add' | 'deduct';
  amount: number;
  reason?: string;
  reset_loyalty?: boolean;
  notify_channel?: 'email' | 'sms' | 'whatsapp' | 'none';
  employee_id?: string;
  employee_name?: string;
};

export async function adjustCustomerWalletApi(
  storeId: string,
  customerId: string,
  payload: AdjustCustomerWalletPayload,
): Promise<{ wallet: CustomerWalletSnapshot; transaction: import('../types').CustomerWalletTransaction }> {
  const res = await apiFetch<{
    data: {
      balance: number;
      loyalty_points: number;
      transaction: ApiWalletTransactionRow;
    };
  }>(`/customers/${customerId}/wallet/adjust`, {
    method: 'POST',
    storeId,
    body: payload,
  });
  return {
    wallet: {
      balance: Number(res.data.balance),
      loyaltyPoints: Number(res.data.loyalty_points),
    },
    transaction: mapWalletTransaction(res.data.transaction),
  };
}

export async function fetchCoupons(storeId: string): Promise<CouponItem[]> {
  const res = await apiFetch<ListResponse<ApiCouponRow>>('/coupons', {
    storeId,
  });
  return (res.data ?? []).map(mapCoupon);
}

export type CreateCouponPayload = {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_uses?: number | null;
  status?: CouponItem['status'];
  is_active?: boolean;
  expires_at?: string | null;
  design_type?: CouponItem['designType'];
  design_color?: string | null;
  design_image_url?: string | null;
};

export type UpdateCouponPayload = Partial<CreateCouponPayload> & {
  usage_count?: number;
};

export async function createCoupon(
  storeId: string,
  payload: CreateCouponPayload,
): Promise<CouponItem> {
  const res = await apiFetch<ItemResponse<ApiCouponRow>>('/coupons', {
    method: 'POST',
    storeId,
    body: payload,
  });
  return mapCoupon(res.data);
}

export async function updateCoupon(
  storeId: string,
  id: string,
  payload: UpdateCouponPayload,
): Promise<CouponItem> {
  const res = await apiFetch<ItemResponse<ApiCouponRow>>(`/coupons/${id}`, {
    method: 'PATCH',
    storeId,
    body: payload,
  });
  return mapCoupon(res.data);
}

export async function deleteCoupon(storeId: string, id: string): Promise<void> {
  await apiFetch(`/coupons/${id}`, { method: 'DELETE', storeId });
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

export async function uploadMediaFile(
  storeId: string,
  file: File,
  meta?: { alt?: string; caption?: string; folder?: string },
): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append('file', file);
  if (meta?.alt) formData.append('alt', meta.alt);
  if (meta?.caption) formData.append('caption', meta.caption);
  if (meta?.folder) formData.append('folder', meta.folder);

  const res = await apiFetch<ItemResponse<any>>('/media', {
    method: 'POST',
    storeId,
    body: formData,
  });
  const row = res.data;
  const asset: MediaAsset = {
    id: row.id,
    storeId: row.store_id || storeId,
    fileName: row.file_name,
    title: row.file_name,
    fileType: row.file_type || 'image',
    mimeType: row.mime || file.type || 'image/jpeg',
    fileSize: row.size_bytes || file.size,
    width: row.width,
    height: row.height,
    originalUrl: row.url,
    optimizedUrl: row.optimized_url || row.url,
    webpUrl: row.webp_url || row.url,
    thumbnailUrl: row.thumbnail_url || row.url,
    posterUrl: row.poster_url,
    altText: row.alt,
    caption: row.caption,
    folder: row.folder || 'general',
    uploadDate: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    version: row.version || 1,
    processingStatus: row.processing_status || 'ready',
    optimizationStatus: row.optimization_status || 'optimized',
    source: 'upload',
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('unityteck-media-changed', {
      detail: { id: asset.id, url: asset.originalUrl },
    }));
  }
  return asset;
}

export async function replaceMediaWithFile(
  storeId: string,
  id: string,
  file: File,
): Promise<{ url: string; version: number }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiFetch<ItemResponse<any>>(`/media/${id}/replace`, {
    method: 'POST',
    storeId,
    body: formData,
  });
  const row = res.data || {};
  if (typeof window !== 'undefined' && row.url) {
    window.dispatchEvent(new CustomEvent('unityteck-media-changed', {
      detail: { id, url: row.url },
    }));
  }
  return {
    url: row.url,
    version: row.version || 1,
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

export async function updateMedia(
  storeId: string,
  id: string,
  patch: {
    file_name?: string;
    alt?: string;
    caption?: string;
    folder?: string;
  },
): Promise<MediaAsset> {
  const res = await apiFetch<ItemResponse<any>>(`/media/${id}`, {
    method: 'PATCH',
    storeId,
    body: {
      file_name: patch.file_name,
      alt: patch.alt,
      caption: patch.caption,
      folder: patch.folder,
    },
  });
  const row = res.data;
  return {
    id: row.id,
    storeId: row.store_id || storeId,
    fileName: row.file_name,
    title: row.file_name,
    fileType: row.file_type || 'image',
    mimeType: row.mime || 'image/jpeg',
    fileSize: row.size_bytes || 0,
    width: row.width,
    height: row.height,
    originalUrl: row.url,
    optimizedUrl: row.optimized_url || row.url,
    webpUrl: row.webp_url || row.url,
    thumbnailUrl: row.thumbnail_url || row.url,
    altText: row.alt,
    caption: row.caption,
    folder: row.folder || 'general',
    uploadDate: row.created_at,
    updatedAt: row.updated_at,
    version: row.version || 1,
    processingStatus: row.processing_status || 'ready',
    optimizationStatus: row.optimization_status || 'optimized',
    source: 'upload',
  };
}

export async function fetchMediaFolders(storeId: string): Promise<MediaFolderRecord[]> {
  const res = await apiFetch<ListResponse<any>>('/media-folders', { storeId });
  return (res.data ?? []).map((row: any) => ({
    id: row.id,
    storeId: row.store_id || storeId,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id ?? null,
    createdAt: row.created_at,
  }));
}

export async function createMediaFolder(
  storeId: string,
  payload: { name: string; slug?: string; parent_id?: string | null },
): Promise<MediaFolderRecord> {
  const res = await apiFetch<ItemResponse<any>>('/media-folders', {
    method: 'POST',
    storeId,
    body: payload,
  });
  const row = res.data;
  return {
    id: row.id,
    storeId: row.store_id || storeId,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id ?? null,
    createdAt: row.created_at,
  };
}

export async function updateMediaFolder(
  storeId: string,
  id: string,
  payload: { name?: string; slug?: string; parent_id?: string | null },
): Promise<MediaFolderRecord> {
  const res = await apiFetch<ItemResponse<any>>(`/media-folders/${id}`, {
    method: 'PATCH',
    storeId,
    body: payload,
  });
  const row = res.data;
  return {
    id: row.id,
    storeId: row.store_id || storeId,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id ?? null,
    createdAt: row.created_at,
  };
}

export async function deleteMediaFolder(
  storeId: string,
  id: string,
  moveAssets = true,
): Promise<void> {
  await apiFetch(`/media-folders/${id}?move_assets=${moveAssets ? 'true' : 'false'}`, {
    method: 'DELETE',
    storeId,
  });
}

function mapCategoryField(row: Record<string, unknown>): CategoryFieldDefinition {
  const opts = row.options;
  let options: string[] | null = null;
  if (Array.isArray(opts)) {
    options = opts.map((x) => String(x));
  } else if (typeof opts === 'object' && opts && 'choices' in opts) {
    const choices = (opts as { choices?: unknown }).choices;
    if (Array.isArray(choices)) options = choices.map((x) => String(x));
  }

  return {
    id: String(row.id),
    storeId: String(row.store_id),
    categoryId: row.category_id ? String(row.category_id) : null,
    nameEn: String(row.name_en ?? ''),
    nameAr: row.name_ar ? String(row.name_ar) : null,
    fieldType: (row.field_type as CategoryFieldDefinition['fieldType']) || 'text',
    options,
    sort: Number(row.sort ?? 0),
    active: row.active === undefined ? true : Boolean(row.active),
  };
}

export async function fetchCategoryFieldDefinitions(
  storeId: string,
  categoryId?: string,
): Promise<CategoryFieldDefinition[]> {
  const qs = categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : '';
  const res = await apiFetch<ListResponse<Record<string, unknown>>>(
    `/category-field-definitions${qs}`,
    { storeId },
  );
  return (res.data ?? []).map(mapCategoryField);
}

export async function createCategoryFieldDefinition(
  storeId: string,
  payload: {
    category_id?: string | null;
    name_en: string;
    name_ar?: string | null;
    field_type: CategoryFieldDefinition['fieldType'];
    options?: string[] | null;
    sort?: number;
    active?: boolean;
  },
): Promise<CategoryFieldDefinition> {
  const res = await apiFetch<ItemResponse<Record<string, unknown>>>(
    '/category-field-definitions',
    { method: 'POST', storeId, body: payload },
  );
  return mapCategoryField(res.data);
}

export async function updateCategoryFieldDefinition(
  storeId: string,
  id: string,
  payload: Partial<{
    category_id: string | null;
    name_en: string;
    name_ar: string | null;
    field_type: CategoryFieldDefinition['fieldType'];
    options: string[] | null;
    sort: number;
    active: boolean;
  }>,
): Promise<CategoryFieldDefinition> {
  const res = await apiFetch<ItemResponse<Record<string, unknown>>>(
    `/category-field-definitions/${id}`,
    { method: 'PATCH', storeId, body: payload },
  );
  return mapCategoryField(res.data);
}

export async function deleteCategoryFieldDefinition(
  storeId: string,
  id: string,
): Promise<void> {
  await apiFetch(`/category-field-definitions/${id}`, { method: 'DELETE', storeId });
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

export type GoogleAdsOverviewResponse = {
  store_id?: string;
  customer_id?: string;
  account_name?: string | null;
  connected?: boolean;
  ads_linked?: boolean;
  message?: string;
  geo_presets?: Array<{ id: string; name: string; name_ar: string }>;
  snapshot?: {
    kpis?: {
      cost?: number;
      impressions?: number;
      clicks?: number;
      conversions?: number;
      conversions_value?: number;
      roas?: number | null;
      currency?: string;
    };
    campaigns?: Array<{
      id: string;
      name: string;
      status: string;
      channel?: string;
      budget_id?: string | null;
      daily_budget?: number | null;
      impressions?: number;
      clicks?: number;
      cost?: number;
      conversions?: number;
      conversions_value?: number;
      roas?: number | null;
    }>;
    recommendations?: Array<{ type?: string; resource_name?: string }>;
    errors?: string[];
    synced_at?: string;
  } | null;
};

export async function fetchGoogleAdsOverview(
  storeId: string,
  refresh = false,
): Promise<GoogleAdsOverviewResponse> {
  const q = refresh ? '?refresh=1' : '';
  return apiFetch<GoogleAdsOverviewResponse>(`/google/ads/overview${q}`, { storeId });
}

export async function syncGoogleAdsApi(storeId: string): Promise<GoogleAdsOverviewResponse> {
  return apiFetch('/google/ads/sync', { method: 'POST', storeId });
}

export async function createGoogleAdsCampaignApi(
  storeId: string,
  body: {
    name: string;
    daily_budget_sar: number;
    status?: 'ENABLED' | 'PAUSED';
    cities?: string[];
    channel?: 'SEARCH' | 'PERFORMANCE_MAX';
    final_url?: string;
  },
): Promise<{ ok: boolean; campaign_id?: string; error?: string; note?: string }> {
  return apiFetch('/google/ads/campaigns', { method: 'POST', storeId, body });
}

export async function updateGoogleAdsCampaignApi(
  storeId: string,
  campaignId: string,
  body: {
    status?: 'ENABLED' | 'PAUSED';
    daily_budget_sar?: number;
    budget_id?: string;
    cities?: string[];
  },
): Promise<{ ok: boolean; results?: unknown; message?: string }> {
  return apiFetch(`/google/ads/campaigns/${encodeURIComponent(campaignId)}`, {
    method: 'PATCH',
    storeId,
    body,
  });
}

export async function uploadGoogleAdsConversionsApi(
  storeId: string,
  conversionAction: string,
): Promise<{ ok: boolean; uploaded?: number; skipped?: number; error?: string }> {
  return apiFetch('/google/ads/conversions/upload', {
    method: 'POST',
    storeId,
    body: { conversion_action: conversionAction },
  });
}

export async function fetchGooglePageSpeedData(
  storeId: string,
  strategy: 'mobile' | 'desktop' = 'mobile',
  refresh = false,
  url?: string,
): Promise<{
  strategy: 'mobile' | 'desktop';
  audit: Record<string, unknown> | null;
  tested_url?: string | null;
  source?: string | null;
  message?: string | null;
}> {
  const params = new URLSearchParams({ strategy });
  if (refresh) params.set('refresh', '1');
  if (url && url.trim()) params.set('url', url.trim());
  return apiFetch(`/google/pagespeed?${params.toString()}`, { storeId });
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
  return (res.data ?? []).map((row) => mapShippingMethodRow(row, storeId));
}

function shippingMethodToApi(payload: Record<string, unknown>): Record<string, unknown> {
  const body: Record<string, unknown> = { ...payload };
  const map: Record<string, string> = {
    nameAr: 'name_ar',
    fulfillmentMode: 'fulfillment_mode',
    baseRate: 'base_rate',
    perKgRate: 'per_kg_rate',
    perKmRate: 'per_km_rate',
    minOrderAmount: 'min_order_amount',
    freeShippingThreshold: 'free_shipping_threshold',
    estimatedDelivery: 'estimated_delivery',
    etaType: 'eta_type',
    etaValue: 'eta_value',
    trackingEnabled: 'tracking_enabled',
    isCodAllowed: 'is_cod_allowed',
    allowOnline: 'allow_online',
    allowBankTransfer: 'allow_bank_transfer',
    paymentOptions: 'payment_options',
    codFee: 'cod_fee',
    courierCode: 'courier_code',
    logoUrl: 'logo_url',
    vehicleType: 'vehicle_type',
    isActive: 'is_active',
    sortOrder: 'sort_order',
  };
  for (const [from, to] of Object.entries(map)) {
    if (from in body) {
      body[to] = body[from];
      delete body[from];
    }
  }
  return body;
}

export function mapShippingMethodRow(row: any, storeId: string): import('../types').ShippingMethodItem {
  return {
    id: String(row.id),
    storeId: String(row.store_id || storeId),
    name: row.name || '',
    nameAr: row.name_ar || row.nameAr || '',
    type: row.type || 'flat_rate',
    fulfillmentMode: row.fulfillment_mode || row.fulfillmentMode || 'courier',
    baseRate: Number(row.base_rate ?? row.baseRate ?? 0),
    perKgRate: Number(row.per_kg_rate ?? row.perKgRate ?? 0),
    perKmRate: Number(row.per_km_rate ?? row.perKmRate ?? 0),
    minOrderAmount: Number(row.min_order_amount ?? row.minOrderAmount ?? 0),
    freeShippingThreshold:
      row.free_shipping_threshold != null || row.freeShippingThreshold != null
        ? Number(row.free_shipping_threshold ?? row.freeShippingThreshold)
        : null,
    estimatedDelivery: row.estimated_delivery || row.estimatedDelivery || '2-3 Days',
    etaType: row.eta_type || row.etaType || undefined,
    etaValue: row.eta_value != null ? Number(row.eta_value) : row.etaValue ?? null,
    trackingEnabled: row.tracking_enabled ?? row.trackingEnabled ?? true,
    isCodAllowed: Boolean(row.is_cod_allowed ?? row.isCodAllowed),
    allowOnline: row.allow_online ?? row.allowOnline ?? true,
    allowBankTransfer: row.allow_bank_transfer ?? row.allowBankTransfer ?? false,
    paymentOptions: Array.isArray(row.payment_options || row.paymentOptions)
      ? (row.payment_options || row.paymentOptions)
      : undefined,
    codFee: Number(row.cod_fee ?? row.codFee ?? 0),
    courierCode: row.courier_code ?? row.courierCode ?? null,
    logoUrl: row.logo_url ?? row.logoUrl ?? null,
    vehicleType: row.vehicle_type ?? row.vehicleType ?? null,
    isActive: row.is_active ?? row.isActive ?? true,
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    description: row.description || undefined,
  };
}

export async function createShippingMethod(storeId: string, payload: Record<string, unknown>): Promise<any> {
  const res = await apiFetch<ItemResponse<any>>('/shipping-methods', {
    method: 'POST',
    storeId,
    body: shippingMethodToApi(payload),
  });
  return res.data;
}

export async function updateShippingMethod(storeId: string, id: string, payload: Record<string, unknown>): Promise<any> {
  const res = await apiFetch<ItemResponse<any>>(`/shipping-methods/${id}`, {
    method: 'PATCH',
    storeId,
    body: shippingMethodToApi(payload),
  });
  return res.data;
}

export async function deleteShippingMethod(storeId: string, id: string): Promise<void> {
  await apiFetch(`/shipping-methods/${id}`, {
    method: 'DELETE',
    storeId,
  });
}

// ── Delivery Drivers (own delivery) ──

export type DeliveryDriverRow = {
  id: string;
  store_id: string;
  name: string;
  name_ar?: string | null;
  phone: string;
  email?: string | null;
  vehicle_type?: string | null;
  city?: string | null;
  base_location?: string | null;
  service_areas?: string[] | null;
  rate_mode?: 'fixed' | 'per_kg' | 'per_km' | 'zone' | null;
  fixed_rate?: number | string | null;
  per_kg_rate?: number | string | null;
  per_km_rate?: number | string | null;
  same_day?: boolean;
  eta_text?: string | null;
  payment_options?: Array<'cod' | 'online' | 'bank_transfer'> | null;
  is_active: boolean;
  notes?: string | null;
};

export type DeliveryDriverPayload = {
  name: string;
  name_ar?: string | null;
  phone: string;
  email?: string | null;
  vehicle_type?: string | null;
  city?: string | null;
  base_location?: string | null;
  service_areas?: string[] | null;
  rate_mode?: 'fixed' | 'per_kg' | 'per_km' | 'zone' | null;
  fixed_rate?: number | null;
  per_kg_rate?: number | null;
  per_km_rate?: number | null;
  same_day?: boolean;
  eta_text?: string | null;
  payment_options?: Array<'cod' | 'online' | 'bank_transfer'> | null;
  is_active?: boolean;
  notes?: string | null;
};

export async function fetchDeliveryDriversApi(
  storeId: string,
  opts?: { is_active?: boolean; all?: boolean; q?: string; city?: string },
): Promise<DeliveryDriverRow[]> {
  const params = new URLSearchParams();
  if (opts?.all !== false) params.set('all', '1');
  if (opts?.is_active !== undefined) params.set('is_active', opts.is_active ? '1' : '0');
  if (opts?.q) params.set('q', opts.q);
  if (opts?.city) params.set('city', opts.city);
  const qs = params.toString();
  const res = await apiFetch<ListResponse<DeliveryDriverRow>>(
    `/delivery-drivers${qs ? `?${qs}` : ''}`,
    { storeId },
  );
  return Array.isArray(res?.data) ? res.data : [];
}

export async function createDeliveryDriverApi(
  storeId: string,
  payload: DeliveryDriverPayload,
): Promise<DeliveryDriverRow> {
  const res = await apiFetch<ItemResponse<DeliveryDriverRow>>('/delivery-drivers', {
    method: 'POST',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function updateDeliveryDriverApi(
  storeId: string,
  id: string,
  payload: Partial<DeliveryDriverPayload>,
): Promise<DeliveryDriverRow> {
  const res = await apiFetch<ItemResponse<DeliveryDriverRow>>(`/delivery-drivers/${id}`, {
    method: 'PATCH',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function deleteDeliveryDriverApi(storeId: string, id: string): Promise<void> {
  await apiFetch(`/delivery-drivers/${id}`, {
    method: 'DELETE',
    storeId,
  });
}

// ── Store Bank Accounts ──

export type StoreBankAccountRow = {
  id: string;
  store_id: string;
  bank_name: string;
  bank_name_ar?: string | null;
  account_title: string;
  account_title_ar?: string | null;
  iban: string;
  account_number?: string | null;
  payment_reference_prefix?: string | null;
  is_default: boolean;
  is_active: boolean;
};

export type StoreBankAccountPayload = {
  bank_name: string;
  bank_name_ar?: string | null;
  account_title: string;
  account_title_ar?: string | null;
  iban: string;
  account_number?: string | null;
  payment_reference_prefix?: string | null;
  is_default?: boolean;
  is_active?: boolean;
};

export async function fetchStoreBankAccountsApi(
  storeId: string,
  opts?: { is_active?: boolean },
): Promise<StoreBankAccountRow[]> {
  const params = new URLSearchParams();
  if (opts?.is_active !== undefined) params.set('is_active', opts.is_active ? '1' : '0');
  const qs = params.toString();
  const res = await apiFetch<ListResponse<StoreBankAccountRow>>(
    `/bank-accounts${qs ? `?${qs}` : ''}`,
    { storeId },
  );
  return Array.isArray(res?.data) ? res.data : [];
}

export async function createStoreBankAccountApi(
  storeId: string,
  payload: StoreBankAccountPayload,
): Promise<StoreBankAccountRow> {
  const res = await apiFetch<ItemResponse<StoreBankAccountRow>>('/bank-accounts', {
    method: 'POST',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function updateStoreBankAccountApi(
  storeId: string,
  id: string,
  payload: Partial<StoreBankAccountPayload>,
): Promise<StoreBankAccountRow> {
  const res = await apiFetch<ItemResponse<StoreBankAccountRow>>(`/bank-accounts/${id}`, {
    method: 'PATCH',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function deleteStoreBankAccountApi(storeId: string, id: string): Promise<void> {
  await apiFetch(`/bank-accounts/${id}`, {
    method: 'DELETE',
    storeId,
  });
}

// ── Order Installments ──

export type OrderInstallmentRow = {
  id: string;
  store_id: string;
  order_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_at?: string | null;
  payment_transaction_id?: string | null;
  status: string;
  notes?: string | null;
};

export type CreateOrderInstallmentPayload = {
  installment_number: number;
  amount: number;
  due_date: string;
  notes?: string | null;
};

export type RecordInstallmentPaymentPayload = {
  installment_id: string;
  payment_transaction_id?: string | null;
  recorded_amount?: number | null;
  notes?: string | null;
};

export async function fetchOrderInstallmentsApi(
  storeId: string,
  orderId: string,
): Promise<OrderInstallmentRow[]> {
  const res = await apiFetch<ListResponse<OrderInstallmentRow>>(
    `/orders/${orderId}/installments`,
    { storeId },
  );
  return Array.isArray(res?.data) ? res.data : [];
}

export async function createOrderInstallmentsApi(
  storeId: string,
  orderId: string,
  payload: CreateOrderInstallmentPayload,
): Promise<OrderInstallmentRow> {
  const res = await apiFetch<ItemResponse<OrderInstallmentRow>>(
    `/orders/${orderId}/installments`,
    {
      method: 'POST',
      storeId,
      body: payload,
    },
  );
  return res.data;
}

export async function recordInstallmentPaymentApi(
  storeId: string,
  orderId: string,
  payload: RecordInstallmentPaymentPayload,
): Promise<{ data: OrderInstallmentRow; order?: ApiOrderRow; recorded_amount?: number }> {
  return apiFetch(`/orders/${orderId}/installments/record-payment`, {
    method: 'POST',
    storeId,
    body: payload,
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

export async function updateShippingZone(storeId: string, id: string, payload: Record<string, unknown>): Promise<any> {
  const res = await apiFetch<ItemResponse<any>>(`/shipping/${id}`, {
    method: 'PATCH',
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
  payload: {
    city: string;
    order_total: number;
    total_weight_kg?: number;
    distance_km?: number;
    fulfillment_mode?: 'own_delivery' | 'courier';
    product_ids?: string[];
  },
): Promise<{
  matched_zone: any;
  calculated_shipping_fee: number;
  is_free_shipping: boolean;
  available_methods: any[];
  fulfillment_hint?: 'own_delivery' | string;
  product_shipping?: Array<{
    product_id: string;
    shipping_mode: string | null;
    delivery_fee: number | null;
    estimated_delivery_text: string | null;
    requires_own_driver: boolean;
  }>;
}> {
  return apiFetch('/shipping/calculate', {
    method: 'POST',
    storeId,
    body: payload,
  });
}

/** Example KSA courier methods merchants can install (real DB rows — not checkout mocks). */
export const EXAMPLE_SHIPPING_METHOD_PRESETS = [
  {
    name: 'RedBox',
    nameAr: 'ريدبوكس',
    type: 'flat_rate' as const,
    fulfillmentMode: 'courier' as const,
    baseRate: 24,
    estimatedDelivery: '5–7 business days',
    courierCode: 'redbox',
    isCodAllowed: true,
    allowOnline: true,
    paymentOptions: ['cod', 'online'] as Array<'cod' | 'online' | 'bank_transfer'>,
  },
  {
    name: 'SMSA Express – Standard Shipping',
    nameAr: 'سمسا إكسبريس — الشحن القياسي',
    type: 'flat_rate' as const,
    fulfillmentMode: 'courier' as const,
    baseRate: 30,
    estimatedDelivery: '5–8 business days',
    courierCode: 'smsa',
    isCodAllowed: true,
    allowOnline: true,
    paymentOptions: ['cod', 'online'] as Array<'cod' | 'online' | 'bank_transfer'>,
  },
  {
    name: 'Aramex',
    nameAr: 'أرامكس',
    type: 'flat_rate' as const,
    fulfillmentMode: 'courier' as const,
    baseRate: 30,
    estimatedDelivery: '5–8 business days',
    courierCode: 'aramex',
    isCodAllowed: true,
    allowOnline: true,
    paymentOptions: ['cod', 'online'] as Array<'cod' | 'online' | 'bank_transfer'>,
  },
  {
    name: 'Local Delivery (Within Makkah City Limits)',
    nameAr: 'توصيل محلي (داخل حدود مدينة مكة)',
    type: 'same_day' as const,
    fulfillmentMode: 'own_delivery' as const,
    baseRate: 0,
    estimatedDelivery: '2–3 days',
    etaType: 'days' as const,
    courierCode: null,
    isCodAllowed: true,
    allowOnline: true,
    allowBankTransfer: true,
    paymentOptions: ['cod', 'online', 'bank_transfer'] as Array<'cod' | 'online' | 'bank_transfer'>,
  },
];

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

export async function fetchCourierShipments(storeId: string, params?: { status?: string; provider?: string }): Promise<any[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.provider) query.set('provider', params.provider);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch<ListResponse<any>>(`/couriers/shipments${qs}`, { storeId });
  const raw = res.data ?? [];
  return raw.map((item: any) => ({
    id: String(item.id),
    storeId: String(item.store_id || storeId),
    orderId: String(item.order_id),
    courierId: item.courier_id ? String(item.courier_id) : undefined,
    provider: String(item.provider || 'spl'),
    awbNumber: String(item.awb_number || item.tracking_number || ''),
    trackingNumber: String(item.tracking_number || item.awb_number || ''),
    labelUrl: item.label_url,
    status: item.status || 'created',
    shippingCost: Number(item.shipping_cost || 0),
    codAmount: Number(item.cod_amount || 0),
    pickupRequestedAt: item.pickup_requested_at,
    deliveredAt: item.delivered_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    originAddress: item.origin_address,
    destinationAddress: item.destination_address || (item.order ? { location: item.order.delivery_location, city: item.order.city } : undefined),
    trackingEvents: item.tracking_events || [],
    order: item.order,
  }));
}

export async function updateCourierShipmentStatus(
  storeId: string,
  shipmentId: string,
  payload: { status: string; note?: string }
): Promise<any> {
  const res = await apiFetch<ItemResponse<any>>(`/couriers/shipments/${encodeURIComponent(shipmentId)}/status`, {
    method: 'PATCH',
    storeId,
    body: payload,
  });
  return res.data;
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

// ── Public Storefront Saudi Payments (Mada, Apple Pay, Tabby, Tamara, COD) ──

export async function fetchStorefrontPaymentMethodsApi(storeId: string): Promise<StorefrontPaymentMethod[]> {
  const res = await apiFetch<{ success: boolean; methods: StorefrontPaymentMethod[] }>(`/storefront/payments/methods?store_id=${encodeURIComponent(storeId)}`);
  return res.methods ?? [];
}

export async function initiateStorefrontPaymentApi(payload: {
  store_id: string;
  order_id?: string;
  payment_method: string;
  amount: number;
  customer_name?: string;
  customer_phone?: string;
}): Promise<StorefrontPaymentSession> {
  return apiFetch<StorefrontPaymentSession>('/storefront/payments/initiate', {
    method: 'POST',
    body: payload,
  });
}

export async function verifyStorefrontPaymentApi(payload: {
  store_id: string;
  order_id: string;
  gateway_provider: string;
  payment_method: string;
  transaction_reference: string;
  amount: number;
  payload?: Record<string, unknown>;
}): Promise<PaymentVerifyResponse> {
  return apiFetch<PaymentVerifyResponse>('/storefront/payments/verify', {
    method: 'POST',
    body: payload,
  });
}

// ── Real Analytics Reports (Database Aggregated) ──

export type DashboardHomeTrafficSource = {
  id: string;
  name: string;
  name_ar: string;
  percentage: number;
  color: string;
  icon_type: string;
  visits: number;
};

export type DashboardHomeAnalytics = {
  store_id: string;
  visitors_count: number;
  visits_growth: number | null;
  visits_by_weekday: Array<{
    dayEn: string;
    dayAr: string;
    percentage: number;
    highlighted?: boolean;
  }>;
  /** Real page_view attribution only — empty when no storefront events */
  traffic_sources?: DashboardHomeTrafficSource[];
};

export async function fetchDashboardHomeAnalytics(storeId: string): Promise<DashboardHomeAnalytics> {
  return apiFetch<DashboardHomeAnalytics>('/analytics/dashboard-home', { storeId });
}

export async function fetchOverviewReportsApi(
  storeId: string,
  params?: { range?: string; from?: string; to?: string },
): Promise<any> {
  const query = new URLSearchParams();
  if (params?.range) query.set('range', params.range);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const qStr = query.toString();
  return apiFetch(`/analytics/overview${qStr ? `?${qStr}` : ''}`, { storeId });
}

export async function fetchPaymentReportsApi(storeId: string): Promise<any> {
  return apiFetch('/analytics/payments', { storeId });
}

export async function fetchShippingReportsApi(storeId: string): Promise<any> {
  return apiFetch('/analytics/shipping', { storeId });
}

export async function fetchSalesRevenueReportsApi(
  storeId: string,
  params?: { range?: string; from?: string; to?: string },
): Promise<any> {
  const query = new URLSearchParams();
  if (params?.range) query.set('range', params.range);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const qStr = query.toString();
  return apiFetch(`/analytics/sales-revenue${qStr ? `?${qStr}` : ''}`, { storeId });
}

export async function fetchCampaignAnalyticsReportsApi(
  storeId: string,
  params?: { range?: string; from?: string; to?: string },
): Promise<any> {
  const query = new URLSearchParams();
  if (params?.range) query.set('range', params.range);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const qStr = query.toString();
  return apiFetch(`/analytics/campaigns${qStr ? `?${qStr}` : ''}`, { storeId });
}

export async function fetchAiInsightsReportsApi(
  storeId: string,
  params?: { range?: string; from?: string; to?: string },
): Promise<any> {
  const query = new URLSearchParams();
  if (params?.range) query.set('range', params.range);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const qStr = query.toString();
  return apiFetch(`/analytics/ai-insights${qStr ? `?${qStr}` : ''}`, { storeId });
}

export async function askAiStoreApi(
  storeId: string,
  question: string,
): Promise<any> {
  return apiFetch('/analytics/ai-insights/ask', {
    method: 'POST',
    body: { question },
    storeId,
  });
}

export async function fetchBehaviorAnalyticsReportsApi(
  storeId: string,
  params?: { range?: string; from?: string; to?: string },
): Promise<any> {
  const query = new URLSearchParams();
  if (params?.range) query.set('range', params.range);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const qStr = query.toString();
  return apiFetch(`/analytics/behavior${qStr ? `?${qStr}` : ''}`, { storeId });
}

export async function fetchCustomerAnalyticsReportsApi(storeId: string): Promise<any> {
  return apiFetch('/analytics/customers', { storeId });
}

export async function fetchProductAnalyticsReportsApi(storeId: string): Promise<any> {
  return apiFetch('/analytics/products', { storeId });
}

export async function fetchChannelAnalyticsReportsApi(storeId: string): Promise<any> {
  return apiFetch('/analytics/channels', { storeId });
}

export async function fetchSearchQueriesReportsApi(storeId: string): Promise<any> {
  return apiFetch('/analytics/search-queries', { storeId });
}



// ── Real Theme Settings & Page Builder Persistence (Phase 2.2 / 2.3) ──

export async function fetchThemesCatalogApi(): Promise<any[]> {
  const res = await apiFetch<{ success: boolean; data: any[] }>('/themes-catalog');
  return res.data ?? [];
}

export async function fetchThemeSettingsApi(storeId: string): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/stores/${storeId}/theme-settings`, { storeId });
  return res.data;
}

export interface StoreReviewRecord {
  id: string;
  author: string;
  city: string;
  product: string;
  productAr?: string;
  rating: number;
  title: string;
  titleAr?: string;
  comment: string;
  commentAr?: string;
  verified: boolean;
  active: boolean;
  likes: number;
  date: string;
}

export async function fetchStoreReviewsApi(storeId: string): Promise<StoreReviewRecord[]> {
  const res = await apiFetch<{ success: boolean; data: StoreReviewRecord[] }>(
    `/stores/${storeId}/reviews`,
    { storeId },
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function submitStoreReviewApi(
  storeId: string,
  payload: Partial<StoreReviewRecord> & { author: string; comment: string },
): Promise<StoreReviewRecord> {
  const res = await apiFetch<{ success: boolean; data: StoreReviewRecord }>(
    `/stores/${storeId}/reviews`,
    { method: 'POST', storeId, skipAuth: true, body: payload },
  );
  return res.data;
}

export async function submitStorefrontContact(
  storeId: string,
  payload: { name: string; phone?: string; email?: string; message: string },
): Promise<void> {
  await apiFetch('/storefront/contact', {
    method: 'POST',
    storeId,
    skipAuth: true,
    body: { store_id: storeId, ...payload },
  });
}

export async function saveStoreReviewsApi(
  storeId: string,
  reviews: StoreReviewRecord[],
): Promise<StoreReviewRecord[]> {
  const res = await apiFetch<{ success: boolean; data: StoreReviewRecord[] }>(
    `/stores/${storeId}/reviews`,
    { method: 'PUT', storeId, body: { reviews } },
  );
  return Array.isArray(res.data) ? res.data : reviews;
}

export async function updateThemeSettingsApi(
  storeId: string,
  payload: { theme_id?: string; homepage_style?: string; settings?: Record<string, any>; publish?: boolean }
): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/stores/${storeId}/theme-settings`, {
    method: 'PUT',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function fetchBuilderLayoutApi(storeId: string): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any; store_id?: string }>(
    `/stores/${storeId}/builder-layout`,
    { storeId },
  );
  if (typeof res.store_id === 'string' && res.store_id !== storeId) {
    throw new Error('Store mismatch');
  }
  return res.data;
}

export async function saveBuilderLayoutApi(
  storeId: string,
  payload: {
    theme_id?: string;
    blocks: any[];
    is_published?: boolean;
    seasonal_theme?: any;
    typography_settings?: any;
    header_settings?: any;
    mobile_menu_icon?: any;
  }
): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/stores/${storeId}/builder-layout`, {
    method: 'PUT',
    storeId,
    body: payload,
  });
  return res.data;
}

/** One page of one store. Never the whole 10,000-row catalog. */
export async function fetchStorefrontCatalogPage(
  storeId: string,
  page = 1,
  perPage = 48,
): Promise<{ data: Product[]; total: number; lastPage: number }> {
  const q = `?store_id=${encodeURIComponent(storeId)}&page=${page}&per_page=${perPage}`;
  const res = await apiFetch<{ data?: ApiProductRow[]; meta?: { total?: number; last_page?: number } }>(
    `/storefront/catalog${q}`,
    { storeId, skipAuth: true },
  );
  const data = (res.data ?? []).map(mapProduct);
  return {
    data,
    total: Number(res.meta?.total ?? data.length),
    lastPage: Number(res.meta?.last_page ?? 1),
  };
}

export async function fetchWidgetProducts(
  storeId: string,
  query: { source?: string; category?: string; ids?: string; limit?: number },
): Promise<Array<{ id: string; store_id?: string; name?: string; name_ar?: string; price?: string | number; image_url?: string }>> {
  const params = new URLSearchParams({ store_id: storeId });
  if (query.source) params.set('source', query.source);
  if (query.category) params.set('category', query.category);
  if (query.ids) params.set('ids', query.ids);
  if (query.limit) params.set('limit', String(query.limit));
  const res = await apiFetch<{ data?: Array<{ id: string; store_id?: string; name?: string; name_ar?: string; price?: string | number; image_url?: string }> }>(
    `/storefront/catalog?${params.toString()}`,
    { storeId, skipAuth: true },
  );
  return res.data ?? [];
}

export async function fetchWidgetCategories(
  storeId: string,
): Promise<Array<{ id: string; store_id?: string; name?: string; name_ar?: string; slug?: string }>> {
  const res = await apiFetch<{ data?: Array<{ id: string; store_id?: string; name?: string; name_ar?: string; slug?: string }> }>(
    `/storefront/categories?store_id=${encodeURIComponent(storeId)}`,
    { storeId, skipAuth: true },
  );
  return res.data ?? [];
}

export async function fetchStoreReviews(
  storeId: string,
): Promise<Array<{ id?: string; rating?: number; comment?: string; commentAr?: string; author?: string }>> {
  const res = await apiFetch<{ data?: Array<{ id?: string; rating?: number; comment?: string; commentAr?: string; author?: string }> }>(
    `/stores/${encodeURIComponent(storeId)}/reviews`,
    { storeId, skipAuth: true },
  );
  return res.data ?? [];
}

export async function subscribeStoreNewsletter(storeId: string, email: string): Promise<void> {
  await apiFetch('/storefront/newsletter', {
    method: 'POST',
    storeId,
    skipAuth: true,
    body: { store_id: storeId, email },
  });
}

/** Guest storefront catalog — first page only, for the open store. */
export async function fetchStorefrontCatalog(storeId: string): Promise<Product[]> {
  const page = await fetchStorefrontCatalogPage(storeId);
  return page.data;
}

export async function fetchStorefrontThemeApi(storeId?: string, slug?: string): Promise<any> {
  const query = new URLSearchParams();
  if (storeId) query.set('store_id', storeId);
  if (slug) query.set('slug', slug);
  const q = query.toString();
  return apiFetch(`/storefront/theme${q ? `?${q}` : ''}`, { storeId, skipAuth: true });
}

export interface ThemePageRecord {
  id: string;
  store_id: string;
  slug: string;
  type: string;
  title_en?: string | null;
  title_ar?: string | null;
  draft_layout?: Record<string, unknown> | null;
  published_layout?: Record<string, unknown> | null;
  seo?: Record<string, unknown> | null;
  header_mode?: string;
  footer_mode?: string;
  status?: string;
  updated_at?: string | null;
}

export async function fetchThemePagesApi(storeId: string): Promise<ThemePageRecord[]> {
  const res = await apiFetch<{ success: boolean; data: ThemePageRecord[] }>(`/stores/${storeId}/pages`, { storeId });
  return res.data ?? [];
}

export async function fetchThemePageApi(storeId: string, pageKey: string): Promise<ThemePageRecord> {
  const res = await apiFetch<{ success: boolean; data: ThemePageRecord }>(
    `/stores/${storeId}/pages/${encodeURIComponent(pageKey)}`,
    { storeId },
  );
  return res.data;
}

export async function createThemePageApi(
  storeId: string,
  payload: {
    slug: string;
    type: string;
    title_en?: string;
    title_ar?: string;
    draft_layout?: Record<string, unknown> | null;
    published_layout?: Record<string, unknown> | null;
    seo?: Record<string, unknown> | null;
    status?: string;
  },
): Promise<ThemePageRecord> {
  const res = await apiFetch<{ success: boolean; data: ThemePageRecord }>(`/stores/${storeId}/pages`, {
    method: 'POST',
    storeId,
    body: payload,
  });
  return res.data;
}

export async function updateThemePageApi(
  storeId: string,
  pageId: string,
  payload: Partial<ThemePageRecord>,
): Promise<ThemePageRecord> {
  const res = await apiFetch<{ success: boolean; data: ThemePageRecord }>(
    `/stores/${storeId}/pages/${encodeURIComponent(pageId)}`,
    { method: 'PUT', storeId, body: payload },
  );
  return res.data;
}

export async function publishThemePageApi(
  storeId: string,
  pageId: string,
): Promise<ThemePageRecord & { seo_warnings?: string[] }> {
  const res = await apiFetch<{ success: boolean; data: ThemePageRecord; warnings?: string[] }>(
    `/stores/${storeId}/pages/${encodeURIComponent(pageId)}/publish`,
    { method: 'POST', storeId },
  );
  return { ...res.data, seo_warnings: res.warnings ?? [] };
}

export async function suggestThemeSeoApi(storeId: string, pageId: string) {
  return apiFetch<{ success: boolean; data: { saved: boolean; suggestions: Record<string, string>; faq: unknown[]; products: unknown[] } }>(
    `/stores/${storeId}/ai/seo`,
    { method: 'POST', storeId, body: { page_id: pageId } },
  );
}

export async function suggestThemeHeadingApi(storeId: string, pageId: string, widgetId: string, locale: 'en' | 'ar') {
  return apiFetch<{ success: boolean; data: { suggestion: string; saved: boolean } }>(
    `/stores/${storeId}/ai/heading`,
    { method: 'POST', storeId, body: { page_id: pageId, widget_id: widgetId, locale } },
  );
}

export async function suggestThemeAltApi(storeId: string, pageId: string, widgetId: string, fileName: string) {
  return apiFetch<{ success: boolean; data: { alt_en: string; alt_ar: string; saved: boolean } }>(
    `/stores/${storeId}/ai/alt`,
    { method: 'POST', storeId, body: { page_id: pageId, widget_id: widgetId, file_name: fileName } },
  );
}

export async function suggestThemeTranslateApi(storeId: string, pageId: string, widgetId: string, from: 'en' | 'ar', confirm: boolean) {
  return apiFetch<{ success: boolean; data: { source: string; target: string | null; target_key: string; saved: boolean } }>(
    `/stores/${storeId}/ai/translate`,
    { method: 'POST', storeId, body: { page_id: pageId, widget_id: widgetId, from, confirm } },
  );
}

export async function applyThemeSuggestionApi(
  storeId: string,
  pageId: string,
  fields: Record<string, string>,
  widgetId?: string,
) {
  return apiFetch<{ success: boolean; data: ThemePageRecord }>(
    `/stores/${storeId}/ai/apply`,
    { method: 'POST', storeId, body: { page_id: pageId, widget_id: widgetId, fields } },
  );
}

export async function deleteThemePageApi(storeId: string, pageId: string): Promise<void> {
  await apiFetch(`/stores/${storeId}/pages/${encodeURIComponent(pageId)}`, {
    method: 'DELETE',
    storeId,
  });
}

export async function fetchThemeRevisionsApi(storeId: string, pageId: string): Promise<any[]> {
  const res = await apiFetch<{ success: boolean; data: any[] }>(
    `/stores/${storeId}/pages/${encodeURIComponent(pageId)}/revisions`,
    { storeId },
  );
  return res.data ?? [];
}

export async function restoreThemeRevisionApi(storeId: string, revisionId: string): Promise<ThemePageRecord> {
  const res = await apiFetch<{ success: boolean; data: ThemePageRecord }>(
    `/stores/${storeId}/revisions/${encodeURIComponent(revisionId)}/restore`,
    { method: 'POST', storeId },
  );
  return res.data;
}

export async function fetchStoreSettingsApi(storeId: string): Promise<Record<string, any>> {
  const res = await apiFetch<{ success: boolean; data: Record<string, any> }>(`/stores/${storeId}/store-settings`, { storeId });
  return res.data ?? {};
}

export async function updateStoreSettingsApi(
  storeId: string,
  settings: Record<string, any>
): Promise<Record<string, any>> {
  const res = await apiFetch<{ success: boolean; data: Record<string, any> }>(`/stores/${storeId}/store-settings`, {
    method: 'PUT',
    storeId,
    body: { settings },
  });
  return res.data ?? {};
}

// ====================================================================
// Multi-Domain & Store Routing APIs (Phase 6.1)
// ====================================================================

/**
 * Public dynamic domain and subdomain resolution for storefront.
 * Resolves incoming hostname (e.g. specialtycoffee.sa, car.unityteck.com) to matching store and active theme.
 */
export async function resolveDomainApi(domain: string): Promise<DomainResolutionResult> {
  const q = `?domain=${encodeURIComponent(domain)}`;
  try {
    return await apiFetch<DomainResolutionResult>(`/storefront/resolve-domain${q}`);
  } catch (err: any) {
    return {
      resolved: false,
      domain,
      message: err?.message || 'Domain resolution failed',
    };
  }
}

/**
 * List all domain bindings (store-isolated or platform-wide for master).
 */
export async function fetchDomainsApi(storeId?: string): Promise<DomainRecord[]> {
  const q = storeId ? `?store_id=${encodeURIComponent(storeId)}` : '';
  const res = await apiFetch<ListResponse<ApiDomainRow>>(`/domains${q}`, { storeId });
  return (res.data ?? []).map(mapDomain);
}

/**
 * Register a new custom domain for a store.
 */
export async function createDomainApi(
  payload: { domain_name: string; hosting_tier?: string; is_primary?: boolean; store_id?: string },
  storeId?: string,
): Promise<DomainRecord> {
  const res = await apiFetch<ItemResponse<ApiDomainRow>>('/domains', {
    method: 'POST',
    storeId: payload.store_id || storeId,
    body: payload,
  });
  return mapDomain(res.data);
}

/**
 * Trigger DNS verification for a domain binding.
 */
export async function verifyDomainDnsApi(
  id: string,
  storeId?: string,
): Promise<{ success: boolean; message: string; data?: DomainRecord }> {
  const res = await apiFetch<{ success: boolean; message: string; data: ApiDomainRow }>(`/domains/${id}/verify`, {
    method: 'POST',
    storeId,
  });
  return {
    success: res.success,
    message: res.message,
    data: res.data ? mapDomain(res.data) : undefined,
  };
}

/**
 * Toggle or reissue SSL status for a domain binding.
 */
export async function toggleDomainSslApi(
  id: string,
  storeId?: string,
): Promise<{ success: boolean; message: string; data?: DomainRecord }> {
  const res = await apiFetch<{ success: boolean; message: string; data: ApiDomainRow }>(`/domains/${id}/ssl`, {
    method: 'POST',
    storeId,
  });
  return {
    success: res.success,
    message: res.message,
    data: res.data ? mapDomain(res.data) : undefined,
  };
}

/**
 * Delete a domain binding.
 */
export async function deleteDomainApi(id: string, storeId?: string): Promise<void> {
  await apiFetch(`/domains/${id}`, {
    method: 'DELETE',
    storeId,
  });
}

/**
 * Fetch store notification configuration and bilingual templates (Phase 6.4)
 */
export async function fetchNotificationSettingsApi(
  storeId?: string
): Promise<{ success: boolean; data: any }> {
  return apiFetch<{ success: boolean; data: any }>('/notifications/settings', {
    storeId,
  });
}

/**
 * Update store notification channels and custom templates (Phase 6.4)
 */
export async function updateNotificationSettingsApi(
  payload: {
    channels: any;
    templates: any;
    merchant_alert_phones?: string[];
    merchant_alert_emails?: string[];
    locale?: string;
  },
  storeId?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  return apiFetch<{ success: boolean; message: string; data?: any }>('/notifications/settings', {
    method: 'PUT',
    body: payload,
    storeId,
  });
}

/**
 * Send real test WhatsApp / SMS / Email alert (requires connected store channels)
 */
export async function sendTestNotificationApi(
  payload: {
    event: string;
    recipient_phone?: string;
    recipient_email?: string;
    channel: 'whatsapp' | 'sms' | 'email' | 'both' | 'all';
    order_id?: string;
  },
  storeId?: string
): Promise<{ success: boolean; data: any; message?: string; any_sent?: boolean }> {
  return apiFetch<{ success: boolean; data: any; message?: string; any_sent?: boolean }>(
    '/notifications/test',
    {
      method: 'POST',
      body: payload,
      storeId,
    }
  );
}

/** Real customer Email / WhatsApp / SMS delivery log for notification manage page */
export async function fetchNotificationDeliveriesApi(
  storeId?: string,
  params?: {
    channel?: 'all' | 'whatsapp' | 'sms' | 'email';
    status?: 'all' | 'sent' | 'failed' | 'skipped';
    event?: string;
    unread_only?: boolean;
    limit?: number;
  }
): Promise<{ success: boolean; data: { store_id: string; summary: any; items: any[] } }> {
  const query = new URLSearchParams();
  if (params?.channel && params.channel !== 'all') query.set('channel', params.channel);
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.event) query.set('event', params.event);
  if (params?.unread_only) query.set('unread_only', '1');
  if (params?.limit) query.set('limit', String(params.limit));
  const q = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/notifications/deliveries${q}`, { storeId });
}

export async function markNotificationDeliveriesReadApi(
  storeId?: string,
  payload?: { ids?: string[]; all?: boolean }
): Promise<{ success: boolean; updated: number }> {
  return apiFetch('/notifications/deliveries/mark-read', {
    method: 'POST',
    body: payload || { all: true },
    storeId,
  });
}

// ---------------------------------------------------------------------------
// Blog Articles, Settings & Article Commerce Tools APIs (Store-isolated)
// ---------------------------------------------------------------------------

export async function fetchBlogDataApi(
  storeId: string,
  params?: { q?: string; category?: string; status?: string; sort?: string; dir?: string }
): Promise<BlogApiResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.category) query.set('category', params.category);
  if (params?.status) query.set('status', params.status);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.dir) query.set('dir', params.dir);
  const qStr = query.toString() ? `?${query.toString()}` : '';

  return apiFetch<BlogApiResponse>(`/stores/${storeId}/blog/articles${qStr}`, {
    storeId,
  });
}

export async function createBlogArticleApi(
  storeId: string,
  payload: Partial<BlogArticleItem>
): Promise<{ success: boolean; data: BlogArticleItem; message: string }> {
  return apiFetch<{ success: boolean; data: BlogArticleItem; message: string }>(
    `/stores/${storeId}/blog/articles`,
    {
      method: 'POST',
      body: payload,
      storeId,
    }
  );
}

export async function updateBlogArticleApi(
  storeId: string,
  articleId: string,
  payload: Partial<BlogArticleItem>
): Promise<{ success: boolean; data: BlogArticleItem; message: string }> {
  return apiFetch<{ success: boolean; data: BlogArticleItem; message: string }>(
    `/stores/${storeId}/blog/articles/${articleId}`,
    {
      method: 'PUT',
      body: payload,
      storeId,
    }
  );
}

export async function deleteBlogArticleApi(
  storeId: string,
  articleId: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(
    `/stores/${storeId}/blog/articles/${articleId}`,
    {
      method: 'DELETE',
      storeId,
    }
  );
}

export async function bulkBlogArticlesActionApi(
  storeId: string,
  action: 'publish' | 'draft' | 'delete',
  ids: string[]
): Promise<{ success: boolean; message: string; count: number }> {
  return apiFetch<{ success: boolean; message: string; count: number }>(
    `/stores/${storeId}/blog/articles/bulk`,
    {
      method: 'POST',
      body: { action, ids },
      storeId,
    }
  );
}

export async function updateBlogSettingsApi(
  storeId: string,
  payload: {
    post_settings?: Partial<BlogPostSettings>;
    seo_settings?: Partial<BlogSeoSettings>;
    featured_article_id?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  post_settings: BlogPostSettings;
  seo_settings: BlogSeoSettings;
  featured_article_id: string;
}> {
  return apiFetch<{
    success: boolean;
    message: string;
    post_settings: BlogPostSettings;
    seo_settings: BlogSeoSettings;
    featured_article_id: string;
  }>(`/stores/${storeId}/blog/settings`, {
    method: 'PUT',
    body: payload,
    storeId,
  });
}

export async function fetchArticleCommerceToolsApi(
  storeId: string,
  articleId: string
): Promise<{ success: boolean; data: ArticleCommerceToolsConfig; article_id: string }> {
  return apiFetch<{ success: boolean; data: ArticleCommerceToolsConfig; article_id: string }>(
    `/stores/${storeId}/blog/commerce-tools/${articleId}`,
    {
      storeId,
    }
  );
}

export async function saveArticleCommerceToolsApi(
  storeId: string,
  articleId: string,
  config: ArticleCommerceToolsConfig
): Promise<{ success: boolean; message: string; data: ArticleCommerceToolsConfig }> {
  return apiFetch<{ success: boolean; message: string; data: ArticleCommerceToolsConfig }>(
    `/stores/${storeId}/blog/commerce-tools/${articleId}`,
    {
      method: 'PUT',
      body: { config },
      storeId,
    }
  );
}

// ── Real Affiliate Marketing (Hostinger MySQL / Laravel API) ──

export interface AffiliateOverviewData {
  summary: {
    totalSales: number;
    totalOrders: number;
    totalCommission: number;
    affiliatesCount: number;
    affiliateVisits: number;
    conversionRate: number;
    salesGrowth: string;
    ordersGrowth: string;
    commissionGrowth: string;
    affiliatesGrowth: string;
    visitsGrowth: string;
    conversionGrowth: string;
  };
  performance_series: Array<{ date: string; sales: number; orders: number }>;
  sales_by_offer: Array<{ name: string; percentage: number; amount: number }>;
  latest_updates: Array<{ id: string; label: string; time: string; status: string }>;
  opportunities: any[];
  partners: any[];
  orders: any[];
  payments: any[];
  program_settings: {
    enableProgram: boolean;
    enableMarketingMaterials: boolean;
    enableUniqueLinks: boolean;
  };
}

export async function fetchAffiliateOverviewApi(storeId: string): Promise<AffiliateOverviewData> {
  const res = await apiFetch<{ success: boolean; data: AffiliateOverviewData }>(
    `/stores/${storeId}/affiliate/overview`,
    { storeId }
  );
  return res.data;
}

export async function createAffiliateOpportunityApi(
  storeId: string,
  payload: {
    name: string;
    commissionType: 'fixed' | 'percentage';
    commissionValue: number;
    startDate?: string;
    endDate?: string;
    products?: string;
  }
): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any; message: string }>(
    `/stores/${storeId}/affiliate/opportunities`,
    {
      method: 'POST',
      body: payload,
      storeId,
    }
  );
  return res.data;
}

export async function updateAffiliateOpportunityApi(
  storeId: string,
  id: string,
  payload: Record<string, any>
): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any; message: string }>(
    `/stores/${storeId}/affiliate/opportunities/${id}`,
    {
      method: 'PATCH',
      body: payload,
      storeId,
    }
  );
  return res.data;
}

export async function deleteAffiliateOpportunityApi(
  storeId: string,
  id: string
): Promise<void> {
  await apiFetch(`/stores/${storeId}/affiliate/opportunities/${id}`, {
    method: 'DELETE',
    storeId,
  });
}

export async function createAffiliatePartnerApi(
  storeId: string,
  payload: { name: string; location?: string; avatar?: string }
): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any; message: string }>(
    `/stores/${storeId}/affiliate/partners`,
    {
      method: 'POST',
      body: payload,
      storeId,
    }
  );
  return res.data;
}

export async function createAffiliatePaymentApi(
  storeId: string,
  payload: { amount: number; status: 'Paid' | 'Under Review' }
): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any; message: string }>(
    `/stores/${storeId}/affiliate/payments`,
    {
      method: 'POST',
      body: payload,
      storeId,
    }
  );
  return res.data;
}

export async function updateAffiliateSettingsApi(
  storeId: string,
  settings: Record<string, any>
): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any; message: string }>(
    `/stores/${storeId}/affiliate/settings`,
    {
      method: 'PUT',
      body: settings,
      storeId,
    }
  );
  return res.data;
}

// ── Real Customer Loyalty Program (Hostinger MySQL / Laravel API) ──

export interface LoyaltyOverviewData {
  summary: {
    contributionToSales: string;
    ordersFromPoints: number;
    totalRedeemed: number;
    pointsIssued: number;
    registeredCustomers: number;
    salesGrowth: string;
    ordersGrowth: string;
    redeemedGrowth: string;
    pointsGrowth: string;
    customersStatus: string;
  };
  earn_rules: Array<{
    id: string;
    method?: string;
    methodAr: string;
    methodEn: string;
    points: number;
    active: boolean;
    config?: {
      points_per_sar?: number;
      qualifying_statuses?: string[];
      product_ids?: string[];
      mode?: 'double' | 'fixed';
      fixed_points_per_unit?: number;
      threshold_sar?: number;
      bonus_points?: number;
      points?: number;
      require_verified?: boolean;
      require_approval?: boolean;
      within_days?: number;
    };
  }>;
  rewards: Array<{ id: string; nameAr: string; nameEn: string; points: number; rewardType: string; status: string }>;
  redemptions: any[];
  activities: Array<{ id: string; label: string; time: string; status: string }>;
  performance_series: Array<{ date: string; sales: number; orders: number }>;
  usage_by_type: Array<{ name: string; percentage: number }>;
  settings: {
    enableLoyalty: boolean;
    appNotifications: boolean;
    emailNotifications: boolean;
    pointsExpiration: boolean;
  };
  game_settings?: {
    gameEnabled?: boolean;
    storefrontDockEnabled?: boolean;
    coinsPerSar?: number;
    minSpinCoins?: number;
    maxSpinCoins?: number;
    spinCooldownHours?: number;
    cardPaymentBonusCoins?: number;
    signupLocationBonusCoins?: number;
  };
}

export async function fetchLoyaltyOverviewApi(storeId: string): Promise<LoyaltyOverviewData> {
  const res = await apiFetch<{ success: boolean; data: LoyaltyOverviewData }>(
    `/stores/${storeId}/loyalty/overview`,
    { storeId }
  );
  return res.data;
}

export async function createLoyaltyRewardApi(
  storeId: string,
  payload: { name: string; points: number; rewardType?: string }
): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any; message: string }>(
    `/stores/${storeId}/loyalty/rewards`,
    {
      method: 'POST',
      body: payload,
      storeId,
    }
  );
  return res.data;
}

export async function deleteLoyaltyRewardApi(
  storeId: string,
  id: string
): Promise<void> {
  await apiFetch(`/stores/${storeId}/loyalty/rewards/${id}`, {
    method: 'DELETE',
    storeId,
  });
}

export async function updateLoyaltyEarnRuleApi(
  storeId: string,
  id: string,
  payload: {
    active?: boolean;
    points?: number;
    config?: {
      points_per_sar?: number;
      qualifying_statuses?: string[];
      product_ids?: string[];
      mode?: 'double' | 'fixed';
      fixed_points_per_unit?: number;
      threshold_sar?: number;
      bonus_points?: number;
      points?: number;
      require_verified?: boolean;
      require_approval?: boolean;
      within_days?: number;
    };
  }
): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any; message: string }>(
    `/stores/${storeId}/loyalty/earn-rules/${id}`,
    {
      method: 'PATCH',
      body: payload,
      storeId,
    }
  );
  return res.data;
}

export async function updateLoyaltySettingsApi(
  storeId: string,
  settings: Record<string, any>
): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any; message: string }>(
    `/stores/${storeId}/loyalty/settings`,
    {
      method: 'PUT',
      body: settings,
      storeId,
    }
  );
  return res.data;
}

export async function loyaltyDailySpinApi(
  storeId: string,
  customerId: string
): Promise<{ points: number; next_spin_at?: string | null }> {
  const res = await apiFetch<{
    success: boolean;
    data: { points: number; next_spin_at?: string | null };
  }>(`/stores/${storeId}/loyalty/spin`, {
    method: 'POST',
    body: { customer_id: customerId },
    storeId,
  });
  return res.data;
}

export type StorefrontLoyaltyCredit = {
  id: string;
  points: number;
  method?: string;
  reason?: string;
  source_event_id?: string;
  created_at?: string;
};

export async function fetchStorefrontLoyaltyBalanceApi(
  storeId: string,
  customerId: string,
): Promise<{ loyalty_points: number; recent_credits: StorefrontLoyaltyCredit[] }> {
  const res = await apiFetch<{
    success: boolean;
    data: { loyalty_points: number; recent_credits: StorefrontLoyaltyCredit[] };
  }>(`/storefront/${storeId}/loyalty/balance?customer_id=${encodeURIComponent(customerId)}`, {
    storeId,
    skipAuth: true,
  });
  return {
    loyalty_points: Number(res.data?.loyalty_points ?? 0),
    recent_credits: Array.isArray(res.data?.recent_credits) ? res.data.recent_credits : [],
  };
}

export async function loyaltySavedCardBonusApi(
  storeId: string,
  customerId: string,
  orderId?: string
): Promise<{ points: number }> {
  const res = await apiFetch<{ success: boolean; data: { points: number } }>(
    `/stores/${storeId}/loyalty/bonuses/saved-card`,
    {
      method: 'POST',
      body: { customer_id: customerId, order_id: orderId },
      storeId,
    }
  );
  return res.data;
}

export async function loyaltyLocationPushBonusApi(
  storeId: string,
  customerId: string
): Promise<{ points: number }> {
  const res = await apiFetch<{ success: boolean; data: { points: number } }>(
    `/stores/${storeId}/loyalty/bonuses/location-push`,
    {
      method: 'POST',
      body: { customer_id: customerId },
      storeId,
    }
  );
  return res.data;
}

/** @deprecated Prefer CashbackCampaign from cashbackService + mapApiCashbackRow */
export type CashbackCampaignApi = CashbackCampaign;

// ── Real Marketing Channels & Campaigns Performance APIs ──

export interface MarketingChannelItem {
  id: string;
  key: string;
  name: string;
  name_ar: string;
  type: string;
  type_ar: string;
  icon: string;
  color: string;
  visits: number;
  add_to_cart: number;
  completed_orders: number;
  conversion_rate: number;
  revenue: number;
  aov: number;
  growth: number;
  trend_sparkline: number[];
  roas: number | null;
  is_connected: boolean;
}

export interface MarketingChannelsOverviewData {
  store_id: string;
  period: {
    from: string;
    to: string;
    label: string;
  };
  kpis: {
    completed_orders: { value: number; growth: string; growth_value: number; label: string };
    revenue: { value: number; growth: string; growth_value: number; label: string };
    total_visits: { value: number; growth: string; growth_value: number; label: string };
    conversion_rate: { value: number; formatted: string; growth: string; growth_value: number; label: string };
    add_to_cart: { value: number; growth: string; growth_value: number; label: string };
    average_order_value: { value: number; growth: string; growth_value: number; label: string };
  };
  channels: MarketingChannelItem[];
  totals: {
    visits: number;
    add_to_cart: number;
    completed_orders: number;
    conversion_rate: number;
    revenue: number;
    aov: number;
    growth: number;
  };
  visits_trend: {
    current: Array<{ label: string; value: number }>;
    previous: Array<{ label: string; value: number }>;
  };
  orders_by_channel: Array<{
    name: string;
    name_ar: string;
    orders: number;
    color: string;
  }>;
  integrations: Array<{
    id: string;
    name: string;
    icon: string;
    last_synced: string;
    status: string;
    connected: boolean;
  }>;
}

export async function fetchChannelPerformanceOverviewApi(
  storeId: string,
  params?: { period?: string; from?: string; to?: string }
): Promise<MarketingChannelsOverviewData> {
  const query = new URLSearchParams();
  if (params?.period) query.set('period', params.period);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const qStr = query.toString();
  const res = await apiFetch<any>(
    `/stores/${storeId}/marketing/channels/overview${qStr ? `?${qStr}` : ''}`,
    { storeId }
  );
  return res;
}

// ── Smart Cart Intercept (Flowers Store 1st-Click Popups & Live Tracking - Hostinger MySQL) ──

export interface CartInterceptConfig {
  enabled: boolean;
  active_modal: 'loyalty' | 'gift' | 'save_cart' | 'disabled';
  loyalty_points: number;
  discount_percent: number;
  coupon_code: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  gift_title_en?: string;
  gift_title_ar?: string;
  gift_subtitle_en?: string;
  gift_subtitle_ar?: string;
  save_cart_title_en?: string;
  save_cart_title_ar?: string;
  save_cart_subtitle_en?: string;
  save_cart_subtitle_ar?: string;
}

export interface CartInterceptTrackingLog {
  id: string;
  visitor_id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  modal_type: 'loyalty' | 'gift' | 'save_cart';
  action: 'impression' | 'collect_points' | 'get_code' | 'save_cart' | 'continue_as_guest' | 'later' | 'dismissed';
  product_id?: string | null;
  product_name?: string | null;
  product_price?: number | null;
  product_image?: string | null;
  status: 'viewed' | 'converted' | 'guest_continued' | 'dismissed';
  created_at: string;
  ip?: string;
  user_agent?: string;
}

export interface CartInterceptTrackingData {
  logs: CartInterceptTrackingLog[];
  metrics: {
    total_impressions: number;
    total_converted: number;
    total_guest_continued: number;
    total_dismissed: number;
    conversion_rate: number;
    by_modal: Record<string, { impressions: number; conversions: number }>;
  };
}

export interface CartInterceptCustomerRewards {
  loyalty_points: number;
  claimed_coupons: Array<{
    code: string;
    discount_percent: number;
    claimed_at: string;
    is_used: boolean;
  }>;
  saved_carts: Array<{
    id: string;
    items: any[];
    product_preview?: string;
    saved_at: string;
  }>;
  points_history?: Array<{
    points: number;
    reason: string;
    reason_ar: string;
    date: string;
  }>;
}

export async function fetchCartInterceptSettingsApi(storeId: string): Promise<CartInterceptConfig> {
  const res = await apiFetch<{ success: boolean; data: CartInterceptConfig }>(
    `/storefront/cart-intercept/${storeId}/settings`,
    { storeId, skipAuth: true }
  );
  return res.data;
}

export async function updateCartInterceptSettingsApi(
  storeId: string,
  payload: Partial<CartInterceptConfig>
): Promise<CartInterceptConfig> {
  const res = await apiFetch<{ success: boolean; data: CartInterceptConfig }>(
    `/stores/${storeId}/cart-intercept/settings`,
    {
      method: 'PUT',
      storeId,
      body: payload,
    }
  );
  return res.data;
}

export async function fetchCartInterceptTrackingApi(storeId: string): Promise<CartInterceptTrackingData> {
  const res = await apiFetch<{ success: boolean; data: CartInterceptTrackingData }>(
    `/stores/${storeId}/cart-intercept/tracking`,
    { storeId }
  );
  return res.data;
}

export async function trackCartInterceptActionApi(
  storeId: string,
  payload: {
    visitor_id: string;
    customer_id?: string | null;
    customer_name?: string | null;
    customer_email?: string | null;
    modal_type: 'loyalty' | 'gift' | 'save_cart';
    action: 'impression' | 'collect_points' | 'get_code' | 'save_cart' | 'continue_as_guest' | 'later' | 'dismissed';
    product_id?: string | null;
    product_name?: string | null;
    product_price?: number | null;
    product_image?: string | null;
    cart_items?: any[];
  }
): Promise<{ success: boolean; entry?: CartInterceptTrackingLog }> {
  return await apiFetch<{ success: boolean; entry?: CartInterceptTrackingLog }>(
    `/storefront/cart-intercept/${storeId}/track`,
    {
      method: 'POST',
      storeId,
      body: payload,
      skipAuth: true,
    }
  );
}

export async function fetchCartInterceptCustomerProfileApi(
  storeId: string,
  customerId: string
): Promise<CartInterceptCustomerRewards> {
  const res = await apiFetch<{ success: boolean; data: CartInterceptCustomerRewards }>(
    `/storefront/cart-intercept/${storeId}/customer/${encodeURIComponent(customerId)}`,
    { storeId, skipAuth: true }
  );
  return res.data;
}

export interface GiftingCardItem {
  id: string;
  titleEn: string;
  titleAr: string;
  category: string;
  imageUrl?: string;
}

export interface GiftingBoxItem {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  selected?: boolean;
  imageUrl?: string;
}

export interface GiftingOrderRecord {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_location: string;
  status: string;
  total_amount: number;
  is_gift: boolean;
  gift_message: string;
  recipient_name: string;
  date: string;
}

export interface GiftingSettingsData {
  enabled: boolean;
  allow_anonymous: boolean;
  max_message_length: number;
  cards: GiftingCardItem[];
  boxes: GiftingBoxItem[];
  sample_message: {
    en: string;
    ar: string;
  };
  real_orders: GiftingOrderRecord[];
}

export async function fetchGiftingSettingsApi(storeId: string): Promise<GiftingSettingsData> {
  const res = await apiFetch<{
    success: boolean;
    store_id: string;
    store_name: string;
    data: GiftingSettingsData;
  }>(`/stores/${storeId}/gifting/settings`, { storeId });
  return res.data;
}

export async function updateGiftingSettingsApi(
  storeId: string,
  payload: Partial<GiftingSettingsData>
): Promise<GiftingSettingsData> {
  const res = await apiFetch<{
    success: boolean;
    message: string;
    store_id: string;
    data: GiftingSettingsData;
  }>(`/stores/${storeId}/gifting/settings`, {
    method: 'PUT',
    storeId,
    body: payload,
  });
  return res.data;
}

/* ─── Cashback campaigns (store wallet only) ─── */

export type CashbackCampaignPayload = {
  name: string;
  image_url?: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  min_cart_value?: number;
  max_cashback_per_order?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: CashbackCampaign['status'];
  product_scope?: 'all' | 'include' | 'exclude';
  product_ids?: string[];
  credit_expiry_days?: number | null;
  hold_days?: number;
};

export async function fetchCashbackCampaignsApi(storeId: string): Promise<CashbackCampaign[]> {
  const res = await apiFetch<{ success: boolean; data: Record<string, unknown>[] }>(
    `/stores/${storeId}/cashback/campaigns`,
    { storeId },
  );
  return (res.data ?? []).map((row) => mapApiCashbackRow(row, storeId));
}

export async function createCashbackCampaignApi(
  storeId: string,
  payload: CashbackCampaignPayload | Record<string, unknown>,
): Promise<CashbackCampaign> {
  const res = await apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    `/stores/${storeId}/cashback/campaigns`,
    { method: 'POST', storeId, body: payload },
  );
  return mapApiCashbackRow(res.data, storeId);
}

export async function updateCashbackCampaignApi(
  storeId: string,
  id: string,
  payload: Partial<CashbackCampaignPayload>,
): Promise<CashbackCampaign> {
  const res = await apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    `/stores/${storeId}/cashback/campaigns/${id}`,
    { method: 'PATCH', storeId, body: payload },
  );
  return mapApiCashbackRow(res.data, storeId);
}

export async function deleteCashbackCampaignApi(storeId: string, id: string): Promise<void> {
  await apiFetch(`/stores/${storeId}/cashback/campaigns/${id}`, { method: 'DELETE', storeId });
}

export async function fetchStorefrontActiveCashbackApi(
  storeId: string,
): Promise<CashbackCampaign | null> {
  const res = await apiFetch<{ success: boolean; data: Record<string, unknown> | null }>(
    `/storefront/cashback/active?store_id=${encodeURIComponent(storeId)}`,
    { storeId, skipAuth: true },
  );
  if (!res.data) return null;
  return mapApiCashbackRow(res.data, storeId);
}

export type SpecialOfferPayload = {
  title_ar?: string | null;
  title_en?: string | null;
  offer_type: SpecialOffer['offerType'];
  discount_value: number;
  min_order_value?: number | null;
  max_discount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  message?: string | null;
  status?: SpecialOffer['status'];
  product_scope?: 'all' | 'specific';
  product_ids?: string[];
  banner_bg_color?: string | null;
  banner_image_url?: string | null;
};

export async function fetchSpecialOffersApi(storeId: string): Promise<SpecialOffer[]> {
  const res = await apiFetch<{ success: boolean; data: Record<string, unknown>[] }>(
    '/special-offers',
    { storeId },
  );
  return (res.data ?? []).map((row) => mapApiSpecialOfferRow(row, storeId));
}

export async function createSpecialOfferApi(
  storeId: string,
  payload: SpecialOfferPayload,
): Promise<SpecialOffer> {
  const res = await apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    '/special-offers',
    { method: 'POST', storeId, body: payload },
  );
  return mapApiSpecialOfferRow(res.data, storeId);
}

export async function updateSpecialOfferApi(
  storeId: string,
  id: string,
  payload: Partial<SpecialOfferPayload>,
): Promise<SpecialOffer> {
  const res = await apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    `/special-offers/${id}`,
    { method: 'PATCH', storeId, body: payload },
  );
  return mapApiSpecialOfferRow(res.data, storeId);
}

export async function deleteSpecialOfferApi(storeId: string, id: string): Promise<void> {
  await apiFetch(`/special-offers/${id}`, { method: 'DELETE', storeId });
}

export async function fetchStorefrontActiveSpecialOfferApi(
  storeId: string,
): Promise<SpecialOffer | null> {
  const res = await apiFetch<{ success: boolean; data: Record<string, unknown> | null }>(
    `/storefront/special-offers/active?store_id=${encodeURIComponent(storeId)}`,
    { storeId, skipAuth: true },
  );
  if (!res.data) return null;
  return mapApiSpecialOfferRow(res.data, storeId);
}

