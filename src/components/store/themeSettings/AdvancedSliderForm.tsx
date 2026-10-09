import React, { useState } from 'react';
import {
  Save,
  Check,
  RotateCcw,
  Sliders,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Smartphone,
  Monitor,
  Eye,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type AdvancedSliderSettings,
  type SliderSlide,
} from '../../../themes/settings/themeSettingsStore';

const SLIDE_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  image: { en: 'Image', ar: 'صورة' },
  video: { en: 'Video', ar: 'فيديو' },
};

const TRANSITION_LABELS: Record<string, { en: string; ar: string }> = {
  fade: { en: 'Fade', ar: 'تلاشي' },
  slide: { en: 'Slide', ar: 'انزلاق' },
  zoom: { en: 'Zoom', ar: 'تكبير' },
};

export const AdvancedSliderForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<AdvancedSliderSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.slider;
  });
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const activeSlide = settings.slides[activeSlideIdx] || settings.slides[0];

  const typeLabel = (type: string) => {
    const L = SLIDE_TYPE_LABELS[type];
    return L ? (isAr ? L.ar : L.en) : type;
  };

  const updateActiveSlide = (patch: Partial<SliderSlide>) => {
    setSettings((prev) => {
      const copy = [...prev.slides];
      copy[activeSlideIdx] = { ...copy[activeSlideIdx], ...patch };
      return { ...prev, slides: copy };
    });
  };

  const handleAddSlide = () => {
    const newSlide: SliderSlide = {
      id: `slide-${Date.now()}`,
      type: 'image',
      image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1920&q=80',
      title: isAr ? 'شريحة فاخرة جديدة' : 'New Luxury Slide',
      subtitle: isAr
        ? 'مجموعة حصرية من الزهور والمنتجات الفاخرة صُنعت بشغف.'
        : 'Exclusive floral and boutique collection crafted with passion.',
      buttonText: isAr ? 'تسوّق المجموعة' : 'Shop Collection',
      buttonUrl: '#store-products-grid',
      badge: isAr ? 'وصل حديثاً' : 'New Arrival',
    };
    setSettings((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setActiveSlideIdx(settings.slides.length);
    toast(isAr ? 'تمت إضافة شريحة جديدة' : 'New slide added', 'success');
  };

  const handleDeleteSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (settings.slides.length <= 1) {
      toast(isAr ? 'يجب أن يبقى شريحة واحدة على الأقل' : 'At least one slide is required', 'error');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== idx),
    }));
    setActiveSlideIdx((prev) => Math.max(0, prev - 1));
    toast(isAr ? 'تم حذف الشريحة' : 'Slide removed', 'info');
  };

  const handleDuplicateSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = settings.slides[idx];
    const dup: SliderSlide = {
      ...target,
      id: `slide-${Date.now()}`,
      title: `${target.title} ${isAr ? '(نسخة)' : '(Copy)'}`,
    };
    setSettings((prev) => {
      const copy = [...prev.slides];
      copy.splice(idx + 1, 0, dup);
      return { ...prev, slides: copy };
    });
    setActiveSlideIdx(idx + 1);
    toast(isAr ? 'تم تكرار الشريحة بنجاح' : 'Slide duplicated', 'success');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.slider = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إعدادات السلايدر المتطور بنجاح' : 'Advanced slider settings saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

  const toggleTrack = (on: boolean) =>
    `w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
      on ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
    }`;

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
            <Sliders className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              {isAr ? 'إعدادات الثيم · 05' : 'Theme Settings · 05'}
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'شريط التمرير المتقدم (Advanced Slider Element)' : 'Advanced Slider Element'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'تصميم عارض البانرات التفاعلي بالصور والفيديوهات والأزرار المتحركة'
                : 'Create stunning hero sliders with images, videos, text and animated buttons'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
            {isAr ? 'جميل · مرن · قوي' : 'Beautiful · Flexible · Powerful'}
          </span>
        </div>
      </div>

      {/* LIVE INTERACTIVE BANNER PREVIEW */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border aspect-16/7 sm:aspect-21/8 flex items-center"
        style={{ borderColor: 'var(--border)', background: '#0a0a0a' }}>
        {activeSlide && (
          <>
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="absolute inset-0 w-full h-full object-cover object-center filter brightness-75 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="relative z-10 p-6 sm:p-10 max-w-xl text-white space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                {activeSlide.badge}
              </span>
              <h3 className="text-xl sm:text-3xl font-black drop-shadow-md">{activeSlide.title}</h3>
              <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">{activeSlide.subtitle}</p>
              <div className="pt-2">
                <span
                  className="inline-block px-4 py-2 text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-105"
                  style={{
                    background: settings.buttonStyle === 'filled' ? settings.buttonBgColor : 'transparent',
                    color: settings.buttonTextColor,
                    border: `2px solid ${settings.buttonBgColor}`,
                    borderRadius: `${settings.buttonBorderRadius}px`,
                  }}
                >
                  {activeSlide.buttonText}
                </span>
              </div>
            </div>

            {/* Slider Controls */}
            <button
              type="button"
              onClick={() => setActiveSlideIdx((prev) => (prev === 0 ? settings.slides.length - 1 : prev - 1))}
              className="absolute start-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
              title={isAr ? 'الشريحة السابقة' : 'Previous slide'}
              aria-label={isAr ? 'الشريحة السابقة' : 'Previous slide'}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSlideIdx((prev) => (prev === settings.slides.length - 1 ? 0 : prev + 1))}
              className="absolute end-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
              title={isAr ? 'الشريحة التالية' : 'Next slide'}
              aria-label={isAr ? 'الشريحة التالية' : 'Next slide'}
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {settings.slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSlideIdx(i)}
                  aria-label={isAr ? `الانتقال إلى الشريحة ${i + 1}` : `Go to slide ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    i === activeSlideIdx ? 'w-5 bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 6 Settings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Multiple Slides */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
            <h3 className="text-xs font-bold uppercase">{isAr ? 'الشرائح المتعددة' : 'Multiple Slides'}</h3>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pe-1">
            {settings.slides.map((slide, idx) => (
              <div
                key={slide.id}
                onClick={() => setActiveSlideIdx(idx)}
                className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  idx === activeSlideIdx ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img src={slide.image} alt="" className="w-10 h-7 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{slide.title}</span>
                    <span className="text-[10px] text-muted block capitalize">{typeLabel(slide.type)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDuplicateSlide(idx, e)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={isAr ? 'تكرار' : 'Duplicate'}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSlide(idx, e)}
                    className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                    title={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddSlide}
            className="w-full py-2 rounded-xl border border-dashed border-emerald-500/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة شريحة جديدة' : '+ Add New Slide'}</span>
          </button>
        </div>

        {/* 2. Slide Types */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
            <h3 className="text-xs font-bold uppercase">{isAr ? 'نوع الشريحة' : 'Slide Types'}</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateActiveSlide({ type: 'image' })}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                activeSlide.type === 'image' ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/10 font-bold' : 'border-slate-200'
              }`}
            >
              <span className="text-xs block">{typeLabel('image')}</span>
            </button>
            <button
              type="button"
              onClick={() => updateActiveSlide({ type: 'video' })}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                activeSlide.type === 'video' ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/10 font-bold' : 'border-slate-200'
              }`}
            >
              <span className="text-xs block">{typeLabel('video')}</span>
            </button>
          </div>

          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold uppercase text-muted block">{isAr ? 'رابط الصورة' : 'Image URL'}</span>
            <input
              type="text"
              value={activeSlide.image}
              onChange={(e) => updateActiveSlide({ image: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
            />
          </div>
        </div>

        {/* 3. Animation Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center justify-center">3</span>
            <h3 className="text-xs font-bold uppercase">{isAr ? 'إعدادات الحركة' : 'Animation Settings'}</h3>
          </div>

          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">{isAr ? 'نوع ودجت الهيرو' : 'Hero Widget Type'}</span>
              <select
                value={(settings as any).heroWidgetType || 'slider'}
                onChange={(e) => setSettings((p) => ({ ...p, heroWidgetType: e.target.value } as any))}
                className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer text-emerald-700 dark:text-emerald-300"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              >
                <option value="slider">{isAr ? 'سلايدر شرائح قياسي' : 'Standard Carousel Slider'}</option>
                <option value="flower-scroll-hero">{isAr ? 'ودجت تكوين الورد الفاخر (Flower Scroll Hero)' : 'Luxury Flower Scroll Hero (50 Frames)'}</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">{isAr ? 'تأثير الانتقال' : 'Transition Effect'}</span>
              <select
                value={settings.transitionEffect}
                onChange={(e) => setSettings((p) => ({ ...p, transitionEffect: e.target.value as any }))}
                className="w-full px-2.5 py-1.5 rounded-xl text-xs border outline-none cursor-pointer"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              >
                {(['fade', 'slide', 'zoom'] as const).map((v) => (
                  <option key={v} value={v}>
                    {isAr ? TRANSITION_LABELS[v].ar : TRANSITION_LABELS[v].en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">{isAr ? 'مدة الانتقال (بالثواني)' : 'Transition Duration (Seconds)'}</span>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.transitionDuration}
                onChange={(e) => setSettings((p) => ({ ...p, transitionDuration: Number(e.target.value) }))}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold">{isAr ? 'تشغيل تلقائي' : 'Auto Play'}</span>
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, autoPlay: !p.autoPlay }))}
                className={toggleTrack(settings.autoPlay)}
                aria-label={isAr ? 'تشغيل تلقائي' : 'Auto Play'}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Content Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center">4</span>
            <h3 className="text-xs font-bold uppercase">{isAr ? 'محتوى الشريحة' : 'Content Settings'}</h3>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-0.5">{isAr ? 'عنوان الشريحة' : 'Slide Title'}</span>
              <input
                type="text"
                value={activeSlide.title}
                onChange={(e) => updateActiveSlide({ title: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-0.5">{isAr ? 'العنوان الفرعي' : 'Slide Subtitle'}</span>
              <input
                type="text"
                value={activeSlide.subtitle}
                onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-0.5">{isAr ? 'نص الزر' : 'Button Text'}</span>
                <input
                  type="text"
                  value={activeSlide.buttonText}
                  onChange={(e) => updateActiveSlide({ buttonText: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-muted block mb-0.5">{isAr ? 'الشارة' : 'Badge'}</span>
                <input
                  type="text"
                  value={activeSlide.badge}
                  onChange={(e) => updateActiveSlide({ badge: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Button Customization */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[11px] font-black flex items-center justify-center">5</span>
            <h3 className="text-xs font-bold uppercase">{isAr ? 'تخصيص الأزرار' : 'Button Customization'}</h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'خلفية الزر' : 'Button Background'}</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={settings.buttonBgColor}
                  onChange={(e) => setSettings((p) => ({ ...p, buttonBgColor: e.target.value }))}
                  className="w-16 px-1.5 py-1 text-xs font-mono rounded border text-center"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  dir="ltr"
                />
                <input
                  type="color"
                  value={settings.buttonBgColor}
                  onChange={(e) => setSettings((p) => ({ ...p, buttonBgColor: e.target.value }))}
                  className="w-7 h-7 rounded cursor-pointer"
                  title={isAr ? 'اختر اللون' : 'Pick color'}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'لون نص الزر' : 'Button Text Color'}</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={settings.buttonTextColor}
                  onChange={(e) => setSettings((p) => ({ ...p, buttonTextColor: e.target.value }))}
                  className="w-16 px-1.5 py-1 text-xs font-mono rounded border text-center"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  dir="ltr"
                />
                <input
                  type="color"
                  value={settings.buttonTextColor}
                  onChange={(e) => setSettings((p) => ({ ...p, buttonTextColor: e.target.value }))}
                  className="w-7 h-7 rounded cursor-pointer"
                  title={isAr ? 'اختر اللون' : 'Pick color'}
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">{isAr ? 'نمط الزر' : 'Button Style'}</span>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="btnStyle"
                    checked={settings.buttonStyle === 'filled'}
                    onChange={() => setSettings((p) => ({ ...p, buttonStyle: 'filled' }))}
                    className="accent-emerald-600"
                  />
                  <span>{isAr ? 'ممتلئ' : 'Filled'}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="btnStyle"
                    checked={settings.buttonStyle === 'outlined'}
                    onChange={() => setSettings((p) => ({ ...p, buttonStyle: 'outlined' }))}
                    className="accent-emerald-600"
                  />
                  <span>{isAr ? 'محدد بإطار' : 'Outlined'}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Advanced Settings */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-black flex items-center justify-center">6</span>
            <h3 className="text-xs font-bold uppercase">{isAr ? 'إعدادات متقدمة' : 'Advanced Settings'}</h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'الإظهار على سطح المكتب' : 'Show on Desktop'}</span>
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, showOnDesktop: !p.showOnDesktop }))}
                className={toggleTrack(settings.showOnDesktop)}
                aria-label={isAr ? 'الإظهار على سطح المكتب' : 'Show on Desktop'}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'الإظهار على الجوال' : 'Show on Mobile'}</span>
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, showOnMobile: !p.showOnMobile }))}
                className={toggleTrack(settings.showOnMobile)}
                aria-label={isAr ? 'الإظهار على الجوال' : 'Show on Mobile'}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">{isAr ? 'CSS مخصص' : 'Custom CSS'}</span>
              <textarea
                value={settings.customCss}
                onChange={(e) => setSettings((p) => ({ ...p, customCss: e.target.value }))}
                placeholder=".slider-custom { /* styles */ }"
                rows={2}
                dir="ltr"
                className="w-full p-2 text-xs font-mono rounded-xl border outline-none"
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
            setSettings(full.slider);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved slider', 'info');
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ السلايدر' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
