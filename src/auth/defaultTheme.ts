/**
 * Default commerce theme pack id for new stores.
 * Prefer getDefaultStoreTheme(storeId) — never force Flora Luxe on every tenant.
 */

export const DEFAULT_COMMERCE_THEME_ID = 'theme-mecca-gifts';

export const getDefaultStoreTheme = (storeId?: string): string => {
  if (storeId === 'store-coffee' || storeId?.includes('coffee')) return 'theme-coffee';
  if (storeId === 'store-bleco' || storeId?.includes('bleco') || storeId?.includes('car')) return 'theme-saudia-transport';
  if (storeId === 'store-1' || storeId?.includes('flower') || storeId?.includes('gift')) return 'theme-mecca-gifts';
  // Unknown new store: neutral default pack (merchant can switch) — no Flora cross-leak
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

export function isPremiumThemePlan(planCode: string): boolean {
  return true; // All stores and brands have full flagship theme access
}

export function defaultThemeSettings(
  planCode: string,
  store?: { name?: string; accentColor?: string; logo?: string } | null,
): DefaultThemeSettings {
  const accent = store?.accentColor || '#059669';

  return {
    mode: 'full',
    homepage_style: 'Default Commerce',
    homepage_styles: [
      'Default Commerce',
      'Eid Home',
      'Ramadan Home',
      'Valentine Home',
    ],
    sections: [
      'announcement',
      'header',
      'hero',
      'categories',
      'product_tabs',
      'image_grid',
      'features',
      'special_offer',
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
