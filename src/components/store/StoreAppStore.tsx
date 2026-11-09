import React, { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { AppStoreBrand, ThemeStoreGrid } from '../common/ThemeStoreGrid';
import { useToast } from '../common/ToastProvider';
import { planHasFeature } from '../../auth/plans';
import { Check, Plus, Star, Lock } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { getDefaultStoreTheme } from '../../auth/defaultTheme';
import {
  COFFEE_OFFICIAL_THEME_ID,
  dedupeThemesById,
  isCoffeeStoreId,
  isCoffeeThemeId,
  sortThemesForStoreMarket,
} from '../../auth/themeMarketplace';
import type { ThemeItem } from '../../types';

type StoreTab = 'themes' | 'apps';

/** Arabic labels for plugin categories */
const CATEGORY_AR: Record<string, string> = {
  Payments: 'المدفوعات',
  Shipping: 'الشحن',
  Marketing: 'التسويق',
  'Customer Support': 'دعم العملاء',
  Compliance: 'الامتثال',
};

type StoreAppStoreProps = {
  onOpenStorefront?: () => void;
};

export const StoreAppStore: React.FC<StoreAppStoreProps> = ({ onOpenStorefront }) => {
  const {
    activeStore,
    themes,
    allStoreThemes,
    storeActiveTheme,
    setStoreTheme,
    setStoreHomepageStyle,
    plugins,
    storeInstalledPlugins,
    toggleStorePlugin,
  } = useTenant();
  const { toast } = useToast();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [tab, setTab] = useState<StoreTab>('themes');

  const installed = storeInstalledPlugins[activeStore.id] || [];
  const canProPlugin = planHasFeature(activeStore, 'themes') || planHasFeature(activeStore, 'ai');
  const activeThemeId = storeActiveTheme[activeStore.id] || getDefaultStoreTheme(activeStore.id);

  /**
   * Marketplace catalog: all unique themes (deduped).
   * Coffee store keeps ONE coffee theme; other stores’ themes show as paid — no free duplicates.
   */
  const marketThemes = useMemo(() => {
    const pooled: ThemeItem[] = [...themes];
    for (const list of Object.values(allStoreThemes || {})) {
      pooled.push(...list);
    }
    let unique = dedupeThemesById(pooled);

    // Coffee: keep only one coffee theme card (official); drop extra coffee skins if any linger in storage
    if (isCoffeeStoreId(activeStore.id)) {
      unique = unique.filter((t) => {
        if (!isCoffeeThemeId(t.id)) return true;
        return t.id === COFFEE_OFFICIAL_THEME_ID || t.id === 'theme-coffee';
      });
      // Prefer artisan id as the single coffee card
      const coffeeCards = unique.filter((t) => isCoffeeThemeId(t.id));
      if (coffeeCards.length > 1) {
        unique = [
          ...unique.filter((t) => !isCoffeeThemeId(t.id)),
          coffeeCards.find((t) => t.id === COFFEE_OFFICIAL_THEME_ID) || coffeeCards[0],
        ];
      }
    }

    return sortThemesForStoreMarket(unique, activeStore.id, activeThemeId);
  }, [themes, allStoreThemes, activeStore.id, activeThemeId]);

  const otherStoreCount = useMemo(() => {
    const ids = new Set(
      marketThemes
        .filter((t) => t.id !== activeThemeId)
        .map((t) => t.storeId)
        .filter(Boolean),
    );
    return ids.size;
  }, [marketThemes, activeThemeId]);

  return (
    <div
      className="u-page p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto w-full min-w-0"
      style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AppStoreBrand
          subtitle={
            isAr
              ? `سوق الثيمات · ثيمات${otherStoreCount || 'باقي'}متاجر · شراء ومعاينة`
              : `Themes Market · Themes from ${otherStoreCount || 'other'} stores · Buy & View`
          }
        />
        <div
          className="flex p-1 rounded-xl gap-1 self-start"
          style={{ background: 'var(--hover-bg)' }}
        >
          {(
            [
              ['themes', isAr ? 'سوق الثيمات' : 'Themes Market'],
              ['apps', isAr ? 'التطبيقات والإضافات' : 'Apps & plugins'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              style={
                tab === id
                  ? { background: 'var(--active-bg)', color: 'var(--active-fg)' }
                  : { color: 'var(--muted)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'themes' ? (
        <ThemeStoreGrid
          themes={marketThemes}
          store={activeStore}
          activeThemeId={activeThemeId}
          mode="market"
          onInstall={(themeId, style) => {
            setStoreTheme(activeStore.id, themeId);
            setStoreHomepageStyle(activeStore.id, style);
          }}
          onViewInStore={() => onOpenStorefront?.()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plugins.map((plug) => {
            const isInstalled = installed.includes(plug.id);
            const locked = plug.isProOnly && !canProPlugin;
            const plugName = isAr ? (plug.nameAr || plug.name) : (plug.nameEn || plug.name);
            const plugDesc = isAr ? (plug.descriptionAr || plug.description) : (plug.descriptionEn || plug.description);
            const plugCategory = isAr ? (plug.categoryAr || CATEGORY_AR[plug.category] || plug.category) : (plug.categoryEn || plug.category);
            const plugProvider = isAr ? (plug.providerAr || plug.provider) : (plug.providerEn || plug.provider);

            return (
              <div
                key={plug.id}
                className="rounded-2xl border p-4 flex flex-col gap-3"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                      {plugName}
                    </h3>
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
                      {plugCategory}
                    </span>
                  </div>
                  {plug.isProOnly ? (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      {isAr ? 'احترافي' : 'Pro'}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {plugDesc}
                </p>
                <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--muted)' }}>
                  <span>{plugProvider}</span>
                  <span className="inline-flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {plug.rating}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                    {plug.monthlyFee === 0
                      ? isAr ? 'مجاني' : 'Free'
                      : isAr ? `${plug.monthlyFee}ر.س/شهريًا` : `SAR ${plug.monthlyFee}/mo`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (locked) {
                        toast(isAr ? 'يتطلب هذا التطبيق الباقة الاحترافية.' : 'Pro plan required for this app.', 'error');
                        return;
                      }
                      toggleStorePlugin(activeStore.id, plug.id);
                      toast(
                        isInstalled
                          ? isAr ? 'تمت إزالة التطبيق' : 'App removed'
                          : isAr ? 'تم تثبيت التطبيق' : 'App installed',
                        'success',
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    style={
                      isInstalled
                        ? {
                            background: 'color-mix(in srgb, var(--tone-danger) 12%, var(--surface))',
                            color: 'var(--tone-danger)',
                          }
                        : { background: 'var(--active-bg)', color: 'var(--active-fg)' }
                    }
                  >
                    {locked ? <Lock className="w-3.5 h-3.5" /> : isInstalled ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {locked
                      ? isAr ? 'للباقة الاحترافية' : 'Pro only'
                      : isInstalled
                        ? isAr ? 'مثبّت' : 'Installed'
                        : isAr ? 'تثبيت' : 'Install'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
