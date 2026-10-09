import React, { useState } from 'react';
import { Save, Check, RotateCcw, LayoutGrid, Star, Heart, ShoppingCart, ChevronRight, Eye } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type ProductTabsSettings,
} from '../../../themes/settings/themeSettingsStore';

export const ProductTabsForm: React.FC = () => {
  const { activeStore, currentProducts } = useTenant();
  const { locale, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<ProductTabsSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.tabs;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const toggle = (key: keyof ProductTabsSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setVal = <K extends keyof ProductTabsSettings>(key: K, val: ProductTabsSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.tabs = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إعدادات تبويبات المنتجات' : 'Product tabs settings saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

  const sampleProducts = currentProducts.slice(0, settings.numberOfProducts);

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
            <LayoutGrid className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Theme Settings · 07
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'تبويبات المنتجات (Product Tabs)' : 'Product Tabs (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'عرض مجموعات المنتجات المختلفة عبر أزرار وتبويبات مرنة'
                : 'Display products from multiple sources and collections in tabs'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          07_Product_Tabs
        </span>
      </div>

      {/* LIVE PREVIEW OF TABBED COLLECTION */}
      <div className="rounded-2xl border p-5 space-y-5" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">TRENDING NOW</span>
          <h3 className="text-2xl font-black">{settings.mainTitle}</h3>
          <p className="text-xs text-muted">{settings.subtitle}</p>
        </div>

        {/* Tab Buttons bar */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
          {settings.tabs.map((tab) => {
            const isActive = tab === settings.activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setVal('activeTab', tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-md'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid Preview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {sampleProducts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border overflow-hidden p-3 space-y-2 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                <span className="absolute top-2 start-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white">
                  -20%
                </span>
                <button type="button" className="absolute top-2 end-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-slate-600 hover:text-rose-500 shadow-xs">
                  <Heart className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold truncate">{p.name}</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-black text-emerald-600">{money(p.price)}</span>
                  <span className="text-[10px] text-muted line-through">{money(Math.round(p.price * 1.25))}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-amber-500 mt-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>4.8 (120)</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {settings.displayViewAll && (
          <div className="text-center pt-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors shadow-xs">
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">
            {isAr ? 'العناوين ونمط التبويب' : 'General & Tab Style'}
          </h3>
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

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Tabs Style</span>
              <div className="flex gap-2">
                {(['buttons', 'switch', 'underline'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setVal('tabsStyle', s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border cursor-pointer capitalize ${
                      settings.tabsStyle === s ? 'bg-emerald-600 text-white border-emerald-600' : ''
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">
            {isAr ? 'عدد المنتجات وطريقة العرض' : 'Products Count & Layout'}
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Number of Products</span>
              <div className="flex flex-wrap gap-1.5">
                {[4, 8, 12, 16, 20, 24, 28, 32].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setVal('numberOfProducts', num)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                      settings.numberOfProducts === num ? 'bg-emerald-600 text-white border-emerald-600' : ''
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-xs font-bold block">Display "View All" Link</span>
                <span className="text-[10px] text-muted">Show link to full category page</span>
              </div>
              <button
                type="button"
                onClick={() => toggle('displayViewAll')}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  settings.displayViewAll ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
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
            setSettings(full.tabs);
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ التبويبات' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
