import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { Sparkles, Truck, ShieldCheck, Headphones, ArrowLeft, ArrowRight, Coffee, Zap, Award } from 'lucide-react';

export interface OccasionAndWhyUsSectionProps {
  settings?: Record<string, any>;
  isBuilderMode?: boolean;
}

export const OccasionAndWhyUsSection: React.FC<OccasionAndWhyUsSectionProps> = ({
  settings,
  isBuilderMode = false,
}) => {
  const { language, navigateToCategory, setCurrentPage, setSelectedCategory } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const s = settings || {};
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));
  const isCarStore =
    activeStore?.id?.includes('transport') ||
    activeStore?.id?.includes('car') ||
    Boolean(
      activeStore?.category &&
        (activeStore.category.includes('سيارات') ||
          activeStore.category.toLowerCase().includes('car') ||
          activeStore.category.toLowerCase().includes('transport'))
    );

  const flowerOccasions = [
    {
      id: 'occ-1',
      title: 'Birthday',
      titleAr: 'عيد ميلاد',
      subtitle: 'Make it Special',
      subtitleAr: 'اجعله مميزاً',
      image: '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg',
      categoryKey: 'ورد و كيك',
    },
    {
      id: 'occ-2',
      title: 'Anniversary',
      titleAr: 'ذكرى سنوية',
      subtitle: 'Celebrate Love',
      subtitleAr: 'احتفل بالحب',
      image: '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
      categoryKey: 'ورد أحمر',
    },
    {
      id: 'occ-3',
      title: 'Congratulations',
      titleAr: 'تهنئة وتخرج',
      subtitle: 'Share the Joy',
      subtitleAr: 'شارك الفرحة',
      image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
      categoryKey: 'باقات فاخرة',
    },
    {
      id: 'occ-4',
      title: 'Wedding',
      titleAr: 'زفاف وعقد قران',
      subtitle: 'For a Beautiful Day',
      subtitleAr: 'ليوم لا يُنسى',
      image: '/src/assets/images/hadaya_royal_wedding_flowers_1791300194084.jpg',
      categoryKey: 'باقات الورود الطبيعية',
    },
    {
      id: 'occ-5',
      title: 'Custom Gifts',
      titleAr: 'هدايا مخصصة',
      subtitle: 'Your Idea, Our Care',
      subtitleAr: 'فكرتك وعنايتنا',
      image: '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg',
      categoryKey: 'هدايا ملكية فاخرة',
    },
  ];

  const coffeeOccasions = [
    {
      id: 'occ-cof-1',
      title: 'Morning Routine',
      titleAr: 'قهوة الصباح والبدايات',
      subtitle: 'Wake Up Inspired',
      subtitleAr: 'جرعة نشاط وإلهام',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
      categoryKey: 'حبوب القهوة المختصة',
    },
    {
      id: 'occ-cof-2',
      title: 'Office & Work',
      titleAr: 'بيئة العمل والتركيز',
      subtitle: 'Peak Performance',
      subtitleAr: 'إنتاجية بأعلى نكهة',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      categoryKey: 'أدوات التحضير المقطرة',
    },
    {
      id: 'occ-cof-3',
      title: 'Special Gatherings',
      titleAr: 'جمعات العائلة والأصدقاء',
      subtitle: 'Share the Warmth',
      subtitleAr: 'ضيافة تليق بأحبابك',
      image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
      categoryKey: 'القهوة الباردة',
    },
    {
      id: 'occ-cof-4',
      title: 'Home Barista Corner',
      titleAr: 'ركن الباريستا المنزلي',
      subtitle: 'Craft Your Cup',
      subtitleAr: 'احتراف التحضير بالمنزل',
      image: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=800&q=80',
      categoryKey: 'معدات الإسبريسو',
    },
    {
      id: 'occ-cof-5',
      title: 'Roastery Gift Box',
      titleAr: 'بوكسات إهداء المحامص',
      subtitle: 'Curated Selections',
      subtitleAr: 'هدية تسعد عشاق القهوة',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
      categoryKey: 'حبوب القهوة المختصة',
    },
  ];

  const flowerWhyUs = [
    {
      id: 'w-1',
      icon: Sparkles,
      title: 'Premium Quality Flowers',
      titleAr: 'زهور فائقة الجودة',
      desc: 'Fresh & handcrafted',
      descAr: 'طازجة ومنسقة بعناية فائقة',
    },
    {
      id: 'w-2',
      icon: Truck,
      title: 'Fast & Reliable Delivery',
      titleAr: 'توصيل سريع وموثوق',
      desc: 'Same-day delivery in Riyadh & Mecca',
      descAr: 'توصيل مبرد في نفس اليوم',
    },
    {
      id: 'w-3',
      icon: ShieldCheck,
      title: 'Secure Payment Options',
      titleAr: 'خيارات دفع آمنة',
      desc: '100% safe & secure',
      descAr: 'مدى، أبل باي، تمارا وتابي 100%',
    },
    {
      id: 'w-4',
      icon: Headphones,
      title: 'Dedicated Customer Support',
      titleAr: 'دعم عملاء مخصص',
      desc: 'We are here to help',
      descAr: 'فريق عمل متواجد لخدمتكم دائماً',
    },
  ];

  const coffeeWhyUs = [
    {
      id: 'w-cof-1',
      icon: Award,
      title: 'Specialty Grade 84+ Beans',
      titleAr: 'حبوب بن مختصة 84+ نقطة',
      desc: 'Direct trade & fresh roast',
      descAr: 'محاصيل تجارة مباشرة وتحميص طازج أسبوعياً',
    },
    {
      id: 'w-cof-2',
      icon: Truck,
      title: 'Fast & Sealed Delivery',
      titleAr: 'شحن سريع بصمام حماية النكهة',
      desc: 'Degas valve packaging',
      descAr: 'تغليف احترافي يحفظ نقاء الزيوت العطرية',
    },
    {
      id: 'w-cof-3',
      icon: ShieldCheck,
      title: 'Secure Payment Options',
      titleAr: 'خيارات دفع وتقسيط آمنة',
      desc: 'Apple Pay, Mada, Tabby, Tamara',
      descAr: 'مدى، أبل باي، تمارا وتابي بدون فوائد',
    },
    {
      id: 'w-cof-4',
      icon: Coffee,
      title: 'Certified Barista Support',
      titleAr: 'استشارات باريستا معتمدة',
      desc: 'Brewing recipes & recipes guidance',
      descAr: 'وصفات استخلاص ودعم فني لدرجات الطحن',
    },
  ];

  const occasions = useMemo(() => (isCoffee ? coffeeOccasions : flowerOccasions), [isCoffee]);
  const whyChooseUs = useMemo(() => (isCoffee ? coffeeWhyUs : flowerWhyUs), [isCoffee]);

  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* Left Column: Shop by Occasion (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#ece7de]">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
              {isAr
                ? s.titleAr || (isCoffee ? 'تسوق حسب طريقة التحضير' : isCarStore ? 'تسوق حسب نوع سيارتك' : 'تسوق حسب المناسبة')
                : s.titleEn || (isCoffee ? 'Shop By Brew Method' : isCarStore ? 'Shop By Vehicle Type' : 'Shop by Occasion')}
            </h2>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setCurrentPage('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#102a1c] hover:text-[#b8860b] transition-colors cursor-pointer group"
            >
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              {isAr ? (
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
            {occasions.map((occ) => (
              <div
                key={occ.id}
                onClick={() => navigateToCategory(occ.categoryKey)}
                className="group flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-[#eee8df] hover:border-[#102a1c] shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                {/* Circular image avatar */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden mb-2.5 border-2 border-[#e8e4dc] group-hover:border-[#102a1c] group-hover:scale-108 transition-all">
                  <img
                    src={occ.image}
                    alt={isAr ? occ.titleAr : occ.title}
                    className="w-full h-full object-cover"
                    loading="lazy" decoding="async"
                  />
                </div>

                <span className="text-xs sm:text-sm font-bold text-[#1b251e] group-hover:text-[#102a1c] line-clamp-1">
                  {isAr ? occ.titleAr : occ.title}
                </span>

                <span className="text-[10px] sm:text-[11px] text-[#8c8275] mt-0.5 line-clamp-1 flex items-center gap-0.5">
                  <span>{isAr ? occ.subtitleAr : occ.subtitle}</span>
                  <span className="text-[9px] group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform">
                    {isAr ? '←' : '→'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Why Choose Us (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-[#eee8df] shadow-xs space-y-5">
          <div className="pb-3 border-b border-[#ece7de]">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
              {isAr ? s.whyUsTitleAr || 'لماذا تختارنا' : s.whyUsTitleEn || 'Why Choose Us'}
            </h2>
          </div>

          <div className="space-y-4">
            {whyChooseUs.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.id} className="flex items-start gap-3.5 group">
                  <div className="w-10 h-10 rounded-xl bg-[#f4f1eb] text-[#102a1c] group-hover:bg-[#102a1c] group-hover:text-[#f3e5c8] flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#1b251e]">
                      {isAr ? feat.titleAr : feat.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#70685c] mt-0.5">
                      {isAr ? feat.descAr : feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

