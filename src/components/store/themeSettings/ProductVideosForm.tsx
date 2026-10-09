import React, { useState } from 'react';
import { Save, Check, RotateCcw, Play, Video, Plus, Trash2, Upload, ChevronRight, Eye } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type ProductVideosSettings,
  type VideoProductItem,
} from '../../../themes/settings/themeSettingsStore';

export const ProductVideosForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<ProductVideosSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.videos;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const toggle = (key: keyof ProductVideosSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setVal = <K extends keyof ProductVideosSettings>(key: K, val: ProductVideosSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.videos = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إعدادات فيديوهات المنتجات' : 'Product videos settings saved', 'success');
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
            <Video className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Theme Settings · 06
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'فيديوهات المنتجات (Product Videos)' : 'Product Videos (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'عرض فيديوهات المنتجات القصيرة (Reels / TikTok) لزيادة المبيعات'
                : 'Show your products with engaging short-form vertical videos'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          06_Product_Videos
        </span>
      </div>

      {/* LIVE PREVIEW OF 9:16 VIDEO CARDS */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
        <div className="text-center space-y-1">
          <h3 className="text-xl font-black">{settings.elementTitle}</h3>
          <p className="text-xs text-muted">{settings.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {settings.videoProducts.map((vp) => (
            <div
              key={vp.id}
              className="group relative rounded-2xl overflow-hidden border shadow-md flex flex-col justify-end aspect-9/16"
              style={{ borderColor: 'var(--border)', background: '#111827' }}
            >
              <img
                src={vp.poster}
                alt={vp.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Promo Badge */}
              {settings.promotionalVideoBadge && (
                <span className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 backdrop-blur-xs text-white flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-white" /> {settings.promoBadgeText}
                </span>
              )}

              {/* Big Play Button Center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-11 h-11 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-white translate-x-0.5" />
                </div>
              </div>

              {/* Bottom Card Info */}
              <div className="relative z-10 p-3 text-white space-y-1">
                <h4 className="text-xs font-bold leading-tight truncate">{vp.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300">{money(vp.price)}</span>
                  <div className="flex gap-1 text-[9px] opacity-80">
                    <span className="px-1 bg-white/20 rounded">S</span>
                    <span className="px-1 bg-white/20 rounded">M</span>
                    <span className="px-1 bg-white/20 rounded">L</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {settings.showViewAll && (
          <div className="text-center pt-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* General Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">
            {isAr ? 'الإعدادات العامة' : 'General Settings'}
          </h3>
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Element Title</span>
              <input
                type="text"
                value={settings.elementTitle}
                onChange={(e) => setVal('elementTitle', e.target.value)}
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
              <span className="text-xs font-bold">Display Type</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVal('displayType', 'list')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    settings.displayType === 'list' ? 'bg-emerald-600 text-white' : ''
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setVal('displayType', 'slider')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    settings.displayType === 'slider' ? 'bg-emerald-600 text-white' : ''
                  }`}
                >
                  Slider
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">
            {isAr ? 'إعدادات الفيديو' : 'Video Settings'}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">Promotional Video Badge</span>
                <span className="text-[10px] text-muted">Show badge over video cards</span>
              </div>
              <button
                type="button"
                onClick={() => toggle('promotionalVideoBadge')}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  settings.promotionalVideoBadge ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">Auto Play Video</span>
                <span className="text-[10px] text-muted">Play videos automatically on hover/scroll</span>
              </div>
              <button
                type="button"
                onClick={() => toggle('autoPlayVideo')}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  settings.autoPlayVideo ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Video Aspect Ratio</span>
              <div className="flex gap-2">
                {(['9:16', '1:1', '16:9'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setVal('videoAspectRatio', ratio)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      settings.videoAspectRatio === ratio ? 'bg-emerald-600 text-white border-emerald-600' : ''
                    }`}
                  >
                    {ratio}
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
            setSettings(full.videos);
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ الفيديوهات' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
