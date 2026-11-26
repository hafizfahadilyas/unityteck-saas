import React, { Suspense, useMemo, useEffect } from 'react';
import type { ThemeManifest } from '../../themes/types';
import { resolveStoreTheme } from '../../themes/registry';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { generateStoreSEO, applySEOToDOM } from '../../utils/storeSEO';
import { captureTrafficSource } from '../../utils/trafficSource';
import { trackStorefrontEvent } from '../../utils/storefrontAnalytics';
import { RefreshCw } from 'lucide-react';
import { readAllThemeSettings } from '../../themes/settings/themeSettingsStore';
import { readStoreIdentity } from '../../themes/settings/storeIdentity';
import {
  applyStoreCustomCodeLive,
  normalizeStoreCustomCode,
} from '../../themes/settings/storeScopedCustomCode';
import { applyDocumentFavicon } from '../../utils/portalHead';
import { DashboardLoader } from '../common/DashboardLoader';
import { SkeletonPage } from '../common/skeleton';
import { storeIdFromPublicLocation, storeSlugFromStorePath } from '../../utils/storefrontLinks';

export interface DynamicThemeRendererProps {
  storeId?: string;
  themeId?: string;
  category?: string;
  initialPage?: string;
  isAdmin?: boolean;
  fallbackPage?: string;
}

interface ThemeErrorBoundaryProps {
  children: React.ReactNode;
  themeName: string;
  locale?: string;
}

interface ThemeErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ThemeErrorBoundary extends React.Component<ThemeErrorBoundaryProps, ThemeErrorBoundaryState> {
  constructor(props: ThemeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`Theme [${this.props.themeName}] error caught:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      const isAr = this.props.locale === 'ar' || (typeof document !== 'undefined' && (document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl'));
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-black mb-2 text-slate-900 dark:text-white">
              {isAr
                ? `عذراً، حدث خطأ أثناء تحميل القالب (${this.props.themeName})`
                : `Sorry, an error occurred while loading theme (${this.props.themeName})`}
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              {isAr
                ? 'حدث خطأ غير متوقع أثناء معالجة القالب. اضغط أدناه لإعادة التحميل والتحديث النظيف.'
                : 'An unexpected error occurred in this theme module. Click below to reload cleanly.'}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-full hover:opacity-90 transition-opacity cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة التحميل' : 'Reload Storefront'}</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Thin route paint — never block first paint with full brand splash unless merchant enabled it. */
function LightThemeFallback() {
  return (
    <div className="w-full min-h-[50vh] p-4 sm:p-6 bg-white dark:bg-slate-950" aria-busy="true" role="status">
      <SkeletonPage layout="storefront" hasHeader={false} />
    </div>
  );
}

export const DynamicThemeRenderer: React.FC<DynamicThemeRendererProps> = ({
  storeId,
  themeId,
  category,
  initialPage = '',
  isAdmin = false,
  fallbackPage,
}) => {
  const { activeStore, stores, storeActiveTheme, currentSEOConfig, currentProducts, allProducts } = useTenant();
  const { locale } = usePrefs();

  const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const pathSlug = storeSlugFromStorePath(pathname) || '';
  // Path /store/{slug} wins over stale ?store=coffee from apex host default
  const urlStoreParam = (
    pathSlug ||
    searchParams.get('store') ||
    searchParams.get('demo') ||
    searchParams.get('storeId') ||
    searchParams.get('tenant') ||
    ''
  )
    .toLowerCase()
    .trim();

  const matchedStore = urlStoreParam
    ? stores?.find(
        (st: any) =>
          st.id?.toLowerCase() === urlStoreParam ||
          st.slug?.toLowerCase() === urlStoreParam ||
          st.id?.toLowerCase() === `store-${urlStoreParam}` ||
          String(st.domain || '').toLowerCase().includes(urlStoreParam),
      )
    : null;

  /** Resolve niche path → real store from tenant list only. Never invent store-1 / Flora. */
  const findStoreIdByHints = (hints: string[]): string => {
    const hit = stores?.find((st: any) => {
      const blob = `${st.id || ''} ${st.slug || ''} ${st.domain || ''} ${st.name || ''} ${st.nameEn || ''}`.toLowerCase();
      return hints.some((h) => blob.includes(h));
    });
    return hit?.id || '';
  };

  const fromPublicLocation = storeIdFromPublicLocation(pathname, searchParams);

  const nicheHintStoreId =
    fromPublicLocation ||
    (pathname.startsWith('/coffee') ||
    urlStoreParam.includes('coffee') ||
    urlStoreParam.includes('hibrew') ||
    urlStoreParam.includes('roaster')
      ? findStoreIdByHints(['coffee', 'hibrew', 'roaster', 'store-coffee'])
      : pathname.startsWith('/car') ||
          pathname.startsWith('/cars') ||
          pathname.startsWith('/bleco') ||
          pathname.startsWith('/transport') ||
          urlStoreParam.includes('car') ||
          urlStoreParam.includes('bleco') ||
          urlStoreParam.includes('saeedi')
        ? findStoreIdByHints(['bleco', 'car', 'saeedi', 'store-bleco'])
        : pathname.startsWith('/flowers') ||
            pathname.startsWith('/hadaya') ||
            pathname.startsWith('/gifts') ||
            urlStoreParam.includes('flower') ||
            urlStoreParam.includes('gift') ||
            urlStoreParam.includes('makkah') ||
            urlStoreParam.includes('hadaya')
          ? findStoreIdByHints(['flower', 'gift', 'hadaya', 'makkah', 'flora', 'store-1'])
          : '');

  const explicitUrlStoreId = matchedStore?.id || nicheHintStoreId || '';

  const urlThemeParam =
    typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('theme') || '').trim()
      : '';
  const urlPageParam =
    typeof window !== 'undefined'
      ? (
          new URLSearchParams(window.location.search).get('page') ||
          new URLSearchParams(window.location.search).get('preview_page') ||
          ''
        ).trim()
      : '';

  const [syncTick, setSyncTick] = React.useState(0);
  useEffect(() => {
    const handleSync = () => setSyncTick((t) => t + 1);
    window.addEventListener('storage', handleSync);
    window.addEventListener('unityteck-theme-settings', handleSync);
    window.addEventListener('unityteck-theme-identity', handleSync);
    window.addEventListener('unityteck-product-updated', handleSync);
    window.addEventListener('unityteck-categories-updated', handleSync);
    window.addEventListener('unityteck-brands-updated', handleSync);
    window.addEventListener('unityteck-store-updated', handleSync);
    window.addEventListener('unityteck-pages-changed', handleSync);
    window.addEventListener('unityteck-data', handleSync);
    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === 'UNITYTECK_PREVIEW_SYNC' || e.data?.type === 'UNITYTECK_THEME_SYNC') {
        setSyncTick((t) => t + 1);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('unityteck-theme-settings', handleSync);
      window.removeEventListener('unityteck-theme-identity', handleSync);
      window.removeEventListener('unityteck-product-updated', handleSync);
      window.removeEventListener('unityteck-categories-updated', handleSync);
      window.removeEventListener('unityteck-brands-updated', handleSync);
      window.removeEventListener('unityteck-store-updated', handleSync);
      window.removeEventListener('unityteck-pages-changed', handleSync);
      window.removeEventListener('unityteck-data', handleSync);
      window.removeEventListener('message', handleMsg);
    };
  }, []);

  // Never invent store-coffee when tenant is unknown — that leaks HiBrew into other contexts.
  const effectiveStoreId = explicitUrlStoreId || storeId || (activeStore?.id ? activeStore.id : '');
  const effectiveThemeId =
    themeId || urlThemeParam || (effectiveStoreId && storeActiveTheme && storeActiveTheme[effectiveStoreId]) || (activeStore as any)?.theme_id;
  const effectiveCategory = category || activeStore?.category || '';

  const manifest = useMemo(
    () => (effectiveStoreId ? resolveStoreTheme(effectiveStoreId, effectiveThemeId, effectiveCategory) : null),
    [effectiveStoreId, effectiveThemeId, effectiveCategory, syncTick],
  );

  const ThemeComponent = manifest?.ViewComponent;

  // Resolve initial page key mapping per theme conventions
  const resolvedInitialPage = useMemo(() => {
    // SEO / short paths: `/product/{id}`, `/buy/{id}` must open PDP — never fall through to home.
    const pathIsProduct = /(?:^|\/)product\/[^/]+\/?$/i.test(pathname);
    const pathIsBuy = /(?:^|\/)buy\/[^/]+\/?$/i.test(pathname);
    const pathIsCatalog =
      pathname === '/catalog' ||
      pathname.startsWith('/catalog/') ||
      pathname === '/products' ||
      pathname.startsWith('/products/') ||
      pathname === '/shop' ||
      pathname.startsWith('/shop/') ||
      pathname.startsWith('/category/');
    const pathIsCart = /\/cart\/?$/i.test(pathname);
    const pathIsCheckout = /\/checkout\/?$/i.test(pathname);
    const pathIsProfile = /\/(profile|account|crm|orders)\/?$/i.test(pathname);
    const raw = (
      initialPage ||
      urlPageParam ||
      (pathIsBuy ? 'product-buy' : '') ||
      (pathIsProduct ? 'product-detail' : '') ||
      (pathIsCatalog ? 'products' : '') ||
      (pathIsCart ? 'cart' : '') ||
      (pathIsCheckout ? 'checkout' : '') ||
      (pathIsProfile ? 'profile' : '') ||
      fallbackPage ||
      'home'
    )
      .toLowerCase()
      .trim();
    const mid = manifest?.id || '';
    if (raw === 'shop' || raw === 'catalog' || raw === 'products') {
      if (mid === 'theme-transport' || mid === 'theme-saudia-transport') return 'catalog';
      if (mid === 'theme-coffee-artisan' || mid === 'theme-coffee') return 'products';
      return 'catalog';
    }
    if (raw === 'product' || raw === 'product-detail' || raw === 'detail' || raw === 'buy' || raw === 'product-buy') {
      // Path /coffee/buy|product already decided — never degrade buy → generic "product"
      // (that remounted coffee routes and felt like auto-refresh).
      if (pathIsBuy || raw === 'buy' || raw === 'product-buy') {
        if (mid === 'theme-coffee-artisan' || mid === 'theme-coffee' || pathname.startsWith('/coffee')) {
          return 'product-buy';
        }
      }
      if (mid === 'theme-coffee-artisan' || mid === 'theme-coffee' || pathname.startsWith('/coffee')) {
        return 'product-detail';
      }
      return 'product';
    }
    if (raw === 'profile' || raw === 'crm' || raw === 'account' || raw === 'login') {
      if (mid.includes('gift') || mid.includes('flower')) return 'crm';
      return 'profile';
    }
    return raw;
  }, [initialPage, fallbackPage, manifest?.id, isAdmin, urlPageParam, pathname]);

  const isPreviewEmbed =
    typeof window !== 'undefined' &&
    (() => {
      try {
        const q = new URLSearchParams(window.location.search);
        return q.get('preview') === '1' || q.get('embed') === '1';
      } catch {
        return false;
      }
    })();

  // Golden Rule: Automatic Store-wise Public SEO computation with strict Tenant Isolation & Bilingual Switching
  useEffect(() => {
    if (isAdmin || isPreviewEmbed || !effectiveStoreId) return;
    captureTrafficSource(effectiveStoreId);
    const currentStoreObj = stores?.find((s: any) => s.id === effectiveStoreId) || activeStore;
    const storeProducts = (allProducts && allProducts[effectiveStoreId]) || currentProducts || [];
    const seoData = generateStoreSEO({
      store: currentStoreObj,
      products: storeProducts,
      seoConfig: currentSEOConfig,
      lang: (locale === 'ar' ? 'ar' : 'en'),
      selectedCategory: category,
      page: resolvedInitialPage,
    });
    applySEOToDOM(seoData);
    // Per-store favicon only — do not overwrite SEO document.title with admin chrome
    try {
      const identity = readStoreIdentity(effectiveStoreId, currentStoreObj || { name: '' });
      applyDocumentFavicon(identity.faviconUrl || currentStoreObj?.favicon || null);
    } catch {
      /* empty stays platform default */
    }
    trackStorefrontEvent(effectiveStoreId, 'page_view', {
      path: typeof location !== 'undefined' ? location.pathname : `/${resolvedInitialPage || ''}`,
    });
  }, [effectiveStoreId, activeStore, stores, currentSEOConfig, allProducts, currentProducts, locale, category, resolvedInitialPage, isAdmin, isPreviewEmbed, syncTick]);

  // Live inject store-scoped custom CSS + font (theme-settings / MySQL — not cross-tenant)
  useEffect(() => {
    if (!effectiveStoreId) return;
    try {
      const fallback = stores?.find((s: { id?: string }) => s.id === effectiveStoreId) ||
        activeStore ||
        { name: '' };
      const full = readAllThemeSettings(effectiveStoreId, fallback);
      const code = normalizeStoreCustomCode({
        ...(full.customCode || {}),
        customFontFamily:
          full.customCode?.customFontFamily || full.general?.fontFamily || '',
        customFontUrl: full.customCode?.customFontUrl || full.general?.customFontUrl || '',
      });
      applyStoreCustomCodeLive(effectiveStoreId, code);
    } catch {
      /* empty stays empty */
    }
  }, [effectiveStoreId, stores, activeStore, syncTick]);

  // CSS variables for isolated theme scoping
  const scopeStyles = useMemo(
    () =>
      !manifest
        ? ({} as React.CSSProperties)
        : ({
            '--theme-primary': manifest.defaultColors.primary,
            '--theme-secondary': manifest.defaultColors.secondary,
            '--theme-accent': manifest.defaultColors.accent,
            '--theme-surface': manifest.defaultColors.surface,
            '--theme-bg': manifest.defaultColors.background,
            '--theme-text': manifest.defaultColors.text,
          } as React.CSSProperties),
    [manifest],
  );

  // Brand splash only when merchant toggled enableLoadingScreen; otherwise light spinner.
  const brandSplashOn =
    !isPreviewEmbed &&
    !!effectiveStoreId &&
    (readAllThemeSettings(effectiveStoreId, activeStore).colors?.enableLoadingScreen ?? false);

  const suspenseFallback = isPreviewEmbed ? (
    <div className="min-h-[40vh] w-full bg-white" aria-busy="true" aria-hidden />
  ) : brandSplashOn ? (
    <DashboardLoader storeId={effectiveStoreId} storeName={activeStore?.name} />
  ) : (
    <LightThemeFallback />
  );

  if (!effectiveStoreId || !manifest || !ThemeComponent) {
    const isAr = locale === 'ar';
    return (
      <div className="w-full min-h-[40vh] flex items-center justify-center bg-white text-neutral-500 text-sm px-4 text-center">
        {isAr ? 'بانتظار بيانات المتجر' : 'Waiting for store data'}
      </div>
    );
  }

  return (
    <div
      data-theme-id={manifest.id}
      data-theme-slug={manifest.slug}
      data-store-id={effectiveStoreId}
      className={`unity-theme-container theme-${manifest.slug} w-full min-h-screen`}
      style={scopeStyles}
    >
      <ThemeErrorBoundary themeName={manifest.name} locale={locale}>
        <Suspense fallback={suspenseFallback}>
          <ThemeComponent initialPage={resolvedInitialPage} isAdmin={isAdmin} />
        </Suspense>
      </ThemeErrorBoundary>
    </div>
  );
};
