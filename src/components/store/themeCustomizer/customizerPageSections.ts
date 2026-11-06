/**
 * Page → customizer sidebar sections (isolated per theme family).
 * Sitewide chrome always appears; page-specific panels follow the live preview route.
 */

const SITEWIDE_CORE = [
  '00_header_builder',
  '01_store_identity',
  '03_store_colors',
  '19_custom_code',
] as const;

const COFFEE_HOME = [
  ...SITEWIDE_CORE,
  'C-ANN',
  'C-FCP',
  'C-HERO',
  'C-FSB',
  'C-FP',
  'C-IMG',
  'C-FOOT',
  'C-ICON',
  'C-BEN',
  'C-PC',
  'C-PCB',
  'C-NEWS',
] as const;

const FLOWERS_HOME = [
  ...SITEWIDE_CORE,
  '02_general_options',
  '13_announcement_bar',
  '05_advanced_slider',
  '15_product_cards',
  '07_product_tabs',
  '08_detailed_products',
  '06_product_videos',
  '11_banners',
  '09_image_grid',
  '10_custom_links',
  '12_blog',
  '14_enhanced_features',
  '16_custom_products',
  '17_special_offer_countdown',
  '18_store_statistics',
] as const;

/** Coffee / HiBrew page map */
export const COFFEE_PAGE_SECTIONS: Record<string, readonly string[]> = {
  home: COFFEE_HOME,
  products: [...SITEWIDE_CORE, 'C-FCP', 'C-FP', 'C-SHOP', 'C-EDIT', 'C-FOOT', 'C-ICON'],
  'product-detail': [...SITEWIDE_CORE, 'C-EDIT', 'C-FP', 'C-SHOP', 'C-FOOT', 'C-ICON'],
  'product-buy': [...SITEWIDE_CORE, 'C-EDIT', 'C-FOOT'],
  cart: [...SITEWIDE_CORE, 'C-SHOP', 'C-FOOT', 'C-BEN'],
  checkout: [...SITEWIDE_CORE, 'C-SHOP', 'C-FOOT'],
  reviews: [...SITEWIDE_CORE, 'C-REV', 'C-FOOT'],
  profile: [...SITEWIDE_CORE, 'C-FOOT', 'C-BEN'],
  warranty: [...SITEWIDE_CORE, 'C-FOOT', 'C-ICON'],
  about: [...SITEWIDE_CORE, 'C-FOOT', 'C-ICON'],
  contact: [...SITEWIDE_CORE, 'C-FOOT'],
  faq: [...SITEWIDE_CORE, 'C-FOOT'],
  'custom-order': [...SITEWIDE_CORE, 'C-CPB', 'C-FOOT', 'C-ICON'],
  thankyou: [...SITEWIDE_CORE, 'C-FOOT'],
};

/** Flowers / gifts page map */
export const FLOWERS_PAGE_SECTIONS: Record<string, readonly string[]> = {
  home: FLOWERS_HOME,
  catalog: [
    ...SITEWIDE_CORE,
    '02_general_options',
    '04_category_cart_customer',
    '15_product_cards',
    '10_custom_links',
  ],
  product: [
    ...SITEWIDE_CORE,
    '02_general_options',
    '15_product_cards',
    '08_detailed_products',
    '06_product_videos',
  ],
  cart: [...SITEWIDE_CORE, '04_category_cart_customer', '14_enhanced_features'],
  checkout: [...SITEWIDE_CORE, '04_category_cart_customer'],
  crm: [...SITEWIDE_CORE, '04_category_cart_customer'],
  thankyou: [...SITEWIDE_CORE, '14_enhanced_features'],
  reviews: [...SITEWIDE_CORE, '18_store_statistics', '12_blog'],
  faq: [...SITEWIDE_CORE, '02_general_options'],
};

/** Transport / Bleco page map */
export const TRANSPORT_PAGE_SECTIONS: Record<string, readonly string[]> = {
  home: FLOWERS_HOME,
  catalog: [
    ...SITEWIDE_CORE,
    '02_general_options',
    '04_category_cart_customer',
    '15_product_cards',
    '10_custom_links',
  ],
  product: [
    ...SITEWIDE_CORE,
    '15_product_cards',
    '08_detailed_products',
    '06_product_videos',
  ],
  cart: [...SITEWIDE_CORE, '04_category_cart_customer'],
  checkout: [...SITEWIDE_CORE, '04_category_cart_customer'],
  profile: [...SITEWIDE_CORE, '04_category_cart_customer'],
  reviews: [...SITEWIDE_CORE, '18_store_statistics'],
  faq: [...SITEWIDE_CORE, '02_general_options'],
};

export const DEFAULT_PAGE_SECTIONS: Record<string, readonly string[]> = {
  home: FLOWERS_HOME,
  catalog: [
    ...SITEWIDE_CORE,
    '02_general_options',
    '04_category_cart_customer',
    '15_product_cards',
  ],
  product: [...SITEWIDE_CORE, '15_product_cards', '08_detailed_products'],
  cart: [...SITEWIDE_CORE, '04_category_cart_customer'],
  checkout: [...SITEWIDE_CORE, '04_category_cart_customer'],
  reviews: [...SITEWIDE_CORE, '18_store_statistics'],
  about: [...SITEWIDE_CORE, '02_general_options'],
  contact: [...SITEWIDE_CORE],
  faq: [...SITEWIDE_CORE, '02_general_options'],
};

export type CustomizerThemeFamily = 'coffee' | 'flowers' | 'transport' | 'default';

export function resolveCustomizerThemeFamily(themeId: string | undefined | null): CustomizerThemeFamily {
  const tid = (themeId || '').toLowerCase();
  if (tid.includes('coffee') || tid.includes('hibrew') || tid.includes('roaster')) return 'coffee';
  if (tid.includes('transport') || tid.includes('car') || tid.includes('bleco') || tid.includes('saudia')) {
    return 'transport';
  }
  if (tid.includes('flower') || tid.includes('gift') || tid.includes('hadaya') || tid.includes('flora')) {
    return 'flowers';
  }
  return 'default';
}

export function sectionsForPreviewPage(
  family: CustomizerThemeFamily,
  pageId: string,
): readonly string[] | null {
  const map =
    family === 'coffee'
      ? COFFEE_PAGE_SECTIONS
      : family === 'flowers'
        ? FLOWERS_PAGE_SECTIONS
        : family === 'transport'
          ? TRANSPORT_PAGE_SECTIONS
          : DEFAULT_PAGE_SECTIONS;
  const key = (pageId || 'home').toLowerCase().trim();
  return map[key] || map.home || null;
}
