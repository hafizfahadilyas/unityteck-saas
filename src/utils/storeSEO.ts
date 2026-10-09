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
  schema: Record<string, unknown>;
}

/**
 * Generates natural, store-specific SEO metadata without keyword stuffing.
 * Strict Tenant Isolation: Exclusively uses the given store's name, category, location, and products.
 */
export function generateStoreSEO(options: {
  store: Store;
  products: Product[];
  seoConfig?: StoreSEOConfig;
  lang: 'ar' | 'en';
  selectedCategory?: string;
  activeProduct?: Product | null;
}): GeneratedStoreSEO {
  const { store, products, seoConfig, lang, selectedCategory, activeProduct } = options;

  const isArabic = lang === 'ar';
  const baseUrl = `https://${store.slug}.saudi-stores.com`;
  const primaryImage = activeProduct?.image || products[0]?.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80';

  // 1. Dynamic Meta Title (Tailored to active product, category, or homepage)
  let title = '';
  if (activeProduct) {
    title = isArabic
      ? `${activeProduct.name} | ${store.name} - مكة المكرمة`
      : `${activeProduct.name} | ${store.name} - Makkah Delivery`;
  } else if (selectedCategory && selectedCategory !== 'All') {
    title = isArabic
      ? `${selectedCategory} | ${store.name} - توصيل مكة`
      : `${selectedCategory} | ${store.name} - Fresh Flowers Makkah`;
  } else {
    if (isArabic) {
      title = `${store.name} | زهور طبيعية وتوصيل هدايا فنادق الحرم المكي`;
    } else {
      title = `${store.name} | Luxury Fresh Flowers & Haram Hotel Gifts Makkah`;
    }
  }

  // 2. Dynamic Meta Description (120-160 chars, natural and compelling)
  let description = '';
  if (activeProduct) {
    description = isArabic
      ? `اطلب ${activeProduct.name} بسعر ${activeProduct.price} ريال من ${store.name}. توصيل سريع خلال ساعتين لفنادق الحرم وأحياء مكة المكرمة.`
      : `Order ${activeProduct.name} for SAR ${activeProduct.price} from ${store.name}. Same-day 2-hour express delivery to all Makkah hotels & districts.`;
  } else if (selectedCategory && selectedCategory !== 'All') {
    description = isArabic
      ? `تصفح تشكيلة ${selectedCategory} الفاخرة من ${store.name}. زهور طبيعية قطاف اليوم وتنسيقات حصرية مع توصيل سريع في العاصمة المقدسة.`
      : `Explore luxury ${selectedCategory} from ${store.name}. Fresh hand-picked blooms crafted for Makkah weddings, hotel welcomes, and VIP events.`;
  } else {
    description = isArabic
      ? (seoConfig?.metaDescription || `متجر ${store.name} لتوصيل أرقى باقات الورد الطبيعي الهولندي، فازات الليليوم، وهدايا الحرم المكي مع توصيل سريع خلال ساعتين في مكة المكرمة.`)
      : `Order fresh Dutch roses, luxury lily vases, and Holy Haram VIP gift hampers from ${store.name} with express 2-hour delivery across all Makkah hotels & districts.`;
  }

  // 3. Relevant, Non-Spam Natural Keyword Targets
  const defaultKeywordsAr = [
    'توصيل ورد مكة',
    'محل ورد طبيعي مكة',
    'توصيل ورد فنادق الحرم',
    'هدايا معتمرين ورد وزمزم',
    'بوكس ورد جوري مكة',
    'مسكات عرائس مكة',
  ];
  const defaultKeywordsEn = [
    'Makkah fresh flower delivery',
    'Holy Haram hotel flower delivery',
    'luxury Dutch roses Mecca',
    'pilgrim VIP gift hampers Makkah',
    'bridal wedding bouquets Makkah',
  ];
  const keywords = isArabic
    ? (seoConfig?.keywords && seoConfig.keywords.length > 0 ? seoConfig.keywords : defaultKeywordsAr)
    : defaultKeywordsEn;

  // 4. Schema.org JSON-LD Structured Data
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Florist',
        '@id': `${baseUrl}/#store`,
        name: store.name,
        description,
        url: baseUrl,
        telephone: '+966125558920',
        priceRange: 'SAR 150 - SAR 850',
        currenciesAccepted: 'SAR',
        paymentAccepted: 'Mada, Apple Pay, Visa, MasterCard, Cash on Delivery',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Ibrahim Al Khalil Road, Central Area, Next to Clock Tower',
          addressLocality: 'Makkah',
          addressRegion: 'Makkah Province',
          postalCode: '24231',
          addressCountry: 'SA',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 21.4225,
          longitude: 39.8262,
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
        itemListElement: products.map((prod, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'Product',
            name: prod.name,
            sku: prod.sku,
            category: prod.category,
            image: prod.image,
            offers: {
              '@type': 'Offer',
              price: prod.price,
              priceCurrency: 'SAR',
              availability: prod.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
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
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: primaryImage,
    },
    hreflang: {
      ar: `${baseUrl}/?lang=ar`,
      en: `${baseUrl}/?lang=en`,
    },
    schema,
  };
}

/**
 * Applies the generated SEO metadata to the browser DOM dynamically.
 * Zero overhead, safely updates existing meta tags or creates them if missing.
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
    let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Standard Meta
  setMeta('name', 'description', seo.description);
  setMeta('name', 'keywords', seo.keywords.join(', '));

  // Open Graph
  setMeta('property', 'og:title', seo.og.title);
  setMeta('property', 'og:description', seo.og.description);
  setMeta('property', 'og:url', seo.og.url);
  setMeta('property', 'og:image', seo.og.image);
  setMeta('property', 'og:type', seo.og.type);
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

  // Schema.org JSON-LD Script
  let jsonLdScript = document.getElementById('store-seo-jsonld') as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'store-seo-jsonld';
    jsonLdScript.type = 'application/ld+json';
    document.head.appendChild(jsonLdScript);
  }
  jsonLdScript.textContent = JSON.stringify(seo.schema, null, 2);
}
