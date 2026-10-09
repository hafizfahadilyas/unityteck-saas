import React, { useState } from 'react';
import {
  Save,
  Check,
  RotateCcw,
  Link2,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Sliders,
  Sparkles,
  Maximize2,
  Image as ImageIcon,
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
  type CustomLinksSettings,
  type CustomLinkItem,
} from '../../../themes/settings/themeSettingsStore';

export const CustomLinksForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<CustomLinksSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.customLinks;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const setVal = <K extends keyof CustomLinksSettings>(key: K, val: CustomLinksSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const updateLink = (id: string, patch: Partial<CustomLinkItem>) => {
    setSettings((prev) => ({
      ...prev,
      links: prev.links.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const addLink = () => {
    const newId = `cl-${Date.now().toString().slice(-4)}`;
    const newItem: CustomLinkItem = {
      id: newId,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      title: isAr ? 'قسم جديد' : 'New Collection',
      subtitle: isAr ? 'تشكيلة حصرية' : 'Exclusive Collection',
      category: 'Luxury Hand Bouquets',
      link: '#store-products-grid',
      linkType: 'Category',
      showButton: true,
      buttonText: 'Shop Now',
    };
    setSettings((prev) => ({
      ...prev,
      links: [...prev.links, newItem],
    }));
  };

  const removeLink = (id: string) => {
    if (settings.links.length <= 1) {
      toast(isAr ? 'يجب أن يحتوي القسم على رابط واحد على الأقل' : 'Must keep at least 1 banner link', 'info');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== id),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.customLinks = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ الروابط المخصصة وأقسام المتجر' : 'Custom links & categories saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

  // Preview Classes
  const roundedClass =
    settings.roundedCorners === 'none'
      ? 'rounded-none'
      : settings.roundedCorners === 'small'
        ? 'rounded-lg'
        : settings.roundedCorners === 'large'
          ? 'rounded-3xl'
          : settings.roundedCorners === 'full'
            ? 'rounded-full'
            : 'rounded-2xl';

  const aspectClass =
    settings.aspectRatio === 'square'
      ? 'aspect-square'
      : settings.aspectRatio === 'portrait'
        ? 'aspect-3/4'
        : settings.aspectRatio === 'standard'
          ? 'aspect-4/3'
          : 'aspect-16/9';

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
            <Link2 className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                Theme Settings · 10
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                Selia Custom Links
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'الروابط المخصصة (Selia — Custom Links)' : 'Selia — Custom Links'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'استخدم هذا العنصر لعرض أقسام المتجر وحملاتك والعروض الترويجية بشكل جذاب ومرن'
                : 'Use this element to display your store sections, campaigns, collections, and promotional banners'}
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

      {/* LIVE INTERACTIVE PREVIEW */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-bold">{isAr ? 'معاينة حية للبنرات والأقسام:' : 'Live Banner / Category Preview:'}</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${previewDevice === 'desktop' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs' : 'text-muted'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${previewDevice === 'mobile' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs' : 'text-muted'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 sm:p-6 bg-white dark:bg-slate-900 shadow-md space-y-4 mx-auto transition-all ${
            previewDevice === 'mobile' ? 'max-w-md' : 'w-full'
          }`}
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">SPECIAL OFFERS</span>
            <h3 className="text-xl sm:text-2xl font-black">{settings.title}</h3>
            {settings.subtitle && <p className="text-xs text-muted">{settings.subtitle}</p>}
          </div>

          <div
            className={`grid ${
              previewDevice === 'mobile'
                ? settings.mobileColumns === 1
                  ? 'grid-cols-1'
                  : 'grid-cols-2'
                : settings.desktopColumns === 2
                  ? 'grid-cols-2'
                  : settings.desktopColumns === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-4'
            } gap-3 sm:gap-4`}
          >
            {settings.links.slice(0, 8).map((link) => (
              <div
                key={link.id}
                className={`group relative overflow-hidden border shadow-sm p-4 flex flex-col justify-end ${roundedClass} ${aspectClass} transition-all hover:scale-102`}
                style={{ borderColor: 'var(--border)', background: '#04222b' }}
              >
                <img
                  src={link.image}
                  alt={link.title}
                  className={`absolute inset-0 w-full h-full ${settings.imageDisplayMode === 'full' ? 'object-contain' : 'object-cover'} filter brightness-85 group-hover:scale-105 transition-transform duration-500`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                <div className="relative z-10 text-white space-y-1">
                  {link.linkType && (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-white/20 text-[8px] font-black uppercase">
                      {link.linkType}
                    </span>
                  )}
                  <h4 className="text-xs sm:text-sm font-black truncate">{link.title}</h4>
                  {link.subtitle && <p className="text-[10px] text-white/80 truncate">{link.subtitle}</p>}

                  {(link.showButton ?? settings.showButtonOnBanner ?? true) && (
                    <div className="pt-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-600 text-white">
                        <span>{link.buttonText || settings.buttonText || 'Shop Now'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK STYLE TOGGLES (From Screenshot 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        {/* Layout Style */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase text-muted block">Layout Style</span>
          <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
            {(['grid', 'slider', 'bento'] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setVal('layoutStyle', style)}
                className={`py-2 rounded-xl border capitalize cursor-pointer transition-colors text-center ${
                  settings.layoutStyle === style
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Image Aspect Ratio */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase text-muted block">Image Aspect Ratio</span>
          <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
            {[
              { id: 'wide', label: 'Wide Banner' },
              { id: 'standard', label: 'Standard (16:9)' },
              { id: 'square', label: 'Square (1:1)' },
              { id: 'portrait', label: 'Portrait (3:4)' },
            ].map((asp) => (
              <button
                key={asp.id}
                type="button"
                onClick={() => setVal('aspectRatio', asp.id as any)}
                className={`py-2 px-1 rounded-xl border cursor-pointer transition-colors text-center truncate ${
                  settings.aspectRatio === asp.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {asp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hover Effects */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase text-muted block">Hover Effects</span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
            {[
              { id: 'zoom', label: 'Zoom In' },
              { id: 'fade', label: 'Fade' },
              { id: 'slide-up', label: 'Slide Up' },
            ].map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setVal('hoverEffect', h.id as any)}
                className={`py-2 rounded-xl border cursor-pointer transition-colors text-center ${
                  settings.hoverEffect === h.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILED SETTINGS ACCORDION / PANELS (From Screenshot 3 - Right Panel) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Layout Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1.5">
            <span>1</span>
            <span>{isAr ? 'إعدادات التصميم (Layout Settings)' : '1. Layout Settings'}</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold">{isAr ? 'عنصر بعرض كامل (Make Element Full Width)' : 'Make Element Full Width'}</span>
              <input
                type="checkbox"
                checked={settings.makeFullWidth !== false}
                onChange={(e) => setVal('makeFullWidth', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold">{isAr ? 'عرض كشريط متحرك سلايدر (Display as Slider)' : 'Display Links as Slider (Animated)'}</span>
              <input
                type="checkbox"
                checked={settings.displayAsSlider !== false}
                onChange={(e) => setVal('displayAsSlider', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </label>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'أعمدة سطح المكتب (Desktop Columns)' : 'Desktop Grid Columns'}
              </span>
              <div className="flex gap-1.5">
                {[2, 3, 4, 5, 6, 7, 8].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setVal('desktopColumns', c)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${
                      settings.desktopColumns === c ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'أعمدة الجوال (Mobile Columns)' : 'Mobile Grid Columns'}
              </span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setVal('mobileColumns', c)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${
                      settings.mobileColumns === c ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Image Display Options */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1.5">
            <span>2</span>
            <span>{isAr ? 'خيارات عرض الصور (Image Display Options)' : '2. Image Display Options'}</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold">{isAr ? 'عرض الصورة كاملة بدون قص' : 'Show Full Image (No crop)'}</span>
              <input
                type="checkbox"
                checked={settings.imageDisplayMode === 'full'}
                onChange={(e) => setVal('imageDisplayMode', e.target.checked ? 'full' : 'cover')}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </label>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'زوايا الصورة (Rounded Corners)' : 'Rounded Image Corners'}
              </span>
              <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'small', label: 'Small' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'large', label: 'Large' },
                  { id: 'full', label: 'Fully' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setVal('roundedCorners', r.id as any)}
                    className={`py-1.5 rounded-lg border text-center cursor-pointer ${
                      settings.roundedCorners === r.id ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold">{isAr ? 'تفعيل طبقة التعتيم (Enable Image Overlay)' : 'Enable Image Overlay'}</span>
              <input
                type="checkbox"
                checked={settings.enableOverlay !== false}
                onChange={(e) => setVal('enableOverlay', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </label>

            {settings.enableOverlay !== false && (
              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                  {isAr ? 'نوع التعتيم (Overlay Style)' : 'Overlay Style'}
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                  {[
                    { id: 'gradient', label: 'Gradient' },
                    { id: 'dark', label: 'Dark' },
                    { id: 'blur', label: 'Blur' },
                    { id: 'custom', label: 'Custom' },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setVal('overlayStyle', o.id as any)}
                      className={`py-1.5 rounded-lg border text-center cursor-pointer ${
                        settings.overlayStyle === o.id ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Titles & Header Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1.5">
            <span>3</span>
            <span>{isAr ? 'عناوين العنصر (Section Header)' : '3. Section Header Titles'}</span>
          </h3>

          <div className="space-y-2.5">
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
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Subtitle / Description</span>
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

        {/* 4. Advanced Banner Options */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1.5">
            <span>4</span>
            <span>{isAr ? 'خيارات البنر والأزرار (Advanced Banner Options)' : '4. Advanced Banner Options'}</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold">{isAr ? 'عرض زر داخل البنر (Display Button on Banner)' : 'Display Button on Banner'}</span>
              <input
                type="checkbox"
                checked={settings.showButtonOnBanner !== false}
                onChange={(e) => setVal('showButtonOnBanner', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
            </label>

            {settings.showButtonOnBanner !== false && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted block mb-1">Button Text</span>
                  <input
                    type="text"
                    value={settings.buttonText || 'Shop Now'}
                    onChange={(e) => setVal('buttonText', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted block mb-1">Button Color</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={settings.buttonColor || '#059669'}
                      onChange={(e) => setVal('buttonColor', e.target.value)}
                      className="w-7 h-7 rounded-lg border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.buttonColor || '#059669'}
                      onChange={(e) => setVal('buttonColor', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs rounded-lg border font-mono"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAutoSlider || false}
                  onChange={(e) => setVal('enableAutoSlider', e.target.checked)}
                  className="w-3.5 h-3.5 text-emerald-600 rounded"
                />
                <span>Enable Auto Slider</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showNavArrows !== false}
                  onChange={(e) => setVal('showNavArrows', e.target.checked)}
                  className="w-3.5 h-3.5 text-emerald-600 rounded"
                />
                <span>Show Nav Arrows</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 5. LINKS REPEATER (From Screenshot 3) */}
      <div className="rounded-xl border p-4 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase text-emerald-600">
              {isAr ? 'عناصر وروابط الأقسام (Links & Categories List)' : '5. Links & Collections List'}
            </h3>
            <p className="text-[11px] text-muted">
              {isAr ? 'حدد وجهة الرابط (قسم، علامة تجارية، منتج، صفحة هبوط)' : 'Configure each banner destination (Category, Brand, Product, Landing Page)'}
            </p>
          </div>

          <button
            type="button"
            onClick={addLink}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة رابط جديد' : '+ Add Another Link'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.links.map((link, idx) => (
            <div
              key={link.id}
              className="p-3.5 rounded-xl border space-y-3 bg-slate-50/50 dark:bg-slate-800/40 relative"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  #{idx + 1} — {link.title}
                </span>
                <button
                  type="button"
                  onClick={() => removeLink(link.id)}
                  className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                  title="Remove Link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-muted block mb-1">Title</span>
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => updateLink(link.id, { title: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted block mb-1">Subtitle</span>
                  <input
                    type="text"
                    value={link.subtitle}
                    onChange={(e) => updateLink(link.id, { subtitle: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-muted block mb-1">Button / Link Type</span>
                  <select
                    value={link.linkType || 'Category'}
                    onChange={(e) => updateLink(link.id, { linkType: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none cursor-pointer"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  >
                    <option value="Category">Category (قسم المتجر)</option>
                    <option value="Brand">Brand (العلامة التجارية)</option>
                    <option value="Product">Product (منتج محدد)</option>
                    <option value="Landing Page">Landing Page</option>
                    <option value="Discounts">Discounts (عروض وتخفيضات)</option>
                    <option value="External Link">External Link</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-muted block mb-1">Destination Target</span>
                  <input
                    type="text"
                    value={link.category}
                    onChange={(e) => updateLink(link.id, { category: e.target.value })}
                    placeholder="e.g. Luxury Hand Bouquets or Dutch Flora"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted block mb-1">Image URL (Recommended: 1150 × 409 px)</span>
                <input
                  type="text"
                  value={link.image}
                  onChange={(e) => updateLink(link.id, { image: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none font-mono text-[11px]"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => {
            const full = readAllThemeSettings(activeStore.id, activeStore);
            setSettings(full.customLinks);
            toast(isAr ? 'تم استرجاع الإعدادات المحفوظة' : 'Reset to saved links', 'info');
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
