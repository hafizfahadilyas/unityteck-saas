import React from 'react';
import type { ThemeManifest } from '../types';

const MeccaGiftsThemeView = React.lazy(() =>
  import('./MeccaGiftsThemeView').then((m) => ({ default: m.MeccaGiftsThemeView })),
);

export const meccaGiftsThemeConfig: ThemeManifest = {
  id: 'theme-gifts',
  slug: 'meccaGifts',
  name: 'Hadaya Makkah Flowers & Luxury Gifts',
  nameAr: 'هدايا مكة للزهور والتحف الفاخرة',
  version: '2.6.0',
  description: 'Luxury flowers, spiritual Makkah souvenirs, customized gift boxes, and seasonal holiday collections.',
  descriptionAr: 'قالب فاخر لباقات الورد الطبيعي، الهدايا التذكارية المكية، وصناديق الإهداء الفاخرة للمناسبات.',
  author: 'Unityteck Storefront Engine',
  category: 'gifts',
  previewImage: '/images/saudi_hero_banner_2.jpg',
  tags: ['flowers', 'gifts', 'makkah', 'souvenirs', 'luxury', 'perfumes', 'chocolates'],
  defaultColors: {
    primary: '#064e3b',
    secondary: '#047857',
    accent: '#d97706',
    surface: '#ffffff',
    background: '#fcfbf7',
    text: '#064e3b',
  },
  homeStyles: [
    {
      id: 'luxury-floral',
      name: 'Luxury Boutique Floral',
      nameAr: 'البوتيك الزهري الملكي',
      description: 'Elegant arrangement displays, occasion filter chips, and romantic color palettes.',
    },
    {
      id: 'haram-souvenirs',
      name: 'Haram & Umrah Souvenirs',
      nameAr: 'هدايا وتذكارات الحرم المكي',
      description: 'Curated gift sets featuring prayer beads, perfumes, and Holy Kaaba motifs.',
    },
    {
      id: 'seasonal-celebrations',
      name: 'Ramadan & Eid Celebrations',
      nameAr: 'احتفالات رمضان والأعياد',
      description: 'Festive countdown banners, celebration chocolates, and family gift packs.',
    },
  ],
  supportedSections: [
    {
      id: 'header',
      name: 'Floral Header & Search',
      nameAr: 'شريط التنقل والبحث الزهري',
      category: 'header',
      defaultEnabled: true,
    },
    {
      id: 'hero',
      name: 'Motion Hero Slider',
      nameAr: 'شريط الواجهة المتحرك',
      category: 'hero',
      defaultEnabled: true,
    },
    {
      id: 'circular_categories',
      name: 'Top Circular Categories',
      nameAr: 'أقسام الهدايا الدائرية',
      category: 'categories',
      defaultEnabled: true,
    },
    {
      id: 'featured_collections',
      name: 'Featured Collections Grid',
      nameAr: 'مجموعات الهدايا المختارة',
      category: 'products',
      defaultEnabled: true,
    },
    {
      id: 'best_sellers',
      name: 'Best Sellers Showcase',
      nameAr: 'المنتجات الأكثر مبيعاً',
      category: 'products',
      defaultEnabled: true,
    },
    {
      id: 'video_offer',
      name: 'Offer Video Banner',
      nameAr: 'فيديو العروض الحصرية',
      category: 'media',
      defaultEnabled: true,
    },
    {
      id: 'occasions',
      name: 'Occasions & Why Us Section',
      nameAr: 'قسم المناسبات ومميزاتنا',
      category: 'features',
      defaultEnabled: true,
    },
    {
      id: 'trending',
      name: 'Trending This Week',
      nameAr: 'الرائج هذا الأسبوع',
      category: 'products',
      defaultEnabled: true,
    },
    {
      id: 'footer',
      name: 'Luxury Gifts Footer',
      nameAr: 'تذييل المتجر الملكي',
      category: 'footer',
      defaultEnabled: true,
    },
  ],
  systemPages: [
    { id: 'home', slug: '', title: 'Home', titleAr: 'الرئيسية', isSystem: true },
    { id: 'catalog', slug: 'catalog', title: 'Gift Collections', titleAr: 'تشكيلة الهدايا', isSystem: true },
    { id: 'product', slug: 'product', title: 'Product Details', titleAr: 'تفاصيل الهدية', isSystem: true },
    { id: 'cart', slug: 'cart', title: 'Cart', titleAr: 'سلة المشتريات', isSystem: true },
    { id: 'checkout', slug: 'checkout', title: 'Checkout', titleAr: 'إتمام الطلب', isSystem: true },
    { id: 'profile', slug: 'profile', title: 'My Account', titleAr: 'حسابي', isSystem: true },
    { id: 'track-order', slug: 'track-order', title: 'Track Order', titleAr: 'تتبع الطلب', isSystem: true },
  ],
  ViewComponent: MeccaGiftsThemeView,
};
