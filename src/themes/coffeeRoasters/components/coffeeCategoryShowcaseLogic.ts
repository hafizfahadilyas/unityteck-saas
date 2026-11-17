/** Pure Category Showcase helpers — node-test safe. */

import type {
  CategoryShowcaseBanner,
  FeaturedCategoriesProductsSettings,
} from '../../settings/coffeeModularSettings';

export const CATEGORY_SHOWCASE_MAX_PRODUCTS = 20;
export const CATEGORY_SHOWCASE_MAX_BANNERS = 6;

export function blankShowcaseBanner(partial?: Partial<CategoryShowcaseBanner>): CategoryShowcaseBanner {
  return {
    id: `csb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    enabled: true,
    image: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    link: '',
    textAlign: 'bottom-left',
    overlay: 'dark',
    overlayOpacity: 50,
    textColor: '#FFFFFF',
    borderRadius: 16,
    ...partial,
  };
}

export function reorderByIndex<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function visibleShowcaseBanners(settings: FeaturedCategoriesProductsSettings | null | undefined): CategoryShowcaseBanner[] {
  if (!settings?.enabled) return [];
  return (settings.banners || []).filter((b) => b.enabled !== false && ((b.image || '').trim() || (b.titleEn || '').trim() || (b.titleAr || '').trim()));
}

export function resolveShowcaseProductIds(
  settings: FeaturedCategoriesProductsSettings | null | undefined,
): string[] {
  if (!settings?.enabled) return [];
  const top = (settings.productIds || []).filter(Boolean);
  if (top.length) return top.slice(0, CATEGORY_SHOWCASE_MAX_PRODUCTS);
  const section = (settings.sections || []).find((s) => s.enabled !== false);
  if (!section) return [];
  if (section.productSource === 'selected') {
    return (section.productIds || []).filter(Boolean).slice(0, CATEGORY_SHOWCASE_MAX_PRODUCTS);
  }
  return [];
}

export function spacingPx(spacing: 'small' | 'medium' | 'large' | undefined): number {
  if (spacing === 'small') return 8;
  if (spacing === 'large') return 24;
  return 16;
}

export function colsForDevice(
  settings: FeaturedCategoriesProductsSettings | null | undefined,
  device: 'desktop' | 'tablet' | 'mobile',
): number {
  if (device === 'mobile') return Math.max(1, settings?.productsPerRowMobile || 2);
  if (device === 'tablet') return Math.max(1, settings?.productsPerRowTablet || 3);
  return Math.max(1, settings?.productsPerRowDesktop || 5);
}
