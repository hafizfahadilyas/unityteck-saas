/** Pure Product Collection helpers — node-test safe (≠ productSlider / PCB). */

import type {
  ProductCollectionBenefit,
  ProductCollectionSettings,
  ProductSliderItem,
  ProductSliderSource,
} from '../../settings/coffeeModularSettings';

export type ProductCollectionDevice = 'desktop' | 'tablet' | 'mobile';

export const PRODUCT_COLLECTION_MAX_ITEMS = 24;
export const PRODUCT_COLLECTION_MAX_BENEFITS = 12;

export type CollectionCatalogProduct = {
  id: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  category?: string;
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
  tagline?: string;
  taglineAr?: string;
  overview?: string;
  overviewAr?: string;
};

function matchCategory(category: string | undefined, categoryId: string): boolean {
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

function catalogImage(p: CollectionCatalogProduct | null | undefined): string {
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

export function productCollectionShowsOnDevice(
  settings: ProductCollectionSettings | null | undefined,
  device: ProductCollectionDevice,
): boolean {
  if (!settings || settings.enabled === false) return false;
  if (device === 'desktop') return settings.showOnDesktop !== false;
  if (device === 'tablet') return settings.showOnTablet !== false;
  return settings.showOnMobile !== false;
}

export function blankProductCollectionBenefit(
  partial?: Partial<ProductCollectionBenefit>,
): ProductCollectionBenefit {
  return {
    id:
      partial?.id ||
      `pcoll-ben-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    enabled: partial?.enabled !== false,
    icon: partial?.icon || 'Star',
    titleEn: partial?.titleEn || '',
    titleAr: partial?.titleAr || '',
    descriptionEn: partial?.descriptionEn || '',
    descriptionAr: partial?.descriptionAr || '',
  };
}

export function duplicateProductCollectionBenefit(
  item: ProductCollectionBenefit,
): ProductCollectionBenefit {
  return blankProductCollectionBenefit({
    ...item,
    id: undefined,
    titleEn: item.titleEn ? `${item.titleEn} (copy)` : '',
    titleAr: item.titleAr ? `${item.titleAr} (نسخة)` : '',
  });
}

export function reorderProductCollectionBenefits(
  items: ProductCollectionBenefit[],
  from: number,
  to: number,
): ProductCollectionBenefit[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function blankProductCollectionItem(partial?: Partial<ProductSliderItem>): ProductSliderItem {
  return {
    id: `pcoll-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
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

export function visibleProductCollectionBenefits(
  settings: ProductCollectionSettings | null | undefined,
): ProductCollectionBenefit[] {
  if (!settings || settings.showBenefitBoxes === false) return [];
  return (settings.benefits || []).filter((b) => {
    if (b.enabled === false) return false;
    return Boolean((b.titleEn || '').trim() || (b.titleAr || '').trim());
  });
}

export function promoHasContent(settings: ProductCollectionSettings | null | undefined): boolean {
  if (!settings || settings.showPromoCard === false || settings.promo?.enabled === false) return false;
  const p = settings.promo;
  if (!p) return false;
  return Boolean(
    (p.titleEn || '').trim() ||
      (p.titleAr || '').trim() ||
      (p.badgeEn || '').trim() ||
      (p.badgeAr || '').trim() ||
      (p.image || '').trim(),
  );
}

export function collectionUsesSlider(style: ProductCollectionSettings['sectionStyle'] | undefined): boolean {
  return style === 'promo_slider' || style === 'promo_slider_benefits' || !style;
}

export function collectionShowsPromo(style: ProductCollectionSettings['sectionStyle'] | undefined): boolean {
  return style !== 'products_only';
}

export function collectionShowsBenefits(style: ProductCollectionSettings['sectionStyle'] | undefined): boolean {
  return style === 'promo_slider_benefits';
}

function itemHasContent(item: ProductSliderItem, catalog?: CollectionCatalogProduct | null): boolean {
  if (item.enabled === false) return false;
  const name = (item.nameEn || item.nameAr || catalog?.nameEn || catalog?.nameAr || catalog?.name || '').trim();
  const image = (item.image || catalogImage(catalog) || '').trim();
  const linked = Boolean((item.productId || '').trim() && catalog);
  return Boolean(name || image || linked);
}

export type ResolvedCollectionCard = {
  item: ProductSliderItem;
  catalog: CollectionCatalogProduct | null;
};

export function resolveProductCollectionCards(
  settings: ProductCollectionSettings | null | undefined,
  catalog: CollectionCatalogProduct[] = [],
): ResolvedCollectionCard[] {
  if (!settings || settings.enabled === false) return [];
  const countRaw = Number(settings.productCount);
  const count =
    !Number.isFinite(countRaw) || countRaw < 1
      ? 8
      : Math.min(PRODUCT_COLLECTION_MAX_ITEMS, Math.floor(countRaw));
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const source: ProductSliderSource = settings.sourceType || 'manual';

  if (source === 'manual') {
    return (settings.items || [])
      .filter((it) => it.enabled !== false)
      .map((item) => {
        const hit = item.productId ? byId.get(item.productId) || null : null;
        return { item, catalog: hit };
      })
      .filter(({ item, catalog: hit }) => itemHasContent(item, hit))
      .slice(0, PRODUCT_COLLECTION_MAX_ITEMS);
  }

  let list = catalog.slice();
  if (source === 'category') {
    list = list.filter((p) => matchCategory(p.category, settings.categoryId || ''));
  } else if (source === 'featured') {
    list = list.filter((p) => p.isFeatured === true || p.featured === true);
  } else if (source === 'best_selling') {
    list = list
      .filter((p) => Number(p.salesCount ?? p.soldCount) > 0)
      .sort((a, b) => Number(b.salesCount ?? b.soldCount ?? 0) - Number(a.salesCount ?? a.soldCount ?? 0));
  } else if (source === 'latest') {
    list = list.slice().reverse();
  }

  return list.slice(0, count).map((p) => ({
    item: blankProductCollectionItem({
      id: `auto-${p.id}`,
      productId: p.id,
      nameEn: p.nameEn || p.name || '',
      nameAr: p.nameAr || '',
      descriptionEn: p.tagline || p.overview || '',
      descriptionAr: p.taglineAr || p.overviewAr || '',
      image: catalogImage(p),
      price: p.discountedPrice ?? p.basePrice ?? p.price ?? null,
      originalPrice: p.originalPrice ?? null,
      featured: p.isFeatured === true || p.featured === true,
    }),
    catalog: p,
  }));
}

export function collectionItemsPerView(
  settings: ProductCollectionSettings | null | undefined,
  device: ProductCollectionDevice,
): number {
  if (device === 'mobile') return Math.max(1, settings?.itemsPerViewMobile ?? 1);
  if (device === 'tablet') return Math.max(1, settings?.itemsPerViewTablet ?? 2);
  return Math.max(1, settings?.itemsPerViewDesktop ?? 3);
}

export function collectionHasVisibleContent(
  settings: ProductCollectionSettings | null | undefined,
  catalog: CollectionCatalogProduct[] = [],
): boolean {
  if (!settings || settings.enabled === false) return false;
  return resolveProductCollectionCards(settings, catalog).length > 0;
}
