import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Server, 
  ExternalLink, 
  RefreshCw,
  Search,
  Zap,
  Check,
  Terminal,
  Layers,
  Store as StoreIcon
} from 'lucide-react';
import { 
  PRESET_SIMULATED_DOMAINS, 
  SimulatedDomain, 
  normalizeHostname 
} from '../../../services/domainRoutingService';
import { DomainResolutionResult } from '../../../types';

interface DomainRoutingTesterProps {
  embeddedIn?: 'master' | 'store';
}

export const DomainRoutingTester: React.FC<DomainRoutingTesterProps> = ({ embeddedIn = 'master' }) => {
  const { 
    activeStore, 
    stores, 
    domains, 
    resolvedDomain, 
    simulateDomain, 
    switchToStore, 
    storeActiveTheme 
  } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [inputDomain, setInputDomain] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [testResult, setTestResult] = useState<DomainResolutionResult | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  const handleRunTest = async (domainToTest: string) => {
    const clean = normalizeHostname(domainToTest);
    if (!clean) return;

    setIsResolving(true);
    setTestResult(null);
    const start = performance.now();

    try {
      const res = await simulateDomain(clean);
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setTestResult(res);

      if (res.resolved) {
        toast(
          isAr
            ? `تم توجيه النطاق بنجاح إلى: ${res.storeName || res.storeId}`
            : `Domain successfully routed to: ${res.storeName || res.storeId}`,
          'success'
        );
      } else {
        toast(
          isAr
            ? `النطاق غير مقترن بأي متجر مسجل: ${clean}`
            : `Domain not bound to any registered store: ${clean}`,
          'info'
        );
      }
    } catch (err: any) {
      toast(err?.message || 'Resolution failed', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  const handleApplyResolution = (result: DomainResolutionResult) => {
    if (!result.resolved || !result.storeId) return;
    switchToStore(result.storeId);
    toast(
      isAr
        ? `تم تعيين المتجر النشط إلى ${result.storeName || result.storeId} مع الثيم المخصص`
        : `Active store switched to ${result.storeName || result.storeId} with custom theme`,
      'success'
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {isAr ? 'محرك التوجيه الديناميكي للنطاقات المتعددة' : 'Multi-Domain Dynamic Store Routing Engine'}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Phase 6.1
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr 
                ? 'كشف تلقائي للنطاقات المخصصة (.sa) والنطاقات الفرعية السحابية مع ربط المتجر والثيم فورياً بدون إعادة توجيه يدوية'
                : 'Automatic detection of incoming custom domains (.sa) and cloud subdomains with instant store & theme binding'}
            </p>
          </div>
        </div>

        {/* Current Active Host Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-400">{isAr ? 'المضيف الحالي:' : 'Current Host:'}</span>
          <span className="font-mono text-emerald-300 font-semibold">{currentHost}</span>
        </div>
      </div>

      {/* Preset Quick-Test Buttons */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {isAr ? 'نطاقات تجريبية جاهزة للاختبار الفوري:' : 'Preset Domains for Instant Testing:'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PRESET_SIMULATED_DOMAINS.map((item) => {
            const isMatchActive = activeStore?.id === item.expectedStoreId;
            return (
              <button
                key={item.domain}
                type="button"
                onClick={() => {
                  setInputDomain(item.domain);
                  void handleRunTest(item.domain);
                }}
                disabled={isResolving}
                className={`flex items-start justify-between p-3 rounded-xl border text-left transition-all group ${
                  isMatchActive
                    ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-white">
                      {item.domain}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {isAr ? item.labelAr : item.labelEn}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  item.type === 'custom'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                }`}>
                  {item.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Input Search Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (inputDomain) void handleRunTest(inputDomain);
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={inputDomain}
            onChange={(e) => setInputDomain(e.target.value)}
            placeholder={isAr ? 'اكتب أي نطاق أو نطاق فرعي (مثلاً: specialtycoffee.sa أو car.unityteck.com)' : 'Enter any domain or subdomain (e.g. specialtycoffee.sa, car.unityteck.com)'}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={isResolving || !inputDomain.trim()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
        >
          {isResolving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {isAr ? 'جارٍ الفحص...' : 'Resolving...'}
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-emerald-200" />
              {isAr ? 'اختبار التوجيه' : 'Test Routing'}
            </>
          )}
        </button>
      </form>

      {/* Resolution Result Card */}
      {testResult && (
        <div className={`p-4 rounded-xl border transition-all ${
          testResult.resolved
            ? 'bg-slate-950/80 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
            : 'bg-rose-950/10 border-rose-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2.5">
              {testResult.resolved ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="font-mono">{testResult.domain}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    testResult.resolved
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {testResult.resolved ? (isAr ? 'تم التعرف والربط' : 'BOUND & VERIFIED') : (isAr ? 'غير مسجل' : 'UNBOUND')}
                  </span>
                </h4>
                {latencyMs !== null && (
                  <p className="text-[11px] text-slate-400">
                    {isAr ? `زمن استجابة التوجيه السحابي: ${latencyMs} مللي ثانية` : `Cloud routing response time: ${latencyMs}ms`}
                  </p>
                )}
              </div>
            </div>

            {testResult.resolved && testResult.storeId && (
              <button
                type="button"
                onClick={() => handleApplyResolution(testResult)}
                className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Check className="w-3.5 h-3.5" />
                {isAr ? 'تفعيل هذا المتجر في الواجهة' : 'Activate Store & Theme'}
              </button>
            )}
          </div>

          {testResult.resolved ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">{isAr ? 'المتجر المرتبط:' : 'Target Store:'}</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <StoreIcon className="w-3.5 h-3.5 text-blue-400" />
                  {testResult.storeName || testResult.storeId}
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{testResult.storeId}</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">{isAr ? 'الثيم التلقائي المخصص:' : 'Active Bound Theme:'}</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  {testResult.activeThemeId}
                </span>
                <span className="text-[10px] text-emerald-400 mt-0.5 block">{isAr ? 'جاهز للعرض المباشر' : 'Live Ready'}</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">{isAr ? 'شهادة SSL التلقائية:' : 'SSL Status:'}</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {testResult.sslStatus || 'Active (Let\'s Encrypt)'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">HTTPS Strict</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">{isAr ? 'نوع التوجيه:' : 'Routing Mode:'}</span>
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  {testResult.domainType === 'custom' ? (isAr ? 'نطاق مخصص CNAME' : 'Custom CNAME') : (isAr ? 'نطاق فرعي سحابي' : 'Cloud Subdomain')}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">{isAr ? 'ربط آلي بالكامل' : 'Zero-config auto-bind'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-300 pt-3">
              {testResult.message || (isAr ? 'هذا النطاق غير مرتبط بأي متجر في النظام.' : 'This domain is not mapped to any store in the platform.')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
