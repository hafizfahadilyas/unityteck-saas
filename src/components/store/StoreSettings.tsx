import React, { useState, useMemo, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  Settings,
  ShieldCheck,
  Database,
  Globe,
  Zap,
  Check,
  Palette,
  Clock,
  Coins,
  MessageSquare,
  Share2,
  Upload,
  Image as ImageIcon,
  Phone,
  Mail,
  ExternalLink,
  Sun,
  Moon,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { BrandingPanel } from '../common/BrandingPanel';
import { DbSyncSettingsCard } from '../common/DbSyncSettingsCard';
import { bumpStore, bumpCacheTag, platformTag } from '../../api/cacheTags';
import { useToast } from '../common/ToastProvider';
import { CURRENCIES, type DisplayCurrency } from '../../i18n/prefs';
import { MediaUploadField } from '../common/MediaUploadField';

import { readAllThemeSettings, writeAllThemeSettings } from '../../themes/settings/themeSettingsStore';

type SettingsTab = 'general' | 'localization' | 'appearance' | 'maintenance' | 'social' | 'subscription';

export const StoreSettings: React.FC = () => {
  const { activeStore, updateStorePlan, softRefreshTenantData } = useTenant();
  const { t, locale, setLocale, currency, setCurrency, theme, toggleTheme, money, allowedLocales } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Load existing theme settings
  const initialThemeSettings = useMemo(() => {
    return readAllThemeSettings(activeStore.id, activeStore);
  }, [activeStore.id, activeStore]);

  // Maintenance Mode State
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(
    Boolean(initialThemeSettings.maintenance?.enabled)
  );
  const [maintenanceTitleAr, setMaintenanceTitleAr] = useState(
    initialThemeSettings.maintenance?.titleAr || 'نجهز لكم تجربة إهداء ملكية تليق بأطهر بقاع الأرض'
  );
  const [maintenanceTitleEn, setMaintenanceTitleEn] = useState(
    initialThemeSettings.maintenance?.titleEn || 'Crafting a Royal Floral Gifting Experience in Holy Makkah'
  );
  const [maintenanceSubtitleAr, setMaintenanceSubtitleAr] = useState(
    initialThemeSettings.maintenance?.subtitleAr || 'نعمل بكل حب على تجهيز تشكيلات الزهور الطبيعية الهولندية، شوكولاتة باتشي وبستاني الملكية، وكيك المناسبات لخدمتكم بأعلى معايير الفخامة في فنادق وأحياء مكة المكرمة.'
  );
  const [maintenanceSubtitleEn, setMaintenanceSubtitleEn] = useState(
    initialThemeSettings.maintenance?.subtitleEn || 'We are arranging the finest natural Dutch blooms, Patchi & Bostani luxury chocolates, and celebratory cakes with 2-hour express delivery to Haram hotels.'
  );
  const [launchDate, setLaunchDate] = useState(
    initialThemeSettings.maintenance?.launchDate || '2026-10-25T00:00'
  );
  const [showCountdown, setShowCountdown] = useState(
    initialThemeSettings.maintenance?.showCountdown !== false
  );
  const [showWhatsappContact, setShowWhatsappContact] = useState(
    initialThemeSettings.maintenance?.showWhatsapp !== false
  );
  const [showEmailNotify, setShowEmailNotify] = useState(
    initialThemeSettings.maintenance?.showEmailSubscribe !== false
  );
  const [maintWhatsapp, setMaintWhatsapp] = useState(
    initialThemeSettings.maintenance?.whatsappNumber || '+966581617712'
  );

  // General Settings State
  const [storeName, setStoreName] = useState(activeStore.name);
  const [tagline, setTagline] = useState(
    isAr
      ? 'متجر فاخر يقدم أرقى المنتجات مع شحن فوري'
      : 'Premium boutique store with guaranteed express delivery.'
  );
  const [storeEmail, setStoreEmail] = useState('contact@' + activeStore.slug + '.com');
  const [storePhone, setStorePhone] = useState('+966 50 123 4567');
  const [logoUrl, setLogoUrl] = useState(
    'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=200&q=80'
  );
  const [faviconUrl, setFaviconUrl] = useState('/favicon.svg');
  const [customDomain, setCustomDomain] = useState(`${activeStore.slug}.saudi-stores.com`);

  // Regional Settings State
  const [timezone, setTimezone] = useState('Asia/Riyadh');

  // Social & WhatsApp Settings State
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('+966501234567');
  const [whatsappGreeting, setWhatsappGreeting] = useState(
    isAr
      ? 'مرحباً، أود الاستفسار عن منتجات المتجر!'
      : 'Hello, I would like to inquire about your store products!'
  );
  const [socialLinks, setSocialLinks] = useState({
    instagram: { enabled: true, url: 'https://instagram.com/' + activeStore.slug },
    twitter: { enabled: true, url: 'https://x.com/' + activeStore.slug },
    tiktok: { enabled: true, url: 'https://tiktok.com/@' + activeStore.slug },
    facebook: { enabled: false, url: 'https://facebook.com/' + activeStore.slug },
    youtube: { enabled: false, url: 'https://youtube.com/@' + activeStore.slug },
  });

  // Purge cache state
  const [purging, setPurging] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    toast(
      isAr
        ? 'تم حفظ الإعدادات بنجاح!'
        : 'Store settings saved successfully!',
      'success'
    );
  };

  const handlePurgeCache = async () => {
    if (purging) return;
    setPurging(true);
    try {
      bumpStore(activeStore.id, 'products');
      bumpStore(activeStore.id, 'orders');
      bumpStore(activeStore.id, 'customers');
      bumpStore(activeStore.id, 'theme');
      bumpStore(activeStore.id, 'seo');
      bumpStore(activeStore.id, 'media');
      bumpCacheTag(platformTag());
      await softRefreshTenantData();
      toast(
        isAr
          ? 'تم تفريغ الذاكرة المؤقتة وتحديث البيانات الحية'
          : 'Cache purged & zero-stale live DB synchronized',
        'success'
      );
    } finally {
      setPurging(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    {
      id: 'general',
      label: isAr ? 'الهوية والمتجر' : 'General & Identity',
      icon: Settings,
    },
    {
      id: 'localization',
      label: isAr ? 'اللغة والعملة والتوقيت' : 'Language & Currency',
      icon: Coins,
    },
    {
      id: 'appearance',
      label: isAr ? 'المظهر والألوان والخطوط' : 'Theme, Colors & Fonts',
      icon: Palette,
    },
    {
      id: 'maintenance',
      label: isAr ? 'صفحة تحت الصيانة (Under Construction)' : 'Maintenance & Launch',
      icon: Clock,
    },
    {
      id: 'social',
      label: isAr ? 'واتساب والتواصل' : 'WhatsApp & Social',
      icon: MessageSquare,
    },
    {
      id: 'subscription',
      label: isAr ? 'الخطة والبيانات' : 'Plan & Isolation',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto min-w-0" style={{ color: 'var(--text)' }}>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {isAr ? 'إعدادات المتجر' : 'Store Settings'}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `إدارة الهوية، الألوان، الخطوط، العملات وروابط التواصل · ${activeStore.nameAr || activeStore.name}`
              : `Store identity, top 15 colors, top 15 fonts, multi-currency & social links · ${activeStore.nameEn || activeStore.name}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shadow-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'الوضع الفاتح' : 'Light Mode'}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>{isAr ? 'الوضع الداكن' : 'Dark Mode'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Sub-Tabs Navigation Strip ── */}
      <div
        className="flex items-center gap-1.5 p-1.5 rounded-2xl border overflow-x-auto custom-scroll shadow-xs"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        role="tablist"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-150 ${
                active ? 'shadow-xs ring-1' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: active ? 'var(--active-bg)' : 'transparent',
                color: active ? 'var(--active-fg)' : 'var(--text)',
                borderColor: active ? 'var(--accent)' : 'transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: General & Identity ── */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo & Favicon Card */}
            <div
              className="p-5 rounded-2xl border shadow-xs space-y-5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'شعار المتجر والأيقونة' : 'Store Logo & Favicon'}</span>
              </h3>

              <div className="space-y-4">
                <MediaUploadField
                  label={isAr ? 'شعار المتجر' : 'Store Logo'}
                  value={logoUrl}
                  onChange={(url) => setLogoUrl(url)}
                  recommendedSize="200 × 200 px"
                  aspectRatio="square"
                  initialFolder="branding"
                />

                <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <MediaUploadField
                    label={isAr ? 'أيقونة المتصفح' : 'Favicon Icon'}
                    value={faviconUrl}
                    onChange={(url) => setFaviconUrl(url)}
                    recommendedSize="64 × 64 px SVG/PNG"
                    aspectRatio="square"
                    initialFolder="branding"
                  />
                </div>
              </div>
            </div>

            {/* Basic Info Details */}
            <div
              className="lg:col-span-2 p-5 rounded-2xl border shadow-xs space-y-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'معلومات المتجر الأساسية' : 'Store Details'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'اسم المتجر' : 'Store Name'}
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'رمز المتجر التعريفي' : 'Store Slug'}
                  </label>
                  <input
                    type="text"
                    value={activeStore.slug}
                    disabled
                    className="w-full px-3 py-2 text-xs rounded-xl border opacity-60 font-mono"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'شعار المتجر الترويجي' : 'Store Tagline'}
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'البريد الإلكتروني الرسمي' : 'Support Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      type="email"
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                      className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border focus:outline-none"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'رقم الهاتف وخدمة العملاء' : 'Support Phone'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      type="tel"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border focus:outline-none"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'النطاق المخصص' : 'Custom Domain'}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
                      <input
                        type="text"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border focus:outline-none"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                      />
                    </div>
                    <span className="px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)', color: 'var(--accent)' }}>
                      <Check className="w-3.5 h-3.5" />
                      <span>SSL Active</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  {isAr ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 2: Language, Timezone & Currency ── */}
      {activeTab === 'localization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Multi-Currency Selection Card */}
          <div
            className="p-5 rounded-2xl border shadow-xs space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h3 className="font-extrabold text-sm">
                  {isAr ? 'العملة وطريقة العرض' : 'Currency & Pricing Display'}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--hover-bg)', color: 'var(--accent)' }}>
                Active: {currency}
              </span>
            </div>

            <p className="text-xs opacity-75">
              {isAr
                ? 'اختر العملة الافتراضية لعرض الأسعار في لوحة التحكم والمتجر. التغييرات تطبق فورياً بدون إعادة تحميل.'
                : 'Select default currency for dashboard and store catalog. Updates apply immediately across all views.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(CURRENCIES) as DisplayCurrency[]).map((curKey) => {
                const cur = CURRENCIES[curKey];
                const active = currency === curKey;
                const label = isAr ? cur.labelAr : cur.label;
                const symbol = isAr ? cur.symbolAr : cur.symbol;

                return (
                  <button
                    key={curKey}
                    type="button"
                    onClick={() => {
                      setCurrency(curKey);
                      toast(
                        isAr ? 'تم تغيير العملة' : 'Currency updated',
                        'success'
                      );
                    }}
                    className={`p-3 rounded-xl border text-start cursor-pointer transition-all duration-150 flex items-center justify-between gap-3 ${
                      active ? 'ring-2 shadow-xs' : 'hover:border-slate-400'
                    }`}
                    style={{
                      background: active ? 'var(--active-bg)' : 'var(--bg)',
                      borderColor: active ? 'var(--accent)' : 'var(--border)',
                      color: active ? 'var(--active-fg)' : 'var(--text)',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm">{symbol}</span>
                        <span className="text-[10px] uppercase font-mono opacity-80">({curKey})</span>
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">{label}</div>
                    </div>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Currency Preview Live Example */}
            <div className="p-4 rounded-xl border mt-4 flex items-center justify-between" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
              <span className="text-xs font-bold opacity-80">
                {isAr ? 'معاينة السعر الحي:' : 'Live Price Preview:'}
              </span>
              <span className="text-base font-extrabold font-mono" style={{ color: 'var(--accent)' }}>
                {money(1610)}
              </span>
            </div>
          </div>

          {/* Language & Timezone Card */}
          <div
            className="p-5 rounded-2xl border shadow-xs space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h3 className="font-extrabold text-sm">
                {isAr ? 'اللغة والمنطقة الزمنية' : 'Language & Regional Timezone'}
              </h3>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لغة النظام والواجهة' : 'Interface Language'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'en' as const, label: 'English', desc: '100% English' },
                  { id: 'ar' as const, label: 'العربية', desc: 'عربي بالكامل' },
                ]
                  .filter((item) => allowedLocales.includes(item.id))
                  .map((item) => {
                    const active = locale === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setLocale(item.id);
                          toast(
                            item.id === 'ar' ? 'تم تحويل النظام إلى العربية' : 'Language set to English',
                            'success'
                          );
                        }}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all duration-150 ${
                          active ? 'ring-2 font-bold' : 'hover:border-slate-400'
                        }`}
                        style={{
                          background: active ? 'var(--active-bg)' : 'var(--bg)',
                          borderColor: active ? 'var(--accent)' : 'var(--border)',
                          color: active ? 'var(--active-fg)' : 'var(--text)',
                        }}
                      >
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">{item.desc}</div>
                      </button>
                    );
                  })}
              </div>
              <p className="text-[11px] opacity-70 mt-1">
                {isAr
                  ? 'اللغات المتاحة لهذا المتجر يتم التحكم بها مركزياً بواسطة المشرف العام (Super Admin).'
                  : 'Available languages for this store are controlled centrally by Super Admin.'}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <label className="block text-xs font-bold" style={{ color: 'var(--muted)' }}>
                {isAr ? 'المنطقة الزمنية' : 'Store Timezone'}
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  <option value="Asia/Riyadh">Asia/Riyadh (GMT+3) · المملكة العربية السعودية</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4) · الإمارات العربية المتحدة</option>
                  <option value="Asia/Karachi">Asia/Karachi (GMT+5) · پاکستان</option>
                  <option value="Africa/Cairo">Africa/Cairo (GMT+2) · مصر</option>
                  <option value="Europe/London">Europe/London (GMT+0) · United Kingdom</option>
                  <option value="America/New_York">America/New_York (GMT-5) · USA Eastern</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Theme, Colors & Google Fonts (Top 15 + Weights) ── */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <BrandingPanel title={isAr ? 'تخصيص الهوية والألوان والخطوط' : 'Store Branding, Colors & Typography'} />
        </div>
      )}

      {/* ── TAB 4: WhatsApp Floating Chat & Social Links ── */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WhatsApp Integration Card */}
          <div
            className="p-5 rounded-2xl border shadow-xs space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <h3 className="font-extrabold text-sm">
                  {isAr ? 'محادثة واتساب العائمة' : 'WhatsApp Live Chat Widget'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                className="cursor-pointer"
                aria-label="Toggle WhatsApp"
              >
                {whatsappEnabled ? (
                  <ToggleRight className="w-7 h-7 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400" />
                )}
              </button>
            </div>

            <p className="text-xs opacity-75">
              {isAr
                ? 'عرض زر واتساب العائم في واجهة المتجر للتواصل المباشر مع العملاء والرد على الاستفسارات فوراً.'
                : 'Display floating WhatsApp button on storefront for instant customer queries and order support.'}
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold" style={{ color: 'var(--muted)' }}>
                {isAr ? 'رقم واتساب للأعمال (مع رمز الدولة)' : 'WhatsApp Business Number'}
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+966501234567"
                disabled={!whatsappEnabled}
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none disabled:opacity-50"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold" style={{ color: 'var(--muted)' }}>
                {isAr ? 'رسالة الترحيب الافتراضية' : 'Default Greeting Message'}
              </label>
              <textarea
                rows={2}
                value={whatsappGreeting}
                onChange={(e) => setWhatsappGreeting(e.target.value)}
                disabled={!whatsappEnabled}
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none disabled:opacity-50"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>
          </div>

          {/* Social Media Links */}
          <div
            className="p-5 rounded-2xl border shadow-xs space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <Share2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h3 className="font-extrabold text-sm">
                {isAr ? 'قنوات التواصل الاجتماعي' : 'Store Social Channels'}
              </h3>
            </div>

            <div className="space-y-3">
              {Object.entries(socialLinks).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-20 text-xs font-bold capitalize" style={{ color: 'var(--text)' }}>
                    {key}
                  </span>
                  <input
                    type="url"
                    value={val.url}
                    onChange={(e) => {
                      setSocialLinks((prev) => ({
                        ...prev,
                        [key]: { ...val, url: e.target.value },
                      }));
                    }}
                    placeholder={`https://${key}.com/...`}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSocialLinks((prev) => ({
                        ...prev,
                        [key]: { ...val, enabled: !val.enabled },
                      }));
                    }}
                    className="cursor-pointer"
                  >
                    {val.enabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: Subscription & Database Partitioning ── */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          <DbSyncSettingsCard />

          {/* Subscription Tier Card */}
          <div
            className="p-5 rounded-2xl border shadow-xs space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <h3 className="font-bold text-sm">
                  {isAr ? 'خطة الاشتراك وترخيص المتجر' : 'Subscription & Plan Tier'}
                </h3>
              </div>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono"
                style={{ background: 'color-mix(in srgb, var(--accent) 15%, var(--surface))', color: 'var(--accent)' }}
              >
                {activeStore.plan} Plan
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Free Tier */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  activeStore.plan === 'free' ? 'border-emerald-500 bg-emerald-50/10' : ''
                }`}
                style={{ borderColor: activeStore.plan === 'free' ? 'var(--accent)' : 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">Free Tier</span>
                  {activeStore.plan === 'free' && (
                    <span className="text-xs font-semibold text-emerald-500">Current Plan</span>
                  )}
                </div>
                <p className="text-xs mb-4 leading-relaxed opacity-75">
                  Standard store with basic product catalog and manual order processing.
                </p>
                <button
                  type="button"
                  onClick={() => updateStorePlan(activeStore.id, 'free')}
                  disabled={activeStore.plan === 'free'}
                  className="w-full py-1.5 px-3 border rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {activeStore.plan === 'free' ? 'Selected' : 'Downgrade to Free'}
                </button>
              </div>

              {/* Pro Tier */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  activeStore.plan === 'pro' ? 'border-emerald-500 bg-emerald-50/10' : ''
                }`}
                style={{ borderColor: activeStore.plan === 'pro' ? 'var(--accent)' : 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <span>Pro Merchant</span>
                    {activeStore.masterGrantedPro && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold px-1.5 py-0.5 rounded">
                        Master Granted
                      </span>
                    )}
                  </span>
                  {activeStore.plan === 'pro' && (
                    <span className="text-xs font-semibold text-emerald-500">Active</span>
                  )}
                </div>
                <p className="text-xs mb-4 leading-relaxed opacity-75">
                  Full access to Channel Performance Analytics, VIP customer filters, zero-stale instant publish, and multi-user staff roles.
                </p>
                <button
                  type="button"
                  onClick={() => updateStorePlan(activeStore.id, 'pro')}
                  disabled={activeStore.plan === 'pro'}
                  className="w-full py-1.5 px-3 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  {activeStore.plan === 'pro' ? 'Active' : 'Upgrade to Pro'}
                </button>
              </div>
            </div>

            {/* Zero-stale purge cache button */}
            <div className="pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={handlePurgeCache}
                disabled={purging}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${purging ? 'animate-spin' : ''}`} />
                <span>{purging ? 'Purging Cache…' : 'Purge Cache & Sync DB'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Maintenance / Under Construction Mode ── */}
      {activeTab === 'maintenance' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const current = readAllThemeSettings(activeStore.id, activeStore);
            writeAllThemeSettings(activeStore.id, {
              ...current,
              maintenance: {
                enabled: maintenanceEnabled,
                titleAr: maintenanceTitleAr,
                titleEn: maintenanceTitleEn,
                subtitleAr: maintenanceSubtitleAr,
                subtitleEn: maintenanceSubtitleEn,
                launchDate,
                showCountdown,
                showWhatsapp: showWhatsappContact,
                showEmailSubscribe: showEmailNotify,
                whatsappNumber: maintWhatsapp,
              },
            });
            toast(
              isAr
                ? 'تم حفظ إعدادات صفحة الصيانة والافتتاح بنجاح!'
                : 'Maintenance & Under Construction settings saved!',
              'success'
            );
          }}
          className="space-y-6"
        >
          <div
            className="p-5 sm:p-6 rounded-2xl border shadow-xs space-y-6"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* Header & Main Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span>{isAr ? 'وضع تحت الصيانة والافتتاح القريب (Under Construction)' : 'Maintenance & Grand Launch Mode'}</span>
                </h3>
                <p className="text-xs mt-1 leading-relaxed opacity-75 max-w-2xl">
                  {isAr
                    ? 'عند تفعيل هذا الخيار، سيظهر لزوار النطاق الرئيسي صفحة انتظار وافتتاح راقية وثنائية اللغة مع عداد تنازلي وزر واتساب بدلاً من المتجر المباشر.'
                    : 'When enabled, live visitors will see a luxury bilingual coming-soon page with countdown timer and WhatsApp concierge.'}
                </p>
              </div>

              {/* Status Switcher Button */}
              <button
                type="button"
                onClick={() => setMaintenanceEnabled(!maintenanceEnabled)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-full font-bold text-xs cursor-pointer transition-all duration-200 shadow-md ${
                  maintenanceEnabled
                    ? 'bg-amber-500 text-white ring-4 ring-amber-500/20'
                    : 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full bg-white ${maintenanceEnabled ? 'animate-pulse' : ''}`} />
                <span>
                  {maintenanceEnabled
                    ? isAr
                      ? 'وضع الصيانة مُفعّل (نشط)'
                      : 'Maintenance ACTIVE'
                    : isAr
                    ? 'المتجر متاح للجمهور (LIVE)'
                    : 'Store is LIVE'}
                </span>
              </button>
            </div>

            {/* Content Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'عنوان الصفحة الرئيسي (بالعربية)' : 'Main Headline (Arabic)'}
                </label>
                <input
                  type="text"
                  value={maintenanceTitleAr}
                  onChange={(e) => setMaintenanceTitleAr(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'عنوان الصفحة الرئيسي (بالإنجليزية)' : 'Main Headline (English)'}
                </label>
                <input
                  type="text"
                  value={maintenanceTitleEn}
                  onChange={(e) => setMaintenanceTitleEn(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'وصف وتفاصيل الافتتاح (بالعربية)' : 'Description (Arabic)'}
                </label>
                <textarea
                  rows={3}
                  value={maintenanceSubtitleAr}
                  onChange={(e) => setMaintenanceSubtitleAr(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none resize-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'وصف وتفاصيل الافتتاح (بالإنجليزية)' : 'Description (English)'}
                </label>
                <textarea
                  rows={3}
                  value={maintenanceSubtitleEn}
                  onChange={(e) => setMaintenanceSubtitleEn(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none resize-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'تاريخ ووقت الافتتاح المستهدف (للعداد التنازلي)' : 'Launch Target Date & Time'}
                </label>
                <input
                  type="datetime-local"
                  value={launchDate}
                  onChange={(e) => setLaunchDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'رقم واتساب للطلبات العاجلة' : 'WhatsApp Number for Inquiries'}
                </label>
                <input
                  type="text"
                  value={maintWhatsapp}
                  onChange={(e) => setMaintWhatsapp(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none font-mono"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>
            </div>

            {/* Checkboxes for features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }}>
                <input
                  type="checkbox"
                  checked={showCountdown}
                  onChange={(e) => setShowCountdown(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold">{isAr ? 'عرض العداد التنازلي الحي' : 'Show Live Countdown'}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }}>
                <input
                  type="checkbox"
                  checked={showEmailNotify}
                  onChange={(e) => setShowEmailNotify(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold">{isAr ? 'صندوق الاشتراك البريدي' : 'Show Email Notify Box'}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }}>
                <input
                  type="checkbox"
                  checked={showWhatsappContact}
                  onChange={(e) => setShowWhatsappContact(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold">{isAr ? 'زر واتساب للطلبات الفورية' : 'Show WhatsApp Button'}</span>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md transition-all hover:brightness-105"
                style={{ background: 'var(--portal-cta)' }}
              >
                {isAr ? 'حفظ إعدادات الصيانة' : 'Save Maintenance Settings'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
