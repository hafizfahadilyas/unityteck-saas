import React, { useState } from 'react';
import {
  Save,
  Check,
  RotateCcw,
  Percent,
  Clock,
  ShieldCheck,
  Truck,
  Flame,
  Upload,
  ChevronRight,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type SpecialOfferCountdownSettings,
} from '../../../themes/settings/themeSettingsStore';

export const SpecialOfferCountdownForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<SpecialOfferCountdownSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.specialOffer;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const setVal = <K extends keyof SpecialOfferCountdownSettings>(key: K, val: SpecialOfferCountdownSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.specialOffer = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إعدادات العرض الخاص والعد التنازلي' : 'Special offer settings saved', 'success');
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
            <Percent className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              {isAr ? 'إعدادات الثيم · 17' : 'Theme Settings · 17'}
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'العرض الخاص مع العد التنازلي (Special Offer Countdown)' : 'Special Offer with Countdown (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'بانر تسويقي متكامل مع مؤقت عد تنازلي حي لرفع وتيرة الشراء والتحويل'
                : 'Create attractive promotional sections with countdown timers to increase urgency and boost sales'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          17_Special_Offer_Countdown
        </span>
      </div>

      {/* LIVE HERO CARD WITH COUNTDOWN TIMER */}
      <div className="relative rounded-3xl overflow-hidden border shadow-lg p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8"
        style={{ borderColor: 'var(--border)', background: settings.bgColor }}>
        <img
          src={settings.bgImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter brightness-95 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent dark:from-slate-950/95 dark:via-slate-950/80" />

        <div className="relative z-10 max-w-lg space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm">
            <Flame className="w-3.5 h-3.5" />
            <span>{settings.badgeText}</span>
          </span>

          <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            {settings.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {settings.description}
          </p>

          {/* Countdown Boxes */}
          <div className="flex items-center gap-2 pt-1 font-mono text-center">
            <div className="bg-white dark:bg-slate-900 border rounded-2xl p-2.5 min-w-[56px] shadow-sm">
              <span className="text-xl sm:text-2xl font-black block text-slate-900 dark:text-white">05</span>
              <span className="text-[9px] uppercase tracking-wider text-muted font-sans font-bold">Days</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border rounded-2xl p-2.5 min-w-[56px] shadow-sm">
              <span className="text-xl sm:text-2xl font-black block text-slate-900 dark:text-white">12</span>
              <span className="text-[9px] uppercase tracking-wider text-muted font-sans font-bold">Hours</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border rounded-2xl p-2.5 min-w-[56px] shadow-sm">
              <span className="text-xl sm:text-2xl font-black block text-slate-900 dark:text-white">34</span>
              <span className="text-[9px] uppercase tracking-wider text-muted font-sans font-bold">Mins</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border rounded-2xl p-2.5 min-w-[56px] shadow-sm">
              <span className="text-xl sm:text-2xl font-black block text-slate-900 dark:text-white">21</span>
              <span className="text-[9px] uppercase tracking-wider text-muted font-sans font-bold">Secs</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-950 text-white font-black text-xs shadow-lg cursor-pointer hover:bg-slate-800 transition-all hover:scale-105">
              <span>{settings.buttonText}</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Product Image Right */}
        {settings.showProductImage && (
          <div className="relative z-10 w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border shadow-2xl shrink-0 hidden md:block">
            <img src={settings.productImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Content & Badge</h3>
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Badge Text</span>
              <input
                type="text"
                value={settings.badgeText}
                onChange={(e) => setVal('badgeText', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Title</span>
              <input
                type="text"
                value={settings.title}
                onChange={(e) => setVal('title', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Description</span>
              <input
                type="text"
                value={settings.description}
                onChange={(e) => setVal('description', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Button & Countdown</h3>
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Button Text</span>
              <input
                type="text"
                value={settings.buttonText}
                onChange={(e) => setVal('buttonText', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Countdown End Date</span>
              <input
                type="text"
                value={settings.countdownEndDate}
                onChange={(e) => setVal('countdownEndDate', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
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
            setSettings(full.specialOffer);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved offer', 'info');
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ العرض والعد التنازلي' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
