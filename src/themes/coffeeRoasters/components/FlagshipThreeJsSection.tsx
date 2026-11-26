import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { resolveCoffeeThemeSettings } from '../../settings/coffeeThemeDefaults';
import { PRODUCTS } from '../data/products';
import { coffeeAlmariPngUrl, coffeeIsolatedCardImage } from '../utils/coffeeIsolatedImage';
import { ChevronRight, ShoppingBag } from 'lucide-react';

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
  // Prefer live store catalog; seed PRODUCTS only as image/metadata match for the same id   never PRODUCTS[0].
  const product =
    products.find((p) => p.id === id) || PRODUCTS.find((p) => p.id === id) || undefined;
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport and handle scroll animation
  useEffect(() => {
    let animId: number;

    const handleResize = () => {
      const frame =
        rowRef.current?.closest('.builder-device-mobile, .builder-device-tablet') != null;
      setIsMobile(frame || window.innerWidth < 768);
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
      className={`w-full max-w-full rounded-3xl sm:rounded-4xl overflow-hidden ${bgGradientClass} ${borderClass} p-4 sm:p-8 lg:p-12 transition-all duration-700 ease-out select-none shadow-none ${
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

          {/* 2. Refined Honor-Style Price   SAR (U+20C1), never broken placeholder glyph */}
          <div className="mt-4 sm:mt-7 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-neutral-950">
              {language === 'AR'
                ? `${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} \u20C1`
                : `\u20C1 ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>

          {/* 3. Action Buttons */}
          <div className="mt-4 sm:mt-6 flex items-center gap-2.5 sm:gap-5 flex-wrap">
            <button
              type="button"
              onClick={() => navigateTo('product-buy', id)}
              className="px-5 sm:px-7 py-2 sm:py-2.5 bg-black hover:bg-neutral-800 text-white font-medium text-xs sm:text-sm rounded-full transition-all duration-200 active:scale-95 cursor-pointer shadow-none inline-flex items-center justify-center"
            >
              <span>{language === 'AR' ? '\u0634\u0631\u0627\u0621' : 'Buy'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('product-detail', id)}
              className="group/learn text-xs sm:text-sm font-normal text-neutral-900 hover:text-black transition-colors cursor-pointer inline-flex items-center gap-1 active:scale-95 text-center"
            >
              <span>{language === 'AR' ? '\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0645\u0632\u064A\u062F' : 'Learn More'}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 ${
                  language === 'AR' ? 'rotate-180 group-hover/learn:-translate-x-0.5' : 'group-hover/learn:translate-x-0.5'
                }`}
              />
            </button>

            {/* Add to Cart Button with Flying Animation */}
            {product ? (() => {
              const flyImg = imgLeft || product.images?.[0] || product.colors?.[0]?.image;
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    triggerFlyToCart(rect, flyImg);
                    addToCart(product, undefined, undefined, undefined, undefined, false);
                  }}
                  className="group/addcart px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-black bg-transparent hover:bg-black/5 text-black font-medium text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer inline-flex items-center gap-2 shadow-none"
                  title={language === 'AR' ? '\u0623\u0636\u0641 \u0644\u0644\u0633\u0644\u0629' : 'Add to Cart'}
                >
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 group-hover/addcart:scale-110" />
                  <span>{language === 'AR' ? '\u0623\u0636\u0641 \u0644\u0644\u0633\u0644\u0629' : 'Add to Cart'}</span>
                </button>
              );
            })() : null}
          </div>
        </div>

        {/* Dual FULL-HEIGHT Animated Images Stage (7 cols) */}
        <div
          className={`lg:col-span-7 flex justify-center cursor-pointer w-full max-w-full overflow-hidden ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}
          onClick={() => navigateTo('product-detail', id)}
        >
          <div className="relative w-full h-[260px] sm:h-[360px] md:h-[420px] lg:h-[460px] flex items-stretch justify-center gap-2.5 sm:gap-4 p-0.5 sm:p-1 perspective-[1400px] overflow-hidden">
            {/* Left full-height image   absolute fill so builder CSS cannot leave white slabs */}
            <div
              data-fsb-frame-wrap="1"
              className="relative w-1/2 h-full min-h-0 overflow-hidden rounded-2xl sm:rounded-3xl bg-transparent shadow-none border-0 border-transparent will-change-transform transform-gpu"
              style={{
                transform: `translateX(${leftSlideX}px) translateY(${leftSlideY}px) rotateY(${leftRotateY}deg) rotateX(${leftRotateX}deg) scale(${scaleEffect})`,
              }}
            >
              {imgLeft ? (
                <img
                  data-fsb-frame="1"
                  src={imgLeft}
                  alt={imgLeftAlt}
                  className="absolute inset-0 w-full h-full object-contain object-center transition-transform duration-700 hover:scale-105 shadow-none"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
            </div>

            <div
              data-fsb-frame-wrap="1"
              className="relative w-1/2 h-full min-h-0 overflow-hidden rounded-2xl sm:rounded-3xl bg-transparent shadow-none border-0 border-transparent will-change-transform transform-gpu"
              style={{
                transform: `translateX(${rightSlideX}px) translateY(${rightSlideY}px) rotateY(${rightRotateY}deg) rotateX(${rightRotateX}deg) scale(${scaleEffect})`,
              }}
            >
              {imgRight ? (
                <img
                  data-fsb-frame="1"
                  src={imgRight}
                  alt={imgRightAlt}
                  className="absolute inset-0 w-full h-full object-contain object-center transition-transform duration-700 hover:scale-105 shadow-none"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
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
      if (!activeStore?.id) return null;
      return resolveCoffeeThemeSettings(activeStore.id, activeStore);
    } catch {
      return null;
    }
  }, [activeStore, version]);

  // Word C-FSB   featuredSectionBanners (NOT C-BAN `banners`)
  const fsb = themeSettings?.featuredSectionBanners;
  const configuredBanners = (fsb?.enabled !== false ? fsb?.banners : []) || [];
  const activeBanners = configuredBanners.filter((b) => b.enabled !== false);
  const b0 = activeBanners[0];
  const b1 = activeBanners[1];
  const b2 = activeBanners[2];

  const resolveImage = (img: string | undefined, fallback: string, productId?: string) => {
    const isolated = coffeeIsolatedCardImage(productId, img || fallback);
    if (isolated) return coffeeAlmariPngUrl(isolated);
    if (!img) return coffeeAlmariPngUrl(fallback) || fallback;
    const lower = img.toLowerCase();
    if (lower.startsWith('http') || lower.startsWith('data:') || lower.startsWith('/')) {
      return coffeeAlmariPngUrl(img);
    }
    return coffeeAlmariPngUrl(fallback) || fallback;
  };

  const parsePrice = (raw?: string, fallback = 0) => {
    const n = Number(String(raw || '').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const sectionTitle =
    language === 'AR'
      ? fsb?.titleAr || '\u0645\u0646\u062A\u062C\u0627\u062A \u0647\u0627\u064A \u0628\u0631\u0648 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629'
      : fsb?.titleEn || 'Featured HiBrew Flagships';
  const sectionSub =
    language === 'AR'
      ? fsb?.subtitleAr || '\u0647\u0646\u062F\u0633\u0629 \u0645\u062A\u0642\u062F\u0645\u0629 \u0648\u062A\u0635\u0627\u0645\u064A\u0645 \u0645\u062E\u0635\u0635\u0629 \u0644\u062A\u062C\u0631\u0628\u0629 \u0642\u0647\u0648\u0629 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u0629.'
      : fsb?.subtitleEn || 'Cutting-edge engineering and bespoke aesthetics for the ultimate coffee experience.';

  if (fsb?.enabled === false) return null;

  return (
    <section className="w-full max-w-[1360px] mx-auto px-4 lg:px-8 py-8 sm:py-16 space-y-8 sm:space-y-10 select-none overflow-hidden">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-block text-xs font-bold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-4 py-1.5 rounded-full">
          {language === 'AR' ? '\u0627\u0628\u062A\u0643\u0627\u0631\u0627\u062A \u0631\u0627\u0626\u062F\u0629' : 'Flagship Innovations'}
        </span>
        <h2 className={`text-2xl sm:text-4xl font-extrabold text-neutral-900 text-center ${
          language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
        }`}>
          {sectionTitle}
        </h2>
        <p className={`text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto ${
          language === 'AR' ? 'leading-relaxed' : 'leading-normal'
        }`}>
          {sectionSub}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: Saudi Cafe Dual-Boiler Flagship & Macro Crema                       */}
      {/* ========================================================================= */}
      <KeyProductRow
        id={b0?.productId || "hb-almari-fluted-oak"}
        title={b0?.titleEn || "Riyadh Fluted Oak Coffee Almari"}
        titleAr={b0?.titleAr || '\u062E\u0632\u0627\u0646\u0629 \u0642\u0647\u0648\u0629 \u0628\u0644\u0648\u0637 \u0645\u0636\u0644\u0639 \u0627\u0644\u0631\u064A\u0627\u0636'}
        price={b0?.showPrice !== false ? parsePrice(b0?.price, 2890) : 2890}
        originalPrice={3290}
        imgLeft={resolveImage(b0?.images?.[0], '/images/ksa_almari_fluted_oak.png', b0?.productId || 'hb-almari-fluted-oak')}
        imgRight={resolveImage(b0?.images?.[1], '/images/ksa_almari_najdi_heritage.png', 'hb-almari-najdi-heritage')}
        imgLeftAlt="Commercial Dual-Boiler Machine on Cafe Counter"
        imgRightAlt="Macro Golden Crema Bottomless Extraction"
        bgGradientClass="bg-gradient-to-br from-[#D6CEC4] to-[#C4B8AA]"
        borderClass="border-0 border-transparent"
        isReversed={false}
      />

      {/* ========================================================================= */}
      {/* ROW 2: Barista Milk Steaming & Precision Titanium Grinder G5             */}
      {/* ========================================================================= */}
      <KeyProductRow
        id={b1?.productId || "hb-almari-white-marble"}
        title={b1?.titleEn || "Jeddah Black Gold Coffee Almari"}
        titleAr={b1?.titleAr || '\u062F\u0648\u0644\u0627\u0628 \u0642\u0647\u0648\u0629 \u0623\u0633\u0648\u062F \u0648\u0630\u0647\u0628\u064A \u0644\u062C\u062F\u0629'}
        price={b1?.showPrice !== false ? parsePrice(b1?.price, 2490) : 2490}
        originalPrice={2790}
        imgLeft={resolveImage(b1?.images?.[0], '/images/hb_jeddah_blackgold_cut_1125.png', b1?.productId || 'hb-almari-white-marble')}
        imgRight={resolveImage(b1?.images?.[1], '/images/ksa_almari_makkah_corner.png', 'hb-almari-makkah-corner')}
        imgLeftAlt="Jeddah black gold coffee almari cabinet"
        imgRightAlt="Barista Tamping Ground Espresso into Portafilter"
        bgGradientClass="bg-gradient-to-br from-[#DCC4B8] to-[#C9A899]"
        borderClass="border-0 border-transparent"
        isReversed={false}
      />

      {/* ========================================================================= */}
      {/* ROW 3: 58mm Naked Walnut Boltfilter & Artisan Collection                 */}
      {/* ========================================================================= */}
      <KeyProductRow
        id={b2?.productId || "hb-almari-dual-door-villa"}
        title={b2?.titleEn || "KSA Dual-Door Villa Coffee Almari"}
        titleAr={b2?.titleAr || '\u062E\u0632\u0627\u0646\u0629 \u0642\u0647\u0648\u0629 \u0641\u064A\u0644\u0627 \u0628\u0628\u0627\u0628\u064A\u0646 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629'}
        price={b2?.showPrice !== false ? parsePrice(b2?.price, 3490) : 3490}
        originalPrice={3990}
        imgLeft={resolveImage(b2?.images?.[0], '/images/ksa_almari_dual_door_villa.png', b2?.productId || 'hb-almari-dual-door-villa')}
        imgRight={resolveImage(b2?.images?.[1], '/images/ksa_almari_fluted_oak.png', 'hb-almari-fluted-oak')}
        imgLeftAlt="Glass Espresso Mini Pitcher with Wooden Handle"
        imgRightAlt="Luxury Saudi Coffee Master Collection"
        bgGradientClass="bg-gradient-to-br from-[#D2DAD0] to-[#BCC8BC]"
        borderClass="border-0 border-transparent"
        isReversed={false}
      />
    </section>
  );
};

