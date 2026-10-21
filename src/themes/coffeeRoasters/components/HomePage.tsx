import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { readAllThemeSettings } from '../../settings/themeSettingsStore';
import { PRODUCTS, CATEGORIES, HONOR_EVENTS } from '../data/products';
import { HeroSlider3D } from './HeroSlider3D';
import { FlagshipThreeJsSection, HonorAiSparkle } from './FlagshipThreeJsSection';
import { InteractiveBannerCard } from './InteractiveBannerCard';
import { ChevronRight, ChevronLeft, Sparkles, Truck, RotateCcw, ShieldCheck, Headphones, Palette, MessageCircle } from 'lucide-react';

// Authentic, high-resolution original coffee category images
import flagshipFullMachine from '../assets/images/hibrew_flagship_full_machine.jpg';
import heroHibrewEspresso from '../assets/images/hero_hibrew_espresso_1791217182679.jpg';
import grinderMillBanner from '../assets/images/coffee_grinder_mill_banner_1791218928342.jpg';
import saudiNationalDayHero from '../assets/images/saudi_national_day_coffee_hero_1791364192381.jpg';
import coffeeCornerCabinet from '../assets/images/hero_coffee_corner_cabinet_1791217199146.jpg';
import baristaAccessoriesSet from '../assets/images/coffee_barista_accessories_set_1791219198302.jpg';

interface CategoryShowcase {
  featured: {
    productId: string;
    image: string;
    titleEn: string;
    titleAr: string;
    taglineEn: string;
    taglineAr: string;
    price: number;
    originalPrice?: number;
  };
  companionIds: string[];
}

const CATEGORY_SHOWCASE_MAP: Record<string, CategoryShowcase> = {
  all: {
    featured: {
      productId: 'hb-h10a-dualboiler',
      image: flagshipFullMachine,
      titleEn: 'HiBrew Barista Pro™ H7A',
      titleAr: 'هايبرو بارستا برو H7A دبل بويلر',
      taglineEn: 'AI✦ | Smarter, Slimmer & Stronger',
      taglineAr: 'ذكاء اصطناعي ✦ | استخلاص إلكتروني ذكي وضغط 20 بار',
      price: 1899,
      originalPrice: 2299,
    },
    companionIds: ['hb-mill-g5-pro', 'hb-barista-silver-pro', 'hb-h4a-portable-travel', 'hb-classic-duo-espresso'],
  },
  machines: {
    featured: {
      productId: 'hb-h10a-dualboiler',
      image: heroHibrewEspresso,
      titleEn: 'HiBrew Barista Pro™ H7A Dual-Boiler',
      titleAr: 'هايبرو بارستا برو H7A دبل بويلر ٢٠ بار',
      taglineEn: 'AI✦ | Dual Independent PID & 20-Bar Commercial Group',
      taglineAr: 'ذكاء اصطناعي ✦ | دبل بويلر مستقل ونظام استخلاص تجاري ٥٨مم',
      price: 1899,
      originalPrice: 2299,
    },
    companionIds: ['hb-barista-silver-pro', 'hb-smart-capsule-compact', 'hb-thermal-drip-brewer', 'hb-classic-duo-espresso'],
  },
  mills: {
    featured: {
      productId: 'hb-mill-g5-pro',
      image: grinderMillBanner,
      titleEn: 'HiBrew Conical Burr Coffee Mill G5',
      titleAr: 'مطحنة هايبرو المخروطية G5 الاحترافية',
      taglineEn: 'AI✦ | Titanium CNC 40mm Burrs & Stepless Dial',
      taglineAr: 'ذكاء اصطناعي ✦ | تروس تيتانيوم ٤٠مم وضبط دقيق للميكرون',
      price: 749,
      originalPrice: 899,
    },
    companionIds: ['hb-smart-scale-timer', 'hb-v60-complete-kit', 'hb-barista-accessories-kit', 'hb-boltfilter-58-naked'],
  },
  offers: {
    featured: {
      productId: 'hb-h4a-portable-travel',
      image: saudiNationalDayHero,
      titleEn: 'HiBrew H4A 4-in-1 Portable Espresso Maker',
      titleAr: 'هايبرو H4A ماكينة الإسبريسو المتنقلة 4 في 1',
      taglineEn: 'AI✦ | 15-Bar Rich Crema · Car, USB & AC Triple Power',
      taglineAr: 'ذكاء اصطناعي ✦ | كريمة غنية ١٥ بار وثلاثة خيارات تشغيل للسيارة والرحلات',
      price: 329,
      originalPrice: 429,
    },
    companionIds: ['hb-v60-complete-kit', 'hb-barista-silver-pro', 'hb-smart-capsule-compact', 'hb-mill-g5-pro'],
  },
  cabinets: {
    featured: {
      productId: 'hb-nordic-cabinet',
      image: coffeeCornerCabinet,
      titleEn: 'HiBrew Nordic Fluted Oak Coffee Cabinet',
      titleAr: 'دولاب ركن القهوة نورديك خشب البلوط المضلع',
      taglineEn: 'AI✦ | Built-in Cable Routing & Sintered Stone Top',
      taglineAr: 'ذكاء اصطناعي ✦ | تمديدات كابلات مدمجة وسطح حجر إيطالي فاخر',
      price: 1599,
      originalPrice: 1899,
    },
    companionIds: ['hb-luxury-corner-station', 'hb-ceramic-artisan-cups', 'hb-doublewall-paper-cups', 'hb-barista-accessories-kit'],
  },
  accessories: {
    featured: {
      productId: 'hb-barista-accessories-kit',
      image: baristaAccessoriesSet,
      titleEn: 'HiBrew Master Barista 58mm Tool Kit (7 Pcs)',
      titleAr: 'طقم أدوات باريستا الاحترافي 58مم (7 قطع)',
      taglineEn: 'AI✦ | Calibrated Constant-Force Tamper & WDT 0.4mm',
      taglineAr: 'ذكاء اصطناعي ✦ | مكبس معاير بضغط ثابت وموزع إبري دقيق',
      price: 349,
      originalPrice: 429,
    },
    companionIds: ['hb-boltfilter-58-naked', 'hb-ceramic-artisan-cups', 'hb-smart-scale-timer', 'hb-doublewall-paper-cups'],
  },
};

export const HomePage: React.FC = () => {
  const { navigateTo, language, products, storeIdentity } = useCart();
  const { activeStore } = useTenant();
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);
  const mobileCarouselRef = React.useRef<HTMLDivElement>(null);
  const [activeMobileSlide, setActiveMobileSlide] = useState(0);

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
      return readAllThemeSettings(activeStore?.id, activeStore);
    } catch {
      return null;
    }
  }, [activeStore, settingsVersion]);

  // Dynamic products for selected category
  const filteredCategoryProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    if (activeCategoryTab === 'all') return products;
    return products.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const tab = activeCategoryTab.toLowerCase();
      return cat === tab || cat.includes(tab) || ((p as any).tags && (p as any).tags.some((t: string) => t.toLowerCase().includes(tab)));
    });
  }, [products, activeCategoryTab]);

  const defaultShowcase = CATEGORY_SHOWCASE_MAP[activeCategoryTab] || CATEGORY_SHOWCASE_MAP.all;

  const currentShowcase = useMemo(() => {
    if (filteredCategoryProducts.length > 0) {
      const first = filteredCategoryProducts[0];
      return {
        featured: {
          productId: first.id,
          image: first.colors?.[0]?.image || first.images?.[0] || (first as any).image || defaultShowcase.featured.image,
          titleEn: first.name,
          titleAr: first.nameAr || first.name,
          taglineEn: first.tagline || 'Specialty Coffee Gear',
          taglineAr: first.taglineAr || 'معدات القهوة المختصة والتحضير الاحترافي',
          price: first.basePrice,
          originalPrice: first.originalPrice,
        },
        companionIds: filteredCategoryProducts.slice(1, 5).map(p => p.id),
      };
    }
    return defaultShowcase;
  }, [filteredCategoryProducts, defaultShowcase]);

  const companionProducts = useMemo(() => {
    if (filteredCategoryProducts.length > 1) {
      return filteredCategoryProducts.slice(1, 5);
    }
    return currentShowcase.companionIds
      .map(id => (products && products.length > 0 ? products : PRODUCTS).find(p => p.id === id))
      .filter(Boolean) as typeof PRODUCTS;
  }, [filteredCategoryProducts, currentShowcase, products]);

  const totalMobileSlides = Math.max(1 + companionProducts.length + 1, 1); // 1 featured + 4 companions + 1 explore card
  const safeActiveSlide = Math.min(Math.max(activeMobileSlide ?? 0, 0), Math.max(totalMobileSlides - 1, 0));

  // High-performance IntersectionObserver for tracking active slide without layout thrashing
  React.useEffect(() => {
    const container = mobileCarouselRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idxStr = entry.target.getAttribute('data-slide-index');
            if (idxStr !== null) {
              const idx = parseInt(idxStr, 10);
              if (!isNaN(idx)) {
                setActiveMobileSlide(idx);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.55,
      }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [activeCategoryTab, companionProducts.length]);

  // Reset mobile carousel to first slide when tab changes
  React.useEffect(() => {
    setActiveMobileSlide(0);
    if (mobileCarouselRef.current) {
      const firstChild = mobileCarouselRef.current.children[0] as HTMLElement;
      if (firstChild) {
        firstChild.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    }
  }, [activeCategoryTab]);

  const scrollToSlide = (index: number) => {
    if (!mobileCarouselRef.current) return;
    const children = mobileCarouselRef.current.children;
    const clampedIndex = Math.max(0, Math.min(index, children.length - 1));
    const target = children[clampedIndex] as HTMLElement;
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
      setActiveMobileSlide(clampedIndex);
    }
  };

  const nextMobileSlide = () => {
    const nextIdx = (safeActiveSlide + 1) % totalMobileSlides;
    scrollToSlide(nextIdx);
  };

  const prevMobileSlide = () => {
    const prevIdx = (safeActiveSlide - 1 + totalMobileSlides) % totalMobileSlides;
    scrollToSlide(prevIdx);
  };

  const scrollTabs = (dir: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const offset = dir === 'left' ? -220 : 220;
      tabsContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-20 selection:bg-neutral-900 selection:text-white w-full max-w-full overflow-x-clip">
      {/* 1. Fast & Smooth Hero Slider (Honor KV Carousel Style) */}
      <HeroSlider3D variant="home" />

      {/* 2. Key Products Showcase: 3 Large Banners with Equal-Size Images and Scroll Motion (Honor Magic 8 Pro Style) */}
      <FlagshipThreeJsSection />

      {/* 3. Honor-Style "All Products" Equipment Showcase with Responsive Filter Tabs */}
      <section id="all-equipment-section" className="w-full bg-[#F9F9F9] py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center max-w-[1360px] mx-auto mb-8 sm:mb-10">
            <h2 className={`text-3xl sm:text-4xl lg:text-[40px] font-bold text-black text-center ${
              language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
            }`}>
              {language === 'AR' ? 'جميع المنتجات' : 'All Products'}
            </h2>

            {/* Single Row Category Switcher Bar (Exact Honor Reference - Never Multi-Line Wrapping) */}
            <div className="relative w-full max-w-[1280px] mx-auto mt-6 sm:mt-7 flex items-center justify-center gap-3 sm:gap-5 lg:gap-6 px-2 sm:px-4">
              {/* Optional Scroll Left Button */}
              <button
                type="button"
                onClick={() => scrollTabs(language === 'AR' ? 'right' : 'left')}
                aria-label="Scroll Left"
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-neutral-50 text-neutral-600 hover:text-black border border-neutral-200/70 shadow-sm shrink-0 cursor-pointer transition-all active:scale-95 z-10"
              >
                <ChevronLeft className={`w-4 h-4 ${language === 'AR' ? 'rotate-180' : ''}`} />
              </button>

              <div
                ref={tabsContainerRef}
                className="flex items-center justify-start gap-2 sm:gap-3 lg:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-3 sm:px-4 whitespace-nowrap max-w-full min-w-0"
              >
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryTab(cat.id)}
                    className={`transition-all duration-200 cursor-pointer whitespace-nowrap text-sm sm:text-[15px] shrink-0 ${
                      activeCategoryTab === cat.id
                        ? 'bg-white text-black font-semibold px-5 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0 ring-0'
                        : 'bg-transparent hover:text-black text-neutral-500 font-normal px-3 sm:px-4 py-2 sm:py-2.5 rounded-full hover:bg-black/[0.02]'
                    }`}
                  >
                    {language === 'AR' && cat.nameAr ? cat.nameAr : cat.name}
                  </button>
                ))}
              </div>

              {/* Optional Scroll Right Button */}
              <button
                type="button"
                onClick={() => scrollTabs(language === 'AR' ? 'left' : 'right')}
                aria-label="Scroll Right"
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-neutral-50 text-neutral-600 hover:text-black border border-neutral-200/70 shadow-sm shrink-0 cursor-pointer transition-all active:scale-95 z-10"
              >
                <ChevronRight className={`w-4 h-4 ${language === 'AR' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Desktop Layout: Unified Honor Architecture 1+4 Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-5 sm:gap-6 items-stretch w-full max-w-full">
            {/* Left Large Featured Card (Full width & height image with bottom gradient shade, Honor-style) */}
            <div className="lg:col-span-6 bg-white rounded-[28px] sm:rounded-[32px] relative overflow-hidden flex flex-col justify-end transition-all duration-300 text-center w-full min-h-[500px] sm:min-h-[560px] lg:min-h-full border-0 shadow-none hover:shadow-none group">
              {/* Full Width & Height Background Image */}
              <div
                onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden"
              >
                <img
                  src={currentShowcase.featured.image}
                  alt={currentShowcase.featured.titleEn}
                  className="w-full h-full object-cover object-[center_10%] group-hover:scale-104 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                  loading="lazy" decoding="async"
                />
                {/* Bottom Shade / Gradient: smooth fade from transparent down to white */}
                <div className="absolute inset-x-0 bottom-0 h-[62%] sm:h-[58%] bg-gradient-to-t from-white via-white/95 via-white/70 to-transparent pointer-events-none" />
              </div>

              {/* Text Container: Positioned inside the bottom shade */}
              <div className="relative z-10 px-6 pb-6 sm:pb-8 pt-6 text-center flex flex-col items-center justify-end">
                <h3
                  onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                  className={`text-xl sm:text-[22px] font-bold text-neutral-900 cursor-pointer hover:text-black text-center ${
                    language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-snug tracking-[-0.01em]'
                  }`}
                >
                  {language === 'AR' ? currentShowcase.featured.titleAr : currentShowcase.featured.titleEn}
                </h3>
                <p className="text-[13px] text-neutral-600 flex items-center justify-center gap-1 font-normal mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700 inline shrink-0" />
                  <span>
                    {language === 'AR' ? currentShowcase.featured.taglineAr : currentShowcase.featured.taglineEn}
                  </span>
                </p>

                {/* Price: Clean Sans-Serif (Matching Honor SAR 1,899.00) */}
                <div className="flex items-baseline justify-center gap-2 pt-2 pb-1 font-sans">
                  <span className="text-[15px] sm:text-base font-bold text-neutral-900">
                    {language === 'AR' ? `${currentShowcase.featured.price.toLocaleString()}.00 ر.س` : `SAR ${currentShowcase.featured.price.toLocaleString()}.00`}
                  </span>
                  {currentShowcase.featured.originalPrice && (
                    <span className="text-xs text-neutral-400 line-through font-normal">
                      {language === 'AR' ? `${currentShowcase.featured.originalPrice.toLocaleString()}.00 ر.س` : `SAR ${currentShowcase.featured.originalPrice.toLocaleString()}.00`}
                    </span>
                  )}
                </div>

                {/* Buttons (Honor style: solid black pill Buy + Learn More text link) */}
                <div className="flex items-center justify-center gap-6 pt-3">
                  <button
                    onClick={() => navigateTo('product-buy', currentShowcase.featured.productId)}
                    className="px-6 py-2 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-full transition-transform active:scale-95 cursor-pointer shadow-none"
                  >
                    {language === 'AR' ? 'شراء' : 'Buy'}
                  </button>
                  <button
                    onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                    className="text-xs font-normal text-neutral-900 hover:text-black flex items-center gap-0.5 cursor-pointer hover:underline underline-offset-2"
                  >
                    <span>{language === 'AR' ? 'تعرف على المزيد' : 'Learn More'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${language === 'AR' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right 2x2 Grid of 4 Companion Hardware Products */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
              {companionProducts.map(prod => (
                <div
                  key={prod.id}
                  className="bg-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 text-center w-full border-0 shadow-none hover:shadow-none group"
                >
                  <div>
                    {/* Centered Isolated Product PNG (Pure White Background) */}
                    <div
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className="w-full h-40 sm:h-44 flex items-center justify-center mb-2 relative cursor-pointer bg-transparent"
                    >
                      <img
                        src={prod.colors[0]?.image || prod.images[0]}
                        alt={prod.name}
                        className="h-full w-full max-h-[160px] object-contain group-hover:scale-104 transition-transform duration-500 ease-out"
                        referrerPolicy="no-referrer"
                        loading="lazy" decoding="async"
                      />
                    </div>

                    {/* Title: Exactly Honor Reference - font-bold ~700, 15-16px, clean sans-serif */}
                    <h4
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className={`font-bold text-[15px] sm:text-base text-neutral-900 cursor-pointer hover:text-black text-center ${
                        language === 'AR' ? 'leading-[1.4] tracking-normal' : 'leading-snug tracking-[-0.01em]'
                      }`}
                    >
                      {language === 'AR' && prod.nameAr ? prod.nameAr : prod.name}
                    </h4>

                    {/* Tagline: Exactly Honor Reference - font-normal, 13px, neutral-600 */}
                    <p className="text-[12px] sm:text-[13px] text-neutral-600 line-clamp-1 mt-1 text-center font-normal">
                      {language === 'AR' && prod.taglineAr ? prod.taglineAr : prod.tagline}
                    </p>

                    {/* Price: Exactly Honor Reference - SAR X,XXX.00 in font-bold sans-serif */}
                    <div className="pt-2 font-sans text-center flex items-baseline justify-center gap-1">
                      <span className="text-[14px] sm:text-[15px] font-bold text-neutral-900">
                        {language === 'AR' ? `${prod.basePrice.toLocaleString()}.00 ر.س` : `SAR ${prod.basePrice.toLocaleString()}.00`}
                      </span>
                    </div>
                  </div>

                  {/* Clean Links: Exactly Honor Reference - Buy >    Learn More > */}
                  <div className="flex items-center justify-center gap-6 pt-3 mt-1">
                    <button
                      onClick={() => navigateTo('product-buy', prod.id)}
                      className="text-xs font-normal text-neutral-900 hover:text-black flex items-center gap-0.5 cursor-pointer hover:underline underline-offset-2"
                    >
                      <span>{language === 'AR' ? 'شراء' : 'Buy'}</span>
                      <ChevronRight className={`w-3 h-3 ${language === 'AR' ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className="text-xs font-normal text-neutral-900 hover:text-black flex items-center gap-0.5 cursor-pointer hover:underline underline-offset-2"
                    >
                      <span>{language === 'AR' ? 'تعرف على المزيد' : 'Learn More'}</span>
                      <ChevronRight className={`w-3 h-3 ${language === 'AR' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile & Tablet Only: Responsive Touch-Swipe Slider Carousel */}
          <div className="block lg:hidden w-full relative">
            {/* Top Bar: Slide Counter & Prev/Next Arrow Buttons */}
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-xs font-semibold text-neutral-600 bg-white border border-neutral-200/80 px-3.5 py-1 rounded-full shadow-2xs">
                {language === 'AR'
                  ? `المنتج ${safeActiveSlide + 1} من ${totalMobileSlides}`
                  : `Item ${safeActiveSlide + 1} of ${totalMobileSlides}`}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => (language === 'AR' ? nextMobileSlide() : prevMobileSlide())}
                  aria-label="Previous product"
                  className="w-8 h-8 rounded-full bg-white text-neutral-800 hover:text-black border border-neutral-200/80 shadow-2xs flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                >
                  <ChevronLeft className={`w-4 h-4 ${language === 'AR' ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => (language === 'AR' ? prevMobileSlide() : nextMobileSlide())}
                  aria-label="Next product"
                  className="w-8 h-8 rounded-full bg-white text-neutral-800 hover:text-black border border-neutral-200/80 shadow-2xs flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                >
                  <ChevronRight className={`w-4 h-4 ${language === 'AR' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Carousel Swipeable Track with Smooth Hardware-Accelerated CSS Snap */}
            <div
              ref={mobileCarouselRef}
              className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-2 px-1 -mx-1 select-none touch-pan-x overscroll-x-contain"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
              }}
            >
              {/* Slide 1: Featured Flagship Card */}
              <div
                data-slide-index={0}
                className="w-[82vw] xs:w-[84vw] max-w-[320px] shrink-0 snap-center bg-white rounded-[26px] relative overflow-hidden flex flex-col justify-end text-center min-h-[460px] border-0 shadow-xs group select-none"
              >
                <div
                  onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                  className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden"
                >
                  <img
                    src={currentShowcase.featured.image}
                    alt={currentShowcase.featured.titleEn}
                    draggable={false}
                    className="w-full h-full object-cover object-[center_12%] group-hover:scale-104 transition-transform duration-700 ease-out select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                    loading="lazy" decoding="async"
                  />
                  {/* Top Badge: Flagship Highlight */}
                  <div className="absolute top-4 start-4 z-10">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-black bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                      <Sparkles className="w-3 h-3 text-amber-700" />
                      <span>{language === 'AR' ? 'الفئة الرائدة ✦' : 'Flagship ✦'}</span>
                    </span>
                  </div>
                  {/* Bottom Shade Gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-[64%] bg-gradient-to-t from-white via-white/95 via-white/70 to-transparent pointer-events-none" />
                </div>

                {/* Text & Action Buttons */}
                <div className="relative z-10 px-5 pb-6 pt-4 text-center flex flex-col items-center justify-end pointer-events-none">
                  <h3
                    onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                    className={`text-lg font-bold text-neutral-900 cursor-pointer hover:text-black text-center pointer-events-auto ${
                      language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-snug'
                    }`}
                  >
                    {language === 'AR' ? currentShowcase.featured.titleAr : currentShowcase.featured.titleEn}
                  </h3>
                  <p className="text-[12px] text-neutral-600 line-clamp-1 mt-1 text-center font-normal">
                    {language === 'AR' ? currentShowcase.featured.taglineAr : currentShowcase.featured.taglineEn}
                  </p>

                  <div className="flex items-baseline justify-center gap-2 pt-2 pb-1 font-sans">
                    <span className="text-base font-bold text-neutral-900">
                      {language === 'AR' ? `${currentShowcase.featured.price.toLocaleString()}.00 ر.س` : `SAR ${currentShowcase.featured.price.toLocaleString()}.00`}
                    </span>
                    {currentShowcase.featured.originalPrice && (
                      <span className="text-xs text-neutral-400 line-through font-normal">
                        {language === 'AR' ? `${currentShowcase.featured.originalPrice.toLocaleString()}.00 ر.س` : `SAR ${currentShowcase.featured.originalPrice.toLocaleString()}.00`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-5 pt-3 pointer-events-auto">
                    <button
                      onClick={() => navigateTo('product-buy', currentShowcase.featured.productId)}
                      className="px-6 py-2 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-full transition-transform active:scale-95 cursor-pointer shadow-none"
                    >
                      {language === 'AR' ? 'شراء' : 'Buy'}
                    </button>
                    <button
                      onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                      className="text-xs font-normal text-neutral-900 hover:text-black flex items-center gap-0.5 cursor-pointer hover:underline underline-offset-2"
                    >
                      <span>{language === 'AR' ? 'تعرف على المزيد' : 'Learn More'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${language === 'AR' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Slides 2 to 5: Companion Hardware Products */}
              {companionProducts.map((prod, pIdx) => (
                <div
                  key={prod.id}
                  data-slide-index={pIdx + 1}
                  className="w-[82vw] xs:w-[84vw] max-w-[320px] shrink-0 snap-center bg-white rounded-[26px] p-5 flex flex-col justify-between text-center min-h-[460px] border-0 shadow-xs group select-none"
                >
                  <div>
                    {/* Top Tag */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                        {language === 'AR' ? `منتج 0${pIdx + 2}` : `ITEM 0${pIdx + 2}`}
                      </span>
                      {prod.badge && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
                          {language === 'AR' && prod.badgeAr ? prod.badgeAr : prod.badge}
                        </span>
                      )}
                    </div>

                    {/* Isolated Product Image */}
                    <div
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className="w-full h-44 flex items-center justify-center my-2 cursor-pointer bg-neutral-50/50 rounded-2xl p-2 select-none"
                    >
                      <img
                        src={prod.colors[0]?.image || prod.images[0]}
                        alt={prod.name}
                        draggable={false}
                        className="h-full w-full max-h-[160px] object-contain group-hover:scale-106 transition-transform duration-500 ease-out select-none pointer-events-none"
                        referrerPolicy="no-referrer"
                        loading="lazy" decoding="async"
                      />
                    </div>

                    {/* Title */}
                    <h4
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className={`font-bold text-[15px] text-neutral-900 cursor-pointer hover:text-black text-center mt-2 ${
                        language === 'AR' ? 'leading-[1.4] tracking-normal' : 'leading-snug'
                      }`}
                    >
                      {language === 'AR' && prod.nameAr ? prod.nameAr : prod.name}
                    </h4>

                    {/* Tagline */}
                    <p className="text-[12px] text-neutral-600 line-clamp-1 mt-1 text-center font-normal">
                      {language === 'AR' && prod.taglineAr ? prod.taglineAr : prod.tagline}
                    </p>

                    {/* Price */}
                    <div className="pt-2 font-sans text-center flex items-baseline justify-center gap-1">
                      <span className="text-base font-bold text-neutral-900">
                        {language === 'AR' ? `${prod.basePrice.toLocaleString()}.00 ر.س` : `SAR ${prod.basePrice.toLocaleString()}.00`}
                      </span>
                    </div>
                  </div>

                  {/* Clean Links */}
                  <div className="flex items-center justify-center gap-5 pt-4 border-0">
                    <button
                      onClick={() => navigateTo('product-buy', prod.id)}
                      className="px-5 py-2 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-full transition-transform active:scale-95 cursor-pointer shadow-none"
                    >
                      {language === 'AR' ? 'شراء' : 'Buy'}
                    </button>
                    <button
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className="text-xs font-normal text-neutral-900 hover:text-black flex items-center gap-0.5 cursor-pointer hover:underline underline-offset-2"
                    >
                      <span>{language === 'AR' ? 'تعرف على المزيد' : 'Learn More'}</span>
                      <ChevronRight className={`w-3 h-3 ${language === 'AR' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Slide 6: Explore Full Category Card */}
              <div
                data-slide-index={companionProducts.length + 1}
                onClick={() => navigateTo('products')}
                className="w-[82vw] xs:w-[84vw] max-w-[320px] shrink-0 snap-center bg-gradient-to-br from-neutral-900 to-black text-white rounded-[26px] p-6 flex flex-col justify-between items-center text-center min-h-[460px] shadow-sm cursor-pointer group select-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mt-8 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold text-lg text-white">
                    {language === 'AR' ? 'استكشف كافة الموديلات' : 'Explore Full Collection'}
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed max-w-[240px]">
                    {language === 'AR'
                      ? 'تصفح جميع مكائن ومطاحن ومستلزمات هايبرو الرسمية مع الضمان المعتمد.'
                      : 'Discover all HiBrew machines, grinders, and premium barista equipment.'}
                  </p>
                </div>
                <div className="w-full pb-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo('products');
                    }}
                    className="w-full py-3 bg-white text-black font-bold text-xs rounded-full hover:bg-neutral-100 transition-transform active:scale-95 cursor-pointer"
                  >
                    {language === 'AR' ? 'عرض جميع المنتجات' : 'View All Products'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Dots Pagination */}
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {Array.from({ length: totalMobileSlides }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    safeActiveSlide === idx
                      ? 'w-7 bg-black'
                      : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Honor-Style Events & Masterclasses Section */}
      <section className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-6 sm:space-y-8 select-none overflow-hidden">
        <div className="text-center max-w-3xl mx-auto py-2 sm:py-4 space-y-3">
          <span className="inline-block text-xs font-bold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-4 py-1.5 rounded-full">
            {language === 'AR' ? 'ورش العمل والمجتمع' : 'Masterclasses & Community'}
          </span>
          <h2 className={`text-2xl sm:text-4xl font-extrabold text-neutral-900 text-center ${
            language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
          }`}>
            {language === 'AR' ? 'فعاليات ومجتمع هايبرو' : 'HiBrew Events & Masterclasses'}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto">
            {language === 'AR'
              ? 'انضم إلى فعاليات التذوق الاحترافية وورش عمل الباريستا المقامة في الرياض وجدة.'
              : 'Join exclusive barista cupping sessions and technical extraction workshops across Saudi Arabia.'}
          </p>
        </div>

        {/* 1 Large Main Banner + 2 Companion Cards Layout */}
        {(() => {
          const dynamicLinks = themeSettings?.customLinks?.links;
          const link0 = dynamicLinks?.[0];
          const link1 = dynamicLinks?.[1];
          const link2 = dynamicLinks?.[2];

          const resolveLinkImage = (img: string | undefined, fallback: string) => {
            if (!img) return fallback;
            const lower = img.toLowerCase();
            if (lower.startsWith('http') || lower.startsWith('data:') || lower.startsWith('/')) return img;
            return fallback;
          };

          return (
            <div className="space-y-4 sm:space-y-6 w-full max-w-full">
              {/* Main Full-Width Featured Event Banner */}
              <InteractiveBannerCard
                title={link0?.title || (language === 'AR' && HONOR_EVENTS[0].titleAr ? HONOR_EVENTS[0].titleAr : HONOR_EVENTS[0].title)}
                subtitle={link0?.subtitle || (language === 'AR' && HONOR_EVENTS[0].subtitleAr ? HONOR_EVENTS[0].subtitleAr : HONOR_EVENTS[0].subtitle)}
                image={resolveLinkImage(link0?.image, HONOR_EVENTS[0].image)}
                videoUrl="https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-into-a-cup-from-a-coffee-machine-42861-large.mp4"
                size="large"
                badge={link0?.category || (language === 'AR' ? 'ورشة الرياض ٢٠٢٦' : 'Riyadh Masterclass 2026')}
                onClick={() => navigateTo('products')}
                ctaText={link0?.buttonText || (language === 'AR' ? 'حجز المقعد واستكشاف الورشة' : 'Reserve & Learn More')}
              />

              {/* 2 Companion Half-Width Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
                <InteractiveBannerCard
                  title={link1?.title || (language === 'AR' && HONOR_EVENTS[1].titleAr ? HONOR_EVENTS[1].titleAr : HONOR_EVENTS[1].title)}
                  subtitle={link1?.subtitle || (language === 'AR' && HONOR_EVENTS[1].subtitleAr ? HONOR_EVENTS[1].subtitleAr : HONOR_EVENTS[1].subtitle)}
                  image={resolveLinkImage(link1?.image, HONOR_EVENTS[1].image)}
                  size="half"
                  badge={link1?.category || (language === 'AR' ? 'استعراض الاستخلاص' : 'Extraction Demo')}
                  onClick={() => navigateTo('products')}
                  ctaText={link1?.buttonText || (language === 'AR' ? 'تفاصيل الورشة' : 'Learn More')}
                />

                <InteractiveBannerCard
                  title={link2?.title || (language === 'AR' && HONOR_EVENTS[2].titleAr ? HONOR_EVENTS[2].titleAr : HONOR_EVENTS[2].title)}
                  subtitle={link2?.subtitle || (language === 'AR' && HONOR_EVENTS[2].subtitleAr ? HONOR_EVENTS[2].subtitleAr : HONOR_EVENTS[2].subtitle)}
                  image={resolveLinkImage(link2?.image, HONOR_EVENTS[2].image)}
                  size="half"
                  badge={link2?.category || (language === 'AR' ? 'شراكات المحامص' : 'Roastery Partners')}
                  onClick={() => navigateTo('products')}
                  ctaText={link2?.buttonText || (language === 'AR' ? 'تفاصيل المعرض' : 'Explore Event')}
                />
              </div>
            </div>
          );
        })()}
      </section>

      {/* 6. Honor Official Store Trust Bar (Clean Light Theme) */}
      <section className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 overflow-hidden">
        <div className="rounded-3xl bg-[#F8F9FA] p-5 sm:p-8 lg:p-12 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 text-start">
            <div className="flex items-center sm:items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white flex items-center justify-center text-neutral-900 shrink-0 shadow-xs">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                  {language === 'AR' ? 'شحن فوري سريع' : 'Fast Free Express'}
                </h4>
                <p className="text-[11px] sm:text-xs text-neutral-500 line-clamp-2">
                  {language === 'AR' ? 'مجاني للطلبات فوق 200 ر.س' : 'Free on orders above 200 SAR'}
                </p>
              </div>
            </div>

            <div className="flex items-center sm:items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white flex items-center justify-center text-neutral-900 shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                  {language === 'AR' ? 'ضمان الوكيل سنتين' : '2-Year Agency Warranty'}
                </h4>
                <p className="text-[11px] sm:text-xs text-neutral-500 line-clamp-2">
                  {language === 'AR' ? 'صيانة وقطع غيار أصلية' : 'Authorized agency service center'}
                </p>
              </div>
            </div>

            <div className="flex items-center sm:items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white flex items-center justify-center text-neutral-900 shrink-0 shadow-xs">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                  {language === 'AR' ? 'استبدال 14 يوماً' : '14-Day Replacement'}
                </h4>
                <p className="text-[11px] sm:text-xs text-neutral-500 line-clamp-2">
                  {language === 'AR' ? 'إرجاع أو استبدال ميسر' : 'Hassle-free return & exchange'}
                </p>
              </div>
            </div>

            <div className="flex items-center sm:items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white flex items-center justify-center text-neutral-900 shrink-0 shadow-xs">
                <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                  {language === 'AR' ? 'دعم باريستا 24/7' : 'Barista Support 24/7'}
                </h4>
                <p className="text-[11px] sm:text-xs text-neutral-500 line-clamp-2">
                  {language === 'AR' ? 'مساعدة في الاستخلاص والطحن' : 'Expert dialing-in guidance'}
                </p>
              </div>
            </div>

            <div
              onClick={() => {
                const rawPhone =
                  storeIdentity?.whatsapp ||
                  (activeStore as any)?.whatsapp ||
                  storeIdentity?.phone ||
                  activeStore?.phone ||
                  '+966549876543';
                let cleanPhone = rawPhone.replace(/\D/g, '') || '966549876543';
                if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1);
                else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) cleanPhone = '966' + cleanPhone;
                const msg = language === 'AR'
                  ? 'السلام عليكم، أود الاستفسار وطلب تفصيل ركن قهوة مخصص حسب المقاسات والتصميم'
                  : 'Hello, I would like to inquire about placing a custom coffee corner order.';
                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="col-span-2 sm:col-span-1 flex items-center sm:items-start gap-3 sm:gap-4 cursor-pointer group/custom transition-all duration-200 active:scale-95 hover:opacity-90"
              title={language === 'AR' ? 'تواصل عبر واتساب لطلب تفصيل مخصص' : 'Chat via WhatsApp for Custom Order'}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0 shadow-xs group-hover/custom:shadow-sm transition-shadow">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 group-hover/custom:scale-110 transition-transform duration-200 fill-[#25D366]" />
              </div>
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 truncate group-hover/custom:text-[#25D366] transition-colors flex items-center gap-1.5">
                  <span>{language === 'AR' ? 'تصميم وتنفيذ حسب الطلب' : 'Custom Made to Order'}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#25D366]/15 text-[#20ba59]">
                    {language === 'AR' ? 'واتساب' : 'WhatsApp'}
                  </span>
                </h4>
                <p className="text-[11px] sm:text-xs text-neutral-500 line-clamp-2">
                  {language === 'AR' ? 'تواصل مباشرة عبر واتساب لتفصيل ركنك' : 'Direct WhatsApp chat for custom coffee station'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

