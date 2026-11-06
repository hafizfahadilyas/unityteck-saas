import type { CartItem } from './types';

export function cartChoiceLine(item: CartItem, isAr: boolean): string {
  if (item.optionSummary) return item.optionSummary;
  const color = isAr && item.selectedColor?.nameAr ? item.selectedColor.nameAr : item.selectedColor?.name || '';
  const storage = item.selectedStorage?.capacity || '';
  return [color, storage].filter(Boolean).join(' · ');
}
