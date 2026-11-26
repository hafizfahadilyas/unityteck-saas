/**
 * Default Page Builder home for ALL theme-souq-common-* / new merchants.
 * Easiest style per Theme Settings section (docs/37 · ثيمات المتجر):
 * - Features → classic_cards (Template 01)
 * - Stats → classic_cards
 * - Hero → single-slide retail
 * - Products → featured-grid (4 col)
 * - Offer → simple countdown
 * - Banners → promo-banner
 * Flagship flora/coffee/car never use this pack.
 */

export type SouqHomeBlock = {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string;
  visible: boolean;
  templateStyle: string;
  settings: Record<string, unknown>;
};

/** Easiest templateStyle key per Theme Settings module (01–18). */
export const SOUQ_SECTION_EASY_STYLES = {
  announcement: 'ann-simple-marquee',
  header: 'header-souq-common',
  hero: 'hero-souq-common',
  features: 'classic_cards',
  categories: 'cats-souq-common',
  productCards: 'featured-grid',
  shopByCategory: 'cats-cards-simple',
  specialOffer: 'countdown-simple',
  banners: 'promo-banner',
  statistics: 'classic_cards',
  testimonials: 'reviews-simple',
  newsletter: 'newsletter-simple',
  footer: 'footer-souq-common',
} as const;

export function buildSouqDefaultHomeBlocks(
  storeNameEn: string,
  storeNameAr: string,
  accent = '#0f766e',
): SouqHomeBlock[] {
  const nameEn = storeNameEn || 'Souq Store';
  const nameAr = storeNameAr || 'متجر سوق';

  return [
    {
      id: 'header',
      type: 'header',
      titleEn: `Store Header (${nameEn})`,
      titleAr: `رأس المتجر والقائمة (${nameAr})`,
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.header,
      settings: {
        bgColor: '#ffffff',
        textColor: '#272a32',
        accentColor: accent,
        stickyHeader: true,
      },
    },
    {
      id: 'hero_slider',
      type: 'hero_slider',
      titleEn: 'Hero Slider',
      titleAr: 'شريط الواجهة',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.hero,
      settings: {
        slides: [
          {
            imageUrl: '/images/saudi_hero_banner_2.jpg',
            titleEn: `Welcome to ${nameEn}`,
            titleAr: `مرحباً بكم في ${nameAr}`,
            subtitleEn: 'Quality products with fast delivery across Saudi Arabia',
            subtitleAr: 'منتجات موثوقة وتوصيل سريع لجميع مدن المملكة',
            ctaEn: 'Shop now',
            ctaAr: 'تسوق الآن',
            ctaHref: '/shop',
          },
          {
            imageUrl: '/images/saudi_hero_banner_3.jpg',
            titleEn: 'Shop with Confidence in KSA',
            titleAr: 'تسوق بثقة في المملكة',
            subtitleEn: 'Secure payments · Nationwide shipping',
            subtitleAr: 'دفع آمن · شحن لكل مناطق المملكة',
            ctaEn: 'Browse catalog',
            ctaAr: 'تصفح الكتالوج',
            ctaHref: '/shop',
          },
        ],
      },
    },
    {
      id: 'store_features_bar',
      type: 'store_features_bar',
      titleEn: 'Store Features',
      titleAr: 'مميزات المتجر',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.features,
      settings: {
        selected_template: 'classic_cards',
        titleEn: 'Why shop with us?',
        titleAr: 'لماذا تتسوق معنا؟',
      },
    },
    {
      id: 'circle_categories',
      type: 'circle_categories',
      titleEn: 'Categories',
      titleAr: 'التصنيفات',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.categories,
      settings: {
        titleEn: 'Shop by category',
        titleAr: 'تسوق حسب التصنيف',
      },
    },
    {
      id: 'featured_products',
      type: 'featured_products',
      titleEn: 'Featured Products',
      titleAr: 'منتجات مميزة',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.productCards,
      settings: {
        titleEn: 'Featured Products',
        titleAr: 'منتجات مميزة',
        limit: 8,
        columns: 4,
        layout: 'grid',
      },
    },
    {
      id: 'shop_by_category',
      type: 'shop_by_category',
      titleEn: 'Shop by Category',
      titleAr: 'تسوق حسب الأقسام',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.shopByCategory,
      settings: {
        titleEn: 'Browse categories',
        titleAr: 'تصفح الأقسام',
      },
    },
    {
      id: 'promo_countdown_banner',
      type: 'promo_countdown_banner',
      titleEn: 'Special Offer',
      titleAr: 'عرض خاص',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.specialOffer,
      settings: {
        titleEn: 'Limited-time offer',
        titleAr: 'عرض لفترة محدودة',
      },
    },
    {
      id: 'promotions',
      type: 'promotions',
      titleEn: 'Promotions',
      titleAr: 'عروض',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.banners,
      settings: {
        titleEn: 'Promotions',
        titleAr: 'عروض',
        limit: 8,
        layout: 'grid',
      },
    },
    {
      id: 'metrics_section',
      type: 'metrics_section',
      titleEn: 'Store Statistics',
      titleAr: 'إحصائيات المتجر',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.statistics,
      settings: {
        selected_template: 'classic_cards',
        titleEn: 'Store at a glance',
        titleAr: 'نظرة على المتجر',
        useRealStoreCounts: true,
      },
    },
    {
      id: 'testimonials',
      type: 'testimonials',
      titleEn: 'Customer Reviews',
      titleAr: 'آراء العملاء',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.testimonials,
      settings: {},
    },
    {
      id: 'newsletter',
      type: 'newsletter',
      titleEn: 'Newsletter',
      titleAr: 'النشرة البريدية',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.newsletter,
      settings: {
        titleEn: 'Get offers & new arrivals',
        titleAr: 'احصل على العروض والمنتجات الجديدة',
      },
    },
    {
      id: 'footer',
      type: 'footer',
      titleEn: `Store Footer (${nameEn})`,
      titleAr: `تذييل المتجر (${nameAr})`,
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.footer,
      settings: {},
    },
  ];
}
