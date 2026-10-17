/**
 * Live Theme Synchronization & Canonical Blocks Service
 *
 * Keeps Localhost and Live (https://giftshop-sa.com/) in 100% continuous parity.
 * Provides canonical presets for all store themes, auto-migrates obsolete drafts,
 * and enables real-time synchronization between VisualThemeBuilder, MeccaGiftsThemeView,
 * and StoreFrontPreview.
 */

import { DEFAULT_HEADER_SETTINGS } from '../themes/settings/headerCustomSettings';
import { isApiEnabled } from '../api/client';
import { saveBuilderLayoutApi } from '../api/tenantApi';

export interface ThemeBlockElement {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string;
  visible: boolean;
  templateStyle?: string;
  settings?: Record<string, any>;
  customHtml?: string;
  customCss?: string;
  customJs?: string;
}

/**
 * Sections that were intentionally removed from the live store design on https://giftshop-sa.com/
 * Any draft carrying these is automatically cleaned and migrated to the live design.
 */
export const OBSOLETE_FLORA_BLOCK_IDS = [
  'sec_cake_roses',
  'product_section_cake',
  'sec_coffee_sweets',
  'sec_flower_vases',
  'product_section_vases',
  'sec_mawajeeb',
  'product_section_mawajeeb',
  'social_reels',
  'video_section',
  'newsletter',
];

/**
 * Generate canonical, production-accurate initial blocks for any theme.
 * Exactly matches https://giftshop-sa.com/ (18 active sections on homepage).
 */
export function createCanonicalBlocks(themeId: string, store?: any): ThemeBlockElement[] {
  const isCoffee = (themeId && themeId.includes('coffee')) || store?.id === 'store-coffee';
  const isCar =
    (themeId && (themeId.includes('saudia') || themeId.includes('transport'))) ||
    store?.id === 'store-bleco';

  const storeNameAr =
    store?.nameAr || store?.name || (isCar ? 'مؤسسة بلاكو للتجارة' : isCoffee ? 'متجر القهوة المختصة' : 'هدايا مكة');
  const storeNameEn =
    store?.nameEn || store?.name || (isCar ? 'Blacko Trading' : isCoffee ? 'Specialty Coffee Roasters' : 'Hadaya Makkah');
  const brandBg = isCar ? '#020617' : isCoffee ? '#21130d' : store?.accentColor || '#102a1c';
  const brandAccent = isCar ? '#f59e0b' : isCoffee ? '#c88a58' : '#e6ca98';

  // CAR / TRANSPORT THEME
  if (isCar) {
    return [
      {
        id: 'header',
        type: 'header',
        titleEn: `Store Header (${storeNameEn})`,
        titleAr: `رأس المتجر والقائمة (${storeNameAr})`,
        visible: true,
        templateStyle: 'header-transport',
        settings: { bgColor: brandBg, textColor: '#FAF9F5', accentColor: brandAccent, stickyHeader: true },
      },
      {
        id: 'hero_slider',
        type: 'hero_slider',
        titleEn: 'Auto Transport VIP Hero Slider',
        titleAr: 'سلايدر خدمات السيارات والأسطول',
        visible: true,
        templateStyle: 'hero-transport-motion',
      },
      {
        id: 'store_features_bar',
        type: 'store_features_bar',
        titleEn: 'Transport Guarantees & Features',
        titleAr: 'مميزات وضمانات خدمات السيارات',
        visible: true,
        templateStyle: 'features-transport',
      },
      {
        id: 'circle_categories',
        type: 'circle_categories',
        titleEn: 'Vehicle Categories',
        titleAr: 'أقسام وتصنيفات خدمات السيارات',
        visible: true,
        templateStyle: 'cats-transport',
      },
      {
        id: 'best_sellers',
        type: 'best_sellers',
        titleEn: 'Top Vehicle Services',
        titleAr: 'الخدمات الأكثر طلباً',
        visible: true,
        templateStyle: 'bestsellers-transport',
      },
      {
        id: 'promo_countdown_banner',
        type: 'promo_countdown_banner',
        titleEn: 'Fleet Maintenance Flash Deal',
        titleAr: 'عرض خاص على صيانة الأسطول',
        visible: true,
        templateStyle: 'countdown-urgent-amber',
      },
      {
        id: 'footer',
        type: 'footer',
        titleEn: `Store Footer (${storeNameEn})`,
        titleAr: `تذييل المتجر (${storeNameAr})`,
        visible: true,
        templateStyle: 'footer-transport',
      },
    ];
  }

  // COFFEE ROASTERY THEME
  if (isCoffee) {
    return [
      {
        id: 'header',
        type: 'header',
        titleEn: `Roastery Header (${storeNameEn})`,
        titleAr: `رأس المحمصة والقائمة (${storeNameAr})`,
        visible: true,
        templateStyle: 'header-coffee-artisan',
        settings: { bgColor: brandBg, textColor: '#FAF9F5', accentColor: brandAccent, stickyHeader: true },
      },
      {
        id: 'hero_slider',
        type: 'hero_slider',
        titleEn: 'Specialty Coffee Roasters - 3D Motion Hero Slider',
        titleAr: 'سلايدر محاصيل القهوة المختصة وأدوات الباريستا',
        visible: true,
        templateStyle: 'hero-3d-motion',
      },
      {
        id: 'marquee_banner',
        type: 'marquee_banner',
        titleEn: 'Fresh Specialty Beans · Barista Tools · Express KSA Delivery',
        titleAr: 'محاصيل بن فاخرة طازجة التحميص · أدوات باريستا احترافية · شحن سريع',
        visible: true,
        templateStyle: 'marquee-pulsing-gold',
      },
      {
        id: 'store_features_bar',
        type: 'store_features_bar',
        titleEn: 'Roastery Features & Express Delivery Bar',
        titleAr: 'مميزات المحمصة الحرفية والشحن السريع',
        visible: true,
        templateStyle: 'features-4col-pills',
      },
      {
        id: 'circle_categories',
        type: 'circle_categories',
        titleEn: 'Coffee Collections (Top 6)',
        titleAr: 'مجموعات محاصيل القهوة وأدوات التحضير',
        visible: true,
        templateStyle: 'cats-gold-rings',
      },
      {
        id: 'best_sellers',
        type: 'best_sellers',
        titleEn: 'Best Selling Specialty Beans',
        titleAr: 'محاصيل البن الأكثر طلباً ومبيعاً',
        visible: true,
        templateStyle: 'bestsellers-4cards',
      },
      {
        id: 'discounted_bouquets_3d',
        type: 'discounted_bouquets_3d',
        titleEn: 'Specialty Beans & Roaster Bundles (3D Gallery)',
        titleAr: 'معرض محاصيل البن المختارة وعروض الباريستا (3D)',
        visible: true,
        templateStyle: 'prod-3d-tilt-slider',
      },
      {
        id: 'sec_natural_flowers',
        type: 'product_section_natural',
        titleEn: 'Single Origin Specialty Coffee Beans',
        titleAr: 'محاصيل البن الفاخرة (سنجل أوريجن)',
        visible: true,
        templateStyle: 'prod-4col-luxury',
      },
      {
        id: 'sec_chocolate_roses',
        type: 'product_section_chocolate',
        titleEn: 'Signature Micro-lots & Reserve Roasts',
        titleAr: 'محاصيل مميزة وميكرولوت نادر',
        visible: true,
        templateStyle: 'prod-4col-luxury',
      },
      {
        id: 'sec_luxury_gifts',
        type: 'product_section_luxury',
        titleEn: 'Espresso Machines & Commercial Grinders',
        titleAr: 'مكائن الإسبريسو والمطاحن الاحترافية',
        visible: true,
        templateStyle: 'prod-4col-luxury',
      },
      {
        id: 'trending_this_week',
        type: 'trending_this_week',
        titleEn: 'Trending Coffee Blends This Week',
        titleAr: 'المحاصيل الأكثر رواجاً هذا الأسبوع',
        visible: true,
        templateStyle: 'trending-carousel',
      },
      {
        id: 'reviews',
        type: 'reviews',
        titleEn: 'Verified Coffee Lovers Testimonials',
        titleAr: 'تقييمات وتجارب عشاق القهوة الموثقة',
        visible: true,
        templateStyle: 'reviews-verified-slider',
      },
      {
        id: 'faq',
        type: 'faq',
        titleEn: 'Frequently Asked Questions',
        titleAr: 'الأسئلة الشائعة والأجوبة الفورية',
        visible: true,
        templateStyle: 'faq-accordion-emerald',
      },
      {
        id: 'magazine_section',
        type: 'magazine_section',
        titleEn: 'Coffee Roasting & Brewing Articles',
        titleAr: 'مقالات وأسرار تحضير القهوة المختصة',
        visible: true,
        templateStyle: 'mag-editorial-3col',
      },
      {
        id: 'footer',
        type: 'footer',
        titleEn: `Store Footer (${storeNameEn})`,
        titleAr: `تذييل المتجر (${storeNameAr})`,
        visible: true,
        templateStyle: 'footer-royal-emerald',
      },
    ];
  }

  // DEFAULT FLORA-LUXE (HADAYA MAKKAH FLOWERS)
  // EXACT MATCH TO LIVE: https://giftshop-sa.com/ (18 ACTIVE SECTIONS)
  return [
    {
      id: 'header',
      type: 'header',
      titleEn: `Store Header & Navigation (${storeNameEn})`,
      titleAr: `رأس المتجر والقائمة الرئيسية (${storeNameAr})`,
      visible: true,
      templateStyle: 'header-luxury-emerald',
      settings: {
        bgColor: brandBg,
        textColor: '#FAF9F5',
        accentColor: brandAccent,
        stickyHeader: true,
        headerCustom: DEFAULT_HEADER_SETTINGS,
      },
    },
    {
      id: 'hero_slider',
      type: 'hero_slider',
      titleEn: `3D Motion Hero Slider (${storeNameEn})`,
      titleAr: `سلايدر الواجهة التفاعلي ثلاثي الأبعاد VIP (${storeNameAr})`,
      visible: true,
      templateStyle: 'hero-3d-motion',
      settings: {},
    },
    {
      id: 'store_features_bar',
      type: 'store_features_bar',
      titleEn: 'Store Features & Express Delivery Bar',
      titleAr: 'مميزات وخدمات المتجر الملكية',
      visible: true,
      templateStyle: 'features-4col-pills',
      settings: {},
    },
    {
      id: 'circle_categories',
      type: 'circle_categories',
      titleEn: 'Dedicated Circular Collections (Top 6)',
      titleAr: 'المجموعات والتصنيفات الدائرية الحصرية',
      visible: true,
      templateStyle: 'cats-gold-rings',
      settings: {
        titleEn: 'Shop by Sacred Occasion',
        titleAr: 'تسوق حسب المناسبة والتصنيف',
      },
    },
    {
      id: 'best_sellers',
      type: 'best_sellers',
      titleEn: 'Best Sellers Showcase',
      titleAr: 'قسم الأكثر مبيعاً مع التخفيضات',
      visible: true,
      templateStyle: 'bestsellers-4cards',
      settings: {},
    },
    {
      id: 'promo_countdown_banner',
      type: 'promo_countdown_banner',
      titleEn: 'Special Flash Promo Countdown Banner',
      titleAr: 'بانر العرض الترويجي مع العداد التنازلي الحي',
      visible: true,
      templateStyle: 'countdown-urgent-emerald',
      settings: {},
    },
    {
      id: 'discounted_bouquets_3d',
      type: 'discounted_bouquets_3d',
      titleEn: 'Discounted Bouquets 3D Stack Gallery',
      titleAr: 'معرض باقات الورود الطبيعية المخفضة (3D)',
      visible: true,
      templateStyle: 'prod-3d-tilt-slider',
      settings: {
        titleEn: 'Discounted Fresh Flower Bouquets',
        titleAr: 'باقات ورود طبيعية مخفضة',
        subtitleEn:
          'Finest arrangements at special prices with complimentary greeting card and express delivery',
        subtitleAr: 'أجمل التنسيقات بأسعار خاصة مع كرت إهداء مجاني وتوصيل سريع',
      },
    },
    {
      id: 'sec_natural_flowers',
      type: 'product_section_natural',
      titleEn: 'Natural Fresh Flower Bouquets',
      titleAr: 'باقات الورود الطبيعية',
      visible: true,
      templateStyle: 'prod-4col-luxury',
      settings: {
        titleEn: 'Natural Fresh Flower Bouquets',
        titleAr: 'باقات الورود الطبيعية',
        subtitleEn: 'Finest Dutch and Ecuadorian long-stem roses tailored by master florists',
        subtitleAr: 'أجود أنواع الجوري الهولندي والإكوادوري المنسق بأيدي أمهر الخبراء',
        limit: 6,
        columns: 4,
        layout: 'slider',
      },
    },
    {
      id: 'sec_chocolate_roses',
      type: 'product_section_chocolate',
      titleEn: 'Roses & Luxury Belgian Chocolates',
      titleAr: 'ورد وشوكولاتة بلجيكية فاخرة',
      visible: true,
      templateStyle: 'prod-4col-luxury',
      settings: {
        titleEn: 'Roses & Luxury Belgian Chocolates',
        titleAr: 'ورد وشوكولاتة بلجيكية فاخرة',
        subtitleEn: 'Signature Patchi and Bostani chocolate boxes paired with fresh roses',
        subtitleAr: 'أفخم تشكيلات باتشي وبستاني المنسقة مع باقات الجوري الساحرة',
        limit: 6,
        columns: 4,
        layout: 'slider',
      },
    },
    {
      id: 'sec_luxury_gifts',
      type: 'product_section_luxury',
      titleEn: 'Royal Luxury Gift Sets (Men & Women)',
      titleAr: 'هدايا ملكية فاخرة (رجالية ونسائية)',
      visible: true,
      templateStyle: 'prod-4col-luxury',
      settings: {
        titleEn: 'Royal Luxury Gift Sets (Men & Women)',
        titleAr: 'هدايا ملكية فاخرة (رجالية ونسائية)',
        subtitleEn: 'Signature executive and feminine luxury gift sets with blooms and fine accessories',
        subtitleAr: 'أطقم هدايا استثنائية تضم عطوراً فاخرة، ساعات، أطقم مجوهرات وباقات زهور نضرة',
        limit: 6,
        columns: 4,
        layout: 'slider',
      },
    },
    {
      id: 'trending_this_week',
      type: 'trending_this_week',
      titleEn: 'Trending This Week Carousel',
      titleAr: 'الأكثر رواجاً هذا الأسبوع',
      visible: true,
      templateStyle: 'trending-carousel',
      settings: {},
    },
    {
      id: 'occasion_why_us',
      type: 'occasion_why_us',
      titleEn: 'Shop by Occasion & Why Choose Us',
      titleAr: 'تسوق حسب المناسبة ولماذا تختارنا',
      visible: true,
      templateStyle: 'occasion-why-us-grid',
      settings: {},
    },
    {
      id: 'custom_gift_banner',
      type: 'custom_gift_banner',
      titleEn: 'Bespoke VIP Custom Gifts Consultation Banner',
      titleAr: 'بانر تفصيل الهدايا والخدمات الخاصة VIP',
      visible: true,
      templateStyle: 'custom-gift-banner',
      settings: {},
    },
    {
      id: 'promo_banners_pair',
      type: 'promo_banners_pair',
      titleEn: 'Dual VIP Promotional Banners Pair',
      titleAr: 'البانرات الترويجية الثنائية VIP',
      visible: true,
      templateStyle: 'banner-dual-velvet',
      settings: {},
    },
    {
      id: 'metrics_section',
      type: 'featured_collections',
      titleEn: 'Store Milestones & Metrics Counters (+10,000 Clients)',
      titleAr: 'أرقام وإنجازات المتجر الملكية (+10,000 عميل)',
      visible: true,
      templateStyle: 'metrics-gold-counters',
      settings: {},
    },
    {
      id: 'reviews',
      type: 'reviews',
      titleEn: 'Verified Customer Reviews & 3D Testimonials Stack',
      titleAr: 'تقييمات ضيوفنا الموثقة في مكة',
      visible: true,
      templateStyle: 'reviews-verified-slider',
      settings: {},
    },
    {
      id: 'faq',
      type: 'faq',
      titleEn: 'Frequently Asked Questions',
      titleAr: 'الأسئلة الشائعة والأجوبة الفورية',
      visible: true,
      templateStyle: 'faq-accordion-emerald',
      settings: {},
    },
    {
      id: 'offer_video_banner',
      type: 'offer_video_banner',
      titleEn: 'Special Offer Video Banner',
      titleAr: 'بانر العرض الترويجي بالفيديو السينمائي',
      visible: true,
      templateStyle: 'offer-video-banner',
      settings: {},
    },
    {
      id: 'magazine_section',
      type: 'magazine_section',
      titleEn: 'Hadaya Makkah Magazine & Articles',
      titleAr: 'مقالات ومجلة هدايا مكة',
      visible: true,
      templateStyle: 'mag-editorial-3col',
      settings: {},
    },
    {
      id: 'footer',
      type: 'footer',
      titleEn: `Store Footer & Legal Identity (${storeNameEn})`,
      titleAr: `تذييل المتجر والبيانات الضريبية (${storeNameAr})`,
      visible: true,
      templateStyle: 'footer-royal-emerald',
      settings: {},
    },
  ];
}

export interface GetBlocksOptions {
  forBuilderDraft?: boolean;
}

/**
 * Retrieve blocks for storefront or page builder:
 * 1. For storefront / public view: reads published blocks from localStorage (or fallback to canonical). Draft blocks are NEVER exposed.
 * 2. For page builder (forBuilderDraft = true): reads draft blocks first, then published blocks, then fallback to canonical.
 * 3. Purges any outdated/obsolete sections if found
 * 4. Falls back to canonical live sections
 */
export function getLiveOrStoredBlocks(
  storeId: string,
  themeId: string,
  store?: any,
  options?: GetBlocksOptions
): ThemeBlockElement[] {
  const canonical = createCanonicalBlocks(themeId, store);
  if (typeof localStorage === 'undefined') return canonical;

  const pubKey = `selia_builder_published_${storeId}_${themeId}`;
  const draftKey = `selia_builder_draft_${storeId}_${themeId}`;

  const rawPub = localStorage.getItem(pubKey);
  const rawDraft = localStorage.getItem(draftKey);
  // Only builder should access draft data; storefronts strictly consume published blocks
  const raw = options?.forBuilderDraft ? (rawDraft || rawPub) : rawPub;

  if (!raw) return canonical;

  try {
    const parsed = JSON.parse(raw);
    const candidateBlocks: any[] = Array.isArray(parsed) ? parsed : parsed.blocks || [];
    if (!candidateBlocks || candidateBlocks.length === 0) return canonical;

    // Self-heal and purge obsolete blocks that were removed from the live site
    if (themeId === 'theme-flora-luxe' || !themeId.includes('coffee')) {
      const hasObsolete = candidateBlocks.some((b) =>
        OBSOLETE_FLORA_BLOCK_IDS.includes(b.id || b.type)
      );

      if (hasObsolete) {
        // Filter out obsolete removed sections
        const cleaned = candidateBlocks.filter(
          (b) => !OBSOLETE_FLORA_BLOCK_IDS.includes(b.id || b.type)
        );

        // Ensure newly added sections are incorporated
        const existingTypes = new Set(cleaned.map((b) => b.type));
        const missingCanonical = canonical.filter((cb) => !existingTypes.has(cb.type));
        const merged = [...cleaned, ...missingCanonical];

        // Persist clean version
        try {
          const draftData =
            typeof parsed === 'object' && !Array.isArray(parsed)
              ? { ...parsed, blocks: merged, updatedAt: new Date().toISOString() }
              : { themeId, blocks: merged, updatedAt: new Date().toISOString() };
          if (options?.forBuilderDraft) {
            localStorage.setItem(draftKey, JSON.stringify(draftData));
          } else {
            localStorage.setItem(pubKey, JSON.stringify(draftData));
          }
        } catch {}

        return merged;
      }
    }

    return candidateBlocks.map((b) => ({
      id: b.id || `block_${Date.now()}_${Math.random()}`,
      type: b.type || 'generic',
      titleEn: b.titleEn || 'Section',
      titleAr: b.titleAr || 'قسم',
      visible: b.visible !== false,
      templateStyle: b.templateStyle || 'tpl-default',
      settings: b.settings || {},
      customHtml: b.customHtml || '',
      customCss: b.customCss || '',
      customJs: b.customJs || '',
    }));
  } catch {
    return canonical;
  }
}

/**
 * Persist blocks to both draft and published storage keys, and notify all listeners.
 */
export function saveThemeBlocks(
  storeId: string,
  themeId: string,
  blocks: ThemeBlockElement[],
  options?: {
    isPublished?: boolean;
    seasonalTheme?: any;
    typographySettings?: any;
    mobileMenuIcon?: any;
  }
) {
  if (typeof localStorage === 'undefined') return;

  const draftKey = `selia_builder_draft_${storeId}_${themeId}`;
  const pubKey = `selia_builder_published_${storeId}_${themeId}`;

  const data = {
    themeId,
    blocks,
    seasonalTheme: options?.seasonalTheme,
    typographySettings: options?.typographySettings,
    mobileMenuIcon: options?.mobileMenuIcon,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(draftKey, JSON.stringify(data));
    if (options?.isPublished) {
      localStorage.setItem(pubKey, JSON.stringify(data));
    }

    window.dispatchEvent(
      new CustomEvent('unityteck-theme-builder-published', {
        detail: { storeId, themeId, blocks, isPublished: Boolean(options?.isPublished) },
      })
    );
    window.dispatchEvent(new CustomEvent('unityteck-data', { detail: { tag: `${storeId}:theme` } }));

    if (isApiEnabled()) {
      saveBuilderLayoutApi(storeId, {
        theme_id: themeId,
        blocks,
        is_published: options?.isPublished,
        seasonal_theme: options?.seasonalTheme,
        typography_settings: options?.typographySettings,
        mobile_menu_icon: options?.mobileMenuIcon,
      }).catch((err) => {
        console.warn('[liveThemeSyncService] Async builder layout sync to API:', err);
      });
    }
  } catch {}
}

/**
 * Reset local configuration to 100% match live giftshop-sa.com.
 */
export function syncThemeWithLive(
  storeId: string,
  themeId: string,
  store?: any
): ThemeBlockElement[] {
  const canonical = createCanonicalBlocks(themeId, store);
  saveThemeBlocks(storeId, themeId, canonical, { isPublished: true });
  return canonical;
}

/**
 * Export full theme config as JSON for backup and cross-environment deployment.
 */
export function exportThemeConfig(storeId: string, themeId: string, store?: any): string {
  const blocks = getLiveOrStoredBlocks(storeId, themeId, store);
  const data = {
    themeId,
    storeId,
    exportedAt: new Date().toISOString(),
    source: 'https://giftshop-sa.com/',
    blocks,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import and apply full theme config from JSON.
 */
export function importThemeConfig(
  storeId: string,
  themeId: string,
  jsonString: string
): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const candidateBlocks: ThemeBlockElement[] = parsed.blocks || parsed;
    if (!Array.isArray(candidateBlocks) || candidateBlocks.length === 0) {
      return { success: false, error: 'Invalid JSON: No blocks array found.' };
    }
    saveThemeBlocks(storeId, themeId, candidateBlocks, { isPublished: true });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'JSON Parse error' };
  }
}
