import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronRight, Sparkles, ArrowRight, Flower2, ShoppingBag } from 'lucide-react';

const FRAME_COUNT = 50;

function getFramePath(frameIndex: number): string {
  const padded = String(frameIndex).padStart(3, '0');
  return `/hero-frames/ezgif-frame-${padded}.webp`;
}

export interface FlowerFrameHeroProps {
  lang?: string;
  isMobile?: boolean;
  onCtaClick?: () => void;
  onSecondaryCtaClick?: () => void;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  primaryCtaAr?: string;
  primaryCtaEn?: string;
  secondaryCtaAr?: string;
  secondaryCtaEn?: string;
  badgeAr?: string;
  badgeEn?: string;
}

export const FlowerFrameHero: React.FC<FlowerFrameHeroProps> = ({
  lang = 'ar',
  isMobile = false,
  onCtaClick,
  onSecondaryCtaClick,
  titleAr = 'هدايا تليق بلحظاتك الاستثنائية',
  titleEn = 'Gifts Worthy of Extraordinary Moments',
  subtitleAr = 'زهور وهدايا فاخرة مختارة بعناية لتصنع لحظة لا تُنسى',
  subtitleEn = 'Carefully curated luxury flowers and gifts to create unforgettable moments',
  primaryCtaAr = 'تسوق الآن',
  primaryCtaEn = 'Shop Now',
  secondaryCtaAr = 'اكتشف المجموعة',
  secondaryCtaEn = 'Explore Collection',
  badgeAr = 'صناعة الورد الفاخر · Royal Bloom 2026',
  badgeEn = 'Luxury Flower Crafting · Royal Bloom 2026',
}) => {
  const isAr = lang === 'ar';
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // High-performance image cache ref (no re-renders on frame change)
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(1);
  const rafIdRef = useRef<number | null>(null);

  // Helper: Draw current frame onto canvas with cover aspect ratio
  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pick target image or fallback to frame 1
    let img = imagesRef.current[frameIndex - 1];
    if (!img || !img.complete || img.naturalWidth === 0) {
      img = imagesRef.current[0];
    }

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (img && img.complete && img.naturalWidth > 0) {
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const imgRatio = imgWidth / imgHeight;
      const canvasRatio = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawHeight = width / imgRatio;
        offsetY = (height - drawHeight) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      // Dark luxurious placeholder while first image loads
      ctx.fillStyle = '#041f23';
      ctx.fillRect(0, 0, width, height);
    }
  }, []);

  // Sync Canvas internal dimensions with display size & devicePixelRatio
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    const displayWidth = Math.round(rect.width);
    const displayHeight = Math.round(rect.height);

    if (displayWidth === 0 || displayHeight === 0) return;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }
    
    renderFrame(currentFrameRef.current);
  }, [renderFrame]);

  // Preload all 50 WebP frames
  useEffect(() => {
    let isMounted = true;
    const loadedImages: HTMLImageElement[] = new Array(FRAME_COUNT);
    let loadedCount = 0;

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      const index = i - 1;
      
      img.onload = () => {
        if (!isMounted) return;
        loadedImages[index] = img;
        loadedCount++;
        
        if (index === 0) {
          renderFrame(1);
        }
        
        if (loadedCount === FRAME_COUNT) {
          imagesRef.current = loadedImages;
          renderFrame(currentFrameRef.current);
        }
      };
      
      img.onerror = () => {
        if (!isMounted) return;
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          imagesRef.current = loadedImages;
        }
      };
      
      loadedImages[index] = img;
    }

    imagesRef.current = loadedImages;
    return () => {
      isMounted = false;
    };
  }, [renderFrame]);

  // Handle Scroll Progress without triggering React state updates
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Find scroll container (either closest scrollable parent or window)
    const getScrollParent = (node: HTMLElement | null): HTMLElement | Window => {
      if (!node) return window;
      let parent: HTMLElement | null = node.parentElement;
      while (parent) {
        const style = getComputedStyle(parent);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          return parent;
        }
        parent = parent.parentElement;
      }
      return window;
    };

    const scrollTarget = getScrollParent(track);

    const onScroll = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const totalScrollableDistance = rect.height - viewportHeight;
      if (totalScrollableDistance <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.max(0, Math.min(1, currentScroll / totalScrollableDistance));

      // Map 0..1 progress to frame 1..50
      const targetFrame = Math.max(1, Math.min(FRAME_COUNT, Math.floor(progress * (FRAME_COUNT - 1)) + 1));

      if (targetFrame !== currentFrameRef.current) {
        currentFrameRef.current = targetFrame;
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
        rafIdRef.current = requestAnimationFrame(() => {
          renderFrame(currentFrameRef.current);
        });
      }
    };

    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateCanvasDimensions, { passive: true });
    
    // Initial sync
    updateCanvasDimensions();
    onScroll();

    return () => {
      scrollTarget.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateCanvasDimensions);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [renderFrame, updateCanvasDimensions]);

  return (
    <div
      ref={trackRef}
      className={`relative w-full ${
        isMobile ? 'h-[160vh]' : 'h-[220vh]'
      }`}
      style={{ background: '#021816' }}
    >
      {/* Sticky Hero Container pinned during scroll track */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between select-none">
        
        {/* HTML Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Ambient Dark Gradient Overlays for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#021816] via-[#021816]/40 to-[#021816]/60 z-1" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#021816]/30 to-[#021816]/80 z-1" />

        {/* Top Floating Luxury Pill / Badge */}
        <div className="relative z-10 p-4 sm:p-8 flex items-center justify-between pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-extrabold shadow-lg pointer-events-auto">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{isAr ? badgeAr : badgeEn}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-emerald-300/80 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <span>FRAME {String(currentFrameRef.current).padStart(2, '0')} / 50</span>
          </div>
        </div>

        {/* Main Hero HTML Content Overlay */}
        <div className="relative z-10 p-4 sm:p-12 lg:p-16 max-w-4xl space-y-3 sm:space-y-5 text-white pointer-events-none mb-4 sm:mb-8">
          
          {/* Main Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black leading-tight drop-shadow-2xl tracking-tight">
            {isAr ? titleAr : titleEn}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base lg:text-lg text-emerald-100/90 max-w-2xl font-medium drop-shadow-md leading-relaxed">
            {isAr ? subtitleAr : subtitleEn}
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-3 sm:gap-4 pointer-events-auto">
            <button
              type="button"
              onClick={onCtaClick}
              className="px-5 py-2.5 sm:px-7 sm:py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-950/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isAr ? primaryCtaAr : primaryCtaEn}</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <button
              type="button"
              onClick={onSecondaryCtaClick || onCtaClick}
              className="px-5 py-2.5 sm:px-6 sm:py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/20 shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>{isAr ? secondaryCtaAr : secondaryCtaEn}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Bottom Scroll Indicator Helper */}
        <div className="relative z-10 pb-4 text-center pointer-events-none">
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-300/80 font-bold bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/20 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{isAr ? 'مرر للأسفل لتكوين الباقة الملكية' : 'Scroll down to craft the royal bouquet'}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
