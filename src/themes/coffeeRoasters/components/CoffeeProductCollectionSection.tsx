import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headphones,
  Layers,
  MessageCircle,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import { bi, type ProductCollectionSettings } from '../../settings/coffeeModularSettings';
import {
  itemDisplayImage,
  itemDisplayName,
  itemDisplayOriginal,
  itemDisplayPrice,
} from './coffeeProductSliderLogic';
import {
  collectionItemsPerView,
  collectionShowsBenefits,
  collectionShowsPromo,
  collectionUsesSlider,
  productCollectionShowsOnDevice,
  promoHasContent,
  resolveProductCollectionCards,
  visibleProductCollectionBenefits,
  type CollectionCatalogProduct,
  type ProductCollectionDevice,
} from './coffeeProductCollectionLogic';

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

export const CoffeeProductCollectionSection: React.FC<{
  settings: ProductCollectionSettings | null | undefined;
  catalog?: CollectionCatalogProduct[] | null;
  lang?: 'ar' | 'en';
  device?: ProductCollectionDevice;
  onBuyNow?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onOpenProduct?: (productId: string) => void;
  onPromoClick?: (url: string) => void;
}> = ({
  settings,
  catalog = [],
  lang = 'en',
  device = 'desktop',
  onBuyNow,
  onAddToCart,
  onOpenProduct,
  onPromoClick,
}) => {
  const isAr = lang === 'ar';
  const cards = useMemo(
    () => resolveProductCollectionCards(settings, catalog || []),
    [settings, catalog],
  );
  const benefits = useMemo(() => visibleProductCollectionBenefits(settings), [settings]);
  const perView = collectionItemsPerView(settings, device);
  const useSlider = collectionUsesSlider(settings?.sectionStyle);
  const showPromo =
    collectionShowsPromo(settings?.sectionStyle) &&
    settings?.showPromoCard !== false &&
    promoHasContent(settings);
  const showBenefits =
    collectionShowsBenefits(settings?.sectionStyle) &&
    settings?.showBenefitBoxes !== false &&
    benefits.length > 0;

  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(cards.length / perView));

  useEffect(() => {
    setPage(0);
  }, [cards.map((c) => c.item.id).join('|'), perView]);

  useEffect(() => {
    if (!useSlider || !settings?.autoplay || cards.length <= perView) return;
    const ms = Math.max(2, settings.transitionSec || 5) * 1000;
    const t = window.setInterval(() => setPage((p) => (p + 1) % pages), ms);
    return () => window.clearInterval(t);
  }, [useSlider, settings?.autoplay, settings?.transitionSec, cards.length, perView, pages]);

  useEffect(() => {
    if (!useSlider) return;
    const el = trackRef.current;
    if (!el) return;
    const cardW = el.clientWidth / perView;
    el.scrollTo({
      left: isAr ? -page * cardW * perView : page * cardW * perView,
      behavior: 'smooth',
    });
  }, [page, perView, isAr, useSlider]);

  if (!productCollectionShowsOnDevice(settings, device)) return null;
  if (!cards.length) return null;

  const padY = settings?.sectionPaddingY ?? 48;
  const gap = settings?.cardGapPx ?? 16;
  const promoGap = settings?.promoGapPx ?? 24;
  const benefitsGap = settings?.benefitsGapPx ?? 12;
  const promoLayout = settings?.promoLayout || 'vertical-left';
  const promo = settings?.promo;

  const go = (dir: -1 | 1) => setPage((p) => (p + dir + pages) % pages);

  const promoCard = showPromo && promo ? (
    <aside
      className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#2B1809] to-[#5C422E] text-white p-5 sm:p-6 flex flex-col justify-between min-h-[220px]"
      data-product-collection-promo
    >
      {promo.image ? (
        <img src={promo.image} alt="" className="w-full h-36 object-cover rounded-xl mb-4" />
      ) : null}
      <div className="space-y-2">
        {(promo.badgeEn || promo.badgeAr) ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200">
            {bi(lang, promo.badgeEn, promo.badgeAr)}
          </span>
        ) : null}
        {(promo.titleEn || promo.titleAr) ? (
          <h3 className="text-xl sm:text-2xl font-black leading-tight">
            {bi(lang, promo.titleEn, promo.titleAr)}
          </h3>
        ) : null}
      </div>
      {(promo.buttonEn || promo.buttonAr) ? (
        <button
          type="button"
          className="mt-4 self-start px-4 py-2 rounded-full bg-white text-[#2B1809] text-xs font-bold"
          onClick={() => {
            const url = (promo.buttonUrl || '').trim();
            if (url) onPromoClick?.(url);
          }}
        >
          {bi(lang, promo.buttonEn, promo.buttonAr)}
        </button>
      ) : null}
    </aside>
  ) : null;

  const productCards = cards.map(({ item, catalog: cat }) => {
    const name = itemDisplayName(item, lang, cat);
    const img = itemDisplayImage(item, cat);
    const price = itemDisplayPrice(item, cat);
    const original = itemDisplayOriginal(item, cat);
    const pid = item.productId || item.id;
    return (
      <article
        key={item.id}
        className="rounded-2xl border border-neutral-200 bg-white overflow-hidden flex flex-col"
        style={{ padding: 0 }}
      >
        <button
          type="button"
          className="aspect-square bg-transparent overflow-hidden"
          onClick={() => onOpenProduct?.(pid)}
        >
          {img ? (
            <img src={img} alt={name} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[11px] text-neutral-400">
              {isAr ? 'بانتظار الصورة' : 'Waiting for image'}
            </div>
          )}
        </button>
        <div className="p-3 space-y-2 flex-1 flex flex-col">
          <h4 className="text-sm font-bold text-neutral-900 line-clamp-2">{name || (isAr ? 'بدون اسم' : 'Untitled')}</h4>
          {settings?.showPrice !== false && price != null ? (
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-extrabold text-neutral-900">
                {isAr ? `${price.toLocaleString()} ر.س` : `SAR ${price.toLocaleString()}`}
              </span>
              {original != null && original > price ? (
                <span className="text-[11px] text-neutral-400 line-through">
                  {isAr ? `${original.toLocaleString()} ر.س` : `SAR ${original.toLocaleString()}`}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {settings?.showBuyNow !== false && item.showBuyNow !== false ? (
              <button
                type="button"
                className="px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-bold"
                onClick={() => onBuyNow?.(pid)}
              >
                {isAr ? 'شراء' : 'Buy'}
              </button>
            ) : null}
            {settings?.showAddToCart !== false && item.showAddToCart !== false ? (
              <button
                type="button"
                className="px-3 py-1.5 rounded-full border border-black text-[11px] font-bold inline-flex items-center gap-1"
                onClick={() => onAddToCart?.(pid)}
              >
                <ShoppingBag className="w-3 h-3" />
                {isAr ? 'السلة' : 'Cart'}
              </button>
            ) : null}
            {settings?.showLearnMore !== false ? (
              <button
                type="button"
                className="px-2 py-1.5 text-[11px] font-semibold text-neutral-700"
                onClick={() => onOpenProduct?.(pid)}
              >
                {isAr ? 'المزيد' : 'Learn more'}
              </button>
            ) : null}
          </div>
        </div>
      </article>
    );
  });

  const productsBlock = useSlider ? (
    <div className="relative min-w-0 flex-1" data-product-collection-products="slider">
      {cards.length > perView && settings?.showArrows !== false ? (
        <div className="absolute -top-10 end-0 flex gap-1.5 z-10">
          <button type="button" className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center" onClick={() => go(-1)} aria-label={isAr ? 'السابق' : 'Previous'}>
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button type="button" className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center" onClick={() => go(1)} aria-label={isAr ? 'التالي' : 'Next'}>
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      ) : null}
      <div
        ref={trackRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ gap }}
      >
        {productCards.map((node) => (
          <div key={(node as React.ReactElement).key} className="snap-start shrink-0" style={{ width: `calc((100% - ${(perView - 1) * gap}px) / ${perView})` }}>
            {node}
          </div>
        ))}
      </div>
      {cards.length > perView && settings?.showDots !== false ? (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              className="w-2 h-2 rounded-full"
              style={{ background: i === page ? '#2B1809' : '#C9B6A1' }}
              onClick={() => setPage(i)}
              aria-label={isAr ? `صفحة ${i + 1}` : `Page ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  ) : (
    <div
      className="grid flex-1 min-w-0"
      style={{ gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))`, gap }}
      data-product-collection-products="grid"
    >
      {productCards}
    </div>
  );

  const promoVertical = promoLayout === 'vertical-left' || promoLayout === 'vertical-right';
  const promoFirst =
    promoLayout === 'vertical-left' ||
    promoLayout === 'horizontal-top';

  /** Never reserve a blank promo column — empty col-span caused huge white left gap on live/builder. */
  const hasPromoColumn = Boolean(showPromo && promoCard);
  const mainRow = (
    <div
      className={promoVertical && hasPromoColumn ? 'grid grid-cols-1 lg:grid-cols-12 items-stretch' : 'flex flex-col'}
      style={{ gap: promoGap }}
    >
      {hasPromoColumn && promoFirst ? (
        <div className={promoVertical ? 'lg:col-span-4 min-w-0' : ''}>{promoCard}</div>
      ) : null}
      <div className={promoVertical && hasPromoColumn ? 'lg:col-span-8 min-w-0' : 'min-w-0 w-full'}>{productsBlock}</div>
      {hasPromoColumn && !promoFirst ? (
        <div className={promoVertical ? 'lg:col-span-4 min-w-0' : ''}>{promoCard}</div>
      ) : null}
    </div>
  );

  return (
    <section
      data-customize-section="C-COLL"
      className="w-full max-w-[1360px] mx-auto px-4 lg:px-8"
      style={{ paddingTop: padY, paddingBottom: padY }}
    >
      <div className="mb-5 space-y-1">
        {settings?.showTitle !== false && (settings?.titleEn || settings?.titleAr) ? (
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            {bi(lang, settings.titleEn, settings.titleAr)}
          </h2>
        ) : null}
        {settings?.showDescription !== false && (settings?.descriptionEn || settings?.descriptionAr) ? (
          <p className="text-sm text-neutral-500">{bi(lang, settings.descriptionEn, settings.descriptionAr)}</p>
        ) : null}
      </div>

      {mainRow}

      {showBenefits ? (
        <div
          className={
            settings?.benefitsLayout === 'stack'
              ? 'flex flex-col mt-6'
              : settings?.benefitsLayout === 'scroll'
                ? 'flex overflow-x-auto mt-6 scrollbar-hide'
                : settings?.benefitsLayout === 'grid2'
                  ? 'grid grid-cols-1 sm:grid-cols-2 mt-6'
                  : 'grid grid-cols-2 lg:grid-cols-4 mt-6'
          }
          style={{ gap: benefitsGap }}
          data-product-collection-benefits
        >
          {benefits.map((b) => {
            const Icon = ICON_MAP[b.icon] || Star;
            return (
              <div
                key={b.id}
                className={`rounded-xl bg-[#F8F3EC] px-3 py-3 flex gap-2 items-start ${settings?.benefitsLayout === 'scroll' ? 'min-w-[200px]' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <Icon className="w-4 h-4 text-[#8C531B]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#2B1809]">{bi(lang, b.titleEn, b.titleAr)}</div>
                  {(b.descriptionEn || b.descriptionAr) ? (
                    <div className="text-[11px] text-[#5C422E] mt-0.5">{bi(lang, b.descriptionEn, b.descriptionAr)}</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};
