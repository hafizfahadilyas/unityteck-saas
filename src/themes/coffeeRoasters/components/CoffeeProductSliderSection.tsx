import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { bi, type ProductSliderSettings } from '../../settings/coffeeModularSettings';
import {
  itemDisplayImage,
  itemDisplayName,
  itemDisplayOriginal,
  itemDisplayPrice,
  itemsPerView,
  productSliderShowsOnDevice,
  resolveProductSliderCards,
  type ProductSliderDevice,
  type SliderCatalogProduct,
} from './coffeeProductSliderLogic';

export const CoffeeProductSliderSection: React.FC<{
  settings: ProductSliderSettings | null | undefined;
  catalog?: SliderCatalogProduct[] | null;
  lang?: 'ar' | 'en';
  device?: ProductSliderDevice;
  onBuyNow?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onOpenProduct?: (productId: string) => void;
}> = ({
  settings,
  catalog = [],
  lang = 'en',
  device = 'desktop',
  onBuyNow,
  onAddToCart,
  onOpenProduct,
}) => {
  const isAr = lang === 'ar';
  const cards = useMemo(() => resolveProductSliderCards(settings, catalog || []), [settings, catalog]);
  const perView = itemsPerView(settings, device);
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(cards.length / perView));

  useEffect(() => {
    setPage(0);
  }, [cards.map((c) => c.item.id).join('|'), perView]);

  useEffect(() => {
    if (!settings?.autoplay || cards.length <= perView) return;
    const ms = Math.max(2, settings.transitionSec || 5) * 1000;
    const t = window.setInterval(() => {
      setPage((p) => (p + 1) % pages);
    }, ms);
    return () => window.clearInterval(t);
  }, [settings?.autoplay, settings?.transitionSec, cards.length, perView, pages]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const cardW = el.clientWidth / perView;
    el.scrollTo({ left: isAr ? -page * cardW * perView : page * cardW * perView, behavior: 'smooth' });
  }, [page, perView, isAr]);

  if (!productSliderShowsOnDevice(settings, device)) return null;
  if (!cards.length) return null;

  const padY = settings?.sectionPaddingY ?? 48;
  const gap = settings?.cardGapPx ?? 16;
  const cardPad = settings?.cardPaddingPx ?? 16;

  const go = (dir: -1 | 1) => setPage((p) => (p + dir + pages) % pages);

  return (
    <section
      data-customize-section="C-PSL"
      className="w-full max-w-[1360px] mx-auto px-4 lg:px-8"
      style={{ paddingTop: padY, paddingBottom: padY }}
    >
      <div className="flex items-end justify-between gap-3 mb-5">
        <div className="min-w-0 space-y-1">
          {settings?.showTitle !== false && (settings?.titleEn || settings?.titleAr) ? (
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              {bi(lang, settings.titleEn, settings.titleAr)}
            </h2>
          ) : null}
          {settings?.showDescription !== false && (settings?.descriptionEn || settings?.descriptionAr) ? (
            <p className="text-sm text-neutral-500">{bi(lang, settings.descriptionEn, settings.descriptionAr)}</p>
          ) : null}
        </div>
        {cards.length > perView && settings?.showArrows !== false ? (
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-900 hover:text-white flex items-center justify-center"
              onClick={() => go(-1)}
              aria-label={isAr ? 'السابق' : 'Previous'}
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-900 hover:text-white flex items-center justify-center"
              onClick={() => go(1)}
              aria-label={isAr ? 'التالي' : 'Next'}
            >
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={trackRef}
        className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar"
        style={{ gap }}
      >
        {cards.map(({ item, catalog: hit }) => {
          const name = itemDisplayName(item, lang, hit);
          const image = itemDisplayImage(item, hit);
          const price = itemDisplayPrice(item, hit);
          const original = itemDisplayOriginal(item, hit);
          const desc = bi(lang, item.descriptionEn || hit?.tagline || hit?.overview, item.descriptionAr || hit?.taglineAr || hit?.overviewAr);
          const pid = item.productId || hit?.id || '';
          const buyOk = settings?.showBuyNow !== false && item.showBuyNow !== false;
          const cartOk = settings?.showAddToCart !== false && item.showAddToCart !== false;
          return (
            <article
              key={item.id}
              className="snap-start shrink-0 rounded-2xl border border-neutral-100 bg-[#F8F9FA] flex flex-col"
              style={{
                width: `calc((100% - ${(perView - 1) * gap}px) / ${perView})`,
                minWidth: `calc((100% - ${(perView - 1) * gap}px) / ${perView})`,
                padding: cardPad,
              }}
            >
              <button
                type="button"
                className="aspect-[4/3] rounded-xl overflow-hidden bg-white border border-neutral-100 mb-3"
                onClick={() => pid && onOpenProduct?.(pid)}
              >
                {image ? (
                  <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[11px] text-neutral-400">
                    {isAr ? 'لا صورة' : 'No image'}
                  </div>
                )}
              </button>
              <div className="font-bold text-sm text-neutral-900 line-clamp-2 min-h-[2.5rem]">{name || (isAr ? 'منتج' : 'Product')}</div>
              {settings?.showProductDescription && desc ? (
                <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">{desc}</p>
              ) : null}
              {settings?.showPrice !== false && price != null ? (
                <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                  <span className="text-base font-black text-neutral-900">
                    {price.toLocaleString(isAr ? 'ar-SA' : 'en-SA')} {isAr ? 'ر.س' : 'SAR'}
                  </span>
                  {settings?.showOriginalPrice !== false && original != null && original > price ? (
                    <span className="text-xs text-neutral-400 line-through">
                      {original.toLocaleString(isAr ? 'ar-SA' : 'en-SA')}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-auto pt-3 flex flex-wrap gap-2">
                {buyOk ? (
                  <button
                    type="button"
                    className="unity-btn-primary flex-1 min-w-[88px] px-3 py-2 rounded-xl text-[11px] font-bold"
                    onClick={() => pid && onBuyNow?.(pid)}
                  >
                    {isAr ? 'اشترِ الآن' : 'Buy Now'}
                  </button>
                ) : null}
                {cartOk ? (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1 flex-1 min-w-[88px] px-3 py-2 rounded-xl text-[11px] font-bold border border-neutral-300 bg-white"
                    onClick={() => pid && onAddToCart?.(pid)}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {isAr ? 'أضف إلى السلة' : 'Add to Cart'}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {pages > 1 && settings?.showDots !== false ? (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`h-1.5 rounded-full transition-all ${i === page ? 'w-6 bg-neutral-900' : 'w-2 bg-neutral-300'}`}
              onClick={() => setPage(i)}
              aria-label={`${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};
