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
  brandLogos: 'marquee-brand-logos',
  header: 'header-souq-common',
  hero: 'hero-souq-common',
  features: 'classic_cards',
  categories: 'cats-souq-common',
  productTabs: 'prod-tabs-slider',
  productCards: 'featured-grid',
  curatedShowcase: 'curated-showcase-grid',
  productVideos: 'social-video-reels',
  specialOffer: 'countdown-simple',
  promoBanners: 'promo-banners-pair',
  shopByCategory: 'cats-cards-simple',
  banners: 'promo-banner',
  statistics: 'classic_cards',
  testimonials: 'reviews-simple',
  magazine: 'mag-editorial-4col',
  faq: 'faq-accordion-clean',
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
      id: 'brand_logos',
      type: 'brand_logos',
      titleEn: 'Brand Offers & Marquee Banner',
      titleAr: 'شريط العروض والضمانات المتحرك',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.brandLogos,
      settings: {
        speed: 'normal',
      },
    },
    {
      id: 'hero_slider',
      type: 'hero_slider',
      titleEn: 'Hero Slider',
      titleAr: 'شريط الواجهة الرئيسي',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.hero,
      settings: {
        slides: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
            titleEn: `Welcome to ${nameEn}`,
            titleAr: `مرحباً بكم في ${nameAr}`,
            subtitleEn: 'Quality products with fast delivery across Saudi Arabia',
            subtitleAr: 'منتجات موثوقة وتوصيل سريع لجميع مدن المملكة',
            ctaEn: 'Shop now',
            ctaAr: 'تسوق الآن',
            ctaHref: '/shop',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&auto=format&fit=crop&q=80',
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
      titleAr: 'التصنيفات السريعة',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.categories,
      settings: {
        titleEn: 'Shop by category',
        titleAr: 'تسوق حسب التصنيف',
      },
    },
    {
      id: 'product_tabs',
      type: 'product_tabs',
      titleEn: 'Latest Products & Tabs',
      titleAr: 'أحدث المنتجات والعروض',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.productTabs,
      settings: {
        titleEn: 'New Arrivals & Highlights',
        titleAr: 'أحدث التشكيلات والعروض',
        subtitleEn: 'Explore carefully chosen quality products',
        subtitleAr: 'تشكيلة مختارة تلبي أعلى معايير الجودة',
        limit: 8,
        layout: 'slider',
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
        subtitleEn: 'Top trending items in our store',
        subtitleAr: 'أفضل المنتجات الأكثر طلباً في متجرنا',
        limit: 8,
        columns: 4,
        layout: 'grid',
      },
    },
    {
      id: 'curated_showcase',
      type: 'curated_showcase',
      titleEn: 'Curated Showcase',
      titleAr: 'تشكيلات مختارة بعناية',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.curatedShowcase,
      settings: {
        titleEn: 'Curated Collections',
        titleAr: 'تشكيلات مختارة بعناية',
      },
    },
    {
      id: 'product_videos',
      type: 'product_videos',
      titleEn: 'Product Lifestyle & Video Reels',
      titleAr: 'فيديوهات وتجارب المنتجات الحية',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.productVideos,
      settings: {
        titleEn: 'Products in Action',
        titleAr: 'لحظات استثنائية تنبض بالحياة',
      },
    },
    {
      id: 'promo_countdown_banner',
      type: 'promo_countdown_banner',
      titleEn: 'Special Offer',
      titleAr: 'عرض خاص مع عداد تنازلي',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.specialOffer,
      settings: {
        titleEn: 'Limited-time offer',
        titleAr: 'عرض لفترة محدودة',
      },
    },
    {
      id: 'promo_banners_pair',
      type: 'promo_banners_pair',
      titleEn: 'Promotional Banners Pair',
      titleAr: 'بانرات العروض الترويجية',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.promoBanners,
      settings: {},
    },
    {
      id: 'metrics_section',
      type: 'metrics_section',
      titleEn: 'Store Statistics',
      titleAr: 'إحصائيات وضمانات المتجر',
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
      titleAr: 'آراء وتقييمات العملاء',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.testimonials,
      settings: {},
    },
    {
      id: 'magazine_section',
      type: 'magazine_section',
      titleEn: 'Store Magazine & Articles',
      titleAr: 'مقالات ومدونة المتجر',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.magazine,
      settings: {},
    },
    {
      id: 'faq',
      type: 'faq',
      titleEn: 'Frequently Asked Questions',
      titleAr: 'الأسئلة الشائعة والأجوبة',
      visible: true,
      templateStyle: SOUQ_SECTION_EASY_STYLES.faq,
      settings: {},
    },
    {
      id: 'newsletter',
      type: 'newsletter',
      titleEn: 'Newsletter',
      titleAr: 'النشرة البريدية والعروض',
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
