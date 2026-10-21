/**
 * Phase 2.4 — tab/module → ability map (UI gates).
 * API already enforces via role.can (Phase 2.3). Hide ≠ security.
 */

/** Store Admin tab id → required *read* ability (null = always visible). */
export const STORE_TAB_ABILITY: Record<string, string | null> = {
  dashboard: null,
  storefront: null,
  orders: 'orders.read',
  invoices: 'orders.read',
  products: 'products.read',
  media: null,
  categories: 'products.read',
  brands: 'products.read',
  customers: 'customers.read',
  marketing: 'analytics.read',
  analytics: 'analytics.read',
  reports: 'analytics.read',
  whatsapp: null,
  seo: 'seo.read',
  coupons: 'coupons.read',
  shipping: 'shipping.read',
  hosting: 'settings.read',
  themes: 'themes.read',
  pages: null,
  blog: null,
  'commerce-tools': null,
  appstore: 'themes.read',
  payments: 'settings.read',
  settings: 'settings.read',
  backup: null,
  restore: null,
};

/** Master Admin tab id → required *read* ability. */
export const MASTER_TAB_ABILITY: Record<string, string | null> = {
  dashboard: null,
  stores: 'stores.read',
  'control-center': 'stores.read',
  onboarding: 'stores.write',
  domains: 'stores.read',
  database: 'stores.read',
  updates: 'stores.read',
  themes: 'themes.read',
  marketplace: 'themes.read',
  products: 'products.read',
  categories: 'products.read',
  orders: 'orders.read',
  customers: 'customers.read',
  marketing: 'analytics.read',
  promotions: 'coupons.read',
  coupons: 'coupons.read',
  seo: 'seo.read',
  blog: 'analytics.read',
  analytics: 'analytics.read',
  payments: 'settings.read',
  integrations: 'settings.read',
  reports: 'analytics.read',
  settings: 'settings.read',
  backup: null,
  restore: null,
};

/** Module → write ability (buttons / mutations). */
export const MODULE_WRITE_ABILITY: Record<string, string> = {
  products: 'products.write',
  orders: 'orders.write',
  customers: 'customers.write',
  coupons: 'coupons.write',
  shipping: 'shipping.write',
  seo: 'seo.write',
  themes: 'themes.write',
  settings: 'settings.write',
  stores: 'stores.write',
  team: 'team.write',
};

export function tabReadAbility(
  portal: 'master' | 'store',
  tabId: string,
): string | null {
  const map = portal === 'master' ? MASTER_TAB_ABILITY : STORE_TAB_ABILITY;
  return map[tabId] === undefined ? null : map[tabId];
}

export function moduleWriteAbility(module: string): string | undefined {
  return MODULE_WRITE_ABILITY[module];
}
