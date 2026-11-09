/**
 * Client cashback types + API row mapper.
 * Source of truth = Laravel `/cashback/campaigns` + `CashbackService` (store_id wallet only).
 */

export interface CashbackCampaign {
  id: string;
  storeId: string;
  name: string;
  imageUrl?: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  minCartValue: number;
  maxCashbackPerOrder?: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'draft' | 'completed' | 'paused';
  productScope?: 'all' | 'include' | 'exclude';
  productIds?: string[];
  storeWalletOnly?: boolean;
  creditExpiryDays?: number | null;
  holdDays?: number;
}

/** Always empty — campaigns load from API only. */
export function loadCashbackCampaigns(_storeId: string): CashbackCampaign[] {
  return [];
}

export function saveCashbackCampaigns(_storeId: string, _list: CashbackCampaign[]): void {
  // no-op — use createCashbackCampaignApi
}

export function computeCashback(
  _storeId: string,
  _subtotal: number,
  _now: Date = new Date(),
): { amount: number; campaign: CashbackCampaign | null } {
  return { amount: 0, campaign: null };
}

function asNum(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

function asStr(v: unknown, fallback = ''): string {
  return v == null ? fallback : String(v);
}

/**
 * Map Laravel cashback_campaigns row → client CashbackCampaign (per store_id).
 */
export function mapApiCashbackRow(
  row: Record<string, unknown> | null | undefined,
  storeId: string,
): CashbackCampaign {
  const r = row && typeof row === 'object' ? row : {};
  const scopeRaw = asStr(r.product_scope ?? r.productScope, 'all');
  const scope: 'all' | 'include' | 'exclude' =
    scopeRaw === 'include' || scopeRaw === 'exclude' ? scopeRaw : 'all';
  const statusRaw = asStr(r.status, 'draft');
  const status: CashbackCampaign['status'] =
    statusRaw === 'active' ||
    statusRaw === 'draft' ||
    statusRaw === 'completed' ||
    statusRaw === 'paused'
      ? statusRaw
      : 'draft';
  const typeRaw = asStr(r.type, 'percentage');
  const productIdsRaw = r.product_ids ?? r.productIds;
  const productIds = Array.isArray(productIdsRaw)
    ? productIdsRaw.map((id) => String(id)).filter(Boolean)
    : [];

  return {
    id: asStr(r.id),
    storeId: asStr(r.store_id ?? r.storeId, storeId),
    name: asStr(r.name),
    imageUrl: (r.image_url ?? r.imageUrl ?? null) as string | null,
    type: typeRaw === 'fixed' ? 'fixed' : 'percentage',
    value: asNum(r.value),
    minCartValue: asNum(r.min_cart_value ?? r.minCartValue),
    maxCashbackPerOrder:
      r.max_cashback_per_order != null || r.maxCashbackPerOrder != null
        ? asNum(r.max_cashback_per_order ?? r.maxCashbackPerOrder)
        : undefined,
    startDate: asStr(r.start_date ?? r.startDate),
    endDate: asStr(r.end_date ?? r.endDate),
    status,
    productScope: scope,
    productIds,
    storeWalletOnly: true,
    creditExpiryDays:
      r.credit_expiry_days != null || r.creditExpiryDays != null
        ? asNum(r.credit_expiry_days ?? r.creditExpiryDays)
        : null,
    holdDays: asNum(r.hold_days ?? r.holdDays, 7),
  };
}
