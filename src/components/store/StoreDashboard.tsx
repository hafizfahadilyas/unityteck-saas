import React, { useEffect, useMemo, useState } from 'react';
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
import { isApiEnabled } from '../../api/client';
import {
  fetchDashboardHomeAnalytics,
  fetchStoreRecentActivitiesApi,
  type CustomerActivityRow,
  type DashboardHomeAnalytics,
} from '../../api/tenantApi';
import type { DayVisitPoint } from './dashboard/VisitsByDayChart';

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
    dataSource,
    addOrder,
  } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState<DateRangeKey>('month');
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [homeAnalytics, setHomeAnalytics] = useState<DashboardHomeAnalytics | null>(null);
  const [storefrontActivities, setStorefrontActivities] = useState<CustomerActivityRow[]>([]);

  useEffect(() => {
    const storeId = activeStore?.id;
    if (!storeId || !isApiEnabled()) {
      setHomeAnalytics(null);
      setStorefrontActivities([]);
      return;
    }
    let cancelled = false;
    void fetchDashboardHomeAnalytics(storeId)
      .then((data) => {
        if (!cancelled) setHomeAnalytics(data);
      })
      .catch(() => {
        if (!cancelled) setHomeAnalytics(null);
      });
    void fetchStoreRecentActivitiesApi(storeId, 40)
      .then((rows) => {
        if (!cancelled) setStorefrontActivities(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setStorefrontActivities([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeStore?.id]);

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

  // Real storefront event sessions only — never invent orders×N or trust seeded/local visitorsCount.
  const visitorsCount = useMemo(() => {
    const fromApi = homeAnalytics?.visitors_count;
    if (typeof fromApi === 'number' && Number.isFinite(fromApi)) {
      return Math.max(0, fromApi);
    }
    // Waiting for API / disconnected → genuine zero (zero-mock)
    return 0;
  }, [homeAnalytics?.visitors_count]);

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

  const visitsByDayPoints = useMemo<DayVisitPoint[]>(() => {
    return homeAnalytics?.visits_by_weekday?.length ? homeAnalytics.visits_by_weekday : [];
  }, [homeAnalytics?.visits_by_weekday]);

  const visitsGrowth = useMemo(() => {
    if (!homeAnalytics || homeAnalytics.visits_growth === undefined) return null;
    return homeAnalytics.visits_growth;
  }, [homeAnalytics]);

  // Traffic channels: real page_view sessions only — never invent from order source mix / min-1%
  const trafficChannels = useMemo<import('./dashboard/TrafficSourcesCard').TrafficChannel[]>(() => {
    const rows = homeAnalytics?.traffic_sources;
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const allowed = new Set([
      'tiktok', 'snapchat', 'whatsapp', 'instagram', 'facebook', 'google',
      'bing', 'youtube', 'x', 'email', 'other', 'direct',
    ]);
    const mapped = rows
      .filter((r) => (Number(r.visits) || 0) > 0)
      .map((r) => {
        const icon = String(r.icon_type || 'other').toLowerCase();
        return {
          id: r.id || `src_${r.name}`,
          name: r.name || 'Direct',
          nameAr: r.name_ar || r.name || 'مباشر',
          visits: Math.max(0, Number(r.visits) || 0),
          percentage: Math.max(0, Number(r.percentage) || 0),
          color: r.color || '#64748b',
          iconType: (allowed.has(icon) ? icon : 'other') as import('./dashboard/TrafficSourcesCard').TrafficChannel['iconType'],
        };
      });
    if (mapped.length === 0) return [];

    // Guard against stale API (max(1%) / naive round) so UI never shows 100%+1%
    const visitSum = mapped.reduce((s, r) => s + r.visits, 0);
    const pctSum = mapped.reduce((s, r) => s + r.percentage, 0);
    if (visitSum > 0 && (pctSum !== 100 || mapped.some((r) => r.percentage <= 0 && r.visits > 0))) {
      const floors = mapped.map((r) => {
        const exact = (r.visits / visitSum) * 100;
        return { floor: Math.floor(exact), frac: exact - Math.floor(exact) };
      });
      let remaining = 100 - floors.reduce((s, f) => s + f.floor, 0);
      const order = floors
        .map((f, i) => ({ i, frac: f.frac }))
        .sort((a, b) => b.frac - a.frac);
      for (const { i } of order) {
        if (remaining <= 0) break;
        floors[i].floor += 1;
        remaining -= 1;
      }
      floors.forEach((f, i) => {
        mapped[i].percentage = f.floor;
      });
    }

    return mapped
      .filter((r) => r.percentage > 0)
      .map(({ visits: _visits, ...ch }) => ch);
  }, [homeAnalytics?.traffic_sources]);

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
          ? null
          : 0;
    const oGrowth = orderStatusGrowth(currentOrders);
    const ordersGrowthVal =
      oGrowth.previous > 0 ? oGrowth.pct : oGrowth.current > 0 ? null : 0;

    return { salesGrowth: sGrowth, ordersGrowth: ordersGrowthVal };
  }, [currentOrders]);

  return (
    <AdminPageShell className="pb-12 space-y-4">
      {/* ── Top Overview Header ── */}
      <StoreOverviewHeader
        storeName={(isAr ? activeStore.nameAr : activeStore.nameEn) || activeStore.name}
        selectedRangeLabel={selectedRangeLabel}
        activeRangeKey={dateRange}
        onSelectRange={(k) => setDateRange(k as DateRangeKey)}
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
              ordersValue={analyticsOrders.length}
              salesGrowth={salesGrowth}
              visitsGrowth={visitsGrowth}
              profitGrowth={estimatedProfit > 0 ? salesGrowth : null}
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
            storefrontActivities={storefrontActivities}
            onViewAll={() => onNavigateTab('abandoned-carts')}
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
            growthPercentage={typeof visitsGrowth === 'number' ? visitsGrowth : 0}
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
          products={currentProducts}
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
