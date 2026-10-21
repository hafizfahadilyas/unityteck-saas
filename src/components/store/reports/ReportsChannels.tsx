import React, { useState, useEffect } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { fetchChannelAnalyticsReportsApi } from '../../../api/tenantApi';
import { ReportsEmptyState } from './ReportsEmptyState';
import type { ReportTabKey } from './ReportsNavHeader';
import {
  Globe,
  DollarSign,
  TrendingUp,
  Target,
  ShoppingCart,
  Percent,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ReportsChannelsProps {
  dateRange: string;
  comparisonPeriod: string;
  onNavigateToTab: (tab: ReportTabKey) => void;
}

export const ReportsChannels: React.FC<ReportsChannelsProps> = ({
  dateRange,
  comparisonPeriod,
  onNavigateToTab,
}) => {
  const { activeStore, allOrders } = useTenant();
  const { money, locale, dir } = usePrefs();
  const isAr = locale === 'ar';

  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);

  const storeOrders = React.useMemo(() => {
    if (!activeStore?.id) return [];
    if (Array.isArray(allOrders)) return allOrders.filter((o: any) => o.storeId === activeStore.id);
    return (allOrders && allOrders[activeStore.id]) || [];
  }, [allOrders, activeStore?.id]);

  const loadData = async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const res = await fetchChannelAnalyticsReportsApi(activeStore.id);
      if (res && res.kpis) {
        setApiData(res);
      }
    } catch (e) {
      console.error('Failed to load channel analytics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeStore?.id]);

  const kpis = apiData?.kpis;
  const channels = apiData?.channels || [];

  if (storeOrders.length === 0 && (!kpis || kpis.total_attributed_orders === 0) && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'تحليلات القنوات التسويقية ومصادر الزيارات' : 'Channels & Attribution'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'عائد القنوات التسويقية، الإعلانات المدفوعة، والزيارات المباشرة' : 'Channel performance matrix, ROAS attribution, and conversion efficiency'}
              </p>
            </div>
          </div>
        </div>
        <ReportsEmptyState
          title={isAr ? 'لا توجد بيانات قنوات مسجلة' : 'No Channel Attribution Data'}
          description={
            isAr
              ? 'لم يتم تسجيل أي طلبات منسوبة لقنوات تسويقية أو روابط تتبع حتى الآن.'
              : 'No channel-attributed orders have been registered in the store database yet.'
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
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'تحليلات القنوات ومصادر التحويل' : 'Channel Attribution & Performance'}
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 rounded-full border border-cyan-200 dark:border-cyan-800">
                Multi-Touch
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'مقارنة دقيقة بين القنوات الإعلانية، العائد على الإنفاق (ROAS)، ونسب الإسناد للطلبات'
                : 'Direct channel comparison across ROAS, CPA, conversion rates, and revenue'}
            </p>
          </div>
        </div>
      </div>

      {/* ── ROW 1: 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'أعلى قناة أداءً' : 'Top Performing Channel'}</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis?.top_channel || (channels[0]?.name ?? '—')}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 inline-block">
            {channels[0]?.roas ? `${channels[0].roas}x ROAS` : (channels[0] ? 'Active' : '—')}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'متوسط عائد الإعلانات (Blended ROAS)' : 'Blended ROAS'}</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {kpis?.blended_roas ?? (channels.length > 0 ? (channels.reduce((s: number, c: any) => s + (c.roas || 0), 0) / channels.length).toFixed(2) : '0.00')}x
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1 inline-block">
            {kpis?.roas_change || (channels.length > 0 ? '+0%' : '—')}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'طلبات منسوبة للتسويق' : 'Attributed Orders'}</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {(kpis?.total_attributed_orders ?? storeOrders.length).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">
            {kpis?.volume_pct || (storeOrders.length > 0 ? '100% of volume' : '0%')}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'نسبة العضوي / المدفوع' : 'Organic vs Paid'}</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis?.organic_vs_paid || (storeOrders.length > 0 ? '100% / 0%' : '0% / 0%')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">
            {kpis?.attribution_summary || (storeOrders.length > 0 ? (isAr ? 'بيانات حقيقية' : 'Live Store Data') : '—')}
          </span>
        </div>
      </div>

      {/* ── ROW 2: Channel Comparison Matrix Table ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'مصفوفة مقارنة أداء القنوات التسويقية' : 'Channel Comparison Matrix'}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {isAr ? 'مقارنة المبيعات، العائد، وتكلفة الاستحواذ' : 'Direct channel comparison across ROAS, CPA, and conversion efficiency'}
            </p>
          </div>
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
            {channels.length} {isAr ? 'قناة مسجلة' : 'Channels Tracked'}
          </span>
        </div>

        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {channels.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              {isAr ? 'لا توجد قنوات تسويقية أو طلبات مسجلة لهذه الفترة' : 'No channel attribution records found for this period.'}
            </div>
          ) : (
            channels.map((ch: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{ch.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {ch.orders} {isAr ? 'طلب' : 'orders'} • {isAr ? 'التحويل:' : 'Conv:'} {ch.conv_rate}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-white">{money(ch.revenue)}</div>
                  <div className="flex items-center gap-2 justify-end text-[10px] mt-0.5">
                    <span className="font-bold text-purple-600 dark:text-purple-400">{ch.roas > 0 ? `${ch.roas}x ROAS` : 'Direct'}</span>
                    {ch.cpa > 0 && <span className="text-slate-400">CPA: {money(ch.cpa)}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
