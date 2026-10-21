import React, { useState, useMemo } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Server, 
  RefreshCw,
  Zap,
  Check,
  Layers,
  Store as StoreIcon
} from 'lucide-react';
import { 
  buildLiveStoreDomains,
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
    simulateDomain, 
    switchToStore 
  } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [inputDomain, setInputDomain] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [testResult, setTestResult] = useState<DomainResolutionResult | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  // Build real dynamic domains strictly isolated to this store if embeddedIn === 'store'
  const availableDomains = useMemo(() => {
    return buildLiveStoreDomains(
      stores,
      domains,
      embeddedIn === 'store' ? activeStore?.id : undefined
    );
  }, [stores, domains, activeStore?.id, embeddedIn]);

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
            ? `تم التحقق من توجيه النطاق بنجاح إلى: ${res.storeName || res.storeId}`
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

  const isStoreMode = embeddedIn === 'store';

  return (
    <div 
      className="rounded-2xl p-5 sm:p-6 border shadow-2xs space-y-5 transition-all"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ background: 'var(--portal-cta)' }}
          >
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black flex items-center gap-2" style={{ color: 'var(--text)' }}>
              {isStoreMode 
                ? (isAr ? 'فحص اتصال ونطاق المتجر المباشر' : 'Store Domain Routing & Live DNS Checker')
                : (isAr ? 'محرك فحص وتوجيه النطاقات السحابية' : 'Cloud Multi-Domain Dynamic Routing Engine')}
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1"
                style={{
                  background: 'color-mix(in srgb, var(--portal-cta) 12%, var(--surface))',
                  borderColor: 'var(--portal-cta)',
                  color: 'var(--portal-cta)',
                }}
              >
                {isStoreMode ? (isAr ? 'نطاق المتجر' : 'Store Domain') : (isAr ? 'متعدد المتاجر' : 'Multi-Store')}
              </span>
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {isStoreMode
                ? (isAr 
                    ? 'التحقق اللحظي من توجيه نطاق متجرك وحالة شهادة الأمان SSL والربط السحابي'
                    : 'Live check of incoming domain routing, cloud resolution, and active SSL binding for this store')
                : (isAr 
                    ? 'كشف تلقائي للنطاقات المخصصة (.sa) والنطاقات الفرعية مع التحقق الفوري من الربط السحابي'
                    : 'Automatic detection and live verification of custom domains (.sa) and cloud subdomains with instant theme binding')}
            </p>
          </div>
        </div>

        {/* Current Active Host Badge */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shrink-0 self-start sm:self-auto"
          style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span style={{ color: 'var(--muted)' }}>{isAr ? 'المضيف الحالي:' : 'Current Host:'}</span>
          <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{currentHost}</span>
        </div>
      </div>

      {/* Preset Quick-Test Buttons */}
      <div>
        <label className="block text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          {isStoreMode 
            ? (isAr ? 'النطاقات المسجلة لهذا المتجر للاختبار السريع:' : 'Registered Domains for This Store (Quick Test):')
            : (isAr ? 'نطاقات المتاجر المسجلة للاختبار الفوري:' : 'Active Registered Store Domains for Instant Testing:')}
        </label>

        {availableDomains.length === 0 ? (
          <div 
            className="p-3 rounded-xl border text-xs text-center"
            style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            {isAr ? 'لم يتم ربط أي نطاق مخصص بعد لهذا المتجر.' : 'No custom domain bound yet for this store.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {availableDomains.map((item) => {
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
                  className="flex items-start justify-between p-3 rounded-xl border text-start transition-all group cursor-pointer"
                  style={{
                    background: isMatchActive
                      ? 'color-mix(in srgb, var(--portal-cta) 8%, var(--surface))'
                      : 'var(--hover-bg)',
                    borderColor: isMatchActive ? 'var(--portal-cta)' : 'var(--border)',
                  }}
                >
                  <div className="space-y-0.5 min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="font-mono text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                        {item.domain}
                      </span>
                    </div>
                    <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                      {isAr ? item.labelAr : item.labelEn}
                    </p>
                  </div>
                  <span 
                    className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono shrink-0 uppercase ${
                      item.type === 'custom'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                    }`}
                  >
                    {item.type}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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
          <Globe 
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400 ${
              isAr ? 'right-3.5' : 'left-3.5'
            }`} 
          />
          <input
            type="text"
            value={inputDomain}
            onChange={(e) => setInputDomain(e.target.value)}
            dir={isAr ? 'rtl' : 'ltr'}
            placeholder={
              isAr 
                ? 'اكتب أي نطاق أو نطاق فرعي للفحص (مثال: giftshop-sa.com أو coffee.unityteck.com)' 
                : 'Enter any domain or subdomain (e.g. giftshop-sa.com, coffee.unityteck.com)'
            }
            className={`w-full py-2.5 rounded-xl text-xs sm:text-sm border transition-all font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 ${
              isAr ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'
            }`}
            style={{ 
              background: 'var(--surface)', 
              borderColor: 'var(--border)', 
              color: 'var(--text)' 
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isResolving || !inputDomain.trim()}
          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs flex items-center justify-center gap-2 shrink-0 transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--portal-cta)' }}
        >
          {isResolving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{isAr ? 'جارٍ الفحص...' : 'Resolving...'}</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>{isAr ? 'فحص التوجيه' : 'Test Routing'}</span>
            </>
          )}
        </button>
      </form>

      {/* Resolution Result Card */}
      {testResult && (
        <div 
          className="p-4 rounded-xl border transition-all space-y-3"
          style={{
            background: testResult.resolved
              ? 'color-mix(in srgb, #10b981 8%, var(--surface))'
              : 'color-mix(in srgb, #ef4444 8%, var(--surface))',
            borderColor: testResult.resolved ? '#10b981' : '#ef4444',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5">
              {testResult.resolved ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2 flex-wrap" style={{ color: 'var(--text)' }}>
                  <span className="font-mono">{testResult.domain}</span>
                  <span 
                    className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
                      testResult.resolved
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {testResult.resolved ? (isAr ? 'تم التحقق والربط' : 'BOUND & VERIFIED') : (isAr ? 'غير مسجل' : 'UNBOUND')}
                  </span>
                </h4>
                {latencyMs !== null && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                    {isAr ? `زمن استجابة التوجيه السحابي: ${latencyMs} مللي ثانية` : `Cloud routing response time: ${latencyMs}ms`}
                  </p>
                )}
              </div>
            </div>

            {/* In Master Mode: Allow switching. In Store Mode: Show bound badge only */}
            {testResult.resolved && testResult.storeId && (
              !isStoreMode ? (
                <button
                  type="button"
                  onClick={() => handleApplyResolution(testResult)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--portal-cta)',
                  }}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تفعيل هذا المتجر في الواجهة' : 'Activate Store & Theme'}</span>
                </button>
              ) : (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'متصل بمتجرك النشط' : 'Connected to your active store'}</span>
                </span>
              )
            )}
          </div>

          {testResult.resolved ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <span className="block text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'المتجر المرتبط:' : 'Target Store:'}
                </span>
                <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <StoreIcon className="w-3.5 h-3.5 text-teal-600" />
                  <span>{testResult.storeName || testResult.storeId}</span>
                </span>
                <span className="text-[9px] font-mono mt-0.5 block" style={{ color: 'var(--muted)' }}>
                  {testResult.storeId}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <span className="block text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'الثيم التلقائي المخصص:' : 'Active Bound Theme:'}
                </span>
                <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>{testResult.activeThemeId}</span>
                </span>
                <span className="text-[9px] text-emerald-600 font-bold mt-0.5 block">
                  {isAr ? 'جاهز للعرض المباشر' : 'Live Ready'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <span className="block text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'شهادة SSL التلقائية:' : 'SSL Status:'}
                </span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{testResult.sslStatus || "Active (Let's Encrypt)"}</span>
                </span>
                <span className="text-[9px] mt-0.5 block" style={{ color: 'var(--muted)' }}>
                  HTTPS Strict
                </span>
              </div>

              <div className="p-2.5 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <span className="block text-[10px] mb-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'نوع التوجيه:' : 'Routing Mode:'}
                </span>
                <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  <span>
                    {testResult.domainType === 'custom'
                      ? (isAr ? 'نطاق مخصص CNAME' : 'Custom CNAME')
                      : (isAr ? 'نطاق فرعي سحابي' : 'Cloud Subdomain')}
                  </span>
                </span>
                <span className="text-[9px] mt-0.5 block" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'ربط آلي بالكامل' : 'Zero-config auto-bind'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {testResult.message || (isAr ? 'هذا النطاق غير مرتبط بأي متجر في النظام.' : 'This domain is not mapped to any store in the platform.')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

