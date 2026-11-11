import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  Bookmark,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Megaphone,
  Users,
  Package,
  Target,
  Eye,
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { PortalHubCard } from '../../common/PortalHubCard';

export type ReportTabKey =
  | 'overview'
  | 'ai_insights'
  | 'sales_revenue'
  | 'campaign'
  | 'customers'
  | 'products'
  | 'channels'
  | 'behavior';

export type ReportHubTab = {
  key: ReportTabKey;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: LucideIcon;
};

export const REPORT_HUB_TABS: ReportHubTab[] = [
  {
    key: 'overview',
    labelAr: 'نظرة عامة',
    labelEn: 'Overview',
    descAr: 'ملخص أداء المتجر والمؤشرات الرئيسية.',
    descEn: 'Store performance summary and key metrics.',
    icon: BarChart3,
  },
  {
    key: 'ai_insights',
    labelAr: 'تحليلات الذكاء الاصطناعي',
    labelEn: 'AI Insights',
    descAr: 'رؤى ذكية من بيانات متجرك الحقيقية.',
    descEn: 'Smart insights from your real store data.',
    icon: Sparkles,
  },
  {
    key: 'sales_revenue',
    labelAr: 'المبيعات والإيرادات',
    labelEn: 'Sales & Revenue',
    descAr: 'تحليل المبيعات والإيرادات والضرائب.',
    descEn: 'Sales, revenue, and tax analytics.',
    icon: TrendingUp,
  },
  {
    key: 'campaign',
    labelAr: 'تحليلات الحملات',
    labelEn: 'Campaign Analytics',
    descAr: 'أداء الحملات والعروض التسويقية.',
    descEn: 'Campaign and promo performance.',
    icon: Megaphone,
  },
  {
    key: 'customers',
    labelAr: 'تحليلات العملاء',
    labelEn: 'Customer Analytics',
    descAr: 'سلوك العملاء والولاء والشرائح.',
    descEn: 'Customer behavior, loyalty, and segments.',
    icon: Users,
  },
  {
    key: 'products',
    labelAr: 'تحليلات المنتجات',
    labelEn: 'Product Analytics',
    descAr: 'أداء المنتجات والفئات والمخزون.',
    descEn: 'Product, category, and inventory performance.',
    icon: Package,
  },
  {
    key: 'channels',
    labelAr: 'أداء القنوات التسويقية',
    labelEn: 'Marketing Channels Performance',
    descAr: 'مقارنة قنوات التسويق والتحويل.',
    descEn: 'Compare marketing channels and conversion.',
    icon: Target,
  },
  {
    key: 'behavior',
    labelAr: 'سلوك الزوار',
    labelEn: 'Behavior Analytics',
    descAr: 'سلوك الزوار والربحية والمسارات.',
    descEn: 'Visitor behavior, profitability, and paths.',
    icon: Eye,
  },
];

interface ReportsNavHeaderProps {
  /** null = hub (buttons only). Set = section open. */
  activeTab: ReportTabKey | null;
  onSelectTab: (tab: ReportTabKey) => void;
  onBackToHub?: () => void;
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
  onBackToHub,
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
  const activeMeta = activeTab
    ? REPORT_HUB_TABS.find((t) => t.key === activeTab) ?? null
    : null;

  const formattedDateRange = React.useMemo(() => {
    const now = new Date();
    const past = new Date(now);
    if (dateRange === '7d') past.setDate(now.getDate() - 7);
    else if (dateRange === '90d') past.setDate(now.getDate() - 90);
    else if (dateRange === 'year') past.setMonth(0, 1);
    else past.setDate(now.getDate() - 30);

    if (isAr) {
      const arMonths = [
        'يناير',
        'فبراير',
        'مارس',
        'أبريل',
        'مايو',
        'يونيو',
        'يوليو',
        'أغسطس',
        'سبتمبر',
        'أكتوبر',
        'نوفمبر',
        'ديسمبر',
      ];
      return `${past.getDate()} ${arMonths[past.getMonth()]} ${past.getFullYear()} - ${now.getDate()} ${arMonths[now.getMonth()]} ${now.getFullYear()}`;
    }
    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${enMonths[past.getMonth()]} ${past.getDate()}, ${past.getFullYear()} - ${enMonths[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }, [dateRange, isAr]);

  const controlShell: React.CSSProperties = {
    background: 'var(--surface)',
    borderColor: 'var(--border)',
    color: 'var(--text)',
  };

  return (
    <div className="space-y-4" dir={dir} style={{ fontFamily: 'var(--font-ui)' }}>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {activeTab && onBackToHub ? (
            <button
              type="button"
              onClick={onBackToHub}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer shadow-xs shrink-0"
              style={controlShell}
            >
              <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} aria-hidden />
              {isAr ? 'كل التقارير' : 'All reports'}
            </button>
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ background: 'var(--portal-cta)' }}
              aria-hidden
            >
              <BarChart3 className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate" style={{ color: 'var(--text)' }}>
              {activeMeta
                ? isAr
                  ? activeMeta.labelAr
                  : activeMeta.labelEn
                : isAr
                  ? 'التقارير والتحليلات'
                  : 'Reports & Analytics'}
            </h1>
            <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
              {activeMeta
                ? isAr
                  ? activeMeta.descAr
                  : activeMeta.descEn
                : isAr
                  ? 'اختر تقريراً لعرض بياناته. لا تُعرض البيانات إلا بعد اختيار القسم.'
                  : 'Pick a report to load its data. Data appears only after you open a section.'}
            </p>
          </div>
        </div>

        {/* Filters only when a report section is open */}
        {activeTab ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-semibold shadow-2xs"
              style={controlShell}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted)' }} />
              <div className="flex flex-col text-start">
                <span className="text-[10px] leading-tight" style={{ color: 'var(--muted)' }}>
                  {dateRange === '7d'
                    ? isAr
                      ? 'آخر 7 أيام'
                      : 'Last 7 days'
                    : dateRange === '90d'
                      ? isAr
                        ? 'آخر 90 يوم'
                        : 'Last 90 days'
                      : isAr
                        ? 'آخر 30 يوم'
                        : 'Last 30 days'}
                </span>
                <span className="text-[11px] font-bold leading-tight" style={{ color: 'var(--text)' }}>
                  {formattedDateRange}
                </span>
              </div>
              <select
                value={dateRange}
                onChange={(e) => onDateRangeChange(e.target.value)}
                className="bg-transparent outline-none cursor-pointer w-4 text-transparent focus:w-auto"
                style={{ color: 'var(--text)' }}
              >
                <option value="7d">{isAr ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
                <option value="30d">{isAr ? 'آخر 30 يوم' : 'Last 30 Days'}</option>
                <option value="90d">{isAr ? 'آخر 90 يوم' : 'Last 90 Days'}</option>
                <option value="year">{isAr ? 'العام الحالي' : 'This Year'}</option>
              </select>
            </div>

            <div
              className="flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-semibold shadow-2xs"
              style={controlShell}
            >
              <div className="flex flex-col text-start">
                <span className="text-[10px] leading-tight" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'مقارنة بـ' : 'Compare to'}
                </span>
                <span className="text-[11px] font-bold leading-tight" style={{ color: 'var(--text)' }}>
                  {comparisonPeriod === 'prev_year'
                    ? isAr
                      ? 'العام الماضي'
                      : 'Previous year'
                    : isAr
                      ? 'الفترة السابقة'
                      : 'Previous period'}
                </span>
              </div>
              <select
                value={comparisonPeriod}
                onChange={(e) => onComparisonChange(e.target.value)}
                className="bg-transparent outline-none cursor-pointer w-4 text-transparent focus:w-auto"
                style={{ color: 'var(--text)' }}
              >
                <option value="prev_period">{isAr ? 'الفترة السابقة' : 'Previous period'}</option>
                <option value="prev_year">{isAr ? 'العام الماضي' : 'Previous year'}</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onFilter}
              className="px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              style={controlShell}
            >
              <Filter className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
              <span>{isAr ? 'تصفية' : 'Filter'}</span>
            </button>

            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className="px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              style={controlShell}
            >
              <Download className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
              <span>{isExporting ? (isAr ? 'جارِ...' : 'Exporting...') : isAr ? 'تصدير' : 'Export'}</span>
            </button>

            <button
              type="button"
              onClick={onSaveView}
              className="unity-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ العرض' : 'Save view'}</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Hub: ONLY big buttons — data loads after click */}
      {activeTab === null ? (
        <div className="u-equal-sections grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {REPORT_HUB_TABS.map((tab) => (
            <PortalHubCard
              key={tab.key}
              icon={tab.icon}
              title={isAr ? tab.labelAr : tab.labelEn}
              description={isAr ? tab.descAr : tab.descEn}
              onClick={() => onSelectTab(tab.key)}
              isAr={isAr}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
