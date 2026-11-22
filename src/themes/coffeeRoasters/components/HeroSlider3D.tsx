import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { PRODUCTS } from '../data/products';
import { resolveCoffeeThemeSettings } from '../../settings/coffeeThemeDefaults';
import { coffeeWhatsAppDigits } from '../../settings/coffeeModularSettings';
import { resolveStoreContact } from '../../settings/storeContact';
import { resolveCustomMadeWhatsAppHref } from '../customMadeWhatsApp';
import { learnMoreHref } from '../learnMoreHref';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Headphones,
  Maximize2,
  Gauge,
  Flame,
  Coffee,
  Zap,
  Sparkles,
} from 'lucide-react';

// Crisp, high-resolution original banner images (Full-Bleed Coffee Photography)
import bannerImg1 from '../assets/images/hero_coffee_banner_white_1.jpg';
import bannerImg2 from '../assets/images/hero_coffee_banner_white_2.jpg';
import bannerImg3 from '../assets/images/hero_coffee_banner_white_3.jpg';
import bannerImg4 from '../assets/images/hero_coffee_corner_cabinet_1791217199146.jpg';

// Transparent PNG cutouts for Shop slider variant
import machine5thPng from '../assets/images/flagship_coffee_machine_5th.png';
import machineSilverPng from '../assets/images/product_machine_silver_pro.png';
import machineDripPng from '../assets/images/product_machine_drip_carafe.png';

interface HeroBannerSlide {
  id: string;
  productId: string;
  titleEn: string;
  titleAr: string;
  priceEn: string;
  priceAr: string;
  image: string;
  fallbackImage: string;
  altEn?: string;
  altAr?: string;
  taglineEn?: string;
  taglineAr?: string;
  badgeEn?: string;
  badgeAr?: string;
  buttonTextEn?: string;
  buttonTextAr?: string;
  buttonLink?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  /** Word C-HERO CTA flags from heroBanners */
  buyNowEnabled?: boolean;
  addToCartEnabled?: boolean;
  addToCartEn?: string;
  addToCartAr?: string;
  learnMoreEnabled?: boolean;
  customOrderEnabled?: boolean;
  customOrderEn?: string;
  customOrderAr?: string;
  customOrderUrl?: string;
}

/** DF-01 — merchant image only; never invent stock hero photos. */
const resolveBannerImage = (img: string | undefined): string => {
  if (!img) return '';
  const lower = img.toLowerCase();
  if (lower.startsWith('http') || lower.startsWith('data:') || lower.startsWith('/')) return img;
  if (lower.includes('white_1') || lower.includes('flagship_machine')) return bannerImg1;
  if (lower.includes('white_2') || lower.includes('grinder') || lower.includes('mill')) return bannerImg2;
  if (lower.includes('white_3') || lower.includes('silver_pro') || lower.includes('classic')) return bannerImg3;
  if (lower.includes('cabinet') || lower.includes('corner') || lower.includes('1791217199146')) return bannerImg4;
  return img;
};

interface SlideSpec {
  icon: 'ruler' | 'gauge' | 'flame' | 'coffee' | 'zap';
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
}

interface ShopProductSlide {
  id: string;
  productId: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  priceEn: string;
  priceAr: string;
  image: string;
  dimensionsEn: string;
  dimensionsAr: string;
  specs: SlideSpec[];
}

const SHOP_PRODUCT_SLIDES: ShopProductSlide[] = [
  {
    id: 'shop-slide-1',
    productId: 'hb-h10a-dualboiler',
    titleEn: 'Commercial Barista Station',
    titleAr: 'محطة باريستا تجارية',
    subtitleEn: 'Rotary Dual-Boiler 20-Bar',
    subtitleAr: 'دبل بويلر ٢٠ بار',
    priceEn: '\u20C1 2,450.00',
    priceAr: '2,450.00 \u20C1',
    image: machine5thPng,
    dimensionsEn: 'W: 38cm · H: 36cm · L: 45cm',
    dimensionsAr: 'عرض: 38سم · ارتفاع: 36سم · طول: 45سم',
    specs: [
      { icon: 'gauge', labelEn: 'Pump', labelAr: 'المضخة', valueEn: 'Rotary 20-Bar', valueAr: 'دورانية ٢٠ بار' },
      { icon: 'flame', labelEn: 'System', labelAr: 'النظام', valueEn: 'Dual PID Thermal', valueAr: 'حراري دبل PID' },
      { icon: 'coffee', labelEn: 'Steam', labelAr: 'التبخير', valueEn: 'Cool-Touch Wand', valueAr: 'عصا عازلة' },
    ],
  },
  {
    id: 'shop-slide-2',
    productId: 'hb-barista-silver-pro',
    titleEn: 'Barista Classic Pro',
    titleAr: 'بارستا كلاسيك برو',
    subtitleEn: 'Precision Italian Extraction',
    subtitleAr: 'استخلاص إيطالي دقيق',
    priceEn: '\u20C1 1,499.00',
    priceAr: '1,499.00 \u20C1',
    image: machineSilverPng,
    dimensionsEn: 'W: 32cm · H: 30cm · L: 38cm',
    dimensionsAr: 'عرض: 32سم · ارتفاع: 30سم · طول: 38سم',
    specs: [
      { icon: 'gauge', labelEn: 'Pressure', labelAr: 'الضغط', valueEn: '20-Bar ULKA', valueAr: 'إيطالية ٢٠ بار' },
      { icon: 'zap', labelEn: 'Heating', labelAr: 'التسخين', valueEn: 'Rapid Thermoblock', valueAr: 'ثيرموبلوك سريع' },
      { icon: 'coffee', labelEn: 'Grouphead', labelAr: 'المقبس', valueEn: '58mm Brass', valueAr: '٥٨ مم نحاسي' },
    ],
  },
  {
    id: 'shop-slide-3',
    productId: 'hb-thermal-drip-brewer',
    titleEn: 'Digital Thermal Brewer',
    titleAr: 'ماكينة تقطير رقمية',
    subtitleEn: 'Touch LED Carafe',
    subtitleAr: 'شاشة لمس رقمية',
    priceEn: '⃁ 299.00',
    priceAr: '299.00 ⃁',
    image: machineDripPng,
    dimensionsEn: 'W: 24cm · H: 35cm · L: 26cm',
    dimensionsAr: 'عرض: 24سم · ارتفاع: 35سم · طول: 26سم',
    specs: [
      { icon: 'coffee', labelEn: 'Capacity', labelAr: 'السعة', valueEn: '1.5L Glass Carafe', valueAr: 'إبريق ١.٥ لتر' },
      { icon: 'zap', labelEn: 'Controls', labelAr: 'التحكم', valueEn: 'Touch LED Screen', valueAr: 'شاشة لمس LED' },
      { icon: 'flame', labelEn: 'Warm Plate', labelAr: 'الحرارة', valueEn: '2-Hour Auto Warm', valueAr: 'تسخين ساعتين' },
    ],
  },
];

const splitBannerHeading = (fullText: string, lang: 'EN' | 'AR') => {
  const words = fullText.trim().split(/\s+/);
  if (words.length <= 1) return { boldPart: fullText, lightPart: '' };
  const lightCount =
    lang === 'AR'
      ? words.length > 5
        ? 4
        : Math.floor(words.length / 2)
      : words.length > 4
      ? 3
      : words.length - 1;
  const boldPart = words.slice(0, words.length - lightCount).join(' ');
  const lightPart = words.slice(words.length - lightCount).join(' ');
  return { boldPart, lightPart };
};

export interface HeroSlider3DProps {
  variant?: 'home' | 'shop';
  banners?: Array<Record<string, any>> | null;
}

export const HeroSlider3D: React.FC<HeroSlider3DProps> = ({ variant = 'home', banners = null }) => {
  const { navigateTo, language, addToCart, triggerFlyToCart, products, storeIdentity } = useCart();
  const { activeStore } = useTenant();
  const catalogProducts = Array.isArray(products) ? products : [];

  const [settingsVersion, setSettingsVersion] = useState(0);

  useEffect(() => {
    const handleSync = () => setSettingsVersion((v) => v + 1);
    window.addEventListener('unityteck-theme-settings', handleSync);
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'UNITYTECK_PREVIEW_SYNC') handleSync();
    });
    return () => {
      window.removeEventListener('unityteck-theme-settings', handleSync);
    };
  }, []);

  const themeSettings = useMemo(() => {
    try {
      if (!activeStore?.id) return null;
      return resolveCoffeeThemeSettings(activeStore.id, activeStore);
    } catch {
      return null;
    }
  }, [activeStore, settingsVersion]);

  /** Coffee store contact — identity / API only, never invent or cross-tenant. */
  const storeContact = useMemo(() => {
    if (!activeStore?.id) return null;
    return resolveStoreContact(activeStore.id, activeStore);
  }, [activeStore, settingsVersion, storeIdentity]);

  const coffeeWhatsAppPhone = useMemo(() => {
    // Identity (this store only) wins — modular whatsappNumber is a synced mirror
    return (
      storeContact?.whatsappDigits ||
      coffeeWhatsAppDigits(storeIdentity?.whatsapp || storeIdentity?.phone || '') ||
      coffeeWhatsAppDigits(themeSettings?.customOrder?.whatsappNumber) ||
      coffeeWhatsAppDigits(themeSettings?.heroBanners?.whatsappNumber) ||
      ''
    );
  }, [
    themeSettings?.customOrder?.whatsappNumber,
    themeSettings?.heroBanners?.whatsappNumber,
    storeContact,
    storeIdentity,
  ]);

  // Home slides: Word C-HERO `heroBanners` first, then legacy `slider.slides`. Never flowers/MKS.
  const homeSlides: HeroBannerSlide[] = useMemo(() => {
    const fromBlock = Array.isArray(banners) && banners.length > 0;
    const hero = themeSettings?.heroBanners;
    const heroBanners = (fromBlock ? banners : (hero?.enabled !== false ? hero?.banners : [])) || [];
    const activeHero = heroBanners.filter(
      (b) =>
        b.enabled !== false &&
        !/floral|bouquet|باقات|زهور|holland|makkah|MKS/i.test(
          `${b.titleEn || ''} ${b.titleAr || ''} ${b.descriptionEn || ''} ${b.image || ''}`,
        ),
    );
    if (activeHero.length > 0) {
      return activeHero.map((b, idx) => {
        const currencyCode = b.currency || 'SAR';
        const currencySign = currencyCode === 'SAR' ? '\u20C1' : currencyCode;
        const price = (b.price || '').trim();
        const pickHeroImage = () => {
          if (typeof window === 'undefined') return b.image || b.mobileImage;
          const w = window.innerWidth;
          if (w < 640) return b.mobileImage || b.tabletImage || b.image;
          if (w < 1024) return b.tabletImage || b.image || b.mobileImage;
          return b.image || b.tabletImage || b.mobileImage;
        };
        const image = resolveBannerImage(pickHeroImage());
        return {
          id: b.id || `hero-${idx}`,
          productId: b.productId || '',
          titleEn: b.titleEn || '',
          titleAr: b.titleAr || '',
          priceEn: b.showPrice !== false && price ? `${currencySign} ${price}` : '',
          priceAr: b.showPrice !== false && price ? `${price} \u20C1` : '',
          image,
          fallbackImage: '',
          altEn: b.altEn || b.titleEn || '',
          altAr: b.altAr || b.titleAr || '',
          taglineEn: b.descriptionEn || '',
          taglineAr: b.descriptionAr || '',
          badgeEn: b.promoEn || '',
          badgeAr: b.promoAr || '',
          buttonTextEn: b.buyNowEn || b.learnMoreEn || '',
          buttonTextAr: b.buyNowAr || b.learnMoreAr || '',
          buttonLink: learnMoreHref(b.learnMoreUrl, activeStore?.id || '') || '#products',
          buttonBgColor: undefined,
          buttonTextColor: b.textColor || undefined,
          addToCartEnabled: b.addToCartEnabled !== false,
          addToCartEn: b.addToCartEn,
          addToCartAr: b.addToCartAr,
          customOrderEnabled: b.customOrderEnabled === true,
          customOrderEn: b.customOrderEn,
          customOrderAr: b.customOrderAr,
          customOrderUrl: b.customOrderUrl,
          learnMoreEnabled: b.learnMoreEnabled !== false,
          buyNowEnabled: b.buyNowEnabled !== false,
        } as HeroBannerSlide;
      });
    }

    if (fromBlock && activeHero.length === 0) return [];

    const configuredSlides = themeSettings?.slider?.slides;
    const flowerLeak =
      configuredSlides?.some((cs: any) =>
        /floral|bouquet|باقات|زهور|holland|makkah|MKS/i.test(
          `${cs?.title || ''} ${cs?.titleEn || ''} ${cs?.subtitle || ''} ${cs?.subtitleEn || ''} ${cs?.image || ''}`,
        ),
      ) ?? false;
    if (configuredSlides && configuredSlides.length > 0 && !flowerLeak) {
      return configuredSlides.map((cs, idx) => {
        const safeImage = resolveBannerImage(cs.image);
        return {
          id: cs.id || `slide-${idx}`,
          productId: cs.productId || '',
          titleEn: cs.titleEn || cs.title || '',
          titleAr: cs.titleAr || cs.title || '',
          priceEn: cs.priceEn || '',
          priceAr: cs.priceAr || '',
          image: safeImage,
          fallbackImage: '',
          taglineEn: cs.subtitleEn || cs.subtitle || '',
          taglineAr: cs.subtitleAr || cs.subtitle || '',
          badgeEn: cs.badgeEn || cs.badge || '',
          badgeAr: cs.badgeAr || cs.badge || '',
          buttonTextEn: cs.buttonTextEn || cs.buttonText,
          buttonTextAr: cs.buttonTextAr || cs.buttonText,
          buttonLink: cs.buttonLink || cs.buttonUrl,
          buttonBgColor: cs.buttonBgColor,
          buttonTextColor: cs.buttonTextColor,
        };
      });
    }
    return [];
  }, [themeSettings, banners, activeStore?.id]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [keyCounter, setKeyCounter] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const SLIDE_DURATION = Math.max(3500, (themeSettings?.slider?.transitionDuration || 5) * 1000);

  const isRTL = language === 'AR';
  const visualDirection = isRTL ? -direction : direction;

  // -------------------------------------------------------------
  // VARIANT A: SHOP PAGE SLIDER (3D Cutout Showcase with Specs)
  // -------------------------------------------------------------
  if (variant === 'shop') {
    const shopSlides = SHOP_PRODUCT_SLIDES;
    const activeShopSlide = shopSlides[currentIndex % shopSlides.length];

    const nextShopSlide = () => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % shopSlides.length);
      setKeyCounter((k) => k + 1);
    };

    const prevShopSlide = () => {
      setDirection(-1);
      setCurrentIndex((prev) => (prev - 1 + shopSlides.length) % shopSlides.length);
      setKeyCounter((k) => k + 1);
    };

    const renderSpecIcon = (type: SlideSpec['icon']) => {
      switch (type) {
        case 'ruler':
          return <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.2]" />;
        case 'gauge':
          return <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.2]" />;
        case 'flame':
          return <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.2]" />;
        case 'coffee':
          return <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.2]" />;
        case 'zap':
          return <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.2]" />;
        default:
          return <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.2]" />;
      }
    };

    return (
      <section
        ref={containerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-label={language === 'AR' ? 'شريحة متجر المنتجات' : 'Shop Coffee Slider'}
        className="relative w-full bg-white text-black overflow-hidden select-none border-b border-neutral-100"
      >
        <div className="relative w-full min-h-[500px] sm:min-h-[560px] md:min-h-[580px] lg:min-h-[600px] flex items-center justify-center bg-white px-4 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-8 lg:py-10">
          <div className="w-full max-w-[1360px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-12">
            <div className="lg:col-span-6 flex flex-col items-start text-start space-y-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 bg-neutral-100 px-3 py-1 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>{language === 'AR' ? 'الفئة الرائدة الرسمية' : 'OFFICIAL FLAGSHIP'}</span>
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight leading-tight">
                {language === 'AR' ? activeShopSlide.titleAr : activeShopSlide.titleEn}
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 font-medium max-w-lg">
                {language === 'AR' ? activeShopSlide.subtitleAr : activeShopSlide.subtitleEn}
              </p>
              <div className="text-xl sm:text-2xl font-black text-black">
                {language === 'AR' ? activeShopSlide.priceAr : activeShopSlide.priceEn}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('product-buy', activeShopSlide.productId)}
                  className="px-6 py-2.5 rounded-full bg-black text-white font-bold text-xs sm:text-sm hover:bg-neutral-800 active:scale-95 transition-transform"
                >
                  {language === 'AR' ? 'شراء الآن' : 'Buy Now'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    const prod =
                      catalogProducts.find((p) => p.id === activeShopSlide.productId) ||
                      PRODUCTS.find((p) => p.id === activeShopSlide.productId);
                    if (!prod) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    addToCart(prod, undefined, undefined, undefined, undefined, false);
                    triggerFlyToCart(rect, activeShopSlide.image);
                  }}
                  className="px-5 py-2.5 rounded-full border border-black text-black font-bold text-xs sm:text-sm hover:bg-black/5 active:scale-95 transition-transform inline-flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{language === 'AR' ? 'أضف للسلة' : 'Add to Cart'}</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full pt-4">
                {activeShopSlide.specs.map((sp, idx) => (
                  <div key={idx} className="bg-neutral-50 rounded-2xl p-2.5 text-start border border-neutral-100">
                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-medium">
                      {renderSpecIcon(sp.icon)}
                      <span>{language === 'AR' ? sp.labelAr : sp.labelEn}</span>
                    </div>
                    <div className="text-xs font-bold text-black mt-1">
                      {language === 'AR' ? sp.valueAr : sp.valueEn}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div
              onClick={() => navigateTo('product-buy', activeShopSlide.productId)}
              className="lg:col-span-6 relative w-full h-[280px] sm:h-[380px] md:h-[420px] flex items-center justify-center cursor-pointer"
            >
              <img
                src={activeShopSlide.image}
                alt={language === 'AR' ? activeShopSlide.titleAr : activeShopSlide.titleEn}
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.12)] hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={isRTL ? nextShopSlide : prevShopSlide}
            aria-label={language === 'AR' ? 'السابق' : 'Previous'}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 border border-neutral-200 shadow-md flex items-center justify-center text-black active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={isRTL ? prevShopSlide : nextShopSlide}
            aria-label={language === 'AR' ? 'التالي' : 'Next'}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 border border-neutral-200 shadow-md flex items-center justify-center text-black active:scale-95 transition-transform"
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // VARIANT B: HOME PAGE SLIDER (Exact Original Grand Honor Banner)
  // -------------------------------------------------------------
  const slides = homeSlides;
  const activeSlide = slides.length > 0 ? slides[currentIndex % slides.length] : undefined;

  const isCustomizerPreview =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview') === '1';

  // Preload slide images (only first + next in customizer preview to stay light)
  useEffect(() => {
    const subset = isCustomizerPreview ? slides.slice(0, 2) : slides;
    subset.forEach((slide) => {
      if (!slide.image) return;
      const img = new Image();
      img.src = slide.image;
    });
  }, [slides, isCustomizerPreview]);

  // Auto-play timer (paused inside theme customizer iframe)
  useEffect(() => {
    if (isPaused || isCustomizerPreview || slides.length === 0) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
      setKeyCounter((k) => k + 1);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [isPaused, isCustomizerPreview, currentIndex, slides.length, SLIDE_DURATION]);

  const goToSlide = (targetIndex: number) => {
    if (targetIndex === currentIndex) return;
    setDirection(targetIndex > currentIndex ? 1 : -1);
    setCurrentIndex(targetIndex);
    setKeyCounter((k) => k + 1);
  };

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setKeyCounter((k) => k + 1);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setKeyCounter((k) => k + 1);
  };

  useEffect(() => {
    const onSlide = (event: Event) => {
      const index = (event as CustomEvent<{ index?: number }>).detail?.index;
      if (typeof index !== 'number' || !slides.length) return;
      const next = ((index % slides.length) + slides.length) % slides.length;
      setDirection(next >= currentIndex ? 1 : -1);
      setCurrentIndex(next);
      setKeyCounter((k) => k + 1);
    };
    window.addEventListener('unityteck-hero-slide', onSlide);
    return () => window.removeEventListener('unityteck-hero-slide', onSlide);
  }, [slides.length, currentIndex]);

  // Keyboard navigation support (skipped in the customizer iframe so the editor stays responsive)
  useEffect(() => {
    if (isCustomizerPreview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        language === 'AR' ? prevSlide() : nextSlide();
      } else if (e.key === 'ArrowLeft') {
        language === 'AR' ? nextSlide() : prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [language, slides.length, isCustomizerPreview]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        language === 'AR' ? nextSlide() : prevSlide();
      } else {
        language === 'AR' ? prevSlide() : nextSlide();
      }
    }
    touchStartXRef.current = null;
  };

  const slideVariants: any = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.02,
    }),
    center: {
      x: '0%',
      opacity: 1,
      scale: 1,
      transition: {
        x: { duration: isCustomizerPreview ? 0.18 : 0.75, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: isCustomizerPreview ? 0.18 : 0.8, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: isCustomizerPreview ? 0.12 : 0.45, ease: [0.25, 0.1, 0.25, 1] },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { duration: isCustomizerPreview ? 0.12 : 0.75, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: isCustomizerPreview ? 0.12 : 0.8, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: isCustomizerPreview ? 0.1 : 0.4, ease: [0.42, 0, 1, 1] },
      },
    }),
  };

  if (!activeSlide) {
    return (
      <section className="w-full max-w-full px-4 py-4 text-center text-sm text-neutral-500 bg-neutral-50 border border-dashed border-neutral-200" data-hero-empty="1">
        {language === 'AR' ? 'لا شرائح' : 'No slides'}
      </section>
    );
  }

  const currentTitle = language === 'AR' ? activeSlide.titleAr : activeSlide.titleEn;
  const { boldPart, lightPart } = splitBannerHeading(currentTitle, language);

  // DF-01 — store catalog only (no seed PRODUCTS invent for empty merchant copy)
  const matchedProduct = activeSlide.productId
    ? catalogProducts.find((p) => p.id === activeSlide.productId)
    : undefined;
  const activeTagline =
    language === 'AR'
      ? activeSlide.taglineAr || matchedProduct?.taglineAr || ''
      : activeSlide.taglineEn || matchedProduct?.tagline || '';

  return (
    <section
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label={language === 'AR' ? 'شريحة مجموعة المنتجات' : 'Coffee Collection Slider'}
      data-customize-section="C-HERO"
      className="relative w-full overflow-hidden select-none bg-white text-neutral-900 border-none"
    >
      {/* Responsive Aspect Ratio Stage */}
      <div data-slider-stage="locked" className="theme-slider-stage relative w-full h-[640px] sm:h-[510px] md:h-[550px] lg:h-[600px] xl:h-[640px] bg-white overflow-hidden">
        {/* ========================================================================= */}
        {/* 1. SLIDE BACKGROUND IMAGES + OVERLAY                                       */}
        {/* ========================================================================= */}
        <AnimatePresence initial={false} custom={visualDirection}>
          <motion.div
            key={activeSlide.id}
            custom={visualDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag={isCustomizerPreview ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={isCustomizerPreview ? 0 : 0.16}
            style={isCustomizerPreview ? { pointerEvents: 'auto' } : undefined}
            onDragStart={() => {
              isDraggingRef.current = true;
              setIsPaused(true);
            }}
            onDragEnd={(_, info) => {
              setIsPaused(false);
              setTimeout(() => {
                isDraggingRef.current = false;
              }, 120);

              const threshold = 40;
              const velocity = 350;
              const offset = info.offset.x;
              const speed = info.velocity.x;

              if (offset < -threshold || speed < -velocity) {
                language === 'AR' ? prevSlide() : nextSlide();
              } else if (offset > threshold || speed > velocity) {
                language === 'AR' ? nextSlide() : prevSlide();
              }
            }}
            className={`absolute inset-0 w-full h-full bg-white touch-pan-y ${isCustomizerPreview ? '' : 'cursor-grab active:cursor-grabbing will-change-transform'}`}
          >
            {/* Banner Background Image & Direct Buy Navigation */}
            <div
              onClick={() => {
                if (isDraggingRef.current) return;
                navigateTo('product-buy', activeSlide.productId);
              }}
              className="w-full h-full relative overflow-hidden cursor-pointer group shadow-none bg-white flex flex-col sm:block"
            >
              <img
                src={activeSlide.image}
                alt={language === 'AR' ? (activeSlide.altAr || activeSlide.titleAr) : (activeSlide.altEn || activeSlide.titleEn)}
                fetchPriority="high"
                decoding="async"
                loading="eager"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.dataset.fallbackTried) {
                    target.dataset.fallbackTried = '1';
                    target.src = activeSlide.fallbackImage;
                  }
                }}
                className="order-2 relative z-0 flex-1 min-h-[240px] w-full object-cover object-center sm:absolute sm:inset-0 sm:flex-none sm:min-h-0 sm:h-full sm:object-[75%_center] md:object-[80%_center] lg:object-right shadow-none transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />
              {/* Desktop: light scrim so hero copy stays readable on busy lifestyle photos */}
              <div
                className="hidden sm:block absolute inset-y-0 start-0 w-[min(100%,58%)] max-w-[620px] bg-gradient-to-r from-white via-white/90 to-transparent z-[5] pointer-events-none"
                aria-hidden
              />

              {/* Text, Price and Action Buttons Overlay */}
              <div className="order-1 relative pt-8 pb-5 sm:pt-10 sm:pb-8 md:pt-12 md:pb-10 lg:pt-14 sm:absolute sm:inset-0 z-20 flex items-center pointer-events-none">
                <div
                  dir="ltr"
                  className="w-full max-w-[1360px] mx-auto px-5 xs:px-6 sm:px-12 md:px-16 lg:px-20 py-3 sm:py-5 flex justify-start"
                >
                  <motion.div
                    dir={language === 'AR' ? 'rtl' : 'ltr'}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-full sm:max-w-[380px] md:max-w-[430px] lg:max-w-[460px] text-start pointer-events-auto sm:bg-white/80 sm:backdrop-blur-[2px] sm:rounded-2xl sm:px-4 sm:py-3 md:px-5 md:py-4 shadow-none border-none p-0"
                  >
                    {/* Badge */}
                    {activeSlide.badgeEn && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/5 text-neutral-900 border border-black/10">
                          <Sparkles className="w-3 h-3 text-amber-700" />
                          <span>{language === 'AR' ? activeSlide.badgeAr : activeSlide.badgeEn}</span>
                        </span>
                      </div>
                    )}

                    {/* 1. Title */}
                    <h2
                      className={`honor-heading text-[15px] xs:text-[17px] sm:text-2xl md:text-3xl lg:text-[34px] xl:text-[36px] text-black font-extrabold break-words ${
                        language === 'AR'
                          ? 'leading-[1.28] tracking-normal'
                          : 'leading-[1.18] tracking-[-0.015em]'
                      }`}
                    >
                      <span className="font-black text-black">{boldPart}</span>
                      {lightPart && (
                        <>
                          {' '}
                          <span className="font-semibold text-neutral-900">{lightPart}</span>
                        </>
                      )}
                    </h2>

                    {/* 2. Subtitle / Product Tagline (Clear Specifications Text) */}
                    {activeTagline && (
                      <p className="mt-1.5 xs:mt-2 sm:mt-3 md:mt-3.5 text-[11px] xs:text-xs sm:text-sm font-medium sm:font-semibold text-neutral-600 sm:text-neutral-700 line-clamp-2 leading-relaxed">
                        {activeTagline}
                      </p>
                    )}

                    {/* 3. Price */}
                    <div className="mt-2 xs:mt-2.5 sm:mt-4 flex items-baseline gap-1.5">
                      <span className="text-sm xs:text-base sm:text-lg md:text-xl font-black text-black tracking-tight">
                        {language === 'AR' ? activeSlide.priceAr : activeSlide.priceEn}
                      </span>
                    </div>

                    {/* 4. Action Buttons: [ Buy ] black pill + [ Add to Cart ] outlined + Learn More > */}
                    <div className="mt-2.5 xs:mt-3.5 sm:mt-5 flex items-center gap-1.5 xs:gap-2 sm:gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo('product-buy', activeSlide.productId);
                        }}
                        className="px-3.5 xs:px-4.5 sm:px-7 py-1.5 xs:py-2 sm:py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-[11px] xs:text-xs sm:text-sm rounded-full transition-all duration-200 active:scale-95 cursor-pointer shadow-none inline-flex items-center justify-center shrink-0"
                      >
                        <span>{language === 'AR' ? 'شراء' : 'Buy'}</span>
                      </button>

                      {/* Add to Cart button */}
                      {matchedProduct ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          triggerFlyToCart(rect, activeSlide.image);
                          addToCart(matchedProduct, undefined, undefined, undefined, undefined, false);
                        }}
                        className="group/addcart px-2.5 xs:px-3.5 sm:px-5 py-1.5 xs:py-2 sm:py-2.5 rounded-full border border-black bg-transparent hover:bg-black/5 text-black font-bold text-[11px] xs:text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer inline-flex items-center gap-1.5 shadow-none shrink-0"
                        title={language === 'AR' ? 'أضف للسلة' : 'Add to Cart'}
                      >
                        <ShoppingBag className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.2] shrink-0 transition-transform duration-200 group-hover/addcart:scale-110" />
                        <span className="text-black font-bold">{language === 'AR' ? 'أضف للسلة' : 'Add to Cart'}</span>
                      </button>
                      ) : null}

                      {/* Desktop Learn More button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo('product-detail', activeSlide.productId);
                        }}
                        className="hidden sm:inline-flex group/learn text-xs sm:text-sm font-bold text-black hover:text-neutral-700 transition-colors cursor-pointer items-center gap-1 active:scale-95 text-center shrink-0 ms-1"
                      >
                        <span>{language === 'AR' ? 'تعرف على المزيد' : 'Learn More'}</span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.5] shrink-0 transition-transform duration-200 ${
                            language === 'AR'
                              ? 'rotate-180 group-hover/learn:-translate-x-0.5'
                              : 'group-hover/learn:translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 5. Mobile Learn More & Custom Made Link */}
                    <div className="mt-2 xs:mt-2.5 sm:mt-3.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo('product-detail', activeSlide.productId);
                        }}
                        className="sm:hidden group/learn inline-flex items-center gap-1 text-[11px] font-bold text-neutral-800 hover:text-black transition-colors cursor-pointer active:scale-95"
                      >
                        <span>{language === 'AR' ? 'تعرف على المزيد' : 'Learn More'}</span>
                        <ChevronRight
                          className={`w-3 h-3 text-black stroke-[2.5] shrink-0 transition-transform duration-200 ${
                            language === 'AR'
                              ? 'rotate-180 group-hover/learn:-translate-x-0.5'
                              : 'group-hover/learn:translate-x-0.5'
                          }`}
                        />
                      </button>

                      {/* Custom Made → this coffee store WhatsApp (isolated) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const label =
                            language === 'AR'
                              ? (activeSlide.customOrderAr || 'تفصيل حسب الطلب · تصميم وتنفيذ')
                              : (activeSlide.customOrderEn || 'Custom Made · Design & Build');
                          const href = resolveCustomMadeWhatsAppHref({
                            customOrderUrl: activeSlide.customOrderUrl,
                            whatsappNumber:
                              themeSettings?.customOrder?.whatsappNumber || coffeeWhatsAppPhone,
                            storeWhatsapp: storeContact?.whatsapp || storeIdentity?.whatsapp,
                            storePhone: storeContact?.phone || storeIdentity?.phone,
                            label,
                            language,
                          });
                          if (href) {
                            window.open(href, '_blank', 'noopener,noreferrer');
                            return;
                          }
                          // No WhatsApp configured for this store — custom-order page (no fake number)
                          navigateTo('custom-order');
                        }}
                        className="group/customlink inline-flex items-center gap-1 text-[10.5px] xs:text-[11px] sm:text-sm font-bold text-neutral-900 hover:text-black transition-all cursor-pointer active:scale-95"
                        title={
                          language === 'AR'
                            ? (activeSlide.customOrderAr || 'تفصيل حسب الطلب · تصميم وتنفيذ')
                            : (activeSlide.customOrderEn || 'Custom Made · Design & Build')
                        }
                      >
                        <span className="border-b border-black/60 group-hover/customlink:border-black pb-0.5">
                          {language === 'AR'
                            ? (activeSlide.customOrderAr || 'تفصيل حسب الطلب · تصميم وتنفيذ')
                            : (activeSlide.customOrderEn || 'Custom Made · Design & Build')}
                        </span>
                        <ChevronRight
                          className={`w-3 h-3 text-black stroke-[2.5] shrink-0 transition-transform duration-200 ${
                            language === 'AR'
                              ? 'rotate-180 group-hover/customlink:-translate-x-0.5'
                              : 'group-hover/customlink:translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 2. PREV & NEXT ARROWS (Desktop & Tablet only - swipe on mobile)           */}
        {/* ========================================================================= */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            language === 'AR' ? nextSlide() : prevSlide();
          }}
          aria-label={language === 'AR' ? 'الشريحة السابقة' : 'Previous Slide'}
          className="hidden sm:flex absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-neutral-900 shadow-md items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5 rtl:rotate-180 transition-transform" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            language === 'AR' ? prevSlide() : nextSlide();
          }}
          aria-label={language === 'AR' ? 'الشريحة التالية' : 'Next Slide'}
          className="hidden sm:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-neutral-900 shadow-md items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5 rtl:rotate-180 transition-transform" />
        </button>

        {/* Floating Support → coffee WhatsApp only (hidden when unset) */}
        {coffeeWhatsAppPhone ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const msg =
                language === 'AR'
                  ? 'السلام عليكم، أحتاج دعماً بخصوص المتجر'
                  : 'Hello, I need support regarding the store';
              window.open(
                `https://wa.me/${coffeeWhatsAppPhone}?text=${encodeURIComponent(msg)}`,
                '_blank',
                'noopener,noreferrer',
              );
            }}
            className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-800 hover:text-black cursor-pointer active:scale-95 transition-transform"
            aria-label={language === 'AR' ? 'الدعم عبر واتساب' : 'Support via WhatsApp'}
            title={language === 'AR' ? 'تواصل مع الدعم عبر واتساب' : 'Contact support on WhatsApp'}
          >
            <Headphones className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2]" />
          </button>
        ) : null}

        {/* ========================================================================= */}
        {/* 3. BOTTOM PILL INDICATORS WITH SMOOTH TIMER PROGRESS                      */}
        {/* ========================================================================= */}
        <div className="absolute bottom-2 sm:bottom-3 inset-x-0 z-40 flex items-center justify-center gap-1 pointer-events-auto">
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={`${slide.id || 'slide'}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  goToSlide(idx);
                }}
                aria-label={language === 'AR' ? `الانتقال إلى الشريحة${idx + 1}` : `Go to slide ${idx + 1}`}
                className="group relative flex items-center justify-center min-w-9 min-h-9 cursor-pointer"
              >
                <span
                  className="block h-2 sm:h-2.5 rounded-full overflow-hidden transition-all duration-300 pointer-events-none"
                  style={{
                    width: isActive ? '48px' : '14px',
                    backgroundColor: isActive ? '#D4D4D8' : 'rgba(160, 160, 160, 0.5)',
                  }}
                >
                {isActive && !isCustomizerPreview ? (
                  <motion.div
                    key={`bar-${keyCounter}`}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{
                      duration: SLIDE_DURATION / 1000,
                      ease: 'linear',
                    }}
                    className="h-full rounded-full bg-black"
                  />
                ) : null}
                {isActive && isCustomizerPreview ? <span className="block h-full w-full rounded-full bg-black" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
