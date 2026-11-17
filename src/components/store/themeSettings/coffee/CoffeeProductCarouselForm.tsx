import React, { useMemo, useState } from 'react';
import { Copy, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { MediaUploadField } from '../../../common/MediaUploadField';
import { GlobalModal } from '../../../common/GlobalModal';
import { useTenant } from '../../../../context/TenantContext';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import { bi, type ProductCarouselItem, type ProductCarouselSettings } from '../../../../themes/settings/coffeeModularSettings';
import {
  PRODUCT_CAROUSEL_MAX_ITEMS,
  blankCarouselItem,
  cardWidthForDevice,
  catalogProductImage,
  duplicateCarouselItem,
  itemDisplayImage,
  itemDisplayName,
  reorderCarouselItems,
  resolveCarouselCards,
} from '../../../../themes/coffeeRoasters/components/coffeeProductCarouselLogic';

type SidebarTab = 'content' | 'templates' | 'style' | 'layout' | 'code' | 'ai';

const TABS: { id: SidebarTab; en: string; ar: string }[] = [
  { id: 'content', en: 'Content', ar: 'المحتوى' },
  { id: 'templates', en: 'Templates', ar: 'القوالب' },
  { id: 'style', en: 'Style', ar: 'النمط' },
  { id: 'layout', en: 'Layout', ar: 'التخطيط' },
  { id: 'code', en: 'Code', ar: 'الرمز' },
  { id: 'ai', en: 'AI', ar: 'الذكاء الاصطناعي' },
];

const inputCls =
  'w-full px-3 py-2 rounded-lg border bg-white text-xs outline-none focus:border-[var(--accent)]';
const cardCls = 'rounded-2xl border p-4 shadow-sm space-y-3';
const cardStyle: React.CSSProperties = {
  borderColor: 'var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
};
const inputStyle: React.CSSProperties = { borderColor: 'var(--border)', color: 'var(--text)' };

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
      {(value || '').length}/{max}
    </span>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-semibold" style={{ color: 'var(--text)' }}>
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className="w-11 h-6 rounded-full p-0.5 transition-colors"
        style={{ background: on ? 'var(--portal-cta)' : 'var(--border)' }}
        aria-pressed={on}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
            on ? 'translate-x-5 rtl:-translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}

function SegmentNum({
  value,
  options,
  isAr,
  onChange,
  singularEn,
  singularAr,
  pluralEn,
  pluralAr,
}: {
  value: number;
  options: number[];
  isAr: boolean;
  onChange: (n: number) => void;
  singularEn: string;
  singularAr: string;
  pluralEn: string;
  pluralAr: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((n) => {
        const active = value === n;
        const word = n === 1 ? (isAr ? singularAr : singularEn) : isAr ? pluralAr : pluralEn;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border"
            style={
              active
                ? { background: 'var(--portal-cta)', color: '#fff', borderColor: 'var(--portal-cta)' }
                : { background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' }
            }
          >
            {n} {word}
          </button>
        );
      })}
    </div>
  );
}

function fromCatalogProduct(p: {
  id: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  price?: number;
  originalPrice?: number | null;
  discountedPrice?: number | null;
  image?: string;
  imageUrl?: string | null;
  images?: string[];
  galleryUrls?: string[];
  colors?: { image?: string; hex?: string; name?: string; nameAr?: string }[];
  stock?: number;
}): ProductCarouselItem {
  return blankCarouselItem({
    productId: p.id,
    nameEn: p.nameEn || p.name || '',
    nameAr: p.nameAr || '',
    imageUrl: catalogProductImage(p),
    gallery: [...(p.galleryUrls || p.images || []).filter(Boolean)].slice(0, 8),
    originalPrice: p.originalPrice ?? p.price ?? null,
    discountedPrice: p.discountedPrice ?? null,
    colors: (p.colors || [])
      .filter((c) => c.hex || c.name)
      .slice(0, 8)
      .map((c, i) => ({
        id: `c-${p.id}-${i}`,
        labelEn: c.name || '',
        labelAr: c.nameAr || c.name || '',
        hex: c.hex || '#CCCCCC',
      })),
  });
}

export const ProductCarouselForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('productCarousel');
  const { currentProducts } = useTenant();
  const [tab, setTab] = useState<SidebarTab>('content');
  const [editId, setEditId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const items = draft?.items || [];
  const editing = items.find((f) => f.id === editId) || null;
  const lang = isAr ? 'ar' : 'en';

  const catalog = useMemo(
    () =>
      (currentProducts || []).map((p) => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        category: p.category,
        stock: p.stock,
        price: p.price,
        originalPrice: p.originalPrice,
        discountedPrice: p.discountedPrice,
        image: p.image,
        imageUrl: p.imageUrl,
        images: p.images,
        galleryUrls: p.galleryUrls,
        colors: p.colors,
      })),
    [currentProducts],
  );

  const patchSection = (p: Partial<ProductCarouselSettings>) => setDraft({ ...draft, ...p });
  const setItems = (next: ProductCarouselItem[]) => setDraft({ ...draft, items: next });
  const patchItem = (id: string, p: Partial<ProductCarouselItem>) =>
    setItems(items.map((row) => (row.id === id ? { ...row, ...p } : row)));

  const previewCards = resolveCarouselCards(draft, catalog).cards;

  const preview = (device: PreviewDevice) => {
    if (!draft?.enabled) {
      return (
        <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>
          {isAr ? 'القسم مخفي في المتجر' : 'Section is hidden on the storefront'}
        </div>
      );
    }
    if (previewCards.length === 0) {
      return (
        <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>
          {isAr ? 'لا منتجات — القسم يختفي في المتجر' : 'No products — section hides on the storefront'}
        </div>
      );
    }
    const width = cardWidthForDevice(draft, device);
    const radius = draft?.cardStyle === 'square' ? 0 : draft?.cardBorderRadius ?? 16;
    const pad = draft?.cardPadding ?? 16;
    const gap = draft?.itemSpacing ?? 16;
    const bg = draft?.cardBgColor || '#FFFFFF';
    return (
      <div className="p-3 space-y-2">
        {(draft.titleEn || draft.titleAr) && (
          <div className="text-center font-bold text-sm" style={{ color: 'var(--text)' }}>
            {bi(lang, draft.titleEn, draft.titleAr)}
          </div>
        )}
        {(draft.subtitleEn || draft.subtitleAr) && (
          <div className="text-center text-[11px]" style={{ color: 'var(--muted)' }}>
            {bi(lang, draft.subtitleEn, draft.subtitleAr)}
          </div>
        )}
        <div className="flex overflow-x-auto no-scrollbar" style={{ gap }}>
          {previewCards.map(({ item, catalog: hit }) => {
            const name = itemDisplayName(item, lang, hit);
            const img = itemDisplayImage(item, hit);
            const price =
              item.discountedPrice != null && item.discountedPrice > 0
                ? item.discountedPrice
                : item.originalPrice != null
                  ? item.originalPrice
                  : hit?.discountedPrice ?? hit?.basePrice ?? hit?.price ?? null;
            const stock = hit?.stock;
            return (
              <div
                key={item.id}
                className="shrink-0 border text-center"
                style={{
                  width,
                  borderRadius: radius,
                  padding: pad,
                  background: bg,
                  borderColor: 'var(--border)',
                }}
              >
                {item.promoTagEn || item.promoTagAr ? (
                  <div className="text-[9px] font-bold mb-1" style={{ color: 'var(--accent)' }}>
                    {bi(lang, item.promoTagEn, item.promoTagAr)}
                  </div>
                ) : null}
                {img ? <img src={img} alt="" className="h-24 w-full object-contain mb-2" /> : null}
                <div className="text-[11px] font-bold truncate">{name || (isAr ? 'بدون اسم' : 'Untitled')}</div>
                {price != null ? (
                  <div className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
                    {isAr ? `${Number(price).toLocaleString()} ر.س` : `SAR ${Number(price).toLocaleString()}`}
                  </div>
                ) : null}
                {stock != null ? (
                  <div className="text-[9px] mt-0.5" style={{ color: stock > 0 ? 'var(--muted)' : '#e11d48' }}>
                    {stock > 0 ? (isAr ? 'متوفر' : 'In Stock') : isAr ? 'غير متوفر' : 'Out of Stock'}
                  </div>
                ) : null}
                <div className="flex flex-col gap-1 mt-2">
                  {item.showBuyNow !== false ? (
                    <span className="text-[9px] font-bold rounded-md py-1" style={{ background: 'var(--portal-cta)', color: '#fff' }}>
                      {bi(lang, item.buyNowEn, item.buyNowAr) || (isAr ? 'اشتر الآن' : 'Buy Now')}
                    </span>
                  ) : null}
                  {item.showAddToCart !== false ? (
                    <span className="text-[9px] font-bold rounded-md py-1 border" style={{ borderColor: 'var(--border)' }}>
                      {bi(lang, item.addToCartEn, item.addToCartAr) || (isAr ? 'أضف إلى السلة' : 'Add to Cart')}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const filteredPicker = catalog.filter((p) => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.nameAr || '').includes(pickerQuery.trim()) ||
      (p.nameEn || '').toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <CoffeeWordSettingsShell
        isAr={isAr}
        onBack={onBack}
        embedded={embedded}
        titleEn="Product Carousel Section"
        titleAr="قسم عرض المنتجات المتحرك"
        subtitleEn="Curate products, layout, and card actions. Empty list falls back to catalog category."
        subtitleAr="اختر المنتجات والتخطيط وأزرار البطاقة. القائمة الفارغة تعتمد على تصنيف الكتالوج."
        onSave={() => save()}
        saving={saving}
        savedFlash={savedFlash}
        preview={preview}
        settings={
          <>
            <div
              className="flex flex-wrap gap-1 rounded-xl border p-1"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              role="tablist"
              aria-label={isAr ? 'أقسام الإعدادات' : 'Settings tabs'}
            >
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-product-carousel-tab={t.id}
                    onClick={() => setTab(t.id)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors"
                    style={
                      active
                        ? { background: 'var(--portal-cta)', color: '#fff', borderColor: 'var(--portal-cta)' }
                        : { background: 'transparent', color: 'var(--text)', borderColor: 'transparent' }
                    }
                  >
                    {isAr ? t.ar : t.en}
                  </button>
                );
              })}
            </div>

            {tab === 'content' ? (
              <>
                <section className={cardCls} style={cardStyle} data-product-carousel-panel="content">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold">{isAr ? 'إعدادات القسم' : 'Section Settings'}</h3>
                    <Toggle
                      on={!!draft?.enabled}
                      onChange={(v) => patchSection({ enabled: v })}
                      label={isAr ? 'تفعيل القسم' : 'Enable Section'}
                    />
                  </div>
                  <label className="block space-y-1">
                    <span className="flex justify-between text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'عنوان القسم' : 'Section Title'}
                      <Counter value={isAr ? draft?.titleAr || '' : draft?.titleEn || ''} max={100} />
                    </span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={100}
                      value={isAr ? draft?.titleAr || '' : draft?.titleEn || ''}
                      onChange={(e) => patchSection(isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="flex justify-between text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'نص ترويجي (اختياري)' : 'Promotional Text (Optional)'}
                      <Counter value={isAr ? draft?.subtitleAr || '' : draft?.subtitleEn || ''} max={200} />
                    </span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={200}
                      value={isAr ? draft?.subtitleAr || '' : draft?.subtitleEn || ''}
                      onChange={(e) =>
                        patchSection(isAr ? { subtitleAr: e.target.value } : { subtitleEn: e.target.value })
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'تصنيف الكتالوج (عند فراغ القائمة)' : 'Catalog category (when list empty)'}
                    </span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir="ltr"
                      value={draft?.categoryId || ''}
                      onChange={(e) => patchSection({ categoryId: e.target.value })}
                      placeholder={isAr ? 'فارغ = الكل' : 'empty = all'}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'عدد منتجات الكتالوج (احتياطي)' : 'Catalog product count (fallback)'}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={PRODUCT_CAROUSEL_MAX_ITEMS}
                      className={inputCls}
                      style={inputStyle}
                      value={draft?.productCount || 8}
                      onChange={(e) => patchSection({ productCount: Number(e.target.value) || 8 })}
                    />
                  </label>
                </section>

                <section className={cardCls} style={cardStyle} data-product-carousel-panel="products">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">
                      {isAr
                        ? `إدارة المنتجات (${items.length}/${PRODUCT_CAROUSEL_MAX_ITEMS})`
                        : `Products Management (${items.length}/${PRODUCT_CAROUSEL_MAX_ITEMS})`}
                    </h3>
                    <button
                      type="button"
                      disabled={items.length >= PRODUCT_CAROUSEL_MAX_ITEMS}
                      onClick={() => setPickerOpen(true)}
                      className="unity-btn-primary inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isAr ? 'إضافة منتج' : 'Add Product'}
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {isAr
                        ? 'لا منتجات محددة. المتجر يستخدم تصنيف الكتالوج إن وُجدت منتجات.'
                        : 'No curated products. Storefront uses catalog category when products exist.'}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((item, index) => {
                        const hit = catalog.find((p) => p.id === item.productId) || null;
                        const label = itemDisplayName(item, lang, hit) || (isAr ? 'بدون اسم' : 'Untitled');
                        const img = itemDisplayImage(item, hit);
                        const stock = hit?.stock;
                        return (
                          <li
                            key={item.id}
                            draggable
                            onDragStart={() => setDragIndex(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (dragIndex !== null) setItems(reorderCarouselItems(items, dragIndex, index));
                              setDragIndex(null);
                            }}
                            className="flex items-center gap-2 rounded-xl border px-2 py-2"
                            style={{
                              borderColor: editId === item.id ? 'var(--accent)' : 'var(--border)',
                              opacity: item.enabled === false ? 0.55 : 1,
                            }}
                          >
                            <GripVertical className="w-4 h-4 shrink-0 cursor-grab" style={{ color: 'var(--muted)' }} />
                            <span className="w-5 text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
                              {index + 1}
                            </span>
                            {img ? (
                              <img src={img} alt="" className="w-9 h-9 rounded-lg object-cover border" style={{ borderColor: 'var(--border)' }} />
                            ) : (
                              <span
                                className="w-9 h-9 rounded-lg border flex items-center justify-center text-[10px]"
                                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                              >
                                —
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate">{label}</div>
                              <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                                {stock == null
                                  ? item.productId
                                    ? isAr
                                      ? 'مرتبط بالكتالوج'
                                      : 'Linked'
                                    : isAr
                                      ? 'بدون ربط'
                                      : 'Unlinked'
                                  : stock > 0
                                    ? isAr
                                      ? 'متوفر'
                                      : 'In Stock'
                                    : isAr
                                      ? 'غير متوفر'
                                      : 'Out of Stock'}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="w-9 h-5 rounded-full p-0.5 shrink-0"
                              style={{ background: item.enabled !== false ? 'var(--portal-cta)' : 'var(--border)' }}
                              aria-label={isAr ? 'تفعيل المنتج' : 'Enable product'}
                              onClick={() => patchItem(item.id, { enabled: item.enabled === false })}
                            >
                              <span
                                className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                  item.enabled !== false ? 'translate-x-4 rtl:-translate-x-4' : ''
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg border"
                              style={{ borderColor: 'var(--border)' }}
                              onClick={() => setEditId(item.id)}
                              aria-label={isAr ? 'تعديل' : 'Edit'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg border disabled:opacity-40"
                              style={{ borderColor: 'var(--border)' }}
                              disabled={items.length >= PRODUCT_CAROUSEL_MAX_ITEMS}
                              onClick={() => {
                                const copy = duplicateCarouselItem(item);
                                const next = [...items];
                                next.splice(index + 1, 0, copy);
                                setItems(next.slice(0, PRODUCT_CAROUSEL_MAX_ITEMS));
                                setEditId(copy.id);
                              }}
                              aria-label={isAr ? 'نسخ' : 'Duplicate'}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {pendingDeleteId === item.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-rose-500"
                                  onClick={() => {
                                    setItems(items.filter((x) => x.id !== item.id));
                                    if (editId === item.id) setEditId(null);
                                    setPendingDeleteId(null);
                                  }}
                                >
                                  {isAr ? 'تأكيد' : 'Confirm'}
                                </button>
                                <button
                                  type="button"
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold border"
                                  style={{ borderColor: 'var(--border)' }}
                                  onClick={() => setPendingDeleteId(null)}
                                >
                                  {isAr ? 'إلغاء' : 'Cancel'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-500"
                                onClick={() => setPendingDeleteId(item.id)}
                                aria-label={isAr ? 'حذف' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </>
            ) : null}

            {tab === 'templates' ? (
              <section className={cardCls} style={cardStyle} data-product-carousel-panel="templates">
                <h3 className="text-sm font-bold">{isAr ? 'قوالب البطاقة' : 'Card Templates'}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'rounded' as const, en: 'Rounded', ar: 'منحني', radius: 16 },
                      { id: 'square' as const, en: 'Square', ar: 'مربع', radius: 0 },
                    ] as const
                  ).map((tpl) => {
                    const active = (draft?.cardStyle || 'rounded') === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => patchSection({ cardStyle: tpl.id, cardBorderRadius: tpl.radius })}
                        className="rounded-xl border px-3 py-3 text-[11px] font-bold text-start"
                        style={
                          active
                            ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                            : { borderColor: 'var(--border)', color: 'var(--text)' }
                        }
                      >
                        {isAr ? tpl.ar : tpl.en}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {tab === 'style' ? (
              <section className={cardCls} style={cardStyle} data-product-carousel-panel="style">
                <h3 className="text-sm font-bold">{isAr ? 'النمط' : 'Style'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'خلفية البطاقة' : 'Card Background Color'}
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={draft?.cardBgColor || '#FFFFFF'}
                        onChange={(e) => patchSection({ cardBgColor: e.target.value })}
                        className="w-9 h-9 rounded-lg border p-1"
                        style={{ borderColor: 'var(--border)' }}
                      />
                      <input
                        className={inputCls}
                        style={inputStyle}
                        dir="ltr"
                        value={draft?.cardBgColor || '#FFFFFF'}
                        onChange={(e) => patchSection({ cardBgColor: e.target.value })}
                      />
                    </div>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'انحناء الحواف' : 'Card Border Radius'}
                    </span>
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={draft?.cardBorderRadius ?? 16}
                      onChange={(e) => patchSection({ cardBorderRadius: Number(e.target.value) })}
                    >
                      {[0, 8, 12, 16, 24, 32].map((n) => (
                        <option key={n} value={n}>
                          {n} px
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'حشوة البطاقة' : 'Card Padding'}
                    </span>
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={draft?.cardPadding ?? 16}
                      onChange={(e) => patchSection({ cardPadding: Number(e.target.value) })}
                    >
                      {[8, 12, 16, 20, 24, 32].map((n) => (
                        <option key={n} value={n}>
                          {n} px
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'تباعد العناصر' : 'Item Spacing'}
                    </span>
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={draft?.itemSpacing ?? 16}
                      onChange={(e) => patchSection({ itemSpacing: Number(e.target.value) })}
                    >
                      {[8, 12, 16, 20, 24, 32].map((n) => (
                        <option key={n} value={n}>
                          {n} px
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-product-carousel-panel="layout">
                <h3 className="text-sm font-bold">{isAr ? 'التخطيط والتنقل' : 'Layout & Navigation'}</h3>
                <div className="space-y-3">
                  <label className="space-y-1.5 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'منتجات في الصف (سطح المكتب)' : 'Products per Row (Desktop)'}
                    </span>
                    <SegmentNum
                      value={draft?.productsPerRowDesktop || 3}
                      options={[2, 3]}
                      isAr={isAr}
                      onChange={(n) => patchSection({ productsPerRowDesktop: n as 2 | 3 })}
                      singularEn="Product"
                      singularAr="منتج"
                      pluralEn="Products"
                      pluralAr="منتجات"
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'منتجات في الصف (جهاز لوحي)' : 'Products per Row (Tablet)'}
                    </span>
                    <SegmentNum
                      value={draft?.productsPerRowTablet || 2}
                      options={[1, 2]}
                      isAr={isAr}
                      onChange={(n) => patchSection({ productsPerRowTablet: n as 1 | 2 })}
                      singularEn="Product"
                      singularAr="منتج"
                      pluralEn="Products"
                      pluralAr="منتجات"
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'منتجات في الصف (الجوال)' : 'Products per Row (Mobile)'}
                    </span>
                    <SegmentNum
                      value={draft?.productsPerRowMobile || 1}
                      options={[1, 2]}
                      isAr={isAr}
                      onChange={(n) => patchSection({ productsPerRowMobile: n as 1 | 2 })}
                      singularEn="Product"
                      singularAr="منتج"
                      pluralEn="Products"
                      pluralAr="منتجات"
                    />
                  </label>
                  <Toggle
                    on={draft?.showArrowsDesktop !== false}
                    onChange={(v) => patchSection({ showArrowsDesktop: v })}
                    label={isAr ? 'أسهم القسم (سطح المكتب)' : 'Show Section Arrows (Desktop)'}
                  />
                  <Toggle
                    on={draft?.showArrowsMobile === true}
                    onChange={(v) => patchSection({ showArrowsMobile: v })}
                    label={isAr ? 'أسهم القسم (الجوال)' : 'Show Section Arrows (Mobile)'}
                  />
                  <Toggle
                    on={draft?.enableTouchSwipe !== false}
                    onChange={(v) => patchSection({ enableTouchSwipe: v })}
                    label={isAr ? 'السحب باللمس' : 'Enable Touch Swipe'}
                  />
                  <Toggle
                    on={draft?.autoplay === true}
                    onChange={(v) => patchSection({ autoplay: v })}
                    label={isAr ? 'تشغيل تلقائي' : 'Autoplay'}
                  />
                </div>
              </section>
            ) : null}

            {tab === 'code' ? (
              <section className={cardCls} style={cardStyle} data-product-carousel-panel="code">
                <h3 className="text-sm font-bold">{isAr ? 'الرمز' : 'Code'}</h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'بانتظار البيانات — لا رمز مخصص بعد' : 'Waiting for Data — no custom code yet'}
                </p>
              </section>
            ) : null}

            {tab === 'ai' ? (
              <section className={cardCls} style={cardStyle} data-product-carousel-panel="ai">
                <h3 className="text-sm font-bold">{isAr ? 'الذكاء الاصطناعي' : 'AI'}</h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }} data-product-carousel-empty="ai">
                  {isAr ? 'بانتظار البيانات — غير متصل' : 'Waiting for Data — Not Connected'}
                </p>
              </section>
            ) : null}
          </>
        }
      />

      <GlobalModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        dir={isAr ? 'rtl' : 'ltr'}
        aria-label={isAr ? 'اختيار منتج' : 'Pick product'}
        contentClassName="max-w-lg"
      >
        <div
          className="rounded-2xl shadow-2xl w-full overflow-hidden max-h-[85vh] flex flex-col border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <div className="unity-modal-header px-5 py-4 text-white flex items-center justify-between shrink-0">
            <h3 className="font-bold text-base">{isAr ? 'إضافة من الكتالوج' : 'Add from Catalog'}</h3>
            <button type="button" onClick={() => setPickerOpen(false)} className="p-1 rounded-lg text-white/70 hover:text-white" aria-label={isAr ? 'إغلاق' : 'Close'}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto">
            <input
              className={inputCls}
              style={inputStyle}
              dir={isAr ? 'rtl' : 'ltr'}
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم أو المعرف' : 'Search by name or id'}
            />
            {filteredPicker.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا سجلات في الكتالوج' : 'No records found'}
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredPicker.slice(0, 40).map((p) => {
                  const already = items.some((it) => it.productId === p.id);
                  const img = catalogProductImage(p);
                  return (
                    <li key={p.id} className="flex items-center gap-2 rounded-xl border px-2 py-2" style={{ borderColor: 'var(--border)' }}>
                      {img ? <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <span className="w-10 h-10 rounded-lg border" style={{ borderColor: 'var(--border)' }} />}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{isAr ? p.nameAr || p.name || p.id : p.nameEn || p.name || p.id}</div>
                        <div className="text-[10px]" style={{ color: 'var(--muted)' }} dir="ltr">
                          {p.id}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={already || items.length >= PRODUCT_CAROUSEL_MAX_ITEMS}
                        className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40"
                        onClick={() => {
                          const row = fromCatalogProduct(p);
                          setDraft({ ...draft, enabled: true, items: [...items, row].slice(0, PRODUCT_CAROUSEL_MAX_ITEMS) });
                          setEditId(row.id);
                          setPickerOpen(false);
                        }}
                      >
                        {already ? (isAr ? 'مضاف' : 'Added') : isAr ? 'إضافة' : 'Add'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </GlobalModal>

      <GlobalModal
        isOpen={!!editing}
        onClose={() => setEditId(null)}
        dir={isAr ? 'rtl' : 'ltr'}
        aria-label={isAr ? 'تعديل المنتج' : 'Edit product'}
        contentClassName="max-w-3xl"
      >
        {editing ? (
          <div
            className="rounded-2xl shadow-2xl w-full overflow-hidden max-h-[90vh] flex flex-col border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div className="unity-modal-header px-5 py-4 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base">
                {isAr
                  ? `تعديل المنتج ${items.findIndex((f) => f.id === editing.id) + 1}`
                  : `Edit Product (Item ${items.findIndex((f) => f.id === editing.id) + 1})`}
              </h3>
              <button type="button" onClick={() => setEditId(null)} className="p-1 rounded-lg text-white/70 hover:text-white" aria-label={isAr ? 'إغلاق' : 'Close'}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <MediaUploadField
                    label={isAr ? 'الصورة الرئيسية' : 'Main Image'}
                    value={editing.imageUrl || ''}
                    onChange={(url) => patchItem(editing.id, { imageUrl: url })}
                    aspectRatio="square"
                    initialFolder="products"
                    recommendedSize="800 × 800 px"
                  />
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'معرّف منتج الكتالوج' : 'Catalog product id'}
                    </span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir="ltr"
                      value={editing.productId || ''}
                      onChange={(e) => patchItem(editing.id, { productId: e.target.value })}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="flex justify-between text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'اسم المنتج' : 'Product Name'}
                      <Counter value={isAr ? editing.nameAr || '' : editing.nameEn || ''} max={100} />
                    </span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={100}
                      value={isAr ? editing.nameAr || '' : editing.nameEn || ''}
                      onChange={(e) =>
                        patchItem(editing.id, isAr ? { nameAr: e.target.value } : { nameEn: e.target.value })
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="flex justify-between text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'وسم ترويجي (اختياري)' : 'Promotional Tag (Optional)'}
                      <Counter value={isAr ? editing.promoTagAr || '' : editing.promoTagEn || ''} max={40} />
                    </span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={40}
                      value={isAr ? editing.promoTagAr || '' : editing.promoTagEn || ''}
                      onChange={(e) =>
                        patchItem(editing.id, isAr ? { promoTagAr: e.target.value } : { promoTagEn: e.target.value })
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'رابط المنتج (اختياري)' : 'Product Link (Optional)'}
                    </span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir="ltr"
                      value={editing.productLink || ''}
                      onChange={(e) => patchItem(editing.id, { productLink: e.target.value })}
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <Toggle
                    on={editing.showOptions !== false}
                    onChange={(v) => patchItem(editing.id, { showOptions: v })}
                    label={isAr ? 'إظهار خيارات المنتج إن وُجدت' : 'Show Product Options if Available'}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'السعر الأصلي' : 'Original Price'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        className={inputCls}
                        style={inputStyle}
                        value={editing.originalPrice ?? ''}
                        onChange={(e) =>
                          patchItem(editing.id, {
                            originalPrice: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'سعر الخصم' : 'Discounted Price'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        className={inputCls}
                        style={inputStyle}
                        value={editing.discountedPrice ?? ''}
                        onChange={(e) =>
                          patchItem(editing.id, {
                            discountedPrice: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  <Toggle
                    on={editing.showOriginalPrice !== false}
                    onChange={(v) => patchItem(editing.id, { showOriginalPrice: v })}
                    label={isAr ? 'إظهار السعر الأصلي مشطوباً' : 'Show Original Price (Strikethrough)'}
                  />

                  <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-[11px] font-bold">{isAr ? 'أزرار الإجراء' : 'Action Buttons'}</div>
                    <Toggle
                      on={editing.showBuyNow !== false}
                      onChange={(v) => patchItem(editing.id, { showBuyNow: v })}
                      label={isAr ? 'زر اشتر الآن' : 'Show Buy Now'}
                    />
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      value={isAr ? editing.buyNowAr || '' : editing.buyNowEn || ''}
                      onChange={(e) =>
                        patchItem(editing.id, isAr ? { buyNowAr: e.target.value } : { buyNowEn: e.target.value })
                      }
                      placeholder={isAr ? 'نص الزر' : 'Button text'}
                    />
                    <Toggle
                      on={editing.showAddToCart !== false}
                      onChange={(v) => patchItem(editing.id, { showAddToCart: v })}
                      label={isAr ? 'زر أضف إلى السلة' : 'Show Add to Cart'}
                    />
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      value={isAr ? editing.addToCartAr || '' : editing.addToCartEn || ''}
                      onChange={(e) =>
                        patchItem(editing.id, isAr ? { addToCartAr: e.target.value } : { addToCartEn: e.target.value })
                      }
                    />
                    <Toggle
                      on={editing.showLearnMore !== false}
                      onChange={(v) => patchItem(editing.id, { showLearnMore: v })}
                      label={isAr ? 'زر اعرف المزيد' : 'Show Learn More'}
                    />
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      value={isAr ? editing.learnMoreAr || '' : editing.learnMoreEn || ''}
                      onChange={(e) =>
                        patchItem(editing.id, isAr ? { learnMoreAr: e.target.value } : { learnMoreEn: e.target.value })
                      }
                    />
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'نوع رابط اعرف المزيد' : 'Learn More Link Type'}
                      </span>
                      <select
                        className={inputCls}
                        style={inputStyle}
                        value={editing.learnMoreLinkType || 'product'}
                        onChange={(e) =>
                          patchItem(editing.id, {
                            learnMoreLinkType: e.target.value as ProductCarouselItem['learnMoreLinkType'],
                          })
                        }
                      >
                        <option value="none">{isAr ? 'بدون' : 'None'}</option>
                        <option value="product">{isAr ? 'منتج' : 'Product'}</option>
                        <option value="category">{isAr ? 'تصنيف' : 'Category'}</option>
                        <option value="page">{isAr ? 'صفحة' : 'Page'}</option>
                        <option value="external">{isAr ? 'رابط خارجي' : 'External URL'}</option>
                      </select>
                    </label>
                    {editing.learnMoreLinkType && editing.learnMoreLinkType !== 'none' && editing.learnMoreLinkType !== 'product' ? (
                      <input
                        className={inputCls}
                        style={inputStyle}
                        dir="ltr"
                        value={editing.learnMoreUrl || ''}
                        onChange={(e) => patchItem(editing.id, { learnMoreUrl: e.target.value })}
                        placeholder={isAr ? 'الوجهة' : 'Destination'}
                      />
                    ) : null}
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'فتح الرابط في' : 'Open Link In'}
                      </span>
                      <select
                        className={inputCls}
                        style={inputStyle}
                        value={editing.learnMoreOpenIn || 'same'}
                        onChange={(e) =>
                          patchItem(editing.id, {
                            learnMoreOpenIn: e.target.value as ProductCarouselItem['learnMoreOpenIn'],
                          })
                        }
                      >
                        <option value="same">{isAr ? 'نفس التبويب' : 'Same Tab'}</option>
                        <option value="new">{isAr ? 'تبويب جديد' : 'New Tab'}</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" onClick={() => setEditId(null)} className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold">
                  {isAr ? 'تم' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </GlobalModal>
    </>
  );
};
