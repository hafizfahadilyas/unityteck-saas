import React, { useState } from 'react';
import { Save, Check, RotateCcw, FolderTree, ShoppingBag, UserCheck, Upload, ChevronRight } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type CategoryCartCustomerSettings,
} from '../../../themes/settings/themeSettingsStore';
import { MediaUploadField } from '../../common/MediaUploadField';

export const CategoryCartCustomerForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<CategoryCartCustomerSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.categoryCartCustomer;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const toggle = (key: keyof CategoryCartCustomerSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setVal = <K extends keyof CategoryCartCustomerSettings>(key: K, val: CategoryCartCustomerSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.categoryCartCustomer = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إعدادات التصنيفات والسلة والعميل' : 'Category, cart and customer settings saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

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
            <FolderTree className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Theme Settings · 04
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'صفحات التصنيفات والسلة وحسابات العملاء' : 'Category Pages, Cart & Customer Pages Settings'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'تهيئة صفحات التصنيف، خيارات سلة الشراء، وشاشات تسجيل الدخول للعملاء'
                : 'Configure category pages, cart settings and customer pages to improve the shopping experience'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          04_Category_Cart_Customer
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Category Pages & Cart Page */}
        <div className="space-y-6">
          {/* Category Pages Card */}
          <div className="rounded-xl border p-4 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase text-emerald-600">
                {isAr ? 'صفحات التصنيفات (Category Pages)' : 'Category Pages'}
              </h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">{isAr ? 'التحميل التلقائي للمنتجات' : 'Auto Load Products'}</span>
                  <span className="text-[11px] text-muted">{isAr ? 'تحميل المزيد عند التمرير لأسفل الصفحة' : 'Automatically load more products when scrolling'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('autoLoadProducts')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.autoLoadProducts ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Category & Shop Banner Upload */}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <MediaUploadField
                  label={isAr ? 'بانر التصنيف وصفحة المتجر الرئيسي' : 'Category & Shop Banner Image'}
                  value={settings.categoryBannerUrl || ''}
                  onChange={(url) => setVal('categoryBannerUrl', url)}
                  aspectRatio="banner"
                  initialFolder="banners"
                  recommendedSize="1920 × 600 px"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <span className="text-xs font-bold block">{isAr ? 'التصنيفات الفرعية' : 'Subcategories'}</span>
                  <span className="text-[11px] text-muted">{isAr ? 'إظهار أقسام التصنيف الفرعية' : 'Show subcategories on category pages'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('subcategories')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.subcategories ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <span className="text-xs font-bold block">{isAr ? 'مسار التصفح بالتصنيف' : 'Breadcrumbs'}</span>
                  <span className="text-[11px] text-muted">{isAr ? 'إظهار مسار التنقل داخل التصنيف' : 'Show breadcrumb navigation on category pages'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('breadcrumbs')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.breadcrumbs ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            </div>
          </div>

          {/* Cart Page Card */}
          <div className="rounded-xl border p-4 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase text-emerald-600">
                {isAr ? 'صفحة السلة (Cart Page)' : 'Cart Page'}
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">{isAr ? 'السلة المطورة السريعة' : 'Enhanced Cart'}</span>
                  <span className="text-[11px] text-muted">{isAr ? 'سلة شراء متطورة بخيارات ومعلومات إضافية' : 'Enable enhanced cart page with additional options'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('enhancedCart')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.enhancedCart ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <span className="text-xs font-bold block">{isAr ? 'المنتجات المقترحة بالسلة' : 'Recommended Products'}</span>
                  <span className="text-[11px] text-muted">{isAr ? 'عرض منتجات مقترحة لزيادة سلة المشتريات' : 'Show recommended products in the cart page'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('recommendedProducts')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.recommendedProducts ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {settings.recommendedProducts && (
                <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold uppercase text-muted block mb-1.5">
                    {isAr ? 'طريقة عرض المنتجات المقترحة' : 'Recommended Products Display Style'}
                  </span>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                      <input
                        type="radio"
                        name="recStyle"
                        checked={settings.recommendedDisplayStyle === 'grid'}
                        onChange={() => setVal('recommendedDisplayStyle', 'grid')}
                        className="accent-emerald-600"
                      />
                      <span>{isAr ? 'شبكة منتجات (Grid)' : 'Products Grid'}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                      <input
                        type="radio"
                        name="recStyle"
                        checked={settings.recommendedDisplayStyle === 'slider'}
                        onChange={() => setVal('recommendedDisplayStyle', 'slider')}
                        className="accent-emerald-600"
                      />
                      <span>{isAr ? 'شريط تمرير (Slider)' : 'Products Slider'}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Pages */}
        <div className="space-y-6">
          <div className="rounded-xl border p-4 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase text-emerald-600">
                {isAr ? 'صفحات العملاء (Customer Pages)' : 'Customer Pages'}
              </h3>
            </div>

            {/* Background image upload */}
            <div className="pt-2">
              <MediaUploadField
                label={isAr ? 'صورة خلفية صفحات العميل' : 'Customer Account Background Image'}
                value={settings.customerBgImage || ''}
                onChange={(url) => setVal('customerBgImage', url)}
                aspectRatio="banner"
                initialFolder="general"
                recommendedSize="1920 × 1080 px"
              />
            </div>

            {/* Login Style */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-bold block mb-1">{isAr ? 'ستايل صفحة الدخول' : 'Login Page Style'}</span>
              <div className="flex items-center gap-4 text-xs">
                {(['image', 'solid', 'minimal'] as const).map((style) => (
                  <label key={style} className="flex items-center gap-1.5 cursor-pointer capitalize">
                    <input
                      type="radio"
                      name="loginStyle"
                      checked={settings.loginPageStyle === style}
                      onChange={() => setVal('loginPageStyle', style)}
                      className="accent-emerald-600"
                    />
                    <span>{style}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Register Style */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-bold block mb-1">{isAr ? 'ستايل صفحة التسجيل' : 'Register Page Style'}</span>
              <div className="flex items-center gap-4 text-xs">
                {(['image', 'solid', 'minimal'] as const).map((style) => (
                  <label key={style} className="flex items-center gap-1.5 cursor-pointer capitalize">
                    <input
                      type="radio"
                      name="registerStyle"
                      checked={settings.registerPageStyle === style}
                      onChange={() => setVal('registerPageStyle', style)}
                      className="accent-emerald-600"
                    />
                    <span>{style}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Account Style */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-bold block mb-1">{isAr ? 'ستايل صفحة الملف الشخصي' : 'Account Page Style'}</span>
              <div className="flex items-center gap-4 text-xs">
                {(['image', 'solid', 'minimal'] as const).map((style) => (
                  <label key={style} className="flex items-center gap-1.5 cursor-pointer capitalize">
                    <input
                      type="radio"
                      name="accountStyle"
                      checked={settings.accountPageStyle === style}
                      onChange={() => setVal('accountPageStyle', style)}
                      className="accent-emerald-600"
                    />
                    <span>{style}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-bold uppercase text-emerald-600">
              {isAr ? 'خيارات إضافية' : 'Additional Options'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">{isAr ? 'إظهار زر واتساب بصفحات العميل' : 'Show WhatsApp Button In Customer Pages'}</span>
                  <span className="text-[11px] text-muted">{isAr ? 'مساعدة فورية خلال التسجيل والشراء' : 'Display a WhatsApp contact button on auth pages'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('showWhatsAppInCustomer')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.showWhatsAppInCustomer ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <span className="text-xs font-bold block">{isAr ? 'إظهار زر الهاتف بصفحات العميل' : 'Show Phone Button In Customer Pages'}</span>
                  <span className="text-[11px] text-muted">{isAr ? 'إمكانية الاتصال المباشر' : 'Display a phone call button on customer pages'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('showPhoneInCustomer')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.showPhoneInCustomer ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
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
            setSettings(full.categoryCartCustomer);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved settings', 'info');
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
