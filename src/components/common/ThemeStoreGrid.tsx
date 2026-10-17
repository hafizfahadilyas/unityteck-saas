import React, { useMemo, useState, useRef } from 'react';
import { Check, Download, Lock, Palette, Sparkles, Star, Globe, Upload, FileJson, Eye, ExternalLink } from 'lucide-react';
import type { ThemeItem } from '../../types';
import type { Store } from '../../types';
import { planHasFullThemes, planInfoForStore } from '../../auth/plans';
import { DEFAULT_COMMERCE_THEME_ID } from '../../auth/defaultTheme';
import { FLOWERS_THEME_ID, FLOWERS_HOMEPAGES } from '../../themes/flowersPremium/pack';
import { useToast } from '../common/ToastProvider';
import { usePrefs } from '../../i18n/PrefsContext';

export type ThemeStoreMeta = {
  priceSar: number;
  isProOnly: boolean;
  publisherAr: string;
  publisherEn: string;
  blurbAr: string;
  blurbEn: string;
};

const THEME_STORE_META: Record<string, ThemeStoreMeta> = {
  [FLOWERS_THEME_ID]: {
    priceSar: 0,
    isProOnly: false,
    publisherAr: 'منصة سوق · ثيم هدايا مكة الفاخر',
    publisherEn: 'Unityteck Store · Mecca Luxury Gifts Theme',
    blurbAr: 'ثيم الزهور الفاخر الحصري المعتمد لمتجر هدايا مكة ومحلات الورود والهدايا · ٢٠ قسماً تفاعلياً وسلايدر ثلاثي الأبعاد.',
    blurbEn: 'Exclusive official Luxury Floral & Gifts theme for Mecca Gifts. Features 20 interactive sections, 3D slider, video reels, and express checkout.',
  },
  'theme-saudia-transport': {
    priceSar: 0,
    isProOnly: false,
    publisherAr: 'مؤسسة بلاكو للتجارة · ثيم تنجيد ودعاسات السيارات الفاخرة',
    publisherEn: 'Blacko Trading · Luxury Car Upholstery & Saudi Transport Theme',
    blurbAr: 'الثيم الرسمي المعتمد لمؤسسة بلاكو للتجارة والنقل السعودي · حاسبة تفصيل ليزري فورية، 10 أقسام و10 منتجات، وبكج اليوم الوطني 20%.',
    blurbEn: 'Official luxury theme for Blacko Trading and Saudi transport. Features instant laser fit calculator, 10 categories, 10 products and National Day 20% bundle.',
  },
};

type Props = {
  themes: ThemeItem[];
  store: Store;
  activeThemeId: string;
  onInstall: (themeId: string, homepageStyle: string) => void;
  /** Master view can show all catalog; store view still lists Pro locked cards */
  showLockedPreviews?: boolean;
};

export const ThemeStoreGrid: React.FC<Props> = ({
  themes,
  store,
  activeThemeId,
  onInstall,
  showLockedPreviews = true,
}) => {
  const { toast } = useToast();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const full = planHasFullThemes(store);
  const plan = planInfoForStore(store);
  const [q, setQ] = useState('');

  const listings = useMemo(() => {
    return themes
      .map((theme) => {
        const meta = THEME_STORE_META[theme.id] ?? {
          priceSar: theme.tier === 'full' ? 49 : 0,
          isProOnly: theme.tier === 'full',
          publisherAr: 'يونيتك للمتاجر',
          publisherEn: 'Unityteck Platforms',
          blurbAr: theme.taglineAr || theme.tagline,
          blurbEn: theme.taglineEn || theme.tagline,
        };
        return { theme, meta };
      })
      .filter(({ theme, meta }) => {
        if (!q.trim()) return true;
        const hay = `${theme.name} ${theme.nameEn || ''} ${theme.category} ${theme.categoryEn || ''} ${meta.blurbAr} ${meta.blurbEn}`.toLowerCase();
        return hay.includes(q.trim().toLowerCase());
      });
  }, [themes, q]);

  const install = (theme: ThemeItem, meta: ThemeStoreMeta) => {
    if (meta.isProOnly && !full) {
      toast(
        isAr
          ? 'باقة برو (Pro) مطلوبة لتثبيت هذا الثيم على المتجر.'
          : 'Pro plan (or Master Pro grant) required to install this theme.',
        'error',
      );
      return;
    }
    const style =
      theme.id === FLOWERS_THEME_ID
        ? FLOWERS_HOMEPAGES[0]
        : theme.homepageStyles[0] || 'Modern Bento';
    onInstall(theme.id, style);
    const themeDisplayName = isAr ? (theme.nameAr || theme.name) : (theme.nameEn || theme.name);
    toast(
      isAr
        ? `تم تثبيت ثيم "${themeDisplayName}" على متجر ${store.name} بنجاح`
        : `Theme "${themeDisplayName}" installed on ${store.name} successfully`,
      'success',
    );
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportThemeJson = () => {
    const data = {
      themeId: activeThemeId,
      storeId: store.id,
      storeName: store.name,
      plan: plan.name,
      exportedAt: new Date().toISOString(),
      branding: {
        accentColor: store.accentColor,
        logo: store.logo,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${store.id}-theme-config.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(
      isAr ? 'تم تصدير ملف إعدادات الثيم بنجاح (JSON)' : 'Theme configuration exported successfully (JSON)',
      'success',
    );
  };

  const handleImportThemeJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.themeId) {
          onInstall(json.themeId, 'Modern Bento');
          toast(
            isAr ? `تم استيراد وتطبيق الثيم: ${json.themeId}` : `Imported and applied theme: ${json.themeId}`,
            'success',
          );
        } else {
          toast(isAr ? 'هيكل ملف الثيم غير صالح' : 'Invalid theme JSON structure', 'error');
        }
      } catch (err) {
        toast(isAr ? 'فشل قراءة ملف JSON' : 'Failed to parse theme JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'متجر ثيمات يونيتك (Unityteck Theme Store)' : 'Unityteck Theme Store'}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `سوق الثيمات المعتمدة · الباقة الحالية: ${plan.name} (${full ? 'كاملة المميزات' : 'أساسية'})`
              : `Official Theme Marketplace · Current Plan: ${plan.name} (${full ? 'Full' : 'Basic'})`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportThemeJson}
            accept=".json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer hover:opacity-90 shadow-2xs"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            title={isAr ? 'استيراد ثيم JSON' : 'Import Theme JSON'}
          >
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">{isAr ? 'استيراد ثيم' : 'Import Theme'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportThemeJson}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer hover:opacity-90 shadow-2xs"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            title={isAr ? 'تصدير إعدادات الثيم JSON' : 'Export Theme JSON'}
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">{isAr ? 'تصدير الثيم' : 'Export Theme'}</span>
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={isAr ? 'ابحث في الثيمات…' : 'Search themes…'}
            className="px-3 py-1.5 rounded-xl text-xs border w-full sm:w-48"
            style={{
              background: 'var(--input-bg)',
              color: 'var(--input-fg)',
              borderColor: 'var(--border)',
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map(({ theme, meta }) => {
          const locked = meta.isProOnly && !full;
          const active = theme.id === activeThemeId;
          if (locked && !showLockedPreviews) return null;

          const themeTitle = isAr ? (theme.nameAr || theme.name) : (theme.nameEn || theme.name);
          const themeBlurb = isAr ? meta.blurbAr : meta.blurbEn;
          const themeCategory = isAr ? (theme.categoryAr || theme.category) : (theme.categoryEn || theme.category);

          return (
            <article
              key={theme.id}
              className="rounded-2xl border overflow-hidden flex flex-col group transition-all duration-200 hover:shadow-xl"
              style={{
                background: 'var(--surface)',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                boxShadow: 'var(--card-shadow)',
                opacity: locked ? 0.92 : 1,
              }}
            >
              {/* Theme Screenshot Preview with Smooth Hover Scroll */}
              <div className="relative h-64 w-full overflow-hidden bg-slate-950 select-none border-b" style={{ borderColor: 'var(--border)' }}>
                <img
                  src={theme.thumbnail || '/theme-mockups/real_storefront_fullpage.png'}
                  alt={themeTitle}
                  className="w-full h-auto min-h-full block object-cover object-top transition-transform duration-[6000ms] ease-in-out group-hover:translate-y-[-60%]"
                />

                <div className="absolute top-2.5 start-2.5 end-2.5 flex items-center justify-between z-10 pointer-events-none">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950/85 text-white backdrop-blur-xs border border-white/20 shadow-md">
                    {themeCategory}
                  </span>
                  {locked ? (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-black/80 text-white backdrop-blur-xs inline-flex items-center gap-1 border border-white/20">
                      <Lock className="w-3 h-3" /> Pro
                    </span>
                  ) : meta.priceSar === 0 ? (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-md">
                      {isAr ? 'مضمّن مجاناً' : 'Included Free'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 shadow-md">
                      {money(meta.priceSar)}/{isAr ? 'شهرياً' : 'mo'}
                    </span>
                  )}
                </div>

                {/* Hover Details & Preview Action */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={() => install(theme, meta)}
                    className="px-4 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-900 text-white text-xs font-black shadow-xl flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer border border-white/20"
                  >
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? 'معاينة وتفاصيل الثيم' : 'Details & Preview'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black leading-tight" style={{ color: 'var(--text)' }}>
                    {themeTitle}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{theme.rating.toFixed(1)}</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--muted)' }}>
                  {themeBlurb}
                </p>

                {/* Supported Languages Tag */}
                <div
                  className="p-2 rounded-xl border flex items-center gap-2 text-[10px] font-semibold"
                  style={{
                    background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">
                    {isAr ? (
                      <>اللغات المدعومة: <strong>العربية (RTL)</strong> · <strong>الإنجليزية (LTR)</strong> · <strong>الأوردو (اردو)</strong></>
                    ) : (
                      <>Supported Languages: <strong>Arabic (RTL)</strong> · <strong>English (LTR)</strong> · <strong>Urdu (اردو)</strong></>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {theme.homepageStyles.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-md border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--hover-bg)' }}
                    >
                      {s}
                    </span>
                  ))}
                  {theme.homepageStyles.length > 4 ? (
                    <span className="text-[9px] font-semibold" style={{ color: 'var(--muted)' }}>
                      +{theme.homepageStyles.length - 4}
                    </span>
                  ) : null}
                </div>

                <div className="mt-auto pt-2.5 flex items-center justify-between gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                    {active
                      ? (isAr ? 'النشط حالياً على المتجر' : 'Active on store')
                      : meta.priceSar === 0
                        ? (isAr ? 'مجاني' : 'Free')
                        : `${money(meta.priceSar)}/${isAr ? 'شهر' : 'mo'}`}
                  </span>
                  {active ? (
                    <span className="text-xs font-bold inline-flex items-center gap-1 text-emerald-600">
                      <Check className="w-3.5 h-3.5" /> {isAr ? 'مثبت ونشط' : 'Installed & Active'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => install(theme, meta)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90 shadow-2xs"
                      style={{ background: locked ? 'var(--muted)' : 'var(--active-bg)' }}
                    >
                      {locked ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5 text-white" />}
                      {locked ? (isAr ? 'لباقة برو فقط' : 'Pro only') : (isAr ? 'تثبيت الثيم' : 'Install Theme')}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!full ? (
        <p
          className="text-[11px] rounded-xl border px-3 py-2"
          style={{
            background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5 inline me-1" style={{ color: 'var(--accent)' }} />
          {isAr
            ? 'الباقة الأساسية: تتضمن ثيم التجارة الإلكترونية الافتراضي. قم بالترقية إلى باقة برو للحصول على كافة الثيمات والتصاميم الحصرية.'
            : 'Basic Plan: Includes default Commerce Theme. Upgrade to Pro for the complete Unityteck Theme Store catalog.'}
        </p>
      ) : null}
    </div>
  );
};

/** Small badge for App Store chrome */
export const AppStoreBrand: React.FC<{ subtitle?: string }> = ({ subtitle }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="w-9 h-9 rounded-2xl text-white flex items-center justify-center shadow-md shrink-0"
        style={{ background: 'var(--portal-cta)' }}
      >
        <Palette className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
          {isAr ? 'متجر تطبيقات وثيمات يونيتك' : 'Unityteck App Store'}
        </h1>
        <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
          {subtitle || (isAr ? 'سوق الثيمات والتطبيقات والإضافات المعتمدة' : 'Themes Store · Apps & plugins — our own marketplace')}
        </p>
      </div>
    </div>
  );
};
