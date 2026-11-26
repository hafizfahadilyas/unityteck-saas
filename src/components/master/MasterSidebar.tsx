import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { labelForNav, MASTER_NAV_KEYS } from '../../i18n/nav';
import { usePermissions } from '../../hooks/usePermissions';
import { SaudiSidebarFooter } from '../common/SaudiSidebarFooter';
import {
  LayoutDashboard,
  Store,
  Users,
  Layers,
  FileText,
  Settings,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Crown,
  Coins,
  Headphones,
  ShieldCheck,
  Bell,
  BookOpen,
  Bot,
  Sparkles,
  ChevronDown,
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
  const navTitle = (id: string) => labelForNav(locale, MASTER_NAV_KEYS, id);
  const { canTab } = usePermissions();
  const [collapsed, setCollapsed] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(true);

  const aiSubMenu = useMemo(
    () => [
      { id: 'ai-providers', labelEn: 'AI Providers', labelAr: 'مزودو الذكاء الاصطناعي' },
      { id: 'gemini-settings', labelEn: 'Gemini API Settings', labelAr: 'إعدادات Gemini API' },
      { id: 'ai-studio', labelEn: 'AI Image Studio', labelAr: 'استوديو الصور بالذكاء الاصطناعي' },
      { id: 'ai-usage', labelEn: 'AI Usage & Credits', labelAr: 'الاستخدام والرصيد' },
      { id: 'merchant-ai-limits', labelEn: 'Merchant AI Limits', labelAr: 'حدود التجار' },
      { id: 'ai-history', labelEn: 'AI Generation History', labelAr: 'سجل التوليد' },
    ],
    []
  );

  const isAiActive = useMemo(() => {
    return (
      currentTab === 'ai-management' ||
      currentTab === 'openai-ai' ||
      aiSubMenu.some((sub) => sub.id === currentTab)
    );
  }, [currentTab, aiSubMenu]);

  const selectTab = (tab: string) => {
    onSelectTab(tab);
    onMobileClose?.();
  };

  useEffect(() => {
    if (mobileOpen) setCollapsed(false);
  }, [mobileOpen]);

  const navItems = useMemo(() => {
    /** SOUQ PLUS Phase 1 — 11 primary sections only (ops via Platform Settings). */
    const phase1 = [
      { id: 'dashboard', icon: LayoutDashboard, showChevron: false },
      { id: 'accounts', icon: Users, showChevron: true },
      { id: 'stores', icon: Store, count: stores.length, showChevron: false },
      { id: 'plans', icon: Crown, showChevron: false },
      { id: 'services-points', icon: Coins, showChevron: false },
      { id: 'integrations', icon: Layers, showChevron: true },
      { id: 'ai-management', icon: Sparkles, showChevron: true, isAiSection: true },
      { id: 'support', icon: Headphones, showChevron: true },
      { id: 'blog', icon: BookOpen, showChevron: false },
      { id: 'reports', icon: FileText, showChevron: true },
      { id: 'security', icon: ShieldCheck, showChevron: true },
      { id: 'notifications', icon: Bell, showChevron: false },
      { id: 'settings', icon: Settings, showChevron: true },
    ];
    return phase1.filter((item) => canTab(item.id, 'master'));
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
          className="relative min-h-[72px] px-3 py-2.5 flex items-center justify-center border-b shrink-0"
          style={{ borderColor: 'var(--portal-800)' }}
          title={isAr ? 'منصة سوق' : 'Souq Platform'}
        >
          {collapsed ? <SouqEMakkahMark isAr={isAr} /> : <SouqEMakkahLogo isAr={isAr} />}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023.98px)').matches) {
                onMobileClose?.();
                return;
              }
              setCollapsed((v) => !v);
            }}
            className="unity-sidebar-toggle absolute end-3 top-1/2 -translate-y-1/2 shrink-0"
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
          data-locale={locale}
          lang={locale}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isAiSection = (item as any).isAiSection;
            const isActive = isAiSection ? isAiActive : currentTab === item.id;

            return (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (isAiSection) {
                      if (collapsed) {
                        setCollapsed(false);
                        setAiExpanded(true);
                        selectTab('gemini-settings');
                      } else {
                        setAiExpanded((v) => !v);
                        if (!isAiActive) {
                          selectTab('gemini-settings');
                        }
                      }
                    } else {
                      selectTab(item.id);
                    }
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? navTitle(item.id) : undefined}
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
                      <span className="truncate" lang={locale}>{navTitle(item.id)}</span>
                    )}
                  </div>
                  {!collapsed && item.count !== undefined ? (
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
                  ) : !collapsed && isAiSection ? (
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 opacity-60 transition-transform duration-200 ${
                        aiExpanded ? '' : '-rotate-90 rtl:rotate-90'
                      }`}
                      aria-hidden
                    />
                  ) : !collapsed && (item as { showChevron?: boolean }).showChevron ? (
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 opacity-35 rtl:rotate-180 ${isActive ? 'opacity-80' : ''}`}
                      aria-hidden
                    />
                  ) : null}
                </button>

                {isAiSection && aiExpanded && !collapsed && (
                  <div className="ps-4 pe-1 py-1 space-y-0.5 border-s-2 border-purple-500/40 ms-5 my-0.5 animate-in fade-in duration-150">
                    {aiSubMenu.map((sub) => {
                      const isSubActive = currentTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => selectTab(sub.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-start cursor-pointer ${
                            isSubActive
                              ? 'bg-purple-600/25 text-purple-200 font-bold border border-purple-500/40 shadow-sm'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                          }`}
                        >
                          <span className="truncate">{isAr ? sub.labelAr : sub.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {!collapsed && <SaudiSidebarFooter />}
      </aside>
    </>
  );
};
