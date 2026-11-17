/** Pure Features Section helpers — node-test safe (≠ Feature Icons). */

import type {
  FeaturesSectionItem,
  FeaturesSectionSettings,
} from '../../settings/coffeeModularSettings';

export const FEATURES_SECTION_MAX_ITEMS = 12;

export type FeaturesPreviewDevice = 'desktop' | 'tablet' | 'mobile';

export function blankFeaturesSectionItem(partial?: Partial<FeaturesSectionItem>): FeaturesSectionItem {
  return {
    id: `feat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    enabled: true,
    icon: 'Star',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    ...partial,
  };
}

export function reorderFeaturesSectionItems(
  items: FeaturesSectionItem[],
  from: number,
  to: number,
): FeaturesSectionItem[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function duplicateFeaturesSectionItem(item: FeaturesSectionItem): FeaturesSectionItem {
  return {
    ...item,
    id: `feat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
}

export function featuresSectionItemHasContent(item: FeaturesSectionItem): boolean {
  return Boolean(
    (item.titleEn || '').trim() ||
      (item.titleAr || '').trim() ||
      (item.descriptionEn || '').trim() ||
      (item.descriptionAr || '').trim(),
  );
}

export function visibleFeaturesSectionItems(
  settings: FeaturesSectionSettings | null | undefined,
): FeaturesSectionItem[] {
  if (!settings || settings.enabled === false) return [];
  return (settings.items || []).filter((it) => it.enabled !== false && featuresSectionItemHasContent(it));
}

export function featuresSectionShowsOnDevice(
  settings: FeaturesSectionSettings | null | undefined,
  device: FeaturesPreviewDevice,
): boolean {
  if (!settings || settings.enabled === false) return false;
  if (device === 'desktop') return settings.showOnDesktop !== false;
  if (device === 'tablet') return settings.showOnTablet !== false;
  return settings.showOnMobile !== false;
}

export function featuresSectionColumns(
  settings: FeaturesSectionSettings | null | undefined,
  device: FeaturesPreviewDevice,
): number {
  if (!settings) return device === 'mobile' ? 1 : device === 'tablet' ? 2 : 3;
  if (device === 'mobile') return Math.max(1, Math.min(2, settings.columnsMobile || 1));
  if (device === 'tablet') return Math.max(1, Math.min(3, settings.columnsTablet || 2));
  return Math.max(1, Math.min(4, settings.columnsDesktop || 3));
}
