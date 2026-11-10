import type { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockData';

/** Fill missing catalog list fields from same-store seed row (never invent KPIs). */
export function mergeProductCatalogExtras(
  storeId: string | undefined,
  product: Product,
): Product {
  if (!storeId) return product;
  const seed = (INITIAL_PRODUCTS[storeId] || []).find((p) => p.id === product.id);
  const next: Product = { ...product };

  if (!next.brand && seed?.brand) next.brand = seed.brand;
  if (!next.productType && (seed?.productType || seed?.type)) {
    next.productType = seed.productType || seed.type;
  }
  if (!next.googleTaxonomy && seed?.googleTaxonomy) {
    next.googleTaxonomy = seed.googleTaxonomy;
  }
  if ((!next.salesChannels || next.salesChannels.length === 0) && seed?.salesChannels?.length) {
    next.salesChannels = seed.salesChannels;
  }
  if (!next.discountStartAt && seed?.discountStartAt) {
    next.discountStartAt = seed.discountStartAt;
  }
  if (!next.discountEndAt && seed?.discountEndAt) {
    next.discountEndAt = seed.discountEndAt;
  }

  // Coffee API catalog rows share HiBrew identity when seed row is absent.
  if (storeId === 'store-coffee') {
    if (!next.brand) next.brand = 'HiBrew';
    if (!next.productType) next.productType = 'Physical Product';
    if (!next.salesChannels || next.salesChannels.length === 0) {
      next.salesChannels = ['Online Store'];
    }
    if (!next.googleTaxonomy) {
      next.googleTaxonomy = coffeeGoogleTaxonomyForCategory(
        next.categoryEn || next.category || '',
      );
    }
  }

  return next;
}

function coffeeGoogleTaxonomyForCategory(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('مطح') || c.includes('mill') || c.includes('grind')) {
    return 'Home & Garden > Kitchen & Dining > Kitchen Appliance Accessories > Coffee Maker & Espresso Machine Accessories > Coffee Grinders';
  }
  if (c.includes('دولاب') || c.includes('ركن') || c.includes('cabinet') || c.includes('corner')) {
    return 'Furniture > Tables > Accent Tables > Coffee Tables';
  }
  if (
    c.includes('مستلزم') ||
    c.includes('أكواب') ||
    c.includes('accessories') ||
    c.includes('cups') ||
    c.includes('barista')
  ) {
    return 'Home & Garden > Kitchen & Dining > Kitchen Appliance Accessories > Coffee Maker & Espresso Machine Accessories';
  }
  return 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Coffee Makers & Espresso Machines';
}
