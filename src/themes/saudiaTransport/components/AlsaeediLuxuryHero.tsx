import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  MessageCircle,
  Truck,
  CreditCard,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  Star
} from 'lucide-react';
import { 
  CarBrandItem, 
  SeatColorOption, 
  CAR_BRANDS, 
  SEAT_COLORS, 
  CAR_MODELS_MAP,
  BLECO_STORE_INFO
} from '../../../data/blecoStoreData';

export interface AlsaeediLuxuryHeroProps {
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
  onOpenWhatsApp?: (customMessage?: string) => void;
  onSelectCategory?: (catId: string) => void;
  onOpenFloorMatModal?: () => void;
  onPillClick?: (pillKey: string) => void;
  onToggleLang?: () => void;
}

// Top Popular Saudi Cars for 1-Click Instant Preset Matcher
const POPULAR_SAUDI_CARS = [
  { makeId: 'toyota', makeEn: 'toyota', modelEn: 'Land Cruiser', nameAr: 'لاند كروزر', nameEn: 'Land Cruiser', badge: 'الأكثر طلباً' },
  { makeId: 'toyota', makeEn: 'toyota', modelEn: 'Camry', nameAr: 'تويوتا كامري', nameEn: 'Toyota Camry', badge: 'VIP' },
  { makeId: 'lexus', makeEn: 'lexus', modelEn: 'ES 350', nameAr: 'لكزس ES', nameEn: 'Lexus ES', badge: 'فاخر' },
  { makeId: 'nissan', makeEn: 'nissan', modelEn: 'Patrol', nameAr: 'نيسان باترول', nameEn: 'Nissan Patrol', badge: 'بطل الدروب' },
  { makeId: 'chevrolet', makeEn: 'chevrolet', modelEn: 'Tahoe', nameAr: 'شفروليه تاهو', nameEn: 'Chevy Tahoe', badge: 'عائلي VIP' },
  { makeId: 'gmc', makeEn: 'gmc', modelEn: 'Yukon', nameAr: 'جمس يوكن', nameEn: 'GMC Yukon', badge: 'ملكي' },
  { makeId: 'hyundai', makeEn: 'hyundai', modelEn: 'Sonata', nameAr: 'هيونداي سوناتا', nameEn: 'Hyundai Sonata', badge: 'شائع' },
  { makeId: 'ford', makeEn: 'ford', modelEn: 'Taurus', nameAr: 'فورد تورس', nameEn: 'Ford Taurus', badge: 'سيدان VIP' },
];

const AlsaeediLuxuryHeroComponent: React.FC<AlsaeediLuxuryHeroProps> = ({
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
  onOpenWhatsApp,
  onSelectCategory,
  onOpenFloorMatModal,
  onPillClick,
  onToggleLang,
}) => {
  // Dropdown open state (make | model | year | color | null)
  const [openDropdown, setOpenDropdown] = useState<'make' | 'model' | 'year' | 'color' | null>(null);
  const dropdownRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selected Brand and Color lookups
  const selectedBrand = CAR_BRANDS.find(b => b.nameEn.toLowerCase() === formMake.toLowerCase() || b.id === formMake);
  const selectedColorObj = SEAT_COLORS.find(c => c.nameAr === formColor || c.nameEn.toLowerCase() === formColor.toLowerCase()) || SEAT_COLORS[0];
  const hasVehicleSelected = formMake !== 'all';
  const fullSelectedTitle = hasVehicleSelected
    ? `${selectedBrand ? (isAr ? selectedBrand.nameAr : selectedBrand.nameEn) : formMake.toUpperCase()} ${formModel !== 'all' ? formModel : ''} ${formYear !== 'all' ? formYear : ''}`.trim()
    : '';

  const currentMakeLabel = formMake === 'all' 
    ? (isAr ? 'جميع الماركات (18+)' : 'All Makes (18+)') 
    : (selectedBrand ? (isAr ? selectedBrand.nameAr : selectedBrand.nameEn) : formMake.toUpperCase());

  const currentModelLabel = formModel === 'all' 
    ? (availableModels.length === 0 ? (isAr ? '← اختر الماركة أولاً' : '← Select Make First') : (isAr ? 'جميع الموديلات' : 'All Models'))
    : (availableModels.find(m => m.modelEn === formModel)?.modelAr && isAr 
        ? availableModels.find(m => m.modelEn === formModel)!.modelAr 
        : formModel);

  const currentYearLabel = formYear === 'all' 
    ? (isAr ? 'جميع السنوات' : 'All Years') 
    : formYear;

  const currentColorLabel = formColor === 'all' 
    ? (isAr ? 'جميع الألوان (6)' : 'All Colors (6)') 
    : (selectedColorObj ? (isAr ? selectedColorObj.nameAr : selectedColorObj.nameEn) : formColor);

  const handleQuickWhatsAppConsultation = (customNote?: string) => {
    let msg = isAr 
      ? `السلام عليكم متجر السعيدي VIP، أرغب باستشارة تفصيل لسيارتي`
      : `Hello Al-Saeedi VIP, I need custom tailoring consultation for my car`;
    
    if (hasVehicleSelected) {
      msg += isAr ? ` (${fullSelectedTitle})` : ` (${fullSelectedTitle})`;
      if (formColor !== 'all') {
        msg += isAr ? ` باللون ${formColor}` : ` in ${formColor}`;
      }
    }
    if (customNote) {
      msg += ` - ${customNote}`;
    }
    if (onOpenWhatsApp) {
      onOpenWhatsApp(msg);
    } else {
      window.open(`https://wa.me/${BLECO_STORE_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <section className="relative bg-[#16032e] alsaeedi-hero-gradient text-white pt-8 sm:pt-12 pb-16 sm:pb-24 px-3 sm:px-6 overflow-visible border-b border-[#d5a027]/30 selection:bg-[#f6c344] selection:text-[#16032e]">
      
      {/* Dynamic Ambient Luxury Lighting Spheres (contained safely in pointer-events-none backdrop) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[32rem] h-[32rem] bg-gradient-to-br from-[#d5a027]/18 via-[#f6c344]/8 to-transparent rounded-full blur-3xl transform -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/4 w-[28rem] h-[28rem] bg-gradient-to-tr from-[#3e0f77]/35 via-[#25074d]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#d5a027_0.75px,transparent_1px)] [background-size:24px_24px] opacity-10" />
      </div>

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10 text-center">
        
        {/* ============================================================
            1. TOP BADGE & SAUDI VIP STUDIO ANNOUNCEMENT PILL
            ============================================================ */}
        <div className="flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d5a027]/20 border border-[#d5a027]/50 text-[#f6c344] text-xs font-black shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#f6c344] shrink-0" />
            <span>{isAr ? 'متجر السعيدي VIP — تنجيد وتلابيس مكة الفاخرة' : 'Al-Saeedi VIP Automotive — Flagship Makkah Studio'}</span>
          </div>
        </div>

        {/* ============================================================
            2. LUXURY HERO HEADLINE & PUNCHY 1-2 LINE HOOK
            ============================================================ */}
        <div className="space-y-3 max-w-3xl mx-auto px-2">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.18] tracking-tight">
            {isAr ? (
              <>
                حوّل مقصورة سيارتك إلى{' '}
                <span className="text-[#f6c344]">
                  فخامة الدرجة الأولى
                </span>
              </>
            ) : (
              <>
                Upgrade Your Cabin to{' '}
                <span className="text-[#f6c344]">
                  First-Class Luxury
                </span>
              </>
            )}
          </h1>

          <p className="text-slate-200 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-medium">
            {isAr 
              ? 'تفصيل ليزر 100% مطابق لأبعاد الوكالة · ضمان ذهبي سنتين.'
              : '100% OEM laser-tailored fitment for your exact car · 2-Year VIP Warranty.'}
          </p>

          {/* Luxury Feature Highlight Badges (4 Clean Pills in 1 Line) */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-bold text-white">
            
            {/* Pill 1: 100% OEM Fit */}
            <button
              type="button"
              onClick={() => onPillClick?.('oem')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 hover:border-[#f6c344] transition-all cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-[#f6c344]" />
              <span>{isAr ? 'مطابقة الوكالة 100%' : '100% OEM Fit'}</span>
            </button>

            {/* Pill 2: 2-Year VIP Warranty */}
            <button
              type="button"
              onClick={() => onPillClick?.('warranty')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 hover:border-emerald-400 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'ضمان سنتين ذهبي' : '2-Year VIP Warranty'}</span>
            </button>

            {/* Pill 3: All-Weather Defense */}
            <button
              type="button"
              onClick={() => onPillClick?.('weather')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 hover:border-amber-400 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAr ? 'عازل للماء والحرارة' : 'All-Weather Defense'}</span>
            </button>

            {/* Pill 4: Free Makkah Fit */}
            <button
              type="button"
              onClick={() => onPillClick?.('makkah')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 hover:border-blue-400 transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>{isAr ? 'تركيب مجاني بمكة' : 'Free Makkah Fit'}</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            3. INSTANT VEHICLE FILTER COCKPIT (Ultra-Luxury Redesign)
            ============================================================ */}
        <div 
          id="vehicle-filter-bar" 
          className="relative rounded-3xl bg-white/98 text-slate-900 max-w-5xl mx-auto p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(18,2,36,0.5)] border-2 border-[#d5a027]/40 ring-4 ring-[#d5a027]/12 transition-all duration-300 text-xs text-start"
        >
          {/* Cockpit Top Mini-Bar: Title & Radar Status */}
          <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-[#16032e] to-[#3e0f77] text-[#f6c344] shadow-xs">
                <SlidersHorizontal className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-xs sm:text-sm tracking-tight flex items-center gap-2">
                  <span>{isAr ? 'المحدد الذكي لموديلات ومقاسات السيارات' : 'VIP Smart Laser Vehicle Cockpit'}</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-2.5 py-0.5 rounded-full font-extrabold">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{isAr ? 'فحص ومطابقة ليزرية فورية' : 'Instant Laser Scan'}</span>
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 hidden md:block">
                  {isAr 
                    ? 'اختر سيارتك لعرض التلابيس والأرضيات المطابقة بدقة 100% لأبعاد المصنع'
                    : 'Select your vehicle to reveal 100% exact factory-fit seat covers and mats'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isAr ? 'تغطية أكثر من 108+ سيارة بالمملكة' : '108+ Verified Saudi Models'}</span>
              </div>
              {(formMake !== 'all' || formModel !== 'all' || formYear !== 'all' || formColor !== 'all') && (
                <button
                  type="button"
                  onClick={onReset}
                  className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors border border-rose-200"
                  title={isAr ? 'إعادة تعيين الفلتر' : 'Reset filter'}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 5-Column Input Form with Custom Luxury Downward-Opening Dropdowns */}
          <form 
            ref={dropdownRef}
            onSubmit={onSubmit} 
            className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5 items-end relative"
          >
            
            {/* 1. Make (ماركة السيارة) */}
            <div className="relative text-start">
              <label className="flex items-center gap-1 text-slate-700 font-extrabold mb-1.5 text-[11px] sm:text-xs">
                <Car className="w-3.5 h-3.5 text-[#d5a027]" />
                <span>{isAr ? 'ماركة السيارة:' : 'Make:'}</span>
              </label>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'make' ? null : 'make')}
                className={`w-full h-11 bg-slate-50 hover:bg-slate-100/90 focus:bg-white border rounded-xl px-3 font-extrabold text-slate-900 text-xs transition-all shadow-xs flex items-center justify-between cursor-pointer ${
                  openDropdown === 'make' ? 'border-[#3e0f77] ring-2 ring-[#d5a027]/40 bg-white' : 'border-slate-300'
                }`}
              >
                <span className="truncate">{currentMakeLabel}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${openDropdown === 'make' ? 'rotate-180 text-[#d5a027]' : 'text-slate-400'}`} />
              </button>

              {/* STRICTLY OPENS DOWNWARDS (top-full mt-1.5) */}
              {openDropdown === 'make' && (
                <div className="absolute top-full start-0 w-full mt-1.5 z-50 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-[#d5a027]/40 py-1.5 max-h-60 sm:max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      setFormMake('all');
                      setFormModel('all');
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2.5 text-start flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                      formMake === 'all' ? 'bg-amber-50 text-[#3e0f77] font-black' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{isAr ? 'جميع الماركات (18+)' : 'All Makes (18+)'}</span>
                    {formMake === 'all' && <Check className="w-3.5 h-3.5 text-[#d5a027]" />}
                  </button>
                  {CAR_BRANDS.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setFormMake(b.nameEn.toLowerCase());
                        setFormModel('all');
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-2.5 text-start flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                        formMake.toLowerCase() === b.nameEn.toLowerCase() ? 'bg-amber-50 text-[#3e0f77] font-black' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{isAr ? b.nameAr : b.nameEn}</span>
                      {formMake.toLowerCase() === b.nameEn.toLowerCase() && <Check className="w-3.5 h-3.5 text-[#d5a027] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Model (موديل السيارة) */}
            <div className="relative text-start">
              <label className="flex items-center gap-1 text-slate-700 font-extrabold mb-1.5 text-[11px] sm:text-xs">
                <Layers className="w-3.5 h-3.5 text-[#d5a027]" />
                <span>{isAr ? 'موديل السيارة:' : 'Model:'}</span>
              </label>
              <button
                type="button"
                disabled={availableModels.length === 0}
                onClick={() => setOpenDropdown(openDropdown === 'model' ? null : 'model')}
                className={`w-full h-11 border rounded-xl px-3 font-extrabold text-slate-900 text-xs transition-all shadow-xs flex items-center justify-between cursor-pointer ${
                  availableModels.length === 0 
                    ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed'
                    : openDropdown === 'model'
                    ? 'border-[#3e0f77] ring-2 ring-[#d5a027]/40 bg-white'
                    : 'bg-slate-50 hover:bg-slate-100/90 border-slate-300'
                }`}
              >
                <span className="truncate">{currentModelLabel}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${openDropdown === 'model' ? 'rotate-180 text-[#d5a027]' : 'text-slate-400'}`} />
              </button>

              {/* STRICTLY OPENS DOWNWARDS (top-full mt-1.5) */}
              {openDropdown === 'model' && availableModels.length > 0 && (
                <div className="absolute top-full start-0 w-full mt-1.5 z-50 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-[#d5a027]/40 py-1.5 max-h-60 sm:max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      setFormModel('all');
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2.5 text-start flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                      formModel === 'all' ? 'bg-amber-50 text-[#3e0f77] font-black' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{isAr ? 'جميع الموديلات' : 'All Models'}</span>
                    {formModel === 'all' && <Check className="w-3.5 h-3.5 text-[#d5a027]" />}
                  </button>
                  {availableModels.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormModel(m.modelEn);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-2.5 text-start flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                        formModel === m.modelEn ? 'bg-amber-50 text-[#3e0f77] font-black' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{isAr ? m.modelAr : m.modelEn}</span>
                      {formModel === m.modelEn && <Check className="w-3.5 h-3.5 text-[#d5a027] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Year (السنة) */}
            <div className="relative text-start">
              <label className="flex items-center gap-1 text-slate-700 font-extrabold mb-1.5 text-[11px] sm:text-xs">
                <Calendar className="w-3.5 h-3.5 text-[#d5a027]" />
                <span>{isAr ? 'سنة الصنع:' : 'Year:'}</span>
              </label>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
                className={`w-full h-11 bg-slate-50 hover:bg-slate-100/90 focus:bg-white border rounded-xl px-3 font-extrabold text-slate-900 text-xs transition-all shadow-xs flex items-center justify-between cursor-pointer ${
                  openDropdown === 'year' ? 'border-[#3e0f77] ring-2 ring-[#d5a027]/40 bg-white' : 'border-slate-300'
                }`}
              >
                <span className="truncate">{currentYearLabel}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${openDropdown === 'year' ? 'rotate-180 text-[#d5a027]' : 'text-slate-400'}`} />
              </button>

              {/* STRICTLY OPENS DOWNWARDS (top-full mt-1.5) */}
              {openDropdown === 'year' && (
                <div className="absolute top-full start-0 w-full mt-1.5 z-50 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-[#d5a027]/40 py-1.5 max-h-60 sm:max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      setFormYear('all');
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2.5 text-start flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                      formYear === 'all' ? 'bg-amber-50 text-[#3e0f77] font-black' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{isAr ? 'جميع السنوات' : 'All Years'}</span>
                    {formYear === 'all' && <Check className="w-3.5 h-3.5 text-[#d5a027]" />}
                  </button>
                  {availableYears.map(yr => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setFormYear(yr);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-2.5 text-start flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                        formYear === yr ? 'bg-amber-50 text-[#3e0f77] font-black' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{yr}</span>
                      {formYear === yr && <Check className="w-3.5 h-3.5 text-[#d5a027]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Color (لون الجلد والتطريز) */}
            <div className="relative text-start">
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1 text-slate-700 font-extrabold text-[11px] sm:text-xs">
                  <Palette className="w-3.5 h-3.5 text-[#d5a027]" />
                  <span>{isAr ? 'لون الجلد والتطريز:' : 'Color:'}</span>
                </label>
                {formColor !== 'all' && (
                  <span 
                    className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-xs" 
                    style={{ backgroundColor: selectedColorObj.hex }} 
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'color' ? null : 'color')}
                className={`w-full h-11 bg-slate-50 hover:bg-slate-100/90 focus:bg-white border rounded-xl px-3 font-extrabold text-slate-900 text-xs transition-all shadow-xs flex items-center justify-between cursor-pointer ${
                  openDropdown === 'color' ? 'border-[#3e0f77] ring-2 ring-[#d5a027]/40 bg-white' : 'border-slate-300'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {formColor !== 'all' && (
                    <span className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: selectedColorObj.hex }} />
                  )}
                  <span className="truncate">{currentColorLabel}</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${openDropdown === 'color' ? 'rotate-180 text-[#d5a027]' : 'text-slate-400'}`} />
              </button>

              {/* STRICTLY OPENS DOWNWARDS (top-full mt-1.5) */}
              {openDropdown === 'color' && (
                <div className="absolute top-full start-0 w-full mt-1.5 z-50 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-[#d5a027]/40 py-1.5 max-h-60 sm:max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      setFormColor('all');
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2.5 text-start flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                      formColor === 'all' ? 'bg-amber-50 text-[#3e0f77] font-black' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{isAr ? 'جميع ألوان الوكالة (6 ألوان)' : 'All OEM Colors (6)'}</span>
                    {formColor === 'all' && <Check className="w-3.5 h-3.5 text-[#d5a027]" />}
                  </button>
                  {SEAT_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setFormColor(c.nameAr);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-2.5 text-start flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                        formColor === c.nameAr ? 'bg-amber-50 text-[#3e0f77] font-black' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-xs" style={{ backgroundColor: c.hex }} />
                        <span className="truncate">{isAr ? c.nameAr : c.nameEn}</span>
                      </span>
                      {formColor === c.nameAr && <Check className="w-3.5 h-3.5 text-[#d5a027] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Search Button (Ultra-Luxury Gold Shimmer) */}
            <div className="col-span-2 lg:col-span-1">
              <button 
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-[#d5a027] via-[#f6c344] to-[#e5a93b] text-[#120224] text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(213,160,39,0.38)] hover:shadow-[0_6px_22px_rgba(213,160,39,0.55)] hover:brightness-105 active:scale-[0.98] transition-all border border-[#f6c344]/50 group"
              >
                <Search className="w-4 h-4 text-[#120224] group-hover:scale-115 transition-transform" />
                <span className="tracking-wide">{isAr ? 'ابحث عن سيارتك' : 'Search Vehicle'}</span>
              </button>
            </div>
          </form>

          {/* 6. POPULAR SAUDI CAR CHIPS (1-Click Instant Preset Matcher) */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-extrabold shrink-0">
              <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-[11px] sm:text-xs text-slate-800">{isAr ? 'الأكثر طلباً بمكة والمملكة:' : 'Popular Models:'}</span>
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
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ${
                      isSelected
                        ? 'bg-[#16032e] text-[#f6c344] shadow-md border-2 border-[#f6c344] scale-[1.02]'
                        : 'bg-slate-100 hover:bg-purple-100/70 text-slate-700 hover:text-[#3e0f77] border border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <Car className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#f6c344]' : 'text-[#d5a027]'}`} />
                    <span>{isAr ? car.nameAr : car.nameEn}</span>
                    {car.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black ${
                        isSelected ? 'bg-[#f6c344] text-[#16032e]' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {car.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. LIVE VEHICLE MATCH BANNER (Displays dynamically when user picks a car) */}
          {hasVehicleSelected && (
            <div className="mt-3.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50/50 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn text-xs shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 text-xs sm:text-sm truncate">
                    {isAr ? `✓ تطابق ليزري 100% مؤكد لـ: ${fullSelectedTitle}` : `✓ 100% OEM Laser Fit Verified for: ${fullSelectedTitle}`}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-semibold truncate">
                    {isAr 
                      ? 'متاح تلابيس المقاعد الملكية المفصلة + طقم أرضيات 5D عازلة · ضمان سنتين ذهبي مع استبدال فوري' 
                      : 'Available: VIP Bespoke Seat Covers + 5D All-Weather Armor Mats · 2-Yr Replacement Warranty'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => onSubmit()}
                  className="flex-1 sm:flex-none px-4 py-2 bg-[#16032e] hover:bg-[#25074d] text-[#f6c344] rounded-xl text-xs font-black transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                >
                  <span>{isAr ? 'عرض تقرير المطابقة' : 'View Fitment'}</span>
                  {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickWhatsAppConsultation('طلب تسعيرة فورية مع صورة المقاعد')}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-md flex items-center gap-1"
                  title={isAr ? 'استشارة فورية واتساب' : 'WhatsApp'}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? 'واتساب مباشر' : 'WhatsApp'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================
            5. SAUDI VIP TRUST STRIP (الضمانات والتوصيل الفاخر)
            ============================================================ */}
        <div className="pt-2 max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-start">
          
          <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/6 border border-white/10 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-[#f6c344] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-white text-[11px] sm:text-xs truncate">
                {isAr ? 'ضمان ذهبي سنتين' : '2-Year VIP Warranty'}
              </h4>
              <p className="text-[10px] text-slate-300 truncate">
                {isAr ? 'استبدال فوري بدون أسئلة' : 'Instant hassle-free replace'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/6 border border-white/10 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-blue-400/20 text-sky-300 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-white text-[11px] sm:text-xs truncate">
                {isAr ? 'تركيب مجاني بمكة' : 'Free Makkah Fit'}
              </h4>
              <p className="text-[10px] text-slate-300 truncate">
                {isAr ? 'فريق فني معتمد عند بابك' : 'At your doorstep'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/6 border border-white/10 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-white text-[11px] sm:text-xs truncate">
                {isAr ? 'شحن سريع للمملكة' : 'Express KSA Shipping'}
              </h4>
              <p className="text-[10px] text-slate-300 truncate">
                {isAr ? 'سمسا وأرامكس لكافة المدن' : 'SMSA & Aramex to all cities'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/6 border border-white/10 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-purple-400/20 text-purple-200 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-white text-[11px] sm:text-xs truncate">
                {isAr ? 'طرق دفع ميسرة' : 'Flexible Payments'}
              </h4>
              <p className="text-[10px] text-slate-300 truncate">
                {isAr ? 'مدى، أبل باي، تمارا، كاش' : 'Mada, Apple Pay, COD'}
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export const AlsaeediLuxuryHero = React.memo(AlsaeediLuxuryHeroComponent);
