/**
 * Portal-scoped document title + favicon (docs/21).
 * Master = Souq Platform (Final Master Admin) branding.
 * Store = active store name/brand (when wired) — never force Master assets on Store.
 */

const MASTER_TITLE_AR = 'منصة سوق | لوحة تحكم المشرف';
const MASTER_TITLE_EN = 'Souq Platform | Master Admin';
const STORE_TITLE_AR = 'لوحة تحكم المتجر | منصة سوق';
const STORE_TITLE_EN = 'Store Admin | Souq Platform';
const MASTER_FAVICON = '/favicon.svg';

function resolveIsAr(): boolean {
  if (typeof document === 'undefined') return true;
  const lang = String(document.documentElement.lang || '').toLowerCase();
  if (lang === 'ar' || lang === 'ur') return true;
  if (lang === 'en') return false;
  try {
    const raw = localStorage.getItem('unityteck_prefs');
    if (raw) {
      const parsed = JSON.parse(raw) as { locale?: string };
      if (parsed?.locale === 'en') return false;
      if (parsed?.locale === 'ar') return true;
    }
  } catch {
    /* ignore */
  }
  return true;
}

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
  const isAr = resolveIsAr();

  if (input.portal === 'master') {
    document.title = isAr ? MASTER_TITLE_AR : MASTER_TITLE_EN;
    setFavicon(MASTER_FAVICON);
    return;
  }

  const name = (input.storeName || '').trim();
  if (name) {
    document.title = isAr ? `${name} | لوحة تحكم المتجر` : `${name} | Store Admin`;
  } else {
    document.title = isAr ? STORE_TITLE_AR : STORE_TITLE_EN;
  }
  setFavicon(input.faviconUrl?.trim() || MASTER_FAVICON);
}
