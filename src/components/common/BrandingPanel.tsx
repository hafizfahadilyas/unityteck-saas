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
  BRAND_FONTS_AR,
  BRAND_FONTS_EN,
  BRAND_FONT_WEIGHTS,
  BRAND_FONT_WEIGHT_ORDER,
  BRAND_ICON_RADIUS,
  BRAND_PALETTES,
  DEFAULT_BRAND,
  TOP_15_PALETTES,
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

/**
 * Shared Master + Store branding:
 * Top 15 palettes + custom hex · EN/AR fonts · weights · icon shapes.
 * Applies globally via CSS variables (pages, tables, forms, modals).
 * Master: persistPlatform saves branding into platform_settings (live MySQL).
 */
export const BrandingPanel: React.FC<{
  title?: string;
  activePalette?: BrandPaletteId | null;
  onPaletteSelect?: (id: BrandPaletteId) => void;
  storeScoped?: boolean;
  /** Master Settings — load/save branding via /platform/settings */
  persistPlatform?: boolean;
  /** Store Appearance: sync bg/text into per-store chromeBrand for Save appearance */
  onStoreColorsChange?: (next: { bg: string | null; text: string | null }) => void;
}> = ({
  title,
  activePalette,
  onPaletteSelect,
  storeScoped = false,
  persistPlatform = false,
  onStoreColorsChange,
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

  const applyCustomArabicFont = () => {
    const name = customFontName.trim();
    if (!name) {
      toast(isAr ? 'اكتب اسم عائلة الخط المخصص' : 'Enter a custom font family name', 'error');
      return;
    }
    setBrand({
      font: 'custom-ar',
      fontAr: 'custom-ar',
      customFontFamilyAr: name,
      customFontUrlAr: customFontUrl.trim() || null,
    });
    toast(isAr ? 'تم تطبيق الخط العربي المخصص' : 'Custom Arabic font applied', 'success');
  };

  const clearTextColor = () => {
    setBrand({ customTextHex: null });
    if (storeScoped) onStoreColorsChange?.({ bg: brand.customBgHex ?? null, text: null });
    toast(isAr ? 'لون النص يتبع الوضع والهوية الآن' : 'Text color now follows theme & brand', 'success');
  };

  const renderFontBtn = (id: BrandFontId) => {
    const f = BRAND_FONTS[id];
    const active =
      f.script === 'ar'
        ? (brand.fontAr || brand.font) === id
        : (brand.fontEn || brand.font) === id;
    const label = isAr ? f.labelAr : f.label;
    const previewStack =
      f.script === 'ar'
        ? resolveArFontStack(brand, id as BrandFontArId)
        : f.stack;

    return (
      <button
        key={id}
        type="button"
        onClick={() => {
          setFont(id);
          toast(isAr ? 'تم تحديث الخط' : 'Font updated', 'success');
        }}
        data-brand-chip={active ? 'active' : 'idle'}
        className={`px-3 py-2.5 text-xs border cursor-pointer transition-all duration-150 flex flex-col items-stretch gap-1 text-start ${
          active ? 'shadow-xs ring-2 ring-offset-1' : ''
        }`}
        style={{
          fontFamily: previewStack,
          borderRadius: 'var(--radius-ctrl)',
          borderColor: active ? 'var(--accent)' : 'var(--border)',
          /* Dark selected chip → full white; light chip → dark ink (no grey opacity wash) */
          background: active ? 'var(--active-bg, #0f172a)' : 'var(--surface, #ffffff)',
          color: active ? '#ffffff' : 'var(--text, #0f172a)',
          boxShadow: active ? undefined : 'inset 0 1px 0 color-mix(in srgb, #fff 12%, transparent)',
        }}
      >
        <span className="flex items-center justify-between gap-2" style={{ color: 'inherit' }}>
          <span className="font-semibold truncate" style={{ color: 'inherit' }}>
            {label}
          </span>
          {active ? <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#ffffff' }} /> : null}
        </span>
        <span
          className="text-[11px] truncate"
          style={{
            fontWeight: weightMeta.sample,
            color: active ? '#ffffff' : 'var(--text, #0f172a)',
            opacity: 1,
          }}
          dir={f.script === 'ar' ? 'rtl' : 'ltr'}
          lang={f.script === 'ar' ? 'ar' : 'en'}
        >
          {f.script === 'ar' ? 'أبجد هوز · مرحباً' : 'Aa Bb Cc · Hello'}
        </span>
      </button>
    );
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

      {/* ── Font Weight Selector — Light / Regular / Bold (+ Medium) ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text)' }}>
          <Sliders className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>{isAr ? 'وزن الخط: خفيف · عادي · عريض' : 'Font Weight: Light · Regular · Bold'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BRAND_FONT_WEIGHT_ORDER.map((wKey) => {
            const wMeta = BRAND_FONT_WEIGHTS[wKey];
            const active = (brand.fontWeight || 'regular') === wKey;
            const wLabel = isAr ? wMeta.labelAr : wMeta.label;

            return (
              <button
                key={wKey}
                type="button"
                onClick={() => {
                  setFontWeight(wKey);
                  toast(isAr ? 'تم تحديث سماكة الخط' : 'Font weight updated', 'success');
                }}
                data-brand-chip={active ? 'active' : 'idle'}
                className={`py-2.5 px-3 text-xs border cursor-pointer transition-all flex flex-col gap-1 ${
                  active ? 'shadow-xs ring-2' : ''
                }`}
                style={{
                  borderRadius: 'var(--radius-ctrl)',
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--active-bg, #0f172a)' : 'var(--surface, #ffffff)',
                  color: active ? '#ffffff' : 'var(--text, #0f172a)',
                }}
              >
                <span className="flex items-center justify-between gap-2" style={{ color: 'inherit' }}>
                  <span style={{ fontWeight: wMeta.sample, color: 'inherit' }}>{wLabel}</span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: active ? '#ffffff' : 'var(--text, #0f172a)' }}
                  >
                    {wMeta.body}
                  </span>
                </span>
                <span
                  className="text-[11px] truncate"
                  style={{
                    fontWeight: wMeta.sample,
                    fontFamily: 'var(--font-ui)',
                    color: active ? '#ffffff' : 'var(--text, #0f172a)',
                  }}
                  dir={isAr ? 'rtl' : 'ltr'}
                  lang={isAr ? 'ar' : 'en'}
                >
                  {isAr ? 'مرحباً بك في سوق' : 'Welcome to Souq'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── English Fonts ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text)' }}>
            <Type className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>
              {isAr
                ? `خطوط الواجهة الإنجليزية (${BRAND_FONTS_EN.length} خطوط)`
                : `English UI Fonts (${BRAND_FONTS_EN.length})`}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {BRAND_FONTS_EN.map((f) => renderFontBtn(f.id))}
        </div>
      </div>

      {/* ── Arabic Fonts ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text)' }}>
            <Type className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>
              {isAr
                ? `خطوط الواجهة العربية (${BRAND_FONTS_AR.length} خطوط · خفيف وعادي وعريض)`
                : `Arabic UI Fonts (${BRAND_FONTS_AR.length} · Light · Regular · Bold)`}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2" dir="rtl">
          {BRAND_FONTS_AR.map((f) => renderFontBtn(f.id))}
        </div>

        {/* Custom Arabic font */}
        <div
          className="space-y-2 p-3 rounded-xl border"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        >
          <div className="text-xs font-bold">
            {isAr ? 'خط عربي مخصص' : 'Custom Arabic Font'}
          </div>
          <input
            type="text"
            value={customFontName}
            onChange={(e) => setCustomFontName(e.target.value)}
            placeholder={isAr ? 'مثال: SF Arabic أو اسم الخط' : 'e.g. SF Arabic or your family name'}
            className="w-full px-3 py-2 text-xs rounded-xl border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-ctrl)',
              fontFamily: customFontName
                ? `'${customFontName.replace(/['"]/g, '')}', var(--font-ui)`
                : 'var(--font-ui)',
            }}
            dir="auto"
          />
          <input
            type="url"
            value={customFontUrl}
            onChange={(e) => setCustomFontUrl(e.target.value)}
            placeholder={
              isAr
                ? 'رابط CSS اختياري (Google Fonts أو ملف الخط)'
                : 'Optional CSS URL (Google Fonts or font stylesheet)'
            }
            className="w-full px-3 py-2 text-xs rounded-xl border font-mono"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-ctrl)',
            }}
            dir="ltr"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyCustomArabicFont}
              className="px-3.5 py-2 text-xs font-bold rounded-xl text-white cursor-pointer"
              style={{ background: 'var(--portal-cta)', borderRadius: 'var(--radius-ctrl)' }}
            >
              {isAr ? 'تطبيق الخط المخصص' : 'Apply custom font'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomFontName('SF Arabic');
                setCustomFontUrl('');
                setBrand({
                  font: 'sf-arabic',
                  fontAr: 'sf-arabic',
                  customFontFamilyAr: null,
                  customFontUrlAr: null,
                });
                toast(isAr ? 'تم الرجوع إلى الخط العربي الافتراضي' : 'Back to default Arabic font', 'success');
              }}
              className="px-3 py-2 text-xs font-semibold rounded-xl border cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text, #0f172a)',
                background: 'var(--bg, #ffffff)',
                borderRadius: 'var(--radius-ctrl)',
              }}
            >
              {isAr ? 'الخط العربي الافتراضي' : 'Default Arabic font'}
            </button>
          </div>
          <p className="text-[10px] opacity-65" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'اكتب اسم العائلة كما يظهر على الجهاز، أو الصق رابط Google Fonts. يدعم خفيف / عادي / عريض.'
              : 'Type the family name as installed on the device, or paste a Google Fonts CSS URL. Supports Light / Regular / Bold.'}
          </p>
        </div>

        <p className="text-[10px] opacity-65" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'عند اختيار العربية تُطبَّق خطوط عربية على كل الصفحات والنوافذ تلقائياً.'
            : 'When Arabic locale is active, the Arabic font applies to every page and modal.'}
        </p>
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
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border cursor-pointer transition-all duration-150 ${
                  active ? 'shadow-xs font-bold ring-2' : ''
                }`}
                style={{
                  borderRadius: meta.px,
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--active-bg)' : 'var(--bg)',
                  color: active ? 'var(--active-fg)' : 'var(--text)',
                }}
              >
                <span
                  className="w-5 h-5 flex items-center justify-center text-white text-[10px] font-black"
                  style={{
                    background: 'var(--portal-cta)',
                    borderRadius: meta.px,
                  }}
                >
                  {isAr ? 'أ' : 'Aa'}
                </span>
                <span>
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
