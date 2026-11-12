import type {
  CouponItem,
  Customer,
  CustomerSource,
  CustomerStatus,
  Order,
  PlanType,
  Product,
  ProductConditionalRuleDefinition,
  ProductCustomField,
  ProductOptionDefinition,
  ProductVariation,
  ShippingZone,
  Store,
  StoreSEOConfig,
  DomainRecord,
} from '../types';
import { fromApiPricing } from '../utils/productPricing';

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

  const storeId = str(row.id);
  const ownerRaw = str(row.owner_name ?? row.owner, 'Owner');
  const isCoffeeStore =
    storeId === 'store-coffee' ||
    str(row.slug).includes('coffee') ||
    str(row.slug).includes('hibrew') ||
    /hibrew|هاي\s*برو|قهوة/i.test(rawName);
  const isBlecoStore =
    storeId === 'store-bleco' ||
    str(row.slug).includes('bleco') ||
    str(row.slug).includes('alsaeedi') ||
    str(row.slug).includes('tanjeed') ||
    /سعيدي|بلاكو|bleco|tanjeed/i.test(rawName);

  let ownerAr: string | undefined;
  let ownerEn: string | undefined;
  if (isMakkahStore || storeId === 'store-1') {
    ownerAr = 'متجر هدايا مكة';
    ownerEn = 'Makkah Gifts Store';
  } else if (isCoffeeStore) {
    ownerAr = 'ريان السليمان';
    ownerEn = 'Rayan Al-Sulaiman';
  } else if (isBlecoStore) {
    ownerAr = 'متجر السعيدي لخدمات السيارات';
    ownerEn = 'Al-Saeedi Car Services';
  } else if (row.owner_ar || row.owner_en) {
    ownerAr = row.owner_ar ? str(row.owner_ar) : undefined;
    ownerEn = row.owner_en ? str(row.owner_en) : undefined;
  }

  const domain = str(row.domain);
  const demoDomain = str(row.demo_domain);
  const customDomain = str(row.custom_domain);

  return {
    id: storeId,
    name: isMakkahStore ? 'هدايا مكة' : rawName,
    nameAr,
    nameEn,
    slug: str(row.slug),
    category: str(row.category, 'General'),
    owner: ownerRaw,
    ownerAr,
    ownerEn,
    ownerEmail: str(row.email ?? row.owner_email, ''),
    loginEmailActive:
      row.login_email_active === undefined || row.login_email_active === null
        ? true
        : Boolean(row.login_email_active),
    plan: mapPlan(row.plan),
    masterGrantedPro: Boolean(row.master_granted_pro),
    canvaTemplatesPerCategory:
      row.canva_templates_per_category == null || row.canva_templates_per_category === ''
        ? null
        : num(row.canva_templates_per_category, 5),
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
    // Keep public host from API — Site Kit connect requires a saved domain
    domain: domain || undefined,
    demo_domain: demoDomain || undefined,
    custom_domain: customDomain || undefined,
    phone: str(row.phone) || undefined,
    email: str(row.email) || undefined,
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

function asRecordArray(v: unknown): Record<string, unknown>[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object');
  }
  if (typeof v === 'string' && v.trim()) {
    try {
      return asRecordArray(JSON.parse(v));
    } catch {
      return [];
    }
  }
  return [];
}

function mapCustomFields(raw: unknown): ProductCustomField[] | undefined {
  const rows = asRecordArray(raw);
  if (rows.length === 0) return undefined;
  return rows.map((field, i) => ({
    id: str(field.id, `cf_${i}`),
    name: str(field.name),
    nameAr: field.nameAr == null || field.nameAr === '' ? undefined : str(field.nameAr),
    description: field.description == null || field.description === '' ? undefined : str(field.description),
    imageUrl:
      (field.imageUrl ?? field.image_url) == null || (field.imageUrl ?? field.image_url) === ''
        ? undefined
        : str(field.imageUrl ?? field.image_url),
    videoUrl:
      (field.videoUrl ?? field.video_url) == null || (field.videoUrl ?? field.video_url) === ''
        ? undefined
        : str(field.videoUrl ?? field.video_url),
    contentEn: field.contentEn == null || field.contentEn === '' ? undefined : str(field.contentEn),
    contentAr: field.contentAr == null || field.contentAr === '' ? undefined : str(field.contentAr),
    hidden: Boolean(field.hidden),
    type: field.type == null || field.type === '' ? undefined : str(field.type),
    required: Boolean(field.required),
    conditionalRule:
      field.conditionalRule == null || field.conditionalRule === '' ? undefined : str(field.conditionalRule),
    conditions: asRecordArray(field.conditions).map((rule) => ({
      fieldId: str(rule.fieldId ?? rule.field_id),
      operator: str(rule.operator),
      value: rule.value == null ? undefined : str(rule.value),
    })),
    conditionJoin: field.conditionJoin === 'OR' ? 'OR' : 'AND',
    extraPrice: num(field.extraPrice ?? field.extra_price),
    options: Array.isArray(field.options)
      ? field.options
          .map((opt) => {
            if (typeof opt === 'string') return opt;
            if (opt && typeof opt === 'object') {
              const row = opt as Record<string, unknown>;
              return str(row.label ?? row.value ?? '');
            }
            return '';
          })
          .filter(Boolean)
      : [],
    value: field.value == null || field.value === '' ? undefined : str(field.value),
  }));
}

function mapConditionalRules(raw: unknown): ProductConditionalRuleDefinition[] | undefined {
  const rows = asRecordArray(raw);
  if (rows.length === 0) return undefined;
  return rows.map((rule, i) => {
    const names = rule.targetFieldNames ?? rule.target_field_names;
    return {
      id: str(rule.id, `rule_${i}`),
      optionName: str(rule.optionName ?? rule.option_name),
      operator: str(rule.operator, 'equals'),
      value: str(rule.value),
      action: rule.action === 'hide' ? 'hide' as const : 'show' as const,
      targetFieldNames: Array.isArray(names) ? names.map((name) => String(name)) : [],
    };
  });
}

function mapProductOptions(raw: unknown): ProductOptionDefinition[] | undefined {
  const rows = asRecordArray(raw);
  if (rows.length === 0) return undefined;
  return rows.map((opt, i) => ({
    id: str(opt.id, `opt_${i}`),
    name: str(opt.name),
    nameAr: opt.nameAr == null || opt.nameAr === '' ? undefined : str(opt.nameAr),
    type: opt.type == null ? undefined : str(opt.type),
    visible: opt.visible === undefined ? true : Boolean(opt.visible),
    values: Array.isArray(opt.values) ? (opt.values as ProductOptionDefinition['values']) : [],
  }));
}

function mapVariationRows(raw: unknown): ProductVariation[] | undefined {
  const rows = asRecordArray(raw);
  if (rows.length === 0) return undefined;
  return rows.map((row) => {
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
      id: str(row.id),
      storeId: str(row.store_id ?? row.storeId),
      productId: str(row.product_id ?? row.productId),
      sku: str(row.sku),
      barcode: row.barcode == null || row.barcode === '' ? null : str(row.barcode),
      options,
      price: row.price == null || row.price === '' ? null : num(row.price),
      compareAtPrice:
        (row.compare_at_price ?? row.compareAtPrice) == null ||
        (row.compare_at_price ?? row.compareAtPrice) === ''
          ? null
          : num(row.compare_at_price ?? row.compareAtPrice),
      stock: num(row.stock),
      weight: row.weight == null || row.weight === '' ? null : num(row.weight),
      weightUnit: row.weight_unit == null || row.weight_unit === '' ? 'kg' : str(row.weight_unit),
      lowStockAlert:
        row.low_stock_alert == null || row.low_stock_alert === ''
          ? null
          : num(row.low_stock_alert),
      unlimitedStock: Boolean(row.unlimited_stock ?? row.unlimitedStock ?? false),
      imageUrl:
        (row.image_url ?? row.imageUrl) == null || (row.image_url ?? row.imageUrl) === ''
          ? null
          : str(row.image_url ?? row.imageUrl),
      isActive: (row.is_active ?? row.isActive) === undefined ? true : Boolean(row.is_active ?? row.isActive),
    };
  });
}

export function mapProduct(row: ApiProductRow): Product {
  const statusRaw = str(row.status, 'draft');
  const status: Product['status'] =
    statusRaw === 'published' || statusRaw === 'archived' ? statusRaw : 'draft';

  const original = row.original_price;
  const apiOriginal =
    original === null || original === undefined || original === ''
      ? null
      : num(original);

  // API price = selling; original_price = compare-at → editor regular/sale
  const pricing = fromApiPricing(num(row.price), apiOriginal);

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
    price: pricing.price,
    discountedPrice: pricing.discountedPrice || null,
    originalPrice: pricing.originalPrice,
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
    subtitle: row.subtitle == null || row.subtitle === '' ? null : str(row.subtitle),
    subtitleAr:
      row.subtitle_ar == null || row.subtitle_ar === '' ? null : str(row.subtitle_ar),
    isFeatured: row.is_featured === undefined || row.is_featured === null
      ? Boolean(row.badge === 'featured' || (Array.isArray(row.tags) && row.tags.includes('featured')))
      : Boolean(row.is_featured),
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
    productOptions: mapProductOptions(row.product_options ?? row.productOptions),
    customFields: mapCustomFields(row.custom_fields ?? row.customFields),
    conditionalRules: mapConditionalRules(row.conditional_rules ?? row.conditionalRules),
    variations: mapVariationRows(row.variations),
    brand: row.brand == null || row.brand === '' ? undefined : str(row.brand),
    productType:
      row.product_type == null || row.product_type === ''
        ? row.productType == null || row.productType === ''
          ? undefined
          : str(row.productType)
        : str(row.product_type),
    googleTaxonomy:
      row.google_taxonomy == null || row.google_taxonomy === ''
        ? row.googleTaxonomy == null || row.googleTaxonomy === ''
          ? null
          : str(row.googleTaxonomy)
        : str(row.google_taxonomy),
    salesChannels: asStringArray(row.sales_channels ?? row.salesChannels),
    discountStartAt:
      row.discount_start_at == null || row.discount_start_at === ''
        ? row.discountStartAt == null || row.discountStartAt === ''
          ? null
          : dateSlice(row.discountStartAt)
        : dateSlice(row.discount_start_at),
    discountEndAt:
      row.discount_end_at == null || row.discount_end_at === ''
        ? row.discountEndAt == null || row.discountEndAt === ''
          ? null
          : dateSlice(row.discountEndAt)
        : dateSlice(row.discount_end_at),
    weightKg:
      row.weight_kg === null || row.weight_kg === undefined || row.weight_kg === ''
        ? null
        : num(row.weight_kg),
    shippingMode: (() => {
      const mode = str(row.shipping_mode, '');
      if (mode === 'own_delivery' || mode === 'shipping_company' || mode === 'store_default') {
        return mode;
      }
      return null;
    })(),
    shippingMethodId:
      row.shipping_method_id == null || row.shipping_method_id === ''
        ? null
        : str(row.shipping_method_id),
    deliveryFee:
      row.delivery_fee === null || row.delivery_fee === undefined || row.delivery_fee === ''
        ? null
        : num(row.delivery_fee),
    estimatedDeliveryText:
      row.estimated_delivery_text == null || row.estimated_delivery_text === ''
        ? null
        : str(row.estimated_delivery_text),
    requiresOwnDriver: Boolean(row.requires_own_driver),
    allowOwnDelivery: row.allow_own_delivery === undefined ? true : Boolean(row.allow_own_delivery),
    allowShippingCompany:
      row.allow_shipping_company === undefined ? true : Boolean(row.allow_shipping_company),
    shippingRateMode: (() => {
      const mode = str(row.shipping_rate_mode, '');
      if (mode === 'fixed' || mode === 'per_kg' || mode === 'per_km' || mode === 'zone') return mode;
      return null;
    })(),
    shippingPerKgRate:
      row.shipping_per_kg_rate === null || row.shipping_per_kg_rate === undefined || row.shipping_per_kg_rate === ''
        ? null
        : num(row.shipping_per_kg_rate),
    shippingPerKmRate:
      row.shipping_per_km_rate === null || row.shipping_per_km_rate === undefined || row.shipping_per_km_rate === ''
        ? null
        : num(row.shipping_per_km_rate),
    shippingPaymentOptions: Array.isArray(row.shipping_payment_options)
      ? row.shipping_payment_options
      : null,
  };
}

const ORDER_SOURCES: Order['source'][] = [
  'WhatsApp',
  'Instagram',
  'Google Ads',
  'Facebook',
  'Snapchat',
  'TikTok',
  'Direct',
  'Website',
  'X',
  'Telegram',
  'YouTube',
  'Organic Search',
  'Referral',
  'Other',
];

const PAYMENT_METHODS: Order['paymentMethod'][] = [
  'Mada',
  'Visa',
  'Visa/MC',
  'Apple Pay',
  'PayPal',
  'Google Pay',
  'Samsung Pay',
  'Customer Wallet',
  'MIS Pay',
  'Madfoat',
  'COD',
  'stc pay',
  'Tabby',
  'Tamara',
  'Bank Transfer',
];

function mapOrderSource(v: unknown): Order['source'] {
  const s = str(v, 'Direct');
  const exact = ORDER_SOURCES.find((x) => x.toLowerCase() === s.toLowerCase());
  if (exact) return exact as Order['source'];
  const lower = s.toLowerCase();
  if (lower.includes('tiktok')) return 'TikTok';
  if (lower.includes('snap')) return 'Snapchat';
  if (lower.includes('instagram')) return 'Instagram';
  if (lower.includes('whatsapp')) return 'WhatsApp';
  if (lower.includes('facebook')) return 'Facebook';
  if (lower.includes('youtube')) return 'YouTube';
  if (lower.includes('telegram')) return 'Telegram';
  if (lower === 'x' || lower.includes('twitter')) return 'X';
  if (lower.includes('website') || lower.includes('موقع')) return 'Website';
  if (lower.includes('organic') || lower.includes('بحث')) return 'Organic Search';
  if (lower.includes('google')) return 'Google Ads';
  if (lower.includes('referral') || lower.includes('إحالة')) return 'Referral';
  if (lower.includes('other') || lower.includes('أخرى')) return 'Other';
  return 'Direct';
}

function mapPaymentMethod(v: unknown): Order['paymentMethod'] {
  const s = str(v, 'COD');
  const lower = s.toLowerCase();
  if (lower.includes('mada')) return 'Mada';
  if (lower.includes('samsung')) return 'Samsung Pay';
  if (lower.includes('apple')) return 'Apple Pay';
  if (lower.includes('google')) return 'Google Pay';
  if (lower.includes('paypal')) return 'PayPal';
  if (lower.includes('wallet') || lower.includes('محفظ')) return 'Customer Wallet';
  if (lower.includes('mis')) return 'MIS Pay';
  if (lower.includes('madfoat') || lower.includes('madfooat')) return 'Madfoat';
  if (lower.includes('stc')) return 'stc pay';
  if (lower.includes('visa') || lower.includes('master') || lower === 'visa/mc') return 'Visa';
  if (lower.includes('tabby')) return 'Tabby';
  if (lower.includes('tamara')) return 'Tamara';
  if (lower.includes('bank') || lower.includes('transfer') || lower === 'bank_transfer') {
    return 'Bank Transfer';
  }
  if (lower.includes('cash') || lower.includes('cod')) return 'COD';
  return (
    PAYMENT_METHODS.find((x) => x.toLowerCase() === lower) ?? 'COD'
  );
}

function mapOrderStatus(v: unknown): Order['status'] {
  const s = str(v, 'pending').toLowerCase().replace(/[\s-]+/g, '_');
  const validStatuses: Order['status'][] = [
    'draft',
    'deleted',
    'pending',
    'partially_paid',
    'pending_review',
    'processing',
    'preparing',
    'shipped',
    'out_for_delivery',
    'delivered',
    'completed',
    'cancellation_requested',
    'cancelled',
    'returned',
    'return_in_progress',
    'rfq',
    'refunded',
  ];
  if (s === 'awaiting_payment' || s === 'pending_payment') return 'pending';
  if (s === 'under_review') return 'pending_review';
  if (s === 'canceled') return 'cancelled';
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
    customerEmail: row.customer_email != null && str(row.customer_email) ? str(row.customer_email) : undefined,
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
    transactionId: rowAny.payment_transaction_id
      ? String(rowAny.payment_transaction_id)
      : undefined,
    shippingStatus: rowAny.shipping_status ? String(rowAny.shipping_status) as any : undefined,
    trackingNumber: rowAny.tracking_number ? String(rowAny.tracking_number) : undefined,
    shippingCompany: rowAny.courier_code ? String(rowAny.courier_code) : undefined,
    shippingAddress: str(row.delivery_location, '') || undefined,
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
    deliveryMode: rowAny.delivery_mode != null ? String(rowAny.delivery_mode) : undefined,
    driverId: rowAny.driver_id != null ? String(rowAny.driver_id) : undefined,
    bankAccountId: rowAny.bank_account_id != null ? String(rowAny.bank_account_id) : undefined,
    paymentPlan: rowAny.payment_plan != null ? String(rowAny.payment_plan) : undefined,
    amountPaid: rowAny.amount_paid != null ? num(rowAny.amount_paid) : undefined,
    remainingBalance: rowAny.remaining_balance != null ? num(rowAny.remaining_balance) : undefined,
    subtotal: rowAny.subtotal != null ? num(rowAny.subtotal) : undefined,
    discountAmount: rowAny.discount_amount != null ? num(rowAny.discount_amount) : undefined,
    shippingFee: rowAny.shipping_cost != null ? num(rowAny.shipping_cost) : (rowAny.shipping_fee != null ? num(rowAny.shipping_fee) : undefined),
    tax: rowAny.tax != null ? num(rowAny.tax) : (rowAny.vat != null ? num(rowAny.vat) : undefined),
    isArchived: rowAny.is_archived === true || rowAny.is_archived === 1 || rowAny.is_archived === '1',
    archivedAt: rowAny.archived_at != null ? String(rowAny.archived_at) : undefined,
  };
}

/** Map dashboard Order patch (camelCase) to Laravel PATCH /orders/{id} body. */
export function orderPatchToApi(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const src = patch;

  const assign = (camel: string, snake: string) => {
    if (src[camel] !== undefined) out[snake] = src[camel];
    else if (src[snake] !== undefined) out[snake] = src[snake];
  };

  assign('status', 'status');
  assign('customerName', 'customer_name');
  assign('customerPhone', 'customer_phone');
  assign('customerEmail', 'customer_email');
  assign('deliveryLocation', 'delivery_location');
  if (src.shippingAddress !== undefined && out.delivery_location === undefined) {
    out.delivery_location = src.shippingAddress;
  } else if (src.shipping_address !== undefined && out.delivery_location === undefined) {
    out.delivery_location = src.shipping_address;
  }
  assign('trackingNumber', 'tracking_number');
  assign('shippingStatus', 'shipping_status');
  if (src.shippingCompany !== undefined) out.courier_code = src.shippingCompany;
  else if (src.shipping_company !== undefined) out.courier_code = src.shipping_company;
  else if (src.courier_code !== undefined) out.courier_code = src.courier_code;
  if (src.paymentStatus !== undefined) out.payment_status = src.paymentStatus;
  else if (src.payment_status !== undefined) out.payment_status = src.payment_status;
  assign('paymentMethod', 'payment_method');
  assign('transactionId', 'payment_transaction_id');
  assign('codStatus', 'cod_status');
  assign('codNotes', 'cod_notes');
  assign('refundStatus', 'refund_status');
  assign('refundAmount', 'refund_amount');
  assign('returnReason', 'return_reason');
  assign('returnNotes', 'return_notes');
  // Delete / cancel reason from UI → persist on order before hard delete
  if (src.cancelReason !== undefined) out.return_reason = src.cancelReason;
  else if (src.cancel_reason !== undefined) out.return_reason = src.cancel_reason;
  if (src.adminNotes !== undefined) out.return_notes = src.adminNotes;
  else if (src.admin_notes !== undefined) out.return_notes = src.admin_notes;
  assign('deliveryMode', 'delivery_mode');
  assign('driverId', 'driver_id');
  assign('bankAccountId', 'bank_account_id');
  assign('paymentPlan', 'payment_plan');
  assign('amountPaid', 'amount_paid');
  assign('remainingBalance', 'remaining_balance');
  assign('isArchived', 'is_archived');
  assign('archivedAt', 'archived_at');
  if (src.restock !== undefined) out.restock = src.restock;

  return out;
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
  'Google',
  'Website',
  'X',
  'Telegram',
  'YouTube',
  'Organic Search',
  'Other',
];

function mapCustomerSource(v: unknown): CustomerSource {
  const s = str(v, 'Direct').trim();
  const lower = s.toLowerCase();
  const exact = CUSTOMER_SOURCES.find((x) => x.toLowerCase() === lower);
  if (exact) return exact;
  if (lower === 'twitter' || lower === 'x (twitter)') return 'X';
  if (lower.includes('organic')) return 'Organic Search';
  if (lower === 'walk-in' || lower === 'walk in') return 'Direct';
  return 'Other';
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
  const s = str(v, 'Regular').trim();
  // Preserve merchant-defined custom group names (not only VIP/Regular/Wholesale).
  return s || 'Regular';
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
    city: str(row.city, ''),
    country: str(row.country, 'Saudi Arabia'),
    gender: mapGender(row.gender),
    dob: row.dob != null && str(row.dob) !== '' ? dateSlice(row.dob) : undefined,
    source: mapCustomerSource(row.acquisition_source ?? row.source),
    group: mapGroup(row.group),
    totalOrders,
    totalSpending: totalSpend,
    avgOrderValue: avg,
    registeredDate: dateSlice(row.created_at ?? row.registered_date),
    lastOrderDate: row.last_order_date
      ? dateSlice(row.last_order_date)
      : '—',
    lastLogin:
      row.last_login != null
        ? str(row.last_login)
        : row.last_login_at != null
          ? str(row.last_login_at)
          : undefined,
  };
}

export function mapCoupon(row: ApiCouponRow): CouponItem {
  const discountType =
    str(row.discount_type, 'percentage') === 'fixed' ? 'fixed' : 'percentage';
  const statusRaw = str(row.status, 'active');
  const status: CouponItem['status'] =
    statusRaw === 'expired' || statusRaw === 'scheduled' ? statusRaw : 'active';
  const isActive =
    row.is_active === undefined ? status === 'active' : Boolean(row.is_active);

  const designRaw = str(row.design_type, 'solid_color');
  const designType: CouponItem['designType'] =
    designRaw === 'image_based' || designRaw === 'image_only'
      ? designRaw
      : 'solid_color';

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
    isActive,
    designType,
    couponColor: row.design_color ? str(row.design_color) : undefined,
    imageUrl: row.design_image_url ? str(row.design_image_url) : undefined,
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
    metaTitleEn: extra.meta_title_en == null ? null : str(extra.meta_title_en),
    metaTitleAr: extra.meta_title_ar == null ? null : str(extra.meta_title_ar),
    metaDescription: str(row.meta_description),
    metaDescriptionEn: extra.meta_description_en == null ? null : str(extra.meta_description_en),
    metaDescriptionAr: extra.meta_description_ar == null ? null : str(extra.meta_description_ar),
    keywords: parseKeywords(row.keywords),
    keywordsEn: extra.keywords_en == null ? null : str(extra.keywords_en),
    keywordsAr: extra.keywords_ar == null ? null : str(extra.keywords_ar),
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
  if (patch.metaTitleEn !== undefined) body.meta_title_en = patch.metaTitleEn;
  if (patch.metaTitleAr !== undefined) body.meta_title_ar = patch.metaTitleAr;
  if (patch.metaDescription !== undefined) {
    body.meta_description = patch.metaDescription;
  }
  if (patch.metaDescriptionEn !== undefined) body.meta_description_en = patch.metaDescriptionEn;
  if (patch.metaDescriptionAr !== undefined) body.meta_description_ar = patch.metaDescriptionAr;
  if (patch.keywords !== undefined) {
    body.keywords = Array.isArray(patch.keywords)
      ? patch.keywords.join(', ')
      : patch.keywords;
  }
  if (patch.keywordsEn !== undefined) body.keywords_en = patch.keywordsEn;
  if (patch.keywordsAr !== undefined) body.keywords_ar = patch.keywordsAr;
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
