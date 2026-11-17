import React, { useState } from 'react';
import { Copy, GripVertical, Pencil, Trash2, X } from 'lucide-react';
import { MediaUploadField } from '../../../common/MediaUploadField';
import { GlobalModal } from '../../../common/GlobalModal';
import { useCoffeeDraft } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';
import {
  bi,
  type EventMasterclassItem,
  type EventsMasterclassesSettings,
} from '../../../../themes/settings/coffeeModularSettings';
import {
  EVENTS_MAX_ITEMS,
  blankEventItem,
  duplicateEvent,
  reorderEvents,
  spacingPx,
  splitLargeSmall,
  visibleEvents,
} from '../../../../themes/coffeeRoasters/components/coffeeEventsLogic';

type Tab = 'content' | 'templates' | 'style' | 'layout' | 'code' | 'ai';
const TABS: { id: Tab; en: string; ar: string }[] = [
  { id: 'content', en: 'Content', ar: 'المحتوى' },
  { id: 'templates', en: 'Templates', ar: 'القوالب' },
  { id: 'style', en: 'Style', ar: 'النمط' },
  { id: 'layout', en: 'Layout', ar: 'التخطيط' },
  { id: 'code', en: 'Code', ar: 'الرمز' },
  { id: 'ai', en: 'AI', ar: 'الذكاء الاصطناعي' },
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

export const CoffeeEventsForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('eventsMasterclasses');
  const [tab, setTab] = useState<Tab>('content');
  const [editId, setEditId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const events = draft?.events || [];
  const editing = events.find((e) => e.id === editId) || null;
  const lang = isAr ? 'ar' : 'en';

  const patch = (p: Partial<EventsMasterclassesSettings>) => setDraft({ ...draft, ...p });
  const setEvents = (next: EventMasterclassItem[]) => patch({ events: next });
  const patchEvent = (id: string, p: Partial<EventMasterclassItem>) =>
    setEvents(events.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const previewRows = visibleEvents(draft);

  const preview = (_device: PreviewDevice) => {
    if (!draft?.enabled) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'القسم مخفي' : 'Section hidden'}</div>;
    }
    if (!previewRows.length) {
      return <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }}>{isAr ? 'لا فعاليات — بانتظار البيانات' : 'No events — Waiting for Data'}</div>;
    }
    const { large, small } = splitLargeSmall(previewRows);
    const gap = spacingPx(draft.cardSpacing);
    return (
      <div className="p-3 space-y-2" style={{ gap }}>
        {(draft.showSectionTag !== false && (draft.badgeEn || draft.badgeAr)) ? (
          <div className="text-[10px] font-bold text-center" style={{ color: 'var(--muted)' }}>{bi(lang, draft.badgeEn, draft.badgeAr)}</div>
        ) : null}
        {(draft.titleEn || draft.titleAr) ? <div className="font-bold text-sm text-center">{bi(lang, draft.titleEn, draft.titleAr)}</div> : null}
        {large ? (
          <div className="rounded-xl border overflow-hidden min-h-[100px] relative" style={{ borderColor: 'var(--border)', borderRadius: draft.cardBorderRadius ?? 16 }}>
            {large.image ? <img src={large.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" /> : null}
            <div className="relative z-10 p-3 text-xs font-bold bg-black/40 text-white min-h-[100px] flex flex-col justify-end">
              {draft.showCardLabels !== false && (large.tagEn || large.tagAr) ? <span className="text-[9px] mb-1">{bi(lang, large.tagEn, large.tagAr)}</span> : null}
              <span>{bi(lang, large.titleEn, large.titleAr)}</span>
            </div>
          </div>
        ) : null}
        {small.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {small.slice(0, 2).map((ev) => (
              <div key={ev.id} className="rounded-xl border p-2 text-[10px] font-bold" style={{ borderColor: 'var(--border)' }}>
                {ev.image ? <img src={ev.image} alt="" className="h-12 w-full object-cover rounded-lg mb-1" /> : null}
                {bi(lang, ev.titleEn, ev.titleAr) || (isAr ? 'فعالية' : 'Event')}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <CoffeeWordSettingsShell
        isAr={isAr}
        onBack={onBack}
        embedded={embedded}
        titleEn="Events & Masterclasses"
        titleAr="الفعاليات وورش العمل"
        subtitleEn="Manage event cards, layout, and carousel. Empty stays empty."
        subtitleAr="إدارة بطاقات الفعاليات والتخطيط والعرض المتحرك. الفارغ يبقى فارغاً."
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
                  <button key={t.id} type="button" role="tab" data-events-tab={t.id} aria-selected={active} onClick={() => setTab(t.id)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border" style={active ? { background: 'var(--portal-cta)', color: '#fff', borderColor: 'var(--portal-cta)' } : { borderColor: 'transparent', color: 'var(--text)' }}>
                    {isAr ? t.ar : t.en}
                  </button>
                );
              })}
            </div>

            {tab === 'content' ? (
              <>
                <section className={cardCls} style={cardStyle} data-events-panel="content">
                  <Toggle on={!!draft?.enabled} onChange={(v) => patch({ enabled: v })} label={isAr ? 'تفعيل القسم' : 'Enable Section'} />
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{isAr ? 'شارة القسم' : 'Section Tag (Badge)'}</span>
                    <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={40} value={isAr ? draft?.badgeAr || '' : draft?.badgeEn || ''} onChange={(e) => patch(isAr ? { badgeAr: e.target.value } : { badgeEn: e.target.value })} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{isAr ? 'عنوان القسم' : 'Section Title'}</span>
                    <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={100} value={isAr ? draft?.titleAr || '' : draft?.titleEn || ''} onChange={(e) => patch(isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{isAr ? 'الوصف' : 'Section Description'}</span>
                    <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={200} value={isAr ? draft?.descriptionAr || '' : draft?.descriptionEn || ''} onChange={(e) => patch(isAr ? { descriptionAr: e.target.value } : { descriptionEn: e.target.value })} />
                  </label>
                </section>

                <section className={cardCls} style={cardStyle} data-events-panel="events">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{isAr ? `إدارة الفعاليات (${events.length}/${EVENTS_MAX_ITEMS})` : `Events Management (${events.length}/${EVENTS_MAX_ITEMS})`}</h3>
                    <button type="button" disabled={events.length >= EVENTS_MAX_ITEMS} className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40" onClick={() => { const row = blankEventItem({ cardSize: events.length === 0 ? 'large' : 'small' }); setEvents([...events, row]); setEditId(row.id); patch({ enabled: true }); }}>
                      + {isAr ? 'إضافة فعالية' : 'Add Event'}
                    </button>
                  </div>
                  {events.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا فعاليات. القسم يختفي في المتجر.' : 'No events. Section hides on the storefront.'}</p>
                  ) : (
                    <ul className="space-y-2">
                      {events.map((ev, index) => (
                        <li
                          key={ev.id}
                          draggable
                          onDragStart={() => setDragIndex(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => { if (dragIndex !== null) setEvents(reorderEvents(events, dragIndex, index)); setDragIndex(null); }}
                          className="flex items-center gap-2 rounded-xl border px-2 py-2"
                          style={{ borderColor: 'var(--border)', opacity: ev.enabled === false ? 0.5 : 1 }}
                        >
                          <GripVertical className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                          <span className="text-[10px] font-bold w-4" style={{ color: 'var(--muted)' }}>{index + 1}</span>
                          {ev.image ? <img src={ev.image} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <span className="w-10 h-10 rounded-lg border" style={{ borderColor: 'var(--border)' }} />}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold truncate">{bi(lang, ev.titleEn, ev.titleAr) || (isAr ? 'بدون عنوان' : 'Untitled')}</div>
                            <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{ev.cardSize === 'large' ? (isAr ? 'كبير' : 'Large') : isAr ? 'صغير' : 'Small'}</div>
                          </div>
                          <button type="button" className="w-9 h-5 rounded-full p-0.5" style={{ background: ev.enabled !== false ? 'var(--portal-cta)' : 'var(--border)' }} onClick={() => patchEvent(ev.id, { enabled: ev.enabled === false })} />
                          <button type="button" className="p-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => setEditId(ev.id)} aria-label={isAr ? 'تعديل' : 'Edit'}><Pencil className="w-3.5 h-3.5" /></button>
                          <button type="button" className="p-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--border)' }} disabled={events.length >= EVENTS_MAX_ITEMS} onClick={() => { const copy = duplicateEvent(ev); setEvents([...events.slice(0, index + 1), copy, ...events.slice(index + 1)].slice(0, EVENTS_MAX_ITEMS)); setEditId(copy.id); }} aria-label={isAr ? 'نسخ' : 'Duplicate'}><Copy className="w-3.5 h-3.5" /></button>
                          <button type="button" className="p-1.5 rounded-lg border border-rose-200 text-rose-500" onClick={() => { setEvents(events.filter((x) => x.id !== ev.id)); if (editId === ev.id) setEditId(null); }} aria-label={isAr ? 'حذف' : 'Delete'}><Trash2 className="w-3.5 h-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            ) : null}

            {tab === 'layout' ? (
              <section className={cardCls} style={cardStyle} data-events-panel="layout">
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'تخطيط البطاقات' : 'Cards Layout'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.cardsLayout || 'one-large-two-small'} onChange={(e) => patch({ cardsLayout: e.target.value as EventsMasterclassesSettings['cardsLayout'] })}>
                    <option value="one-large-two-small">{isAr ? 'واحد كبير + اثنان صغيران' : 'One Large + Two Small'}</option>
                    <option value="grid">{isAr ? 'شبكة' : 'Grid'}</option>
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'بطاقات في الصف (أسفل)' : 'Cards per Row (Bottom)'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.cardsPerRowBottom || 2} onChange={(e) => patch({ cardsPerRowBottom: Number(e.target.value) })}>
                    {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'تباعد البطاقات' : 'Card Spacing'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.cardSpacing || 'medium'} onChange={(e) => patch({ cardSpacing: e.target.value as EventsMasterclassesSettings['cardSpacing'] })}>
                    <option value="small">{isAr ? 'صغير' : 'Small'}</option>
                    <option value="medium">{isAr ? 'متوسط' : 'Medium'}</option>
                    <option value="large">{isAr ? 'كبير' : 'Large'}</option>
                  </select>
                </label>
                <Toggle on={draft?.autoplay === true} onChange={(v) => patch({ autoplay: v })} label={isAr ? 'تشغيل تلقائي (بطاقة كبيرة)' : 'Enable Auto Play (Large Card)'} />
                <Toggle on={draft?.showCarouselControls !== false} onChange={(v) => patch({ showCarouselControls: v })} label={isAr ? 'إظهار عناصر التحكم' : 'Show Controls (Pause / Next)'} />
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'سرعة التشغيل (ثوانٍ)' : 'Auto Play Speed (sec)'}</span>
                  <input type="number" min={2} max={20} className={inputCls} style={inputStyle} value={draft?.autoplaySpeedSec || 5} onChange={(e) => patch({ autoplaySpeedSec: Number(e.target.value) || 5 })} />
                </label>
              </section>
            ) : null}

            {tab === 'style' ? (
              <section className={cardCls} style={cardStyle} data-events-panel="style">
                <Toggle on={draft?.showSectionTag !== false} onChange={(v) => patch({ showSectionTag: v })} label={isAr ? 'إظهار شارة القسم' : 'Show Section Tag'} />
                <Toggle on={draft?.showDescriptions !== false} onChange={(v) => patch({ showDescriptions: v })} label={isAr ? 'إظهار الأوصاف' : 'Show Descriptions'} />
                <Toggle on={draft?.showActionButtons !== false} onChange={(v) => patch({ showActionButtons: v })} label={isAr ? 'إظهار أزرار الإجراء' : 'Show Action Buttons'} />
                <Toggle on={draft?.showCardLabels !== false} onChange={(v) => patch({ showCardLabels: v })} label={isAr ? 'إظهار تسميات البطاقات' : 'Show Card Labels'} />
                <label className="block space-y-1 text-[11px] font-semibold">
                  <span style={{ color: 'var(--muted)' }}>{isAr ? 'انحناء الحواف' : 'Card Border Radius'}</span>
                  <select className={inputCls} style={inputStyle} value={draft?.cardBorderRadius ?? 16} onChange={(e) => patch({ cardBorderRadius: Number(e.target.value) })}>
                    {[0, 8, 12, 16, 24].map((n) => <option key={n} value={n}>{n} px</option>)}
                  </select>
                </label>
              </section>
            ) : null}

            {tab === 'templates' || tab === 'code' || tab === 'ai' ? (
              <section className={cardCls} style={cardStyle} data-events-panel={tab}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'بانتظار البيانات — غير متصل' : 'Waiting for Data — Not Connected'}</p>
              </section>
            ) : null}
          </>
        }
      />

      <GlobalModal isOpen={!!editing} onClose={() => setEditId(null)} dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'تعديل الفعالية' : 'Edit event'} contentClassName="max-w-xl">
        {editing ? (
          <div className="rounded-2xl border shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="unity-modal-header px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold">{isAr ? 'تعديل الفعالية' : 'Edit Event'}</h3>
              <button type="button" onClick={() => setEditId(null)} aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto text-xs">
              <MediaUploadField label={isAr ? 'صورة الفعالية' : 'Event Image'} value={editing.image} onChange={(url) => patchEvent(editing.id, { image: url })} aspectRatio="banner" initialFolder="events" recommendedSize="1200 × 600 px" />
              <select className={inputCls} style={inputStyle} value={editing.cardSize} onChange={(e) => patchEvent(editing.id, { cardSize: e.target.value as EventMasterclassItem['cardSize'] })}>
                <option value="large">{isAr ? 'بطاقة كبيرة' : 'Large Card'}</option>
                <option value="small">{isAr ? 'بطاقة صغيرة' : 'Small Card'}</option>
              </select>
              <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={100} placeholder={isAr ? 'عنوان الفعالية' : 'Event Title'} value={isAr ? editing.titleAr : editing.titleEn} onChange={(e) => patchEvent(editing.id, isAr ? { titleAr: e.target.value } : { titleEn: e.target.value })} />
              <textarea className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={200} rows={3} placeholder={isAr ? 'الوصف' : 'Description'} value={isAr ? editing.descriptionAr : editing.descriptionEn} onChange={(e) => patchEvent(editing.id, isAr ? { descriptionAr: e.target.value } : { descriptionEn: e.target.value })} />
              <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} maxLength={40} placeholder={isAr ? 'وسم / تسمية' : 'Tag / Label'} value={isAr ? editing.tagAr : editing.tagEn} onChange={(e) => patchEvent(editing.id, isAr ? { tagAr: e.target.value } : { tagEn: e.target.value })} />
              <Toggle on={editing.showButton !== false} onChange={(v) => patchEvent(editing.id, { showButton: v })} label={isAr ? 'إظهار الزر' : 'Show Button'} />
              <input className={inputCls} style={inputStyle} dir={isAr ? 'rtl' : 'ltr'} value={isAr ? editing.buttonAr : editing.buttonEn} onChange={(e) => patchEvent(editing.id, isAr ? { buttonAr: e.target.value } : { buttonEn: e.target.value })} placeholder={isAr ? 'نص الزر' : 'Button text'} />
              <input className={inputCls} style={inputStyle} dir="ltr" value={editing.buttonUrl} onChange={(e) => patchEvent(editing.id, { buttonUrl: e.target.value })} placeholder={isAr ? 'رابط الزر' : 'Button link'} />
              <select className={inputCls} style={inputStyle} value={editing.buttonStyle} onChange={(e) => patchEvent(editing.id, { buttonStyle: e.target.value as EventMasterclassItem['buttonStyle'] })}>
                <option value="primary">{isAr ? 'أساسي' : 'Primary'}</option>
                <option value="secondary">{isAr ? 'ثانوي' : 'Secondary'}</option>
                <option value="outline">{isAr ? 'إطار' : 'Outline'}</option>
                <option value="text-arrow">{isAr ? 'نص مع سهم' : 'Text with Arrow'}</option>
              </select>
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold" onClick={() => setEditId(null)}>{isAr ? 'تم' : 'Done'}</button>
            </div>
          </div>
        ) : null}
      </GlobalModal>
    </>
  );
};
