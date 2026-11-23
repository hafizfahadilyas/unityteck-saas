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
  ToggleLeft,
  ToggleRight,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  HardDrive,
  Copy,
  Smartphone,
  Search,
  BarChart3,
  Code,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { PortalHubCard } from '../common/PortalHubCard';
import { GoogleConnectModal } from './GoogleConnectModal';
import { realTrackingId, seoSetupStep, storeGoogleEmail, storePublicHost } from './seo/storeSeoSetup';
import { BrandingPanel } from '../common/BrandingPanel';
import { DbSyncSettingsCard } from '../common/DbSyncSettingsCard';
import { bumpStore, bumpCacheTag, platformTag } from '../../api/cacheTags';
import { useToast } from '../common/ToastProvider';
import { CURRENCIES, type DisplayCurrency } from '../../i18n/prefs';
import { MediaUploadField } from '../common/MediaUploadField';
import { ThresholdSettings } from '../../notification-system/components/ThresholdSettings';
import { NotificationSettings } from './settings/NotificationSettings';
import { ConnectedWorkspaceBanner } from '../common/ConnectedWorkspaceBanner';

import { readAllThemeSettings, writeAllThemeSettings } from '../../themes/settings/themeSettingsStore';
import { readStoreIdentity, splitStoreName, writeStoreIdentity, type StoreIdentitySettings } from '../../themes/settings/storeIdentity';
import { StoreChromeFields } from './settings/StoreChromeFields';
import {
  bindStoreChrome,
  cacheStoreChromeNow,
  currentChromeRevision,
  isDefaultShellWallpaper,
  isEphemeralImageUrl,
  loadStoreChrome,
  markChromeImageCleared,
  readChromeCache,
  rememberPendingChrome,
  saveStoreChrome,
  type StoreChromeBrand,
} from '../../i18n/storeChrome';
import { deleteChromeImage } from '../../i18n/storeChromeImageStore';

type SettingsTab =
  | 'general'
  | 'localization'
  | 'appearance'
  | 'maintenance'
  | 'social'
  | 'subscription'
  | 'thresholds'
  | 'notifications'
  | 'search_console';

export const StoreSettings: React.FC = () => {
  const { activeStore, updateStorePlan, softRefreshTenantData, currentSEOConfig } = useTenant();
  const { t, locale, setLocale, currency, setCurrency, money, allowedLocales, setBrand } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const [chrome, setChrome] = useState<StoreChromeBrand>(() => readChromeCache(activeStore.id));
  const [chromeDirty, setChromeDirty] = useState(false);
  const [chromeSaving, setChromeSaving] = useState(false);
  const [showGoogleConnect, setShowGoogleConnect] = useState(false);
  const [settingsFocus, setSettingsFocus] = useState<'search_console' | 'tag_manager'>('search_console');

  const hydrateStoreTypography = (next: StoreChromeBrand) => {
    if (!next.fontAr && !next.fontWeight && !next.customFontFamilyAr && !next.customFontUrlAr) {
      return;
    }
    setBrand({
      ...(next.fontAr
        ? { fontAr: next.fontAr, font: next.fontAr }
        : {}),
      ...(next.fontWeight ? { fontWeight: next.fontWeight } : {}),
      ...(next.customFontFamilyAr !== undefined
        ? { customFontFamilyAr: next.customFontFamilyAr }
        : {}),
      ...(next.customFontUrlAr !== undefined ? { customFontUrlAr: next.customFontUrlAr } : {}),
    });
  };

  useEffect(() => {
    let stop = false;
    const cached = readChromeCache(activeStore.id);
    setChrome(cached);
    setChromeDirty(false);
    bindStoreChrome(activeStore.id, cached);
    hydrateStoreTypography(cached);
    const seen = currentChromeRevision();
    void loadStoreChrome(activeStore.id).then((next) => {
      // Skip if merchant already painted a newer chrome (upload / slider) during fetch
      if (stop || currentChromeRevision() !== seen) return;
      // Only apply when load enriched wallpaper/CDN URL or timestamp — avoid visual snap-back
      const sameDesign =
        next.palette === cached.palette &&
        next.fill === cached.fill &&
        next.customColor === cached.customColor &&
        next.gradientFrom === cached.gradientFrom &&
        next.gradientTo === cached.gradientTo &&
        next.sidebarDesign === cached.sidebarDesign &&
        next.shellWallpaperPreset === cached.shellWallpaperPreset &&
        next.shellWallpaperBlur === cached.shellWallpaperBlur &&
        next.shellWallpaperOpacity === cached.shellWallpaperOpacity &&
        next.shellWallpaper === cached.shellWallpaper &&
        next.bgImage === cached.bgImage &&
        next.dashboardLookId === cached.dashboardLookId &&
        next.fontAr === cached.fontAr &&
        next.fontWeight === cached.fontWeight;
      if (sameDesign) return;
      setChrome(next);
      bindStoreChrome(activeStore.id, next);
      hydrateStoreTypography(next);
    });
    return () => {
      stop = true;
    };
  }, [activeStore.id]);

  /** Preview only — no auto API save (avoids CORS / wipe races). User clicks Save. */
  const updateChrome = (next: StoreChromeBrand) => {
    const normalized: StoreChromeBrand = {
      ...next,
      shellWallpaperBlur:
        typeof next.shellWallpaperBlur === 'number' ? next.shellWallpaperBlur : 10,
      shellWallpaperOpacity:
        typeof next.shellWallpaperOpacity === 'number' ? next.shellWallpaperOpacity : 0.92,
      updatedAt: Date.now(),
    };
    // Reset to platform default image (or empty) clears merchant upload — not color presets
    const clearedShell =
      (isDefaultShellWallpaper(normalized.shellWallpaper) || !normalized.shellWallpaper) &&
      Boolean(chrome.shellWallpaper) &&
      !isDefaultShellWallpaper(chrome.shellWallpaper);
    const clearedBg = !normalized.bgImage && Boolean(chrome.bgImage);
    if (clearedShell) {
      markChromeImageCleared(activeStore.id, 'shellWallpaper', true);
      void deleteChromeImage(activeStore.id, 'shellWallpaper');
      void import('../../i18n/shellWallpaperLuma').then(({ clearShellWallpaperLumaCache }) => {
        clearShellWallpaperLumaCache();
      });
    } else if (normalized.shellWallpaper && !isDefaultShellWallpaper(normalized.shellWallpaper)) {
      markChromeImageCleared(activeStore.id, 'shellWallpaper', false);
    }
    if (clearedBg) {
      markChromeImageCleared(activeStore.id, 'bgImage', true);
      void deleteChromeImage(activeStore.id, 'bgImage');
    } else if (normalized.bgImage) {
      markChromeImageCleared(activeStore.id, 'bgImage', false);
    }
    setChrome(normalized);
    setChromeDirty(true);
    if (normalized.fill === 'custom' && !/^#[0-9a-fA-F]{6}$/.test(normalized.customColor)) return;
    bindStoreChrome(activeStore.id, normalized);
    rememberPendingChrome(activeStore.id, normalized);
    cacheStoreChromeNow(activeStore.id, normalized);
    // Glass wallpaper / sidebar bg remove must hit live MySQL immediately (local OK, live was restoring)
    if (clearedShell || clearedBg) {
      void saveStoreChrome(activeStore.id, normalized).then(() => {
        setChromeDirty(false);
      });
    }
  };

  const saveChromeAppearance = async () => {
    if (chromeSaving) return;
    setChromeSaving(true);
    try {
      await saveStoreChrome(activeStore.id, chrome);
      setChromeDirty(false);
      if (isEphemeralImageUrl(chrome.shellWallpaper) || isEphemeralImageUrl(chrome.bgImage)) {
        toast(
          isAr
            ? 'المعاينة محفوظة محلياً — انتظر اكتمال الرفع ثم احفظ مرة أخرى.'
            : 'Preview saved on this device — wait for upload to finish, then Save again.',
          'info',
        );
      } else {
        toast(isAr ? 'تم حفظ مظهر هذا المتجر' : 'This store appearance was saved', 'success');
      }
    } catch {
      toast(
        isAr ? 'تعذر حفظ المظهر. الخلفية ما زالت على هذا الجهاز.' : 'Could not save appearance. Wallpaper stays on this device.',
        'error',
      );
    } finally {
      setChromeSaving(false);
    }
  };

  // null = settings hub (big buttons); set = open that section
  const [activeTab, setActiveTab] = useState<SettingsTab | null>(null);

  /** Sidebar deep-link: Appearance / Search Console / Tag Manager under Settings */
  useEffect(() => {
    const applyView = (view: string | null | undefined) => {
      if (view === 'appearance') {
        setActiveTab('appearance');
        return;
      }
      if (view === 'search_console' || view === 'tag_manager') {
        setActiveTab('search_console');
        setSettingsFocus(view);
      }
    };
    try {
      applyView(sessionStorage.getItem('unityteck-settings-view'));
      sessionStorage.removeItem('unityteck-settings-view');
    } catch {
      /* storage may be unavailable */
    }
    const onView = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      applyView(detail);
    };
    window.addEventListener('unityteck-settings-view', onView);
    return () => window.removeEventListener('unityteck-settings-view', onView);
  }, []);

  // Load existing theme settings
  const initialThemeSettings = useMemo(() => {
    return readAllThemeSettings(activeStore.id, activeStore);
  }, [activeStore.id, activeStore]);

  // Maintenance Mode — general chrome defaults (merchant can customize; no niche hardcoding)
  const defaultMaintenanceTitleAr = 'نعمل على تحديث وتطوير متجرك';
  const defaultMaintenanceTitleEn = 'We are upgrading and enhancing your store';
  const defaultMaintenanceSubtitleAr =
    'نعمل على تحسين تجربة التسوق وتطوير المتجر لخدمتكم بأعلى معايير الجودة. سنعود إليكم قريباً!';
  const defaultMaintenanceSubtitleEn =
    'We are upgrading our catalog and shopping experience to bring you the best products. We will be back shortly!';

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(
    Boolean(initialThemeSettings.maintenance?.enabled)
  );
  const [maintenanceTitleAr, setMaintenanceTitleAr] = useState(
    initialThemeSettings.maintenance?.titleAr || defaultMaintenanceTitleAr
  );
  const [maintenanceTitleEn, setMaintenanceTitleEn] = useState(
    initialThemeSettings.maintenance?.titleEn || defaultMaintenanceTitleEn
  );
  const [maintenanceSubtitleAr, setMaintenanceSubtitleAr] = useState(
    initialThemeSettings.maintenance?.subtitleAr || defaultMaintenanceSubtitleAr
  );
  const [maintenanceSubtitleEn, setMaintenanceSubtitleEn] = useState(
    initialThemeSettings.maintenance?.subtitleEn || defaultMaintenanceSubtitleEn
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
    initialThemeSettings.maintenance?.whatsappNumber || ''
  );

  // General Settings State
  const storeIdentity = useMemo(() => {
    return readStoreIdentity(activeStore.id, activeStore);
  }, [activeStore.id, activeStore]);

  const splitName = splitStoreName(storeIdentity);
  const [storeNameEn, setStoreNameEn] = useState(splitName.storeNameEn);
  const [storeNameAr, setStoreNameAr] = useState(splitName.storeNameAr);
  const [taglineEn, setTaglineEn] = useState(storeIdentity.taglineEn || '');
  const [taglineAr, setTaglineAr] = useState(storeIdentity.taglineAr || '');
  const [storeEmail, setStoreEmail] = useState(storeIdentity.email || '');
  const [storePhone, setStorePhone] = useState(storeIdentity.phone || '');
  const [logoUrl, setLogoUrl] = useState(
    storeIdentity.logoUrl || activeStore.logo || ''
  );
  const [faviconUrl, setFaviconUrl] = useState('/favicon.svg');
  const [customDomain, setCustomDomain] = useState(`${activeStore.slug}.saudi-stores.com`);
  const [workspacePath, setWorkspacePath] = useState(
    String((activeStore as { workspacePath?: string }).workspacePath || '').trim(),
  );

  // Regional Settings State
  const [timezone, setTimezone] = useState('Asia/Riyadh');

  // Social & WhatsApp Settings State
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState(storeIdentity.whatsapp || '');
  const [whatsappGreeting, setWhatsappGreeting] = useState(
    isAr
      ? 'مرحباً، أود الاستفسار عن منتجات المتجر!'
      : 'Hello, I would like to inquire about your store products!'
  );
  const [socialLinks, setSocialLinks] = useState({
    instagram: { enabled: true, url: storeIdentity.instagram || ('https://instagram.com/' + activeStore.slug) },
    twitter: { enabled: true, url: 'https://x.com/' + activeStore.slug },
    tiktok: { enabled: true, url: 'https://tiktok.com/@' + activeStore.slug },
    facebook: { enabled: false, url: 'https://facebook.com/' + activeStore.slug },
    youtube: { enabled: false, url: 'https://youtube.com/@' + activeStore.slug },
  });

  // Purge cache state
  const [purging, setPurging] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedIdentity: StoreIdentitySettings = {
      ...storeIdentity,
      storeNameEn,
      storeNameAr,
      storeName: storeNameEn.trim() || storeIdentity.storeName,
      taglineEn,
      taglineAr,
      logoUrl: logoUrl,
      email: storeEmail,
      phone: storePhone,
      whatsapp: whatsappNumber,
      instagram: socialLinks.instagram?.url || storeIdentity.instagram,
      updatedAt: new Date().toISOString(),
    };
    const logoForSave = (() => {
      const raw = (logoUrl || '').trim();
      if (!raw || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
      const stamp = Date.now();
      if (/[?&]v=/.test(raw)) return raw.replace(/([?&]v=)[^&]*/i, `$1${stamp}`);
      return `${raw}${raw.includes('?') ? '&' : '?'}v=${stamp}`;
    })();
    const identityWithBust: StoreIdentitySettings = {
      ...updatedIdentity,
      logoUrl: logoForSave || updatedIdentity.logoUrl,
    };
    writeStoreIdentity(activeStore.id, identityWithBust);
    const currThemeSettings = readAllThemeSettings(activeStore.id, activeStore);
    writeAllThemeSettings(activeStore.id, {
      ...currThemeSettings,
      identity: identityWithBust,
    });
    if (logoForSave && logoForSave !== logoUrl) setLogoUrl(logoForSave);
    bumpStore(activeStore.id, 'settings');
    bumpStore(activeStore.id, 'theme');
    window.dispatchEvent(
      new CustomEvent('unityteck-store-updated', {
        detail: {
          storeId: activeStore.id,
          name: storeNameEn || storeNameAr,
          logo: logoForSave || logoUrl,
        },
      }),
    );
    toast(
      isAr
        ? 'تم حفظ الإعدادات وتحديث المتجر فوراً!'
        : 'Store settings saved & synchronized instantly!',
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

  const tabs: { id: SettingsTab; label: string; desc: string; icon: React.ElementType }[] = [
    {
      id: 'general',
      label: isAr ? 'الهوية والمتجر' : 'General & Identity',
      desc: isAr ? 'الاسم والشعار والأيقونة' : 'Name, logo & favicon',
      icon: Settings,
    },
    {
      id: 'search_console',
      label: isAr ? 'بحث جوجل والتحليلات' : 'Search Console',
      desc: isAr ? 'الفهرسة والتحليلات والوسوم' : 'Indexing, analytics & tags',
      icon: Search,
    },
    {
      id: 'localization',
      label: isAr ? 'اللغة والعملة والتوقيت' : 'Language & Currency',
      desc: isAr ? 'العربية والإنجليزية والعملات' : 'AR / EN locales & currencies',
      icon: Coins,
    },
    {
      id: 'appearance',
      label: isAr ? 'المظهر والألوان والخطوط' : 'Theme, Colors & Fonts',
      desc: isAr ? 'ألوان وهوية لوحة التحكم' : 'Admin chrome colors & fonts',
      icon: Palette,
    },
    {
      id: 'maintenance',
      label: isAr ? 'صفحة تحت الصيانة' : 'Maintenance & Launch',
      desc: isAr ? 'وضع الصيانة وموعد الإطلاق' : 'Maintenance mode & launch date',
      icon: Clock,
    },
    {
      id: 'social',
      label: isAr ? 'واتساب والتواصل' : 'WhatsApp & Social',
      desc: isAr ? 'زر واتساب وروابط التواصل' : 'Chat widget & social links',
      icon: MessageSquare,
    },
    {
      id: 'subscription',
      label: isAr ? 'الخطة والبيانات' : 'Plan & Isolation',
      desc: isAr ? 'الخطة وعزل بيانات المتجر' : 'Plan tier & store data isolation',
      icon: ShieldCheck,
    },
    {
      id: 'notifications',
      label: isAr ? 'إشعارات الواتساب والرسائل النصية' : 'WhatsApp & SMS (+966)',
      desc: isAr ? 'قنوات الرسائل السعودية' : 'Saudi messaging channels',
      icon: Smartphone,
    },
    {
      id: 'thresholds',
      label: isAr ? 'عتبات التنبيهات والربط' : 'Alert Thresholds & Integrations',
      desc: isAr ? 'حدود التنبيه والتكاملات' : 'Alert limits & integrations',
      icon: SlidersHorizontal,
    },
  ];

  const activeTabMeta = activeTab ? tabs.find((t) => t.id === activeTab) : null;

  const ga4Id = realTrackingId(currentSEOConfig?.ga4MeasurementId);
  const gtmId = realTrackingId(currentSEOConfig?.gtmContainerId);
  const googleConnected = Boolean(currentSEOConfig?.googleConnected);
  const setupStep = seoSetupStep(activeStore);
  const ownerEmail = storeGoogleEmail(activeStore);
  const publicHost = storePublicHost(activeStore);

  return (
    <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto min-w-0 w-full" style={{ color: 'var(--text)' }}>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {isAr ? 'إعدادات المتجر' : 'Store Settings'}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'إدارة الهوية، الألوان، الخطوط، العملات وروابط التواصل'
              : 'Store identity, top 15 colors, top 15 fonts, multi-currency & social links'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Language Switcher Button */}
          <button
            type="button"
            onClick={() => {
              const next = locale === 'ar' ? 'en' : 'ar';
              setLocale(next);
              // Toast matches the NEW locale only (no language mix)
              toast(
                next === 'ar' ? 'تم تحويل النظام إلى العربية' : 'Language set to English',
                'success',
              );
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shadow-xs transition-colors hover:opacity-90"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            title={isAr ? 'التبديل إلى الإنجليزية' : 'Switch language to Arabic'}
            aria-label={isAr ? 'التبديل إلى الإنجليزية' : 'Switch language to Arabic'}
          >
            <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="font-bold">{isAr ? 'الإنجليزية' : 'العربية'}</span>
          </button>

        </div>
      </div>

      {/* ── Connected Local Workspace Banner ── */}
      <ConnectedWorkspaceBanner page="settings" />

      {/* ── Settings hub: same Marketing-style big cards ── */}
      {activeTab === null ? (
        <div className="u-equal-sections grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {tabs.map((tab) => (
            <PortalHubCard
              key={tab.id}
              icon={tab.icon}
              title={tab.label}
              description={tab.desc}
              onClick={() => setActiveTab(tab.id)}
              isAr={isAr}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer shadow-xs transition-colors hover:opacity-95"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} aria-hidden />
            {isAr ? 'كل الإعدادات' : 'All settings'}
          </button>
          {activeTabMeta ? (
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'var(--portal-cta)',
                  color: '#fff',
                }}
                aria-hidden
              >
                {React.createElement(activeTabMeta.icon, { className: 'w-4 h-4' })}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold truncate" style={{ color: 'var(--text)' }}>
                  {activeTabMeta.label}
                </p>
                <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                  {activeTabMeta.desc}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

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
                  onChange={(url) => {
                    const next = (url || '').trim();
                    setLogoUrl(next);
                    // Live sidebar/avatar paint — do not wait for Save
                    window.dispatchEvent(
                      new CustomEvent('unityteck-store-updated', {
                        detail: {
                          storeId: activeStore.id,
                          name: storeNameEn || storeNameAr,
                          logo: next,
                        },
                      }),
                    );
                  }}
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
                    {isAr ? 'اسم المتجر' : 'Store name'}
                  </label>
                  <input
                    type="text"
                    value={isAr ? storeNameAr : storeNameEn}
                    onChange={(e) => (isAr ? setStoreNameAr(e.target.value) : setStoreNameEn(e.target.value))}
                    dir={isAr ? 'rtl' : 'ltr'}
                    className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
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
                    {isAr ? 'الوصف' : 'Tagline'}
                  </label>
                  <input
                    type="text"
                    value={isAr ? taglineAr : taglineEn}
                    onChange={(e) => (isAr ? setTaglineAr(e.target.value) : setTaglineEn(e.target.value))}
                    dir={isAr ? 'rtl' : 'ltr'}
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

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'رقم الواتساب للأعمال والطلبات المخصصة' : 'WhatsApp Business Number'}
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+966 54 987 6543"
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
                    <span className="px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)', color: customDomain?.trim() ? 'var(--accent)' : 'var(--muted)' }}>
                      {customDomain?.trim() ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>
                        {customDomain?.trim()
                          ? isAr
                            ? 'شهادة الأمان نشطة'
                            : 'SSL Active'
                          : isAr
                            ? 'بانتظار النطاق'
                            : 'Waiting for Domain'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Optional local workspace path — only when this store has a real value */}
                <div className="sm:col-span-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                      <HardDrive className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span>{isAr ? 'مسار مجلد المشروع المحلي المرتبط' : 'Connected Local Workspace Path'}</span>
                    </label>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        workspacePath.trim()
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {workspacePath.trim()
                        ? isAr
                          ? 'متصل'
                          : 'Connected'
                        : isAr
                          ? 'غير متصل'
                          : 'Not Connected'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={workspacePath}
                        onChange={(e) => setWorkspacePath(e.target.value)}
                        placeholder={isAr ? 'اختياري — مسار محلي لهذا المتجر فقط' : 'Optional — local path for this store only'}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:outline-none"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!workspacePath.trim()}
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(workspacePath);
                          toast(isAr ? 'تم نسخ مسار المشروع بنجاح!' : 'Workspace path copied to clipboard!', 'success');
                        } catch {
                          toast(isAr ? 'تعذر النسخ' : 'Copy failed', 'error');
                        }
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isAr ? 'نسخ' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'يُعرض فقط إن وُجد مسار محفوظ لهذا المتجر. لا تُستخدم مسارات متاجر أخرى.'
                      : 'Shown only when this store has a saved path. Never borrow another store’s folder.'}
                  </p>
                </div>

                {/* Store Display Language Option */}
                <div className="sm:col-span-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                      <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{isAr ? 'لغة واجهة المتجر ولوحة التحكم' : 'Store & Dashboard Display Language'}</span>
                    </label>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {locale === 'ar' ? 'العربية نشطة' : 'English Active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setLocale('ar');
                        toast('تم تفعيل اللغة العربية للمتجر ولوحة التحكم', 'success');
                      }}
                      className={`p-3 rounded-xl border text-start cursor-pointer transition-all flex items-center justify-between ${
                        locale === 'ar' ? 'ring-2 font-bold shadow-xs' : 'hover:border-slate-400 opacity-80'
                      }`}
                      style={{
                        background: locale === 'ar' ? 'var(--active-bg)' : 'var(--bg)',
                        borderColor: locale === 'ar' ? 'var(--accent)' : 'var(--border)',
                        color: locale === 'ar' ? 'var(--active-fg)' : 'var(--text)',
                      }}
                    >
                      <div>
                        <div className="text-xs font-bold">العربية (Arabic)</div>
                        <div className="text-[10px] opacity-75 mt-0.5">واجهة كاملة من اليمين لليسار (RTL)</div>
                      </div>
                      {locale === 'ar' && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLocale('en');
                        toast('Store language set to English (LTR)', 'success');
                      }}
                      className={`p-3 rounded-xl border text-start cursor-pointer transition-all flex items-center justify-between ${
                        locale === 'en' ? 'ring-2 font-bold shadow-xs' : 'hover:border-slate-400 opacity-80'
                      }`}
                      style={{
                        background: locale === 'en' ? 'var(--active-bg)' : 'var(--bg)',
                        borderColor: locale === 'en' ? 'var(--accent)' : 'var(--border)',
                        color: locale === 'en' ? 'var(--active-fg)' : 'var(--text)',
                      }}
                    >
                      <div>
                        <div className="text-xs font-bold">English (الإنجليزية)</div>
                        <div className="text-[10px] opacity-75 mt-0.5">Full English Interface (LTR)</div>
                      </div>
                      {locale === 'en' && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
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
                  ? 'تبديل لغة لوحة التحكم فوري لكل المتاجر (عربي / إنجليزي بالكامل). لغات واجهة المتجر العامة تُدار من المنصة.'
                  : 'Admin chrome language switches instantly for every store (full Arabic / English). Public storefront languages are managed from the platform.'}
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
          <BrandingPanel
            storeScoped
            activePalette={chrome.fill === 'palette' ? chrome.palette : null}
            onPaletteSelect={(id) => updateChrome({ ...chrome, palette: id, fill: 'palette', bgImage: chrome.fill === 'image' ? '' : chrome.bgImage })}
            onStoreColorsChange={({ bg, text }) =>
              updateChrome({
                ...chrome,
                pageBgColor: bg || '',
                pageTextColor: text || '',
                shellTextMode: text ? 'custom' : 'auto',
              })
            }
            initialStoreTypography={{
              fontAr: chrome.fontAr,
              fontWeight: chrome.fontWeight,
              customFontFamilyAr: chrome.customFontFamilyAr,
              customFontUrlAr: chrome.customFontUrlAr,
            }}
            onStoreTypographyChange={(next) =>
              updateChrome({
                ...chrome,
                fontAr: next.fontAr ?? chrome.fontAr,
                fontWeight: next.fontWeight ?? chrome.fontWeight,
                customFontFamilyAr:
                  next.customFontFamilyAr !== undefined
                    ? next.customFontFamilyAr
                    : chrome.customFontFamilyAr,
                customFontUrlAr:
                  next.customFontUrlAr !== undefined
                    ? next.customFontUrlAr
                    : chrome.customFontUrlAr,
              })
            }
            title={isAr ? 'تخصيص الهوية والألوان والخطوط' : 'Store Branding, Colors & Typography'}
          />
          <StoreChromeFields chrome={chrome} onChange={updateChrome} />
          <div
            className="u-card p-4 sm:p-5 rounded-[1.25rem] flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
            style={{ color: 'var(--text)' }}
          >
            <p className="text-[11px] sm:text-xs" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'المعاينة فورية. اضغط حفظ لتثبيت خلفية اللوحة والشريط لهذا المتجر.'
                : 'Preview is live. Click Save to lock dashboard and sidebar backgrounds for this store.'}
              {chromeDirty ? (
                <span className="ms-1 font-bold" style={{ color: 'var(--accent)' }}>
                  {isAr ? '(غير محفوظ)' : '(Unsaved)'}
                </span>
              ) : null}
            </p>
            <button
              type="button"
              disabled={chromeSaving || !chromeDirty}
              onClick={() => void saveChromeAppearance()}
              className="unity-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              style={{ background: 'var(--portal-cta, var(--accent))' }}
              aria-busy={chromeSaving || undefined}
            >
              {chromeSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <Save className="w-4 h-4" aria-hidden />
              )}
              <span>
                {chromeSaving
                  ? isAr
                    ? 'جارٍ الحفظ…'
                    : 'Saving…'
                  : isAr
                    ? 'حفظ المظهر'
                    : 'Save appearance'}
              </span>
            </button>
          </div>
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
                {isAr
                  ? activeStore.plan === 'premium'
                    ? 'الباقة المميزة'
                    : activeStore.plan === 'pro'
                      ? 'الباقة الاحترافية'
                      : 'الباقة المجانية'
                  : activeStore.plan === 'premium'
                    ? 'Premium'
                    : activeStore.plan === 'pro'
                      ? 'Pro'
                      : 'Free'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div
                className={`p-4 rounded-xl border transition-all ${
                  activeStore.plan === 'free' ? 'border-emerald-500 bg-emerald-50/10' : ''
                }`}
                style={{ borderColor: activeStore.plan === 'free' ? 'var(--accent)' : 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{isAr ? 'مجانية' : 'Free'}</span>
                  {activeStore.plan === 'free' && (
                    <span className="text-xs font-semibold text-emerald-500">{isAr ? 'الحالية' : 'Current'}</span>
                  )}
                </div>
                <p className="text-xs mb-4 leading-relaxed opacity-75">
                  {isAr ? 'كتالوج أساسي وطلبات يدوية. النطاق المخصص غير مشمول.' : 'Basic catalog and manual orders. Custom domain is not included.'}
                </p>
                <button
                  type="button"
                  onClick={() => updateStorePlan(activeStore.id, 'free')}
                  disabled={activeStore.plan === 'free'}
                  className="w-full py-1.5 px-3 border rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {activeStore.plan === 'free' ? (isAr ? 'محددة' : 'Selected') : isAr ? 'الانتقال للمجانية' : 'Move to Free'}
                </button>
              </div>

              <div
                className={`p-4 rounded-xl border transition-all ${
                  activeStore.plan === 'pro' ? 'border-emerald-500 bg-emerald-50/10' : ''
                }`}
                style={{ borderColor: activeStore.plan === 'pro' ? 'var(--accent)' : 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <span>{isAr ? 'احترافية · ٣٠٠ ⃁' : 'Pro · 300 ⃁'}</span>
                    {activeStore.masterGrantedPro && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold px-1.5 py-0.5 rounded">
                        {isAr ? 'منحة الإدارة' : 'Master grant'}
                      </span>
                    )}
                  </span>
                  {activeStore.plan === 'pro' && (
                    <span className="text-xs font-semibold text-emerald-500">{isAr ? 'مفعلة' : 'Active'}</span>
                  )}
                </div>
                <p className="text-xs mb-4 leading-relaxed opacity-75">
                  {isAr
                    ? 'سيو، تحليلات، تقارير، قوالب، ونطاق مخصص على الاستضافة السحابية.'
                    : 'SEO, analytics, reports, themes, and a custom domain on Hostinger Cloud.'}
                </p>
                <button
                  type="button"
                  onClick={() => updateStorePlan(activeStore.id, 'pro')}
                  disabled={activeStore.plan === 'pro'}
                  className="w-full py-1.5 px-3 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  {activeStore.plan === 'pro' ? (isAr ? 'مفعلة' : 'Active') : isAr ? 'اختيار الاحترافية' : 'Choose Pro'}
                </button>
              </div>

              <div
                className={`p-4 rounded-xl border transition-all ${
                  activeStore.plan === 'premium' ? 'border-emerald-500 bg-emerald-50/10' : ''
                }`}
                style={{ borderColor: activeStore.plan === 'premium' ? 'var(--accent)' : 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{isAr ? 'مميزة · ٥٠٠ ⃁' : 'Premium · 500 ⃁'}</span>
                  {activeStore.plan === 'premium' && (
                    <span className="text-xs font-semibold text-emerald-500">{isAr ? 'مفعلة' : 'Active'}</span>
                  )}
                </div>
                <p className="text-xs mb-4 leading-relaxed opacity-75">
                  {isAr
                    ? 'كل الاحترافية، مع النسخ الاحتياطي والفوترة والذكاء وواجهة البرمجة وتحليلات متقدمة.'
                    : 'Everything in Pro, plus backups, tax invoicing, AI, API access, and advanced analytics.'}
                </p>
                <button
                  type="button"
                  onClick={() => updateStorePlan(activeStore.id, 'premium')}
                  disabled={activeStore.plan === 'premium'}
                  className="w-full py-1.5 px-3 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  {activeStore.plan === 'premium' ? (isAr ? 'مفعلة' : 'Active') : isAr ? 'اختيار المميزة' : 'Choose Premium'}
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
                  <span>{isAr ? 'وضع تحت الصيانة والافتتاح القريب' : 'Maintenance & Grand Launch Mode'}</span>
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
                    ? 'المتجر متاح للجمهور'
                    : 'Store is LIVE'}
                </span>
              </button>
            </div>

            {/* Content Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  dir={isAr ? 'rtl' : 'ltr'}
                  value={isAr ? maintenanceTitleAr : maintenanceTitleEn}
                  onChange={(e) =>
                    isAr ? setMaintenanceTitleAr(e.target.value) : setMaintenanceTitleEn(e.target.value)
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  dir={isAr ? 'rtl' : 'ltr'}
                  value={isAr ? maintenanceSubtitleAr : maintenanceSubtitleEn}
                  onChange={(e) =>
                    isAr ? setMaintenanceSubtitleAr(e.target.value) : setMaintenanceSubtitleEn(e.target.value)
                  }
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

      {/* ── TAB: Search Console & Google Analytics (moved from SEO sidebar) ── */}
      {activeTab === 'search_console' && (
        <div className="space-y-6">
          <div
            className="p-5 rounded-2xl border shadow-xs space-y-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>
                    {settingsFocus === 'tag_manager'
                      ? isAr
                        ? 'مدير العلامات والتحليلات'
                        : 'Tag Manager & Analytics'
                      : isAr
                        ? 'أدوات مشرفي المواقع والفهرسة'
                        : 'Search Console & Indexing'}
                  </span>
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'ربط بحث جوجل ومدير العلامات وتحليلات الزوار من الإعدادات — صفحة تحسين محركات البحث للتحسين فقط.'
                    : 'Connect Search Console, Tag Manager, and analytics here. The SEO page is for optimization tools only.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleConnect(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {googleConnected
                    ? isAr
                      ? 'إدارة الربط'
                      : 'Manage connection'
                    : isAr
                      ? 'ربط حساب جوجل'
                      : 'Connect Google account'}
                </span>
              </button>
            </div>

            <div
              className="p-3 rounded-xl border text-xs leading-relaxed"
              style={{
                background: 'color-mix(in srgb, var(--surface) 85%, var(--border))',
                borderColor: 'var(--border)',
              }}
            >
              {setupStep === 'need_email' &&
                (isAr
                  ? 'بريد دخول هذا المتجر غير محفوظ. بعد حفظه يربط المالك حسابه بنفسه.'
                  : 'This store has no login email yet. After it is saved, the owner connects their own account.')}
              {setupStep === 'need_domain' &&
                (isAr
                  ? `البريد ${ownerEmail} جاهز. النطاق العام غير مربوط، لذلك تبقى هذه الخطوة معلقة.`
                  : `Email ${ownerEmail} is ready. The public domain is not linked yet, so this step waits.`)}
              {setupStep === 'ready' &&
                (isAr
                  ? `النطاق ${publicHost} والبريد ${ownerEmail} جاهزان. المالك يسجّل الدخول ببريده مرة واحدة.`
                  : `Domain ${publicHost} and email ${ownerEmail} are ready. The owner signs in with that email once.`)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-5 rounded-2xl border shadow-xs space-y-3 ${
                settingsFocus === 'search_console' ? 'ring-2 ring-blue-500/40' : ''
              }`}
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800">
                    GSC
                  </div>
                  <span className="font-bold text-xs">{isAr ? 'بحث جوجل' : 'Search Console'}</span>
                </div>
                {googleConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {isAr ? 'متصل' : 'Connected'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {isAr ? 'غير متصل' : 'Not connected'}
                  </span>
                )}
              </div>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'الفهرسة ومرات الظهور والنقرات تظهر بعد الربط الحقيقي فقط.'
                  : 'Indexing, impressions, and clicks appear only after a real connection.'}
              </p>
              <div
                className="pt-2 border-t text-xs font-mono"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                {googleConnected
                  ? isAr
                    ? `${currentSEOConfig?.totalSearchClicks || 0} نقرة`
                    : `${currentSEOConfig?.totalSearchClicks || 0} clicks`
                  : '—'}
              </div>
            </div>

            <div
              className={`p-5 rounded-2xl border shadow-xs space-y-3 ${
                settingsFocus === 'tag_manager' ? 'ring-2 ring-purple-500/40' : ''
              }`}
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center border border-teal-200 dark:border-teal-800">
                    GTM
                  </div>
                  <span className="font-bold text-xs">{isAr ? 'مدير العلامات' : 'Tag Manager'}</span>
                </div>
                {gtmId ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {isAr ? 'محفوظ' : 'Saved'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {isAr ? 'غير محفوظ' : 'Not saved'}
                  </span>
                )}
              </div>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'معرّف الحاوية يُحفظ لهذا المتجر فقط — بدون استعارة من متجر آخر.'
                  : 'Container id is saved for this store only — never borrowed from another tenant.'}
              </p>
              <div
                className="pt-2 border-t text-xs font-mono truncate"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                {gtmId || '—'}
              </div>
            </div>

            <div
              className="p-5 rounded-2xl border shadow-xs space-y-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-200 dark:border-amber-800">
                    GA4
                  </div>
                  <span className="font-bold text-xs">{isAr ? 'تحليلات جوجل' : 'Analytics'}</span>
                </div>
                {ga4Id ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {isAr ? 'محفوظ' : 'Saved'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {isAr ? 'غير محفوظ' : 'Not saved'}
                  </span>
                )}
              </div>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'معرّف القياس الحقيقي فقط — لا قيم وهمية.'
                  : 'Real measurement id only — never invented values.'}
              </p>
              <div
                className="pt-2 border-t text-xs font-mono truncate"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                {ga4Id || '—'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSettingsFocus('search_console');
                setShowGoogleConnect(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              {isAr ? 'إعداد بحث جوجل' : 'Configure Search Console'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSettingsFocus('tag_manager');
                setShowGoogleConnect(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <Code className="w-3.5 h-3.5 text-purple-600" />
              {isAr ? 'إعداد مدير العلامات' : 'Configure Tag Manager'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: Notification Thresholds & Integrations ── */}
      {activeTab === 'thresholds' && <ThresholdSettings />}

      {/* ── TAB: Saudi WhatsApp & SMS Notifications ── */}
      {activeTab === 'notifications' && <NotificationSettings />}

      <GoogleConnectModal
        isOpen={showGoogleConnect}
        onClose={() => setShowGoogleConnect(false)}
        onConnected={() => {
          setShowGoogleConnect(false);
          toast(
            isAr ? 'تم ربط حساب جوجل لهذا المتجر' : 'Google account connected for this store',
            'success',
          );
        }}
      />
    </div>
  );
};
