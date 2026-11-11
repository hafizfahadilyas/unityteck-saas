import React, { useState } from 'react';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { bi, type HeroBannerSlideSettings } from '../../../../themes/settings/coffeeModularSettings';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import { safeFeatureImage } from '../../../../themes/coffeeRoasters/components/CoffeeFeatureIconsBar';
import { MediaUploadField } from '../../../common/MediaUploadField';

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-[#2563EB]';
const cardCls = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3';

function blankSlide(): HeroBannerSlideSettings {
  return {
    id: `hero-${Date.now()}`,
    enabled: true,
    image: '',
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
}: {
  slide: HeroBannerSlideSettings | null;
  isAr: boolean;
  device: PreviewDevice;
}) {
  if (!slide) {
    return <div className="p-6 text-center text-[11px] text-slate-400">{isAr ? 'لا شريحة للمعاينة' : 'No slide to preview'}</div>;
  }
  const image = safeFeatureImage(slide.image);
  const promo = bi(isAr ? 'ar' : 'en', slide.promoEn, slide.promoAr);
  const title = bi(isAr ? 'ar' : 'en', slide.titleEn, slide.titleAr);
  const description = bi(isAr ? 'ar' : 'en', slide.descriptionEn, slide.descriptionAr);
  const price = slide.showPrice && slide.price ? (isAr ? `${slide.price}ر.س` : `${slide.currency || 'SAR'} ${slide.price}`) : '';
  const height = device === 'mobile' ? 220 : device === 'tablet' ? 200 : 240;

  return (
    <div className="relative overflow-hidden bg-neutral-900 text-white" style={{ minHeight: height }}>
      {image ? <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" /> : null}
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
    </div>
  );
}

export const HeroBannersForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('heroBanners');
  const banners = draft?.banners || [];
  const [editId, setEditId] = useState<string | null>(banners[0]?.id || null);
  const editing = banners.find((b) => b.id === editId) || banners[0] || null;

  const patch = (id: string, p: Partial<HeroBannerSlideSettings>) =>
    setDraft({ ...draft, banners: banners.map((b) => (b.id === id ? { ...b, ...p } : b)) });

  const previewSlide = (editing?.enabled ? editing : null) || banners.find((b) => b.enabled && (b.titleEn || b.titleAr || b.image)) || null;

  return (
    <CoffeeWordSettingsShell
      isAr={isAr}
      onBack={onBack}
      embedded={embedded}
      titleEn="Hero Banners"
      titleAr="بانرات الهيرو"
      subtitleEn="Slides publish to the storefront hero after Save. Leave images and CTAs empty until you set real content."
      subtitleAr="الشرائح تُنشر إلى هيرو المتجر بعد الحفظ. اترك الصور والأزرار فارغة حتى تضيف محتوى حقيقيًا."
      onSave={() => save()}
      saving={saving}
      savedFlash={savedFlash}
      preview={(device) =>
        draft?.enabled === false ? (
          <div className="p-6 text-center text-[11px] text-slate-400">{isAr ? 'الهيرو مخفي في المتجر' : 'Hero is hidden on the storefront'}</div>
        ) : (
          <HeroPreviewCard slide={previewSlide} isAr={isAr} device={device} />
        )
      }
      settings={
        <>
          <section className={cardCls}>
            <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{isAr ? 'تفعيل الهيرو' : 'Enable hero'}</span>
              <button
                type="button"
                onClick={() => setDraft({ ...draft, enabled: !draft?.enabled })}
                className={`w-11 h-6 rounded-full p-0.5 ${draft?.enabled ? 'bg-[#2563EB]' : 'bg-slate-300'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${draft?.enabled ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
              </button>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                <input type="checkbox" checked={!!draft?.autoplay} onChange={(e) => setDraft({ ...draft, autoplay: e.target.checked })} />
                {isAr ? 'تشغيل تلقائي' : 'Autoplay'}
              </label>
              <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                <span>{isAr ? 'المدة (مللي ثانية)' : 'Interval (ms)'}</span>
                <input type="number" min={2000} className={inputCls} value={draft?.intervalMs || 5000} onChange={(e) => setDraft({ ...draft, intervalMs: Number(e.target.value) || 5000 })} />
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              {isAr ? `الشرائح — منفصلة عن بانرات القسم المميز.` : `Slides (${banners.length}) — separate from featured section banners.`}
            </p>
          </section>

          <section className={cardCls}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{isAr ? 'الشرائح' : 'Slides'}</h3>
              <button
                type="button"
                className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold"
                onClick={() => {
                  const row = blankSlide();
                  setDraft({ ...draft, enabled: true, banners: [...banners, row] });
                  setEditId(row.id);
                }}
              >
                + {isAr ? 'إضافة شريحة' : 'Add slide'}
              </button>
            </div>
            {banners.length === 0 ? <p className="text-xs text-slate-400">{isAr ? 'لا شرائح. الهيرو يختفي.' : 'No slides. The hero hides.'}</p> : null}
            <ul className="space-y-2">
              {banners.map((b, index) => (
                <li
                  key={`${b.id}-${index}`}
                  className={`flex items-center gap-2 rounded-xl border px-2 py-2 cursor-pointer ${editId === b.id ? 'border-[#2563EB] bg-blue-50/40' : 'border-slate-200 bg-slate-50'}`}
                  onClick={() => {
                    setEditId(b.id);
                    window.dispatchEvent(new CustomEvent('unityteck-preview-focus', { detail: { section: 'C-HERO', index } }));
                  }}
                >
                  <span className="text-[11px] font-bold text-slate-500 w-5 shrink-0">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate">{bi(isAr ? 'ar' : 'en', b.titleEn, b.titleAr) || (isAr ? 'بدون عنوان' : 'Untitled')}</div>
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
                      const next = [...banners];
                      next.splice(index + 1, 0, copy);
                      setDraft({ ...draft, banners: next });
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
                      const next = banners.filter((x) => x.id !== b.id);
                      setDraft({ ...draft, banners: next });
                      if (editId === b.id) setEditId(next[0]?.id || null);
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
                label={isAr ? 'صورة الجوال (اختياري)' : 'Mobile image (optional)'}
                value={editing.mobileImage || ''}
                onChange={(url) => patch(editing.id, { mobileImage: url })}
                aspectRatio="banner"
                initialFolder="banners"
                recommendedSize="750 × 1100 px"
              />
              <div className="grid grid-cols-1 gap-2">
                <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                  <span>{isAr ? 'النص الترويجي' : 'Promo'}</span>
                  <input
                    className={inputCls}
                    dir={isAr ? 'rtl' : 'ltr'}
                    maxLength={100}
                    value={isAr ? editing.promoAr : editing.promoEn}
                    onChange={(e) => patch(editing.id, isAr ? { promoAr: e.target.value } : { promoEn: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                  <span>{isAr ? 'العنوان' : 'Title'}</span>
                  <input
                    className={inputCls}
                    dir={isAr ? 'rtl' : 'ltr'}
                    maxLength={100}
                    value={isAr ? editing.titleAr : editing.titleEn}
                    onChange={(e) => patch(editing.id, isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                  <span>{isAr ? 'الوصف' : 'Description'}</span>
                  <input
                    className={inputCls}
                    dir={isAr ? 'rtl' : 'ltr'}
                    maxLength={200}
                    value={isAr ? editing.descriptionAr : editing.descriptionEn}
                    onChange={(e) =>
                      patch(editing.id, isAr ? { descriptionAr: e.target.value } : { descriptionEn: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                  <span>{isAr ? 'السعر' : 'Price'}</span>
                  <input className={inputCls} value={editing.price} onChange={(e) => patch(editing.id, { price: e.target.value })} />
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                  <span>{isAr ? 'معرّف المنتج' : 'Product ID'}</span>
                  <input className={inputCls} dir="ltr" value={editing.productId} onChange={(e) => patch(editing.id, { productId: e.target.value })} />
                </label>
              </div>
              <label className="flex items-center gap-2 text-[11px] font-semibold">
                <input type="checkbox" checked={editing.showPrice} onChange={(e) => patch(editing.id, { showPrice: e.target.checked })} />
                {isAr ? 'إظهار السعر' : 'Show price'}
              </label>
              <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-bold text-slate-700">{isAr ? 'أزرار الدعوة' : 'Call-to-action buttons'}</p>
                <label className="flex items-center gap-2 text-[11px] font-semibold">
                  <input type="checkbox" checked={!!editing.buyNowEnabled} onChange={(e) => patch(editing.id, { buyNowEnabled: e.target.checked })} />
                  {isAr ? 'اشترِ الآن' : 'Buy now'}
                </label>
                {editing.buyNowEnabled ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input className={inputCls} dir="ltr" placeholder={isAr ? 'نص إنجليزي' : 'English label'} value={editing.buyNowEn || ''} onChange={(e) => patch(editing.id, { buyNowEn: e.target.value })} />
                    <input className={inputCls} dir="rtl" placeholder={isAr ? 'نص عربي' : 'Arabic label'} value={editing.buyNowAr || ''} onChange={(e) => patch(editing.id, { buyNowAr: e.target.value })} />
                  </div>
                ) : null}
                <label className="flex items-center gap-2 text-[11px] font-semibold">
                  <input type="checkbox" checked={!!editing.addToCartEnabled} onChange={(e) => patch(editing.id, { addToCartEnabled: e.target.checked })} />
                  {isAr ? 'أضف إلى السلة' : 'Add to cart'}
                </label>
                {editing.addToCartEnabled ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input className={inputCls} dir="ltr" placeholder={isAr ? 'نص إنجليزي' : 'English label'} value={editing.addToCartEn || ''} onChange={(e) => patch(editing.id, { addToCartEn: e.target.value })} />
                    <input className={inputCls} dir="rtl" placeholder={isAr ? 'نص عربي' : 'Arabic label'} value={editing.addToCartAr || ''} onChange={(e) => patch(editing.id, { addToCartAr: e.target.value })} />
                  </div>
                ) : null}
                <label className="flex items-center gap-2 text-[11px] font-semibold">
                  <input type="checkbox" checked={!!editing.learnMoreEnabled} onChange={(e) => patch(editing.id, { learnMoreEnabled: e.target.checked })} />
                  {isAr ? 'تعرف على المزيد' : 'Learn more'}
                </label>
                {editing.learnMoreEnabled ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input className={inputCls} dir="ltr" placeholder={isAr ? 'نص إنجليزي' : 'English label'} value={editing.learnMoreEn || ''} onChange={(e) => patch(editing.id, { learnMoreEn: e.target.value })} />
                    <input className={inputCls} dir="rtl" placeholder={isAr ? 'نص عربي' : 'Arabic label'} value={editing.learnMoreAr || ''} onChange={(e) => patch(editing.id, { learnMoreAr: e.target.value })} />
                    <input className={`${inputCls} md:col-span-2`} dir="ltr" placeholder={isAr ? 'رابط الزر' : 'Button URL'} value={editing.learnMoreUrl || ''} onChange={(e) => patch(editing.id, { learnMoreUrl: e.target.value })} />
                  </div>
                ) : null}
                <label className="flex items-center gap-2 text-[11px] font-semibold">
                  <input type="checkbox" checked={!!editing.customOrderEnabled} onChange={(e) => patch(editing.id, { customOrderEnabled: e.target.checked })} />
                  {isAr ? 'طلب مخصص' : 'Custom order'}
                </label>
                {editing.customOrderEnabled ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input className={inputCls} dir="ltr" placeholder={isAr ? 'نص إنجليزي' : 'English label'} value={editing.customOrderEn || ''} onChange={(e) => patch(editing.id, { customOrderEn: e.target.value })} />
                    <input className={inputCls} dir="rtl" placeholder={isAr ? 'نص عربي' : 'Arabic label'} value={editing.customOrderAr || ''} onChange={(e) => patch(editing.id, { customOrderAr: e.target.value })} />
                    <input className={`${inputCls} md:col-span-2`} dir="ltr" placeholder={isAr ? 'رابط الطلب المخصص' : 'Custom order URL'} value={editing.customOrderUrl || ''} onChange={(e) => patch(editing.id, { customOrderUrl: e.target.value })} />
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </>
      }
    />
  );
};
