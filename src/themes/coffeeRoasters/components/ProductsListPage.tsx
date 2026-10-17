import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { Star, ChevronRight, ChevronLeft, Sparkles, LayoutGrid, Columns } from 'lucide-react';

export const ProductsListPage: React.FC = () => {
  const { navigateTo, language } = useCart();
  const [selectedCat, setSelectedCat] = useState('all');
  const [mobileViewMode, setMobileViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [activeMobileSlide, setActiveMobileSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const filtered = selectedCat === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === selectedCat);

  // High-performance IntersectionObserver for tracking active slide smoothly
  useEffect(() => {
    const container = carouselRef.current;
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
  }, [selectedCat, filtered.length, mobileViewMode]);

  // Reset slide index on category change
  useEffect(() => {
    setActiveMobileSlide(0);
    if (carouselRef.current) {
      const firstChild = carouselRef.current.children[0] as HTMLElement;
      if (firstChild) {
        firstChild.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    }
  }, [selectedCat]);

  const scrollToSlide = (index: number) => {
    if (!carouselRef.current) return;
    const children = carouselRef.current.children;
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

  const nextSlide = () => {
    const nextIdx = (activeMobileSlide + 1) % filtered.length;
    scrollToSlide(nextIdx);
  };

  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);
  const safeNavigate = (page: any, id?: any) => {
    if (!hasMovedRef.current) {
      navigateTo(page, id);
    }
  };

  const handleScroll = () => {};
  const handleDragStart = (_x: number, _y: number) => {
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
  };
  const handleDragMove = (_x: number, _y: number) => {
    if (isPointerDownRef.current) {
      hasMovedRef.current = true;
    }
  };
  const handleDragEnd = (_x: number, _y: number) => {
    isPointerDownRef.current = false;
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 150);
  };

  const prevSlide = () => {
    const prevIdx = (activeMobileSlide - 1 + filtered.length) % filtered.length;
    scrollToSlide(prevIdx);
  };

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12 text-start text-neutral-900 selection:bg-neutral-900 selection:text-white w-full max-w-full overflow-x-clip">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <div className="text-center max-w-5xl mx-auto space-y-3">
          <span className="inline-block text-xs font-bold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-4 py-1.5 rounded-full">
            {language === 'AR' ? 'المتجر الرسمي بالمملكة' : 'HiBrew KSA Official Store'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight text-center">
            {language === 'AR' ? 'جميع مكائن ومعدات القهوة ومستلزماتها' : 'Explore All Coffee Machines & Barista Gear'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto">
            {language === 'AR'
              ? 'مكائن الإسبريسو 20 بار، المطاحن التيتانيوم، دواليب وأركان القهوة، مستلزمات الباريستا والأكواب، والعروض الحصرية مع ضمان سنتين.'
              : '20-bar espresso machines, titanium mills, artisan coffee bars & cabinets, pro accessories & cups, and special offers with 2-year warranty.'}
          </p>

          {/* Filter Pills */}
          <div className="pt-4 overflow-x-auto no-scrollbar whitespace-nowrap px-2">
            <div className="flex items-center gap-2 sm:gap-3 w-max mx-auto px-2 py-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-xs transition-all cursor-pointer shrink-0 ${
                    selectedCat === cat.id
                      ? 'bg-white text-black font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-200/80 ring-1 ring-black/[0.03]'
                      : 'bg-transparent text-neutral-500 hover:text-black font-normal hover:bg-black/[0.02]'
                  }`}
                >
                  {language === 'AR' && cat.nameAr ? cat.nameAr : cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile View Toggle: Carousel Slider vs Grid */}
          <div className="flex sm:hidden items-center justify-center pt-2">
            <div className="inline-flex items-center bg-[#F1F1F3] p-1 rounded-full text-xs">
              <button
                type="button"
                onClick={() => setMobileViewMode('carousel')}
                className={`px-4 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mobileViewMode === 'carousel'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{language === 'AR' ? 'سلايدر' : 'Slider'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('grid')}
                className={`px-4 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mobileViewMode === 'grid'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{language === 'AR' ? 'شبكة' : 'Grid'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. Mobile Carousel View (When active on mobile screens) */}
        {mobileViewMode === 'carousel' && (
          <div className="block sm:hidden w-full relative">
            {/* Top Bar with Counter and Navigation Controls */}
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-xs font-semibold text-neutral-600 bg-[#F4F4F6] px-3.5 py-1 rounded-full">
                {language === 'AR'
                  ? `المنتج ${activeMobileSlide + 1} من ${filtered.length}`
                  : `Product ${activeMobileSlide + 1} of ${filtered.length}`}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => (language === 'AR' ? nextSlide() : prevSlide())}
                  aria-label="Previous product"
                  className="w-8 h-8 rounded-full bg-white text-neutral-800 border border-neutral-200/80 shadow-2xs flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                >
                  <ChevronLeft className={`w-4 h-4 ${language === 'AR' ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => (language === 'AR' ? prevSlide() : nextSlide())}
                  aria-label="Next product"
                  className="w-8 h-8 rounded-full bg-white text-neutral-800 border border-neutral-200/80 shadow-2xs flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                >
                  <ChevronRight className={`w-4 h-4 ${language === 'AR' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Swipeable Track with Smooth Hardware-Accelerated CSS Snap */}
            <div
              ref={carouselRef}
              className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-2 px-1 -mx-1 select-none touch-pan-x overscroll-x-contain"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
              }}
            >
              {filtered.map((product, pIdx) => (
                <div
                  key={product.id}
                  data-slide-index={pIdx}
                  className="w-[82vw] xs:w-[84vw] max-w-[320px] shrink-0 snap-center bg-[#F8F9FA] rounded-[26px] p-5 flex flex-col justify-between border border-neutral-200/60 shadow-xs select-none"
                >
                  <div>
                    <div
                      onClick={() => navigateTo('product-detail', product.id)}
                      className="relative w-full h-48 flex items-center justify-center p-3 bg-white rounded-2xl overflow-hidden mb-4 cursor-pointer select-none"
                    >
                      <img
                        src={product.colors[0]?.image || product.images[0]}
                        alt={product.name}
                        draggable={false}
                        className="max-h-full max-w-full object-contain select-none pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                      {product.badge && (
                        <span className={`absolute top-2.5 ${language === 'AR' ? 'right-2.5' : 'left-2.5'} text-[10px] font-bold text-white bg-black px-2.5 py-0.5 rounded-full`}>
                          {language === 'AR' && product.badgeAr ? product.badgeAr : product.badge}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-amber-500 mb-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{product.rating}</span>
                        <span className="text-neutral-400">({product.reviewCount})</span>
                      </div>

                      <h3
                        onClick={() => navigateTo('product-detail', product.id)}
                        className="font-bold text-base text-neutral-900 line-clamp-1 cursor-pointer text-center"
                      >
                        {language === 'AR' && product.nameAr ? product.nameAr : product.name}
                      </h3>

                      <p className="text-xs text-neutral-600 truncate text-center mt-0.5 font-normal">
                        {language === 'AR' && product.taglineAr ? product.taglineAr : product.tagline}
                      </p>

                      <div className="mt-3 mb-2 text-center">
                        <span className="text-base font-bold text-neutral-950 font-sans">
                          {language === 'AR' ? `${product.basePrice.toLocaleString()}.00 ر.س` : `SAR ${product.basePrice.toLocaleString()}.00`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-center gap-5 border-t border-neutral-200/60">
                    <button
                      type="button"
                      onClick={() => navigateTo('product-buy', product.id)}
                      className="px-5 py-2 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-full transition-transform active:scale-95 cursor-pointer shadow-none"
                    >
                      <span>{language === 'AR' ? 'شراء' : 'Buy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('product-detail', product.id)}
                      className="text-xs font-normal text-neutral-900 hover:text-black inline-flex items-center gap-0.5 cursor-pointer transition-colors active:scale-95"
                    >
                      <span>{language === 'AR' ? 'تعرف على المزيد' : 'Learn More'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${language === 'AR' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Dot Indicators */}
            {filtered.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-5">
                {filtered.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      activeMobileSlide === idx
                        ? 'w-7 bg-black'
                        : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Responsive Grid View (Always on desktop sm+, and when Grid selected on mobile) */}
        <div className={`${mobileViewMode === 'carousel' ? 'hidden sm:grid' : 'grid'} grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6`}>
          {filtered.map(product => (
            <div
              key={product.id}
              className="bg-[#F8F9FA] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 flex flex-col justify-between group transition-all duration-300 border border-neutral-100"
            >
              <div>
                <div
                  onClick={() => navigateTo('product-detail', product.id)}
                  className="relative w-full h-36 sm:h-52 flex items-center justify-center p-2.5 sm:p-3 bg-white rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 cursor-pointer"
                >
                  <img
                    src={product.colors[0]?.image || product.images[0]}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-108 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {product.badge && (
                    <span className={`absolute top-2 ${language === 'AR' ? 'right-2' : 'left-2'} text-[9px] sm:text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded-full`}>
                      {language === 'AR' && product.badgeAr ? product.badgeAr : product.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] sm:text-xs text-amber-500 mb-1">
                    <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{product.rating}</span>
                    <span className="text-neutral-400">({product.reviewCount})</span>
                  </div>

                  <h3
                    onClick={() => navigateTo('product-detail', product.id)}
                    className="font-bold text-xs sm:text-base text-neutral-900 group-hover:text-black transition-colors line-clamp-1 cursor-pointer text-center"
                  >
                    {language === 'AR' && product.nameAr ? product.nameAr : product.name}
                  </h3>

                  <p className="text-[11px] sm:text-sm font-normal text-neutral-600 truncate text-center mt-0.5">
                    {language === 'AR' && product.taglineAr ? product.taglineAr : product.tagline}
                  </p>

                  <div className="mt-2 sm:mt-3 mb-1.5 sm:mb-2 text-center">
                    <span className="text-xs sm:text-base font-bold text-neutral-950 font-sans">
                      {language === 'AR' ? `${product.basePrice.toLocaleString()}.00 ر.س` : `SAR ${product.basePrice.toLocaleString()}.00`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="pt-2 flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigateTo('product-buy', product.id)}
                  className="px-3 sm:px-4 py-1 sm:py-1.5 bg-black hover:bg-neutral-800 text-white font-medium text-[11px] sm:text-xs rounded-full transition-transform active:scale-95 cursor-pointer"
                >
                  <span>{language === 'AR' ? 'شراء' : 'Buy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('product-detail', product.id)}
                  className="group/learn text-[11px] sm:text-xs font-normal text-neutral-900 hover:text-black inline-flex items-center gap-0.5 cursor-pointer transition-colors active:scale-95"
                >
                  <span>{language === 'AR' ? 'المزيد' : 'Details'}</span>
                  <ChevronRight
                    className={`w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0 transition-transform duration-200 ${
                      language === 'AR' ? 'rotate-180 group-hover/learn:-translate-x-0.5' : 'group-hover/learn:translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
