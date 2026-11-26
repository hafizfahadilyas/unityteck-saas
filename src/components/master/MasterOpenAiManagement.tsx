import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  RefreshCw,
  Save,
  RotateCcw,
  Shield,
  CreditCard,
  AlertTriangle,
  KeyRound,
  Activity,
  Unlock,
  Store,
} from 'lucide-react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { GlobalModal } from '../common/GlobalModal';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { MasterLuxePanel, masterGhostBtnClass } from './MasterUiKit';
import {
  fetchOpenAiOverview,
  fetchOpenAiStore,
  fetchOpenAiStores,
  resetOpenAiStore,
  runOpenAiComplete,
  saveOpenAiStore,
  unlockOpenAiPayment,
  unlockOpenAiSuite,
  incrementAiLimits,
  updateOpenAiGlobal,
  type OpenAiStoreConfig,
  type OpenAiStoreRow,
} from '../../services/masterOpenAiApi';
import { MasterOpenAiImagePanel } from './MasterOpenAiImagePanel';
import { MasterOpenAiAutomationPanel } from './MasterOpenAiAutomationPanel';

type View = 'dashboard' | 'configure';
type ModuleTab = 'text' | 'image' | 'automation';

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const MasterOpenAiManagement: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [moduleTab, setModuleTab] = useState<ModuleTab>('text');
  const [view, setView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof fetchOpenAiOverview>> | null>(
    null,
  );
  const [stores, setStores] = useState<OpenAiStoreRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [config, setConfig] = useState<OpenAiStoreConfig | null>(null);
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [audits, setAudits] = useState<Array<Record<string, unknown>>>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [payContext, setPayContext] = useState<string>('');
  const [testPrompt, setTestPrompt] = useState('');
  const [testBusy, setTestBusy] = useState(false);
  const [testOut, setTestOut] = useState('');
  const [suiteBusy, setSuiteBusy] = useState(false);
  const [suiteStoreId, setSuiteStoreId] = useState('');
  const [suiteMethod, setSuiteMethod] = useState<'comp' | 'mark_paid'>('comp');
  const [suiteDays, setSuiteDays] = useState(30);
  const [suiteResult, setSuiteResult] = useState<string>('');
  const [incBusy, setIncBusy] = useState(false);
  const [incResult, setIncResult] = useState<string>('');

  const t = useMemo(
    () => ({
      title: isAr ? 'مركز الذكاء الاصطناعي' : 'AI Hub',
      sub: isAr
        ? 'مجلدات المتجر مرآة هنا · الماستر يفتح المتجر أو الكل فوراً'
        : 'Folders mirror the store AI page · Master unlocks one store or all instantly',
      refresh: isAr ? 'تحديث' : 'Refresh',
      totalReq: isAr ? 'إجمالي الطلبات' : 'Total requests',
      totalTok: isAr ? 'إجمالي الرموز' : 'Total tokens',
      totalCost: isAr ? 'تكلفة واجهة البرمجة' : 'API cost',
      active: isAr ? 'متاجر مفعّلة' : 'Active stores',
      near: isAr ? 'قرب الحد' : 'Near limit',
      disabled: isAr ? 'معطّلة' : 'Disabled',
      provider: isAr ? 'حالة المزوّد' : 'Provider status',
      key: isAr ? 'مفتاح واجهة البرمجة' : 'API key',
      configured: isAr ? 'مُعدّ (مخفي)' : 'Configured (masked)',
      notConfigured: isAr ? 'غير مُعدّ' : 'Not configured',
      enableGlobal: isAr ? 'تفعيل OpenAI عالمياً' : 'Enable OpenAI globally',
      emergency: isAr ? 'إيقاف طارئ' : 'Emergency disable',
      manage: isAr ? 'إدارة' : 'Manage',
      save: isAr ? 'حفظ الإعدادات' : 'Save configuration',
      cancel: isAr ? 'إلغاء' : 'Cancel',
      reset: isAr ? 'إعادة للافتراضي' : 'Reset to default',
      proOnly: isAr
        ? 'الاستخدام الفعلي يتطلب خطة احترافية + دفع'
        : 'Actual usage requires Pro plan + payment',
      payTitle: isAr ? 'خيارات الدفع للتفعيل' : 'Payment options to unlock usage',
      payBody: isAr
        ? 'الصفحة تعرض كل الإعدادات. لتنفيذ طلبات OpenAI يجب فتح الاستخدام عبر الدفع أو المنح.'
        : 'The page shows full settings. Running OpenAI requires unlocking usage via payment or grant.',
      markPaid: isAr ? 'تعليمسيم كمدفوع (30 يوماً)' : 'Mark paid (30 days)',
      comp: isAr ? 'منح مجاني (Master)' : 'Comp (Master grant)',
      points: isAr ? 'خصم من نقاط الخدمات' : 'Redeem services points',
      runTest: isAr ? 'تجربة طلب' : 'Run test request',
      empty: isAr ? 'لا توجد سجلات بعد' : 'No records yet',
      back: isAr ? 'العودة للوحة' : 'Back to dashboard',
    }),
    [isAr],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, st] = await Promise.all([fetchOpenAiOverview(), fetchOpenAiStores()]);
      setOverview(ov);
      setStores(st.data || []);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadStore = useCallback(
    async (storeId: string) => {
      setLoading(true);
      try {
        const res = await fetchOpenAiStore(storeId);
        setSelectedId(storeId);
        setConfig(res.config);
        setUsage(res.usage);
        setHistory(res.config_history || []);
        setLogs(res.usage_logs || []);
        setAudits(res.security_events || []);
        setView('configure');
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), 'error');
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!suiteStoreId && stores.length) {
      setSuiteStoreId(selectedId || stores[0]?.store_id || '');
    }
  }, [stores, selectedId, suiteStoreId]);

  const onUnlockSuite = async (scope: 'store' | 'all') => {
    if (scope === 'store' && !suiteStoreId.trim()) {
      toast(isAr ? 'اختر متجراً' : 'Pick a store', 'error');
      return;
    }
    setSuiteBusy(true);
    setSuiteResult('');
    try {
      const res = await unlockOpenAiSuite({
        scope,
        store_id: scope === 'store' ? suiteStoreId.trim() : undefined,
        method: suiteMethod,
        days: suiteDays,
      });
      const line = isAr
        ? `فُتح: ${res.unlocked_count} · تخطي (ليس احترافي): ${res.skipped_count}`
        : `Unlocked: ${res.unlocked_count} · Skipped (not Pro): ${res.skipped_count}`;
      setSuiteResult(line);
      toast(line, res.unlocked_count > 0 ? 'success' : 'info');
      void loadDashboard();
      if (scope === 'store' && suiteStoreId) {
        void loadStore(suiteStoreId);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setSuiteBusy(false);
    }
  };

  const onIncrementLimits = async (preset: 'images' | 'text' | 'auto' | 'pack') => {
    if (!suiteStoreId.trim()) {
      toast(isAr ? 'اختر متجراً' : 'Pick a store', 'error');
      return;
    }
    setIncBusy(true);
    setIncResult('');
    try {
      const body =
        preset === 'images'
          ? { images_monthly_delta: 20, images_daily_delta: 5 }
          : preset === 'text'
            ? { text_daily_delta: 20000, text_monthly_delta: 100000 }
            : preset === 'auto'
              ? { auto_daily_delta: 20, auto_monthly_delta: 100 }
              : {
                  images_monthly_delta: 20,
                  images_daily_delta: 5,
                  text_daily_delta: 20000,
                  text_monthly_delta: 100000,
                  auto_daily_delta: 20,
                  auto_monthly_delta: 100,
                };
      const res = await incrementAiLimits(suiteStoreId.trim(), {
        ...body,
        method: suiteMethod,
        days: suiteDays,
      });
      const line = isAr
        ? `تم الرفع · صور يومي ${res.limits.images_daily} / شهري ${res.limits.images_monthly} · نص يومي ${res.limits.text_daily_tokens}`
        : `Raised · images day ${res.limits.images_daily} / mo ${res.limits.images_monthly} · text day ${res.limits.text_daily_tokens}`;
      setIncResult(line);
      toast(line, 'success');
      void loadDashboard();
      void loadStore(suiteStoreId.trim());
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setIncBusy(false);
    }
  };

  const patchConfig = <K extends keyof OpenAiStoreConfig>(key: K, value: OpenAiStoreConfig[K]) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const onSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await saveOpenAiStore(config.store_id, {
        enabled: config.enabled,
        intelligence_level: config.intelligence_level,
        text_model: config.text_model,
        reasoning_effort: config.reasoning_effort,
        prompt_caching_enabled: config.prompt_caching_enabled,
        daily_token_limit: config.daily_token_limit,
        monthly_token_limit: config.monthly_token_limit,
        max_input_tokens: config.max_input_tokens,
        max_output_tokens: config.max_output_tokens,
        daily_request_limit: config.daily_request_limit,
        monthly_request_limit: config.monthly_request_limit,
        daily_budget_usd: config.daily_budget_usd,
        monthly_budget_usd: config.monthly_budget_usd,
        max_cost_per_request_usd: config.max_cost_per_request_usd,
        warning_threshold_pct: config.warning_threshold_pct,
        auto_stop_at_budget: config.auto_stop_at_budget,
        allow_admin_override: config.allow_admin_override,
        payment_required_for_usage: config.payment_required_for_usage,
        rate_limit_per_minute: config.rate_limit_per_minute,
        config_status: config.config_status,
        audit_logging_enabled: config.audit_logging_enabled,
      });
      setConfig(res.config);
      toast(isAr ? 'تم الحفظ' : 'Saved', 'success');
      void loadDashboard();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/pro_required|Pro/i.test(msg)) {
        setPayContext(msg);
        setPayOpen(true);
      }
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const onReset = async () => {
    if (!config) return;
    const ok = window.confirm(
      isAr ? 'إعادة الإعدادات للافتراضي؟' : 'Reset this store OpenAI config to defaults?',
    );
    if (!ok) return;
    setSaving(true);
    try {
      const res = await resetOpenAiStore(config.store_id);
      setConfig(res.config);
      toast(isAr ? 'تمت الإعادة' : 'Reset done', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onUnlock = async (method: 'mark_paid' | 'comp' | 'services_points') => {
    if (!selectedId && !config?.store_id) return;
    const id = config?.store_id || selectedId;
    setSaving(true);
    try {
      const res = await unlockOpenAiPayment(id, method, 30);
      setConfig(res.config);
      setPayOpen(false);
      toast(isAr ? 'تم فتح الاستخدام' : 'Usage unlocked', 'success');
      void loadDashboard();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    if (!config) return;
    if (!config.pro_eligible || (config.payment_required_for_usage && !config.usage_unlocked)) {
      setPayContext(t.proOnly);
      setPayOpen(true);
      return;
    }
    setTestBusy(true);
    setTestOut('');
    try {
      const res = await runOpenAiComplete(config.store_id, testPrompt || 'Say hello in one short sentence.');
      if (!res.ok) {
        if (res.payment_required || res.code === 'pro_required' || res.code === 'payment_required') {
          setPayContext(res.message || t.proOnly);
          setPayOpen(true);
        }
        toast(res.message || (isAr ? 'فشل الطلب' : 'Request failed'), 'error');
        return;
      }
      setTestOut(String(res.data?.content || ''));
      await loadStore(config.store_id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/payment|pro_required|402/i.test(msg)) {
        setPayContext(msg);
        setPayOpen(true);
      }
      toast(msg, 'error');
    } finally {
      setTestBusy(false);
    }
  };

  const toggleGlobal = async (patch: Record<string, unknown>) => {
    try {
      await updateOpenAiGlobal(patch);
      await loadDashboard();
      toast(isAr ? 'تم تحديث المزوّد' : 'Provider updated', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    }
  };

  const cards = overview?.overview;

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={t.title}
        subtitle={t.sub}
        actions={
          <button
            type="button"
            className={masterGhostBtnClass}
            onClick={() => (view === 'configure' ? void loadStore(selectedId) : void loadDashboard())}
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
        }
      />

      <MasterLuxePanel>
        <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
          {isAr ? 'خريطة الذكاء الاصطناعي في المنصة' : 'Platform AI map'}
        </div>
        <ul className="text-sm space-y-1.5" style={{ color: 'var(--muted)' }}>
          <li>
            {isAr
              ? 'لوحة المتجر: صفحة واحدةحدة بأدوات الذكاء داخل مجلدات (نص · صور · أتمتة · مطوّر · قريباً).'
              : 'Store dashboard: one AI page with category folders (text · images · automation · developer · soon).'}
          </li>
          <li>
            {isAr
              ? 'الماستر فقط يفتح الحزمة (نص + صور + أتمتة) لمتجر واحد أو لكل المتاجر الاحترافية فوراً.'
              : 'Master only unlocks the suite (text + images + automation) for one store or all Pro stores instantly.'}
          </li>
          <li>
            {isAr
              ? 'غير الاحترافي يُتخطى — بلا فتح وهمي. استوديو التصاميم والنشر الاجتماعي منفصلان.'
              : 'Non-Pro stores are skipped — no fake unlock. Design Studio and Social stay separate.'}
          </li>
        </ul>
      </MasterLuxePanel>

      <MasterLuxePanel>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Unlock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {isAr ? 'فتح فوري للحزمة' : 'Instant suite unlock'}
          </div>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'يفتح النص والصور والأتمتة معاً. المتاجر غير الاحترافية تُتخطى.'
            : 'Unlocks text, images, and automation together. Non-Pro stores are skipped.'}
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-[11px] font-bold space-y-1 min-w-[180px]">
            <span style={{ color: 'var(--muted)' }}>{isAr ? 'المتجر' : 'Store'}</span>
            <select
              value={suiteStoreId}
              onChange={(e) => setSuiteStoreId(e.target.value)}
              className="block w-full rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            >
              {stores.length === 0 ? (
                <option value="">{isAr ? 'لا متاجر' : 'No stores'}</option>
              ) : (
                stores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    {s.store_name || s.store_id}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="text-[11px] font-bold space-y-1">
            <span style={{ color: 'var(--muted)' }}>{isAr ? 'الطريقة' : 'Method'}</span>
            <select
              value={suiteMethod}
              onChange={(e) => setSuiteMethod(e.target.value as 'comp' | 'mark_paid')}
              className="block rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            >
              <option value="comp">{isAr ? 'منح الماستر' : 'Master comp'}</option>
              <option value="mark_paid">{isAr ? 'مدفوع' : 'Mark paid'}</option>
            </select>
          </label>
          <label className="text-[11px] font-bold space-y-1">
            <span style={{ color: 'var(--muted)' }}>{isAr ? 'الأيام' : 'Days'}</span>
            <input
              type="number"
              min={1}
              max={366}
              value={suiteDays}
              onChange={(e) => setSuiteDays(Math.max(1, Math.min(366, Number(e.target.value) || 30)))}
              className="block w-20 rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </label>
          <button
            type="button"
            className="unity-btn-primary text-sm px-3 py-2 flex items-center gap-1.5"
            disabled={suiteBusy || !suiteStoreId}
            aria-busy={suiteBusy}
            onClick={() => void onUnlockSuite('store')}
          >
            <Store className="w-4 h-4" />
            {isAr ? 'فتح لهذا المتجر' : 'Unlock this store'}
          </button>
          <button
            type="button"
            className={masterGhostBtnClass}
            disabled={suiteBusy || stores.length === 0}
            aria-busy={suiteBusy}
            onClick={() => void onUnlockSuite('all')}
          >
            <Unlock className="w-4 h-4" />
            {isAr ? 'فتح لكل المتاجر الاحترافية' : 'Unlock all Pro stores'}
          </button>
        </div>
        {suiteResult ? (
          <p className="text-xs mt-3 font-semibold" style={{ color: 'var(--accent)' }}>
            {suiteResult}
          </p>
        ) : null}
      </MasterLuxePanel>

      <MasterLuxePanel>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {isAr ? 'زيادة حدود الذكاء (عند النفاد / القفل)' : 'Increment AI limits (when empty / locked)'}
          </div>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'يرفع الحصة اليومية/الشهرية ويعيد الفتح بدون إعادة قفل تلقائي. يظهر للمتجر في شريط المحاسبة أعلى صفحة أدوات الذكاء.'
            : 'Raises daily/monthly quotas and re-unlocks without auto-relock. Store sees it on the AI Tools accounting meter.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="unity-btn-primary text-sm px-3 py-2"
            disabled={incBusy || !suiteStoreId}
            aria-busy={incBusy}
            onClick={() => void onIncrementLimits('pack')}
          >
            {isAr ? 'حزمة كاملة (+صور +نص +أتمتة)' : 'Full pack (+images +text +auto)'}
          </button>
          <button
            type="button"
            className={masterGhostBtnClass}
            disabled={incBusy || !suiteStoreId}
            onClick={() => void onIncrementLimits('images')}
          >
            {isAr ? '+صور (+5 يوم / +20 شهر)' : '+Images (+5 day / +20 mo)'}
          </button>
          <button
            type="button"
            className={masterGhostBtnClass}
            disabled={incBusy || !suiteStoreId}
            onClick={() => void onIncrementLimits('text')}
          >
            {isAr ? '+نص' : '+Text'}
          </button>
          <button
            type="button"
            className={masterGhostBtnClass}
            disabled={incBusy || !suiteStoreId}
            onClick={() => void onIncrementLimits('auto')}
          >
            {isAr ? '+أتمتة' : '+Automation'}
          </button>
        </div>
        {incResult ? (
          <p className="text-xs mt-3 font-semibold" style={{ color: 'var(--accent)' }}>
            {incResult}
          </p>
        ) : null}
      </MasterLuxePanel>

      <div className="flex flex-wrap gap-2 mb-4 mt-4">
        {(
          [
            ['text', isAr ? 'النص والنماذج' : 'Text & models'],
            ['image', isAr ? 'الصور' : 'Images'],
            ['automation', isAr ? 'الأتمتة والأسئلة' : 'Automation Q&A'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={moduleTab === id ? 'unity-btn-primary text-sm px-3 py-1.5' : masterGhostBtnClass}
            onClick={() => {
              setModuleTab(id);
              if (id !== 'text') setView('dashboard');
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {moduleTab === 'image' && (
        stores.length === 0 ? (
          <MasterLuxePanel>
            <p style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'لا متاجر بعد — أو تعذر تحميل القائمة. حدّث الصفحة بعد التأكد من اتصال واجهة البرمجة.'
                : 'No stores yet — or list failed to load. Refresh after the API is reachable.'}
            </p>
          </MasterLuxePanel>
        ) : (
          <MasterOpenAiImagePanel
            storeId={selectedId || stores[0]?.store_id || ''}
            storeOptions={stores.map((s) => ({ store_id: s.store_id, store_name: s.store_name }))}
          />
        )
      )}

      {moduleTab === 'automation' && (
        stores.length === 0 ? (
          <MasterLuxePanel>
            <p style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'لا متاجر بعد — أو تعذر تحميل القائمة. حدّث الصفحة بعد التأكد من اتصال واجهة البرمجة.'
                : 'No stores yet — or list failed to load. Refresh after the API is reachable.'}
            </p>
          </MasterLuxePanel>
        ) : (
          <MasterOpenAiAutomationPanel
            storeId={selectedId || stores[0]?.store_id || ''}
            storeOptions={stores.map((s) => ({ store_id: s.store_id, store_name: s.store_name }))}
          />
        )
      )}

      {moduleTab === 'text' && loading && !config ? (
        <p style={{ color: 'var(--muted)' }}>{isAr ? 'جاري التحميل…' : 'Loading…'}</p>
      ) : null}

      {moduleTab === 'text' && view === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              { label: t.totalReq, value: cards?.total_requests ?? 0 },
              { label: t.totalTok, value: cards?.total_tokens ?? 0 },
              { label: t.totalCost, value: `$${(cards?.total_cost_usd ?? 0).toFixed(4)}` },
              { label: t.active, value: cards?.active_stores ?? 0 },
              { label: t.near, value: cards?.stores_near_limit ?? 0 },
              { label: t.disabled, value: cards?.stores_disabled ?? 0 },
            ].map((c) => (
              <MasterLuxePanel key={c.label}>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  {c.label}
                </div>
                <div className="text-2xl font-semibold mt-1" style={{ color: 'var(--text)' }}>
                  {c.value}
                </div>
              </MasterLuxePanel>
            ))}
          </div>

          <MasterLuxePanel>
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <div>
                  <div className="font-medium">{t.provider}</div>
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>
                    {t.key}:{' '}
                    {overview?.api_key?.configured
                      ? `${t.configured} ${overview.api_key.masked || ''}`
                      : t.notConfigured}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!overview?.global?.enabled}
                    onChange={(e) => void toggleGlobal({ enabled: e.target.checked })}
                  />
                  {t.enableGlobal}
                </label>
                <label className="flex items-center gap-2 text-sm text-rose-600">
                  <input
                    type="checkbox"
                    checked={!!overview?.global?.emergency_disabled}
                    onChange={(e) => void toggleGlobal({ emergency_disabled: e.target.checked })}
                  />
                  {t.emergency}
                </label>
              </div>
            </div>
            <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
              {t.proOnly}
            </p>
          </MasterLuxePanel>

          <MasterLuxePanel>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ color: 'var(--muted)' }}>
                    <th className="text-start py-2 pe-3">{isAr ? 'المتجر' : 'Store'}</th>
                    <th className="text-start py-2 pe-3">{isAr ? 'الخطة' : 'Plan'}</th>
                    <th className="text-start py-2 pe-3">{isAr ? 'الحالة' : 'AI status'}</th>
                    <th className="text-start py-2 pe-3">{isAr ? 'المستوى' : 'Level'}</th>
                    <th className="text-start py-2 pe-3">{isAr ? 'النموذج' : 'Model'}</th>
                    <th className="text-start py-2 pe-3">{isAr ? 'شهري' : 'Monthly'}</th>
                    <th className="text-start py-2 pe-3">{isAr ? 'التكلفة' : 'Cost'}</th>
                    <th className="text-start py-2 pe-3">{isAr ? 'الدفع' : 'Payment'}</th>
                    <th className="text-start py-2">{t.manage}</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6" style={{ color: 'var(--muted)' }}>
                        {t.empty}
                      </td>
                    </tr>
                  ) : (
                    stores.map((row) => (
                      <tr key={row.store_id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-3 pe-3">
                          <div className="font-medium">{row.store_name}</div>
                          <div className="text-xs" style={{ color: 'var(--muted)' }}>
                            {row.store_id}
                          </div>
                        </td>
                        <td className="py-3 pe-3">
                          {row.plan}
                          {!row.pro_eligible ? (
                            <span className="ms-2 text-xs text-amber-600">{isAr ? 'غير احترافي' : 'Not Pro'}</span>
                          ) : null}
                        </td>
                        <td className="py-3 pe-3">{row.enabled ? (isAr ? 'مفعّل' : 'On') : isAr ? 'معطّل' : 'Off'}</td>
                        <td className="py-3 pe-3">{row.intelligence_level}</td>
                        <td className="py-3 pe-3">{row.model}</td>
                        <td className="py-3 pe-3">
                          {num((row.monthly_usage as { tokens_used?: number })?.tokens_used)} /{' '}
                          {num((row.monthly_usage as { tokens_limit?: number })?.tokens_limit)}
                        </td>
                        <td className="py-3 pe-3">${num(row.actual_cost_usd).toFixed(4)}</td>
                        <td className="py-3 pe-3">{row.payment_status}</td>
                        <td className="py-3">
                          <button
                            type="button"
                            className="unity-btn-primary text-xs px-3 py-1.5"
                            onClick={() => void loadStore(row.store_id)}
                          >
                            {t.manage}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </MasterLuxePanel>
        </div>
      )}

      {moduleTab === 'text' && view === 'configure' && config && (
        <div className="space-y-6">
          <button
            type="button"
            className={masterGhostBtnClass}
            onClick={() => {
              setView('dashboard');
              void loadDashboard();
            }}
          >
            {t.back}
          </button>

          {!config.pro_eligible ? (
            <MasterLuxePanel>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <div className="font-medium">{t.proOnly}</div>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'يمكنك عرض كل الحقول وحفظ المسودات. التفعيل والاستخدام يتطلبان خطة احترافية ثم الدفع من النافذة.'
                      : 'You can view all fields and save drafts. Enable + usage need Pro, then payment from the popup.'}
                  </p>
                  <button
                    type="button"
                    className="unity-btn-primary mt-3 text-sm"
                    onClick={() => {
                      setPayContext(t.proOnly);
                      setPayOpen(true);
                    }}
                  >
                    <CreditCard className="w-4 h-4 inline me-1" />
                    {t.payTitle}
                  </button>
                </div>
              </div>
            </MasterLuxePanel>
          ) : null}

          <MasterLuxePanel>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              {isAr ? 'إعدادات المتجر' : 'Store configuration'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm space-y-1">
                <span>{isAr ? 'اختيار المتجر' : 'Select store'}</span>
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  value={config.store_id}
                  onChange={(e) => void loadStore(e.target.value)}
                >
                  {stores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm space-y-1">
                <span>{isAr ? 'معرّف المتجر' : 'Store ID'}</span>
                <input
                  readOnly
                  className="w-full rounded-lg border px-3 py-2 opacity-80"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  value={config.store_id}
                />
              </label>
              <label className="text-sm flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => {
                    if (e.target.checked && !config.pro_eligible) {
                      setPayOpen(true);
                      setPayContext(t.proOnly);
                      return;
                    }
                    patchConfig('enabled', e.target.checked);
                  }}
                />
                {isAr ? 'تفعيل أوبن إي آي للمتجر' : 'Enable OpenAI for store'}
              </label>
              <label className="text-sm space-y-1">
                <span>{isAr ? 'مستوى الذكاء' : 'Intelligence level'}</span>
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  value={config.intelligence_level}
                  onChange={(e) =>
                    patchConfig('intelligence_level', e.target.value as 'low' | 'medium' | 'high')
                  }
                >
                  <option value="low">{isAr ? 'منخفض' : 'Low'}</option>
                  <option value="medium">{isAr ? 'متوسط' : 'Medium'}</option>
                  <option value="high">{isAr ? 'مرتفع' : 'High'}</option>
                </select>
              </label>
              <label className="text-sm space-y-1">
                <span>{isAr ? 'النموذج' : 'Selected model'}</span>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  value={config.text_model || ''}
                  placeholder={overview?.global?.default_text_model || 'gpt-5.4-mini'}
                  onChange={(e) => patchConfig('text_model', e.target.value || null)}
                />
              </label>
              <label className="text-sm space-y-1">
                <span>{isAr ? 'حالة الإعداد' : 'Configuration status'}</span>
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  value={config.config_status}
                  onChange={(e) => patchConfig('config_status', e.target.value)}
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="emergency">emergency</option>
                </select>
              </label>
            </div>
          </MasterLuxePanel>

          <MasterLuxePanel>
            <h3 className="font-semibold mb-4">{isAr ? 'حدود الرموز والطلبات' : 'Token & request limits'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(
                [
                  ['daily_token_limit', isAr ? 'حد الرموز اليومي' : 'Daily token limit'],
                  ['monthly_token_limit', isAr ? 'حد الرموز الشهري' : 'Monthly token limit'],
                  ['max_input_tokens', isAr ? 'أقصى إدخال للطلب' : 'Max input tokens'],
                  ['max_output_tokens', isAr ? 'أقصى إخراج للطلب' : 'Max output tokens'],
                  ['daily_request_limit', isAr ? 'حد الطلبات اليومي' : 'Daily request limit'],
                  ['monthly_request_limit', isAr ? 'حد الطلبات الشهري' : 'Monthly request limit'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-sm space-y-1">
                  <span>{label}</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                    value={config[key] as number}
                    onChange={(e) => patchConfig(key, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
          </MasterLuxePanel>

          <MasterLuxePanel>
            <h3 className="font-semibold mb-4">{isAr ? 'الميزانية' : 'Budget controls'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(
                [
                  ['daily_budget_usd', isAr ? 'ميزانية يومية (دولار)' : 'Daily budget (USD)'],
                  ['monthly_budget_usd', isAr ? 'ميزانية شهرية (دولار)' : 'Monthly budget (USD)'],
                  ['max_cost_per_request_usd', isAr ? 'أقصى تكلفة للطلب' : 'Max cost per request'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-sm space-y-1">
                  <span>{label}</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-lg border px-3 py-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                    value={config[key] as number}
                    onChange={(e) => patchConfig(key, Number(e.target.value))}
                  />
                </label>
              ))}
              <label className="text-sm space-y-1">
                <span>{isAr ? 'عتبة التحذير' : 'Warning threshold'}</span>
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  value={config.warning_threshold_pct}
                  onChange={(e) => patchConfig('warning_threshold_pct', Number(e.target.value))}
                >
                  <option value={50}>50%</option>
                  <option value={80}>80%</option>
                  <option value={90}>90%</option>
                </select>
              </label>
              <label className="text-sm flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={config.auto_stop_at_budget}
                  onChange={(e) => patchConfig('auto_stop_at_budget', e.target.checked)}
                />
                {isAr ? 'إيقاف تلقائي عند 100%' : 'Auto-stop at 100% budget'}
              </label>
              <label className="text-sm flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={config.allow_admin_override}
                  onChange={(e) => patchConfig('allow_admin_override', e.target.checked)}
                />
                {isAr ? 'السماح بتجاوز المدير' : 'Allow admin override'}
              </label>
              <label className="text-sm flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={config.payment_required_for_usage}
                  onChange={(e) => patchConfig('payment_required_for_usage', e.target.checked)}
                />
                {isAr ? 'الدفع مطلوب للاستخدام' : 'Payment required for usage'}
              </label>
            </div>
          </MasterLuxePanel>

          <MasterLuxePanel>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              {isAr ? 'النموذج والأمان' : 'Model & security'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm space-y-1">
                <span>{isAr ? 'جهد الاستدلال' : 'Reasoning effort'}</span>
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  value={config.reasoning_effort || ''}
                  onChange={(e) => patchConfig('reasoning_effort', e.target.value || null)}
                >
                  <option value="">{isAr ? 'تلقائي حسب المستوى' : 'Auto from level'}</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>
              <label className="text-sm space-y-1">
                <span>{isAr ? 'حد الطلبات بالدقيقة' : 'Rate limit / minute'}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  value={config.rate_limit_per_minute}
                  onChange={(e) => patchConfig('rate_limit_per_minute', Number(e.target.value))}
                />
              </label>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                {t.key}:{' '}
                {overview?.api_key?.configured
                  ? `${t.configured} ${overview.api_key.masked || ''}`
                  : t.notConfigured}
              </div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'عزل المتجر:' : 'Store isolation:'}{' '}
                {config.store_isolation_enforced ? (isAr ? 'مفعّل' : 'On') : isAr ? 'معطّل' : 'Off'}
              </div>
            </div>
          </MasterLuxePanel>

          <MasterLuxePanel>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {isAr ? 'الاستخدام الفعلي' : 'Live usage'}
            </h3>
            {usage ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  {isAr ? 'اليوم' : 'Today'}: {JSON.stringify(usage.day)}
                </div>
                <div>
                  {isAr ? 'الشهر' : 'Month'}: {JSON.stringify(usage.month)}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--muted)' }}>{t.empty}</p>
            )}
            <div className="mt-4 space-y-2">
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm min-h-[80px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                placeholder={isAr ? 'نص تجريبي للطلب…' : 'Test prompt…'}
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
              />
              <button
                type="button"
                className="unity-btn-primary text-sm"
                disabled={testBusy}
                aria-busy={testBusy}
                onClick={() => void onTest()}
              >
                {t.runTest}
              </button>
              {testOut ? (
                <pre
                  className="text-xs p-3 rounded-lg overflow-auto"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  {testOut}
                </pre>
              ) : null}
            </div>
          </MasterLuxePanel>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="unity-btn-primary"
              disabled={saving}
              aria-busy={saving}
              onClick={() => void onSave()}
            >
              <Save className="w-4 h-4 inline me-1" />
              {t.save}
            </button>
            <button
              type="button"
              className={masterGhostBtnClass}
              onClick={() => {
                setView('dashboard');
                void loadDashboard();
              }}
            >
              {t.cancel}
            </button>
            <button type="button" className={masterGhostBtnClass} onClick={() => void onReset()}>
              <RotateCcw className="w-4 h-4 inline me-1" />
              {t.reset}
            </button>
            <button
              type="button"
              className={masterGhostBtnClass}
              onClick={() => {
                setPayContext(t.payBody);
                setPayOpen(true);
              }}
            >
              <CreditCard className="w-4 h-4 inline me-1" />
              {t.payTitle}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <MasterLuxePanel>
              <h4 className="font-medium mb-2">{isAr ? 'سجل الإعدادات' : 'Config history'}</h4>
              {history.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {t.empty}
                </p>
              ) : (
                <ul className="text-xs space-y-2 max-h-48 overflow-auto">
                  {history.map((h) => (
                    <li key={String(h.id)}>
                      {String(h.action)} · {String(h.created_at)}
                    </li>
                  ))}
                </ul>
              )}
            </MasterLuxePanel>
            <MasterLuxePanel>
              <h4 className="font-medium mb-2">{isAr ? 'سجل الاستخدام' : 'Usage history'}</h4>
              {logs.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {t.empty}
                </p>
              ) : (
                <ul className="text-xs space-y-2 max-h-48 overflow-auto">
                  {logs.map((h) => (
                    <li key={String(h.id)}>
                      {String(h.status)} · {String(h.total_tokens)} tok · ${num(h.actual_cost_usd).toFixed(4)}
                    </li>
                  ))}
                </ul>
              )}
            </MasterLuxePanel>
            <MasterLuxePanel>
              <h4 className="font-medium mb-2">{isAr ? 'أحداث الأمان' : 'Security events'}</h4>
              {audits.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {t.empty}
                </p>
              ) : (
                <ul className="text-xs space-y-2 max-h-48 overflow-auto">
                  {audits.map((h) => (
                    <li key={String(h.id)}>
                      {String(h.action)} · {String(h.message || '')}
                    </li>
                  ))}
                </ul>
              )}
            </MasterLuxePanel>
          </div>
        </div>
      )}

      <GlobalModal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        aria-label={t.payTitle}
        contentClassName="w-full max-w-lg"
      >
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--surface)', color: 'var(--text)' }}
        >
          <div className="px-5 py-4" style={{ background: 'var(--portal-cta)', color: '#fff' }}>
            <h3 className="font-semibold text-lg">{t.payTitle}</h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {payContext || t.payBody}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="unity-btn-primary"
                disabled={saving}
                onClick={() => void onUnlock('mark_paid')}
              >
                {t.markPaid}
              </button>
              <button
                type="button"
                className={masterGhostBtnClass}
                disabled={saving}
                onClick={() => void onUnlock('comp')}
              >
                {t.comp}
              </button>
              <button
                type="button"
                className={masterGhostBtnClass}
                disabled={saving}
                onClick={() => void onUnlock('services_points')}
              >
                {t.points}
              </button>
            </div>
          </div>
        </div>
      </GlobalModal>
    </AdminPageShell>
  );
};

export default MasterOpenAiManagement;
