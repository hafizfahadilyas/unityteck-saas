/** Persistent bank / card checkout discounts (per store). */

export interface BankOfferItem {
  id: string;
  storeId: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  triggerType: 'cart_value' | 'item_count';
  triggerValue: number;
  bankName: string;
  paymentMethod: string;
  status: 'active' | 'draft' | 'expired';
  startDate: string;
  endDate: string;
}

const STORAGE_KEY = 'unityteck_bank_offers_map';

function readMap(): Record<string, BankOfferItem[]> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, BankOfferItem[]>) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    }
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('unityteck-bank-offers-updated', { detail: { at: Date.now() } }),
    );
  }
}

export function loadBankOffers(storeId: string): BankOfferItem[] {
  return readMap()[storeId] || [];
}

export function saveBankOffer(offer: BankOfferItem): BankOfferItem[] {
  const map = readMap();
  const list = [offer, ...(map[offer.storeId] || []).filter((o) => o.id !== offer.id)];
  map[offer.storeId] = list;
  writeMap(map);
  return list;
}

export function deleteBankOffer(storeId: string, offerId: string): BankOfferItem[] {
  const map = readMap();
  const list = (map[storeId] || []).filter((o) => o.id !== offerId);
  map[storeId] = list;
  writeMap(map);
  return list;
}

function paymentMatches(offerMethod: string, checkoutMethod: string): boolean {
  const offer = (offerMethod || '').toLowerCase();
  const pay = (checkoutMethod || '').toLowerCase();
  if (!offer || !pay) return false;
  if (offer.includes('mada') && (pay.includes('mada') || pay.includes('مدى'))) return true;
  if (offer.includes('apple') && pay.includes('apple')) return true;
  if (
    (offer.includes('credit') || offer.includes('card') || offer.includes('visa')) &&
    (pay.includes('card') ||
      pay.includes('visa') ||
      pay.includes('master') ||
      pay.includes('فيزا') ||
      pay.includes('credit'))
  ) {
    return true;
  }
  return pay.includes(offer) || offer.includes(pay);
}

function isOfferLive(offer: BankOfferItem, today = new Date().toISOString().slice(0, 10)): boolean {
  if (offer.status !== 'active') return false;
  if (offer.startDate && today < offer.startDate) return false;
  if (offer.endDate && today > offer.endDate) return false;
  return true;
}

/** Best matching active bank/card discount for cart + payment method */
export function resolveBankCardDiscount(
  storeId: string,
  cartSubtotal: number,
  itemCount: number,
  paymentMethod: string,
): { offer: BankOfferItem | null; discount: number } {
  const offers = loadBankOffers(storeId).filter((o) => isOfferLive(o));
  let best: BankOfferItem | null = null;
  let bestDiscount = 0;

  for (const offer of offers) {
    if (!paymentMatches(offer.paymentMethod, paymentMethod)) continue;

    const triggerOk =
      offer.triggerType === 'item_count'
        ? itemCount >= (offer.triggerValue || 0)
        : cartSubtotal >= (offer.triggerValue || 0);
    if (!triggerOk) continue;

    const discount =
      offer.discountType === 'percentage'
        ? Math.round(cartSubtotal * (offer.discountValue / 100))
        : Math.min(cartSubtotal, offer.discountValue);

    if (discount > bestDiscount) {
      bestDiscount = discount;
      best = offer;
    }
  }

  return { offer: best, discount: bestDiscount };
}
