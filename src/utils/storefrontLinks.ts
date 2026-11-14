/** Public storefront deep links (query-driven SPA, no VPS rewrite required). */

import {
  buildSeoPublicUrl,
  DEFAULT_SEO_LINK_SETTINGS,
  normalizeSeoLinkSettings,
  type SeoLinkSettings,
} from './seoPermalink';

const RESERVED_STORE_PATH_SEGMENTS = new Set([
  'login',
  'register',
  'forgot-password',
  'reset-password',
]);

let cachedSeoLinks: SeoLinkSettings = DEFAULT_SEO_LINK_SETTINGS;

/** Master SEO link settings (updated when platform settings load/save). */
export function setStorefrontSeoLinkSettings(raw: unknown): void {
  cachedSeoLinks = normalizeSeoLinkSettings(raw);
}

export function getStorefrontSeoLinkSettings(): SeoLinkSettings {
  return cachedSeoLinks;
}

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
  productSlug?: string | null;
  origin?: string;
  /** When true (custom domain), omit ?store= and use SEO path pattern. */
  customDomain?: boolean;
}): string {
  const slug = String(opts.storeSlug || '').trim() || 'store';
  const origin =
    opts.origin ??
    (typeof window !== 'undefined' ? window.location.origin : '');
  const settings = getStorefrontSeoLinkSettings();
  if (opts.customDomain || settings.preset !== 'plain') {
    const seoUrl = buildSeoPublicUrl(settings, 'product', {
      origin,
      storeSlug: slug,
      slug: opts.productSlug || opts.productId,
      id: opts.productId,
      useQueryStore: !opts.customDomain,
    });
    // SPA still needs product id for routing until path rewrites exist.
    if (!opts.customDomain) {
      const joiner = seoUrl.includes('?') ? '&' : '?';
      return `${seoUrl}${joiner}fullscreen=1&page=product&product=${encodeURIComponent(opts.productId)}`;
    }
    return seoUrl;
  }
  const params = new URLSearchParams({
    store: slug,
    fullscreen: '1',
    page: 'product',
    product: opts.productId,
  });
  return `${origin}/?${params.toString()}`;
}
