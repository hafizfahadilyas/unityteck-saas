/**
 * Soft SPA history helpers — browser Back stays inside the surface
 * (storefront home / admin dashboard) instead of exiting to the other portal.
 */

export type SpaSurface = 'storefront' | 'admin' | 'master';

export function isAdminChromePath(pathname?: string): boolean {
  const p = String(pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '')).toLowerCase();
  return (
    p.includes('/admin') ||
    p.includes('/master') ||
    p.includes('/store/login') ||
    p.includes('/master/login') ||
    p.includes('/login')
  );
}

/** True when URL is a public storefront path (coffee / flowers / car / bare host). */
export function isStorefrontPath(pathname?: string): boolean {
  const p = (pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/'))
    .replace(/\/$/, '')
    .toLowerCase() || '/';
  if (isAdminChromePath(p)) return false;
  return (
    p === '/' ||
    p === '/coffee' ||
    p.startsWith('/coffee/') ||
    p === '/flowers' ||
    p.startsWith('/flowers/') ||
    p === '/car' ||
    p.startsWith('/car/') ||
    p === '/cars' ||
    p.startsWith('/cars/') ||
    p === '/bleco' ||
    p.startsWith('/bleco/') ||
    p === '/public_html' ||
    p.startsWith('/public_html/') ||
    p === '/product' ||
    p.startsWith('/product/') ||
    p === '/buy' ||
    p.startsWith('/buy/') ||
    p === '/category' ||
    p.startsWith('/category/') ||
    p === '/catalog' ||
    p.startsWith('/catalog/') ||
    p === '/products' ||
    p.startsWith('/products/') ||
    p === '/shop' ||
    p.startsWith('/shop/') ||
    p === '/cart' ||
    p === '/checkout' ||
    p === '/status'
  );
}

export function stripStorefrontPageParams(url: URL): void {
  url.searchParams.delete('page');
  url.searchParams.delete('product');
  url.searchParams.delete('productId');
  url.searchParams.delete('pid');
  url.searchParams.delete('preview_page');
}

/** Drop redundant `?product=` when pathname already has `/product/{id}` or `/buy/{id}`. */
export function dedupeProductQueryFromPath(url: URL): void {
  const path = String(url.pathname || '').replace(/\/$/, '') || '/';
  const m = path.match(/(?:^|\/)(?:product|buy)\/([^/]+)$/i);
  if (!m) return;
  let pathId = '';
  try {
    pathId = decodeURIComponent(m[1]).trim();
  } catch {
    pathId = String(m[1] || '').trim();
  }
  if (!pathId) return;
  const qKeys = ['product', 'productId', 'pid'] as const;
  for (const key of qKeys) {
    const qVal = (url.searchParams.get(key) || '').trim();
    if (qVal && qVal === pathId) {
      url.searchParams.delete(key);
    }
  }
}

export function storefrontHomeHref(pathname?: string): string {
  const url = new URL(typeof window !== 'undefined' ? window.location.href : 'http://local/');
  if (pathname) url.pathname = pathname;
  stripStorefrontPageParams(url);
  const q = url.searchParams.toString();
  return `${url.pathname}${q ? `?${q}` : ''}${url.hash || ''}`;
}

export function adminHomeHref(portal: 'admin' | 'master' = 'admin'): string {
  const url = new URL(typeof window !== 'undefined' ? window.location.href : 'http://local/');
  if (!url.pathname.includes(`/${portal}`)) {
    url.pathname = portal === 'master' ? '/master' : '/admin';
  }
  url.searchParams.set('tab', 'dashboard');
  const q = url.searchParams.toString();
  return `${url.pathname}${q ? `?${q}` : ''}`;
}

export function markSpaState(surface: SpaSurface, extra?: Record<string, unknown>): Record<string, unknown> {
  return { unityteckSpa: surface, ...(extra || {}) };
}

export function isSpaState(state: unknown, surface?: SpaSurface): boolean {
  if (!state || typeof state !== 'object') return false;
  const s = (state as { unityteckSpa?: string }).unityteckSpa;
  if (!s) return false;
  return surface ? s === surface : true;
}

/**
 * Push a new history entry when the href changed; replace when identical.
 * Always tags state so popstate handlers can recognize our surface.
 */
export function spaPushOrReplace(
  surface: SpaSurface,
  href: string,
  extra?: Record<string, unknown>,
  forceReplace = false,
): void {
  if (typeof window === 'undefined') return;
  const state = markSpaState(surface, extra);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (forceReplace || current === href) {
    window.history.replaceState(state, '', href);
  } else {
    window.history.pushState(state, '', href);
  }
}

/**
 * When Back would leave the surface, re-assert the home URL (no exit to other portal).
 * Returns true if a trap was applied.
 */
export function trapSpaHomeIfEscaped(
  surface: SpaSurface,
  stillInside: boolean,
  homeHref: string,
  extra?: Record<string, unknown>,
): boolean {
  if (typeof window === 'undefined') return false;
  if (stillInside) return false;
  window.history.pushState(markSpaState(surface, extra), '', homeHref);
  return true;
}
