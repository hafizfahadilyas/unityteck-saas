/**
 * Central product sales-channel registry (store catalog).
 * Add a channel here once — filters, editors, and product payloads reuse it.
 * Per-store connection still gates live publish; this list is the catalog of known channels.
 */

export type ProductChannelId = 'online_store' | 'android_app';

export interface ProductChannelDef {
  id: ProductChannelId;
  /** Stable filter / storage value used in product.salesChannels */
  value: string;
  labelEn: string;
  labelAr: string;
  /** When false, UI may show as “Not available” until wired */
  available: boolean;
}

export const PRODUCT_CHANNELS: readonly ProductChannelDef[] = [
  {
    id: 'online_store',
    value: 'Online Store',
    labelEn: 'Online Store',
    labelAr: 'المتجر الإلكتروني',
    available: true,
  },
  {
    id: 'android_app',
    value: 'Android App',
    labelEn: 'Android App',
    labelAr: 'تطبيق أندرويد',
    available: true,
  },
] as const;

export function getProductChannelLabel(value: string, isAr: boolean): string {
  const found = PRODUCT_CHANNELS.find(
    (c) => c.value.toLowerCase() === String(value || '').toLowerCase() || c.id === value
  );
  if (!found) return value;
  return isAr ? found.labelAr : found.labelEn;
}

export function listAvailableProductChannels(): ProductChannelDef[] {
  return PRODUCT_CHANNELS.filter((c) => c.available);
}

/** Keep only catalog channels. Dropped social shops fall back to Online Store. */
export function normalizeProductSalesChannels(raw: unknown): string[] {
  const allowed = new Set(listAvailableProductChannels().map((c) => c.value));
  const list = Array.isArray(raw) ? raw.map((v) => String(v)) : [];
  const kept = list.filter((v) => allowed.has(v));
  return kept.length > 0 ? kept : ['Online Store'];
}

export function listAllProductChannels(): readonly ProductChannelDef[] {
  return PRODUCT_CHANNELS;
}
