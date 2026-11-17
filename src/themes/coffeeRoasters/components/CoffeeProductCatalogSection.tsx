/** Product Catalog preview/section — same chrome ProductsListPage binds via `shop`. */
import React, { useMemo } from 'react';
import { bi, shopGridClass, type ShopCatalogSettings } from '../../settings/coffeeModularSettings';
import {
  buildCatalogCategories,
  catalogColumns,
  catalogPerPage,
  catalogShowsOnDevice,
  filterCatalogProducts,
  shopCardFlags,
  sortCatalogProducts,
  type CatalogPreviewDevice,
  type CatalogProductLike,
} from './coffeeProductCatalogLogic';

export const CoffeeProductCatalogSection: React.FC<{
  settings: ShopCatalogSettings | null | undefined;
  catalog?: CatalogProductLike[] | null;
  lang?: 'ar' | 'en';
  device?: CatalogPreviewDevice;
  onOpenProduct?: (productId: string) => void;
}> = ({ settings, catalog = [], lang = 'en', device = 'desktop', onOpenProduct }) => {
  const isAr = lang === 'ar';
  const flags = shopCardFlags(settings);
  const cols = catalogColumns(settings, device);
  const perPage = catalogPerPage(settings);

  const rows = useMemo(() => {
    if (!catalogShowsOnDevice(settings, device)) return [];
    const filtered = filterCatalogProducts(catalog || [], {
      categoryId: settings?.defaultCategory || 'all',
    });
    return sortCatalogProducts(filtered, settings?.defaultSort).slice(0, perPage);
  }, [settings, catalog, device, perPage]);

  const categories = useMemo(() => buildCatalogCategories(catalog || []), [catalog]);

  if (!catalogShowsOnDevice(settings, device)) return null;

  const badge = bi(lang, settings?.badgeEn, settings?.badgeAr);
  const title = bi(lang, settings?.titleEn, settings?.titleAr);
  const desc = bi(lang, settings?.descriptionEn, settings?.descriptionAr);
  const pad = settings?.sectionPaddingY ?? 32;
  const gap = settings?.cardGapPx ?? 16;

  return (
    <section
      className="w-full max-w-[1360px] mx-auto px-4"
      style={{ paddingTop: pad, paddingBottom: pad }}
      data-customize-section="C-SHOP"
      data-product-catalog="section"
    >
      {(settings?.showBadge !== false && badge) || (settings?.showTitle !== false && title) || (settings?.showDescription !== false && desc) ? (
        <header className="mb-5 space-y-1 text-start">
          {settings?.showBadge !== false && badge ? (
            <div className="inline-flex text-[10px] font-bold uppercase tracking-wider text-amber-700">{badge}</div>
          ) : null}
          {settings?.showTitle !== false && title ? (
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">{title}</h2>
          ) : null}
          {settings?.showDescription !== false && desc ? (
            <p className="text-xs sm:text-sm text-neutral-500">{desc}</p>
          ) : null}
        </header>
      ) : null}

      {settings?.showCategories !== false && categories.length > 1 ? (
        <div className="flex flex-wrap gap-2 mb-4" data-product-catalog="categories">
          {categories.slice(0, 8).map((c) => (
            <span
              key={c.id}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold border bg-white text-neutral-700"
              style={{ borderColor: '#e5e5e5' }}
            >
              {isAr ? c.nameAr : c.nameEn}
              {settings?.showProductCount !== false ? (
                <span className="ms-1 text-neutral-400">{c.count}</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      {settings?.showFilters !== false ? (
        <div
          className="mb-4 rounded-2xl border bg-white px-3 py-2.5 flex flex-wrap items-center gap-3 text-[11px] text-neutral-600"
          style={{ borderColor: '#e5e5e5' }}
          data-product-catalog="filters"
        >
          {settings?.showSort !== false ? (
            <span>{isAr ? `الترتيب: ${settings?.defaultSort || 'featured'}` : `Sort: ${settings?.defaultSort || 'featured'}`}</span>
          ) : null}
          {settings?.showPriceFilter !== false ? (
            <span>{isAr ? 'فلتر السعر' : 'Price filter'}</span>
          ) : null}
          {settings?.showInStockFilter !== false ? (
            <span>{isAr ? 'المتوفر فقط' : 'In stock'}</span>
          ) : null}
          {settings?.showResultsCount !== false ? (
            <span className="ms-auto font-semibold text-neutral-800">
              {isAr ? `${rows.length} منتج` : `${rows.length} products`}
            </span>
          ) : null}
        </div>
      ) : null}

      {!rows.length ? (
        <div
          className="p-8 text-center text-sm text-neutral-400 border border-dashed border-neutral-200 rounded-2xl"
          data-product-catalog="empty"
        >
          {isAr ? 'لا منتجات — بانتظار البيانات' : 'No products — Waiting for Data'}
        </div>
      ) : (
        <div
          className={shopGridClass(settings)}
          style={{ gap, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          data-product-catalog="grid"
          data-cols={cols}
        >
          {rows.map((p) => {
            const name = bi(lang, p.name, p.nameAr) || p.id;
            const img = p.image || p.images?.[0] || '';
            const price = Number(p.basePrice ?? p.price) || 0;
            const orig = p.originalPrice != null ? Number(p.originalPrice) : null;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpenProduct?.(p.id)}
                className="rounded-2xl bg-white border border-neutral-100 p-3 text-center space-y-2 hover:shadow-md transition-shadow"
                style={{ padding: settings?.cardPaddingPx ?? 16 }}
                data-product-catalog-card={p.id}
              >
                {img ? (
                  <img src={img} alt="" className="h-24 w-full object-contain" loading="lazy" />
                ) : (
                  <div className="h-24 w-full rounded-xl bg-neutral-100" />
                )}
                <div className="text-xs font-bold line-clamp-2 text-neutral-900">{name}</div>
                {flags.showProductDescription ? (
                  <p className="text-[10px] text-neutral-500 line-clamp-2">
                    {bi(lang, p.tagline, p.taglineAr)}
                  </p>
                ) : null}
                {flags.showGiftLabel ? (
                  <div className="text-[9px] font-bold text-[#78471A] bg-[#F8F2EC] rounded-lg px-2 py-1">
                    {bi(lang, p.giftText, p.giftTextAr) || (isAr ? 'هدايا مع المنتج' : 'Gifts with product')}
                  </div>
                ) : null}
                {flags.showPrice ? (
                  <div className="text-sm font-black text-neutral-950">
                    {isAr ? `${price.toLocaleString()} ر.س` : `SAR ${price.toLocaleString()}`}
                    {flags.showOriginalPrice && orig != null && orig > price ? (
                      <span className="ms-1 text-[10px] text-neutral-400 line-through font-medium">
                        {orig.toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {flags.showInstallment ? (
                  <p className="text-[9px] text-neutral-500">
                    {bi(lang, p.installmentText, p.installmentTextAr) ||
                      (isAr ? `أو من ${(price / 4).toFixed(0)} ر.س / شهر` : `Or from ${(price / 4).toFixed(0)} SAR / mo`)}
                  </p>
                ) : null}
                {flags.showStock && typeof p.stock === 'number' ? (
                  <p className="text-[10px] text-neutral-500">
                    {p.stock > 0
                      ? isAr
                        ? `المتوفر ${p.stock}`
                        : `In stock ${p.stock}`
                      : isAr
                        ? 'نفد المخزون'
                        : 'Out of stock'}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-1 justify-center pt-1">
                  {flags.showBuyNow ? (
                    <span className="px-2 py-1 rounded-full bg-black text-white text-[9px] font-bold">
                      {isAr ? 'اشتر الآن' : 'Buy Now'}
                    </span>
                  ) : null}
                  {flags.showAddToCart ? (
                    <span className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[9px] font-bold">
                      {isAr ? 'أضف للسلة' : 'Add to Cart'}
                    </span>
                  ) : null}
                  {flags.showLearnMore ? (
                    <span className="px-2 py-1 rounded-full text-[9px] font-semibold text-neutral-500">
                      {isAr ? 'اعرف المزيد' : 'Learn More'}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
