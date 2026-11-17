import React, { useState } from 'react';
import {
  Copy,
  GripVertical,
  Pencil,
  Trash2,
  X,
  ShieldCheck,
  Star,
  Truck,
  CreditCard,
  Palette,
  MessageCircle,
  Wrench,
  Headphones,
  Layers,
  Zap,
} from 'lucide-react';
import { GlobalModal } from '../../../common/GlobalModal';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import {
  bi,
  type FeaturesSectionItem,
  type FeaturesSectionSettings,
} from '../../../../themes/settings/coffeeModularSettings';
import { CoffeeFeaturesSection } from '../../../../themes/coffeeRoasters/components/CoffeeFeaturesSection';
import {
  FEATURES_SECTION_MAX_ITEMS,
  blankFeaturesSectionItem,
  duplicateFeaturesSectionItem,
  featuresSectionShowsOnDevice,
  reorderFeaturesSectionItems,
  visibleFeaturesSectionItems,
} from '../../../../themes/coffeeRoasters/components/coffeeFeaturesSectionLogic';

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
];

const inputCls = 'w-full px-3 py-2 rounded-lg border bg-white text-xs outline-none focus:border-[var(--accent)]';
const cardCls = 'rounded-2xl border p-4 shadow-sm space-y-3';
const cardStyle: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' };
const inputStyle: React.CSSProperties = { borderColor: 'var(--border)', color: 'var(--text)' };

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-semibold" style={{ color: 'var(--text)' }}>
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className="w-11 h-6 rounded-full p-0.5"
        style={{ background: on ? 'var(--portal-cta)' : 'var(--border)' }}
        aria-pressed={on}
      >
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

export const CoffeeFeaturesSectionForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('featuresSection');
  const [tab, setTab] = useState<Tab>('content');
  const [editId, setEditId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const items = draft?.items || [];
  const editing = items.find((it) => it.id === editId) || null;
  const lang = isAr ? 'ar' : 'en';

  const patch = (p: Partial<FeaturesSectionSettings>) => setDraft({ ...draft, ...p });
  const setItems = (next: FeaturesSectionItem[]) => patch({ items: next });
  const patchItem = (id: string, p: Partial<FeaturesSectionItem>) =>
    setItems(items.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const preview = (device: PreviewDevice) => {
    if (!draft?.enabled) {
      return (
        <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>
          {isAr ? 'القسم مخفي' : 'Section hidden'}
        </div>
      );
    }
    if (!featuresSectionShowsOnDevice(draft, device)) {
      return (
        <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>
          {isAr ? 'مخفي على هذا الجهاز' : 'Hidden on this device'}
        </div>
      );
    }
    if (!visibleFeaturesSectionItems(draft).length) {
      return (
        <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>
          {isAr ? 'لا مميزات — بانتظار البيانات' : 'No features — Waiting for Data'}
        </div>
      );
    }
    return <CoffeeFeaturesSection settings={draft} lang={lang} device={device} />;
  };

  return (
    <>
      <CoffeeWordSettingsShell
        isAr={isAr}
        onBack={onBack}
        embedded={embedded}
        titleEn="Features Section"
        titleAr="قسم المميزات"
        subtitleEn="Spec feature cards with badge — separate from Feature Icons."
        subtitleAr="بطاقات المميزات مع الشارة — منفصلة عن أيقونات المميزات."
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
                    data-features-section-tab={t.id}
                    aria-selected={active}
                    onClick={() => setTab(t.id)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border"
                    style={
                      active
                        ? { background: 'var(--portal-cta)', color: '#fff', borderColor: 'var(--portal-cta)' }
                        : { borderColor: 'transparent', color: 'var(--text)' }
                    }
                  >
                    {isAr ? t.ar : t.en}
                  </button>
                );
              })}
            </div>

            {tab === 'content' ? (
              <>
                <section className={cardCls} style={cardStyle} data-features-section-panel="content">
                  <Toggle on={!!draft?.enabled} onChange={(v) => patch({ enabled: v })} label={isAr ? 'تفعيل القسم' : 'Enable Section'} />
                  <Toggle on={draft?.showBadge !== false} onChange={(v) => patch({ showBadge: v })} label={isAr ? 'إظهار الشارة' : 'Show Badge'} />
                  <input
                    className={inputCls}
                    style={inputStyle}
                    dir={isAr ? 'rtl' : 'ltr'}
                    maxLength={40}
                    value={isAr ? draft?.badgeAr || '' : draft?.badgeEn || ''}
                    onChange={(e) => patch(isAr ? { badgeAr: e.target.value } : { badgeEn: e.target.value })}
                    placeholder={isAr ? 'نص الشارة' : 'Badge text'}
                  />
                  <input
                    className={inputCls}
                    style={inputStyle}
                    dir={isAr ? 'rtl' : 'ltr'}
                    maxLength={100}
                    value={isAr ? draft?.titleAr || '' : draft?.titleEn || ''}
                    onChange={(e) => patch(isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })}
                    placeholder={isAr ? 'العنوان' : 'Title'}
                  />
                  <Toggle on={draft?.showDescription !== false} onChange={(v) => patch({ showDescription: v })} label={isAr ? 'إظهار الوصف' : 'Show Description'} />
                  <textarea
                    className={inputCls}
                    style={inputStyle}
                    dir={isAr ? 'rtl' : 'ltr'}
                    maxLength={200}
                    rows={2}
                    value={isAr ? draft?.descriptionAr || '' : draft?.descriptionEn || ''}
                    onChange={(e) => patch(isAr ? { descriptionAr: e.target.value } : { descriptionEn: e.target.value })}
                    placeholder={isAr ? 'الوصف' : 'Description'}
                  />
                </section>

                <section className={cardCls} style={cardStyle} data-features-section-panel="items">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">
                      {isAr
                        ? `المميزات (${items.length}/${FEATURES_SECTION_MAX_ITEMS})`
                        : `Features (${items.length}/${FEATURES_SECTION_MAX_ITEMS})`}
                    </h3>
                    <button
                      type="button"
                      disabled={items.length >= FEATURES_SECTION_MAX_ITEMS}
                      className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40"
                      onClick={() => {
                        const row = blankFeaturesSectionItem();
                        setItems([...items, row]);
                        setEditId(row.id);
                        patch({ enabled: true });
                      }}
                    >
                      + {isAr ? 'إضافة مميزة' : 'Add Feature'}
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'لا مميزات. القسم يختفي.' : 'No features. Section hides.'}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((it, index) => {
                        const Icon = ICONS.find((i) => i.name === it.icon)?.Icon || Star;
                        return (
                          <li
                            key={it.id}
                            draggable
                            onDragStart={() => setDragIndex(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (dragIndex !== null) setItems(reorderFeaturesSectionItems(items, dragIndex, index));
                              setDragIndex(null);
                            }}
                            className="flex items-center gap-2 rounded-xl border px-2 py-2"
                            style={{ borderColor: 'var(--border)', opacity: it.enabled === false ? 0.45 : 1 }}
                          >
                            <GripVertical className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                            <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                            <div className="min-w-0 flex-1 text-xs font-bold truncate">
                              {bi(lang, it.titleEn, it.titleAr) || (isAr ? 'بدون عنوان' : 'Untitled')}
                            </div>
                            <button
                              type="button"
                              className="w-9 h-5 rounded-full p-0.5"
                              style={{ background: it.enabled !== false ? 'var(--portal-cta)' : 'var(--border)' }}
                              onClick={() => patchItem(it.id, { enabled: it.enabled === false })}
                            />
                            <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setEditId(it.id)} aria-label={isAr ? 'تعديل' : 'Edit'}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg border disabled:opacity-40"
                              style={{ borderColor: 'var(--border)' }}
                              disabled={items.length >= FEATURES_SECTION_MAX_ITEMS}
                              onClick={() => {
                                const copy = duplicateFeaturesSectionItem(it);
                                setItems([...items.slice(0, index + 1), copy, ...items.slice(index + 1)].slice(0, FEATURES_SECTION_MAX_ITEMS));
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
                                setItems(items.filter((x) => x.id !== it.id));
                                if (editId === it.id) setEditId(null);
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
              </>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-features-section-panel="layout">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['columnsDesktop', isAr ? 'سطح المكتب' : 'Desktop', draft?.columnsDesktop || 3, [1, 2, 3]],
                      ['columnsTablet', isAr ? 'لوحي' : 'Tablet', draft?.columnsTablet || 2, [1, 2, 3]],
                      ['columnsMobile', isAr ? 'جوال' : 'Mobile', draft?.columnsMobile || 1, [1, 2]],
                    ] as const
                  ).map(([key, label, value, opts]) => (
                    <label key={key} className="space-y-1 block text-[11px] font-semibold">
                      <span style={{ color: 'var(--muted)' }}>{label}</span>
                      <select
                        className={inputCls}
                        style={inputStyle}
                        value={value}
                        onChange={(e) => patch({ [key]: Number(e.target.value) } as Partial<FeaturesSectionSettings>)}
                      >
                        {opts.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'تخطيط البطاقة' : 'Card Layout'}</span>
                  <select
                    className={inputCls}
                    style={inputStyle}
                    value={draft?.cardLayout || 'stacked'}
                    onChange={(e) => patch({ cardLayout: e.target.value as FeaturesSectionSettings['cardLayout'] })}
                  >
                    <option value="stacked">{isAr ? 'عمودي' : 'Stacked'}</option>
                    <option value="inline">{isAr ? 'صف' : 'Inline'}</option>
                    <option value="centered">{isAr ? 'وسط' : 'Centered'}</option>
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'محاذاة المحتوى' : 'Content Alignment'}</span>
                  <select
                    className={inputCls}
                    style={inputStyle}
                    value={draft?.contentAlign || 'center'}
                    onChange={(e) => patch({ contentAlign: e.target.value as FeaturesSectionSettings['contentAlign'] })}
                  >
                    <option value="left">{isAr ? 'يسار' : 'Left'}</option>
                    <option value="center">{isAr ? 'وسط' : 'Center'}</option>
                    <option value="right">{isAr ? 'يمين' : 'Right'}</option>
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'موضع الأيقونة' : 'Icon Position'}</span>
                  <select
                    className={inputCls}
                    style={inputStyle}
                    value={draft?.iconPosition || 'top'}
                    onChange={(e) => patch({ iconPosition: e.target.value as FeaturesSectionSettings['iconPosition'] })}
                  >
                    <option value="top">{isAr ? 'أعلى' : 'Top'}</option>
                    <option value="left">{isAr ? 'يسار' : 'Left'}</option>
                    <option value="right">{isAr ? 'يمين' : 'Right'}</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1 block text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة البطاقات' : 'Card gap (px)'}</span>
                    <input type="number" min={4} max={40} className={inputCls} style={inputStyle} value={draft?.cardGapPx ?? 16} onChange={(e) => patch({ cardGapPx: Number(e.target.value) || 16 })} />
                  </label>
                  <label className="space-y-1 block text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'حشو البطاقة' : 'Card padding (px)'}</span>
                    <input type="number" min={8} max={48} className={inputCls} style={inputStyle} value={draft?.cardPaddingPx ?? 20} onChange={(e) => patch({ cardPaddingPx: Number(e.target.value) || 20 })} />
                  </label>
                </div>
              </section>
            ) : null}

            {tab === 'style' ? (
              <section className={cardCls} style={cardStyle} data-features-section-panel="style">
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'ألوان البطاقات تتبع مظهر هايبرو المقفل.' : 'Card colors follow the locked HiBrew look.'}
                </p>
                <label className="space-y-1 block text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'حشو القسم عمودياً' : 'Section padding Y'}</span>
                  <input type="number" min={0} max={120} className={inputCls} style={inputStyle} value={draft?.sectionPaddingY ?? 48} onChange={(e) => patch({ sectionPaddingY: Number(e.target.value) || 0 })} />
                </label>
              </section>
            ) : null}

            {tab === 'advanced' ? (
              <section className={cardCls} style={cardStyle} data-features-section-panel="advanced">
                <Toggle on={draft?.showOnDesktop !== false} onChange={(v) => patch({ showOnDesktop: v })} label={isAr ? 'سطح المكتب' : 'Desktop'} />
                <Toggle on={draft?.showOnTablet !== false} onChange={(v) => patch({ showOnTablet: v })} label={isAr ? 'جهاز لوحي' : 'Tablet'} />
                <Toggle on={draft?.showOnMobile !== false} onChange={(v) => patch({ showOnMobile: v })} label={isAr ? 'جوال' : 'Mobile'} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1 block text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة أعلى' : 'Top spacing'}</span>
                    <input type="number" min={0} max={120} className={inputCls} style={inputStyle} value={draft?.spacingTopPx ?? 0} onChange={(e) => patch({ spacingTopPx: Number(e.target.value) || 0 })} />
                  </label>
                  <label className="space-y-1 block text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة أسفل' : 'Bottom spacing'}</span>
                    <input type="number" min={0} max={120} className={inputCls} style={inputStyle} value={draft?.spacingBottomPx ?? 0} onChange={(e) => patch({ spacingBottomPx: Number(e.target.value) || 0 })} />
                  </label>
                </div>
              </section>
            ) : null}
          </>
        }
      />

      <GlobalModal isOpen={!!editing} onClose={() => setEditId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل المميزة' : 'Edit feature'} contentClassName="max-w-xl">
        {editing ? (
          <div className="rounded-2xl border shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل المميزة' : 'Edit Feature'}</h3>
              <button type="button" onClick={() => setEditId(null)} aria-label={isAr ? 'إغلاق' : 'Close'}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto text-xs" data-features-section-edit>
              <div className="grid grid-cols-5 gap-1.5">
                {ICONS.map((row) => {
                  const active = editing.icon === row.name;
                  const Icon = row.Icon;
                  return (
                    <button
                      key={row.name}
                      type="button"
                      onClick={() => patchItem(editing.id, { icon: row.name })}
                      className="h-9 rounded-lg border flex items-center justify-center"
                      style={active ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : { borderColor: 'var(--border)' }}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
              <input
                className={inputCls}
                style={inputStyle}
                dir={isAr ? 'rtl' : 'ltr'}
                maxLength={100}
                value={isAr ? editing.titleAr : editing.titleEn}
                onChange={(e) => patchItem(editing.id, isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })}
                placeholder={isAr ? 'العنوان' : 'Title'}
              />
              <textarea
                className={inputCls}
                style={inputStyle}
                dir={isAr ? 'rtl' : 'ltr'}
                maxLength={200}
                rows={3}
                value={isAr ? editing.descriptionAr : editing.descriptionEn}
                onChange={(e) => patchItem(editing.id, isAr ? { descriptionAr: e.target.value } : { descriptionEn: e.target.value })}
                placeholder={isAr ? 'الوصف' : 'Description'}
              />
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setEditId(null)}>
                {isAr ? 'تم' : 'Done'}
              </button>
            </div>
          </div>
        ) : null}
      </GlobalModal>
    </>
  );
};
