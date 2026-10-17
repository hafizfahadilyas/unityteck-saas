import React, { Suspense, useMemo } from 'react';
import type { ThemeManifest } from '../../themes/types';
import { resolveStoreTheme } from '../../themes/registry';
import { useTenant } from '../../context/TenantContext';
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
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-black mb-2 text-slate-900 dark:text-white">
              عذراً، حدث خطأ أثناء تحميل القالب ({this.props.themeName})
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              An unexpected error occurred in this theme module. Click below to reload cleanly.
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
              <span>إعادة التحميل (Reload Storefront)</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { DashboardLoader } from '../common/DashboardLoader';

export const DynamicThemeRenderer: React.FC<DynamicThemeRendererProps> = ({
  storeId,
  themeId,
  category,
  initialPage = '',
  isAdmin = false,
  fallbackPage,
}) => {
  const { activeStore, stores, storeActiveTheme } = useTenant();

  const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
  const urlStoreParam = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('store') ||
       new URLSearchParams(window.location.search).get('demo') ||
       new URLSearchParams(window.location.search).get('storeId') ||
       new URLSearchParams(window.location.search).get('tenant') || '').toLowerCase().trim()
    : '';

  const matchedStore = urlStoreParam ? stores?.find((st: any) => st.id?.toLowerCase() === urlStoreParam || st.slug?.toLowerCase() === urlStoreParam) : null;

  const explicitUrlStoreId =
    pathname.startsWith('/coffee') || urlStoreParam.includes('coffee') || urlStoreParam.includes('hibrew') || urlStoreParam.includes('roaster') ? 'store-coffee' :
    pathname.startsWith('/car') || pathname.startsWith('/cars') || pathname.startsWith('/bleco') || pathname.startsWith('/transport') || urlStoreParam.includes('car') || urlStoreParam.includes('bleco') || urlStoreParam.includes('saeedi') ? 'store-bleco' :
    pathname.startsWith('/flowers') || pathname.startsWith('/hadaya') || pathname.startsWith('/gifts') || urlStoreParam.includes('flower') || urlStoreParam.includes('gift') || urlStoreParam.includes('makkah') ? 'store-1' :
    (matchedStore ? matchedStore.id : '');

  const effectiveStoreId = explicitUrlStoreId || storeId || (activeStore?.id ? activeStore.id : '') || 'store-coffee';
  const effectiveThemeId =
    themeId || (storeActiveTheme && storeActiveTheme[effectiveStoreId]) || (activeStore as any)?.theme_id;
  const effectiveCategory = category || activeStore.category || (effectiveStoreId === 'store-coffee' ? 'قهوة' : '');

  const manifest = useMemo(
    () => resolveStoreTheme(effectiveStoreId, effectiveThemeId, effectiveCategory),
    [effectiveStoreId, effectiveThemeId, effectiveCategory],
  );

  const ThemeComponent = manifest.ViewComponent;

  // Resolve initial page key mapping per theme conventions
  const resolvedInitialPage = useMemo(() => {
    const raw = (initialPage || fallbackPage || 'home').toLowerCase().trim();
    if (raw === 'shop' || raw === 'catalog' || raw === 'products') {
      if (manifest.id === 'theme-transport' || manifest.id === 'theme-saudia-transport') return 'catalog';
      if (manifest.id === 'theme-coffee-artisan' || manifest.id === 'theme-coffee') return 'products';
      return 'catalog';
    }
    if (raw === 'product' || raw === 'product-detail' || raw === 'detail') {
      if (manifest.id === 'theme-coffee-artisan' || manifest.id === 'theme-coffee') return 'product-detail';
      return 'product';
    }
    return raw;
  }, [initialPage, fallbackPage, manifest.id, isAdmin]);

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
      <ThemeErrorBoundary themeName={manifest.name}>
        <Suspense fallback={<DashboardLoader storeId={effectiveStoreId} />}>
          <ThemeComponent initialPage={resolvedInitialPage} isAdmin={isAdmin} />
        </Suspense>
      </ThemeErrorBoundary>
    </div>
  );
};
