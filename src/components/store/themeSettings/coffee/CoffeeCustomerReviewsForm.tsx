import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import {
  fetchStoreReviewsApi,
  saveStoreReviewsApi,
  type StoreReviewRecord,
} from '../../../../api/tenantApi';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import { bi, type CustomerReviewsSettings } from '../../../../themes/settings/coffeeModularSettings';
import {
  approvedReviews,
  averageRating,
  clampCharacterLimit,
  clampPhotoLimit,
  filterReviewsByTab,
  reviewsShowsOnDevice,
  starDistribution,
  starPercent,
  type ReviewsPreviewDevice,
} from '../../../../themes/coffeeRoasters/components/coffeeCustomerReviewsLogic';

type Tab = 'content' | 'style' | 'layout' | 'advanced';
const TABS: { id: Tab; en: string; ar: string }[] = [
  { id: 'content', en: 'Content', ar: 'المحتوى' },
  { id: 'style', en: 'Style', ar: 'النمط' },
  { id: 'layout', en: 'Layout', ar: 'التخطيط' },
  { id: 'advanced', en: 'Advanced', ar: 'متقدم' },
];

const inputCls = 'w-full px-3 py-2 rounded-lg border bg-white text-xs outline-none focus:border-[var(--accent)]';
const cardCls = 'rounded-2xl border p-4 shadow-sm space-y-3';
const cardStyle: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' };
const inputStyle: React.CSSProperties = { borderColor: 'var(--border)', color: 'var(--text)' };

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-semibold" style={{ color: 'var(--text)' }}>
      <span>{label}</span>
      <button type="button" onClick={() => onChange(!on)} className="w-11 h-6 rounded-full p-0.5" style={{ background: on ? 'var(--portal-cta)' : 'var(--border)' }} aria-pressed={on}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

function mapDevice(d: PreviewDevice): ReviewsPreviewDevice {
  if (d === 'mobile') return 'mobile';
  if (d === 'tablet') return 'tablet';
  return 'desktop';
}

export const CoffeeCustomerReviewsForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr, activeStore, toast } = useCoffeeDraft('customerReviews');
  const [tab, setTab] = useState<Tab>('content');
  const [reviews, setReviews] = useState<StoreReviewRecord[]>([]);
  const [modLoading, setModLoading] = useState(true);
  const [modSaving, setModSaving] = useState(false);
  const lang = isAr ? 'ar' : 'en';

  const patch = (p: Partial<CustomerReviewsSettings>) => setDraft({ ...draft, ...p });

  useEffect(() => {
    let cancel = false;
    setModLoading(true);
    fetchStoreReviewsApi(activeStore.id)
      .then((rows) => {
        if (!cancel) setReviews(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancel) setReviews([]);
      })
      .finally(() => {
        if (!cancel) setModLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [activeStore.id]);

  const approved = useMemo(() => approvedReviews(reviews), [reviews]);
  const avg = averageRating(approved);
  const dist = starDistribution(approved);
  const withPhotos = filterReviewsByTab(approved, 'photos').length;

  const preview = (device: PreviewDevice) => {
    const d = mapDevice(device);
    if (!draft?.enabled) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'القسم مخفي' : 'Section hidden'}</div>;
    }
    if (!reviewsShowsOnDevice(draft, d)) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'مخفي على هذا الجهاز' : 'Hidden on this device'}</div>;
    }
    return (
      <div className="p-3 space-y-2 text-center">
        {draft.showBadge !== false && (draft.badgeEn || draft.badgeAr) ? (
          <div className="text-[9px] font-bold uppercase" style={{ color: 'var(--muted)' }}>{bi(lang, draft.badgeEn, draft.badgeAr)}</div>
        ) : null}
        {(draft.titleEn || draft.titleAr) ? <div className="font-bold text-sm">{bi(lang, draft.titleEn, draft.titleAr)}</div> : null}
        {draft.showRatingsSummary !== false ? (
          <div className="rounded-xl border p-2" style={{ borderColor: 'var(--border)' }}>
            <div className="text-2xl font-extrabold">{approved.length ? avg.toFixed(1) : '0.0'}</div>
            <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {approved.length ? (isAr ? `${approved.length} تقييم` : `${approved.length} reviews`) : isAr ? 'لا تقييمات معتمدة بعد' : 'No approved reviews yet'}
            </div>
            <div className="mt-1 space-y-0.5">
              {([5, 4, 3] as const).map((s) => (
                <div key={s} className="flex items-center gap-1 text-[9px]">
                  <span>{s}★</span>
                  <div className="flex-1 h-1.5 rounded bg-neutral-100 overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${starPercent(dist[s], approved.length)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {draft.showReviewTabs !== false ? (
          <div className="flex justify-center gap-1 text-[9px] font-bold">
            <span className="px-2 py-1 rounded-full" style={{ background: 'var(--portal-cta)', color: '#fff' }}>
              {isAr ? `الكل (${approved.length})` : `All (${approved.length})`}
            </span>
            <span className="px-2 py-1 rounded-full border" style={{ borderColor: 'var(--border)' }}>
              {isAr ? `صور (${withPhotos})` : `Photos (${withPhotos})`}
            </span>
          </div>
        ) : null}
        {approved.length === 0 ? (
          <div className="py-6 text-[11px]" style={{ color: 'var(--muted)' }}>
            <MessageSquare className="w-6 h-6 mx-auto mb-1 opacity-50" />
            {isAr ? 'لا تقييمات معتمدة بعد' : 'No approved reviews yet'}
          </div>
        ) : (
          <div className="text-start space-y-1">
            {approved.slice(0, 2).map((r) => (
              <div key={r.id} className="rounded-lg border p-2 text-[10px]" style={{ borderColor: 'var(--border)' }}>
                <div className="font-bold flex justify-between"><span>{r.author}</span><span>{'★'.repeat(Math.max(1, Math.min(5, Number(r.rating) || 0)))}</span></div>
                <div style={{ color: 'var(--muted)' }}>{isAr ? r.commentAr || r.comment : r.comment}</div>
              </div>
            ))}
          </div>
        )}
        {draft.enableWriteReview !== false ? (
          <div className="text-[10px] font-bold rounded-lg py-2" style={{ background: '#111', color: '#fff' }}>
            {bi(lang, draft.writeButtonEn, draft.writeButtonAr) || (isAr ? 'اكتب تقييماً' : 'Write a Review')}
          </div>
        ) : null}
      </div>
    );
  };

  const saveModeration = async () => {
    setModSaving(true);
    try {
      const next = await saveStoreReviewsApi(activeStore.id, reviews);
      setReviews(next);
      toast(isAr ? 'تم حفظ قائمة التقييمات' : 'Review list saved', 'success');
    } catch {
      toast(isAr ? 'فشل حفظ التقييمات' : 'Could not save reviews', 'error');
    } finally {
      setModSaving(false);
    }
  };

  return (
    <CoffeeWordSettingsShell
      isAr={isAr}
      onBack={onBack}
      embedded={embedded}
      titleEn="Customer Reviews"
      titleAr="تقييمات العملاء"
      subtitleEn="Homepage reviews chrome, form limits, and moderation. Empty stays empty."
      subtitleAr="واجهة التقييمات على الصفحة الرئيسية وحدود النموذج والاعتدال. الفارغ يبقى فارغاً."
      onSave={() => save()}
      saving={saving}
      savedFlash={savedFlash}
      preview={preview}
      settings={
        <>
          <div className="flex flex-wrap gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--border)' }} role="tablist">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  data-customer-reviews-tab={t.id}
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border"
                  style={active ? { background: 'var(--portal-cta)', color: '#fff', borderColor: 'var(--portal-cta)' } : { borderColor: 'transparent', color: 'var(--text)' }}
                >
                  {isAr ? t.ar : t.en}
                </button>
              );
            })}
          </div>

          {tab === 'content' ? (
            <>
              <section className={cardCls} style={cardStyle} data-customer-reviews-panel="content">
                <Toggle on={!!draft?.enabled} onChange={(v) => patch({ enabled: v })} label={isAr ? 'تفعيل القسم' : 'Enable Section'} />
                <Toggle on={draft?.showBadge !== false} onChange={(v) => patch({ showBadge: v })} label={isAr ? 'إظهار الشارة' : 'Show Badge'} />
                <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={80} value={isAr ? draft?.badgeAr || '' : draft?.badgeEn || ''} onChange={(e) => patch(isAr ? { badgeAr: e.target.value } : { badgeEn: e.target.value })} placeholder={isAr ? 'نص الشارة' : 'Badge text'} />
                <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={120} value={isAr ? draft?.titleAr || '' : draft?.titleEn || ''} onChange={(e) => patch(isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })} placeholder={isAr ? 'العنوان' : 'Title'} />
                <Toggle on={draft?.showDescription !== false} onChange={(v) => patch({ showDescription: v })} label={isAr ? 'إظهار الوصف' : 'Show Description'} />
                <textarea className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={240} rows={2} value={isAr ? draft?.descriptionAr || '' : draft?.descriptionEn || ''} onChange={(e) => patch(isAr ? { descriptionAr: e.target.value } : { descriptionEn: e.target.value })} placeholder={isAr ? 'الوصف' : 'Description'} />
                <Toggle on={draft?.showRatingsSummary !== false} onChange={(v) => patch({ showRatingsSummary: v })} label={isAr ? 'إظهار ملخص التقييمات' : 'Show Ratings Summary'} />
                <Toggle on={draft?.showReviewTabs !== false} onChange={(v) => patch({ showReviewTabs: v })} label={isAr ? 'إظهار تبويبات التقييمات' : 'Show Review Tabs'} />
                <Toggle on={draft?.enableWriteReview !== false} onChange={(v) => patch({ enableWriteReview: v })} label={isAr ? 'تفعيل زر كتابة تقييم' : 'Enable Write a Review Button'} />
                <Toggle on={draft?.allowPhotoUpload !== false} onChange={(v) => patch({ allowPhotoUpload: v })} label={isAr ? 'السماح برفع الصور' : 'Allow Photo Upload'} />
                <Toggle on={draft?.requireApproval !== false} onChange={(v) => patch({ requireApproval: v })} label={isAr ? 'يتطلب موافقة' : 'Require Approval'} />
              </section>

              <section className={cardCls} style={cardStyle} data-customer-reviews-panel="form">
                <h3 className="text-sm font-bold">{isAr ? 'إعدادات نموذج التقييم' : 'Review Form Settings'}</h3>
                <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={80} value={isAr ? draft?.formTitleAr || '' : draft?.formTitleEn || ''} onChange={(e) => patch(isAr ? { formTitleAr: e.target.value } : { formTitleEn: e.target.value })} placeholder={isAr ? 'عنوان النموذج' : 'Form title'} />
                <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={120} value={isAr ? draft?.placeholderAr || '' : draft?.placeholderEn || ''} onChange={(e) => patch(isAr ? { placeholderAr: e.target.value } : { placeholderEn: e.target.value })} placeholder={isAr ? 'نص توضيحي للحقل' : 'Review text placeholder'} />
                <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={60} value={isAr ? draft?.writeButtonAr || '' : draft?.writeButtonEn || ''} onChange={(e) => patch(isAr ? { writeButtonAr: e.target.value } : { writeButtonEn: e.target.value })} placeholder={isAr ? 'نص زر الكتابة' : 'Write button text'} />
                <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={60} value={isAr ? draft?.submitButtonAr || '' : draft?.submitButtonEn || ''} onChange={(e) => patch(isAr ? { submitButtonAr: e.target.value } : { submitButtonEn: e.target.value })} placeholder={isAr ? 'نص زر الإرسال' : 'Submit button text'} />
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'حد الأحرف' : 'Character limit'}</span>
                  <input className={inputCls} style={inputStyle} type="number" min={50} max={2000} value={clampCharacterLimit(draft?.characterLimit)} onChange={(e) => patch({ characterLimit: clampCharacterLimit(Number(e.target.value)) })} />
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'حد الصور' : 'Photo upload limit'}</span>
                  <input className={inputCls} style={inputStyle} type="number" min={0} max={10} value={clampPhotoLimit(draft?.photoUploadLimit)} onChange={(e) => patch({ photoUploadLimit: clampPhotoLimit(Number(e.target.value)) })} />
                </label>
              </section>
            </>
          ) : null}

          {tab === 'layout' ? (
            <section className={cardCls} style={cardStyle} data-customer-reviews-panel="layout">
              <label className="block space-y-1 text-[11px] font-semibold">
                <span style={{ color: 'var(--muted)' }}>{isAr ? 'عدد التقييمات المعروضة' : 'Reviews per page'}</span>
                <select className={inputCls} style={inputStyle} value={draft?.reviewsPerPage || 10} onChange={(e) => patch({ reviewsPerPage: Number(e.target.value) })}>
                  {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="block space-y-1 text-[11px] font-semibold">
                <span style={{ color: 'var(--muted)' }}>{isAr ? 'حشوة القسم' : 'Section padding (px)'}</span>
                <select className={inputCls} style={inputStyle} value={draft?.sectionPaddingY ?? 48} onChange={(e) => patch({ sectionPaddingY: Number(e.target.value) })}>
                  {[24, 32, 48, 64, 80].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="block space-y-1 text-[11px] font-semibold">
                <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة البطاقات' : 'Card gap (px)'}</span>
                <select className={inputCls} style={inputStyle} value={draft?.cardGapPx ?? 16} onChange={(e) => patch({ cardGapPx: Number(e.target.value) })}>
                  {[8, 12, 16, 20, 24].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </section>
          ) : null}

          {tab === 'style' ? (
            <section className={cardCls} style={cardStyle} data-customer-reviews-panel="style">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {isAr ? 'نجوم التقييم والبطاقات تتبع مظهر هايبرو المقفل.' : 'Rating stars and cards follow the locked HiBrew look.'}
              </p>
              <div className="flex items-center gap-1 text-amber-500"><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 text-neutral-300" /></div>
            </section>
          ) : null}

          {tab === 'advanced' ? (
            <>
              <section className={cardCls} style={cardStyle} data-customer-reviews-panel="advanced">
                <Toggle on={draft?.showOnDesktop !== false} onChange={(v) => patch({ showOnDesktop: v })} label={isAr ? 'إظهار على سطح المكتب' : 'Show on Desktop'} />
                <Toggle on={draft?.showOnTablet !== false} onChange={(v) => patch({ showOnTablet: v })} label={isAr ? 'إظهار على الجهاز اللوحي' : 'Show on Tablet'} />
                <Toggle on={draft?.showOnMobile !== false} onChange={(v) => patch({ showOnMobile: v })} label={isAr ? 'إظهار على الجوال' : 'Show on Mobile'} />
              </section>

              <section className={cardCls} style={cardStyle} data-customer-reviews-panel="moderation">
                <h3 className="text-sm font-bold">{isAr ? 'قائمة الاعتدال (واجهة التقييمات)' : 'Moderation queue (reviews API)'}</h3>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'التقييمات تُحفظ عبر واجهة التقييمات وليست ضمن JSON الثيم.' : 'Reviews persist on the reviews API, not theme JSON.'}
                </p>
                {modLoading ? <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p> : null}
                {!modLoading && reviews.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا تقييمات بعد.' : 'No reviews yet.'}</p>
                ) : null}
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-xl border px-2 py-2 flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{r.author || (isAr ? 'بدون اسم' : 'Untitled')} · {'★'.repeat(Math.max(1, Math.min(5, Number(r.rating) || 0)))}</div>
                        <div className="text-[10px] truncate" style={{ color: 'var(--muted)' }}>{isAr ? r.commentAr || r.comment : r.comment}</div>
                      </div>
                      <Toggle
                        on={r.active !== false}
                        onChange={(v) => setReviews(reviews.map((x) => (x.id === r.id ? { ...x, active: v } : x)))}
                        label={isAr ? 'ظاهر' : 'Visible'}
                      />
                    </li>
                  ))}
                </ul>
                <button type="button" disabled={modSaving} className="unity-btn-primary px-3 py-2 rounded-xl text-[11px] font-bold disabled:opacity-50" onClick={() => void saveModeration()}>
                  {modSaving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : isAr ? 'حفظ قائمة التقييمات' : 'Save review list'}
                </button>
              </section>
            </>
          ) : null}
        </>
      }
    />
  );
};

/** Alias for customizer lazy import compatibility. */
export const CoffeeReviewsForm = CoffeeCustomerReviewsForm;
