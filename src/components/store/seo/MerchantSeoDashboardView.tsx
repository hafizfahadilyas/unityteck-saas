import React, { useState } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Link2,
  FileText,
  Search,
  Check,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  type SeoDashboardData,
  type SeoIssueItem,
  resolveSeoIssue,
  ignoreSeoIssue,
  triggerMerchantSeoAudit,
} from '../../../services/enterpriseSeoApi';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';

interface MerchantSeoDashboardViewProps {
  storeId: string;
  storeName: string;
  liveDomain: string;
  data: SeoDashboardData | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onNavigateTab: (tab: string) => void;
}

export const MerchantSeoDashboardView: React.FC<MerchantSeoDashboardViewProps> = ({
  storeId,
  storeName,
  liveDomain,
  data,
  loading,
  onRefresh,
  onNavigateTab,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [auditing, setAuditing] = useState(false);
  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<SeoIssueItem | null>(null);

  const handleRunAudit = async () => {
    setAuditing(true);
    try {
      await triggerMerchantSeoAudit(storeId, 'full');
      toast(isAr ? 'تم تشغيل فحص السيو الحي بنجاح' : 'Live SEO audit completed', 'success');
      await onRefresh();
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل فحص السيو' : 'Audit failed'), 'error');
    } finally {
      setAuditing(false);
    }
  };

  const handleAutoFix = async (issue: SeoIssueItem) => {
    setResolvingIssueId(issue.id);
    try {
      await resolveSeoIssue(storeId, issue.id, issue.proposed_payload || undefined);
      toast(isAr ? 'تم تطبيق تحسين السيو بالذكاء الاصطناعي بنجاح' : 'AI SEO fix applied to live store', 'success');
      await onRefresh();
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل تطبيق الحل' : 'Failed to apply fix'), 'error');
    } finally {
      setResolvingIssueId(null);
    }
  };

  const handleIgnore = async (issue: SeoIssueItem) => {
    try {
      await ignoreSeoIssue(storeId, issue.id);
      toast(isAr ? 'تم تخطي المشكلة' : 'Issue ignored', 'info');
      await onRefresh();
    } catch (err: any) {
      toast(err?.message || 'Error', 'error');
    }
  };

  const healthScore = data?.health_score ?? 0;
  const technicalScore = data?.technical_score ?? 0;
  const productScore = data?.product_seo_score ?? 0;
  const metaScore = data?.meta_completion_score ?? 0;
  const aeoScore = data?.aeo_readiness_score ?? 0;
  const geoScore = data?.geo_readiness_score ?? 0;
  const speedMobile = data?.speed_mobile_score ?? 0;
  const speedDesktop = data?.speed_desktop_score ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Live Domain Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{isAr ? 'النطاق الحي للمتجر:' : 'Live Connected Domain:'}</span>
              <a
                href={liveDomain}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-amber-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>{liveDomain.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-medium">
                {isAr ? 'متصل وحي — آمن SSL' : 'Connected & Live — Active SSL'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono ms-2">
                {data?.last_audited_at ? (isAr ? `آخر فحص: ${new Date(data.last_audited_at).toLocaleTimeString()}` : `Audited: ${new Date(data.last_audited_at).toLocaleTimeString()}`) : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleRunAudit}
            disabled={auditing || loading}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-md disabled:opacity-50 w-full sm:w-auto min-h-[38px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'فحص السيو الفوري' : 'Trigger Live SEO Audit'}</span>
          </button>
        </div>
      </div>

      {/* 2. 12 Real Calculated KPI Cards (Zero-Mock) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Health */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'صحة السيو العامة' : 'SEO Health Score'}</span>
          <span className="text-2xl font-bold text-amber-400 tabular-nums block mt-1">{healthScore}%</span>
          <span className="text-[10px] text-slate-500">{isAr ? 'مؤشر الجودة المجمع' : 'Aggregated health'}</span>
        </div>

        {/* Technical */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'السيو التقني' : 'Technical Score'}</span>
          <span className="text-2xl font-bold text-blue-400 tabular-nums block mt-1">{technicalScore}%</span>
          <span className="text-[10px] text-slate-500">{isAr ? 'زحف وفهرسة وSSL' : 'Crawl & Robots.txt'}</span>
        </div>

        {/* Product SEO */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'اكتمال سيو المنتجات' : 'Product SEO'}</span>
          <span className="text-2xl font-bold text-emerald-400 tabular-nums block mt-1">{productScore}%</span>
          <span className="text-[10px] text-slate-500">{isAr ? 'العناوين والأوصاف' : 'Title & Meta tags'}</span>
        </div>

        {/* Meta Completion */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'وسوم الميتا والصور' : 'Meta & Image ALT'}</span>
          <span className="text-2xl font-bold text-purple-400 tabular-nums block mt-1">{metaScore}%</span>
          <span className="text-[10px] text-slate-500">{isAr ? 'نصوص الصور البديلة' : 'Image Alt coverage'}</span>
        </div>

        {/* AEO */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'جاهزية الإجابات AEO' : 'AEO Readiness'}</span>
          <span className="text-2xl font-bold text-indigo-400 tabular-nums block mt-1">{aeoScore}%</span>
          <span className="text-[10px] text-slate-500">{isAr ? 'الأسئلة الشائعة FAQ' : 'Structured FAQs'}</span>
        </div>

        {/* GEO */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'محركات التوليد GEO' : 'GEO Readiness'}</span>
          <span className="text-2xl font-bold text-cyan-400 tabular-nums block mt-1">{geoScore}%</span>
          <span className="text-[10px] text-slate-500">{isAr ? 'Google AI & ChatGPT' : 'Entity authority'}</span>
        </div>

        {/* Speed Mobile */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'سرعة الجوال' : 'Speed Mobile'}</span>
          <span className={`text-2xl font-bold tabular-nums block mt-1 ${speedMobile >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {speedMobile}/100
          </span>
          <span className="text-[10px] text-slate-500">Google Lighthouse</span>
        </div>

        {/* Speed Desktop */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'سرعة سطح المكتب' : 'Speed Desktop'}</span>
          <span className={`text-2xl font-bold tabular-nums block mt-1 ${speedDesktop >= 70 ? 'text-emerald-400' : 'text-blue-400'}`}>
            {speedDesktop}/100
          </span>
          <span className="text-[10px] text-slate-500">Google Core Web Vitals</span>
        </div>

        {/* Indexed Pages */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'الصفحات المفهرسة' : 'Indexed Pages'}</span>
          <span className="text-2xl font-bold text-white tabular-nums block mt-1">{data?.indexed_pages_count ?? 0}</span>
          <span className="text-[10px] text-slate-500">Google Search Console</span>
        </div>

        {/* Broken Links */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'روابط معطلة 404' : 'Broken Links'}</span>
          <span className={`text-2xl font-bold tabular-nums block mt-1 ${(data?.broken_links_count ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {data?.broken_links_count ?? 0}
          </span>
          <span className="text-[10px] text-slate-500">{isAr ? 'فحص داخلي حي' : 'Internal 404 scan'}</span>
        </div>

        {/* Backlinks */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'روابط خلفية موثقة' : 'Verified Backlinks'}</span>
          <span className="text-2xl font-bold text-white tabular-nums block mt-1">{data?.verified_backlinks_count ?? 0}</span>
          <span className="text-[10px] text-slate-500">
            {data?.total_backlink_records ?? 0} {isAr ? 'إجمالي الفرص' : 'Total records'}
          </span>
        </div>

        {/* Open Issues */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[11px] text-slate-400 block">{isAr ? 'مشكلات السيو المفتوحة' : 'Open Issues'}</span>
          <span className={`text-2xl font-bold tabular-nums block mt-1 ${(data?.open_issues_count ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {data?.open_issues_count ?? 0}
          </span>
          <span className="text-[10px] text-rose-400 font-semibold">
            {data?.critical_issues_count ?? 0} {isAr ? 'حرجة' : 'Critical'}
          </span>
        </div>
      </div>

      {/* 3. Actionable Open SEO Issues List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'مشكلات السيو المكتشفة وتوصيات الذكاء الاصطناعي' : 'Open SEO Issues & AI Recommendations'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'قائمة بالمشكلات المكتشفة على نطاقك الحي مع تكلفة رصيد الذكاء وخيار التطبيق المباشر أو التخطي.'
                : 'Actionable audit recommendations with severity, commercial impact, and 1-click AI resolution.'}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
            {data?.latest_issues?.length ?? 0} {isAr ? 'مشكلة معروضة' : 'Displayed'}
          </span>
        </div>

        {(!data?.latest_issues || data.latest_issues.length === 0) ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-white">{isAr ? 'ممتاز! لا توجد مشكلات سيو مفتوحة حالياً' : 'Great job! No open SEO issues detected'}</p>
            <p className="text-xs text-slate-400 mt-1">{isAr ? 'متجرك متوافق مع معايير السيو الأساسية ومحركات البحث.' : 'Your store conforms to verified search visibility benchmarks.'}</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {data.latest_issues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        issue.severity === 'critical'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : issue.severity === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-white">{isAr ? issue.title_ar : issue.title_en}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded truncate max-w-[200px]">
                      {issue.affected_url}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {isAr ? issue.issue_description_ar : issue.issue_description_en}
                  </p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <strong className="text-slate-300">{isAr ? 'لماذا تهم:' : 'Why it matters:'}</strong>
                    <span>{isAr ? issue.why_it_matters_ar : issue.why_it_matters_en}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleIgnore(issue)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all"
                  >
                    {isAr ? 'تخطي' : 'Skip'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAutoFix(issue)}
                    disabled={resolvingIssueId === issue.id}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {resolvingIssueId === issue.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isAr ? `تطبيق بالذكاء (${issue.ai_credits_cost} رصيد)` : `Fix with AI (${issue.ai_credits_cost} cr)`}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
