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
import { fetchBuilderLayoutApi, saveBuilderLayoutApi } from '../api/tenantApi';

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

/** Flower / Flora-luxe block types that must never stay on coffee page-builder layouts. */
export const COFFEE_FORBIDDEN_FLORA_TYPES = [
  'discounted_bouquets_3d',
  'product_section_natural',
  'product_section_chocolate',
  'product_section_luxury',
  'product_section_cake',
  'product_section_vases',
  'product_section_mawajeeb',
  'sec_natural_flowers',
  'sec_chocolate_roses',
  'sec_luxury_gifts',
  'sec_cake_roses',
  'sec_flower_vases',
  'sec_mawajeeb',
  'circle_categories',
  'best_sellers',
  'trending_this_week',
  'magazine_section',
  'occasion_why_us',
  'custom_gift_banner',
  'promo_banners_pair',
  'marquee_banner',
  'faq',
  /** Retired HiBrew C-BAN stacked promo strip (Barista Pro / G5 / Oak) */
  'banners',
];

/** Every canvas block must have a settings object (coffee/car presets often omitted it). */
function withDefaultSettings(blocks: ThemeBlockElement[]): ThemeBlockElement[] {
  return blocks.map((b) => ({
    ...b,
    settings: b.settings && typeof b.settings === 'object' ? b.settings : {},
  }));
}

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
    return withDefaultSettings([
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
        settings: {},
      },
      {
        id: 'store_features_bar',
        type: 'store_features_bar',
        titleEn: 'Transport Guarantees & Features',
        titleAr: 'مميزات وضمانات خدمات السيارات',
        visible: true,
        templateStyle: 'features-transport',
        settings: {},
      },
      {
        id: 'circle_categories',
        type: 'circle_categories',
        titleEn: 'Vehicle Categories',
        titleAr: 'أقسام وتصنيفات خدمات السيارات',
        visible: true,
        templateStyle: 'cats-transport',
        settings: {},
      },
      {
        id: 'best_sellers',
        type: 'best_sellers',
        titleEn: 'Top Vehicle Services',
        titleAr: 'الخدمات الأكثر طلباً',
        visible: true,
        templateStyle: 'bestsellers-transport',
        settings: {},
      },
      {
        id: 'promo_countdown_banner',
        type: 'promo_countdown_banner',
        titleEn: 'Fleet Maintenance Flash Deal',
        titleAr: 'عرض خاص على صيانة الأسطول',
        visible: true,
        templateStyle: 'countdown-urgent-amber',
        settings: {},
      },
      {
        id: 'footer',
        type: 'footer',
        titleEn: `Store Footer (${storeNameEn})`,
        titleAr: `تذييل المتجر (${storeNameAr})`,
        visible: true,
        templateStyle: 'footer-transport',
        settings: {},
      },
    ]);
  }

  // COFFEE ROASTERY THEME — Word doc C-ANN…C-REV (HiBrew only; never flower block types)
  if (isCoffee) {
    return withDefaultSettings([
      {
        id: 'announcement_bar',
        type: 'announcement_bar',
        titleEn: 'Promotional Announcements',
        titleAr: 'الإعلانات الترويجية',
        visible: true,
        templateStyle: 'ann-rotate-dual',
        settings: { contentWidth: 'full', isFullWidth: true },
      },
      {
        id: 'header',
        type: 'header',
        titleEn: `Roastery Header (${storeNameEn})`,
        titleAr: `رأس المحمصة والقائمة (${storeNameAr})`,
        visible: true,
        templateStyle: 'header-coffee-artisan',
        settings: {
          bgColor: brandBg,
          textColor: '#FAF9F5',
          accentColor: brandAccent,
          stickyHeader: true,
          contentWidth: 'full',
          isFullWidth: true,
        },
      },
      {
        id: 'hero_banners',
        type: 'hero_banners',
        titleEn: 'Hero Banners',
        titleAr: 'بانرات الواجهة',
        visible: true,
        templateStyle: 'hero-3d-motion',
        settings: { contentWidth: 'full', isFullWidth: true },
      },
      {
        id: 'featured_categories_products',
        type: 'featured_categories_products',
        titleEn: 'Featured Categories & Products',
        titleAr: 'التصنيفات والمنتجات المميزة',
        visible: true,
        templateStyle: 'cats-products-grid',
        settings: {},
      },
      {
        id: 'featured_section_banners',
        type: 'featured_section_banners',
        titleEn: 'Featured Section Banners',
        titleAr: 'بانرات القسم المميز',
        visible: true,
        templateStyle: 'flagship-dual',
        settings: {},
      },
      {
        id: 'featured_products',
        type: 'featured_products',
        titleEn: 'Featured Products Section',
        titleAr: 'قسم المنتجات المميزة',
        visible: true,
        templateStyle: 'featured-tabs',
        settings: {},
      },
      {
        id: 'image_banners',
        type: 'image_banners',
        titleEn: 'Image Banner Section',
        titleAr: 'قسم بانرات الصور',
        visible: true,
        templateStyle: 'img-banners-3col',
        settings: {},
      },
      {
        id: 'store_features_bar',
        type: 'store_features_bar',
        titleEn: 'Feature Icons Section',
        titleAr: 'قسم أيقونات المميزات',
        visible: true,
        templateStyle: 'features-icons-row',
        settings: {},
      },
      {
        id: 'exclusive_benefits',
        type: 'exclusive_benefits',
        titleEn: 'Exclusive Benefits',
        titleAr: 'المزايا الحصرية',
        visible: true,
        templateStyle: 'perks-row',
        settings: {},
      },
      {
        id: 'product_carousel',
        type: 'product_carousel',
        titleEn: 'Product Carousel Section',
        titleAr: 'كاروسيل المنتجات',
        visible: true,
        templateStyle: 'carousel-machines',
        settings: {},
      },
      {
        id: 'product_carousel_banner',
        type: 'product_carousel_banner',
        titleEn: 'Product Carousel + Banner',
        titleAr: 'كاروسيل مع بانر',
        visible: true,
        templateStyle: 'carousel-plus-banner',
        settings: {},
      },
      {
        id: 'newsletter',
        type: 'newsletter',
        titleEn: 'Newsletter & Discount Coupon Sign-up',
        titleAr: 'النشرة وكوبون الخصم',
        visible: true,
        templateStyle: 'newsletter-hibrew',
        settings: {},
      },
      {
        id: 'custom_order',
        type: 'custom_order',
        titleEn: 'Custom Product Builder',
        titleAr: 'منشئ المنتج المخصص',
        visible: true,
        templateStyle: 'custom-order-wa',
        settings: {},
      },
      {
        id: 'reviews',
        type: 'reviews',
        titleEn: 'Customer Reviews',
        titleAr: 'تقييمات العملاء',
        visible: true,
        templateStyle: 'reviews-verified-slider',
        settings: {},
      },
      {
        id: 'footer',
        type: 'footer',
        titleEn: `Store Footer (${storeNameEn})`,
        titleAr: `تذييل المتجر (${storeNameAr})`,
        visible: true,
        templateStyle: 'footer-hibrew',
        settings: { contentWidth: 'full', isFullWidth: true },
      },
    ]);
  }

  // DEFAULT FLORA-LUXE (HADAYA MAKKAH FLOWERS)
  // EXACT MATCH TO LIVE: https://giftshop-sa.com/ (18 ACTIVE SECTIONS)
  return withDefaultSettings([
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
  ]);
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
  if (typeof localStorage === 'undefined') return withDefaultSettings(canonical);

  const pubKey = `selia_builder_published_${storeId}_${themeId}`;
  const draftKey = `selia_builder_draft_${storeId}_${themeId}`;

  const rawPub = localStorage.getItem(pubKey);
  const rawDraft = localStorage.getItem(draftKey);
  // Only builder should access draft data; storefronts strictly consume published blocks
  const raw = options?.forBuilderDraft ? (rawDraft || rawPub) : rawPub;

  if (!raw) return withDefaultSettings(canonical);
  try {
    const parsed = JSON.parse(raw);
    const candidateBlocks: any[] = Array.isArray(parsed) ? parsed : parsed.blocks || [];
    if (!candidateBlocks || candidateBlocks.length === 0) return withDefaultSettings(canonical);

    const isCoffeeLayout =
      (themeId && themeId.includes('coffee')) || store?.id === 'store-coffee';

    // Coffee: if draft/publish still carries flower Flora blocks → reset to HiBrew Word canonical
    if (isCoffeeLayout) {
      const hasFlowerLeak = candidateBlocks.some(
        (b) =>
          COFFEE_FORBIDDEN_FLORA_TYPES.includes(b.type) ||
          COFFEE_FORBIDDEN_FLORA_TYPES.includes(b.id) ||
          /floral|bouquet|roses|flora|ورد|باقات/i.test(
            `${b.titleEn || ''} ${b.titleAr || ''} ${b.templateStyle || ''}`,
          ),
      );
      if (hasFlowerLeak) {
        try {
          const resetPayload = {
            themeId,
            blocks: canonical,
            updatedAt: new Date().toISOString(),
            healedFrom: 'coffee-flora-leak',
          };
          if (options?.forBuilderDraft) {
            localStorage.setItem(draftKey, JSON.stringify(resetPayload));
          } else {
            localStorage.setItem(pubKey, JSON.stringify(resetPayload));
          }
        } catch {
          /* ignore */
        }
        return withDefaultSettings(canonical);
      }
    }

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

        return withDefaultSettings(merged);
      }
    }

    return withDefaultSettings(
      candidateBlocks.map((b) => ({
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
      })),
    );
  } catch {
    return withDefaultSettings(canonical);
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
 * Builder open: MySQL draft is the source of truth for this store_id.
 * localStorage is written only after that read succeeds.
 * Empty API draft clears this store's cache and returns the canonical layout.
 * Returns null when the API is off or the request fails (caller keeps current state).
 */
export async function loadBuilderDraftFromApi(
  storeId: string,
  themeId: string,
  store?: any,
): Promise<ThemeBlockElement[] | null> {
  if (!isApiEnabled() || !storeId) return null;

  const res = await fetchBuilderLayoutApi(storeId);
  const rawBlocks = Array.isArray(res?.blocks) ? res.blocks : [];
  const draftKey = `selia_builder_draft_${storeId}_${themeId}`;

  if (typeof localStorage !== 'undefined') {
    if (rawBlocks.length === 0) {
      localStorage.removeItem(draftKey);
    } else {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          themeId,
          blocks: rawBlocks,
          updatedAt: res?.updated_at || new Date().toISOString(),
          source: 'api',
        }),
      );
    }
  }

  if (rawBlocks.length === 0) {
    return createCanonicalBlocks(themeId, store);
  }

  return getLiveOrStoredBlocks(storeId, themeId, store, { forBuilderDraft: true });
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
