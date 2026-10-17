import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  RotateCcw,
  ExternalLink,
  Search,
  CheckCircle2,
  Sparkles,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Building2,
  Palette,
  FolderTree,
  SlidersHorizontal,
  Video,
  LayoutGrid,
  Grid,
  Link2,
  Megaphone,
  BookOpen,
  Award,
  ShoppingBag,
  Percent,
  BarChart2,
  FileText,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { THEME_SECTIONS } from '../themeSettings/ThemeSettingsMaster';

// 18 Settings Forms
import { StoreIdentityForm } from '../themeSettings/StoreIdentityForm';
import { GeneralOptionsForm } from '../themeSettings/GeneralOptionsForm';
import { StoreColorsForm } from '../themeSettings/StoreColorsForm';
import { CategoryCartCustomerForm } from '../themeSettings/CategoryCartCustomerForm';
import { AdvancedSliderForm } from '../themeSettings/AdvancedSliderForm';
import { ProductVideosForm } from '../themeSettings/ProductVideosForm';
import { ProductTabsForm } from '../themeSettings/ProductTabsForm';
import { DetailedProductsForm } from '../themeSettings/DetailedProductsForm';
import { ImageGridForm } from '../themeSettings/ImageGridForm';
import { CustomLinksForm } from '../themeSettings/CustomLinksForm';
import { BannersForm } from '../themeSettings/BannersForm';
import { BlogForm } from '../themeSettings/BlogForm';
import { AnnouncementBarForm } from '../themeSettings/AnnouncementBarForm';
import { EnhancedFeaturesForm } from '../themeSettings/EnhancedFeaturesForm';
import { ProductCardsForm } from '../themeSettings/ProductCardsForm';
import { CustomProductsForm } from '../themeSettings/CustomProductsForm';
import { SpecialOfferCountdownForm } from '../themeSettings/SpecialOfferCountdownForm';
import { StoreStatisticsForm } from '../themeSettings/StoreStatisticsForm';

export interface WordPressThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSectionId?: string | null;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const WordPressThemeCustomizer: React.FC<WordPressThemeCustomizerProps> = ({
  isOpen,
  onClose,
  initialSectionId = null,
}) => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeSectionId, setActiveSectionId] = useState<string | null>(initialSectionId);
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync section if initialSectionId changes
  useEffect(() => {
    if (initialSectionId) {
      setActiveSectionId(initialSectionId);
    }
  }, [initialSectionId]);

  // Keyboard shortcut to close (ESC)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeSectionId) {
          setActiveSectionId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeSectionId, onClose]);

  // Reload iframe preview
  const handleRefreshPreview = () => {
    setIframeKey((prev) => prev + 1);
    toast(isAr ? 'تم تحديث المعاينة المباشرة' : 'Live preview refreshed', 'info');
  };

  // Resolve store slug for iframe preview URL
  const storeSlug = useMemo(() => {
    return (
      activeStore?.slug ||
      (activeStore?.id === 'store-coffee'
        ? 'coffee'
        : activeStore?.id === 'store-bleco'
        ? 'bleco'
        : 'flowers')
    );
  }, [activeStore]);

  const previewUrl = useMemo(() => {
    return `/?store=${encodeURIComponent(storeSlug)}&fullscreen=1&preview=1`;
  }, [storeSlug]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return THEME_SECTIONS;
    const q = searchQuery.toLowerCase();
    return THEME_SECTIONS.filter(
      (s) =>
        s.titleEn.toLowerCase().includes(q) ||
        s.titleAr.includes(q) ||
        s.descEn.toLowerCase().includes(q) ||
        s.num.includes(q),
    );
  }, [searchQuery]);

  const activeSection = useMemo(() => {
    return THEME_SECTIONS.find((s) => s.id === activeSectionId);
  }, [activeSectionId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex overflow-hidden select-none bg-slate-900 text-slate-100 font-sans"
      style={{ fontFamily: 'var(--font-ui, system-ui, sans-serif)' }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* LEFT SIDEBAR: WORDPRESS-STYLE THEME CUSTOMIZER CONTROLS (~380px)            */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <aside
        className={`flex flex-col shrink-0 border-e border-slate-700 bg-slate-900 text-slate-100 transition-[width,transform] duration-200 z-20 ${
          sidebarCollapsed ? '-ms-[380px] md:-ms-[400px]' : 'w-full sm:w-[380px] md:w-[410px]'
        }`}
      >
        {/* Top Header Bar (WordPress-style: Close, Back, Section Title, Published state) */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Close Button (X) */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer transition-colors"
              title={isAr ? 'إغلاق والعودة للوحة التحكم' : 'Close Customizer (Esc)'}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Back Button (<) if a sub-section is active */}
            {activeSection && (
              <button
                type="button"
                onClick={() => setActiveSectionId(null)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                title={isAr ? 'العودة لقائمة الأقسام' : 'Back to Sections'}
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
            )}

            {/* Breadcrumb Title */}
            <div className="min-w-0 ps-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {isAr ? 'تخصيص الثيم' : 'Customizing'}
              </div>
              <div className="text-xs font-black truncate max-w-[190px] text-slate-100">
                {activeSection ? (isAr ? activeSection.titleAr : activeSection.titleEn) : (isAr ? 'هوية ومظهر المتجر' : 'Active Theme')}
              </div>
            </div>
          </div>

          {/* Published / Live Status Badge */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isAr ? 'منشور حي' : 'Published'}</span>
            </span>
          </div>
        </div>

        {/* Sidebar Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-3 bg-slate-900 text-slate-100">
          {/* ROOT LEVEL: All 18 Sections Accordion List (Like WordPress Customize Menu) */}
          {!activeSection && (
            <div className="space-y-3">
              {/* Store & Theme Identity Header Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800/70 to-slate-950 border border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                    {activeStore.id}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {THEME_SECTIONS.length} {isAr ? 'شاشات تحكم' : 'Sections'}
                  </span>
                </div>
                <h3 className="text-sm font-black text-white">
                  {(isAr ? activeStore.nameAr : activeStore.nameEn) || activeStore.name}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isAr
                    ? 'اختر أي قسم لتعديل النصوص، الشعار، الألوان، البانرات، والسلايدر ومشاهدة التغيير مباشرة على اليمين.'
                    : 'Select any panel to customize identity, colors, banners, sliders and see live instant updates.'}
                </p>
              </div>

              {/* Quick Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute start-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث في أقسام التخصيص…' : 'Search sections…'}
                  className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* 18 Sections Clickable Navigation List (WordPress Customizer Style) */}
              <div className="space-y-1.5 pt-1">
                {filteredSections.map((sec) => {
                  const SIcon = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveSectionId(sec.id)}
                      className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between text-start cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-bold shrink-0 group-hover:scale-105 transition-transform">
                          <SIcon className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                            {sec.num}. {isAr ? sec.titleAr : sec.titleEn}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[240px]">
                            {isAr ? sec.descAr : sec.descEn}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 rtl:rotate-180 shrink-0 ms-1" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-PANEL LEVEL: Render the Active Customizer Section Form */}
          {activeSection && (
            <div className="space-y-4">
              {/* Active Section Info Notice */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{activeSection.num}. {isAr ? activeSection.titleAr : activeSection.titleEn}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isAr ? activeSection.descAr : activeSection.descEn}
                </p>
              </div>

              {/* Theme Settings Form Components inside Customizer (styled for dark panel) */}
              <div className="theme-customizer-form-shell text-xs">
                {activeSection.id === '01_store_identity' && <StoreIdentityForm />}
                {activeSection.id === '02_general_options' && <GeneralOptionsForm />}
                {activeSection.id === '03_store_colors' && <StoreColorsForm />}
                {activeSection.id === '04_category_cart_customer' && <CategoryCartCustomerForm />}
                {activeSection.id === '05_advanced_slider' && <AdvancedSliderForm />}
                {activeSection.id === '06_product_videos' && <ProductVideosForm />}
                {activeSection.id === '07_product_tabs' && <ProductTabsForm />}
                {activeSection.id === '08_detailed_products' && <DetailedProductsForm />}
                {activeSection.id === '09_image_grid' && <ImageGridForm />}
                {activeSection.id === '10_custom_links' && <CustomLinksForm />}
                {activeSection.id === '11_banners' && <BannersForm />}
                {activeSection.id === '12_blog' && <BlogForm />}
                {activeSection.id === '13_announcement_bar' && <AnnouncementBarForm />}
                {activeSection.id === '14_enhanced_features' && <EnhancedFeaturesForm />}
                {activeSection.id === '15_product_cards' && <ProductCardsForm />}
                {activeSection.id === '16_custom_products' && <CustomProductsForm />}
                {activeSection.id === '17_special_offer_countdown' && <SpecialOfferCountdownForm />}
                {activeSection.id === '18_store_statistics' && <StoreStatisticsForm />}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar: Device Switcher (Desktop, Tablet, Mobile) & Hide Controls (Exact WordPress Style) */}
        <div className="h-12 px-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs shrink-0">
          {/* Hide Controls Button */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
            title={isAr ? 'إخفاء لوحة التحكم' : 'Hide Controls'}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            <span className="hidden sm:inline text-[11px]">
              {isAr ? 'إخفاء اللوحة' : 'Hide Controls'}
            </span>
          </button>

          {/* Device Viewport Icons (Desktop, Tablet, Mobile) */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                device === 'desktop' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title={isAr ? 'معاينة شاشة سطح المكتب' : 'Desktop View'}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                device === 'tablet' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title={isAr ? 'معاينة الآيباد / التابلت' : 'Tablet View'}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                device === 'mobile' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title={isAr ? 'معاينة الجوال' : 'Mobile View'}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Floating Toggle if Sidebar is Collapsed */}
      {sidebarCollapsed && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          className="fixed start-3 bottom-3 z-30 p-2.5 rounded-xl bg-slate-800 text-white border border-slate-700 shadow-xl hover:bg-slate-700 cursor-pointer flex items-center gap-2 text-xs font-bold"
          title={isAr ? 'إظهار لوحة التحكم' : 'Show Controls'}
        >
          <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'إظهار لوحة التخصيص' : 'Show Customizer'}</span>
        </button>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* RIGHT MAIN AREA: INTERACTIVE LIVE STOREFRONT PREVIEW                        */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden relative">
        {/* Preview Top Control Strip */}
        <div className="h-10 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-300">
              {isAr ? 'المعاينة المباشرة للمتجر' : 'Live Storefront Preview'}:
            </span>
            <span className="font-mono text-slate-500 truncate">{previewUrl}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh iframe button */}
            <button
              type="button"
              onClick={handleRefreshPreview}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              title={isAr ? 'إعادة تحميل المعاينة' : 'Refresh Preview'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Open in new tab button */}
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors flex items-center gap-1 text-[11px]"
              title={isAr ? 'فتح في نافذة جديدة' : 'Open live in new tab'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Device Viewport Canvas Container */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-slate-950/90">
          <div
            className={`h-full transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-white ${
              device === 'mobile'
                ? 'w-[390px] max-w-full ring-8 ring-slate-800 rounded-[38px]'
                : device === 'tablet'
                ? 'w-[768px] max-w-full ring-8 ring-slate-800 rounded-[28px]'
                : 'w-full max-w-[1440px]'
            }`}
            style={{ minHeight: device === 'mobile' ? '780px' : '600px' }}
          >
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={previewUrl}
              title="Storefront Live Customizer Preview"
              className="w-full h-full border-0 bg-white"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        </div>
      </main>
    </div>
  );
};
