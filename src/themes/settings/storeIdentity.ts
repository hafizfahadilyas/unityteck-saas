/**
 * Theme Settings page 01 — Store Identity (Phase 5.1).
 * Stored per store_id; storefront + SEO read these fields.
 * Zero-mock: no giftshop/coffee/bleco hardcoded identity for new tenants.
 */

import { bumpStore } from '../../api/cacheTags';
import { isValidMediaUrl } from '../../utils/imageFallback';

export type StoreIdentitySettings = {
  storeName: string;
  taglineEn: string;
  taglineAr: string;
  logoUrl: string;
  faviconUrl?: string;
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

export function defaultStoreIdentity(store?: {
  id?: string;
  name?: string;
  ownerEmail?: string;
  logo?: string;
  favicon?: string;
}): StoreIdentitySettings {
  const safeStore = store || { id: '', name: '' };
  return {
    storeName: safeStore.name || '',
    taglineEn: '',
    taglineAr: '',
    logoUrl: safeStore.logo && isValidMediaUrl(safeStore.logo) ? safeStore.logo : '',
    phone: '',
    whatsapp: '',
    email: safeStore.ownerEmail || '',
    addressEn: '',
    addressAr: '',
    city: '',
    commercialReg: '',
    vatNumber: '',
    instagram: '',
    faviconUrl: safeStore.favicon || '',
    updatedAt: new Date().toISOString(),
  };
}

const storageKey = (storeId: string) => `unityteck_theme_identity_${storeId}`;

export function readStoreIdentity(
  storeId?: string,
  fallback?: { id?: string; name?: string; ownerEmail?: string; logo?: string; favicon?: string },
): StoreIdentitySettings {
  const safeStoreId = storeId || fallback?.id || '';
  const fallbackWithId = {
    id: safeStoreId,
    name: fallback?.name || '',
    ownerEmail: fallback?.ownerEmail,
    logo: fallback?.logo,
    favicon: fallback?.favicon,
  };
  try {
    if (safeStoreId) {
      const raw = localStorage.getItem(storageKey(safeStoreId));
      if (raw) {
        const parsed = JSON.parse(raw) as StoreIdentitySettings;
        if (parsed && typeof parsed === 'object') {
          return {
            ...defaultStoreIdentity(fallbackWithId),
            ...parsed,
            storeName: parsed.storeName || fallbackWithId.name || '',
            email: parsed.email || fallbackWithId.ownerEmail || '',
            logoUrl:
              parsed.logoUrl && isValidMediaUrl(parsed.logoUrl)
                ? parsed.logoUrl
                : fallbackWithId.logo && isValidMediaUrl(fallbackWithId.logo)
                  ? fallbackWithId.logo
                  : '',
          };
        }
      }
    }
  } catch {
    // fall through
  }
  return defaultStoreIdentity(fallbackWithId);
}

export function writeStoreIdentity(storeId: string, identity: StoreIdentitySettings): void {
  try {
    localStorage.setItem(
      storageKey(storeId),
      JSON.stringify({ ...identity, updatedAt: new Date().toISOString() }),
    );
    bumpStore(storeId, 'theme');
  } catch {
    // ignore quota errors
  }
}
