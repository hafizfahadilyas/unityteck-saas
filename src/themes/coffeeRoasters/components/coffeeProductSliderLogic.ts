/** Pure Product Slider helpers — node-test safe (≠ productCarousel). */

import type {
  ProductSliderItem,
  ProductSliderSettings,
  ProductSliderSource,
} from '../../settings/coffeeModularSettings';
import {
  normalizeProductSource,
  resolveProductsBySource,
} from './coffeeProductSourceLogic';

export const PRODUCT_SLIDER_MAX_ITEMS = 24;

/** Local category match — keep slider independent of productCarousel module. */
function matchSliderCategory(category: string | undefined, categoryId: string): boolean {
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

export type ProductSliderDevice = 'desktop' | 'tablet' | 'mobile';

export type SliderCatalogProduct = {
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
  colors?: { image?: string }[];
  isFeatured?: boolean;
  featured?: boolean;
  salesCount?: number;
  soldCount?: number;
  createdAt?: string | number | null;
  tagline?: string;
  taglineAr?: string;
  overview?: string;
  overviewAr?: string;
};

export function blankProductSliderItem(partial?: Partial<ProductSliderItem>): ProductSliderItem {
  return {
    id: `psl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    enabled: true,
    productId: '',
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    image: '',
    price: null,
    originalPrice: null,
    productLink: '',
    showBuyNow: true,
    showAddToCart: true,
    featured: false,
    ...partial,
  };
}

export function duplicateProductSliderItem(item: ProductSliderItem): ProductSliderItem {
  return blankProductSliderItem({
    ...item,
    id: undefined,
    nameEn: item.nameEn ? `${item.nameEn} (copy)` : '',
    nameAr: item.nameAr ? `${item.nameAr} (نسخة)` : '',
  });
}

export function reorderProductSliderItems(
  items: ProductSliderItem[],
  from: number,
  to: number,
): ProductSliderItem[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function productSliderShowsOnDevice(
  settings: ProductSliderSettings | null | undefined,
  device: ProductSliderDevice,
): boolean {
  if (!settings || settings.enabled === false) return false;
  if (device === 'desktop') return settings.showOnDesktop !== false;
  if (device === 'tablet') return settings.showOnTablet !== false;
  return settings.showOnMobile !== false;
}

export function catalogProductImage(p: SliderCatalogProduct | null | undefined): string {
  if (!p) return '';
  return (
    p.colors?.[0]?.image ||
    p.images?.[0] ||
    p.galleryUrls?.[0] ||
    p.imageUrl ||
    p.image ||
    ''
  ).trim();
}

export function itemDisplayName(
  item: ProductSliderItem,
  lang: 'en' | 'ar',
  catalog?: SliderCatalogProduct | null,
): string {
  if (lang === 'ar') {
    return (item.nameAr || catalog?.nameAr || item.nameEn || catalog?.nameEn || catalog?.name || '').trim();
  }
  return (item.nameEn || catalog?.nameEn || catalog?.name || item.nameAr || catalog?.nameAr || '').trim();
}

export function itemDisplayImage(item: ProductSliderItem, catalog?: SliderCatalogProduct | null): string {
  const raw = (item.image || catalogProductImage(catalog) || '').trim();
  // Legacy white-marble / golden / JPG → current black-gold transparent PNG.
  // Dynamic import avoided — keep sync remap inline for slider perf.
  if (/ksa_almari_white_marble|ksa_almari_golden|ksa_almari_black_gold|hb_jeddah_blackgold|almari-white-marble/i.test(raw)) {
    return '/images/hb_jeddah_blackgold_cut_1125.png';
  }
  const m = raw.match(/^(.*\/images\/ksa_almari_[a-z0-9_]+)\.(jpe?g|webp)(\?.*)?$/i);
  return m ? `${m[1]}.png${m[3] || ''}` : raw;
}

export function itemDisplayPrice(
  item: ProductSliderItem,
  catalog?: SliderCatalogProduct | null,
): number | null {
  if (item.price != null && Number.isFinite(Number(item.price))) return Number(item.price);
  const fromCat = catalog?.discountedPrice ?? catalog?.basePrice ?? catalog?.price;
  if (fromCat != null && Number.isFinite(Number(fromCat))) return Number(fromCat);
  return null;
}

export function itemDisplayOriginal(
  item: ProductSliderItem,
  catalog?: SliderCatalogProduct | null,
): number | null {
  if (item.originalPrice != null && Number.isFinite(Number(item.originalPrice))) return Number(item.originalPrice);
  const fromCat = catalog?.originalPrice;
  if (fromCat != null && Number.isFinite(Number(fromCat))) return Number(fromCat);
  return null;
}

export function itemHasContent(item: ProductSliderItem, catalog?: SliderCatalogProduct | null): boolean {
  if (item.enabled === false) return false;
  const name = itemDisplayName(item, 'en', catalog) || itemDisplayName(item, 'ar', catalog);
  const image = itemDisplayImage(item, catalog);
  const linked = Boolean((item.productId || '').trim() && catalog);
  return Boolean(name || image || linked);
}

export function itemsPerView(
  settings: ProductSliderSettings | null | undefined,
  device: ProductSliderDevice,
): number {
  const n =
    device === 'mobile'
      ? settings?.itemsPerViewMobile
      : device === 'tablet'
        ? settings?.itemsPerViewTablet
        : settings?.itemsPerViewDesktop;
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return device === 'desktop' ? 4 : device === 'tablet' ? 2 : 1;
  return Math.min(6, Math.floor(v));
}

function clampCount(settings: ProductSliderSettings | null | undefined): number {
  const n = Number(settings?.productCount);
  if (!Number.isFinite(n) || n < 1) return 8;
  return Math.min(PRODUCT_SLIDER_MAX_ITEMS, Math.floor(n));
}

function isFeaturedProduct(p: SliderCatalogProduct): boolean {
  return p.isFeatured === true || p.featured === true;
}

function salesOf(p: SliderCatalogProduct): number {
  const n = Number(p.salesCount ?? p.soldCount);
  return Number.isFinite(n) ? n : 0;
}

export type ResolvedSliderCard = {
  item: ProductSliderItem;
  catalog: SliderCatalogProduct | null;
};

/** Resolve rail cards from productSource filter or legacy sourceType. Empty stays empty. */
export function resolveProductSliderCards(
  settings: ProductSliderSettings | null | undefined,
  catalog: SliderCatalogProduct[],
): ResolvedSliderCard[] {
  if (!settings || settings.enabled === false) return [];
  const count = clampCount(settings);
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const items = (settings.items || []).filter((it) => it.enabled !== false);

  if (settings.productSource?.mode) {
    const cfg = normalizeProductSource({
      productSource: settings.productSource,
      sourceType: settings.sourceType,
      categoryId: settings.categoryId,
      productCount: settings.productCount,
      items,
    });
    if (cfg.mode === 'selected' && items.length > 0 && !(settings.productSource.productIds || []).length) {
      return items
        .map((item) => {
          const hit = item.productId ? byId.get(item.productId) || null : null;
          return { item, catalog: hit };
        })
        .filter(({ item, catalog: hit }) => itemHasContent(item, hit))
        .slice(0, PRODUCT_SLIDER_MAX_ITEMS);
    }
    return resolveProductsBySource(cfg, catalog).slice(0, PRODUCT_SLIDER_MAX_ITEMS).map((p) => ({
      item: blankProductSliderItem({
        id: `auto-${p.id}`,
        productId: p.id,
        nameEn: p.nameEn || p.name || '',
        nameAr: p.nameAr || '',
        descriptionEn: p.tagline || p.overview || '',
        descriptionAr: p.taglineAr || p.overviewAr || '',
        image: catalogProductImage(p),
        price: p.discountedPrice ?? p.basePrice ?? p.price ?? null,
        originalPrice: p.originalPrice ?? null,
        featured: isFeaturedProduct(p),
      }),
      catalog: p,
    }));
  }

  const source: ProductSliderSource = settings.sourceType || 'manual';

  if (source === 'manual') {
    return items
      .map((item) => {
        const hit = item.productId ? byId.get(item.productId) || null : null;
        return { item, catalog: hit };
      })
      .filter(({ item, catalog: hit }) => itemHasContent(item, hit))
      .slice(0, PRODUCT_SLIDER_MAX_ITEMS);
  }

  let list = catalog.slice();
  if (source === 'category') {
    list = list.filter((p) => matchSliderCategory(p.category, settings.categoryId || ''));
  } else if (source === 'featured') {
    list = list.filter(isFeaturedProduct);
  } else if (source === 'best_selling') {
    const ranked = list.filter((p) => salesOf(p) > 0).sort((a, b) => salesOf(b) - salesOf(a));
    // No sales metrics → genuine empty (never invent ranks).
    list = ranked;
  } else if (source === 'latest') {
    list = list.slice().reverse();
  }

  return list.slice(0, count).map((p) => ({
    item: blankProductSliderItem({
      id: `auto-${p.id}`,
      productId: p.id,
      nameEn: p.nameEn || p.name || '',
      nameAr: p.nameAr || '',
      descriptionEn: p.tagline || p.overview || '',
      descriptionAr: p.taglineAr || p.overviewAr || '',
      image: catalogProductImage(p),
      price: p.discountedPrice ?? p.basePrice ?? p.price ?? null,
      originalPrice: p.originalPrice ?? null,
      featured: isFeaturedProduct(p),
    }),
    catalog: p,
  }));
}
