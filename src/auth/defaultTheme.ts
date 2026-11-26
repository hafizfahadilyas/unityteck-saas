/**
 * Default commerce theme pack id for new stores (docs/36 · docs/38).
 * Prefer getDefaultStoreTheme(storeId) — never force Flora Luxe on every tenant.
 */

export const DEFAULT_COMMERCE_THEME_ID = 'theme-souq-common-retail';

export const getDefaultStoreTheme = (storeId?: string): string => {
  // Coffee = one official theme only (catalog id theme-coffee-artisan; registry aliases theme-coffee)
  if (storeId === 'store-coffee' || storeId?.includes('coffee')) return 'theme-coffee-artisan';
  if (storeId === 'store-bleco' || storeId?.includes('bleco') || storeId?.includes('car')) {
    return 'theme-saudia-transport';
  }
  if (storeId === 'store-1' || storeId?.includes('flora') || storeId?.includes('flower')) {
    return 'theme-flora-luxe';
  }
  // Post-pilot / template / every new merchant → Souq common retail
  return DEFAULT_COMMERCE_THEME_ID;
};

export type ThemeMode = 'basic' | 'full';

export type DefaultThemeSettings = {
  mode: ThemeMode;
  homepage_style: string;
  homepage_styles: string[];
  sections: string[];
  customizable: string[];
  branding: {
    accent_color: string;
    store_name?: string | null;
    logo?: string | null;
  };
};

/** Full common theme pack (builder) for Pro / Premium / Custom. */
export function isPremiumThemePlan(planCode: string): boolean {
  const code = (planCode || '').toLowerCase().trim();
  return code === 'pro' || code === 'premium' || code === 'custom';
}

export function defaultThemeSettings(
  planCode: string,
  store?: { name?: string; accentColor?: string; logo?: string } | null,
): DefaultThemeSettings {
  const accent = store?.accentColor || '#0f766e';
  const full = isPremiumThemePlan(planCode);

  return {
    mode: full ? 'full' : 'basic',
    homepage_style: 'Modern Bento',
    homepage_styles: full
      ? ['Modern Bento', 'Grid Showcase', 'Soft Minimalist']
      : ['Modern Bento'],
    sections: [
      'announcement',
      'header',
      'hero',
      'features',
      'categories',
      'featured_products',
      'shop_by_category',
      'special_offer',
      'promotions',
      'metrics',
      'testimonials',
      'newsletter',
      'footer',
    ],
    customizable: [
      'accent_color',
      'logo',
      'fonts',
      'header',
      'footer',
      'banners',
      'product_cards',
      'custom_css',
    ],
    branding: {
      accent_color: accent,
      store_name: store?.name ?? null,
      logo: store?.logo ?? null,
    },
  };
}
