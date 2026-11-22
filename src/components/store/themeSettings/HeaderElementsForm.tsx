import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  ShoppingBag,
  ShoppingCart,
  ShoppingBasket,
  Heart,
  User,
  Phone,
  Plus,
  Trash2,
  Sliders,
  Palette,
  Layout,
  ExternalLink,
  ChevronDown,
  Megaphone,
  Truck,
  CreditCard,
  Clock,
  Gift,
  Percent,
  Pencil,
  X,
  Eye,
  EyeOff,
  Menu,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { autoBilingualLabels } from '../../../i18n/autoBilingual';
import { useToast } from '../../common/ToastProvider';
import { MediaUploadField } from '../../common/MediaUploadField';
import { WhatsAppBrandIcon } from '../../common/BrandIcons';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  resolveStoreActiveThemeId,
} from '../../../themes/settings/themeSettingsStore';
import {
  type HeaderCustomSettings,
  getDefaultHeaderSettings,
  type HeaderAnnouncementMessage,
  type HeaderNavLink,
} from '../../../themes/settings/headerCustomSettings';
import { isCoffeeStore } from '../../../themes/settings/coffeeThemeDefaults';
import { resolveStoreContact } from '../../../themes/settings/storeContact';
import { useCoffeeFormLive } from './coffee/coffeeFormLive';

type HeaderSubTab = 'icons' | 'logo' | 'navigation' | 'announcement' | 'style';

type MegaCatalogRow = {
  id: string;
  name: string;
  nameAr?: string;
  image?: string;
};

const ANNOUNCEMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Truck,
  CreditCard,
  Clock,
  Gift,
  Percent,
};

/** Same labels as live HiBrew header menu (desktop + mobile home). */
const COFFEE_LOCKED_NAV_ITEMS: Array<{ key: string; labelAr: string; labelEn: string }> = [
  { key: 'home', labelAr: 'الرئيسية', labelEn: 'Home' },
  { key: 'shop', labelAr: 'المتجر', labelEn: 'Shop' },
  { key: 'machines', labelAr: 'المكائن', labelEn: 'Machines' },
  { key: 'mills', labelAr: 'المطاحن', labelEn: 'Mills' },
  { key: 'cabinets', labelAr: 'أركان ودواليب القهوة', labelEn: 'Coffee Bars' },
  { key: 'accessories', labelAr: 'الأكواب والمستلزمات', labelEn: 'Accessories' },
  { key: 'offers', labelAr: 'العروض والباقات', labelEn: 'HiBrew CHOICE' },
  { key: 'ai', labelAr: 'الذكاء الاصطناعي', labelEn: 'AI' },
  { key: 'business', labelAr: 'قطاع الأعمال', labelEn: 'Business' },
  { key: 'support', labelAr: 'الدعم والضمان', labelEn: 'Support' },
];

function HeaderNavListEditor({
  isAr,
  title,
  testId,
  links,
  onChange,
}: {
  isAr: boolean;
  title: string;
  testId: 'desktop' | 'tablet' | 'mobile' | 'extra';
  links: HeaderNavLink[];
  onChange: (links: HeaderNavLink[]) => void;
}) {
  return (
    <div
      data-nav-editor={testId}
      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-500">{title}</span>
        <button
          type="button"
          onClick={() => {
            onChange([
              ...links,
              {
                id: `nav-${testId}-${Date.now()}`,
                labelAr: '',
                labelEn: '',
                icon: 'Sparkles',
                url: 'products',
                active: true,
              },
            ]);
          }}
          className="px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
          style={{ background: 'color-mix(in srgb, var(--portal-cta) 12%, var(--surface))', color: 'var(--portal-cta)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAr ? 'إضافة رابط' : 'Add link'}</span>
        </button>
      </div>
      {links.length === 0 ? (
        <p className="text-[11px] text-slate-400">
          {isAr ? 'لا توجد روابط. قائمة المتجر الحالية تبقى كما هي.' : 'No links yet. The current store menu stays as it is.'}
        </p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
          {links.map((link, idx) => {
            const isVisible = link.active !== false;
            return (
            <div
              key={link.id}
              className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 space-y-2 ${
                isVisible ? '' : 'opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={isAr ? (link.labelAr || link.labelEn) : (link.labelEn || link.labelAr)}
                  onChange={(e) => {
                    const labels = autoBilingualLabels(e.target.value);
                    const copy = [...links];
                    copy[idx] = { ...copy[idx], ...labels };
                    onChange(copy);
                  }}
                  placeholder={isAr ? 'الاسم — ترجمة تلقائية' : 'Name — auto-translates'}
                  className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  dir={isAr ? 'rtl' : 'ltr'}
                />
                <button
                  type="button"
                  onClick={() => {
                    const copy = [...links];
                    copy[idx] = { ...copy[idx], active: !isVisible };
                    onChange(copy);
                  }}
                  className={`p-1 rounded-lg cursor-pointer ${
                    isVisible ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                  }`}
                  title={isVisible ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                  aria-label={isVisible ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                >
                  {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => onChange(links.filter((_, i) => i !== idx))}
                  className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                  aria-label={isAr ? 'حذف' : 'Delete'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold shrink-0">
                  {isAr ? 'الوجهة' : 'Destination'}
                </span>
                <input
                  type="text"
                  value={link.url || ''}
                  onChange={(e) => {
                    const copy = [...links];
                    copy[idx] = { ...copy[idx], url: e.target.value };
                    onChange(copy);
                  }}
                  className="w-full px-2 py-0.5 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  dir="ltr"
                />
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const HeaderElementsForm: React.FC<{ onBack?: () => void; embedded?: boolean }> = ({
  embedded = false,
}) => {
  const { activeStore, currentProducts, allProducts } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const coffee = isCoffeeStore(activeStore);
  const liveCanvas = useCoffeeFormLive();
  const megaPanelRef = useRef<HTMLDivElement>(null);
  const liveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const livePrimedRef = useRef(false);
  const [megaSearch, setMegaSearch] = useState('');
  const [megaEditId, setMegaEditId] = useState<string | null>(null);
  const [megaPickOpen, setMegaPickOpen] = useState(false);
  const [desktopOverrideOpen, setDesktopOverrideOpen] = useState(false);

  const [headerSettings, setHeaderSettings] = useState<HeaderCustomSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.customHeader || getDefaultHeaderSettings(activeStore);
  });

  /** Page Builder → Main Menu opens straight on mega / nav controls */
  const [activeSubTab, setActiveSubTab] = useState<HeaderSubTab>(() =>
    embedded ? 'navigation' : 'icons',
  );
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  /** Page Builder liveCanvas: push customHeader to canvas without waiting for Save */
  const pushHeaderLive = (next: HeaderCustomSettings) => {
    if (!liveCanvas || !livePrimedRef.current || !activeStore?.id) return;
    if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
    liveTimerRef.current = setTimeout(() => {
      const full = readAllThemeSettings(activeStore.id, activeStore);
      full.customHeader = next;
      writeAllThemeSettings(activeStore.id, full, undefined, { syncApi: false });
    }, 220);
  };

  const patchHeaderSettings = (updater: React.SetStateAction<HeaderCustomSettings>) => {
    setHeaderSettings((prev) => {
      const resolved = typeof updater === 'function' ? updater(prev) : updater;
      pushHeaderLive(resolved);
      return resolved;
    });
  };

  const storeCatalog: MegaCatalogRow[] = useMemo(() => {
    const rows =
      (allProducts?.[activeStore.id] && allProducts[activeStore.id].length
        ? allProducts[activeStore.id]
        : currentProducts) || [];
    return rows.map((p) => ({
      id: p.id,
      name: p.name || '',
      nameAr: p.nameAr || '',
      image:
        p.colors?.[0]?.image ||
        p.images?.[0] ||
        (p as { image?: string }).image ||
        '',
    }));
  }, [allProducts, activeStore.id, currentProducts]);

  const megaIds = headerSettings.navigation.menuProductIds || [];
  const megaOverrides = headerSettings.navigation.menuProductOverrides || {};
  const megaMax = Math.min(12, Math.max(1, Number(headerSettings.navigation.menuMaxProducts) || 5));

  const patchMegaIds = (ids: string[]) =>
    patchHeaderSettings((p) => ({
      ...p,
      navigation: {
        ...p.navigation,
        menuProductSource: 'manual',
        menuProductIds: ids.slice(0, 12),
      },
    }));

  const patchMegaOverride = (
    productId: string,
    patch: { image?: string; nameEn?: string; nameAr?: string },
  ) =>
    patchHeaderSettings((p) => ({
      ...p,
      navigation: {
        ...p.navigation,
        menuProductOverrides: {
          ...(p.navigation.menuProductOverrides || {}),
          [productId]: {
            ...((p.navigation.menuProductOverrides || {})[productId] || {}),
            ...patch,
          },
        },
      },
    }));

  useEffect(() => {
    if (!embedded || activeSubTab !== 'navigation') return;
    const t = window.setTimeout(() => {
      megaPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [embedded, activeSubTab]);

  // Sync if store changes — WhatsApp digits always from THIS store’s identity
  useEffect(() => {
    livePrimedRef.current = false;
    const full = readAllThemeSettings(activeStore.id, activeStore);
    const base = full.customHeader || getDefaultHeaderSettings(activeStore);
    const contact = resolveStoreContact(activeStore.id, activeStore);
    const next = {
      ...base,
      actions: {
        ...base.actions,
        whatsapp: {
          ...(base.actions?.whatsapp || {
            enabled: true,
            phoneNumber: '',
            tooltipAr: 'تواصل مباشر مع المتجر',
            tooltipEn: 'Live Store WhatsApp',
            iconColor: '#25D366',
            pulseAnimation: true,
          }),
          phoneNumber: contact.whatsappDigits || '',
        },
      },
    };
    setHeaderSettings(next);
    const prime = window.setTimeout(() => {
      livePrimedRef.current = true;
    }, 500);
    return () => {
      window.clearTimeout(prime);
      if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
    };
  }, [activeStore.id]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const full = readAllThemeSettings(activeStore.id, activeStore);
      full.customHeader = headerSettings;
      await writeAllThemeSettings(activeStore.id, full);

      if (isCoffeeStore(activeStore)) {
        try {
          const { isApiEnabled } = await import('../../../api/client');
          if (isApiEnabled()) {
            const { updateThemeSettingsApi } = await import('../../../api/tenantApi');
            const themeId = resolveStoreActiveThemeId(activeStore.id) || 'theme-coffee-artisan';
            await updateThemeSettingsApi(activeStore.id, {
              theme_id: themeId,
              settings: { customHeader: headerSettings },
            });
          }
        } catch {
          toast(
            isAr
              ? 'حُفظ محلياً، لكن مزامنة الخادم فشلت. أعد المحاولة.'
              : 'Saved locally, but server sync failed. Try again.',
            'error',
          );
          setSaving(false);
          return;
        }
      }

      setSavedFlash(true);
      toast(
        isCoffeeStore(activeStore)
          ? isAr
            ? 'تم حفظ الهيدر في الخادم. الواجهة تتحدّث بعد هذا الحفظ.'
            : 'Header saved to the server. The storefront updates after this save.'
          : isAr
            ? 'تم حفظ إعدادات الهيدر بنجاح'
            : 'Header settings saved successfully',
        'success',
      );
      window.setTimeout(() => setSavedFlash(false), 2500);
    } catch {
      toast(isAr ? 'فشل حفظ الهيدر' : 'Failed to save header', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const fresh = getDefaultHeaderSettings(activeStore);
    patchHeaderSettings(fresh);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.customHeader = fresh;
    writeAllThemeSettings(activeStore.id, full);
    toast(isAr ? 'تمت استعادة الإعدادات الافتراضية' : 'Reset to default header settings', 'info');
  };

  const toggleTrack = (on: boolean) =>
    `w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
      on ? 'justify-end bg-[var(--portal-cta)]' : 'bg-slate-300 dark:bg-slate-700 justify-start'
    }`;

  // Safe action icon objects with fallback defaults
  const actions = headerSettings.actions;
  const wishlist = actions.wishlist || {
    enabled: true,
    iconColor: '#e11d48',
    badgeBg: '#e11d48',
    badgeText: '#ffffff',
    showBadgeCount: true,
  };
  const whatsapp = actions.whatsapp || {
    enabled: true,
    phoneNumber: '',
    tooltipAr: 'تواصل مباشر مع المتجر',
    tooltipEn: 'Live Store WhatsApp',
    iconColor: '#25D366',
    pulseAnimation: true,
  };
  const cartAction = actions.cart;
  const accountAction = actions.account;
  const searchAction = actions.search;

  return (
    <div className="space-y-4 text-slate-900 dark:text-slate-100 font-sans">
      {/* Header Banner */}
      <div
        className="p-4 rounded-2xl border flex items-center justify-between gap-3"
        style={{
          borderColor: 'var(--border)',
          background: 'color-mix(in srgb, var(--portal-cta) 8%, var(--surface))',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: 'var(--portal-cta)' }}
          >
            <Layout className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black truncate">
              {coffee
                ? isAr
                  ? 'القائمة الرئيسية والقائمة الكبرى'
                  : 'Main Menu & Mega Menu'
                : isAr
                  ? 'مخصص عناصر الهيدر والشعار'
                  : 'Header, Logo & Action Icons'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {coffee
                ? isAr
                  ? 'تبويب القائمة الكبرى: منتجات وصور وأزرار — التغيير يظهر في المعاينة مباشرة'
                  : 'Mega Menu tab: products, images, buttons — edits show live in the preview'
                : isAr
                  ? 'تخصيص الشعار، أيقونات المفضلة والسلة وواتساب والروابط'
                  : 'Customize logo, wishlist, cart, WhatsApp and nav links'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="unity-btn-primary px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0 transition-transform active:scale-95"
        >
          {savedFlash ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saving ? (isAr ? 'حفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم!' : 'Saved!') : (isAr ? 'حفظ' : 'Save')}</span>
        </button>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold">
        {[
          { id: 'icons', labelAr: 'أيقونات الإجراءات', labelEn: 'Action Icons', icon: Heart },
          { id: 'logo', labelAr: 'الشعار والهوية', labelEn: 'Logo & Title', icon: Palette },
          {
            id: 'navigation',
            labelAr: coffee ? 'القائمة الكبرى' : 'روابط القائمة',
            labelEn: coffee ? 'Mega Menu' : 'Nav Links',
            icon: Sliders,
          },
          { id: 'announcement', labelAr: 'شريط الإعلانات', labelEn: 'Top Marquee', icon: Megaphone },
          { id: 'style', labelAr: 'المظهر والتثبيت', labelEn: 'Header Style', icon: Layout },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as HeaderSubTab)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={isActive ? { color: 'var(--accent)' } : undefined}
              data-header-tab={tab.id}
            >
              <TabIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: ACTION ICONS (HEART WISHLIST, CART, WHATSAPP, PROFILE, SEARCH) ─── */}
      {activeSubTab === 'icons' && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* 1. Wishlist Heart Icon Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-rose-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{isAr ? 'أيقونة المفضلة' : 'Wishlist icon'}</h4>
                  <p className="text-[10px] text-slate-400">{isAr ? 'إظهار زر التفضيل وحفظ المنتجات بالهيدر' : 'Toggle wishlist heart in header'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    actions: {
                      ...p.actions,
                      wishlist: { ...wishlist, enabled: !wishlist.enabled },
                    },
                  }))
                }
                className={toggleTrack(wishlist.enabled)}
                aria-label={isAr ? 'تبديل المفضلة' : 'Toggle wishlist'}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {wishlist.enabled && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون الأيقونة' : 'Heart Color'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={wishlist.iconColor || '#e11d48'}
                      onChange={(e) =>
                        patchHeaderSettings((p) => ({
                          ...p,
                          actions: {
                            ...p.actions,
                            wishlist: { ...wishlist, iconColor: e.target.value },
                          },
                        }))
                      }
                      className="w-7 h-7 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={wishlist.iconColor || '#e11d48'}
                      onChange={(e) =>
                        patchHeaderSettings((p) => ({
                          ...p,
                          actions: {
                            ...p.actions,
                            wishlist: { ...wishlist, iconColor: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'عداد المنتجات' : 'Show Badge Count'}</label>
                  <button
                    type="button"
                    onClick={() =>
                      patchHeaderSettings((p) => ({
                        ...p,
                        actions: {
                          ...p.actions,
                          wishlist: { ...wishlist, showBadgeCount: !wishlist.showBadgeCount },
                        },
                      }))
                    }
                    className="w-full py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-start text-[11px] font-bold flex items-center justify-between"
                  >
                    <span>{wishlist.showBadgeCount ? (isAr ? 'مفعل' : 'Visible') : (isAr ? 'مخفي' : 'Hidden')}</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Cart / Add to Cart Icon Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{isAr ? 'أيقونة السلة' : 'Shopping cart icon'}</h4>
                  <p className="text-[10px] text-slate-400">{isAr ? 'أيقونة سلة الشراء والعداد العائم' : 'Cart icon, counter badge and pill'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    actions: {
                      ...p.actions,
                      cart: { ...cartAction, enabled: !cartAction.enabled },
                    },
                  }))
                }
                className={toggleTrack(cartAction.enabled)}
                aria-label={isAr ? 'تبديل السلة' : 'Toggle cart'}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {cartAction.enabled && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  {(['ShoppingBag', 'ShoppingCart', 'ShoppingBasket'] as const).map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() =>
                        patchHeaderSettings((p) => ({
                          ...p,
                          actions: {
                            ...p.actions,
                            cart: { ...cartAction, icon: ic },
                          },
                        }))
                      }
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        cartAction.icon === ic
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {ic === 'ShoppingBag' && <ShoppingBag className="w-4 h-4" />}
                      {ic === 'ShoppingCart' && <ShoppingCart className="w-4 h-4" />}
                      {ic === 'ShoppingBasket' && <ShoppingBasket className="w-4 h-4" />}
                      <span className="text-[10px]">{ic}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون خلفية شارة العداد' : 'Badge Color'}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cartAction.badgeBg || '#c88a58'}
                        onChange={(e) =>
                          patchHeaderSettings((p) => ({
                            ...p,
                            actions: {
                              ...p.actions,
                              cart: { ...cartAction, badgeBg: e.target.value },
                            },
                          }))
                        }
                        className="w-7 h-7 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cartAction.badgeBg || '#c88a58'}
                        onChange={(e) =>
                          patchHeaderSettings((p) => ({
                            ...p,
                            actions: {
                              ...p.actions,
                              cart: { ...cartAction, badgeBg: e.target.value },
                            },
                          }))
                        }
                        className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'إظهار المجموع' : 'Show Subtotal'}</label>
                    <button
                      type="button"
                      onClick={() =>
                        patchHeaderSettings((p) => ({
                          ...p,
                          actions: {
                            ...p.actions,
                            cart: { ...cartAction, showSubtotal: !cartAction.showSubtotal },
                          },
                        }))
                      }
                      className="w-full py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-start text-[11px] font-bold flex items-center justify-between"
                    >
                      <span>{cartAction.showSubtotal ? (isAr ? 'مفعل' : 'Active') : (isAr ? 'معطل' : 'Off')}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. WhatsApp Direct Icon Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#25D366] flex items-center justify-center">
                  <WhatsAppBrandIcon className="w-4 h-4 text-[#25D366]" title="WhatsApp" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{isAr ? 'أيقونة واتساب' : 'WhatsApp icon'}</h4>
                  <p className="text-[10px] text-slate-400">{isAr ? 'زر الدردشة الفورية مع الدعم في الهيدر' : 'Direct WhatsApp chat in top header'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    actions: {
                      ...p.actions,
                      whatsapp: { ...whatsapp, enabled: !whatsapp.enabled },
                    },
                  }))
                }
                className={toggleTrack(whatsapp.enabled)}
                aria-label={isAr ? 'تبديل واتساب' : 'Toggle WhatsApp'}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {whatsapp.enabled && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    {isAr ? 'رقم واتساب المتجر (تلقائي من هوية المتجر)' : 'Store WhatsApp (auto from Store Identity)'}
                  </label>
                  <input
                    type="text"
                    value={whatsapp.phoneNumber || ''}
                    readOnly
                    placeholder={isAr ? 'يُملأ من إعدادات هوية المتجر' : 'Filled from Store Identity settings'}
                    dir="ltr"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 font-mono opacity-90 cursor-default"
                  />
                  <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'يُحدَّث تلقائياً عند حفظ رقم واتساب في هوية المتجر — لا يُنسخ من متجر آخر.'
                      : 'Auto-synced when you save WhatsApp in Store Identity — never copied from another store.'}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'نص التلميح' : 'Tooltip'}</label>
                  <input
                    type="text"
                    dir={isAr ? 'rtl' : 'ltr'}
                    value={isAr ? whatsapp.tooltipAr || '' : whatsapp.tooltipEn || ''}
                    onChange={(e) =>
                      patchHeaderSettings((p) => ({
                        ...p,
                        actions: {
                          ...p.actions,
                          whatsapp: {
                            ...whatsapp,
                            ...(isAr ? { tooltipAr: e.target.value } : { tooltipEn: e.target.value }),
                          },
                        },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'تأثير النبض' : 'Pulse Animation'}</label>
                  <button
                    type="button"
                    onClick={() =>
                      patchHeaderSettings((p) => ({
                        ...p,
                        actions: {
                          ...p.actions,
                          whatsapp: { ...whatsapp, pulseAnimation: !whatsapp.pulseAnimation },
                        },
                      }))
                    }
                    className="w-full py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-start text-[11px] font-bold flex items-center justify-between"
                  >
                    <span>{whatsapp.pulseAnimation ? (isAr ? 'نبض مفعل' : 'Pulse Active') : (isAr ? 'ثابت' : 'Static')}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Profile / Account Icon Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{isAr ? 'أيقونة الحساب' : 'Account icon'}</h4>
                  <p className="text-[10px] text-slate-400">{isAr ? 'تسجيل الدخول والملف الشخصي' : 'Customer profile & authentication'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    actions: {
                      ...p.actions,
                      account: { ...accountAction, enabled: !accountAction.enabled },
                    },
                  }))
                }
                className={toggleTrack(accountAction.enabled)}
                aria-label={isAr ? 'تبديل الحساب' : 'Toggle account'}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {accountAction.enabled && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'النص' : 'Label'}</label>
                <input
                  type="text"
                  dir={isAr ? 'rtl' : 'ltr'}
                  value={isAr ? accountAction.labelAr || 'حسابي' : accountAction.labelEn || 'Sign In'}
                  onChange={(e) =>
                    patchHeaderSettings((p) => ({
                      ...p,
                      actions: {
                        ...p.actions,
                        account: {
                          ...accountAction,
                          ...(isAr ? { labelAr: e.target.value } : { labelEn: e.target.value }),
                        },
                      },
                    }))
                  }
                  className="w-full px-2 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            )}
          </div>

          {/* 5. Search Icon Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{isAr ? 'أيقونة البحث' : 'Search icon'}</h4>
                  <p className="text-[10px] text-slate-400">{isAr ? 'نافذة البحث الفوري عن المنتجات' : 'Instant product search popup'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    actions: {
                      ...p.actions,
                      search: { ...searchAction, enabled: !searchAction.enabled },
                    },
                  }))
                }
                className={toggleTrack(searchAction.enabled)}
                aria-label={isAr ? 'تبديل البحث' : 'Toggle search'}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {searchAction.enabled && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    {isAr ? 'نص تلميح البحث' : 'Search Placeholder'}
                  </label>
                  <input
                    type="text"
                    dir={isAr ? 'rtl' : 'ltr'}
                    value={
                      isAr
                        ? searchAction.placeholderAr || ''
                        : (searchAction as { placeholderEn?: string }).placeholderEn ||
                          searchAction.placeholderAr ||
                          ''
                    }
                    onChange={(e) =>
                      patchHeaderSettings((p) => ({
                        ...p,
                        actions: {
                          ...p.actions,
                          search: {
                            ...searchAction,
                            ...(isAr
                              ? { placeholderAr: e.target.value }
                              : { placeholderEn: e.target.value }),
                          },
                        },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: LOGO & IDENTITY ─── */}
      {activeSubTab === 'logo' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-200 shadow-2xs text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'نمط عرض الشعار' : 'Logo Display Mode'}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'image_and_text', labelAr: 'شعار مع نص', labelEn: 'Image & Text' },
                { id: 'image_only', labelAr: 'صورة فقط', labelEn: 'Image Only' },
                { id: 'text_only', labelAr: 'نص فقط', labelEn: 'Text Only' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    patchHeaderSettings((p) => ({
                      ...p,
                      logo: { ...p.logo, mode: m.id as any },
                    }))
                  }
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    headerSettings.logo.mode === m.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px]">{isAr ? m.labelAr : m.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          <MediaUploadField
            label={isAr ? 'صورة الشعار' : 'Logo image'}
            value={headerSettings.logo.imageUrl || ''}
            onChange={(url) =>
              patchHeaderSettings((p) => ({
                ...p,
                logo: { ...p.logo, imageUrl: url },
              }))
            }
            altText={isAr ? headerSettings.logo.titleAr : headerSettings.logo.titleEn}
            aspectRatio="square"
            initialFolder="logo"
            recommendedSize="512 × 512 px"
          />

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'العنوان' : 'Title'}</label>
            <input
              type="text"
              dir={isAr ? 'rtl' : 'ltr'}
              value={isAr ? headerSettings.logo.titleAr || '' : headerSettings.logo.titleEn || ''}
              onChange={(e) =>
                patchHeaderSettings((p) => ({
                  ...p,
                  logo: {
                    ...p.logo,
                    ...(isAr ? { titleAr: e.target.value } : { titleEn: e.target.value }),
                    applyTitle: true,
                  },
                }))
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'العنوان الفرعي' : 'Subtitle'}</label>
            <input
              type="text"
              dir={isAr ? 'rtl' : 'ltr'}
              value={isAr ? headerSettings.logo.subtitleAr || '' : headerSettings.logo.subtitleEn || ''}
              onChange={(e) =>
                patchHeaderSettings((p) => ({
                  ...p,
                  logo: {
                    ...p.logo,
                    ...(isAr ? { subtitleAr: e.target.value } : { subtitleEn: e.target.value }),
                  },
                }))
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'ارتفاع الشعار' : 'Height'}</label>
              <input
                type="number"
                min="20"
                max="100"
                value={headerSettings.logo.logoHeight || 44}
                onChange={(e) =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    logo: { ...p.logo, logoHeight: Number(e.target.value) },
                  }))
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون النص' : 'Title Color'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={headerSettings.logo.titleColor || '#000000'}
                  onChange={(e) =>
                    patchHeaderSettings((p) => ({
                      ...p,
                      logo: { ...p.logo, titleColor: e.target.value },
                    }))
                  }
                  className="w-7 h-7 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={headerSettings.logo.titleColor || '#000000'}
                  onChange={(e) =>
                    patchHeaderSettings((p) => ({
                      ...p,
                      logo: { ...p.logo, titleColor: e.target.value },
                    }))
                  }
                  className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: DESKTOP AND MOBILE NAV ─── */}
      {activeSubTab === 'navigation' && (
        <div className="space-y-3 animate-in fade-in duration-200 text-xs">
          {/* DF-03 — Enable + Compare + View More (parity with builder inspector) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs" data-nav-controls="word-enable">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">{isAr ? 'تفعيل القائمة الرئيسية' : 'Enable Main Menu'}</span>
              <button
                type="button"
                className={toggleTrack(headerSettings.navigation.enabled !== false)}
                onClick={() =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    navigation: { ...p.navigation, enabled: p.navigation.enabled === false },
                  }))
                }
                aria-label={isAr ? 'تبديل القائمة' : 'Toggle menu'}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">{isAr ? 'زر المقارنة' : 'Compare button'}</span>
              <button
                type="button"
                className={toggleTrack(Boolean(headerSettings.navigation.showCompareButton))}
                onClick={() =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    navigation: {
                      ...p.navigation,
                      showCompareButton: !p.navigation.showCompareButton,
                    },
                  }))
                }
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
            {headerSettings.navigation.showCompareButton ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  dir="rtl"
                  value={headerSettings.navigation.compareButtonLabelAr || ''}
                  onChange={(e) =>
                    patchHeaderSettings((p) => ({
                      ...p,
                      navigation: { ...p.navigation, compareButtonLabelAr: e.target.value },
                    }))
                  }
                  placeholder={isAr ? 'نص المقارنة عربي' : 'Arabic compare label'}
                />
                <input
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  dir="ltr"
                  value={headerSettings.navigation.compareButtonLabelEn || ''}
                  onChange={(e) =>
                    patchHeaderSettings((p) => ({
                      ...p,
                      navigation: { ...p.navigation, compareButtonLabelEn: e.target.value },
                    }))
                  }
                  placeholder={isAr ? 'نص المقارنة إنجليزي' : 'English compare label'}
                />
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">{isAr ? 'زر عرض المزيد' : 'View more button'}</span>
              <button
                type="button"
                className={toggleTrack(Boolean(headerSettings.navigation.showViewMoreButton))}
                onClick={() =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    navigation: {
                      ...p.navigation,
                      showViewMoreButton: !p.navigation.showViewMoreButton,
                    },
                  }))
                }
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
            {headerSettings.navigation.showViewMoreButton ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  dir="rtl"
                  value={headerSettings.navigation.viewMoreLabelAr || ''}
                  onChange={(e) =>
                    patchHeaderSettings((p) => ({
                      ...p,
                      navigation: { ...p.navigation, viewMoreLabelAr: e.target.value },
                    }))
                  }
                  placeholder={isAr ? 'نص عرض المزيد عربي' : 'Arabic view-more label'}
                />
                <input
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  dir="ltr"
                  value={headerSettings.navigation.viewMoreLabelEn || ''}
                  onChange={(e) =>
                    patchHeaderSettings((p) => ({
                      ...p,
                      navigation: { ...p.navigation, viewMoreLabelEn: e.target.value },
                    }))
                  }
                  placeholder={isAr ? 'نص عرض المزيد إنجليزي' : 'English view-more label'}
                />
                <input
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 sm:col-span-2"
                  dir="ltr"
                  value={headerSettings.navigation.viewMoreUrl || ''}
                  onChange={(e) =>
                    patchHeaderSettings((p) => ({
                      ...p,
                      navigation: { ...p.navigation, viewMoreUrl: e.target.value },
                    }))
                  }
                  placeholder="/shop"
                />
              </div>
            ) : null}
          </div>

          {coffee ? (
            <div
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs"
              data-nav-controls="coffee-locked-items"
            >
              <div className="flex items-start gap-2">
                <Menu className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                    {isAr ? 'عناصر شريط التنقل' : 'Navbar items'}
                  </h4>
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'إظهار أو إخفاء عناصر القائمة الكبرى دون استبدال التخطيط. أضف روابط إضافية في الأسفل.'
                      : 'Show or hide mega-menu items without replacing the HiBrew layout. Add extra links below.'}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                {COFFEE_LOCKED_NAV_ITEMS.map((item) => {
                  const hidden = (headerSettings.navigation.hiddenNavKeys || []).includes(item.key);
                  const visible = !hidden;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850"
                      data-nav-item-key={item.key}
                    >
                      <span className="text-[11px] font-bold truncate" style={{ color: 'var(--text)' }}>
                        {isAr ? item.labelAr : item.labelEn}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          patchHeaderSettings((p) => {
                            const prev = p.navigation.hiddenNavKeys || [];
                            const next = visible
                              ? [...prev, item.key]
                              : prev.filter((k) => k !== item.key);
                            return {
                              ...p,
                              navigation: { ...p.navigation, hiddenNavKeys: next },
                            };
                          })
                        }
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          visible ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={visible ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                        aria-label={visible ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                      >
                        {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
              <HeaderNavListEditor
                isAr={isAr}
                title={isAr ? 'روابط إضافية (بعد القائمة الكبرى)' : 'Extra links (after mega menu)'}
                testId="extra"
                links={headerSettings.navigation.extraLinks ?? []}
                onChange={(links) =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    navigation: { ...p.navigation, extraLinks: links },
                  }))
                }
              />
            </div>
          ) : null}

          <div
            ref={megaPanelRef}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 space-y-3 shadow-2xs"
            style={{
              borderColor: 'color-mix(in srgb, var(--portal-cta) 35%, var(--border))',
              background: 'color-mix(in srgb, var(--portal-cta) 5%, var(--surface))',
            }}
            data-menu-panel="products"
            data-nav-controls="mega-source"
            data-mega-edit="products"
            data-mega-menu-section="1"
          >
            <div className="flex items-start gap-2">
              <span
                className="shrink-0 mt-0.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide text-white"
                style={{ background: 'var(--portal-cta)' }}
              >
                {isAr ? 'القائمة الكبرى' : 'Mega Menu'}
              </span>
              <div className="min-w-0 space-y-0.5">
                <h4 className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                  {isAr
                    ? 'محتوى القائمة الكبرى — منتجات وصور ونصوص وأزرار'
                    : 'Mega menu content — products, images, text & buttons'}
                </h4>
                <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'هذا القسم فقط للقائمة المنسدلة عند التمرير على المكائن / المطاحن / العروض. غيّر هنا — المعاينة تتحدّث مباشرة. احفظ للنشر على الموقع.'
                    : 'This section only controls the dropdown on Machines / Mills / Offers hover. Edit here — preview updates live. Save to publish to the storefront.'}
                </p>
              </div>
            </div>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-slate-400">
                {isAr ? 'مصدر المنتجات' : 'Product source'}
              </span>
              <select
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                value={headerSettings.navigation.menuProductSource || 'category'}
                onChange={(e) =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    navigation: {
                      ...p.navigation,
                      menuProductSource: e.target.value as 'category' | 'latest' | 'manual',
                    },
                  }))
                }
                data-menu-product-source
              >
                <option value="category">{isAr ? 'من الفئة النشطة' : 'Active category'}</option>
                <option value="latest">{isAr ? 'الأحدث' : 'Latest'}</option>
                <option value="manual">{isAr ? 'يدوي — اختيار من الكتالوج' : 'Manual — pick from catalog'}</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-slate-400">
                {isAr ? 'الترتيب' : 'Sort by'}
              </span>
              <select
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                value={headerSettings.navigation.menuProductSort || 'newest'}
                onChange={(e) =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    navigation: {
                      ...p.navigation,
                      menuProductSort: e.target.value as 'manual' | 'price' | 'newest' | 'bestselling',
                    },
                  }))
                }
              >
                <option value="newest">{isAr ? 'الأحدث' : 'Newest'}</option>
                <option value="price">{isAr ? 'السعر' : 'Price'}</option>
                <option value="bestselling">{isAr ? 'الأكثر مبيعاً' : 'Best selling'}</option>
                <option value="manual">{isAr ? 'يدوي' : 'Manual'}</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-slate-400">
                {isAr ? 'عدد المنتجات المعروضة' : 'Products to display'}
              </span>
              <input
                type="number"
                min={1}
                max={12}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                value={headerSettings.navigation.menuMaxProducts ?? 5}
                onChange={(e) =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    navigation: {
                      ...p.navigation,
                      menuMaxProducts: Math.max(1, Math.min(12, Number(e.target.value) || 5)),
                    },
                  }))
                }
                data-menu-max-products
              />
            </label>

            {(headerSettings.navigation.menuProductSource || 'category') === 'manual' ? (
              <div className="space-y-2 rounded-xl border border-slate-100 dark:border-slate-800 p-3" data-mega-picker="manual">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                    {isAr
                      ? `المحدد (${megaIds.length}/${megaMax})`
                      : `Selected (${megaIds.length}/${megaMax})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMegaPickOpen((v) => !v)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    style={{
                      background: 'color-mix(in srgb, var(--portal-cta) 12%, var(--surface))',
                      color: 'var(--portal-cta)',
                    }}
                    data-mega-add-products
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isAr ? 'إضافة منتجات' : 'Add products'}
                  </button>
                </div>

                {megaIds.length === 0 ? (
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'لا منتجات محددة — اختر من كتالوج هذا المتجر.'
                      : 'No products selected — pick from this store catalog.'}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {megaIds.map((id) => {
                      const cat = storeCatalog.find((p) => p.id === id);
                      const ov = megaOverrides[id] || {};
                      const title =
                        (isAr ? ov.nameAr || cat?.nameAr || cat?.name : ov.nameEn || cat?.name) ||
                        id;
                      const thumb = ov.image || cat?.image || '';
                      const editing = megaEditId === id;
                      return (
                        <div
                          key={id}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-850 p-2 space-y-2"
                          data-mega-product-row={id}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {thumb ? (
                                <img src={thumb} alt="" className="max-w-full max-h-full object-contain" />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <span className="flex-1 text-[11px] font-bold truncate" style={{ color: 'var(--text)' }}>
                              {title}
                            </span>
                            <button
                              type="button"
                              className="p-1 rounded-lg text-slate-500 hover:text-[color:var(--accent)] cursor-pointer"
                              onClick={() => setMegaEditId(editing ? null : id)}
                              title={isAr ? 'تعديل الصورة والنص' : 'Edit image & text'}
                              data-mega-edit-row={id}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              className="p-1 rounded-lg text-rose-500 cursor-pointer"
                              onClick={() => {
                                patchMegaIds(megaIds.filter((x) => x !== id));
                                if (megaEditId === id) setMegaEditId(null);
                              }}
                              aria-label={isAr ? 'حذف' : 'Remove'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {editing ? (
                            <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                              <MediaUploadField
                                label={isAr ? 'صورة القائمة الكبرى' : 'Mega menu image'}
                                value={ov.image || cat?.image || ''}
                                onChange={(url) => patchMegaOverride(id, { image: url })}
                                aspectRatio="square"
                                initialFolder="products"
                                recommendedSize="800 × 800 px"
                              />
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <label className="block space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {isAr ? 'العنوان إنجليزي' : 'Title EN'}
                                  </span>
                                  <input
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                    dir="ltr"
                                    value={ov.nameEn ?? cat?.name ?? ''}
                                    onChange={(e) => patchMegaOverride(id, { nameEn: e.target.value })}
                                  />
                                </label>
                                <label className="block space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {isAr ? 'العنوان عربي' : 'Title AR'}
                                  </span>
                                  <input
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                    dir="rtl"
                                    value={ov.nameAr ?? cat?.nameAr ?? ''}
                                    onChange={(e) => patchMegaOverride(id, { nameAr: e.target.value })}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}

                {megaPickOpen ? (
                  <div
                    className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 space-y-2 bg-white dark:bg-slate-900"
                    data-mega-catalog-picker
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        value={megaSearch}
                        onChange={(e) => setMegaSearch(e.target.value)}
                        placeholder={isAr ? 'بحث في الكتالوج…' : 'Search catalog…'}
                        dir={isAr ? 'rtl' : 'ltr'}
                      />
                      <button
                        type="button"
                        className="p-1 text-slate-400 cursor-pointer"
                        onClick={() => setMegaPickOpen(false)}
                        aria-label={isAr ? 'إغلاق' : 'Close'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {!storeCatalog.length ? (
                        <p className="text-[10px] px-1" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'لا منتجات في الكتالوج' : 'No products in catalog'}
                        </p>
                      ) : (
                        storeCatalog
                          .filter((p) => {
                            const q = megaSearch.trim().toLowerCase();
                            if (!q) return true;
                            return `${p.name} ${p.nameAr || ''} ${p.id}`.toLowerCase().includes(q);
                          })
                          .map((p) => {
                            const selected = megaIds.includes(p.id);
                            const full = megaIds.length >= megaMax;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={selected || full}
                                className="w-full text-start rounded-lg border px-2 py-1.5 text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-2"
                                style={{ borderColor: 'var(--border)' }}
                                onClick={() => {
                                  if (selected || full) return;
                                  patchMegaIds([...megaIds, p.id]);
                                }}
                              >
                                <span className="w-8 h-8 rounded-md bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                  {p.image ? (
                                    <img src={p.image} alt="" className="max-w-full max-h-full object-contain" />
                                  ) : (
                                    <ShoppingBag className="w-3.5 h-3.5 text-slate-300" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="font-bold block truncate">
                                    {isAr ? p.nameAr || p.name : p.name}
                                  </span>
                                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                                    {selected
                                      ? isAr
                                        ? 'محدد'
                                        : 'Selected'
                                      : full
                                        ? isAr
                                          ? 'الحد الأقصى'
                                          : 'Limit reached'
                                        : p.id}
                                  </span>
                                </span>
                              </button>
                            );
                          })
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-[10px] rounded-lg border border-dashed border-slate-200 px-2 py-2" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'لتغيير الصور والنصوص يدوياً: اختر المصدر «يدوي» ثم أضف منتجات وعدّل كل صف.'
                  : 'To change images & titles: set source to Manual, add products, then edit each row.'}
              </p>
            )}

            <p className="text-[10px] text-slate-400">
              {isAr
                ? 'المصدر من كتالوج هذا المتجر فقط — بدون صفوف وهمية.'
                : 'Source is this store catalog only — no fake rows.'}
            </p>
          </div>

          <div
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs"
            data-menu-panel="devices"
            data-nav-controls="menu-devices"
          >
            <h4 className="text-xs font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'تخطيط حسب الجهاز' : 'Layout by device'}
            </h4>
            {(['desktop', 'tablet', 'mobile'] as const).map((device) => {
              const row = headerSettings.navigation.deviceLayouts?.[device] || {};
              const patchDevice = (patch: Partial<typeof row>) =>
                patchHeaderSettings((p) => ({
                  ...p,
                  navigation: {
                    ...p.navigation,
                    deviceLayouts: {
                      ...(p.navigation.deviceLayouts || {}),
                      [device]: { ...(p.navigation.deviceLayouts?.[device] || {}), ...patch },
                    },
                  },
                }));
              const deviceLabel =
                device === 'desktop'
                  ? isAr
                    ? 'سطح المكتب'
                    : 'Desktop'
                  : device === 'tablet'
                    ? isAr
                      ? 'جهاز لوحي'
                      : 'Tablet'
                    : isAr
                      ? 'الجوال'
                      : 'Mobile';
              return (
                <div
                  key={device}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 space-y-2"
                  data-menu-device={device}
                >
                  <span className="text-[11px] font-bold text-slate-600">{deviceLabel}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">{isAr ? 'التخطيط' : 'Layout'}</span>
                      <select
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        value={row.layout || 'grid'}
                        onChange={(e) =>
                          patchDevice({ layout: e.target.value as 'horizontal' | 'grid' })
                        }
                      >
                        <option value="grid">{isAr ? 'شبكة' : 'Grid'}</option>
                        <option value="horizontal">{isAr ? 'تمرير أفقي' : 'Horizontal scroll'}</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">{isAr ? 'الأعمدة' : 'Columns'}</span>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        value={row.columns ?? (device === 'desktop' ? 5 : device === 'tablet' ? 3 : 2)}
                        onChange={(e) =>
                          patchDevice({ columns: Math.max(1, Math.min(6, Number(e.target.value) || 2)) })
                        }
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-600">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.showCategoryTabs !== false}
                        onChange={(e) => patchDevice({ showCategoryTabs: e.target.checked })}
                        className="accent-[var(--portal-cta)]"
                      />
                      {isAr ? 'تبويبات الفئات' : 'Category tabs'}
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.showCompareButton !== false}
                        onChange={(e) => patchDevice({ showCompareButton: e.target.checked })}
                        className="accent-[var(--portal-cta)]"
                      />
                      {isAr ? 'زر المقارنة' : 'Compare'}
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {coffee ? (
            <div
              className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden"
              data-nav-override="advanced"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-start cursor-pointer"
                onClick={() => setDesktopOverrideOpen((v) => !v)}
                aria-expanded={desktopOverrideOpen}
              >
                <div className="min-w-0">
                  <span className="text-[11px] font-bold block" style={{ color: 'var(--text)' }}>
                    {isAr ? 'متقدم — استبدال روابط القائمة' : 'Advanced — replace menu links'}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'اترك روابط سطح المكتب فارغة لتبقى القائمة الكبرى (مكائن / مطاحن…). أي رابط هنا يستبدل القائمة الكبرى.'
                      : 'Keep Desktop links empty to keep the HiBrew mega menu (Machines / Mills…). Any link here replaces the mega menu.'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform ${desktopOverrideOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--muted)' }}
                />
              </button>
              {desktopOverrideOpen ||
              (headerSettings.navigation.desktopLinks || []).length > 0 ||
              (headerSettings.navigation.tabletLinks || []).length > 0 ||
              (headerSettings.navigation.mobileLinks || []).length > 0 ? (
                <div className="px-3.5 pb-3.5 space-y-3 border-t border-amber-200/60 dark:border-amber-900/30 pt-3">
                  <HeaderNavListEditor
                    isAr={isAr}
                    title={isAr ? 'روابط سطح المكتب' : 'Desktop links'}
                    testId="desktop"
                    links={headerSettings.navigation.desktopLinks ?? []}
                    onChange={(links) =>
                      patchHeaderSettings((p) => ({
                        ...p,
                        navigation: { ...p.navigation, desktopLinks: links, links },
                      }))
                    }
                  />
                  <HeaderNavListEditor
                    isAr={isAr}
                    title={isAr ? 'روابط الجهاز اللوحي' : 'Tablet links'}
                    testId="tablet"
                    links={headerSettings.navigation.tabletLinks ?? []}
                    onChange={(links) =>
                      patchHeaderSettings((p) => ({
                        ...p,
                        navigation: { ...p.navigation, tabletLinks: links },
                      }))
                    }
                  />
                  <HeaderNavListEditor
                    isAr={isAr}
                    title={isAr ? 'روابط الجوال' : 'Mobile links'}
                    testId="mobile"
                    links={headerSettings.navigation.mobileLinks ?? []}
                    onChange={(links) =>
                      patchHeaderSettings((p) => ({
                        ...p,
                        navigation: { ...p.navigation, mobileLinks: links },
                      }))
                    }
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <HeaderNavListEditor
                isAr={isAr}
                title={isAr ? 'روابط سطح المكتب' : 'Desktop links'}
                testId="desktop"
                links={
                  headerSettings.navigation.desktopLinks ?? headerSettings.navigation.links
                }
                onChange={(links) =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    navigation: { ...p.navigation, desktopLinks: links, links },
                  }))
                }
              />
              <HeaderNavListEditor
                isAr={isAr}
                title={isAr ? 'روابط الجهاز اللوحي' : 'Tablet links'}
                testId="tablet"
                links={headerSettings.navigation.tabletLinks ?? []}
                onChange={(links) =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    navigation: { ...p.navigation, tabletLinks: links },
                  }))
                }
              />
              <HeaderNavListEditor
                isAr={isAr}
                title={isAr ? 'روابط الجوال' : 'Mobile links'}
                testId="mobile"
                links={headerSettings.navigation.mobileLinks ?? []}
                onChange={(links) =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    navigation: { ...p.navigation, mobileLinks: links },
                  }))
                }
              />
            </>
          )}
        </div>
      )}

      {/* ─── TAB 4: TOP ANNOUNCEMENT BAR ─── */}
      {activeSubTab === 'announcement' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-200 shadow-2xs text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold">{isAr ? 'تفعيل شريط الإعلانات العلوي' : 'Enable Announcement Bar'}</h4>
              <p className="text-[10px] text-slate-400">{isAr ? 'شريط ترويجي متحرك أعلى الصفحة' : 'Top marquee with promotions & offers'}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                patchHeaderSettings((p) => ({
                  ...p,
                  announcement: { ...p.announcement, enabled: !p.announcement.enabled },
                }))
              }
              className={toggleTrack(headerSettings.announcement.enabled)}
              aria-label={isAr ? 'تبديل الإعلان' : 'Toggle announcement'}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {headerSettings.announcement.enabled && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون الخلفية' : 'Background Color'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={headerSettings.announcement.bgColor || '#0d0704'}
                      onChange={(e) =>
                        patchHeaderSettings((p) => ({
                          ...p,
                          announcement: { ...p.announcement, bgColor: e.target.value },
                        }))
                      }
                      className="w-7 h-7 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={headerSettings.announcement.bgColor || '#0d0704'}
                      onChange={(e) =>
                        patchHeaderSettings((p) => ({
                          ...p,
                          announcement: { ...p.announcement, bgColor: e.target.value },
                        }))
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون النص' : 'Text Color'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={headerSettings.announcement.textColor || '#ffffff'}
                      onChange={(e) =>
                        patchHeaderSettings((p) => ({
                          ...p,
                          announcement: { ...p.announcement, textColor: e.target.value },
                        }))
                      }
                      className="w-7 h-7 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={headerSettings.announcement.textColor || '#ffffff'}
                      onChange={(e) =>
                        patchHeaderSettings((p) => ({
                          ...p,
                          announcement: { ...p.announcement, textColor: e.target.value },
                        }))
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{isAr ? 'الرسائل الترويجية' : 'Promo Messages'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newMsg: HeaderAnnouncementMessage = {
                        id: `msg-${Date.now()}`,
                        icon: 'Sparkles',
                        textAr: 'رسالة ترويجية جديدة',
                        textEn: 'New Promotion Message',
                        active: true,
                      };
                      patchHeaderSettings((p) => ({
                        ...p,
                        announcement: {
                          ...p.announcement,
                          messages: [...p.announcement.messages, newMsg],
                        },
                      }));
                    }}
                    className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    {isAr ? '+ إضافة رسالة' : '+ Add Message'}
                  </button>
                </div>

                {headerSettings.announcement.messages.map((msg, mIdx) => (
                  <div key={msg.id} className="p-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={msg.textAr}
                        onChange={(e) => {
                          const copy = [...headerSettings.announcement.messages];
                          copy[mIdx] = { ...copy[mIdx], textAr: e.target.value };
                          patchHeaderSettings((p) => ({ ...p, announcement: { ...p.announcement, messages: copy } }));
                        }}
                        className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = headerSettings.announcement.messages.filter((_, i) => i !== mIdx);
                          patchHeaderSettings((p) => ({ ...p, announcement: { ...p.announcement, messages: filtered } }));
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: HEADER STYLING ─── */}
      {activeSubTab === 'style' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-200 shadow-2xs text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold">{isAr ? 'تثبيت الهيدر أثناء التمرير' : 'Keep the header fixed while scrolling'}</span>
            <button
              type="button"
              onClick={() =>
                patchHeaderSettings((p) => ({
                  ...p,
                  general: { ...p.general, sticky: !p.general.sticky },
                }))
              }
              className={toggleTrack(headerSettings.general.sticky)}
              aria-label={isAr ? 'تبديل التثبيت' : 'Toggle fixed header'}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold">{isAr ? 'خلفية شفافة ضبابية' : 'Frosted header background'}</span>
            <button
              type="button"
              onClick={() =>
                patchHeaderSettings((p) => ({
                  ...p,
                  general: { ...p.general, backdropBlur: !p.general.backdropBlur },
                }))
              }
              className={toggleTrack(headerSettings.general.backdropBlur)}
              aria-label={isAr ? 'تبديل الخلفية الضبابية' : 'Toggle frosted background'}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون خلفية الهيدر' : 'Header Bg Color'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={headerSettings.general.bgColor || '#ffffff'}
                  onChange={(e) =>
                    patchHeaderSettings((p) => ({
                      ...p,
                      general: { ...p.general, bgColor: e.target.value },
                    }))
                  }
                  className="w-7 h-7 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={headerSettings.general.bgColor || '#ffffff'}
                  onChange={(e) =>
                    patchHeaderSettings((p) => ({
                      ...p,
                      general: { ...p.general, bgColor: e.target.value },
                    }))
                  }
                  className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'الحشوة العمودية' : 'Vertical padding'}</label>
              <input
                type="number"
                min="4"
                max="30"
                value={headerSettings.general.paddingY || 10}
                onChange={(e) =>
                  patchHeaderSettings((p) => ({
                    ...p,
                    general: { ...p.general, paddingY: Number(e.target.value) },
                  }))
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save & Reset Actions Bar */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'استرجاع الافتراضي' : 'Reset'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="unity-btn-primary px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
        >
          {savedFlash ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Save className="w-4 h-4" />}
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'تطبيق وحفظ الهيدر' : 'Save Header')}</span>
        </button>
      </div>
    </div>
  );
};
