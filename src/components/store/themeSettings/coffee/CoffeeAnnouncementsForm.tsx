import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { AnnouncementMessage } from '../../../../themes/settings/themeSettingsStore';
import { duplicateAt, useCoffeeDraft, moveItem } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-[#2563EB]';
const cardCls = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3';

type DisplayMode = 'rotate' | 'stacked' | 'single';

function msgText(m: AnnouncementMessage, isAr: boolean): string {
  if (isAr) return (m.textAr || m.text || '').trim();
  return (m.textEn || m.text || '').trim();
}

function blankMessage(): AnnouncementMessage {
  return {
    id: `ann-${Date.now()}`,
    icon: 'Megaphone',
    text: '',
    textEn: '',
    textAr: '',
    textColor: '#FFFFFF',
    bgColor: '#173B35',
    active: true,
  };
}

function PreviewBar({
  messages,
  mode,
  isAr,
  device,
}: {
  messages: AnnouncementMessage[];
  mode: DisplayMode;
  isAr: boolean;
  device: PreviewDevice;
}) {
  const eligible = messages.filter((m) => m.active && msgText(m, isAr));
  if (eligible.length === 0) {
    return (
      <div className="p-6 text-center text-[11px] text-slate-400">
        {isAr ? 'لا إعلانات مؤهلة — الشريط مخفي في المتجر' : 'No eligible announcements — bar hidden on storefront'}
      </div>
    );
  }
  const pad = device === 'mobile' ? 'px-3 py-2 text-[11px]' : 'px-4 py-2.5 text-xs';
  if (mode === 'stacked') {
    return (
      <div className="space-y-1">
        {eligible.map((m) => (
          <div
            key={m.id}
            className={`${pad} font-bold text-center`}
            style={{ background: m.bgColor || '#173B35', color: m.textColor || '#FFFFFF' }}
          >
            {msgText(m, isAr)}
          </div>
        ))}
      </div>
    );
  }
  const first = eligible[0];
  return (
    <div
      className={`${pad} font-bold text-center`}
      style={{ background: first.bgColor || '#173B35', color: first.textColor || '#FFFFFF' }}
    >
      {msgText(first, isAr)}
    </div>
  );
}

export const CoffeeAnnouncementsForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('announcementBar');
  const messages = draft?.messages || [];
  const mode: DisplayMode =
    draft?.displayMode ||
    (draft?.animationType === 'marquee' || draft?.animationType === 'fade' ? 'rotate' : draft?.animationType === 'rotate' ? 'rotate' : 'rotate');

  const [newTextEn, setNewTextEn] = useState('');
  const [newTextAr, setNewTextAr] = useState('');
  const [newTextColor, setNewTextColor] = useState('#FFFFFF');
  const [newBgColor, setNewBgColor] = useState('#173B35');

  const eligibleCount = useMemo(
    () => messages.filter((m) => m.active && (m.textEn || m.textAr || m.text)).length,
    [messages],
  );

  const setMode = (next: DisplayMode) => {
    setDraft({
      ...draft,
      displayMode: next,
      animationType: next === 'rotate' ? 'marquee' : next === 'stacked' ? 'fade' : 'rotate',
      enabled: true,
    });
  };

  const patchMsg = (id: string, p: Partial<AnnouncementMessage>) => {
    setDraft({
      ...draft,
      messages: messages.map((m) => {
        if (m.id !== id) return m;
        const next = { ...m, ...p };
        if (p.textEn != null || p.textAr != null) {
          next.text = (p.textEn ?? next.textEn ?? next.text) || '';
        }
        return next;
      }),
    });
  };

  const addMessage = () => {
    const en = newTextEn.trim();
    const ar = newTextAr.trim();
    if (!en && !ar) return;
    const row: AnnouncementMessage = {
      ...blankMessage(),
      textEn: en,
      textAr: ar,
      text: en || ar,
      textColor: newTextColor || '#FFFFFF',
      bgColor: newBgColor || '#173B35',
    };
    setDraft({ ...draft, enabled: true, messages: [...messages, row] });
    setNewTextEn('');
    setNewTextAr('');
  };

  return (
    <CoffeeWordSettingsShell
      isAr={isAr}
      onBack={onBack}
      embedded={embedded}
      titleEn="Promotional Announcements"
      titleAr="الإعلانات الترويجية"
      subtitleEn={`${eligibleCount} announcements | Manage each announcement independently`}
      subtitleAr={`${eligibleCount} إعلانات | إدارة كل إعلان بشكل مستقل`}
      onSave={() => save()}
      saving={saving}
      savedFlash={savedFlash}
      preview={(device) => <PreviewBar messages={messages} mode={mode} isAr={isAr} device={device} />}
      settings={
        <>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 w-fit">
            {isAr ? 'قابل للتخصيص' : 'Customizable'}
          </div>

          {messages.map((m, index) => (
            <section key={m.id} className={cardCls}>
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <button
                    type="button"
                    onClick={() => patchMsg(m.id, { active: !m.active })}
                    className={`w-11 h-6 rounded-full p-0.5 ${m.active ? 'bg-emerald-600' : 'bg-slate-300'}`}
                    aria-label={isAr ? 'تفعيل' : 'Active'}
                  >
                    <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${m.active ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
                  </button>
                  <span>{isAr ? 'نشط' : 'Active'}</span>
                </label>
                <span className="text-[11px] font-bold text-slate-500">
                  {isAr ? `إعلان${index + 1}` : `Announcement ${index + 1}`}
                </span>
              </div>

              <div
                className="rounded-lg px-3 py-2 text-xs font-bold text-center"
                style={{ background: m.bgColor || '#173B35', color: m.textColor || '#FFFFFF' }}
              >
                {msgText(m, isAr) || (isAr ? 'معاينة فارغة' : 'Empty preview')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                  <span>{isAr ? 'نص الإعلان (إنجليزي)' : 'Announcement text (English)'}</span>
                  <input
                    className={inputCls}
                    dir="ltr"
                    value={m.textEn || m.text || ''}
                    onChange={(e) => patchMsg(m.id, { textEn: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                  <span>{isAr ? 'نص الإعلان (عربي)' : 'Announcement text (Arabic)'}</span>
                  <input
                    className={inputCls}
                    dir="rtl"
                    value={m.textAr || ''}
                    onChange={(e) => patchMsg(m.id, { textAr: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                  <span>{isAr ? 'لون النص' : 'Text color'}</span>
                  <div className="flex gap-2">
                    <input type="color" value={m.textColor || '#FFFFFF'} onChange={(e) => patchMsg(m.id, { textColor: e.target.value })} className="w-10 h-9 rounded border border-slate-200" />
                    <input className={inputCls} dir="ltr" value={m.textColor || '#FFFFFF'} onChange={(e) => patchMsg(m.id, { textColor: e.target.value })} />
                  </div>
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                  <span>{isAr ? 'لون الخلفية' : 'Background color'}</span>
                  <div className="flex gap-2">
                    <input type="color" value={m.bgColor || '#173B35'} onChange={(e) => patchMsg(m.id, { bgColor: e.target.value })} className="w-10 h-9 rounded border border-slate-200" />
                    <input className={inputCls} dir="ltr" value={m.bgColor || '#173B35'} onChange={(e) => patchMsg(m.id, { bgColor: e.target.value })} />
                  </div>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold"
                  onClick={() => patchMsg(m.id, { active: m.active === false })}
                >
                  {m.active === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {isAr ? (m.active === false ? 'إظهار' : 'إخفاء') : m.active === false ? 'Show' : 'Hide'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold"
                  onClick={() => setDraft({ ...draft, messages: duplicateAt(messages, index, 'ann') })}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {isAr ? 'نسخ' : 'Duplicate'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-bold"
                  onClick={() => setDraft({ ...draft, messages: messages.filter((x) => x.id !== m.id) })}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isAr ? 'حذف' : 'Delete'}
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold disabled:opacity-40"
                  onClick={() => setDraft({ ...draft, messages: moveItem(messages, index, -1) })}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  {isAr ? 'أعلى' : 'Move up'}
                </button>
                <button
                  type="button"
                  disabled={index === messages.length - 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold disabled:opacity-40"
                  onClick={() => setDraft({ ...draft, messages: moveItem(messages, index, 1) })}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  {isAr ? 'أسفل' : 'Move down'}
                </button>
              </div>
            </section>
          ))}

          <section className={cardCls}>
            <h3 className="text-sm font-bold">{isAr ? 'إضافة إعلان جديد' : 'Add New Announcement'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                className={inputCls}
                dir="ltr"
                placeholder={isAr ? 'مثال إنجليزي' : 'Example: Free shipping on orders over SAR 200'}
                value={newTextEn}
                onChange={(e) => setNewTextEn(e.target.value)}
              />
              <input
                className={inputCls}
                dir="rtl"
                placeholder={isAr ? 'مثال: شحن مجاني للطلبات فوق 200 ريال' : 'Arabic text'}
                value={newTextAr}
                onChange={(e) => setNewTextAr(e.target.value)}
              />
              <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                <span>{isAr ? 'لون النص' : 'Text color'}</span>
                <div className="flex gap-2">
                  <input type="color" value={newTextColor} onChange={(e) => setNewTextColor(e.target.value)} className="w-10 h-9 rounded border" />
                  <input className={inputCls} dir="ltr" value={newTextColor} onChange={(e) => setNewTextColor(e.target.value)} />
                </div>
              </label>
              <label className="space-y-1 text-[11px] font-semibold text-slate-600">
                <span>{isAr ? 'لون الخلفية' : 'Background color'}</span>
                <div className="flex gap-2">
                  <input type="color" value={newBgColor} onChange={(e) => setNewBgColor(e.target.value)} className="w-10 h-9 rounded border" />
                  <input className={inputCls} dir="ltr" value={newBgColor} onChange={(e) => setNewBgColor(e.target.value)} />
                </div>
              </label>
            </div>
            <button
              type="button"
              onClick={addMessage}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              + {isAr ? 'إضافة إعلان' : 'Add Announcement'}
            </button>
          </section>

          <section className={cardCls}>
            <h3 className="text-sm font-bold">{isAr ? 'وضع عرض الإعلانات' : 'Announcement Display Mode'}</h3>
            {(
              [
                { id: 'rotate' as const, en: 'Automatically rotate between active announcements', ar: 'تدوير تلقائي بين الإعلانات النشطة' },
                { id: 'stacked' as const, en: 'Display all announcements stacked', ar: 'عرض كل الإعلانات متراكبة' },
                { id: 'single' as const, en: 'Display only one announcement by order', ar: 'عرض إعلان واحد حسب الترتيب' },
              ] as const
            ).map((opt) => (
              <label key={opt.id} className="flex items-start gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input type="radio" name="ann-display-mode" checked={mode === opt.id} onChange={() => setMode(opt.id)} className="mt-0.5 accent-emerald-700" />
                <span>{isAr ? opt.ar : opt.en}</span>
              </label>
            ))}
          </section>
        </>
      }
    />
  );
};
