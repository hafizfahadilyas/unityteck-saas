import React, { useState, useEffect, useCallback } from 'react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchStoreAudit,
  fixStoreAuditIssue,
  skipStoreAuditIssue,
  unskipStoreAuditIssue,
  type StoreAuditResponse,
  type StoreAuditIssue,
} from '../../services/storeAiAgentApi';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Wand2,
  CreditCard,
  Truck,
  FileText,
  Building2,
  Search,
  ShoppingBag,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  RotateCcw,
} from 'lucide-react';

interface Props {
  onNavigateTab?: (tab: string) => void;
  onBackToOverview?: () => void;
}

export const StoreAiAgentAudit: React.FC<Props> = ({ onNavigateTab, onBackToOverview }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();
  const storeId = activeStore?.id || '';

  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState<StoreAuditResponse | null>(null);
  const [fixingAction, setFixingAction] = useState<string | null>(null);
  const [skippingId, setSkippingId] = useState<string | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const loadAudit = useCallback(async () => {
    if (!storeId) return;
    try {
      setLoading(true);
      const data = await fetchStoreAudit(storeId);
      setAuditData(data);
    } catch (err: any) {
      console.error('Failed to load store audit:', err);
      toast(
        isAr ? 'تعذر جلب فحص المتجر' : 'Failed to load store audit',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [storeId, isAr, toast]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const handleFixWithAi = async (issue: StoreAuditIssue) => {
    if (!storeId || !issue.ai_action) return;
    try {
      setFixingAction(issue.ai_action);
      const res = await fixStoreAuditIssue(storeId, issue.ai_action);
      toast(
        isAr
          ? (res.message_ar || 'تم تطبيق الإصلاح الذكي بنجاح بالذكاء الاصطناعي ✓')
          : (res.message || 'AI Auto-fix applied successfully ✓'),
        'success',
      );
      // Reload audit after fix
      await loadAudit();
    } catch (err: any) {
      console.error('AI Fix error:', err);
      toast(
        isAr ? 'تعذر تنفيذ الإصلاح التلقائي' : 'Failed to execute AI fix',
        'error',
      );
    } finally {
      setFixingAction(null);
    }
  };

  const handleSkip = async (issueId: string) => {
    if (!storeId) return;
    try {
      setSkippingId(issueId);
      await skipStoreAuditIssue(storeId, issueId);
      toast(
        isAr
          ? 'تم تأجيل التنبيه ونقله إلى قائمة المراجعة لاحقاً'
          : 'Issue marked as skipped / pending review',
        'info',
      );
      await loadAudit();
    } catch (err: any) {
      toast(isAr ? 'تعذر تأجيل التنبيه' : 'Failed to skip issue', 'error');
    } finally {
      setSkippingId(null);
    }
  };

  const handleUnskip = async (issueId: string) => {
    if (!storeId) return;
    try {
      setSkippingId(issueId);
      await unskipStoreAuditIssue(storeId, issueId);
      toast(
        isAr ? 'تمت استعادة التنبيه إلى قائمة التجهيز' : 'Issue restored to active alerts',
        'success',
      );
      await loadAudit();
    } catch (err: any) {
      toast(isAr ? 'تعذر الاستعادة' : 'Failed to restore issue', 'error');
    } finally {
      setSkippingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment':
        return CreditCard;
      case 'shipping':
        return Truck;
      case 'tax':
        return FileText;
      case 'store':
        return Building2;
      case 'legal':
        return ShieldCheck;
      case 'seo':
        return Search;
      case 'catalog':
        return ShoppingBag;
      default:
        return Sparkles;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'payment':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800';
      case 'shipping':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800';
      case 'tax':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';
      case 'legal':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800';
      case 'seo':
        return 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800';
    }
  };

  if (loading && !auditData) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <Loader2 className="w-9 h-9 animate-spin text-purple-600 mb-3" />
        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          {isAr
            ? 'جاري فحص إعدادات المتجر بالكامل (الدفع، الشحن، الضريبة، السياسات، السيو)...'
            : 'Auditing complete store setup (Payments, Shipping, Tax, Policies, SEO)...'}
        </p>
        <p className="text-xs font-semibold mt-1" style={{ color: 'var(--muted)' }}>
          {isAr ? 'فحص حقيقي لقاعدة البيانات بدون بيانات وهمية' : 'Real database scan · Zero fake data'}
        </p>
      </div>
    );
  }

  const score = auditData?.health_score ?? 0;
  const issues = auditData?.issues ?? [];
  const skipped = auditData?.skipped ?? [];
  const resolved = auditData?.resolved ?? [];

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-2">
          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <ArrowRight className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
              {isAr ? 'العودة لمركز الوكلاء' : 'Back to AI Hub'}
            </button>
          )}
          <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
            {isAr ? 'وكيل إعداد وتدقيق المتجر الذكي' : 'Store Setup & Health Auditor AI Agent'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => void loadAudit()}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {isAr ? 'إعادة فحص المتجر الآن' : 'Re-run Store Audit'}
        </button>
      </div>

      {/* Main Health Gauge Banner */}
      <div
        className="p-6 rounded-3xl border shadow-sm relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)',
          borderColor: 'rgba(168, 85, 247, 0.25)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {isAr ? 'وكيل الفحص الذكي (Gemini Free)' : 'AI Store Health Agent'}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                  score >= 90
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                    : score >= 60
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300'
                }`}
              >
                {auditData?.grade || 'Audit Active'}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--text)' }}>
                {isAr
                  ? `جاهزية المتجر للانطلاق: ${score}%`
                  : `Store Launch Readiness: ${score}%`}
              </h2>
              <p className="text-xs sm:text-sm font-semibold mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'يقوم الوكيل الذكي بفحص طرق الدفع، الشحن، الضرائب، السياسات القانونية، والسيو. يمكنك إصلاح أي نقص يدويّاً أو الطلب من الذكاء الاصطناعي إعداده فوراً مجاناً.'
                  : 'Audits missing payment methods, shipping rates, VAT settings, policies and SEO. Fix manually or let Gemini AI auto-configure them for free.'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-700 rounded-full ${
                  score >= 90
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : score >= 60
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-red-500 to-rose-400'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Quick KPI Counters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
            <div className="p-3.5 rounded-2xl border text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
                {isAr ? 'عناصر ناقصة حرجة' : 'Critical Alerts'}
              </p>
              <p className="text-2xl font-black text-red-600 mt-0.5">
                {auditData?.critical_count ?? 0}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
                {isAr ? 'تحذيرات مطلوب مراجعتها' : 'Warnings'}
              </p>
              <p className="text-2xl font-black text-amber-500 mt-0.5">
                {auditData?.warning_count ?? 0}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
                {isAr ? 'مؤجلة / معلقة' : 'Pending / Skipped'}
              </p>
              <p className="text-2xl font-black text-slate-500 mt-0.5">
                {auditData?.skipped_count ?? 0}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
                {isAr ? 'عناصر مكتملة بنجاح' : 'Passed Checks'}
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">
                {auditData?.completed_checks ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Fee Clarity Notice */}
      <div
        className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold leading-relaxed"
        style={{
          background: 'var(--card)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div style={{ color: 'var(--text)' }}>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              {isAr ? 'شفافية التكاليف ورسوم سوق: ' : 'Pricing & Platform Fee Transparency: '}
            </span>
            {isAr
              ? 'توليد وإعداد الإعدادات يتم مجاناً 100% عبر واجهة Google Gemini Free API Tier الرسمية. رسوم منصة سوق: 0 ر.س (مشمولة مجاناً في باقتك).'
              : 'AI generation runs 100% free via Google Gemini Free API tier. Platform fee to Souq: 0 SAR (Included in your plan).'}
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 shrink-0 self-start sm:self-auto">
          {isAr ? 'مجاني بالكامل ✓' : '100% Free Tier ✓'}
        </span>
      </div>

      {/* ACTIVE ISSUES CHECKLIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {isAr ? 'قائمة النواقص المطلوب إعدادها للمتجر' : 'Required Store Setup Action Items'}
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold">
              {issues.length}
            </span>
          </h3>
        </div>

        {issues.length === 0 ? (
          <div
            className="p-8 rounded-2xl border text-center space-y-3"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black" style={{ color: 'var(--text)' }}>
              {isAr ? 'تهانينا! متجرك مكتمل بنسبة 100% وجاهز للمبيعات' : 'Congratulations! Store setup is 100% complete'}
            </h4>
            <p className="text-xs font-semibold max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'تم ضبط كافة طرق الدفع، الشحن، السياسات، الضريبة، والبيانات التعريفية بنجاح.'
                : 'All payments, shipping, tax settings, policies and SEO metadata are active and verified.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {issues.map((issue) => {
              const Icon = getCategoryIcon(issue.category);
              const colorClass = getCategoryColor(issue.category);
              const isFixing = fixingAction === issue.ai_action;
              const isSkipping = skippingId === issue.id;

              return (
                <div
                  key={issue.id}
                  className="p-5 rounded-2xl border transition-all duration-200 space-y-4"
                  style={{
                    background: 'var(--card)',
                    borderColor: issue.severity === 'critical' ? 'rgba(239, 68, 68, 0.35)' : 'var(--border)',
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left: Icon & Description */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                            {isAr ? issue.title_ar : issue.title_en}
                          </h4>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              issue.severity === 'critical'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {issue.severity === 'critical'
                              ? (isAr ? 'حرج' : 'Critical')
                              : (isAr ? 'مستحسن' : 'Warning')}
                          </span>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800" style={{ color: 'var(--muted)' }}>
                            {issue.category.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--muted)' }}>
                          {isAr ? issue.description_ar : issue.description_en}
                        </p>

                        <div className="text-[11px] font-bold text-red-600 dark:text-red-400 pt-0.5">
                          ⚠ {isAr ? issue.details_ar : issue.details_en}
                        </div>
                      </div>
                    </div>

                    {/* Right: 3 Action Choices */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-start pt-2 md:pt-0">
                      {/* Action 1: Fix Yourself (Manual deep-link) */}
                      {onNavigateTab && issue.nav_tab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab(issue.nav_tab)}
                          className="px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-xs"
                          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                          title={isAr ? 'فتح صفحة الإعدادات لتعديلها بنفسك' : 'Open settings to edit yourself'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {isAr ? 'إصلاح يدوي' : 'Fix Yourself'}
                        </button>
                      )}

                      {/* Action 2: Fix with AI (Gemini Free 1-click auto fix) */}
                      {issue.can_ai_fix && (
                        <button
                          type="button"
                          onClick={() => handleFixWithAi(issue)}
                          disabled={isFixing}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                          style={{
                            background: 'linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)',
                          }}
                          title={isAr ? issue.ai_fix_label_ar : issue.ai_fix_label_en}
                        >
                          {isFixing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="w-3.5 h-3.5" />
                          )}
                          {isAr ? 'إصلاح بالذكاء الاصطناعي (مجاناً)' : 'Fix with AI (Free)'}
                        </button>
                      )}

                      {/* Action 3: Skip / Pending */}
                      <button
                        type="button"
                        onClick={() => handleSkip(issue.id)}
                        disabled={isSkipping}
                        className="px-3 py-2 rounded-xl border text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        style={{ borderColor: 'var(--border)' }}
                        title={isAr ? 'تأجيل هذا الإعداد للمراجعة لاحقاً' : 'Postpone this item for later review'}
                      >
                        {isSkipping ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {isAr ? 'تأجيل / معلق' : 'Skip / Pending'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SKIPPED / PENDING SECTION */}
      {skipped.length > 0 && (
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => setShowSkipped(!showSkipped)}
            className="w-full flex items-center justify-between p-4 rounded-2xl border text-xs font-bold transition-colors cursor-pointer"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>
                {isAr ? 'العناصر المؤجلة للمراجعة لاحقاً' : 'Pending / Postponed Setup Items'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {skipped.length}
              </span>
            </div>
            {showSkipped ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSkipped && (
            <div className="space-y-2.5">
              {skipped.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border flex items-center justify-between gap-3 opacity-80 hover:opacity-100 transition-opacity"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div>
                    <h5 className="text-xs font-bold line-through text-gray-400">
                      {isAr ? item.title_ar : item.title_en}
                    </h5>
                    <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
                      {isAr ? item.description_ar : item.description_en}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnskip(item.id)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer shrink-0"
                    style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}
                  >
                    <RotateCcw className="w-3 h-3 inline me-1" />
                    {isAr ? 'استعادة للتنبيهات' : 'Restore to Active'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RESOLVED CHECKS SECTION */}
      {resolved.length > 0 && (
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => setShowResolved(!showResolved)}
            className="w-full flex items-center justify-between p-4 rounded-2xl border text-xs font-bold transition-colors cursor-pointer"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                {isAr ? 'الإعدادات المكتملة والمحققة بنجاح' : 'Verified & Completed Setup Items'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {resolved.length}
              </span>
            </div>
            {showResolved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showResolved && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {resolved.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border flex items-start gap-3 bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/50"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                      {isAr ? item.title_ar : item.title_en}
                    </h5>
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      ✓ {isAr ? item.details_ar : item.details_en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
