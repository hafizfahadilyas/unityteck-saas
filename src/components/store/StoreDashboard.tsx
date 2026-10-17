import React, { useMemo, useState, lazy, Suspense, useRef, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  useNotifications,
  IssuesSidebar,
  NotificationsMain,
  PaginatedNotifications,
  UrgentBottomBar,
  DateRangeFilter,
  useDateRange,
} from '../../notification-system';
import { DashboardOrdersTable } from './DashboardOrdersTable';
import { CreateStoreOrderModal } from './CreateStoreOrderModal';

const NotificationCenter = lazy(() =>
  import('../../notification-system/components/NotificationCenter').then((m) => ({
    default: m.NotificationCenter,
  })),
);
import { AreaChart } from '../common/AreaChart';
import { DonutChart } from '../common/DonutChart';
import { CylinderBarChart } from '../common/CylinderBarChart';
import { OverviewStatCard } from '../common/OverviewStatCard';
import { StoreHealthAlertBanner } from '../common/StoreHealthAlertBanner';
import { ConnectedWorkspaceBanner } from '../common/ConnectedWorkspaceBanner';
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
  Palette,
  ReceiptText,
  Sliders,
} from 'lucide-react';
import { useToast } from '../common/ToastProvider';
import { preloadVisualThemeBuilder } from './visualBuilder/preloadVisualBuilder';
import { getProductDisplayCategory, getProductDisplayName, getStoreDisplayName } from '../../utils/storeLocalization';
import {
  type DateRangeKey,
  aggregateOrderSources,
  revenueByDate,
  ordersCountByDate,
  sparkFromSeries,
  rangeBounds,
  statusChipStyle,
  sourceTone,
  filterOrdersByRange,
  parseOrderDate,
} from '../../utils/liveSeries';

interface StoreDashboardProps {
  onNavigateTab: (tab: string) => void;
  onCustomizeTheme?: () => void;
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

export const StoreDashboard: React.FC<StoreDashboardProps> = ({ onNavigateTab, onCustomizeTheme }) => {
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
    addOrder,
  } = useTenant();
  const { money, amount, t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const {
    notifications,
    zone1Items,
    zone2Items,
    zone3Items,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    snoozeNotification,
    handleAction,
  } = useNotifications();

  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const universalDateRange = useDateRange();
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
  const [showCustomAnalyticsPicker, setShowCustomAnalyticsPicker] = useState(false);
  const [customFromDate, setCustomFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customToDate, setCustomToDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const customAnalyticsPickerRef = useRef<HTMLDivElement>(null);

  const handleApplyCustomDateRange = (from?: string, to?: string) => {
    const f = from || customFromDate;
    const t = to || customToDate;
    if (!f || !t) return;
    const dFrom = new Date(f + 'T00:00:00');
    const dTo = new Date(t + 'T23:59:59');
    let startStr = f;
    let endStr = t;
    if (dFrom.getTime() > dTo.getTime()) {
      startStr = t;
      endStr = f;
    }
    setCustomFromDate(startStr);
    setCustomToDate(endStr);
    setDateRange('all');
    setShowCustomAnalyticsPicker(false);
    toast(
      locale === 'ar'
        ? `تم تطبيق النطاق المخصص: ${startStr} إلى ${endStr}`
        : `Custom date range applied: ${startStr} to ${endStr}`,
      'info',
    );
  };

  const handleResetDateRange = () => {
    const d = new Date();
    const toStr = d.toISOString().split('T')[0];
    d.setDate(d.getDate() - 29);
    const fromStr = d.toISOString().split('T')[0];
    setCustomFromDate(fromStr);
    setCustomToDate(toStr);
    setDateRange('month');
    setShowCustomAnalyticsPicker(false);
    toast(
      locale === 'ar'
        ? 'تمت إعادة ضبط الفلتر الزمني إلى آخر 30 يوماً'
        : 'Date filter reset to Last 30 Days',
      'info',
    );
  };

  // Close custom picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customAnalyticsPickerRef.current &&
        !customAnalyticsPickerRef.current.contains(e.target as Node)
      ) {
        setShowCustomAnalyticsPicker(false);
      }
    };
    if (showCustomAnalyticsPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomAnalyticsPicker]);

  // Month and Year string for Monthly Summary Card (Image 2)
  const currentMonthYear = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [locale]);

  // Dynamic analytics orders filtered by dateRange or custom date range
  const analyticsOrders = useMemo(() => {
    return filterOrdersByRange(currentOrders, dateRange, customFromDate, customToDate);
  }, [currentOrders, dateRange, customFromDate, customToDate]);

  const analyticsRevenue = useMemo(() => {
    const sum = analyticsOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    if (analyticsOrders.length > 0 || currentOrders.length > 0) return sum;
    if (dateRange === 'all' || dateRange === 'year' || dateRange === 'month') return Number(activeStore.revenue) || 0;
    return 0;
  }, [analyticsOrders, currentOrders.length, dateRange, activeStore.revenue]);

  const analyticsOrdersCount = analyticsOrders.length;

  const analyticsCustomersCount = useMemo(() => {
    if (analyticsOrders.length > 0) {
      const customerSet = new Set<string>();
      analyticsOrders.forEach((o) => {
        if ((o as any).customerId) customerSet.add((o as any).customerId);
        else if (o.customerEmail) customerSet.add(o.customerEmail);
        else if (o.customerName) customerSet.add(o.customerName);
      });
      return customerSet.size > 0 ? customerSet.size : analyticsOrders.length;
    }
    return currentOrders.length > 0 ? 0 : (dateRange === 'all' || dateRange === 'month' ? currentCustomers.length : 0);
  }, [analyticsOrders, currentOrders.length, currentCustomers.length, dateRange]);

  const analyticsVisitorsCount = useMemo(() => {
    const baseVisitors = Number(activeStore.visitorsCount) || 0;
    if (dateRange === 'today' || dateRange === 'yesterday') return Math.max(1, Math.round(baseVisitors / 30));
    if (dateRange === 'week') return Math.max(1, Math.round(baseVisitors / 4));
    if (dateRange === 'month') return baseVisitors;
    if (dateRange === 'year') return baseVisitors * 12;
    if (dateRange === 'all') {
      if (customFromDate && customToDate) {
        const fromT = new Date(customFromDate).getTime();
        const toT = new Date(customToDate).getTime();
        const diffDays = Math.max(
          1,
          Math.round(Math.abs(toT - fromT) / (1000 * 60 * 60 * 24)) + 1,
        );
        return Math.round(baseVisitors * (diffDays / 30));
      }
      return baseVisitors;
    }
    return baseVisitors;
  }, [activeStore.visitorsCount, dateRange, customFromDate, customToDate]);

  const analyticsRevenueGrowthData = useMemo(() => {
    let days = 30;
    if (dateRange === 'today' || dateRange === 'yesterday') days = 1;
    else if (dateRange === 'week') days = 7;
    else if (dateRange === 'month') days = 30;
    else if (dateRange === 'year') days = 90;
    else if (dateRange === 'all' && customFromDate && customToDate) {
      const fromT = new Date(customFromDate).getTime();
      const toT = new Date(customToDate).getTime();
      days = Math.max(1, Math.round(Math.abs(toT - fromT) / (1000 * 60 * 60 * 24)) + 1);
    }
    return revenueByDate(analyticsOrders, Math.min(days, 30));
  }, [analyticsOrders, dateRange, customFromDate, customToDate]);

  const analyticsOrdersGrowthData = useMemo(() => {
    let days = 30;
    if (dateRange === 'today' || dateRange === 'yesterday') days = 1;
    else if (dateRange === 'week') days = 7;
    else if (dateRange === 'month') days = 30;
    else if (dateRange === 'year') days = 90;
    else if (dateRange === 'all' && customFromDate && customToDate) {
      const fromT = new Date(customFromDate).getTime();
      const toT = new Date(customToDate).getTime();
      days = Math.max(1, Math.round(Math.abs(toT - fromT) / (1000 * 60 * 60 * 24)) + 1);
    }
    return ordersCountByDate(analyticsOrders, Math.min(days, 30));
  }, [analyticsOrders, dateRange, customFromDate, customToDate]);

  const analyticsRevenueDelta = seriesDelta(analyticsRevenueGrowthData);
  const analyticsOrdersDelta = seriesDelta(analyticsOrdersGrowthData);

  const analyticsEstimatedProfit = Math.round(analyticsRevenue * 0.35);

  const analyticsConversionRate = useMemo(() => {
    if (!analyticsVisitorsCount || analyticsVisitorsCount <= 0) return '0%';
    const rate = ((analyticsOrdersCount / analyticsVisitorsCount) * 100).toFixed(1);
    return `${rate}%`;
  }, [analyticsVisitorsCount, analyticsOrdersCount]);

  const analyticsPeriodLabel = useMemo(() => {
    if (dateRange === 'today') return isAr ? 'اليوم' : 'Today';
    if (dateRange === 'yesterday') return isAr ? 'أمس' : 'Yesterday';
    if (dateRange === 'week') return isAr ? 'هذا الأسبوع' : 'This Week';
    if (dateRange === 'month') return currentMonthYear;
    if (dateRange === 'year') return isAr ? 'هذه السنة' : 'This Year';
    if (dateRange === 'all') {
      if (customFromDate && customToDate) {
        return `${customFromDate} – ${customToDate}`;
      }
      return isAr ? 'كل الأوقات (مخصص)' : 'All Time (Custom)';
    }
    return currentMonthYear;
  }, [dateRange, currentMonthYear, customFromDate, customToDate, isAr]);

  // Monthly stats for Monthly Summary Card (Image 2)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthOrders = currentOrders.filter((o) => {
      try {
        const d = new Date(o.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      } catch {
        return true;
      }
    });

    const activeList = monthOrders.length > 0 ? monthOrders : currentOrders;
    const salesTotal = activeList.reduce((s, o) => s + (Number(o.total) || 0), 0) || (activeStore.revenue ? Number(activeStore.revenue) : 0);
    const ordersTotal = activeList.length;
    const visitsTotal = Number(activeStore.visitorsCount) || 0;
    const estimatedProfit = Math.round(salesTotal * 0.35);

    return {
      sales: salesTotal,
      orders: ordersTotal,
      visits: visitsTotal,
      estimatedProfit,
    };
  }, [currentOrders, activeStore.revenue, activeStore.visitorsCount]);

  // Universal date range filtering for orders & metrics
  const rangeOrders = useMemo(() => {
    if (!universalDateRange.isFiltered) return currentOrders;
    const filtered = currentOrders.filter((ord) => {
      try {
        const d = new Date(ord.date);
        return d >= universalDateRange.from && d <= universalDateRange.to;
      } catch {
        return true;
      }
    });
    return filtered.length > 0 ? filtered : currentOrders;
  }, [currentOrders, universalDateRange.from, universalDateRange.to, universalDateRange.isFiltered]);

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
    () => rangeOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
    [rangeOrders, cacheEpoch],
  );

  const pendingCount = useMemo(
    () => rangeOrders.filter((o) => o.status === 'pending').length,
    [rangeOrders, cacheEpoch],
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
    return entries.map(([rawCat, n], i) => ({
      label: getProductDisplayCategory(rawCat, locale),
      value: Math.round((n / total) * 100),
      color: colors[i % colors.length],
    }));
  }, [currentProducts, locale]);

  // Order sources distribution cylinders
  const sources = useMemo(
    () => aggregateOrderSources(analyticsOrders.length > 0 ? analyticsOrders : currentOrders).slice(0, 4),
    [analyticsOrders, currentOrders, cacheEpoch],
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

        {/* Top Quick Actions (Direct access to Theme Settings, Invoices & Builder) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigateTab('themes')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs border hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
              borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
              color: 'var(--accent)',
            }}
            title={isAr ? 'الانتقال إلى إعدادات الثيم والواجهة (١٨ شاشة)' : 'Open Theme Settings (18 Sections)'}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعدادات الثيم' : 'Theme Settings'}</span>
          </button>

          {onCustomizeTheme && (
            <button
              type="button"
              onClick={onCustomizeTheme}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs border hover:opacity-90 active:scale-[0.98] text-emerald-600 dark:text-emerald-400"
              style={{
                background: 'color-mix(in srgb, #10b981 10%, var(--surface))',
                borderColor: 'color-mix(in srgb, #10b981 25%, var(--border))',
              }}
              title={isAr ? 'فتح محرر الثيم والصفحات المباشر' : 'Open Live Page Builder'}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{isAr ? 'محرر الصفحات' : 'Page Builder'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('invoices')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs border hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            title={isAr ? 'عرض فواتير المتجر الضريبية' : 'View Store Invoices'}
          >
            <ReceiptText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'الفواتير' : 'Invoices'}</span>
          </button>
        </div>
      </div>

      {/* ── Real Health & Action Required Diagnostics Banner ── */}
      <StoreHealthAlertBanner onNavigateTab={onNavigateTab} />

      {/* ── Connected Local Project Workspace Hub ── */}
      <ConnectedWorkspaceBanner page="dashboard" onNavigateTab={onNavigateTab} />

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

          {/* ── Store Analytics (Combined Live Analytics & Period Summary) ── */}
          <div
            className="u-chart-panel p-4 sm:p-5 rounded-2xl border transition-all relative"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-200/60 dark:border-teal-800/40">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-tight text-slate-950 dark:text-white">
                    {t('storeAnalytics') || (isAr ? 'تحليلات المتجر' : 'Store Analytics')}
                  </h3>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    {analyticsPeriodLabel} · {isAr ? 'بيانات حية متصلة بالقاعدة' : 'Live database synced'}
                  </span>
                </div>
              </div>

              {/* Period Tabs & Custom Datepicker Anchor */}
              <div className="relative flex items-center gap-1">
                <div
                  className="flex items-center gap-1 p-1 rounded-xl flex-wrap"
                  style={{ background: 'var(--hover-bg)' }}
                  role="tablist"
                >
                  {RANGE_TABS.map(({ key, label }) => {
                    const isSelected = dateRange === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => {
                          setDateRange(key);
                          if (key === 'all') {
                            setShowCustomAnalyticsPicker((prev) => !prev);
                          } else {
                            setShowCustomAnalyticsPicker(false);
                          }
                        }}
                        className="px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                        style={
                          isSelected
                            ? {
                                background: '#00383b',
                                color: '#ffffff',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                              }
                            : { color: 'var(--text)' }
                        }
                      >
                        {key === 'all' && <Calendar className="w-3.5 h-3.5" />}
                        {label}
                        {key === 'all' && <ChevronDown className={`w-3 h-3 transition-transform ${showCustomAnalyticsPicker ? 'rotate-180' : ''}`} />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Datepicker Popover */}
                {showCustomAnalyticsPicker && (
                  <div
                    ref={customAnalyticsPickerRef}
                    className="absolute end-0 top-full mt-2 w-72 sm:w-80 p-4 rounded-2xl border shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span className="text-xs font-black text-slate-950 dark:text-white">
                          {isAr ? 'تخصيص نطاق التاريخ' : 'Custom Date Range'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomAnalyticsPicker(false)}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div className="mb-3">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                        {isAr ? 'اختصارات سريعة' : 'Quick Presets'}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          {
                            label: isAr ? 'آخر 7 أيام' : 'Last 7 Days',
                            action: () => {
                              const d = new Date();
                              const toStr = d.toISOString().split('T')[0];
                              d.setDate(d.getDate() - 6);
                              const fromStr = d.toISOString().split('T')[0];
                              handleApplyCustomDateRange(fromStr, toStr);
                            },
                          },
                          {
                            label: isAr ? 'آخر 30 يوم' : 'Last 30 Days',
                            action: () => {
                              const d = new Date();
                              const toStr = d.toISOString().split('T')[0];
                              d.setDate(d.getDate() - 29);
                              const fromStr = d.toISOString().split('T')[0];
                              handleApplyCustomDateRange(fromStr, toStr);
                            },
                          },
                          {
                            label: isAr ? 'هذا الشهر' : 'This Month',
                            action: () => {
                              const d = new Date();
                              const toStr = d.toISOString().split('T')[0];
                              const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
                              const fromStr = firstDay.toISOString().split('T')[0];
                              handleApplyCustomDateRange(fromStr, toStr);
                            },
                          },
                          {
                            label: isAr ? 'كل الأوقات' : 'All Time',
                            action: () => {
                              const toStr = new Date().toISOString().split('T')[0];
                              handleApplyCustomDateRange('2024-01-01', toStr);
                            },
                          },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={preset.action}
                            className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border text-start hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-500 transition-all text-slate-800 dark:text-slate-200 cursor-pointer"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dual Date Pickers */}
                    <div className="space-y-2 mb-4">
                      <div>
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-200 block mb-1">
                          {isAr ? 'من تاريخ:' : 'From Date:'}
                        </label>
                        <input
                          type="date"
                          value={customFromDate}
                          onChange={(e) => setCustomFromDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border bg-white dark:bg-slate-900 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                          style={{ borderColor: 'var(--border)' }}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-200 block mb-1">
                          {isAr ? 'إلى تاريخ:' : 'To Date:'}
                        </label>
                        <input
                          type="date"
                          value={customToDate}
                          onChange={(e) => setCustomToDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border bg-white dark:bg-slate-900 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                          style={{ borderColor: 'var(--border)' }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                      <button
                        type="button"
                        onClick={() => handleApplyCustomDateRange(customFromDate, customToDate)}
                        className="flex-1 py-1.5 text-xs font-black rounded-xl bg-teal-800 hover:bg-teal-900 text-white transition-all shadow-sm cursor-pointer text-center"
                      >
                        {isAr ? 'تطبيق الفلتر' : 'Apply Filter'}
                      </button>
                      <button
                        type="button"
                        onClick={handleResetDateRange}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {isAr ? 'إعادة ضبط' : 'Reset'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4 Analytics Growth Cards (Wide, responsive, high-contrast with Icons) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4">
              {/* 1. Revenue Growth */}
              <div
                className="p-4 rounded-2xl border min-w-0 transition-all hover:shadow-xs flex flex-col justify-between"
                style={{
                  background: 'color-mix(in srgb, var(--surface) 92%, #0d9488 8%)',
                  borderColor: 'color-mix(in srgb, var(--border) 80%, #0d9488 20%)',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 flex items-center justify-center shrink-0 border border-teal-300 dark:border-teal-700">
                      <Coins className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-slate-950 dark:text-slate-100 whitespace-nowrap">
                      {locale === 'ar' ? 'نمو الإيرادات' : 'Revenue Growth'}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-black px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 border border-teal-300 dark:border-teal-700 shrink-0"
                  >
                    {analyticsRevenueDelta !== null ? (analyticsRevenueDelta >= 0 ? `+${analyticsRevenueDelta}%` : `${analyticsRevenueDelta}%`) : (analyticsRevenue > 0 ? '+100%' : '0%')}
                  </span>
                </div>
                <div className="text-xl font-black tracking-tight mb-3 tabular-nums text-slate-950 dark:text-white">
                  {money(analyticsRevenue)}
                </div>
                {/* Glowing Teal Line with Endpoints */}
                <div className="relative h-2 flex items-center pt-1">
                  <div className="w-full h-[2.5px] bg-gradient-to-r from-teal-400 to-teal-500 rounded-full" />
                  <div className="absolute start-0 w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.9)] ring-2 ring-teal-100 dark:ring-teal-950" />
                  <div className="absolute end-0 w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.9)] ring-2 ring-teal-100 dark:ring-teal-950" />
                </div>
              </div>

              {/* 2. Orders Growth */}
              <div
                className="p-4 rounded-2xl border min-w-0 transition-all hover:shadow-xs flex flex-col justify-between"
                style={{
                  background: 'color-mix(in srgb, var(--surface) 92%, #0284c7 8%)',
                  borderColor: 'color-mix(in srgb, var(--border) 80%, #0284c7 20%)',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 flex items-center justify-center shrink-0 border border-sky-300 dark:border-sky-700">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-slate-950 dark:text-slate-100 whitespace-nowrap">
                      {locale === 'ar' ? 'نمو الطلبات' : 'Orders Growth'}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-black px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 border border-sky-300 dark:border-sky-700 shrink-0"
                  >
                    {analyticsOrdersDelta !== null ? (analyticsOrdersDelta >= 0 ? `+${analyticsOrdersDelta}%` : `${analyticsOrdersDelta}%`) : (analyticsOrdersCount > 0 ? '+100%' : '0%')}
                  </span>
                </div>
                <div className="text-xl font-black tracking-tight mb-3 tabular-nums text-slate-950 dark:text-white">
                  {analyticsOrdersCount.toLocaleString(loc)}
                </div>
                {/* Glowing Sky Blue Line with Endpoints */}
                <div className="relative h-2 flex items-center pt-1">
                  <div className="w-full h-[2.5px] bg-gradient-to-r from-sky-400 to-sky-500 rounded-full" />
                  <div className="absolute start-0 w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.9)] ring-2 ring-sky-100 dark:ring-sky-950" />
                  <div className="absolute end-0 w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.9)] ring-2 ring-sky-100 dark:ring-sky-950" />
                </div>
              </div>

              {/* 3. Customer Growth */}
              <div
                className="p-4 rounded-2xl border min-w-0 transition-all hover:shadow-xs flex flex-col justify-between"
                style={{
                  background: 'color-mix(in srgb, var(--surface) 92%, #7c3aed 8%)',
                  borderColor: 'color-mix(in srgb, var(--border) 80%, #7c3aed 20%)',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 flex items-center justify-center shrink-0 border border-purple-300 dark:border-purple-700">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-slate-950 dark:text-slate-100 whitespace-nowrap">
                      {locale === 'ar' ? 'نمو العملاء' : 'Customer Growth'}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-700 shrink-0"
                  >
                    {analyticsCustomersCount > 0 ? `${analyticsCustomersCount}` : '0'}
                  </span>
                </div>
                <div className="text-xl font-black tracking-tight mb-3 tabular-nums text-slate-950 dark:text-white">
                  {analyticsCustomersCount.toLocaleString(loc)}
                </div>
                {/* Glowing Purple Line with Endpoints */}
                <div className="relative h-2 flex items-center pt-1">
                  <div className="w-full h-[2.5px] bg-gradient-to-r from-purple-400 to-purple-500 rounded-full" />
                  <div className="absolute start-0 w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.9)] ring-2 ring-purple-100 dark:ring-purple-950" />
                  <div className="absolute end-0 w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.9)] ring-2 ring-purple-100 dark:ring-purple-950" />
                </div>
              </div>

              {/* 4. Traffic Growth */}
              <div
                className="p-4 rounded-2xl border min-w-0 transition-all hover:shadow-xs flex flex-col justify-between"
                style={{
                  background: 'color-mix(in srgb, var(--surface) 92%, #ea580c 8%)',
                  borderColor: 'color-mix(in srgb, var(--border) 80%, #ea580c 20%)',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700">
                      <Eye className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-slate-950 dark:text-slate-100 whitespace-nowrap">
                      {locale === 'ar' ? 'نمو الزيارات' : 'Traffic Growth'}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shrink-0"
                  >
                    {analyticsVisitorsCount > 0 ? `${analyticsVisitorsCount}` : '0'}
                  </span>
                </div>
                <div className="text-xl font-black tracking-tight mb-3 tabular-nums text-slate-950 dark:text-white">
                  {analyticsVisitorsCount.toLocaleString(loc)}
                </div>
                {/* Glowing Orange Line with Endpoints */}
                <div className="relative h-2 flex items-center pt-1">
                  <div className="w-full h-[2.5px] bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" />
                  <div className="absolute start-0 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.9)] ring-2 ring-amber-100 dark:ring-amber-950" />
                  <div className="absolute end-0 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.9)] ring-2 ring-amber-100 dark:ring-amber-950" />
                </div>
              </div>
            </div>

            {/* Bottom Reports Action Bar */}
            <div className="pt-4 mt-3 border-t flex items-center justify-between flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>{locale === 'ar' ? 'الأرباح التقديرية:' : 'Estimated Profit:'} <strong className="text-slate-950 dark:text-white font-black">{money(analyticsEstimatedProfit)}</strong></span>
                <span>·</span>
                <span>{locale === 'ar' ? 'معدل التحويل:' : 'Conversion:'} <strong className="text-slate-950 dark:text-white font-black">{analyticsConversionRate}</strong></span>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="text-xs font-black text-teal-800 hover:text-teal-950 dark:text-teal-300 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>{isAr ? 'عرض المزيد من التقارير' : 'View more reports'}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
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
                    {money(analyticsRevenue || activeStore.revenue || 0)} <span className="opacity-75 font-normal">/ {locale === 'ar' ? 'الذروة' : 'Peak'}</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 min-w-0">
                <AreaChart
                  data={
                    analyticsRevenueGrowthData.length > 1
                      ? analyticsRevenueGrowthData
                      : [
                          { label: '1', value: 0 },
                          { label: '2', value: analyticsRevenue || activeStore.revenue || 0 },
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

          {/* ── Middle Left: Recent Orders Data Table (Image 1) ── */}
          <DashboardOrdersTable
            orders={analyticsOrders}
            onNavigateTab={onNavigateTab}
            onOpenCreateOrder={() => setIsCreateOrderModalOpen(true)}
          />

          {/* ── Bottom Left: Paginated Notifications (Max 4 items per page + Tabs) ── */}
          <PaginatedNotifications
            notifications={zone2Items}
            onAction={(item) => handleAction(item, onNavigateTab)}
            onMarkRead={markAsRead}
            onDismiss={dismissNotification}
            onSnooze={snoozeNotification}
            onViewAll={() => onNavigateTab('notifications')}
          />
        </div>

        {/* ════ RIGHT COLUMN (3 cols) ════ */}
        <div className="xl:col-span-3 space-y-5 min-w-0">
          {/* ── ZONE 1: Issues Requiring Your Attention (Internal Scroll, max-h-[500px]) ── */}
          <IssuesSidebar
            issues={zone1Items}
            onSelectIssue={(item) => handleAction(item, onNavigateTab)}
            onViewAllIssues={() => onNavigateTab('notifications')}
          />

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
                  onMouseEnter={preloadVisualThemeBuilder}
                  onPointerDown={preloadVisualThemeBuilder}
                  onFocus={preloadVisualThemeBuilder}
                  onTouchStart={preloadVisualThemeBuilder}
                  onClick={() => (onCustomizeTheme ? onCustomizeTheme() : onNavigateTab('themes'))}
                  className="group relative overflow-hidden inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-lg hover:bg-emerald-50 active:scale-95 active:brightness-95 select-none"
                  style={{ background: '#ffffff', color: '#04222b' }}
                >
                  <Palette className="w-3.5 h-3.5 text-emerald-600 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <span>{isAr ? 'تخصيص الثيم وتصميم الصفحات' : 'Customize Theme'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('themes')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-white/25 hover:bg-white/10 transition-colors cursor-pointer text-white"
                >
                  <span>{isAr ? 'إدارة الثيمات' : 'Theme Manager'}</span>
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

      {/* ── ZONE 3: Urgent Action Bottom Bar (Sticky) ── */}
      <UrgentBottomBar
        urgentItems={zone3Items}
        onAction={(item) => handleAction(item, onNavigateTab)}
        onDismiss={dismissNotification}
      />

      {/* Create Order Modal */}
      {isCreateOrderModalOpen && (
        <CreateStoreOrderModal
          isOpen={isCreateOrderModalOpen}
          storeId={activeStore.id}
          storeName={activeStore.name}
          onClose={() => setIsCreateOrderModalOpen(false)}
          onCreate={(orderData) => {
            try {
              addOrder(orderData as any, activeStore.id);
              toast(
                locale === 'ar'
                  ? 'تم إنشاء الطلب الجديد وإضافته بنجاح إلى قاعدة البيانات!'
                  : 'New order created and saved to database successfully!',
                'success',
              );
              setIsCreateOrderModalOpen(false);
            } catch (err) {
              toast(
                locale === 'ar' ? 'حدث خطأ أثناء حفظ الطلب' : 'Failed to save new order',
                'error',
              );
            }
          }}
        />
      )}
    </AdminPageShell>
  );
};
