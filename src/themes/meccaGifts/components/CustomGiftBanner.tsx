import React from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { MECCA_WHATSAPP } from '../data/mockData';

export const CustomGiftBanner: React.FC = () => {
  const { language, setCurrentPage, setSelectedCategory } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));

  const handleCustomAction = () => {
    const text = isCoffee
      ? (isAr ? 'مرحباً، أود الاستفسار عن بوكسات القهوة المختصة المخصصة وطلبات الجملة والمناسبات.' : 'Hello, I would like to inquire about bespoke coffee boxes and wholesale roasting.')
      : (isAr ? 'مرحباً، أود تصميم وتنسيق باقة ورد / طقم هدية مخصص وفريد حسب رغبتي.' : 'Hello, I would like to design and order a custom bespoke flower bouquet or gift set.');
    
    const wa = activeStore?.contactPhone?.replace('+', '') || MECCA_WHATSAPP.replace('+', '');
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const bgImage = isCoffee
    ? 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80'
    : '/src/assets/images/hadaya_white_orchid_penthouse_1791218732789.jpg';

  const title = isCoffee
    ? (isAr ? 'تبحث عن خلطة قهوة خاصة أو بوكس تحميص فاخر؟' : 'Looking for a custom roast or gift box?')
    : (isAr ? 'تبحث عن شيء فريد ومميز؟' : 'Looking for something unique?');

  const subtitle = isCoffee
    ? (isAr ? 'صمم بوكس القهوة الخاص بك ومحاصيلك المختارة بأيدي خبراء التحميص والباريستا' : 'Curate your custom coffee box and select single origins with master roasters')
    : (isAr ? 'صمم باقتك الخاصة أو طقم هديتك المخصص بأيدي خبراء التنسيق' : 'Create your own custom bouquet or gift set');

  const btnText = isCoffee
    ? (isAr ? 'طلب بوكس تحميص مخصص' : 'Custom Coffee Box')
    : (isAr ? 'تنسيق هدية خاصة' : 'Shop Custom Gifts');

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className={`relative rounded-3xl overflow-hidden min-h-[200px] sm:min-h-[240px] flex items-center shadow-xl ${isCoffee ? 'bg-[#1a0f0a]' : 'bg-[#102419]'}`}>
        {/* Background Image with dark overlay */}
        <div className="absolute inset-0">
          <img
            src={bgImage}
            alt={title}
            className="w-full h-full object-cover object-center filter brightness-[0.55]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80" />
        </div>

        {/* Content Centered */}
        <div className="relative z-10 w-full text-center px-6 sm:px-12 py-10 space-y-3 sm:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-white tracking-tight">
            {title}
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-[#e2dad0] font-light max-w-md mx-auto">
            {subtitle}
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCustomAction}
              className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 shadow-md hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer ${
                isCoffee
                  ? 'bg-[#c88a58] hover:bg-[#b07444] text-white'
                  : 'bg-white hover:bg-[#d4af37] text-[#102a1c]'
              }`}
            >
              <span>{btnText}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
