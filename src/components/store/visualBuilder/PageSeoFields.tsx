import React, { useState } from 'react';

export type PageSeoFieldsValue = {
  seo_title_en?: string;
  seo_title_ar?: string;
  seo_description_en?: string;
  seo_description_ar?: string;
  canonical?: string;
  robots?: string;
  og_title_en?: string;
  og_title_ar?: string;
  og_description_en?: string;
  og_description_ar?: string;
  og_image?: string;
  twitter_card?: string;
  hreflang?: { en?: string; ar?: string };
};

const EMPTY: PageSeoFieldsValue = {
  seo_title_en: '',
  seo_title_ar: '',
  seo_description_en: '',
  seo_description_ar: '',
  canonical: '',
  robots: 'index,follow',
  og_title_en: '',
  og_title_ar: '',
  og_description_en: '',
  og_description_ar: '',
  og_image: '',
  twitter_card: 'summary_large_image',
  hreflang: { en: '', ar: '' },
};

export function PageSeoFields({
  isAr,
  value,
  busy,
  onClose,
  onSave,
}: {
  isAr: boolean;
  value: PageSeoFieldsValue | null;
  busy: boolean;
  onClose: () => void;
  onSave: (next: PageSeoFieldsValue) => void;
}) {
  const [form, setForm] = useState<PageSeoFieldsValue>({
    ...EMPTY,
    ...(value || {}),
    hreflang: { en: value?.hreflang?.en || '', ar: value?.hreflang?.ar || '' },
  });

  const set = (key: keyof PageSeoFieldsValue, next: string) => {
    setForm((prev) => ({ ...prev, [key]: next }));
  };

  const field = (key: keyof PageSeoFieldsValue, label: string, area = false) => {
    const keyStr = String(key);
    const dir =
      key === 'canonical' || key === 'og_image'
        ? 'ltr'
        : keyStr.endsWith('_ar')
          ? 'rtl'
          : keyStr.endsWith('_en')
            ? 'ltr'
            : undefined;
    return (
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
        <span>{label}</span>
        {area ? (
          <textarea
            dir={dir}
            value={String(form[key] || '')}
            onChange={(event) => set(key, event.target.value)}
            rows={2}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-normal"
          />
        ) : (
          <input
            dir={dir}
            value={String(form[key] || '')}
            onChange={(event) => set(key, event.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-normal"
          />
        )}
      </label>
    );
  };

  return (
    <div className="absolute inset-0 z-[80] bg-slate-900/40 flex items-start justify-center p-4 overflow-y-auto" data-theme-modal="seo">
      <form
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl p-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">{isAr ? 'تهيئة الصفحة' : 'Page SEO'}</h2>
          <button type="button" onClick={onClose} className="text-xs font-bold text-slate-500">
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isAr
            ? field('seo_title_ar', 'العنوان')
            : field('seo_title_en', 'Title')}
          {isAr
            ? field('seo_description_ar', 'الوصف', true)
            : field('seo_description_en', 'Description', true)}
          {isAr
            ? field('og_title_ar', 'عنوان المشاركة')
            : field('og_title_en', 'Share title')}
          {isAr
            ? field('og_description_ar', 'وصف المشاركة', true)
            : field('og_description_en', 'Share description', true)}
          {field('og_image', isAr ? 'صورة المشاركة' : 'Share image')}
          {field('twitter_card', isAr ? 'بطاقة المشاركة' : 'Share card')}
          {field('canonical', isAr ? 'الرابط الأساسي' : 'Canonical URL')}
        </div>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
          <span>{isAr ? 'ظهور الصفحة في محركات البحث' : 'Search visibility'}</span>
          <select
            value={form.robots || 'index,follow'}
            onChange={(event) => set('robots', event.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-normal"
          >
            <option value="index,follow">{isAr ? 'إظهار في الفهرس' : 'Index'}</option>
            <option value="noindex,nofollow">{isAr ? 'إخفاء من الفهرس' : 'No index'}</option>
          </select>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
            <span>{isAr ? 'رابط اللغة الإنجليزية' : 'English language URL'}</span>
            <input
              dir="ltr"
              value={form.hreflang?.en || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, hreflang: { ...prev.hreflang, en: event.target.value } }))}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
            <span>{isAr ? 'رابط اللغة العربية' : 'Arabic language URL'}</span>
            <input
              dir="ltr"
              value={form.hreflang?.ar || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, hreflang: { ...prev.hreflang, ar: event.target.value } }))}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-normal"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="w-full rounded-xl bg-slate-900 text-white text-sm font-bold py-2 disabled:opacity-60"
        >
          {isAr ? 'حفظ التهيئة' : 'Save SEO'}
        </button>
      </form>
    </div>
  );
}
