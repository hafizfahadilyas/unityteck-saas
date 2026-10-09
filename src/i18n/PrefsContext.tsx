import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { translate, type DictKey } from './dict';
import {
  applyDocumentPrefs,
  BrandFontId,
  BrandIconStyle,
  BrandPaletteId,
  BrandFontWeight,
  BrandState,
  DEFAULT_PREFS,
  DisplayCurrency,
  formatMoney,
  formatAmount,
  PrefsState,
  readPrefs,
  ThemeMode,
  writePrefs,
  type AppLocale,
} from './prefs';
import { DEFAULT_BRAND } from './branding';

type PrefsApi = PrefsState & {
  setTheme: (theme: ThemeMode) => void;
  setLocale: (locale: AppLocale) => void;
  setCurrency: (currency: DisplayCurrency) => void;
  setBrand: (brand: Partial<BrandState>) => void;
  setPalette: (palette: BrandPaletteId) => void;
  setFont: (font: BrandFontId) => void;
  setIconStyle: (iconStyle: BrandIconStyle) => void;
  setFontWeight: (fontWeight: BrandFontWeight) => void;
  toggleTheme: () => void;
  toggleLocale: () => void;
  t: (key: DictKey) => string;
  money: (amountSar: number) => string;
  /** Overview KPI — digits only, no currency symbol */
  amount: (amountSar: number) => string;
  dir: 'ltr' | 'rtl';
  allowedLocales: AppLocale[];
};

const PrefsContext = createContext<PrefsApi | null>(null);

export function PrefsProvider({
  children,
  portal = 'master',
  activeStoreLanguages,
}: {
  children: React.ReactNode;
  portal?: 'master' | 'store';
  activeStoreLanguages?: { english?: boolean; arabic?: boolean };
}) {
  const [prefs, setPrefs] = useState<PrefsState>(() =>
    typeof window !== 'undefined' ? readPrefs() : { ...DEFAULT_PREFS, brand: { ...DEFAULT_BRAND } },
  );

  const allowedLocales = useMemo<AppLocale[]>(() => {
    if (portal === 'master' || !activeStoreLanguages) {
      return ['en', 'ar'];
    }
    const allowed: AppLocale[] = [];
    if (activeStoreLanguages.english !== false) allowed.push('en');
    if (activeStoreLanguages.arabic !== false) allowed.push('ar');
    return allowed.length > 0 ? allowed : ['en', 'ar'];
  }, [portal, activeStoreLanguages]);

  useEffect(() => {
    applyDocumentPrefs(prefs, portal);
    writePrefs(prefs);
  }, [prefs, portal]);

  /** Patch prefs and apply dir/lang/theme to <html> immediately (no waiting for paint). */
  const patch = useCallback(
    (partial: Partial<PrefsState>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...partial };
        applyDocumentPrefs(next, portal);
        writePrefs(next);
        return next;
      });
    },
    [portal],
  );

  // Enforce store language restrictions if active store has limited languages
  useEffect(() => {
    if (!allowedLocales.includes(prefs.locale)) {
      const fallback = allowedLocales[0] || 'en';
      patch({ locale: fallback });
    }
  }, [allowedLocales, prefs.locale, patch]);

  const setBrand = useCallback(
    (brandPartial: Partial<BrandState>) => {
      setPrefs((prev) => {
        const next = {
          ...prev,
          brand: { ...prev.brand, ...brandPartial },
        };
        applyDocumentPrefs(next, portal);
        writePrefs(next);
        return next;
      });
    },
    [portal],
  );

  const api = useMemo<PrefsApi>(
    () => ({
      ...prefs,
      setTheme: (theme) => patch({ theme }),
      setLocale: (locale) => {
        if (allowedLocales.includes(locale)) {
          patch({ locale });
        }
      },
      setCurrency: (currency) => patch({ currency }),
      setBrand,
      setPalette: (palette) => setBrand({ palette }),
      setFont: (font) => setBrand({ font }),
      setIconStyle: (iconStyle) => setBrand({ iconStyle }),
      setFontWeight: (fontWeight) => setBrand({ fontWeight }),
      toggleTheme: () =>
        patch({ theme: prefs.theme === 'light' ? 'dark' : 'light' }),
      toggleLocale: () => {
        if (allowedLocales.length > 1) {
          const next: AppLocale = prefs.locale === 'en' ? 'ar' : 'en';
          if (allowedLocales.includes(next)) {
            patch({ locale: next });
          }
        }
      },
      t: (key) => translate(prefs.locale, key),
      money: (amountSar) => formatMoney(amountSar, prefs.currency, prefs.locale),
      amount: (amountSar) => formatAmount(amountSar, prefs.currency, prefs.locale),
      dir: prefs.locale === 'ar' ? 'rtl' : 'ltr',
      allowedLocales,
    }),
    [prefs, patch, setBrand, allowedLocales],
  );

  return (
    <PrefsContext.Provider value={api}>{children}</PrefsContext.Provider>
  );
}

export function usePrefs(): PrefsApi {
  const ctx = useContext(PrefsContext);
  if (!ctx) {
    return {
      ...DEFAULT_PREFS,
      brand: { ...DEFAULT_BRAND },
      setTheme: () => {},
      setLocale: () => {},
      setCurrency: () => {},
      setBrand: () => {},
      setPalette: () => {},
      setFont: () => {},
      setIconStyle: () => {},
      setFontWeight: () => {},
      toggleTheme: () => {},
      toggleLocale: () => {},
      t: (key) => translate('en', key),
      money: (n) => formatMoney(n, 'SAR', 'en'),
      amount: (n) => formatAmount(n, 'SAR', 'en'),
      dir: 'ltr',
      allowedLocales: ['en', 'ar'],
    };
  }
  return ctx;
}
