import React, { useMemo, useState } from 'react';
import {
  STORE_ARABIC_FONT_COUNT,
  STORE_ARABIC_FONTS,
  STORE_ENGLISH_FONT_COUNT,
  STORE_ENGLISH_FONTS,
  ensureStoreGoogleFontLoaded,
  findStoreFont,
  storeFontCssFamily,
} from '../../../data/storeGoogleFontsCatalog';

export type StoreFontSelectProps = {
  isAr: boolean;
  value: string;
  onChange: (fontFamily: string) => void;
  /** Empty option label — omit to hide empty choice */
  allowEmpty?: boolean;
  emptyLabelAr?: string;
  emptyLabelEn?: string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  'aria-label'?: string;
  /** Show filter box above select (recommended for 100+ fonts) */
  searchable?: boolean;
  /** Which catalog groups to show (default: both) */
  categories?: Array<'Arabic' | 'Latin'>;
};

/**
 * Global store font dropdown — Arabic + English catalog, same list every store.
 * Selecting a Google face loads the stylesheet; change is intended store-wide.
 */
export const StoreFontSelect: React.FC<StoreFontSelectProps> = ({
  isAr,
  value,
  onChange,
  allowEmpty = false,
  emptyLabelAr = 'افتراضي المتجر',
  emptyLabelEn = 'Store default',
  className = '',
  style,
  id,
  'aria-label': ariaLabel,
  searchable = true,
  categories = ['Arabic', 'Latin'],
}) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const showArabic = categories.includes('Arabic');
  const showLatin = categories.includes('Latin');

  const arabic = useMemo(() => {
    if (!showArabic) return [];
    if (!q) return STORE_ARABIC_FONTS;
    return STORE_ARABIC_FONTS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.labelAr.includes(query.trim()) ||
        f.labelAr.toLowerCase().includes(q),
    );
  }, [q, query, showArabic]);

  const english = useMemo(() => {
    if (!showLatin) return [];
    if (!q) return STORE_ENGLISH_FONTS;
    return STORE_ENGLISH_FONTS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.labelAr.includes(query.trim()) ||
        f.labelAr.toLowerCase().includes(q),
    );
  }, [q, query, showLatin]);

  const previewFamily = storeFontCssFamily(value);
  const activeMeta = findStoreFont(value);

  const handleChange = (next: string) => {
    if (next) ensureStoreGoogleFontLoaded(next);
    onChange(next);
  };

  return (
    <div className="space-y-1.5 w-full min-w-0">
      {searchable ? (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            isAr
              ? showArabic && showLatin
                ? `بحث في ${STORE_ARABIC_FONT_COUNT} عربي + ${STORE_ENGLISH_FONT_COUNT} إنجليزي…`
                : showArabic
                  ? `بحث في ${STORE_ARABIC_FONT_COUNT} خطاً عربياً…`
                  : `بحث في ${STORE_ENGLISH_FONT_COUNT} خطاً إنجليزياً…`
              : showArabic && showLatin
                ? `Search ${STORE_ARABIC_FONT_COUNT} Arabic + ${STORE_ENGLISH_FONT_COUNT} English…`
                : showArabic
                  ? `Search ${STORE_ARABIC_FONT_COUNT} Arabic fonts…`
                  : `Search ${STORE_ENGLISH_FONT_COUNT} English fonts…`
          }
          className="w-full px-2.5 py-1.5 rounded-lg border text-[11px]"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--input-bg, var(--surface))',
            color: 'var(--input-fg, var(--text))',
          }}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'بحث الخطوط' : 'Search fonts'}
        />
      ) : null}
      <select
        id={id}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer min-h-[40px] ${className}`}
        style={{
          borderColor: 'var(--border)',
          background: 'var(--input-bg, var(--surface))',
          color: 'var(--input-fg, var(--text))',
          fontFamily: previewFamily,
          ...style,
        }}
        aria-label={
          ariaLabel || (isAr ? 'كل الخطوط العربية والإنجليزية' : 'All Arabic & English fonts')
        }
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {allowEmpty ? (
          <option value="">{isAr ? emptyLabelAr : emptyLabelEn}</option>
        ) : null}
        {!allowEmpty && value && !activeMeta ? (
          <option value={value}>{value}</option>
        ) : null}
        {showArabic ? (
          <optgroup
            label={
              isAr
                ? `عربية (${arabic.length}/${STORE_ARABIC_FONT_COUNT})`
                : `Arabic (${arabic.length}/${STORE_ARABIC_FONT_COUNT})`
            }
          >
            {arabic.map((f) => (
              <option key={`ar-${f.name}`} value={f.name} style={{ fontFamily: storeFontCssFamily(f.name) }}>
                {isAr ? `${f.labelAr} — ${f.name}` : f.name}
              </option>
            ))}
          </optgroup>
        ) : null}
        {showLatin ? (
          <optgroup
            label={
              isAr
                ? `إنجليزية (${english.length}/${STORE_ENGLISH_FONT_COUNT})`
                : `English (${english.length}/${STORE_ENGLISH_FONT_COUNT})`
            }
          >
            {english.map((f) => (
              <option key={`en-${f.name}`} value={f.name} style={{ fontFamily: storeFontCssFamily(f.name) }}>
                {f.name}
              </option>
            ))}
          </optgroup>
        ) : null}
      </select>
    </div>
  );
};
