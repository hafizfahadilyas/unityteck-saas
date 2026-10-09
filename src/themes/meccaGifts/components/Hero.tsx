import React from 'react';
import { useApp } from '../context/AppContext';
import { HERO_BANNER_IMAGE } from '../data/mockData';
import { ArrowLeft, ArrowRight, Sparkles, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';

export const Hero: React.FC = () => {
  const { language, setCurrentPage, setSelectedCategory } = useApp();
  const isAr = language === 'ar';

  return (
    <section className="relative w-full overflow-hidden bg-[#131b15]">
      {/* Hero Banner Container */}
      <div className="relative min-h-[520px] md:min-h-[600px] lg:min-h-[660px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={HERO_BANNER_IMAGE}
            alt="Luxury Hadaya Flowers and Penthouse"
            className="w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.05]"
            referrerPolicy="no-referrer"
          />
          {/* Gradients for pristine contrast and luxury atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent rtl:bg-gradient-to-l rtl:from-black/80 rtl:via-black/50 rtl:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#102a1c]/60 via-transparent to-black/25" />
        </div>

        {/* Content Box */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
          <div className="max-w-2xl text-white space-y-6">
            
            {/* Tagline kicker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#e6ca98] text-xs font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'متجر الهدايا والزهور الأول في مكة المكرمة' : 'The Premier Luxury Florist in Mecca'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.2] font-serif text-[#faf7f2]">
              {isAr ? 'هدايا تليق بلحظاتك الاستثنائية' : 'Gifts Worthy of Your Exceptional Moments'}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#ded9cd] leading-relaxed max-w-xl font-light">
              {isAr
                ? 'زهور وهدايا فاخرة مختارة بعناية لتصنع لحظة لا تُنسى بأناقة تفيض فخامة وإتقان.'
                : 'Curated premium fresh blooms and timeless gifts designed to commemorate life’s most precious occasions.'}
            </p>

            {/* Call to action buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setCurrentPage('catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-7 py-3.5 rounded-full bg-[#FAF9F5] text-[#102a1c] font-bold text-sm hover:bg-[#e6ca98] transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span>{isAr ? 'تسوق الآن' : 'Shop Now'}</span>
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  setSelectedCategory('باقات فاخرة');
                  setCurrentPage('catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-7 py-3.5 rounded-full bg-black/35 hover:bg-black/55 text-white font-medium text-sm backdrop-blur-md border border-white/30 hover:border-white/60 transition-all duration-200"
              >
                {isAr ? 'اكتشف المجموعة' : 'Explore Collection'}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Trust Badges Strip (Adjacent to hero) */}
      <div className="bg-[#0b1f14] border-t border-[#1e3c2b] text-[#d4c8b2] py-4 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-start">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Clock className="w-5 h-5 text-[#e6ca98] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#f5f1e8]">{isAr ? 'توصيل فوري خلال 60 دقيقة' : 'Instant 60-Min Delivery'}</p>
              <p className="text-[11px] text-[#99a69d]">{isAr ? 'خدمة سريعة في كافة أحياء مكة' : 'All districts across Mecca'}</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <Sparkles className="w-5 h-5 text-[#e6ca98] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#f5f1e8]">{isAr ? 'زهور مستوردة طازجة 100%' : '100% Fresh Blooms'}</p>
              <p className="text-[11px] text-[#99a69d]">{isAr ? 'من مزارع هولندا والإكوادور' : 'Dutch & Ecuadorian farms'}</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <HeartHandshake className="w-5 h-5 text-[#e6ca98] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#f5f1e8]">{isAr ? 'سرية وخصوصية تامة' : 'Private & Anonymous'}</p>
              <p className="text-[11px] text-[#99a69d]">{isAr ? 'خيار إهداء بدون كشف الهوية' : 'Secret sender option'}</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#e6ca98] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#f5f1e8]">{isAr ? 'ضمان النضارة والجودة' : 'Guaranteed Freshness'}</p>
              <p className="text-[11px] text-[#99a69d]">{isAr ? 'نضمن وصولها بأبهى حلة' : 'Arrives in pristine beauty'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
