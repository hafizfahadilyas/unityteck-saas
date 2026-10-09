/**
 * Runtime prefs: theme · locale · currency · branding (Top 15 palettes / fonts / weights).
 */

import {
  applyBrandCss,
  BrandFontId,
  BrandIconStyle,
  BrandPaletteId,
  BrandFontWeight,
  BrandState,
  DEFAULT_BRAND,
  isBrandFontId,
  isBrandPaletteId,
  resolveFontForLocale,
} from './branding';

export type ThemeMode = 'light' | 'dark';
export type AppLocale = 'en' | 'ar';
export type DisplayCurrency = 'SAR' | 'USD' | 'PKR' | 'EUR' | 'GBP' | 'AED';

export type CurrencyMeta = {
  code: DisplayCurrency;
  symbol: string;
  symbolAr: string;
  rate: number;
  label: string;
  labelAr: string;
};

export const CURRENCIES: Record<DisplayCurrency, CurrencyMeta> = {
  SAR: {
    code: 'SAR',
    symbol: 'SAR',
    symbolAr: 'ر.س',
    rate: 1,
    label: 'Saudi Riyal (SAR)',
    labelAr: 'ريال سعودي (ر.س)',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    symbolAr: '$',
    rate: 0.2667,
    label: 'US Dollar ($)',
    labelAr: 'دولار أمريكي ($)',
  },
  PKR: {
    code: 'PKR',
    symbol: 'PKR',
    symbolAr: 'ر.ب',
    rate: 74.20,
    label: 'Pakistani Rupee (PKR)',
    labelAr: 'روبية باكستانية (PKR)',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    symbolAr: '€',
    rate: 0.245,
    label: 'Euro (€)',
    labelAr: 'يورو (€)',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    symbolAr: '£',
    rate: 0.210,
    label: 'British Pound (£)',
    labelAr: 'جنيه إسترليني (£)',
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    symbolAr: 'د.إ',
    rate: 0.98,
    label: 'UAE Dirham (AED)',
    labelAr: 'درهم إماراتي (د.إ)',
  },
};

const STORAGE_KEY = 'unityteck_prefs';

export type PrefsState = {
  theme: ThemeMode;
  locale: AppLocale;
  currency: DisplayCurrency;
  brand: BrandState;
};

export const DEFAULT_PREFS: PrefsState = {
  theme: 'light',
  locale: 'en',
  currency: 'SAR',
  brand: { ...DEFAULT_BRAND },
};

function parseBrand(raw: unknown): BrandState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_BRAND };
  const b = raw as Partial<BrandState>;
  const palette: BrandPaletteId = isBrandPaletteId(b.palette) ? b.palette : 'holst';
  const font: BrandFontId = isBrandFontId(b.font) ? b.font : 'jakarta';
  const iconStyle: BrandIconStyle =
    b.iconStyle === 'soft' || b.iconStyle === 'sharp' ? b.iconStyle : 'rounded';
  const fontWeight: BrandFontWeight =
    b.fontWeight === 'light' || b.fontWeight === 'medium' || b.fontWeight === 'bold'
      ? b.fontWeight
      : 'regular';
  return { palette, font, iconStyle, fontWeight };
}

export function readPrefs(): PrefsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS, brand: { ...DEFAULT_BRAND } };
    const parsed = JSON.parse(raw) as Partial<PrefsState>;
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      locale: parsed.locale === 'ar' ? 'ar' : 'en',
      currency: parsed.currency && CURRENCIES[parsed.currency as DisplayCurrency]
        ? (parsed.currency as DisplayCurrency)
        : 'SAR',
      brand: parseBrand(parsed.brand),
    };
  } catch {
    return { ...DEFAULT_PREFS, brand: { ...DEFAULT_BRAND } };
  }
}

export function writePrefs(prefs: PrefsState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function applyDocumentPrefs(
  prefs: PrefsState,
  portal?: 'master' | 'store',
): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', prefs.theme);
  root.classList.toggle('dark', prefs.theme === 'dark');
  root.setAttribute('lang', prefs.locale);
  root.setAttribute('dir', prefs.locale === 'ar' ? 'rtl' : 'ltr');
  if (portal) root.setAttribute('data-portal', portal);
  const resolvedFont = resolveFontForLocale(prefs.brand.font, prefs.locale);
  applyBrandCss({ ...prefs.brand, font: resolvedFont }, prefs.locale);
  try {
    localStorage.setItem('unityteck_theme', prefs.theme);
  } catch {
    /* ignore */
  }
}

/**
 * Universal localized money formatter:
 * Handles SAR (ر.س in Arabic, SAR in English),
 * USD ($), PKR (ر.ب in Arabic, PKR in English),
 * EUR (€), and GBP (£).
 */
export function formatMoney(
  amountSar: number,
  currency: DisplayCurrency = 'SAR',
  locale: AppLocale = 'en',
): string {
  const meta = CURRENCIES[currency] ?? CURRENCIES.SAR;
  const converted = amountSar * meta.rate;
  const numLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  const formatted = new Intl.NumberFormat(numLocale, {
    minimumFractionDigits: currency === 'SAR' || currency === 'PKR' ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(converted);

  if (locale === 'ar') {
    if (currency === 'SAR') return `${formatted} ${meta.symbolAr}`;
    if (currency === 'PKR') return `${formatted} ${meta.symbolAr}`;
    if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') return `${meta.symbol}${formatted}`;
    return `${formatted} ${meta.symbolAr}`;
  }

  // English default
  if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
    return `${meta.symbol}${formatted}`;
  }
  return `${meta.symbol} ${formatted}`;
}

/** Overview KPI boxes — formatted number with proper locale digits */
export function formatAmount(
  amountSar: number,
  currency: DisplayCurrency = 'SAR',
  locale: AppLocale = 'en',
): string {
  const meta = CURRENCIES[currency] ?? CURRENCIES.SAR;
  const converted = amountSar * meta.rate;
  const numLocale = locale === 'ar' ? 'ar-SA' : 'en-US';
  return new Intl.NumberFormat(numLocale, {
    minimumFractionDigits: currency === 'SAR' || currency === 'PKR' ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(converted);
}

export type { BrandState, BrandPaletteId, BrandFontId, BrandIconStyle, BrandFontWeight };
