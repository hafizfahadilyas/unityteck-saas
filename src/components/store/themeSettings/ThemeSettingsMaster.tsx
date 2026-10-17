import React, { useState, useMemo } from 'react';
import {
  Palette,
  Sliders,
  FolderTree,
  SlidersHorizontal,
  Video,
  LayoutGrid,
  Sparkles,
  Grid,
  Link2,
  Image as ImageIcon,
  BookOpen,
  Megaphone,
  Award,
  ShoppingBag,
  Package,
  Percent,
  BarChart2,
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { StoreIdentityForm } from './StoreIdentityForm';
import { GeneralOptionsForm } from './GeneralOptionsForm';
import { StoreColorsForm } from './StoreColorsForm';
import { CategoryCartCustomerForm } from './CategoryCartCustomerForm';
import { AdvancedSliderForm } from './AdvancedSliderForm';
import { ProductVideosForm } from './ProductVideosForm';
import { ProductTabsForm } from './ProductTabsForm';
import { DetailedProductsForm } from './DetailedProductsForm';
import { ImageGridForm } from './ImageGridForm';
import { CustomLinksForm } from './CustomLinksForm';
import { BannersForm } from './BannersForm';
import { BlogForm } from './BlogForm';
import { AnnouncementBarForm } from './AnnouncementBarForm';
import { EnhancedFeaturesForm } from './EnhancedFeaturesForm';
import { ProductCardsForm } from './ProductCardsForm';
import { CustomProductsForm } from './CustomProductsForm';
import { SpecialOfferCountdownForm } from './SpecialOfferCountdownForm';
import { StoreStatisticsForm } from './StoreStatisticsForm';
import { ConnectedWorkspaceBanner } from '../../common/ConnectedWorkspaceBanner';

export interface ThemeSectionMeta {
  id: string;
  num: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  icon: React.ComponentType<{ className?: string }>;
  thumbnail: string;
  category: 'identity' | 'media' | 'products' | 'marketing';
}

export const THEME_SECTIONS: ThemeSectionMeta[] = [
  {
    id: '01_store_identity',
    num: '01',
    titleEn: 'Store Identity & Information',
    titleAr: 'هوية المتجر والمعلومات',
    descEn: 'Store name, logo, contacts, CR, VAT, and official Saudi registration',
    descAr: 'اسم المتجر، الشعار، التواصل، السجل التجاري، والرقم الضريبي',
    icon: Building2,
    thumbnail: '/theme-mockups/01_store_identity.png',
    category: 'identity',
  },
  {
    id: '02_general_options',
    num: '02',
    titleEn: 'Theme Design — General Options',
    titleAr: 'خيارات تصميم الثيم العامة',
    descEn: 'Arabic numerals, content protection, breadcrumbs, title styling & layout',
    descAr: 'الأرقام العربية، حماية المحتوى، مسار التصفح، وتنسيق الرأس والتذييل',
    icon: Sliders,
    thumbnail: '/theme-mockups/02_general_options.png',
    category: 'identity',
  },
  {
    id: '03_store_colors',
    num: '03',
    titleEn: 'Store Colors / Dark Mode',
    titleAr: 'ألوان المتجر والوضع الداكن',
    descEn: 'Dark mode switch, background palettes, text colors, loading screen & floating buttons',
    descAr: 'الوضع الداكن، لوحة الألوان، شاشة التحميل، والأزرار العائمة',
    icon: Palette,
    thumbnail: '/theme-mockups/03_store_colors.png',
    category: 'identity',
  },
  {
    id: '04_category_cart_customer',
    num: '04',
    titleEn: 'Category, Cart & Customer Pages',
    titleAr: 'صفحات التصنيفات والسلة والعميل',
    descEn: 'Auto-load products, category banners, enhanced cart, login & register styles',
    descAr: 'التحميل التلقائي، بانرات الأقسام، السلة المطورة، وستايل صفحات الدخول',
    icon: FolderTree,
    thumbnail: '/theme-mockups/04_category_cart_customer.png',
    category: 'products',
  },
  {
    id: '05_advanced_slider',
    num: '05',
    titleEn: 'Advanced Slider / Hero Banner',
    titleAr: 'سلايدر الواجهة المتقدم (Hero)',
    descEn: 'Hero slider with animations, slide manager, video/image slides, custom buttons',
    descAr: 'سلايدر الواجهة بالصور والفيديوهات والأزرار المتحركة والتحكم بالسرعة',
    icon: SlidersHorizontal,
    thumbnail: '/theme-mockups/05_advanced_slider.png',
    category: 'media',
  },
  {
    id: '06_product_videos',
    num: '06',
    titleEn: 'Product Videos (Selia)',
    titleAr: 'فيديوهات المنتجات التفاعلية',
    descEn: 'Short-form 9:16 vertical videos (Reels/TikTok) with play overlay and badges',
    descAr: 'فيديوهات طولية 9:16 للمنتجات مع زر تشغيل وشارات العروض الترويجية',
    icon: Video,
    thumbnail: '/theme-mockups/06_product_videos.png',
    category: 'media',
  },
  {
    id: '07_product_tabs',
    num: '07',
    titleEn: 'Product Tabs (Selia)',
    titleAr: 'تبويبات المنتجات المتعددة',
    descEn: 'Product collections in tabbed buttons (Best Selling, Latest, Discounts, Bridal)',
    descAr: 'عرض المنتجات في تبويبات تفاعلية للأكثر مبيعاً، الأحدث، والتخفيضات',
    icon: LayoutGrid,
    thumbnail: '/theme-mockups/07_product_tabs.png',
    category: 'products',
  },
  {
    id: '08_detailed_products',
    num: '08',
    titleEn: 'Detailed Products (Selia)',
    titleAr: 'بطاقة المنتج المفصلة الشاملة',
    descEn: 'Spotlight product showcase with gallery, stars rating, ticker, and instant Buy Now',
    descAr: 'عرض تفصيلي لمنتج الأسبوع مع معرض الصور، التقييم، وشريط الضمانات المتحرك',
    icon: Sparkles,
    thumbnail: '/theme-mockups/08_detailed_products.png',
    category: 'products',
  },
  {
    id: '09_image_grid',
    num: '09',
    titleEn: 'Image Grid / Bento (Selia)',
    titleAr: 'شبكة الصور البينتو التفاعلية',
    descEn: 'Bento layout, masonry, collage, geometric shapes & modern hover zoom effects',
    descAr: 'شبكة صور بتخطيط بينتو وماسونري وأشكال هندسية وتأثيرات تحويم فاخرة',
    icon: Grid,
    thumbnail: '/theme-mockups/09_image_grid.png',
    category: 'media',
  },
  {
    id: '10_custom_links',
    num: '10',
    titleEn: 'Custom Links & Categories',
    titleAr: 'الروابط المخصصة وتسوق بالأقسام',
    descEn: 'Shop by category visual cards with hover zooms, quick shop links & badges',
    descAr: 'بطاقات الأقسام والتصنيفات بأزرار شراء سريعة وتأثيرات تكبير ناعمة',
    icon: Link2,
    thumbnail: '/theme-mockups/10_custom_links.png',
    category: 'media',
  },
  {
    id: '11_banners',
    num: '11',
    titleEn: 'Banners & Promotions (Selia)',
    titleAr: 'البانرات الإعلانية الترويجية',
    descEn: 'Full-width animated banners with discount badges, arrows, and dark overlay',
    descAr: 'بانرات عريضة وشارات تخفيضات 30% مع أسهم تنقل وتحكم بالشفافية',
    icon: ImageIcon,
    thumbnail: '/theme-mockups/11_banners.png',
    category: 'media',
  },
  {
    id: '12_blog',
    num: '12',
    titleEn: 'Blog Articles & Stories',
    titleAr: 'المدونة والمقالات وقصص المتجر',
    descEn: 'Editorial cards with read time, publish dates, category pills & read more links',
    descAr: 'عرض مقالات المدونة، نصائح العناية، وأوقات القراءة لتعزيز الـ SEO',
    icon: BookOpen,
    thumbnail: '/theme-mockups/12_blog.png',
    category: 'marketing',
  },
  {
    id: '13_announcement_bar',
    num: '13',
    titleEn: 'Announcement Bar & Countdown',
    titleAr: 'شريط الإعلانات الترويجي والعد التنازلي',
    descEn: 'Marquee / rotating top alert bar with live ticking countdown boxes & Shop Now',
    descAr: 'شريط إعلانات علوي بمؤقت عد تنازلي حي 02:15:30 وزر شراء متحرك',
    icon: Megaphone,
    thumbnail: '/theme-mockups/13_announcement_bar.png',
    category: 'marketing',
  },
  {
    id: '14_enhanced_features',
    num: '14',
    titleEn: 'Enhanced Features / Trust Badges',
    titleAr: 'مزايا المتجر وبطاقات الثقة',
    descEn: '5 modern styles (Classic cards, floating, glass, timeline) for fast delivery & warranty',
    descAr: '٥ أنماط عصرية للشحن المبرد، الدفع الآمن، وخدمة العملاء 24/7',
    icon: Award,
    thumbnail: '/theme-mockups/14_enhanced_features.png',
    category: 'marketing',
  },
  {
    id: '15_product_cards',
    num: '15',
    titleEn: 'Product Cards Designer (Selia)',
    titleAr: 'مصمم بطاقات المنتجات المطور',
    descEn: 'Hover actions, wishlist, quick add, color swatches, stock alerts & flash countdown',
    descAr: 'بطاقات المنتجات بأزرار التحويم، نقاط الألوان، التقييم، وشارات التخفيض',
    icon: ShoppingBag,
    thumbnail: '/theme-mockups/15_product_cards.png',
    category: 'products',
  },
  {
    id: '16_custom_products',
    num: '16',
    titleEn: 'Custom Products Collection',
    titleAr: 'مجموعة المنتجات المخصصة',
    descEn: 'Featured collection slider with discounts, elegant serifs and clean cards',
    descAr: 'سلايدر التشكيلة المميزة بتصميم ناعم وشارات خصم 50%',
    icon: Package,
    thumbnail: '/theme-mockups/16_custom_products.png',
    category: 'products',
  },
  {
    id: '17_special_offer_countdown',
    num: '17',
    titleEn: 'Special Offer with Countdown',
    titleAr: 'العرض الخاص مع العد التنازلي',
    descEn: 'Hero promotional card with live countdown timer (Days/Hours/Mins/Secs) and trust notes',
    descAr: 'بانر عروض خاص بمؤقت عد تنازلي ضخم وشارات ثقة للشحن والدفع',
    icon: Percent,
    thumbnail: '/theme-mockups/17_special_offer_countdown.png',
    category: 'marketing',
  },
  {
    id: '18_store_statistics',
    num: '18',
    titleEn: 'Store Statistics (Selia)',
    titleAr: 'إحصائيات وأرقام المتجر',
    descEn: '5 styles (Glass, card, floating, stats bar) with animated counters (+500, +3K, etc.)',
    descAr: 'إبراز إنجازات المتجر بأرقام متحركة وتصاميم زجاجية وعائمة مذهلة',
    icon: BarChart2,
    thumbnail: '/theme-mockups/18_store_statistics.png',
    category: 'marketing',
  },
];

interface ThemeSettingsMasterProps {
  onOpenStorefront?: () => void;
  onOpenCustomizer?: (sectionId?: string) => void;
}

export const ThemeSettingsMaster: React.FC<ThemeSettingsMasterProps> = ({
  onOpenStorefront,
  onOpenCustomizer,
}) => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredSections = useMemo(() => {
    let list = THEME_SECTIONS;
    if (selectedFilter !== 'all') {
      list = list.filter((s) => s.category === selectedFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.titleEn.toLowerCase().includes(q) ||
          s.titleAr.includes(q) ||
          s.descEn.toLowerCase().includes(q) ||
          s.num.includes(q),
      );
    }
    return list;
  }, [selectedFilter, searchQuery]);

  const activeSection = useMemo(() => {
    return THEME_SECTIONS.find((s) => s.id === activeSectionId);
  }, [activeSectionId]);

  return (
    <div className="space-y-6">
      {/* ── Connected Local Project Workspace Banner ── */}
      <ConnectedWorkspaceBanner page="settings" />

      {/* If a section is selected, render the editor screen with navigation header */}
      {activeSection ? (
        <div className="space-y-4">
          {/* Section Breadcrumb & Controls Bar */}
          <div
            className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSectionId(null)}
                className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{isAr ? 'كافة صفحات التصميم (١٨)' : 'All 18 Sections'}</span>
              </button>

              <span className="text-xs text-muted font-mono">/</span>

              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                  {activeSection.num}
                </span>
                <span className="text-sm font-black">
                  {isAr ? activeSection.titleAr : activeSection.titleEn}
                </span>
              </div>
            </div>

            {/* Quick Switch Dropdown & Preview Button */}
            <div className="flex items-center gap-2.5">
              <select
                value={activeSection.id}
                onChange={(e) => setActiveSectionId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border outline-none cursor-pointer max-w-[220px]"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              >
                {THEME_SECTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.num}. {isAr ? s.titleAr : s.titleEn}
                  </option>
                ))}
              </select>

              {onOpenCustomizer && (
                <button
                  type="button"
                  onClick={() => onOpenCustomizer(activeSection.id)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer text-white shadow-xs hover:opacity-90 transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                    borderColor: '#10b981',
                  }}
                  title={isAr ? 'فتح هذا القسم داخل محرر التخصيص المباشر مثل ووردبريس' : 'Open in WordPress-Style Live Customizer'}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تخصيص حي (WP Style)' : 'Live Customizer'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (onOpenStorefront) {
                    onOpenStorefront();
                  } else if (typeof window !== 'undefined') {
                    const storeSlug = activeStore?.slug || (activeStore?.id === 'store-coffee' ? 'coffee' : activeStore?.id === 'store-bleco' ? 'bleco' : 'flowers');
                    window.open(`/?store=${storeSlug}&fullscreen=1`, '_blank');
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">{isAr ? 'معاينة المتجر' : 'Live Preview'}</span>
              </button>
            </div>
          </div>

          {/* Render the Active Component */}
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
      ) : (
        /* MAIN 18-SECTION BROWSER & THUMBNAIL GALLERY */
        <div className="space-y-6">
          {/* Top Banner & Search Filter */}
          <div
            className="p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <Palette className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-black tracking-tight">
                  {isAr ? 'حزمة إعدادات الثيم والتصميم (١٨ شاشة كاملة)' : 'Theme Settings UI/UX — Full 18 Design Screens'}
                </h2>
              </div>
              <p className="text-xs text-muted mt-1">
                {isAr
                  ? 'مطابقة بنسبة 100% لتصاميم Selia مع معاينات بصرية، حركات حديثة، وربط حي مع متجرك الفعلي'
                  : '100% same-to-same designs from Theme_Settings_UIUX with thumbnail views, animations & instant live sync'}
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute start-3 top-2.5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث في الشاشات الـ ١٨…' : 'Search in 18 design sections…'}
                className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', labelEn: 'All 18 Sections', labelAr: 'كافة الأقسام (١٨)' },
              { id: 'identity', labelEn: 'Identity & Colors', labelAr: 'الهوية والألوان' },
              { id: 'media', labelEn: 'Slider, Video & Banners', labelAr: 'السلايدر والفيديو والبانرات' },
              { id: 'products', labelEn: 'Products & Cards', labelAr: 'المنتجات والبطاقات' },
              { id: 'marketing', labelEn: 'Offers & Social Proof', labelAr: 'العروض والثقة والمدونة' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === f.id
                    ? 'bg-slate-900 text-white dark:bg-emerald-600'
                    : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-muted'
                }`}
              >
                {isAr ? f.labelAr : f.labelEn}
              </button>
            ))}
          </div>

          {/* 18 CARDS GRID WITH REAL IMAGE THUMBNAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
            {filteredSections.map((section) => {
              const IconComp = section.icon;

              return (
                <div
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className="group rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div>
                    {/* Visual Mockup Thumbnail Preview */}
                    <div className="relative aspect-16/10 overflow-hidden bg-slate-950 border-b" style={{ borderColor: 'var(--border)' }}>
                      <img
                        src={section.thumbnail}
                        alt={section.titleEn}
                        className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback if image fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

                      {/* Number Badge Top Left */}
                      <span className="absolute top-3 start-3 px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-md">
                        {section.num}
                      </span>

                      {/* View Indicator Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transform scale-95 group-hover:scale-100 transition-transform">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'فتح وتعديل' : 'Open & Edit'}</span>
                        </span>
                      </div>

                      {/* Title Bar Bottom */}
                      <div className="absolute bottom-3 start-3 end-3 text-white">
                        <h4 className="text-sm font-black drop-shadow-md">
                          {isAr ? section.titleAr : section.titleEn}
                        </h4>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 space-y-2">
                      <p className="text-xs text-muted leading-relaxed line-clamp-2">
                        {isAr ? section.descAr : section.descEn}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div
                    className="p-3 border-t flex items-center justify-between text-xs"
                    style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
                  >
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'جاهز ومتصل' : 'Connected & Ready'}</span>
                    </span>

                    <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 flex items-center gap-1 transition-colors">
                      <span>{isAr ? 'تخصيص' : 'Customize'}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
