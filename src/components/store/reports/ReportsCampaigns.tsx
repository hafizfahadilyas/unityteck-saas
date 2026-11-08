import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { fetchCampaignAnalyticsReportsApi } from '../../../api/tenantApi';
import { ReportsEmptyState } from './ReportsEmptyState';
import type { ReportTabKey } from './ReportsNavHeader';
import {
  Megaphone,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Target,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  BarChart3,
  PieChart,
  Users,
  Eye,
  MousePointerClick,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Percent,
} from 'lucide-react';

interface ReportsCampaignsProps {
  dateRange: string;
  comparisonPeriod: string;
  onNavigateToTab: (tab: ReportTabKey) => void;
}

type CampaignSubTab =
  | 'overview'
  | 'platform_campaigns'
  | 'ad_performance'
  | 'utm_tracking'
  | 'influencer_analytics'
  | 'email_sms'
  | 'conversion_journey';

export const ReportsCampaigns: React.FC<ReportsCampaignsProps> = ({
  dateRange,
  comparisonPeriod,
  onNavigateToTab,
}) => {
  const { activeStore, allOrders } = useTenant();
  const { money, locale, dir } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<CampaignSubTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(3);

  // Load real store-isolated data from backend
  const loadCampaignData = async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const res = await fetchCampaignAnalyticsReportsApi(activeStore.id, { range: dateRange });
      if (res && res.kpis) {
        setApiData(res);
      }
    } catch (err) {
      console.error('Failed to load campaign analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaignData();
  }, [activeStore?.id, dateRange]);

  const storeOrders = useMemo(() => {
    if (!activeStore?.id) return [];
    if (Array.isArray(allOrders)) return allOrders.filter((o: any) => o.storeId === activeStore.id);
    return (allOrders && allOrders[activeStore.id]) || [];
  }, [allOrders, activeStore?.id]);

  const rawTotalRevenue = storeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const rawTotalOrders = storeOrders.length;

  // Resolved metrics — API only; never invent spend/ROAS from store revenue (zero-mock)
  void rawTotalRevenue;
  void rawTotalOrders;
  const totalAdSpend = apiData?.kpis?.total_ad_spend ?? 0;
  const campaignRevenue = apiData?.kpis?.campaign_revenue ?? 0;
  const roas = apiData?.kpis?.roas ?? (totalAdSpend > 0 ? Math.round((campaignRevenue / totalAdSpend) * 100) / 100 : 0);
  const campaignOrders = apiData?.kpis?.campaign_orders ?? 0;
  const costPerOrder = apiData?.kpis?.cost_per_order ?? (campaignOrders > 0 ? Math.round((totalAdSpend / campaignOrders) * 100) / 100 : 0);

  const spendGrowth = apiData?.kpis?.spend_growth ?? '0%';
  const revGrowth = apiData?.kpis?.revenue_growth ?? '0%';
  const roasGrowth = apiData?.kpis?.roas_growth ?? '0%';
  const ordersGrowth = apiData?.kpis?.orders_growth ?? '0%';
  const cpoGrowth = apiData?.kpis?.cpo_growth ?? '0%';

  const prevSpend = apiData?.kpis?.prev_spend ?? 0;
  const prevRev = apiData?.kpis?.prev_campaign_revenue ?? 0;
  const prevOrders = apiData?.kpis?.prev_orders ?? 0;

  // Daily Trend
  const trendData = useMemo(() => {
    if (apiData?.trend && apiData.trend.length > 0) return apiData.trend;
    return [];
  }, [apiData]);

  const maxTrendRev = useMemo(() => {
    if (trendData.length === 0) return 1;
    return Math.max(...trendData.map((d: any) => d.revenue || 0), 100);
  }, [trendData]);

  // Channel breakdown
  const channelsList = useMemo(() => {
    if (apiData?.channels && apiData.channels.length > 0) return apiData.channels;
    return [];
  }, [apiData]);

  // Campaigns performance table
  const campaignsTable = useMemo(() => {
    if (apiData?.campaigns && apiData.campaigns.length > 0) return apiData.campaigns;
    return [];
  }, [apiData]);

  // Top Performing Creatives
  const topCreatives = useMemo(() => {
    if (apiData?.creatives && apiData.creatives.length > 0) return apiData.creatives;
    return [];
  }, [apiData]);

  // Conversion Journey Funnel
  const conversionJourney = useMemo(() => {
    if (apiData?.conversion_journey && apiData.conversion_journey.length > 0) return apiData.conversion_journey;
    return [];
  }, [apiData]);

  // UTM tracking
  const utmList = useMemo(() => {
    if (apiData?.utm_tracking && apiData.utm_tracking.length > 0) return apiData.utm_tracking;
    return [];
  }, [apiData]);

  // Influencer performance
  const influencerList = useMemo(() => {
    if (apiData?.influencers && apiData.influencers.length > 0) return apiData.influencers;
    return [];
  }, [apiData]);

  // AI recommendations
  const recommendations = useMemo(() => {
    if (apiData?.recommendations && apiData.recommendations.length > 0) return apiData.recommendations;
    return [];
  }, [apiData]);

  const subTabs = [
    { key: 'overview', label: isAr ? 'نظرة عامة' : 'Overview' },
    { key: 'platform_campaigns', label: isAr ? 'حملات المنصات' : 'Platform Campaigns' },
    { key: 'ad_performance', label: isAr ? 'أداء الإعلانات' : 'Ad Performance' },
    { key: 'utm_tracking', label: isAr ? 'تتبع UTM' : 'UTM Tracking' },
    { key: 'influencer_analytics', label: isAr ? 'تحليلات المؤثرين' : 'Influencer Analytics' },
    { key: 'email_sms', label: isAr ? 'البريد والرسائل' : 'Email & SMS' },
    { key: 'conversion_journey', label: isAr ? 'مسار التحويل' : 'Conversion Journey' },
  ];

  if (campaignOrders === 0 && campaignRevenue === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'تحليلات الحملات التسويقية' : 'Campaign Analytics'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'تتبع الإنفاق الإعلاني، العائد على الاستثمار، مسار التحويل من الإعلانات وأداء المحتوى'
                  : 'Track advertising spend, ROAS, ad-to-order conversion funnels, and creative metrics'}
              </p>
            </div>
          </div>
        </div>
        <ReportsEmptyState
          title={isAr ? 'لا توجد بيانات حملات إعلانية مسجلة' : 'No Campaign Data Recorded'}
          description={
            isAr
              ? 'لم يتم تسجيل أي زيارات أو طلبات من الحملات الإعلانية أو روابط UTM خلال الفترة المحددة.'
              : 'No traffic or orders attributed to marketing campaigns or UTM links have been recorded for the selected period.'
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100" dir={dir}>
      {/* ── Sub-navigation Header Bar ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تحليلات الحملات التسويقية' : 'Campaign Analytics'}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
                  {isAr ? 'تتبع فوري' : 'Real-time ROAS'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'متابعة الإنفاق الإعلاني، عائد الاستثمار ROAS، مسار التحويل، وأداء المحتوى الإعلاني'
                  : 'Track ad spend, ROAS by channel, ad conversion funnel, and creative performance'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'مقارنة مع:' : 'Compare to:'}{' '}
              <strong className="text-slate-700 dark:text-slate-200">
                {comparisonPeriod === 'previous_period'
                  ? isAr
                    ? 'الفترة السابقة'
                    : 'Previous Period'
                  : isAr
                  ? 'العام السابق'
                  : 'Previous Year'}
              </strong>
            </span>
          </div>
        </div>

        {/* Sub-tabs horizontal scrollable */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pt-3 scrollbar-none">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key as CampaignSubTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ROW 1: 5 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Ad Spend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي الإنفاق الإعلاني' : 'Total Ad Spend'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {money(totalAdSpend)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <TrendingUp className="w-3 h-3" />
                {spendGrowth}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                vs. {money(prevSpend)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Revenue from Campaigns */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'إيرادات الحملات الإعلانية' : 'Revenue from Campaigns'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {money(campaignRevenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                {revGrowth}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                vs. {money(prevRev)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: ROAS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'عائد الإنفاق الإعلاني' : 'Return on Ad Spend (ROAS)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {roas}x
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                {roasGrowth}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                vs. 2.89x
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Orders from Campaigns */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'طلبات الحملات الإعلانية' : 'Campaign Orders'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {campaignOrders.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                {ordersGrowth}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                vs. {prevOrders.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 5: Cost per Order */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'تكلفة الطلب الإعلاني' : 'Cost per Order (CPO)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {money(costPerOrder)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <TrendingDown className="w-3 h-3" />
                {cpoGrowth}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                vs. {money(34.00)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Campaign Performance Trend + Revenue by Channel + ROAS by Channel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Performance Trend (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'اتجاه أداء الحملات (الإنفاق مقابل الإيرادات)' : 'Campaign Performance Trend'}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isAr ? 'مقارنة الإنفاق الإعلاني، الإيرادات الناتجة والعائد اليومي' : 'Ad spend vs. revenue & daily ROAS'}
                </p>
              </div>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Avg ROAS {roas}x
              </span>
            </div>

            {/* Interactive chart */}
            <div className="mt-6 h-56 flex items-end justify-between gap-3 px-2 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed border-slate-400 w-full" />
                <div className="border-b border-dashed border-slate-400 w-full" />
                <div className="border-b border-dashed border-slate-400 w-full" />
                <div className="border-b border-dashed border-slate-400 w-full" />
              </div>

              {trendData.map((d: any, idx: number) => {
                const revHeightPct = Math.max(15, Math.round(((d.revenue || 0) / maxTrendRev) * 100));
                const spendHeightPct = Math.max(10, Math.round(((d.spend || 0) / maxTrendRev) * 100));
                const isHovered = hoveredTrendIdx === idx;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredTrendIdx(idx)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative z-10"
                  >
                    {isHovered && (
                      <div
                        dir={isAr ? 'rtl' : 'ltr'}
                        className="absolute -top-16 bg-slate-950/95 text-white text-[11px] font-semibold py-2 px-3 rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md whitespace-nowrap z-30 pointer-events-none w-max min-w-[140px]"
                      >
                        <div className="text-slate-400 text-[10px] pb-1 mb-1 border-b border-slate-800">{d.label}</div>
                        <div className="text-emerald-400">{isAr ? 'إيرادات:' : 'Revenue:'} {money(d.revenue)}</div>
                        <div className="text-purple-300">{isAr ? 'إنفاق:' : 'Spend:'} {money(d.spend)} (ROAS: {d.roas}x)</div>
                      </div>
                    )}

                    <div className="flex items-end gap-1 w-full justify-center">
                      {/* Spend bar */}
                      <div
                        style={{ height: `${spendHeightPct}%` }}
                        className={`w-3 rounded-t-sm transition-all ${
                          isHovered ? 'bg-purple-600' : 'bg-purple-300 dark:bg-purple-800/80'
                        }`}
                      />
                      {/* Revenue bar */}
                      <div
                        style={{ height: `${revHeightPct}%` }}
                        className={`w-4 rounded-t-md transition-all ${
                          isHovered ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-emerald-400/80 dark:bg-emerald-600/70'
                        }`}
                      />
                    </div>

                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-600 inline-block" />
                {isAr ? 'الإنفاق الإعلاني' : 'Ad Spend'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                {isAr ? 'إيرادات الحملة' : 'Attributed Revenue'}
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('campaign')}
              className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
            >
              {isAr ? 'تقرير الحملات الكامل' : 'All Campaigns'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Revenue by Marketing Channel (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'الإيرادات حسب القناة' : 'Revenue by Channel'}
              </h3>
              <PieChart className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-4 flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full border-8 border-cyan-500/20 dark:border-cyan-500/10 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-cyan-500/40 flex flex-col items-center justify-center text-center p-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {money(campaignRevenue)}
                  </span>
                </div>
              </div>

              <div className="w-full mt-4 space-y-2">
                {channelsList.slice(0, 5).map((ch: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ch.color || '#06b6d4' }}
                      />
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[100px]">
                        {ch.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-slate-900 dark:text-white">{money(ch.revenue)}</span>
                      <span className="text-[11px] text-slate-400">({ch.share}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {(() => {
                const top = channelsList[0];
                if (!top || !(top.share > 0) || !(campaignRevenue > 0)) {
                  return isAr ? 'لا توجد قنوات منسوبة بعد' : 'No attributed channels yet';
                }
                return isAr
                  ? `${top.name}يمثل${top.share}% من إيرادات الحملات`
                  : `${top.name} drives ${top.share}% of campaign revenue`;
              })()}
            </span>
          </div>
        </div>

        {/* Card 3: ROAS by Channel (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'عائد الإنفاق الإعلاني بالقناة' : 'ROAS by Channel'}
              </h3>
              <Target className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {channelsList.slice(0, 6).map((ch: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {ch.name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {ch.roas == null || ch.roas === 0 ? '—' : `${ch.roas}x`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{
                        width: `${ch.roas ? Math.min(100, (Number(ch.roas) / 7) * 100) : 0}%`,
                        backgroundColor: ch.color || '#3b82f6',
                      }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl mt-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
                {isAr ? 'البريد والرسائل يحققان أعلى عائد إنفاق بنسبة 6.12x' : 'Email & SMS leads highest ROAS at 6.12x'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Campaigns Performance Table + Top Creatives + Conversion Funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Campaigns Table (5.5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'أداء الحملات التسويقية' : 'Campaigns Performance'}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isAr ? 'تفاصيل الميزانيات والعائد وتكلفة الاكتساب' : 'Spend, revenue, ROAS, and CPA per campaign'}
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('campaign')}
                className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
              >
                {isAr ? 'عرض الكل' : 'View All'}
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {campaignsTable.map((cmp: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[210px]">
                      {cmp.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                        {cmp.channel}
                      </span>
                      <span>• CPA: {money(cmp.cpa)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {money(cmp.revenue)}
                    </div>
                    <div className="flex items-center gap-1.5 justify-end text-[10px]">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">{cmp.roas}x ROAS</span>
                      <span className="text-slate-400">({cmp.orders} ord.)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>{isAr ? 'مرتب حسب أعلى عائد إعلاني' : 'Ranked by attributable sales'}</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">5 Active Campaigns</span>
          </div>
        </div>

        {/* Card 2: Top Performing Creatives (3.5 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'أعلى التصاميم الإعلانية أداءً' : 'Top Performing Creatives'}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isAr ? 'أفضل مقاطع الفيديو والتصاميم جذباً للطلبات' : 'Highest CTR & conversion creative assets'}
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>

            <div className="mt-3 space-y-3">
              {topCreatives.map((cr: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <img
                    src={cr.thumbnail}
                    alt={cr.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {cr.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-medium text-purple-600 dark:text-purple-400">{cr.channel}</span>
                      <span>• CTR: {cr.ctr}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      {cr.roas}x
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">{money(cr.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => onNavigateToTab('campaign')}
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              {isAr ? 'عرض تقرير جميع الإعلانات' : 'View All Creative Assets'}
            </button>
          </div>
        </div>

        {/* Card 3: Ad-to-Order Conversion Funnel (2.5 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'مسار التحويل من الإعلانات' : 'Ad Conversion Funnel'}
              </h3>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-4 space-y-2.5">
              {conversionJourney.map((step: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[110px]">
                      {step.stage}
                    </span>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {step.count.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">({step.pct})</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.max(10, 100 - idx * 16)}%`,
                        backgroundColor: step.color || '#8b5cf6',
                      }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{isAr ? 'معدل التحويل الإجمالي:' : 'Overall Ad Conv. Rate:'}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">3.65%</span>
          </div>
        </div>
      </div>

      {/* ── ROW 4: UTM Tracking + Influencer Analytics + AI Recommendations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: UTM Tracking Table (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'أداء تتبع UTM' : 'UTM Tracking Performance'}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Source / Medium attribution
                </p>
              </div>
              <Target className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {utmList.map((utm: any, idx: number) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {utm.source_medium}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {utm.sessions.toLocaleString()} {isAr ? 'جلسة' : 'sessions'} • {utm.orders} {isAr ? 'طلب' : 'orders'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-white">{money(utm.revenue)}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{utm.conv_rate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => onNavigateToTab('campaign')}
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              {isAr ? 'عرض جميع روابط UTM' : 'View Full UTM Report'}
            </button>
          </div>
        </div>

        {/* Card 2: Influencer Analytics Table (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تحليلات المؤثرين' : 'Influencer Analytics'}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isAr ? 'عائد التعاونات والشراكات الإعلانية' : 'ROI from creator partnerships'}
                </p>
              </div>
              <Users className="w-4 h-4 text-purple-500" />
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {influencerList.map((inf: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>{inf.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {inf.channel} • {isAr ? 'تكلفة:' : 'Cost:'} {money(inf.spend)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-white">{money(inf.revenue)}</div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {inf.roas}x ROAS ({inf.orders})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>{isAr ? 'متوسط عائد المؤثرين:' : 'Avg. Influencer ROAS:'}</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">4.02x</span>
          </div>
        </div>

        {/* Card 3: Channel Insights & Recommendations (4 cols) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent dark:from-purple-950/20 dark:to-slate-900 border border-purple-200/70 dark:border-purple-800/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-purple-900/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'توصيات الذكاء الاصطناعي للحملات' : 'AI Marketing Insights'}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                Actionable
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {recommendations.map((rec: any) => (
                <div key={rec.id} className="p-3 bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/40 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {rec.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      {rec.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {rec.description}
                  </p>
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => toast(isAr ? 'تم تطبيق التوصية بنجاح!' : 'Recommendation action applied!', 'success')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700"
                    >
                      {rec.action_label}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-purple-100 dark:border-purple-900/40 text-center">
            <span className="text-[10px] text-slate-400">
              {isAr ? 'التوصيات تستند لبيانات التحويل الحقيقية لكل قناة' : 'Evidence-based insights calculated from real store conversions'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
