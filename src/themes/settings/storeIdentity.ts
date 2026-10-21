/**
 * Theme Settings page 01 — Store Identity (Phase 5.1).
 * Stored per store_id; storefront + SEO read these fields.
 */

import { bumpStore } from '../../api/cacheTags';

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

export function defaultStoreIdentity(store?: {
  id?: string;
  name?: string;
  ownerEmail?: string;
  logo?: string;
}): StoreIdentitySettings {
  const safeStore = store || { id: '', name: '' };
  const storeId = safeStore.id || '';
  const storeName = safeStore.name || '';
  const isCoffee = storeId === 'store-coffee' || storeName.includes('قهوة') || storeName.includes('Coffee');
  const isBleco =
    storeId === 'store-bleco' ||
    storeName.includes('بلاكو') ||
    storeName.includes('Blacko') ||
    storeName.includes('تنجيد') ||
    storeName.includes('السعيدي') ||
    storeName.includes('السيارات') ||
    storeName.includes('Car') ||
    storeName.includes('cars') ||
    storeName.includes('Al-Saeedi');

  if (isCoffee) {
    return {
      storeName: storeName || 'متجر مكائن ومستلزمات القهوة (HiBrew KSA)',
      taglineEn: 'HiBrew KSA Official Coffee Store · 20-Bar Machines, Precision Mills & Barista Gear',
      taglineAr: 'متخصصون في بيع مكائن القهوة و مستلزماتها ذات جودة عالية و بسعر مناسب ☕️ | مكائن 20 بار، مطاحن بن تيتانيوم، أركان ودواليب القهوة الفاخرة بالسعودية',
      logoUrl: (safeStore.logo && safeStore.logo.startsWith('http'))
        ? safeStore.logo
        : '/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
      phone: '+966 11 489 2030',
      whatsapp: '+966 54 987 6543',
      email: safeStore.ownerEmail || 'info@specialtycoffee.sa',
      addressEn: 'Riyadh Showroom, King Fahd Road, Saudi Arabia',
      addressAr: 'معرض الرياض الرئيسي، طريق الملك فهد، المملكة العربية السعودية',
      city: 'Riyadh',
      commercialReg: '1010892410',
      vatNumber: '31048821900003',
      instagram: 'https://instagram.com/hibrew.ksa',
      updatedAt: new Date().toISOString(),
    };
  }

  if (isBleco) {
    return {
      storeName: storeName || 'متجر السعيدي لخدمات السيارات (مؤسسة بلاكو)',
      taglineEn: 'Luxury Car Upholstery, Tailored Seat Covers & 5D/7D Diamond Floor Mats',
      taglineAr: 'تنجيد وتلابيس مراتب وتفصيل أرضيات دايموند 5D واكسسوارات سيارات',
      logoUrl: (safeStore.logo && safeStore.logo.startsWith('http'))
        ? safeStore.logo
        : 'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/wYYVD/OZbzrkkW0icMZlcDNOiZnU4PSjwq6WxXgCkwT0PQ.png',
      phone: '+966 59 775 7086',
      whatsapp: '+966 59 775 7086',
      email: safeStore.ownerEmail || 'support@tanjeedmakkah.com',
      addressEn: 'Al-Shawqiyyah, Makkah Al-Mukarramah, Saudi Arabia',
      addressAr: 'حي الشوقية، مكة المكرمة، المملكة العربية السعودية',
      city: 'Makkah',
      commercialReg: '7005616136',
      vatNumber: '0000180462',
      instagram: 'https://instagram.com/tanjeedmakkah',
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    storeName: storeName || 'هدايا مكة',
    taglineEn: 'Fresh natural flowers & Holy Haram gifts',
    taglineAr: 'باقات ورد طبيعي وهدايا الحرم المكي الشريف',
    logoUrl: (safeStore.logo && safeStore.logo.startsWith('http')) ? safeStore.logo : 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=300&q=80',
    phone: '+966 12 555 8920',
    whatsapp: '+966 50 442 8819',
    email: safeStore.ownerEmail || 'giftshop2030m@gmail.com',
    addressEn: 'Al-Aziziyah, Makkah Al-Mukarramah',
    addressAr: 'العزيزية، مكة المكرمة',
    city: 'Makkah',
    commercialReg: '4031099241',
    vatNumber: '30048821900003',
    instagram: 'https://instagram.com/giftshop2030m',
    updatedAt: new Date().toISOString(),
  };
}

const storageKey = (storeId: string) => `unityteck_theme_identity_${storeId}`;

export function readStoreIdentity(
  storeId?: string,
  fallback?: { id?: string; name?: string; ownerEmail?: string; logo?: string },
): StoreIdentitySettings {
  const safeStoreId = storeId || fallback?.id || '';
  const fallbackWithId = {
    id: safeStoreId,
    name: fallback?.name || '',
    ownerEmail: fallback?.ownerEmail,
    logo: fallback?.logo,
  };
  try {
    if (safeStoreId) {
      const raw = localStorage.getItem(storageKey(safeStoreId));
      if (raw) {
        return { ...defaultStoreIdentity(fallbackWithId), ...JSON.parse(raw) };
      }
    }
  } catch {
    /* ignore */
  }
  return defaultStoreIdentity(fallbackWithId);
}

export function writeStoreIdentity(storeId: string, data: StoreIdentitySettings): void {
  const next = { ...data, updatedAt: new Date().toISOString() };
  localStorage.setItem(storageKey(storeId), JSON.stringify(next));
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
