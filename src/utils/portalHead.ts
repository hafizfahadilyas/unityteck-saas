/**
 * Portal-scoped document title + favicon (docs/21).
 * Master = Unityteck platform branding.
 * Store = active store name/brand (when wired) — never force Master assets on Store.
 */

const MASTER_TITLE = 'Unityteck | Master Admin';
const MASTER_FAVICON = '/favicon.svg';

function ensureIconLink(rel: string): HTMLLinkElement {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  return el;
}

function getFaviconMime(href: string): string {
  const clean = href.toLowerCase().split('?')[0];
  if (clean.endsWith('.svg')) return 'image/svg+xml';
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.webp')) return 'image/webp';
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
  if (clean.endsWith('.gif')) return 'image/gif';
  return 'image/x-icon';
}

function setFavicon(href: string): void {
  const mime = getFaviconMime(href);

  const icon = ensureIconLink('icon');
  icon.setAttribute('type', mime);
  icon.setAttribute('href', href);

  const shortcut = ensureIconLink('shortcut icon');
  shortcut.setAttribute('type', mime);
  shortcut.setAttribute('href', href);

  const apple = ensureIconLink('apple-touch-icon');
  apple.setAttribute('href', href);
}

export type PortalHeadInput =
  | { portal: 'master' }
  | { portal: 'store'; storeName?: string | null; faviconUrl?: string | null };

/** Apply title + favicon for the active admin portal. Zero-stale on Master↔Store switch. */
export function applyPortalHead(input: PortalHeadInput): void {
  if (typeof document === 'undefined') return;

  if (input.portal === 'master') {
    document.title = MASTER_TITLE;
    setFavicon(MASTER_FAVICON);
    return;
  }

  const name = (input.storeName || '').trim();
  document.title = name ? `${name} | Store Admin` : 'Store Admin | Unityteck';
  setFavicon(input.faviconUrl?.trim() || MASTER_FAVICON);
}
