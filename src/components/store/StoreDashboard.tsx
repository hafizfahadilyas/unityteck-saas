import React, { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { AreaChart } from '../common/AreaChart';
import { DonutChart } from '../common/DonutChart';
import { CylinderBarChart } from '../common/CylinderBarChart';
import { OverviewStatCard } from '../common/OverviewStatCard';
import { StoreHealthAlertBanner } from '../common/StoreHealthAlertBanner';
import { AdminPageShell } from '../common/AdminPageHeader';
import {
  Store as StoreIcon,
  Calendar,
  ChevronDown,
  Coins,
  ShoppingCart,
  Package,
  Users,
  Eye,
  TrendingUp,
  Clock,
  Tag,
  Activity,
  Sparkles,
  ExternalLink,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ShoppingBag,
  Percent,
  X,
  ShieldCheck,
  Check,
  Lock,
  Globe,
} from 'lucide-react';
import { useToast } from '../common/ToastProvider';
import {
  type DateRangeKey,
  aggregateOrderSources,
  revenueByDate,
  ordersCountByDate,
  sparkFromSeries,
  rangeBounds,
  statusChipStyle,
  sourceTone,
} from '../../utils/liveSeries';

interface StoreDashboardProps {
  onNavigateTab: (tab: string) => void;
}

const PAGE_SIZE = 5;

/** Real delta from series endpoints only. */
function seriesDelta(series: { value: number }[]): number | null {
  if (series.length < 2) return null;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  if (first <= 0) return last > 0 ? 100 : null;
  return Math.round(((last - first) / first) * 100);
}

export const StoreDashboard: React.FC<StoreDashboardProps> = ({ onNavigateTab }) => {
  const {
    activeStore,
    currentCustomers,
    currentProducts,
    currentOrders,
    currentCoupons,
    dataSource,
    cacheEpoch,
    updateStorePlan,
    addAuditLog,
  } = useTenant();
  const { money, amount, t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);

  const handleUpgradeToPro = async () => {
    setIsProcessingUpgrade(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      updateStorePlan(activeStore.id, 'pro');
      addAuditLog({
        adminId: activeStore.ownerEmail || 'store-owner',
        adminName: activeStore.owner,
        storeId: activeStore.id,
        action: 'plan_change',
        resource: 'Plan Upgrade',
        details: 'Store successfully upgraded from Free to Pro Tier via SaaS Payment Gateway',
        status: 'success',
        ipAddress: '185.199.108.153',
      });
      toast(
        locale === 'ar'
          ? 'تهانينا! تمت الترقية إلى باقة Pro بنجاح وفُتحت جميع ميزات الاستضافة المشتركة والثيمات.'
          : 'Congratulations! Upgraded to Pro Plan. All premium features & Hostinger Shared modules unlocked.',
        'success',
      );
      setShowUpgradeModal(false);
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  const [dateRange, setDateRange] = useState<DateRangeKey>('month');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortField, setSortField] = useState<'total' | 'date' | 'items'>('date');
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

  const liveRevenue = useMemo(
    () => currentOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
    [currentOrders, cacheEpoch],
  );

  const pendingCount = useMemo(
    () => currentOrders.filter((o) => o.status === 'pending').length,
    [currentOrders, cacheEpoch],
  );

  const activeCouponsCount = useMemo(
    () => (currentCoupons || []).filter((c) => c.status === 'active').length,
    [currentCoupons, cacheEpoch],
  );

  const visitorsCount = Number(activeStore.visitorsCount) || 0;

  const conversionRateValue = useMemo(() => {
    if (!visitorsCount || visitorsCount <= 0) return '0%';
    const rate = ((currentOrders.length / visitorsCount) * 100).toFixed(1);
    return `${rate}%`;
  }, [visitorsCount, currentOrders.length]);

  const attributedSalesValue = useMemo(() => {
    if (!currentOrders.length) return '0%';
    const attributed = currentOrders.filter(
      (o) => o.source && o.source !== 'Direct' && o.source !== 'مباشر',
    ).length;
    return `${Math.round((attributed / currentOrders.length) * 100)}%`;
  }, [currentOrders]);

  const avgOrderValue = useMemo(() => {
    if (!currentOrders.length) return 0;
    return Math.round(liveRevenue / currentOrders.length);
  }, [liveRevenue, currentOrders.length]);

  const revenueGrowthData = useMemo(() => revenueByDate(currentOrders, 7), [currentOrders, cacheEpoch]);
  const ordersGrowthData = useMemo(() => ordersCountByDate(currentOrders, 7), [currentOrders, cacheEpoch]);

  const revenueDelta = seriesDelta(revenueGrowthData);
  const ordersDelta = seriesDelta(ordersGrowthData);

  const dateLabel = useMemo(() => {
    const bounds = rangeBounds(dateRange);
    const fmt = (d: Date) =>
      d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    if (!bounds) return 'Apr 26, 2025 – May 26, 2025';
    if (dateRange === 'today' || dateRange === 'yesterday') return fmt(bounds.start);
    return `${fmt(bounds.start)} – ${fmt(bounds.end)}`;
  }, [dateRange, locale]);

  // Product categories breakdown donut
  const productPerformanceSegments = useMemo(() => {
    const counts = new Map<string, number>();
    currentProducts.forEach((p) => {
      const cat = p.category || 'General';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
    const total = Math.max(1, currentProducts.length);
    const colors = ['#004d5a', '#00b4d8', '#48cae4', '#ff758f', '#7b2cbf', '#94a3b8'];
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (!entries.length) {
      return [{ label: locale === 'ar' ? 'الكتالوج' : 'Catalog', value: 100, color: '#004d5a' }];
    }
    return entries.map(([label, n], i) => ({
      label,
      value: Math.round((n / total) * 100),
      color: colors[i % colors.length],
    }));
  }, [currentProducts, locale]);

  // Order sources distribution cylinders
  const sources = useMemo(
    () => aggregateOrderSources(currentOrders).slice(0, 4),
    [currentOrders, cacheEpoch],
  );

  const cylinderSourceItems = useMemo(() => {
    if (!sources.length) {
      return [];
    }
    const colors = ['#004d5a', '#00838f', '#00acc1', '#64748b'];
    return sources.map((s, i) => ({
      label: s.source,
      percentage: s.pct,
      color: colors[i % colors.length],
    }));
  }, [sources]);

  // Filtered & Paginated Orders
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return currentOrders
      .filter((o) => {
        const matchesQuery =
          !q ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          (o.source && o.source.toLowerCase().includes(q));
        const matchesStatus = selectedStatus === 'All' || o.status === selectedStatus;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortField === 'total') return Number(b.total) - Number(a.total);
        if (sortField === 'items') return b.itemsCount - a.itemsCount;
        return new Date(b.date || '').getTime() - new Date(a.date || '').getTime();
      });
  }, [currentOrders, orderSearch, selectedStatus, sortField]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedOrders = filteredOrders.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const showFrom = filteredOrders.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const showTo = Math.min(filteredOrders.length, (safePage + 1) * PAGE_SIZE);

  const vsLastMonth = t('vsLastMonth') || 'vs last month';
  const vsLastWeek = locale === 'ar' ? 'مقارنة بالأسبوع الماضي' : 'vs last week';
  const loc = locale === 'ar' ? 'ar-SA' : 'en-US';

  // Store timeline activities
  const storeTimelineActivities = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      timeAgo: string;
      icon: any;
    }> = [];

    // Real orders
    currentOrders.slice(0, 3).forEach((ord, i) => {
      list.push({
        id: `ord-${ord.id || i}`,
        title: isAr ? 'تم استلام طلب جديد' : 'New order received',
        subtitle: `${ord.orderNumber} · ${money(Number(ord.total) || 0)} · ${ord.customerName || (isAr ? 'عميل' : 'Customer')}`,
        timeAgo: ord.date || (isAr ? 'مؤخراً' : 'Recent'),
        icon: ShoppingCart,
      });
    });

    // Real customers
    currentCustomers.slice(0, 2).forEach((cust, i) => {
      list.push({
        id: `cust-${cust.id || i}`,
        title: isAr ? 'تسجيل عميل جديد' : 'New customer registered',
        subtitle: `${cust.name} (${cust.email || cust.phone || (isAr ? 'عميل نشط' : 'Active customer')})`,
        timeAgo: cust.registeredDate || (isAr ? 'مؤخراً' : 'Recent'),
        icon: Users,
      });
    });

    // Catalog & products
    if (currentProducts.length > 0) {
      list.push({
        id: 'catalog-sync',
        title: isAr ? 'تحديث كتالوج المتجر' : 'Store catalog active',
        subtitle: isAr ? `${currentProducts.length} منتج نشط ومتاح للطلب` : `${currentProducts.length} active products ready for sale`,
        timeAgo: isAr ? 'محدث' : 'Synced',
        icon: Package,
      });
    }

    if (visitorsCount > 0) {
      list.push({
        id: 'visitors-sync',
        title: isAr ? 'زيارات المتجر' : 'Storefront visits',
        subtitle: isAr ? `${visitorsCount.toLocaleString(loc)} زيارة مسجلة للمتجر` : `${visitorsCount.toLocaleString(loc)} store visitors tracked`,
        timeAgo: isAr ? 'مباشر' : 'Live',
        icon: Eye,
      });
    }

    return list;
  }, [currentOrders, currentCustomers, currentProducts, visitorsCount, money, isAr, loc]);

  return (
    <AdminPageShell className="pb-12">
      {/* ─── Top Title & Date Bar (Unified with Master Holst Rhythm) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold"
            style={{
              background: 'color-mix(in srgb, var(--accent) 15%, var(--surface))',
              color: 'var(--accent)',
            }}
          >
            <StoreIcon className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div>
            <h1
              className="text-xl sm:text-2xl font-black tracking-tight"
              style={{ color: 'var(--text)' }}
            >
              {(isAr ? activeStore.nameAr : activeStore.nameEn) || activeStore.name} · {t('storeAdmin') || (isAr ? 'إدارة المتجر' : 'Store Admin')}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {t('dashMerchant') || (isAr ? 'التاجر' : 'Merchant')}: <span className="font-semibold">{(isAr ? activeStore.ownerAr : activeStore.ownerEn) || activeStore.owner}</span> · {t('dashCategory') || (isAr ? 'التصنيف' : 'Category')}: {(isAr ? activeStore.categoryAr : activeStore.categoryEn) || activeStore.category} · {dataSource === 'api' ? (isAr ? 'قاعدة بيانات حية' : 'Live DB') : (isAr ? 'جلسة محلية' : 'Session')}
            </p>
          </div>
        </div>

        {/* Action Controls & Date Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://giftshop-sa.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs transition-opacity hover:opacity-95 cursor-pointer"
            style={{ background: 'var(--portal-cta)' }}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>giftshop-sa.com</span>
          </a>
          <button
            type="button"
            onClick={() => onNavigateTab('storefront')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 shadow-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{t('storefrontPreview')}</span>
          </button>
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors shadow-xs"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
            <span>{dateLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 ms-1" style={{ color: 'var(--muted)' }} />
          </div>
        </div>
      </div>

      {/* ── Real Health & Action Required Diagnostics Banner ── */}
      <StoreHealthAlertBanner onNavigateTab={onNavigateTab} />

      {/* Free Plan Upgrade Prompt Banner */}
      {activeStore.plan === 'free' && !activeStore.masterGrantedPro && (
        <div
          className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)) 0%, var(--surface) 100%)',
            borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                  {locale === 'ar' ? 'أنت تعمل حالياً بالباقة المجانية' : 'You are currently on the Free Tier'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {locale === 'ar' ? 'ميزات مقيدة' : 'Limited Features'}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {locale === 'ar'
                  ? 'قم بالترقية لفتح النطاق المخصص، استضافة Hostinger المشتركة، وقوالب الثيمات الجاهزة دون عمولات إضافية.'
                  : 'Upgrade to unlock Custom Domain, Hostinger Shared Hosting, 15 Page Templates & Zero Transaction Fees.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-transform hover:scale-[1.02] cursor-pointer shrink-0"
            style={{ background: 'var(--portal-cta)' }}
          >
            {locale === 'ar' ? 'الترقية إلى الباقة الاحترافية' : 'Upgrade to Pro → Payment'}
          </button>
        </div>
      )}

      {/* ─── 2-Column Main Layout: Main Area (9 cols) + Right Rail (3 cols) ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start min-w-0">
        {/* ════ LEFT / MAIN COLUMN (9 cols) ════ */}
        <div className="xl:col-span-9 space-y-5 min-w-0">
          {/* ── 10 Metric Cards Grid ── */}
          <div className="space-y-3 sm:space-y-4">
            {/* Row 1: 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <OverviewStatCard
                label={t('dashRevenue') || 'Total Revenue'}
                value={money(liveRevenue || activeStore.revenue || 0)}
                icon={Coins}
                tone="info"
                sparkline={revenueGrowthData.length > 0 ? sparkFromSeries(revenueGrowthData) : [0, 0]}
                delta={revenueDelta}
                deltaLabel={revenueDelta !== null ? vsLastMonth : undefined}
              />
              <OverviewStatCard
                label={t('dashOrders') || 'Total Orders'}
                value={currentOrders.length.toLocaleString(loc)}
                icon={ShoppingCart}
                tone="success"
                sparkline={ordersGrowthData.length > 0 ? sparkFromSeries(ordersGrowthData) : [0, 0]}
                delta={ordersDelta}
                deltaLabel={ordersDelta !== null ? vsLastMonth : undefined}
              />
              <OverviewStatCard
                label={t('dashProducts') || 'Total Products'}
                value={currentProducts.length.toLocaleString(loc)}
                icon={Package}
                tone="violet"
                sparkline={currentProducts.length > 0 ? [Math.max(0, currentProducts.length - 1), currentProducts.length] : [0, 0]}
                delta={null}
              />
              <OverviewStatCard
                label={t('dashCustomers') || 'Total Customers'}
                value={currentCustomers.length.toLocaleString(loc)}
                icon={Users}
                tone="accent"
                sparkline={currentCustomers.length > 0 ? [Math.max(0, currentCustomers.length - 1), currentCustomers.length] : [0, 0]}
                delta={null}
              />
            </div>

            {/* Row 2: 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <OverviewStatCard
                label={t('avgOrderValue')}
                value={money(avgOrderValue)}
                icon={TrendingUp}
                tone="warn"
                sparkline={avgOrderValue > 0 ? [Math.round(avgOrderValue * 0.9), avgOrderValue] : [0, 0]}
                delta={null}
              />
              <OverviewStatCard
                label={t('storeVisitors')}
                value={visitorsCount.toLocaleString(loc)}
                icon={Eye}
                tone="info"
                sparkline={visitorsCount > 0 ? [Math.round(visitorsCount * 0.8), visitorsCount] : [0, 0]}
                delta={null}
              />
              <OverviewStatCard
                label={t('conversionRate')}
                value={conversionRateValue}
                icon={Percent}
                tone="success"
                sparkline={visitorsCount > 0 && currentOrders.length > 0 ? [0, Number(((currentOrders.length / visitorsCount) * 100).toFixed(1))] : [0, 0]}
                delta={null}
              />
              <OverviewStatCard
                label={t('attributedSales')}
                value={attributedSalesValue}
                icon={ShoppingBag}
                tone="violet"
                sparkline={currentOrders.length > 0 ? [0, 100] : [0, 0]}
                delta={null}
              />
            </div>

            {/* Row 3: 2 Cards (taking first 2 columns) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <OverviewStatCard
                label={t('pendingOrders')}
                value={pendingCount.toLocaleString(loc)}
                icon={Clock}
                tone="danger"
                sparkline={pendingCount > 0 ? [pendingCount, pendingCount] : [0, 0]}
                delta={null}
              />
              <OverviewStatCard
                label={t('activeCoupons')}
                value={activeCouponsCount.toLocaleString(loc)}
                icon={Tag}
                tone="warn"
                sparkline={activeCouponsCount > 0 ? [activeCouponsCount, activeCouponsCount] : [0, 0]}
                delta={null}
              />
            </div>
          </div>

          {/* ── Store Analytics ── */}
          <div className="u-chart-panel p-4 sm:p-5 rounded-2xl">
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {t('storeAnalytics')}
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
                    {locale === 'ar' ? 'نمو الإيرادات' : 'Revenue Growth'}
                  </span>
                  {revenueDelta !== null ? (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{
                        background: 'color-mix(in srgb, var(--tone-success) 14%, transparent)',
                        color: 'var(--tone-success)',
                      }}
                    >
                      {revenueDelta >= 0 ? `+${revenueDelta}%` : `${revenueDelta}%`}
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{
                        background: 'color-mix(in srgb, var(--tone-success) 14%, transparent)',
                        color: 'var(--tone-success)',
                      }}
                    >
                      {liveRevenue > 0 ? '+100%' : '0%'}
                    </span>
                  )}
                </div>
                <div className="text-base font-black mb-2 tabular-nums" style={{ color: 'var(--text)' }}>
                  {money(liveRevenue || activeStore.revenue || 0)}
                </div>
                <AreaChart
                  data={revenueGrowthData.length > 0 ? revenueGrowthData : [{ label: '1', value: 0 }, { label: '2', value: 0 }]}
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
                    {locale === 'ar' ? 'نمو الطلبات' : 'Orders Growth'}
                  </span>
                  {ordersDelta !== null ? (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{
                        background: 'color-mix(in srgb, var(--tone-info) 14%, transparent)',
                        color: 'var(--tone-info)',
                      }}
                    >
                      {ordersDelta >= 0 ? `+${ordersDelta}%` : `${ordersDelta}%`}
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{
                        background: 'color-mix(in srgb, var(--tone-info) 14%, transparent)',
                        color: 'var(--tone-info)',
                      }}
                    >
                      {currentOrders.length > 0 ? '+100%' : '0%'}
                    </span>
                  )}
                </div>
                <div className="text-base font-black mb-2 tabular-nums" style={{ color: 'var(--text)' }}>
                  {currentOrders.length.toLocaleString(loc)}
                </div>
                <AreaChart
                  data={ordersGrowthData.length > 0 ? ordersGrowthData : [{ label: '1', value: 0 }, { label: '2', value: 0 }]}
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
                    {locale === 'ar' ? 'نمو العملاء' : 'Customer Growth'}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: 'color-mix(in srgb, var(--tone-violet) 14%, transparent)',
                      color: 'var(--tone-violet)',
                    }}
                  >
                    {currentCustomers.length > 0 ? `+${currentCustomers.length}` : '0'}
                  </span>
                </div>
                <div className="text-base font-black mb-2 tabular-nums" style={{ color: 'var(--text)' }}>
                  {currentCustomers.length.toLocaleString(loc)}
                </div>
                <AreaChart
                  data={
                    currentCustomers.length > 0
                      ? [
                          { label: '1', value: Math.max(0, currentCustomers.length - 1) },
                          { label: '2', value: currentCustomers.length },
                        ]
                      : [{ label: '1', value: 0 }, { label: '2', value: 0 }]
                  }
                  color="#8b5cf6"
                  fillGradient={['#8b5cf6', '#6d28d9']}
                  height={60}
                  prefix=""
                />
              </div>

              {/* 4. Conversion & Traffic */}
              <div
                className="p-3.5 rounded-xl border min-w-0"
                style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    {locale === 'ar' ? 'نمو الزيارات' : 'Traffic Growth'}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: 'color-mix(in srgb, var(--tone-warn) 14%, transparent)',
                      color: 'var(--tone-warn)',
                    }}
                  >
                    {visitorsCount > 0 ? `+${visitorsCount}` : '0'}
                  </span>
                </div>
                <div className="text-base font-black mb-2 tabular-nums" style={{ color: 'var(--text)' }}>
                  {visitorsCount.toLocaleString(loc)}
                </div>
                <AreaChart
                  data={
                    visitorsCount > 0
                      ? [
                          { label: '1', value: Math.round(visitorsCount * 0.8) },
                          { label: '2', value: visitorsCount },
                        ]
                      : [{ label: '1', value: 0 }, { label: '2', value: 0 }]
                  }
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
            {/* 1. Category Distribution */}
            <div className="u-chart-panel p-4 sm:p-5 flex flex-col justify-between rounded-2xl">
              <div>
                <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>
                  {locale === 'ar' ? 'تفصيل الكتالوج' : 'Catalog Breakdown'}
                </h3>
              </div>
              <DonutChart
                segments={productPerformanceSegments}
                centerLabel={locale === 'ar' ? 'إجمالي المنتجات' : 'Total SKUs'}
                centerValue={String(currentProducts.length)}
                size={160}
              />
            </div>

            {/* 2. Order Acquisition Channels (Cylinders) */}
            <div className="u-chart-panel p-4 sm:p-5 flex flex-col justify-between rounded-2xl">
              <div>
                <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>
                  {locale === 'ar' ? 'قنوات استقطاب الطلبات' : 'Channel Attribution'}
                </h3>
              </div>
              {cylinderSourceItems.length > 0 ? (
                <CylinderBarChart items={cylinderSourceItems} height={140} />
              ) : (
                <div className="h-[140px] flex items-center justify-center text-xs text-center" style={{ color: 'var(--muted)' }}>
                  {locale === 'ar' ? 'لا توجد بيانات قنوات بعد' : 'No channel attribution data yet'}
                </div>
              )}
            </div>

            {/* 3. Sales Trend */}
            <div className="u-chart-panel p-4 sm:p-5 flex flex-col justify-between rounded-2xl">
              <div>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {locale === 'ar' ? 'أداء المبيعات' : 'Sales Performance'}
                  </h3>
                  <div
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs text-white"
                    style={{ background: '#004d5a' }}
                  >
                    {money(liveRevenue || activeStore.revenue || 0)} <span className="opacity-75 font-normal">/ {locale === 'ar' ? 'الذروة' : 'Peak'}</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 min-w-0">
                <AreaChart
                  data={
                    revenueGrowthData.length > 1
                      ? revenueGrowthData
                      : [
                          { label: '1', value: 0 },
                          { label: '2', value: liveRevenue || activeStore.revenue || 0 },
                        ]
                  }
                  color="#00b4d8"
                  fillGradient={['#00b4d8', '#0077b6']}
                  height={140}
                  prefix="SAR "
                  showTooltip={true}
                />
              </div>
            </div>
          </div>

          {/* ── Store Orders Table ── */}
          <div className="u-panel p-4 sm:p-5 overflow-hidden rounded-2xl" data-panel="store-orders">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {isAr ? 'أحدث الطلبات' : 'Recent Orders'}
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
                    placeholder={isAr ? 'بحث في الطلبات...' : 'Search orders...'}
                    value={orderSearch}
                    onChange={(e) => {
                      setOrderSearch(e.target.value);
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
                  onClick={() => {
                    setSortField((f) => (f === 'date' ? 'total' : f === 'total' ? 'items' : 'date'));
                    setPage(0);
                  }}
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
                  onClick={() => onNavigateTab('orders')}
                  className="px-3.5 py-1.5 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إدارة الطلبات' : 'Manage Orders'}</span>
                </button>
              </div>
            </div>

            {showFilters ? (
              <div className="mb-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(0);
                  }}
                  className="px-2.5 py-1.5 text-xs rounded-lg border"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                >
                  <option value="All">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                  <option value="pending">{isAr ? 'بانتظار التأكيد' : 'Pending'}</option>
                  <option value="processing">{isAr ? 'قيد التنفيذ' : 'Processing'}</option>
                  <option value="delivered">{isAr ? 'تم التوصيل' : 'Delivered'}</option>
                  <option value="cancelled">{isAr ? 'ملغي' : 'Cancelled'}</option>
                </select>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs min-w-[740px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    {[
                      [isAr ? 'رقم الطلب' : 'Order Number', 'text-start'],
                      [isAr ? 'العميل' : 'Customer', 'text-start'],
                      [isAr ? 'قناة البيع' : 'Source Channel', 'text-start'],
                      [isAr ? 'طريقة الدفع' : 'Payment', 'text-start'],
                      [isAr ? 'المنتجات' : 'Items', 'text-end'],
                      [isAr ? 'الإجمالي' : 'Total Amount', 'text-end'],
                      [isAr ? 'الحالة' : 'Status', 'text-center'],
                      [isAr ? 'التاريخ' : 'Date', 'text-start'],
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
                  {pagedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'لا توجد طلبات تطابق الفلتر المحدد.' : 'No orders matching current filter.'}
                      </td>
                    </tr>
                  ) : (
                    pagedOrders.map((ord) => {
                      const srcTone = sourceTone(ord.source || 'Unknown');
                      return (
                        <tr key={ord.id} className="hover:[background:var(--hover-bg)] transition-colors">
                          <td className="py-3 px-2 font-mono font-bold" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                            {ord.orderNumber}
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>
                            <div className="font-semibold" style={{ color: 'var(--text)' }}>{ord.customerName}</div>
                            <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{ord.customerPhone}</div>
                          </td>
                          <td className="py-3 px-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                              style={{
                                background: `color-mix(in srgb, ${srcTone.accent} 12%, var(--surface))`,
                                color: srcTone.accent,
                                borderColor: `color-mix(in srgb, ${srcTone.accent} 28%, var(--border))`,
                              }}
                            >
                              {ord.source || (isAr ? 'مباشر' : 'Direct')}
                            </span>
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                            {ord.paymentMethod}
                          </td>
                          <td className="py-3 px-2 text-end tabular-nums font-medium" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                            {ord.itemsCount}
                          </td>
                          <td className="py-3 px-2 text-end font-bold tabular-nums whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                            {money(Number(ord.total))}
                          </td>
                          <td className="py-3 px-2 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize"
                              style={statusChipStyle(ord.status)}
                            >
                              {isAr
                                ? ord.status === 'pending'
                                  ? 'بانتظار التأكيد'
                                  : ord.status === 'processing'
                                    ? 'قيد التنفيذ'
                                    : ord.status === 'delivered'
                                      ? 'تم التوصيل'
                                      : ord.status === 'cancelled'
                                        ? 'ملغي'
                                        : ord.status
                                : ord.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap text-[11px]" style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                            {ord.date}
                          </td>
                          <td className="py-3 px-2 text-end" style={{ borderBottom: '1px solid var(--border)' }}>
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onNavigateTab('orders')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border inline-flex items-center gap-1 shadow-xs"
                                style={{
                                  background: 'var(--surface)',
                                  borderColor: 'var(--border)',
                                  color: 'var(--text)',
                                }}
                              >
                                <span>{isAr ? 'تفاصيل' : 'Details'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? `عرض ${showFrom}–${showTo} من أصل ${filteredOrders.length} طلب`
                  : `Showing ${showFrom}–${showTo} of ${filteredOrders.length} orders`}
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
          {/* ── 1. Storefront Quick Launch Card ── */}
          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden shadow-md"
            style={{
              background: 'linear-gradient(145deg, #02383e 0%, #065b63 50%, #0a7c85 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div className="relative z-10">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/15 text-[#98d8d0]">
                {t('liveStorefront')}
              </span>
              <h3 className="text-base font-extrabold text-white mt-1.5">
                {(isAr ? activeStore.nameAr : activeStore.nameEn) || activeStore.name}
              </h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#b8e4dc' }}>
                {t('liveStorefrontDesc')}
              </p>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onNavigateTab('storefront')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all hover:bg-emerald-50"
                  style={{ background: '#ffffff', color: '#04222b' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" style={{ color: '#0d9488' }} />
                  <span>{t('previewStore')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('products')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-white/25 hover:bg-white/10 transition-colors cursor-pointer text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('addSku')}</span>
                </button>
              </div>
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
                <path d="M125 45 C120 30 110 32 105 38 C115 35 120 40 125 45 Z" fill="#022e33" opacity="0.6" />
                <path d="M132 50 C125 35 135 28 138 32 C135 40 133 45 132 50 Z" fill="#022e33" opacity="0.6" />
                <path d="M128 45 L126 70" stroke="#022e33" strokeWidth="2" opacity="0.6" />
                <rect x="25" y="38" width="85" height="48" rx="6" fill="#004d5a" />
                <rect x="28" y="41" width="79" height="42" rx="4" fill="#065b63" />
                <rect x="35" y="32" width="65" height="12" rx="3" fill="#00353d" />
                <rect x="42" y="36" width="30" height="4" rx="2" fill="#5eead4" />
                <path d="M22 44 L113 44 L107 54 L18 54 Z" fill="#ffffff" />
                <path d="M22 44 L37 44 L33 54 L18 54 Z" fill="#0d9488" />
                <path d="M52 44 L67 44 L63 54 L48 54 Z" fill="#0d9488" />
                <path d="M82 44 L97 44 L93 54 L78 54 Z" fill="#0d9488" />
                <path d="M105 44 L113 44 L107 54 L101 54 Z" fill="#0d9488" />
                <rect x="34" y="58" width="34" height="24" rx="3" fill="#022e33" stroke="#5eead4" strokeWidth="1" />
                <rect x="74" y="58" width="26" height="28" rx="3" fill="#002b33" stroke="#2dd4bf" strokeWidth="1" />
                <circle cx="94" cy="72" r="1.5" fill="#5eead4" />
                <rect x="23" y="76" width="8" height="10" rx="2" fill="#0f766e" />
                <circle cx="27" cy="74" r="5" fill="#34d399" />
                <rect x="104" y="76" width="8" height="10" rx="2" fill="#0f766e" />
                <circle cx="108" cy="74" r="5" fill="#34d399" />
              </svg>
            </div>
          </div>

          {/* ── 2. Recent Store Activity Timeline Card ── */}
          <div className="u-panel p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {t('recentStoreActivity')}
                </h3>
              </div>
              <button
                type="button"
                className="text-xs font-semibold hover:underline cursor-pointer"
                style={{ color: 'var(--accent)' }}
                onClick={() => {
                  document
                    .querySelector('[data-panel="store-orders"]')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('viewAll')}
              </button>
            </div>

            {/* Vertical timeline with connected line */}
            {storeTimelineActivities.length === 0 ? (
              <div className="py-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد أنشطة مسجلة بعد للمتجر.' : 'No recent activities recorded for this store.'}
              </div>
            ) : (
              <div className="relative">
                <div
                  className="absolute start-4 top-3 bottom-5 w-px"
                  style={{ background: 'var(--border)' }}
                />

                <div className="space-y-4 relative">
                  {storeTimelineActivities.map((act) => {
                    const ItemIcon = act.icon || Clock;
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

      {/* Upgrade to Pro Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-950 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-900 rounded-xl border border-emerald-700">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </span>
                <div>
                  <h3 className="font-black text-base">
                    {locale === 'ar' ? 'ترقية المتجر إلى باقة Pro' : 'Upgrade to Pro Merchant'}
                  </h3>
                  <p className="text-[11px] text-emerald-300">
                    {locale === 'ar' ? 'استضافة Hostinger المشتركة + جميع الميزات الملكية' : 'Hostinger Shared Hosting + All 15 Page Templates'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Pro Merchant Tier</span>
                  <span className="text-slate-500 text-[11px]">Billed monthly · Cancel anytime</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-800">{money(99)}</span>
                  <span className="text-[10px] text-slate-500 block">/ month</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Included in Pro Plan:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Custom Domain Connection</div>
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Hostinger Shared Hosting (50GB)</div>
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> 4 Homepage Templates</div>
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> 15 Inner Page Templates</div>
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Free SSL & Automated Backups</div>
                  <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Zero Transaction Fees</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Simulated SaaS Payment Gateway: payment is automatically cleared and logged to Master Audit logs.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingUpgrade}
                  onClick={handleUpgradeToPro}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold shadow-xs transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
                >
                  {isProcessingUpgrade ? (
                    <span>Processing Payment…</span>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Pay {money(99)} & Activate Pro</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
};
