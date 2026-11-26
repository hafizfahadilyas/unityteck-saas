import React, { useEffect, useState } from 'react';
import {
  Check,
  Palette,
  Type,
  Shapes,
  Sliders,
  Zap,
  Pipette,
  Save,
  PaintBucket,
  ALargeSmall,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  BRAND_FONTS,
  BRAND_FONT_WEIGHTS,
  BRAND_FONT_WEIGHT_ORDER,
  BRAND_ICON_RADIUS,
  BRAND_PALETTES,
  DEFAULT_BRAND,
  TOP_15_PALETTES,
  applyStoreArabicTypography,
  ensureBrandFontStylesheet,
  parseHexColor,
  readableTextForTheme,
  resolveArFontStack,
  type BrandFontArId,
  type BrandFontEnId,
  type BrandFontId,
  type BrandFontWeight,
  type BrandIconStyle,
  type BrandPaletteId,
  type BrandState,
} from '../../i18n/branding';
import { useToast } from './ToastProvider';
import { fetchPlatformSettings, updatePlatformSettings } from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
import { StoreFontSelect } from '../store/fonts/StoreFontSelect';
import {
  STORE_ARABIC_FONT_COUNT,
  STORE_ENGLISH_FONT_COUNT,
  ensureStoreGoogleFontLoaded,
  googleFontsCssUrl,
} from '../../data/storeGoogleFontsCatalog';

/** Map catalog family name → BrandFontArId when curated id exists. */
const AR_FAMILY_TO_BRAND_ID: Record<string, BrandFontArId> = {
  'SF Arabic': 'sf-arabic',
  Cairo: 'cairo',
  Tajawal: 'tajawal',
  'Noto Sans Arabic': 'noto',
  'IBM Plex Sans Arabic': 'ibm-plex-ar',
  Almarai: 'almarai',
  'Readex Pro': 'readex-pro',
  'Noto Kufi Arabic': 'noto-kufi',
  Amiri: 'amiri',
  'Markazi Text': 'markazi',
  Changa: 'changa',
  'El Messiri': 'el-messiri',
  Alexandria: 'alexandria',
  'Reem Kufi': 'reem-kufi',
  'Noto Naskh Arabic': 'noto-naskh',
};

const EN_FAMILY_TO_BRAND_ID: Record<string, BrandFontEnId> = {
  'Plus Jakarta Sans': 'jakarta',
  Inter: 'inter',
  'DM Sans': 'dm-sans',
  Manrope: 'manrope',
  Outfit: 'outfit',
  Poppins: 'poppins',
  Urbanist: 'urbanist',
  Roboto: 'roboto',
  'Open Sans': 'open-sans',
  Lato: 'lato',
  Montserrat: 'montserrat',
  'Nunito Sans': 'nunito-sans',
  'Source Sans 3': 'source-sans-3',
  'Work Sans': 'work-sans',
  Rubik: 'rubik',
};

/**
 * Shared Master + Store branding:
 * Top 15 palettes + custom hex · EN/AR fonts · weights · icon shapes.
 * Applies globally via CSS variables (pages, tables, forms, modals).
 * Master: persistPlatform saves branding into platform_settings (live MySQL).
 */
export type StoreTypographyPatch = {
  fontAr?: BrandFontArId;
  fontWeight?: BrandFontWeight;
  customFontFamilyAr?: string | null;
  customFontUrlAr?: string | null;
};

export const BrandingPanel: React.FC<{
  title?: string;
  activePalette?: BrandPaletteId | null;
  onPaletteSelect?: (id: BrandPaletteId) => void;
  storeScoped?: boolean;
  /** Master Settings — load/save branding via /platform/settings */
  persistPlatform?: boolean;
  /** Store Appearance: sync bg/text into per-store chromeBrand for Save appearance */
  onStoreColorsChange?: (next: { bg: string | null; text: string | null }) => void;
  /** Store Appearance: sync Arabic font + weight into per-store chromeBrand */
  onStoreTypographyChange?: (next: StoreTypographyPatch) => void;
  /** Hydrate Arabic font dropdown from this store's chromeBrand */
  initialStoreTypography?: StoreTypographyPatch | null;
}> = ({
  title,
  activePalette,
  onPaletteSelect,
  storeScoped = false,
  persistPlatform = false,
  onStoreColorsChange,
  onStoreTypographyChange,
  initialStoreTypography = null,
}) => {
  const {
    brand,
    setBrand,
    setPalette,
    setFont,
    setIconStyle,
    setFontWeight,
    locale,
  } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const [customHex, setCustomHex] = useState(brand.customAccentHex || '#1d8b94');
  const [scrollbarHex, setScrollbarHex] = useState(brand.customScrollbarHex || '#4fb8b4');
  const [bgHex, setBgHex] = useState(brand.customBgHex || '#e2f4f0');
  const [textHex, setTextHex] = useState(brand.customTextHex || '#04222b');
  const [customFontName, setCustomFontName] = useState(brand.customFontFamilyAr || '');
  const [customFontUrl, setCustomFontUrl] = useState(brand.customFontUrlAr || '');
  const [platformBusy, setPlatformBusy] = useState(false);
  const [platformHydrated, setPlatformHydrated] = useState(!persistPlatform);
  const isDark = false;
  const weightMeta = BRAND_FONT_WEIGHTS[brand.fontWeight || 'regular'];

  useEffect(() => {
    if (brand.customAccentHex) setCustomHex(brand.customAccentHex);
  }, [brand.customAccentHex]);

  useEffect(() => {
    if (brand.customScrollbarHex) setScrollbarHex(brand.customScrollbarHex);
  }, [brand.customScrollbarHex]);

  useEffect(() => {
    if (brand.customBgHex) setBgHex(brand.customBgHex);
  }, [brand.customBgHex]);

  useEffect(() => {
    if (brand.customTextHex) setTextHex(brand.customTextHex);
  }, [brand.customTextHex]);

  useEffect(() => {
    if (brand.customFontFamilyAr) setCustomFontName(brand.customFontFamilyAr);
  }, [brand.customFontFamilyAr]);

  useEffect(() => {
    if (brand.customFontUrlAr) setCustomFontUrl(brand.customFontUrlAr);
  }, [brand.customFontUrlAr]);

  /** Store-isolated hydrate: this store's chromeBrand typography → live prefs */
  useEffect(() => {
    if (!storeScoped || !initialStoreTypography) return;
    const patch: Partial<BrandState> = {};
    if (initialStoreTypography.fontAr) {
      patch.fontAr = initialStoreTypography.fontAr;
      patch.font = initialStoreTypography.fontAr;
    }
    if (initialStoreTypography.fontWeight) {
      patch.fontWeight = initialStoreTypography.fontWeight;
    }
    if (initialStoreTypography.customFontFamilyAr !== undefined) {
      patch.customFontFamilyAr = initialStoreTypography.customFontFamilyAr;
      if (initialStoreTypography.customFontFamilyAr) {
        setCustomFontName(initialStoreTypography.customFontFamilyAr);
      }
    }
    if (initialStoreTypography.customFontUrlAr !== undefined) {
      patch.customFontUrlAr = initialStoreTypography.customFontUrlAr;
      if (initialStoreTypography.customFontUrlAr) {
        setCustomFontUrl(initialStoreTypography.customFontUrlAr);
      }
    }
    if (Object.keys(patch).length) setBrand(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per store chrome snapshot
  }, [storeScoped, initialStoreTypography?.fontAr, initialStoreTypography?.fontWeight]);

  const pushStoreTypography = (next: StoreTypographyPatch) => {
    if (storeScoped) onStoreTypographyChange?.(next);
  };

  useEffect(() => {
    if (!persistPlatform || !isApiEnabled()) {
      setPlatformHydrated(true);
      return;
    }
    let cancelled = false;
    void fetchPlatformSettings()
      .then((res) => {
        if (cancelled) return;
        const raw = (res.data?.branding || {}) as Partial<BrandState>;
        const next: Partial<BrandState> = {
          palette: (raw.palette as BrandPaletteId) || DEFAULT_BRAND.palette,
          fontEn: (raw.fontEn as BrandFontEnId) || DEFAULT_BRAND.fontEn,
          fontAr: (raw.fontAr as BrandFontArId) || DEFAULT_BRAND.fontAr,
          iconStyle: (raw.iconStyle as BrandIconStyle) || DEFAULT_BRAND.iconStyle,
          fontWeight: (raw.fontWeight as BrandFontWeight) || DEFAULT_BRAND.fontWeight,
          customAccentHex: raw.customAccentHex ?? null,
          customScrollbarHex: raw.customScrollbarHex ?? null,
          customBgHex: raw.customBgHex ?? null,
          customTextHex: raw.customTextHex ?? null,
          customFontFamilyAr: raw.customFontFamilyAr ?? null,
          customFontUrlAr: raw.customFontUrlAr ?? null,
        };
        const activeFont =
          locale === 'ar'
            ? (next.fontAr as BrandFontId) || DEFAULT_BRAND.font
            : (next.fontEn as BrandFontId) || DEFAULT_BRAND.font;
        setBrand({ ...next, font: activeFont });
        if (next.customAccentHex) setCustomHex(String(next.customAccentHex));
        if (next.customScrollbarHex) setScrollbarHex(String(next.customScrollbarHex));
        if (next.customBgHex) setBgHex(String(next.customBgHex));
        if (next.customTextHex) setTextHex(String(next.customTextHex));
        if (next.customFontFamilyAr) setCustomFontName(String(next.customFontFamilyAr));
        if (next.customFontUrlAr) setCustomFontUrl(String(next.customFontUrlAr));
        setPlatformHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setPlatformHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [persistPlatform, locale, setBrand]);

  const savePlatformBranding = async () => {
    if (!persistPlatform) return;
    if (!isApiEnabled()) {
      toast(isAr ? 'الخادم غير متصل — لا يمكن الحفظ' : 'API offline — cannot save', 'warning');
      return;
    }
    if (platformBusy) return;
    setPlatformBusy(true);
    try {
      await updatePlatformSettings({
        branding: {
          palette: brand.palette,
          fontEn: brand.fontEn || DEFAULT_BRAND.fontEn,
          fontAr: brand.fontAr || DEFAULT_BRAND.fontAr,
          iconStyle: brand.iconStyle,
          fontWeight: brand.fontWeight || 'regular',
          customAccentHex: brand.customAccentHex ?? null,
          customScrollbarHex: brand.customScrollbarHex ?? null,
          customBgHex: brand.customBgHex ?? null,
          customTextHex: brand.customTextHex ?? null,
          customFontFamilyAr: brand.customFontFamilyAr ?? null,
          customFontUrlAr: brand.customFontUrlAr ?? null,
        },
      });
      toast(
        isAr ? 'تم حفظ الألوان والخطوط في إعدادات المنصة' : 'Theme & fonts saved to platform settings',
        'success',
      );
    } catch {
      toast(isAr ? 'فشل حفظ الهوية' : 'Failed to save branding', 'error');
    } finally {
      setPlatformBusy(false);
    }
  };

  const panelTitle =
    title ||
    (isAr ? 'الهوية · الألوان · الخطوط · الأيقونات' : 'Branding · Color · Font · Icons');

  const applyCustomAccent = (hex: string) => {
    const normalized = hex.startsWith('#') ? hex : `#${hex}`;
    if (!parseHexColor(normalized)) {
      toast(isAr ? 'رمز لون غير صالح' : 'Invalid color code', 'error');
      return;
    }
    setCustomHex(normalized);
    setBrand({ customAccentHex: normalized });
    toast(isAr ? 'تم تطبيق اللون المخصص' : 'Custom color applied', 'success');
  };

  const clearCustomAccent = () => {
    setBrand({ customAccentHex: null });
    toast(isAr ? 'تم إلغاء اللون المخصص' : 'Custom color cleared', 'success');
  };

  const applyScrollbarColor = (hex: string) => {
    const normalized = hex.startsWith('#') ? hex : `#${hex}`;
    if (!parseHexColor(normalized)) {
      toast(isAr ? 'رمز لون غير صالح' : 'Invalid color code', 'error');
      return;
    }
    setScrollbarHex(normalized);
    setBrand({ customScrollbarHex: normalized });
    toast(isAr ? 'تم تطبيق لون شريط التمرير' : 'Scrollbar color applied', 'success');
  };

  const clearScrollbarColor = () => {
    setBrand({ customScrollbarHex: null });
    toast(
      isAr ? 'شريط التمرير يتبع لون الهوية الآن' : 'Scrollbar now follows brand color',
      'success',
    );
  };

  const applyBgColor = (hex: string) => {
    const normalized = hex.startsWith('#') ? hex : `#${hex}`;
    if (!parseHexColor(normalized)) {
      toast(isAr ? 'رمز لون غير صالح' : 'Invalid color code', 'error');
      return;
    }
    setBgHex(normalized);
    setBrand({ customBgHex: normalized });
    if (storeScoped) onStoreColorsChange?.({ bg: normalized, text: brand.customTextHex ?? null });
    toast(isAr ? 'تم تطبيق لون الخلفية' : 'Background color applied', 'success');
  };

  const clearBgColor = () => {
    setBrand({ customBgHex: null });
    if (storeScoped) onStoreColorsChange?.({ bg: null, text: brand.customTextHex ?? null });
    toast(isAr ? 'الخلفية تتبع الوضع والهوية الآن' : 'Background now follows theme & brand', 'success');
  };

  const applyTextColor = (hex: string) => {
    const normalized = hex.startsWith('#') ? hex : `#${hex}`;
    if (!parseHexColor(normalized)) {
      toast(isAr ? 'رمز لون غير صالح' : 'Invalid color code', 'error');
      return;
    }
    const readable = readableTextForTheme(normalized, isDark) || normalized;
    setTextHex(readable);
    setBrand({ customTextHex: readable });
    if (storeScoped) onStoreColorsChange?.({ bg: brand.customBgHex ?? null, text: readable });
    if (readable !== normalized) {
      toast(
        isAr
          ? 'الوضع الداكن: تم ضبط لون نص فاتح ليبقى واضحاً'
          : 'Dark mode: text color lifted for readability',
        'success',
      );
      return;
    }
    toast(isAr ? 'تم تطبيق لون النص' : 'Text color applied', 'success');
  };

  const preloadFontFace = (id: BrandFontId) => {
    const meta = BRAND_FONTS[id];
    if (!meta?.googleFamily) return;
    ensureBrandFontStylesheet(
      `https://fonts.googleapis.com/css2?family=${meta.googleFamily}&display=swap`,
      `unityteck-font-${id}`,
    );
  };

  const applyCustomArabicFont = () => {
    const name = customFontName.trim();
    if (!name) {
      toast(isAr ? 'اكتب اسم عائلة الخط المخصص' : 'Enter a custom font family name', 'error');
      return;
    }
    const url = customFontUrl.trim() || null;
    if (url) ensureBrandFontStylesheet(url, 'unityteck-custom-font-ar');
    const weight = brand.fontWeight || 'regular';
    setBrand({
      font: 'custom-ar',
      fontAr: 'custom-ar',
      customFontFamilyAr: name,
      customFontUrlAr: url,
      fontWeight: weight,
    });
    applyStoreArabicTypography(
      {
        fontAr: 'custom-ar',
        fontWeight: weight,
        customFontFamilyAr: name,
        customFontUrlAr: url,
      },
      locale === 'ar' ? 'ar' : 'en',
    );
    pushStoreTypography({
      fontAr: 'custom-ar',
      fontWeight: weight,
      customFontFamilyAr: name,
      customFontUrlAr: url,
    });
    toast(isAr ? 'تم تطبيق الخط العربي المخصص' : 'Custom Arabic font applied', 'success');
  };

  const selectArabicFont = (id: BrandFontArId) => {
    // Store-scoped: after platform defaults, merchant font change applies store-wide (serif packs: Amiri / Markazi).
    preloadFontFace(id);
    const weight = brand.fontWeight || 'regular';
    setFont(id);
    applyStoreArabicTypography(
      {
        fontAr: id,
        fontWeight: weight,
        customFontFamilyAr: id === 'custom-ar' ? customFontName.trim() || null : null,
        customFontUrlAr: id === 'custom-ar' ? customFontUrl.trim() || null : null,
      },
      locale === 'ar' ? 'ar' : 'en',
    );
    pushStoreTypography({
      fontAr: id,
      fontWeight: weight,
      customFontFamilyAr: id === 'custom-ar' ? brand.customFontFamilyAr ?? null : null,
      customFontUrlAr: id === 'custom-ar' ? brand.customFontUrlAr ?? null : null,
    });
    toast(isAr ? 'تم تحديث الخط العربي' : 'Arabic font updated', 'success');
  };

  const selectEnglishFont = (id: BrandFontEnId) => {
    preloadFontFace(id);
    setFont(id);
    toast(isAr ? 'تم تحديث الخط الإنجليزي' : 'English font updated', 'success');
  };

  const arabicCatalogValue =
    (brand.fontAr || brand.font) === 'custom-ar'
      ? String(brand.customFontFamilyAr || customFontName || '').trim()
      : BRAND_FONTS[(brand.fontAr || 'sf-arabic') as BrandFontArId]?.label || 'SF Arabic';

  const englishCatalogValue =
    BRAND_FONTS[(brand.fontEn || 'jakarta') as BrandFontEnId]?.label || 'Plus Jakarta Sans';

  const selectArabicFamilyFromCatalog = (family: string) => {
    const clean = family.trim();
    if (!clean) return;
    const known = AR_FAMILY_TO_BRAND_ID[clean];
    if (known) {
      selectArabicFont(known);
      return;
    }
    ensureStoreGoogleFontLoaded(clean);
    const url = googleFontsCssUrl(clean);
    ensureBrandFontStylesheet(url, 'unityteck-custom-font-ar');
    setCustomFontName(clean);
    setCustomFontUrl(url);
    const weight = brand.fontWeight || 'regular';
    setBrand({
      font: 'custom-ar',
      fontAr: 'custom-ar',
      customFontFamilyAr: clean,
      customFontUrlAr: url,
      fontWeight: weight,
    });
    applyStoreArabicTypography(
      {
        fontAr: 'custom-ar',
        fontWeight: weight,
        customFontFamilyAr: clean,
        customFontUrlAr: url,
      },
      locale === 'ar' ? 'ar' : 'en',
    );
    pushStoreTypography({
      fontAr: 'custom-ar',
      fontWeight: weight,
      customFontFamilyAr: clean,
      customFontUrlAr: url,
    });
    toast(isAr ? 'تم تحديث الخط العربي' : 'Arabic font updated', 'success');
  };

  const selectEnglishFamilyFromCatalog = (family: string) => {
    const clean = family.trim();
    if (!clean) return;
    const known = EN_FAMILY_TO_BRAND_ID[clean];
    if (known) {
      selectEnglishFont(known);
      return;
    }
    // Unmapped EN faces still load + apply via Jakarta id stack override is not available;
    // load face and keep nearest curated id so Holst stays typed.
    ensureStoreGoogleFontLoaded(clean);
    ensureBrandFontStylesheet(googleFontsCssUrl(clean), `unityteck-font-en-${clean.replace(/\s+/g, '-')}`);
    selectEnglishFont('jakarta');
    toast(
      isAr
        ? `تم تحميل ${clean} — للوحة التحكم استخدم خطاً من القائمة المعتمدة أو المخصّص العربي للمتجر`
        : `${clean} loaded — dashboard EN uses curated Holst faces; storefront theme has the full list`,
      'info',
    );
  };

  const selectFontWeight = (wKey: BrandFontWeight) => {
    setFontWeight(wKey);
    const arId = (brand.fontAr || 'sf-arabic') as BrandFontArId;
    applyStoreArabicTypography(
      {
        fontAr: arId,
        fontWeight: wKey,
        customFontFamilyAr: brand.customFontFamilyAr ?? null,
        customFontUrlAr: brand.customFontUrlAr ?? null,
      },
      locale === 'ar' ? 'ar' : 'en',
    );
    pushStoreTypography({
      fontAr: arId,
      fontWeight: wKey,
      customFontFamilyAr: brand.customFontFamilyAr ?? null,
      customFontUrlAr: brand.customFontUrlAr ?? null,
    });
    toast(isAr ? 'تم تحديث سماكة الخط' : 'Font weight updated', 'success');
  };

  /** Explicit Save / Apply for typography (store chrome + live CSS). */
  const saveApplyTypography = () => {
    const arId = (brand.fontAr || 'sf-arabic') as BrandFontArId;
    const enId = (brand.fontEn || 'jakarta') as BrandFontEnId;
    const weight = brand.fontWeight || 'regular';
    preloadFontFace(enId);
    preloadFontFace(arId);
    if (arId === 'custom-ar') {
      const name = customFontName.trim();
      if (!name) {
        toast(isAr ? 'اكتب اسم الخط المخصص أولاً' : 'Enter a custom font name first', 'error');
        return;
      }
      const url = customFontUrl.trim() || null;
      if (url) ensureBrandFontStylesheet(url, 'unityteck-custom-font-ar');
      setBrand({
        font: 'custom-ar',
        fontAr: 'custom-ar',
        fontEn: enId,
        fontWeight: weight,
        customFontFamilyAr: name,
        customFontUrlAr: url,
      });
      applyStoreArabicTypography(
        {
          fontAr: 'custom-ar',
          fontWeight: weight,
          customFontFamilyAr: name,
          customFontUrlAr: url,
        },
        locale === 'ar' ? 'ar' : 'en',
      );
      pushStoreTypography({
        fontAr: 'custom-ar',
        fontWeight: weight,
        customFontFamilyAr: name,
        customFontUrlAr: url,
      });
    } else {
      setBrand({
        font: locale === 'ar' ? arId : enId,
        fontAr: arId,
        fontEn: enId,
        fontWeight: weight,
      });
      applyStoreArabicTypography(
        {
          fontAr: arId,
          fontWeight: weight,
          customFontFamilyAr: brand.customFontFamilyAr ?? null,
          customFontUrlAr: brand.customFontUrlAr ?? null,
        },
        locale === 'ar' ? 'ar' : 'en',
      );
      pushStoreTypography({
        fontAr: arId,
        fontWeight: weight,
        customFontFamilyAr: brand.customFontFamilyAr ?? null,
        customFontUrlAr: brand.customFontUrlAr ?? null,
      });
    }
    if (persistPlatform) {
      void savePlatformBranding();
      return;
    }
    toast(
      isAr
        ? storeScoped
          ? 'تم تطبيق الخطوط — اضغط حفظ المظهر لتثبيتها لهذا المتجر'
          : 'تم تطبيق الخطوط على كل الصفحات'
        : storeScoped
          ? 'Fonts applied — click Save appearance to lock for this store'
          : 'Fonts applied across all pages',
      'success',
    );
  };

  const clearTextColor = () => {
    setBrand({ customTextHex: null });
    if (storeScoped) onStoreColorsChange?.({ bg: brand.customBgHex ?? null, text: null });
    toast(isAr ? 'لون النص يتبع الوضع والهوية الآن' : 'Text color now follows theme & brand', 'success');
  };

  return (
    <div
      className={`u-settings-luxe space-y-6 ${persistPlatform ? 'u-settings-luxe--accent' : ''}`}
      style={{
        fontFamily: 'var(--font-ui)',
        /* Panel ink stays dark even when page chrome --text is light on dark shell */
        color: 'var(--plan-ink, var(--text, #0f172a))',
      }}
    >
      <div
        className="flex items-center gap-3 border-b pb-3.5"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
          style={{
            background: 'color-mix(in srgb, var(--accent) 15%, var(--surface))',
            color: 'var(--accent)',
          }}
        >
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h3
            className="font-extrabold text-sm tracking-tight u-settings-luxe__title"
            style={{ color: 'var(--text, #0f172a)' }}
          >
            {panelTitle}
          </h3>
          <p className="text-[11px] mt-0.5 u-settings-luxe__muted" style={{ color: 'var(--muted, #475569)' }}>
            {isAr
              ? 'المظهر · الخلفية · لون النص · ١٥ لوحة ألوان · خطوط عربية وإنجليزية · تحكم كامل لكل خيار'
              : 'Appearance · Background · Text color · 15 palettes · English and Arabic fonts · Full per-control apply'}
          </p>
        </div>
      </div>

      {/* ── Page background color ── */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <PaintBucket className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>{isAr ? 'لون خلفية الصفحات' : 'Page Background Color'}</span>
        </div>
        <div
          className="flex flex-wrap items-center gap-3 p-3 rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <input
            type="color"
            value={parseHexColor(bgHex) ? (bgHex.startsWith('#') ? bgHex : `#${bgHex}`) : '#e2f4f0'}
            onChange={(e) => setBgHex(e.target.value)}
            className="w-12 h-10 rounded-lg border cursor-pointer bg-transparent"
            style={{ borderColor: 'var(--border)' }}
            aria-label={isAr ? 'لون الخلفية' : 'Background color'}
          />
          <input
            type="text"
            value={bgHex}
            onChange={(e) => setBgHex(e.target.value)}
            placeholder="#e2f4f0"
            dir="ltr"
            className="flex-1 min-w-[7rem] px-3 py-2 text-xs font-mono rounded-xl border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-ctrl)',
            }}
          />
          <button
            type="button"
            onClick={() => applyBgColor(bgHex)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl text-white cursor-pointer"
            style={{ background: 'var(--portal-cta)', borderRadius: 'var(--radius-ctrl)' }}
          >
            {isAr ? 'تطبيق' : 'Apply'}
          </button>
          {brand.customBgHex ? (
            <button
              type="button"
              onClick={clearBgColor}
              className="px-3 py-2 text-xs font-semibold rounded-xl border cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
                borderRadius: 'var(--radius-ctrl)',
              }}
            >
              {isAr ? 'اتبع الوضع' : 'Follow theme'}
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Text / font color ── */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <ALargeSmall className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>{isAr ? 'لون النص والخطوط' : 'Text & Font Color'}</span>
        </div>
        <div
          className="flex flex-wrap items-center gap-3 p-3 rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <input
            type="color"
            value={
              parseHexColor(textHex) ? (textHex.startsWith('#') ? textHex : `#${textHex}`) : '#04222b'
            }
            onChange={(e) => setTextHex(e.target.value)}
            className="w-12 h-10 rounded-lg border cursor-pointer bg-transparent"
            style={{ borderColor: 'var(--border)' }}
            aria-label={isAr ? 'لون النص' : 'Text color'}
          />
          <input
            type="text"
            value={textHex}
            onChange={(e) => setTextHex(e.target.value)}
            placeholder="#04222b"
            dir="ltr"
            className="flex-1 min-w-[7rem] px-3 py-2 text-xs font-mono rounded-xl border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-ctrl)',
            }}
          />
          <button
            type="button"
            onClick={() => applyTextColor(textHex)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl text-white cursor-pointer"
            style={{ background: 'var(--portal-cta)', borderRadius: 'var(--radius-ctrl)' }}
          >
            {isAr ? 'تطبيق' : 'Apply'}
          </button>
          {brand.customTextHex ? (
            <button
              type="button"
              onClick={clearTextColor}
              className="px-3 py-2 text-xs font-semibold rounded-xl border cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
                borderRadius: 'var(--radius-ctrl)',
              }}
            >
              {isAr ? 'اتبع الوضع' : 'Follow theme'}
            </button>
          ) : null}
        </div>
        {isDark ? (
          <div className="flex flex-wrap gap-2">
            {[
              { hex: '#f2fbf8', labelEn: 'Soft white', labelAr: 'أبيض ناعم' },
              { hex: '#e2e8f0', labelEn: 'Slate light', labelAr: 'رمادي فاتح' },
              { hex: '#ffffff', labelEn: 'Pure white', labelAr: 'أبيض نقي' },
              { hex: '#98d8d0', labelEn: 'Teal light', labelAr: 'تركواز فاتح' },
            ].map((preset) => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => applyTextColor(preset.hex)}
                className="px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border cursor-pointer inline-flex items-center gap-1.5"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  borderRadius: 'var(--radius-ctrl)',
                }}
              >
                <span
                  className="w-3 h-3 rounded-full border shrink-0"
                  style={{ background: preset.hex, borderColor: 'var(--border)' }}
                  aria-hidden
                />
                {isAr ? preset.labelAr : preset.labelEn}
              </button>
            ))}
          </div>
        ) : null}
        <p className="text-[10px] opacity-65" style={{ color: 'var(--muted)' }}>
          {isAr
            ? isDark
              ? 'الوضع الداكن: استخدم لوناً فاتحاً للنص حتى يبقى واضحاً على كل الصفحات.'
              : 'كل خيار مستقل: الوضع · الخلفية · لون النص · الهوية · الخط العربي · الخط الإنجليزي.'
            : isDark
              ? 'Dark mode: pick a light text color so type stays readable on every page.'
              : 'Each control is independent: theme · background · text color · accent · AR font · EN font.'}
        </p>
      </div>

      {/* ── Top 15 Color Palettes ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Palette className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>
              {isAr ? 'لوحات الألوان المختارة (١٥ لون مميز)' : 'Top 15 Color Palettes'}
            </span>
          </div>
          <span className="text-[10px] font-mono opacity-65">
            {isAr ? '١٥ مظهر' : '15 themes'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {TOP_15_PALETTES.map((id: BrandPaletteId) => {
            const p = BRAND_PALETTES[id];
            const active =
              !brand.customAccentHex &&
              (activePalette === null ? false : (activePalette ?? brand.palette) === id);
            const label = isAr ? p.labelAr : p.label;

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (onPaletteSelect) {
                    onPaletteSelect(id);
                    setBrand({ customAccentHex: null });
                    return;
                  }
                  setPalette(id);
                  toast(isAr ? 'تم تحديث اللون' : 'Color palette updated', 'success');
                }}
                className={`text-start p-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                  active ? 'ring-2 ring-offset-2' : 'hover:border-slate-400'
                }`}
                style={{
                  borderColor: active ? p.p600 : 'var(--border)',
                  background: active
                    ? `color-mix(in srgb, ${p.p50} 85%, var(--surface))`
                    : 'var(--bg)',
                  borderRadius: 'var(--radius-ctrl)',
                }}
              >
                <div className="flex gap-1 mb-2 items-center">
                  <span
                    className="w-4 h-4 rounded-full shadow-xs border border-black/10 shrink-0"
                    style={{ background: p.p600 }}
                  />
                  <div className="flex flex-1 gap-0.5">
                    {[p.p900, p.p800, p.p400, p.p200].map((c) => (
                      <span key={c} className="h-3 flex-1 rounded-xs" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold leading-tight truncate">{label}</span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: p.p600 }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Custom accent color ── */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Pipette className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>{isAr ? 'لون مخصص (اختر أي لون)' : 'Custom Color (pick any)'}</span>
        </div>
        <div
          className="flex flex-wrap items-center gap-3 p-3 rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <input
            type="color"
            value={parseHexColor(customHex) ? (customHex.startsWith('#') ? customHex : `#${customHex}`) : '#1d8b94'}
            onChange={(e) => setCustomHex(e.target.value)}
            className="w-12 h-10 rounded-lg border cursor-pointer bg-transparent"
            style={{ borderColor: 'var(--border)' }}
            aria-label={isAr ? 'منتقي اللون' : 'Color picker'}
          />
          <input
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#1d8b94"
            dir="ltr"
            className="flex-1 min-w-[7rem] px-3 py-2 text-xs font-mono rounded-xl border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-ctrl)',
            }}
          />
          <button
            type="button"
            onClick={() => applyCustomAccent(customHex)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl text-white cursor-pointer"
            style={{ background: 'var(--portal-cta)', borderRadius: 'var(--radius-ctrl)' }}
          >
            {isAr ? 'تطبيق' : 'Apply'}
          </button>
          {brand.customAccentHex ? (
            <button
              type="button"
              onClick={clearCustomAccent}
              className="px-3 py-2 text-xs font-semibold rounded-xl border cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
                borderRadius: 'var(--radius-ctrl)',
              }}
            >
              {isAr ? 'إلغاء المخصص' : 'Clear custom'}
            </button>
          ) : null}
        </div>
        <p className="text-[10px] opacity-65">
          {isAr
            ? 'اللون المخصص يطبَّق على الأزرار والحدود والبطاقات والجداول والنوافذ فوراً.'
            : 'Custom accent applies instantly to buttons, borders, cards, tables, and modals.'}
        </p>
      </div>

      {/* ── Scrollbar color (global · luxury) ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>{isAr ? 'لون شريط التمرير (فاخر)' : 'Scrollbar Color (Luxury)'}</span>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--sb-color, var(--portal-400)) 18%, var(--surface))',
              color: 'var(--sb-color-deep, var(--accent))',
            }}
          >
            {brand.customScrollbarHex
              ? isAr
                ? 'مخصص'
                : 'Custom'
              : isAr
                ? 'يتبع الهوية'
                : 'Follows brand'}
          </span>
        </div>
        <div
          className="flex flex-wrap items-center gap-3 p-3 rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <input
            type="color"
            value={
              parseHexColor(scrollbarHex)
                ? scrollbarHex.startsWith('#')
                  ? scrollbarHex
                  : `#${scrollbarHex}`
                : '#4fb8b4'
            }
            onChange={(e) => setScrollbarHex(e.target.value)}
            className="w-12 h-10 rounded-lg border cursor-pointer bg-transparent"
            style={{ borderColor: 'var(--border)' }}
            aria-label={isAr ? 'لون شريط التمرير' : 'Scrollbar color'}
          />
          <input
            type="text"
            value={scrollbarHex}
            onChange={(e) => setScrollbarHex(e.target.value)}
            placeholder="#4fb8b4"
            dir="ltr"
            className="flex-1 min-w-[7rem] px-3 py-2 text-xs font-mono rounded-xl border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-ctrl)',
            }}
          />
          <button
            type="button"
            onClick={() => applyScrollbarColor(scrollbarHex)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl text-white cursor-pointer"
            style={{ background: 'var(--portal-cta)', borderRadius: 'var(--radius-ctrl)' }}
          >
            {isAr ? 'تطبيق' : 'Apply'}
          </button>
          {brand.customScrollbarHex ? (
            <button
              type="button"
              onClick={clearScrollbarColor}
              className="px-3 py-2 text-xs font-semibold rounded-xl border cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
                borderRadius: 'var(--radius-ctrl)',
              }}
            >
              {isAr ? 'اتبع لون الهوية' : 'Follow brand'}
            </button>
          ) : null}
          {/* Live luxury preview strip */}
          <div
            className="w-full h-2.5 rounded-full relative overflow-hidden"
            style={{
              background: 'var(--sb-track, color-mix(in srgb, var(--border) 45%, transparent))',
              boxShadow: 'inset 0 0 4px color-mix(in srgb, var(--portal-950) 12%, transparent)',
            }}
            aria-hidden
          >
            <span
              className="absolute top-0 bottom-0 start-[18%] w-[38%] rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--sb-color, var(--portal-400)), var(--sb-color-deep, var(--accent)))',
                boxShadow:
                  'inset 0 1px 0 color-mix(in srgb, #fff 35%, transparent), 0 0 10px color-mix(in srgb, var(--sb-color-deep, var(--accent)) 40%, transparent)',
              }}
            />
          </div>
        </div>
        <p className="text-[10px] opacity-65">
          {isAr
            ? 'افتراضياً يتبع لوحة الألوان العالمية. يمكنك اختيار لون مستقل مع ظل فاخر لكل الصفحات.'
            : 'Defaults to the global brand palette. Pick a dedicated color with luxury glow across all pages.'}
        </p>
      </div>

      {/* ── Typography card: weight · EN · AR · custom · Save ── */}
      <div
        className="space-y-4 p-4 rounded-2xl border"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Type className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>{isAr ? 'الخطوط والوزن' : 'Fonts & weight'}</span>
        </div>

        {/* Weight — compact segment */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
            <Sliders className="w-3 h-3" style={{ color: 'var(--accent)' }} />
            <span>{isAr ? 'الوزن: خفيف · عادي · عريض · متوسط' : 'Weight: Light · Regular · Bold · Medium'}</span>
          </div>
          <div
            className="grid grid-cols-4 gap-1 p-1 rounded-xl border"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            role="group"
            aria-label={isAr ? 'وزن الخط' : 'Font weight'}
          >
            {BRAND_FONT_WEIGHT_ORDER.map((wKey) => {
              const wMeta = BRAND_FONT_WEIGHTS[wKey];
              const active = (brand.fontWeight || 'regular') === wKey;
              const wLabel = isAr ? wMeta.labelAr : wMeta.label;
              return (
                <button
                  key={wKey}
                  type="button"
                  onClick={() => selectFontWeight(wKey)}
                  data-brand-chip={active ? 'active' : 'idle'}
                  className="py-2.5 px-1 text-xs cursor-pointer transition-all flex flex-col items-center gap-0.5 rounded-lg"
                  style={{
                    borderRadius: 'var(--radius-ctrl)',
                    background: active ? 'var(--active-bg, #0f172a)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text, #0f172a)',
                    fontWeight: wMeta.sample,
                    boxShadow: active ? '0 0 0 1px var(--accent)' : undefined,
                  }}
                >
                  <span style={{ color: 'inherit' }}>{wLabel}</span>
                  <span
                    className="text-[10px] font-mono opacity-80"
                    style={{ color: active ? '#ffffff' : 'var(--muted)' }}
                  >
                    {wMeta.body}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live bilingual preview — large & readable */}
        <div
          className="rounded-xl border px-4 py-3 space-y-2"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg)',
          }}
        >
          <p
            className="text-base sm:text-lg leading-relaxed"
            style={{
              fontFamily:
                BRAND_FONTS[(brand.fontEn || 'jakarta') as BrandFontEnId]?.stack ||
                'var(--font-ui)',
              fontWeight: weightMeta.sample,
              color: 'var(--text)',
            }}
            dir="ltr"
            lang="en"
          >
            Welcome to Souq · Aa Bb Cc
          </p>
          <p
            className="text-base sm:text-lg leading-relaxed"
            style={{
              fontFamily: resolveArFontStack(
                brand,
                (brand.fontAr || 'sf-arabic') as BrandFontArId,
              ),
              fontWeight: weightMeta.sample,
              color: 'var(--text)',
            }}
            dir="rtl"
            lang="ar"
          >
            مرحباً بك في سوق · أبجد هوز
          </p>
          <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `الوزن الحالي: ${weightMeta.labelAr} (${weightMeta.body})`
              : `Current weight: ${weightMeta.label} (${weightMeta.body})`}
          </p>
        </div>

        {/* EN + AR dropdowns — full shared catalog (same every store) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
              {isAr
                ? `الإنجليزية (${STORE_ENGLISH_FONT_COUNT})`
                : `English (${STORE_ENGLISH_FONT_COUNT})`}
            </label>
            <StoreFontSelect
              isAr={isAr}
              value={englishCatalogValue}
              onChange={selectEnglishFamilyFromCatalog}
              categories={['Latin']}
              aria-label={isAr ? 'اختر الخط الإنجليزي' : 'Select English font'}
              style={{
                borderRadius: 'var(--radius-ctrl)',
                fontFamily:
                  BRAND_FONTS[(brand.fontEn || 'jakarta') as BrandFontEnId]?.stack ||
                  'var(--font-ui)',
                fontWeight: weightMeta.sample,
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
              {isAr
                ? `العربية (${STORE_ARABIC_FONT_COUNT})`
                : `Arabic (${STORE_ARABIC_FONT_COUNT})`}
            </label>
            <StoreFontSelect
              isAr={isAr}
              value={arabicCatalogValue}
              onChange={selectArabicFamilyFromCatalog}
              categories={['Arabic']}
              aria-label={isAr ? 'اختر الخط العربي' : 'Select Arabic font'}
              style={{
                borderRadius: 'var(--radius-ctrl)',
                fontFamily: resolveArFontStack(
                  brand,
                  (brand.fontAr || 'sf-arabic') as BrandFontArId,
                ),
                fontWeight: weightMeta.sample,
              }}
            />
          </div>
        </div>

        {/* Custom Arabic — always visible, easy + readable */}
        <div
          className="space-y-2.5 p-3 rounded-xl border"
          style={{
            borderColor:
              (brand.fontAr || brand.font) === 'custom-ar'
                ? 'var(--accent)'
                : 'var(--border)',
            background: 'var(--bg)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'خط عربي مخصص (سهل)' : 'Custom Arabic font (easy)'}
            </div>
            <button
              type="button"
              onClick={() => selectArabicFont('custom-ar')}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                color:
                  (brand.fontAr || brand.font) === 'custom-ar'
                    ? '#ffffff'
                    : 'var(--text)',
                background:
                  (brand.fontAr || brand.font) === 'custom-ar'
                    ? 'var(--active-bg, #0f172a)'
                    : 'var(--surface)',
                borderRadius: 'var(--radius-ctrl)',
              }}
            >
              {isAr ? 'تفعيل المخصص' : 'Use custom'}
            </button>
          </div>
          <input
            type="text"
            value={customFontName}
            onChange={(e) => setCustomFontName(e.target.value)}
            placeholder={
              isAr ? 'اسم الخط — مثال: Cairo أو Tajawal' : 'Font name — e.g. Cairo or Tajawal'
            }
            className="w-full px-3 py-2.5 text-sm rounded-xl border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-ctrl)',
              fontFamily: customFontName.trim()
                ? `'${customFontName.replace(/['"]/g, '')}', var(--font-ui)`
                : 'var(--font-ui)',
              fontWeight: weightMeta.sample,
            }}
            dir="auto"
          />
          <input
            type="url"
            value={customFontUrl}
            onChange={(e) => setCustomFontUrl(e.target.value)}
            placeholder={
              isAr
                ? 'رابط Google Fonts CSS (اختياري)'
                : 'Google Fonts CSS URL (optional)'
            }
            className="w-full px-3 py-2 text-xs rounded-xl border font-mono"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-ctrl)',
            }}
            dir="ltr"
          />
          {/* Large readable custom preview — min weight 500 so Light never washes out */}
          <div
            className="rounded-xl px-3 py-3 border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              fontFamily: customFontName.trim()
                ? `'${customFontName.replace(/['"]/g, '')}', ${resolveArFontStack(brand, 'cairo')}`
                : resolveArFontStack(brand, (brand.fontAr || 'sf-arabic') as BrandFontArId),
              fontWeight: Math.max(weightMeta.sample, 500),
              color: 'var(--text, #0f172a)',
            }}
            dir="rtl"
            lang="ar"
          >
            <p
              className="text-lg sm:text-xl leading-relaxed"
              dir="rtl"
              lang="ar"
              style={{ color: 'var(--text, #0f172a)', fontWeight: Math.max(weightMeta.sample, 600) }}
            >
              {customFontName.trim()
                ? 'مرحباً بك في سوق — هذا خطك المخصص'
                : isAr
                  ? 'اكتب اسم الخط أعلاه لمعاينة واضحة'
                  : 'Type a font name above for a clear preview'}
            </p>
            <p
              className="text-sm mt-1 font-semibold"
              dir={isAr ? 'rtl' : 'ltr'}
              lang={isAr ? 'ar' : 'en'}
              style={{ color: 'var(--muted, #475569)', fontWeight: 600 }}
            >
              {customFontName.trim()
                ? isAr
                  ? `${customFontName.trim()} · ${weightMeta.labelAr} ${weightMeta.body}`
                  : `${customFontName.trim()} · ${weightMeta.label} ${weightMeta.body}`
                : isAr
                  ? 'المعاينة تظهر هنا بوضوح'
                  : 'Readable preview appears here'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyCustomArabicFont}
              className="px-3.5 py-2 text-xs font-bold rounded-xl text-white cursor-pointer"
              style={{
                background: 'var(--portal-cta)',
                borderRadius: 'var(--radius-ctrl)',
                color: '#ffffff',
              }}
            >
              <span style={{ color: '#ffffff', fontWeight: 700 }}>
                {isAr ? 'تطبيق المخصص' : 'Apply custom'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomFontName('');
                setCustomFontUrl('');
                selectArabicFont('sf-arabic');
                setBrand({
                  font: 'sf-arabic',
                  fontAr: 'sf-arabic',
                  customFontFamilyAr: null,
                  customFontUrlAr: null,
                });
                pushStoreTypography({
                  fontAr: 'sf-arabic',
                  fontWeight: brand.fontWeight || 'regular',
                  customFontFamilyAr: null,
                  customFontUrlAr: null,
                });
              }}
              className="px-3 py-2 text-xs font-semibold rounded-xl border cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-ctrl)',
              }}
            >
              {isAr ? 'افتراضي' : 'Reset default'}
            </button>
          </div>
          <p
            className="text-[11px] leading-relaxed font-medium"
            style={{ color: 'var(--muted, #475569)' }}
          >
            {isAr
              ? 'الصق رابط مثل: https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700&display=swap ثم اكتب Cairo في الاسم.'
              : 'Paste a URL like https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700&display=swap and type Cairo as the name.'}
          </p>
        </div>

        {/* Save / Apply */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p
            className="text-[11px] leading-relaxed font-medium"
            style={{ color: 'var(--muted, #475569)' }}
          >
            {isAr
              ? storeScoped
                ? 'طبّق الآن، ثم احفظ المظهر أسفل الصفحة لتثبيت الخط لهذا المتجر فقط.'
                : 'اضغط تطبيق الخطوط لتثبيت الوزن والخط على كل الصفحات والنوافذ.'
              : storeScoped
                ? 'Apply now, then Save appearance below to lock fonts for this store only.'
                : 'Click Apply fonts to lock weight and faces across pages and modals.'}
          </p>
          <button
            type="button"
            onClick={saveApplyTypography}
            className="unity-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl cursor-pointer shrink-0"
            style={{
              background: 'var(--portal-cta)',
              borderRadius: 'var(--radius-ctrl)',
              color: '#ffffff',
            }}
          >
            <Save className="w-4 h-4 shrink-0" aria-hidden style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff', fontWeight: 700 }}>
              {isAr ? 'تطبيق وحفظ الخطوط' : 'Apply & save fonts'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Icon / Button Corner Radius Style ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Shapes className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>
            {isAr ? 'نمط وحواف الأزرار والأيقونات' : 'Button & Icon Corner Radius'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {(Object.keys(BRAND_ICON_RADIUS) as BrandIconStyle[]).map((id) => {
            const meta = BRAND_ICON_RADIUS[id];
            const active = brand.iconStyle === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setIconStyle(id);
                  toast(isAr ? 'تم تحديث شكل الحواف' : 'Corner style updated', 'success');
                }}
                data-brand-chip={active ? 'active' : 'idle'}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border cursor-pointer transition-all duration-150 ${
                  active ? 'shadow-xs font-bold ring-2' : ''
                }`}
                style={{
                  borderRadius: meta.px,
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--active-bg, #0f172a)' : 'var(--surface, #ffffff)',
                  color: active ? '#ffffff' : 'var(--text, #0f172a)',
                }}
              >
                <span
                  className="w-5 h-5 flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{
                    background: 'var(--portal-cta)',
                    borderRadius: meta.px,
                    color: '#ffffff',
                  }}
                >
                  {isAr ? 'أ' : 'Aa'}
                </span>
                <span style={{ color: 'inherit', fontWeight: 700 }}>
                  {isAr ? meta.labelAr : meta.label} ({meta.px})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ borderColor: 'var(--plan-line, var(--border))' }}
      >
        <p className="text-[11px] leading-relaxed flex items-start gap-1.5" style={{ color: 'var(--plan-muted, var(--muted))' }}>
          <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
          <span>
            {!platformHydrated
              ? isAr
                ? 'جاري تحميل هوية المنصة…'
                : 'Loading platform branding…'
              : isAr
                ? storeScoped
                  ? 'الألوان والخط يُحفظان لهذا المتجر ويُطبَّقان فوراً على الصفحات والنوافذ.'
                  : persistPlatform
                    ? 'طبّق فوراً ثم احفظ في قاعدة المنصة — اختبار إدخال حقيقي لكل خيار.'
                    : 'كل تغيير في اللون أو الخط يُطبَّق فوراً على كل الصفحات والجداول والنوافذ دون إعادة تحميل.'
                : storeScoped
                  ? 'Colors and fonts save for this store and apply instantly to pages and modals.'
                  : persistPlatform
                    ? 'Preview instantly, then save to live platform settings — real entry for every option.'
                    : 'Color and font changes apply instantly across pages, tables, and modals with no reload.'}
          </span>
        </p>
        {persistPlatform ? (
          <button
            type="button"
            className="unity-btn-primary text-xs inline-flex items-center gap-1.5 shrink-0"
            disabled={platformBusy || !platformHydrated}
            aria-busy={platformBusy}
            onClick={() => void savePlatformBranding()}
          >
            <Save className="w-3.5 h-3.5" aria-hidden />
            {platformBusy
              ? isAr
                ? 'جاري الحفظ…'
                : 'Saving…'
              : isAr
                ? 'حفظ في المنصة'
                : 'Save to platform'}
          </button>
        ) : null}
      </div>
    </div>
  );
};
