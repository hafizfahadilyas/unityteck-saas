import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  Cpu,
  ExternalLink,
  History,
  Layers,
  Loader2,
  Lock,
  MessageSquare,
  Package,
  PhoneCall,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sliders,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  analyzeStoreGrowth,
  executeGrowthRecommendation,
  fetchGrowthHistory,
  fetchGrowthOverview,
  fetchGrowthRecommendations,
  fetchRecommendationPlan,
  rollbackGrowthAction,
  skipGrowthRecommendation,
  updateGrowthSettings,
  type ExecutionMode,
  type GrowthAction,
  type GrowthHealth,
  type GrowthPlanResponse,
  type GrowthRecommendation,
  type GrowthSettings,
  type GrowthWallet,
} from '../../services/storeGrowthAdvisorApi';

export interface StoreGrowthAdvisorProps {
  onNavigateTab?: (tab: string) => void;
}

type ActiveViewTab = 'opportunities' | 'history' | 'wallet' | 'settings';

export const StoreGrowthAdvisor: React.FC<StoreGrowthAdvisorProps> = ({ onNavigateTab }) => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const storeId = activeStore?.id || '';

  // Main navigation state
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('opportunities');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Data states
  const [health, setHealth] = useState<GrowthHealth | null>(null);
  const [wallet, setWallet] = useState<GrowthWallet | null>(null);
  const [settings, setSettings] = useState<GrowthSettings | null>(null);
  const [recommendations, setRecommendations] = useState<GrowthRecommendation[]>([]);
  const [history, setHistory] = useState<GrowthAction[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'skipped'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Step 5 Plan & Approval Modal state
  const [selectedRec, setSelectedRec] = useState<GrowthRecommendation | null>(null);
  const [planData, setPlanData] = useState<GrowthPlanResponse['data'] | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState<number>(0);

  // Rollback in progress
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  // Before/After Diff viewer modal
  const [viewingDiffAction, setViewingDiffAction] = useState<GrowthAction | null>(null);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    if (!storeId) return;
    try {
      setLoading(true);
      const res = await fetchGrowthOverview(storeId);
      if (res.ok) {
        setHealth(res.health);
        setWallet(res.wallet);
        setSettings(res.settings);
      }
      const recRes = await fetchGrowthRecommendations(storeId);
      if (recRes.ok) {
        setRecommendations(recRes.data);
      }
    } catch (err: unknown) {
      console.error('Failed to load growth overview:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  // Load History
  const loadHistory = useCallback(async () => {
    if (!storeId) return;
    try {
      const res = await fetchGrowthHistory(storeId);
      if (res.ok && res.data?.data) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load growth history:', err);
    }
  }, [storeId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === 'history') {
      void loadHistory();
    }
  }, [activeTab, loadHistory]);

  // Trigger Deep Real-Time Analysis
  const handleAnalyze = async () => {
    if (!storeId || analyzing) return;
    try {
      setAnalyzing(true);
      toast(
        isAr ? 'جاري تحليل المتجر بالذكاء الاصطناعي...' : 'AI analyzing live store data...',
        'info'
      );
      const res = await analyzeStoreGrowth(storeId);
      if (res.ok) {
        toast(
          isAr ? 'تم استكمال تحليل المتجر بنجاح' : 'Store analysis completed successfully',
          'success'
        );
        await loadOverview();
      }
    } catch (err: unknown) {
      toast(
        isAr ? 'تعذر استكمال التحليل، يرجى المحاولة لاحقاً' : 'Analysis failed, please try again',
        'error'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Open Step 5 Approval Plan Modal
  const handleOpenPlan = async (rec: GrowthRecommendation) => {
    setSelectedRec(rec);
    setLoadingPlan(true);
    setPlanData(null);
    setExecutionStep(0);
    try {
      const res = await fetchRecommendationPlan(storeId, rec.id);
      if (res.ok) {
        setPlanData(res.data);
      }
    } catch (err) {
      toast(isAr ? 'تعذر تحميل خطة التنفيذ' : 'Failed to load execution plan', 'error');
      setSelectedRec(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  // Execute Approved Action (Step 6-8)
  const handleExecute = async () => {
    if (!selectedRec || !storeId || executing) return;
    try {
      setExecuting(true);
      setExecutionStep(1); // Step 1-4 checks
      await new Promise((r) => setTimeout(r, 400));

      setExecutionStep(2); // Step 5 Approval verified
      await new Promise((r) => setTimeout(r, 400));

      setExecutionStep(3); // Step 6 Executing Laravel domain mutation
      const res = await executeGrowthRecommendation(storeId, selectedRec.id);

      if (res.ok) {
        setExecutionStep(4); // Step 7 Verification
        await new Promise((r) => setTimeout(r, 300));
        setExecutionStep(5); // Step 8 Credit deduction & complete

        toast(
          isAr ? 'تم تطبيق التحسين بنجاح في متجرك الحي' : 'Improvement successfully applied to live store',
          'success'
        );

        if (typeof res.new_balance === 'number' && wallet) {
          setWallet({ ...wallet, remaining_credits: res.new_balance });
        }

        await loadOverview();
        setTimeout(() => {
          setSelectedRec(null);
          setPlanData(null);
          setExecuting(false);
        }, 800);
      } else {
        toast(res.message || (isAr ? 'فشل تنفيذ الإجراء' : 'Action execution failed'), 'error');
        setExecuting(false);
      }
    } catch (err: unknown) {
      toast(isAr ? 'حدث خطأ أثناء التنفيذ' : 'Execution encountered an error', 'error');
      setExecuting(false);
    }
  };

  // Skip Recommendation
  const handleSkip = async (rec: GrowthRecommendation) => {
    if (!storeId) return;
    try {
      const res = await skipGrowthRecommendation(storeId, rec.id);
      if (res.ok) {
        toast(isAr ? 'تم استبعاد التوصية' : 'Recommendation dismissed', 'info');
        setRecommendations((prev) =>
          prev.map((r) => (r.id === rec.id ? { ...r, status: 'skipped' } : r))
        );
      }
    } catch {
      toast(isAr ? 'تعذر استبعاد التوصية' : 'Failed to dismiss recommendation', 'error');
    }
  };

  // Rollback Action
  const handleRollback = async (action: GrowthAction) => {
    if (!storeId || rollingBackId) return;
    if (
      !window.confirm(
        isAr
          ? 'هل أنت متأكد من رغبتك في استعادة الحالة السابقة وإلغاء هذا التعديل؟'
          : 'Are you sure you want to rollback this change and restore the previous store state?'
      )
    ) {
      return;
    }

    try {
      setRollingBackId(action.id);
      const res = await rollbackGrowthAction(storeId, action.id);
      if (res.ok) {
        toast(
          isAr ? 'تمت استعادة حالة المتجر السابقة بنجاح' : 'Store state successfully rolled back',
          'success'
        );
        await loadHistory();
        await loadOverview();
      } else {
        toast(res.message || (isAr ? 'فشلت الاستعادة' : 'Rollback failed'), 'error');
      }
    } catch {
      toast(isAr ? 'حدث خطأ أثناء الاستعادة' : 'Rollback error encountered', 'error');
    } finally {
      setRollingBackId(null);
    }
  };

  // Update Execution Mode
  const handleModeChange = async (mode: ExecutionMode) => {
    if (!storeId || !settings) return;
    try {
      const res = await updateGrowthSettings(storeId, { execution_mode: mode });
      if (res.ok) {
        setSettings({ ...settings, execution_mode: mode });
        toast(
          isAr ? 'تم تحديث وضع تشغيل المستشار الذكي' : 'Advisor execution mode updated',
          'success'
        );
      }
    } catch {
      toast(isAr ? 'تعذر حفظ الإعدادات' : 'Failed to save settings', 'error');
    }
  };

  // Filtered Recommendations
  const filteredRecs = useMemo(() => {
    return recommendations.filter((r) => {
      const matchesStatus = statusFilter === 'all' ? true : r.status === statusFilter;
      const matchesCat = categoryFilter === 'all' ? true : r.category === categoryFilter;
      return matchesStatus && matchesCat;
    });
  }, [recommendations, statusFilter, categoryFilter]);

  // Unique categories in recommendations
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    recommendations.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [recommendations]);

  const score = health?.score ?? 0;
  const grade = health?.grade ?? 'B';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header Card */}
      <div
        className="rounded-2xl p-6 border relative overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(135deg, var(--card-bg, #ffffff) 0%, color-mix(in srgb, var(--portal-cta, #004d40) 4%, var(--card-bg, #ffffff)) 100%)',
          borderColor: 'var(--border, #e2e8f0)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isAr ? 'قراءة مباشرة من قاعدة بيانات المتجر' : 'Live Store Database Telemetry'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {isAr ? 'محرك متعدد الموديلات (OpenAI & Gemini)' : 'Multi-Provider AI (OpenAI & Gemini)'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bot className="w-6 h-6 text-emerald-600 shrink-0" />
              {isAr ? 'مستشار نمو المتجر الذكي والأتمتة المستقلة' : 'Autonomous AI Store Growth Advisor'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {isAr
                ? 'تحليل ذكي ومستمر لكافة جوانب متجرك الحي (المنتجات، السلات المتروكة، السيو، بوابات الدفع، الشحن، صفحات المتجر) وتقديم توصيات قابلة للتنفيذ بضغطة زر مع إمكانية التراجع الفوري.'
                : 'Continuous AI telemetry across your actual store catalog, abandoned carts, SEO metadata, checkout flow, and layout with 1-click execution and instant zero-downtime rollback.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isAr ? 'تحليل المتجر الآن' : 'Analyze Store Now'}
            </button>

            {wallet && (
              <div className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white/80 backdrop-blur shadow-2xs flex items-center gap-2.5">
                <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="text-left rtl:text-right">
                  <div className="text-[10px] text-slate-500 font-semibold leading-none">
                    {isAr ? 'رصيد الذكاء الاصطناعي' : 'AI Credits'}
                  </div>
                  <div className="text-sm font-black text-slate-900 leading-tight">
                    {wallet.remaining_credits}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 mt-6 border-b border-slate-200/80 -mb-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('opportunities')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'opportunities'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAr ? 'فرص النمو والتوصيات' : 'Growth Opportunities'}
            {recommendations.filter((r) => r.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-black">
                {recommendations.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            {isAr ? 'سجل التعديلات والاستعادة' : 'Audit & Rollback Ledger'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'wallet'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            {isAr ? 'المحفظة وباقات الرصيد' : 'AI Wallet & Limits'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {isAr ? 'أوضاع التشغيل والأمان' : 'Execution Modes & Security'}
          </button>
        </div>
      </div>

      {/* Main View Router */}
      {activeTab === 'opportunities' && (
        <div className="space-y-6">
          {/* Health Score & Live Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      score >= 80
                        ? 'text-emerald-500'
                        : score >= 60
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }
                    strokeDasharray={`${score}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-black text-slate-900">{score}%</span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">
                  {isAr ? 'مؤشر جاهزية ونمو المتجر' : 'Store Growth Health'}
                </div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {isAr ? `التقييم: ${grade}` : `Rating: Grade ${grade}`}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {score >= 80
                    ? isAr
                      ? 'أداء ممتاز وجاهزية مرتفعة'
                      : 'High conversion readiness'
                    : isAr
                    ? 'يوجد فرص تحسين حرجة'
                    : 'Actionable gaps detected'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                <span>{isAr ? 'بوابات الدفع والشحن' : 'Payments & Shipping'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-sm font-bold text-slate-800 mt-2">
                {health?.breakdown?.payments ?? 0} / 20 {isAr ? 'نقطة دفع' : 'Pay pts'} &bull;{' '}
                {health?.breakdown?.shipping ?? 0} / 15 {isAr ? 'نقطة شحن' : 'Ship pts'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {isAr ? 'تم التحقق من تفعيل خيارات الدفع والشحن' : 'Active gateways & zones verified'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                <span>{isAr ? 'السيو والكتالوج' : 'Catalog & SEO'}</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-sm font-bold text-slate-800 mt-2">
                {health?.breakdown?.catalog ?? 0} / 20 {isAr ? 'نقطة منتجات' : 'Catalog pts'} &bull;{' '}
                {health?.breakdown?.seo ?? 0} / 15 {isAr ? 'نقطة سيو' : 'SEO pts'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {isAr ? 'فحص المخزون والكلمات الدلالية لمحركات البحث' : 'Stock levels & search visibility'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                <span>{isAr ? 'وضع الأتمتة المعتمد' : 'Execution Mode'}</span>
                <Lock className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-sm font-bold text-slate-900 mt-2">
                {settings?.execution_mode === 'preapproved_automation'
                  ? isAr
                    ? 'أتمتة مسبقة الاعتماد'
                    : 'Pre-Approved Automation'
                  : settings?.execution_mode === 'recommendation_only'
                  ? isAr
                    ? 'توصيات فقط (اطلاع)'
                    : 'Recommendation Only'
                  : isAr
                  ? 'موافقة التاجر مطلوبة'
                  : 'Merchant Approval Required'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {isAr ? 'حماية مشددة على التعديلات الحساسة' : 'Sensitive actions strictly guarded'}
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-xs font-bold text-slate-500 px-1">
                {isAr ? 'الحالة:' : 'Status:'}
              </span>
              {(['pending', 'completed', 'skipped', 'all'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st === 'pending'
                    ? isAr
                      ? 'قيد الانتظار'
                      : 'Pending'
                    : st === 'completed'
                    ? isAr
                      ? 'مكتملة ومطبقة'
                      : 'Completed'
                    : st === 'skipped'
                    ? isAr
                      ? 'مستبعدة'
                      : 'Skipped'
                    : isAr
                    ? 'الكل'
                    : 'All'}
                </button>
              ))}
            </div>

            {categoriesList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">
                  {isAr ? 'المجال:' : 'Category:'}
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 outline-none"
                >
                  <option value="all">{isAr ? 'كافة المجالات (15 مجال)' : 'All 15 Domains'}</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Recommendations Feed */}
          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-slate-600">
                {isAr ? 'جاري قراءة بيانات المتجر وتوليد التوصيات...' : 'Reading store telemetry and compiling recommendations...'}
              </p>
            </div>
          ) : filteredRecs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-black text-slate-900">
                {isAr ? 'لا توجد توصيات مطابقة حالياً' : 'No recommendations matching current filters'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isAr
                  ? 'تم استيفاء كافة التوصيات أو استبعادها. يمكنك الضغط على "تحليل المتجر الآن" لإجراء فحص جديد لكافة العمليات.'
                  : 'All recommendations in this filter are addressed or skipped. Click "Analyze Store Now" to perform a fresh scan.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecs.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {rec.category.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {rec.required_credits} {isAr ? 'رصيد' : 'Credits'}
                        </span>
                        {rec.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> {isAr ? 'مطبق' : 'Applied'}
                          </span>
                        )}
                        {rec.status === 'skipped' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            {isAr ? 'مستبعد' : 'Skipped'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Feature Name */}
                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {rec.feature_name}
                    </h3>

                    {/* Problem Identified */}
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                      <div className="text-[11px] font-black text-amber-800 uppercase flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {isAr ? 'المشكلة المكتشفة في المتجر' : 'Problem Identified'}
                      </div>
                      <p className="text-xs text-amber-950 font-medium leading-relaxed">
                        {rec.problem_identified}
                      </p>
                    </div>

                    {/* Reason */}
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      <strong className="text-slate-900 font-bold">
                        {isAr ? 'لماذا نوصي بهذا؟ ' : 'Why this matters: '}
                      </strong>
                      {rec.reason}
                    </p>

                    {/* Expected Benefit */}
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                      <div className="text-[10px] font-black text-emerald-800 uppercase">
                        {isAr ? 'العائد المتوقع (تقدير تقريبي)' : 'Expected Benefit (Estimate)'}
                      </div>
                      <div className="text-xs font-bold text-emerald-950 mt-0.5">
                        {rec.expected_benefit}
                      </div>
                    </div>

                    {/* Implementation Steps */}
                    {Array.isArray(rec.implementation_steps) && rec.implementation_steps.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          {isAr ? 'خطوات التنفيذ التلقائية:' : 'Automated Execution Plan:'}
                        </div>
                        <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                          {rec.implementation_steps.slice(0, 3).map((step, idx) => (
                            <li key={idx} className="truncate">
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {rec.manual_config_url && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateTab) {
                              const tabName = rec.manual_config_url?.replace('/admin?tab=', '') || 'settings';
                              onNavigateTab(tabName);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {isAr ? 'إعداد يدوي' : 'Manual Setup'}
                        </button>
                      )}

                      {rec.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleSkip(rec)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          {isAr ? 'تجاهل' : 'Skip'}
                        </button>
                      )}
                    </div>

                    {rec.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleOpenPlan(rec)}
                        className="px-4 py-2 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                        {isAr ? 'تنفيذ بالذكاء الاصطناعي' : 'Implement with AI'}
                      </button>
                    ) : rec.status === 'completed' ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {isAr ? 'تم التطبيق بنجاح' : 'Active on live store'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenPlan(rec)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        {isAr ? 'إعادة التفعيل' : 'Reactivate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit & Rollback Ledger Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              {isAr ? 'سجل العمليات الذكية وإمكانية التراجع الفوري' : 'AI Optimization Audit & Rollback Ledger'}
            </h2>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'يتم الاحتفاظ بلقطة كاملة لحالة المتجر (قبل وبعد كل تعديل) في قاعدة البيانات. يمكنك بضغطة زر التراجع عن أي تحسين وإعادة متجرك لحالته الأصلية دون انقطاع.'
                : 'Every optimization stores full Before/After snapshots in MySQL. A single click restores the original store state instantly with zero downtime.'}
            </p>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-700">
                {isAr ? 'لا توجد عمليات منفذة بعد' : 'No executed actions recorded yet'}
              </div>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'عندما توافق على تنفيذ إحدى التوصيات ستظهر تفاصيلها وسجل التراجع هنا.'
                  : 'Approved growth actions and their rollback triggers will appear here.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">{isAr ? 'التعديل المنفذ' : 'Executed Optimization'}</th>
                      <th className="py-3 px-4">{isAr ? 'المجال' : 'Target Module'}</th>
                      <th className="py-3 px-4">{isAr ? 'الرصيد المستخدم' : 'Credits'}</th>
                      <th className="py-3 px-4">{isAr ? 'الحالة' : 'Result'}</th>
                      <th className="py-3 px-4">{isAr ? 'التاريخ والوقت' : 'Timestamp'}</th>
                      <th className="py-3 px-4 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {history.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {act.recommendation?.feature_name || act.action_type}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {act.action_type}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {act.credits_cost} {isAr ? 'نقطة' : 'pts'}
                        </td>
                        <td className="py-3.5 px-4">
                          {act.is_rolled_back ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                              <RotateCcw className="w-3 h-3" />
                              {isAr ? 'تمت الاستعادة' : 'Rolled Back'}
                            </span>
                          ) : act.execution_result === 'success' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3" />
                              {isAr ? 'ناجح ونشط' : 'Success'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {isAr ? 'فشل' : 'Failed'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(act.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingDiffAction(act)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              {isAr ? 'معاينة الفروقات' : 'View Diff'}
                            </button>

                            {!act.is_rolled_back && act.execution_result === 'success' && (
                              <button
                                type="button"
                                onClick={() => handleRollback(act)}
                                disabled={rollingBackId === act.id}
                                className="px-2.5 py-1 rounded-lg border border-rose-200 text-[11px] font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {rollingBackId === act.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3 h-3" />
                                )}
                                {isAr ? 'استعادة الحالة' : 'Rollback'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Wallet & Limits Tab */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  {isAr ? 'رصيد الذكاء الاصطناعي الحالي' : 'Available AI Credits'}
                </span>
                <Coins className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {wallet?.remaining_credits ?? 200}
              </div>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'يتم خصم الرصيد فقط عند نجاح تنفيذ التحسين في متجرك. في حال فشل أي خطوة يتم استرداد الرصيد فورياً.'
                  : 'Credits are only billed upon verified execution. Failed tasks trigger automated instant refunds.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  {isAr ? 'الاستهلاك اليومي' : 'Daily Usage Ceiling'}
                </span>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {wallet?.used_today ?? 0} / {wallet?.daily_limit ?? 100}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (((wallet?.used_today ?? 0) / (wallet?.daily_limit || 100)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  {isAr ? 'الاستهلاك الشهري' : 'Monthly Allowance'}
                </span>
                <Package className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {wallet?.used_month ?? 0} / {wallet?.monthly_limit ?? 1000}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (((wallet?.used_month ?? 0) / (wallet?.monthly_limit || 1000)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Pricing Matrix */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              {isAr ? 'جدول تسعير ميزات مستشار النمو' : 'Feature Credit Pricing Schedule'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                { name: isAr ? 'حزم المنتجات التكميلية (Cross-Sell)' : 'Cross-Sell Bundle Injection', cost: '15' },
                { name: isAr ? 'ترقية المنتجات (Upsell Cards)' : 'SKU Upgrade Upsell Card', cost: '10' },
                { name: isAr ? 'توليد ونشر سيو المنتجات والمتجر' : 'Bilingual Catalog SEO Generation', cost: '20' },
                { name: isAr ? 'أتمتة استعادة السلات المتروكة' : 'Abandoned Cart Multi-Stage Recovery', cost: '15' },
                { name: isAr ? 'إشعارات الواتساب السحابية' : 'WhatsApp Cloud Notifications Trigger', cost: '10' },
                { name: isAr ? 'مساعد المتجر الذكي 24/7' : 'Storefront AI Shopping Assistant', cost: '20' },
                { name: isAr ? 'مكالمات التحقق الصوتي من الدفع عند الاستلام' : 'AI Voice COD Verification Scenario', cost: '25' },
                { name: isAr ? 'كوبونات حملات إعادة الشراء' : 'Welcome & Retention Coupon Deployment', cost: '15' },
                { name: isAr ? 'حملات الكاش باك في محفظة العميل' : '5% Wallet Cashback Campaign Activation', cost: '20' },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <span className="px-2 py-0.5 rounded-full font-black bg-white border border-slate-200 text-slate-900">
                    {item.cost} {isAr ? 'رصيد' : 'Credits'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings & Execution Modes Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-black text-slate-900">
                {isAr ? 'أوضاع تشغيل مستشار النمو المستقل' : 'Autonomous Advisor Execution Modes'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isAr
                  ? 'اختر مستوى الاستقلالية الممنوح للذكاء الاصطناعي في تحسين متجرك.'
                  : 'Select the level of autonomy granted to the AI agent to optimize your store.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  id: 'recommendation_only' as ExecutionMode,
                  title: isAr ? '1. توصيات فقط (اطلاع)' : '1. Recommendation Only',
                  desc: isAr
                    ? 'يقتصر دور الذكاء الاصطناعي على التحليل وإظهار التوصيات فقط دون صلاحية تنفيذ أي تعديل.'
                    : 'AI analyzes and presents insights. Zero modifications are made to the live store.',
                  icon: Search,
                },
                {
                  id: 'merchant_approval' as ExecutionMode,
                  title: isAr ? '2. موافقة التاجر مطلوبة (الوضع الافتراضي)' : '2. Merchant Approval Required (Default)',
                  desc: isAr
                    ? 'يحلل الذكاء الاصطناعي ويجهز خطة التعديل، ولا يتم تطبيق أي تغيير إلا بعد ضغطك على "موافقة وتنفيذ".'
                    : 'AI prepares the exact plan and diff. No changes are applied without explicit merchant approval.',
                  icon: ShieldCheck,
                },
                {
                  id: 'preapproved_automation' as ExecutionMode,
                  title: isAr ? '3. أتمتة مسبقة الاعتماد' : '3. Pre-Approved Automation',
                  desc: isAr
                    ? 'يُسمح للذكاء الاصطناعي بتنفيذ التعديلات الروتينية منخفضة الخطورة (مثل توليد وسوم السيو وتذكيرات السلات) تلقائياً.'
                    : 'AI automatically applies low-risk optimizations (like missing SEO tags and cart alerts) within your limits.',
                  icon: Zap,
                },
              ].map((mode) => {
                const isSelected = settings?.execution_mode === mode.id;
                const Icon = mode.icon;
                return (
                  <div
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/30 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                          {isAr ? 'مفعل حالياً' : 'Active'}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-black text-slate-900">{mode.title}</div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{mode.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Sensitive Actions Firewall */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                {isAr ? 'جدار حماية الإجراءات الحساسة (محمي دائماً)' : 'Sensitive Actions Firewall (Strictly Protected)'}
              </div>
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                {isAr
                  ? 'حتى في وضع "الأتمتة مسبقة الاعتماد"، يمنع النظام الذكاء الاصطناعي منعاً باتاً من تعديل بوابات الدفع، الحسابات البنكية، أسعار المنتجات الأساسية، أو إعدادات النطاق دون طلب مصادقة التاجر الصريحة.'
                  : 'Even in Pre-Approved Automation, the AI is strictly prohibited from altering payment credentials, bank IBANs, base product prices, or custom domain DNS without dual-factor merchant authorization.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 5 Plan & Approval Modal */}
      {selectedRec && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isAr ? 'خطة التنفيذ والموافقة الصريحة' : 'Execution Plan & Merchant Approval'}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    {isAr ? 'مستشار النمو الذكي &bull; منصة سوق' : 'Autonomous Store Advisor &bull; Souq Platform'}
                  </div>
                </div>
              </div>

              {!executing && (
                <button
                  type="button"
                  onClick={() => setSelectedRec(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {loadingPlan ? (
                <div className="p-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-600">
                    {isAr ? 'جاري فحص الصلاحيات والرصيد...' : 'Checking subscription & credits balance...'}
                  </div>
                </div>
              ) : planData ? (
                <>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase">
                      {isAr ? 'الميزة المراد تطبيقها:' : 'Target Feature:'}
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {selectedRec.feature_name}
                    </div>
                  </div>

                  {/* Proposed Changes Diff */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      <span>{isAr ? 'التعديلات المقترحة في قاعدة البيانات' : 'Proposed Database Mutations'}</span>
                      <span className="font-mono text-[10px] text-emerald-600 font-bold">
                        {planData.proposed_changes.target}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {planData.proposed_changes.action}
                    </p>
                  </div>

                  {/* 8-Step Execution Stepper (Visible during execution) */}
                  {executing && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="text-xs font-black text-emerald-900 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        {isAr ? 'جاري تنفيذ الإجراء وتوثيقه في السجل...' : 'Executing & logging in MySQL audit...'}
                      </div>
                      <div className="text-[11px] text-emerald-800 space-y-1 font-medium">
                        <div className={executionStep >= 1 ? 'font-bold' : 'opacity-60'}>
                          ✓ {isAr ? 'الخطوة 1-4: التحقق من الصلاحيات وتوفر الرصيد' : 'Step 1-4: Permissions & Credit Check verified'}
                        </div>
                        <div className={executionStep >= 2 ? 'font-bold' : 'opacity-60'}>
                          ✓ {isAr ? 'الخطوة 5: اعتماد خطة التنفيذ وتأكيد التاجر' : 'Step 5: Merchant approval confirmed'}
                        </div>
                        <div className={executionStep >= 3 ? 'font-bold' : 'opacity-60'}>
                          ✓ {isAr ? 'الخطوة 6: تطبيق التعديلات عبر خدمات لارافيل المعتمدة' : 'Step 6: Atomic execution in Laravel domain services'}
                        </div>
                        <div className={executionStep >= 4 ? 'font-bold' : 'opacity-60'}>
                          ✓ {isAr ? 'الخطوة 7: التحقق من نشر التغييرات في المتجر الحي' : 'Step 7: Verifying live storefront persistence'}
                        </div>
                        <div className={executionStep >= 5 ? 'font-bold' : 'opacity-60'}>
                          ✓ {isAr ? 'الخطوة 8: خصم الرصيد وتوثيق نقطة الاستعادة' : 'Step 8: Credit ledger updated & rollback point recorded'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Credit Check Status */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500">
                        {isAr ? 'الرصيد المطلوب' : 'Credits Required'}
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {planData.required_credits} {isAr ? 'نقطة' : 'pts'}
                      </div>
                    </div>
                    <div className="text-right rtl:text-left">
                      <div className="text-[11px] font-bold text-slate-500">
                        {isAr ? 'رصيدك الحالي' : 'Your Balance'}
                      </div>
                      <div
                        className={`text-sm font-black ${
                          planData.has_enough_credits ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {planData.current_balance} {isAr ? 'نقطة' : 'pts'}
                      </div>
                    </div>
                  </div>

                  {!planData.has_enough_credits && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-medium">
                      {isAr
                        ? 'رصيدك الحالي غير كافٍ لتنفيذ هذه التوصية. يرجى شحن الرصيد من تبويب المحفظة أو تجاهل التوصية.'
                        : 'Insufficient credits for this optimization. Please purchase credits in the Wallet tab or skip.'}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedRec(null)}
                disabled={executing}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              {planData?.has_enough_credits ? (
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={executing}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {executing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isAr ? 'موافقة وتطبيق الآن' : 'Approve & Apply Now'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRec(null);
                    setActiveTab('wallet');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-700 transition-all cursor-pointer"
                >
                  {isAr ? 'شراء رصيد' : 'Buy Credits'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Before / After Diff Viewer Modal */}
      {viewingDiffAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {isAr ? 'معاينة الفروقات (قبل / بعد التعديل)' : 'Before & After Optimization State Diff'}
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">
                  {viewingDiffAction.action_type} &bull; {viewingDiffAction.id}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDiffAction(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-500 uppercase text-[10px]">
                    {isAr ? 'الحالة السابقة (قبل التعديل)' : 'Before State Snapshot'}
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-60">
                    {JSON.stringify(viewingDiffAction.before_state, null, 2)}
                  </pre>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-emerald-600 uppercase text-[10px]">
                    {isAr ? 'الحالة الحالية (بعد التعديل)' : 'After State Snapshot'}
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-60">
                    {JSON.stringify(viewingDiffAction.after_state || viewingDiffAction.proposed_changes, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingDiffAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
