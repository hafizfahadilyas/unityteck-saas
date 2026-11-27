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
  Flame,
  ChevronDown,
  MessageCircle,
  Truck,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import {
  CAR_BRANDS,
  SEAT_COLORS,
  BLECO_STORE_INFO,
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

const POPULAR_SAUDI_CARS = [
  { makeEn: 'toyota', modelEn: 'Land Cruiser', nameAr: 'لاند كروزر', nameEn: 'Land Cruiser' },
  { makeEn: 'toyota', modelEn: 'Camry', nameAr: 'كامري', nameEn: 'Camry' },
  { makeEn: 'lexus', modelEn: 'ES 350', nameAr: 'لكزس ES', nameEn: 'Lexus ES' },
  { makeEn: 'nissan', modelEn: 'Patrol', nameAr: 'باترول', nameEn: 'Patrol' },
  { makeEn: 'chevrolet', modelEn: 'Tahoe', nameAr: 'تاهو', nameEn: 'Tahoe' },
  { makeEn: 'gmc', modelEn: 'Yukon', nameAr: 'يوكن', nameEn: 'Yukon' },
];

type FieldKey = 'make' | 'model' | 'year' | 'color';

function FieldShell({
  label,
  icon,
  open,
  onToggle,
  display,
  disabled,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  display: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative text-start">
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
        <span className="text-[#915f3c]">{icon}</span>
        <span>{label}</span>
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`w-full h-12 rounded-2xl px-3.5 text-xs font-bold flex items-center justify-between gap-2 transition-all ${
          disabled
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : open
              ? 'bg-[#faede4] text-[#915f3c] shadow-xs'
              : 'bg-[#faf7f4] text-slate-900 hover:bg-white hover:shadow-xs'
        }`}
      >
        <span className="truncate text-start flex-1">{display}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180 text-[#915f3c]' : 'text-slate-400'}`}
        />
      </button>
      {open && !disabled && (
        <div className="absolute top-full start-0 w-full mt-1.5 z-50 bg-white rounded-2xl shadow-[0_18px_40px_-12px_rgba(15,23,42,0.18)] py-1.5 max-h-60 overflow-y-auto animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}

function OptionRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3.5 py-2.5 text-start flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer transition-colors ${
        active ? 'bg-[#faede4] text-[#915f3c]' : 'text-slate-700 hover:bg-[#faf7f4]'
      }`}
    >
      <span className="truncate flex items-center gap-2">{children}</span>
      {active && <Check className="w-3.5 h-3.5 text-[#915f3c] shrink-0" />}
    </button>
  );
}

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
  onPillClick,
}) => {
  const [openDropdown, setOpenDropdown] = useState<FieldKey | null>(null);
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

  const selectedBrand = CAR_BRANDS.find(
    (b) => b.nameEn.toLowerCase() === formMake.toLowerCase() || b.id === formMake,
  );
  const selectedColorObj =
    SEAT_COLORS.find(
      (c) => c.nameAr === formColor || c.nameEn.toLowerCase() === formColor.toLowerCase(),
    ) || SEAT_COLORS[0];
  const hasVehicleSelected = formMake !== 'all';
  const fullSelectedTitle = hasVehicleSelected
    ? `${selectedBrand ? (isAr ? selectedBrand.nameAr : selectedBrand.nameEn) : formMake.toUpperCase()} ${formModel !== 'all' ? formModel : ''} ${formYear !== 'all' ? formYear : ''}`.trim()
    : '';

  const currentMakeLabel =
    formMake === 'all'
      ? isAr
        ? 'اختر الماركة'
        : 'Select make'
      : selectedBrand
        ? isAr
          ? selectedBrand.nameAr
          : selectedBrand.nameEn
        : formMake.toUpperCase();

  const currentModelLabel =
    formModel === 'all'
      ? availableModels.length === 0
        ? isAr
          ? 'اختر الماركة أولاً'
          : 'Select make first'
        : isAr
          ? 'اختر الموديل'
          : 'Select model'
      : isAr
        ? availableModels.find((m) => m.modelEn === formModel)?.modelAr || formModel
        : formModel;

  const currentYearLabel = formYear === 'all' ? (isAr ? 'السنة' : 'Year') : formYear;
  const currentColorLabel =
    formColor === 'all'
      ? isAr
        ? 'اللون'
        : 'Color'
      : selectedColorObj
        ? isAr
          ? selectedColorObj.nameAr
          : selectedColorObj.nameEn
        : formColor;

  const hasFilters =
    formMake !== 'all' || formModel !== 'all' || formYear !== 'all' || formColor !== 'all';

  const handleQuickWhatsAppConsultation = (customNote?: string) => {
    let msg = isAr
      ? 'السلام عليكم متجر السعيدي، أرغب باستشارة تفصيل لسيارتي'
      : 'Hello Al-Saeedi, I need a custom fit consultation for my car';
    if (hasVehicleSelected) {
      msg += ` (${fullSelectedTitle})`;
      if (formColor !== 'all') {
        msg += isAr ? ` · اللون ${formColor}` : ` · color ${formColor}`;
      }
    }
    if (customNote) msg += ` — ${customNote}`;
    if (onOpenWhatsApp) onOpenWhatsApp(msg);
    else {
      window.open(
        `https://wa.me/${BLECO_STORE_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`,
        '_blank',
      );
    }
  };

  const toggle = (key: FieldKey) => setOpenDropdown((prev) => (prev === key ? null : key));

  return (
    <section className="relative text-slate-900 pt-8 sm:pt-12 pb-14 sm:pb-20 px-3 sm:px-6 overflow-visible bg-white">
      {/* Background Car Image Banner with balanced luxury contrast */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="/images/bleco_hero_car_luxury.jpg"
          alt="Alsaeedi Luxury Automotive Hero"
          className="w-full h-full object-cover object-[center_right] sm:object-center"
        />
        {/* Soft, crystal-clear readability overlay so the luxury car remains visible while typography is 100% legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-white/70 to-white/95 sm:from-white/88 sm:via-white/50 sm:to-white pointer-events-none" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 text-center sm:space-y-7">
        {/* Headline — frosted luxury scrim for crystal-clear readability */}
        <div className="space-y-3.5 alsaeedi-anim-fadeup px-4 py-5 sm:px-8 sm:py-6 rounded-3xl bg-white/85 backdrop-blur-md max-w-3xl mx-auto shadow-sm">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#915f3c] bg-[#faede4] px-3.5 py-1.5 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#915f3c]" />
            <span>{isAr ? 'متجر السعيدي — مكة' : 'Al-Saeedi — Makkah'}</span>
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 leading-[1.2] tracking-tight drop-shadow-2xs">
            {isAr ? (
              <>
                حوّل مقصورة سيارتك إلى{' '}
                <span className="text-[#915f3c]">فخامة الدرجة الأولى</span>
              </>
            ) : (
              <>
                Upgrade your cabin to{' '}
                <span className="text-[#915f3c]">first-class luxury</span>
              </>
            )}
          </h1>
          <p className="text-slate-700 font-semibold text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            {isAr
              ? 'تفصيل ليزر مطابق لمقاس الوكالة · ضمان سنتين.'
              : 'OEM laser fit · 2-year warranty.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {[
              { key: 'oem', icon: <Award className="w-3.5 h-3.5" />, ar: 'مطابقة الوكالة', en: 'OEM fit' },
              { key: 'warranty', icon: <ShieldCheck className="w-3.5 h-3.5" />, ar: 'ضمان سنتين', en: '2-year warranty' },
              { key: 'weather', icon: <Sparkles className="w-3.5 h-3.5" />, ar: 'عازل ماء وحرارة', en: 'Water & heat shield' },
              { key: 'makkah', icon: <MapPin className="w-3.5 h-3.5" />, ar: 'تركيب بمكة', en: 'Makkah install' },
            ].map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => onPillClick?.(pill.key)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white shadow-2xs text-[11px] font-black text-slate-800 hover:text-[#915f3c] hover:bg-[#faede4] transition-all cursor-pointer"
              >
                <span className="text-[#915f3c]">{pill.icon}</span>
                <span>{isAr ? pill.ar : pill.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle finder — wide luxury form */}
        <div className="alsaeedi-finder-card relative mx-auto w-full max-w-6xl p-4 text-start alsaeedi-anim-scalein sm:p-6 md:p-7 bg-white/95 backdrop-blur-xl shadow-lg rounded-3xl">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-2xl bg-[#915f3c] text-white inline-flex items-center justify-center shrink-0 shadow-sm">
                <Car className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  {isAr ? 'ابحث بماركة سيارتك' : 'Find by your car'}
                </h2>
                <p className="text-[11px] text-slate-500 truncate">
                  {isAr ? 'ماركة · موديل · سنة · لون' : 'Make · model · year · color'}
                </p>
              </div>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-xl hover:bg-rose-100 cursor-pointer shrink-0 shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'مسح' : 'Clear'}</span>
              </button>
            )}
          </div>

          <form
            ref={dropdownRef}
            onSubmit={onSubmit}
            className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 items-end"
          >
            <FieldShell
              label={isAr ? 'الماركة' : 'Make'}
              icon={<Car className="w-3.5 h-3.5" />}
              open={openDropdown === 'make'}
              onToggle={() => toggle('make')}
              display={currentMakeLabel}
            >
              <OptionRow
                active={formMake === 'all'}
                onClick={() => {
                  setFormMake('all');
                  setFormModel('all');
                  setOpenDropdown(null);
                }}
              >
                {isAr ? 'كل الماركات' : 'All makes'}
              </OptionRow>
              {CAR_BRANDS.map((b) => (
                <OptionRow
                  key={b.id}
                  active={formMake.toLowerCase() === b.nameEn.toLowerCase()}
                  onClick={() => {
                    setFormMake(b.nameEn.toLowerCase());
                    setFormModel('all');
                    setOpenDropdown(null);
                  }}
                >
                  {isAr ? b.nameAr : b.nameEn}
                </OptionRow>
              ))}
            </FieldShell>

            <FieldShell
              label={isAr ? 'الموديل' : 'Model'}
              icon={<Layers className="w-3.5 h-3.5" />}
              open={openDropdown === 'model'}
              onToggle={() => toggle('model')}
              display={currentModelLabel}
              disabled={availableModels.length === 0}
            >
              <OptionRow
                active={formModel === 'all'}
                onClick={() => {
                  setFormModel('all');
                  setOpenDropdown(null);
                }}
              >
                {isAr ? 'كل الموديلات' : 'All models'}
              </OptionRow>
              {availableModels.map((m, idx) => (
                <OptionRow
                  key={idx}
                  active={formModel === m.modelEn}
                  onClick={() => {
                    setFormModel(m.modelEn);
                    setOpenDropdown(null);
                  }}
                >
                  {isAr ? m.modelAr : m.modelEn}
                </OptionRow>
              ))}
            </FieldShell>

            <FieldShell
              label={isAr ? 'السنة' : 'Year'}
              icon={<Calendar className="w-3.5 h-3.5" />}
              open={openDropdown === 'year'}
              onToggle={() => toggle('year')}
              display={currentYearLabel}
            >
              <OptionRow
                active={formYear === 'all'}
                onClick={() => {
                  setFormYear('all');
                  setOpenDropdown(null);
                }}
              >
                {isAr ? 'كل السنوات' : 'All years'}
              </OptionRow>
              {availableYears.map((yr) => (
                <OptionRow
                  key={yr}
                  active={formYear === yr}
                  onClick={() => {
                    setFormYear(yr);
                    setOpenDropdown(null);
                  }}
                >
                  {yr}
                </OptionRow>
              ))}
            </FieldShell>

            <FieldShell
              label={isAr ? 'اللون' : 'Color'}
              icon={<Palette className="w-3.5 h-3.5" />}
              open={openDropdown === 'color'}
              onToggle={() => toggle('color')}
              display={
                <span className="inline-flex items-center gap-2 truncate">
                  {formColor !== 'all' && (
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: selectedColorObj.hex }}
                    />
                  )}
                  <span className="truncate">{currentColorLabel}</span>
                </span>
              }
            >
              <OptionRow
                active={formColor === 'all'}
                onClick={() => {
                  setFormColor('all');
                  setOpenDropdown(null);
                }}
              >
                {isAr ? 'كل الألوان' : 'All colors'}
              </OptionRow>
              {SEAT_COLORS.map((c) => (
                <OptionRow
                  key={c.id}
                  active={formColor === c.nameAr}
                  onClick={() => {
                    setFormColor(c.nameAr);
                    setOpenDropdown(null);
                  }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: c.hex }}
                  />
                  {isAr ? c.nameAr : c.nameEn}
                </OptionRow>
              ))}
            </FieldShell>

            <div className="col-span-2 lg:col-span-1">
              <label className="mb-1.5 block text-[11px] font-bold text-transparent select-none">.</label>
              <button
                type="submit"
                className="w-full h-12 rounded-2xl bg-[#915f3c] hover:bg-[#7e5233] text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98] transition-all"
              >
                <Search className="w-4 h-4 text-white" />
                <span>{isAr ? 'ابحث' : 'Search'}</span>
              </button>
            </div>
          </form>

          {/* Popular chips — clean, no badge clutter */}
          <div className="mt-4 pt-3.5 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 shrink-0">
              <Flame className="w-3.5 h-3.5 text-[#915f3c]" />
              {isAr ? 'الأكثر طلباً:' : 'Popular:'}
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full pb-0.5">
              {POPULAR_SAUDI_CARS.map((car, idx) => {
                const isSelected =
                  formMake.toLowerCase() === car.makeEn.toLowerCase() && formModel === car.modelEn;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (onQuickVehicleSelect) onQuickVehicleSelect(car.makeEn, car.modelEn);
                      else {
                        setFormMake(car.makeEn);
                        setFormModel(car.modelEn);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-2xs ${
                      isSelected
                        ? 'bg-[#915f3c] text-white'
                        : 'bg-white text-slate-700 hover:bg-[#faede4] hover:text-[#915f3c]'
                    }`}
                  >
                    {isAr ? car.nameAr : car.nameEn}
                  </button>
                );
              })}
            </div>
          </div>

          {hasVehicleSelected && (
            <div className="mt-3.5 p-3 rounded-2xl bg-[#faede4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-[#915f3c] text-white inline-flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div className="min-w-0 text-start">
                  <p className="font-black text-slate-900 text-xs truncate">
                    {isAr ? `مطابق: ${fullSelectedTitle}` : `Matched: ${fullSelectedTitle}`}
                  </p>
                  <p className="text-[11px] text-[#915f3c] font-medium truncate">
                    {isAr ? 'تلابيس وأرضيات متاحة لهذا الموديل' : 'Seat covers & mats available for this model'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSubmit()}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white text-[#915f3c] text-xs font-black cursor-pointer inline-flex items-center justify-center gap-1 shadow-2xs"
                >
                  <span>{isAr ? 'عرض المنتجات' : 'View products'}</span>
                  {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickWhatsAppConsultation()}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? 'واتساب' : 'WhatsApp'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust strip — light theme readable */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-start">
          {[
            {
              icon: <ShieldCheck className="w-4 h-4" />,
              titleAr: 'ضمان سنتين',
              titleEn: '2-year warranty',
              subAr: 'استبدال سهل',
              subEn: 'Easy replace',
              tone: 'bg-[#faede4] text-[#915f3c]',
            },
            {
              icon: <MapPin className="w-4 h-4" />,
              titleAr: 'تركيب بمكة',
              titleEn: 'Makkah install',
              subAr: 'فريق فني',
              subEn: 'Pro team',
              tone: 'bg-[#faede4] text-[#915f3c]',
            },
            {
              icon: <Truck className="w-4 h-4" />,
              titleAr: 'شحن للمملكة',
              titleEn: 'KSA shipping',
              subAr: '3–5 أيام',
              subEn: '3–5 days',
              tone: 'bg-[#faede4] text-[#915f3c]',
            },
            {
              icon: <CreditCard className="w-4 h-4" />,
              titleAr: 'دفع مريح',
              titleEn: 'Easy pay',
              subAr: 'مدى · تمارا',
              subEn: 'Mada · Tamara',
              tone: 'bg-[#faede4] text-[#915f3c]',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="alsaeedi-card-chip alsaeedi-reveal flex items-center gap-2.5 p-3 bg-white shadow-2xs rounded-2xl"
            >
              <div className={`w-8 h-8 rounded-xl inline-flex items-center justify-center shrink-0 ${item.tone}`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-[11px] sm:text-xs truncate">
                  {isAr ? item.titleAr : item.titleEn}
                </h3>
                <p className="text-[10px] text-slate-500 truncate">{isAr ? item.subAr : item.subEn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const AlsaeediLuxuryHero = React.memo(AlsaeediLuxuryHeroComponent);
export default AlsaeediLuxuryHero;
