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
  FeaturedCategoryEntry,
  FeaturedSectionBanner,
  ImageBannerItem,
  ExclusiveBenefitItem,
  FooterColumn,
  CustomOrderField,
  ShopCatalogSettings,
  CheckoutFieldSettings,
  SeoDefaultSettings,
} from '../../../../themes/settings/coffeeModularSettings';
import { bi, shopGridClass } from '../../../../themes/settings/coffeeModularSettings';
import type { BannerItem } from '../../../../themes/settings/themeSettingsStore';
import { fetchProducts, updateProduct, fetchStoreReviewsApi, saveStoreReviewsApi, type StoreReviewRecord } from '../../../../api/tenantApi';
import type { Product } from '../../../../types';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import { safeFeatureImage } from '../../../../themes/coffeeRoasters/components/CoffeeFeatureIconsBar';

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

export const FeaturedCategoriesProductsForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('featuredCategoriesProducts');
  const sections = draft?.sections || [];
  const patchSection = (id: string, patch: Partial<(typeof sections)[number]>) =>
    setDraft({ ...draft, sections: sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Featured Categories & Products',
    titleAr: 'التصنيفات والمنتجات المميزة',
    subtitleEn: 'Category rails and product counts. The storefront reads this key after Save.',
    subtitleAr: 'صفوف التصنيفات وعدد المنتجات. المتجر يقرأ هذا المفتاح بعد الحفظ.',
    preview: () => (
      <LinesPreview
        device="desktop"
        title={bi(isAr ? 'ar' : 'en', sections[0]?.titleEn, sections[0]?.titleAr) || (isAr ? 'التصنيفات' : 'Categories')}
        lines={(sections[0]?.categories || []).map((c) => bi(isAr ? 'ar' : 'en', c.labelEn, c.labelAr))}
        image={sections[0]?.categories?.[0]?.image}
      />
    ),
  }, (
    <>
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <p className="text-[11px] text-slate-500">{isAr ? `الأقسام (${sections.length})` : `Sections (${sections.length})`}</p>
      {sections.length === 0 && (
        <p className="text-xs text-muted">{isAr ? 'لا توجد أقسام. أضف قسماً لعرضه في المتجر.' : 'No sections yet. Add one to show it on the storefront.'}</p>
      )}
      {sections.map((section, index) => (
        <div key={section.id} className={cardCls} style={cardStyle}>
          <div className="flex items-center justify-between gap-2">
            <EnableRow isAr={isAr} enabled={section.enabled} onChange={(v) => patchSection(section.id, { enabled: v })} labelEn="Section" labelAr="القسم" />
            <RowTools
              isAr={isAr}
              visible={section.enabled !== false}
              onToggleVisible={() => patchSection(section.id, { enabled: section.enabled === false })}
              index={index}
              total={sections.length}
              onUp={() => setDraft({ ...draft, sections: moveItem(sections, index, -1) })}
              onDown={() => setDraft({ ...draft, sections: moveItem(sections, index, 1) })}
              onDuplicate={() => setDraft({ ...draft, sections: duplicateAt(sections, index, 'fcp') })}
              onDelete={() => setDraft({ ...draft, sections: sections.filter((s) => s.id !== section.id) })}
            />
          </div>
          <BiFields isAr={isAr} labelEn="Title" labelAr="العنوان" en={section.titleEn} ar={section.titleAr} max={100} onEn={(v) => patchSection(section.id, { titleEn: v })} onAr={(v) => patchSection(section.id, { titleAr: v })} />
          <BiFields isAr={isAr} labelEn="Description" labelAr="الوصف" en={section.descriptionEn} ar={section.descriptionAr} max={200} onEn={(v) => patchSection(section.id, { descriptionEn: v })} onAr={(v) => patchSection(section.id, { descriptionAr: v })} />
          <div className="space-y-2">
            {(section.categories || []).map((cat, ci) => (
              <div key={cat.id} className="space-y-2 rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between gap-2">
                  <EnableRow
                    isAr={isAr}
                    enabled={cat.enabled !== false}
                    onChange={(v) => {
                      const categories = section.categories.map((c, i) => (i === ci ? { ...c, enabled: v } : c));
                      patchSection(section.id, { categories });
                    }}
                    labelEn="Category"
                    labelAr="التصنيف"
                  />
                  <RowTools
                    isAr={isAr}
                    visible={cat.enabled !== false}
                    onToggleVisible={() => {
                      const categories = section.categories.map((c, i) => (i === ci ? { ...c, enabled: c.enabled === false } : c));
                      patchSection(section.id, { categories });
                    }}
                    index={ci}
                    total={section.categories.length}
                    onUp={() => patchSection(section.id, { categories: moveItem(section.categories, ci, -1) })}
                    onDown={() => patchSection(section.id, { categories: moveItem(section.categories, ci, 1) })}
                    onDuplicate={() => patchSection(section.id, { categories: duplicateAt(section.categories, ci, 'fcp-cat') })}
                    onDelete={() => patchSection(section.id, { categories: section.categories.filter((c) => c.id !== cat.id) })}
                  />
                </div>
                <BiFields
                  isAr={isAr}
                  labelEn="Label"
                  labelAr="التسمية"
                  en={cat.labelEn}
                  ar={cat.labelAr}
                  onEn={(v) => {
                    const categories = section.categories.map((c, i) => (i === ci ? { ...c, labelEn: v } : c));
                    patchSection(section.id, { categories });
                  }}
                  onAr={(v) => {
                    const categories = section.categories.map((c, i) => (i === ci ? { ...c, labelAr: v } : c));
                    patchSection(section.id, { categories });
                  }}
                />
                <label className="text-[11px] font-bold space-y-1 block">
                  <span>{isAr ? 'معرّف التصنيف (فلتر المنتجات)' : 'Category ID (product filter)'}</span>
                  <input
                    value={cat.categoryId || ''}
                    onChange={(e) => {
                      const categories = section.categories.map((c, i) => (i === ci ? { ...c, categoryId: e.target.value } : c));
                      patchSection(section.id, { categories });
                    }}
                    className="w-full px-2 py-1.5 rounded-lg border text-xs"
                    style={{ borderColor: 'var(--border)' }}
                    dir="ltr"
                    placeholder="machines"
                  />
                </label>
                <MediaUploadField
                  label={isAr ? 'صورة التصنيف (مكتبة / رفع)' : 'Category image (library / upload)'}
                  value={cat.image || ''}
                  onChange={(url) => {
                    const categories = section.categories.map((c, i) => (i === ci ? { ...c, image: url } : c));
                    patchSection(section.id, { categories });
                  }}
                  aspectRatio="square"
                  initialFolder="categories"
                  recommendedSize="600 × 600 px"
                />
              </div>
            ))}
            <AddButton
              isAr={isAr}
              labelEn="Add category"
              labelAr="إضافة تصنيف"
              onClick={() => {
                const row: FeaturedCategoryEntry = {
                  id: `fcp-cat-${Date.now()}`,
                  enabled: true,
                  entryType: 'category',
                  labelEn: '',
                  labelAr: '',
                  categoryId: '',
                  image: '',
                  pageUrl: '',
                };
                patchSection(section.id, { categories: [...section.categories, row] });
              }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <label className="font-bold space-y-1">
              <span>{isAr ? 'عدد المنتجات' : 'Product count'}</span>
              <input type="number" min={1} max={24} value={section.productCount} onChange={(e) => patchSection(section.id, { productCount: Number(e.target.value) || 1 })} className="w-full px-2 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} />
            </label>
            <label className="font-bold space-y-1">
              <span>{isAr ? 'أعمدة سطح المكتب' : 'Desktop columns'}</span>
              <input type="number" min={2} max={6} value={section.columnsDesktop} onChange={(e) => patchSection(section.id, { columnsDesktop: Number(e.target.value) || 4 })} className="w-full px-2 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} />
            </label>
            <label className="flex items-center gap-2 font-bold">
              <input type="checkbox" checked={section.showPrice} onChange={(e) => patchSection(section.id, { showPrice: e.target.checked })} />
              {isAr ? 'السعر' : 'Price'}
            </label>
            <label className="flex items-center gap-2 font-bold">
              <input type="checkbox" checked={section.showRating !== false} onChange={(e) => patchSection(section.id, { showRating: e.target.checked })} />
              {isAr ? 'التقييم' : 'Rating'}
            </label>
            <label className="flex items-center gap-2 font-bold">
              <input type="checkbox" checked={section.showViewMore} onChange={(e) => patchSection(section.id, { showViewMore: e.target.checked })} />
              {isAr ? 'عرض المزيد' : 'View more'}
            </label>
          </div>
          <BiFields isAr={isAr} labelEn="View more" labelAr="عرض المزيد" en={section.viewMoreEn} ar={section.viewMoreAr} onEn={(v) => patchSection(section.id, { viewMoreEn: v })} onAr={(v) => patchSection(section.id, { viewMoreAr: v })} />
          <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--hover-bg)' }}>
            <div className="font-black">{bi(isAr ? 'ar' : 'en', section.titleEn, section.titleAr) || (isAr ? 'بدون عنوان' : 'Untitled')}</div>
            <div className="text-muted">{(section.categories || []).filter((c) => c.enabled).map((c) => bi(isAr ? 'ar' : 'en', c.labelEn, c.labelAr)).join(' · ') || (isAr ? 'لا تصنيفات' : 'No categories')}</div>
          </div>
        </div>
      ))}
      <AddButton
        isAr={isAr}
        labelEn="Add section"
        labelAr="إضافة قسم"
        onClick={() =>
          setDraft({
            ...draft,
            enabled: true,
            sections: [
              ...sections,
              {
                id: `fcp-${Date.now()}`,
                enabled: true,
                titleEn: '',
                titleAr: '',
                descriptionEn: '',
                descriptionAr: '',
                categories: [],
                productSource: 'category',
                productIds: [],
                sortBy: 'manual',
                productCount: 8,
                compareEnabled: false,
                maxCompare: 3,
                compareButtonEn: '',
                compareButtonAr: '',
                showPrice: true,
                showRating: true,
                showDiscount: true,
                showCompare: false,
                showViewMore: false,
                viewMoreEn: '',
                viewMoreAr: '',
                viewMoreLink: '',
                columnsDesktop: 4,
                columnsMobile: 2,
                cardStyle: 'rounded',
                spacing: 'medium',
              },
            ],
          })
        }
      />
    </>
  ));
};

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
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <BiFields isAr={isAr} labelEn="Section title" labelAr="عنوان القسم" en={draft?.titleEn || ''} ar={draft?.titleAr || ''} onEn={(v) => setDraft({ ...draft, titleEn: v })} onAr={(v) => setDraft({ ...draft, titleAr: v })} />
      <BiFields isAr={isAr} labelEn="Subtitle" labelAr="الوصف" en={draft?.subtitleEn || ''} ar={draft?.subtitleAr || ''} onEn={(v) => setDraft({ ...draft, subtitleEn: v })} onAr={(v) => setDraft({ ...draft, subtitleAr: v })} />
      {banners.length === 0 && <p className="text-xs text-muted">{isAr ? 'لا بانرات مميزة. القسم يختفي.' : 'No featured banners. The section hides.'}</p>}
      {banners.map((b, index) => (
        <div key={b.id} className={cardCls} style={{ ...cardStyle, background: b.bgColor || 'var(--surface)' }}>
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
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <BiFields isAr={isAr} labelEn="Section title" labelAr="عنوان القسم" en={draft?.titleEn || ''} ar={draft?.titleAr || ''} onEn={(v) => setDraft({ ...draft, titleEn: v })} onAr={(v) => setDraft({ ...draft, titleAr: v })} />
      <BiFields isAr={isAr} labelEn="Description" labelAr="الوصف" en={draft?.descriptionEn || ''} ar={draft?.descriptionAr || ''} onEn={(v) => setDraft({ ...draft, descriptionEn: v })} onAr={(v) => setDraft({ ...draft, descriptionAr: v })} />
      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
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
      </div>
      {tabs.length === 0 && <p className="text-xs text-muted">{isAr ? 'لا تبويبات. أضف تبويباً أو سيُستخدم كتالوج المتجر إن وُجد.' : 'No tabs yet. Add one, or the storefront uses the live catalog when the section is enabled.'}</p>}
      {tabs.map((tab, index) => (
        <div key={tab.id} className="flex flex-col md:flex-row md:items-end gap-2">
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
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      {items.length === 0 && <p className="text-xs text-muted">{isAr ? 'لا صور. الشبكة تختفي.' : 'No images. The grid hides.'}</p>}
      {items.map((it, index) => (
        <div key={it.id} className={cardCls} style={cardStyle}>
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
        </div>
      ))}
      <AddButton
        isAr={isAr}
        labelEn="Add image"
        labelAr="إضافة صورة"
        onClick={() => {
          const row: ImageBannerItem = { id: `img-${Date.now()}`, enabled: true, image: '', titleEn: '', titleAr: '', subtitleEn: '', subtitleAr: '', link: '', buttonEn: '', buttonAr: '' };
          setDraft({ ...draft, enabled: true, items: [...items, row] });
        }}
      />
    </>
  ));
};

export const CoffeeFooterForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('footer');
  const columns = draft?.columns || [];
  const patchCol = (id: string, p: Partial<FooterColumn>) => setDraft({ ...draft, columns: columns.map((c) => (c.id === id ? { ...c, ...p } : c)) });
  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Footer',
    titleAr: 'التذييل',
    subtitleEn: 'Footer columns and layout. Layout also syncs into general footer options on Save.',
    subtitleAr: 'أعمدة التذييل والتخطيط. يُزامَن التخطيط أيضاً مع خيارات التذييل العامة عند الحفظ.',
    preview: () => (
        <LinesPreview device="desktop" title={bi(isAr ? 'ar' : 'en', draft?.aboutEn, draft?.aboutAr)} lines={(columns || []).map((c) => bi(isAr ? 'ar' : 'en', c.titleEn, c.titleAr))} />
      ),
  }, (
    <>
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'تخطيط التذييل (يُزامَن مع خيارات التذييل العامة)' : 'Footer layout (synced with general footer options)'}</span>
        <select value={draft?.layout || 'columns'} onChange={(e) => setDraft({ ...draft, layout: e.target.value as 'standard' | 'columns' | 'saudi-minimal' })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }}>
          <option value="standard">{isAr ? 'قياسي' : 'Standard'}</option>
          <option value="columns">{isAr ? 'أعمدة' : 'Columns'}</option>
          <option value="saudi-minimal">{isAr ? 'سعودي مبسّط' : 'Saudi minimal'}</option>
        </select>
      </label>
      <BiFields isAr={isAr} labelEn="About" labelAr="نبذة" en={draft?.aboutEn || ''} ar={draft?.aboutAr || ''} onEn={(v) => setDraft({ ...draft, aboutEn: v })} onAr={(v) => setDraft({ ...draft, aboutAr: v })} />
      <BiFields isAr={isAr} labelEn="Copyright" labelAr="حقوق النشر" en={draft?.copyrightEn || ''} ar={draft?.copyrightAr || ''} onEn={(v) => setDraft({ ...draft, copyrightEn: v })} onAr={(v) => setDraft({ ...draft, copyrightAr: v })} />
      <BiFields isAr={isAr} labelEn="Address" labelAr="العنوان" en={draft?.addressEn || ''} ar={draft?.addressAr || ''} onEn={(v) => setDraft({ ...draft, addressEn: v })} onAr={(v) => setDraft({ ...draft, addressAr: v })} />
      <BiFields isAr={isAr} labelEn="Hours" labelAr="ساعات العمل" en={draft?.hoursEn || ''} ar={draft?.hoursAr || ''} onEn={(v) => setDraft({ ...draft, hoursEn: v })} onAr={(v) => setDraft({ ...draft, hoursAr: v })} />
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'البريد' : 'Email'}</span>
        <input value={draft?.contactEmail || ''} onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} dir="ltr" />
      </label>
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'الهاتف' : 'Phone'}</span>
        <input value={draft?.contactPhone || ''} onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} dir="ltr" />
      </label>
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
      {columns.map((col, index) => (
        <div key={col.id} className={cardCls} style={cardStyle}>
          <div className="flex justify-between">
            <BiFields isAr={isAr} labelEn="Column" labelAr="العمود" en={col.titleEn} ar={col.titleAr} onEn={(v) => patchCol(col.id, { titleEn: v })} onAr={(v) => patchCol(col.id, { titleAr: v })} />
            <RowTools isAr={isAr} index={index} total={columns.length} onUp={() => setDraft({ ...draft, columns: moveItem(columns, index, -1) })} onDown={() => setDraft({ ...draft, columns: moveItem(columns, index, 1) })} onDuplicate={() => setDraft({ ...draft, columns: duplicateAt(columns, index, 'foot').map((c, i) => i === index + 1 ? { ...c, links: (c.links || []).map((l) => ({ ...l, id: `lnk-${Date.now()}-${l.id}` })) } : c) })} onDelete={() => setDraft({ ...draft, columns: columns.filter((c) => c.id !== col.id) })} />
          </div>
          {(col.links || []).map((link, li) => (
            <div key={link.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-2 items-end">
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
              <button type="button" className="text-[11px] text-rose-600" onClick={() => patchCol(col.id, { links: col.links.filter((l) => l.id !== link.id) })}>
                {isAr ? 'حذف' : 'Delete'}
              </button>
            </div>
          ))}
          <AddButton isAr={isAr} labelEn="Add link" labelAr="إضافة رابط" onClick={() => patchCol(col.id, { links: [...col.links, { id: `lnk-${Date.now()}`, labelEn: '', labelAr: '', url: 'home' }] })} />
        </div>
      ))}
      <AddButton isAr={isAr} labelEn="Add column" labelAr="إضافة عمود" onClick={() => setDraft({ ...draft, enabled: true, columns: [...columns, { id: `col-${Date.now()}`, titleEn: '', titleAr: '', links: [] }] })} />
    </>
  ));
};

export const CatalogControlsForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const shopHook = useCoffeeDraft('shop');
  const checkoutHook = useCoffeeDraft('checkoutFields');
  const seoHook = useCoffeeDraft('seoDefaults');
  const { isAr, activeStore, toast } = shopHook;
  const shop = shopHook.draft;
  const checkout = checkoutHook.draft;
  const seo = seoHook.draft;
  const [saving, setSaving] = useState(false);

  const saveAll = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeStore?.id) return;
    setSaving(true);
    try {
      const { readAllThemeSettings, writeAllThemeSettings, resolveStoreActiveThemeId } = await import('../../../../themes/settings/themeSettingsStore');
      const full = readAllThemeSettings(activeStore.id, activeStore);
      full.shop = { columnsDesktop: 4, columnsTablet: 3, columnsMobile: 2, perPage: 24, defaultSort: 'featured', showFilters: true, ...(shop || {}) };
      full.checkoutFields = { allowGuest: true, showCoupon: true, showOrderNote: false, showShipping: true, ...(checkout || {}) };
      full.seoDefaults = { titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '', ogImage: '', ...(seo || {}) };
      await writeAllThemeSettings(activeStore.id, full);
      const { isApiEnabled } = await import('../../../../api/client');
      if (isApiEnabled()) {
        const { updateThemeSettingsApi } = await import('../../../../api/tenantApi');
        await updateThemeSettingsApi(activeStore.id, {
          theme_id: resolveStoreActiveThemeId(activeStore.id) || 'theme-coffee-artisan',
          settings: { shop: full.shop, checkoutFields: full.checkoutFields, seoDefaults: full.seoDefaults },
        });
      }
      toast(isAr ? 'تم حفظ إعدادات المتجر.' : 'Shop settings saved.', 'success');
    } catch {
      toast(isAr ? 'تعذر الحفظ.' : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash: false,
    onSave: saveAll,
    titleEn: 'Shop and checkout',
    titleAr: 'المتجر وإتمام الشراء',
    subtitleEn: 'Grid, filters, checkout blocks, and SEO templates. Product rows stay untouched.',
    subtitleAr: 'شبكة المتجر والفلاتر وكتل الشراء وقوالب السيو. صفوف المنتجات تبقى كما هي.',
    preview: () => <LinesPreview device="desktop" title={isAr ? 'شبكة المتجر' : 'Shop grid'} lines={[String(shop?.columnsDesktop || 4), String(shop?.perPage || 24)]} />,
  }, (
    <>
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'أعمدة سطح المكتب' : 'Desktop columns'}</span>
        <input type="number" min={2} max={4} value={shop?.columnsDesktop || 4} onChange={(e) => shopHook.setDraft({ ...shop, columnsDesktop: Number(e.target.value) || 4 } as ShopCatalogSettings)} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} />
      </label>
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'أعمدة الجهاز اللوحي' : 'Tablet columns'}</span>
        <input type="number" min={2} max={4} value={shop?.columnsTablet || 3} onChange={(e) => shopHook.setDraft({ ...shop, columnsTablet: Number(e.target.value) || 3 } as ShopCatalogSettings)} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} />
      </label>
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'أعمدة الجوال' : 'Mobile columns'}</span>
        <input type="number" min={1} max={2} value={shop?.columnsMobile || 2} onChange={(e) => shopHook.setDraft({ ...shop, columnsMobile: Number(e.target.value) || 2 } as ShopCatalogSettings)} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} />
      </label>
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'عدد المنتجات في الصفحة' : 'Products per page'}</span>
        <input type="number" min={4} max={48} value={shop?.perPage || 24} onChange={(e) => shopHook.setDraft({ ...shop, perPage: Number(e.target.value) || 24 } as ShopCatalogSettings)} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} />
      </label>
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'الترتيب الافتراضي' : 'Default sort'}</span>
        <select value={shop?.defaultSort || 'featured'} onChange={(e) => shopHook.setDraft({ ...shop, defaultSort: e.target.value as ShopCatalogSettings['defaultSort'] } as ShopCatalogSettings)} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }}>
          <option value="featured">{isAr ? 'المميز' : 'Featured'}</option>
          <option value="price-asc">{isAr ? 'السعر من الأقل' : 'Price low to high'}</option>
          <option value="price-desc">{isAr ? 'السعر من الأعلى' : 'Price high to low'}</option>
          <option value="rating">{isAr ? 'التقييم' : 'Rating'}</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={shop?.showFilters !== false} onChange={(e) => shopHook.setDraft({ ...shop, showFilters: e.target.checked } as ShopCatalogSettings)} />
        {isAr ? 'إظهار الفلاتر' : 'Show filters'}
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={checkout?.showCoupon !== false} onChange={(e) => checkoutHook.setDraft({ ...checkout, showCoupon: e.target.checked } as CheckoutFieldSettings)} />
        {isAr ? 'إظهار الكوبون' : 'Show coupon'}
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={checkout?.showOrderNote === true} onChange={(e) => checkoutHook.setDraft({ ...checkout, showOrderNote: e.target.checked } as CheckoutFieldSettings)} />
        {isAr ? 'إظهار ملاحظة الطلب' : 'Show order note'}
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={checkout?.showShipping !== false} onChange={(e) => checkoutHook.setDraft({ ...checkout, showShipping: e.target.checked } as CheckoutFieldSettings)} />
        {isAr ? 'إظهار عنوان الشحن' : 'Show shipping address'}
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={checkout?.allowGuest !== false} onChange={(e) => checkoutHook.setDraft({ ...checkout, allowGuest: e.target.checked } as CheckoutFieldSettings)} />
        {isAr ? 'السماح بالشراء دون حساب' : 'Allow guest checkout'}
      </label>
      <BiFields isAr={isAr} labelEn="SEO title" labelAr="عنوان السيو" en={seo?.titleEn || ''} ar={seo?.titleAr || ''} onEn={(v) => seoHook.setDraft({ ...seo, titleEn: v } as SeoDefaultSettings)} onAr={(v) => seoHook.setDraft({ ...seo, titleAr: v } as SeoDefaultSettings)} />
      <BiFields isAr={isAr} labelEn="SEO description" labelAr="وصف السيو" en={seo?.descriptionEn || ''} ar={seo?.descriptionAr || ''} onEn={(v) => seoHook.setDraft({ ...seo, descriptionEn: v } as SeoDefaultSettings)} onAr={(v) => seoHook.setDraft({ ...seo, descriptionAr: v } as SeoDefaultSettings)} />
      <MediaUploadField
        label={isAr ? 'صورة المشاركة' : 'Share image'}
        value={seo?.ogImage || ''}
        onChange={(url) => seoHook.setDraft({ ...seo, ogImage: url } as SeoDefaultSettings)}
        aspectRatio="banner"
      />
    </>
  ));
};

export const ExclusiveBenefitsForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('exclusiveBenefits');
  const items = draft?.items || [];
  const patch = (id: string, p: Partial<ExclusiveBenefitItem>) => setDraft({ ...draft, items: items.map((it) => (it.id === id ? { ...it, ...p } : it)) });
  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Exclusive Benefits',
    titleAr: 'المزايا الحصرية',
    subtitleEn: 'Perk cards for the exclusive benefits strip. Hidden when disabled or empty.',
    subtitleAr: 'بطاقات المزايا لشريط المزايا الحصرية. يختفي إذا عُطّل أو فرغ.',
    preview: () => (
        <LinesPreview device="desktop" title={bi(isAr ? 'ar' : 'en', draft?.titleEn, draft?.titleAr)} lines={(items || []).map((it) => bi(isAr ? 'ar' : 'en', it.titleEn, it.titleAr))} />
      ),
  }, (
    <>
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <BiFields isAr={isAr} labelEn="Title" labelAr="العنوان" en={draft?.titleEn || ''} ar={draft?.titleAr || ''} onEn={(v) => setDraft({ ...draft, titleEn: v })} onAr={(v) => setDraft({ ...draft, titleAr: v })} />
      <BiFields isAr={isAr} labelEn="Subtitle" labelAr="الوصف" en={draft?.subtitleEn || ''} ar={draft?.subtitleAr || ''} onEn={(v) => setDraft({ ...draft, subtitleEn: v })} onAr={(v) => setDraft({ ...draft, subtitleAr: v })} />
      {items.length === 0 && <p className="text-xs text-muted">{isAr ? 'لا مزايا. القسم يختفي.' : 'No benefits. The section hides.'}</p>}
      {items.map((it, index) => (
        <div key={it.id} className={cardCls} style={cardStyle}>
          <div className="flex justify-between">
            <EnableRow isAr={isAr} enabled={it.enabled} onChange={(v) => patch(it.id, { enabled: v })} labelEn="Benefit" labelAr="الميزة" />
            <RowTools isAr={isAr} visible={it.enabled !== false} onToggleVisible={() => patch(it.id, { enabled: it.enabled === false })} index={index} total={items.length} onUp={() => setDraft({ ...draft, items: moveItem(items, index, -1) })} onDown={() => setDraft({ ...draft, items: moveItem(items, index, 1) })} onDuplicate={() => setDraft({ ...draft, items: duplicateAt(items, index, 'ben') })} onDelete={() => setDraft({ ...draft, items: items.filter((x) => x.id !== it.id) })} />
          </div>
          <BiFields isAr={isAr} labelEn="Title" labelAr="العنوان" en={it.titleEn} ar={it.titleAr} onEn={(v) => patch(it.id, { titleEn: v })} onAr={(v) => patch(it.id, { titleAr: v })} />
          <BiFields isAr={isAr} labelEn="Description" labelAr="الوصف" en={it.descriptionEn} ar={it.descriptionAr} onEn={(v) => patch(it.id, { descriptionEn: v })} onAr={(v) => patch(it.id, { descriptionAr: v })} />
        </div>
      ))}
      <AddButton isAr={isAr} labelEn="Add benefit" labelAr="إضافة ميزة" onClick={() => setDraft({ ...draft, enabled: true, items: [...items, { id: `ben-${Date.now()}`, enabled: true, icon: 'ShieldCheck', titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '' }] })} />
    </>
  ));
};

export const ProductCarouselForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('productCarousel');
  return wordForm({
    onBack,
    embedded,
    isAr,
    saving,
    savedFlash,
    onSave: save,
    titleEn: 'Product Carousel',
    titleAr: 'كاروسيل المنتجات',
    subtitleEn: 'Carousel title and catalog category. Cards use live products after Save.',
    subtitleAr: 'عنوان الكاروسيل وتصنيف الكتالوج. البطاقات من المنتجات الحية بعد الحفظ.',
    preview: () => (
        <LinesPreview device="desktop" title={bi(isAr ? 'ar' : 'en', draft?.titleEn, draft?.titleAr)} lines={[bi(isAr ? 'ar' : 'en', draft?.subtitleEn, draft?.subtitleAr), draft?.categoryId || '']} />
      ),
  }, (
    <>
      <EnableRow isAr={isAr} enabled={!!draft?.enabled} onChange={(v) => setDraft({ ...draft, enabled: v })} />
      <BiFields isAr={isAr} labelEn="Title" labelAr="العنوان" en={draft?.titleEn || ''} ar={draft?.titleAr || ''} onEn={(v) => setDraft({ ...draft, titleEn: v })} onAr={(v) => setDraft({ ...draft, titleAr: v })} />
      <BiFields isAr={isAr} labelEn="Subtitle" labelAr="الوصف" en={draft?.subtitleEn || ''} ar={draft?.subtitleAr || ''} onEn={(v) => setDraft({ ...draft, subtitleEn: v })} onAr={(v) => setDraft({ ...draft, subtitleAr: v })} />
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'تصنيف الكتالوج (فارغ = الكل)' : 'Catalog category (empty = all)'}</span>
        <input value={draft?.categoryId || ''} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} dir="ltr" />
      </label>
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'عدد المنتجات' : 'Product count'}</span>
        <input type="number" min={1} max={24} value={draft?.productCount || 8} onChange={(e) => setDraft({ ...draft, productCount: Number(e.target.value) || 8 })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} />
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={draft?.autoplay !== false} onChange={(e) => setDraft({ ...draft, autoplay: e.target.checked })} />
        {isAr ? 'تشغيل تلقائي للكاروسيل' : 'Carousel autoplay'}
      </label>
      <p className="text-[11px] text-muted">{isAr ? 'البطاقات من كتالوج المتجر الحقيقي. إذا لم توجد منتجات يختفي القسم.' : 'Cards use the live catalog. The section hides when no products match.'}</p>
    </>
  ));
};

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
      <p className="text-[11px] text-muted">{isAr ? 'قسم البانر (C-BAN) منفصل عن الهيرو والبانرات المميزة.' : 'Banner section (C-BAN) is separate from the hero and featured banners.'}</p>
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
      <label className="text-[11px] font-bold space-y-1 block">
        <span>{isAr ? 'تصنيف المنتجات بجانب البانر' : 'Products beside the banner'}</span>
        <input value={draft?.categoryId || ''} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} dir="ltr" />
      </label>
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
        <span>{isAr ? 'رقم واتساب' : 'WhatsApp number'}</span>
        <input value={draft?.whatsappNumber || ''} onChange={(e) => setDraft({ ...draft, whatsappNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} dir="ltr" />
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
        {isAr
          ? 'تعديل المنتج يستخدم واجهة المنتجات وليس JSON الثيم. أزرار الشراء في الثيم تقرأ الكتالوج بعد الحفظ.'
          : 'Edit Product uses the products API, not theme JSON. Theme buy buttons read the catalog after save.'}
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

export const CoffeeReviewsForm: React.FC = () => {
  const { isAr, activeStore, toast } = useCoffeeDraft('newsletter');
  const [reviews, setReviews] = useState<StoreReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetchStoreReviewsApi(activeStore.id)
      .then((rows) => {
        if (!cancel) setReviews(rows);
      })
      .catch(() => {
        if (!cancel) setReviews([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [activeStore.id]);

  const save = async () => {
    setSaving(true);
    try {
      const next = await saveStoreReviewsApi(activeStore.id, reviews);
      setReviews(next);
      toast(isAr ? 'تم حفظ التقييمات عبر واجهة التقييمات' : 'Reviews saved via the reviews API', 'success');
    } catch {
      toast(isAr ? 'فشل حفظ التقييمات' : 'Could not save reviews', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
        {isAr
          ? 'التقييمات تُحفظ في واجهة /reviews وليست ضمن JSON الثيم. التقييم الجديد من الواجهة يصل بانتظار الموافقة.'
          : 'Reviews persist on the reviews API, not theme JSON. Storefront submissions arrive pending approval.'}
      </p>
      {loading && <p className="text-xs text-muted">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>}
      {!loading && reviews.length === 0 && (
        <p className="text-xs text-muted">{isAr ? 'لا تقييمات بعد. المتجر يعرض حالة فارغة حقيقية.' : 'No reviews yet. The storefront shows a real empty state.'}</p>
      )}
      {reviews.map((rev, index) => (
        <div key={rev.id} className={cardCls} style={cardStyle}>
          <div className="flex justify-between gap-2">
            <EnableRow isAr={isAr} enabled={rev.active} onChange={(v) => setReviews(reviews.map((r, i) => (i === index ? { ...r, active: v } : r)))} labelEn="Visible" labelAr="ظاهر" />
            <RowTools
              isAr={isAr}
              visible={rev.active !== false}
              onToggleVisible={() => setReviews(reviews.map((r, i) => (i === index ? { ...r, active: r.active === false } : r)))}
              index={index}
              total={reviews.length}
              onUp={() => setReviews(moveItem(reviews, index, -1))}
              onDown={() => setReviews(moveItem(reviews, index, 1))}
              onDelete={() => setReviews(reviews.filter((r) => r.id !== rev.id))}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="text-[11px] font-bold space-y-1">
              <span>{isAr ? 'اسم العميل' : 'Customer name'}</span>
              <input value={rev.author || ''} onChange={(e) => setReviews(reviews.map((r, i) => (i === index ? { ...r, author: e.target.value } : r)))} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} />
            </label>
            <label className="text-[11px] font-bold space-y-1">
              <span>{isAr ? 'المدينة' : 'City'}</span>
              <input value={rev.city || ''} onChange={(e) => setReviews(reviews.map((r, i) => (i === index ? { ...r, city: e.target.value } : r)))} className="w-full px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} />
            </label>
          </div>
          <BiFields isAr={isAr} labelEn="Product" labelAr="المنتج" en={rev.product || ''} ar={rev.productAr || ''} onEn={(v) => setReviews(reviews.map((r, i) => (i === index ? { ...r, product: v } : r)))} onAr={(v) => setReviews(reviews.map((r, i) => (i === index ? { ...r, productAr: v } : r)))} />
          <label className="text-[11px] font-bold space-y-1 block">
            <span>{isAr ? 'التقييم (١–٥)' : 'Rating (1–5)'}</span>
            <input type="number" min={1} max={5} value={rev.rating || 5} onChange={(e) => setReviews(reviews.map((r, i) => (i === index ? { ...r, rating: Math.min(5, Math.max(1, Number(e.target.value) || 5)) } : r)))} className="w-24 px-3 py-2 rounded-xl border text-xs" style={{ borderColor: 'var(--border)' }} />
          </label>
          <BiFields isAr={isAr} labelEn="Title" labelAr="العنوان" en={rev.title} ar={rev.titleAr || ''} onEn={(v) => setReviews(reviews.map((r, i) => (i === index ? { ...r, title: v } : r)))} onAr={(v) => setReviews(reviews.map((r, i) => (i === index ? { ...r, titleAr: v } : r)))} />
          <BiFields isAr={isAr} labelEn="Comment" labelAr="التعليق" en={rev.comment} ar={rev.commentAr || ''} onEn={(v) => setReviews(reviews.map((r, i) => (i === index ? { ...r, comment: v } : r)))} onAr={(v) => setReviews(reviews.map((r, i) => (i === index ? { ...r, commentAr: v } : r)))} />
          <label className="flex items-center gap-2 text-xs font-bold">
            <input type="checkbox" checked={rev.verified} onChange={(e) => setReviews(reviews.map((r, i) => (i === index ? { ...r, verified: e.target.checked } : r)))} />
            {isAr ? 'مشتري موثّق' : 'Verified buyer'}
          </label>
        </div>
      ))}
      <AddButton
        isAr={isAr}
        labelEn="Add review"
        labelAr="إضافة تقييم"
        onClick={() =>
          setReviews([
            ...reviews,
            { id: `rev-${Date.now()}`, author: '', city: '', product: '', productAr: '', rating: 5, title: '', titleAr: '', comment: '', commentAr: '', verified: true, active: true, likes: 0, date: new Date().toISOString().slice(0, 10) },
          ])
        }
      />
      <button type="button" disabled={saving} onClick={save} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white">
        {saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : isAr ? 'حفظ التقييمات' : 'Save reviews'}
      </button>
    </div>
  );
};
