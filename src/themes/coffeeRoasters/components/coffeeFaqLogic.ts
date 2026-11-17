/** Pure FAQ helpers — node-test safe (items from theme settings only). */

import type { FaqItem, FaqSettings } from '../../settings/coffeeModularSettings';

export type FaqPreviewDevice = 'desktop' | 'tablet' | 'mobile';

export const FAQ_MAX_ITEMS = 40;

export function faqShowsOnDevice(
  settings: FaqSettings | null | undefined,
  device: FaqPreviewDevice,
): boolean {
  if (!settings || settings.enabled === false) return false;
  if (device === 'desktop') return settings.showOnDesktop !== false;
  if (device === 'tablet') return settings.showOnTablet !== false;
  return settings.showOnMobile !== false;
}

/** Visible rows: enabled + at least one locale question filled. */
export function visibleFaqItems(settings: FaqSettings | null | undefined): FaqItem[] {
  if (!settings || settings.enabled === false) return [];
  return (settings.items || []).filter((it) => {
    if (it.enabled === false) return false;
    return Boolean((it.qEn || '').trim() || (it.qAr || '').trim());
  });
}

export function blankFaqItem(partial?: Partial<FaqItem>): FaqItem {
  return {
    id: partial?.id || `faq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    enabled: partial?.enabled !== false,
    qEn: partial?.qEn || '',
    qAr: partial?.qAr || '',
    aEn: partial?.aEn || '',
    aAr: partial?.aAr || '',
  };
}

export function duplicateFaqItem(item: FaqItem): FaqItem {
  return blankFaqItem({
    ...item,
    id: undefined,
    qEn: item.qEn ? `${item.qEn} (copy)` : '',
    qAr: item.qAr ? `${item.qAr} (نسخة)` : '',
  });
}

export function reorderFaqItems(items: FaqItem[], from: number, to: number): FaqItem[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items;
  const next = items.slice();
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}
