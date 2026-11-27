import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const STORE_ID = 'store-souq-default';
const THEME_ID = 'theme-souq-common-retail';

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT || 3306),
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connected to Hostinger central MySQL.');

  const [rows] = await c.query(
    'SELECT id, settings FROM store_themes WHERE store_id = ? LIMIT 1',
    [STORE_ID]
  );

  if (!rows || rows.length === 0) {
    console.log('No theme row found for', STORE_ID);
    await c.end();
    return;
  }

  let settings = rows[0].settings;
  if (typeof settings === 'string') {
    try {
      settings = JSON.parse(settings);
    } catch {
      settings = {};
    }
  }

  const nameEn = 'Souq Default Store';
  const nameAr = 'متجر سوق الافتراضي';
  const accent = '#0f766e';

  const canonicalBlocks = [
    {
      id: 'header',
      type: 'header',
      titleEn: `Store Header (${nameEn})`,
      titleAr: `رأس المتجر والقائمة (${nameAr})`,
      visible: true,
      templateStyle: 'header-souq-common',
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
      templateStyle: 'marquee-brand-logos',
      settings: { speed: 'normal' },
    },
    {
      id: 'hero_slider',
      type: 'hero_slider',
      titleEn: 'Hero Slider',
      titleAr: 'شريط الواجهة الرئيسي',
      visible: true,
      templateStyle: 'hero-souq-common',
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
      templateStyle: 'classic_cards',
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
      templateStyle: 'cats-souq-common',
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
      templateStyle: 'prod-tabs-slider',
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
      templateStyle: 'featured-grid',
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
      templateStyle: 'curated-showcase-grid',
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
      templateStyle: 'social-video-reels',
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
      templateStyle: 'countdown-simple',
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
      templateStyle: 'promo-banners-pair',
      settings: {},
    },
    {
      id: 'metrics_section',
      type: 'metrics_section',
      titleEn: 'Store Statistics',
      titleAr: 'إحصائيات وضمانات المتجر',
      visible: true,
      templateStyle: 'classic_cards',
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
      templateStyle: 'reviews-simple',
      settings: {},
    },
    {
      id: 'magazine_section',
      type: 'magazine_section',
      titleEn: 'Store Magazine & Articles',
      titleAr: 'مقالات ومدونة المتجر',
      visible: true,
      templateStyle: 'mag-editorial-4col',
      settings: {},
    },
    {
      id: 'faq',
      type: 'faq',
      titleEn: 'Frequently Asked Questions',
      titleAr: 'الأسئلة الشائعة والأجوبة',
      visible: true,
      templateStyle: 'faq-accordion-clean',
      settings: {},
    },
    {
      id: 'newsletter',
      type: 'newsletter',
      titleEn: 'Newsletter',
      titleAr: 'النشرة البريدية والعروض',
      visible: true,
      templateStyle: 'newsletter-simple',
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
      templateStyle: 'footer-souq-common',
      settings: {},
    },
  ];

  settings.builder = {
    published_blocks: canonicalBlocks,
    published_at: new Date().toISOString(),
  };

  await c.query(
    'UPDATE store_themes SET settings = ?, theme_id = ? WHERE id = ?',
    [JSON.stringify(settings), THEME_ID, rows[0].id]
  );

  console.log('✓ Successfully reset store_themes.settings.builder with all 17 canonical blocks!');
  await c.end();
}

main().catch(console.error);
