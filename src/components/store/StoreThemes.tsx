import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { ExternalLink, Globe, LayoutTemplate, Lock, Sparkles } from 'lucide-react';
import { planHasFullThemes, planInfoForStore } from '../../auth/plans';
import { getDefaultStoreTheme } from '../../auth/defaultTheme';
import { useToast } from '../common/ToastProvider';
import { ThemeSettingsMaster } from './themeSettings/ThemeSettingsMaster';
import { preloadVisualThemeBuilder } from './visualBuilder/preloadVisualBuilder';
import { ThemeBuilderLoadingShell } from './visualBuilder/ThemeBuilderLoadingShell';

const VisualThemeBuilder = React.lazy<React.ComponentType<any>>(() =>
  preloadVisualThemeBuilder().then((m: any) => ({ default: m.VisualThemeBuilder })),
);

interface StoreThemesProps {
  onOpenStorefront?: () => void;
  onCustomizeTheme?: (targetThemeId?: string, targetPage?: string) => void;
  onOpenThemeCustomizer?: (sectionId?: string) => void;
}

export const StoreThemes: React.FC<StoreThemesProps> = ({
  onOpenStorefront,
  onCustomizeTheme,
  onOpenThemeCustomizer,
}) => {
  const { activeStore, storeActiveTheme } = useTenant();
  const { toast } = useToast();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const fullAccess = planHasFullThemes(activeStore);
  const planInfo = planInfoForStore(activeStore);
  const currentThemeId = storeActiveTheme[activeStore.id] || getDefaultStoreTheme(activeStore.id);

  const isCarStore =
    activeStore.id === 'store-bleco' ||
    activeStore.slug === 'bleco-sa' ||
    activeStore.slug?.includes('car') ||
    activeStore.slug?.includes('transport') ||
    currentThemeId === 'theme-saudia-transport';

  const isCoffeeStore =
    !isCarStore &&
    (activeStore.id === 'store-coffee' ||
      activeStore.slug === 'coffee-store' ||
      activeStore.slug?.includes('coffee') ||
      activeStore.category?.includes('قهوة') ||
      currentThemeId?.includes('coffee'));

  const storeSlug = isCarStore ? 'car' : isCoffeeStore ? 'coffee' : 'hadaya';
  const localStorefrontUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?store=${storeSlug}&fullscreen=1`;

  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const liveStoreLabel =
    isCarStore || isCoffeeStore || isLocalHost
      ? isAr
        ? 'زيارة المتجر'
        : 'Visit Store'
      : activeStore.custom_domain ||
        activeStore.domain ||
        `${activeStore.slug || 'store'}.unityteck.com`;

  const liveStoreHref =
    isCarStore || isCoffeeStore || isLocalHost
      ? localStorefrontUrl
      : activeStore.custom_domain
        ? `https://${activeStore.custom_domain}/`
        : `https://${activeStore.slug || 'store'}.unityteck.com/`;

  const [isVisualBuilderOpen, setIsVisualBuilderOpen] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      const params = new URLSearchParams(window.location.search);
      if (params.get('builder') === '1' || params.get('builder') === 'true') return true;
      return sessionStorage.getItem('unityteck_visual_builder_open') === '1';
    } catch {
      return false;
    }
  });

  const [builderThemeId, setBuilderThemeId] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const q = new URLSearchParams(window.location.search).get('themeId');
        if (q && !q.includes('[object') && q !== 'undefined' && q !== 'null') return q.trim();
        const saved =
          sessionStorage.getItem(`unityteck_visual_builder_theme_${activeStore.id}`) ||
          sessionStorage.getItem('unityteck_visual_builder_theme');
        if (saved && !saved.includes('[object') && saved !== 'undefined' && saved !== 'null') {
          return saved.trim();
        }
      }
    } catch {
      /* ignore */
    }
    return currentThemeId;
  });

  const [builderInitialPage, setBuilderInitialPage] = useState<string | undefined>(() => {
    try {
      if (typeof window === 'undefined') return undefined;
      return (
        new URLSearchParams(window.location.search).get('builderPage') ||
        sessionStorage.getItem('unityteck_visual_builder_page') ||
        undefined
      );
    } catch {
      return undefined;
    }
  });

  useEffect(() => {
    preloadVisualThemeBuilder();
  }, []);

  useEffect(() => {
    setBuilderThemeId(currentThemeId);
  }, [currentThemeId, activeStore.id]);

  const openVisualBuilder = (targetThemeId?: string, builderPage?: string) => {
    const resolvedPage = builderPage || 'home';
    preloadVisualThemeBuilder();
    const cleanTarget =
      typeof targetThemeId === 'string' &&
      targetThemeId.trim() &&
      !targetThemeId.includes('[object') &&
      targetThemeId !== 'undefined' &&
      targetThemeId !== 'null'
        ? targetThemeId.trim()
        : undefined;

    const tid = cleanTarget || currentThemeId;
    setBuilderInitialPage(resolvedPage);
    if (onCustomizeTheme) {
      onCustomizeTheme(tid);
      return;
    }

    if (tid) setBuilderThemeId(tid);
    setIsVisualBuilderOpen(true);
    try {
      sessionStorage.setItem('unityteck_visual_builder_open', '1');
      if (tid) {
        sessionStorage.setItem(`unityteck_visual_builder_theme_${activeStore.id}`, tid);
        sessionStorage.setItem('unityteck_visual_builder_theme', tid);
      }
      sessionStorage.setItem('unityteck_visual_builder_page', resolvedPage);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('builder', '1');
        if (tid) url.searchParams.set('themeId', tid);
        url.searchParams.set('builderPage', resolvedPage);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      /* ignore */
    }
  };

  const closeVisualBuilder = () => {
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
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const openFromSidebar = (e: Event) => {
      const detail = (e as CustomEvent<{ page?: string }>).detail;
      openVisualBuilder(undefined, detail?.page);
    };
    window.addEventListener('unityteck-open-visual-builder', openFromSidebar as EventListener);
    try {
      const intentRaw = sessionStorage.getItem('unityteck-theme-intent');
      if (intentRaw) {
        sessionStorage.removeItem('unityteck-theme-intent');
        if (intentRaw === 'theme-settings') {
          onOpenThemeCustomizer?.('01_store_identity');
        } else if (intentRaw !== 'installed') {
          try {
            const parsed = JSON.parse(intentRaw) as { type?: string; page?: string };
            if (parsed?.type === 'builder') {
              openFromSidebar(
                new CustomEvent('unityteck-open-visual-builder', {
                  detail: { page: parsed.page },
                }),
              );
            }
          } catch {
            /* ignore bad intent */
          }
        }
      }
    } catch {
      /* storage may be unavailable */
    }
    return () => {
      window.removeEventListener('unityteck-open-visual-builder', openFromSidebar as EventListener);
    };
  }, [currentThemeId, onCustomizeTheme, onOpenThemeCustomizer, activeStore.id]);

  return (
    <div
      className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto w-full min-w-0"
      style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
    >
      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {isAr ? 'الثيمات والتصميم' : 'Themes & Design'}
            </h1>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1"
              style={{
                background: fullAccess
                  ? 'color-mix(in srgb, var(--tone-violet) 14%, var(--surface))'
                  : 'color-mix(in srgb, var(--accent) 14%, var(--surface))',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              {fullAccess ? (
                <>
                  <Sparkles className="w-3 h-3" style={{ color: 'var(--tone-violet)' }} />
                  {isAr ? 'باقة كاملة' : 'Pro Enabled'}
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                  {isAr
                    ? planInfo.code === 'free'
                      ? 'الخطة المجانية'
                      : planInfo.code === 'paid'
                        ? 'الخطة المدفوعة'
                        : `خطة ${planInfo.name}`
                    : `${planInfo.name} Plan`}
                </>
              )}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'تخصيص الثيم أو محرر الصفحات — ثم معاينة المتجر المباشر'
              : 'Customize theme or edit pages — then preview the live store'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {onOpenThemeCustomizer && (
            <button
              type="button"
              onClick={() => onOpenThemeCustomizer('01_store_identity')}
              className="unity-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:opacity-95 cursor-pointer"
              title={isAr ? 'فتح مخصص الثيم' : 'Open Theme Customizer'}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAr ? 'تخصيص الثيم' : 'Customize Theme'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openVisualBuilder()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all hover:opacity-95 cursor-pointer"
            style={{ background: 'var(--portal-cta)' }}
            title={isAr ? 'فتح محرر الصفحات البصري' : 'Open Visual Page Builder'}
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>{isAr ? 'محرر الصفحات' : 'Page Builder'}</span>
          </button>

          <a
            href={liveStoreHref}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-95"
            style={{
              background: 'var(--hover-bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            title={isAr ? 'زيارة المتجر المباشر' : 'Visit live storefront'}
            onClick={(e) => {
              // Prefer new-tab preview so /admin Themes never unmounts into storefront.
              if (onOpenStorefront && (isLocalHost || isCarStore || isCoffeeStore)) {
                e.preventDefault();
                onOpenStorefront();
              }
            }}
          >
            <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span>{liveStoreLabel}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>

      <ThemeSettingsMaster
        onOpenStorefront={onOpenStorefront}
        onOpenThemeCustomizer={onOpenThemeCustomizer}
        onOpenPageBuilder={() => openVisualBuilder()}
      />

      {!onCustomizeTheme && isVisualBuilderOpen && (
        <React.Suspense fallback={<ThemeBuilderLoadingShell />}>
          <VisualThemeBuilder
            isOpen={isVisualBuilderOpen}
            themeId={builderThemeId}
            initialPage={builderInitialPage as any}
            onClose={closeVisualBuilder}
            onPublishSuccess={() => {
              toast(
                isAr ? 'تم نشر التعديلات بنجاح على المتجر المباشر!' : 'Changes published successfully to live store!',
                'success',
              );
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
};
