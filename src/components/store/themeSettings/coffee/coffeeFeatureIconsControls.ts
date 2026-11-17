import type { EnhancedFeatureItem } from '../../../../themes/coffeeRoasters/components/coffeeFeatureIconsLogic';

export const FEATURE_ICONS_MAX_ITEMS = 4;

export function blankFeatureItem(): EnhancedFeatureItem {
  return {
    id: `cf-${Date.now()}`,
    icon: 'Truck',
    mediaType: 'icon',
    title: '',
    titleEn: '',
    titleAr: '',
    description: '',
    descriptionEn: '',
    descriptionAr: '',
    linkType: 'none',
    linkUrl: '',
    iconBg: '#FFFFFF',
    iconColor: '#111111',
    iconSize: 40,
    iconShape: 'rounded',
    enabled: true,
    showDesktop: true,
    showTablet: true,
    showMobile: true,
  };
}

export function reorderFeatureItems(items: EnhancedFeatureItem[], from: number, to: number): EnhancedFeatureItem[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function duplicateFeatureItem(item: EnhancedFeatureItem): EnhancedFeatureItem {
  return {
    ...item,
    id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    enabled: item.enabled !== false,
  };
}
