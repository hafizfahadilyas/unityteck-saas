import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  RotateCcw,
  Megaphone,
  Plus,
  Trash2,
  Gift,
  Truck,
  CreditCard,
  Clock,
  X,
  ChevronRight,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type AnnouncementBarSettings,
} from '../../../themes/settings/themeSettingsStore';

export const AnnouncementBarForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<AnnouncementBarSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.announcementBar;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const toggle = (key: keyof AnnouncementBarSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setVal = <K extends keyof AnnouncementBarSettings>(key: K, val: AnnouncementBarSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.announcementBar = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إعدادات شريط الإعلانات بنجاح' : 'Announcement bar settings saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

  return (
    <form
      onSubmit={handleSave}
      className="rounded-2xl border p-5 sm:p-6 space-y-6"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--card-shadow)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0 unity-icon-box">
            <Megaphone className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Theme Settings · 13
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'شريط الإعلانات الترويجي (Announcement Bar)' : 'Announcement Bar (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'شريط تنبيهات تفاعلي أعلى المتجر مع مؤقت عد تنازلي ورسائل متحركة'
                : 'Create dynamic promotional bars to highlight offers, updates and countdown timers'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          13_Announcement_Bar
        </span>
      </div>

      {/* LIVE ANNOUNCEMENT BAR PREVIEW */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase text-muted block">Live Bar Preview</span>
        <div
          className="rounded-2xl p-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
          style={{
            background:
              settings.bgType === 'gradient'
                ? `linear-gradient(90deg, ${settings.bgColor} 0%, #e11d48 100%)`
                : settings.bgColor,
            color: settings.textColor,
          }}
        >
          <div className="flex items-center gap-2 truncate text-xs font-bold">
            <Gift className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase font-black">
              Limited Time Offer!
            </span>
            <span className="truncate">{settings.messages[0]?.text || 'Get 50% OFF on all products! Use code MKS'}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {/* Live Countdown Timer Boxes */}
            {settings.enableCountdown && (
              <div className="flex items-center gap-1 text-[11px] font-mono font-black">
                <span className="px-1.5 py-0.5 rounded bg-white text-slate-900 shadow-xs">02</span>
                <span>:</span>
                <span className="px-1.5 py-0.5 rounded bg-white text-slate-900 shadow-xs">15</span>
                <span>:</span>
                <span className="px-1.5 py-0.5 rounded bg-white text-slate-900 shadow-xs">30</span>
              </div>
            )}

            {/* Shop Now button */}
            {settings.showButton && (
              <span className="px-3 py-1 rounded-lg bg-white text-slate-950 text-xs font-black shadow-xs cursor-pointer hover:bg-slate-100 transition-colors">
                {settings.buttonText}
              </span>
            )}

            {settings.showCloseButton && (
              <button type="button" className="text-white/80 hover:text-white cursor-pointer p-0.5">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Messages List */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-emerald-600">Announcement Messages</h3>
            <span className="text-[10px] text-muted">{settings.messages.length} messages</span>
          </div>

          <div className="space-y-2">
            {settings.messages.map((m, idx) => (
              <div key={m.id} className="p-2 rounded-xl border flex items-center justify-between gap-2" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold truncate flex-1">{m.text}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (settings.messages.length <= 1) return;
                    setSettings((p) => ({ ...p, messages: p.messages.filter((_, i) => i !== idx) }));
                  }}
                  className="text-rose-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              const newMsg = {
                id: `msg-${Date.now()}`,
                icon: 'Gift',
                text: 'Ramadan Special Offer: Extra 15% OFF today',
                active: true,
              };
              setSettings((p) => ({ ...p, messages: [...p.messages, newMsg] }));
            }}
            className="w-full py-1.5 rounded-xl border border-dashed text-emerald-600 hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>+ Add Message</span>
          </button>
        </div>

        {/* Countdown & Button */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Countdown & Button</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">Enable Countdown Timer</span>
                <span className="text-[10px] text-muted">Show ticking countdown boxes</span>
              </div>
              <button
                type="button"
                onClick={() => toggle('enableCountdown')}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  settings.enableCountdown ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-xs font-bold block">Show Action Button</span>
                <span className="text-[10px] text-muted">Call to action button</span>
              </div>
              <button
                type="button"
                onClick={() => toggle('showButton')}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  settings.showButton ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {settings.showButton && (
              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-1">Button Text</span>
                <input
                  type="text"
                  value={settings.buttonText}
                  onChange={(e) => setVal('buttonText', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Colors & Style */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Background & Colors</h3>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Background Type</span>
              <div className="flex gap-2">
                {(['solid', 'gradient', 'glass'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setVal('bgType', t)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold border cursor-pointer capitalize ${
                      settings.bgType === t ? 'bg-emerald-600 text-white border-emerald-600' : ''
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Bar Color</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={settings.bgColor}
                  onChange={(e) => setVal('bgColor', e.target.value)}
                  className="w-16 px-1.5 py-1 text-xs font-mono rounded border text-center"
                />
                <input
                  type="color"
                  value={settings.bgColor}
                  onChange={(e) => setVal('bgColor', e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-xs font-bold block">Sticky on Scroll</span>
                <span className="text-[10px] text-muted">Fixed at viewport top</span>
              </div>
              <button
                type="button"
                onClick={() => toggle('stickyOnScroll')}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  settings.stickyOnScroll ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => {
            const full = readAllThemeSettings(activeStore.id, activeStore);
            setSettings(full.announcementBar);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved settings', 'info');
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'استرجاع' : 'Reset'}</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer transition-all hover:opacity-90 unity-btn-primary"
        >
          {savedFlash ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ شريط الإعلانات' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
