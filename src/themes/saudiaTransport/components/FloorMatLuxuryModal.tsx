import React, { useState, useMemo, useEffect } from 'react';
import { 
  X,
  ChevronDown,
  Paperclip,
  MessageSquare, 
  Star, 
  CheckCircle, 
  ShieldCheck, 
  Truck, 
  ShoppingBag, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Upload, 
  FileText, 
  Eye, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Award, 
  Maximize2, 
  Layers, 
  Check, 
  Lock, 
  HelpCircle,
  Car
} from 'lucide-react';
import { Product } from '../../../types';
import { 
  CAR_BRANDS, 
  CAR_MODELS_MAP, 
  FLOOR_MAT_COLORS, 
  FloorMatColorOption, 
  FEATURED_FLOOR_MATS, 
  FEATURED_HOME_SEATS,
  PRODUCT_PATTERNS,
  BLECO_BUNDLE_ADDON,
  BLECO_STORE_INFO 
} from '../../../data/blecoStoreData';

export interface FloorMatCustomSpecs {
  color: FloorMatColorOption;
  seats: '2_seats' | '5_seats' | '7_seats';
  seatsLabelAr?: string;
  coverage?: 'rows_5' | 'rows_7' | 'rows_5_with_trunk' | 'rows_7_with_trunk' | 'trunk_only' | 'rows_2';
  coverageLabelAr?: string;
  pattern?: 'triangles' | 'diamond' | 'laser' | 'luxury';
  patternNameAr?: string;
  fuelType?: 'petrol' | 'hybrid' | 'electric';
  fuelTypeLabelAr?: string;
  heelPad?: 'standard' | 'metal_sport';
  heelPadLabelAr?: string;
  doubleLayer?: boolean;
  carLogoEmbroidery?: boolean;
  includeBundle?: boolean;
  bundlePrice?: number;
  brand: string;
  brandNameAr: string;
  model: string;
  year: string;
  note?: string;
  attachedFileName?: string;
  unitPrice: number;
  totalPrice: number;
}

interface FloorMatLuxuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  isAr?: boolean;
  onSelectProduct?: (prod: Product) => void;
  onAddToCart: (product: Product, quantity: number, specs: FloorMatCustomSpecs) => void;
  onDirectBuy: (product: Product, quantity: number, specs: FloorMatCustomSpecs) => void;
}

// WhatsApp Glyph
function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export const FloorMatLuxuryModal: React.FC<FloorMatLuxuryModalProps> = ({
  isOpen,
  onClose,
  product,
  isAr = true,
  onSelectProduct,
  onAddToCart,
  onDirectBuy
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

  // Active Specifications State
  const [selectedColor, setSelectedColor] = useState<FloorMatColorOption>(FLOOR_MAT_COLORS[0]);
  const [selectedSeats, setSelectedSeats] = useState<'2_seats' | '5_seats' | '7_seats'>('5_seats');
  const [selectedCoverage, setSelectedCoverage] = useState<'rows_5' | 'rows_7' | 'rows_5_with_trunk' | 'rows_7_with_trunk' | 'trunk_only' | 'rows_2'>('rows_5');
  const [selectedFuelType, setSelectedFuelType] = useState<'petrol' | 'hybrid' | 'electric'>('petrol');
  const [includeMetalHeelPad, setIncludeMetalHeelPad] = useState<boolean>(false);
  const [includeDoubleLayer, setIncludeDoubleLayer] = useState<boolean>(false);
  const [includeLogoEmbroidery, setIncludeLogoEmbroidery] = useState<boolean>(true);
  const [selectedPattern, setSelectedPattern] = useState<'triangles' | 'diamond' | 'laser' | 'luxury'>('triangles');
  const [includeBundle, setIncludeBundle] = useState<boolean>(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('toyota');
  const [selectedModel, setSelectedModel] = useState<string>('كامري');
  const [customModelText, setCustomModelText] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [showFileInput, setShowFileInput] = useState<boolean>(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'warranty'>('details');
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // When product changes, reset defaults
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedSeats('5_seats');
      setSelectedCoverage('rows_5');
      setSelectedPattern('triangles');
      setSelectedFuelType('petrol');
      setIncludeBundle(false);
      setIncludeMetalHeelPad(false);
      setIncludeDoubleLayer(false);
      setIncludeLogoEmbroidery(true);
    }
  }, [product]);

  // Handle file attachment
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  // Dynamic Models for Selected Brand
  const brandModels = useMemo(() => {
    return CAR_MODELS_MAP[selectedBrand] || [];
  }, [selectedBrand]);

  // When Brand Changes, set first model
  useEffect(() => {
    const models = CAR_MODELS_MAP[selectedBrand] || [];
    if (models.length > 0) {
      setSelectedModel(models[0].modelAr);
    } else {
      setSelectedModel('موديل آخر');
    }
  }, [selectedBrand]);

  // Coverage labels dictionary
  const coverageLabels: Record<string, { ar: string; en: string; diffTextAr: string }> = {
    'rows_5': { ar: '٥ مقاعد (صفين)', en: '5 Seats (2 Rows)', diffTextAr: 'السعر الأساسي' },
    'rows_7': { ar: '٧ مقاعد (3 صفوف)', en: '7 Seats (3 Rows)', diffTextAr: '+60 ر.س' },
    'rows_5_with_trunk': { ar: '٥ مقاعد + دعاسة الشنطة', en: '5 Seats + Trunk Mat', diffTextAr: '+90 ر.س' },
    'rows_7_with_trunk': { ar: '٧ مقاعد + دعاسة الشنطة', en: '7 Seats + Trunk Mat', diffTextAr: '+150 ر.س' },
    'trunk_only': { ar: 'دعاسة الشنطة / الصندوق الخلفي فقط', en: 'Trunk / Cargo Mat Only', diffTextAr: '150 ر.س' },
    'rows_2': { ar: 'مقعدين (غمارتين / بيك أب)', en: '2 Seats (Single Cab / Pickup)', diffTextAr: '-70 ر.س' },
  };

  const fuelLabels = {
    'petrol': { ar: 'بنزين', en: 'Petrol' },
    'hybrid': { ar: 'هايبرد هجين', en: 'Hybrid' },
    'electric': { ar: 'كهربائي', en: 'Electric' },
  };

  // Calculate Dynamic Unit & Total Price
  const { unitPrice, totalPrice } = useMemo(() => {
    if (!product) return { unitPrice: 0, totalPrice: 0 };
    const base = product.discountedPrice || product.price || 380;
    
    let coverageExtra = 0;
    if (selectedCoverage === 'rows_2') coverageExtra = -70;
    else if (selectedCoverage === 'rows_7') coverageExtra = 60;
    else if (selectedCoverage === 'rows_5_with_trunk') coverageExtra = 90;
    else if (selectedCoverage === 'rows_7_with_trunk') coverageExtra = 150;
    else if (selectedCoverage === 'trunk_only') coverageExtra = -230; // 380 - 230 = 150 SAR

    const bundleExtra = includeBundle ? BLECO_BUNDLE_ADDON.price : 0;
    const heelPadExtra = includeMetalHeelPad ? 25 : 0;
    const doubleLayerExtra = includeDoubleLayer ? 80 : 0;

    const finalUnit = Math.max(150, Math.round(base + coverageExtra + bundleExtra + heelPadExtra + doubleLayerExtra));
    return {
      unitPrice: finalUnit,
      totalPrice: finalUnit * quantity
    };
  }, [product, selectedCoverage, includeBundle, includeMetalHeelPad, includeDoubleLayer, quantity]);

  // Related products (Other floor mats + Seat covers)
  const relatedProducts = useMemo(() => {
    const currentId = product?.id;
    // Other floor mats
    const otherMats = FEATURED_FLOOR_MATS.filter(m => m.id !== currentId);
    // Complementary seat covers
    const seatItems = FEATURED_HOME_SEATS.slice(0, 6);
    return [...otherMats, ...seatItems];
  }, [product]);

  if (!isOpen || !product) return null;

  const currentBrandObj = CAR_BRANDS.find(b => b.id === selectedBrand);
  const brandDisplayName = isAr 
    ? (currentBrandObj?.nameAr || selectedBrand) 
    : (currentBrandObj?.nameEn || selectedBrand);

  const effectiveModel = selectedModel === 'موديل آخر' && customModelText.trim()
    ? customModelText.trim()
    : selectedModel;

  const seatsLabels = {
    '2_seats': { ar: 'مقعدين (غمارتين / بيك أب)', en: '2 Seats (Single Cab / Pickup)' },
    '5_seats': { ar: '٥ مقاعد (سيدان / جيب صغير)', en: '5 Seats (Sedan / Standard)' },
    '7_seats': { ar: '٧ مقاعد (3 صفوف عائلية)', en: '7 Seats (3-Row Family SUV)' },
  };

  const patternLabels = {
    'triangles': { ar: 'المثلثات 5D', en: '5D Triangles' },
    'diamond': { ar: 'تطريز الدايموند الملكي', en: 'Royal Diamond' },
    'laser': { ar: 'قص الليزر الدقيق', en: 'Laser Cut' },
    'luxury': { ar: 'الفاخر الأوروبي', en: 'Luxury Striped' },
  };

  const specsPayload: FloorMatCustomSpecs = {
    color: selectedColor,
    seats: selectedSeats,
    seatsLabelAr: seatsLabels[selectedSeats].ar,
    coverage: selectedCoverage,
    coverageLabelAr: coverageLabels[selectedCoverage]?.ar || coverageLabels['rows_5'].ar,
    pattern: selectedPattern,
    patternNameAr: patternLabels[selectedPattern].ar,
    fuelType: selectedFuelType,
    fuelTypeLabelAr: fuelLabels[selectedFuelType].ar,
    heelPad: includeMetalHeelPad ? 'metal_sport' : 'standard',
    heelPadLabelAr: includeMetalHeelPad ? 'كعبية حديد رياضية (+25 ر.س)' : 'كعبية قياسية',
    doubleLayer: includeDoubleLayer,
    carLogoEmbroidery: includeLogoEmbroidery,
    includeBundle,
    bundlePrice: includeBundle ? BLECO_BUNDLE_ADDON.price : 0,
    brand: selectedBrand,
    brandNameAr: brandDisplayName,
    model: effectiveModel,
    year: selectedYear,
    note: customerNote.trim() || undefined,
    attachedFileName: attachedFile?.name,
    unitPrice,
    totalPrice
  };

  // WhatsApp 1-Click Message Generator
  const handleWhatsAppQuickOrder = () => {
    const phone = BLECO_STORE_INFO.whatsapp.replace(/[^0-9]/g, '');
    const title = isAr ? product.nameAr : product.nameEn;
    const coverageText = coverageLabels[selectedCoverage][isAr ? 'ar' : 'en'];
    const colorText = isAr ? selectedColor.nameAr : selectedColor.nameEn;
    const fuelText = fuelLabels[selectedFuelType][isAr ? 'ar' : 'en'];
    const bundleText = includeBundle ? (isAr ? ' + بكج ملمع بلاكو المخفض' : ' + Bleco Polish Bundle') : '';
    const heelPadText = includeMetalHeelPad ? (isAr ? ' + كعبية حديد لدواسة السائق' : ' + Driver Metal Heel Pad') : '';
    const doubleLayerText = includeDoubleLayer ? (isAr ? ' + طبقة سجاد شعر قابلة للفك' : ' + Removable Curly Carpet Layer') : '';
    const logoText = includeLogoEmbroidery ? (isAr ? ' + تطريز شعار السيارة مجاناً' : ' + Free Embroidered Logo') : '';

    let msg = isAr
      ? `السلام عليكم ورحمة الله وبركاته،\nأرغب بطلب منتج: *${patternLabels[selectedPattern].ar} - ${title}*${bundleText}\n\n`
      : `Hello, I would like to order: *${patternLabels[selectedPattern].en} - ${title}*${bundleText}\n\n`;

    msg += isAr
      ? `• اللون والتطريز: *${colorText}*\n`
      : `• Color & Stitch: *${colorText}*\n`;
    msg += isAr
      ? `• التغطية والصفوف: *${coverageText}*\n`
      : `• Floor Coverage: *${coverageText}*\n`;
    msg += isAr
      ? `• الشركة المصنعة: *${brandDisplayName}*\n`
      : `• Brand: *${brandDisplayName}*\n`;
    msg += isAr
      ? `• الموديل: *${effectiveModel}*\n`
      : `• Model: *${effectiveModel}*\n`;
    msg += isAr
      ? `• سنة الصنع: *${selectedYear}*\n`
      : `• Year: *${selectedYear}*\n`;
    msg += isAr
      ? `• نوع المحرك / الفئة: *${fuelText}*\n`
      : `• Engine / Fuel: *${fuelText}*\n`;

    if (includeMetalHeelPad || includeDoubleLayer || includeLogoEmbroidery) {
      msg += isAr
        ? `• الإضافات المختارة:${heelPadText}${doubleLayerText}${logoText}\n`
        : `• Add-ons:${heelPadText}${doubleLayerText}${logoText}\n`;
    }

    msg += isAr
      ? `• الكمية: *${quantity}*\n`
      : `• Quantity: *${quantity}*\n`;
    msg += isAr
      ? `• إجمالي السعر: *${totalPrice} ر.س*\n`
      : `• Total Price: *${totalPrice} SAR*\n`;

    if (customerNote.trim()) {
      msg += isAr
        ? `• ملاحظات خاصة: ${customerNote.trim()}\n`
        : `• Notes: ${customerNote.trim()}\n`;
    }
    if (attachedFile) {
      msg += isAr
        ? `• (مرفق صورة لسيارتي: ${attachedFile.name})\n`
        : `• (Car photo attached: ${attachedFile.name})\n`;
    }

    msg += isAr
      ? `\nالمتجر: متجر السعيدي لخدمات السيارات (تنجيد مكة) — 0000180462`
      : `\nStore: Al-Saeedi Car Services Store`;

    const encoded = encodeURIComponent(msg);
  };

  const handleAddAndNotify = () => {
    onAddToCart(product, quantity, specsPayload);
    setToastMessage(isAr ? 'تمت إضافة المنتج إلى سلتك بنجاح!' : 'Added to cart successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDirectBuyClick = () => {
    onDirectBuy(product, quantity, specsPayload);
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#d5a027] flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Main Luxury Modal Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 my-auto flex flex-col max-h-[92vh] animate-fadeIn text-slate-800"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Top Luxury Header Bar */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-[#1c0537] via-[#25074d] to-[#3e0f77] text-white flex items-center justify-between border-b border-[#d5a027]/30 shrink-0">
            {/* Breadcrumb & Store Verification */}
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="text-[#f6c344] font-bold hidden sm:inline">
                {isAr ? 'متجر السعيدي' : 'Al-Saeedi'}
              </span>
              <span className="text-slate-400 hidden sm:inline">/</span>
              <span className="text-slate-300 hidden md:inline">
                {isAr ? 'أرضيات لجميع السيارات' : 'Car Floor Mats'}
              </span>
              <span className="text-slate-400 hidden md:inline">/</span>
              <span className="text-white font-extrabold truncate">
                {isAr ? product.nameAr : product.nameEn}
              </span>
              <span className="hidden lg:inline-flex items-center gap-1 bg-white/10 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30 mr-2 ml-2">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{isAr ? 'موثق في منصة الأعمال' : 'SBC Verified'}</span>
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body Content */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-8 flex-1">
            {/* 2-Column Product Configurator Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              
              {/* Left Column (Sticky Gallery & Anatomical Breakdown) - 5 Cols */}
              <div className="lg:col-span-5 space-y-4">
                {/* Big Preview Image Box with Zoom */}
                <div 
                  className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/90 shadow-md group cursor-pointer"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />

                  {/* Badges on Image */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                    <span className="bg-[#3e0f77]/95 text-[#f6c344] text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg border border-[#f6c344]/30 backdrop-blur-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#f6c344]" />
                      <span>{isAr ? 'أصلي 100%' : '100% Original'}</span>
                    </span>
                    <span className="bg-emerald-700/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs shadow">
                      {isAr ? 'جلد صديق للبيئة' : 'Eco Synthetic'}
                    </span>
                  </div>

                  {/* Zoom Action Overlay */}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <span className="bg-white/95 text-slate-900 px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-2 shadow-xl hover:bg-white transition-all">
                      <Maximize2 className="w-4 h-4 text-[#3e0f77]" />
                      <span>{isAr ? 'اضغط علي الصورة لتكبيرها' : 'Click to zoom'}</span>
                    </span>
                  </div>

                  {/* Bottom Bar: Click image to zoom indicator */}
                  <div className="absolute bottom-2 inset-x-2 bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-bold py-1 px-2.5 rounded-xl flex items-center justify-between text-center">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#f6c344]" />
                      <span>{isAr ? 'اضغط علي الصورة لتكبيرها' : 'Click image to enlarge'}</span>
                    </span>
                    <span className="text-[#f6c344] text-[10px] font-bold">SASO · 5D OEM</span>
                  </div>
                </div>

                {/* 5 Anatomical Layers Breakdown Box (طبقات أرضية الدايموند) */}
                <div className="bg-gradient-to-br from-purple-50/80 via-white to-amber-50/50 p-4 rounded-2xl border border-[#d5a027]/35 shadow-sm space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="font-black text-[#3e0f77] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#d5a027]" />
                      <span>{isAr ? 'تشريح طبقات أرضيات الدايموند (5 طبقات):' : '5D Diamond Anatomical Layers (5 Layers):'}</span>
                    </span>
                    <span className="bg-[#3e0f77] text-[#f6c344] font-black text-[10px] px-2 py-0.5 rounded-full">
                      12 mm
                    </span>
                  </div>

                  <ol className="space-y-1.5 text-[11px] text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#3e0f77] text-white flex items-center justify-center text-[9px] font-bold shrink-0">1</span>
                      <span className="font-semibold text-slate-900">{isAr ? 'الجلد الخارجي:' : 'Outer Leather:'}</span>
                      <span className="text-slate-600">{isAr ? 'جلد صناعي صديق للبيئة مقاوم للخدش والحرارة' : 'Eco-friendly scratch-proof synthetic leather'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#3e0f77] text-white flex items-center justify-center text-[9px] font-bold shrink-0">2</span>
                      <span className="font-semibold text-slate-900">{isAr ? 'الإسفنج:' : 'High-Density Sponge:'}</span>
                      <span className="text-slate-600">{isAr ? 'إسفنج مرن لراحة القدمين وامتصاص الصدمات' : 'Flexible foam for comfort & shock absorption'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#3e0f77] text-white flex items-center justify-center text-[9px] font-bold shrink-0">3</span>
                      <span className="font-semibold text-slate-900">{isAr ? 'البلاستيك العازل:' : 'Plastic Barrier:'}</span>
                      <span className="text-slate-600">{isAr ? 'طبقة عازلة للمياه والأتربة بنسبة 100%' : '100% waterproof & dust isolation layer'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#3e0f77] text-white flex items-center justify-center text-[9px] font-bold shrink-0">4</span>
                      <span className="font-semibold text-slate-900">{isAr ? 'اللباد:' : 'Acoustic Felt:'}</span>
                      <span className="text-slate-600">{isAr ? 'عازل للصوت يقلل ضوضاء الطريق في المقصورة' : 'Sound-absorbing felt reducing road noise'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#3e0f77] text-white flex items-center justify-center text-[9px] font-bold shrink-0">5</span>
                      <span className="font-semibold text-slate-900">{isAr ? 'القاعدة المانعة للانزلاق:' : 'Anti-Slip Base:'}</span>
                      <span className="text-slate-600">{isAr ? 'بلاستيك محبب يلتصق بالأرضية ولا يتحرك' : 'Textured grip preventing pedal obstruction'}</span>
                    </li>
                  </ol>
                </div>

                {/* Trust Guarantee Box */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#3e0f77] shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{isAr ? 'توصيل سريع' : 'Fast Delivery'}</p>
                      <p className="text-[10px] text-slate-500">{isAr ? 'خلال 3 - 5 أيام' : '3-5 Business Days'}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{isAr ? 'ضمان شامل' : 'Full Warranty'}</p>
                      <p className="text-[10px] text-slate-500">{isAr ? 'ضد عيوب الصناعة' : 'Against Defects'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Interactive Luxury Configurator) - 7 Cols */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Title, Rating & Pricing Header */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-purple-100 text-[#3e0f77] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                      {isAr ? 'أرضيات بلاكو الفاخرة' : 'Bleco Luxury Flooring'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 text-xs">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-900">5.0</span>
                      <span className="text-[11px] text-slate-400">({product.reviewsCount || 168} {isAr ? 'تقييم موثق' : 'reviews'})</span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                    {isAr ? product.nameAr : product.nameEn}
                  </h2>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {isAr 
                      ? 'هل تبحث عن لمسة جمالية مميزة لسيارتك؟ هل ترغب في حماية أرضية سيارتك من الأوساخ والخدوش؟ إليك حلك المثالي مع أرضيات مكة الفاخرة المقاومة للماء والمطابقة لمواصفات SASO.'
                      : 'Eco-friendly synthetic leather luxury floor mats tailored with precision fit and maximum protection against spills and dirt.'}
                  </p>

                  {/* Price Tag with Savings Pill */}
                  <div className="mt-3.5 p-3.5 bg-gradient-to-r from-purple-50 via-amber-50/40 to-white rounded-2xl border border-[#d5a027]/40 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-[#3e0f77]">
                        {unitPrice}
                      </span>
                      <span className="text-xs font-bold text-[#b07e16]">
                        {isAr ? 'ر.س' : 'SAR'}
                      </span>
                      {product.originalPrice && product.originalPrice > unitPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {product.originalPrice + (selectedSeats === '7_seats' ? 60 : 0)} {isAr ? 'ر.س' : 'SAR'}
                        </span>
                      )}
                    </div>
                    
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                      {isAr ? 'شامل الضريبة وقوالب التثبيت' : 'VAT & Clips Included'}
                    </span>
                  </div>
                </div>

                {/* OPTION 1: CHOOSE A COLOR (Visual Swatches + Thread Embroidery) */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#d5a027]" />
                      <span>{isAr ? 'اختر اللون والتطريز' : 'Choose Color & Stitching'}</span>
                    </label>
                    <span className="text-[11px] font-bold text-[#3e0f77] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      {isAr ? selectedColor.nameAr : selectedColor.nameEn}
                    </span>
                  </div>

                  {/* Visual Color Swatches Grid (Dual-tone: Base Leather + Stitch thread) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FLOOR_MAT_COLORS.map(c => {
                      const isSelected = selectedColor.id === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`p-2 rounded-xl border text-start transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected 
                              ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50/70 shadow-xs' 
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          {/* Dual-color Swatch Circle */}
                          <div 
                            className="w-7 h-7 rounded-full shrink-0 p-1 flex items-center justify-center border border-black/15 shadow-2xs relative"
                            style={{ backgroundColor: c.baseHex }}
                          >
                            <span 
                              className="w-2.5 h-2.5 rounded-full shadow-xs" 
                              style={{ backgroundColor: c.stitchHex }} 
                            />
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#d5a027] rounded-full flex items-center justify-center text-slate-950">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[11px] font-bold text-slate-900 truncate leading-tight">
                              {isAr ? c.nameAr : c.nameEn}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* OPTION 2: COVERAGE & TRUNK (المقاعد والصندوق الخلفي / الشنطة) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#d5a027]" />
                      <span>{isAr ? 'تغطية المقاعد والصندوق الخلفي (الشنطة)' : 'Floor & Trunk Coverage'}</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      {coverageLabels[selectedCoverage]?.diffTextAr}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {/* 5 Seats */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCoverage('rows_5');
                        setSelectedSeats('5_seats');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        selectedCoverage === 'rows_5'
                          ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Car className={`w-4 h-4 ${selectedCoverage === 'rows_5' ? 'text-[#3e0f77]' : 'text-slate-400'}`} />
                      <span className="font-black text-[11px] text-slate-900">{isAr ? '٥ مقاعد (صفين)' : '5 Seats (2 Rows)'}</span>
                      <span className="text-[9px] text-slate-500 font-bold">{isAr ? 'السعر الأساسي' : 'Base Price'}</span>
                    </button>

                    {/* 7 Seats */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCoverage('rows_7');
                        setSelectedSeats('7_seats');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        selectedCoverage === 'rows_7'
                          ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Layers className={`w-4 h-4 ${selectedCoverage === 'rows_7' ? 'text-[#3e0f77]' : 'text-slate-400'}`} />
                      <span className="font-black text-[11px] text-slate-900">{isAr ? '٧ مقاعد (3 صفوف)' : '7 Seats (3 Rows)'}</span>
                      <span className="text-[9px] text-amber-700 font-bold">{isAr ? '+60 ر.س' : '+60 SAR'}</span>
                    </button>

                    {/* 5 Seats + Trunk */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCoverage('rows_5_with_trunk');
                        setSelectedSeats('5_seats');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        selectedCoverage === 'rows_5_with_trunk'
                          ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck className={`w-4 h-4 ${selectedCoverage === 'rows_5_with_trunk' ? 'text-[#3e0f77]' : 'text-slate-400'}`} />
                      <span className="font-black text-[11px] text-slate-900">{isAr ? '٥ مقاعد + الشنطة' : '5 Seats + Trunk'}</span>
                      <span className="text-[9px] text-emerald-700 font-bold">{isAr ? '+90 ر.س' : '+90 SAR'}</span>
                    </button>

                    {/* 7 Seats + Trunk */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCoverage('rows_7_with_trunk');
                        setSelectedSeats('7_seats');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        selectedCoverage === 'rows_7_with_trunk'
                          ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Sparkles className={`w-4 h-4 ${selectedCoverage === 'rows_7_with_trunk' ? 'text-[#3e0f77]' : 'text-slate-400'}`} />
                      <span className="font-black text-[11px] text-slate-900">{isAr ? '٧ مقاعد + الشنطة' : '7 Seats + Trunk'}</span>
                      <span className="text-[9px] text-amber-700 font-bold">{isAr ? '+150 ر.س' : '+150 SAR'}</span>
                    </button>

                    {/* Trunk Only */}
                    <button
                      type="button"
                      onClick={() => setSelectedCoverage('trunk_only')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        selectedCoverage === 'trunk_only'
                          ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Layers className={`w-4 h-4 ${selectedCoverage === 'trunk_only' ? 'text-[#3e0f77]' : 'text-slate-400'}`} />
                      <span className="font-black text-[11px] text-slate-900">{isAr ? 'دعاسة الشنطة فقط' : 'Trunk Mat Only'}</span>
                      <span className="text-[9px] text-blue-700 font-bold">{isAr ? '150 ر.س' : '150 SAR'}</span>
                    </button>

                    {/* 2 Seats Pickup */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCoverage('rows_2');
                        setSelectedSeats('2_seats');
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        selectedCoverage === 'rows_2'
                          ? 'border-[#3e0f77] ring-2 ring-[#d5a027] bg-purple-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Truck className={`w-4 h-4 ${selectedCoverage === 'rows_2' ? 'text-[#3e0f77]' : 'text-slate-400'}`} />
                      <span className="font-black text-[11px] text-slate-900">{isAr ? 'غمارتين / بيك أب' : 'Pickup / 2 Seats'}</span>
                      <span className="text-[9px] text-slate-500 font-bold">{isAr ? '-70 ر.س' : '-70 SAR'}</span>
                    </button>
                  </div>
                </div>

                {/* OPTION 3: MANUFACTURER (الشركة المصنعة) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800">
                    {isAr ? 'الشركة المصنعة للسيارة' : 'Car Manufacturer'}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3e0f77] focus:ring-1 focus:ring-[#3e0f77] appearance-none cursor-pointer pr-9 rtl:pl-9 rtl:pr-3.5 shadow-xs"
                    >
                      {CAR_BRANDS.map(b => (
                        <option key={b.id} value={b.id}>
                          {isAr ? b.nameAr : b.nameEn}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 rtl:right-auto rtl:left-3 flex items-center pointer-events-none text-slate-500">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* OPTION 4: CAR MODEL & YEAR (موديل وسنة الصنع) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Model */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      {isAr ? 'موديل السيارة' : 'Car model'}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3e0f77] focus:ring-1 focus:ring-[#3e0f77] appearance-none cursor-pointer pr-9 rtl:pl-9 rtl:pr-3.5 shadow-xs"
                      >
                        {brandModels.map((m, idx) => (
                          <option key={idx} value={m.modelAr}>
                            {isAr ? m.modelAr : m.modelEn}
                          </option>
                        ))}
                        <option value="موديل آخر">{isAr ? 'موديل آخر (اكتب يدوياً)' : 'Other model'}</option>
                      </select>
                      <div className="absolute inset-y-0 right-3 rtl:right-auto rtl:left-3 flex items-center pointer-events-none text-slate-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>

                    {selectedModel === 'موديل آخر' && (
                      <input
                        type="text"
                        placeholder={isAr ? 'اكتب اسم موديل سيارتك بدقة...' : 'Enter your car model...'}
                        value={customModelText}
                        onChange={(e) => setCustomModelText(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#3e0f77] mt-1.5"
                      />
                    )}
                  </div>

                  {/* Year */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      {isAr ? 'سنة صنع السيارة' : 'Year of manufacture'}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3e0f77] focus:ring-1 focus:ring-[#3e0f77] appearance-none cursor-pointer pr-9 rtl:pl-9 rtl:pr-3.5 shadow-xs"
                      >
                        {['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2008', '2005'].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3 rtl:right-auto rtl:left-3 flex items-center pointer-events-none text-slate-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPTION 5: FUEL / ENGINE TYPE (نوع المحرك: بنزين / هايبرد / كهربائي) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#d5a027]" />
                      <span>{isAr ? 'نوع المحرك / الفئة (مهم لانسيابية أرضية البطارية)' : 'Engine / Fuel Type'}</span>
                    </label>
                    {selectedFuelType === 'hybrid' && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                        {isAr ? 'قصة مخصصة لبطارية المقاعد' : 'Custom Battery Contour'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFuelType('petrol')}
                      className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        selectedFuelType === 'petrol'
                          ? 'border-[#3e0f77] bg-purple-50 text-[#3e0f77] ring-1 ring-[#3e0f77]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isAr ? 'بنزين عادي' : 'Petrol'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFuelType('hybrid')}
                      className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        selectedFuelType === 'hybrid'
                          ? 'border-[#3e0f77] bg-purple-50 text-[#3e0f77] ring-1 ring-[#3e0f77]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isAr ? 'هايبرد (هجين)' : 'Hybrid'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFuelType('electric')}
                      className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        selectedFuelType === 'electric'
                          ? 'border-[#3e0f77] bg-purple-50 text-[#3e0f77] ring-1 ring-[#3e0f77]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isAr ? 'كهربائي (EV)' : 'Electric'}
                    </button>
                  </div>
                </div>

                {/* OPTION 6: EXCLUSIVE ADD-ONS (إضافات اختيارية فاخرة) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#d5a027]" />
                    <span>{isAr ? 'إضافات وتجهيزات اختيارية:' : 'Optional Add-ons:'}</span>
                  </label>

                  <div className="space-y-1.5">
                    {/* Metal Heel Pad */}
                    <label className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      includeMetalHeelPad ? 'border-[#3e0f77] bg-purple-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeMetalHeelPad}
                          onChange={(e) => setIncludeMetalHeelPad(e.target.checked)}
                          className="w-4 h-4 text-[#3e0f77] rounded focus:ring-[#3e0f77] cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {isAr ? 'كعبية حديد رياضية لدواسة السائق' : 'Sport Metal Heel Protector'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {isAr ? 'لحماية دعاسة السائق من احتكاك الحذاء وإطالة عمرها' : 'Reinforces driver mat against shoe friction'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#b07e16] shrink-0">
                        +25 {isAr ? 'ر.س' : 'SAR'}
                      </span>
                    </label>

                    {/* Double Layer Removable Carpet */}
                    <label className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      includeDoubleLayer ? 'border-[#3e0f77] bg-purple-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeDoubleLayer}
                          onChange={(e) => setIncludeDoubleLayer(e.target.checked)}
                          className="w-4 h-4 text-[#3e0f77] rounded focus:ring-[#3e0f77] cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {isAr ? 'طبقة سجاد شعر علوية قابلة للفك والغسيل' : 'Detachable Curly Carpet Top Layer'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {isAr ? 'كلبسات سريعة الفك والتركيب لغسيل سهل وسريع' : 'Snap-on wash & clean layer'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#b07e16] shrink-0">
                        +80 {isAr ? 'ر.س' : 'SAR'}
                      </span>
                    </label>

                    {/* Car Logo Embroidery */}
                    <label className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      includeLogoEmbroidery ? 'border-[#3e0f77] bg-purple-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeLogoEmbroidery}
                          onChange={(e) => setIncludeLogoEmbroidery(e.target.checked)}
                          className="w-4 h-4 text-[#3e0f77] rounded focus:ring-[#3e0f77] cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {isAr ? 'تطريز شعار الماركة على الدواسة' : 'Brand Logo Embroidery'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {isAr ? 'تطريز أصلي دقيق لشعار سيارتك (تويوتا، هيونداي، فورد...)' : 'Precision OEM brand logo on mats'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                        {isAr ? 'مجاناً' : 'FREE'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* 100% LASER FIT & SASO GUARANTEE BADGE */}
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-extrabold text-emerald-950">
                      {isAr ? 'ضمان تطابق ليزري 100% ومطابقة مواصفات ساسو (SASO)' : '100% Laser-Fit & SASO Verified Guarantee'}
                    </p>
                    <p className="text-[10px] text-emerald-800 leading-tight mt-0.5">
                      {isAr ? 'تفصيل مخصص بالمللي لأرضية سيارتك مع كلبسات التثبيت الأصلية لمنع انزلاق الدواسة تحت الفرامل.' : 'Laser cut to exact vehicle contours with OEM lock clips preventing pedal obstruction.'}
                    </p>
                  </div>
                </div>

                {/* OPTION 6: ATTACH FILE & ADD A NOTE BUTTONS (matching Image 3) */}
                <div className="pt-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowFileInput(!showFileInput)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        attachedFile || showFileInput 
                          ? 'border-[#3e0f77] bg-purple-50 text-[#3e0f77]' 
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{attachedFile ? (isAr ? 'تم إرفاق ملف' : 'File attached') : (isAr ? 'إرفاق ملف' : 'Attach file')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowNoteInput(!showNoteInput)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        customerNote || showNoteInput 
                          ? 'border-[#3e0f77] bg-purple-50 text-[#3e0f77]' 
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{customerNote ? (isAr ? 'تمت إضافة ملاحظة' : 'Note added') : (isAr ? 'إضافة ملاحظة' : 'Add a note')}</span>
                    </button>
                  </div>

                  {/* Expandable File Input */}
                  {showFileInput && (
                    <div className="mt-2 p-3 bg-purple-50/50 rounded-xl border border-purple-200 text-xs">
                      {!attachedFile ? (
                        <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-purple-300 rounded-lg cursor-pointer bg-white hover:bg-purple-50 text-slate-700 font-bold">
                          <Upload className="w-4 h-4 text-[#3e0f77]" />
                          <span>{isAr ? 'اختر صورة من جهازك' : 'Upload car interior photo'}</span>
                          <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                        </label>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 truncate">{attachedFile.name}</span>
                          <button type="button" onClick={handleRemoveFile} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expandable Note Input */}
                  {showNoteInput && (
                    <div className="mt-2">
                      <textarea
                        rows={2}
                        value={customerNote}
                        onChange={(e) => setCustomerNote(e.target.value)}
                        placeholder={isAr ? 'اكتب ملاحظتك لمختص التفصيل...' : 'Add special requests or notes...'}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#3e0f77] resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* FREQUENTLY BOUGHT TOGETHER (اشتري معاً ووفر) */}
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-purple-500/10 border border-[#d5a027]/40 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#d5a027]" />
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

                {/* PATTERNS SELECTOR TABS (تلبيسات اخرى) */}
                <div className="space-y-1.5 pt-1">
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

                <div className="pt-3 border-t border-slate-200 space-y-3">
                  {/* 7. LIVE PRICE & QUANTITY (matching Image 3) */}
                  <div className="flex items-center justify-between gap-4">
                  {/* Quantity selector */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1.5 hover:bg-slate-100 text-slate-700 cursor-pointer disabled:opacity-40"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-black text-xs text-slate-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1.5 hover:bg-slate-100 text-slate-700 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {isAr ? 'الكمية' : 'Quantity'}
                    </span>
                  </div>

                  {/* Live Total Price (changes dynamically with seats & qty!) */}
                  <div className="text-right rtl:text-left flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-[#3e0f77] tracking-tight">
                      {totalPrice}
                    </span>
                    <span className="text-sm font-black text-[#b07e16]">
                      {isAr ? 'ر.س' : 'SAR'}
                    </span>
                  </div>
                </div>

                {/* Primary Buttons: Buy Now & Add to Cart & WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {/* Buy Now (Direct Checkout) */}
                    <button
                      type="button"
                      onClick={handleDirectBuyClick}
                      className="sm:col-span-4 py-3 px-3 bg-[#3e0f77] hover:bg-[#25074d] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-xl transition-all"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#f6c344]" />
                      <span>{isAr ? 'اشترِ الآن' : 'Buy Now'}</span>
                    </button>

                    {/* Add to Cart */}
                    <button
                      type="button"
                      onClick={handleAddAndNotify}
                      className="sm:col-span-5 py-3 px-3 btn-bashayer-gold font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg transition-all"
                    >
                      <ShoppingCart className="w-4 h-4 text-[#1c0537]" />
                      <span>{isAr ? 'أضف إلى السلة' : 'Add to Cart'}</span>
                    </button>

                    {/* 2-Year Warranty Badge beside buttons */}
                    <div className="sm:col-span-3 py-2 px-2 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-center gap-1 text-amber-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#d5a027]" />
                      <span className="text-[11px] font-black">{isAr ? 'ضمان سنتين' : '2-Yr Warranty'}</span>
                    </div>

                    {/* WhatsApp 1-Click Order */}
                    <button
                      type="button"
                      onClick={handleWhatsAppQuickOrder}
                      className="sm:col-span-12 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      <span>{isAr ? 'طلب فوري واتساب' : 'WhatsApp Order'}</span>
                    </button>
                  </div>

                  {/* Security & Warranty Trust Footer */}
                  <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-slate-700 font-semibold">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAr ? 'تسوق آمن، بياناتك محمية دائمًا' : 'Secure shopping, protected data'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-700 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5 text-[#d5a027]" />
                      <span>{isAr ? 'مطابق لمواصفات SASO' : 'SASO Compliant'}</span>
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* PRODUCT DETAILS & REVIEWS TABS SECTION */}
            <div className="pt-4 border-t border-slate-200">
              {/* Tab Nav Buttons */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'details'
                      ? 'bg-[#3e0f77] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isAr ? 'تفاصيل ومميزات المنتج' : 'Product Details'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'reviews'
                      ? 'bg-[#3e0f77] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isAr ? 'تقييمات العملاء (168)' : 'Customer Reviews'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('warranty')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'warranty'
                      ? 'bg-[#3e0f77] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isAr ? 'الشحن والضمان الذهبي' : 'Shipping & Warranty'}
                </button>
              </div>

              {/* Tab 1: Product Details */}
              {activeTab === 'details' && (
                <div className="pt-4 space-y-4 text-xs text-slate-700 leading-relaxed animate-fadeIn">
                  <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
                    <h4 className="font-black text-sm text-[#3e0f77]">
                      {isAr ? 'مميزات أرضيات بلاكو الفاخرة للسيارات:' : 'Bleco Luxury Car Floor Mats Features:'}
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px]">
                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#d5a027] mt-1.5 shrink-0" />
                        <div>
                          <strong className="text-slate-900 block">{isAr ? 'الجودة الفائقة:' : 'Superior Quality:'}</strong>
                          <span>{isAr ? 'نستخدم أفضل أنواع الجلود الطبيعية والصناعية الصديقة للبيئة الخاضعة لاختبارات علمية دقيقة لضمان أعلى معايير الجودة.' : 'Tested premium eco-friendly synthetic leather ensuring longevity.'}</span>
                        </div>
                      </li>

                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#d5a027] mt-1.5 shrink-0" />
                        <div>
                          <strong className="text-slate-900 block">{isAr ? 'التنوع الشامل:' : 'Wide Variety:'}</strong>
                          <span>{isAr ? 'نوفر 4 مجموعات رئيسية: أرضيات الليزر، أرضيات الدايموند، أرضيات الفاخر، وأرضيات المثلثات، كل مجموعة تتميز بسماكتها وطبقاتها وألوانها الفريدة.' : '4 signature series: Laser, Diamond, Luxury, and Triangles.'}</span>
                        </div>
                      </li>

                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#d5a027] mt-1.5 shrink-0" />
                        <div>
                          <strong className="text-slate-900 block">{isAr ? 'التنفيذ المتقن:' : 'Flawless Execution:'}</strong>
                          <span>{isAr ? 'يعتمد فريقنا على خبرة عريقة وأحدث أدوات القص والتفصيل لضمان دقة التركيب والتطابق التام مع قوالب الوكالة.' : 'Crafted with laser precision matching OEM vehicle dimensions.'}</span>
                        </div>
                      </li>

                      <li className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#d5a027] mt-1.5 shrink-0" />
                        <div>
                          <strong className="text-slate-900 block">{isAr ? 'الأمان والسلامة:' : 'Safety & Pedal Clearance:'}</strong>
                          <span>{isAr ? 'مصممة خصيصاً بحيث لا تؤثر على دواسة الفرامل ومكابس البنزين إطلاقاً، ومطابقة لمواصفات الهيئة السعودية للمواصفات والمقاييس SASO.' : 'Engineered not to obstruct brake or accelerator pedals.'}</span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'السمك الكلي' : 'Thickness'}</span>
                      <strong className="text-sm font-black text-slate-900">12 مل (12 mm)</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'عدد الطبقات' : 'Layers'}</span>
                      <strong className="text-sm font-black text-slate-900">5 طبقات متكاملة</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'العزل المائي' : 'Waterproof'}</span>
                      <strong className="text-sm font-black text-emerald-700">100% عازلة للمياه</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'بلد المنشأ' : 'Origin'}</span>
                      <strong className="text-sm font-black text-[#3e0f77]">منتج وطني فاخر</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Customer Reviews */}
              {activeTab === 'reviews' && (
                <div className="pt-4 space-y-3 animate-fadeIn">
                  <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-black text-[#3e0f77]">5.0</div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-600 font-bold">
                        {isAr ? 'بناءً على 168 تقييم حقيقي من عملاء المملكة' : 'Based on 168 verified Saudi reviews'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{isAr ? 'عبدالله الحربي — مكة المكرمة' : 'Abdullah Al-Harbi (Makkah)'}</span>
                        <span className="text-[10px] text-slate-400">منذ يومين</span>
                      </div>
                      <div className="flex text-amber-400 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current text-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {isAr ? 'ما شاء الله تبارك الله، طلبت أرضيات الدايموند لكامري 2024 وجاءت راكبة بالملي بالتمام، الجلد جداً فخم وخياطته متقنة وعزل الصوت ممتاز.' : 'Perfect fit for my Camry 2024, amazing stitching and easy to clean.'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{isAr ? 'سلطان القحطاني — الرياض' : 'Sultan Al-Qahtani (Riyadh)'}</span>
                        <span className="text-[10px] text-slate-400">منذ أسبوع</span>
                      </div>
                      <div className="flex text-amber-400 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current text-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {isAr ? 'التوصيل أسرع مما توقعت وصلني للرياض في 3 أيام، والتركيب سهل جداً ما أخذ مني 5 دقائق بدون فك أي شيء في السيارة. أنصح بها وبقوة.' : 'Delivered to Riyadh in 3 days, took 5 minutes to clip into factory points.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Warranty & Shipping */}
              {activeTab === 'warranty' && (
                <div className="pt-4 space-y-3 text-xs text-slate-700 animate-fadeIn">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-black text-sm text-[#3e0f77] flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#d5a027]" />
                      <span>{isAr ? 'السرعة والكفاءة في التوصيل والضمان الشامل:' : 'Fast Delivery & Golden Guarantee:'}</span>
                    </h4>
                    <p className="text-[11px] leading-relaxed">
                      {isAr 
                        ? 'نلتزم بتسليم طلباتك في أقصر وقت ممكن، حيث لا تتجاوز مدة التوصيل 5 أيام عمل في الرياض وجدة، و 7 أيام عمل لباقي مدن ومحافظات المملكة العربية السعودية. كما نقدم ضماناً شاملاً ضد عيوب الصناعة وتغير اللون وتأثر الجلد بالعوامل الجوية.'
                        : 'Delivery does not exceed 5 business days in Riyadh & Jeddah, and 7 business days for the rest of KSA with full defect warranty.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SIMILAR PRODUCTS SECTION (منتجات مشابهة / قد تعجبك) */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#d5a027]" />
                  <span>{isAr ? 'منتجات مشابهة قد تعجبك (أرضيات وتلابيس جاهزة):' : 'Similar products you may like:'}</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-bold">
                  {isAr ? 'اضغط للمعاينة الفورية' : 'Click to preview'}
                </span>
              </div>

              {/* Horizontal Scrollable Carousel / Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {relatedProducts.slice(0, 6).map((rel) => {
                  return (
                    <div
                      key={rel.id}
                      onClick={() => {
                        if (onSelectProduct) onSelectProduct(rel);
                      }}
                      className="p-2 bg-white rounded-2xl border border-slate-200 hover:border-[#3e0f77] shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative mb-1.5">
                        <img 
                          src={rel.image} 
                          alt={rel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                          {rel.price} {isAr ? 'ر.س' : 'SAR'}
                        </span>
                      </div>

                      <div>
                        <h5 className="font-bold text-[11px] text-slate-900 group-hover:text-[#3e0f77] line-clamp-1">
                          {isAr ? rel.nameAr : rel.nameEn}
                        </h5>
                        <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                          {rel.subtitle || (isAr ? 'جلد صناعي صديق للبيئة' : 'Eco-friendly synthetic leather')}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="mt-2 w-full py-1 bg-purple-50 hover:bg-[#3e0f77] hover:text-white text-[#3e0f77] text-[10px] font-bold rounded-lg transition-all"
                      >
                        {isAr ? 'معاينة' : 'View'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
{/* FULLSCREEN IMAGE LIGHTBOX MODAL (اضغط علي الصورة لتكبيرها) */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full cursor-pointer transition-all"
              title="إغلاق التكبير"
            >
              <X className="w-6 h-6" />
            </button>

            {/* High-Res Image */}
            <img 
              src={product.image} 
              alt={product.name}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()} 
            />

            {/* Caption */}
            <div className="mt-3 text-center text-white">
              <h3 className="font-bold text-base text-[#f6c344]">
                {isAr ? product.nameAr : product.nameEn}
              </h3>
              <p className="text-xs text-slate-300">
                {isAr ? 'خامة جلد صناعي صديق للبيئة عالي الجودة مع تطريز دقيق ومقاومة للماء بنسبة 100%' : 'High quality Eco-friendly synthetic leather with precision fit'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
