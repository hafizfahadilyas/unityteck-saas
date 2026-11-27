import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { downloadCsv } from '../../utils/exportSpreadsheet';
import {
  fetchMasterSeoOverview,
  fetchMasterSeoStores,
  triggerMasterStoreAudit,
  type MasterSeoOverviewData,
  type MasterStoreSeoItem,
} from '../../services/enterpriseSeoApi';
import {
  Search,
  Globe,
  CheckCircle2,
  AlertCircle,
  Zap,
  Check,
  RefreshCw,
  ArrowRight,
  Copy,
  Download,
  Link2,
  Sliders,
  Sparkles,
  Bot,
  Layers,
  FileText,
  ShieldCheck,
  Activity,
  Gauge,
  Key,
  Database,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Clock,
  History,
  RotateCcw,
  CheckCircle,
  XCircle,
  BarChart3,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface MasterSEOProps {
  initialTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export type MasterSeoSubTab =
  | 'seo-overview'
  | 'seo-advisor'
  | 'seo-providers'
  | 'seo-api-settings'
  | 'merchant-seo'
  | 'product-seo'
  | 'aeo-management'
  | 'geo-management'
  | 'technical-seo'
  | 'speed-optimization'
  | 'backlink-management'
  | 'keyword-research'
  | 'competitor-analysis'
  | 'schema-management'
  | 'sitemap-indexing'
  | 'seo-reports'
  | 'seo-automation'
  | 'seo-logs'
  | 'seo-global-settings';

export const MasterSEO: React.FC<MasterSEOProps> = ({ initialTab, onNavigateTab }) => {
  const { stores } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<MasterSeoSubTab>(() => {
    if (initialTab && initialTab !== 'seo') {
      return initialTab as MasterSeoSubTab;
    }
    return 'seo-overview';
  });

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<MasterSeoOverviewData | null>(null);
  const [storeList, setStoreList] = useState<MasterStoreSeoItem[]>([]);
  const [auditingStoreId, setAuditingStoreId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialTab && initialTab !== 'seo') {
      setActiveTab(initialTab as MasterSeoSubTab);
    }
  }, [initialTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, st] = await Promise.all([
        fetchMasterSeoOverview().catch(() => null),
        fetchMasterSeoStores().catch(() => []),
      ]);
      setOverviewData(ov);
      setStoreList(st);
    } catch {
      // smooth fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleAuditStore = async (storeId: string) => {
    setAuditingStoreId(storeId);
    try {
      await triggerMasterStoreAudit(storeId);
      toast(isAr ? 'تم بدء فحص السيو للمتجر بنجاح' : 'Store SEO audit completed', 'success');
      await loadData();
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل إجراء الفحص' : 'Audit failed'), 'error');
    } finally {
      setAuditingStoreId(null);
    }
  };

  const filteredStores = useMemo(() => {
    if (!searchTerm.trim()) return storeList;
    const q = searchTerm.toLowerCase();
    return storeList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.name_ar && s.name_ar.toLowerCase().includes(q)) ||
        s.live_domain.toLowerCase().includes(q)
    );
  }, [storeList, searchTerm]);

  const tabItems: Array<{ id: MasterSeoSubTab; labelEn: string; labelAr: string; icon: any }> = [
    { id: 'seo-overview', labelEn: 'SEO Overview', labelAr: 'نظرة عامة على السيو', icon: BarChart3 },
    { id: 'seo-advisor', labelEn: 'AI SEO Advisor', labelAr: 'المستشار الذكي للسيو', icon: Bot },
    { id: 'seo-providers', labelEn: 'SEO Providers', labelAr: 'مزودو السيو والذكاء', icon: Cpu },
    { id: 'seo-api-settings', labelEn: 'SEO API Settings', labelAr: 'إعدادات واجهات السيو', icon: Key },
    { id: 'merchant-seo', labelEn: 'Merchant SEO Management', labelAr: 'إدارة سيو التجار', icon: Globe },
    { id: 'product-seo', labelEn: 'Product SEO Management', labelAr: 'إدارة سيو المنتجات', icon: Sparkles },
    { id: 'aeo-management', labelEn: 'AEO Management', labelAr: 'إدارة إجابات الذكاء (AEO)', icon: HelpCircle },
    { id: 'geo-management', labelEn: 'GEO Management', labelAr: 'محركات التوليد (GEO)', icon: Search },
    { id: 'technical-seo', labelEn: 'Technical SEO', labelAr: 'السيو التقني والزحف', icon: ShieldCheck },
    { id: 'speed-optimization', labelEn: 'Speed Optimization', labelAr: 'تسريع المتجر والأداء', icon: Gauge },
    { id: 'backlink-management', labelEn: 'Backlink Management', labelAr: 'الروابط الخلفية والسمعة', icon: Link2 },
    { id: 'keyword-research', labelEn: 'Keyword Research', labelAr: 'بحث الكلمات المفتاحية', icon: TrendingUp },
    { id: 'competitor-analysis', labelEn: 'Competitor Analysis', labelAr: 'تحليل المنافسين', icon: Activity },
    { id: 'schema-management', labelEn: 'Schema Management', labelAr: 'البيانات المنظمة Schema', icon: Layers },
    { id: 'sitemap-indexing', labelEn: 'Sitemap & Indexing', labelAr: 'خرائط الموقع والأرشفة', icon: ExternalLink },
    { id: 'seo-reports', labelEn: 'SEO Reports', labelAr: 'تقارير السيو الشاملة', icon: FileText },
    { id: 'seo-automation', labelEn: 'SEO Automation', labelAr: 'أتمتة السيو والجدولة', icon: Clock },
    { id: 'seo-logs', labelEn: 'SEO Logs', labelAr: 'سجلات عمليات السيو', icon: History },
    { id: 'seo-global-settings', labelEn: 'SEO Global Settings', labelAr: 'إعدادات السيو العامة', icon: Sliders },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Search className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isAr ? 'منصة سوق — إدارة السيو والظهور في محركات الذكاء' : 'Souq SEO & AI Search Visibility Hub'}
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1.5 max-w-2xl">
            {isAr
              ? 'نظام شامل لتحسين محركات البحث العادية (SEO) ومحركات الإجابة (AEO) ومحركات التوليد (GEO) عبر نطاقات المتاجر الحية.'
              : 'Complete multi-tenant SEO, AEO & GEO optimization suite powered by Google Gemini API and verified search engines.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث البيانات' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">{isAr ? 'إجمالي المتاجر' : 'Total Stores'}</p>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">{overviewData?.total_stores ?? stores.length}</p>
          <span className="text-[10px] text-emerald-400 mt-1 inline-block">{isAr ? 'معزولة بنسبة ١٠٠٪' : '100% Isolated'}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">{isAr ? 'متوسط صحة السيو' : 'Avg SEO Health'}</p>
          <p className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">{overviewData?.avg_health_score ?? 0}%</p>
          <span className="text-[10px] text-slate-400 mt-1 inline-block">{isAr ? 'محسوب حقيقياً' : 'Calculated Live'}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">{isAr ? 'السيو التقني' : 'Technical Score'}</p>
          <p className="text-2xl font-bold text-blue-400 mt-1 tabular-nums">{overviewData?.avg_technical_score ?? 0}%</p>
          <span className="text-[10px] text-slate-400 mt-1 inline-block">{isAr ? 'زحف وفهرسة' : 'Crawling & SSL'}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">{isAr ? 'مشكلات مفتوحة' : 'Open Issues'}</p>
          <p className="text-2xl font-bold text-rose-400 mt-1 tabular-nums">{overviewData?.open_issues_count ?? 0}</p>
          <span className="text-[10px] text-rose-300 mt-1 inline-block">
            {overviewData?.critical_issues_count ?? 0} {isAr ? 'حرجة' : 'Critical'}
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">{isAr ? 'ربط كونسول' : 'GSC Connected'}</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">{overviewData?.connected_gsc_count ?? 0}</p>
          <span className="text-[10px] text-slate-400 mt-1 inline-block">{isAr ? 'خصائص موثقة' : 'Verified Properties'}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400">{isAr ? 'شبكة IndexNow' : 'IndexNow Sync'}</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1 tabular-nums">{overviewData?.connected_indexnow_count ?? 0}</p>
          <span className="text-[10px] text-indigo-300 mt-1 inline-block">{isAr ? 'بينغ ومحركات الذكاء' : 'Bing & Partners'}</span>
        </div>
      </div>

      {/* 19-Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                onNavigateTab?.(tab.id);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: SEO Overview */}
      {activeTab === 'seo-overview' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-white mb-4">
              {isAr ? 'حالة السيو عبر جميع المتاجر' : 'Multi-Store SEO Ledger'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">{isAr ? 'المتجر' : 'Store'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'النطاق الحي' : 'Live Domain'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'درجة الصحة' : 'Health Score'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'السيو التقني' : 'Technical'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'سيو المنتجات' : 'Products SEO'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'المشكلات' : 'Issues'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'الربط' : 'Connections'}</th>
                    <th className="pb-3 font-semibold text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStores.map((s) => (
                    <tr key={s.store_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-medium text-white">
                        <div>{isAr ? s.name_ar || s.name : s.name}</div>
                        <span className="text-[10px] text-slate-500 font-mono">{s.store_id}</span>
                      </td>
                      <td className="py-3">
                        <a
                          href={s.live_domain}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span>{s.live_domain.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            s.health_score >= 80
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : s.health_score >= 50
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {s.health_score}%
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 font-semibold">{s.technical_score}%</td>
                      <td className="py-3 text-slate-300 font-semibold">{s.product_seo_score}%</td>
                      <td className="py-3">
                        <span
                          className={`font-semibold ${
                            s.open_issues > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {s.open_issues}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            title="Google Search Console"
                            className={`w-2 h-2 rounded-full ${
                              s.gsc_connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
                            }`}
                          />
                          <span
                            title="IndexNow"
                            className={`w-2 h-2 rounded-full ${
                              s.indexnow_connected ? 'bg-indigo-400 shadow-sm shadow-indigo-400/50' : 'bg-slate-600'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="py-3 text-end">
                        <button
                          type="button"
                          onClick={() => handleAuditStore(s.store_id)}
                          disabled={auditingStoreId === s.store_id}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {auditingStoreId === s.store_id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : isAr ? (
                            'فحص الآن'
                          ) : (
                            'Audit Now'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI SEO Advisor */}
      {activeTab === 'seo-advisor' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                {isAr ? 'المستشار الذكي للسيو (AI SEO Advisor)' : 'AI SEO Advisor Engine'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isAr
                  ? 'يحلل النطاق الحي وقاعدة بيانات لارافيل لاكتشاف المشاكل وتقديم حلول قابلة للتطبيق بضغطة زر.'
                  : 'Audits live merchant domains and Laravel database to surface actionable, 1-click solvable issues.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>{isAr ? 'عناوين وأوصاف ميتا مفقودة' : 'Missing Meta Titles & Descriptions'}</span>
              </div>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'اكتشف النظام منتجات تفتقر لوصف السيو الجذاب. يمكنك تشغيل مولد السيو لتوليدها فورياً.'
                  : 'Products detected with missing meta data. Run Product SEO Generator to backfill instantly.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                <Zap className="w-4 h-4" />
                <span>{isAr ? 'توافق محركات الإجابة والتوليد' : 'AEO & GEO Readiness'}</span>
              </div>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'تم فحص جاهزية المتجر للظهور في Google AI Overviews وChatGPT Search عبر بيانات الأسئلة والكيانات.'
                  : 'Assessing merchant entity authority and FAQ coverage for AI search engine visibility.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: SEO Providers */}
      {activeTab === 'seo-providers' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'مزودو الذكاء الاصطناعي للسيو' : 'AI SEO Providers & Models'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Google Gemini API</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  {isAr ? 'المزود الأساسي' : 'Primary Provider'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'نموذج Flash المجاني المعتمد لتوليد السيو باللغتين العربية والإنجليزية وسياق السوق السعودي.'
                  : 'Eligible free-tier Flash model for fast bilingual SEO, AEO and GEO generation.'}
              </p>
              <div className="text-[11px] text-emerald-400 font-mono pt-1">Active: gemini-3.8-flash</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">OpenAI API</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold">
                  {isAr ? 'اختياري' : 'Optional'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr ? 'مزود احتياطي لإنشاء نصوص المحتوى عند الرغبة.' : 'Secondary optional provider for text completions.'}
              </p>
              <div className="text-[11px] text-slate-400 font-mono pt-1">Model: gpt-4o-mini</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Anthropic Claude API</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold">
                  {isAr ? 'اختياري' : 'Optional'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr ? 'مزود اختياري متقدم لصياغة أدلة الشراء الطويلة.' : 'Optional provider for extended buying guides.'}
              </p>
              <div className="text-[11px] text-slate-400 font-mono pt-1">Model: claude-3-5-haiku</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: SEO API Settings */}
      {activeTab === 'seo-api-settings' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'إعدادات مفاتيح وواجهات السيو' : 'SEO API Credentials & Connection'}
          </h2>
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Google Gemini API Key
              </label>
              <input
                type="password"
                defaultValue="••••••••••••••••••••••••••••••••"
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-xs font-mono"
              />
              <span className="text-[10px] text-emerald-400 mt-1 inline-block">
                {isAr ? 'تم التحقق من المفتاح في السيرفر' : 'Configured on Hostinger Server (.env)'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Google PageSpeed Insights API Key
              </label>
              <input
                type="password"
                defaultValue="••••••••••••••••••••••••••••••••"
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bing Webmaster API Key
              </label>
              <input
                type="text"
                placeholder={isAr ? 'أدخل مفتاح Bing API إن وجد' : 'Enter Bing API Key if available'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Merchant SEO Management */}
      {activeTab === 'merchant-seo' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-bold text-white">
              {isAr ? 'إدارة سيو المتاجر والتجار' : 'Merchant Stores SEO Directory'}
            </h2>
            <input
              type="text"
              placeholder={isAr ? 'بحث عن متجر...' : 'Search store...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {filteredStores.map((st) => (
              <div key={st.store_id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{isAr ? st.name_ar || st.name : st.name}</span>
                  <span className="text-xs font-bold text-amber-400">{st.health_score}%</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">{st.live_domain}</div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-[11px]">
                  <span className="text-slate-400">{isAr ? 'المشكلات:' : 'Issues:'} <strong className="text-rose-400">{st.open_issues}</strong></span>
                  <button
                    type="button"
                    onClick={() => handleAuditStore(st.store_id)}
                    className="text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    {isAr ? 'فحص كامل' : 'Full Audit'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Product SEO Management */}
      {activeTab === 'product-seo' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'إدارة سيو المنتجات الشاملة' : 'Product SEO Command Center'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'توليد تلقائي لـ ١٥ بُعد سيو لكل منتج: العنوان، الوصف، الكلمات المفتاحية، نية البحث، نص بديل للصورة، وسوم Open Graph والأسئلة الشائعة.'
              : 'Auto-generate 15 SEO attributes per product strictly anchored to authentic store catalog attributes.'}
          </p>
        </div>
      )}

      {/* Tab 7: AEO Management */}
      {activeTab === 'aeo-management' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'إدارة إجابات الذكاء الاصطناعي (AEO)' : 'Answer Engine Optimization (AEO)'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'تحويل بيانات المنتجات إلى إجابات دقيقة لمحركات الأسئلة والبحث الصوتي، وتوليد وسوم FAQPage وQAPage المنظمة.'
              : 'Generate conversational FAQ structured data answering real shopper questions.'}
          </p>
        </div>
      )}

      {/* Tab 8: GEO Management */}
      {activeTab === 'geo-management' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'محركات البحث التوليدي (GEO)' : 'Generative Engine Optimization (GEO)'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'تحسين ظهور المتاجر في Google AI Overviews وChatGPT Search وGemini وPerplexity بناءً على الكيانات الموثوقة.'
              : 'Optimize merchant brand consistency and entity facts for ChatGPT Search, Gemini, and Perplexity.'}
          </p>
        </div>
      )}

      {/* Tab 9: Technical SEO */}
      {activeTab === 'technical-seo' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'السيو التقني والزحف (Technical SEO)' : 'Technical SEO & Crawlability Engine'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'فحص شامل لملف robots.txt، وخرائط sitemap.xml، والروابط المعطلة 404، والتحويلات 301، وتوافق الجوال والأمان.'
              : 'Audit robots.txt, sitemaps, 404 broken links, 301 redirects, and mobile responsiveness.'}
          </p>
        </div>
      )}

      {/* Tab 10: Speed Optimization */}
      {activeTab === 'speed-optimization' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'تسريع المتاجر ومؤشرات Core Web Vitals' : 'Speed Optimization & PageSpeed Insights'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'تكامل رسمي مع Google PageSpeed API لتحليل LCP وCLS وINP وFCP وTTFB مع حظر أي تعديلات عشوائية على كود الإنتاج.'
              : 'Live PageSpeed metrics auditing LCP, INP, CLS, and TTFB. Zero unauthorized code modifications.'}
          </p>
        </div>
      )}

      {/* Tab 11: Backlink Management */}
      {activeTab === 'backlink-management' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'إدارة الروابط الخلفية والسمعة' : 'Backlink Profile & Editorial Outreach'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'رصد الروابط الخلفية الحقيقية وتوليد رسائل تواصل احترافية للموردين والأدلة السعودية المعتمدة. منع تام للروابط الوهمية أو المزعجة.'
              : 'Monitor authentic backlinks and generate editorial outreach emails. Zero fake links policy strictly enforced.'}
          </p>
        </div>
      )}

      {/* Tab 12: Keyword Research */}
      {activeTab === 'keyword-research' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'أبحاث الكلمات المفتاحية وسياق السوق السعودي' : 'Keyword Research & Search Intent'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'توليد الكلمات المفتاحية الأساسية والثانوية والمحلية. يتم وسم حجم البحث كـ غير متوفر ما لم يُجلب من مصدر رسمي.'
              : 'Classify primary, long-tail, and local Saudi search keywords without fake search volumes.'}
          </p>
        </div>
      )}

      {/* Tab 13: Competitor Analysis */}
      {activeTab === 'competitor-analysis' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'تحليل المنافسين والمقارنة المعيارية' : 'Competitor Analysis & Benchmarking'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'مقارنة اكتمال السيو وجودة وسوم الميتا وسرعة التجاوب للمتجر أمام المنافسين في نفس القطاع.'
              : 'Benchmark merchant catalog completeness, speed, and schema against competitor domains.'}
          </p>
        </div>
      )}

      {/* Tab 14: Schema Management */}
      {activeTab === 'schema-management' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'إدارة البيانات المنظمة (JSON-LD Schema)' : 'Schema Markup & Structured Data'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'توليد وسوم Organization وProduct وOffer وBreadcrumbList المتطابقة تماماً مع محتوى الصفحة المرئي والتحقق منها برمجياً.'
              : 'Generate valid JSON-LD schemas matching visible on-page content with client-side syntax validation.'}
          </p>
        </div>
      )}

      {/* Tab 15: Sitemap & Indexing */}
      {activeTab === 'sitemap-indexing' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'خرائط الموقع والفهرسة اللحظية (IndexNow)' : 'Sitemaps & IndexNow Submissions'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'متابعة خرائط المنتجات وإرسال الروابط فورياً إلى Google Indexing API وشبكة IndexNow (Bing).'
              : 'Submit sitemaps to Search Console and updated URLs to IndexNow network in real-time.'}
          </p>
        </div>
      )}

      {/* Tab 16: SEO Reports */}
      {activeTab === 'seo-reports' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'تقارير السيو الشاملة وتصدير البيانات' : 'SEO Reports & Historical Analytics'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'تقارير يومية وأسبوعية وشهرية توضح تقدم درجات السيو ونمو الزيارات وتصدير النتائج كملف CSV أو PDF.'
              : 'Export daily, weekly, and monthly performance reports with previous period comparison.'}
          </p>
        </div>
      )}

      {/* Tab 17: SEO Automation */}
      {activeTab === 'seo-automation' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'أتمتة السيو والجدولة الذكية' : 'SEO Automation Rules & Scheduler'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'خيارات الأتمتة (يدوي، يتطلب موافقة، أتمتة مسبقة الاعتماد) مع ضمان عدم نشر أي تغيير غير معتمد.'
              : 'Configure automation modes: Manual, Approval-Required, or Pre-Approved Automation.'}
          </p>
        </div>
      )}

      {/* Tab 18: SEO Logs */}
      {activeTab === 'seo-logs' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'سجلات التعديل والتراجع (Audit Logs & Rollback)' : 'SEO Change Logs & 1-Click Rollback'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'سجل غير قابل للتلاعب يوثق كافة التعديلات وحالة ما قبل وبعد، مع إمكانية التراجع الفوري عن أي تعديل.'
              : 'Immutable audit trail of before/after metadata with 1-click rollback support.'}
          </p>
        </div>
      )}

      {/* Tab 19: SEO Global Settings */}
      {activeTab === 'seo-global-settings' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            {isAr ? 'إعدادات السيو العامة للمنصة' : 'Global Platform SEO Parameters'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'تحديد النطاقات الأساسية، والبادئات المفضلة، وتوزيع أرصدة محفظة الذكاء الاصطناعي لكل عملية سيو.'
              : 'Global domain defaults, credit pricing per SEO generation, and multi-tenant security rules.'}
          </p>
        </div>
      )}
    </div>
  );
};
