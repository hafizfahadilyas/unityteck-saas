import { Store } from '../types';

/**
 * Returns a clean, concise, language-appropriate store name for dashboard and UI.
 * In Arabic: Returns the clean full Arabic name (e.g. "هدايا مكة" or "هدايا مكة للزهور والهدايا").
 * In English: Returns the clean concise English name (e.g. "Makkah Flowers").
 * Never mixes both languages into a long overflowing title like "هدايا مكة - متجر الورود والهدايا الفاخرة (Gift Shop SA)".
 */
export function getStoreDisplayName(store?: Partial<Store> | null, locale: string = 'ar'): string {
  if (!store) {
    return locale === 'ar' ? 'المتجر' : 'Store';
  }

  const isAr = locale === 'ar';
  const rawName = (store.name || '').trim();
  const slug = (store.slug || '').toLowerCase();
  const id = String(store.id || '');

  const isMakkahFlowers =
    id === 'store-1' ||
    id === '1' ||
    slug === 'giftshop-sa' ||
    slug === 'makkah-fresh-flowers' ||
    /هدايا مكة|ورود مكة|gift ?shop|makkah/i.test(rawName);

  if (isMakkahFlowers) {
    if (isAr) {
      if (store.nameAr && !store.nameAr.includes('(')) return store.nameAr;
      return 'هدايا مكة للزهور والهدايا';
    } else {
      if (store.nameEn && !/[\u0600-\u06FF]/.test(store.nameEn)) return store.nameEn;
      return 'Makkah Flowers';
    }
  }

  if (isAr) {
    if (store.nameAr && !store.nameAr.includes('(')) return store.nameAr;
    // Strip trailing English parenthesized text, e.g. "اسم المتجر (Store Name)" -> "اسم المتجر"
    const cleaned = rawName.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const parts = cleaned.split(/[-–—]/);
    const arPart = parts.find((p) => /[\u0600-\u06FF]/.test(p));
    if (arPart) return arPart.trim();
    return cleaned || 'المتجر';
  } else {
    if (store.nameEn && !/[\u0600-\u06FF]/.test(store.nameEn)) return store.nameEn;
    // Extract English within parentheses or after hyphen if present
    const matchParen = rawName.match(/\(([^)]+)\)/);
    if (matchParen && /^[A-Za-z0-9\s&'-]+$/.test(matchParen[1].trim())) {
      return matchParen[1].trim();
    }
    const parts = rawName.split(/[-–—]/);
    const enPart = parts.find((p) => /[A-Za-z]/.test(p) && !/[\u0600-\u06FF]/.test(p));
    if (enPart) return enPart.trim();
    // If name is purely Arabic and no English was found, fallback
    if (/[\u0600-\u06FF]/.test(rawName) && !/[A-Za-z]/.test(rawName)) {
      return store.slug || 'Store';
    }
    return rawName || 'Store';
  }
}
