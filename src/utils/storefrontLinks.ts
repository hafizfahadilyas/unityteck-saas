/** Public storefront deep links — short path URLs (no fullscreen/page query spam). */

import {
  buildSeoPublicUrl,
  normalizeSeoLinkSettings,
  type SeoLinkSettings,
  DEFAULT_SEO_LINK_SETTINGS,
} from './seoPermalink';

const RESERVED_STORE_PATH_SEGMENTS = new Set([
  'login',
  'register',
  'forgot-password',
  'reset-password',
]);

let cachedSeoLinks: SeoLinkSettings = { ...DEFAULT_SEO_LINK_SETTINGS };

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

/**
 * Resolve tenant store_id from public URL (?store= / /store/{slug} / flagship mounts).
 * Explicit path/query always wins over apex host defaults (mieraf → coffee).
 */
export function storeIdFromPublicLocation(
  path: string,
  search?: string | URLSearchParams | null,
): string | null {
  const p = (path || '/').toLowerCase();
  const q =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(typeof search === 'string' ? search : '');
  const pathSlug = storeSlugFromStorePath(p);
  // /store/{slug} path wins over stale ?store=coffee injected by host default
  const queryHint = (
    q.get('store') ||
    q.get('storeId') ||
    q.get('store_id') ||
    q.get('tenant') ||
    q.get('demo') ||
    ''
  )
    .toLowerCase()
    .trim();
  const hint = (pathSlug || queryHint).toLowerCase().trim();

  if (
    hint === 'souq-default' ||
    hint === 'store-souq-default' ||
    pathSlug === 'souq-default'
  ) {
    return 'store-souq-default';
  }

  if (
    hint === 'coffee' ||
    hint === 'store-coffee' ||
    hint === 'coffee-store' ||
    hint === 'roasters' ||
    hint === 'hibrew' ||
    hint.includes('coffee') ||
    hint.includes('hibrew') ||
    hint.includes('roaster') ||
    p.startsWith('/coffee') ||
    p === '/public_html' ||
    p.startsWith('/public_html')
  ) {
    return 'store-coffee';
  }

  if (
    hint === 'car' ||
    hint === 'cars' ||
    hint === 'bleco' ||
    hint === 'store-bleco' ||
    hint === 'alsaeedi' ||
    hint === 'tanjeed' ||
    hint.includes('bleco') ||
    hint.includes('transport') ||
    (hint.includes('car') && !hint.includes('catalog')) ||
    p.startsWith('/car') ||
    p.startsWith('/cars') ||
    p.startsWith('/bleco')
  ) {
    return 'store-bleco';
  }

  if (
    hint === 'flowers' ||
    hint === 'hadaya' ||
    hint === 'gifts' ||
    hint === 'giftshop' ||
    hint === 'store-1' ||
    hint.includes('flower') ||
    hint.includes('gift') ||
    hint.includes('hadaya') ||
    p.startsWith('/flowers') ||
    p.startsWith('/hadaya')
  ) {
    return 'store-1';
  }

  if (hint.startsWith('store-')) return hint;
  if (hint) return hint.startsWith('store-') ? hint : `store-${hint}`;

  return null;
}

/**
 * Shared-host mount path for a store slug/id.
 * Prefer `/coffee/product/{id}` over `/?store=coffee-store&fullscreen=1&page=…`.
 */
export function storefrontMountPath(storeSlug?: string | null): string {
  const raw = String(storeSlug || '')
    .trim()
    .toLowerCase()
    .replace(/^store-/, '');
  if (!raw) return '';
  if (raw.includes('coffee') || raw.includes('hibrew') || raw.includes('roaster')) return '/coffee';
  if (
    raw.includes('bleco') ||
    raw === 'car' ||
    raw === 'cars' ||
    raw.includes('transport') ||
    raw.includes('alsaeedi')
  ) {
    return '/bleco';
  }
  if (
    raw.includes('flower') ||
    raw.includes('gift') ||
    raw.includes('makkah') ||
    raw.includes('hadaya') ||
    raw === '1' ||
    raw === 'store-1'
  ) {
    return '/flowers';
  }
  if (raw === 'souq-default' || raw === 'souqdefault') {
    return '/store/souq-default';
  }
  const clean = raw.replace(/[^a-z0-9-]/g, '');
  // New common tenants: stable public preview under /store/{slug}
  return clean ? `/store/${clean}` : '';
}

/** Join mount + segments → `/coffee/buy/prod-xyz` (no double slashes). */
export function joinStorefrontPath(mount: string, ...segments: string[]): string {
  const root = !mount || mount === '/' ? '' : mount.replace(/\/+$/, '');
  const parts = segments
    .map((s) => String(s || '').replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .map((s) => {
      try {
        return encodeURIComponent(decodeURIComponent(s));
      } catch {
        return encodeURIComponent(s);
      }
    });
  const path = `${root}/${parts.join('/')}`.replace(/\/+/g, '/');
  return path.startsWith('/') ? path : `/${path}`;
}

function resolveOrigin(origin?: string): string {
  return (
    origin ??
    (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '');
}

/** Short store home: `https://host/coffee` (no ?store=&fullscreen=). */
export function buildStorefrontHomeUrl(opts: {
  storeSlug?: string | null;
  origin?: string;
  customDomain?: boolean;
}): string {
  const slug = String(opts.storeSlug || '').trim() || 'store';
  const origin = resolveOrigin(opts.origin);
  if (opts.customDomain) return `${origin}/`;
  const mount = storefrontMountPath(slug);
  if (mount) return `${origin}${mount}`;
  return `${origin}/?store=${encodeURIComponent(slug)}`;
}

/** Short PDP: `/coffee/product/{id}` or custom-domain SEO path. */
export function buildStorefrontProductUrl(opts: {
  storeSlug?: string | null;
  productId: string;
  productSlug?: string | null;
  origin?: string;
  /** When true (custom domain), omit mount prefix and use SEO path pattern. */
  customDomain?: boolean;
}): string {
  const slug = String(opts.storeSlug || '').trim() || 'store';
  const origin = resolveOrigin(opts.origin);
  const productKey = String(opts.productId || '').trim();
  if (!productKey) return buildStorefrontHomeUrl(opts);

  if (opts.customDomain) {
    const settings = getStorefrontSeoLinkSettings();
    return buildSeoPublicUrl(settings, 'product', {
      origin,
      storeSlug: slug,
      slug: opts.productSlug || productKey,
      id: productKey,
      useQueryStore: false,
    });
  }

  const mount = storefrontMountPath(slug);
  if (mount) {
    return `${origin}${joinStorefrontPath(mount, 'product', productKey)}`;
  }
  // Unknown tenant — still short path + single store query (no fullscreen/page)
  return `${origin}/product/${encodeURIComponent(productKey)}?store=${encodeURIComponent(slug)}`;
}

/** Short buy/checkout PDP: `/coffee/buy/{id}`. */
export function buildStorefrontBuyUrl(opts: {
  storeSlug?: string | null;
  productId: string;
  origin?: string;
  customDomain?: boolean;
}): string {
  const slug = String(opts.storeSlug || '').trim() || 'store';
  const origin = resolveOrigin(opts.origin);
  const productKey = String(opts.productId || '').trim();
  if (!productKey) return buildStorefrontHomeUrl(opts);

  if (opts.customDomain) {
    return `${origin}/buy/${encodeURIComponent(productKey)}`;
  }

  const mount = storefrontMountPath(slug);
  if (mount) {
    return `${origin}${joinStorefrontPath(mount, 'buy', productKey)}`;
  }
  return `${origin}/buy/${encodeURIComponent(productKey)}?store=${encodeURIComponent(slug)}`;
}
