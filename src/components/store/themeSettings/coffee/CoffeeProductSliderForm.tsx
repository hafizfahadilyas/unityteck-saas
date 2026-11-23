import React, { useMemo, useState } from 'react';
import { Copy, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { MediaUploadField } from '../../../common/MediaUploadField';
import { GlobalModal } from '../../../common/GlobalModal';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import {
  bi,
  type ProductSliderItem,
  type ProductSliderSettings,
  type ProductSliderSource,
} from '../../../../themes/settings/coffeeModularSettings';
import { CoffeeProductSliderSection } from '../../../../themes/coffeeRoasters/components/CoffeeProductSliderSection';
import { useCart } from '../../../../themes/coffeeRoasters/context/CartContext';
import {
  PRODUCT_SLIDER_MAX_ITEMS,
  blankProductSliderItem,
  catalogProductImage,
  duplicateProductSliderItem,
  productSliderShowsOnDevice,
  reorderProductSliderItems,
  resolveProductSliderCards,
  type ProductSliderDevice,
  type SliderCatalogProduct,
} from '../../../../themes/coffeeRoasters/components/coffeeProductSliderLogic';
import { normalizeProductSource } from '../../../../themes/coffeeRoasters/components/coffeeProductSourceLogic';
import { CoffeeProductSourceControl } from './CoffeeProductSourceControl';

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

function mapDevice(d: PreviewDevice): ProductSliderDevice {
  if (d === 'mobile') return 'mobile';
  if (d === 'tablet') return 'tablet';
  return 'desktop';
}

export const CoffeeProductSliderForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('productSlider');
  const { products } = useCart();
  const [tab, setTab] = useState<Tab>('content');
  const [editId, setEditId] = useState<string | null>(null);
  const [pickOpen, setPickOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const items = draft?.items || [];
  const editing = items.find((it) => it.id === editId) || null;
  const lang = isAr ? 'ar' : 'en';

  const catalog: SliderCatalogProduct[] = useMemo(
    () =>
      (products || []).map((p) => ({
        id: p.id,
        name: p.name,
        nameEn: p.name,
        nameAr: p.nameAr,
        category: String(p.category || ''),
        brand: String((p as { brand?: string }).brand || ''),
        basePrice: p.basePrice,
        price: p.basePrice,
        originalPrice: p.originalPrice ?? null,
        image: p.image,
        images: p.images,
        colors: p.colors,
        tagline: p.tagline,
        taglineAr: p.taglineAr,
        overview: p.overview,
        overviewAr: p.overviewAr,
        isFeatured: Boolean((p as { isFeatured?: boolean }).isFeatured || (p as { featured?: boolean }).featured),
        salesCount: Number((p as { salesCount?: number }).salesCount || (p as { soldCount?: number }).soldCount || 0),
      })),
    [products],
  );

  const patch = (p: Partial<ProductSliderSettings>) => setDraft({ ...draft, ...p });
  const setItems = (next: ProductSliderItem[]) => patch({ items: next });
  const patchItem = (id: string, p: Partial<ProductSliderItem>) =>
    setItems(items.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const previewCards = resolveProductSliderCards(draft, catalog);

  const preview = (device: PreviewDevice) => {
    const d = mapDevice(device);
    if (!draft?.enabled) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'القسم مخفي' : 'Section hidden'}</div>;
    }
    if (!productSliderShowsOnDevice(draft, d)) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'مخفي على هذا الجهاز' : 'Hidden on this device'}</div>;
    }
    if (!previewCards.length) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'لا منتجات — بانتظار البيانات' : 'No products — Waiting for Data'}</div>;
    }
    return <CoffeeProductSliderSection settings={draft} catalog={catalog} lang={lang} device={d} />;
  };

  const addFromCatalog = (p: SliderCatalogProduct) => {
    if (items.length >= PRODUCT_SLIDER_MAX_ITEMS) return;
    if (items.some((it) => it.productId === p.id)) return;
    const row = blankProductSliderItem({
      productId: p.id,
      nameEn: p.nameEn || p.name || '',
      nameAr: p.nameAr || '',
      descriptionEn: p.tagline || '',
      descriptionAr: p.taglineAr || '',
      image: catalogProductImage(p),
      price: p.discountedPrice ?? p.basePrice ?? p.price ?? null,
      originalPrice: p.originalPrice ?? null,
    });
    setItems([...items, row]);
    patch({ enabled: true, sourceType: 'manual', items: [...items, row] });
  };

  return (
    <>
      <CoffeeWordSettingsShell
        isAr={isAr}
        onBack={onBack}
        embedded={embedded}
        titleEn="Product Slider"
        titleAr="شريط المنتجات"
        subtitleEn="Horizontal product rail — separate from Product Carousel."
        subtitleAr="سكة منتجات أفقية — منفصلة عن كاروسيل المنتجات."
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
                    data-product-slider-tab={t.id}
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
                <section className={cardCls} style={cardStyle} data-product-slider-panel="content">
                  <Toggle on={!!draft?.enabled} onChange={(v) => patch({ enabled: v })} label={isAr ? 'تفعيل القسم' : 'Enable Section'} />
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

                <section className={cardCls} style={cardStyle} data-product-slider-panel="source">
                  <h3 className="text-sm font-bold">{isAr ? 'مصدر المنتجات' : 'Product Source'}</h3>
                  <CoffeeProductSourceControl
                    isAr={isAr}
                    catalog={catalog}
                    maxCount={PRODUCT_SLIDER_MAX_ITEMS}
                    value={normalizeProductSource({
                      productSource: draft?.productSource,
                      sourceType: draft?.sourceType,
                      categoryId: draft?.categoryId,
                      productCount: draft?.productCount,
                      items: draft?.items,
                    })}
                    onChange={(next) =>
                      patch({
                        productSource: next,
                        sourceType:
                          next.mode === 'selected'
                            ? 'manual'
                            : next.mode === 'category'
                              ? 'category'
                              : next.mode === 'featured'
                                ? 'featured'
                                : next.mode === 'latest'
                                  ? 'latest'
                                  : next.mode === 'best_selling'
                                    ? 'best_selling'
                                    : 'manual',
                        categoryId: next.categoryIds[0] || draft?.categoryId || '',
                        productCount: next.productCount,
                        enabled: true,
                      })
                    }
                  />
                </section>

                {draft?.sourceType === 'manual' || !draft?.sourceType ? (
                  <section className={cardCls} style={cardStyle} data-product-slider-panel="items">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold">{isAr ? `المنتجات (${items.length}/${PRODUCT_SLIDER_MAX_ITEMS})` : `Products (${items.length}/${PRODUCT_SLIDER_MAX_ITEMS})`}</h3>
                      <div className="flex gap-1.5">
                        <button type="button" className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold" onClick={() => setPickOpen(true)}>
                          {isAr ? 'إدارة المنتجات' : 'Manage Products'}
                        </button>
                        <button
                          type="button"
                          disabled={items.length >= PRODUCT_SLIDER_MAX_ITEMS}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border disabled:opacity-40"
                          style={{ borderColor: 'var(--border)' }}
                          onClick={() => {
                            const row = blankProductSliderItem();
                            setItems([...items, row]);
                            setEditId(row.id);
                            patch({ enabled: true, sourceType: 'manual' });
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 inline" /> {isAr ? 'يدوي' : 'Blank'}
                        </button>
                      </div>
                    </div>
                    {!items.length ? (
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا سجلات — بانتظار البيانات' : 'No records found — Waiting for Data'}</p>
                    ) : (
                      <ul className="space-y-2">
                        {items.map((it, index) => (
                          <li
                            key={it.id}
                            draggable
                            onDragStart={() => setDragIndex(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (dragIndex !== null) setItems(reorderProductSliderItems(items, dragIndex, index));
                              setDragIndex(null);
                            }}
                            className="flex items-center gap-2 rounded-xl border px-2 py-2"
                            style={{ borderColor: 'var(--border)', opacity: it.enabled === false ? 0.45 : 1 }}
                          >
                            <GripVertical className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                            <div className="min-w-0 flex-1 text-xs font-bold truncate">{bi(lang, it.nameEn, it.nameAr) || it.productId || (isAr ? 'بدون عنوان' : 'Untitled')}</div>
                            <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setEditId(it.id)} aria-label={isAr ? 'تعديل' : 'Edit'}><Pencil className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} disabled={items.length >= PRODUCT_SLIDER_MAX_ITEMS} onClick={() => setItems([...items.slice(0, index + 1), duplicateProductSliderItem(it), ...items.slice(index + 1)].slice(0, PRODUCT_SLIDER_MAX_ITEMS))} aria-label={isAr ? 'نسخ' : 'Duplicate'}><Copy className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 rounded-lg border border-rose-200 text-rose-500" onClick={() => { setItems(items.filter((x) => x.id !== it.id)); if (editId === it.id) setEditId(null); }} aria-label={isAr ? 'حذف' : 'Delete'}><Trash2 className="w-3.5 h-3.5" /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ) : null}
              </>
            ) : null}

            {tab === 'style' ? (
              <section className={cardCls} style={cardStyle} data-product-slider-panel="style">
                <Toggle on={draft?.showArrows !== false} onChange={(v) => patch({ showArrows: v })} label={isAr ? 'إظهار الأسهم' : 'Show Arrows'} />
                <Toggle on={!!draft?.showDots} onChange={(v) => patch({ showDots: v })} label={isAr ? 'إظهار النقاط' : 'Show Dots'} />
                <Toggle on={!!draft?.autoplay} onChange={(v) => patch({ autoplay: v })} label={isAr ? 'تشغيل تلقائي' : 'Autoplay'} />
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'سرعة الانتقال (ثوانٍ)' : 'Transition speed (sec)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.transitionSec ?? 5} onChange={(e) => patch({ transitionSec: Number(e.target.value) })}>
                    {[3, 4, 5, 6, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <Toggle on={draft?.showPrice !== false} onChange={(v) => patch({ showPrice: v })} label={isAr ? 'إظهار السعر' : 'Show Price'} />
                <Toggle on={draft?.showOriginalPrice !== false} onChange={(v) => patch({ showOriginalPrice: v })} label={isAr ? 'إظهار السعر الأصلي' : 'Show Original Price'} />
                <Toggle on={draft?.showBuyNow !== false} onChange={(v) => patch({ showBuyNow: v })} label={isAr ? 'إظهار اشترِ الآن' : 'Show Buy Now'} />
                <Toggle on={draft?.showAddToCart !== false} onChange={(v) => patch({ showAddToCart: v })} label={isAr ? 'إظهار أضف إلى السلة' : 'Show Add to Cart'} />
                <Toggle on={!!draft?.showProductDescription} onChange={(v) => patch({ showProductDescription: v })} label={isAr ? 'إظهار وصف المنتج' : 'Show Product Description'} />
              </section>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-product-slider-panel="layout">
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'عناصر لكل صف (سطح المكتب)' : 'Items per view (Desktop)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.itemsPerViewDesktop ?? 4} onChange={(e) => patch({ itemsPerViewDesktop: Number(e.target.value) })}>
                    {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'عناصر لكل صف (لوحي)' : 'Items per view (Tablet)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.itemsPerViewTablet ?? 2} onChange={(e) => patch({ itemsPerViewTablet: Number(e.target.value) })}>
                    {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'عناصر لكل صف (جوال)' : 'Items per view (Mobile)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.itemsPerViewMobile ?? 1} onChange={(e) => patch({ itemsPerViewMobile: Number(e.target.value) })}>
                    {[1, 2].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'حشوة القسم' : 'Section padding (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.sectionPaddingY ?? 48} onChange={(e) => patch({ sectionPaddingY: Number(e.target.value) })}>
                    {[24, 32, 48, 64].map((n) => <option key={n} value={n}>{n}</option>)}
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
              <section className={cardCls} style={cardStyle} data-product-slider-panel="advanced">
                <Toggle on={draft?.showOnDesktop !== false} onChange={(v) => patch({ showOnDesktop: v })} label={isAr ? 'إظهار على سطح المكتب' : 'Show on Desktop'} />
                <Toggle on={draft?.showOnTablet !== false} onChange={(v) => patch({ showOnTablet: v })} label={isAr ? 'إظهار على الجهاز اللوحي' : 'Show on Tablet'} />
                <Toggle on={draft?.showOnMobile !== false} onChange={(v) => patch({ showOnMobile: v })} label={isAr ? 'إظهار على الجوال' : 'Show on Mobile'} />
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'كاروسيل المنتجات (C-PC) قسم منفصل — لا تدمجه هنا.' : 'Product Carousel (C-PC) is a separate section — do not merge here.'}
                </p>
              </section>
            ) : null}
          </>
        }
      />

      <GlobalModal isOpen={pickOpen} onClose={() => setPickOpen(false)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'إدارة المنتجات' : 'Manage products'} contentClassName="max-w-xl">
        <div className="rounded-2xl border shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} data-product-slider-picker>
          <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
            <h3 className="font-bold">{isAr ? 'اختيار من الكتالوج' : 'Pick from catalog'}</h3>
            <button type="button" onClick={() => setPickOpen(false)} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto text-xs">
            {!catalog.length ? (
              <p style={{ color: 'var(--muted)' }}>{isAr ? 'لا منتجات في الكتالوج' : 'No products in catalog'}</p>
            ) : (
              catalog.map((p) => {
                const selected = items.some((it) => it.productId === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={selected || items.length >= PRODUCT_SLIDER_MAX_ITEMS}
                    className="w-full text-start rounded-xl border px-3 py-2 disabled:opacity-40"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => addFromCatalog(p)}
                  >
                    <div className="font-bold">{bi(lang, p.nameEn || p.name, p.nameAr) || p.id}</div>
                    <div style={{ color: 'var(--muted)' }}>{selected ? (isAr ? 'محدد' : 'Selected') : p.id}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </GlobalModal>

      <GlobalModal isOpen={!!editing} onClose={() => setEditId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل المنتج' : 'Edit product'} contentClassName="max-w-xl">
        {editing ? (
          <div className="rounded-2xl border shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} data-product-slider-edit>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل المنتج' : 'Edit Product'}</h3>
              <button type="button" onClick={() => setEditId(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto text-xs">
              <Toggle on={editing.enabled !== false} onChange={(v) => patchItem(editing.id, { enabled: v })} label={isAr ? 'إظهار هذا المنتج' : 'Show this product'} />
              <Toggle on={!!editing.featured} onChange={(v) => patchItem(editing.id, { featured: v })} label={isAr ? 'تمييز كمنتج مميز' : 'Mark as Featured'} />
              <MediaUploadField label={isAr ? 'صورة المنتج' : 'Product image'} value={editing.image} onChange={(url) => patchItem(editing.id, { image: url })} aspectRatio="square" initialFolder="products" recommendedSize="800 × 800 px" />
              <label className="block space-y-1 font-semibold"><span>{isAr ? 'معرف المنتج' : 'Product ID'}</span><input className={inputCls} style={inputStyle} dir="ltr" value={editing.productId} onChange={(e) => patchItem(editing.id, { productId: e.target.value })} /></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="block space-y-1 font-semibold"><span>{isAr ? 'العنوان (إنجليزي)' : 'Title (EN)'}</span><input className={inputCls} style={inputStyle} dir="ltr" value={editing.nameEn} onChange={(e) => patchItem(editing.id, { nameEn: e.target.value })} /></label>
                <label className="block space-y-1 font-semibold"><span>{isAr ? 'العنوان (عربي)' : 'Title (AR)'}</span><input className={inputCls} style={inputStyle} dir="rtl" value={editing.nameAr} onChange={(e) => patchItem(editing.id, { nameAr: e.target.value })} /></label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="block space-y-1 font-semibold"><span>{isAr ? 'الوصف (إنجليزي)' : 'Description (EN)'}</span><textarea className={`${inputCls} min-h-[64px]`} style={inputStyle} dir="ltr" value={editing.descriptionEn} onChange={(e) => patchItem(editing.id, { descriptionEn: e.target.value })} /></label>
                <label className="block space-y-1 font-semibold"><span>{isAr ? 'الوصف (عربي)' : 'Description (AR)'}</span><textarea className={`${inputCls} min-h-[64px]`} style={inputStyle} dir="rtl" value={editing.descriptionAr} onChange={(e) => patchItem(editing.id, { descriptionAr: e.target.value })} /></label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block space-y-1 font-semibold"><span>{isAr ? 'السعر' : 'Price (⃁)'}</span><input type="number" className={inputCls} style={inputStyle} value={editing.price ?? ''} onChange={(e) => patchItem(editing.id, { price: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                <label className="block space-y-1 font-semibold"><span>{isAr ? 'السعر الأصلي' : 'Original price'}</span><input type="number" className={inputCls} style={inputStyle} value={editing.originalPrice ?? ''} onChange={(e) => patchItem(editing.id, { originalPrice: e.target.value === '' ? null : Number(e.target.value) })} /></label>
              </div>
              <label className="block space-y-1 font-semibold"><span>{isAr ? 'رابط المنتج' : 'Product link'}</span><input className={inputCls} style={inputStyle} dir="ltr" value={editing.productLink} onChange={(e) => patchItem(editing.id, { productLink: e.target.value })} /></label>
              <Toggle on={editing.showBuyNow !== false} onChange={(v) => patchItem(editing.id, { showBuyNow: v })} label={isAr ? 'زر اشترِ الآن' : 'Buy Now button'} />
              <Toggle on={editing.showAddToCart !== false} onChange={(v) => patchItem(editing.id, { showAddToCart: v })} label={isAr ? 'زر أضف إلى السلة' : 'Add to Cart button'} />
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setEditId(null)}>{isAr ? 'تم' : 'Done'}</button>
            </div>
          </div>
        ) : null}
      </GlobalModal>
    </>
  );
};
