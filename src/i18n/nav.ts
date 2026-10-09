import type { DictKey } from './dict';

/** Master sidebar tab id → dictionary key */
export const MASTER_NAV_KEYS: Record<string, DictKey> = {
  dashboard: 'navDashboard',
  stores: 'navClientStores',
  onboarding: 'navOnboarding',
  domains: 'navDomains',
  database: 'navDatabase',
  backup: 'navBackup',
  updates: 'navUpdates',
  themes: 'navThemesMaster',
  marketplace: 'navMarketplace',
  products: 'navProducts',
  categories: 'navCategories',
  orders: 'navOrders',
  customers: 'navCustomers',
  marketing: 'navMarketing',
  promotions: 'navPromotions',
  coupons: 'navCoupons',
  seo: 'navSeoMaster',
  blog: 'navBlog',
  analytics: 'navAnalytics',
  payments: 'navPayments',
  integrations: 'navIntegrations',
  reports: 'navReports',
  settings: 'navSettings',
};

/** Store sidebar tab id → dictionary key */
export const STORE_NAV_KEYS: Record<string, DictKey> = {
  dashboard: 'navDashboard',
  storefront: 'navLiveStorefront',
  orders: 'navOrders',
  products: 'navProductsPublish',
  media: 'navMediaLibrary',
  categories: 'navCategories',
  brands: 'navBrands',
  customers: 'navCustomers',
  marketing: 'navMarketingChannels',
  analytics: 'navAnalytics',
  reports: 'navReports',
  whatsapp: 'navWhatsApp',
  seo: 'navSeoStore',
  coupons: 'navCouponsDeals',
  shipping: 'navShipping',
  hosting: 'navHostingStore',
  backup: 'navBackup',
  themes: 'navThemesStore',
  appstore: 'navAppStore',
  payments: 'navPayments',
  settings: 'navSettings',
};

export function labelForNav(
  t: (key: DictKey) => string,
  map: Record<string, DictKey>,
  id: string,
): string {
  const key = map[id];
  return key ? t(key) : id;
}
