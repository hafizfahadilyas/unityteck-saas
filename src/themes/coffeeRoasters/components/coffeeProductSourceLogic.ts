/**
 * Shared product source filter for coffee home / builder sections.
 * Modes: all · category · brand · selected · mix · featured · latest · best_selling
 * Empty catalog → empty list (no fake rows).
 */

export type CoffeeProductSourceMode =
  | 'all'
  | 'category'
  | 'brand'
  | 'selected'
  | 'mix'
  | 'featured'
  | 'latest'
  | 'best_selling';

export interface CoffeeProductSourceConfig {
  mode: CoffeeProductSourceMode;
  /** One or many category keys (slug / id / label). */
  categoryIds: string[];
  /** One or many brand names. */
  brandIds: string[];
  /** Manual product ids (single or multi). */
  productIds: string[];
  productCount: number;
}

export type SourceCatalogProduct = {
  id: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  category?: string;
  brand?: string | null;
  isFeatured?: boolean;
  featured?: boolean;
  salesCount?: number;
  soldCount?: number;
  createdAt?: string | number | null;
  stock?: number;
};

export const COFFEE_PRODUCT_SOURCE_MAX = 48;

export const COFFEE_PRODUCT_SOURCE_MODES: CoffeeProductSourceMode[] = [
  'all',
  'category',
  'brand',
  'selected',
  'mix',
  'featured',
  'latest',
  'best_selling',
];

export function emptyProductSource(partial?: Partial<CoffeeProductSourceConfig>): CoffeeProductSourceConfig {
  return {
    mode: 'all',
    categoryIds: [],
    brandIds: [],
    productIds: [],
    productCount: 8,
    ...partial,
  };
}

/** Map legacy single categoryId / sourceType / items → unified config. */
export function normalizeProductSource(input: {
  productSource?: Partial<CoffeeProductSourceConfig> | null;
  sourceType?: string | null;
  productSourceLegacy?: string | null;
  categoryId?: string | null;
  categoryIds?: string[] | null;
  brandIds?: string[] | null;
  productIds?: string[] | null;
  productCount?: number | null;
  items?: Array<{ productId?: string; enabled?: boolean }> | null;
}): CoffeeProductSourceConfig {
  const fromNested = input.productSource;
  if (fromNested && typeof fromNested === 'object' && fromNested.mode) {
    return emptyProductSource({
      mode: (COFFEE_PRODUCT_SOURCE_MODES.includes(fromNested.mode as CoffeeProductSourceMode)
        ? fromNested.mode
        : 'all') as CoffeeProductSourceMode,
      categoryIds: Array.isArray(fromNested.categoryIds)
        ? fromNested.categoryIds.map(String).filter(Boolean)
        : input.categoryId
          ? [String(input.categoryId)]
          : [],
      brandIds: Array.isArray(fromNested.brandIds) ? fromNested.brandIds.map(String).filter(Boolean) : [],
      productIds: Array.isArray(fromNested.productIds)
        ? fromNested.productIds.map(String).filter(Boolean)
        : Array.isArray(input.productIds)
          ? input.productIds.map(String).filter(Boolean)
          : [],
      productCount: Number(fromNested.productCount) > 0 ? Number(fromNested.productCount) : Number(input.productCount) || 8,
    });
  }

  const manualIds = (input.items || [])
    .filter((it) => it && it.enabled !== false && it.productId)
    .map((it) => String(it.productId));
  const selectedIds = Array.isArray(input.productIds)
    ? input.productIds.map(String).filter(Boolean)
    : [];
  const ids = selectedIds.length ? selectedIds : manualIds;
  const cats = Array.isArray(input.categoryIds)
    ? input.categoryIds.map(String).filter(Boolean)
    : input.categoryId
      ? [String(input.categoryId)]
      : [];
  const brands = Array.isArray(input.brandIds) ? input.brandIds.map(String).filter(Boolean) : [];
  const count = Number(input.productCount) > 0 ? Number(input.productCount) : 8;

  const legacy = String(input.sourceType || input.productSourceLegacy || '').trim();
  if (legacy === 'manual' || legacy === 'selected') {
    return emptyProductSource({ mode: 'selected', productIds: ids, categoryIds: cats, brandIds: brands, productCount: count });
  }
  if (legacy === 'category') {
    return emptyProductSource({ mode: 'category', categoryIds: cats, brandIds: brands, productIds: ids, productCount: count });
  }
  if (legacy === 'featured') {
    return emptyProductSource({ mode: 'featured', categoryIds: cats, brandIds: brands, productIds: ids, productCount: count });
  }
  if (legacy === 'latest') {
    return emptyProductSource({ mode: 'latest', categoryIds: cats, brandIds: brands, productIds: ids, productCount: count });
  }
  if (legacy === 'best_selling') {
    return emptyProductSource({ mode: 'best_selling', categoryIds: cats, brandIds: brands, productIds: ids, productCount: count });
  }
  if (ids.length > 0 && (cats.length > 0 || brands.length > 0)) {
    return emptyProductSource({ mode: 'mix', categoryIds: cats, brandIds: brands, productIds: ids, productCount: count });
  }
  if (ids.length > 0) {
    return emptyProductSource({ mode: 'selected', productIds: ids, productCount: count });
  }
  if (brands.length > 0 && cats.length === 0) {
    return emptyProductSource({ mode: 'brand', brandIds: brands, productCount: count });
  }
  if (cats.length > 0) {
    return emptyProductSource({ mode: 'category', categoryIds: cats, brandIds: brands, productCount: count });
  }
  return emptyProductSource({ mode: 'all', productCount: count });
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  machines: ['machine', 'espresso', 'مكائن', 'اسبريسو', 'إسبريسو'],
  mills: ['mill', 'grinder', 'مطاحن', 'مطحنة'],
  cabinets: ['cabinet', 'bar', 'خزائن', 'خزانة', 'أركان', 'دواليب'],
  accessories: ['accessor', 'barista', 'مستلزم', 'أكواب', 'إكسسوار'],
  offers: ['offer', 'bundle', 'عروض', 'باقات'],
};

export function matchSourceCategory(category: string | undefined, categoryId: string): boolean {
  if (!categoryId || categoryId === 'all') return true;
  const cat = (category || '').toLowerCase().trim();
  const id = categoryId.toLowerCase().trim();
  if (!cat) return false;
  if (cat === id || cat.includes(id) || id.includes(cat)) return true;
  const keys = CATEGORY_ALIASES[id] || [id];
  return keys.some((k) => cat.includes(k));
}

export function matchSourceBrand(brand: string | null | undefined, brandId: string): boolean {
  if (!brandId || brandId === 'all') return true;
  const b = (brand || '').toLowerCase().trim();
  const id = brandId.toLowerCase().trim();
  if (!b) return false;
  return b === id || b.includes(id) || id.includes(b);
}

export function uniqueCatalogCategories(catalog: SourceCatalogProduct[]): string[] {
  const set = new Set<string>();
  for (const p of catalog) {
    const c = String(p.category || '').trim();
    if (c) set.add(c);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function uniqueCatalogBrands(catalog: SourceCatalogProduct[]): string[] {
  const set = new Set<string>();
  for (const p of catalog) {
    const b = String(p.brand || '').trim();
    if (b) set.add(b);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function salesOf(p: SourceCatalogProduct): number {
  const n = Number(p.salesCount ?? p.soldCount);
  return Number.isFinite(n) ? n : 0;
}

function isFeatured(p: SourceCatalogProduct): boolean {
  return p.isFeatured === true || p.featured === true;
}

function clampCount(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 8;
  return Math.min(COFFEE_PRODUCT_SOURCE_MAX, Math.floor(n));
}

/**
 * Resolve product ids for a section from live catalog + source config.
 * Never invents ids — empty stays empty.
 */
export function resolveProductIdsBySource(
  config: CoffeeProductSourceConfig | null | undefined,
  catalog: SourceCatalogProduct[],
): string[] {
  if (!config || !Array.isArray(catalog) || catalog.length === 0) return [];
  const count = clampCount(config.productCount);
  const mode = config.mode || 'all';
  const byId = new Map(catalog.map((p) => [p.id, p]));

  if (mode === 'selected') {
    const ids = (config.productIds || []).map(String).filter((id) => byId.has(id));
    return ids.slice(0, count);
  }

  let list = catalog.slice();

  if (mode === 'featured') {
    list = list.filter(isFeatured);
  } else if (mode === 'latest') {
    list = list.slice().sort((a, b) => {
      const ta = Number(a.createdAt) || 0;
      const tb = Number(b.createdAt) || 0;
      return tb - ta;
    });
  } else if (mode === 'best_selling') {
    list = list.slice().sort((a, b) => salesOf(b) - salesOf(a));
  } else if (mode === 'category') {
    const cats = (config.categoryIds || []).filter(Boolean);
    if (!cats.length) return [];
    list = list.filter((p) => cats.some((c) => matchSourceCategory(p.category, c)));
  } else if (mode === 'brand') {
    const brands = (config.brandIds || []).filter(Boolean);
    if (!brands.length) return [];
    list = list.filter((p) => brands.some((b) => matchSourceBrand(p.brand, b)));
  } else if (mode === 'mix') {
    const cats = (config.categoryIds || []).filter(Boolean);
    const brands = (config.brandIds || []).filter(Boolean);
    const picks = (config.productIds || []).map(String).filter((id) => byId.has(id));
    const filtered = list.filter((p) => {
      const catOk = !cats.length || cats.some((c) => matchSourceCategory(p.category, c));
      const brandOk = !brands.length || brands.some((b) => matchSourceBrand(p.brand, b));
      return catOk && brandOk;
    });
    const ordered: SourceCatalogProduct[] = [];
    const seen = new Set<string>();
    for (const id of picks) {
      const hit = byId.get(id);
      if (hit && !seen.has(id)) {
        ordered.push(hit);
        seen.add(id);
      }
    }
    for (const p of filtered) {
      if (!seen.has(p.id)) {
        ordered.push(p);
        seen.add(p.id);
      }
    }
    list = ordered;
  }
  // mode === 'all' → full catalog slice

  return list.map((p) => p.id).filter(Boolean).slice(0, count);
}

export function resolveProductsBySource<T extends SourceCatalogProduct>(
  config: CoffeeProductSourceConfig | null | undefined,
  catalog: T[],
): T[] {
  const ids = resolveProductIdsBySource(config, catalog);
  const byId = new Map(catalog.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as T[];
}

export function sourceModeLabel(mode: CoffeeProductSourceMode, isAr: boolean): string {
  const en: Record<CoffeeProductSourceMode, string> = {
    all: 'All products',
    category: 'By category (one or more)',
    brand: 'By brand (one or more)',
    selected: 'Selected products (single or multi)',
    mix: 'Mix — categories + brands + products',
    featured: 'Featured products',
    latest: 'Latest products',
    best_selling: 'Best selling',
  };
  const ar: Record<CoffeeProductSourceMode, string> = {
    all: 'كل المنتجات',
    category: 'حسب التصنيف (واحد أو أكثر)',
    brand: 'حسب العلامة (واحدة أو أكثر)',
    selected: 'منتجات محددة (واحد أو متعدد)',
    mix: 'مزيج — تصنيفات + علامات + منتجات',
    featured: 'المنتجات المميزة',
    latest: 'أحدث المنتجات',
    best_selling: 'الأكثر مبيعاً',
  };
  return isAr ? ar[mode] : en[mode];
}
