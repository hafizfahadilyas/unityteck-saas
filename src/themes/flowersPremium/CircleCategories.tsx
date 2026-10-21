import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Layers } from 'lucide-react';
import { FLOWERS_CIRCLE_CATEGORIES } from './pack';

type Props = {
  lang: string;
  selectedFilter: string;
  onSelect: (filter: string) => void;
  productCounts?: Record<string, number>;
  onSelectBrand?: (brand: string) => void;
  selectedBrand?: string;
};

export const CircleCategories: React.FC<Props> = ({
  lang,
  selectedFilter,
  onSelect,
  productCounts,
  onSelectBrand,
  selectedBrand,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(Math.abs(scrollLeft) > 10);
      setCanScrollRight(Math.abs(scrollLeft) < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const isAr = lang === 'ar';

  return (
    <div className="w-full relative px-2 sm:px-6 pt-4 pb-2 group/slider">
      {/* Slider Left Arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white shadow-lg border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all opacity-90 hover:opacity-100 backdrop-blur-sm"
          aria-label={isAr ? 'السابق' : 'Previous'}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      {/* Slider Right Arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white shadow-lg border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all opacity-90 hover:opacity-100 backdrop-blur-sm"
          aria-label={isAr ? 'التالي' : 'Next'}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      {/* Categories Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="w-full flex items-center justify-between sm:justify-around gap-3 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-none px-2 py-3 select-none scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {FLOWERS_CIRCLE_CATEGORIES.map((cat) => {
          const active = selectedFilter === cat.filter && !selectedBrand;
          const count = productCounts
            ? cat.filter === 'All'
              ? Object.values(productCounts).reduce((a, b) => a + b, 0)
              : productCounts[cat.filter] ?? null
            : null;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.filter)}
              className="flex flex-col items-center gap-2 shrink-0 flex-1 min-w-[76px] sm:min-w-[96px] md:min-w-[110px] cursor-pointer group focus:outline-none transition-transform hover:-translate-y-1"
              style={{ scrollSnapAlign: 'center' }}
            >
              {/* Circular Avatar with Glowing Ring */}
              <div className="relative">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden p-1 border-2 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl ${
                    active
                      ? 'border-emerald-600 ring-4 ring-emerald-500/30 ring-offset-2 scale-105 dark:ring-offset-slate-900 shadow-emerald-500/40'
                      : 'border-slate-200/90 dark:border-slate-700/80 group-hover:border-emerald-500'
                  }`}
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #059669, #10b981)'
                      : 'var(--sf-surface, #ffffff)',
                  }}
                >
                  <img
                    src={cat.image}
                    alt={isAr ? cat.nameAr : cat.nameEn}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                    loading="lazy" decoding="async"
                  />
                </div>

                {/* Count Badge */}
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 px-2 py-0.5 min-w-[20px] text-[10px] font-black rounded-full shadow-md flex items-center justify-center transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white ring-2 ring-white dark:ring-slate-900'
                        : 'bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900'
                    }`}
                  >
                    {count}
                  </span>
                )}

                {/* Active Indicator Dot */}
                {active && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </div>

              {/* Category Title */}
              <span
                className={`text-xs sm:text-sm font-black tracking-tight text-center whitespace-nowrap transition-all duration-200 group-hover:text-emerald-600 ${
                  active ? 'scale-105 text-emerald-600 dark:text-emerald-400' : 'opacity-90 text-slate-800 dark:text-slate-200'
                }`}
              >
                {isAr ? cat.nameAr : cat.nameEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

