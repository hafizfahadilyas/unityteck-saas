import React, { useMemo, useState } from 'react';
import { GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { MediaUploadField } from '../../../common/MediaUploadField';
import { GlobalModal } from '../../../common/GlobalModal';
import { useTenant } from '../../../../context/TenantContext';
import { syncBilingualPatch, useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import {
  bi,
  type CategoryShowcaseBanner,
  type FeaturedCategoriesProductsSettings,
} from '../../../../themes/settings/coffeeModularSettings';
import {
  CATEGORY_SHOWCASE_MAX_BANNERS,
  CATEGORY_SHOWCASE_MAX_PRODUCTS,
  blankShowcaseBanner,
  colsForDevice,
  reorderByIndex,
  resolveShowcaseCardChrome,
  resolveShowcaseProductIds,
  spacingPx,
  visibleShowcaseBanners,
} from '../../../../themes/coffeeRoasters/components/coffeeCategoryShowcaseLogic';

type Tab = 'content' | 'templates' | 'style' | 'layout' | 'code' | 'ai';
const TABS: { id: Tab; en: string; ar: string }[] = [
  { id: 'content', en: 'Content', ar: 'المحتوى' },
  { id: 'templates', en: 'Templates', ar: 'القوالب' },
  { id: 'style', en: 'Style', ar: 'النمط' },
  { id: 'layout', en: 'Layout', ar: 'التخطيط' },
  { id: 'code', en: 'Code', ar: 'الرمز' },
  { id: 'ai', en: 'AI', ar: 'الذكاء الاصطناعي' },
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

export const FeaturedCategoriesProductsForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('featuredCategoriesProducts');
  const { currentProducts } = useTenant();
  const [tab, setTab] = useState<Tab>('content');
  const [editBannerId, setEditBannerId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const banners = draft?.banners || [];
  const productIds = draft?.productIds || [];
  const editing = banners.find((b) => b.id === editBannerId) || null;
  const lang = isAr ? 'ar' : 'en';
  const chrome = resolveShowcaseCardChrome(draft);

  const patch = (p: Partial<FeaturedCategoriesProductsSettings>) => {
    const next: FeaturedCategoriesProductsSettings = { ...draft, ...p };
    const sections = [...(next.sections || [])];
    if (sections[0]) {
      sections[0] = {
        ...sections[0],
        titleEn: next.titleEn ?? sections[0].titleEn,
        titleAr: next.titleAr ?? sections[0].titleAr,
        descriptionEn: next.descriptionEn ?? sections[0].descriptionEn,
        descriptionAr: next.descriptionAr ?? sections[0].descriptionAr,
        showPrice: next.showPrice ?? sections[0].showPrice,
        showDiscount: next.showDiscount ?? sections[0].showDiscount,
        showViewMore: next.showMoreProducts ?? sections[0].showViewMore,
        viewMoreEn: next.moreProductsEn ?? sections[0].viewMoreEn,
        viewMoreAr: next.moreProductsAr ?? sections[0].viewMoreAr,
        viewMoreLink: next.moreProductsUrl ?? sections[0].viewMoreLink,
        cardStyle: next.cardStyle ?? sections[0].cardStyle,
        spacing: next.cardSpacing ?? sections[0].spacing,
      };
      next.sections = sections;
    }
    setDraft(next);
  };
  const setBanners = (next: CategoryShowcaseBanner[]) => patch({ banners: next });
  const patchBanner = (id: string, p: Partial<CategoryShowcaseBanner>) =>
    setBanners(banners.map((b) => (b.id === id ? { ...b, ...p } : b)));

  const catalog = useMemo(
    () =>
      (currentProducts || []).map((p) => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        image: p.image || p.images?.[0] || '',
        price: p.price,
        originalPrice: p.originalPrice,
      })),
    [currentProducts],
  );

  const selectedProducts = catalog.filter((p) => productIds.includes(p.id));
  const previewBanners = visibleShowcaseBanners(draft);

  const preview = (device: PreviewDevice) => {
    if (!draft?.enabled) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'القسم مخفي' : 'Section hidden'}</div>;
    }
    const cols = colsForDevice(draft, device);
    const gap = spacingPx(draft?.cardSpacing);
    const visible = selectedProducts.slice(0, chrome.maxVisibleProducts);
    const hasMore = selectedProducts.length > chrome.maxVisibleProducts;
    const buyTxt = isAr ? chrome.buyLabelAr : chrome.buyLabelEn;
    const learnTxt = isAr ? chrome.learnMoreLabelAr : chrome.learnMoreLabelEn;
    return (
      <div className="p-3 space-y-3" style={{ background: chrome.bgColor || 'transparent' }}>
        {(draft.titleEn || draft.titleAr) && (
          <div className="font-bold text-sm text-center">{bi(lang, draft.titleEn, draft.titleAr)}</div>
        )}
        {previewBanners.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {previewBanners.slice(0, 3).map((b) => (
              <div key={b.id} className="relative min-h-[72px] overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', borderRadius: b.borderRadius ?? 16 }}>
                {b.image ? <img src={b.image} alt="" className="absolute inset-0 w-full h-full object-cover" /> : null}
                <div className="relative z-10 p-2 text-[10px] font-bold" style={{ color: b.textColor || '#fff' }}>
                  {bi(lang, b.titleEn, b.titleAr) || (isAr ? 'بانر' : 'Banner')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-center" style={{ color: 'var(--muted)' }}>{isAr ? 'لا بانرات علوية' : 'No top banners'}</p>
        )}
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap,
            alignItems: chrome.equalCardHeights ? 'stretch' : 'start',
          }}
        >
          {visible.length === 0 ? (
            <div className="col-span-full text-[11px] text-center" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا منتجات محددة' : 'No selected products'}
            </div>
          ) : (
            visible.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border p-2 text-center bg-white ${chrome.equalCardHeights ? 'h-full flex flex-col' : ''}`}
                style={{ borderColor: 'var(--border)', borderRadius: chrome.cardRadius > 0 ? 12 : 0 }}
              >
                {p.image ? <img src={p.image} alt="" className="h-14 w-full object-contain mb-1" /> : null}
                {draft?.showProductName !== false ? (
                  <div
                    className="font-bold line-clamp-2"
                    style={{ fontSize: chrome.titleFontSizePx, color: chrome.titleColor }}
                  >
                    {isAr ? p.nameAr || p.name : p.nameEn || p.name}
                  </div>
                ) : null}
                {draft?.showPrice !== false && p.price != null ? (
                  <div className="mt-1" style={{ fontSize: chrome.priceFontSizePx, color: chrome.priceColor }}>
                    {isAr ? `${p.price} ⃁` : `⃁ ${p.price}`}
                  </div>
                ) : null}
                <div className={`flex items-center justify-center gap-3 pt-2 ${chrome.equalCardHeights ? 'mt-auto' : ''}`}>
                  <span style={{ fontSize: chrome.ctaFontSizePx, color: chrome.buyColor }}>{buyTxt} ›</span>
                  <span style={{ fontSize: chrome.ctaFontSizePx, color: chrome.learnMoreColor }}>{learnTxt} ›</span>
                </div>
              </div>
            ))
          )}
        </div>
        {chrome.showMoreProducts && hasMore ? (
          <div className="flex justify-center pt-1">
            <span className="inline-flex px-3 py-1.5 rounded-full bg-neutral-900 text-white text-[10px] font-bold">
              {isAr ? chrome.moreProductsAr : chrome.moreProductsEn}
            </span>
          </div>
        ) : null}
      </div>
    );
  };

  const filteredPicker = catalog.filter((p) => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return true;
    return (p.name || '').toLowerCase().includes(q) || (p.nameAr || '').includes(pickerQuery) || p.id.toLowerCase().includes(q);
  });

  return (
    <>
      <CoffeeWordSettingsShell
        isAr={isAr}
        onBack={onBack}
        embedded={embedded}
        titleEn="Category Showcase Section"
        titleAr="قسم عرض التصنيفات"
        subtitleEn="Top banners + product grid with carousel options. Empty stays empty."
        subtitleAr="بانرات علوية وشبكة منتجات مع خيارات العرض المتحرك. الفارغ يبقى فارغاً."
        onSave={() => save()}
        saving={saving}
        savedFlash={savedFlash}
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
                    data-category-showcase-tab={t.id}
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
                <section className={cardCls} style={cardStyle} data-category-showcase-panel="content">
                  <Toggle on={!!draft?.enabled} onChange={(v) => patch({ enabled: v })} label={isAr ? 'تفعيل القسم' : 'Enable Section'} />
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{isAr ? 'عنوان القسم' : 'Main Section Title'}</span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={100}
                      value={isAr ? draft?.titleAr || '' : draft?.titleEn || ''}
                      onChange={(e) => patch(syncBilingualPatch<FeaturedCategoriesProductsSettings>('titleEn', 'titleAr', e.target.value))}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{isAr ? 'الوصف (اختياري)' : 'Section Description (Optional)'}</span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={200}
                      value={isAr ? draft?.descriptionAr || '' : draft?.descriptionEn || ''}
                      onChange={(e) => patch(syncBilingualPatch<FeaturedCategoriesProductsSettings>('descriptionEn', 'descriptionAr', e.target.value))}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{isAr ? 'نص الشراء' : 'Buy Label'}</span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={40}
                      value={isAr ? draft?.buyLabelAr || '' : draft?.buyLabelEn || ''}
                      onChange={(e) => patch(syncBilingualPatch<FeaturedCategoriesProductsSettings>('buyLabelEn', 'buyLabelAr', e.target.value))}
                      placeholder={isAr ? 'شراء' : 'Buy'}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{isAr ? 'نص اعرف المزيد' : 'Learn More Label'}</span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={40}
                      value={isAr ? draft?.learnMoreLabelAr || '' : draft?.learnMoreLabelEn || ''}
                      onChange={(e) => patch(syncBilingualPatch<FeaturedCategoriesProductsSettings>('learnMoreLabelEn', 'learnMoreLabelAr', e.target.value))}
                      placeholder={isAr ? 'تعرف على المزيد' : 'Learn More'}
                    />
                  </label>
                  <Toggle on={draft?.showMoreProducts !== false} onChange={(v) => patch({ showMoreProducts: v })} label={isAr ? 'زر المزيد من المنتجات' : 'More Products Button'} />
                  {draft?.showMoreProducts !== false ? (
                    <>
                      <label className="block space-y-1">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{isAr ? 'نص زر المزيد' : 'More Products Label'}</span>
                        <input
                          className={inputCls}
                          style={inputStyle}
                          dir={isAr ? 'rtl' : 'ltr'}
                          maxLength={60}
                          value={isAr ? draft?.moreProductsAr || '' : draft?.moreProductsEn || ''}
                          onChange={(e) => patch(syncBilingualPatch<FeaturedCategoriesProductsSettings>('moreProductsEn', 'moreProductsAr', e.target.value))}
                          placeholder={isAr ? 'المزيد من المنتجات' : 'More Products'}
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{isAr ? 'رابط صفحة المتجر (افتراضي: المتجر)' : 'Shop Page URL (default: shop)'}</span>
                        <input
                          className={inputCls}
                          style={inputStyle}
                          dir="ltr"
                          maxLength={200}
                          value={draft?.moreProductsUrl || 'products'}
                          onChange={(e) => patch({ moreProductsUrl: e.target.value || 'products' })}
                          placeholder="products"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{isAr ? 'أقصى منتجات ظاهرة قبل زر المزيد' : 'Max Visible Before More Products'}</span>
                        <input
                          type="number"
                          min={1}
                          max={CATEGORY_SHOWCASE_MAX_PRODUCTS}
                          className={inputCls}
                          style={inputStyle}
                          value={draft?.maxVisibleProducts || 5}
                          onChange={(e) => patch({ maxVisibleProducts: Math.max(1, Number(e.target.value) || 5) })}
                        />
                      </label>
                    </>
                  ) : null}
                </section>

                <section className={cardCls} style={cardStyle} data-category-showcase-panel="banners">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{isAr ? `بانرات العرض (${banners.length}/${CATEGORY_SHOWCASE_MAX_BANNERS})` : `Showcase Banners (${banners.length}/${CATEGORY_SHOWCASE_MAX_BANNERS})`}</h3>
                    <button type="button" disabled={banners.length >= CATEGORY_SHOWCASE_MAX_BANNERS} className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40" onClick={() => { const row = blankShowcaseBanner(); setBanners([...banners, row]); setEditBannerId(row.id); patch({ enabled: true }); }}>
                      + {isAr ? 'إضافة بانر' : 'Add Banner'}
                    </button>
                  </div>
                  {banners.length === 0 ? <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا بانرات.' : 'No banners.'}</p> : (
                    <ul className="space-y-2">
                      {banners.map((b, index) => (
                        <li
                          key={b.id}
                          draggable
                          onDragStart={() => setDragIndex(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => { if (dragIndex !== null) setBanners(reorderByIndex(banners, dragIndex, index)); setDragIndex(null); }}
                          className="flex items-center gap-2 rounded-xl border px-2 py-2"
                          style={{ borderColor: 'var(--border)', opacity: b.enabled === false ? 0.5 : 1 }}
                        >
                          <GripVertical className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                          {b.image ? <img src={b.image} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <span className="w-10 h-10 rounded-lg border" style={{ borderColor: 'var(--border)' }} />}
                          <div className="min-w-0 flex-1 text-xs font-bold truncate">{bi(lang, b.titleEn, b.titleAr) || (isAr ? 'بدون عنوان' : 'Untitled')}</div>
                          <button type="button" className="w-9 h-5 rounded-full p-0.5" style={{ background: b.enabled !== false ? 'var(--portal-cta)' : 'var(--border)' }} onClick={() => patchBanner(b.id, { enabled: b.enabled === false })} />
                          <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setEditBannerId(b.id)} aria-label={isAr ? 'تعديل' : 'Edit'}><Pencil className="w-3.5 h-3.5" /></button>
                          <button type="button" className="p-1.5 rounded-lg border border-rose-200 text-rose-500" onClick={() => { setBanners(banners.filter((x) => x.id !== b.id)); if (editBannerId === b.id) setEditBannerId(null); }} aria-label={isAr ? 'حذف' : 'Delete'}><Trash2 className="w-3.5 h-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className={cardCls} style={cardStyle} data-category-showcase-panel="products">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{isAr ? `المنتجات (${productIds.length}/${CATEGORY_SHOWCASE_MAX_PRODUCTS})` : `Products (${productIds.length}/${CATEGORY_SHOWCASE_MAX_PRODUCTS})`}</h3>
                    <button type="button" className="unity-btn-primary inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold" onClick={() => setPickerOpen(true)}>
                      <Plus className="w-3.5 h-3.5" /> {isAr ? 'اختيار منتجات' : 'Select Products'}
                    </button>
                  </div>
                  {selectedProducts.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا منتجات — الشبكة فارغة في المتجر.' : 'No products — grid stays empty on storefront.'}</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedProducts.map((p) => (
                        <li key={p.id} className="flex items-center gap-2 rounded-xl border px-2 py-2" style={{ borderColor: 'var(--border)' }}>
                          {p.image ? <img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover" /> : null}
                          <div className="min-w-0 flex-1 text-xs font-bold truncate">{isAr ? p.nameAr || p.name : p.nameEn || p.name}</div>
                          <button type="button" className="p-1.5 rounded-lg border border-rose-200 text-rose-500" onClick={() => patch({ productIds: productIds.filter((id) => id !== p.id), productSource: 'selected' })} aria-label={isAr ? 'إزالة' : 'Remove'}><Trash2 className="w-3.5 h-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-category-showcase-panel="layout">
                <h3 className="text-sm font-bold">{isAr ? 'التخطيط والتنقل' : 'Layout & Carousel'}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['productsPerRowDesktop', isAr ? 'سطح المكتب' : 'Desktop', draft?.productsPerRowDesktop || 5, [3, 4, 5]],
                    ['productsPerRowTablet', isAr ? 'لوحي' : 'Tablet', draft?.productsPerRowTablet || 3, [2, 3]],
                    ['productsPerRowMobile', isAr ? 'جوال' : 'Mobile', draft?.productsPerRowMobile || 2, [1, 2]],
                  ] as const).map(([key, label, value, opts]) => (
                    <label key={key} className="space-y-1 block text-[11px] font-semibold">
                      <span style={{ color: 'var(--muted)' }}>{label}</span>
                      <select className={inputCls} style={inputStyle} value={value} onChange={(e) => patch({ [key]: Number(e.target.value) } as Partial<FeaturedCategoriesProductsSettings>)}>
                        {opts.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <Toggle on={draft?.enableCarousel !== false} onChange={(v) => patch({ enableCarousel: v })} label={isAr ? 'تفعيل عرض المنتجات المتحرك' : 'Enable Product Carousel'} />
                <Toggle on={draft?.enableTouchSwipe !== false} onChange={(v) => patch({ enableTouchSwipe: v })} label={isAr ? 'السحب باللمس' : 'Enable Touch Swipe'} />
                <Toggle on={draft?.showArrowsDesktop !== false} onChange={(v) => patch({ showArrowsDesktop: v })} label={isAr ? 'أسهم سطح المكتب' : 'Arrows Desktop'} />
                <Toggle on={draft?.showArrowsTablet === true} onChange={(v) => patch({ showArrowsTablet: v })} label={isAr ? 'أسهم الجهاز اللوحي' : 'Arrows Tablet'} />
                <Toggle on={draft?.showArrowsMobile === true} onChange={(v) => patch({ showArrowsMobile: v })} label={isAr ? 'أسهم الجوال' : 'Arrows Mobile'} />
                <Toggle on={draft?.autoplay === true} onChange={(v) => patch({ autoplay: v })} label={isAr ? 'تشغيل تلقائي' : 'Auto Play'} />
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{isAr ? 'سرعة التشغيل (ثوانٍ)' : 'Auto Play Speed (sec)'}</span>
                  <input type="number" min={2} max={20} className={inputCls} style={inputStyle} value={draft?.autoplaySpeedSec || 5} onChange={(e) => patch({ autoplaySpeedSec: Number(e.target.value) || 5 })} />
                </label>
              </section>
            ) : null}

            {tab === 'style' ? (
              <section className={cardCls} style={cardStyle} data-category-showcase-panel="style">
                <h3 className="text-sm font-bold">{isAr ? 'النمط' : 'Style'}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1 block text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'شكل البطاقة' : 'Card Style'}</span>
                    <select className={inputCls} style={inputStyle} value={draft?.cardStyle || 'rounded'} onChange={(e) => patch({ cardStyle: e.target.value as 'rounded' | 'square' })}>
                      <option value="rounded">{isAr ? 'منحني' : 'Rounded'}</option>
                      <option value="square">{isAr ? 'مربع' : 'Square'}</option>
                    </select>
                  </label>
                  <label className="space-y-1 block text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'تباعد البطاقات' : 'Card Spacing'}</span>
                    <select className={inputCls} style={inputStyle} value={draft?.cardSpacing || 'medium'} onChange={(e) => patch({ cardSpacing: e.target.value as 'small' | 'medium' | 'large' })}>
                      <option value="small">{isAr ? 'صغير' : 'Small'}</option>
                      <option value="medium">{isAr ? 'متوسط' : 'Medium'}</option>
                      <option value="large">{isAr ? 'كبير' : 'Large'}</option>
                    </select>
                  </label>
                  <label className="space-y-1 block text-[11px] font-semibold col-span-2">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'خلفية القسم' : 'Section Background'}</span>
                    <div className="flex gap-2">
                      <input type="color" value={draft?.bgColor || '#F9F9F9'} onChange={(e) => patch({ bgColor: e.target.value })} className="w-9 h-9 rounded-lg border p-1" style={{ borderColor: 'var(--border)' }} />
                      <input className={inputCls} style={inputStyle} dir="ltr" value={draft?.bgColor || '#F9F9F9'} onChange={(e) => patch({ bgColor: e.target.value })} />
                    </div>
                  </label>
                </div>
                <Toggle on={draft?.equalCardHeights !== false} onChange={(v) => patch({ equalCardHeights: v })} label={isAr ? 'تساوي ارتفاع البطاقات' : 'Equal Card Heights'} />
                <Toggle on={draft?.showProductName !== false} onChange={(v) => patch({ showProductName: v })} label={isAr ? 'إظهار اسم المنتج' : 'Show Product Name'} />
                <Toggle on={draft?.showPrice !== false} onChange={(v) => patch({ showPrice: v })} label={isAr ? 'إظهار السعر' : 'Show Price'} />
                <Toggle on={draft?.showOriginalPrice === true} onChange={(v) => patch({ showOriginalPrice: v })} label={isAr ? 'إظهار السعر الأصلي' : 'Show Original Price'} />
                <Toggle on={draft?.showDiscount !== false} onChange={(v) => patch({ showDiscount: v })} label={isAr ? 'إظهار الخصم' : 'Show Discount'} />

                <h4 className="text-xs font-bold pt-2" style={{ color: 'var(--text)' }}>{isAr ? 'الخطوط والألوان' : 'Fonts & Colors'}</h4>
                {([
                  ['titleFontSizePx', 'titleColor', isAr ? 'اسم المنتج' : 'Product Title', 16, '#171717'],
                  ['taglineFontSizePx', 'taglineColor', isAr ? 'الوصف القصير' : 'Tagline', 13, '#525252'],
                  ['priceFontSizePx', 'priceColor', isAr ? 'السعر' : 'Price', 15, '#171717'],
                  ['ctaFontSizePx', 'buyColor', isAr ? 'نص الشراء' : 'Buy Text', 12, '#171717'],
                ] as const).map(([sizeKey, colorKey, label, defSize, defColor]) => (
                  <div key={sizeKey} className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                    <label className="space-y-1 block text-[11px] font-semibold">
                      <span style={{ color: 'var(--muted)' }}>{label} · {isAr ? 'الحجم' : 'Size'}</span>
                      <input
                        type="number"
                        min={10}
                        max={28}
                        className={inputCls}
                        style={inputStyle}
                        value={(draft?.[sizeKey] as number | undefined) || defSize}
                        onChange={(e) => patch({ [sizeKey]: Number(e.target.value) || defSize } as Partial<FeaturedCategoriesProductsSettings>)}
                      />
                    </label>
                    <label className="space-y-1 block text-[11px] font-semibold">
                      <span style={{ color: 'var(--muted)' }}>{isAr ? 'اللون' : 'Color'}</span>
                      <input
                        type="color"
                        value={(draft?.[colorKey] as string | undefined) || defColor}
                        onChange={(e) => patch({ [colorKey]: e.target.value } as Partial<FeaturedCategoriesProductsSettings>)}
                        className="w-9 h-9 rounded-lg border p-1"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    </label>
                    <input
                      className={`${inputCls} w-[5.5rem]`}
                      style={inputStyle}
                      dir="ltr"
                      value={(draft?.[colorKey] as string | undefined) || defColor}
                      onChange={(e) => patch({ [colorKey]: e.target.value } as Partial<FeaturedCategoriesProductsSettings>)}
                    />
                  </div>
                ))}
                <label className="space-y-1 block text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'لون اعرف المزيد' : 'Learn More Color'}</span>
                  <div className="flex gap-2">
                    <input type="color" value={draft?.learnMoreColor || '#171717'} onChange={(e) => patch({ learnMoreColor: e.target.value })} className="w-9 h-9 rounded-lg border p-1" style={{ borderColor: 'var(--border)' }} />
                    <input className={inputCls} style={inputStyle} dir="ltr" value={draft?.learnMoreColor || '#171717'} onChange={(e) => patch({ learnMoreColor: e.target.value })} />
                  </div>
                </label>
              </section>
            ) : null}

            {tab === 'templates' ? (
              <section className={cardCls} style={cardStyle} data-category-showcase-panel="templates">
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'التخطيط: بانرات أعلى + منتجات أسفل.' : 'Layout: Banners top + products below.'}</p>
              </section>
            ) : null}
            {tab === 'code' || tab === 'ai' ? (
              <section className={cardCls} style={cardStyle} data-category-showcase-panel={tab}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'بانتظار البيانات — غير متصل' : 'Waiting for Data — Not Connected'}</p>
              </section>
            ) : null}
          </>
        }
      />

      <GlobalModal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'اختيار منتجات' : 'Select products'} contentClassName="max-w-lg">
        <div className="rounded-2xl border shadow-2xl w-full max-h-[85vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
            <h3 className="font-bold">{isAr ? 'اختيار من الكتالوج' : 'Pick from Catalog'}</h3>
            <button type="button" onClick={() => setPickerOpen(false)} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto">
            <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} placeholder={isAr ? 'بحث' : 'Search'} />
            {filteredPicker.length === 0 ? <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا سجلات' : 'No records found'}</p> : filteredPicker.slice(0, 40).map((p) => {
              const on = productIds.includes(p.id);
              return (
                <div key={p.id} className="flex items-center gap-2 border rounded-xl px-2 py-2" style={{ borderColor: 'var(--border)' }}>
                  <div className="min-w-0 flex-1 text-xs font-bold truncate">{isAr ? p.nameAr || p.name : p.nameEn || p.name}</div>
                  <button
                    type="button"
                    disabled={!on && productIds.length >= CATEGORY_SHOWCASE_MAX_PRODUCTS}
                    className="unity-btn-primary px-2 py-1 rounded-lg text-[11px] font-bold disabled:opacity-40"
                    onClick={() => {
                      const next = on ? productIds.filter((id) => id !== p.id) : [...productIds, p.id].slice(0, CATEGORY_SHOWCASE_MAX_PRODUCTS);
                      patch({ productIds: next, productSource: 'selected', enabled: true });
                    }}
                  >
                    {on ? (isAr ? 'إزالة' : 'Remove') : isAr ? 'إضافة' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </GlobalModal>

      <GlobalModal isOpen={!!editing} onClose={() => setEditBannerId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل البانر' : 'Edit banner'} contentClassName="max-w-xl">
        {editing ? (
          <div className="rounded-2xl border shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل البانر' : 'Edit Banner'}</h3>
              <button type="button" onClick={() => setEditBannerId(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto text-xs">
              <MediaUploadField label={isAr ? 'صورة البانر' : 'Banner image'} value={editing.image} onChange={(url) => patchBanner(editing.id, { image: url })} aspectRatio="banner" initialFolder="banners" recommendedSize="1200 × 400 px" />
              <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={100} placeholder={isAr ? 'العنوان' : 'Title'} value={isAr ? editing.titleAr : editing.titleEn} onChange={(e) => patchBanner(editing.id, isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })} />
              <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={200} placeholder={isAr ? 'الوصف' : 'Description'} value={isAr ? editing.descriptionAr : editing.descriptionEn} onChange={(e) => patchBanner(editing.id, isAr ? { descriptionAr: e.target.value } : { descriptionEn: e.target.value })} />
              <input className={inputCls} style={inputStyle} dir="ltr" placeholder={isAr ? 'الرابط' : 'Link'} value={editing.link} onChange={(e) => patchBanner(editing.id, { link: e.target.value })} />
              <select className={inputCls} style={inputStyle} value={editing.overlay || 'dark'} onChange={(e) => patchBanner(editing.id, { overlay: e.target.value as CategoryShowcaseBanner['overlay'] })}>
                <option value="none">{isAr ? 'بدون طبقة' : 'No overlay'}</option>
                <option value="dark">{isAr ? 'داكن' : 'Dark'}</option>
                <option value="light">{isAr ? 'فاتح' : 'Light'}</option>
              </select>
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setEditBannerId(null)}>{isAr ? 'تم' : 'Done'}</button>
            </div>
          </div>
        ) : null}
      </GlobalModal>
    </>
  );
};

export { resolveShowcaseProductIds };
