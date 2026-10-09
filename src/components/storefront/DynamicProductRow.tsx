import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Star,
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../common/ToastProvider';
import type { Product } from '../../types';
import {
  type ProductRowConfig,
  filterProductsByRowConfig,
  generateShortcode,
} from '../../utils/productRowShortcodes';

interface DynamicProductRowProps {
  config: Partial<ProductRowConfig>;
  allProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
  onViewCategory?: (categorySlug: string) => void;
  isBuilderPreview?: boolean;
}

export const DynamicProductRow: React.FC<DynamicProductRowProps> = ({
  config,
  allProducts: propProducts,
  onSelectProduct,
  onViewCategory,
  isBuilderPreview = false,
}) => {
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const { currentProducts, addToCart: tenantAddToCart } = useTenant();
  const { toast } = useToast();

  const sourceProducts = propProducts && propProducts.length > 0 ? propProducts : currentProducts;

  // Filter dynamically based on category, brand, specific IDs or collection type
  const matchingProducts = useMemo(() => {
    return filterProductsByRowConfig(sourceProducts, config);
  }, [sourceProducts, config]);

  const [sliderIndex, setSliderIndex] = useState(0);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const limit = config.limit || 6;
  const layout = config.layout || 'slider';
  const columns = config.columns || 4;

  const title = isAr ? config.titleAr || 'مختارات مميزة' : config.titleEn || 'Curated Selection';
  const subtitle = isAr ? config.subtitleAr : config.subtitleEn;
  const badgeText = isAr ? config.badgeTextAr : config.badgeTextEn;

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    try {
      tenantAddToCart(product);
      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
      toast(
        isAr ? `تمت إضافة "${product.nameAr || product.name}" للسلة` : `Added "${product.name}" to cart`,
        'success'
      );
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      }, 2000);
    } catch {
      // Fallback notification
      toast(isAr ? 'تمت إضافة المنتج للسلة' : 'Added to cart', 'success');
    }
  };

  const handleNextSlide = () => {
    const maxIndex = Math.max(0, matchingProducts.length - 1);
    setSliderIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handlePrevSlide = () => {
    const maxIndex = Math.max(0, matchingProducts.length - 1);
    setSliderIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  if (!matchingProducts || matchingProducts.length === 0) {
    if (isBuilderPreview) {
      return (
        <div className="py-8 px-4 text-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 my-4">
          <p className="text-sm font-bold text-slate-500">
            {isAr ? 'لا توجد منتجات تطابق شرط هذا الصف حالياً' : 'No products match this row filter yet'}
          </p>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            {generateShortcode(config)}
          </span>
        </div>
      );
    }
    return null;
  }

  // Grid column classes based on settings
  const gridColsClass = useMemo(() => {
    switch (columns) {
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2 md:grid-cols-3';
      case 5:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5';
      case 6:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';
      case 4:
      default:
        return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  }, [columns]);

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative group/row">
      {/* Elementor Pro Shortcode Tag in Builder Preview */}
      {isBuilderPreview && (
        <div className="mb-3 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-[11px] text-indigo-900 font-mono">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-bold">Dynamic Product Row:</span>
            <span>{generateShortcode(config)}</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
            {matchingProducts.length} {isAr ? 'منتجات' : 'items'}
          </span>
        </div>
      )}

      {/* Row Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-2 border-b border-emerald-950/10">
        <div>
          {badgeText && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              {badgeText}
            </span>
          )}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight font-serif">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {layout === 'slider' && matchingProducts.length > 4 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white transition-all shadow-xs flex items-center justify-center cursor-pointer"
                title={isAr ? 'السابق' : 'Previous'}
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white transition-all shadow-xs flex items-center justify-center cursor-pointer"
                title={isAr ? 'التالي' : 'Next'}
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          )}

          {config.viewAllLink && (
            <button
              type="button"
              onClick={() => {
                if (onViewCategory && config.categorySlug) {
                  onViewCategory(config.categorySlug);
                }
              }}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* Row Products Render (Slider or Grid) */}
      {layout === 'slider' ? (
        <div className="relative overflow-hidden">
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-slate-200">
            {matchingProducts.map((product) => {
              const name = isAr ? product.nameAr || product.name : product.name || product.nameAr;
              const isAdded = !!addedIds[product.id];
              const priceVal = product.discountedPrice || product.price;
              const hasDiscount = product.originalPrice && product.originalPrice > priceVal;

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct && onSelectProduct(product)}
                  className="min-w-[240px] sm:min-w-[270px] max-w-[280px] shrink-0 snap-start bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-emerald-700/40 p-3 sm:p-4 transition-all duration-300 hover:shadow-xl group cursor-pointer flex flex-col justify-between relative"
                >
                  {/* Badge */}
                  {hasDiscount && (
                    <span className="absolute top-5 start-5 z-10 bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                      {isAr ? 'خصم خاص' : 'Sale'}
                    </span>
                  )}

                  {/* Product Image */}
                  <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 mb-3">
                    <img
                      src={product.image || '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg'}
                      alt={name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      type="button"
                      aria-label="Wishlist"
                      className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-slate-600 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block truncate">
                        {product.category || (isAr ? 'زهور طبيعية' : 'Flowers')}
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-900 transition-colors">
                        {name}
                      </h3>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm sm:text-base font-black text-emerald-900 font-mono">
                            {money ? money(priceVal) : `${priceVal} SAR`}
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] text-slate-400 line-through font-mono">
                              {money ? money(product.originalPrice!) : `${product.originalPrice} SAR`}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-900 text-white hover:bg-emerald-950 active:scale-95'
                        }`}
                        title={isAr ? 'إضافة للسلة' : 'Add to cart'}
                      >
                        {isAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid Layout */
        <div className={`grid ${gridColsClass} gap-3 sm:gap-5`}>
          {matchingProducts.map((product) => {
            const name = isAr ? product.nameAr || product.name : product.name || product.nameAr;
            const isAdded = !!addedIds[product.id];
            const priceVal = product.discountedPrice || product.price;
            const hasDiscount = product.originalPrice && product.originalPrice > priceVal;

            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct && onSelectProduct(product)}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-emerald-700/40 p-3 sm:p-4 transition-all duration-300 hover:shadow-xl group cursor-pointer flex flex-col justify-between relative"
              >
                {/* Badge */}
                {hasDiscount && (
                  <span className="absolute top-5 start-5 z-10 bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                    {isAr ? 'خصم' : 'Sale'}
                  </span>
                )}

                {/* Product Image */}
                <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 mb-3">
                  <img
                    src={product.image || '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg'}
                    alt={name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    type="button"
                    aria-label="Wishlist"
                    className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-slate-600 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                {/* Product Details */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block truncate">
                      {product.category || (isAr ? 'زهور طبيعية' : 'Flowers')}
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-900 transition-colors">
                      {name}
                    </h3>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm sm:text-base font-black text-emerald-900 font-mono">
                          {money ? money(priceVal) : `${priceVal} SAR`}
                        </span>
                        {hasDiscount && (
                          <span className="text-[11px] text-slate-400 line-through font-mono">
                            {money ? money(product.originalPrice!) : `${product.originalPrice} SAR`}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, product)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-900 text-white hover:bg-emerald-950 active:scale-95'
                      }`}
                      title={isAr ? 'إضافة للسلة' : 'Add to cart'}
                    >
                      {isAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
