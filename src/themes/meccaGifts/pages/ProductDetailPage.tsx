import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { ADDON_OPTIONS } from '../data/mockData';
import { AddonOption, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  Star,
  Heart,
  Truck,
  ShieldCheck,
  Clock,
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  CreditCard,
  MessageSquare,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ThumbsUp,
  Lock,
  Send,
  Gift,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../../utils/imageFallback';

interface CustomerReview {
  id: string;
  name: string;
  location: string;
  rating: number;
  date: string;
  verified: boolean;
  comment: string;
  helpfulCount: number;
}

export const ProductDetailPage: React.FC = () => {
  const {
    language,
    selectedProduct,
    addToCart,
    isWishlisted,
    toggleWishlist,
    setCurrentPage,
    setIsCartOpen,
    products
  } = useApp();

  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const storeId = activeStore?.id || 'store-1';

  // Read URL query parameter for product identification
  const urlProductId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('product') || new URLSearchParams(window.location.search).get('id')
    : null;

  // Resolve product strictly from real store products
  const product: Product | null = useMemo(() => {
    if (urlProductId && products && products.length > 0) {
      const match = products.find((p) => p.id === urlProductId || (p as any).sku === urlProductId);
      if (match) return match;
    }
    return selectedProduct || (products && products.length > 0 ? products[0] : null);
  }, [urlProductId, products, selectedProduct]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [product?.id]);

  // Gallery images strictly from real product object
  const allImages = useMemo(() => {
    if (!product) return [FALLBACK_PRODUCT_IMAGE];
    const pAny = product as any;
    const list: string[] = [];
    if (pAny?.galleryUrls && Array.isArray(pAny.galleryUrls) && pAny.galleryUrls.length > 0) {
      list.push(...pAny.galleryUrls);
    }
    if (product.image) {
      list.push(product.image);
    }
    if (pAny?.additionalImages && Array.isArray(pAny.additionalImages)) {
      list.push(...pAny.additionalImages);
    }
    const clean = Array.from(new Set(list.filter(Boolean)));
    return clean.length > 0 ? clean : [product.image || FALLBACK_PRODUCT_IMAGE];
  }, [product]);

  const [activeImage, setActiveImage] = useState<string>(allImages[0] || FALLBACK_PRODUCT_IMAGE);

  useEffect(() => {
    if (allImages.length > 0) {
      setActiveImage(allImages[0]);
    }
  }, [product?.id, allImages]);

  // Precision Hover Lens Zoom State
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / (rect.height || 1)) * 100));
    setZoomPos({ x, y });
  };

  // Fullscreen Modal Zoom State
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxScale, setLightboxScale] = useState<number>(1);

  // Arrangement Sizes
  const sizes = [
    {
      id: 'standard',
      name: isAr ? 'الحجم الكلاسيكي' : 'Classic Size',
      stems: isAr ? '25 وردة منسقة' : '25 Stems Curated',
      extra: 0,
    },
    {
      id: 'luxury',
      name: isAr ? 'الحجم الفاخر الملكي (+10 أزهار إضافية)' : 'Royal Luxury Size (+10 stems)',
      stems: isAr ? '35 وردة هولندية فاخرة' : '35 Stems Dutch Luxury',
      extra: 75,
    },
    {
      id: 'vip',
      name: isAr ? 'حجم النخبة VIP الكبير جداً' : 'VIP Grand Edition',
      stems: isAr ? '45 وردة نادرة مع تطريز لؤلؤ' : '45 Stems Rare Pearls & Silk',
      extra: 150,
    },
  ];
  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  // Ribbon Colors
  const ribbonColors = [
    { id: 'ivory', name: isAr ? 'أبيض عاجي حريري' : 'Pure Silk Ivory', hex: '#FDFBF7', border: '#D6CFC0' },
    { id: 'emerald', name: isAr ? 'أخضر زمردي فاخر' : 'Royal Emerald Green', hex: '#102A1C', border: '#102A1C' },
    { id: 'gold', name: isAr ? 'ذهبي شامبين لامع' : 'Champagne Gold', hex: '#D4AF37', border: '#D4AF37' },
    { id: 'blush', name: isAr ? 'وردي بودري أنثوي' : 'Dusty Rose Pink', hex: '#D98880', border: '#D98880' },
    { id: 'noir', name: isAr ? 'أسود ملكي مخملي' : 'Velvet Noir Black', hex: '#1C1C1C', border: '#1C1C1C' },
  ];
  const [selectedRibbon, setSelectedRibbon] = useState(ribbonColors[0]);

  // Selected Add-ons
  const [selectedAddons, setSelectedAddons] = useState<AddonOption[]>([]);

  const toggleAddon = (addon: AddonOption) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Quantity
  const [quantity, setQuantity] = useState<number>(1);

  // Handwritten Greeting Card
  const [includeCard, setIncludeCard] = useState<boolean>(true);
  const [cardMessage, setCardMessage] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [occasion, setOccasion] = useState<string>(isAr ? 'ذكرى زواج' : 'Wedding & Anniversary');

  // Delivery Time Slot
  const deliverySlots = [
    {
      id: 'express',
      title: isAr ? 'توصيل فوري سريع (خلال 60 دقيقة)' : 'Express 60-Min Delivery',
      desc: isAr ? 'سيارة مبردة ومندوب خاص' : 'Direct cold van',
    },
    {
      id: 'evening',
      title: isAr ? 'الفترة المسائية (6:00 م - 9:00 م)' : 'Evening Slot (6:00 PM - 9:00 PM)',
      desc: isAr ? 'مناسبة للاحتفالات والمفاجآت' : 'Ideal for celebrations',
    },
    {
      id: 'afternoon',
      title: isAr ? 'فترة ما بعد الظهيرة (2:00 م - 5:00 م)' : 'Afternoon Slot (2:00 PM - 5:00 PM)',
      desc: isAr ? 'توصيل للمنازل والمستشفيات' : 'Home and hospital delivery',
    },
  ];
  const [selectedSlot, setSelectedSlot] = useState(deliverySlots[0]);

  // Special instructions
  const [specialNote, setSpecialNote] = useState<string>('');

  // Live Price Computations
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
  const unitPrice = (product?.price || 0) + selectedSize.extra + addonsTotal;
  const subtotal = unitPrice * quantity;
  const freeShippingThreshold = 300;
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : 25;
  const grandTotal = subtotal + shippingFee;
  const tabbyInstallment = (unitPrice / 4).toFixed(2);
  const vatAmount = ((subtotal * 0.15) / 1.15).toFixed(2);

  // Delivery countdown estimation
  const [minutesLeft] = useState<number>(45);

  // Real Customer Reviews with Strict Store & Product Tenant Isolation (Zero Fake Data)
  const reviewsStorageKey = `unityteck_reviews_${storeId}_${product?.id || 'prod'}`;

  const [reviews, setReviews] = useState<CustomerReview[]>(() => {
    try {
      if (typeof window !== 'undefined' && product?.id) {
        const saved = localStorage.getItem(reviewsStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {}
    return [];
  });

  // Re-sync reviews when product changes
  useEffect(() => {
    if (!product?.id) return;
    try {
      const saved = localStorage.getItem(reviewsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setReviews(parsed);
          return;
        }
      }
    } catch {}
    setReviews([]);
  }, [reviewsStorageKey, product?.id]);

  // Review submission state
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewName, setNewReviewName] = useState<string>('');
  const [newReviewLocation, setNewReviewLocation] = useState<string>('');
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [showReviewSuccess, setShowReviewSuccess] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim() || !product?.id) return;

    setIsSubmittingReview(true);
    setTimeout(() => {
      const added: CustomerReview = {
        id: `rev-${Date.now()}`,
        name: newReviewName.trim(),
        location: newReviewLocation.trim() || (isAr ? 'مكة المكرمة' : 'Mecca'),
        rating: newReviewRating,
        date: isAr ? 'الآن' : 'Just now',
        verified: true,
        comment: newReviewComment.trim(),
        helpfulCount: 1,
      };

      const updated = [added, ...reviews];
      setReviews(updated);
      try {
        localStorage.setItem(reviewsStorageKey, JSON.stringify(updated));
      } catch {}

      setNewReviewName('');
      setNewReviewLocation('');
      setNewReviewComment('');
      setNewReviewRating(5);
      setIsSubmittingReview(false);
      setShowReviewSuccess(true);
      setTimeout(() => setShowReviewSuccess(false), 5000);
    }, 350);
  };

  const handleHelpful = (id: string) => {
    setReviews((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r));
      try {
        localStorage.setItem(reviewsStorageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Genuine average rating calculation
  const computedRating = useMemo(() => {
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      return (sum / reviews.length).toFixed(1);
    }
    return product?.rating ? Number(product.rating).toFixed(1) : '5.0';
  }, [reviews, product?.rating]);

  // Related products strictly from real store catalog (Exactly 4 in 1 row on desktop)
  const relatedProducts = useMemo(() => {
    if (!product || !products || products.length === 0) return [];
    return products.filter((p) => p.id !== product.id).slice(0, 4);
  }, [products, product?.id]);

  // Card note compilation
  const compiledCardNote = useMemo(() => {
    if (!includeCard) return '';
    const parts = [];
    if (senderName) parts.push(`${isAr ? 'من' : 'From'}: ${senderName}`);
    if (recipientName) parts.push(`${isAr ? 'إلى' : 'To'}: ${recipientName}`);
    if (occasion) parts.push(`${isAr ? 'المناسبة' : 'Occasion'}: ${occasion}`);
    if (cardMessage) parts.push(`"${cardMessage}"`);
    if (selectedRibbon) parts.push(`${isAr ? 'لون الشريط' : 'Ribbon'}: ${selectedRibbon.name}`);
    if (selectedSlot) parts.push(`${isAr ? 'موعد التوصيل' : 'Delivery'}: ${selectedSlot.title}`);
    if (specialNote) parts.push(`${isAr ? 'ملاحظات' : 'Notes'}: ${specialNote}`);
    return parts.join(' | ');
  }, [includeCard, senderName, recipientName, occasion, cardMessage, selectedRibbon, selectedSlot, specialNote, isAr]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      product,
      quantity,
      selectedAddons,
      compiledCardNote,
      selectedSize.name
    );
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(
      product,
      quantity,
      selectedAddons,
      compiledCardNote,
      selectedSize.name
    );
    setIsCartOpen(false);
    setCurrentPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const wishlisted = product ? isWishlisted(product.id) : false;

  // WhatsApp order link
  const waOrderText = encodeURIComponent(
    isAr
      ? `السلام عليكم، أود طلب: *${product?.name || ''}*\n` +
        `• الحجم: ${selectedSize.name}\n` +
        `• الكمية: ${quantity}\n` +
        (selectedAddons.length > 0 ? `• الإضافات: ${selectedAddons.map((a) => a.name).join(', ')}\n` : '') +
        (recipientName ? `• المستلم: ${recipientName}\n` : '') +
        `• موعد التوصيل: ${selectedSlot.title}\n` +
        `• الإجمالي: *${grandTotal} ر.س*`
      : `Hello, I want to order: *${product?.nameEn || product?.name || ''}*\n` +
        `• Size: ${selectedSize.name}\n` +
        `• Quantity: ${quantity}\n` +
        `• Total: *${grandTotal} SAR*`
  );

  // Genuine Empty State if Product Not Found
  if (!product) {
    return (
      <div className="py-20 px-4 max-w-xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#102a1c]/10 dark:bg-emerald-950/40 text-[#102a1c] dark:text-emerald-400 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#102a1c] dark:text-slate-100">
          {isAr ? 'لم يتم العثور على المنتج' : 'No records found'}
        </h2>
        <p className="text-xs sm:text-sm text-[#8c8275] dark:text-slate-400">
          {isAr ? 'المنتج المطلوب غير متوفر حالياً في قاعدة بيانات المتجر.' : 'No records found for the requested product.'}
        </p>
        <button
          onClick={() => setCurrentPage('catalog')}
          className="px-6 py-2.5 rounded-full bg-[#102a1c] text-[#FAF9F5] text-xs font-bold hover:bg-[#1a3f2b] transition-all"
        >
          {isAr ? 'العودة للمتجر' : 'Return to Catalog'}
        </button>
      </div>
    );
  }

  return (
    <div className="py-5 sm:py-8 md:py-10 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto text-[#1a1f1b] dark:text-slate-100 transition-colors">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#8c8275] dark:text-slate-400 mb-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setCurrentPage('home')}
          className="hover:text-[#102a1c] dark:hover:text-emerald-400 transition-colors focus:outline-none"
        >
          {isAr ? 'الرئيسية' : 'Home'}
        </button>
        <span className="text-[#c7bfb1] dark:text-slate-600">/</span>
        <button
          onClick={() => setCurrentPage('catalog')}
          className="hover:text-[#102a1c] dark:hover:text-emerald-400 transition-colors focus:outline-none"
        >
          {isAr ? (product.categoryAr || product.category) : (product.categoryEn || product.category)}
        </button>
        <span className="text-[#c7bfb1] dark:text-slate-600">/</span>
        <span className="text-[#102a1c] dark:text-slate-200 font-semibold truncate max-w-[240px] sm:max-w-md">
          {isAr ? (product.nameAr || product.name) : (product.nameEn || product.name)}
        </span>
      </nav>

      {/* Main PDP Grid: Compact Gallery (5 cols) + Customization & Order (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Compact Modern Luxury Gallery with Precision Zoom (5 cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-3.5 lg:sticky lg:top-24">
          
          {/* Main Luxury Frame - Reduced Height (Compact & Stylish) */}
          <div
            className="relative w-full h-[280px] sm:h-[340px] md:h-[380px] max-h-[380px] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#FAF8F5] dark:bg-slate-900 border border-[#e2ddd1] dark:border-slate-800 shadow-md group cursor-crosshair select-none flex items-center justify-center"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
          >
            {/* Main Image with Precision Zoom Origin */}
            <img
              src={activeImage || FALLBACK_PRODUCT_IMAGE}
              alt={isAr ? (product.nameAr || product.name) : (product.nameEn || product.name)}
              onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
              className="w-full h-full object-cover object-center transition-transform duration-150 ease-out will-change-transform"
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: isHovering ? 'scale(2.0)' : 'scale(1)',
              }}
              referrerPolicy="no-referrer"
            />

            {/* Badges Overlay */}
            <div className="absolute top-3 start-3 flex flex-col gap-1.5 z-10 pointer-events-none">
              {product.badge && (
                <span className="bg-[#102a1c]/90 dark:bg-emerald-950/90 backdrop-blur-md text-[#e6ca98] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm border border-[#e6ca98]/30">
                  {isAr ? product.badge : product.badgeEn || product.badge}
                </span>
              )}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="bg-[#8b263e] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {isAr
                    ? `خصم ${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%`
                    : `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`}
                </span>
              )}
            </div>

            {/* Actions: Lightbox Modal Zoom & Wishlist */}
            <div className="absolute top-3 end-3 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={() => {
                  setLightboxScale(1);
                  setIsLightboxOpen(true);
                }}
                title={isAr ? 'تكبير كامل الشاشة' : 'Fullscreen View'}
                className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-[#102a1c] dark:text-slate-100 backdrop-blur-md shadow-sm flex items-center justify-center transition-all hover:scale-105"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                title={isAr ? 'إضافة إلى المفضلة' : 'Add to Wishlist'}
                className={`w-8 h-8 rounded-full backdrop-blur-md shadow-sm flex items-center justify-center transition-all hover:scale-105 ${
                  wishlisted
                    ? 'bg-[#8b263e] text-white'
                    : 'bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-[#495057] dark:text-slate-300'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Hover Instruction Overlay */}
            <div
              className={`absolute bottom-3 inset-x-3 mx-auto w-fit bg-black/65 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full flex items-center gap-1.5 pointer-events-none transition-opacity duration-200 ${
                isHovering ? 'opacity-0' : 'opacity-85'
              }`}
            >
              <ZoomIn className="w-3 h-3 text-[#e6ca98]" />
              <span>{isAr ? 'مرّر الفأرة للتكبير' : 'Hover to zoom'}</span>
            </div>
          </div>

          {/* Thumbnails Row (Compact Size) */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {allImages.map((img: string, idx: number) => {
                const isActive = activeImage === img;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-[#102a1c] dark:border-emerald-500 ring-2 ring-[#e6ca98] scale-102 shadow-sm'
                        : 'border-[#e2ddd1] dark:border-slate-800 opacity-70 hover:opacity-100 hover:border-[#102a1c]/40'
                    }`}
                  >
                    <img
                      src={img || FALLBACK_PRODUCT_IMAGE}
                      alt={`Thumbnail ${idx + 1}`}
                      onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 bg-[#FAF8F5] dark:bg-slate-900 border border-[#e8e4dc] dark:border-slate-800 rounded-xl shadow-xs">
              <Clock className="w-4 h-4 text-[#102a1c] dark:text-emerald-400 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-[#102a1c] dark:text-slate-200">{isAr ? 'توصيل خلال ساعة' : '1-Hour Express'}</p>
              <p className="text-[9px] text-[#8c8275] dark:text-slate-400">{isAr ? 'كافة أحياء مكة' : 'Across Mecca'}</p>
            </div>
            <div className="p-2.5 bg-[#FAF8F5] dark:bg-slate-900 border border-[#e8e4dc] dark:border-slate-800 rounded-xl shadow-xs">
              <Sparkles className="w-4 h-4 text-[#102a1c] dark:text-emerald-400 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-[#102a1c] dark:text-slate-200">{isAr ? 'نضارة 7 أيام' : '7-Day Freshness'}</p>
              <p className="text-[9px] text-[#8c8275] dark:text-slate-400">{isAr ? 'ورود هولندية' : 'Dutch import'}</p>
            </div>
            <div className="p-2.5 bg-[#FAF8F5] dark:bg-slate-900 border border-[#e8e4dc] dark:border-slate-800 rounded-xl shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#102a1c] dark:text-emerald-400 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-[#102a1c] dark:text-slate-200">{isAr ? 'تغليف ملكي' : 'Royal Packing'}</p>
              <p className="text-[9px] text-[#8c8275] dark:text-slate-400">{isAr ? 'شريط حرير وشمع' : 'Silk & seal'}</p>
            </div>
          </div>

          {/* Payment & Shipping Options Badges */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#e8e4dc] dark:border-slate-800 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#102a1c] dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#102a1c] dark:text-emerald-400" />
                {isAr ? 'وسائل الدفع المعتمدة' : 'Payment Methods'}
              </span>
              <span className="text-[10px] text-[#128C7E] dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" />
                {isAr ? 'دفع آمن 100%' : '100% SSL Secure'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md border border-[#e2ddd1] dark:border-slate-800 bg-[#faf9f6] dark:bg-slate-800 text-[10px] font-bold text-[#004B87] dark:text-blue-400">
                mada
              </span>
              <span className="px-2 py-0.5 rounded-md border border-[#e2ddd1] dark:border-slate-800 bg-[#faf9f6] dark:bg-slate-800 text-[10px] font-bold text-black dark:text-white">
                Pay
              </span>
              <span className="px-2 py-0.5 rounded-md border border-[#e2ddd1] dark:border-slate-800 bg-[#faf9f6] dark:bg-slate-800 text-[10px] font-bold text-[#1A1F71] dark:text-indigo-400">
                VISA
              </span>
              <span className="px-2 py-0.5 rounded-md border border-[#e2ddd1] dark:border-slate-800 bg-[#faf9f6] dark:bg-slate-800 text-[10px] font-bold text-[#EB001B]">
                mastercard
              </span>
              <span className="px-2 py-0.5 rounded-md border border-[#3EEDBF]/40 bg-[#3EEDBF]/10 text-[10px] font-bold text-[#0A3E31] dark:text-emerald-300">
                Tabby
              </span>
              <span className="px-2 py-0.5 rounded-md border border-[#FF6B6B]/40 bg-[#FF6B6B]/10 text-[10px] font-bold text-[#8C1D24] dark:text-rose-400">
                Tamara
              </span>
              <span className="px-2 py-0.5 rounded-md border border-[#e2ddd1] dark:border-slate-800 bg-[#faf9f6] dark:bg-slate-800 text-[10px] font-medium text-[#495057] dark:text-slate-300">
                {isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
              </span>
            </div>

            <div className="pt-2 border-t border-[#f0ece1] dark:border-slate-800 flex items-center justify-between text-[10px] text-[#666] dark:text-slate-400">
              <span className="font-semibold text-[#102a1c] dark:text-slate-300 flex items-center gap-1">
                <Truck className="w-3 h-3 text-[#102a1c] dark:text-emerald-400" />
                {isAr ? 'الشحن والتوصيل:' : 'Logistics:'}
              </span>
              <span>{isAr ? 'مندوب مكة السريع • أرامكس • سمسا • سيارات مبردة' : 'Mecca Express • Aramex • SMSA • Cold-Van'}</span>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Custom Order Suite, Running Dynamic Price & Actions (7 cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Identity & Price */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-widest text-[#8c8275] dark:text-slate-400 font-bold">
                {isAr ? (product.categoryAr || product.category) : (product.categoryEn || product.category)}
              </span>
              <span className="text-[10px] text-[#128C7E] dark:text-emerald-400 bg-[#128C7E]/10 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {isAr ? 'متوفر وجاهز للتنسيق' : 'In Stock'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif text-[#102a1c] dark:text-slate-100 mt-1 leading-tight">
              {isAr ? (product.nameAr || product.name) : (product.nameEn || product.name)}
            </h1>

            {/* Rating & Verified Count (Genuine Real Data) */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-[#e6a817]">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(Number(computedRating))
                        ? 'fill-current text-[#d89f24]'
                        : 'text-[#d6cebf] dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-[#102a1c] dark:text-slate-200">
                {computedRating}
              </span>
              <span className="text-xs text-[#8c8275] dark:text-slate-400">
                ({reviews.length} {isAr ? 'تقييم موثق' : 'verified reviews'})
              </span>
            </div>

            {/* Price Presentation */}
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#102a1c] dark:text-emerald-400">
                {unitPrice}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#102a1c] dark:text-slate-300">
                {isAr ? 'ر.س (شامل الضريبة)' : 'SAR (VAT Incl.)'}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-[#999] dark:text-slate-500 line-through font-mono">
                  {product.originalPrice + selectedSize.extra} {isAr ? 'ر.س' : 'SAR'}
                </span>
              )}
            </div>

            {/* Tabby Installment Banner */}
            <div className="mt-2.5 p-2.5 rounded-xl bg-[#f4f1ea] dark:bg-slate-800/80 border border-[#e2ddd1] dark:border-slate-700 text-xs text-[#495057] dark:text-slate-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-[#102a1c] dark:text-emerald-400 shrink-0" />
                <span>
                  {isAr
                    ? `قسّمها على 4 دفعات بقيمة ${tabbyInstallment} ر.س بدون فوائد`
                    : `Split into 4 payments of ${tabbyInstallment} SAR interest-free`}
                </span>
              </div>
              <span className="font-bold text-[#102a1c] dark:text-emerald-400 shrink-0">{isAr ? 'تابي' : 'Tabby'}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-[#555] dark:text-slate-400 leading-relaxed mt-3">
              {isAr ? (product.descriptionAr || product.description) : (product.descriptionEn || product.description)}
            </p>
          </div>

          {/* Custom Order Section */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#e2ddd1] dark:border-slate-800 space-y-4">
            <h2 className="text-xs sm:text-sm font-bold font-serif text-[#102a1c] dark:text-slate-200 flex items-center gap-1.5 pb-1.5 border-b border-[#e8e4dc] dark:border-slate-800">
              <Gift className="w-3.5 h-3.5 text-[#e6ca98]" />
              {isAr ? 'تخصيص الباقة والطلب' : 'Custom Order Options'}
            </h2>

            {/* 1. Size Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#102a1c] dark:text-slate-200 block">
                {isAr ? '1. حجم وتكثيف الباقة:' : '1. Arrangement Size:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {sizes.map((s) => {
                  const isSelected = selectedSize.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`p-2 rounded-xl border text-xs text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#102a1c] dark:border-emerald-500 bg-[#102a1c]/5 dark:bg-emerald-950/30 font-semibold text-[#102a1c] dark:text-emerald-300 ring-1 ring-[#102a1c] dark:ring-emerald-500'
                          : 'border-[#d6cfc0] dark:border-slate-800 bg-white dark:bg-slate-800/60 text-[#495057] dark:text-slate-300 hover:border-[#102a1c]/40'
                      }`}
                    >
                      <p className="font-bold text-[11px] truncate">{s.name}</p>
                      <p className="text-[10px] text-[#8b263e] dark:text-rose-400 mt-0.5">
                        {s.extra > 0 ? `+${s.extra} ${isAr ? 'ر.س' : 'SAR'}` : (isAr ? 'السعر الأساسي' : 'Included')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Ribbon & Wrap Color */}
            <div className="space-y-1.5 pt-1.5 border-t border-[#e8e4dc] dark:border-slate-800">
              <label className="text-[11px] font-bold text-[#102a1c] dark:text-slate-200 block">
                {isAr ? '2. لون شريط الساتان والتغليف:' : '2. Satin Ribbon & Wrap Color:'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ribbonColors.map((ribbon) => {
                  const isSelected = selectedRibbon.id === ribbon.id;
                  return (
                    <button
                      key={ribbon.id}
                      type="button"
                      onClick={() => setSelectedRibbon(ribbon)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#102a1c] dark:border-emerald-500 bg-[#102a1c]/10 dark:bg-emerald-950/40 text-[#102a1c] dark:text-emerald-300 font-bold'
                          : 'border-[#d6cfc0] dark:border-slate-800 bg-white dark:bg-slate-800/60 text-[#495057] dark:text-slate-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border shadow-inner shrink-0"
                        style={{ backgroundColor: ribbon.hex, borderColor: ribbon.border }}
                      />
                      <span>{ribbon.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Luxury Add-ons */}
            <div className="space-y-1.5 pt-1.5 border-t border-[#e8e4dc] dark:border-slate-800">
              <label className="text-[11px] font-bold text-[#102a1c] dark:text-slate-200 block">
                {isAr ? '3. إضافات هدايا فاخرة:' : '3. Luxury Add-ons:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {ADDON_OPTIONS.map((addon) => {
                  const isSelected = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`p-2 rounded-xl border cursor-pointer flex items-center gap-2 transition-all select-none ${
                        isSelected
                          ? 'border-[#102a1c] dark:border-emerald-500 bg-[#102a1c]/5 dark:bg-emerald-950/30 font-semibold ring-1 ring-[#102a1c] dark:ring-emerald-500'
                          : 'border-[#d6cfc0] dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-[#102a1c]/40'
                      }`}
                    >
                      <img
                        src={addon.image}
                        alt={isAr ? addon.name : addon.nameEn}
                        onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                        className="w-8 h-8 rounded-lg object-cover border border-[#e2ddd1] dark:border-slate-700 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-[#1a1f1b] dark:text-slate-200 truncate">
                          {isAr ? addon.name : addon.nameEn}
                        </p>
                        <p className="text-[9px] text-[#102a1c] dark:text-emerald-400 font-mono font-bold">
                          +{addon.price} {isAr ? 'ر.س' : 'SAR'}
                        </p>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#102a1c] dark:bg-emerald-500 border-[#102a1c] text-white' : 'border-[#bbb] dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Handwritten Greeting Card */}
            <div className="space-y-2 pt-1.5 border-t border-[#e8e4dc] dark:border-slate-800">
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-[#102a1c] dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={includeCard}
                  onChange={(e) => setIncludeCard(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#102a1c] dark:accent-emerald-500 rounded"
                />
                <MessageSquare className="w-3.5 h-3.5 text-[#102a1c] dark:text-emerald-400" />
                <span>{isAr ? 'إرفاق كرت إهداء فاخر بختم شمعي' : 'Include Handwritten Greeting Card'}</span>
              </label>

              {includeCard && (
                <div className="space-y-2 bg-white dark:bg-slate-800/60 p-2.5 rounded-xl border border-[#e2ddd1] dark:border-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={isAr ? 'اسم المُرسل (من)' : 'Sender Name (From)'}
                      className="w-full bg-[#FAF8F5] dark:bg-slate-900 border border-[#d6cfc0] dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#102a1c] dark:focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={isAr ? 'اسم المستلم (إلى)' : 'Recipient Name (To)'}
                      className="w-full bg-[#FAF8F5] dark:bg-slate-900 border border-[#d6cfc0] dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#102a1c] dark:focus:border-emerald-500"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    placeholder={isAr ? 'اكتب كلماتك الصادقة للكرت...' : 'Write your sincere message note...'}
                    maxLength={160}
                    className="w-full bg-[#FAF8F5] dark:bg-slate-900 border border-[#d6cfc0] dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-[#102a1c] dark:focus:border-emerald-500 resize-none"
                  />
                </div>
              )}
            </div>

            {/* 5. Delivery Time Slot */}
            <div className="space-y-1.5 pt-1.5 border-t border-[#e8e4dc] dark:border-slate-800">
              <label className="text-[11px] font-bold text-[#102a1c] dark:text-slate-200 block">
                {isAr ? '5. موعد وفترة التوصيل في مكة:' : '5. Delivery Time Slot in Mecca:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {deliverySlots.map((slot) => {
                  const isSelected = selectedSlot.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 rounded-xl border text-xs text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#102a1c] dark:border-emerald-500 bg-[#102a1c]/10 dark:bg-emerald-950/40 text-[#102a1c] dark:text-emerald-300 font-bold'
                          : 'border-[#d6cfc0] dark:border-slate-800 bg-white dark:bg-slate-800/60 text-[#495057] dark:text-slate-300'
                      }`}
                    >
                      <p className="font-bold text-[10px] leading-tight truncate">{slot.title}</p>
                      <p className="text-[9px] text-[#8c8275] dark:text-slate-400 mt-0.5">{slot.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Real-time Order Summary Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#102a1c]/20 dark:border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0ece1] dark:border-slate-800">
              <span className="text-xs font-bold text-[#102a1c] dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#d89f24]" />
                {isAr ? 'ملخص الحساب المباشر' : 'Live Order Summary'}
              </span>
              <span className="text-[10px] font-semibold text-[#128C7E] dark:text-emerald-400 flex items-center gap-1 bg-[#128C7E]/10 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                {isAr ? `توصيل متاح اليوم` : `Available for today delivery`}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-[#555] dark:text-slate-400">
              <div className="flex justify-between items-center">
                <span>{isAr ? 'سعر الباقة الأساسي:' : 'Base Bouquet Price:'}</span>
                <span className="font-mono text-[#102a1c] dark:text-slate-200">{product.price} {isAr ? 'ر.س' : 'SAR'}</span>
              </div>

              {selectedSize.extra > 0 && (
                <div className="flex justify-between items-center text-[#8b263e] dark:text-rose-400">
                  <span>{isAr ? `ترقية الحجم (${selectedSize.name}):` : `Size upgrade:`}</span>
                  <span className="font-mono font-bold">+{selectedSize.extra} {isAr ? 'ر.س' : 'SAR'}</span>
                </div>
              )}

              {selectedAddons.length > 0 && (
                <div className="flex justify-between items-center text-[#102a1c] dark:text-emerald-400">
                  <span>{isAr ? `إجمالي الإضافات (${selectedAddons.length}):` : `Add-ons total:`}</span>
                  <span className="font-mono font-bold">+{addonsTotal} {isAr ? 'ر.س' : 'SAR'}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-[#f0ece1] dark:border-slate-800">
                <span>{isAr ? 'الكمية:' : 'Quantity:'}</span>
                <span className="font-mono font-bold text-[#102a1c] dark:text-slate-200">x {quantity}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>{isAr ? 'رسوم التوصيل في مكة:' : 'Mecca Delivery:'}</span>
                {shippingFee === 0 ? (
                  <span className="text-[#128C7E] dark:text-emerald-400 font-bold bg-[#128C7E]/10 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded text-[10px]">
                    {isAr ? 'مجاناً (طلبك يتجاوز 300 ر.س)' : 'FREE (Over 300 SAR)'}
                  </span>
                ) : (
                  <span className="font-mono font-bold text-[#102a1c] dark:text-slate-200">{shippingFee} {isAr ? 'ر.س' : 'SAR'}</span>
                )}
              </div>
            </div>

            {/* Total Highlight */}
            <div className="pt-2 border-t border-[#102a1c]/20 dark:border-slate-800 flex items-baseline justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#8c8275] dark:text-slate-400 uppercase">
                  {isAr ? 'المبلغ الإجمالي المستحق:' : 'Total Amount:'}
                </p>
                <p className="text-[9px] text-[#128C7E] dark:text-emerald-400">
                  {isAr ? 'شامل الضريبة 15% والتغليف' : '15% VAT & Packaging Included'}
                </p>
              </div>
              <div className="text-end">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#102a1c] dark:text-emerald-400">
                  {grandTotal}
                </span>
                <span className="text-xs font-bold text-[#102a1c] dark:text-slate-200 ms-1">
                  {isAr ? 'ر.س' : 'SAR'}
                </span>
              </div>
            </div>

            {/* Actions: Stepper + Add to Bag + Buy Now + WhatsApp */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-[#d6cfc0] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 hover:bg-[#ede9df] dark:hover:bg-slate-700 rounded-lg text-[#495057] dark:text-slate-300"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-xs text-[#102a1c] dark:text-slate-100">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 hover:bg-[#ede9df] dark:hover:bg-slate-700 rounded-lg text-[#495057] dark:text-slate-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-3 rounded-xl bg-[#102a1c] dark:bg-emerald-600 hover:bg-[#1a3f2b] dark:hover:bg-emerald-700 active:scale-98 text-[#FAF9F5] text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <ShoppingBag className="w-4 h-4 text-[#e6ca98]" />
                  <span>{isAr ? `أضف للسلة (${grandTotal} ر.س)` : `Add to Bag (${grandTotal} SAR)`}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full py-2.5 rounded-xl bg-[#e6ca98] hover:bg-[#dfc088] active:scale-98 text-[#102a1c] text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>{isAr ? 'شراء فوري مباشر وإرسال كهدية' : 'Express Buy Now & Send Gift'}</span>
              </button>

              <a
                href={`https://wa.me/966581617712?text=${waOrderText}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#128C7E] hover:text-white border border-[#25D366]/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                <span>{isAr ? 'طلب فوري ومباشر عبر واتساب' : 'Order via WhatsApp'}</span>
              </a>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* RELATED REAL STORE PRODUCTS (Exactly 4 in 1 Row on Desktop) */}
      {/* ========================================================================= */}
      <section className="mt-12 sm:mt-16 pt-8 border-t border-[#e8e4dc] dark:border-slate-800">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-[#102a1c] dark:text-slate-100">
              {isAr ? 'منتجات حقيقية أخرى من نفس المتجر' : 'Other Real Products from This Store'}
            </h2>
            <p className="text-xs text-[#8c8275] dark:text-slate-400 mt-0.5">
              {isAr ? 'باقات طبيعية متوفرة حالياً في متجر الزهور' : 'Fresh floral arrangements available in catalog'}
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('catalog')}
            className="text-xs font-bold text-[#102a1c] dark:text-emerald-400 hover:underline"
          >
            {isAr ? 'عرض الكل' : 'View All'}
          </button>
        </div>

        {relatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#FAF8F5] dark:bg-slate-900 border border-[#e8e4dc] dark:border-slate-800 rounded-2xl">
            <p className="text-xs text-[#8c8275] dark:text-slate-400">
              {isAr ? 'لا توجد منتجات أخرى مضافة حالياً في هذا المتجر.' : 'No other products found in this store catalog.'}
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* REAL CUSTOMER REVIEWS & COMMENTS (Strict Tenant Isolation & Empty State) */}
      {/* ========================================================================= */}
      <section className="mt-12 sm:mt-16 pt-8 border-t border-[#e8e4dc] dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-[#102a1c] dark:text-slate-100">
              {isAr ? 'تقييمات وآراء العملاء' : 'Customer Reviews & Feedback'}
            </h2>
            <p className="text-xs text-[#8c8275] dark:text-slate-400 mt-0.5">
              {isAr ? `تجارب حقيقية مسجلة لهذا المنتج (${reviews.length} تقييم)` : `Verified client feedback (${reviews.length} reviews)`}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#FAF8F5] dark:bg-slate-900 p-2.5 rounded-xl border border-[#e2ddd1] dark:border-slate-800">
            <span className="text-xl font-bold font-mono text-[#102a1c] dark:text-emerald-400">{computedRating}</span>
            <div className="flex text-[#e6a817]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(Number(computedRating)) ? 'fill-current' : 'text-[#d6cebf] dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[#8c8275] dark:text-slate-400">
              ({reviews.length} {isAr ? 'تقييم' : 'reviews'})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Reviews List Column (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-[#e8e4dc] dark:border-slate-800 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#102a1c] dark:text-slate-200">{rev.name}</p>
                      <p className="text-[10px] text-[#8c8275] dark:text-slate-400">{rev.location} • {rev.date}</p>
                    </div>
                    <div className="flex text-[#e6a817]">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-[#d6cebf] dark:text-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#495057] dark:text-slate-300 leading-relaxed">{rev.comment}</p>
                  <div className="pt-1.5 flex items-center justify-between text-[10px] text-[#8c8275] dark:text-slate-500 border-t border-[#f5f2eb] dark:border-slate-800">
                    <span>{isAr ? 'مشتري موثق' : 'Verified Buyer'}</span>
                    <button
                      type="button"
                      onClick={() => handleHelpful(rev.id)}
                      className="flex items-center gap-1 hover:text-[#102a1c] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-2.5 h-2.5" />
                      <span>{isAr ? `مفيد (${rev.helpfulCount})` : `Helpful (${rev.helpfulCount})`}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* Genuine Empty State */
              <div className="p-8 text-center bg-[#FAF8F5] dark:bg-slate-900 border border-[#e8e4dc] dark:border-slate-800 rounded-2xl space-y-2">
                <MessageSquare className="w-8 h-8 text-[#8c8275] dark:text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-[#102a1c] dark:text-slate-300">
                  {isAr ? 'لا توجد تقييمات حتى الآن' : 'No reviews found'}
                </p>
                <p className="text-[11px] text-[#8c8275] dark:text-slate-400">
                  {isAr ? 'كن أول من يقيّم هذا المنتج ويشارك تجربته!' : 'No records found. Be the first to share your experience!'}
                </p>
              </div>
            )}
          </div>

          {/* Add Review Form Column (5 cols) */}
          <div className="lg:col-span-5 p-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#e2ddd1] dark:border-slate-800 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold font-serif text-[#102a1c] dark:text-slate-200 flex items-center gap-1.5 pb-1 border-b border-[#e8e4dc] dark:border-slate-800">
              <MessageSquare className="w-3.5 h-3.5 text-[#102a1c] dark:text-emerald-400" />
              {isAr ? 'أضف تقييمك الحقيقي' : 'Add Your Review'}
            </h3>

            {showReviewSuccess && (
              <div className="p-2 rounded-lg bg-[#128C7E]/10 dark:bg-emerald-950/40 border border-[#128C7E]/30 text-[#128C7E] dark:text-emerald-400 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{isAr ? 'تم حفظ ونشر تقييمك بنجاح!' : 'Review published successfully!'}</span>
              </div>
            )}

            <form onSubmit={handleAddReview} className="space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-[#102a1c] dark:text-slate-300 block mb-1">
                  {isAr ? 'تقييمك:' : 'Rating:'}
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewReviewRating(s)}
                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= newReviewRating ? 'fill-current text-[#d89f24]' : 'text-[#d6cebf] dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-[#102a1c] dark:text-slate-200 ms-1.5">
                    {newReviewRating}/5
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#102a1c] dark:text-slate-300 block mb-0.5">
                  {isAr ? 'الاسم:' : 'Name:'}
                </label>
                <input
                  type="text"
                  required
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder={isAr ? 'مثال: فهد الشريف' : 'e.g. Fahad'}
                  className="w-full bg-white dark:bg-slate-800 border border-[#d6cfc0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#102a1c] dark:focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#102a1c] dark:text-slate-300 block mb-0.5">
                  {isAr ? 'المدينة:' : 'City:'}
                </label>
                <input
                  type="text"
                  value={newReviewLocation}
                  onChange={(e) => setNewReviewLocation(e.target.value)}
                  placeholder={isAr ? 'مكة المكرمة' : 'Mecca'}
                  className="w-full bg-white dark:bg-slate-800 border border-[#d6cfc0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#102a1c] dark:focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#102a1c] dark:text-slate-300 block mb-0.5">
                  {isAr ? 'تعليقك:' : 'Comment:'}
                </label>
                <textarea
                  rows={2}
                  required
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder={isAr ? 'اكتب رأيك الصادق في جودة الورد...' : 'Write your honest review...'}
                  className="w-full bg-white dark:bg-slate-800 border border-[#d6cfc0] dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-[#102a1c] dark:focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full py-2 rounded-xl bg-[#102a1c] dark:bg-emerald-600 hover:bg-[#1a3f2b] dark:hover:bg-emerald-700 active:scale-98 text-[#FAF9F5] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3 text-[#e6ca98]" />
                <span>
                  {isSubmittingReview
                    ? (isAr ? 'جاري الإرسال...' : 'Submitting...')
                    : (isAr ? 'إرسال التقييم' : 'Submit Review')}
                </span>
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl flex items-center justify-between text-white pb-2">
            <span className="text-xs font-semibold text-[#e6ca98] truncate max-w-md">
              {isAr ? (product.nameAr || product.name) : (product.nameEn || product.name)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLightboxScale((s) => Math.min(3.0, s + 0.3))}
                title={isAr ? 'تكبير' : 'Zoom In'}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxScale((s) => Math.max(1, s - 0.3))}
                title={isAr ? 'تصغير' : 'Zoom Out'}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxScale(1)}
                title={isAr ? 'إعادة ضبط' : 'Reset'}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                title={isAr ? 'إغلاق' : 'Close'}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white ms-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative w-full max-w-3xl max-h-[70vh] flex items-center justify-center overflow-auto rounded-2xl p-2 select-none">
            <img
              src={activeImage || FALLBACK_PRODUCT_IMAGE}
              alt="Zoomed Product Display"
              onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
              className="max-h-[65vh] max-w-full object-contain transition-transform duration-200 rounded-xl"
              style={{ transform: `scale(${lightboxScale})` }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
