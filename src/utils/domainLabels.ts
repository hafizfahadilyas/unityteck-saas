import { localeMixedLabel } from './localeMixedLabel';

type LocaleLike = string;

const ORDER_STATUS: Record<string, { en: string; ar: string }> = {
  pending: { en: 'Pending Payment', ar: 'بانتظار الدفع' },
  awaiting_payment: { en: 'Pending Payment', ar: 'بانتظار الدفع' },
  processing: { en: 'Processing', ar: 'قيد المعالجة' },
  preparing: { en: 'Preparing', ar: 'قيد التجهيز' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  shipped: { en: 'Shipped', ar: 'تم الشحن' },
  'out for delivery': { en: 'Out for Delivery', ar: 'خرج للتوصيل' },
  out_for_delivery: { en: 'Out for Delivery', ar: 'خرج للتوصيل' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  cancellation_requested: { en: 'Cancel Requested', ar: 'طلب إلغاء' },
  cancellation_pending: { en: 'Cancel Requested', ar: 'طلب إلغاء' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
  canceled: { en: 'Cancelled', ar: 'ملغي' },
  returned: { en: 'Returned', ar: 'مرتجع' },
  refunded: { en: 'Refunded', ar: 'مسترد' },
  failed: { en: 'Failed', ar: 'فشل' },
};

const PAYMENT_STATUS: Record<string, { en: string; ar: string }> = {
  paid: { en: 'Paid', ar: 'مدفوع' },
  unpaid: { en: 'Unpaid', ar: 'غير مدفوع' },
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  refunded: { en: 'Refunded', ar: 'مسترد' },
  failed: { en: 'Failed', ar: 'فشل' },
  partial: { en: 'Partial', ar: 'جزئي' },
};

const SHIPPING_STATUS: Record<string, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  'in transit': { en: 'In Transit', ar: 'قيد النقل' },
  in_transit: { en: 'In Transit', ar: 'قيد النقل' },
  shipped: { en: 'Shipped', ar: 'تم الشحن' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  returned: { en: 'Returned', ar: 'مرتجع' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
};

type PaymentRule = { test: RegExp; en: string; ar: string };

const PAYMENT_RULES: PaymentRule[] = [
  { test: /cash|cod|استلام|عند الاستلام/i, en: 'Cash on Delivery', ar: 'الدفع عند الاستلام' },
  { test: /apple/i, en: 'Apple Pay', ar: 'آبل باي' },
  { test: /mada|مدى/i, en: 'Mada', ar: 'مدى' },
  { test: /tamara|تمارا/i, en: 'Tamara', ar: 'تمارا' },
  { test: /tabby|تابي/i, en: 'Tabby', ar: 'تابي' },
  { test: /stc/i, en: 'stc pay', ar: 'إس تي سي باي' },
  { test: /visa/i, en: 'Visa', ar: 'فيزا' },
  { test: /mastercard|master\s*card/i, en: 'Mastercard', ar: 'ماستركارد' },
  { test: /credit|card|بطاقة|بنكي/i, en: 'Credit Card', ar: 'بطاقة ائتمانية' },
  { test: /bank|تحويل/i, en: 'Bank Transfer', ar: 'تحويل بنكي' },
  { test: /wallet|محفظ/i, en: 'Digital Wallet', ar: 'محفظة رقمية' },
];

type ChannelRule = { test: RegExp; en: string; ar: string };

const CHANNEL_RULES: ChannelRule[] = [
  { test: /salla|سلة/i, en: 'Salla', ar: 'سلة' },
  { test: /woo|ووكومرس/i, en: 'WooCommerce', ar: 'ووكومرس' },
  { test: /zid|زد/i, en: 'Zid', ar: 'زد' },
  { test: /instagram|انستغرام|إنستغرام/i, en: 'Instagram', ar: 'إنستغرام' },
  { test: /tiktok|تيك\s*توك/i, en: 'TikTok', ar: 'تيك توك' },
  { test: /snapchat|سناب/i, en: 'Snapchat', ar: 'سناب شات' },
  { test: /facebook|فيسبوك/i, en: 'Facebook', ar: 'فيسبوك' },
  { test: /snapchat|سناب/i, en: 'Snapchat', ar: 'سناب شات' },
  { test: /google\s*ads|إعلانات جوجل|^google$/i, en: 'Google Ads', ar: 'إعلانات جوجل' },
  { test: /whatsapp|واتساب/i, en: 'WhatsApp', ar: 'واتساب' },
  { test: /organic|بحث\s*عضوي|بحث\s*مجاني/i, en: 'Organic Search', ar: 'بحث عضوي' },
  { test: /referral|إحالة/i, en: 'Referral', ar: 'إحالة' },
  { test: /app|mobile|تطبيق|جوال/i, en: 'Mobile App', ar: 'تطبيق الجوال' },
  { test: /pos|نقطة\s*بيع/i, en: 'POS', ar: 'نقطة البيع' },
  { test: /direct|مباشر/i, en: 'Direct', ar: 'مباشر' },
  { test: /storefront|online|store|متجر|إلكتروني/i, en: 'Online Store', ar: 'المتجر الإلكتروني' },
];

function pick(entry: { en: string; ar: string } | undefined, isAr: boolean, fallback: string): string {
  if (!entry) return fallback;
  return isAr ? entry.ar : entry.en;
}

export function localizeOrderStatus(status?: string | null, locale: LocaleLike = 'ar'): string {
  const isAr = locale === 'ar';
  const raw = (status || '').trim();
  if (!raw) return isAr ? 'قيد الانتظار' : 'Pending';
  const key = raw.toLowerCase().replace(/-/g, '_');
  const entry = ORDER_STATUS[key] || ORDER_STATUS[raw.toLowerCase()];
  if (entry) return pick(entry, isAr, raw);
  // Already localized bilingual chrome
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
  const mixed = localeMixedLabel(raw, isAr);
  for (const rule of PAYMENT_RULES) {
    if (rule.test.test(raw)) return isAr ? rule.ar : rule.en;
  }
  return mixed || raw;
}

export function localizeSalesChannel(source?: string | null, locale: LocaleLike = 'ar'): string {
  const isAr = locale === 'ar';
  const raw = (source || 'Storefront').trim();
  const mixed = localeMixedLabel(raw, isAr);
  for (const rule of CHANNEL_RULES) {
    if (rule.test.test(raw)) return isAr ? rule.ar : rule.en;
  }
  return mixed || (isAr ? 'المتجر الإلكتروني' : 'Online Store');
}

export function localizeShippingCompany(company?: string | null, locale: LocaleLike = 'ar'): string {
  const isAr = locale === 'ar';
  const raw = (company || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (/spl|بريد/.test(lower) || /البريد السعودي/.test(raw)) {
    return isAr ? 'البريد السعودي' : 'SPL';
  }
  if (/aramex|أرامكس/.test(lower)) return isAr ? 'أرامكس' : 'Aramex';
  if (/smsa|سمسا/.test(lower)) return isAr ? 'سمسا' : 'SMSA';
  if (/dhl/.test(lower)) return 'DHL';
  if (/مندوب/.test(raw)) return isAr ? 'مندوب خاص' : 'Private Courier';
  return localeMixedLabel(raw, isAr) || raw;
}
