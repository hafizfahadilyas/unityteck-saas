/** Pure Product Carousel helpers — node-test safe (no React). */

import type {
  ProductCarouselItem,
  ProductCarouselSettings,
} from '../../settings/coffeeModularSettings';
import {
  normalizeProductSource,
  resolveProductsBySource,
} from './coffeeProductSourceLogic';

export const PRODUCT_CAROUSEL_MAX_ITEMS = 20;

export type CarouselCatalogProduct = {
  id: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  category?: string;
  brand?: string | null;
  stock?: number;
  price?: number;
  basePrice?: number;
  originalPrice?: number | null;
  discountedPrice?: number | null;
  image?: string;
  imageUrl?: string | null;
  images?: string[];
  galleryUrls?: string[];
  colors?: { image?: string; hex?: string; name?: string; nameAr?: string }[];
  isFeatured?: boolean;
  featured?: boolean;
  salesCount?: number;
  soldCount?: number;
  createdAt?: string | number | null;
};

export function blankCarouselItem(partial?: Partial<ProductCarouselItem>): ProductCarouselItem {
  return {
    id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: '',
    enabled: true,
    nameEn: '',
    nameAr: '',
    promoTagEn: '',
    promoTagAr: '',
    imageUrl: '',
    gallery: [],
    productLink: '',
    showOptions: true,
    colors: [],
    storage: [],
    otherOptions: [],
    originalPrice: null,
    discountedPrice: null,
    showOriginalPrice: true,
    showBuyNow: true,
    buyNowEn: 'Buy Now',
    buyNowAr: 'اشتر الآن',
    showAddToCart: true,
    addToCartEn: 'Add to Cart',
    addToCartAr: 'أضف إلى السلة',
    showLearnMore: true,
    learnMoreEn: 'Learn More',
    learnMoreAr: 'اعرف المزيد',
    learnMoreLinkType: 'product',
    learnMoreUrl: '',
    learnMoreOpenIn: 'same',
    ...partial,
  };
}

export function reorderCarouselItems(items: ProductCarouselItem[], from: number, to: number): ProductCarouselItem[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function duplicateCarouselItem(item: ProductCarouselItem): ProductCarouselItem {
  return {
    ...item,
    id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    colors: (item.colors || []).map((c) => ({ ...c, id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })),
    storage: (item.storage || []).map((s) => ({ ...s, id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })),
    otherOptions: (item.otherOptions || []).map((o) => ({ ...o, id: `o-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })),
    gallery: [...(item.gallery || [])],
  };
}

export function matchCarouselCategory(category: string | undefined, categoryId: string): boolean {
  if (!categoryId || categoryId === 'all') return true;
  const cat = (category || '').toLowerCase().trim();
  const id = categoryId.toLowerCase().trim();
  if (!cat) return false;
  if (cat === id || cat.includes(id) || id.includes(cat)) return true;
  const aliases: Record<string, string[]> = {
    machines: ['machine', 'espresso', 'مكائن', 'اسبريسو', 'إسبريسو'],
    mills: ['mill', 'grinder', 'مطاحن', 'مطحنة'],
    cabinets: ['cabinet', 'bar', 'خزائن', 'خزانة', 'أركان', 'دواليب'],
    accessories: ['accessor', 'barista', 'مستلزم', 'أكواب', 'إكسسوار'],
    offers: ['offer', 'bundle', 'عروض', 'باقات'],
  };
  const keys = aliases[id] || [id];
  return keys.some((k) => cat.includes(k));
}

export function catalogProductImage(p: CarouselCatalogProduct): string {
  return (
    p.colors?.[0]?.image ||
    p.images?.[0] ||
    p.galleryUrls?.[0] ||
    p.imageUrl ||
    p.image ||
    ''
  ).trim();
}

export function itemDisplayName(item: ProductCarouselItem, lang: 'en' | 'ar', catalog?: CarouselCatalogProduct | null): string {
  if (lang === 'ar') {
    return (item.nameAr || catalog?.nameAr || item.nameEn || catalog?.nameEn || catalog?.name || '').trim();
  }
  return (item.nameEn || catalog?.nameEn || catalog?.name || item.nameAr || catalog?.nameAr || '').trim();
}

export function itemDisplayImage(item: ProductCarouselItem, catalog?: CarouselCatalogProduct | null): string {
  return (item.imageUrl || catalogProductImage(catalog || {}) || '').trim();
}

export function itemHasRenderableContent(item: ProductCarouselItem, catalog?: CarouselCatalogProduct | null): boolean {
  if (item.enabled === false) return false;
  const name = itemDisplayName(item, 'en', catalog) || itemDisplayName(item, 'ar', catalog);
  const image = itemDisplayImage(item, catalog);
  const linked = Boolean((item.productId || '').trim() && catalog);
  return Boolean(name || image || linked);
}

/** Visible carousel cards: productSource filter, else manual items, else category slice. */
export function resolveCarouselCards(
  settings: ProductCarouselSettings | null | undefined,
  catalog: CarouselCatalogProduct[],
): { kind: 'manual' | 'catalog'; cards: Array<{ item: ProductCarouselItem; catalog: CarouselCatalogProduct | null }> } {
  if (!settings?.enabled) return { kind: 'manual', cards: [] };

  const byId = new Map(catalog.map((p) => [p.id, p]));
  const items = (settings.items || []).filter((it) => it.enabled !== false);

  if (settings.productSource?.mode) {
    const cfg = normalizeProductSource({
      productSource: settings.productSource,
      categoryId: settings.categoryId,
      productCount: settings.productCount,
      items,
    });
    // Selected mode with curated item rows keeps full card overrides.
    if (cfg.mode === 'selected' && items.length > 0 && !(settings.productSource.productIds || []).length) {
      const cards = items
        .map((item) => {
          const hit = item.productId ? byId.get(item.productId) || null : null;
          return { item, catalog: hit };
        })
        .filter(({ item, catalog: hit }) => itemHasRenderableContent(item, hit))
        .slice(0, PRODUCT_CAROUSEL_MAX_ITEMS);
      return { kind: 'manual', cards };
    }
    const resolved = resolveProductsBySource(cfg, catalog).slice(0, PRODUCT_CAROUSEL_MAX_ITEMS);
    const cards = resolved.map((p) => {
      const curated = items.find((it) => it.productId === p.id);
      if (curated) return { item: curated, catalog: p };
      return {
        item: blankCarouselItem({
          id: `auto-${p.id}`,
          productId: p.id,
          nameEn: p.nameEn || p.name || '',
          nameAr: p.nameAr || '',
          imageUrl: catalogProductImage(p),
          originalPrice: p.originalPrice ?? p.basePrice ?? p.price ?? null,
          discountedPrice: p.discountedPrice ?? null,
        }),
        catalog: p,
      };
    });
    return { kind: cfg.mode === 'selected' ? 'manual' : 'catalog', cards };
  }

  if (items.length > 0) {
    const cards = items
      .map((item) => {
        const hit = item.productId ? byId.get(item.productId) || null : null;
        return { item, catalog: hit };
      })
      .filter(({ item, catalog: hit }) => itemHasRenderableContent(item, hit))
      .slice(0, PRODUCT_CAROUSEL_MAX_ITEMS);
    return { kind: 'manual', cards };
  }

  const cfg = normalizeProductSource({
    categoryId: settings.categoryId,
    productCount: settings.productCount,
  });
  const filtered = resolveProductsBySource(cfg, catalog).slice(0, PRODUCT_CAROUSEL_MAX_ITEMS);
  const cards = filtered.map((p) => ({
    item: blankCarouselItem({
      id: `auto-${p.id}`,
      productId: p.id,
      nameEn: p.nameEn || p.name || '',
      nameAr: p.nameAr || '',
      imageUrl: catalogProductImage(p),
      originalPrice: p.originalPrice ?? p.basePrice ?? p.price ?? null,
      discountedPrice: p.discountedPrice ?? null,
    }),
    catalog: p,
  }));
  return { kind: 'catalog', cards };
}

export function cardWidthForDevice(
  settings: ProductCarouselSettings | null | undefined,
  device: 'desktop' | 'tablet' | 'mobile',
): number {
  const cols =
    device === 'mobile'
      ? settings?.productsPerRowMobile || 1
      : device === 'tablet'
        ? settings?.productsPerRowTablet || 2
        : settings?.productsPerRowDesktop || 3;
  const gap = settings?.itemSpacing ?? 16;
  const totalGaps = Math.max(0, cols - 1) * gap;
  const frame = device === 'mobile' ? 260 : device === 'tablet' ? 420 : 640;
  return Math.max(140, Math.floor((frame - totalGaps) / cols));
}
