import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import {
  fetchStoreReviewsApi,
  submitStoreReviewApi,
  type StoreReviewRecord,
} from '../../../api/tenantApi';
import { Star, ShieldCheck, MessageSquare, Send, ThumbsUp, Sparkles } from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  const { language, showToast, products } = useCart();
  const { activeStore } = useTenant();
  const isAr = language === 'AR';

  const [reviews, setReviews] = useState<StoreReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [author, setAuthor] = useState('');
  const [city, setCity] = useState(isAr ? 'الرياض' : 'Riyadh');
  const [product, setProduct] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const productOptions = useMemo(() => {
    const rows = (products || []).map((p) => ({
      value: p.name,
      labelEn: p.name,
      labelAr: p.nameAr || p.name,
    }));
    return rows;
  }, [products]);

  useEffect(() => {
    if (!product && productOptions[0]) {
      setProduct(productOptions[0].value);
    }
  }, [product, productOptions]);

  useEffect(() => {
    let cancel = false;
    const storeId = activeStore?.id;
    if (!storeId) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchStoreReviewsApi(storeId)
      .then((rows) => {
        if (cancel) return;
        setReviews((rows || []).filter((r) => r.active !== false));
      })
      .catch(() => {
        if (!cancel) setReviews([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [activeStore?.id]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return Math.round((sum / reviews.length) * 100) / 100;
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim() || !activeStore?.id) return;
    setSubmitting(true);
    try {
      const created = await submitStoreReviewApi(activeStore.id, {
        author: author.trim(),
        city: city.trim(),
        product: product.trim(),
        rating,
        title: title.trim() || (isAr ? 'تجربة ممتازة' : 'Great experience'),
        comment: comment.trim(),
        verified: false,
        active: false,
        likes: 0,
        date: isAr ? 'بانتظار المراجعة' : 'Pending review',
      });
      // Pending reviews stay off the public list until merchant approves (C-REV).
      if (created?.active) {
        setReviews((prev) => [created, ...prev]);
      }
      setAuthor('');
      setTitle('');
      setComment('');
      showToast(
        isAr
          ? 'تم إرسال تقييمك وهو بانتظار موافقة المتجر'
          : 'Your review was submitted and is pending store approval',
      );
    } catch {
      showToast(isAr ? 'تعذر إرسال التقييم' : 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = (id: string) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, likes: (r.likes || 0) + 1 } : r)));
  };

  return (
    <div className="min-h-screen bg-white py-12 text-start text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="max-w-[1360px] mx-auto px-4 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{isAr ? 'تجارب موثوقة بالمملكة' : 'Verified Reviews'}</span>
          </div>
          <h1
            className={`honor-heading text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-bold text-black text-center ${
              isAr ? 'leading-[1.4] tracking-normal' : 'leading-tight tracking-[-0.01em]'
            }`}
          >
            {isAr ? 'تقييمات وتجارب العملاء المعتمدة' : 'Verified Customer Reviews'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600">
            {avgRating != null
              ? isAr
                ? `تجارب حقيقية من مشترين معتمدين. متوسط التقييم${avgRating}من 5.`
                : `Real feedback from verified buyers. Average rating ${avgRating} / 5.`
              : isAr
                ? 'لا تقييمات معتمدة بعد. كن أول من يشارك تجربته.'
                : 'No approved reviews yet. Be the first to share your experience.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            {loading && (
              <p className="text-sm text-neutral-500 text-center py-10">
                {isAr ? 'جارٍ تحميل التقييمات…' : 'Loading reviews…'}
              </p>
            )}
            {!loading && reviews.length === 0 && (
              <div className="bg-[#F8F9FA] rounded-3xl p-10 text-center text-sm text-neutral-500 border border-dashed border-neutral-200">
                {isAr ? 'لا سجلات تقييمات بعد' : 'No reviews found'}
              </div>
            )}
            {!loading &&
              reviews.map((rev) => (
                <div key={rev.id} className="bg-[#F8F9FA] rounded-3xl p-6 sm:p-7 space-y-3 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-black text-white font-black flex items-center justify-center text-sm">
                        {(rev.author || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-900">{rev.author}</span>
                          {rev.verified && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>{isAr ? 'مشتري معتمد' : 'Verified Buyer'}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-500">
                          {[rev.city, isAr && rev.productAr ? rev.productAr : rev.product]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">{rev.date || ''}</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < (rev.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                      />
                    ))}
                  </div>

                  {(isAr ? rev.titleAr || rev.title : rev.title) ? (
                    <h3 className="font-bold text-base text-neutral-900">
                      {isAr ? rev.titleAr || rev.title : rev.title}
                    </h3>
                  ) : null}
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    {isAr ? rev.commentAr || rev.comment : rev.comment}
                  </p>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleLike(rev.id)}
                      className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{rev.likes || 0}</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="lg:col-span-4 bg-[#F8F9FA] rounded-3xl p-6 space-y-4 sticky top-24">
            <h3 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-neutral-800" />
              <span>{isAr ? 'شاركنا تجربتك' : 'Write a Review'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isAr ? 'اسمك الكريم' : 'Your Name'}
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-neutral-100 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isAr ? 'المدينة' : 'City'}
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-neutral-100 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isAr ? 'المنتج' : 'Product'}
                </label>
                {productOptions.length > 0 ? (
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full bg-neutral-100 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden"
                  >
                    {productOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isAr ? opt.labelAr : opt.labelEn}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder={isAr ? 'اسم المنتج' : 'Product name'}
                    className="w-full bg-neutral-100 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isAr ? 'التقييم' : 'Rating'}
                </label>
                <div className="flex gap-2">
                  {[5, 4, 3, 2, 1].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setRating(num)}
                      className={`flex-1 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                        rating === num ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {num} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isAr ? 'عنوان التقييم' : 'Review Title'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isAr ? 'مثال: جودة ممتازة وسرعة توصيل' : 'e.g. Excellent build quality'}
                  className="w-full bg-neutral-100 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isAr ? 'تفاصيل تجربتك' : 'Your Review'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isAr ? 'اكتب رأيك وتجربتك مع الجهاز...' : 'Share your experience with the machine...'}
                  className="w-full bg-neutral-100 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !activeStore?.id}
                aria-busy={submitting}
                className="w-full py-3 bg-black hover:bg-neutral-800 disabled:opacity-60 text-white font-bold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {submitting
                    ? isAr
                      ? 'جارٍ الإرسال…'
                      : 'Submitting…'
                    : isAr
                      ? 'نشر التقييم'
                      : 'Submit Review'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
