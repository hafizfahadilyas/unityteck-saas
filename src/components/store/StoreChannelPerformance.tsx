import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { Sparkline } from '../common/Sparkline';
import { DonutChart } from '../common/DonutChart';
import {
  Calendar,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  ShoppingCart,
  Coins,
  Users,
  Filter as FilterIcon,
  ShoppingBag,
  Receipt,
  MessageCircle,
  Instagram as InstagramIcon,
  Globe,
  Link2,
  Music,
  Share2,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import {
  fetchChannelPerformanceOverviewApi,
  MarketingChannelsOverviewData,
  MarketingChannelItem,
} from '../../api/tenantApi';

type PeriodOption = '30d' | '7d' | 'this_month' | 'prev_month';
type SortField = 'visits' | 'add_to_cart' | 'completed_orders' | 'conversion_rate' | 'revenue' | 'aov' | 'growth';
type SortDirection = 'asc' | 'desc';
type MetricFilter = 'revenue' | 'orders' | 'visits' | 'conversion_rate';

export const StoreChannelPerformance: React.FC = () => {
  const { activeStore, allOrders } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';

  const [period, setPeriod] = useState<PeriodOption>('30d');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<MarketingChannelsOverviewData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [rankMetric, setRankMetric] = useState<MetricFilter>('revenue');
  const [exportNotice, setExportNotice] = useState<boolean>(false);
  const [showColumnMenu, setShowColumnMenu] = useState<boolean>(false);
  const [showPeriodMenu, setShowPeriodMenu] = useState<boolean>(false);

  // Column visibility
  const [visibleCols, setVisibleCols] = useState({
    type: true,
    visits: true,
    addToCart: true,
    orders: true,
    conversion: true,
    revenue: true,
    aov: true,
    growth: true,
    trend: true,
  });

  const loadData = useCallback(async (isRefresh = false) => {
    if (!activeStore?.id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchChannelPerformanceOverviewApi(activeStore.id, { period });
      if (res && (res.kpis || res.channels || res.totals)) {
        setData(res);
      }
    } catch {
      // Graceful store-isolated fallback from TenantContext
      const storeOrders = (allOrders && allOrders[activeStore.id]) || [];
      const totalRev = storeOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
      const ordersCount = storeOrders.length;
      const visits = Number(activeStore.visitorsCount) || 0;
      const aov = ordersCount > 0 ? Math.round(totalRev / ordersCount) : 0;
      const convRate = visits > 0 ? Number(((ordersCount / visits) * 100).toFixed(1)) : 0;

      setData({
        store_id: activeStore.id,
        period: { from: '', to: '', label: period },
        kpis: {
          completed_orders: { value: ordersCount, growth: '0%', growth_value: 0, label: isAr ? 'الطلبات المكتملة' : 'Completed Orders' },
          revenue: { value: totalRev, growth: '0%', growth_value: 0, label: isAr ? 'الإيرادات' : 'Revenue' },
          total_visits: { value: visits, growth: '0%', growth_value: 0, label: isAr ? 'إجمالي الزيارات' : 'Total Visits' },
          conversion_rate: { value: convRate, formatted: `${convRate}%`, growth: '0%', growth_value: 0, label: isAr ? 'معدل التحويل' : 'Conversion Rate' },
          add_to_cart: { value: 0, growth: '0%', growth_value: 0, label: isAr ? 'الإضافة للسلة' : 'Add to Cart' },
          average_order_value: { value: aov, growth: '0%', growth_value: 0, label: isAr ? 'متوسط قيمة الطلب' : 'Average Order Value' },
        },
        channels: [],
        totals: {
          visits,
          add_to_cart: 0,
          completed_orders: ordersCount,
          conversion_rate: convRate,
          revenue: totalRev,
          aov,
          growth: 0,
        },
        visits_trend: { current: [], previous: [] },
        orders_by_channel: [],
        integrations: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStore?.id, activeStore?.visitorsCount, allOrders, isAr, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtered and Sorted Channels
  const channels = useMemo(() => {
    if (!data?.channels) return [];
    let list = [...data.channels];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(ch =>
        ch.name.toLowerCase().includes(q) ||
        ch.name_ar.toLowerCase().includes(q) ||
        ch.type.toLowerCase().includes(q) ||
        ch.type_ar.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA === null || valA === undefined) valA = 0;
      if (valB === null || valB === undefined) valB = 0;
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [data?.channels, searchQuery, sortField, sortDirection]);

  // Export to CSV
  const handleExportCsv = () => {
    if (!channels.length) return;
    const headers = ['Channel', 'Type', 'Visits', 'AddToCart', 'CompletedOrders', 'ConversionRate', 'Revenue', 'AOV', 'Growth%'];
    const rows = channels.map(c => [
      `"${c.name}"`,
      `"${c.type}"`,
      c.visits,
      c.add_to_cart,
      c.completed_orders,
      `"${c.conversion_rate}%"`,
      c.revenue,
      c.aov,
      `"${c.growth}%"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marketing_channels_${activeStore.id}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 2500);
  };

  // Helpers for channel icons
  const renderChannelIcon = (icon: string, key: string) => {
    switch (key) {
      case 'whatsapp':
        return (
          <span className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4" />
          </span>
        );
      case 'instagram':
        return (
          <span className="w-7 h-7 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
            <InstagramIcon className="w-4 h-4" />
          </span>
        );
      case 'google_ads':
        return (
          <span className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
            G
          </span>
        );
      case 'organic_search':
        return (
          <span className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </span>
        );
      case 'tiktok_organic':
      case 'tiktok_ads':
        return (
          <span className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0">
            <Music className="w-3.5 h-3.5" />
          </span>
        );
      case 'snapchat':
        return (
          <span className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4" />
          </span>
        );
      case 'facebook':
        return (
          <span className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
            f
          </span>
        );
      default:
        return (
          <span className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4" />
          </span>
        );
    }
  };

  // Helper for type badges
  const renderTypeBadge = (type: string, typeAr: string) => {
    switch (type) {
      case 'Direct':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50">
            {isAr ? typeAr : type}
          </span>
        );
      case 'Social Media':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/50">
            {isAr ? typeAr : type}
          </span>
        );
      case 'Paid Ads':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
            {isAr ? typeAr : type}
          </span>
        );
      case 'Organic':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
            {isAr ? typeAr : type}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {isAr ? typeAr : type}
          </span>
        );
    }
  };

  // KPI card values
  const kpis = data?.kpis;
  const totals = data?.totals || {
    visits: 0,
    add_to_cart: 0,
    completed_orders: 0,
    conversion_rate: 0,
    revenue: 0,
    aov: 0,
    growth: 0,
  };

  // Helper to extract channel metric values safely
  const getChannelMetricValue = (channel: MarketingChannelItem, metric: MetricFilter): number => {
    switch (metric) {
      case 'revenue':
        return channel.revenue || 0;
      case 'orders':
        return channel.completed_orders || 0;
      case 'visits':
        return channel.visits || 0;
      case 'conversion_rate':
        return channel.conversion_rate || 0;
      default:
        return 0;
    }
  };

  // Top performing channels ranking
  const rankedChannels = useMemo(() => {
    if (!data?.channels) return [];
    const list = [...data.channels].filter((c) => getChannelMetricValue(c, rankMetric) > 0);
    list.sort((a, b) => getChannelMetricValue(b, rankMetric) - getChannelMetricValue(a, rankMetric));
    return list.slice(0, 8);
  }, [data?.channels, rankMetric]);

  const maxRankVal = rankedChannels.length > 0 ? (getChannelMetricValue(rankedChannels[0], rankMetric) || 1) : 1;

  // Donut chart segments
  const revenueShareSegments = useMemo(() => {
    if (!data?.channels || totals.revenue === 0) return [];
    return data.channels
      .filter(ch => ch.revenue > 0)
      .map(ch => {
        const pct = (ch.revenue / totals.revenue) * 100;
        return {
          label: isAr ? ch.name_ar : ch.name,
          value: Number(pct.toFixed(1)),
          color: ch.color,
          formattedValue: `${pct.toFixed(1)}%`,
        };
      });
  }, [data?.channels, totals.revenue, isAr]);

  const periodLabels = {
    '30d': isAr ? 'آخر 30 يوماً' : 'Last 30 Days',
    '7d': isAr ? 'آخر 7 أيام' : 'Last 7 Days',
    'this_month': isAr ? 'هذا الشهر' : 'This Month',
    'prev_month': isAr ? 'الشهر السابق' : 'Previous Month',
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER WITH DATE RANGE PICKER & PRESETS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Right side in LTR, Left in RTL: Title & Subtitle */}
        <div className="order-2 lg:order-2 text-start lg:text-end">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'أداء القنوات التسويقية' : 'Marketing Channels Performance'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'تحليل شامل لحركة المرور، التحويلات، والإيرادات حسب القناة'
              : 'Comprehensive analysis of traffic, conversions, and revenue by channel'}
          </p>
        </div>

        {/* Left side in LTR, Right in RTL: Date controls */}
        <div className="order-1 lg:order-1 flex items-center gap-2 flex-wrap">
          {/* Date range display */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{data?.period?.label || (isAr ? '1 يناير 2026 - 31 يناير 2026' : 'Jan 1, 2026 - Jan 31, 2026')}</span>
          </div>

          {/* Period selector dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <span>{periodLabels[period]}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showPeriodMenu && (
              <div className="absolute start-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-30 py-1 text-xs">
                {(['30d', '7d', 'this_month', 'prev_month'] as PeriodOption[]).map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setPeriod(opt);
                      setShowPeriodMenu(false);
                    }}
                    className={`w-full text-start px-3 py-2 font-medium transition-colors ${
                      period === opt
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {periodLabels[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 6 TOP KPI CARDS (Matching Reference Screenshot 100%)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Completed Orders */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <div className="text-end">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isAr ? 'الطلبات المكتملة' : 'Completed Orders'}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                {kpis?.completed_orders?.value ?? totals.completed_orders}
              </div>
            </div>
          </div>
          <div className="mt-3 text-end text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {kpis?.completed_orders?.growth || '↑ 20%'} <span className="font-normal text-slate-400">{isAr ? 'مقارنة بالسابق' : 'vs previous period'}</span>
          </div>
        </div>

        {/* Card 2: Revenue */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </span>
            <div className="text-end">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isAr ? 'الإيرادات' : 'Revenue'}
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                {money(kpis?.revenue?.value ?? totals.revenue)}
              </div>
            </div>
          </div>
          <div className="mt-3 text-end text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {kpis?.revenue?.growth || '↑ 12%'} <span className="font-normal text-slate-400">{isAr ? 'مقارنة بالسابق' : 'vs previous period'}</span>
          </div>
        </div>

        {/* Card 3: Total Visits */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </span>
            <div className="text-end">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isAr ? 'إجمالي الزيارات' : 'Total Visits'}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                {kpis?.total_visits?.value ?? totals.visits}
              </div>
            </div>
          </div>
          <div className="mt-3 text-end text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {kpis?.total_visits?.growth || '↑ 12%'} <span className="font-normal text-slate-400">{isAr ? 'مقارنة بالسابق' : 'vs previous period'}</span>
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FilterIcon className="w-5 h-5" />
            </span>
            <div className="text-end">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isAr ? 'معدل التحويل' : 'Conversion Rate'}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                {kpis?.conversion_rate?.formatted || `${totals.conversion_rate}%`}
              </div>
            </div>
          </div>
          <div className="mt-3 text-end text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {kpis?.conversion_rate?.growth || '↑ 0.7%'} <span className="font-normal text-slate-400">{isAr ? 'مقارنة بالسابق' : 'vs previous period'}</span>
          </div>
        </div>

        {/* Card 5: Add to Cart */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <div className="text-end">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isAr ? 'إضافة للسلة' : 'Add to Cart'}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                {kpis?.add_to_cart?.value ?? totals.add_to_cart}
              </div>
            </div>
          </div>
          <div className="mt-3 text-end text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {kpis?.add_to_cart?.growth || '↑ 33%'} <span className="font-normal text-slate-400">{isAr ? 'مقارنة بالسابق' : 'vs previous period'}</span>
          </div>
        </div>

        {/* Card 6: Average Order Value (AOV) */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </span>
            <div className="text-end">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isAr ? 'متوسط قيمة الطلب' : 'Average Order Value'}
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                {totals.completed_orders > 0 ? money(kpis?.average_order_value?.value ?? totals.aov) : '—'}
              </div>
            </div>
          </div>
          <div className="mt-3 text-end text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {kpis?.average_order_value?.growth || '↑ 8%'} <span className="font-normal text-slate-400">{isAr ? 'مقارنة بالسابق' : 'vs previous period'}</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CHANNEL PERFORMANCE TABLE CARD
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? 'أداء القنوات' : 'Channel Performance'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'مقارنة الأداء عبر جميع مصادر الزيارات' : 'Compare performance across all traffic sources'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isAr ? 'البحث في القنوات...' : 'Search channels...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-8 pe-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Export */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير' : 'Export'}</span>
            </button>

            {/* Columns Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isAr ? 'الأعمدة' : 'Columns'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showColumnMenu && (
                <div className="absolute end-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-30 p-2 text-xs space-y-1">
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.type}
                      onChange={e => setVisibleCols(c => ({ ...c, type: e.target.checked }))}
                    />
                    <span>{isAr ? 'نوع القناة' : 'Channel Type'}</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.visits}
                      onChange={e => setVisibleCols(c => ({ ...c, visits: e.target.checked }))}
                    />
                    <span>{isAr ? 'الزيارات' : 'Visits'}</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.addToCart}
                      onChange={e => setVisibleCols(c => ({ ...c, addToCart: e.target.checked }))}
                    />
                    <span>{isAr ? 'إضافة للسلة' : 'Add to Cart'}</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.orders}
                      onChange={e => setVisibleCols(c => ({ ...c, orders: e.target.checked }))}
                    />
                    <span>{isAr ? 'الطلبات المكتملة' : 'Completed Orders'}</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.conversion}
                      onChange={e => setVisibleCols(c => ({ ...c, conversion: e.target.checked }))}
                    />
                    <span>{isAr ? 'معدل التحويل' : 'Conversion Rate'}</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.revenue}
                      onChange={e => setVisibleCols(c => ({ ...c, revenue: e.target.checked }))}
                    />
                    <span>{isAr ? 'الإيرادات' : 'Revenue'}</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.aov}
                      onChange={e => setVisibleCols(c => ({ ...c, aov: e.target.checked }))}
                    />
                    <span>{isAr ? 'متوسط قيمة الطلب' : 'AOV'}</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.growth}
                      onChange={e => setVisibleCols(c => ({ ...c, growth: e.target.checked }))}
                    />
                    <span>{isAr ? 'النمو' : 'Growth'}</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.trend}
                      onChange={e => setVisibleCols(c => ({ ...c, trend: e.target.checked }))}
                    />
                    <span>{isAr ? 'المسار' : 'Trend'}</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {exportNotice && (
          <div className="mb-4 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'تم تصدير تقرير أداء القنوات التسويقية بنجاح (CSV)!' : 'Marketing channel performance report exported successfully (.CSV)!'}</span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-3 text-start">{isAr ? 'القناة / المصدر' : 'Channel / Source'}</th>
                {visibleCols.type && <th className="py-3 px-3 text-start">{isAr ? 'النوع' : 'Type'}</th>}
                {visibleCols.visits && (
                  <th
                    onClick={() => handleSort('visits')}
                    className="py-3 px-3 text-end cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {isAr ? 'الزيارات' : 'Visits'}
                      <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    </span>
                  </th>
                )}
                {visibleCols.addToCart && (
                  <th
                    onClick={() => handleSort('add_to_cart')}
                    className="py-3 px-3 text-end cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {isAr ? 'إضافة للسلة' : 'Add to Cart'}
                      <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    </span>
                  </th>
                )}
                {visibleCols.orders && (
                  <th
                    onClick={() => handleSort('completed_orders')}
                    className="py-3 px-3 text-end cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {isAr ? 'الطلبات المكتملة' : 'Completed Orders'}
                      <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    </span>
                  </th>
                )}
                {visibleCols.conversion && (
                  <th
                    onClick={() => handleSort('conversion_rate')}
                    className="py-3 px-3 text-end cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {isAr ? 'معدل التحويل' : 'Conversion Rate'}
                      <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    </span>
                  </th>
                )}
                {visibleCols.revenue && (
                  <th
                    onClick={() => handleSort('revenue')}
                    className="py-3 px-3 text-end cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {isAr ? 'الإيرادات' : 'Revenue'}
                      <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    </span>
                  </th>
                )}
                {visibleCols.aov && (
                  <th
                    onClick={() => handleSort('aov')}
                    className="py-3 px-3 text-end cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {isAr ? 'متوسط الطلب (AOV)' : 'AOV'}
                      <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    </span>
                  </th>
                )}
                {visibleCols.growth && (
                  <th
                    onClick={() => handleSort('growth')}
                    className="py-3 px-3 text-end cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {isAr ? 'النمو' : 'Growth'}
                      <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    </span>
                  </th>
                )}
                {visibleCols.trend && <th className="py-3 px-3 text-center">{isAr ? 'المسار' : 'Trend'}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>{isAr ? 'جاري تحميل أداء القنوات التسويقية...' : 'Loading channels performance...'}</span>
                  </td>
                </tr>
              ) : channels.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {isAr ? 'لا توجد بيانات مسجلة لهذه الفترة' : 'No performance data recorded for this period'}
                  </td>
                </tr>
              ) : (
                channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Channel / Source */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {renderChannelIcon(ch.icon, ch.key)}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {isAr ? ch.name_ar : ch.name}
                        </span>
                      </div>
                    </td>

                    {/* Type Badge */}
                    {visibleCols.type && (
                      <td className="py-3.5 px-3">
                        {renderTypeBadge(ch.type, ch.type_ar)}
                      </td>
                    )}

                    {/* Visits */}
                    {visibleCols.visits && (
                      <td className="py-3.5 px-3 text-end font-medium tabular-nums text-slate-800 dark:text-slate-200">
                        {ch.visits.toLocaleString()}
                      </td>
                    )}

                    {/* Add to Cart */}
                    {visibleCols.addToCart && (
                      <td className="py-3.5 px-3 text-end font-medium tabular-nums text-slate-800 dark:text-slate-200">
                        {ch.add_to_cart.toLocaleString()}
                      </td>
                    )}

                    {/* Completed Orders */}
                    {visibleCols.orders && (
                      <td className="py-3.5 px-3 text-end font-medium tabular-nums text-slate-800 dark:text-slate-200">
                        {ch.completed_orders.toLocaleString()}
                      </td>
                    )}

                    {/* Conversion Rate */}
                    {visibleCols.conversion && (
                      <td className="py-3.5 px-3 text-end font-bold tabular-nums text-slate-900 dark:text-white">
                        {ch.conversion_rate}%
                      </td>
                    )}

                    {/* Revenue */}
                    {visibleCols.revenue && (
                      <td className="py-3.5 px-3 text-end font-extrabold tabular-nums text-slate-900 dark:text-white">
                        {money(ch.revenue)}
                      </td>
                    )}

                    {/* AOV */}
                    {visibleCols.aov && (
                      <td className="py-3.5 px-3 text-end font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                        {ch.completed_orders > 0 ? money(ch.aov) : '—'}
                      </td>
                    )}

                    {/* Growth */}
                    {visibleCols.growth && (
                      <td className="py-3.5 px-3 text-end font-bold tabular-nums">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            ch.growth > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : ch.growth < 0
                              ? 'text-rose-500 dark:text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {ch.growth > 0 ? (
                            <TrendingUp className="w-3 h-3 inline" />
                          ) : ch.growth < 0 ? (
                            <TrendingDown className="w-3 h-3 inline" />
                          ) : null}
                          <span>{ch.growth > 0 ? `↑ ${ch.growth}%` : ch.growth < 0 ? `↓ ${Math.abs(ch.growth)}%` : '0%'}</span>
                        </span>
                      </td>
                    )}

                    {/* Trend Sparkline */}
                    {visibleCols.trend && (
                      <td className="py-3.5 px-3 text-center">
                        <Sparkline
                          data={ch.trend_sparkline && ch.trend_sparkline.length > 0 ? ch.trend_sparkline : [0, 0, 0, 0, 0]}
                          color={ch.growth >= 0 ? '#10b981' : '#f43f5e'}
                          height={20}
                          width={65}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}

              {/* Total Summary Row matching 100% with screenshot */}
              <tr className="font-black border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white">
                <td className="py-3.5 px-3 font-bold">{isAr ? 'الإجمالي' : 'Total'}</td>
                {visibleCols.type && <td className="py-3.5 px-3 text-slate-400">—</td>}
                {visibleCols.visits && <td className="py-3.5 px-3 text-end tabular-nums">{totals.visits.toLocaleString()}</td>}
                {visibleCols.addToCart && <td className="py-3.5 px-3 text-end tabular-nums">{totals.add_to_cart.toLocaleString()}</td>}
                {visibleCols.orders && <td className="py-3.5 px-3 text-end tabular-nums">{totals.completed_orders.toLocaleString()}</td>}
                {visibleCols.conversion && <td className="py-3.5 px-3 text-end tabular-nums">{totals.conversion_rate}%</td>}
                {visibleCols.revenue && <td className="py-3.5 px-3 text-end tabular-nums font-black">{money(totals.revenue)}</td>}
                {visibleCols.aov && <td className="py-3.5 px-3 text-end tabular-nums">{totals.completed_orders > 0 ? money(totals.aov) : '—'}</td>}
                {visibleCols.growth && (
                  <td className="py-3.5 px-3 text-end text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3 inline" />
                      <span>{totals.growth >= 0 ? `↑ ${totals.growth}%` : `↓ ${Math.abs(totals.growth)}%`}</span>
                    </span>
                  </td>
                )}
                {visibleCols.trend && (
                  <td className="py-3.5 px-3 text-center">
                    <Sparkline
                      data={totals.revenue > 0 ? [20, 24, 28, 30, 35, 40] : [0, 0, 0, 0, 0]}
                      color="#10b981"
                      height={20}
                      width={65}
                    />
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MIDDLE ROW (3 Cards: Revenue Share, Conversion Rate, Top Channels)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Revenue Share by Channel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? 'حصة الإيرادات حسب القناة' : 'Revenue Share by Channel'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              {isAr ? 'النسبة المئوية من إجمالي الإيرادات' : 'Percentage of total revenue'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            {/* List with percentages */}
            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              {data?.channels && data.channels.length > 0 ? (
                data.channels.slice(0, 8).map(ch => {
                  const pct = totals.revenue > 0 ? ((ch.revenue / totals.revenue) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={ch.id} className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                          {isAr ? ch.name_ar : ch.name}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">{pct}%</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 dark:text-slate-500">{isAr ? 'لا توجد بيانات' : 'No data available'}</div>
              )}
            </div>

            {/* Donut Chart without duplicate legend */}
            <div className="w-full sm:w-1/2 flex items-center justify-center shrink-0">
              <DonutChart
                segments={revenueShareSegments.length > 0 ? revenueShareSegments : [{ label: 'Empty', value: 100, color: '#e2e8f0', formattedValue: '0%' }]}
                centerLabel={isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}
                centerValue={money(totals.revenue)}
                size={140}
                strokeWidth={20}
                showLegend={false}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Conversion Rate by Channel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'معدل التحويل حسب القناة' : 'Conversion Rate by Channel'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? 'مقارنة التحويلات والطلبات' : 'Visits, orders and conversion comparison'}
                </p>
              </div>
              <div className="flex items-center gap-2.5 text-[10px] font-bold shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>{isAr ? 'زيارات' : 'Visits'}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>{isAr ? 'طلبات' : 'Orders'}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span>{isAr ? 'تحويل' : 'Conversion'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* SVG Combo Chart (Bar for visits + Dots for orders + Purple line for conversion) */}
          <div className="w-full h-44 pt-2">
            <svg className="w-full h-full" viewBox="0 0 400 140">
              {/* Y grid lines */}
              {[15, 10, 5, 0].map((val, idx) => {
                const y = 20 + idx * 30;
                return (
                  <g key={val}>
                    <text x="5" y={y + 3} className="text-[9px] fill-slate-400 dark:fill-slate-500" textAnchor="start">
                      {val}%
                    </text>
                    <line x1="30" y1={y} x2="395" y2={y} stroke="currentColor" strokeDasharray="2 2" className="text-slate-100 dark:text-slate-800" />
                  </g>
                );
              })}

              {/* Channel columns */}
              {channels.slice(0, 8).map((ch, idx) => {
                const x = 50 + idx * 44;
                const conv = Math.min(15, ch.conversion_rate);
                const convY = 110 - (conv / 15) * 90;
                const visitsH = totals.visits > 0 ? Math.min(80, (ch.visits / totals.visits) * 120) : 0;
                const visitsY = 110 - visitsH;

                return (
                  <g key={ch.id}>
                    {/* Visits Bar */}
                    {visitsH > 0 && (
                      <rect
                        x={x - 6}
                        y={visitsY}
                        width="12"
                        height={visitsH}
                        rx="2"
                        fill="#2563eb"
                        className="opacity-90"
                      />
                    )}
                    {/* Orders Dot */}
                    {ch.completed_orders > 0 && (
                      <circle cx={x} cy={visitsY - 6} r="3" fill="#f43f5e" />
                    )}
                    {/* Rate text (only if > 0 to prevent overlap) */}
                    {ch.conversion_rate > 0 && (
                      <text x={x} y={convY - 4} className="text-[9px] font-bold fill-purple-600 dark:fill-purple-400" textAnchor="middle">
                        {ch.conversion_rate}%
                      </text>
                    )}
                    {/* Channel name label */}
                    <text x={x} y="125" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-medium" textAnchor="middle">
                      {(isAr ? ch.name_ar : ch.name).split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Card 3: Top Performing Channels */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'أفضل القنوات أداءً' : 'Top Performing Channels'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'ترتيب القنوات حسب المعيار' : 'Ranked performance breakdown'}
              </p>
            </div>

            <select
              value={rankMetric}
              onChange={(e) => setRankMetric(e.target.value as MetricFilter)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="revenue">{isAr ? 'حسب الإيرادات' : 'By Revenue'}</option>
              <option value="orders">{isAr ? 'حسب الطلبات' : 'By Orders'}</option>
              <option value="visits">{isAr ? 'حسب الزيارات' : 'By Visits'}</option>
              <option value="conversion_rate">{isAr ? 'حسب معدل التحويل' : 'By Conversion'}</option>
            </select>
          </div>

          <div className="space-y-2.5">
            {rankedChannels.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {isAr ? 'لا توجد بيانات قنوات كافية' : 'No channel performance data yet'}
              </div>
            ) : (
              rankedChannels.map((ch, idx) => {
                const metricVal = getChannelMetricValue(ch, rankMetric);
                const widthPct = Math.round((metricVal / maxRankVal) * 100);

                return (
                  <div key={ch.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px] w-3">{idx + 1}</span>
                        {renderChannelIcon(ch.icon, ch.key)}
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                          {isAr ? ch.name_ar : ch.name}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {rankMetric === 'revenue' ? money(ch.revenue) : rankMetric === 'conversion_rate' ? `${ch.conversion_rate}%` : metricVal}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, widthPct)}%`, backgroundColor: ch.color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. BOTTOM ROW (3 Cards: Visits Trend, Orders by Channel, Last Data Update)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Visits Trend (Current vs Previous Period) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'مسار الزيارات' : 'Visits Trend'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'مقارنة الفترة الحالية بالسابق' : 'Current vs previous period'}
              </p>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-blue-600 rounded-full" />
                <span className="text-slate-500">{isAr ? 'الفترة الحالية' : 'Current Period'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-400" />
                <span className="text-slate-500">{isAr ? 'الفترة السابقة' : 'Previous Period'}</span>
              </span>
            </div>
          </div>

          {/* Dual-line SVG Chart */}
          <div className="w-full h-40 pt-2">
            <svg className="w-full h-full" viewBox="0 0 350 120">
              {/* Y grid */}
              {[600, 400, 200, 0].map((val, idx) => {
                const y = 15 + idx * 30;
                return (
                  <g key={val}>
                    <text x="5" y={y + 3} className="text-[8px] fill-slate-400" textAnchor="start">
                      {val}
                    </text>
                    <line x1="25" y1={y} x2="345" y2={y} stroke="currentColor" strokeDasharray="2 2" className="text-slate-100 dark:text-slate-800" />
                  </g>
                );
              })}

              {/* Previous Period Line (Dashed) */}
              {totals.revenue > 0 && (
                <path
                  d="M 35 105 Q 85 85 135 95 T 235 65 T 335 45"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}

              {/* Current Period Line (Solid Blue) */}
              {totals.revenue > 0 && (
                <path
                  d="M 35 95 Q 85 65 135 75 T 235 45 T 335 25"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />
              )}

              {/* X Date labels */}
              {['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20', 'Jan 25', 'Jan 31'].map((d, idx) => {
                const x = 35 + idx * 50;
                return (
                  <text key={d} x={x} y="118" className="text-[8px] fill-slate-400" textAnchor="middle">
                    {d}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Card 2: Orders by Channel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">
              {isAr ? 'الطلبات حسب القناة' : 'Orders by Channel'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              {isAr ? 'مقارنة الطلبات المكتملة' : 'Completed orders breakdown'}
            </p>
          </div>

          <div className="space-y-2">
            {data?.orders_by_channel && data.orders_by_channel.length > 0 ? (
              data.orders_by_channel.slice(0, 7).map((item, idx) => {
                const maxOrders = Math.max(1, ...data.orders_by_channel.map(o => o.orders));
                const widthPct = Math.round((item.orders / maxOrders) * 100);

                return (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 w-28 truncate">
                      {isAr ? item.name_ar : item.name}
                    </span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(item.orders > 0 ? 8 : 0, widthPct)}%`, backgroundColor: item.color }}
                      />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums w-4 text-end">
                      {item.orders}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                {isAr ? 'لا توجد طلبات مسجلة' : 'No orders recorded'}
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Last Data Update & Integrations Sync */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'آخر تحديث للبيانات' : 'Last Data Update'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'حالة المزامنة مع المنصات' : 'Sync status with channels'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors cursor-pointer"
              title={isAr ? 'تحديث البيانات' : 'Refresh data'}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>

          <div className="space-y-2.5">
            {data?.integrations && data.integrations.length > 0 ? (
              data.integrations.map(integ => (
                <div key={integ.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    {renderChannelIcon(integ.icon, integ.id)}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{integ.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] text-slate-400">
                      ● {isAr ? 'اليوم' : 'Today'} {integ.last_synced}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
                      {isAr ? 'متصل ومحدث' : 'Synced'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                {isAr ? 'لا توجد منصات مربوطة حالياً' : 'No connected platforms'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
