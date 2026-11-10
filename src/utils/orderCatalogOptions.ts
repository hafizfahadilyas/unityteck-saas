/**
 * Single source of truth for Orders filters / dropdowns.
 * Arabic labels match merchant-approved Souq Orders chrome exactly.
 */

export type LabeledOption = { value: string; labelEn: string; labelAr: string };

/** حالة الطلب — Order Status (filter + change lists; All = filter-only) */
export const ORDER_STATUS_CATALOG: LabeledOption[] = [
  { value: 'draft', labelEn: 'Draft', labelAr: 'مسودة' },
  { value: 'deleted', labelEn: 'Deleted', labelAr: 'محذوف' },
  { value: 'pending', labelEn: 'Pending Payment', labelAr: 'بانتظار الدفع' },
  { value: 'partially_paid', labelEn: 'Partially Paid', labelAr: 'مدفوع جزئياً' },
  { value: 'pending_review', labelEn: 'Pending Review', labelAr: 'بانتظار المراجعة' },
  { value: 'processing', labelEn: 'Processing', labelAr: 'قيد التنفيذ' },
  { value: 'completed', labelEn: 'Completed', labelAr: 'تم التنفيذ' },
  { value: 'out_for_delivery', labelEn: 'Out for Delivery', labelAr: 'جاري التوصيل' },
  { value: 'delivered', labelEn: 'Delivered', labelAr: 'تم التوصيل' },
  { value: 'shipped', labelEn: 'Shipped', labelAr: 'تم الشحن' },
  { value: 'cancelled', labelEn: 'Cancelled', labelAr: 'ملغي' },
  { value: 'returned', labelEn: 'Returned', labelAr: 'مسترجع' },
  { value: 'return_in_progress', labelEn: 'Return in Progress', labelAr: 'قيد الإسترجاع' },
  { value: 'rfq', labelEn: 'Request for Quotation (RFQ)', labelAr: 'طلب عرض سعر' },
];

/** Filter chip for الكل / All — not a persisted order status */
export const ORDER_STATUS_FILTER_ALL: LabeledOption = {
  value: 'all',
  labelEn: 'All',
  labelAr: 'الكل',
};

/** مصدر / قناة الطلب — Order Source / Channel */
export const ORDER_SOURCE_CATALOG: LabeledOption[] = [
  { value: 'Direct', labelEn: 'Direct / Store', labelAr: 'مباشر / متجر' },
  { value: 'Website', labelEn: 'Website', labelAr: 'الموقع الإلكتروني' },
  { value: 'TikTok', labelEn: 'TikTok', labelAr: 'تيك توك' },
  { value: 'Snapchat', labelEn: 'Snapchat', labelAr: 'سناب شات' },
  { value: 'Instagram', labelEn: 'Instagram', labelAr: 'إنستغرام' },
  { value: 'WhatsApp', labelEn: 'WhatsApp', labelAr: 'واتساب' },
  { value: 'Facebook', labelEn: 'Facebook', labelAr: 'فيسبوك' },
  { value: 'X', labelEn: 'X (Twitter)', labelAr: 'إكس (تويتر)' },
  { value: 'Telegram', labelEn: 'Telegram', labelAr: 'تيليجرام' },
  { value: 'Google Ads', labelEn: 'Google Ads', labelAr: 'إعلانات جوجل' },
  { value: 'YouTube', labelEn: 'YouTube', labelAr: 'يوتيوب' },
  { value: 'Organic Search', labelEn: 'Organic Search', labelAr: 'بحث مجاني' },
  { value: 'Referral', labelEn: 'Referral', labelAr: 'إحالة' },
  { value: 'Other', labelEn: 'Other', labelAr: 'أخرى' },
];

/** شركة الشحن — Shipping Company */
export const SHIPPING_COMPANY_CATALOG: LabeledOption[] = [
  { value: 'Free Shipping', labelEn: 'Free Shipping', labelAr: 'شحن مجاني' },
  { value: 'J&T Express', labelEn: 'J&T Express', labelAr: 'جي اند تي اكسبريس' },
  { value: 'DHL Express', labelEn: 'DHL Express', labelAr: 'DHL Express' },
  { value: 'Aymakan', labelEn: 'Aymakan', labelAr: 'أي مكان' },
  { value: 'SMSA', labelEn: 'SMSA', labelAr: 'سمسا' },
  { value: 'Aramex', labelEn: 'Aramex', labelAr: 'أرامكس' },
  { value: 'Redbox', labelEn: 'Redbox', labelAr: 'ريدبوكس' },
];

/** حالة / طريقة الدفع — Payment Method */
export const PAYMENT_METHOD_CATALOG: LabeledOption[] = [
  { value: 'visa', labelEn: 'Visa', labelAr: 'فيزا' },
  { value: 'apple', labelEn: 'Apple Pay', labelAr: 'أبل باي' },
  { value: 'paypal', labelEn: 'PayPal', labelAr: 'باي بال' },
  { value: 'mada', labelEn: 'Mada', labelAr: 'مدى' },
  { value: 'customer_wallet', labelEn: 'Customer Wallet', labelAr: 'محفظة العميل' },
  { value: 'samsung', labelEn: 'Samsung Pay', labelAr: 'سامسونج باي' },
  { value: 'tamara', labelEn: 'Tamara', labelAr: 'تمارا' },
  { value: 'tabby', labelEn: 'Tabby', labelAr: 'تابي' },
  { value: 'mispay', labelEn: 'MIS Pay', labelAr: 'ام اي اس باي' },
  { value: 'madfoat', labelEn: 'Madfoat', labelAr: 'مدفوع' },
  { value: 'stc', labelEn: 'stc pay', labelAr: 'أس تي سي باي' },
  { value: 'googlepay', labelEn: 'Google Pay', labelAr: 'جوجل باي' },
  { value: 'bank', labelEn: 'Bank Transfer', labelAr: 'تحويل بنكي' },
];

export function catalogLabel(opt: LabeledOption, isAr: boolean): string {
  return isAr ? opt.labelAr : opt.labelEn;
}

export function findCatalogLabel(
  list: LabeledOption[],
  value: string | null | undefined,
  isAr: boolean,
): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const hit =
    list.find((o) => o.value.toLowerCase() === raw.toLowerCase()) ||
    list.find(
      (o) =>
        o.labelEn.toLowerCase() === raw.toLowerCase() ||
        o.labelAr === raw ||
        raw.toLowerCase().includes(o.value.toLowerCase()),
    );
  return hit ? catalogLabel(hit, isAr) : raw;
}
