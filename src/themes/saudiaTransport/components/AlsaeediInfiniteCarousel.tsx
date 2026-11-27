import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  isAr?: boolean;
  children: React.ReactNode;
  /** Auto-advance interval in ms (0 = off) */
  autoMs?: number;
  className?: string;
  labelPrev?: string;
  labelNext?: string;
  showDots?: boolean;
};

/**
 * Horizontal luxury carousel — snap cards, high-contrast readable navigation, smooth & infinite loop.
 * Mobile & desktop touch-friendly: smooth momentum scrolling, readable controls, infinite lifetime loop.
 */
export const AlsaeediInfiniteCarousel: React.FC<Props> = ({
  isAr = true,
  children,
  autoMs = 4500,
  className = '',
  labelPrev,
  labelNext,
  showDots = true,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchActiveRef = useRef(false);
  const items = React.Children.toArray(children).filter(Boolean);

  // Track active slide on scroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || items.length === 0) return;

    let timeoutId: number;
    const handleScroll = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        const scrollLeft = Math.abs(el.scrollLeft);
        const card = el.querySelector<HTMLElement>('[data-alsaeedi-slide]');
        const step = card ? card.offsetWidth + 16 : el.clientWidth;
        const index = Math.round(scrollLeft / step);
        setActiveIndex(Math.min(items.length - 1, Math.max(0, index)));
      }, 50);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.clearTimeout(timeoutId);
      el.removeEventListener('scroll', handleScroll);
    };
  }, [items.length]);

  const scrollToSlide = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const card = el.querySelector<HTMLElement>('[data-alsaeedi-slide]');
      const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.85;
      const targetPos = index * step;
      const isRtl = isAr;
      const scrollPos = isRtl ? -targetPos : targetPos;
      el.scrollTo({ left: scrollPos, behavior: 'smooth' });
      setActiveIndex(index);
    },
    [isAr]
  );

  const scrollByCard = useCallback(
    (dir: 1 | -1) => {
      const el = scrollerRef.current;
      if (!el || touchActiveRef.current || items.length === 0) return;

      const card = el.querySelector<HTMLElement>('[data-alsaeedi-slide]');
      const step = card ? card.offsetWidth + 16 : Math.max(260, Math.floor(el.clientWidth * 0.85));
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);

      // Current normalized progress
      const currentScroll = Math.abs(el.scrollLeft);
      const isAtEnd = currentScroll >= maxScroll - 16;
      const isAtStart = currentScroll <= 16;

      let nextIndex = activeIndex + dir;

      // Infinite loop wrap-around
      if (dir > 0 && (nextIndex >= items.length || isAtEnd)) {
        nextIndex = 0;
      } else if (dir < 0 && (nextIndex < 0 || isAtStart)) {
        nextIndex = items.length - 1;
      }

      scrollToSlide(nextIndex);
    },
    [activeIndex, items.length, scrollToSlide]
  );

  // Auto-advance loop: runs indefinitely unless hovered or touched
  useEffect(() => {
    if (!autoMs || items.length < 2 || paused) return;
    const id = window.setInterval(() => {
      scrollByCard(1);
    }, autoMs);
    return () => window.clearInterval(id);
  }, [autoMs, items.length, paused, scrollByCard]);

  // Touch handlers to pause during interaction
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onTouchStart = () => {
      touchActiveRef.current = true;
      setPaused(true);
    };
    const onTouchEnd = () => {
      touchActiveRef.current = false;
      window.setTimeout(() => setPaused(false), 2500);
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  const prevLabel = labelPrev || (isAr ? 'السابق' : 'Previous');
  const nextLabel = labelNext || (isAr ? 'التالي' : 'Next');

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      {/* Horizontal Scroller with Smooth Touch & Snap */}
      <div
        ref={scrollerRef}
        className="alsaeedi-chip-scroll flex snap-x snap-mandatory gap-3 sm:gap-4 overflow-x-auto overscroll-x-contain pb-3 pe-1 ps-1 scroll-smooth"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pinch-zoom',
          scrollBehavior: 'smooth',
        }}
        role="region"
        aria-roledescription="carousel"
      >
        {items.map((child, i) => (
          <div
            key={(React.isValidElement(child) && child.key) || i}
            data-alsaeedi-slide
            className="w-[85%] shrink-0 snap-start sm:w-[48%] lg:w-[32%] xl:w-[24%]"
          >
            {child}
          </div>
        ))}
      </div>

      {/* Prominent, readable navigation controls — visible on mobile and desktop */}
      {items.length > 1 ? (
        <div className="pointer-events-none absolute inset-y-0 start-0 end-0 flex items-center justify-between px-1 sm:px-2 z-20">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="pointer-events-auto inline-flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#915f3c] hover:bg-[#7e5233] text-white shadow-[0_4px_14px_rgba(145,95,60,0.4)] active:scale-95 transition-all cursor-pointer"
            aria-label={prevLabel}
            title={prevLabel}
          >
            {isAr ? (
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-white stroke-[2.5]" />
            ) : (
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white stroke-[2.5]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="pointer-events-auto inline-flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#915f3c] hover:bg-[#7e5233] text-white shadow-[0_4px_14px_rgba(145,95,60,0.4)] active:scale-95 transition-all cursor-pointer"
            aria-label={nextLabel}
            title={nextLabel}
          >
            {isAr ? (
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white stroke-[2.5]" />
            ) : (
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-white stroke-[2.5]" />
            )}
          </button>
        </div>
      ) : null}

      {/* Slide indicators / pagination dots */}
      {showDots && items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToSlide(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                activeIndex === idx
                  ? 'w-6 bg-[#915f3c] shadow-xs'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlsaeediInfiniteCarousel;
