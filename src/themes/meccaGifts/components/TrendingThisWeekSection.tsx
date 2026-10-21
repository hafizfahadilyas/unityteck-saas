import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { ChevronLeft, ChevronRight, ShoppingCart, ShoppingBag, Sparkles } from 'lucide-react';
import { Product } from '../types';

export interface TrendingThisWeekSectionProps {
  blockId?: string;
  settings?: Record<string, any>;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  bannerImage?: string;
  categoryFilter?: string;
  brandFilter?: string;
  tagFilter?: string;
  limit?: number;
  imageAspectRatio?: 'portrait' | 'square' | 'tall' | 'auto';
  showPrices?: boolean;
  showAddToCart?: boolean;
  showTitle?: boolean;
  isBuilderMode?: boolean;
}

export const TrendingThisWeekSection: React.FC<TrendingThisWeekSectionProps> = ({
  blockId,
  settings,
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  bannerImage,
  categoryFilter,
  brandFilter,
  tagFilter,
  limit,
  imageAspectRatio,
  showPrices,
  showAddToCart,
  showTitle,
  isBuilderMode = false,
}) => {
  const { language, products, addToCart, navigateToProduct } = useApp();
  const { activeStore, currentProducts } = useTenant();
  const isAr = language === 'ar';
  const scrollRef = useRef<HTMLDivElement>(null);

  const s = settings || {};

  // Store Category / Industry Detection
  const isCoffee =
    activeStore?.id === 'store-coffee' ||
    Boolean(activeStore?.category && activeStore.category.includes('قهوة')) ||
    Boolean(activeStore?.domain?.includes('coffee')) ||
    Boolean(s.isCoffee);

  const isCarStore =
    activeStore?.id?.includes('transport') ||
    activeStore?.id?.includes('car') ||
    Boolean(
      activeStore?.category &&
        (activeStore.category.includes('سيارات') ||
          activeStore.category.toLowerCase().includes('car') ||
          activeStore.category.toLowerCase().includes('transport'))
    );

  // Industry-specific smart fallbacks
  const defaultTitleAr = isCoffee
    ? 'المحاصيل الأكثر رواجاً هذا الأسبوع'
    : isCarStore
    ? 'إكسسوارات السيارات الأكثر طلباً'
    : 'الأكثر رواجاً هذا الأسبوع';

  const defaultTitleEn = isCoffee
    ? 'Trending Coffee Blends This Week'
    : isCarStore
    ? 'Trending Vehicle Accessories This Week'
    : 'Trending This Week';

  const defaultSubAr = isCoffee
    ? 'أفضل محاصيل القهوة المختصة الأكثر طلباً وتقييماً هذا الأسبوع'
    : isCarStore
    ? 'تشكيلة مختارة من أرقى أغطية المقاعد والدعاسات الملكية الأكثر مبيعاً'
    : 'تشكيلة الورود والهدايا الأكثر طلباً وإعجاباً هذا الأسبوع';

  const defaultSubEn = isCoffee
    ? 'Most popular specialty single origins and blends this week'
    : isCarStore
    ? 'Top trending luxury seat covers and floor mats for your vehicle'
    : 'Most loved floral arrangements and gifts tailored by master florists';

  const activeTitleAr = s.titleAr || s.mainTitleAr || titleAr || defaultTitleAr;
  const activeTitleEn = s.titleEn || s.mainTitleEn || titleEn || defaultTitleEn;
  const activeSubtitleAr = s.subtitleAr || subtitleAr || defaultSubAr;
  const activeSubtitleEn = s.subtitleEn || subtitleEn || defaultSubEn;

  const activeBanner = s.bannerImage || s.imageUrl || bannerImage;
  const selectedCategory = s.categoryFilter || s.categorySlug || categoryFilter;
  const selectedBrand = s.brandFilter || brandFilter;
  const selectedTag = s.tagFilter || tagFilter;
  const itemsLimit = s.limit || limit || 10;
  const aspectMode = s.imageAspectRatio || imageAspectRatio || 'portrait'; // 'portrait' = Full Image 4:5 matching reference photo
  const displayTitle = s.showTitle !== false && showTitle !== false;
  const displayPrice = s.showPrices !== false && showPrices !== false;
  const displayCart = s.showAddToCart !== false && showAddToCart !== false;

  // Real store catalog strictly isolated to active tenant
  const storeCatalog = React.useMemo(() => {
    const list =
      currentProducts && currentProducts.length > 0
        ? currentProducts
        : products || [];
    return list.filter((p) => (p as any).status !== 'archived');
  }, [currentProducts, products]);

  // Dynamic filter with ZERO mock/fake arrays
  const items = React.useMemo(() => {
    if (!storeCatalog || storeCatalog.length === 0) return [];

    let filtered = [...storeCatalog];

    // Filter by category if requested
    if (selectedCategory && selectedCategory !== 'all') {
      const target = selectedCategory.toLowerCase();
      filtered = filtered.filter((p) => {
        const cat = (p.category || '').toLowerCase();
        const catSlug = ((p as any).categorySlug || '').toLowerCase();
        return cat.includes(target) || catSlug.includes(target);
      });
    }

    // Filter by brand if requested
    if (selectedBrand && selectedBrand !== 'all') {
      filtered = filtered.filter(
        (p) => (p as any).brandId === selectedBrand || (p as any).brand === selectedBrand
      );
    }

    // Filter by tag if requested
    if (selectedTag && selectedTag !== 'all') {
      const tagLower = selectedTag.toLowerCase();
      filtered = filtered.filter((p) => {
        const b = String(p.badge || '').toLowerCase();
        const tags = (p.tags || []).map((t) => String(t).toLowerCase());
        return b === tagLower || tags.includes(tagLower);
      });
    } else {
      // Prioritize trending or popular products in catalog
      const trendingList = filtered.filter((p) => {
        const b = String(p.badge || '').toLowerCase();
        const tags = (p.tags || []).map((x) => String(x).toLowerCase());
        return (
          b.includes('trend') ||
          b.includes('top') ||
          b.includes('best') ||
          tags.includes('trending')
        );
      });

      if (trendingList.length >= 4) {
        filtered = trendingList;
      }
    }

    return filtered.slice(0, itemsLimit);
  }, [storeCatalog, selectedCategory, selectedBrand, selectedTag, itemsLimit]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({
        left: isAr ? -offset : offset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-colors">
      {/* Optional Custom Section Banner */}
      {activeBanner && (
        <div className="mb-6 rounded-3xl overflow-hidden shadow-md max-h-48 sm:max-h-64 relative">
          <img
            src={activeBanner}
            alt={isAr ? activeTitleAr : activeTitleEn}
            className="w-full h-full object-cover"
            loading="lazy" decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
            <span className="text-white font-bold text-lg sm:text-xl font-serif drop-shadow-sm">
              {isAr ? activeTitleAr : activeTitleEn}
            </span>
          </div>
        </div>
      )}

      {/* Header with Title, Subtitle, and Prev / Next Arrow Controls */}
      <div className="flex items-end justify-between mb-8 pb-3 border-b border-[#ece7de] dark:border-stone-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c] dark:text-[#f3e5c8] tracking-tight">
              {isAr ? activeTitleAr : activeTitleEn}
            </h2>
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse hidden sm:inline-block" />
          </div>
          {(activeSubtitleAr || activeSubtitleEn) && (
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-light">
              {isAr ? activeSubtitleAr : activeSubtitleEn}
            </p>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label={isAr ? 'السابق' : 'Previous'}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#d6cfc0] dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-[#102a1c] hover:text-white dark:hover:bg-[#d4af37] dark:hover:text-black flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
            >
              {isAr ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label={isAr ? 'التالي' : 'Next'}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#d6cfc0] dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-[#102a1c] hover:text-white dark:hover:bg-[#d4af37] dark:hover:text-black flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
            >
              {isAr ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Genuine Empty State (Zero Fake Data) */}
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d6cfc0] dark:border-stone-800 bg-[#faf8f5]/60 dark:bg-stone-900/40 p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            {isAr
              ? 'لا توجد منتجات مسجلة حالياً في هذا القسم'
              : 'No records found for this section'}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
            {isAr
              ? 'أضف منتجات من لوحة التحكم أو اختر قسماً آخر من أداة تعديل القوالب'
              : 'Add products from your dashboard or select another category from the page builder'}
          </p>
        </div>
      ) : (
        /* Horizontal Carousel (Pixel-Perfect with Reference Image) */
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
        >
          {items.map((item) => {
            const name = isAr ? ((item as any).nameAr || item.name) : ((item as any).nameEn || item.name);
            return (
              <div
                key={item.id}
                onClick={() => navigateToProduct(item as any)}
                className="group min-w-[220px] sm:min-w-[245px] max-w-[265px] bg-white dark:bg-stone-900 rounded-3xl p-3.5 sm:p-4 border border-[#eee8df] dark:border-stone-800 hover:border-[#102a1c]/30 dark:hover:border-[#d4af37]/40 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer shrink-0"
              >
                {/* Full Image Container (Matches user's reference portrait photo) */}
                <div
                  className={`relative rounded-2xl overflow-hidden bg-[#faf8f5] dark:bg-stone-800 mb-3 ${
                    aspectMode === 'square'
                      ? 'aspect-square'
                      : aspectMode === 'tall'
                      ? 'aspect-[3/4]'
                      : aspectMode === 'auto'
                      ? 'min-h-[220px]'
                      : 'aspect-[4/5]' // Default Full Image display
                  }`}
                >
                  <img
                    src={item.image}
                    alt={name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy" decoding="async"
                  />
                  {item.badge && (
                    <span className="absolute top-2.5 start-2.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Content & Price Row */}
                <div className="space-y-2 mt-auto">
                  {displayTitle && (
                    <h3 className="text-xs sm:text-sm font-semibold text-[#1b251e] dark:text-stone-100 line-clamp-1 group-hover:text-[#0d2f24] dark:group-hover:text-[#d4af37] transition-colors">
                      {name}
                    </h3>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {displayPrice ? (
                      <span className="text-sm sm:text-base font-bold text-[#102a1c] dark:text-[#f3e5c8] font-sans tracking-tight">
                        {isAr ? `${item.price} ر.س` : `SAR ${item.price}`}
                      </span>
                    ) : (
                      <div />
                    )}

                    {displayCart && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item as any, 1);
                        }}
                        aria-label={isAr ? 'أضف إلى السلة' : 'Add to cart'}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#d6cfc0] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#102a1c] dark:text-stone-200 hover:bg-[#102a1c] hover:text-white dark:hover:bg-[#d4af37] dark:hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    )}
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

