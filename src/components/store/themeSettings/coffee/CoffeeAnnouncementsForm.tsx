import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { AnnouncementMessage } from '../../../../themes/settings/themeSettingsStore';
import { duplicateAt, useCoffeeDraft, moveItem } from './coffeeFormKit';
import { CoffeeWordSettingsShell, type CoffeeFormChromeProps, type PreviewDevice } from './CoffeeWordSettingsShell';

const inputCls = 'w-full px-3 py-2 rounded-lg border bg-white text-xs outline-none focus:border-[var(--accent)]';
const cardStyle: React.CSSProperties = {
  borderColor: 'var(--border)',
  background: 'var(--surface)',
};
const cardCls = 'rounded-2xl border p-4 shadow-sm space-y-3';

type DisplayMode = 'rotate' | 'stacked' | 'single';
type AnnTab = 'content' | 'style' | 'layout';

const ANN_TABS: { id: AnnTab; en: string; ar: string }[] = [
  { id: 'content', en: 'Content', ar: 'المحتوى' },
  { id: 'style', en: 'Style', ar: 'المظهر' },
  { id: 'layout', en: 'Layout', ar: 'التخطيط' },
];

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
  contentWidth,
  barHeight,
  heightPx,
}: {
  messages: AnnouncementMessage[];
  mode: DisplayMode;
  isAr: boolean;
  device: PreviewDevice;
  contentWidth?: 'full' | 'boxed';
  barHeight?: 'auto' | 'compact' | 'tall';
  heightPx?: number;
}) {
  const eligible = messages.filter((m) => m.active && msgText(m, isAr));
  if (eligible.length === 0) {
    return (
      <div className="p-6 text-center text-[11px]" style={{ color: 'var(--muted)' }} data-ann-preview="empty">
        {isAr ? 'لا إعلانات مؤهلة — الشريط مخفي في المتجر' : 'No eligible announcements — bar hidden on storefront'}
      </div>
    );
  }
  const pad =
    barHeight === 'compact' || device === 'mobile'
      ? 'px-3 py-1.5 text-[11px]'
      : barHeight === 'tall'
        ? 'px-4 py-3.5 text-sm'
        : 'px-4 py-2.5 text-xs';
  const minH = typeof heightPx === 'number' && heightPx > 0 ? `${heightPx}px` : undefined;
  const widthCls = contentWidth === 'boxed' ? 'max-w-3xl mx-auto w-full' : 'w-full';

  const renderOne = (m: AnnouncementMessage) => (
    <div
      key={m.id}
      className={`${pad} font-bold text-center ${widthCls}`}
      style={{ background: m.bgColor || '#173B35', color: m.textColor || '#FFFFFF', minHeight: minH }}
      data-ann-preview-msg={m.id}
    >
      {msgText(m, isAr)}
    </div>
  );

  if (mode === 'stacked') {
    return <div className="space-y-1" data-ann-preview="stacked">{eligible.map(renderOne)}</div>;
  }
  return <div data-ann-preview={mode}>{renderOne(eligible[0])}</div>;
}

function HolstToggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs font-semibold" style={{ color: 'var(--text)' }}>
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className="w-11 h-6 rounded-full p-0.5"
        style={{ background: on ? 'var(--portal-cta)' : 'var(--border)' }}
        aria-pressed={on}
      >
        <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

export const CoffeeAnnouncementsForm: React.FC<CoffeeFormChromeProps> = ({ onBack, embedded }) => {
  const { draft, setDraft, save, saving, savedFlash, isAr } = useCoffeeDraft('announcementBar');
  const messages = draft?.messages || [];
  const mode: DisplayMode =
    draft?.displayMode ||
    (draft?.animationType === 'marquee' || draft?.animationType === 'fade' ? 'rotate' : draft?.animationType === 'rotate' ? 'rotate' : 'rotate');

  const [tab, setTab] = useState<AnnTab>('content');
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
    setDraft({ ...draft, messages: [...messages, row] });
    setNewTextEn('');
    setNewTextAr('');
  };

  const chipActive = (on: boolean): React.CSSProperties =>
    on
      ? { background: 'var(--portal-cta)', color: '#fff', borderColor: 'var(--portal-cta)' }
      : { background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border)' };

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
      preview={(device) => (
        <PreviewBar
          messages={messages}
          mode={mode}
          isAr={isAr}
          device={device}
          contentWidth={draft?.contentWidth}
          barHeight={draft?.barHeight}
          heightPx={draft?.heightPx}
        />
      )}
      settings={
        <>
          <div className="flex flex-wrap gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--border)' }} role="tablist" data-ann-controls="tabs">
            {ANN_TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  data-ann-tab={t.id}
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
              <section className={cardCls} style={cardStyle} data-ann-controls="enable" data-ann-panel="enable">
                <HolstToggle
                  on={draft?.enabled !== false}
                  onChange={(v) => setDraft({ ...draft, enabled: v })}
                  label={isAr ? 'تفعيل شريط الإعلانات' : 'Enable Announcement Bar'}
                />
                <HolstToggle
                  on={Boolean(draft?.stickyOnScroll)}
                  onChange={(v) => setDraft({ ...draft, stickyOnScroll: v })}
                  label={isAr ? 'تثبيت عند التمرير' : 'Sticky on scroll'}
                />
                <HolstToggle
                  on={Boolean(draft?.showCloseButton)}
                  onChange={(v) => setDraft({ ...draft, showCloseButton: v })}
                  label={isAr ? 'زر إغلاق' : 'Show close button'}
                />
              </section>

              {messages.map((m, index) => (
                <section key={m.id} className={cardCls} style={cardStyle} data-ann-panel="message">
                  <div className="flex items-center justify-between gap-2">
                    <HolstToggle on={m.active !== false} onChange={(v) => patchMsg(m.id, { active: v })} label={isAr ? 'نشط' : 'Active'} />
                    <span className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
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
                    <label className="space-y-1 text-[11px] font-semibold md:col-span-2" style={{ color: 'var(--muted)' }}>
                      <span>{isAr ? 'نص الإعلان' : 'Announcement text'}</span>
                      <input
                        className={inputCls}
                        dir="auto"
                        placeholder={isAr ? 'اكتب النص بأي لغة' : 'Type in any language'}
                        value={m.textEn || m.textAr || m.text || ''}
                        onChange={(e) =>
                          patchMsg(m.id, { textEn: e.target.value, textAr: e.target.value, text: e.target.value })
                        }
                      />
                    </label>
                    <label className="space-y-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      <span>{isAr ? 'لون النص' : 'Text color'}</span>
                      <div className="flex gap-2">
                        <input type="color" value={m.textColor || '#FFFFFF'} onChange={(e) => patchMsg(m.id, { textColor: e.target.value })} className="w-10 h-9 rounded border" style={{ borderColor: 'var(--border)' }} />
                        <input className={inputCls} dir="ltr" value={m.textColor || '#FFFFFF'} onChange={(e) => patchMsg(m.id, { textColor: e.target.value })} />
                      </div>
                    </label>
                    <label className="space-y-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      <span>{isAr ? 'لون الخلفية' : 'Background color'}</span>
                      <div className="flex gap-2">
                        <input type="color" value={m.bgColor || '#173B35'} onChange={(e) => patchMsg(m.id, { bgColor: e.target.value })} className="w-10 h-9 rounded border" style={{ borderColor: 'var(--border)' }} />
                        <input className={inputCls} dir="ltr" value={m.bgColor || '#173B35'} onChange={(e) => patchMsg(m.id, { bgColor: e.target.value })} />
                      </div>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold" style={{ borderColor: 'var(--border)' }} onClick={() => patchMsg(m.id, { active: m.active === false })}>
                      {m.active === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {isAr ? (m.active === false ? 'إظهار' : 'إخفاء') : m.active === false ? 'Show' : 'Hide'}
                    </button>
                    <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold" style={{ borderColor: 'var(--border)' }} onClick={() => setDraft({ ...draft, messages: duplicateAt(messages, index, 'ann') })}>
                      <Copy className="w-3.5 h-3.5" />
                      {isAr ? 'نسخ' : 'Duplicate'}
                    </button>
                    <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-bold" onClick={() => setDraft({ ...draft, messages: messages.filter((x) => x.id !== m.id) })}>
                      <Trash2 className="w-3.5 h-3.5" />
                      {isAr ? 'حذف' : 'Delete'}
                    </button>
                    <button type="button" disabled={index === 0} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold disabled:opacity-40" style={{ borderColor: 'var(--border)' }} onClick={() => setDraft({ ...draft, messages: moveItem(messages, index, -1) })}>
                      <ChevronUp className="w-3.5 h-3.5" />
                      {isAr ? 'أعلى' : 'Move up'}
                    </button>
                    <button type="button" disabled={index === messages.length - 1} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold disabled:opacity-40" style={{ borderColor: 'var(--border)' }} onClick={() => setDraft({ ...draft, messages: moveItem(messages, index, 1) })}>
                      <ChevronDown className="w-3.5 h-3.5" />
                      {isAr ? 'أسفل' : 'Move down'}
                    </button>
                  </div>
                </section>
              ))}

              <section className={cardCls} style={cardStyle} data-ann-panel="add">
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{isAr ? 'إضافة إعلان جديد' : 'Add New Announcement'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label className="space-y-1 text-[11px] font-semibold md:col-span-2" style={{ color: 'var(--muted)' }}>
                    <span>{isAr ? 'نص الإعلان' : 'Announcement text'}</span>
                    <input
                      className={inputCls}
                      dir="auto"
                      placeholder={isAr ? 'مثال: شحن مجاني للطلبات فوق 200 ريال' : 'Example: Free shipping on orders over SAR 200'}
                      value={newTextEn || newTextAr}
                      onChange={(e) => {
                        setNewTextEn(e.target.value);
                        setNewTextAr(e.target.value);
                      }}
                    />
                  </label>
                  <label className="space-y-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                    <span>{isAr ? 'لون النص' : 'Text color'}</span>
                    <div className="flex gap-2">
                      <input type="color" value={newTextColor} onChange={(e) => setNewTextColor(e.target.value)} className="w-10 h-9 rounded border" style={{ borderColor: 'var(--border)' }} />
                      <input className={inputCls} dir="ltr" value={newTextColor} onChange={(e) => setNewTextColor(e.target.value)} />
                    </div>
                  </label>
                  <label className="space-y-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                    <span>{isAr ? 'لون الخلفية' : 'Background color'}</span>
                    <div className="flex gap-2">
                      <input type="color" value={newBgColor} onChange={(e) => setNewBgColor(e.target.value)} className="w-10 h-9 rounded border" style={{ borderColor: 'var(--border)' }} />
                      <input className={inputCls} dir="ltr" value={newBgColor} onChange={(e) => setNewBgColor(e.target.value)} />
                    </div>
                  </label>
                </div>
                <button type="button" onClick={addMessage} className="unity-btn-primary w-full py-2.5 rounded-xl text-xs font-bold">
                  + {isAr ? 'إضافة إعلان' : 'Add Announcement'}
                </button>
              </section>

              <section className={cardCls} style={cardStyle} data-ann-panel="mode">
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{isAr ? 'وضع عرض الإعلانات' : 'Announcement Display Mode'}</h3>
                {(
                  [
                    { id: 'rotate' as const, en: 'Automatically rotate between active announcements', ar: 'تدوير تلقائي بين الإعلانات النشطة' },
                    { id: 'stacked' as const, en: 'Display all announcements stacked', ar: 'عرض كل الإعلانات متراكبة' },
                    { id: 'single' as const, en: 'Display only one announcement by order', ar: 'عرض إعلان واحد حسب الترتيب' },
                  ] as const
                ).map((opt) => (
                  <label key={opt.id} className="flex items-start gap-2 text-xs font-semibold cursor-pointer" style={{ color: 'var(--text)' }}>
                    <input type="radio" name="ann-display-mode" checked={mode === opt.id} onChange={() => setMode(opt.id)} className="mt-0.5 accent-[var(--portal-cta)]" />
                    <span>{isAr ? opt.ar : opt.en}</span>
                  </label>
                ))}
              </section>

              <section className={cardCls} style={cardStyle} data-ann-controls="action-display" data-ann-panel="action">
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{isAr ? 'زر الإجراء' : 'Action Button'}</h3>
                <HolstToggle
                  on={Boolean(draft?.showButton)}
                  onChange={(v) => setDraft({ ...draft, showButton: v })}
                  label={isAr ? 'إظهار زر الإجراء' : 'Show Action Button'}
                />
                {draft?.showButton ? (
                  <div className="grid grid-cols-1 gap-2">
                    <label className="space-y-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      <span>{isAr ? 'نص الزر' : 'Button text'}</span>
                      <input
                        className={inputCls}
                        dir="auto"
                        value={draft?.buttonTextEn || draft?.buttonTextAr || draft?.buttonText || ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            buttonTextEn: e.target.value,
                            buttonTextAr: e.target.value,
                            buttonText: e.target.value,
                          })
                        }
                        placeholder={isAr ? 'تسوق الآن' : 'Shop Now'}
                      />
                    </label>
                    <label className="space-y-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                      <span>{isAr ? 'رابط الزر' : 'Button link (URL)'}</span>
                      <input className={inputCls} dir="ltr" value={draft?.buttonLink || ''} onChange={(e) => setDraft({ ...draft, buttonLink: e.target.value })} placeholder="/shop" />
                    </label>
                  </div>
                ) : null}
              </section>
            </>
          ) : null}

          {tab === 'style' ? (
            <section className={cardCls} style={cardStyle} data-ann-panel="style">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{isAr ? 'ارتفاع الشريط' : 'Banner height'}</h3>
              <div className="grid grid-cols-3 gap-2" data-ann-controls="bar-height">
                {(
                  [
                    { id: 'compact' as const, ar: 'مدمج', en: 'Compact' },
                    { id: 'auto' as const, ar: 'تلقائي', en: 'Auto' },
                    { id: 'tall' as const, ar: 'مرتفع', en: 'Tall' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, barHeight: opt.id, heightPx: undefined })}
                    className="py-2 rounded-xl text-[11px] font-bold border transition-colors"
                    style={chipActive((draft?.barHeight || 'auto') === opt.id && !draft?.heightPx)}
                  >
                    {isAr ? opt.ar : opt.en}
                  </button>
                ))}
              </div>
              <label className="space-y-1 text-[11px] font-semibold block" style={{ color: 'var(--muted)' }}>
                <span>{isAr ? 'ارتفاع مخصص (بكسل)' : 'Custom height (px)'}</span>
                <input
                  type="number"
                  min={24}
                  max={120}
                  className={inputCls}
                  dir="ltr"
                  value={draft?.heightPx ?? ''}
                  placeholder="40"
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setDraft({
                      ...draft,
                      heightPx: Number.isFinite(n) && n > 0 ? Math.min(120, Math.max(24, n)) : undefined,
                    });
                  }}
                />
              </label>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                {isAr ? 'ألوان النص والخلفية تُدار لكل إعلان في تبويب المحتوى.' : 'Per-message text and background colors are edited in the Content tab.'}
              </p>
            </section>
          ) : null}

          {tab === 'layout' ? (
            <section className={cardCls} style={cardStyle} data-ann-panel="layout" data-ann-controls="action-display">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{isAr ? 'وضع العرض' : 'Display width'}</h3>
              <div className="grid grid-cols-2 gap-2" data-ann-controls="content-width">
                {(
                  [
                    { id: 'full' as const, ar: 'عرض كامل', en: 'Full Width' },
                    { id: 'boxed' as const, ar: 'محدد داخل حاوية', en: 'Boxed' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, contentWidth: opt.id })}
                    className="py-2 rounded-xl text-[11px] font-bold border transition-colors"
                    style={chipActive((draft?.contentWidth || 'full') === opt.id)}
                  >
                    {isAr ? opt.ar : opt.en}
                  </button>
                ))}
              </div>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'معاينة سطح المكتب والجهاز اللوحي والجوال على اليمين — الشريط الفارغ يبقى مخفياً في المتجر.'
                  : 'Desktop / tablet / mobile previews are on the right — empty bar stays hidden on the storefront.'}
              </p>
            </section>
          ) : null}
        </>
      }
    />
  );
};
