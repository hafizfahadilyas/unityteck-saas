import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { labelForNav, MASTER_NAV_KEYS } from '../../i18n/nav';
import { usePermissions } from '../../hooks/usePermissions';
import { SaudiSidebarFooter } from '../common/SaudiSidebarFooter';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  Search,
  Palette,
  Layers,
  FileText,
  Settings,
  ChevronRight,
  UserPlus,
  Globe,
  GitBranch,
  Boxes,
  Database,
  Archive,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  X,
  Crown,
  Coins,
  Headphones,
  ShieldCheck,
  Bell,
} from 'lucide-react';
import { SouqEMakkahLogo, SouqEMakkahMark } from '../common/SouqEMakkahLogo';

interface MasterSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/**
 * M2 — Master Sidebar (docs/21).
 * Brand · PNG-order nav · Holst active · Saudi footer (shared).
 * Desktop: collapse rail · Mobile: off-canvas drawer.
 */
export const MasterSidebar: React.FC<MasterSidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen = false,
  onMobileClose,
}) => {
  const { stores } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { canTab } = usePermissions();
  const [collapsed, setCollapsed] = useState(false);

  const selectTab = (tab: string) => {
    onSelectTab(tab);
    onMobileClose?.();
  };

  useEffect(() => {
    if (mobileOpen) setCollapsed(false);
  }, [mobileOpen]);

  const navItems = useMemo(() => {
    /** SOUQ PLUS Phase 1 primary sections, then platform ops + authorized oversight. */
    const all = [
      { id: 'dashboard', icon: LayoutDashboard },
      { id: 'accounts', icon: Users },
      { id: 'stores', icon: Store, count: stores.length },
      { id: 'plans', icon: Crown },
      { id: 'services-points', icon: Coins },
      { id: 'integrations', icon: Layers },
      { id: 'support', icon: Headphones },
      { id: 'reports', icon: FileText },
      { id: 'security', icon: ShieldCheck },
      { id: 'notifications', icon: Bell },
      { id: 'settings', icon: Settings },
      { id: 'control-center', icon: SlidersHorizontal },
      { id: 'onboarding', icon: UserPlus },
      { id: 'domains', icon: Globe },
      { id: 'database', icon: Database },
      { id: 'backup', icon: Archive },
      { id: 'updates', icon: GitBranch },
      { id: 'marketplace', icon: Boxes },
      { id: 'products', icon: Package },
      { id: 'orders', icon: ShoppingCart },
      { id: 'seo', icon: Search },
      { id: 'themes', icon: Palette },
    ];
    return all.filter((item) => canTab(item.id, 'master'));
  }, [stores.length, canTab]);

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
        data-chrome="master-sidebar"
        data-collapsed={collapsed ? 'true' : 'false'}
        data-mobile-drawer="true"
        data-mobile-open={mobileOpen ? 'true' : 'false'}
      >
        <div
          className="min-h-[72px] px-3 py-2.5 flex items-center gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--portal-800)' }}
        >
          <div className="flex-1 min-w-0 flex items-center overflow-visible">
            {collapsed ? <SouqEMakkahMark isAr={isAr} /> : <SouqEMakkahLogo isAr={isAr} />}
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023.98px)').matches) {
                onMobileClose?.();
                return;
              }
              setCollapsed((v) => !v);
            }}
            className="unity-sidebar-toggle ms-auto shrink-0"
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

        <nav
          className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y py-2 px-1.5 space-y-0.5 custom-sidebar-scroll min-h-0"
          aria-label={t('masterAdmin')}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? labelForNav(t, MASTER_NAV_KEYS, item.id) : undefined}
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
                    <span className="truncate">{labelForNav(t, MASTER_NAV_KEYS, item.id)}</span>
                  )}
                </div>
                {!collapsed && (
                  item.count !== undefined ? (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 tabular-nums"
                      style={{
                        background: isActive
                          ? 'color-mix(in srgb, #000 22%, transparent)'
                          : 'var(--portal-800)',
                        color: isActive ? 'var(--active-fg)' : 'var(--portal-200)',
                      }}
                    >
                      {item.count}
                    </span>
                  ) : (
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 opacity-35 rtl:rotate-180 ${isActive ? 'opacity-80' : ''}`}
                      aria-hidden
                    />
                  )
                )}
              </button>
            );
          })}
        </nav>

        {!collapsed && <SaudiSidebarFooter />}
      </aside>
    </>
  );
};
