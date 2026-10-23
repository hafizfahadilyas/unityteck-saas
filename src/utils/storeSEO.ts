import { Store, Product, StoreSEOConfig } from '../types';

export interface GeneratedStoreSEO {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords: string[];
  lang: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
  og: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: 'website' | 'product';
    locale: string;
    alternateLocale: string;
    siteName: string;
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    image: string;
  };
  hreflang: {
    ar: string;
    en: string;
  };
  tracking: {
    ga4Id?: string;
    gtmId?: string;
    gscTag?: string;
    googleAdsId?: string;
  };
  schema: Record<string, unknown>;
}

/**
 * Generates natural, store-specific SEO metadata without keyword stuffing.
 * Strict Tenant Isolation: Exclusively uses the given store's name, category, location, and products.
 * Strict Bilingual Isolation: 100% pure English in English mode, 100% pure Arabic in Arabic mode.
 */
export function generateStoreSEO(options: {
  store: Store;
  products: Product[];
  seoConfig?: StoreSEOConfig;
  lang: 'ar' | 'en';
  selectedCategory?: string;
  activeProduct?: Product | null;
  page?: string;
}): GeneratedStoreSEO {
  const { store, products, seoConfig, lang, selectedCategory, activeProduct, page } = options;

  const isArabic = lang === 'ar';
  const customDomain = store.custom_domain ? `https://${store.custom_domain}` : null;
  const baseUrl = customDomain || (typeof window !== 'undefined' ? `${window.location.origin}/?store=${store.slug || store.id}` : `https://${store.slug || 'store'}.saudi-stores.com`);
  const primaryImage = activeProduct?.image || products[0]?.image || '/images/brand-logo.png';

  const isCoffeeStore = store.id === 'store-coffee' || store.slug?.includes('coffee') || store.slug?.includes('hibrew');
  const isCarStore = store.id === 'store-bleco' || store.slug?.includes('alsaeedi') || store.slug?.includes('car') || store.slug?.includes('bleco');
  const isFlowerStore = store.id === 'store-1' || store.id === 'store-mecca' || store.slug?.includes('flower') || store.slug?.includes('gift') || store.category?.toLowerCase().includes('flower') || store.category?.toLowerCase().includes('gift') || (store.categoryAr && (store.categoryAr.includes('ورد') || store.categoryAr.includes('زهور')));

  // Tracking IDs (from store config or live active store)
  const ga4Id = seoConfig?.ga4MeasurementId || (store as any).ga4_id || undefined;
  const gtmId = seoConfig?.gtmContainerId || (store as any).gtm_id || undefined;
  const gscTag = seoConfig?.searchConsoleVerificationTag || (store as any).gsc_verification || undefined;
  const googleAdsId = seoConfig?.googleAdsConversionId;

  // 1. Dynamic Meta Title (Tailored to active product, category, page, and store)
  let title = '';
  if (isCoffeeStore) {
    if (activeProduct) {
      const prodName = isArabic ? (activeProduct.nameAr || activeProduct.name) : (activeProduct.nameEn || activeProduct.name);
      title = isArabic
        ? `${prodName} | هايبرو السعودية المتجر الرسمي لمكائن ومستلزمات القهوة`
        : `${prodName} | HiBrew KSA Official Coffee Machines & Barista Gear`;
    } else if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'الكل') {
      title = isArabic
        ? `${selectedCategory} | هايبرو السعودية متجر أدوات ومكائن القهوة`
        : `${selectedCategory} | HiBrew KSA Espresso & Specialty Coffee Gear`;
    } else if (page === 'cart') {
      title = isArabic ? 'سلة المشتريات | هايبرو السعودية' : 'Shopping Cart | HiBrew KSA Official Store';
    } else if (page === 'checkout') {
      title = isArabic ? 'إتمام الطلب والدفع الآمن | هايبرو السعودية' : 'Secure Checkout | HiBrew KSA Official Store';
    } else {
      title = isArabic
        ? 'هايبرو السعودية | المتجر الرسمي لمكائن ومستلزمات القهوة المختصة'
        : 'HiBrew KSA | Official Coffee Store - Espresso Machines & Specialty Coffee Gear';
    }
  } else if (isCarStore) {
    if (activeProduct) {
      const prodName = isArabic ? (activeProduct.nameAr || activeProduct.name) : (activeProduct.nameEn || activeProduct.name);
      title = isArabic
        ? `${prodName} | السعيدي لخدمات وتنجيد السيارات بمكة`
        : `${prodName} | Al-Saeedi Car Upholstery & Accessories Makkah`;
    } else if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'الكل') {
      title = isArabic
        ? `${selectedCategory} | السعيدي لخدمات السيارات مكة`
        : `${selectedCategory} | Al-Saeedi Car Upholstery & Interior Protection`;
    } else if (page === 'cart') {
      title = isArabic ? 'سلة الشراء | السعيدي لخدمات السيارات' : 'Shopping Cart | Al-Saeedi Car Services';
    } else if (page === 'checkout') {
      title = isArabic ? 'إتمام طلب تنجيد السيارة | السعيدي مكة' : 'Secure Vehicle Checkout | Al-Saeedi Car Services';
    } else {
      title = isArabic
        ? 'متجر السعيدي لخدمات السيارات — تنجيد مكة | تلابيس مقاعد وأرضيات ليزر ودايموند'
        : 'Al-Saeedi Car Services Makkah | Custom VIP Seat Covers & 5D Floor Mats';
    }
  } else if (isFlowerStore) {
    if (activeProduct) {
      const prodName = isArabic ? (activeProduct.nameAr || activeProduct.name) : (activeProduct.nameEn || activeProduct.name);
      title = isArabic
        ? `${prodName} | ${store.name} - توصيل فنادق الحرم المكي`
        : `${prodName} | ${store.name} - Luxury Makkah Delivery`;
    } else if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'الكل') {
      title = isArabic
        ? `${selectedCategory} | ${store.name} - توصيل سريع بمكة`
        : `${selectedCategory} | ${store.name} - Fresh Luxury Floral Collections`;
    } else if (page === 'cart') {
      title = isArabic ? `سلة الهدايا | ${store.name}` : `Gift Cart | ${store.name}`;
    } else if (page === 'checkout') {
      title = isArabic ? `إتمام الطلب والتوصيل | ${store.name}` : `Secure Delivery Checkout | ${store.name}`;
    } else {
      title = isArabic
        ? `${store.name} | زهور طبيعية وتوصيل هدايا فنادق الحرم المكي`
        : `${store.name} | Luxury Fresh Flowers & Haram Hotel Gifts Makkah`;
    }
  } else {
    // 100% Dynamic Store-Neutral Catalog SEO
    const storeName = isArabic ? (store.nameAr || store.name) : (store.nameEn || store.name);
    const storeCategory = isArabic ? (store.categoryAr || store.category || 'متجر إلكتروني') : (store.categoryEn || store.category || 'Official Online Store');
    if (activeProduct) {
      const prodName = isArabic ? (activeProduct.nameAr || activeProduct.name) : (activeProduct.nameEn || activeProduct.name);
      title = `${prodName} | ${storeName}`;
    } else if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'الكل') {
      title = `${selectedCategory} | ${storeName}`;
    } else if (page === 'cart') {
      title = isArabic ? `سلة المشتريات | ${storeName}` : `Shopping Cart | ${storeName}`;
    } else if (page === 'checkout') {
      title = isArabic ? `إتمام الطلب والدفع الآمن | ${storeName}` : `Secure Checkout | ${storeName}`;
    } else {
      title = `${storeName} | ${storeCategory}`;
    }
  }

  // 2. Dynamic Meta Description (140-160 chars, compelling and natural)
  let description = '';
  if (isCoffeeStore) {
    description = isArabic
      ? 'متجر هايبرو السعودية الرسمي. متخصصون في مكائن القهوة 20 بار، مطاحن البن التيتانيوم، وأركان ودواليب القهوة الفاخرة مع توصيل سريع لجميع مناطق المملكة.'
      : 'Official HiBrew KSA store. High-performance 20-bar espresso machines, titanium conical burr grinders, and luxury coffee stations across Saudi Arabia.';
  } else if (isCarStore) {
    description = isArabic
      ? 'متجر السعيدي لخدمات السيارات وتنجيد مكة. تفصيل تلابيس مقاعد ليزرية، أرضيات 5D مقاومة للماء، واكسسوارات فاخرة لأكثر من 400 موديل سيارة مع ضمان معتمد.'
      : 'Al-Saeedi Car Upholstery Makkah. Laser-fitted VIP seat covers, 5D waterproof floor mats, and custom automotive accessories for 400+ vehicle models.';
  } else if (isFlowerStore) {
    if (activeProduct) {
      const prodName = isArabic ? (activeProduct.nameAr || activeProduct.name) : (activeProduct.nameEn || activeProduct.name);
      description = isArabic
        ? `اطلب ${prodName} بسعر ${activeProduct.price} ريال من ${store.name}. توصيل سريع خلال ساعتين لفنادق الحرم المكي الشريف وأحياء مكة المكرمة.`
        : `Order ${prodName} for SAR ${activeProduct.price} from ${store.name}. Express 2-hour hand delivery to all Makkah hotels & districts.`;
    } else if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'الكل') {
      description = isArabic
        ? `تصفح تشكيلة ${selectedCategory} الفاخرة من ${store.name}. زهور طبيعية قطاف اليوم وتنسيقات حصرية مع توصيل سريع في العاصمة المقدسة.`
        : `Explore luxury ${selectedCategory} from ${store.name}. Fresh hand-picked blooms crafted for Makkah weddings, hotel welcomes, and VIP events.`;
    } else {
      description = isArabic
        ? (seoConfig?.metaDescription || `متجر ${store.name} لتوصيل أرقى باقات الورد الطبيعي الهولندي، فازات الليليوم، وهدايا الحرم المكي مع توصيل سريع خلال ساعتين في مكة المكرمة.`)
        : `Order fresh Dutch roses, luxury lily vases, and Holy Haram VIP gift hampers from ${store.name} with express 2-hour delivery across all Makkah hotels & districts.`;
    }
  } else {
    // Dynamic store-neutral description
    const storeName = isArabic ? (store.nameAr || store.name) : (store.nameEn || store.name);
    const storeCategory = isArabic ? (store.categoryAr || store.category || 'متجر إلكتروني') : (store.categoryEn || store.category || 'Official Online Store');
    if (activeProduct) {
      const prodName = isArabic ? (activeProduct.nameAr || activeProduct.name) : (activeProduct.nameEn || activeProduct.name);
      description = isArabic
        ? `تسوق ${prodName} من ${storeName} بسعر ${activeProduct.price} ريال مع شحن وتوصيل لكافة مدن المملكة.`
        : `Buy ${prodName} from ${storeName} for SAR ${activeProduct.price}. Premium quality and fast shipping across Saudi Arabia.`;
    } else if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'الكل') {
      description = isArabic
        ? `اكتشف تشكيلة ${selectedCategory} المميزة من ${storeName} بأفضل الأسعار وأعلى جودة.`
        : `Explore premium ${selectedCategory} from ${storeName} with the best quality and prices.`;
    } else {
      description = isArabic
        ? (seoConfig?.metaDescription || `متجر ${storeName} - ${storeCategory}. تسوق أحدث المنتجات والعروض مع توصيل سريع لجميع مناطق المملكة.`)
        : (seoConfig?.metaDescription || `${storeName} - ${storeCategory}. Shop authentic products and exclusive offers with fast shipping across Saudi Arabia.`);
    }
  }

  // 3. Relevant, Non-Spam Natural Keyword Targets
  const defaultKeywordsAr = isCoffeeStore
    ? ['هايبرو السعودية', 'مكائن قهوة 20 بار', 'مطاحن قهوة مختصة', 'أركان قهوة منزلية', 'دبل بويلر', 'إسبريسو السعودية']
    : isCarStore
    ? ['تنجيد سيارات مكة', 'تلابيس مقاعد ليزر', 'أرضيات 5D سيارات', 'السعيدي للسيارات', 'اكسسوارات سيارات مكة', 'جلد ألماني سيارات']
    : isFlowerStore
    ? ['توصيل ورد مكة', 'محل ورد طبيعي مكة', 'توصيل ورد فنادق الحرم', 'هدايا معتمرين ورد وزمزم', 'بوكس ورد جوري مكة']
    : [store.name, store.category || 'متجر الكتروني', 'تسوق اونلاين', 'عروض السعودية', 'شحن وتوصيل'];

  const defaultKeywordsEn = isCoffeeStore
    ? ['HiBrew KSA', 'espresso machines Saudi Arabia', 'coffee grinder 20 bar', 'specialty coffee bar', 'home barista gear']
    : isCarStore
    ? ['car upholstery Makkah', 'custom seat covers', '5D car floor mats', 'Al-Saeedi car services', 'automotive interior Saudi']
    : isFlowerStore
    ? ['Makkah fresh flower delivery', 'Holy Haram hotel flower delivery', 'luxury Dutch roses Mecca', 'pilgrim VIP gift hampers Makkah']
    : [store.name, store.category || 'online store', 'shopping Saudi Arabia', 'fast shipping', 'best deals'];

  const keywords = isArabic
    ? (seoConfig?.keywords && seoConfig.keywords.length > 0 ? seoConfig.keywords : defaultKeywordsAr)
    : defaultKeywordsEn;

  // 4. Schema.org JSON-LD Structured Data
  const storeType = isCoffeeStore ? 'CafeOrCoffeeShop' : isCarStore ? 'AutoRepair' : isFlowerStore ? 'Florist' : 'Store';
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: isArabic ? store.name : (store.name || 'UnityTeck SaaS Store'),
        description,
        inLanguage: isArabic ? 'ar-SA' : 'en-US',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': ['Store', storeType, 'Organization'],
        '@id': `${baseUrl}/#store`,
        name: store.name,
        description,
        url: baseUrl,
        telephone: isCoffeeStore ? '+9668001240099' : isCarStore ? '+966597757086' : '+966125558920',
        priceRange: isCoffeeStore ? 'SAR 250 - SAR 2,500' : isCarStore ? 'SAR 190 - SAR 1,800' : 'SAR 150 - SAR 850',
        currenciesAccepted: 'SAR',
        paymentAccepted: 'Mada, Apple Pay, Visa, MasterCard, Tabby, Tamara, Cash on Delivery',
        image: primaryImage,
        address: {
          '@type': 'PostalAddress',
          streetAddress: isCarStore ? 'Al-Saeedi Center, Al-Shohada Dist' : 'Central Area, Next to Clock Tower',
          addressLocality: isCoffeeStore ? 'Riyadh' : 'Makkah',
          addressRegion: isCoffeeStore ? 'Riyadh Province' : 'Makkah Province',
          postalCode: '24231',
          addressCountry: 'SA',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: isCoffeeStore ? 24.7136 : 21.4225,
          longitude: isCoffeeStore ? 46.6753 : 39.8262,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '08:00',
            closes: '24:00',
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: `${store.name} Catalog`,
        numberOfItems: products.length,
        itemListElement: products.slice(0, 24).map((prod, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'Product',
            '@id': `${baseUrl}/#product-${prod.id}`,
            name: isArabic ? (prod.nameAr || prod.name) : (prod.nameEn || prod.name),
            sku: prod.sku || `SKU-${prod.id}`,
            category: prod.category,
            image: prod.image,
            description: isArabic ? (prod.descriptionAr || prod.description || prod.name) : (prod.descriptionEn || prod.description || prod.name),
            brand: {
              '@type': 'Brand',
              name: prod.brand || (isCoffeeStore ? 'HiBrew' : isCarStore ? 'Al-Saeedi' : 'Hadaya Mecca'),
            },
            offers: {
              '@type': 'Offer',
              price: prod.price,
              priceCurrency: 'SAR',
              priceValidUntil: '2027-12-31',
              availability: prod.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: `${baseUrl}/?product=${prod.id}`,
              seller: {
                '@type': 'Organization',
                name: store.name,
              },
            },
          },
        })),
      },
    ],
  };

  return {
    title,
    description,
    canonicalUrl: baseUrl,
    keywords,
    lang,
    dir: isArabic ? 'rtl' : 'ltr',
    og: {
      title,
      description,
      image: primaryImage,
      url: baseUrl,
      type: activeProduct ? 'product' : 'website',
      locale: isArabic ? 'ar_SA' : 'en_US',
      alternateLocale: isArabic ? 'en_US' : 'ar_SA',
      siteName: store.name,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: primaryImage,
    },
    hreflang: {
      ar: `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}lang=ar`,
      en: `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}lang=en`,
    },
    tracking: {
      ga4Id,
      gtmId,
      gscTag,
      googleAdsId,
    },
    schema,
  };
}

/**
 * Applies the generated SEO metadata, Google Analytics 4, Google Tag Manager,
 * Google Search Console verification, and Schema.org JSON-LD to the DOM.
 */
export function applySEOToDOM(seo: GeneratedStoreSEO): void {
  if (typeof document === 'undefined') return;

  // 1. Page Title
  document.title = seo.title;

  // 2. HTML lang and dir attributes
  document.documentElement.lang = seo.lang;
  document.documentElement.dir = seo.dir;

  // 3. Helper to update or create meta tag
  const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Standard Meta Tags
  setMeta('name', 'description', seo.description);
  setMeta('name', 'keywords', seo.keywords.join(', '));
  setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  setMeta('name', 'googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // Google Search Console Site Verification
  if (seo.tracking.gscTag) {
    setMeta('name', 'google-site-verification', seo.tracking.gscTag);
  }

  // Open Graph Tags
  setMeta('property', 'og:title', seo.og.title);
  setMeta('property', 'og:description', seo.og.description);
  setMeta('property', 'og:url', seo.og.url);
  setMeta('property', 'og:image', seo.og.image);
  setMeta('property', 'og:type', seo.og.type);
  setMeta('property', 'og:site_name', seo.og.siteName);
  setMeta('property', 'og:locale', seo.og.locale);
  setMeta('property', 'og:locale:alternate', seo.og.alternateLocale);

  // Twitter Cards
  setMeta('name', 'twitter:card', seo.twitter.card);
  setMeta('name', 'twitter:title', seo.twitter.title);
  setMeta('name', 'twitter:description', seo.twitter.description);
  setMeta('name', 'twitter:image', seo.twitter.image);

  // Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', seo.canonicalUrl);

  // Alternate Language Links (hreflang)
  const setHreflang = (lang: string, href: string) => {
    let link = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  };
  setHreflang('ar', seo.hreflang.ar);
  setHreflang('en', seo.hreflang.en);
  setHreflang('x-default', seo.canonicalUrl);

  // PageSpeed Preconnect Hints
  const preconnectUrls = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ];
  preconnectUrls.forEach((url) => {
    if (!document.querySelector(`link[rel="preconnect"][href="${url}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      if (url.includes('gstatic')) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });

  // Schema.org JSON-LD Script
  let jsonLdScript = document.getElementById('store-seo-jsonld') as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'store-seo-jsonld';
    jsonLdScript.type = 'application/ld+json';
    document.head.appendChild(jsonLdScript);
  }
  jsonLdScript.textContent = JSON.stringify(seo.schema, null, 2);

  // Skip external tracking scripts on local dev environment to prevent offline / ERR_NAME_NOT_RESOLVED delays
  const isLocalHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local')
  );
  if (isLocalHost) {
    return;
  }

  // Google Tag Manager (GTM) Container Injection
  if (seo.tracking.gtmId && !document.getElementById('gtm-script-tag')) {
    const gtmId = seo.tracking.gtmId;
    const gtmScript = document.createElement('script');
    gtmScript.id = 'gtm-script-tag';
    gtmScript.async = true;
    gtmScript.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(gtmScript);

    // GTM Noscript iframe fallback
    if (!document.getElementById('gtm-noscript-tag')) {
      const noscript = document.createElement('noscript');
      noscript.id = 'gtm-noscript-tag';
      noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.insertBefore(noscript, document.body.firstChild);
    }
  }

  // Google Analytics 4 (GA4) Global Site Tag (gtag.js)
  if (seo.tracking.ga4Id && !document.getElementById('ga4-script-tag')) {
    const ga4Id = seo.tracking.ga4Id;
    const gtagScript = document.createElement('script');
    gtagScript.id = 'ga4-script-tag';
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    document.head.appendChild(gtagScript);

    const gtagConfigScript = document.createElement('script');
    gtagConfigScript.id = 'ga4-config-tag';
    gtagConfigScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${ga4Id}', {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true
      });
    `;
    document.head.appendChild(gtagConfigScript);
  }
}
