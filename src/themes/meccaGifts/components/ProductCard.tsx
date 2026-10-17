import React from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { Heart, Star, ShoppingBag, MessageCircle, Sparkles } from 'lucide-react';
import { MECCA_WHATSAPP } from '../data/mockData';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../../utils/imageFallback';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product }) => {
  const {
    language,
    addToCart,
    isWishlisted,
    toggleWishlist,
    navigateToProduct
  } = useApp();

  const isAr = language === 'ar';
  const wishlisted = isWishlisted(product.id);
  const productName = isAr ? (product.nameAr || product.name) : (product.nameEn || product.name);
  const categoryName = isAr ? (product.categoryAr || product.category) : (product.categoryEn || product.category);
  const badgeText = product.badge ? (isAr ? product.badge : product.badgeEn || product.badge) : null;

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

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = isAr
      ? `مرحباً متجر هدايا مكة، أود طلب المنتج: *${productName}* بسعر ${product.price} ر.س. يرجى تأكيد التوصيل في مكة المكرمة.`
      : `Hello Hadaya Mecca, I would like to order: *${productName}* for ${product.price} SAR. Please confirm delivery.`;
    const url = `https://wa.me/${MECCA_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <article
      onClick={handleCardClick}
      itemScope
      itemType="https://schema.org/Product"
      className="group relative w-full h-[400px] sm:h-[430px] md:h-[460px] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer select-none border border-[#e8e4dc] hover:border-[#d4af37]/70 shadow-md hover:shadow-2xl transition-all duration-500 transform-gpu hover:-translate-y-1.5 flex flex-col justify-between p-3.5 sm:p-4.5 bg-[#102a1c]"
    >
      {/* ── 1. Full Height Background Image with Zoom In/Out Animation ────── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0d2217]">
        <img
          src={product.image || FALLBACK_PRODUCT_IMAGE}
          alt={productName}
          itemProp="image"
          onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
          className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-112 transition-transform duration-700 ease-out will-change-transform"
          loading="lazy"
          decoding="async"
        />

        {/* Base Ambient Dark Gradient (Ensures perfect text contrast) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/15 transition-opacity duration-500 group-hover:opacity-90" />

        {/* Luxury Gold/Emerald Hover Overlay with Fade & Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#091b11]/95 via-[#102a1c]/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
      </div>

      {/* ── 2. Top Floating Controls: Badge + Wishlist Button ──────────────── */}
      <div className="relative z-10 flex items-center justify-between w-full">
        {/* Badge with Slide-in / Scale Animation */}
        {badgeText ? (
          <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-[#102a1c]/90 text-[#e6ca98] text-[10px] sm:text-[11px] font-bold border border-[#d4af37]/40 shadow-lg backdrop-blur-md transform transition-all duration-300 group-hover:scale-105 group-hover:border-[#d4af37] max-w-[70%] truncate">
            <Sparkles className="w-2.5 h-2.5 text-[#d4af37] shrink-0" />
            <span className="truncate">{badgeText}</span>
          </span>
        ) : (
          <span />
        )}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg backdrop-blur-md cursor-pointer transform hover:scale-115 active:scale-90 ${
            wishlisted
              ? 'bg-[#8b263e] text-white shadow-[#8b263e]/40'
              : 'bg-black/50 hover:bg-black/80 text-white border border-white/30'
          }`}
        >
          <Heart className={`w-4 h-4 transition-transform duration-300 ${wishlisted ? 'fill-current scale-110' : 'group-hover/btn:scale-110'}`} />
        </button>
      </div>

      {/* ── 3. Bottom Information & Interactive Action Bar ─────────────────── */}
      <div className="relative z-10 w-full space-y-2.5 text-white">
        {/* Category Label */}
        <p className="text-[10px] sm:text-[11px] text-[#e6ca98] uppercase tracking-wider font-semibold opacity-95 transition-transform duration-300 group-hover:translate-x-0.5">
          {categoryName}
        </p>

        {/* Product Title */}
        <h3
          itemProp="name"
          className="text-sm sm:text-base font-bold text-white line-clamp-1 group-hover:text-[#f3e5ab] transition-colors duration-300 leading-snug drop-shadow-md"
        >
          {productName}
        </h3>

        {/* Rating Stars & Reviews */}
        <div className="flex items-center gap-1.5 text-[11px] text-white/90">
          <div role="img" className="flex text-[#e6a817]" aria-label={`Rating: ${product.rating} stars`}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                  i < Math.floor(product.rating)
                    ? 'fill-current text-[#d89f24]'
                    : 'text-white/40'
                }`}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] sm:text-[11px] text-[#f3e5ab] font-medium">
            ({product.reviewsCount})
          </span>
        </div>

        {/* Price & Currency Tag with Structured Data */}
        <div
          itemProp="offers"
          itemScope
          itemType="https://schema.org/Offer"
          className="flex items-baseline gap-2 pt-1 border-t border-white/15"
        >
          <meta itemProp="priceCurrency" content="SAR" />
          <meta itemProp="price" content={String(product.price)} />
          <meta
            itemProp="availability"
            content={product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"}
          />

          <span className="text-base sm:text-lg md:text-xl font-bold font-mono tabular-nums text-[#f3e5ab] drop-shadow">
            {product.price}
          </span>
          <span className="text-xs text-[#e6ca98] font-bold">
            {isAr ? 'ر.س' : 'SAR'}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-white/50 line-through font-mono tabular-nums ml-1">
              {product.originalPrice} {isAr ? 'ر.س' : 'SAR'}
            </span>
          )}
        </div>

        {/* ── 4. Interactive Action Buttons with Slide & Hover Animations ──── */}
        <div className="flex items-center gap-2 pt-1 transition-all duration-300 transform sm:translate-y-1 sm:group-hover:translate-y-0">
          {/* Add to Bag CTA Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#102a1c] to-[#1d4731] hover:from-[#d4af37] hover:to-[#f1df9b] text-[#FAF9F5] hover:text-[#102a1c] text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-300 border border-[#d4af37]/50 hover:border-[#f3e5ab] shadow-lg active:scale-95 cursor-pointer group/add"
            aria-label={isAr ? "أضف المنتج إلى سلة المشتريات" : "Add product to shopping cart"}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e6ca98] group-hover/add:text-[#102a1c] shrink-0 transition-transform duration-300 group-hover/add:scale-110" />
            <span className="whitespace-nowrap font-semibold">
              {isAr ? 'أضف للسلة' : 'Add to Bag'}
            </span>
          </button>

          {/* WhatsApp Direct Order Button */}
          <button
            type="button"
            onClick={handleWhatsAppOrder}
            className="py-2.5 px-3 rounded-xl bg-[#25D366]/25 hover:bg-[#25D366] text-[#25D366] hover:text-white active:scale-95 text-xs font-bold flex items-center justify-center gap-1 transition-all duration-300 border border-[#25D366]/50 shadow-lg cursor-pointer shrink-0 group/wa"
            title={isAr ? 'طلب مباشر عبر واتساب' : 'Direct WhatsApp Order'}
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover/wa:scale-115" />
            <span className="hidden lg:inline whitespace-nowrap text-xs">
              {isAr ? 'واتساب' : 'WhatsApp'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
});
