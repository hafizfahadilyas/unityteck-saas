import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_KEY = 'chunk_lazy_reload';

export function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk [\d]+ failed|Loading CSS chunk/i.test(
    msg,
  );
}

/** One hard reload after stale deploy / missing hashed chunk. */
export function reloadOnceForStaleChunk(): void {
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (now - last > 10_000) {
      sessionStorage.setItem(RELOAD_KEY, String(now));
      window.location.reload();
    }
  } catch {
    window.location.reload();
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
