import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  Settings,
  ShieldCheck,
  Database,
  Globe,
  Coins,
  Palette,
  MessageSquare,
  Share2,
  Image as ImageIcon,
  Check,
  Sun,
  Moon,
  Clock,
  RefreshCw,
  Server,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
} from 'lucide-react';
import { BrandingPanel } from '../common/BrandingPanel';
import { DbSyncSettingsCard } from '../common/DbSyncSettingsCard';
import { bumpCacheTag, platformTag } from '../../api/cacheTags';
import { useToast } from '../common/ToastProvider';
import { CURRENCIES, type DisplayCurrency } from '../../i18n/prefs';
import { MasterControlCenter } from './MasterControlCenter';

type MasterSettingsTab = 'controls' | 'platform' | 'localization' | 'appearance' | 'social' | 'database';

export const MasterSettings: React.FC = () => {
  const { stores, softRefreshTenantData } = useTenant();
  const { t, locale, setLocale, currency, setCurrency, theme, toggleTheme, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<MasterSettingsTab>('platform');

  // Platform details
  const [platformName, setPlatformName] = useState('Unityteck');
  const [platformTagline, setPlatformTagline] = useState(
    isAr
      ? 'منصة التجارة الإلكترونية السعودية متعددة المتاجر'
      : 'Saudi Multi-Store SaaS E-Commerce Platform'
  );
  const [platformLogo, setPlatformLogo] = useState('/favicon.svg');
  const [supportEmail, setSupportEmail] = useState('admin@unityteck.sa');
  const [timezone, setTimezone] = useState('Asia/Riyadh');

  // Social & WhatsApp
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('+966500000000');
  const [socialLinks, setSocialLinks] = useState({
    twitter: { enabled: true, url: 'https://x.com/unityteck' },
    linkedin: { enabled: true, url: 'https://linkedin.com/company/unityteck' },
    instagram: { enabled: true, url: 'https://instagram.com/unityteck' },
    youtube: { enabled: false, url: 'https://youtube.com/@unityteck' },
  });

  const [purging, setPurging] = useState(false);

  const handleSavePlatform = (e: React.FormEvent) => {
    e.preventDefault();
    toast(
      isAr
        ? 'تم حفظ إعدادات المنصة بنجاح'
        : 'Platform settings saved successfully',
      'success'
    );
  };

  const handlePurgeAll = async () => {
    if (purging) return;
    setPurging(true);
    try {
      bumpCacheTag(platformTag());
      await softRefreshTenantData();
      toast(
        isAr
          ? 'تم تفريغ كاش المنصة بالكامل ومزامنة قاعدة البيانات'
          : 'Global cache purged & live DB synchronized across all stores',
        'success'
      );
    } finally {
      setPurging(false);
    }
  };

  const tabs = [
    {
      id: 'controls' as const,
      label: isAr ? 'التحكم بالصفحات والعناصر' : 'Central Controls & Toggles',
      icon: SlidersHorizontal,
    },
    {
      id: 'platform' as const,
      label: isAr ? 'هوية المنصة' : 'Platform Identity',
      icon: Settings,
    },
    {
      id: 'localization' as const,
      label: isAr ? 'اللغة والعملة' : 'Language & Currency',
      icon: Coins,
    },
    {
      id: 'appearance' as const,
      label: isAr ? 'الألوان والخطوط' : 'Theme & Fonts',
      icon: Palette,
    },
    {
      id: 'social' as const,
      label: isAr ? 'الدعم وواتساب' : 'Support & WhatsApp',
      icon: MessageSquare,
    },
    {
      id: 'database' as const,
      label: isAr ? 'قاعدة البيانات والمتاجر' : 'Database & Partitions',
      icon: Database,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto min-w-0" style={{ color: 'var(--text)' }}>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {isAr ? 'إعدادات المنصة الرئيسية' : 'Master Admin Settings'}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `إدارة المنصة الشاملة، ألوان النظام، خطوط جوجل، العملات وجميع المتاجر (${stores.length})`
              : `Global platform configuration, top 15 palettes, top 15 fonts, multi-currency & ${stores.length} active stores`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Language Switcher Button */}
          <button
            type="button"
            onClick={() => {
              const next = locale === 'ar' ? 'en' : 'ar';
              setLocale(next);
              toast(next === 'ar' ? 'تم تحويل النظام إلى العربية' : 'Language set to English', 'success');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shadow-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            title={isAr ? 'Switch Language to English' : 'تحويل اللغة إلى العربية'}
          >
            <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="font-bold">{isAr ? 'English (EN)' : 'العربية (AR)'}</span>
          </button>

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

      {/* ── Tabs Navigation ── */}
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

      {/* ── TAB 0: Central Controls & Toggles ── */}
      {activeTab === 'controls' && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <MasterControlCenter />
        </div>
      )}

      {/* ── TAB 1: Platform Identity ── */}
      {activeTab === 'platform' && (
        <form onSubmit={handleSavePlatform} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border shadow-xs space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'شعار المنصة' : 'Platform Brand Mark'}</span>
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border p-2 flex items-center justify-center shrink-0" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                  <img src={platformLogo} alt="Logo" className="w-10 h-10 object-contain" />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={platformLogo}
                    onChange={(e) => setPlatformLogo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                  <p className="text-[10px] mt-1 opacity-70">Applies across Master & Store sidebars</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 p-5 rounded-2xl border shadow-xs space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'بيانات المنصة الرئيسية' : 'Platform Details'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    Master Admin Email
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    Platform Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    value={platformTagline}
                    onChange={(e) => setPlatformTagline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-90"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  Save Platform Settings
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 2: Multi-Currency & Language ── */}
      {activeTab === 'localization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl border shadow-xs space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h3 className="font-extrabold text-sm">Platform Currencies</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--hover-bg)', color: 'var(--accent)' }}>
                Active: {currency}
              </span>
            </div>

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
                      toast('Currency updated to ' + curKey, 'success');
                    }}
                    className={`p-3 rounded-xl border text-start cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      active ? 'ring-2 shadow-xs' : 'hover:border-slate-400'
                    }`}
                    style={{
                      background: active ? 'var(--active-bg)' : 'var(--bg)',
                      borderColor: active ? 'var(--accent)' : 'var(--border)',
                      color: active ? 'var(--active-fg)' : 'var(--text)',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-extrabold text-sm">
                        <span>{symbol}</span>
                        <span className="text-[10px] font-mono opacity-80">({curKey})</span>
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">{label}</div>
                    </div>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl border shadow-xs space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h3 className="font-extrabold text-sm">Language & Timezone</h3>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold" style={{ color: 'var(--muted)' }}>
                Platform Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'en' as const, label: 'English', desc: '100% English' },
                  { id: 'ar' as const, label: 'العربية', desc: 'عربي بالكامل' },
                ].map((item) => {
                  const active = locale === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setLocale(item.id);
                        toast('Language set to ' + item.label, 'success');
                      }}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
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
            </div>

            <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <label className="block text-xs font-bold" style={{ color: 'var(--muted)' }}>
                Platform Timezone
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  <option value="Asia/Riyadh">Asia/Riyadh (GMT+3) · Saudi Arabia</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4) · UAE</option>
                  <option value="Asia/Karachi">Asia/Karachi (GMT+5) · Pakistan</option>
                  <option value="Europe/London">Europe/London (GMT+0) · UK</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Branding Panel (Top 15 Colors / Fonts / Weights) ── */}
      {activeTab === 'appearance' && (
        <BrandingPanel title="Global Platform Branding · Top 15 Colors · Top 15 Fonts · Weights" />
      )}

      {/* ── TAB 4: WhatsApp & Social ── */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl border shadow-xs space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <h3 className="font-extrabold text-sm">Platform WhatsApp Support</h3>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                className="cursor-pointer"
              >
                {whatsappEnabled ? (
                  <ToggleRight className="w-7 h-7 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400" />
                )}
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold" style={{ color: 'var(--muted)' }}>
                Support WhatsApp Number
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                disabled={!whatsappEnabled}
                className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none disabled:opacity-50"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl border shadow-xs space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <Share2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h3 className="font-extrabold text-sm">Platform Social Channels</h3>
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

      {/* ── TAB 5: Database & Global Flush ── */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <DbSyncSettingsCard />

          <div className="p-5 rounded-2xl border shadow-xs space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-sm">Multi-Tenant Partition Summary</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono" style={{ background: 'var(--hover-bg)', color: 'var(--accent)' }}>
                {stores.length} Stores Provisioned
              </span>
            </div>
            <p className="text-xs opacity-75 leading-relaxed">
              Every store possesses a cryptographically isolated tenant partition. Instant zero-stale cache tags ensure immediate product catalog updates across storefronts without server restarts.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handlePurgeAll}
                disabled={purging}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-90"
                style={{ background: 'var(--portal-cta)' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${purging ? 'animate-spin' : ''}`} />
                <span>{purging ? 'Purging All Tenants…' : 'Purge Global Cache & Sync All Tenants'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
