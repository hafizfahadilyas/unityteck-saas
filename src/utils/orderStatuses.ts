import type { OrderStatus } from '../types';

/** Canonical order statuses — same list everywhere (table, bulk, edit, details, master). */
export const ORDER_STATUS_CHANGE_OPTIONS: {
  value: OrderStatus;
  labelEn: string;
  labelAr: string;
}[] = [
  { value: 'pending', labelEn: 'Pending Payment', labelAr: 'بانتظار الدفع' },
  { value: 'processing', labelEn: 'Processing', labelAr: 'قيد المعالجة' },
  { value: 'preparing', labelEn: 'Preparing', labelAr: 'قيد التجهيز' },
  { value: 'shipped', labelEn: 'Shipped', labelAr: 'تم الشحن' },
  { value: 'out_for_delivery', labelEn: 'Out for Delivery', labelAr: 'جاري التوصيل' },
  { value: 'delivered', labelEn: 'Delivered', labelAr: 'تم التوصيل' },
  { value: 'completed', labelEn: 'Completed', labelAr: 'مكتمل' },
  { value: 'cancellation_requested', labelEn: 'Cancel Requested', labelAr: 'طلب إلغاء' },
  { value: 'cancelled', labelEn: 'Cancelled', labelAr: 'ملغي' },
  { value: 'returned', labelEn: 'Returned', labelAr: 'مسترجع' },
  { value: 'refunded', labelEn: 'Refunded', labelAr: 'مسترد' },
];

export function orderStatusOptionLabel(
  value: string,
  isAr: boolean,
): string {
  const hit = ORDER_STATUS_CHANGE_OPTIONS.find((o) => o.value === value);
  if (hit) return isAr ? hit.labelAr : hit.labelEn;
  return value;
}
