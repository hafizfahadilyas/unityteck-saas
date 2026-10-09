import React, { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { labelForNav, MASTER_NAV_KEYS } from '../../i18n/nav';
import { usePermissions } from '../../hooks/usePermissions';
import { SaudiSidebarFooter } from '../common/SaudiSidebarFooter';
import {
  LayoutDashboard,
  Store,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Megaphone,
  Percent,
  Ticket,
  Search,
  BookOpen,
  Palette,
  BarChart3,
  CreditCard,
  Layers,
  FileText,
  Settings,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  Globe,
  GitBranch,
  Boxes,
  Database,
  Archive,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface MasterSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

/**
 * M2 — Master Sidebar (docs/21).
 * Brand · PNG-order nav · Holst active · Saudi footer (shared).
 * Supports hide/show toggle — collapses to icon-only rail.
 */
export const MasterSidebar: React.FC<MasterSidebarProps> = ({ currentTab, onSelectTab }) => {
  const { stores } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { canTab } = usePermissions();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = useMemo(() => {
    const all = [
      { id: 'dashboard', icon: LayoutDashboard },
      { id: 'stores', icon: Store, count: stores.length },
      { id: 'onboarding', icon: UserPlus },
      { id: 'domains', icon: Globe },
      { id: 'database', icon: Database },
      { id: 'backup', icon: Archive },
      { id: 'updates', icon: GitBranch },
      { id: 'marketplace', icon: Boxes },
      { id: 'products', icon: Package },
      { id: 'categories', icon: FolderTree },
      { id: 'orders', icon: ShoppingCart },
      { id: 'customers', icon: Users },
      { id: 'marketing', icon: Megaphone },
      { id: 'promotions', icon: Percent },
      { id: 'coupons', icon: Ticket },
      { id: 'seo', icon: Search },
      { id: 'blog', icon: BookOpen },
      { id: 'themes', icon: Palette },
      { id: 'analytics', icon: BarChart3 },
      { id: 'payments', icon: CreditCard },
      { id: 'integrations', icon: Layers },
      { id: 'reports', icon: FileText },
      { id: 'settings', icon: Settings },
    ];
    return all.filter((item) => canTab(item.id, 'master'));
  }, [stores.length, canTab]);

  return (
    <aside
      className="unity-aside flex flex-col shrink-0 select-none border-e transition-[width] duration-200"
      style={{
        width: collapsed ? '3.5rem' : '16rem',
        borderColor: 'var(--portal-800)',
        fontFamily: 'var(--font-ui)',
        overflow: 'hidden',
      }}
      data-chrome="master-sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      {/* Header with brand + toggle */}
      <div
        className="h-16 px-3 flex items-center gap-2 border-b shrink-0"
        style={{ borderColor: 'var(--portal-800)' }}
      >
        <div className="unity-icon-box w-9 h-9 flex items-center justify-center font-black shadow-md shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-[15px] text-white tracking-tight leading-tight truncate">
              {t('brand')}
            </h1>
            <p
              className="text-[9px] font-medium leading-snug mt-0.5 truncate"
              style={{ color: 'var(--portal-400)' }}
            >
              {t('platformTagline')}
            </p>
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

      <nav
        className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5 custom-sidebar-scroll"
        aria-label={t('masterAdmin')}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
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
  );
};
