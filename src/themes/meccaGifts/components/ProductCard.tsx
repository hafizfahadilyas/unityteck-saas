import React from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { Product } from '../types';
import {
  Heart,
  ShoppingCart,
  MessageCircle,
  Flower2,
  ShieldCheck,
  Truck,
  Eye,
  Sparkles,
} from 'lucide-react';
import { handleImageError, FALLBACK_PRODUCT_IMAGE, cleanImageUrl } from '../../../utils/imageFallback';
import { readAllThemeSettings } from '../../settings/themeSettingsStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product }) => {
  const {
    language,
    addToCart,
    isWishlisted,
    toggleWishlist,
    navigateToProduct,
  } = useApp();

  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const wishlisted = isWishlisted(product.id);
  const productName = isAr ? (product.nameAr || product.name) : (product.nameEn || product.name);
  const productAny = product as any;
  const subtitle = isAr
    ? (productAny.descriptionAr || productAny.subtitleAr || (product.categoryAr ? `${product.categoryAr} طبيعية فاخرة` : 'زهور سعودية طبيعية فاخرة'))
    : (productAny.descriptionEn || productAny.subtitle || (product.categoryEn ? `Premium Saudi ${product.categoryEn}` : 'Premium Saudi Fresh Flowers'));

  const themeSettings = React.useMemo(() => {
    return readAllThemeSettings(activeStore?.id || 'store-1', activeStore);
  }, [activeStore]);

  const cardSettings = themeSettings.productCards;
  const cardPreset = cardSettings.cardDesignPreset || 'royal-luxury';
  const showBadges = cardSettings.showFeatureBadges !== false;
  const showWhatsApp = cardSettings.showWhatsAppButton !== false;

  const origPrice = product.originalPrice || (product.price ? Math.round(product.price * 1.25) : 0);
  const hasDiscount = origPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((origPrice - product.price) / origPrice) * 100)
    : 20;
  const discountBadge = isAr ? `خصم ${discountPct}%` : `${discountPct}% OFF`;

  const handleCardClick = () => {
    navigateToProduct(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const storePhone = (activeStore as any)?.phone || '966500000000';
  const cleanPhone = storePhone.replace(/[^0-9]/g, '');

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = isAr
      ? `السلام عليكم، أود طلب المنتج: *${productName}* بسعر ${product.price} ر.س من متجر ${activeStore?.name || 'الزهور'}`
      : `Hello, I would like to order: *${productName}* for SAR ${product.price} from ${activeStore?.name || 'Flowers Store'}`;
    const url = `https://wa.me/${cleanPhone || '966500000000'}?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. ROYAL LUXURY FLORIST CARD (Default for Flowers & Reference UI)
  // ─────────────────────────────────────────────────────────────
  if (cardPreset === 'royal-luxury') {
    return (
      <article
        onClick={handleCardClick}
        itemScope
        itemType="https://schema.org/Product"
        className="group rounded-[28px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/50 cursor-pointer select-none relative"
      >
        {/* Image Container with Forest Green Discount Badge */}
        <div className="relative aspect-[4/4.8] overflow-hidden bg-slate-50 dark:bg-slate-950">
          <img
            src={cleanImageUrl(product.image) || FALLBACK_PRODUCT_IMAGE}
            alt={productName}
            itemProp="image"
            onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
            className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
            loading="lazy"
            decoding="async"
          />

          {/* 20% OFF Badge (Top-Start Forest Green Pill) */}
          <div className="absolute top-3.5 start-3.5 z-10">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-[#0e4e3e] text-white shadow-md shadow-emerald-950/20">
              {discountBadge}
            </span>
          </div>

          {/* Quick View Hover Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToProduct(product);
            }}
            className="absolute bottom-3 end-3 opacity-0 group-hover:opacity-100 transition-all duration-200 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white flex items-center justify-center shadow-md hover:scale-110 cursor-pointer"
            title={isAr ? 'معاينة سريعة' : 'Quick preview'}
          >
            <Eye className="w-4 h-4 text-[#0e4e3e] dark:text-emerald-400" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
          {/* Header Row: Title & Circular Wishlist */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3
                itemProp="name"
                className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[2.25rem] group-hover:text-[#0e4e3e] dark:group-hover:text-emerald-400 transition-colors"
                title={productName}
              >
                {productName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
                {subtitle}
              </p>
            </div>

            {/* Circular Wishlist Button */}
            <button
              type="button"
              onClick={handleWishlistToggle}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shrink-0 shadow-2xs cursor-pointer"
              aria-pressed={wishlisted}
              title={wishlisted ? (isAr ? 'محفوظ في المفضلة' : 'In Wishlist') : (isAr ? 'أضف للمفضلة' : 'Add to Wishlist')}
            >
              <Heart
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                  wishlisted ? 'fill-rose-500 text-rose-500' : 'stroke-current'
                }`}
              />
            </button>
          </div>

          {/* Price Row: SAR 199 in deep emerald/teal + Strikethrough SAR 249 */}
          <div className="flex items-baseline gap-2 pt-0.5" itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <span className="text-xl sm:text-2xl font-extrabold text-[#0e4e3e] dark:text-emerald-400 font-mono tracking-tight" itemProp="price">
              {isAr ? `${product.price} ر.س` : `SAR ${product.price}`}
            </span>
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 line-through font-semibold font-mono">
                {isAr ? `${origPrice} ر.س` : `SAR ${origPrice}`}
              </span>
            )}
          </div>

          {/* 3 Trust Badges: Clean Text without Icons for 100% Readability */}
          {showBadges && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-[#eaf4ef] dark:bg-emerald-950/40 text-[#0e4e3e] dark:text-emerald-300 border border-[#d2e8dd]/60 dark:border-emerald-800/30 whitespace-nowrap">
                {isAr ? 'زهور طبيعية' : 'Fresh Flowers'}
              </span>

              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-[#eaf4ef] dark:bg-emerald-950/40 text-[#0e4e3e] dark:text-emerald-300 border border-[#d2e8dd]/60 dark:border-emerald-800/30 whitespace-nowrap">
                {isAr ? 'جودة فاخرة' : 'Premium Quality'}
              </span>

              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-[#eaf4ef] dark:bg-emerald-950/40 text-[#0e4e3e] dark:text-emerald-300 border border-[#d2e8dd]/60 dark:border-emerald-800/30 whitespace-nowrap">
                {isAr ? 'توصيل سريع' : 'Fast Delivery'}
              </span>
            </div>
          )}

          {/* Dual Action Buttons Row: Add to Cart + WhatsApp (Fully Readable Text, No Truncation) */}
          <div className="grid grid-cols-2 gap-2 pt-1.5">
            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full py-2 sm:py-2.5 px-2 rounded-full bg-[#0e4e3e] hover:bg-[#0a382c] text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap"
              title={isAr ? 'إضافة إلى السلة' : 'Add to Cart'}
            >
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'إضافة للسلة' : 'Add to Cart'}</span>
            </button>

            {/* Order on WhatsApp Button */}
            {showWhatsApp ? (
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="w-full py-2 sm:py-2.5 px-2 rounded-full bg-[#0e4e3e] hover:bg-[#0a382c] text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap"
                title={isAr ? 'طلب عبر واتساب' : 'Order on WhatsApp'}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0 fill-white" />
                <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCardClick}
                className="w-full py-2 sm:py-2.5 px-2 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{isAr ? 'معاينة' : 'Quick View'}</span>
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CLASSIC DARK EMERALD / GOLD OVERLAY PRESET
  // ─────────────────────────────────────────────────────────────
  return (
    <article
      onClick={handleCardClick}
      itemScope
      itemType="https://schema.org/Product"
      className="group relative w-full h-[400px] sm:h-[430px] md:h-[460px] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer select-none border border-[#e8e4dc] hover:border-[#d4af37]/70 shadow-md hover:shadow-2xl transition-all duration-500 transform-gpu hover:-translate-y-1.5 flex flex-col justify-between p-3.5 sm:p-4.5 bg-[#102a1c]"
    >
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0d2217]">
        <img
          src={cleanImageUrl(product.image) || FALLBACK_PRODUCT_IMAGE}
          alt={productName}
          itemProp="image"
          onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
          className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-112 transition-transform duration-700 ease-out will-change-transform"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/15 transition-opacity duration-500 group-hover:opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#091b11]/95 via-[#102a1c]/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
      </div>

      <div className="relative z-10 flex items-center justify-between w-full">
        <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-[#102a1c]/90 text-[#e6ca98] text-[10px] sm:text-[11px] font-bold border border-[#d4af37]/40 shadow-lg backdrop-blur-md transform transition-all duration-300 group-hover:scale-105 group-hover:border-[#d4af37] max-w-[70%] truncate">
          <Sparkles className="w-2.5 h-2.5 text-[#d4af37] shrink-0" />
          <span className="truncate">{discountBadge}</span>
        </span>

        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg backdrop-blur-md cursor-pointer transform hover:scale-115 active:scale-90 ${
            wishlisted
              ? 'bg-[#8b263e] text-white shadow-[#8b263e]/40'
              : 'bg-black/50 hover:bg-black/80 text-white border border-white/30'
          }`}
        >
          <Heart className={`w-4 h-4 transition-transform duration-300 ${wishlisted ? 'fill-current scale-110' : 'group-hover/btn:scale-110'}`} />
        </button>
      </div>

      <div className="relative z-10 w-full space-y-2.5">
        <h3
          itemProp="name"
          className="text-base sm:text-lg font-bold text-white line-clamp-1 group-hover:text-[#f3e5c8] transition-colors duration-300 drop-shadow-sm"
        >
          {productName}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-lg sm:text-xl font-extrabold text-[#f3e5c8] font-mono tracking-tight">
            {isAr ? `${product.price} ر.س` : `SAR ${product.price}`}
          </span>
          {hasDiscount && (
            <span className="text-xs text-white/60 line-through font-mono">
              {isAr ? `${origPrice} ر.س` : `SAR ${origPrice}`}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full py-2.5 px-3 rounded-full bg-[#d4af37] hover:bg-[#c39e26] text-[#0d2217] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{isAr ? 'إضافة للسلة' : 'Add to Cart'}</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppOrder}
            className="w-full py-2.5 px-3 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0 fill-white" />
            <span className="truncate">{isAr ? 'واتساب' : 'WhatsApp'}</span>
          </button>
        </div>
      </div>
    </article>
  );
});
