import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
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
import {
  AR_FONTS,
  DEFAULT_BRAND,
  EN_FONTS,
  type BrandFontArId,
  type BrandFontEnId,
} from './branding';

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

/** Admin chrome is always bilingual for every store (Master + Store portals). */
const ADMIN_LOCALES: AppLocale[] = ['ar', 'en'];

function broadcastLocale(locale: AppLocale): void {
  try {
    window.dispatchEvent(
      new CustomEvent('unityteck-locale-changed', { detail: { locale } }),
    );
  } catch {
    /* ignore */
  }
}

export function PrefsProvider({
  children,
  portal = 'master',
  /** Storefront language flags only — never gate admin chrome AR/EN switch. */
  activeStoreLanguages: _activeStoreLanguages,
}: {
  children: React.ReactNode;
  portal?: 'master' | 'store';
  activeStoreLanguages?: { english?: boolean; arabic?: boolean };
}) {
  const [prefs, setPrefs] = useState<PrefsState>(() =>
    typeof window !== 'undefined' ? readPrefs() : { ...DEFAULT_PREFS, brand: { ...DEFAULT_BRAND } },
  );

  // Full language switch for ALL stores — admin chrome always AR + EN.
  const allowedLocales = ADMIN_LOCALES;

  useEffect(() => {
    applyDocumentPrefs(prefs, portal);
    writePrefs(prefs);
  }, [prefs, portal]);

  /**
   * Rehydrate locale from localStorage when another tab/window updates prefs.
   * Never invent a new locale — only apply a persisted ar|en value.
   * Prevents “auto switch” after soft remount / multi-tab drift.
   */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'unityteck_prefs' || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as { locale?: string };
        const next = parsed.locale === 'ar' ? 'ar' : parsed.locale === 'en' ? 'en' : null;
        if (!next) return;
        setPrefs((prev) => {
          if (prev.locale === next) return prev;
          const merged = { ...prev, locale: next as AppLocale };
          applyDocumentPrefs(merged, portal);
          return merged;
        });
      } catch {
        /* ignore bad prefs payload */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [portal]);

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

  /** Instant locale commit — dir/lang + React tree in one synchronous turn. */
  const applyLocale = useCallback(
    (nextLocale: AppLocale) => {
      if (!allowedLocales.includes(nextLocale)) return;
      // Keep coffee storefront preview key in sync so it cannot snap admin chrome back.
      try {
        localStorage.setItem(
          'unityteck_coffee_lang',
          nextLocale === 'ar' ? 'AR' : 'EN',
        );
      } catch {
        /* ignore */
      }
      flushSync(() => {
        setPrefs((prev) => {
          if (prev.locale === nextLocale) return prev;
          const next = { ...prev, locale: nextLocale };
          applyDocumentPrefs(next, portal);
          writePrefs(next);
          return next;
        });
      });
      // Belt-and-suspenders: force html lang/dir even if React bails on same reference
      try {
        const root = document.documentElement;
        root.setAttribute('lang', nextLocale);
        root.setAttribute('dir', nextLocale === 'ar' ? 'rtl' : 'ltr');
      } catch {
        /* ignore */
      }
      broadcastLocale(nextLocale);
    },
    [portal, allowedLocales],
  );

  // Keep locale inside the always-on admin pair (safety net).
  useEffect(() => {
    if (!allowedLocales.includes(prefs.locale)) {
      applyLocale(allowedLocales[0] || 'ar');
    }
  }, [allowedLocales, prefs.locale, applyLocale]);

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

  // Stable locale-locked translator — never closes over a stale locale.
  const t = useCallback((key: DictKey) => translate(prefs.locale, key), [prefs.locale]);

  const api = useMemo<PrefsApi>(
    () => ({
      ...prefs,
      theme: 'light',
      setTheme: () => patch({ theme: 'light' }),
      setLocale: (nextLocale) => applyLocale(nextLocale),
      setCurrency: (currency) => patch({ currency }),
      setBrand,
      setPalette: (palette) => setBrand({ palette, customAccentHex: null }),
      setFont: (font) => {
        const patchFont: Partial<typeof DEFAULT_BRAND> = { font };
        if (EN_FONTS.includes(font)) {
          patchFont.fontEn = font as BrandFontEnId;
        }
        if (AR_FONTS.includes(font)) {
          patchFont.fontAr = font as BrandFontArId;
        }
        setBrand(patchFont);
      },
      setIconStyle: (iconStyle) => setBrand({ iconStyle }),
      setFontWeight: (fontWeight) => setBrand({ fontWeight }),
      toggleTheme: () => patch({ theme: 'light' }),
      toggleLocale: () => {
        const next: AppLocale = prefs.locale === 'en' ? 'ar' : 'en';
        applyLocale(next);
      },
      t,
      money: (amountSar) => formatMoney(amountSar, prefs.currency, prefs.locale),
      amount: (amountSar) => formatAmount(amountSar, prefs.currency, prefs.locale),
      dir: prefs.locale === 'ar' ? 'rtl' : 'ltr',
      allowedLocales,
    }),
    [prefs, patch, setBrand, allowedLocales, t, applyLocale],
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
      allowedLocales: ['ar', 'en'],
    };
  }
  return ctx;
}
