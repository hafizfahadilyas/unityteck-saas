import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { bi } from '../../settings/coffeeModularSettings';
import type { AllThemeSettings } from '../../settings/themeSettingsStore';
import {
  itemDisplayImage,
  itemDisplayName,
  resolveCarouselCards,
} from './coffeeProductCarouselLogic';
import { benefitCardFaded, visibleBenefitItems } from './coffeeBenefitsLogic';
import {
  normalizeProductSource,
  resolveProductsBySource,
} from './coffeeProductSourceLogic';
import { coffeeHeroWallpaperUrl, isCoffeeProductCutoutUrl } from '../utils/coffeeHeroWallpaper';

function productImage(p: { image?: string; images?: string[]; colors?: { image?: string }[] }): string {
  return p.image || p.colors?.[0]?.image || p.images?.[0] || '';
}

function bannerProductHint(blob: string): string {
  const s = String(blob || '').toLowerCase();
  if (/oak|بلوط|fluted/.test(s)) return 'hb-almari-fluted-oak';
  if (/marble|رخام|white/.test(s)) return 'hb-almari-white-marble';
  if (/villa|فلل|dual/.test(s)) return 'hb-almari-dual-door-villa';
  if (/najdi|نجدي/.test(s)) return 'hb-almari-najdi-heritage';
  if (/makkah|مكة|corner|ركن/.test(s)) return 'hb-almari-makkah-corner';
  return '';
}

/** Prefer scenic wallpaper for C-IMG tiles — square cutouts leave empty cover gaps. */
function bannerCoverImage(raw: string, titleBlob = ''): string {
  const url = String(raw || '').trim();
  if (!url) return '';
  const productId = bannerProductHint(titleBlob);
  if (isCoffeeProductCutoutUrl(url) || /ksa_almari_/i.test(url)) {
    return coffeeHeroWallpaperUrl({ url, productId, mobile: false }) || url;
  }
  if (/\.(jpe?g)(\?.*)?$/i.test(url) && /coffee_wallpaper_/i.test(url)) {
    return url.replace(/\.(jpe?g)(\?.*)?$/i, '.webp$2');
  }
  // Already a wallpaper / scenic hero — prefer webp twin when path matches.
  if (/coffee_(wallpaper|hero_almari)/i.test(url)) {
    return coffeeHeroWallpaperUrl({ url, productId, mobile: false }) || url;
  }
  return url;
}

export type CoffeeHomeModuleKey =
  | 'imageBanners'
  | 'exclusiveBenefits'
  | 'productCarousel'
  | 'productCarouselBanner';

export const CoffeeHomeModules: React.FC<{
  settings: AllThemeSettings | null;
  /** When set (page builder), render only that module — avoid duplicating the whole homepage. */
  only?: CoffeeHomeModuleKey;
}> = ({ settings, only }) => {
  const { language, navigateTo, products } = useCart();
  const lang = language === 'AR' ? 'ar' : 'en';
  if (!settings) return null;
  // On full homepage, ExclusivePerksBar owns C-BEN pixel UI — skip duplicate here unless `only` is set.
  const show = (key: CoffeeHomeModuleKey) => {
    if (only) return only === key;
    if (key === 'exclusiveBenefits') return false;
    return true;
  };

  const images = settings.imageBanners;
  const imageItems = images?.enabled ? (images.items || []).filter((it) => it.enabled !== false && it.image) : [];

  const benefits = settings.exclusiveBenefits;
  const benefitItems = visibleBenefitItems(benefits);

  const carousel = settings.productCarousel;
  const carouselResolved = resolveCarouselCards(
    carousel,
    (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      category: p.category,
      stock: p.stock,
      price: p.basePrice,
      basePrice: p.basePrice,
      originalPrice: p.originalPrice,
      discountedPrice: p.discountedPrice,
      image: productImage(p),
      images: p.images,
      colors: p.colors,
    })),
  );
  const carouselCards = carouselResolved.cards;

  const combo = settings.productCarouselBanner;
  const comboCatalog = (products || []).map((p) => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    category: p.category,
    brand: (p as { brand?: string }).brand,
    stock: p.stock,
    price: p.basePrice,
    basePrice: p.basePrice,
    originalPrice: p.originalPrice,
    discountedPrice: p.discountedPrice,
    image: productImage(p),
    images: p.images,
    colors: p.colors,
  }));
  const comboProducts = combo?.enabled
    ? resolveProductsBySource(
        normalizeProductSource({
          productSource: combo.productSource,
          categoryId: combo.categoryId,
          productCount: combo.productCount || 8,
        }),
        comboCatalog,
      )
    : [];

  const emptyHint = (ar: string, en: string) =>
    only ? (
      <div className="p-8 text-center text-sm text-neutral-400 border border-dashed border-neutral-200 rounded-2xl m-4">
        {language === 'AR' ? ar : en}
      </div>
    ) : null;

  return (
    <>
      {show('imageBanners') && imageItems.length === 0 && emptyHint('لافتات الصور فارغة — اضبطها من تخصيص الثيم', 'Image banners empty — configure in Customize Themes')}
      {show('imageBanners') && imageItems.length > 0 && (
        <section data-customize-section="C-IMG" className="w-full max-w-[1360px] mx-auto px-4 lg:px-8 py-8 sm:py-10">
          <div
            className={
              images.layout === 'stack'
                ? 'flex flex-col gap-3 sm:gap-4'
                : images.layout === 'row'
                  ? 'flex overflow-x-auto gap-3 sm:gap-4 snap-x snap-mandatory no-scrollbar'
                  : `grid gap-3 sm:gap-4 ${images.columnsMobile === 2 ? 'grid-cols-2' : 'grid-cols-1'} ${
                      (images.columnsDesktop || 3) >= 4
                        ? 'sm:grid-cols-2 lg:grid-cols-4'
                        : (images.columnsDesktop || 3) === 2
                          ? 'sm:grid-cols-2'
                          : (images.columnsDesktop || 3) === 1
                            ? 'sm:grid-cols-1'
                            : 'sm:grid-cols-2 lg:grid-cols-3'
                    }`
            }
          >
            {imageItems.map((it) => {
              const overlay = it.overlay || 'gradient';
              const title = bi(lang, it.titleEn, it.titleAr);
              const subtitle = bi(lang, it.subtitleEn, it.subtitleAr);
              const cta = bi(lang, it.buttonEn, it.buttonAr);
              const alt = bi(lang, it.altEn || it.titleEn, it.altAr || it.titleAr) || title;
              const coverSrc = bannerCoverImage(
                it.image,
                `${it.id} ${it.titleEn || ''} ${it.titleAr || ''}`,
              );
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => navigateTo(it.link === 'custom-order' ? 'custom-order' : 'products')}
                  className={`group relative isolate overflow-hidden rounded-[1.35rem] sm:rounded-[1.75rem] text-start text-white shadow-[0_18px_40px_-28px_rgba(0,0,0,0.55)] ring-1 ring-black/5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_50px_-28px_rgba(0,0,0,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                    images.layout === 'row'
                      ? 'min-w-[min(86vw,320px)] snap-start shrink-0 aspect-[4/5] sm:aspect-[3/4]'
                      : 'aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] min-h-[240px]'
                  }`}
                >
                  <img
                    src={coverSrc}
                    alt={alt}
                    width={800}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="absolute inset-0 z-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  {overlay === 'none' ? null : overlay === 'dark' ? (
                    <div className="absolute inset-0 z-[1] bg-black/55" aria-hidden />
                  ) : (
                    <>
                      <div
                        className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/35 to-black/5"
                        aria-hidden
                      />
                      <div
                        className="absolute inset-x-0 bottom-0 z-[1] h-2/5 bg-gradient-to-t from-black/70 to-transparent"
                        aria-hidden
                      />
                    </>
                  )}
                  <div className="relative z-10 flex h-full flex-col justify-end gap-1.5 p-5 sm:p-6">
                    {title ? (
                      <h3
                        className={`text-lg sm:text-xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] ${
                          lang === 'ar' ? 'leading-[1.35]' : 'leading-tight'
                        }`}
                      >
                        {title}
                      </h3>
                    ) : null}
                    {subtitle ? (
                      <p className="text-[12px] sm:text-[13px] font-medium text-white/90 line-clamp-2 max-w-[28ch]">
                        {subtitle}
                      </p>
                    ) : null}
                    {cta ? (
                      <span className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-neutral-900 shadow-sm backdrop-blur-sm transition-colors group-hover:bg-white">
                        {cta}
                        <ArrowUpRight
                          className={`w-3.5 h-3.5 shrink-0 opacity-80 ${lang === 'ar' ? '-scale-x-100' : ''}`}
                          aria-hidden
                        />
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {show('exclusiveBenefits') && benefitItems.length === 0 && emptyHint('المزايا الحصرية فارغة — اضبطها من تخصيص الثيم', 'Exclusive benefits empty — configure in Customize Themes')}
      {show('exclusiveBenefits') && benefitItems.length > 0 && (
        <section className="w-full max-w-[1360px] mx-auto px-4 lg:px-8 py-6">
          {(benefits.titleEn || benefits.titleAr) && (
            <h2 className="text-2xl font-bold text-center mb-2">{bi(lang, benefits.titleEn, benefits.titleAr)}</h2>
          )}
          {(benefits.subtitleEn || benefits.subtitleAr) && (
            <p className="text-sm text-neutral-500 text-center mb-6">{bi(lang, benefits.subtitleEn, benefits.subtitleAr)}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefitItems.map((it) => {
              const faded = benefitCardFaded(it);
              return (
                <div
                  key={it.id}
                  className="rounded-2xl bg-[#F8F9FA] p-4 text-start"
                  style={{ opacity: faded ? 0.45 : 1, filter: faded ? 'grayscale(0.65)' : undefined }}
                >
                  <h3 className="font-bold text-sm">{bi(lang, it.titleEn, it.titleAr)}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{bi(lang, it.descriptionEn, it.descriptionAr)}</p>
                  {faded ? (
                    <p className="text-[10px] font-bold text-neutral-400 mt-1">
                      {language === 'AR' ? 'غير متاح حالياً' : 'Currently unavailable'}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {show('productCarousel') && !(carousel?.enabled && carouselCards.length > 0) && emptyHint('كاروسيل المنتجات فارغ — اضبطه من تخصيص الثيم', 'Product carousel empty — configure in Customize Themes')}
      {show('productCarousel') && carousel?.enabled && carouselCards.length > 0 && (
        <section data-customize-section="C-PC" className="w-full max-w-[1360px] mx-auto px-4 lg:px-8 py-8">
          {(carousel.titleEn || carousel.titleAr) ? (
            <h2 className="text-2xl font-bold text-center">{bi(lang, carousel.titleEn, carousel.titleAr)}</h2>
          ) : null}
          {(carousel.subtitleEn || carousel.subtitleAr) && (
            <p className="text-sm text-neutral-500 text-center mt-1 mb-5">{bi(lang, carousel.subtitleEn, carousel.subtitleAr)}</p>
          )}
          <div
            className={`flex overflow-x-auto overscroll-x-contain touch-pan-x py-2 ${carousel.enableTouchSwipe === false ? '' : 'no-scrollbar'}`}
            style={{
              gap: carousel.itemSpacing ?? 16,
              WebkitOverflowScrolling: 'touch',
              touchAction: carousel.enableTouchSwipe === false ? undefined : 'pan-x pinch-zoom',
              scrollBehavior: 'auto',
            }}
          >
            {carouselCards.map(({ item, catalog }) => {
              const pid = item.productId || catalog?.id || '';
              const name = itemDisplayName(item, lang, catalog);
              const img = itemDisplayImage(item, catalog);
              const price =
                item.discountedPrice != null && item.discountedPrice > 0
                  ? item.discountedPrice
                  : item.originalPrice != null
                    ? item.originalPrice
                    : catalog?.discountedPrice ?? catalog?.basePrice ?? catalog?.price ?? null;
              const radius = carousel.cardStyle === 'square' ? 0 : carousel.cardBorderRadius ?? 16;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => (pid ? navigateTo('product-detail', pid) : undefined)}
                  className="shrink-0 border text-center"
                  style={{
                    width: 224,
                    borderRadius: radius,
                    padding: carousel.cardPadding ?? 16,
                    background: carousel.cardBgColor || '#FFFFFF',
                    borderColor: '#f5f5f5',
                  }}
                >
                  {(item.promoTagEn || item.promoTagAr) ? (
                    <div className="text-[10px] font-bold mb-1 text-[#173B35]">{bi(lang, item.promoTagEn, item.promoTagAr)}</div>
                  ) : null}
                  {img ? <img src={img} alt="" className="h-32 w-full object-contain" /> : null}
                  <div className="font-bold text-sm mt-2">{name}</div>
                  {price != null ? (
                    <div className="text-xs mt-1">
                      <span dir="ltr" className="inline-block font-tabular-nums">
                        {Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                        {language === 'AR' ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* C-BAN + espresso “Build Your Coffee Corner” strip retired — cabinets grid only */}

      {show('productCarouselBanner') && combo?.enabled && comboProducts.length === 0 && only
        ? emptyHint('كاروسيل مع بانر فارغ — اضبطه من تخصيص الثيم', 'Carousel + banner empty — configure in Customize Themes')
        : null}
      {show('productCarouselBanner') && combo?.enabled && comboProducts.length > 0 ? (
        <section
          data-customize-section="C-PCB"
          className="w-full max-w-[1360px] mx-auto px-4 lg:px-8 py-8"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {comboProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigateTo('product-detail', p.id)}
                className="rounded-2xl bg-[#F8F9FA] p-3 text-center hover:bg-neutral-100 transition-colors"
              >
                {productImage(p) ? (
                  <img src={productImage(p)} alt="" className="h-24 w-full object-contain" />
                ) : null}
                <div className="text-xs font-bold mt-1">
                  {language === 'AR' ? (p.nameAr || '').trim() : (p.name || '').trim()}
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
};
