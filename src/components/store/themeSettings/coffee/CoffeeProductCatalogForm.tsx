/**
 * CW-12 — Product Catalog / C-SHOP inspector (filters, sort, card toggles).
 * Checkout + SEO stay on Advanced (legacy C-SHOP dump). ≠ carousel / slider drafts.
 */
import React, { useMemo, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { MediaUploadField } from '../../../common/MediaUploadField';
import { GlobalModal } from '../../../common/GlobalModal';
import { BiFields, useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import {
  bi,
  emptyShopCatalog,
  type CheckoutFieldSettings,
  type SeoDefaultSettings,
  type ShopCatalogLoadMore,
  type ShopCatalogSettings,
  type ShopCatalogSort,
  type ShopPriceFilterType,
} from '../../../../themes/settings/coffeeModularSettings';
import { CoffeeProductCatalogSection } from '../../../../themes/coffeeRoasters/components/CoffeeProductCatalogSection';
import {
  catalogShowsOnDevice,
  type CatalogPreviewDevice,
  type CatalogProductLike,
} from '../../../../themes/coffeeRoasters/components/coffeeProductCatalogLogic';
import { useCart } from '../../../../themes/coffeeRoasters/context/CartContext';

type Tab = 'content' | 'style' | 'layout' | 'advanced';
const TABS: { id: Tab; en: string; ar: string }[] = [
  { id: 'content', en: 'Content', ar: 'المحتوى' },
  { id: 'style', en: 'Style', ar: 'النمط' },
  { id: 'layout', en: 'Layout', ar: 'التخطيط' },
  { id: 'advanced', en: 'Advanced', ar: 'متقدم' },
];

const inputCls = 'w-full px-3 py-2 rounded-lg border bg-white text-xs outline-none focus:border-[var(--accent)]';
const cardCls = 'rounded-2xl border p-4 shadow-sm space-y-3';
const cardStyle: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' };
const inputStyle: React.CSSProperties = { borderColor: 'var(--border)', color: 'var(--text)' };

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-semibold" style={{ color: 'var(--text)' }}>
      <span>{label}</span>
      <button type="button" onClick={() => onChange(!on)} className="w-11 h-6 rounded-full p-0.5" style={{ background: on ? 'var(--portal-cta)' : 'var(--border)' }} aria-pressed={on}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

function mapDevice(d: PreviewDevice): CatalogPreviewDevice {
  if (d === 'mobile') return 'mobile';
  if (d === 'tablet') return 'tablet';
  return 'desktop';
}

export const CoffeeProductCatalogForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const shopHook = useCoffeeDraft('shop');
  const checkoutHook = useCoffeeDraft('checkoutFields');
  const seoHook = useCoffeeDraft('seoDefaults');
  const { draft, setDraft, save, saving, savedFlash, isAr } = shopHook;
  const checkout = checkoutHook.draft;
  const seo = seoHook.draft;
  const { products } = useCart();
  const [tab, setTab] = useState<Tab>('content');
  const [inspectId, setInspectId] = useState<string | null>(null);
  const lang = isAr ? 'ar' : 'en';

  const catalog: CatalogProductLike[] = useMemo(
    () =>
      (products || []).map((p) => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        category: String(p.category || ''),
        basePrice: p.basePrice,
        price: p.basePrice,
        originalPrice: p.originalPrice ?? null,
        rating: p.rating,
        stock: (p as { stock?: number }).stock,
        image: p.image,
        images: p.images,
        tagline: p.tagline,
        taglineAr: p.taglineAr,
        isFeatured: Boolean((p as { isFeatured?: boolean }).isFeatured || (p as { featured?: boolean }).featured),
        salesCount: Number((p as { salesCount?: number }).salesCount || (p as { soldCount?: number }).soldCount || 0),
      })),
    [products],
  );

  const patch = (p: Partial<ShopCatalogSettings>) => setDraft({ ...(draft || emptyShopCatalog()), ...p });
  const inspecting = catalog.find((p) => p.id === inspectId) || null;

  const saveAll = async () => {
    await save();
    await checkoutHook.save();
    await seoHook.save();
  };

  const preview = (device: PreviewDevice) => {
    const d = mapDevice(device);
    if (draft?.enabled === false) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'القسم مخفي' : 'Section hidden'}</div>;
    }
    if (!catalogShowsOnDevice(draft, d)) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'مخفي على هذا الجهاز' : 'Hidden on this device'}</div>;
    }
    return (
      <CoffeeProductCatalogSection
        settings={draft}
        catalog={catalog}
        lang={lang}
        device={d}
        onOpenProduct={(id) => setInspectId(id)}
      />
    );
  };

  return (
    <>
      <CoffeeWordSettingsShell
        isAr={isAr}
        onBack={onBack}
        embedded={embedded}
        titleEn="Product Catalog"
        titleAr="كتالوج المنتجات"
        subtitleEn="Shop grid filters, sort, and card toggles. Separate from Product Slider and Carousel."
        subtitleAr="فلاتر شبكة المتجر والترتيب ومفاتيح البطاقة. منفصل عن شريط المنتجات والكاروسيل."
        onSave={() => void saveAll()}
        saving={saving || checkoutHook.saving || seoHook.saving}
        savedFlash={savedFlash || checkoutHook.savedFlash || seoHook.savedFlash}
        preview={preview}
        settings={
          <>
            <div className="flex flex-wrap gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--border)' }} role="tablist">
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    data-product-catalog-tab={t.id}
                    aria-selected={active}
                    onClick={() => setTab(t.id)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border"
                    style={active ? { background: 'var(--portal-cta)', color: '#fff', borderColor: 'var(--portal-cta)' } : { borderColor: 'transparent', color: 'var(--text)' }}
                  >
                    {isAr ? t.ar : t.en}
                  </button>
                );
              })}
            </div>

            {tab === 'content' ? (
              <>
                <section className={cardCls} style={cardStyle} data-product-catalog-panel="content">
                  <Toggle on={draft?.enabled !== false} onChange={(v) => patch({ enabled: v })} label={isAr ? 'تفعيل القسم' : 'Enable Section'} />
                  <Toggle on={draft?.showBadge !== false} onChange={(v) => patch({ showBadge: v })} label={isAr ? 'إظهار الشارة' : 'Show Badge'} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input className={inputCls} style={inputStyle} dir="ltr" value={draft?.badgeEn || ''} onChange={(e) => patch({ badgeEn: e.target.value })} placeholder="Badge (EN)" />
                    <input className={inputCls} style={inputStyle} dir="rtl" value={draft?.badgeAr || ''} onChange={(e) => patch({ badgeAr: e.target.value })} placeholder="الشارة (عربي)" />
                  </div>
                  <Toggle on={draft?.showTitle !== false} onChange={(v) => patch({ showTitle: v })} label={isAr ? 'إظهار العنوان' : 'Show Title'} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input className={inputCls} style={inputStyle} dir="ltr" value={draft?.titleEn || ''} onChange={(e) => patch({ titleEn: e.target.value })} placeholder="Title (EN)" />
                    <input className={inputCls} style={inputStyle} dir="rtl" value={draft?.titleAr || ''} onChange={(e) => patch({ titleAr: e.target.value })} placeholder="العنوان (عربي)" />
                  </div>
                  <Toggle on={draft?.showDescription !== false} onChange={(v) => patch({ showDescription: v })} label={isAr ? 'إظهار الوصف' : 'Show Description'} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <textarea className={`${inputCls} min-h-[56px]`} style={inputStyle} dir="ltr" value={draft?.descriptionEn || ''} onChange={(e) => patch({ descriptionEn: e.target.value })} placeholder="Description (EN)" />
                    <textarea className={`${inputCls} min-h-[56px]`} style={inputStyle} dir="rtl" value={draft?.descriptionAr || ''} onChange={(e) => patch({ descriptionAr: e.target.value })} placeholder="الوصف (عربي)" />
                  </div>
                </section>

                <section className={cardCls} style={cardStyle} data-product-catalog-panel="filters">
                  <h3 className="text-sm font-bold">{isAr ? 'الفلاتر والترتيب' : 'Filters and Sort'}</h3>
                  <Toggle on={draft?.showFilters !== false} onChange={(v) => patch({ showFilters: v })} label={isAr ? 'إظهار الفلاتر' : 'Show Filters'} />
                  <Toggle on={draft?.showCategories !== false} onChange={(v) => patch({ showCategories: v })} label={isAr ? 'إظهار التصنيفات' : 'Show Categories'} />
                  <Toggle on={draft?.showProductCount !== false} onChange={(v) => patch({ showProductCount: v })} label={isAr ? 'إظهار عدد المنتجات' : 'Show Product Count'} />
                  <Toggle on={draft?.showSort !== false} onChange={(v) => patch({ showSort: v })} label={isAr ? 'إظهار الترتيب' : 'Show Sort'} />
                  <Toggle on={draft?.showPriceFilter !== false} onChange={(v) => patch({ showPriceFilter: v })} label={isAr ? 'إظهار فلتر السعر' : 'Show Price Filter'} />
                  <label className="block space-y-1 text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'نوع فلتر السعر' : 'Price filter type'}</span>
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={draft?.priceFilterType || 'both'}
                      onChange={(e) => patch({ priceFilterType: e.target.value as ShopPriceFilterType })}
                    >
                      <option value="slider">{isAr ? 'شريط فقط' : 'Slider only'}</option>
                      <option value="presets">{isAr ? 'شرائح فقط' : 'Presets only'}</option>
                      <option value="both">{isAr ? 'الاثنان' : 'Both'}</option>
                    </select>
                  </label>
                  <Toggle on={draft?.showInStockFilter !== false} onChange={(v) => patch({ showInStockFilter: v })} label={isAr ? 'فلتر المتوفر' : 'In-Stock Filter'} />
                  <Toggle on={draft?.showResultsCount !== false} onChange={(v) => patch({ showResultsCount: v })} label={isAr ? 'إظهار عدد النتائج' : 'Show Results Count'} />
                  <label className="block space-y-1 text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'الترتيب الافتراضي' : 'Default sort'}</span>
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={draft?.defaultSort || 'featured'}
                      onChange={(e) => patch({ defaultSort: e.target.value as ShopCatalogSort })}
                    >
                      <option value="featured">{isAr ? 'المميز' : 'Featured'}</option>
                      <option value="newest">{isAr ? 'الأحدث' : 'Newest'}</option>
                      <option value="price-asc">{isAr ? 'السعر من الأقل' : 'Price low to high'}</option>
                      <option value="price-desc">{isAr ? 'السعر من الأعلى' : 'Price high to low'}</option>
                      <option value="name-asc">{isAr ? 'الاسم' : 'Name A–Z'}</option>
                      <option value="best_selling">{isAr ? 'الأكثر مبيعاً' : 'Best selling'}</option>
                      <option value="rating">{isAr ? 'التقييم' : 'Rating'}</option>
                    </select>
                  </label>
                  <label className="block space-y-1 text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'التصنيف الافتراضي' : 'Default category'}</span>
                    <input className={inputCls} style={inputStyle} dir="ltr" value={draft?.defaultCategory || 'all'} onChange={(e) => patch({ defaultCategory: e.target.value })} placeholder="all" />
                  </label>
                </section>

                <section className={cardCls} style={cardStyle} data-product-catalog-panel="products">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">{isAr ? `منتجات الكتالوج (${catalog.length})` : `Catalog products (${catalog.length})`}</h3>
                  </div>
                  {!catalog.length ? (
                    <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'لا منتجات — بانتظار البيانات' : 'No products — Waiting for Data'}</p>
                  ) : (
                    <ul className="space-y-2 max-h-56 overflow-y-auto">
                      {catalog.slice(0, 24).map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs" style={{ borderColor: 'var(--border)' }}>
                          <span className="font-semibold truncate">{bi(lang, p.name, p.nameAr) || p.id}</span>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg border shrink-0"
                            style={{ borderColor: 'var(--border)' }}
                            onClick={() => setInspectId(p.id)}
                            aria-label={isAr ? 'معاينة البطاقة' : 'Inspect card'}
                            data-product-catalog-inspect={p.id}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'صفوف المنتجات من الكتالوج الحقيقي للمتجر فقط. التعديل الكامل من لوحة المنتجات.'
                      : 'Product rows come from this store’s live catalog only. Full edits stay in Products admin.'}
                  </p>
                </section>
              </>
            ) : null}

            {tab === 'style' ? (
              <section className={cardCls} style={cardStyle} data-product-catalog-panel="style">
                <h3 className="text-sm font-bold">{isAr ? 'مفاتيح بطاقة المنتج' : 'Product Card Toggles'}</h3>
                <Toggle on={draft?.showPrice !== false} onChange={(v) => patch({ showPrice: v })} label={isAr ? 'إظهار السعر' : 'Show Price'} />
                <Toggle on={draft?.showOriginalPrice !== false} onChange={(v) => patch({ showOriginalPrice: v })} label={isAr ? 'إظهار السعر الأصلي' : 'Show Original Price'} />
                <Toggle on={draft?.showGiftLabel !== false} onChange={(v) => patch({ showGiftLabel: v })} label={isAr ? 'إظهار شارة الهدايا' : 'Show Gift Label'} />
                <Toggle on={draft?.showInstallment !== false} onChange={(v) => patch({ showInstallment: v })} label={isAr ? 'إظهار التقسيط' : 'Show Installment'} />
                <Toggle on={draft?.showStock !== false} onChange={(v) => patch({ showStock: v })} label={isAr ? 'إظهار المخزون' : 'Show Stock'} />
                <Toggle on={draft?.showBuyNow !== false} onChange={(v) => patch({ showBuyNow: v })} label={isAr ? 'إظهار اشترِ الآن' : 'Show Buy Now'} />
                <Toggle on={draft?.showAddToCart !== false} onChange={(v) => patch({ showAddToCart: v })} label={isAr ? 'إظهار أضف إلى السلة' : 'Show Add to Cart'} />
                <Toggle on={draft?.showLearnMore !== false} onChange={(v) => patch({ showLearnMore: v })} label={isAr ? 'إظهار اعرف المزيد' : 'Show Learn More'} />
                <div
                  className="rounded-xl border px-3 py-2.5 space-y-1.5"
                  style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--portal-cta) 6%, var(--surface))' }}
                  data-learn-more-customize-hint
                >
                  <p className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                    {isAr ? 'تخصيص الصفحة = مكان اعرف المزيد' : 'Page customize = Learn More spot'}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'على البطاقة يظهر زر «تخصيص الصفحة» في صف اعرف المزيد. للكل أو لمنتجات محددة افتح تخطيط صفحة المنتج.'
                      : 'On the card, “Customize page” sits on the Learn More row. For all or specific SKUs open Product Page Layout.'}
                  </p>
                </div>
                <Toggle on={!!draft?.showWishlist} onChange={(v) => patch({ showWishlist: v })} label={isAr ? 'إظهار المفضلة' : 'Show Wishlist'} />
                <Toggle on={!!draft?.showCompare} onChange={(v) => patch({ showCompare: v })} label={isAr ? 'إظهار المقارنة' : 'Show Compare'} />
                <Toggle on={!!draft?.showProductDescription} onChange={(v) => patch({ showProductDescription: v })} label={isAr ? 'إظهار وصف المنتج' : 'Show Product Description'} />
              </section>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-product-catalog-panel="layout">
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'أعمدة سطح المكتب' : 'Desktop columns'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.columnsDesktop ?? 4} onChange={(e) => patch({ columnsDesktop: Number(e.target.value) })}>
                    {[2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'أعمدة الجهاز اللوحي' : 'Tablet columns'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.columnsTablet ?? 3} onChange={(e) => patch({ columnsTablet: Number(e.target.value) })}>
                    {[2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'أعمدة الجوال' : 'Mobile columns'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.columnsMobile ?? 2} onChange={(e) => patch({ columnsMobile: Number(e.target.value) })}>
                    {[1, 2].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'عدد المنتجات في الصفحة' : 'Products per page'}</span>
                  <input type="number" min={4} max={48} className={inputCls} style={inputStyle} value={draft?.perPage ?? 24} onChange={(e) => patch({ perPage: Number(e.target.value) || 24 })} />
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'تحميل المزيد' : 'Load more type'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.loadMoreType || 'load_more'} onChange={(e) => patch({ loadMoreType: e.target.value as ShopCatalogLoadMore })}>
                    <option value="load_more">{isAr ? 'زر تحميل المزيد' : 'Load more button'}</option>
                    <option value="pagination">{isAr ? 'ترقيم الصفحات' : 'Pagination'}</option>
                    <option value="infinite">{isAr ? 'تمرير لا نهائي' : 'Infinite scroll'}</option>
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'حشوة القسم' : 'Section padding (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.sectionPaddingY ?? 32} onChange={(e) => patch({ sectionPaddingY: Number(e.target.value) })}>
                    {[16, 24, 32, 48, 64].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة البطاقات' : 'Card gap (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.cardGapPx ?? 16} onChange={(e) => patch({ cardGapPx: Number(e.target.value) })}>
                    {[8, 12, 16, 20, 24].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'حشوة البطاقة' : 'Card padding (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.cardPaddingPx ?? 16} onChange={(e) => patch({ cardPaddingPx: Number(e.target.value) })}>
                    {[8, 12, 16, 20].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </section>
            ) : null}

            {tab === 'advanced' ? (
              <>
                <section className={cardCls} style={cardStyle} data-product-catalog-panel="advanced">
                  <Toggle on={draft?.showOnDesktop !== false} onChange={(v) => patch({ showOnDesktop: v })} label={isAr ? 'إظهار على سطح المكتب' : 'Show on Desktop'} />
                  <Toggle on={draft?.showOnTablet !== false} onChange={(v) => patch({ showOnTablet: v })} label={isAr ? 'إظهار على الجهاز اللوحي' : 'Show on Tablet'} />
                  <Toggle on={draft?.showOnMobile !== false} onChange={(v) => patch({ showOnMobile: v })} label={isAr ? 'إظهار على الجوال' : 'Show on Mobile'} />
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'شريط المنتجات والكاروسيل أقسام منفصلة — لا تدمجها هنا.'
                      : 'Product Slider and Carousel are separate sections — do not merge here.'}
                  </p>
                </section>
                <section className={cardCls} style={cardStyle} data-product-catalog-panel="checkout">
                  <h3 className="text-sm font-bold">{isAr ? 'إتمام الشراء' : 'Checkout'}</h3>
                  <Toggle on={checkout?.showCoupon !== false} onChange={(v) => checkoutHook.setDraft({ ...checkout, showCoupon: v } as CheckoutFieldSettings)} label={isAr ? 'إظهار الكوبون' : 'Show coupon'} />
                  <Toggle on={checkout?.showOrderNote === true} onChange={(v) => checkoutHook.setDraft({ ...checkout, showOrderNote: v } as CheckoutFieldSettings)} label={isAr ? 'إظهار ملاحظة الطلب' : 'Show order note'} />
                  <Toggle on={checkout?.showShipping !== false} onChange={(v) => checkoutHook.setDraft({ ...checkout, showShipping: v } as CheckoutFieldSettings)} label={isAr ? 'إظهار عنوان الشحن' : 'Show shipping address'} />
                  <Toggle on={checkout?.allowGuest === true} onChange={(v) => checkoutHook.setDraft({ ...checkout, allowGuest: v } as CheckoutFieldSettings)} label={isAr ? 'السماح بالشراء دون حساب' : 'Allow guest checkout'} />
                </section>
                <section className={cardCls} style={cardStyle} data-product-catalog-panel="seo">
                  <h3 className="text-sm font-bold">{isAr ? 'قوالب تحسين الظهور' : 'SEO templates'}</h3>
                  <BiFields isAr={isAr} labelEn="SEO title" labelAr="عنوان تحسين الظهور" en={seo?.titleEn || ''} ar={seo?.titleAr || ''} onEn={(v) => seoHook.setDraft({ ...seo, titleEn: v } as SeoDefaultSettings)} onAr={(v) => seoHook.setDraft({ ...seo, titleAr: v } as SeoDefaultSettings)} />
                  <BiFields isAr={isAr} labelEn="SEO description" labelAr="وصف تحسين الظهور" en={seo?.descriptionEn || ''} ar={seo?.descriptionAr || ''} onEn={(v) => seoHook.setDraft({ ...seo, descriptionEn: v } as SeoDefaultSettings)} onAr={(v) => seoHook.setDraft({ ...seo, descriptionAr: v } as SeoDefaultSettings)} />
                  <MediaUploadField
                    label={isAr ? 'صورة المشاركة' : 'Share image'}
                    value={seo?.ogImage || ''}
                    onChange={(url) => seoHook.setDraft({ ...seo, ogImage: url } as SeoDefaultSettings)}
                    aspectRatio="banner"
                  />
                </section>
              </>
            ) : null}
          </>
        }
      />

      <GlobalModal isOpen={!!inspecting} onClose={() => setInspectId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'معاينة بطاقة المنتج' : 'Inspect product card'} contentClassName="max-w-xl">
        {inspecting ? (
          <div className="rounded-2xl border shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} data-product-catalog-edit>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'معاينة بطاقة المنتج' : 'Inspect Product Card'}</h3>
              <button type="button" onClick={() => setInspectId(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto text-xs">
              <p className="font-bold text-sm">{bi(lang, inspecting.name, inspecting.nameAr) || inspecting.id}</p>
              <p style={{ color: 'var(--muted)' }}>{inspecting.id}</p>
              {inspecting.image || inspecting.images?.[0] ? (
                <img src={inspecting.image || inspecting.images?.[0]} alt="" className="h-32 w-full object-contain rounded-xl bg-neutral-50" />
              ) : null}
              <p>
                {isAr
                  ? `${Number((inspecting.basePrice ?? inspecting.price) || 0).toLocaleString()} ⃁`
                  : `⃁ ${Number((inspecting.basePrice ?? inspecting.price) || 0).toLocaleString()}`}
              </p>
              <p style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'بيانات المنتج من الكتالوج الحقيقي. مفاتيح العرض أدناه من إعدادات الشبكة.'
                  : 'Product data is from the live catalog. Display toggles below come from grid settings.'}
              </p>
              <Toggle on={draft?.showPrice !== false} onChange={(v) => patch({ showPrice: v })} label={isAr ? 'إظهار السعر' : 'Show Price'} />
              <Toggle on={draft?.showGiftLabel !== false} onChange={(v) => patch({ showGiftLabel: v })} label={isAr ? 'شارة الهدايا' : 'Gift label'} />
              <Toggle on={draft?.showBuyNow !== false} onChange={(v) => patch({ showBuyNow: v })} label={isAr ? 'اشترِ الآن' : 'Buy Now'} />
              <Toggle on={draft?.showAddToCart !== false} onChange={(v) => patch({ showAddToCart: v })} label={isAr ? 'أضف إلى السلة' : 'Add to Cart'} />
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setInspectId(null)}>
                {isAr ? 'تم' : 'Done'}
              </button>
            </div>
          </div>
        ) : null}
      </GlobalModal>
    </>
  );
};

/** Legacy export name used by CustomizerSectionForm / hub. */
export const CatalogControlsForm = CoffeeProductCatalogForm;
