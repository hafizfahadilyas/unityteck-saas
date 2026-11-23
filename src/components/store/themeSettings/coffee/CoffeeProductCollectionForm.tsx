import React, { useMemo, useState } from 'react';
import {
  Copy,
  CreditCard,
  GripVertical,
  Headphones,
  Layers,
  MessageCircle,
  Palette,
  Pencil,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { MediaUploadField } from '../../../common/MediaUploadField';
import { GlobalModal } from '../../../common/GlobalModal';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import {
  bi,
  type ProductCollectionBenefit,
  type ProductCollectionLayout,
  type ProductCollectionPromoLayout,
  type ProductCollectionSettings,
  type ProductSliderItem,
  type ProductSliderSource,
} from '../../../../themes/settings/coffeeModularSettings';
import { CoffeeProductCollectionSection } from '../../../../themes/coffeeRoasters/components/CoffeeProductCollectionSection';
import { useCart } from '../../../../themes/coffeeRoasters/context/CartContext';
import {
  duplicateProductSliderItem,
  reorderProductSliderItems,
} from '../../../../themes/coffeeRoasters/components/coffeeProductSliderLogic';
import {
  PRODUCT_COLLECTION_MAX_BENEFITS,
  PRODUCT_COLLECTION_MAX_ITEMS,
  blankProductCollectionBenefit,
  blankProductCollectionItem,
  collectionHasVisibleContent,
  duplicateProductCollectionBenefit,
  productCollectionShowsOnDevice,
  reorderProductCollectionBenefits,
  type CollectionCatalogProduct,
  type ProductCollectionDevice,
} from '../../../../themes/coffeeRoasters/components/coffeeProductCollectionLogic';
import { normalizeProductSource } from '../../../../themes/coffeeRoasters/components/coffeeProductSourceLogic';
import { CoffeeProductSourceControl } from './CoffeeProductSourceControl';

type Tab = 'content' | 'style' | 'layout' | 'advanced';
const TABS: { id: Tab; en: string; ar: string }[] = [
  { id: 'content', en: 'Content', ar: 'المحتوى' },
  { id: 'style', en: 'Style', ar: 'النمط' },
  { id: 'layout', en: 'Layout', ar: 'التخطيط' },
  { id: 'advanced', en: 'Advanced', ar: 'متقدم' },
];

const ICONS = [
  { name: 'Star', Icon: Star },
  { name: 'ShieldCheck', Icon: ShieldCheck },
  { name: 'Truck', Icon: Truck },
  { name: 'CreditCard', Icon: CreditCard },
  { name: 'Palette', Icon: Palette },
  { name: 'MessageCircle', Icon: MessageCircle },
  { name: 'Wrench', Icon: Wrench },
  { name: 'Headphones', Icon: Headphones },
  { name: 'Layers', Icon: Layers },
  { name: 'Zap', Icon: Zap },
  { name: 'ShoppingBag', Icon: ShoppingBag },
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

function mapDevice(d: PreviewDevice): ProductCollectionDevice {
  if (d === 'mobile') return 'mobile';
  if (d === 'tablet') return 'tablet';
  return 'desktop';
}

export const CoffeeProductCollectionForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('productCollection');
  const { products } = useCart();
  const [tab, setTab] = useState<Tab>('content');
  const [editId, setEditId] = useState<string | null>(null);
  const [benEditId, setBenEditId] = useState<string | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [benDrag, setBenDrag] = useState<number | null>(null);
  const items = draft?.items || [];
  const benefits = draft?.benefits || [];
  const editing = items.find((it) => it.id === editId) || null;
  const editingBen = benefits.find((b) => b.id === benEditId) || null;
  const lang = isAr ? 'ar' : 'en';

  const catalog: CollectionCatalogProduct[] = useMemo(
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
        isFeatured: Boolean((p as { isFeatured?: boolean }).isFeatured || (p as { featured?: boolean }).featured),
        salesCount: Number((p as { salesCount?: number }).salesCount || (p as { soldCount?: number }).soldCount || 0),
      })),
    [products],
  );

  const patch = (p: Partial<ProductCollectionSettings>) => setDraft({ ...draft, ...p });
  const setItems = (next: ProductSliderItem[]) => patch({ items: next });
  const patchItem = (id: string, p: Partial<ProductSliderItem>) =>
    setItems(items.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const setBenefits = (next: ProductCollectionBenefit[]) => patch({ benefits: next });
  const patchBenefit = (id: string, p: Partial<ProductCollectionBenefit>) =>
    setBenefits(benefits.map((b) => (b.id === id ? { ...b, ...p } : b)));
  const patchPromo = (p: Partial<NonNullable<ProductCollectionSettings['promo']>>) =>
    patch({ promo: { ...draft.promo, ...p } });

  const preview = (device: PreviewDevice) => {
    const d = mapDevice(device);
    if (!draft?.enabled) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'القسم مخفي' : 'Section hidden'}</div>;
    }
    if (!productCollectionShowsOnDevice(draft, d)) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'مخفي على هذا الجهاز' : 'Hidden on this device'}</div>;
    }
    if (!collectionHasVisibleContent(draft, catalog)) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'لا منتجات — بانتظار البيانات' : 'No products — Waiting for Data'}</div>;
    }
    return <CoffeeProductCollectionSection settings={draft} catalog={catalog} lang={lang} device={d} />;
  };

  const addFromCatalog = (p: CollectionCatalogProduct) => {
    if (items.length >= PRODUCT_COLLECTION_MAX_ITEMS) return;
    if (items.some((it) => it.productId === p.id)) return;
    const img =
      p.colors?.[0]?.image || p.images?.[0] || p.galleryUrls?.[0] || p.imageUrl || p.image || '';
    const row = blankProductCollectionItem({
      productId: p.id,
      nameEn: p.nameEn || p.name || '',
      nameAr: p.nameAr || '',
      image: img,
      price: p.discountedPrice ?? p.basePrice ?? p.price ?? null,
      originalPrice: p.originalPrice ?? null,
    });
    const next = [...items, row];
    setItems(next);
    patch({ enabled: true, sourceType: 'manual', items: next });
  };

  return (
    <>
      <CoffeeWordSettingsShell
        isAr={isAr}
        onBack={onBack}
        embedded={embedded}
        titleEn="Product Collection"
        titleAr="مجموعة المنتجات"
        subtitleEn="Promo card + products + benefit boxes. Separate from Product Slider / Carousel Banner."
        subtitleAr="بطاقة ترويجية + منتجات + صناديق مزايا. منفصلة عن شريط المنتجات وبانر الكاروسيل."
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
                    data-product-collection-tab={t.id}
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
                <section className={cardCls} style={cardStyle} data-product-collection-panel="content">
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
                  <label className="block space-y-1 text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'نمط القسم' : 'Section style'}</span>
                    <select className={inputCls} style={inputStyle} value={draft?.sectionStyle || 'promo_slider_benefits'} onChange={(e) => patch({ sectionStyle: e.target.value as ProductCollectionLayout })}>
                      <option value="promo_slider">{isAr ? 'ترويج + شريط' : 'Promo + Product Slider'}</option>
                      <option value="products_only">{isAr ? 'منتجات فقط' : 'Products Only'}</option>
                      <option value="promo_products">{isAr ? 'ترويج + منتجات' : 'Promo + Products'}</option>
                      <option value="promo_slider_benefits">{isAr ? 'ترويج + شريط + مزايا' : 'Promo + Slider + Benefits'}</option>
                    </select>
                  </label>
                </section>

                <section className={cardCls} style={cardStyle} data-product-collection-panel="promo">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{isAr ? 'بطاقة الترويج' : 'Promo Card'}</h3>
                    <button type="button" className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold" onClick={() => setPromoOpen(true)}>
                      {isAr ? 'تعديل الترويج' : 'Edit Promo Card'}
                    </button>
                  </div>
                  <Toggle on={draft?.showPromoCard !== false} onChange={(v) => patch({ showPromoCard: v })} label={isAr ? 'إظهار بطاقة الترويج' : 'Show Promo Card'} />
                  <label className="block space-y-1 text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'موضع الترويج' : 'Promo layout'}</span>
                    <select className={inputCls} style={inputStyle} value={draft?.promoLayout || 'vertical-left'} onChange={(e) => patch({ promoLayout: e.target.value as ProductCollectionPromoLayout })}>
                      <option value="vertical-left">{isAr ? 'عمودي يسار' : 'Vertical (Left)'}</option>
                      <option value="vertical-right">{isAr ? 'عمودي يمين' : 'Vertical (Right)'}</option>
                      <option value="horizontal-top">{isAr ? 'أفقي أعلى' : 'Horizontal (Top)'}</option>
                      <option value="horizontal-bottom">{isAr ? 'أفقي أسفل' : 'Horizontal (Bottom)'}</option>
                    </select>
                  </label>
                </section>

                <section className={cardCls} style={cardStyle} data-product-collection-panel="source">
                  <h3 className="text-sm font-bold">{isAr ? 'مصدر المنتجات' : 'Product Source'}</h3>
                  <CoffeeProductSourceControl
                    isAr={isAr}
                    catalog={catalog}
                    maxCount={PRODUCT_COLLECTION_MAX_ITEMS}
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
                  <section className={cardCls} style={cardStyle} data-product-collection-panel="items">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold">{isAr ? `المنتجات (${items.length}/${PRODUCT_COLLECTION_MAX_ITEMS})` : `Products (${items.length}/${PRODUCT_COLLECTION_MAX_ITEMS})`}</h3>
                      <div className="flex gap-1.5">
                        <button type="button" className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold" onClick={() => setPickOpen(true)}>
                          {isAr ? 'إدارة المنتجات' : 'Manage Products'}
                        </button>
                        <button
                          type="button"
                          disabled={items.length >= PRODUCT_COLLECTION_MAX_ITEMS}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border disabled:opacity-40"
                          style={{ borderColor: 'var(--border)' }}
                          onClick={() => {
                            const row = blankProductCollectionItem();
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
                            <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setEditId(it.id)}><Pencil className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} disabled={items.length >= PRODUCT_COLLECTION_MAX_ITEMS} onClick={() => setItems([...items.slice(0, index + 1), duplicateProductSliderItem(it), ...items.slice(index + 1)].slice(0, PRODUCT_COLLECTION_MAX_ITEMS))}><Copy className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 rounded-lg border border-rose-200 text-rose-500" onClick={() => { setItems(items.filter((x) => x.id !== it.id)); if (editId === it.id) setEditId(null); }}><Trash2 className="w-3.5 h-3.5" /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ) : null}

                <section className={cardCls} style={cardStyle} data-product-collection-panel="benefits">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{isAr ? `صناديق المزايا (${benefits.length}/${PRODUCT_COLLECTION_MAX_BENEFITS})` : `Benefit Boxes (${benefits.length}/${PRODUCT_COLLECTION_MAX_BENEFITS})`}</h3>
                    <button
                      type="button"
                      disabled={benefits.length >= PRODUCT_COLLECTION_MAX_BENEFITS}
                      className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40"
                      onClick={() => {
                        const row = blankProductCollectionBenefit();
                        setBenefits([...benefits, row]);
                        setBenEditId(row.id);
                        patch({ showBenefitBoxes: true, enabled: true });
                      }}
                    >
                      + {isAr ? 'ميزة' : 'Benefit'}
                    </button>
                  </div>
                  <Toggle on={draft?.showBenefitBoxes !== false} onChange={(v) => patch({ showBenefitBoxes: v })} label={isAr ? 'إظهار صناديق المزايا' : 'Show Benefit Boxes'} />
                  {!benefits.length ? (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا مزايا بعد.' : 'No benefits yet.'}</p>
                  ) : (
                    <ul className="space-y-2">
                      {benefits.map((b, index) => (
                        <li
                          key={b.id}
                          draggable
                          onDragStart={() => setBenDrag(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (benDrag !== null) setBenefits(reorderProductCollectionBenefits(benefits, benDrag, index));
                            setBenDrag(null);
                          }}
                          className="flex items-center gap-2 rounded-xl border px-2 py-2"
                          style={{ borderColor: 'var(--border)', opacity: b.enabled === false ? 0.45 : 1 }}
                        >
                          <GripVertical className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                          <div className="min-w-0 flex-1 text-xs font-bold truncate">{bi(lang, b.titleEn, b.titleAr) || (isAr ? 'بدون عنوان' : 'Untitled')}</div>
                          <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setBenEditId(b.id)}><Pencil className="w-3.5 h-3.5" /></button>
                          <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setBenefits([...benefits.slice(0, index + 1), duplicateProductCollectionBenefit(b), ...benefits.slice(index + 1)].slice(0, PRODUCT_COLLECTION_MAX_BENEFITS))}><Copy className="w-3.5 h-3.5" /></button>
                          <button type="button" className="p-1.5 rounded-lg border border-rose-200 text-rose-500" onClick={() => { setBenefits(benefits.filter((x) => x.id !== b.id)); if (benEditId === b.id) setBenEditId(null); }}><Trash2 className="w-3.5 h-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            ) : null}

            {tab === 'style' ? (
              <section className={cardCls} style={cardStyle} data-product-collection-panel="style">
                <Toggle on={draft?.showArrows !== false} onChange={(v) => patch({ showArrows: v })} label={isAr ? 'إظهار الأسهم' : 'Show Arrows'} />
                <Toggle on={!!draft?.showDots} onChange={(v) => patch({ showDots: v })} label={isAr ? 'إظهار النقاط' : 'Show Dots'} />
                <Toggle on={!!draft?.autoplay} onChange={(v) => patch({ autoplay: v })} label={isAr ? 'تشغيل تلقائي' : 'Autoplay'} />
                <Toggle on={draft?.showPrice !== false} onChange={(v) => patch({ showPrice: v })} label={isAr ? 'إظهار السعر' : 'Show Price'} />
                <Toggle on={draft?.showBuyNow !== false} onChange={(v) => patch({ showBuyNow: v })} label={isAr ? 'إظهار الشراء' : 'Show Buy'} />
                <Toggle on={draft?.showAddToCart !== false} onChange={(v) => patch({ showAddToCart: v })} label={isAr ? 'إظهار السلة' : 'Show Cart'} />
                <Toggle on={draft?.showLearnMore !== false} onChange={(v) => patch({ showLearnMore: v })} label={isAr ? 'إظهار المزيد' : 'Show Learn More'} />
              </section>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-product-collection-panel="layout">
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'عناصر (سطح المكتب)' : 'Items (Desktop)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.itemsPerViewDesktop ?? 3} onChange={(e) => patch({ itemsPerViewDesktop: Number(e.target.value) })}>
                    {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'عناصر (لوحي)' : 'Items (Tablet)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.itemsPerViewTablet ?? 2} onChange={(e) => patch({ itemsPerViewTablet: Number(e.target.value) })}>
                    {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'عناصر (جوال)' : 'Items (Mobile)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.itemsPerViewMobile ?? 1} onChange={(e) => patch({ itemsPerViewMobile: Number(e.target.value) })}>
                    {[1, 2].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'تخطيط المزايا' : 'Benefits layout'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.benefitsLayout || 'row4'} onChange={(e) => patch({ benefitsLayout: e.target.value as ProductCollectionSettings['benefitsLayout'] })}>
                    <option value="row4">{isAr ? '٤ في صف' : '4 Boxes (Row)'}</option>
                    <option value="grid2">{isAr ? 'شبكتان' : '2 Boxes (Grid)'}</option>
                    <option value="scroll">{isAr ? 'تمرير أفقي' : 'Horizontal Scroll'}</option>
                    <option value="stack">{isAr ? 'عمودي' : 'Vertical Stack'}</option>
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'حشوة القسم' : 'Section padding'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.sectionPaddingY ?? 48} onChange={(e) => patch({ sectionPaddingY: Number(e.target.value) })}>
                    {[24, 32, 48, 64, 80].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </section>
            ) : null}

            {tab === 'advanced' ? (
              <section className={cardCls} style={cardStyle} data-product-collection-panel="advanced">
                <Toggle on={draft?.showOnDesktop !== false} onChange={(v) => patch({ showOnDesktop: v })} label={isAr ? 'إظهار على سطح المكتب' : 'Show on Desktop'} />
                <Toggle on={draft?.showOnTablet !== false} onChange={(v) => patch({ showOnTablet: v })} label={isAr ? 'إظهار على اللوحي' : 'Show on Tablet'} />
                <Toggle on={draft?.showOnMobile !== false} onChange={(v) => patch({ showOnMobile: v })} label={isAr ? 'إظهار على الجوال' : 'Show on Mobile'} />
              </section>
            ) : null}
          </>
        }
      />

      <GlobalModal isOpen={promoOpen} onClose={() => setPromoOpen(false)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل الترويج' : 'Edit promo'} contentClassName="max-w-lg">
        <div className="rounded-2xl border shadow-2xl overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} data-product-collection-promo-edit>
          <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
            <h3 className="font-bold">{isAr ? 'تعديل بطاقة الترويج' : 'Edit Promo Card'}</h3>
            <button type="button" onClick={() => setPromoOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-3 text-xs">
            <Toggle on={draft?.promo?.enabled !== false} onChange={(v) => patchPromo({ enabled: v })} label={isAr ? 'تفعيل' : 'Enabled'} />
            <MediaUploadField label={isAr ? 'صورة الترويج' : 'Promo image'} value={draft?.promo?.image || ''} onChange={(url) => patchPromo({ image: url })} aspectRatio="banner" initialFolder="banners" />
            <input className={inputCls} style={inputStyle} dir="ltr" value={draft?.promo?.badgeEn || ''} onChange={(e) => patchPromo({ badgeEn: e.target.value })} placeholder="Badge EN" />
            <input className={inputCls} style={inputStyle} dir="rtl" value={draft?.promo?.badgeAr || ''} onChange={(e) => patchPromo({ badgeAr: e.target.value })} placeholder="الشارة عربي" />
            <input className={inputCls} style={inputStyle} dir="ltr" value={draft?.promo?.titleEn || ''} onChange={(e) => patchPromo({ titleEn: e.target.value })} placeholder="Title EN" />
            <input className={inputCls} style={inputStyle} dir="rtl" value={draft?.promo?.titleAr || ''} onChange={(e) => patchPromo({ titleAr: e.target.value })} placeholder="العنوان عربي" />
            <input className={inputCls} style={inputStyle} dir="ltr" value={draft?.promo?.buttonEn || ''} onChange={(e) => patchPromo({ buttonEn: e.target.value })} placeholder="Button EN" />
            <input className={inputCls} style={inputStyle} dir="rtl" value={draft?.promo?.buttonAr || ''} onChange={(e) => patchPromo({ buttonAr: e.target.value })} placeholder="الزر عربي" />
            <input className={inputCls} style={inputStyle} dir="ltr" value={draft?.promo?.buttonUrl || ''} onChange={(e) => patchPromo({ buttonUrl: e.target.value })} placeholder="https://..." />
            <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setPromoOpen(false)}>{isAr ? 'تم' : 'Done'}</button>
          </div>
        </div>
      </GlobalModal>

      <GlobalModal isOpen={!!editing} onClose={() => setEditId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل المنتج' : 'Edit product'} contentClassName="max-w-lg">
        {editing ? (
          <div className="rounded-2xl border shadow-2xl overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} data-product-collection-edit>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل المنتج' : 'Edit Product'}</h3>
              <button type="button" onClick={() => setEditId(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <Toggle on={editing.enabled !== false} onChange={(v) => patchItem(editing.id, { enabled: v })} label={isAr ? 'تفعيل' : 'Enabled'} />
              <MediaUploadField label={isAr ? 'صورة المنتج' : 'Product image'} value={editing.image || ''} onChange={(url) => patchItem(editing.id, { image: url })} aspectRatio="square" initialFolder="products" />
              <input className={inputCls} style={inputStyle} dir="ltr" value={editing.nameEn} onChange={(e) => patchItem(editing.id, { nameEn: e.target.value })} placeholder="Name EN" />
              <input className={inputCls} style={inputStyle} dir="rtl" value={editing.nameAr} onChange={(e) => patchItem(editing.id, { nameAr: e.target.value })} placeholder="الاسم عربي" />
              <input className={inputCls} style={inputStyle} dir="ltr" value={editing.productId} onChange={(e) => patchItem(editing.id, { productId: e.target.value })} placeholder="Product ID" />
              <input className={inputCls} style={inputStyle} type="number" value={editing.price ?? ''} onChange={(e) => patchItem(editing.id, { price: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Price" />
              <Toggle on={editing.showBuyNow !== false} onChange={(v) => patchItem(editing.id, { showBuyNow: v })} label={isAr ? 'زر الشراء' : 'Buy button'} />
              <Toggle on={editing.showAddToCart !== false} onChange={(v) => patchItem(editing.id, { showAddToCart: v })} label={isAr ? 'زر السلة' : 'Cart button'} />
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setEditId(null)}>{isAr ? 'تم' : 'Done'}</button>
            </div>
          </div>
        ) : null}
      </GlobalModal>

      <GlobalModal isOpen={!!editingBen} onClose={() => setBenEditId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل الميزة' : 'Edit benefit'} contentClassName="max-w-md">
        {editingBen ? (
          <div className="rounded-2xl border shadow-2xl overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} data-product-collection-benefit-edit>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل صندوق الميزة' : 'Edit Benefit Box'}</h3>
              <button type="button" onClick={() => setBenEditId(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <Toggle on={editingBen.enabled !== false} onChange={(v) => patchBenefit(editingBen.id, { enabled: v })} label={isAr ? 'تفعيل' : 'Enabled'} />
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map(({ name, Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => patchBenefit(editingBen.id, { icon: name })}
                    className="w-9 h-9 rounded-lg border flex items-center justify-center"
                    style={{
                      borderColor: editingBen.icon === name ? 'var(--portal-cta)' : 'var(--border)',
                      background: editingBen.icon === name ? 'var(--portal-cta)' : 'var(--surface)',
                      color: editingBen.icon === name ? '#fff' : 'var(--text)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <input className={inputCls} style={inputStyle} dir="ltr" value={editingBen.titleEn} onChange={(e) => patchBenefit(editingBen.id, { titleEn: e.target.value })} placeholder="Title EN" />
              <input className={inputCls} style={inputStyle} dir="rtl" value={editingBen.titleAr} onChange={(e) => patchBenefit(editingBen.id, { titleAr: e.target.value })} placeholder="العنوان عربي" />
              <textarea className={inputCls} style={inputStyle} dir="ltr" rows={2} value={editingBen.descriptionEn} onChange={(e) => patchBenefit(editingBen.id, { descriptionEn: e.target.value })} placeholder="Description EN" />
              <textarea className={inputCls} style={inputStyle} dir="rtl" rows={2} value={editingBen.descriptionAr} onChange={(e) => patchBenefit(editingBen.id, { descriptionAr: e.target.value })} placeholder="الوصف عربي" />
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setBenEditId(null)}>{isAr ? 'حفظ' : 'Save'}</button>
            </div>
          </div>
        ) : null}
      </GlobalModal>

      <GlobalModal isOpen={pickOpen} onClose={() => setPickOpen(false)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'اختيار منتجات' : 'Pick products'} contentClassName="max-w-lg">
        <div className="rounded-2xl border shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
            <h3 className="font-bold">{isAr ? 'اختيار من الكتالوج' : 'Pick from catalog'}</h3>
            <button type="button" onClick={() => setPickOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 overflow-y-auto space-y-2 text-xs">
            {!catalog.length ? (
              <p style={{ color: 'var(--muted)' }}>{isAr ? 'لا منتجات في الكتالوج' : 'No catalog products'}</p>
            ) : (
              catalog.map((p) => {
                const selected = items.some((it) => it.productId === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={selected || items.length >= PRODUCT_COLLECTION_MAX_ITEMS}
                    className="w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-start disabled:opacity-40"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => addFromCatalog(p)}
                  >
                    <span className="font-bold truncate flex-1">{isAr ? (p.nameAr || p.name || p.id) : (p.nameEn || p.name || p.id)}</span>
                    <span>{selected ? (isAr ? 'مضاف' : 'Added') : '+'}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </GlobalModal>
    </>
  );
};
