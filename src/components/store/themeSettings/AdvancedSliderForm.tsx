import React, { useState, useEffect } from 'react';
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
  ShoppingBag,
  ExternalLink,
  SlidersHorizontal,
  Palette,
  Image as ImageIcon,
  Type,
  MousePointerClick,
  Layers,
  CheckCircle2,
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
import { MediaUploadField } from '../../common/MediaUploadField';

const BUTTON_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  ChevronRight,
  Zap,
  ExternalLink,
  Sparkles,
};

const TRANSITION_LABELS: Record<string, { en: string; ar: string }> = {
  fade: { en: 'Smooth Fade', ar: 'تلاشي ناعم (Fade)' },
  slide: { en: 'Horizontal Slide', ar: 'انزلاق أفقي (Slide)' },
  zoom: { en: 'Zoom Scale', ar: 'تكبير ناعم (Zoom)' },
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
  const [activeControlTab, setActiveControlTab] = useState<'content' | 'specs' | 'button' | 'media' | 'animation'>('content');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Sync if active store changes
  useEffect(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    setSettings(full.slider);
    setActiveSlideIdx(0);
  }, [activeStore.id]);

  const slides = settings.slides && settings.slides.length > 0 ? settings.slides : [];
  const safeIdx = Math.min(activeSlideIdx, Math.max(0, slides.length - 1));
  const activeSlide: SliderSlide = slides[safeIdx] || {
    id: 'slide-fallback',
    type: 'image',
    image: '/hero_coffee_banner_white_1.jpg',
    title: 'HiBrew Barista Pro™ H7A',
    subtitle: 'Dual independent PID thermoblock & 20-bar Italian pump.',
    buttonText: 'Shop Now →',
    buttonUrl: '#products',
    badge: 'Flagship',
    buttonBgColor: '#c88a58',
    buttonTextColor: '#FFFFFF',
    buttonStyle: 'filled',
    buttonBorderRadius: 12,
  };

  const updateActiveSlide = (patch: Partial<SliderSlide>) => {
    setSettings((prev) => {
      const copy = [...prev.slides];
      copy[safeIdx] = { ...copy[safeIdx], ...patch };
      return { ...prev, slides: copy };
    });
  };

  const handleAddSlide = () => {
    const isCoffee = activeStore.id === 'store-coffee' || activeStore.category?.includes('قهوة');
    const isCar = activeStore.id === 'store-bleco' || activeStore.category?.includes('سيارات');

    const newSlide: SliderSlide = {
      id: `slide-${Date.now()}`,
      type: 'image',
      image: isCoffee
        ? '/hero_coffee_banner_white_1.jpg'
        : isCar
        ? 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80'
        : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
      title: isCoffee
        ? (isAr ? 'ماكينة قهوة احترافية جديدة' : 'New Flagship Espresso Machine')
        : isCar
        ? (isAr ? 'تفصيل أرضيات جلدية جديدة' : 'New Custom Leather Floor Mats')
        : (isAr ? 'باقة ورد طبيعي فاخرة' : 'New Luxury Floral Bouquet'),
      titleAr: isCoffee ? 'ماكينة قهوة احترافية جديدة' : isCar ? 'تفصيل أرضيات جلدية جديدة' : 'باقة ورد طبيعي فاخرة',
      titleEn: isCoffee ? 'New Flagship Espresso Machine' : isCar ? 'New Custom Leather Floor Mats' : 'New Luxury Floral Bouquet',
      subtitle: isCoffee
        ? (isAr ? 'استخلاص متطور بضغط 20 بار مع تحكم حراري دقيق.' : 'Advanced 20-bar extraction with precision PID temperature.')
        : isCar
        ? (isAr ? 'تفصيل دقيق لكافة موديلات السيارات مع ضمان 5 سنوات.' : 'Precision laser fit for all vehicle makes with 5-year warranty.')
        : (isAr ? 'ورود طبيعية مستوردة طازجة للمناسبات السعيدة.' : 'Fresh imported natural flowers crafted for sacred moments.'),
      subtitleAr: isCoffee
        ? 'استخلاص متطور بضغط 20 بار مع تحكم حراري دقيق.'
        : isCar
        ? 'تفصيل دقيق لكافة موديلات السيارات مع ضمان 5 سنوات.'
        : 'ورود طبيعية مستوردة طازجة للمناسبات السعيدة.',
      subtitleEn: isCoffee
        ? 'Advanced 20-bar extraction with precision PID temperature.'
        : isCar
        ? 'Precision laser fit for all vehicle makes with 5-year warranty.'
        : 'Fresh imported natural flowers crafted for sacred moments.',
      buttonText: isAr ? 'تسوّق الآن →' : 'Shop Now →',
      buttonTextAr: 'تسوّق الآن →',
      buttonTextEn: 'Shop Now →',
      buttonUrl: '#products',
      buttonBgColor: isCoffee ? '#c88a58' : isCar ? '#d97706' : '#059669',
      buttonTextColor: '#FFFFFF',
      buttonIcon: 'ShoppingBag',
      buttonStyle: 'filled',
      buttonBorderRadius: 12,
      badge: isAr ? 'وصل حديثاً' : 'New Arrival',
      badgeAr: 'وصل حديثاً',
      badgeEn: 'New Arrival',
    };

    setSettings((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setActiveSlideIdx(slides.length);
    toast(isAr ? 'تمت إضافة شريحة جديدة بنجاح' : 'New slide added successfully', 'success');
  };

  const handleDeleteSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) {
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
    const target = slides[idx];
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
    toast(isAr ? 'تم نسخ الشريحة بنجاح' : 'Slide duplicated', 'success');
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.slider = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ وتحديث السلايدر بنجاح!' : 'Slider settings saved and applied!', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 250);
  };

  const handleReset = () => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    setSettings(full.slider);
    toast(isAr ? 'تمت استعادة الإعدادات المحفوظة' : 'Reverted to saved slider settings', 'info');
  };

  const toggleTrack = (on: boolean) =>
    `w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
      on ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
    }`;

  const SelectedButtonIcon = BUTTON_ICON_MAP[activeSlide.buttonIcon || 'ShoppingBag'] || ShoppingBag;

  return (
    <div className="space-y-4 text-slate-900 dark:text-slate-100 font-sans">
      {/* ─── 1. TOP LIVE MINI BANNER PREVIEW ─── */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 aspect-16/8 bg-black flex items-center justify-center">
        {activeSlide && (
          <>
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="absolute inset-0 w-full h-full object-cover filter brightness-75 transition-all duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/hero_coffee_banner_white_1.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

            <div className="relative z-10 p-4 w-full text-white space-y-1.5 text-center sm:text-start">
              {activeSlide.badge && (
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-xs">
                  {activeSlide.badge}
                </span>
              )}
              <h3 className="text-sm sm:text-base font-black drop-shadow-md truncate">{activeSlide.title}</h3>
              <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed opacity-90">{activeSlide.subtitle}</p>

              <div className="pt-1.5">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold shadow-md transition-transform"
                  style={{
                    background:
                      activeSlide.buttonStyle === 'outlined'
                        ? 'transparent'
                        : activeSlide.buttonBgColor || settings.buttonBgColor || '#c88a58',
                    color: activeSlide.buttonTextColor || settings.buttonTextColor || '#FFFFFF',
                    border: `1.5px solid ${activeSlide.buttonBgColor || settings.buttonBgColor || '#c88a58'}`,
                    borderRadius: `${activeSlide.buttonBorderRadius ?? settings.buttonBorderRadius ?? 12}px`,
                  }}
                >
                  <SelectedButtonIcon className="w-3.5 h-3.5" />
                  <span>{activeSlide.buttonText}</span>
                </span>
              </div>
            </div>

            {/* Slider Switch Arrows */}
            <button
              type="button"
              onClick={() => setActiveSlideIdx((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
              className="absolute start-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
              title={isAr ? 'الشريحة السابقة' : 'Previous slide'}
            >
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSlideIdx((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
              className="absolute end-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
              title={isAr ? 'الشريحة التالية' : 'Next slide'}
            >
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSlideIdx(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === safeIdx ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/50'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── 2. MULTIPLE SLIDES MANAGER (SCROLLABLE LIST) ─── */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center">
              {slides.length}
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
              {isAr ? 'إدارة شرائح السلايدر' : 'Slider Slides Manager'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddSlide}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة شريحة' : '+ Add Slide'}</span>
          </button>
        </div>

        {/* Scrollable list of slide cards */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pe-1">
          {slides.map((slide, idx) => {
            const isCurrent = idx === safeIdx;
            return (
              <div
                key={slide.id}
                onClick={() => setActiveSlideIdx(idx)}
                className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                    isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-300'
                  }`}>
                    {idx + 1}
                  </span>

                  <img
                    src={slide.image}
                    alt=""
                    className="w-11 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/hero_coffee_banner_white_1.jpg';
                    }}
                  />

                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate text-slate-900 dark:text-slate-100">
                      {slide.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {slide.buttonText} · {slide.badge}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDuplicateSlide(idx, e)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
                    title={isAr ? 'تكرار الشريحة' : 'Duplicate Slide'}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSlide(idx, e)}
                    className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    title={isAr ? 'حذف الشريحة' : 'Delete Slide'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 3. ACTIVE SLIDE CUSTOMIZATION TABS ─── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold overflow-x-auto no-scrollbar">
        {[
          { id: 'content', labelAr: 'النصوص والعناوين', labelEn: 'Texts & Badge', icon: Type },
          { id: 'button', labelAr: 'زر الإجراء (CTA)', labelEn: 'Button (CTA)', icon: MousePointerClick },
          { id: 'media', labelAr: 'الصورة والوسائط', labelEn: 'Image & Media', icon: ImageIcon },
          { id: 'animation', labelAr: 'الحركة والسرعة', labelEn: 'Animation & Speed', icon: SlidersHorizontal },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeControlTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveControlTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-SECTION 1: TEXTS & BADGE */}
      {activeControlTab === 'content' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-200 shadow-2xs text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">
              {isAr ? `عنوان الشريحة #${safeIdx + 1}` : `Slide #${safeIdx + 1} Heading / Title`}
            </label>
            <input
              type="text"
              value={activeSlide.title || ''}
              onChange={(e) => updateActiveSlide({ title: e.target.value, titleAr: e.target.value, titleEn: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">
              {isAr ? 'الوصف الفرعي للشريحة' : 'Slide Subtitle / Description'}
            </label>
            <textarea
              rows={2}
              value={activeSlide.subtitle || ''}
              onChange={(e) => updateActiveSlide({ subtitle: e.target.value, subtitleAr: e.target.value, subtitleEn: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">
              {isAr ? 'شارة العرض (Badge / Tag)' : 'Badge / Tag Text'}
            </label>
            <input
              type="text"
              value={activeSlide.badge || ''}
              onChange={(e) => updateActiveSlide({ badge: e.target.value, badgeAr: e.target.value, badgeEn: e.target.value })}
              placeholder={isAr ? 'مثال: إصدار محدود، الأكثر مبيعاً، AI✦' : 'e.g., Limited Edition, Bestseller, AI✦'}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: BUTTON CUSTOMIZATION (CTA) */}
      {activeControlTab === 'button' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-200 shadow-2xs text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                {isAr ? 'نص الزر' : 'Button Text'}
              </label>
              <input
                type="text"
                value={activeSlide.buttonText || ''}
                onChange={(e) => updateActiveSlide({ buttonText: e.target.value, buttonTextAr: e.target.value, buttonTextEn: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                {isAr ? 'رابط الزر (URL)' : 'Button URL'}
              </label>
              <input
                type="text"
                value={activeSlide.buttonUrl || '#products'}
                onChange={(e) => updateActiveSlide({ buttonUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* Button Colors */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون خلفية الزر' : 'Button Bg Color'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeSlide.buttonBgColor || settings.buttonBgColor || '#c88a58'}
                  onChange={(e) => updateActiveSlide({ buttonBgColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={activeSlide.buttonBgColor || settings.buttonBgColor || '#c88a58'}
                  onChange={(e) => updateActiveSlide({ buttonBgColor: e.target.value })}
                  className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'لون نص الزر' : 'Button Text Color'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeSlide.buttonTextColor || settings.buttonTextColor || '#FFFFFF'}
                  onChange={(e) => updateActiveSlide({ buttonTextColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={activeSlide.buttonTextColor || settings.buttonTextColor || '#FFFFFF'}
                  onChange={(e) => updateActiveSlide({ buttonTextColor: e.target.value })}
                  className="w-full px-2 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Button Style & Icon */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'نمط الزر' : 'Button Style'}</label>
              <select
                value={activeSlide.buttonStyle || 'filled'}
                onChange={(e) => updateActiveSlide({ buttonStyle: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="filled">{isAr ? 'ممتلئ (Filled)' : 'Filled'}</option>
                <option value="outlined">{isAr ? 'محدد بإطار (Outlined)' : 'Outlined'}</option>
                <option value="glass">{isAr ? 'زجاجي شفاف (Glass)' : 'Glass'}</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'أيقونة الزر' : 'Button Icon'}</label>
              <select
                value={activeSlide.buttonIcon || 'ShoppingBag'}
                onChange={(e) => updateActiveSlide({ buttonIcon: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="ShoppingBag">{isAr ? 'حقيبة تسوق (ShoppingBag)' : 'Shopping Bag'}</option>
                <option value="ChevronRight">{isAr ? 'سهم انتقال (ChevronRight)' : 'Arrow Right'}</option>
                <option value="Zap">{isAr ? 'برق سريع (Zap)' : 'Lightning Zap'}</option>
                <option value="Sparkles">{isAr ? 'نجوم وبريق (Sparkles)' : 'Sparkles'}</option>
                <option value="ExternalLink">{isAr ? 'رابط خارجي (ExternalLink)' : 'External Link'}</option>
              </select>
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400">{isAr ? 'انحناء حواف الزر' : 'Button Border Radius'}</span>
              <span className="text-[10px] font-mono font-bold">{activeSlide.buttonBorderRadius ?? settings.buttonBorderRadius ?? 12}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={activeSlide.buttonBorderRadius ?? settings.buttonBorderRadius ?? 12}
              onChange={(e) => updateActiveSlide({ buttonBorderRadius: Number(e.target.value) })}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: IMAGE & MEDIA */}
      {activeControlTab === 'media' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200 shadow-2xs text-xs">
          <MediaUploadField
            label={isAr ? 'صورة الشريحة الرئيسية (بانر السلايدر)' : 'Hero Slide Banner Image'}
            value={activeSlide.image || ''}
            onChange={(url) => updateActiveSlide({ image: url })}
            aspectRatio="banner"
            initialFolder="banners"
            recommendedSize="1920 × 750 px"
          />

          {/* Preset fast galleries tailored to active store */}
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
              {isAr ? 'صور سريعة مقترحة لمتجرك' : 'Suggested Store Images'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { url: '/hero_coffee_banner_white_1.jpg', label: 'Flagship H7A' },
                { url: '/hero_coffee_banner_white_2.jpg', label: 'Titanium Mill' },
                { url: '/hero_coffee_banner_white_3.jpg', label: 'Luxury Bar' },
              ].map((preset, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => updateActiveSlide({ image: preset.url })}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-start cursor-pointer group transition-all"
                >
                  <img src={preset.url} alt="" className="w-full h-12 object-cover rounded-lg mb-1" />
                  <span className="text-[9px] font-bold block truncate text-slate-600 dark:text-slate-300 group-hover:text-emerald-600">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 4: ANIMATION & SPEED */}
      {activeControlTab === 'animation' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-200 shadow-2xs text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">{isAr ? 'تأثير الانتقال بين الشرائح' : 'Slide Transition Effect'}</label>
            <select
              value={settings.transitionEffect || 'fade'}
              onChange={(e) => setSettings((p) => ({ ...p, transitionEffect: e.target.value as any }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              {(['fade', 'slide', 'zoom'] as const).map((v) => (
                <option key={v} value={v}>
                  {isAr ? TRANSITION_LABELS[v].ar : TRANSITION_LABELS[v].en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400">{isAr ? 'مدة بقاء الشريحة (بالثواني)' : 'Slide Duration (Seconds)'}</span>
              <span className="text-[10px] font-mono font-bold">{settings.transitionDuration || 5}s</span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              value={settings.transitionDuration || 5}
              onChange={(e) => setSettings((p) => ({ ...p, transitionDuration: Number(e.target.value) }))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold">{isAr ? 'التشغيل التلقائي (Auto Play)' : 'Auto Play Slides'}</span>
            <button
              type="button"
              onClick={() => setSettings((p) => ({ ...p, autoPlay: !p.autoPlay }))}
              className={toggleTrack(settings.autoPlay)}
              aria-label="Auto play"
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold">{isAr ? 'إظهار على سطح المكتب' : 'Show on Desktop'}</span>
            <button
              type="button"
              onClick={() => setSettings((p) => ({ ...p, showOnDesktop: !p.showOnDesktop }))}
              className={toggleTrack(settings.showOnDesktop)}
              aria-label="Show desktop"
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold">{isAr ? 'إظهار على الجوال' : 'Show on Mobile'}</span>
            <button
              type="button"
              onClick={() => setSettings((p) => ({ ...p, showOnMobile: !p.showOnMobile }))}
              className={toggleTrack(settings.showOnMobile)}
              aria-label="Show mobile"
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>
        </div>
      )}

      {/* ─── 4. BOTTOM ACTION SAVE / RESET BAR ─── */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'استرجاع المحفوظ' : 'Reset'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
        >
          {savedFlash ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Save className="w-4 h-4" />}
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'تطبيق وحفظ السلايدر' : 'Save Slider')}</span>
        </button>
      </div>
    </div>
  );
};
