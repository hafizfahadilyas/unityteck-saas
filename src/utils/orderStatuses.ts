import type { OrderStatus } from '../types';
import { ORDER_STATUS_CATALOG } from './orderCatalogOptions';

/** Canonical order statuses — same list everywhere (table, bulk, edit, details, master). */
export const ORDER_STATUS_CHANGE_OPTIONS: {
  value: OrderStatus;
  labelEn: string;
  labelAr: string;
}[] = ORDER_STATUS_CATALOG.map((o) => ({
  value: o.value as OrderStatus,
  labelEn: o.labelEn,
  labelAr: o.labelAr,
}));

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
  const canonical = ORDER_STATUS_CHANGE_OPTIONS.map((o) => ({
    value: o.value,
    labelEn: o.labelEn,
    labelAr: o.labelAr,
    active: true,
  }));
  if (!storeId) return canonical;
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
        const fromStore: StoreOrderStatusOption[] = parsed
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
        const seen = new Set(fromStore.map((s) => s.value));
        // Merge newly added canonical statuses (draft / deleted / …) if store cache is older
        for (const opt of canonical) {
          if (!seen.has(opt.value)) {
            fromStore.push({
              value: opt.value,
              labelEn: opt.labelEn,
              labelAr: opt.labelAr,
              active: true,
            });
          }
        }
        return fromStore;
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return canonical;
}

export function orderStatusOptionLabel(value: string, isAr: boolean, storeId?: string | null): string {
  const fromStore = getStoreOrderStatusOptions(storeId).find((o) => o.value === value);
  if (fromStore) return isAr ? fromStore.labelAr : fromStore.labelEn;
  const hit = ORDER_STATUS_CHANGE_OPTIONS.find((o) => o.value === value);
  if (hit) return isAr ? hit.labelAr : hit.labelEn;
  return value;
}
