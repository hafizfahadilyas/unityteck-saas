import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { readAllThemeSettings } from '../../settings/themeSettingsStore';
import { PRODUCTS } from '../data/products';
import { ChevronRight, ShoppingBag } from 'lucide-react';

// Authentic, high-resolution coffee photography assets
import saudiCafeMachine from '../assets/images/saudi_cafe_machine_1791363309148.jpg';
import baristaCremaMacro from '../assets/images/barista_crema_macro_1791363328316.jpg';
import baristaMilkSteaming from '../assets/images/barista_milk_steaming_1791363367164.jpg';
import baristaTampingShot from '../assets/images/barista_tamping_shot_1791363346824.jpg';
import espressoWoodPitcher from '../assets/images/espresso_wood_pitcher_1791363392554.jpg';
import saudiCoffeeCollage from '../assets/images/saudi_coffee_collage_1791363410810.jpg';

export const SallaIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.862 13.439a1.27 1.27 0 0 0-.81-.555a1.27 1.27 0 0 0-.964.18c-3.422 2.231-6.75 2.231-10.178 0a1.27 1.27 0 0 0-.964-.18 1.283 1.283 0 0 0-.434 2.327c2.142 1.394 4.326 2.1 6.49 2.1 2.166 0 4.348-.706 6.488-2.102a1.27 1.27 0 0 0 .555-.81a1.27 1.27 0 0 0-.18-.964zm5.103 2.82-1.171-9.764a5.24 5.24 0 0 0-5.2-4.614H6.406a5.236 5.236 0 0 0-5.198 4.612l-1.17 9.766a5.235 5.235 0 0 0 5.198 5.86h13.529a5.238 5.238 0 0 0 5.198-5.86zm-3.21 2.4c-.532.6-1.265.929-2.066.929H5.311c-.801 0-1.536-.33-2.066-.929a2.73 2.73 0 0 1-.676-2.16l1.157-9.657A2.764 2.764 0 0 1 6.468 4.41h11.064a2.765 2.765 0 0 1 2.742 2.432l1.157 9.656a2.72 2.72 0 0 1-.676 2.161" />
  </svg>
);

export const HonorAiSparkle: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C12.3 7.3 16.7 11.7 22 12C16.7 12.3 12.3 16.7 12 22C11.7 16.7 7.3 12.3 2 12C7.3 11.7 11.7 7.3 12 2Z"
      fill="url(#honor-sparkle-blue)"
    />
    <circle cx="19.5" cy="4.5" r="2" fill="#38BDF8" />
    <circle cx="4.5" cy="19.5" r="1.5" fill="#60A5FA" />
    <defs>
      <linearGradient id="honor-sparkle-blue" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="0.5" stopColor="#2563EB" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
  </svg>
);

interface KeyProductBannerProps {
  id: string;
  badge?: string;
  badgeAr?: string;
  tagBadge?: string;
  tagBadgeAr?: string;
  title: string;
  titleAr: string;
  tagline?: string;
  taglineAr?: string;
  price: number;
  originalPrice?: number;
  imgLeft: string;
  imgRight: string;
  imgLeftAlt: string;
  imgRightAlt: string;
  bgGradientClass: string;
  borderClass?: string;
  isReversed?: boolean;
  sallaUrl?: string;
}

const KeyProductRow: React.FC<KeyProductBannerProps> = ({
  id,
  title,
  titleAr,
  price,
  imgLeft,
  imgRight,
  imgLeftAlt,
  imgRightAlt,
  bgGradientClass,
  borderClass = '',
  isReversed = false,
}) => {
  const { navigateTo, language, addToCart, triggerFlyToCart, products } = useCart();
  const product = products.find((p) => p.id === id) || PRODUCTS.find((p) => p.id === id);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport and handle scroll animation
  useEffect(() => {
    let animId: number;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();

    const handleScroll = () => {
      if (!rowRef.current) return;
      const rect = rowRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Viewport coverage calculation
      if (rect.bottom > -200 && rect.top < windowHeight + 200) {
        setIsVisible(true);
        const centerDistance = (windowHeight / 2 - (rect.top + rect.height / 2)) / (windowHeight / 1.4);
        const clamped = Math.max(-1.3, Math.min(1.3, centerDistance));
        setScrollProgress(clamped);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  const leftSlideX = isMobile ? 0 : scrollProgress * (isReversed ? -38 : 38);
  const rightSlideX = isMobile ? 0 : scrollProgress * (isReversed ? 38 : -38);
  const leftSlideY = isMobile ? scrollProgress * 10 : scrollProgress * 32;
  const rightSlideY = isMobile ? scrollProgress * -10 : scrollProgress * -32;
  const leftRotateY = isMobile ? 0 : scrollProgress * (isReversed ? 14 : -14);
  const rightRotateY = isMobile ? 0 : scrollProgress * (isReversed ? -14 : 14);
  const leftRotateX = isMobile ? 0 : scrollProgress * 5;
  const rightRotateX = isMobile ? 0 : scrollProgress * -5;
  const scaleEffect = isMobile ? 1 : 1.05 - Math.min(0.12, Math.abs(scrollProgress) * 0.08);

  const splitBannerHeading = (fullText: string) => {
    const words = fullText.trim().split(/\s+/);
    if (words.length <= 1) {
      return { boldPart: fullText, lightPart: '' };
    }
    const lightCount = words.length > 4 ? 4 : words.length - 1;
    const boldPart = words.slice(0, words.length - lightCount).join(' ');
    const lightPart = words.slice(words.length - lightCount).join(' ');
    return { boldPart, lightPart };
  };

  const currentTitle = language === 'AR' ? titleAr : title;
  const { boldPart, lightPart } = splitBannerHeading(currentTitle);

  return (
    <div
      ref={rowRef}
      className={`w-full max-w-full rounded-3xl sm:rounded-4xl overflow-hidden ${bgGradientClass} ${borderClass} p-4 sm:p-8 lg:p-12 transition-all duration-700 ease-out select-none shadow-xs ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-90'
      }`}
    >
      <div className={`grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-12 w-full max-w-full ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
        {/* Info Column (5 cols) */}
        <div className={`lg:col-span-5 text-start w-full min-w-0 ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
          {/* 1. Title */}
          <h2
            className={`honor-heading text-xl sm:text-3xl lg:text-[40px] text-black break-words ${
              language === 'AR'
                ? 'leading-[1.42] tracking-normal'
                : 'leading-[1.28] tracking-[-0.01em]'
            }`}
          >
            <span className="font-semibold text-black">{boldPart}</span>
            {lightPart && (
              <>
                {' '}
                <span className="font-light text-neutral-800">{lightPart}</span>
              </>
            )}
          </h2>

          {/* 2. Refined Honor-Style Price */}
          <div className="mt-4 sm:mt-7 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-neutral-950">
              {language === 'AR' ? `${price.toLocaleString()}.00 ر.س` : `SAR ${price.toLocaleString()}.00`}
            </span>
          </div>

          {/* 3. Action Buttons */}
          <div className="mt-4 sm:mt-6 flex items-center gap-2.5 sm:gap-5 flex-wrap">
            <button
              type="button"
              onClick={() => navigateTo('product-buy', id)}
              className="px-5 sm:px-7 py-2 sm:py-2.5 bg-black hover:bg-neutral-800 text-white font-medium text-xs sm:text-sm rounded-full transition-all duration-200 active:scale-95 cursor-pointer shadow-none inline-flex items-center justify-center"
            >
              <span>{language === 'AR' ? 'شراء' : 'Buy'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('product-detail', id)}
              className="group/learn text-xs sm:text-sm font-normal text-neutral-900 hover:text-black transition-colors cursor-pointer inline-flex items-center gap-1 active:scale-95 text-center"
            >
              <span>{language === 'AR' ? 'تعرف على المزيد' : 'Learn More'}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 ${
                  language === 'AR' ? 'rotate-180 group-hover/learn:-translate-x-0.5' : 'group-hover/learn:translate-x-0.5'
                }`}
              />
            </button>

            {/* Add to Cart Button with Flying Animation */}
            {(() => {
              const currentProduct = product || products.find((p) => p.id === id) || PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];
              const flyImg = imgLeft || currentProduct.images?.[0] || currentProduct.colors[0]?.image;
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    triggerFlyToCart(rect, flyImg);
                    addToCart(currentProduct, undefined, undefined, undefined, undefined, false);
                  }}
                  className="group/addcart px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-black bg-transparent hover:bg-black/5 text-black font-medium text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer inline-flex items-center gap-2 shadow-none"
                  title={language === 'AR' ? 'أضف للسلة' : 'Add to Cart'}
                >
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 group-hover/addcart:scale-110" />
                  <span>{language === 'AR' ? 'أضف للسلة' : 'Add to Cart'}</span>
                </button>
              );
            })()}
          </div>
        </div>

        {/* Dual FULL-HEIGHT Animated Images Stage (7 cols) */}
        <div
          className={`lg:col-span-7 flex justify-center cursor-pointer w-full max-w-full overflow-hidden ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}
          onClick={() => navigateTo('product-detail', id)}
        >
          <div className="relative w-full h-[240px] sm:h-[340px] md:h-[400px] lg:h-[450px] flex items-center justify-center gap-2.5 sm:gap-4 p-0.5 sm:p-1 perspective-[1400px] overflow-hidden">
            {/* Left Full-Height Image */}
            <div
              className="relative w-1/2 h-full overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xs border-0 border-transparent will-change-transform transform-gpu"
              style={{
                transform: `translateX(${leftSlideX}px) translateY(${leftSlideY}px) rotateY(${leftRotateY}deg) rotateX(${leftRotateX}deg) scale(${scaleEffect})`,
              }}
            >
              <img
                src={imgLeft}
                alt={imgLeftAlt}
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy" decoding="async"
              />
            </div>

            {/* Right Full-Height Image */}
            <div
              className="relative w-1/2 h-full overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xs border-0 border-transparent will-change-transform transform-gpu"
              style={{
                transform: `translateX(${rightSlideX}px) translateY(${rightSlideY}px) rotateY(${rightRotateY}deg) rotateX(${rightRotateX}deg) scale(${scaleEffect})`,
              }}
            >
              <img
                src={imgRight}
                alt={imgRightAlt}
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy" decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FlagshipThreeJsSection: React.FC = () => {
  const { language } = useCart();
  const { activeStore } = useTenant();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleSync = () => setVersion((v) => v + 1);
    window.addEventListener('unityteck-theme-settings', handleSync);
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'UNITYTECK_PREVIEW_SYNC') handleSync();
    });
    return () => {
      window.removeEventListener('unityteck-theme-settings', handleSync);
    };
  }, []);

  const themeSettings = useMemo(() => {
    try {
      return readAllThemeSettings(activeStore?.id, activeStore);
    } catch {
      return null;
    }
  }, [activeStore, version]);

  const configuredBanners = themeSettings?.banners?.banners;
  const b0 = configuredBanners?.[0];
  const b1 = configuredBanners?.[1];
  const b2 = configuredBanners?.[2];

  const resolveImage = (img: string | undefined, fallback: string) => {
    if (!img) return fallback;
    const lower = img.toLowerCase();
    if (lower.startsWith('http') || lower.startsWith('data:') || lower.startsWith('/')) return img;
    return fallback;
  };

  return (
    <section className="w-full max-w-[1360px] mx-auto px-4 lg:px-8 py-8 sm:py-16 space-y-8 sm:space-y-10 select-none overflow-hidden">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-block text-xs font-bold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-4 py-1.5 rounded-full">
          {language === 'AR' ? 'الابتكار والتميز' : 'Flagship Innovations'}
        </span>
        <h2 className={`text-2xl sm:text-4xl font-extrabold text-neutral-900 text-center ${
          language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
        }`}>
          {language === 'AR' ? 'إصدارات الفئة الرائدة المتميزة' : 'Featured HiBrew Flagships'}
        </h2>
        <p className={`text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto ${
          language === 'AR' ? 'leading-relaxed' : 'leading-normal'
        }`}>
          {language === 'AR'
            ? 'تصاميم استثنائية وهندسة دقيقة تمنحك استخلاصاً تجارياً فائق الجودة.'
            : 'Cutting-edge engineering and bespoke aesthetics for the ultimate coffee experience.'}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: Saudi Cafe Dual-Boiler Flagship & Macro Crema                       */}
      {/* ========================================================================= */}
      <KeyProductRow
        id={b0?.link?.replace('#', '') || "hb-h10a-dualboiler"}
        title={b0?.title || "HiBrew Dual-Boiler 20-Bar Barista Pro"}
        titleAr={b0?.title || "ماكينة إسبريسو هاي برو الاحترافية 20 بار دبل بويلر"}
        price={1899}
        originalPrice={2299}
        imgLeft={resolveImage(b0?.image, saudiCafeMachine)}
        imgRight={baristaCremaMacro}
        imgLeftAlt="Commercial Dual-Boiler Machine on Cafe Counter"
        imgRightAlt="Macro Golden Crema Bottomless Extraction"
        bgGradientClass="bg-gradient-to-br from-[#F4ECE1] to-[#EADFCF]"
        borderClass="border-0 border-transparent"
        isReversed={false}
      />

      {/* ========================================================================= */}
      {/* ROW 2: Barista Milk Steaming & Precision Titanium Grinder G5             */}
      {/* ========================================================================= */}
      <KeyProductRow
        id={b1?.link?.replace('#', '') || "hb-mill-g5-pro"}
        title={b1?.title || "HiBrew Conical Burr Coffee Mill G5"}
        titleAr={b1?.title || "مطحنة القهوة الكهربائية بتروس تيتانيوم G5"}
        price={489}
        originalPrice={650}
        imgLeft={resolveImage(b1?.image, baristaMilkSteaming)}
        imgRight={baristaTampingShot}
        imgLeftAlt="Barista Steaming Milk with Pitcher"
        imgRightAlt="Barista Tamping Ground Espresso into Portafilter"
        bgGradientClass="bg-gradient-to-br from-[#F8E2D8] to-[#EFCFC2]"
        borderClass="border-0 border-transparent"
        isReversed={false}
      />

      {/* ========================================================================= */}
      {/* ROW 3: 58mm Naked Walnut Boltfilter & Artisan Collection                 */}
      {/* ========================================================================= */}
      <KeyProductRow
        id={b2?.link?.replace('#', '') || "hb-boltfilter-58-naked"}
        title={b2?.title || "58mm Naked Walnut Boltfilter"}
        titleAr={b2?.title || "بورتافلتر مكشوف مقاس 58 ملم خشب الجوز"}
        price={159}
        originalPrice={220}
        imgLeft={resolveImage(b2?.image, espressoWoodPitcher)}
        imgRight={saudiCoffeeCollage}
        imgLeftAlt="Glass Espresso Mini Pitcher with Wooden Handle"
        imgRightAlt="Luxury Saudi Coffee Master Collection"
        bgGradientClass="bg-gradient-to-br from-[#E6ECE5] to-[#D5E0D4]"
        borderClass="border-0 border-transparent"
        isReversed={false}
      />
    </section>
  );
};

