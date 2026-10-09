import React, { useState, useEffect } from 'react';
import {
  Gift,
  Truck,
  CreditCard,
  ShieldCheck,
  Headphones,
  Award,
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  Star,
  Play,
  ArrowRight,
  ArrowUpRight,
  X,
  ShoppingCart,
  Zap,
  Plus,
  Minus,
  MessageCircle,
  ArrowUp,
  Phone,
  Store,
  Users,
  Package,
  Heart,
  Eye,
  Calendar,
} from 'lucide-react';
import type { AllThemeSettings } from '../../themes/settings/themeSettingsStore';
import type { Product } from '../../types';
import { FlowerFrameHero } from '../../themes/flowersPremium/FlowerFrameHero';

// ==========================================
// 1. ANNOUNCEMENT BAR (SECTION 13)
// ==========================================
export const SfAnnouncementBar: React.FC<{
  settings: AllThemeSettings['announcementBar'];
  phone: string;
  lang: string;
  currency: string;
  onCtaClick?: () => void;
}> = ({ settings, phone, lang, currency, onCtaClick }) => {
  const [closed, setClosed] = useState(false);
  const [activeMsgIdx, setActiveMsgIdx] = useState(0);

  useEffect(() => {
    if (settings.messages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveMsgIdx((prev) => (prev + 1) % settings.messages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [settings.messages.length]);

  if (!settings.enabled || closed) return null;

  const currentMsg = settings.messages[activeMsgIdx] || settings.messages[0];

  return (
    <div
      className={`text-white px-4 py-2 text-[11px] font-medium flex items-center justify-between gap-3 shadow-xs border-b border-black/20 ${
        settings.stickyOnScroll ? 'sticky top-0 z-30' : ''
      }`}
      style={{
        background:
          settings.bgType === 'gradient'
            ? `linear-gradient(90deg, ${settings.bgColor} 0%, #e11d48 100%)`
            : settings.bgColor,
        color: settings.textColor,
      }}
    >
      <div className="flex items-center gap-2 truncate min-w-0">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
        <span className="truncate font-semibold">
          {currentMsg ? currentMsg.text : (lang === 'ar' ? 'توصيل سريع لكافة أحياء وفنادق مكة' : 'Express delivery in Makkah')}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {settings.enableCountdown && (
          <div className="hidden sm:flex items-center gap-1 font-mono font-black text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-white text-slate-900 shadow-xs">02</span>
            <span>:</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-slate-900 shadow-xs">15</span>
            <span>:</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-slate-900 shadow-xs">30</span>
          </div>
        )}

        {settings.showButton && (
          <button
            type="button"
            onClick={onCtaClick}
            className="px-2.5 py-0.5 rounded-lg bg-white text-slate-950 text-[10px] font-black shadow-xs cursor-pointer hover:bg-slate-100 transition-colors"
          >
            {settings.buttonText}
          </button>
        )}

        {settings.showCloseButton && (
          <button
            type="button"
            onClick={() => setClosed(true)}
            className="text-white/80 hover:text-white cursor-pointer p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. ADVANCED HERO SLIDER (SECTION 05)
// ==========================================
export const SfHeroSlider: React.FC<{
  settings: AllThemeSettings['slider'];
  lang: string;
  isMobile?: boolean;
  onCtaClick?: () => void;
}> = ({ settings, lang, isMobile = false, onCtaClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if ((settings as any)?.heroWidgetType === 'flower-scroll-hero' || (settings as any)?.heroWidgetType === 'Luxury Flower Scroll Hero') {
    return (
      <FlowerFrameHero
        lang={lang}
        isMobile={isMobile}
        onCtaClick={onCtaClick}
        onSecondaryCtaClick={onCtaClick}
      />
    );
  }

  useEffect(() => {
    if (!settings.autoPlay || settings.slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % settings.slides.length);
    }, (settings.transitionDuration || 5) * 1000);
    return () => clearInterval(timer);
  }, [settings.autoPlay, settings.slides.length, settings.transitionDuration]);

  if (!settings.slides.length) return null;

  const alignClass = (settings as any).textAlignment === 'center'
    ? 'items-center text-center'
    : (settings as any).textAlignment === 'right'
      ? 'items-end text-right'
      : 'items-start text-left';

  return (
    <div className={`relative overflow-hidden bg-slate-950 ${
      isMobile ? 'min-h-[220px] aspect-16/9' : 'aspect-16/7 sm:aspect-21/8'
    }`}>
      {settings.slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            loading={idx === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-full object-cover object-center filter brightness-85"
          />
          <div className={`absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent flex flex-col justify-end p-4 sm:p-12 text-white ${alignClass}`}>
            {slide.badge && (
              <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-500 text-slate-950 font-black text-[9px] sm:text-xs rounded-full mb-1.5 shadow-md">
                {slide.badge}
              </span>
            )}
            <h2 className="text-base sm:text-3xl lg:text-4xl font-black max-w-2xl leading-tight drop-shadow-md">
              {slide.title}
            </h2>
            <p className="hidden sm:block text-xs sm:text-sm text-slate-200 mt-1 max-w-xl drop-shadow-sm line-clamp-2">
              {slide.subtitle}
            </p>
            <div className="mt-2.5 sm:mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={onCtaClick}
                className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 font-black text-[11px] sm:text-xs shadow-lg transition-transform active:scale-95 inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                style={{
                  background: settings.buttonStyle === 'filled' ? settings.buttonBgColor : 'transparent',
                  color: settings.buttonTextColor,
                  border: `2px solid ${settings.buttonBgColor}`,
                  borderRadius: `${settings.buttonBorderRadius}px`,
                }}
              >
                <span>{slide.buttonText}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Controls */}
      {settings.slides.length > 1 && (
        <>
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentSlide((p) => (p === 0 ? settings.slides.length - 1 : p - 1))}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide((p) => (p === settings.slides.length - 1 ? 0 : p + 1))}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {settings.slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 3. ENHANCED FEATURES / TRUST (SECTION 14)
// ==========================================
export const SfEnhancedFeatures: React.FC<{
  settings: AllThemeSettings['enhancedFeatures'];
  lang: string;
  isMobile?: boolean;
  mobileDisplayMode?: '2-columns' | '1-column';
}> = ({ settings, lang, isMobile, mobileDisplayMode = '2-columns' }) => {
  if (!settings.enabled) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Truck': return <Truck className="w-6 h-6 text-emerald-600" />;
      case 'CreditCard': return <CreditCard className="w-6 h-6 text-blue-600" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6 text-amber-600" />;
      case 'Headphones': return <Headphones className="w-6 h-6 text-purple-600" />;
      default: return <Award className="w-6 h-6 text-emerald-600" />;
    }
  };

  const gridClass = isMobile
    ? mobileDisplayMode === '1-column'
      ? 'grid-cols-1 gap-3.5'
      : 'grid-cols-2 gap-3'
    : settings.itemsPerRowDesktop === 4
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
    : 'grid-cols-1 sm:grid-cols-3 gap-4';

  return (
    <div className="p-4 sm:p-8 space-y-6 border-b" style={{ borderColor: 'var(--sf-border, #e2e8f0)' }}>
      <div className="text-center max-w-xl mx-auto space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
          WHY SHOP WITH US?
        </span>
        <h3 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--sf-text, #0f172a)' }}>
          {settings.mainTitle}
        </h3>
        <p className="text-xs" style={{ color: 'var(--sf-muted, #64748b)' }}>
          {settings.subtitle}
        </p>
      </div>

      <div className={`grid ${gridClass}`}>
        {settings.features.map((feat) => {
          if (settings.layoutStyle === 'floating') {
            return (
              <div key={feat.id} className="text-center p-4 space-y-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  {getIcon(feat.icon)}
                </div>
                <h4 className="text-xs font-bold" style={{ color: 'var(--sf-text, #0f172a)' }}>{feat.title}</h4>
              </div>
            );
          }

          if (settings.layoutStyle === 'glass') {
            return (
              <div
                key={feat.id}
                className="p-5 rounded-2xl border backdrop-blur-md shadow-sm space-y-2 text-center"
                style={{
                  background: 'var(--sf-surface, #ffffff)',
                  borderColor: 'var(--sf-border, #e2e8f0)',
                  color: 'var(--sf-text, #0f172a)',
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto">
                  {getIcon(feat.icon)}
                </div>
                <h4 className="text-xs font-black" style={{ color: 'var(--sf-text, #0f172a)' }}>{feat.title}</h4>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--sf-muted, #64748b)' }}>{feat.description}</p>
              </div>
            );
          }

          // Classic Cards Default
          return (
            <div
              key={feat.id}
              className="rounded-2xl border p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              style={{
                background: 'var(--sf-surface, #ffffff)',
                borderColor: 'var(--sf-border, #e2e8f0)',
                color: 'var(--sf-text, #0f172a)',
              }}
            >
              <div className="space-y-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                  {getIcon(feat.icon)}
                </div>
                <h4 className="text-xs sm:text-sm font-black" style={{ color: 'var(--sf-text, #0f172a)' }}>{feat.title}</h4>
                <p className="text-[11px] sm:text-xs leading-relaxed" style={{ color: 'var(--sf-muted, #64748b)' }}>{feat.description}</p>
              </div>
              {feat.linkText && (
                <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1 cursor-pointer hover:underline pt-2">
                  <span>{feat.linkText}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 4. SPECIAL OFFER WITH COUNTDOWN (SECTION 17)
// ==========================================
export const SfSpecialOfferCountdown: React.FC<{
  settings: AllThemeSettings['specialOffer'];
  lang: string;
  onCtaClick?: () => void;
}> = ({ settings, lang, onCtaClick }) => {
  if (!settings.enabled) return null;

  return (
    <div className="p-4 sm:p-8">
      <div
        className="relative rounded-3xl overflow-hidden border shadow-lg p-6 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8"
        style={{ borderColor: 'var(--sf-border, #e2e8f0)', background: settings.bgColor }}
      >
        <img
          src={settings.bgImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter brightness-95 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent dark:from-slate-950/95 dark:via-slate-950/80" />

        <div className="relative z-10 max-w-lg space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm">
            <Flame className="w-3.5 h-3.5" />
            <span>{settings.badgeText}</span>
          </span>

          <h3 className="text-2xl sm:text-4xl font-black leading-tight" style={{ color: 'var(--sf-text, #0f172a)' }}>
            {settings.title}
          </h3>

          <p className="text-xs sm:text-sm" style={{ color: 'var(--sf-muted, #475569)' }}>
            {settings.description}
          </p>

          {/* Countdown Boxes */}
          <div className="flex items-center gap-2 pt-1 font-mono text-center">
            <div className="border rounded-2xl p-2.5 min-w-[56px] shadow-sm" style={{ background: 'var(--sf-surface, #ffffff)', borderColor: 'var(--sf-border, #e2e8f0)' }}>
              <span className="text-xl sm:text-2xl font-black block" style={{ color: 'var(--sf-text, #0f172a)' }}>05</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-bold" style={{ color: 'var(--sf-muted, #64748b)' }}>Days</span>
            </div>
            <div className="border rounded-2xl p-2.5 min-w-[56px] shadow-sm" style={{ background: 'var(--sf-surface, #ffffff)', borderColor: 'var(--sf-border, #e2e8f0)' }}>
              <span className="text-xl sm:text-2xl font-black block" style={{ color: 'var(--sf-text, #0f172a)' }}>12</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-bold" style={{ color: 'var(--sf-muted, #64748b)' }}>Hours</span>
            </div>
            <div className="border rounded-2xl p-2.5 min-w-[56px] shadow-sm" style={{ background: 'var(--sf-surface, #ffffff)', borderColor: 'var(--sf-border, #e2e8f0)' }}>
              <span className="text-xl sm:text-2xl font-black block" style={{ color: 'var(--sf-text, #0f172a)' }}>34</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-bold" style={{ color: 'var(--sf-muted, #64748b)' }}>Mins</span>
            </div>
            <div className="border rounded-2xl p-2.5 min-w-[56px] shadow-sm" style={{ background: 'var(--sf-surface, #ffffff)', borderColor: 'var(--sf-border, #e2e8f0)' }}>
              <span className="text-xl sm:text-2xl font-black block" style={{ color: 'var(--sf-text, #0f172a)' }}>21</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-bold" style={{ color: 'var(--sf-muted, #64748b)' }}>Secs</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onCtaClick}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-950 text-white font-black text-xs shadow-lg cursor-pointer hover:bg-slate-800 transition-all hover:scale-105"
            >
              <span>{settings.buttonText}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {settings.showProductImage && (
          <div className="relative z-10 w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border shadow-2xl shrink-0 hidden md:block">
            <img src={settings.productImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 5. SHOP BY CATEGORY / CUSTOM LINKS (SECTION 10)
// ==========================================
// ==========================================
// 5. SHOP BY CATEGORY / CUSTOM LINKS (SECTION 10)
// ==========================================
export const SfShopByCategory: React.FC<{
  settings: AllThemeSettings['customLinks'];
  lang: string;
  isMobile?: boolean;
  mobileDisplayMode?: '2-columns' | '1-column';
  onCategoryClick?: (category: string, linkType?: string) => void;
}> = ({ settings, lang, isMobile, mobileDisplayMode = '2-columns', onCategoryClick }) => {
  const isAr = lang === 'ar';
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!settings.enabled) return null;

  // Auto Slider
  useEffect(() => {
    if (!settings.enableAutoSlider || !settings.displayAsSlider) return;
    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        if (Math.abs(scrollLeft) >= scrollWidth - clientWidth - 20) {
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, (settings.sliderSpeed || 5) * 1000);
    return () => clearInterval(interval);
  }, [settings.enableAutoSlider, settings.displayAsSlider, settings.sliderSpeed]);

  const checkScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(Math.abs(scrollLeft) > 10);
      setCanScrollRight(Math.abs(scrollLeft) < scrollWidth - clientWidth - 10);
    }
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      sliderRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Rounded corners
  const roundedClass =
    settings.roundedCorners === 'none'
      ? 'rounded-none'
      : settings.roundedCorners === 'small'
        ? 'rounded-lg'
        : settings.roundedCorners === 'large'
          ? 'rounded-3xl'
          : settings.roundedCorners === 'full'
            ? 'rounded-full'
            : 'rounded-2xl';

  // Aspect ratio
  const aspectClass =
    settings.aspectRatio === 'square'
      ? 'aspect-square'
      : settings.aspectRatio === 'portrait'
        ? 'aspect-3/4'
        : settings.aspectRatio === 'standard'
          ? 'aspect-4/3'
          : 'aspect-16/9 sm:aspect-21/9';

  // Desktop columns mapping
  const desktopColsClass =
    settings.desktopColumns === 2
      ? 'sm:grid-cols-2'
      : settings.desktopColumns === 3
        ? 'sm:grid-cols-3'
        : settings.desktopColumns === 5
          ? 'sm:grid-cols-5'
          : settings.desktopColumns === 6
            ? 'sm:grid-cols-6'
            : settings.desktopColumns === 7
              ? 'sm:grid-cols-7'
              : settings.desktopColumns === 8
                ? 'sm:grid-cols-8'
                : 'sm:grid-cols-4';

  // Mobile columns mapping
  const mobileColsClass =
    settings.mobileColumns === 1
      ? 'grid-cols-1'
      : settings.mobileColumns === 3
        ? 'grid-cols-3'
        : settings.mobileColumns === 4
          ? 'grid-cols-4'
          : settings.mobileColumns === 5
            ? 'grid-cols-5'
            : mobileDisplayMode === '1-column'
              ? 'grid-cols-1'
              : 'grid-cols-2';

  // Image Overlay
  const overlayClass =
    settings.enableOverlay === false
      ? 'bg-transparent'
      : settings.overlayStyle === 'dark'
        ? 'bg-black/60'
        : settings.overlayStyle === 'blur'
          ? 'bg-black/40 backdrop-blur-xs'
          : settings.overlayStyle === 'custom'
            ? 'bg-slate-950/70'
            : 'bg-gradient-to-t from-black/90 via-black/35 to-transparent';

  // Hover Effect
  const hoverImgClass =
    settings.hoverEffect === 'fade'
      ? 'group-hover:opacity-75 transition-opacity duration-300'
      : settings.hoverEffect === 'blur'
        ? 'group-hover:blur-xs transition-all duration-300'
        : settings.hoverEffect === 'grayscale'
          ? 'grayscale group-hover:grayscale-0 transition-all duration-500'
          : 'group-hover:scale-110 transition-transform duration-700 ease-out';

  const hoverCardClass =
    settings.hoverEffect === 'slide-up' || settings.hoverEffect === 'lift'
      ? 'hover:-translate-y-2 hover:shadow-2xl transition-all duration-300'
      : 'transition-all duration-300 hover:shadow-lg';

  // Text Position
  const textPositionClass =
    settings.textPosition === 'center'
      ? 'justify-center items-center text-center'
      : settings.textPosition === 'top-left'
        ? 'justify-start items-start text-start'
        : settings.textPosition === 'top-right'
          ? 'justify-start items-end text-end'
          : settings.textPosition === 'bottom-right'
            ? 'justify-end items-end text-end'
            : 'justify-end items-start text-start';

  const isSlider = settings.displayAsSlider || settings.layoutStyle === 'slider';

  return (
    <section
      className={`py-6 space-y-6 ${
        settings.makeFullWidth ? 'w-full px-3 sm:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6'
      }`}
    >
      {/* Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
            {isAr ? 'عروض وتشكيلات خاصة' : 'SPECIAL OFFERS & COLLECTIONS'}
          </span>
          <h3 className="text-xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--sf-text, #0f172a)' }}>
            {settings.title}
          </h3>
          {settings.subtitle && (
            <p className="text-xs sm:text-sm" style={{ color: 'var(--sf-muted, #64748b)' }}>
              {settings.subtitle}
            </p>
          )}
        </div>

        {/* Slider Navigation Arrows */}
        {isSlider && settings.showNavArrows !== false && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => scrollSlider('left')}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollSlider('right')}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Slider View */}
      {isSlider ? (
        <div
          ref={sliderRef}
          onScroll={checkScroll}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-2 select-none"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {settings.links.map((link) => (
            <div
              key={link.id}
              onClick={() => onCategoryClick?.(link.category || link.title, link.linkType)}
              className={`group relative overflow-hidden border shadow-sm cursor-pointer p-5 flex flex-col ${textPositionClass} ${roundedClass} ${aspectClass} ${hoverCardClass} shrink-0 w-[260px] sm:w-[320px] lg:w-[360px]`}
              style={{
                borderColor: 'var(--sf-border, #e2e8f0)',
                background: '#04222b',
                scrollSnapAlign: 'start',
              }}
            >
              {/* Image */}
              <img
                src={link.image}
                alt={link.title}
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 w-full h-full ${
                  settings.imageDisplayMode === 'full' ? 'object-contain' : 'object-cover'
                } ${hoverImgClass}`}
              />
              <div className={`absolute inset-0 ${overlayClass}`} />

              {/* Content overlay */}
              <div className="relative z-10 text-white space-y-1.5 max-w-full drop-shadow-md">
                {link.linkType && (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 text-[9px] font-black uppercase tracking-wider backdrop-blur-xs">
                    {link.linkType}
                  </span>
                )}
                <h4 className="text-base sm:text-lg font-black leading-tight">{link.title}</h4>
                {link.subtitle && <p className="text-[11px] text-white/80 line-clamp-2">{link.subtitle}</p>}

                {(link.showButton ?? settings.showButtonOnBanner ?? true) && (
                  <div className="pt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md transition-all active:scale-95 ${
                        link.buttonStyle === 'outline'
                          ? 'border border-white text-white hover:bg-white hover:text-slate-950'
                          : link.buttonStyle === 'glass'
                            ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                      style={{
                        backgroundColor:
                          link.buttonStyle === 'outline'
                            ? 'transparent'
                            : link.buttonColor || settings.buttonColor || undefined,
                      }}
                    >
                      <span>{link.buttonText || settings.buttonText || (isAr ? 'تسوق الآن' : 'Shop Now')}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Bento / Grid View */
        <div className={`grid ${mobileColsClass} ${desktopColsClass} gap-3 sm:gap-5`}>
          {settings.links.map((link) => (
            <div
              key={link.id}
              onClick={() => onCategoryClick?.(link.category || link.title, link.linkType)}
              className={`group relative overflow-hidden border shadow-sm cursor-pointer p-4 sm:p-5 flex flex-col ${textPositionClass} ${roundedClass} ${aspectClass} ${hoverCardClass}`}
              style={{
                borderColor: 'var(--sf-border, #e2e8f0)',
                background: '#04222b',
              }}
            >
              {/* Background Image */}
              <img
                src={link.image}
                alt={link.title}
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 w-full h-full ${
                  settings.imageDisplayMode === 'full' ? 'object-contain' : 'object-cover'
                } ${hoverImgClass}`}
              />
              <div className={`absolute inset-0 ${overlayClass}`} />

              {/* Text & Action */}
              <div className="relative z-10 text-white space-y-1 max-w-full drop-shadow-md">
                {link.linkType && (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 text-[9px] font-black uppercase tracking-wider backdrop-blur-xs">
                    {link.linkType}
                  </span>
                )}
                <h4 className="text-sm sm:text-base font-black leading-tight">{link.title}</h4>
                {link.subtitle && <p className="text-[10px] text-white/80 line-clamp-1">{link.subtitle}</p>}

                {(link.showButton ?? settings.showButtonOnBanner ?? true) && (
                  <div className="pt-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-xl shadow-sm transition-all active:scale-95 ${
                        link.buttonStyle === 'outline'
                          ? 'border border-white text-white hover:bg-white hover:text-slate-950'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                      style={{
                        backgroundColor:
                          link.buttonStyle === 'outline'
                            ? 'transparent'
                            : link.buttonColor || settings.buttonColor || undefined,
                      }}
                    >
                      <span>{link.buttonText || settings.buttonText || (isAr ? 'تسوق الآن' : 'Shop Now')}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// ==========================================
// 6. PRODUCT VIDEOS (SECTION 06)
// ==========================================
export const SfProductVideos: React.FC<{
  settings: AllThemeSettings['videos'];
  lang: string;
  money: (amount: number) => string;
  isMobile?: boolean;
}> = ({ settings, lang, money, isMobile }) => {
  if (!settings.enabled) return null;

  return (
    <div className="p-4 sm:p-8 space-y-6 border-t border-slate-200/80 dark:border-slate-800">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-black" style={{ color: 'var(--sf-text, #0f172a)' }}>{settings.elementTitle}</h3>
        <p className="text-xs" style={{ color: 'var(--sf-muted, #64748b)' }}>{settings.subtitle}</p>
      </div>

      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {settings.videoProducts.map((vp) => (
          <div
            key={vp.id}
            className="group relative rounded-2xl overflow-hidden border shadow-md flex flex-col justify-end aspect-9/16 cursor-pointer"
            style={{ borderColor: 'var(--sf-border, #e2e8f0)', background: '#111827' }}
          >
            <img
              src={vp.poster}
              alt={vp.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

            {settings.promotionalVideoBadge && (
              <span className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 backdrop-blur-xs text-white flex items-center gap-1">
                <Play className="w-2.5 h-2.5 fill-white" /> {settings.promoBadgeText}
              </span>
            )}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-white translate-x-0.5" />
              </div>
            </div>

            <div className="relative z-10 p-3 text-white space-y-1">
              <h4 className="text-xs font-bold leading-tight truncate">{vp.name}</h4>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300">{money(vp.price)}</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded">4K Video</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 7. BENTO IMAGE GRID (SECTION 09)
// ==========================================
export const SfBentoImageGrid: React.FC<{
  settings: AllThemeSettings['imageGrid'];
  lang: string;
  isMobile?: boolean;
  onItemClick?: () => void;
}> = ({ settings, lang, isMobile, onItemClick }) => {
  if (!settings.enabled) return null;

  return (
    <div className="p-4 sm:p-8 space-y-4">
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} min-h-[300px]`}>
        {settings.items.map((item, idx) => (
          <div
            key={item.id}
            onClick={onItemClick}
            className={`group relative rounded-2xl overflow-hidden border shadow-sm cursor-pointer transition-all duration-300 min-h-[160px] flex flex-col justify-end p-4 ${
              idx === 0 ? 'sm:col-span-1 sm:row-span-2 min-h-[340px]' : idx === 1 ? 'sm:col-span-2 min-h-[160px]' : 'col-span-1'
            }`}
            style={{ borderColor: 'var(--sf-border, #e2e8f0)' }}
          >
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="relative z-10 text-white flex items-end justify-between">
              <div>
                <h4 className="text-sm font-black">{item.title}</h4>
                <p className="text-[11px] text-white/80">{item.subtitle}</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 8. PROMOTIONAL BANNERS (SECTION 11)
// ==========================================
export const SfPromotionalBanner: React.FC<{
  settings: AllThemeSettings['banners'];
  lang: string;
  onCtaClick?: () => void;
}> = ({ settings, lang, onCtaClick }) => {
  if (!settings.enabled || !settings.banners.length) return null;

  const banner = settings.banners[0];

  return (
    <div className="p-4 sm:p-8">
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg border min-h-[220px] sm:min-h-0 sm:aspect-21/7 flex items-center"
        style={{ borderColor: 'var(--sf-border, #e2e8f0)', background: '#1c1917' }}
      >
        <img
          src={banner.image}
          alt={banner.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover filter brightness-85"
        />
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: `${settings.overlayOpacity}%` }}
        />

        <div className="relative z-10 p-5 sm:p-12 max-w-xl text-white space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950">
            {banner.discountBadge}
          </span>
          <h3 className="text-lg sm:text-3xl font-black drop-shadow-md leading-tight">{banner.title}</h3>
          <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">{banner.subtitle}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onCtaClick}
              className="px-5 py-2.5 rounded-xl bg-slate-950 text-white font-bold text-xs shadow-md cursor-pointer hover:bg-slate-800 transition-colors"
            >
              {banner.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 9. STORE STATISTICS (SECTION 18)
// ==========================================
export const SfStoreStatistics: React.FC<{
  settings: AllThemeSettings['statistics'];
  lang: string;
  isMobile?: boolean;
}> = ({ settings, lang, isMobile }) => {
  if (!settings.enabled) return null;

  const getIcon = (name: string) => {
    switch (name) {
      case 'Package': return <Package className="w-5 h-5 text-emerald-600" />;
      case 'Users': return <Users className="w-5 h-5 text-teal-600" />;
      case 'ShoppingCart': return <ShoppingCart className="w-5 h-5 text-amber-600" />;
      default: return <Store className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 border-t" style={{ borderColor: 'var(--sf-border, #e2e8f0)' }}>
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-black" style={{ color: 'var(--sf-text, #0f172a)' }}>{settings.mainTitle}</h3>
        <p className="text-xs" style={{ color: 'var(--sf-muted, #64748b)' }}>{settings.subtitle}</p>
      </div>

      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {settings.items.map((stat) => (
          <div
            key={stat.id}
            className="rounded-2xl border p-4 sm:p-5 shadow-sm text-center space-y-2 backdrop-blur-md"
            style={{
              background: 'var(--sf-surface, #ffffff)',
              borderColor: 'var(--sf-border, #e2e8f0)',
              color: 'var(--sf-text, #0f172a)',
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto">
              {getIcon(stat.icon)}
            </div>
            <span className="text-2xl sm:text-3xl font-black block font-mono" style={{ color: 'var(--sf-text, #0f172a)' }}>
              {stat.number}
            </span>
            <h4 className="text-xs font-bold" style={{ color: 'var(--sf-text, #0f172a)' }}>{stat.label}</h4>
            <p className="text-[10px]" style={{ color: 'var(--sf-muted, #64748b)' }}>{stat.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 10. BLOG SECTION (SECTION 12)
// ==========================================
export const SfBlogSection: React.FC<{
  settings: AllThemeSettings['blog'];
  lang: string;
  onViewAll?: () => void;
  onReadArticle?: (art: any) => void;
}> = ({ settings, lang, onViewAll, onReadArticle }) => {
  if (!settings.enabled) return null;

  return (
    <div className="p-4 sm:p-8 space-y-6 border-t" style={{ borderColor: 'var(--sf-border, #e2e8f0)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">OUR BLOG</span>
          <h3 className="text-2xl font-black" style={{ color: 'var(--sf-text, #0f172a)' }}>{settings.title}</h3>
          <p className="text-xs" style={{ color: 'var(--sf-muted, #64748b)' }}>{settings.subtitle}</p>
        </div>
        {settings.showViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-emerald-600 hover:underline self-start cursor-pointer flex items-center gap-1"
          >
            <span>{settings.buttonText}</span>
            <span>→</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {settings.articles[0] && (
          <div
            onClick={() => onReadArticle?.(settings.articles[0])}
            className="lg:col-span-2 rounded-2xl border overflow-hidden shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-all"
            style={{
              background: 'var(--sf-surface, #ffffff)',
              borderColor: 'var(--sf-border, #e2e8f0)',
              color: 'var(--sf-text, #0f172a)',
            }}
          >
            <div className="aspect-16/9 sm:aspect-21/10 overflow-hidden relative">
              <img src={settings.articles[0].image} alt="" className="w-full h-full object-cover" />
              <span className="absolute top-3 start-3 px-3 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white">
                {settings.articles[0].category}
              </span>
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center gap-3 text-[11px] opacity-75">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {settings.articles[0].date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {settings.articles[0].readTime}</span>
              </div>
              <h4 className="text-base font-black" style={{ color: 'var(--sf-text, #0f172a)' }}>{settings.articles[0].title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--sf-muted, #64748b)' }}>{settings.articles[0].excerpt}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {settings.articles.slice(1, 3).map((art) => (
            <div
              key={art.id}
              onClick={() => onReadArticle?.(art)}
              className="rounded-2xl border overflow-hidden shadow-sm p-4 space-y-2 cursor-pointer hover:shadow-md transition-all"
              style={{
                background: 'var(--sf-surface, #ffffff)',
                borderColor: 'var(--sf-border, #e2e8f0)',
                color: 'var(--sf-text, #0f172a)',
              }}
            >
              <div className="flex gap-3">
                <img src={art.image} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 space-y-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {art.category}
                  </span>
                  <h5 className="text-xs font-bold leading-snug line-clamp-2" style={{ color: 'var(--sf-text, #0f172a)' }}>{art.title}</h5>
                  <span className="text-[10px] opacity-70 block">{art.readTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 11. PRODUCT TABS SECTION (SECTION 07)
// ==========================================
export const SfProductTabs: React.FC<{
  settings: AllThemeSettings['tabs'];
  products: Product[];
  lang: string;
  money: (amount: number) => string;
  isMobile?: boolean;
  mobileDisplayMode?: '2-columns' | '1-column';
  onAddToCart: (p: Product) => void;
  onQuickView?: (p: Product) => void;
}> = ({ settings, products, lang, money, isMobile, mobileDisplayMode = '2-columns', onAddToCart, onQuickView }) => {
  const [selectedTab, setSelectedTab] = useState(settings.activeTab || settings.tabs[0] || 'Featured');

  if (!settings.enabled || !settings.tabs.length) return null;

  // Filter or slice products based on tab
  const tabProducts = products.slice(0, settings.numberOfProducts || 8);

  const gridClass = isMobile
    ? mobileDisplayMode === '1-column'
      ? 'grid-cols-1 gap-3.5'
      : 'grid-cols-2 gap-3'
    : 'grid-cols-2 sm:grid-cols-4 gap-4';

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            EXPLORE COLLECTIONS
          </span>
          <h3 className="text-2xl font-black" style={{ color: 'var(--sf-text, #0f172a)' }}>{settings.mainTitle}</h3>
          <p className="text-xs" style={{ color: 'var(--sf-muted, #64748b)' }}>{settings.subtitle}</p>
        </div>

        {/* Tab Switcher */}
        <div
          className={`flex items-center gap-1.5 p-1 rounded-2xl overflow-x-auto scrollbar-none border`}
          style={{
            background: 'var(--sf-surface, #ffffff)',
            borderColor: 'var(--sf-border, #e2e8f0)',
          }}
        >
          {settings.tabs.map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'hover:opacity-100 opacity-80'
                }`}
                style={
                  isActive
                    ? { background: 'var(--sf-accent, #059669)', color: '#ffffff' }
                    : { color: 'var(--sf-text, #334155)' }
                }
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className={`grid ${gridClass}`}>
        {tabProducts.map((p) => (
          <div
            key={p.id}
            className="group rounded-2xl border overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            style={{
              background: 'var(--sf-surface, #ffffff)',
              borderColor: 'var(--sf-border, #e2e8f0)',
              color: 'var(--sf-text, #0f172a)',
            }}
          >
            <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <button
                type="button"
                onClick={() => onQuickView?.(p)}
                className="absolute top-2 end-2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 cursor-pointer"
                title="Quick View"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 space-y-2">
              <div className="space-y-0.5">
                <span className="text-[10px] block truncate" style={{ color: 'var(--sf-muted, #64748b)' }}>{p.category}</span>
                <h4 className="text-xs font-bold line-clamp-1" style={{ color: 'var(--sf-text, #0f172a)' }}>{p.name}</h4>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs sm:text-sm font-black text-emerald-600">
                  {money(p.price)}
                </span>
                <button
                  type="button"
                  onClick={() => onAddToCart(p)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'أضف' : 'Add'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 12. DETAILED PRODUCT SPOTLIGHT (SECTION 08)
// ==========================================
// ==========================================
// 12. DETAILED PRODUCT SPOTLIGHT (SECTION 08)
// ==========================================
export const SfDetailedProductSpotlight: React.FC<{
  settings: AllThemeSettings['detailedProducts'];
  products: Product[];
  lang: string;
  money: (amount: number) => string;
  onAddToCart: (p: Product, qty: number) => void;
  onBuyNow?: (p: Product, qty: number) => void;
  onViewProduct?: (p: Product) => void;
}> = ({ settings, products, lang, money, onAddToCart, onBuyNow, onViewProduct }) => {
  const isAr = lang === 'ar';
  const [qty, setQty] = useState(1);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedVariationIdx, setSelectedVariationIdx] = useState(0);

  if (!settings.enabled) return null;

  const product = products.find((p) => p.id === settings.selectedProductId) || products[0];
  if (!product) return null;

  const demoVariations = [
    { labelAr: 'باقة قياسية (١٢ وردة)', labelEn: 'Standard (12 Stems)', delta: 0 },
    { labelAr: 'باقة فاخرة (٢٤ وردة)', labelEn: 'Luxury (24 Stems)', delta: 90 },
    { labelAr: 'باقة ملكية (٣٦ وردة)', labelEn: 'Royal VIP (36 Stems)', delta: 180 },
  ];

  const currentPrice = product.price + demoVariations[selectedVariationIdx].delta;
  const originalPrice = Math.round(currentPrice * 1.16);

  // Aspect ratio
  const aspectClass =
    settings.imageDimensions === 'portrait'
      ? 'aspect-3/4'
      : settings.imageDimensions === 'landscape'
        ? 'aspect-4/3'
        : 'aspect-square';

  // Display mode
  const imgModeClass = settings.imageDisplayMode === 'full' ? 'object-contain p-2' : 'object-cover';

  // Divider Icon
  const divider = settings.bannerDividerIcon?.includes('Star')
    ? '★'
    : settings.bannerDividerIcon?.includes('Dot')
      ? '•'
      : '✦';

  return (
    <div className={`p-4 sm:p-8 space-y-4 ${settings.addTopSpacing ? 'pt-8 sm:pt-14' : ''}`}>
      {/* Moving Marquee Banner */}
      {settings.movingBannerText && (
        <div
          className="py-2.5 px-4 rounded-2xl overflow-hidden flex items-center shadow-xs"
          style={{
            background: settings.bannerBgColor || '#032320',
            color: settings.bannerTextColor || '#ffffff',
          }}
        >
          <div className="flex items-center gap-8 whitespace-nowrap animate-marquee text-xs font-black tracking-wide">
            {[1, 2, 3, 4].map((i) => (
              <React.Fragment key={i}>
                <span className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                  <span>{settings.movingBannerText}</span>
                </span>
                <span className="opacity-70">{divider}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Product Spotlight Card */}
      <div
        className="rounded-3xl border shadow-md p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
        style={{
          background: 'var(--sf-surface, #ffffff)',
          borderColor: settings.cardBorderColor || 'var(--sf-border, #e2e8f0)',
          color: 'var(--sf-text, #0f172a)',
        }}
      >
        {/* Product Image Showcase */}
        <div className="space-y-3">
          <div
            className={`relative rounded-2xl overflow-hidden ${aspectClass} bg-slate-100 dark:bg-slate-800 shadow-sm group border border-slate-200 dark:border-slate-800`}
          >
            <img
              src={product.image}
              alt={product.name}
              className={`w-full h-full ${imgModeClass} group-hover:scale-105 transition-transform duration-500`}
            />

            {/* Badges */}
            <div className="absolute top-3 start-3 flex flex-col gap-1.5 z-10">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-md flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                <span>{isAr ? 'عرض الأسبوع' : 'Deal of the Week'}</span>
              </span>
              {settings.showSalesCount && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 text-white backdrop-blur-xs flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>{settings.salesCount || '1.2k sold'}</span>
                </span>
              )}
            </div>

            {/* Video button if available */}
            {settings.productVideoUrl && (
              <button
                type="button"
                onClick={() => setShowVideo(true)}
                className="absolute bottom-3 end-3 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white text-xs font-black flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-105 z-10"
              >
                <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>{isAr ? 'فيديو' : 'Video'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Info & Purchase */}
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-emerald-600 font-bold uppercase tracking-wider">
              {product.sku} · {product.category}
            </span>
            <h3
              onClick={() => onViewProduct?.(product)}
              className="text-xl sm:text-3xl font-black leading-tight cursor-pointer hover:text-emerald-600 transition-colors"
              style={{ color: 'var(--sf-text, #0f172a)' }}
            >
              {settings.elementTitle || product.name}
            </h3>
            {settings.subtitle && (
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {settings.subtitle}
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold" style={{ color: 'var(--sf-muted, #64748b)' }}>
              ({settings.ratingValue || 4.9}) · {settings.numberOfReviews || 120} {isAr ? 'تقييم موثق في مكة' : 'reviews'}
            </span>
          </div>

          {/* Price & Scarcity */}
          <div className="flex items-baseline gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              {money(currentPrice * qty)}
            </span>
            <span className="text-sm text-muted line-through">{money(originalPrice * qty)}</span>
            <span className="text-[11px] font-bold text-rose-600 ms-auto flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{isAr ? 'سعر ترويجي مؤقت' : 'Limited Offer'}</span>
            </span>
          </div>

          {/* Description */}
          <p
            className={`text-xs sm:text-sm leading-relaxed ${settings.displayTwoLinesDesc !== false ? 'line-clamp-2' : ''}`}
            style={{ color: 'var(--sf-muted, #64748b)' }}
          >
            {product.description ||
              (isAr
                ? 'تنسيق يدوي فاخر من أندر الزهور الطبيعية المختارة بعناية فائقة، تم شحنها مبردة للحفاظ على النضارة والرائحة العطرية العميقة.'
                : 'Handcrafted luxury arrangement with premium fresh flowers selected and preserved in optimal conditions.')}
          </p>

          {/* Product Options / Variations */}
          {settings.displayProductOptions !== false && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                {isAr ? 'خيارات التنسيق المتوفرة:' : 'Available Options:'}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {demoVariations.map((v, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedVariationIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      selectedVariationIdx === idx
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{isAr ? v.labelAr : v.labelEn}</span>
                    {v.delta > 0 && <span className="text-[10px] text-muted ms-1">(+{money(v.delta)})</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Controls & WhatsApp / Add to Cart / Buy Now */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Qty */}
              <div
                className="flex items-center border rounded-xl p-1 justify-center shrink-0"
                style={{
                  borderColor: 'var(--sf-border, #cbd5e1)',
                  background: 'var(--sf-bg, #f8fafc)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--sf-text, #0f172a)' }}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm" style={{ color: 'var(--sf-text, #0f172a)' }}>
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--sf-text, #0f172a)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                onClick={() => onAddToCart(product, qty)}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-emerald-700 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isAr ? 'إضافة إلى السلة' : 'Add to Bag'}</span>
              </button>

              {/* Buy Now Button */}
              {settings.displayBuyNowButton !== false && (
                <button
                  type="button"
                  onClick={() => {
                    if (onBuyNow) {
                      onBuyNow(product, qty);
                    } else {
                      onAddToCart(product, qty);
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isAr ? 'شراء فوري (Buy Now)' : 'Buy Now'}</span>
                </button>
              )}
            </div>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/966504428819?text=${encodeURIComponent(
                (isAr ? 'السلام عليكم أرغب بطلب باقة الأسبوع الفاخرة: ' : 'Hello, I want to order the Spotlight luxury bloom: ') +
                `${product.name} (${isAr ? demoVariations[selectedVariationIdx].labelAr : demoVariations[selectedVariationIdx].labelEn}) x${qty} · ${money(currentPrice * qty)} · توصيل مكة`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{isAr ? 'طلب فوري ومخصص عبر واتساب' : 'Order via WhatsApp'}</span>
            </a>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'توصيل مكة خلال ساعتين' : '2-hour express delivery'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'ضمان النضارة والجودة 100%' : '100% Freshness Guarantee'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-black rounded-3xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              src={settings.productVideoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-blooming-flowers-in-spring-41221-large.mp4'}
              controls
              autoPlay
              className="w-full aspect-video object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 13. FLOATING ACTION BUTTONS (BOTTOM)
// ==========================================
export const SfFloatingButtons: React.FC<{
  settings: AllThemeSettings['colors'];
  whatsappHref: string;
}> = ({ settings, whatsappHref }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 end-6 z-40 flex flex-col gap-2.5">
      {settings.enableBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="w-11 h-11 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
          title="Back to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {settings.enableWhatsAppBtn && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-emerald-500 text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
          title="WhatsApp Concierge"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}
    </div>
  );
};
