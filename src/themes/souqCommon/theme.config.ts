import React from 'react';
import type { ThemeManifest } from '../types';
import { SOUQ_COMMON_SETTINGS_DEFAULTS } from './commonSettingsDefaults';

/**
 * Common retail pack — default for NEW post-pilot stores (docs/36 · CT-4).
 * Reuses MeccaGifts storefront shell (generic commerce); branding via shared settings.
 * Flagship flowers/coffee/car stay on their own theme IDs.
 */
const SouqCommonThemeView = React.lazy(() =>
  import('../meccaGifts/MeccaGiftsThemeView').then((m) => ({ default: m.MeccaGiftsThemeView })),
);

const sharedSections: ThemeManifest['supportedSections'] = [
  { id: 'header', name: 'Header', nameAr: 'الترويسة', category: 'header', defaultEnabled: true },
  { id: 'hero', name: 'Hero Slider', nameAr: 'شريط الواجهة', category: 'hero', defaultEnabled: true },
  { id: 'categories', name: 'Categories', nameAr: 'التصنيفات', category: 'categories', defaultEnabled: true },
  { id: 'featured_products', name: 'Featured Products', nameAr: 'منتجات مميزة', category: 'products', defaultEnabled: true },
  { id: 'promotions', name: 'Promotions', nameAr: 'عروض', category: 'promotions', defaultEnabled: true },
  { id: 'reviews', name: 'Reviews', nameAr: 'التقييمات', category: 'reviews', defaultEnabled: false },
  { id: 'footer', name: 'Footer', nameAr: 'التذييل', category: 'footer', defaultEnabled: true },
];

const systemPages: ThemeManifest['systemPages'] = [
  { id: 'home', slug: 'home', title: 'Home', titleAr: 'الرئيسية', isSystem: true },
  { id: 'shop', slug: 'shop', title: 'Shop', titleAr: 'المتجر', isSystem: true },
  { id: 'product', slug: 'product', title: 'Product', titleAr: 'المنتج', isSystem: true },
  { id: 'cart', slug: 'cart', title: 'Cart', titleAr: 'سلة التسوق', isSystem: true },
  { id: 'checkout', slug: 'checkout', title: 'Checkout', titleAr: 'إتمام الشراء', isSystem: true },
];

function buildCommonManifest(
  id: string,
  slug: string,
  name: string,
  nameAr: string,
  colors: ThemeManifest['defaultColors'],
): ThemeManifest {
  return {
    id,
    slug,
    name,
    nameAr,
    version: '1.0.0',
    description: 'Souq common storefront theme — shared settings schema for all subscription tiers.',
    descriptionAr: 'قالب سوق المشترك — مخطط إعدادات واحد لجميع باقات الاشتراك.',
    author: 'Souq Platform',
    category: 'general',
    previewImage: '/images/saudi_hero_banner_2.jpg',
    tags: ['souq', 'common', 'ksa', 'retail', id],
    defaultColors: colors,
    homeStyles: [
      {
        id: 'modern-bento',
        name: 'Modern Bento',
        nameAr: 'بينتو عصري',
        description: 'Default conversion layout from common settings pack.',
      },
    ],
    supportedSections: sharedSections.map((s) => ({
      ...s,
      defaultSettings: { ...SOUQ_COMMON_SETTINGS_DEFAULTS },
    })),
    systemPages,
    ViewComponent: SouqCommonThemeView,
  };
}

export const souqCommonRetailThemeConfig = buildCommonManifest(
  'theme-souq-common-retail',
  'souqCommonRetail',
  'Souq Common Retail',
  'سوق المشترك — تجزئة',
  {
    primary: '#0f766e',
    secondary: '#115e59',
    accent: '#d97706',
    surface: '#ffffff',
    background: '#ffffff',
    text: '#111827',
  },
);

export const souqCommonCatalogThemeConfig = buildCommonManifest(
  'theme-souq-common-catalog',
  'souqCommonCatalog',
  'Souq Common Catalog',
  'سوق المشترك — كتالوج',
  {
    primary: '#1e3a5f',
    secondary: '#334155',
    accent: '#0ea5e9',
    surface: '#ffffff',
    background: '#f8fafc',
    text: '#0f172a',
  },
);

export const souqCommonServicesThemeConfig = buildCommonManifest(
  'theme-souq-common-services',
  'souqCommonServices',
  'Souq Common Services',
  'سوق المشترك — خدمات',
  {
    primary: '#7c2d12',
    secondary: '#9a3412',
    accent: '#ca8a04',
    surface: '#ffffff',
    background: '#fffbeb',
    text: '#1c1917',
  },
);

export const souqCommonBoutiqueThemeConfig = buildCommonManifest(
  'theme-souq-common-boutique',
  'souqCommonBoutique',
  'Souq Common Boutique',
  'سوق المشترك — بوتيك',
  {
    primary: '#581c87',
    secondary: '#6b21a8',
    accent: '#c026d3',
    surface: '#ffffff',
    background: '#faf5ff',
    text: '#1e1b4b',
  },
);

export const SOUQ_COMMON_THEMES: ThemeManifest[] = [
  souqCommonRetailThemeConfig,
  souqCommonCatalogThemeConfig,
  souqCommonServicesThemeConfig,
  souqCommonBoutiqueThemeConfig,
];
