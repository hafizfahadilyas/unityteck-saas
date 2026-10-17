/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useCallback, useEffect, useState, useRef, lazy } from 'react';
import { TenantProvider, useTenant } from './context/TenantContext';
import { MasterSidebar } from './components/master/MasterSidebar';
import { MasterTopBar } from './components/master/MasterTopBar';
import { MasterDashboard } from './components/master/MasterDashboard';
import { CreateStoreModal } from './components/master/CreateStoreModal';

import { StoreSidebar } from './components/store/StoreSidebar';
import { StoreTopBar } from './components/store/StoreTopBar';
import { StoreDashboard } from './components/store/StoreDashboard';
import { PortalLogin } from './components/auth/PortalLogin';
import { PortalRegister } from './components/auth/PortalRegister';
import { PortalPasswordReset } from './components/auth/PortalPasswordReset';
import { PortalGate } from './components/auth/PortalGate';
import { StatusPage } from './components/status/StatusPage';
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
// HolstChromeBar retired — unified MasterTopBar / StoreTopBar (docs/21)

/** Heavy tabs — code-split so dashboard/themes open fast */
const MasterStores = lazy(() =>
  import('./components/master/MasterStores').then((m) => ({ default: m.MasterStores })),
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
const StoreThemes = lazy(() =>
  import('./components/store/StoreThemes').then((m) => ({ default: m.StoreThemes })),
);
const StorePages = lazy(() =>
  import('./components/store/StorePages').then((m) => ({ default: m.StorePages })),
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

import { DashboardLoader } from './components/common/DashboardLoader';
import { readAllThemeSettings } from './themes/settings/themeSettingsStore';
import { DateRangeProvider } from './context/DateRangeContext';
import { useNotifications } from './notification-system';

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
      pathname.startsWith('/coffee')
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

  const themeSettings = readAllThemeSettings(fallbackStoreId, activeStore);
  const isEnabled = themeSettings.colors?.enableDashboardLoader ?? true;
  if (!isEnabled) return null;

  return (
    <DashboardLoader
      enabled={isEnabled}
      storeId={activeStore?.id || fallbackStoreId}
      storeName={activeStore?.name}
      logoUrl={
        isCar
          ? (activeStore?.logo && !activeStore.logo.includes('brand-logo')
              ? activeStore.logo
              : 'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/wYYVD/OZbzrkkW0icMZlcDNOiZnU4PSjwq6WxXgCkwT0PQ.png')
          : isCoffee
          ? (activeStore?.logo && !activeStore.logo.includes('brand-logo')
              ? activeStore.logo
              : '/src/assets/images/hibrew_h7a_flagship_machine.png')
          : (themeSettings.colors?.loadingLogoUrl || activeStore?.logo)
      }
    />
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
  if (storeId === 'store-coffee' || storeId?.includes('coffee')) return 'theme-coffee';
  if (storeId === 'store-bleco' || storeId?.includes('bleco') || storeId?.includes('car')) return 'theme-saudia-transport';
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
    if (path === '/car/admin' || path === '/cars/admin' || path === '/bleco/admin') {
      navigate('/admin?store=car', { replace: true });
    } else if (path === '/coffee/admin') {
      navigate('/admin?store=coffee', { replace: true });
    } else if (path === '/flowers/admin') {
      navigate('/admin?store=flowers', { replace: true });
    } else if (path === '/store' || path === '/store/') {
      navigate(`/admin${search}`, { replace: true });
    } else if (path === '/master' || path === '/master/') {
      if (!session) {
        navigate(`/master/login${search}`, { replace: true });
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
    const effectiveSlug =
      storeParam ||
      (pathnameLower.startsWith('/coffee') ? 'coffee' :
       pathnameLower.startsWith('/bleco') || pathnameLower.startsWith('/car') ? 'bleco' :
       pathnameLower.startsWith('/flowers') || pathnameLower.startsWith('/hadaya') ? 'flowers' :
       (resolvedDomain?.resolved && resolvedDomain.storeId ? resolvedDomain.storeId : ''));
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

      const allowAuto =
        params.get('autologin') === '1' ||
        (typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            params.has('store')));

      if (allowAuto) {
        isAutoSwitchingRef.current = true;
        const creds =
          targetStoreId === 'store-coffee'
            ? { email: 'rayan@specialtycoffee.sa', pass: 'CoffeeStore@2026!Secure', slug: 'coffee' }
            : targetStoreId === 'store-bleco'
            ? { email: 'admin@bleco.sa', pass: 'BlackoStore@2026!Secure', slug: 'bleco' }
            : { email: 'admin@giftshop-sa.com', pass: 'MakkahStore@2026!Secure', slug: 'flowers' };

        loginPortal('store', creds.email, creds.pass)
          .then((s) => {
            setSession(s);
            switchToStore(targetStoreId);
            if (tabParam && tabParam !== 'storefront' && tabParam !== 'inventory') {
              setStoreTab(tabParam);
            }
            navigate(`/admin?store=${creds.slug}${tabQuery}`, { replace: true });
          })
          .catch(() => {})
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

  // Eagerly prefetch theme builder during store idle time so opening it is 100% instant
  useEffect(() => {
    if (mode === 'store') {
      const timer = setTimeout(() => {
        preloadVisualThemeBuilder();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const handleLoginSuccess = useCallback(
    (portal: AuthPortal, storeId?: string | null) => {
      const next = readAuthSession();
      setSession(next);
      document.documentElement.setAttribute('data-portal', portal);
      if (portal === 'master') {
        switchToMaster();
        navigate('/master');
      } else {
        if (storeId) {
          switchToStore(storeId);
        } else {
          setMode('store');
        }
        navigate('/admin');
      }
    },
    [navigate, setMode, switchToMaster, switchToStore],
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
    applyPortalHead({
      portal: 'store',
      storeName: activeStore?.name || null,
      // Store custom favicon URL lands when branding fields are wired (S1 / SEO)
      faviconUrl: null,
    });
  }, [session, mode, activeStore?.name]);

  const handleLogout = useCallback(() => {
    const wasMaster = session?.portal === 'master';
    try {
      void logoutPortal();
    } catch {
      // ignore
    }
    clearAuthSession();
    setSession(null);
    try {
      localStorage.removeItem('unityteck_auth');
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
      <StatusPage
        kind={activeStatus}
        onHome={statusHome}
        onNavigate={navigate}
        redirectTo={redirectTo}
      />
    );
  }

  if (!session && isGate) {
    return (
      <PortalGate
        onOpenMaster={() => navigate('/master/login')}
        onOpenStore={(slug?: string) => navigate(slug ? `/store/login?store=${slug}` : '/store/login')}
        onOpenStorefront={() => navigate('/storefront')}
      />
    );
  }

  if (!session && isStoreRegister) {
    return (
      <PortalRegister
        onSuccess={handleRegisterSuccess}
        onGoLogin={() => navigate('/store/login')}
      />
    );
  }

  if (!session && isPasswordFlow) {
    const portal: AuthPortal =
      isMasterForgot || isMasterReset ? 'master' : 'store';
    const mode = isMasterForgot || isStoreForgot ? 'forgot' : 'reset';
    const loginPath = portal === 'master' ? '/master/login' : '/store/login';
    return (
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
    );
  }

  if (!session && (isMasterLogin || isStoreLogin || isAdminLogin)) {
    return (
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
    );
  }

  const isFullscreenStorefront =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('fullscreen') === '1';

  if (isPublicStorefront || isFullscreenStorefront) {
    const storefrontStoreId =
      path.startsWith('/coffee') ? 'store-coffee' :
      path.startsWith('/car') || path.startsWith('/cars') || path.startsWith('/bleco') ? 'store-bleco' :
      path.startsWith('/flowers') || path.startsWith('/hadaya') ? 'store-1' :
      activeStore?.id;

    return (
      <StatusErrorBoundary onHome={() => navigate('/')} onNavigate={navigate}>
        <div dir={dir} lang={locale} className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
          <div className="flex-1">
            <Suspense fallback={<TabFallback />}>
              <DynamicThemeRenderer storeId={storefrontStoreId} isAdmin={false} />
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
                <Suspense fallback={<TabFallback />}>
                  {masterTab === 'dashboard' && (
                    <MasterDashboard onOpenCreateStore={() => setIsCreateStoreOpen(true)} />
                  )}
                  {masterTab === 'stores' && (
                    <MasterStores onOpenCreateStore={() => setIsCreateStoreOpen(true)} />
                  )}
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
            <CreateStoreModal
              isOpen={isCreateStoreOpen}
              onClose={() => setIsCreateStoreOpen(false)}
            />
          </>
        ) : (
          <>
            <StoreSidebar
              currentTab={storeTab}
              onSelectTab={(tab) => setStoreTab(tab)}
            />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <StoreTopBar
                searchValue={storeSearch}
                onSearchChange={setStoreSearch}
                canAccessMaster={showMasterChrome}
                onSignOut={() => void requestLogout()}
                onOpenProducts={() => setStoreTab('products')}
                onCustomizeTheme={handleOpenCustomizeTheme}
                onNavigateTab={setStoreTab}
                searchPlaceholder={
                  storeTab === 'customers' ? t('searchCustomers') : t('searchStore')
                }
              />
              <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-16">
                <Suspense fallback={<TabFallback />}>
                  {storeTab === 'dashboard' && (
                    <StoreDashboard
                      onNavigateTab={setStoreTab}
                      onCustomizeTheme={handleOpenCustomizeTheme}
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
                    <StoreMarketingHub initialView="whatsapp" onNavigateTab={setStoreTab} />
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
                  {(storeTab === 'backup' || storeTab === 'restore') && <StoreBackupRestoreCenter />}
                  {storeTab === 'coupons' && <StoreCoupons />}
                  {storeTab === 'themes' && (
                    <StoreThemes
                      onOpenStorefront={() => {
                        const storeSlug = activeStore?.slug || (activeStore?.id === 'store-coffee' ? 'coffee' : activeStore?.id === 'store-bleco' ? 'bleco' : 'flowers');
                        navigate(`/?store=${storeSlug}&fullscreen=1`);
                      }}
                      onCustomizeTheme={(tid, page) => handleOpenCustomizeTheme(tid, page)}
                    />
                  )}
                  {storeTab === 'pages' && <StorePages />}
                  {storeTab === 'appstore' && <StoreAppStore />}
                  {storeTab === 'payments' && <StorePayments />}
                  {storeTab === 'settings' && <StoreSettings />}
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
        <AdminContent />
      </DateRangeProvider>
    </PrefsProvider>
  );
}
