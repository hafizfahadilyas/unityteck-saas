/**
 * Shared HiBrew PDP chrome — ONE ProductDetailPage + optional All / Specific scope.
 * Per-SKU content (images, video, specs) stays on the product catalog row.
 */

export type ProductDetailApplyScope = 'all' | 'selected';

export type ProductDetailChromeInput = {
  enabled?: boolean;
  applyScope?: ProductDetailApplyScope;
  productIds?: string[];
  showFeatures?: boolean;
  showVideo?: boolean;
  showSpecs?: boolean;
  showWarranty?: boolean;
  showFloatingBuy?: boolean;
};

export type ProductDetailChromeFlags = {
  showFeatures: boolean;
  showVideo: boolean;
  showSpecs: boolean;
  showWarranty: boolean;
  showFloatingBuy: boolean;
};

const FULL_DEFAULTS: ProductDetailChromeFlags = {
  showFeatures: true,
  showVideo: true,
  showSpecs: true,
  showWarranty: true,
  showFloatingBuy: true,
};

/** Whether custom chrome flags apply to this product id. */
export function productDetailScopeApplies(
  settings: ProductDetailChromeInput | null | undefined,
  productId: string | null | undefined,
): boolean {
  if (!settings || settings.enabled === false) return false;
  if (settings.applyScope !== 'selected') return true;
  const ids = (settings.productIds || []).map((id) => String(id || '').trim()).filter(Boolean);
  if (!ids.length || !productId) return false;
  return ids.includes(String(productId));
}

/**
 * Resolve section visibility for a PDP.
 * - All scope → use saved flags for every SKU
 * - Selected scope → flags only for listed ids; other SKUs keep full defaults
 * - Disabled / missing → full defaults
 */
export function resolveProductDetailChrome(
  settings: ProductDetailChromeInput | null | undefined,
  productId: string | null | undefined,
): ProductDetailChromeFlags {
  if (!productDetailScopeApplies(settings, productId)) {
    return { ...FULL_DEFAULTS };
  }
  return {
    showFeatures: settings?.showFeatures !== false,
    showVideo: settings?.showVideo !== false,
    showSpecs: settings?.showSpecs !== false,
    showWarranty: settings?.showWarranty !== false,
    showFloatingBuy: settings?.showFloatingBuy !== false,
  };
}
