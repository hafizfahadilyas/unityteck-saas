import type { CartItem } from './types';
import { buildCartLineSelectedOptions } from '../../utils/storefrontPurchase';

/** Short line under cart/checkout product name — every customer choice. */
export function cartChoiceLine(item: CartItem, isAr: boolean): string {
  const selected = buildCartLineSelectedOptions(item, isAr);
  const parts = Object.entries(selected).map(([k, v]) => `${k}: ${v}`);
  if (parts.length) return parts.join(' · ');
  if (item.optionSummary) return item.optionSummary;
  const color = isAr && item.selectedColor?.nameAr ? item.selectedColor.nameAr : item.selectedColor?.name || '';
  const storage = item.selectedStorage?.capacity || '';
  return [color, storage].filter(Boolean).join(' · ');
}
