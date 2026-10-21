import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface CircularItem {
  id: string;
  name: string;
  nameEn: string;
  image: string;
  count?: number;
  badge?: string;
}

interface CircularMotionCarouselProps {
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  items: CircularItem[];
  themeColor?: 'emerald' | 'rose' | 'gold';
}

export const CircularMotionCarousel: React.FC<CircularMotionCarouselProps> = ({
  title,
  titleEn,
  subtitle,
  subtitleEn,
  items,
  themeColor = 'emerald'
}) => {
  const { language, navigateToCategory } = useApp();
  const isAr = language === 'ar';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive itemsPerView
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 480) {
        setItemsPerView(2);
      } else if (w < 768) {
        setItemsPerView(3);
      } else if (w < 1024) {
        setItemsPerView(4);
      } else {
        setItemsPerView(5);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const total = items.length;
  const maxIndex = Math.max(0, total - itemsPerView);

  const next = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  // Autoplay
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, maxIndex]);

  // Color theming
  const getGradientBorder = () => {
    switch (themeColor) {
      case 'rose':
        return 'from-[#8b263e] via-[#e6ca98] to-[#102a1c]';
      case 'gold':
        return 'from-[#d4af37] via-[#f3e5ab] to-[#102a1c]';
      default:
        return 'from-[#102a1c] via-[#d4af37] to-[#8b263e]';
    }
  };

  const getBadgeColor = () => {
    switch (themeColor) {
      case 'rose':
        return 'bg-[#8b263e]/15 text-[#8b263e] border-[#8b263e]/30';
      case 'gold':
        return 'bg-[#d4af37]/20 text-[#8b5e1b] border-[#d4af37]/40';
      default:
        return 'bg-[#102a1c]/10 text-[#102a1c] border-[#102a1c]/20';
    }
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative bg-gradient-to-b from-white/70 via-[#fcfaf5] to-white/70 rounded-3xl p-4 sm:p-7 border border-[#e6ca98]/40 shadow-xs overflow-hidden select-none"
    >
      {/* Header with Title and Modern Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${getGradientBorder()} shadow-xs`} />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-[#102a1c]">
              {isAr ? title : titleEn}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7a7164] mt-1 font-light">
            {isAr ? subtitle : subtitleEn}
          </p>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={isAr ? next : prev}
            aria-label="Previous"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#102a1c] hover:bg-[#1f4a32] text-[#f3e5ab] flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isAr ? <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          <button
            onClick={isAr ? prev : next}
            aria-label="Next"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#102a1c] hover:bg-[#1f4a32] text-[#f3e5ab] flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isAr ? <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Motion Carousel Stage (ZERO SCROLLBARS, Smooth Motion) */}
      <div ref={containerRef} className="relative overflow-hidden w-full py-2">
        <motion.div
          className="flex items-center gap-3 sm:gap-6 md:gap-8 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: -100 * (total - itemsPerView), right: 0 }}
          animate={{
            x: isAr
              ? `${currentIndex * (100 / itemsPerView)}%`
              : `-${currentIndex * (100 / itemsPerView)}%`
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              onClick={() => navigateToCategory(item.name)}
              whileHover={{ scale: 1.05, y: -6 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center text-center shrink-0 cursor-pointer group"
              style={{
                width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 12 / itemsPerView}px)`
              }}
            >
              {/* 100% Round Shape Floral Circle with Glowing Animated Border */}
              <div
                className={`relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr ${getGradientBorder()} group-hover:ring-4 group-hover:ring-[#d4af37]/60 group-hover:shadow-2xl transition-all duration-500 shadow-md`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-[#f5f3ec] relative">
                  <img
                    src={item.image}
                    alt={isAr ? item.name : item.nameEn}
                    className="w-full h-full object-cover rounded-full group-hover:scale-115 transition-transform duration-700 ease-out"
                    loading="lazy" decoding="async"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors rounded-full" />
                </div>

                {/* Subtle Pulse Halo on Active/Hover */}
                <span className="absolute -inset-0.5 rounded-full border border-white/40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Title & Count */}
              <h3 className="text-xs sm:text-sm font-bold text-[#102a1c] group-hover:text-[#8b263e] transition-colors mt-3 leading-snug line-clamp-2 px-1">
                {isAr ? item.name : item.nameEn}
              </h3>

              {/* Badge */}
              {item.badge && (
                <span
                  className={`inline-block mt-1 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs transition-all ${getBadgeColor()}`}
                >
                  {item.badge}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Progress Dots Indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === currentIndex ? 'w-6 bg-[#d4af37]' : 'w-1.5 bg-[#102a1c]/25 hover:bg-[#102a1c]/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

