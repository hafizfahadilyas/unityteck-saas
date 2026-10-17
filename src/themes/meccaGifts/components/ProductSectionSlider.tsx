import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductSectionSliderProps {
  title: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  products: Product[];
  categoryFilter?: string;
  categorySlug?: string;
  limit?: number;
  columns?: number;
  layout?: 'slider' | 'grid';
  badgeText?: string;
  badgeTextEn?: string;
}

export const ProductSectionSlider: React.FC<ProductSectionSliderProps> = React.memo(({
  title,
  titleEn = title,
  subtitle,
  subtitleEn,
  products,
  categoryFilter,
  categorySlug,
  limit = 6,
  columns = 4,
  layout = 'slider',
  badgeText,
  badgeTextEn,
}) => {
  const { language, setCurrentPage, setSelectedCategory, builderDevice } = useApp();
  const isMobileView = builderDevice === 'mobile';
  const effectiveCategory = categoryFilter || categorySlug;
  const isAr = language === 'ar';

  const [activeMobileIdx, setActiveMobileIdx] = useState(0);
  const [desktopSlideIdx, setDesktopSlideIdx] = useState(0);

  const items = useMemo(() => {
    return products.slice(0, limit);
  }, [products, limit]);

  const total = items.length;

  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const handleViewAll = () => {
    if (effectiveCategory) {
      setSelectedCategory(effectiveCategory);
    }
    setCurrentPage('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextSlide = useCallback(() => {
    setActiveMobileIdx((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setActiveMobileIdx((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  const desktopScrollRef = useRef<HTMLDivElement>(null);

  const nextDesktop = useCallback(() => {
    if (desktopScrollRef.current) {
      const scrollAmount = desktopScrollRef.current.clientWidth * 0.75;
      desktopScrollRef.current.scrollBy({
        left: isAr ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, [isAr]);

  const prevDesktop = useCallback(() => {
    if (desktopScrollRef.current) {
      const scrollAmount = desktopScrollRef.current.clientWidth * 0.75;
      desktopScrollRef.current.scrollBy({
        left: isAr ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  }, [isAr]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    if (touchDeltaX.current > 40) {
      isAr ? nextSlide() : prevSlide();
    } else if (touchDeltaX.current < -40) {
      isAr ? prevSlide() : nextSlide();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  if (items.length === 0) return null;

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto group/section section-reveal overflow-hidden">
      {/* Header: Uniform Site-wide Styling with Title, Subtitle, Arrows & View All */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#ece7de]">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
            {isAr ? title : titleEn}
          </h2>
          {(subtitle || subtitleEn) && (
            <p className="text-xs sm:text-sm text-[#7a7164] mt-1 font-light">
              {isAr ? subtitle : subtitleEn}
            </p>
          )}
        </div>

        {/* View All & Desktop Navigation Controls */}
        <div className="flex items-center gap-3">
          {layout === 'slider' && items.length > columns && (
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevDesktop}
                className="w-8 h-8 rounded-full border border-[#d6cfc0] bg-white hover:bg-[#102a1c] hover:text-white transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
                title={isAr ? 'السابق' : 'Previous'}
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={nextDesktop}
                className="w-8 h-8 rounded-full border border-[#d6cfc0] bg-white hover:bg-[#102a1c] hover:text-white transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
                title={isAr ? 'التالي' : 'Next'}
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleViewAll}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#102a1c] hover:text-[#b8860b] transition-colors cursor-pointer group"
          >
            <span>{isAr ? 'عرض الكل' : 'View All'}</span>
            {isAr ? (
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* ── Desktop & Tablet Grid / Slider ──────────────── */}
      {!isMobileView && (
        layout === 'slider' && items.length > 4 ? (
          <div className="hidden sm:block relative overflow-hidden">
            <div
              ref={desktopScrollRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth scrollbar-thin scrollbar-thumb-[#102a1c]/20"
            >
              {items.map((product) => (
                <div key={product.id} className="min-w-[260px] sm:min-w-[280px] max-w-[290px] shrink-0 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )
      )}

      {/* ── Mobile 1-by-1 Interactive Smooth Carousel (No Horizontal Overflow) */}
      <div className={`${isMobileView ? 'block' : 'block sm:hidden'} relative w-full`}>
        {/* Swipe Container for Single Active Card */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full max-w-[340px] mx-auto transition-all duration-300 select-none"
        >
          {items.map((product, idx) => {
            const isActive = idx === activeMobileIdx;
            return (
              <div
                key={product.id}
                className={`transition-all duration-500 ease-out ${
                  isActive
                    ? 'opacity-100 scale-100 relative z-10 block'
                    : 'opacity-0 scale-95 absolute inset-0 pointer-events-none hidden'
                }`}
              >
                <ProductCard product={product} />
              </div>
            );
          })}
        </div>

        {/* Mobile Navigation Controls: Prev/Next & Dots */}
        <div className="flex items-center justify-between mt-4 max-w-[340px] mx-auto px-2">
          {/* Prev Button */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label={isAr ? "السابق" : "Previous"}
            className="w-9 h-9 rounded-full bg-[#102a1c] text-[#e6ca98] border border-[#d4af37]/40 shadow-md flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 rtl:block ltr:hidden" />
            <ChevronLeft className="w-4 h-4 rtl:hidden ltr:block" />
          </button>

          {/* Pagination Indicator Dots */}
          <div className="flex items-center gap-1.5" aria-label="Slide indicators">
            {items.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setActiveMobileIdx(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  dotIdx === activeMobileIdx
                    ? 'w-6 bg-[#d4af37]'
                    : 'w-2 bg-[#d4af37]/30 hover:bg-[#d4af37]/60'
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={nextSlide}
            aria-label={isAr ? "التالي" : "Next"}
            className="w-9 h-9 rounded-full bg-[#102a1c] text-[#e6ca98] border border-[#d4af37]/40 shadow-md flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rtl:block ltr:hidden" />
            <ChevronRight className="w-4 h-4 rtl:hidden ltr:block" />
          </button>
        </div>
      </div>
    </section>
  );
});
