import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  ShoppingCart,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  User,
  Edit2,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  ArrowRight,
  Check,
  Type,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface DirectOrderSettings {
  isEnabled: boolean;
  thankYouMessage: string;
  maxDailyOrders: number;
  availableCountries: string;
  isEmailRequired: boolean;
  storeColorTheme: 'gray' | 'white' | 'brand';
  headlineTitle: string;
  headlineSubtitle: string;
  badgeText: string;
  buttonText: string;
}

interface StoreDirectOrdersProps {
  onNavigateTab?: (tab: string) => void;
}

export const StoreDirectOrders: React.FC<StoreDirectOrdersProps> = ({ onNavigateTab }) => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const storageKey = `unityteck_direct_order_${activeStore.id}`;

  const [settings, setSettings] = useState<DirectOrderSettings>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      isEnabled: true,
      thankYouMessage: isAr ? 'شكراً لطلبك!' : 'Thank you!',
      maxDailyOrders: 1,
      availableCountries: isAr ? 'جميع الدول، المملكة العربية السعودية' : 'All Countries, Saudi Arabia',
      isEmailRequired: false,
      storeColorTheme: 'gray',
      headlineTitle: isAr ? 'ماذا تنتظر؟' : 'What are you waiting for?',
      headlineSubtitle: isAr ? 'احصل على المنتج مباشرة الآن' : 'Get the product directly now',
      badgeText: isAr ? 'اطلب الآن' : 'Order Now',
      buttonText: isAr ? 'طلب المنتج' : 'Order Product',
    };
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form preview interactive editable modal states
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      // storage unavailable
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-6 space-y-6 max-w-[1650px] mx-auto text-slate-800 dark:text-slate-100" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Breadcrumbs */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span
            onClick={() => onNavigateTab && onNavigateTab('marketing')}
            className="cursor-pointer hover:underline text-teal-600 dark:text-teal-400 font-medium"
          >
            {isAr ? 'أدوات التسويق' : 'Marketing Tools'}
          </span>
          <span>&gt;</span>
          <span className="text-gray-900 dark:text-gray-100 font-semibold">
            {isAr ? 'الطلب المباشر' : 'Direct Order'}
          </span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-sm">
            {isAr ? 'تم حفظ إعدادات الطلب المباشر بنجاح!' : 'Direct Order settings saved successfully!'}
          </span>
        </div>
      )}

      {/* Hero Banner: Faster Orders, More Sales */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-50/80 via-emerald-50/60 to-white dark:from-slate-900 dark:via-teal-950/20 dark:to-slate-900 border border-teal-100 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-xl space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {isAr ? 'طلبات أسرع، ومبيعات أكثر' : 'Faster Orders, More Sales'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {isAr
                ? 'اسمح لعملائك بطلب المنتجات مباشرة ببضع خطوات سهلة دون الحاجة للمرور بسلة التسوق الكاملة لتجربة شراء انسيابية وفائقة السرعة.'
                : 'Let customers order products directly in a few simple steps for a smoother checkout experience.'}
            </p>
            <div className="pt-1">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                {isAr ? 'معرفة المزيد' : 'Learn More'}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {isAr ? 'متاح في باقتك' : 'Available on your plan'}
              </span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {isAr ? 'الطلب المباشر' : 'Direct Order'}
              </span>
            </div>

            {/* 3D Basket Illustration representation */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-teal-100/60 dark:bg-teal-900/30 border border-teal-200/60 dark:border-teal-700/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-inner">
              <ShoppingCart className="w-12 h-12 stroke-[1.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* Direct Order Settings Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {isAr ? 'الطلب المباشر' : 'Direct Order'}
        </h2>

        {/* Enable Direct Order */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {isAr ? 'تفعيل الطلب المباشر' : 'Enable Direct Order'}
          </span>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, isEnabled: !settings.isEnabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.isEnabled ? 'bg-teal-600' : 'bg-gray-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                settings.isEnabled
                  ? isAr
                    ? '-translate-x-5'
                    : 'translate-x-5'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Thank You Message */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-2 border-b border-gray-100 dark:border-slate-800">
          <label className="md:col-span-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
            {isAr ? 'رسالة الشكر' : 'Thank You Message'}
          </label>
          <div className="md:col-span-8 relative">
            <input
              type="text"
              value={settings.thankYouMessage}
              onChange={(e) => setSettings({ ...settings, thankYouMessage: e.target.value })}
              className="w-full px-4 py-2.5 pe-10 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <span className="absolute end-3.5 top-3 text-gray-400 font-serif font-bold text-xs pointer-events-none">
              T
            </span>
          </div>
        </div>

        {/* Maximum Daily Orders */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-2 border-b border-gray-100 dark:border-slate-800">
          <label className="md:col-span-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
            {isAr ? 'الحد الأقصى للطلبات اليومية (اختياري)' : 'Maximum Daily Orders (Optional)'}
          </label>
          <div className="md:col-span-8 relative">
            <input
              type="number"
              min={1}
              value={settings.maxDailyOrders}
              onChange={(e) => setSettings({ ...settings, maxDailyOrders: Number(e.target.value) })}
              className="w-full px-4 py-2.5 pe-10 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <Calendar className="w-4 h-4 absolute end-3.5 top-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Countries Where Service Is Available */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-2 border-b border-gray-100 dark:border-slate-800">
          <label className="md:col-span-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
            {isAr ? 'الدول المتاح بها هذه الخدمة' : 'Countries Where This Service Is Available'}
          </label>
          <div className="md:col-span-8 relative">
            <select
              value={settings.availableCountries}
              onChange={(e) => setSettings({ ...settings, availableCountries: e.target.value })}
              className="w-full px-4 py-2.5 pe-10 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none"
            >
              <option value="All Countries, Saudi Arabia">
                {isAr ? 'جميع الدول، المملكة العربية السعودية' : 'All Countries, Saudi Arabia'}
              </option>
              <option value="Saudi Arabia Only">
                {isAr ? 'المملكة العربية السعودية فقط' : 'Saudi Arabia Only'}
              </option>
              <option value="GCC Countries">
                {isAr ? 'دول الخليج العربي' : 'GCC Countries'}
              </option>
            </select>
            <Globe className="w-4 h-4 absolute end-3.5 top-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Is Email Required */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {isAr ? 'هل البريد الإلكتروني إلزامي؟' : 'Is Email Required?'}
          </span>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, isEmailRequired: !settings.isEmailRequired })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.isEmailRequired ? 'bg-teal-600' : 'bg-gray-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                settings.isEmailRequired
                  ? isAr
                    ? '-translate-x-5'
                    : 'translate-x-5'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Store Color */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-2">
          <label className="md:col-span-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
            {isAr ? 'لون المتجر' : 'Store Color'}
          </label>
          <div className="md:col-span-8 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="storeColor"
                checked={settings.storeColorTheme === 'gray'}
                onChange={() => setSettings({ ...settings, storeColorTheme: 'gray' })}
                className="text-teal-600 focus:ring-teal-500"
              />
              <span className="w-3.5 h-3.5 rounded-full bg-gray-500 inline-block" />
              <span>{isAr ? 'رمادي' : 'Gray'}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="storeColor"
                checked={settings.storeColorTheme === 'white'}
                onChange={() => setSettings({ ...settings, storeColorTheme: 'white' })}
                className="text-teal-600 focus:ring-teal-500"
              />
              <span className="w-3.5 h-3.5 rounded-full bg-white border border-gray-400 inline-block" />
              <span>{isAr ? 'أبيض' : 'White'}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="storeColor"
                checked={settings.storeColorTheme === 'brand'}
                onChange={() => setSettings({ ...settings, storeColorTheme: 'brand' })}
                className="text-teal-600 focus:ring-teal-500"
              />
              <span className="w-3.5 h-3.5 rounded-full bg-teal-600 inline-block" />
              <span>{isAr ? 'لون المتجر' : 'Store Color'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Direct Order Form Preview */}
      <div className="space-y-3">
        <h3 className="text-center text-base font-bold text-gray-900 dark:text-white">
          {isAr ? 'معاينة نموذج الطلب المباشر' : 'Direct Order Form Preview'}
        </h3>

        <div className="max-w-2xl mx-auto bg-gray-100/80 dark:bg-slate-900/90 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 sm:p-8 shadow-md">
          {/* Top header inside preview */}
          <div className="flex items-start justify-between gap-4 mb-6">
            {/* Badge pill */}
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gray-300 dark:bg-slate-700 text-gray-800 dark:text-gray-200 text-xs font-bold">
              <span>{settings.badgeText}</span>
              <button
                type="button"
                onClick={() => {
                  const val = prompt(isAr ? 'أدخل نص الشارة:' : 'Enter badge text:', settings.badgeText);
                  if (val) setSettings({ ...settings, badgeText: val });
                }}
                className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700"
                title="Edit"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Headings */}
            <div className="text-end space-y-1">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {settings.headlineTitle}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const val = prompt(isAr ? 'أدخل العنوان الصغير:' : 'Enter title:', settings.headlineTitle);
                    if (val) setSettings({ ...settings, headlineTitle: val });
                  }}
                  className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-1.5">
                <span className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                  {settings.headlineSubtitle}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const val = prompt(isAr ? 'أدخل العنوان الرئيسي:' : 'Enter subtitle:', settings.headlineSubtitle);
                    if (val) setSettings({ ...settings, headlineSubtitle: val });
                  }}
                  className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Input Fields Preview */}
          <div className="space-y-3.5">
            {/* Full Name */}
            <div className="relative">
              <input
                type="text"
                disabled
                placeholder={isAr ? 'الاسم الكامل' : 'Full Name'}
                className="w-full px-4 py-3 pe-10 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400"
              />
              <User className="w-4 h-4 absolute end-3.5 top-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Email & Mobile Number Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="relative">
                <input
                  type="text"
                  disabled
                  placeholder={
                    settings.isEmailRequired
                      ? isAr
                        ? 'البريد الإلكتروني *'
                        : 'Email *'
                      : isAr
                      ? 'البريد الإلكتروني (اختياري)'
                      : 'Email (Optional)'
                  }
                  className="w-full px-4 py-3 pe-10 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                />
                <Mail className="w-4 h-4 absolute end-3.5 top-3.5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  disabled
                  placeholder={isAr ? 'رقم الجوال' : 'Mobile Number'}
                  className="w-full px-4 py-3 pe-10 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                />
                <Phone className="w-4 h-4 absolute end-3.5 top-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* CTA Order Button Preview */}
            <div className="pt-2">
              <div
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 shadow-sm transition-all ${
                  settings.storeColorTheme === 'brand'
                    ? 'bg-teal-600 text-white'
                    : settings.storeColorTheme === 'white'
                    ? 'bg-white text-gray-900 border border-gray-300'
                    : 'bg-neutral-600 text-white'
                }`}
              >
                <span>{settings.buttonText}</span>
                <button
                  type="button"
                  onClick={() => {
                    const val = prompt(isAr ? 'أدخل نص زر الطلب:' : 'Enter button text:', settings.buttonText);
                    if (val) setSettings({ ...settings, buttonText: val });
                  }}
                  className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center"
                >
                  <Edit2 className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 px-6 rounded-xl bg-teal-400 hover:bg-teal-500 text-teal-950 font-bold text-sm transition-colors shadow-md text-center"
        >
          {isAr ? 'حفظ' : 'Save'}
        </button>
      </div>
    </div>
  );
};
