import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { cn } from "../lib/utils";

export interface StoreCollectionSlide {
  id: string;
  categoryName: string;
  categoryNameEn: string;
  src: string;
  alt?: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  badge: string;
  badgeEn: string;
  itemCount: number;
}

const STORE_SLIDES: StoreCollectionSlide[] = [
  {
    id: "sc-1",
    categoryName: "باقات الورود الطبيعية",
    categoryNameEn: "Natural Flower Bouquets",
    src: "/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg",
    alt: "باقات الورود الطبيعية",
    title: "باقات الورود الطبيعية",
    titleEn: "Natural Flower Bouquets",
    subtitle: "24 تنسيقاً ملكياً منتقى بعناية",
    subtitleEn: "24 bespoke royal floral arrangements",
    badge: "الأكثر طلباً",
    badgeEn: "Top Choice",
    itemCount: 24,
  },
  {
    id: "sc-2",
    categoryName: "ورد وشوكولاتة بلجيكية فاخرة",
    categoryNameEn: "Roses & Patchi Chocolate",
    src: "/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg",
    alt: "ورد وشوكولاتة باتشي",
    title: "ورد وشوكولاتة باتشي",
    titleEn: "Roses & Patchi Chocolate",
    subtitle: "تناغم شوكولاتة باتشي وباقات الجوري",
    subtitleEn: "Patchi artisan chocolates & roses",
    badge: "باتشي وبستاني",
    badgeEn: "Patchi & Bostani",
    itemCount: 18,
  },
  {
    id: "sc-3",
    categoryName: "فازات ورود طبيعية",
    categoryNameEn: "Natural Flower Vases",
    src: "/src/assets/images/hadaya_white_orchid_penthouse_1791218732789.jpg",
    alt: "فازات كريستال ملكية",
    title: "فازات ورد كريستال",
    titleEn: "Natural Flower Vases",
    subtitle: "تحف فنية تدوم لتزيين المجالس",
    subtitleEn: "Long-lasting grand majlis crystal vases",
    badge: "فازات القصور",
    badgeEn: "Palace Vases",
    itemCount: 20,
  },
  {
    id: "sc-4",
    categoryName: "ورد و قهوة و حلا",
    categoryNameEn: "Roses with Coffee & Sweets",
    src: "https://cdn.files.salla.network/other/246985580/1b671cbc-3ffd-423d-97b8-f51660a118a4-original.webp",
    alt: "ورد وقهوة وحلا",
    title: "ورد وقهوة وحلا",
    titleEn: "Roses, Coffee & Sweets",
    subtitle: "كرم الضيافة الحجازية والقهوة",
    subtitleEn: "Authentic Hijazi hospitality & coffee",
    badge: "ضيافة الحجاز",
    badgeEn: "Hijazi Coffee",
    itemCount: 22,
  },
  {
    id: "sc-5",
    categoryName: "ورد و كيك",
    categoryNameEn: "Korean Bento Cake & Roses",
    src: "/src/assets/images/hadaya_luxury_velvet_cake_1791218716453.jpg",
    alt: "كيك بنتو كوري وورد",
    title: "ورد وكيك بنتو كوري",
    titleEn: "Korean Bento Cake & Roses",
    subtitle: "كيك طازج وباقات لأعياد الميلاد",
    subtitleEn: "Fresh bakery paired with fresh roses",
    badge: "طازج يومياً",
    badgeEn: "Fresh Daily",
    itemCount: 19,
  },
  {
    id: "sc-6",
    categoryName: "هدايا رجالية",
    categoryNameEn: "Royal Keepsakes & Gifts",
    src: "/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg",
    alt: "هدايا ملكية فاخرة",
    title: "أطقم الإهداء الملكية",
    titleEn: "Royal Keepsakes & Gifts",
    subtitle: "أطقم عطور وساعات وباقات فاخرة",
    subtitleEn: "Niche perfumes, watches & floral boxes",
    badge: "أطقم خاصة",
    badgeEn: "Royal Sets",
    itemCount: 16,
  },
];

const EASING_TWEEN: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const StoreCollections3DGallery: React.FC = () => {
  const { language, navigateToCategory } = useApp();
  const isAr = language === 'ar';

  const slides = STORE_SLIDES;
  const n = slides.length;

  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const lockRef = useRef(false);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const didDragRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "200px" });

  // Responsive card size detection
  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const cardWidth = isMobile ? 260 : 340;
  const cardHeight = isMobile ? 330 : 420;
  const radius = 16;
  const tilt = isMobile ? 12 : 16;
  const sideTilt = isMobile ? 4 : 6;
  const gap = isMobile ? 6 : 9;
  const depth = isMobile ? 180 : 240;
  const scaleStep = isMobile ? 0.16 : 0.14;
  const perspective = 1500;
  const dimOpacity = 50;
  const animationDuration = 0.65;
  const maxVisible = 2;

  const lastStepTime = useRef(0);

  // Step function - instantaneous and reliable
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

  // Autoplay (4.5 seconds delay, pauses when out of view)
  useEffect(() => {
    if (n < 2 || !isInView) return;
    const id = window.setInterval(() => {
      step(1);
    }, 4500);
    return () => window.clearInterval(id);
  }, [n, step, isInView]);

  // Pointer drag
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
    if (Math.abs(e.clientX - dragStartX.current) > 8) {
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
      step(delta < 0 ? 1 : -1);
    }
    setTimeout(() => {
      didDragRef.current = false;
    }, 50);
  };

  // Touch handlers
  const touchStartX = useRef<number | null>(null);
  const touchMoved = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchMoved.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    if (Math.abs(e.touches[0].clientX - touchStartX.current) > 8) {
      touchMoved.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 25) {
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

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center select-none overflow-hidden will-change-transform py-6"
      style={{
        minHeight: cardHeight + 80,
        perspective: `${perspective}px`,
        touchAction: "pan-y",
      }}
      tabIndex={0}
      role="region"
      aria-roledescription="3d carousel"
      aria-label={isAr ? "تشكيلات المتجر ثلاثية الأبعاد" : "3D Store Collections Carousel"}
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
        className="absolute left-1 sm:left-3 md:left-5 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#102a1c] hover:bg-[#1a402c] text-[#f3e5ab] hover:text-white border-2 border-[#d4af37] shadow-[0_6px_25px_rgba(0,0,0,0.45)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-md group pointer-events-auto"
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
        className="absolute right-1 sm:right-3 md:right-5 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#102a1c] hover:bg-[#1a402c] text-[#f3e5ab] hover:text-white border-2 border-[#d4af37] shadow-[0_6px_25px_rgba(0,0,0,0.45)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-md group pointer-events-auto"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* ── 3D Stage ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          width: cardWidth,
          height: cardHeight,
          transformStyle: "preserve-3d",
          pointerEvents: "none",
        }}
      >
        {slides.map((slide, i) => {
          let rel = i - active;
          if (rel > n / 2) rel -= n;
          if (rel < -n / 2) rel += n;

          const ax = Math.abs(rel);
          const visible = ax <= maxVisible;
          const isActive = rel === 0;
          const sc = Math.max(0.35, 1 - ax * scaleStep);
          const tx = rel * (gap * (isMobile ? 24 : 32));
          const tz = -ax * depth;
          const ry = -rel * tilt;
          const rz = rel * sideTilt;

          return (
            <motion.div
              key={slide.id}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: cardWidth,
                height: cardHeight,
                borderRadius: radius,
                overflow: "hidden",
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
                pointerEvents: visible ? "auto" : "none",
                willChange: "transform, opacity",
                cursor: isActive ? "default" : "pointer",
                boxShadow: isActive
                  ? "0 25px 50px -12px rgba(16, 42, 28, 0.45), 0 10px 20px -8px rgba(212, 175, 55, 0.25)"
                  : "0 10px 25px -8px rgba(0,0,0,0.3)",
              }}
              animate={{
                x: `calc(-50% + ${tx}px)`,
                y: "-50%",
                translateZ: tz,
                rotateY: ry,
                rotateZ: rz,
                scale: sc,
                opacity: visible ? 1 : 0,
              }}
              transition={transition}
              onClick={() => {
                if (didDragRef.current || touchMoved.current) return;
                if (isActive) {
                  navigateToCategory(slide.categoryName);
                } else if (visible) {
                  goTo(i);
                }
              }}
              aria-label={isAr ? slide.title : slide.titleEn}
              aria-hidden={!visible}
            >
              {/* Product Background Image */}
              <img
                src={slide.src}
                alt={isAr ? slide.title : slide.titleEn}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="w-full h-full object-cover object-center absolute inset-0 select-none pointer-events-none"
              />

              {/* Gradient Veil for readable text */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(0deg, rgba(16,42,28,0.92) 0%, rgba(16,42,28,0.45) 50%, rgba(0,0,0,0.1) 100%)",
                }}
              />

              {/* Top Golden Badge */}
              <div className="absolute top-4 right-4 rtl:right-4 rtl:left-auto ltr:left-4 ltr:right-auto z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#102a1c]/80 backdrop-blur-md text-[#f3e5ab] border border-[#d4af37]/50 shadow-md">
                  <Sparkles className="w-3 h-3 text-[#d4af37]" />
                  <span>{isAr ? slide.badge : slide.badgeEn}</span>
                </span>
              </div>

              {/* Bottom Card Details */}
              <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-10 text-white flex flex-col justify-end">
                <p className="text-[11px] sm:text-xs font-mono text-[#d4af37] font-semibold tracking-wider uppercase mb-1">
                  {slide.itemCount} {isAr ? "منتج فاخر" : "Luxury Items"}
                </p>

                <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-serif leading-tight text-white drop-shadow-md mb-1.5">
                  {isAr ? slide.title : slide.titleEn}
                </h3>

                <p className="text-xs sm:text-sm text-white/80 font-light leading-snug line-clamp-2 mb-3">
                  {isAr ? slide.subtitle : slide.subtitleEn}
                </p>

                {/* View Category Action Button on Active Card */}
                {isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToCategory(slide.categoryName);
                    }}
                    className="mt-1 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca98] text-[#102a1c] font-bold text-xs sm:text-sm shadow-md hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isAr ? "تصفح التشكيلة الكاملة" : "Explore Collection"}</span>
                    {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Dim overlay on non-active tilted cards */}
              <motion.div
                className="absolute inset-0 bg-black pointer-events-none"
                animate={{ opacity: isActive ? 0 : dimValue }}
                transition={transition}
              />
            </motion.div>
          );
        })}
      </div>

      {/* ── Controls bar ───────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-3 sm:gap-4 mt-6 px-4 py-2 rounded-full",
          "bg-[#102a1c]/85 border border-[#d4af37]/40 shadow-xl",
          "backdrop-blur-md text-[#f3e5ab]"
        )}
        style={{ pointerEvents: "all" }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        {/* Prev Arrow */}
        <motion.button
          aria-label={isAr ? "السابق" : "Previous"}
          onClick={(e) => {
            e.stopPropagation();
            step(isAr ? 1 : -1);
          }}
          className="p-1.5 sm:p-2 rounded-full hover:bg-white/15 text-[#f3e5ab] transition-colors cursor-pointer"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          {isAr ? <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />}
        </motion.button>

        {/* Dots */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {slides.map((_, i) => (
            <motion.button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
              className="rounded-full cursor-pointer transition-colors"
              animate={{
                width: active === i ? 24 : 7,
                height: 7,
                backgroundColor: active === i ? "#d4af37" : "rgba(255,255,255,0.35)",
              }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.45 }}
              style={{ minWidth: 7 }}
            />
          ))}
        </div>

        {/* Counter */}
        <span className="text-xs font-mono font-bold text-[#f3e5ab]/80 px-1">
          0{active + 1} / 0{n}
        </span>

        {/* Next Arrow */}
        <motion.button
          aria-label={isAr ? "التالي" : "Next"}
          onClick={(e) => {
            e.stopPropagation();
            step(isAr ? -1 : 1);
          }}
          className="p-1.5 sm:p-2 rounded-full hover:bg-white/15 text-[#f3e5ab] transition-colors cursor-pointer"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          {isAr ? <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />}
        </motion.button>
      </div>
    </div>
  );
};
