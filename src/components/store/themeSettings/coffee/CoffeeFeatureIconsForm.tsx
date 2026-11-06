import React, { useState } from 'react';
import { Copy, GripVertical, Image as ImageIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { MediaUploadField } from '../../../common/MediaUploadField';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import { CoffeeFeatureIconsBar, FEATURE_ICON_LIBRARY } from '../../../../themes/coffeeRoasters/components/CoffeeFeatureIconsBar';
import {
  featureItemDescription,
  featureItemTitle,
  type EnhancedFeatureItem,
  type EnhancedFeaturesSettings,
  type FeatureContentAlign,
  type FeatureIconShape,
  type FeatureLinkType,
} from '../../../../themes/settings/themeSettingsStore';

const MAX_ITEMS = 4;
const PRIMARY_ICONS = FEATURE_ICON_LIBRARY.slice(0, 11);

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-[#2563EB]';
const cardCls = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3';

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className="text-[10px] font-medium text-slate-400">
      {(value || '').length}/{max}
    </span>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`w-11 h-6 rounded-full p-0.5 transition-colors ${on ? 'bg-[#2563EB]' : 'bg-slate-300'}`}
        aria-pressed={on}
      >
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

function Segment({
  value,
  options,
  isAr,
  onChange,
}: {
  value: number;
  options: number[];
  isAr: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((n) => {
        const active = value === n;
        const word = n === 1 ? (isAr ? 'عنصر' : 'Item') : isAr ? 'عناصر' : 'Items';
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
              active ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {n} {word}
          </button>
        );
      })}
    </div>
  );
}

function PxSelect({ value, onChange, options }: { value: number; onChange: (n: number) => void; options: number[] }) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputCls}>
      {options.map((n) => (
        <option key={n} value={n}>
          {n} px
        </option>
      ))}
    </select>
  );
}

function blankItem(): EnhancedFeatureItem {
  return {
    id: `cf-${Date.now()}`,
    icon: 'Truck',
    mediaType: 'icon',
    title: '',
    titleEn: '',
    titleAr: '',
    description: '',
    descriptionEn: '',
    descriptionAr: '',
    linkType: 'none',
    linkUrl: '',
    iconBg: '#FFFFFF',
    iconColor: '#111111',
    iconSize: 40,
    iconShape: 'rounded',
    showDesktop: true,
    showTablet: true,
    showMobile: true,
  };
}

export const CoffeeFeaturesForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('enhancedFeatures');
  const features = draft?.features || [];
  const [editId, setEditId] = useState<string | null>(features[0]?.id || null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showMoreIcons, setShowMoreIcons] = useState(false);
  const editing = features.find((f) => f.id === editId) || null;
  const lang = isAr ? 'ar' : 'en';

  const setFeatures = (next: EnhancedFeatureItem[]) => setDraft({ ...draft, features: next });

  const patchItem = (id: string, p: Partial<EnhancedFeatureItem>) => {
    setFeatures(
      features.map((f) => {
        if (f.id !== id) return f;
        const next = { ...f, ...p };
        if (p.titleEn !== undefined) next.title = p.titleEn;
        if (p.descriptionEn !== undefined) next.description = p.descriptionEn;
        return next;
      }),
    );
  };

  const patchSection = (p: Partial<EnhancedFeaturesSettings>) => {
    const next = { ...draft, ...p };
    if (p.mainTitleEn !== undefined) next.mainTitle = p.mainTitleEn;
    if (p.subtitleEn !== undefined) next.subtitle = p.subtitleEn;
    setDraft(next);
  };

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= features.length || to >= features.length) return;
    const next = [...features];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    setFeatures(next);
  };

  const preview = (device: PreviewDevice) => {
    if (!draft?.enabled) {
      return (
        <div className="p-6 text-center text-[11px] text-slate-400">
          {isAr ? 'القسم مخفي في المتجر' : 'Section is hidden on the storefront'}
        </div>
      );
    }
    return (
      <CoffeeFeatureIconsBar
        settings={draft}
        lang={lang}
        device={device}
        variant="frame"
        includeEmpty
      />
    );
  };

  const iconChoices = showMoreIcons ? FEATURE_ICON_LIBRARY : PRIMARY_ICONS;

  return (
    <CoffeeWordSettingsShell
      isAr={isAr}
      onBack={onBack}
      embedded={embedded}
      titleEn="Feature Icons Section"
      titleAr="قسم أيقونات المميزات"
      subtitleEn="Add up to 4 feature items with icons or images, custom text, links and styling options."
      subtitleAr="أضف حتى 4 عناصر بأيقونات أو صور، ونص مخصص، وروابط، وخيارات تنسيق."
      onSave={() => save()}
      saving={saving}
      savedFlash={savedFlash}
      preview={preview}
      settings={
        <>
          <section className={cardCls}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold">{isAr ? 'إعدادات القسم' : 'Section Settings'}</h3>
              <Toggle on={!!draft?.enabled} onChange={(v) => patchSection({ enabled: v })} label={isAr ? 'تفعيل القسم' : 'Enable Section'} />
            </div>
            <label className="block space-y-1">
              <span className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                {isAr ? 'عنوان القسم (اختياري · إنجليزي)' : 'Section Title (Optional · English)'}
                <Counter value={draft?.mainTitleEn || draft?.mainTitle || ''} max={100} />
              </span>
              <input
                className={inputCls}
                dir="ltr"
                maxLength={100}
                placeholder={isAr ? 'اكتب العنوان بالإنجليزية' : 'e.g. Why Shop With Us'}
                value={draft?.mainTitleEn || draft?.mainTitle || ''}
                onChange={(e) => patchSection({ mainTitleEn: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                {isAr ? 'عنوان القسم (اختياري · عربي)' : 'Section Title (Optional · Arabic)'}
                <Counter value={draft?.mainTitleAr || ''} max={100} />
              </span>
              <input
                className={inputCls}
                dir="rtl"
                maxLength={100}
                placeholder={isAr ? 'مثال: لماذا تتسوق معنا' : 'Enter Arabic title'}
                value={draft?.mainTitleAr || ''}
                onChange={(e) => patchSection({ mainTitleAr: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                {isAr ? 'وصف القسم (اختياري · إنجليزي)' : 'Section Description (Optional · English)'}
                <Counter value={draft?.subtitleEn || draft?.subtitle || ''} max={200} />
              </span>
              <input
                className={inputCls}
                dir="ltr"
                maxLength={200}
                placeholder={isAr ? 'اكتب الوصف بالإنجليزية' : 'e.g. Experience the best service and quality'}
                value={draft?.subtitleEn || draft?.subtitle || ''}
                onChange={(e) => patchSection({ subtitleEn: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                {isAr ? 'وصف القسم (اختياري · عربي)' : 'Section Description (Optional · Arabic)'}
                <Counter value={draft?.subtitleAr || ''} max={200} />
              </span>
              <input
                className={inputCls}
                dir="rtl"
                maxLength={200}
                value={draft?.subtitleAr || ''}
                onChange={(e) => patchSection({ subtitleAr: e.target.value })}
              />
            </label>
          </section>

          <section className={cardCls}>
            <h3 className="text-sm font-bold">{isAr ? 'إعدادات التخطيط' : 'Layout Settings'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1.5 block">
                <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'عناصر في الصف (سطح المكتب)' : 'Items per Row (Desktop)'}</span>
                <Segment value={draft?.itemsPerRowDesktop || 4} options={[2, 3, 4]} isAr={isAr} onChange={(n) => patchSection({ itemsPerRowDesktop: n })} />
              </label>
              <label className="space-y-1.5 block">
                <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'عناصر في الصف (الجوال)' : 'Items per Row (Mobile)'}</span>
                <Segment value={draft?.itemsPerRowMobile || 1} options={[1, 2]} isAr={isAr} onChange={(n) => patchSection({ itemsPerRowMobile: n })} />
              </label>
              <label className="space-y-1.5 block">
                <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'عناصر في الصف (جهاز لوحي)' : 'Items per Row (Tablet)'}</span>
                <Segment value={draft?.itemsPerRowTablet || 2} options={[1, 2, 4]} isAr={isAr} onChange={(n) => patchSection({ itemsPerRowTablet: n })} />
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'لون الخلفية' : 'Background Color'}</span>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft?.bgColor || '#F8FAFC'} onChange={(e) => patchSection({ bgColor: e.target.value })} className="w-9 h-9 rounded-lg border border-slate-200 bg-white p-1" />
                  <input className={inputCls} value={draft?.bgColor || '#F8FAFC'} onChange={(e) => patchSection({ bgColor: e.target.value })} dir="ltr" />
                </div>
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'محاذاة المحتوى' : 'Content Alignment'}</span>
                <select
                  className={inputCls}
                  value={draft?.contentAlign || 'center'}
                  onChange={(e) => patchSection({ contentAlign: e.target.value as FeatureContentAlign })}
                >
                  <option value="left">{isAr ? 'يسار' : 'Left'}</option>
                  <option value="center">{isAr ? 'وسط' : 'Center'}</option>
                  <option value="right">{isAr ? 'يمين' : 'Right'}</option>
                </select>
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'تباعد العناصر (سطح المكتب)' : 'Item Spacing (Desktop)'}</span>
                <PxSelect value={draft?.itemSpacingDesktop ?? 32} onChange={(n) => patchSection({ itemSpacingDesktop: n })} options={[8, 12, 16, 24, 32, 40, 48]} />
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'تباعد العناصر (الجوال)' : 'Item Spacing (Mobile)'}</span>
                <PxSelect value={draft?.itemSpacingMobile ?? 16} onChange={(n) => patchSection({ itemSpacingMobile: n })} options={[8, 12, 16, 24, 32]} />
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'حشوة القسم (سطح المكتب)' : 'Section Padding (Desktop)'}</span>
                <PxSelect value={draft?.sectionPaddingDesktop ?? 24} onChange={(n) => patchSection({ sectionPaddingDesktop: n })} options={[8, 12, 16, 24, 32, 40, 48]} />
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'حشوة القسم (الجوال)' : 'Section Padding (Mobile)'}</span>
                <PxSelect value={draft?.sectionPaddingMobile ?? 16} onChange={(n) => patchSection({ sectionPaddingMobile: n })} options={[8, 12, 16, 24, 32]} />
              </label>
              <label className="space-y-1 block md:col-span-2">
                <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'انحناء الحواف' : 'Border Radius'}</span>
                <PxSelect value={draft?.borderRadius ?? 16} onChange={(n) => patchSection({ borderRadius: n })} options={[0, 8, 12, 16, 24, 32]} />
              </label>
            </div>
          </section>

          <section className={cardCls}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">
                {isAr ? `إدارة العناصر (${features.length}/${MAX_ITEMS})` : `Items Management (${features.length}/${MAX_ITEMS})`}
              </h3>
              <button
                type="button"
                disabled={features.length >= MAX_ITEMS}
                onClick={() => {
                  const row = blankItem();
                  setDraft({ ...draft, enabled: true, features: [...features, row] });
                  setEditId(row.id);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold disabled:opacity-40"
              >
                + {isAr ? 'إضافة عنصر' : 'Add Item'}
              </button>
            </div>
            {features.length === 0 ? (
              <p className="text-xs text-slate-400">{isAr ? 'لا عناصر. الشريط يختفي في المتجر.' : 'No items. The bar hides on the storefront.'}</p>
            ) : (
              <ul className="space-y-2">
                {features.map((item, index) => {
                  const label = featureItemTitle(item, lang) || (isAr ? 'بدون عنوان' : 'Untitled');
                  const sub = featureItemDescription(item, lang);
                  return (
                    <li
                      key={item.id}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragIndex !== null) move(dragIndex, index);
                        setDragIndex(null);
                      }}
                      className={`flex items-center gap-2 rounded-xl border px-2 py-2 bg-slate-50 ${editId === item.id ? 'border-[#2563EB]' : 'border-slate-200'}`}
                    >
                      <GripVertical className="w-4 h-4 text-slate-400 shrink-0 cursor-grab" />
                      <span className="w-5 text-[11px] font-bold text-slate-500">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate">{label}</div>
                        {sub ? <div className="text-[10px] text-slate-500 truncate">{sub}</div> : null}
                      </div>
                      <button type="button" className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600" onClick={() => setEditId(item.id)} aria-label={isAr ? 'تعديل' : 'Edit'}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                        disabled={features.length >= MAX_ITEMS}
                        onClick={() => {
                          const copy: EnhancedFeatureItem = { ...item, id: `cf-${Date.now()}` };
                          const next = [...features];
                          next.splice(index + 1, 0, copy);
                          setFeatures(next);
                          setEditId(copy.id);
                        }}
                        aria-label={isAr ? 'نسخ' : 'Duplicate'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg border border-rose-200 bg-white text-rose-500"
                        onClick={() => {
                          const next = features.filter((f) => f.id !== item.id);
                          setFeatures(next);
                          if (editId === item.id) setEditId(next[0]?.id || null);
                        }}
                        aria-label={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {editing ? (
            <section className={cardCls}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">
                  {isAr
                    ? `تعديل العنصر (عنصر ${features.findIndex((f) => f.id === editing.id) + 1})`
                    : `Edit Item (Item ${features.findIndex((f) => f.id === editing.id) + 1})`}
                </h3>
                <button type="button" className="text-[11px] font-semibold text-slate-500" onClick={() => setEditId(null)}>
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-600">{isAr ? 'أيقونة / صورة' : 'Icon / Image'}</div>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => patchItem(editing.id, { mediaType: 'icon' })}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold ${editing.mediaType !== 'image' ? 'bg-[#2563EB] text-white' : 'text-slate-600'}`}
                    >
                      {isAr ? 'أيقونة' : 'Icon'}
                    </button>
                    <button
                      type="button"
                      onClick={() => patchItem(editing.id, { mediaType: 'image' })}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold ${editing.mediaType === 'image' ? 'bg-[#2563EB] text-white' : 'text-slate-600'}`}
                    >
                      {isAr ? 'صورة' : 'Image'}
                    </button>
                  </div>
                  {editing.mediaType === 'image' ? (
                    <MediaUploadField
                      label={isAr ? 'صورة الأيقونة (مكتبة / رفع محلي)' : 'Feature image (library / local upload)'}
                      value={editing.imageUrl || ''}
                      onChange={(url) => patchItem(editing.id, { imageUrl: url, mediaType: 'image' })}
                      aspectRatio="square"
                      initialFolder="features"
                      recommendedSize="256 × 256 px"
                    />
                  ) : (
                    <div className="grid grid-cols-6 gap-1.5">
                      {iconChoices.map((row) => {
                        const Icon = row.Icon;
                        const active = editing.icon === row.name;
                        return (
                          <button
                            key={row.name}
                            type="button"
                            onClick={() => patchItem(editing.id, { icon: row.name, mediaType: 'icon' })}
                            className={`h-9 rounded-lg border flex items-center justify-center ${active ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]' : 'border-slate-200 text-slate-600 bg-white'}`}
                            title={row.name}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowMoreIcons((v) => !v)}
                        className="h-9 rounded-lg border border-slate-200 bg-white text-slate-500 flex items-center justify-center"
                        aria-label={isAr ? 'المزيد' : 'More icons'}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block space-y-1">
                    <span className="flex justify-between text-[11px] font-semibold text-slate-600">
                      {isAr ? 'العنوان الرئيسي (إنجليزي)' : 'Main Title (English)'}
                      <Counter value={editing.titleEn || editing.title || ''} max={100} />
                    </span>
                    <input className={inputCls} dir="ltr" maxLength={100} value={editing.titleEn || editing.title || ''} onChange={(e) => patchItem(editing.id, { titleEn: e.target.value })} />
                  </label>
                  <label className="block space-y-1">
                    <span className="flex justify-between text-[11px] font-semibold text-slate-600">
                      {isAr ? 'العنوان الرئيسي (عربي)' : 'Main Title (Arabic)'}
                      <Counter value={editing.titleAr || ''} max={100} />
                    </span>
                    <input className={inputCls} dir="rtl" maxLength={100} value={editing.titleAr || ''} onChange={(e) => patchItem(editing.id, { titleAr: e.target.value })} />
                  </label>
                  <label className="block space-y-1">
                    <span className="flex justify-between text-[11px] font-semibold text-slate-600">
                      {isAr ? 'العنوان الفرعي (إنجليزي)' : 'Sub Title (English)'}
                      <Counter value={editing.descriptionEn || editing.description || ''} max={200} />
                    </span>
                    <input className={inputCls} dir="ltr" maxLength={200} value={editing.descriptionEn || editing.description || ''} onChange={(e) => patchItem(editing.id, { descriptionEn: e.target.value })} />
                  </label>
                  <label className="block space-y-1">
                    <span className="flex justify-between text-[11px] font-semibold text-slate-600">
                      {isAr ? 'العنوان الفرعي (عربي)' : 'Sub Title (Arabic)'}
                      <Counter value={editing.descriptionAr || ''} max={200} />
                    </span>
                    <input className={inputCls} dir="rtl" maxLength={200} value={editing.descriptionAr || ''} onChange={(e) => patchItem(editing.id, { descriptionAr: e.target.value })} />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'خلفية الأيقونة' : 'Icon Background'}</span>
                      <div className="flex gap-1">
                        <input type="color" value={editing.iconBg || '#FFFFFF'} onChange={(e) => patchItem(editing.id, { iconBg: e.target.value })} className="w-8 h-8 rounded border border-slate-200 bg-white p-0.5" />
                        <input className={inputCls} dir="ltr" value={editing.iconBg || '#FFFFFF'} onChange={(e) => patchItem(editing.id, { iconBg: e.target.value })} />
                      </div>
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'لون الأيقونة' : 'Icon Color'}</span>
                      <div className="flex gap-1">
                        <input type="color" value={editing.iconColor || '#000000'} onChange={(e) => patchItem(editing.id, { iconColor: e.target.value })} className="w-8 h-8 rounded border border-slate-200 bg-white p-0.5" />
                        <input className={inputCls} dir="ltr" value={editing.iconColor || '#000000'} onChange={(e) => patchItem(editing.id, { iconColor: e.target.value })} />
                      </div>
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'حجم الأيقونة' : 'Icon Size'}</span>
                      <PxSelect value={editing.iconSize || 40} onChange={(n) => patchItem(editing.id, { iconSize: n })} options={[24, 32, 40, 48, 56]} />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'شكل الأيقونة' : 'Icon Shape'}</span>
                      <select className={inputCls} value={editing.iconShape || 'rounded'} onChange={(e) => patchItem(editing.id, { iconShape: e.target.value as FeatureIconShape })}>
                        <option value="rounded">{isAr ? 'ناعم' : 'Rounded'}</option>
                        <option value="circle">{isAr ? 'دائري' : 'Circle'}</option>
                        <option value="square">{isAr ? 'مربع' : 'Square'}</option>
                        <option value="none">{isAr ? 'بدون' : 'None'}</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'نوع الرابط (اختياري)' : 'Link Type (Optional)'}</span>
                    <select
                      className={inputCls}
                      value={editing.linkType || 'none'}
                      onChange={(e) => {
                        const linkType = e.target.value as FeatureLinkType;
                        patchItem(editing.id, {
                          linkType,
                          linkUrl: linkType === 'whatsapp' ? 'whatsapp-custom-order' : linkType === 'none' ? '' : editing.linkUrl || '',
                        });
                      }}
                    >
                      <option value="none">{isAr ? 'بدون' : 'None'}</option>
                      <option value="url">URL</option>
                      <option value="product">{isAr ? 'منتج' : 'Product'}</option>
                      <option value="category">{isAr ? 'تصنيف' : 'Category'}</option>
                      <option value="page">{isAr ? 'صفحة' : 'Page'}</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </label>
                  {editing.linkType && editing.linkType !== 'none' && editing.linkType !== 'whatsapp' ? (
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold text-slate-600">{isAr ? 'الرابط' : 'Link'}</span>
                      <input className={inputCls} dir="ltr" value={editing.linkUrl || ''} onChange={(e) => patchItem(editing.id, { linkUrl: e.target.value })} placeholder="#products" />
                    </label>
                  ) : null}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-600">{isAr ? 'الظهور (اختياري)' : 'Section Visibility (Optional)'}</div>
                    {(
                      [
                        ['showDesktop', isAr ? 'إظهار على سطح المكتب' : 'Show on Desktop'],
                        ['showTablet', isAr ? 'إظهار على الجهاز اللوحي' : 'Show on Tablet'],
                        ['showMobile', isAr ? 'إظهار على الجوال' : 'Show on Mobile'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={editing[key] !== false}
                          onChange={(e) => patchItem(editing.id, { [key]: e.target.checked })}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </>
      }
    />
  );
};
