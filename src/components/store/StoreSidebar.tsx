import React, { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { labelForNav, STORE_NAV_KEYS } from '../../i18n/nav';
import { StoreSwitcher } from '../common/StoreSwitcher';
import { SaudiSidebarFooter } from '../common/SaudiSidebarFooter';
import { usePermissions } from '../../hooks/usePermissions';
import { planAllowsStoreTab } from '../../auth/plans';
import { resolveSubscription } from '../../auth/subscriptions';
import { getStoreDisplayName } from '../../utils/storeLocalization';
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
} from 'lucide-react';

interface StoreSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

/**
 * S2 — Store Sidebar: same Holst density as Master (docs/21 paired).
 * Store brand label · canTab + plan · Saudi footer (S1b).
 * Supports hide/show toggle — collapses to icon-only rail.
 */
export const StoreSidebar: React.FC<StoreSidebarProps> = ({ currentTab, onSelectTab }) => {
  const { activeStore, switchToMaster, canAccessMaster } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { canTab } = usePermissions();
  const [collapsed, setCollapsed] = useState(false);

  /** Deep-link into a StoreSEO internal section (page is lazy, so also persist via sessionStorage). */
  const openSeoView = (view: 'search-console' | 'gtm') => {
    try {
      sessionStorage.setItem('unityteck-seo-view', view);
    } catch {
      /* storage may be unavailable */
    }
    onSelectTab('seo');
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('unityteck-seo-view', { detail: view }));
    }, 60);
  };

  const [productsOpen, setProductsOpen] = useState(true);

  const navItems = useMemo(() => {
    const all = [
      { id: 'dashboard', icon: LayoutDashboard },
      { id: 'storefront', icon: Globe },
      { id: 'orders', icon: ShoppingCart },
      { id: 'products', icon: Package },
      { id: 'media', icon: ImageIcon },
      { id: 'categories', icon: FolderTree },
      { id: 'brands', icon: Award },
      { id: 'customers', icon: Users },
      { id: 'marketing', icon: Megaphone },
      { id: 'analytics', icon: BarChart3 },
      { id: 'reports', icon: FileText },
      { id: 'whatsapp', icon: MessageCircle },
      { id: 'seo', icon: Search },
      { id: 'coupons', icon: Tag },
      { id: 'shipping', icon: Truck },
      { id: 'hosting', icon: Server },
      { id: 'backup', icon: Archive },
      { id: 'themes', icon: Palette },
      { id: 'appstore', icon: ShoppingBag },
      { id: 'payments', icon: CreditCard },
      { id: 'settings', icon: Settings },
    ];
    return all.filter(
      (item) => canTab(item.id, 'store') && planAllowsStoreTab(activeStore, item.id),
    );
  }, [canTab, activeStore]);

  const sub = resolveSubscription(activeStore.id);

  return (
    <aside
      className="unity-aside flex flex-col shrink-0 select-none border-e transition-[width] duration-200"
      style={{
        width: collapsed ? '3.5rem' : '16rem',
        borderColor: 'var(--portal-800)',
        fontFamily: 'var(--font-ui)',
        overflow: 'hidden',
      }}
      data-chrome="store-sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      {/* Header with store brand + toggle */}
      <div
        className="h-16 px-3 flex items-center gap-2 border-b shrink-0"
        style={{ borderColor: 'var(--portal-800)' }}
      >
        <div className="unity-icon-box w-9 h-9 flex items-center justify-center shadow-md shrink-0">
          <Store className="w-5 h-5" aria-hidden />
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
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="unity-sidebar-toggle ms-auto"
          aria-label={
            collapsed
              ? isAr ? 'توسيع الشريط الجانبي' : 'Expand sidebar'
              : isAr ? 'طي الشريط الجانبي' : 'Collapse sidebar'
          }
          title={
            collapsed
              ? isAr ? 'توسيع الشريط الجانبي' : 'Expand sidebar'
              : isAr ? 'طي الشريط الجانبي' : 'Collapse sidebar'
          }
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4 rtl:rotate-180" aria-hidden />
          ) : (
            <PanelLeftClose className="w-4 h-4 rtl:rotate-180" aria-hidden />
          )}
        </button>
      </div>

      {!collapsed && canAccessMaster ? (
        <div className="px-2.5 pt-2 space-y-1.5 shrink-0">
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
          <StoreSwitcher
            variant="compact"
            className="w-full [&>button]:w-full [&>button]:max-w-none"
          />
        </div>
      ) : null}

      <nav
        className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5 custom-sidebar-scroll"
        aria-label={t('storeAdmin')}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isProducts = item.id === 'products';
          const isThemes = item.id === 'themes';
          const isSEO = item.id === 'seo';
          const isMarketing = item.id === 'marketing';
          const hasSubmenu = isProducts || isThemes || isSEO || isMarketing;

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  if (hasSubmenu) {
                    if (currentTab === item.id) {
                      setProductsOpen((v) => !v);
                    } else {
                      onSelectTab(item.id);
                      setProductsOpen(true);
                    }
                  } else {
                    onSelectTab(item.id);
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
                  hasSubmenu ? (
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        productsOpen && isActive ? 'rotate-180 opacity-90' : 'opacity-40'
                      }`}
                      aria-hidden
                    />
                  ) : (
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 opacity-35 rtl:rotate-180 ${isActive ? 'opacity-80' : ''}`}
                      aria-hidden
                    />
                  )
                )}
              </button>

              {/* Submenu for Products */}
              {isProducts && !collapsed && productsOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('unityteck-product-view', { detail: 'list' }));
                    }}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span>{isAr ? 'جميع المنتجات' : 'All Products'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTab('media')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>{isAr ? 'مكتبة الوسائط' : 'Media Library'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTab('categories')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{isAr ? 'التصنيفات' : 'Categories'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('unityteck-product-view', { detail: 'brands' }));
                    }}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span>{isAr ? 'العلامات التجارية والحقول المخصصة' : 'Brands & Custom Fields'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('unityteck-product-view', { detail: 'filters' }));
                    }}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{isAr ? 'الفلاتر والمنتجات المحذوفة' : 'Filters & Deleted Products'}</span>
                  </button>
                </div>
              )}

              {/* Submenu for Themes */}
              {isThemes && !collapsed && productsOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  <button
                    type="button"
                    onClick={() => onSelectTab('themes')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                    <span>{isAr ? 'الثيمات المثبتة' : 'Installed Themes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTab('appstore')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>{isAr ? 'متجر الثيمات' : 'Theme Marketplace'}</span>
                  </button>
                </div>
              )}

              {/* Submenu for SEO */}
              {isSEO && !collapsed && productsOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  <button
                    type="button"
                    onClick={() => onSelectTab('seo')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span>{isAr ? 'أدوات مشرفي المواقع والفهرسة' : 'Search Console & Indexing'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTab('seo')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span>{isAr ? 'مدير العلامات والتحليلات' : 'Google Tag Manager & GA4'}</span>
                  </button>
                </div>
              )}

              {/* Submenu for Marketing */}
              {isMarketing && !collapsed && productsOpen && isActive && (
                <div className="ps-7 pe-1 space-y-0.5 py-1">
                  <button
                    type="button"
                    onClick={() => onSelectTab('marketing')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                    <span>{isAr ? 'مركز أدوات التسويق' : 'Marketing Tools Hub'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTab('coupons')}
                    className="w-full text-start py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-white/15 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{isAr ? 'القسائم والرموز الترويجية' : 'Coupons & Promo Codes'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {!collapsed && <SaudiSidebarFooter />}
    </aside>
  );
};
