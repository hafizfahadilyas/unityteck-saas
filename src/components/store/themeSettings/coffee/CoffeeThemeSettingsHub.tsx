import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleOff,
  LayoutTemplate,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { useTenant } from '../../../../context/TenantContext';
import { usePrefs } from '../../../../i18n/PrefsContext';
import {
  readAllThemeSettings,
  type AllThemeSettings,
} from '../../../../themes/settings/themeSettingsStore';

/**
 * Coffee Word-order widgets — Active/Inactive KPIs + one-click open of each editable section.
 */
const SECTIONS: {
  id: string;
  settingsKey: keyof AllThemeSettings | null;
  titleEn: string;
  titleAr: string;
}[] = [
  { id: '00_header_builder', settingsKey: 'customHeader', titleEn: 'Header & Navigation', titleAr: 'الهيدر والقوائم' },
  { id: '03_store_colors', settingsKey: 'colors', titleEn: 'Colors & Background', titleAr: 'الألوان والخلفية' },
  { id: 'C-ANN', settingsKey: 'announcementBar', titleEn: 'Announcement Bar', titleAr: 'شريط الإعلان' },
  { id: 'C-FCP', settingsKey: 'featuredCategoriesProducts', titleEn: 'Categories & Products', titleAr: 'التصنيفات والمنتجات' },
  { id: 'C-HERO', settingsKey: 'heroBanners', titleEn: 'Hero Banners', titleAr: 'بانر الواجهة' },
  { id: 'C-FSB', settingsKey: 'featuredSectionBanners', titleEn: 'Flagship Section', titleAr: 'قسم المنتجات الرائدة' },
  { id: 'C-FP', settingsKey: 'featuredProducts', titleEn: 'Featured Products', titleAr: 'المنتجات المميزة' },
  { id: 'C-SHOP', settingsKey: 'shop', titleEn: 'Shop and checkout', titleAr: 'المتجر وإتمام الشراء' },
  { id: 'C-IMG', settingsKey: 'imageBanners', titleEn: 'Image Banners', titleAr: 'بانرات الصور' },
  { id: 'C-FOOT', settingsKey: 'footer', titleEn: 'Footer', titleAr: 'التذييل' },
  { id: 'C-ICON', settingsKey: 'enhancedFeatures', titleEn: 'Feature Icons', titleAr: 'أيقونات المميزات' },
  { id: 'C-BEN', settingsKey: 'exclusiveBenefits', titleEn: 'Exclusive Benefits', titleAr: 'المزايا الحصرية' },
  { id: 'C-PC', settingsKey: 'productCarousel', titleEn: 'Product Carousel', titleAr: 'كاروسيل المنتجات' },
  { id: 'C-PCB', settingsKey: 'productCarouselBanner', titleEn: 'Carousel + Banner', titleAr: 'كاروسيل مع بانر' },
  { id: 'C-EDIT', settingsKey: null, titleEn: 'Product Editor', titleAr: 'محرر المنتجات' },
  { id: 'C-NEWS', settingsKey: 'newsletter', titleEn: 'Newsletter', titleAr: 'النشرة البريدية' },
  { id: 'C-CPB', settingsKey: 'customOrder', titleEn: 'Custom Order', titleAr: 'الطلب المخصص' },
  { id: 'C-REV', settingsKey: null, titleEn: 'Reviews', titleAr: 'التقييمات' },
];

function isSectionEnabled(settings: AllThemeSettings, key: keyof AllThemeSettings | null): boolean {
  if (!key) return true;
  const slice = settings[key] as { enabled?: boolean } | undefined;
  return slice?.enabled !== false;
}

export const CoffeeThemeSettingsHub: React.FC<{
  onOpenStorefront?: () => void;
  onOpenThemeCustomizer?: (sectionId?: string) => void;
  onOpenPageBuilder?: () => void;
}> = ({ onOpenStorefront, onOpenThemeCustomizer, onOpenPageBuilder }) => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [tick, setTick] = useState(0);

  const refreshCounts = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const onSettings = (e: Event) => {
      const detail = (e as CustomEvent).detail as { storeId?: string } | undefined;
      if (!detail?.storeId || detail.storeId === activeStore.id) refreshCounts();
    };
    const onData = () => refreshCounts();
    window.addEventListener('unityteck-theme-settings', onSettings as EventListener);
    window.addEventListener('unityteck-data', onData as EventListener);
    window.addEventListener('storage', onData);
    return () => {
      window.removeEventListener('unityteck-theme-settings', onSettings as EventListener);
      window.removeEventListener('unityteck-data', onData as EventListener);
      window.removeEventListener('storage', onData);
    };
  }, [activeStore.id, refreshCounts]);

  const settings = useMemo(
    () => readAllThemeSettings(activeStore.id, activeStore),
    // tick forces re-read after save / theme-settings events
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeStore.id, activeStore, tick],
  );

  const widgetStats = useMemo(() => {
    let activeCount = 0;
    let inactiveCount = 0;
    for (const section of SECTIONS) {
      if (isSectionEnabled(settings, section.settingsKey)) activeCount += 1;
      else inactiveCount += 1;
    }
    return {
      total: SECTIONS.length,
      active: activeCount,
      inactive: inactiveCount,
    };
  }, [settings]);

  const openCustomizeThemes = (sectionId = '01_store_identity') => {
    if (onOpenThemeCustomizer) {
      onOpenThemeCustomizer(sectionId);
      return;
    }
    if (onOpenStorefront) {
      onOpenStorefront();
      return;
    }
    const slug = activeStore?.slug || 'coffee';
    window.open(`/?store=${slug}&fullscreen=1`, '_blank');
  };

  const openPageBuilder = () => {
    onOpenPageBuilder?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openCustomizeThemes('01_store_identity')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 transition-colors cursor-pointer active:scale-[0.98]"
          title={isAr ? 'فتح مخصص الثيم' : 'Open Customize Themes'}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          {isAr ? 'تخصيص الثيم' : 'Customize Themes'}
        </button>
        <button
          type="button"
          onClick={openPageBuilder}
          disabled={!onOpenPageBuilder}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          title={isAr ? 'فتح محرر الصفحات البصري' : 'Open Visual Page Builder'}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          {isAr ? 'محرر الصفحات' : 'Page Builder'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-5 rounded-2xl border bg-emerald-50/70 hover:bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-emerald-200 font-bold">
              {isAr ? 'الودجات النشطة' : 'Active Widgets'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {widgetStats.active}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {isAr
              ? `من أصل ${widgetStats.total} قسم ثيم`
              : `of ${widgetStats.total} theme sections`}
          </span>
        </div>

        <div className="p-5 rounded-2xl border bg-slate-50/80 hover:bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700/50 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-slate-200 font-bold">
              {isAr ? 'الودجات غير النشطة' : 'Inactive Widgets'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <CircleOff className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {widgetStats.inactive}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {isAr
              ? 'مطفأة على الواجهة حالياً'
              : 'Disabled on the storefront'}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/40 p-3 sm:p-4 space-y-2">
        <div className="flex items-center gap-2 px-1 pb-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            {isAr ? 'أقسام قابلة للتعديل' : 'Editable Sections'}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SECTIONS.map((section) => {
            const active = isSectionEnabled(settings, section.settingsKey);
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => openCustomizeThemes(section.id)}
                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer text-start"
                title={isAr ? `تعديل: ${section.titleAr}` : `Edit: ${section.titleEn}`}
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {isAr ? section.titleAr : section.titleEn}
                </span>
                <span
                  className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${
                    active
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {active ? (isAr ? 'نشط' : 'On') : isAr ? 'متوقف' : 'Off'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
