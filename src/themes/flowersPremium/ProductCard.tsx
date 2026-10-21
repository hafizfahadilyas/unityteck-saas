import React from 'react';
import {
  Clock,
  Eye,
  Heart,
  ShoppingCart,
  Star,
  MessageCircle,
  Flower2,
  ShieldCheck,
  Truck,
  Sparkles,
} from 'lucide-react';
import type { Product } from '../../types';
import { whatsappOrderHref } from './WhatsAppChatFab';
import { getProductDisplayName, getProductDisplayCategory } from '../../utils/storeLocalization';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';

export type ProductCardDesignPreset = 'royal-luxury' | 'classic' | 'minimal';

type Props = {
  product: Product;
  lang: string;
  money: (n: number) => string;
  inCartQty?: number;
  inWishlist: boolean;
  onAddToCart: () => void;
  onQuickView: () => void;
  onToggleWishlist: () => void;
  cardDesignPreset?: ProductCardDesignPreset;
  showFeatureBadges?: boolean;
  showWhatsAppButton?: boolean;
};

/**
 * Pixel-Perfect Flowers Product Card.
 * Default preset: 'royal-luxury' matching the reference floral UI:
 * - Rounded modern card with soft shadow
 * - High-res portrait bouquet photo with '20% OFF' forest green badge
 * - Header row with Bold Title + Circular Wishlist Heart button
 * - Subtitle / Category row (e.g. "Premium Saudi Fresh Flowers")
 * - Price row: SAR 199 in deep forest green + strikethrough SAR 249
 * - 3 Trust badges: Fresh Flowers, Premium Quality, Fast Delivery
 * - Dual action buttons: 'Add to Cart' & 'Order on WhatsApp'
 *
 * Configurable via Dashboard Themes Customize & Page Builder.
 */
export const ProductCard: React.FC<Props> = ({
  product,
  lang,
  money,
  inCartQty = 0,
  inWishlist,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  cardDesignPreset = 'royal-luxury',
  showFeatureBadges = true,
  showWhatsAppButton = true,
}) => {
  const ar = lang === 'ar';
  const displayName = getProductDisplayName(product, ar ? 'ar' : 'en');
  const displayCategory = getProductDisplayCategory(product, ar ? 'ar' : 'en');

  // Subtitle / category descriptor
  const displaySubtitle = ar
    ? (product.subtitleAr || (product.categoryAr ? `${product.categoryAr} طبيعية فاخرة` : 'زهور سعودية طبيعية فاخرة'))
    : (product.subtitle || (product.categoryEn ? `Premium Saudi ${product.categoryEn}` : 'Premium Saudi Fresh Flowers'));

  // Calculate discount percentage or show product discount
  const originalPrice = product.originalPrice || (product.price ? Math.round(product.price * 1.25) : 0);
  const hasDiscount = originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 20;
  const discountBadgeText = ar ? `خصم ${discountPercent}%` : `${discountPercent}% OFF`;

  // WhatsApp Order message
  const whatsappMessage = [
    ar ? 'السلام عليكم ورحمة الله،' : 'Hello,',
    ar
      ? `أرغب بطلب: *${displayName}* (كود: ${product.sku})`
      : `I would like to order: *${displayName}* (SKU: ${product.sku})`,
    `${ar ? 'السعر' : 'Price'}: ${money(product.price)}`,
    ar ? 'التوصيل: مكة المكرمة' : 'Delivery: Makkah KSA',
  ];
  const whatsappLink = whatsappOrderHref(lang, whatsappMessage);

  // ─────────────────────────────────────────────────────────────
  // 1. ROYAL LUXURY PRESET (100% Match with Reference Image)
  // ─────────────────────────────────────────────────────────────
  if (cardDesignPreset === 'royal-luxury') {
    return (
      <article
        className="group rounded-[28px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/50 relative"
        style={{
          fontFamily: 'var(--font-ui, system-ui, sans-serif)',
        }}
      >
        {/* Product Image Area with Discount Badge */}
        <div
          className="relative aspect-[4/4.8] overflow-hidden cursor-pointer bg-slate-50 dark:bg-slate-950"
          onClick={onQuickView}
        >
          <img
            src={product.image || FALLBACK_PRODUCT_IMAGE}
            alt={displayName}
            onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
          />

          {/* Green Discount Badge (Top Start - Forest Green Pill) */}
          <div className="absolute top-3.5 start-3.5 z-10">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-[#0e4e3e] text-white shadow-md shadow-emerald-950/20">
              {discountBadgeText}
            </span>
          </div>

          {/* Quick View Floating Hint on Hover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView();
            }}
            className="absolute bottom-3 end-3 opacity-0 group-hover:opacity-100 transition-all duration-200 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white flex items-center justify-center shadow-md hover:scale-110 cursor-pointer"
            title={ar ? 'معاينة سريعة' : 'Quick preview'}
            aria-label={ar ? 'معاينة سريعة' : 'Quick preview'}
          >
            <Eye className="w-4 h-4 text-[#0e4e3e] dark:text-emerald-400" />
          </button>
        </div>

        {/* Product Details & Actions */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
          {/* Header Row: Title on Start, Circular Wishlist Button on End */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3
                onClick={onQuickView}
                className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[2.25rem] cursor-pointer hover:text-[#0e4e3e] dark:hover:text-emerald-400 transition-colors"
                title={displayName}
              >
                {displayName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
                {displaySubtitle}
              </p>
            </div>

            {/* Circular Wishlist Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shrink-0 shadow-2xs cursor-pointer"
              aria-pressed={inWishlist}
              title={inWishlist ? (ar ? 'محفوظ في المفضلة' : 'In Wishlist') : (ar ? 'أضف للمفضلة' : 'Add to Wishlist')}
              aria-label={inWishlist ? (ar ? 'محفوظ في المفضلة' : 'In Wishlist') : (ar ? 'أضف للمفضلة' : 'Add to Wishlist')}
            >
              <Heart
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                  inWishlist ? 'fill-rose-500 text-rose-500' : 'stroke-current'
                }`}
              />
            </button>
          </div>

          {/* Pricing Row: SAR 199 in deep emerald/teal + Strikethrough SAR 249 */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-xl sm:text-2xl font-extrabold text-[#0e4e3e] dark:text-emerald-400 font-mono tracking-tight">
              {money(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 line-through font-semibold font-mono">
                {money(originalPrice)}
              </span>
            )}
          </div>

          {/* 3 Trust Badges (Clean Text without Icons for 100% Readability) */}
          {showFeatureBadges && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-[#eaf4ef] dark:bg-emerald-950/40 text-[#0e4e3e] dark:text-emerald-300 border border-[#d2e8dd]/60 dark:border-emerald-800/30 whitespace-nowrap">
                {ar ? 'زهور طبيعية' : 'Fresh Flowers'}
              </span>

              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-[#eaf4ef] dark:bg-emerald-950/40 text-[#0e4e3e] dark:text-emerald-300 border border-[#d2e8dd]/60 dark:border-emerald-800/30 whitespace-nowrap">
                {ar ? 'جودة فاخرة' : 'Premium Quality'}
              </span>

              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-[#eaf4ef] dark:bg-emerald-950/40 text-[#0e4e3e] dark:text-emerald-300 border border-[#d2e8dd]/60 dark:border-emerald-800/30 whitespace-nowrap">
                {ar ? 'توصيل سريع' : 'Fast Delivery'}
              </span>
            </div>
          )}

          {/* Dual Action Buttons Row: Add to Cart + WhatsApp (Fully Readable Text, No Truncation) */}
          <div className="grid grid-cols-2 gap-2 pt-1.5">
            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={onAddToCart}
              className="w-full py-2 sm:py-2.5 px-2 rounded-full bg-[#0e4e3e] hover:bg-[#0a382c] text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer relative whitespace-nowrap"
              title={ar ? 'إضافة إلى السلة' : 'Add to Cart'}
            >
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span>{ar ? 'إضافة للسلة' : 'Add to Cart'}</span>
              {inCartQty > 0 && (
                <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                  {inCartQty}
                </span>
              )}
            </button>

            {/* Order on WhatsApp Button */}
            {showWhatsAppButton ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full py-2 sm:py-2.5 px-2 rounded-full bg-[#0e4e3e] hover:bg-[#0a382c] text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap"
                title={ar ? 'طلب فوري ومباشر عبر واتساب' : 'Instant Order on WhatsApp'}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0 fill-white" />
                <span>{ar ? 'واتساب' : 'WhatsApp'}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={onQuickView}
                className="w-full py-2 sm:py-2.5 px-2 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>{ar ? 'معاينة' : 'Quick View'}</span>
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CLASSIC PRESET (Card with hover actions)
  // ─────────────────────────────────────────────────────────────
  if (cardDesignPreset === 'classic') {
    return (
      <article
        className="group rounded-3xl border flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative"
        style={{
          background: 'var(--sf-surface, #ffffff)',
          borderColor: 'var(--sf-border, #e2e8f0)',
          boxShadow: 'var(--sf-card-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1))',
          color: 'var(--sf-text, #0f172a)',
        }}
      >
        <div
          className="relative aspect-4/3 overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-900"
          onClick={onQuickView}
        >
          <img
            src={product.image || FALLBACK_PRODUCT_IMAGE}
            alt={displayName}
            onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
          />

          <div
            className="absolute top-3 start-3 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm"
            style={{ background: 'rgba(4, 34, 43, 0.85)', color: '#ffffff' }}
          >
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>{ar ? 'توصيل مكة ساعتين' : '2h Makkah'}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist();
            }}
            className="absolute top-3 end-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-sm"
            style={{
              background: inWishlist ? '#e11d48' : 'rgba(255, 255, 255, 0.9)',
              color: inWishlist ? '#ffffff' : '#334155',
            }}
            aria-pressed={inWishlist}
            title={inWishlist ? (ar ? 'محفوظ في المفضلة' : 'In Wishlist') : (ar ? 'أضف للمفضلة' : 'Add to Wishlist')}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5" style={{ color: 'var(--sf-muted, #64748b)' }}>
              <span className="font-mono opacity-80">{product.sku}</span>
              <span
                className="font-bold text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  color: 'var(--sf-accent, #059669)',
                  background: 'color-mix(in srgb, var(--sf-accent, #059669) 12%, transparent)',
                }}
              >
                {displayCategory}
              </span>
            </div>
            <h4
              onClick={onQuickView}
              className="font-extrabold text-sm line-clamp-2 leading-snug cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: 'var(--sf-text, #0f172a)' }}
            >
              {displayName}
            </h4>
          </div>

          <div className="pt-2 border-t space-y-2.5" style={{ borderColor: 'var(--sf-border, #e2e8f0)' }}>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] block" style={{ color: 'var(--sf-muted, #64748b)' }}>
                  {ar ? 'شامل الضريبة 15%' : 'Incl. VAT'}
                </span>
                <span className="text-lg font-black tracking-tight" style={{ color: 'var(--sf-text, #0f172a)' }}>
                  {money(product.price)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 pt-1">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 sm:gap-1.5 shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-95 group/wa min-w-0"
                title={ar ? 'طلب فوري ومباشر عبر واتساب' : 'Instant Order via WhatsApp'}
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white group-hover/wa:rotate-12 transition-transform shrink-0" />
                <span className="truncate">{ar ? 'واتساب' : 'WhatsApp'}</span>
              </a>

              <button
                type="button"
                onClick={onAddToCart}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                style={{
                  background: inCartQty > 0 ? 'var(--sf-accent, #059669)' : 'var(--sf-bg, #f1f5f9)',
                  color: inCartQty > 0 ? '#ffffff' : 'var(--sf-text, #0f172a)',
                  border: '1px solid var(--sf-border, #e2e8f0)',
                }}
                title={ar ? 'إضافة إلى السلة' : 'Add to Bag'}
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {inCartQty > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">
                    {inCartQty}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. MINIMAL PRESET
  // ─────────────────────────────────────────────────────────────
  return (
    <article
      className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between"
    >
      <div
        className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
        onClick={onQuickView}
      >
        <img
          src={product.image || FALLBACK_PRODUCT_IMAGE}
          alt={displayName}
          onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="absolute top-2.5 end-2.5 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-rose-500"
        >
          <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      <div className="p-3.5 space-y-2">
        <h4 onClick={onQuickView} className="text-xs font-bold truncate cursor-pointer text-slate-900 dark:text-white">
          {displayName}
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-[#0e4e3e] dark:text-emerald-400 font-mono">
            {money(product.price)}
          </span>
          <button
            type="button"
            onClick={onAddToCart}
            className="w-8 h-8 rounded-full bg-[#0e4e3e] text-white flex items-center justify-center hover:scale-110 transition-transform"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
