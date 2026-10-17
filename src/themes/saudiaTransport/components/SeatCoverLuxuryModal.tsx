import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Star, 
  CheckCircle, 
  CheckCircle2,
  ShieldCheck, 
  Truck, 
  ShoppingBag, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Sparkles, 
  Award, 
  Maximize2, 
  Layers, 
  Check, 
  Lock, 
  Car,
  ChevronRight,
  ChevronLeft,
  Flame,
  Clock,
  MapPin,
  Info,
  ChevronDown,
  Wrench,
  Percent
} from 'lucide-react';
import { Product } from '../../../types';
import { 
  CAR_BRANDS, 
  CAR_MODELS_MAP, 
  SEAT_COLORS, 
  SeatColorOption, 
  PRODUCT_PATTERNS,
  ProductPatternOption,
  BLECO_BUNDLE_ADDON,
  BLECO_STORE_INFO 
} from '../../../data/blecoStoreData';

export interface SeatCoverCustomSpecs {
  color: SeatColorOption;
  material: 'leather' | 'fabric' | 'diamond';
  materialNameAr: string;
  materialNameEn: string;
  seats: '2_seats' | '5_seats' | '7_seats';
  seatsLabelAr: string;
  seatsLabelEn: string;
  coverage?: 'full' | 'front_only';
  coverageNameAr?: string;
  coverageNameEn?: string;
  pattern: 'triangles' | 'diamond' | 'laser' | 'luxury';
  patternNameAr: string;
  includeBundle: boolean;
  bundlePrice: number;
  brand: string;
  brandNameAr: string;
  model: string;
  year: string;
  customerNote?: string;
  unitPrice: number;
  totalPrice: number;
}

interface SeatCoverLuxuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  isAr?: boolean;
  defaultMake?: string;
  defaultModel?: string;
  defaultYear?: string;
  onAddToCart: (
    product: Product, 
    quantity: number, 
    color: SeatColorOption, 
    material: string, 
    coverage: string, 
    unitPrice: number,
    customSpecs?: any
  ) => void;
  onDirectBuy: (
    product: Product, 
    quantity: number, 
    color: SeatColorOption, 
    material: string, 
    coverage: string, 
    unitPrice: number,
    customSpecs?: any
  ) => void;
  onWhatsAppOrder: (
    product: Product, 
    color: SeatColorOption, 
    price: number, 
    customMessage?: string
  ) => void;
}

// WhatsApp Icon SVG
function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export const SeatCoverLuxuryModal: React.FC<SeatCoverLuxuryModalProps> = ({
  isOpen,
  onClose,
  product,
  isAr = true,
  defaultMake = 'toyota',
  defaultModel = 'كامري',
  defaultYear = '2025',
  onAddToCart,
  onDirectBuy,
  onWhatsAppOrder
}) => {
  // ESC listener & body overflow
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

  // All 9 Stitched Authentic Colors from catalog
  const availableColors = useMemo(() => {
    return SEAT_COLORS;
  }, []);

  // State Management
  const [selectedColor, setSelectedColor] = useState<SeatColorOption>(SEAT_COLORS[0]);
  const [activeGalleryImg, setActiveGalleryImg] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<'leather' | 'fabric' | 'diamond'>('leather');
  const [selectedSeats, setSelectedSeats] = useState<'2_seats' | '5_seats' | '7_seats'>('5_seats');
  const [selectedPattern, setSelectedPattern] = useState<'triangles' | 'diamond' | 'laser' | 'luxury'>('triangles');
  const [includeBundle, setIncludeBundle] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedBrand, setSelectedBrand] = useState<string>(defaultMake || 'toyota');
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel || 'كامري');
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear || '2025');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Sync defaults on open/product change
  useEffect(() => {
    if (product) {
      setSelectedColor(SEAT_COLORS[0]);
      setActiveGalleryImg(null);
      setQuantity(1);
      setSelectedSeats('5_seats');
      setSelectedPattern('triangles');
      setIncludeBundle(false);
      setAddedSuccess(false);

      if (product.brand) {
        setSelectedBrand(product.brand.toLowerCase());
      } else if (defaultMake && defaultMake !== 'all') {
        setSelectedBrand(defaultMake.toLowerCase());
      }
      if (defaultModel && defaultModel !== 'all') {
        setSelectedModel(defaultModel);
      }
      if (defaultYear && defaultYear !== 'all') {
        setSelectedYear(defaultYear);
      }
    }
  }, [product, defaultMake, defaultModel, defaultYear]);

  // Brand and Models map
  const brandObj = useMemo(() => {
    return CAR_BRANDS.find(b => b.nameEn.toLowerCase() === selectedBrand.toLowerCase() || b.id === selectedBrand) || CAR_BRANDS[0];
  }, [selectedBrand]);

  const brandModels = useMemo(() => {
    return CAR_MODELS_MAP[selectedBrand] || CAR_MODELS_MAP['toyota'] || [];
  }, [selectedBrand]);

  // Handle color change -> updates preview image
  const handleColorChange = (col: SeatColorOption) => {
    setSelectedColor(col);
    if (col.image) {
      setActiveGalleryImg(col.image);
    }
  };

  // Seats labels
  const seatsLabels = {
    '2_seats': { ar: 'مقعدين (غمارتين / بيك أب)', en: '2 Seats (Single Cab / Pickup)' },
    '5_seats': { ar: '٥ مقاعد (سيدان / جيب صغير)', en: '5 Seats (Sedan / Standard)' },
    '7_seats': { ar: '٧ مقاعد (3 صفوف عائلية)', en: '7 Seats (3-Row Family SUV)' },
  };

  const patternLabels = {
    'triangles': { ar: 'تلبيسة المثلثات 5D', en: '5D Triangles' },
    'diamond': { ar: 'تطريز الدايموند الملكي', en: 'Royal Diamond' },
    'laser': { ar: 'قص الليزر الدقيق', en: 'Laser Cut' },
    'luxury': { ar: 'الفاخر الأوروبي', en: 'Luxury Striped' },
  };

  // Price Calculation
  const unitPrice = useMemo(() => {
    if (!product) return 590;
    let base = product.discountedPrice || product.price || 590;
    
    // Seat count adjustments
    if (selectedSeats === '2_seats') base = Math.max(290, base - 90);
    else if (selectedSeats === '7_seats') base += 80;

    // Material adjustments
    if (selectedMaterial === 'fabric') base = Math.max(290, base - 70);
    else if (selectedMaterial === 'diamond') base += 120;

    // Bundle addon
    if (includeBundle) base += BLECO_BUNDLE_ADDON.price;

    return Math.round(base);
  }, [product, selectedSeats, selectedMaterial, includeBundle]);

  const totalPrice = unitPrice * quantity;
  const originalPrice = Math.round(unitPrice * 1.25);
  const tabbyInstallment = (totalPrice / 4).toFixed(2);

  if (!isOpen || !product) return null;

  // Active Display Image
  const currentImage = activeGalleryImg || selectedColor?.image || product.image;

  // Material and Seats labels
  const materialLabelAr = selectedMaterial === 'fabric' ? 'قماش ياباني بارد مسامي' : selectedMaterial === 'diamond' ? 'جلد دايموند مطرز VIP' : 'جلد ألماني فاخر نابا';
  const materialLabelEn = selectedMaterial === 'fabric' ? 'Cooling Japanese Fabric' : selectedMaterial === 'diamond' ? 'VIP Quilted Diamond Leather' : 'Premium German Nappa Leather';
  const seatsLabelAr = seatsLabels[selectedSeats].ar;
  const seatsLabelEn = seatsLabels[selectedSeats].en;
  const patternNameAr = patternLabels[selectedPattern].ar;

  // Handle Add to Cart
  const handleAddToCart = () => {
    const customSpecs: SeatCoverCustomSpecs = {
      color: selectedColor,
      material: selectedMaterial,
      materialNameAr: materialLabelAr,
      materialNameEn: materialLabelEn,
      seats: selectedSeats,
      seatsLabelAr,
      seatsLabelEn,
      pattern: selectedPattern,
      patternNameAr,
      includeBundle,
      bundlePrice: includeBundle ? BLECO_BUNDLE_ADDON.price : 0,
      brand: selectedBrand,
      brandNameAr: brandObj ? (isAr ? brandObj.nameAr : brandObj.nameEn) : selectedBrand.toUpperCase(),
      model: selectedModel,
      year: selectedYear,
      customerNote: customerNote.trim() || undefined,
      unitPrice,
      totalPrice
    };

    onAddToCart(
      product,
      quantity,
      selectedColor,
      materialLabelAr,
      seatsLabelAr,
      unitPrice,
      customSpecs
    );

    // Show visual checkmark animation
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 900);
  };

  // Handle Direct Buy
  const handleDirectBuy = () => {
    const customSpecs: SeatCoverCustomSpecs = {
      color: selectedColor,
      material: selectedMaterial,
      materialNameAr: materialLabelAr,
      materialNameEn: materialLabelEn,
      seats: selectedSeats,
      seatsLabelAr,
      seatsLabelEn,
      pattern: selectedPattern,
      patternNameAr,
      includeBundle,
      bundlePrice: includeBundle ? BLECO_BUNDLE_ADDON.price : 0,
      brand: selectedBrand,
      brandNameAr: brandObj ? (isAr ? brandObj.nameAr : brandObj.nameEn) : selectedBrand.toUpperCase(),
      model: selectedModel,
      year: selectedYear,
      customerNote: customerNote.trim() || undefined,
      unitPrice,
      totalPrice
    };

    onDirectBuy(
      product,
      quantity,
      selectedColor,
      materialLabelAr,
      seatsLabelAr,
      unitPrice,
      customSpecs
    );
    onClose();
  };

  // WhatsApp Order
  const handleWhatsApp = () => {
    const brandName = brandObj ? (isAr ? brandObj.nameAr : brandObj.nameEn) : selectedBrand.toUpperCase();
    const carFull = `${brandName} ${selectedModel} ${selectedYear}`.trim();
    const bundleText = includeBundle ? (isAr ? ' + بكج ملمع بلاكو المخفض' : ' + Bleco Polish Bundle') : '';
    const customMsg = isAr
      ? `مرحباً متجر السعيدي لتنجيد السيارات بمكة، أرغب بطلب "${patternNameAr} - ${product.nameAr || product.name}" لسيارة (${carFull}) باللون (${selectedColor.nameAr})، عدد المقاعد (${seatsLabelAr})، خامة (${materialLabelAr})${bundleText}، الكمية (${quantity})، بسعر (${totalPrice} ر.س شامل الضريبة والضمان). يرجى تأكيد توافر المقاسات وموعد التفصيل والشحن.`
      : `Hello Al-Saeedi Car Upholstery Makkah, I would like to order "${patternLabels[selectedPattern].en} - ${product.nameEn || product.name}" for vehicle (${carFull}) in color (${selectedColor.nameEn}), (${seatsLabelEn}), material (${materialLabelEn})${bundleText}, quantity (${quantity}), at total (${totalPrice} SAR). Please confirm fitment and delivery.`;
    
    onWhatsAppOrder(product, selectedColor, unitPrice, customMsg);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button 
            onClick={() => setIsLightboxOpen(false)} 
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={currentImage} 
            alt="zoom view" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" 
          />
        </div>
      )}

      {/* Main Customizer Modal Box */}
      <div className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-[#d5a027]/40 my-auto flex flex-col max-h-[94vh] animate-scaleIn">
        
        {/* Luxury Top Header Bar */}
        <div className="bg-gradient-to-r from-[#17032d] via-[#2d0954] to-[#3e0f77] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#d5a027]/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d5a027] to-[#f6c344] p-0.5 shrink-0 shadow-md">
              <div className="w-full h-full bg-[#1b0433] rounded-[14px] flex items-center justify-center">
                <Car className="w-5 h-5 text-[#f6c344]" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-white truncate">
                  {isAr ? (patternNameAr || product.nameAr || product.name) : (product.nameEn || product.name)}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{isAr ? 'مطابقة ليزرية 100%' : '100% Laser Fit'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-[#f6c344]" />
                  <span>{isAr ? 'ضمان سنتين' : '2-Yr Warranty'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-2">
                <span className="text-[#f6c344] font-bold">{isAr ? 'متجر السعيدي — تنجيد مكة' : 'Al-Saeedi Car Upholstery Makkah'}</span>
                <span>•</span>
                <span>{isAr ? 'جلد صناعي 11 مل صديق للبيئة' : 'Eco Synthetic Leather 11mm'}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-slate-800">
          
          {/* ================= LEFT COLUMN: IMAGES & SASO DETAILED SPECS (5 COLS) ================= */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Main Interactive Showcase Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md group">
              <img 
                src={currentImage} 
                alt={product.name} 
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              />

              {/* Lightbox expand button */}
              <button 
                onClick={() => setIsLightboxOpen(true)}
                className="absolute top-3 left-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-xl backdrop-blur-sm transition-all cursor-pointer"
                title={isAr ? 'تكبير الصورة' : 'Zoom Image'}
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Current Selected Color & Stitching Tag */}
              <div className="absolute bottom-3 inset-x-3 bg-black/75 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md border border-white/50 shadow-inner flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: selectedColor.hex }}>
                    {selectedColor.stitchHex && (
                      <span className="w-2 h-2 rounded-full border border-black/30" style={{ backgroundColor: selectedColor.stitchHex }} />
                    )}
                  </div>
                  <span className="font-bold text-[11px] text-white">
                    {isAr ? selectedColor.nameAr : selectedColor.nameEn}
                  </span>
                </div>
                <span className="text-[10px] text-[#f6c344] font-black">
                  {seatsLabels[selectedSeats].ar}
                </span>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {product.galleryUrls && product.galleryUrls.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-1">
                  <span>{isAr ? 'ألبوم صور التفصيل والخياطة:' : 'Product Gallery Photos:'}</span>
                  <span className="text-[#3e0f77]">{product.galleryUrls.length} {isAr ? 'صور' : 'photos'}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.galleryUrls.map((imgUrl, idx) => {
                    const isCur = currentImage === imgUrl;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveGalleryImg(imgUrl)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          isCur ? 'border-[#d5a027] ring-2 ring-[#d5a027]/40 scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt={`gallery-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Official SASO 5-Layer Technical Specs List (Matching original screenshot) */}
            <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                <h5 className="font-black text-slate-900 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#d5a027]" />
                  <span>{isAr ? 'مواصفات الجودة المعتمدة SASO:' : 'SASO Certified Specifications:'}</span>
                </h5>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
                  {isAr ? 'منتج وطني 🇸🇦' : 'Saudi National'}
                </span>
              </div>

              <ul className="space-y-1.5 text-[11px] text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-black shrink-0 mt-0.5">●</span>
                  <span>{isAr ? 'جلد صناعي صديق للبيئة عالي التحمل' : 'Eco-friendly heavy-duty synthetic leather'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-black shrink-0 mt-0.5">●</span>
                  <span>{isAr ? 'السمك: 11 مل أصلي مضاعف' : 'Thickness: 11mm ultra-cushioned'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-black shrink-0 mt-0.5">●</span>
                  <span>{isAr ? 'الطبقات: 5 طبقات متكاملة (جلد + إسفنج + بلاستيك + لباد + بلاستيك مانع للانزلاق)' : '5 Advanced Armor Layers (Leather + Foam + Barrier + Felt + Anti-slip)'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-black shrink-0 mt-0.5">●</span>
                  <span>{isAr ? 'عازلة للمياه والسوائل ومقاومة للحرارة حتى 55°C' : '100% Waterproof & heat-resistant up to 55°C'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-black shrink-0 mt-0.5">●</span>
                  <span>{isAr ? 'سهولة الفك والتركيب بدون الحاجة لفك براغي الوكالة' : 'Easy DIY install & removal without drilling'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-black shrink-0 mt-0.5">●</span>
                  <span>{isAr ? 'مصممة بحيث لا تؤثر على حركة المقاعد أو مكابس الفرامل والبنزين' : 'Safety engineered not to obstruct pedals or seat tracks'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-black shrink-0 mt-0.5">●</span>
                  <span>{isAr ? 'مطابقة لمواصفات الهيئة السعودية للمواصفات والمقاييس والجودة SASO' : 'Fully compliant with SASO Saudi Standards'}</span>
                </li>
              </ul>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: INTERACTIVE CUSTOMIZER SPECS (7 COLS) ================= */}
          <div className="lg:col-span-7 space-y-4">

            {/* 1. إختر اللون (CHOOSE COLOR) — 9 Dual Stitched Authentic Colors Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <label className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#d5a027]" />
                  <span>{isAr ? 'إختر اللون (تطريز فخم نخب أول):' : 'Choose Color & Stitching:'}</span>
                </label>
                <span className="text-[11px] font-bold text-[#3e0f77] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  {isAr ? selectedColor.nameAr : selectedColor.nameEn}
                </span>
              </div>

              {/* 9 Colors in 3 Columns / 2-3 Rows Tile Layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableColors.map(c => {
                  const isSelected = selectedColor.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleColorChange(c)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-start ${
                        isSelected 
                          ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50/70 shadow-sm scale-[1.02]' 
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Swatch folder-like icon */}
                      <div 
                        className="w-7 h-7 rounded-lg border border-black/20 shadow-xs flex items-center justify-center shrink-0 relative overflow-hidden" 
                        style={{ backgroundColor: c.hex }}
                      >
                        {c.stitchHex && (
                          <div 
                            className="w-2.5 h-2.5 rounded-full border border-black/30 shadow-xs" 
                            style={{ backgroundColor: c.stitchHex }}
                            title={`Stitch: ${c.stitchHex}`}
                          />
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-900 block truncate leading-tight">
                          {isAr ? c.nameAr : c.nameEn}
                        </span>
                        <span className="text-[9px] text-slate-500 block truncate">
                          {isSelected ? (isAr ? '✓ محدد حالياً' : 'Selected') : (isAr ? 'تطريز وكالة' : 'OEM Match')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. عدد المقاعد (NUMBER OF SEATS) — 3 Large Visual Vehicle Cards */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-[#d5a027]" />
                  <span>{isAr ? 'عدد المقاعد:' : 'Number of Seats:'}</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {seatsLabels[selectedSeats].ar}
                </span>
              </div>

              {/* 3 Visual Vehicle Selector Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Option A: مقعدين (2 Seats / Single cab) */}
                <button
                  type="button"
                  onClick={() => setSelectedSeats('2_seats')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    selectedSeats === '2_seats'
                      ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50 shadow-md scale-[1.02]'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-7 rounded-lg flex items-center justify-center ${selectedSeats === '2_seats' ? 'text-[#3e0f77]' : 'text-slate-400'}`}>
                    <Truck className="w-7 h-7" />
                  </div>
                  <span className="font-black text-xs text-slate-900">{isAr ? 'مقعدين' : '2 Seats'}</span>
                  <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    {isAr ? 'غمارتين / بيك أب' : 'Pickup / Cab'}
                  </span>
                </button>

                {/* Option B: 5 مقاعد (5 Seats / Sedan) */}
                <button
                  type="button"
                  onClick={() => setSelectedSeats('5_seats')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    selectedSeats === '5_seats'
                      ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50 shadow-md scale-[1.02]'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-7 rounded-lg flex items-center justify-center ${selectedSeats === '5_seats' ? 'text-[#3e0f77]' : 'text-slate-400'}`}>
                    <Car className="w-7 h-7" />
                  </div>
                  <span className="font-black text-xs text-slate-900">{isAr ? '٥ مقاعد' : '5 Seats'}</span>
                  <span className="text-[9px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
                    {isAr ? 'سيدان / كروس أوفر' : 'Sedan / SUV'}
                  </span>
                </button>

                {/* Option C: 7 مقاعد (7 Seats / SUV Family) */}
                <button
                  type="button"
                  onClick={() => setSelectedSeats('7_seats')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    selectedSeats === '7_seats'
                      ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50 shadow-md scale-[1.02]'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-7 rounded-lg flex items-center justify-center ${selectedSeats === '7_seats' ? 'text-[#3e0f77]' : 'text-slate-400'}`}>
                    <Layers className="w-7 h-7" />
                  </div>
                  <span className="font-black text-xs text-slate-900">{isAr ? '٧ مقاعد' : '7 Seats'}</span>
                  <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md">
                    {isAr ? '3 صفوف عائلية (+80)' : '3 Rows (+80)'}
                  </span>
                </button>
              </div>
            </div>

            {/* 3. بيانات السيارة (MAKE / MODEL / YEAR DROPDOWNS) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#d5a027]" />
                <span>{isAr ? 'تأكيد بيانات وموديل سيارتك:' : 'Confirm Vehicle Data:'}</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Make */}
                <div>
                  <label className="block text-[10px] text-slate-600 font-extrabold mb-1">{isAr ? 'الشركة المصنعة:' : 'Make:'}</label>
                  <div className="relative">
                    <select 
                      value={selectedBrand} 
                      onChange={e => {
                        const newMake = e.target.value;
                        setSelectedBrand(newMake);
                        const models = CAR_MODELS_MAP[newMake] || [];
                        if (models.length > 0) setSelectedModel(models[0].modelAr);
                      }}
                      className="w-full p-2.5 bg-white rounded-xl border border-slate-300 font-bold text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none cursor-pointer appearance-none shadow-xs"
                    >
                      {CAR_BRANDS.map(b => (
                        <option key={b.id} value={b.id}>{isAr ? b.nameAr : b.nameEn}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute inset-y-0 end-2.5 my-auto text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-[10px] text-slate-600 font-extrabold mb-1">{isAr ? 'موديل السيارة:' : 'Model:'}</label>
                  <div className="relative">
                    <select 
                      value={selectedModel} 
                      onChange={e => setSelectedModel(e.target.value)}
                      className="w-full p-2.5 bg-white rounded-xl border border-slate-300 font-bold text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none cursor-pointer appearance-none shadow-xs"
                    >
                      {brandModels.map((m, idx) => (
                        <option key={idx} value={m.modelAr}>{isAr ? m.modelAr : m.modelEn}</option>
                      ))}
                      <option value="other">{isAr ? 'موديل آخر (اكتب بالملاحظات)' : 'Other Model'}</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute inset-y-0 end-2.5 my-auto text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-[10px] text-slate-600 font-extrabold mb-1">{isAr ? 'سنة صنع السيارة:' : 'Year:'}</label>
                  <div className="relative">
                    <select 
                      value={selectedYear} 
                      onChange={e => setSelectedYear(e.target.value)}
                      className="w-full p-2.5 bg-white rounded-xl border border-slate-300 font-bold text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none cursor-pointer appearance-none shadow-xs"
                    >
                      {['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012'].map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute inset-y-0 end-2.5 my-auto text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. خامة الجلد (MATERIAL QUALITY) */}
            <div className="space-y-1.5 pt-1">
              <label className="font-bold text-slate-900 text-xs">
                {isAr ? 'نوع وجودة الخامة:' : 'Material Quality:'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMaterial('leather')}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                    selectedMaterial === 'leather'
                      ? 'border-[#3e0f77] ring-2 ring-[#3e0f77]/30 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-slate-900 text-xs">{isAr ? '🇩🇪 جلد ألماني نابا' : '🇩🇪 German Leather'}</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">{isAr ? 'الأكثر طلباً' : 'Popular'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {isAr ? 'فاخر ومقاوم للحرارة والماء' : 'Nappa luxury, heat resistant'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMaterial('fabric')}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                    selectedMaterial === 'fabric'
                      ? 'border-[#3e0f77] ring-2 ring-[#3e0f77]/30 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-slate-900 text-xs">{isAr ? '🇯🇵 قماش ياباني بارد' : '🇯🇵 Japanese Fabric'}</span>
                    <span className="text-[9px] text-emerald-600 font-bold">(-70 {isAr ? 'ر.س' : 'SAR'})</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {isAr ? 'مسامي صيفي بارد يمنع التعرق' : 'Cooling breathable fabric'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMaterial('diamond')}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                    selectedMaterial === 'diamond'
                      ? 'border-[#3e0f77] ring-2 ring-[#3e0f77]/30 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-slate-900 text-xs">{isAr ? '💎 جلد دايموند VIP' : '💎 VIP Diamond'}</span>
                    <span className="text-[9px] text-[#d5a027] font-bold">(+120 {isAr ? 'ر.س' : 'SAR'})</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {isAr ? 'تطريز دايموند ملكي مضاعف' : 'Double diamond quilting'}
                  </p>
                </button>
              </div>
            </div>

            {/* 5. اشتري معاً ووفر (FREQUENTLY BOUGHT TOGETHER BUNDLE) */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-purple-500/10 border border-[#d5a027]/40 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#d5a027]" />
                  <span>{isAr ? 'اشتري معاً ووفر — منتجات ذات صلة' : 'Frequently Bought Together — Bundle & Save'}</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  {BLECO_BUNDLE_ADDON.savingAr}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img 
                      src={BLECO_BUNDLE_ADDON.image} 
                      alt={BLECO_BUNDLE_ADDON.nameAr} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0">
                    <h6 className="font-black text-slate-900 text-xs truncate">
                      {isAr ? BLECO_BUNDLE_ADDON.nameAr : BLECO_BUNDLE_ADDON.nameEn}
                    </h6>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                      <span className="font-black text-[#3e0f77]">{BLECO_BUNDLE_ADDON.price} {isAr ? 'ر.س' : 'SAR'}</span>
                      <span className="text-slate-400 line-through text-[10px]">{BLECO_BUNDLE_ADDON.originalPrice} {isAr ? 'ر.س' : 'SAR'}</span>
                      <span className="text-[9px] bg-red-100 text-red-700 font-black px-1.5 py-0.2 rounded">
                        25.00%
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIncludeBundle(!includeBundle)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    includeBundle 
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {includeBundle ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>{isAr ? 'تمت الإضافة ✓' : 'Added ✓'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'أضف للسلة' : 'Add Bundle'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 6. الكمية والملاحظات (QUANTITY & NOTES) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-4 bg-slate-100 p-2 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 px-1">{isAr ? 'الكمية:' : 'Qty:'}</span>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 rounded-xl bg-white border border-slate-300 flex items-center justify-center font-bold hover:bg-slate-50 cursor-pointer shadow-sm"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-black text-sm w-6 text-center text-slate-900">{quantity}</span>
                  <button 
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 rounded-xl bg-white border border-slate-300 flex items-center justify-center font-bold hover:bg-slate-50 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-8">
                <input 
                  type="text"
                  value={customerNote}
                  onChange={e => setCustomerNote(e.target.value)}
                  placeholder={isAr ? 'ملاحظة خاصة لسيارتك (مثال: فتحة تكاية، تدفئة مقاعد...)' : 'Special notes (e.g., heated seats, armrest...)'}
                  className="w-full p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 7. تلبيسات اخرى (OTHER PATTERNS SELECTOR) */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="font-black text-slate-900 text-xs block">
                {isAr ? 'تلبيسات أخرى (اختر نمط التفصيل):' : 'Other Patterns / Styles:'}
              </label>

              <div className="grid grid-cols-4 gap-2">
                {PRODUCT_PATTERNS.map(pat => {
                  const isCurPat = selectedPattern === pat.id;
                  return (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => setSelectedPattern(pat.id)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isCurPat 
                          ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50 font-black text-[#3e0f77]' 
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-[11px] block truncate">{isAr ? pat.nameAr : pat.nameEn}</span>
                      {pat.badgeAr && (
                        <span className="text-[8px] text-amber-700 block truncate font-bold mt-0.5">{pat.badgeAr}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8. السعر الإجمالي والدفع بالتقسيط */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-purple-500/10 border border-[#d5a027]/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold">{isAr ? 'السعر الإجمالي بالمواصفات المختارة:' : 'Total Configured Price:'}</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#3e0f77]">{totalPrice}</span>
                    <span className="text-xs font-black text-[#d5a027]">{isAr ? 'ريال سعودي' : 'SAR'}</span>
                    <span className="text-[11px] text-slate-400 line-through">({originalPrice * quantity} {isAr ? 'ر.س' : 'SAR'})</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                    {isAr ? 'شامل ضريبة القيمة المضافة 15%' : '15% VAT Included'}
                  </span>
                </div>
              </div>

              {/* Tabby & Tamara Installment */}
              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-slate-700">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#d5a027]" />
                  <span>
                    {isAr 
                      ? `أو قسّمها على 4 دفعات بقيمة ${tabbyInstallment} ر.س بدون فوائد`
                      : `Or 4 interest-free payments of ${tabbyInstallment} SAR`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-black text-[9px] border border-emerald-300">تابي</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-black text-[9px] border border-amber-300">تمارا</span>
                </div>
              </div>
            </div>

            {/* 9. أزرار الشراء مع بادج ضمان سنتين */}
            <div className="space-y-2.5 pt-1">
              
              {/* PRIMARY CTA ROW WITH WARRANTY BADGE */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleAddToCart}
                  disabled={addedSuccess}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    addedSuccess 
                      ? 'bg-emerald-600 text-white scale-[0.99] ring-4 ring-emerald-300' 
                      : 'bg-gradient-to-r from-[#d5a027] via-[#f6c344] to-[#d5a027] hover:brightness-105 active:scale-95 text-[#140226]'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-white animate-bounce" />
                      <span>{isAr ? '✓ تمت الإضافة بنجاح إلى السلة!' : '✓ Added to Cart Successfully!'}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 text-[#140226]" />
                      <span>{isAr ? 'إضافة للسلة' : 'Add to Cart'}</span>
                    </>
                  )}
                </button>

                {/* 2-YEAR WARRANTY BADGE (Matching screenshot beside add to cart) */}
                <div className="px-4 py-3 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-900 flex items-center gap-1.5 shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-[#d5a027]" />
                  <span className="font-black text-xs">{isAr ? 'ضمان سنتين' : '2-Yr Warranty'}</span>
                </div>
              </div>

              {/* SECONDARY ROW: Direct Buy & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button 
                  onClick={handleDirectBuy}
                  className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all"
                >
                  <ShoppingBag className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'شراء فوري مباشر (إتمام الطلب)' : 'Instant Buy Now (Fast Checkout)'}</span>
                </button>

                <button 
                  onClick={handleWhatsApp}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>{isAr ? 'طلب فوري بالواتساب' : '1-Click WhatsApp Order'}</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
