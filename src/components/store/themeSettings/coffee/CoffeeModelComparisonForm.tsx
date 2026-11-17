import React, { useState } from 'react';
import { GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { MediaUploadField } from '../../../common/MediaUploadField';
import { GlobalModal } from '../../../common/GlobalModal';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import {
  bi,
  type ModelComparisonModel,
  type ModelComparisonSettings,
  type ModelComparisonSpec,
} from '../../../../themes/settings/coffeeModularSettings';
import { CoffeeModelComparisonSection } from '../../../../themes/coffeeRoasters/components/CoffeeModelComparisonSection';
import {
  MODEL_COMPARISON_MAX_MODELS,
  MODEL_COMPARISON_MAX_SPECS,
  blankModel,
  blankSpec,
  modelComparisonShowsOnDevice,
  removeModelKeepingSpecs,
  reorderModels,
  reorderSpecs,
  selectModel,
  syncSpecValuesToModels,
  visibleModels,
} from '../../../../themes/coffeeRoasters/components/coffeeModelComparisonLogic';

type Tab = 'content' | 'style' | 'layout' | 'advanced';
const TABS: { id: Tab; en: string; ar: string }[] = [
  { id: 'content', en: 'Content', ar: 'المحتوى' },
  { id: 'style', en: 'Style', ar: 'النمط' },
  { id: 'layout', en: 'Layout', ar: 'التخطيط' },
  { id: 'advanced', en: 'Advanced', ar: 'متقدم' },
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

export const CoffeeModelComparisonForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('modelComparison');
  const [tab, setTab] = useState<Tab>('content');
  const [editModelId, setEditModelId] = useState<string | null>(null);
  const [editSpecId, setEditSpecId] = useState<string | null>(null);
  const [dragModel, setDragModel] = useState<number | null>(null);
  const [dragSpec, setDragSpec] = useState<number | null>(null);

  const models = draft?.models || [];
  const specs = draft?.specs || [];
  const editingModel = models.find((m) => m.id === editModelId) || null;
  const editingSpec = specs.find((s) => s.id === editSpecId) || null;
  const lang = isAr ? 'ar' : 'en';

  const patch = (p: Partial<ModelComparisonSettings>) => setDraft({ ...draft, ...p });
  const setModels = (next: ModelComparisonModel[]) => {
    const synced = syncSpecValuesToModels(specs, next);
    patch({ models: next, specs: synced });
  };
  const setSpecs = (next: ModelComparisonSpec[]) => patch({ specs: next });
  const patchModel = (id: string, p: Partial<ModelComparisonModel>) =>
    setModels(models.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const patchSpec = (id: string, p: Partial<ModelComparisonSpec>) =>
    setSpecs(specs.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const preview = (device: PreviewDevice) => {
    if (!draft?.enabled) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'القسم مخفي' : 'Section hidden'}</div>;
    }
    if (!modelComparisonShowsOnDevice(draft, device)) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'مخفي على هذا الجهاز' : 'Hidden on this device'}</div>;
    }
    if (!visibleModels(draft).length) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'لا موديلات — بانتظار البيانات' : 'No models — Waiting for Data'}</div>;
    }
    return <CoffeeModelComparisonSection settings={draft} lang={lang} device={device} />;
  };

  return (
    <>
      <CoffeeWordSettingsShell
        isAr={isAr}
        onBack={onBack}
        embedded={embedded}
        titleEn="Model Comparison"
        titleAr="مقارنة الموديلات"
        subtitleEn="Compare models with images, prices, and specification rows."
        subtitleAr="قارن الموديلات بالصور والأسعار وصفوف المواصفات."
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
                    data-model-comparison-tab={t.id}
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
                <section className={cardCls} style={cardStyle} data-model-comparison-panel="content">
                  <Toggle on={!!draft?.enabled} onChange={(v) => patch({ enabled: v })} label={isAr ? 'تفعيل القسم' : 'Enable Section'} />
                  <Toggle on={draft?.showBadge !== false} onChange={(v) => patch({ showBadge: v })} label={isAr ? 'إظهار الشارة' : 'Show Badge'} />
                  <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={60} value={isAr ? draft?.badgeAr || '' : draft?.badgeEn || ''} onChange={(e) => patch(isAr ? { badgeAr: e.target.value } : { badgeEn: e.target.value })} placeholder={isAr ? 'نص الشارة' : 'Badge text'} />
                  <Toggle on={draft?.showSecondaryLabel !== false} onChange={(v) => patch({ showSecondaryLabel: v })} label={isAr ? 'إظهار التسمية الثانوية' : 'Show Secondary Label'} />
                  <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={60} value={isAr ? draft?.secondaryLabelAr || '' : draft?.secondaryLabelEn || ''} onChange={(e) => patch(isAr ? { secondaryLabelAr: e.target.value } : { secondaryLabelEn: e.target.value })} placeholder={isAr ? 'تسمية ثانوية' : 'Secondary label'} />
                  <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={100} value={isAr ? draft?.titleAr || '' : draft?.titleEn || ''} onChange={(e) => patch(isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })} placeholder={isAr ? 'العنوان' : 'Title'} />
                  <Toggle on={draft?.showDescription !== false} onChange={(v) => patch({ showDescription: v })} label={isAr ? 'إظهار الوصف' : 'Show Description'} />
                  <textarea className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={200} rows={2} value={isAr ? draft?.descriptionAr || '' : draft?.descriptionEn || ''} onChange={(e) => patch(isAr ? { descriptionAr: e.target.value } : { descriptionEn: e.target.value })} placeholder={isAr ? 'الوصف' : 'Description'} />
                </section>

                <section className={cardCls} style={cardStyle} data-model-comparison-panel="models">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{isAr ? `الموديلات (${models.length}/${MODEL_COMPARISON_MAX_MODELS})` : `Models (${models.length}/${MODEL_COMPARISON_MAX_MODELS})`}</h3>
                    <button
                      type="button"
                      disabled={models.length >= MODEL_COMPARISON_MAX_MODELS}
                      className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40"
                      onClick={() => {
                        const row = blankModel();
                        setModels([...models, row]);
                        setEditModelId(row.id);
                        patch({ enabled: true });
                      }}
                    >
                      + {isAr ? 'إضافة موديل' : 'Add Model'}
                    </button>
                  </div>
                  {models.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا موديلات. القسم يختفي.' : 'No models. Section hides.'}</p>
                  ) : (
                    <ul className="space-y-2">
                      {models.map((m, index) => (
                        <li
                          key={m.id}
                          draggable
                          onDragStart={() => setDragModel(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragModel !== null) setModels(reorderModels(models, dragModel, index));
                            setDragModel(null);
                          }}
                          className="flex items-center gap-2 rounded-xl border px-2 py-2"
                          style={{ borderColor: 'var(--border)', opacity: m.enabled === false ? 0.45 : 1 }}
                        >
                          <GripVertical className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                          {m.image ? <img src={m.image} alt="" className="w-9 h-9 rounded-lg object-cover" /> : <span className="w-9 h-9 rounded-lg border" style={{ borderColor: 'var(--border)' }} />}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold truncate">{bi(lang, m.nameEn, m.nameAr) || (isAr ? 'بدون اسم' : 'Untitled')}</div>
                            {m.selected ? <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{isAr ? 'محدد' : 'Selected'}</div> : null}
                          </div>
                          <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setEditModelId(m.id)} aria-label={isAr ? 'تعديل' : 'Edit'}><Pencil className="w-3.5 h-3.5" /></button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-500"
                            onClick={() => {
                              const next = removeModelKeepingSpecs(models, specs, m.id);
                              patch({ models: next.models, specs: next.specs });
                              if (editModelId === m.id) setEditModelId(null);
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

                <section className={cardCls} style={cardStyle} data-model-comparison-panel="specs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{isAr ? `المواصفات (${specs.length}/${MODEL_COMPARISON_MAX_SPECS})` : `Specifications (${specs.length}/${MODEL_COMPARISON_MAX_SPECS})`}</h3>
                    <button
                      type="button"
                      disabled={specs.length >= MODEL_COMPARISON_MAX_SPECS}
                      className="unity-btn-primary inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40"
                      onClick={() => {
                        const row = blankSpec(models.map((m) => m.id));
                        setSpecs([...specs, row]);
                        setEditSpecId(row.id);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" /> {isAr ? 'إضافة مواصفة' : 'Add Spec'}
                    </button>
                  </div>
                  {specs.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا صفوف مواصفات.' : 'No specification rows.'}</p>
                  ) : (
                    <ul className="space-y-2">
                      {specs.map((s, index) => (
                        <li
                          key={s.id}
                          draggable
                          onDragStart={() => setDragSpec(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragSpec !== null) setSpecs(reorderSpecs(specs, dragSpec, index));
                            setDragSpec(null);
                          }}
                          className="flex items-center gap-2 rounded-xl border px-2 py-2"
                          style={{ borderColor: 'var(--border)', opacity: s.enabled === false ? 0.45 : 1 }}
                        >
                          <GripVertical className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                          <div className="min-w-0 flex-1 text-xs font-bold truncate">{bi(lang, s.nameEn, s.nameAr) || (isAr ? 'مواصفة' : 'Spec')}</div>
                          <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setEditSpecId(s.id)} aria-label={isAr ? 'تعديل' : 'Edit'}><Pencil className="w-3.5 h-3.5" /></button>
                          <button type="button" className="p-1.5 rounded-lg border border-rose-200 text-rose-500" onClick={() => { setSpecs(specs.filter((x) => x.id !== s.id)); if (editSpecId === s.id) setEditSpecId(null); }} aria-label={isAr ? 'حذف' : 'Delete'}><Trash2 className="w-3.5 h-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-model-comparison-panel="layout">
                <Toggle on={draft?.showProductImages !== false} onChange={(v) => patch({ showProductImages: v })} label={isAr ? 'إظهار الصور' : 'Show Product Images'} />
                <Toggle on={draft?.showProductPrices !== false} onChange={(v) => patch({ showProductPrices: v })} label={isAr ? 'إظهار الأسعار' : 'Show Product Prices'} />
                <Toggle on={draft?.showSelectionButtons !== false} onChange={(v) => patch({ showSelectionButtons: v })} label={isAr ? 'أزرار الاختيار' : 'Show Selection Buttons'} />
                <Toggle on={draft?.showSpecifications !== false} onChange={(v) => patch({ showSpecifications: v })} label={isAr ? 'إظهار المواصفات' : 'Show Specifications'} />
                <Toggle on={draft?.highlightSelectedModel !== false} onChange={(v) => patch({ highlightSelectedModel: v })} label={isAr ? 'تمييز الموديل المحدد' : 'Highlight Selected Model'} />
                <Toggle on={draft?.showSpecificationLabels !== false} onChange={(v) => patch({ showSpecificationLabels: v })} label={isAr ? 'تسميات المواصفات' : 'Show Spec Labels'} />
                <Toggle on={!!draft?.allowFullScreen} onChange={(v) => patch({ allowFullScreen: v })} label={isAr ? 'ملء الشاشة' : 'Allow Full Screen'} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1 block text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة الموديلات' : 'Model gap'}</span>
                    <input type="number" min={4} max={40} className={inputCls} style={inputStyle} value={draft?.modelGapPx ?? 16} onChange={(e) => patch({ modelGapPx: Number(e.target.value) || 16 })} />
                  </label>
                  <label className="space-y-1 block text-[11px] font-semibold">
                    <span style={{ color: 'var(--muted)' }}>{isAr ? 'حشو البطاقة' : 'Card padding'}</span>
                    <input type="number" min={8} max={40} className={inputCls} style={inputStyle} value={draft?.cardPaddingPx ?? 16} onChange={(e) => patch({ cardPaddingPx: Number(e.target.value) || 16 })} />
                  </label>
                </div>
              </section>
            ) : null}

            {tab === 'style' ? (
              <section className={cardCls} style={cardStyle} data-model-comparison-panel="style">
                <label className="space-y-1 block text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'حشو القسم عمودياً' : 'Section padding Y'}</span>
                  <input type="number" min={0} max={120} className={inputCls} style={inputStyle} value={draft?.sectionPaddingY ?? 48} onChange={(e) => patch({ sectionPaddingY: Number(e.target.value) || 0 })} />
                </label>
                <label className="space-y-1 block text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة صفوف المواصفات' : 'Spec row gap'}</span>
                  <input type="number" min={0} max={24} className={inputCls} style={inputStyle} value={draft?.specRowGapPx ?? 8} onChange={(e) => patch({ specRowGapPx: Number(e.target.value) || 0 })} />
                </label>
              </section>
            ) : null}

            {tab === 'advanced' ? (
              <section className={cardCls} style={cardStyle} data-model-comparison-panel="advanced">
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

      <GlobalModal isOpen={!!editingModel} onClose={() => setEditModelId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل الموديل' : 'Edit model'} contentClassName="max-w-xl">
        {editingModel ? (
          <div className="rounded-2xl border shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} data-model-comparison-edit-model>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل الموديل' : 'Edit Model'}</h3>
              <button type="button" onClick={() => setEditModelId(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto text-xs">
              <MediaUploadField label={isAr ? 'صورة المنتج' : 'Product image'} value={editingModel.image} onChange={(url) => patchModel(editingModel.id, { image: url })} aspectRatio="square" initialFolder="products" recommendedSize="800 × 800 px" />
              <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={100} value={isAr ? editingModel.nameAr : editingModel.nameEn} onChange={(e) => patchModel(editingModel.id, isAr ? { nameAr: e.target.value } : { nameEn: e.target.value })} placeholder={isAr ? 'اسم الموديل' : 'Model name'} />
              <input className={inputCls} style={inputStyle} dir="ltr" type="number" min={0} step={0.01} value={editingModel.price ?? ''} onChange={(e) => patchModel(editingModel.id, { price: e.target.value === '' ? null : Number(e.target.value) })} placeholder={isAr ? 'السعر (ر.س)' : 'Price (SAR)'} />
              <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={40} value={isAr ? editingModel.buttonAr : editingModel.buttonEn} onChange={(e) => patchModel(editingModel.id, isAr ? { buttonAr: e.target.value } : { buttonEn: e.target.value })} placeholder={isAr ? 'نص الزر' : 'Button text'} />
              <Toggle
                on={!!editingModel.selected}
                onChange={(v) => setModels(v ? selectModel(models, editingModel.id) : models.map((m) => (m.id === editingModel.id ? { ...m, selected: false } : m)))}
                label={isAr ? 'تحديد كموديل مختار' : 'Mark as Selected Model'}
              />
              <Toggle on={editingModel.enabled !== false} onChange={(v) => patchModel(editingModel.id, { enabled: v })} label={isAr ? 'تفعيل الموديل' : 'Enable model'} />
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setEditModelId(null)}>{isAr ? 'تم' : 'Done'}</button>
            </div>
          </div>
        ) : null}
      </GlobalModal>

      <GlobalModal isOpen={!!editingSpec} onClose={() => setEditSpecId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل المواصفة' : 'Edit specification'} contentClassName="max-w-xl">
        {editingSpec ? (
          <div className="rounded-2xl border shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} data-model-comparison-edit-spec>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل المواصفة' : 'Edit Specification'}</h3>
              <button type="button" onClick={() => setEditSpecId(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto text-xs">
              <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={80} value={isAr ? editingSpec.nameAr : editingSpec.nameEn} onChange={(e) => patchSpec(editingSpec.id, isAr ? { nameAr: e.target.value } : { nameEn: e.target.value })} placeholder={isAr ? 'اسم المواصفة' : 'Specification name'} />
              {models.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>{isAr ? 'أضف موديلاً أولاً.' : 'Add a model first.'}</p>
              ) : (
                models.map((m) => {
                  const cell = editingSpec.values?.[m.id] || { valueEn: '', valueAr: '' };
                  return (
                    <label key={m.id} className="block space-y-1">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {bi(lang, m.nameEn, m.nameAr) || m.id}
                      </span>
                      <input
                        className={inputCls}
                        style={inputStyle}
                        dir={isAr ? 'rtl' : 'ltr'}
                        value={isAr ? cell.valueAr : cell.valueEn}
                        onChange={(e) => {
                          const nextVal = isAr
                            ? { ...cell, valueAr: e.target.value }
                            : { ...cell, valueEn: e.target.value };
                          patchSpec(editingSpec.id, {
                            values: { ...(editingSpec.values || {}), [m.id]: nextVal },
                          });
                        }}
                        placeholder={isAr ? 'القيمة' : 'Value'}
                      />
                    </label>
                  );
                })
              )}
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setEditSpecId(null)}>{isAr ? 'تم' : 'Done'}</button>
            </div>
          </div>
        ) : null}
      </GlobalModal>
    </>
  );
};
