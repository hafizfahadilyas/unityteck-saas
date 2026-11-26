/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useCallback, useEffect, useState, useRef } from 'react';
import { TenantProvider, useTenant } from './context/TenantContext';
import { MasterSidebar } from './components/master/MasterSidebar';
import { MasterTopBar } from './components/master/MasterTopBar';
import { MasterDashboard } from './components/master/MasterDashboard';
import { CreateStoreModal } from './components/master/CreateStoreModal';

import { StoreSidebar } from './components/store/StoreSidebar';
import { StoreTopBar } from './components/store/StoreTopBar';
import { SocialOAuthDialogView } from './components/store/SocialOAuthDialogView';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { isClerkConfigured } from './auth/clerkSession';
import { StorefrontCustomerResume } from './auth/StorefrontCustomerResume';
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
import { readAuthSession, clearAuthSession, writeAuthSession } from './auth/session';
import type { AuthPortal, AuthSession } from './auth/session';
import { logoutPortal, clearAppCache } from './auth/api';
import { isMasterAdminHost, redirectToCentralMaster } from './auth/masterHost';
import {
  isKnownAppPath,
  isStatusPath,
  resolveStatusKind,
} from './status/routes';
import {
  buildStorefrontHomeUrl,
  isPublicStoreSlugPath,
  storeIdFromPublicLocation,
  storeSlugFromStorePath,
} from './utils/storefrontLinks';
import { useToast } from './components/common/ToastProvider';
import { applyPortalHead } from './utils/portalHead';
import { readStoreIdentity, resolveStoreDisplayName } from './themes/settings/storeIdentity';
import { lazyWithRetry, reloadOnceForStaleChunk } from './utils/lazyWithRetry';
import { Lock, ShieldAlert } from 'lucide-react';
import { CORE_STORE_CONTROL_IDS, isStoreControlEnabled } from './services/storeControlService';
import { getDefaultStoreTheme } from './auth/defaultTheme';
import { isStoreTabComingSoon } from './config/storeTabVisibility';
import { adminHomeHref, isAdminChromePath, isStorefrontPath } from './utils/spaNavigationGuard';
import { useAdminInnerLayer } from './hooks/useAdminInnerLayer';
import { SkeletonProvider, SkeletonPage } from './components/common/skeleton';
// HolstChromeBar retired — unified MasterTopBar / StoreTopBar (docs/21)

/** Heavy tabs — code-split so dashboard/themes open fast */
const StoreDashboard = lazyWithRetry(() =>
  import('./components/store/StoreDashboard').then((m) => ({ default: m.StoreDashboard })),
);
const MasterStores = lazyWithRetry(() =>
  import('./components/master/MasterStores').then((m) => ({ default: m.MasterStores })),
);
const MasterControlCenter = lazyWithRetry(() =>
  import('./components/master/MasterControlCenter').then((m) => ({ default: m.MasterControlCenter })),
);
const MasterOnboarding = lazyWithRetry(() =>
  import('./components/master/MasterOnboarding').then((m) => ({ default: m.MasterOnboarding })),
);
const MasterDomains = lazyWithRetry(() =>
  import('./components/master/MasterDomains').then((m) => ({ default: m.MasterDomains })),
);
const MasterUpdates = lazyWithRetry(() =>
  import('./components/master/MasterUpdates').then((m) => ({ default: m.MasterUpdates })),
);
const MasterThemes = lazyWithRetry(() =>
  import('./components/master/MasterThemes').then((m) => ({ default: m.MasterThemes })),
);
const MasterCanvaStudio = lazyWithRetry(() =>
  import('./components/master/MasterCanvaStudio').then((m) => ({ default: m.MasterCanvaStudio })),
);
const MasterRealCanvaConnect = lazyWithRetry(() =>
  import('./components/master/MasterRealCanvaConnect').then((m) => ({
    default: m.MasterRealCanvaConnect,
  })),
);
const MasterMarketplace = lazyWithRetry(() =>
  import('./components/master/MasterMarketplace').then((m) => ({ default: m.MasterMarketplace })),
);
const MasterSEO = lazyWithRetry(() =>
  import('./components/master/MasterSEO').then((m) => ({ default: m.MasterSEO })),
);
const MasterDatabase = lazyWithRetry(() =>
  import('./components/master/MasterDatabase').then((m) => ({ default: m.MasterDatabase })),
);
const MasterGeneralView = lazyWithRetry(() =>
  import('./components/master/MasterGeneralView').then((m) => ({ default: m.MasterGeneralView })),
);
const MasterOrders = lazyWithRetry(() =>
  import('./components/master/MasterOrders').then((m) => ({ default: m.MasterOrders })),
);
const MasterProducts = lazyWithRetry(() =>
  import('./components/master/MasterProducts').then((m) => ({ default: m.MasterProducts })),
);
const MasterAccountManagement = lazyWithRetry(() =>
  import('./components/master/MasterAccountManagement').then((m) => ({
    default: m.MasterAccountManagement,
  })),
);
const MasterPlansSubscriptions = lazyWithRetry(() =>
  import('./components/master/MasterPlansSubscriptions').then((m) => ({
    default: m.MasterPlansSubscriptions,
  })),
);
const MasterSecurityCenter = lazyWithRetry(() =>
  import('./components/master/MasterSecurityCenter').then((m) => ({
    default: m.MasterSecurityCenter,
  })),
);
const MasterNotificationsHub = lazyWithRetry(() =>
  import('./components/master/MasterNotificationsHub').then((m) => ({
    default: m.MasterNotificationsHub,
  })),
);
const MasterSupportCenter = lazyWithRetry(() =>
  import('./components/master/MasterSupportCenter').then((m) => ({
    default: m.MasterSupportCenter,
  })),
);
const MasterPlatformBlog = lazyWithRetry(() =>
  import('./components/master/MasterPlatformBlog').then((m) => ({
    default: m.MasterPlatformBlog,
  })),
);
const PlatformBlogPublicView = lazyWithRetry(() =>
  import('./components/public/PlatformBlogPublicView').then((m) => ({
    default: m.PlatformBlogPublicView,
  })),
);
const StoreHelpChatbot = lazyWithRetry(() =>
  import('./components/store/StoreHelpChatbot').then((m) => ({
    default: m.StoreHelpChatbot,
  })),
);
const MasterServicesPoints = lazyWithRetry(() =>
  import('./components/master/MasterServicesPoints').then((m) => ({
    default: m.MasterServicesPoints,
  })),
);
const MasterIntegrationsHub = lazyWithRetry(() =>
  import('./components/master/MasterIntegrationsHub').then((m) => ({
    default: m.MasterIntegrationsHub,
  })),
);
const MasterOpenAiManagement = lazyWithRetry(() =>
  import('./components/master/MasterOpenAiManagement').then((m) => ({
    default: m.MasterOpenAiManagement,
  })),
);
const MasterGeminiSettings = lazyWithRetry(() =>
  import('./components/master/MasterGeminiSettings').then((m) => ({
    default: m.MasterGeminiSettings,
  })),
);
const MasterReportsOps = lazyWithRetry(() =>
  import('./components/master/MasterReportsOps').then((m) => ({
    default: m.MasterReportsOps,
  })),
);
const MasterCapabilityDeferred = lazyWithRetry(() =>
  import('./components/master/MasterCapabilityDeferred').then((m) => ({
    default: m.MasterCapabilityDeferred,
  })),
);
const MasterOpsMonitor = lazyWithRetry(() =>
  import('./components/master/MasterOpsMonitor').then((m) => ({
    default: m.MasterOpsMonitor,
  })),
);
const MasterMessagingHub = lazyWithRetry(() =>
  import('./components/master/MasterMessagingHub').then((m) => ({
    default: m.MasterMessagingHub,
  })),
);
const MasterGovernanceHub = lazyWithRetry(() =>
  import('./components/master/MasterGovernanceHub').then((m) => ({
    default: m.MasterGovernanceHub,
  })),
);
const StoreCustomers = lazyWithRetry(() =>
  import('./components/store/StoreCustomers').then((m) => ({ default: m.StoreCustomers })),
);
const StoreMarketingHub = lazyWithRetry(() =>
  import('./components/store/StoreMarketingHub').then((m) => ({
    default: m.StoreMarketingHub,
  })),
);
const StoreAnalytics = lazyWithRetry(() =>
  import('./components/store/StoreAnalytics').then((m) => ({ default: m.StoreAnalytics })),
);
const StoreReports = lazyWithRetry(() =>
  import('./components/store/StoreReports').then((m) => ({ default: m.StoreReports })),
);
const StoreChannelPerformance = lazyWithRetry(() =>
  import('./components/store/StoreChannelPerformance').then((m) => ({
    default: m.StoreChannelPerformance,
  })),
);
const StoreSEO = lazyWithRetry(() =>
  import('./components/store/StoreSEO').then((m) => ({ default: m.StoreSEO })),
);
const StoreProducts = lazyWithRetry(() =>
  import('./components/store/StoreProducts').then((m) => ({ default: m.StoreProducts })),
);
const StoreMediaLibrary = lazyWithRetry(() =>
  import('./components/store/StoreMediaLibrary').then((m) => ({ default: m.StoreMediaLibrary })),
);
const StoreCanvaStudio = lazyWithRetry(() =>
  import('./components/store/StoreCanvaStudio').then((m) => ({ default: m.StoreCanvaStudio })),
);
const StoreAiToolsHub = lazyWithRetry(() =>
  import('./components/store/StoreAiToolsHub').then((m) => ({ default: m.StoreAiToolsHub })),
);
const StoreAiStudio = lazyWithRetry(() =>
  import('./components/store/StoreAiStudio').then((m) => ({ default: m.StoreAiStudio })),
);
const StoreCategories = lazyWithRetry(() =>
  import('./components/store/StoreCategories').then((m) => ({ default: m.StoreCategories })),
);
const StoreOrders = lazyWithRetry(() =>
  import('./components/store/StoreOrders').then((m) => ({ default: m.StoreOrders })),
);
const StoreAppointments = lazyWithRetry(() =>
  import('./components/store/StoreAppointments').then((m) => ({ default: m.StoreAppointments })),
);
const StoreInvoices = lazyWithRetry(() =>
  import('./components/store/invoices/StoreInvoices').then((m) => ({ default: m.StoreInvoices })),
);
const StoreShipping = lazyWithRetry(() =>
  import('./components/store/StoreShipping').then((m) => ({ default: m.StoreShipping })),
);
const StorePayments = lazyWithRetry(() =>
  import('./components/store/StorePayments').then((m) => ({ default: m.StorePayments })),
);
const StoreCoupons = lazyWithRetry(() =>
  import('./components/store/StoreCoupons').then((m) => ({ default: m.StoreCoupons })),
);
const StoreAbandonedCarts = lazyWithRetry(() =>
  import('./components/store/StoreAbandonedCarts').then((m) => ({ default: m.StoreAbandonedCarts })),
);
const StoreCartOffers = lazyWithRetry(() =>
  import('./components/store/StoreCartOffers').then((m) => ({ default: m.StoreCartOffers })),
);
const StorePromotionalOffers = lazyWithRetry(() =>
  import('./components/store/StorePromotionalOffers').then((m) => ({ default: m.StorePromotionalOffers })),
);
const StoreBankOffers = lazyWithRetry(() =>
  import('./components/store/StoreBankOffers').then((m) => ({ default: m.StoreBankOffers })),
);
const StoreCashback = lazyWithRetry(() =>
  import('./components/store/StoreCashback').then((m) => ({ default: m.StoreCashback })),
);
const StoreGiftingSystem = lazyWithRetry(() =>
  import('./components/store/StoreGiftingSystem').then((m) => ({ default: m.StoreGiftingSystem })),
);
const StoreLoyaltyProgram = lazyWithRetry(() =>
  import('./components/store/StoreLoyaltyProgram').then((m) => ({ default: m.StoreLoyaltyProgram })),
);
const StoreRepurchaseReminders = lazyWithRetry(() =>
  import('./components/store/StoreRepurchaseReminders').then((m) => ({ default: m.StoreRepurchaseReminders })),
);
const StoreAffiliateMarketing = lazyWithRetry(() =>
  import('./components/store/StoreAffiliateMarketing').then((m) => ({ default: m.StoreAffiliateMarketing })),
);
const StoreDirectOrders = lazyWithRetry(() =>
  import('./components/store/StoreDirectOrders').then((m) => ({ default: m.StoreDirectOrders })),
);
const StoreThemes = lazyWithRetry(() =>
  import('./components/store/StoreThemes').then((m) => ({ default: m.StoreThemes })),
);
const StorePages = lazyWithRetry(() =>
  import('./components/store/StorePages').then((m) => ({ default: m.StorePages })),
);
const StoreBlogManagement = lazyWithRetry(() =>
  import('./components/store/blog/StoreBlogManagement').then((m) => ({ default: m.StoreBlogManagement })),
);
const StoreWhatsAppManager = lazyWithRetry(() =>
  import('./components/store/whatsapp/StoreWhatsAppManager').then((m) => ({ default: m.StoreWhatsAppManager })),
);
const StoreTabComingSoon = lazyWithRetry(() =>
  import('./components/store/StoreTabComingSoon').then((m) => ({ default: m.StoreTabComingSoon })),
);
const StoreSocialPublisher = lazyWithRetry(() =>
  import('./components/store/StoreSocialPublisher').then((m) => ({ default: m.StoreSocialPublisher })),
);
const StoreArticleCommerceTools = lazyWithRetry(() =>
  import('./components/store/blog/StoreArticleCommerceTools').then((m) => ({ default: m.StoreArticleCommerceTools })),
);
const StoreAppStore = lazyWithRetry(() =>
  import('./components/store/StoreAppStore').then((m) => ({ default: m.StoreAppStore })),
);
const StoreHostingDomain = lazyWithRetry(() =>
  import('./components/store/StoreHostingDomain').then((m) => ({ default: m.StoreHostingDomain })),
);
const StoreMarketplacePlans = lazyWithRetry(() =>
  import('./components/store/StoreMarketplacePlans').then((m) => ({ default: m.StoreMarketplacePlans })),
);
const StoreBrandsView = lazyWithRetry(() =>
  import('./components/store/StoreBrandsView').then((m) => ({ default: m.StoreBrandsView })),
);
const MasterSettings = lazyWithRetry(() =>
  import('./components/master/MasterSettings').then((m) => ({ default: m.MasterSettings })),
);
const StoreSettings = lazyWithRetry(() =>
  import('./components/store/StoreSettings').then((m) => ({ default: m.StoreSettings })),
);
const DynamicThemeRenderer = lazyWithRetry(() =>
  import('./components/storefront/DynamicThemeRenderer').then((m) => ({
    default: m.DynamicThemeRenderer,
  })),
);
const StoreBackupRestoreCenter = lazyWithRetry(() =>
  import('./components/store/StoreBackupRestoreCenter').then((m) => ({
    default: m.StoreBackupRestoreCenter,
  })),
);
import { preloadVisualThemeBuilder } from './components/store/visualBuilder/preloadVisualBuilder';
import { ThemeBuilderLoadingShell } from './components/store/visualBuilder/ThemeBuilderLoadingShell';
import { preloadWordPressThemeCustomizer } from './components/store/themeCustomizer/preloadWordPressThemeCustomizer';

const VisualThemeBuilder = lazyWithRetry<React.ComponentType<any>>(() =>
  preloadVisualThemeBuilder().then((m: any) => ({
    default: m.VisualThemeBuilder,
  })),
);

const WordPressThemeCustomizer = lazyWithRetry(() =>
  preloadWordPressThemeCustomizer().then((m: any) => ({
    default: m.WordPressThemeCustomizer,
  })),
);

import { DateRangeProvider } from './context/DateRangeContext';
import { NotificationsProvider, useNotifications } from './notification-system';

const NotificationCenter = lazyWithRetry(() =>
  import('./notification-system/components/NotificationCenter').then((m) => ({
    default: m.NotificationCenter,
  })),
);

function NotificationCenterPage({ onNavigateTab }: { onNavigateTab: (tab: string) => void }) {
  const { activeStore } = useTenant();
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
      storeId={activeStore?.id}
      notifications={notifications}
      onAction={(item) => handleAction(item, onNavigateTab)}
      onMarkRead={markAsRead}
      onMarkAllRead={markAllAsRead}
      onDismiss={dismissNotification}
      onSnooze={snoozeNotification}
    />
  );
}

/** Ultra-light tab switch fallback — no theme-settings I/O, no brand splash (full speed). */
function TabFallback() {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const isPreviewEmbed =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('preview') === '1' ||
      new URLSearchParams(window.location.search).get('embed') === '1');

  const [slow, setSlow] = React.useState(false);
  React.useEffect(() => {
    // Public storefront (/coffee/buy/…) can stay on Suspense >3.5s while nested
    // theme chunks load — NEVER auto hard-reload there (caused BAR-BAR refresh).
    const path = String(window.location.pathname || '').toLowerCase();
    const isPublicStorefrontSurface =
      path.startsWith('/coffee') ||
      path.startsWith('/flowers') ||
      path.startsWith('/hadaya') ||
      path.startsWith('/car') ||
      path.startsWith('/cars') ||
      path.startsWith('/bleco') ||
      path.startsWith('/public_html') ||
      path.startsWith('/buy') ||
      path.startsWith('/product') ||
      path.startsWith('/catalog') ||
      path.startsWith('/products') ||
      path === '/' ||
      path === '';
    const auto = isPublicStorefrontSurface
      ? 0
      : window.setTimeout(() => reloadOnceForStaleChunk(), 3500);
    const t = window.setTimeout(() => setSlow(true), 5000);
    return () => {
      if (auto) window.clearTimeout(auto);
      window.clearTimeout(t);
    };
  }, []);

  if (isPreviewEmbed) {
    return <div className="min-h-[40vh] w-full bg-white dark:bg-slate-950" aria-busy="true" />;
  }

  return (
    <div
      className="w-full min-h-[50vh] p-4 sm:p-6 space-y-4"
      aria-busy="true"
      role="status"
    >
      <SkeletonPage layout="dashboard" hasHeader={false} />
      {slow ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className="text-xs font-semibold underline underline-offset-2 px-3 py-1.5 rounded-lg bg-[var(--surface,#ffffff)] shadow-sm border border-[var(--border,#cbd5e1)]"
            style={{ color: 'var(--muted, #64748b)' }}
            onClick={() => {
              try {
                sessionStorage.removeItem('chunk_lazy_reload');
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
          >
            {isAr ? 'التحميل بطيء — إعادة المحاولة' : 'Still loading — tap to retry'}
          </button>
        </div>
      ) : null}
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
          // Builder active — keep theme in state/session; omit default coffee themeId from URL
          if (currentStoreTheme === 'theme-coffee-artisan') {
            url.searchParams.delete('themeId');
          } else {
            url.searchParams.set('themeId', currentStoreTheme);
          }
          url.searchParams.delete('page');
          url.searchParams.delete('product');
          url.searchParams.delete('productId');
          window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
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
      const page = targetPage || 'home';
      sessionStorage.setItem('unityteck_visual_builder_page', page);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        // Short clean builder URL — drop storefront preview junk + dashboard clutter
        url.searchParams.delete('page');
        url.searchParams.delete('product');
        url.searchParams.delete('productId');
        url.searchParams.delete('tab');
        url.searchParams.delete('customizer');
        url.searchParams.delete('customize');
        url.searchParams.delete('section');
        url.searchParams.set('builder', '1');
        url.searchParams.set('builderPage', page);
        // theme stays in sessionStorage; keep themeId only when non-default coffee artisan
        if (selectedThemeId && selectedThemeId !== 'theme-coffee-artisan') {
          url.searchParams.set('themeId', selectedThemeId);
        } else {
          url.searchParams.delete('themeId');
        }
        window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
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
        url.searchParams.set('tab', 'themes');
        window.history.replaceState({}, '', url.toString());
        localStorage.setItem('unityteck_store_tab', 'themes');
      }
    } catch {}
  }, []);

  const { requestClose: requestCloseVisualBuilder } = useAdminInnerLayer(
    isVisualBuilderOpen,
    handleCloseVisualBuilder,
  );

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

  const { requestClose: requestCloseThemeCustomizer } = useAdminInnerLayer(
    isThemeCustomizerOpen,
    handleCloseThemeCustomizer,
  );

  // Sidebar → Theme Settings opens the real customizer page (not a dead click)
  useEffect(() => {
    const openFromSidebar = () => {
      try {
        sessionStorage.removeItem('unityteck-theme-intent');
      } catch {
        /* storage may be unavailable */
      }
      handleOpenThemeCustomizer('01_store_identity');
    };
    window.addEventListener('unityteck-open-theme-settings', openFromSidebar as EventListener);
    try {
      if (sessionStorage.getItem('unityteck-theme-intent') === 'theme-settings') {
        openFromSidebar();
      }
    } catch {
      /* storage may be unavailable */
    }
    return () => {
      window.removeEventListener('unityteck-open-theme-settings', openFromSidebar as EventListener);
    };
  }, [handleOpenThemeCustomizer]);

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
      const normalize = (tab: string) => {
        if (tab === 'inventory' || tab === 'storefront') return 'dashboard';
        // Coming-soon tabs stay selectable — content shows StoreTabComingSoon
        return tab;
      };
      const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
      if (q) return normalize(q);
      const saved = typeof localStorage !== 'undefined' && localStorage.getItem('unityteck_store_tab');
      if (saved) return normalize(saved);
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
        // Master URLs stay SEO-clean for the portal — no store=flowers leak.
        url.searchParams.delete('store');
        const href = `${url.pathname}${url.search}${url.hash}`;
        const state = { unityteckSpa: 'master', tab };
        // replaceState only — pushState stacked tabs and made Back jump randomly.
        window.history.replaceState(state, '', href);
      }
    } catch {}
  }, []);

  const STORE_KNOWN_TABS = React.useMemo(
    () =>
      new Set([
        'dashboard',
        'notifications',
        'customers',
        'marketing',
        'analytics',
        'reports',
        'whatsapp',
        'email',
        'sms',
        'live-chat',
        'in-app-notifications',
        'ai-conversations',
        'social',
        'seo',
        'products',
        'media',
        'canva',
        'canva-studio',
        'canva-banner',
        'canva-logo',
        'canva-product-card',
        'ai-media',
        'categories',
        'brands',
        'orders',
        'appointments',
        'invoices',
        'shipping',
        'hosting',
        'coupons',
        'abandoned-carts',
        'promotions',
        'campaigns',
        'cart-offers',
        'bank-offers',
        'cashback',
        'gifting',
        'loyalty',
        'repurchase-reminders',
        'affiliate',
        'direct-orders',
        'themes',
        'pages',
        'blog',
        'commerce-tools',
        'appstore',
        'mobile-app',
        'payments',
        'settings',
      ]),
    [],
  );

  const setStoreTab = React.useCallback((tab: string) => {
    let targetTab = tab === 'inventory' || tab === 'storefront' || tab === 'builder' ? 'dashboard' : tab;
    // Coming-soon tabs remain navigable (sidebar shows Soon; page is Coming Soon panel)
    if (!STORE_KNOWN_TABS.has(targetTab)) targetTab = 'dashboard';
    setStoreTabState(targetTab);
    try {
      localStorage.setItem('unityteck_store_tab', targetTab);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', targetTab);
        const href = `${url.pathname}${url.search}${url.hash}`;
        const state = { unityteckSpa: 'admin', tab: targetTab };
        // replaceState only — tab pushState stacked history so Back left the page
        // (products → shipping → AI) instead of closing the open inner layer.
        window.history.replaceState(state, '', href);
      }
    } catch {}
  }, [STORE_KNOWN_TABS]);

  useEffect(() => {
    const onOpenStoreTab = (e: Event) => {
      const tab = (e as CustomEvent<string>).detail;
      if (typeof tab === 'string' && tab.trim()) setStoreTab(tab.trim());
    };
    window.addEventListener('unityteck-open-store-tab', onOpenStoreTab);
    return () => window.removeEventListener('unityteck-open-store-tab', onOpenStoreTab);
  }, [setStoreTab]);

  const builderExitRef = React.useRef(false);
  useEffect(() => {
    if (isVisualBuilderOpen) {
      builderExitRef.current = true;
      return;
    }
    if (!builderExitRef.current) return;
    builderExitRef.current = false;
    setStoreTab('dashboard');
  }, [isVisualBuilderOpen, setStoreTab]);

  useEffect(() => {
    if (storeTab === 'inventory' || storeTab === 'storefront') {
      setStoreTab('dashboard');
    }
  }, [storeTab, setStoreTab]);

  // Warm Store Settings chunk so tab open is not a blank spinner
  useEffect(() => {
    if (mode !== 'store') return;
    const warm = () => {
      void import('./components/store/StoreSettings');
    };
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback;
    if (typeof ric === 'function') {
      const id = ric(warm, { timeout: 2500 });
      return () => {
        const cancel = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
        cancel?.(id);
      };
    }
    const t = window.setTimeout(warm, 900);
    return () => window.clearTimeout(t);
  }, [mode]);

  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [selectedCommerceArticleId, setSelectedCommerceArticleId] = useState<string | undefined>(undefined);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [mode, masterTab, storeTab]);

  // Keep Master portal URLs clean — strip leftover store=flowers from dashboard deep links.
  useEffect(() => {
    if (mode !== 'master' || typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (!url.pathname.toLowerCase().startsWith('/master')) return;
      if (!url.searchParams.has('store')) return;
      url.searchParams.delete('store');
      window.history.replaceState({}, '', url.toString());
    } catch {
      /* ignore */
    }
  }, [mode, masterTab]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    const onResize = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen]);

  const isMasterLogin =
    path === '/master/login' ||
    path === '/masteradmin/login' ||
    (!session &&
      (path === '/master' ||
        path === '/master/' ||
        path === '/masteradmin' ||
        path === '/masteradmin/'));
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
  const isShortOnboard =
    path.startsWith('/join/') ||
    path.startsWith('/j/') ||
    path.startsWith('/onboard/');
  const isStoreRegister =
    path === '/store/register' || path === '/register' || isShortOnboard;
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
    isPublicStoreSlugPath(path) ||
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
    path.startsWith('/catalog/') ||
    path === '/products' ||
    path.startsWith('/products/') ||
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
    path === '/buy' ||
    path.startsWith('/buy/') ||
    path.startsWith('/category/');
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

  // Browser Back inside admin/master: stay on dashboard — never dump to storefront
  useEffect(() => {
    if (isPublicStorefront || isAuthPage) return;
    if (mode !== 'store' && mode !== 'master') return;

    const onPop = () => {
      try {
        const popPath = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        const tabParam = (params.get('tab') || '').trim();

        if (mode === 'store') {
          if (!isAdminChromePath(popPath) || isStorefrontPath(popPath)) {
            const href = adminHomeHref('admin');
            window.history.pushState({ unityteckSpa: 'admin', tab: 'dashboard' }, '', href);
            setStoreTabState('dashboard');
            try {
              localStorage.setItem('unityteck_store_tab', 'dashboard');
            } catch {}
            return;
          }
          const next =
            tabParam &&
            tabParam !== 'inventory' &&
            tabParam !== 'storefront' &&
            STORE_KNOWN_TABS.has(tabParam)
              ? tabParam
              : 'dashboard';
          setStoreTabState(next);
          try {
            localStorage.setItem('unityteck_store_tab', next);
          } catch {}
          // Stay on current admin URL — do NOT re-push dashboard (that stacked
          // fake entries and made one Back jump out of every inner page).
          if (next === 'dashboard') {
            const href = adminHomeHref('admin');
            const cur = `${window.location.pathname}${window.location.search}`;
            if (cur !== href.split('#')[0]) {
              window.history.replaceState(
                { unityteckSpa: 'admin', tab: 'dashboard' },
                '',
                href,
              );
            }
          }
          return;
        }

        if (!popPath.includes('/master')) {
          const href = adminHomeHref('master');
          window.history.pushState({ unityteckSpa: 'master', tab: 'dashboard' }, '', href);
          setMasterTabState('dashboard');
          try {
            localStorage.setItem('unityteck_master_tab', 'dashboard');
          } catch {}
          return;
        }
        const next = tabParam || 'dashboard';
        setMasterTabState(next);
        try {
          localStorage.setItem('unityteck_master_tab', next);
        } catch {}
        if (next === 'dashboard') {
          const href = adminHomeHref('master');
          const cur = `${window.location.pathname}${window.location.search}`;
          if (cur !== href.split('#')[0]) {
            window.history.replaceState(
              { unityteckSpa: 'master', tab: 'dashboard' },
              '',
              href,
            );
          }
        }
      } catch {}
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [mode, isPublicStorefront, isAuthPage, STORE_KNOWN_TABS]);

  // Master Admin = central Hostinger only (mieraf-ksa.com). Flowers/store hosts bounce away.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onMasterPath =
      path.startsWith('/master') ||
      path.startsWith('/masteradmin') ||
      (typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('portal') === 'master');
    if (!onMasterPath) return;
    if (isMasterAdminHost(window.location.hostname)) return;
    const search = window.location.search || '';
    const dest =
      path.startsWith('/master') || path.startsWith('/masteradmin')
        ? `${path.startsWith('/masteradmin') ? path.replace(/^\/masteradmin/, '/master') : path}${search}`
        : `/master/login${search}`;
    redirectToCentralMaster(dest.startsWith('/master') ? dest : `/master/login${search}`);
  }, [path]);

  // giftshop-sa.com/admin (no ?store=) → keep merchant on flowers admin, never bare frontend.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!path.startsWith('/admin')) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('store') || params.get('demo')) return;
    const host = window.location.hostname.toLowerCase().replace(/^www\./, '');
    let slug = '';
    if (host.includes('giftshop') || host.includes('makkah') || host.includes('flowers')) {
      slug = 'flowers';
    } else if (host.includes('mieraf') || host.includes('hibrew') || host.includes('coffee')) {
      slug = 'coffee';
    } else if (host.includes('bleco') || host.includes('tanjeed') || host.includes('alsaeedi')) {
      slug = 'car';
    } else if (resolvedDomain?.resolved && resolvedDomain.storeId) {
      const sid = String(resolvedDomain.storeId);
      slug =
        sid === 'store-1' ? 'flowers' : sid === 'store-coffee' ? 'coffee' : sid === 'store-bleco' ? 'car' : '';
    }
    if (!slug) return;
    params.set('store', slug);
    if (!params.get('tab') && !session) params.set('tab', 'dashboard');
    navigate(`${path}?${params.toString()}`, { replace: true });
  }, [path, navigate, resolvedDomain?.resolved, resolvedDomain?.storeId, session]);

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
    } else if (path === '/store' || path === '/store/') {
      navigate(`/admin${search}`, { replace: true });
    } else if (path === '/master' || path === '/master/') {
      if (!session) {
        navigate(`/master/login${search}`, { replace: true });
      }
    } else if (path === '/masteradmin' || path === '/masteradmin/') {
      if (!session) {
        navigate(`/master/login${search}`, { replace: true });
      } else {
        navigate(`/master${search}`, { replace: true });
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
    } else if (
      path.startsWith('/join/') ||
      path.startsWith('/j/') ||
      path.startsWith('/onboard/')
    ) {
      const code = path.split('/').filter(Boolean)[1];
      if (code) {
        navigate(`/store/register?invite=${encodeURIComponent(decodeURIComponent(code))}`, {
          replace: true,
        });
      } else {
        navigate('/store/register', { replace: true });
      }
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
    // Normalize malformed deep-links like ?store%3Dcoffee=&customizer=1 → store=coffee
    let storeParam = (params.get('store') || params.get('demo') || '').toLowerCase().trim();
    if (!storeParam) {
      for (const key of [...params.keys()]) {
        if (key.toLowerCase().startsWith('store=')) {
          storeParam = key.slice(6).replace(/=+$/, '').toLowerCase().trim();
          params.delete(key);
          if (storeParam) params.set('store', storeParam);
          try {
            const next = `${window.location.pathname}?${params.toString()}${window.location.hash || ''}`;
            window.history.replaceState({}, '', next.replace(/\?$/, ''));
          } catch {
            /* ignore */
          }
          break;
        }
      }
    }
    if (!storeParam) {
      const rawMatch = window.location.search.match(/[?&]store(?:=|%3D)([^&]*)/i);
      if (rawMatch?.[1]) {
        storeParam = decodeURIComponent(rawMatch[1]).replace(/=+$/, '').toLowerCase().trim();
        if (storeParam) {
          params.set('store', storeParam);
          try {
            const next = `${window.location.pathname}?${params.toString()}${window.location.hash || ''}`;
            window.history.replaceState({}, '', next);
          } catch {
            /* ignore */
          }
        }
      }
    }
    const pathnameLower = window.location.pathname.toLowerCase();
    const effectiveSlug =
      storeParam ||
      (pathnameLower.startsWith('/coffee') || pathnameLower.startsWith('/public_html') ? 'coffee' :
       pathnameLower.startsWith('/bleco') || pathnameLower.startsWith('/car') ? 'bleco' :
       pathnameLower.startsWith('/flowers') || pathnameLower.startsWith('/hadaya') ? 'flowers' :
       (resolvedDomain?.resolved && resolvedDomain.storeId ? resolvedDomain.storeId : ''));
    if (!effectiveSlug) return;
    const tabParam = params.get('tab');

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

    // Password / ?autologin=1 bypass removed — email OTP (Clerk) only.
    if (targetStoreId === 'master') {
      return;
    }

    if (isPublicStorefront) {
      if (activeStore?.id !== targetStoreId) {
        switchToStore(targetStoreId);
      }
      return;
    }

    // Admin: switch tenant context only — never mint a session without OTP.
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

      if (!session) {
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

  // Recover a lifetime session before sending the admin to the gate.
  // Never resurrect a session right after explicit Sign out (unityteck_explicit_logout).
  // Never bounce admin/master routes to storefront "/" — that looked like "login redirects to frontend".
  useEffect(() => {
    const p = typeof window !== 'undefined' ? window.location.pathname : path;
    // /store/{slug} is public storefront preview — not merchant admin chrome
    const onAdminSurface =
      p === '/admin' ||
      p.startsWith('/admin/') ||
      p.startsWith('/master') ||
      (p.startsWith('/store') && !isPublicStoreSlugPath(p));

    if (session) {
      // HIGH ALERT: customer/web storefront must NEVER land on merchant /admin.
      // Only recover into dashboard when the URL is already an admin surface.
      if (
        onAdminSurface &&
        (p === '/' || p === '') &&
        session.portal === 'store' &&
        !isPublicStorefront &&
        !isFullscreenParam &&
        !isTabStorefrontParam
      ) {
        const sid = session.storeId || '';
        const slug =
          sid === 'store-coffee' ? 'coffee' : sid === 'store-bleco' ? 'car' : sid === 'store-1' ? 'flowers' : '';
        navigate(slug ? `/admin?store=${slug}&tab=dashboard` : '/admin?tab=dashboard', { replace: true });
      }
      return;
    }

    const recovered = readAuthSession();
    if (recovered?.token) {
      setSession(recovered);
      return;
    }

    // Hard rule: /admin* and /master* never dump to storefront homepage.
    if (onAdminSurface) {
      if (isAuthPage) return;
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const loginTarget = p.startsWith('/master')
        ? `/master/login${search}`
        : p.startsWith('/admin') || p === '/admin'
          ? `/admin${search || ''}`
          : `/store/login${search}`;
      if (`${p}${search}` !== loginTarget) {
        navigate(loginTarget, { replace: true });
      }
      return;
    }
    if (isAuthPage) return;
    if (activeStatus) return;
    // Just logged in — never yank to storefront while Sanctum handshake settles.
    try {
      const just = Number(sessionStorage.getItem('unityteck_just_logged_in') || 0);
      if (just && Date.now() - just < 12_000) return;
    } catch {
      /* ignore */
    }
    // Never navigate('/') while URL is still an admin path (race / stale path state).
    if (onAdminSurface) return;
    navigate('/');
  }, [
    session,
    isAuthPage,
    activeStatus,
    navigate,
    path,
    isFullscreenParam,
    isTabStorefrontParam,
    isPublicStorefront,
  ]);

  // Renew the saved session while the dashboard is open. Never signs the admin out.
  useEffect(() => {
    if (!session?.token) return;
    const renew = () => {
      const current = readAuthSession();
      if (current?.token) writeAuthSession(current);
      try {
        const clerkApi = (window as Window & { Clerk?: { session?: { touch?: () => Promise<void> } } }).Clerk;
        void clerkApi?.session?.touch?.();
      } catch {
        /* ignore */
      }
    };
    const id = window.setInterval(renew, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [session?.token]);

  // Already signed in on login/register/reset → dashboard (only if matching portal, preserving store query)
  useEffect(() => {
    if (!session) return;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    if (isMasterLogin && session.portal === 'master') {
      navigate(`/master${search}`);
    } else if ((isStoreLogin || isAdminLogin) && session.portal === 'store') {
      if (!isPublicStorefront) {
        navigate(`/admin${search}`);
      }
    } else if (isStoreRegister || isPasswordFlow) {
      navigate(session.portal === 'master' ? '/master' : `/admin${search}`);
    }
  }, [session, isMasterLogin, isStoreLogin, isAdminLogin, isStoreRegister, isPasswordFlow, navigate]);

  // Clerk afterSignOutUrl used to dump onto "/" mid-login.
  // HIGH ALERT: bare "/" on coffee/flowers web = storefront. Never auto-/admin.
  useEffect(() => {
    if (!session) return;
    if (isPublicStorefront || isFullscreenParam || isTabStorefrontParam) return;
    if (path !== '/' && path !== '') return;
    // Defense: if path looks public, stay put even if flags raced.
    try {
      const href = typeof window !== 'undefined' ? window.location.pathname : path;
      if (
        href === '/' ||
        href === '' ||
        href.startsWith('/coffee') ||
        href.startsWith('/profile') ||
        href.startsWith('/checkout') ||
        href.startsWith('/cart') ||
        href.startsWith('/shop') ||
        href.startsWith('/product')
      ) {
        return;
      }
    } catch {
      return;
    }
    if (session.portal === 'master') {
      navigate('/master', { replace: true });
      return;
    }
    if (session.portal === 'store') {
      const sid = session.storeId || '';
      const slug =
        sid === 'store-coffee' ? 'coffee' : sid === 'store-bleco' ? 'car' : sid === 'store-1' ? 'flowers' : '';
      navigate(slug ? `/admin?store=${slug}` : '/admin', { replace: true });
    }
  }, [session, path, isFullscreenParam, isTabStorefrontParam, isPublicStorefront, navigate]);

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
    } else if (
      !CORE_STORE_CONTROL_IDS.has(storeTab) &&
      !canTabRef.current(storeTab, 'store')
    ) {
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
    if (mode === 'master') {
      document.documentElement.setAttribute('data-sidebar-design', 'luxe');
    } else {
      document.documentElement.removeAttribute('data-sidebar-design');
    }
    return () => {
      document.documentElement.removeAttribute('data-sidebar-design');
    };
  }, [mode]);

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

  // Prefetch the editor only inside the store dashboard. The public storefront must not load it.
  useEffect(() => {
    if (mode === 'store' && !isPublicStorefront) {
      const timer = setTimeout(() => {
        preloadVisualThemeBuilder();
        preloadWordPressThemeCustomizer();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [mode, isPublicStorefront]);

  // Deep-link ?customizer=1 — start chunk fetch immediately
  useEffect(() => {
    if (isThemeCustomizerOpen) {
      void preloadWordPressThemeCustomizer();
    }
  }, [isThemeCustomizerOpen]);

  const handleLoginSuccess = useCallback(
    (portal: AuthPortal, storeId?: string | null, liveSession?: AuthSession | null) => {
      const next = liveSession || readAuthSession();
      if (!next?.token || next.portal !== portal) {
        // Never bounce to "/" / storefront when session did not land yet.
        return;
      }
      writeAuthSession(next);
      setSession(next);
      document.documentElement.setAttribute('data-portal', portal);
      try {
        sessionStorage.setItem('unityteck_just_logged_in', String(Date.now()));
      } catch {
        /* ignore */
      }
      if (portal === 'master') {
        switchToMaster();
        setMasterTab('dashboard');
        navigate('/master?tab=dashboard', { replace: true });
        return;
      }
      const sid = storeId || next.storeId || '';
      if (sid) {
        switchToStore(sid);
      } else {
        setMode('store');
      }
      // Fresh login always lands on Dashboard (not last localStorage tab e.g. products).
      setStoreTab('dashboard');
      const slug =
        sid === 'store-coffee'
          ? 'coffee'
          : sid === 'store-bleco'
            ? 'car'
            : sid === 'store-1'
              ? 'flowers'
              : '';
      // Always stay on /admin — never "/" storefront after merchant OTP.
      navigate(
        slug ? `/admin?store=${slug}&tab=dashboard` : '/admin?tab=dashboard',
        { replace: true },
      );
    },
    [navigate, setMode, setMasterTab, setStoreTab, switchToMaster, switchToStore],
  );

  const handleRegisterSuccess = useCallback(
    (storeId: string) => {
      const next = readAuthSession();
      setSession(next);
      document.documentElement.setAttribute('data-portal', 'store');
      switchToStore(storeId);
      setStoreTab('dashboard');
      navigate('/admin?tab=dashboard', { replace: true });
    },
    [navigate, setStoreTab, switchToStore],
  );

  const handleSwitchLoginPortal = useCallback(
    (portal: AuthPortal) => {
      navigate(portal === 'master' ? '/master/login' : '/store/login');
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
    if (mode === 'master' || session.portal === 'master') {
      applyPortalHead({ portal: 'master' });
      return;
    }
    let faviconUrl: string | null = activeStore?.favicon || null;
    let storeName =
      (locale === 'ar'
        ? activeStore?.nameAr || activeStore?.name
        : activeStore?.nameEn || activeStore?.name) || null;
    if (activeStore?.id) {
      const identity = readStoreIdentity(activeStore.id, activeStore);
      faviconUrl = identity.faviconUrl || faviconUrl;
      storeName =
        resolveStoreDisplayName(identity, locale === 'ar', storeName || '') || storeName;
    }
    applyPortalHead({
      portal: 'store',
      storeName,
      faviconUrl,
    });
  }, [session, mode, activeStore?.id, activeStore?.name, activeStore?.nameAr, activeStore?.nameEn, activeStore?.favicon, locale]);

  const handleLogout = useCallback(async () => {
    const wasMaster = session?.portal === 'master';
    const storeSlug =
      session?.storeId === 'store-coffee'
        ? 'coffee'
        : session?.storeId === 'store-bleco'
          ? 'car'
          : session?.storeId === 'store-1'
            ? 'flowers'
            : '';

    // Instant UI logout — never wait on API/Clerk before clearing the shell.
    setSession(null);
    clearAuthSession(true);
    try {
      localStorage.setItem('unityteck_explicit_logout', '1');
      localStorage.removeItem('unityteck_auth');
      localStorage.removeItem('unityteck_auth_lifetime_backup');
      localStorage.removeItem('unityteck_session_lifetime');
      localStorage.removeItem('unityteck_active_store_id');
      localStorage.removeItem('unityteck_store_tab');
      localStorage.removeItem('unityteck_master_tab');
      sessionStorage.clear();
      window.dispatchEvent(new Event('unityteck-auth'));
    } catch {
      /* ignore */
    }

    const dest = wasMaster
      ? '/master/login'
      : storeSlug
        ? `/admin?store=${storeSlug}`
        : '/store/login';
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', dest);
    }
    navigate(dest);

    try {
      await logoutPortal();
    } catch {
      /* ignore remote logout errors */
    }
  }, [navigate, session]);

  const requestLogout = useCallback(() => {
    void handleLogout();
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

  const isPlatformBlogPublic =
    path === '/platform-blog' || path.startsWith('/platform-blog/');
  if (isPlatformBlogPublic) {
    const slugRaw = path.replace(/^\/platform-blog\/?/, '');
    const blogSlug = slugRaw ? decodeURIComponent(slugRaw.split('/')[0] || '') : '';
    const blogToken =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('token')
        : null;
    return (
      <Suspense fallback={<TabFallback />}>
        <PlatformBlogPublicView
          slug={blogSlug || null}
          token={blogToken}
          onNavigate={navigate}
        />
      </Suspense>
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
        onOpenMaster={() => {
          if (typeof window !== 'undefined' && !isMasterAdminHost(window.location.hostname)) {
            redirectToCentralMaster('/master/login');
            return;
          }
          navigate('/master/login');
        }}
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
    const adminStoreHint = (() => {
      if (typeof window === 'undefined') return null;
      const q = new URLSearchParams(window.location.search);
      const fromUrl = (q.get('store') || q.get('demo') || '').trim();
      if (fromUrl) return fromUrl;
      const sid = resolvedDomain?.resolved ? String(resolvedDomain.storeId || '') : '';
      if (sid === 'store-1') return 'flowers';
      if (sid === 'store-coffee') return 'coffee';
      if (sid === 'store-bleco') return 'car';
      const host = window.location.hostname.toLowerCase().replace(/^www\./, '');
      if (host.includes('giftshop') || host.includes('makkah') || host.includes('flowers')) return 'flowers';
      if (host.includes('mieraf') || host.includes('hibrew') || host.includes('coffee')) return 'coffee';
      if (host.includes('bleco') || host.includes('tanjeed') || host.includes('alsaeedi')) return 'car';
      return null;
    })();
    return (
      <PortalLogin
        portal={isMasterLogin ? 'master' : 'store'}
        storeHint={isMasterLogin ? null : adminStoreHint}
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
    const searchParams =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    const pathStoreSlug = storeSlugFromStorePath(path) || '';
    const urlTheme = searchParams.get('theme') || '';
    const urlPage = searchParams.get('page') || searchParams.get('preview_page') || '';

    // Explicit /store/{slug} or ?store= MUST win over apex host (mieraf → coffee).
    const explicitStoreId = storeIdFromPublicLocation(path, searchParams);
    const storefrontStoreId =
      explicitStoreId ||
      (resolvedDomain?.resolved && resolvedDomain.storeId
        ? String(resolvedDomain.storeId)
        : activeStore?.id || pathStoreSlug || '');

    const googleReturn =
      isClerkConfigured() &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('clerk_oauth') === '1';

    return (
      <StatusErrorBoundary onHome={() => navigate('/')} onNavigate={navigate}>
        <div dir={dir} lang={locale} className="min-h-screen w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
          {googleReturn ? <AuthenticateWithRedirectCallback /> : null}
          {isClerkConfigured() ? <StorefrontCustomerResume /> : null}
          <div className="flex-1">
            <Suspense fallback={<TabFallback />}>
              <DynamicThemeRenderer
                storeId={storefrontStoreId}
                themeId={urlTheme || undefined}
                initialPage={urlPage || undefined}
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
      className="unity-shell h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col transition-[background,color] duration-150"
      data-portal={mode}
      data-theme={theme}
      style={{
        /* backgroundColor only — store glass shell uses CSS wallpaper ::before + light scrim */
        backgroundColor: mode === 'store' ? 'transparent' : 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
        /* iOS Safari fallback when dvh unsupported */
        height: '100dvh',
        maxHeight: '100dvh',
      }}
    >
      {/* Unified Holst header: MasterTopBar / StoreTopBar only — no dark chrome · no DB banner */}
      <div className="flex flex-1 overflow-hidden min-h-0 h-full">
        {showMasterChrome && mode === 'master' ? (
          <>
            <MasterSidebar
              currentTab={masterTab}
              onSelectTab={(tab) => setMasterTab(tab)}
              mobileOpen={mobileNavOpen}
              onMobileClose={() => setMobileNavOpen(false)}
            />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <MasterTopBar
                onOpenCreateStore={() => setIsCreateStoreOpen(true)}
                onSignOut={() => void requestLogout()}
                onMobileMenuOpen={() => setMobileNavOpen(true)}
                onNavigateTab={setMasterTab}
              />
              <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-5 touch-pan-y overscroll-y-contain">
                <Suspense fallback={<TabFallback />}>
                  {masterTab === 'dashboard' && (
                    <MasterDashboard
                      onOpenCreateStore={() => setIsCreateStoreOpen(true)}
                      onNavigateTab={setMasterTab}
                    />
                  )}
                  {masterTab === 'accounts' && (
                    <MasterAccountManagement onOpenOnboarding={() => setMasterTab('onboarding')} />
                  )}
                  {masterTab === 'stores' && (
                    <MasterStores onOpenCreateStore={() => setIsCreateStoreOpen(true)} />
                  )}
                  {masterTab === 'plans' && <MasterPlansSubscriptions />}
                  {masterTab === 'services-points' && <MasterServicesPoints />}
                  {masterTab === 'integrations' && <MasterIntegrationsHub />}
                  {masterTab === 'openai-ai' && <MasterOpenAiManagement />}
                  {(masterTab === 'ai-management' || masterTab === 'gemini-settings') && (
                    <MasterGeminiSettings initialTab="general" />
                  )}
                  {masterTab === 'ai-providers' && <MasterGeminiSettings initialTab="general" />}
                  {masterTab === 'ai-studio' && <MasterGeminiSettings initialTab="image_settings" />}
                  {masterTab === 'ai-usage' && <MasterGeminiSettings initialTab="pricing" />}
                  {masterTab === 'merchant-ai-limits' && (
                    <MasterGeminiSettings initialTab="merchant_limits" />
                  )}
                  {masterTab === 'ai-history' && <MasterGeminiSettings initialTab="logs" />}
                  {masterTab === 'reports' && <MasterReportsOps />}
                  {masterTab === 'support' && <MasterSupportCenter />}
                  {masterTab === 'blog' && <MasterPlatformBlog />}
                  {masterTab === 'security' && <MasterSecurityCenter />}
                  {masterTab === 'notifications' && (
                    <MasterNotificationsHub onNavigateTab={setMasterTab} />
                  )}
                  {(masterTab === 'payments' || masterTab === 'payments-reconcile') && (
                    <MasterCapabilityDeferred capabilityId="payments-reconcile" />
                  )}
                  {masterTab === 'ops' && <MasterOpsMonitor />}
                  {masterTab === 'messaging' && <MasterMessagingHub />}
                  {masterTab === 'governance' && <MasterGovernanceHub />}
                  {masterTab === 'control-center' && <MasterControlCenter />}
                  {masterTab === 'onboarding' && <MasterOnboarding />}
                  {masterTab === 'domains' && <MasterDomains />}
                  {masterTab === 'updates' && <MasterUpdates />}
                  {masterTab === 'themes' && <MasterThemes />}
                  {masterTab === 'canva' && <MasterCanvaStudio onNavigateTab={setMasterTab} />}
                  {masterTab === 'canva-real' && (
                    <MasterRealCanvaConnect onNavigateTab={setMasterTab} />
                  )}
                  {masterTab === 'marketplace' && <MasterMarketplace />}
                  {masterTab === 'seo' && <MasterSEO />}
                  {masterTab === 'database' && <MasterDatabase />}
                  {(masterTab === 'backup' || masterTab === 'restore') && <StoreBackupRestoreCenter />}
                  {masterTab === 'orders' && <MasterOrders />}
                  {masterTab === 'products' && <MasterProducts />}
                  {masterTab === 'settings' && <MasterSettings onNavigateTab={setMasterTab} />}
                  {![
                    'dashboard',
                    'accounts',
                    'stores',
                    'plans',
                    'services-points',
                    'integrations',
                    'openai-ai',
                    'reports',
                    'support',
                    'blog',
                    'security',
                    'notifications',
                    'payments',
                    'payments-reconcile',
                    'ops',
                    'messaging',
                    'governance',
                    'control-center',
                    'onboarding',
                    'domains',
                    'database',
                    'backup',
                    'restore',
                    'updates',
                    'themes',
                    'canva',
                    'canva-real',
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
              mobileOpen={mobileNavOpen}
              onMobileClose={() => setMobileNavOpen(false)}
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
                onNavigateTab={setStoreTab}
                onMobileMenuOpen={() => setMobileNavOpen(true)}
                searchPlaceholder={
                  storeTab === 'customers' ? t('searchCustomers') : t('searchStore')
                }
              />
              <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-5 touch-pan-y overscroll-y-contain">
                {/* Unmount heavy store tabs while customizer fullscreen is open */}
                {isThemeCustomizerOpen ? null : (
                <Suspense fallback={<TabFallback />}>
                  {!isStoreControlEnabled(activeStore?.id, storeTab) &&
                  !CORE_STORE_CONTROL_IDS.has(storeTab) ? (
                    <div className="p-8 max-w-md mx-auto text-center space-y-4 my-20">
                      <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>
                        {locale === 'ar' ? 'تم تعطيل هذه الصفحة بواسطة منصة سوق' : 'Page Disabled by Souq Platform'}
                      </h2>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                        {locale === 'ar'
                          ? 'قامت إدارة منصة سوق بتعطيل هذه الصفحة مؤقتاً لهذا المتجر. يرجى مراجعة إدارة المنصة لطلب التفعيل.'
                          : 'This module has been temporarily disabled by Souq Platform for this store. Please contact platform administration if you need access.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setStoreTab('dashboard')}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold cursor-pointer hover:opacity-90"
                      >
                        {locale === 'ar' ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
                      </button>
                    </div>
                  ) : isStoreTabComingSoon(storeTab) ? (
                    <StoreTabComingSoon tabId={storeTab} onNavigateTab={setStoreTab} />
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
                  {storeTab === 'customers' && <StoreCustomers onNavigateTab={setStoreTab} />}
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
                  {storeTab === 'social' && <StoreSocialPublisher onNavigateTab={setStoreTab} />}
                  {storeTab === 'seo' && <StoreSEO onNavigateTab={setStoreTab} />}
                  {storeTab === 'products' && <StoreProducts onNavigateTab={setStoreTab} />}
                  {storeTab === 'media' && <StoreMediaLibrary />}
                  {/* Design Tools → open Full Design Studio directly (no 4-card hub) */}
                  {(storeTab === 'canva' ||
                    storeTab === 'canva-studio' ||
                    storeTab === 'canva-banner' ||
                    storeTab === 'canva-logo' ||
                    storeTab === 'canva-product-card') && (
                    <StoreCanvaStudio onNavigateTab={setStoreTab} />
                  )}
                  {storeTab === 'ai-media' && <StoreAiToolsHub onNavigateTab={setStoreTab} />}
                  {storeTab === 'ai-studio' && <StoreAiStudio />}
                  {storeTab === 'categories' && <StoreCategories />}
                  {storeTab === 'brands' && <StoreBrandsView onBackToProducts={() => setStoreTab('products')} />}
                  {storeTab === 'orders' && <StoreOrders />}
                  {storeTab === 'appointments' && <StoreAppointments />}
                  {storeTab === 'invoices' && <StoreInvoices onNavigateTab={(tab) => setStoreTab(tab)} />}
                  {storeTab === 'shipping' && <StoreShipping />}
                  {storeTab === 'payments' && <StorePayments />}
                  {storeTab === 'hosting' && <StoreHostingDomain />}
                  {storeTab === 'marketplace' && <StoreMarketplacePlans />}
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
                        const storeSlug =
                          activeStore?.slug ||
                          (activeStore?.id === 'store-coffee'
                            ? 'coffee'
                            : activeStore?.id === 'store-bleco'
                              ? 'bleco'
                              : 'flowers');
                        // Never same-tab navigate — that unmounts /admin into public storefront
                        window.open(
                          buildStorefrontHomeUrl({ storeSlug }),
                          '_blank',
                          'noopener,noreferrer',
                        );
                      }}
                      onCustomizeTheme={(tid, page) => handleOpenCustomizeTheme(tid, page)}
                      onOpenThemeCustomizer={handleOpenThemeCustomizer}
                    />
                  )}
                  {storeTab === 'pages' && <StorePages />}
                  {storeTab === 'blog' && (
                    <StoreBlogManagement
                      onNavigateTab={setStoreTab}
                      onOpenCommerceTools={(articleId) => {
                        setSelectedCommerceArticleId(articleId);
                        setStoreTab('commerce-tools');
                      }}
                    />
                  )}
                  {storeTab === 'commerce-tools' && !isStoreTabComingSoon('commerce-tools') && (
                    <StoreArticleCommerceTools
                      initialArticleId={selectedCommerceArticleId}
                      onNavigateTab={setStoreTab}
                    />
                  )}
                  {storeTab === 'appstore' && (
                    <StoreAppStore
                      onOpenStorefront={() => {
                        const storeSlug =
                          activeStore?.slug ||
                          (activeStore?.id === 'store-coffee'
                            ? 'coffee'
                            : activeStore?.id === 'store-bleco'
                              ? 'bleco'
                              : 'flowers');
                        window.open(
                          buildStorefrontHomeUrl({ storeSlug }),
                          '_blank',
                          'noopener,noreferrer',
                        );
                      }}
                    />
                  )}
                  {storeTab === 'settings' && <StoreSettings />}
                    </>
                  )}
                </Suspense>
                )}
              </main>
            </div>
          </>
        )}
      </div>

      <ArchitectureBanner />

      {/* Per-store AI + human help chatbot (merchant → Master handoff) */}
      {mode === 'store' && session?.portal === 'store' && activeStore?.id ? (
        <Suspense fallback={null}>
          <StoreHelpChatbot />
        </Suspense>
      ) : null}

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
            onClose={requestCloseVisualBuilder}
            onPublishSuccess={() => {
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
            onClose={requestCloseThemeCustomizer}
          />
        </Suspense>
      )}
    </div>
    </StatusErrorBoundary>
  );
}

export default function App() {
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('social_oauth') === '1') {
    return <SocialOAuthDialogView />;
  }
  return (
    <SkeletonProvider>
      <TenantProvider>
        <ToastProvider>
          <PrefsBridge />
        </ToastProvider>
      </TenantProvider>
    </SkeletonProvider>
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
