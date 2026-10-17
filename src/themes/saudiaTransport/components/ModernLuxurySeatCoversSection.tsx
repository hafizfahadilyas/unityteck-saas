import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
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
  SlidersHorizontal,
  Check,
  CheckCircle2,
  Layers,
  Sparkle
} from 'lucide-react';
import { Product } from '../../../types';
import { SeatColorOption, SEAT_COLORS, getProductColors } from '../../../data/blecoStoreData';

interface ModernLuxurySeatCoversSectionProps {
  isAr?: boolean;
  seats: Product[];
  currentProducts?: Product[];
  onSelectProduct: (product: Product, currentImage?: string, activeColor?: SeatColorOption) => void;
  onOpenWhatsApp: (product: Product, selectedColor?: SeatColorOption, finalPrice?: number, customMsg?: string) => void;
  onAddToCart: (product: Product, qty: number, color?: SeatColorOption) => void;
  onViewAll: () => void;
  cardSelectedColors?: Record<string, SeatColorOption>;
  setCardSelectedColors?: React.Dispatch<React.SetStateAction<Record<string, SeatColorOption>>>;
}

// Brand categories for filter tabs
const BRAND_TABS = [
  { id: 'all', labelAr: 'الكل (جميع الموديلات)', labelEn: 'All Models', icon: '✨' },
  { id: 'toyota', labelAr: 'تويوتا (كامري / لاندكروزر)', labelEn: 'Toyota', icon: '🚗' },
  { id: 'honda', labelAr: 'هوندا (أكورد / سيفيك)', labelEn: 'Honda', icon: '🏎️' },
  { id: 'gmc', labelAr: 'جمس وشفروليه (يوكن / تاهو)', labelEn: 'GMC & Chevy', icon: '🚙' },
  { id: 'lexus-ford', labelAr: 'لكزس وفورد', labelEn: 'Lexus & Ford', icon: '💎' },
  { id: 'custom', labelAr: 'تفصيل VIP حسب الطلب', labelEn: 'Bespoke Custom', icon: '👑' },
];

const MATERIAL_TABS = [
  { id: 'all', labelAr: 'جميع الخامات', labelEn: 'All Materials' },
  { id: 'leather', labelAr: 'جلد ألماني نخب أول', labelEn: 'German Nappa Leather' },
  { id: 'fabric', labelAr: 'قماش ياباني صيفي بارد', labelEn: 'Cooling Japanese Fabric' },
];

// Clean WhatsApp Glyph
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

  // Filtered Seats list based on brand & material tabs
  const filteredSeats = useMemo(() => {
    return seats.filter(product => {
      // 1. Brand matching
      if (activeBrandTab === 'toyota') {
        const isToyota = product.brand?.toLowerCase().includes('toyota') || 
          product.tags?.some(t => t.toLowerCase().includes('toyota') || t.includes('تويوتا') || t.includes('كامري') || t.includes('لاندكروزر') || t.includes('برادو') || t.includes('كورولا') || t.includes('راف'));
        if (!isToyota) return false;
      } else if (activeBrandTab === 'honda') {
        const isHonda = product.brand?.toLowerCase().includes('honda') || 
          product.tags?.some(t => t.toLowerCase().includes('honda') || t.includes('هوندا') || t.includes('اكورد') || t.includes('أكورد') || t.includes('سيفيك'));
        if (!isHonda) return false;
      } else if (activeBrandTab === 'gmc') {
        const isGMC = product.brand?.toLowerCase().includes('gmc') || product.brand?.toLowerCase().includes('chevy') ||
          product.tags?.some(t => t.toLowerCase().includes('gmc') || t.includes('جمس') || t.includes('يوكن') || t.includes('تاهو') || t.includes('شفروليه'));
        if (!isGMC) return false;
      } else if (activeBrandTab === 'lexus-ford') {
        const isLexusOrFord = product.brand?.toLowerCase().includes('lexus') || product.brand?.toLowerCase().includes('ford') ||
          product.tags?.some(t => t.toLowerCase().includes('lexus') || t.toLowerCase().includes('ford') || t.includes('لكزس') || t.includes('فورد') || t.includes('ايفرست'));
        if (!isLexusOrFord) return false;
      } else if (activeBrandTab === 'custom') {
        const isCustom = product.id.includes('custom') || product.tags?.some(t => t.includes('تفصيل') || t.includes('حسب الطلب') || t.includes('Custom'));
        if (!isCustom) return false;
      }

      // 2. Material matching
      if (activeMaterialTab === 'leather') {
        const isLeather = product.tags?.some(t => t.includes('جلد') || t.toLowerCase().includes('leather')) ||
          product.name?.includes('جلد') || product.nameAr?.includes('جلد');
        if (!isLeather) return false;
      } else if (activeMaterialTab === 'fabric') {
        const isFabric = product.tags?.some(t => t.includes('قماش') || t.toLowerCase().includes('fabric')) ||
          product.name?.includes('قماش') || product.nameAr?.includes('قماش');
        if (!isFabric) return false;
      }

      return true;
    });
  }, [seats, activeBrandTab, activeMaterialTab]);

  const handleColorSelect = (productId: string, color: SeatColorOption, e: React.MouseEvent) => {
    e.stopPropagation();
    if (setCardSelectedColors) {
      setCardSelectedColors(prev => ({ ...prev, [productId]: color }));
    }
    setLocalSelectedColors(prev => ({ ...prev, [productId]: color }));
  };

  const handleAddToCartWithFeedback = (product: Product, activeColor: SeatColorOption) => {
    onAddToCart(product, 1, activeColor);
    setAddedAnimationId(product.id);
    setTimeout(() => {
      setAddedAnimationId(null);
    }, 1800);
  };

  return (
    <section id="featured-seats-section" className="space-y-6 pt-2">
      {/* ========================================================
          1. LUXURY HEADER WITH SAUDI AUTOMOTIVE TRUST AESTHETIC
          ======================================================== */}
      <div className="bg-gradient-to-r from-slate-950 via-[#180432] to-[#0d011c] rounded-3xl p-5 sm:p-7 text-white shadow-2xl border border-[#d5a027]/30 relative overflow-hidden">
        {/* Subtle Luxury Pattern Background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d5a027_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#d5a027]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#3e0f77]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Main Title & Badges */}
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#f6c344]/40 text-[#f6c344] text-xs font-black shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#f6c344] animate-pulse" />
              <span>{isAr ? 'الأكثر طلباً بالمملكة 🇸🇦 · تفصيل وكالة ليزري' : 'KSA Top Picks · Bespoke Laser Fit'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f6c344]" />
              <span className="text-white/90">{isAr ? 'ضمان ذهبي سنتين' : '2-Year Gold Warranty'}</span>
            </div>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Palette className="w-6 h-6 text-[#f6c344] shrink-0" />
              <span>{isAr ? 'تلابيس مقاعد السيارات الملكية — راحة ورفاهية الدرجة الأولى' : 'VIP Bespoke Seat Covers — First-Class Cabin Comfort'}</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {isAr 
                ? 'جلد ألماني نخب أول معالج حرارياً وقماش ياباني بارد مسامي مضاد للحرارة والتعرق · مطابقة تامة لمقاييس الوكالة مع أمان كامل للوسائد الهوائية (Airbag Safe 100%) وتثبيت ليزري محكم بدون فك مقاعد الوكالة.'
                : 'Heat-resistant German Nappa leather & cooling Japanese breathable fabric · 100% factory OEM fit with full airbag deployment safety and 2-year warranty.'}
            </p>

            {/* Quick Saudi Trust Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold text-amber-200">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-[#f6c344]" />
                <span>{isAr ? 'ضمان شامل سنتين' : '2-Year Warranty'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>{isAr ? 'آمن 100% مع الوسائد الهوائية (Airbag)' : 'Airbag Safe'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'مقاوم لحرارة الصيف حتى 65°C' : 'Summer Heat Resistant'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                <Car className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'شحن سريع لكافة مناطق المملكة' : 'Fast KSA Delivery'}</span>
              </span>
            </div>
          </div>

          {/* Action CTA View All */}
          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={onViewAll}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-[#d5a027] via-[#f6c344] to-[#d5a027] text-[#120224] text-xs font-black shadow-lg shadow-[#d5a027]/25 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border border-[#f6c344]"
            >
              <span>{isAr ? 'تصفح الفلتر والكتالوج الكامل' : 'Full Filter Catalog'}</span>
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. INTERACTIVE FILTER TABS (Brand & Material Navigation)
          ======================================================== */}
      <div className="space-y-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        {/* Brand Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-black text-slate-700 shrink-0 flex items-center gap-1 px-1">
            <Car className="w-3.5 h-3.5 text-[#3e0f77]" />
            <span>{isAr ? 'اختر سيارتك:' : 'Vehicle:'}</span>
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
            {BRAND_TABS.map(tab => {
              const isActive = activeBrandTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveBrandTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#16032e] to-[#3e0f77] text-white shadow-md shadow-[#3e0f77]/20 border border-[#d5a027]/60'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Material Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-black text-slate-700 shrink-0 flex items-center gap-1 px-1">
            <Layers className="w-3.5 h-3.5 text-[#d5a027]" />
            <span>{isAr ? 'نوع الخامة:' : 'Material:'}</span>
          </span>
          <div className="flex items-center gap-2">
            {MATERIAL_TABS.map(mat => {
              const isActive = activeMaterialTab === mat.id;
              return (
                <button
                  key={mat.id}
                  onClick={() => setActiveMaterialTab(mat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {isAr ? mat.labelAr : mat.labelEn}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================
          3. LUXURY SEAT COVERS CARDS GRID (100% Mobile Responsive)
          ======================================================== */}
      {filteredSeats.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
          <Car className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">
            {isAr ? 'لا توجد تلابيس تطابق الفلتر المحدد حالياً' : 'No seat covers match this filter currently'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAr 
              ? 'يمكنك دائماً طلب تفصيل طقم ملكي خاص لسيارتك عبر خدمة التفصيل حسب الطلب أو عبر محادثة خبرائنا على الواتساب مباشرة.'
              : 'You can order custom bespoke covers for your vehicle model or chat with our experts on WhatsApp.'}
          </p>
          <button
            onClick={() => {
              setActiveBrandTab('all');
              setActiveMaterialTab('all');
            }}
            className="px-5 py-2 rounded-full btn-bashayer-gold text-xs font-black cursor-pointer shadow-md"
          >
            {isAr ? 'عرض كافة التلابيس المتاحة' : 'Show All Available Covers'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredSeats.map(product => {
            const liveProduct = currentProducts?.find(p => p.id === product.id) || product;
            const productColors = getProductColors(liveProduct).slice(0, 3);
            const userColor = cardSelectedColors?.[liveProduct.id] || localSelectedColors[liveProduct.id];
            const activeColor = userColor || productColors[0];
            const currentImage = userColor ? userColor.image : liveProduct.image;
            const isBestSeller = liveProduct.tags?.includes('best seller') || liveProduct.tags?.includes('الأكثر مبيعاً') || liveProduct.id.includes('custom') || liveProduct.id.includes('camry');
            const finalPrice = liveProduct.discountedPrice || liveProduct.price;
            const hasDiscount = liveProduct.originalPrice && liveProduct.originalPrice > finalPrice;
            const discountAmt = hasDiscount ? (liveProduct.originalPrice! - finalPrice) : 0;
            const discountPct = hasDiscount ? Math.round((discountAmt / liveProduct.originalPrice!) * 100) : 0;
            const monthlyTabby = Math.round(finalPrice / 4);

            const isFabric = liveProduct.name?.includes('قماش') || liveProduct.nameAr?.includes('قماش') || liveProduct.tags?.includes('قماش');

            return (
              <div 
                key={liveProduct.id}
                className="group relative bg-gradient-to-b from-[#180432] via-[#120224] to-[#0c0119] rounded-3xl p-4 sm:p-4.5 border border-[#3e0f77]/70 shadow-[0_4px_20px_-4px_rgba(22,3,46,0.25)] hover:shadow-[0_20px_45px_-10px_rgba(213,160,39,0.3)] hover:border-[#d5a027] transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Subtle Ambient Golden Glow on Hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 group-hover:bg-[#d5a027]/15 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />

                <div className="relative z-10">
                  {/* 1. SHOWCASE IMAGE FRAME WITH BADGES & HOVER OVERLAY */}
                  <div 
                    className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/10 cursor-pointer shadow-inner"
                    onClick={() => onSelectProduct(liveProduct, currentImage, activeColor)}
                  >
                    <img 
                      src={currentImage} 
                      alt={liveProduct.nameAr || liveProduct.name} 
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      loading="lazy"
                      decoding="async"
                    />

                    {/* Top-Right Badge: Car Brand */}
                    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 z-10 items-end">
                      <span className="bg-[#16032e]/95 text-[#f6c344] text-[10.5px] font-black px-2.5 py-1 rounded-full shadow-md border border-[#f6c344]/40 flex items-center gap-1 backdrop-blur-xs">
                        <Car className="w-2.5 h-2.5 text-[#f6c344]" />
                        <span>{liveProduct.brand || (isAr ? 'سيارات فاخرة' : 'Automotive')}</span>
                      </span>
                    </div>

                    {/* Top-Left Badges: Best Seller & Warranty & Savings */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 items-start">
                      {isBestSeller && (
                        <span className="bg-amber-400 text-slate-950 text-[9.5px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                          <span>{isAr ? 'الأكثر طلباً' : 'Best Seller'}</span>
                        </span>
                      )}
                      <span className="bg-emerald-700/95 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-emerald-400/30">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>{isAr ? 'ضمان سنتين' : '2Y Warranty'}</span>
                      </span>
                      {hasDiscount && (
                        <span className="bg-rose-600/95 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs border border-rose-400/40">
                          {isAr ? `وفر ${discountAmt} ر.س` : `Save ${discountAmt} SAR`}
                        </span>
                      )}
                    </div>

                    {/* Bottom Image Indicators: Material & Airbag Safe */}
                    <div className="absolute bottom-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
                      <span className="bg-slate-950/90 text-white text-[9.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/10 backdrop-blur-xs">
                        <Wind className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{isAr ? 'آمن مع الإيرباق 100%' : 'Airbag Safe'}</span>
                      </span>
                      <span className="bg-slate-950/90 text-[#f6c344] text-[9.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-400/30 backdrop-blur-xs">
                        <Flame className="w-2.5 h-2.5 text-amber-300" />
                        <span>{isFabric ? (isAr ? 'قماش ياباني بارد' : 'Cooling Fabric') : (isAr ? 'جلد ألماني عازل' : 'German Leather')}</span>
                      </span>
                    </div>
                  </div>

                  {/* 2. CARD CONTENT (RTL Arabic First) */}
                  <div className="pt-3.5 space-y-2">
                    {/* Star Rating & Reviews */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-[#f6c344] text-[#f6c344]" />
                        <span className="font-black text-white">{liveProduct.rating || 5.0}</span>
                        <span className="text-[10.5px] text-slate-300 font-medium">({liveProduct.reviewsCount || 140} {isAr ? 'تقييم موثق' : 'reviews'})</span>
                      </div>
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{isAr ? 'تفصيل ليزري وكالة' : 'OEM Fit'}</span>
                      </span>
                    </div>

                    {/* Product Title */}
                    <h4 
                      onClick={() => onSelectProduct(liveProduct, currentImage, activeColor)}
                      className="font-bold text-white text-xs sm:text-sm hover:text-[#f6c344] transition-colors line-clamp-2 cursor-pointer leading-snug min-h-[2.5rem]"
                    >
                      {isAr ? (liveProduct.nameAr || liveProduct.name) : (liveProduct.nameEn || liveProduct.name)}
                    </h4>

                    {/* Subtitle Value Prop */}
                    <p className="text-[11px] text-slate-300 line-clamp-1 flex items-center gap-1 font-medium">
                      <span className="text-[#f6c344]">•</span>
                      <span>{liveProduct.subtitle || (isAr ? 'مطابق لأبعاد الوكالة مع عزل حراري فائق' : 'OEM dimensions with heat insulation')}</span>
                    </p>

                    {/* Interactive 3 Color Swatches with Authentic Arabic Label */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[11px] text-amber-200 font-bold line-clamp-1">
                        {isAr ? `اللون: ${activeColor.nameAr}` : `Color: ${activeColor.nameEn}`}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {productColors.map(c => {
                          const isSelected = activeColor?.id === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={(e) => handleColorSelect(liveProduct.id, c, e)}
                              className={`w-5 h-5 rounded-full transition-all duration-200 cursor-pointer border ${
                                isSelected 
                                  ? 'ring-2 ring-[#d5a027] ring-offset-2 ring-offset-[#120224] scale-115 border-white shadow-md' 
                                  : 'border-white/40 opacity-80 hover:opacity-100 hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={isAr ? c.nameAr : c.nameEn}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Tabby & Tamara Installment Pill Banner */}
                    <div className="py-1.5 px-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[10px]">
                      <span className="text-amber-200 font-bold flex items-center gap-1">
                        <span>💳</span>
                        <span>
                          {isAr ? `أو 4 دفعات بقيمة ${monthlyTabby} ر.س` : `Or 4 payments of ${monthlyTabby} SAR`}
                        </span>
                      </span>
                      <span className="text-[#f6c344] font-black text-[9px] bg-white/10 px-1.5 py-0.5 rounded-md border border-[#f6c344]/30 shadow-2xs">
                        {isAr ? 'تابي · تمارا' : 'Tabby / Tamara'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. PRICE & ACTIONS BAR */}
                <div className="relative z-10 pt-3 border-t border-white/10 mt-3 flex items-center justify-between gap-1.5">
                  {/* Pricing */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base sm:text-lg font-black text-white">
                        {finalPrice}
                      </span>
                      <span className="text-[11px] font-black text-[#f6c344]">
                        {isAr ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                    {hasDiscount && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 line-through font-medium">
                          {liveProduct.originalPrice} {isAr ? 'ر.س' : 'SAR'}
                        </span>
                        <span className="text-[9.5px] font-bold text-rose-300 bg-rose-950/80 px-1 py-0.2 rounded border border-rose-500/30">
                          {isAr ? `خصم ${discountPct}%` : `-${discountPct}%`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions: View Details, WhatsApp, Add to Cart */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {/* View Details / Customize Button */}
                    <button 
                      onClick={() => onSelectProduct(liveProduct, currentImage, activeColor)}
                      className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#f6c344] font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 border border-[#f6c344]/30"
                      title={isAr ? 'معاينة وتخصيص المقاس' : 'Customize & Preview'}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline text-[11px]">{isAr ? 'تخصيص' : 'Customize'}</span>
                    </button>

                    {/* WhatsApp Quick Order Button */}
                    <button 
                      onClick={() => {
                        const customMsg = isAr
                          ? `مرحباً متجر السعيدي، أود الاستفسار والطلب عن تلبيسة المقاعد:\n*المنتج:* ${liveProduct.nameAr || liveProduct.name}\n*اللون المختار:* ${activeColor.nameAr}\n*السعر:* ${finalPrice} ر.س\n*المطلوب:* تفصيل ليزري لموديل سيارتي.`
                          : `Hello Al-Saeedi Car Services, I want to order Seat Covers:\n*Product:* ${liveProduct.nameEn || liveProduct.name}\n*Color:* ${activeColor.nameEn}\n*Price:* ${finalPrice} SAR\n*Request:* Laser tailored for my vehicle model.`;
                        onOpenWhatsApp(liveProduct, activeColor, finalPrice, customMsg);
                      }}
                      className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      title={isAr ? 'طلب واتساب فوري' : 'WhatsApp Order'}
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline text-[11px]">{isAr ? 'واتساب' : 'WhatsApp'}</span>
                    </button>

                    {/* Add to Cart Button */}
                    <button 
                      onClick={() => handleAddToCartWithFeedback(liveProduct, activeColor)}
                      className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                        addedAnimationId === liveProduct.id
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'btn-bashayer-gold'
                      }`}
                      title={isAr ? 'إضافة للسلة' : 'Add to Cart'}
                    >
                      {addedAnimationId === liveProduct.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">{isAr ? 'تمت الإضافة' : 'Added'}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">{isAr ? 'للسلة' : 'Add'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          4. BOTTOM TRUST HIGHLIGHTS BAR (Saudi Automotive Quality)
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#3e0f77] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#3e0f77]" />
          </div>
          <div>
            <h5 className="text-[11px] font-black text-slate-800">{isAr ? 'ضمان ذهبي سنتين' : '2-Year Warranty'}</h5>
            <p className="text-[9.5px] text-slate-500">{isAr ? 'ضد التقشر والبهتان' : 'Anti-peeling & fading'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#d5a027] flex items-center justify-center shrink-0">
            <Wind className="w-4 h-4 text-[#d5a027]" />
          </div>
          <div>
            <h5 className="text-[11px] font-black text-slate-800">{isAr ? 'أمان الوسائد الهوائية' : 'Airbag Safe 100%'}</h5>
            <p className="text-[9.5px] text-slate-500">{isAr ? 'فتحات أمان ليزرية' : 'Precision laser deployment'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h5 className="text-[11px] font-black text-slate-800">{isAr ? 'عزل حراري صيفي' : 'Saudi Heat Shield'}</h5>
            <p className="text-[9.5px] text-slate-500">{isAr ? 'يتحمل حتى 65°C' : 'Withstands up to 65°C'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Car className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h5 className="text-[11px] font-black text-slate-800">{isAr ? 'شحن فوري سريع' : 'Fast KSA Shipping'}</h5>
            <p className="text-[9.5px] text-slate-500">{isAr ? 'لباب منزلك في المملكة' : 'To your doorstep in KSA'}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ModernLuxurySeatCoversSection = React.memo(ModernLuxurySeatCoversSectionComponent);
