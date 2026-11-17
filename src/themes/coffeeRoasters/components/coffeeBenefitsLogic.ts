/** Pure Benefits helpers — node-test safe. */

import type {
  ExclusiveBenefitButton,
  ExclusiveBenefitItem,
  ExclusiveBenefitsSettings,
} from '../../settings/coffeeModularSettings';

export const BENEFITS_MAX_ITEMS = 12;

export function blankBenefitButton(partial?: Partial<ExclusiveBenefitButton>): ExclusiveBenefitButton {
  return {
    id: `bb-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    enabled: true,
    labelEn: '',
    labelAr: '',
    style: 'primary',
    url: '',
    ...partial,
  };
}

export function blankBenefitItem(partial?: Partial<ExclusiveBenefitItem>): ExclusiveBenefitItem {
  return {
    id: `ben-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    enabled: true,
    unavailable: false,
    icon: 'ShieldCheck',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    buttons: [],
    ...partial,
  };
}

export function reorderBenefits(items: ExclusiveBenefitItem[], from: number, to: number): ExclusiveBenefitItem[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function duplicateBenefit(item: ExclusiveBenefitItem): ExclusiveBenefitItem {
  return {
    ...item,
    id: `ben-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    buttons: (item.buttons || []).map((b) => ({
      ...b,
      id: `bb-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    })),
  };
}

export function benefitHasContent(item: ExclusiveBenefitItem): boolean {
  return Boolean((item.titleEn || '').trim() || (item.titleAr || '').trim() || (item.descriptionEn || '').trim() || (item.descriptionAr || '').trim());
}

/** Storefront rows: hidden when enabled===false; unavailable stays visible (faded). */
export function visibleBenefitItems(settings: ExclusiveBenefitsSettings | null | undefined): ExclusiveBenefitItem[] {
  if (!settings || settings.enabled === false) return [];
  return (settings.items || []).filter((it) => it.enabled !== false && benefitHasContent(it));
}

export function benefitCardFaded(item: ExclusiveBenefitItem): boolean {
  return item.unavailable === true;
}
