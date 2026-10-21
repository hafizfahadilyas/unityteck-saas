import React from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  Bookmark,
  ChevronDown,
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

export type ReportTabKey =
  | 'overview'
  | 'ai_insights'
  | 'sales_revenue'
  | 'campaign'
  | 'customers'
  | 'products'
  | 'channels'
  | 'behavior';

interface ReportsNavHeaderProps {
  activeTab: ReportTabKey;
  onSelectTab: (tab: ReportTabKey) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  comparisonPeriod: string;
  onComparisonChange: (comp: string) => void;
  onExport: () => void;
  onFilter?: () => void;
  onSaveView?: () => void;
  isExporting?: boolean;
  onPrint?: () => void;
  onOpenGuide?: () => void;
}

export const ReportsNavHeader: React.FC<ReportsNavHeaderProps> = ({
  activeTab,
  onSelectTab,
  dateRange,
  onDateRangeChange,
  comparisonPeriod,
  onComparisonChange,
  onExport,
  onFilter,
  onSaveView,
  isExporting = false,
}) => {
  const { locale, dir } = usePrefs();
  const isAr = locale === 'ar';

  const reportTabs = [
    { key: 'overview' as ReportTabKey, labelAr: 'نظرة عامة', labelEn: 'Overview' },
    { key: 'ai_insights' as ReportTabKey, labelAr: 'تحليلات AI', labelEn: 'AI Insights' },
    { key: 'sales_revenue' as ReportTabKey, labelAr: 'المبيعات والإيرادات', labelEn: 'Sales & Revenue' },
    { key: 'campaign' as ReportTabKey, labelAr: 'تحليلات الحملات', labelEn: 'Campaign Analytics' },
    { key: 'customers' as ReportTabKey, labelAr: 'تحليلات العملاء', labelEn: 'Customer Analytics' },
    { key: 'products' as ReportTabKey, labelAr: 'تحليلات المنتجات', labelEn: 'Product Analytics' },
    { key: 'channels' as ReportTabKey, labelAr: 'تحليلات القنوات', labelEn: 'Channel Analytics' },
    { key: 'behavior' as ReportTabKey, labelAr: 'سلوك الزوار', labelEn: 'Behavior Analytics', badge: 'Clarity' },
  ];

  return (
    <div className="space-y-4" dir={dir}>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HEADER TOP ROW (Matching Image 3 Top Bar)                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'التقارير والتحليلات' : 'Reports & Analytics'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'تتبع أداء متجرك، وافهم عملاءك، واحصل على رؤى وتحليلات مدعومة بالذكاء الاصطناعي.'
                : 'Track your store performance, understand your customers, and get AI-powered insights.'}
            </p>
          </div>
        </div>

        {/* Action Controls (Right aligned in Image 3) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs font-semibold shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex flex-col text-start">
              <span className="text-[10px] text-slate-400 leading-tight">
                {dateRange === '7d' ? (isAr ? 'آخر 7 أيام' : 'Last 7 days') : dateRange === '90d' ? (isAr ? 'آخر 90 يوم' : 'Last 90 days') : (isAr ? 'آخر 30 يوم' : 'Last 30 days')}
              </span>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                Sep 15, 2026 - Oct 14, 2026
              </span>
            </div>
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer w-4 text-transparent focus:w-auto focus:text-slate-800 dark:focus:text-slate-200"
            >
              <option value="7d" className="dark:bg-slate-900 text-slate-800 dark:text-slate-100">{isAr ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
              <option value="30d" className="dark:bg-slate-900 text-slate-800 dark:text-slate-100">{isAr ? 'آخر 30 يوم' : 'Last 30 Days'}</option>
              <option value="90d" className="dark:bg-slate-900 text-slate-800 dark:text-slate-100">{isAr ? 'آخر 90 يوم' : 'Last 90 Days'}</option>
              <option value="year" className="dark:bg-slate-900 text-slate-800 dark:text-slate-100">{isAr ? 'العام الحالي (2026)' : 'This Year (2026)'}</option>
            </select>
          </div>

          {/* Comparison Period Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs font-semibold shadow-2xs">
            <div className="flex flex-col text-start">
              <span className="text-[10px] text-slate-400 leading-tight">{isAr ? 'مقارنة بـ' : 'Compare to'}</span>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {comparisonPeriod === 'prev_year' ? (isAr ? 'العام الماضي' : 'Previous year') : (isAr ? 'الفترة السابقة' : 'Previous period')}
              </span>
            </div>
            <select
              value={comparisonPeriod}
              onChange={(e) => onComparisonChange(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer w-4 text-transparent focus:w-auto focus:text-slate-800 dark:focus:text-slate-200"
            >
              <option value="prev_period" className="dark:bg-slate-900 text-slate-800 dark:text-slate-100">{isAr ? 'الفترة السابقة' : 'Previous period'}</option>
              <option value="prev_year" className="dark:bg-slate-900 text-slate-800 dark:text-slate-100">{isAr ? 'العام الماضي' : 'Previous year'}</option>
            </select>
          </div>

          {/* Filter Button */}
          <button
            type="button"
            onClick={onFilter}
            className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAr ? 'تصفية' : 'Filter'}</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isExporting ? (isAr ? 'جارِ...' : 'Exporting...') : (isAr ? 'تصدير' : 'Export')}</span>
          </button>

          {/* Save View Button (Solid Blue) */}
          <button
            type="button"
            onClick={onSaveView}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isAr ? 'حفظ العرض' : 'Save view'}</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SUB-NAVIGATION TAB BAR (Matching Image 3 Clean Underline Style) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-6 overflow-x-auto border-b border-slate-200 dark:border-slate-800 text-xs font-semibold scrollbar-none pt-1">
        {reportTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              className={`pb-3 relative transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              {tab.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                  {tab.badge}
                </span>
              )}
              {/* Active Bottom Indicator Line */}
              {isActive && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
