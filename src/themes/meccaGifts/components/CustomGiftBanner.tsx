import React from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { MECCA_WHATSAPP } from '../data/mockData';

export interface CustomGiftBannerProps {
  settings?: Record<string, any>;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  imageUrl?: string;
  buttonTextAr?: string;
  buttonTextEn?: string;
  buttonUrl?: string;
  isBuilderMode?: boolean;
}

export const CustomGiftBanner: React.FC<CustomGiftBannerProps> = ({
  settings,
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  imageUrl,
  buttonTextAr,
  buttonTextEn,
  buttonUrl,
  isBuilderMode = false,
}) => {
  const { language, setCurrentPage, setSelectedCategory } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const s = settings || {};

  const isCoffee =
    activeStore?.id === 'store-coffee' ||
    Boolean(activeStore?.category && activeStore.category.includes('قهوة')) ||
    Boolean(s.isCoffee);

  const isCarStore =
    activeStore?.id?.includes('transport') ||
    activeStore?.id?.includes('car') ||
    Boolean(
      activeStore?.category &&
        (activeStore.category.includes('سيارات') ||
          activeStore.category.toLowerCase().includes('car') ||
          activeStore.category.toLowerCase().includes('transport'))
    );

  const handleCustomAction = () => {
    const targetLink = s.buttonUrl || s.ctaLink || buttonUrl;
    if (targetLink && targetLink.startsWith('#')) {
      setCurrentPage(targetLink.replace('#', '') as any);
      return;
    }

    const text = isCoffee
      ? isAr
        ? 'مرحباً، أود الاستفسار عن بوكسات القهوة المختصة المخصصة وطلبات الجملة والمناسبات.'
        : 'Hello, I would like to inquire about bespoke coffee boxes and wholesale roasting.'
      : isCarStore
      ? isAr
        ? 'مرحباً، أود تفصيل طقم مقاعد أو دعاسات خاصة لسيارتي بمقاسات وخامات مخصصة.'
        : 'Hello, I would like to order custom-tailored luxury seat covers or floor mats for my car.'
      : isAr
      ? 'مرحباً، أود تصميم وتنسيق باقة ورد / طقم هدية مخصص وفريد حسب رغبتي.'
      : 'Hello, I would like to design and order a custom bespoke flower bouquet or gift set.';

    const wa =
      activeStore?.contactPhone?.replace('+', '') ||
      MECCA_WHATSAPP.replace('+', '');
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const defaultBgImage = isCoffee
    ? 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80'
    : isCarStore
    ? 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
    : '/src/assets/images/hadaya_white_orchid_penthouse_1791218732789.jpg';

  const bgImage =
    s.imageUrl ||
    s.banner1Image ||
    s.customImage ||
    s.bgImage ||
    imageUrl ||
    defaultBgImage;

  const defaultTitleAr = isCoffee
    ? 'تبحث عن خلطة قهوة خاصة أو بوكس تحميص فاخر؟'
    : isCarStore
    ? 'تبحث عن تفصيل فاخر ومخصص لسيارتك؟'
    : 'تبحث عن شيء فريد ومميز؟';

  const defaultTitleEn = isCoffee
    ? 'Looking for a custom roast or gift box?'
    : isCarStore
    ? 'Looking for bespoke interior tailoring for your car?'
    : 'Looking for something unique?';

  const defaultSubtitleAr = isCoffee
    ? 'صمم بوكس القهوة الخاص بك ومحاصيلك المختارة بأيدي خبراء التحميص والباريستا'
    : isCarStore
    ? 'فصل أغطية المقاعد والدعاسات بأفخم الجلود المقاومة بأيدي أمهر الحرفيين'
    : 'صمم باقتك الخاصة أو طقم هديتك المخصص بأيدي خبراء التنسيق';

  const defaultSubtitleEn = isCoffee
    ? 'Curate your custom coffee box and select single origins with master roasters'
    : isCarStore
    ? 'Custom tailor your vehicle seats and mats with ultra-durable luxury leathers'
    : 'Create your own custom bouquet or gift set';

  const defaultBtnTextAr = isCoffee
    ? 'طلب بوكس تحميص مخصص'
    : isCarStore
    ? 'طلب تفصيل مخصص'
    : 'تنسيق هدية خاصة';

  const defaultBtnTextEn = isCoffee
    ? 'Custom Coffee Box'
    : isCarStore
    ? 'Order Bespoke Tailoring'
    : 'Shop Custom Gifts';

  const title =
    s.titleAr && isAr
      ? s.titleAr
      : s.titleEn && !isAr
      ? s.titleEn
      : isAr
      ? s.mainTitleAr || titleAr || defaultTitleAr
      : s.mainTitleEn || titleEn || defaultTitleEn;

  const subtitle =
    s.subtitleAr && isAr
      ? s.subtitleAr
      : s.subtitleEn && !isAr
      ? s.subtitleEn
      : isAr
      ? subtitleAr || defaultSubtitleAr
      : subtitleEn || defaultSubtitleEn;

  const btnText =
    s.buttonTextAr && isAr
      ? s.buttonTextAr
      : s.buttonTextEn && !isAr
      ? s.buttonTextEn
      : isAr
      ? buttonTextAr || defaultBtnTextAr
      : buttonTextEn || defaultBtnTextEn;

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div
        className={`relative rounded-3xl overflow-hidden min-h-[200px] sm:min-h-[240px] flex items-center shadow-xl ${
          isCoffee
            ? 'bg-[#1a0f0a]'
            : isCarStore
            ? 'bg-[#121619]'
            : 'bg-[#102419]'
        }`}
      >
        {/* Background Image with dark overlay */}
        <div className="absolute inset-0">
          <img
            src={bgImage}
            alt={title}
            className="w-full h-full object-cover object-center filter brightness-[0.55]"
            loading="lazy" decoding="async"
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
                  : isCarStore
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-white hover:bg-[#d4af37] text-[#102a1c]'
              }`}
            >
              <span>{btnText}</span>
              {isAr ? (
                <ArrowLeft className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

