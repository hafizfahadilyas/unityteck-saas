import type { DictKey } from './dict';

/** Master sidebar tab id → dictionary key */
export const MASTER_NAV_KEYS: Record<string, DictKey> = {
  dashboard: 'navDashboard',
  accounts: 'navAccounts',
  stores: 'navClientStores',
  plans: 'navPlansSubscriptions',
  'services-points': 'navServicesPoints',
  integrations: 'navIntegrations',
  support: 'navSupportCenter',
  reports: 'navReports',
  security: 'navSecurityPermissions',
  notifications: 'navNotificationsCenter',
  settings: 'navSettings',
  'control-center': 'navControlCenter',
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
};

/** Store sidebar tab id → dictionary key */
export const STORE_NAV_KEYS: Record<string, DictKey> = {
  dashboard: 'navDashboard',
  storefront: 'navLiveStorefront',
  orders: 'navOrders',
  invoices: 'navInvoices',
  products: 'navProducts',
  media: 'navMediaLibrary',
  canva: 'navDesignStudio',
  'ai-media': 'navAiMediaStudio',
  categories: 'navCategories',
  brands: 'navBrands',
  customers: 'navCustomers',
  marketing: 'navMarketingChannels',
  analytics: 'navAnalytics',
  'smart-automation': 'navSmartAutomation',
  reports: 'navReports',
  whatsapp: 'navWhatsApp',
  social: 'navSocialPublishing',
  seo: 'navSeoStore',
  coupons: 'navCouponsDeals',
  notifications: 'navNotifications',
  shipping: 'navShipping',
  hosting: 'navHostingStore',
  themes: 'navThemesStore',
  pages: 'navPages',
  blog: 'navBlog',
  'commerce-tools': 'navCommerceTools',
  commerceTools: 'navCommerceTools',
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
