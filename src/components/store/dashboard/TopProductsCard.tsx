import React from 'react';
import { Crown, ChevronRight, Package } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { Product } from '../../../types';
import { getProductDisplayName } from '../../../utils/storeLocalization';

interface TopProductsCardProps {
  products?: Product[];
  onViewAll: () => void;
  onSelectProduct?: (productId: string) => void;
}

export const TopProductsCard: React.FC<TopProductsCardProps> = React.memo(({
  products = [],
  onViewAll,
  onSelectProduct,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  // Dynamically calculate authentic percentage from product metrics or sales (zero mock/dummy fallback)
  const totalSalesCount = React.useMemo(() => {
    return products.reduce((acc, p) => acc + (p.salesCount || 0), 0);
  }, [products]);

  const displayItems = React.useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    return products.slice(0, 5).map((p) => {
      const sales = p.salesCount || 0;
      const pct =
        (p as any).viewPercentage ||
        (totalSalesCount > 0 ? Math.round((sales / totalSalesCount) * 100) : 0);

      return {
        id: p.id,
        name: getProductDisplayName(p, locale) || p.name,
        percentage: pct,
        image: p.image || '',
      };
    });
  }, [products, totalSalesCount, locale]);

  return (
    <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200/60 dark:border-teal-800/40">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {isAr ? 'أفضل المنتجات' : 'Top Products'}
            </h3>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'المنتجات الأكثر مشاهدة' : 'Most viewed products'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <span>{isAr ? 'عرض الكل' : 'View All'}</span>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>

      {/* ── Products List or Clean Empty State ── */}
      {displayItems.length === 0 ? (
        <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200/60 dark:border-teal-800/40 mb-2.5">
            <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد منتجات' : 'No products found'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
            {isAr ? 'أضف منتجات إلى متجرك للبدء في تتبع المشاهدات' : 'Add products to your store to track views'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {displayItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onSelectProduct?.(item.id)}
              className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1.5 rounded-xl transition-colors"
            >
              {/* Rank Badge */}
              <span className="w-5 h-5 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200/60 dark:border-teal-800/40">
                {index + 1}
              </span>

              {/* Product Thumbnail */}
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Package className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div className="flex-1 min-w-0 pr-1">
                <span
                  className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block"
                  title={item.name}
                >
                  {item.name}
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-20 sm:w-28 md:w-24 lg:w-32 shrink-0 bg-slate-200 dark:bg-slate-700/80 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500 dark:bg-teal-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(8, item.percentage * 2.8))}%` }}
                />
              </div>

              {/* Percentage */}
              <span className="text-xs font-black text-slate-950 dark:text-slate-100 tabular-nums shrink-0 w-8 text-end">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

TopProductsCard.displayName = 'TopProductsCard';
