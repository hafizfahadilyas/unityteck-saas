import React, { useState } from 'react';
import { Save, Check, RotateCcw, Image as ImageIcon, Plus, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type BannersSettings,
  type BannerItem,
} from '../../../themes/settings/themeSettingsStore';
import { MediaUploadField } from '../../common/MediaUploadField';

export const BannersForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<BannersSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.banners;
  });
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const activeBanner = settings.banners[activeBannerIdx] || settings.banners[0];

  const setVal = <K extends keyof BannersSettings>(key: K, val: BannersSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const updateActiveBanner = (patch: Partial<BannerItem>) => {
    setSettings((prev) => {
      const copy = [...prev.banners];
      copy[activeBannerIdx] = { ...copy[activeBannerIdx], ...patch };
      return { ...prev, banners: copy };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.banners = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إعدادات البانرات الترويجية' : 'Banners settings saved', 'success');
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
            <ImageIcon className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Theme Settings · 11
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'البانرات الترويجية (Banners Selia)' : 'Banners (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'تصميم بانرات إعلانية متحركة ومؤثرات لعرض التخفيضات والأقسام'
                : 'Create stunning animated banners to showcase your offers, products, and collections'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          11_Banners
        </span>
      </div>

      {/* LIVE BANNER PREVIEW */}
      {activeBanner && (
        <div className="relative rounded-2xl overflow-hidden shadow-lg border aspect-16/6 sm:aspect-21/7 flex items-center"
          style={{ borderColor: 'var(--border)', background: '#1c1917' }}>
          <img
            src={activeBanner.image}
            alt={activeBanner.title}
            className="absolute inset-0 w-full h-full object-cover filter brightness-85 transition-all duration-500"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: `${settings.overlayOpacity}%` }}
          />

          <div className="relative z-10 p-6 sm:p-10 max-w-xl text-white space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950">
              {activeBanner.discountBadge}
            </span>
            <h3 className="text-xl sm:text-3xl font-black drop-shadow-md">{activeBanner.title}</h3>
            <p className="text-xs sm:text-sm text-slate-200">{activeBanner.subtitle}</p>
            <div className="pt-2">
              <span className="inline-block px-5 py-2 rounded-xl bg-slate-950 text-white font-bold text-xs shadow-md cursor-pointer hover:bg-slate-800 transition-colors">
                {activeBanner.buttonText}
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          {settings.showNavigationArrows && (
            <>
              <button
                type="button"
                onClick={() => setActiveBannerIdx((p) => (p === 0 ? settings.banners.length - 1 : p - 1))}
                className="absolute start-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveBannerIdx((p) => (p === settings.banners.length - 1 ? 0 : p + 1))}
                className="absolute end-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-md"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Active Banner Content</h3>
          <div className="space-y-3">
            <MediaUploadField
              label={isAr ? 'صورة خلفية البانر' : 'Banner Background Image'}
              value={activeBanner.image}
              onChange={(url) => updateActiveBanner({ image: url })}
              aspectRatio="banner"
              initialFolder="banners"
              recommendedSize="1920 × 600 px"
            />
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Banner Title</span>
              <input
                type="text"
                value={activeBanner.title}
                onChange={(e) => updateActiveBanner({ title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Subtitle</span>
              <input
                type="text"
                value={activeBanner.subtitle}
                onChange={(e) => updateActiveBanner({ subtitle: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-1">Discount Badge</span>
                <input
                  type="text"
                  value={activeBanner.discountBadge}
                  onChange={(e) => updateActiveBanner({ discountBadge: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-1">Button Text</span>
                <input
                  type="text"
                  value={activeBanner.buttonText}
                  onChange={(e) => updateActiveBanner({ buttonText: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Animation & Overlay</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Overlay Opacity</span>
                <span>{settings.overlayOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={settings.overlayOpacity}
                onChange={(e) => setVal('overlayOpacity', Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-1">Rounded Corners</span>
                <select
                  value={settings.roundedCorners}
                  onChange={(e) => setVal('roundedCorners', e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-1">Transition</span>
                <select
                  value={settings.transitionEffect}
                  onChange={(e) => setVal('transitionEffect', e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                >
                  <option value="slide">Slide</option>
                  <option value="fade">Fade</option>
                  <option value="zoom">Zoom</option>
                </select>
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
            setSettings(full.banners);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved banners', 'info');
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ البانرات' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
