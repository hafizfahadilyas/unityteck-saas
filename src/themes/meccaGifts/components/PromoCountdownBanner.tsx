import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PROMO_BANNER_IMAGE } from '../data/mockData';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

export const PromoCountdownBanner: React.FC = () => {
  const { language, setCurrentPage, setSelectedCategory } = useApp();
  const isAr = language === 'ar';

  // Live countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 36,
    seconds: 48
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden bg-[#241a16] shadow-xl text-white">
        
        {/* Background Image matching Image 6 */}
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/mecca_offer_countdown_banner_1791219782790.jpg"
            alt="Exclusive Hadaya Promotion"
            className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.08]"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30 rtl:bg-gradient-to-l rtl:from-black/85 rtl:via-black/55 rtl:to-black/30" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 py-12 md:py-16 px-6 sm:px-10 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Text & Action */}
          <div className="space-y-4 max-w-xl text-center md:text-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F5]/15 backdrop-blur-md text-[#e6ca98] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض حصري محدود' : 'Limited Time Offer'}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-serif text-[#FAF9F5]">
              {isAr ? 'لحظتك تستحق أكثر' : 'Your Moment Deserves More'}
            </h2>

            <p className="text-base sm:text-lg text-[#ded7c8] font-light">
              {isAr
                ? 'خصم 20% على مجموعة مختارة من أندر باقات الورد والهدايا الملكية'
                : 'Enjoy 20% off on a curated selection of royal rose arrangements and signature gift boxes.'}
            </p>

            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedCategory('باقات فاخرة');
                  setCurrentPage('catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-7 py-3 rounded-full bg-[#f4ece1] text-[#1c1815] font-bold text-sm hover:bg-[#e6ca98] transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <span>{isAr ? 'اكتشف العرض' : 'Explore Offer'}</span>
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Live Countdown Display */}
          <div className="bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-center text-[#e6ca98] font-semibold mb-3">
              {isAr ? 'ينتهي العرض خلال' : 'Offer Ends In'}
            </p>

            <div className="flex items-center gap-3 sm:gap-4 text-center">
              {/* Days */}
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white bg-white/10 rounded-xl px-3 py-2 min-w-[54px] border border-white/10">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[11px] text-[#ded7c8] mt-1 font-medium">{isAr ? 'يوم' : 'Days'}</span>
              </div>

              <span className="text-xl font-bold text-[#e6ca98] pb-4">:</span>

              {/* Hours */}
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white bg-white/10 rounded-xl px-3 py-2 min-w-[54px] border border-white/10">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[11px] text-[#ded7c8] mt-1 font-medium">{isAr ? 'ساعة' : 'Hours'}</span>
              </div>

              <span className="text-xl font-bold text-[#e6ca98] pb-4">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white bg-white/10 rounded-xl px-3 py-2 min-w-[54px] border border-white/10">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[11px] text-[#ded7c8] mt-1 font-medium">{isAr ? 'دقيقة' : 'Mins'}</span>
              </div>

              <span className="text-xl font-bold text-[#e6ca98] pb-4">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[#e6ca98] bg-white/10 rounded-xl px-3 py-2 min-w-[54px] border border-[#e6ca98]/30">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[11px] text-[#ded7c8] mt-1 font-medium">{isAr ? 'ثانية' : 'Secs'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
