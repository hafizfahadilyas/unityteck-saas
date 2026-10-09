import React, { useState } from 'react';
import {
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Star,
  ShieldCheck,
  Truck,
  ShoppingCart,
  Zap,
  Plus,
  Minus,
  Flame,
  Play,
  Monitor,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type DetailedProductsSettings,
} from '../../../themes/settings/themeSettingsStore';

export const DetailedProductsForm: React.FC = () => {
  const { activeStore, currentProducts } = useTenant();
  const { locale, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<DetailedProductsSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.detailedProducts;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [qty, setQty] = useState(1);
  const [previewTab, setPreviewTab] = useState<'desktop' | 'mobile'>('desktop');

  const selectedProduct =
    currentProducts.find((p) => p.id === settings.selectedProductId) || currentProducts[0];

  const setVal = <K extends keyof DetailedProductsSettings>(key: K, val: DetailedProductsSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.detailedProducts = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إعدادات المنتجات المفصلة' : 'Detailed product settings saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

  const aspectClass =
    settings.imageDimensions === 'portrait'
      ? 'aspect-3/4'
      : settings.imageDimensions === 'landscape'
        ? 'aspect-4/3'
        : 'aspect-square';

  const imgModeClass = settings.imageDisplayMode === 'full' ? 'object-contain' : 'object-cover';

  return (
    <form
      onSubmit={handleSave}
      className="rounded-2xl border p-4 sm:p-6 space-y-6"
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
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                Theme Settings · 08
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                Selia Store Builder
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'المنتجات المفصلة (منتجات مفصلة)' : 'Detailed Products (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'عرض بطاقة تفصيلية غنية لمنتج الأسبوع مع خيارات متقدمة وميزات تحفيز الشراء'
                : 'Display a detailed product card with advanced options, urgency timers, and fast checkout'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setVal('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
            <span className="ms-2 text-xs font-bold text-muted">
              {settings.enabled ? (isAr ? 'مفعل' : 'Enabled') : (isAr ? 'معطل' : 'Disabled')}
            </span>
          </label>
        </div>
      </div>

      {/* LIVE PREVIEW OF DETAILED PRODUCT SPOTLIGHT */}
      {selectedProduct && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-bold">{isAr ? 'معاينة حية للعنصر:' : 'Live Element Preview:'}</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewTab('desktop')}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${previewTab === 'desktop' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs' : 'text-muted'}`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('mobile')}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${previewTab === 'mobile' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs' : 'text-muted'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 sm:p-6 bg-white dark:bg-slate-900 shadow-md space-y-4 mx-auto transition-all ${previewTab === 'mobile' ? 'max-w-md' : 'w-full'}`}
            style={{ borderColor: settings.cardBorderColor || 'var(--border)' }}
          >
            {/* Ticker Banner */}
            {settings.movingBannerText && (
              <div
                className="py-2 px-4 rounded-xl text-center text-xs font-bold shadow-xs whitespace-nowrap overflow-hidden text-ellipsis"
                style={{
                  background: settings.bannerBgColor || '#032320',
                  color: settings.bannerTextColor || '#FFFFFF',
                }}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{settings.movingBannerText}</span>
                </span>
              </div>
            )}

            <div className={`grid ${previewTab === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-6 items-start`}>
              {/* Product Gallery Left */}
              <div className="space-y-2.5">
                <div
                  className={`w-full ${aspectClass} rounded-2xl overflow-hidden border bg-slate-100 dark:bg-slate-800 relative`}
                  style={{ borderColor: settings.cardBorderColor || 'var(--border)' }}
                >
                  <img src={selectedProduct.image} alt="" className={`w-full h-full ${imgModeClass}`} />
                  <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-md">
                    14% OFF
                  </span>
                  {settings.showSalesCount && (
                    <span className="absolute bottom-3 start-3 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 text-white flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>{settings.salesCount || '1.2k sold'}</span>
                    </span>
                  )}
                  {settings.productVideoUrl && (
                    <span className="absolute bottom-3 end-3 px-2.5 py-1 rounded-xl bg-slate-950/80 text-white text-[10px] font-bold flex items-center gap-1">
                      <Play className="w-3 h-3 fill-current text-emerald-400" />
                      <span>Video</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info Right */}
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 block">
                    {selectedProduct.category} · {selectedProduct.sku}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {settings.elementTitle || selectedProduct.name}
                  </h3>
                  {settings.subtitle && (
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {settings.subtitle}
                    </p>
                  )}
                  <p className={`text-xs text-muted mt-1 leading-relaxed ${settings.displayTwoLinesDesc !== false ? 'line-clamp-2' : ''}`}>
                    {selectedProduct.description || 'Next-gen luxury arrangement with fresh blooms and deep aroma.'}
                  </p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                    <span className="font-bold text-slate-800 dark:text-slate-200 ms-1.5">
                      {settings.ratingValue} ({settings.numberOfReviews} reviews)
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl font-black text-emerald-600">{money(selectedProduct.price * qty)}</span>
                  <span className="text-xs text-muted line-through">{money(Math.round(selectedProduct.price * 1.16 * qty))}</span>
                </div>

                {/* Variations */}
                {settings.displayProductOptions !== false && (
                  <div className="flex gap-2">
                    {['Standard (12)', 'Deluxe (24)', 'VIP (36)'].map((opt, i) => (
                      <span key={i} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${i === 0 ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 dark:border-slate-700'}`}>
                        {opt}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTAs */}
                <div className="flex gap-2 pt-1">
                  <button type="button" className="flex-1 py-2.5 rounded-xl border-2 border-emerald-600 text-emerald-600 font-bold text-xs flex items-center justify-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Bag</span>
                  </button>
                  {settings.displayBuyNowButton !== false && (
                    <button type="button" className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Buy Now</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM SETTINGS GRID (Matching Screenshot 2 - Selia) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. General Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1.5">
            <span>1</span>
            <span>{isAr ? 'الإعدادات العامة (General Settings)' : '1. General Settings'}</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'إضافة تباعد علوي (Add Top Spacing)' : 'Add Top Spacing'}</span>
              <input
                type="checkbox"
                checked={settings.addTopSpacing || false}
                onChange={(e) => setVal('addTopSpacing', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'عنوان العنصر (Element Title)' : 'Element Title'}
              </span>
              <input
                type="text"
                value={settings.elementTitle}
                onChange={(e) => setVal('elementTitle', e.target.value)}
                placeholder="Product of the Week"
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'العنوان الفرعي (Subtitle)' : 'Subtitle'}
              </span>
              <input
                type="text"
                value={settings.subtitle}
                onChange={(e) => setVal('subtitle', e.target.value)}
                placeholder="A limited-time offer you do not want to miss!"
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
          </div>
        </div>

        {/* 2. Product Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1.5">
            <span>2</span>
            <span>{isAr ? 'إعدادات المنتج (Product Settings)' : '2. Product Settings'}</span>
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'اختيار المنتج المميز' : 'Product Selection'}
              </span>
              <select
                value={settings.selectedProductId}
                onChange={(e) => setVal('selectedProductId', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              >
                {currentProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ({money(p.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'رابط فيديو المنتج (اختياري)' : 'Product Video URL (Optional)'}
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.productVideoUrl || ''}
                  onChange={(e) => setVal('productVideoUrl', e.target.value)}
                  placeholder="https://assets.mixkit.co/videos/preview/..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border outline-none font-mono"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                />
              </div>
              <p className="text-[10px] text-muted mt-1">
                YouTube and Google Drive direct links are not supported. Upload your video to Selia Center and get the ready-to-use link.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Review & Sales */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1.5">
            <span>3</span>
            <span>{isAr ? 'التقييم والمبيعات (Review & Sales)' : '3. Review & Sales'}</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'عرض عدد المبيعات' : 'Show Sales Count'}</span>
              <input
                type="checkbox"
                checked={settings.showSalesCount}
                onChange={(e) => setVal('showSalesCount', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'نص عدد المبيعات (Sales Count)' : 'Sales Count (Optional)'}
              </span>
              <input
                type="text"
                value={String(settings.salesCount || '1.2k sold')}
                onChange={(e) => setVal('salesCount', e.target.value)}
                placeholder="1.2k sold"
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                  {isAr ? 'التقييم (من 5)' : 'Rating Value (Out of 5)'}
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={settings.ratingValue}
                  onChange={(e) => setVal('ratingValue', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                  {isAr ? 'عدد المراجعات' : 'Number of Reviews'}
                </span>
                <input
                  type="number"
                  min="0"
                  value={settings.numberOfReviews}
                  onChange={(e) => setVal('numberOfReviews', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Image Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1.5">
            <span>4</span>
            <span>{isAr ? 'إعدادات الصورة الرئيسية (Image Settings)' : '4. Main Image Settings'}</span>
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'أبعاد الصورة الرئيسية' : 'Main Image Dimensions'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'square', label: 'Square (1:1)' },
                  { id: 'portrait', label: 'Portrait (3:4)' },
                  { id: 'landscape', label: 'Landscape (4:3)' },
                ].map((dim) => (
                  <button
                    key={dim.id}
                    type="button"
                    onClick={() => setVal('imageDimensions', dim.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                      settings.imageDimensions === dim.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {dim.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'طريقة عرض الصورة' : 'Main Image Display Mode'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cover', label: 'Cover Image (Crop)' },
                  { id: 'full', label: 'Full Image (No crop)' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setVal('imageDisplayMode', mode.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                      settings.imageDisplayMode === mode.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'لون إطار البطاقة (Card Border Color)' : 'Card Border Color'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.cardBorderColor || '#e2e8f0'}
                  onChange={(e) => setVal('cardBorderColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={settings.cardBorderColor || '#e2e8f0'}
                  onChange={(e) => setVal('cardBorderColor', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border font-mono outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Banner Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1.5">
            <span>5</span>
            <span>{isAr ? 'إعدادات الشريط المتحرك (Moving Banner Settings)' : '5. Moving Banner Settings'}</span>
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'نص الشريط المتحرك' : 'Moving Banner Text'}
              </span>
              <input
                type="text"
                value={settings.movingBannerText}
                onChange={(e) => setVal('movingBannerText', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                  {isAr ? 'لون خلفية الشريط' : 'Banner Background Color'}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={settings.bannerBgColor || '#032320'}
                    onChange={(e) => setVal('bannerBgColor', e.target.value)}
                    className="w-7 h-7 rounded-lg border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.bannerBgColor || '#032320'}
                    onChange={(e) => setVal('bannerBgColor', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs rounded-lg border font-mono"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                  {isAr ? 'لون النص' : 'Banner Text Color'}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={settings.bannerTextColor || '#FFFFFF'}
                    onChange={(e) => setVal('bannerTextColor', e.target.value)}
                    className="w-7 h-7 rounded-lg border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.bannerTextColor || '#FFFFFF'}
                    onChange={(e) => setVal('bannerTextColor', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs rounded-lg border font-mono"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Display Toggles & Advanced Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1.5">
            <span>6</span>
            <span>{isAr ? 'خيارات العرض المتقدمة' : '6. Display Options & Advanced'}</span>
          </h3>

          <div className="space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold">{isAr ? 'عرض خيارات وتنسيقات المنتج' : 'Display Product Options'}</span>
              <input
                type="checkbox"
                checked={settings.displayProductOptions !== false}
                onChange={(e) => setVal('displayProductOptions', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold">{isAr ? 'عرض سطرين فقط من الوصف' : 'Display Two Lines of Product Description'}</span>
              <input
                type="checkbox"
                checked={settings.displayTwoLinesDesc !== false}
                onChange={(e) => setVal('displayTwoLinesDesc', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold">{isAr ? 'عرض زر الشراء الفوري (Buy Now)' : 'Display "Buy Now" Button (Quick Checkout)'}</span>
              <input
                type="checkbox"
                checked={settings.displayBuyNowButton !== false}
                onChange={(e) => setVal('displayBuyNowButton', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </label>

            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'ظهور العنصر حسب المتصفح' : 'Display Element Based on Browser'}
              </span>
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.browserDisplay !== 'mobile'}
                    onChange={(e) => setVal('browserDisplay', e.target.checked ? 'all' : 'mobile')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded"
                  />
                  <span>Desktop Version</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.browserDisplay !== 'desktop'}
                    onChange={(e) => setVal('browserDisplay', e.target.checked ? 'all' : 'desktop')}
                    className="w-3.5 h-3.5 text-emerald-600 rounded"
                  />
                  <span>Mobile Version</span>
                </label>
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
            setSettings(full.detailedProducts);
            toast(isAr ? 'تم استرجاع الإعدادات المحفوظة' : 'Reset to saved settings', 'info');
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
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer transition-all hover:opacity-90 unity-btn-primary"
        >
          {savedFlash ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ التغييرات (Save Changes)' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
