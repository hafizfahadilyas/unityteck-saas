import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Star, X } from 'lucide-react';
import { bi, type CustomerReviewsSettings } from '../../settings/coffeeModularSettings';
import {
  averageRating,
  approvedReviews,
  clampCharacterLimit,
  clampPhotoLimit,
  filterReviewsByTab,
  reviewsShowsOnDevice,
  starDistribution,
  starPercent,
  type ReviewsPreviewDevice,
  type ReviewsTab,
  type ReviewLike,
} from './coffeeCustomerReviewsLogic';

function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${cls} ${i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
      ))}
    </span>
  );
}

export const CoffeeCustomerReviewsSection: React.FC<{
  settings: CustomerReviewsSettings | null | undefined;
  rows: ReviewLike[] | null | undefined;
  lang?: 'ar' | 'en';
  device?: ReviewsPreviewDevice;
  loading?: boolean;
  onSubmitReview?: (payload: { rating: number; comment: string }) => Promise<void> | void;
}> = ({ settings, rows, lang = 'en', device = 'desktop', loading = false, onSubmitReview }) => {
  const isAr = lang === 'ar';
  const [tab, setTab] = useState<ReviewsTab>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const approved = useMemo(() => approvedReviews(rows), [rows]);
  const filtered = useMemo(() => filterReviewsByTab(approved, tab), [approved, tab]);
  const avg = averageRating(approved);
  const dist = starDistribution(approved);
  const total = approved.length;
  const photoCount = filterReviewsByTab(approved, 'photos').length;
  const charLimit = clampCharacterLimit(settings?.characterLimit);
  const photoLimit = clampPhotoLimit(settings?.photoUploadLimit);
  const perPage = Math.max(1, settings?.reviewsPerPage || 10);
  const shown = filtered.slice(0, perPage);
  const padY = settings?.sectionPaddingY ?? 48;

  if (!reviewsShowsOnDevice(settings, device)) return null;

  const submit = async () => {
    if (!onSubmitReview || !comment.trim() || rating < 1) return;
    if (comment.trim().length > charLimit) return;
    setBusy(true);
    try {
      await onSubmitReview({ rating, comment: comment.trim().slice(0, charLimit) });
      setComment('');
      setRating(5);
      setFormOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      data-customize-section="C-REV"
      className="w-full max-w-[1360px] mx-auto px-4 lg:px-8"
      style={{
        paddingTop: (settings?.spacingTopPx || 0) + padY,
        paddingBottom: (settings?.spacingBottomPx || 0) + padY,
      }}
    >
      <div className="max-w-3xl mx-auto text-center space-y-2 mb-6">
        {settings?.showBadge !== false && (settings?.badgeEn || settings?.badgeAr) ? (
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-neutral-600">
            {bi(lang, settings.badgeEn, settings.badgeAr)}
          </div>
        ) : null}
        {(settings?.titleEn || settings?.titleAr) ? (
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            {bi(lang, settings.titleEn, settings.titleAr)}
          </h2>
        ) : null}
        {settings?.showDescription !== false && (settings?.descriptionEn || settings?.descriptionAr) ? (
          <p className="text-sm text-neutral-500">{bi(lang, settings.descriptionEn, settings.descriptionAr)}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        {settings?.showRatingsSummary !== false ? (
          <div className="flex-1 min-w-[240px] rounded-2xl border border-neutral-100 bg-[#F8F9FA] p-4 flex flex-wrap gap-6">
            <div className="text-center min-w-[88px]">
              <div className="text-3xl font-black text-neutral-900">{total ? avg.toFixed(1) : '0.0'}</div>
              <Stars value={total ? avg : 0} size="lg" />
              <div className="text-[11px] text-neutral-500 mt-1">
                {isAr ? `${total} تقييم` : `${total} reviews`}
              </div>
            </div>
            <div className="flex-1 space-y-1.5 min-w-[160px]">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = dist[star];
                const pct = starPercent(count, total);
                return (
                  <div key={star} className="flex items-center gap-2 text-[11px]">
                    <span className="w-8 font-semibold text-neutral-600">{star}★</span>
                    <div className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-end text-neutral-500">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        {settings?.enableWriteReview !== false ? (
          <button
            type="button"
            className="unity-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold"
            onClick={() => setFormOpen(true)}
          >
            {bi(lang, settings?.writeButtonEn, settings?.writeButtonAr) || (isAr ? 'اكتب تقييماً' : 'Write a Review')}
          </button>
        ) : null}
      </div>

      {settings?.showReviewTabs !== false ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {(
            [
              ['all', isAr ? `كل التقييمات (${total})` : `All Reviews (${total})`],
              ['photos', isAr ? `مع صور (${photoCount})` : `With Photos (${photoCount})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold border"
              style={
                tab === id
                  ? { background: '#111', color: '#fff', borderColor: '#111' }
                  : { background: '#fff', color: '#333', borderColor: '#e5e5e5' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-neutral-500 text-center py-10">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
      ) : shown.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-[#F8F9FA] p-10 text-center text-sm text-neutral-500">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
          {isAr ? 'لا تقييمات معتمدة بعد.' : 'No approved reviews yet.'}
        </div>
      ) : (
        <div className="space-y-3" style={{ gap: settings?.cardGapPx ?? 16 }}>
          {shown.map((rev) => (
            <article key={rev.id} className="rounded-2xl border border-neutral-100 bg-[#F8F9FA] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="font-bold text-sm text-neutral-900">{rev.author || (isAr ? 'عميل' : 'Customer')}</div>
                <Stars value={Number(rev.rating) || 0} />
              </div>
              {(isAr ? rev.commentAr || rev.comment : rev.comment) ? (
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {isAr ? rev.commentAr || rev.comment : rev.comment}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <h3 className="font-bold text-sm">
                {bi(lang, settings?.formTitleEn, settings?.formTitleAr) || (isAr ? 'اكتب تقييماً' : 'Write a Review')}
              </h3>
              <button type="button" onClick={() => setFormOpen(false)} aria-label={isAr ? 'إغلاق' : 'Close'}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div>
                <div className="font-semibold mb-1">{isAr ? 'تقييمك' : 'Your Rating'}</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}`}>
                      <Star className={`w-6 h-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 font-semibold">
                  <span>{isAr ? 'مراجعتك' : 'Your Review'}</span>
                  <span className="text-neutral-400">{comment.length}/{charLimit}</span>
                </div>
                <textarea
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 min-h-[100px]"
                  maxLength={charLimit}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={bi(lang, settings?.placeholderEn, settings?.placeholderAr) || (isAr ? 'شارك تجربتك…' : 'Share your experience…')}
                  dir={isAr ? 'rtl' : 'ltr'}
                />
              </div>
              {settings?.allowPhotoUpload ? (
                <p className="text-[11px] text-neutral-500">
                  {isAr
                    ? `رفع الصور متاح (حد أقصى ${photoLimit} صور) — بانتظار الربط.`
                    : `Photo upload available (max ${photoLimit}) — waiting for media wire.`}
                </p>
              ) : null}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="px-3 py-2 rounded-xl border text-xs font-bold" onClick={() => setFormOpen(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={busy || !comment.trim()}
                  className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                  onClick={() => void submit()}
                >
                  {busy
                    ? isAr
                      ? 'جارٍ الإرسال…'
                      : 'Submitting…'
                    : bi(lang, settings?.submitButtonEn, settings?.submitButtonAr) || (isAr ? 'إرسال التقييم' : 'Submit Review')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

/** Admin preview helper — static empty/sample from props only. */
export function useReviewsDevice(): ReviewsPreviewDevice {
  const [device, setDevice] = useState<ReviewsPreviewDevice>('desktop');
  useEffect(() => {
    const sync = () => {
      const w = window.innerWidth;
      setDevice(w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);
  return device;
}
