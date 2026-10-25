import React, { useState, useMemo, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  Check,
  ExternalLink,
  Star,
  Lock,
  Sparkles,
  Palette,
  Layout,
  FileCode,
  Layers,
  CheckCircle2,
  Sliders,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  Zap,
  Plus,
  X,
  FilePlus,
  Globe,
  Copy,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { readAllThemeSettings, writeAllThemeSettings } from '../../themes/settings/themeSettingsStore';
import { planHasFullThemes, planInfoForStore } from '../../auth/plans';
import { DEFAULT_COMMERCE_THEME_ID, defaultThemeSettings, getDefaultStoreTheme } from '../../auth/defaultTheme';
import { useToast } from '../common/ToastProvider';
import { StoreIdentityForm } from './themeSettings/StoreIdentityForm';
import { ThemeSettingsMaster } from './themeSettings/ThemeSettingsMaster';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import { handleImageError, isValidMediaUrl } from '../../utils/imageFallback';
import { preloadVisualThemeBuilder } from './visualBuilder/preloadVisualBuilder';
import { ThemeBuilderLoadingShell } from './visualBuilder/ThemeBuilderLoadingShell';

const VisualThemeBuilder = React.lazy<React.ComponentType<any>>(() =>
  preloadVisualThemeBuilder().then((m: any) => ({ default: m.VisualThemeBuilder }))
);
import {
  HOMEPAGE_TEMPLATES,
  ALL_PAGE_TEMPLATES,
  getStoreActivePageTemplates,
  setStoreActivePageTemplate,
  type HomepageTemplateItem,
  type PageCategoryTemplate,
} from './themeTemplates/templateData';

interface StoreThemesProps {
  onOpenStorefront?: () => void;
  onCustomizeTheme?: (targetThemeId?: string, targetPage?: string) => void;
  onOpenThemeCustomizer?: (sectionId?: string) => void;
}

export const StoreThemes: React.FC<StoreThemesProps> = ({
  onOpenStorefront,
  onCustomizeTheme,
  onOpenThemeCustomizer,
}) => {
  const {
    activeStore,
    themes,
    storeActiveTheme,
    setStoreTheme,
    storeActiveHomepage,
    setStoreHomepageStyle,
    createStoreTheme,
    duplicateStoreTheme,
    deleteStoreTheme,
  } = useTenant();
  const { toast } = useToast();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [isCreateThemeModalOpen, setIsCreateThemeModalOpen] = useState(false);
  const [newThemeNameAr, setNewThemeNameAr] = useState('');
  const [newThemeNameEn, setNewThemeNameEn] = useState('');
  const [newThemeCategoryAr, setNewThemeCategoryAr] = useState('');
  const [newThemeTaglineAr, setNewThemeTaglineAr] = useState('');
  const [newThemeColor, setNewThemeColor] = useState(activeStore.accentColor || '#059669');

  const handleCreateCustomTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeNameAr.trim() && !newThemeNameEn.trim()) {
      toast(isAr ? 'يرجى إدخال اسم الثيم' : 'Please enter theme name', 'error');
      return;
    }
    const created = createStoreTheme(activeStore.id, {
      name: newThemeNameAr.trim() || newThemeNameEn.trim(),
      nameAr: newThemeNameAr.trim() || newThemeNameEn.trim(),
      nameEn: newThemeNameEn.trim() || newThemeNameAr.trim(),
      category: newThemeCategoryAr.trim() || activeStore.category || 'متجر مخصص',
      categoryAr: newThemeCategoryAr.trim() || activeStore.category || 'متجر مخصص',
      categoryEn: 'Custom Store Theme',
      tagline: newThemeTaglineAr.trim() || `ثيم مخصص حصرياً لمتجر ${activeStore.name}`,
      taglineAr: newThemeTaglineAr.trim() || `ثيم مخصص حصرياً لمتجر ${activeStore.name}`,
      taglineEn: `Exclusive custom theme for ${activeStore.name}`,
      previewColor: newThemeColor,
      thumbnail: activeStore.logo && isValidMediaUrl(activeStore.logo) ? activeStore.logo : '/theme-mockups/real_storefront_fullpage.png',
      badge: isAr ? 'ثيم خاص بالمتجر' : 'Private Store Theme',
      badgeAr: 'ثيم خاص بالمتجر',
      badgeEn: 'Private Store Theme',
      homepageStyles: ['Default Commerce', 'Eid Home', 'Ramadan Home', 'Valentine Home'],
      tier: 'full',
      activeStoresCount: 1,
      isDefault: false,
      rating: 5.0,
    });
    toast(
      isAr
        ? `تم إنشاء الثيم الجديد "${created.name}" لمتجرك بنجاح!`
        : `New private theme "${created.name}" created for your store!`,
      'success',
    );
    setIsCreateThemeModalOpen(false);
    setNewThemeNameAr('');
    setNewThemeNameEn('');
    setNewThemeCategoryAr('');
    setNewThemeTaglineAr('');
  };

  const [activeTab, setActiveTab] = useState<'theme-settings' | 'homepages' | 'pages' | 'catalog'>('theme-settings');
  const [selectedPageKey, setSelectedPageKey] = useState<string>('product');
  const [activePageTemplates, setActivePageTemplates] = useState<Record<string, string>>({});
  const [isVisualBuilderOpen, setIsVisualBuilderOpen] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      const params = new URLSearchParams(window.location.search);
      if (params.get('builder') === '1' || params.get('builder') === 'true') {
        return true;
      }
      return sessionStorage.getItem('unityteck_visual_builder_open') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    preloadVisualThemeBuilder();
  }, []);
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [isCreatePageModalOpen, setIsCreatePageModalOpen] = useState(false);
  const [newPageTitleAr, setNewPageTitleAr] = useState('');
  const [newPageTitleEn, setNewPageTitleEn] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageLayout, setNewPageLayout] = useState('standard');
  const [newPageAddToNav, setNewPageAddToNav] = useState(true);

  const handleCreateCustomPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitleAr.trim() && !newPageTitleEn.trim()) {
      toast(isAr ? 'يرجى إدخال عنوان الصفحة' : 'Please enter page title', 'error');
      return;
    }
    const slug = newPageSlug.trim() || `page-${Date.now().toString().slice(-4)}`;
    const full = readAllThemeSettings(activeStore.id, activeStore);
    if (newPageAddToNav) {
      const currentNav = full.general.customNavigationMenu || [];
      full.general.customNavigationMenu = [
        ...currentNav,
        {
          id: `custom-${Date.now().toString().slice(-4)}`,
          labelAr: newPageTitleAr.trim() || newPageTitleEn.trim(),
          labelEn: newPageTitleEn.trim() || newPageTitleAr.trim(),
          url: slug,
          type: 'page',
          active: true,
          isMegaMenu: false,
        },
      ];
      writeAllThemeSettings(activeStore.id, full);
      window.dispatchEvent(new CustomEvent('unityteck-theme-settings'));
    }
    toast(
      isAr
        ? `تم إنشاء الصفحة "${newPageTitleAr || newPageTitleEn}" وربطها بالمتجر بنجاح!`
        : `Custom page "${newPageTitleEn || newPageTitleAr}" created and linked to store!`,
      'success',
    );
    setIsCreatePageModalOpen(false);
  };

  const fullAccess = planHasFullThemes(activeStore);
  const planInfo = planInfoForStore(activeStore);
  const pack = useMemo(
    () =>
      defaultThemeSettings(planInfo.code, {
        name: activeStore.name,
        accentColor: activeStore.accentColor,
        logo: activeStore.logo,
      }),
    [planInfo.code, activeStore.name, activeStore.accentColor, activeStore.logo],
  );

  // Load stored page templates for this store
  useEffect(() => {
    if (activeStore?.id) {
      const stored = getStoreActivePageTemplates(activeStore.id);
      setActivePageTemplates(stored);
    }
  }, [activeStore?.id]);

  const currentThemeId = storeActiveTheme[activeStore.id] || getDefaultStoreTheme(activeStore.id);
  const currentStyle = storeActiveHomepage[activeStore.id] || pack.homepage_style;

  const isCarStore =
    activeStore.id === 'store-bleco' ||
    activeStore.slug === 'bleco-sa' ||
    activeStore.slug?.includes('car') ||
    activeStore.slug?.includes('transport') ||
    currentThemeId === 'theme-saudia-transport';

  const isCoffeeStore =
    !isCarStore &&
    (activeStore.id === 'store-coffee' ||
      activeStore.slug === 'coffee-store' ||
      activeStore.slug?.includes('coffee') ||
      activeStore.category?.includes('قهوة') ||
      currentThemeId?.includes('coffee'));

  const storeSlug = isCarStore ? 'car' : isCoffeeStore ? 'coffee' : 'hadaya';
  const localStorefrontUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?store=${storeSlug}&fullscreen=1`;

  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const liveStoreLabel = isCarStore
    ? (isAr ? 'متجر السيارات (محلي)' : 'Car Store (Local)')
    : isCoffeeStore
      ? (isAr ? 'متجر القهوة (محلي)' : 'Coffee Store (Local)')
      : (activeStore.custom_domain || activeStore.domain || 'giftshop-sa.com');

  const liveStoreHref = (isCarStore || isCoffeeStore || isLocalHost)
    ? localStorefrontUrl
    : (activeStore.custom_domain ? `https://${activeStore.custom_domain}/` : 'https://giftshop-sa.com/');

  const [builderThemeId, setBuilderThemeId] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const q = new URLSearchParams(window.location.search).get('themeId');
        if (q && !q.includes('[object') && q !== 'undefined' && q !== 'null') return q.trim();
        const saved = sessionStorage.getItem(`unityteck_visual_builder_theme_${activeStore.id}`) || sessionStorage.getItem('unityteck_visual_builder_theme');
        if (saved && !saved.includes('[object') && saved !== 'undefined' && saved !== 'null') return saved.trim();
      }
    } catch {}
    return currentThemeId;
  });

  // Keep builder theme dynamic when active store changes
  useEffect(() => {
    setBuilderThemeId(currentThemeId);
  }, [currentThemeId, activeStore.id]);

  const openVisualBuilder = (targetThemeId?: string) => {
    preloadVisualThemeBuilder();
    const cleanTarget =
      typeof targetThemeId === 'string' &&
      targetThemeId.trim() &&
      !targetThemeId.includes('[object') &&
      targetThemeId !== 'undefined' &&
      targetThemeId !== 'null'
        ? targetThemeId.trim()
        : undefined;

    const tid = cleanTarget || currentThemeId;
    if (onCustomizeTheme) {
      onCustomizeTheme(tid);
      return;
    }

    if (tid) setBuilderThemeId(tid);
    setIsVisualBuilderOpen(true);
    try {
      sessionStorage.setItem('unityteck_visual_builder_open', '1');
      if (tid) {
        sessionStorage.setItem(`unityteck_visual_builder_theme_${activeStore.id}`, tid);
        sessionStorage.setItem('unityteck_visual_builder_theme', tid);
      }
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('builder', '1');
        if (tid) url.searchParams.set('themeId', tid);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  };

  const closeVisualBuilder = () => {
    setIsVisualBuilderOpen(false);
    try {
      sessionStorage.removeItem('unityteck_visual_builder_open');
      sessionStorage.removeItem('unityteck_visual_builder_theme');
      sessionStorage.removeItem('unityteck_visual_builder_page');
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('builder');
        url.searchParams.delete('themeId');
        url.searchParams.delete('builderPage');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  };

  const visibleThemes = useMemo(() => {
    return themes;
  }, [themes]);

  const handlePurgeCache = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('unityteck_') || k.startsWith('selia_') || k.includes('theme') || k.includes('cache'))) {
          if (!k.includes('token') && !k.includes('session')) {
            keysToRemove.push(k);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
      window.dispatchEvent(new CustomEvent('unityteck-theme-settings'));
      window.dispatchEvent(new CustomEvent('unityteck-data', { detail: { tag: `store:${activeStore.id}:all` } }));
      toast(
        isAr
          ? 'تم تنظيف الكاش والذاكرة المؤقتة بنجاح وتحديث كافة بيانات المتجر!'
          : 'Old cache purged successfully! Fresh live data reloaded.',
        'success',
      );
    } catch {
      toast('Cache cleared', 'success');
    }
  };

  const stylesForTheme = (themeId: string, allStyles: string[]) => {
    if (fullAccess) return allStyles;
    if (themeId === DEFAULT_COMMERCE_THEME_ID) return pack.homepage_styles;
    return allStyles.slice(0, 1);
  };

  const activateThemeAndStyle = (themeId: string, style: string) => {
    if (!fullAccess && themeId !== DEFAULT_COMMERCE_THEME_ID) {
      toast('Upgrade to Pro (or ask Master for Pro grant) to unlock the full theme catalog.', 'error');
      return;
    }
    setStoreTheme(activeStore.id, themeId);
    setStoreHomepageStyle(activeStore.id, style);
    toast(
      fullAccess
        ? isAr
          ? 'تم تفعيل القالب المختار بنجاح على المتجر!'
          : 'Full theme pack applied. Live storefront updated!'
        : isAr
          ? 'تم تفعيل القالب الافتراضي بنجاح.'
          : 'Basic ecommerce theme active.',
      'success',
    );
  };

  const handleSelectHomepageTemplate = (template: HomepageTemplateItem) => {
    // Determine target theme (coffee, makkah royal for seasonal, default for basic)
    const targetThemeId =
      template.category === 'Coffee'
        ? 'theme-coffee'
        : template.category === 'Default'
        ? DEFAULT_COMMERCE_THEME_ID
        : 'theme-makkah-royal';
    setStoreTheme(activeStore.id, targetThemeId);
    setStoreHomepageStyle(activeStore.id, template.styleKey);
    toast(
      isAr
        ? `تم تفعيل قالب الواجهة الرئيسية: ${template.nameAr}`
        : `Activated Homepage Template: ${template.name}! Active on live store.`,
      'success',
    );
  };

  const handleSelectPageVariation = (pageKey: string, variationId: string, variationName: string) => {
    const updated = setStoreActivePageTemplate(activeStore.id, pageKey, variationId);
    setActivePageTemplates({ ...updated });
    toast(
      isAr
        ? `تم تفعيل نموذج الصفحة: ${variationName}`
        : `Applied template "${variationName}" to live storefront!`,
      'success',
    );
  };

  const selectedCategoryTemplate = useMemo(() => {
    return ALL_PAGE_TEMPLATES.find((p) => p.key === selectedPageKey) || ALL_PAGE_TEMPLATES[0];
  }, [selectedPageKey]);

  const filteredPageCategories = useMemo(() => {
    if (!pageSearchQuery.trim()) return ALL_PAGE_TEMPLATES;
    const q = pageSearchQuery.toLowerCase();
    return ALL_PAGE_TEMPLATES.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.titleAr.includes(q) ||
        p.variations.some((v) => v.name.toLowerCase().includes(q) || v.nameAr.includes(q)),
    );
  }, [pageSearchQuery]);

  return (
    <div
      className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto"
      style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
    >
      {/* Top Banner & Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {isAr ? 'منشئ الثيمات والقوالب البصرية' : 'Theme & Design Builder'}
            </h1>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
              style={{
                background: fullAccess
                  ? 'color-mix(in srgb, var(--tone-violet) 14%, var(--surface))'
                  : 'color-mix(in srgb, var(--accent) 14%, var(--surface))',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              {fullAccess ? (
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" style={{ color: 'var(--tone-violet)' }} /> Pro Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" style={{ color: 'var(--accent)' }} /> Free Plan
                </span>
              )}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `متجرك: ${getStoreDisplayName(activeStore, 'ar')} · القالب الفعال: ${currentStyle} · بيانات متصلة حقيقية بالكامل`
              : `Store: ${getStoreDisplayName(activeStore, 'en')} · Active Style: ${currentStyle} · Zero fake data, fully dynamic`}
          </p>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Visual Builder Trigger */}
          <button
            type="button"
            onClick={() => openVisualBuilder()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            }}
          >
            <Palette className="w-4 h-4" />
            <span>{isAr ? 'محرر التصميم البصري' : 'Visual Design Editor'}</span>
          </button>

          {/* Live Storefront Direct Link */}
          <a
            href={liveStoreHref}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] shadow-xs"
            style={{
              background: isCarStore
                ? 'linear-gradient(135deg, rgba(18, 123, 254, 0.15), rgba(13, 98, 204, 0.08))'
                : 'linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(6, 78, 59, 0.05))',
              borderColor: isCarStore ? '#127bfe' : 'var(--accent)',
              color: isCarStore ? '#127bfe' : 'var(--accent)',
            }}
            title={isAr ? `زيارة المتجر المباشر: ${liveStoreLabel}` : `Visit Live Storefront: ${liveStoreLabel}`}
          >
            <Globe className={`w-4 h-4 ${isCarStore ? 'text-[#127bfe]' : 'text-emerald-500'}`} />
            <span>{liveStoreLabel}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>

          {/* Open in New Tab Button */}
          <a
            href={localStorefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
            style={{
              background: 'var(--hover-bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            title={isAr ? 'فتح المتجر في نافذة مستقلة جديدة (محلي)' : 'Open in New Tab (Local)'}
          >
            <ExternalLink className={`w-4 h-4 ${isCarStore ? 'text-[#127bfe]' : 'text-emerald-500'}`} />
            <span>{isAr ? 'فتح في نافذة جديدة' : 'Open in New Tab'}</span>
          </a>

          {/* Purge Old Cache & Refresh */}
          <button
            type="button"
            onClick={handlePurgeCache}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer hover:bg-amber-50 hover:text-amber-800 hover:border-amber-400"
            style={{
              background: 'var(--hover-bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            title={isAr ? 'حذف الكاش القديم وتحديث البيانات فوراً' : 'Purge Old Cache & Live Refresh'}
          >
            <RefreshCw className="w-4 h-4 text-amber-500" />
            <span>{isAr ? 'تنظيف الكاش وتحديث' : 'Purge Cache'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {onOpenThemeCustomizer && (
          <button
            type="button"
            onClick={() => onOpenThemeCustomizer('01_store_identity')}
            className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shrink-0 active:scale-[0.98]"
            title={isAr ? 'فتح مخصص الثيم التفاعلي المباشر (WordPress Customizer)' : 'Launch Live WordPress Customizer'}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{isAr ? 'فتح مخصص الثيم المباشر (WordPress Style)' : 'Launch Live Customizer'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('theme-settings')}
          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0"
          style={
            activeTab === 'theme-settings'
              ? { background: 'var(--portal-cta)', color: '#ffffff' }
              : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
          }
        >
          <Palette className="w-3.5 h-3.5" />
          <span>{isAr ? 'إعدادات الثيم (١٨ شاشة تصميم كاملة)' : 'Theme Settings (All 18 Designs)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('homepages')}
          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0"
          style={
            activeTab === 'homepages'
              ? { background: 'var(--portal-cta)', color: '#ffffff' }
              : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
          }
        >
          <Layout className="w-3.5 h-3.5" />
          <span>{isAr ? 'قوالب الواجهة الرئيسية (٤)' : 'Homepage Templates (4)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0"
          style={
            activeTab === 'pages'
              ? { background: 'var(--portal-cta)', color: '#ffffff' }
              : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
          }
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isAr ? 'قوالب الصفحات الجاهزة (١٥ صفحة · ٤٨ تصميماً)' : 'Page Templates (15 Pages · 48 Designs)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0"
          style={
            activeTab === 'catalog'
              ? { background: 'var(--portal-cta)', color: '#ffffff' }
              : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
          }
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isAr ? 'كتالوج الثيمات وهوية المتجر' : 'Themes Catalog & Identity'}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 0: THEME SETTINGS (ALL 18 SECTIONS MOCKUPS)           */}
      {/* ======================================================== */}
      {activeTab === 'theme-settings' && (
        <ThemeSettingsMaster
          onOpenStorefront={onOpenStorefront}
          onOpenThemeCustomizer={onOpenThemeCustomizer}
        />
      )}

      {/* ======================================================== */}
      {/* TAB 1: HOMEPAGE TEMPLATES (4 READY DESIGNS)               */}
      {/* ======================================================== */}
      {activeTab === 'homepages' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
                {isAr ? 'اختر قالب الواجهة الرئيسية الجاهز' : 'Ready-Made Homepage Templates'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'اختر أي قالب واضغط تفعيل ليتم ربطه مباشرة مع متجرك الفعلي وبياناتك الحقيقية.'
                  : 'Select any template and click Activate to apply it instantly to your actual storefront with real database data.'}
              </p>
            </div>
            <div className="text-xs font-bold px-3 py-1 rounded-lg border"
              style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)', color: 'var(--accent)' }}>
              {isAr ? 'الستايل النشط حالياً:' : 'Active Style:'} {currentStyle}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {HOMEPAGE_TEMPLATES.map((tmpl) => {
              const isActive =
                currentStyle.toLowerCase().includes(tmpl.category.toLowerCase()) ||
                (tmpl.category === 'Default' && (currentStyle.includes('Default') || currentStyle.includes('Commerce')));

              return (
                <div
                  key={tmpl.id}
                  className="rounded-2xl border overflow-hidden flex flex-col justify-between transition-all group hover:shadow-xl"
                  style={{
                    background: 'var(--surface)',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                    boxShadow: isActive ? '0 10px 25px -5px rgba(5, 150, 105, 0.2)' : 'var(--card-shadow)',
                  }}
                >
                  <div>
                    {/* Visual UI Mockup Screenshot Frame with Hover Scroll */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-950 select-none border-b" style={{ borderColor: 'var(--border)' }}>
                      <img
                        src={(tmpl.thumbnail || '/theme-mockups/theme_flora_luxe_homepage_preview.svg').replace(/\.png$/, '.webp')}
                        alt={isAr ? tmpl.nameAr : tmpl.name}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, '/theme-mockups/theme_flora_luxe_homepage_preview.svg')}
                        className="w-full h-[540px] object-cover object-top transition-transform duration-[3500ms] ease-in-out group-hover:translate-y-[-58%]"
                      />

                      {/* Header Badge Overlay */}
                      <div className="absolute top-2.5 start-2.5 end-2.5 flex items-center justify-between z-10 pointer-events-none">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-950/80 text-white backdrop-blur-xs border border-white/20">
                          {isAr ? tmpl.badgeAr : tmpl.badge}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-md">
                            <Check className="w-3 h-3" />
                            {isAr ? 'نشط الآن' : 'Active'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Template Details */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                          {isAr ? tmpl.nameAr : tmpl.name}
                        </h3>
                        <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                          {tmpl.styleKey}
                        </p>
                      </div>

                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>
                        {isAr ? tmpl.taglineAr : tmpl.tagline}
                      </p>

                      <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'الميزات المضمنة:' : 'Included Sections:'}
                        </span>
                        {(isAr ? tmpl.featuresAr : tmpl.features).slice(0, 3).map((feat, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Activation Button */}
                  <div
                    className="p-3 border-t flex items-center justify-between gap-2"
                    style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
                  >
                    <button
                      type="button"
                      onClick={() => openVisualBuilder(currentThemeId)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-muted hover:text-text transition-colors cursor-pointer"
                    >
                      {isAr ? 'تخصيص' : 'Customize'}
                    </button>

                    {isActive ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        {isAr ? 'المفعل على المتجر' : 'Active on Store'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectHomepageTemplate(tmpl)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ background: 'var(--portal-cta)' }}
                      >
                        {isAr ? 'اختيار وتفعيل' : 'Select & Activate'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PAGE TEMPLATES (15 PAGES · 48 DESIGNS)             */}
      {/* ======================================================== */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
                {isAr ? 'نماذج وقوالب الصفحات الداخلية (١٥ صفحة)' : 'Ready Inner Page Templates (15 Core Pages)'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'لكل صفحة أساسية ٣ إلى ٤ تصاميم جاهزة. اختر النموذج المطلوب وسيعمل فوراً على المتجر مع بيانات حقيقية.'
                  : 'Every essential page has 3 to 4 ready-made layouts. Click Activate to link it immediately to your storefront.'}
              </p>
            </div>

            {/* Action Bar: Create Custom Page + Quick Search */}
            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setNewPageTitleAr('');
                  setNewPageTitleEn('');
                  setNewPageSlug(`page-${Date.now().toString().slice(-4)}`);
                  setIsCreatePageModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer shrink-0"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إنشاء صفحة مخصصة جديدة' : 'Create Custom Page'}</span>
              </button>

              <div className="relative w-full md:w-60">
                <Search className="w-4 h-4 absolute start-3 top-2.5" style={{ color: 'var(--muted)' }} />
                <input
                  type="text"
                  value={pageSearchQuery}
                  onChange={(e) => setPageSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث في الصفحات والتصاميم…' : 'Search pages…'}
                  className="w-full ps-9 pe-3 py-2 rounded-xl text-xs border outline-none transition-all"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 15 Page Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            {filteredPageCategories.map((page) => {
              const isSelected = page.key === selectedPageKey;
              const activeVariationId = activePageTemplates[page.key] || page.defaultVariationId;
              const activeVariation = page.variations.find((v) => v.id === activeVariationId);

              return (
                <button
                  key={page.key}
                  type="button"
                  onClick={() => setSelectedPageKey(page.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                  style={
                    isSelected
                      ? {
                          background: 'var(--accent)',
                          color: '#ffffff',
                        }
                      : {
                          background: 'var(--surface)',
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                          border: '1px solid var(--border)',
                        }
                  }
                >
                  <span>{isAr ? page.titleAr : page.title}</span>
                  {activeVariation && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Page Header & Variation Cards */}
          <div className="p-5 rounded-2xl border space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                  {isAr ? 'الصفحة المحددة حالياً' : 'Current Page'}
                </span>
                <h3 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? selectedCategoryTemplate.titleAr : selectedCategoryTemplate.title}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? selectedCategoryTemplate.descriptionAr : selectedCategoryTemplate.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'التصاميم الجاهزة:' : 'Available variations:'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedCategoryTemplate.variations.length} {isAr ? 'خيارات' : 'Designs'}
                </span>
              </div>
            </div>

            {/* Ready Variations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
              {selectedCategoryTemplate.variations.map((variation) => {
                const currentActiveId = activePageTemplates[selectedCategoryTemplate.key] || selectedCategoryTemplate.defaultVariationId;
                const isVariationActive = currentActiveId === variation.id;

                return (
                  <div
                    key={variation.id}
                    className="rounded-xl border overflow-hidden flex flex-col justify-between transition-all"
                    style={{
                      background: 'var(--surface)',
                      borderColor: isVariationActive ? 'var(--accent)' : 'var(--border)',
                      boxShadow: isVariationActive ? '0 8px 20px -4px rgba(5, 150, 105, 0.25)' : 'none',
                    }}
                  >
                    <div>
                      {/* Visual header */}
                      <div
                        className="h-28 p-3 text-white flex flex-col justify-between relative overflow-hidden"
                        style={{ background: variation.previewBg }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
                            {variation.styleTag}
                          </span>
                          {isVariationActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
                              <Check className="w-3 h-3" />
                              {isAr ? 'مطبق' : 'Active'}
                            </span>
                          )}
                          {!isVariationActive && variation.isPopular && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                              {isAr ? 'الأكثر طلباً' : 'Popular'}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight">
                            {isAr ? variation.nameAr : variation.name}
                          </h4>
                        </div>
                      </div>

                      {/* Content & bullet points */}
                      <div className="p-3.5 space-y-2.5">
                        <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>
                          {isAr ? variation.descriptionAr : variation.description}
                        </p>

                        <div className="space-y-1 pt-1.5 border-t" style={{ borderColor: 'var(--border)' }}>
                          {variation.highlights.slice(0, 3).map((hl, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text)' }}>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span className="truncate">{hl}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div
                      className="p-2.5 border-t flex items-center justify-between"
                      style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
                    >
                      <button
                        type="button"
                        onClick={() => openVisualBuilder()}
                        className="text-[11px] font-semibold text-muted hover:text-text cursor-pointer"
                      >
                        {isAr ? 'معاينة' : 'Preview'}
                      </button>

                      {isVariationActive ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          {isAr ? 'النموذج الفعال' : 'Active Template'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectPageVariation(
                              selectedCategoryTemplate.key,
                              variation.id,
                              isAr ? variation.nameAr : variation.name,
                            )
                          }
                          className="px-3 py-1 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ background: 'var(--portal-cta)' }}
                        >
                          {isAr ? 'تطبيق على المتجر' : 'Apply to Store'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: THEMES CATALOG & IDENTITY (PRIVATE STORE THEMES)   */}
      {/* ======================================================== */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Private Store Themes Isolation Banner */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)) 0%, var(--surface) 100%)',
              borderColor: 'var(--border)',
            }}
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
                  {isAr
                    ? `ثيمات متجر (${getStoreDisplayName(activeStore, 'ar')}) الخاصة`
                    : `${getStoreDisplayName(activeStore, 'en')} — Private Store Themes`}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'عزل كامل لكل متجر' : 'Strict Tenant Isolation'}</span>
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'كل متجر يمتلك ثيماته الخاصة به بالكامل ولا يمكن لأي متجر آخر رؤيتها أو استخدامها. تظل كافة ميزات لوحة التحكم والمحرر البصري متطابقة للجميع.'
                  : 'Every store has its own private themes. No other store can see or access them. All features (Dashboard, Visual Builder, 18 Theme Settings) are identical for everyone.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateThemeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] shrink-0"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إنشاء ثيم جديد للمتجر' : 'Create New Private Theme'}</span>
            </button>
          </div>

          {/* Phase 5.1 — Theme Settings 01 first */}
          <StoreIdentityForm />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {visibleThemes.map((theme) => {
              const isActive = theme.id === currentThemeId;
              const styles = stylesForTheme(theme.id, theme.homepageStyles);
              const themeTitle = isAr ? (theme.nameAr || theme.name) : (theme.nameEn || theme.name);
              const themeCategory = isAr ? (theme.categoryAr || theme.category) : (theme.categoryEn || theme.category);
              const themeTagline = isAr ? (theme.taglineAr || theme.tagline) : (theme.taglineEn || theme.tagline);

              return (
                <div
                  key={theme.id}
                  className="rounded-2xl border transition-all overflow-hidden flex flex-col justify-between group"
                  style={{
                    background: 'var(--surface)',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                    boxShadow: isActive ? '0 10px 30px -5px rgba(5, 150, 105, 0.25)' : 'var(--card-shadow)',
                  }}
                >
                  <div>
                    {/* Visual Screenshot Frame with Smooth Hover Scroll */}
                    <div className="relative h-64 w-full overflow-hidden bg-slate-950 select-none border-b" style={{ borderColor: 'var(--border)' }}>
                      <img
                        src={(theme.thumbnail || '/theme-mockups/real_storefront_fullpage.webp').replace(/\.png$/, '.webp')}
                        alt={themeTitle}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, '/theme-mockups/real_storefront_fullpage.png')}
                        className="w-full h-auto min-h-full block object-cover object-top transition-transform duration-[6000ms] ease-in-out group-hover:translate-y-[-60%]"
                      />

                      {/* Header Badges */}
                      <div className="absolute top-2.5 start-2.5 end-2.5 flex items-center justify-between z-10 pointer-events-none">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950/85 text-white backdrop-blur-xs border border-white/20 shadow-md">
                          {themeCategory}
                          {theme.isDefault ? (isAr ? ' · الأساسي' : ' · Primary') : ''}
                        </span>
                        {isActive ? (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-md">
                            <Check className="w-3 h-3" />
                            {isAr ? 'النشط الآن' : 'Active'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-700/80 text-white shadow-md">
                            {isAr ? 'ثيم متجرك' : 'Your Theme'}
                          </span>
                        )}
                      </div>

                      {/* Hover Overlay with "Details & Preview" button */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                        <button
                          type="button"
                          onClick={() => openVisualBuilder(theme.id)}
                          className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-black shadow-xl flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer border border-white/20"
                        >
                          <Eye className="w-4 h-4 text-emerald-400" />
                          <span>{isAr ? 'تفاصيل ومعاينة الثيم' : 'Details & Preview'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Theme Info */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-black leading-tight" style={{ color: 'var(--text)' }}>
                          {themeTitle}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{theme.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>
                        {themeTagline}
                      </p>

                      <div>
                        <label
                          className="block text-[10px] font-bold uppercase tracking-wider mb-1.5"
                          style={{ color: 'var(--muted)' }}
                        >
                          {isAr ? 'نماذج الواجهة المتوفرة:' : 'Homepage Styles:'}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {styles.map((style) => (
                            <button
                              key={style}
                              type="button"
                              onClick={() => activateThemeAndStyle(theme.id, style)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              style={
                                isActive && currentStyle === style
                                  ? { background: 'var(--active-bg)', color: 'var(--active-fg)' }
                                  : {
                                      background: 'var(--hover-bg)',
                                      color: 'var(--text)',
                                    }
                              }
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="p-3 border-t flex flex-wrap items-center justify-between gap-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--hover-bg)' }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => openVisualBuilder(theme.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] transition-all"
                        style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                        title={isAr ? `تخصيص ${theme.name} في المحرر البصري` : `Customize ${theme.name}`}
                      >
                        <Palette className="w-3.5 h-3.5 text-white" />
                        <span>{isAr ? 'تخصيص' : 'Customize'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openVisualBuilder(theme.id)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                        title={isAr ? 'معاينة الثيم' : 'Preview Theme'}
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isAr ? 'معاينة' : 'Preview'}</span>
                      </button>

                      {/* Duplicate Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const copy = duplicateStoreTheme(activeStore.id, theme.id);
                          toast(isAr ? `تم نسخ الثيم بنجاح: ${copy.name}` : `Theme duplicated: ${copy.name}`, 'success');
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                        title={isAr ? 'نسخ هذا الثيم' : 'Duplicate Theme'}
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">{isAr ? 'نسخ' : 'Clone'}</span>
                      </button>

                      {/* Delete Button (if more than 1 theme) */}
                      {visibleThemes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            deleteStoreTheme(activeStore.id, theme.id);
                            toast(isAr ? 'تم حذف الثيم بنجاح' : 'Theme deleted successfully', 'success');
                          }}
                          className="p-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-colors hover:bg-rose-50 text-rose-500 border-rose-200"
                          title={isAr ? 'حذف هذا الثيم' : 'Delete Theme'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => activateThemeAndStyle(theme.id, styles[0])}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer hover:opacity-90 shadow-2xs"
                          style={{
                            background: 'var(--surface)',
                            borderColor: 'var(--border)',
                            color: 'var(--text)',
                          }}
                        >
                          {isAr ? 'تفعيل الثيم' : 'Activate Theme'}
                        </button>
                      ) : (
                        <span className="text-xs font-bold flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-300 dark:border-emerald-800">
                          <Check className="w-3.5 h-3.5" />
                          <span>{isAr ? 'الثيم النشط' : 'Active'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ELEMENTOR-STYLE FULL SCREEN VISUAL BUILDER MODAL         */}
      {/* ======================================================== */}
      {!onCustomizeTheme && isVisualBuilderOpen && (
        <React.Suspense fallback={<ThemeBuilderLoadingShell />}>
          <VisualThemeBuilder
            isOpen={isVisualBuilderOpen}
            themeId={builderThemeId}
            onClose={closeVisualBuilder}
            onPublishSuccess={() => {
              closeVisualBuilder();
              toast(
                isAr ? 'تم نشر التعديلات بنجاح على المتجر المباشر!' : 'Changes published successfully to live store!',
                'success',
              );
            }}
          />
        </React.Suspense>
      )}

      {/* ======================================================== */}
      {/* CREATE NEW CUSTOM PAGE MODAL                             */}
      {/* ======================================================== */}
      {isCreatePageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-2xl relative"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <FilePlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {isAr ? 'إنشاء صفحة مخصصة جديدة للمتجر' : 'Create New Custom Page'}
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'صفحة جديدة مستقلة مع إمكانية إضافتها لشريط التنقل' : 'Add custom page with navigation menu integration'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePageModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomPage} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block">{isAr ? 'عنوان الصفحة (عربي) *' : 'Page Title (Arabic) *'}</label>
                  <input
                    type="text"
                    required
                    value={newPageTitleAr}
                    onChange={(e) => setNewPageTitleAr(e.target.value)}
                    placeholder={isAr ? 'مثال: عروض عيد الفطر ٢٠٢٦' : 'e.g. Eid Mubarak Offers'}
                    className="w-full px-3 py-2 rounded-xl border outline-none font-bold"
                    style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold block">{isAr ? 'عنوان الصفحة (إنجليزي)' : 'Page Title (English)'}</label>
                  <input
                    type="text"
                    value={newPageTitleEn}
                    onChange={(e) => setNewPageTitleEn(e.target.value)}
                    placeholder="e.g. Eid Festive Special 2026"
                    className="w-full px-3 py-2 rounded-xl border outline-none"
                    style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold block">{isAr ? 'مسار الرابط (Slug URL)' : 'URL Slug / Path'}</label>
                <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <span className="px-3 py-2 text-slate-400 bg-slate-100 dark:bg-slate-800 text-[11px] font-mono border-e" style={{ borderColor: 'var(--border)' }}>
                    /page/
                  </span>
                  <input
                    type="text"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value)}
                    placeholder="eid-festival-collection"
                    className="flex-1 px-3 py-2 outline-none font-mono text-xs"
                    style={{ background: 'var(--hover-bg)' }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold block">{isAr ? 'نموذج التخطيط المبدئي (Layout Type)' : 'Initial Layout Template'}</label>
                <select
                  value={newPageLayout}
                  onChange={(e) => setNewPageLayout(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border outline-none cursor-pointer"
                  style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
                >
                  <option value="standard">{isAr ? 'محتوى نصي وبانر تسويقي (Standard Banner & Story)' : 'Standard Banner & Story'}</option>
                  <option value="promo">{isAr ? 'صفحة هبوط تسويقية + شبكة منتجات (Promotional Landing + Products)' : 'Promotional Landing + Products'}</option>
                  <option value="story">{isAr ? 'قصة الماركة وهوية الزهور الفاخرة (Brand Showcase & Gallery)' : 'Brand Showcase & Gallery'}</option>
                  <option value="form">{isAr ? 'استفسارات خاصة وطلبيات الجملة (VIP Inquiries & Form)' : 'VIP Inquiries & Form'}</option>
                </select>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
                <input
                  type="checkbox"
                  checked={newPageAddToNav}
                  onChange={(e) => setNewPageAddToNav(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
                <div>
                  <span className="font-bold block">{isAr ? 'إضافة الصفحة تلقائياً إلى شريط التنقل العلوي (Navbar)' : 'Add automatically to Store Top Navigation Menu'}</span>
                  <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'ستظهر فوراً في هيدر المتجر والقائمة المنسدلة للعملاء' : 'Will appear instantly in storefront header and mobile menu drawer'}
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsCreatePageModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold hover:bg-slate-100 cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                >
                  {isAr ? 'حفظ وإنشاء الصفحة' : 'Save & Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATE NEW PRIVATE THEME MODAL                           */}
      {/* ======================================================== */}
      {isCreateThemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-2xl relative"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <Palette className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {isAr ? 'إنشاء ثيم جديد خاص بمتجرك' : 'Create New Private Theme'}
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? `سيتم حفظ هذا الثيم حصرياً لمتجر ${activeStore.name} ولن يظهر لأي متجر آخر`
                      : `This theme will be private to ${activeStore.name} and hidden from other stores`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateThemeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTheme} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block">{isAr ? 'اسم الثيم (عربي) *' : 'Theme Name (Arabic) *'}</label>
                  <input
                    type="text"
                    required
                    value={newThemeNameAr}
                    onChange={(e) => setNewThemeNameAr(e.target.value)}
                    placeholder={isAr ? 'مثال: ثيم الصيف والعروض الخاصة' : 'e.g. Summer Promo Theme'}
                    className="w-full px-3 py-2 rounded-xl border font-bold"
                    style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold block">{isAr ? 'اسم الثيم (إنجليزي)' : 'Theme Name (English)'}</label>
                  <input
                    type="text"
                    value={newThemeNameEn}
                    onChange={(e) => setNewThemeNameEn(e.target.value)}
                    placeholder="e.g. Summer Festive Edition"
                    className="w-full px-3 py-2 rounded-xl border"
                    style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold block">{isAr ? 'تصنيف الثيم' : 'Theme Category'}</label>
                <input
                  type="text"
                  value={newThemeCategoryAr}
                  onChange={(e) => setNewThemeCategoryAr(e.target.value)}
                  placeholder={isAr ? 'مثال: عروض موسمية، فخم، عصري' : 'e.g. Seasonal, Luxury, Minimal'}
                  className="w-full px-3 py-2 rounded-xl border"
                  style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold block">{isAr ? 'وصف موجز للثيم' : 'Theme Tagline'}</label>
                <textarea
                  rows={2}
                  value={newThemeTaglineAr}
                  onChange={(e) => setNewThemeTaglineAr(e.target.value)}
                  placeholder={isAr ? 'وصف مميزات وهوية الثيم الجديدة...' : 'Brief summary of the theme purpose...'}
                  className="w-full px-3 py-2 rounded-xl border"
                  style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold block">{isAr ? 'اللون الرئيسي للثيم' : 'Primary Accent Color'}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newThemeColor}
                    onChange={(e) => setNewThemeColor(e.target.value)}
                    className="w-9 h-9 rounded-xl cursor-pointer border-0 p-0"
                  />
                  <span className="font-mono text-xs">{newThemeColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateThemeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold hover:bg-slate-100 cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white cursor-pointer shadow-md transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                >
                  {isAr ? 'إنشاء وتضمين في المتجر' : 'Create & Add to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
