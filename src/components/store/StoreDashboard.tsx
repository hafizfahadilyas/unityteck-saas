import React, { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { DashboardOrdersTable } from './DashboardOrdersTable';
import { CreateStoreOrderModal } from './CreateStoreOrderModal';
import { AdminPageShell } from '../common/AdminPageHeader';
import { useToast } from '../common/ToastProvider';
import { StoreOverviewHeader } from './dashboard/StoreOverviewHeader';
import { SalesVsProfitChart, DailySalesProfitPoint } from './dashboard/SalesVsProfitChart';
import { MonthlySummaryCard } from './dashboard/MonthlySummaryCard';
import { VisitorsByAgeChart } from './dashboard/VisitorsByAgeChart';
import { VisitsByDayChart } from './dashboard/VisitsByDayChart';
import { TopProductsCard } from './dashboard/TopProductsCard';
import { TrafficSourcesCard } from './dashboard/TrafficSourcesCard';
import { RecentActivityCard } from './dashboard/RecentActivityCard';
import {
  filterOrdersByRange,
  getOrderDate,
  orderStatusGrowth,
  type DateRangeKey,
} from '../../utils/liveSeries';

interface StoreDashboardProps {
  onNavigateTab: (tab: string) => void;
  onCustomizeTheme?: () => void;
  onOpenThemeCustomizer?: (sectionId?: string) => void;
}

export const StoreDashboard: React.FC<StoreDashboardProps> = ({
  onNavigateTab,
  onCustomizeTheme,
  onOpenThemeCustomizer,
}) => {
  const {
    activeStore,
    currentCustomers,
    currentProducts,
    currentOrders,
    currentCoupons,
    currentPaymentGateways,
    currentShipping,
    currentShippingMethods,
    dataSource,
    addOrder,
  } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState<DateRangeKey>('month');
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);

  // Month and Year string for Monthly Summary Card
  const currentMonthYear = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [isAr]);

  // Dynamic analytics orders filtered by dateRange
  const analyticsOrders = useMemo(() => {
    return filterOrdersByRange(currentOrders, dateRange);
  }, [currentOrders, dateRange]);

  const liveRevenue = useMemo(() => {
    return analyticsOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  }, [analyticsOrders]);

  // Real storefront visits only — never invent orders×N (zero-mock).
  const visitorsCount = useMemo(() => {
    return Math.max(0, Number(activeStore.visitorsCount) || 0);
  }, [activeStore.visitorsCount]);

  // Profit stays 0 until real cost data exists — never invent a margin %.
  const estimatedProfit = useMemo(() => {
    const withCost = analyticsOrders.filter((o) => typeof (o as { cost?: number }).cost === 'number');
    if (!withCost.length) return 0;
    return Math.round(
      withCost.reduce((s, o) => s + ((Number(o.total) || 0) - (Number((o as { cost?: number }).cost) || 0)), 0),
    );
  }, [analyticsOrders]);

  // Daily points for Sales vs Estimated Profit chart calculated from real orders
  const salesProfitPoints = useMemo<DailySalesProfitPoint[]>(() => {
    if (analyticsOrders.length > 0) {
      const map = new Map<string, { sales: number; profit: number; hasCost: boolean }>();
      analyticsOrders.forEach((o) => {
        const d = o.date ? o.date.slice(0, 10) : 'Recent';
        const prev = map.get(d) || { sales: 0, profit: 0, hasCost: false };
        const total = Number(o.total) || 0;
        const cost = (o as { cost?: number }).cost;
        prev.sales += total;
        if (typeof cost === 'number') {
          prev.profit += total - cost;
          prev.hasCost = true;
        }
        map.set(d, prev);
      });
      const pts = Array.from(map.entries()).map(([date, row]) => ({
        date: date.length > 5 ? date.slice(5) : date,
        sales: row.sales,
        profit: row.hasCost ? Math.round(row.profit) : 0,
        isLabelPoint: true,
      }));
      return pts.slice(0, 14);
    }
    return [];
  }, [analyticsOrders]);

  const currentMonthDateRangeStr = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endDay = end.getDate();
    const monthName = now.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'long' });
    const year = now.getFullYear();

    if (isAr) {
      return `1 ${monthName} ${year} – ${endDay} ${monthName} ${year}`;
    }
    return `${monthName} 1, ${year} – ${monthName} ${endDay}, ${year}`;
  }, [isAr]);

  const selectedRangeLabel = useMemo(() => {
    if (dateRange === 'today') return isAr ? 'اليوم' : 'Today';
    if (dateRange === 'yesterday') return isAr ? 'أمس' : 'Yesterday';
    if (dateRange === 'week') return isAr ? 'آخر 7 أيام' : 'Last 7 Days';
    if (dateRange === 'all') return isAr ? 'كل الأوقات (مخصص)' : 'All Time (Custom)';
    return currentMonthDateRangeStr;
  }, [dateRange, isAr, currentMonthDateRangeStr]);

  // Visits-by-day needs real storefront day buckets — do not fake from order counts.
  const visitsByDayPoints = useMemo(() => {
    return [] as Array<{ dayEn: string; dayAr: string; percentage: number; highlighted: boolean }>;
  }, []);

  // Traffic channels need real visit counts — never invent visits from order×N.
  // When storefront visits exist, order `source` mix is used only as channel share.
  const trafficChannels = useMemo(() => {
    const realVisits = Math.max(0, Number(activeStore.visitorsCount) || 0);
    if (realVisits <= 0 || !currentOrders || currentOrders.length === 0) return [];
    const sourceCounts: Record<string, number> = {};
    currentOrders.forEach((o) => {
      const src = o.source || 'Direct';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    const total = currentOrders.length;
    const channelConfigs: Record<string, { nameEn: string; nameAr: string; color: string; iconType: any }> = {
      TikTok: { nameEn: 'TikTok', nameAr: 'تيك توك', color: '#0f172a', iconType: 'tiktok' },
      Snapchat: { nameEn: 'Snapchat', nameAr: 'سناب شات', color: '#f59e0b', iconType: 'snapchat' },
      WhatsApp: { nameEn: 'WhatsApp', nameAr: 'واتساب', color: '#10b981', iconType: 'whatsapp' },
      Instagram: { nameEn: 'Instagram', nameAr: 'انستغرام', color: '#e1306c', iconType: 'instagram' },
      Facebook: { nameEn: 'Facebook', nameAr: 'فيسبوك', color: '#1877f2', iconType: 'facebook' },
      Direct: { nameEn: 'Direct Visits', nameAr: 'زيارات مباشرة', color: '#0d9488', iconType: 'direct' },
      'Direct Visits': { nameEn: 'Direct Visits', nameAr: 'زيارات مباشرة', color: '#0d9488', iconType: 'direct' },
      Google: { nameEn: 'Google Ads', nameAr: 'إعلانات جوجل', color: '#0284c7', iconType: 'google' },
      'Google Ads': { nameEn: 'Google Ads', nameAr: 'إعلانات جوجل', color: '#0284c7', iconType: 'google' },
      'Organic Search': { nameEn: 'Organic Search', nameAr: 'بحث مجاني', color: '#059669', iconType: 'google' },
    };

    return Object.entries(sourceCounts).map(([src, count]) => {
      const cfg = channelConfigs[src] || {
        nameEn: src,
        nameAr: src,
        color: '#64748b',
        iconType: 'other',
      };
      return {
        id: src.toLowerCase().replace(/\s+/g, '-'),
        name: cfg.nameEn,
        nameAr: cfg.nameAr,
        percentage: Math.round((count / total) * 100),
        color: cfg.color,
        iconType: cfg.iconType,
      };
    });
  }, [currentOrders, activeStore.visitorsCount]);

  // Live product sales qty from real order line items (no hardcoded mock ranks)
  const salesByProductId = useMemo(() => {
    const map: Record<string, number> = {};
    (currentOrders || []).forEach((o) => {
      (o.items || []).forEach((it) => {
        const id = it.id;
        if (!id) return;
        map[id] = (map[id] || 0) + (Number(it.quantity) || 0);
      });
    });
    return map;
  }, [currentOrders]);

  // Real period growth comparisons (Zero fake dummy percentages)
  const { salesGrowth, ordersGrowth } = useMemo(() => {
    if (!currentOrders || currentOrders.length === 0) {
      return { salesGrowth: 0, ordersGrowth: 0 };
    }

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

    let currentSales = 0;
    let prevSales = 0;

    currentOrders.forEach((o) => {
      const d = getOrderDate(o);
      if (!d) return;
      const age = now - d.getTime();
      if (Number.isNaN(age) || age < 0) return;
      const val = Number(o.total) || 0;

      if (age < thirtyDaysMs) currentSales += val;
      else if (age < sixtyDaysMs) prevSales += val;
    });

    const sGrowth =
      prevSales > 0
        ? Math.round(((currentSales - prevSales) / prevSales) * 100)
        : currentSales > 0
          ? 100
          : 0;
    const oGrowth = orderStatusGrowth(currentOrders).pct;

    return { salesGrowth: sGrowth, ordersGrowth: oGrowth };
  }, [currentOrders]);

  const missingSettingsCount = useMemo(() => {
    let missing = 0;
    if (currentProducts.length === 0) missing++;
    if (!currentPaymentGateways || currentPaymentGateways.length === 0 || !currentPaymentGateways.some((g) => g.isEnabled)) missing++;
    if ((!currentShipping || currentShipping.length === 0) && (!currentShippingMethods || currentShippingMethods.length === 0)) missing++;
    if (!activeStore.domain && !activeStore.hosting_id) missing++;
    return missing;
  }, [currentProducts.length, currentPaymentGateways, currentShipping, currentShippingMethods, activeStore.domain, activeStore.hosting_id]);

  return (
    <AdminPageShell className="pb-12 space-y-4">
      {/* ── Top Overview Header & Action Required Alert (100% same-to-same) ── */}
      <StoreOverviewHeader
        storeName={(isAr ? activeStore.nameAr : activeStore.nameEn) || activeStore.name}
        selectedRangeLabel={selectedRangeLabel}
        activeRangeKey={dateRange}
        onSelectRange={(k) => setDateRange(k as DateRangeKey)}
        missingSettingsCount={missingSettingsCount}
        onNavigateTab={onNavigateTab}
      />

      {/* ── Main 3-Column Grid Layout (Cols 1-2 on Left, Col 3 on Right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch min-w-0">
        {/* ════ LEFT MAIN SECTION (8 COLS on xl, 8.5 on 2xl) ════ */}
        <div className="xl:col-span-8 2xl:col-span-8.5 space-y-4 min-w-0 h-full">
          {/* Row 1: Sales vs Estimated Profit + Monthly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch min-w-0">
            <SalesVsProfitChart
              data={salesProfitPoints}
              liveOrdersTotal={liveRevenue}
            />
            <MonthlySummaryCard
              monthName={currentMonthYear}
              salesValue={liveRevenue}
              visitsValue={visitorsCount}
              profitValue={estimatedProfit}
              ordersValue={currentOrders.length}
              salesGrowth={salesGrowth}
              visitsGrowth={0}
              profitGrowth={salesGrowth}
              ordersGrowth={ordersGrowth}
              onViewReports={() => onNavigateTab('reports')}
            />
          </div>

          {/* Row 2: Visitors by Age + Visits by Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch min-w-0">
            <VisitorsByAgeChart data={[]} />
            <VisitsByDayChart data={visitsByDayPoints} />
          </div>

        </div>

        {/* ════ RIGHT RAIL — Recent Activity stretches to left column / Visits by Day bottom ════ */}
        <div className="xl:col-span-4 2xl:col-span-3.5 min-w-0 h-full flex flex-col">
          <RecentActivityCard
            orders={currentOrders}
            customers={currentCustomers}
            products={currentProducts}
            onViewAll={() => onNavigateTab('orders')}
            onNavigateOrder={() => onNavigateTab('orders')}
          />
        </div>
      </div>

      {/* Row: Top Products + Traffic — equal height, live data, scroll */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch min-w-0">
        <div className="min-w-0 h-full">
          <TopProductsCard
            products={currentProducts}
            salesByProductId={salesByProductId}
            onViewAll={() => onNavigateTab('products')}
            onSelectProduct={() => onNavigateTab('products')}
          />
        </div>
        <div className="min-w-0 h-full">
          <TrafficSourcesCard
            totalVisits={visitorsCount}
            growthPercentage={0}
            channels={trafficChannels}
            onViewAll={() => onNavigateTab('analytics')}
          />
        </div>
      </div>

      {/* ── Embedded Orders Table Operations (Full Width Span) ── */}
      <div className="pt-2">
        <DashboardOrdersTable
          orders={analyticsOrders.length > 0 ? analyticsOrders : currentOrders}
          onNavigateTab={onNavigateTab}
          onOpenCreateOrder={() => setIsCreateOrderModalOpen(true)}
        />
      </div>

      {/* ── Create Order Modal ── */}
      {isCreateOrderModalOpen && (
        <CreateStoreOrderModal
          isOpen={isCreateOrderModalOpen}
          storeId={activeStore.id}
          storeName={activeStore.name}
          onClose={() => setIsCreateOrderModalOpen(false)}
          onCreate={async (orderData) => {
            try {
              await addOrder(orderData as any, activeStore.id);
              toast(
                isAr
                  ? 'تم إنشاء الطلب الجديد وإضافته بنجاح إلى قاعدة البيانات!'
                  : 'New order created and saved to database successfully!',
                'success',
              );
              setIsCreateOrderModalOpen(false);
            } catch (err) {
              toast(
                isAr ? 'حدث خطأ أثناء حفظ الطلب' : 'Failed to save new order',
                'error',
              );
            }
          }}
        />
      )}
    </AdminPageShell>
  );
};
