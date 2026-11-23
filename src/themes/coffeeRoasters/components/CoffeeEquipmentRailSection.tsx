import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { bi } from '../../settings/coffeeModularSettings';
import type { AllThemeSettings } from '../../settings/themeSettingsStore';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { coffeeIsolatedCardImage } from '../utils/coffeeIsolatedImage';
import {
  resolveShowcaseCardChrome,
  resolveShowcaseShopTarget,
} from './coffeeCategoryShowcaseLogic';

/** C-FCP / C-FP equipment rail — same JSX on live home + page builder canvas. */
export const CoffeeEquipmentRailSection: React.FC<{
  themeSettings: AllThemeSettings | null;
}> = ({ themeSettings }) => {
  const { navigateTo, language, products } = useCart();
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);
  const mobileCarouselRef = React.useRef<HTMLDivElement>(null);
  const [activeMobileSlide, setActiveMobileSlide] = useState(0);

  /** C-FCP categories drive the home rail when present; else C-FP tabs; else catalog CATEGORIES. */
  const homeCategoryTabs = useMemo(() => {
    const fcp = themeSettings?.featuredCategoriesProducts;
    const fcpSection = fcp?.enabled !== false
      ? (fcp?.sections || []).find((s) => s.enabled !== false)
      : undefined;
    const fcpCats = (fcpSection?.categories || []).filter((c) => c.enabled !== false);
    if (fcpCats.length > 0) {
      return [
        { id: 'all', name: 'All Products', nameAr: 'جميع المنتجات' },
        ...fcpCats.map((c) => ({
          id: c.categoryId || c.id,
          name: c.labelEn,
          nameAr: c.labelAr,
        })),
      ];
    }
    const fp = themeSettings?.featuredProducts;
    const fpTabs = fp?.enabled !== false
      ? (fp?.tabs || []).filter((t) => t.enabled !== false)
      : [];
    if (fpTabs.length > 0) {
      return fpTabs.map((t) => ({
        id: t.categoryId || t.id,
        name: t.labelEn,
        nameAr: t.labelAr,
      }));
    }
    // Derive from live store products — never static coffee pack when theme empty
    const live = products || [];
    const map = new Map<string, { id: string; name: string; nameAr: string }>();
    live.forEach((p) => {
      const id = String(p.category || '').trim();
      if (!id || map.has(id)) return;
      map.set(id, {
        id,
        name: id,
        nameAr: String((p as { categoryAr?: string }).categoryAr || id),
      });
    });
    return [
      { id: 'all', name: 'All Products', nameAr: 'جميع المنتجات' },
      ...Array.from(map.values()),
    ];
  }, [themeSettings, products]);

  const showcaseChrome = useMemo(
    () => resolveShowcaseCardChrome(themeSettings?.featuredCategoriesProducts),
    [themeSettings?.featuredCategoriesProducts],
  );

  const homeRailTitle = useMemo(() => {
    const fcp = themeSettings?.featuredCategoriesProducts;
    if (fcp?.enabled !== false && (fcp?.titleEn || fcp?.titleAr)) {
      return bi(language, fcp.titleEn || '', fcp.titleAr || '');
    }
    const fcpSection = fcp?.enabled !== false
      ? (fcp?.sections || []).find((s) => s.enabled !== false)
      : undefined;
    if (fcpSection && (fcpSection.titleEn || fcpSection.titleAr)) {
      return bi(language, fcpSection.titleEn, fcpSection.titleAr);
    }
    const fp = themeSettings?.featuredProducts;
    if (fp?.enabled !== false && (fp?.titleEn || fp?.titleAr)) {
      return bi(language, fp.titleEn, fp.titleAr);
    }
    return language === 'AR' ? 'جميع المنتجات' : 'All Products';
  }, [themeSettings, language]);

  /** C-FCP / C-FP display flags — hide rail when both Word sections are off. */
  const homeRailFlags = useMemo(() => {
    const fcp = themeSettings?.featuredCategoriesProducts;
    const fp = themeSettings?.featuredProducts;
    const fcpOn = fcp?.enabled !== false;
    const fpOn = fp?.enabled !== false;
    const fcpSection = fcpOn ? (fcp?.sections || []).find((s) => s.enabled !== false) : undefined;
    const fcpHasCats = (fcpSection?.categories || []).some((c) => c.enabled !== false);
    const sectionEnabled = fcpHasCats ? fcpOn : fpOn || fcpOn;
    const topDesc = bi(language, fcp?.descriptionEn, fcp?.descriptionAr);
    return {
      sectionEnabled,
      showPrice: fcpHasCats
        ? (fcp?.showPrice !== false && fcpSection?.showPrice !== false)
        : fp?.showPrice !== false,
      showRating: fcpHasCats
        ? fcpSection?.showRating !== false
        : fp?.showRating !== false,
      highlightFirst: fp?.highlightFirst !== false,
      description: topDesc || (fcpHasCats
        ? bi(language, fcpSection?.descriptionEn, fcpSection?.descriptionAr)
        : bi(language, fp?.descriptionEn, fp?.descriptionAr)),
    };
  }, [themeSettings, language]);

  const goShowcaseShop = () => {
    const target = resolveShowcaseShopTarget(showcaseChrome.moreProductsUrl);
    if (target === 'products') {
      navigateTo('products');
      return;
    }
    if (/^https?:\/\//i.test(target.href)) {
      window.open(target.href, '_blank', 'noopener,noreferrer');
      return;
    }
    navigateTo('products');
  };

  const buyLabel = language === 'AR' ? showcaseChrome.buyLabelAr : showcaseChrome.buyLabelEn;
  const learnMoreLabel = language === 'AR' ? showcaseChrome.learnMoreLabelAr : showcaseChrome.learnMoreLabelEn;
  const moreProductsLabel = language === 'AR' ? showcaseChrome.moreProductsAr : showcaseChrome.moreProductsEn;

  useEffect(() => {
    if (!homeCategoryTabs.some((t) => t.id === activeCategoryTab) && homeCategoryTabs[0]) {
      setActiveCategoryTab(homeCategoryTabs[0].id);
    }
  }, [homeCategoryTabs, activeCategoryTab]);

  // Dynamic products for selected category
  const filteredCategoryProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    const list =
      activeCategoryTab === 'all'
        ? products
        : products.filter((p) => {
            const cat = (p.category || '').toLowerCase();
            const tab = activeCategoryTab.toLowerCase();
            return (
              cat === tab ||
              cat.includes(tab) ||
              tab.includes(cat) ||
              ((p as any).tags && (p as any).tags.some((t: string) => t.toLowerCase().includes(tab)))
            );
          });
    return list;
  }, [products, activeCategoryTab]);

  // Live catalog only — never paint CATEGORY_SHOWCASE_MAP seed products when this store has none.
  const maxVisible = showcaseChrome.maxVisibleProducts;
  const currentShowcase = useMemo(() => {
    if (filteredCategoryProducts.length === 0) return null;
    const first = filteredCategoryProducts[0];
    const companionCap = Math.max(0, maxVisible - 1);
    return {
      featured: {
        productId: first.id,
        image: coffeeIsolatedCardImage(
          first.id,
          first.colors?.[0]?.image || first.images?.[0] || (first as any).image || '',
        ),
        titleEn: first.name,
        titleAr: first.nameAr || first.name,
        taglineEn: first.tagline || 'Specialty Coffee Gear',
        taglineAr: first.taglineAr || 'معدات القهوة المختصة والتحضير الاحترافي',
        price: first.basePrice,
        originalPrice: first.originalPrice,
      },
      companionIds: filteredCategoryProducts.slice(1, 1 + companionCap).map((p) => p.id),
      hasMoreProducts: filteredCategoryProducts.length > maxVisible,
    };
  }, [filteredCategoryProducts, maxVisible]);

  const companionProducts = useMemo(() => {
    const companionCap = Math.max(0, maxVisible - 1);
    if (filteredCategoryProducts.length > 1) {
      return filteredCategoryProducts.slice(1, 1 + companionCap);
    }
    if (!currentShowcase) return [];
    return currentShowcase.companionIds
      .slice(0, companionCap)
      .map((id) => (products && products.length > 0 ? products.find((p) => p.id === id) : undefined))
      .filter(Boolean) as NonNullable<typeof products>;
  }, [filteredCategoryProducts, currentShowcase, products, maxVisible]);

  const showMoreProductsCta =
    showcaseChrome.showMoreProducts &&
    Boolean(currentShowcase?.hasMoreProducts || (filteredCategoryProducts.length > maxVisible));

  const totalMobileSlides = Math.max(
    1 + companionProducts.length + (showcaseChrome.showMoreProducts ? 1 : 0),
    1,
  ); // featured + companions + optional More Products
  const safeActiveSlide = Math.min(Math.max(activeMobileSlide ?? 0, 0), Math.max(totalMobileSlides - 1, 0));

  // High-performance IntersectionObserver for tracking active slide without layout thrashing
  React.useEffect(() => {
    const container = mobileCarouselRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idxStr = entry.target.getAttribute('data-slide-index');
            if (idxStr !== null) {
              const idx = parseInt(idxStr, 10);
              if (!isNaN(idx)) {
                setActiveMobileSlide(idx);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.55,
      }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [activeCategoryTab, companionProducts.length]);

  // Reset mobile carousel to first slide when tab changes
  React.useEffect(() => {
    setActiveMobileSlide(0);
    if (mobileCarouselRef.current) {
      const firstChild = mobileCarouselRef.current.children[0] as HTMLElement;
      if (firstChild) {
        firstChild.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    }
  }, [activeCategoryTab]);

  const scrollToSlide = (index: number) => {
    if (!mobileCarouselRef.current) return;
    const children = mobileCarouselRef.current.children;
    const clampedIndex = Math.max(0, Math.min(index, children.length - 1));
    const target = children[clampedIndex] as HTMLElement;
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
      setActiveMobileSlide(clampedIndex);
    }
  };

  const nextMobileSlide = () => {
    const nextIdx = (safeActiveSlide + 1) % totalMobileSlides;
    scrollToSlide(nextIdx);
  };

  const prevMobileSlide = () => {
    const prevIdx = (safeActiveSlide - 1 + totalMobileSlides) % totalMobileSlides;
    scrollToSlide(prevIdx);
  };

  const scrollTabs = (dir: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const offset = dir === 'left' ? -220 : 220;
      tabsContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <>
      {homeRailFlags.sectionEnabled ? (
      <section
        id="all-equipment-section"
        data-customize-section="C-FP C-FCP"
        className="w-full py-12 sm:py-16 lg:py-20 overflow-hidden"
        style={{ background: showcaseChrome.bgColor || '#F9F9F9' }}
      >
        <div className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center max-w-[1360px] mx-auto mb-8 sm:mb-10">
            <h2 className={`text-3xl sm:text-4xl lg:text-[40px] font-bold text-black text-center ${
              language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
            }`}>
              {homeRailTitle}
            </h2>
            {homeRailFlags.description ? (
              <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-2xl mx-auto">
                {homeRailFlags.description}
              </p>
            ) : null}

            {/* Single Row Category Switcher Bar — C-FCP / C-FP tabs from theme settings */}
            <div className="relative w-full max-w-[1280px] mx-auto mt-6 sm:mt-7 flex items-center justify-center gap-3 sm:gap-5 lg:gap-6 px-2 sm:px-4">
              {/* Optional Scroll Left Button */}
              <button
                type="button"
                onClick={() => scrollTabs(language === 'AR' ? 'right' : 'left')}
                aria-label={language === 'AR' ? 'تمرير لليسار' : 'Scroll Left'}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-neutral-50 text-neutral-600 hover:text-black border border-neutral-200/70 shadow-sm shrink-0 cursor-pointer transition-all active:scale-95 z-10"
              >
                <ChevronLeft className={`w-4 h-4 ${language === 'AR' ? 'rotate-180' : ''}`} />
              </button>

              <div
                ref={tabsContainerRef}
                className="flex items-center justify-start gap-2 sm:gap-3 lg:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-3 sm:px-4 whitespace-nowrap max-w-full min-w-0"
              >
                {homeCategoryTabs.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryTab(cat.id)}
                    className={`transition-all duration-200 cursor-pointer whitespace-nowrap text-sm sm:text-[15px] shrink-0 ${
                      activeCategoryTab === cat.id
                        ? 'bg-white text-black font-semibold px-5 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0 ring-0'
                        : 'bg-transparent hover:text-black text-neutral-500 font-normal px-3 sm:px-4 py-2 sm:py-2.5 rounded-full hover:bg-black/[0.02]'
                    }`}
                  >
                    {language === 'AR' && cat.nameAr ? cat.nameAr : cat.name}
                  </button>
                ))}
              </div>

              {/* Optional Scroll Right Button */}
              <button
                type="button"
                onClick={() => scrollTabs(language === 'AR' ? 'left' : 'right')}
                aria-label={language === 'AR' ? 'تمرير لليمين' : 'Scroll Right'}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-neutral-50 text-neutral-600 hover:text-black border border-neutral-200/70 shadow-sm shrink-0 cursor-pointer transition-all active:scale-95 z-10"
              >
                <ChevronRight className={`w-4 h-4 ${language === 'AR' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {!currentShowcase ? (
            <div className="w-full py-10 text-center text-sm text-neutral-500 border border-dashed border-neutral-200 rounded-2xl bg-white">
              {language === 'AR' ? 'لا توجد منتجات في هذا القسم' : 'No products found in this section'}
            </div>
          ) : (
          <>
          {/* Desktop Layout: Unified Honor Architecture 1+4 Layout — equal column heights */}
          <div
            className={`hidden lg:grid lg:grid-cols-12 gap-5 sm:gap-6 w-full max-w-full ${
              showcaseChrome.equalCardHeights ? 'items-stretch' : 'items-start'
            }`}
          >
            {/* Left Large Featured Card — stretch to match companion column (no fixed 640px / sticky) */}
            <div
              className={`lg:col-span-6 bg-white relative overflow-hidden flex flex-col justify-end transition-all duration-300 text-center w-full min-h-[500px] sm:min-h-[560px] lg:min-h-[640px] border-0 shadow-none hover:shadow-none group ${
                showcaseChrome.equalCardHeights ? 'h-full self-stretch' : ''
              }`}
              style={{ borderRadius: showcaseChrome.cardRadius }}
            >
              {/* Full Width & Height Background Image */}
              <div
                onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden"
              >
                <img
                  src={currentShowcase.featured.image}
                  alt={currentShowcase.featured.titleEn}
                  className="w-full h-full object-cover object-[center_10%] group-hover:scale-104 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                  loading="lazy" decoding="async"
                />
                {/* Bottom Shade / Gradient: smooth fade from transparent down to white */}
                <div className="absolute inset-x-0 bottom-0 h-[62%] sm:h-[58%] bg-gradient-to-t from-white via-white/95 via-white/70 to-transparent pointer-events-none" />
              </div>

              {/* Text Container: Positioned inside the bottom shade */}
              <div className="relative z-10 px-6 pb-6 sm:pb-8 pt-6 text-center flex flex-col items-center justify-end">
                <h3
                  onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                  className={`font-bold cursor-pointer hover:opacity-80 text-center ${
                    language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-snug tracking-[-0.01em]'
                  }`}
                  style={{ fontSize: Math.max(showcaseChrome.titleFontSizePx + 4, 20), color: showcaseChrome.titleColor }}
                >
                  {language === 'AR' ? currentShowcase.featured.titleAr : currentShowcase.featured.titleEn}
                </h3>
                <p className="flex items-center justify-center gap-1 font-normal mt-1" style={{ fontSize: showcaseChrome.taglineFontSizePx, color: showcaseChrome.taglineColor }}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-700 inline shrink-0" />
                  <span>
                    {language === 'AR' ? currentShowcase.featured.taglineAr : currentShowcase.featured.taglineEn}
                  </span>
                </p>

                {/* Price — C-FCP / C-FP showPrice */}
                {homeRailFlags.showPrice ? (
                <div className="flex items-baseline justify-center gap-2 pt-2 pb-1 font-sans">
                  <span className="font-bold" style={{ fontSize: showcaseChrome.priceFontSizePx, color: showcaseChrome.priceColor }}>
                    {language === 'AR' ? `${currentShowcase.featured.price.toLocaleString()}.00 ⃁` : `⃁ ${currentShowcase.featured.price.toLocaleString()}.00`}
                  </span>
                  {currentShowcase.featured.originalPrice && (
                    <span className="text-xs text-neutral-400 line-through font-normal">
                      {language === 'AR' ? `${currentShowcase.featured.originalPrice.toLocaleString()}.00 ⃁` : `⃁ ${currentShowcase.featured.originalPrice.toLocaleString()}.00`}
                    </span>
                  )}
                </div>
                ) : null}

                {/* Buttons (Honor style: solid black pill Buy + Learn More text link) */}
                <div className="flex items-center justify-center gap-6 pt-3">
                  <button
                    type="button"
                    onClick={() => navigateTo('product-buy', currentShowcase.featured.productId)}
                    className="px-6 py-2 bg-black hover:bg-neutral-800 text-white font-medium rounded-full transition-transform active:scale-95 cursor-pointer shadow-none"
                    style={{ fontSize: showcaseChrome.ctaFontSizePx }}
                  >
                    {buyLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                    className="font-normal hover:opacity-80 flex items-center gap-0.5 cursor-pointer hover:underline underline-offset-2"
                    style={{ fontSize: showcaseChrome.ctaFontSizePx, color: showcaseChrome.learnMoreColor }}
                  >
                    <span>{learnMoreLabel}</span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${language === 'AR' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right companion grid — stretch rows + pin CTAs so every card matches */}
            <div
              className={`lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full ${
                showcaseChrome.equalCardHeights
                  ? 'h-full min-h-0 items-stretch auto-rows-fr'
                  : 'items-start'
              }`}
            >
              {companionProducts.map(prod => (
                <div
                  key={prod.id}
                  className={`bg-white p-5 sm:p-6 flex flex-col min-h-[280px] transition-all duration-300 text-center w-full border-0 shadow-none hover:shadow-none group ${
                    showcaseChrome.equalCardHeights ? 'h-full' : ''
                  }`}
                  style={{ borderRadius: Math.max(0, showcaseChrome.cardRadius - 4) }}
                >
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Centered Isolated Product PNG (Pure White Background) */}
                    <div
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className="w-full h-40 sm:h-44 shrink-0 flex items-center justify-center mb-2 relative cursor-pointer bg-transparent"
                    >
                      <img
                        src={coffeeIsolatedCardImage(prod.id, prod.colors[0]?.image || prod.images[0])}
                        alt={prod.name}
                        className="h-full w-full max-h-[160px] object-contain bg-transparent group-hover:scale-104 transition-transform duration-500 ease-out"
                        referrerPolicy="no-referrer"
                        loading="lazy" decoding="async"
                      />
                    </div>

                    <h4
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className={`font-bold cursor-pointer hover:opacity-80 text-center line-clamp-2 min-h-[2.8em] ${
                        language === 'AR' ? 'leading-[1.4] tracking-normal' : 'leading-snug tracking-[-0.01em]'
                      }`}
                      style={{ fontSize: showcaseChrome.titleFontSizePx, color: showcaseChrome.titleColor }}
                    >
                      {language === 'AR' && prod.nameAr ? prod.nameAr : prod.name}
                    </h4>

                    <p className="line-clamp-1 min-h-[1.25em] mt-1 text-center font-normal" style={{ fontSize: showcaseChrome.taglineFontSizePx, color: showcaseChrome.taglineColor }}>
                      {language === 'AR' && prod.taglineAr ? prod.taglineAr : prod.tagline}
                    </p>

                    {homeRailFlags.showPrice ? (
                    <div className="pt-2 font-sans text-center flex items-baseline justify-center gap-1">
                      <span className="font-bold" style={{ fontSize: showcaseChrome.priceFontSizePx, color: showcaseChrome.priceColor }}>
                        {language === 'AR' ? `${prod.basePrice.toLocaleString()}.00 ⃁` : `⃁ ${prod.basePrice.toLocaleString()}.00`}
                      </span>
                    </div>
                    ) : null}
                  </div>

                  {/* Clean Links: Exactly Honor Reference - Buy >    Learn More > */}
                  <div className={`flex items-center justify-center gap-6 pt-3 shrink-0 ${showcaseChrome.equalCardHeights ? 'mt-auto' : ''}`}>
                    <button
                      type="button"
                      onClick={() => navigateTo('product-buy', prod.id)}
                      className="font-normal hover:opacity-80 flex items-center gap-0.5 cursor-pointer hover:underline underline-offset-2"
                      style={{ fontSize: showcaseChrome.ctaFontSizePx, color: showcaseChrome.buyColor }}
                    >
                      <span>{buyLabel}</span>
                      <ChevronRight className={`w-3 h-3 ${language === 'AR' ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className="font-normal hover:opacity-80 flex items-center gap-0.5 cursor-pointer hover:underline underline-offset-2"
                      style={{ fontSize: showcaseChrome.ctaFontSizePx, color: showcaseChrome.learnMoreColor }}
                    >
                      <span>{learnMoreLabel}</span>
                      <ChevronRight className={`w-3 h-3 ${language === 'AR' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showMoreProductsCta ? (
            <div className="hidden lg:flex justify-center mt-8">
              <button
                type="button"
                onClick={goShowcaseShop}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-bold transition-transform active:scale-95 cursor-pointer"
                data-showcase-more-products
              >
                <span>{moreProductsLabel}</span>
                <ChevronRight className={`w-4 h-4 ${language === 'AR' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          ) : null}

          {/* Mobile & Tablet Only: Responsive Touch-Swipe Slider Carousel */}
          <div className="block lg:hidden w-full relative">
            {/* Top Bar: Slide Counter & Prev/Next Arrow Buttons */}
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-xs font-semibold text-neutral-600 bg-white border border-neutral-200/80 px-3.5 py-1 rounded-full shadow-2xs">
                {language === 'AR'
                  ? `المنتج${safeActiveSlide + 1}من${totalMobileSlides}`
                  : `Item ${safeActiveSlide + 1} of ${totalMobileSlides}`}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => (language === 'AR' ? nextMobileSlide() : prevMobileSlide())}
                  aria-label={language === 'AR' ? 'المنتج السابق' : 'Previous product'}
                  className="w-8 h-8 rounded-full bg-white text-neutral-800 hover:text-black border border-neutral-200/80 shadow-2xs flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                >
                  <ChevronLeft className={`w-4 h-4 ${language === 'AR' ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => (language === 'AR' ? prevMobileSlide() : nextMobileSlide())}
                  aria-label={language === 'AR' ? 'المنتج التالي' : 'Next product'}
                  className="w-8 h-8 rounded-full bg-white text-neutral-800 hover:text-black border border-neutral-200/80 shadow-2xs flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                >
                  <ChevronRight className={`w-4 h-4 ${language === 'AR' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Carousel Swipeable Track with Smooth Hardware-Accelerated CSS Snap */}
            <div
              ref={mobileCarouselRef}
              className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-2 px-1 -mx-1 select-none touch-pan-x overscroll-x-contain"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
              }}
            >
              {/* Slide 1: Featured Flagship Card */}
              <div
                data-slide-index={0}
                className="w-[82vw] xs:w-[84vw] max-w-[320px] shrink-0 snap-center bg-white rounded-[26px] relative overflow-hidden flex flex-col justify-end text-center min-h-[460px] border-0 shadow-xs group select-none"
              >
                <div
                  onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                  className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden"
                >
                  <img
                    src={currentShowcase.featured.image}
                    alt={currentShowcase.featured.titleEn}
                    draggable={false}
                    className="w-full h-full object-cover object-[center_12%] group-hover:scale-104 transition-transform duration-700 ease-out select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                    loading="lazy" decoding="async"
                  />
                  {/* Top Badge: Flagship Highlight */}
                  <div className="absolute top-4 start-4 z-10">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-black bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                      <Sparkles className="w-3 h-3 text-amber-700" />
                      <span>{language === 'AR' ? 'الفئة الرائدة ✦' : 'Flagship ✦'}</span>
                    </span>
                  </div>
                  {/* Bottom Shade Gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-[64%] bg-gradient-to-t from-white via-white/95 via-white/70 to-transparent pointer-events-none" />
                </div>

                {/* Text & Action Buttons */}
                <div className="relative z-10 px-5 pb-6 pt-4 text-center flex flex-col items-center justify-end pointer-events-none">
                  <h3
                    onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                    className={`text-lg font-bold text-neutral-900 cursor-pointer hover:text-black text-center pointer-events-auto ${
                      language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-snug'
                    }`}
                  >
                    {language === 'AR' ? currentShowcase.featured.titleAr : currentShowcase.featured.titleEn}
                  </h3>
                  <p className="text-[12px] text-neutral-600 line-clamp-1 mt-1 text-center font-normal">
                    {language === 'AR' ? currentShowcase.featured.taglineAr : currentShowcase.featured.taglineEn}
                  </p>

                  {homeRailFlags.showPrice ? (
                  <div className="flex items-baseline justify-center gap-2 pt-2 pb-1 font-sans">
                    <span className="text-base font-bold text-neutral-900">
                      {language === 'AR' ? `${currentShowcase.featured.price.toLocaleString()}.00 ⃁` : `⃁ ${currentShowcase.featured.price.toLocaleString()}.00`}
                    </span>
                    {currentShowcase.featured.originalPrice && (
                      <span className="text-xs text-neutral-400 line-through font-normal">
                        {language === 'AR' ? `${currentShowcase.featured.originalPrice.toLocaleString()}.00 ⃁` : `⃁ ${currentShowcase.featured.originalPrice.toLocaleString()}.00`}
                      </span>
                    )}
                  </div>
                  ) : null}

                  <div className="flex items-center justify-center gap-5 pt-3 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => navigateTo('product-buy', currentShowcase.featured.productId)}
                      className="px-6 py-2 bg-black hover:bg-neutral-800 text-white font-medium rounded-full transition-transform active:scale-95 cursor-pointer shadow-none"
                      style={{ fontSize: showcaseChrome.ctaFontSizePx }}
                    >
                      {buyLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('product-detail', currentShowcase.featured.productId)}
                      className="font-normal hover:opacity-80 flex items-center gap-0.5 cursor-pointer hover:underline underline-offset-2"
                      style={{ fontSize: showcaseChrome.ctaFontSizePx, color: showcaseChrome.learnMoreColor }}
                    >
                      <span>{learnMoreLabel}</span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${language === 'AR' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Slides 2 to 5: Companion Hardware Products */}
              {companionProducts.map((prod, pIdx) => (
                <div
                  key={prod.id}
                  data-slide-index={pIdx + 1}
                  className="w-[82vw] xs:w-[84vw] max-w-[320px] shrink-0 snap-center bg-white rounded-[26px] p-5 flex flex-col text-center min-h-[460px] border-0 shadow-xs group select-none self-stretch"
                >
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Top Tag */}
                    <div className="flex items-center justify-between mb-2 shrink-0">
                      <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                        {language === 'AR' ? `منتج 0${pIdx + 2}` : `ITEM 0${pIdx + 2}`}
                      </span>
                      {prod.badge && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
                          {language === 'AR' && prod.badgeAr ? prod.badgeAr : prod.badge}
                        </span>
                      )}
                    </div>

                    {/* Isolated Product Image */}
                    <div
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className="w-full h-44 shrink-0 flex items-center justify-center my-2 cursor-pointer bg-transparent rounded-2xl p-2 select-none"
                    >
                      <img
                        src={coffeeIsolatedCardImage(prod.id, prod.colors[0]?.image || prod.images[0])}
                        alt={prod.name}
                        draggable={false}
                        className="h-full w-full max-h-[160px] object-contain bg-transparent group-hover:scale-106 transition-transform duration-500 ease-out select-none pointer-events-none"
                        referrerPolicy="no-referrer"
                        loading="lazy" decoding="async"
                      />
                    </div>

                    {/* Title */}
                    <h4
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className={`font-bold text-[15px] text-neutral-900 cursor-pointer hover:text-black text-center mt-2 line-clamp-2 min-h-[2.8em] ${
                        language === 'AR' ? 'leading-[1.4] tracking-normal' : 'leading-snug'
                      }`}
                    >
                      {language === 'AR' && prod.nameAr ? prod.nameAr : prod.name}
                    </h4>

                    {/* Tagline */}
                    <p className="text-[12px] text-neutral-600 line-clamp-1 min-h-[1.25em] mt-1 text-center font-normal">
                      {language === 'AR' && prod.taglineAr ? prod.taglineAr : prod.tagline}
                    </p>

                    {homeRailFlags.showPrice ? (
                    <div className="pt-2 font-sans text-center flex items-baseline justify-center gap-1">
                      <span className="text-base font-bold text-neutral-900">
                        {language === 'AR' ? `${prod.basePrice.toLocaleString()}.00 ⃁` : `⃁ ${prod.basePrice.toLocaleString()}.00`}
                      </span>
                    </div>
                    ) : null}
                  </div>

                  {/* Clean Links */}
                  <div className="flex items-center justify-center gap-5 pt-4 border-0 mt-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => navigateTo('product-buy', prod.id)}
                      className="px-5 py-2 bg-black hover:bg-neutral-800 text-white font-medium rounded-full transition-transform active:scale-95 cursor-pointer shadow-none"
                      style={{ fontSize: showcaseChrome.ctaFontSizePx }}
                    >
                      {buyLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('product-detail', prod.id)}
                      className="font-normal hover:opacity-80 flex items-center gap-0.5 cursor-pointer hover:underline underline-offset-2"
                      style={{ fontSize: showcaseChrome.ctaFontSizePx, color: showcaseChrome.learnMoreColor }}
                    >
                      <span>{learnMoreLabel}</span>
                      <ChevronRight className={`w-3 h-3 ${language === 'AR' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Explore / More Products → default shop page */}
              {showcaseChrome.showMoreProducts ? (
              <div
                data-slide-index={companionProducts.length + 1}
                onClick={goShowcaseShop}
                className="w-[82vw] xs:w-[84vw] max-w-[320px] shrink-0 snap-center bg-gradient-to-br from-neutral-900 to-black text-white rounded-[26px] p-6 flex flex-col justify-between items-center text-center min-h-[460px] shadow-sm cursor-pointer group select-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mt-8 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold text-lg text-white">
                    {moreProductsLabel}
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed max-w-[240px]">
                    {language === 'AR'
                      ? 'تصفح جميع مكائن ومطاحن ومستلزمات هايبرو الرسمية مع الضمان المعتمد.'
                      : 'Discover all HiBrew machines, grinders, and premium barista equipment.'}
                  </p>
                </div>
                <div className="w-full pb-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goShowcaseShop();
                    }}
                    className="w-full py-3 bg-white text-black font-bold text-xs rounded-full hover:bg-neutral-100 transition-transform active:scale-95 cursor-pointer"
                  >
                    {moreProductsLabel}
                  </button>
                </div>
              </div>
              ) : null}
            </div>

            {/* Bottom Dots Pagination */}
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {Array.from({ length: totalMobileSlides }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    safeActiveSlide === idx
                      ? 'w-7 bg-black'
                      : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      </section>
      ) : null}
    </>
  );

};
