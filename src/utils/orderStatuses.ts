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

export interface StoreOrderStatusOption {
  value: string;
  labelEn: string;
  labelAr: string;
  active: boolean;
  colorHex?: string;
  systemKey?: string;
}

function statusesStorageKey(storeId: string) {
  return `store_order_statuses_${storeId}`;
}

/** Active custom/system statuses for a store (Customize Statuses tool). Falls back to canonical list. */
export function getStoreOrderStatusOptions(storeId?: string | null): StoreOrderStatusOption[] {
  if (!storeId) {
    return ORDER_STATUS_CHANGE_OPTIONS.map((o) => ({
      value: o.value,
      labelEn: o.labelEn,
      labelAr: o.labelAr,
      active: true,
    }));
  }
  try {
    const raw = localStorage.getItem(statusesStorageKey(storeId));
    if (raw) {
      const parsed = JSON.parse(raw) as Array<{
        active?: boolean;
        nameAr?: string;
        nameEn?: string;
        systemKey?: string;
        colorHex?: string;
        sortOrder?: number;
      }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .slice()
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          .filter((s) => s.active !== false)
          .map((s) => ({
            value: String(s.systemKey || s.nameEn || '').toLowerCase().replace(/[\s-]+/g, '_') || 'custom',
            labelEn: s.nameEn || s.systemKey || 'Status',
            labelAr: s.nameAr || s.nameEn || 'حالة',
            active: true,
            colorHex: s.colorHex,
            systemKey: s.systemKey,
          }));
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return ORDER_STATUS_CHANGE_OPTIONS.map((o) => ({
    value: o.value,
    labelEn: o.labelEn,
    labelAr: o.labelAr,
    active: true,
  }));
}

export function orderStatusOptionLabel(value: string, isAr: boolean, storeId?: string | null): string {
  const fromStore = getStoreOrderStatusOptions(storeId).find((o) => o.value === value);
  if (fromStore) return isAr ? fromStore.labelAr : fromStore.labelEn;
  const hit = ORDER_STATUS_CHANGE_OPTIONS.find((o) => o.value === value);
  if (hit) return isAr ? hit.labelAr : hit.labelEn;
  return value;
}
