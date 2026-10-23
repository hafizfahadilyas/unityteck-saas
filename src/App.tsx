/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useCallback, useEffect, useState, useRef, lazy } from 'react';
import { TenantProvider, useTenant } from './context/TenantContext';
import { MasterSidebar } from './components/master/MasterSidebar';
import { MasterTopBar } from './components/master/MasterTopBar';
import { StoreSidebar } from './components/store/StoreSidebar';
import { StoreTopBar } from './components/store/StoreTopBar';
import { StatusErrorBoundary } from './components/status/StatusErrorBoundary';
import { ToastProvider } from './components/common/ToastProvider';
import { ArchitectureBanner } from './components/common/ArchitectureBanner';
import { PrefsProvider, usePrefs } from './i18n/PrefsContext';
import { useSoftPath } from './hooks/useSoftPath';
import { usePermissions } from './hooks/usePermissions';
import { STORE_TAB_ABILITY, MASTER_TAB_ABILITY } from './auth/modules';
import { readAuthSession, clearAuthSession } from './auth/session';
import type { AuthPortal, AuthSession } from './auth/session';
import { logoutPortal, clearAppCache, loginPortal } from './auth/api';
import {
  isKnownAppPath,
  isStatusPath,
  resolveStatusKind,
} from './status/routes';
import { useToast } from './components/common/ToastProvider';
import { applyPortalHead } from './utils/portalHead';
import { readStoreIdentity } from './themes/settings/storeIdentity';
import { Lock, ShieldAlert } from 'lucide-react';
import { isStoreControlEnabled } from './services/storeControlService';

const MasterDashboard = lazy(() =>
  import('./components/master/MasterDashboard').then((m) => ({ default: m.MasterDashboard })),
);
const CreateStoreModal = lazy(() =>
  import('./components/master/CreateStoreModal').then((m) => ({ default: m.CreateStoreModal })),
);
const StoreDashboard = lazy(() =>
  import('./components/store/StoreDashboard').then((m) => ({ default: m.StoreDashboard })),
);
const PortalLogin = lazy(() =>
  import('./components/auth/PortalLogin').then((m) => ({ default: m.PortalLogin })),
);
const PortalRegister = lazy(() =>
  import('./components/auth/PortalRegister').then((m) => ({ default: m.PortalRegister })),
);
const PortalPasswordReset = lazy(() =>
  import('./components/auth/PortalPasswordReset').then((m) => ({ default: m.PortalPasswordReset })),
);
const PortalGate = lazy(() =>
  import('./components/auth/PortalGate').then((m) => ({ default: m.PortalGate })),
);
const StatusPage = lazy(() =>
  import('./components/status/StatusPage').then((m) => ({ default: m.StatusPage })),
);
// HolstChromeBar retired — unified MasterTopBar / StoreTopBar (docs/21)

/** Heavy tabs — code-split so dashboard/themes open fast */
const MasterStores = lazy(() =>
  import('./components/master/MasterStores').then((m) => ({ default: m.MasterStores })),
);
const MasterControlCenter = lazy(() =>
  import('./components/master/MasterControlCenter').then((m) => ({ default: m.MasterControlCenter })),
);
const MasterOnboarding = lazy(() =>
  import('./components/master/MasterOnboarding').then((m) => ({ default: m.MasterOnboarding })),
);
const MasterDomains = lazy(() =>
  import('./components/master/MasterDomains').then((m) => ({ default: m.MasterDomains })),
);
const MasterUpdates = lazy(() =>
  import('./components/master/MasterUpdates').then((m) => ({ default: m.MasterUpdates })),
);
const MasterThemes = lazy(() =>
  import('./components/master/MasterThemes').then((m) => ({ default: m.MasterThemes })),
);
const MasterMarketplace = lazy(() =>
  import('./components/master/MasterMarketplace').then((m) => ({ default: m.MasterMarketplace })),
);
const MasterSEO = lazy(() =>
  import('./components/master/MasterSEO').then((m) => ({ default: m.MasterSEO })),
);
const MasterDatabase = lazy(() =>
  import('./components/master/MasterDatabase').then((m) => ({ default: m.MasterDatabase })),
);
const MasterGeneralView = lazy(() =>
  import('./components/master/MasterGeneralView').then((m) => ({ default: m.MasterGeneralView })),
);
const MasterOrders = lazy(() =>
  import('./components/master/MasterOrders').then((m) => ({ default: m.MasterOrders })),
);
const MasterProducts = lazy(() =>
  import('./components/master/MasterProducts').then((m) => ({ default: m.MasterProducts })),
);
const StoreCustomers = lazy(() =>
  import('./components/store/StoreCustomers').then((m) => ({ default: m.StoreCustomers })),
);
const StoreMarketingHub = lazy(() =>
  import('./components/store/StoreMarketingHub').then((m) => ({
    default: m.StoreMarketingHub,
  })),
);
const StoreAnalytics = lazy(() =>
  import('./components/store/StoreAnalytics').then((m) => ({ default: m.StoreAnalytics })),
);
const StoreReports = lazy(() =>
  import('./components/store/StoreReports').then((m) => ({ default: m.StoreReports })),
);
const StoreChannelPerformance = lazy(() =>
  import('./components/store/StoreChannelPerformance').then((m) => ({
    default: m.StoreChannelPerformance,
  })),
);
const StoreSEO = lazy(() =>
  import('./components/store/StoreSEO').then((m) => ({ default: m.StoreSEO })),
);
const StoreProducts = lazy(() =>
  import('./components/store/StoreProducts').then((m) => ({ default: m.StoreProducts })),
);
const StoreMediaLibrary = lazy(() =>
  import('./components/store/StoreMediaLibrary').then((m) => ({ default: m.StoreMediaLibrary })),
);
const StoreCategories = lazy(() =>
  import('./components/store/StoreCategories').then((m) => ({ default: m.StoreCategories })),
);
const StoreOrders = lazy(() =>
  import('./components/store/StoreOrders').then((m) => ({ default: m.StoreOrders })),
);
const StoreInvoices = lazy(async () => {
  try {
    return await import('./components/store/invoices/StoreInvoices').then((m) => ({ default: m.StoreInvoices }));
  } catch {
    await new Promise((r) => setTimeout(r, 600));
    return await import('./components/store/invoices/StoreInvoices').then((m) => ({ default: m.StoreInvoices }));
  }
});
const StoreShipping = lazy(() =>
  import('./components/store/StoreShipping').then((m) => ({ default: m.StoreShipping })),
);
const StoreCoupons = lazy(() =>
  import('./components/store/StoreCoupons').then((m) => ({ default: m.StoreCoupons })),
);
const StoreAbandonedCarts = lazy(() =>
  import('./components/store/StoreAbandonedCarts').then((m) => ({ default: m.StoreAbandonedCarts })),
);
const StoreCartOffers = lazy(() =>
  import('./components/store/StoreCartOffers').then((m) => ({ default: m.StoreCartOffers })),
);
const StorePromotionalOffers = lazy(() =>
  import('./components/store/StorePromotionalOffers').then((m) => ({ default: m.StorePromotionalOffers })),
);
const StoreBankOffers = lazy(() =>
  import('./components/store/StoreBankOffers').then((m) => ({ default: m.StoreBankOffers })),
);
const StoreCashback = lazy(() =>
  import('./components/store/StoreCashback').then((m) => ({ default: m.StoreCashback })),
);
const StoreGiftingSystem = lazy(() =>
  import('./components/store/StoreGiftingSystem').then((m) => ({ default: m.StoreGiftingSystem })),
);
const StoreLoyaltyProgram = lazy(() =>
  import('./components/store/StoreLoyaltyProgram').then((m) => ({ default: m.StoreLoyaltyProgram })),
);
const StoreRepurchaseReminders = lazy(() =>
  import('./components/store/StoreRepurchaseReminders').then((m) => ({ default: m.StoreRepurchaseReminders })),
);
const StoreAffiliateMarketing = lazy(() =>
  import('./components/store/StoreAffiliateMarketing').then((m) => ({ default: m.StoreAffiliateMarketing })),
);
const StoreDirectOrders = lazy(() =>
  import('./components/store/StoreDirectOrders').then((m) => ({ default: m.StoreDirectOrders })),
);
const StoreThemes = lazy(() =>
  import('./components/store/StoreThemes').then((m) => ({ default: m.StoreThemes })),
);
const StorePages = lazy(() =>
  import('./components/store/StorePages').then((m) => ({ default: m.StorePages })),
);
const StoreBlogManagement = lazy(() =>
  import('./components/store/blog/StoreBlogManagement').then((m) => ({ default: m.StoreBlogManagement })),
);
const StoreWhatsAppManager = lazy(() =>
  import('./components/store/whatsapp/StoreWhatsAppManager').then((m) => ({ default: m.StoreWhatsAppManager })),
);
const StoreArticleCommerceTools = lazy(() =>
  import('./components/store/blog/StoreArticleCommerceTools').then((m) => ({ default: m.StoreArticleCommerceTools })),
);
const StoreAppStore = lazy(() =>
  import('./components/store/StoreAppStore').then((m) => ({ default: m.StoreAppStore })),
);
const StorePayments = lazy(() =>
  import('./components/store/StorePayments').then((m) => ({ default: m.StorePayments })),
);
const StoreHostingDomain = lazy(() =>
  import('./components/store/StoreHostingDomain').then((m) => ({ default: m.StoreHostingDomain })),
);
const StoreBrandsView = lazy(() =>
  import('./components/store/StoreBrandsView').then((m) => ({ default: m.StoreBrandsView })),
);
const MasterSettings = lazy(() =>
  import('./components/master/MasterSettings').then((m) => ({ default: m.MasterSettings })),
);
const StoreSettings = lazy(() =>
  import('./components/store/StoreSettings').then((m) => ({ default: m.StoreSettings })),
);
const DynamicThemeRenderer = lazy(() =>
  import('./components/storefront/DynamicThemeRenderer').then((m) => ({
    default: m.DynamicThemeRenderer,
  })),
);
const StoreBackupRestoreCenter = lazy(() =>
  import('./components/store/StoreBackupRestoreCenter').then((m) => ({
    default: m.StoreBackupRestoreCenter,
  })),
);
import { preloadVisualThemeBuilder } from './components/store/visualBuilder/preloadVisualBuilder';
import { ThemeBuilderLoadingShell } from './components/store/visualBuilder/ThemeBuilderLoadingShell';

const VisualThemeBuilder = lazy<React.ComponentType<any>>(() =>
  preloadVisualThemeBuilder().then((m: any) => ({
    default: m.VisualThemeBuilder,
  })),
);

const WordPressThemeCustomizer = lazy(() =>
  import('./components/store/themeCustomizer/WordPressThemeCustomizer').then((m) => ({
    default: m.WordPressThemeCustomizer,
  })),
);

import { DashboardLoader } from './components/common/DashboardLoader';
import { readAllThemeSettings } from './themes/settings/themeSettingsStore';
import { DateRangeProvider } from './context/DateRangeContext';
import { useNotifications, NotificationsProvider } from './notification-system';

const NotificationCenter = lazy(() =>
  import('./notification-system/components/NotificationCenter').then((m) => ({
    default: m.NotificationCenter,
  })),
);

function NotificationCenterPage({ onNavigateTab }: { onNavigateTab: (tab: string) => void }) {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    snoozeNotification,
    handleAction,
  } = useNotifications();

  return (
    <NotificationCenter
      isFullPage={true}
      notifications={notifications}
      onAction={(item) => handleAction(item, onNavigateTab)}
      onMarkRead={markAsRead}
      onMarkAllRead={markAllAsRead}
      onDismiss={dismissNotification}
      onSnooze={snoozeNotification}
    />
  );
}

function TabFallback() {
  const { activeStore } = useTenant();
  const search = typeof window !== 'undefined' ? window.location.search.toLowerCase() : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';

  const isCar =
    activeStore?.id === 'store-bleco' ||
    search.includes('store=car') ||
    search.includes('store=bleco') ||
    search.includes('demo=car') ||
    pathname.startsWith('/car') ||
    pathname.startsWith('/bleco');

  const isCoffee =
    !isCar && (
      activeStore?.id === 'store-coffee' ||
      search.includes('store=coffee') ||
      search.includes('demo=coffee') ||
      search.includes('hibrew') ||
      pathname.startsWith('/coffee') ||
      pathname.startsWith('/public_html')
    );

  const isMaster =
    !isCar &&
    !isCoffee && (
      search.includes('portal=master') ||
      search.includes('store=master') ||
      pathname.startsWith('/master')
    );

  const fallbackStoreId = isCar
    ? 'store-bleco'
    : isCoffee
    ? 'store-coffee'
    : isMaster
    ? 'master'
    : (activeStore?.id || 'store-1');

  const loaderPrefs = React.useMemo(() => {
    try {
      const s = readAllThemeSettings(fallbackStoreId, activeStore);
      return {
        isEnabled: s.colors?.enableDashboardLoader ?? true,
        subtitle: s.colors?.loadingSubtitle,
        logoUrl: s.colors?.loadingLogoUrl,
      };
    } catch {
      return { isEnabled: true, subtitle: undefined, logoUrl: undefined };
    }
  }, [fallbackStoreId, activeStore]);

  if (!loaderPrefs.isEnabled) return null;

  return (
    <DashboardLoader
      enabled={loaderPrefs.isEnabled}
      storeId={activeStore?.id || fallbackStoreId}
      storeName={activeStore?.name}
      taglineEn={loaderPrefs.subtitle}
      logoUrl={
        isCar
          ? (activeStore?.logo && !activeStore.logo.includes('brand-logo')
              ? activeStore.logo
              : 'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/wYYVD/OZbzrkkW0icMZlcDNOiZnU4PSjwq6WxXgCkwT0PQ.png')
          : isCoffee
          ? (activeStore?.logo && !activeStore.logo.includes('brand-logo')
              ? activeStore.logo
              : '/images/hibrew_h7a_flagship_machine.png')
          : (loaderPrefs.logoUrl || activeStore?.logo)
      }
    />
  );
}

function TabInlineFallback() {
  return (
    <div className="w-full p-6 space-y-4 animate-pulse select-none">
      <div className="h-1.5 w-full bg-gradient-to-r from-teal-500/25 via-emerald-500/50 to-teal-500/25 rounded-full" />
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/70" />
        <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/70" />
        <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/70" />
        <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/70" />
      </div>
      <div className="h-64 bg-slate-100/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/70 mt-3" />
    </div>
  );
}

function AdminContent() {
  const {
    mode,
    setMode,
    activeStore,
    activeStoreId,
    switchToStore,
    switchToMaster,
    canAccessMaster,
    stores,
    storeActiveTheme,
    resolvedDomain,
  } = useTenant();
  const { t, theme, dir, locale } = usePrefs();
  const { toast, confirm } = useToast();

  const [isVisualBuilderOpen, setIsVisualBuilderOpen] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      const params = new URLSearchParams(window.location.search);
      if (params.get('builder') === '1' || params.get('builder') === 'true' || params.get('tab') === 'builder') {
        return true;
      }
      return sessionStorage.getItem('unityteck_visual_builder_open') === '1';
    } catch {
      return false;
    }
  });

  const [visualBuilderThemeId, setVisualBuilderThemeId] = useState<string | undefined>(() => {
    try {
      if (typeof window === 'undefined') return undefined;
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get('themeId');
      if (urlTheme && !urlTheme.includes('[object') && urlTheme !== 'undefined' && urlTheme !== 'null') {
        return urlTheme.trim();
      }
      const saved = sessionStorage.getItem('unityteck_visual_builder_theme');
      if (saved && !saved.includes('[object') && saved !== 'undefined' && saved !== 'null') {
        return saved.trim();
      }
      return undefined;
    } catch {
      return undefined;
    }
  });

const getDefaultStoreTheme = (storeId?: string): string => {
  if (storeId === 'store-bleco' || storeId?.includes('bleco') || storeId?.includes('car')) return 'theme-saudia-transport';
  if (storeId === 'store-coffee' || storeId?.includes('coffee') || storeId?.includes('roaster')) return 'coffee-roasters';
  if (storeId === 'store-1' || storeId?.includes('flower') || storeId?.includes('hadaya') || storeId?.includes('gift')) return 'theme-flora-luxe';
  return 'theme-flora-luxe';
};

  // Dynamically sync theme ID per store and self-heal any corrupted [object Object] URL or storage
  useEffect(() => {
    if (!activeStore?.id) return;
    const defaultTheme = getDefaultStoreTheme(activeStore.id);
    const currentStoreTheme = storeActiveTheme[activeStore.id] || defaultTheme;

    // Check URL query parameters and sanitize if corrupted or outdated
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const urlTheme = url.searchParams.get('themeId');
        const isCorrupt = urlTheme && (urlTheme.includes('[object') || urlTheme === 'undefined' || urlTheme === 'null');
        
        if (isCorrupt) {
          url.searchParams.set('themeId', currentStoreTheme);
          window.history.replaceState({}, '', url.toString());
          sessionStorage.setItem('unityteck_visual_builder_theme', currentStoreTheme);
          sessionStorage.setItem(`unityteck_visual_builder_theme_${activeStore.id}`, currentStoreTheme);
          setVisualBuilderThemeId(currentStoreTheme);
        } else if (url.searchParams.get('builder') === '1' && (!urlTheme || urlTheme !== currentStoreTheme)) {
          // If builder is active and URL has no specific theme or switched store, update dynamically
          url.searchParams.set('themeId', currentStoreTheme);
          window.history.replaceState({}, '', url.toString());
          setVisualBuilderThemeId(currentStoreTheme);
        } else if (visualBuilderThemeId !== currentStoreTheme && (!visualBuilderThemeId || visualBuilderThemeId.includes('[object'))) {
          setVisualBuilderThemeId(currentStoreTheme);
        }
      } catch {}
    }
  }, [activeStore?.id, storeActiveTheme, visualBuilderThemeId]);

  const handleOpenCustomizeTheme = useCallback((targetThemeId?: string | unknown, targetPage?: string) => {
    preloadVisualThemeBuilder();
    // Strictly validate: never allow React click events or '[object Object]'
    const cleanTargetThemeId =
      typeof targetThemeId === 'string' &&
      targetThemeId.trim() &&
      !targetThemeId.includes('[object') &&
      targetThemeId !== 'undefined' &&
      targetThemeId !== 'null'
        ? targetThemeId.trim()
        : undefined;

    const currentStoreTheme =
      (activeStore ? storeActiveTheme[activeStore.id] : undefined) ||
      getDefaultStoreTheme(activeStore?.id);

    const selectedThemeId = cleanTargetThemeId || currentStoreTheme;
    setVisualBuilderThemeId(selectedThemeId);
    setIsVisualBuilderOpen(true);
    try {
      sessionStorage.setItem('unityteck_visual_builder_open', '1');
      if (activeStore?.id) {
        sessionStorage.setItem(`unityteck_visual_builder_theme_${activeStore.id}`, selectedThemeId);
      }
      sessionStorage.setItem('unityteck_visual_builder_theme', selectedThemeId);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('builder', '1');
        url.searchParams.set('themeId', selectedThemeId);
        if (targetPage) {
          url.searchParams.set('builderPage', targetPage);
        }
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, [activeStore, storeActiveTheme]);

  const handleCloseVisualBuilder = useCallback(() => {
    setIsVisualBuilderOpen(false);
    try {
      sessionStorage.removeItem('unityteck_visual_builder_open');
      sessionStorage.removeItem('unityteck_visual_builder_theme');
      sessionStorage.removeItem('unityteck_visual_builder_page');
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('builder');
        url.searchParams.delete('themeId');
        url.searchParams.delete('builderPage');
        if (url.searchParams.get('tab') === 'builder') {
          url.searchParams.set('tab', 'dashboard');
        }
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('customizer') === '1' ||
        params.get('customize') === '1' ||
        params.get('tab') === 'customizer'
      );
    } catch {
      return false;
    }
  });

  const [customizerSectionId, setCustomizerSectionId] = useState<string | null>(() => {
    try {
      if (typeof window === 'undefined') return null;
      return new URLSearchParams(window.location.search).get('section');
    } catch {
      return null;
    }
  });

  const handleOpenThemeCustomizer = useCallback((sectionId?: string) => {
    setCustomizerSectionId(sectionId || null);
    setIsThemeCustomizerOpen(true);
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('customizer', '1');
        if (sectionId) url.searchParams.set('section', sectionId);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  const handleCloseThemeCustomizer = useCallback(() => {
    setIsThemeCustomizerOpen(false);
    setCustomizerSectionId(null);
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('customizer');
        url.searchParams.delete('customize');
        url.searchParams.delete('section');
        if (url.searchParams.get('tab') === 'customizer') {
          url.searchParams.set('tab', 'themes');
        }
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  const [path, navigate] = useSoftPath();
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession());
  const { canTab, firstAllowedTab } = usePermissions();

  // Keep React session in sync with localStorage until explicit logout
  useEffect(() => {
    const sync = () => {
      const next = readAuthSession();
      setSession((prev) => {
        if (!prev && !next) return null;
        if (prev && next && JSON.stringify(prev) === JSON.stringify(next)) {
          return prev;
        }
        return next;
      });
    };
    window.addEventListener('unityteck-auth', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('unityteck-auth', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Tab selections — persisted across page reloads so users never lose active page
  const [masterTab, setMasterTabState] = useState(() => {
    try {
      const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
      if (q) return q;
      return (typeof localStorage !== 'undefined' && localStorage.getItem('unityteck_master_tab')) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [storeTab, setStoreTabState] = useState(() => {
    try {
      const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
      if (q && q !== 'inventory' && q !== 'storefront') return q;
      const saved = typeof localStorage !== 'undefined' && localStorage.getItem('unityteck_store_tab');
      if (saved && saved !== 'inventory' && saved !== 'storefront') return saved;
      return 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [storeMobileSidebarOpen, setStoreMobileSidebarOpen] = useState(false);

  const setMasterTab = React.useCallback((tab: string) => {
    setMasterTabState(tab);
    try {
      localStorage.setItem('unityteck_master_tab', tab);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  const setStoreTab = React.useCallback((tab: string) => {
    const targetTab = tab === 'inventory' || tab === 'storefront' ? 'dashboard' : tab;
    setStoreTabState(targetTab);
    try {
      localStorage.setItem('unityteck_store_tab', targetTab);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', targetTab);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (storeTab === 'inventory' || storeTab === 'storefront') {
      setStoreTab('dashboard');
    }
  }, [storeTab, setStoreTab]);

  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [selectedCommerceArticleId, setSelectedCommerceArticleId] = useState<string | undefined>(undefined);

  const isMasterLogin =
    path === '/master/login' || (!session && (path === '/master' || path === '/master/'));
  const isStoreLogin =
    path === '/store/login' || (!session && (path === '/store' || path === '/store/'));
  const isAdminLogin =
    !session &&
    (path === '/admin' ||
      path === '/admin/' ||
      path === '/admin/login' ||
      path === '/admin/dashboard');
  const isMasterForgot = path === '/master/forgot-password';
  const isStoreForgot = path === '/store/forgot-password';
  const isMasterReset = path === '/master/reset-password';
  const isStoreReset = path === '/store/reset-password';
  const isPasswordFlow =
    isMasterForgot || isStoreForgot || isMasterReset || isStoreReset;
  const isStoreRegister =
    path === '/store/register' || path === '/register';
  const isGate = path === '/gate' || path === '/portal';
  const isClearCache =
    path === '/clear-cache' || path === '/clear' || path === '/cache';
  const statusKind = resolveStatusKind(path);
  const isStatus = statusKind !== null;
  const unknownStatus =
    !isKnownAppPath(path) && !isGate && !isClearCache && path !== '/' && path !== ''
      ? ('404' as const)
      : null;
  const activeStatus = statusKind ?? unknownStatus;
  const isFullscreenParam =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('fullscreen') === '1';
  const isTabStorefrontParam =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('tab') === 'storefront';

  const isPublicStorefront =
    isFullscreenParam ||
    isTabStorefrontParam ||
    path === '/' ||
    path === '' ||
    path === '/shop' ||
    path === '/storefront' ||
    path === '/car' ||
    path.startsWith('/car') ||
    path === '/cars' ||
    path.startsWith('/cars') ||
    path === '/bleco' ||
    path.startsWith('/bleco') ||
    path === '/coffee' ||
    path.startsWith('/coffee') ||
    path === '/public_html' ||
    path === '/public_html/' ||
    path.startsWith('/public_html/shop') ||
    path.startsWith('/public_html/cart') ||
    path.startsWith('/public_html/checkout') ||
    path.startsWith('/public_html/product') ||
    path.startsWith('/public_html/catalog') ||
    path === '/flowers' ||
    path.startsWith('/flowers') ||
    path === '/hadaya' ||
    path.startsWith('/hadaya') ||
    path === '/catalog' ||
    path === '/cart' ||
    path === '/checkout' ||
    path === '/crm' ||
    path === '/profile' ||
    path === '/orders' ||
    path === '/account' ||
    path === '/wishlist' ||
    path === '/product' ||
    path === '/thankyou' ||
    path.startsWith('/product/') ||
    path.startsWith('/category/') ||
    path.startsWith('/catalog/');
  const isAuthPage =
    isMasterLogin ||
    isStoreLogin ||
    isAdminLogin ||
    isStoreRegister ||
    isPasswordFlow ||
    isGate ||
    isStatus ||
    isClearCache ||
    isPublicStorefront;

  // Normalize short URLs → login / gate paths (soft, no reload)
  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    if (path === '/status' && !search.includes('preview=1')) {
      const target =
        activeStore?.id === 'store-bleco'
          ? '/car'
          : activeStore?.id === 'store-1'
          ? '/flowers'
          : '/coffee';
      navigate(target, { replace: true });
    } else if (path === '/car/admin' || path === '/cars/admin' || path === '/bleco/admin') {
      navigate('/admin?store=car', { replace: true });
    } else if (path === '/coffee/admin' || path === '/public_html/admin' || path === '/public_html/admin/') {
      navigate('/admin?store=coffee', { replace: true });
    } else if (path === '/flowers/admin') {
      navigate('/admin?store=flowers', { replace: true });
    } else if (path === '/admin' || path === '/admin/' || path === '/store' || path === '/store/') {
      const qTab = typeof window !== 'undefined' ? new URLSearchParams(search).get('tab') : null;
      if (qTab && qTab !== storeTab) {
        setStoreTab(qTab);
      }
    } else if (path === '/store/login' && search.includes('tab=control-center')) {
      navigate(session?.portal === 'master' ? `/master${search}` : `/master/login${search}`, { replace: true });
    } else if (path === '/master' || path === '/master/') {
      const qTab = typeof window !== 'undefined' ? new URLSearchParams(search).get('tab') : null;
      if (qTab && qTab !== masterTab) {
        setMasterTab(qTab);
      }
      if (!session || session.portal !== 'master') {
        if (search.includes('autologin=1')) {
          loginPortal('master', 'master@unityteck.com', 'UnityMaster@2026!Secure')
            .then((s) => {
              setSession(s);
              switchToMaster();
              if (qTab) setMasterTab(qTab);
            })
            .catch(() => navigate(`/master/login${search}`, { replace: true }));
        } else {
          navigate(`/master/login${search}`, { replace: true });
        }
      } else if (mode !== 'master') {
        setMode('master');
      }
    } else if (path === '/register') {
      const inv =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('invite')
          : null;
      navigate(
        inv
          ? `/store/register?invite=${encodeURIComponent(inv)}`
          : '/store/register',
        { replace: true }
      );
    } else if (path === '/login') {
      navigate(`/store/login${search}`, { replace: true });
    }
  }, [path, navigate, session]);

  // /clear-cache → wipe local demo cache + hard reload (fresh UI)
  useEffect(() => {
    if (!isClearCache) return;
    clearAppCache();
    setSession(null);
    window.location.replace(`/?_=${Date.now()}`);
  }, [isClearCache]);

  const isAutoSwitchingRef = React.useRef(false);
  const lastSwitchedStoreKeyRef = React.useRef<string | null>(null);

  // Dedicated store dashboard auto-switch & deep-link handler for ?store= / ?demo= or /coffee, /bleco
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isExplicitLoginPage = window.location.pathname.includes('/login');
    const params = new URLSearchParams(window.location.search);
    const storeParam = (params.get('store') || params.get('demo') || '').toLowerCase().trim();
    const pathnameLower = window.location.pathname.toLowerCase();
    const hostnameLower = window.location.hostname.toLowerCase();
    const effectiveSlug =
      storeParam ||
      (pathnameLower.startsWith('/coffee') ? 'coffee' :
       pathnameLower.startsWith('/bleco') || pathnameLower.startsWith('/car') ? 'bleco' :
       pathnameLower.startsWith('/flowers') || pathnameLower.startsWith('/hadaya') ? 'flowers' :
       (hostnameLower.includes('giftshop-sa.com') || hostnameLower.includes('hadaya') ? 'flowers' :
       (resolvedDomain?.resolved && resolvedDomain.storeId ? resolvedDomain.storeId : '')));
    if (!effectiveSlug) return;
    const tabParam = params.get('tab');
    const tabQuery = tabParam ? `&tab=${encodeURIComponent(tabParam)}` : '';

    const targetStoreId =
      effectiveSlug === 'coffee' || effectiveSlug === 'store-coffee' || effectiveSlug === 'roasters'
        ? 'store-coffee'
        : effectiveSlug === 'bleco' ||
          effectiveSlug === 'store-bleco' ||
          effectiveSlug === 'car' ||
          effectiveSlug === 'cars' ||
          effectiveSlug === 'alsaeedi' ||
          effectiveSlug === 'tanjeed' ||
          effectiveSlug === 'transport' ||
          effectiveSlug === 'saeedi' ||
          effectiveSlug === 'varotn' ||
          effectiveSlug === 'varotan' ||
          effectiveSlug === 'mats' ||
          effectiveSlug === 'seats'
        ? 'store-bleco'
        : effectiveSlug === 'store-1' ||
          effectiveSlug === 'makkah' ||
          effectiveSlug === 'giftshop' ||
          effectiveSlug === 'flowers' ||
          effectiveSlug === 'hadaya'
        ? 'store-1'
        : effectiveSlug === 'master'
        ? 'master'
        : stores.find(st => st.id.toLowerCase() === effectiveSlug || st.slug?.toLowerCase() === effectiveSlug)?.id ||
          (effectiveSlug.startsWith('store-') ? effectiveSlug : null);

    if (!targetStoreId) return;

    // Check if state is already satisfied
    if (targetStoreId === 'master') {
      if (session?.portal === 'master') return;
    } else {
      if (activeStore?.id === targetStoreId) {
        if (isPublicStorefront) return;
        if (!session) return;
        if (session?.portal === 'store' && session?.storeId === targetStoreId) return;
      }
    }

    const currentKey = `${effectiveSlug}_${targetStoreId}_${isPublicStorefront ? 'pub' : 'adm'}`;
    if (lastSwitchedStoreKeyRef.current === currentKey || isAutoSwitchingRef.current) {
      return;
    }
    lastSwitchedStoreKeyRef.current = currentKey;

    if (targetStoreId === 'master') {
      const allowAuto = params.get('autologin') === '1';
      if (!isExplicitLoginPage && session?.portal !== 'master' && allowAuto) {
        isAutoSwitchingRef.current = true;
        loginPortal('master', 'master@unityteck.com', 'UnityMaster@2026!Secure')
          .then((s) => {
            setSession(s);
            switchToMaster();
            navigate('/master', { replace: true });
          })
          .catch(() => {})
          .finally(() => {
            isAutoSwitchingRef.current = false;
          });
      }
      return;
    }

    if (isPublicStorefront) {
      if (activeStore?.id !== targetStoreId) {
        switchToStore(targetStoreId);
      }
      return;
    }

    // Admin login per target store
    if (!isExplicitLoginPage) {
      if (session?.portal === 'store' && session?.storeId === targetStoreId) {
        if (activeStore?.id !== targetStoreId) {
          switchToStore(targetStoreId);
        }
        if (tabParam && tabParam !== 'storefront' && tabParam !== 'inventory' && storeTab !== tabParam) {
          setStoreTab(tabParam);
        }
        return;
      }

      const isMismatchSession = Boolean(session && (session.portal !== 'store' || session.storeId !== targetStoreId));
      const isNoSession = !session;
      const allowAuto = params.get('autologin') === '1' || isMismatchSession || isNoSession;

      if (allowAuto) {
        isAutoSwitchingRef.current = true;
        const creds =
          targetStoreId === 'store-coffee'
            ? { email: 'rayan@specialtycoffee.sa', pass: 'CoffeeStore@2026!Secure', slug: 'coffee' }
            : targetStoreId === 'store-bleco'
            ? { email: 'admin@bleco.sa', pass: 'BlackoStore@2026!Secure', slug: 'bleco' }
            : { email: 'admin@giftshop-sa.com', pass: 'MakkahStore@2026!Secure', slug: effectiveSlug || 'hadaya' };

        loginPortal('store', creds.email, creds.pass)
          .then((s) => {
            setSession(s);
            switchToStore(targetStoreId);
            if (tabParam && tabParam !== 'storefront' && tabParam !== 'inventory') {
              setStoreTab(tabParam);
            }
            navigate(`/admin?store=${creds.slug}${tabQuery}`, { replace: true });
          })
          .catch(() => {
            switchToStore(targetStoreId);
          })
          .finally(() => {
            isAutoSwitchingRef.current = false;
          });
      } else if (!session) {
        // Switch context to target store gracefully without force-logging in with fake password
        switchToStore(targetStoreId);
      }
    } else if (session?.portal === 'store' && session?.storeId === targetStoreId) {
      if (activeStore?.id !== targetStoreId) {
        switchToStore(targetStoreId);
      }
      if (tabParam && tabParam !== 'storefront' && tabParam !== 'inventory' && storeTab !== tabParam) {
        setStoreTab(tabParam);
      }
    }
  }, [navigate, switchToStore, switchToMaster, session, activeStore?.id, isPublicStorefront, storeTab, setStoreTab]);

  // Force login: protected routes without session → start gate
  useEffect(() => {
    if (session) return;
    if (isAuthPage) return;
    if (activeStatus) return;
    navigate('/');
  }, [session, isAuthPage, activeStatus, navigate]);

  // Already signed in on login/register/reset → dashboard (only if matching portal, preserving store query)
  useEffect(() => {
    if (!session) return;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    if (isMasterLogin && session.portal === 'master') {
      navigate(`/master${search}`);
    } else if ((isStoreLogin || isAdminLogin) && session.portal === 'store') {
      navigate(`/admin${search}`);
    } else if (isStoreRegister || isPasswordFlow) {
      navigate(session.portal === 'master' ? '/master' : `/admin${search}`);
    }
  }, [session, isMasterLogin, isStoreLogin, isAdminLogin, isStoreRegister, isPasswordFlow, navigate]);

  // Phase 2.4 — soft SPA: if current tab denied by role, jump to first allowed (no reload)
  // Uses refs for canTab/firstAllowedTab so background data refreshes don't re-trigger this guard
  const canTabRef = React.useRef(canTab);
  canTabRef.current = canTab;
  const firstAllowedTabRef = React.useRef(firstAllowedTab);
  firstAllowedTabRef.current = firstAllowedTab;
  useEffect(() => {
    if (!session) return;
    if (mode === 'master') {
      if (!canTabRef.current(masterTab, 'master')) {
        const next = firstAllowedTabRef.current(Object.keys(MASTER_TAB_ABILITY), 'master');
        setMasterTab(next);
        toast(t('noPermissionTab'), 'info');
      }
    } else if (!canTabRef.current(storeTab, 'store')) {
      const next = firstAllowedTabRef.current(Object.keys(STORE_TAB_ABILITY), 'store');
      setStoreTab(next);
      toast(t('noPermissionTab'), 'info');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, mode, masterTab, storeTab]);

  // Auto offline page when network drops
  useEffect(() => {
    const onOffline = () => {
      if (isStatusPath(window.location.pathname)) return;
      try {
        sessionStorage.setItem(
          'unityteck_pre_offline',
          window.location.pathname || '/',
        );
      } catch {
        // ignore
      }
      navigate('/offline');
    };
    const onOnline = () => {
      const here = window.location.pathname;
      if (here !== '/offline' && here !== '/status/network' && here !== '/status/offline') {
        return;
      }
      let prev = '/';
      try {
        prev = sessionStorage.getItem('unityteck_pre_offline') || '/';
        sessionStorage.removeItem('unityteck_pre_offline');
      } catch {
        // ignore
      }
      navigate(prev);
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      onOffline();
    }
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    document.documentElement.setAttribute('data-portal', session.portal);
    if (session.portal === 'master') {
      if (mode !== 'master') {
        setMode('master');
      }
    } else if (session.portal === 'store') {
      if (mode !== 'store') {
        setMode('store');
      }
      // CRITICAL FIX: Only sync activeStore to session.storeId if we are on the admin panel
      // AND there is no explicit store in the URL query or path.
      // NEVER override public storefronts or user-chosen store switches!
      if (!isPublicStorefront) {
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const hasUrlStore = Boolean(
          urlParams?.has('store') ||
          urlParams?.has('demo') ||
          urlParams?.has('tenant') ||
          urlParams?.has('storeId')
        );
        const urlPath = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
        const hasPathStore =
          urlPath.startsWith('/coffee') ||
          urlPath.startsWith('/bleco') ||
          urlPath.startsWith('/car') ||
          urlPath.startsWith('/flowers') ||
          urlPath.startsWith('/hadaya');

        if (!hasUrlStore && !hasPathStore && session.storeId) {
          const currentStoreId = activeStoreId || activeStore?.id;
          if (!currentStoreId) {
            switchToStore(session.storeId);
          }
        }
      }
    } else {
      if (mode !== 'store') {
        setMode('store');
      }
    }
  }, [session?.portal, session?.storeId, mode, activeStoreId, activeStore?.id, setMode, switchToStore, isPublicStorefront]);

  // Eagerly prefetch store tab modules and theme builder during store idle time for instant zero-lag tabs
  useEffect(() => {
    if (mode === 'store') {
      const runPrefetch = () => {
        void import('./components/store/StoreOrders');
        void import('./components/store/StoreProducts');
        void import('./components/store/StoreCustomers');
        void import('./components/store/StoreAnalytics');
        void import('./components/store/StoreReports');
        void import('./components/store/StoreMarketingHub');
        void import('./components/store/StoreSEO');
        void import('./components/store/StoreCategories');
        void import('./components/store/StoreBrandsView');
        void import('./components/store/invoices/StoreInvoices');
        void import('./components/store/StoreShipping');
        void import('./components/store/StoreCoupons');
        void import('./components/store/StoreAbandonedCarts');
        void import('./components/store/StoreMediaLibrary');
        void import('./components/store/whatsapp/StoreWhatsAppManager');
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(runPrefetch, { timeout: 1000 });
      } else {
        setTimeout(runPrefetch, 250);
      }

      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => preloadVisualThemeBuilder());
        } else {
          preloadVisualThemeBuilder();
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const handleLoginSuccess = useCallback(
    (portal: AuthPortal, storeId?: string | null) => {
      const next = readAuthSession();
      setSession(next);
      document.documentElement.setAttribute('data-portal', portal);
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const qTab = typeof window !== 'undefined' ? new URLSearchParams(search).get('tab') : null;
      if (portal === 'master') {
        switchToMaster();
        if (qTab) setMasterTab(qTab);
        navigate(qTab ? `/master?tab=${encodeURIComponent(qTab)}` : '/master');
      } else {
        if (storeId) {
          switchToStore(storeId);
        } else {
          setMode('store');
        }
        if (qTab && qTab !== 'control-center') setStoreTab(qTab);
        navigate(qTab && qTab !== 'control-center' ? `/admin?tab=${encodeURIComponent(qTab)}` : '/admin');
      }
    },
    [navigate, setMode, switchToMaster, switchToStore, setMasterTab, setStoreTab],
  );

  const handleRegisterSuccess = useCallback(
    (storeId: string) => {
      const next = readAuthSession();
      setSession(next);
      document.documentElement.setAttribute('data-portal', 'store');
      switchToStore(storeId);
      navigate('/admin');
    },
    [navigate, switchToStore],
  );

  const handleSwitchLoginPortal = useCallback(
    (portal: AuthPortal) => {
      navigate(portal === 'master' ? '/master/login' : '/admin');
    },
    [navigate],
  );

  const isMasterSession = session?.portal === 'master';
  const showMasterChrome = Boolean(isMasterSession && canAccessMaster);

  // Store sessions stay on store mode — cannot enter Master Admin
  useEffect(() => {
    if (!session) return;
    if ((session.portal as string) === 'store' && (mode as string) === 'master') {
      if (session.storeId) {
        const currentStoreId = activeStoreId || activeStore?.id;
        if (currentStoreId !== session.storeId) {
          switchToStore(session.storeId);
        } else {
          setMode('store');
        }
      } else {
        setMode('store');
      }
    }
  }, [session?.portal, session?.storeId, mode, activeStoreId, activeStore?.id, setMode, switchToStore]);

  // Favicon + <title> per portal (docs/21) — Master platform vs Store brand
  useEffect(() => {
    if (!session) return;
    if (mode === 'master') {
      applyPortalHead({ portal: 'master' });
      return;
    }
    const identity = activeStore ? readStoreIdentity(activeStore.id, activeStore) : null;
    const currentFavicon = activeStore?.favicon || identity?.faviconUrl || activeStore?.logo || null;
    applyPortalHead({
      portal: 'store',
      storeName: activeStore?.name || null,
      faviconUrl: currentFavicon,
    });
  }, [session, mode, activeStore?.name, activeStore?.favicon, activeStore?.logo, activeStore?.id]);

  // Listen for live store updates (logo, favicon, name) to update browser tab immediately
  useEffect(() => {
    const handleStoreUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ storeId: string; name?: string; logo?: string; favicon?: string }>;
      if (customEvent.detail && activeStore && customEvent.detail.storeId === activeStore.id) {
        if (mode === 'store') {
          applyPortalHead({
            portal: 'store',
            storeName: customEvent.detail.name || activeStore.name,
            faviconUrl: customEvent.detail.favicon || customEvent.detail.logo || activeStore.favicon,
          });
        }
      }
    };
    window.addEventListener('unityteck-store-updated', handleStoreUpdated);
    return () => window.removeEventListener('unityteck-store-updated', handleStoreUpdated);
  }, [activeStore, mode]);

  const handleLogout = useCallback(() => {
    const wasMaster = session?.portal === 'master';
    try {
      void logoutPortal();
    } catch {
      // ignore
    }
    clearAuthSession(true);
    setSession(null);
    try {
      localStorage.removeItem('unityteck_auth');
      localStorage.removeItem('unityteck_auth_lifetime_backup');
      localStorage.removeItem('unityteck_active_store_id');
      localStorage.removeItem('unityteck_store_tab');
      localStorage.removeItem('unityteck_master_tab');
      sessionStorage.clear();
      window.dispatchEvent(new Event('unityteck-auth'));
    } catch {}
    const dest = wasMaster ? '/master/login' : '/store/login';
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', dest);
    }
    navigate(dest);
  }, [navigate, session]);

  const requestLogout = useCallback(async () => {
    await handleLogout();
  }, [handleLogout]);

  const statusHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (isClearCache) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-sm font-bold"
        style={{
          background: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        Clearing cache…
      </div>
    );
  }

  if (activeStatus) {
    const redirectTo =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('to') || '/'
        : '/';
    return (
      <Suspense fallback={<TabFallback />}>
        <StatusPage
          kind={activeStatus}
          onHome={statusHome}
          onNavigate={navigate}
          redirectTo={redirectTo}
        />
      </Suspense>
    );
  }

  if (!session && isGate) {
    return (
      <Suspense fallback={<TabFallback />}>
        <PortalGate
          onOpenMaster={() => navigate('/master/login')}
          onOpenStore={(slug?: string) => navigate(slug ? `/store/login?store=${slug}` : '/store/login')}
          onOpenStorefront={() => navigate('/storefront')}
        />
      </Suspense>
    );
  }

  if (!session && isStoreRegister) {
    return (
      <Suspense fallback={<TabFallback />}>
        <PortalRegister
          onSuccess={handleRegisterSuccess}
          onGoLogin={() => navigate('/store/login')}
        />
      </Suspense>
    );
  }

  if (!session && isPasswordFlow) {
    const portal: AuthPortal =
      isMasterForgot || isMasterReset ? 'master' : 'store';
    const mode = isMasterForgot || isStoreForgot ? 'forgot' : 'reset';
    const loginPath = portal === 'master' ? '/master/login' : '/store/login';
    return (
      <Suspense fallback={<TabFallback />}>
        <PortalPasswordReset
          portal={portal}
          mode={mode}
          onBackToLogin={() => navigate(loginPath)}
          onGoReset={(email, token) => {
            const base =
              portal === 'master'
                ? '/master/reset-password'
                : '/store/reset-password';
            navigate(
              `${base}?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`,
            );
          }}
        />
      </Suspense>
    );
  }

  if (!session && (isMasterLogin || isStoreLogin || isAdminLogin)) {
    return (
      <Suspense fallback={<TabFallback />}>
        <PortalLogin
          portal={isMasterLogin ? 'master' : 'store'}
          onSuccess={handleLoginSuccess}
          onSwitchPortal={handleSwitchLoginPortal}
          onForgotPassword={() =>
            navigate(
              isMasterLogin
                ? '/master/forgot-password'
                : '/store/forgot-password',
            )
          }
        />
      </Suspense>
    );
  }

  const isFullscreenStorefront =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('fullscreen') === '1';

  if (isPublicStorefront || isFullscreenStorefront) {
    const searchParams =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    const urlStoreSlug = (
      searchParams.get('store') ||
      searchParams.get('storeId') ||
      searchParams.get('demo') ||
      ''
    )
      .toLowerCase()
      .trim();
    const urlTheme = searchParams.get('theme') || '';
    let effectivePage = (searchParams.get('page') || searchParams.get('preview_page') || '').toLowerCase().trim();
    if (!effectivePage) {
      const cleanPath = path.replace(/\/$/, '') || '/';
      if (cleanPath === '/cart' || cleanPath.endsWith('/cart')) effectivePage = 'cart';
      else if (cleanPath === '/checkout' || cleanPath.endsWith('/checkout')) effectivePage = 'checkout';
      else if (cleanPath === '/catalog' || cleanPath === '/shop' || cleanPath.endsWith('/catalog') || cleanPath.endsWith('/shop')) effectivePage = 'catalog';
      else if (cleanPath === '/products' || cleanPath.endsWith('/products')) effectivePage = 'products';
      else if (cleanPath === '/product' || cleanPath.startsWith('/product/') || cleanPath.includes('/product')) effectivePage = 'product';
      else if (cleanPath === '/crm' || cleanPath === '/profile' || cleanPath === '/account' || cleanPath === '/orders') effectivePage = 'crm';
      else if (cleanPath === '/thankyou' || cleanPath.endsWith('/thankyou')) effectivePage = 'thankyou';
      else if (cleanPath === '/about' || cleanPath.endsWith('/about')) effectivePage = 'about';
      else if (cleanPath === '/contact' || cleanPath.endsWith('/contact')) effectivePage = 'contact';
      else if (cleanPath === '/faq' || cleanPath.endsWith('/faq')) effectivePage = 'faq';
      else if (cleanPath === '/privacy' || cleanPath.endsWith('/privacy')) effectivePage = 'privacy';
      else if (cleanPath === '/terms' || cleanPath.endsWith('/terms')) effectivePage = 'terms';
      else if (cleanPath === '/return' || cleanPath.endsWith('/return')) effectivePage = 'return';
      else if (cleanPath === '/shipping' || cleanPath.endsWith('/shipping')) effectivePage = 'shipping';
      else if (cleanPath === '/warranty' || cleanPath.endsWith('/warranty')) effectivePage = 'warranty';
      else if (cleanPath === '/locator' || cleanPath.endsWith('/locator')) effectivePage = 'locator';
      else if (cleanPath === '/track-order' || cleanPath.endsWith('/track-order')) effectivePage = 'track-order';
    }

    const storefrontStoreId =
      urlStoreSlug === 'coffee' ||
      urlStoreSlug === 'store-coffee' ||
      urlStoreSlug.includes('coffee') ||
      urlStoreSlug.includes('hibrew') ||
      urlStoreSlug.includes('roaster') ||
      path.startsWith('/coffee') ||
      path === '/public_html' ||
      path.startsWith('/public_html')
        ? 'store-coffee'
        : urlStoreSlug === 'car' ||
          urlStoreSlug === 'cars' ||
          urlStoreSlug === 'bleco' ||
          urlStoreSlug === 'store-bleco' ||
          urlStoreSlug.includes('car') ||
          urlStoreSlug.includes('bleco') ||
          urlStoreSlug.includes('transport') ||
          path.startsWith('/car') ||
          path.startsWith('/cars') ||
          path.startsWith('/bleco')
        ? 'store-bleco'
        : urlStoreSlug === 'flowers' ||
          urlStoreSlug === 'hadaya' ||
          urlStoreSlug === 'gifts' ||
          urlStoreSlug === 'store-1' ||
          urlStoreSlug.includes('flower') ||
          urlStoreSlug.includes('gift') ||
          urlStoreSlug.includes('hadaya') ||
          path.startsWith('/flowers') ||
          path.startsWith('/hadaya')
        ? 'store-1'
        : (resolvedDomain?.resolved && resolvedDomain.storeId)
        ? resolvedDomain.storeId
        : activeStore?.id || 'store-1';

    return (
      <StatusErrorBoundary onHome={() => navigate('/')} onNavigate={navigate}>
        <div dir={dir} lang={locale} className="min-h-screen w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
          <div className="flex-1">
            <Suspense fallback={<TabFallback />}>
              <DynamicThemeRenderer
                storeId={storefrontStoreId}
                themeId={urlTheme || undefined}
                initialPage={effectivePage || undefined}
                isAdmin={false}
              />
            </Suspense>
          </div>
        </div>
      </StatusErrorBoundary>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <StatusErrorBoundary onHome={() => navigate('/')} onNavigate={navigate}>
    <div
      dir={dir}
      lang={locale}
      className="unity-shell h-screen max-h-screen overflow-hidden flex flex-col transition-[background,color] duration-150"
      data-portal={mode}
      data-theme={theme}
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Unified Holst header: MasterTopBar / StoreTopBar only — no dark chrome · no DB banner */}
      <div className="flex flex-1 overflow-hidden min-h-0 h-full">
        {showMasterChrome && mode === 'master' ? (
          <>
            <MasterSidebar
              currentTab={masterTab}
              onSelectTab={(tab) => setMasterTab(tab)}
            />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <MasterTopBar
                onOpenCreateStore={() => setIsCreateStoreOpen(true)}
                onSignOut={() => void requestLogout()}
              />
              <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-16">
                <Suspense fallback={<TabInlineFallback />}>
                  {masterTab === 'dashboard' && (
                    <MasterDashboard onOpenCreateStore={() => setIsCreateStoreOpen(true)} />
                  )}
                  {masterTab === 'stores' && (
                    <MasterStores onOpenCreateStore={() => setIsCreateStoreOpen(true)} />
                  )}
                  {masterTab === 'control-center' && <MasterControlCenter />}
                  {masterTab === 'onboarding' && <MasterOnboarding />}
                  {masterTab === 'domains' && <MasterDomains />}
                  {masterTab === 'updates' && <MasterUpdates />}
                  {masterTab === 'themes' && <MasterThemes />}
                  {masterTab === 'marketplace' && <MasterMarketplace />}
                  {masterTab === 'seo' && <MasterSEO />}
                  {masterTab === 'database' && <MasterDatabase />}
                  {(masterTab === 'backup' || masterTab === 'restore') && <StoreBackupRestoreCenter />}
                  {masterTab === 'orders' && <MasterOrders />}
                  {masterTab === 'products' && <MasterProducts />}
                  {masterTab === 'settings' && <MasterSettings />}
                  {![
                    'dashboard',
                    'stores',
                    'control-center',
                    'onboarding',
                    'domains',
                    'database',
                    'backup',
                    'restore',
                    'updates',
                    'themes',
                    'marketplace',
                    'seo',
                    'orders',
                    'products',
                    'settings',
                  ].includes(masterTab) && (
                    <MasterGeneralView
                      tab={masterTab}
                      onOpenCreateStore={() => setIsCreateStoreOpen(true)}
                    />
                  )}
                </Suspense>
              </main>
            </div>
            {isCreateStoreOpen && (
              <Suspense fallback={null}>
                <CreateStoreModal
                  isOpen={isCreateStoreOpen}
                  onClose={() => setIsCreateStoreOpen(false)}
                />
              </Suspense>
            )}
          </>
        ) : (
          <>
            <StoreSidebar
              currentTab={storeTab}
              onSelectTab={(tab) => {
                setStoreTab(tab);
                setStoreMobileSidebarOpen(false);
              }}
              mobileOpen={storeMobileSidebarOpen}
              onCloseMobile={() => setStoreMobileSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <StoreTopBar
                searchValue={storeSearch}
                onSearchChange={setStoreSearch}
                canAccessMaster={showMasterChrome}
                onSignOut={() => void requestLogout()}
                onOpenProducts={() => setStoreTab('products')}
                onCustomizeTheme={handleOpenCustomizeTheme}
                onOpenThemeCustomizer={handleOpenThemeCustomizer}
                onNavigateTab={(tab) => {
                  setStoreTab(tab);
                  setStoreMobileSidebarOpen(false);
                }}
                onToggleSidebar={() => setStoreMobileSidebarOpen((v) => !v)}
                searchPlaceholder={
                  storeTab === 'customers' ? t('searchCustomers') : t('searchStore')
                }
              />
              <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-16">
                <Suspense fallback={<TabInlineFallback />}>
                  {!isStoreControlEnabled(activeStore?.id, storeTab) &&
                  !['dashboard', 'notifications'].includes(storeTab) ? (
                    <div className="p-8 max-w-md mx-auto text-center space-y-4 my-20">
                      <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>
                        {locale === 'ar' ? 'تم تعطيل هذه الصفحة بواسطة إدارة المنصة' : 'Page Disabled by Master Admin'}
                      </h2>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                        {locale === 'ar'
                          ? 'قام المشرف العام بتعطيل هذه الصفحة مؤقتاً لهذا المتجر. يرجى مراجعة إدارة المنصة لطلب التفعيل.'
                          : 'This module has been temporarily disabled by Master Admin for this store. Please contact platform administration if you need access.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setStoreTab('dashboard')}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold cursor-pointer hover:opacity-90"
                      >
                        {locale === 'ar' ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
                      </button>
                    </div>
                  ) : (
                    <>
                      {storeTab === 'dashboard' && (
                    <StoreDashboard
                      onNavigateTab={setStoreTab}
                      onCustomizeTheme={handleOpenCustomizeTheme}
                      onOpenThemeCustomizer={handleOpenThemeCustomizer}
                    />
                  )}
                  {storeTab === 'notifications' && (
                    <NotificationCenterPage onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'customers' && <StoreCustomers />}
                  {storeTab === 'marketing' && (
                    <StoreMarketingHub onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'analytics' && (
                    <StoreAnalytics onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'reports' && <StoreReports />}
                  {storeTab === 'whatsapp' && (
                    <StoreWhatsAppManager onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'seo' && <StoreSEO />}
                  {storeTab === 'products' && <StoreProducts />}
                  {storeTab === 'media' && <StoreMediaLibrary />}
                  {storeTab === 'categories' && <StoreCategories />}
                  {storeTab === 'brands' && <StoreBrandsView onBackToProducts={() => setStoreTab('products')} />}
                  {storeTab === 'orders' && <StoreOrders />}
                  {storeTab === 'invoices' && <StoreInvoices onNavigateTab={(tab) => setStoreTab(tab)} />}
                  {storeTab === 'shipping' && <StoreShipping />}
                  {storeTab === 'hosting' && <StoreHostingDomain />}
                  {(storeTab === 'backup' || storeTab === 'restore') && (
                    <StoreBackupRestoreCenter />
                  )}
                  {storeTab === 'coupons' && <StoreCoupons onNavigateTab={setStoreTab} />}
                  {storeTab === 'abandoned-carts' && (
                    <StoreAbandonedCarts onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'promotions' && (
                    <StorePromotionalOffers onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'campaigns' && (
                    <StoreMarketingHub initialView="campaigns" onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'cart-offers' && (
                    <StoreCartOffers onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'bank-offers' && (
                    <StoreBankOffers onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'cashback' && (
                    <StoreCashback onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'gifting' && (
                    <StoreGiftingSystem onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'loyalty' && (
                    <StoreLoyaltyProgram onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'repurchase-reminders' && (
                    <StoreRepurchaseReminders onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'affiliate' && (
                    <StoreAffiliateMarketing onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'direct-orders' && (
                    <StoreDirectOrders onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'themes' && (
                    <StoreThemes
                      onOpenStorefront={() => {
                        const storeSlug = activeStore?.slug || (activeStore?.id === 'store-coffee' ? 'coffee' : activeStore?.id === 'store-bleco' ? 'bleco' : 'flowers');
                        navigate(`/?store=${storeSlug}&fullscreen=1`);
                      }}
                      onCustomizeTheme={(tid, page) => handleOpenCustomizeTheme(tid, page)}
                      onOpenThemeCustomizer={handleOpenThemeCustomizer}
                    />
                  )}
                  {storeTab === 'pages' && <StorePages />}
                  {storeTab === 'blog' && (
                    <StoreBlogManagement
                      onNavigateTab={setStoreTab}
                      onOpenCommerceTools={(artId) => {
                        setSelectedCommerceArticleId(artId);
                        setStoreTab('commerce-tools');
                      }}
                    />
                  )}
                  {storeTab === 'commerce-tools' && (
                    <StoreArticleCommerceTools
                      initialArticleId={selectedCommerceArticleId}
                      onNavigateTab={setStoreTab}
                    />
                  )}
                  {storeTab === 'appstore' && <StoreAppStore />}
                  {storeTab === 'payments' && <StorePayments />}
                  {storeTab === 'settings' && <StoreSettings />}
                    </>
                  )}
                </Suspense>
              </main>
            </div>
          </>
        )}
      </div>

      <ArchitectureBanner />

      {/* Unified Fullscreen Theme Page Builder */}
      {isVisualBuilderOpen && (
        <Suspense fallback={<ThemeBuilderLoadingShell />}>
          <VisualThemeBuilder
            isOpen={isVisualBuilderOpen}
            themeId={
              visualBuilderThemeId && !visualBuilderThemeId.includes('[object')
                ? visualBuilderThemeId
                : (activeStore ? storeActiveTheme[activeStore.id] : undefined) || getDefaultStoreTheme(activeStore?.id)
            }
            onClose={handleCloseVisualBuilder}
            onPublishSuccess={() => {
              handleCloseVisualBuilder();
              toast(
                locale === 'ar'
                  ? 'تم تطبيق ونشر التعديلات بنجاح على المتجر المباشر!'
                  : 'Changes published successfully to live storefront!',
                'success',
              );
            }}
          />
        </Suspense>
      )}

      {/* Dedicated WordPress-Style Live Theme Customizer */}
      {isThemeCustomizerOpen && (
        <Suspense fallback={<ThemeBuilderLoadingShell />}>
          <WordPressThemeCustomizer
            isOpen={isThemeCustomizerOpen}
            initialSectionId={customizerSectionId}
            onClose={handleCloseThemeCustomizer}
          />
        </Suspense>
      )}
    </div>
    </StatusErrorBoundary>
  );
}

export default function App() {
  return (
    <TenantProvider>
      <ToastProvider>
        <PrefsBridge />
      </ToastProvider>
    </TenantProvider>
  );
}

function PrefsBridge() {
  const { mode, activeStore } = useTenant();
  return (
    <PrefsProvider
      portal={mode}
      activeStoreLanguages={mode === 'store' ? activeStore?.languages : undefined}
    >
      <DateRangeProvider>
        <NotificationsProvider>
          <AdminContent />
        </NotificationsProvider>
      </DateRangeProvider>
    </PrefsProvider>
  );
}
