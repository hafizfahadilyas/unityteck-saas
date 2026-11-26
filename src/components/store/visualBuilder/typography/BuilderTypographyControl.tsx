import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Type,
  Plus,
  RotateCcw,
} from 'lucide-react';
import {
  POPULAR_GOOGLE_FONTS,
  STORE_ARABIC_FONT_COUNT,
  STORE_ENGLISH_FONT_COUNT,
  ensureStoreGoogleFontLoaded,
} from '../../../../data/storeGoogleFontsCatalog';
import { StoreFontSelect } from '../../fonts/StoreFontSelect';

export interface TypographySettings {
  fontFamily: string;
  sizeDesktop: number;
  sizeTablet: number;
  sizeMobile: number;
  weight: string;
  transform: string;
  lineHeight: number;
  letterSpacing: number;
  customFontUrl?: string;
}

interface TypographyControlProps {
  isAr: boolean;
  value: TypographySettings;
  onChange: (settings: TypographySettings) => void;
  title?: string;
}

/** @deprecated Prefer importing from `src/data/storeGoogleFontsCatalog` — kept for existing imports. */
export { POPULAR_GOOGLE_FONTS };

export const BuilderTypographyControl: React.FC<TypographyControlProps> = ({
  isAr,
  value,
  onChange,
  title,
}) => {
  const [deviceTab, setDeviceTab] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showCustomImport, setShowCustomImport] = useState(false);
  const [customImportText, setCustomImportText] = useState(value.customFontUrl || '');

  useEffect(() => {
    if (value.fontFamily) ensureStoreGoogleFontLoaded(value.fontFamily);
  }, [value.fontFamily]);

  const currentSize =
    deviceTab === 'desktop'
      ? value.sizeDesktop
      : deviceTab === 'tablet'
        ? value.sizeTablet
        : value.sizeMobile;

  const handleSizeChange = (num: number) => {
    if (deviceTab === 'desktop') {
      onChange({ ...value, sizeDesktop: num });
    } else if (deviceTab === 'tablet') {
      onChange({ ...value, sizeTablet: num });
    } else {
      onChange({ ...value, sizeMobile: num });
    }
  };

  const handleApplyCustomFont = () => {
    if (!customImportText.trim()) return;
    const fontName = customImportText.trim();
    if (customImportText.startsWith('http')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = customImportText;
      document.head.appendChild(link);
      onChange({
        ...value,
        customFontUrl: customImportText,
      });
    } else {
      ensureStoreGoogleFontLoaded(fontName);
      onChange({
        ...value,
        fontFamily: fontName,
        customFontUrl: customImportText,
      });
    }
    setShowCustomImport(false);
  };

  return (
    <div
      className="border rounded-2xl p-4 shadow-2xs space-y-4 text-xs"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--surface)',
        color: 'var(--text)',
      }}
    >
      <div
        className="flex items-center justify-between border-b pb-2.5"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 font-black" style={{ color: 'var(--text)' }}>
          <Type className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span>{title || (isAr ? 'الخط والطباعة' : 'Typography Control')}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowCustomImport(!showCustomImport)}
            className="p-1 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--muted)' }}
            title={isAr ? 'استيراد خط مخصص' : 'Import custom font'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({
                fontFamily: 'Cairo',
                sizeDesktop: 16,
                sizeTablet: 15,
                sizeMobile: 14,
                weight: '600',
                transform: 'none',
                lineHeight: 1.6,
                letterSpacing: 0,
              })
            }
            className="p-1 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--muted)' }}
            title={isAr ? 'إعادة تعيين' : 'Reset'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showCustomImport && (
        <div
          className="p-3 rounded-xl border space-y-2"
          style={{
            background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
            borderColor: 'color-mix(in srgb, var(--accent) 35%, var(--border))',
          }}
        >
          <span className="text-[11px] font-bold block" style={{ color: 'var(--text)' }}>
            {isAr ? 'استيراد خط بالاسم أو الرابط:' : 'Custom font name or URL:'}
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={customImportText}
              onChange={(e) => setCustomImportText(e.target.value)}
              placeholder={isAr ? 'مثال: Readex Pro أو https://…' : 'e.g. Readex Pro or https://…'}
              className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--input-bg, var(--surface))',
                color: 'var(--input-fg, var(--text))',
              }}
              dir="ltr"
            />
            <button
              type="button"
              onClick={handleApplyCustomFont}
              className="unity-btn-primary px-3 py-1.5 rounded-lg text-white font-bold text-xs cursor-pointer"
            >
              {isAr ? 'تطبيق' : 'Import'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold block" style={{ color: 'var(--muted)' }}>
          {isAr
            ? `عائلة الخط (عربي ${STORE_ARABIC_FONT_COUNT} · إنجليزي ${STORE_ENGLISH_FONT_COUNT})`
            : `Font family (${STORE_ARABIC_FONT_COUNT} Arabic · ${STORE_ENGLISH_FONT_COUNT} English)`}
        </label>
        <StoreFontSelect
          isAr={isAr}
          value={value.fontFamily}
          onChange={(fontFamily) => onChange({ ...value, fontFamily })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
              {isAr ? 'حجم الخط:' : 'Size:'}
            </span>
            <div
              className="flex items-center p-0.5 rounded-lg border gap-0.5"
              style={{ background: 'var(--hover-bg, var(--bg))', borderColor: 'var(--border)' }}
            >
              {(
                [
                  ['desktop', Monitor, isAr ? 'حاسوب' : 'Desktop'],
                  ['tablet', Tablet, isAr ? 'لوحي' : 'Tablet'],
                  ['mobile', Smartphone, isAr ? 'جوال' : 'Mobile'],
                ] as const
              ).map(([key, Icon, titleTip]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDeviceTab(key)}
                  className="p-1 rounded transition-colors cursor-pointer"
                  style={{
                    background: deviceTab === key ? 'var(--surface)' : 'transparent',
                    color: deviceTab === key ? 'var(--accent)' : 'var(--muted)',
                    boxShadow: deviceTab === key ? 'var(--card-shadow)' : undefined,
                  }}
                  title={titleTip}
                >
                  <Icon className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 font-mono text-xs font-bold">
            <input
              type="number"
              min={10}
              max={80}
              value={currentSize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="w-14 px-2 py-1 rounded-lg border text-center text-xs font-bold"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--input-bg, var(--surface))',
                color: 'var(--input-fg, var(--text))',
              }}
            />
            <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
              px
            </span>
          </div>
        </div>

        <input
          type="range"
          min={10}
          max={80}
          value={currentSize}
          onChange={(e) => handleSizeChange(Number(e.target.value))}
          className="w-full cursor-pointer accent-[var(--accent)]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold block" style={{ color: 'var(--muted)' }}>
          {isAr ? 'سماكة الخط:' : 'Weight:'}
        </label>
        <select
          value={value.weight}
          onChange={(e) => onChange({ ...value, weight: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--input-bg, var(--surface))',
            color: 'var(--input-fg, var(--text))',
          }}
        >
          <option value="400">{isAr ? 'عادي' : 'Regular 400'}</option>
          <option value="500">{isAr ? 'متوسط' : 'Medium 500'}</option>
          <option value="600">{isAr ? 'شبه عريض' : 'Semi-Bold 600'}</option>
          <option value="700">{isAr ? 'عريض' : 'Bold 700'}</option>
          <option value="800">{isAr ? 'عريض جداً' : 'Extra-Bold 800'}</option>
          <option value="900">{isAr ? 'أسود سميك' : 'Black 900'}</option>
        </select>
      </div>

      <div
        className="p-3 rounded-xl border text-center transition-all truncate"
        style={{
          background: 'var(--hover-bg, var(--bg))',
          borderColor: 'var(--border)',
          fontFamily: value.fontFamily,
          fontWeight: value.weight,
        }}
      >
        <span className="font-bold block text-sm" style={{ color: 'var(--text)' }}>
          {isAr ? 'اسم متجرك · وصف مختصر لنشاطك' : 'Your Store Name · Short business tagline'}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
          {value.fontFamily} · {value.weight}
        </span>
      </div>
    </div>
  );
};
