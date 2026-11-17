import React, { useState } from 'react';
import { Copy, GripVertical, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { MediaUploadField } from '../../../common/MediaUploadField';
import { GlobalModal } from '../../../common/GlobalModal';
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
import {
  FEATURE_ICONS_MAX_ITEMS,
  blankFeatureItem,
  duplicateFeatureItem,
  reorderFeatureItems,
} from './coffeeFeatureIconsControls';

export {
  FEATURE_ICONS_MAX_ITEMS,
  blankFeatureItem,
  duplicateFeatureItem,
  reorderFeatureItems,
} from './coffeeFeatureIconsControls';

const PRIMARY_ICONS = FEATURE_ICON_LIBRARY.slice(0, 11);

type SidebarTab = 'content' | 'templates' | 'style' | 'layout' | 'code' | 'ai';

const TABS: { id: SidebarTab; en: string; ar: string }[] = [
  { id: 'content', en: 'Content', ar: 'المحتوى' },
  { id: 'templates', en: 'Templates', ar: 'القوالب' },
  { id: 'style', en: 'Style', ar: 'النمط' },
  { id: 'layout', en: 'Layout', ar: 'التخطيط' },
  { id: 'code', en: 'Code', ar: 'الرمز' },
  { id: 'ai', en: 'AI', ar: 'الذكاء الاصطناعي' },
];

const LAYOUT_TEMPLATES: {
  id: EnhancedFeaturesSettings['layoutStyle'];
  en: string;
  ar: string;
  patch: Partial<EnhancedFeaturesSettings>;
}[] = [
  {
    id: 'classic-cards',
    en: 'Classic',
    ar: 'كلاسيكي',
    patch: { layoutStyle: 'classic-cards', cardBackground: 'white', cardBorder: 'soft', shadow: true },
  },
  {
    id: 'minimal',
    en: 'Minimal',
    ar: 'بسيط',
    patch: { layoutStyle: 'minimal', cardBackground: 'white', cardBorder: 'none', shadow: false },
  },
  {
    id: 'floating',
    en: 'Floating',
    ar: 'عائم',
    patch: { layoutStyle: 'floating', cardBackground: 'white', cardBorder: 'soft', shadow: true },
  },
  {
    id: 'glass',
    en: 'Glass',
    ar: 'زجاجي',
    patch: { layoutStyle: 'glass', cardBackground: 'glass', cardBorder: 'soft', shadow: false },
  },
  {
    id: 'timeline',
    en: 'Timeline',
    ar: 'خط زمني',
    patch: { layoutStyle: 'timeline', cardBackground: 'white', cardBorder: 'none', shadow: false },
  },
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

function PxSelect({ value, onChange, options }: { value: number; onChange: (n: number) => void; options: number[] }) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputCls} style={inputStyle}>
      {options.map((n) => (
        <option key={n} value={n}>
          {n} px
        </option>
      ))}
    </select>
  );
}

export const CoffeeFeaturesForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('enhancedFeatures');
  const features = draft?.features || [];
  const [tab, setTab] = useState<SidebarTab>('content');
  const [editId, setEditId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showMoreIcons, setShowMoreIcons] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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

  const preview = (device: PreviewDevice) => {
    if (!draft?.enabled) {
      return (
        <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>
          {isAr ? 'القسم مخفي في المتجر' : 'Section is hidden on the storefront'}
        </div>
      );
    }
    return <CoffeeFeatureIconsBar settings={draft} lang={lang} device={device} variant="frame" includeEmpty />;
  };

  const iconChoices = showMoreIcons ? FEATURE_ICON_LIBRARY : PRIMARY_ICONS;
  const iconMap = Object.fromEntries(FEATURE_ICON_LIBRARY.map((row) => [row.name, row.Icon]));

  return (
    <>
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
                    data-feature-icons-tab={t.id}
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
                <section className={cardCls} style={cardStyle} data-feature-icons-panel="content">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold">{isAr ? 'إعدادات القسم' : 'Section Settings'}</h3>
                    <Toggle
                      on={!!draft?.enabled}
                      onChange={(v) => patchSection({ enabled: v })}
                      label={isAr ? 'تفعيل القسم' : 'Enable Section'}
                    />
                  </div>
                  <label className="block space-y-1">
                    <span className="flex items-center justify-between text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'عنوان القسم (اختياري)' : 'Section Title (Optional)'}
                      <Counter value={isAr ? draft?.mainTitleAr || '' : draft?.mainTitleEn || draft?.mainTitle || ''} max={100} />
                    </span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={100}
                      placeholder={isAr ? 'مثال: لماذا تتسوق معنا' : 'e.g. Why Shop With Us'}
                      value={isAr ? draft?.mainTitleAr || '' : draft?.mainTitleEn || draft?.mainTitle || ''}
                      onChange={(e) =>
                        patchSection(isAr ? { mainTitleAr: e.target.value } : { mainTitleEn: e.target.value })
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="flex items-center justify-between text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'وصف القسم (اختياري)' : 'Section Description (Optional)'}
                      <Counter value={isAr ? draft?.subtitleAr || '' : draft?.subtitleEn || draft?.subtitle || ''} max={200} />
                    </span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={200}
                      placeholder={isAr ? 'اكتب الوصف' : 'e.g. Experience the best service and quality'}
                      value={isAr ? draft?.subtitleAr || '' : draft?.subtitleEn || draft?.subtitle || ''}
                      onChange={(e) =>
                        patchSection(isAr ? { subtitleAr: e.target.value } : { subtitleEn: e.target.value })
                      }
                    />
                  </label>
                </section>

                <section className={cardCls} style={cardStyle} data-feature-icons-panel="items">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">
                      {isAr
                        ? `إدارة العناصر (${features.length}/${FEATURE_ICONS_MAX_ITEMS})`
                        : `Items Management (${features.length}/${FEATURE_ICONS_MAX_ITEMS})`}
                    </h3>
                    <button
                      type="button"
                      disabled={features.length >= FEATURE_ICONS_MAX_ITEMS}
                      onClick={() => {
                        const row = blankFeatureItem();
                        setDraft({ ...draft, enabled: true, features: [...features, row] });
                        setEditId(row.id);
                      }}
                      className="unity-btn-primary inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40"
                    >
                      + {isAr ? 'إضافة عنصر' : 'Add Item'}
                    </button>
                  </div>
                  {features.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'لا عناصر. الشريط يختفي في المتجر.' : 'No items. The bar hides on the storefront.'}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {features.map((item, index) => {
                        const label = featureItemTitle(item, lang) || (isAr ? 'بدون عنوان' : 'Untitled');
                        const sub = featureItemDescription(item, lang);
                        const Icon = iconMap[item.icon] || FEATURE_ICON_LIBRARY[0].Icon;
                        const itemOn = item.enabled !== false;
                        return (
                          <li
                            key={item.id}
                            draggable
                            onDragStart={() => setDragIndex(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (dragIndex !== null) setFeatures(reorderFeatureItems(features, dragIndex, index));
                              setDragIndex(null);
                            }}
                            className="flex items-center gap-2 rounded-xl border px-2 py-2"
                            style={{
                              borderColor: editId === item.id ? 'var(--accent)' : 'var(--border)',
                              background: itemOn ? 'var(--surface)' : 'transparent',
                              opacity: itemOn ? 1 : 0.55,
                            }}
                          >
                            <GripVertical className="w-4 h-4 shrink-0 cursor-grab" style={{ color: 'var(--muted)' }} />
                            <span className="w-5 text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
                              {index + 1}
                            </span>
                            <span
                              className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
                              style={{ borderColor: 'var(--border)', color: item.iconColor || '#111' }}
                            >
                              <Icon className="w-4 h-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                                {label}
                              </div>
                              {sub ? (
                                <div className="text-[10px] truncate" style={{ color: 'var(--muted)' }}>
                                  {sub}
                                </div>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              className="w-9 h-5 rounded-full p-0.5 shrink-0"
                              style={{ background: itemOn ? 'var(--portal-cta)' : 'var(--border)' }}
                              aria-pressed={itemOn}
                              aria-label={isAr ? 'تفعيل العنصر' : 'Enable item'}
                              onClick={() => patchItem(item.id, { enabled: !itemOn })}
                            >
                              <span
                                className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                  itemOn ? 'translate-x-4 rtl:-translate-x-4' : ''
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg border"
                              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                              onClick={() => setEditId(item.id)}
                              aria-label={isAr ? 'تعديل' : 'Edit'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg border disabled:opacity-40"
                              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                              disabled={features.length >= FEATURE_ICONS_MAX_ITEMS}
                              onClick={() => {
                                const copy = duplicateFeatureItem(item);
                                const next = [...features];
                                next.splice(index + 1, 0, copy);
                                setFeatures(next.slice(0, FEATURE_ICONS_MAX_ITEMS));
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
                                    const next = features.filter((f) => f.id !== item.id);
                                    setFeatures(next);
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
              <section className={cardCls} style={cardStyle} data-feature-icons-panel="templates">
                <h3 className="text-sm font-bold">{isAr ? 'قوالب التخطيط' : 'Layout Templates'}</h3>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'اختر قالباً لتطبيق نمط البطاقة والظل. المحتوى لا يتغير.'
                    : 'Pick a template to apply card style and shadow. Content stays unchanged.'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LAYOUT_TEMPLATES.map((tpl) => {
                    const active = (draft?.layoutStyle || 'classic-cards') === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => patchSection(tpl.patch)}
                        className="rounded-xl border px-3 py-3 text-start text-[11px] font-bold"
                        style={
                          active
                            ? { borderColor: 'var(--accent)', background: 'var(--surface)', color: 'var(--accent)' }
                            : { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }
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
              <section className={cardCls} style={cardStyle} data-feature-icons-panel="style">
                <h3 className="text-sm font-bold">{isAr ? 'النمط' : 'Style'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'لون الخلفية' : 'Background Color'}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft?.bgColor || '#F8FAFC'}
                        onChange={(e) => patchSection({ bgColor: e.target.value })}
                        className="w-9 h-9 rounded-lg border bg-white p-1"
                        style={{ borderColor: 'var(--border)' }}
                      />
                      <input
                        className={inputCls}
                        style={inputStyle}
                        value={draft?.bgColor || '#F8FAFC'}
                        onChange={(e) => patchSection({ bgColor: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'محاذاة المحتوى' : 'Content Alignment'}
                    </span>
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={draft?.contentAlign || 'center'}
                      onChange={(e) => patchSection({ contentAlign: e.target.value as FeatureContentAlign })}
                    >
                      <option value="left">{isAr ? 'يسار' : 'Left'}</option>
                      <option value="center">{isAr ? 'وسط' : 'Center'}</option>
                      <option value="right">{isAr ? 'يمين' : 'Right'}</option>
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'انحناء الحواف' : 'Border Radius'}
                    </span>
                    <PxSelect
                      value={draft?.borderRadius ?? 16}
                      onChange={(n) => patchSection({ borderRadius: n })}
                      options={[0, 8, 12, 16, 24, 32]}
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'خلفية البطاقة' : 'Card Background'}
                    </span>
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={draft?.cardBackground || 'white'}
                      onChange={(e) =>
                        patchSection({ cardBackground: e.target.value as EnhancedFeaturesSettings['cardBackground'] })
                      }
                    >
                      <option value="white">{isAr ? 'أبيض' : 'White'}</option>
                      <option value="glass">{isAr ? 'زجاجي' : 'Glass'}</option>
                      <option value="dark">{isAr ? 'داكن' : 'Dark'}</option>
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'إطار البطاقة' : 'Card Border'}
                    </span>
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={draft?.cardBorder || 'soft'}
                      onChange={(e) =>
                        patchSection({ cardBorder: e.target.value as EnhancedFeaturesSettings['cardBorder'] })
                      }
                    >
                      <option value="none">{isAr ? 'بدون' : 'None'}</option>
                      <option value="soft">{isAr ? 'ناعم' : 'Soft'}</option>
                      <option value="solid">{isAr ? 'صلب' : 'Solid'}</option>
                    </select>
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'حركة الأيقونة' : 'Icon Animation'}
                    </span>
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={draft?.iconAnimation || 'none'}
                      onChange={(e) =>
                        patchSection({ iconAnimation: e.target.value as EnhancedFeaturesSettings['iconAnimation'] })
                      }
                    >
                      <option value="none">{isAr ? 'بدون' : 'None'}</option>
                      <option value="floating">{isAr ? 'عائم' : 'Floating'}</option>
                      <option value="pulse">{isAr ? 'نبض' : 'Pulse'}</option>
                      <option value="zoom">{isAr ? 'تكبير' : 'Zoom'}</option>
                    </select>
                  </label>
                  <div className="md:col-span-2">
                    <Toggle
                      on={draft?.shadow !== false}
                      onChange={(v) => patchSection({ shadow: v })}
                      label={isAr ? 'ظل البطاقة' : 'Card Shadow'}
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-feature-icons-panel="layout">
                <h3 className="text-sm font-bold">{isAr ? 'إعدادات التخطيط' : 'Layout Settings'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="space-y-1.5 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'عناصر في الصف (سطح المكتب)' : 'Items per Row (Desktop)'}
                    </span>
                    <Segment
                      value={draft?.itemsPerRowDesktop || 4}
                      options={[2, 3, 4]}
                      isAr={isAr}
                      onChange={(n) => patchSection({ itemsPerRowDesktop: n })}
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'عناصر في الصف (جهاز لوحي)' : 'Items per Row (Tablet)'}
                    </span>
                    <Segment
                      value={draft?.itemsPerRowTablet || 2}
                      options={[1, 2, 4]}
                      isAr={isAr}
                      onChange={(n) => patchSection({ itemsPerRowTablet: n })}
                    />
                  </label>
                  <label className="space-y-1.5 block md:col-span-2">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'عناصر في الصف (الجوال)' : 'Items per Row (Mobile)'}
                    </span>
                    <Segment
                      value={draft?.itemsPerRowMobile || 1}
                      options={[1, 2]}
                      isAr={isAr}
                      onChange={(n) => patchSection({ itemsPerRowMobile: n })}
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'تباعد العناصر (سطح المكتب)' : 'Item Spacing (Desktop)'}
                    </span>
                    <PxSelect
                      value={draft?.itemSpacingDesktop ?? 32}
                      onChange={(n) => patchSection({ itemSpacingDesktop: n })}
                      options={[8, 12, 16, 24, 32, 40, 48]}
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'تباعد العناصر (جهاز لوحي)' : 'Item Spacing (Tablet)'}
                    </span>
                    <PxSelect
                      value={draft?.itemSpacingTablet ?? draft?.itemSpacingMobile ?? 16}
                      onChange={(n) => patchSection({ itemSpacingTablet: n })}
                      options={[8, 12, 16, 24, 32]}
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'تباعد العناصر (الجوال)' : 'Item Spacing (Mobile)'}
                    </span>
                    <PxSelect
                      value={draft?.itemSpacingMobile ?? 16}
                      onChange={(n) => patchSection({ itemSpacingMobile: n })}
                      options={[8, 12, 16, 24, 32]}
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'حشوة القسم (سطح المكتب)' : 'Section Padding (Desktop)'}
                    </span>
                    <PxSelect
                      value={draft?.sectionPaddingDesktop ?? 24}
                      onChange={(n) => patchSection({ sectionPaddingDesktop: n })}
                      options={[8, 12, 16, 24, 32, 40, 48]}
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'حشوة القسم (جهاز لوحي)' : 'Section Padding (Tablet)'}
                    </span>
                    <PxSelect
                      value={draft?.sectionPaddingTablet ?? draft?.sectionPaddingMobile ?? 16}
                      onChange={(n) => patchSection({ sectionPaddingTablet: n })}
                      options={[8, 12, 16, 24, 32]}
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'حشوة القسم (الجوال)' : 'Section Padding (Mobile)'}
                    </span>
                    <PxSelect
                      value={draft?.sectionPaddingMobile ?? 16}
                      onChange={(n) => patchSection({ sectionPaddingMobile: n })}
                      options={[8, 12, 16, 24, 32]}
                    />
                  </label>
                </div>
              </section>
            ) : null}

            {tab === 'code' ? (
              <section className={cardCls} style={cardStyle} data-feature-icons-panel="code">
                <h3 className="text-sm font-bold">{isAr ? 'الرمز' : 'Code'}</h3>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'فئة CSS مخصصة (اختياري)' : 'Custom CSS class (optional)'}
                  </span>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    dir="ltr"
                    placeholder={isAr ? 'مثال: my-feature-strip' : 'e.g. my-feature-strip'}
                    value={draft?.customCssClass || ''}
                    onChange={(e) => patchSection({ customCssClass: e.target.value })}
                  />
                </label>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'فارغ = بدون فئة إضافية. لا تُضاف أنماط وهمية.'
                    : 'Empty = no extra class. No fake styles are injected.'}
                </p>
              </section>
            ) : null}

            {tab === 'ai' ? (
              <section className={cardCls} style={cardStyle} data-feature-icons-panel="ai">
                <h3 className="text-sm font-bold">{isAr ? 'الذكاء الاصطناعي' : 'AI'}</h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }} data-feature-icons-empty="ai">
                  {isAr ? 'بانتظار البيانات — غير متصل' : 'Waiting for Data — Not Connected'}
                </p>
              </section>
            ) : null}
          </>
        }
      />

      <GlobalModal
        isOpen={!!editing}
        onClose={() => setEditId(null)}
        dir={isAr ? 'rtl' : 'ltr'}
        aria-label={isAr ? 'تعديل عنصر الميزة' : 'Edit feature item'}
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
                  ? `تعديل العنصر ${features.findIndex((f) => f.id === editing.id) + 1}`
                  : `Edit Item (Item ${features.findIndex((f) => f.id === editing.id) + 1})`}
              </h3>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'أيقونة / صورة' : 'Icon / Image'}
                  </div>
                  <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: 'var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => patchItem(editing.id, { mediaType: 'icon' })}
                      className="px-3 py-1 rounded-md text-[11px] font-bold"
                      style={
                        editing.mediaType !== 'image'
                          ? { background: 'var(--portal-cta)', color: '#fff' }
                          : { color: 'var(--text)' }
                      }
                    >
                      {isAr ? 'أيقونة' : 'Icon'}
                    </button>
                    <button
                      type="button"
                      onClick={() => patchItem(editing.id, { mediaType: 'image' })}
                      className="px-3 py-1 rounded-md text-[11px] font-bold"
                      style={
                        editing.mediaType === 'image'
                          ? { background: 'var(--portal-cta)', color: '#fff' }
                          : { color: 'var(--text)' }
                      }
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
                            className="h-9 rounded-lg border flex items-center justify-center"
                            style={
                              active
                                ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--surface)' }
                                : { borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }
                            }
                            title={row.name}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowMoreIcons((v) => !v)}
                        className="h-9 rounded-lg border flex items-center justify-center"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                        aria-label={isAr ? 'المزيد' : 'More icons'}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block space-y-1">
                    <span className="flex justify-between text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'العنوان' : 'Title'}
                      <Counter value={isAr ? editing.titleAr || '' : editing.titleEn || editing.title || ''} max={100} />
                    </span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={100}
                      value={isAr ? editing.titleAr || '' : editing.titleEn || editing.title || ''}
                      onChange={(e) =>
                        patchItem(editing.id, isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="flex justify-between text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'العنوان الفرعي' : 'Subtitle'}
                      <Counter
                        value={
                          isAr ? editing.descriptionAr || '' : editing.descriptionEn || editing.description || ''
                        }
                        max={200}
                      />
                    </span>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      dir={isAr ? 'rtl' : 'ltr'}
                      maxLength={200}
                      value={
                        isAr ? editing.descriptionAr || '' : editing.descriptionEn || editing.description || ''
                      }
                      onChange={(e) =>
                        patchItem(
                          editing.id,
                          isAr ? { descriptionAr: e.target.value } : { descriptionEn: e.target.value },
                        )
                      }
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'خلفية الأيقونة' : 'Icon Background'}
                      </span>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={editing.iconBg || '#FFFFFF'}
                          onChange={(e) => patchItem(editing.id, { iconBg: e.target.value })}
                          className="w-8 h-8 rounded border bg-white p-0.5"
                          style={{ borderColor: 'var(--border)' }}
                        />
                        <input
                          className={inputCls}
                          style={inputStyle}
                          dir="ltr"
                          value={editing.iconBg || '#FFFFFF'}
                          onChange={(e) => patchItem(editing.id, { iconBg: e.target.value })}
                        />
                      </div>
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'لون الأيقونة' : 'Icon Color'}
                      </span>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={editing.iconColor || '#000000'}
                          onChange={(e) => patchItem(editing.id, { iconColor: e.target.value })}
                          className="w-8 h-8 rounded border bg-white p-0.5"
                          style={{ borderColor: 'var(--border)' }}
                        />
                        <input
                          className={inputCls}
                          style={inputStyle}
                          dir="ltr"
                          value={editing.iconColor || '#000000'}
                          onChange={(e) => patchItem(editing.id, { iconColor: e.target.value })}
                        />
                      </div>
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'حجم الأيقونة' : 'Icon Size'}
                      </span>
                      <PxSelect
                        value={editing.iconSize || 40}
                        onChange={(n) => patchItem(editing.id, { iconSize: n })}
                        options={[24, 32, 40, 48, 56]}
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'شكل الأيقونة' : 'Icon Shape'}
                      </span>
                      <select
                        className={inputCls}
                        style={inputStyle}
                        value={editing.iconShape || 'rounded'}
                        onChange={(e) => patchItem(editing.id, { iconShape: e.target.value as FeatureIconShape })}
                      >
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
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'نوع الرابط (اختياري)' : 'Link Type (Optional)'}
                    </span>
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={editing.linkType || 'none'}
                      onChange={(e) => {
                        const linkType = e.target.value as FeatureLinkType;
                        patchItem(editing.id, {
                          linkType,
                          linkUrl:
                            linkType === 'whatsapp'
                              ? 'whatsapp-custom-order'
                              : linkType === 'none'
                                ? ''
                                : editing.linkUrl || '',
                        });
                      }}
                    >
                      <option value="none">{isAr ? 'بدون' : 'None'}</option>
                      <option value="url">{isAr ? 'رابط' : 'URL'}</option>
                      <option value="product">{isAr ? 'منتج' : 'Product'}</option>
                      <option value="category">{isAr ? 'تصنيف' : 'Category'}</option>
                      <option value="page">{isAr ? 'صفحة' : 'Page'}</option>
                      <option value="whatsapp">{isAr ? 'واتساب' : 'WhatsApp'}</option>
                    </select>
                  </label>
                  {editing.linkType && editing.linkType !== 'none' && editing.linkType !== 'whatsapp' ? (
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'الرابط' : 'Link'}
                      </span>
                      <input
                        className={inputCls}
                        style={inputStyle}
                        dir="ltr"
                        value={editing.linkUrl || ''}
                        onChange={(e) => patchItem(editing.id, { linkUrl: e.target.value })}
                        placeholder="#products"
                      />
                    </label>
                  ) : null}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'الظهور (اختياري)' : 'Section Visibility (Optional)'}
                    </div>
                    {(
                      [
                        ['showDesktop', isAr ? 'إظهار على سطح المكتب' : 'Show on Desktop'],
                        ['showTablet', isAr ? 'إظهار على الجهاز اللوحي' : 'Show on Tablet'],
                        ['showMobile', isAr ? 'إظهار على الجوال' : 'Show on Mobile'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text)' }}>
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
              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
                >
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
