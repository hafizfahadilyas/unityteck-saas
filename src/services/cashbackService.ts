/**
 * Cashback campaigns shared between the merchant dashboard (StoreCashback)
 * and the storefront checkout. Strictly isolated per store_id.
 * NOTE: persisted client-side until a dedicated backend endpoint is available.
 */
export interface CashbackCampaign {
  id: string;
  storeId: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minCartValue: number;
  maxCashbackPerOrder?: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'draft' | 'completed';
}

const key = (storeId: string) => `unityteck_cashback_campaigns_${storeId}`;

export function loadCashbackCampaigns(storeId: string): CashbackCampaign[] {
  try {
    const raw = localStorage.getItem(key(storeId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c) => c.storeId === storeId) : [];
  } catch {
    return [];
  }
}

export function saveCashbackCampaigns(storeId: string, list: CashbackCampaign[]): void {
  try {
    localStorage.setItem(key(storeId), JSON.stringify(list));
    window.dispatchEvent(new Event('unityteck-cashback-updated'));
  } catch {
    /* storage unavailable */
  }
}

/** Highest eligible active campaign cashback for a given subtotal (0 if none). */
export function computeCashback(
  storeId: string,
  subtotal: number,
  now: Date = new Date(),
): { amount: number; campaign: CashbackCampaign | null } {
  let best = { amount: 0, campaign: null as CashbackCampaign | null };
  for (const c of loadCashbackCampaigns(storeId)) {
    if (c.status !== 'active') continue;
    if (c.startDate && new Date(c.startDate) > now) continue;
    if (c.endDate && new Date(c.endDate) < now) continue;
    if (c.minCartValue && subtotal < c.minCartValue) continue;
    let amt = c.type === 'percentage' ? (subtotal * c.value) / 100 : c.value;
    if (c.maxCashbackPerOrder) amt = Math.min(amt, c.maxCashbackPerOrder);
    amt = Math.round(amt * 100) / 100;
    if (amt > best.amount) best = { amount: amt, campaign: c };
  }
  return best;
}
