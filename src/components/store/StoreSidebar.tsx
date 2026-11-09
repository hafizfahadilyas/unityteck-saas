import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { labelForNav, STORE_NAV_KEYS } from '../../i18n/nav';
import { SaudiSidebarFooter } from '../common/SaudiSidebarFooter';
import { usePermissions } from '../../hooks/usePermissions';
import { planAllowsStoreTab } from '../../auth/plans';
import { isStoreTabComingSoon } from '../../config/storeTabVisibility';
import { resolveSubscription } from '../../auth/subscriptions';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import { CORE_STORE_CONTROL_IDS, isStoreControlEnabled } from '../../services/storeControlService';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Megaphone,
  Boxes,
  Truck,
  CreditCard,
  Settings,
  ArrowLeft,
  Globe,
  Tag,
  Palette,
  Search,
  Store,
  FolderTree,
  ShoppingBag,
  Server,
  Award,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  FileText,
  Image as ImageIcon,
  Archive,
  Bell,
  ReceiptText,
  Files,
  BookOpen,
  Sparkles,
  Headphones,
  Paintbrush,
  X,
} from 'lucide-react';
import { useNotifications } from '../../notification-system';
import { WhatsAppBrandIcon } from '../common/BrandIcons';
import { SouqEMakkahLogo, SouqEMakkahMark } from '../common/SouqEMakkahLogo';
import { bindStoreChrome, clearStoreChrome, currentChromeRevision, loadStoreChrome, readChromeCache } from '../../i18n/storeChrome';
import { applyBrandCss } from '../../i18n/branding';
import { readPrefs } from '../../i18n/prefs';

interface StoreSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/**
 * S2 — Store Sidebar: same Holst density as Master (docs/21 paired).
 * Store brand label · canTab + plan · Saudi footer (S1b).
 * Desktop: collapse rail · Mobile: off-canvas drawer.
 */
export const StoreSidebar: React.FC<StoreSidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen = false,
  onMobileClose,
}) => {
  const { activeStore, switchToMaster, canAccessMaster } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { canTab } = usePermissions();
  const { unreadCounts } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);

  const selectTab = (tab: string) => {
    onSelectTab(tab);
    onMobileClose?.();
  };

  useEffect(() => {
    if (mobileOpen) setCollapsed(false);
  }, [mobileOpen]);

  useEffect(() => {
    let stop = false;
    const cached = readChromeCache(activeStore.id);
    bindStoreChrome(activeStore.id, cached);
    const seen = currentChromeRevision();
    void loadStoreChrome(activeStore.id).then((next) => {
      if (stop || currentChromeRevision() !== seen) return;
      bindStoreChrome(activeStore.id, next);
    });
    return () => {
      stop = true;
      clearStoreChrome();
      const prefs = readPrefs();
      applyBrandCss(prefs.brand, prefs.locale);
    };
  }, [activeStore.id]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [controlsEpoch, setControlsEpoch] = useState(0);

  useEffect(() => {
    const handleControlsChanged = () => setControlsEpoch((v) => v + 1);
    window.addEventListener('unityteck-store-controls-changed', handleControlsChanged);
    return () => {
      window.removeEventListener('unityteck-store-controls-changed', handleControlsChanged);
    };
  }, []);

  /** Deep-link into Store Settings (Search Console lives under Settings, not SEO). */
  const openSettingsView = (view: 'search_console' | 'tag_manager') => {
    try {
      sessionStorage.setItem('unityteck-settings-view', view);
    } catch {
      /* storage may be unavailable */
    }
    selectTab('settings');
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('unityteck-settings-view', { detail: view }));
    }, 60);
  };

  /** Deep-link into StoreShipping internal sub-tabs */
  const openShippingView = (view: 'shipments' | 'labels' | 'zones' | 'returns' | 'carriers' | 'methods') => {
    try {
      sessionStorage.setItem('unityteck-shipping-view', view);
    } catch {
      /* storage may be unavailable */
    }
    selectTab('shipping');
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('unityteck-shipping-view', { detail: view }));
    }, 60);
  };

  const isProductsFamily = ['products', 'categories', 'brands', 'media'].includes(currentTab);
  const isThemesFamily = ['themes', 'appstore'].includes(currentTab);
  const isMarketingFamily = [
    'marketing',
    'coupons',
    'abandoned-carts',
    'promotions',
    'cart-offers',
    'bank-offers',
    'cashback',
    'gifting',
    'loyalty',
    'repurchase-reminders',
    'campaigns',
    'affiliate',
    'direct-orders',
    'social',
  ].includes(currentTab);

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    products: true,
    themes: isThemesFamily,
    marketing: isMarketingFamily,
    whatsapp: currentTab === 'whatsapp',
    shipping: currentTab === 'shipping',
    settings: currentTab === 'settings',
  });

  useEffect(() => {
    if (isProductsFamily) {
      setOpenSubmenus((prev) => ({ ...prev, products: true }));
    }
    if (isThemesFamily) {
      setOpenSubmenus((prev) => ({ ...prev, themes: true }));
    }
    if (isMarketingFamily) {
      setOpenSubmenus((prev) => ({ ...prev, marketing: true }));
    }
    if (currentTab === 'whatsapp') {
      setOpenSubmenus((prev) => ({ ...prev, whatsapp: true }));
    }
    if (currentTab === 'shipping') {
      setOpenSubmenus((prev) => ({ ...prev, shipping: true }));
    }
    if (currentTab === 'settings') {
      setOpenSubmenus((prev) => ({ ...prev, settings: true }));
    }
  }, [isProductsFamily, isThemesFamily, isMarketingFamily, currentTab]);

  const navItems = useMemo(() => {
    const all = [
      { id: 'dashboard', icon: LayoutDashboard },
      { id: 'orders', icon: ShoppingCart },
      { id: 'canva', icon: Paintbrush },
      { id: 'ai-media', icon: Sparkles },
      { id: 'products', icon: Package },
      { id: 'customers', icon: Users },
      { id: 'marketing', icon: Megaphone },
      { id: 'analytics', icon: BarChart3 },
      { id: 'reports', icon: FileText },
      { id: 'invoices', icon: ReceiptText },
      { id: 'notifications', icon: Bell, badge: unreadCounts.total },
      { id: 'whatsapp', icon: WhatsAppBrandIcon },
      { id: 'seo', icon: Search },
      { id: 'shipping', icon: Truck },
      { id: 'payments', icon: CreditCard },
      { id: 'themes', icon: Palette },
      { id: 'pages', icon: Files },
      { id: 'blog', icon: BookOpen },
      { id: 'commerce-tools', icon: Sparkles },
      { id: 'hosting', icon: Server },
      { id: 'backup', icon: Archive },
      { id: 'appstore', icon: ShoppingBag },
      { id: 'settings', icon: Settings },
    ];
    // Coming-soon tabs stay visible in sidebar; click opens Coming Soon content.
    return all.filter(
      (item) =>
        canTab(item.id, 'store') &&
        planAllowsStoreTab(activeStore, item.id) &&
        (CORE_STORE_CONTROL_IDS.has(item.id) ||
          isStoreControlEnabled(activeStore?.id, item.id) ||
          isStoreTabComingSoon(item.id)),
    );
  }, [canTab, activeStore, unreadCounts.total, controlsEpoch]);

  const sub = resolveSubscription(activeStore.id);

  return (
    <>
    {mobileOpen ? (
      <button
        type="button"
        className="unity-mobile-nav-backdrop lg:hidden"
        aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
        onClick={onMobileClose}
      />
    ) : null}
    <aside
      className="unity-aside flex flex-col shrink-0 select-none border-e transition-[width] duration-200 max-lg:pointer-events-auto"
      style={{
        width: collapsed ? '3.5rem' : '16rem',
        borderColor: 'var(--portal-800)',
        fontFamily: 'var(--font-ui)',
        overflow: 'hidden',
      }}
      data-chrome="store-sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
      data-mobile-drawer="true"
      data-mobile-open={mobileOpen ? 'true' : 'false'}
    >
      {/* Header: store logo (coffee/flowers) + brand text + toggle */}
      <div
        className="h-16 px-3 flex items-center gap-2 border-b shrink-0"
        style={{ borderColor: 'var(--portal-800)' }}
      >
        <div className="unity-icon-box w-9 h-9 flex items-center justify-center shadow-md shrink-0 overflow-hidden p-0.5 rounded-full">
          <img
            src={activeStore?.logo || '/favicon.svg'}
            alt=""
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.dataset.fallback === '1') {
                el.style.display = 'none';
                const sibling = el.nextElementSibling as HTMLElement | null;
                if (sibling) sibling.classList.remove('hidden');
                return;
              }
              el.dataset.fallback = '1';
              el.src = '/favicon.svg';
            }}
          />
          <Store className="w-5 h-5 hidden" aria-hidden />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold text-[15px] text-white tracking-tight leading-tight truncate">
              {getStoreDisplayName(activeStore, isAr ? 'ar' : 'en')}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[9px] font-medium" style={{ color: 'var(--portal-400)' }}>
                {t('storeAdmin')}
              </span>
              <span
                className="text-[8px] px-1.5 py-0.5 rounded uppercase font-medium"
                style={{
                  background: 'color-mix(in srgb, var(--portal-800) 80%, transparent)',
                  color: 'var(--portal-200)',
                }}
              >
                {activeStore.plan === 'premium'
                  ? isAr
                    ? 'مميزة'
                    : 'Premium'
                  : activeStore.plan === 'pro' || activeStore.plan === 'paid'
                    ? isAr
                      ? 'احترافية'
                      : 'Pro'
                    : activeStore.plan === 'custom'
                      ? isAr
                        ? 'مخصصة'
                        : 'Custom'
                      : isAr
                        ? 'مجانية'
                        : 'Free'}
              </span>
              <span
                className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide"
                style={{
                  background:
                    sub.status === 'active' || sub.status === 'trial'
                      ? 'color-mix(in srgb, #34d399 25%, transparent)'
                      : sub.status === 'grace'
                        ? 'color-mix(in srgb, #fbbf24 30%, transparent)'
                        : 'color-mix(in srgb, #f87171 30%, transparent)',
                  color:
                    sub.status === 'active' || sub.status === 'trial'
                      ? '#A7F3D0'
                      : sub.status === 'grace'
                        ? '#FDE68A'
                        : '#FECACA',
                }}
              >
                {sub.status === 'active'
                  ? t('statusActive')
                  : sub.status === 'trial'
                    ? t('statusTrial')
                    : sub.status === 'grace'
                      ? t('statusGrace')
                      : sub.status === 'expired'
                        ? t('statusExpired')
                        : sub.status}
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023.98px)').matches) {
              onMobileClose?.();
              return;
            }
            setCollapsed((v) => !v);
          }}
          className="unity-sidebar-toggle ms-auto"
          aria-label={
            isAr
              ? (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023.98px)').matches
                  ? 'إغلاق القائمة'
                  : collapsed
                    ? 'توسيع الشريط الجانبي'
                    : 'طي الشريط الجانبي')
              : (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023.98px)').matches
                  ? 'Close menu'
                  : collapsed
                    ? 'Expand sidebar'
                    : 'Collapse sidebar')
          }
        >
          <X className="w-4 h-4 lg:hidden" aria-hidden />
          <span className="hidden lg:inline-flex">
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 rtl:rotate-180" aria-hidden />
            ) : (
              <PanelLeftClose className="w-4 h-4 rtl:rotate-180" aria-hidden />
            )}
          </span>
        </button>
      </div>

      {/* Company brand — Souq e Makkah (larger Saudi modern animated logo) */}
      <div
        className={`px-3 py-4 border-b shrink-0 flex items-center ${collapsed ? 'justify-center' : ''}`}
        style={{
          borderColor: 'var(--portal-800)',
          background:
            'linear-gradient(135deg, color-mix(in srgb, #0B3D4A 70%, transparent), color-mix(in srgb, #04222B 85%, transparent))',
        }}
        title={isAr ? 'منصة سوق' : 'Souq Platform'}
      >
        {collapsed ? (
          <SouqEMakkahMark isAr={isAr} />
        ) : (
          <SouqEMakkahLogo isAr={isAr} />
        )}
      </div>

      {!collapsed && canAccessMaster && (
        <div className="px-2.5 pt-2 shrink-0">
          <button
            type="button"
            onClick={switchToMaster}
            className="w-full py-2.5 px-3 rounded-xl text-[12px] font-extrabold flex items-center gap-2 cursor-pointer border shadow-sm transition-all hover:opacity-95 active:scale-95"
            style={{
              background: 'var(--active-bg, #1d8b94)',
              borderColor: 'var(--active-ring, #4fb8b4)',
              color: '#ffffff',
              borderRadius: 'var(--radius-ctrl)',
            }}
          >
            <ArrowLeft className="w-4 h-4 shrink-0 rtl:rotate-180" />
            <span className="truncate">{t('returnToMaster')}</span>
          </button>
        </div>
      )}

      <nav
        className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y py-2 px-1.5 space-y-0.5 custom-sidebar-scroll min-h-0"
        aria-label={t('storeAdmin')}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isProducts = item.id === 'products';
          const isThemes = item.id === 'themes';
          const isMarketing = item.id === 'marketing';
          const isWhatsApp = item.id === 'whatsapp';
          const isShipping = item.id === 'shipping';
          const isSettings = item.id === 'settings';
          const comingSoon = isStoreTabComingSoon(item.id);
          // Coming-soon items stay leaf links (no submenu) so click opens Coming Soon page.
          const hasSubmenu =
            !comingSoon &&
            (isProducts || isThemes || isMarketing || isWhatsApp || isShipping || isSettings);
          const isActive = isProducts
            ? isProductsFamily
            : isThemes
              ? isThemesFamily
              : isMarketing
                ? isMarketingFamily
                : currentTab === item.id;
          const isSubmenuOpen = Boolean(openSubmenus[item.id]);

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  if (hasSubmenu) {
                    if (isActive) {
                      setOpenSubmenus((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                    } else {
                      selectTab(item.id);
                      setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
                    }
                  } else {
                    selectTab(item.id);
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
                title={
                  collapsed
                    ? `${labelForNav(t, STORE_NAV_KEYS, item.id)}${comingSoon ? (isAr ? ' · قريباً' : ' · Coming Soon') : ''}`
                    : undefined
                }
                className={`w-full flex items-center gap-2.5 transition-all cursor-pointer ${
                  collapsed ? 'justify-center px-0' : 'justify-between'
                } ${isActive ? 'unity-nav-active' : 'unity-nav-idle'}`}
                style={{ borderRadius: 'var(--radius-ctrl)' }}
              >
                <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
                  <Icon
                    className="shrink-0"
                    aria-hidden
                    title=""
                    style={{
                      width: 'var(--sidebar-nav-icon-size, 1.125rem)',
                      height: 'var(--sidebar-nav-icon-size, 1.125rem)',
                      color: isActive ? 'var(--active-fg)' : 'var(--sidebar-idle-icon, var(--portal-400))',
                    }}
                    strokeWidth={isActive ? 2.25 : 2}
                  />
                  {!collapsed && (
                    <span className="truncate font-semibold">{labelForNav(t, STORE_NAV_KEYS, item.id)}</span>
                  )}
                </div>
                {!collapsed && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {comingSoon ? (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-400/30 leading-none">
                        {isAr ? 'قريباً' : 'Soon'}
                      </span>
                    ) : null}
                    {!comingSoon && Boolean(item.badge && item.badge > 0) && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white leading-tight">
                        {item.badge! > 9 ? '9+' : item.badge}
                      </span>
                    )}
                    {hasSubmenu ? (
                      <ChevronDown
                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          isSubmenuOpen && isActive ? 'rotate-180 opacity-90' : 'opacity-40'
                        }`}
                        aria-hidden
                      />
                    ) : (
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 opacity-35 rtl:rotate-180 ${isActive ? 'opacity-80' : ''}`}
                        aria-hidden
                      />
                    )}
                  </div>
                )}
              </button>

              {/* Submenu for Products & publish */}
              {isProducts && !collapsed && isSubmenuOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  {[
                    {
                      id: 'products',
                      labelAr: 'جميع المنتجات',
                      labelEn: 'All Products',
                      color: 'bg-blue-400',
                      onClick: () => {
                        selectTab('products');
                        window.dispatchEvent(new CustomEvent('unityteck-product-view', { detail: 'list' }));
                      },
                    },
                    {
                      id: 'media',
                      labelAr: 'مكتبة الوسائط',
                      labelEn: 'Media Library',
                      color: 'bg-cyan-400',
                      onClick: () => selectTab('media'),
                    },
                    {
                      id: 'categories',
                      labelAr: 'التصنيفات',
                      labelEn: 'Categories',
                      color: 'bg-emerald-400',
                      onClick: () => selectTab('categories'),
                    },
                    {
                      id: 'brands',
                      labelAr: 'العلامات التجارية والحقول المخصصة',
                      labelEn: 'Brands & Custom Fields',
                      color: 'bg-purple-400',
                      onClick: () => {
                        selectTab('brands');
                        window.dispatchEvent(new CustomEvent('unityteck-product-view', { detail: 'brands' }));
                      },
                    },
                  ]
                    .filter(
                      (sub) =>
                        canTab(sub.id, 'store') &&
                        planAllowsStoreTab(activeStore, sub.id) &&
                        isStoreControlEnabled(activeStore?.id, sub.id),
                    )
                    .map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={sub.onClick}
                        className={`w-full text-start py-1.5 px-2 rounded-lg text-[11.5px] transition-colors flex items-center gap-2 cursor-pointer ${
                          currentTab === sub.id
                            ? 'font-bold text-white bg-white/15 shadow-xs'
                            : 'font-semibold text-slate-200 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sub.color} shrink-0`} />
                        <span className="truncate">{isAr ? sub.labelAr : sub.labelEn}</span>
                      </button>
                    ))}
                </div>
              )}

              {/* Submenu for Themes — settings + all builder pages (page switch) */}
              {isThemes && !collapsed && isSubmenuOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  <button
                    type="button"
                    onClick={() => selectTab('themes')}
                    className={`w-full text-start py-1 px-2 rounded-lg text-[11px] transition-colors flex items-center gap-2 cursor-pointer ${
                      currentTab === 'themes'
                        ? 'font-bold text-white bg-white/15 shadow-xs'
                        : 'font-semibold text-slate-200 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                    <span>{isAr ? 'الثيمات المثبتة' : 'Installed Themes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTab('appstore')}
                    className={`w-full text-start py-1 px-2 rounded-lg text-[11px] transition-colors flex items-center gap-2 cursor-pointer ${
                      currentTab === 'appstore'
                        ? 'font-bold text-white bg-white/15 shadow-xs'
                        : 'font-semibold text-slate-200 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>{isAr ? 'متجر الثيمات' : 'Theme Marketplace'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        sessionStorage.setItem('unityteck-theme-intent', 'theme-settings');
                      } catch {
                        /* storage may be unavailable */
                      }
                      selectTab('themes');
                      window.setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('unityteck-open-theme-settings'));
                      }, 60);
                    }}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>{isAr ? 'إعدادات الثيم' : 'Theme Settings'}</span>
                  </button>
                  <div className="pt-1 mt-0.5 border-t border-white/10 space-y-0.5">
                    <p className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      {isAr ? 'صفحات المنشئ' : 'Builder Pages'}
                    </p>
                    {[
                      { id: 'home', labelAr: 'الرئيسية', labelEn: 'Home Page', color: 'bg-rose-400' },
                      { id: 'catalog', labelAr: 'الكتالوج', labelEn: 'Catalog', color: 'bg-amber-400' },
                      { id: 'product', labelAr: 'تفاصيل المنتج', labelEn: 'Product Details', color: 'bg-orange-400' },
                      { id: 'cart', labelAr: 'سلة المشتريات', labelEn: 'Cart', color: 'bg-lime-400' },
                      { id: 'checkout', labelAr: 'الدفع', labelEn: 'Checkout', color: 'bg-emerald-400' },
                      { id: 'thankyou', labelAr: 'تأكيد الطلب', labelEn: 'Thank You', color: 'bg-teal-400' },
                      { id: 'crm', labelAr: 'حساب العميل', labelEn: 'Customer Account', color: 'bg-sky-400' },
                      { id: 'about', labelAr: 'من نحن', labelEn: 'About', color: 'bg-blue-400' },
                      { id: 'contact', labelAr: 'اتصل بنا', labelEn: 'Contact', color: 'bg-indigo-400' },
                      { id: 'location', labelAr: 'فروع المتجر', labelEn: 'Store Locator', color: 'bg-violet-400' },
                      { id: 'track-order', labelAr: 'تتبع الطلب', labelEn: 'Track Order', color: 'bg-fuchsia-400' },
                      { id: 'privacy', labelAr: 'سياسة الخصوصية', labelEn: 'Privacy Policy', color: 'bg-pink-400' },
                      { id: 'return', labelAr: 'سياسة الإرجاع', labelEn: 'Return Policy', color: 'bg-slate-400' },
                    ]
                      .filter((page) => isStoreControlEnabled(activeStore?.id, page.id))
                      .map((page) => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => {
                          try {
                            sessionStorage.setItem(
                              'unityteck-theme-intent',
                              JSON.stringify({ type: 'builder', page: page.id }),
                            );
                          } catch {
                            /* storage may be unavailable */
                          }
                          selectTab('themes');
                          window.setTimeout(() => {
                            window.dispatchEvent(
                              new CustomEvent('unityteck-open-visual-builder', {
                                detail: { page: page.id },
                              }),
                            );
                          }, 60);
                        }}
                        className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${page.color} shrink-0`} />
                        <span className="truncate">{isAr ? page.labelAr : page.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submenu for Settings — Search Console lives here (not under SEO) */}
              {isSettings && !collapsed && isSubmenuOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  <button
                    type="button"
                    onClick={() => openSettingsView('search_console')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span>{isAr ? 'أدوات مشرفي المواقع والفهرسة' : 'Search Console & Indexing'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openSettingsView('tag_manager')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span>{isAr ? 'مدير العلامات وتحليلات الزوار' : 'Tag Manager & Analytics'}</span>
                  </button>
                </div>
              )}

              {/* Submenu for Marketing */}
              {isMarketing && !collapsed && isSubmenuOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  {[
                    { id: 'coupons', labelAr: 'كوبونات الخصم', labelEn: 'Discount Coupons', color: 'bg-amber-400' },
                    { id: 'abandoned-carts', labelAr: 'السلات المتروكة', labelEn: 'Abandoned Carts', color: 'bg-rose-400' },
                    { id: 'promotions', labelAr: 'العروض الترويجية', labelEn: 'Special Offers', color: 'bg-purple-400' },
                    { id: 'cart-offers', labelAr: 'عروض السلة', labelEn: 'Cart Offers', color: 'bg-blue-400' },
                    { id: 'bank-offers', labelAr: 'عروض البنوك', labelEn: 'Bank Offers', color: 'bg-cyan-400' },
                    { id: 'cashback', labelAr: 'حملات الكاش باك', labelEn: 'Cashback Campaigns', color: 'bg-emerald-500' },
                    { id: 'gifting', labelAr: 'نظام الإهداء', labelEn: 'Gifting System', color: 'bg-pink-400' },
                    { id: 'loyalty', labelAr: 'برنامج الولاء', labelEn: 'Loyalty Program', color: 'bg-indigo-400' },
                    { id: 'repurchase-reminders', labelAr: 'تذكيرات إعادة الشراء', labelEn: 'Repurchase Reminders', color: 'bg-orange-400' },
                    { id: 'campaigns', labelAr: 'الحملات التسويقية', labelEn: 'Marketing Campaigns', color: 'bg-teal-400' },
                    { id: 'affiliate', labelAr: 'التسويق بالعمولة', labelEn: 'Affiliate Marketing', color: 'bg-yellow-400' },
                    { id: 'direct-orders', labelAr: 'الطلب المباشر', labelEn: 'Direct Orders', color: 'bg-sky-400' },
                    { id: 'social', labelAr: 'النشر الاجتماعي', labelEn: 'Social Publishing', color: 'bg-fuchsia-400' },
                  ]
                    .filter(
                      (sub) =>
                        canTab(sub.id, 'store') &&
                        planAllowsStoreTab(activeStore, sub.id) &&
                        isStoreControlEnabled(activeStore?.id, sub.id),
                    )
                    .map((sub) => {
                    const isSubActive = currentTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => selectTab(sub.id)}
                        className={`w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                          isSubActive
                            ? 'text-white bg-white/20 shadow-xs font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sub.color} shrink-0`} />
                        <span className="truncate">{isAr ? sub.labelAr : sub.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Submenu for WhatsApp */}
              {isWhatsApp && !collapsed && isSubmenuOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  {[
                    { id: 'center', labelAr: 'مركز الرسائل', labelEn: 'Message Center' },
                    { id: 'compose', labelAr: 'إنشاء رسالة', labelEn: 'Compose Message' },
                    { id: 'templates', labelAr: 'القوالب', labelEn: 'Templates' },
                    { id: 'automations', labelAr: 'الأتمتة', labelEn: 'Automations' },
                    { id: 'campaigns', labelAr: 'الحملات', labelEn: 'Campaigns' },
                    { id: 'contacts', labelAr: 'جهات الاتصال والشرائح', labelEn: 'Contacts & Segments' },
                    { id: 'settings', labelAr: 'الإعدادات', labelEn: 'Settings' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        try {
                          sessionStorage.setItem('unityteck-whatsapp-view', sub.id);
                        } catch {
                          /* storage may be unavailable */
                        }
                        selectTab('whatsapp');
                        window.setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('unityteck-whatsapp-view', { detail: sub.id }));
                        }, 60);
                      }}
                      className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate">{isAr ? sub.labelAr : sub.labelEn}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Submenu for Shipping & Logistics */}
              {isShipping && !collapsed && isSubmenuOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  {[
                    { id: 'shipments', labelAr: 'الشحنات والتتبع المباشر', labelEn: 'Shipments & Tracking', color: 'bg-blue-400' },
                    { id: 'labels', labelAr: 'استوديو بوالص الشحن 4×6', labelEn: 'Shipping Labels Studio', color: 'bg-amber-400' },
                    { id: 'zones', labelAr: 'مناطق وأسعار الشحن', labelEn: 'Shipping Zones & Rates', color: 'bg-emerald-400' },
                    { id: 'returns', labelAr: 'المرتجعات والحالات الخاصة', labelEn: 'Returns & Exceptions', color: 'bg-rose-400' },
                    { id: 'carriers', labelAr: 'شركات الشحن المعتمدة', labelEn: 'Courier Integrations', color: 'bg-purple-400' },
                    { id: 'methods', labelAr: 'طرق وخيارات التسليم', labelEn: 'Shipping Methods', color: 'bg-teal-400' },
                  ]
                    .filter((sub) => isStoreControlEnabled(activeStore?.id, sub.id))
                    .map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => openShippingView(sub.id as any)}
                      className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sub.color} shrink-0`} />
                      <span className="truncate">{isAr ? sub.labelAr : sub.labelEn}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Small Compact Side Button replacing large cards */}
      <div
        className="p-2 border-t shrink-0"
        style={{ borderColor: 'var(--portal-800)' }}
      >
        <button
          type="button"
          onClick={() => setIsHelpOpen((v) => !v)}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'
          } rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-all text-xs font-semibold cursor-pointer group shadow-xs`}
          title={isAr ? 'مركز المساعدة والمنصة' : 'Help & Support'}
          aria-expanded={isHelpOpen}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Headphones className="w-3.5 h-3.5" />
            </div>
            {!collapsed && (
              <span className="truncate text-[11px] font-semibold text-slate-200 group-hover:text-white">
                {isAr ? 'المساعدة والدعم' : 'Need Help?'}
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] text-teal-400 font-medium px-1.5 py-0.5 rounded bg-teal-500/10 shrink-0">
              {isHelpOpen ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'مساعدة' : 'Help')}
            </span>
          )}
        </button>
      </div>

      {/* Floating Popover when clicked */}
      {isHelpOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsHelpOpen(false)}
            aria-hidden="true"
          />
          <div
            className={`fixed z-50 bottom-14 max-lg:bottom-[max(3.5rem,env(safe-area-inset-bottom))] ${
              collapsed
                ? isAr
                  ? 'right-16'
                  : 'left-16'
                : isAr
                  ? 'right-3'
                  : 'left-3'
            } w-64 max-w-[calc(100vw-1.5rem)] p-3 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-slate-200`}
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white truncate">
                    {isAr ? 'هل تحتاج مساعدة؟' : 'Need Help?'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isAr ? 'شاهد الدروس أو تواصل مع الدعم' : 'Watch tutorials or contact support'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ms-1"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                selectTab('settings');
                setIsHelpOpen(false);
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/60 text-[11px] font-semibold text-white text-center transition-colors cursor-pointer mb-2.5 shadow-xs"
            >
              {isAr ? 'زيارة مركز المساعدة' : 'Visit Help Center'}
            </button>

            <SaudiSidebarFooter compact />
          </div>
        </>
      )}

      {!collapsed ? <SaudiSidebarFooter /> : null}
    </aside>
    </>
  );
};
