import React from 'react';
import { Clock, Eye, Heart, ShoppingCart, Star, MessageCircle, Sparkles } from 'lucide-react';
import type { Product } from '../../types';
import { whatsappOrderHref } from './WhatsAppChatFab';

type Props = {
  product: Product;
  lang: string;
  money: (n: number) => string;
  inCartQty?: number;
  inWishlist: boolean;
  onAddToCart: () => void;
  onQuickView: () => void;
  onToggleWishlist: () => void;
};

/** Theme Settings 15 — modern luxury florist product card with WhatsApp Ordering. */
export const ProductCard: React.FC<Props> = ({
  product,
  lang,
  money,
  inCartQty = 0,
  inWishlist,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
}) => {
  const ar = lang === 'ar';

  const whatsappMessage = [
    ar ? 'السلام عليكم ورحمة الله،' : 'Hello,',
    ar
      ? `أرغب بطلب: *${product.name}* (كود: ${product.sku})`
      : `I would like to order: *${product.name}* (SKU: ${product.sku})`,
    `${ar ? 'السعر' : 'Price'}: ${money(product.price)}`,
    ar ? 'التوصيل: مكة المكرمة' : 'Delivery: Makkah KSA',
  ];

  const whatsappLink = whatsappOrderHref(lang, whatsappMessage);

  return (
    <article
      className="group rounded-3xl border flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative"
      style={{
        background: 'var(--sf-surface)',
        borderColor: 'var(--sf-border)',
        boxShadow: 'var(--sf-card-shadow)',
        color: 'var(--sf-text)',
      }}
    >
      {/* Product Image Area with Quick View & Wishlist */}
      <div
        className="relative aspect-4/3 overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-900"
        onClick={onQuickView}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
        />

        {/* 2-Hour Delivery Badge */}
        <div
          className="absolute top-3 start-3 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm"
          style={{ background: 'rgba(4, 34, 43, 0.85)', color: '#ffffff' }}
        >
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>{ar ? 'توصيل مكة ساعتين' : '2h Makkah'}</span>
        </div>

        {/* Luxury Badge */}
        <div
          className="absolute top-3 end-12 text-[9px] font-extrabold px-2 py-0.5 rounded-md backdrop-blur-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
          style={{ background: 'rgba(217, 119, 6, 0.9)', color: '#ffffff' }}
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>{ar ? 'ملكي فاخر' : 'Royal Lux'}</span>
        </div>

        {/* Quick View Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickView();
          }}
          className="absolute bottom-2.5 start-2.5 text-[10px] font-black px-2.5 py-1.5 rounded-xl shadow-md flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#0f172a',
          }}
          title={ar ? 'معاينة وتكبير' : 'Quick preview'}
        >
          <Eye className="w-3.5 h-3.5 text-emerald-600" />
          <span>{ar ? 'معاينة' : 'Quick View'}</span>
        </button>

        {/* Wishlist Button */}
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

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400"
        />
      </div>

      {/* Product Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1.5" style={{ color: 'var(--sf-muted)' }}>
            <span className="font-mono opacity-80">{product.sku}</span>
            <span
              className="font-bold text-[10px] px-2 py-0.5 rounded-full"
              style={{
                color: 'var(--sf-accent)',
                background: 'color-mix(in srgb, var(--sf-accent) 12%, transparent)',
              }}
            >
              {product.category}
            </span>
          </div>
          <h4
            onClick={onQuickView}
            className="font-extrabold text-sm line-clamp-2 leading-snug cursor-pointer hover:opacity-80 transition-opacity"
            style={{ color: 'var(--sf-text)' }}
          >
            {product.name}
          </h4>
        </div>

        {/* Rating & Stock */}
        <div className="pt-2 border-t space-y-2.5" style={{ borderColor: 'var(--sf-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-black text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>5.0</span>
              <span className="font-normal text-[10px]" style={{ color: 'var(--sf-muted)' }}>
                (128 {ar ? 'تقييم' : 'reviews'})
              </span>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{
                color: '#059669',
                background: 'rgba(5, 150, 105, 0.12)',
              }}
            >
              {ar ? 'متوفر فوري' : 'In Stock'}
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] block" style={{ color: 'var(--sf-muted)' }}>
                {ar ? 'شامل الضريبة 15%' : 'Incl. VAT'}
              </span>
              <span
                className="text-lg font-black tracking-tight"
                style={{ color: 'var(--sf-text)' }}
              >
                {money(product.price)}
              </span>
            </div>
          </div>

          {/* Modern Dual Actions: Primary Order on WhatsApp + Add to Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2 pt-1">
            {/* Primary Order on WhatsApp Button */}
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

            {/* Secondary Add to Cart Button */}
            <button
              type="button"
              onClick={onAddToCart}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              style={{
                background: inCartQty > 0 ? 'var(--sf-accent)' : 'var(--sf-bg, #f1f5f9)',
                color: inCartQty > 0 ? '#ffffff' : 'var(--sf-text)',
                border: '1px solid var(--sf-border)',
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
};
