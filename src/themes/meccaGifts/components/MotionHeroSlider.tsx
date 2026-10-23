import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, Edit3, Image as ImageIcon } from 'lucide-react';
import { readAllThemeSettings } from '../../settings/themeSettingsStore';

export interface HeroSlideItem {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  primaryBtn: string;
  primaryBtnAr: string;
  primaryLink?: string;
  secondaryBtn?: string;
  secondaryBtnAr?: string;
  secondaryLink?: string;
  image: string;
  category?: string;
}

export const DEFAULT_FLOWER_SLIDES: HeroSlideItem[] = [
  {
    id: 'slide-1',
    title: 'Make Every Moment More Special',
    titleAr: 'اجعل كل لحظة أكثر تميزاً',
    subtitle: 'Fresh flowers & premium gifts for your loved ones',
    subtitleAr: 'زهور طبيعية وهدايا فاخرة لمن تحب',
    primaryBtn: 'Shop Now',
    primaryBtnAr: 'تسوق الآن',
    primaryLink: '#catalog',
    image: '/images/hadaya_hero_penthouse_1791216115794.jpg',
    category: 'باقات الورود الطبيعية',
  },
  {
    id: 'slide-2',
    title: 'Your Special Moments Our Beautiful Creations',
    titleAr: 'لحظاتكم الخاصة وإبداعاتنا الجميلة',
    subtitle: 'Fresh flowers & premium gifts for every occasion',
    subtitleAr: 'زهور طبيعية وهدايا راقية لكل مناسبة',
    primaryBtn: 'Shop Now',
    primaryBtnAr: 'تسوق الآن',
    primaryLink: '#catalog',
    secondaryBtn: 'Learn More',
    secondaryBtnAr: 'اعرف المزيد',
    secondaryLink: '#about',
    image: '/images/hadaya_luxury_master_hero_1791217937117.jpg',
    category: 'ورد وشوكولاتة بلجيكية فاخرة',
  },
  {
    id: 'slide-3',
    title: 'Unforgettable Memories with Fine Floristry',
    titleAr: 'ذكريات لا تُنسى بأرقى تنسيقات الزهور',
    subtitle: 'Imported long-stem Dutch roses delivered chilled to your doorstep',
    subtitleAr: 'جوري هولندي فاخر وتوصيل مبرد عاجل حتى باب منزلك',
    primaryBtn: 'Shop Now',
    primaryBtnAr: 'تسوق الآن',
    primaryLink: '#catalog',
    image: '/images/hadaya_royal_wedding_flowers_1791300194084.jpg',
    category: 'باقات فاخرة',
  },
];

export const DEFAULT_COFFEE_SLIDES: HeroSlideItem[] = [
  {
    id: 'slide-cof-1',
    title: 'Artisan Roasting & Specialty Coffee Experience',
    titleAr: 'فن التحميص وتجربة القهوة المختصة الفاخرة',
    subtitle: 'Single-origin beans roasted to perfection for true coffee connoisseurs',
    subtitleAr: 'محاصيل بن مختارة من مزارع عالمية ومحمصة بطرق حرفية لخبراء التذوق',
    primaryBtn: 'Shop Beans',
    primaryBtnAr: 'تسوق المحاصيل',
    primaryLink: '#catalog',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80',
    category: 'حبوب القهوة المختصة',
  },
  {
    id: 'slide-cof-2',
    title: 'Precision Pour-Over Tools & Espresso Gear',
    titleAr: 'أدوات ومعدات التقطير الاحترافية V60 والإسبريسو',
    subtitle: 'Everything you need to craft the perfect barista-grade cup at home',
    subtitleAr: 'كل ما يحتاجه الباريستا المنزلي لتحضير الكوب المثالي كل صباح',
    primaryBtn: 'Explore Tools',
    primaryBtnAr: 'استكشف الأدوات',
    primaryLink: '#catalog',
    secondaryBtn: 'Learn More',
    secondaryBtnAr: 'اعرف المزيد',
    secondaryLink: '#about',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80',
    category: 'أدوات التحضير المقطرة',
  },
  {
    id: 'slide-cof-3',
    title: 'Rare Colombian & Ethiopian Micro-Lots',
    titleAr: 'محاصيل كولومبيا وإثيوبيا بإيحاءات زهرية وفاكهية',
    subtitle: 'Exquisite aromatic profiles and sensory tasting journeys in every sip',
    subtitleAr: 'نوتات عطرية فريدة وتجربة حسية تأسر الحواس مع كل رشفة',
    primaryBtn: 'Order Now',
    primaryBtnAr: 'اطلب الآن',
    primaryLink: '#catalog',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1600&q=80',
    category: 'حبوب القهوة المختصة',
  },
];

export interface MotionHeroSliderProps {
  isBuilderMode?: boolean;
  slides?: HeroSlideItem[];
  activeSlideIndex?: number;
  selectedSubElement?: 'slide' | 'title' | 'subtitle' | 'btn1' | 'btn2' | 'image' | null;
  onSelectSubElement?: (subKey: 'slide' | 'title' | 'subtitle' | 'btn1' | 'btn2' | 'image', slideIdx: number) => void;
  onSlideChange?: (idx: number) => void;
}

export const MotionHeroSlider: React.FC<MotionHeroSliderProps> = ({
  isBuilderMode = false,
  slides: customSlides,
  activeSlideIndex,
  selectedSubElement,
  onSelectSubElement,
  onSlideChange,
}) => {
  const { language, setCurrentPage, setSelectedCategory } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));

  const [localSlide, setLocalSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleSync = () => setTick((t) => t + 1);
    window.addEventListener('unityteck-theme-settings', handleSync);
    window.addEventListener('unityteck-data', handleSync);
    return () => {
      window.removeEventListener('unityteck-theme-settings', handleSync);
      window.removeEventListener('unityteck-data', handleSync);
    };
  }, []);

  const dynamicThemeSlides: HeroSlideItem[] | null = useMemo(() => {
    try {
      const cfg: any = readAllThemeSettings(activeStore.id, activeStore);
      const sliderAny = cfg?.slider;
      if (sliderAny && (sliderAny.enabled ?? true) && sliderAny.slides && sliderAny.slides.length > 0) {
        return (sliderAny.slides as any[]).map((s: any, idx: number): HeroSlideItem => ({
          id: s.id || `custom-slide-${idx}`,
          title: s.title || '',
          titleAr: s.title || '',
          subtitle: s.subtitle || '',
          subtitleAr: s.subtitle || '',
          primaryBtn: s.buttonText || (isAr ? 'تسوق الآن' : 'Shop Now'),
          primaryBtnAr: s.buttonText || 'تسوق الآن',
          primaryLink: s.link || s.buttonLink || '#catalog',
          secondaryBtn: s.secondaryBtn,
          secondaryBtnAr: s.secondaryBtnAr,
          secondaryLink: s.secondaryLink,
          image: (() => {
            const rawImg = s.image || '';
            let cleanImg = rawImg.startsWith('/src/assets/images/') ? rawImg.replace('/src/assets/images/', '/images/') : rawImg;
            if (cleanImg.includes('photo-1518709268805-4e9042af9f23')) {
              cleanImg = '/images/hadaya_luxury_master_hero_1791217937117.jpg';
            } else if (cleanImg.includes('photo-1525310072745-f49212b5ac6d')) {
              cleanImg = '/images/hadaya_royal_wedding_flowers_1791300194084.jpg';
            }
            return cleanImg || (isCoffee ? '/hero_coffee_banner_white_1.jpg' : '/images/hadaya_luxury_master_hero_1791217937117.jpg');
          })(),
          category: isCoffee ? 'حبوب القهوة المختصة' : 'باقات الورود الطبيعية',
        }));
      }
    } catch {}
    return null;
  }, [activeStore.id, activeStore, tick, isAr, isCoffee]);

  const defaultSlides = useMemo(() => (isCoffee ? DEFAULT_COFFEE_SLIDES : DEFAULT_FLOWER_SLIDES), [isCoffee]);
  const slides = customSlides && customSlides.length > 0 
    ? customSlides 
    : (dynamicThemeSlides && dynamicThemeSlides.length > 0 ? dynamicThemeSlides : defaultSlides);

  const currentSlide = activeSlideIndex !== undefined && activeSlideIndex !== null ? activeSlideIndex : localSlide;
  const totalSlides = slides.length;
  const activeSlide: any = slides[currentSlide] || slides[0];

  const handleSetSlide = (idx: number) => {
    setLocalSlide(idx);
    onSlideChange?.(idx);
  };

  const nextSlide = useCallback(() => {
    const n = (currentSlide + 1) % totalSlides;
    handleSetSlide(n);
  }, [currentSlide, totalSlides]);

  const prevSlide = useCallback(() => {
    const p = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
    handleSetSlide(p);
  }, [currentSlide, totalSlides]);

  useEffect(() => {
    if (isBuilderMode || isPaused) return;
    const timer = setInterval(nextSlide, 7000);
    return () => clearInterval(timer);
  }, [isBuilderMode, isPaused, nextSlide]);

  const handleAction = (categoryName?: string) => {
    if (isBuilderMode) return;
    if (categoryName) {
      setSelectedCategory(categoryName);
    }
    setCurrentPage('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      onMouseEnter={() => !isBuilderMode && setIsPaused(true)}
      onMouseLeave={() => !isBuilderMode && setIsPaused(false)}
      aria-label="Hero Luxury Floral Slider"
      className="relative w-full h-[460px] sm:h-[520px] md:h-[600px] lg:h-[640px] overflow-hidden bg-[#0d2117] text-white select-none group/slider"
    >
      {/* Background Slides */}
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={slide.id || `slide-${index}`}
            aria-hidden={!isActive}
            onClick={(e) => {
              if (isBuilderMode) {
                e.stopPropagation();
                onSelectSubElement?.('image', currentSlide);
              }
            }}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            } ${isBuilderMode ? 'cursor-pointer' : ''}`}
          >
            <div className={`w-full h-full transform transition-transform duration-1000 ${isActive ? 'scale-105' : 'scale-100'}`}>
              <img
                src={slide.image}
                alt={isAr ? slide.titleAr : slide.title}
                className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.02]"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
            {/* Subtle Gradient Scrim for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent rtl:bg-gradient-to-l rtl:from-black/75 rtl:via-black/35 rtl:to-transparent" />

            {/* Builder Mode Image Edit Badge */}
            {isBuilderMode && isActive && (
              <div className="absolute top-4 start-4 z-30 opacity-0 group-hover/slider:opacity-100 transition-opacity pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg border border-white/20">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? `خلفية الشريحة (${currentSlide + 1}) - انقر للتغيير` : `Slide (${currentSlide + 1}) Photo - Click to change`}</span>
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Hero Content (With Granular Click-to-Edit for Title, Subtitle, and Buttons) */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-6 sm:px-10 lg:px-14 flex items-center">
        <div className="max-w-xl space-y-4 sm:space-y-5 text-start">
          
          {/* 1. Main Heading (Title) */}
          <div
            onClick={(e) => {
              if (isBuilderMode) {
                e.stopPropagation();
                onSelectSubElement?.('title', currentSlide);
              }
            }}
            className={`relative group/elem-title rounded-xl transition-all ${
              isBuilderMode ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400 p-1.5 -m-1.5' : ''
            } ${isBuilderMode && selectedSubElement === 'title' ? 'ring-2 ring-indigo-400 bg-black/40 p-1.5 -m-1.5 shadow-lg' : ''}`}
          >
            {isBuilderMode && (
              <div
                className={`absolute -top-3 start-0 z-30 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 shadow-sm transition-all pointer-events-none ${
                  selectedSubElement === 'title'
                    ? 'bg-indigo-600 text-white opacity-100 ring-1 ring-white'
                    : 'bg-slate-900/90 text-white opacity-0 group-hover/elem-title:opacity-100'
                }`}
              >
                <Edit3 className="w-3 h-3 text-amber-400" />
                <span>{isAr ? 'العنوان الرئيسي' : 'Heading'}</span>
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white leading-tight drop-shadow-md">
              {isAr ? activeSlide.titleAr : activeSlide.title}
            </h1>
          </div>

          {/* 2. Subtitle / Description */}
          <div
            onClick={(e) => {
              if (isBuilderMode) {
                e.stopPropagation();
                onSelectSubElement?.('subtitle', currentSlide);
              }
            }}
            className={`relative group/elem-sub rounded-xl transition-all ${
              isBuilderMode ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400 p-1.5 -m-1.5' : ''
            } ${isBuilderMode && selectedSubElement === 'subtitle' ? 'ring-2 ring-indigo-400 bg-black/40 p-1.5 -m-1.5 shadow-lg' : ''}`}
          >
            {isBuilderMode && (
              <div
                className={`absolute -top-3 start-0 z-30 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 shadow-sm transition-all pointer-events-none ${
                  selectedSubElement === 'subtitle'
                    ? 'bg-indigo-600 text-white opacity-100 ring-1 ring-white'
                    : 'bg-slate-900/90 text-white opacity-0 group-hover/elem-sub:opacity-100'
                }`}
              >
                <Edit3 className="w-3 h-3 text-amber-400" />
                <span>{isAr ? 'الوصف التوضيحی' : 'Subtitle'}</span>
              </div>
            )}
            <p className="text-sm sm:text-base md:text-lg text-[#ded8cb] font-light max-w-md drop-shadow">
              {isAr ? activeSlide.subtitleAr : activeSlide.subtitle}
            </p>
          </div>

          {/* 3. Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {/* Primary Button */}
            <div
              onClick={(e) => {
                if (isBuilderMode) {
                  e.stopPropagation();
                  onSelectSubElement?.('btn1', currentSlide);
                }
              }}
              className={`relative group/elem-btn1 rounded-full transition-all ${
                isBuilderMode ? 'cursor-pointer hover:ring-2 hover:ring-amber-400' : ''
              } ${isBuilderMode && selectedSubElement === 'btn1' ? 'ring-3 ring-amber-400 ring-offset-2 ring-offset-black/40' : ''}`}
            >
              {isBuilderMode && (
                <div
                  className={`absolute -top-3 start-1/2 -translate-x-1/2 z-30 px-2 py-0.2 rounded text-[9px] font-black flex items-center gap-1 shadow-sm transition-all pointer-events-none ${
                    selectedSubElement === 'btn1'
                      ? 'bg-amber-400 text-slate-950 opacity-100 ring-1 ring-white font-extrabold'
                      : 'bg-slate-900/90 text-white opacity-0 group-hover/elem-btn1:opacity-100'
                  }`}
                >
                  <Edit3 className="w-2.5 h-2.5 text-amber-400" />
                  <span>{isAr ? 'الزر الأول' : 'Btn 1'}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleAction(activeSlide.category)}
                className="px-6 sm:px-8 py-3 rounded-full bg-[#f3e5c8] hover:bg-[#d4af37] text-[#102a1c] font-bold text-xs sm:text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{isAr ? activeSlide.primaryBtnAr : activeSlide.primaryBtn}</span>
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Secondary Button */}
            {activeSlide.secondaryBtn && (
              <div
                onClick={(e) => {
                  if (isBuilderMode) {
                    e.stopPropagation();
                    onSelectSubElement?.('btn2', currentSlide);
                  }
                }}
                className={`relative group/elem-btn2 rounded-full transition-all ${
                  isBuilderMode ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400' : ''
                } ${isBuilderMode && selectedSubElement === 'btn2' ? 'ring-3 ring-indigo-400 ring-offset-2 ring-offset-black/40' : ''}`}
              >
                {isBuilderMode && (
                  <div
                    className={`absolute -top-3 start-1/2 -translate-x-1/2 z-30 px-2 py-0.2 rounded text-[9px] font-black flex items-center gap-1 shadow-sm transition-all pointer-events-none ${
                      selectedSubElement === 'btn2'
                        ? 'bg-indigo-600 text-white opacity-100 ring-1 ring-white font-extrabold'
                        : 'bg-slate-900/90 text-white opacity-0 group-hover/elem-btn2:opacity-100'
                    }`}
                  >
                    <Edit3 className="w-2.5 h-2.5 text-amber-400" />
                    <span>{isAr ? 'الزر الثاني' : 'Btn 2'}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleAction()}
                  className="px-6 sm:px-8 py-3 rounded-full bg-black/40 hover:bg-black/60 text-white font-bold text-xs sm:text-sm border border-white/30 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>{isAr ? activeSlide.secondaryBtnAr : activeSlide.secondaryBtn}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prev / Next Navigation Arrows */}
      <button
        type="button"
        onClick={(e) => {
          if (isBuilderMode) e.stopPropagation();
          prevSlide();
          if (isBuilderMode) onSelectSubElement?.('slide', currentSlide === 0 ? totalSlides - 1 : currentSlide - 1);
        }}
        aria-label="Previous slide"
        className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-6 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/35 hover:bg-[#d4af37] text-white hover:text-[#102a1c] border border-white/20 hover:border-[#d4af37] shadow-lg backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          if (isBuilderMode) e.stopPropagation();
          nextSlide();
          if (isBuilderMode) onSelectSubElement?.('slide', (currentSlide + 1) % totalSlides);
        }}
        aria-label="Next slide"
        className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/35 hover:bg-[#d4af37] text-white hover:text-[#102a1c] border border-white/20 hover:border-[#d4af37] shadow-lg backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5 stroke-[2.2]" />
      </button>

      {/* Slider Dots / Slide Selector */}
      <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              if (isBuilderMode) e.stopPropagation();
              handleSetSlide(idx);
              if (isBuilderMode) onSelectSubElement?.('slide', idx);
            }}
            aria-label={`Slide ${idx + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentSlide
                ? 'w-8 bg-[#f3e5c8] shadow-md ring-2 ring-white/50'
                : 'w-2.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
};
