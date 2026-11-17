import React, { useState } from 'react';
import {
  Copy,
  CreditCard,
  GripVertical,
  Headphones,
  Layers,
  MessageCircle,
  Palette,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { GlobalModal } from '../../../common/GlobalModal';
import { MediaUploadField } from '../../../common/MediaUploadField';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import {
  bi,
  type CommercialHeroFeature,
  type CommercialHeroSettings,
  type CommercialHeroSlide,
} from '../../../../themes/settings/coffeeModularSettings';
import {
  COMMERCIAL_HERO_MAX_FEATURES,
  COMMERCIAL_HERO_MAX_SLIDES,
  blankCommercialHeroFeature,
  blankCommercialHeroSlide,
  commercialHeroShowsOnDevice,
  duplicateCommercialHeroFeature,
  duplicateCommercialHeroSlide,
  reorderCommercialHeroFeatures,
  reorderCommercialHeroSlides,
  visibleCommercialHeroSlides,
  type CommercialHeroPreviewDevice,
} from '../../../../themes/coffeeRoasters/components/coffeeCommercialHeroLogic';
import { CoffeeCommercialHeroSection } from '../../../../themes/coffeeRoasters/components/CoffeeCommercialHeroSection';
import { CartProvider as CoffeeCartProvider } from '../../../../themes/coffeeRoasters/context/CartContext';

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

function mapDevice(d: PreviewDevice): CommercialHeroPreviewDevice {
  if (d === 'mobile') return 'mobile';
  if (d === 'tablet') return 'tablet';
  return 'desktop';
}

export const CoffeeCommercialHeroForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('commercialHero');
  const [tab, setTab] = useState<Tab>('content');
  const [editId, setEditId] = useState<string | null>(null);
  const [featEditId, setFeatEditId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [featDrag, setFeatDrag] = useState<number | null>(null);
  const slides = draft?.slides || [];
  const editing = slides.find((it) => it.id === editId) || null;
  const editingFeat = editing?.features?.find((f) => f.id === featEditId) || null;
  const lang = isAr ? 'ar' : 'en';

  const patch = (p: Partial<CommercialHeroSettings>) => setDraft({ ...draft, ...p });
  const setSlides = (next: CommercialHeroSlide[]) => patch({ slides: next });
  const patchSlide = (id: string, p: Partial<CommercialHeroSlide>) =>
    setSlides(slides.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const setFeatures = (slideId: string, features: CommercialHeroFeature[]) =>
    patchSlide(slideId, { features });
  const patchFeature = (slideId: string, featId: string, p: Partial<CommercialHeroFeature>) => {
    const slide = slides.find((s) => s.id === slideId);
    if (!slide) return;
    setFeatures(
      slideId,
      (slide.features || []).map((f) => (f.id === featId ? { ...f, ...p } : f)),
    );
  };

  const preview = (device: PreviewDevice) => {
    const d = mapDevice(device);
    if (!draft?.enabled) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'القسم مخفي' : 'Section hidden'}</div>;
    }
    if (!commercialHeroShowsOnDevice(draft, d)) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'مخفي على هذا الجهاز' : 'Hidden on this device'}</div>;
    }
    if (!visibleCommercialHeroSlides(draft).length) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'لا شرائح — بانتظار البيانات' : 'No slides — Waiting for Data'}</div>;
    }
    return (
      <CoffeeCartProvider>
        <CoffeeCommercialHeroSection settings={draft} lang={lang} device={d} />
      </CoffeeCartProvider>
    );
  };

  return (
    <>
      <CoffeeWordSettingsShell
        isAr={isAr}
        onBack={onBack}
        embedded={embedded}
        titleEn="Commercial Hero"
        titleAr="البطل التجاري"
        subtitleEn="Flagship SKU slides with feature chips. Empty hides. Separate from Flagship / Hero Banners."
        subtitleAr="شرائح منتج رائد مع شرائح المميزات. الفارغ يختفي. منفصل عن القسم الرائد ولافتات الواجهة."
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
                    data-commercial-hero-tab={t.id}
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
                <section className={cardCls} style={cardStyle} data-commercial-hero-panel="content">
                  <Toggle on={!!draft?.enabled} onChange={(v) => patch({ enabled: v })} label={isAr ? 'تفعيل القسم' : 'Enable Section'} />
                  <Toggle on={draft?.showBadge !== false} onChange={(v) => patch({ showBadge: v })} label={isAr ? 'إظهار الشارة' : 'Show Badge'} />
                  <Toggle on={draft?.showSubtitle !== false} onChange={(v) => patch({ showSubtitle: v })} label={isAr ? 'إظهار العنوان الفرعي' : 'Show Subtitle'} />
                  <Toggle on={draft?.showPrice !== false} onChange={(v) => patch({ showPrice: v })} label={isAr ? 'إظهار السعر' : 'Show Price'} />
                  <Toggle on={draft?.showButtons !== false} onChange={(v) => patch({ showButtons: v })} label={isAr ? 'إظهار الأزرار' : 'Show Buttons'} />
                  <Toggle on={draft?.showIcons !== false} onChange={(v) => patch({ showIcons: v })} label={isAr ? 'إظهار أيقونات الأزرار' : 'Show Button Icons'} />
                  <Toggle on={draft?.showFeatures !== false} onChange={(v) => patch({ showFeatures: v })} label={isAr ? 'إظهار المميزات' : 'Show Features'} />
                </section>

                <section className={cardCls} style={cardStyle} data-commercial-hero-panel="slides">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{isAr ? `الشرائح (${slides.length}/${COMMERCIAL_HERO_MAX_SLIDES})` : `Slides (${slides.length}/${COMMERCIAL_HERO_MAX_SLIDES})`}</h3>
                    <button
                      type="button"
                      disabled={slides.length >= COMMERCIAL_HERO_MAX_SLIDES}
                      className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40"
                      onClick={() => {
                        const row = blankCommercialHeroSlide();
                        const next = [...slides, row];
                        setSlides(next);
                        setEditId(row.id);
                        patch({ enabled: true, slides: next });
                      }}
                    >
                      + {isAr ? 'إضافة شريحة' : 'Add Slide'}
                    </button>
                  </div>
                  {slides.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا شرائح. القسم يختفي.' : 'No slides. Section hides.'}</p>
                  ) : (
                    <ul className="space-y-2">
                      {slides.map((it, index) => (
                        <li
                          key={it.id}
                          draggable
                          onDragStart={() => setDragIndex(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragIndex !== null) setSlides(reorderCommercialHeroSlides(slides, dragIndex, index));
                            setDragIndex(null);
                          }}
                          className="flex items-center gap-2 rounded-xl border px-2 py-2"
                          style={{ borderColor: 'var(--border)', opacity: it.enabled === false ? 0.4 : 1 }}
                        >
                          <GripVertical className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                          <div className="min-w-0 flex-1 text-xs font-bold truncate">{bi(lang, it.titleEn, it.titleAr) || (isAr ? 'بدون عنوان' : 'Untitled')}</div>
                          <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setEditId(it.id)} aria-label={isAr ? 'تعديل' : 'Edit'}><Pencil className="w-3.5 h-3.5" /></button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg border disabled:opacity-40"
                            style={{ borderColor: 'var(--border)' }}
                            disabled={slides.length >= COMMERCIAL_HERO_MAX_SLIDES}
                            onClick={() => {
                              const copy = duplicateCommercialHeroSlide(it);
                              setSlides([...slides.slice(0, index + 1), copy, ...slides.slice(index + 1)].slice(0, COMMERCIAL_HERO_MAX_SLIDES));
                              setEditId(copy.id);
                            }}
                            aria-label={isAr ? 'نسخ' : 'Duplicate'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-500"
                            onClick={() => {
                              setSlides(slides.filter((x) => x.id !== it.id));
                              if (editId === it.id) setEditId(null);
                            }}
                            aria-label={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className={cardCls} style={cardStyle} data-commercial-hero-panel="slider">
                  <h3 className="text-sm font-bold">{isAr ? 'الشريط المتحرك' : 'Slider'}</h3>
                  <Toggle on={!!draft?.autoplay} onChange={(v) => patch({ autoplay: v })} label={isAr ? 'تشغيل تلقائي' : 'Autoplay'} />
                  <Toggle on={draft?.showArrows !== false} onChange={(v) => patch({ showArrows: v })} label={isAr ? 'إظهار الأسهم' : 'Show Arrows'} />
                  <Toggle on={draft?.showDots !== false} onChange={(v) => patch({ showDots: v })} label={isAr ? 'إظهار النقاط' : 'Show Dots'} />
                  <label className="block space-y-1 text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'سرعة الانتقال (ث)' : 'Transition (sec)'}</span>
                    <select className={inputCls} style={inputStyle} value={draft?.transitionSec ?? 5} onChange={(e) => patch({ transitionSec: Number(e.target.value) })}>
                      {[3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                </section>
              </>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-commercial-hero-panel="layout">
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'محاذاة المحتوى' : 'Content alignment'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.contentAlign || 'image-right'} onChange={(e) => patch({ contentAlign: e.target.value as CommercialHeroSettings['contentAlign'] })}>
                    <option value="image-right">{isAr ? 'نص يسار — صورة يمين' : 'Text left — Image right'}</option>
                    <option value="image-left">{isAr ? 'نص يمين — صورة يسار' : 'Text right — Image left'}</option>
                    <option value="centered">{isAr ? 'توسيط' : 'Centered'}</option>
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'عرض المحتوى' : 'Content width'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.contentWidth || 'wide'} onChange={(e) => patch({ contentWidth: e.target.value as CommercialHeroSettings['contentWidth'] })}>
                    <option value="narrow">{isAr ? 'ضيق' : 'Narrow'}</option>
                    <option value="medium">{isAr ? 'متوسط' : 'Medium'}</option>
                    <option value="wide">{isAr ? 'واسع' : 'Wide'}</option>
                    <option value="full">{isAr ? 'كامل العرض' : 'Full width'}</option>
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'حشوة القسم' : 'Section padding (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.sectionPaddingY ?? 48} onChange={(e) => patch({ sectionPaddingY: Number(e.target.value) })}>
                    {[24, 32, 48, 64, 80].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة المحتوى' : 'Content gap (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.contentGapPx ?? 24} onChange={(e) => patch({ contentGapPx: Number(e.target.value) })}>
                    {[12, 16, 24, 32, 40].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة المميزات' : 'Features gap (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.featuresGapPx ?? 12} onChange={(e) => patch({ featuresGapPx: Number(e.target.value) })}>
                    {[4, 8, 12, 16, 20].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </section>
            ) : null}

            {tab === 'style' ? (
              <section className={cardCls} style={cardStyle} data-commercial-hero-panel="style">
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'المظهر يتبع هايبرو المقفل — لا إعادة تصميم للقسم الرائد ثلاثي الأبعاد.' : 'Chrome follows locked HiBrew look — Flagship 3D section stays untouched.'}
                </p>
              </section>
            ) : null}

            {tab === 'advanced' ? (
              <section className={cardCls} style={cardStyle} data-commercial-hero-panel="advanced">
                <Toggle on={draft?.showOnDesktop !== false} onChange={(v) => patch({ showOnDesktop: v })} label={isAr ? 'إظهار على سطح المكتب' : 'Show on Desktop'} />
                <Toggle on={draft?.showOnTablet !== false} onChange={(v) => patch({ showOnTablet: v })} label={isAr ? 'إظهار على الجهاز اللوحي' : 'Show on Tablet'} />
                <Toggle on={draft?.showOnMobile !== false} onChange={(v) => patch({ showOnMobile: v })} label={isAr ? 'إظهار على الجوال' : 'Show on Mobile'} />
              </section>
            ) : null}
          </>
        }
      />

      <GlobalModal isOpen={!!editing} onClose={() => { setEditId(null); setFeatEditId(null); }} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل الشريحة' : 'Edit slide'} contentClassName="max-w-2xl">
        {editing ? (
          <div className="rounded-2xl border shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} data-commercial-hero-edit>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل الشريحة' : 'Edit Slide'}</h3>
              <button type="button" onClick={() => { setEditId(null); setFeatEditId(null); }} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto text-xs">
              <Toggle on={editing.enabled !== false} onChange={(v) => patchSlide(editing.id, { enabled: v })} label={isAr ? 'تفعيل الشريحة' : 'Enable slide'} />
              <MediaUploadField
                label={isAr ? 'صورة المنتج' : 'Product image'}
                value={editing.image || ''}
                onChange={(url) => patchSlide(editing.id, { image: url })}
              />
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'الشارة (إنجليزي)' : 'Badge (EN)'}</span>
                <input className={inputCls} style={inputStyle} dir="ltr" maxLength={80} value={editing.badgeEn} onChange={(e) => patchSlide(editing.id, { badgeEn: e.target.value })} />
              </label>
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'الشارة (عربي)' : 'Badge (AR)'}</span>
                <input className={inputCls} style={inputStyle} dir="rtl" maxLength={80} value={editing.badgeAr} onChange={(e) => patchSlide(editing.id, { badgeAr: e.target.value })} />
              </label>
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'العنوان (إنجليزي)' : 'Title (EN)'}</span>
                <input className={inputCls} style={inputStyle} dir="ltr" maxLength={120} value={editing.titleEn} onChange={(e) => patchSlide(editing.id, { titleEn: e.target.value })} />
              </label>
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'العنوان (عربي)' : 'Title (AR)'}</span>
                <input className={inputCls} style={inputStyle} dir="rtl" maxLength={120} value={editing.titleAr} onChange={(e) => patchSlide(editing.id, { titleAr: e.target.value })} />
              </label>
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'العنوان الفرعي (إنجليزي)' : 'Subtitle (EN)'}</span>
                <textarea className={inputCls} style={inputStyle} dir="ltr" maxLength={240} rows={2} value={editing.subtitleEn} onChange={(e) => patchSlide(editing.id, { subtitleEn: e.target.value })} />
              </label>
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'العنوان الفرعي (عربي)' : 'Subtitle (AR)'}</span>
                <textarea className={inputCls} style={inputStyle} dir="rtl" maxLength={240} rows={2} value={editing.subtitleAr} onChange={(e) => patchSlide(editing.id, { subtitleAr: e.target.value })} />
              </label>
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'السعر' : 'Price'}</span>
                <input
                  className={inputCls}
                  style={inputStyle}
                  type="number"
                  min={0}
                  value={editing.price ?? ''}
                  onChange={(e) => patchSlide(editing.id, { price: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </label>
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'معرف المنتج' : 'Product ID'}</span>
                <input className={inputCls} style={inputStyle} dir="ltr" value={editing.productId} onChange={(e) => patchSlide(editing.id, { productId: e.target.value })} placeholder="catalog-id" />
              </label>
              <Toggle on={editing.buyNowEnabled !== false} onChange={(v) => patchSlide(editing.id, { buyNowEnabled: v })} label={isAr ? 'زر الشراء الآن' : 'Buy Now button'} />
              <input className={inputCls} style={inputStyle} dir="ltr" maxLength={40} value={editing.buyNowEn} onChange={(e) => patchSlide(editing.id, { buyNowEn: e.target.value })} placeholder="Buy Now" />
              <input className={inputCls} style={inputStyle} dir="rtl" maxLength={40} value={editing.buyNowAr} onChange={(e) => patchSlide(editing.id, { buyNowAr: e.target.value })} placeholder="شراء الآن" />
              <Toggle on={editing.addToCartEnabled !== false} onChange={(v) => patchSlide(editing.id, { addToCartEnabled: v })} label={isAr ? 'زر السلة' : 'Add to Cart button'} />
              <input className={inputCls} style={inputStyle} dir="ltr" maxLength={40} value={editing.addToCartEn} onChange={(e) => patchSlide(editing.id, { addToCartEn: e.target.value })} placeholder="Add to Cart" />
              <input className={inputCls} style={inputStyle} dir="rtl" maxLength={40} value={editing.addToCartAr} onChange={(e) => patchSlide(editing.id, { addToCartAr: e.target.value })} placeholder="أضف إلى السلة" />

              <div className="pt-2 space-y-2" data-commercial-hero-panel="features">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">{isAr ? `المميزات (${(editing.features || []).length}/${COMMERCIAL_HERO_MAX_FEATURES})` : `Features (${(editing.features || []).length}/${COMMERCIAL_HERO_MAX_FEATURES})`}</h4>
                  <button
                    type="button"
                    disabled={(editing.features || []).length >= COMMERCIAL_HERO_MAX_FEATURES}
                    className="unity-btn-primary px-2 py-1 rounded-lg text-[11px] font-bold disabled:opacity-40"
                    onClick={() => {
                      const row = blankCommercialHeroFeature();
                      setFeatures(editing.id, [...(editing.features || []), row]);
                      setFeatEditId(row.id);
                    }}
                  >
                    + {isAr ? 'ميزة' : 'Feature'}
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {(editing.features || []).map((f, index) => (
                    <li
                      key={f.id}
                      draggable
                      onDragStart={() => setFeatDrag(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (featDrag !== null) {
                          setFeatures(editing.id, reorderCommercialHeroFeatures(editing.features || [], featDrag, index));
                        }
                        setFeatDrag(null);
                      }}
                      className="flex items-center gap-2 rounded-lg border px-2 py-1.5"
                      style={{ borderColor: 'var(--border)', opacity: f.enabled === false ? 0.4 : 1 }}
                    >
                      <GripVertical className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                      <span className="flex-1 truncate font-semibold">{bi(lang, f.labelEn, f.labelAr) || (isAr ? 'بدون تسمية' : 'Untitled')}</span>
                      <button type="button" className="p-1 rounded border" style={{ borderColor: 'var(--border)' }} onClick={() => setFeatEditId(f.id)}><Pencil className="w-3 h-3" /></button>
                      <button
                        type="button"
                        className="p-1 rounded border"
                        style={{ borderColor: 'var(--border)' }}
                        onClick={() => {
                          const copy = duplicateCommercialHeroFeature(f);
                          setFeatures(editing.id, [...(editing.features || []).slice(0, index + 1), copy, ...(editing.features || []).slice(index + 1)].slice(0, COMMERCIAL_HERO_MAX_FEATURES));
                          setFeatEditId(copy.id);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded border border-rose-200 text-rose-500"
                        onClick={() => {
                          setFeatures(editing.id, (editing.features || []).filter((x) => x.id !== f.id));
                          if (featEditId === f.id) setFeatEditId(null);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => { setEditId(null); setFeatEditId(null); }}>{isAr ? 'تم' : 'Done'}</button>
            </div>
          </div>
        ) : null}
      </GlobalModal>

      <GlobalModal isOpen={!!editingFeat && !!editing} onClose={() => setFeatEditId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل الميزة' : 'Edit feature'} contentClassName="max-w-md">
        {editing && editingFeat ? (
          <div className="rounded-2xl border shadow-2xl w-full overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} data-commercial-hero-feature-edit>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل الميزة' : 'Edit Feature'}</h3>
              <button type="button" onClick={() => setFeatEditId(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <Toggle on={editingFeat.enabled !== false} onChange={(v) => patchFeature(editing.id, editingFeat.id, { enabled: v })} label={isAr ? 'تفعيل' : 'Enabled'} />
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map(({ name, Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => patchFeature(editing.id, editingFeat.id, { icon: name })}
                    className="w-9 h-9 rounded-lg border flex items-center justify-center"
                    style={{
                      borderColor: editingFeat.icon === name ? 'var(--portal-cta)' : 'var(--border)',
                      background: editingFeat.icon === name ? 'var(--portal-cta)' : 'var(--surface)',
                      color: editingFeat.icon === name ? '#fff' : 'var(--text)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <input className={inputCls} style={inputStyle} dir="ltr" maxLength={60} value={editingFeat.labelEn} onChange={(e) => patchFeature(editing.id, editingFeat.id, { labelEn: e.target.value })} placeholder="Label EN" />
              <input className={inputCls} style={inputStyle} dir="rtl" maxLength={60} value={editingFeat.labelAr} onChange={(e) => patchFeature(editing.id, editingFeat.id, { labelAr: e.target.value })} placeholder="التسمية عربي" />
              <input className={inputCls} style={inputStyle} dir="ltr" maxLength={80} value={editingFeat.valueEn} onChange={(e) => patchFeature(editing.id, editingFeat.id, { valueEn: e.target.value })} placeholder="Value EN" />
              <input className={inputCls} style={inputStyle} dir="rtl" maxLength={80} value={editingFeat.valueAr} onChange={(e) => patchFeature(editing.id, editingFeat.id, { valueAr: e.target.value })} placeholder="القيمة عربي" />
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setFeatEditId(null)}>{isAr ? 'حفظ' : 'Save'}</button>
            </div>
          </div>
        ) : null}
      </GlobalModal>
    </>
  );
};
