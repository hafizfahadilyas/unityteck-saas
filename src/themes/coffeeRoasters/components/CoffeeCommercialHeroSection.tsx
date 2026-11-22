import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headphones,
  Layers,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Wrench,
  Zap,
  MessageCircle,
} from 'lucide-react';
import { bi, type CommercialHeroSettings, type CommercialHeroSlide } from '../../settings/coffeeModularSettings';
import { useCart } from '../context/CartContext';
import {
  commercialHeroShowsOnDevice,
  commercialHeroWidthClass,
  visibleCommercialHeroFeatures,
  visibleCommercialHeroSlides,
  type CommercialHeroPreviewDevice,
} from './coffeeCommercialHeroLogic';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Star,
  Truck,
  CreditCard,
  Palette,
  MessageCircle,
  Wrench,
  Headphones,
  Layers,
  Zap,
  ShoppingBag,
};

function SlideBody({
  slide,
  settings,
  lang,
  onBuyNow,
  onAddToCart,
}: {
  slide: CommercialHeroSlide;
  settings: CommercialHeroSettings;
  lang: 'ar' | 'en';
  onBuyNow?: (slide: CommercialHeroSlide) => void;
  onAddToCart?: (slide: CommercialHeroSlide) => void;
}) {
  const { navigateTo, addToCart, triggerFlyToCart, products } = useCart();
  const isAr = lang === 'ar';
  const title = bi(lang, slide.titleEn, slide.titleAr);
  const subtitle = bi(lang, slide.subtitleEn, slide.subtitleAr);
  const badge = bi(lang, slide.badgeEn, slide.badgeAr);
  const buyLabel = bi(lang, slide.buyNowEn, slide.buyNowAr) || (isAr ? 'شراء الآن' : 'Buy Now');
  const cartLabel = bi(lang, slide.addToCartEn, slide.addToCartAr) || (isAr ? 'أضف إلى السلة' : 'Add to Cart');
  const features = settings.showFeatures !== false ? visibleCommercialHeroFeatures(slide) : [];
  const product =
    slide.productId && products?.length
      ? products.find((p) => p.id === slide.productId)
      : undefined;
  const align = settings.contentAlign || 'image-right';
  const imageFirst = align === 'image-left';
  const centered = align === 'centered';
  const gap = settings.contentGapPx ?? 24;
  const featGap = settings.featuresGapPx ?? 12;

  const onBuy = () => {
    if (onBuyNow) {
      onBuyNow(slide);
      return;
    }
    if (slide.productId) navigateTo('product-buy', slide.productId);
  };

  const onAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onAddToCart) {
      onAddToCart(slide);
      return;
    }
    if (!product) {
      if (slide.productId) navigateTo('product-detail', slide.productId);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    triggerFlyToCart(rect, slide.image || product.images?.[0] || product.colors?.[0]?.image || '');
    addToCart(product, undefined, undefined, undefined, undefined, false);
  };

  const textCol = (
    <div className={`min-w-0 flex flex-col gap-3 ${centered ? 'items-center text-center' : 'items-start text-start'}`}>
      {settings.showBadge !== false && badge ? (
        <span className="text-[11px] font-bold tracking-wide uppercase text-[#8C531B]">{badge}</span>
      ) : null}
      {title ? <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#2B1809] leading-tight">{title}</h2> : null}
      {settings.showSubtitle !== false && subtitle ? (
        <p className="text-sm text-[#5C422E] max-w-xl">{subtitle}</p>
      ) : null}
      {settings.showPrice !== false && slide.price != null && Number.isFinite(slide.price) ? (
        <div className="text-lg font-bold text-[#2B1809]">
          {isAr ? `${slide.price.toLocaleString()} ⃁` : `⃁ ${slide.price.toLocaleString()}`}
        </div>
      ) : null}
      {settings.showButtons !== false ? (
        <div className={`flex flex-wrap gap-2.5 ${centered ? 'justify-center' : ''}`}>
          {slide.buyNowEnabled !== false ? (
            <button
              type="button"
              onClick={onBuy}
              disabled={!slide.productId}
              className="px-5 py-2.5 rounded-full bg-black text-white text-xs sm:text-sm font-medium disabled:opacity-40"
            >
              {settings.showIcons !== false ? (
                <span className="inline-flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {buyLabel}
                </span>
              ) : (
                buyLabel
              )}
            </button>
          ) : null}
          {slide.addToCartEnabled !== false ? (
            <button
              type="button"
              onClick={onAdd}
              className="px-5 py-2.5 rounded-full border border-black text-black text-xs sm:text-sm font-medium inline-flex items-center gap-1.5"
            >
              {settings.showIcons !== false ? <ShoppingBag className="w-3.5 h-3.5" /> : null}
              {cartLabel}
            </button>
          ) : null}
        </div>
      ) : null}
      {features.length > 0 ? (
        <div
          className={`grid w-full ${centered ? 'justify-items-center' : ''}`}
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: featGap,
            marginTop: 8,
          }}
        >
          {features.map((f) => {
            const Icon = ICON_MAP[f.icon] || Star;
            const label = bi(lang, f.labelEn, f.labelAr);
            const value = bi(lang, f.valueEn, f.valueAr);
            return (
              <div key={f.id} className="flex items-start gap-2 rounded-xl bg-[#F8F3EC] px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <Icon className="w-4 h-4 text-[#8C531B]" />
                </div>
                <div className="min-w-0">
                  {label ? <div className="text-[11px] font-bold text-[#2B1809]">{label}</div> : null}
                  {value ? <div className="text-[11px] text-[#5C422E]">{value}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  const imageCol = slide.image ? (
    <div className="w-full min-w-0">
      <img
        src={slide.image}
        alt={title || ''}
        className="w-full h-auto max-h-[420px] object-contain rounded-2xl"
      />
    </div>
  ) : (
    <div className="w-full min-h-[200px] rounded-2xl bg-[#F1E5D6] flex items-center justify-center text-xs text-[#7A593D]">
      {isAr ? 'بانتظار الصورة' : 'Waiting for image'}
    </div>
  );

  if (centered) {
    return (
      <div className="flex flex-col items-center gap-6" style={{ gap }}>
        {imageCol}
        {textCol}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 items-center"
      style={{ gap }}
    >
      <div className={imageFirst ? 'lg:order-1' : 'lg:order-2'}>{imageCol}</div>
      <div className={imageFirst ? 'lg:order-2' : 'lg:order-1'}>{textCol}</div>
    </div>
  );
}

export const CoffeeCommercialHeroSection: React.FC<{
  settings: CommercialHeroSettings | null | undefined;
  lang?: 'ar' | 'en';
  device?: CommercialHeroPreviewDevice;
  onBuyNow?: (slide: CommercialHeroSlide) => void;
  onAddToCart?: (slide: CommercialHeroSlide) => void;
}> = ({ settings, lang = 'en', device = 'desktop', onBuyNow, onAddToCart }) => {
  const slides = visibleCommercialHeroSlides(settings);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (!settings?.autoplay || slides.length < 2) return undefined;
    const sec = Math.max(2, Number(settings.transitionSec) || 5);
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, sec * 1000);
    return () => window.clearInterval(id);
  }, [settings?.autoplay, settings?.transitionSec, slides.length]);

  if (!commercialHeroShowsOnDevice(settings, device)) return null;
  if (!slides.length || !settings) return null;

  const safeIndex = Math.min(index, slides.length - 1);
  const slide = slides[safeIndex];
  const widthCls = commercialHeroWidthClass(settings.contentWidth);
  const pad = settings.sectionPaddingY ?? 48;

  return (
    <section
      data-customize-section="C-COMM"
      className="w-full"
      style={{
        paddingTop: pad,
        paddingBottom: pad,
      }}
    >
      <div className={`mx-auto px-4 lg:px-8 ${widthCls}`}>
        <div className="relative">
          <SlideBody slide={slide} settings={settings} lang={lang} onBuyNow={onBuyNow} onAddToCart={onAddToCart} />
          {slides.length > 1 && settings.showArrows !== false ? (
            <>
              <button
                type="button"
                aria-label={lang === 'ar' ? 'السابق' : 'Previous'}
                className="absolute start-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border shadow flex items-center justify-center"
                onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
              >
                {lang === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                type="button"
                aria-label={lang === 'ar' ? 'التالي' : 'Next'}
                className="absolute end-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border shadow flex items-center justify-center"
                onClick={() => setIndex((i) => (i + 1) % slides.length)}
              >
                {lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </>
          ) : null}
        </div>
        {slides.length > 1 && settings.showDots !== false ? (
          <div className="flex justify-center gap-1.5 mt-4">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={lang === 'ar' ? `شريحة ${i + 1}` : `Slide ${i + 1}`}
                className="w-2 h-2 rounded-full"
                style={{ background: i === safeIndex ? '#2B1809' : '#C9B6A1' }}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
