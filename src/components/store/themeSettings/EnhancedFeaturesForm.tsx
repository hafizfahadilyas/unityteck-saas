import React, { useState } from 'react';
import {
  Save,
  Check,
  RotateCcw,
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones,
  Award,
  Plus,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type EnhancedFeaturesSettings,
} from '../../../themes/settings/themeSettingsStore';

export const EnhancedFeaturesForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<EnhancedFeaturesSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.enhancedFeatures;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const setVal = <K extends keyof EnhancedFeaturesSettings>(key: K, val: EnhancedFeaturesSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.enhancedFeatures = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ مزايا وثقة المتجر' : 'Enhanced features settings saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Truck': return <Truck className="w-6 h-6 text-emerald-600" />;
      case 'CreditCard': return <CreditCard className="w-6 h-6 text-blue-600" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6 text-amber-600" />;
      case 'Headphones': return <Headphones className="w-6 h-6 text-purple-600" />;
      default: return <Award className="w-6 h-6 text-emerald-600" />;
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
            <Award className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Theme Settings · 14
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'مزايا المتجر وبطاقات الثقة (Enhanced Features)' : 'Enhanced Store Features (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'عرض مزايا المتجر وضمانات الشحن الآمن بعدة أنماط حديثة (كلاسيك، عائم، زجاجي، خط زمني)'
                : 'Display your store advantages in a modern and interactive way to build customer trust'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          14_Enhanced_Features
        </span>
      </div>

      {/* LIVE PREVIEW OF 5 MODERN STYLES */}
      <div className="rounded-2xl border p-6 space-y-6" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">WHY SHOP WITH US?</span>
          <h3 className="text-2xl font-black">{settings.mainTitle}</h3>
          <p className="text-xs text-muted">{settings.subtitle}</p>
        </div>

        {/* Selected Layout Style Preview */}
        <div className={`grid gap-4 ${
          settings.itemsPerRowDesktop === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
        }`}>
          {settings.features.map((feat) => {
            if (settings.layoutStyle === 'floating') {
              return (
                <div key={feat.id} className="text-center p-4 space-y-2">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    {getIcon(feat.icon)}
                  </div>
                  <h4 className="text-xs font-bold">{feat.title}</h4>
                </div>
              );
            }

            if (settings.layoutStyle === 'glass') {
              return (
                <div key={feat.id} className="p-5 rounded-2xl border border-white/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm space-y-2 text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto">
                    {getIcon(feat.icon)}
                  </div>
                  <h4 className="text-xs font-black">{feat.title}</h4>
                  <p className="text-[11px] text-muted leading-relaxed line-clamp-2">{feat.description}</p>
                </div>
              );
            }

            if (settings.layoutStyle === 'minimal') {
              return (
                <div key={feat.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {getIcon(feat.icon)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{feat.title}</h4>
                    <p className="text-[10px] text-muted">{feat.description}</p>
                  </div>
                </div>
              );
            }

            // Classic Cards (Default)
            return (
              <div
                key={feat.id}
                className="rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                    {getIcon(feat.icon)}
                  </div>
                  <h4 className="text-sm font-black">{feat.title}</h4>
                  <p className="text-xs text-muted leading-relaxed">{feat.description}</p>
                </div>
                {feat.linkText && (
                  <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1 cursor-pointer hover:underline pt-2">
                    <span>{feat.linkText}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">General Titles</h3>
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
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Layout Style</h3>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Select Style</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(['classic-cards', 'minimal', 'floating', 'glass'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setVal('layoutStyle', st)}
                    className={`py-1.5 rounded-lg border font-bold capitalize cursor-pointer ${
                      settings.layoutStyle === st ? 'bg-emerald-600 text-white border-emerald-600' : ''
                    }`}
                  >
                    {st.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Items Per Row</span>
              <div className="flex gap-2">
                {[3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setVal('itemsPerRowDesktop', n)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                      settings.itemsPerRowDesktop === n ? 'bg-emerald-600 text-white border-emerald-600' : ''
                    }`}
                  >
                    {n} Features
                  </button>
                ))}
              </div>
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
            setSettings(full.enhancedFeatures);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved features', 'info');
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ المزايا' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
