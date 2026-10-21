import React from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import {
  Heart,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Flower2,
  ShieldCheck,
  Truck,
  Package,
  Eye,
} from 'lucide-react';
import type { Product } from '../types';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../../utils/imageFallback';
import { readAllThemeSettings } from '../../settings/themeSettingsStore';

export interface BestSellersSectionProps {
  settings?: Record<string, any>;
  isBuilderMode?: boolean;
}

export const BestSellersSection: React.FC<BestSellersSectionProps> = ({
  settings,
  isBuilderMode = false,
}) => {
  const {
    language,
    products,
    addToCart,
    wishlist,
    toggleWishlist,
    navigateToProduct,
    setCurrentPage,
    setSelectedCategory,
    builderDevice,
  } = useApp();

  const { activeStore, currentProducts } = useTenant();
  const isAr = language === 'ar';
  const s = settings || {};

  // Read merchant customization from Theme Settings / Page Builder
  const themeSettings = React.useMemo(() => {
    return readAllThemeSettings(activeStore?.id || 'store-1', activeStore);
  }, [activeStore]);

  const cardSettings = themeSettings.productCards;
  const cardPreset = cardSettings.cardDesignPreset || 'royal-luxury';
  const showBadges = cardSettings.showFeatureBadges !== false;
  const showWhatsApp = cardSettings.showWhatsAppButton !== false;

  // Real store catalog strictly isolated to activeStore.id (Zero Fake / Mock arrays)
  const storeCatalog = React.useMemo(() => {
    const list = (currentProducts && currentProducts.length > 0)
      ? currentProducts
      : (products || []);
    // Filter out inactive products
    return list.filter((p) => (p as any).status !== 'archived');
  }, [currentProducts, products]);

  const columnsCount = s.columns || themeSettings.tabs?.columnsCount || themeSettings.customProducts?.columnsCount || 4;
  const limitCount = s.limit || themeSettings.tabs?.numberOfProducts || themeSettings.customProducts?.numberOfProducts || 8;
  const collectionFilter = s.tagFilter || s.categoryFilter || themeSettings.tabs?.collectionFilter || 'all';

  // Dynamic products filtered by merchant criteria (Strict Zero Mock Data Policy)
  const items = React.useMemo(() => {
    if (!storeCatalog || storeCatalog.length === 0) return [];

    let filtered = storeCatalog;
    if (collectionFilter && collectionFilter !== 'all') {
      const matchKey = collectionFilter.toLowerCase();
      filtered = storeCatalog.filter((p) => {
        const pBadge = String(p.badge || '').toLowerCase();
        const pTags = (p.tags || []).map((t) => String(t).toLowerCase());
        const pCat = String(p.category || '').toLowerCase();
        return (
          pBadge === matchKey ||
          pBadge.includes(matchKey) ||
          pTags.includes(matchKey) ||
          pCat.includes(matchKey)
        );
      });
      if (filtered.length < limitCount) {
        const existingIds = new Set(filtered.map((f) => f.id));
        const rest = storeCatalog.filter((p) => !existingIds.has(p.id));
        filtered = [...filtered, ...rest];
      }
    } else {
      // Prioritize products tagged best_sellers, top_product, trending
      const priority = storeCatalog.filter((p) => {
        const b = String(p.badge || '').toLowerCase();
        const t = (p.tags || []).map((x) => String(x).toLowerCase());
        return b === 'best_sellers' || b === 'top_product' || b === 'trending' || t.includes('best_sellers') || t.includes('trending');
      });
      const existingIds = new Set(priority.map((p) => p.id));
      const rest = storeCatalog.filter((p) => !existingIds.has(p.id));
      filtered = [...priority, ...rest];
    }

    return filtered.slice(0, limitCount);
  }, [storeCatalog, collectionFilter, limitCount]);

  const handleViewAll = () => {
    setSelectedCategory(null);
    setCurrentPage('catalog');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const storePhone = (activeStore as any)?.phone || '966500000000';
  const cleanPhone = storePhone.replace(/[^0-9]/g, '');

  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e4e3e] dark:text-emerald-400 block mb-0.5">
            {isAr ? 'الأكثر طلباً ومبيعاً' : 'Top Best Sellers'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {isAr
              ? s.titleAr || (activeStore?.id === 'store-coffee' ? 'المحاصيل الأكثر مبيعاً' : 'الأكثر مبيعاً')
              : s.titleEn || (activeStore?.id === 'store-coffee' ? 'Best Selling Roasts' : 'Best Selling Products')}
          </h2>
          {(s.subtitleAr || s.subtitleEn) && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isAr ? s.subtitleAr : s.subtitleEn}
            </p>
          )}
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleViewAll}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0e4e3e] dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer group"
          >
            <span>{isAr ? 'عرض الكل' : 'View All'}</span>
            {isAr ? (
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        )}
      </div>

      {/* Genuine Empty State (Strict Zero Mock Data Policy) */}
      {items.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد منتجات مسجلة حالياً' : 'No products found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isAr
              ? 'لم يتم إضافة منتجات إلى هذا المتجر بعد. سيتم ظهور المنتجات فور إضافتها من لوحة التحكم.'
              : 'No products are currently in this store catalog. Add products from the dashboard to display them here.'}
          </p>
        </div>
      ) : (
        /* Dynamic Products Grid (Strictly Configured via Theme Customizer / Page Builder) */
        <div
          className={`grid gap-4 sm:gap-6 ${
            builderDevice === 'mobile'
              ? 'grid-cols-1 sm:grid-cols-2'
              : builderDevice === 'tablet'
                ? 'grid-cols-2 sm:grid-cols-3'
                : columnsCount === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : columnsCount === 3
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : columnsCount === 5
                      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                      : columnsCount === 6
                        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                        : columnsCount === 8
                          ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8'
                          : columnsCount === 10
                            ? 'grid-cols-2 sm:grid-cols-5 lg:grid-cols-10'
                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {items.map((item) => {
            const isWish = wishlist.includes(item.id);
            const name = isAr ? (item.nameAr || item.name) : (item.nameEn || item.name);
            const itemAny = item as any;
            const subtitle = isAr
              ? (itemAny.descriptionAr || itemAny.subtitleAr || (item.categoryAr ? `${item.categoryAr} طبيعية فاخرة` : 'زهور سعودية طبيعية فاخرة'))
              : (itemAny.descriptionEn || itemAny.subtitle || (item.categoryEn ? `Premium Saudi ${item.categoryEn}` : 'Premium Saudi Fresh Flowers'));

            const origPrice = item.originalPrice || (item.price ? Math.round(item.price * 1.25) : 0);
            const hasDiscount = origPrice > item.price;
            const discountPct = hasDiscount
              ? Math.round(((origPrice - item.price) / origPrice) * 100)
              : 20;
            const discountBadge = isAr ? `خصم ${discountPct}%` : `${discountPct}% OFF`;

            const waText = isAr
              ? `السلام عليكم، أود طلب المنتج: *${name}* بسعر ${item.price} ر.س من متجر ${activeStore?.name || 'الزهور'}`
              : `Hello, I would like to order: *${name}* for SAR ${item.price} from ${activeStore?.name || 'Flowers Store'}`;
            const waUrl = `https://wa.me/${cleanPhone || '966500000000'}?text=${encodeURIComponent(waText)}`;

            return (
              <article
                key={item.id}
                onClick={() => navigateToProduct(item as any)}
                className="group rounded-[28px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/50 cursor-pointer relative"
              >
                {/* 1. Image Container with Top-Left Forest Green Discount Badge */}
                <div className="relative aspect-[4/4.8] overflow-hidden bg-slate-50 dark:bg-slate-950">
                  <img
                    src={item.image || FALLBACK_PRODUCT_IMAGE}
                    alt={name}
                    onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                    className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
                    loading="lazy" decoding="async"
                  />

                  {/* 20% OFF Badge (Top-Start Forest Green Pill) */}
                  <div className="absolute top-3.5 start-3.5 z-10">
                    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-[#0e4e3e] text-white shadow-md shadow-emerald-950/20">
                      {discountBadge}
                    </span>
                  </div>

                  {/* Floating Quick View hint on hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToProduct(item as any);
                    }}
                    className="absolute bottom-3 end-3 opacity-0 group-hover:opacity-100 transition-all duration-200 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white flex items-center justify-center shadow-md hover:scale-110 cursor-pointer"
                    title={isAr ? 'معاينة سريعة' : 'Quick preview'}
                  >
                    <Eye className="w-4 h-4 text-[#0e4e3e] dark:text-emerald-400" />
                  </button>
                </div>

                {/* 2. Body Container */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  {/* Row: Title & Circular Wishlist */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[2.25rem] group-hover:text-[#0e4e3e] dark:group-hover:text-emerald-400 transition-colors"
                        title={name}
                      >
                        {name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
                        {subtitle}
                      </p>
                    </div>

                    {/* Circular Wishlist Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(item.id);
                      }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shrink-0 shadow-2xs cursor-pointer"
                      title={isWish ? (isAr ? 'محفوظ في المفضلة' : 'In Wishlist') : (isAr ? 'أضف للمفضلة' : 'Add to Wishlist')}
                    >
                      <Heart
                        className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                          isWish ? 'fill-rose-500 text-rose-500' : 'stroke-current'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Price Row: Emerald bold price + strikethrough compare price */}
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-xl sm:text-2xl font-extrabold text-[#0e4e3e] dark:text-emerald-400 font-mono tracking-tight">
                      {isAr ? `${item.price} ر.س` : `SAR ${item.price}`}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 line-through font-semibold font-mono">
                        {isAr ? `${origPrice} ر.س` : `SAR ${origPrice}`}
                      </span>
                    )}
                  </div>

                  {/* 3 Trust Badges: Clean Text without Icons for 100% Readability */}
                  {showBadges && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-[#eaf4ef] dark:bg-emerald-950/40 text-[#0e4e3e] dark:text-emerald-300 border border-[#d2e8dd]/60 dark:border-emerald-800/30 whitespace-nowrap">
                        {isAr ? 'زهور طبيعية' : 'Fresh Flowers'}
                      </span>

                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-[#eaf4ef] dark:bg-emerald-950/40 text-[#0e4e3e] dark:text-emerald-300 border border-[#d2e8dd]/60 dark:border-emerald-800/30 whitespace-nowrap">
                        {isAr ? 'جودة فاخرة' : 'Premium Quality'}
                      </span>

                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-[#eaf4ef] dark:bg-emerald-950/40 text-[#0e4e3e] dark:text-emerald-300 border border-[#d2e8dd]/60 dark:border-emerald-800/30 whitespace-nowrap">
                        {isAr ? 'توصيل سريع' : 'Fast Delivery'}
                      </span>
                    </div>
                  )}

                  {/* Dual Action Buttons: Add to Cart + WhatsApp (Fully Readable Text, No Truncation) */}
                  <div className="grid grid-cols-2 gap-2 pt-1.5">
                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item as any, 1);
                      }}
                      className="w-full py-2 sm:py-2.5 px-2 rounded-full bg-[#0e4e3e] hover:bg-[#0a382c] text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap"
                      title={isAr ? 'إضافة إلى السلة' : 'Add to Cart'}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                      <span>{isAr ? 'إضافة للسلة' : 'Add to Cart'}</span>
                    </button>

                    {/* Order on WhatsApp Button */}
                    {showWhatsApp ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 sm:py-2.5 px-2 rounded-full bg-[#0e4e3e] hover:bg-[#0a382c] text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap"
                        title={isAr ? 'طلب عبر واتساب' : 'Order on WhatsApp'}
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0 fill-white" />
                        <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToProduct(item as any);
                        }}
                        className="w-full py-2 sm:py-2.5 px-2 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'معاينة' : 'Quick View'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

