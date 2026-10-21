import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { labelForNav, STORE_NAV_KEYS } from '../../i18n/nav';
import { SaudiSidebarFooter } from '../common/SaudiSidebarFooter';
import { usePermissions } from '../../hooks/usePermissions';
import { planAllowsStoreTab } from '../../auth/plans';
import { resolveSubscription } from '../../auth/subscriptions';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import { isStoreControlEnabled } from '../../services/storeControlService';
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
  MessageCircle,
  Image as ImageIcon,
  Archive,
  Bell,
  ReceiptText,
  Files,
  BookOpen,
  Sparkles,
  Headphones,
  X,
} from 'lucide-react';
import { useNotifications } from '../../notification-system';

interface StoreSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * S2 — Store Sidebar: same Holst density as Master (docs/21 paired).
 * Store brand label · canTab + plan · Saudi footer (S1b).
 * Supports hide/show toggle — collapses to icon-only rail on desktop and full slide-out drawer on mobile.
 */
export const StoreSidebar: React.FC<StoreSidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { activeStore, switchToMaster, canAccessMaster } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { canTab } = usePermissions();
  const { unreadCounts } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [controlsEpoch, setControlsEpoch] = useState(0);

  useEffect(() => {
    const handleControlsChanged = () => setControlsEpoch((v) => v + 1);
    window.addEventListener('unityteck-store-controls-changed', handleControlsChanged);
    return () => {
      window.removeEventListener('unityteck-store-controls-changed', handleControlsChanged);
    };
  }, []);

  /** Deep-link into a StoreSEO internal section (page is lazy, so also persist via sessionStorage). */
  const openSeoView = (view: 'search-console' | 'gtm') => {
    try {
      sessionStorage.setItem('unityteck-seo-view', view);
    } catch {
      /* storage may be unavailable */
    }
    onSelectTab('seo');
    if (onCloseMobile) {
      onCloseMobile();
    }
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('unityteck-seo-view', { detail: view }));
    }, 60);
  };

  /** Deep-link into StoreShipping internal sub-tabs */
  const handleTabPrefetch = (_tab: string) => {
    // Eager prefetch placeholder for smooth tab transitions
  };

  const openShippingView = (view: 'shipments' | 'labels' | 'zones' | 'returns' | 'carriers' | 'methods') => {
    try {
      sessionStorage.setItem('unityteck-shipping-view', view);
    } catch {
      /* storage may be unavailable */
    }
    onSelectTab('shipping');
    if (onCloseMobile) {
      onCloseMobile();
    }
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('unityteck-shipping-view', { detail: view }));
    }, 60);
  };

  const isProductsFamily = ['products', 'categories', 'brands', 'media'].includes(currentTab);
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
  ].includes(currentTab);

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    products: true,
    themes: false,
    seo: false,
    marketing: isMarketingFamily,
    whatsapp: currentTab === 'whatsapp',
    shipping: currentTab === 'shipping',
  });

  useEffect(() => {
    if (isProductsFamily) {
      setOpenSubmenus((prev) => ({ ...prev, products: true }));
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
  }, [isProductsFamily, isMarketingFamily, currentTab]);

  const navItems = useMemo(() => {
    const all = [
      { id: 'dashboard', icon: LayoutDashboard },
      { id: 'orders', icon: ShoppingCart },
      { id: 'products', icon: Package },
      { id: 'customers', icon: Users },
      { id: 'marketing', icon: Megaphone },
      { id: 'analytics', icon: BarChart3 },
      { id: 'reports', icon: FileText },
      { id: 'invoices', icon: ReceiptText },
      { id: 'notifications', icon: Bell, badge: unreadCounts.total },
      { id: 'whatsapp', icon: MessageCircle },
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
    return all.filter(
      (item) =>
        canTab(item.id, 'store') &&
        planAllowsStoreTab(activeStore, item.id) &&
        isStoreControlEnabled(activeStore?.id, item.id),
    );
  }, [canTab, activeStore, unreadCounts.total, controlsEpoch]);

  const sub = resolveSubscription(activeStore.id);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`unity-aside select-none border-e transition-[width,transform] duration-200 ${
          mobileOpen
            ? 'fixed inset-y-0 start-0 z-50 w-72 shadow-2xl flex flex-col'
            : 'hidden lg:flex flex-col shrink-0'
        }`}
        style={{
          width: mobileOpen ? '18rem' : collapsed ? '3.5rem' : '16rem',
          borderColor: 'var(--portal-800)',
          fontFamily: 'var(--font-ui)',
          overflow: 'hidden',
        }}
        data-chrome="store-sidebar"
        data-collapsed={collapsed && !mobileOpen ? 'true' : 'false'}
      >
        {/* Header with store brand + toggle */}
        <div
          className={`h-16 flex items-center border-b shrink-0 ${
            collapsed && !mobileOpen ? 'px-1.5 justify-center' : 'px-3 gap-2'
          }`}
          style={{ borderColor: 'var(--portal-800)' }}
        >
          {collapsed && !mobileOpen ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="unity-sidebar-toggle flex items-center justify-center p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer shadow-xs"
              title={isAr ? 'توسيع الشريط الجانبي' : 'Expand sidebar'}
              aria-label={isAr ? 'توسيع الشريط الجانبي' : 'Expand sidebar'}
            >
              <PanelLeftOpen className="w-5 h-5 text-emerald-400 rtl:rotate-180" aria-hidden />
            </button>
          ) : (
            <>
              <div className="unity-icon-box w-9 h-9 flex items-center justify-center shadow-md shrink-0">
                <Store className="w-5 h-5" aria-hidden />
              </div>
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
                    {activeStore.plan === 'pro'
                      ? t('planPro')
                      : activeStore.plan === 'custom'
                        ? t('planEnterprise')
                        : activeStore.plan === 'free'
                          ? t('planFree')
                          : activeStore.plan}
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

              {/* Toggle / Close Button */}
              {mobileOpen ? (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="lg:hidden p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors ms-auto cursor-pointer"
                  title={isAr ? 'إغلاق القائمة' : 'Close Sidebar'}
                  aria-label={isAr ? 'إغلاق القائمة' : 'Close Sidebar'}
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="unity-sidebar-toggle ms-auto hidden lg:flex"
                  aria-label={isAr ? 'طي الشريط الجانبي' : 'Collapse sidebar'}
                  title={isAr ? 'طي الشريط الجانبي' : 'Collapse sidebar'}
                >
                  <PanelLeftClose className="w-4 h-4 rtl:rotate-180" aria-hidden />
                </button>
              )}
            </>
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
        className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5 custom-sidebar-scroll"
        aria-label={t('storeAdmin')}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isProducts = item.id === 'products';
          const isThemes = item.id === 'themes';
          const isSEO = item.id === 'seo';
          const isMarketing = item.id === 'marketing';
          const isWhatsApp = item.id === 'whatsapp';
          const isShipping = item.id === 'shipping';
          const hasSubmenu = isProducts || isThemes || isSEO || isMarketing || isWhatsApp || isShipping;
          const isActive = isProducts
            ? isProductsFamily
            : isMarketing
              ? isMarketingFamily
              : currentTab === item.id;
          const isSubmenuOpen = Boolean(openSubmenus[item.id]);

          const handleNavClick = (tabId: string) => {
            onSelectTab(tabId);
            if (mobileOpen) {
              onCloseMobile?.();
            }
          };

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  if (hasSubmenu) {
                    if (isActive) {
                      setOpenSubmenus((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                    } else {
                      onSelectTab(item.id);
                      setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
                    }
                  } else {
                    handleNavClick(item.id);
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? labelForNav(t, STORE_NAV_KEYS, item.id) : undefined}
                className={`w-full flex items-center gap-2.5 transition-all cursor-pointer ${
                  collapsed ? 'justify-center px-0' : 'justify-between'
                } ${isActive ? 'unity-nav-active' : 'unity-nav-idle'}`}
                style={{ borderRadius: 'var(--radius-ctrl)' }}
              >
                <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
                  <Icon
                    className="shrink-0"
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
                    {Boolean(item.badge && item.badge > 0) && (
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
                  <button
                    type="button"
                    onMouseEnter={() => handleTabPrefetch('products')}
                    onClick={() => {
                      handleNavClick('products');
                      window.dispatchEvent(new CustomEvent('unityteck-product-view', { detail: 'list' }));
                    }}
                    className={`w-full text-start py-1.5 px-2 rounded-lg text-[11.5px] transition-colors flex items-center gap-2 cursor-pointer ${
                      currentTab === 'products'
                        ? 'font-bold text-white bg-white/15 shadow-xs'
                        : 'font-semibold text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="truncate">{isAr ? 'جميع المنتجات' : 'All Products'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick('media')}
                    className={`w-full text-start py-1.5 px-2 rounded-lg text-[11.5px] transition-colors flex items-center gap-2 cursor-pointer ${
                      currentTab === 'media'
                        ? 'font-bold text-white bg-white/15 shadow-xs'
                        : 'font-semibold text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span className="truncate">{isAr ? 'مكتبة الوسائط' : 'Media Library'}</span>
                  </button>
                  <button
                    type="button"
                    onMouseEnter={() => handleTabPrefetch('categories')}
                    onClick={() => handleNavClick('categories')}
                    className={`w-full text-start py-1.5 px-2 rounded-lg text-[11.5px] transition-colors flex items-center gap-2 cursor-pointer ${
                      currentTab === 'categories'
                        ? 'font-bold text-white bg-white/15 shadow-xs'
                        : 'font-semibold text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{isAr ? 'التصنيفات' : 'Categories'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavClick('brands');
                      window.dispatchEvent(new CustomEvent('unityteck-product-view', { detail: 'brands' }));
                    }}
                    className={`w-full text-start py-1.5 px-2 rounded-lg text-[11.5px] transition-colors flex items-center gap-2 cursor-pointer ${
                      currentTab === 'brands'
                        ? 'font-bold text-white bg-white/15 shadow-xs'
                        : 'font-semibold text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span className="truncate">{isAr ? 'العلامات التجارية والحقول المخصصة' : 'Brands & Custom Fields'}</span>
                  </button>
                </div>
              )}

              {/* Submenu for Themes */}
              {isThemes && !collapsed && isSubmenuOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  <button
                    type="button"
                    onClick={() => handleNavClick('themes')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                    <span>{isAr ? 'الثيمات المثبتة' : 'Installed Themes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick('appstore')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>{isAr ? 'متجر الثيمات' : 'Theme Marketplace'}</span>
                  </button>
                </div>
              )}

              {/* Submenu for SEO */}
              {isSEO && !collapsed && isSubmenuOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  <button
                    type="button"
                    onClick={() => handleNavClick('seo')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span>{isAr ? 'أدوات مشرفي المواقع والفهرسة' : 'Search Console & Indexing'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick('seo')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span>{isAr ? 'مدير العلامات والتحليلات' : 'Google Tag Manager & GA4'}</span>
                  </button>
                </div>
              )}

              {/* Submenu for Marketing */}
              {isMarketing && !collapsed && isSubmenuOpen && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  {[
                    { id: 'marketing', labelAr: 'مركز أدوات التسويق', labelEn: 'Marketing Tools Hub', color: 'bg-emerald-400' },
                    { id: 'coupons', labelAr: 'كوبونات الخصم', labelEn: 'Coupons & Promo Codes', color: 'bg-amber-400' },
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
                  ].map((sub) => {
                    const isSubActive = currentTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleNavClick(sub.id)}
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
              {isWhatsApp && !collapsed && isSubmenuOpen && (
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
                        handleNavClick('whatsapp');
                        window.dispatchEvent(new CustomEvent('unityteck-whatsapp-view', { detail: sub.id }));
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
              {isShipping && !collapsed && isSubmenuOpen && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  {[
                    { id: 'shipments', labelAr: 'الشحنات والتتبع المباشر', labelEn: 'Shipments & Tracking', color: 'bg-blue-400' },
                    { id: 'labels', labelAr: 'استوديو بوالص الشحن 4×6', labelEn: 'Shipping Labels Studio', color: 'bg-amber-400' },
                    { id: 'zones', labelAr: 'مناطق وأسعار الشحن', labelEn: 'Shipping Zones & Rates', color: 'bg-emerald-400' },
                    { id: 'returns', labelAr: 'المرتجعات والحالات الخاصة', labelEn: 'Returns & Exceptions', color: 'bg-rose-400' },
                    { id: 'carriers', labelAr: 'شركات الشحن المعتمدة', labelEn: 'Courier Integrations', color: 'bg-purple-400' },
                    { id: 'methods', labelAr: 'طرق وخيارات التسليم', labelEn: 'Shipping Methods', color: 'bg-teal-400' },
                  ].map((sub) => (
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
            className={`fixed z-50 bottom-14 ${
              collapsed
                ? isAr
                  ? 'right-16'
                  : 'left-16'
                : isAr
                  ? 'right-3'
                  : 'left-3'
            } w-64 p-3 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-slate-200`}
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
                onSelectTab('settings');
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
    </aside>
  </>
);
};
