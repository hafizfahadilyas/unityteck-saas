import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Check,
  Palette,
  Sparkles,
  Building2,
  Sliders,
  FolderTree,
  SlidersHorizontal,
  Video,
  LayoutGrid,
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
  ExternalLink,
  RefreshCw,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Layers,
  CheckCircle2,
  SlidersVertical,
  RotateCcw,
  Code2,
  FileText,
  Home,
  ShieldCheck,
  User,
  Star,
  Zap,
  Phone,
  HelpCircle,
  Clock,
  Compass,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { DynamicThemeRenderer } from '../../storefront/DynamicThemeRenderer';
import { getDefaultStoreTheme } from '../../../auth/defaultTheme';

// Import All 19 Theme Settings Forms
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
import { CustomCodeForm } from '../themeSettings/CustomCodeForm';
import { HeaderElementsForm } from '../themeSettings/HeaderElementsForm';

export interface WordPressThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSectionId?: string | null;
  targetThemeId?: string;
}

export type CustomizerCategory = 'all' | 'identity' | 'layout' | 'media' | 'products' | 'marketing' | 'code';

export interface CustomizerSectionMeta {
  id: string;
  num: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'identity' | 'layout' | 'media' | 'products' | 'marketing' | 'code';
}

export interface ThemePageMeta {
  id: string;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const CUSTOMIZER_SECTIONS: CustomizerSectionMeta[] = [
  {
    id: '00_header_builder',
    num: '00',
    titleEn: 'Header & Navigation Builder',
    titleAr: 'تخصيص وترتيب الهيدر والقوائم',
    descEn: 'Logo, nav links, announcement bar, Wishlist, WhatsApp & Profile icons',
    descAr: 'الشعار، روابط القائمة، شريط الإعلانات، أيقونة المفضلة، الواتساب وحساب العميل',
    icon: Compass,
    category: 'layout',
  },
  {
    id: '01_store_identity',
    num: '01',
    titleEn: 'Site Identity & Logo',
    titleAr: 'هوية المتجر والشعار',
    descEn: 'Logo, store title, tagline, favicon, VAT & CR numbers',
    descAr: 'الشعار، اسم المتجر، الوصف، الأيقونة، الرقم الضريبي والسجل',
    icon: Building2,
    category: 'identity',
  },
  {
    id: '03_store_colors',
    num: '02',
    titleEn: 'Colors & Dark Mode',
    titleAr: 'ألوان المتجر والوضع الداكن',
    descEn: 'Accent colors, dark mode, loading screen & buttons',
    descAr: 'اللون الرئيسي، الوضع الداكن، شاشة التحميل، والأزرار',
    icon: Palette,
    category: 'identity',
  },
  {
    id: '02_general_options',
    num: '03',
    titleEn: 'General Options & Typography',
    titleAr: 'الخيارات العامة والخطوط',
    descEn: 'Arabic numerals, content protection, breadcrumbs & fonts',
    descAr: 'الأرقام العربية، حماية المحتوى، مسار التصفح والخطوط',
    icon: Sliders,
    category: 'identity',
  },
  {
    id: '13_announcement_bar',
    num: '04',
    titleEn: 'Announcement Bar',
    titleAr: 'شريط الإعلانات الترويجي',
    descEn: 'Top marquee banner with live ticking countdown and promo links',
    descAr: 'شريط علوي بمؤقت عد تنازلي حي وروابط العروض',
    icon: Megaphone,
    category: 'layout',
  },
  {
    id: '05_advanced_slider',
    num: '05',
    titleEn: 'Hero Slider & Banners',
    titleAr: 'سلايدر الواجهة الرئيسية (Hero)',
    descEn: 'Hero slides manager, autoplay speed, images, and CTA buttons',
    descAr: 'إدارة شرائح البانر، السرعة، الصور، وأزرار الشراء',
    icon: SlidersHorizontal,
    category: 'media',
  },
  {
    id: '04_category_cart_customer',
    num: '06',
    titleEn: 'Category & Cart Layout',
    titleAr: 'صفحات الأقسام والسلة',
    descEn: 'Product auto-load, category banners, floating enhanced cart',
    descAr: 'التحميل التلقائي، بانرات الأقسام، والسلة العائمة',
    icon: FolderTree,
    category: 'layout',
  },
  {
    id: '15_product_cards',
    num: '07',
    titleEn: 'Product Cards Designer',
    titleAr: 'مصمم بطاقات المنتجات',
    descEn: 'Hover actions, wishlist, quick add, color swatches & discount badges',
    descAr: 'بطاقات المنتجات، التفضيل، الشراء السريع، والألوان',
    icon: ShoppingBag,
    category: 'products',
  },
  {
    id: '07_product_tabs',
    num: '08',
    titleEn: 'Product Tabs & Collections',
    titleAr: 'تبويبات المنتجات المتعددة',
    descEn: 'Best sellers, new arrivals, discount tabs and grid counts',
    descAr: 'الأكثر مبيعاً، أحدث المنتجات، والتخفيضات في تبويبات',
    icon: LayoutGrid,
    category: 'products',
  },
  {
    id: '08_detailed_products',
    num: '09',
    titleEn: 'Spotlight Product Card',
    titleAr: 'بطاقة المنتج المفصلة الشاملة',
    descEn: 'Featured deal of the week with gallery, stars, ticker & instant Buy Now',
    descAr: 'عرض مميز لمنتج الأسبوع مع معرض الصور وشريط الضمانات',
    icon: Sparkles,
    category: 'products',
  },
  {
    id: '06_product_videos',
    num: '10',
    titleEn: 'Product Videos & Reels',
    titleAr: 'فيديوهات المنتجات والريلز',
    descEn: '9:16 vertical short-form reels with instant play and shopping tags',
    descAr: 'فيديوهات طولية 9:16 مع علامات الشراء وزر التشغيل',
    icon: Video,
    category: 'media',
  },
  {
    id: '11_banners',
    num: '11',
    titleEn: 'Promo Banners & Deals',
    titleAr: 'البانرات الإعلانية الترويجية',
    descEn: 'Full-width animated banners with discount badges & dark overlays',
    descAr: 'بانرات عريضة وشارات خصومات مع تأثيرات تحويم ناعمة',
    icon: ImageIcon,
    category: 'media',
  },
  {
    id: '09_image_grid',
    num: '12',
    titleEn: 'Bento Image Grid',
    titleAr: 'شبكة الصور البينتو التفاعلية',
    descEn: 'Modern bento collage, masonry layout & geometric hover zooms',
    descAr: 'تخطيط بينتو للصور وتأثيرات تكبير فاخرة',
    icon: Grid,
    category: 'media',
  },
  {
    id: '10_custom_links',
    num: '13',
    titleEn: 'Custom Links & Categories',
    titleAr: 'الروابط وتسوق بالأقسام',
    descEn: 'Shop by category visual cards with quick shop links & badges',
    descAr: 'بطاقات الأقسام والتصنيفات بأزرار شراء سريعة',
    icon: Link2,
    category: 'marketing',
  },
  {
    id: '12_blog',
    num: '14',
    titleEn: 'Blog Articles & Stories',
    titleAr: 'المدونة ومقالات المتجر',
    descEn: 'Editorial cards with read time, publish dates & SEO boost',
    descAr: 'مقالات المدونة، نصائح العناية، وأوقات القراءة',
    icon: BookOpen,
    category: 'marketing',
  },
  {
    id: '14_enhanced_features',
    num: '15',
    titleEn: 'Trust Badges & Store Features',
    titleAr: 'مزايا المتجر وبطاقات الثقة',
    descEn: 'Cold delivery, secure checkout, Saudi warranty & 24/7 support',
    descAr: 'الشحن المبرد، الدفع الآمن، الضمان السعودي، وخدمة 24/7',
    icon: Award,
    category: 'marketing',
  },
  {
    id: '16_custom_products',
    num: '16',
    titleEn: 'Custom Products Slider',
    titleAr: 'مجموعة المنتجات المخصصة',
    descEn: 'Featured curated collection slider with elegant typography',
    descAr: 'سلايدر التشكيلة المميزة بتصميم ناعم وشارات خصم',
    icon: Package,
    category: 'products',
  },
  {
    id: '17_special_offer_countdown',
    num: '17',
    titleEn: 'Special Offer Countdown',
    titleAr: 'العرض الخاص مع العد التنازلي',
    descEn: 'Hero promotional card with days/hours/mins/secs ticker & notes',
    descAr: 'بانر عروض خاص بمؤقت عد تنازلي ضخم وشارات ثقة',
    icon: Percent,
    category: 'marketing',
  },
  {
    id: '18_store_statistics',
    num: '18',
    titleEn: 'Store Statistics & Numbers',
    titleAr: 'إحصائيات وأرقام المتجر',
    descEn: 'Animated counters (+500, +3K happy customers, etc.)',
    descAr: 'إبراز إنجازات المتجر بأرقام متحركة وتصاميم زجاجية',
    icon: BarChart2,
    category: 'marketing',
  },
  {
    id: '19_custom_code',
    num: '19',
    titleEn: 'Custom Code (CSS & JS)',
    titleAr: 'الأكواد البرمجية المخصصة (CSS & JS)',
    descEn: 'Custom CSS styles, Snap/Meta/TikTok tracking pixels & head tags',
    descAr: 'تنسيقات CSS مخصصة، بكسل التتبع، أكواد سناب وتيك توك وسكريبتات الهيدر',
    icon: Code2,
    category: 'code',
  },
];

export const WordPressThemeCustomizer: React.FC<WordPressThemeCustomizerProps> = ({
  isOpen,
  onClose,
  initialSectionId = null,
  targetThemeId,
}) => {
  const { activeStore, storeActiveTheme } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeSectionId, setActiveSectionId] = useState<string | null>(initialSectionId);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CustomizerCategory>('all');
  const [mobileTab, setMobileTab] = useState<'controls' | 'preview'>('controls');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [previewPage, setPreviewPage] = useState<string>('home');
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const pageDropdownRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync initial section id if prop changes
  useEffect(() => {
    if (initialSectionId) {
      setActiveSectionId(initialSectionId);
    }
  }, [initialSectionId]);

  // Close page dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(e.target as Node)) {
        setIsPageDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Real-time synchronization of activeSectionId with URL search params
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (activeSectionId) {
          url.searchParams.set('section', activeSectionId);
        } else {
          url.searchParams.delete('section');
        }
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, [activeSectionId]);

  // Listen to live theme setting changes to trigger instant preview update and mark saved
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleSettingsUpdated = () => {
      setIsSaved(true);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.dispatchEvent(new CustomEvent('unityteck-theme-settings'));
            iframeRef.current.contentWindow.dispatchEvent(new CustomEvent('unityteck-theme-identity'));
            iframeRef.current.contentWindow.postMessage(
              { type: 'UNITYTECK_PREVIEW_SYNC', event: 'theme-updated', timestamp: Date.now() },
              '*',
            );
          }
        } catch {}
      }, 60);
    };

    window.addEventListener('unityteck-theme-settings', handleSettingsUpdated);
    window.addEventListener('unityteck-theme-identity', handleSettingsUpdated);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('unityteck-theme-settings', handleSettingsUpdated);
      window.removeEventListener('unityteck-theme-identity', handleSettingsUpdated);
    };
  }, []);

  const activeThemeId = useMemo(() => {
    if (targetThemeId) return targetThemeId;
    if (activeStore?.id && storeActiveTheme[activeStore.id]) {
      return storeActiveTheme[activeStore.id];
    }
    return getDefaultStoreTheme(activeStore?.id);
  }, [targetThemeId, activeStore?.id, storeActiveTheme]);

  // Compute isolated live storefront preview URL
  const previewIframeUrl = useMemo(() => {
    const slug =
      activeStore?.slug ||
      (activeStore?.id === 'store-coffee'
        ? 'coffee'
        : activeStore?.id === 'store-bleco'
        ? 'bleco'
        : 'flowers');
    const params = new URLSearchParams();
    params.set('store', slug);
    if (activeThemeId) params.set('theme', activeThemeId);
    if (previewPage) params.set('page', previewPage);
    params.set('preview', '1');
    params.set('fullscreen', '1');
    return `/?${params.toString()}`;
  }, [activeStore?.slug, activeStore?.id, activeThemeId, previewPage]);

  const activeSection = useMemo(() => {
    return CUSTOMIZER_SECTIONS.find((s) => s.id === activeSectionId) || null;
  }, [activeSectionId]);

  // Categories metadata with item counts
  const categoriesList = useMemo(
    () => [
      { id: 'all' as CustomizerCategory, labelAr: 'الكل (٢٠)', labelEn: 'All (20)', icon: Layers },
      { id: 'identity' as CustomizerCategory, labelAr: 'الهوية والمظهر (٣)', labelEn: 'Identity & Style (3)', icon: Palette },
      { id: 'layout' as CustomizerCategory, labelAr: 'الهيدر والتخطيط (٤)', labelEn: 'Header & Layout (4)', icon: SlidersVertical },
      { id: 'media' as CustomizerCategory, labelAr: 'الوسائط والبانرات (٤)', labelEn: 'Media & Hero (4)', icon: ImageIcon },
      { id: 'products' as CustomizerCategory, labelAr: 'المنتجات والمتجر (٤)', labelEn: 'Products & Shop (4)', icon: ShoppingBag },
      { id: 'marketing' as CustomizerCategory, labelAr: 'التسويق والثقة (٥)', labelEn: 'Marketing & Trust (5)', icon: Award },
      { id: 'code' as CustomizerCategory, labelAr: 'كود مخصص (١)', labelEn: 'Custom Code (1)', icon: Code2 },
    ],
    [],
  );

  const filteredSections = useMemo(() => {
    return CUSTOMIZER_SECTIONS.filter((s) => {
      // Category filter
      if (selectedCategory !== 'all' && s.category !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.titleEn.toLowerCase().includes(q) ||
        s.titleAr.includes(q) ||
        s.descEn.toLowerCase().includes(q) ||
        s.descAr.includes(q) ||
        s.num.includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  // ══════════════════════════════════════════════════════════════
  // DYNAMIC PAGES LIST PER THEME (Automatic Adjustment for each theme)
  // ══════════════════════════════════════════════════════════════
  const themePages: ThemePageMeta[] = useMemo(() => {
    const tid = (activeThemeId || '').toLowerCase();

    // 1. Coffee Roasters Theme Pages
    if (tid.includes('coffee') || tid.includes('hibrew') || tid.includes('roaster')) {
      return [
        {
          id: 'home',
          nameEn: 'Homepage Showcase',
          nameAr: 'الواجهة الرئيسية ومكائن القهوة',
          descEn: 'Hero slider, espresso machines & roastery stories',
          descAr: 'سلايدر الواجهة، مكائن الإسبريسو ومحاصيل القهوة المختصة',
          icon: Home,
          badge: 'Main',
        },
        {
          id: 'products',
          nameEn: 'Coffee Machines & Gear',
          nameAr: 'كتالوج مكائن القهوة والمطاحن',
          descEn: 'Commercial espresso, grinders & barista accessories',
          descAr: 'مكائن الإسبريسو التجارية، مطاحن القهوة وأدوات الباريستا',
          icon: ShoppingBag,
          badge: 'Shop',
        },
        {
          id: 'product-detail',
          nameEn: 'Flagship Espresso Detail',
          nameAr: 'تفاصيل الماكينة (Dual-Boiler 20-Bar)',
          descEn: 'PID temperature, specs, 3D gallery & technical breakdown',
          descAr: 'التحكم بالحرارة PID، المواصفات الفنية ومعرض الصور',
          icon: Sparkles,
        },
        {
          id: 'product-buy',
          nameEn: 'Barista Buy Now Checkout',
          nameAr: 'شراء سريع مباشر (Barista Pro)',
          descEn: 'Quick buy with Tabby/Tamara 4 installments',
          descAr: 'شراء فوري مع تقسيط تابي وتمارا على 4 دفعات',
          icon: Zap,
        },
        {
          id: 'cart',
          nameEn: 'Barista Cart Drawer',
          nameAr: 'سلة المشتريات والكوبونات',
          descEn: 'Cart review, discount codes & express shipping note',
          descAr: 'مراجعة المشتريات، كود الخصم والشحن المبرد السريع',
          icon: ShoppingBag,
        },
        {
          id: 'checkout',
          nameEn: 'Express Checkout',
          nameAr: 'إتمام الطلب والدفع الإلكتروني',
          descEn: 'Mada, Apple Pay, Visa, Tabby & Tamara',
          descAr: 'مدى، أبل باي، فيزا، وتقسيط تابي وتمارا',
          icon: ShieldCheck,
        },
        {
          id: 'reviews',
          nameEn: 'Customer Barista Reviews',
          nameAr: 'آراء وتقييمات العملاء الموثقة',
          descEn: 'Verified owner feedback, photos & ratings',
          descAr: 'تجارب العملاء الموثقة، الصور وتقييمات الأداء',
          icon: Star,
        },
        {
          id: 'profile',
          nameEn: 'Coffee Club VIP Account',
          nameAr: 'الملف الشخصي ونادي القهوة VIP',
          descEn: 'Order tracking, saved addresses & roastery rewards',
          descAr: 'تتبع الشحنات، العناوين المحفوظة ونقاط الولاء',
          icon: User,
        },
        {
          id: 'warranty',
          nameEn: 'Saudi 2-Year Warranty',
          nameAr: 'الضمان السعودي والصيانة السريعة',
          descEn: '2-year commercial warranty, parts & local service',
          descAr: 'ضمان الوكيل سنتين، قطع الغيار وخدمة الصيانة المعتمدة',
          icon: Award,
        },
        {
          id: 'about',
          nameEn: 'About HiBrew Roasters',
          nameAr: 'عن محمصة ومتجر هايبرو',
          descEn: 'Story, specialty bean roasting standards & passion',
          descAr: 'قصة علامتنا، معايير التحميص والشغف بالقهوة',
          icon: FileText,
        },
        {
          id: 'contact',
          nameEn: 'Contact & Barista Support',
          nameAr: 'تواصل معنا وفريق الدعم الفني',
          descEn: 'WhatsApp concierge, phone, email & Riyadh branch',
          descAr: 'واتساب مباشر، الهاتف، البريد ومعرض الرياض',
          icon: Phone,
        },
        {
          id: 'faq',
          nameEn: 'FAQ & Shipping Policies',
          nameAr: 'الأسئلة الشائعة وسياسة الشحن',
          descEn: 'Delivery timelines, returns & machine operation guides',
          descAr: 'مدة التوصيل، سياسة الاسترجاع ودليل تشغيل المكائن',
          icon: HelpCircle,
        },
      ];
    }

    // 2. Flowers & Gifts Theme Pages (Hadaya Makkah / Flora Luxe)
    if (tid.includes('flower') || tid.includes('gift') || tid.includes('hadaya') || tid.includes('flora')) {
      return [
        {
          id: 'home',
          nameEn: 'Luxury Floral Homepage',
          nameAr: 'الواجهة الرئيسية لباقات الورد',
          descEn: 'Hero blooms, circular categories & featured arrangements',
          descAr: 'باقات الورد الطبيعي، التصنيفات الدائرية وأفخم الهدايا',
          icon: Home,
          badge: 'Main',
        },
        {
          id: 'catalog',
          nameEn: 'Bouquets & Gifts Catalog',
          nameAr: 'كتالوج باقات الورد والهدايا الملكية',
          descEn: 'Natural Dutch roses, Patchi chocolates & luxury sets',
          descAr: 'جوري هولندي، شوكولاتة باتشي وأطقم الهدايا الفاخرة',
          icon: ShoppingBag,
          badge: 'Shop',
        },
        {
          id: 'product',
          nameEn: 'Bouquet Product Detail',
          nameAr: 'تفاصيل الباقة وتخصيص الكرت',
          descEn: 'Bloom count, wrapping colors, card message & add-ons',
          descAr: 'عدد الورود، ألوان التغليف، كرت الإهداء والإضافات',
          icon: Sparkles,
        },
        {
          id: 'cart',
          nameEn: 'Gift Cart & Delivery Slot',
          nameAr: 'سلة الهدايا وتحديد وقت التوصيل',
          descEn: 'Recipient address, gift note & preferred delivery hour',
          descAr: 'بيانات المستلم، نص الإهداء والوقت المفضل للتسليم',
          icon: ShoppingBag,
        },
        {
          id: 'checkout',
          nameEn: 'Checkout & ZATCA Invoice',
          nameAr: 'إتمام الطلب وفاتورة زاتكا الضريبية',
          descEn: 'Instant payment & QR electronic tax invoice',
          descAr: 'دفع فوري وإصدار الفاتورة الضريبية بالرمز الإلكتروني',
          icon: ShieldCheck,
        },
        {
          id: 'crm',
          nameEn: 'Customer VIP Portal & Orders',
          nameAr: 'نادي العملاء والطلبات وتتبع الهدايا',
          descEn: 'Occasion reminders, delivery status & loyalty points',
          descAr: 'تذكير المناسبات، حالة التوصيل ونقاط المكافآت',
          icon: User,
        },
        {
          id: 'thankyou',
          nameEn: 'Order Thank You Confirmation',
          nameAr: 'صفحة الشكر وتأكيد التجهيز',
          descEn: 'Live order tracking & delivery dispatch status',
          descAr: 'تأكيد استلام الطلب وتجهيز باقة الورد للتوصيل',
          icon: CheckCircle2,
        },
        {
          id: 'reviews',
          nameEn: 'Customer Ratings & Reviews',
          nameAr: 'تقييمات العملاء وتجارب التوصيل',
          descEn: 'Verified reviews & bouquet photos from recipients',
          descAr: 'آراء المشترين وصور باقات الورد بعد التوصيل',
          icon: Star,
        },
        {
          id: 'faq',
          nameEn: 'Occasions & Delivery FAQ',
          nameAr: 'الأسئلة الشائعة وتوصيل المناسبات',
          descEn: 'Same-day delivery, preservation tips & hospital delivery',
          descAr: 'التوصيل في نفس اليوم، حفظ الورد والتوصيل للمستشفيات',
          icon: HelpCircle,
        },
      ];
    }

    // 3. Transport & Automotive Theme Pages (Bleco / Saudia Transport)
    if (tid.includes('transport') || tid.includes('car') || tid.includes('bleco') || tid.includes('saudia')) {
      return [
        {
          id: 'home',
          nameEn: 'Luxury Automotive Homepage',
          nameAr: 'الواجهة الرئيسية لتلبيسات السيارات',
          descEn: 'Interactive 3D cockpit, custom seat covers & mats',
          descAr: 'مقصورة القيادة التفاعلية، تلبيسات المقاعد والدعاسات',
          icon: Home,
          badge: 'Main',
        },
        {
          id: 'catalog',
          nameEn: 'Vehicle Mats & Covers Catalog',
          nameAr: 'كتالوج الدعاسات والتلبيسات الفاخرة',
          descEn: 'Laser-cut 7D floor mats, Nappa leather seat covers',
          descAr: 'دعاسات ليزر 7D، تلبيسات جلد نابا ومستلزمات الحماية',
          icon: ShoppingBag,
          badge: 'Shop',
        },
        {
          id: 'product',
          nameEn: 'Custom Vehicle Specs & Fitting',
          nameAr: 'تفاصيل المنتج وتوافق موديل السيارة',
          descEn: 'Exact year, make, model selection & leather swatches',
          descAr: 'تحديد الموديل وسنة الصنع وألوان وتطريز الجلد',
          icon: Sparkles,
        },
        {
          id: 'cart',
          nameEn: 'Automotive Reservations Cart',
          nameAr: 'سلة الطلبات ومواصفات التفصيل',
          descEn: 'Custom specs review, color verification & fitting slot',
          descAr: 'مراجعة مقاسات السيارة، الألوان وتأكيد التفصيل',
          icon: ShoppingBag,
        },
        {
          id: 'checkout',
          nameEn: 'Checkout & Delivery Booking',
          nameAr: 'إتمام الطلب وموعد التركيب السريع',
          descEn: 'Home delivery or branch installation options',
          descAr: 'توصيل لباب المنزل أو حجز موعد التركيب في الفرع',
          icon: ShieldCheck,
        },
        {
          id: 'profile',
          nameEn: 'My Vehicles & Fleet Account',
          nameAr: 'حساب العميل وسياراتي المحفوظة',
          descEn: 'Saved garage models, invoices & warranty card',
          descAr: 'سيارات العميل، فواتير الشراء وكرت الضمان المعتمد',
          icon: User,
        },
        {
          id: 'reviews',
          nameEn: 'Car Enthusiasts Reviews',
          nameAr: 'تقييمات العملاء وتجارب التركيب',
          descEn: 'Photos of installed mats on Land Cruiser, Patrol, etc.',
          descAr: 'صور واقعية للدعاسات والتلبيسات بعد التركيب',
          icon: Star,
        },
        {
          id: 'faq',
          nameEn: 'Vehicle Matching FAQ & Care',
          nameAr: 'الأسئلة الشائعة وتوافق السيارات',
          descEn: 'Cleaning guides, warranty terms & model custom fitting',
          descAr: 'طريقة تنظيف الدعاسات، شروط الضمان وتوافق المقاسات',
          icon: HelpCircle,
        },
      ];
    }

    // 4. Default / Standard E-commerce Store Pages Fallback
    return [
      {
        id: 'home',
        nameEn: 'Homepage',
        nameAr: 'الصفحة الرئيسية للمتجر',
        descEn: 'Main showcase, hero banners & collections',
        descAr: 'العروض الرئيسية، السلايدر والمنتجات المميزة',
        icon: Home,
        badge: 'Main',
      },
      {
        id: 'catalog',
        nameEn: 'Product Catalog (Shop)',
        nameAr: 'كتالوج كافة المنتجات (المتجر)',
        descEn: 'Full product listing with filters and sorting',
        descAr: 'عرض المنتجات مع خيارات التصفية والترتيب',
        icon: ShoppingBag,
        badge: 'Shop',
      },
      {
        id: 'product',
        nameEn: 'Product Detail Page',
        nameAr: 'صفحة تفاصيل المنتج',
        descEn: 'Gallery, specs, reviews, price & add to cart',
        descAr: 'معرض الصور، المواصفات، السعر وزر الإضافة للسلة',
        icon: Sparkles,
      },
      {
        id: 'cart',
        nameEn: 'Shopping Cart',
        nameAr: 'سلة المشتريات والكوبونات',
        descEn: 'Cart items, coupon codes & total breakdown',
        descAr: 'عناصر السلة، كود الخصم وإجمالي الفاتورة',
        icon: ShoppingBag,
      },
      {
        id: 'checkout',
        nameEn: 'Secure Checkout',
        nameAr: 'صفحة إتمام الطلب والدفع',
        descEn: 'Shipping address, payment gateways & tax invoice',
        descAr: 'عنوان الشحن، بوابات الدفع والفاتورة الضريبية',
        icon: ShieldCheck,
      },
      {
        id: 'reviews',
        nameEn: 'Customer Reviews',
        nameAr: 'تقييمات وآراء العملاء',
        descEn: 'Verified customer feedback & ratings',
        descAr: 'تقييمات العملاء وتجارب الشراء الحقيقية',
        icon: Star,
      },
      {
        id: 'about',
        nameEn: 'About Store',
        nameAr: 'من نحن وقصة المتجر',
        descEn: 'Store vision, values & brand identity',
        descAr: 'رؤية المتجر، القيم والتعريف بالنشاط',
        icon: FileText,
      },
      {
        id: 'contact',
        nameEn: 'Contact Us',
        nameAr: 'تواصل معنا وفروع المتجر',
        descEn: 'Support contacts, email & store branches',
        descAr: 'أرقام التواصل، الدعم الفني وفروع المتجر',
        icon: Phone,
      },
      {
        id: 'faq',
        nameEn: 'FAQ & Policies',
        nameAr: 'الأسئلة الشائعة وسياسات المتجر',
        descEn: 'Shipping, returns & warranty guidelines',
        descAr: 'سياسة الاستبدال والاسترجاع والضمان والشحن',
        icon: HelpCircle,
      },
    ];
  }, [activeThemeId]);

  // Active Page Metadata
  const activePageMeta = useMemo(() => {
    return themePages.find((p) => p.id === previewPage) || themePages[0];
  }, [themePages, previewPage]);

  const handleManualSave = useCallback(() => {
    setIsSaved(true);
    setPreviewRefreshKey((k) => k + 1);
    toast(
      isAr ? 'تم حفظ ونشر كافة إعدادات القالب وتطبيقها بنجاح!' : 'All theme customizations published successfully!',
      'success',
    );
  }, [isAr, toast]);

  const storeDisplayName = (isAr ? activeStore?.nameAr : activeStore?.nameEn) || activeStore?.name || 'Store';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-99999 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none overflow-hidden font-sans transition-colors"
      style={{ direction: isAr ? 'rtl' : 'ltr' }}
    >
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TOP HEADER: STORE IDENTITY + PUBLISH + RESPONSIVE MOBILE TOGGLE */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <header className="h-14 px-3 sm:px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 z-30 shrink-0 shadow-xs transition-colors">
        {/* Left: Close Button + Store Identity Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
            title={isAr ? 'إغلاق والعودة إلى لوحة التحكم' : 'Close and return to dashboard'}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

          {/* Store Logo/Avatar & Name */}
          <div className="min-w-0 flex items-center gap-2">
            {activeStore?.logo ? (
              <img
                src={activeStore.logo}
                alt={storeDisplayName}
                className="w-7 h-7 rounded-lg object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                {storeDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 hidden sm:block">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate leading-none">
                {isAr ? 'تخصيص القالب المباشر' : 'Theme Customizer'}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white block truncate leading-tight mt-0.5">
                {storeDisplayName}
              </span>
            </div>
          </div>

          {/* Hostinger Real DB Connected Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{isAr ? 'متصل بقاعدة هوستنجر' : 'Hostinger DB Live'}</span>
          </div>
        </div>

        {/* Center: Mobile View Switcher (Controls vs Live Preview) Visible on small screens */}
        <div className="flex md:hidden items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('controls')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mobileTab === 'controls'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isAr ? 'التخصيص' : 'Controls'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mobileTab === 'preview'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAr ? 'المعاينة' : 'Preview'}</span>
          </button>
        </div>

        {/* Right: Published Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleManualSave}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
              isSaved
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-600/20'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 animate-pulse'
            }`}
            title={isAr ? 'حفظ ونشر التعديلات مباشرة' : 'Publish and apply customizations'}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isAr ? 'تم النشر' : 'Published'}</span>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTAINER: SIDEBAR (START) + LIVE PREVIEW (END) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* ─── SIDEBAR: WORDPRESS CUSTOMIZER PANELS ─── */}
        <aside
          className={`h-full flex flex-col bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 transition-all duration-300 z-20 shrink-0 shadow-lg ${
            // Responsive mobile switching
            mobileTab === 'preview' ? 'hidden md:flex' : 'flex'
          } ${
            isSidebarHidden
              ? 'w-0 -translate-x-full rtl:translate-x-full overflow-hidden'
              : 'w-full md:w-[440px] lg:w-[460px] xl:w-[480px]'
          }`}
        >
          {/* Subheader: Active Section Breadcrumb Navigation */}
          {activeSection ? (
            <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveSectionId(null)}
                className="p-1.5 pe-2.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-colors"
                title={isAr ? 'العودة إلى قائمة الأقسام' : 'Back to panels'}
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{isAr ? 'كافة عناصر التخصيص' : 'All Customizer Panels'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  #{activeSection.num}
                </span>
              </div>
            </div>
          ) : (
            /* Search & Category Filter Bar When At Root */
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 shrink-0 space-y-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute start-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث في عناصر التخصيص الـ ١٩…' : 'Search in 19 customizer sections…'}
                  className="w-full ps-9 pe-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute end-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
                {categoriesList.map((cat) => {
                  const isCatActive = selectedCategory === cat.id;
                  const CatIcon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                        isCatActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <CatIcon className="w-3 h-3 shrink-0" />
                      <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scrollable Sidebar Body */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
            {activeSection ? (
              /* ACTIVE SECTION FORM */
              <div className="animate-in fade-in duration-150 space-y-4">
                {/* Active Section Info Card */}
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-600 text-white shrink-0 shadow-xs">
                    {React.createElement(activeSection.icon, { className: 'w-4 h-4' })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {isAr ? `القسم #${activeSection.num}` : `Section #${activeSection.num}`}
                      </span>
                    </div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {isAr ? activeSection.titleAr : activeSection.titleEn}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {isAr ? activeSection.descAr : activeSection.descEn}
                    </p>
                  </div>
                </div>

                {/* Form Component Container */}
                <div className="space-y-4">
                  {activeSection.id === '00_header_builder' && <HeaderElementsForm />}
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
                  {activeSection.id === '19_custom_code' && <CustomCodeForm />}
                </div>

                {/* Bottom Quick Return / Save Helper */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSectionId(null)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                    <span>{isAr ? 'العودة للأقسام' : 'Back to Panels'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isAr ? 'تطبيق التعديلات' : 'Apply Changes'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* SECTIONS LIST ACCORDION */
              <div className="space-y-1">
                <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{isAr ? 'عناصر التخصيص المتاحة' : 'Customizer Panels'}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {filteredSections.length} / {CUSTOMIZER_SECTIONS.length}
                  </span>
                </div>

                {filteredSections.map((sec) => {
                  const SecIcon = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveSectionId(sec.id)}
                      className="w-full text-start p-2.5 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Number Badge */}
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/80 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                          {sec.num}
                        </span>

                        {/* Icon */}
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0 shadow-2xs">
                          <SecIcon className="w-4 h-4" />
                        </div>

                        {/* Title & Description */}
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {isAr ? sec.titleAr : sec.titleEn}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                            {isAr ? sec.descAr : sec.descEn}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                    </button>
                  );
                })}

                {filteredSections.length === 0 && (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-400">
                      {isAr ? 'لا توجد نتائج مطابقة لبحثك' : 'No customizer sections match your search'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold cursor-pointer hover:underline"
                    >
                      {isAr ? 'إعادة ضبط البحث والتصنيف' : 'Reset Search & Categories'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WordPress Classic Bottom Bar: Hide Controls + Responsive Switcher */}
          <div className="h-12 px-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
            {/* Collapse Controls Button */}
            <button
              type="button"
              onClick={() => setIsSidebarHidden(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              title={isAr ? 'إخفاء عناصر التحكم للمعاينة الكاملة' : 'Hide controls'}
            >
              <PanelLeftClose className="w-4 h-4 rtl:rotate-180" />
              <span className="text-[11px] hidden sm:inline">{isAr ? 'إخفاء التحكم' : 'Hide Controls'}</span>
            </button>

            {/* Responsive Device Switcher */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/90 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDeviceView('desktop')}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  deviceView === 'desktop'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-emerald-400 shadow-2xs font-bold ring-1 ring-slate-900/10'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                }`}
                title={isAr ? 'معاينة سطح المكتب (Desktop)' : 'Desktop View'}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceView('tablet')}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  deviceView === 'tablet'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-emerald-400 shadow-2xs font-bold ring-1 ring-slate-900/10'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                }`}
                title={isAr ? 'معاينة الجهاز اللوحي (Tablet 768px)' : 'Tablet View (768px)'}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceView('mobile')}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  deviceView === 'mobile'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-emerald-400 shadow-2xs font-bold ring-1 ring-slate-900/10'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                }`}
                title={isAr ? 'معاينة الجوال (Mobile 390px)' : 'Mobile View (390px)'}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Floating Button to Unhide Sidebar if Collapsed */}
        {isSidebarHidden && (
          <button
            type="button"
            onClick={() => setIsSidebarHidden(false)}
            className="absolute start-4 bottom-4 z-40 px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl flex items-center gap-2 text-xs font-bold hover:opacity-90 cursor-pointer animate-in fade-in"
          >
            <PanelLeftOpen className="w-4 h-4 rtl:rotate-180" />
            <span>{isAr ? 'إظهار عناصر التحكم' : 'Show Controls'}</span>
          </button>
        )}

        {/* ─── RIGHT PANEL: LIVE INTERACTIVE STOREFRONT PREVIEW ─── */}
        <main
          className={`flex-1 h-full bg-slate-100/90 dark:bg-slate-950 flex flex-col min-w-0 overflow-hidden relative transition-colors ${
            mobileTab === 'controls' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Top Preview Control Strip */}
          <div className="h-11 px-3 sm:px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 shrink-0 gap-2 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold truncate hidden md:inline">
                {isAr ? 'معاينة حية متزامنة' : 'Live Storefront Sync'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/80 truncate">
                {activeThemeId}
              </span>
            </div>

            {/* Dynamic Custom Dropdown: Theme-Aware Page Selector */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={pageDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsPageDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  title={isAr ? 'اختيار صفحة المعاينة الحالية' : 'Select page to preview'}
                >
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold shrink-0 hidden sm:inline">
                    {isAr ? 'الصفحة:' : 'PAGE:'}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {React.createElement(activePageMeta.icon, {
                      className: 'w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0',
                    })}
                    <span className="truncate max-w-[130px] sm:max-w-[180px] text-slate-900 dark:text-slate-100 font-bold">
                      {isAr ? activePageMeta.nameAr : activePageMeta.nameEn}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform shrink-0 ${
                      isPageDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Sleek Theme-Aware Popover Dropdown Menu with Dismiss Backdrop */}
                {isPageDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/5 dark:bg-black/30 backdrop-blur-[0.5px]"
                      onClick={() => setIsPageDropdownOpen(false)}
                    />
                    <div className="absolute top-full mt-2 end-0 z-50 w-76 max-w-[calc(100vw-2rem)] max-h-88 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-2xl shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 backdrop-blur-md">
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span>{isAr ? 'صفحات القالب المتاحة' : 'Available Theme Pages'}</span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {themePages.length}
                        </span>
                      </div>

                      {themePages.map((page) => {
                        const PageIcon = page.icon;
                        const isCurrent = previewPage === page.id;
                        return (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => {
                              setPreviewPage(page.id);
                              setIsPageDropdownOpen(false);
                            }}
                            className={`w-full p-2 rounded-xl text-start flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                              isCurrent
                                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 hover:text-slate-950 dark:hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isCurrent
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                <PageIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold block truncate">
                                  {isAr ? page.nameAr : page.nameEn}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate leading-tight mt-0.5">
                                  {isAr ? page.nameEn : page.nameAr}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {page.badge && (
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                                    isCurrent
                                      ? 'bg-white/20 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {page.badge}
                                </span>
                              )}
                              {isCurrent && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Responsive Device Switcher in Preview Bar */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDeviceView('desktop')}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    deviceView === 'desktop'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-emerald-400 shadow-2xs font-bold ring-1 ring-slate-900/10'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                  title={isAr ? 'معاينة سطح المكتب (Desktop)' : 'Desktop View'}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView('tablet')}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    deviceView === 'tablet'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-emerald-400 shadow-2xs font-bold ring-1 ring-slate-900/10'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                  title={isAr ? 'معاينة الجهاز اللوحي (Tablet 768px)' : 'Tablet View (768px)'}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView('mobile')}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    deviceView === 'mobile'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-emerald-400 shadow-2xs font-bold ring-1 ring-slate-900/10'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                  title={isAr ? 'معاينة الجوال (Mobile 390px)' : 'Mobile View (390px)'}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPreviewRefreshKey((k) => k + 1);
                  try {
                    if (iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.location.reload();
                    }
                  } catch {}
                }}
                className="flex items-center gap-1 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-750 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs"
                title={isAr ? 'تحديث المعاينة' : 'Refresh Preview'}
              >
                <RefreshCw className="w-3 h-3" />
                <span className="text-[11px] hidden sm:inline">{isAr ? 'تحديث' : 'Reload'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const slug = activeStore?.slug || (activeStore?.id === 'store-coffee' ? 'coffee' : 'flowers');
                  window.open(`/?store=${slug}&theme=${activeThemeId}&page=${previewPage}&fullscreen=1`, '_blank');
                }}
                className="flex items-center gap-1 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-750 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs"
                title={isAr ? 'فتح في علامة تبويب جديدة' : 'Open in new tab'}
              >
                <ExternalLink className="w-3 h-3" />
                <span className="text-[11px] hidden sm:inline">{isAr ? 'عرض مباشر' : 'Live Tab'}</span>
              </button>
            </div>
          </div>

          {/* Storefront Viewport Container with True Viewport Isolation */}
          <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center p-0 sm:p-2 md:p-3 bg-slate-100/90 dark:bg-slate-950/80 transition-colors">
            <div
              className={`transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 shadow-2xl relative flex flex-col ${
                deviceView === 'desktop'
                  ? 'w-full h-full rounded-none border-0'
                  : deviceView === 'tablet'
                  ? 'w-[768px] max-w-full h-[95%] my-auto rounded-[28px] border-8 border-slate-300 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] ring-1 ring-slate-400/20 overflow-hidden'
                  : 'w-[390px] max-w-full h-[96%] my-auto rounded-[44px] border-[10px] border-slate-300 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-slate-400/20 overflow-hidden relative flex flex-col'
              }`}
            >
              {/* Realistic Mobile Speaker & Island Notch for Phone view */}
              {deviceView === 'mobile' && (
                <div className="w-full pt-2 pb-1.5 flex justify-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 select-none pointer-events-none">
                  <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-between px-2.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-700" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-600" />
                  </div>
                </div>
              )}

              {/* Realistic Tablet Camera Indicator */}
              {deviceView === 'tablet' && (
                <div className="w-full py-1 flex justify-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 select-none pointer-events-none">
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
              )}

              {/* Dynamic Theme Storefront View inside True Isolated Iframe */}
              <iframe
                ref={iframeRef}
                key={`${previewPage}-${activeThemeId}`}
                src={`${previewIframeUrl}${previewRefreshKey ? `&_k=${previewRefreshKey}` : ''}`}
                title={isAr ? 'معاينة المتجر الحية' : 'Live Storefront Sync Preview'}
                className="w-full flex-1 border-0 bg-white dark:bg-slate-950 transition-opacity duration-200"
              />

              {/* Mobile Bottom Home Bar Indicator */}
              {deviceView === 'mobile' && (
                <div className="w-full py-1.5 flex justify-center bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 select-none pointer-events-none">
                  <div className="w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
