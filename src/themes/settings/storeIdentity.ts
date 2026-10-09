/**
 * Theme Settings page 01 — Store Identity (Phase 5.1).
 * Stored per store_id; storefront + SEO read these fields.
 */

export type StoreIdentitySettings = {
  storeName: string;
  taglineEn: string;
  taglineAr: string;
  logoUrl: string;
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

export function defaultStoreIdentity(store: {
  name: string;
  ownerEmail?: string;
  logo?: string;
}): StoreIdentitySettings {
  return {
    storeName: store.name,
    taglineEn: 'Fresh natural flowers & Holy Haram gifts',
    taglineAr: 'باقات ورد طبيعي وهدايا الحرم المكي الشريف',
    logoUrl: (store.logo && store.logo.startsWith('http')) ? store.logo : 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=300&q=80',
    phone: '+966 12 555 8920',
    whatsapp: '+966 50 442 8819',
    email: store.ownerEmail || '',
    addressEn: 'Al-Aziziyah, Makkah Al-Mukarramah',
    addressAr: 'العزيزية، مكة المكرمة',
    city: 'Makkah',
    commercialReg: '4031099241',
    vatNumber: '30048821900003',
    instagram: '',
    updatedAt: new Date().toISOString(),
  };
}

const storageKey = (storeId: string) => `unityteck_theme_identity_${storeId}`;

export function readStoreIdentity(
  storeId: string,
  fallback: { name: string; ownerEmail?: string; logo?: string },
): StoreIdentitySettings {
  try {
    const raw = localStorage.getItem(storageKey(storeId));
    if (raw) {
      return { ...defaultStoreIdentity(fallback), ...JSON.parse(raw) };
    }
  } catch {
    /* ignore */
  }
  return defaultStoreIdentity(fallback);
}

export function writeStoreIdentity(storeId: string, data: StoreIdentitySettings): void {
  const next = { ...data, updatedAt: new Date().toISOString() };
  localStorage.setItem(storageKey(storeId), JSON.stringify(next));
  if (typeof window !== 'undefined') {
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
