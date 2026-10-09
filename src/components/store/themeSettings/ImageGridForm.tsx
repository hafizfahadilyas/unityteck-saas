import React, { useState } from 'react';
import { Save, Check, RotateCcw, Grid, Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type ImageGridSettings,
} from '../../../themes/settings/themeSettingsStore';

const LAYOUT_LABELS: Record<string, { en: string; ar: string }> = {
  bento: { en: 'Bento', ar: 'بينتو' },
  classic: { en: 'Classic', ar: 'كلاسيكي' },
  masonry: { en: 'Masonry', ar: 'متداخل (ماسونري)' },
  magazine: { en: 'Magazine', ar: 'مجلة' },
};

const SHAPE_LABELS: Record<string, { en: string; ar: string }> = {
  square: { en: 'Square', ar: 'مربع' },
  rectangle: { en: 'Rectangle', ar: 'مستطيل' },
  portrait: { en: 'Portrait', ar: 'طولي' },
  circle: { en: 'Circle', ar: 'دائري' },
  rounded: { en: 'Rounded', ar: 'حواف دائرية' },
  hexagon: { en: 'Hexagon', ar: 'سداسي' },
};

const HOVER_LABELS: Record<string, { en: string; ar: string }> = {
  none: { en: 'None', ar: 'بدون' },
  zoom: { en: 'Zoom', ar: 'تكبير' },
  fade: { en: 'Fade', ar: 'تلاشي' },
  'slide-up': { en: 'Slide up', ar: 'انزلاق للأعلى' },
};

export const ImageGridForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<ImageGridSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.imageGrid;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const setVal = <K extends keyof ImageGridSettings>(key: K, val: ImageGridSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.imageGrid = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ شبكة الصور البصرية' : 'Image grid settings saved', 'success');
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
            <Grid className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Theme Settings · 09
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'شبكة الصور البصرية (Image Grid / Bento)' : 'Image Grid (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'عرض الصور والحملات الإعلانية في تخطيط بينتو (Bento Grid) عصري وجذاب'
                : 'Display your images and campaigns in a creative and flexible bento layout'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          09_Image_Grid
        </span>
      </div>

      {/* LIVE BENTO GRID PREVIEW */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 min-h-[300px]">
          {settings.items.map((item, idx) => (
            <div
              key={item.id}
              className={`group relative rounded-2xl overflow-hidden border shadow-sm cursor-pointer transition-all duration-300 min-h-[160px] flex flex-col justify-end p-4 ${
                idx === 0 ? 'sm:col-span-1 sm:row-span-2 min-h-[340px]' : idx === 1 ? 'sm:col-span-2 min-h-[160px]' : 'col-span-1'
              }`}
              style={{ borderColor: 'var(--border)' }}
            >
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="relative z-10 text-white flex items-end justify-between">
                <div>
                  <h4 className="text-sm font-black">{item.title}</h4>
                  <p className="text-[11px] text-white/80">{item.subtitle}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Layout Style</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(['bento', 'classic', 'masonry', 'magazine'] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setVal('layoutStyle', style)}
                className={`py-2 rounded-xl border font-bold capitalize cursor-pointer ${
                  settings.layoutStyle === style ? 'bg-emerald-600 text-white border-emerald-600' : ''
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Shapes</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['square', 'rectangle', 'portrait', 'circle', 'rounded', 'hexagon'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setVal('shape', s)}
                className={`py-2 rounded-xl border font-bold capitalize cursor-pointer ${
                  settings.shape === s ? 'bg-emerald-600 text-white border-emerald-600' : ''
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Hover Effects</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(['none', 'zoom', 'fade', 'slide-up'] as const).map((eff) => (
              <button
                key={eff}
                type="button"
                onClick={() => setVal('hoverEffect', eff)}
                className={`py-2 rounded-xl border font-bold capitalize cursor-pointer ${
                  settings.hoverEffect === eff ? 'bg-emerald-600 text-white border-emerald-600' : ''
                }`}
              >
                {eff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => {
            const full = readAllThemeSettings(activeStore.id, activeStore);
            setSettings(full.imageGrid);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved image grid', 'info');
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ الشبكة' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
