import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { PRODUCTS } from '../data/products';
import { readAllThemeSettings } from '../../settings/themeSettingsStore';
import { readStoreIdentity } from '../../settings/storeIdentity';
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
  MessageCircle,
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
  taglineEn?: string;
  taglineAr?: string;
  badgeEn?: string;
  badgeAr?: string;
  buttonTextEn?: string;
  buttonTextAr?: string;
  buttonLink?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

// 1. ORIGINAL COFFEE HOME SLIDES (4 Grand Full-Bleed Banners)
const ORIGINAL_HOME_SLIDES: HeroBannerSlide[] = [
  {
    id: 'banner-flagship-dualboiler',
    productId: 'hb-h10a-dualboiler',
    titleEn: 'HiBrew Dual-Boiler 20-Bar Barista Pro',
    titleAr: 'ماكينة إسبريسو هاي برو الاحترافية 20 بار دبل بويلر',
    priceEn: 'SAR 1,899.00',
    priceAr: '1,899.00 ر.س',
    image: bannerImg1,
    fallbackImage: bannerImg1,
    taglineEn: 'Dual Independent PID Thermoblock · 20-Bar Italian ULKA · 58mm Commercial Group · Microfoam Steam',
    taglineAr: 'نظام دبل بويلر بتحكم حراري رقمي · مضخة إيطالية 20 بار · مقياس ضغط عالي الدقة · بورتافلتر تجاري 58مم',
    badgeEn: 'AI✦ Flagship Choice',
    badgeAr: 'خيار الفلاجشيب AI✦',
  },
  {
    id: 'banner-titanium-grinder',
    productId: 'hb-mill-g5-pro',
    titleEn: 'HiBrew Conical Burr Coffee Mill G5',
    titleAr: 'مطحنة القهوة الكهربائية بتروس تيتانيوم G5',
    priceEn: 'SAR 489.00',
    priceAr: '489.00 ر.س',
    image: bannerImg2,
    fallbackImage: bannerImg2,
    taglineEn: '40mm Titanium CNC Burrs · Stepless Micron Dial · Magnetic Zero-Retention Chute',
    taglineAr: 'تروس تيتانيوم CNC 40 مم مع ضبط ميكروني فائق الدقة ومنفاخ تفريغ البن بالكامل',
    badgeEn: 'Titanium Burrs',
    badgeAr: 'تروس تيتانيوم',
  },
  {
    id: 'banner-barista-classic',
    productId: 'hb-barista-silver-pro',
    titleEn: 'HiBrew Barista Classic Pro 20-Bar',
    titleAr: 'ماكينة إسبريسو هاي برو بارستا كلاسيك 20 بار',
    priceEn: 'SAR 1,499.00',
    priceAr: '1,499.00 ر.س',
    image: bannerImg3,
    fallbackImage: bannerImg3,
    taglineEn: 'Italian 20-Bar ULKA Pump · Precision Thermoblock · Commercial 58mm Group',
    taglineAr: 'مضخة إيطالية 20 بار مع نظام تسخين سريع ومقبس تجاري 58مم لاستخلاص نقي',
    badgeEn: 'Best Seller',
    badgeAr: 'الأكثر مبيعاً',
  },
  {
    id: 'banner-luxury-cabinet',
    productId: 'hb-luxury-corner-station',
    titleEn: 'HiBrew Master Luxury Oak Coffee Corner',
    titleAr: 'ركن ودولاب القهوة الفاخر من خشب البلوط الطبيعي',
    priceEn: 'SAR 2,890.00',
    priceAr: '2,890.00 ر.س',
    image: bannerImg4,
    fallbackImage: bannerImg4,
    taglineEn: 'Natural Solid Oak Wood · Heat-Proof Sintered Stone · Integrated Barista Power Rails',
    taglineAr: 'خشب بلوط أمريكي طبيعي مع سطح حجر مقاوم للحرارة ومسار كهربائي مخفي للباريستا',
    badgeEn: 'Handcrafted',
    badgeAr: 'تفصيل فاخر',
  },
];

// Helper to resolve an image safely (maps broken relative paths to real imported assets)
const resolveBannerImage = (img: string | undefined, index: number): string => {
  if (!img) {
    const fallbacks = [bannerImg1, bannerImg2, bannerImg3, bannerImg4];
    return fallbacks[index % fallbacks.length];
  }
  const lower = img.toLowerCase();
  if (lower.includes('white_1') || lower.includes('flagship_machine')) return bannerImg1;
  if (lower.includes('white_2') || lower.includes('grinder') || lower.includes('mill')) return bannerImg2;
  if (lower.includes('white_3') || lower.includes('silver_pro') || lower.includes('classic')) return bannerImg3;
  if (lower.includes('cabinet') || lower.includes('corner') || lower.includes('1791217199146')) return bannerImg4;
  if (lower.startsWith('http') || lower.startsWith('data:') || lower.startsWith('/')) return img;
  const fallbacks = [bannerImg1, bannerImg2, bannerImg3, bannerImg4];
  return fallbacks[index % fallbacks.length];
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
    priceEn: 'SAR 2,450.00',
    priceAr: '2,450.00 ر.س',
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
    priceEn: 'SAR 1,499.00',
    priceAr: '1,499.00 ر.س',
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
    priceEn: 'SAR 299.00',
    priceAr: '299.00 ر.س',
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
}

export const HeroSlider3D: React.FC<HeroSlider3DProps> = ({ variant = 'home' }) => {
  const { navigateTo, language, addToCart, triggerFlyToCart } = useCart();
  const { activeStore } = useTenant();

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

  const storeIdentity = useMemo(() => {
    return activeStore?.id ? readStoreIdentity(activeStore.id) : null;
  }, [activeStore?.id]);

  const themeSettings = useMemo(() => {
    try {
      const storeId = activeStore?.id || 'store-coffee';
      const fallback = activeStore || { name: 'HiBrew Store' };
      return readAllThemeSettings(storeId, fallback);
    } catch {
      return null;
    }
  }, [activeStore, settingsVersion]);

  // Dynamic slides for Home: ALWAYS safely resolves images with fallback to original banners
  const homeSlides: HeroBannerSlide[] = useMemo(() => {
    const configuredSlides = themeSettings?.slider?.slides;
    if (configuredSlides && configuredSlides.length > 0) {
      return configuredSlides.map((cs, idx) => {
        const fallback = ORIGINAL_HOME_SLIDES[idx % ORIGINAL_HOME_SLIDES.length];
        const safeImage = resolveBannerImage(cs.image, idx);
        return {
          id: cs.id || fallback.id,
          productId: cs.productId || fallback.productId,
          titleEn: cs.titleEn || cs.title || fallback.titleEn,
          titleAr: cs.titleAr || cs.title || fallback.titleAr,
          priceEn: cs.priceEn || fallback.priceEn,
          priceAr: cs.priceAr || fallback.priceAr,
          image: safeImage,
          fallbackImage: fallback.image,
          taglineEn: cs.subtitleEn || cs.subtitle || fallback.taglineEn,
          taglineAr: cs.subtitleAr || cs.subtitle || fallback.taglineAr,
          badgeEn: cs.badgeEn || cs.badge || fallback.badgeEn,
          badgeAr: cs.badgeAr || cs.badge || fallback.badgeAr,
          buttonTextEn: cs.buttonTextEn || cs.buttonText,
          buttonTextAr: cs.buttonTextAr || cs.buttonText,
          buttonLink: cs.buttonLink || cs.buttonUrl,
          buttonBgColor: cs.buttonBgColor,
          buttonTextColor: cs.buttonTextColor,
        };
      });
    }
    return ORIGINAL_HOME_SLIDES;
  }, [themeSettings]);

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
        aria-label="Shop Coffee Slider"
        className="relative w-full bg-white text-black overflow-hidden select-none border-0"
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
                    const rect = e.currentTarget.getBoundingClientRect();
                    triggerFlyToCart(rect, activeShopSlide.image);
                    const prod = PRODUCTS.find((p) => p.id === activeShopSlide.productId) || PRODUCTS[0];
                    addToCart(prod, undefined, undefined, undefined, undefined, false);
                  }}
                  className="px-5 py-2.5 rounded-full border-0 bg-neutral-100 text-black font-bold text-xs sm:text-sm hover:bg-neutral-200 active:scale-95 transition-transform inline-flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{language === 'AR' ? 'أضف للسلة' : 'Add to Cart'}</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full pt-4">
                {activeShopSlide.specs.map((sp, idx) => (
                  <div key={idx} className="bg-neutral-50 rounded-2xl p-2.5 text-start border-0">
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
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  if (!t.dataset.fbDone) {
                    t.dataset.fbDone = '1';
                    t.src = '/src/assets/images/hibrew_h7a_flagship_machine.png';
                  }
                }}
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.12)] hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={isRTL ? nextShopSlide : prevShopSlide}
            aria-label="Previous"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 border-0 shadow-md flex items-center justify-center text-black active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={isRTL ? prevShopSlide : nextShopSlide}
            aria-label="Next"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/95 border-0 shadow-md flex items-center justify-center text-black active:scale-95 transition-transform"
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
  const activeSlide = slides[currentIndex % slides.length];

  // Preload slide images
  useEffect(() => {
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, [slides]);

  // Auto-play timer
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
      setKeyCounter((k) => k + 1);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [isPaused, currentIndex, slides.length, SLIDE_DURATION]);

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

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        language === 'AR' ? prevSlide() : nextSlide();
      } else if (e.key === 'ArrowLeft') {
        language === 'AR' ? nextSlide() : prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [language, slides.length]);

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
        x: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.4, ease: [0.42, 0, 1, 1] },
      },
    }),
  };

  const currentTitle = language === 'AR' ? activeSlide.titleAr : activeSlide.titleEn;
  const { boldPart, lightPart } = splitBannerHeading(currentTitle, language);

  const matchedProduct = PRODUCTS.find((p) => p.id === activeSlide.productId) || PRODUCTS[0];
  const activeTagline =
    language === 'AR'
      ? activeSlide.taglineAr || matchedProduct?.taglineAr
      : activeSlide.taglineEn || matchedProduct?.tagline;

  return (
    <section
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Coffee Collection Slider"
      className="relative w-full overflow-hidden select-none bg-white text-neutral-900 border-none"
    >
      {/* Responsive Aspect Ratio Stage */}
      <div className="relative w-full h-[640px] sm:h-[510px] md:h-[550px] lg:h-[600px] xl:h-[640px] bg-white overflow-hidden">
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
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.16}
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
            className="absolute inset-0 w-full h-full bg-white touch-pan-y cursor-grab active:cursor-grabbing will-change-transform"
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
                alt={language === 'AR' ? activeSlide.titleAr : activeSlide.titleEn}
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
                className="order-2 flex-1 min-h-0 w-full sm:h-full object-contain object-center sm:object-cover sm:object-[75%_center] sm:object-[75%_center] md:object-[80%_center] lg:object-right shadow-none transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />

              {/* Text, Price and Action Buttons Overlay */}
              <div className="order-1 relative pt-5 pb-3 sm:pt-0 sm:pb-0 sm:absolute sm:inset-0 z-20 flex items-center pointer-events-none sm:-translate-y-7 md:-translate-y-9 lg:-translate-y-11">
                <div
                  dir="ltr"
                  className="w-full max-w-[1360px] mx-auto px-4 xs:px-5 sm:px-10 md:px-14 lg:px-16 flex justify-start"
                >
                  <motion.div
                    dir={language === 'AR' ? 'rtl' : 'ltr'}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-full sm:max-w-[380px] md:max-w-[430px] lg:max-w-[460px] text-start pointer-events-auto bg-transparent shadow-none border-none p-0"
                  >
                    {/* Badge */}
                    {activeSlide.badgeEn && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/5 text-neutral-900 border-0">
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          triggerFlyToCart(rect, activeSlide.image);
                          addToCart(matchedProduct, undefined, undefined, undefined, undefined, false);
                        }}
                        className="group/addcart px-2.5 xs:px-3.5 sm:px-5 py-1.5 xs:py-2 sm:py-2.5 rounded-full border-0 bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-[11px] xs:text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer inline-flex items-center gap-1.5 shadow-none shrink-0"
                        title={language === 'AR' ? 'أضف للسلة' : 'Add to Cart'}
                      >
                        <ShoppingBag className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.2] shrink-0 transition-transform duration-200 group-hover/addcart:scale-110" />
                        <span className="text-black font-bold">{language === 'AR' ? 'أضف للسلة' : 'Add to Cart'}</span>
                      </button>

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

                      {/* Custom Made Link */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const customOrderConfig = themeSettings?.customOrder;
                          if (customOrderConfig?.enabled) {
                            navigateTo('custom-order');
                          } else {
                            const rawPhone =
                              customOrderConfig?.whatsappNumber ||
                              storeIdentity?.whatsapp ||
                              (activeStore as any)?.whatsapp ||
                              storeIdentity?.phone ||
                              activeStore?.phone ||
                              '+966549876543';
                            let cleanPhone = rawPhone.replace(/\D/g, '') || '966549876543';
                            if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1);
                            else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) cleanPhone = '966' + cleanPhone;
                            const msg =
                              language === 'AR'
                                ? (customOrderConfig?.whatsappMessageAr ||
                                    'السلام عليكم، أود الاستفسار وطلب تفصيل ركن قهوة مخصص حسب المقاسات والتصميم')
                                : (customOrderConfig?.whatsappMessageEn ||
                                    'Hello, I would like to inquire about placing a custom coffee corner order.');
                            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                          }
                        }}
                        className="group/customlink inline-flex items-center gap-1.5 text-[10.5px] xs:text-[11px] sm:text-sm font-bold text-neutral-900 hover:text-black transition-all cursor-pointer active:scale-95"
                        title={
                          themeSettings?.customOrder?.enabled
                            ? (language === 'AR' ? 'تفصيل حسب الطلب · استوديو التصميم' : 'Custom Made · Design Studio')
                            : (language === 'AR' ? 'تواصل عبر واتساب لطلب تفصيل ركن قهوة' : 'Chat via WhatsApp for Custom Order')
                        }
                      >
                        {!themeSettings?.customOrder?.enabled && (
                          <MessageCircle className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366] shrink-0" />
                        )}
                        <span className="border-b border-black/60 group-hover/customlink:border-black pb-0.5">
                          {themeSettings?.customOrder?.buttonLabelAr && language === 'AR'
                            ? themeSettings.customOrder.buttonLabelAr
                            : themeSettings?.customOrder?.buttonLabelEn && language !== 'AR'
                            ? themeSettings.customOrder.buttonLabelEn
                            : (language === 'AR' ? 'تفصيل حسب الطلب · تصميم وتنفيذ' : 'Custom Made · Design & Build')}
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
          aria-label="Previous Slide"
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
          aria-label="Next Slide"
          className="hidden sm:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-neutral-900 shadow-md items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5 rtl:rotate-180 transition-transform" />
        </button>

        {/* Floating Support Button in Corner */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const rawPhone = activeStore?.phone || '+9668008440443';
            const cleanPhone = rawPhone.replace(/\D/g, '') || '9668008440443';
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
          }}
          className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border-0 shadow-sm flex items-center justify-center text-neutral-800 hover:text-black cursor-pointer active:scale-95 transition-transform"
          aria-label="Support"
          title={language === 'AR' ? 'تواصل مع الدعم الفني' : 'Contact Support'}
        >
          <Headphones className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2]" />
        </button>

        {/* ========================================================================= */}
        {/* 3. BOTTOM PILL INDICATORS WITH SMOOTH TIMER PROGRESS                      */}
        {/* ========================================================================= */}
        <div className="absolute bottom-3 sm:bottom-4.5 inset-x-0 z-30 flex items-center justify-center gap-2 pointer-events-auto">
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id || idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className="group relative flex items-center h-2 sm:h-2.5 rounded-full overflow-hidden transition-all duration-300 cursor-pointer"
                style={{
                  width: isActive ? '48px' : '14px',
                  backgroundColor: isActive ? '#D4D4D8' : 'rgba(160, 160, 160, 0.5)',
                }}
              >
                {isActive && (
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
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
