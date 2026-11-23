import React, { useEffect, useState } from 'react';
import { MediaUploadField } from '../../../common/MediaUploadField';
import {
  AddButton,
  BiFields,
  EnableRow,
  RowTools,
  cardCls,
  cardStyle,
  duplicateAt,
  moveItem,
  useCoffeeDraft,
} from './coffeeFormKit';
import type {
  FeaturedSectionBanner,
  ImageBannerItem,
  FooterColumn,
  CustomOrderField,
} from '../../../../themes/settings/coffeeModularSettings';
import { bi } from '../../../../themes/settings/coffeeModularSettings';
import type { BannerItem } from '../../../../themes/settings/themeSettingsStore';
import { fetchProducts, updateProduct, fetchStoreReviewsApi, saveStoreReviewsApi, type StoreReviewRecord } from '../../../../api/tenantApi';
import type { Product } from '../../../../types';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import { safeFeatureImage } from '../../../../themes/coffeeRoasters/components/CoffeeFeatureIconsBar';
import { useTenant } from '../../../../context/TenantContext';
import { normalizeProductSource } from '../../../../themes/coffeeRoasters/components/coffeeProductSourceLogic';
import { CoffeeProductSourceControl } from './CoffeeProductSourceControl';

export { CoffeeFeaturesForm } from './CoffeeFeatureIconsForm';
export { HeroBannersForm } from './CoffeeHeroBannersForm';

function LinesPreview({
  title,
  lines,
  image,
}: {
  device: PreviewDevice;
  title: string;
  lines: string[];
  image?: string;
}) {
  const src = safeFeatureImage(image);
  return (
    <div className="p-3 space-y-1.5 bg-[#F8FAFC]">
      {src ? <img src={src} alt="" className="w-full h-24 object-cover rounded-lg" /> : null}
      <div className="text-xs font-bold text-slate-900">{title || '—'}</div>
      {lines.filter(Boolean).slice(0, 6).map((line, i) => (
        <div key={i} className="text-[11px] text-slate-500 truncate">{line}</div>
      ))}
    </div>
  );
}

function wordForm(
  chrome: CoffeeFormChromeProps & {
    isAr: boolean;
    titleEn: string;
    titleAr: string;
    subtitleEn: string;
    subtitleAr: string;
    onSave: (e?: React.FormEvent) => void;
    saving: boolean;
    savedFlash: boolean;
    preview: (device: PreviewDevice) => React.ReactNode;
  },
  children: React.ReactNode,
) {
  return (
    <CoffeeWordSettingsShell
      isAr={chrome.isAr}
      onBack={chrome.onBack}
      embedded={chrome.embedded}
      titleEn={chrome.titleEn}
      titleAr={chrome.titleAr}
      subtitleEn={chrome.subtitleEn}
      subtitleAr={chrome.subtitleAr}
      onSave={() => chrome.onSave()}
      saving={chrome.saving}
      savedFlash={chrome.savedFlash}
      settings={<div className="space-y-4">{children}</div>}
      preview={chrome.preview}
    />
  );
}

export { FeaturedCategoriesProductsForm } from './CoffeeCategoryShowcaseForm';

export const FeaturedSectionBannersForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('featuredSectionBanners');
  const banners = draft?.banners || [];
  const patch = (id: string, p: Partial<FeaturedSectionBanner>) =>
    setDraft({ ...draft, banners: banners.map((b) => (b.id === id ? { ...b, ...p } : b)) });

  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Featured Section Banners',
    titleAr: 'بانرات القسم المميز',
    subtitleEn: 'Flagship promo cards. The storefront updates after Save.',
    subtitleAr: 'بطاقات القسم المميز. المتجر يتحدّث بعد الحفظ.',
    preview: () => (
        <LinesPreview device="desktop" title={bi(isAr ? 'ar' : 'en', draft?.titleEn, draft?.titleAr)} lines={(banners || []).filter((b) => b.enabled).map((b) => bi(isAr ? 'ar' : 'en', b.titleEn, b.titleAr))} image={(banners || [])[0]?.images?.[0]} />
      ),
  }, (
    <>
      <div data-fsb-panel="content" className="space-y-3">
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <BiFields isAr={isAr} labelEn="Section title" labelAr="عنوان القسم" en={draft?.titleEn || ''} ar={draft?.titleAr || ''} onEn={(v) => setDraft({ ...draft, titleEn: v })} onAr={(v) => setDraft({ ...draft, titleAr: v })} />
      <BiFields isAr={isAr} labelEn="Subtitle" labelAr="الوصف" en={draft?.subtitleEn || ''} ar={draft?.subtitleAr || ''} onEn={(v) => setDraft({ ...draft, subtitleEn: v })} onAr={(v) => setDraft({ ...draft, subtitleAr: v })} />
      <div className="grid grid-cols-3 gap-2 text-[11px] font-bold" data-fsb-panel="heights">
        <label className="space-y-1">
          <span>{isAr ? 'ارتفاع سطح المكتب' : 'Desktop height'}</span>
          <select className="w-full px-2 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} value={draft?.heightDesktop ?? 420} onChange={(e) => setDraft({ ...draft, heightDesktop: Number(e.target.value) })}>
            {[320, 380, 420, 480, 560].map((n) => <option key={n} value={n}>{n}px</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span>{isAr ? 'ارتفاع اللوحي' : 'Tablet height'}</span>
          <select className="w-full px-2 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} value={draft?.heightTablet ?? 360} onChange={(e) => setDraft({ ...draft, heightTablet: Number(e.target.value) })}>
            {[280, 320, 360, 400].map((n) => <option key={n} value={n}>{n}px</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span>{isAr ? 'ارتفاع الجوال' : 'Mobile height'}</span>
          <select className="w-full px-2 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} value={draft?.heightMobile ?? 280} onChange={(e) => setDraft({ ...draft, heightMobile: Number(e.target.value) })}>
            {[220, 260, 280, 320].map((n) => <option key={n} value={n}>{n}px</option>)}
          </select>
        </label>
      </div>
      {banners.length === 0 && <p className="text-xs text-muted">{isAr ? 'لا بانرات مميزة. القسم يختفي.' : 'No featured banners. The section hides.'}</p>}
      {banners.map((b, index) => (
        <div key={b.id} className={cardCls} style={{ ...cardStyle, background: b.bgColor || 'var(--surface)' }} data-fsb-banner>
          <div className="flex justify-between gap-2">
            <EnableRow isAr={isAr} enabled={b.enabled} onChange={(v) => patch(b.id, { enabled: v })} labelEn="Banner" labelAr="البانر" />
            <RowTools isAr={isAr} visible={b.enabled !== false} onToggleVisible={() => patch(b.id, { enabled: b.enabled === false })} index={index} total={banners.length} onUp={() => setDraft({ ...draft, banners: moveItem(banners, index, -1) })} onDown={() => setDraft({ ...draft, banners: moveItem(banners, index, 1) })} onDuplicate={() => setDraft({ ...draft, banners: duplicateAt(banners, index, 'fsb') })} onDelete={() => setDraft({ ...draft, banners: banners.filter((x) => x.id !== b.id) })} />
          </div>
          <label className="text-[11px] font-bold flex items-center gap-2">
            {isAr ? 'لون الخلفية' : 'Background'}
            <input type="color" value={b.bgColor || '#F5EADA'} onChange={(e) => patch(b.id, { bgColor: e.target.value })} />
            <input value={b.bgColor} onChange={(e) => patch(b.id, { bgColor: e.target.value })} className="px-2 py-1 rounded-lg border text-xs w-28" style={{ borderColor: 'var(--border)' }} />
          </label>
          <div className="space-y-2">
            <MediaUploadField
              label={isAr ? 'الصورة الرئيسية (مكتبة / رفع)' : 'Primary image (library / upload)'}
              value={(b.images || [])[0] || ''}
              onChange={(url) => {
                const rest = (b.images || []).slice(1);
                patch(b.id, { images: url ? [url, ...rest] : rest });
              }}
              aspectRatio="banner"
              initialFolder="banners"
              recommendedSize="1200 × 800 px"
            />
            <MediaUploadField
              label={isAr ? 'صورة إضافية (اختياري)' : 'Extra image (optional)'}
              value={(b.images || [])[1] || ''}
              onChange={(url) => {
                const primary = (b.images || [])[0] || '';
                const next = [primary, url].filter(Boolean);
                patch(b.id, { images: next });
              }}
              aspectRatio="banner"
              initialFolder="banners"
            />
          </div>
          <BiFields isAr={isAr} labelEn="Headline" labelAr="العنوان" en={b.promoEn} ar={b.promoAr} max={100} onEn={(v) => patch(b.id, { promoEn: v })} onAr={(v) => patch(b.id, { promoAr: v })} />
          <BiFields isAr={isAr} labelEn="Product title" labelAr="اسم المنتج" en={b.titleEn} ar={b.titleAr} max={100} onEn={(v) => patch(b.id, { titleEn: v })} onAr={(v) => patch(b.id, { titleAr: v })} />
          <BiFields isAr={isAr} labelEn="Description" labelAr="الوصف" en={b.descriptionEn} ar={b.descriptionAr} max={200} onEn={(v) => patch(b.id, { descriptionEn: v })} onAr={(v) => patch(b.id, { descriptionAr: v })} />
          <label className="text-[11px] font-bold block space-y-1">
            <span>{isAr ? 'معرّف المنتج (رابط الشراء)' : 'Product ID (buy link)'}</span>
            <input
              value={b.productId || ''}
              onChange={(e) => patch(b.id, { productId: e.target.value })}
              placeholder="hb-h10a-dualboiler"
              className="w-full px-2 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: 'var(--border)' }}
              dir="ltr"
            />
          </label>
          <label className="flex items-center gap-2 text-[11px] font-bold">
            <input type="checkbox" checked={b.showPrice} onChange={(e) => patch(b.id, { showPrice: e.target.checked })} />
            {isAr ? 'إظهار السعر' : 'Show price'}
            <input value={b.price} onChange={(e) => patch(b.id, { price: e.target.value })} className="px-2 py-1 rounded-lg border w-24" style={{ borderColor: 'var(--border)' }} />
          </label>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <label className="font-bold space-y-1">
              <span>{isAr ? 'محاذاة النص' : 'Text align'}</span>
              <select
                value={b.align || 'left'}
                onChange={(e) => patch(b.id, { align: e.target.value as FeaturedSectionBanner['align'] })}
                className="w-full px-2 py-1.5 rounded-lg border"
                style={{ borderColor: 'var(--border)' }}
              >
                <option value="left">{isAr ? 'يسار' : 'Left'}</option>
                <option value="center">{isAr ? 'وسط' : 'Center'}</option>
                <option value="right">{isAr ? 'يمين' : 'Right'}</option>
              </select>
            </label>
            <label className="font-bold space-y-1">
              <span>{isAr ? 'تراكب الصورة' : 'Image overlay'}</span>
              <select
                value={b.overlay || 'none'}
                onChange={(e) => patch(b.id, { overlay: e.target.value as FeaturedSectionBanner['overlay'] })}
                className="w-full px-2 py-1.5 rounded-lg border"
                style={{ borderColor: 'var(--border)' }}
              >
                <option value="none">{isAr ? 'بدون' : 'None'}</option>
                <option value="dark">{isAr ? 'داكن' : 'Dark'}</option>
                <option value="light">{isAr ? 'فاتح' : 'Light'}</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-[11px] font-bold" data-fsb-panel="overlay">
            <span>{isAr ? 'شفافية التراكب' : 'Overlay opacity'}</span>
            <input
              type="range"
              min={0}
              max={80}
              value={b.overlayOpacity ?? 0}
              onChange={(e) => patch(b.id, { overlayOpacity: Number(e.target.value) })}
              className="w-full"
            />
          </label>
        </div>
      ))}
      <AddButton
        isAr={isAr}
        labelEn="Add featured banner"
        labelAr="إضافة بانر مميز"
        onClick={() => {
          const row: FeaturedSectionBanner = {
            id: `fsb-${Date.now()}`,
            enabled: true,
            bgColor: '#F5EADA',
            images: [],
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
            textColor: '#1a110c',
            align: 'left',
            overlay: 'none',
            overlayOpacity: 0,
            buttons: [],
          };
          setDraft({ ...draft, enabled: true, banners: [...banners, row] });
        }}
      />
      </div>
    </>
  ));
};

export const FeaturedProductsForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('featuredProducts');
  const tabs = draft?.tabs || [];
  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Featured Products',
    titleAr: 'المنتجات المميزة',
    subtitleEn: 'Tabs and catalog source. Product cards come from the live catalog after Save.',
    subtitleAr: 'التبويبات ومصدر الكتالوج. البطاقات من الكتالوج الحي بعد الحفظ.',
    preview: () => (
        <LinesPreview device="desktop" title={bi(isAr ? 'ar' : 'en', draft?.titleEn, draft?.titleAr)} lines={(tabs || []).map((t) => bi(isAr ? 'ar' : 'en', t.labelEn, t.labelAr))} />
      ),
  }, (
    <>
      <div data-fp-panel="content" className="space-y-3">
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <BiFields isAr={isAr} labelEn="Section title" labelAr="عنوان القسم" en={draft?.titleEn || ''} ar={draft?.titleAr || ''} onEn={(v) => setDraft({ ...draft, titleEn: v })} onAr={(v) => setDraft({ ...draft, titleAr: v })} />
      <BiFields isAr={isAr} labelEn="Description" labelAr="الوصف" en={draft?.descriptionEn || ''} ar={draft?.descriptionAr || ''} onEn={(v) => setDraft({ ...draft, descriptionEn: v })} onAr={(v) => setDraft({ ...draft, descriptionAr: v })} />
      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold" data-fp-panel="sort">
        <label className="space-y-1">
          <span>{isAr ? 'عدد المنتجات' : 'Product count'}</span>
          <input
            type="number"
            min={1}
            max={24}
            value={draft?.productCount || 8}
            onChange={(e) => setDraft({ ...draft, productCount: Number(e.target.value) || 8 })}
            className="w-full px-2 py-1.5 rounded-lg border"
            style={{ borderColor: 'var(--border)' }}
          />
        </label>
        <label className="space-y-1">
          <span>{isAr ? 'الترتيب' : 'Sort by'}</span>
          <select
            className="w-full px-2 py-1.5 rounded-lg border"
            style={{ borderColor: 'var(--border)' }}
            value={draft?.sortBy || 'manual'}
            onChange={(e) => setDraft({ ...draft, sortBy: e.target.value as 'manual' | 'price_asc' | 'price_desc' | 'newest' })}
          >
            <option value="manual">{isAr ? 'يدوي' : 'Manual'}</option>
            <option value="price_asc">{isAr ? 'السعر تصاعدي' : 'Price ascending'}</option>
            <option value="price_desc">{isAr ? 'السعر تنازلي' : 'Price descending'}</option>
            <option value="newest">{isAr ? 'الأحدث' : 'Newest'}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pt-5">
          <input type="checkbox" checked={draft?.highlightFirst !== false} onChange={(e) => setDraft({ ...draft, highlightFirst: e.target.checked })} />
          {isAr ? 'تمييز أول منتج' : 'Highlight first product'}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft?.showImage !== false} onChange={(e) => setDraft({ ...draft, showImage: e.target.checked })} />
          {isAr ? 'إظهار الصورة' : 'Show image'}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft?.showTitle !== false} onChange={(e) => setDraft({ ...draft, showTitle: e.target.checked })} />
          {isAr ? 'إظهار الاسم' : 'Show title'}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft?.showPrice !== false} onChange={(e) => setDraft({ ...draft, showPrice: e.target.checked })} />
          {isAr ? 'إظهار السعر' : 'Show price'}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft?.showBadge !== false} onChange={(e) => setDraft({ ...draft, showBadge: e.target.checked })} />
          {isAr ? 'إظهار الشارة' : 'Show badge'}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft?.showRating !== false} onChange={(e) => setDraft({ ...draft, showRating: e.target.checked })} />
          {isAr ? 'إظهار التقييم' : 'Show rating'}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft?.showStock !== false} onChange={(e) => setDraft({ ...draft, showStock: e.target.checked })} />
          {isAr ? 'إظهار المخزون' : 'Show stock'}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft?.showAddToCart !== false} onChange={(e) => setDraft({ ...draft, showAddToCart: e.target.checked })} />
          {isAr ? 'إظهار الإضافة للسلة' : 'Show add to cart'}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={draft?.showBuyNow !== false} onChange={(e) => setDraft({ ...draft, showBuyNow: e.target.checked })} />
          {isAr ? 'إظهار الشراء الآن' : 'Show buy now'}
        </label>
      </div>
      {tabs.length === 0 && <p className="text-xs text-muted">{isAr ? 'لا تبويبات. أضف تبويباً أو سيُستخدم كتالوج المتجر إن وُجد.' : 'No tabs yet. Add one, or the storefront uses the live catalog when the section is enabled.'}</p>}
      {tabs.map((tab, index) => (
        <div key={tab.id} className="flex flex-col md:flex-row md:items-end gap-2" data-fp-tab-row>
          <EnableRow
            isAr={isAr}
            enabled={tab.enabled !== false}
            onChange={(v) => setDraft({ ...draft, tabs: tabs.map((t, i) => (i === index ? { ...t, enabled: v } : t)) })}
            labelEn="Tab"
            labelAr="التبويب"
          />
          <div className="flex-1">
            <BiFields
              isAr={isAr}
              labelEn="Label"
              labelAr="التسمية"
              en={tab.labelEn}
              ar={tab.labelAr}
              onEn={(v) => setDraft({ ...draft, tabs: tabs.map((t, i) => (i === index ? { ...t, labelEn: v } : t)) })}
              onAr={(v) => setDraft({ ...draft, tabs: tabs.map((t, i) => (i === index ? { ...t, labelAr: v } : t)) })}
            />
          </div>
          <input value={tab.categoryId} onChange={(e) => setDraft({ ...draft, tabs: tabs.map((t, i) => (i === index ? { ...t, categoryId: e.target.value } : t)) })} className="px-2 py-2 rounded-xl border text-xs w-32" style={{ borderColor: 'var(--border)' }} placeholder={isAr ? 'معرّف التصنيف' : 'Category ID'} dir="ltr" />
          <RowTools isAr={isAr} visible={tab.enabled !== false} onToggleVisible={() => setDraft({ ...draft, tabs: tabs.map((t, i) => (i === index ? { ...t, enabled: t.enabled === false } : t)) })} index={index} total={tabs.length} onUp={() => setDraft({ ...draft, tabs: moveItem(tabs, index, -1) })} onDown={() => setDraft({ ...draft, tabs: moveItem(tabs, index, 1) })} onDuplicate={() => setDraft({ ...draft, tabs: duplicateAt(tabs, index, 'fp') })} onDelete={() => setDraft({ ...draft, tabs: tabs.filter((t) => t.id !== tab.id) })} />
        </div>
      ))}
      <AddButton isAr={isAr} labelEn="Add tab" labelAr="إضافة تبويب" onClick={() => setDraft({ ...draft, enabled: true, tabs: [...tabs, { id: `fp-${Date.now()}`, enabled: true, labelEn: '', labelAr: '', categoryId: 'all' }] })} />
      </div>
    </>
  ));
};

export const ImageBannersForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('imageBanners');
  const items = draft?.items || [];
  const patch = (id: string, p: Partial<ImageBannerItem>) => setDraft({ ...draft, items: items.map((it) => (it.id === id ? { ...it, ...p } : it)) });
  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Image Banners',
    titleAr: 'بانرات الصور',
    subtitleEn: 'Image tiles with bilingual titles. Hidden on the storefront when empty.',
    subtitleAr: 'بلاطات صور بعناوين ثنائية اللغة. تختفي في المتجر إذا كانت فارغة.',
    preview: () => (
        <LinesPreview device="desktop" title={bi(isAr ? 'ar' : 'en', items?.[0]?.titleEn, items?.[0]?.titleAr)} lines={(items || []).map((it) => bi(isAr ? 'ar' : 'en', it.titleEn, it.titleAr))} image={items?.[0]?.image} />
      ),
  }, (
    <>
      <div data-img-panel="content" className="space-y-3">
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold" data-img-panel="layout">
        <label className="space-y-1">
          <span>{isAr ? 'نمط التخطيط' : 'Layout style'}</span>
          <select
            className="w-full px-2 py-1.5 rounded-lg border"
            style={{ borderColor: 'var(--border)' }}
            value={draft?.layout || 'grid'}
            onChange={(e) => setDraft({ ...draft, layout: e.target.value as 'grid' | 'bento' | 'row' | 'stack' | 'masonry' })}
          >
            <option value="grid">{isAr ? 'شبكة' : 'Grid'}</option>
            <option value="bento">{isAr ? 'بنتو' : 'Bento'}</option>
            <option value="row">{isAr ? 'صف' : 'Row'}</option>
            <option value="stack">{isAr ? 'تكديس' : 'Stack'}</option>
            <option value="masonry">{isAr ? 'بناء متداخل' : 'Masonry'}</option>
          </select>
        </label>
        <label className="space-y-1">
          <span>{isAr ? 'أعمدة سطح المكتب' : 'Desktop columns'}</span>
          <select className="w-full px-2 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} value={draft?.columnsDesktop ?? 3} onChange={(e) => setDraft({ ...draft, columnsDesktop: Number(e.target.value) })}>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span>{isAr ? 'أعمدة الجوال' : 'Mobile columns'}</span>
          <select className="w-full px-2 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} value={draft?.columnsMobile ?? 1} onChange={(e) => setDraft({ ...draft, columnsMobile: Number(e.target.value) })}>
            {[1, 2].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      {items.length === 0 && <p className="text-xs text-muted">{isAr ? 'لا صور. الشبكة تختفي.' : 'No images. The grid hides.'}</p>}
      {items.map((it, index) => (
        <div key={it.id} className={cardCls} style={cardStyle} data-img-tile>
          <div className="flex justify-between">
            <EnableRow isAr={isAr} enabled={it.enabled} onChange={(v) => patch(it.id, { enabled: v })} labelEn="Tile" labelAr="البطاقة" />
            <RowTools isAr={isAr} visible={it.enabled !== false} onToggleVisible={() => patch(it.id, { enabled: it.enabled === false })} index={index} total={items.length} onUp={() => setDraft({ ...draft, items: moveItem(items, index, -1) })} onDown={() => setDraft({ ...draft, items: moveItem(items, index, 1) })} onDuplicate={() => setDraft({ ...draft, items: duplicateAt(items, index, 'img') })} onDelete={() => setDraft({ ...draft, items: items.filter((x) => x.id !== it.id) })} />
          </div>
          <MediaUploadField
            label={isAr ? 'صورة البلاطة (مكتبة / رفع)' : 'Tile image (library / upload)'}
            altText={isAr ? (it.altAr || it.titleAr) : (it.altEn || it.titleEn)}
            onAltTextChange={(alt) => patch(it.id, isAr ? { altAr: alt } : { altEn: alt })}
            value={it.image}
            onChange={(url) => patch(it.id, { image: url })}
            aspectRatio="banner"
            initialFolder="banners"
            recommendedSize="900 × 600 px"
          />
          <BiFields isAr={isAr} labelEn="Title" labelAr="العنوان" en={it.titleEn} ar={it.titleAr} onEn={(v) => patch(it.id, { titleEn: v })} onAr={(v) => patch(it.id, { titleAr: v })} />
          <BiFields isAr={isAr} labelEn="Subtitle" labelAr="الوصف" en={it.subtitleEn} ar={it.subtitleAr} onEn={(v) => patch(it.id, { subtitleEn: v })} onAr={(v) => patch(it.id, { subtitleAr: v })} />
          <BiFields isAr={isAr} labelEn="Button" labelAr="الزر" en={it.buttonEn} ar={it.buttonAr} onEn={(v) => patch(it.id, { buttonEn: v })} onAr={(v) => patch(it.id, { buttonAr: v })} />
          <label className="block space-y-1 text-[11px] font-bold" data-img-panel="overlay">
            <span>{isAr ? 'تراكب البلاطة' : 'Tile overlay'}</span>
            <select
              className="w-full px-2 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border)' }}
              value={it.overlay || 'gradient'}
              onChange={(e) => patch(it.id, { overlay: e.target.value as 'none' | 'gradient' | 'dark' })}
            >
              <option value="none">{isAr ? 'بدون' : 'None'}</option>
              <option value="gradient">{isAr ? 'تدرج' : 'Gradient'}</option>
              <option value="dark">{isAr ? 'داكن' : 'Dark'}</option>
            </select>
          </label>
        </div>
      ))}
      <AddButton
        isAr={isAr}
        labelEn="Add image"
        labelAr="إضافة صورة"
        onClick={() => {
          const row: ImageBannerItem = { id: `img-${Date.now()}`, enabled: true, image: '', titleEn: '', titleAr: '', subtitleEn: '', subtitleAr: '', link: '', buttonEn: '', buttonAr: '', overlay: 'gradient' };
          setDraft({ ...draft, enabled: true, items: [...items, row] });
        }}
      />
      </div>
    </>
  ));
};

export const CoffeeFooterForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('footer');
  const columns = draft?.columns || [];
  const socialLinks = draft?.socialLinks || [];
  const bottomLinks = draft?.bottomLinks || [];
  const patchCol = (id: string, p: Partial<FooterColumn>) =>
    setDraft({ ...draft, columns: columns.map((c) => (c.id === id ? { ...c, ...p } : c)) });
  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Footer',
    titleAr: 'التذييل',
    subtitleEn: 'Columns, contact, newsletter, social, and bottom bar — saved per store.',
    subtitleAr: 'الأعمدة والتواصل والنشرة والتواصل الاجتماعي والشريط السفلي — محفوظ لكل متجر.',
    preview: () => (
        <LinesPreview device="desktop" title={bi(isAr ? 'ar' : 'en', draft?.aboutEn, draft?.aboutAr)} lines={(columns || []).map((c) => bi(isAr ? 'ar' : 'en', c.titleEn, c.titleAr))} />
      ),
  }, (
    <>
      <div data-footer-tab="content" className="space-y-3">
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />

      <section className={cardCls} style={cardStyle} data-footer-controls="layout">
        <h3 className="text-sm font-bold">{isAr ? 'إعدادات المظهر' : 'Appearance'}</h3>
        <label className="text-[11px] font-bold space-y-1 block">
          <span>{isAr ? 'تخطيط التذييل' : 'Footer layout'}</span>
          <select value={draft?.layout || 'columns'} onChange={(e) => setDraft({ ...draft, layout: e.target.value as 'standard' | 'columns' | 'saudi-minimal' })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }}>
            <option value="standard">{isAr ? 'قياسي' : 'Standard'}</option>
            <option value="columns">{isAr ? 'أعمدة' : 'Columns'}</option>
            <option value="saudi-minimal">{isAr ? 'سعودي مبسّط' : 'Saudi minimal'}</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'full' as const, ar: 'عرض كامل', en: 'Full Width' },
              { id: 'boxed' as const, ar: 'محدد داخل حاوية', en: 'Boxed' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDraft({ ...draft, contentWidth: opt.id, enabled: true })}
              className={`py-2 rounded-xl text-[11px] font-bold border ${
                (draft?.contentWidth || 'boxed') === opt.id
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              {isAr ? opt.ar : opt.en}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(
            [
              { id: 1 as const, ar: '١ عمود', en: '1 col' },
              { id: 2 as const, ar: '٢ عمود', en: '2 cols' },
              { id: 3 as const, ar: '٣ أعمدة', en: '3 cols' },
              { id: 4 as const, ar: '٤ أعمدة', en: '4 cols' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDraft({ ...draft, desktopColumns: opt.id, enabled: true })}
              className={`py-2 rounded-xl text-[11px] font-bold border ${
                (draft?.desktopColumns || 4) === opt.id
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              {isAr ? opt.ar : opt.en}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] font-bold space-y-1 block">
            <span>{isAr ? 'لون الخلفية' : 'Background'}</span>
            <div className="flex gap-2">
              <input type="color" value={draft?.bgColor || '#111111'} onChange={(e) => setDraft({ ...draft, bgColor: e.target.value })} className="w-10 h-9 rounded border" />
              <input className="w-full px-2 py-2 rounded-xl border text-xs" dir="ltr" value={draft?.bgColor || '#111111'} onChange={(e) => setDraft({ ...draft, bgColor: e.target.value })} />
            </div>
          </label>
          <label className="text-[11px] font-bold space-y-1 block">
            <span>{isAr ? 'لون النص' : 'Text color'}</span>
            <div className="flex gap-2">
              <input type="color" value={draft?.textColor || '#e5e5e5'} onChange={(e) => setDraft({ ...draft, textColor: e.target.value })} className="w-10 h-9 rounded border" />
              <input className="w-full px-2 py-2 rounded-xl border text-xs" dir="ltr" value={draft?.textColor || '#e5e5e5'} onChange={(e) => setDraft({ ...draft, textColor: e.target.value })} />
            </div>
          </label>
          <label className="text-[11px] font-bold space-y-1 block">
            <span>{isAr ? 'لون الروابط' : 'Link color'}</span>
            <div className="flex gap-2">
              <input type="color" value={draft?.linkColor || '#d4d4d4'} onChange={(e) => setDraft({ ...draft, linkColor: e.target.value })} className="w-10 h-9 rounded border" />
              <input className="w-full px-2 py-2 rounded-xl border text-xs" dir="ltr" value={draft?.linkColor || '#d4d4d4'} onChange={(e) => setDraft({ ...draft, linkColor: e.target.value })} />
            </div>
          </label>
          <label className="text-[11px] font-bold space-y-1 block">
            <span>{isAr ? 'لون التمرير' : 'Link hover'}</span>
            <div className="flex gap-2">
              <input type="color" value={draft?.linkHoverColor || '#ffffff'} onChange={(e) => setDraft({ ...draft, linkHoverColor: e.target.value })} className="w-10 h-9 rounded border" />
              <input className="w-full px-2 py-2 rounded-xl border text-xs" dir="ltr" value={draft?.linkHoverColor || '#ffffff'} onChange={(e) => setDraft({ ...draft, linkHoverColor: e.target.value })} />
            </div>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] font-bold space-y-1 block">
            <span>{isAr ? 'حجم الخط (بكسل)' : 'Font size (px)'}</span>
            <input type="number" min={11} max={18} value={draft?.fontSizePx || 12} onChange={(e) => setDraft({ ...draft, fontSizePx: Number(e.target.value) || 12 })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} />
          </label>
          <label className="text-[11px] font-bold space-y-1 block">
            <span>{isAr ? 'مسافة الأعمدة' : 'Column gap (px)'}</span>
            <input type="number" min={8} max={64} value={draft?.columnGapPx || 40} onChange={(e) => setDraft({ ...draft, columnGapPx: Number(e.target.value) || 40 })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} />
          </label>
        </div>
      </section>

      <BiFields isAr={isAr} labelEn="About" labelAr="نبذة" en={draft?.aboutEn || ''} ar={draft?.aboutAr || ''} onEn={(v) => setDraft({ ...draft, aboutEn: v })} onAr={(v) => setDraft({ ...draft, aboutAr: v })} />
      <BiFields isAr={isAr} labelEn="Copyright" labelAr="حقوق النشر" en={draft?.copyrightEn || ''} ar={draft?.copyrightAr || ''} onEn={(v) => setDraft({ ...draft, copyrightEn: v })} onAr={(v) => setDraft({ ...draft, copyrightAr: v })} />

      <section className={cardCls} style={cardStyle} data-footer-controls="contact">
        <EnableRow isAr={isAr} enabled={draft?.showContact !== false} onChange={(v) => setDraft({ ...draft, showContact: v })} labelEn="Contact section" labelAr="قسم التواصل" />
        <BiFields isAr={isAr} labelEn="Address" labelAr="العنوان" en={draft?.addressEn || ''} ar={draft?.addressAr || ''} onEn={(v) => setDraft({ ...draft, addressEn: v })} onAr={(v) => setDraft({ ...draft, addressAr: v })} />
        <BiFields isAr={isAr} labelEn="Hours" labelAr="ساعات العمل" en={draft?.hoursEn || ''} ar={draft?.hoursAr || ''} onEn={(v) => setDraft({ ...draft, hoursEn: v })} onAr={(v) => setDraft({ ...draft, hoursAr: v })} />
        <p className="text-[10px] font-medium rounded-lg px-2.5 py-2 border" style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--surface)' }}>
          {isAr
            ? 'البريد وواتساب والهاتف يُسحبون تلقائياً من هوية المتجر (إعدادات المتجر). احفظ الهوية مرة واحدة — تظهر هنا وفي التذييلة والرأس والفاتورة.'
            : 'Email, WhatsApp, and phone auto-fill from Store Identity. Save identity once — used in footer, header, invoice, and builder.'}
        </p>
        <label className="text-[11px] font-bold space-y-1 block">
          <span>{isAr ? 'البريد الإلكتروني (تلقائي)' : 'Email (auto)'}</span>
          <input value={draft?.contactEmail || ''} readOnly className="w-full px-3 py-2 rounded-xl border text-xs opacity-90 cursor-default" style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }} dir="ltr" />
        </label>
        <label className="text-[11px] font-bold space-y-1 block">
          <span>{isAr ? 'الهاتف (تلقائي)' : 'Phone (auto)'}</span>
          <input value={draft?.contactPhone || ''} readOnly className="w-full px-3 py-2 rounded-xl border text-xs opacity-90 cursor-default" style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }} dir="ltr" />
        </label>
        <label className="text-[11px] font-bold space-y-1 block">
          <span>{isAr ? 'واتساب (تلقائي)' : 'WhatsApp (auto)'}</span>
          <input value={draft?.contactWhatsApp || ''} readOnly className="w-full px-3 py-2 rounded-xl border text-xs opacity-90 cursor-default" style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }} dir="ltr" placeholder="+9665…" />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="text-[11px] font-bold space-y-1 block">
            <span>{isAr ? 'الرقم الضريبي' : 'Tax number'}</span>
            <input value={draft?.taxNumber || ''} onChange={(e) => setDraft({ ...draft, taxNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} dir="ltr" />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold mt-5">
            <input type="checkbox" checked={!!draft?.showTaxNumber} onChange={(e) => setDraft({ ...draft, showTaxNumber: e.target.checked })} />
            {isAr ? 'إظهار الرقم الضريبي' : 'Show tax number'}
          </label>
          <label className="text-[11px] font-bold space-y-1 block">
            <span>{isAr ? 'السجل التجاري' : 'Commercial registration'}</span>
            <input value={draft?.crNumber || ''} onChange={(e) => setDraft({ ...draft, crNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} dir="ltr" />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold mt-5">
            <input type="checkbox" checked={!!draft?.showCrNumber} onChange={(e) => setDraft({ ...draft, showCrNumber: e.target.checked })} />
            {isAr ? 'إظهار السجل التجاري' : 'Show CR number'}
          </label>
        </div>
      </section>

      <BiFields isAr={isAr} labelEn="Newsletter title" labelAr="عنوان النشرة" en={draft?.newsletterTitleEn || ''} ar={draft?.newsletterTitleAr || ''} onEn={(v) => setDraft({ ...draft, newsletterTitleEn: v })} onAr={(v) => setDraft({ ...draft, newsletterTitleAr: v })} />
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={draft?.showNewsletter !== false} onChange={(e) => setDraft({ ...draft, showNewsletter: e.target.checked })} />
        {isAr ? 'إظهار النشرة' : 'Show newsletter'}
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={!!draft?.showPaymentIcons} onChange={(e) => setDraft({ ...draft, showPaymentIcons: e.target.checked })} />
        {isAr ? 'إظهار وسائل الدفع' : 'Show payment methods'}
      </label>
      <BiFields isAr={isAr} labelEn="Payment methods" labelAr="وسائل الدفع" en={draft?.paymentsEn || ''} ar={draft?.paymentsAr || ''} onEn={(v) => setDraft({ ...draft, paymentsEn: v })} onAr={(v) => setDraft({ ...draft, paymentsAr: v })} />

      <section className={cardCls} style={cardStyle} data-footer-controls="social">
        <EnableRow isAr={isAr} enabled={draft?.showSocial !== false} onChange={(v) => setDraft({ ...draft, showSocial: v })} labelEn="Social media" labelAr="وسائل التواصل" />
        {socialLinks.map((s, index) => (
          <div key={s.id} className="grid grid-cols-1 md:grid-cols-[140px_1fr_auto_auto] gap-2 items-end">
            <select
              value={s.platform}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  socialLinks: socialLinks.map((row, i) =>
                    i === index ? { ...row, platform: e.target.value as typeof s.platform } : row,
                  ),
                })
              }
              className="px-2 py-2 rounded-xl border text-xs"
              style={{ borderColor: 'var(--border)' }}
            >
              <option value="instagram">{isAr ? 'إنستغرام' : 'Instagram'}</option>
              <option value="facebook">{isAr ? 'فيسبوك' : 'Facebook'}</option>
              <option value="youtube">{isAr ? 'يوتيوب' : 'YouTube'}</option>
              <option value="tiktok">{isAr ? 'تيك توك' : 'TikTok'}</option>
              <option value="x">{isAr ? 'منصة إكس' : 'X'}</option>
              <option value="whatsapp">{isAr ? 'واتساب' : 'WhatsApp'}</option>
              <option value="other">{isAr ? 'أخرى' : 'Other'}</option>
            </select>
            <input
              value={s.url}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  socialLinks: socialLinks.map((row, i) => (i === index ? { ...row, url: e.target.value } : row)),
                })
              }
              className="px-2 py-2 rounded-xl border text-xs"
              style={{ borderColor: 'var(--border)' }}
              dir="ltr"
              placeholder="https://"
            />
            <label className="flex items-center gap-1 text-[11px] font-bold">
              <input
                type="checkbox"
                checked={s.enabled !== false}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    socialLinks: socialLinks.map((row, i) =>
                      i === index ? { ...row, enabled: e.target.checked } : row,
                    ),
                  })
                }
              />
              {isAr ? 'نشط' : 'On'}
            </label>
            <button
              type="button"
              className="text-[11px] text-rose-600"
              onClick={() => setDraft({ ...draft, socialLinks: socialLinks.filter((row) => row.id !== s.id) })}
            >
              {isAr ? 'حذف' : 'Delete'}
            </button>
          </div>
        ))}
        <AddButton
          isAr={isAr}
          labelEn="Add social link"
          labelAr="إضافة رابط تواصل"
          onClick={() =>
            setDraft({
              ...draft,
              showSocial: true,
              socialLinks: [
                ...socialLinks,
                { id: `soc-${Date.now()}`, platform: 'instagram', url: '', enabled: true },
              ],
            })
          }
        />
      </section>

      {columns.map((col, index) => (
        <div key={col.id} className={cardCls} style={cardStyle}>
          <div className="flex justify-between gap-2 flex-wrap">
            <EnableRow
              isAr={isAr}
              enabled={col.enabled !== false}
              onChange={(v) => patchCol(col.id, { enabled: v })}
              labelEn="Column"
              labelAr="العمود"
            />
            <RowTools isAr={isAr} index={index} total={columns.length} onUp={() => setDraft({ ...draft, columns: moveItem(columns, index, -1) })} onDown={() => setDraft({ ...draft, columns: moveItem(columns, index, 1) })} onDuplicate={() => setDraft({ ...draft, columns: duplicateAt(columns, index, 'foot').map((c, i) => i === index + 1 ? { ...c, links: (c.links || []).map((l) => ({ ...l, id: `lnk-${Date.now()}-${l.id}` })) } : c) })} onDelete={() => setDraft({ ...draft, columns: columns.filter((c) => c.id !== col.id) })} />
          </div>
          <BiFields isAr={isAr} labelEn="Column title" labelAr="عنوان العمود" en={col.titleEn} ar={col.titleAr} onEn={(v) => patchCol(col.id, { titleEn: v })} onAr={(v) => patchCol(col.id, { titleAr: v })} />
          <div className="flex flex-wrap gap-3 text-[11px] font-bold">
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" checked={col.showDesktop !== false} onChange={(e) => patchCol(col.id, { showDesktop: e.target.checked })} />
              {isAr ? 'سطح المكتب' : 'Desktop'}
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" checked={col.showMobile !== false} onChange={(e) => patchCol(col.id, { showMobile: e.target.checked })} />
              {isAr ? 'الجوال' : 'Mobile'}
            </label>
          </div>
          {(col.links || []).map((link, li) => (
            <div key={link.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto_auto] gap-2 items-end">
              <BiFields
                isAr={isAr}
                labelEn="Link"
                labelAr="رابط"
                en={link.labelEn}
                ar={link.labelAr}
                onEn={(v) => patchCol(col.id, { links: col.links.map((l, i) => (i === li ? { ...l, labelEn: v } : l)) })}
                onAr={(v) => patchCol(col.id, { links: col.links.map((l, i) => (i === li ? { ...l, labelAr: v } : l)) })}
              />
              <input value={link.url} onChange={(e) => patchCol(col.id, { links: col.links.map((l, i) => (i === li ? { ...l, url: e.target.value } : l)) })} className="px-2 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} dir="ltr" />
              <label className="flex items-center gap-1 text-[11px] font-bold">
                <input
                  type="checkbox"
                  checked={link.enabled !== false}
                  onChange={(e) =>
                    patchCol(col.id, {
                      links: col.links.map((l, i) => (i === li ? { ...l, enabled: e.target.checked } : l)),
                    })
                  }
                />
                {isAr ? 'نشط' : 'On'}
              </label>
              <button type="button" className="text-[11px] text-rose-600" onClick={() => patchCol(col.id, { links: col.links.filter((l) => l.id !== link.id) })}>
                {isAr ? 'حذف' : 'Delete'}
              </button>
            </div>
          ))}
          <AddButton isAr={isAr} labelEn="Add link" labelAr="إضافة رابط" onClick={() => patchCol(col.id, { links: [...col.links, { id: `lnk-${Date.now()}`, labelEn: '', labelAr: '', url: 'home', enabled: true }] })} />
        </div>
      ))}
      <AddButton isAr={isAr} labelEn="Add column" labelAr="إضافة عمود" onClick={() => setDraft({ ...draft, enabled: true, columns: [...columns, { id: `col-${Date.now()}`, titleEn: '', titleAr: '', links: [], enabled: true, showDesktop: true, showMobile: true }] })} />

      <section className={cardCls} style={cardStyle} data-footer-controls="bottom-bar">
        <EnableRow isAr={isAr} enabled={draft?.showBottomBar !== false} onChange={(v) => setDraft({ ...draft, showBottomBar: v })} labelEn="Bottom bar" labelAr="الشريط السفلي" />
        {bottomLinks.map((link, li) => (
          <div key={link.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-2 items-end">
            <BiFields
              isAr={isAr}
              labelEn="Bottom link"
              labelAr="رابط سفلي"
              en={link.labelEn}
              ar={link.labelAr}
              onEn={(v) =>
                setDraft({
                  ...draft,
                  bottomLinks: bottomLinks.map((l, i) => (i === li ? { ...l, labelEn: v } : l)),
                })
              }
              onAr={(v) =>
                setDraft({
                  ...draft,
                  bottomLinks: bottomLinks.map((l, i) => (i === li ? { ...l, labelAr: v } : l)),
                })
              }
            />
            <input
              value={link.url}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  bottomLinks: bottomLinks.map((l, i) => (i === li ? { ...l, url: e.target.value } : l)),
                })
              }
              className="px-2 py-2 rounded-xl border text-xs"
              style={{ borderColor: 'var(--border)' }}
              dir="ltr"
            />
            <button
              type="button"
              className="text-[11px] text-rose-600"
              onClick={() => setDraft({ ...draft, bottomLinks: bottomLinks.filter((l) => l.id !== link.id) })}
            >
              {isAr ? 'حذف' : 'Delete'}
            </button>
          </div>
        ))}
        <AddButton
          isAr={isAr}
          labelEn="Add bottom link"
          labelAr="إضافة رابط سفلي"
          onClick={() =>
            setDraft({
              ...draft,
              showBottomBar: true,
              bottomLinks: [
                ...bottomLinks,
                { id: `bl-${Date.now()}`, labelEn: '', labelAr: '', url: 'privacy', enabled: true },
              ],
            })
          }
        />
      </section>
      </div>
    </>
  ));
};

/** CW-12 — Product Catalog inspector (filters / sort / card toggles). */
export { CoffeeProductCatalogForm, CatalogControlsForm } from './CoffeeProductCatalogForm';

export { ExclusiveBenefitsForm } from './CoffeeBenefitsForm';

export { ProductCarouselForm } from './CoffeeProductCarouselForm';

export const CoffeeBannersSectionForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('banners');
  const banners = draft?.banners || [];
  const patch = (id: string, p: Partial<BannerItem>) =>
    setDraft({ ...draft, banners: banners.map((b) => (b.id === id ? { ...b, ...p, title: p.titleEn ?? b.title, subtitle: p.subtitleEn ?? b.subtitle, buttonText: p.buttonTextEn ?? b.buttonText } : b)) });
  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Banner Section',
    titleAr: 'قسم البانر',
    subtitleEn: 'Homepage banner block, separate from the hero. Live after Save.',
    subtitleAr: 'بلوك بانر الصفحة الرئيسية، منفصل عن الهيرو. يظهر بعد الحفظ.',
    preview: () => (
        <LinesPreview device="desktop" title={bi(isAr ? 'ar' : 'en', banners?.[0]?.titleEn, banners?.[0]?.titleAr)} lines={(banners || []).map((b) => bi(isAr ? 'ar' : 'en', b.titleEn || b.title, b.titleAr))} image={banners?.[0]?.image} />
      ),
  }, (
    <>
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <p className="text-[11px] text-muted">{isAr ? 'قسم البانر منفصل عن الهيرو والبانرات المميزة.' : 'Banner section (C-BAN) is separate from the hero and featured banners.'}</p>
      {banners.length === 0 && <p className="text-xs text-muted">{isAr ? 'لا بانرات.' : 'No banners.'}</p>}
      {banners.map((b, index) => (
        <div key={b.id} className={cardCls} style={cardStyle}>
          <div className="flex justify-between">
            <EnableRow isAr={isAr} enabled={b.enabled !== false} onChange={(v) => patch(b.id, { enabled: v })} labelEn="Banner" labelAr="البانر" />
            <RowTools isAr={isAr} visible={b.enabled !== false} onToggleVisible={() => patch(b.id, { enabled: b.enabled === false })} index={index} total={banners.length} onUp={() => setDraft({ ...draft, banners: moveItem(banners, index, -1) })} onDown={() => setDraft({ ...draft, banners: moveItem(banners, index, 1) })} onDuplicate={() => setDraft({ ...draft, banners: duplicateAt(banners, index, 'ban') })} onDelete={() => setDraft({ ...draft, banners: banners.filter((x) => x.id !== b.id) })} />
          </div>
          <MediaUploadField
            label={isAr ? 'صورة البانر (مكتبة / رفع)' : 'Banner image (library / upload)'}
            altText={isAr ? (b.titleAr || b.title) : (b.titleEn || b.title)}
            value={b.image}
            onChange={(url) => patch(b.id, { image: url })}
            aspectRatio="banner"
            initialFolder="banners"
            recommendedSize="1400 × 500 px"
          />
          <BiFields isAr={isAr} labelEn="Title" labelAr="العنوان" en={b.titleEn || b.title} ar={b.titleAr || ''} onEn={(v) => patch(b.id, { titleEn: v, title: v })} onAr={(v) => patch(b.id, { titleAr: v })} />
          <BiFields isAr={isAr} labelEn="Subtitle" labelAr="الوصف" en={b.subtitleEn || b.subtitle} ar={b.subtitleAr || ''} onEn={(v) => patch(b.id, { subtitleEn: v, subtitle: v })} onAr={(v) => patch(b.id, { subtitleAr: v })} />
          <BiFields isAr={isAr} labelEn="Button" labelAr="الزر" en={b.buttonTextEn || b.buttonText} ar={b.buttonTextAr || ''} onEn={(v) => patch(b.id, { buttonTextEn: v, buttonText: v })} onAr={(v) => patch(b.id, { buttonTextAr: v })} />
          <BiFields isAr={isAr} labelEn="Discount badge" labelAr="شارة الخصم" en={b.discountBadgeEn || b.discountBadge || ''} ar={b.discountBadgeAr || ''} onEn={(v) => patch(b.id, { discountBadge: v, discountBadgeEn: v })} onAr={(v) => patch(b.id, { discountBadgeAr: v })} />
          <label className="text-[11px] font-bold space-y-1 block">
            <span>{isAr ? 'رابط البانر' : 'Banner link'}</span>
            <input value={b.link || ''} onChange={(e) => patch(b.id, { link: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} dir="ltr" />
          </label>
        </div>
      ))}
      <AddButton
        isAr={isAr}
        labelEn="Add banner"
        labelAr="إضافة بانر"
        onClick={() =>
          setDraft({
            ...draft,
            enabled: true,
            banners: [...banners, { id: `ban-${Date.now()}`, enabled: true, image: '', title: '', titleEn: '', titleAr: '', subtitle: '', subtitleEn: '', subtitleAr: '', discountBadge: '', discountBadgeEn: '', discountBadgeAr: '', buttonText: '', buttonTextEn: '', buttonTextAr: '', link: '' }],
          })
        }
      />
    </>
  ));
};

export const ProductCarouselBannerForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('productCarouselBanner');
  const { currentProducts } = useTenant();
  const catalog = (currentProducts || []).map((p) => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    category: p.category,
    brand: p.brand,
  }));
  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Product Carousel + Banner',
    titleAr: 'كاروسيل مع بانر',
    subtitleEn: 'Side banner plus catalog products. Live after Save.',
    subtitleAr: 'بانر جانبي مع منتجات الكتالوج. يظهر بعد الحفظ.',
    preview: () => (
        <LinesPreview device="desktop" title={bi(isAr ? 'ar' : 'en', draft?.titleEn, draft?.titleAr)} lines={[bi(isAr ? 'ar' : 'en', draft?.subtitleEn, draft?.subtitleAr)]} image={draft?.bannerImage} />
      ),
  }, (
    <>
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <MediaUploadField
        label={isAr ? 'صورة البانر الجانبي (مكتبة / رفع)' : 'Side banner image (library / upload)'}
        value={draft?.bannerImage || ''}
        onChange={(url) => setDraft({ ...draft, bannerImage: url })}
        aspectRatio="banner"
        initialFolder="banners"
        recommendedSize="800 × 1000 px"
      />
      <BiFields isAr={isAr} labelEn="Title" labelAr="العنوان" en={draft?.titleEn || ''} ar={draft?.titleAr || ''} onEn={(v) => setDraft({ ...draft, titleEn: v })} onAr={(v) => setDraft({ ...draft, titleAr: v })} />
      <BiFields isAr={isAr} labelEn="Subtitle" labelAr="الوصف" en={draft?.subtitleEn || ''} ar={draft?.subtitleAr || ''} onEn={(v) => setDraft({ ...draft, subtitleEn: v })} onAr={(v) => setDraft({ ...draft, subtitleAr: v })} />
      <BiFields isAr={isAr} labelEn="Button" labelAr="الزر" en={draft?.buttonEn || ''} ar={draft?.buttonAr || ''} onEn={(v) => setDraft({ ...draft, buttonEn: v })} onAr={(v) => setDraft({ ...draft, buttonAr: v })} />
      <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }} data-pcb-product-source>
        <CoffeeProductSourceControl
          isAr={isAr}
          catalog={catalog}
          value={normalizeProductSource({
            productSource: draft?.productSource,
            categoryId: draft?.categoryId,
            productCount: draft?.productCount,
          })}
          onChange={(next) =>
            setDraft({
              ...draft,
              productSource: next,
              categoryId: next.categoryIds[0] || draft?.categoryId || '',
              productCount: next.productCount,
              enabled: true,
            })
          }
        />
      </div>
    </>
  ));
};

export const NewsletterForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('newsletter');
  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Newsletter & Coupon Sign-up',
    titleAr: 'النشرة ورمز الخصم',
    subtitleEn: 'Signup copy. The coupon label does not discount unless marketing has the code.',
    subtitleAr: 'نص الاشتراك. رمز الكوبون وصفي ولا يخصم إلا إذا وُجد في التسويق.',
    preview: () => (
        <LinesPreview device="desktop" title={bi(isAr ? 'ar' : 'en', draft?.titleEn, draft?.titleAr)} lines={[bi(isAr ? 'ar' : 'en', draft?.subtitleEn, draft?.subtitleAr), draft?.couponCode || '']} />
      ),
  }, (
    <>
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <BiFields isAr={isAr} labelEn="Title" labelAr="العنوان" en={draft?.titleEn || ''} ar={draft?.titleAr || ''} onEn={(v) => setDraft({ ...draft, titleEn: v })} onAr={(v) => setDraft({ ...draft, titleAr: v })} />
      <BiFields isAr={isAr} labelEn="Consent text" labelAr="نص الموافقة" en={draft?.subtitleEn || ''} ar={draft?.subtitleAr || ''} onEn={(v) => setDraft({ ...draft, subtitleEn: v })} onAr={(v) => setDraft({ ...draft, subtitleAr: v })} />
      <BiFields isAr={isAr} labelEn="Button" labelAr="الزر" en={draft?.buttonEn || ''} ar={draft?.buttonAr || ''} onEn={(v) => setDraft({ ...draft, buttonEn: v })} onAr={(v) => setDraft({ ...draft, buttonAr: v })} />
      <BiFields isAr={isAr} labelEn="Placeholder" labelAr="النص الإرشادي" en={draft?.placeholderEn || ''} ar={draft?.placeholderAr || ''} onEn={(v) => setDraft({ ...draft, placeholderEn: v })} onAr={(v) => setDraft({ ...draft, placeholderAr: v })} />
      <BiFields isAr={isAr} labelEn="Success message" labelAr="رسالة النجاح" en={draft?.successEn || ''} ar={draft?.successAr || ''} onEn={(v) => setDraft({ ...draft, successEn: v })} onAr={(v) => setDraft({ ...draft, successAr: v })} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] font-bold space-y-1">
          <span>{isAr ? 'لون الخلفية' : 'Background color'}</span>
          <input type="color" value={draft?.bgColor || '#173B35'} onChange={(e) => setDraft({ ...draft, bgColor: e.target.value })} className="w-full h-9 rounded-lg border" style={{ borderColor: 'var(--border)' }} />
        </label>
        <label className="text-[11px] font-bold space-y-1">
          <span>{isAr ? 'لون النص' : 'Text color'}</span>
          <input type="color" value={draft?.textColor || '#FFFFFF'} onChange={(e) => setDraft({ ...draft, textColor: e.target.value })} className="w-full h-9 rounded-lg border" style={{ borderColor: 'var(--border)' }} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={!!draft?.showCoupon} onChange={(e) => setDraft({ ...draft, showCoupon: e.target.checked })} />
        {isAr ? 'إظهار رمز الكوبون (وصفي — لا يخصم إلا إذا وُجد الكوبون في التسويق)' : 'Show coupon code (label only — no discount unless marketing has the coupon)'}
      </label>
      <input value={draft?.couponCode || ''} onChange={(e) => setDraft({ ...draft, couponCode: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} dir="ltr" />
    </>
  ));
};

export const CustomOrderBuilderForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('customOrder');
  const fields = draft?.fields || [];
  const patch = (id: string, p: Partial<CustomOrderField>) => setDraft({ ...draft, fields: fields.map((f) => (f.id === id ? { ...f, ...p } : f)) });
  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Custom Product Builder',
    titleAr: 'طلب منتج مخصص',
    subtitleEn: 'WhatsApp custom-order fields. The storefront form reads this after Save.',
    subtitleAr: 'حقول طلب واتساب المخصص. نموذج المتجر يقرأها بعد الحفظ.',
    preview: () => (
        <LinesPreview device="desktop" title={bi(isAr ? 'ar' : 'en', draft?.titleEn, draft?.titleAr)} lines={(fields || []).map((f) => bi(isAr ? 'ar' : 'en', f.labelEn, f.labelAr))} />
      ),
  }, (
    <>
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <BiFields isAr={isAr} labelEn="Title" labelAr="العنوان" en={draft?.titleEn || ''} ar={draft?.titleAr || ''} onEn={(v) => setDraft({ ...draft, titleEn: v })} onAr={(v) => setDraft({ ...draft, titleAr: v })} />
      <BiFields isAr={isAr} labelEn="Subtitle" labelAr="الوصف" en={draft?.subtitleEn || ''} ar={draft?.subtitleAr || ''} onEn={(v) => setDraft({ ...draft, subtitleEn: v })} onAr={(v) => setDraft({ ...draft, subtitleAr: v })} />
      <BiFields isAr={isAr} labelEn="WhatsApp message" labelAr="رسالة واتساب" en={draft?.whatsappMessageEn || ''} ar={draft?.whatsappMessageAr || ''} onEn={(v) => setDraft({ ...draft, whatsappMessageEn: v })} onAr={(v) => setDraft({ ...draft, whatsappMessageAr: v })} />
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'رقم واتساب (تلقائي من هوية المتجر)' : 'WhatsApp number (auto from Store Identity)'}</span>
        <input value={draft?.whatsappNumber || ''} readOnly className="w-full px-3 py-2 rounded-xl border text-xs opacity-90 cursor-default" style={{ borderColor: 'var(--border)', background: 'var(--input-bg)' }} dir="ltr" />
      </label>
      <BiFields isAr={isAr} labelEn="Button" labelAr="الزر" en={draft?.ctaEn || ''} ar={draft?.ctaAr || ''} onEn={(v) => setDraft({ ...draft, ctaEn: v })} onAr={(v) => setDraft({ ...draft, ctaAr: v })} />
      {fields.map((f, index) => (
        <div key={f.id} className="flex flex-col md:flex-row gap-2 items-end">
          <div className="flex-1">
            <BiFields isAr={isAr} labelEn="Field" labelAr="الحقل" en={f.labelEn} ar={f.labelAr} onEn={(v) => patch(f.id, { labelEn: v })} onAr={(v) => patch(f.id, { labelAr: v })} />
          </div>
          <label className="text-[11px] font-bold space-y-1">
            <span>{isAr ? 'النوع' : 'Type'}</span>
            <select value={f.type || 'text'} onChange={(e) => patch(f.id, { type: e.target.value as CustomOrderField['type'] })} className="px-2 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }}>
              <option value="text">{isAr ? 'نص' : 'Text'}</option>
              <option value="number">{isAr ? 'رقم' : 'Number'}</option>
              <option value="select">{isAr ? 'قائمة' : 'Select'}</option>
            </select>
          </label>
          <label className="text-[11px] font-bold flex items-center gap-1">
            <input type="checkbox" checked={f.required} onChange={(e) => patch(f.id, { required: e.target.checked })} />
            {isAr ? 'مطلوب' : 'Required'}
          </label>
          <RowTools isAr={isAr} visible={f.enabled !== false} onToggleVisible={() => patch(f.id, { enabled: f.enabled === false })} index={index} total={fields.length} onUp={() => setDraft({ ...draft, fields: moveItem(fields, index, -1) })} onDown={() => setDraft({ ...draft, fields: moveItem(fields, index, 1) })} onDuplicate={() => setDraft({ ...draft, fields: duplicateAt(fields, index, 'co') })} onDelete={() => setDraft({ ...draft, fields: fields.filter((x) => x.id !== f.id) })} />
        </div>
      ))}
      <AddButton isAr={isAr} labelEn="Add field" labelAr="إضافة حقل" onClick={() => setDraft({ ...draft, enabled: true, fields: [...fields, { id: `co-${Date.now()}`, enabled: true, labelEn: '', labelAr: '', type: 'text', required: false }] })} />
    </>
  ));
};

export const CoffeeProductEditForm: React.FC = () => {
  const { isAr, activeStore, toast } = useCoffeeDraft('newsletter');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetchProducts(activeStore.id, { all: true })
      .then((rows) => {
        if (!cancel) setProducts(rows);
      })
      .catch(() => {
        if (!cancel) setError(isAr ? 'تعذر تحميل المنتجات من واجهة المنتجات.' : 'Could not load products from the products API.');
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [activeStore.id, isAr]);

  const saveProduct = async (p: Product) => {
    try {
      const updated = await updateProduct(activeStore.id, p.id, {
        name: p.name,
        name_ar: p.nameAr || null,
        subtitle: p.subtitle || null,
        subtitle_ar: p.subtitleAr || null,
        badge: p.badge || null,
        is_featured: !!p.isFeatured,
      });
      setProducts((prev) => prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
      toast(isAr ? 'تم حفظ المنتج عبر واجهة المنتجات' : 'Product saved via the products API', 'success');
    } catch {
      toast(isAr ? 'فشل حفظ المنتج' : 'Product save failed', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
        {isAr ? 'تعديل المنتج يستخدم واجهة المنتجات وليس الثيم. أزرار الشراء في الثيم تقرأ الكتالوج بعد الحفظ.' : 'Edit Product uses the products API, not theme JSON. Theme buy buttons read the catalog after save.'}
      </p>
      <a href={`/admin?store=${encodeURIComponent(activeStore.slug || 'coffee')}&tab=products`} className="text-xs font-bold text-emerald-700 underline">
        {isAr ? 'فتح دليل المنتجات' : 'Open product catalog'}
      </a>
      {loading && <p className="text-xs text-muted">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="text-xs text-muted">{isAr ? 'لا منتجات في هذا المتجر. أضف منتجاً من دليل المنتجات.' : 'This store has no products. Add one from the catalog.'}</p>
      )}
      {products.map((p) => (
        <div key={p.id} className={cardCls} style={cardStyle}>
          <div className="text-[11px] font-mono text-muted">{p.sku || p.id}</div>
          <BiFields
            isAr={isAr}
            labelEn="Name"
            labelAr="الاسم"
            en={p.name}
            ar={p.nameAr || ''}
            onEn={(v) => setProducts((prev) => prev.map((row) => (row.id === p.id ? { ...row, name: v } : row)))}
            onAr={(v) => setProducts((prev) => prev.map((row) => (row.id === p.id ? { ...row, nameAr: v } : row)))}
          />
          <BiFields
            isAr={isAr}
            labelEn="Subtitle / CTA line"
            labelAr="سطر الدعوة"
            en={p.subtitle || ''}
            ar={p.subtitleAr || ''}
            onEn={(v) => setProducts((prev) => prev.map((row) => (row.id === p.id ? { ...row, subtitle: v } : row)))}
            onAr={(v) => setProducts((prev) => prev.map((row) => (row.id === p.id ? { ...row, subtitleAr: v } : row)))}
          />
          <label className="flex items-center gap-2 text-xs font-bold">
            <input type="checkbox" checked={!!p.isFeatured} onChange={(e) => setProducts((prev) => prev.map((row) => (row.id === p.id ? { ...row, isFeatured: e.target.checked } : row)))} />
            {isAr ? 'منتج مميز' : 'Featured'}
          </label>
          <button type="button" onClick={() => saveProduct(products.find((row) => row.id === p.id) || p)} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">
            {isAr ? 'حفظ المنتج' : 'Save product'}
          </button>
        </div>
      ))}
    </div>
  );
};

/** CW-08 — Customer Reviews widget settings + API queue. */
export { CoffeeCustomerReviewsForm, CoffeeReviewsForm } from './CoffeeCustomerReviewsForm';
/** CW-09 — FAQ bilingual Q/A. */
export { CoffeeFaqForm } from './CoffeeFaqForm';
/** CW-10 — Commercial Hero SKU slides + feature chips. */
export { CoffeeCommercialHeroForm } from './CoffeeCommercialHeroForm';
/** CW-11 — Product Slider rail (≠ Product Carousel). */
export { CoffeeProductSliderForm } from './CoffeeProductSliderForm';
/** CW-13 — Product Collection promo + products + benefits. */
export { CoffeeProductCollectionForm } from './CoffeeProductCollectionForm';
