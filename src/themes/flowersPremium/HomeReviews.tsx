import React, { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { FLOWERS_REVIEWS } from './pack';

type Props = { lang: string; isMobile?: boolean };

export const HomeReviews: React.FC<Props> = ({ lang, isMobile = false }) => {
  const ar = lang === 'ar';
  const [activeSlide, setActiveSlide] = useState(0);

  const prevReview = () => {
    setActiveSlide((prev) => (prev === 0 ? FLOWERS_REVIEWS.length - 1 : prev - 1));
  };

  const nextReview = () => {
    setActiveSlide((prev) => (prev === FLOWERS_REVIEWS.length - 1 ? 0 : prev + 1));
  };

  return (
    <section
      className="px-4 sm:px-8 py-8 sm:py-10 border-t"
      style={{
        background: 'color-mix(in srgb, var(--sf-accent) 6%, var(--sf-bg))',
        borderColor: 'var(--sf-border)',
        color: 'var(--sf-text)',
      }}
    >
      <div className="text-center max-w-lg mx-auto mb-6 space-y-1">
        <h3 className="text-base sm:text-lg font-black tracking-tight">
          {ar ? 'آراء عملاء مكة' : 'Customer reviews'}
        </h3>
        <p className="text-[11px]" style={{ color: 'var(--sf-muted)' }}>
          {ar ? 'تقييمات معتمدة من طلبات حقيقية في المتجر' : 'Verified feedback from real store orders'}
        </p>
      </div>

      {isMobile ? (
        /* Mobile View: 1 luxury full-width review card with swipe / arrow navigation */
        <div className="max-w-sm mx-auto relative px-2">
          {(() => {
            const r = FLOWERS_REVIEWS[activeSlide];
            return (
              <article
                key={activeSlide}
                className="rounded-2xl border p-5 flex flex-col gap-3.5 relative overflow-hidden transition-all duration-300 shadow-sm"
                style={{
                  background: 'var(--sf-surface)',
                  borderColor: 'var(--sf-border)',
                  boxShadow: 'var(--sf-card-shadow)',
                }}
              >
                <Quote
                  className="w-10 h-10 absolute end-3 top-3 opacity-15"
                  style={{ color: 'var(--sf-accent)' }}
                />
                <div className="flex items-center gap-1" style={{ color: '#f59e0b' }}>
                  {Array.from({ length: r.rating }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-current" />
                  ))}
                  <span className="text-[11px] font-bold text-slate-500 ms-1.5">5.0 / 5.0</span>
                </div>
                <p className="text-sm leading-relaxed relative z-1 font-medium" style={{ color: 'var(--sf-text)' }}>
                  “{ar ? r.textAr : r.textEn}”
                </p>
                <div className="mt-auto pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--sf-border)' }}>
                  <div>
                    <p className="text-xs font-black">{ar ? r.nameAr : r.nameEn}</p>
                    <p className="text-[10px]" style={{ color: 'var(--sf-muted)' }}>
                      {ar ? r.cityAr : r.cityEn}
                    </p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    {ar ? 'طلب مؤكد' : 'Verified Buyer'}
                  </span>
                </div>
              </article>
            );
          })()}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex items-center gap-1.5">
              {FLOWERS_REVIEWS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === activeSlide ? 'w-6 bg-emerald-600' : 'w-1.5 bg-slate-300'
                  }`}
                  aria-label={`Go to review ${idx + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevReview}
                className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={nextReview}
                className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                aria-label="Next review"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop View: 3-column Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {FLOWERS_REVIEWS.map((r, i) => (
            <article
              key={i}
              className="rounded-2xl border p-4 flex flex-col gap-3 relative overflow-hidden"
              style={{
                background: 'var(--sf-surface)',
                borderColor: 'var(--sf-border)',
                boxShadow: 'var(--sf-card-shadow)',
              }}
            >
              <Quote
                className="w-8 h-8 absolute end-3 top-3 opacity-15"
                style={{ color: 'var(--sf-accent)' }}
              />
              <div className="flex items-center gap-0.5" style={{ color: '#f59e0b' }}>
                {Array.from({ length: r.rating }).map((_, s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs leading-relaxed relative z-1" style={{ color: 'var(--sf-text)' }}>
                “{ar ? r.textAr : r.textEn}”
              </p>
              <div className="mt-auto pt-2 border-t" style={{ borderColor: 'var(--sf-border)' }}>
                <p className="text-xs font-bold">{ar ? r.nameAr : r.nameEn}</p>
                <p className="text-[10px]" style={{ color: 'var(--sf-muted)' }}>
                  {ar ? r.cityAr : r.cityEn}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

