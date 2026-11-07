/** Public storefront deep links (query-driven SPA, no VPS rewrite required). */

const RESERVED_STORE_PATH_SEGMENTS = new Set([
  'login',
  'register',
  'forgot-password',
  'reset-password',
]);

/** `/store/{slug}` public preview (not auth routes). */
export function storeSlugFromStorePath(path: string): string | null {
  const clean = (path || '').replace(/\/$/, '') || '/';
  const m = clean.match(/^\/store\/([^/]+)$/i);
  if (!m) return null;
  const slug = decodeURIComponent(m[1]).trim().toLowerCase();
  if (!slug || RESERVED_STORE_PATH_SEGMENTS.has(slug)) return null;
  return slug;
}

export function isPublicStoreSlugPath(path: string): boolean {
  return storeSlugFromStorePath(path) !== null;
}

export function buildStorefrontProductUrl(opts: {
  storeSlug?: string | null;
  productId: string;
  origin?: string;
}): string {
  const slug = String(opts.storeSlug || '').trim() || 'coffee';
  const params = new URLSearchParams({
    store: slug,
    fullscreen: '1',
    page: 'product',
    product: opts.productId,
  });
  const origin =
    opts.origin ??
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/?${params.toString()}`;
}
