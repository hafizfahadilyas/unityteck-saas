/**
 * Central product-type registry for store catalog filters / pickers.
 * Only `available: true` types appear in merchant UI (inactive stay hidden).
 * Matches Master product editor: Physical / Digital / Service.
 */

export type ProductTypeId =
  | 'physical'
  | 'custom_service'
  | 'digital'
  | 'bundle'
  | 'variable';

export interface ProductTypeDef {
  id: ProductTypeId;
  /** Stable filter / storage value */
  value: string;
  labelEn: string;
  labelAr: string;
  /** When false, hide from Filters / pickers until wired */
  available: boolean;
}

export const PRODUCT_TYPES: readonly ProductTypeDef[] = [
  {
    id: 'physical',
    value: 'Physical Product',
    labelEn: 'Physical Product',
    labelAr: 'منتج جاهز (مادي)',
    available: true,
  },
  {
    id: 'custom_service',
    value: 'Custom Service',
    labelEn: 'Custom Service',
    labelAr: 'خدمة مخصصة (تنسيق)',
    available: true,
  },
  {
    id: 'digital',
    value: 'Digital Product',
    labelEn: 'Digital Product',
    labelAr: 'منتج رقمي (قسيمة)',
    available: true,
  },
  {
    id: 'bundle',
    value: 'Product Bundle',
    labelEn: 'Product Bundle',
    labelAr: 'باقة مجمعة',
    available: false,
  },
  {
    id: 'variable',
    value: 'Variable Product',
    labelEn: 'Variable Product',
    labelAr: 'منتج متعدد الخيارات',
    available: false,
  },
] as const;

export function listAvailableProductTypes(): ProductTypeDef[] {
  return PRODUCT_TYPES.filter((t) => t.available);
}

export function listAllProductTypes(): readonly ProductTypeDef[] {
  return PRODUCT_TYPES;
}

export function getProductTypeLabel(value: string, isAr: boolean): string {
  const found = PRODUCT_TYPES.find(
    (t) =>
      t.value.toLowerCase() === String(value || '').toLowerCase() ||
      t.id === value ||
      t.labelEn.toLowerCase() === String(value || '').toLowerCase(),
  );
  if (!found) return value;
  return isAr ? found.labelAr : found.labelEn;
}
