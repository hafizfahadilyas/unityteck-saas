import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchCartInterceptSettingsApi,
  updateCartInterceptSettingsApi,
  fetchCartInterceptTrackingApi,
  CartInterceptConfig,
  CartInterceptTrackingData,
} from '../../api/tenantApi';
import {
  Sparkles,
  Gift,
  ShoppingCart,
  Save,
  RefreshCw,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Users,
  MousePointerClick,
  Eye,
  Info,
  Smartphone,
  Moon,
  Sun,
  Languages,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export const StoreCartInterceptTab: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const isFlowersStore =
    activeStore?.id === 'store-1' ||
    activeStore?.category?.includes('ورد') ||
    activeStore?.category?.includes('هدايا') ||
    activeStore?.category?.includes('gift') ||
    activeStore?.category?.includes('flower');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Settings state
  const [config, setConfig] = useState<CartInterceptConfig>({
    enabled: true,
    active_modal: 'loyalty',
    loyalty_points: 25,
    discount_percent: 10,
    coupon_code: 'HADAYA10',
    title_en: "Don't Lose Your Points!",
    title_ar: 'لا تفوّت نقاطك الذهبية!',
    subtitle_en: 'Log in and earn 25 points on this cart.',
    subtitle_ar: 'سجّل دخولك الآن واكسب 25 نقطة إضافية على هذه السلة.',
    gift_title_en: 'Your Gift is Ready!',
    gift_title_ar: 'هديتك بانتظارك!',
    gift_subtitle_en: 'Log in now and get 10% OFF automatically applied to your cart.',
    gift_subtitle_ar: 'سجّل دخولك الآن واحصل على خصم 10% يطبق تلقائياً على سلتك.',
    save_cart_title_en: 'Save Your Cart?',
    save_cart_title_ar: 'هل ترغب بحفظ سلتك؟',
    save_cart_subtitle_en: "As a guest, your cart might be lost. Log in and we'll save it for you across any device.",
    save_cart_subtitle_ar: 'كزائر، قد تفقد سلتك عند إغلاق المتصفح. سجّل دخولك وسنحفظها لك عبر جميع أجهزتك.',
  });

  // Tracking data state
  const [trackingData, setTrackingData] = useState<CartInterceptTrackingData>({
    logs: [],
    metrics: {
      total_impressions: 0,
      total_converted: 0,
      total_guest_continued: 0,
      total_dismissed: 0,
      conversion_rate: 0,
      by_modal: {},
    },
  });

  // Preview interactive state
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>(isAr ? 'ar' : 'en');
  const [activeTrackingFilter, setActiveTrackingFilter] = useState<'all' | 'loyalty' | 'gift' | 'save_cart'>('all');

  // Load initial settings and tracking from Hostinger MySQL
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      setLoading(true);
      try {
        const storeId = activeStore?.id || 'store-1';
        const [settingsRes, trackingRes] = await Promise.all([
          fetchCartInterceptSettingsApi(storeId).catch(() => null),
          fetchCartInterceptTrackingApi(storeId).catch(() => null),
        ]);

        if (isMounted) {
          if (settingsRes) setConfig(settingsRes);
          if (trackingRes) setTrackingData(trackingRes);
        }
      } catch (err) {
        console.warn('Cart intercept loading error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAll();
  }, [activeStore?.id]);

  const handleRefreshTracking = async () => {
    setIsRefreshing(true);
    try {
      const storeId = activeStore?.id || 'store-1';
      const trackingRes = await fetchCartInterceptTrackingApi(storeId);
      if (trackingRes) {
        setTrackingData(trackingRes);
        toast(isAr ? 'تم تحديث سجل التتبع والتحليلات بنجاح' : 'Tracking records refreshed', 'success');
      }
    } catch {
      toast(isAr ? 'تعذر جلب التحديثات حالياً' : 'Failed to refresh tracking', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const storeId = activeStore?.id || 'store-1';
      const updated = await updateCartInterceptSettingsApi(storeId, config);
      if (updated) {
        setConfig(updated);
        try {
          localStorage.setItem(`unityteck_cart_intercept_${storeId}`, JSON.stringify(updated));
        } catch {}
        window.dispatchEvent(new CustomEvent('unityteck-cart-intercept-updated', { detail: updated }));
        toast(
          isAr
            ? 'تم حفظ وتفعيل إعدادات نافذة الالتقاط في قاعدة البيانات بنجاح'
            : 'Cart intercept settings updated in database successfully',
          'success'
        );
      }
    } catch {
      toast(isAr ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLogs = trackingData.logs.filter((log) => {
    if (activeTrackingFilter === 'all') return true;
    return log.modal_type === activeTrackingFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Scope Banner: Flowers Store Dedicated Feature */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 shadow-2xs ${
        isFlowersStore
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
          : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
      }`}>
        <Info className={`w-5 h-5 shrink-0 mt-0.5 ${isFlowersStore ? 'text-emerald-600' : 'text-amber-600'}`} />
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm">
              {isAr
                ? 'ميزة نوافذ الالتقاط بالنقرة الأولى (1st-Click Smart Cart Intercept)'
                : '1st-Click Smart Cart Intercept System'}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-900 border border-current shadow-2xs">
              {activeStore.name} ({activeStore.id})
            </span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            {isFlowersStore
              ? (isAr
                  ? 'تعمل هذه النوافذ الذكية فقط في متجر باقات الورد والهدايا الفاخرة (هدايا مكة). عند ضغط العميل لأول مرة على "أضف للسلة" تظهر النافذة المحددة لتشجيعه على التسجيل وجمع النقاط أو الخصم. وعند ضغطه للمرة الثانية لا تظهر النافذة وتضاف السلعة مباشرة دون إزعاج.'
                  : 'Active exclusively for Flowers & Gifts. When a user clicks "Add to Cart" for the 1st time, the selected popup engages them. On their 2nd click, it is suppressed and items add directly.')
              : (isAr
                  ? 'تنبيه: تم تصميم هذه الميزة خصيصاً لمتجر باقات الورد والهدايا. المتاجر الأخرى تعتمد على إضافة السلة المباشرة، ولكن يمكنك اختبار الإعدادات والمعاينة المباشرة هنا.'
                  : 'Notice: This feature is exclusively engineered for the Flowers & Gifts store template. Other stores use standard direct add to cart.')}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: ACTIVE MODAL MODE SELECTOR (The 3 Options)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{isAr ? 'اختر نافذة الالتقاط النشطة بالمتجر' : 'Select Active Cart Intercept Popup'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'حدد أي من الخيارات الثلاثة ترغب بإظهاره لعملاء متجر الورد عند أول ضغطة على زر أضف للسلة'
                : 'Choose which modal to trigger when a visitor clicks Add to Cart for the first time'}
            </p>
          </div>

          <label className="flex items-center gap-2 self-start sm:self-auto cursor-pointer select-none">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'تفعيل النافذة الذكية' : 'Enable Intercept'}
            </span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>
        </div>

        {/* 3 Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Loyalty Points Modal */}
          <div
            onClick={() => setConfig({ ...config, active_modal: 'loyalty' })}
            className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              config.active_modal === 'loyalty'
                ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-md'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4A034] to-[#FFE58F] text-[#5c3e07] flex items-center justify-center shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              {config.active_modal === 'loyalty' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {isAr ? 'النشط حالياً' : 'Active'}
                </span>
              )}
            </div>

            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'كارت ولاء العملاء وجمع النقاط' : 'Loyalty Points Card'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isAr
                  ? `"Don't Lose Your Points!" — تشجيع العميل على تسجيل الدخول لكسب ${config.loyalty_points || 25} نقطة على سلة الطلب.`
                  : `"Don't Lose Your Points!" — Prompts visitors to log in to earn ${config.loyalty_points || 25} reward points.`}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <span>{isAr ? 'الأزرار: اجمع النقاط / المتابعة كزائر' : 'Buttons: Collect Points / Guest'}</span>
            </div>
          </div>

          {/* Card 2: Gifts Card (Discount) */}
          <div
            onClick={() => setConfig({ ...config, active_modal: 'gift' })}
            className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              config.active_modal === 'gift'
                ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 shadow-md'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E6A8A8] to-[#FFEAA7] text-[#7a2e2e] flex items-center justify-center shadow-sm">
                <Gift className="w-6 h-6" />
              </div>
              {config.active_modal === 'gift' && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {isAr ? 'النشط حالياً' : 'Active'}
                </span>
              )}
            </div>

            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'كارت الهدية والخصم الفوري' : 'Gift Discount Voucher'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isAr
                  ? `"Your Gift is Ready!" — شريط زينة احتفالي مع منح كود خصم ${config.discount_percent || 10}% يطبق تلقائياً على السلة.`
                  : `"Your Gift is Ready!" — Festive ribbons offering ${config.discount_percent || 10}% OFF auto applied.`}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <span>{isAr ? 'الأزرار: احصل على الكود / لاحقاً' : 'Buttons: Get My Code / Later'}</span>
            </div>
          </div>

          {/* Card 3: Save Cart Modal */}
          <div
            onClick={() => setConfig({ ...config, active_modal: 'save_cart' })}
            className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
              config.active_modal === 'save_cart'
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#102a1c] to-[#1e5237] text-[#e6ca98] flex items-center justify-center shadow-sm">
                <ShoppingCart className="w-6 h-6" />
              </div>
              {config.active_modal === 'save_cart' && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  {isAr ? 'النشط حالياً' : 'Active'}
                </span>
              )}
            </div>

            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'كارت حفظ السلة عبر الأجهزة' : 'Multi-Device Save Cart'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isAr
                  ? `"Save Your Cart?" — أيقونة سلة وسحابة لحفظ مشتريات الزائر ومزامنتها عبر جميع أجهزته عند تسجيل الدخول.`
                  : `"Save Your Cart?" — Cloud synced cart icon to backup items across mobile & desktop.`}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span>{isAr ? 'الأزرار: حفظ سلة مشترياتي / كزائر' : 'Buttons: Save My Cart / Guest'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2 & 3: CONFIGURATION FORM & INTERACTIVE PREVIEW
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Settings Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'تخصيص القيم والنصوص' : 'Customize Modal Parameters & Texts'}</span>
              </h3>
              <span className="text-[11px] text-slate-400">Hostinger MySQL</span>
            </div>

            {/* Mode-Specific Value Inputs */}
            {config.active_modal === 'loyalty' && (
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                  {isAr ? 'عدد نقاط الولاء الممنوحة على هذه السلة' : 'Loyalty Points Rewarded on Cart'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={config.loyalty_points || 25}
                    onChange={(e) => setConfig({ ...config, loyalty_points: parseInt(e.target.value) || 25 })}
                    className="w-32 px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    {isAr
                      ? `تعادل ${(Number(config.loyalty_points || 25) * 0.1).toFixed(1)} ر.س خصم نقدي متاح للعميل`
                      : `Worth ${(Number(config.loyalty_points || 25) * 0.1).toFixed(1)} SAR cash discount`}
                  </span>
                </div>
              </div>
            )}

            {config.active_modal === 'gift' && (
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-rose-900 dark:text-rose-200 block mb-1">
                      {isAr ? 'نسبة الخصم المئوية (%)' : 'Discount Percentage (%)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.discount_percent || 10}
                      onChange={(e) => setConfig({ ...config, discount_percent: parseFloat(e.target.value) || 10 })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-rose-900 dark:text-rose-200 block mb-1">
                      {isAr ? 'كود الخصم الترويجي' : 'Promo Coupon Code'}
                    </label>
                    <input
                      type="text"
                      value={config.coupon_code || 'HADAYA10'}
                      onChange={(e) => setConfig({ ...config, coupon_code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bilingual Titles & Subtitles */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'العنوان الرئيسي (العربية)' : 'Heading (Arabic)'}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={
                      config.active_modal === 'loyalty'
                        ? config.title_ar
                        : config.active_modal === 'gift'
                        ? config.gift_title_ar
                        : config.save_cart_title_ar
                    }
                    onChange={(e) => {
                      if (config.active_modal === 'loyalty') setConfig({ ...config, title_ar: e.target.value });
                      else if (config.active_modal === 'gift') setConfig({ ...config, gift_title_ar: e.target.value });
                      else setConfig({ ...config, save_cart_title_ar: e.target.value });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'العنوان الرئيسي (الإنجليزية)' : 'Heading (English)'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={
                      config.active_modal === 'loyalty'
                        ? config.title_en
                        : config.active_modal === 'gift'
                        ? config.gift_title_en
                        : config.save_cart_title_en
                    }
                    onChange={(e) => {
                      if (config.active_modal === 'loyalty') setConfig({ ...config, title_en: e.target.value });
                      else if (config.active_modal === 'gift') setConfig({ ...config, gift_title_en: e.target.value });
                      else setConfig({ ...config, save_cart_title_en: e.target.value });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'الوصف التوضيحي (العربية)' : 'Subtitle Description (Arabic)'}
                  </label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={
                      config.active_modal === 'loyalty'
                        ? config.subtitle_ar
                        : config.active_modal === 'gift'
                        ? config.gift_subtitle_ar
                        : config.save_cart_subtitle_ar
                    }
                    onChange={(e) => {
                      if (config.active_modal === 'loyalty') setConfig({ ...config, subtitle_ar: e.target.value });
                      else if (config.active_modal === 'gift') setConfig({ ...config, gift_subtitle_ar: e.target.value });
                      else setConfig({ ...config, save_cart_subtitle_ar: e.target.value });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'الوصف التوضيحي (الإنجليزية)' : 'Subtitle Description (English)'}
                  </label>
                  <textarea
                    rows={2}
                    dir="ltr"
                    value={
                      config.active_modal === 'loyalty'
                        ? config.subtitle_en
                        : config.active_modal === 'gift'
                        ? config.gift_subtitle_en
                        : config.save_cart_subtitle_en
                    }
                    onChange={(e) => {
                      if (config.active_modal === 'loyalty') setConfig({ ...config, subtitle_en: e.target.value });
                      else if (config.active_modal === 'gift') setConfig({ ...config, gift_subtitle_en: e.target.value });
                      else setConfig({ ...config, save_cart_subtitle_en: e.target.value });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isAr ? 'حفظ وتفعيل في قاعدة البيانات' : 'Save & Publish to Database'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right / Live Interactive Mockup Preview matching Images 1, 2, 3 */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  {isAr ? 'معاينة حية مطابقة لشاشة الجوال' : 'Pixel-Perfect Mobile Preview'}
                </h4>
              </div>

              {/* Theme & Language Toggles for Preview */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTheme(previewTheme === 'light' ? 'dark' : 'light')}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:opacity-80 transition-opacity cursor-pointer"
                  title="Toggle Light/Dark Preview"
                >
                  {previewTheme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLang(previewLang === 'ar' ? 'en' : 'ar')}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:opacity-80 transition-opacity cursor-pointer uppercase"
                >
                  {previewLang}
                </button>
              </div>
            </div>

            {/* Mobile Device Frame */}
            <div className={`rounded-[36px] p-6 border-4 shadow-xl transition-colors min-h-[420px] flex flex-col justify-center relative overflow-hidden ${
              previewTheme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-white'
                : 'bg-[#f4f2eb] border-slate-300 text-slate-900'
            }`}>
              {/* Floating Modal inside Phone */}
              <div
                dir={previewLang === 'ar' ? 'rtl' : 'ltr'}
                className={`rounded-[28px] p-6 text-center shadow-2xl relative border ${
                  previewTheme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-white'
                    : 'bg-white border-slate-100 text-slate-900'
                }`}
              >
                {/* Close Button Preview */}
                <div className="absolute top-3.5 end-3.5 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                  <X className="w-3 h-3" />
                </div>

                {/* MODAL 1: Loyalty Preview */}
                {config.active_modal === 'loyalty' && (
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D4A034] via-[#FFE58F] to-[#9E6B15] flex items-center justify-center shadow-md mb-3">
                      <Sparkles className="w-7 h-7 text-[#5c3e07]" />
                    </div>
                    <h5 className="font-black text-base tracking-tight">
                      {previewLang === 'ar' ? (config.title_ar || 'لا تفوّت نقاطك الذهبية!') : (config.title_en || "Don't Lose Your Points!")}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[220px]">
                      {previewLang === 'ar'
                        ? (config.subtitle_ar || `سجّل دخولك واكسب ${config.loyalty_points || 25} نقطة على هذه السلة.`)
                        : (config.subtitle_en || `Log in and earn ${config.loyalty_points || 25} points on this cart.`)}
                    </p>
                    <div className="w-full mt-5 space-y-2">
                      <div className="w-full py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-xs">
                        {previewLang === 'ar' ? 'اجمع النقاط الآن' : 'Collect Points'}
                      </div>
                      <div className="w-full py-2.5 rounded-xl bg-[#EBEBED] dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs">
                        {previewLang === 'ar' ? 'المتابعة كزائر' : 'Continue as Guest'}
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL 2: Gift Preview */}
                {config.active_modal === 'gift' && (
                  <div className="flex flex-col items-center">
                    <div className="w-full -mt-2 h-8 relative overflow-hidden mb-1 flex items-center justify-center gap-1 opacity-80">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span className="w-2 h-1 bg-amber-400 rotate-45" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="w-2 h-1 bg-rose-400 -rotate-30" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D9A844] to-[#FFF0B8] flex items-center justify-center shadow-md mb-2">
                      <Gift className="w-6 h-6 text-[#5c3e07]" />
                    </div>
                    <h5 className="font-black text-base tracking-tight">
                      {previewLang === 'ar' ? (config.gift_title_ar || 'هديتك بانتظارك!') : (config.gift_title_en || 'Your Gift is Ready!')}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[220px]">
                      {previewLang === 'ar'
                        ? (config.gift_subtitle_ar || `سجّل دخولك الآن واحصل على خصم ${config.discount_percent || 10}% يطبق تلقائياً على سلتك.`)
                        : (config.gift_subtitle_en || `Log in now and get ${config.discount_percent || 10}% OFF automatically applied to your cart.`)}
                    </p>
                    <div className="w-full mt-5 flex items-center gap-2">
                      <div className="flex-1 py-2.5 rounded-full bg-[#EBEBED] dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs">
                        {previewLang === 'ar' ? 'لاحقاً' : 'Later'}
                      </div>
                      <div className="flex-1 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-xs">
                        {previewLang === 'ar' ? 'احصل على الكود' : 'Get My Code'}
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL 3: Save Cart Preview */}
                {config.active_modal === 'save_cart' && (
                  <div className="flex flex-col items-center pt-1">
                    <div className="flex items-center gap-2 mb-3 text-amber-500">
                      <ShoppingCart className="w-8 h-8" />
                      <span className="text-xl font-bold">☁️</span>
                    </div>
                    <h5 className="font-black text-base tracking-tight">
                      {previewLang === 'ar' ? (config.save_cart_title_ar || 'هل ترغب بحفظ سلتك؟') : (config.save_cart_title_en || 'Save Your Cart?')}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[220px]">
                      {previewLang === 'ar'
                        ? (config.save_cart_subtitle_ar || 'كزائر، قد تفقد سلتك عند إغلاق المتصفح. سجّل دخولك وسنحفظها لك.')
                        : (config.save_cart_subtitle_en || "As a guest, your cart might be lost. Log in and we'll save it for you.")}
                    </p>
                    <div className="w-full mt-5 space-y-2">
                      <div className="w-full py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-xs">
                        {previewLang === 'ar' ? 'حفظ سلة مشترياتي' : 'Save My Cart'}
                      </div>
                      <div className="w-full py-2.5 rounded-xl bg-[#EBEBED] dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs">
                        {previewLang === 'ar' ? 'المتابعة كزائر' : 'Continue as Guest'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: REAL-TIME TRACKING LEDGER & METRICS (MySQL)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'سجل التتبع المباشر للنقرات والتحويلات' : 'Live Interaction & Conversion Tracking'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'تتبع حقيقي ومباشر من قاعدة بيانات Hostinger MySQL يوضح هوية من ضغط، النافذة المعروضة، والمنتج المتفاعل معه.'
                : 'Real-time telemetry from Hostinger MySQL recording which visitor clicked which modal option.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshTracking}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحديث البيانات' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
            <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold block">
              {isAr ? 'إجمالي المشاهدات' : 'Total Impressions'}
            </span>
            <p className="text-2xl font-black font-mono text-blue-900 dark:text-blue-100 mt-1">
              {trackingData.metrics.total_impressions}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block">
              {isAr ? 'إجمالي التحويلات (سجّلوا)' : 'Total Converted'}
            </span>
            <p className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-100 mt-1">
              {trackingData.metrics.total_converted}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
            <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold block">
              {isAr ? 'معدل التحويل' : 'Conversion Rate'}
            </span>
            <p className="text-2xl font-black font-mono text-purple-900 dark:text-purple-100 mt-1">
              {trackingData.metrics.conversion_rate}%
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">
              {isAr ? 'المتابعة كضيوف' : 'Guest Checkouts'}
            </span>
            <p className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200 mt-1">
              {trackingData.metrics.total_guest_continued}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: isAr ? 'جميع السجلات' : 'All Events' },
            { id: 'loyalty', label: isAr ? 'كارت الولاء' : 'Loyalty' },
            { id: 'gift', label: isAr ? 'كارت الهدية' : 'Gift Code' },
            { id: 'save_cart', label: isAr ? 'حفظ السلة' : 'Save Cart' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveTrackingFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTrackingFilter === f.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tracking Records Table / Genuine Empty State */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 p-6 space-y-2">
              <MousePointerClick className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'لا توجد سجلات تتبع حالياً في قاعدة البيانات' : 'No Tracking Records Found in Database'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isAr
                  ? 'ستظهر هنا بيانات كل زائر يضغط على "أضف للسلة" لأول مرة في متجر الورد مع تسجيل خياره الدقيق واسم المنتج.'
                  : 'Real visitor clicks and conversions on your Flowers storefront will appear here live.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4 text-start">{isAr ? 'الزائر / العميل' : 'Visitor / Customer'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'نوع النافذة' : 'Modal Type'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'الإجراء المتخذ' : 'Action Taken'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'المنتج المتفاعل معه' : 'Product Interacted'}</th>
                  <th className="py-3 px-3 text-end">{isAr ? 'التاريخ والوقت' : 'Timestamp'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                  const isConverted = log.status === 'converted';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {log.customer_name || (isAr ? 'زائر كريم' : 'Guest Visitor')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.customer_email || log.visitor_id}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.modal_type === 'loyalty'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : log.modal_type === 'gift'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {log.modal_type === 'loyalty' ? (
                            <>
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{isAr ? 'كارت الولاء' : 'Loyalty'}</span>
                            </>
                          ) : log.modal_type === 'gift' ? (
                            <>
                              <Gift className="w-2.5 h-2.5" />
                              <span>{isAr ? 'كارت الهدية' : 'Gift Code'}</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-2.5 h-2.5" />
                              <span>{isAr ? 'حفظ السلة' : 'Save Cart'}</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {log.action === 'collect_points'
                            ? (isAr ? 'جمع النقاط (تحويل)' : 'Collect Points')
                            : log.action === 'get_code'
                            ? (isAr ? 'طلب الكود (تحويل)' : 'Claimed Code')
                            : log.action === 'save_cart'
                            ? (isAr ? 'حفظ السلة (تحويل)' : 'Saved Cart')
                            : log.action === 'continue_as_guest'
                            ? (isAr ? 'المتابعة كزائر' : 'Guest Continued')
                            : log.action === 'later'
                            ? (isAr ? 'الضغط على لاحقاً' : 'Clicked Later')
                            : log.action === 'dismissed'
                            ? (isAr ? 'إغلاق النافذة (X)' : 'Dismissed (X)')
                            : (isAr ? 'مشاهدة النافذة' : 'Impression')}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-800 dark:text-slate-200 truncate max-w-[180px] block">
                          {log.product_name || (isAr ? 'باقة ورد' : 'Product')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-end font-mono text-[11px] text-slate-400">
                        {new Date(log.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isConverted
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {isConverted
                            ? (isAr ? 'تحويل ناجح ✓' : 'Converted ✓')
                            : (isAr ? 'ضيف / مستمر' : 'Guest')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
