/**
 * HiBrew KSA (store-coffee) — persisted theme section seeds.
 * Maps Word doc steps C-FCP … C-NEWS to existing AllThemeSettings keys.
 * Real store copy + coffee assets only (no floral Unsplash filler).
 */

import { readAllThemeSettings, type AllThemeSettings } from './themeSettingsStore';
import { applyMissingModularSeeds } from './coffeeModularSettings';
import { resolveCoffeeMediaUrl, cleanImageUrl } from '../../utils/imageFallback';

export function isCoffeeStore(store: { id?: string; name?: string; category?: string }): boolean {
  const id = (store.id || '').toLowerCase();
  const name = store.name || '';
  const cat = store.category || '';
  return (
    id === 'store-coffee' ||
    id.includes('coffee') ||
    /coffee|hibrew|roaster|قهوة|هايبرو/i.test(name) ||
    cat.includes('قهوة')
  );
}

const HERO_BANNERS = [
  '/images/coffee_banner_white_gray_1.jpg',
  '/images/coffee_banner_white_gray_2.jpg',
  '/images/coffee_banner_white_gray_3.jpg',
];

/** Fill marketing/catalog theme JSON for coffee when DB/local has no merchant overrides yet. */
export function seedCoffeeThemeSettings(base: AllThemeSettings): AllThemeSettings {
  const seeded: AllThemeSettings = {
    ...base,
    videos: {
      ...base.videos,
      enabled: true,
      elementTitle: 'Product Videos',
      subtitle: 'See HiBrew machines, mills, and barista workflow in action',
      displayType: 'slider',
      videoProducts: [
        {
          id: 'cvp-1',
          name: 'HiBrew Barista Pro H7A Dual-Boiler',
          price: 1899,
          videoUrl:
            'https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-into-a-cup-from-a-coffee-machine-42861-large.mp4',
          poster: HERO_BANNERS[0],
          badge: 'Flagship',
        },
        {
          id: 'cvp-2',
          name: 'HiBrew Titanium Burr Grinder G5',
          price: 749,
          videoUrl:
            'https://assets.mixkit.co/videos/preview/mixkit-grinding-coffee-4292-large.mp4',
          poster: HERO_BANNERS[1],
          badge: 'Barista Pick',
        },
        {
          id: 'cvp-3',
          name: 'HiBrew Luxury Oak Coffee Station',
          price: 1599,
          videoUrl:
            'https://assets.mixkit.co/videos/preview/mixkit-pouring-coffee-in-a-cup-4293-large.mp4',
          poster: HERO_BANNERS[2],
          badge: 'Custom Order',
        },
      ],
      promotionalVideoBadge: true,
      promoBadgeText: 'Product Video',
      autoPlayVideo: false,
      videoAspectRatio: '9:16',
      badgePosition: 'top-left',
      showViewAll: true,
    },
    tabs: {
      ...base.tabs,
      enabled: true,
      mainTitle: 'All Products',
      subtitle: 'Official HiBrew machines, mills, cabinets, and barista gear',
      tabsStyle: 'buttons',
      activeTab: 'Latest Product',
      tabs: [
        'Latest Product',
        'Coffee Machines',
        'Coffee Mills',
        'Coffee Cabinets',
        'Barista Accessories',
        'Special Offers',
      ],
      displayType: 'slider',
      numberOfProducts: 8,
      displayViewAll: true,
    },
    detailedProducts: {
      ...base.detailedProducts,
      enabled: true,
      elementTitle: 'Flagship of the Week',
      subtitle: 'HiBrew Barista Pro H7A — dual PID boiler & 20-bar commercial extraction',
      selectedProductId: 'hb-h10a-dualboiler',
      productVideoUrl:
        'https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-into-a-cup-from-a-coffee-machine-42861-large.mp4',
      showSalesCount: true,
      salesCount: '380+ sold',
      useCustomRating: true,
      ratingValue: 4.96,
      numberOfReviews: 384,
      movingBannerText:
        'Express KSA delivery · 2-Year official warranty · 14-day replacement · Mada & Tabby accepted',
      bannerDividerIcon: 'Vertical Line (|)',
      bannerBgColor: '#173B35',
      bannerTextColor: '#FFFFFF',
      enableCarMatsCustomizer: false,
      enableTrunkMatOption: false,
      enableHybridFuelOption: false,
      enableDriverHeelPadOption: false,
      enableRemovableCarpetOption: false,
    },
    imageGrid: {
      ...base.imageGrid,
      enabled: false,
      items: [],
    },
    customLinks: {
      ...base.customLinks,
      enabled: true,
      title: 'HiBrew Events & Masterclasses',
      subtitle: 'Barista workshops, extraction demos, and roastery partnerships across KSA',
      makeFullWidth: true,
      displayAsSlider: false,
      layoutStyle: 'grid',
      aspectRatio: 'wide',
      hoverEffect: 'zoom',
      desktopColumns: 2,
      mobileColumns: 1,
      imageDisplayMode: 'cover',
      roundedCorners: 'medium',
      enableOverlay: true,
      overlayStyle: 'gradient',
      textPosition: 'bottom-left',
      showButtonOnBanner: true,
      buttonText: 'Learn More',
      buttonColor: '#c88a58',
      buttonStyle: 'filled',
      links: [
        {
          id: 'cl-coffee-1',
          image: HERO_BANNERS[0],
          title: 'Riyadh Barista Masterclass 2026',
          titleEn: 'Riyadh Barista Masterclass 2026',
          titleAr: 'ورشة باريستا الرياض ٢٠٢٦',
          subtitle: 'Hands-on dual-boiler dialing, milk microfoam, and 58mm workflow',
          subtitleEn: 'Hands-on dual-boiler dialing, milk microfoam, and 58mm workflow',
          subtitleAr: 'تدريب عملي على الدبل بويلر ورغوة الحليب وسير عمل ٥٨ مم',
          category: 'Riyadh Masterclass 2026',
          categoryEn: 'Riyadh Masterclass 2026',
          categoryAr: 'ورشة الرياض ٢٠٢٦',
          link: '#products',
          linkType: 'Category',
          showButton: true,
          buttonText: 'Reserve Seat',
          buttonTextEn: 'Reserve Seat',
          buttonTextAr: 'احجز مقعدك',
        },
        {
          id: 'cl-coffee-2',
          image: HERO_BANNERS[1],
          title: 'Live Extraction & Cupping Demo',
          titleEn: 'Live Extraction & Cupping Demo',
          titleAr: 'عرض حي للاستخلاص والتذوق',
          subtitle: 'Compare pressure profiles, grind sizes, and crema quality live',
          subtitleEn: 'Compare pressure profiles, grind sizes, and crema quality live',
          subtitleAr: 'قارن ملفات الضغط ودرجات الطحن وجودة الكريما مباشرة',
          category: 'Extraction Demo',
          categoryEn: 'Extraction Demo',
          categoryAr: 'استعراض الاستخلاص',
          link: '#products',
          linkType: 'Category',
          showButton: true,
          buttonText: 'View Schedule',
          buttonTextEn: 'View Schedule',
          buttonTextAr: 'عرض الجدول',
        },
        {
          id: 'cl-coffee-3',
          image: HERO_BANNERS[2],
          title: 'Artisan Single-Origin Roastery Partners',
          titleEn: 'Artisan Single-Origin Roastery Partners',
          titleAr: 'شراكات المحامص ذات المصدر الواحد',
          subtitle: 'Ethiopian, Colombian, and Saudi Khawlani reserve lots',
          subtitleEn: 'Ethiopian, Colombian, and Saudi Khawlani reserve lots',
          subtitleAr: 'محاصيل محجوزة من إثيوبيا وكولومبيا والخولاني السعودي',
          category: 'Roastery Partners',
          categoryEn: 'Roastery Partners',
          categoryAr: 'شراكات المحامص',
          link: '#products',
          linkType: 'Category',
          showButton: true,
          buttonText: 'Explore Event',
          buttonTextEn: 'Explore Event',
          buttonTextAr: 'استكشف الفعالية',
        },
      ],
    },
    // C-BAN stacked promo banners — removed from HiBrew home (locked UI); keep slot disabled
    banners: {
      ...base.banners,
      enabled: false,
      banners: [],
    },
    blog: {
      ...base.blog,
      enabled: false,
      articles: [],
      title: 'Coffee Brewing Guides',
      subtitle: 'Roasting, grinding, and extraction tips from HiBrew baristas',
    },
    // C-ANN: empty until SuperAdmin/merchant saves (Word doc). No live invent / no flowers MKS.
    announcementBar: {
      ...base.announcementBar,
      enabled: false,
      displayMode: 'rotate',
      animationType: 'marquee',
      bgColor: '#173B35',
      textColor: '#FFFFFF',
      messages: [],
    },
    enhancedFeatures: {
      ...base.enhancedFeatures,
      enabled: true,
      mainTitle: 'Why HiBrew KSA',
      mainTitleEn: 'Why HiBrew KSA',
      mainTitleAr: 'لماذا هايبرو السعودية',
      subtitle: 'Official warranty, fast delivery, and barista support across the Kingdom',
      subtitleEn: 'Official warranty, fast delivery, and barista support across the Kingdom',
      subtitleAr: 'ضمان رسمي وتوصيل سريع ودعم باريستا في أنحاء المملكة',
      layoutStyle: 'classic-cards',
      itemsPerRowDesktop: 4,
      itemsPerRowTablet: 2,
      itemsPerRowMobile: 1,
      bgColor: '#F8FAFC',
      contentAlign: 'center',
      itemSpacingDesktop: 32,
      itemSpacingMobile: 16,
      sectionPaddingDesktop: 24,
      sectionPaddingMobile: 16,
      features: [
        {
          id: 'cf-1',
          icon: 'Truck',
          mediaType: 'icon',
          title: 'Fast Shipping',
          titleEn: 'Fast Shipping',
          titleAr: 'شحن فوري سريع',
          description: 'Free shipping on orders above SAR 200',
          descriptionEn: 'Free shipping on orders above SAR 200',
          descriptionAr: 'مجاني الطلبات فوق 200 ريال',
          linkText: '',
          linkType: 'none',
          iconBg: '#FFFFFF',
          iconColor: '#111111',
          iconSize: 40,
          iconShape: 'rounded',
          showDesktop: true,
          showTablet: true,
          showMobile: true,
        },
        {
          id: 'cf-2',
          icon: 'ShieldCheck',
          mediaType: 'icon',
          title: '2-Year Warranty',
          titleEn: '2-Year Warranty',
          titleAr: 'ضمان الوكيل سنتين',
          description: 'Service and genuine spare parts',
          descriptionEn: 'Service and genuine spare parts',
          descriptionAr: 'صيانة وقطع غيار أصلية',
          linkText: '',
          linkType: 'none',
          iconBg: '#FFFFFF',
          iconColor: '#16A34A',
          iconSize: 40,
          iconShape: 'rounded',
          showDesktop: true,
          showTablet: true,
          showMobile: true,
        },
        {
          id: 'cf-3',
          icon: 'RotateCcw',
          mediaType: 'icon',
          title: '14-Day Return',
          titleEn: '14-Day Return',
          titleAr: 'استبدال 14 يوماً',
          description: 'Easy return or replacement',
          descriptionEn: 'Easy return or replacement',
          descriptionAr: 'إرجاع أو استبدال ميسر',
          linkText: '',
          linkType: 'none',
          iconBg: '#FFFFFF',
          iconColor: '#111111',
          iconSize: 40,
          iconShape: 'rounded',
          showDesktop: true,
          showTablet: true,
          showMobile: true,
        },
        {
          id: 'cf-4',
          icon: 'Headphones',
          mediaType: 'icon',
          title: '24/7 Support',
          titleEn: '24/7 Support',
          titleAr: 'دعم دائم 24/7',
          description: 'Help with setup and orders',
          descriptionEn: 'Help with setup and orders',
          descriptionAr: 'مساعدة في الاستخدام والطلب',
          linkText: '',
          linkType: 'none',
          iconBg: '#FFFFFF',
          iconColor: '#111111',
          iconSize: 40,
          iconShape: 'rounded',
          showDesktop: true,
          showTablet: true,
          showMobile: true,
        },
      ],
      cardBackground: 'white',
      cardBorder: 'soft',
      borderRadius: 16,
      shadow: true,
      iconAnimation: 'floating',
      hoverEffect: 'zoom',
    },
    customProducts: {
      ...base.customProducts,
      enabled: true,
      mainTitle: 'Featured HiBrew Gear',
      subtitle: 'Machines, mills, cabinets, and barista tools — official KSA catalog',
      displayType: 'slider',
      productType: 'featured',
      numberOfProducts: 8,
      displayViewAll: true,
    },
    specialOffer: {
      ...base.specialOffer,
      enabled: true,
      badgeText: 'LIMITED OFFER',
      title: 'Seasonal Espresso Bundle Savings',
      description: 'Save on selected HiBrew machines and grinder bundles while stock lasts.',
      bgImage: HERO_BANNERS[1],
      bgColor: '#1a110c',
      contentColor: '#f7ede2',
      countdownEndDate: '2026-12-31T23:59:59',
      countdownStyle: 'modern-cards',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      buttonText: 'Shop Offers →',
      buttonLink: '#products',
      buttonStyle: 'filled',
      showProductImage: true,
      productImage: HERO_BANNERS[0],
      showTrustMessages: true,
      trustMessages: [
        { id: 'ctm-1', icon: 'Truck', text: 'Express KSA Delivery' },
        { id: 'ctm-2', icon: 'ShieldCheck', text: '2-Year Official Warranty' },
        { id: 'ctm-3', icon: 'Clock', text: 'Limited Stock' },
      ],
    },
    statistics: {
      ...base.statistics,
      enabled: true,
      mainTitle: 'HiBrew KSA in Numbers',
      subtitle: 'Trusted by home baristas and cafés across Saudi Arabia',
      items: [
        {
          id: 'cst-1',
          icon: 'Package',
          number: '+120',
          label: 'SKUs & Accessories',
          description: 'Machines, mills, and barista tools',
        },
        {
          id: 'cst-2',
          icon: 'Users',
          number: '+8K',
          label: 'Happy Customers',
          description: 'Verified HiBrew owners in KSA',
        },
        {
          id: 'cst-3',
          icon: 'ShoppingCart',
          number: '+400',
          label: 'Monthly Orders',
          description: 'Fulfillment across major cities',
        },
        {
          id: 'cst-4',
          icon: 'Store',
          number: '2',
          label: 'Showrooms',
          description: 'Riyadh & Jeddah experience centers',
        },
      ],
    },
    maintenance: base.maintenance
      ? {
          ...base.maintenance,
          enabled: false,
          titleEn: 'HiBrew KSA — Back Soon',
          titleAr: 'هايبرو السعودية — نعود قريباً',
          subtitleEn: 'We are updating our flagship catalog and barista workshop schedule.',
          subtitleAr: 'نحدّث تشكيلة المكائن ومواعيد ورش الباريستا — شكراً لصبركم.',
          launchDate: base.maintenance.launchDate || '2026-12-31T00:00:00',
        }
      : base.maintenance,
  };
  const withModular = applyMissingModularSeeds(seeded);
  return healCoffeeBrokenMedia({
    ...withModular,
    _coffeeModularSeeded: true,
  } as AllThemeSettings);
}

/** Keep legacy slider slides aligned with modular heroBanners (coffee saves). */
export function applyHeroBannersToSlider(settings: AllThemeSettings): AllThemeSettings {
  const hero = settings.heroBanners;
  if (!hero) return settings;
  const slides = (hero.banners || [])
    .filter((b) => b.enabled !== false && (b.image || b.titleEn || b.titleAr))
    .map((b) => ({
      id: b.id,
      productId: b.productId || undefined,
      type: 'image' as const,
      image: b.image || '',
      title: b.titleEn || b.titleAr || '',
      titleEn: b.titleEn,
      titleAr: b.titleAr,
      subtitle: b.descriptionEn || b.descriptionAr || '',
      subtitleEn: b.descriptionEn,
      subtitleAr: b.descriptionAr,
      buttonText: b.buyNowEn || b.learnMoreEn || '',
      buttonTextEn: b.buyNowEn,
      buttonTextAr: b.buyNowAr,
      buttonUrl: b.learnMoreUrl || '',
      buttonBgColor: '#c88a58',
      buttonTextColor: '#FFFFFF',
      badge: b.promoEn || '',
      badgeEn: b.promoEn,
      badgeAr: b.promoAr,
      priceEn: b.showPrice && b.price ? `${b.currency || 'SAR'} ${b.price}` : '',
      priceAr: b.showPrice && b.price ? `${b.price} ر.س` : '',
    }));
  return {
    ...settings,
    slider: {
      ...settings.slider,
      autoPlay: hero.autoplay,
      transitionDuration: Math.max(3, Math.round((hero.intervalMs || 5000) / 1000)),
      slides: hero.enabled ? slides : [],
    },
  };
}

/**
 * Fill empty / legacy-broken coffee banner image fields from product catalog.
 * Does not invent slides — only heals image URLs on existing rows.
 */
export function healCoffeeBrokenMedia(settings: AllThemeSettings): AllThemeSettings {
  let changed = false;
  const next: AllThemeSettings = { ...settings };

  if (next.heroBanners?.banners?.length) {
    const banners = next.heroBanners.banners.map((b) => {
      const healed = resolveCoffeeMediaUrl(b.image, b.productId);
      const healedMobile = resolveCoffeeMediaUrl(b.mobileImage, b.productId) || healed;
      if (healed && healed !== (b.image || '').trim()) {
        changed = true;
        return { ...b, image: healed, mobileImage: b.mobileImage ? healedMobile : b.mobileImage };
      }
      if (b.image && cleanImageUrl(b.image) !== b.image) {
        changed = true;
        return { ...b, image: cleanImageUrl(b.image) };
      }
      return b;
    });
    if (changed) next.heroBanners = { ...next.heroBanners, banners };
  }

  if (next.featuredSectionBanners?.banners?.length) {
    let fChanged = false;
    const banners = next.featuredSectionBanners.banners.map((b) => {
      const imgs = (b.images || []).map((u) => resolveCoffeeMediaUrl(u, b.productId));
      const usable = imgs.filter(Boolean);
      if (!usable.length) {
        const catalog = resolveCoffeeMediaUrl('', b.productId);
        if (catalog) {
          fChanged = true;
          return { ...b, images: [catalog] };
        }
        return b;
      }
      if (usable.some((u, i) => u !== (b.images || [])[i])) {
        fChanged = true;
        return { ...b, images: usable };
      }
      return b;
    });
    if (fChanged) {
      changed = true;
      next.featuredSectionBanners = { ...next.featuredSectionBanners, banners };
    }
  }

  if (next.slider?.slides?.length) {
    let sChanged = false;
    const slides = next.slider.slides.map((s) => {
      const healed = resolveCoffeeMediaUrl(s.image, s.productId);
      if (healed && healed !== (s.image || '').trim()) {
        sChanged = true;
        return { ...s, image: healed };
      }
      return s;
    });
    if (sChanged) {
      changed = true;
      next.slider = { ...next.slider, slides };
    }
  }

  if (next.banners?.banners?.length) {
    let bChanged = false;
    const banners = next.banners.banners.map((b) => {
      const link = (b as { link?: string }).link || '';
      const healed = resolveCoffeeMediaUrl(b.image, link);
      if (healed && healed !== (b.image || '').trim()) {
        bChanged = true;
        return { ...b, image: healed };
      }
      return b;
    });
    if (bChanged) {
      changed = true;
      next.banners = { ...next.banners, banners };
    }
  }

  // C-BAN stacked promo strip retired from HiBrew — always off + empty
  if (next.banners && (next.banners.enabled !== false || (next.banners.banners?.length ?? 0) > 0)) {
    changed = true;
    next.banners = { ...next.banners, enabled: false, banners: [] };
  }

  // Heal English-only coffee event/custom-link cards so AR chrome stays Arabic
  if (next.customLinks?.links?.length) {
    const biPatch: Record<
      string,
      { titleAr: string; subtitleAr: string; categoryAr: string; buttonTextAr: string; titleEn: string; subtitleEn: string; categoryEn: string; buttonTextEn: string }
    > = {
      'cl-coffee-1': {
        titleEn: 'Riyadh Barista Masterclass 2026',
        titleAr: 'ورشة باريستا الرياض ٢٠٢٦',
        subtitleEn: 'Hands-on dual-boiler dialing, milk microfoam, and 58mm workflow',
        subtitleAr: 'تدريب عملي على الدبل بويلر ورغوة الحليب وسير عمل ٥٨ مم',
        categoryEn: 'Riyadh Masterclass 2026',
        categoryAr: 'ورشة الرياض ٢٠٢٦',
        buttonTextEn: 'Reserve Seat',
        buttonTextAr: 'احجز مقعدك',
      },
      'cl-coffee-2': {
        titleEn: 'Live Extraction & Cupping Demo',
        titleAr: 'عرض حي للاستخلاص والتذوق',
        subtitleEn: 'Compare pressure profiles, grind sizes, and crema quality live',
        subtitleAr: 'قارن ملفات الضغط ودرجات الطحن وجودة الكريما مباشرة',
        categoryEn: 'Extraction Demo',
        categoryAr: 'استعراض الاستخلاص',
        buttonTextEn: 'View Schedule',
        buttonTextAr: 'عرض الجدول',
      },
      'cl-coffee-3': {
        titleEn: 'Artisan Single-Origin Roastery Partners',
        titleAr: 'شراكات المحامص ذات المصدر الواحد',
        subtitleEn: 'Ethiopian, Colombian, and Saudi Khawlani reserve lots',
        subtitleAr: 'محاصيل محجوزة من إثيوبيا وكولومبيا والخولاني السعودي',
        categoryEn: 'Roastery Partners',
        categoryAr: 'شراكات المحامص',
        buttonTextEn: 'Explore Event',
        buttonTextAr: 'استكشف الفعالية',
      },
    };
    let linksChanged = false;
    const links = next.customLinks.links.map((l) => {
      const patch =
        biPatch[l.id] ||
        Object.values(biPatch).find((p) => p.titleEn === l.title || p.titleEn === l.titleEn);
      if (!patch) return l;
      if (l.titleAr && l.subtitleAr && l.buttonTextAr) return l;
      linksChanged = true;
      return {
        ...l,
        titleEn: l.titleEn || patch.titleEn,
        titleAr: l.titleAr || patch.titleAr,
        subtitleEn: l.subtitleEn || patch.subtitleEn,
        subtitleAr: l.subtitleAr || patch.subtitleAr,
        categoryEn: l.categoryEn || patch.categoryEn,
        categoryAr: l.categoryAr || patch.categoryAr,
        buttonTextEn: l.buttonTextEn || patch.buttonTextEn,
        buttonTextAr: l.buttonTextAr || patch.buttonTextAr,
      };
    });
    if (linksChanged) {
      changed = true;
      next.customLinks = { ...next.customLinks, links };
    }
  }

  // Heal legacy dark coffee color seeds that painted the light HiBrew UI brown/black
  const c = next.colors;
  if (c) {
    const darkish = (hex?: string) => {
      const h = (hex || '').replace('#', '').toLowerCase();
      return h === '1a110c' || h === '160e0a' || h === '0f0a08';
    };
    const lightTextOnDark = (c.mainTextColor || '').toLowerCase().includes('f7ede2');
    if (darkish(c.secondaryBgColor) || darkish(c.headerBgColor) || lightTextOnDark) {
      changed = true;
      next.colors = {
        ...c,
        secondaryBgColor: '#FFFFFF',
        mainTextColor: '#171717',
        secondaryTextColor: '#525252',
        headerBgColor: '#FFFFFF',
        headerTextColor: '#111111',
        primaryBgColor: c.primaryBgColor === '#1a110c' ? '#FFFFFF' : c.primaryBgColor || '#FFFFFF',
      };
    }
  }

  void changed;
  return next;
}

/**
 * Storefront + builder read path for coffee: full seed when needed, else fill
 * only *missing* modular keys (never overwrite merchant-cleared arrays).
 */
export function resolveCoffeeThemeSettings(
  storeId: string,
  fallbackStore: { id?: string; name?: string },
): AllThemeSettings {
  const raw = readAllThemeSettings(storeId, fallbackStore as any);
  const base = coffeeSectionsNeedSeed(raw) ? seedCoffeeThemeSettings(raw) : raw;
  return healCoffeeBrokenMedia(applyMissingModularSeeds(base));
}

/**
 * Re-apply coffee seeds only for first-time / floral-leaked stores.
 * Merchant-cleared empty lists must stay empty (no dummy refill).
 */
export function coffeeSectionsNeedSeed(settings: AllThemeSettings): boolean {
  const flowerTabs =
    settings.tabs?.tabs?.some((t) => /bridal|bouquet|vase|flower/i.test(t)) ?? false;
  if (flowerTabs) return true;
  const flowerLinks =
    settings.customLinks?.links?.some((l) =>
      /bridal|bouquet|vase|flower|ورد|باقة/i.test(`${l.title || ''} ${l.subtitle || ''} ${l.category || ''}`),
    ) ?? false;
  if (flowerLinks) return true;
  // Already seeded once — respect merchant empties
  if ((settings as AllThemeSettings & { _coffeeModularSeeded?: boolean })._coffeeModularSeeded) {
    return false;
  }
  // Existing coffee content (pre-flag saves) — do not overwrite
  const hasCoffeeContent =
    (settings.heroBanners?.banners?.length ?? 0) > 0 ||
    (settings.featuredCategoriesProducts?.sections?.length ?? 0) > 0 ||
    (settings.enhancedFeatures?.features?.length ?? 0) > 0 ||
    (settings.announcementBar?.messages?.length ?? 0) > 0 ||
    (settings.exclusiveBenefits?.items?.length ?? 0) > 0;
  if (hasCoffeeContent) return false;
  // Bare first coffee load: seed HiBrew defaults once
  return true;
}
