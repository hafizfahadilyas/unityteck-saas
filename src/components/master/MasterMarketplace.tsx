import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { AppStoreBrand, ThemeStoreGrid } from '../common/ThemeStoreGrid';
import { Check, Plus, Star } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { getStoreDisplayName } from '../../utils/storeLocalization';

type MasterTab = 'themes' | 'apps';

const CATEGORY_AR: Record<string, string> = {
  All: 'الكل',
  Payments: 'المدفوعات',
  Shipping: 'الشحن والتوصيل',
  Marketing: 'التسويق',
  'Customer Support': 'دعم العملاء',
  Compliance: 'الامتثال الضريبي',
};

export const MasterMarketplace: React.FC = () => {
  const {
    plugins,
    stores,
    storeInstalledPlugins,
    toggleStorePlugin,
    themes,
    storeActiveTheme,
    setStoreTheme,
    setStoreHomepageStyle,
  } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [tab, setTab] = useState<MasterTab>('themes');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || 'store-1');

  const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0];
  const filtered = plugins.filter((p) => categoryFilter === 'All' || p.category === categoryFilter);
  const installedInSelectedStore = storeInstalledPlugins[selectedStoreId] || [];

  if (!selectedStore) {
    return (
      <div className="p-6 text-sm" style={{ color: 'var(--muted)' }}>
        No stores yet — create a store to use the Unityteck App Store.
      </div>
    );
  }

  return (
    <div
      className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto"
      style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <AppStoreBrand subtitle="Master control · Theme Store + Apps for every client store" />

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <span style={{ color: 'var(--muted)' }}>Target store</span>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="font-bold bg-transparent focus:outline-none cursor-pointer"
              style={{ color: 'var(--text)' }}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {getStoreDisplayName(s, locale)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex p-1 rounded-xl gap-1" style={{ background: 'var(--hover-bg)' }}>
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
      </div>

      {tab === 'themes' ? (
        <ThemeStoreGrid
          themes={themes}
          store={selectedStore}
          activeThemeId={storeActiveTheme[selectedStore.id] || 'theme-commerce-starter'}
          onInstall={(themeId, style) => {
            setStoreTheme(selectedStore.id, themeId);
            setStoreHomepageStyle(selectedStore.id, style);
          }}
        />
      ) : (
        <>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['All', 'Payments', 'Shipping', 'Customer Support', 'Compliance'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer border transition-colors"
                style={
                  categoryFilter === cat
                    ? { background: 'var(--active-bg)', color: 'var(--active-fg)', borderColor: 'transparent' }
                    : {
                        background: 'var(--surface)',
                        color: 'var(--muted)',
                        borderColor: 'var(--border)',
                      }
                }
              >
                {isAr ? CATEGORY_AR[cat] || cat : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((plug) => {
              const isInstalled = installedInSelectedStore.includes(plug.id);
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
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--hover-bg)', color: 'var(--muted)' }}
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
                    <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
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
                      onClick={() => toggleStorePlugin(selectedStore.id, plug.id)}
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
                      {isInstalled ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {isInstalled
                        ? isAr ? 'مثبّت على المتجر' : 'Installed on store'
                        : isAr ? 'تثبيت للمتجر' : 'Install for store'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

