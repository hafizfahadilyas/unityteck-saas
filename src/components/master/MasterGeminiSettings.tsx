import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  KeyRound,
  Layers,
  Image as ImageIcon,
  Sliders,
  DollarSign,
  BarChart3,
  FileCode2,
  Settings,
  RefreshCw,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Edit,
  Trash2,
  PauseCircle,
  PlayCircle,
  Activity,
  Zap,
  ShieldCheck,
  Cpu,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import {
  fetchGeminiSettings,
  saveGeminiSettings,
  testGeminiConnection,
  updateGeminiApiKey,
  fetchGeminiModels,
  refreshGeminiModels,
  updateGeminiModel,
  fetchMerchantLimits,
  updateMerchantLimit,
  adjustMerchantCredits,
  fetchPricingOverview,
  fetchAnalytics,
  fetchApiLogs,
  fetchMasterHistory,
  type GeminiProviderInfo,
  type GeminiApiKeyInfo,
  type GeminiProviderConfig,
  type GeminiModelRow,
  type MerchantLimitRow,
  type PricingOverview,
  type AnalyticsOverview,
  type ApiLogRow,
  type HistoryRow,
} from '../../services/masterGeminiApi';

export type GeminiSettingsTab =
  | 'general'
  | 'api_config'
  | 'models'
  | 'image_settings'
  | 'merchant_limits'
  | 'pricing'
  | 'analytics'
  | 'logs'
  | 'advanced';

interface MasterGeminiSettingsProps {
  initialTab?: GeminiSettingsTab;
}

export const MasterGeminiSettings: React.FC<MasterGeminiSettingsProps> = ({ initialTab = 'general' }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<GeminiSettingsTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Core Data
  const [provider, setProvider] = useState<GeminiProviderInfo | null>(null);
  const [apiKeyInfo, setApiKeyInfo] = useState<GeminiApiKeyInfo | null>(null);
  const [config, setConfig] = useState<GeminiProviderConfig | null>(null);
  const [models, setModels] = useState<GeminiModelRow[]>([]);
  const [merchants, setMerchants] = useState<MerchantLimitRow[]>([]);
  const [pricing, setPricing] = useState<PricingOverview | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [logs, setLogs] = useState<ApiLogRow[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Sub-features state
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantLimitRow | null>(null);
  const [creditAmount, setCreditAmount] = useState(50);
  const [creditReason, setCreditReason] = useState('Manual bonus allowance');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | '7d' | '30d'>('30d');
  const [merchantSearch, setMerchantSearch] = useState('');

  // Translations
  const t = useMemo(() => ({
    title: isAr ? 'إدارة الذكاء الاصطناعي (Google Gemini)' : 'Google Gemini AI Management',
    subtitle: isAr
      ? 'لوحة التحكم المتكاملة للمزود الذكي: النماذج الرسمية، إعدادات التوليد، حدود التجار، والتكلفة الفعلية'
      : 'Comprehensive Google Gemini AI configuration: official models, image studio settings, merchant quotas, and actual usage pricing',
    tabs: {
      general: isAr ? 'الإعدادات العامة' : 'General Settings',
      api_config: isAr ? 'تهيئة واجهة البرمجة (API)' : 'API Configuration',
      models: isAr ? 'نماذج الذكاء الاصطناعي' : 'AI Models',
      image_settings: isAr ? 'إعدادات توليد الصور' : 'Image Generation',
      merchant_limits: isAr ? 'حدود وأرصدة التجار' : 'Merchant Limits & Credits',
      pricing: isAr ? 'الأسعار وإدارة التكلفة' : 'Pricing & Costs',
      analytics: isAr ? 'تحليلات الاستخدام' : 'Usage Analytics',
      logs: isAr ? 'سجلات النظام والأخطاء' : 'API Logs & Errors',
      advanced: isAr ? 'إعدادات متقدمة' : 'Advanced Settings',
    },
    save: isAr ? 'حفظ التغييرات' : 'Save Changes',
    saving: isAr ? 'جاري الحفظ...' : 'Saving...',
    testConn: isAr ? 'اختبار الاتصال المباشر' : 'Test API Connection',
    testing: isAr ? 'جاري الاختبار...' : 'Testing...',
    connected: isAr ? 'متصل بنجاح' : 'Connected',
    disconnected: isAr ? 'غير متصل' : 'Disconnected',
    statusActive: isAr ? 'نشط' : 'Active',
    statusDisabled: isAr ? 'معطل' : 'Disabled',
    statusMaint: isAr ? 'صيانة' : 'Maintenance',
  }), [isAr]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, modelsRes, merchantsRes, pricingRes, analyticsRes] = await Promise.all([
        fetchGeminiSettings(),
        fetchGeminiModels(),
        fetchMerchantLimits(),
        fetchPricingOverview(),
        fetchAnalytics({ period: analyticsPeriod }),
      ]);

      setProvider(settingsRes.provider);
      setApiKeyInfo(settingsRes.api_key);
      setConfig(settingsRes.config);
      setModels(modelsRes.models || []);
      setMerchants(merchantsRes.merchants || []);
      setPricing(pricingRes);
      setAnalytics(analyticsRes);
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [analyticsPeriod, toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Handle Tab-specific on-demand loading
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchApiLogs(logsPage).then((res) => {
        setLogs(res.data || []);
        setLogsTotal(res.total || 0);
      });
    }
  }, [activeTab, logsPage]);

  // Test live connection handler
  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await testGeminiConnection();
      if (res.ok) {
        toast(`${isAr ? 'تم التحقق بنجاح مع سيرفرات جوجل! زمن الاستجابة:' : 'Connection verified with Google Gemini! Latency:'} ${res.latency_ms}ms`, 'success');
        if (provider) {
          setProvider({ ...provider, connection_status: 'connected', last_connection_test_at: res.tested_at });
        }
      } else {
        toast(`${isAr ? 'فشل الاتصال:' : 'Connection Failed:'} ${res.message}`, 'error');
        if (provider) {
          setProvider({ ...provider, connection_status: 'failed', last_connection_error: res.message });
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setTesting(false);
    }
  };

  // Save config handler
  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await saveGeminiSettings(config);
      if (res.ok) {
        toast(isAr ? 'تم حفظ إعدادات جيميني بنجاح.' : 'Gemini settings saved successfully.', 'success');
        setConfig(res.config);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save new API Key
  const handleUpdateApiKey = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      const res = await updateGeminiApiKey(keyInput.trim());
      if (res.ok) {
        toast(isAr ? 'تم تحديث مفتاح API بنجاح واختبار الاتصال.' : 'API Key updated and connection tested.', 'success');
        setApiKeyInfo(res.api_key);
        setKeyModalOpen(false);
        setKeyInput('');
        if (provider) {
          setProvider({ ...provider, connection_status: res.connection_test.status, last_connection_test_at: res.connection_test.tested_at });
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Adjust merchant credits
  const handleAdjustCredits = async () => {
    if (!selectedMerchant) return;
    setSaving(true);
    try {
      const res = await adjustMerchantCredits({
        store_id: selectedMerchant.store_id,
        amount: Number(creditAmount),
        reason: creditReason,
      });
      if (res.ok) {
        toast(isAr ? 'تم تحديث رصيد التاجر بنجاح.' : 'Merchant credits adjusted successfully.', 'success');
        setCreditModalOpen(false);
        // Refresh merchant list
        fetchMerchantLimits().then((m) => setMerchants(m.merchants || []));
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filtered merchants
  const filteredMerchants = useMemo(() => {
    if (!merchantSearch.trim()) return merchants;
    const q = merchantSearch.toLowerCase();
    return merchants.filter((m) =>
      m.store_name.toLowerCase().includes(q) || m.store_id.toLowerCase().includes(q)
    );
  }, [merchants, merchantSearch]);

  if (loading && !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
        <span className="text-sm font-medium text-slate-400">
          {isAr ? 'جاري تحميل إعدادات Gemini AI...' : 'Loading Gemini AI configuration...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-12 font-[var(--font-ui)]" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {t.title}
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Google AI Studio
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold">
              <span className="text-slate-400">{isAr ? 'حالة المزود:' : 'Provider:'}</span>
              <span className={`flex items-center gap-1.5 ${
                config?.enabled ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${config?.enabled ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                {config?.enabled ? t.statusActive : t.statusDisabled}
              </span>
            </div>

            {/* Connection Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              provider?.connection_status === 'connected'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              {provider?.connection_status === 'connected' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{provider?.connection_status === 'connected' ? t.connected : t.disconnected}</span>
            </div>

            {/* Connection Test Button */}
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? t.testing : t.testConn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-sidebar-scroll border-b border-slate-800/80">
        {[
          { id: 'general', icon: Sliders, label: t.tabs.general },
          { id: 'api_config', icon: KeyRound, label: t.tabs.api_config },
          { id: 'models', icon: Cpu, label: t.tabs.models },
          { id: 'image_settings', icon: ImageIcon, label: t.tabs.image_settings },
          { id: 'merchant_limits', icon: ShieldCheck, label: t.tabs.merchant_limits },
          { id: 'pricing', icon: DollarSign, label: t.tabs.pricing },
          { id: 'analytics', icon: BarChart3, label: t.tabs.analytics },
          { id: 'logs', icon: FileCode2, label: t.tabs.logs },
          { id: 'advanced', icon: Settings, label: t.tabs.advanced },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as GeminiSettingsTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer border-b-2 ${
                isActive
                  ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: General Settings */}
      {activeTab === 'general' && config && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Core Provider Controls */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                {isAr ? 'حالة المزود والخدمة' : 'Provider & Service Status'}
              </h2>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div>
                  <span className="text-sm font-semibold text-white block">
                    {isAr ? 'تفعيل مزود Gemini' : 'Enable Gemini Provider'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {isAr ? 'تمكين استدعاءات الذكاء الاصطناعي لجميع خدمات المنصة' : 'Allow AI queries across platform stores'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'اسم المزود' : 'Provider Name'}
                </label>
                <input
                  type="text"
                  value={provider?.name || 'Google Gemini AI'}
                  onChange={(e) => provider && setProvider({ ...provider, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'حالة التشغيل' : 'Provider Status'}
                </label>
                <select
                  value={provider?.status || 'active'}
                  onChange={(e) => provider && setProvider({ ...provider, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="active">{isAr ? 'نشط (متاح لجميع العمليات)' : 'Active (Available)'}</option>
                  <option value="disabled">{isAr ? 'معطل كلياً' : 'Disabled Globally'}</option>
                  <option value="maintenance">{isAr ? 'تحت الصيانة المجدولة' : 'Under Maintenance'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'اللغة الافتراضية للمعالجة' : 'Default Language'}
                </label>
                <select
                  value={config.default_language}
                  onChange={(e) => setConfig({ ...config, default_language: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ar">{isAr ? 'العربية (Arabic First)' : 'Arabic (Primary)'}</option>
                  <option value="en">{isAr ? 'الإنجليزية (English)' : 'English'}</option>
                  <option value="auto">{isAr ? 'كشف تلقائي حسب المتجر' : 'Auto Detect'}</option>
                </select>
              </div>
            </div>

            {/* Default Models & Rendering defaults */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                {isAr ? 'النماذج الافتراضية ودقة التوليد' : 'Default Models & Quality'}
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'النموذج الافتراضي لتوليد الصور' : 'Default Image Model'}
                </label>
                <select
                  value={config.default_image_model}
                  onChange={(e) => setConfig({ ...config, default_image_model: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {models.filter((m) => m.supports_image_generation).map((m) => (
                    <option key={m.model_id} value={m.model_id}>
                      {isAr ? m.name_ar : m.name_en} ({m.model_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'النموذج الافتراضي للنصوص والموجهات' : 'Default Text & Vision Model'}
                </label>
                <select
                  value={config.default_text_model}
                  onChange={(e) => setConfig({ ...config, default_text_model: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recommended)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {isAr ? 'الجودة الافتراضية' : 'Default Quality'}
                  </label>
                  <select
                    value={config.default_image_quality}
                    onChange={(e) => setConfig({ ...config, default_image_quality: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="standard">{isAr ? 'قياسي (Standard)' : 'Standard'}</option>
                    <option value="balanced">{isAr ? 'متوازن (Balanced)' : 'Balanced'}</option>
                    <option value="pro">{isAr ? 'فائق الدقة (Pro)' : 'Pro'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {isAr ? 'أقصى دقة مسموحة' : 'Max Resolution'}
                  </label>
                  <select
                    value={config.max_image_resolution}
                    onChange={(e) => setConfig({ ...config, max_image_resolution: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="1K">1K (1024x1024)</option>
                    <option value="2K">2K (2048x2048)</option>
                    <option value="4K">4K (Ultra HD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'نسبة العرض للارتفاع الافتراضية' : 'Default Aspect Ratio'}
                </label>
                <select
                  value={config.default_aspect_ratio}
                  onChange={(e) => setConfig({ ...config, default_aspect_ratio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="1:1">1:1 (Square / منتجات المتاجر)</option>
                  <option value="4:5">4:5 (Portrait / إنستغرام)</option>
                  <option value="9:16">9:16 (Story / تيك توك وسناب)</option>
                  <option value="16:9">16:9 (Landscape / بنرات العرض)</option>
                  <option value="21:9">21:9 (Ultra-wide / واجهات الهيرو)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? t.saving : t.save}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: API Configuration */}
      {activeTab === 'api_config' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-purple-400" />
                  {isAr ? 'مفتاح Google Gemini API الآمن' : 'Secure Google Gemini API Key'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr
                    ? 'يتم تخزين المفاتيح حصرياً في بيئة Laravel الآمنة، ولا تُرسل مطلقاً في استجابات المتصفح'
                    : 'API keys are stored strictly on the Laravel backend and never exposed in client JS.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKeyModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{isAr ? 'تغيير أو تحديث المفتاح' : 'Add / Update API Key'}</span>
              </button>
            </div>

            {/* Key Preview Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 block">
                  {isAr ? 'المفتاح النشط حالياً:' : 'Current Active Key:'}
                </span>
                <div className="flex items-center gap-2 font-mono text-sm text-purple-300">
                  <span>{apiKeyInfo?.has_key ? (showKeySecret ? apiKeyInfo.masked : apiKeyInfo.preview) : (isAr ? 'لم يتم ضبط المفتاح بعد' : 'Not configured')}</span>
                  {apiKeyInfo?.has_key && (
                    <button
                      type="button"
                      onClick={() => setShowKeySecret(!showKeySecret)}
                      className="text-slate-400 hover:text-white p-1"
                      title={isAr ? 'إظهار / إخفاء' : 'Toggle Mask'}
                    >
                      {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  apiKeyInfo?.has_key ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {apiKeyInfo?.has_key ? (isAr ? 'تم الضبط بنجاح' : 'Configured') : (isAr ? 'مفقود' : 'Missing')}
                </span>
              </div>
            </div>

            {/* Connection Status Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <span className="text-xs text-slate-400 block">{isAr ? 'حالة الاتصال' : 'Connection Status'}</span>
                <span className={`text-base font-bold mt-1 block ${
                  provider?.connection_status === 'connected' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {provider?.connection_status === 'connected' ? t.connected : (provider?.connection_status || 'untested')}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <span className="text-xs text-slate-400 block">{isAr ? 'آخر فحص اتصال ناجح' : 'Last Successful Ping'}</span>
                <span className="text-sm font-semibold text-white mt-1 block">
                  {provider?.last_connection_test_at
                    ? new Date(provider.last_connection_test_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')
                    : (isAr ? 'لا يوجد فحص بعد' : 'None yet')}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <span className="text-xs text-slate-400 block">{isAr ? 'نقطة النهاية الرسمية' : 'Official Endpoint'}</span>
                <span className="text-xs font-mono text-slate-300 mt-1 block truncate">
                  {provider?.api_endpoint || 'https://generativelanguage.googleapis.com/v1beta'}
                </span>
              </div>
            </div>

            {/* Security Guarantee Box */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs text-purple-200 leading-relaxed space-y-1">
                <p className="font-semibold text-purple-100">
                  {isAr ? 'حماية مشددة للمفاتيح وعزل متعدد المتاجر' : 'Strict Key Protection & Multi-Tenant Isolation'}
                </p>
                <p>
                  {isAr
                    ? 'لا يُسمح لأي متجر أو مستخدم بالاطلاع على مفتاح Google Gemini الرئيسي. جميع الاستدعاءات تتم عبر خادم Laravel المصادق عليه مع مراقبة صارمة للحدود ومنع تجاوز الحصص.'
                    : 'No store or client JS can access the Super Admin Google Gemini key. All requests route through authenticated Laravel backend endpoints with hard quota enforcement.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI Models */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                {isAr ? 'النماذج الرسمية المعتمدة لـ Gemini API' : 'Official Gemini API Supported Models'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr ? 'يتم استرجاع النماذج الرسمية وتفعيلها لجميع التجار وفق الصلاحيات المحددة' : 'Live models catalog from official Google Generative Language API'}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const res = await refreshGeminiModels();
                setModels(res.models || []);
                toast(isAr ? 'تم تحديث قائمة النماذج الرسمية من سيرفرات جوجل.' : 'Models catalog refreshed from official API.', 'success');
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-purple-300 border border-purple-500/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحديث النماذج من Google API' : 'Refresh from Google API'}</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 text-start font-semibold">{isAr ? 'النموذج' : 'Model Name'}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{isAr ? 'المعرف الرسمي' : 'Model ID'}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{isAr ? 'الفئة' : 'Tier'}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{isAr ? 'القدرات' : 'Capabilities'}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{isAr ? 'توليد الصور' : 'Image Gen'}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{isAr ? 'الافتراضي' : 'Default'}</th>
                  <th className="px-4 py-3.5 text-start font-semibold">{isAr ? 'التفعيل' : 'Status'}</th>
                  <th className="px-4 py-3.5 text-center font-semibold">{isAr ? 'الأولوية' : 'Priority'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-white">
                      {isAr ? m.name_ar : m.name_en}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-purple-300 text-xs">
                      {m.model_id}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        m.tier === 'pro' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        m.tier === 'balanced' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {m.tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(m.capabilities || []).slice(0, 3).map((cap, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {m.supports_image_generation ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isAr ? 'مدعوم' : 'Supported'}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          {isAr ? 'نصوص فقط' : 'Text/Vision'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <input
                        type="radio"
                        name="default_model"
                        checked={m.is_default}
                        onChange={async () => {
                          await updateGeminiModel(m.id, { is_default: true });
                          fetchGeminiModels().then((res) => setModels(res.models || []));
                          toast(isAr ? 'تم تعيين النموذج الافتراضي.' : 'Default model updated.', 'success');
                        }}
                        className="w-4 h-4 accent-purple-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = !m.is_enabled;
                          await updateGeminiModel(m.id, { is_enabled: updated });
                          setModels(models.map((x) => (x.id === m.id ? { ...x, is_enabled: updated } : x)));
                          toast(isAr ? 'تم تغيير حالة النموذج.' : 'Model status toggled.', 'success');
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold cursor-pointer transition-all ${
                          m.is_enabled ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        {m.is_enabled ? (isAr ? 'مفعّل' : 'Enabled') : (isAr ? 'معطّل' : 'Disabled')}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                      #{m.priority}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Image Generation Settings */}
      {activeTab === 'image_settings' && config && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" />
              {isAr ? 'ميزات وقدرات استوديو صور المنتجات' : 'Product Studio Capabilities & Features'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'feature_text_to_image', label: isAr ? 'توليد الصور من الوصف (Text-to-Image)' : 'Text-to-Image Generation' },
                { key: 'feature_image_to_image', label: isAr ? 'تعديل الصور الحالية (Image-to-Image)' : 'Image-to-Image Editing' },
                { key: 'feature_product_photography', label: isAr ? 'تصوير المنتجات الاحترافي' : 'Product Photography' },
                { key: 'feature_background_replacement', label: isAr ? 'عزل واستبدال الخلفيات' : 'Background Replacement' },
                { key: 'feature_lifestyle_scenes', label: isAr ? 'مشاهد أسلوب الحياة اليومية' : 'Lifestyle Scenes' },
                { key: 'feature_promotional_banners', label: isAr ? 'تصميم البنرات الإعلانية' : 'Promotional Banners' },
                { key: 'feature_social_creatives', label: isAr ? 'منشورات السوشيال ميديا' : 'Social Media Creatives' },
                { key: 'feature_product_variations', label: isAr ? 'إنتاج تنويعات متعددة للمنتج' : 'Product Variations' },
              ].map((feat) => (
                <label
                  key={feat.key}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 cursor-pointer hover:border-purple-500/40 transition-all"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-200">{feat.label}</span>
                  <input
                    type="checkbox"
                    checked={(config as any)[feat.key]}
                    onChange={(e) => setConfig({ ...config, [feat.key]: e.target.checked } as any)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'صيغة حفظ الملفات' : 'Output Format'}
                </label>
                <select
                  value={config.output_format}
                  onChange={(e) => setConfig({ ...config, output_format: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="webp">WebP (Recommended - Ultra Fast)</option>
                  <option value="png">PNG (Lossless Quality)</option>
                  <option value="jpeg">JPEG (Standard)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'نسبة الضغط (%)' : 'Compression Quality (%)'}
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={config.compression_quality}
                  onChange={(e) => setConfig({ ...config, compression_quality: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'الحد الأقصى لرفع الصور المرجعية (MB)' : 'Max Upload Size (MB)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.max_upload_size_mb}
                  onChange={(e) => setConfig({ ...config, max_upload_size_mb: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? t.saving : t.save}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Merchant Limits & Credits */}
      {activeTab === 'merchant_limits' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  {isAr ? 'إدارة حصص وأرصدة المتاجر' : 'Merchant Limits & Quotas'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr ? 'تحكم بالحدود اليومية والشهرية ورصيد كل متجر بشكل منفصل ومحمي' : 'Manage isolated limits, credit balances, and access states per merchant'}
                </p>
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث عن متجر...' : 'Search store...'}
                  value={merchantSearch}
                  onChange={(e) => setMerchantSearch(e.target.value)}
                  className="w-full ps-9 pe-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Merchant Quota Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3.5 py-3 text-start font-semibold">{isAr ? 'المتجر' : 'Store'}</th>
                    <th className="px-3.5 py-3 text-start font-semibold">{isAr ? 'الخطة' : 'Plan'}</th>
                    <th className="px-3.5 py-3 text-start font-semibold">{isAr ? 'الرصيد المتبقي' : 'Credits Left'}</th>
                    <th className="px-3.5 py-3 text-start font-semibold">{isAr ? 'اليومي (مستعمل/حد)' : 'Daily Used'}</th>
                    <th className="px-3.5 py-3 text-start font-semibold">{isAr ? 'الشهري (مستعمل/حد)' : 'Monthly Used'}</th>
                    <th className="px-3.5 py-3 text-start font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="px-3.5 py-3 text-end font-semibold">{isAr ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredMerchants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                        {isAr ? 'لا توجد متاجر مطابقة' : 'No merchant records found'}
                      </td>
                    </tr>
                  ) : (
                    filteredMerchants.map((m) => (
                      <tr key={m.store_id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3.5 py-3 font-semibold text-white">
                          <div>{m.store_name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{m.store_id}</div>
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="text-[11px] px-2 py-0.5 rounded font-bold uppercase bg-slate-800 text-purple-300">
                            {m.plan_code}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-bold text-purple-400 tabular-nums">
                          {m.remaining_credits} {isAr ? 'صورة' : 'credits'}
                        </td>
                        <td className="px-3.5 py-3 tabular-nums">
                          <span className="text-white font-medium">{m.daily_used}</span>
                          <span className="text-slate-500"> / {m.daily_image_limit}</span>
                        </td>
                        <td className="px-3.5 py-3 tabular-nums">
                          <span className="text-white font-medium">{m.monthly_used}</span>
                          <span className="text-slate-500"> / {m.monthly_image_limit}</span>
                        </td>
                        <td className="px-3.5 py-3">
                          {m.is_paused ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {isAr ? 'موقوف مؤقتاً' : 'Paused'}
                            </span>
                          ) : m.ai_enabled ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {isAr ? 'نشط' : 'Active'}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              {isAr ? 'معطل' : 'Disabled'}
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-end space-x-2 rtl:space-x-reverse">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMerchant(m);
                              setCreditModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold cursor-pointer border border-purple-500/30"
                          >
                            {isAr ? 'تعديل الرصيد' : 'Adjust Credits'}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const newPaused = !m.is_paused;
                              await updateMerchantLimit({
                                store_id: m.store_id,
                                is_paused: newPaused,
                                pause_reason: newPaused ? 'Paused by Master Admin' : null,
                              });
                              setMerchants(merchants.map((x) => (x.store_id === m.store_id ? { ...x, is_paused: newPaused } : x)));
                              toast(newPaused ? (isAr ? 'تم إيقاف الذكاء للمتجر.' : 'AI paused for store.') : (isAr ? 'تم استئناف الذكاء للمتجر.' : 'AI resumed for store.'), 'success');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                              m.is_paused
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                            }`}
                          >
                            {m.is_paused ? (isAr ? 'استئناف' : 'Resume') : (isAr ? 'إيقاف' : 'Pause')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Pricing & Cost Management */}
      {activeTab === 'pricing' && pricing && (
        <div className="space-y-6">
          {/* Spend Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">{isAr ? 'استهلاك API الفعلي هذا الشهر' : 'Actual API Spend This Month'}</span>
              <div className="text-2xl font-black text-white tabular-nums flex items-baseline gap-1">
                <span>${pricing.actual_spending_this_month_usd}</span>
                <span className="text-xs text-slate-400 font-normal">USD</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">{isAr ? 'الحد الشهري الأقصى للمنصة' : 'Monthly Spending Limit'}</span>
              <div className="text-2xl font-black text-purple-400 tabular-nums flex items-baseline gap-1">
                <span>${pricing.monthly_spending_limit_usd}</span>
                <span className="text-xs text-slate-400 font-normal">USD</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">{isAr ? 'نسبة الاستهلاك من الميزانية' : 'Budget Utilization'}</span>
              <div className="text-2xl font-black text-emerald-400 tabular-nums">
                {pricing.spending_percentage}%
              </div>
            </div>
          </div>

          {/* Official Google Pricing Table */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-400" />
              {isAr ? 'أسعار Google Gemini الرسمية الموثقة' : 'Official Google Gemini Verified Pricing'}
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-start font-semibold">{isAr ? 'النموذج' : 'Model'}</th>
                    <th className="px-4 py-3 text-start font-semibold">{isAr ? 'تكلفة توليد الصورة' : 'Image Generation Cost'}</th>
                    <th className="px-4 py-3 text-start font-semibold">{isAr ? 'سعر مدخلات النص (لكل 1M)' : 'Input Tokens (per 1M)'}</th>
                    <th className="px-4 py-3 text-start font-semibold">{isAr ? 'سعر مخرجات النص (لكل 1M)' : 'Output Tokens (per 1M)'}</th>
                    <th className="px-4 py-3 text-start font-semibold">{isAr ? 'العملة' : 'Currency'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {pricing.models.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-white">
                        {isAr ? m.name_ar : m.name_en}
                      </td>
                      <td className="px-4 py-3 font-mono text-purple-400">
                        {m.supports_image_generation ? `$${m.image_generation_price_usd}` : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        ${m.input_token_price_per_1m_usd}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        ${m.output_token_price_per_1m_usd}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        USD (Official Google API)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: Usage Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Period Filter */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              {isAr ? 'مؤشرات الأداء وتحليلات الاستخدام' : 'Usage Analytics & Performance KPIs'}
            </h2>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              {(['today', '7d', '30d'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAnalyticsPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-all ${
                    analyticsPeriod === p ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p === 'today' ? (isAr ? 'اليوم' : 'Today') : p === '7d' ? (isAr ? 'آخر 7 أيام' : '7 Days') : (isAr ? 'آخر 30 يوماً' : '30 Days')}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">{isAr ? 'إجمالي الصور المولدة' : 'Total Images Generated'}</span>
              <div className="text-2xl font-bold text-white tabular-nums">
                {analytics.cards.total_generated_images}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">{isAr ? 'إجمالي طلبات API' : 'Total API Requests'}</span>
              <div className="text-2xl font-bold text-white tabular-nums">
                {analytics.cards.total_api_requests}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">{isAr ? 'الطلبات الناجحة' : 'Successful Requests'}</span>
              <div className="text-2xl font-bold text-emerald-400 tabular-nums">
                {analytics.cards.successful_requests}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">{isAr ? 'الطلبات المتعثرة' : 'Failed Requests'}</span>
              <div className="text-2xl font-bold text-rose-400 tabular-nums">
                {analytics.cards.failed_requests}
              </div>
            </div>
          </div>

          {/* Daily Trend Chart (SVG / HTML Bar) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              {isAr ? 'مخطط الاستخدام اليومي' : 'Daily Usage Activity'}
            </h3>

            {analytics.chart_daily.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                {isAr ? 'لا توجد بيانات استخدام في هذه الفترة' : 'No activity recorded in this period'}
              </div>
            ) : (
              <div className="flex items-end gap-2 h-44 pt-6 pb-2 px-2 overflow-x-auto">
                {analytics.chart_daily.map((pt, i) => {
                  const maxH = Math.max(1, ...analytics.chart_daily.map((x) => x.images + x.requests));
                  const hPct = Math.min(100, Math.max(6, Math.round(((pt.images + pt.requests) / maxH) * 100)));
                  return (
                    <div key={i} className="flex-1 min-w-[28px] flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {pt.images}
                      </div>
                      <div
                        style={{ height: `${hPct}%` }}
                        className="w-full max-w-[24px] rounded-t-md bg-gradient-to-t from-purple-700 to-purple-400 hover:from-purple-600 hover:to-purple-300 transition-all shadow-sm"
                        title={`${pt.date}: ${pt.images} images, ${pt.requests} requests`}
                      />
                      <span className="text-[9px] text-slate-500 tracking-tighter truncate max-w-[36px]">
                        {pt.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: API Logs & Errors */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-purple-400" />
                  {isAr ? 'سجلات استدعاءات API والتحكم في الأخطاء' : 'API Request Logs & Error Diagnostics'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr ? 'مراقبة فورية لزمن الاستجابة وحالة كل طلب (مفاتيح API محمية ومحجوبة)' : 'Real-time response latency and request statuses (API keys and sensitive data masked)'}
                </p>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {isAr ? 'إجمالي السجلات:' : 'Total Records:'} {logsTotal}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-3 text-start font-semibold">{isAr ? 'معرف الطلب' : 'Request ID'}</th>
                    <th className="px-3 py-3 text-start font-semibold">{isAr ? 'المتجر' : 'Store'}</th>
                    <th className="px-3 py-3 text-start font-semibold">{isAr ? 'النموذج' : 'Model'}</th>
                    <th className="px-3 py-3 text-start font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="px-3 py-3 text-start font-semibold">{isAr ? 'زمن الاستجابة' : 'Latency'}</th>
                    <th className="px-3 py-3 text-start font-semibold">{isAr ? 'التكلفة' : 'Cost'}</th>
                    <th className="px-3 py-3 text-start font-semibold">{isAr ? 'التوقيت' : 'Timestamp'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                        {isAr ? 'لا توجد سجلات بعد' : 'No API logs recorded yet'}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">
                          {log.request_id || log.id.slice(0, 12)}
                        </td>
                        <td className="px-3 py-2.5 text-white font-medium">
                          {log.store_name}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-purple-300 text-xs">
                          {log.model_id}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.status === 'success' ? (
                            <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400">
                              200 OK
                            </span>
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-400" title={log.error_message || ''}>
                              {log.error_code || 'Error'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-slate-300">
                          {log.response_time_ms}ms
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-purple-400">
                          ${log.cost_usd}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-500">
                          {new Date(log.created_at).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: Advanced Settings */}
      {activeTab === 'advanced' && config && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              {isAr ? 'إعدادات الاتصال المتقدمة والتحمل' : 'Advanced Resilience & Fault Tolerance'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'مهلة الاتصال (Timeout بالثواني)' : 'API Timeout (Seconds)'}
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={config.api_timeout_seconds}
                  onChange={(e) => setConfig({ ...config, api_timeout_seconds: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'الحد الأقصى لإعادة المحاولة (Retries)' : 'Max Retries on Provider Failure'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={config.max_retries}
                  onChange={(e) => setConfig({ ...config, max_retries: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'حد الطلبات في الدقيقة (Rate Limit RPM)' : 'Rate Limit RPM'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={config.rate_limit_per_minute}
                  onChange={(e) => setConfig({ ...config, rate_limit_per_minute: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {isAr ? 'نموذج البديل التلقائي (Fallback)' : 'Fallback Model'}
                </label>
                <input
                  type="text"
                  value={config.fallback_model}
                  onChange={(e) => setConfig({ ...config, fallback_model: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-white block">
                    {isAr ? 'تفعيل التحويل التلقائي للبديل عند انشغال النموذج' : 'Enable Provider Fallback on Saturation'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {isAr ? 'التحويل التلقائي لنموذج Flash Lite عند وصول النموذج الرئيسي للحد' : 'Switches to Flash Lite if primary model hits rate limit'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.provider_fallback_enabled}
                  onChange={(e) => setConfig({ ...config, provider_fallback_enabled: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-white block">
                    {isAr ? 'وضع الصيانة الشامل للذكاء الاصطناعي' : 'Global Maintenance Mode'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {isAr ? 'إيقاف استدعاءات التجار مؤقتاً مع إظهار رسالة صيانة لطيفة' : 'Gracefully blocks new merchant requests during API updates'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.global_maintenance_mode}
                  onChange={(e) => setConfig({ ...config, global_maintenance_mode: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? t.saving : t.save}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit API Key Modal */}
      {keyModalOpen && (
        <GlobalModal
          isOpen={keyModalOpen}
          onClose={() => setKeyModalOpen(false)}
          title={isAr ? 'تحديث مفتاح Google Gemini API' : 'Update Google Gemini API Key'}
          size="md"
        >
          <div className="space-y-4 p-4 text-start font-[var(--font-ui)]">
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAr
                ? 'أدخل مفتاح Google AI Studio الرسمي (يبدأ بـ AIzaSy...). سيتم حفظه بأمان على السيرفر واختباره مباشرة.'
                : 'Enter your official Google AI Studio API key (starts with AIzaSy...). It will be stored securely on the API server and verified immediately.'}
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                {isAr ? 'المفتاح الجديد' : 'New API Key'}
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleUpdateApiKey}
                disabled={saving || !keyInput.trim()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {saving ? (isAr ? 'جاري التحقق...' : 'Verifying...') : (isAr ? 'حفظ واختبار' : 'Save & Verify')}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* Manual Credit Adjustment Modal */}
      {creditModalOpen && selectedMerchant && (
        <GlobalModal
          isOpen={creditModalOpen}
          onClose={() => setCreditModalOpen(false)}
          title={isAr ? `تعديل رصيد متجر: ${selectedMerchant.store_name}` : `Adjust Credits: ${selectedMerchant.store_name}`}
          size="md"
        >
          <div className="space-y-4 p-4 text-start font-[var(--font-ui)]">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block">{isAr ? 'الرصيد الحالي:' : 'Current Balance:'}</span>
              <span className="text-base font-bold text-purple-400 font-mono">
                {selectedMerchant.remaining_credits} {isAr ? 'صورة' : 'credits'}
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                {isAr ? 'مقدار التعديل (موجب للإضافة، سالب للخصم)' : 'Adjustment Amount (+ to add, - to deduct)'}
              </label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                {isAr ? 'سبب التعديل (يُسجل في دفتر التدقيق)' : 'Reason (Recorded in Audit Ledger)'}
              </label>
              <input
                type="text"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setCreditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAdjustCredits}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'تأكيد التعديل' : 'Confirm Adjustment')}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
};
