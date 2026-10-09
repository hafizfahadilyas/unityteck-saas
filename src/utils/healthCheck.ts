/**
 * Real Health Check, Missing Config Diagnostics & Automated Alert Engine.
 * Single Source of Truth for Master Admin & Store Dashboard status.
 */

import type {
  Store,
  StoreSEOConfig,
  PaymentGatewayItem,
  CourierConnectionItem,
  ShippingZone,
  Product,
  Order,
} from '../types';

export type AlertSeverity = 'critical' | 'action_required' | 'warning' | 'healthy';

export type HealthCategory =
  | 'google'
  | 'seo'
  | 'payment'
  | 'shipping'
  | 'catalog'
  | 'subscription'
  | 'system';

export interface HealthIssue {
  id: string;
  storeId: string;
  storeName: string;
  category: HealthCategory;
  severity: AlertSeverity;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  requiredInfo: string;
  requiredInfoAr: string;
  targetTab: string;
  targetSubTab?: string;
  canAutoFix: boolean;
  impact: string;
  impactAr: string;
}

export interface StoreHealthReport {
  storeId: string;
  storeName: string;
  status: AlertSeverity;
  score: number; // 0 to 100
  criticalCount: number;
  actionRequiredCount: number;
  warningCount: number;
  healthyCount: number;
  issues: HealthIssue[];
  checks: {
    googleOAuth: boolean;
    googleAnalytics: boolean;
    googleSearchConsole: boolean;
    googleTagManager: boolean;
    googleAds: boolean;
    seoMeta: boolean;
    sitemap: boolean;
    paymentsConfigured: boolean;
    shippingConfigured: boolean;
    courierConnected: boolean;
    catalogActive: boolean;
    storeActive: boolean;
  };
}

export interface PlatformHealthSummary {
  overallStatus: AlertSeverity;
  overallScore: number;
  totalStores: number;
  healthyStoresCount: number;
  actionRequiredStoresCount: number;
  criticalStoresCount: number;
  warningStoresCount: number;
  totalCriticalIssues: number;
  totalActionRequiredIssues: number;
  totalWarnings: number;
  storeReports: Record<string, StoreHealthReport>;
  allIssues: HealthIssue[];
}

/** Audit a single store against real configuration and data */
export function auditStoreHealth(params: {
  store: Store;
  seoConfig?: StoreSEOConfig;
  paymentGateways?: PaymentGatewayItem[];
  couriers?: CourierConnectionItem[];
  shippingZones?: ShippingZone[];
  products?: Product[];
  orders?: Order[];
}): StoreHealthReport {
  const {
    store,
    seoConfig,
    paymentGateways = [],
    couriers = [],
    shippingZones = [],
    products = [],
    orders = [],
  } = params;

  const issues: HealthIssue[] = [];
  const storeId = store.id;
  const storeName = store.name || 'Store';

  // 1. Subscription & Store Status
  let storeActive = true;
  if (store.status === 'suspended') {
    storeActive = false;
    issues.push({
      id: `${storeId}-store-suspended`,
      storeId,
      storeName,
      category: 'subscription',
      severity: 'critical',
      title: 'Store is Suspended',
      titleAr: 'المتجر معطل وموقوف حالياً',
      description: 'The store has been suspended and is inaccessible to public visitors and checkout.',
      descriptionAr: 'تم تعليق المتجر وهو غير متاح حالياً للزوار وإتمام الطلبات.',
      requiredInfo: 'Reactivate the store from Master Admin or update the subscription plan.',
      requiredInfoAr: 'يرجى إعادة تفعيل المتجر من لوحة التحكم الرئيسية أو ترقية الباقة.',
      targetTab: 'settings',
      canAutoFix: false,
      impact: 'Complete downtime for storefront & checkouts',
      impactAr: 'توقف تام لمتجر العميل وتوقف عمليات الشراء',
    });
  }

  // 2. Google OAuth Integration Check
  const isGoogleConnected = Boolean(seoConfig?.googleConnected);
  if (!isGoogleConnected) {
    issues.push({
      id: `${storeId}-google-oauth-missing`,
      storeId,
      storeName,
      category: 'google',
      severity: 'action_required',
      title: 'Google Account Not Connected',
      titleAr: 'حساب Google غير متصل',
      description: 'Google OAuth account is not connected. Direct real-time sync with Google Cloud services is inactive.',
      descriptionAr: 'لم يتم ربط حساب Google الرئيسي للمتجر بعد. المزامنة المباشرة مع خدمات Google Cloud معطلة.',
      requiredInfo: 'Connect the merchant Google Workspace / Gmail account to authenticate API access.',
      requiredInfoAr: 'يرجى ربط حساب Google الخاص بتاجر المتجر لاعتماد صلاحيات الوصول للـ API.',
      targetTab: 'seo',
      targetSubTab: 'google-suite',
      canAutoFix: false,
      impact: 'Live GA4, Search Console and Google Indexing APIs cannot query real data.',
      impactAr: 'تعذر جلب البيانات الحقيقية من تحليلات Google وSearch Console وخدمات الفهرسة.',
    });
  }

  // 3. Google Analytics 4 (GA4) Check
  const hasGa4 = Boolean(
    seoConfig?.ga4MeasurementId &&
      seoConfig.ga4MeasurementId.trim() !== '' &&
      seoConfig.ga4MeasurementId.startsWith('G-')
  );
  if (!hasGa4) {
    issues.push({
      id: `${storeId}-ga4-missing`,
      storeId,
      storeName,
      category: 'google',
      severity: 'action_required',
      title: 'GA4 Measurement ID Missing',
      titleAr: 'معرف قياس Google Analytics 4 مفقود',
      description: 'Google Analytics 4 Measurement ID (G-XXXXXXXXXX) is not configured.',
      descriptionAr: 'لم يتم إدخال معرف القياس الخاص بـ Google Analytics 4 (G-XXXXXXXXXX).',
      requiredInfo: 'Provide a valid GA4 Measurement ID in Google Integration settings.',
      requiredInfoAr: 'يرجى إدخال معرف قياس GA4 صالح في إعدادات ربط Google.',
      targetTab: 'seo',
      targetSubTab: 'google-suite',
      canAutoFix: false,
      impact: 'Visitor telemetry, live conversion funnel & real session tracking will remain offline.',
      impactAr: 'توقف تتبع حركة الزوار ومسار التحويلات والجلسات الحية.',
    });
  }

  // 4. Google Tag Manager (GTM) Check
  const hasGtm = Boolean(
    seoConfig?.gtmContainerId &&
      seoConfig.gtmContainerId.trim() !== '' &&
      seoConfig.gtmContainerId.startsWith('GTM-')
  );
  if (!hasGtm) {
    issues.push({
      id: `${storeId}-gtm-missing`,
      storeId,
      storeName,
      category: 'google',
      severity: 'warning',
      title: 'Google Tag Manager Container Not Configured',
      titleAr: 'حاوية Google Tag Manager غير مهيأة',
      description: 'GTM Container ID (GTM-XXXXXXX) is not set. Custom pixel events and marketing tags will not inject automatically.',
      descriptionAr: 'لم يتم تعيين معرف حاوية GTM (GTM-XXXXXXX). لن يتم حقن بكسلات التتبع التسويقية تلقائياً.',
      requiredInfo: 'Enter your GTM Container ID in Google Integration settings.',
      requiredInfoAr: 'يرجى إدخال معرف الحاوية GTM في إعدادات الربط.',
      targetTab: 'seo',
      targetSubTab: 'google-suite',
      canAutoFix: false,
      impact: 'Conversion pixels (Snap, TikTok, Meta, Google) must be added manually.',
      impactAr: 'سيتعين حقن بكسلات الإعلانات يدوياً دون إدارة الحاويات المركزية.',
    });
  }

  // 5. Google Search Console Check
  const hasGsc = Boolean(
    seoConfig?.searchConsoleConnected ||
      (seoConfig?.searchConsoleVerificationTag &&
        seoConfig.searchConsoleVerificationTag.trim() !== '')
  );
  if (!hasGsc) {
    issues.push({
      id: `${storeId}-gsc-missing`,
      storeId,
      storeName,
      category: 'seo',
      severity: 'action_required',
      title: 'Google Search Console Verification Missing',
      titleAr: 'توثيق ملكية Google Search Console غير مكتمل',
      description: 'Search Console property is not verified. Organic impressions, keywords, and crawling stats cannot be retrieved.',
      descriptionAr: 'ملكية الموقع غير موثقة في Search Console. لا يمكن جلب الكلمات المفتاحية ومرات الظهور وسجلات الزحف.',
      requiredInfo: 'Add your Google HTML verification meta tag or connect your verified domain in SEO settings.',
      requiredInfoAr: 'يرجى إضافة وسم التحقق HTML أو ربط الدومين الموثق في إعدادات SEO.',
      targetTab: 'seo',
      targetSubTab: 'search-console',
      canAutoFix: false,
      impact: 'Search queries, organic rankings and indexing health unavailable.',
      impactAr: 'تعذر رصد الكلمات المفتاحية ومراتب البحث وفهرسة الروابط.',
    });
  }

  // 6. Payment Gateways Check
  const enabledGateways = paymentGateways.filter((g) => g.isEnabled);
  const paymentsConfigured = enabledGateways.length > 0;
  if (!paymentsConfigured) {
    issues.push({
      id: `${storeId}-no-payment-gateways`,
      storeId,
      storeName,
      category: 'payment',
      severity: 'critical',
      title: 'No Payment Gateways Active',
      titleAr: 'لا توجد بوابات دفع مفعلة',
      description: 'The store does not have any active payment methods enabled (Mada, Apple Pay, Credit Card, or Cash on Delivery).',
      descriptionAr: 'لا توجد أي طريقة دفع مفعلة في المتجر حالياً (مدى، Apple Pay، فيزا/ماستركارد، أو الدفع عند الاستلام).',
      requiredInfo: 'Enable at least one payment gateway (e.g., Moyasar, Tap, Stripe, or COD) in Payment Settings.',
      requiredInfoAr: 'يرجى تفعيل بوابة دفع واحدة على الأقل في إعدادات الدفع.',
      targetTab: 'payments',
      canAutoFix: true,
      impact: 'Customers cannot complete checkout orders.',
      impactAr: 'لا يمكن للعملاء إتمام عمليات الدفع والطلب من المتجر.',
    });
  } else {
    // Check if online gateways have required credentials
    const onlineGateways = enabledGateways.filter((g) => g.provider !== 'cod');
    onlineGateways.forEach((gw) => {
      const hasKey = Boolean(
        (gw.publicKey && gw.publicKey.trim() !== '') ||
          (gw.maskedSecretKey && gw.maskedSecretKey.trim() !== '')
      );
      if (!hasKey && gw.status === 'error') {
        issues.push({
          id: `${storeId}-payment-key-missing-${gw.id}`,
          storeId,
          storeName,
          category: 'payment',
          severity: 'action_required',
          title: `Merchant API Keys Missing: ${gw.title}`,
          titleAr: `مفاتيح API التاجر مفقودة: ${gw.titleAr || gw.title}`,
          description: `The payment gateway ${gw.title} is enabled but missing production/sandbox API keys.`,
          descriptionAr: `بوابة الدفع ${gw.titleAr || gw.title} مفعلة ولكن مفاتيح API السرية/العامة غير موجودة.`,
          requiredInfo: 'Provide Public Key and Secret Key obtained from your merchant gateway dashboard.',
          requiredInfoAr: 'يرجى إدخال المفتاح العام والمفتاح السري من لوحة تحكم مزود الدفع.',
          targetTab: 'payments',
          canAutoFix: false,
          impact: 'Live card payments for this provider will fail during checkout.',
          impactAr: 'ستفشل عمليات الدفع بالبطاقات البنكية لهذا المزود أثناء إتمام الطلب.',
        });
      }
    });
  }

  // 7. Shipping & Delivery Zones Check
  const activeShippingZones = shippingZones.filter((z) => z.status === 'active');
  const shippingConfigured = activeShippingZones.length > 0;
  if (!shippingConfigured) {
    issues.push({
      id: `${storeId}-no-shipping-zones`,
      storeId,
      storeName,
      category: 'shipping',
      severity: 'critical',
      title: 'No Active Shipping Zones / Rates',
      titleAr: 'لا توجد مناطق وأسعار شحن مفعلة',
      description: 'The store has no active delivery zones configured. Customers cannot calculate delivery rates at checkout.',
      descriptionAr: 'لا توجد مناطق أو مدن شحن مفعلة في المتجر. لن يتمكن المشترون من حساب تكلفة التوصيل.',
      requiredInfo: 'Configure at least one shipping zone with city/region delivery rates in Shipping Settings.',
      requiredInfoAr: 'يرجى إضافة منطقة شحن واحدة على الأقل وتحديد أسعار التوصيل في إعدادات الشحن.',
      targetTab: 'shipping',
      canAutoFix: true,
      impact: 'Delivery address selection will fail at checkout.',
      impactAr: 'تعذر تحديد عنوان التوصيل وحساب الرسوم عند الطلب.',
    });
  }

  // 8. Courier Integration Check
  const connectedCouriers = couriers.filter((c) => c.isConnected && c.status === 'connected');
  const courierConnected = connectedCouriers.length > 0;
  if (!courierConnected) {
    issues.push({
      id: `${storeId}-no-couriers-connected`,
      storeId,
      storeName,
      category: 'shipping',
      severity: 'warning',
      title: 'No Automated Shipping Courier Connected',
      titleAr: 'لم يتم ربط شركة شحن لوجستية آلية',
      description: 'Automated courier integrations (Aramex, SMSA, SPL, RedBox, DHL) are not connected. Waybills and tracking must be handled manually.',
      descriptionAr: 'لم يتم ربط مزود شحن آلي (أرامكس، سمسا، سبل، ريدبوكس). سيتعين إصدار بوالص الشحن يدوياً.',
      requiredInfo: 'Connect your courier corporate account credentials in Shipping Integrations.',
      requiredInfoAr: 'يرجى إدخال بيانات حساب الربط لشركة الشحن المعتمدة في إعدادات الشحن.',
      targetTab: 'shipping',
      targetSubTab: 'couriers',
      canAutoFix: false,
      impact: 'Automated 1-click AWB generation & live tracking unavailable.',
      impactAr: 'تعذر توليد بوالص الشحن التلقائية ورصد التتبع اللحظي للشحنات.',
    });
  }

  // 9. SEO Metadata Check
  const hasMeta = Boolean(
    seoConfig?.metaTitle &&
      seoConfig.metaTitle.trim() !== '' &&
      seoConfig.metaTitle !== 'Online Store'
  );
  const hasSitemap = Boolean(seoConfig?.sitemapUrl && seoConfig.sitemapUrl.trim() !== '');
  if (!hasMeta) {
    issues.push({
      id: `${storeId}-seo-meta-missing`,
      storeId,
      storeName,
      category: 'seo',
      severity: 'warning',
      title: 'Store SEO Meta Tags Incomplete',
      titleAr: 'بيانات الميتا وعنوان SEO للمتجر غير مكتملة',
      description: 'Primary store SEO meta title and description are missing or using default values.',
      descriptionAr: 'عنوان الميتا ووصف المتجر لمحركات البحث فارغ أو يستخدم القيم الافتراضية.',
      requiredInfo: 'Define an optimized SEO Title, Description, and Keywords in SEO Settings.',
      requiredInfoAr: 'يرجى تحديد عنوان ووصف وكلمات مفتاحية مخصصة في إعدادات SEO.',
      targetTab: 'seo',
      targetSubTab: 'general',
      canAutoFix: true,
      impact: 'Lower search engine visibility and sub-optimal search snippet clicks.',
      impactAr: 'ضعف الظهور في محركات البحث ومقتطفات نتائج Google.',
    });
  }

  // 10. Catalog & Products Check
  const publishedProducts = products.filter((p) => p.status === 'published');
  const catalogActive = publishedProducts.length > 0;
  if (!catalogActive) {
    issues.push({
      id: `${storeId}-no-published-products`,
      storeId,
      storeName,
      category: 'catalog',
      severity: 'critical',
      title: 'No Published Products in Catalog',
      titleAr: 'لا توجد منتجات منشورة في الكتالوج',
      description: 'The store does not have any active, published products for customers to purchase.',
      descriptionAr: 'لا توجد أي منتجات منشورة ومتاحة للشراء في المتجر حالياً.',
      requiredInfo: 'Add and publish at least one product with pricing, image, and inventory.',
      requiredInfoAr: 'يرجى إضافة ونشر منتج واحد على الأقل مع السعر والصورة والمخزون.',
      targetTab: 'products',
      canAutoFix: false,
      impact: 'Storefront catalog is empty for visitors.',
      impactAr: 'واجهة المتجر ستظهر فارغة تماماً أمام الزوار.',
    });
  }

  // Compute severity summary
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const actionRequiredCount = issues.filter((i) => i.severity === 'action_required').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const healthyCount = 10 - (criticalCount + actionRequiredCount + warningCount);

  let overallStatus: AlertSeverity = 'healthy';
  if (criticalCount > 0) overallStatus = 'critical';
  else if (actionRequiredCount > 0) overallStatus = 'action_required';
  else if (warningCount > 0) overallStatus = 'warning';

  const score = Math.max(
    0,
    Math.min(
      100,
      100 - criticalCount * 25 - actionRequiredCount * 15 - warningCount * 5
    )
  );

  return {
    storeId,
    storeName,
    status: overallStatus,
    score,
    criticalCount,
    actionRequiredCount,
    warningCount,
    healthyCount: Math.max(0, healthyCount),
    issues,
    checks: {
      googleOAuth: isGoogleConnected,
      googleAnalytics: hasGa4,
      googleSearchConsole: hasGsc,
      googleTagManager: hasGtm,
      googleAds: Boolean(seoConfig?.googleAdsConversionId),
      seoMeta: hasMeta,
      sitemap: hasSitemap,
      paymentsConfigured,
      shippingConfigured,
      courierConnected,
      catalogActive,
      storeActive,
    },
  };
}

/** Audit all stores in the SaaS platform for centralized Master Admin control */
export function auditPlatformHealth(params: {
  stores: Store[];
  seoConfigs?: Record<string, StoreSEOConfig>;
  allPaymentGateways?: Record<string, PaymentGatewayItem[]>;
  allCouriers?: Record<string, CourierConnectionItem[]>;
  allShipping?: Record<string, ShippingZone[]>;
  allProducts?: Record<string, Product[]>;
  allOrders?: Record<string, Order[]>;
}): PlatformHealthSummary {
  const {
    stores,
    seoConfigs = {},
    allPaymentGateways = {},
    allCouriers = {},
    allShipping = {},
    allProducts = {},
    allOrders = {},
  } = params;

  const storeReports: Record<string, StoreHealthReport> = {};
  const allIssues: HealthIssue[] = [];

  let totalCritical = 0;
  let totalActionRequired = 0;
  let totalWarnings = 0;

  let criticalStores = 0;
  let actionRequiredStores = 0;
  let warningStores = 0;
  let healthyStores = 0;

  stores.forEach((store) => {
    const report = auditStoreHealth({
      store,
      seoConfig: seoConfigs[store.id],
      paymentGateways: allPaymentGateways[store.id] || [],
      couriers: allCouriers[store.id] || [],
      shippingZones: allShipping[store.id] || [],
      products: allProducts[store.id] || [],
      orders: allOrders[store.id] || [],
    });

    storeReports[store.id] = report;
    allIssues.push(...report.issues);

    totalCritical += report.criticalCount;
    totalActionRequired += report.actionRequiredCount;
    totalWarnings += report.warningCount;

    if (report.status === 'critical') criticalStores++;
    else if (report.status === 'action_required') actionRequiredStores++;
    else if (report.status === 'warning') warningStores++;
    else healthyStores++;
  });

  let overallStatus: AlertSeverity = 'healthy';
  if (criticalStores > 0) overallStatus = 'critical';
  else if (actionRequiredStores > 0) overallStatus = 'action_required';
  else if (warningStores > 0) overallStatus = 'warning';

  const totalStores = stores.length || 1;
  const overallScore = Math.round(
    Object.values(storeReports).reduce((acc, r) => acc + r.score, 0) / totalStores
  );

  return {
    overallStatus,
    overallScore,
    totalStores: stores.length,
    healthyStoresCount: healthyStores,
    actionRequiredStoresCount: actionRequiredStores,
    criticalStoresCount: criticalStores,
    warningStoresCount: warningStores,
    totalCriticalIssues: totalCritical,
    totalActionRequiredIssues: totalActionRequired,
    totalWarnings,
    storeReports,
    allIssues,
  };
}
