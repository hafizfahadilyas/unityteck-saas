import React, { useState } from 'react';
import { applyChosen } from '../../../themes/coffeeRoasters/themeFlow';
import {
  applyThemeSuggestionApi,
  suggestThemeAltApi,
  suggestThemeHeadingApi,
  suggestThemeSeoApi,
  suggestThemeTranslateApi,
} from '../../../api/tenantApi';

export function ThemeSuggestPanel({
  isAr,
  storeId,
  pageId,
  widgetId,
  onClose,
  onApplied,
}: {
  isAr: boolean;
  storeId: string;
  pageId: string;
  widgetId: string;
  onClose: () => void;
  onApplied: () => void;
}) {
  const [heading, setHeading] = useState('');
  const [altEn, setAltEn] = useState('');
  const [altAr, setAltAr] = useState('');
  const [fileName, setFileName] = useState('');
  const [translateTarget, setTranslateTarget] = useState<string | null>(null);
  const [seoPick, setSeoPick] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (err) {
      setError(err instanceof Error ? err.message : (isAr ? 'تعذر الاقتراح' : 'Suggestion failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute top-16 end-3 z-[80] w-[min(100%,22rem)] bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-3" data-theme-suggest="1">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">{isAr ? 'اقتراحات الصفحة' : 'Page suggestions'}</h2>
        <button type="button" onClick={onClose} className="text-xs font-bold text-slate-500">{isAr ? 'إغلاق' : 'Close'}</button>
      </div>
      <button
        type="button"
        disabled={busy || !pageId}
        aria-busy={busy}
        className="text-xs font-bold rounded-lg border border-slate-200 px-2 py-1"
        onClick={() => void run(async () => {
          const res = await suggestThemeSeoApi(storeId, pageId);
          const suggestions = res.data.suggestions || {};
          setSeoPick(suggestions);
          setChosen(Object.keys(suggestions).filter((key) => suggestions[key]));
        })}
      >
        {isAr ? 'اقتراح التهيئة' : 'Suggest SEO'}
      </button>
      {Object.keys(seoPick).length > 0 && (
        <div className="space-y-1">
          {Object.entries(seoPick).map(([key, value]) => (
            <label key={key} className="flex items-start gap-2 text-[11px] text-slate-700">
              <input
                type="checkbox"
                checked={chosen.includes(key)}
                onChange={(event) => {
                  setChosen((prev) => event.target.checked ? [...prev, key] : prev.filter((item) => item !== key));
                }}
              />
              <span>{value || (isAr ? 'فارغ' : 'Empty')}</span>
            </label>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs font-bold rounded-lg bg-slate-900 text-white px-2 py-1"
              onClick={() => void run(async () => {
                const fields = applyChosen({}, seoPick, chosen);
                await applyThemeSuggestionApi(storeId, pageId, fields);
                onApplied();
              })}
            >
              {isAr ? 'تطبيق المختار' : 'Apply selected'}
            </button>
            <button type="button" className="text-xs font-bold px-2 py-1" onClick={() => { setSeoPick({}); setChosen([]); }}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        disabled={busy || !pageId || !widgetId}
        className="text-xs font-bold rounded-lg border border-slate-200 px-2 py-1"
        onClick={() => void run(async () => {
          const res = await suggestThemeHeadingApi(storeId, pageId, widgetId, isAr ? 'ar' : 'en');
          setHeading(res.data.suggestion || '');
        })}
      >
        {isAr ? 'اقتراح العنوان' : 'Suggest heading'}
      </button>
      <input value={heading} onChange={(event) => setHeading(event.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs" />
      <div className="flex gap-2">
        <button
          type="button"
          className="text-xs font-bold rounded-lg bg-slate-900 text-white px-2 py-1"
          onClick={() => void run(async () => {
            const key = isAr ? 'textAr' : 'textEn';
            await applyThemeSuggestionApi(storeId, pageId, { [key]: heading }, widgetId);
            onApplied();
          })}
        >
          {isAr ? 'تطبيق العنوان' : 'Apply heading'}
        </button>
        <button type="button" className="text-xs font-bold px-2 py-1" onClick={() => setHeading('')}>{isAr ? 'إلغاء' : 'Cancel'}</button>
      </div>
      <input
        value={fileName}
        onChange={(event) => setFileName(event.target.value)}
        placeholder={isAr ? 'اسم الملف' : 'File name'}
        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
        dir="ltr"
      />
      <button
        type="button"
        disabled={busy || !pageId}
        className="text-xs font-bold rounded-lg border border-slate-200 px-2 py-1"
        onClick={() => void run(async () => {
          const res = await suggestThemeAltApi(storeId, pageId, widgetId, fileName);
          setAltEn(res.data.alt_en || '');
          setAltAr(res.data.alt_ar || '');
        })}
      >
        {isAr ? 'اقتراح النص البديل' : 'Suggest alt text'}
      </button>
      <input value={altEn} onChange={(event) => setAltEn(event.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs" dir="ltr" />
      <input value={altAr} onChange={(event) => setAltAr(event.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs" dir="rtl" />
      <button
        type="button"
        className="text-xs font-bold rounded-lg bg-slate-900 text-white px-2 py-1"
        onClick={() => void run(async () => {
          await applyThemeSuggestionApi(storeId, pageId, { altEn, altAr }, widgetId);
          onApplied();
        })}
      >
        {isAr ? 'تطبيق النص البديل' : 'Apply alt text'}
      </button>
      <button
        type="button"
        disabled={busy || !pageId || !widgetId}
        className="text-xs font-bold rounded-lg border border-slate-200 px-2 py-1"
        onClick={() => void run(async () => {
          const res = await suggestThemeTranslateApi(storeId, pageId, widgetId, isAr ? 'ar' : 'en', true);
          setTranslateTarget(res.data.target);
        })}
      >
        {isAr ? 'اقتراح الترجمة بعد التأكيد' : 'Suggest translation after confirm'}
      </button>
      {translateTarget != null && (
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs font-bold rounded-lg bg-slate-900 text-white px-2 py-1"
            onClick={() => void run(async () => {
              const key = isAr ? 'textEn' : 'textAr';
              await applyThemeSuggestionApi(storeId, pageId, { [key]: translateTarget }, widgetId);
              onApplied();
            })}
          >
            {isAr ? 'تطبيق الحقل المقابل' : 'Apply opposite field'}
          </button>
          <button type="button" className="text-xs font-bold px-2 py-1" onClick={() => setTranslateTarget(null)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
