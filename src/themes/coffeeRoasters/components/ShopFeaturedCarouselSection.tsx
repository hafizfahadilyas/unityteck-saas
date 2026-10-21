import React, { useRef, useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { Product } from '../types';
import { handleImageError } from '../../../utils/imageFallback';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface ShopFeaturedCarouselSectionProps {
  products?: Product[];
  storeCurrency?: string;
}

interface ProductCarouselCardProps {
  product: Product;
  storeCurrency: string;
  isAr: boolean;
  onNavigate: (route: any, id?: string) => void;
}

const ProductCarouselCard: React.FC<ProductCarouselCardProps> = ({
  product,
  storeCurrency,
  isAr,
  onNavigate,
}) => {
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  const colors = product.colors || [];
  const activeColor = colors[selectedColorIdx];

  // Resolve current image: color specific image -> product images -> fallback
  const activeImage =
    activeColor?.image ||
    product.images?.[0] ||
    (product as any).image ||
    '/src/assets/images/hibrew_h7a_flagship_machine.png';

  const priceDelta = Number(activeColor?.priceDelta) || 0;
  const currentPrice = (Number(product.basePrice) || 0) + priceDelta;
  const originalPrice = product.originalPrice ? (Number(product.originalPrice) || 0) + priceDelta : null;

  const prodTitle = isAr
    ? product.nameAr || product.name
    : product.name;

  return (
    <div
      onClick={() => onNavigate('product-detail', String(product.id))}
      className="w-[235px] sm:w-[255px] md:w-[265px] lg:w-[275px] shrink-0 snap-start bg-[#FBFBFB] hover:bg-white rounded-3xl p-4 sm:p-5 border-0 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between items-center text-center group cursor-pointer select-none"
    >
      {/* 1. Product Image Showcase */}
      <div className="w-full h-44 sm:h-48 flex items-center justify-center p-2 overflow-hidden">
        <img
          src={activeImage}
          alt={prodTitle}
          onError={(e) =>
            handleImageError(e, '/src/assets/images/hibrew_h7a_flagship_machine.png')
          }
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
          loading="lazy" decoding="async"
        />
      </div>

      {/* 2. Product Title */}
      <div className="w-full mt-2">
        <h4
          className="font-bold text-sm sm:text-base text-neutral-900 group-hover:text-black line-clamp-1 transition-colors"
          title={prodTitle}
        >
          {prodTitle}
        </h4>
      </div>

      {/* 3. Color Swatches (Interactive with active ring) */}
      <div className="flex items-center justify-center gap-1.5 my-2.5 min-h-[22px]">
        {colors.length > 0 ? (
          colors.map((c, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedColorIdx(idx);
              }}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-neutral-300/80 transition-all cursor-pointer ${
                selectedColorIdx === idx
                  ? 'ring-2 ring-neutral-900 ring-offset-2 scale-110 shadow-xs'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex || '#18181b' }}
              title={isAr ? c.nameAr || c.name : c.name}
            />
          ))
        ) : (
          <div className="h-4" />
        )}
      </div>

      {/* 4. Price Row */}
      <div className="flex items-center justify-center gap-2 my-1">
        <span className="font-black text-sm sm:text-base text-neutral-950 font-sans">
          {currentPrice.toLocaleString()} {storeCurrency}
        </span>
        {originalPrice && originalPrice > currentPrice && (
          <span className="text-xs text-neutral-400 line-through font-sans">
            {originalPrice.toLocaleString()} {storeCurrency}
          </span>
        )}
      </div>

      {/* 5. Bottom Actions: Buy pill button & Learn More text link */}
      <div className="flex items-center justify-center gap-3 mt-3 pt-2.5 border-0 w-full">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('product-buy', String(product.id));
          }}
          className="px-5 py-1.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          {isAr ? 'شراء' : 'Buy'}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('product-detail', String(product.id));
          }}
          className="text-xs font-semibold text-neutral-700 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isAr ? 'معرفة المزيد' : 'Learn More'}</span>
          {isAr ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};

export const ShopFeaturedCarouselSection: React.FC<ShopFeaturedCarouselSectionProps> = ({
  products: propProducts,
  storeCurrency: propCurrency,
}) => {
  const { navigateTo, language, products: contextProducts } = useCart();
  const { activeStore } = useTenant();

  const isAr = language === 'AR';

  // Master product source (Zero Mock Data Policy)
  const masterProducts = useMemo(() => {
    if (propProducts && propProducts.length > 0) return propProducts;
    if (contextProducts && contextProducts.length > 0) return contextProducts;
    return [];
  }, [propProducts, contextProducts]);

  const storeCurrency =
    propCurrency || (isAr ? 'ر.س' : activeStore?.currency || 'SAR');

  const carouselRef = useRef<HTMLDivElement>(null);

  // Scroll handler with RTL / LTR awareness
  const handleScroll = (direction: 'prev' | 'next') => {
    if (!carouselRef.current) return;
    const scrollAmount = 300;
    // In RTL browsers, positive scroll goes backward or forward depending on browser implementation.
    // scrollBy with proper delta ensures smooth movement across platforms.
    const delta = isAr
      ? direction === 'next'
        ? -scrollAmount
        : scrollAmount
      : direction === 'next'
      ? scrollAmount
      : -scrollAmount;

    carouselRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // If no products exist in the store catalog, show genuine empty state per Rule 1
  if (masterProducts.length === 0) {
    return null;
  }

  // Filter machines / flagship models or catalog items for the carousel
  const carouselProducts = masterProducts.slice(0, 10);

  // Flagship showcase image for the side promotional card
  const flagshipShowcaseImg =
    carouselProducts[0]?.images?.[0] ||
    carouselProducts[0]?.colors?.[0]?.image ||
    '/src/assets/images/hibrew_h7a_flagship_machine.png';

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-3 select-none">
      {/* Container: Side Banner Card + Product Carousel */}
      <div className="relative flex flex-col md:flex-row items-stretch gap-4 sm:gap-6 w-full">
        
        {/* ========================================================================= */}
        {/* 1. SIDE IMAGE BANNER CARD (HIDDEN ON MOBILE, VISIBLE ON MD/LG DESKTOP)   */}
        {/* ========================================================================= */}
        <div
          onClick={() =>
            carouselProducts[0]
              ? navigateTo('product-detail', String(carouselProducts[0].id))
              : navigateTo('products')
          }
          className="hidden md:flex w-[250px] lg:w-[280px] shrink-0 rounded-3xl bg-gradient-to-b from-[#3B2215] via-[#2A170F] to-[#1D100A] border-0 p-6 flex-col justify-between items-center text-center relative overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
        >
          {/* Subtle warm coffee ambient glow behind the machine */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-600/15 rounded-full blur-2xl pointer-events-none" />

          {/* Subtle decorative sparkles / top header */}
          <div className="w-full flex items-start justify-between relative z-10">
            <Sparkles className="w-5 h-5 text-amber-300 drop-shadow-sm" />
            <div className={`space-y-0.5 ${isAr ? 'text-right' : 'text-left'}`}>
              <span className="text-xs font-bold text-amber-200/85 block font-sans">
                {isAr ? 'سلسلة احترافية' : 'Pro Series &'}
              </span>
              <h3 className="text-xl font-black text-white tracking-tight leading-tight drop-shadow-xs">
                {isAr ? 'Barista & Pro' : 'Barista Edition'}
              </h3>
            </div>
          </div>

          {/* Large flagship cut-out image */}
          <div className="my-auto py-4 w-full flex items-center justify-center relative z-10">
            <img
              src={flagshipShowcaseImg}
              alt={isAr ? 'الإصدار الرائد' : 'Flagship Showcase'}
              onError={(e) =>
                handleImageError(e, '/src/assets/images/hibrew_h7a_flagship_machine.png')
              }
              className="max-h-[260px] w-auto max-w-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)]"
            />
          </div>

          {/* Bottom explore note */}
          <div className="w-full pt-2 relative z-10">
            <span className="text-[11px] font-bold text-[#2A170F] bg-white hover:bg-amber-50 px-3.5 py-1 rounded-full border-0 inline-block shadow-sm group-hover:bg-white group-hover:shadow-md group-hover:scale-105 transition-all">
              {isAr ? 'استكشف المجموعة الكاملة' : 'Explore Full Collection'}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PRODUCTS CAROUSEL (SHOWN ON BOTH MOBILE & DESKTOP)                     */}
        {/* ========================================================================= */}
        <div className="flex-1 min-w-0 relative flex items-center">
          
          {/* Prev Navigation Button */}
          <button
            type="button"
            onClick={() => handleScroll('prev')}
            className={`absolute z-20 ${
              isAr ? 'right-2' : 'left-2'
            } w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-900/60 hover:bg-neutral-900 text-white flex items-center justify-center backdrop-blur-sm shadow-md transition-all active:scale-90 cursor-pointer`}
            title={isAr ? 'السابق' : 'Previous'}
          >
            {isAr ? (
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          {/* Horizontal Scrollable Carousel Container */}
          <div
            ref={carouselRef}
            className="w-full flex items-stretch gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-1 no-scrollbar"
          >
            {carouselProducts.map((prod) => (
              <ProductCarouselCard
                key={prod.id}
                product={prod}
                storeCurrency={storeCurrency}
                isAr={isAr}
                onNavigate={navigateTo}
              />
            ))}
          </div>

          {/* Next Navigation Button */}
          <button
            type="button"
            onClick={() => handleScroll('next')}
            className={`absolute z-20 ${
              isAr ? 'left-2' : 'right-2'
            } w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-900/60 hover:bg-neutral-900 text-white flex items-center justify-center backdrop-blur-sm shadow-md transition-all active:scale-90 cursor-pointer`}
            title={isAr ? 'التالي' : 'Next'}
          >
            {isAr ? (
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

        </div>

      </div>
    </section>
  );
};

