import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Star, Sparkles, CheckCircle } from 'lucide-react';
import { TESTIMONIALS } from '../data/mockData';

export const TestimonialsSection: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [activeCard, setActiveCard] = useState(0);

  const testimonials = [
    {
      id: 'test-1',
      name: 'د. سارة الغامدي',
      nameEn: 'Dr. Sarah Al-Ghamdi',
      role: 'مكة المكرمة · حي الشوقية',
      roleEn: 'Mecca · Al-Shawqiyyah',
      avatar: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
      rating: 5,
      comment: 'ما شاء الله تبارك الرحمن، تنسيق باقة الورد فاق التوقعات بكثير! الورد طبيعي جداً وفريش والتغليف فاخر يليق بأرقى المناسبات، والتوصيل خلال 45 دقيقة فقط.',
      commentEn: 'Exceeded all expectations! The roses were remarkably fresh and the packaging is worthy of the finest VIP celebrations, delivered in under 45 minutes.',
    },
    {
      id: 'test-2',
      name: 'م. عبدالرحمن الحربي',
      nameEn: 'Eng. Abdulrahman Al-Harbi',
      role: 'مكة المكرمة · حي العوالي',
      roleEn: 'Mecca · Al-Awali VIP',
      avatar: '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
      rating: 5,
      comment: 'طلبت بوكس الجوري وشوكولاتة باتشي، الصراحة فخامة لا توصف والاهتمام بأدق التفاصيل والكرت المكتوب بخط اليد مع ختم الشمع الملكي كان لمسة إبداعية.',
      commentEn: 'Ordered the roses & Patchi chocolate chest. Unmatched elegance, bespoke attention to detail, and the wax-sealed calligraphy card was breathtaking.',
    },
    {
      id: 'test-3',
      name: 'أ/ فيصل السلمي',
      nameEn: 'Faisal Al-Sulami',
      role: 'مكة المكرمة · العزيزية',
      roleEn: 'Mecca · Al-Aziziyah',
      avatar: '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg',
      rating: 5,
      comment: 'خدمة أكثر من رائعة وتجاوب فوري عبر الواتساب. الأفضل في مكة بلا منازع، الفازة الكريستالية كانت تحفة فنية أبهرت كل الضيوف في المجلس.',
      commentEn: 'Prompt WhatsApp concierge assistance and unmatched floristry quality. The crystal vase became the highlight of our reception salon.',
    },
    {
      id: 'test-4',
      name: 'نورة الهذلي',
      nameEn: 'Noura Al-Hothali',
      role: 'مكة المكرمة · بطحاء قريش',
      roleEn: 'Mecca · Batha Quraish',
      avatar: '/src/assets/images/hadaya_white_orchid_penthouse_1791218732789.jpg',
      rating: 5,
      comment: 'تنسيق باقة العروس مع اللؤلؤ كان حلم وتحقق، الله يعطيكم العافية على الدقة والاحترافية وسرعة التوصيل المبرد اللي حافظت على نضارة كل وردة.',
      commentEn: 'The bridal bouquet with pearls was a dream come true. Immense gratitude for the chilled express delivery that kept every single petal fresh.',
    },
    {
      id: 'test-5',
      name: 'سعيد الزهراني',
      nameEn: 'Saeed Al-Zahrani',
      role: 'مكة المكرمة · حي النزهة',
      roleEn: 'Mecca · Al-Nuzha',
      avatar: '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg',
      rating: 5,
      comment: 'سرعة الإنجاز والتعامل الراقي وباقة الورد ملأت المكان بعطرها الفواح. معتمدكم في كل مناسباتي القادمة بإذن الله.',
      commentEn: 'Swift execution, courteous service, and the flowers filled the entire room with alluring fragrance. My go-to store for all Mecca occasions.',
    },
  ];

  const total = testimonials.length;

  const next = () => {
    setActiveCard((prev) => (prev + 1) % total);
  };

  const prev = () => {
    setActiveCard((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden select-none">
      {/* Title Header */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 bg-[#d4af37]/20 border border-[#d4af37]/45 px-3.5 py-1 rounded-full text-xs font-semibold text-[#8b5e1b] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>{isAr ? 'تجارب عملاء هدايا مكة' : 'Client Testimonials'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#102a1c] font-serif">
          {isAr ? 'تجارب تستحق أن تُروى' : 'Stories Worth Telling'}
        </h2>
        <p className="text-xs sm:text-sm text-[#7d7568] mt-2 max-w-lg mx-auto">
          {isAr
            ? 'آراء عملائنا الكرام الذين عاشوا تجربة هدايا مكة الاستثنائية وشاركوا لحظاتهم السعيدة'
            : 'Reflections from clients who experienced fine floristry and express gifting with Hadaya Mecca'}
        </p>
      </div>

      {/* Card Deck Carousel Stage (Framer Card Deck Exact Replica) */}
      <div className="max-w-4xl mx-auto relative px-2 sm:px-4">
        <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3 sm:gap-6 w-full">
          {/* Previous Button */}
          <button
            type="button"
            onClick={isAr ? next : prev}
            aria-label="Previous card"
            className="w-10 h-10 rounded-2xl border border-[#d4af37]/40 bg-[#102a1c] hover:bg-[#1a422c] text-[#f3e5ab] flex items-center justify-center transition-all duration-300 shadow-md hover:scale-105 active:scale-95 cursor-pointer z-20 shrink-0"
          >
            {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          {/* Stacked 3D Card Deck Grid */}
          <div
            role="group"
            aria-roledescription="card deck carousel"
            className="w-full relative min-h-[360px] sm:min-h-[300px] md:min-h-[280px] pt-12 sm:pt-16 pb-2"
          >
            {testimonials.map((t, index) => {
              // Calculate relative stack offset
              let rel = (index - activeCard + total) % total;
              const isFront = rel === 0;

              // Stack offsets up to 4 cards behind
              const translateY = isFront ? 0 : -rel * (window.innerWidth < 640 ? 16 : 22);
              const scaleX = isFront ? 1 : Math.max(0.8, 1 - rel * 0.05);
              const opacity = isFront ? 1 : Math.max(0.2, 1 - rel * 0.2);
              const zIndex = total - rel;

              if (rel > 4) return null;

              return (
                <div
                  key={t.id}
                  aria-hidden={!isFront}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex,
                    opacity,
                    transform: `translateY(${translateY}px) scale(${scaleX})`,
                    transformOrigin: 'center top',
                    transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease',
                    pointerEvents: isFront ? 'auto' : 'none',
                  }}
                  className="w-full flex flex-col"
                >
                  {/* Card Container with Radial Gradient & Golden Edge Glow */}
                  <div className="w-full rounded-3xl p-5 sm:p-7 md:p-8 border border-white/10 bg-gradient-to-br from-[#102a1c] via-[#0d2217] to-[#07130c] text-white shadow-2xl flex flex-col md:flex-row items-center gap-5 sm:gap-7 relative overflow-hidden">
                    {/* Subtle Golden Ambient Edge Glow */}
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />

                    {/* Left Side: Avatar & Customer Info */}
                    <div className="w-full md:w-56 shrink-0 flex items-center md:flex-col md:text-center gap-4 border-b md:border-b-0 md:border-r rtl:md:border-r-0 rtl:md:border-l border-white/10 pb-4 md:pb-0 md:pr-6 rtl:md:pr-0 rtl:md:pl-6">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-[#d4af37]/50 shadow-md">
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 md:justify-center">
                          <h4 className="text-sm sm:text-base font-bold text-white font-serif">
                            {isAr ? t.name : t.nameEn}
                          </h4>
                          <CheckCircle className="w-4 h-4 text-[#d4af37] shrink-0" />
                        </div>
                        <p className="text-[11px] sm:text-xs text-[#d4af37] font-medium font-mono">
                          {isAr ? t.role : t.roleEn}
                        </p>
                      </div>
                    </div>

                    {/* Right Side: 5 Stars Rating & Customer Review Quote */}
                    <div className="flex-1 space-y-3 sm:space-y-4">
                      {/* 5 Stars Rating */}
                      <div className="flex items-center gap-1 text-[#d4af37]">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-[#d4af37]" />
                        ))}
                      </div>

                      {/* Review Quote Text */}
                      <p className="text-xs sm:text-sm md:text-base text-[#e5dfd3] font-light leading-relaxed italic">
                        "{isAr ? t.comment : t.commentEn}"
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={isAr ? prev : next}
            aria-label="Next card"
            className="w-10 h-10 rounded-2xl border border-[#d4af37]/40 bg-[#102a1c] hover:bg-[#1a422c] text-[#f3e5ab] flex items-center justify-center transition-all duration-300 shadow-md hover:scale-105 active:scale-95 cursor-pointer z-20 shrink-0"
          >
            {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Slide Counter Indicator */}
        <div className="flex items-center justify-center gap-2 mt-6 font-mono text-xs text-[#102a1c]/70 font-semibold">
          <span>0{activeCard + 1}</span>
          <span>/</span>
          <span>0{total}</span>
        </div>
      </div>
    </section>
  );
};
