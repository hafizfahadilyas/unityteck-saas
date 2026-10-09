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

function setFavicon(href: string): void {
  const icon = ensureIconLink('icon');
  icon.setAttribute('type', 'image/svg+xml');
  icon.setAttribute('href', href);

  const shortcut = ensureIconLink('shortcut icon');
  shortcut.setAttribute('href', href);
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
