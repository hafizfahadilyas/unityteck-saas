import React, { useState, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Car,
  Eye,
  Palette,
  Flame,
  Wind,
  Plus,
  Star,
  Check,
  CheckCircle2,
  Layers,
  Sparkles,
  CreditCard,
  Truck,
  Gem,
  Crown,
  Gauge,
} from 'lucide-react';
import { Product } from '../../../types';
import { SeatColorOption, getProductColors } from '../../../data/blecoStoreData';
import { AlsaeediSeatGridSkeleton } from './AlsaeediSkeletons';
import { AlsaeediInfiniteCarousel } from './AlsaeediInfiniteCarousel';

interface ModernLuxurySeatCoversSectionProps {
  isAr?: boolean;
  seats: Product[];
  loading?: boolean;
  currentProducts?: Product[];
  onSelectProduct: (product: Product, currentImage?: string, activeColor?: SeatColorOption) => void;
  onOpenWhatsApp: (product: Product, selectedColor?: SeatColorOption, finalPrice?: number, customMsg?: string) => void;
  onAddToCart: (product: Product, qty: number, color?: SeatColorOption) => void;
  onViewAll: () => void;
  cardSelectedColors?: Record<string, SeatColorOption>;
  setCardSelectedColors?: React.Dispatch<React.SetStateAction<Record<string, SeatColorOption>>>;
}

type BrandTab = {
  id: string;
  labelAr: string;
  labelEn: string;
  shortAr: string;
  shortEn: string;
  Icon: LucideIcon;
};

const BRAND_TABS: BrandTab[] = [
  { id: 'all', labelAr: 'جميع الموديلات', labelEn: 'All Models', shortAr: 'الكل', shortEn: 'All', Icon: Sparkles },
  { id: 'toyota', labelAr: 'تويوتا', labelEn: 'Toyota', shortAr: 'تويوتا', shortEn: 'Toyota', Icon: Car },
  { id: 'honda', labelAr: 'هوندا', labelEn: 'Honda', shortAr: 'هوندا', shortEn: 'Honda', Icon: Gauge },
  { id: 'gmc', labelAr: 'جمس وشفروليه', labelEn: 'GMC & Chevy', shortAr: 'جمس', shortEn: 'GMC', Icon: Truck },
  { id: 'lexus-ford', labelAr: 'لكزس وفورد', labelEn: 'Lexus & Ford', shortAr: 'لكزس', shortEn: 'Lexus', Icon: Gem },
  { id: 'custom', labelAr: 'تفصيل حسب الطلب', labelEn: 'Bespoke Custom', shortAr: 'تفصيل', shortEn: 'Custom', Icon: Crown },
];

const MATERIAL_TABS = [
  { id: 'all', labelAr: 'جميع الخامات', labelEn: 'All Materials', shortAr: 'الكل', shortEn: 'All' },
  { id: 'leather', labelAr: 'جلد ألماني نخب أول', labelEn: 'German Nappa Leather', shortAr: 'جلد ألماني', shortEn: 'Nappa' },
  { id: 'fabric', labelAr: 'قماش ياباني صيفي بارد', labelEn: 'Cooling Japanese Fabric', shortAr: 'قماش ياباني', shortEn: 'Fabric' },
];

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const ModernLuxurySeatCoversSectionComponent: React.FC<ModernLuxurySeatCoversSectionProps> = ({
  isAr = true,
  seats,
  loading = false,
  currentProducts,
  onSelectProduct,
  onOpenWhatsApp,
  onAddToCart,
  onViewAll,
  cardSelectedColors,
  setCardSelectedColors,
}) => {
  const [activeBrandTab, setActiveBrandTab] = useState<string>('all');
  const [activeMaterialTab, setActiveMaterialTab] = useState<string>('all');
  const [localSelectedColors, setLocalSelectedColors] = useState<Record<string, SeatColorOption>>({});
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  const filteredSeats = useMemo(() => {
    return seats.filter((product) => {
      if (activeBrandTab === 'toyota') {
        const isToyota =
          product.brand?.toLowerCase().includes('toyota') ||
          product.tags?.some(
            (t) =>
              t.toLowerCase().includes('toyota') ||
              t.includes('تويوتا') ||
              t.includes('كامري') ||
              t.includes('لاندكروزر') ||
              t.includes('برادو') ||
              t.includes('كورولا') ||
              t.includes('راف'),
          );
        if (!isToyota) return false;
      } else if (activeBrandTab === 'honda') {
        const isHonda =
          product.brand?.toLowerCase().includes('honda') ||
          product.tags?.some(
            (t) =>
              t.toLowerCase().includes('honda') ||
              t.includes('هوندا') ||
              t.includes('اكورد') ||
              t.includes('أكورد') ||
              t.includes('سيفيك'),
          );
        if (!isHonda) return false;
      } else if (activeBrandTab === 'gmc') {
        const isGMC =
          product.brand?.toLowerCase().includes('gmc') ||
          product.brand?.toLowerCase().includes('chevy') ||
          product.tags?.some(
            (t) =>
              t.toLowerCase().includes('gmc') ||
              t.includes('جمس') ||
              t.includes('يوكن') ||
              t.includes('تاهو') ||
              t.includes('شفروليه'),
          );
        if (!isGMC) return false;
      } else if (activeBrandTab === 'lexus-ford') {
        const isLexusOrFord =
          product.brand?.toLowerCase().includes('lexus') ||
          product.brand?.toLowerCase().includes('ford') ||
          product.tags?.some(
            (t) =>
              t.toLowerCase().includes('lexus') ||
              t.toLowerCase().includes('ford') ||
              t.includes('لكزس') ||
              t.includes('فورد') ||
              t.includes('ايفرست'),
          );
        if (!isLexusOrFord) return false;
      } else if (activeBrandTab === 'custom') {
        const isCustom =
          product.id.includes('custom') ||
          product.tags?.some((t) => t.includes('تفصيل') || t.includes('حسب الطلب') || t.includes('Custom'));
        if (!isCustom) return false;
      }

      if (activeMaterialTab === 'leather') {
        const isLeather =
          product.tags?.some((t) => t.includes('جلد') || t.toLowerCase().includes('leather')) ||
          product.name?.includes('جلد') ||
          product.nameAr?.includes('جلد');
        if (!isLeather) return false;
      } else if (activeMaterialTab === 'fabric') {
        const isFabric =
          product.tags?.some((t) => t.includes('قماش') || t.toLowerCase().includes('fabric')) ||
          product.name?.includes('قماش') ||
          product.nameAr?.includes('قماش');
        if (!isFabric) return false;
      }

      return true;
    });
  }, [seats, activeBrandTab, activeMaterialTab]);

  const handleColorSelect = (productId: string, color: SeatColorOption, e: React.MouseEvent) => {
    e.stopPropagation();
    if (setCardSelectedColors) {
      setCardSelectedColors((prev) => ({ ...prev, [productId]: color }));
    }
    setLocalSelectedColors((prev) => ({ ...prev, [productId]: color }));
  };

  const handleAddToCartWithFeedback = (product: Product, activeColor: SeatColorOption) => {
    onAddToCart(product, 1, activeColor);
    setAddedAnimationId(product.id);
    setTimeout(() => {
      setAddedAnimationId(null);
    }, 1800);
  };

  return (
    <section id="featured-seats-section" className="alsaeedi-section-soft alsaeedi-reveal space-y-5 pt-2 p-3 sm:p-5 overflow-x-clip overflow-y-visible">
      {/* Header */}
      <div className="flex flex-col gap-3 pb-3.5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2.5 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#faede4] text-[#915f3c] shadow-xs">
              <Palette className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="truncate">{isAr ? 'تلابيس المقاعد' : 'Seat Covers'}</span>
          </h3>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-500">
            {isAr
              ? 'اختر اللون والخامة — تفصيل حسب موديل سيارتك مع ضمان سنتين.'
              : 'Pick color and material — tailored to your car model with 2-year warranty.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex shrink-0 items-center gap-1 self-start py-1 text-xs font-bold text-slate-900 transition-colors hover:text-[#915f3c] cursor-pointer sm:self-auto"
        >
          <span>{isAr ? 'عرض الكل' : 'View all'}</span>
          {isAr ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Filters — stacked on mobile so chips never collide with labels */}
      <div className="space-y-3.5 alsaeedi-card-panel p-3 sm:p-4 bg-white shadow-xs rounded-2xl">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-0.5 text-[11px] font-black text-slate-700">
            <Car className="h-3.5 w-3.5 shrink-0 text-[#915f3c]" aria-hidden="true" />
            <span>{isAr ? 'اختر سيارتك' : 'Vehicle'}</span>
          </span>
          <div className="alsaeedi-chip-scroll -mx-0.5 flex items-center gap-2 overflow-x-auto px-0.5 pb-0.5">
            {BRAND_TABS.map((tab) => {
              const isActive = activeBrandTab === tab.id;
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveBrandTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-bold transition-all cursor-pointer sm:text-xs shadow-2xs ${
                    isActive
                      ? 'bg-[#915f3c] text-white shadow-sm'
                      : 'bg-[#faf7f4] text-slate-700 hover:bg-[#faede4] hover:text-[#915f3c]'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`}
                    aria-hidden="true"
                  />
                  <span className="sm:hidden">{isAr ? tab.shortAr : tab.shortEn}</span>
                  <span className="hidden sm:inline">{isAr ? tab.labelAr : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <span className="inline-flex items-center gap-1.5 px-0.5 text-[11px] font-black text-slate-700">
            <Layers className="h-3.5 w-3.5 shrink-0 text-[#915f3c]" aria-hidden="true" />
            <span>{isAr ? 'نوع الخامة' : 'Material'}</span>
          </span>
          <div className="alsaeedi-chip-scroll -mx-0.5 flex items-center gap-2 overflow-x-auto px-0.5 pb-0.5">
            {MATERIAL_TABS.map((mat) => {
              const isActive = activeMaterialTab === mat.id;
              return (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => setActiveMaterialTab(mat.id)}
                  className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-bold transition-all cursor-pointer sm:text-xs shadow-2xs ${
                    isActive
                      ? 'bg-[#faede4] font-black text-[#915f3c]'
                      : 'bg-[#faf7f4] text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="sm:hidden">{isAr ? mat.shortAr : mat.shortEn}</span>
                  <span className="hidden sm:inline">{isAr ? mat.labelAr : mat.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product cards */}
      {loading ? (
        <AlsaeediSeatGridSkeleton count={4} />
      ) : filteredSeats.length === 0 ? (
        <div className="space-y-3 alsaeedi-card rounded-3xl p-6 py-12 text-center">
          <Car className="mx-auto h-12 w-12 text-slate-300" />
          <h4 className="text-base font-bold text-slate-800">
            {isAr ? 'لا توجد تلابيس تطابق الفلتر المحدد حالياً' : 'No seat covers match this filter currently'}
          </h4>
          <p className="mx-auto max-w-md text-xs text-slate-500">
            {isAr
              ? 'يمكنك دائماً طلب تفصيل طقم ملكي خاص لسيارتك عبر خدمة التفصيل حسب الطلب أو عبر محادثة خبرائنا على الواتساب مباشرة.'
              : 'You can order custom bespoke covers for your vehicle model or chat with our experts on WhatsApp.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveBrandTab('all');
              setActiveMaterialTab('all');
            }}
            className="cursor-pointer rounded-full px-5 py-2 text-xs font-black shadow-md btn-bashayer-gold"
          >
            {isAr ? 'عرض كافة التلابيس المتاحة' : 'Show All Available Covers'}
          </button>
        </div>
      ) : (
        <AlsaeediInfiniteCarousel isAr={isAr} autoMs={4500} className="alsaeedi-stagger px-1">
          {filteredSeats.slice(0, 300).map((product) => {
            const liveProduct = currentProducts?.find((p) => p.id === product.id) || product;
            const productColors = getProductColors(liveProduct).slice(0, 3);
            const userColor = cardSelectedColors?.[liveProduct.id] || localSelectedColors[liveProduct.id];
            const activeColor = userColor || productColors[0];
            const currentImage = userColor ? userColor.image : liveProduct.image;
            const isBestSeller =
              liveProduct.tags?.includes('best seller') ||
              liveProduct.tags?.includes('الأكثر مبيعاً') ||
              liveProduct.id.includes('custom') ||
              liveProduct.id.includes('camry');
            const finalPrice = liveProduct.discountedPrice || liveProduct.price;
            const hasDiscount = !!(liveProduct.originalPrice && liveProduct.originalPrice > finalPrice);
            const discountPct = hasDiscount
              ? Math.round(((liveProduct.originalPrice! - finalPrice) / liveProduct.originalPrice!) * 100)
              : 0;
            const monthlyTabby = Math.round(finalPrice / 4);
            const isFabric =
              liveProduct.name?.includes('قماش') ||
              liveProduct.nameAr?.includes('قماش') ||
              liveProduct.tags?.includes('قماش');

            return (
              <article
                key={liveProduct.id}
                className="group alsaeedi-seat-card alsaeedi-reveal-scale relative flex h-full flex-col rounded-2xl border p-3"
              >
                <div
                  className="relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-gradient-to-b from-slate-100 to-white"
                  onClick={() => onSelectProduct(liveProduct, currentImage, activeColor)}
                >
                  <img
                    src={currentImage}
                    alt={liveProduct.nameAr || liveProduct.name}
                    className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />

                  <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col items-start gap-1">
                      {isBestSeller && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#f6c344] px-2 py-0.5 text-[9px] font-black text-slate-950 shadow-sm">
                          <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                          <span className="truncate">{isAr ? 'الأكثر طلباً' : 'Best'}</span>
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="inline-flex items-center rounded-full border border-rose-200/80 bg-rose-600/95 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                          {isAr ? `وفر ${liveProduct.originalPrice! - finalPrice} ⃁` : `Save ${liveProduct.originalPrice! - finalPrice} ⃁`}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex max-w-[42%] items-center gap-1 rounded-full border border-white/70 bg-white/95 px-2 py-0.5 text-[9px] font-bold text-slate-800 shadow-sm backdrop-blur-sm">
                      <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span className="truncate">{isAr ? 'ضمان سنتين' : '2Y Warranty'}</span>
                    </span>
                  </div>

                  <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex items-center justify-between gap-1.5">
                    <span className="inline-flex max-w-[48%] items-center gap-1 rounded-lg bg-slate-950/85 px-2 py-1 text-[9px] font-bold text-white">
                      <Wind className="h-3 w-3 shrink-0 text-emerald-300" aria-hidden="true" />
                      <span className="truncate">{isAr ? 'آمن مع الوسائد' : 'Airbag safe'}</span>
                    </span>
                    <span className="inline-flex max-w-[48%] items-center gap-1 rounded-lg bg-slate-950/85 px-2 py-1 text-[9px] font-bold text-[#f6c344]">
                      <Flame className="h-3 w-3 shrink-0 text-amber-300" aria-hidden="true" />
                      <span className="truncate">
                        {isFabric ? (isAr ? 'قماش ياباني' : 'Cool fabric') : isAr ? 'جلد ألماني' : 'German leather'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    {Number(liveProduct.reviewsCount || 0) > 0 && liveProduct.rating != null ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
                        <Star className="h-3.5 w-3.5 fill-[#d5a027] text-[#d5a027]" aria-hidden="true" />
                        {liveProduct.rating}
                        <span className="font-medium text-slate-400">({liveProduct.reviewsCount})</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        {isAr ? 'بانتظار التقييمات' : 'Waiting for reviews'}
                      </span>
                    )}
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      {isAr ? 'تفصيل وكالة' : 'OEM fit'}
                    </span>
                  </div>

                  <h4
                    onClick={() => onSelectProduct(liveProduct, currentImage, activeColor)}
                    className="min-h-[2.5rem] cursor-pointer text-xs font-bold leading-snug text-slate-900 line-clamp-2 hover:text-amber-800 sm:text-sm"
                  >
                    {isAr ? liveProduct.nameAr || liveProduct.name : liveProduct.nameEn || liveProduct.name}
                  </h4>

                  <p className="truncate text-[11px] text-slate-500">
                    {liveProduct.subtitle || (isAr ? 'مطابق لمقاس الوكالة' : 'OEM dimensions')}
                  </p>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <span className="truncate text-[11px] font-bold text-slate-600">
                      {isAr ? `اللون: ${activeColor?.nameAr || '—'}` : `Color: ${activeColor?.nameEn || '—'}`}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {productColors.map((c) => {
                        const isSelected = activeColor?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={(e) => handleColorSelect(liveProduct.id, c, e)}
                            className={`h-5 w-5 rounded-full border transition ${
                              isSelected
                                ? 'scale-110 border-white ring-2 ring-[#d5a027] ring-offset-1'
                                : 'border-slate-300 opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={isAr ? c.nameAr : c.nameEn}
                            aria-label={isAr ? c.nameAr : c.nameEn}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50/90 px-2.5 py-1.5 text-[10px]">
                    <span className="inline-flex min-w-0 items-center gap-1 font-bold text-slate-700">
                      <CreditCard className="h-3 w-3 shrink-0 text-amber-700" aria-hidden="true" />
                      <span className="truncate">{isAr ? `4 دفعات · ${monthlyTabby} ⃁` : `4× ${monthlyTabby} ⃁`}</span>
                    </span>
                    <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50/90 px-1.5 py-0.5 text-[9px] font-black text-amber-800">
                      {isAr ? 'تابي · تمارا' : 'Tabby · Tamara'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 pt-3">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-slate-900">{finalPrice}</span>
                      <span className="text-[11px] font-black text-[#915f3c]">⃁</span>
                    </div>
                    {hasDiscount && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 line-through">{liveProduct.originalPrice} ⃁</span>
                        <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600">
                          {isAr ? `خصم ${discountPct}%` : `-${discountPct}%`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(liveProduct, currentImage, activeColor)}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl bg-[#faede4] text-[#915f3c] transition hover:bg-[#915f3c] hover:text-white shadow-2xs"
                      title={isAr ? 'تخصيص' : 'Customize'}
                      aria-label={isAr ? 'تخصيص' : 'Customize'}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const customMsg = isAr
                          ? `مرحباً متجر السعيدي، أود الاستفسار عن تلبيسة المقاعد:\n*المنتج:* ${liveProduct.nameAr || liveProduct.name}\n*اللون:* ${activeColor?.nameAr || ''}\n*السعر:* ${finalPrice} ⃁`
                          : `Hello Al-Saeedi, seat cover inquiry:\n*Product:* ${liveProduct.nameEn || liveProduct.name}\n*Color:* ${activeColor?.nameEn || ''}\n*Price:* ${finalPrice} SAR`;
                        onOpenWhatsApp(liveProduct, activeColor, finalPrice, customMsg);
                      }}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl bg-emerald-600 text-white transition hover:bg-emerald-500 shadow-2xs"
                      title={isAr ? 'واتساب' : 'WhatsApp'}
                      aria-label={isAr ? 'واتساب' : 'WhatsApp'}
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddToCartWithFeedback(liveProduct, activeColor)}
                      className={`inline-flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1 rounded-2xl px-3 text-[11px] font-black transition shadow-2xs ${
                        addedAnimationId === liveProduct.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#915f3c] text-white hover:bg-[#7e5233]'
                      }`}
                      title={isAr ? 'إضافة للسلة' : 'Add to cart'}
                      aria-label={isAr ? 'إضافة للسلة' : 'Add to cart'}
                    >
                      {addedAnimationId === liveProduct.id ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <Plus className="h-4 w-4 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </AlsaeediInfiniteCarousel>
      )}

      <div className="grid grid-cols-2 gap-2.5 pt-1 sm:grid-cols-4 sm:gap-3">
        {[
          {
            icon: <Truck className="h-4 w-4" />,
            titleAr: 'شحن فوري سريع',
            titleEn: 'Fast shipping',
            subAr: 'لكل مدن المملكة',
            subEn: 'All KSA cities',
            tone: 'bg-sky-50 text-sky-700',
          },
          {
            icon: <Flame className="h-4 w-4" />,
            titleAr: 'عزل حراري صيفي',
            titleEn: 'Heat shield',
            subAr: 'يتحمل حتى 65°C',
            subEn: 'Up to 65°C',
            tone: 'bg-emerald-50 text-emerald-700',
          },
          {
            icon: <Wind className="h-4 w-4" />,
            titleAr: 'أمان الوسائد',
            titleEn: 'Airbag safe',
            subAr: 'فتحات ليزرية',
            subEn: 'Laser cutouts',
            tone: 'bg-amber-50 text-amber-800',
          },
          {
            icon: <ShieldCheck className="h-4 w-4" />,
            titleAr: 'ضمان سنتين',
            titleEn: '2-year warranty',
            subAr: 'راحة بال كاملة',
            subEn: 'Peace of mind',
            tone: 'bg-slate-100 text-slate-800',
          },
        ].map((item, i) => (
          <div key={i} className="alsaeedi-card-chip alsaeedi-reveal flex min-w-0 items-center gap-2.5 p-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>{item.icon}</div>
            <div className="min-w-0">
              <h5 className="truncate text-[11px] font-black text-slate-900">{isAr ? item.titleAr : item.titleEn}</h5>
              <p className="truncate text-[10px] text-slate-500">{isAr ? item.subAr : item.subEn}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const ModernLuxurySeatCoversSection = React.memo(ModernLuxurySeatCoversSectionComponent);
