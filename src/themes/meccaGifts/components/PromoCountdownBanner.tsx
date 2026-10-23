import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const PromoCountdownBanner: React.FC = () => {
  const { language, setCurrentPage, setSelectedCategory } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));

  // Live countdown matching [02 Days 14 Hours 36 Minutes]
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 36,
    seconds: 48,
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

  const handleShopCollection = () => {
    setSelectedCategory(isCoffee ? 'حبوب القهوة المختصة' : 'باقات الورود الطبيعية');
    setCurrentPage('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bannerImage = isCoffee
    ? 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80'
    : '/images/hadaya_promo_banner_1791216140411.jpg';

  const title = isCoffee
    ? (isAr ? 'محاصيل بن مختارة لخبراء التذوق' : 'Specialty Coffee Roasts for Connoisseurs')
    : (isAr ? 'زهور طبيعية لكل مناسبة' : 'Fresh Flowers for Every Occasion');

  const subtitle = isCoffee
    ? (isAr ? 'احصل على خصم 20% على مجموعات التحميص ومحاصيل المزارع النادرة' : 'Get 20% off on rare single-origin beans and roasting bundles')
    : (isAr ? 'احصل على خصم 20% على باقات مختارة' : 'Get 20% off on selected bouquets');

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Banner Container matching Image 2 Center */}
      <div className={`relative rounded-3xl overflow-hidden text-white shadow-xl min-h-[300px] sm:min-h-[340px] flex items-center ${isCoffee ? 'bg-[#1e120c]' : 'bg-[#261715]'}`}>
        
        {/* Photography split background */}
        <div className="absolute inset-0">
          <img
            src={bannerImage}
            alt={title}
            className="w-full h-full object-cover object-left filter brightness-[0.88]"
            loading="lazy" decoding="async"
          />
          {/* Subtle gradient overlay to enhance text readability on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/55 to-black/85 rtl:bg-gradient-to-l rtl:from-black/20 rtl:via-black/55 rtl:to-black/85" />
        </div>

        {/* Content Container (Right-aligned in LTR, Left-aligned in RTL) */}
        <div className="relative z-10 w-full p-6 sm:p-10 lg:p-14 flex flex-col items-center md:items-end text-center md:text-end space-y-4 sm:space-y-5">
          <div className="max-w-md space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-white tracking-tight">
              {title}
            </h2>

            <p className="text-sm sm:text-base text-[#e5ded4] font-light">
              {subtitle}
            </p>
          </div>

          {/* Countdown timer blocks [ 02 Days ] [ 14 Hours ] [ 36 Minutes ] */}
          <div className="flex items-center gap-2.5 sm:gap-4 pt-1">
            {/* Days */}
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white bg-white/15 backdrop-blur-md rounded-xl px-3 py-2 min-w-[50px] border border-white/20">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-[#d6cdbe] mt-1 font-medium">
                {isAr ? 'يوم' : 'Days'}
              </span>
            </div>

            <span className="text-lg font-bold text-white/60 pb-4">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white bg-white/15 backdrop-blur-md rounded-xl px-3 py-2 min-w-[50px] border border-white/20">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-[#d6cdbe] mt-1 font-medium">
                {isAr ? 'ساعة' : 'Hours'}
              </span>
            </div>

            <span className="text-lg font-bold text-white/60 pb-4">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white bg-white/15 backdrop-blur-md rounded-xl px-3 py-2 min-w-[50px] border border-white/20">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-[#d6cdbe] mt-1 font-medium">
                {isAr ? 'دقيقة' : 'Minutes'}
              </span>
            </div>
          </div>

          {/* Shop Collection CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleShopCollection}
              className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full border border-white/40 bg-white/15 hover:bg-white text-white hover:text-[#102a1c] font-bold text-xs sm:text-sm backdrop-blur-md transition-all duration-300 shadow-md hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{isAr ? 'تسوق التشكيلة' : 'Shop Collection'}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

