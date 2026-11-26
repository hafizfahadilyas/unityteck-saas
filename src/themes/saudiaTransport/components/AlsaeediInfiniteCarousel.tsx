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
};

/**
 * Horizontal luxury carousel — snap cards, prev/next, auto infinite loop.
 * Touch-first: finger scroll never blocked by arrow overlays; auto pauses on touch.
 */
export const AlsaeediInfiniteCarousel: React.FC<Props> = ({
  isAr = true,
  children,
  autoMs = 4200,
  className = '',
  labelPrev,
  labelNext,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const touchActiveRef = useRef(false);
  const items = React.Children.toArray(children).filter(Boolean);

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el || touchActiveRef.current) return;
    const card = el.querySelector<HTMLElement>('[data-alsaeedi-slide]');
    const step = card ? card.offsetWidth + 12 : Math.max(240, Math.floor(el.clientWidth * 0.8));
    const rtl = isAr;
    const delta = (rtl ? -dir : dir) * step;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    let next = el.scrollLeft + delta;
    if (next > max - 4) next = 0;
    if (next < 4 && dir < 0) next = max;
    el.scrollTo({ left: next, behavior: 'smooth' });
  }, [isAr]);

  useEffect(() => {
    if (!autoMs || items.length < 2 || paused) return;
    const id = window.setInterval(() => scrollByCard(1), autoMs);
    return () => window.clearInterval(id);
  }, [autoMs, items.length, paused, scrollByCard]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onTouchStart = () => {
      touchActiveRef.current = true;
      setPaused(true);
    };
    const onTouchEnd = () => {
      touchActiveRef.current = false;
      window.setTimeout(() => setPaused(false), 2200);
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
      <div
        ref={scrollerRef}
        className="alsaeedi-chip-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 pe-1 ps-1 sm:gap-4"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pinch-zoom',
          scrollBehavior: 'auto',
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

      {items.length > 1 ? (
        <div className="pointer-events-none absolute inset-y-0 start-0 end-0 hidden items-center justify-between px-0.5 sm:flex sm:px-1">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d5a027]/45 bg-white/95 text-slate-900 shadow-md transition hover:bg-amber-50 cursor-pointer"
            aria-label={prevLabel}
            title={prevLabel}
          >
            {isAr ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d5a027]/45 bg-white/95 text-slate-900 shadow-md transition hover:bg-amber-50 cursor-pointer"
            aria-label={nextLabel}
            title={nextLabel}
          >
            {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
      ) : null}
    </div>
  );
};
