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

/** Card chrome + typography for Category Showcase / equipment rail (defaults match locked HiBrew). */
export function resolveShowcaseCardChrome(
  settings: FeaturedCategoriesProductsSettings | null | undefined,
) {
  const section = (settings?.sections || []).find((s) => s.enabled !== false);
  const maxVisible = Math.max(1, Math.min(CATEGORY_SHOWCASE_MAX_PRODUCTS, settings?.maxVisibleProducts || 5));
  return {
    buyLabelEn: (settings?.buyLabelEn || '').trim() || 'Buy',
    buyLabelAr: (settings?.buyLabelAr || '').trim() || 'شراء',
    learnMoreLabelEn: (settings?.learnMoreLabelEn || '').trim() || 'Learn More',
    learnMoreLabelAr: (settings?.learnMoreLabelAr || '').trim() || 'تعرف على المزيد',
    titleFontSizePx: Math.max(11, Math.min(28, settings?.titleFontSizePx || 16)),
    titleColor: settings?.titleColor || '#171717',
    taglineFontSizePx: Math.max(10, Math.min(20, settings?.taglineFontSizePx || 13)),
    taglineColor: settings?.taglineColor || '#525252',
    priceFontSizePx: Math.max(11, Math.min(28, settings?.priceFontSizePx || 15)),
    priceColor: settings?.priceColor || '#171717',
    ctaFontSizePx: Math.max(10, Math.min(18, settings?.ctaFontSizePx || 12)),
    buyColor: settings?.buyColor || '#171717',
    learnMoreColor: settings?.learnMoreColor || '#171717',
    equalCardHeights: settings?.equalCardHeights !== false,
    showMoreProducts: settings?.showMoreProducts !== false && section?.showViewMore !== false,
    moreProductsEn:
      (settings?.moreProductsEn || '').trim() ||
      (section?.viewMoreEn || '').trim() ||
      'More Products',
    moreProductsAr:
      (settings?.moreProductsAr || '').trim() ||
      (section?.viewMoreAr || '').trim() ||
      'المزيد من المنتجات',
    moreProductsUrl:
      (settings?.moreProductsUrl || section?.viewMoreLink || 'products').trim() || 'products',
    maxVisibleProducts: maxVisible,
    bgColor: settings?.bgColor || '#F9F9F9',
    cardRadius: settings?.cardStyle === 'square' ? 0 : 28,
  };
}

/** Resolve More Products link — default coffee shop page (`products`). */
export function resolveShowcaseShopTarget(url: string | null | undefined): 'products' | { href: string } {
  const raw = (url || '').trim();
  if (!raw || raw === 'products' || raw === 'shop' || raw === '/products' || raw === '/shop') {
    return 'products';
  }
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return { href: raw };
  return 'products';
}
