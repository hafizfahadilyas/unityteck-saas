import React from 'react';
import { Crown, ChevronRight, Package } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { Product } from '../../../types';
import { getProductDisplayName } from '../../../utils/storeLocalization';

interface TopProductsCardProps {
  products?: Product[];
  /** Optional live qty sold map from orders — preferred over product.salesCount */
  salesByProductId?: Record<string, number>;
  onViewAll: () => void;
  onSelectProduct?: (productId: string) => void;
}

export const TopProductsCard: React.FC<TopProductsCardProps> = React.memo(({
  products = [],
  salesByProductId,
  onViewAll,
  onSelectProduct,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const displayItems = React.useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];

    const ranked = products
      .map((p) => {
        const fromOrders = salesByProductId?.[p.id];
        const sales =
          typeof fromOrders === 'number'
            ? fromOrders
            : Number(p.salesCount) || 0;
        return { product: p, sales };
      })
      .sort((a, b) => b.sales - a.sales);

    const totalSales = ranked.reduce((acc, r) => acc + r.sales, 0);

    return ranked.map(({ product: p, sales }) => {
      const pct =
        totalSales > 0
          ? Math.round((sales / totalSales) * 100)
          : 0;
      return {
        id: p.id,
        name: getProductDisplayName(p, locale) || p.name,
        percentage: pct,
        sales,
        image: p.image || '',
      };
    });
  }, [products, salesByProductId, locale]);

  return (
    <div
      className="u-card p-3.5 sm:p-4 rounded-2xl shadow-xs flex flex-col h-full min-h-[280px] max-h-[320px]"
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between pb-2.5 mb-2 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="u-icon-brand w-7 h-7 rounded-xl flex items-center justify-center shrink-0">
            <Crown className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black leading-tight truncate" style={{ color: 'var(--text)' }}>
              {isAr ? 'أفضل المنتجات' : 'Top Products'}
            </h3>
            <p className="text-[10px] font-bold truncate" style={{ color: 'var(--muted)' }}>
              {isAr ? 'الأكثر مبيعاً من الطلبات الحية' : 'Top sellers from live orders'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="u-accent-text text-[11px] font-bold flex items-center gap-0.5 hover:underline cursor-pointer shrink-0"
        >
          <span>{isAr ? 'عرض الكل' : 'View All'}</span>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>

      {/* ── Scrollable products list (height matched to Traffic / Notifications) ── */}
      {displayItems.length === 0 ? (
        <div className="flex-1 py-6 px-3 text-center flex flex-col items-center justify-center">
          <div className="u-icon-brand w-9 h-9 rounded-2xl flex items-center justify-center mb-2">
            <Package className="w-4 h-4 opacity-60" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'لا توجد منتجات' : 'No products found'}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[180px]">
            {isAr ? 'أضف منتجات أو انتظر طلبات حقيقية' : 'Add products or wait for real orders'}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pe-0.5 space-y-1.5 [scrollbar-width:thin]">
          {displayItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onSelectProduct?.(item.id)}
              className="flex items-center gap-2 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1 rounded-xl transition-colors"
            >
              <span className="u-icon-brand w-4.5 h-4.5 rounded-md font-bold text-[10px] flex items-center justify-center shrink-0">
                {index + 1}
              </span>

              <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span
                  className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate block"
                  title={item.name}
                >
                  {item.name}
                </span>
              </div>

              <div className="w-14 sm:w-16 shrink-0 bg-slate-200 dark:bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(item.percentage > 0 ? 8 : 0, item.percentage * 2.8))}%`,
                    background: 'var(--accent)',
                  }}
                />
              </div>

              <span className="text-[11px] font-black text-slate-950 dark:text-slate-100 tabular-nums shrink-0 w-7 text-end">
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
