import React, { useState } from 'react';
import { Copy, GripVertical, Pencil, Trash2, X } from 'lucide-react';
import { GlobalModal } from '../../../common/GlobalModal';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import { bi, type FaqItem, type FaqSettings } from '../../../../themes/settings/coffeeModularSettings';
import {
  FAQ_MAX_ITEMS,
  blankFaqItem,
  duplicateFaqItem,
  faqShowsOnDevice,
  reorderFaqItems,
  visibleFaqItems,
  type FaqPreviewDevice,
} from '../../../../themes/coffeeRoasters/components/coffeeFaqLogic';
import { CoffeeFaqSection } from '../../../../themes/coffeeRoasters/components/CoffeeFaqSection';

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

function mapDevice(d: PreviewDevice): FaqPreviewDevice {
  if (d === 'mobile') return 'mobile';
  if (d === 'tablet') return 'tablet';
  return 'desktop';
}

export const CoffeeFaqForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('faq');
  const [tab, setTab] = useState<Tab>('content');
  const [editId, setEditId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const items = draft?.items || [];
  const editing = items.find((it) => it.id === editId) || null;
  const lang = isAr ? 'ar' : 'en';

  const patch = (p: Partial<FaqSettings>) => setDraft({ ...draft, ...p });
  const setItems = (next: FaqItem[]) => patch({ items: next });
  const patchItem = (id: string, p: Partial<FaqItem>) => setItems(items.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const preview = (device: PreviewDevice) => {
    const d = mapDevice(device);
    if (!draft?.enabled) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'القسم مخفي' : 'Section hidden'}</div>;
    }
    if (!faqShowsOnDevice(draft, d)) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'مخفي على هذا الجهاز' : 'Hidden on this device'}</div>;
    }
    if (!visibleFaqItems(draft).length) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'لا أسئلة — بانتظار البيانات' : 'No questions — Waiting for Data'}</div>;
    }
    return <CoffeeFaqSection settings={draft} lang={lang} device={d} />;
  };

  return (
    <>
      <CoffeeWordSettingsShell
        isAr={isAr}
        onBack={onBack}
        embedded={embedded}
        titleEn="Frequently Asked Questions"
        titleAr="الأسئلة الشائعة"
        subtitleEn="Bilingual Q/A accordion. Empty stays empty."
        subtitleAr="أسئلة وأجوبة ثنائية اللغة. الفارغ يبقى فارغاً."
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
                    data-faq-tab={t.id}
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
                <section className={cardCls} style={cardStyle} data-faq-panel="content">
                  <Toggle on={!!draft?.enabled} onChange={(v) => patch({ enabled: v })} label={isAr ? 'تفعيل القسم' : 'Enable Section'} />
                  <Toggle on={draft?.showBadge !== false} onChange={(v) => patch({ showBadge: v })} label={isAr ? 'إظهار الشارة' : 'Show Badge'} />
                  <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={80} value={isAr ? draft?.badgeAr || '' : draft?.badgeEn || ''} onChange={(e) => patch(isAr ? { badgeAr: e.target.value } : { badgeEn: e.target.value })} placeholder={isAr ? 'نص الشارة' : 'Badge text'} />
                  <Toggle on={draft?.showTitle !== false} onChange={(v) => patch({ showTitle: v })} label={isAr ? 'إظهار العنوان' : 'Show Title'} />
                  <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={120} value={isAr ? draft?.titleAr || '' : draft?.titleEn || ''} onChange={(e) => patch(isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })} placeholder={isAr ? 'العنوان' : 'Title'} />
                  <Toggle on={draft?.showDescription !== false} onChange={(v) => patch({ showDescription: v })} label={isAr ? 'إظهار الوصف' : 'Show Description'} />
                  <textarea className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={240} rows={2} value={isAr ? draft?.descriptionAr || '' : draft?.descriptionEn || ''} onChange={(e) => patch(isAr ? { descriptionAr: e.target.value } : { descriptionEn: e.target.value })} placeholder={isAr ? 'الوصف' : 'Description'} />
                </section>

                <section className={cardCls} style={cardStyle} data-faq-panel="items">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{isAr ? `الأسئلة (${items.length}/${FAQ_MAX_ITEMS})` : `Questions (${items.length}/${FAQ_MAX_ITEMS})`}</h3>
                    <button
                      type="button"
                      disabled={items.length >= FAQ_MAX_ITEMS}
                      className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40"
                      onClick={() => {
                        const row = blankFaqItem();
                        setItems([...items, row]);
                        setEditId(row.id);
                        patch({ enabled: true, items: [...items, row] });
                      }}
                    >
                      + {isAr ? 'إضافة سؤال' : 'Add Question'}
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا أسئلة. القسم يختفي.' : 'No questions. Section hides.'}</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((it, index) => (
                        <li
                          key={it.id}
                          draggable
                          onDragStart={() => setDragIndex(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragIndex !== null) setItems(reorderFaqItems(items, dragIndex, index));
                            setDragIndex(null);
                          }}
                          className="flex items-center gap-2 rounded-xl border px-2 py-2"
                          style={{ borderColor: 'var(--border)', opacity: it.enabled === false ? 0.4 : 1 }}
                        >
                          <GripVertical className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                          <div className="min-w-0 flex-1 text-xs font-bold truncate">{bi(lang, it.qEn, it.qAr) || (isAr ? 'بدون سؤال' : 'Untitled')}</div>
                          <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setEditId(it.id)} aria-label={isAr ? 'تعديل' : 'Edit'}><Pencil className="w-3.5 h-3.5" /></button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg border disabled:opacity-40"
                            style={{ borderColor: 'var(--border)' }}
                            disabled={items.length >= FAQ_MAX_ITEMS}
                            onClick={() => {
                              const copy = duplicateFaqItem(it);
                              setItems([...items.slice(0, index + 1), copy, ...items.slice(index + 1)].slice(0, FAQ_MAX_ITEMS));
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
                      ))}
                    </ul>
                  )}
                </section>
              </>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-faq-panel="layout">
                <Toggle on={draft?.allowMultipleOpen === true} onChange={(v) => patch({ allowMultipleOpen: v })} label={isAr ? 'السماح بفتح أكثر من سؤال' : 'Allow Multiple Open Questions'} />
                <Toggle on={draft?.openFirstByDefault !== false} onChange={(v) => patch({ openFirstByDefault: v })} label={isAr ? 'فتح أول سؤال افتراضياً' : 'Open First Question by Default'} />
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'حشوة القسم' : 'Section padding (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.sectionPaddingY ?? 48} onChange={(e) => patch({ sectionPaddingY: Number(e.target.value) })}>
                    {[24, 32, 48, 64, 80].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة الأسئلة' : 'Question gap (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.itemGapPx ?? 12} onChange={(e) => patch({ itemGapPx: Number(e.target.value) })}>
                    {[4, 8, 12, 16, 20].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </section>
            ) : null}

            {tab === 'style' ? (
              <section className={cardCls} style={cardStyle} data-faq-panel="style">
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'شكل الأكورديون يتبع مظهر هايبرو المقفل.' : 'Accordion chrome follows the locked HiBrew look.'}
                </p>
              </section>
            ) : null}

            {tab === 'advanced' ? (
              <section className={cardCls} style={cardStyle} data-faq-panel="advanced">
                <Toggle on={draft?.showOnDesktop !== false} onChange={(v) => patch({ showOnDesktop: v })} label={isAr ? 'إظهار على سطح المكتب' : 'Show on Desktop'} />
                <Toggle on={draft?.showOnTablet !== false} onChange={(v) => patch({ showOnTablet: v })} label={isAr ? 'إظهار على الجهاز اللوحي' : 'Show on Tablet'} />
                <Toggle on={draft?.showOnMobile !== false} onChange={(v) => patch({ showOnMobile: v })} label={isAr ? 'إظهار على الجوال' : 'Show on Mobile'} />
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة علوية إضافية' : 'Extra top spacing (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.spacingTopPx ?? 0} onChange={(e) => patch({ spacingTopPx: Number(e.target.value) })}>
                    {[0, 8, 16, 24, 32, 48].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'مسافة سفلية إضافية' : 'Extra bottom spacing (px)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.spacingBottomPx ?? 0} onChange={(e) => patch({ spacingBottomPx: Number(e.target.value) })}>
                    {[0, 8, 16, 24, 32, 48].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </section>
            ) : null}
          </>
        }
      />

      <GlobalModal isOpen={!!editing} onClose={() => setEditId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل السؤال' : 'Edit question'} contentClassName="max-w-2xl">
        {editing ? (
          <div className="rounded-2xl border shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} data-faq-edit>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل السؤال' : 'Edit Question'}</h3>
              <button type="button" onClick={() => setEditId(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto text-xs">
              <Toggle on={editing.enabled !== false} onChange={(v) => patchItem(editing.id, { enabled: v })} label={isAr ? 'تفعيل السؤال' : 'Enable question'} />
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'السؤال (إنجليزي)' : 'Question (EN)'}</span>
                <textarea className={inputCls} style={inputStyle} dir="ltr" maxLength={300} rows={2} value={editing.qEn} onChange={(e) => patchItem(editing.id, { qEn: e.target.value })} />
              </label>
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'السؤال (عربي)' : 'Question (AR)'}</span>
                <textarea className={inputCls} style={inputStyle} dir="rtl" maxLength={300} rows={2} value={editing.qAr} onChange={(e) => patchItem(editing.id, { qAr: e.target.value })} />
              </label>
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'الإجابة (إنجليزي)' : 'Answer (EN)'}</span>
                <textarea className={inputCls} style={inputStyle} dir="ltr" maxLength={2000} rows={4} value={editing.aEn} onChange={(e) => patchItem(editing.id, { aEn: e.target.value })} />
              </label>
              <label className="block space-y-1 font-semibold">
                <span>{isAr ? 'الإجابة (عربي)' : 'Answer (AR)'}</span>
                <textarea className={inputCls} style={inputStyle} dir="rtl" maxLength={2000} rows={4} value={editing.aAr} onChange={(e) => patchItem(editing.id, { aAr: e.target.value })} />
              </label>
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setEditId(null)}>{isAr ? 'تم' : 'Done'}</button>
            </div>
          </div>
        ) : null}
      </GlobalModal>
    </>
  );
};
