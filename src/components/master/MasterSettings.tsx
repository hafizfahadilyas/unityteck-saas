import React, { useEffect, useMemo, useState } from 'react';
import { fetchPlatformSettings, updatePlatformSettings } from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
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
  Clock,
  RefreshCw,
  Server,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  LayoutDashboard,
  Layers,
  Archive,
  Store as StoreIcon,
  FileText,
  Megaphone,
  Lock,
  ChevronRight,
  Package,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { BrandingPanel } from '../common/BrandingPanel';
import { SkeletonSettingsCard } from '../common/skeleton';
import { DbSyncSettingsCard } from '../common/DbSyncSettingsCard';
import { bumpCacheTag, platformTag } from '../../api/cacheTags';
import { useToast } from '../common/ToastProvider';
import { CURRENCIES, type DisplayCurrency } from '../../i18n/prefs';
import { MasterControlCenter } from './MasterControlCenter';
import { MasterKpiGrid, MasterLuxePanel } from './MasterUiKit';
import { OverviewStatCard } from '../common/OverviewStatCard';

type OpsLink = {
  id: string;
  group: 'core' | 'infra' | 'commerce' | 'trust';
  label: string;
  hint: string;
  Icon: LucideIcon;
  badge?: string | number | null;
};

type MasterSettingsTab = 'controls' | 'platform' | 'localization' | 'appearance' | 'social' | 'database';

type MasterSettingsProps = {
  onNavigateTab?: (tab: string) => void;
};

export const MasterSettings: React.FC<MasterSettingsProps> = ({ onNavigateTab }) => {
  const { stores, allOrders, allProducts, softRefreshTenantData } = useTenant();
  const { locale, setLocale, currency, setCurrency } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const opsLive = useMemo(() => {
    const orderCount = Object.values(allOrders || {}).reduce(
      (n, list) => n + (Array.isArray(list) ? list.length : 0),
      0,
    );
    const productCount = Object.values(allProducts || {}).reduce(
      (n, list) => n + (Array.isArray(list) ? list.length : 0),
      0,
    );
    const activeStores = stores.filter((s) => {
      const st = String((s as { status?: string }).status || 'active').toLowerCase();
      return st === 'active' || st === 'live';
    }).length;
    return {
      storeCount: stores.length,
      activeStores,
      orderCount,
      productCount,
    };
  }, [stores, allOrders, allProducts]);

  const opsLinks = useMemo<OpsLink[]>(() => {
    const fmt = (n: number) => n.toLocaleString(isAr ? 'ar-SA' : 'en-US');
    return [
      {
        id: 'control-center',
        group: 'core',
        label: isAr ? 'مركز التحكم' : 'Control center',
        hint: isAr ? 'تبديل الصفحات والعناصر' : 'Page & feature toggles',
        Icon: LayoutDashboard,
      },
      {
        id: 'ops',
        group: 'core',
        label: isAr ? 'العمليات والسياسات' : 'Ops & policies',
        hint: isAr ? 'المهام والأخطاء والسياسات' : 'Jobs, errors & policies',
        Icon: Server,
      },
      {
        id: 'messaging',
        group: 'core',
        label: isAr ? 'الرسائل والقوالب' : 'Messaging',
        hint: isAr ? 'قوالب المنصة والقنوات' : 'Templates & channels',
        Icon: Megaphone,
      },
      {
        id: 'governance',
        group: 'trust',
        label: isAr ? 'الحوكمة' : 'Governance',
        hint: isAr ? 'الصيانة وطلبات الخصوصية' : 'Maintenance & privacy',
        Icon: ShieldCheck,
      },
      {
        id: 'onboarding',
        group: 'core',
        label: isAr ? 'طلبات الانضمام' : 'Onboarding',
        hint: isAr ? 'دعوات المتاجر الجديدة' : 'New store invites',
        Icon: StoreIcon,
        badge: opsLive.storeCount > 0 ? fmt(opsLive.storeCount) : null,
      },
      {
        id: 'domains',
        group: 'infra',
        label: isAr ? 'النطاقات' : 'Domains',
        hint: isAr ? 'النطاقات والاستضافة' : 'Domains & hosting',
        Icon: Globe,
      },
      {
        id: 'database',
        group: 'infra',
        label: isAr ? 'قاعدة البيانات' : 'Database',
        hint: isAr ? 'صحة MySQL والعزل' : 'MySQL health & isolation',
        Icon: Database,
      },
      {
        id: 'backup',
        group: 'infra',
        label: isAr ? 'النسخ الاحتياطي' : 'Backup & restore',
        hint: isAr ? 'نسخ واستعادة لكل متجر' : 'Per-store ZIP backup',
        Icon: Archive,
      },
      {
        id: 'updates',
        group: 'infra',
        label: isAr ? 'التحديثات' : 'Updates',
        hint: isAr ? 'طرح تحديثات المنصة' : 'Platform roll-outs',
        Icon: RefreshCw,
      },
      {
        id: 'marketplace',
        group: 'commerce',
        label: isAr ? 'متجر التطبيقات' : 'App store',
        hint: isAr ? 'إضافات المنصة' : 'Platform add-ons',
        Icon: Layers,
      },
      {
        id: 'themes',
        group: 'commerce',
        label: isAr ? 'السمات' : 'Themes',
        hint: isAr ? 'حزم السمات للمتاجر' : 'Store theme packs',
        Icon: Palette,
      },
      {
        id: 'canva',
        group: 'commerce',
        label: isAr ? 'استوديو التصميم' : 'Design studio',
        hint: isAr
          ? 'تصميم ونشر للمتاجر (وسائط + مكتبة التصميم)'
          : 'Design & push to stores (Media + Canva library)',
        Icon: ImageIcon,
      },
      {
        id: 'canva-real',
        group: 'commerce',
        label: isAr ? 'كانفا الرسمي (اختبار)' : 'Real Canva (testing)',
        hint: isAr
          ? 'ربط واجهة كانفا الرسمية — اختبار الماستر فقط'
          : 'Official Canva Connect API — Master test only',
        Icon: Share2,
      },
      {
        id: 'seo',
        group: 'commerce',
        label: isAr ? 'تحسين الظهور' : 'SEO',
        hint: isAr ? 'إعدادات الظهور العامة' : 'Platform SEO defaults',
        Icon: FileText,
      },
      {
        id: 'orders',
        group: 'commerce',
        label: isAr ? 'الطلبات' : 'Orders',
        hint: isAr ? 'طلبات كل المتاجر' : 'All-store order overview',
        Icon: ShoppingBag,
        badge: opsLive.orderCount > 0 ? fmt(opsLive.orderCount) : null,
      },
      {
        id: 'products',
        group: 'commerce',
        label: isAr ? 'المنتجات' : 'Products',
        hint: isAr ? 'كتالوج عبر المتاجر' : 'Cross-store catalog',
        Icon: Package,
        badge: opsLive.productCount > 0 ? fmt(opsLive.productCount) : null,
      },
      {
        id: 'security',
        group: 'trust',
        label: isAr ? 'الأمان' : 'Security',
        hint: isAr ? 'المشرفون والصلاحيات' : 'Admins & permissions',
        Icon: Lock,
      },
    ];
  }, [isAr, opsLive]);

  const opsGroups = useMemo(
    () =>
      [
        {
          id: 'core' as const,
          label: isAr ? 'التشغيل الأساسي' : 'Core operations',
        },
        {
          id: 'infra' as const,
          label: isAr ? 'البنية والاستضافة' : 'Infrastructure',
        },
        {
          id: 'commerce' as const,
          label: isAr ? 'التجارة والمحتوى' : 'Commerce & content',
        },
        {
          id: 'trust' as const,
          label: isAr ? 'الثقة والأمان' : 'Trust & security',
        },
      ].map((g) => ({
        ...g,
        links: opsLinks.filter((l) => l.group === g.id),
      })),
    [isAr, opsLinks],
  );

  const [activeTab, setActiveTab] = useState<MasterSettingsTab>('platform');

  // Platform details — dual EN/AR kept always for real testing
  const [platformNameEn, setPlatformNameEn] = useState('Souq Platform');
  const [platformNameAr, setPlatformNameAr] = useState('منصة سوق');
  const [platformTaglineEn, setPlatformTaglineEn] = useState('');
  const [platformTaglineAr, setPlatformTaglineAr] = useState('');
  const [platformLogo, setPlatformLogo] = useState('/favicon.svg');
  const [supportEmail, setSupportEmail] = useState('admin@unityteck.sa');
  const [timezone, setTimezone] = useState('Asia/Riyadh');

  // Social & WhatsApp
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessageEn, setMaintenanceMessageEn] = useState('');
  const [maintenanceMessageAr, setMaintenanceMessageAr] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    twitter: { enabled: false, url: '' },
    linkedin: { enabled: false, url: '' },
    instagram: { enabled: false, url: '' },
    youtube: { enabled: false, url: '' },
  });

  const [purging, setPurging] = useState(false);
  const [platformSaving, setPlatformSaving] = useState(false);
  const [, setPlatformLoaded] = useState(false);

  useEffect(() => {
    if (!isApiEnabled()) return;
    let cancelled = false;
    void fetchPlatformSettings()
      .then((res) => {
        if (cancelled) return;
        const d = res.data || {};
        if (typeof d.platformName === 'string' && d.platformName) setPlatformNameEn(d.platformName);
        if (typeof d.platformNameAr === 'string' && d.platformNameAr) setPlatformNameAr(d.platformNameAr);
        if (typeof d.platformTagline === 'string') setPlatformTaglineEn(d.platformTagline);
        if (typeof d.platformTaglineAr === 'string') setPlatformTaglineAr(d.platformTaglineAr);
        if (typeof d.platformLogo === 'string' && d.platformLogo) setPlatformLogo(d.platformLogo);
        if (typeof d.supportEmail === 'string' && d.supportEmail) setSupportEmail(d.supportEmail);
        if (typeof d.timezone === 'string' && d.timezone) setTimezone(d.timezone);
        if (typeof d.whatsappEnabled === 'boolean') setWhatsappEnabled(d.whatsappEnabled);
        if (typeof d.whatsappNumber === 'string') setWhatsappNumber(d.whatsappNumber);
        if (typeof d.maintenanceMode === 'boolean') setMaintenanceMode(d.maintenanceMode);
        if (typeof d.maintenanceMessage === 'string') setMaintenanceMessageEn(d.maintenanceMessage);
        if (typeof d.maintenanceMessageAr === 'string') setMaintenanceMessageAr(d.maintenanceMessageAr);
        const sl = d.socialLinks as typeof socialLinks | undefined;
        if (sl && typeof sl === 'object') {
          setSocialLinks((prev) => ({
            twitter: { ...prev.twitter, ...(sl.twitter || {}) },
            linkedin: { ...prev.linkedin, ...(sl.linkedin || {}) },
            instagram: { ...prev.instagram, ...(sl.instagram || {}) },
            youtube: { ...prev.youtube, ...(sl.youtube || {}) },
          }));
        }
        setPlatformLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setPlatformLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSavePlatform = async (e?: React.FormEvent, extra?: Record<string, unknown>) => {
    e?.preventDefault();
    if (!isApiEnabled()) {
      toast(
        isAr ? 'الخادم غير متصل — لا يمكن الحفظ' : 'API offline — cannot save',
        'warning',
      );
      return;
    }
    if (platformSaving) return;
    setPlatformSaving(true);
    try {
      await updatePlatformSettings({
        platformName: platformNameEn.trim() || 'Souq Platform',
        platformNameAr: platformNameAr.trim() || 'منصة سوق',
        platformTagline: platformTaglineEn,
        platformTaglineAr: platformTaglineAr,
        platformLogo,
        supportEmail,
        timezone,
        defaultLocale: locale,
        defaultCurrency: currency,
        whatsappEnabled,
        whatsappNumber,
        maintenanceMode,
        maintenanceMessage: maintenanceMessageEn,
        maintenanceMessageAr: maintenanceMessageAr,
        socialLinks,
        ...(extra || {}),
      });
      toast(isAr ? 'تم حفظ إعدادات المنصة' : 'Platform settings saved', 'success');
    } catch {
      toast(isAr ? 'فشل الحفظ — تحقق من الجلسة' : 'Save failed — check Master session', 'error');
    } finally {
      setPlatformSaving(false);
    }
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
    <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto min-w-0 w-full" style={{ color: 'var(--text)' }}>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {isAr ? 'إعدادات المنصة الرئيسية' : 'Master Admin Settings'}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `إدارة المنصة الشاملة، الألوان، الخطوط، العملات وجميع المتاجر (${stores.length})`
              : `Global platform configuration, top 15 palettes, top 15 fonts, multi-currency & ${stores.length} active stores`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = locale === 'ar' ? 'en' : 'ar';
              setLocale(next);
              toast(next === 'ar' ? 'تم تحويل النظام إلى العربية' : 'Language set to English', 'success');
            }}
            className="unity-btn-ghost text-xs inline-flex items-center gap-2"
            title={isAr ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
          >
            <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="font-bold">{isAr ? 'الإنجليزية' : 'Arabic'}</span>
          </button>

        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="u-settings-tabs custom-scroll" role="tablist">
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
              className={`u-settings-tab${active ? ' is-active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <MasterKpiGrid cols={6}>
        <OverviewStatCard
          label={isAr ? 'إجمالي المتاجر' : 'Total stores'}
          value={opsLive.storeCount.toLocaleString(isAr ? 'ar-SA' : 'en-US')}
          icon={StoreIcon}
          tone="accent"
        />
        <OverviewStatCard
          label={isAr ? 'متاجر نشطة' : 'Active stores'}
          value={opsLive.activeStores.toLocaleString(isAr ? 'ar-SA' : 'en-US')}
          icon={Check}
          tone="success"
        />
        <OverviewStatCard
          label={isAr ? 'طلبات المنصة' : 'Platform orders'}
          value={opsLive.orderCount.toLocaleString(isAr ? 'ar-SA' : 'en-US')}
          icon={ShoppingBag}
          tone="info"
        />
        <OverviewStatCard
          label={isAr ? 'منتجات المنصة' : 'Platform products'}
          value={opsLive.productCount.toLocaleString(isAr ? 'ar-SA' : 'en-US')}
          icon={Package}
          tone="warn"
        />
        <OverviewStatCard
          label={isAr ? 'وحدات التحكم' : 'Control modules'}
          value={opsLinks.length}
          icon={LayoutDashboard}
          tone="violet"
        />
        <OverviewStatCard
          label={isAr ? 'قاعدة البيانات' : 'Database'}
          value={isAr ? 'متصل' : 'Connected'}
          icon={Database}
          tone="accent"
          footer={
            <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {isAr ? 'مزامنة Hostinger MySQL' : 'Hostinger MySQL sync'}
            </span>
          }
        />
      </MasterKpiGrid>

      {onNavigateTab ? (
        <MasterLuxePanel className="space-y-6" padding="lg">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-black tracking-tight" style={{ color: 'var(--text)' }}>
                {isAr ? 'عمليات المنصة المتقدمة' : 'Advanced platform operations'}
              </p>
              <p className="text-xs sm:text-sm leading-relaxed mt-1" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'النطاقات والنسخ الاحتياطي والتحديثات ومركز التحكم — خارج القائمة الرئيسية ومتاحة بالكامل هنا.'
                  : 'Domains, backups, updates, and control center — outside the Phase 1 main menu but fully available here.'}
              </p>
            </div>
            <div
              className="flex flex-wrap items-center gap-2 shrink-0 text-[11px] font-bold tabular-nums"
              style={{ color: 'var(--muted)' }}
            >
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
                  borderColor: 'color-mix(in srgb, var(--accent) 28%, var(--border))',
                  color: 'var(--accent)',
                }}
              >
                {opsLive.activeStores}/{opsLive.storeCount}{' '}
                {isAr ? 'متاجر نشطة' : 'active stores'}
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                {opsLive.orderCount.toLocaleString(isAr ? 'ar-SA' : 'en-US')}{' '}
                {isAr ? 'طلبات' : 'orders'}
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                {opsLive.productCount.toLocaleString(isAr ? 'ar-SA' : 'en-US')}{' '}
                {isAr ? 'منتجات' : 'products'}
              </span>
            </div>
          </div>

          <div className="space-y-5">
            {opsGroups.map((group) => (
              <section key={group.id} className="space-y-3" aria-labelledby={`ops-group-${group.id}`}>
                <h3
                  id={`ops-group-${group.id}`}
                  className="text-[11px] font-extrabold uppercase tracking-[0.08em]"
                  style={{ color: 'var(--muted)' }}
                >
                  {group.label}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {group.links.map((link) => {
                    const Icon = link.Icon;
                    return (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => onNavigateTab(link.id)}
                        className="group relative flex flex-col gap-4 p-4 sm:p-5 min-h-[7.5rem] border text-start transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 min-w-0"
                        style={{
                          background: 'var(--surface)',
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                          borderRadius: 'var(--radius-ctrl, 1rem)',
                          boxShadow: '0 1px 0 color-mix(in srgb, var(--border) 65%, transparent)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3 w-full">
                          <span
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                            style={{
                              background: 'color-mix(in srgb, var(--accent) 14%, var(--bg))',
                              color: 'var(--accent)',
                              boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent)',
                            }}
                          >
                            <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.1} aria-hidden />
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {link.badge != null && link.badge !== '' ? (
                              <span
                                className="text-[11px] font-black px-2 py-0.5 rounded-full tabular-nums"
                                style={{
                                  background: 'color-mix(in srgb, var(--portal-cta, var(--accent)) 12%, transparent)',
                                  color: 'var(--portal-cta, var(--accent))',
                                }}
                              >
                                {link.badge}
                              </span>
                            ) : null}
                            <ChevronRight
                              className="w-4 h-4 opacity-35 transition-all group-hover:opacity-90 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                              style={{ color: 'var(--accent)' }}
                              aria-hidden
                            />
                          </div>
                        </div>
                        <div className="min-w-0 space-y-1 mt-auto">
                          <span className="block text-sm sm:text-[15px] font-extrabold leading-snug truncate">
                            {link.label}
                          </span>
                          <span
                            className="block text-[11px] sm:text-xs leading-relaxed line-clamp-2"
                            style={{ color: 'var(--muted)' }}
                          >
                            {link.hint}
                          </span>
                        </div>
                        <span
                          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                          style={{
                            boxShadow: 'inset 0 0 0 1.5px color-mix(in srgb, var(--accent) 45%, transparent)',
                          }}
                          aria-hidden
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </MasterLuxePanel>
      ) : null}

      {/* ── TAB 0: Central Controls & Toggles ── */}
      {activeTab === 'controls' && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <MasterControlCenter />
        </div>
      )}

      {/* ── TAB 1: Platform Identity ── */}
      {activeTab === 'platform' && (
        <form onSubmit={(e) => void handleSavePlatform(e)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="u-settings-luxe space-y-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'شعار المنصة' : 'Platform Brand Mark'}</span>
              </h3>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl border p-2 flex items-center justify-center shrink-0"
                  style={{
                    background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
                    borderColor: 'color-mix(in srgb, var(--accent) 22%, var(--border))',
                  }}
                >
                  <img src={platformLogo} alt="" className="w-10 h-10 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold mb-1.5 u-settings-luxe__muted">
                    {isAr ? 'رابط الشعار' : 'Logo URL'}
                  </label>
                  <input
                    type="text"
                    value={platformLogo}
                    onChange={(e) => setPlatformLogo(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 text-xs rounded-xl border"
                    placeholder="/favicon.svg"
                  />
                  <p className="text-[10px] mt-1 u-settings-luxe__muted">
                    {isAr
                      ? 'يُطبَّق على الشريط الجانبي للمشرف والمتجر'
                      : 'Applies across Master & Store sidebars'}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 u-settings-luxe u-settings-luxe--accent space-y-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'بيانات المنصة الرئيسية' : 'Platform Details'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 u-settings-luxe__muted">
                    {isAr ? 'اسم المنصة (إنجليزي)' : 'Platform name (English)'}
                  </label>
                  <input
                    type="text"
                    value={platformNameEn}
                    onChange={(e) => setPlatformNameEn(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 text-xs rounded-xl border"
                    placeholder="Souq Platform"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 u-settings-luxe__muted">
                    {isAr ? 'اسم المنصة (عربي)' : 'Platform name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={platformNameAr}
                    onChange={(e) => setPlatformNameAr(e.target.value)}
                    dir="rtl"
                    className="w-full px-3 py-2 text-xs rounded-xl border"
                    placeholder="منصة سوق"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 u-settings-luxe__muted">
                    {isAr ? 'بريد الدعم للمنصة' : 'Platform support email'}
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 text-xs rounded-xl border"
                    placeholder="admin@unityteck.sa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 u-settings-luxe__muted">
                    {isAr ? 'العبارة التعريفية (إنجليزي)' : 'Tagline (English)'}
                  </label>
                  <input
                    type="text"
                    value={platformTaglineEn}
                    onChange={(e) => setPlatformTaglineEn(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 text-xs rounded-xl border"
                    placeholder="Saudi multi-store commerce"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1.5 u-settings-luxe__muted">
                    {isAr ? 'العبارة التعريفية (عربي)' : 'Tagline (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={platformTaglineAr}
                    onChange={(e) => setPlatformTaglineAr(e.target.value)}
                    dir="rtl"
                    className="w-full px-3 py-2 text-xs rounded-xl border"
                    placeholder="التجارة الإلكترونية الشاملة في السعودية"
                  />
                </div>
              </div>

              <div
                className="rounded-xl border p-3 space-y-2"
                style={{
                  borderColor: 'color-mix(in srgb, var(--accent) 22%, var(--border))',
                  background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                      {isAr ? 'وضع الصيانة' : 'Maintenance mode'}
                    </p>
                    <p className="text-[10px] u-settings-luxe__muted">
                      {isAr
                        ? 'يُحفظ في إعدادات المنصة الحية'
                        : 'Persisted in live platform settings'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode((v) => !v)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold border"
                    style={{
                      borderColor: maintenanceMode
                        ? '#e11d48'
                        : 'color-mix(in srgb, var(--accent) 30%, var(--border))',
                      color: maintenanceMode ? '#be123c' : 'var(--muted)',
                      background: maintenanceMode
                        ? 'color-mix(in srgb, #e11d48 10%, var(--surface))'
                        : 'var(--surface)',
                    }}
                  >
                    {maintenanceMode
                      ? isAr
                        ? 'مفعّل'
                        : 'ON'
                      : isAr
                        ? 'متوقف'
                        : 'OFF'}
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 u-settings-luxe__muted">
                    {isAr ? 'رسالة الصيانة (بالإنجليزية)' : 'Maintenance message (English)'}
                  </label>
                  <textarea
                    value={maintenanceMessageEn}
                    onChange={(e) => setMaintenanceMessageEn(e.target.value)}
                    rows={2}
                    dir="ltr"
                    placeholder={
                      isAr
                        ? 'اكتب رسالة الصيانة بالإنجليزية…'
                        : 'Maintenance message (English)…'
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 u-settings-luxe__muted">
                    {isAr ? 'رسالة الصيانة (بالعربية)' : 'Maintenance message (Arabic)'}
                  </label>
                  <textarea
                    value={maintenanceMessageAr}
                    onChange={(e) => setMaintenanceMessageAr(e.target.value)}
                    rows={2}
                    dir="rtl"
                    placeholder={
                      isAr
                        ? 'اكتب رسالة الصيانة بالعربية…'
                        : 'Maintenance message (Arabic)…'
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={platformSaving}
                  aria-busy={platformSaving}
                  className="unity-btn-primary px-5 py-2.5 text-xs font-bold disabled:opacity-60"
                >
                  {platformSaving
                    ? isAr
                      ? 'جاري الحفظ…'
                      : 'Saving…'
                    : isAr
                      ? 'حفظ إعدادات المنصة'
                      : 'Save Platform Settings'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 2: Multi-Currency & Language ── */}
      {activeTab === 'localization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="u-settings-luxe space-y-4">
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}
            >
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h3 className="font-extrabold text-sm">
                  {isAr ? 'عملات المنصة' : 'Platform Currencies'}
                </h3>
              </div>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                {isAr ? `النشطة: ${currency}` : `Active: ${currency}`}
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
                    onClick={() => setCurrency(curKey)}
                    className={`p-3 rounded-xl border text-start cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      active ? 'ring-2' : 'hover:opacity-90'
                    }`}
                    style={{
                      background: active
                        ? 'color-mix(in srgb, var(--accent) 12%, var(--surface))'
                        : 'color-mix(in srgb, var(--accent) 4%, var(--surface))',
                      borderColor: active
                        ? 'color-mix(in srgb, var(--accent) 45%, var(--border))'
                        : 'color-mix(in srgb, var(--accent) 14%, var(--border))',
                      color: 'var(--text)',
                      ['--tw-ring-color' as string]: 'color-mix(in srgb, var(--accent) 40%, transparent)',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-extrabold text-sm">
                        <span>{symbol}</span>
                        <span className="text-[10px] font-mono opacity-80">({curKey})</span>
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                        {label}
                      </div>
                    </div>
                    {active && <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="u-settings-luxe u-settings-luxe--accent space-y-4">
            <div
              className="flex items-center gap-2 border-b pb-3"
              style={{ borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}
            >
              <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h3 className="font-extrabold text-sm">
                {isAr ? 'اللغة والمنطقة الزمنية' : 'Language & Timezone'}
              </h3>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold u-settings-luxe__muted">
                {isAr ? 'لغة واجهة المنصة' : 'Platform Language'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'en' as const,
                    label: isAr ? 'الإنجليزية' : 'English',
                    desc: isAr ? 'واجهة إنجليزية بالكامل' : '100% English',
                  },
                  {
                    id: 'ar' as const,
                    label: isAr ? 'العربية' : 'Arabic',
                    desc: isAr ? 'عربي بالكامل' : 'Full Arabic UI',
                  },
                ].map((item) => {
                  const active = locale === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLocale(item.id)}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        active ? 'ring-2 font-bold' : 'hover:opacity-90'
                      }`}
                      style={{
                        background: active
                          ? 'color-mix(in srgb, var(--accent) 12%, var(--surface))'
                          : 'color-mix(in srgb, var(--accent) 4%, var(--surface))',
                        borderColor: active
                          ? 'color-mix(in srgb, var(--accent) 45%, var(--border))'
                          : 'color-mix(in srgb, var(--accent) 14%, var(--border))',
                        color: 'var(--text)',
                        ['--tw-ring-color' as string]: 'color-mix(in srgb, var(--accent) 40%, transparent)',
                      }}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="space-y-3 pt-3 border-t"
              style={{ borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}
            >
              <label className="block text-xs font-bold u-settings-luxe__muted">
                {isAr ? 'المنطقة الزمنية للمنصة' : 'Platform Timezone'}
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border"
                >
                  <option value="Asia/Riyadh">
                    {isAr ? 'الرياض (توقيت السعودية)' : 'Asia/Riyadh (GMT+3) · Saudi Arabia'}
                  </option>
                  <option value="Asia/Dubai">
                    {isAr ? 'دبي (توقيت الإمارات)' : 'Asia/Dubai (GMT+4) · UAE'}
                  </option>
                  <option value="Asia/Karachi">
                    {isAr ? 'كراتشي (توقيت باكستان)' : 'Asia/Karachi (GMT+5) · Pakistan'}
                  </option>
                  <option value="Europe/London">
                    {isAr ? 'لندن (توقيت المملكة المتحدة)' : 'Europe/London (GMT+0) · UK'}
                  </option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={platformSaving}
                  aria-busy={platformSaving}
                  className="unity-btn-primary text-xs px-4 py-2"
                  onClick={() => void handleSavePlatform()}
                >
                  {platformSaving
                    ? isAr
                      ? 'جاري الحفظ…'
                      : 'Saving…'
                    : isAr
                      ? 'حفظ اللغة والعملة والمنطقة'
                      : 'Save language, currency & timezone'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Branding Panel (Top 15 Colors / Fonts / Weights) ── */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <BrandingPanel
            persistPlatform
            title={
              isAr
                ? 'هوية المنصة العامة · أهم 15 لونًا · أهم 15 خطًا · أوزان الخط'
                : 'Global Platform Branding · Top 15 Colors · Top 15 Fonts · Weights'
            }
          />
          <SkeletonSettingsCard />
        </div>
      )}

      {/* ── TAB 4: WhatsApp & Social ── */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="u-settings-luxe space-y-4">
              <div
                className="flex items-center justify-between border-b pb-3"
                style={{ borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <h3 className="font-extrabold text-sm">
                    {isAr ? 'دعم واتساب للمنصة' : 'Platform WhatsApp Support'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                  className="cursor-pointer"
                  aria-label={isAr ? 'تبديل واتساب' : 'Toggle WhatsApp'}
                >
                  {whatsappEnabled ? (
                    <ToggleRight className="w-7 h-7" style={{ color: 'var(--tone-success, #10b981)' }} />
                  ) : (
                    <ToggleLeft className="w-7 h-7" style={{ color: 'var(--plan-muted)' }} />
                  )}
                </button>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-bold u-settings-luxe__muted">
                  {isAr ? 'رقم واتساب الدعم' : 'Support WhatsApp Number'}
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  disabled={!whatsappEnabled}
                  dir="ltr"
                  placeholder="+9665…"
                  className="w-full px-3 py-2 text-xs rounded-xl border"
                />
                <p className="text-[10px] u-settings-luxe__muted">
                  {isAr
                    ? 'أدخل رقماً واحداً للاختبار ثم احفظ'
                    : 'Enter one test number, then save'}
                </p>
              </div>
            </div>

            <div className="u-settings-luxe u-settings-luxe--accent space-y-4">
              <div
                className="flex items-center gap-2 border-b pb-3"
                style={{ borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}
              >
                <Share2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h3 className="font-extrabold text-sm">
                  {isAr ? 'قنوات التواصل للمنصة' : 'Platform Social Channels'}
                </h3>
              </div>
              <div className="space-y-3">
                {Object.entries(socialLinks).map(([key, val]) => {
                  const channelLabel =
                    key === 'twitter'
                      ? isAr
                        ? 'إكس'
                        : 'X / Twitter'
                      : key === 'linkedin'
                        ? isAr
                          ? 'لينكدإن'
                          : 'LinkedIn'
                        : key === 'instagram'
                          ? isAr
                            ? 'إنستغرام'
                            : 'Instagram'
                          : isAr
                            ? 'يوتيوب'
                            : 'YouTube';
                  return (
                    <div key={key} className="flex items-center gap-2 min-w-0">
                      <span className="w-24 shrink-0 text-xs font-bold" style={{ color: 'var(--text)' }}>
                        {channelLabel}
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
                        dir="ltr"
                        placeholder="https://"
                        className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-xl border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSocialLinks((prev) => ({
                            ...prev,
                            [key]: { ...val, enabled: !val.enabled },
                          }));
                        }}
                        className="cursor-pointer shrink-0"
                        aria-label={isAr ? 'تفعيل أو إيقاف القناة' : 'Toggle channel'}
                      >
                        {val.enabled ? (
                          <ToggleRight className="w-6 h-6" style={{ color: 'var(--tone-success, #10b981)' }} />
                        ) : (
                          <ToggleLeft className="w-6 h-6" style={{ color: 'var(--plan-muted)' }} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={platformSaving}
              aria-busy={platformSaving}
              className="unity-btn-primary text-xs px-4 py-2"
              onClick={() => void handleSavePlatform()}
            >
              {platformSaving
                ? isAr
                  ? 'جاري الحفظ…'
                  : 'Saving…'
                : isAr
                  ? 'حفظ قنوات التواصل'
                  : 'Save support channels'}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 5: Database & Global Flush ── */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="u-settings-luxe">
            <DbSyncSettingsCard />
          </div>

          <div className="u-settings-luxe u-settings-luxe--accent space-y-4">
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3"
              style={{ borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Server className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
                <h3 className="font-bold text-sm">
                  {isAr ? 'ملخص عزل المستأجرين' : 'Multi-Tenant Partition Summary'}
                </h3>
              </div>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono self-start"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                {isAr ? `${stores.length} متجر مفعّل` : `${stores.length} Stores Provisioned`}
              </span>
            </div>
            <p className="text-xs leading-relaxed u-settings-luxe__muted">
              {isAr
                ? 'كل متجر معزول بصفوف معرّف المتجر في قاعدة البيانات الحية. وسوم الكاش الفورية تمنع البيانات القديمة دون إعادة تشغيل الخادم.'
                : 'Every store is isolated by store_id rows on live MySQL. Zero-stale cache tags push catalog updates across storefronts without server restarts.'}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => void handlePurgeAll()}
                disabled={purging}
                className="unity-btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${purging ? 'animate-spin' : ''}`} />
                <span>
                  {purging
                    ? isAr
                      ? 'جاري تفريغ الكاش…'
                      : 'Purging All Tenants…'
                    : isAr
                      ? 'تفريغ الكاش العام ومزامنة كل المتاجر'
                      : 'Purge Global Cache & Sync All Tenants'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
