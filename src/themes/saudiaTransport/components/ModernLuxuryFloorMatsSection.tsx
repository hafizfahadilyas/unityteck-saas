import React from 'react';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  SlidersHorizontal
} from 'lucide-react';
import { Product } from '../../../types';
import { AlsaeediProductGridSkeleton } from './AlsaeediSkeletons';
import { AlsaeediInfiniteCarousel } from './AlsaeediInfiniteCarousel';

interface ModernLuxuryFloorMatsSectionProps {
  isAr?: boolean;
  mats: Product[];
  loading?: boolean;
  onSelectMat: (mat: Product) => void;
  onOpenWhatsApp: (mat: Product, selectedColorName?: string) => void;
  onViewAll: () => void;
  onAddToCart?: (mat: any, ...args: any[]) => void;
}

// WhatsApp Glyph Icon
function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const ModernLuxuryFloorMatsSectionComponent: React.FC<ModernLuxuryFloorMatsSectionProps> = ({
  isAr = true,
  mats,
  loading = false,
  onSelectMat,
  onOpenWhatsApp,
  onViewAll,
}) => {
  return (
    <section id="floor-mats-section" className="alsaeedi-section-soft alsaeedi-reveal space-y-5 p-3 sm:p-5">
      {/* ========================================================
          CLEAN LUXURY HEADER
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3.5">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#faede4] text-[#915f3c]">
              <Sparkles className="w-5 h-5 text-[#915f3c]" />
            </span>
            <span>{isAr ? 'أرضيات 5D' : '5D Floor Mats'}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'عازلة للسوائل · تفصيل ليزري · ضمان سنتين.'
              : 'Waterproof · laser-cut fit · 2-year warranty.'}
          </p>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-bold text-slate-900 hover:text-[#915f3c] transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto py-1"
        >
          <span>{isAr ? 'عرض كافة الأرضيات' : 'View all mats'}</span>
          {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ========================================================
          DARK LUXURY ROYAL CARDS (HIGH-CONTRAST 100% READABLE TEXT)
          ======================================================== */}
      {loading ? (
        <AlsaeediProductGridSkeleton count={4} />
      ) : mats.length === 0 ? (
        <div className="text-center py-10 alsaeedi-card rounded-2xl text-xs text-slate-600 font-bold">
          {isAr ? 'لا توجد أرضيات حالياً' : 'No floor mats yet'}
        </div>
      ) : (
      <AlsaeediInfiniteCarousel isAr={isAr} autoMs={4800} className="alsaeedi-stagger px-1">
        {mats.slice(0, 300).map((mat) => {
          return (
            <div 
              key={mat.id}
              className="group relative alsaeedi-card alsaeedi-anim-lift flex h-full flex-col justify-between overflow-hidden rounded-2xl p-3 sm:rounded-3xl sm:p-4 bg-white"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#faede4]/30 group-hover:bg-[#faede4]/50 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />

              <div className="relative z-10">
                <div 
                  className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#faf7f4] cursor-pointer group shadow-2xs"
                  onClick={() => onSelectMat(mat)}
                >
                  <img 
                    src={mat.image} 
                    alt={mat.name} 
                    className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-500 ease-out" 
                    loading="lazy"
                    decoding="async"
                  />

                  <span className="absolute top-2.5 right-2.5 bg-white/95 text-[#915f3c] text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 backdrop-blur-xs">
                    <Sparkles className="w-2.5 h-2.5 text-[#915f3c]" />
                    <span>5D OEM</span>
                  </span>

                  <span className="absolute top-2.5 left-2.5 bg-emerald-600/90 text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    {isAr ? 'أصلي' : 'OEM'}
                  </span>

                  <div className="absolute inset-0 bg-slate-950/35 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center p-3">
                    <span className="bg-[#915f3c] text-white px-3.5 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-lg">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                      <span>{isAr ? 'تخصيص' : 'Customize'}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <h4 
                    onClick={() => onSelectMat(mat)}
                    className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-[#915f3c] transition-colors cursor-pointer line-clamp-1"
                    title={isAr ? mat.nameAr : mat.nameEn}
                  >
                    {isAr ? mat.nameAr : mat.nameEn}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="line-clamp-1">
                      {isAr ? 'جلد بيئي صديق للبيئة' : 'Eco-friendly synthetic leather'}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                    {isAr ? '12 خيار تطريز · 5 طبقات عزل' : '12 Stitching colors · 5 Layers'}
                  </p>
                </div>
              </div>

              <div className="relative z-10 mt-2 flex items-center justify-between gap-1.5 pt-2.5 sm:pt-3">
                <div className="min-w-0">
                  <div className="flex items-baseline">
                    <span className="text-sm font-black text-slate-900 sm:text-base">{mat.price}</span>
                    <span className="mx-1 text-[10px] font-black text-[#915f3c] sm:text-[11px]">{'⃁'}</span>
                  </div>
                  {mat.originalPrice && mat.originalPrice > mat.price && (
                    <span className="block text-[10px] font-medium text-slate-400 line-through">
                      {mat.originalPrice} {'⃁'}
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectMat(mat)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-2xl px-3 py-1.5 text-[10px] font-black shadow-xs transition-transform active:scale-95 bg-[#915f3c] hover:bg-[#7e5233] text-white sm:px-3.5 sm:text-xs"
                  >
                    <Sparkles className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5 text-white" aria-hidden="true" />
                    <span className="whitespace-nowrap">{isAr ? 'تخصيص' : 'Customize'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp(mat)}
                    className="cursor-pointer rounded-lg bg-emerald-600 p-1.5 text-white shadow-xs transition-colors hover:bg-emerald-500 sm:rounded-xl"
                    title={isAr ? 'طلب واستفسار عبر واتساب' : 'WhatsApp'}
                    aria-label={isAr ? 'واتساب' : 'WhatsApp'}
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </AlsaeediInfiniteCarousel>
      )}
    </section>
  );
};

export const ModernLuxuryFloorMatsSection = React.memo(ModernLuxuryFloorMatsSectionComponent);
