import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { DateRangeFilter } from '../../notification-system/components/DateRangeFilter';
import { DonutChart } from '../common/DonutChart';
import {
  TrendingUp,
  Users,
  Megaphone,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Globe,
  Eye,
  MousePointerClick,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';
import { PageDocsGuideModal } from '../common/PageDocsGuideModal';
import { GoogleConnectModal } from './GoogleConnectModal';
import {
  fetchGoogleAnalyticsData,
  fetchGoogleStatus,
  fetchDashboardHomeAnalytics,
  type DashboardHomeAnalytics,
} from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
import { normalizeGa4Snapshot, type NormalizedGa4Metrics } from '../../utils/normalizeGa4Snapshot';

interface StoreAnalyticsProps {
  onNavigateTab?: (tab: string) => void;
}

const emptyGa: NormalizedGa4Metrics = {
  realtimeUsers: 0,
  sessions: 0,
  totalUsers: 0,
  newUsers: 0,
  returningUsers: 0,
  pageViews: 0,
  bounceRate: null,
  deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
  trafficSources: [],
  countries: [],
};

/**
 * Analytics page = traffic / acquisition / GA4 / storefront events ONLY.
 * Sales · products · order status · customer cohorts live on Reports (no duplicate).
 */
export const StoreAnalytics: React.FC<StoreAnalyticsProps> = ({ onNavigateTab }) => {
  const { activeStore, allOrders } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const [gaConnected, setGaConnected] = useState(false);
  const [gaEmail, setGaEmail] = useState<string | null>(null);
  const [gaData, setGaData] = useState<NormalizedGa4Metrics>(emptyGa);
  const [isLoadingGa, setIsLoadingGa] = useState(false);

  const [homeAnalytics, setHomeAnalytics] = useState<DashboardHomeAnalytics | null>(null);
  const [isLoadingHome, setIsLoadingHome] = useState(false);

  const storeOrders = (allOrders && allOrders[activeStore.id]) || [];

  const loadTraffic = async () => {
    if (!activeStore?.id) return;
    setIsLoadingGa(true);
    setIsLoadingHome(true);
    try {
      const status = await fetchGoogleStatus(activeStore.id);
      if (status.is_connected) {
        setGaConnected(true);
        setGaEmail(status.integration?.google_account_email || null);
        const analyticsRes = await fetchGoogleAnalyticsData(activeStore.id);
        setGaData(normalizeGa4Snapshot(analyticsRes));
      } else {
        setGaConnected(false);
        setGaEmail(null);
        setGaData(emptyGa);
      }
    } catch {
      setGaConnected(false);
      setGaData(emptyGa);
    } finally {
      setIsLoadingGa(false);
    }

    if (!isApiEnabled()) {
      setHomeAnalytics(null);
      setIsLoadingHome(false);
      return;
    }
    try {
      const home = await fetchDashboardHomeAnalytics(activeStore.id);
      setHomeAnalytics(home);
    } catch {
      setHomeAnalytics(null);
    } finally {
      setIsLoadingHome(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      await loadTraffic();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStore.id]);

  const storefrontVisits = Math.max(0, Number(homeAnalytics?.visitors_count) || 0);
  const sessions = gaConnected && gaData.sessions > 0 ? gaData.sessions : storefrontVisits;
  const totalUsers = gaConnected ? gaData.totalUsers : storefrontVisits;
  const newUsers = gaConnected ? gaData.newUsers : 0;
  const returningUsers = gaConnected ? gaData.returningUsers : 0;
  const pageViews = gaConnected ? gaData.pageViews : 0;
  const realtimeUsers = gaConnected ? gaData.realtimeUsers : 0;

  const conversionRate =
    sessions > 0 && storeOrders.length > 0
      ? Number(((storeOrders.length / sessions) * 100).toFixed(1))
      : 0;

  const trafficRows = useMemo(() => {
    if (gaConnected && gaData.trafficSources.length > 0) {
      const total = gaData.trafficSources.reduce((s, r) => s + r.sessions, 0) || 1;
      return gaData.trafficSources.map((r, idx) => ({
        id: String(idx + 1),
        rank: idx + 1,
        source: r.source,
        sessions: r.sessions,
        users: r.users,
        share: `${((r.sessions / total) * 100).toFixed(1)}%`,
      }));
    }
    const sources = Array.isArray(homeAnalytics?.traffic_sources) ? homeAnalytics!.traffic_sources! : [];
    return sources
      .filter((s) => (Number(s.visits) || 0) > 0)
      .map((s, idx) => ({
        id: String(idx + 1),
        rank: idx + 1,
        source: isAr ? s.name_ar || s.name : s.name,
        sessions: Math.max(0, Number(s.visits) || 0),
        users: Math.max(0, Number(s.visits) || 0),
        share: `${Math.max(0, Number(s.percentage) || 0)}%`,
      }));
  }, [gaConnected, gaData.trafficSources, homeAnalytics, isAr]);

  const visitorSegments = useMemo(() => {
    if (!gaConnected || (newUsers === 0 && returningUsers === 0)) {
      return [
        { label: isAr ? 'زوار جدد' : 'New visitors', value: 0, color: '#3b82f6', formattedValue: '0' },
        { label: isAr ? 'زوار عائدون' : 'Returning visitors', value: 0, color: '#10b981', formattedValue: '0' },
      ];
    }
    const total = newUsers + returningUsers || 1;
    return [
      {
        label: isAr ? 'زوار جدد' : 'New visitors',
        value: Number(((newUsers / total) * 100).toFixed(1)),
        color: '#3b82f6',
        formattedValue: `${newUsers.toLocaleString()} (${((newUsers / total) * 100).toFixed(1)}%)`,
      },
      {
        label: isAr ? 'زوار عائدون' : 'Returning visitors',
        value: Number(((returningUsers / total) * 100).toFixed(1)),
        color: '#10b981',
        formattedValue: `${returningUsers.toLocaleString()} (${((returningUsers / total) * 100).toFixed(1)}%)`,
      },
    ];
  }, [gaConnected, newUsers, returningUsers, isAr]);

  const devicesUsed = useMemo(() => {
    const { mobile, desktop, tablet } = gaData.deviceBreakdown;
    const total = mobile + desktop + tablet;
    if (!gaConnected || total <= 0) {
      return [
        { label: isAr ? 'الجوال' : 'Mobile', value: 0, color: '#3b82f6', formattedValue: '0%' },
        { label: isAr ? 'الكمبيوتر' : 'Desktop', value: 0, color: '#10b981', formattedValue: '0%' },
        { label: isAr ? 'الأجهزة اللوحية' : 'Tablet', value: 0, color: '#a855f7', formattedValue: '0%' },
      ];
    }
    return [
      {
        label: isAr ? 'الجوال' : 'Mobile',
        value: Number(((mobile / total) * 100).toFixed(1)),
        color: '#3b82f6',
        formattedValue: `${((mobile / total) * 100).toFixed(1)}%`,
      },
      {
        label: isAr ? 'الكمبيوتر' : 'Desktop',
        value: Number(((desktop / total) * 100).toFixed(1)),
        color: '#10b981',
        formattedValue: `${((desktop / total) * 100).toFixed(1)}%`,
      },
      {
        label: isAr ? 'الأجهزة اللوحية' : 'Tablet',
        value: Number(((tablet / total) * 100).toFixed(1)),
        color: '#a855f7',
        formattedValue: `${((tablet / total) * 100).toFixed(1)}%`,
      },
    ];
  }, [gaConnected, gaData.deviceBreakdown, isAr]);

  const countryRows = useMemo(() => {
    if (!gaConnected || gaData.countries.length === 0) return [];
    const total = gaData.countries.reduce((s, c) => s + c.sessions, 0) || 1;
    return gaData.countries.map((c, idx) => ({
      id: String(idx + 1),
      rank: idx + 1,
      name: c.name,
      sessions: c.sessions,
      share: `${((c.sessions / total) * 100).toFixed(1)}%`,
    }));
  }, [gaConnected, gaData.countries]);

  const weekdayBars = useMemo(() => {
    const rows = Array.isArray(homeAnalytics?.visits_by_weekday) ? homeAnalytics!.visits_by_weekday : [];
    return rows.map((d) => ({
      label: isAr ? d.dayAr : d.dayEn,
      pct: Math.max(0, Number(d.percentage) || 0),
      highlighted: Boolean(d.highlighted),
    }));
  }, [homeAnalytics, isAr]);

  const waitingTraffic = !isLoadingGa && !isLoadingHome && sessions === 0 && trafficRows.length === 0;

  return (
    <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'التحليلات ومصادر الزيارات' : 'Analytics & Traffic Insights'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'جلسات الزوار، مصادر الاكتساب، والأجهزة — بيانات حقيقية فقط. المبيعات في التقارير.'
              : 'Visitor sessions, acquisition sources, and devices — real traffic only. Sales live in Reports.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {gaConnected ? (
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'جوجل متصل' : 'Google connected'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isAr ? 'ربط حساب جوجل' : 'Connect Google account'}</span>
            </button>
          )}

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? 'فتح التقارير' : 'Open Reports'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>{isAr ? 'دليل الاستخدام' : 'Docs & Guide'}</span>
          </button>

          <DateRangeFilter />
        </div>
      </div>

      {/* Live GA4 banner */}
      {gaConnected && (
        <div className="p-4 bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-indigo-500/10 dark:from-teal-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 border border-teal-200 dark:border-teal-900 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{isAr ? 'بث تحليلات جوجل ٤ المباشر' : 'Live Google Analytics 4 stream'}</span>
                {gaEmail && <span className="text-[10px] text-slate-500 font-normal">({gaEmail})</span>}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                {isAr
                  ? 'يتم عرض المستخدمين والجلسات ومصادر الزيارات من حساب جوجل الخاص بهذا المتجر فقط.'
                  : 'Active users, sessions, and traffic sources from this store’s Google property only.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-center px-3 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">{isAr ? 'مستخدمون الآن' : 'Active now'}</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {realtimeUsers.toLocaleString()}
              </span>
            </div>
            <div className="text-center px-3 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">{isAr ? 'الجلسات' : 'Sessions'}</span>
              <span className="font-black text-blue-600 dark:text-blue-400 tabular-nums">
                {gaData.sessions.toLocaleString()}
              </span>
            </div>
            <div className="text-center px-3 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">{isAr ? 'مستخدمون جدد' : 'New users'}</span>
              <span className="font-black text-purple-600 dark:text-purple-400 tabular-nums">
                {gaData.newUsers.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPI strip — traffic only */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            label: isAr ? 'الجلسات / الزيارات' : 'Sessions / Visits',
            value: sessions.toLocaleString(),
            icon: Eye,
            tone: 'emerald',
          },
          {
            label: isAr ? 'المستخدمون' : 'Users',
            value: totalUsers.toLocaleString(),
            icon: Users,
            tone: 'blue',
          },
          {
            label: isAr ? 'مشاهدات الصفحات' : 'Page views',
            value: pageViews > 0 ? pageViews.toLocaleString() : '—',
            icon: MousePointerClick,
            tone: 'purple',
          },
          {
            label: isAr ? 'معدل التحويل' : 'Conversion rate',
            value: sessions > 0 ? `${conversionRate}%` : '—',
            icon: TrendingUp,
            tone: 'amber',
          },
          {
            label: isAr ? 'معدل الارتداد' : 'Bounce rate',
            value:
              gaConnected && gaData.bounceRate != null
                ? `${(gaData.bounceRate * (gaData.bounceRate <= 1 ? 100 : 1)).toFixed(1)}%`
                : '—',
            icon: Smartphone,
            tone: 'rose',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{kpi.label}</span>
                <span className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500">
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {waitingTraffic && (
        <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 text-center space-y-2">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'بانتظار بيانات الزيارات' : 'Waiting for traffic data'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {isAr
              ? 'اربط تحليلات جوجل ٤ أو فعّل تتبع واجهة المتجر لعرض الجلسات ومصادر الزيارات الحقيقية. لا تُعرض أرقام وهمية.'
              : 'Connect GA4 or enable storefront tracking to show real sessions and traffic sources. No invented metrics.'}
          </p>
          <button
            type="button"
            onClick={() => setIsGoogleModalOpen(true)}
            className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            {isAr ? 'ربط حساب جوجل' : 'Connect Google account'}
          </button>
        </div>
      )}

      {/* Row 1: Traffic sources · Visitor segments · Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {isAr ? 'مصادر الزيارات' : 'Traffic sources'}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900">
              {gaConnected
                ? isAr
                  ? 'تحليلات جوجل'
                  : 'GA4'
                : isAr
                  ? 'أحداث المتجر'
                  : 'Storefront events'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 text-start">
                  <th className="py-2 font-medium w-8">#</th>
                  <th className="py-2 font-medium text-start">{isAr ? 'المصدر' : 'Source'}</th>
                  <th className="py-2 font-medium text-center">{isAr ? 'الجلسات' : 'Sessions'}</th>
                  <th className="py-2 font-medium text-end">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {trafficRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      {isAr ? 'لا توجد مصادر زيارات بعد' : 'No traffic sources yet'}
                    </td>
                  </tr>
                ) : (
                  trafficRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 text-slate-400">{row.rank}</td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                        {row.source}
                      </td>
                      <td className="py-2.5 text-center tabular-nums text-slate-600 dark:text-slate-300">
                        {row.sessions.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-end tabular-nums font-black text-teal-700 dark:text-teal-300">
                        {row.share}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {isAr ? 'زوار جدد مقابل عائدون' : 'New vs returning visitors'}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              {gaConnected ? (isAr ? 'بيانات حقيقية' : 'GA4 live') : (isAr ? 'غير متصل' : 'Not connected')}
            </span>
          </div>
          <div className="py-2 flex-1 flex items-center justify-center">
            {gaConnected && (newUsers > 0 || returningUsers > 0) ? (
              <DonutChart
                segments={visitorSegments}
                centerLabel={isAr ? 'المستخدمون' : 'Users'}
                centerValue={totalUsers.toLocaleString()}
                size={175}
                strokeWidth={22}
              />
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-4">
                {isAr
                  ? 'اربط تحليلات جوجل لعرض تقسيم الزوار الجدد والعائدين.'
                  : 'Connect GA4 to show new vs returning visitor split.'}
              </p>
            )}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {isAr ? 'الأجهزة المستخدمة' : 'Devices used'}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
              {gaConnected ? (isAr ? 'بيانات حقيقية' : 'GA4 live') : (isAr ? 'غير متصل' : 'Not connected')}
            </span>
          </div>
          <div className="py-2 flex-1 flex items-center justify-center">
            {gaConnected &&
            gaData.deviceBreakdown.mobile + gaData.deviceBreakdown.desktop + gaData.deviceBreakdown.tablet > 0 ? (
              <DonutChart
                segments={devicesUsed}
                centerLabel={isAr ? 'الجلسات' : 'Sessions'}
                centerValue={gaData.sessions.toLocaleString()}
                size={175}
                strokeWidth={22}
              />
            ) : (
              <div className="text-center space-y-2 px-3">
                <div className="flex items-center justify-center gap-3 text-slate-400">
                  <Smartphone className="w-5 h-5" />
                  <Monitor className="w-5 h-5" />
                  <Tablet className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {isAr
                    ? 'لا توجد بيانات أجهزة حتى يتم ربط وتحليلات جوجل ومزامنتها.'
                    : 'No device split until GA4 is connected and synced.'}
                </p>
                {!gaConnected && (
                  <button
                    type="button"
                    onClick={() => setIsGoogleModalOpen(true)}
                    className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    {isAr ? 'ربط تحليلات جوجل ←' : 'Connect GA4 →'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Weekday pattern · Countries · Bridge to Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {isAr ? 'توزيع الزيارات حسب أيام الأسبوع' : 'Visits by weekday'}
            </h2>
            <span className="text-[10px] font-bold text-slate-500">
              {isAr ? 'أحداث واجهة المتجر' : 'Storefront events'}
            </span>
          </div>
          {weekdayBars.length === 0 || storefrontVisits === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
              {isAr ? 'لا توجد زيارات مسجلة لهذا المتجر بعد' : 'No storefront visits recorded yet'}
            </p>
          ) : (
            <div className="space-y-2.5 pt-1">
              {weekdayBars.map((d) => (
                <div key={d.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">{d.label}</span>
                    <span className="tabular-nums text-slate-900 dark:text-white">{d.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.highlighted ? 'bg-teal-600' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, d.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {isAr ? 'أعلى الدول حسب الجلسات' : 'Top countries by sessions'}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
              {gaConnected ? (isAr ? 'تحليلات جوجل' : 'GA4') : (isAr ? 'غير متصل' : 'Not connected')}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 font-medium w-6">#</th>
                  <th className="py-2 font-medium text-start">{isAr ? 'الدولة' : 'Country'}</th>
                  <th className="py-2 font-medium text-end">{isAr ? 'الجلسات' : 'Sessions'}</th>
                  <th className="py-2 font-medium text-end">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {countryRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      {isAr ? 'لا توجد بيانات دول' : 'No country data'}
                    </td>
                  </tr>
                ) : (
                  countryRows.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 text-slate-400">{c.rank}</td>
                      <td className="py-2 font-bold text-slate-800 dark:text-slate-200">{c.name}</td>
                      <td className="py-2 text-end tabular-nums">{c.sessions.toLocaleString()}</td>
                      <td className="py-2 text-end text-slate-500 tabular-nums">{c.share}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-3 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
              {isAr ? 'المبيعات والتقارير' : 'Sales & reports'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'تحليلات المنتجات والطلبات والإيرادات موجودة في صفحة التقارير — بدون تكرار هنا.'
                : 'Product, order, and revenue analytics live on the Reports page — not repeated here.'}
            </p>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
            >
              {isAr ? 'الانتقال إلى التقارير' : 'Go to Reports'}
            </button>
          )}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex justify-between gap-2">
              <span>{isAr ? 'طلبات المتجر (مرجع)' : 'Store orders (ref)'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {storeOrders.length.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span>{isAr ? 'إيراد الطلبات (مرجع)' : 'Order revenue (ref)'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {money(storeOrders.reduce((s, o) => s + (o.total || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Takeaways — real only */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
            <Sparkles className="w-4 h-4" />
          </span>
          <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {isAr ? 'ملخص الزيارات' : 'Traffic summary'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 space-y-2">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
              <Eye className="w-4 h-4" />
              <span>{isAr ? 'حجم الزيارات' : 'Traffic volume'}</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {sessions > 0
                ? isAr
                  ? `تم تسجيل ${sessions.toLocaleString()} جلسة/زيارة لهذا المتجر من مصادر حقيقية.`
                  : `${sessions.toLocaleString()} sessions/visits recorded for this store from real sources.`
                : isAr
                  ? 'لا توجد زيارات مسجلة بعد — بانتظار بيانات جوجل أو أحداث واجهة المتجر.'
                  : 'No visits recorded yet — waiting for GA4 or storefront events.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              <Users className="w-4 h-4" />
              <span>{isAr ? 'الاكتساب' : 'Acquisition'}</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {trafficRows.length > 0
                ? isAr
                  ? `أعلى مصدر حالياً: ${trafficRows[0].source} (${trafficRows[0].share}).`
                  : `Top source right now: ${trafficRows[0].source} (${trafficRows[0].share}).`
                : isAr
                  ? 'لا توجد مصادر زيارات بعد.'
                  : 'No traffic sources yet.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/40 space-y-2">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
              <Megaphone className="w-4 h-4" />
              <span>{isAr ? 'حالة الربط' : 'Connection status'}</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {gaConnected
                ? isAr
                  ? 'تحليلات جوجل متصلة وتبث بيانات هذا المتجر فقط.'
                  : 'Google Analytics is connected and streaming this store only.'
                : isAr
                  ? 'اربط حساب جوجل لبث الجلسات والأجهزة ومصادر الزيارات الحقيقية.'
                  : 'Connect Google to stream real sessions, devices, and traffic sources.'}
            </p>
          </div>
        </div>
      </div>

      <PageDocsGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} pageId="analytics" />

      <GoogleConnectModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onConnected={() => {
          setGaConnected(true);
          void loadTraffic();
        }}
      />
    </div>
  );
};
