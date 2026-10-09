import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { MECCA_WHATSAPP } from '../data/mockData';
import { Product } from '../types';

export const MotionHeroSlider: React.FC = () => {
  const { language, addToCart } = useApp();
  const isAr = language === 'ar';

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);

  // 4 High-Resolution Royal Luxury Floral Masterpieces (Clean, concise, image-focused)
  const slides = [
    {
      id: 'slide-1',
      productId: 'nat-1',
      title: 'باقة الجوري المخملي الملكية',
      titleEn: 'Royal Velvet Crimson Roses',
      subtitle: '50 وردة جوري إكوادوري مخملية مع تغليف ملكي فاخر',
      subtitleEn: '50 premium long-stem Ecuadorian red roses in bespoke noir wrap',
      badge: 'الأكثر طلباً',
      badgeEn: 'Best Seller',
      price: 499,
      image: '/src/assets/images/hadaya_royal_wedding_flowers_1791300194084.jpg',
      category: 'باقات الورود الطبيعية',
      categoryEn: 'Natural Flower Bouquets'
    },
    {
      id: 'slide-2',
      productId: 'nat-2',
      title: 'باقة الإهداء الفاخرة الخاصة',
      titleEn: 'Saudi Bespoke Signature Bouquet',
      subtitle: 'تنسيق يدوي فخم من الجوري والبيبي روز بتغليف مذهب',
      subtitleEn: 'Hand-crafted crimson blooms wrapped in metallic gold paper',
      badge: 'تنسيق حصري',
      badgeEn: 'Exclusive Edition',
      price: 380,
      image: '/src/assets/images/hadaya_saudi_luxury_bouquet_1791300211553.jpg',
      category: 'باقات فاخرة',
      categoryEn: 'Luxury Bouquets'
    },
    {
      id: 'slide-3',
      productId: 'nat-3',
      title: 'سحر النقاء العاجي والأوركيد',
      titleEn: 'Pure Ivory Roses & Orchids',
      subtitle: 'ورود جورى بيضاء نقية مع أزهار الأوركيد والليليانثوس',
      subtitleEn: 'Pure white garden roses with cascading Dutch orchids',
      badge: 'نقاء ملكي',
      badgeEn: 'Pure White Luxury',
      price: 340,
      image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
      category: 'ورد أبيض',
      categoryEn: 'White Roses'
    },
    {
      id: 'slide-4',
      productId: 'choc-1',
      title: 'صندوق ورد وشوكولاتة باتشي',
      titleEn: 'Patchi Chocolates & Roses Chest',
      subtitle: 'صندوق جلدي مذهب يجمع بين الجوري وشوكولاتة باتشي',
      subtitleEn: 'Opulent keepsake chest with fresh roses and Patchi treats',
      badge: 'شوكولاتة باتشي',
      badgeEn: 'Patchi Chocolate',
      price: 450,
      image: '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg',
      category: 'ورد وشوكولاتة بلجيكية فاخرة',
      categoryEn: 'Roses & Belgian Chocolate'
    }
  ];

  const totalSlides = slides.length;
  const activeSlide = slides[currentSlide];

  // Slide navigation
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  // Smooth auto-play with 7-second intervals
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchDelta(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchDelta(e.targetTouches[0].clientX - touchStart);
  };

  const handleTouchEnd = () => {
    if (touchStart === null) return;
    if (touchDelta > 50) {
      isAr ? nextSlide() : prevSlide();
    } else if (touchDelta < -50) {
      isAr ? prevSlide() : nextSlide();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  // Add active slide product to cart
  const handleAddToCart = () => {
    const productItem: Product = {
      id: activeSlide.productId,
      name: activeSlide.title,
      nameEn: activeSlide.titleEn,
      price: activeSlide.price,
      rating: 5.0,
      reviewsCount: 140,
      image: activeSlide.image,
      category: activeSlide.category,
      categoryEn: activeSlide.categoryEn,
      badge: activeSlide.badge,
      badgeEn: activeSlide.badgeEn,
      description: activeSlide.subtitle,
      descriptionEn: activeSlide.subtitleEn,
      flowerTypes: [activeSlide.category],
      inStock: true
    };
    addToCart(productItem, 1);
  };

  // WhatsApp order
  const handleWhatsApp = () => {
    const title = isAr ? activeSlide.title : activeSlide.titleEn;
    const text = isAr
      ? `مرحباً متجر هدايا مكة، أود طلب: *${title}* بسعر ${activeSlide.price} ر.س. يرجى تأكيد التوصيل المبرد في مكة المكرمة.`
      : `Hello Hadaya Mecca, I would like to order: *${title}* for ${activeSlide.price} SAR. Please confirm delivery.`;
    window.open(`https://wa.me/${MECCA_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Luxury Floral Slider"
      className="relative w-full h-[480px] sm:h-[540px] md:h-[620px] lg:h-[680px] overflow-hidden bg-[#07130a] text-white select-none"
    >
      {/* 1. Cinematic Fullscreen Background Slides (FULL VISUAL HIGHLIGHT ON FLOWERS) */}
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transform-gpu transition-opacity duration-1000 ease-out will-change-transform ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image: High Brightness & Vivid Clarity (Focus is 100% on the Flowers) */}
            <div
              className={`w-full h-full transform-gpu transition-transform duration-1000 ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
            >
              <img
                src={slide.image}
                alt={isAr ? slide.title : slide.titleEn}
                className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.03]"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            </div>

            {/* Minimal Soft Gradient at bottom only (Keeps whole center clear) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        );
      })}

      {/* 2. Vertically Centered Left and Right Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-5 md:left-7 z-30 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-black/40 hover:bg-[#d4af37] text-white hover:text-[#102a1c] border border-white/25 hover:border-[#d4af37] shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-5 md:right-7 z-30 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-black/40 hover:bg-[#d4af37] text-white hover:text-[#102a1c] border border-white/25 hover:border-[#d4af37] shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* 3. Small, Elegant Lateral Glass Card on the SIDE (Leaves center 100% unobstructed) */}
      <div className="absolute bottom-16 sm:bottom-20 right-4 sm:right-10 md:right-14 rtl:right-4 rtl:sm:right-10 rtl:md:right-14 rtl:left-auto ltr:left-4 ltr:sm:left-10 ltr:md:left-14 ltr:right-auto z-25 max-w-[280px] sm:max-w-sm md:max-w-md">
        <div
          key={currentSlide}
          className="bg-[#0a180f]/85 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#d4af37]/40 shadow-2xl space-y-2 sm:space-y-3 text-start animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#d4af37]/25 border border-[#d4af37]/50 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold text-[#f3e5ab]">
            <Sparkles className="w-3 h-3 text-[#d4af37] shrink-0" />
            <span>{isAr ? activeSlide.badge : activeSlide.badgeEn}</span>
          </div>

          {/* Compact Heading */}
          <h1 className="text-base sm:text-xl md:text-2xl font-bold font-serif leading-tight text-white drop-shadow-sm">
            {isAr ? activeSlide.title : activeSlide.titleEn}
          </h1>

          {/* Short 1-line Subtitle */}
          <p className="text-[11px] sm:text-xs md:text-sm text-[#e0d9cc] font-light leading-snug line-clamp-1">
            {isAr ? activeSlide.subtitle : activeSlide.subtitleEn}
          </p>

          {/* Minimal Button Row with Integrated Price */}
          <div className="pt-1 flex items-center gap-2">
            {/* Primary Action Button */}
            <button
              onClick={handleAddToCart}
              className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca98] text-[#102a1c] font-bold text-[11px] sm:text-xs shadow-md hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#102a1c] shrink-0" />
              <span>{isAr ? `أضف (${activeSlide.price} ر.س)` : `Add (${activeSlide.price} SAR)`}</span>
            </button>

            {/* Direct WhatsApp Icon */}
            <button
              onClick={handleWhatsApp}
              title={isAr ? 'طلب عبر واتساب' : 'WhatsApp'}
              className="p-2 sm:p-2.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/40 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Sleek Thumbnail Dock & Slide Counter */}
      <div className="absolute bottom-3 sm:bottom-4 inset-x-0 z-25 max-w-4xl mx-auto px-4 flex items-center justify-between">
        {/* Left Side: Active Counter */}
        <div className="font-mono text-[11px] sm:text-xs text-[#f5ebd7] bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
          <span className="font-bold text-[#d4af37]">0{currentSlide + 1}</span>
          <span className="text-white/40 mx-1">/</span>
          <span>0{totalSlides}</span>
        </div>

        {/* Center: 4 Docked Floral Thumbnails */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 bg-black/50 backdrop-blur-md p-1 rounded-xl border border-white/15">
          {slides.map((s, idx) => {
            const isSelected = idx === currentSlide;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`relative w-10 h-7 sm:w-13 sm:h-8 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-[#d4af37] scale-105 opacity-100 shadow-md border border-white'
                    : 'opacity-40 hover:opacity-90 border border-white/15'
                }`}
                title={isAr ? s.title : s.titleEn}
              >
                <img src={s.image} alt="thumbnail" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </button>
            );
          })}
        </div>

        {/* Right Side: Dot Indicators */}
        <div className="flex items-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === currentSlide ? 'w-5 bg-[#d4af37]' : 'w-1.5 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 5. 2px Bottom Smooth Progress Bar */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/15 z-30">
        <div
          className="h-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] transition-all duration-300 ease-linear"
          style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
        />
      </div>
    </section>
  );
};
