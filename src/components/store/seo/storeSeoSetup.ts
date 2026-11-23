export type SeoSetupStep = 'need_email' | 'need_domain' | 'ready';

const FAKE_ID = /^(G-UNITYKSA|GTM-KSA9901)/i;
const FAKE_TAG = /KSA-.+-AUTO|properties\/398210451/i;

export function realTrackingId(value: string | null | undefined): string {
  const v = String(value || '').trim();
  if (!v || FAKE_ID.test(v) || FAKE_TAG.test(v)) return '';
  return v;
}

export function storePublicHost(store: {
  custom_domain?: string | null;
  domain?: string | null;
  demo_domain?: string | null;
}): string {
  return String(store.custom_domain || store.domain || store.demo_domain || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./i, '')
    .trim();
}

export function storeGoogleEmail(store: { ownerEmail?: string | null; email?: string | null }): string {
  const email = String(store.ownerEmail || store.email || '')
    .trim()
    .toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export function seoSetupStep(store: {
  ownerEmail?: string | null;
  email?: string | null;
  custom_domain?: string | null;
  domain?: string | null;
  demo_domain?: string | null;
}): SeoSetupStep {
  if (!storeGoogleEmail(store)) return 'need_email';
  if (!storePublicHost(store)) return 'need_domain';
  return 'ready';
}

/** One Gmail connect → auto-linked tool snapshot (never invent IDs). */
export type SiteKitLinkedTools = {
  ga4: boolean;
  searchConsole: boolean;
  gtm: boolean;
  ads: boolean;
  indexing: boolean;
  sitemap: boolean;
};

export type SiteKitApplyResult = {
  email: string;
  seoPatch: {
    googleConnected: boolean;
    googleAccountEmail: string;
    connectedAt: string;
    searchConsoleConnected: boolean;
    ga4MeasurementId: string;
    gtmContainerId: string;
    indexingApiEnabled: boolean;
    sitemapUrl: string;
    sitemapEnabled: boolean;
  };
  selection: {
    ga4PropertyId: string;
    ga4MeasurementId: string;
    gscSiteUrl: string;
    gtmContainerId: string;
    adsCustomerId: string;
  };
  linked: SiteKitLinkedTools;
};

/**
 * Map Google `/callback` Site Kit JSON → SEO patch + UI selection.
 * Merchant does nothing after Gmail — IDs come from server auto-link only.
 */
export function applySiteKitCallback(res: any, fallbackEmail = ''): SiteKitApplyResult | null {
  const integration = res?.integration || {};
  const siteKit = res?.site_kit || {};
  const linkedRaw = siteKit?.linked || {};
  const email = String(integration.google_account_email || fallbackEmail || '')
    .trim()
    .toLowerCase();
  if (!email.includes('@')) return null;

  const ga4MeasurementId = realTrackingId(integration.ga4_measurement_id);
  const gtmContainerId = realTrackingId(integration.gtm_container_id);
  const gscSiteUrl = String(integration.gsc_site_url || '').trim();
  const ga4PropertyId = String(
    integration.ga4_property_id || res?.auto_selection?.suggested_ga4 || '',
  ).trim();
  const adsCustomerId = String(
    integration.google_ads_customer_id || res?.auto_selection?.suggested_ads || '',
  ).trim();
  const sitemapUrl = String(siteKit.sitemap_url || integration.sitemap_url || '').trim();

  const linked: SiteKitLinkedTools = {
    ga4: Boolean(linkedRaw.ga4 || ga4PropertyId || ga4MeasurementId),
    searchConsole: Boolean(linkedRaw.search_console || gscSiteUrl),
    gtm: Boolean(linkedRaw.gtm || gtmContainerId),
    ads: Boolean(linkedRaw.ads || adsCustomerId),
    indexing: Boolean(siteKit.indexing_homepage_pinged || gscSiteUrl),
    sitemap: Boolean(siteKit.sitemap_submitted || sitemapUrl),
  };

  return {
    email,
    seoPatch: {
      googleConnected: true,
      googleAccountEmail: email,
      connectedAt: new Date().toISOString().split('T')[0],
      searchConsoleConnected: linked.searchConsole,
      ga4MeasurementId,
      gtmContainerId,
      indexingApiEnabled: linked.indexing,
      sitemapUrl,
      sitemapEnabled: linked.sitemap || Boolean(sitemapUrl),
    },
    selection: {
      ga4PropertyId,
      ga4MeasurementId,
      gscSiteUrl,
      gtmContainerId,
      adsCustomerId,
    },
    linked,
  };
}

export function siteKitDoneMessage(linked: SiteKitLinkedTools, email: string, isAr: boolean): string {
  const partsEn: string[] = [];
  const partsAr: string[] = [];
  if (linked.ga4) {
    partsEn.push('Analytics');
    partsAr.push('التحليلات');
  }
  if (linked.searchConsole) {
    partsEn.push('Search Console');
    partsAr.push('وحدة البحث');
  }
  if (linked.gtm) {
    partsEn.push('Tag Manager');
    partsAr.push('مدير العلامات');
  }
  if (linked.indexing) {
    partsEn.push('Indexing');
    partsAr.push('الفهرسة');
  }
  if (linked.sitemap) {
    partsEn.push('Sitemap');
    partsAr.push('خريطة الموقع');
  }
  if (linked.ads) {
    partsEn.push('Ads');
    partsAr.push('الإعلانات');
  }

  if (isAr) {
    const tools = partsAr.length ? partsAr.join(' · ') : 'بانتظار بيانات الحساب';
    return `تم — ربط جوجل نجح (${email}). الأدوات تفعّلت تلقائياً: ${tools}`;
  }
  const tools = partsEn.length ? partsEn.join(' · ') : 'waiting for account data';
  return `Done — Google connected (${email}). Tools auto-linked: ${tools}`;
}
