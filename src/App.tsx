/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useCallback, useEffect, useState, lazy } from 'react';
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
import { readAuthSession } from './auth/session';
import type { AuthPortal, AuthSession } from './auth/session';
import { logoutPortal, clearAppCache } from './auth/api';
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
const StoreShipping = lazy(() =>
  import('./components/store/StoreShipping').then((m) => ({ default: m.StoreShipping })),
);
const StoreCoupons = lazy(() =>
  import('./components/store/StoreCoupons').then((m) => ({ default: m.StoreCoupons })),
);
const StoreThemes = lazy(() =>
  import('./components/store/StoreThemes').then((m) => ({ default: m.StoreThemes })),
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
const StoreFrontPreview = lazy(() =>
  import('./components/storefront/StoreFrontPreview').then((m) => ({
    default: m.StoreFrontPreview,
  })),
);
const StoreBackupRestoreCenter = lazy(() =>
  import('./components/store/StoreBackupRestoreCenter').then((m) => ({
    default: m.StoreBackupRestoreCenter,
  })),
);

import { DashboardLoader } from './components/common/DashboardLoader';
import { readAllThemeSettings } from './themes/settings/themeSettingsStore';

function TabFallback() {
  const { activeStore } = useTenant();
  const themeSettings = readAllThemeSettings(activeStore?.id || 'makkah-gifts-store', activeStore);
  const isEnabled = themeSettings.colors?.enableDashboardLoader ?? true;
  if (!isEnabled) return null;
  return (
    <DashboardLoader
      enabled={isEnabled}
      logoUrl={themeSettings.colors?.loadingLogoUrl || activeStore?.logo}
    />
  );
}

function AdminContent() {
  const {
    mode,
    setMode,
    activeStore,
    switchToStore,
    switchToMaster,
    canAccessMaster,
    stores,
  } = useTenant();
  const { t, theme, dir, locale } = usePrefs();
  const { toast, confirm } = useToast();
  const [path, navigate] = useSoftPath();
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession());
  const { canTab, firstAllowedTab } = usePermissions();

  // Keep React session in sync with localStorage until explicit logout
  useEffect(() => {
    const sync = () => setSession(readAuthSession());
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
      if (q && q !== 'inventory') return q;
      const saved = typeof localStorage !== 'undefined' && localStorage.getItem('unityteck_store_tab');
      if (saved && saved !== 'inventory') return saved;
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
    const targetTab = tab === 'inventory' ? 'dashboard' : tab;
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
    if (storeTab === 'inventory') {
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
  const isPublicStorefront =
    path === '/' ||
    path === '' ||
    path === '/shop' ||
    path === '/storefront' ||
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
    if (path === '/store' || path === '/store/') {
      if (session) {
        navigate('/admin');
      } else {
        navigate('/admin');
      }
    } else if (path === '/master' || path === '/master/') {
      if (!session) {
        navigate('/master/login');
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
      );
    } else if (path === '/login') {
      navigate('/admin');
    }
  }, [path, navigate, session]);

  // /clear-cache → wipe local demo cache + hard reload (fresh UI)
  useEffect(() => {
    if (!isClearCache) return;
    clearAppCache();
    setSession(null);
    window.location.replace(`/?_=${Date.now()}`);
  }, [isClearCache]);

  // Force login: protected routes without session → start gate
  useEffect(() => {
    if (session) return;
    if (isAuthPage) return;
    if (activeStatus) return;
    navigate('/');
  }, [session, isAuthPage, activeStatus, navigate]);

  // Already signed in on login/register/reset → dashboard
  useEffect(() => {
    if (!session) return;
    if (isMasterLogin || isStoreLogin || isAdminLogin || isStoreRegister || isPasswordFlow) {
      navigate(session.portal === 'master' ? '/master' : '/admin');
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
      setMode('master');
    } else if (session.storeId) {
      switchToStore(session.storeId);
    } else {
      setMode('store');
    }
  }, [session, setMode, switchToStore]);

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
    if (session.portal === 'store' && mode === 'master') {
      if (session.storeId) switchToStore(session.storeId);
      else setMode('store');
    }
  }, [session, mode, setMode, switchToStore]);

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

  const handleLogout = useCallback(async () => {
    await logoutPortal();
    setSession(null);
    navigate('/admin');
  }, [navigate]);

  const requestLogout = useCallback(async () => {
    const ok = await confirm({
      title: t('signOut'),
      message: t('signOutConfirm'),
      confirmLabel: t('signOut'),
      cancelLabel: t('cancel'),
      danger: true,
    });
    if (ok) await handleLogout();
  }, [confirm, handleLogout, t]);

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
        onOpenStore={() => navigate('/store/login')}
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
    return (
      <StatusErrorBoundary onHome={() => navigate('/')} onNavigate={navigate}>
        <div dir={dir} lang={locale} className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<TabFallback />}>
              <StoreFrontPreview isAdmin={false} />
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
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
              <MasterTopBar
                onOpenCreateStore={() => setIsCreateStoreOpen(true)}
                onSignOut={() => void requestLogout()}
              />
              <main className="flex-1 pb-16">
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
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
              <StoreTopBar
                searchValue={storeSearch}
                onSearchChange={setStoreSearch}
                canAccessMaster={showMasterChrome}
                onSignOut={() => void requestLogout()}
                onOpenStorefront={() => setStoreTab('storefront')}
                onOpenProducts={() => setStoreTab('products')}
                searchPlaceholder={
                  storeTab === 'customers' ? t('searchCustomers') : t('searchStore')
                }
              />
              <main className="flex-1 pb-16">
                <Suspense fallback={<TabFallback />}>
                  {storeTab === 'dashboard' && (
                    <StoreDashboard onNavigateTab={(tab) => setStoreTab(tab)} />
                  )}
                  {storeTab === 'storefront' && <StoreFrontPreview isAdmin={true} />}
                  {storeTab === 'customers' && <StoreCustomers />}
                  {storeTab === 'marketing' && (
                    <StoreMarketingHub onNavigateTab={(tab) => setStoreTab(tab)} />
                  )}
                  {storeTab === 'analytics' && (
                    <StoreAnalytics onNavigateTab={(tab) => setStoreTab(tab)} />
                  )}
                  {storeTab === 'reports' && <StoreReports />}
                  {storeTab === 'whatsapp' && (
                    <StoreMarketingHub initialView="whatsapp" onNavigateTab={(tab) => setStoreTab(tab)} />
                  )}
                  {storeTab === 'seo' && <StoreSEO />}
                  {storeTab === 'products' && <StoreProducts />}
                  {storeTab === 'media' && <StoreMediaLibrary />}
                  {storeTab === 'categories' && <StoreCategories />}
                  {storeTab === 'brands' && <StoreBrandsView onBackToProducts={() => setStoreTab('products')} />}
                  {storeTab === 'orders' && <StoreOrders />}
                  {storeTab === 'shipping' && <StoreShipping />}
                  {storeTab === 'hosting' && <StoreHostingDomain />}
                  {(storeTab === 'backup' || storeTab === 'restore') && <StoreBackupRestoreCenter />}
                  {storeTab === 'coupons' && (
                    <StoreCoupons onViewStorefront={() => setStoreTab('storefront')} />
                  )}
                  {storeTab === 'themes' && (
                    <StoreThemes onOpenStorefront={() => setStoreTab('storefront')} />
                  )}
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
      <AdminContent />
    </PrefsProvider>
  );
}
