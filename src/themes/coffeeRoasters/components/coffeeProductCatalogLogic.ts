/** Pure Product Catalog / shop helpers — node-test safe. */

import type { ShopCatalogSettings, ShopCatalogSort } from '../../settings/coffeeModularSettings';

export type CatalogPreviewDevice = 'desktop' | 'tablet' | 'mobile';

function shopOrEmpty(settings?: ShopCatalogSettings | null): ShopCatalogSettings {
  return {
    columnsDesktop: 4,
    columnsTablet: 3,
    columnsMobile: 2,
    perPage: 24,
    defaultSort: 'featured',
    showFilters: true,
    ...(settings || {}),
  };
}

export type CatalogProductLike = {
  id: string;
  name?: string;
  nameAr?: string;
  category?: string;
  basePrice?: number;
  price?: number;
  originalPrice?: number | null;
  rating?: number;
  stock?: number;
  isFeatured?: boolean;
  featured?: boolean;
  salesCount?: number;
  soldCount?: number;
  image?: string;
  images?: string[];
  tagline?: string;
  taglineAr?: string;
  giftText?: string;
  giftTextAr?: string;
  installmentText?: string;
  installmentTextAr?: string;
};

export function catalogShowsOnDevice(
  settings: ShopCatalogSettings | null | undefined,
  device: CatalogPreviewDevice,
): boolean {
  const s = shopOrEmpty(settings);
  if (s.enabled === false) return false;
  if (device === 'desktop') return s.showOnDesktop !== false;
  if (device === 'tablet') return s.showOnTablet !== false;
  return s.showOnMobile !== false;
}

export function catalogColumns(
  settings: ShopCatalogSettings | null | undefined,
  device: CatalogPreviewDevice,
): number {
  const s = shopOrEmpty(settings);
  if (device === 'mobile') return Math.max(1, Math.min(2, s.columnsMobile || 2));
  if (device === 'tablet') return Math.max(2, Math.min(4, s.columnsTablet || 3));
  return Math.max(2, Math.min(4, s.columnsDesktop || 4));
}

export function catalogPerPage(settings: ShopCatalogSettings | null | undefined): number {
  const n = Number(settings?.perPage);
  if (!Number.isFinite(n) || n < 4) return 24;
  return Math.min(48, Math.floor(n));
}

export function shopCardFlags(settings?: Partial<ShopCatalogSettings> | null) {
  return {
    showPrice: settings?.showPrice !== false,
    showOriginalPrice: settings?.showOriginalPrice !== false,
    showGiftLabel: settings?.showGiftLabel !== false,
    showInstallment: settings?.showInstallment !== false,
    showStock: settings?.showStock !== false,
    showBuyNow: settings?.showBuyNow !== false,
    showAddToCart: settings?.showAddToCart !== false,
    showLearnMore: settings?.showLearnMore !== false,
    showWishlist: settings?.showWishlist === true,
    showCompare: settings?.showCompare === true,
    showProductDescription: settings?.showProductDescription === true,
  };
}

function salesOf(p: CatalogProductLike): number {
  const n = Number(p.salesCount ?? p.soldCount);
  return Number.isFinite(n) ? n : 0;
}

export function sortCatalogProducts(
  rows: CatalogProductLike[],
  sort: ShopCatalogSort | undefined,
): CatalogProductLike[] {
  const list = rows.slice();
  const mode = sort || 'featured';
  if (mode === 'price-asc') {
    return list.sort((a, b) => (Number(a.basePrice ?? a.price) || 0) - (Number(b.basePrice ?? b.price) || 0));
  }
  if (mode === 'price-desc') {
    return list.sort((a, b) => (Number(b.basePrice ?? b.price) || 0) - (Number(a.basePrice ?? a.price) || 0));
  }
  if (mode === 'rating') {
    return list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  }
  if (mode === 'name-asc') {
    return list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }
  if (mode === 'best_selling') {
    const ranked = list.filter((p) => salesOf(p) > 0).sort((a, b) => salesOf(b) - salesOf(a));
    return ranked;
  }
  if (mode === 'newest') {
    return list.slice().reverse();
  }
  // featured: featured first, then original order
  return list.sort((a, b) => {
    const af = a.isFeatured || a.featured ? 1 : 0;
    const bf = b.isFeatured || b.featured ? 1 : 0;
    return bf - af;
  });
}

export function filterCatalogProducts(
  rows: CatalogProductLike[],
  opts: {
    categoryId?: string;
    maxPrice?: number;
    onlyInStock?: boolean;
  },
): CatalogProductLike[] {
  const cat = (opts.categoryId || 'all').toLowerCase().trim();
  return rows.filter((p) => {
    if (cat && cat !== 'all') {
      const pc = String(p.category || '').toLowerCase();
      if (!(pc === cat || pc.includes(cat) || cat.includes(pc))) return false;
    }
    if (opts.maxPrice != null && Number.isFinite(opts.maxPrice)) {
      const price = Number(p.basePrice ?? p.price) || 0;
      if (price > opts.maxPrice) return false;
    }
    if (opts.onlyInStock) {
      if (typeof p.stock === 'number' && p.stock <= 0) return false;
    }
    return true;
  });
}

export type CatalogCategoryChip = { id: string; nameEn: string; nameAr: string; count: number };

export function buildCatalogCategories(rows: CatalogProductLike[]): CatalogCategoryChip[] {
  const map = new Map<string, CatalogCategoryChip>();
  map.set('all', { id: 'all', nameEn: 'All Products', nameAr: 'جميع المنتجات', count: rows.length });
  for (const p of rows) {
    const id = String(p.category || '').trim() || 'other';
    const prev = map.get(id);
    if (prev) prev.count += 1;
    else map.set(id, { id, nameEn: id, nameAr: id, count: 1 });
  }
  return Array.from(map.values());
}
