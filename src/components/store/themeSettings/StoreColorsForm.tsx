import React, { useState } from 'react';
import { Save, Check, RotateCcw, Palette, Upload, Phone, MessageCircle, ArrowUp } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type StoreColorsSettings,
} from '../../../themes/settings/themeSettingsStore';

export const StoreColorsForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<StoreColorsSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.colors;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const toggle = (key: keyof StoreColorsSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setVal = <K extends keyof StoreColorsSettings>(key: K, val: StoreColorsSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.colors = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ ألوان وإعدادات الثيم بنجاح' : 'Store colors and settings saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

  const colorInput = (
    label: string,
    key: keyof StoreColorsSettings,
    desc?: string,
  ) => (
    <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="min-w-0 pr-2">
        <span className="text-xs font-bold block">{label}</span>
        {desc && <span className="text-[10px] text-muted block truncate">{desc}</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={String(settings[key] || '')}
          onChange={(e) => setVal(key, e.target.value as any)}
          className="w-20 px-2 py-1 text-xs font-mono rounded-lg border outline-none text-center"
          style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
        />
        <input
          type="color"
          value={String(settings[key] || '#ffffff')}
          onChange={(e) => setVal(key, e.target.value as any)}
          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5"
        />
      </div>
    </div>
  );

  return (
    <form
      onSubmit={handleSave}
      className="rounded-2xl border p-5 sm:p-6 space-y-6"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--card-shadow)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0 unity-icon-box">
            <Palette className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Theme Settings · 03
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'ألوان المتجر والوضع الداكن' : 'Store Colors / Dark Mode'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'تخصيص لوحة ألوان واجهة المتجر، خلفيات الأقسام، وشاشات الانتظار'
                : 'Customize your store appearance and behavior with advanced theme settings'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          03_Store_Colors
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Store Colors & Dark Mode */}
        <div className="space-y-4">
          {/* Dark Mode Card */}
          <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase text-emerald-600">
              {isAr ? 'الوضع الداكن (Dark Mode)' : 'Dark Mode Options'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">{isAr ? 'تفعيل زر التبديل بين الفاتح والداكن' : 'Enable Dark / Light Mode Switch'}</span>
                  <span className="text-[11px] text-muted">{isAr ? 'يسمح للمتسوق بالتبديل بحرية' : 'Allows shoppers to toggle theme'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('enableDarkModeSwitch')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.enableDarkModeSwitch ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">{isAr ? 'إجبار الوضع الداكن' : 'Force Dark Mode'}</span>
                  <span className="text-[11px] text-muted">{isAr ? 'جعل المتجر باللون الداكن دائماً' : 'Always display store in dark palette'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('forceDarkMode')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.forceDarkMode ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            </div>
          </div>

          {/* Color Settings Palette */}
          <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase text-emerald-600">
              {isAr ? 'إعدادات الألوان الرئيسية' : 'Color Settings'}
            </h3>
            <div className="space-y-2">
              {colorInput(isAr ? 'لون خلفية المتجر الأساسي' : 'Primary Store Background Color', 'primaryBgColor')}
              {colorInput(isAr ? 'لون الخلفية الثانوية للأقسام' : 'Secondary Store Background Color', 'secondaryBgColor')}
              {colorInput(isAr ? 'لون النصوص الرئيسية والعناوين' : 'Main Text Color', 'mainTextColor')}
              {colorInput(isAr ? 'لون النصوص الفرعية والوصف' : 'Secondary Text Color', 'secondaryTextColor')}
              {colorInput(isAr ? 'لون خلفية الهيدر' : 'Header Background Color', 'headerBgColor')}
              {colorInput(isAr ? 'لون نصوص الهيدر' : 'Header Text Color', 'headerTextColor')}
              {colorInput(isAr ? 'لون خلفية بطاقات المنتجات' : 'Product Card Background Color', 'productCardBgColor')}
              {colorInput(isAr ? 'لون شارة التخفيضات والعروض' : 'Product Promotional Label Background', 'promoLabelBgColor')}
            </div>
          </div>
        </div>

        {/* Right Column: Loading Page, Patterns & Bottom Buttons */}
        <div className="space-y-4">
          {/* Loading Screen & Preloader Customization */}
          <div className="rounded-xl border p-4 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-bold uppercase text-emerald-600 flex items-center justify-between">
                <span>{isAr ? 'شاشات التحميل والإنتظار (Preloader Settings)' : 'Preloader & Loading Settings'}</span>
              </h3>
              <span className="text-[11px] text-muted block mt-0.5">
                {isAr ? 'التحكم في شاشات التحميل للمتجر ولوحة التحكم وتخصيص الشعار والنصوص' : 'Manage storefront and dashboard loaders, custom logo and text'}
              </span>
            </div>

            {/* Toggle 1: Theme Storefront Preloader */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-slate-50/50 dark:bg-slate-800/40" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-xs font-bold block">{isAr ? 'شاشة انتظار المتجر (Theme Preloader)' : 'Theme Storefront Preloader'}</span>
                <span className="text-[10px] text-muted block">{isAr ? 'إظهار شاشة تحميل فاخرة للعملاء عند فتح المتجر' : 'Show luxury splash preloader when customers enter store'}</span>
              </div>
              <button
                type="button"
                onClick={() => toggle('enableLoadingScreen')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.enableLoadingScreen ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Toggle 2: Dashboard Loader */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-slate-50/50 dark:bg-slate-800/40" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-xs font-bold block">{isAr ? 'شاشة تحميل لوحة التحكم (Dashboard Loader)' : 'Admin Dashboard Loader'}</span>
                <span className="text-[10px] text-muted block">{isAr ? 'إظهار مؤشر التحميل عند التناقل بين التبويبات' : 'Show loading screen during dashboard tab navigation'}</span>
              </div>
              <button
                type="button"
                onClick={() => toggle('enableDashboardLoader')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.enableDashboardLoader ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Customization Options */}
            {(settings.enableLoadingScreen || settings.enableDashboardLoader) && (
              <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                {/* Logo Image URL Option */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted block mb-1">
                    {isAr ? 'صورة / شعار شاشة التحميل (Logo Image URL)' : 'Preloader Logo Image URL'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.loadingLogoUrl || ''}
                      onChange={(e) => setVal('loadingLogoUrl', e.target.value)}
                      placeholder={activeStore.logo || 'https://.../logo.png'}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border outline-none font-mono"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                    />
                  </div>
                  <span className="text-[10px] text-muted block mt-1">
                    {isAr ? 'اكتب رابط الصورة مباشرة أو اتركه فارغاً لاستخدام شعار المتجر الافتراضي' : 'Leave empty to use default store logo'}
                  </span>
                </div>

                {/* Preloader Title Text Option */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted block mb-1">
                    {isAr ? 'عنوان شاشة التحميل (Main Title Text)' : 'Preloader Title Text'}
                  </label>
                  <input
                    type="text"
                    value={settings.loadingTitle || ''}
                    onChange={(e) => setVal('loadingTitle', e.target.value)}
                    placeholder={activeStore.name || 'هدايا مكة'}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  />
                </div>

                {/* Preloader Subtitle Text Option */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted block mb-1">
                    {isAr ? 'النص الفرعي / الوصف (Subtitle / Tagline)' : 'Preloader Subtitle / Tagline'}
                  </label>
                  <input
                    type="text"
                    value={settings.loadingSubtitle || ''}
                    onChange={(e) => setVal('loadingSubtitle', e.target.value)}
                    placeholder="Luxury Flowers & Gifts · زهور وهدايا فاخرة"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  />
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.loadingAnimatedLogo}
                      onChange={() => toggle('loadingAnimatedLogo')}
                      className="accent-emerald-600 rounded"
                    />
                    <span>{isAr ? 'حلقة متحركة حول الشعار' : 'Animated Outer Ring'}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.loadingIndicator}
                      onChange={() => toggle('loadingIndicator')}
                      className="accent-emerald-600 rounded"
                    />
                    <span>{isAr ? 'مؤشر التقدم' : 'Progress Bar'}</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Pattern Background */}
          <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase text-emerald-600">
                  {isAr ? 'الخلفية المزخرفة (Pattern Background)' : 'Pattern Background'}
                </h3>
                <span className="text-[11px] text-muted">{isAr ? 'إضافة نقش خفيف وأنيق لخلفية المتجر' : 'Add a subtle pattern background to store'}</span>
              </div>
              <button
                type="button"
                onClick={() => toggle('enablePatternBg')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.enablePatternBg ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {settings.enablePatternBg && (
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                  {isAr ? 'نمط النقش' : 'Pattern Style'}
                </span>
                <select
                  value={settings.patternStyle}
                  onChange={(e) => setVal('patternStyle', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border outline-none cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                >
                  <option value="subtle-dots">Subtle Dots (نقاط ناعمة)</option>
                  <option value="islamic-arabesque">Islamic Geometric Arabesque (زخارف إسلامية هندسية)</option>
                  <option value="moroccan-lattice">Moroccan Lattice (شبكة مغربية ملكية)</option>
                  <option value="floral-petals">Floral Petals (بتلات الزهور الطبيعية)</option>
                </select>
              </div>
            )}
          </div>

          {/* Bottom Floating Action Buttons */}
          <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase text-emerald-600">
              {isAr ? 'الأزرار السفلية العائمة' : 'Bottom Floating Buttons'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold block">{isAr ? 'زر الصعود للأعلى' : 'Back To Top Button'}</span>
                    <span className="text-[11px] text-muted">{isAr ? 'زر سريع للتمرير لأول الصفحة' : 'Scroll back to page top'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('enableBackToTop')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.enableBackToTop ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold block">{isAr ? 'زر محادثة واتساب' : 'WhatsApp Contact Button'}</span>
                    <span className="text-[11px] text-muted">{isAr ? 'زر عائم مباشر لمراسلة الدعم' : 'Direct floating WhatsApp chat'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('enableWhatsAppBtn')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.enableWhatsAppBtn ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold block">{isAr ? 'زر الاتصال الهاتفي' : 'Phone Call Button'}</span>
                    <span className="text-[11px] text-muted">{isAr ? 'زر اتصال هاتفي مباشر' : 'Direct phone call trigger'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('enablePhoneBtn')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.enablePhoneBtn ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => {
            const full = readAllThemeSettings(activeStore.id, activeStore);
            setSettings(full.colors);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved colors', 'info');
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'استرجاع' : 'Reset'}</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer transition-all hover:opacity-90 unity-btn-primary"
        >
          {savedFlash ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ الألوان' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
