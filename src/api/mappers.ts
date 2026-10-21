import type {
  CouponItem,
  Customer,
  CustomerSource,
  CustomerStatus,
  Order,
  PlanType,
  Product,
  ShippingZone,
  Store,
  StoreSEOConfig,
  DomainRecord,
} from '../types';

/** Loose API row shapes (snake_case from Laravel). */
export type ApiStoreRow = Record<string, unknown>;
export type ApiProductRow = Record<string, unknown>;
export type ApiOrderRow = Record<string, unknown>;
export type ApiCustomerRow = Record<string, unknown>;
export type ApiCouponRow = Record<string, unknown>;
export type ApiShippingRow = Record<string, unknown>;
export type ApiSeoRow = Record<string, unknown>;

function str(v: unknown, fallback = ''): string {
  if (v == null) return fallback;
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function dateSlice(v: unknown): string {
  if (!v) return new Date().toISOString().split('T')[0];
  const s = String(v);
  return s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
}

function mapPlan(plan: unknown): PlanType {
  const p = String(plan || 'free').toLowerCase();
  if (p === 'paid' || p === 'pro' || p === 'custom' || p === 'free') {
    return p;
  }
  return 'free';
}

function mapStoreStatus(status: unknown): Store['status'] {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'inactive') return 'suspended';
  if (s === 'active' || s === 'pending' || s === 'suspended') return s;
  return 'pending';
}

export function mapStore(row: ApiStoreRow): Store {
  const currencyRaw = str(row.currency, 'SAR').toUpperCase();
  const currency =
    currencyRaw === 'USD' || currencyRaw === 'AED' || currencyRaw === 'EUR' || currencyRaw === 'SAR'
      ? currencyRaw
      : 'SAR';
  const localeRaw = str(row.locale, 'en').toLowerCase();
  const locale = localeRaw === 'ar' ? 'ar' : 'en';

  const rawName = str(row.name);
  const isMakkahStore =
    str(row.id) === 'store-1' ||
    str(row.id) === '1' ||
    str(row.slug).includes('giftshop') ||
    str(row.slug).includes('makkah') ||
    /هدايا مكة|مكة|gift ?shop/i.test(rawName);

  const nameAr = isMakkahStore
    ? 'هدايا مكة للزهور والهدايا'
    : (row.name_ar ? str(row.name_ar) : undefined);
  const nameEn = isMakkahStore
    ? 'Makkah Flowers'
    : (row.name_en ? str(row.name_en) : undefined);

  return {
    id: str(row.id),
    name: isMakkahStore ? 'هدايا مكة' : rawName,
    nameAr,
    nameEn,
    slug: str(row.slug),
    category: str(row.category, 'General'),
    owner: str(row.owner_name ?? row.owner, 'Owner'),
    ownerEmail: str(row.email ?? row.owner_email, ''),
    plan: mapPlan(row.plan),
    masterGrantedPro: Boolean(row.master_granted_pro),
    status: mapStoreStatus(row.status),
    productsCount: num(row.products_count),
    ordersCount: num(row.orders_count),
    revenue: num(row.revenue),
    visitorsCount: num(row.visitors_count),
    lastActivity: 'Synced',
    logo: str(row.logo, 'store'),
    accentColor: str(row.accent_color, '#059669'),
    dbIsolation:
      row.db_isolation === 'dedicated_mysql' ? 'dedicated_mysql' : 'shared_store_id',
    createdAt: dateSlice(row.created_at),
    currency,
    locale,
    textDirection: locale === 'ar' ? 'rtl' : 'ltr',
    timezone: str(row.timezone, 'Asia/Riyadh') || 'Asia/Riyadh',
  };
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === 'string');
  }
  if (typeof v === 'string' && v.trim()) {
    try {
      const parsed = JSON.parse(v) as unknown;
      return asStringArray(parsed);
    } catch {
      return v.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function mapProduct(row: ApiProductRow): Product {
  const statusRaw = str(row.status, 'draft');
  const status: Product['status'] =
    statusRaw === 'published' || statusRaw === 'archived' ? statusRaw : 'draft';

  const original = row.original_price;
  const originalPrice =
    original === null || original === undefined || original === ''
      ? null
      : num(original);

  return {
    id: str(row.id),
    storeId: str(row.store_id),
    name: str(row.name),
    nameAr: row.name_ar ? str(row.name_ar) : undefined,
    nameEn: row.name_en ? str(row.name_en) : undefined,
    sku: str(row.sku),
    category: str(row.category, 'General'),
    categoryAr: row.category_ar ? str(row.category_ar) : undefined,
    categoryEn: row.category_en ? str(row.category_en) : undefined,
    price: num(row.price),
    originalPrice,
    stock: num(row.stock),
    status,
    isActive: row.is_active === undefined ? true : Boolean(row.is_active),
    isStale: false,
    publishedAt: dateSlice(row.updated_at ?? row.created_at),
    image: str(row.image_url ?? row.image, ''),
    imageVersion: row.image_version == null ? null : str(row.image_version),
    galleryUrls: asStringArray(row.gallery_urls),
    videoUrl: row.video_url == null || row.video_url === '' ? null : str(row.video_url),
    tags: asStringArray(row.tags),
    badge: row.badge ? str(row.badge) : undefined,
    badgeEn: row.badge_en ? str(row.badge_en) : undefined,
    description: row.description == null ? null : str(row.description),
    seoTitle: row.seo_title == null || row.seo_title === '' ? null : str(row.seo_title),
    seoDescription:
      row.seo_description == null || row.seo_description === ''
        ? null
        : str(row.seo_description),
    seoKeywords:
      row.seo_keywords == null || row.seo_keywords === '' ? null : str(row.seo_keywords),
    specComparisonImage:
      row.spec_comparison_image ? str(row.spec_comparison_image) : (row.specComparisonImage ? str(row.specComparisonImage) : undefined),
    specComparisonImageAr:
      row.spec_comparison_image_ar ? str(row.spec_comparison_image_ar) : (row.specComparisonImageAr ? str(row.specComparisonImageAr) : undefined),
  };
}

const ORDER_SOURCES: Order['source'][] = [
  'WhatsApp',
  'Instagram',
  'Google Ads',
  'Facebook',
  'Snapchat',
  'Direct',
];

const PAYMENT_METHODS: Order['paymentMethod'][] = [
  'Mada',
  'Visa/MC',
  'Apple Pay',
  'COD',
];

function mapOrderSource(v: unknown): Order['source'] {
  const s = str(v, 'Direct');
  return (ORDER_SOURCES.find((x) => x.toLowerCase() === s.toLowerCase()) ??
    'Direct') as Order['source'];
}

function mapPaymentMethod(v: unknown): Order['paymentMethod'] {
  const s = str(v, 'COD');
  return (
    PAYMENT_METHODS.find((x) => x.toLowerCase() === s.toLowerCase()) ?? 'COD'
  );
}

function mapOrderStatus(v: unknown): Order['status'] {
  const s = str(v, 'pending').toLowerCase();
  const validStatuses: Order['status'][] = [
    'pending',
    'processing',
    'shipped',
    'out_for_delivery',
    'delivered',
    'completed',
    'cancellation_requested',
    'cancelled',
    'returned',
  ];
  if (validStatuses.includes(s as Order['status'])) {
    return s as Order['status'];
  }
  return 'pending';
}

export function mapOrder(row: ApiOrderRow): Order {
  const items = row.items;
  let itemsCount = num(row.items_count, 0);
  if (!itemsCount && Array.isArray(items)) {
    itemsCount = items.length || 1;
  }
  if (!itemsCount) itemsCount = 1;

  const rowAny = row as Record<string, unknown>;

  const rawId = str(row.id);
  const orderId = rawId || (row.order_number ? `ord-${str(row.order_number)}` : `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  return {
    id: orderId,
    storeId: str(row.store_id),
    orderNumber: str(row.order_number),
    customerName: str(row.customer_name),
    customerPhone: str(row.customer_phone),
    itemsCount,
    itemsSummary: row.items_summary != null ? str(row.items_summary) : undefined,
    items: Array.isArray(items)
      ? items.map((it: any, itIdx: number) => ({
          id: String(it.id || it.product_id || `it-${itIdx + 1}`),
          name: String(it.product_name || it.name || ''),
          sku: String(it.sku || ''),
          price: num(it.unit_price ?? it.price, 0),
          quantity: num(it.quantity, 1),
          total: num(it.subtotal ?? (num(it.unit_price ?? it.price, 0) * num(it.quantity, 1))),
          image: it.image ? String(it.image) : undefined,
        }))
      : undefined,
    total: num(row.total_amount ?? row.total),
    source: mapOrderSource(row.source),
    sourceDetails:
      row.source_details != null ? str(row.source_details) : undefined,
    deliveryLocation: str(row.delivery_location, ''),
    status: mapOrderStatus(row.status),
    paymentMethod: mapPaymentMethod(row.payment_method),
    paymentStatus: rowAny.payment_status ? String(rowAny.payment_status) as any : undefined,
    shippingStatus: rowAny.shipping_status ? String(rowAny.shipping_status) as any : undefined,
    trackingNumber: rowAny.tracking_number ? String(rowAny.tracking_number) : undefined,
    shippingCompany: rowAny.courier_code ? String(rowAny.courier_code) : undefined,
    codStatus: rowAny.cod_status ? String(rowAny.cod_status) as any : undefined,
    codCollectedAt: rowAny.cod_collected_at ? String(rowAny.cod_collected_at) : undefined,
    codRemittedAt: rowAny.cod_remitted_at ? String(rowAny.cod_remitted_at) : undefined,
    codNotes: rowAny.cod_notes ? String(rowAny.cod_notes) : undefined,
    refundStatus: rowAny.refund_status ? String(rowAny.refund_status) as any : undefined,
    refundAmount: rowAny.refund_amount != null ? num(rowAny.refund_amount) : undefined,
    returnReason: rowAny.return_reason ? String(rowAny.return_reason) : undefined,
    returnNotes: rowAny.return_notes ? String(rowAny.return_notes) : undefined,
    returnedAt: rowAny.returned_at ? String(rowAny.returned_at) : undefined,
    restockedAt: rowAny.restocked_at ? String(rowAny.restocked_at) : undefined,
    date: dateSlice(row.order_date ?? row.created_at),
    createdAt: (row.order_date ?? row.created_at) ? String(row.order_date ?? row.created_at) : undefined,
    time: rowAny.time ? String(rowAny.time) : (
      (row.order_date ?? row.created_at) && String(row.order_date ?? row.created_at).includes('T')
        ? String(row.order_date ?? row.created_at).split('T')[1].slice(0, 5)
        : (row.order_date ?? row.created_at) && String(row.order_date ?? row.created_at).includes(' ')
          ? String(row.order_date ?? row.created_at).split(' ')[1].slice(0, 5)
          : undefined
    ),
    medium: row.medium != null ? str(row.medium) : undefined,
    campaign: row.campaign != null ? str(row.campaign) : undefined,
    utmTerm: (row.utm_term ?? row.utmTerm) != null ? str(row.utm_term ?? row.utmTerm) : undefined,
    utmContent: (row.utm_content ?? row.utmContent) != null ? str(row.utm_content ?? row.utmContent) : undefined,
  };
}

const CUSTOMER_SOURCES: CustomerSource[] = [
  'Instagram',
  'Google Ads',
  'WhatsApp',
  'Facebook',
  'Snapchat',
  'Direct',
  'TikTok',
  'Referral',
  'Other',
];

function mapCustomerSource(v: unknown): CustomerSource {
  const s = str(v, 'Direct');
  return (
    CUSTOMER_SOURCES.find((x) => x.toLowerCase() === s.toLowerCase()) ?? 'Direct'
  );
}

function mapCustomerStatus(v: unknown): CustomerStatus {
  const s = str(v, 'New');
  const allowed: CustomerStatus[] = [
    'VIP',
    'Active',
    'New',
    'Inactive',
    'Cancelled',
  ];
  return allowed.find((x) => x.toLowerCase() === s.toLowerCase()) ?? 'New';
}

function mapGender(v: unknown): Customer['gender'] {
  const s = str(v, 'Other');
  if (s === 'Male' || s === 'Female' || s === 'Other') return s;
  return 'Other';
}

function mapGroup(v: unknown): Customer['group'] {
  const s = str(v, 'Regular');
  if (s === 'VIP' || s === 'Regular' || s === 'Wholesale') return s;
  return 'Regular';
}

export function mapCustomer(row: ApiCustomerRow): Customer {
  const totalOrders = num(row.total_orders);
  const totalSpend = num(row.total_spend ?? row.total_spending);
  const avg =
    row.avg_order_value != null
      ? num(row.avg_order_value)
      : totalOrders > 0
        ? totalSpend / totalOrders
        : 0;

  const rawId = str(row.id);
  const custId = rawId || (row.email ? `cust-${str(row.email)}` : `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  return {
    id: custId,
    storeId: str(row.store_id),
    name: str(row.name),
    phone: str(row.phone),
    email: str(row.email),
    avatar: row.avatar != null ? str(row.avatar) : undefined,
    status: mapCustomerStatus(row.status),
    city: str(row.city, 'Makkah'),
    country: str(row.country, 'Saudi Arabia'),
    gender: mapGender(row.gender),
    source: mapCustomerSource(row.acquisition_source ?? row.source),
    group: mapGroup(row.group),
    totalOrders,
    totalSpending: totalSpend,
    avgOrderValue: avg,
    registeredDate: dateSlice(row.created_at ?? row.registered_date),
    lastOrderDate: row.last_order_date
      ? dateSlice(row.last_order_date)
      : '—',
  };
}

export function mapCoupon(row: ApiCouponRow): CouponItem {
  const discountType =
    str(row.discount_type, 'percentage') === 'fixed' ? 'fixed' : 'percentage';
  const statusRaw = str(row.status, 'active');
  const status: CouponItem['status'] =
    statusRaw === 'expired' || statusRaw === 'scheduled' ? statusRaw : 'active';

  return {
    id: str(row.id),
    storeId: str(row.store_id),
    code: str(row.code),
    discountType,
    discountValue: num(row.discount_value),
    minOrderValue: num(row.min_order_amount ?? row.min_order_value),
    usageCount: num(row.usage_count),
    maxUsage: num(row.max_uses ?? row.max_usage, 0),
    status,
    validUntil: row.expires_at ? dateSlice(row.expires_at) : '—',
  };
}

export function mapShipping(row: ApiShippingRow): ShippingZone {
  const statusRaw = str(row.status, 'active');
  const regionStr = str(row.region ?? row.province, 'Saudi Arabia');
  return {
    id: str(row.id),
    storeId: str(row.store_id),
    cityName: str(row.name ?? row.city_name, 'City'),
    province: regionStr,
    region: regionStr,
    rate: num(row.rate),
    ratePerKg: num(row.rate_per_kg, 0),
    minWeightKg: num(row.min_weight_kg, 0),
    maxWeightKg: num(row.max_weight_kg, 20),
    freeShippingAbove: num(row.free_above ?? row.free_shipping_above),
    estimatedDelivery: str(
      row.estimated_delivery,
      `${num(row.min_delivery_days, 1)}-${num(row.max_delivery_days, 2)} days`,
    ),
    status: statusRaw === 'inactive' ? 'inactive' : 'active',
  };
}

function parseKeywords(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === 'string' && v.trim()) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
      /* comma-separated */
    }
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function mapSeo(
  row: ApiSeoRow | null | undefined,
  storeId: string,
): StoreSEOConfig {
  if (!row) {
    return {
      storeId,
      googleConnected: false,
      googleAccountEmail: null,
      connectedAt: null,
      ga4MeasurementId: '',
      gtmContainerId: '',
      searchConsoleConnected: false,
      searchConsoleVerificationTag: '',
      indexingApiEnabled: false,
      metaTitle: '',
      metaDescription: '',
      keywords: [],
      sitemapUrl: '',
      indexedUrlsCount: 0,
      totalSearchClicks: 0,
      totalSearchImpressions: 0,
      avgCtr: 0,
      avgPosition: 0,
      lastIndexingPing: 'Never',
      submittedUrls: [],
      topQueries: [],
    };
  }

  const extra =
    row.extra && typeof row.extra === 'object' && !Array.isArray(row.extra)
      ? (row.extra as Record<string, unknown>)
      : {};

  return {
    storeId: str(row.store_id, storeId),
    googleConnected: Boolean(row.google_connected),
    googleAccountEmail: row.google_account_email
      ? str(row.google_account_email)
      : null,
    connectedAt: row.google_connected_at
      ? dateSlice(row.google_connected_at)
      : null,
    ga4MeasurementId: str(row.ga4_measurement_id),
    gtmContainerId: str(row.gtm_container_id),
    searchConsoleConnected: Boolean(row.search_console_connected),
    searchConsoleVerificationTag: str(
      row.search_console_tag ?? row.search_console_verification_tag,
    ),
    indexingApiEnabled: Boolean(row.indexing_api_enabled),
    metaTitle: str(row.meta_title),
    metaDescription: str(row.meta_description),
    keywords: parseKeywords(row.keywords),
    sitemapUrl: str(row.sitemap_url),
    indexedUrlsCount: num(extra.indexed_urls_count),
    totalSearchClicks: num(extra.total_search_clicks),
    totalSearchImpressions: num(extra.total_search_impressions),
    avgCtr: num(extra.avg_ctr),
    avgPosition: num(extra.avg_position),
    lastIndexingPing: str(extra.last_indexing_ping, 'Never'),
    submittedUrls: Array.isArray(extra.submitted_urls)
      ? (extra.submitted_urls as StoreSEOConfig['submittedUrls'])
      : [],
    topQueries: Array.isArray(extra.top_queries)
      ? (extra.top_queries as StoreSEOConfig['topQueries'])
      : [],
  };
}

/** Map frontend SEO patch → API snake_case body. */
export function seoPatchToApi(
  patch: Partial<StoreSEOConfig>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (patch.metaTitle !== undefined) body.meta_title = patch.metaTitle;
  if (patch.metaDescription !== undefined) {
    body.meta_description = patch.metaDescription;
  }
  if (patch.keywords !== undefined) {
    body.keywords = Array.isArray(patch.keywords)
      ? patch.keywords.join(', ')
      : patch.keywords;
  }
  if (patch.ga4MeasurementId !== undefined) {
    body.ga4_measurement_id = patch.ga4MeasurementId;
  }
  if (patch.gtmContainerId !== undefined) {
    body.gtm_container_id = patch.gtmContainerId;
  }
  if (patch.searchConsoleVerificationTag !== undefined) {
    body.search_console_tag = patch.searchConsoleVerificationTag;
  }
  if (patch.googleConnected !== undefined) {
    body.google_connected = patch.googleConnected;
  }
  if (patch.googleAccountEmail !== undefined) {
    body.google_account_email = patch.googleAccountEmail;
  }
  if (patch.connectedAt !== undefined) {
    body.google_connected_at = patch.connectedAt;
  }
  if (patch.searchConsoleConnected !== undefined) {
    body.search_console_connected = patch.searchConsoleConnected;
  }
  if (patch.indexingApiEnabled !== undefined) {
    body.indexing_api_enabled = patch.indexingApiEnabled;
  }
  if (patch.sitemapUrl !== undefined) body.sitemap_url = patch.sitemapUrl;
  return body;
}

export type ApiDomainRow = Record<string, unknown>;

export function mapDomain(row: ApiDomainRow): DomainRecord {
  return {
    id: str(row.id),
    storeId: str(row.store_id),
    domainName: str(row.domain_name),
    sslStatus: (str(row.ssl_status, 'active') as DomainRecord['sslStatus']),
    dnsVerified: Boolean(row.dns_verified),
    hostingTier: (str(row.hosting_tier, 'Hostinger Shared Business') as DomainRecord['hostingTier']),
    monthlyFee: num(row.monthly_fee, 49),
    paymentReceived: Boolean(row.payment_received),
    status: (str(row.status, 'active') as DomainRecord['status']),
    nameservers: Array.isArray(row.nameservers)
      ? (row.nameservers as string[])
      : ['ns1.dns-parking.com', 'ns2.dns-parking.com'],
    registeredDate: str(row.registered_date, new Date().toISOString().split('T')[0]),
    hostingId: str(row.hosting_id) || undefined,
    databaseId: str(row.database_id) || undefined,
    deploymentStatus: (str(row.deployment_status, 'live') as DomainRecord['deploymentStatus']),
    hostingerPlan: str(row.hostinger_plan) || undefined,
    serverIp: str(row.server_ip, '185.199.108.153'),
    domainType: Boolean(row.is_primary) ? 'custom' : 'demo',
    dnsRecords: Array.isArray(row.dns_records)
      ? (row.dns_records as DomainRecord['dnsRecords'])
      : undefined,
  };
}
