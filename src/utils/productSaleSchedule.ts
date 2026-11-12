import type { Product } from '../types';

/** Client-side mirror of API ProductStorefront::effectivePricing */
export function effectiveProductPricing(product: Pick<Product, 'price' | 'originalPrice' | 'discountedPrice' | 'discountStartAt' | 'discountEndAt'>): {
  price: number;
  compareAt: number | null;
  onSale: boolean;
  saleActive: boolean;
} {
  const regular =
    product.originalPrice && product.originalPrice > (product.price ?? 0)
      ? product.originalPrice
      : product.price ?? 0;
  const sale = product.discountedPrice && product.discountedPrice > 0 ? product.discountedPrice : null;
  const sell = sale != null && sale < regular ? sale : regular;
  const compare = sale != null && sale < regular ? regular : null;

  if (compare == null) {
    return { price: sell, compareAt: null, onSale: false, saleActive: false };
  }

  const now = Date.now();
  const start = product.discountStartAt ? Date.parse(product.discountStartAt) : null;
  const end = product.discountEndAt ? Date.parse(product.discountEndAt) : null;
  let inWindow = true;
  if (start != null && !Number.isNaN(start) && now < start) inWindow = false;
  if (end != null && !Number.isNaN(end) && now > end) inWindow = false;

  if (inWindow) {
    return { price: sell, compareAt: compare, onSale: true, saleActive: true };
  }

  return { price: compare, compareAt: null, onSale: false, saleActive: false };
}

export function mapStorefrontCatalogRow(row: Record<string, unknown>): Record<string, unknown> {
  const storefrontPrice = row.storefront_price ?? row.price;
  const storefrontOriginal = row.storefront_original_price ?? row.original_price;
  if (storefrontPrice != null) {
    row.price = storefrontPrice;
  }
  if (storefrontOriginal !== undefined) {
    row.original_price = storefrontOriginal;
  }
  const list = row.categories ?? row.category_list;
  if (Array.isArray(list)) {
    row.category_list = list;
  }
  return row;
}
