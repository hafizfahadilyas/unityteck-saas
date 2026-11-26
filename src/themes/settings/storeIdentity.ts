/**
 * Theme Settings page 01 — Store Identity (Phase 5.1).
 * Stored per store_id; storefront + SEO read these fields.
 */

import { bumpStore } from '../../api/cacheTags';
import { isRetiredContactDigits, scrubPublicEmail, syncStoreContactIntoTheme } from './storeContact';

/**
 * Platform default portal login full-bleed BG (modern Arabic desk: iMac / laptop / iPhone).
 * Stable public/ path — never a Vite content-hash URL (those break after every rebuild).
 */
export const DEFAULT_LOGIN_SIDE_IMAGE = '/images/login-side-saudi-modern-devices.jpg';

/** True when URL is empty or any known platform/legacy login BG (not a merchant upload). */
export function isDefaultLoginSideImage(url: unknown): boolean {
  if (typeof url !== 'string') return true;
  const t = url.trim();
  if (!t) return true;
  if (t === DEFAULT_LOGIN_SIDE_IMAGE) return true;
  // public/ aliases + old sheikh art + any Vite-hashed /assets/login-side-* copy
  return /(^|\/)(images\/)?login-side-saudi-(modern-devices|sheikh-laptop)\.(jpe?g|webp|png)(\?|#|$)/i.test(t)
    || /(^|\/)assets\/login-side-saudi-[^/?#]+\.(jpe?g|webp|png)(\?|#|$)/i.test(t);
}

export type StoreIdentitySettings = {
  storeName: string;
  storeNameEn?: string;
  storeNameAr?: string;
  taglineEn: string;
  taglineAr: string;
  logoUrl: string;
  /** Browser tab icon — per store_id. Empty → platform `/favicon.svg`. */
  faviconUrl?: string;
  /** Admin portal login full-bleed BG (per store_id). Empty → platform default photo. */
  loginSideImageUrl?: string;
  phone: string;
  whatsapp: string;
  email: string;
  addressEn: string;
  addressAr: string;
  city: string;
  commercialReg: string;
  vatNumber: string;
  instagram: string;
  updatedAt: string;
};

/** Drop Vite `/src/assets/` and other non-CDN placeholders — not valid live media. */
export function normalizeIdentityMediaUrl(url: unknown): string {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^\/src\/assets\//i.test(raw)) return '';
  if (/unsplash\.com\/photo-1561181286/i.test(raw)) return '';
  return raw;
}

/**
 * Empty / API-backed defaults only — never invent Flora/coffee/bleco CR, VAT, Instagram, or stock logos.
 * Pilot storefront look stays in theme packs; Settings identity = this store_id’s real fields.
 */
export function defaultStoreIdentity(store: {
  id?: string;
  name: string;
  ownerEmail?: string;
  logo?: string;
  phone?: string;
  whatsapp?: string;
}): StoreIdentitySettings {
  const name = String(store.name || '').trim();
  return {
    storeName: name,
    storeNameEn: '',
    storeNameAr: '',
    taglineEn: '',
    taglineAr: '',
    logoUrl: normalizeIdentityMediaUrl(store.logo),
    faviconUrl: '',
    loginSideImageUrl: '',
    phone: String(store.phone || '').trim(),
    whatsapp: String(store.whatsapp || '').trim(),
    email: '',
    addressEn: '',
    addressAr: '',
    city: '',
    commercialReg: '',
    vatNumber: '',
    instagram: '',
    updatedAt: new Date().toISOString(),
  };
}

const storageKey = (storeId: string) => `unityteck_theme_identity_${storeId}`;

function stripInventedContacts(data: StoreIdentitySettings): StoreIdentitySettings {
  const next = { ...data };
  if (isRetiredContactDigits(next.whatsapp)) next.whatsapp = '';
  if (isRetiredContactDigits(next.phone)) next.phone = '';
  next.email = scrubPublicEmail(next.email);
  // Upgrade legacy / Vite-hash login BG → empty (platform default on resolve)
  if (isDefaultLoginSideImage(next.loginSideImageUrl)) next.loginSideImageUrl = '';
  next.logoUrl = normalizeIdentityMediaUrl(next.logoUrl);
  next.faviconUrl = normalizeIdentityMediaUrl(next.faviconUrl);
  // Kill known demo CR / VAT / social leftovers from old defaults
  const demoCr = new Set(['1010892410', '7005616136', '4031099241']);
  const demoVat = new Set(['31048821900003', '0000180462', '30048821900003']);
  if (demoCr.has(String(next.commercialReg || '').trim())) next.commercialReg = '';
  if (demoVat.has(String(next.vatNumber || '').trim())) next.vatNumber = '';
  const ig = String(next.instagram || '').toLowerCase();
  if (
    ig.includes('giftshop2030m') ||
    ig.includes('hibrew.ksa') ||
    ig.includes('tanjeedmakkah')
  ) {
    next.instagram = '';
  }
  return next;
}

/** Show the legacy single name in one language box. Never copy it into the other language. */
export function splitStoreName(identity: Pick<StoreIdentitySettings, 'storeName' | 'storeNameEn' | 'storeNameAr'>): {
  storeNameEn: string;
  storeNameAr: string;
} {
  const en = identity.storeNameEn ?? '';
  const ar = identity.storeNameAr ?? '';
  if (en || ar) return { storeNameEn: en, storeNameAr: ar };
  const legacy = identity.storeName || '';
  if (/[\u0600-\u06FF]/.test(legacy)) return { storeNameEn: '', storeNameAr: legacy };
  return { storeNameEn: legacy, storeNameAr: '' };
}

/** Locale-aware store display name — never invent cross-language copy. */
export function resolveStoreDisplayName(
  identity: Pick<StoreIdentitySettings, 'storeName' | 'storeNameEn' | 'storeNameAr'> | null | undefined,
  isAr: boolean,
  fallback = '',
): string {
  const split = splitStoreName({
    storeName: identity?.storeName || '',
    storeNameEn: identity?.storeNameEn,
    storeNameAr: identity?.storeNameAr,
  });
  if (isAr) return (split.storeNameAr || identity?.storeName || fallback || '').trim();
  return (split.storeNameEn || identity?.storeName || fallback || '').trim();
}

/** Cache-bust media URL so overwritten CDN/path icons refresh immediately. */
export function bustMediaUrl(url: string | null | undefined): string {
  const raw = String(url || '').trim();
  if (!raw || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
  const stamp = Date.now();
  if (/[?&]v=/.test(raw)) return raw.replace(/([?&]v=)[^&]*/i, `$1${stamp}`);
  return `${raw}${raw.includes('?') ? '&' : '?'}v=${stamp}`;
}

export function readStoreIdentity(
  storeId: string,
  fallback: { id?: string; name: string; ownerEmail?: string; logo?: string; phone?: string; whatsapp?: string },
): StoreIdentitySettings {
  const fallbackWithId = { ...fallback, id: fallback.id || storeId };
  const healContact = (data: StoreIdentitySettings): StoreIdentitySettings => {
    const next = { ...data };
    const fbPhone = String(fallback.phone || '').trim();
    const fbWa = String(fallback.whatsapp || '').trim();
    // Empty localStorage identity must not blank live API store phone / WhatsApp.
    if (!String(next.phone || '').trim() && fbPhone) next.phone = fbPhone;
    if (!String(next.whatsapp || '').trim() && (fbWa || fbPhone)) next.whatsapp = fbWa || fbPhone;
    return next;
  };
  try {
    const raw = localStorage.getItem(storageKey(storeId));
    if (raw) {
      return healContact(
        stripInventedContacts({
          ...defaultStoreIdentity(fallbackWithId),
          ...JSON.parse(raw),
        }),
      );
    }
  } catch {
    /* ignore */
  }
  return healContact(stripInventedContacts(defaultStoreIdentity(fallbackWithId)));
}

/** Push bilingual store name (+ optional logo) into customHeader.logo mirrors. */
function syncStoreBrandIntoTheme(storeId: string, identity: StoreIdentitySettings): void {
  if (!storeId || typeof localStorage === 'undefined') return;
  const { storeNameEn, storeNameAr } = splitStoreName(identity);
  const en = (storeNameEn || identity.storeName || '').trim();
  const ar = (storeNameAr || '').trim();
  const logo = String(identity.logoUrl || '').trim();
  if (!en && !ar && !logo) return;

  const prefix = 'unityteck_theme_settings_';
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix) && k.includes(storeId)) keys.push(k);
    }
  } catch {
    /* ignore */
  }
  if (!keys.includes(`unityteck_theme_settings_full_${storeId}`)) {
    keys.push(`unityteck_theme_settings_full_${storeId}`);
  }

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw) as {
        customHeader?: { logo?: Record<string, unknown> };
        identity?: StoreIdentitySettings;
        updatedAt?: string;
      };
      if (!data.customHeader) data.customHeader = {};
      const prevLogo = (data.customHeader.logo || {}) as Record<string, unknown>;
      data.customHeader.logo = {
        ...prevLogo,
        ...(en ? { titleEn: en } : {}),
        ...(ar ? { titleAr: ar } : {}),
        ...(logo ? { imageUrl: logo } : {}),
        // Merchant typed a brand name — show it on storefront (both locales)
        applyTitle: true,
      };
      if (data.identity) {
        data.identity = { ...data.identity, ...identity };
      }
      data.updatedAt = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      /* ignore corrupt blob */
    }
  }
}

export function writeStoreIdentity(storeId: string, data: StoreIdentitySettings): void {
  const next = stripInventedContacts({ ...data, updatedAt: new Date().toISOString() });
  // Never persist platform/legacy default login BG — empty means resolve → DEFAULT_LOGIN_SIDE_IMAGE
  if (isDefaultLoginSideImage(next.loginSideImageUrl)) next.loginSideImageUrl = '';
  localStorage.setItem(storageKey(storeId), JSON.stringify(next));
  // Auto-propagate this store’s WhatsApp + email into header/footer/slider/builder mirrors
  syncStoreContactIntoTheme(storeId, next);
  // Bilingual name + logo → header titleEn/titleAr so AR storefront updates too
  syncStoreBrandIntoTheme(storeId, next);
  if (typeof window !== 'undefined') {
    bumpStore(storeId, 'settings');
    bumpStore(storeId, 'theme');
    window.dispatchEvent(
      new CustomEvent('unityteck-theme-identity', {
        detail: { storeId, updatedAt: next.updatedAt },
      }),
    );
    window.dispatchEvent(
      new CustomEvent('unityteck-data', {
        detail: { tag: `store:${storeId}:theme`, version: Date.now() },
      }),
    );
  }
}

/**
 * Load identity from Hostinger theme-settings for this store_id only.
 * Writes local cache for offline paint; does not PUT back to API.
 */
export async function hydrateStoreIdentityFromApi(
  storeId: string,
  fallback: { id?: string; name: string; ownerEmail?: string; logo?: string; phone?: string; whatsapp?: string },
): Promise<StoreIdentitySettings> {
  const local = readStoreIdentity(storeId, fallback);
  if (!storeId || typeof window === 'undefined') return local;
  try {
    const { isApiEnabled } = await import('../../api/client');
    if (!isApiEnabled()) return local;
    const { fetchThemeSettingsApi } = await import('../../api/tenantApi');
    const data = await fetchThemeSettingsApi(storeId);
    const remote = data?.settings?.identity;
    if (!remote || typeof remote !== 'object' || Array.isArray(remote)) {
      return local;
    }
    const raw = {
      ...defaultStoreIdentity({ ...fallback, id: storeId }),
      ...(remote as StoreIdentitySettings),
    } as StoreIdentitySettings;
    const merged = stripInventedContacts(raw);
    // Prefer remote when it has any merchant signal; else keep cleaned local
    const hasRemoteSignal = Boolean(
      String(merged.storeNameEn || merged.storeNameAr || merged.storeName || '').trim() ||
        String(merged.logoUrl || '').trim() ||
        String(merged.faviconUrl || '').trim() ||
        String(merged.taglineEn || merged.taglineAr || '').trim() ||
        String(merged.email || merged.phone || merged.whatsapp || '').trim() ||
        String(raw.storeNameEn || raw.storeNameAr || raw.storeName || '').trim(),
    );
    if (!hasRemoteSignal) return local;
    writeStoreIdentity(storeId, merged);

    // Heal Hostinger when remote still has /src/assets or demo leftovers
    const needsHeal =
      String(raw.logoUrl || '').trim() !== String(merged.logoUrl || '').trim() ||
      String(raw.faviconUrl || '').trim() !== String(merged.faviconUrl || '').trim() ||
      String(raw.commercialReg || '').trim() !== String(merged.commercialReg || '').trim() ||
      String(raw.vatNumber || '').trim() !== String(merged.vatNumber || '').trim() ||
      String(raw.instagram || '').trim() !== String(merged.instagram || '').trim();
    if (needsHeal) {
      void (async () => {
        try {
          const { persistAllThemeSettingsNow, readAllThemeSettings } = await import(
            './themeSettingsStore'
          );
          const full = readAllThemeSettings(storeId, { id: storeId, name: fallback.name || '', logo: fallback.logo });
          await persistAllThemeSettingsNow(storeId, { ...full, identity: merged });
        } catch {
          /* local already cleaned; next Save will sync */
        }
      })();
    }
    return merged;
  } catch {
    return local;
  }
}

/** Resolve portal login full-bleed BG for a store (or platform default). */
export function resolveLoginSideImageUrl(
  storeId: string | null | undefined,
  fallbackStore?: { id?: string; name?: string; ownerEmail?: string; logo?: string },
): string {
  if (!storeId) return DEFAULT_LOGIN_SIDE_IMAGE;
  try {
    const identity = readStoreIdentity(storeId, {
      id: storeId,
      name: fallbackStore?.name || '',
      ownerEmail: fallbackStore?.ownerEmail,
      logo: fallbackStore?.logo,
    });
    const url = String(identity.loginSideImageUrl || '').trim();
    if (isDefaultLoginSideImage(url)) return DEFAULT_LOGIN_SIDE_IMAGE;
    return url;
  } catch {
    return DEFAULT_LOGIN_SIDE_IMAGE;
  }
}
