import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Star, Sparkles, CheckCircle2 } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [activeCard, setActiveCard] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const testimonials = [
    {
      id: 'test-1',
      name: 'د. سارة الغامدي',
      nameEn: 'Dr. Sarah Al-Ghamdi',
      role: 'مكة المكرمة · حي الشوقية',
      roleEn: 'Mecca • Al-Shawqiyyah',
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
      roleEn: 'Mecca • Al-Awali VIP',
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
      roleEn: 'Mecca • Al-Aziziyah',
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
      roleEn: 'Mecca • Batha Quraish',
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
      roleEn: 'Mecca • Al-Nuzha',
      avatar: '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg',
      rating: 5,
      comment: 'سرعة الإنجاز والتعامل الراقي وباقة الورد ملأت المكان بعطرها الفواح. معتمدكم في كل مناسباتي القادمة بإذن الله.',
      commentEn: 'Swift execution, courteous service, and the flowers filled the entire room with alluring fragrance. My go-to store for all Mecca occasions.',
    },
  ];

  const total = testimonials.length;

  const next = useCallback(() => {
    setActiveCard((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setActiveCard((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  // Subtle auto-advance
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(next, 7000);
    return () => clearInterval(interval);
  }, [isPaused, next]);

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden select-none"
    >
      {/* ── 1. Title Header matching uniform site-wide serif typography & layout ── */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#ece7de]">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
            {isAr ? 'قصص تستحق أن تُروى' : 'Stories Worth Telling'}
          </h2>
          <p className="text-xs sm:text-sm text-[#7a7164] mt-1 font-light">
            {isAr
              ? 'آراء عملائنا الكرام الذين عاشوا تجربة هدايا مكة الاستثنائية'
              : 'Reflections from clients who experienced fine floristry with Hadaya Mecca'}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-[#fef8ea] border border-[#e8d5a7] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#8c672b] shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>{isAr ? 'آراء العملاء' : 'Testimonials'}</span>
        </div>
      </div>

      {/* ── 2. 3D Stacked Deck Carousel with Perfectly Centered Prev/Next Arrows ── */}
      <div className="max-w-4xl mx-auto relative px-1 sm:px-4">
        <div className="flex items-center justify-between gap-3 sm:gap-6 w-full relative">
          
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={isAr ? next : prev}
            aria-label="Previous testimonial"
            className="w-11 h-11 rounded-full bg-[#0d2a1d] hover:bg-[#163f2d] border border-white/10 hover:border-[#d4af37]/60 text-white hover:text-[#d4af37] flex items-center justify-center transition-all duration-300 shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-30 shrink-0"
          >
            {isAr ? <ChevronRight className="w-5 h-5 stroke-[2.2]" /> : <ChevronLeft className="w-5 h-5 stroke-[2.2]" />}
          </button>

          {/* 3D Stacked Stage */}
          <div className="flex-1 relative min-h-[340px] sm:min-h-[260px] md:min-h-[240px] pt-12 sm:pt-14 pb-2">
            
            {/* Background Layered Silhouettes (Cards 3, 2, 1 stacked neatly upward behind) */}
            <div
              aria-hidden="true"
              style={{
                transform: 'translateY(-34px) scale(0.88)',
                transformOrigin: 'center top',
              }}
              className="absolute inset-x-0 top-12 bottom-2 rounded-[28px] sm:rounded-[32px] bg-[#0c281e]/40 border border-white/5 shadow-md pointer-events-none transition-all duration-500"
            />
            <div
              aria-hidden="true"
              style={{
                transform: 'translateY(-22px) scale(0.93)',
                transformOrigin: 'center top',
              }}
              className="absolute inset-x-0 top-12 bottom-2 rounded-[28px] sm:rounded-[32px] bg-[#0c281e]/60 border border-white/5 shadow-lg pointer-events-none transition-all duration-500"
            />
            <div
              aria-hidden="true"
              style={{
                transform: 'translateY(-11px) scale(0.97)',
                transformOrigin: 'center top',
              }}
              className="absolute inset-x-0 top-12 bottom-2 rounded-[28px] sm:rounded-[32px] bg-[#0c281e]/80 border border-white/10 shadow-xl pointer-events-none transition-all duration-500"
            />

            {/* Active Front Card */}
            {testimonials.map((t, index) => {
              const isActive = index === activeCard;
              if (!isActive) return null;

              return (
                <div
                  key={t.id}
                  className="relative z-20 w-full animate-in fade-in duration-400"
                >
                  <div className="w-full rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 md:p-9 border border-white/10 bg-gradient-to-br from-[#0e2c20] via-[#0b261b] to-[#071810] text-white shadow-2xl relative overflow-hidden">
                    {/* Top Golden Hairline Ambient Glow */}
                    <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent" />

                    <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] items-center gap-6 md:gap-8">
                      {/* Left: Avatar, Name, Verified Badge, Location */}
                      <div className="flex flex-col items-center md:items-start text-center md:text-start md:border-r rtl:md:border-r-0 rtl:md:border-l border-white/10 md:pr-6 rtl:md:pr-0 rtl:md:pl-6 shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-[#d4af37]/40 shadow-lg bg-[#143224] shrink-0 p-0.5">
                          <img
                            src={t.avatar}
                            alt={isAr ? t.name : t.nameEn}
                            className="w-full h-full object-cover rounded-xl"
                            loading="lazy"
                          />
                        </div>

                        <div className="mt-3.5 space-y-0.5">
                          <div className="flex items-center justify-center md:justify-start gap-1.5">
                            <h4 className="text-base sm:text-lg font-bold text-white font-serif tracking-wide">
                              {isAr ? t.name : t.nameEn}
                            </h4>
                            <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 fill-[#d4af37]/20" />
                          </div>
                          <p className="text-xs text-[#cca65b] font-medium font-sans">
                            {isAr ? t.role : t.roleEn}
                          </p>
                        </div>
                      </div>

                      {/* Right: 5 Stars Rating & Customer Review Quote */}
                      <div className="space-y-3.5 text-center md:text-start">
                        {/* 5 Stars Rating */}
                        <div className="flex items-center justify-center md:justify-start gap-1.5 text-[#e5b84c]">
                          {[...Array(t.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-5 h-5 fill-[#e5b84c] text-[#e5b84c]"
                            />
                          ))}
                        </div>

                        {/* Customer Review Quote in Italic */}
                        <p className="text-sm sm:text-base md:text-[17px] text-[#d6ded7] font-light leading-relaxed italic">
                          "{isAr ? t.comment : t.commentEn}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={isAr ? prev : next}
            aria-label="Next testimonial"
            className="w-11 h-11 rounded-full bg-[#0d2a1d] hover:bg-[#163f2d] border border-white/10 hover:border-[#d4af37]/60 text-white hover:text-[#d4af37] flex items-center justify-center transition-all duration-300 shadow-xl hover:scale-105 active:scale-95 cursor-pointer z-30 shrink-0"
          >
            {isAr ? <ChevronLeft className="w-5 h-5 stroke-[2.2]" /> : <ChevronRight className="w-5 h-5 stroke-[2.2]" />}
          </button>
        </div>

        {/* Dots Pagination Indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveCard(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeCard
                  ? 'w-6 bg-[#0d2f24]'
                  : 'w-1.5 bg-[#0d2f24]/25 hover:bg-[#0d2f24]/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
