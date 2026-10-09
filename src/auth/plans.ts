/**
 * Phase 2.6 — SPA plan catalog (mirror App\Support\Plans).
 * UI hide = hint; API plan.feature + product_limit enforce.
 */

import type { PlanType, Store } from '../types';

export type PlanFeature =
  | 'catalog'
  | 'orders'
  | 'basic_seo'
  | 'seo'
  | 'coupons'
  | 'shipping'
  | 'themes_basic'
  | 'themes'
  | 'backups'
  | 'zatca'
  | 'analytics'
  | 'ai'
  | 'all';

export type PlanInfo = {
  code: PlanType;
  billedCode: PlanType;
  name: string;
  productLimit: number | null;
  orderLimit: number | null;
  storageMb: number | null;
  teamSeats: number | null;
  features: PlanFeature[];
  masterGrantedPro: boolean;
};

const CATALOG: Record<
  PlanType,
  Omit<PlanInfo, 'code' | 'billedCode' | 'masterGrantedPro'>
> = {
  free: {
    name: 'Free',
    productLimit: 50,
    orderLimit: 100,
    storageMb: 512,
    teamSeats: 1,
    features: ['catalog', 'orders', 'basic_seo', 'themes_basic'],
  },
  paid: {
    name: 'Paid',
    productLimit: 500,
    orderLimit: 2000,
    storageMb: 5120,
    teamSeats: 5,
    features: ['catalog', 'orders', 'seo', 'coupons', 'shipping', 'analytics', 'themes_basic'],
  },
  pro: {
    name: 'Pro',
    productLimit: 5000,
    orderLimit: null,
    storageMb: 51200,
    teamSeats: 20,
    features: [
      'catalog',
      'orders',
      'seo',
      'coupons',
      'shipping',
      'themes_basic',
      'themes',
      'backups',
      'zatca',
      'analytics',
      'ai',
    ],
  },
  custom: {
    name: 'Custom',
    productLimit: null,
    orderLimit: null,
    storageMb: null,
    teamSeats: null,
    features: ['all'],
  },
};

/** Store Admin tab → required plan feature (null = always). */
export const STORE_TAB_PLAN_FEATURE: Record<string, PlanFeature | null> = {
  dashboard: null,
  storefront: null,
  orders: 'orders',
  products: 'catalog',
  categories: 'catalog',
  customers: null,
  marketing: null,
  analytics: null,
  reports: null,
  whatsapp: null,
  seo: 'seo',
  coupons: 'coupons',
  shipping: 'shipping',
  themes: 'themes_basic',
  appstore: 'themes_basic',
  payments: null,
  settings: null,
  backup: null,
  restore: null,
};

export function normalizePlanCode(plan?: string | null): PlanType {
  const p = String(plan || 'free').toLowerCase();
  if (p === 'paid' || p === 'pro' || p === 'custom' || p === 'free') return p;
  return 'free';
}

export function effectivePlanCode(store: Pick<Store, 'plan' | 'masterGrantedPro'>): PlanType {
  const billed = normalizePlanCode(store.plan);
  if (store.masterGrantedPro && (billed === 'free' || billed === 'paid')) {
    return 'pro';
  }
  return billed;
}

export function planInfoForStore(
  store: Pick<Store, 'plan' | 'masterGrantedPro'>,
): PlanInfo {
  const billedCode = normalizePlanCode(store.plan);
  const code = effectivePlanCode(store);
  const meta = CATALOG[code];
  return {
    code,
    billedCode,
    name: meta.name,
    productLimit: meta.productLimit,
    orderLimit: meta.orderLimit,
    storageMb: meta.storageMb,
    teamSeats: meta.teamSeats,
    features: meta.features,
    masterGrantedPro: Boolean(store.masterGrantedPro),
  };
}

export function planHasFeature(
  store: Pick<Store, 'plan' | 'masterGrantedPro'>,
  feature: PlanFeature,
): boolean {
  const info = planInfoForStore(store);
  if (info.features.includes('all')) return true;
  if (info.features.includes(feature)) return true;
  if (feature === 'seo' && info.features.includes('basic_seo')) return true;
  if (feature === 'themes_basic' && info.features.includes('themes')) return true;
  return false;
}

/** Full theme catalog + advanced homepage styles (Pro / Custom / Master grant). */
export function planHasFullThemes(
  store: Pick<Store, 'plan' | 'masterGrantedPro'>,
): boolean {
  return planHasFeature(store, 'themes');
}

export function canAddProduct(
  store: Pick<Store, 'plan' | 'masterGrantedPro'>,
  productsUsed: number,
): { ok: true } | { ok: false; message: string } {
  const info = planInfoForStore(store);
  if (info.productLimit === null) return { ok: true };
  if (productsUsed >= info.productLimit) {
    return {
      ok: false,
      message: `Product limit reached for ${info.name} plan (${info.productLimit}).`,
    };
  }
  return { ok: true };
}

export function planAllowsStoreTab(
  store: Pick<Store, 'plan' | 'masterGrantedPro'>,
  tabId: string,
): boolean {
  const need = STORE_TAB_PLAN_FEATURE[tabId];
  if (need == null) return true;
  return planHasFeature(store, need);
}

export function listPlanCatalog(): Array<{ code: PlanType } & (typeof CATALOG)[PlanType]> {
  return (Object.keys(CATALOG) as PlanType[]).map((code) => ({
    code,
    ...CATALOG[code],
  }));
}
