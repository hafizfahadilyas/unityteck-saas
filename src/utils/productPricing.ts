/**
 * Product pricing helpers — editor Regular/Sale ↔ API price/original_price
 *
 * Frontend convention:
 *   price           = regular / list price
 *   discountedPrice = sale price when active (0 = no sale)
 *   originalPrice   = compare-at (same as regular when on sale)
 *
 * API convention:
 *   price           = what the customer pays
 *   original_price  = strikethrough compare-at when on sale
 */

export function hasActiveSale(regularPrice: number, salePrice: number): boolean {
  return salePrice > 0 && regularPrice > 0 && salePrice < regularPrice;
}

/** Selling price the customer pays */
export function sellingPrice(regularPrice: number, salePrice?: number | null): number {
  const sale = Number(salePrice ?? 0);
  const regular = Number(regularPrice ?? 0);
  return hasActiveSale(regular, sale) ? sale : regular;
}

export function toApiPricing(
  regularPrice: number,
  salePrice?: number | null,
): { price: number; original_price: number | null } {
  const regular = Math.max(0, Number(regularPrice) || 0);
  const sale = Math.max(0, Number(salePrice ?? 0) || 0);
  if (hasActiveSale(regular, sale)) {
    return { price: sale, original_price: regular };
  }
  return { price: regular, original_price: null };
}

export function fromApiPricing(
  apiPrice: number,
  originalPrice?: number | null,
): {
  price: number;
  discountedPrice: number;
  originalPrice: number | null;
} {
  const sell = Math.max(0, Number(apiPrice) || 0);
  const compare =
    originalPrice === null || originalPrice === undefined
      ? null
      : Math.max(0, Number(originalPrice) || 0);

  if (compare != null && compare > sell) {
    return {
      price: compare,
      discountedPrice: sell,
      originalPrice: compare,
    };
  }

  return {
    price: sell,
    discountedPrice: 0,
    originalPrice: null,
  };
}

/** Normalize partial product patch before local state / API */
export function normalizeProductPricingFields(patch: {
  price?: number;
  discountedPrice?: number | null;
  originalPrice?: number | null;
}): {
  price: number;
  discountedPrice: number;
  originalPrice: number | null;
} {
  const regular = Math.max(0, Number(patch.price ?? 0) || 0);
  let sale = Math.max(0, Number(patch.discountedPrice ?? 0) || 0);

  // If only originalPrice was set (API-shaped), expand to editor shape
  if (
    (!patch.discountedPrice || patch.discountedPrice <= 0) &&
    patch.originalPrice != null &&
    Number(patch.originalPrice) > regular &&
    regular > 0
  ) {
    return {
      price: Number(patch.originalPrice),
      discountedPrice: regular,
      originalPrice: Number(patch.originalPrice),
    };
  }

  if (!hasActiveSale(regular, sale)) {
    sale = 0;
  }

  return {
    price: regular,
    discountedPrice: sale,
    originalPrice: hasActiveSale(regular, sale) ? regular : null,
  };
}
