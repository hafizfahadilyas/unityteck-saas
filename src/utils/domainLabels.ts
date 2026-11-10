import { localeMixedLabel } from './localeMixedLabel';
import {
  ORDER_SOURCE_CATALOG,
  ORDER_STATUS_CATALOG,
  PAYMENT_METHOD_CATALOG,
  SHIPPING_COMPANY_CATALOG,
  findCatalogLabel,
} from './orderCatalogOptions';

type LocaleLike = string;

const ORDER_STATUS: Record<string, { en: string; ar: string }> = {
  draft: { en: 'Draft', ar: 'مسودة' },
  deleted: { en: 'Deleted', ar: 'محذوف' },
  pending: { en: 'Pending Payment', ar: 'بانتظار الدفع' },
  awaiting_payment: { en: 'Pending Payment', ar: 'بانتظار الدفع' },
  pending_payment: { en: 'Pending Payment', ar: 'بانتظار الدفع' },
  partially_paid: { en: 'Partially Paid', ar: 'مدفوع جزئياً' },
  pending_review: { en: 'Pending Review', ar: 'بانتظار المراجعة' },
  under_review: { en: 'Pending Review', ar: 'بانتظار المراجعة' },
  processing: { en: 'Processing', ar: 'قيد التنفيذ' },
  preparing: { en: 'Processing', ar: 'قيد التنفيذ' },
  confirmed: { en: 'Pending Review', ar: 'بانتظار المراجعة' },
  shipped: { en: 'Shipped', ar: 'تم الشحن' },
  'out for delivery': { en: 'Out for Delivery', ar: 'جاري التوصيل' },
  out_for_delivery: { en: 'Out for Delivery', ar: 'جاري التوصيل' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  completed: { en: 'Completed', ar: 'تم التنفيذ' },
  cancellation_requested: { en: 'Cancelled', ar: 'ملغي' },
  cancellation_pending: { en: 'Cancelled', ar: 'ملغي' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
  canceled: { en: 'Cancelled', ar: 'ملغي' },
  returned: { en: 'Returned', ar: 'مسترجع' },
  return_in_progress: { en: 'Return in Progress', ar: 'قيد الإسترجاع' },
  rfq: { en: 'Request for Quotation (RFQ)', ar: 'طلب عرض سعر' },
  refunded: { en: 'Returned', ar: 'مسترجع' },
  failed: { en: 'Cancelled', ar: 'ملغي' },
};

const PAYMENT_STATUS: Record<string, { en: string; ar: string }> = {
  paid: { en: 'Paid', ar: 'مدفوع' },
  unpaid: { en: 'Unpaid', ar: 'غير مدفوع' },
  pending: { en: 'Pending Payment', ar: 'بانتظار الدفع' },
  partially_paid: { en: 'Partially Paid', ar: 'مدفوع جزئياً' },
  'partially paid': { en: 'Partially Paid', ar: 'مدفوع جزئياً' },
  refunded: { en: 'Refunded', ar: 'مسترد' },
  failed: { en: 'Failed', ar: 'فشل' },
  partial: { en: 'Partially Paid', ar: 'مدفوع جزئياً' },
};

const SHIPPING_STATUS: Record<string, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  'in transit': { en: 'In Transit', ar: 'قيد النقل' },
  in_transit: { en: 'In Transit', ar: 'قيد النقل' },
  shipped: { en: 'Shipped', ar: 'تم الشحن' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  returned: { en: 'Returned', ar: 'مسترجع' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
};

type PaymentRule = { test: RegExp; en: string; ar: string };

const PAYMENT_RULES: PaymentRule[] = [
  { test: /cash|cod|استلام|عند الاستلام/i, en: 'Cash on Delivery', ar: 'الدفع عند الاستلام' },
  { test: /samsung/i, en: 'Samsung Pay', ar: 'سامسونج باي' },
  { test: /apple/i, en: 'Apple Pay', ar: 'أبل باي' },
  { test: /google\s*pay|googlepay/i, en: 'Google Pay', ar: 'جوجل باي' },
  { test: /paypal/i, en: 'PayPal', ar: 'باي بال' },
  { test: /mada|مدى/i, en: 'Mada', ar: 'مدى' },
  { test: /tamara|تمارا/i, en: 'Tamara', ar: 'تمارا' },
  { test: /tabby|تابي/i, en: 'Tabby', ar: 'تابي' },
  { test: /stc/i, en: 'stc pay', ar: 'أس تي سي باي' },
  { test: /mis\s*pay|mispay|ام اي اس/i, en: 'MIS Pay', ar: 'ام اي اس باي' },
  { test: /madfoat|madfooat/i, en: 'Madfoat', ar: 'مدفوع' },
  { test: /wallet|محفظ/i, en: 'Customer Wallet', ar: 'محفظة العميل' },
  { test: /visa/i, en: 'Visa', ar: 'فيزا' },
  { test: /mastercard|master\s*card/i, en: 'Mastercard', ar: 'ماستركارد' },
  { test: /bank|تحويل|bank_transfer/i, en: 'Bank Transfer', ar: 'تحويل بنكي' },
  { test: /credit|card|بطاقة/i, en: 'Credit Card', ar: 'بطاقة ائتمانية' },
];

type ChannelRule = { test: RegExp; en: string; ar: string };

const CHANNEL_RULES: ChannelRule[] = [
  { test: /instagram|انستغرام|إنستغرام/i, en: 'Instagram', ar: 'إنستغرام' },
  { test: /tiktok|تيك\s*توك/i, en: 'TikTok', ar: 'تيك توك' },
  { test: /snapchat|سناب/i, en: 'Snapchat', ar: 'سناب شات' },
  { test: /facebook|فيسبوك/i, en: 'Facebook', ar: 'فيسبوك' },
  { test: /\bx\b|twitter|تويتر|إكس/i, en: 'X (Twitter)', ar: 'إكس (تويتر)' },
  { test: /telegram|تيليجرام/i, en: 'Telegram', ar: 'تيليجرام' },
  { test: /youtube|يوتيوب/i, en: 'YouTube', ar: 'يوتيوب' },
  { test: /website|موقع/i, en: 'Website', ar: 'الموقع الإلكتروني' },
  { test: /google\s*ads|إعلانات جوجل|^google$/i, en: 'Google Ads', ar: 'إعلانات جوجل' },
  { test: /whatsapp|واتساب/i, en: 'WhatsApp', ar: 'واتساب' },
  { test: /organic|بحث\s*عضوي|بحث\s*مجاني/i, en: 'Organic Search', ar: 'بحث مجاني' },
  { test: /referral|إحالة/i, en: 'Referral', ar: 'إحالة' },
  { test: /other|أخرى/i, en: 'Other', ar: 'أخرى' },
  { test: /direct|مباشر|walk.?in|store/i, en: 'Direct / Store', ar: 'مباشر / متجر' },
];

function pick(entry: { en: string; ar: string } | undefined, isAr: boolean, fallback: string): string {
  if (!entry) return fallback;
  return isAr ? entry.ar : entry.en;
}

export function localizeOrderStatus(status?: string | null, locale: LocaleLike = 'ar'): string {
  const isAr = locale === 'ar';
  const raw = (status || '').trim();
  if (!raw) return isAr ? 'بانتظار الدفع' : 'Pending Payment';
  const key = raw.toLowerCase().replace(/-/g, '_');
  const fromCatalog = ORDER_STATUS_CATALOG.find((o) => o.value === key);
  if (fromCatalog) return isAr ? fromCatalog.labelAr : fromCatalog.labelEn;
  const entry = ORDER_STATUS[key] || ORDER_STATUS[raw.toLowerCase()];
  if (entry) return pick(entry, isAr, raw);
  return localeMixedLabel(raw, isAr) || (isAr ? raw : raw.charAt(0).toUpperCase() + raw.slice(1));
}

export function localizePaymentStatus(status?: string | null, locale: LocaleLike = 'ar'): string {
  const isAr = locale === 'ar';
  const raw = (status || '').trim();
  if (!raw) return isAr ? 'غير مدفوع' : 'Unpaid';
  const entry = PAYMENT_STATUS[raw.toLowerCase()];
  if (entry) return pick(entry, isAr, raw);
  return localeMixedLabel(raw, isAr) || raw;
}

export function localizeShippingStatus(status?: string | null, locale: LocaleLike = 'ar'): string {
  const isAr = locale === 'ar';
  const raw = (status || '').trim();
  if (!raw) return isAr ? 'قيد الانتظار' : 'Pending';
  const key = raw.toLowerCase().replace(/-/g, '_');
  const entry = SHIPPING_STATUS[key] || SHIPPING_STATUS[raw.toLowerCase()];
  if (entry) return pick(entry, isAr, raw);
  return localeMixedLabel(raw, isAr) || raw;
}

export function localizePaymentMethod(method?: string | null, locale: LocaleLike = 'ar'): string {
  const isAr = locale === 'ar';
  const raw = (method || '').trim();
  if (!raw) return isAr ? 'بطاقة ائتمانية' : 'Credit Card';
  const fromCatalog = findCatalogLabel(PAYMENT_METHOD_CATALOG, raw, isAr);
  if (fromCatalog && fromCatalog !== raw) return fromCatalog;
  const mixed = localeMixedLabel(raw, isAr);
  for (const rule of PAYMENT_RULES) {
    if (rule.test.test(raw)) return isAr ? rule.ar : rule.en;
  }
  return mixed || raw;
}

export function localizeSalesChannel(source?: string | null, locale: LocaleLike = 'ar'): string {
  const isAr = locale === 'ar';
  const raw = (source || 'Direct').trim();
  const fromCatalog = findCatalogLabel(ORDER_SOURCE_CATALOG, raw, isAr);
  if (fromCatalog && fromCatalog !== raw) return fromCatalog;
  const mixed = localeMixedLabel(raw, isAr);
  for (const rule of CHANNEL_RULES) {
    if (rule.test.test(raw)) return isAr ? rule.ar : rule.en;
  }
  return mixed || (isAr ? 'مباشر / متجر' : 'Direct / Store');
}

export function localizeShippingCompany(company?: string | null, locale: LocaleLike = 'ar'): string {
  const isAr = locale === 'ar';
  const raw = (company || '').trim();
  if (!raw) return '';
  const fromCatalog = findCatalogLabel(SHIPPING_COMPANY_CATALOG, raw, isAr);
  if (fromCatalog && fromCatalog !== raw) return fromCatalog;
  const lower = raw.toLowerCase();
  if (/spl|بريد/.test(lower) || /البريد السعودي/.test(raw)) {
    return isAr ? 'البريد السعودي' : 'SPL';
  }
  if (/j\s*&\s*t|ج[يى]\s*اند\s*ت[يى]/i.test(lower) || /جي اند تي/.test(raw)) {
    return isAr ? 'جي اند تي اكسبريس' : 'J&T Express';
  }
  if (/aymakan|أي مكان|اى مكان/i.test(lower) || /أي مكان/.test(raw)) {
    return isAr ? 'أي مكان' : 'Aymakan';
  }
  if (/red\s*box|ريدبوكس/i.test(lower)) return isAr ? 'ريدبوكس' : 'Redbox';
  if (/free\s*ship|شحن مجاني/i.test(lower) || /شحن مجاني/.test(raw)) {
    return isAr ? 'شحن مجاني' : 'Free Shipping';
  }
  if (/aramex|أرامكس/.test(lower)) return isAr ? 'أرامكس' : 'Aramex';
  if (/smsa|سمسا/.test(lower)) return isAr ? 'سمسا' : 'SMSA';
  if (/dhl/.test(lower)) return 'DHL Express';
  if (/مندوب/.test(raw)) return isAr ? 'مندوب خاص' : 'Private Courier';
  return localeMixedLabel(raw, isAr) || raw;
}
