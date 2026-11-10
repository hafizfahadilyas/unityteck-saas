/**
 * Official payment-method PNGs for Create Order / filters (public/payment-methods).
 * Source pack: طرق الدفع — optimized for modal tiles.
 */

export type CreateOrderPaymentMethodId =
  | 'visa'
  | 'apple'
  | 'paypal'
  | 'mada'
  | 'customer_wallet'
  | 'samsung'
  | 'tamara'
  | 'tabby'
  | 'mispay'
  | 'madfoat'
  | 'stc'
  | 'googlepay'
  | 'bank_transfer'
  | 'emkan';

export type CreateOrderPaymentOption = {
  id: CreateOrderPaymentMethodId;
  labelEn: string;
  labelAr: string;
  /** Path under public/ — empty if asset missing */
  logoSrc: string;
};

const BASE = '/payment-methods';

/** Map modal payment id → optimized PNG in /public/payment-methods */
export const PAYMENT_METHOD_LOGO: Record<CreateOrderPaymentMethodId, string> = {
  visa: `${BASE}/visa.png`,
  apple: `${BASE}/apple-pay.png`,
  paypal: `${BASE}/paypal.png`,
  mada: `${BASE}/mada.png`,
  customer_wallet: `${BASE}/customer-wallet.png`,
  samsung: `${BASE}/samsung-pay.png`,
  tamara: `${BASE}/tamara.png`,
  tabby: `${BASE}/tabby.png`,
  mispay: `${BASE}/mis-pay.png`,
  madfoat: `${BASE}/madfoat.png`,
  stc: `${BASE}/stc-pay.png`,
  googlepay: `${BASE}/google-pay.png`,
  bank_transfer: `${BASE}/bank-transfer.png`,
  emkan: `${BASE}/emkan.png`,
};

/** Create New Order tiles — every id has a PNG from طرق الدفع pack. */
export const CREATE_ORDER_PAYMENT_OPTIONS: CreateOrderPaymentOption[] = [
  { id: 'visa', labelEn: 'Visa', labelAr: 'فيزا', logoSrc: PAYMENT_METHOD_LOGO.visa },
  { id: 'apple', labelEn: 'Apple Pay', labelAr: 'أبل باي', logoSrc: PAYMENT_METHOD_LOGO.apple },
  { id: 'paypal', labelEn: 'PayPal', labelAr: 'باي بال', logoSrc: PAYMENT_METHOD_LOGO.paypal },
  { id: 'mada', labelEn: 'Mada', labelAr: 'مدى', logoSrc: PAYMENT_METHOD_LOGO.mada },
  {
    id: 'customer_wallet',
    labelEn: 'Customer Wallet',
    labelAr: 'محفظة العميل',
    logoSrc: PAYMENT_METHOD_LOGO.customer_wallet,
  },
  { id: 'samsung', labelEn: 'Samsung Pay', labelAr: 'سامسونج باي', logoSrc: PAYMENT_METHOD_LOGO.samsung },
  { id: 'tamara', labelEn: 'Tamara', labelAr: 'تمارا', logoSrc: PAYMENT_METHOD_LOGO.tamara },
  { id: 'tabby', labelEn: 'Tabby', labelAr: 'تابي', logoSrc: PAYMENT_METHOD_LOGO.tabby },
  { id: 'mispay', labelEn: 'MIS Pay', labelAr: 'ام اي اس باي', logoSrc: PAYMENT_METHOD_LOGO.mispay },
  { id: 'madfoat', labelEn: 'Madfoat', labelAr: 'مدفوع', logoSrc: PAYMENT_METHOD_LOGO.madfoat },
  { id: 'stc', labelEn: 'stc pay', labelAr: 'أس تي سي باي', logoSrc: PAYMENT_METHOD_LOGO.stc },
  { id: 'googlepay', labelEn: 'Google Pay', labelAr: 'جوجل باي', logoSrc: PAYMENT_METHOD_LOGO.googlepay },
  {
    id: 'bank_transfer',
    labelEn: 'Bank Transfer',
    labelAr: 'تحويل بنكي',
    logoSrc: PAYMENT_METHOD_LOGO.bank_transfer,
  },
  { id: 'emkan', labelEn: 'Emkan', labelAr: 'إمكان', logoSrc: PAYMENT_METHOD_LOGO.emkan },
];

export function paymentMethodLogoSrc(id: string | undefined | null): string | null {
  if (!id) return null;
  const key = id as CreateOrderPaymentMethodId;
  return PAYMENT_METHOD_LOGO[key] || null;
}
