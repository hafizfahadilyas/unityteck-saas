/**
 * Store-scoped custom CSS + custom font helpers.
 * Source of truth = theme-settings API / MySQL per store_id (not localStorage alone).
 * Empty store stays empty — no demo CSS snippets.
 */

export interface StoreCustomCodeSettings {
  customCss: string;
  enableCustomCss: boolean;
  /** Optional head/footer slots — empty by default; never invent pixels. */
  customHeadJs: string;
  customFooterJs: string;
  enableHeadJs: boolean;
  enableFooterJs: boolean;
  customFontFamily: string;
  customFontUrl: string;
  /** Light 300 · Regular 400 · Medium 500 · Bold 700 · Black 900 */
  customFontWeight: string;
}

export const EMPTY_STORE_CUSTOM_CODE: StoreCustomCodeSettings = {
  customCss: '',
  enableCustomCss: true,
  customHeadJs: '',
  customFooterJs: '',
  enableHeadJs: false,
  enableFooterJs: false,
  customFontFamily: '',
  customFontUrl: '',
  customFontWeight: '',
};

const FONT_WEIGHTS = new Set(['300', '400', '500', '600', '700', '800', '900']);

export function normalizeStoreCustomCode(raw: unknown): StoreCustomCodeSettings {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_STORE_CUSTOM_CODE };
  const row = raw as Record<string, unknown>;
  const weightRaw = typeof row.customFontWeight === 'string' ? row.customFontWeight.trim() : '';
  return {
    customCss: typeof row.customCss === 'string' ? row.customCss : '',
    enableCustomCss: row.enableCustomCss !== false,
    customHeadJs: typeof row.customHeadJs === 'string' ? row.customHeadJs : '',
    customFooterJs: typeof row.customFooterJs === 'string' ? row.customFooterJs : '',
    enableHeadJs: row.enableHeadJs === true,
    enableFooterJs: row.enableFooterJs === true,
    customFontFamily: typeof row.customFontFamily === 'string' ? row.customFontFamily.trim() : '',
    customFontUrl: typeof row.customFontUrl === 'string' ? row.customFontUrl.trim() : '',
    customFontWeight: FONT_WEIGHTS.has(weightRaw) ? weightRaw : '',
  };
}

/** Mirror of ThemeLayoutGuard::scopeCss — prefix selectors with this store only. */
export function scopeStoreCss(css: string, storeId: string): string {
  if (!css.trim() || !storeId) return '';
  let clean = css.replace(/<\/style/gi, '');
  clean = clean.replace(/@import[^;]*;?/gi, '');
  clean = clean.replace(/expression\s*\(/gi, '');
  clean = clean.replace(/javascript\s*:/gi, '');

  const prefix = `[data-store-id="${storeId}"]`;
  return clean.replace(/([^{}]+)\{([^{}]*)\}/g, (_full, selRaw: string, body: string) => {
    const selector = String(selRaw).trim();
    if (!selector || selector.startsWith('@')) {
      return `${selector}{${body}}`;
    }
    const probe = selector.replace(/data-store-id/g, 'data-tenant');
    const foreign = probe.match(/store-[a-z0-9-]+/i);
    if (foreign && foreign[0] !== storeId) {
      return '';
    }
    if (selector.includes(prefix)) {
      return `${selector}{${body}}`;
    }
    return `${prefix} ${selector}{${body}}`;
  });
}

export function storeCustomCssTagId(storeId: string): string {
  return `unityteck-custom-css-${storeId}`;
}

export function storeCustomFontLinkId(storeId: string): string {
  return `unityteck-custom-font-${storeId}`;
}

export function storeCustomFontWeightTagId(storeId: string): string {
  return `unityteck-custom-font-weight-${storeId}`;
}

/** Remove CSS tags for other tenants so SPA store switches cannot leak styles. */
export function clearForeignStoreCustomCss(activeStoreId: string): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('style[id^="unityteck-custom-css-"]').forEach((el) => {
    if (el.id !== storeCustomCssTagId(activeStoreId)) {
      el.remove();
    }
  });
  document.querySelectorAll('link[id^="unityteck-custom-font-"]').forEach((el) => {
    if (el.id !== storeCustomFontLinkId(activeStoreId)) {
      el.remove();
    }
  });
  document.querySelectorAll('style[id^="unityteck-custom-font-weight-"]').forEach((el) => {
    if (el.id !== storeCustomFontWeightTagId(activeStoreId)) {
      el.remove();
    }
  });
  // Legacy single-tag injectors (pre-isolation)
  const legacy = document.getElementById('unityteck-live-custom-css');
  if (legacy) legacy.remove();
}

export function injectStoreCustomCss(
  storeId: string,
  css: string,
  enabled = true,
): void {
  if (typeof document === 'undefined' || !storeId) return;
  clearForeignStoreCustomCss(storeId);
  const id = storeCustomCssTagId(storeId);
  let tag = document.getElementById(id) as HTMLStyleElement | null;
  const scoped = enabled && css.trim() ? scopeStoreCss(css, storeId) : '';
  if (!scoped) {
    if (tag) tag.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement('style');
    tag.id = id;
    tag.setAttribute('data-store-id', storeId);
    document.head.appendChild(tag);
  }
  tag.textContent = scoped;
}

export function injectStoreCustomFont(
  storeId: string,
  family: string,
  url?: string | null,
): void {
  if (typeof document === 'undefined' || !storeId) return;
  const name = family.trim();
  const href = (url || '').trim();
  const id = storeCustomFontLinkId(storeId);
  let link = document.getElementById(id) as HTMLLinkElement | null;

  if (!name && !href) {
    if (link) link.remove();
    return;
  }

  const finalHref = href
    ? href
    : name
      ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`
      : '';

  if (!finalHref) {
    if (link) link.remove();
    return;
  }

  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.setAttribute('data-store-id', storeId);
    document.head.appendChild(link);
  }
  if (link.href !== finalHref) {
    link.href = finalHref;
  }
}

export function injectStoreCustomFontWeight(storeId: string, weight: string): void {
  if (typeof document === 'undefined' || !storeId) return;
  const id = storeCustomFontWeightTagId(storeId);
  let tag = document.getElementById(id) as HTMLStyleElement | null;
  const w = weight.trim();
  if (!FONT_WEIGHTS.has(w)) {
    if (tag) tag.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement('style');
    tag.id = id;
    tag.setAttribute('data-store-id', storeId);
    document.head.appendChild(tag);
  }
  tag.textContent = `[data-store-id="${storeId}"]{--store-font-weight:${w};font-weight:${w}}`;
}

export function applyStoreCustomCodeLive(
  storeId: string,
  settings: Partial<StoreCustomCodeSettings> | null | undefined,
): void {
  if (!storeId) return;
  const next = normalizeStoreCustomCode(settings);
  injectStoreCustomCss(storeId, next.customCss, next.enableCustomCss);
  injectStoreCustomFont(storeId, next.customFontFamily, next.customFontUrl);
  injectStoreCustomFontWeight(storeId, next.customFontWeight);
}
