import React, { useState } from 'react';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import {
  bi,
  emptyHeroDeviceStyle,
  type HeroBannerContentMode,
  type HeroBannerSlideSettings,
  type HeroDeviceChromeStyle,
} from '../../../../themes/settings/coffeeModularSettings';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import { safeFeatureImage } from '../../../../themes/coffeeRoasters/components/CoffeeFeatureIconsBar';
import { MediaUploadField } from '../../../common/MediaUploadField';

const inputCls = 'w-full px-3 py-2 rounded-lg border bg-white text-xs outline-none focus:border-[var(--accent)]';
const cardCls = 'rounded-2xl border p-4 shadow-sm space-y-3';
const cardStyle: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' };
const inputStyle: React.CSSProperties = { borderColor: 'var(--border)', color: 'var(--text)' };

type HeroTab = 'content' | 'style' | 'layout';
const HERO_TABS: { id: HeroTab; en: string; ar: string }[] = [
  { id: 'content', en: 'Content', ar: 'المحتوى' },
  { id: 'style', en: 'Style', ar: 'النمط' },
  { id: 'layout', en: 'Layout', ar: 'التخطيط' },
];

const CONTENT_MODES: {
  id: HeroBannerContentMode;
  en: string;
  ar: string;
  descEn: string;
  descAr: string;
}[] = [
  {
    id: 'image_only',
    en: 'Images only',
    ar: 'صور فقط',
    descEn: 'One slider — images move only, no text or buttons.',
    descAr: 'سلايدر واحد — الصور تتحرك فقط بدون نص أو أزرار.',
  },
  {
    id: 'full',
    en: 'Full overlay',
    ar: 'عرض كامل',
    descEn: 'One slider — text, card background, price, and CTAs.',
    descAr: 'سلايدر واحد — نص وبطاقة وخلفية وسعر وأزرار.',
  },
  {
    id: 'both',
    en: 'Both sliders',
    ar: 'السلايدران معاً',
    descEn: 'Image-only slider + full text slider on the home page.',
    descAr: 'سلايدر صور فقط ثم سلايدر النص الكامل في الصفحة الرئيسية.',
  },
];

type DeviceStyleKey = 'styleMobile' | 'styleLaptop' | 'styleDesktop';

function DeviceChromeEditor({
  isAr,
  title,
  value,
  onChange,
}: {
  isAr: boolean;
  title: string;
  value: HeroDeviceChromeStyle;
  onChange: (next: HeroDeviceChromeStyle) => void;
}) {
  const v = { ...emptyHeroDeviceStyle(), ...value };
  const row = (
    key: keyof HeroDeviceChromeStyle,
    labelAr: string,
    labelEn: string,
    type: 'color' | 'number' = 'color',
  ) => (
    <label key={String(key)} className="block space-y-1 text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
      <span>{isAr ? labelAr : labelEn}</span>
      {type === 'number' ? (
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          className={inputCls}
          style={inputStyle}
          value={Number(v.cardOpacity ?? 0.8)}
          onChange={(e) => onChange({ ...v, cardOpacity: Number(e.target.value) })}
        />
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={String(v[key] || '#111111')}
            onChange={(e) => onChange({ ...v, [key]: e.target.value })}
            className="w-8 h-8 rounded-lg cursor-pointer border"
            style={{ borderColor: 'var(--border)' }}
          />
          <input
            className={inputCls}
            style={inputStyle}
            dir="ltr"
            value={String(v[key] || '')}
            onChange={(e) => onChange({ ...v, [key]: e.target.value })}
          />
        </div>
      )}
    </label>
  );
  return (
    <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--border)' }} data-hero-device-style={title}>
      <h4 className="text-xs font-black" style={{ color: 'var(--text)' }}>{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {row('textColor', 'لون النص', 'Text color')}
        {row('priceColor', 'لون السعر', 'Price color')}
        {row('cardBg', 'خلفية البطاقة', 'Card background')}
        {row('cardOpacity', 'شفافية البطاقة', 'Card opacity', 'number')}
        {row('buttonBg', 'خلفية الزر', 'Button background')}
        {row('buttonTextColor', 'لون نص الزر', 'Button text')}
        {row('linkColor', 'لون الروابط', 'Link color')}
        {row('scrimFrom', 'تدرج الخلفية', 'Scrim / wash')}
      </div>
    </div>
  );
}

function blankSlide(): HeroBannerSlideSettings {
  return {
    id: `hero-${Date.now()}`,
    enabled: true,
    image: '',
    tabletImage: '',
    mobileImage: '',
    promoEn: '',
    promoAr: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    showPrice: false,
    price: '',
    currency: 'SAR',
    productId: '',
    textColor: '#111111',
    whatsappEnabled: false,
    buyNowEnabled: false,
    buyNowEn: '',
    buyNowAr: '',
    addToCartEnabled: false,
    addToCartEn: '',
    addToCartAr: '',
    learnMoreEnabled: false,
    learnMoreEn: '',
    learnMoreAr: '',
    learnMoreUrl: '',
    customOrderEnabled: false,
    customOrderEn: '',
    customOrderAr: '',
    customOrderUrl: '',
  };
}

function HeroPreviewCard({
  slide,
  isAr,
  device,
  contentMode = 'full',
}: {
  slide: HeroBannerSlideSettings | null;
  isAr: boolean;
  device: PreviewDevice;
  contentMode?: HeroBannerContentMode;
}) {
  if (!slide) {
    return <div className="p-6 text-center text-[11px] text-slate-400">{isAr ? 'لا شريحة للمعاينة' : 'No slide to preview'}</div>;
  }
  const raw =
    device === 'mobile'
      ? slide.mobileImage || slide.tabletImage || slide.image
      : device === 'tablet'
        ? slide.tabletImage || slide.image
        : slide.image;
  const image = safeFeatureImage(raw);
  const promo = bi(isAr ? 'ar' : 'en', slide.promoEn, slide.promoAr);
  const title = bi(isAr ? 'ar' : 'en', slide.titleEn, slide.titleAr);
  const description = bi(isAr ? 'ar' : 'en', slide.descriptionEn, slide.descriptionAr);
  const price = slide.showPrice && slide.price
    ? (isAr
      ? `${slide.price}\u20C1`
      : `${(slide.currency || 'SAR') === 'SAR' ? '\u20C1' : (slide.currency || '\u20C1')} ${slide.price}`)
    : '';
  const height = device === 'mobile' ? 220 : device === 'tablet' ? 200 : 240;
  const imageOnly = contentMode === 'image_only';

  return (
    <div className="relative overflow-hidden bg-neutral-900 text-white" style={{ minHeight: height }} data-hero-preview-mode={contentMode}>
      {image ? <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" /> : null}
      {imageOnly ? (
        <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
          <span className="px-2 py-0.5 rounded-full bg-black/55 text-[9px] font-bold tracking-wide">
            {isAr ? 'صور فقط' : 'Images only'}
          </span>
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
          <div className={`relative flex flex-col justify-end gap-1.5 p-4 ${device === 'mobile' ? 'max-w-full' : 'max-w-[70%]'}`} style={{ minHeight: height }}>
            {promo ? <span className="text-[10px] font-bold tracking-wide text-amber-200">{promo}</span> : null}
            <div className={`font-black leading-tight ${device === 'mobile' ? 'text-base' : 'text-lg'}`}>{title || (isAr ? 'بدون عنوان' : 'Untitled hero')}</div>
            {description ? <p className="text-[11px] text-white/80 line-clamp-2">{description}</p> : null}
            {price ? <div className="text-sm font-black">{price}</div> : null}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {slide.buyNowEnabled && bi(isAr ? 'ar' : 'en', slide.buyNowEn, slide.buyNowAr) ? (
                <span className="px-2.5 py-1 rounded-full bg-white text-black text-[10px] font-bold">{bi(isAr ? 'ar' : 'en', slide.buyNowEn, slide.buyNowAr)}</span>
              ) : null}
              {slide.addToCartEnabled && bi(isAr ? 'ar' : 'en', slide.addToCartEn, slide.addToCartAr) ? (
                <span className="px-2.5 py-1 rounded-full border border-white/70 text-[10px] font-bold">{bi(isAr ? 'ar' : 'en', slide.addToCartEn, slide.addToCartAr)}</span>
              ) : null}
              {slide.learnMoreEnabled && bi(isAr ? 'ar' : 'en', slide.learnMoreEn, slide.learnMoreAr) ? (
                <span className="px-2.5 py-1 rounded-full border border-amber-200/80 text-amber-100 text-[10px] font-bold">{bi(isAr ? 'ar' : 'en', slide.learnMoreEn, slide.learnMoreAr)}</span>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const HeroBannersForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('heroBanners');
  const banners = draft?.banners || [];
  const imageOnlyBanners = draft?.imageOnlyBanners || [];
  const contentMode: HeroBannerContentMode =
    draft?.contentMode === 'image_only' || draft?.contentMode === 'both' || draft?.contentMode === 'full'
      ? draft.contentMode
      : 'full';
  const [tab, setTab] = useState<HeroTab>('content');
  const [slidePool, setSlidePool] = useState<'full' | 'image_only'>('full');
  const activePool = slidePool === 'image_only' ? imageOnlyBanners : banners;
  const [editId, setEditId] = useState<string | null>(banners[0]?.id || null);
  const editing = activePool.find((b) => b.id === editId) || activePool[0] || null;

  const patch = (id: string, p: Partial<HeroBannerSlideSettings>) => {
    if (slidePool === 'image_only') {
      setDraft({
        ...draft,
        imageOnlyBanners: imageOnlyBanners.map((b) => (b.id === id ? { ...b, ...p } : b)),
      });
      return;
    }
    setDraft({ ...draft, banners: banners.map((b) => (b.id === id ? { ...b, ...p } : b)) });
  };

  const patchDeviceStyle = (key: DeviceStyleKey, next: HeroDeviceChromeStyle) =>
    setDraft({ ...draft, [key]: next });

  const previewSlide =
    (editing?.enabled ? editing : null) ||
    activePool.find((b) => b.enabled && (b.titleEn || b.titleAr || b.image)) ||
    null;

  return (
    <CoffeeWordSettingsShell
      isAr={isAr}
      onBack={onBack}
      embedded={embedded}
      titleEn="Hero Banners"
      titleAr="بانرات الواجهة"
      subtitleEn="Two coffee sliders: image-only + full text. Per-device colors (mobile / laptop / desktop) and mobile images — Save to publish."
      subtitleAr="سلايدران للقهوة: صور فقط + نص كامل. ألوان لكل جهاز (جوال / لابتوب / سطح المكتب) وصور الجوال — احفظ للنشر."
      onSave={() => save()}
      saving={saving}
      savedFlash={savedFlash}
      preview={(device) =>
        draft?.enabled === false ? (
          <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'الواجهة مخفية في المتجر' : 'Hero is hidden on the storefront'}</div>
        ) : (
          <HeroPreviewCard slide={previewSlide} isAr={isAr} device={device} contentMode={contentMode} />
        )
      }
      settings={
        <>
          <div className="flex flex-wrap gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--border)' }} role="tablist">
            {HERO_TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  data-hero-tab={t.id}
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
          {contentMode === 'image_only' ? (
            <section className={cardCls} style={cardStyle} data-hero-panel="image-only-note">
              <p className="text-[11px] font-semibold leading-relaxed" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'الوضع الحالي: صور فقط. النص والأزرار أدناه محفوظة لكن مخفية في المتجر — غيّر الوضع من تبويب التخطيط.'
                  : 'Current mode: Images only. Text and buttons below stay saved but stay hidden on the storefront — switch mode in the Layout tab.'}
              </p>
              <button
                type="button"
                className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                onClick={() => setTab('layout')}
              >
                {isAr ? 'فتح التخطيط · اختيار الوضع' : 'Open Layout · pick mode'}
              </button>
            </section>
          ) : null}
          <section className={cardCls} style={cardStyle} data-hero-panel="content">
            <label className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--text)' }}>
              <span>{isAr ? 'تفعيل الواجهة' : 'Enable hero'}</span>
              <button
                type="button"
                onClick={() => setDraft({ ...draft, enabled: !draft?.enabled })}
                className="w-11 h-6 rounded-full p-0.5"
                style={{ background: draft?.enabled ? 'var(--portal-cta)' : 'var(--border)' }}
              >
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${draft?.enabled ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
              </button>
            </label>
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {isAr ? `الشرائح (${banners.length}) — منفصلة عن بانرات القسم المميز والبطل التجاري.` : `Slides (${banners.length}) — separate from featured section banners and commercial hero.`}
            </p>
          </section>

          <section className={cardCls} style={cardStyle} data-hero-panel="slides">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold">{isAr ? 'الشرائح' : 'Slides'}</h3>
              <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  className="px-2 py-1 rounded-md text-[10px] font-bold"
                  style={slidePool === 'full' ? { background: 'var(--portal-cta)', color: '#fff' } : { color: 'var(--text)' }}
                  onClick={() => {
                    setSlidePool('full');
                    setEditId(banners[0]?.id || null);
                  }}
                >
                  {isAr ? 'نص + أزرار' : 'Text + buttons'}
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-md text-[10px] font-bold"
                  style={slidePool === 'image_only' ? { background: 'var(--portal-cta)', color: '#fff' } : { color: 'var(--text)' }}
                  onClick={() => {
                    setSlidePool('image_only');
                    setEditId(imageOnlyBanners[0]?.id || null);
                  }}
                >
                  {isAr ? 'صور فقط' : 'Images only'}
                </button>
              </div>
              <button
                type="button"
                className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                onClick={() => {
                  const row = blankSlide();
                  if (slidePool === 'image_only') {
                    setDraft({ ...draft, enabled: true, imageOnlyBanners: [...imageOnlyBanners, row] });
                  } else {
                    setDraft({ ...draft, enabled: true, banners: [...banners, row] });
                  }
                  setEditId(row.id);
                }}
              >
                + {isAr ? 'إضافة شريحة' : 'Add slide'}
              </button>
            </div>
            {activePool.length === 0 ? <p className="text-xs text-slate-400">{isAr ? 'لا شرائح. الهيرو يختفي.' : 'No slides. The hero hides.'}</p> : null}
            <ul className="space-y-2">
              {activePool.map((b, index) => (
                <li
                  key={`${b.id}-${index}`}
                  className="flex items-center gap-2 rounded-xl border px-2 py-2 cursor-pointer"
                  style={{
                    borderColor: editId === b.id ? 'var(--portal-cta)' : 'var(--border)',
                    background: editId === b.id ? 'color-mix(in srgb, var(--portal-cta) 8%, var(--surface))' : 'var(--surface)',
                  }}
                  onClick={() => {
                    setEditId(b.id);
                    window.dispatchEvent(new CustomEvent('unityteck-preview-focus', { detail: { section: 'C-HERO', index } }));
                  }}
                >
                  <span className="text-[11px] font-bold text-slate-500 w-5 shrink-0">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate">
                      {slidePool === 'image_only'
                        ? (b.image ? (isAr ? 'شريحة صورة' : 'Image slide') : (isAr ? 'بدون صورة' : 'No image'))
                        : (bi(isAr ? 'ar' : 'en', b.titleEn, b.titleAr) || (isAr ? 'بدون عنوان' : 'Untitled'))}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{bi(isAr ? 'ar' : 'en', b.promoEn, b.promoAr)}</div>
                  </div>
                  <button type="button" className="p-1.5 rounded-lg border border-slate-200 bg-white shrink-0" onClick={(e) => { e.stopPropagation(); setEditId(b.id); window.dispatchEvent(new CustomEvent('unityteck-preview-focus', { detail: { section: 'C-HERO', index } })); }} aria-label={isAr ? 'تعديل' : 'Edit'}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg border border-slate-200 bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      const copy = { ...b, id: `hero-${Date.now()}` };
                      if (slidePool === 'image_only') {
                        const next = [...imageOnlyBanners];
                        next.splice(index + 1, 0, copy);
                        setDraft({ ...draft, imageOnlyBanners: next });
                      } else {
                        const next = [...banners];
                        next.splice(index + 1, 0, copy);
                        setDraft({ ...draft, banners: next });
                      }
                      setEditId(copy.id);
                    }}
                    aria-label={isAr ? 'نسخ' : 'Duplicate'}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg border border-rose-200 bg-white text-rose-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (slidePool === 'image_only') {
                        const next = imageOnlyBanners.filter((x) => x.id !== b.id);
                        setDraft({ ...draft, imageOnlyBanners: next });
                        if (editId === b.id) setEditId(next[0]?.id || null);
                      } else {
                        const next = banners.filter((x) => x.id !== b.id);
                        setDraft({ ...draft, banners: next });
                        if (editId === b.id) setEditId(next[0]?.id || null);
                      }
                    }}
                    aria-label={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {editing ? (
            <section className={cardCls}>
              <h3 className="text-sm font-bold">{isAr ? 'تعديل الشريحة' : 'Edit slide'}</h3>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input type="checkbox" checked={editing.enabled} onChange={(e) => patch(editing.id, { enabled: e.target.checked })} />
                {isAr ? 'ظاهرة' : 'Visible'}
              </label>
              <MediaUploadField
                label={isAr ? 'صورة الشريحة (مكتبة أو رفع محلي)' : 'Slide image (library or local upload)'}
                value={editing.image}
                onChange={(url) => patch(editing.id, { image: url })}
                altText={isAr ? (editing.altAr || editing.titleAr) : (editing.altEn || editing.titleEn)}
                onAltTextChange={(alt) => patch(editing.id, isAr ? { altAr: alt } : { altEn: alt })}
                aspectRatio="banner"
                initialFolder="banners"
                recommendedSize="1920 × 800 px"
              />
              <MediaUploadField
                label={isAr ? 'صورة الجهاز اللوحي (اختياري)' : 'Tablet image (optional)'}
                value={editing.tabletImage || ''}
                onChange={(url) => patch(editing.id, { tabletImage: url })}
                aspectRatio="banner"
                initialFolder="banners"
                recommendedSize="1200 × 900 px"
              />
              <MediaUploadField
                label={isAr ? 'صورة الجوال (اختياري)' : 'Mobile image (optional)'}
                value={editing.mobileImage || ''}
                onChange={(url) => patch(editing.id, { mobileImage: url })}
                aspectRatio="banner"
                initialFolder="banners"
                recommendedSize="750 × 1100 px"
              />
              <div className="grid grid-cols-1 gap-2">
                <label className="space-y-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  <span>{isAr ? 'النص الترويجي' : 'Promo'}</span>
                  <input className={inputCls} style={inputStyle} dir="auto" maxLength={100} placeholder={isAr ? 'اكتب النص بأي لغة' : 'Type in any language'} value={editing.promoEn || editing.promoAr || ''} onChange={(e) => patch(editing.id, { promoEn: e.target.value, promoAr: e.target.value })} />
                </label>
                <label className="space-y-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  <span>{isAr ? 'العنوان' : 'Title'}</span>
                  <input className={inputCls} style={inputStyle} dir="auto" maxLength={100} placeholder={isAr ? 'اكتب النص بأي لغة' : 'Type in any language'} value={editing.titleEn || editing.titleAr || ''} onChange={(e) => patch(editing.id, { titleEn: e.target.value, titleAr: e.target.value })} />
                </label>
                <label className="space-y-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  <span>{isAr ? 'الوصف' : 'Description'}</span>
                  <input className={inputCls} style={inputStyle} dir="auto" maxLength={200} placeholder={isAr ? 'اكتب النص بأي لغة' : 'Type in any language'} value={editing.descriptionEn || editing.descriptionAr || ''} onChange={(e) => patch(editing.id, { descriptionEn: e.target.value, descriptionAr: e.target.value })} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  <span>{isAr ? 'السعر' : 'Price'}</span>
                  <input className={inputCls} style={inputStyle} value={editing.price} onChange={(e) => patch(editing.id, { price: e.target.value })} />
                </label>
                <label className="space-y-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  <span>{isAr ? 'معرّف المنتج' : 'Product ID'}</span>
                  <input className={inputCls} style={inputStyle} dir="ltr" value={editing.productId} onChange={(e) => patch(editing.id, { productId: e.target.value })} />
                </label>
              </div>
              <label className="flex items-center gap-2 text-[11px] font-semibold">
                <input type="checkbox" checked={editing.showPrice} onChange={(e) => patch(editing.id, { showPrice: e.target.checked })} />
                {isAr ? 'إظهار السعر' : 'Show price'}
              </label>
              <div className="space-y-2 rounded-xl border p-3" style={{ borderColor: 'var(--border)' }} data-hero-panel="ctas">
                <p className="text-[11px] font-bold">{isAr ? 'أزرار الدعوة' : 'Call-to-action buttons'}</p>
                <label className="flex items-center gap-2 text-[11px] font-semibold">
                  <input type="checkbox" checked={!!editing.buyNowEnabled} onChange={(e) => patch(editing.id, { buyNowEnabled: e.target.checked })} />
                  {isAr ? 'اشترِ الآن' : 'Buy now'}
                </label>
                {editing.buyNowEnabled ? (
                  <input
                    className={inputCls}
                    style={inputStyle}
                    dir="auto"
                    placeholder={isAr ? 'نص الزر بأي لغة' : 'Button text — any language'}
                    value={editing.buyNowEn || editing.buyNowAr || ''}
                    onChange={(e) => patch(editing.id, { buyNowEn: e.target.value, buyNowAr: e.target.value })}
                  />
                ) : null}
                <label className="flex items-center gap-2 text-[11px] font-semibold">
                  <input type="checkbox" checked={!!editing.addToCartEnabled} onChange={(e) => patch(editing.id, { addToCartEnabled: e.target.checked })} />
                  {isAr ? 'أضف إلى السلة' : 'Add to cart'}
                </label>
                {editing.addToCartEnabled ? (
                  <input
                    className={inputCls}
                    style={inputStyle}
                    dir="auto"
                    placeholder={isAr ? 'نص الزر بأي لغة' : 'Button text — any language'}
                    value={editing.addToCartEn || editing.addToCartAr || ''}
                    onChange={(e) => patch(editing.id, { addToCartEn: e.target.value, addToCartAr: e.target.value })}
                  />
                ) : null}
                <label className="flex items-center gap-2 text-[11px] font-semibold">
                  <input type="checkbox" checked={!!editing.learnMoreEnabled} onChange={(e) => patch(editing.id, { learnMoreEnabled: e.target.checked })} />
                  {isAr ? 'تعرف على المزيد' : 'Learn more'}
                </label>
                {editing.learnMoreEnabled ? (
                  <div className="space-y-2">
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir="auto"
                      placeholder={isAr ? 'نص الزر بأي لغة' : 'Button text — any language'}
                      value={editing.learnMoreEn || editing.learnMoreAr || ''}
                      onChange={(e) => patch(editing.id, { learnMoreEn: e.target.value, learnMoreAr: e.target.value })}
                    />
                    <input className={inputCls} style={inputStyle} dir="ltr" placeholder={isAr ? 'رابط الزر' : 'Button URL'} value={editing.learnMoreUrl || ''} onChange={(e) => patch(editing.id, { learnMoreUrl: e.target.value })} />
                  </div>
                ) : null}
                <label className="flex items-center gap-2 text-[11px] font-semibold">
                  <input type="checkbox" checked={!!editing.customOrderEnabled} onChange={(e) => patch(editing.id, { customOrderEnabled: e.target.checked })} />
                  {isAr ? 'زر تفصيل حسب الطلب' : 'Custom-order button'}
                </label>
                {editing.customOrderEnabled ? (
                  <div className="space-y-2">
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir="auto"
                      placeholder={isAr ? 'نص الزر (مثال: تفصيل حسب الطلب)' : 'Button text (e.g. Custom Made to Order)'}
                      value={editing.customOrderEn || editing.customOrderAr || ''}
                      onChange={(e) => patch(editing.id, { customOrderEn: e.target.value, customOrderAr: e.target.value })}
                    />
                    <p className="text-[10px] font-medium leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {isAr
                        ? 'الضغط يفتح واتساب على الرقم المحفوظ في إعدادات المتجر ← هوية المتجر / رقم واتساب.'
                        : 'Click opens WhatsApp to the number saved in Store Settings → Store Identity / WhatsApp.'}
                    </p>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir="ltr"
                      placeholder={isAr ? 'اختياري: رابط واتساب wa.me (تجاوز)' : 'Optional: wa.me override URL'}
                      value={editing.customOrderUrl || ''}
                      onChange={(e) => patch(editing.id, { customOrderUrl: e.target.value })}
                    />
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
          </>
          ) : null}

          {tab === 'style' ? (
            <div className="space-y-3.5" data-hero-panel="style">
              <section className={cardCls} style={cardStyle}>
                <label className="flex items-center gap-2 text-[11px] font-semibold">
                  <input type="checkbox" checked={draft?.autoplay !== false} onChange={(e) => setDraft({ ...draft, autoplay: e.target.checked })} />
                  {isAr ? 'تشغيل تلقائي' : 'Autoplay'}
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'المدة (مللي ثانية)' : 'Interval (ms)'}</span>
                  <input type="number" min={2000} className={inputCls} style={inputStyle} value={draft?.intervalMs || 5000} onChange={(e) => setDraft({ ...draft, intervalMs: Number(e.target.value) || 5000 })} />
                </label>
                <label className="flex items-center gap-2 text-[11px] font-semibold">
                  <input type="checkbox" checked={draft?.showArrows !== false} onChange={(e) => setDraft({ ...draft, showArrows: e.target.checked })} />
                  {isAr ? 'إظهار الأسهم' : 'Show arrows'}
                </label>
                <label className="flex items-center gap-2 text-[11px] font-semibold">
                  <input type="checkbox" checked={draft?.showDots !== false} onChange={(e) => setDraft({ ...draft, showDots: e.target.checked })} />
                  {isAr ? 'إظهار النقاط' : 'Show dots'}
                </label>
              </section>

              <section className={cardCls} style={cardStyle} data-hero-panel="device-colors">
                <h3 className="text-sm font-bold">{isAr ? 'ألوان النص والأزرار حسب الجهاز' : 'Text & button colors by device'}</h3>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'للسلايدر الذي فيه نص وأزرار: غيّر الألوان للجوال واللابتوب وسطح المكتب بشكل منفصل.'
                    : 'For the text+buttons slider: set colors separately for mobile, laptop, and desktop.'}
                </p>
                <DeviceChromeEditor
                  isAr={isAr}
                  title={isAr ? 'الجوال' : 'Mobile'}
                  value={draft?.styleMobile || emptyHeroDeviceStyle()}
                  onChange={(next) => patchDeviceStyle('styleMobile', next)}
                />
                <DeviceChromeEditor
                  isAr={isAr}
                  title={isAr ? 'اللابتوب / الجهاز اللوحي' : 'Laptop / tablet'}
                  value={draft?.styleLaptop || emptyHeroDeviceStyle()}
                  onChange={(next) => patchDeviceStyle('styleLaptop', next)}
                />
                <DeviceChromeEditor
                  isAr={isAr}
                  title={isAr ? 'سطح المكتب' : 'Desktop'}
                  value={draft?.styleDesktop || emptyHeroDeviceStyle()}
                  onChange={(next) => patchDeviceStyle('styleDesktop', next)}
                />
              </section>
            </div>
          ) : null}

          {tab === 'layout' ? (
            <section className={cardCls} style={cardStyle} data-hero-panel="layout">
              <div className="space-y-2" data-hero-panel="content-mode">
                <h3 className="text-sm font-bold">{isAr ? 'وضع السلايدر' : 'Slider mode'}</h3>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'ثلاث خيارات: صور فقط، نص كامل، أو الاثنان معاً في الصفحة الرئيسية.'
                    : 'Three options: images only, full text, or both stacked on the home page.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CONTENT_MODES.map((mode) => {
                    const active = contentMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        data-hero-mode={mode.id}
                        aria-pressed={active}
                        onClick={() => setDraft({ ...draft, contentMode: mode.id })}
                        className="rounded-xl border p-3 text-start transition-all"
                        style={{
                          borderColor: active ? 'var(--portal-cta)' : 'var(--border)',
                          background: active
                            ? 'color-mix(in srgb, var(--portal-cta) 10%, var(--surface))'
                            : 'var(--surface)',
                          boxShadow: active ? '0 0 0 1px color-mix(in srgb, var(--portal-cta) 35%, transparent)' : undefined,
                        }}
                      >
                        <div className="text-xs font-black" style={{ color: 'var(--text)' }}>
                          {isAr ? mode.ar : mode.en}
                        </div>
                        <div className="mt-1 text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                          {isAr ? mode.descAr : mode.descEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {contentMode === 'both' ? (
                  <p className="text-[10px] font-medium leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'سيظهر سلايدر الصور أولاً ثم سلايدر النص. عدّل كل مجموعة من تبويب المحتوى.'
                      : 'Image-only slider renders first, then the text slider. Edit each set in the Content tab.'}
                  </p>
                ) : null}
              </div>

              <label className="flex items-center gap-2 text-[11px] font-semibold">
                <input
                  type="checkbox"
                  checked={!!draft?.showWhatsapp}
                  disabled={contentMode === 'image_only'}
                  onChange={(e) => setDraft({ ...draft, showWhatsapp: e.target.checked })}
                />
                {isAr ? 'إظهار واتساب في الواجهة' : 'Show WhatsApp on hero'}
              </label>
              {draft?.showWhatsapp && contentMode !== 'image_only' ? (
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'رقم واتساب' : 'WhatsApp number'}</span>
                  <input className={inputCls} style={{ ...inputStyle, opacity: 0.9, cursor: 'default' }} dir="ltr" value={draft?.whatsappNumber || ''} readOnly placeholder={isAr ? 'من هوية المتجر' : 'From Store Identity'} />
                  <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'يُحدَّث تلقائياً من رقم واتساب في هوية المتجر' : 'Auto-synced from Store Identity WhatsApp'}
                  </span>
                </label>
              ) : null}
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                {isAr ? 'صور سطح المكتب / اللوحي / الجوال لكل شريحة من تبويب المحتوى.' : 'Desktop / tablet / mobile images per slide are set in the Content tab.'}
              </p>
            </section>
          ) : null}
        </>
      }
    />
  );
};
