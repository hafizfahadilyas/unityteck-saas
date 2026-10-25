import React, { useMemo, useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { DashboardOrdersTable } from './DashboardOrdersTable';
import { AdminPageShell } from '../common/AdminPageHeader';
import { useToast } from '../common/ToastProvider';

const CreateStoreOrderModal = React.lazy(() =>
  import('./CreateStoreOrderModal').then((m) => ({ default: m.CreateStoreOrderModal })),
);
import { StoreOverviewHeader } from './dashboard/StoreOverviewHeader';
import { SalesVsProfitChart, DailySalesProfitPoint } from './dashboard/SalesVsProfitChart';
import { MonthlySummaryCard } from './dashboard/MonthlySummaryCard';
import { VisitorsByAgeChart } from './dashboard/VisitorsByAgeChart';
import { VisitsByDayChart } from './dashboard/VisitsByDayChart';
import { TopProductsCard } from './dashboard/TopProductsCard';
import { TrafficSourcesCard } from './dashboard/TrafficSourcesCard';
import { RecentActivityCard } from './dashboard/RecentActivityCard';
import { NotificationsCard } from './dashboard/NotificationsCard';
import { filterOrdersByRange, type DateRangeKey } from '../../utils/liveSeries';
import {
  getStoreLoyaltyGameSettings,
  saveStoreLoyaltyGameSettings,
  type StoreLoyaltyGameSettings,
} from '../../services/ksaAutomationEngine';

interface StoreDashboardProps {
  onNavigateTab: (tab: string) => void;
  onCustomizeTheme?: () => void;
  onOpenThemeCustomizer?: (sectionId?: string) => void;
}

export const StoreDashboard: React.FC<StoreDashboardProps> = React.memo(({
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
    const sum = analyticsOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    if (sum > 0) return sum;
    return Number(activeStore.revenue) || 0;
  }, [analyticsOrders, activeStore.revenue]);

  const visitorsCount = useMemo(() => {
    return Number(activeStore.visitorsCount) || 0;
  }, [activeStore.visitorsCount]);

  // No invented margin — profit only when real COGS exists (else 0 / empty chart)
  const estimatedProfit = useMemo(() => 0, []);

  // Daily points for Sales vs Estimated Profit chart calculated from real orders
  const salesProfitPoints = useMemo<DailySalesProfitPoint[]>(() => {
    if (analyticsOrders.length > 0) {
      const map = new Map<string, number>();
      analyticsOrders.forEach((o) => {
        const d = o.date ? o.date.slice(0, 10) : 'Recent';
        map.set(d, (map.get(d) || 0) + (Number(o.total) || 0));
      });
      const pts = Array.from(map.entries()).map(([date, total]) => ({
        date: date.length > 5 ? date.slice(5) : date,
        sales: total,
        profit: 0,
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

  // Real day-of-week distribution computed from store orders
  const visitsByDayPoints = useMemo(() => {
    if (!currentOrders || currentOrders.length === 0) return [];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun(0) to Sat(6)
    currentOrders.forEach((o) => {
      const dateStr = o.createdAt || o.date;
      if (dateStr) {
        try {
          const d = new Date(dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr);
          if (!isNaN(d.getTime())) {
            dayCounts[d.getDay()]++;
          }
        } catch {}
      }
    });
    const total = dayCounts.reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    const daysConfig = [
      { dayEn: 'Saturday', dayAr: 'السبت', index: 6 },
      { dayEn: 'Sunday', dayAr: 'الأحد', index: 0 },
      { dayEn: 'Monday', dayAr: 'الاثنين', index: 1 },
      { dayEn: 'Tuesday', dayAr: 'الثلاثاء', index: 2 },
      { dayEn: 'Wednesday', dayAr: 'الأربعاء', index: 3 },
      { dayEn: 'Thursday', dayAr: 'الخميس', index: 4 },
      { dayEn: 'Friday', dayAr: 'الجمعة', index: 5 },
    ];

    let maxDayIdx = 6;
    let maxVal = -1;
    daysConfig.forEach((cfg) => {
      if (dayCounts[cfg.index] > maxVal) {
        maxVal = dayCounts[cfg.index];
        maxDayIdx = cfg.index;
      }
    });

    return daysConfig.map((cfg) => ({
      dayEn: cfg.dayEn,
      dayAr: cfg.dayAr,
      percentage: Math.round((dayCounts[cfg.index] / total) * 100),
      highlighted: cfg.index === maxDayIdx && maxVal > 0,
    }));
  }, [currentOrders]);

  // Real traffic channels computed from store orders acquisition source
  // Rule: Hide any traffic source when it has no visits. Move any source to the top of the list whenever it receives a new order or request.
  const trafficChannels = useMemo(() => {
    // Strict Real Data Rule: If store has 0 total visits, every traffic source has 0 visits -> all must be hidden.
    if (visitorsCount === 0 || !currentOrders || currentOrders.length === 0) {
      return [];
    }

    // Determine the most recent order's source to place at the top of the list
    const sortedOrders = [...currentOrders].sort((a, b) => {
      const da = new Date(a.date || a.createdAt || 0).getTime();
      const db = new Date(b.date || b.createdAt || 0).getTime();
      return db - da;
    });
    const latestOrderSource = sortedOrders[0]?.source || 'Direct';

    const sourceCounts: Record<string, number> = {};
    currentOrders.forEach((o) => {
      const src = o.source || 'Direct';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    const total = currentOrders.length;
    const channelConfigs: Record<string, { nameEn: string; nameAr: string; color: string; iconType: any }> = {
      Instagram: { nameEn: 'Instagram', nameAr: 'انستغرام', color: '#e1306c', iconType: 'instagram' },
      TikTok: { nameEn: 'TikTok', nameAr: 'تيك توك', color: '#0f172a', iconType: 'tiktok' },
      Snapchat: { nameEn: 'Snapchat', nameAr: 'سناب شات', color: '#f59e0b', iconType: 'snapchat' },
      WhatsApp: { nameEn: 'WhatsApp', nameAr: 'واتساب', color: '#10b981', iconType: 'whatsapp' },
      Facebook: { nameEn: 'Facebook', nameAr: 'فيسبوك', color: '#1877f2', iconType: 'facebook' },
      Google: { nameEn: 'Google Ads', nameAr: 'إعلانات جوجل', color: '#0284c7', iconType: 'google' },
      'Google Ads': { nameEn: 'Google Ads', nameAr: 'إعلانات جوجل', color: '#0284c7', iconType: 'google' },
      'Google Organic Search': { nameEn: 'Google Organic Search', nameAr: 'بحث جوجل المجاني', color: '#059669', iconType: 'google' },
      'Bing Organic Search': { nameEn: 'Bing Organic Search', nameAr: 'بحث بينج المجاني', color: '#008373', iconType: 'bing' },
      'Email Marketing': { nameEn: 'Email Marketing', nameAr: 'التسويق عبر البريد', color: '#ea580c', iconType: 'email' },
      YouTube: { nameEn: 'YouTube', nameAr: 'يوتيوب', color: '#ef4444', iconType: 'youtube' },
      'X (formerly Twitter)': { nameEn: 'X (formerly Twitter)', nameAr: 'إكس (تويتر سابقاً)', color: '#000000', iconType: 'x' },
      Twitter: { nameEn: 'X (formerly Twitter)', nameAr: 'إكس (تويتر سابقاً)', color: '#000000', iconType: 'x' },
      Direct: { nameEn: 'Direct Visits', nameAr: 'زيارات مباشرة', color: '#0d9488', iconType: 'direct' },
      'Direct Visits': { nameEn: 'Direct Visits', nameAr: 'زيارات مباشرة', color: '#0d9488', iconType: 'direct' },
      'External Referrals': { nameEn: 'External Referrals', nameAr: 'إحالات خارجية', color: '#6366f1', iconType: 'other' },
    };

    // Hide any traffic source when it has no visits (count > 0 only)
    const activeEntries = Object.entries(sourceCounts).filter(([_, count]) => count > 0);

    // Sort: Move source with new order / request to top, remaining by highest count
    activeEntries.sort(([srcA, countA], [srcB, countB]) => {
      if (srcA === latestOrderSource) return -1;
      if (srcB === latestOrderSource) return 1;
      return countB - countA;
    });

    return activeEntries.map(([src, count]) => {
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
        percentage: Math.max(1, Math.round((count / total) * 100)),
        color: cfg.color,
        iconType: cfg.iconType,
      };
    });
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
    let currentCount = 0;
    let prevSales = 0;
    let prevCount = 0;

    currentOrders.forEach((o) => {
      if (!o.date) return;
      const orderTime = new Date(o.date).getTime();
      if (isNaN(orderTime)) return;
      const age = now - orderTime;
      const val = Number(o.total) || 0;

      if (age >= 0 && age < thirtyDaysMs) {
        currentSales += val;
        currentCount++;
      } else if (age >= thirtyDaysMs && age < sixtyDaysMs) {
        prevSales += val;
        prevCount++;
      }
    });

    const sGrowth = prevSales > 0 ? Math.round(((currentSales - prevSales) / prevSales) * 100) : 0;
    const oGrowth = prevCount > 0 ? Math.round(((currentCount - prevCount) / prevCount) * 100) : 0;

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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start min-w-0">
        {/* ════ LEFT MAIN SECTION (8 COLS on xl, 8.5 on 2xl) ════ */}
        <div className="xl:col-span-8 2xl:col-span-8.5 space-y-4 min-w-0">
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

          {/* Row 3: Top Products + Traffic Sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch min-w-0">
            <TopProductsCard
              products={currentProducts}
              onViewAll={() => onNavigateTab('products')}
              onSelectProduct={() => onNavigateTab('products')}
            />
            <TrafficSourcesCard
              totalVisits={visitorsCount}
              growthPercentage={0}
              channels={trafficChannels}
              onViewAll={() => onNavigateTab('analytics')}
            />
          </div>
        </div>

        {/* ════ RIGHT RAIL SECTION (4 COLS on xl, 3.5 on 2xl - Compact & Balanced) ════ */}
        <div className="xl:col-span-4 2xl:col-span-3.5 space-y-4 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
            {/* Card 7: Recent Activity */}
            <RecentActivityCard
              orders={currentOrders}
              customers={currentCustomers}
              products={currentProducts}
              onViewAll={() => onNavigateTab('orders')}
              onNavigateOrder={() => onNavigateTab('orders')}
            />

            {/* Card 8: Notifications */}
            <NotificationsCard
              onViewAll={() => onNavigateTab('notifications')}
              onOpenOrder={(orderId) => {
                try { sessionStorage.setItem('target_view_order_id', orderId); } catch {}
                onNavigateTab('orders');
              }}
              onOpenProduct={(productId) => {
                try { sessionStorage.setItem('target_edit_product_id', productId); } catch {}
                onNavigateTab('products');
              }}
              onNavigateTab={onNavigateTab}
              onOpenWhatsApp={(phone, text) => {
                const cleanedPhone = (phone || '').replace(/[^0-9]/g, '');
                const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text || '')}`;
                window.open(url, '_blank');
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Embedded Orders Table Operations (Full Width Span) ── */}
      <div className="pt-2">
        <DashboardOrdersTable
          orders={currentOrders}
          onNavigateTab={onNavigateTab}
          onOpenCreateOrder={() => setIsCreateOrderModalOpen(true)}
        />
      </div>

      {/* ── Create Order Modal ── */}
      {isCreateOrderModalOpen && (
        <React.Suspense fallback={null}>
          <CreateStoreOrderModal
            isOpen={isCreateOrderModalOpen}
            storeId={activeStore.id}
            storeName={activeStore.name}
            onClose={() => setIsCreateOrderModalOpen(false)}
            onCreate={(orderData) => {
              try {
                addOrder(orderData as any, activeStore.id);
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
        </React.Suspense>
      )}
    </AdminPageShell>
  );
});

StoreDashboard.displayName = 'StoreDashboard';
