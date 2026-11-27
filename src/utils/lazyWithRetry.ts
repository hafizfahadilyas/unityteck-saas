import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_KEY = 'chunk_lazy_reload';
/** Align with index.html — one reload max per tab, never periodic. */
const RELOAD_ONCE_KEY = 'unityteck_chunk_reload_once';

export function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk [\d]+ failed|Loading CSS chunk/i.test(
    msg,
  );
}

/** One hard reload after stale deploy / missing hashed chunk — never loop. */
export function reloadOnceForStaleChunk(): void {
  try {
    // Only skip reload if actively in the middle of a customer checkout/buy click on storefront
    const isCustomerBuying =
      typeof document !== 'undefined' &&
      !window.location.pathname.includes('/admin') &&
      !window.location.search.includes('tab=') &&
      !window.location.search.includes('store=') &&
      Boolean(document.querySelector('[data-coffee-product-buy]'));

    if (isCustomerBuying) return;

    if (sessionStorage.getItem(RELOAD_ONCE_KEY) === '1') return;
    const now = Date.now();
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    // Reload at most once per 20 seconds
    if (now - last > 20_000) {
      sessionStorage.setItem(RELOAD_KEY, String(now));
      sessionStorage.setItem(RELOAD_ONCE_KEY, '1');
      const url = new URL(window.location.href);
      url.searchParams.set('_reload', String(now));
      window.location.replace(url.toString());
    }
  } catch {
    /* If sessionStorage blocked, skip hard reload to avoid infinite refresh. */
  }
}

/**
 * React.lazy with one retry + single reload when a hashed Vite chunk is missing
 * after deploy (common Hostinger FTP race / stale tab).
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (first) {
      await new Promise((r) => setTimeout(r, 600));
      try {
        // Bust HTTP cache on retry (hashed URL still same; helps flaky CDN/proxy).
        return await factory();
      } catch (second) {
        if (isChunkLoadError(second) || isChunkLoadError(first)) {
          reloadOnceForStaleChunk();
        }
        throw second;
      }
    }
  });
}
