import React from 'react';
import { 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  Sparkles
} from 'lucide-react';

interface CoreTwoCategoriesSectionProps {
  isAr?: boolean;
  onSelectCategory: (categoryId: 'cat-clothing' | 'cat-floors') => void;
  activeCategoryId?: string | null;
}

const CoreTwoCategoriesSectionComponent: React.FC<CoreTwoCategoriesSectionProps> = ({
  isAr = true,
  onSelectCategory,
  activeCategoryId,
}) => {
  return (
    <section id="core-categories-section" className="space-y-5">
      {/* Minimal Luxury Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#16032e] text-[#f6c344] shadow-sm">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {isAr ? 'ترقية المقصورة الملكية' : 'Luxury Cabin Upgrades'}
            </h3>
          </div>
        </div>

        <span className="text-[11px] font-bold text-[#b07e16] bg-amber-50/90 px-3 py-1 rounded-full border border-amber-200/80">
          {isAr ? 'تفصيل ليزر 100%' : '100% Laser Fit'}
        </span>
      </div>

      {/* 2 Modern Visual-First Luxury Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* CARD 1: VIP BESPOKE SEAT COVERS */}
        <div 
          onClick={() => onSelectCategory('cat-clothing')}
          className={`group relative h-[320px] sm:h-[360px] overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 shadow-md hover:shadow-2xl ${
            activeCategoryId === 'cat-clothing' 
              ? 'ring-4 ring-[#d5a027]' 
              : 'ring-1 ring-slate-900/10 hover:ring-[#d5a027]/60'
          }`}
        >
          {/* Full-Bleed Luxury Image */}
          <img 
            src="/images/categories/vip-luxury-seat-covers.jpg" 
            alt={isAr ? "تلابيس مقاعد ملكية" : "VIP Bespoke Seat Covers"} 
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" 
            loading="lazy"
            decoding="async"
          />

          {/* Cinematic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d021c] via-[#0d021c]/45 to-black/10 group-hover:via-[#0d021c]/35 transition-colors duration-500" />

          {/* Top Floating Badges */}
          <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between">
            <span className="bg-black/45 backdrop-blur-md text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full border border-white/15">
              {isAr ? 'جلد نابا ألماني' : 'German Nappa'}
            </span>
            <span className="bg-[#f6c344] text-[#16032e] text-[11px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>{isAr ? 'الأكثر مبيعاً' : 'Best Seller'}</span>
            </span>
          </div>

          {/* Bottom Minimal Luxury Bar */}
          <div className="absolute bottom-0 inset-x-0 z-20 p-5 sm:p-6 flex flex-col justify-end space-y-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-white/85">
                <span className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs">
                  {isAr ? 'ضمان سنتين' : '2-Yr Warranty'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs">
                  {isAr ? '108+ موديل' : '108+ Models'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs">
                  {isAr ? '6 ألوان وكالة' : '6 OEM Colors'}
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isAr ? 'تلابيس مقاعد VIP ملكية' : 'VIP Bespoke Seat Covers'}
              </h4>
            </div>

            <div className="pt-3 border-t border-white/15 flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-white/60">{isAr ? 'من' : 'From'}</span>
                <span className="text-xl sm:text-2xl font-black text-[#f6c344]">390</span>
                <span className="text-xs font-bold text-white/80">{isAr ? 'ر.س' : 'SAR'}</span>
              </div>

              <div className="px-4 py-2 bg-white text-[#16032e] group-hover:bg-[#f6c344] font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg transition-all duration-300">
                <span>{isAr ? 'تصفح الآن' : 'Shop Covers'}</span>
                {isAr ? (
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                ) : (
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: 5D LASER & DIAMOND ARMOR MATS */}
        <div 
          onClick={() => onSelectCategory('cat-floors')}
          className={`group relative h-[320px] sm:h-[360px] overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 shadow-md hover:shadow-2xl ${
            activeCategoryId === 'cat-floors' 
              ? 'ring-4 ring-[#d5a027]' 
              : 'ring-1 ring-slate-900/10 hover:ring-[#d5a027]/60'
          }`}
        >
          {/* Full-Bleed Luxury Image */}
          <img 
            src="/images/categories/vip-5d-laser-mats.jpg" 
            alt={isAr ? "أرضيات 5D ليزر دايموند" : "5D Laser & Diamond Mats"} 
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" 
            loading="lazy"
            decoding="async"
          />

          {/* Cinematic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d021c] via-[#0d021c]/45 to-black/10 group-hover:via-[#0d021c]/35 transition-colors duration-500" />

          {/* Top Floating Badges */}
          <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between">
            <span className="bg-black/45 backdrop-blur-md text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full border border-white/15">
              {isAr ? '5 طبقات عزل' : '5-Layer Armor'}
            </span>
            <span className="bg-emerald-500 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'حماية 100%' : '100% Waterproof'}</span>
            </span>
          </div>

          {/* Bottom Minimal Luxury Bar */}
          <div className="absolute bottom-0 inset-x-0 z-20 p-5 sm:p-6 flex flex-col justify-end space-y-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-white/85">
                <span className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs">
                  {isAr ? 'ضد الماء والأتربة' : 'Spill & Dust Proof'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs">
                  {isAr ? 'تثبيت آمن' : 'Anti-Slip Lock'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs">
                  {isAr ? '12 لون تطريز' : '12 Colors'}
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isAr ? 'أرضيات 5D ليزر ودايموند' : '5D Laser & Diamond Mats'}
              </h4>
            </div>

            <div className="pt-3 border-t border-white/15 flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-white/60">{isAr ? 'من' : 'From'}</span>
                <span className="text-xl sm:text-2xl font-black text-[#f6c344]">290</span>
                <span className="text-xs font-bold text-white/80">{isAr ? 'ر.س' : 'SAR'}</span>
              </div>

              <div className="px-4 py-2 bg-[#f6c344] text-[#16032e] group-hover:bg-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg transition-all duration-300">
                <span>{isAr ? 'تصفح الأرضيات' : 'Explore Mats'}</span>
                {isAr ? (
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                ) : (
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export const CoreTwoCategoriesSection = React.memo(CoreTwoCategoriesSectionComponent);
