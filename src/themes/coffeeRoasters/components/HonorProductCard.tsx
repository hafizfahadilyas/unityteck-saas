import React from 'react';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { Gift, Zap, CheckCircle2, ShoppingBag, Coffee, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';
import { resolveProductThumbnail, handleImageError } from '../../../utils/imageFallback';

interface HonorProductCardProps {
  product: Product;
  giftValue?: number;
  giftItems?: { nameAr: string; nameEn: string; iconType?: string }[];
  specLabel?: string;
  specLabelAr?: string;
  onBuyNow?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const HonorProductCard: React.FC<HonorProductCardProps> = ({
  product,
  giftValue,
  giftItems,
  specLabel,
  specLabelAr,
  onBuyNow,
  onAddToCart,
}) => {
  const { navigateTo, language, addToCart, triggerFlyToCart } = useCart();
  const isAr = language === 'AR';

  // Dynamic calculations
  const price = product.basePrice || 0;
  const currency = isAr ? 'ر.س' : 'SAR';

  // Installment calculation (e.g. 4 or 12 months)
  const installmentMonths = 4;
  const monthlyInstallment = (price / installmentMonths).toFixed(2);

  // Dynamic gift value if not provided
  const computedGiftVal =
    giftValue || (price > 2000 ? 457 : price > 1000 ? 397 : price > 500 ? 298 : 150);

  // Dynamic gift thumbnails with REAL SVG icons (Zero cartoon emojis policy)
  const defaultGifts = [
    { nameAr: 'مكبس معاير', nameEn: 'Tamper', iconType: 'coffee' },
    { nameAr: 'إبريق تبخير', nameEn: 'Pitcher', iconType: 'sparkles' },
    { nameAr: 'طقم تنظيف', nameEn: 'Cleaning Kit', iconType: 'shield' },
  ];
  const activeGifts = giftItems || defaultGifts;

  const renderGiftIcon = (type?: string) => {
    switch (type) {
      case 'sparkles':
        return <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#78471A]" />;
      case 'shield':
        return <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#78471A]" />;
      case 'coffee':
      default:
        return <Coffee className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#78471A]" />;
    }
  };

  // Dynamic spec pill
  const computedSpec =
    (isAr ? specLabelAr : specLabel) ||
    (isAr ? product.badgeAr || '٢٠ بار دبل بويلر' : product.badge || '20-Bar Dual PID');

  const prodImg =
    product.images?.[0] ||
    product.colors?.[0]?.image ||
    (product as any).image ||
    '/src/assets/images/hibrew_h7a_flagship_machine.png';

  const prodTitle = isAr ? product.nameAr || product.name : product.name;
  const [justAdded, setJustAdded] = React.useState(false);

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuyNow) {
      onBuyNow(product);
    } else {
      addToCart(product, undefined, undefined, undefined, undefined, false);
      navigateTo('product-buy', String(product.id));
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (triggerFlyToCart) {
      triggerFlyToCart(rect, prodImg);
    }
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addToCart(product, undefined, undefined, undefined, undefined, true);
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleLearnMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateTo('product-detail', String(product.id));
  };

  return (
    <div
      onClick={() => navigateTo('product-detail', String(product.id))}
      className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border-0 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer text-center relative overflow-hidden select-none"
    >
      {/* 1. TOP HEADER: Product Name */}
      <div className="space-y-1.5 sm:space-y-2.5">
        <h3
          className={`font-black text-xs sm:text-base lg:text-lg text-neutral-900 group-hover:text-black line-clamp-1 transition-colors ${
            isAr ? 'tracking-normal' : 'tracking-tight'
          }`}
          title={prodTitle}
        >
          {prodTitle}
        </h3>

        {/* 2. GIFT PERKS PILL (Warm Coffee Bronze Style with SVG icons) */}
        <div className="bg-[#F8F2EC] border-0 rounded-xl sm:rounded-2xl px-2 py-1 sm:px-3 sm:py-1.5 flex items-center justify-between gap-1 sm:gap-2 text-[9px] sm:text-[11px] font-bold text-[#78471A]">
          <div className="flex items-center gap-1 shrink-0 min-w-0">
            <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#78471A] shrink-0" />
            <span className="truncate">
              {isAr ? `هدايا ${computedGiftVal} ر.س` : `Gifts ${computedGiftVal} SAR`}
            </span>
          </div>

          {/* Mini Gift Item SVG Icons */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {activeGifts.slice(0, 2).map((item, idx) => (
              <span
                key={idx}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-white border-0 flex items-center justify-center shadow-2xs"
                title={isAr ? item.nameAr : item.nameEn}
              >
                {renderGiftIcon(item.iconType)}
              </span>
            ))}
          </div>
        </div>

        {/* 3. BOLD PRICE + INSTALLMENT NOTE */}
        <div className="pt-1 sm:pt-2 text-center space-y-0.5 sm:space-y-1">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-lg sm:text-2xl lg:text-3xl font-black text-black tracking-tight font-sans">
              {price.toLocaleString()}
            </span>
            <span className="text-[11px] sm:text-sm font-bold text-neutral-800">{currency}</span>
            {product.originalPrice && product.originalPrice > price && (
              <span className="text-[10px] sm:text-xs text-neutral-400 line-through ms-1 sm:ms-2 font-sans">
                {product.originalPrice.toLocaleString()} {currency}
              </span>
            )}
          </div>

          {/* Installment breakdown (Tabby & Tamara style) */}
          <p className="text-[9px] sm:text-[11px] text-neutral-500 font-medium truncate">
            {isAr
              ? `أو يبدأ من ${monthlyInstallment} ر.س / شهرياً`
              : `Or from ${monthlyInstallment} SAR / mo`}
          </p>

          {/* Spec / Variant Pill */}
          {computedSpec && (
            <div className="pt-0.5">
              <span className="inline-block text-[8px] sm:text-[10px] font-bold text-neutral-700 bg-neutral-100/90 border-0 px-2 py-0.5 rounded-full font-sans max-w-full truncate">
                {computedSpec}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. PRODUCT IMAGE SHOWCASE (Centered, Clean, High Res) */}
      <div className="relative w-full h-32 sm:h-48 lg:h-56 flex items-center justify-center my-2 sm:my-4 overflow-hidden p-1.5 sm:p-3 bg-neutral-50/50 rounded-xl sm:rounded-2xl">
        <img
          src={prodImg}
          alt={prodTitle}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-sm select-none"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            if (!t.dataset.fb) {
              t.dataset.fb = '1';
              t.src = '/src/assets/images/hibrew_h7a_flagship_machine.png';
            } else if (t.dataset.fb === '1') {
              t.dataset.fb = '2';
              t.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23f1f5f9"/><path d="M70 130 L95 100 L115 120 L130 105 L150 130 Z" fill="%23cbd5e1"/><circle cx="85" cy="80" r="12" fill="%23cbd5e1"/></svg>';
            }
          }}
        />
      </div>

      {/* 5. BOTTOM ACTION BUTTONS: Dual Buttons [Buy Now + Add to Cart] & Spaced [Learn More] */}
      <div className="pt-2 sm:pt-3 space-y-2">
        {/* Dual CTA Buttons (Side-by-Side) */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {/* Buy Now Button */}
          <button
            type="button"
            onClick={handleBuy}
            className="w-full py-2 sm:py-2.5 px-1.5 sm:px-2 bg-black hover:bg-neutral-800 text-white font-bold text-[10px] xs:text-[11px] sm:text-xs rounded-full border-0 transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs hover:shadow-md flex items-center justify-center gap-1 min-w-0"
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 shrink-0" />
            <span className="truncate whitespace-nowrap">{isAr ? 'اشتر الآن' : 'Buy Now'}</span>
          </button>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAdd}
            className={`w-full py-2 sm:py-2.5 px-1.5 sm:px-2 font-bold text-[10px] xs:text-[11px] sm:text-xs rounded-full border-0 transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs hover:shadow-md flex items-center justify-center gap-1 min-w-0 ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-100 hover:bg-neutral-200/90 text-neutral-900'
            }`}
          >
            {justAdded ? (
              <>
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0" />
                <span className="truncate whitespace-nowrap">{isAr ? 'تمت الإضافة' : 'Added'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-800 shrink-0" />
                <span className="truncate whitespace-nowrap">{isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>

        {/* Learn More Button (Subtle, slightly visible with dedicated spacing) */}
        <button
          type="button"
          onClick={handleLearnMore}
          className="w-full py-1.5 sm:py-2 px-3 rounded-full text-[11px] sm:text-xs font-semibold text-neutral-600 hover:text-black bg-neutral-50/90 hover:bg-neutral-100 border-0 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 group/lm shadow-2xs"
        >
          <span>{isAr ? 'اعرف المزيد' : 'Learn More'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover/lm:text-black rtl:rotate-180 transition-transform group-hover/lm:translate-x-0.5 rtl:group-hover/lm:-translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
