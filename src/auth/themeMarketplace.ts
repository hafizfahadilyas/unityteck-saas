/**
 * Theme Marketplace pricing — store-scoped free vs paid.
 * Only the current store’s own default/official theme is Included Free.
 * Every other catalog theme is paid (no cross-tenant free duplicates).
 */

import type { Store, ThemeItem } from '../types';
import { getDefaultStoreTheme } from './defaultTheme';
import { FLOWERS_THEME_ID } from '../themes/flowersPremium/pack';
import { SAUDIA_TRANSPORT_THEME_ID } from '../themes/saudiaTransport';

export const THEME_MARKET_PRICE_SAR = 49;

/** Canonical free coffee theme id (one coffee theme — no catalog duplicates). */
export const COFFEE_OFFICIAL_THEME_ID = 'theme-coffee-artisan';

export type ThemeStoreMeta = {
  priceSar: number;
  isProOnly: boolean;
  publisherAr: string;
  publisherEn: string;
  blurbAr: string;
  blurbEn: string;
};

const THEME_BLURBS: Record<string, Omit<ThemeStoreMeta, 'priceSar' | 'isProOnly'>> = {
  [FLOWERS_THEME_ID]: {
    publisherAr: 'منصة سوق · ثيم هدايا مكة الفاخر',
    publisherEn: 'Unityteck Store · Mecca Luxury Gifts Theme',
    blurbAr:
      'ثيم الزهور الفاخر الحصري المعتمد لمتجر هدايا مكة ومحلات الورود والهدايا · ٢٠ قسماً تفاعلياً وسلايدر ثلاثي الأبعاد.',
    blurbEn:
      'Exclusive official Luxury Floral & Gifts theme for Mecca Gifts. Features 20 interactive sections, 3D slider, video reels, and express checkout.',
  },
  'theme-makkah-royal': {
    publisherAr: 'يونيتك · بوتيك هدايا مكة',
    publisherEn: 'Unityteck · Mecca Gifts Boutique',
    blurbAr: 'تصميم ملكي خاص بمتجر هدايا مكة للباقات الحصرية والتغليف الفاخر.',
    blurbEn: 'Royal boutique theme tailored for Mecca Gifts exclusive floral arrangements.',
  },
  [SAUDIA_TRANSPORT_THEME_ID]: {
    publisherAr: 'مؤسسة بلاكو للتجارة · ثيم تنجيد ودعاسات السيارات الفاخرة',
    publisherEn: 'Blacko Trading · Luxury Car Upholstery & Saudi Transport Theme',
    blurbAr:
      'الثيم الرسمي المعتمد لمؤسسة بلاكو للتجارة والنقل السعودي · حاسبة تفصيل ليزري فورية، 10 أقسام و10 منتجات، وبكج اليوم الوطني 20%.',
    blurbEn:
      'Official luxury theme for Blacko Trading and Saudi transport. Features instant laser fit calculator, 10 categories, 10 products and National Day 20% bundle.',
  },
  [COFFEE_OFFICIAL_THEME_ID]: {
    publisherAr: 'هاي برو السعودية · الثيم الرسمي للقهوة',
    publisherEn: 'HiBrew KSA · Official Coffee Flagship Theme',
    blurbAr:
      'الثيم الرسمي المعتمد لمتجر هاي برو السعودية · مكائن 20 بار، مطاحن التيتانيوم، وأركان القهوة الفاخرة.',
    blurbEn:
      'Official flagship theme for HiBrew KSA: 20-bar espresso machines, titanium mills, and luxury barista stations.',
  },
  'theme-coffee': {
    publisherAr: 'هاي برو السعودية · الثيم الرسمي للقهوة',
    publisherEn: 'HiBrew KSA · Official Coffee Flagship Theme',
    blurbAr:
      'الثيم الرسمي المعتمد لمتجر هاي برو السعودية · مكائن 20 بار، مطاحن التيتانيوم، وأركان القهوة الفاخرة.',
    blurbEn:
      'Official flagship theme for HiBrew KSA: 20-bar espresso machines, titanium mills, and luxury barista stations.',
  },
};

/** Coffee theme family ids that resolve to the same live pack. */
export function isCoffeeThemeId(themeId?: string | null): boolean {
  if (!themeId) return false;
  const id = themeId.toLowerCase();
  return (
    id === 'theme-coffee' ||
    id === COFFEE_OFFICIAL_THEME_ID ||
    id === 'coffee' ||
    id === 'hibrew' ||
    id === 'coffeeroasters' ||
    id.includes('coffee')
  );
}

export function isCoffeeStoreId(storeId?: string | null): boolean {
  if (!storeId) return false;
  return storeId === 'store-coffee' || storeId.includes('coffee');
}

/**
 * Only the store’s own default/official theme is free for that store.
 * Cross-store themes are never free (no “Included Free” leaks).
 */
export function isIncludedFreeTheme(storeId: string, theme: ThemeItem): boolean {
  const nativeId = getDefaultStoreTheme(storeId);

  if (isCoffeeStoreId(storeId)) {
    // One free coffee theme only
    return theme.id === COFFEE_OFFICIAL_THEME_ID || theme.id === 'theme-coffee';
  }

  if (theme.storeId === storeId && theme.isDefault) return true;
  if (theme.id === nativeId) return true;

  // Flowers / gifts store
  if (
    (storeId === 'store-1' || storeId.includes('flower') || storeId.includes('gift')) &&
    (theme.id === FLOWERS_THEME_ID || theme.id === 'theme-mecca-gifts')
  ) {
    return true;
  }

  // Bleco / car store
  if (
    (storeId === 'store-bleco' || storeId.includes('bleco') || storeId.includes('car')) &&
    theme.id === SAUDIA_TRANSPORT_THEME_ID
  ) {
    return true;
  }

  return false;
}

export function resolveThemeStoreMeta(theme: ThemeItem, store: Store): ThemeStoreMeta {
  const blurb = THEME_BLURBS[theme.id];
  const free = isIncludedFreeTheme(store.id, theme);

  return {
    priceSar: free ? 0 : THEME_MARKET_PRICE_SAR,
    // Marketplace paid themes stay installable; Pro gate is plan-level elsewhere
    isProOnly: false,
    publisherAr: blurb?.publisherAr || 'يونيتك للمتاجر',
    publisherEn: blurb?.publisherEn || 'Unityteck Platforms',
    blurbAr: blurb?.blurbAr || theme.taglineAr || theme.tagline,
    blurbEn: blurb?.blurbEn || theme.taglineEn || theme.tagline,
  };
}

/** Deduplicate marketplace catalog by theme id (first wins). Collapse coffee aliases → one card. */
export function dedupeThemesById(themes: ThemeItem[]): ThemeItem[] {
  const byId = new Map<string, ThemeItem>();
  for (const t of themes) {
    if (!t?.id) continue;
    const isCoffeeAlias =
      t.id === 'theme-coffee' ||
      t.id === COFFEE_OFFICIAL_THEME_ID ||
      t.id === 'theme-coffee-dark-espresso' ||
      t.id === 'theme-hibrew-3d-showcase';
    // Extra coffee skins are removed from catalog — only official flagship remains
    if (t.id === 'theme-coffee-dark-espresso' || t.id === 'theme-hibrew-3d-showcase') {
      continue;
    }
    const key = isCoffeeAlias ? COFFEE_OFFICIAL_THEME_ID : t.id;
    if (!byId.has(key)) {
      byId.set(
        key,
        key === COFFEE_OFFICIAL_THEME_ID
          ? { ...t, id: COFFEE_OFFICIAL_THEME_ID, isDefault: true }
          : t,
      );
    }
  }
  return Array.from(byId.values());
}

/**
 * Sort: this store’s free theme first, then own paid, then other stores’ paid.
 * Avoids “every store’s free theme” repeating at the top of every marketplace.
 */
export function sortThemesForStoreMarket(themes: ThemeItem[], storeId: string, activeThemeId: string): ThemeItem[] {
  const score = (t: ThemeItem) => {
    if (t.id === activeThemeId) return 0;
    if (isIncludedFreeTheme(storeId, t)) return 1;
    if (t.storeId === storeId) return 2;
    return 3;
  };
  return [...themes].sort((a, b) => score(a) - score(b));
}
