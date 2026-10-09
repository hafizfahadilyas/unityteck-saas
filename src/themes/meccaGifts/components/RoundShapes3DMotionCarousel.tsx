import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { cn } from "../lib/utils";

export interface RoundShapeItem {
  id: string;
  name: string;
  nameEn: string;
  image: string;
  subtitle: string;
  subtitleEn: string;
  badge: string;
  badgeEn?: string;
  countText?: string;
  categoryFilter?: string;
}

export interface RoundShapes3DMotionCarouselProps {
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  items: RoundShapeItem[];
  themeColor?: 'rose' | 'gold' | 'emerald';
  className?: string;
}

const EASING_TWEEN: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const RoundShapes3DMotionCarousel: React.FC<RoundShapes3DMotionCarouselProps> = ({
  title,
  titleEn,
  subtitle,
  subtitleEn,
  items,
  themeColor = 'rose',
  className = '',
}) => {
  const { language, navigateToCategory } = useApp();
  const isAr = language === 'ar';

  const n = items.length;
  const [active, setActive] = useState(0);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  const lockRef = useRef(false);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const didDragRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "150px" });
  const [isHovered, setIsHovered] = useState(false);

  // Responsive dimensions
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth >= 640 && screenWidth < 1024;

  const diameter = isMobile ? 195 : isTablet ? 250 : 300;
  const tilt = isMobile ? 12 : 16;
  const sideTilt = isMobile ? 3 : 5;
  const depth = isMobile ? 140 : 210;
  const scaleStep = isMobile ? 0.18 : 0.15;
  const perspective = 1500;
  const dimOpacity = 45;
  const animationDuration = 0.6;
  const maxVisible = 2;

  const lastStepTime = useRef(0);

  // Infinite step function - instantaneous and reliable
  const step = useCallback(
    (dir: 1 | -1) => {
      const now = Date.now();
      if (now - lastStepTime.current < 120 || n === 0) return;
      lastStepTime.current = now;
      setActive((a) => (((a + dir) % n) + n) % n);
    },
    [n]
  );

  const goTo = useCallback(
    (i: number) => {
      if (i === active || n === 0) return;
      setActive(i);
    },
    [active, n]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  // Autoplay (4 seconds infinite loop, pauses on hover/drag)
  useEffect(() => {
    if (n < 2 || !isInView || isHovered) return;
    const id = window.setInterval(() => {
      step(1);
    }, 4000);
    return () => window.clearInterval(id);
  }, [n, step, isInView, isHovered]);

  // Pointer drag gestures (mouse + stylus)
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDragging.current = true;
    didDragRef.current = false;
    dragStartX.current = e.clientX;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const diff = Math.abs(e.clientX - dragStartX.current);
    if (diff > 8) {
      didDragRef.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 25) {
      // Drag left (delta < 0) -> next (1)
      // Drag right (delta > 0) -> prev (-1)
      step(delta < 0 ? 1 : -1);
    }
    setTimeout(() => {
      didDragRef.current = false;
    }, 50);
  };

  // Touch swipe gestures for mobile fingers
  const touchStartX = useRef<number | null>(null);
  const touchMoved = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchMoved.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = Math.abs(e.touches[0].clientX - touchStartX.current);
    if (diff > 8) {
      touchMoved.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 25) {
      // Swipe left -> next (1)
      // Swipe right -> prev (-1)
      step(delta < 0 ? 1 : -1);
    }
    touchStartX.current = null;
    setTimeout(() => {
      touchMoved.current = false;
    }, 50);
  };

  const transition = {
    type: "tween" as const,
    duration: animationDuration,
    ease: EASING_TWEEN,
  };

  const dimValue = 1 - Math.max(0, Math.min(100, dimOpacity)) / 100;

  // Theming gradients
  const getGradientBorder = () => {
    switch (themeColor) {
      case 'rose':
        return 'from-[#8b263e] via-[#e6ca98] to-[#102a1c]';
      case 'gold':
        return 'from-[#d4af37] via-[#fbf3d5] to-[#aa7c11]';
      default:
        return 'from-[#102a1c] via-[#d4af37] to-[#1f4a32]';
    }
  };

  const getAccentBadge = () => {
    switch (themeColor) {
      case 'rose':
        return 'bg-gradient-to-r from-[#8b263e] to-[#a3324d] text-white border-[#f3e5ab]/50';
      case 'gold':
        return 'bg-gradient-to-r from-[#d4af37] to-[#b38618] text-[#102a1c] border-[#fbf3d5] font-bold';
      default:
        return 'bg-gradient-to-r from-[#102a1c] to-[#1f4a32] text-[#f3e5ab] border-[#d4af37]/40';
    }
  };

  const getGlowShadow = () => {
    switch (themeColor) {
      case 'rose':
        return 'shadow-[0_12px_45px_rgba(139,38,62,0.45)]';
      case 'gold':
        return 'shadow-[0_12px_45px_rgba(212,175,55,0.45)]';
      default:
        return 'shadow-[0_12px_45px_rgba(16,42,28,0.45)]';
    }
  };

  if (n === 0) return null;

  const currentItem = items[active];

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative bg-gradient-to-b from-white/80 via-[#fcfaf5] to-white/80 rounded-3xl p-4 sm:p-7 border border-[#e6ca98]/40 shadow-xs overflow-hidden select-none",
        className
      )}
    >
      {/* Clean Header: Title & Subtitle (Buttons moved down to the cards) */}
      <div className="flex items-center justify-between mb-2 sm:mb-4">
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

        {/* Counter Tag in Header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#8b5e1b] bg-[#FAF9F5] px-3 py-1 rounded-full border border-[#e6ca98]/50 shadow-2xs">
            0{active + 1} / 0{n}
          </span>
        </div>
      </div>

      {/* 3D Round Shapes Motion Stage with Centered Left & Right Arrow Buttons */}
      <div
        ref={containerRef}
        className="relative flex flex-col items-center justify-center select-none overflow-hidden will-change-transform py-2 sm:py-4"
        style={{
          minHeight: diameter + (isMobile ? 70 : 90),
          perspective: `${perspective}px`,
          touchAction: "pan-y",
        }}
        tabIndex={0}
        role="region"
        aria-roledescription="3d circular carousel"
        aria-label={isAr ? title : titleEn}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── ARROW BUTTON: LEFT (Vertically Centered at Card Height) ────────── */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            step(-1);
          }}
          aria-label={isAr ? "السابق" : "Previous"}
          className="absolute left-1 sm:left-3 md:left-5 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#102a1c] hover:bg-[#1a402c] text-[#f3e5ab] hover:text-white border-2 border-[#d4af37] shadow-[0_6px_25px_rgba(0,0,0,0.45)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer pointer-events-auto backdrop-blur-md group"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* ── ARROW BUTTON: RIGHT (Vertically Centered at Card Height) ───────── */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            step(1);
          }}
          aria-label={isAr ? "التالي" : "Next"}
          className="absolute right-1 sm:right-3 md:right-5 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#102a1c] hover:bg-[#1a402c] text-[#f3e5ab] hover:text-white border-2 border-[#d4af37] shadow-[0_6px_25px_rgba(0,0,0,0.45)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer pointer-events-auto backdrop-blur-md group"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* ── 3D Cards Stage ─────────────────────────────────────────────────── */}
        <div
          className="relative w-full flex items-center justify-center"
          style={{
            height: diameter + 20,
            transformStyle: "preserve-3d",
          }}
        >
          {items.map((item, i) => {
            const rawOffset = i - active;
            let offset = rawOffset;
            if (Math.abs(rawOffset) > n / 2) {
              offset = rawOffset > 0 ? rawOffset - n : rawOffset + n;
            }

            const absOffset = Math.abs(offset);
            const isVisible = absOffset <= maxVisible;
            if (!isVisible) return null;

            const isCenter = offset === 0;
            const sign = offset < 0 ? -1 : 1;

            // 3D translation & rotation
            const tx = offset * (diameter * 0.74 + (isMobile ? 10 : 20));
            const tz = -absOffset * depth;
            const ry = -sign * Math.min(absOffset, 2) * tilt;
            const rz = -sign * Math.min(absOffset, 2) * sideTilt;
            const sc = Math.max(0.62, 1 - absOffset * scaleStep);
            const op = isCenter ? 1 : Math.max(0.35, 1 - absOffset * (1 - dimValue));
            const zIndex = n - absOffset;

            return (
              <motion.div
                key={item.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}: ${item.name}`}
                aria-current={isCenter ? "true" : undefined}
                className={cn(
                  "absolute will-change-transform cursor-pointer select-none rounded-full",
                  isCenter ? "cursor-pointer" : "cursor-pointer pointer-events-auto"
                )}
                style={{
                  width: diameter,
                  height: diameter,
                  zIndex,
                }}
                animate={{
                  x: tx,
                  z: tz,
                  rotateY: ry,
                  rotateZ: rz,
                  scale: sc,
                  opacity: op,
                }}
                transition={transition}
                onClick={() => {
                  if (didDragRef.current || touchMoved.current) return;
                  if (isCenter) {
                    navigateToCategory(item.categoryFilter || item.name);
                  } else {
                    goTo(i);
                  }
                }}
              >
                {/* 100% Round Shape Floral Orb with Animated Border */}
                <div
                  className={cn(
                    "relative w-full h-full rounded-full p-1.5 transition-all duration-500 overflow-hidden",
                    `bg-gradient-to-tr ${getGradientBorder()}`,
                    isCenter ? `${getGlowShadow()} ring-4 ring-[#d4af37]/75 scale-100` : "shadow-lg scale-98"
                  )}
                >
                  {/* Round Image Inner Container */}
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-[#102a1c]">
                    <img
                      src={item.image}
                      alt={isAr ? item.name : item.nameEn}
                      className={cn(
                        "w-full h-full object-cover rounded-full transition-transform duration-700 ease-out",
                        isCenter ? "scale-105" : "scale-100"
                      )}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />

                    {/* Radial Dark Vignette for Pristine Legibility */}
                    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(0,0,0,0.1)_0%,_rgba(0,0,0,0.35)_55%,_rgba(0,0,0,0.85)_100%)] pointer-events-none" />

                    {/* Center Light Sweep Lens Reflection */}
                    {isCenter && (
                      <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                    )}

                    {/* Top Floating Badge */}
                    <div className="absolute top-2.5 sm:top-4 inset-x-0 flex justify-center pointer-events-none px-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md border backdrop-blur-xs",
                          getAccentBadge()
                        )}
                      >
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin-slow shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {isAr ? item.badge : (item.badgeEn || item.badge)}
                        </span>
                      </span>
                    </div>

                    {/* Bottom Center Title & Action Overlay inside Round Shape */}
                    <div className="absolute bottom-2 sm:bottom-4 inset-x-0 flex flex-col items-center justify-end text-center px-2 sm:px-3 pointer-events-none">
                      <h3 className="font-serif font-bold text-white text-xs sm:text-sm md:text-base leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] line-clamp-1">
                        {isAr ? item.name : item.nameEn}
                      </h3>

                      <p className="text-[10px] sm:text-[11px] text-[#f3e5ab] font-light mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] line-clamp-1">
                        {isAr ? item.subtitle : item.subtitleEn}
                      </p>

                      {isCenter && (
                        <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#102a1c]/80 border border-[#d4af37]/50 text-[#f3e5ab] text-[10px] sm:text-xs font-semibold shadow-xs">
                          <span>{isAr ? 'تصفح الآن' : 'Explore'}</span>
                          {isAr ? (
                            <ArrowLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#d4af37]" />
                          ) : (
                            <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#d4af37]" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Outer Concentric Golden Ring Halo */}
                  {isCenter && (
                    <span className="absolute -inset-0.5 rounded-full border border-white/50 pointer-events-none animate-pulse" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Active Title Banner & Category Click on Mobile/Desktop */}
        <div className="mt-3 sm:mt-5 text-center z-20">
          <button
            onClick={() => {
              if (didDragRef.current || touchMoved.current) return;
              navigateToCategory(currentItem.categoryFilter || currentItem.name);
            }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#102a1c] via-[#1f4a32] to-[#102a1c] text-[#f3e5ab] hover:text-white border border-[#d4af37]/60 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer text-xs sm:text-sm font-medium"
          >
            <span>{isAr ? `تصفح كل ${currentItem.name}` : `View all in ${currentItem.nameEn}`}</span>
            {isAr ? <ArrowLeft className="w-3.5 h-3.5 text-[#d4af37]" /> : <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />}
          </button>
        </div>
      </div>

      {/* Progress Dots Indicator */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to item ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
              i === active
                ? "w-6 bg-[#d4af37]"
                : "w-1.5 bg-[#102a1c]/25 hover:bg-[#102a1c]/50"
            )}
          />
        ))}
      </div>
    </section>
  );
};
