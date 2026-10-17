import React from 'react';
import type { ThemeManifest } from '../types';

const SaudiaTransportThemeView = React.lazy(() =>
  import('./SaudiaTransportThemeView').then((m) => ({ default: m.SaudiaTransportThemeView })),
);

export const saudiaTransportThemeConfig: ThemeManifest = {
  id: 'theme-transport',
  slug: 'saudiaTransport',
  name: 'Al-Saeedi Car Upholstery & Accessories',
  nameAr: 'الصعيدي لتنجيد السيارات وإكسسواراتها',
  version: '2.5.0',
  description: 'Specialized automotive upholstery, customized leather seat covers, floor mats, and transport interior services.',
  descriptionAr: 'قالب متخصص في تنجيد السيارات، تلبيسات المقاعد الجلدية، الدعاسات الأرضية وخدمات تجهيز المركبات.',
  author: 'Unityteck Storefront Engine',
  category: 'automotive',
  previewImage: '/src/assets/images/saudi_hero_banner_1.jpg',
  tags: ['automotive', 'upholstery', 'seat-covers', 'tanjeed', 'car-mats', 'transport', 'saudi'],
  defaultColors: {
    primary: '#0f172a',
    secondary: '#b45309',
    accent: '#d97706',
    surface: '#ffffff',
    background: '#f8fafc',
    text: '#0f172a',
  },
  homeStyles: [
    {
      id: 'vip-leather',
      name: 'VIP Leather & Tanjiyd Showroom',
      nameAr: 'معرض التنجيد والجلد الملكي',
      description: 'Showcase luxury seat upholstery with multi-angle gallery and vehicle compatibility picker.',
    },
    {
      id: 'fleet-accessories',
      name: 'Fleet & Accessories Grid',
      nameAr: 'إكسسوارات المركبات والأساطيل',
      description: 'Clean catalog focusing on quick filtering by Toyota, Hyundai, Nissan, and Ford models.',
    },
    {
      id: 'custom-workshop',
      name: 'Custom Workshop & Booking',
      nameAr: 'ورشة التفصيل والحجز المباشر',
      description: 'Direct WhatsApp booking and custom color/pattern customizer.',
    },
  ],
  supportedSections: [
    {
      id: 'header',
      name: 'Automotive Top Navigation',
      nameAr: 'شريط التنقل العلوي للسيارات',
      category: 'header',
      defaultEnabled: true,
    },
    {
      id: 'hero',
      name: 'Dynamic Vehicle Upholstery Hero',
      nameAr: 'واجهة التنجيد والتفصيل الديناميكية',
      category: 'hero',
      defaultEnabled: true,
    },
    {
      id: 'vehicle_filter',
      name: 'Brand & Model Compatibility Selector',
      nameAr: 'محدد نوع وموديل السيارة',
      category: 'categories',
      defaultEnabled: true,
    },
    {
      id: 'seat_covers',
      name: 'Leather Seat Covers Showcase',
      nameAr: 'تشكيلة تلبيسات المقاعد الجلدية',
      category: 'products',
      defaultEnabled: true,
    },
    {
      id: 'floor_mats',
      name: 'Floor Mats & Trunk Liners',
      nameAr: 'الدعاسات والأرضيات المخصصة',
      category: 'products',
      defaultEnabled: true,
    },
    {
      id: 'workshop_features',
      name: 'Installation & Quality Guarantee',
      nameAr: 'ضمان الجودة والتركيب الاحترافي',
      category: 'features',
      defaultEnabled: true,
    },
    {
      id: 'customer_reviews',
      name: 'Verified Driver Testimonials',
      nameAr: 'آراء وتقييمات العملاء',
      category: 'reviews',
      defaultEnabled: true,
    },
    {
      id: 'footer',
      name: 'Workshop Footer & Branches',
      nameAr: 'تذييل المتجر وفروع الورشة',
      category: 'footer',
      defaultEnabled: true,
    },
  ],
  systemPages: [
    { id: 'home', slug: '', title: 'Home', titleAr: 'الرئيسية', isSystem: true },
    { id: 'products', slug: 'products', title: 'Seat Covers & Mats', titleAr: 'التلبيسات والدعاسات', isSystem: true },
    { id: 'product', slug: 'product', title: 'Cover Details', titleAr: 'تفاصيل التلبيسة', isSystem: true },
    { id: 'cart', slug: 'cart', title: 'Cart', titleAr: 'سلة المشتريات', isSystem: true },
    { id: 'checkout', slug: 'checkout', title: 'Checkout', titleAr: 'إتمام الطلب', isSystem: true },
    { id: 'track-order', slug: 'track-order', title: 'Track Order', titleAr: 'تتبع الطلب', isSystem: true },
  ],
  ViewComponent: SaudiaTransportThemeView,
};
