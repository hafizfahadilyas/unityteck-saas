import React, { useState } from 'react';
import { Copy, GripVertical, Pencil, Trash2, X, ShieldCheck, Truck, CreditCard, Palette, MessageCircle, Wrench, Star, Headphones } from 'lucide-react';
import { GlobalModal } from '../../../common/GlobalModal';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import {
  bi,
  type ExclusiveBenefitButtonStyle,
  type ExclusiveBenefitItem,
  type ExclusiveBenefitsSettings,
} from '../../../../themes/settings/coffeeModularSettings';
import {
  BENEFITS_MAX_ITEMS,
  blankBenefitButton,
  blankBenefitItem,
  benefitCardFaded,
  duplicateBenefit,
  reorderBenefits,
  visibleBenefitItems,
} from '../../../../themes/coffeeRoasters/components/coffeeBenefitsLogic';

type Tab = 'content' | 'style' | 'layout' | 'advanced';
const TABS: { id: Tab; en: string; ar: string }[] = [
  { id: 'content', en: 'Content', ar: 'المحتوى' },
  { id: 'style', en: 'Style', ar: 'النمط' },
  { id: 'layout', en: 'Layout', ar: 'التخطيط' },
  { id: 'advanced', en: 'Advanced', ar: 'متقدم' },
];

const ICONS = [
  { name: 'ShieldCheck', Icon: ShieldCheck },
  { name: 'Truck', Icon: Truck },
  { name: 'CreditCard', Icon: CreditCard },
  { name: 'Palette', Icon: Palette },
  { name: 'MessageCircle', Icon: MessageCircle },
  { name: 'Wrench', Icon: Wrench },
  { name: 'Star', Icon: Star },
  { name: 'Headphones', Icon: Headphones },
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

export const ExclusiveBenefitsForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('exclusiveBenefits');
  const [tab, setTab] = useState<Tab>('content');
  const [editId, setEditId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const items = draft?.items || [];
  const editing = items.find((it) => it.id === editId) || null;
  const lang = isAr ? 'ar' : 'en';

  const patch = (p: Partial<ExclusiveBenefitsSettings>) => setDraft({ ...draft, ...p });
  const setItems = (next: ExclusiveBenefitItem[]) => patch({ items: next });
  const patchItem = (id: string, p: Partial<ExclusiveBenefitItem>) => setItems(items.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const previewItems = visibleBenefitItems(draft);

  const preview = (_device: PreviewDevice) => {
    if (!draft?.enabled) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'القسم مخفي' : 'Section hidden'}</div>;
    }
    if (!previewItems.length) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'لا مزايا' : 'No benefits'}</div>;
    }
    const cols = _device === 'mobile' ? draft?.columnsMobile || 2 : draft?.columnsDesktop || 4;
    return (
      <div className="p-3 space-y-2">
        {draft.showTitle !== false && (draft.titleEn || draft.titleAr) ? (
          <div className="font-bold text-sm">{bi(lang, draft.titleEn, draft.titleAr)}</div>
        ) : null}
        {draft.showDescription !== false && (draft.subtitleEn || draft.subtitleAr) ? (
          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>{bi(lang, draft.subtitleEn, draft.subtitleAr)}</div>
        ) : null}
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, cols)}, minmax(0,1fr))`, gap: draft?.cardGapPx ?? 12 }}>
          {previewItems.map((it) => {
            const Icon = ICONS.find((i) => i.name === it.icon)?.Icon || ShieldCheck;
            const faded = benefitCardFaded(it);
            return (
              <div key={it.id} className="rounded-xl border p-3 text-center" style={{ borderColor: 'var(--border)', opacity: faded ? 0.45 : 1, filter: faded ? 'grayscale(0.7)' : undefined }}>
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent)' }} />
                <div className="text-[11px] font-bold">{bi(lang, it.titleEn, it.titleAr)}</div>
                <div className="text-[9px] mt-0.5" style={{ color: 'var(--muted)' }}>{bi(lang, it.descriptionEn, it.descriptionAr)}</div>
                {faded ? <div className="text-[9px] mt-1 font-bold" style={{ color: 'var(--muted)' }}>{isAr ? 'غير متاح' : 'Unavailable'}</div> : null}
                {(it.buttons || []).filter((b) => b.enabled !== false).slice(0, 2).map((b) => (
                  <div key={b.id} className="mt-1 text-[9px] font-bold rounded-md py-1" style={{ background: 'var(--portal-cta)', color: '#fff' }}>
                    {bi(lang, b.labelEn, b.labelAr) || (isAr ? 'زر' : 'Button')}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <CoffeeWordSettingsShell
        isAr={isAr}
        onBack={onBack}
        embedded={embedded}
        titleEn="Benefits Section"
        titleAr="قسم المزايا"
        subtitleEn="Benefit cards with icons, dual buttons, and unavailable state."
        subtitleAr="بطاقات المزايا بأيقونات وزرين وحالة غير متاح."
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
                  <button key={t.id} type="button" role="tab" data-benefits-tab={t.id} aria-selected={active} onClick={() => setTab(t.id)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border" style={active ? { background: 'var(--portal-cta)', color: '#fff', borderColor: 'var(--portal-cta)' } : { borderColor: 'transparent', color: 'var(--text)' }}>
                    {isAr ? t.ar : t.en}
                  </button>
                );
              })}
            </div>

            {tab === 'content' ? (
              <>
                <section className={cardCls} style={cardStyle} data-benefits-panel="content">
                  <Toggle on={!!draft?.enabled} onChange={(v) => patch({ enabled: v })} label={isAr ? 'تفعيل القسم' : 'Enable Section'} />
                  <Toggle on={draft?.showTitle !== false} onChange={(v) => patch({ showTitle: v })} label={isAr ? 'إظهار العنوان' : 'Show Title'} />
                  <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={100} value={isAr ? draft?.titleAr || '' : draft?.titleEn || ''} onChange={(e) => patch(isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })} placeholder={isAr ? 'العنوان' : 'Title'} />
                  <Toggle on={draft?.showDescription !== false} onChange={(v) => patch({ showDescription: v })} label={isAr ? 'إظهار الوصف' : 'Show Description'} />
                  <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={200} value={isAr ? draft?.subtitleAr || '' : draft?.subtitleEn || ''} onChange={(e) => patch(isAr ? { subtitleAr: e.target.value } : { subtitleEn: e.target.value })} placeholder={isAr ? 'الوصف' : 'Description'} />
                </section>

                <section className={cardCls} style={cardStyle} data-benefits-panel="items">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{isAr ? `المزايا (${items.length}/${BENEFITS_MAX_ITEMS})` : `Benefit Items (${items.length}/${BENEFITS_MAX_ITEMS})`}</h3>
                    <button type="button" disabled={items.length >= BENEFITS_MAX_ITEMS} className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40" onClick={() => { const row = blankBenefitItem(); setItems([...items, row]); setEditId(row.id); patch({ enabled: true }); }}>
                      + {isAr ? 'إضافة ميزة' : 'Add Benefit'}
                    </button>
                  </div>
                  {items.length === 0 ? <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا مزايا. القسم يختفي.' : 'No benefits. Section hides.'}</p> : (
                    <ul className="space-y-2">
                      {items.map((it, index) => {
                        const Icon = ICONS.find((i) => i.name === it.icon)?.Icon || ShieldCheck;
                        return (
                          <li
                            key={it.id}
                            draggable
                            onDragStart={() => setDragIndex(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => { if (dragIndex !== null) setItems(reorderBenefits(items, dragIndex, index)); setDragIndex(null); }}
                            className="flex items-center gap-2 rounded-xl border px-2 py-2"
                            style={{ borderColor: 'var(--border)', opacity: it.enabled === false ? 0.4 : benefitCardFaded(it) ? 0.55 : 1 }}
                          >
                            <GripVertical className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                            <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate">{bi(lang, it.titleEn, it.titleAr) || (isAr ? 'بدون عنوان' : 'Untitled')}</div>
                              {benefitCardFaded(it) ? <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{isAr ? 'غير متاح' : 'Unavailable'}</div> : null}
                            </div>
                            <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setEditId(it.id)} aria-label={isAr ? 'تعديل' : 'Edit'}><Pencil className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--border)' }} disabled={items.length >= BENEFITS_MAX_ITEMS} onClick={() => { const copy = duplicateBenefit(it); setItems([...items.slice(0, index + 1), copy, ...items.slice(index + 1)].slice(0, BENEFITS_MAX_ITEMS)); setEditId(copy.id); }} aria-label={isAr ? 'نسخ' : 'Duplicate'}><Copy className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 rounded-lg border border-rose-200 text-rose-500" onClick={() => { setItems(items.filter((x) => x.id !== it.id)); if (editId === it.id) setEditId(null); }} aria-label={isAr ? 'حذف' : 'Delete'}><Trash2 className="w-3.5 h-3.5" /></button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-benefits-panel="layout">
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'أعمدة سطح المكتب' : 'Desktop columns'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.columnsDesktop || 4} onChange={(e) => patch({ columnsDesktop: Number(e.target.value) })}>
                    {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'أعمدة الجوال' : 'Mobile columns'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.columnsMobile || 2} onChange={(e) => patch({ columnsMobile: Number(e.target.value) })}>
                    {[1, 2].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة البطاقات' : 'Card gap (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.cardGapPx ?? 12} onChange={(e) => patch({ cardGapPx: Number(e.target.value) })}>
                    {[8, 12, 16, 20, 24].map((n) => <option key={n} value={n}>{n} px</option>)}
                  </select>
                </label>
              </section>
            ) : null}

            {tab === 'style' || tab === 'advanced' ? (
              <section className={cardCls} style={cardStyle} data-benefits-panel={tab}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {tab === 'style'
                    ? isAr ? 'ألوان البطاقات تتبع مظهر هايبرو المقفل.' : 'Card colors follow the locked HiBrew look.'
                    : isAr ? 'إعدادات إضافية محفوظة مع القسم.' : 'Extra settings persist with the section.'}
                </p>
              </section>
            ) : null}
          </>
        }
      />

      <GlobalModal isOpen={!!editing} onClose={() => setEditId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل الميزة' : 'Edit benefit'} contentClassName="max-w-2xl">
        {editing ? (
          <div className="rounded-2xl border shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل الميزة' : 'Edit Benefit'}</h3>
              <button type="button" onClick={() => setEditId(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-8 gap-1.5">
                {ICONS.map((row) => {
                  const active = editing.icon === row.name;
                  const Icon = row.Icon;
                  return (
                    <button key={row.name} type="button" onClick={() => patchItem(editing.id, { icon: row.name })} className="h-9 rounded-lg border flex items-center justify-center" style={active ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : { borderColor: 'var(--border)' }}>
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
              <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={100} value={isAr ? editing.titleAr : editing.titleEn} onChange={(e) => patchItem(editing.id, isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })} placeholder={isAr ? 'العنوان' : 'Title'} />
              <textarea className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={200} rows={3} value={isAr ? editing.descriptionAr : editing.descriptionEn} onChange={(e) => patchItem(editing.id, isAr ? { descriptionAr: e.target.value } : { descriptionEn: e.target.value })} placeholder={isAr ? 'الوصف' : 'Description'} />

              <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--border)' }} data-benefits-status>
                <div className="text-[11px] font-bold">{isAr ? 'حالة البطاقة' : 'Card Status'}</div>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input type="radio" checked={!editing.unavailable} onChange={() => patchItem(editing.id, { unavailable: false, enabled: true })} />
                  {isAr ? 'تفعيل هذه الميزة' : 'Enable This Benefit'}
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input type="radio" checked={!!editing.unavailable} onChange={() => patchItem(editing.id, { unavailable: true, enabled: true })} />
                  {isAr ? 'تعطيل (إظهار كغير متاح)' : 'Disable (Show as Unavailable)'}
                </label>
              </div>

              <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--border)' }} data-benefits-buttons>
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold">{isAr ? 'أزرار الإجراء' : 'Action Buttons'}</div>
                  <button
                    type="button"
                    disabled={(editing.buttons || []).length >= 2}
                    className="unity-btn-primary px-2 py-1 rounded-lg text-[10px] font-bold disabled:opacity-40"
                    onClick={() => patchItem(editing.id, { buttons: [...(editing.buttons || []), blankBenefitButton()] })}
                  >
                    + {isAr ? 'زر' : 'Button'}
                  </button>
                </div>
                {(editing.buttons || []).map((btn) => (
                  <div key={btn.id} className="space-y-1.5 rounded-lg border p-2" style={{ borderColor: 'var(--border)' }}>
                    <Toggle on={btn.enabled !== false} onChange={(v) => patchItem(editing.id, { buttons: (editing.buttons || []).map((b) => (b.id === btn.id ? { ...b, enabled: v } : b)) })} label={isAr ? 'تفعيل الزر' : 'Enable button'} />
                    <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} value={isAr ? btn.labelAr : btn.labelEn} onChange={(e) => patchItem(editing.id, { buttons: (editing.buttons || []).map((b) => (b.id === btn.id ? { ...b, ...(isAr ? { labelAr: e.target.value } : { labelEn: e.target.value }) } : b)) })} placeholder={isAr ? 'نص الزر' : 'Button text'} />
                    <select
                      className={inputCls}
                      style={inputStyle}
                      value={btn.style}
                      onChange={(e) =>
                        patchItem(editing.id, {
                          buttons: (editing.buttons || []).map((b) =>
                            b.id === btn.id ? { ...b, style: e.target.value as ExclusiveBenefitButtonStyle } : b,
                          ),
                        })
                      }
                    >
                      <option value="primary">{isAr ? 'أساسي' : 'Primary'}</option>
                      <option value="secondary">{isAr ? 'ثانوي' : 'Secondary'}</option>
                      <option value="outline">{isAr ? 'إطار' : 'Outline'}</option>
                      <option value="whatsapp">{isAr ? 'واتساب' : 'WhatsApp'}</option>
                    </select>
                    <input className={inputCls} style={inputStyle} dir="ltr" value={btn.url} onChange={(e) => patchItem(editing.id, { buttons: (editing.buttons || []).map((b) => (b.id === btn.id ? { ...b, url: e.target.value } : b)) })} placeholder="https://" />
                    <button type="button" className="text-[10px] font-bold text-rose-500" onClick={() => patchItem(editing.id, { buttons: (editing.buttons || []).filter((b) => b.id !== btn.id) })}>{isAr ? 'حذف الزر' : 'Delete button'}</button>
                  </div>
                ))}
              </div>

              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setEditId(null)}>{isAr ? 'تم' : 'Done'}</button>
            </div>
          </div>
        ) : null}
      </GlobalModal>
    </>
  );
};
