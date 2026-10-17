import React, { useState } from 'react';
import { 
  Car, 
  Layers, 
  Calendar, 
  Palette, 
  Search, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  RotateCcw,
  SlidersHorizontal,
  Flame,
  ChevronDown
} from 'lucide-react';
import { 
  CarBrandItem, 
  SeatColorOption, 
  CAR_BRANDS, 
  SEAT_COLORS, 
  CAR_MODELS_MAP 
} from '../../../data/blecoStoreData';

interface LuxuryVehicleCockpitProps {
  isAr?: boolean;
  formMake: string;
  setFormMake: (val: string) => void;
  formModel: string;
  setFormModel: (val: string) => void;
  formYear: string;
  setFormYear: (val: string) => void;
  formColor: string;
  setFormColor: (val: string) => void;
  availableModels: { modelAr: string; modelEn: string }[];
  availableYears: string[];
  onSubmit: (e?: React.FormEvent) => void;
  onReset: () => void;
  onQuickVehicleSelect?: (make: string, model: string) => void;
  onPillClick?: (pillKey: string) => void;
}

// Popular car presets in Saudi Arabia
const POPULAR_SAUDI_CARS = [
  { makeId: 'toyota', makeEn: 'toyota', modelEn: 'Camry', nameAr: 'تويوتا كامري', nameEn: 'Toyota Camry' },
  { makeId: 'toyota', makeEn: 'toyota', modelEn: 'Land Cruiser', nameAr: 'لاند كروزر', nameEn: 'Land Cruiser' },
  { makeId: 'lexus', makeEn: 'lexus', modelEn: 'ES 350', nameAr: 'لكزس ES', nameEn: 'Lexus ES' },
  { makeId: 'hyundai', makeEn: 'hyundai', modelEn: 'Sonata', nameAr: 'هيونداي سوناتا', nameEn: 'Hyundai Sonata' },
  { makeId: 'chevrolet', makeEn: 'chevrolet', modelEn: 'Tahoe', nameAr: 'شفروليه تاهو', nameEn: 'Chevy Tahoe' },
  { makeId: 'nissan', makeEn: 'nissan', modelEn: 'Patrol', nameAr: 'نيسان باترول', nameEn: 'Nissan Patrol' },
  { makeId: 'ford', makeEn: 'ford', modelEn: 'Taurus', nameAr: 'فورد تورس', nameEn: 'Ford Taurus' },
  { makeId: 'gmc', makeEn: 'gmc', modelEn: 'Yukon', nameAr: 'جمس يوكن', nameEn: 'GMC Yukon' },
];

export const LuxuryVehicleCockpit: React.FC<LuxuryVehicleCockpitProps> = ({
  isAr = true,
  formMake,
  setFormMake,
  formModel,
  setFormModel,
  formYear,
  setFormYear,
  formColor,
  setFormColor,
  availableModels,
  availableYears,
  onSubmit,
  onReset,
  onQuickVehicleSelect,
  onPillClick,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Selected brand & color objects
  const selectedBrand = CAR_BRANDS.find(b => b.nameEn.toLowerCase() === formMake.toLowerCase() || b.id === formMake);
  const selectedColorObj = SEAT_COLORS.find(c => c.nameAr === formColor || c.nameEn.toLowerCase() === formColor.toLowerCase()) || SEAT_COLORS[1];

  const hasVehicleSelected = formMake !== 'all';
  const fullSelectedTitle = hasVehicleSelected
    ? `${selectedBrand ? (isAr ? selectedBrand.nameAr : selectedBrand.nameEn) : formMake.toUpperCase()} ${formModel !== 'all' ? formModel : ''} ${formYear !== 'all' ? formYear : ''}`.trim()
    : '';

  return (
    <div className="w-full space-y-4">
      {/* 1. LUXURY FEATURE HIGHLIGHTS PILLS (Refined & glowing VIP style) */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-bold text-white">
        {/* Pill 1: 100% OEM Fit */}
        <button
          type="button"
          onClick={() => onPillClick?.('oem')}
          onMouseEnter={() => setActiveTooltip('oem')}
          onMouseLeave={() => setActiveTooltip(null)}
          className="group relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-amber-400/30 hover:border-amber-400 shadow-[0_2px_12px_rgba(213,160,39,0.18)] transition-all duration-300 cursor-pointer backdrop-blur-md"
        >
          <Award className="w-3.5 h-3.5 text-[#f6c344] group-hover:scale-115 transition-transform" />
          <span className="tracking-wide text-amber-200 group-hover:text-amber-100 font-extrabold">
            {isAr ? 'مطابقة الوكالة 100%' : '100% OEM Fit'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#f6c344] animate-ping" />
        </button>

        {/* Pill 2: 2-Year VIP Warranty */}
        <button
          type="button"
          onClick={() => onPillClick?.('warranty')}
          onMouseEnter={() => setActiveTooltip('warranty')}
          onMouseLeave={() => setActiveTooltip(null)}
          className="group relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-emerald-400/30 hover:border-emerald-400 shadow-[0_2px_12px_rgba(16,185,129,0.18)] transition-all duration-300 cursor-pointer backdrop-blur-md"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-115 transition-transform" />
          <span className="tracking-wide text-emerald-200 group-hover:text-emerald-100 font-extrabold">
            {isAr ? 'ضمان ذهبي سنتين' : '2-Year VIP Warranty'}
          </span>
        </button>

        {/* Pill 3: All-Weather Defense */}
        <button
          type="button"
          onClick={() => onPillClick?.('weather')}
          onMouseEnter={() => setActiveTooltip('weather')}
          onMouseLeave={() => setActiveTooltip(null)}
          className="group relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-amber-400/30 hover:border-amber-400 shadow-[0_2px_12px_rgba(245,158,11,0.18)] transition-all duration-300 cursor-pointer backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:scale-115 transition-transform" />
          <span className="tracking-wide text-amber-200 group-hover:text-amber-100 font-extrabold">
            {isAr ? 'عازل للماء والحرارة 55°C' : 'All-Weather Defense 55°C'}
          </span>
        </button>

        {/* Pill 4: Free Makkah Fit */}
        <button
          type="button"
          onClick={() => onPillClick?.('makkah')}
          onMouseEnter={() => setActiveTooltip('makkah')}
          onMouseLeave={() => setActiveTooltip(null)}
          className="group relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-blue-400/30 hover:border-blue-400 shadow-[0_2px_12px_rgba(59,130,246,0.18)] transition-all duration-300 cursor-pointer backdrop-blur-md"
        >
          <MapPin className="w-3.5 h-3.5 text-blue-400 group-hover:scale-115 transition-transform" />
          <span className="tracking-wide text-blue-200 group-hover:text-blue-100 font-extrabold">
            {isAr ? 'تركيب مجاني بمكة' : 'Free Makkah Fit'}
          </span>
        </button>
      </div>

      {/* 2. INSTANT VEHICLE FILTER COCKPIT (Ultra-Luxury Redesign) */}
      <div 
        id="vehicle-filter-bar" 
        className="relative rounded-3xl bg-white/98 text-slate-900 max-w-5xl mx-auto p-4 sm:p-5 sm:px-6 shadow-[0_25px_60px_-15px_rgba(18,2,36,0.45)] border-2 border-[#d5a027]/40 ring-4 ring-[#d5a027]/10 transition-all duration-300"
      >
        {/* Cockpit Top Mini-Bar: Title & Radar Status */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100/90 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#16032e] text-[#f6c344] shadow-xs">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </span>
            <span className="font-black text-slate-900 text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
              <span>{isAr ? 'المحدد الذكي لموديلات السيارات' : 'VIP Smart Laser Vehicle Cockpit'}</span>
              <span className="hidden sm:inline-block text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                {isAr ? '✓ فحص فوري للمقاسات' : '✓ Instant Laser Scan'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isAr ? 'تغطية 108+ موديل سيارة' : '108+ Models Verified'}</span>
            </div>
            {(formMake !== 'all' || formModel !== 'all' || formYear !== 'all' || formColor !== 'all') && (
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#3e0f77] font-bold cursor-pointer transition-colors"
                title={isAr ? 'إعادة تعيين الفلتر' : 'Reset filter'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 5-Column Input Form */}
        <form onSubmit={onSubmit} className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5 items-end">
          
          {/* Make (ماركة السيارة) */}
          <div className="text-start">
            <label className="flex items-center gap-1 text-slate-700 font-extrabold mb-1.5 text-[11px] sm:text-xs">
              <Car className="w-3.5 h-3.5 text-[#d5a027]" />
              <span>{isAr ? 'ماركة السيارة:' : 'Make:'}</span>
            </label>
            <div className="relative">
              <select 
                value={formMake}
                onChange={e => { 
                  setFormMake(e.target.value); 
                  setFormModel('all'); 
                }}
                className="w-full h-11 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 focus:border-[#3e0f77] rounded-xl px-3 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d5a027]/40 cursor-pointer text-xs transition-all shadow-xs appearance-none"
              >
                <option value="all">{isAr ? 'جميع الماركات (18+)' : 'All Makes (18+)'}</option>
                {CAR_BRANDS.map(b => (
                  <option key={b.id} value={b.nameEn.toLowerCase()}>
                    {isAr ? b.nameAr : b.nameEn}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 end-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Model (موديل السيارة) */}
          <div className="text-start">
            <label className="flex items-center gap-1 text-slate-700 font-extrabold mb-1.5 text-[11px] sm:text-xs">
              <Layers className="w-3.5 h-3.5 text-[#d5a027]" />
              <span>{isAr ? 'موديل السيارة:' : 'Model:'}</span>
            </label>
            <div className="relative">
              <select 
                value={formModel}
                onChange={e => setFormModel(e.target.value)}
                disabled={availableModels.length === 0}
                className={`w-full h-11 border rounded-xl px-3 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d5a027]/40 cursor-pointer text-xs transition-all shadow-xs appearance-none ${
                  availableModels.length === 0 
                    ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-50 hover:bg-slate-100/80 focus:bg-white border-slate-300 focus:border-[#3e0f77]'
                }`}
              >
                <option value="all">
                  {availableModels.length === 0 
                    ? (isAr ? '← اختر الماركة أولاً' : '← Select Make First') 
                    : (isAr ? 'جميع الموديلات' : 'All Models')}
                </option>
                {availableModels.map((m, idx) => (
                  <option key={idx} value={m.modelEn}>
                    {isAr ? m.modelAr : m.modelEn}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 end-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Year (السنة) */}
          <div className="text-start">
            <label className="flex items-center gap-1 text-slate-700 font-extrabold mb-1.5 text-[11px] sm:text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#d5a027]" />
              <span>{isAr ? 'سنة الصنع:' : 'Year:'}</span>
            </label>
            <div className="relative">
              <select 
                value={formYear}
                onChange={e => setFormYear(e.target.value)}
                className="w-full h-11 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 focus:border-[#3e0f77] rounded-xl px-3 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d5a027]/40 cursor-pointer text-xs transition-all shadow-xs appearance-none"
              >
                <option value="all">{isAr ? 'جميع السنوات (2012-2026)' : 'All Years (2012-2026)'}</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 end-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Color (لون التلبيسة أو المقصورة) */}
          <div className="text-start">
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1 text-slate-700 font-extrabold text-[11px] sm:text-xs">
                <Palette className="w-3.5 h-3.5 text-[#d5a027]" />
                <span>{isAr ? 'لون الجلد:' : 'Color:'}</span>
              </label>
              {formColor !== 'all' && (
                <span 
                  className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0" 
                  style={{ backgroundColor: selectedColorObj.hex }} 
                />
              )}
            </div>
            <div className="relative">
              <select 
                value={formColor}
                onChange={e => setFormColor(e.target.value)}
                className="w-full h-11 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 focus:border-[#3e0f77] rounded-xl px-3 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d5a027]/40 cursor-pointer text-xs transition-all shadow-xs appearance-none"
              >
                <option value="all">{isAr ? 'جميع ألوان الوكالة (6)' : 'All OEM Colors (6)'}</option>
                {SEAT_COLORS.map(c => (
                  <option key={c.id} value={c.nameAr}>
                    {isAr ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 end-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Search Button (Ultra-Luxury Gold Shimmer) */}
          <div className="col-span-2 lg:col-span-1">
            <button 
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-[#d5a027] via-[#f6c344] to-[#e5a93b] text-[#120224] text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.98] transition-all border border-[#f6c344]/50 group"
            >
              <Search className="w-4 h-4 text-[#120224] group-hover:scale-115 transition-transform" />
              <span className="tracking-wide">{isAr ? 'ابحث عن سيارتك' : 'Search Vehicle'}</span>
            </button>
          </div>
        </form>

        {/* 3. POPULAR SAUDI CAR CHIPS (1-Click Instant Preset Matcher) */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold shrink-0">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] sm:text-xs text-slate-700">{isAr ? 'السيارات الأكثر طلباً بمكة:' : 'Popular Models:'}</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full pb-1 sm:pb-0">
            {POPULAR_SAUDI_CARS.map((car, idx) => {
              const isSelected = formMake.toLowerCase() === car.makeEn.toLowerCase() && formModel === car.modelEn;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (onQuickVehicleSelect) {
                      onQuickVehicleSelect(car.makeEn, car.modelEn);
                    } else {
                      setFormMake(car.makeEn);
                      setFormModel(car.modelEn);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1 shrink-0 ${
                    isSelected
                      ? 'bg-[#16032e] text-[#f6c344] shadow-xs border border-[#f6c344]/50'
                      : 'bg-slate-100 hover:bg-purple-100/70 text-slate-700 hover:text-[#3e0f77] border border-slate-200'
                  }`}
                >
                  <Car className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#f6c344]' : 'text-[#d5a027]'}`} />
                  <span>{isAr ? car.nameAr : car.nameEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. LIVE VEHICLE MATCH BANNER (Displays dynamically when user picks a car) */}
        {hasVehicleSelected && (
          <div className="mt-3.5 p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50/50 border border-emerald-300/80 flex items-center justify-between gap-2 animate-fadeIn text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="font-black text-slate-900 truncate">
                  {isAr ? `تطابق ليزري 100% مؤكد لـ: ${fullSelectedTitle}` : `100% OEM Laser Fit Verified for: ${fullSelectedTitle}`}
                </p>
                <p className="text-[10px] text-emerald-800 font-semibold truncate hidden sm:block">
                  {isAr ? 'يشمل تلابيس المقاعد الملكية + طقم أرضيات 5D عازلة · ضمان سنتين ذهبي' : 'Includes VIP Bespoke Covers + 5D All-Weather Armor Mats · 2-Yr Warranty'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSubmit()}
              className="px-3 py-1.5 bg-[#16032e] hover:bg-[#25074d] text-[#f6c344] rounded-lg text-[11px] font-black shrink-0 transition-colors cursor-pointer shadow-xs"
            >
              {isAr ? 'عرض تقرير المطابقة' : 'View Fitment'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
