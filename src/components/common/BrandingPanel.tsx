import React from 'react';
import { Check, Palette, Type, Shapes, Sliders, Zap } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  BRAND_FONTS,
  BRAND_FONTS_AR,
  BRAND_FONTS_EN,
  BRAND_FONT_WEIGHTS,
  BRAND_ICON_RADIUS,
  BRAND_PALETTES,
  TOP_15_PALETTES,
  type BrandFontId,
  type BrandFontWeight,
  type BrandIconStyle,
  type BrandPaletteId,
} from '../../i18n/branding';
import { useToast } from './ToastProvider';

/**
 * Shared Master + Store branding:
 * Top 15 Color Palettes · Professional Google Fonts (EN 7 + AR 6) · Font Weights · Icon Shapes.
 */
export const BrandingPanel: React.FC<{ title?: string }> = ({
  title = 'Branding · Color · Font · Icons',
}) => {
  const { brand, setPalette, setFont, setIconStyle, setFontWeight, locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const renderFontBtn = (id: BrandFontId) => {
    const f = BRAND_FONTS[id];
    const active = brand.font === id;
    const label = isAr ? f.labelAr : f.label;

    return (
      <button
        key={id}
        type="button"
        onClick={() => {
          setFont(id);
          toast(
            isAr ? 'تم تحديث الخط' : 'Font updated',
            'success',
          );
        }}
        className={`px-3 py-2 text-xs font-semibold border cursor-pointer transition-all duration-150 flex items-center justify-between gap-2 ${
          active ? 'shadow-xs font-bold ring-2 ring-offset-1' : 'hover:border-slate-400'
        }`}
        style={{
          fontFamily: f.stack,
          borderRadius: 'var(--radius-ctrl)',
          borderColor: active ? 'var(--accent)' : 'var(--border)',
          background: active ? 'var(--active-bg)' : 'var(--bg)',
          color: active ? 'var(--active-fg)' : 'var(--text)',
        }}
      >
        <span>{label}</span>
        {active && <Check className="w-3.5 h-3.5 shrink-0" />}
      </button>
    );
  };

  return (
    <div
      className="p-5 rounded-2xl border shadow-2xs space-y-6"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--text)',
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
          <h3 className="font-extrabold text-sm tracking-tight">{title}</h3>
          <p className="text-[11px] opacity-75 mt-0.5">
            {isAr
              ? '١٥ لوحة ألوان مختارة · خطوط Google احترافية (عربية وإنجليزية) · أوزان الخطوط · تطبيق فوري'
              : 'Top 15 Color Palettes · Professional Google Fonts (EN & AR) · Weights · Zero-reload instant apply'}
          </p>
        </div>
      </div>

      {/* ── Top 15 Color Palettes ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Palette className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>
              {isAr
                ? 'لوحات الألوان المختارة (١٥ لون مميز)'
                : 'Top 15 Color Palettes'}
            </span>
          </div>
          <span className="text-[10px] font-mono opacity-65">15 themes</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {TOP_15_PALETTES.map((id: BrandPaletteId) => {
            const p = BRAND_PALETTES[id];
            const active = brand.palette === id;
            const label = isAr ? p.labelAr : p.label;

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setPalette(id);
                  toast(
                    isAr ? 'تم تحديث اللون' : 'Color palette updated',
                    'success',
                  );
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
                      <span
                        key={c}
                        className="h-3 flex-1 rounded-xs"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold leading-tight truncate">
                    {label}
                  </span>
                  {active && (
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: p.p600 }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Font Weight Selector ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Sliders className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>
            {isAr
              ? 'وزن وسماكة الخط'
              : 'Font Weight & Thickness'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(BRAND_FONT_WEIGHTS) as BrandFontWeight[]).map((wKey) => {
            const wMeta = BRAND_FONT_WEIGHTS[wKey];
            const active = (brand.fontWeight || 'regular') === wKey;
            const wLabel = isAr ? wMeta.labelAr : wMeta.label;

            return (
              <button
                key={wKey}
                type="button"
                onClick={() => {
                  setFontWeight(wKey);
                  toast(
                    isAr ? 'تم تحديث سماكة الخط' : 'Font weight updated',
                    'success',
                  );
                }}
                className={`py-2 px-3 text-xs border cursor-pointer transition-all flex items-center justify-between ${
                  active ? 'shadow-xs font-bold ring-2' : ''
                }`}
                style={{
                  borderRadius: 'var(--radius-ctrl)',
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--active-bg)' : 'var(--bg)',
                  color: active ? 'var(--active-fg)' : 'var(--text)',
                }}
              >
                <span style={{ fontWeight: Number(wMeta.heading) }}>{wLabel}</span>
                <span className="text-[10px] opacity-75 font-mono">{wMeta.body}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Top 7 English Fonts ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Type className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>
              {isAr
                ? 'خطوط إنجليزية (٧ خطوط Google مختارة)'
                : 'English Fonts (Top 7 Google Fonts)'}
            </span>
          </div>
          <span className="text-[10px] opacity-65">Google CDN</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {BRAND_FONTS_EN.map((f) => renderFontBtn(f.id))}
        </div>
      </div>

      {/* ── Top 6 Arabic Fonts ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Type className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>
              {isAr
                ? 'خطوط عربية احترافية (٦ خطوط Google)'
                : 'Arabic Fonts (Top 6 Google Fonts)'}
            </span>
          </div>
          <span className="text-[10px] opacity-65">Google CDN</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2" dir="rtl">
          {BRAND_FONTS_AR.map((f) => renderFontBtn(f.id))}
        </div>
      </div>

      {/* ── Icon / Button Corner Radius Style ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Shapes className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>
            {isAr
              ? 'نمط وحواف الأزرار والأيقونات'
              : 'Button & Icon Corner Radius'}
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
                  toast(
                    isAr ? 'تم تحديث شكل الحواف' : 'Corner style updated',
                    'success',
                  );
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
                  Aa
                </span>
                <span>{meta.label} ({meta.px})</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] opacity-65 leading-relaxed pt-2 border-t flex items-center gap-1.5" style={{ borderColor: 'var(--border)' }}>
        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>
          {isAr
            ? 'جميع تغييرات الألوان والخطوط والأوزان تطبق فورياً بدون إعادة تحميل الصفحة في جميع الشاشات واللوحات والمتاجر.'
            : 'All color, font, and weight customizations apply instantly without page reload across Store, Master, and Storefront.'}
        </span>
      </p>
    </div>
  );
};
