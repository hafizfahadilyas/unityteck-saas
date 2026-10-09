import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Star,
  Flame,
  Clock,
  Truck,
  ShieldCheck,
  RotateCcw,
  ShoppingCart,
  Zap,
  MessageCircle,
  Eye,
  Plus,
  Minus,
  Play,
  Heart,
  Share2,
  CheckCircle2,
  Sparkles,
  MapPin,
  X,
  Package,
  Leaf,
  Gift,
} from 'lucide-react';
import type { Product, ShippingRate } from '../../types';
import { FLOWERS_VARIATIONS } from './pack';
import { whatsappOrderHref } from './WhatsAppChatFab';

type Props = {
  product: Product;
  products: Product[];
  lang: string;
  money: (amount: number) => string;
  onAddToCart: (p: Product, qty: number, variationLabel?: string) => void;
  onBuyNow: (p: Product, qty: number, variationLabel?: string) => void;
  onBackToShop: () => void;
  onSelectCategory: (category: string) => void;
  onSelectProduct: (p: Product) => void;
  onOpenLightbox: (p: Product) => void;
  inWishlist: boolean;
  onToggleWishlist: () => void;
  shippingRates: ShippingRate[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  videoUrl?: string;
};

export const SingleProductView: React.FC<Props> = ({
  product,
  products,
  lang,
  money,
  onAddToCart,
  onBuyNow,
  onBackToShop,
  onSelectCategory,
  onSelectProduct,
  onOpenLightbox,
  inWishlist,
  onToggleWishlist,
  shippingRates,
  selectedDistrict,
  onSelectDistrict,
  videoUrl,
}) => {
  const isAr = lang === 'ar';

  // Variations
  const variations = FLOWERS_VARIATIONS[product.id] || [];
  const [selectedVarId, setSelectedVarId] = useState<string | null>(
    variations[0]?.id || null,
  );
  const selectedVariation = variations.find((v) => v.id === selectedVarId);
  const variationPriceDelta = selectedVariation ? selectedVariation.priceDelta : 0;
  const currentPrice = product.price + variationPriceDelta;
  const originalPrice = Math.round(currentPrice * 1.16);

  // Gallery state
  const galleryImages = [
    product.image,
    ...(product.galleryUrls || []),
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
  ].slice(0, 4);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3'>('1:1');
  const [imageDisplayMode, setImageDisplayMode] = useState<'cover' | 'contain'>('cover');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews' | 'shipping'>('desc');

  // Urgency Timer State (Ends in ~ 2 hours 45 mins countdown)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 18 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 2, minutes: 30, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live order popup social proof
  const [recentBuyer, setRecentBuyer] = useState<{
    name: string;
    city: string;
    minutes: number;
  } | null>(null);

  useEffect(() => {
    const buyers = [
      { name: isAr ? 'فاطمة الحربي' : 'Fatima Al-Harbi', city: isAr ? 'فندق أبراج الساعة' : 'Clock Towers Hotel', minutes: 2 },
      { name: isAr ? 'عبدالله السلمي' : 'Abdullah Al-Sulami', city: isAr ? 'العزيزية، مكة' : 'Al-Aziziyah, Makkah', minutes: 5 },
      { name: isAr ? 'مريم الغامدي' : 'Maryam Al-Ghamdi', city: isAr ? 'جبل عمر، مكة' : 'Jabal Omar, Makkah', minutes: 8 },
      { name: isAr ? 'تركي القحطاني' : 'Turki Al-Qahtani', city: isAr ? 'الشوقية، مكة' : 'Al-Shawqiyyah, Makkah', minutes: 12 },
    ];
    let idx = 0;
    setRecentBuyer(buyers[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % buyers.length;
      setRecentBuyer(buyers[idx]);
    }, 7000);
    return () => clearInterval(interval);
  }, [isAr]);

  // WhatsApp Order Link generator
  const currentVarLabel = selectedVariation
    ? isAr ? selectedVariation.labelAr : selectedVariation.labelEn
    : '';

  const whatsappMessage = [
    isAr ? 'السلام عليكم ورحمة الله،' : 'Hello,',
    isAr
      ? `أرغب بطلب منتج: *${product.name}*`
      : `I would like to order: *${product.name}*`,
    currentVarLabel ? `${isAr ? 'الخيار' : 'Option'}: ${currentVarLabel}` : '',
    `${isAr ? 'الكمية' : 'Qty'}: ${qty}`,
    `${isAr ? 'السعر الإجمالي' : 'Total'}: ${money(currentPrice * qty)}`,
    `${isAr ? 'حي التوصيل في مكة' : 'Makkah District'}: ${selectedDistrict}`,
    isAr ? 'مع خدمة توصيل سيارات مبردة 18°C' : 'With chilled delivery 18°C',
  ].filter(Boolean);

  const whatsappLink = whatsappOrderHref(lang, whatsappMessage);

  // Aspect ratio classes
  const aspectClass =
    aspectRatio === '1:1'
      ? 'aspect-square'
      : aspectRatio === '3:4'
        ? 'aspect-3/4'
        : 'aspect-4/3';

  // Related products
  const relatedProducts = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
    .slice(0, 4);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. Breadcrumbs & Back Navigation */}
      <div className="flex items-center justify-between gap-3 text-xs flex-wrap border-b pb-4" style={{ borderColor: 'var(--sf-border)' }}>
        <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--sf-muted)' }}>
          <button
            type="button"
            onClick={onBackToShop}
            className="hover:text-emerald-600 transition-colors cursor-pointer"
          >
            {isAr ? 'المتجر' : 'Shop'}
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => {
              onSelectCategory(product.category);
              onBackToShop();
            }}
            className="hover:text-emerald-600 transition-colors cursor-pointer"
          >
            {product.category}
          </button>
          <span>/</span>
          <span className="truncate max-w-[200px] sm:max-w-xs text-slate-900 dark:text-white">
            {product.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleWishlist}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={inWishlist ? (isAr ? 'محفوظ في المفضلة' : 'In Wishlist') : (isAr ? 'إضافة للمفضلة' : 'Add to Wishlist')}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-400'}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: product.name, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isAr ? 'مشاركة المنتج' : 'Share Product'}
          >
            <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Top Scarcity / Urgency Countdown Bar */}
      <div
        className="rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold shadow-xs border"
        style={{
          background: 'linear-gradient(90deg, #032320 0%, #064e3b 100%)',
          color: '#ffffff',
          borderColor: '#059669',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 animate-pulse">
            <Flame className="w-4 h-4 fill-current text-rose-400" />
          </span>
          <div>
            <span className="text-amber-300 font-black">
              {isAr ? 'عرض حصري ومحدود لفنادق مكة المكرمة' : 'Limited Flash Offer in Makkah'}
            </span>
            <span className="opacity-90 block sm:inline sm:ms-2 text-[11px] font-normal">
              {isAr ? 'اطلب خلال الساعات القادمة للتوصيل المبرد اليوم' : 'Order now for same-day chilled delivery'}
            </span>
          </div>
        </div>

        {/* Live Timer Boxes */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-[10px] uppercase font-sans opacity-80 me-1">
            {isAr ? 'ينتهي العرض:' : 'Ends in:'}
          </span>
          <span className="px-2 py-1 rounded-md bg-black/40 text-amber-300 font-black">
            {String(timeLeft.hours).padStart(2, '0')}h
          </span>
          <span>:</span>
          <span className="px-2 py-1 rounded-md bg-black/40 text-amber-300 font-black">
            {String(timeLeft.minutes).padStart(2, '0')}m
          </span>
          <span>:</span>
          <span className="px-2 py-1 rounded-md bg-black/40 text-amber-300 font-black">
            {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        </div>
      </div>

      {/* 3. Main Single Product Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Gallery & View Controls (cols 12 -> 6) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Showcase Image */}
          <div
            className={`w-full ${aspectClass} rounded-3xl overflow-hidden border shadow-md relative bg-slate-100 dark:bg-slate-800 group`}
            style={{ borderColor: 'var(--sf-border)' }}
          >
            <img
              src={galleryImages[activeImageIndex] || product.image}
              alt={product.name}
              className={`w-full h-full ${
                imageDisplayMode === 'cover' ? 'object-cover' : 'object-contain'
              } transition-transform duration-500 group-hover:scale-105`}
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 start-4 flex flex-col gap-2 z-10">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>14% OFF</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 text-white backdrop-blur-md">
                {product.brand || 'Dutch Flora'}
              </span>
            </div>

            {/* Quick Actions (Zoom Lightbox & Video) */}
            <div className="absolute bottom-4 end-4 flex items-center gap-2 z-10">
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white text-xs font-black flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>{isAr ? 'فيديو المنتج' : 'Watch Video'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenLightbox(product)}
                className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-900 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-105"
                title={isAr ? 'تكبير الصورة' : 'Zoom Image'}
              >
                <Eye className="w-4 h-4 text-emerald-700" />
              </button>
            </div>
          </div>

          {/* Aspect Ratio & Mode Toggle Controls (Selia Spec) */}
          <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase">{isAr ? 'أبعاد الصورة:' : 'Aspect:'}</span>
              {(['1:1', '3:4', '4:3'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAspectRatio(r)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    aspectRatio === r
                      ? 'bg-emerald-600 text-white'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase">{isAr ? 'العرض:' : 'Mode:'}</span>
              <button
                type="button"
                onClick={() => setImageDisplayMode(imageDisplayMode === 'cover' ? 'contain' : 'cover')}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                {imageDisplayMode === 'cover' ? (isAr ? 'قص الهوامش (Cover)' : 'Cover') : (isAr ? 'كامل بدون قص (Contain)' : 'Contain')}
              </button>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 shrink-0 ${
                  activeImageIndex === idx
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-102'
                    : 'border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Social Proof Live Order Toast */}
          {recentBuyer && (
            <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {isAr ? (
                    <>
                      تم شراء هذا المنتج مؤخراً بواسطة <strong className="font-black">{recentBuyer.name}</strong> من {recentBuyer.city} منذ {recentBuyer.minutes} دقائق!
                    </>
                  ) : (
                    <>
                      Recently ordered by <strong className="font-black">{recentBuyer.name}</strong> from {recentBuyer.city} {recentBuyer.minutes} mins ago!
                    </>
                  )}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{isAr ? 'طلب موثق' : 'Verified'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Right: Product Details, Variations, CTAs (cols 12 -> 6) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Brand & Category & SKU */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider">
                {product.category}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400 font-bold">{product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight" style={{ color: 'var(--sf-text)' }}>
              {product.name}
            </h1>

            {product.subtitle && (
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                {product.subtitle}
              </p>
            )}
          </div>

          {/* Star Rating & Reviews & Sales Count */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="font-black text-slate-800 dark:text-slate-200 ms-1.5">4.9</span>
            </div>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <span className="font-bold text-slate-600 dark:text-slate-400">
              120 {isAr ? 'تقييم موثق من عملاء مكة' : 'verified reviews'}
            </span>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <span className="text-rose-600 font-black flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>1.2K {isAr ? 'تم بيعها' : 'sold'}</span>
            </span>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {money(currentPrice * qty)}
            </span>
            <span className="text-base text-slate-400 line-through">
              {money(originalPrice * qty)}
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full ms-auto">
              {isAr ? 'شامل الضريبة 15%' : 'Includes 15% VAT'}
            </span>
          </div>

          {/* Stock Urgency Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-rose-600 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-rose-600" />
                <span>{isAr ? 'متبقي 4 قطع فقط في مستودع مكة!' : 'Only 4 items left in Makkah storage!'}</span>
              </span>
              <span className="text-slate-500">{isAr ? 'طلب عالي الآن' : 'High demand'}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="w-3/4 h-full bg-linear-to-r from-rose-500 to-amber-500 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Product Options / Variations Selector */}
          {variations.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider block text-slate-700 dark:text-slate-300">
                {isAr ? 'اختر الحجم / التنسيق:' : 'Select Size / Stem Count:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {variations.map((v) => {
                  const active = selectedVarId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVarId(v.id)}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        active
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{isAr ? v.labelAr : v.labelEn}</span>
                      <span className="text-[10px] text-muted">
                        {v.priceDelta === 0 ? (isAr ? 'الأساسي' : 'Standard') : `+${money(v.priceDelta)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Makkah District Delivery Selector Box */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isAr ? 'التوصيل المباشر في مكة المكرمة:' : 'Deliver to Makkah District:'}</span>
            </div>

            <select
              value={selectedDistrict}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
            >
              {shippingRates.map((s) => (
                <option key={s.id} value={s.cityName}>
                  {s.cityName} — ({s.rate === 0 ? (isAr ? 'شحن مجاني' : 'Free Delivery') : money(s.rate)})
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'سيارات مجهزة تبريد 18°C' : 'Chilled 18°C Fleet'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{isAr ? 'توصيل خلال ساعتين' : '2-hour express delivery'}</span>
              </div>
            </div>
          </div>

          {/* Quantity & CTA Buttons (Add to Cart, Buy Now, WhatsApp) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'الكمية:' : 'Quantity:'}
              </span>
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-black text-sm">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onAddToCart(product, qty, currentVarLabel)}
                className="py-3.5 px-5 rounded-2xl border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isAr ? 'إضافة إلى السلة' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                onClick={() => onBuyNow(product, qty, currentVarLabel)}
                className="py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>{isAr ? 'شراء فوري الآن (Buy Now)' : 'Buy Now'}</span>
              </button>
            </div>

            {/* Order on WhatsApp Button */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{isAr ? 'اطلب فوراً عبر واتساب مع التفاصيل' : 'Order via WhatsApp (Instant)'}</span>
            </a>
          </div>

          {/* Guarantees List */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isAr ? 'ضمان نضارة الزهور 100%' : '100% Freshness Guarantee'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{isAr ? 'كرت إهداء عربي فاخر مجاناً' : 'Free luxury greeting card'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Information Tabs (Description, Specs, Reviews, Shipping) */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 scrollbar-none">
          {(
            [
              ['desc', isAr ? 'الوصف والتفاصيل' : 'Description'],
              ['specs', isAr ? 'المواصفات الفنية' : 'Specifications'],
              ['reviews', isAr ? 'تقييمات العملاء (120)' : 'Customer Reviews (120)'],
              ['shipping', isAr ? 'التوصيل والإرجاع' : 'Shipping & Returns'],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'desc' && (
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              {product.description ||
                (isAr
                  ? 'تنسيق فاخر من الورود الطبيعية المختارة بعناية فائقة من مزارع هولندا والإكوادور. تم تجميع الباقة بأيدي نخبة من منسقي الزهور المحترفين لتمنحك رائحة عطرية عميقة وتدوم لأكثر من 10 أيام.'
                  : 'A luxury hand-crafted bouquet featuring fresh flowers imported directly from Dutch & Ecuadorian estates, preserved in optimal humidity and temperature.')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs mb-1">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'نضارة مضمونة' : 'Freshness Assured'}</span>
                </span>
                <span className="text-[11px] text-muted">
                  {isAr ? 'ورود طبيعية مقطوفة حديثاً ومشحونة جوياً' : 'Air-shipped freshly picked premium stems'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs mb-1">
                  <Truck className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isAr ? 'نقل مبرد 18°C' : 'Chilled 18°C Transit'}</span>
                </span>
                <span className="text-[11px] text-muted">
                  {isAr ? 'سيارات خاصة تحمي الورد من حرارة مكة' : 'Protecting delicate petals from desert heat'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs mb-1">
                  <Gift className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'كرت إهداء مجاني' : 'Free Gift Card'}</span>
                </span>
                <span className="text-[11px] text-muted">
                  {isAr ? 'خط عربي أنيق مع عبارات تهنئة ودعاء' : 'Calligraphed customized heartfelt notes'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between">
              <span className="font-bold text-muted">{isAr ? 'بلد المنشأ:' : 'Country of Origin:'}</span>
              <span className="font-black text-slate-900 dark:text-white">{product.countryOfOrigin || 'Netherlands'}</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between">
              <span className="font-bold text-muted">{isAr ? 'نوع المنتج:' : 'Product Type:'}</span>
              <span className="font-black text-slate-900 dark:text-white">{product.productType || 'Fresh Flowers'}</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between">
              <span className="font-bold text-muted">{isAr ? 'العلامة التجارية:' : 'Brand:'}</span>
              <span className="font-black text-slate-900 dark:text-white">{product.brand || 'Dutch Flora'}</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between">
              <span className="font-bold text-muted">{isAr ? 'الوزن التقريبي:' : 'Approx Weight:'}</span>
              <span className="font-black text-slate-900 dark:text-white">{product.weightKg || '1.5'} kg</span>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
              <div className="text-center">
                <span className="text-3xl font-black text-amber-600">4.9</span>
                <div className="flex items-center text-amber-400 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
                <span className="font-black block">{isAr ? 'تقييم ممتاز من عملاء مكة وفنادق الحرم' : 'Top rated by Makkah guests'}</span>
                <span className="opacity-80">98% {isAr ? 'من المشترين يوصون بهذا التنسيق' : 'of buyers recommend this arrangement'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white">نورة الحربي</span>
                  <span className="text-muted text-[10px]">فندق أبراج الساعة</span>
                </div>
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="text-muted leading-relaxed">
                  وصلت الباقة إلى الغرفة بالفندق خلال ساعتين وكانت في غاية النضارة والجمال. شكراً لخدمتكم الراقية.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white">خالد العتيبي</span>
                  <span className="text-muted text-[10px]">حي العزيزية</span>
                </div>
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="text-muted leading-relaxed">
                  تنسيق ملكي فخم والكرت مكتوب بخط عربي رائع، والسيارة وصلت مبردة تماماً.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              {isAr
                ? 'يتم توصيل جميع طلبات مكة المكرمة عبر أسطول سيارات مجهزة بنظام تبريد حراري (18 درجة مئوية) لضمان عدم تأثر البتلات بأشعة الشمس أثناء النقل.'
                : 'All orders in Makkah are dispatched inside climate-controlled chilled vans at 18°C.'}
            </p>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isAr ? 'المنطقة المركزية وفنادق الحرم: توصيل خلال ساعتين' : 'Central Haram Hotels: 2-hour express delivery'}</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isAr ? 'سياسة استبدال فورية خلال ساعتين عند وصول أي تلف' : 'Immediate replacement within 2 hours if affected during transit'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black" style={{ color: 'var(--sf-text)' }}>
              {isAr ? 'قد يعجبك أيضاً' : 'You May Also Like'}
            </h3>
            <button
              type="button"
              onClick={onBackToShop}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute top-2 start-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white">
                    14% OFF
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs truncate text-slate-900 dark:text-white">{p.name}</h4>
                  <p className="text-[11px] font-black text-emerald-600">{money(p.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-black rounded-3xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              src={videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-blooming-flowers-in-spring-41221-large.mp4'}
              controls
              autoPlay
              className="w-full aspect-video object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};
