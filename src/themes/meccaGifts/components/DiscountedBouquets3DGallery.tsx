import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { DISCOUNTED_BOUQUETS } from '../data/mockData';
import { cn } from '../lib/utils';

interface DiscountedBouquets3DGalleryProps {
  products?: Product[];
}

const EASING_TWEEN: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DiscountedBouquets3DGallery: React.FC<DiscountedBouquets3DGalleryProps> = ({
  products: propProducts,
}) => {
  const { language, addToCart, navigateToProduct, setCurrentPage, setSelectedCategory, products: appProducts } = useApp();
  const isAr = language === 'ar';

  const products = useMemo(() => {
    if (propProducts && propProducts.length > 0) return propProducts;
    if (appProducts && appProducts.length > 0) {
      const discounted = appProducts.filter(p => Boolean(p.originalPrice || p.badge?.includes('خصم') || p.badgeEn?.includes('Off')));
      if (discounted.length >= 3) return discounted;
      return [...discounted, ...appProducts].slice(0, 6);
    }
    return DISCOUNTED_BOUQUETS;
  }, [propProducts, appProducts]);

  const n = products.length;
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "150px" });

  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const didDragRef = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchMoved = useRef(false);
  const lastStepTime = useRef(0);

  // Responsive card size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardWidth = isMobile ? 250 : 290;
  const cardHeight = isMobile ? 380 : 430;
  const perspective = 1200;
  const animationDuration = 0.55;

  // Infinite step function
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

  // Trackpad / Mouse Wheel Scroll Navigation on card stack
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 25) {
      const now = Date.now();
      if (now - lastStepTime.current > 300) {
        lastStepTime.current = now;
        step(e.deltaY > 0 ? 1 : -1);
      }
    }
  };

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

  // Autoplay (4 seconds delay, pauses on hover or off-screen)
  useEffect(() => {
    if (n < 2 || !isInView || isHovered) return;
    const id = window.setInterval(() => {
      step(1);
    }, 4000);
    return () => window.clearInterval(id);
  }, [n, step, isInView, isHovered]);

  // Pointer drag gestures
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDragging.current = true;
    didDragRef.current = false;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const diffX = Math.abs(e.clientX - dragStartX.current);
    const diffY = Math.abs(e.clientY - dragStartY.current);
    if (diffX > 8 || diffY > 8) {
      didDragRef.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    const deltaX = e.clientX - dragStartX.current;
    const deltaY = e.clientY - dragStartY.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > 25 || absY > 25) {
      if (absY > absX) {
        step(deltaY < 0 ? 1 : -1);
      } else {
        step(deltaX < 0 ? 1 : -1);
      }
    }
    setTimeout(() => {
      didDragRef.current = false;
    }, 50);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchMoved.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (diffX > 8 || diffY > 8) {
      touchMoved.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > 25 || absY > 25) {
      if (absY > absX) {
        step(deltaY < 0 ? 1 : -1);
      } else {
        step(deltaX < 0 ? 1 : -1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setTimeout(() => {
      touchMoved.current = false;
    }, 50);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  const handleViewAll = () => {
    setSelectedCategory('باقات ورود طبيعية مخفضة');
    setCurrentPage('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const transition = {
    type: "tween" as const,
    duration: animationDuration,
    ease: EASING_TWEEN,
  };

  return (
    <section ref={containerRef} className="relative w-full bg-gradient-to-b from-[#06120b] via-[#0b1e14] to-[#06120b] border-y border-[#d4af37]/35 py-12 sm:py-16 md:py-20 select-none overflow-hidden my-8 sm:my-12">
      {/* Ambient Radial Floral Glow Halos (CardStack3D Spec) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#d4af37]/10 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-[#102a1c]/50 blur-[90px]" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Top Header: Clear Spacing Above Cards ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-5 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#e6ca98]">
                {isAr ? 'عروض وتخفيضات استثنائية • تشكيلة ثلاثية الأبعاد' : 'CardStack3D • Exclusive Offers'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-white">
              {isAr ? 'باقات ورود طبيعية مخفضة' : 'Discounted Natural Flower Bouquets'}
            </h2>

            <p className="text-xs sm:text-sm text-[#e6ca98]/80 mt-1 font-light">
              {isAr
                ? 'عروض حصرية وخصومات استثنائية على باقات الورد الطبيعي لفترة محدودة'
                : 'Special promotional discounts on premium natural floral arrangements'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs text-[#f3e5ab] font-light">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{isAr ? 'اسحب أو استخدم الأسهم للتنقل' : 'Swipe or use arrows to browse'}</span>
            </span>

            <button
              onClick={handleViewAll}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#d4af37]/70 text-[#f3e5ab] hover:bg-[#d4af37] hover:text-[#102a1c] text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ── 3D Card Stack Stage: FULLY VISIBLE with NO CLIPPING / OVERFLOW-VISIBLE ── */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative w-full flex items-center justify-center py-8 sm:py-12 min-h-[480px] sm:min-h-[520px]"
        >
          {/* Vertical Big Number Counter (Left Side) */}
          <div className="absolute left-2 sm:left-6 md:left-12 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col items-center pointer-events-none">
            <span className="text-4xl sm:text-6xl font-extralight text-white font-mono tabular-nums drop-shadow-lg">
              {String(active + 1).padStart(2, "0")}
            </span>
            <div className="my-3 h-[1px] w-10 bg-[#d4af37]/50" />
            <span className="text-sm font-mono text-white/50 tabular-nums">
              {String(n).padStart(2, "0")}
            </span>
          </div>

          {/* Vertical Indicator Pills (Right Side) */}
          <div className="absolute right-2 sm:right-6 md:right-12 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col gap-2.5 pointer-events-auto">
            {products.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Jump to bouquet ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-300 cursor-pointer",
                  i === active
                    ? "h-8 w-2.5 bg-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.9)]"
                    : "h-2.5 w-2.5 bg-white/25 hover:bg-white/60"
                )}
              />
            ))}
          </div>

          {/* ── Working Navigation Arrow: LEFT (Positioned Safely at Card Level) ──── */}
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
            className="absolute left-1 sm:left-16 md:left-24 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#102a1c] hover:bg-[#1f4a32] text-[#f3e5ab] hover:text-white border-2 border-[#d4af37] shadow-[0_6px_25px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer pointer-events-auto backdrop-blur-md group"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* ── Working Navigation Arrow: RIGHT (Positioned Safely at Card Level) ─── */}
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
            className="absolute right-1 sm:right-16 md:right-24 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#102a1c] hover:bg-[#1f4a32] text-[#f3e5ab] hover:text-white border-2 border-[#d4af37] shadow-[0_6px_25px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer pointer-events-auto backdrop-blur-md group"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* ── 3D Card Stage Container ────────────────────────────────────────── */}
          <div
            className="relative flex items-center justify-center overflow-visible"
            style={{
              width: cardWidth,
              height: cardHeight,
              perspective: `${perspective}px`,
              touchAction: "pan-y",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {products.map((product, i) => {
              let rel = i - active;
              if (rel > n / 2) rel -= n;
              if (rel < -n / 2) rel += n;

              const ax = Math.abs(rel);
              const isActive = rel === 0;

              let sc = 1;
              let tx = 0;
              let tz = 0;
              let ry = 0;
              let rz = 0;
              let op = 1;
              let zIndex = 10;

              if (isActive) {
                sc = 1;
                tx = 0;
                tz = 0;
                ry = 0;
                rz = 0;
                op = 1;
                zIndex = 10;
              } else if (ax === 1) {
                sc = 0.82;
                tx = rel * (isMobile ? 70 : 160);
                tz = -120;
                ry = -rel * 10;
                rz = rel * 2;
                op = 0.65;
                zIndex = 8;
              } else if (ax === 2) {
                sc = 0.70;
                tx = rel * (isMobile ? 130 : 270);
                tz = -220;
                ry = -rel * 16;
                rz = rel * 4;
                op = 0.32;
                zIndex = 5;
              } else {
                sc = 0.60;
                tx = rel * 380;
                tz = -350;
                op = 0;
                zIndex = 1;
              }

              return (
                <motion.div
                  key={product.id}
                  role="group"
                  aria-roledescription="product card"
                  aria-label={isAr ? product.name : product.nameEn}
                  style={{
                    position: "absolute",
                    width: cardWidth,
                    height: cardHeight,
                    borderRadius: 24,
                    transformStyle: "preserve-3d",
                    transformOrigin: "center center",
                    zIndex,
                    cursor: isActive ? "grab" : "pointer",
                  }}
                  animate={{
                    x: tx,
                    translateZ: tz,
                    rotateY: ry,
                    rotateZ: rz,
                    scale: sc,
                    opacity: op,
                  }}
                  transition={transition}
                  onClick={() => {
                    if (didDragRef.current || touchMoved.current) return;
                    if (!isActive) {
                      goTo(i);
                    } else {
                      navigateToProduct(product);
                    }
                  }}
                >
                  {/* Card Body - 100% Fully Visible, No Bottom Cutting */}
                  <div
                    className={cn(
                      "relative w-full h-full rounded-[24px] overflow-hidden bg-[#102a1c] border transition-all duration-300",
                      isActive
                        ? "border-[#d4af37] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.85),_0_0_0_1px_rgba(212,175,55,0.4)] ring-2 ring-[#d4af37]/50"
                        : "border-white/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
                    )}
                  >
                    {/* Top Glass Reflection */}
                    <div className="absolute inset-0 rounded-[24px] bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none z-10" />

                    {/* Floral Bouquet Image */}
                    <img
                      src={product.image}
                      alt={isAr ? product.name : product.nameEn}
                      className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />

                    {/* Top Floating Discount Badge */}
                    <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-20 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b38618] text-[#102a1c] text-xs font-bold shadow-md border border-[#fbf3d5]/70 backdrop-blur-xs">
                        <Sparkles className="w-3 h-3 text-[#102a1c]" />
                        <span>{product.badge || (isAr ? 'خصم خاص' : 'Sale')}</span>
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full bg-[#102a1c]/85 text-[#f3e5ab] text-[10px] font-semibold border border-[#d4af37]/40 shadow-xs">
                        {isAr ? 'توصيل ساعتين' : '2-hr express'}
                      </span>
                    </div>

                    {/* Bottom Dark Luxury Veil */}
                    <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#06120b] via-[#06120b]/90 to-transparent pointer-events-none z-10" />

                    {/* Card Content Overlay: 100% Visible with Clean Padding */}
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-20 flex flex-col justify-end text-white">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3.5 h-3.5 fill-[#d4af37] text-[#d4af37]" />
                        <span className="text-xs font-bold text-white font-mono">{product.rating}</span>
                        <span className="text-[10px] text-white/60">({product.reviewsCount})</span>
                      </div>

                      <h3 className="font-serif font-bold text-base sm:text-lg text-white leading-tight line-clamp-1 drop-shadow-md">
                        {isAr ? product.name : product.nameEn}
                      </h3>

                      <p className="text-[11px] text-[#e6ca98] font-light mt-0.5 line-clamp-1">
                        {isAr ? product.flowerTypes?.join(' • ') || product.category : product.categoryEn}
                      </p>

                      {/* Pricing & Add to Cart Bar - 100% Clearly Visible */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/15">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg sm:text-xl font-bold font-mono text-[#d4af37]">
                              {product.price}
                            </span>
                            <span className="text-xs text-[#d4af37] font-serif">{isAr ? 'ر.س' : 'SAR'}</span>
                            {product.originalPrice && (
                              <span className="text-xs text-white/50 line-through font-mono">
                                {product.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, product)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shadow-md cursor-pointer",
                            addedId === product.id
                              ? "bg-[#25D366] text-white scale-105"
                              : "bg-gradient-to-r from-[#d4af37] to-[#b38618] hover:from-[#e5c158] hover:to-[#c69722] text-[#102a1c] hover:scale-105 active:scale-95"
                          )}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>
                            {addedId === product.id
                              ? isAr ? 'تمت الإضافة ✓' : 'Added ✓'
                              : isAr ? 'أضف للسلة' : 'Add'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom Mobile Dots & Generous Bottom Padding ───────────────────── */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 pt-4 pb-2">
          {products.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                i === active ? "w-6 bg-[#d4af37]" : "w-1.5 bg-white/30"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
