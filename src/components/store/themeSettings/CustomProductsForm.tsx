import React, { useState } from 'react';
import { Save, Check, RotateCcw, Package, ChevronRight, Eye } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type CustomProductsSettings,
} from '../../../themes/settings/themeSettingsStore';

export const CustomProductsForm: React.FC = () => {
  const { activeStore, currentProducts } = useTenant();
  const { locale, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<CustomProductsSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.customProducts;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const setVal = <K extends keyof CustomProductsSettings>(key: K, val: CustomProductsSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.customProducts = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ مجموعة المنتجات المخصصة' : 'Custom products settings saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

  const previewItems = currentProducts.slice(0, 5);

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
            <Package className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Theme Settings · 16
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'المنتجات المخصصة (Custom Products Selia)' : 'Custom Products (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'عرض باقة مختارة من المنتجات في صفوف شبكية أو شريط تمرير سريع'
                : 'Display selected products in a clean, elegant and flexible carousel or grid'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          16_Custom_Products
        </span>
      </div>

      {/* LIVE PREVIEW OF CUSTOM PRODUCTS CAROUSEL */}
      <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-serif font-black">{settings.mainTitle}</h3>
          <p className="text-xs text-muted">{settings.subtitle}</p>
          {settings.displayViewAll && (
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 cursor-pointer hover:underline pt-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {previewItems.map((prod) => (
            <div key={prod.id} className="rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 shadow-2xs p-2.5 space-y-2" style={{ borderColor: 'var(--border)' }}>
              <div className="aspect-3/4 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img src={prod.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-xs font-bold truncate">{prod.name}</h4>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-black text-rose-600">{money(prod.price)}</span>
                  <span className="text-[9px] text-muted line-through">{money(Math.round(prod.price * 1.5))}</span>
                </div>
                <span className="text-[9px] font-black text-rose-600 block mt-0.5">50% OFF</span>
              </div>
            </div>
          ))}
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
          <h3 className="text-xs font-bold uppercase text-emerald-600">
            {isAr ? 'فلتر وتخطيط المنتجات' : 'Product Filter & Layout'}
          </h3>
          <div className="space-y-3">
            {/* Collection Filter */}
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'تصنيف وفلترة المجموعة' : 'Collection / Tag Filter'}
              </span>
              <select
                value={settings.collectionFilter || 'all'}
                onChange={(e) => setVal('collectionFilter', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-bold"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              >
                <option value="all">{isAr ? 'جميع المنتجات (All Products)' : 'All Products'}</option>
                <option value="trending">{isAr ? 'الأكثر رواجاً (Top Trending 🔥)' : 'Top Trending 🔥'}</option>
                <option value="best_sellers">{isAr ? 'الأكثر مبيعاً (Best Sellers ⭐)' : 'Best Sellers ⭐'}</option>
                <option value="best_products">{isAr ? 'أفضل المنتجات (Best Products 👑)' : 'Best Products 👑'}</option>
                <option value="featured">{isAr ? 'منتجات مميزة (Featured ✨)' : 'Featured ✨'}</option>
                <option value="women">{isAr ? 'هدايا نسائية (Women)' : 'Women Collection'}</option>
                <option value="valentines">{isAr ? 'عيد الحب والرومانسية (Valentine)' : "Valentine's Day"}</option>
                <option value="eid">{isAr ? 'أقسام العيد (Eid)' : 'Eid Celebrations'}</option>
                <option value="birthday">{isAr ? 'أعياد الميلاد (Birthday)' : 'Birthday Gifts'}</option>
                <option value="luxury">{isAr ? 'تشكيلة فاخرة (Luxury VIP)' : 'Luxury VIP'}</option>
              </select>
            </div>

            {/* Columns Per Row */}
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'عدد المنتجات في الصف الواحد (Grid Columns)' : 'Products Per Row (Columns)'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[3, 4, 5, 6, 8, 10].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setVal('columnsCount', col)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                      (settings.columnsCount || 4) === col ? 'bg-emerald-600 text-white border-emerald-600' : ''
                    }`}
                  >
                    {col} {isAr ? 'في الصف' : '/ row'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
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

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Number of Products</span>
              <div className="flex flex-wrap gap-1.5">
                {[4, 8, 12, 16, 20].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setVal('numberOfProducts', n)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                      settings.numberOfProducts === n ? 'bg-emerald-600 text-white border-emerald-600' : ''
                    }`}
                  >
                    {n}
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
            setSettings(full.customProducts);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved products', 'info');
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ المنتجات' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
