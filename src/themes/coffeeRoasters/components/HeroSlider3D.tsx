import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

import bannerImg1 from '../assets/images/hero_coffee_banner_white_1.jpg';
import bannerImg2 from '../assets/images/hero_coffee_banner_white_2.jpg';
import bannerImg3 from '../assets/images/hero_coffee_banner_white_3.jpg';
import bannerImg4 from '../assets/images/hero_coffee_corner_cabinet_1791217199146.jpg';

interface HeroBannerSlide {
  id: string;
  productId: string;
  titleEn: string;
  titleAr: string;
  priceEn: string;
  priceAr: string;
  image: string;
  fallbackImage: string;
  sallaUrl?: string;
}

const HERO_BANNER_SLIDES: HeroBannerSlide[] = [
  {
    id: 'banner-flagship-dualboiler',
    productId: 'hb-h10a-dualboiler',
    titleEn: 'HiBrew Dual-Boiler 20-Bar Barista Pro',
    titleAr: 'ماكينة إسبريسو هاي برو الاحترافية 20 بار دبل بويلر',
    priceEn: 'SAR 1,899.00',
    priceAr: '1,899.00 ر.س',
    image: bannerImg1,
    fallbackImage: './hero_coffee_banner_white_1.jpg',
    sallaUrl: 'https://salla.sa'
  },
  {
    id: 'banner-titanium-grinder',
    productId: 'hb-mill-g5-pro',
    titleEn: 'HiBrew Conical Burr Coffee Mill G5',
    titleAr: 'مطحنة القهوة الكهربائية بتروس تيتانيوم G5',
    priceEn: 'SAR 489.00',
    priceAr: '489.00 ر.س',
    image: bannerImg2,
    fallbackImage: './hero_coffee_banner_white_2.jpg',
    sallaUrl: 'https://salla.sa'
  },
  {
    id: 'banner-barista-classic',
    productId: 'hb-barista-silver-pro',
    titleEn: 'HiBrew Barista Classic Pro 20-Bar',
    titleAr: 'ماكينة إسبريسو هاي برو بارستا كلاسيك 20 بار',
    priceEn: 'SAR 1,499.00',
    priceAr: '1,499.00 ر.س',
    image: bannerImg3,
    fallbackImage: './hero_coffee_banner_white_3.jpg',
    sallaUrl: 'https://salla.sa'
  },
  {
    id: 'banner-luxury-cabinet',
    productId: 'hb-luxury-corner-station',
    titleEn: 'HiBrew Master Luxury Oak Coffee Corner',
    titleAr: 'ركن ودولاب القهوة الفاخر من خشب البلوط الطبيعي',
    priceEn: 'SAR 2,890.00',
    priceAr: '2,890.00 ر.س',
    image: bannerImg4,
    fallbackImage: './hero_coffee_corner_cabinet_1791217199146.jpg',
    sallaUrl: 'https://salla.sa'
  }
];

const splitBannerHeading = (fullText: string, lang: 'EN' | 'AR') => {
  const words = fullText.trim().split(/\s+/);
  if (words.length <= 1) return { boldPart: fullText, lightPart: '' };
  const lightCount = lang === 'AR' 
    ? (words.length > 5 ? 4 : Math.floor(words.length / 2))
    : (words.length > 4 ? 3 : words.length - 1);
  const boldPart = words.slice(0, words.length - lightCount).join(' ');
  const lightPart = words.slice(words.length - lightCount).join(' ');
  return { boldPart, lightPart };
};

export const HeroSlider3D: React.FC = () => {
  const { navigateTo, language, addToCart, triggerFlyToCart } = useCart();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [keyCounter, setKeyCounter] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  const SLIDE_DURATION = 5000; // 5 seconds per slide

  // 1. Image Preloading: Preload next & previous slides for instant rendering
  useEffect(() => {
    HERO_BANNER_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  // 2. Solid, React 19-safe auto-slide timer
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % HERO_BANNER_SLIDES.length);
      setKeyCounter((k) => k + 1);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [isPaused, currentIndex]);

  const goToSlide = (targetIndex: number) => {
    if (targetIndex === currentIndex) return;
    setDirection(targetIndex > currentIndex ? 1 : -1);
    setCurrentIndex(targetIndex);
    setKeyCounter((k) => k + 1);
  };

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % HERO_BANNER_SLIDES.length);
    setKeyCounter((k) => k + 1);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + HERO_BANNER_SLIDES.length) % HERO_BANNER_SLIDES.length);
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
  }, [language]);

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

  const isRTL = language === 'AR';
  const visualDirection = isRTL ? -direction : direction;
  const isDraggingRef = useRef(false);

  const activeSlide = HERO_BANNER_SLIDES[currentIndex];

  // Silky smooth Apple/Honor-grade cubic-bezier fluid motion
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
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.4, ease: [0.42, 0, 1, 1] },
      }
    })
  };

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
      <div className="relative w-full min-h-[460px] h-[460px] xs:h-[490px] sm:h-[510px] md:h-[550px] lg:h-[600px] xl:h-[640px] bg-white overflow-hidden">
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
              className="w-full h-full relative overflow-hidden cursor-pointer group shadow-none bg-white"
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
                  } else if (target.dataset.fallbackTried === '1') {
                    target.dataset.fallbackTried = '2';
                    target.src = `./src/assets/images/${activeSlide.fallbackImage.replace('./', '')}`;
                  }
                }}
                className="w-full h-full object-cover object-[82%_center] sm:object-[75%_center] md:object-[80%_center] lg:object-right shadow-none transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />

              {/* Text, Price and Action Buttons Overlay */}
              <div className="absolute inset-0 z-20 flex items-center pointer-events-none -translate-y-4 sm:-translate-y-7 md:-translate-y-9 lg:-translate-y-11">
                <div 
                  dir="ltr"
                  className="w-full max-w-[1360px] mx-auto px-4 xs:px-5 sm:px-10 md:px-14 lg:px-16 flex justify-start"
                >
                  <motion.div 
                    dir={language === 'AR' ? 'rtl' : 'ltr'}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-[215px] xs:max-w-[245px] sm:max-w-[380px] md:max-w-[430px] lg:max-w-[460px] text-start pointer-events-auto bg-transparent shadow-none border-none p-0"
                  >
                    {/* 1. Title */}
                    {(() => {
                      const currentTitle = language === 'AR' ? activeSlide.titleAr : activeSlide.titleEn;
                      const { boldPart, lightPart } = splitBannerHeading(currentTitle, language);
                      return (
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
                      );
                    })()}

                    {/* 2. Subtitle / Product Tagline (Clear Specifications Text) */}
                    {(() => {
                      const product = PRODUCTS.find((p) => p.id === activeSlide.productId);
                      const tagline = language === 'AR' ? product?.taglineAr : product?.tagline;
                      if (!tagline) return null;
                      return (
                        <p className="mt-1.5 xs:mt-2 sm:mt-3 md:mt-3.5 text-[11px] xs:text-xs sm:text-sm font-medium sm:font-semibold text-neutral-600 sm:text-neutral-700 line-clamp-2 leading-relaxed">
                          {tagline}
                        </p>
                      );
                    })()}

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
                        className="px-3 xs:px-4 sm:px-6 py-1.5 xs:py-2 sm:py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-[11px] xs:text-xs sm:text-sm rounded-full transition-all duration-200 active:scale-95 cursor-pointer shadow-sm inline-flex items-center justify-center shrink-0"
                      >
                        <span>{language === 'AR' ? 'شراء' : 'Buy'}</span>
                      </button>

                      {/* Add to Cart Button with Flying Animation */}
                      {(() => {
                        const product = PRODUCTS.find((p) => p.id === activeSlide.productId) || PRODUCTS[0];
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              triggerFlyToCart(rect, activeSlide.image || product.colors[0]?.image);
                              addToCart(product, undefined, undefined, undefined, undefined, false);
                            }}
                            className="group/addcart px-2.5 xs:px-3.5 sm:px-5 py-1.5 xs:py-2 sm:py-2.5 rounded-full border border-black bg-transparent hover:bg-black/5 text-black font-bold text-[11px] xs:text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer inline-flex items-center gap-1.5 shadow-none shrink-0"
                            title={language === 'AR' ? 'أضف للسلة' : 'Add to Cart'}
                          >
                            <ShoppingBag className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-black stroke-[2.2] shrink-0 transition-transform duration-200 group-hover/addcart:scale-110" />
                            <span className="text-black font-bold">{language === 'AR' ? 'أضف للسلة' : 'Add to Cart'}</span>
                          </button>
                        );
                      })()}

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
                      {/* On Mobile: compact Learn More link */}
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
                          navigateTo('custom-order');
                        }}
                        className="group/customlink inline-flex items-center gap-1 text-[10.5px] xs:text-[11px] sm:text-sm font-bold text-neutral-900 hover:text-black transition-all cursor-pointer active:scale-95"
                        title={language === 'AR' ? 'تفصيل حسب الطلب · تصميم وتنفيذ' : 'Custom Made · Design & Build'}
                      >
                        <span className="border-b border-black/60 group-hover/customlink:border-black pb-0.5">
                          {language === 'AR' ? 'تفصيل حسب الطلب · تصميم وتنفيذ' : 'Custom Made · Design & Build'}
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
          onClick={(e) => {
            e.stopPropagation();
            language === 'AR' ? nextSlide() : prevSlide();
          }}
          aria-label="Previous Slide"
          className="hidden sm:flex absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-neutral-900 shadow-md items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5 transition-transform" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            language === 'AR' ? prevSlide() : nextSlide();
          }}
          aria-label="Next Slide"
          className="hidden sm:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-neutral-900 shadow-md items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5 transition-transform" />
        </button>

        {/* ========================================================================= */}
        {/* 3. BOTTOM PILL INDICATORS WITH SMOOTH TIMER PROGRESS                      */}
        {/* ========================================================================= */}
        <div className="absolute bottom-3 sm:bottom-4.5 inset-x-0 z-30 flex items-center justify-center gap-2 pointer-events-auto">
          {HERO_BANNER_SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className="group relative flex items-center h-2 sm:h-2.5 rounded-full overflow-hidden transition-all duration-300 cursor-pointer"
                style={{
                  width: isActive ? '48px' : '14px',
                  backgroundColor: isActive ? '#D4D4D8' : 'rgba(160, 160, 160, 0.5)'
                }}
              >
                {isActive && (
                  <motion.div
                    key={`bar-${keyCounter}`}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{
                      duration: SLIDE_DURATION / 1000,
                      ease: 'linear'
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
