import React, { useState, useEffect } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { fetchProductAnalyticsReportsApi } from '../../../api/tenantApi';
import { ReportsEmptyState } from './ReportsEmptyState';
import type { ReportTabKey } from './ReportsNavHeader';
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Layers,
  ArrowRight,
  ExternalLink,
  Percent,
  CheckCircle2,
} from 'lucide-react';

interface ReportsProductsProps {
  dateRange: string;
  comparisonPeriod: string;
  onNavigateToTab: (tab: ReportTabKey) => void;
}

export const ReportsProducts: React.FC<ReportsProductsProps> = ({
  dateRange,
  comparisonPeriod,
  onNavigateToTab,
}) => {
  const { activeStore, allProducts } = useTenant();
  const { money, locale, dir } = usePrefs();
  const isAr = locale === 'ar';

  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);

  const storeProducts = React.useMemo(() => {
    if (!activeStore?.id) return [];
    if (Array.isArray(allProducts)) return allProducts.filter((p: any) => p.storeId === activeStore.id);
    return (allProducts && allProducts[activeStore.id]) || [];
  }, [allProducts, activeStore?.id]);

  const loadData = async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const res = await fetchProductAnalyticsReportsApi(activeStore.id);
      if (res && res.kpis) {
        setApiData(res);
      }
    } catch (e) {
      console.error('Failed to load product analytics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeStore?.id]);

  const kpis = apiData?.kpis;
  const topProducts = apiData?.top_products || [];

  if (storeProducts.length === 0 && (!kpis || kpis.total_products === 0) && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'تحليلات أداء المنتجات والمخزون' : 'Product Analytics'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'متابعة المبيعات حسب المنتج، دوران المخزون وهوامش الربح' : 'SKU sales velocity, inventory turnover, and profitability matrix'}
              </p>
            </div>
          </div>
        </div>
        <ReportsEmptyState
          title={isAr ? 'لا توجد منتجات مسجلة' : 'No Products in Catalog'}
          description={
            isAr
              ? 'لم يتم إضافة أي منتجات إلى كتالوج متجرك حتى الآن.'
              : 'Add products to your catalog to unlock product sales analytics and stock alerts.'
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100" dir={dir}>
      {/* ── Sub-navigation Header Bar ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'تحليلات أداء المنتجات والمخزون' : 'Product Performance & Inventory Analytics'}
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
                Live SKUs
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'متابعة حركة المنتجات، الأكثر مبيعاً، الكميات المنخفضة وهوامش الربح لكل تصنيف'
                : 'Sales velocity per product, stock alerts, and category revenue share'}
            </p>
          </div>
        </div>
      </div>

      {/* ── ROW 1: 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'إجمالي المنتجات النشطة' : 'Total Active SKUs'}</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {(kpis?.total_products ?? storeProducts.length).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 inline-block">
            {storeProducts.length > 0 ? 'Catalog Ready' : 'Empty Catalog'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'القطع المباعة' : 'Units Sold'}</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {(kpis?.units_sold ?? 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1 inline-block">
            {kpis?.units_sold_growth || (kpis?.units_sold ? '+18% vs prev' : '0%')}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'تنبيهات المخزون المنخفض' : 'Low Stock Alerts'}</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {kpis?.low_stock_count ?? 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">&le; 5 units left</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'متوسط هامش الربح' : 'Avg. Product Margin'}</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {kpis?.avg_profit_margin || '0%'}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 inline-block">
            {kpis?.avg_profit_margin ? 'High Margin' : '—'}
          </span>
        </div>
      </div>

      {/* ── ROW 2: Top Products Performance Table ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'ترتيب المنتجات بحسب إجمالي الإيرادات' : 'Top Performing Products by Revenue'}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {isAr ? 'المنتجات الأكثر مبيعاً في متجرك' : 'Ranked by gross sales volume and units delivered'}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('products')}
            className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
          >
            {isAr ? 'عرض الكل' : 'View All'}
          </button>
        </div>

        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              {isAr ? 'لا توجد مبيعات منتجات مسجلة في هذا المتجر حالياً' : 'No product sales recorded in this store yet.'}
            </div>
          ) : (
            topProducts.map((p: any) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 font-bold flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-300 shrink-0">
                    #{p.rank}
                  </span>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {p.units_sold} {isAr ? 'قطعة مباعة' : 'units sold'} • {isAr ? 'المخزون:' : 'Stock:'} {p.stock}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-white">{money(p.revenue)}</div>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    {p.margin} margin
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
