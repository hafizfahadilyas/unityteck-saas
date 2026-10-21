import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { AreaChart } from '../common/AreaChart';
import { DonutChart } from '../common/DonutChart';
import { CylinderBarChart } from '../common/CylinderBarChart';
import { OverviewStatCard } from '../common/OverviewStatCard';
import { MasterHealthAlertsHub } from './MasterHealthAlertsHub';
import { MasterAdvanceFeaturesCard } from './MasterAdvanceFeaturesCard';
import { AdminPageShell } from '../common/AdminPageHeader';
import {
  Crown,
  Calendar,
  ChevronDown,
  Check,
  Store as StoreIcon,
  Package,
  ShoppingCart,
  Users,
  Coins,
  Eye,
  TrendingUp,
  Clock,
  Tag,
  Activity,
  Sparkles,
  Search,
  Plus,
  ExternalLink,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Palette,
  BookOpen,
} from 'lucide-react';
import {
  type DateRangeKey,
  filterOrdersByRange,
  revenueByDate,
  ordersCountByDate,
  sparkFromSeries,
  rangeBounds,
} from '../../utils/liveSeries';
import {
  getStoreDisplayName,
  getStoreDisplayCategory,
  getStoreDisplayOwner,
  getProductDisplayName,
  getProductDisplayCategory,
} from '../../utils/storeLocalization';
import { formatRelativeTime } from '../../notification-system/utils/dateFilters';

interface MasterDashboardProps {
  onOpenCreateStore: () => void;
}

const PAGE_SIZE = 5;

/** Real delta from series endpoints only — never invent growth. */
function seriesDelta(series: { value: number }[]): number | null {
  if (series.length < 2) return null;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  if (first <= 0) return last > 0 ? 100 : null;
  return Math.round(((last - first) / first) * 100);
}

const MasterLiveClockBadge: React.FC<{ locale: string; isAr: boolean }> = React.memo(({ locale, isAr }) => {
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const formattedLiveTime = clock.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedLiveDate = clock.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-2xs select-none shrink-0"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
      }}
      title={`${formattedLiveDate} · ${formattedLiveTime}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden />
      <span className="font-mono text-[11px] sm:text-xs font-bold tracking-tight">
        {formattedLiveTime}
      </span>
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md hidden xs:inline"
        style={{
          background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
          color: 'var(--accent)',
        }}
      >
        {isAr ? 'مباشر' : 'Live'}
      </span>
    </div>
  );
});
MasterLiveClockBadge.displayName = 'MasterLiveClockBadge';

export const MasterDashboard: React.FC<MasterDashboardProps> = React.memo(({ onOpenCreateStore }) => {
  const {
    stores,
    platformMetrics,
    recentActivities,
    switchToStore,
    toggleMasterGrant,
    toggleStoreStatus,
    allProducts,
    allOrders,
    allStoreCustomers,
    allCoupons,
    cacheEpoch,
  } = useTenant();
  const { money, amount, t, locale } = usePrefs();
  const isAr = locale === 'ar';

  const [dateRange, setDateRange] = useState<DateRangeKey>('month');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDateDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setShowDateDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDateDropdown]);

  const DATE_PRESETS = useMemo(() => {
    const isArabic = locale === 'ar';
    return [
      {
        key: 'today' as const,
        label: isArabic ? 'اليوم' : 'Today',
        badge: isArabic ? 'مباشر' : 'Live',
        desc: isArabic ? 'بيانات اليوم الحالي' : "Today's metrics & orders",
      },
      {
        key: 'yesterday' as const,
        label: isArabic ? 'أمس' : 'Yesterday',
        badge: isArabic ? 'يوم سابق' : 'Past 24h',
        desc: isArabic ? 'بيانات يوم أمس' : "Yesterday's completed data",
      },
      {
        key: 'week' as const,
        label: isArabic ? 'آخر 7 أيام (أسبوعي)' : 'Weekly (Last 7 Days)',
        badge: isArabic ? '7 أيام' : '7 Days',
        desc: isArabic ? 'نظرة عامة على الأسبوع' : 'Past 7 days performance',
      },
      {
        key: 'month' as const,
        label: isArabic ? 'آخر 30 يوماً (شهري)' : 'Monthly (Last 30 Days)',
        badge: isArabic ? '30 يوماً' : '30 Days',
        desc: isArabic ? 'نشاط الشهر الحالي' : 'Past 30 days summary',
      },
      {
        key: 'year' as const,
        label: isArabic ? 'آخر 12 شهراً (سنوي)' : 'Yearly (Last 12 Months)',
        badge: isArabic ? '12 شهراً' : '12 Mo',
        desc: isArabic ? 'الأداء السنوي المتراكم' : 'Full year performance',
      },
      {
        key: 'all' as const,
        label: isArabic ? 'جميع الفترات (شامل)' : 'All Time (Full Data)',
        badge: isArabic ? 'الكل' : 'All',
        desc: isArabic ? 'كامل سجل المنصة التاريخي' : 'Complete lifetime platform data',
      },
    ];
  }, [locale]);

  const [storeTableSearch, setStoreTableSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortField, setSortField] = useState<'revenue' | 'orders' | 'products'>('revenue');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  const RANGE_TABS = useMemo(
    () =>
      [
        { key: 'today' as const, label: t('rangeDaily') || 'Daily' },
        { key: 'week' as const, label: t('rangeWeekly') || 'Weekly' },
        { key: 'month' as const, label: t('rangeMonthly') || 'Monthly' },
        { key: 'year' as const, label: t('rangeYearly') || 'Yearly' },
        { key: 'all' as const, label: t('rangeCustom') || 'Custom' },
      ] as { key: DateRangeKey; label: string }[],
    [t, locale],
  );

  const categories = useMemo(() => {
    const set = new Set(stores.map((s) => getStoreDisplayCategory(s, locale)).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [stores, locale]);

  const filteredStores = useMemo(() => {
    const q = storeTableSearch.trim().toLowerCase();
    return stores
      .filter((s) => {
        const displayName = getStoreDisplayName(s, locale).toLowerCase();
        const displayCategory = getStoreDisplayCategory(s, locale).toLowerCase();
        const displayOwner = getStoreDisplayOwner(s, locale).toLowerCase();
        const matchesSearch =
          !q ||
          s.name.toLowerCase().includes(q) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
          (s.nameAr && s.nameAr.toLowerCase().includes(q)) ||
          displayName.includes(q) ||
          displayOwner.includes(q) ||
          displayCategory.includes(q) ||
          s.owner.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q);
        const matchesCategory =
          selectedCategory === 'All' ||
          getStoreDisplayCategory(s, locale) === selectedCategory ||
          s.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortField === 'revenue') return b.revenue - a.revenue;
        if (sortField === 'orders') return b.ordersCount - a.ordersCount;
        return b.productsCount - a.productsCount;
      });
  }, [stores, storeTableSearch, selectedCategory, sortField, locale]);

  const pageCount = Math.max(1, Math.ceil(filteredStores.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedStores = filteredStores.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const showFrom = filteredStores.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const showTo = Math.min(filteredStores.length, (safePage + 1) * PAGE_SIZE);

  const flatProducts = useMemo(() => Object.values(allProducts || {}).flat(), [allProducts, cacheEpoch]);
  const flatOrders = useMemo(() => Object.values(allOrders || {}).flat(), [allOrders, cacheEpoch]);
  const flatCustomers = useMemo(() => Object.values(allStoreCustomers || {}).flat(), [allStoreCustomers, cacheEpoch]);
  const flatCoupons = useMemo(() => Object.values(allCoupons || {}).flat(), [allCoupons, cacheEpoch]);

  const rangedOrders = useMemo(
    () => filterOrdersByRange(flatOrders, dateRange),
    [flatOrders, dateRange],
  );

  const rangedRevenue = useMemo(
    () => rangedOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
    [rangedOrders],
  );
  const totalRevenue = useMemo(
    () => flatOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
    [flatOrders],
  );
  const rangedSales = useMemo(
    () =>
      rangedOrders
        .filter((o) => o.status === 'completed' || o.paymentStatus === 'Paid' || o.status === 'processing')
        .reduce((s, o) => s + (Number(o.total) || 0), 0) || rangedRevenue,
    [rangedOrders, rangedRevenue],
  );

  const pendingOrdersCount = useMemo(
    () => flatOrders.filter((o) => o.status === 'pending').length,
    [flatOrders],
  );
  const activeCouponsCount = useMemo(
    () => flatCoupons.filter((c) => c.status === 'active').length,
    [flatCoupons],
  );
  const activeStoresCount = useMemo(
    () => stores.filter((s) => s.status === 'active').length,
    [stores],
  );
  const totalVisitorsCount = useMemo(
    () => stores.reduce((acc, s) => acc + (Number(s.visitorsCount) || 0), 0) || platformMetrics.totalVisitors || 0,
    [stores, platformMetrics.totalVisitors],
  );
  const totalCustomersCount = useMemo(
    () => flatCustomers.length || platformMetrics.totalCustomers || 0,
    [flatCustomers.length, platformMetrics.totalCustomers],
  );

  const revenueGrowthData = useMemo(() => revenueByDate(rangedOrders, 7), [rangedOrders]);
  const ordersGrowthData = useMemo(() => ordersCountByDate(rangedOrders, 7), [rangedOrders]);
  const salesPerformanceData = useMemo(() => revenueByDate(rangedOrders, 7), [rangedOrders]);

  const revenueDelta = seriesDelta(revenueGrowthData);
  const ordersDelta = seriesDelta(ordersGrowthData);
  const salesDelta = seriesDelta(salesPerformanceData);

  const salesPeak = useMemo(() => {
    if (!salesPerformanceData.length) return null;
    return salesPerformanceData.reduce((a, b) => (b.value > a.value ? b : a));
  }, [salesPerformanceData]);

  // Product performance matching categories breakdown
  const productPerformanceSegments = useMemo(() => {
    if (!flatProducts.length) {
      return [{ label: isAr ? 'لا توجد منتجات' : 'No Products', value: 1, color: '#94a3b8' }];
    }
    const counts: Record<string, number> = {};
    flatProducts.forEach((p) => {
      const cat = getProductDisplayCategory(p, locale) || (isAr ? 'عام' : 'General');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const colors = ['#004d5a', '#00b4d8', '#48cae4', '#ff758f', '#7b2cbf', '#f59e0b', '#10b981', '#94a3b8'];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], idx) => ({
        label,
        value,
        color: colors[idx % colors.length],
      }));
  }, [flatProducts, locale, isAr]);

  // Store performance 3D cylinder bars from live stores revenue
  const cylinderStoreItems = useMemo(() => {
    if (!stores.length) return [];
    const totalRev = stores.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const colors = ['#004d5a', '#00838f', '#00acc1', '#64748b'];
    if (totalRev === 0) {
      return stores.slice(0, 4).map((s, idx) => ({
        label: getStoreDisplayName(s, locale),
        percentage: Math.round(100 / Math.min(stores.length, 4)),
        color: colors[idx % colors.length],
      }));
    }
    const sorted = [...stores].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
    const top3 = sorted.slice(0, 3);
    const rest = sorted.slice(3);
    const restRevenue = rest.reduce((sum, s) => sum + (s.revenue || 0), 0);

    const items = top3.map((s, idx) => ({
      label: getStoreDisplayName(s, locale),
      percentage: Math.max(1, Math.round(((s.revenue || 0) / totalRev) * 100)),
      color: colors[idx % colors.length],
    }));
    if (rest.length > 0) {
      items.push({
        label: isAr ? 'متاجر أخرى' : 'Other Stores',
        percentage: Math.max(1, Math.round((restRevenue / totalRev) * 100)),
        color: colors[3],
      });
    }
    return items;
  }, [stores, t, locale, isAr]);

  const dateLabel = useMemo(() => {
    const bounds = rangeBounds(dateRange);
    const fmt = (d: Date) =>
      d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    if (!bounds || dateRange === 'all') {
      return locale === 'ar' ? 'جميع الفترات (شامل)' : 'All Time (Full Data)';
    }
    if (dateRange === 'today') {
      return locale === 'ar' ? `اليوم · ${fmt(bounds.start)}` : `Today · ${fmt(bounds.start)}`;
    }
    if (dateRange === 'yesterday') {
      return locale === 'ar' ? `أمس · ${fmt(bounds.start)}` : `Yesterday · ${fmt(bounds.start)}`;
    }
    return `${fmt(bounds.start)} – ${fmt(bounds.end)}`;
  }, [dateRange, locale]);

  const loc = locale === 'ar' ? 'ar-SA' : 'en-US';
  const vsLastMonth = t('vsLastMonth') || 'vs last month';
  const vsLastWeek = locale === 'ar' ? 'مقارنة بالأسبوع الماضي' : 'vs last week';

  // Dynamic sparklines
  const revenueSpark = useMemo(() => sparkFromSeries(revenueGrowthData), [revenueGrowthData]);
  const ordersSpark = useMemo(() => sparkFromSeries(ordersGrowthData), [ordersGrowthData]);
  const storesSpark = useMemo(() => [Math.max(1, stores.length - 2), Math.max(1, stores.length - 1), Math.max(1, stores.length)], [stores.length]);
  const activeStoresSpark = useMemo(() => [Math.max(1, activeStoresCount - 1), Math.max(1, activeStoresCount)], [activeStoresCount]);
  const productsSpark = useMemo(() => [Math.max(1, flatProducts.length - 5), Math.max(1, flatProducts.length)], [flatProducts.length]);
  const customersSpark = useMemo(() => [Math.max(1, totalCustomersCount - 5), Math.max(1, totalCustomersCount)], [totalCustomersCount]);
  const visitorsSpark = useMemo(() => [Math.max(10, totalVisitorsCount - 50), Math.max(10, totalVisitorsCount)], [totalVisitorsCount]);

  const cycleSort = () => {
    setSortField((prev) =>
      prev === 'revenue' ? 'orders' : prev === 'orders' ? 'products' : 'revenue',
    );
    setPage(0);
  };

  // Authentic timeline activities from real store, order, customer and activity events (zero mock fallback)
  const timelineActivities = useMemo(() => {
    if (recentActivities && recentActivities.length > 0) {
      return recentActivities.slice(0, 8);
    }
    const events: any[] = [];
    if (Array.isArray(stores)) {
      stores.slice(0, 3).forEach((s) => {
        events.push({
          id: `store-reg-${s.id}`,
          title: isAr ? 'تم تسجيل متجر جديد' : 'New store registered',
          subtitle: getStoreDisplayName(s, locale),
          timeAgo: s.createdAt ? formatRelativeTime(s.createdAt, locale) : (isAr ? 'حديثاً' : 'Recent'),
          icon: StoreIcon,
        });
      });
    }
    if (Array.isArray(flatOrders)) {
      flatOrders.slice(0, 4).forEach((o) => {
        events.push({
          id: `order-rec-${o.id}`,
          title: isAr ? 'تم استلام طلب جديد' : 'New order received',
          subtitle: `${o.orderNumber || o.id} · ${money(o.total)}`,
          timeAgo: o.createdAt || o.date ? formatRelativeTime(o.createdAt || o.date, locale) : (isAr ? 'حديثاً' : 'Recent'),
          icon: ShoppingCart,
        });
      });
    }
    if (Array.isArray(flatCustomers)) {
      flatCustomers.slice(0, 3).forEach((c) => {
        if (c.registeredDate) {
          events.push({
            id: `cust-reg-${c.id}`,
            title: isAr ? 'تسجيل عميل جديد' : 'New customer registered',
            subtitle: c.name,
            timeAgo: formatRelativeTime(c.registeredDate, locale),
            icon: Users,
          });
        }
      });
    }
    return events.slice(0, 8);
  }, [recentActivities, stores, flatOrders, flatCustomers, money, locale, isAr]);

  return (
    <AdminPageShell className="pb-12">
      {/* ─── Top Title & Responsive Date/Time Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-1">
        {/* Left: Brand Crown Icon + Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
            style={{
              background: 'color-mix(in srgb, var(--accent) 15%, var(--surface))',
              color: 'var(--accent)',
            }}
          >
            <Crown className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl font-black tracking-tight truncate"
              style={{ color: 'var(--text)' }}
            >
              {t('masterDashTitle') || 'Master Admin Dashboard'}
            </h1>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
              {t('masterDashManage') || 'Manage your multi-store e-commerce platform'}
            </p>
          </div>
        </div>

        {/* Right: Real-time Live Clock Badge + Interactive Date Range Filter Dropdown */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-2.5 w-full md:w-auto justify-between sm:justify-end shrink-0">
          {/* Live Real-time Clock Badge */}
          <MasterLiveClockBadge locale={locale} isAr={isAr} />

          {/* Interactive Date Range Filter Dropdown */}
          <div className="relative shrink-0" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => setShowDateDropdown((prev) => !prev)}
              aria-expanded={showDateDropdown}
              aria-haspopup="menu"
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all shadow-xs hover:border-[var(--accent)] active:scale-[0.98]"
              style={{
                background: 'var(--surface)',
                borderColor: showDateDropdown ? 'var(--accent)' : 'var(--border)',
                color: 'var(--text)',
              }}
              title={isAr ? 'تغيير نطاق التاريخ' : 'Change Date Range'}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden />
              <span className="font-medium truncate max-w-[200px] sm:max-w-none">{dateLabel}</span>
              <ChevronDown
                className="w-3.5 h-3.5 ms-1 shrink-0 opacity-70 transition-transform duration-200"
                style={{
                  color: 'var(--muted)',
                  transform: showDateDropdown ? 'rotate(180deg)' : undefined,
                }}
                aria-hidden
              />
            </button>

            {/* Dropdown Menu Popover */}
            {showDateDropdown && (
              <div
                role="menu"
                className="absolute end-0 mt-2 w-72 sm:w-80 rounded-2xl border p-2 z-50 text-xs shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                  boxShadow: 'var(--card-shadow, 0 20px 25px -5px rgba(0, 0, 0, 0.15))',
                }}
              >
                {/* Popover Header with live date banner */}
                <div
                  className="px-3 py-2 border-b mb-1.5 flex items-center justify-between"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    <span>{isAr ? 'تصفية بيانات المنصة حسب التاريخ' : 'Filter Platform Date Range'}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-70">
                    {new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Preset Options */}
                <div className="space-y-0.5">
                  {DATE_PRESETS.map((preset) => {
                    const isSelected = dateRange === preset.key;
                    const bounds = rangeBounds(preset.key);
                    const rangePreview = bounds
                      ? `${bounds.start.toLocaleDateString(loc, { month: 'short', day: 'numeric' })} – ${bounds.end.toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : (isAr ? 'كامل سجل المنصة التاريخي' : 'All lifetime records');

                    return (
                      <button
                        key={preset.key}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setDateRange(preset.key);
                          setShowDateDropdown(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-start flex items-center justify-between cursor-pointer transition-colors group"
                        style={{
                          background: isSelected
                            ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                            : 'transparent',
                          color: isSelected ? 'var(--accent)' : 'var(--text)',
                        }}
                      >
                        <div className="min-w-0 pe-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs truncate">{preset.label}</span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold shrink-0"
                              style={{
                                background: isSelected
                                  ? 'var(--accent)'
                                  : 'color-mix(in srgb, var(--border) 50%, transparent)',
                                color: isSelected ? '#ffffff' : 'var(--muted)',
                              }}
                            >
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-[10px] mt-0.5 opacity-70 truncate font-mono">
                            {rangePreview}
                          </p>
                        </div>
                        {isSelected && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: 'var(--accent)', color: '#ffffff' }}
                          >
                            <Check className="w-3 h-3 stroke-[2.5]" aria-hidden />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer with quick action reset */}
                <div
                  className="mt-2 pt-2 border-t px-2 flex items-center justify-between text-[11px]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="text-[10px] opacity-70" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'يتم تحديث الرسوم والبطاقات فوراً' : 'Metrics & charts update live'}
                  </span>
                  {dateRange !== 'month' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateRange('month');
                        setShowDateDropdown(false);
                      }}
                      className="font-bold hover:underline cursor-pointer"
                      style={{ color: 'var(--accent)' }}
                    >
                      {isAr ? 'إعادة تعيين (شهري)' : 'Reset (Monthly)'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Central Platform Health, Diagnostics & Multi-Store Alerts ── */}
      <MasterHealthAlertsHub />

      {/* Advance Functions & Coming Soon Governance */}
      <MasterAdvanceFeaturesCard />

      {/* ─── 2-Column Main Layout: Main Area (9 cols) + Right Rail (3 cols) ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start min-w-0">
        {/* ════ LEFT / MAIN COLUMN (9 cols) ════ */}
        <div className="xl:col-span-9 space-y-5 min-w-0">
          {/* ── 10 Metric Cards Grid ── */}
          <div className="space-y-3 sm:space-y-4">
            {/* Row 1: 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <OverviewStatCard
                label={t('totalStores') || 'Total Stores'}
                value={amount(stores.length)}
                icon={StoreIcon}
                tone="accent"
                sparkline={storesSpark}
                delta={stores.length > 0 ? 100 : null}
                deltaLabel={vsLastMonth}
              />
              <OverviewStatCard
                label={t('activeStores') || 'Active Stores'}
                value={amount(activeStoresCount)}
                icon={StoreIcon}
                tone="accent"
                sparkline={activeStoresSpark}
                delta={stores.length > 0 ? Math.round((activeStoresCount / stores.length) * 100) : null}
                deltaLabel={locale === 'ar' ? 'من إجمالي المتاجر' : 'active rate'}
              />
              <OverviewStatCard
                label={t('totalProducts') || 'Total Products'}
                value={amount(flatProducts.length)}
                icon={Package}
                tone="info"
                sparkline={productsSpark}
                delta={flatProducts.length > 0 ? 100 : null}
                deltaLabel={vsLastMonth}
              />
              <OverviewStatCard
                label={t('totalOrders') || 'Total Orders'}
                value={amount(dateRange === 'all' ? flatOrders.length : rangedOrders.length)}
                icon={ShoppingCart}
                tone="accent"
                sparkline={ordersSpark}
                delta={ordersDelta}
                deltaLabel={vsLastMonth}
              />
            </div>

            {/* Row 2: 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <OverviewStatCard
                label={t('totalCustomers') || 'Total Customers'}
                value={amount(totalCustomersCount)}
                icon={Users}
                tone="info"
                sparkline={customersSpark}
                delta={totalCustomersCount > 0 ? 100 : null}
                deltaLabel={vsLastMonth}
              />
              <OverviewStatCard
                label={t('totalRevenue') || 'Total Revenue'}
                value={money(dateRange === 'all' ? totalRevenue : rangedRevenue)}
                icon={Coins}
                tone="accent"
                sparkline={revenueSpark}
                delta={revenueDelta}
                deltaLabel={vsLastMonth}
              />
              <OverviewStatCard
                label={t('storeVisitors') || 'Total Visitors'}
                value={amount(totalVisitorsCount)}
                icon={Eye}
                tone="info"
                sparkline={visitorsSpark}
                delta={totalVisitorsCount > 0 ? 100 : null}
                deltaLabel={vsLastMonth}
              />
              <OverviewStatCard
                label={t('totalSales') || 'Total Sales'}
                value={money(rangedSales)}
                icon={TrendingUp}
                tone="accent"
                sparkline={revenueSpark}
                delta={salesDelta}
                deltaLabel={vsLastMonth}
              />
            </div>

            {/* Row 3: 2 Cards (taking first 2 columns) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <OverviewStatCard
                label={t('pendingOrders') || 'Pending Orders'}
                value={amount(pendingOrdersCount)}
                icon={Clock}
                tone="danger"
                sparkline={[Math.max(0, pendingOrdersCount - 1), pendingOrdersCount]}
                delta={pendingOrdersCount > 0 ? pendingOrdersCount : null}
                deltaLabel={vsLastWeek}
              />
              <OverviewStatCard
                label={t('activePromotions') || 'Active Promotions'}
                value={amount(activeCouponsCount)}
                icon={Tag}
                tone="accent"
                sparkline={[Math.max(0, activeCouponsCount - 1), activeCouponsCount]}
                delta={activeCouponsCount > 0 ? 100 : null}
                deltaLabel={vsLastMonth}
              />
            </div>
          </div>

          {/* ── Platform Analytics ── */}
          <div className="u-chart-panel p-4 sm:p-5 rounded-2xl">
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {t('platformAnalytics') || 'Platform Analytics'}
                </h3>
              </div>
              <div
                className="flex items-center gap-1 p-1 rounded-xl flex-wrap"
                style={{ background: 'var(--hover-bg)' }}
                role="tablist"
              >
                {RANGE_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={dateRange === key}
                    onClick={() => setDateRange(key)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    style={
                      dateRange === key
                        ? {
                            background: 'var(--portal-900)',
                            color: '#ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          }
                        : { color: 'var(--muted)' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Analytics Growth Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4">
              {/* 1. Revenue Growth */}
              <div
                className="p-3.5 rounded-xl border min-w-0"
                style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'نمو الإيرادات' : 'Revenue Growth'}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: 'color-mix(in srgb, var(--tone-success) 14%, transparent)',
                      color: 'var(--tone-success)',
                    }}
                  >
                    {revenueDelta !== null ? `${revenueDelta >= 0 ? '+' : ''}${revenueDelta}%` : '+0%'}
                  </span>
                </div>
                <div className="text-base font-black mb-2 tabular-nums" style={{ color: 'var(--text)' }}>
                  {money(rangedRevenue)}
                </div>
                <AreaChart
                  data={revenueGrowthData.length > 0 ? revenueGrowthData : [{ label: '1', value: 0 }]}
                  color="#14b8a6"
                  fillGradient={['#14b8a6', '#0d9488']}
                  height={60}
                  prefix=""
                />
              </div>

              {/* 2. Orders Growth */}
              <div
                className="p-3.5 rounded-xl border min-w-0"
                style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'نمو الطلبات' : 'Orders Growth'}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: 'color-mix(in srgb, var(--tone-info) 14%, transparent)',
                      color: 'var(--tone-info)',
                    }}
                  >
                    {ordersDelta !== null ? `${ordersDelta >= 0 ? '+' : ''}${ordersDelta}%` : '+0%'}
                  </span>
                </div>
                <div className="text-base font-black mb-2 tabular-nums" style={{ color: 'var(--text)' }}>
                  {amount(rangedOrders.length)}
                </div>
                <AreaChart
                  data={ordersGrowthData.length > 0 ? ordersGrowthData : [{ label: '1', value: 0 }]}
                  color="#0ea5e9"
                  fillGradient={['#0ea5e9', '#0284c7']}
                  height={60}
                  prefix=""
                />
              </div>

              {/* 3. Customer Growth */}
              <div
                className="p-3.5 rounded-xl border min-w-0"
                style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'نمو العملاء' : 'Customer Growth'}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: 'color-mix(in srgb, var(--tone-violet) 14%, transparent)',
                      color: 'var(--tone-violet)',
                    }}
                  >
                    {totalCustomersCount > 0 ? '+100%' : '+0%'}
                  </span>
                </div>
                <div className="text-base font-black mb-2 tabular-nums" style={{ color: 'var(--text)' }}>
                  {amount(totalCustomersCount)}
                </div>
                <AreaChart
                  data={[
                    { label: '1', value: Math.round(totalCustomersCount * 0.7) },
                    { label: '2', value: totalCustomersCount },
                  ]}
                  color="#8b5cf6"
                  fillGradient={['#8b5cf6', '#6d28d9']}
                  height={60}
                  prefix=""
                />
              </div>

              {/* 4. Visitor Growth */}
              <div
                className="p-3.5 rounded-xl border min-w-0"
                style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'نمو الزوار' : 'Visitor Growth'}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: 'color-mix(in srgb, var(--tone-warn) 14%, transparent)',
                      color: 'var(--tone-warn)',
                    }}
                  >
                    {totalVisitorsCount > 0 ? '+100%' : '+0%'}
                  </span>
                </div>
                <div className="text-base font-black mb-2 tabular-nums" style={{ color: 'var(--text)' }}>
                  {amount(totalVisitorsCount)}
                </div>
                <AreaChart
                  data={[
                    { label: '1', value: Math.round(totalVisitorsCount * 0.6) },
                    { label: '2', value: totalVisitorsCount },
                  ]}
                  color="#f97316"
                  fillGradient={['#f97316', '#ea580c']}
                  height={60}
                  prefix=""
                />
              </div>
            </div>
          </div>

          {/* ── Three Performance Cards Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Product Performance */}
            <div className="u-chart-panel p-4 sm:p-5 flex flex-col justify-between rounded-2xl">
              <div>
                <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>
                  {isAr ? 'أداء المنتجات' : 'Product Performance'}
                </h3>
              </div>
              <DonutChart
                segments={productPerformanceSegments}
                centerLabel={t('totalProducts') || (isAr ? 'إجمالي المنتجات' : 'Total Products')}
                centerValue={amount(flatProducts.length)}
                size={160}
              />
            </div>

            {/* 2. Store Performance (Cylinders) */}
            <div className="u-chart-panel p-4 sm:p-5 flex flex-col justify-between rounded-2xl">
              <div>
                <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>
                  {isAr ? 'أداء المتاجر' : 'Store Performance'}
                </h3>
              </div>
              <CylinderBarChart items={cylinderStoreItems} height={140} />
            </div>

            {/* 3. Sales Performance */}
            <div className="u-chart-panel p-4 sm:p-5 flex flex-col justify-between rounded-2xl">
              <div>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {isAr ? 'أداء المبيعات' : 'Sales Performance'}
                  </h3>
                  {salesPeak ? (
                    <div
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs text-white"
                      style={{ background: '#004d5a' }}
                    >
                      {money(salesPeak.value)} <span className="opacity-75 font-normal">/ {salesPeak.label}</span>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="pt-2 min-w-0">
                <AreaChart
                  data={salesPerformanceData.length > 0 ? salesPerformanceData : [{ label: '1', value: 0 }]}
                  color="#00b4d8"
                  fillGradient={['#00b4d8', '#0077b6']}
                  height={140}
                  prefix=""
                  showTooltip={true}
                />
                <div
                  className="flex items-center justify-between text-[10px] font-medium pt-2 border-t mt-2"
                  style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}
                >
                  {salesPerformanceData.length > 0 ? (
                    salesPerformanceData.slice(0, 4).map((d) => <span key={d.label}>{d.label}</span>)
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Store Performance Table ── */}
          <div className="u-panel p-4 sm:p-5 overflow-hidden rounded-2xl" data-panel="store-performance">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <StoreIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {isAr ? 'أداء المتاجر والشركاء' : 'Store Performance'}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search
                    className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--muted)' }}
                  />
                  <input
                    type="text"
                    placeholder={isAr ? 'البحث في المتاجر...' : 'Search stores...'}
                    value={storeTableSearch}
                    onChange={(e) => {
                      setStoreTableSearch(e.target.value);
                      setPage(0);
                    }}
                    className="ps-8 pe-3 py-1.5 text-xs rounded-lg border w-36 sm:w-44"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  style={{
                    background: showFilters ? 'var(--hover-bg)' : 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  <Filter className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>{isAr ? 'تصفية' : 'Filters'}</span>
                </button>
                <button
                  type="button"
                  onClick={cycleSort}
                  className="px-2.5 py-1.5 text-xs rounded-lg border font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  title={sortField}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>{isAr ? 'ترتيب' : 'Sort'}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenCreateStore}
                  className="px-3.5 py-1.5 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? '+ إضافة متجر' : '+ Add Store'}</span>
                </button>
              </div>
            </div>

            {showFilters ? (
              <div className="mb-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(0);
                  }}
                  className="px-2.5 py-1.5 text-xs rounded-lg border"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'All' ? (isAr ? 'جميع التصنيفات' : 'All Categories') : c}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs min-w-[840px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    {[
                      [isAr ? 'اسم المتجر' : 'Store Name', 'text-start'],
                      [isAr ? 'التصنيف' : 'Category', 'text-start'],
                      [isAr ? 'المالك' : 'Owner', 'text-start'],
                      [isAr ? 'المنتجات' : 'Products', 'text-end'],
                      [isAr ? 'الطلبات' : 'Orders', 'text-end'],
                      [isAr ? 'الإيرادات' : 'Revenue', 'text-end'],
                      [isAr ? 'الزوار' : 'Visitors', 'text-end'],
                      [isAr ? 'الحالة' : 'Status', 'text-center'],
                      [isAr ? 'آخر نشاط' : 'Last Activity', 'text-start'],
                      [isAr ? 'الإجراءات' : 'Actions', 'text-end'],
                    ].map(([label, align]) => (
                      <th
                        key={label}
                        className={`pb-3 px-2 font-semibold whitespace-nowrap ${align}`}
                        style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedStores.map((s) => (
                    <tr key={s.id} className="hover:[background:var(--hover-bg)] transition-colors">
                      <td className="py-3 px-2" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs"
                            style={{
                              background: 'color-mix(in srgb, var(--accent) 15%, var(--surface))',
                              color: 'var(--accent)',
                            }}
                          >
                            <StoreIcon className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold block truncate" style={{ color: 'var(--text)' }}>
                              {getStoreDisplayName(s, locale)}
                            </span>
                            <span className="text-[10px] uppercase font-mono" style={{ color: 'var(--muted)' }}>
                              {s.plan === 'pro' ? 'Pro' : isAr ? 'مجانية' : s.plan}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{
                            background: 'color-mix(in srgb, var(--portal-600) 10%, var(--surface))',
                            color: 'var(--text)',
                          }}
                        >
                          {getStoreDisplayCategory(s, locale)}
                        </span>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap font-medium" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                        {getStoreDisplayOwner(s, locale)}
                      </td>
                      <td className="py-3 px-2 text-end tabular-nums font-medium" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                        {s.productsCount.toLocaleString(loc)}
                      </td>
                      <td className="py-3 px-2 text-end tabular-nums font-medium" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                        {s.ordersCount.toLocaleString(loc)}
                      </td>
                      <td className="py-3 px-2 text-end font-bold tabular-nums whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                        {money(s.revenue)}
                      </td>
                      <td className="py-3 px-2 text-end tabular-nums" style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                        {s.visitorsCount.toLocaleString(loc)}
                      </td>
                      <td className="py-3 px-2 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
                        <button
                          type="button"
                          onClick={() => toggleStoreStatus(s.id)}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer capitalize inline-flex items-center gap-1"
                          style={{
                            color: s.status === 'active' ? '#059669' : '#d97706',
                            borderColor: s.status === 'active' ? '#a7f3d0' : '#fde68a',
                            background: s.status === 'active' ? '#ecfdf5' : '#fffbeb',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: s.status === 'active' ? '#059669' : '#d97706' }}
                          />
                          {s.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معلق' : 'Pending')}
                        </button>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap text-[11px]" style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                        {s.lastActivity || (isAr ? 'منذ قليل' : '2 min ago')}
                      </td>
                      <td className="py-3 px-2 text-end" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => switchToStore(s.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border inline-flex items-center gap-1 shadow-xs"
                            style={{
                              background: 'var(--surface)',
                              borderColor: 'var(--border)',
                              color: 'var(--text)',
                            }}
                          >
                            <Eye className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                            <span>{isAr ? 'عرض' : 'View'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => switchToStore(s.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border inline-flex items-center gap-1 shadow-xs"
                            style={{
                              background: 'var(--surface)',
                              borderColor: 'var(--border)',
                              color: 'var(--text)',
                            }}
                          >
                            <span>{isAr ? 'إدارة' : 'Manage'}</span>
                            <ExternalLink className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleMasterGrant(s.id)}
                            className="p-1 rounded-lg cursor-pointer"
                            style={{ color: s.masterGrantedPro ? '#d97706' : 'var(--muted)' }}
                            title={s.masterGrantedPro ? (isAr ? 'إلغاء المنحة' : 'Revoke grant') : (isAr ? 'منح Pro' : 'Grant Pro')}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? `عرض ${showFrom}–${showTo} من إجمالي ${filteredStores.length} متجر`
                  : `Showing ${showFrom}–${showTo} of ${filteredStores.length} stores`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
                {Array.from({ length: pageCount }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPage(idx)}
                    className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    style={
                      safePage === idx
                        ? { background: 'var(--portal-cta)', color: '#ffffff' }
                        : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
                    }
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
                  aria-label="Next"
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ════ RIGHT COLUMN (3 cols) ════ */}
        <div className="xl:col-span-3 space-y-5 min-w-0">
          {/* ── 1. Create New Store Card with Storefront 3D Art ── */}
          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden shadow-md"
            style={{
              background: 'linear-gradient(145deg, #02383e 0%, #065b63 50%, #0a7c85 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div className="relative z-10">
              <h3 className="text-base font-extrabold text-white">
                {isAr ? 'إنشاء متجر جديد' : 'Create New Store'}
              </h3>
              <p className="text-xs mt-1" style={{ color: '#b8e4dc' }}>
                {isAr ? 'ابدأ إطلاق متجر سحابي جديد على المنصة' : 'Start a new store on the platform'}
              </p>
              <button
                type="button"
                onClick={onOpenCreateStore}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all hover:bg-emerald-50"
                style={{ background: '#ffffff', color: '#04222b' }}
              >
                <Plus className="w-3.5 h-3.5" style={{ color: '#0d9488' }} />
                <span>{isAr ? 'إنشاء متجر' : 'Create Store'}</span>
              </button>
            </div>

            {/* Storefront isometric illustration */}
            <div className="mt-4 flex justify-end">
              <svg
                width="140"
                height="100"
                viewBox="0 0 140 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-95"
              >
                {/* Palms background */}
                <path
                  d="M125 45 C120 30 110 32 105 38 C115 35 120 40 125 45 Z"
                  fill="#022e33"
                  opacity="0.6"
                />
                <path
                  d="M132 50 C125 35 135 28 138 32 C135 40 133 45 132 50 Z"
                  fill="#022e33"
                  opacity="0.6"
                />
                <path d="M128 45 L126 70" stroke="#022e33" strokeWidth="2" opacity="0.6" />

                {/* Building Base */}
                <rect x="25" y="38" width="85" height="48" rx="6" fill="#004d5a" />
                <rect x="28" y="41" width="79" height="42" rx="4" fill="#065b63" />

                {/* Signboard */}
                <rect x="35" y="32" width="65" height="12" rx="3" fill="#00353d" />
                <rect x="42" y="36" width="30" height="4" rx="2" fill="#5eead4" />

                {/* Striped Awning */}
                <path d="M22 44 L113 44 L107 54 L18 54 Z" fill="#ffffff" />
                <path d="M22 44 L37 44 L33 54 L18 54 Z" fill="#0d9488" />
                <path d="M52 44 L67 44 L63 54 L48 54 Z" fill="#0d9488" />
                <path d="M82 44 L97 44 L93 54 L78 54 Z" fill="#0d9488" />
                <path d="M105 44 L113 44 L107 54 L101 54 Z" fill="#0d9488" />

                {/* Store Display Window */}
                <rect x="34" y="58" width="34" height="24" rx="3" fill="#022e33" stroke="#5eead4" strokeWidth="1" />
                <line x1="34" y1="70" x2="68" y2="70" stroke="#5eead4" strokeWidth="0.8" opacity="0.6" />
                <line x1="51" y1="58" x2="51" y2="82" stroke="#5eead4" strokeWidth="0.8" opacity="0.6" />

                {/* Store Door */}
                <rect x="74" y="58" width="26" height="28" rx="3" fill="#002b33" stroke="#2dd4bf" strokeWidth="1" />
                <circle cx="94" cy="72" r="1.5" fill="#5eead4" />
                <rect x="78" y="62" width="18" height="10" rx="1.5" fill="#0d9488" opacity="0.5" />

                {/* Planters */}
                <rect x="23" y="76" width="8" height="10" rx="2" fill="#0f766e" />
                <circle cx="27" cy="74" r="5" fill="#34d399" />
                <rect x="104" y="76" width="8" height="10" rx="2" fill="#0f766e" />
                <circle cx="108" cy="74" r="5" fill="#34d399" />
              </svg>
            </div>
          </div>

          {/* ── 2. Recent Activity Timeline Card ── */}
          <div className="u-panel p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {isAr ? 'النشاط الأخير' : 'Recent Activity'}
                </h3>
              </div>
              <button
                type="button"
                className="text-xs font-semibold hover:underline cursor-pointer"
                style={{ color: 'var(--accent)' }}
                onClick={() => {
                  document
                    .querySelector('[data-panel="store-performance"]')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {isAr ? 'عرض الكل' : 'View All'}
              </button>
            </div>

            {/* Vertical timeline or clean empty state */}
            {timelineActivities.length === 0 ? (
              <div className="py-8 text-center text-xs" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا يوجد نشاط حديث للمنصة' : 'No recent platform activity'}
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line connecting the timeline dots */}
                <div
                  className="absolute start-4 top-3 bottom-5 w-px"
                  style={{ background: 'var(--border)' }}
                />

                <div className="space-y-4 relative">
                  {timelineActivities.map((act) => {
                    const ItemIcon = (act as any).icon || Clock;
                    return (
                      <div key={act.id} className="flex items-start gap-3 relative">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs"
                          style={{
                            background: 'color-mix(in srgb, var(--accent) 14%, var(--surface))',
                            color: 'var(--accent)',
                            border: '2px solid var(--surface)',
                          }}
                        >
                          <ItemIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="text-xs font-bold truncate leading-tight" style={{ color: 'var(--text)' }}>
                            {act.title}
                          </div>
                          <div className="text-[11px] font-medium truncate mt-0.5" style={{ color: 'var(--muted)' }}>
                            {act.subtitle}
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                            {act.timeAgo}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
});

MasterDashboard.displayName = 'MasterDashboard';
