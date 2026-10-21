import React, { Suspense, useMemo, useEffect } from 'react';
import type { ThemeManifest } from '../../themes/types';
import { resolveStoreTheme } from '../../themes/registry';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { generateStoreSEO, applySEOToDOM } from '../../utils/storeSEO';
import { Loader2, RefreshCw } from 'lucide-react';

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

import { DashboardLoader } from '../common/DashboardLoader';
import { StorefrontCustomerDock } from './StorefrontCustomerDock';

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
  const urlStoreParam = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('store') ||
       new URLSearchParams(window.location.search).get('demo') ||
       new URLSearchParams(window.location.search).get('storeId') ||
       new URLSearchParams(window.location.search).get('tenant') || '').toLowerCase().trim()
    : '';

  const matchedStore = urlStoreParam ? stores?.find((st: any) => st.id?.toLowerCase() === urlStoreParam || st.slug?.toLowerCase() === urlStoreParam) : null;

  const explicitUrlStoreId =
    pathname.startsWith('/coffee') || pathname.startsWith('/public_html') || urlStoreParam.includes('coffee') || urlStoreParam.includes('hibrew') || urlStoreParam.includes('roaster') ? 'store-coffee' :
    pathname.startsWith('/car') || pathname.startsWith('/cars') || pathname.startsWith('/bleco') || pathname.startsWith('/transport') || urlStoreParam.includes('car') || urlStoreParam.includes('bleco') || urlStoreParam.includes('saeedi') ? 'store-bleco' :
    pathname.startsWith('/flowers') || pathname.startsWith('/hadaya') || pathname.startsWith('/gifts') || urlStoreParam.includes('flower') || urlStoreParam.includes('gift') || urlStoreParam.includes('makkah') ? 'store-1' :
    (matchedStore ? matchedStore.id : '');

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
    window.addEventListener('popstate', handleSync);
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
      window.removeEventListener('popstate', handleSync);
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

  const effectiveStoreId = explicitUrlStoreId || storeId || (activeStore?.id ? activeStore.id : '') || 'store-coffee';
  const effectiveThemeId =
    themeId || urlThemeParam || (storeActiveTheme && storeActiveTheme[effectiveStoreId]) || (activeStore as any)?.theme_id;
  const effectiveCategory = category || activeStore?.category || (effectiveStoreId === 'store-coffee' ? 'قهوة' : '');

  const manifest = useMemo(
    () => resolveStoreTheme(effectiveStoreId, effectiveThemeId, effectiveCategory),
    [effectiveStoreId, effectiveThemeId, effectiveCategory, syncTick],
  );

  const ThemeComponent = manifest.ViewComponent;

  // Resolve initial page key mapping per theme conventions
  const resolvedInitialPage = useMemo(() => {
    let raw = (initialPage || urlPageParam || fallbackPage || '').toLowerCase().trim();
    if (!raw) {
      if (pathname === '/cart' || pathname.endsWith('/cart')) raw = 'cart';
      else if (pathname === '/checkout' || pathname.endsWith('/checkout')) raw = 'checkout';
      else if (pathname === '/catalog' || pathname === '/shop' || pathname.endsWith('/catalog') || pathname.endsWith('/shop')) raw = 'catalog';
      else if (pathname === '/products' || pathname.endsWith('/products')) raw = 'products';
      else if (pathname === '/product' || pathname.startsWith('/product/') || pathname.includes('/product')) raw = 'product';
      else if (pathname === '/crm' || pathname === '/profile' || pathname === '/account' || pathname === '/orders') raw = 'crm';
      else if (pathname === '/thankyou' || pathname.endsWith('/thankyou')) raw = 'thankyou';
      else if (pathname === '/about' || pathname.endsWith('/about')) raw = 'about';
      else if (pathname === '/contact' || pathname.endsWith('/contact')) raw = 'contact';
      else if (pathname === '/faq' || pathname.endsWith('/faq')) raw = 'faq';
      else if (pathname === '/privacy' || pathname.endsWith('/privacy')) raw = 'privacy';
      else if (pathname === '/terms' || pathname.endsWith('/terms')) raw = 'terms';
      else if (pathname === '/return' || pathname.endsWith('/return')) raw = 'return';
      else if (pathname === '/shipping' || pathname.endsWith('/shipping')) raw = 'shipping';
      else if (pathname === '/warranty' || pathname.endsWith('/warranty')) raw = 'warranty';
      else if (pathname === '/locator' || pathname.endsWith('/locator')) raw = 'locator';
      else if (pathname === '/track-order' || pathname.endsWith('/track-order')) raw = 'track-order';
      else if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem(`unityteck_page_${effectiveStoreId}`) ||
          sessionStorage.getItem('unityteck_coffee_current_route') ||
          sessionStorage.getItem('unityteck_transport_page') ||
          sessionStorage.getItem('unityteck_mecca_page');
        if (saved) raw = saved;
      }
    }
    raw = (raw || 'home').toLowerCase().trim();

    if (raw === 'shop' || raw === 'catalog' || raw === 'products') {
      if (manifest.id === 'theme-transport' || manifest.id === 'theme-saudia-transport') return 'catalog';
      if (manifest.id === 'theme-coffee-artisan' || manifest.id === 'theme-coffee') return 'products';
      return 'catalog';
    }
    if (raw === 'product' || raw === 'product-detail' || raw === 'detail') {
      if (manifest.id === 'theme-coffee-artisan' || manifest.id === 'theme-coffee') return 'product-detail';
      return 'product';
    }
    if (raw === 'profile' || raw === 'crm' || raw === 'account' || raw === 'login') {
      if (manifest.id.includes('gift') || manifest.id.includes('flower')) return 'crm';
      return 'profile';
    }
    return raw;
  }, [initialPage, urlPageParam, fallbackPage, pathname, effectiveStoreId, manifest.id, isAdmin, syncTick]);

  // Ensure scroll restoration is manual and view is strictly scrolled to the top header
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const t1 = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50);
      const t2 = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [resolvedInitialPage, effectiveStoreId]);

  // Golden Rule: Automatic Store-wise Public SEO computation with strict Tenant Isolation & Bilingual Switching
  useEffect(() => {
    if (isAdmin) return;
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
  }, [effectiveStoreId, activeStore, stores, currentSEOConfig, allProducts, currentProducts, locale, category, resolvedInitialPage, isAdmin]);

  // Live inject custom CSS if configured for the active store
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`unityteck_custom_code_${effectiveStoreId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.enableCustomCss && parsed.customCss) {
          let tag = document.getElementById('unityteck-live-custom-css') as HTMLStyleElement | null;
          if (!tag) {
            tag = document.createElement('style');
            tag.id = 'unityteck-live-custom-css';
            document.head.appendChild(tag);
          }
          tag.textContent = parsed.customCss;
        }
      }
    } catch {}
  }, [effectiveStoreId]);

  // CSS variables for isolated theme scoping
  const scopeStyles = useMemo(
    () =>
      ({
        '--theme-primary': manifest.defaultColors.primary,
        '--theme-secondary': manifest.defaultColors.secondary,
        '--theme-accent': manifest.defaultColors.accent,
        '--theme-surface': manifest.defaultColors.surface,
        '--theme-bg': manifest.defaultColors.background,
        '--theme-text': manifest.defaultColors.text,
      } as React.CSSProperties),
    [manifest],
  );

  return (
    <div
      data-theme-id={manifest.id}
      data-theme-slug={manifest.slug}
      className={`unity-theme-container theme-${manifest.slug} w-full min-h-screen`}
      style={scopeStyles}
    >
      <ThemeErrorBoundary themeName={manifest.name} locale={locale}>
        <Suspense fallback={<DashboardLoader storeId={effectiveStoreId} storeName={activeStore?.name} />}>
          <ThemeComponent initialPage={resolvedInitialPage} isAdmin={isAdmin} />
        </Suspense>
        {!isAdmin && <StorefrontCustomerDock storeId={effectiveStoreId} />}
      </ThemeErrorBoundary>
    </div>
  );
};
