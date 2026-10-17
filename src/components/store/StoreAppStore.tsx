import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { AppStoreBrand, ThemeStoreGrid } from '../common/ThemeStoreGrid';
import { useToast } from '../common/ToastProvider';
import { planHasFeature } from '../../auth/plans';
import { Check, Plus, Star, Lock } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';

type StoreTab = 'themes' | 'apps';

/** Arabic labels for plugin categories */
const CATEGORY_AR: Record<string, string> = {
  Payments: 'المدفوعات',
  Shipping: 'الشحن',
  Marketing: 'التسويق',
  'Customer Support': 'دعم العملاء',
  Compliance: 'الامتثال',
};

export const StoreAppStore: React.FC = () => {
  const {
    activeStore,
    themes,
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

  return (
    <div
      className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto"
      style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AppStoreBrand
          subtitle={
            isAr
              ? `${activeStore.name} · ثبّت القوالب والتطبيقات لمتجرك`
              : `${activeStore.name} · install themes & apps for your store`
          }
        />
        <div
          className="flex p-1 rounded-xl gap-1 self-start"
          style={{ background: 'var(--hover-bg)' }}
        >
          {(
            [
              ['themes', isAr ? 'متجر القوالب' : 'Theme Store'],
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
          themes={themes}
          store={activeStore}
          activeThemeId={storeActiveTheme[activeStore.id] || 'theme-commerce-starter'}
          onInstall={(themeId, style) => {
            setStoreTheme(activeStore.id, themeId);
            setStoreHomepageStyle(activeStore.id, style);
          }}
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
                      : isAr ? `${plug.monthlyFee} ر.س/شهريًا` : `SAR ${plug.monthlyFee}/mo`}
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
