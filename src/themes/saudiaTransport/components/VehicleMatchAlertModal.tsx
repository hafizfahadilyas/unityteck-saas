import React, { useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Car, 
  Palette, 
  ShoppingCart, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Award, 
  Truck, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Product } from '../../../types';
import { 
  CarBrandItem, 
  SeatColorOption, 
  CAR_BRANDS,
  SEAT_COLORS, 
} from '../../../data/blecoStoreData';

interface VehicleMatchAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr?: boolean;
  make: string;
  model: string;
  year: string;
  color: string;
  brandObj?: CarBrandItem;
  colorObj?: SeatColorOption;
  /** Live store catalog — never fall back to mock featured packs */
  catalogProducts?: Product[];
  onSelectSeatCover: (product: Product, color: SeatColorOption) => void;
  onSelectFloorMat: (product: Product) => void;
  onViewInCatalog: () => void;
  onWhatsAppOrder: (product?: Product, color?: SeatColorOption, customText?: string) => void;
  onSelectBrandQuickly?: (brandSlug: string) => void;
}

// WhatsApp Icon SVG
function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export const VehicleMatchAlertModal: React.FC<VehicleMatchAlertModalProps> = ({
  isOpen,
  onClose,
  isAr = true,
  make,
  model,
  year,
  color,
  brandObj,
  colorObj,
  catalogProducts = [],
  onSelectSeatCover,
  onSelectFloorMat,
  onViewInCatalog,
  onWhatsAppOrder,
  onSelectBrandQuickly,
}) => {
  // ESC listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Resolve matching brand and color
  const resolvedBrand = brandObj || CAR_BRANDS.find(b => b.nameEn.toLowerCase() === make.toLowerCase() || b.id === make);
  const resolvedColor = colorObj || SEAT_COLORS.find(c => c.nameAr === color || c.nameEn.toLowerCase() === color.toLowerCase()) || SEAT_COLORS[1]; // default camel

  const brandDisplayName = resolvedBrand ? (isAr ? resolvedBrand.nameAr : resolvedBrand.nameEn) : (make !== 'all' ? make.toUpperCase() : (isAr ? 'السيارة' : 'Car'));
  const modelDisplayName = model !== 'all' ? model : '';
  const yearDisplayName = year !== 'all' ? year : '2024';
  const colorDisplayName = isAr ? resolvedColor.nameAr : resolvedColor.nameEn;

  const fullCarTitle = `${brandDisplayName} ${modelDisplayName} ${yearDisplayName}`.trim();

  const makeNeedle = (make || '').toLowerCase();
  const modelNeedle = (model || '').toLowerCase();
  const matchesVehicle = (p: Product) => {
    const blob = [
      p.brand,
      p.name,
      p.nameAr,
      p.nameEn,
      ...(p.tags || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (make !== 'all' && makeNeedle && !blob.includes(makeNeedle) && !(resolvedBrand?.nameAr && blob.includes(resolvedBrand.nameAr))) {
      return false;
    }
    if (model !== 'all' && modelNeedle && !blob.includes(modelNeedle) && !(modelDisplayName && blob.includes(modelDisplayName.toLowerCase()))) {
      return false;
    }
    return true;
  };

  const liveSeats = catalogProducts.filter(
    (p) =>
      (p.type === 'seat-cover' ||
        (p as { categoryId?: string }).categoryId === 'cat-clothing' ||
        `${p.name || ''} ${p.nameAr || ''}`.includes('تلبيس') ||
        `${p.name || ''}`.toLowerCase().includes('seat')) &&
      matchesVehicle(p),
  );
  const liveMats = catalogProducts.filter(
    (p) =>
      (p.type === 'floor-mat' ||
        (p as { categoryId?: string }).categoryId === 'cat-floors' ||
        `${p.name || ''} ${p.nameAr || ''}`.includes('أرضي') ||
        `${p.name || ''}`.toLowerCase().includes('mat')) &&
      matchesVehicle(p),
  );

  const matchingSeatCover = liveSeats[0] || catalogProducts.find((p) => p.type === 'seat-cover') || null;
  const matchingFloorMat = liveMats[0] || catalogProducts.find((p) => p.type === 'floor-mat') || null;

  // WhatsApp Combo text
  const comboMessage = isAr 
    ? `مرحباً متجر السعيدي لتنجيد السيارات، أرغب بحجز البكج الشامل (تلابيس مقاعد + طقم أرضيات 5D ليزر) لسيارة${fullCarTitle}باللون${colorDisplayName}بسعر العرض الخاص (وفر 100 ⃁). يرجى تأكيد الحجز وموعد التوصيل.`
    : `Hello Al-Saeedi Car Upholstery, I would like to book the VIP Full Combo Package (Seat Covers + 5D Floor Mats) for ${fullCarTitle} in ${colorDisplayName} with the 100 ⃁ bundle discount.`;

  // IF NO BRAND CHOSEN: SHOW QUICK PICK ALERT MODAL
  if (make === 'all') {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div 
          className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-[#d5a027]/40 animate-scaleIn text-slate-900"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-100 via-[#2a0852] to-slate-800 text-white p-5 flex items-center justify-between border-b border-[#d5a027]/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-white">
                  {isAr ? 'تنبيه: يرجى تحديد ماركة سيارتك' : 'Notice: Please Select Car Make'}
                </h3>
                <p className="text-[11px] text-[#f6c344]">
                  {isAr ? 'لضمان دقة التفصيل الليزري 100% ومطابقة المقاسات' : 'To ensure 100% exact OEM laser dimensions'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isAr 
                ? 'يرجى اختيار ماركة سيارتك من القائمة السريعة أدناه للتحقق الفوري من توفر تلابيس المقاعد والأرضيات الليزرية المطابقة لموديلك بالمليمتر:' 
                : 'Select your vehicle brand from the quick list below to verify exact matching seat covers and precision 5D mats:'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CAR_BRANDS.slice(0, 8).map(brand => (
                <button
                  key={brand.id}
                  onClick={() => {
                    if (onSelectBrandQuickly) onSelectBrandQuickly(brand.nameEn.toLowerCase());
                    onClose();
                  }}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer"
                >
                  <img src={brand.logo} alt={brand.nameAr} className="h-8 w-auto object-contain group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-slate-800">{isAr ? brand.nameAr : brand.nameEn}</span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {isAr ? 'جميع الماركات مدعومة بضمان سنتين' : 'All brands covered by 2-year warranty'}
              </span>
              <button 
                onClick={onClose}
                className="px-5 py-2 btn-bashayer-gold text-xs font-black rounded-xl cursor-pointer"
              >
                {isAr ? 'حسناً، سأحدد من الشريط' : 'Got it, let me select'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ADVANCED VEHICLE MATCH POPUP ALERT (FULL MATCH CONFIRMATION)
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#d5a027]/40 animate-scaleIn text-slate-900 my-auto"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* 1. Header with Verification Glow */}
        <div className="bg-gradient-to-r from-slate-100 via-[#2a0852] to-slate-800 text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#d5a027]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#d5a027]/20 border border-[#d5a027]/50 flex items-center justify-center text-[#f6c344] shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#d5a027] text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {isAr ? 'مطابقة 100%' : '100% Verified'}
                </span>
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'أبعاد وكالة معتمدة' : 'OEM Fit Guaranteed'}</span>
                </span>
              </div>
              <h3 className="font-black text-sm sm:text-base text-white mt-0.5">
                {isAr ? 'تم تأكيد مطابقة تفصيل سيارتك بنجاح!' : 'Vehicle Fitment Confirmed!'}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">

          {/* Vehicle Identity & Color Specs Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-amber-50/50 to-white border border-[#d5a027]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-start">
              {resolvedBrand?.logo ? (
                <div className="w-14 h-14 rounded-2xl bg-white p-2 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                  <img src={resolvedBrand.logo} alt={brandDisplayName} className="h-full w-auto object-contain" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-[#f6c344] flex items-center justify-center shrink-0">
                  <Car className="w-7 h-7" />
                </div>
              )}
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {fullCarTitle}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 font-bold">{isAr ? 'اللون الداخلي المختار:' : 'Selected Interior:'}</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-300 text-slate-800 text-xs font-bold shadow-xs">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0" 
                      style={{ backgroundColor: resolvedColor.hex }}
                    />
                    <span>{colorDisplayName}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Trust Badges */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-700 w-full sm:w-auto shrink-0">
              <span className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200">
                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{isAr ? 'ضمان سنتين شامل' : '2-Yr Warranty'}</span>
              </span>
              <span className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200">
                <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{isAr ? 'شحن سريع بالمملكة' : 'Fast Delivery'}</span>
              </span>
              <span className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                <span>{isAr ? 'تفصيل ليزري 100%' : 'Laser Precision'}</span>
              </span>
              <span className="flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{isAr ? 'آمن مع الوسائد الهوائية' : 'Airbag Safe'}</span>
              </span>
            </div>
          </div>

          {/* 3. THE 2 CORE CATEGORIES SELECTION: SEAT COVERS OR FLOOR MATS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#d5a027]" />
                <span>{isAr ? 'اختر القسم المطلوب لسيارتك (الفئتان الرئيسيتان):' : 'Choose tailored category for your car:'}</span>
              </h5>
              <span className="text-[11px] text-slate-800 font-bold">
                {isAr ? 'تلابيس مقاعد أو أرضيات' : 'Seats Cover or Mats'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Seat covers — live catalog only */}
              {matchingSeatCover ? (
                <div className="group flex flex-col justify-between space-y-3 rounded-2xl border-2 border-slate-300/30 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                  <div className="space-y-2.5">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <img
                        src={resolvedColor.image || matchingSeatCover.image}
                        alt={matchingSeatCover.nameAr || matchingSeatCover.name}
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-2 end-2 rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-black text-[#f6c344]">
                        {isAr ? 'تلابيس مقاعد' : 'Seat Covers'}
                      </span>
                    </div>
                    <div>
                      <h6 className="text-xs font-black text-slate-900 sm:text-sm">
                        {isAr
                          ? matchingSeatCover.nameAr || matchingSeatCover.name
                          : matchingSeatCover.nameEn || matchingSeatCover.name}
                      </h6>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        {isAr
                          ? `تفصيل ليزري لـ ${fullCarTitle} · لون ${colorDisplayName}`
                          : `Laser fit for ${fullCarTitle} · ${colorDisplayName}`}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-base font-black text-slate-900">
                          {matchingSeatCover.discountedPrice || matchingSeatCover.price}
                        </span>
                        <span className="mx-1 text-[11px] font-bold text-[#b07e16]">⃁</span>
                        {matchingSeatCover.originalPrice &&
                        matchingSeatCover.originalPrice > (matchingSeatCover.discountedPrice || matchingSeatCover.price) ? (
                          <span className="text-[10px] text-slate-400 line-through">
                            {matchingSeatCover.originalPrice} ⃁
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSeatCover(matchingSeatCover, resolvedColor);
                          onClose();
                        }}
                        className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl bg-slate-50 py-2 text-[11px] font-bold text-slate-800 transition-all hover:bg-slate-800 hover:text-white"
                      >
                        <Palette className="h-3.5 w-3.5" />
                        <span>{isAr ? 'تخصيص' : 'Customize'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const price = matchingSeatCover.discountedPrice || matchingSeatCover.price;
                          const msg = isAr
                            ? `مرحباً متجر السعيدي، أرغب بطلب تلبيسة مقاعد لسيارة ${fullCarTitle} باللون ${colorDisplayName} بسعر ${price} ⃁.`
                            : `Hello Al-Saeedi, I want seat covers for ${fullCarTitle} in ${colorDisplayName} at ${price} SAR.`;
                          onWhatsAppOrder(matchingSeatCover, resolvedColor, msg);
                          onClose();
                        }}
                        className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-[11px] font-bold text-white shadow-xs transition-all hover:bg-emerald-500"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                        <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <Car className="h-8 w-8 text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">
                    {isAr ? 'لا توجد تلابيس مطابقة حالياً' : 'No matching seat covers yet'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onViewInCatalog();
                      onClose();
                    }}
                    className="cursor-pointer text-[11px] font-black text-amber-800 underline"
                  >
                    {isAr ? 'تصفح الكتالوج' : 'Browse catalog'}
                  </button>
                </div>
              )}

              {/* Floor mats — live catalog only */}
              {matchingFloorMat ? (
                <div className="group flex flex-col justify-between space-y-3 rounded-2xl border-2 border-[#d5a027]/40 bg-white p-4 shadow-sm transition-all hover:border-[#d5a027] hover:shadow-md">
                  <div className="space-y-2.5">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <img
                        src={matchingFloorMat.image}
                        alt={matchingFloorMat.nameAr || matchingFloorMat.name}
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-2 end-2 rounded-full bg-[#d5a027] px-2 py-0.5 text-[9px] font-black text-slate-900">
                        {isAr ? 'أرضيات 5D' : '5D Mats'}
                      </span>
                    </div>
                    <div>
                      <h6 className="text-xs font-black text-slate-900 sm:text-sm">
                        {isAr
                          ? matchingFloorMat.nameAr || matchingFloorMat.name
                          : matchingFloorMat.nameEn || matchingFloorMat.name}
                      </h6>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        {isAr
                          ? `عازل للماء · تفصيل ليزري لـ ${fullCarTitle}`
                          : `Waterproof laser fit for ${fullCarTitle}`}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-base font-black text-slate-900">
                          {matchingFloorMat.discountedPrice || matchingFloorMat.price}
                        </span>
                        <span className="mx-1 text-[11px] font-bold text-[#b07e16]">⃁</span>
                        {matchingFloorMat.originalPrice &&
                        matchingFloorMat.originalPrice > (matchingFloorMat.discountedPrice || matchingFloorMat.price) ? (
                          <span className="text-[10px] text-slate-400 line-through">
                            {matchingFloorMat.originalPrice} ⃁
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectFloorMat(matchingFloorMat);
                          onClose();
                        }}
                        className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl bg-amber-50 py-2 text-[11px] font-bold text-[#b07e16] transition-all hover:bg-[#d5a027] hover:text-slate-900"
                      >
                        <Palette className="h-3.5 w-3.5" />
                        <span>{isAr ? 'تخصيص' : 'Customize'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const price = matchingFloorMat.discountedPrice || matchingFloorMat.price;
                          const msg = isAr
                            ? `مرحباً متجر السعيدي، أرغب بطلب أرضيات 5D لسيارة ${fullCarTitle} بسعر ${price} ⃁.`
                            : `Hello Al-Saeedi, I want 5D mats for ${fullCarTitle} at ${price} SAR.`;
                          onWhatsAppOrder(matchingFloorMat, undefined, msg);
                          onClose();
                        }}
                        className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-[11px] font-bold text-white shadow-xs transition-all hover:bg-emerald-500"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                        <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-6 text-center">
                  <Sparkles className="h-8 w-8 text-amber-300" />
                  <p className="text-xs font-bold text-slate-700">
                    {isAr ? 'لا توجد أرضيات مطابقة حالياً' : 'No matching floor mats yet'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onViewInCatalog();
                      onClose();
                    }}
                    className="cursor-pointer text-[11px] font-black text-amber-800 underline"
                  >
                    {isAr ? 'تصفح الكتالوج' : 'Browse catalog'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 4. VIP COMBO PACKAGE BANNER */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-100 via-[#2a0852] to-white text-white border-2 border-[#d5a027]/70 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d5a027] text-slate-900 font-black text-[10px] mb-1">
                  <Star className="w-3 h-3 fill-[#d5a027]" />
                  <span>{isAr ? 'عرض البكج الشامل (وفر 100 ⃁)' : 'VIP Combo: Save 100 ⃁'}</span>
                </div>
                <h5 className="font-black text-sm text-[#f6c344]">
                  {isAr ? `بكج الفخامة لـ${fullCarTitle}: تلابيس مقاعد + طقم أرضيات 5D` : `VIP Full Kit for ${fullCarTitle}: Seats + 5D Mats`}
                </h5>
                <p className="text-[11px] text-slate-300">
                  {isAr ? 'احصل على طقم التلابيس وطقم الأرضيات كاملين بنفس اللون والتطريز بسعر مخفّض.' : 'Get both full seat covers and precision 5D mats matching perfectly.'}
                </p>
              </div>

              <div className="text-center sm:text-end shrink-0">
                <div className="text-xl sm:text-2xl font-black text-[#f6c344]">
                  680 <span className="text-xs font-bold">{'⃁'}</span>
                </div>
                <span className="text-[10px] text-slate-400 line-through">780 {'⃁'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onWhatsAppOrder(undefined, resolvedColor, comboMessage);
                onClose();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-[#d5a027] to-[#f6c344] hover:from-[#c28e1b] hover:to-[#e5b333] text-slate-900 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <WhatsAppIcon className="w-4 h-4 text-slate-900" />
              <span>{isAr ? 'حجز البكج الشامل فوراً عبر واتساب (وفر 100 ⃁)' : 'Book VIP Combo via WhatsApp (Save 100 ⃁)'}</span>
            </button>
          </div>

          {/* 5. Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <button
              onClick={() => {
                onViewInCatalog();
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-[#2e0b59] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>{isAr ? 'تصفح جميع نتائج سيارتك في الكتالوج' : 'View all results in catalog'}</span>
              {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 font-bold py-1 cursor-pointer"
            >
              {isAr ? 'تعديل اختيار السيارة' : 'Change car selection'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
