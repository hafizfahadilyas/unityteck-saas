export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'support'
  | 'sales'
  | 'marketing'
  | 'seo'
  | 'content'
  | 'developer'
  | 'viewer'
  /** @deprecated Phase-1 aliases — normalize via auth/roles */
  | 'master_admin'
  | 'store_manager'
  | 'store_staff';

export type PlanType = 'free' | 'paid' | 'pro' | 'custom';

export interface StoreLanguagesConfig {
  english: boolean;
  arabic: boolean;
}

export interface Store {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  slug: string;
  category: string;
  categoryAr?: string;
  categoryEn?: string;
  owner: string;
  ownerAr?: string;
  ownerEn?: string;
  ownerEmail: string;
  plan: PlanType;
  masterGrantedPro: boolean;
  status: 'active' | 'pending' | 'suspended';
  productsCount: number;
  ordersCount: number;
  revenue: number;
  visitorsCount: number;
  lastActivity: string;
  logo: string;
  accentColor: string;
  dbIsolation: 'shared_store_id' | 'dedicated_mysql';
  createdAt: string;
  /** Language Availability Configuration (Controlled by Super Admin) */
  languages?: StoreLanguagesConfig;
  /** Phase 2.5 — store defaults from onboarding */
  currency?: 'SAR' | 'USD' | 'AED' | 'EUR';
  locale?: 'en' | 'ar';
  textDirection?: 'ltr' | 'rtl';
  timezone?: string;
  /** Shared Hosting & Domain Flow (Strict Shared Hosting Only) */
  hosting_id?: string;
  domain?: string;
  database_id?: string;
  ssl_status?: 'active' | 'issuing' | 'expired' | 'pending';
  deployment_status?: 'live' | 'deploying' | 'pending' | 'failed';
  subscription_status?: 'active' | 'trial' | 'grace' | 'cancelled' | 'pending';
  demo_domain?: string;
  custom_domain?: string;
  hostinger_status?: 'not_connected' | 'connected' | 'provisioning' | 'active';
  dns_status?: 'unverified' | 'pending' | 'verified';
}

export type CustomerStatus = 'VIP' | 'Active' | 'New' | 'Inactive' | 'Cancelled';

export type CustomerSource = 
  | 'Instagram' 
  | 'Google Ads' 
  | 'WhatsApp' 
  | 'Facebook' 
  | 'Snapchat' 
  | 'Direct' 
  | 'TikTok' 
  | 'Referral' 
  | 'Other';

export interface Customer {
  id: string;
  storeId: string;
  name: string;
  nameAr?: string;
  phone: string;
  email: string;
  avatar?: string;
  status: CustomerStatus;
  city: string;
  cityAr?: string;
  country: string;
  gender: 'Male' | 'Female' | 'Other';
  source: CustomerSource;
  group: 'VIP' | 'Regular' | 'Wholesale';
  totalOrders: number;
  totalSpending: number;
  avgOrderValue: number;
  registeredDate: string;
  lastOrderDate: string;
}

export interface ChannelPerformance {
  id: string;
  storeId: string;
  channelName: string;
  channelType: 'Paid Search' | 'Organic' | 'Social Media' | 'Direct' | 'Referral' | 'AI Traffic';
  icon: string;
  visits: number;
  addToCart: number;
  completedOrders: number;
  conversionRate: number; // percentage e.g. 4.4
  revenue: number; // SAR
  roas: number | null; // e.g. 4.5 or null for organic
  trendSparkline: number[];
  trendChange: number; // percentage e.g. +12 or -4
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  nameAr?: string;
  sku: string;
  category: string;
  price: number;
  originalPrice?: number | null;
  discountedPrice?: number | null;
  costPrice?: number | null;
  taxRate?: number;
  /** Shipping weight in kilograms (premium kg-wise delivery) */
  weightKg?: number | null;
  stock: number;
  status: 'published' | 'draft' | 'archived';
  isActive?: boolean;
  isStale: boolean;
  publishedAt: string;
  image: string;
  imageVersion?: string | null;
  galleryUrls?: string[];
  videoUrl?: string | null;
  tags?: string[];
  description?: string | null;
  descriptionAr?: string | null;
  subtitle?: string | null;
  subtitleAr?: string | null;
  productType?: string;
  brand?: string;
  countryOfOrigin?: string;
  requiresShipping?: boolean;
  trackInventory?: boolean;
  salesCount?: number;
  customUrl?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
}

/** Per-product variant: size/color/weight/material/custom + price/SKU/stock/image */
export interface ProductVariation {
  id: string;
  storeId: string;
  productId: string;
  sku: string;
  options: Record<string, string>;
  price: number | null;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
}

/** Store-scoped category / subcategory */
export interface StoreCategory {
  id: string;
  storeId: string;
  parentId: string | null;
  name: string;
  nameAr: string | null;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
}

export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'completed' 
  | 'cancellation_requested'
  | 'cancelled' 
  | 'returned';

export type OrderSource =
  | 'Instagram'
  | 'Google Ads'
  | 'Direct'
  | 'TikTok'
  | 'Snapchat'
  | 'Organic Search'
  | 'AI Assistant'
  | 'Referral'
  | 'WhatsApp'
  | 'Facebook'
  | string;

export type PaymentMethod =
  | 'mada'
  | 'Apple Pay'
  | 'Credit Card'
  | 'stc pay'
  | 'Visa'
  | 'Cash on Delivery'
  | 'Mada'
  | 'Visa/MC'
  | 'COD'
  | string;

export interface OrderItemDetail {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
}

export interface OrderTimelineItem {
  id?: string;
  date: string;
  time: string;
  title: string;
  description: string;
  status: OrderStatus;
}

export interface Order {
  id: string;
  storeId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAvatar?: string;
  customerSince?: string;
  customerType?: 'Returning Customer' | 'New Customer' | 'VIP';
  itemsCount: number;
  itemsSummary?: string;
  items?: OrderItemDetail[];
  subtotal?: number;
  discountCode?: string;
  discountAmount?: number;
  shippingFee?: number;
  tax?: number;
  total: number;
  source: OrderSource;
  sourceDetails?: string;
  deliveryLocation: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  transactionId?: string;
  paymentDate?: string;
  date: string;
  time?: string;
  shippingCompany?: string;
  shippingCompanyLogo?: string;
  trackingNumber?: string;
  shippingStatus?: 'Delivered' | 'Shipped' | 'In Transit' | 'Out for Delivery' | 'Pending';
  shippingAddress?: string;
  customerNotes?: string;
  internalNotes?: string;
  timeline?: OrderTimelineItem[];
  medium?: string;
  campaign?: string;
  utmTerm?: string;
  utmContent?: string;
  cancelReason?: string;
  cancelRequestedAt?: string;
  refundStatus?: 'none' | 'pending' | 'approved' | 'refunded' | 'rejected';
  refundAmount?: number;
}

export interface ActivityItem {
  id: string;
  storeId?: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  type: 'store' | 'order' | 'product' | 'customer' | 'payment' | 'promotion' | 'theme' | 'blog';
}

export interface PlatformMetrics {
  totalStores: number;
  activeStores: number;
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  totalVisitors: number;
  totalSales: number;
  pendingOrders: number;
  activePromotions: number;
  growth: {
    stores: number;
    activeStores: number;
    products: number;
    orders: number;
    customers: number;
    revenue: number;
    visitors: number;
    sales: number;
    pendingOrders: number;
    promotions: number;
  };
}

export interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT';
  host: string;
  value: string;
  ttl?: number;
  status: 'verified' | 'pending';
}

export interface DomainRecord {
  id: string;
  storeId: string;
  domainName: string;
  sslStatus: 'active' | 'issuing' | 'expired' | 'pending';
  dnsVerified: boolean;
  hostingTier: 'Hostinger Shared Starter' | 'Hostinger Shared Premium' | 'Hostinger Shared Business' | 'Starter Shared' | 'Premium Shared' | 'Business Shared' | 'Pro Cloud' | 'Enterprise Dedicated';
  monthlyFee: number;
  paymentReceived: boolean;
  status: 'active' | 'pending_payment' | 'dns_propagation' | 'suspended' | 'live';
  nameservers: string[];
  registeredDate: string;
  hostingId?: string;
  databaseId?: string;
  deploymentStatus?: 'live' | 'deploying' | 'pending' | 'failed';
  hostingerPlan?: string;
  serverIp?: string;
  domainType?: 'demo' | 'custom';
  dnsRecords?: DnsRecord[];
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  userName?: string;
  adminId?: string;
  adminName?: string;
  storeId?: string;
  action: string;
  timestamp: string;
  affectedResource?: string;
  resource?: string;
  ipAddress?: string;
  status: 'success' | 'warning' | 'failed';
  details?: string;
}

export interface UpdateRelease {
  id: string;
  version: string;
  title: string;
  type: 'core' | 'theme' | 'plugin' | 'security';
  description: string;
  releasedAt: string;
  status: 'approved' | 'staged' | 'rolled_back';
  scope: 'all_stores' | 'selected_stores';
  deployedStoreIds: string[]; // e.g. ['store-1'] vs ['store-2']
  requiresMasterApproval: boolean;
  criticalSeverity?: boolean;
}

export interface ThemeItem {
  id: string;
  name: string;
  category: 'General' | 'Ramadan' | 'Eid' | 'Seasonal' | 'Luxury' | 'Minimal';
  tagline: string;
  previewColor: string;
  /** Optional Unsplash thumbnail preview image */
  thumbnail?: string;
  badge?: string;
  homepageStyles: string[];
  /** basic = Free/Paid default pack; full = Pro premium catalog */
  tier: 'basic' | 'full';
  activeStoresCount: number;
  isDefault?: boolean;
  rating: number;
}

export interface PluginItem {
  id: string;
  name: string;
  category: 'Payments' | 'Shipping' | 'Marketing' | 'Customer Support' | 'Compliance';
  description: string;
  icon: string;
  monthlyFee: number; // 0 for free
  isProOnly: boolean;
  rating: number;
  installedCount: number;
  provider: string;
  status: 'installed' | 'available' | 'coming_soon';
}

export interface CouponItem {
  id: string;
  storeId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  usageCount: number;
  maxUsage: number;
  status: 'active' | 'expired' | 'scheduled';
  validUntil: string;
}

export interface ShippingZone {
  id: string;
  storeId: string;
  cityName: string;
  /** Region / province (region-wise delivery) */
  province: string;
  region?: string;
  rate: number;
  /** Extra SAR per kg above base (kg-wise delivery) */
  ratePerKg?: number;
  /** Allowed parcel weight range (kg) */
  minWeightKg?: number;
  maxWeightKg?: number;
  freeShippingAbove: number;
  estimatedDelivery: string;
  status: 'active' | 'inactive';
}

export type ShippingRate = ShippingZone;

export interface PlatformBlog {
  id: string;
  title: string;
  category: string;
  readTime: string;
  views: number;
  publishedAt: string;
  author: string;
  summary: string;
}

export interface StoreSEOConfig {
  storeId: string;
  googleConnected: boolean;
  googleAccountEmail: string | null;
  connectedAt: string | null;
  ga4MeasurementId: string; // e.g. G-XXXXXXXX
  gtmContainerId: string; // e.g. GTM-XXXXXXX
  googleAdsConversionId?: string; // e.g. AW-XXXXXXXX
  searchConsoleConnected: boolean;
  searchConsoleVerificationTag: string; // e.g. google-site-verification=...
  indexingApiEnabled: boolean;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  sitemapUrl: string;
  indexedUrlsCount: number;
  totalSearchClicks: number;
  totalSearchImpressions: number;
  avgCtr: number;
  avgPosition: number;
  lastIndexingPing: string;
  submittedUrls: { url: string; submittedAt: string; status: 'indexed' | 'pending' | 'crawling' }[];
  topQueries: { query: string; clicks: number; impressions: number; position: number }[];
}

export type ShippingMethodType =
  | 'free'
  | 'flat_rate'
  | 'zone_based'
  | 'weight_based'
  | 'value_based'
  | 'same_day'
  | 'scheduled'
  | 'local_pickup'
  | 'cod';

export interface ShippingMethodItem {
  id: string;
  storeId: string;
  name: string;
  nameAr?: string;
  type: ShippingMethodType;
  baseRate: number;
  perKgRate?: number;
  minOrderAmount?: number;
  freeShippingThreshold?: number | null;
  estimatedDelivery: string;
  isCodAllowed: boolean;
  codFee?: number;
  courierCode?: string | null;
  isActive: boolean;
  sortOrder?: number;
  description?: string;
}

export type CourierProviderCode = 'spl' | 'aramex' | 'smsa' | 'dhl' | 'fedex' | 'ups';

export interface CourierConnectionItem {
  id: string;
  storeId: string;
  provider: CourierProviderCode;
  accountName: string;
  accountNumber?: string;
  maskedApiKey: string;
  isSandbox: boolean;
  isConnected: boolean;
  status: 'connected' | 'disconnected' | 'error';
  settings?: Record<string, unknown>;
  lastTestedAt?: string;
  lastSyncAt?: string;
}

export interface ShipmentItem {
  id: string;
  storeId: string;
  orderId: string;
  courierId?: string;
  provider: string;
  awbNumber: string;
  trackingNumber: string;
  labelUrl?: string;
  status: 'pending' | 'created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled' | 'returned';
  shippingCost: number;
  codAmount: number;
  pickupRequestedAt?: string;
  deliveredAt?: string;
  destinationAddress?: { location?: string; city?: string };
  trackingEvents?: { time: string; status: string; description: string; location?: string }[];
}

export type PaymentGatewayProvider = 'moyasar' | 'tap' | 'hyperpay' | 'stripe' | 'paypal' | 'cod';

export interface PaymentGatewayItem {
  id: string;
  storeId: string;
  provider: PaymentGatewayProvider;
  title: string;
  titleAr?: string;
  isEnabled: boolean;
  isSandbox: boolean;
  publicKey?: string;
  maskedSecretKey?: string;
  supportedMethods: string[];
  transactionFeePercent: number;
  transactionFeeFixed: number;
  status: 'connected' | 'disconnected' | 'error';
  webhookUrl?: string;
  lastTestedAt?: string;
}

export interface PaymentTransactionItem {
  id: string;
  storeId: string;
  orderId?: string;
  gatewayProvider: string;
  paymentMethod: string;
  transactionReference: string;
  gatewayTransactionId?: string;
  amount: number;
  currency: string;
  feeAmount: number;
  netAmount: number;
  status: 'pending' | 'authorized' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  cardBrand?: string;
  cardLastFour?: string;
  payerName?: string;
  payerEmail?: string;
  createdAt: string;
}

export interface PaymentAnalyticsReport {
  kpis: {
    total_transactions: number;
    successful_payments: number;
    failed_payments: number;
    pending_payments: number;
    refunds: number;
    total_volume: number;
    total_fees: number;
    net_volume: number;
    conversion_rate: string;
    digital_payment_percent: string;
  };
  methods_breakdown: { name: string; orders: number; sales: number; fee: number; share: string }[];
  gateways_breakdown: { name: string; orders: number; sales: number; fee: number; share: string }[];
}

export interface ShippingAnalyticsReport {
  kpis: {
    total_shipments: number;
    delivered: number;
    in_transit: number;
    pending: number;
    failed: number;
    cancelled: number;
    returned: number;
    cod_shipments: number;
    total_shipping_cost: number;
    on_time_delivery_rate: string;
    avg_delivery_time: string;
  };
  carrier_performance: { name: string; orders: number; cost: number; avgDays: string; onTime: string }[];
  zones_performance: { zone: string; orders: number; shipping_cost: number }[];
}

export * from './media';
