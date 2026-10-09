import React, { useState } from 'react';
import {
  Save,
  Check,
  RotateCcw,
  BarChart2,
  Package,
  Users,
  ShoppingCart,
  Store,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type StoreStatisticsSettings,
} from '../../../themes/settings/themeSettingsStore';

export const StoreStatisticsForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<StoreStatisticsSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.statistics;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const setVal = <K extends keyof StoreStatisticsSettings>(key: K, val: StoreStatisticsSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.statistics = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إحصائيات المتجر وإثبات الثقة' : 'Store statistics saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Package': return <Package className="w-5 h-5 text-emerald-600" />;
      case 'Users': return <Users className="w-5 h-5 text-teal-600" />;
      case 'ShoppingCart': return <ShoppingCart className="w-5 h-5 text-amber-600" />;
      default: return <Store className="w-5 h-5 text-blue-600" />;
    }
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
            <BarChart2 className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                Theme Settings · 18
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                Pro
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'إحصائيات وإنجازات المتجر (Store Statistics)' : 'Store Statistics (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'عرض إنجازات وأرقام المتجر لبناء الثقة بأرقام متحركة وتصاميم عصرية'
                : 'Display your store achievements and build customer trust with animated numbers'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          18_Store_Statistics
        </span>
      </div>

      {/* LIVE PREVIEW OF 5 STATS LAYOUT STYLES */}
      <div className="rounded-2xl border p-6 space-y-6" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-black">{settings.mainTitle}</h3>
          <p className="text-xs text-muted">{settings.subtitle}</p>
        </div>

        {/* Selected Layout Style Preview */}
        {settings.layoutStyle === 'stats-bar' ? (
          <div className="rounded-2xl bg-[#032320] text-white p-6 shadow-md">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center divide-x divide-emerald-900/60">
              {settings.items.map((stat) => (
                <div key={stat.id} className="space-y-1 px-2">
                  <span className="text-2xl sm:text-3xl font-black block text-emerald-400 font-mono">{stat.number}</span>
                  <span className="text-xs font-bold block">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : settings.layoutStyle === 'floating' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {settings.items.map((stat) => (
              <div key={stat.id} className="space-y-2 p-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  {getIcon(stat.icon)}
                </div>
                <span className="text-2xl font-black block font-mono">{stat.number}</span>
                <span className="text-xs text-muted block font-semibold">{stat.label}</span>
              </div>
            ))}
          </div>
        ) : settings.layoutStyle === 'card' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {settings.items.map((stat) => (
              <div key={stat.id} className="rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-xs text-center space-y-2" style={{ borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto">
                  {getIcon(stat.icon)}
                </div>
                <span className="text-2xl font-black block font-mono text-emerald-600">{stat.number}</span>
                <h4 className="text-xs font-bold">{stat.label}</h4>
                <p className="text-[10px] text-muted">{stat.description}</p>
              </div>
            ))}
          </div>
        ) : (
          // Glass Style (Default)
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {settings.items.map((stat) => (
              <div key={stat.id} className="rounded-2xl border border-white/40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 shadow-sm text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                  {getIcon(stat.icon)}
                </div>
                <span className="text-2xl font-black block font-mono text-slate-900 dark:text-white">{stat.number}</span>
                <h4 className="text-xs font-bold">{stat.label}</h4>
                <p className="text-[10px] text-muted">{stat.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Titles & Color</h3>
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Main Title</span>
              <input
                type="text"
                value={settings.mainTitle}
                onChange={(e) => setVal('mainTitle', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Subtitle</span>
              <input
                type="text"
                value={settings.subtitle}
                onChange={(e) => setVal('subtitle', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold">Number & Icon Color</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={settings.iconNumberColor}
                  onChange={(e) => setVal('iconNumberColor', e.target.value)}
                  className="w-20 px-2 py-1 text-xs font-mono rounded border text-center"
                />
                <input
                  type="color"
                  value={settings.iconNumberColor}
                  onChange={(e) => setVal('iconNumberColor', e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Layout Style</h3>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Select Layout Style</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(['glass', 'card', 'floating', 'stats-bar'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setVal('layoutStyle', style)}
                    className={`py-1.5 rounded-lg border font-bold capitalize cursor-pointer ${
                      settings.layoutStyle === style ? 'bg-emerald-600 text-white border-emerald-600' : ''
                    }`}
                  >
                    {style.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Animation Effect</span>
              <select
                value={settings.animationEffect}
                onChange={(e) => setVal('animationEffect', e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              >
                <option value="counter">Counter Animation (عداد متحرك)</option>
                <option value="fade">Smooth Fade In</option>
                <option value="pulse">Pulse Glow</option>
              </select>
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
            setSettings(full.statistics);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved statistics', 'info');
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ الإحصائيات' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
