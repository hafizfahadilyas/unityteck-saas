import React, { useEffect, useMemo, useState } from 'react';
import { Type, FileCode, Save, RotateCcw, Shield, Check, Sparkles } from 'lucide-react';
import {
  EMPTY_STORE_CUSTOM_CODE,
  applyStoreCustomCodeLive,
  normalizeStoreCustomCode,
  type StoreCustomCodeSettings,
} from '../../../themes/settings/storeScopedCustomCode';
import { POPULAR_GOOGLE_FONTS } from './typography/BuilderTypographyControl';

interface BuilderSiteCodePanelProps {
  storeId: string;
  isAr: boolean;
  value: StoreCustomCodeSettings;
  onChange: (next: StoreCustomCodeSettings) => void;
  onSave?: (next: StoreCustomCodeSettings) => void | Promise<void>;
  saving?: boolean;
  /** Compact inspector vs modal layout */
  compact?: boolean;
}

/** Arabic-first quick picks; full list is in the dropdown. */
const QUICK_FONTS = [
  'Cairo',
  'Tajawal',
  'Almarai',
  'Amiri',
  'Noto Naskh Arabic',
  'Reem Kufi',
  'Lalezar',
  'Inter',
] as const;

const WEIGHT_OPTIONS: Array<{ value: string; labelAr: string; labelEn: string }> = [
  { value: '300', labelAr: 'خفيف', labelEn: 'Light' },
  { value: '400', labelAr: 'عادي', labelEn: 'Regular' },
  { value: '700', labelAr: 'عريض', labelEn: 'Bold' },
  { value: '900', labelAr: 'أسود', labelEn: 'Black' },
];

const glassCard: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--surface) 62%, transparent)',
  borderColor: 'color-mix(in srgb, #ffffff 50%, var(--border))',
  boxShadow: '0 4px 16px color-mix(in srgb, var(--text) 5%, transparent)',
  backdropFilter: 'blur(14px) saturate(1.25)',
  WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
};

const glassInput: React.CSSProperties = {
  borderColor: 'color-mix(in srgb, #ffffff 40%, var(--border))',
  background: 'color-mix(in srgb, var(--surface) 75%, transparent)',
  color: 'var(--text)',
};

export const BuilderSiteCodePanel: React.FC<BuilderSiteCodePanelProps> = ({
  storeId,
  isAr,
  value,
  onChange,
  onSave,
  saving = false,
  compact = false,
}) => {
  const [draft, setDraft] = useState<StoreCustomCodeSettings>(() =>
    normalizeStoreCustomCode(value),
  );
  const [fontDraft, setFontDraft] = useState('');
  const [appliedFlash, setAppliedFlash] = useState(false);
  const [cssOpen, setCssOpen] = useState(() => Boolean(value?.customCss?.trim()));

  useEffect(() => {
    const next = normalizeStoreCustomCode(value);
    setDraft(next);
    setFontDraft(next.customFontUrl || '');
  }, [value, storeId]);

  useEffect(() => {
    if (!storeId) return;
    applyStoreCustomCodeLive(storeId, draft);
  }, [
    storeId,
    draft.customCss,
    draft.enableCustomCss,
    draft.customFontFamily,
    draft.customFontUrl,
    draft.customFontWeight,
  ]);

  const patch = (partial: Partial<StoreCustomCodeSettings>) => {
    const next = { ...draft, ...partial };
    setDraft(next);
    onChange(next);
  };

  const flashApplied = () => {
    setAppliedFlash(true);
    window.setTimeout(() => setAppliedFlash(false), 1200);
  };

  const applyFontFamily = (name: string) => {
    const clean = name.trim();
    patch({ customFontFamily: clean, customFontUrl: '' });
    setFontDraft('');
    flashApplied();
  };

  const applyCustomFontInput = () => {
    const raw = fontDraft.trim();
    if (!raw) return;
    if (/^https?:\/\//i.test(raw)) {
      patch({ customFontUrl: raw });
    } else {
      patch({ customFontFamily: raw, customFontUrl: '' });
      setFontDraft('');
    }
    flashApplied();
  };

  const handleReset = () => {
    const empty = { ...EMPTY_STORE_CUSTOM_CODE };
    setDraft(empty);
    setFontDraft('');
    onChange(empty);
    applyStoreCustomCodeLive(storeId, empty);
  };

  const previewFamily = useMemo(() => {
    const name = (draft.customFontFamily || '').replace(/['"]/g, '').trim();
    return name ? `'${name}', var(--font-ui)` : 'var(--font-ui)';
  }, [draft.customFontFamily]);

  const activeFont = draft.customFontFamily || '';
  const activeWeight = draft.customFontWeight || '';
  const arabicFonts = useMemo(
    () => POPULAR_GOOGLE_FONTS.filter((f) => f.category === 'Arabic'),
    [],
  );
  const latinFonts = useMemo(
    () => POPULAR_GOOGLE_FONTS.filter((f) => f.category === 'Latin'),
    [],
  );

  return (
    <div
      className="space-y-2.5 text-xs"
      style={{ fontFamily: 'var(--font-ui)', color: 'var(--text)' }}
      data-store-id={storeId}
      data-builder-site-code="1"
      data-glass-panel="1"
    >
      {/* One-line isolation chip */}
      <div
        className="rounded-xl border px-2.5 py-1.5 flex items-center gap-2"
        style={glassCard}
      >
        <Shield className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />
        <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'معزول لهذا المتجر فقط — فارغ يبقى فارغاً'
            : 'This store only · empty stays empty'}
        </p>
      </div>

      {/* Store font — compact card */}
      <section
        className="rounded-2xl border p-3 space-y-2.5"
        style={glassCard}
        data-site-code-section="font"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-extrabold text-[12px]">
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: 'color-mix(in srgb, var(--portal-cta) 16%, transparent)',
                color: 'var(--portal-cta)',
              }}
            >
              <Type className="w-3.5 h-3.5" />
            </span>
            <span>{isAr ? 'خط المتجر' : 'Store font'}</span>
          </div>
          {appliedFlash ? (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: 'color-mix(in srgb, #10b981 18%, transparent)',
                color: '#059669',
              }}
            >
              <Check className="w-2.5 h-2.5" />
              {isAr ? 'تم' : 'OK'}
            </span>
          ) : null}
        </div>

        {/* Compact preview + full Arabic/Latin dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            className="rounded-xl border px-2.5 py-2 min-w-0"
            style={{
              ...glassInput,
              fontFamily: previewFamily,
              fontWeight: activeWeight || undefined,
            }}
            data-font-preview="1"
          >
            <p className="text-[13px] truncate leading-tight" style={{ fontWeight: activeWeight || 700 }}>
              {isAr ? 'معاينة الاسم' : 'Store preview'}
            </p>
            <p className="text-[9px] mt-0.5 opacity-65 truncate">
              {activeFont || (isAr ? 'افتراضي' : 'Default')}
              {activeWeight ? ` · ${activeWeight}` : ''}
            </p>
          </div>
          <select
            value={activeFont}
            onChange={(e) => applyFontFamily(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border text-[11px] font-bold cursor-pointer min-h-[44px]"
            style={{ ...glassInput, fontFamily: previewFamily }}
            aria-label={isAr ? 'كل الخطوط العربية والإنجليزية' : 'All Arabic & Latin fonts'}
          >
            <option value="">{isAr ? 'افتراضي المتجر' : 'Store default'}</option>
            <optgroup label={isAr ? `عربية (${arabicFonts.length})` : `Arabic (${arabicFonts.length})`}>
              {arabicFonts.map((f) => (
                <option key={f.name} value={f.name}>
                  {isAr ? f.labelAr : f.name}
                </option>
              ))}
            </optgroup>
            <optgroup label={isAr ? `إنجليزية (${latinFonts.length})` : `Latin (${latinFonts.length})`}>
              {latinFonts.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Weight: Light / Regular / Bold / Black */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[9px] font-bold uppercase tracking-wide me-0.5" style={{ color: 'var(--muted)' }}>
            {isAr ? 'الوزن' : 'Weight'}
          </span>
          {WEIGHT_OPTIONS.map((w) => {
            const selected = activeWeight === w.value;
            return (
              <button
                key={w.value}
                type="button"
                onClick={() => {
                  patch({ customFontWeight: selected ? '' : w.value });
                  flashApplied();
                }}
                className="px-2 py-1 rounded-lg text-[10px] border cursor-pointer transition-all active:scale-95"
                style={{
                  fontWeight: Number(w.value),
                  borderColor: selected
                    ? 'var(--portal-cta)'
                    : 'color-mix(in srgb, #ffffff 35%, var(--border))',
                  background: selected
                    ? 'color-mix(in srgb, var(--portal-cta) 18%, transparent)'
                    : 'color-mix(in srgb, var(--surface) 50%, transparent)',
                  color: selected ? 'var(--portal-cta)' : 'var(--text)',
                }}
              >
                {isAr ? w.labelAr : w.labelEn}
              </button>
            );
          })}
        </div>

        {/* Quick chips — Arabic-first */}
        <div className="flex flex-wrap gap-1">
          {QUICK_FONTS.map((name) => {
            const selected = activeFont === name;
            const meta = POPULAR_GOOGLE_FONTS.find((f) => f.name === name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => applyFontFamily(name)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all active:scale-95"
                style={{
                  fontFamily: `'${name}', var(--font-ui)`,
                  borderColor: selected
                    ? 'var(--portal-cta)'
                    : 'color-mix(in srgb, #ffffff 35%, var(--border))',
                  background: selected
                    ? 'color-mix(in srgb, var(--portal-cta) 18%, transparent)'
                    : 'color-mix(in srgb, var(--surface) 50%, transparent)',
                  color: selected ? 'var(--portal-cta)' : 'var(--text)',
                }}
                title={meta && isAr ? meta.labelAr : name}
              >
                {name === 'Noto Naskh Arabic' ? (isAr ? 'نسخ' : 'Naskh') : name === 'Reem Kufi' ? (isAr ? 'كوفي' : 'Kufi') : name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => applyFontFamily('')}
            className="px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer"
            style={{
              borderColor: 'color-mix(in srgb, #ffffff 35%, var(--border))',
              background: !activeFont
                ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                : 'color-mix(in srgb, var(--surface) 50%, transparent)',
              color: 'var(--muted)',
            }}
          >
            {isAr ? 'افتراضي' : 'Default'}
          </button>
        </div>

        {/* Custom — compact apply row */}
        <div className="flex gap-1.5">
          <div className="relative flex-1 min-w-0">
            <Sparkles
              className="absolute start-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
              style={{ color: 'var(--accent)' }}
            />
            <input
              type="text"
              value={fontDraft}
              onChange={(e) => setFontDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyCustomFontInput();
                }
              }}
              placeholder={isAr ? 'اسم أو رابط…' : 'Name or URL…'}
              className="w-full ps-7 pe-2 py-2 rounded-xl border text-[11px]"
              style={glassInput}
              dir="ltr"
              aria-label={isAr ? 'خط مخصص' : 'Custom font'}
            />
          </div>
          <button
            type="button"
            onClick={applyCustomFontInput}
            disabled={!fontDraft.trim()}
            className="unity-btn-primary shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold disabled:opacity-40"
          >
            {isAr ? 'تطبيق' : 'Apply'}
          </button>
        </div>
      </section>

      {/* Custom CSS — compact bar */}
      <section
        className="rounded-2xl border overflow-hidden"
        style={glassCard}
        data-site-code-section="css"
      >
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer text-start"
          onClick={() => setCssOpen((v) => !v)}
          aria-expanded={cssOpen}
        >
          <div className="flex items-center gap-1.5 font-extrabold text-[12px]">
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
                color: 'var(--accent)',
              }}
            >
              <FileCode className="w-3.5 h-3.5" />
            </span>
            <span>{isAr ? 'تنسيقات مخصصة' : 'Custom CSS'}</span>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <label
              className="flex items-center gap-1 cursor-pointer text-[10px] font-bold"
              style={{ color: 'var(--muted)' }}
            >
              <input
                type="checkbox"
                checked={draft.enableCustomCss}
                onChange={(e) => patch({ enableCustomCss: e.target.checked })}
                className="w-3 h-3 rounded cursor-pointer"
                style={{ accentColor: 'var(--accent)' }}
              />
              <span>{isAr ? 'تفعيل' : 'On'}</span>
            </label>
            <span className="text-[10px] font-bold" style={{ color: 'var(--muted)' }}>
              {cssOpen ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'فتح' : 'Open')}
            </span>
          </div>
        </button>

        {cssOpen ? (
          <div
            className="px-3 pb-3 space-y-1.5 border-t"
            style={{ borderColor: 'color-mix(in srgb, #ffffff 30%, var(--border))' }}
          >
            <textarea
              rows={compact ? 5 : 7}
              value={draft.customCss}
              onChange={(e) => patch({ customCss: e.target.value })}
              placeholder={
                isAr
                  ? '/* مثال: .product-card { border-radius: 16px; } */'
                  : '/* e.g. .product-card { border-radius: 16px; } */'
              }
              dir="ltr"
              className="w-full mt-2 px-2.5 py-2 rounded-xl border font-mono text-[11px] leading-relaxed resize-y min-h-[100px]"
              style={{
                ...glassInput,
                background: 'color-mix(in srgb, #0f172a 88%, transparent)',
                color: '#34d399',
                borderColor: 'color-mix(in srgb, #ffffff 18%, transparent)',
              }}
            />
            <p className="text-[9px]" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'يُقيَّد تلقائياً بنطاق هذا المتجر.'
                : 'Auto-scoped to this store.'}
            </p>
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <button
          type="button"
          onClick={handleReset}
          className="px-2.5 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1 cursor-pointer"
          style={{ ...glassInput, color: 'var(--muted)' }}
        >
          <RotateCcw className="w-3 h-3" />
          <span>{isAr ? 'مسح' : 'Clear'}</span>
        </button>
        {onSave ? (
          <button
            type="button"
            disabled={saving || !storeId}
            aria-busy={saving}
            onClick={() => void onSave(draft)}
            className="unity-btn-primary px-3.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {saving
                ? isAr
                  ? 'حفظ…'
                  : 'Saving…'
                : isAr
                  ? 'حفظ'
                  : 'Save for store'}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
