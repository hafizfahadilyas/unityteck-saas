import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  getSeasonalThemeColors,
  type AllThemeSettings,
} from '../../../themes/settings/themeSettingsStore';
import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Save,
  Send,
  X,
  Plus,
  Eye,
  EyeOff,
  Layers,
  Palette,
  Sliders,
  Code,
  Type,
  Layout,
  Image as ImageIcon,
  Sparkles,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Check,
  Sun,
  Moon,
  Globe,
  Star,
  ExternalLink,
  Heart,
  MessageCircle,
  Phone,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Clock,
  Award,
  Play,
  Video,
  Search,
  CheckCircle2,
  Percent,
  BarChart2,
  SlidersHorizontal,
  Flame,
  HelpCircle,
  Zap,
  CreditCard,
  Package,
  Boxes,
  FileCheck,
  MessageSquare,
  Maximize2,
  Filter,
  CheckCircle,
  Copy,
  Trash2,
  LayoutGrid,
  Menu,
  Home,
  Lock,
  RotateCcw,
  Info,
  MapPin,
  Flower2,
  GripVertical,
  Gift,
  BookmarkPlus,
  FolderHeart,
  AlertTriangle,
  RefreshCw,
  Undo2,
  Redo2,
} from 'lucide-react';

import {
  BuilderProductPage,
  BuilderCartPage,
  BuilderCheckoutPage,
  BuilderThankYouPage,
  BuilderAboutPage,
  BuilderContactPage,
  BuilderStoreLocatorPage,
  BuilderTrackOrderPage,
  BuilderPrivacyPage,
  BuilderReturnPolicyPage,
} from './builderPages/BuilderAllPages';
import {
  BuilderTypographyControl,
  type TypographySettings,
} from './typography/BuilderTypographyControl';
import {
  IconLibraryModal,
  AVAILABLE_ICONS,
} from './icons/IconLibraryModal';
import {
  BuilderAddSectionModal,
  type NewSectionPayload,
} from './grid/BuilderAddSectionModal';
import { DynamicProductRow } from '../../storefront/DynamicProductRow';
import { ShortcodeGeneratorModal } from '../ShortcodeGeneratorModal';
import { getTemplatesForSection, type SectionTemplate } from './templates/sectionTemplates';
import {
  getCustomTemplatesForStore,
  saveCustomSectionTemplate,
  deleteCustomSectionTemplate,
  type CustomSectionTemplate,
} from './templates/customTemplatesStore';
import {
  parseShortcode,
  generateShortcode,
  type ProductRowConfig,
} from '../../../utils/productRowShortcodes';

// Official Mecca Gifts Theme Components
import { Header } from '../../../themes/meccaGifts/components/Header';
import { MotionHeroSlider } from '../../../themes/meccaGifts/components/MotionHeroSlider';
import { MarqueeBanner } from '../../../themes/meccaGifts/components/MarqueeBanner';
import { TopCircularCategories } from '../../../themes/meccaGifts/components/TopCircularCategories';
import { DiscountedBouquets3DGallery } from '../../../themes/meccaGifts/components/DiscountedBouquets3DGallery';
import { ProductSectionSlider } from '../../../themes/meccaGifts/components/ProductSectionSlider';
import { PromoBannersPair } from '../../../themes/meccaGifts/components/PromoBannersPair';
import { PromoCountdownBanner } from '../../../themes/meccaGifts/components/PromoCountdownBanner';
import { SocialReelsSection } from '../../../themes/meccaGifts/components/SocialReelsSection';
import { VideoSection } from '../../../themes/meccaGifts/components/VideoSection';
import { StoreFeaturesBar } from '../../../themes/meccaGifts/components/StoreFeaturesBar';
import { MetricsSection } from '../../../themes/meccaGifts/components/MetricsSection';
import { TestimonialsSection } from '../../../themes/meccaGifts/components/TestimonialsSection';
import { FaqSection } from '../../../themes/meccaGifts/components/FaqSection';
import { NewsletterSection } from '../../../themes/meccaGifts/components/NewsletterSection';
import { MagazineSection } from '../../../themes/meccaGifts/components/MagazineSection';
import { Footer } from '../../../themes/meccaGifts/components/Footer';
import { AppProvider } from '../../../themes/meccaGifts/context/AppContext';
import { getStoreDisplayName } from '../../../utils/storeLocalization';
import { CartDrawer } from '../../../themes/meccaGifts/components/CartDrawer';
import { CatalogPage } from '../../../themes/meccaGifts/pages/CatalogPage';
import { Product } from '../../../themes/meccaGifts/types';
import {
  NATURAL_BOUQUETS,
  CHOCOLATE_ROSES,
  CAKE_ROSES,
  COFFEE_SWEETS_ROSES,
  FLOWER_VASES,
  MAWAJEEB_PRODUCTS,
  LUXURY_SETS,
} from '../../../themes/meccaGifts/data/mockData';
import { BuilderAiAssistant } from './ai/BuilderAiAssistant';
import { BuilderWidgetLibrary, type WidgetDefinition } from './widgets/BuilderWidgetLibrary';

export interface VisualThemeBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishSuccess?: () => void;
  themeId?: string;
  initialPage?: PreviewPage;
}

type DeviceMode = 'desktop' | 'laptop' | 'tablet' | 'mobile';
type PreviewPage =
  | 'home'
  | 'catalog'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'thankyou'
  | 'crm'
  | 'about'
  | 'contact'
  | 'location'
  | 'track-order'
  | 'privacy'
  | 'return';
type SeasonalPreset = 'Default' | 'Eid' | 'Ramadan' | 'Valentine';

interface BlockElement {
  id: string;
  type: string;
  titleEn: string;
  titleAr: string;
  visible: boolean;
  templateStyle: string;
  settings: Record<string, any>;
  customHtml?: string;
  customCss?: string;
  customJs?: string;
}

const getBlockIcon = (type: string) => {
  switch (type) {
    case 'announcement': return Flame;
    case 'marquee_banner': return Flame;
    case 'header':
    case 'navbar': return Layout;
    case 'hero_slider':
    case 'hero': return Sparkles;
    case 'circle_categories': return LayoutGrid;
    case 'discounted_bouquets_3d': return ShoppingBag;
    case 'product_section_natural': return ShoppingBag;
    case 'product_tabs': return ShoppingBag;
    case 'dynamic_product_row': return ShoppingBag;
    case 'shortcode_widget': return Code;
    case 'image_grid': return ImageIcon;
    case 'promo_banners_pair': return ImageIcon;
    case 'promo_countdown_banner': return Clock;
    case 'product_section_luxury': return Award;
    case 'product_section_chocolate': return Gift;
    case 'product_section_cake': return Sparkles;
    case 'product_section_coffee': return Zap;
    case 'product_section_vases': return Boxes;
    case 'product_section_mawajeeb': return Package;
    case 'social_reels': return Video;
    case 'video_section': return Play;
    case 'features': return ShieldCheck;
    case 'store_features_bar': return ShieldCheck;
    case 'special_offer': return Clock;
    case 'reviews': return Star;
    case 'statistics': return BarChart2;
    case 'metrics_section': return BarChart2;
    case 'faq': return HelpCircle;
    case 'magazine_section': return Sparkles;
    case 'newsletter': return Flame;
    case 'footer': return Layers;
    case 'cart':
    case 'cart_drawer':
    case 'builder_cart': return ShoppingCart;
    default: return Layout;
  }
};

interface CanvasBlockItemProps {
  b: BlockElement;
  idx: number;
  totalBlocks: number;
  isSelected: boolean;
  isAr: boolean;
  device: DeviceMode;
  sectionProducts: any;
  onSelect: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onToggleVisibility: (id: string) => void;
}

const CanvasBlockItem: React.FC<CanvasBlockItemProps> = React.memo(
  ({
    b,
    idx,
    totalBlocks,
    isSelected,
    isAr,
    device,
    sectionProducts,
    onSelect,
    onMove,
    onToggleVisibility,
  }) => {
    // Section Scoped Custom CSS Injection
    useEffect(() => {
      if (!b.customCss) return;
      const styleId = `selia_style_${b.id}`;
      let styleTag = document.getElementById(styleId);
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = b.customCss;
      return () => {
        const tag = document.getElementById(styleId);
        if (tag) tag.remove();
      };
    }, [b.id, b.customCss]);

    // Section Scoped Safe Custom JS Execution
    useEffect(() => {
      if (!b.customJs || !b.customJs.trim()) return;
      try {
        const fn = new Function('sectionId', 'container', b.customJs);
        const el = document.getElementById(`selia_block_${b.id}`);
        if (el) fn(b.id, el);
      } catch (err) {
        // Safe sandbox catch
      }
    }, [b.id, b.customJs]);

    const renderSectionToolbar = () => (
      <div className="absolute top-2 start-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity z-40 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-lg backdrop-blur-xs">
          <span className="text-slate-400 cursor-grab active:cursor-grabbing p-0.5">
            <GripVertical className="w-3.5 h-3.5" />
          </span>
          <span>{isAr ? b.titleAr : b.titleEn}</span>
          <span className="text-[9px] bg-indigo-600 px-1.5 py-0.5 rounded font-mono text-white">
            {b.templateStyle}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 bg-white text-slate-700 p-1 rounded-xl shadow-lg border border-slate-200">
          <button
            type="button"
            disabled={idx === 0}
            onClick={(e) => {
              e.stopPropagation();
              onMove(b.id, -1);
            }}
            className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg disabled:opacity-20 cursor-pointer"
            title={isAr ? 'تحريك للأعلى' : 'Move Up'}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={idx === totalBlocks - 1}
            onClick={(e) => {
              e.stopPropagation();
              onMove(b.id, 1);
            }}
            className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg disabled:opacity-20 cursor-pointer"
            title={isAr ? 'تحريك للأسفل' : 'Move Down'}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(b.id);
            }}
            className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg cursor-pointer"
            title={isAr ? 'تعديل الإعدادات' : 'Edit Settings'}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(b.id);
            }}
            className="p-1 hover:bg-rose-50 hover:text-rose-600 rounded-lg cursor-pointer"
            title={isAr ? 'إخفاء القسم' : 'Hide Section'}
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );

    const wrapBlock = (content: React.ReactNode, extraClass: string = '') => (
      <div
        id={`selia_block_${b.id}`}
        key={b.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(b.id);
        }}
        className={`group relative transition-all cursor-pointer ${extraClass} ${
          isSelected ? 'ring-3 ring-indigo-500 ring-offset-2 z-20 shadow-md' : 'hover:ring-1 hover:ring-indigo-300'
        }`}
        style={{
          paddingTop: device === 'mobile' && b.settings.mobilePaddingTop ? `${b.settings.mobilePaddingTop}px` : (b.settings.paddingTop ? `${b.settings.paddingTop}px` : undefined),
          paddingBottom: device === 'mobile' && b.settings.mobilePaddingBottom ? `${b.settings.mobilePaddingBottom}px` : (b.settings.paddingBottom ? `${b.settings.paddingBottom}px` : undefined),
          marginTop: b.settings.marginTop ? `${b.settings.marginTop}px` : undefined,
          marginBottom: b.settings.marginBottom ? `${b.settings.marginBottom}px` : undefined,
          backgroundColor: b.settings.bgColor || undefined,
        }}
      >
        {renderSectionToolbar()}
        {content}
        {b.customHtml && (
          <div
            className="custom-html-container my-2"
            dangerouslySetInnerHTML={{ __html: b.customHtml }}
          />
        )}
      </div>
    );

    // 1. ANNOUNCEMENT BAR
    if (b.type === 'announcement') {
      return wrapBlock(
        <div
          className="px-4 py-2.5 text-xs font-semibold border-b transition-all"
          style={{
            backgroundColor: b.settings.bgColor || '#102a1c',
            color: b.settings.textColor || '#e6ca98',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span className="truncate">{isAr ? b.settings.textAr || '🌸 توصيل مجاني وسريع لكافة فنادق وأبراج مكة المكرمة' : b.settings.textEn || '🌸 Complimentary Express Delivery to all Makkah Hotels & Towers'}</span>
            </div>
            {b.settings.showButton && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#e6ca98] text-[#102a1c] text-[10px] font-extrabold shadow-xs shrink-0">
                {isAr ? b.settings.buttonTextAr || 'اطلب الآن' : b.settings.buttonTextEn || 'Order Now'}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (b.type === 'header' || b.type === 'navbar') return wrapBlock(<Header />);
    if (b.type === 'hero_slider' || b.type === 'hero') return wrapBlock(<MotionHeroSlider />);
    if (b.type === 'marquee_banner') return wrapBlock(<MarqueeBanner />);
    if (b.type === 'circle_categories') return wrapBlock(<TopCircularCategories />);
    if (b.type === 'discounted_bouquets_3d') return wrapBlock(<DiscountedBouquets3DGallery />);

    if (b.type === 'product_section_natural') {
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || 'باقات الورود الطبيعية') : (b.settings.titleEn || 'Natural Fresh Flower Bouquets')}
          subtitle={isAr ? (b.settings.subtitleAr || 'أجود أنواع الجوري الهولندي والإكوادوري المنسق بأيدي أمهر الخبراء') : (b.settings.subtitleEn || 'Finest Dutch and Ecuadorian long-stem roses tailored by master florists')}
          products={sectionProducts.natural}
          categorySlug="natural-bouquets"
        />
      );
    }

    if (b.type === 'promo_banners_pair') return wrapBlock(<PromoBannersPair />);
    if (b.type === 'promo_countdown_banner') return wrapBlock(<PromoCountdownBanner />);

    if (b.type === 'product_section_luxury') {
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || 'هدايا ملكية فاخرة (رجالية ونسائية)') : (b.settings.titleEn || 'Royal Luxury Gift Sets (Men & Women)')}
          subtitle={isAr ? (b.settings.subtitleAr || 'أطقم هدايا استثنائية تضم عطوراً فاخرة، ساعات، أطقم مجوهرات وباقات زهور نضرة') : (b.settings.subtitleEn || 'Signature executive and feminine luxury gift sets with blooms and fine accessories')}
          products={sectionProducts.luxury}
          categorySlug="luxury-gifts"
        />
      );
    }

    if (b.type === 'product_section_chocolate') {
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || 'ورد وشوكولاتة بلجيكية فاخرة') : (b.settings.titleEn || 'Roses & Luxury Belgian Chocolates')}
          subtitle={isAr ? (b.settings.subtitleAr || 'أفخم تشكيلات باتشي وبستاني المنسقة مع باقات الجوري الساحرة') : (b.settings.subtitleEn || 'Signature Patchi and Bostani chocolate boxes paired with fresh roses')}
          products={sectionProducts.chocolate}
          categorySlug="chocolate-roses"
        />
      );
    }

    if (b.type === 'product_section_cake') {
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || 'ورد و كيك') : (b.settings.titleEn || 'Roses & Gourmet Celebration Cakes')}
          subtitle={isAr ? (b.settings.subtitleAr || 'كيك كوري خاص وكعكات الريد فيلفيت الطازجة لمناسبات أعياد الميلاد والتخرج') : (b.settings.subtitleEn || 'Korean lunchbox cakes and artisan bakery paired with celebratory bouquets')}
          products={sectionProducts.cake}
          categorySlug="cake-roses"
        />
      );
    }

    if (b.type === 'product_section_coffee') {
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || 'ورد و قهوة و حلا') : (b.settings.titleEn || 'Roses, Arabic Coffee & Sweets')}
          subtitle={isAr ? (b.settings.subtitleAr || 'أصالة الضيافة الحجازية مع القهوة العربية والتمور المحشوة والحلويات') : (b.settings.subtitleEn || 'Authentic Hijazi hospitality blending Arabic cardamom coffee with blooms')}
          products={sectionProducts.coffee}
          categorySlug="coffee-sweets"
        />
      );
    }

    if (b.type === 'product_section_vases') {
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || 'فازات ورود طبيعية') : (b.settings.titleEn || 'Natural Flower Vases')}
          subtitle={isAr ? (b.settings.subtitleAr || 'فازات كريستالية وسيراميك راقية تدوم طويلاً لتزيين المجالس والمكاتب') : (b.settings.subtitleEn || 'Hand-cut crystal and fluted ceramic vases elevating homes and offices')}
          products={sectionProducts.vases}
          categorySlug="flower-vases"
        />
      );
    }

    if (b.type === 'product_section_mawajeeb') {
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || 'لوحات مواجيب وتراث حجازي') : (b.settings.titleEn || 'Mawajeeb Wooden Plaques & Heritage')}
          subtitle={isAr ? (b.settings.subtitleAr || 'لوحات تذكارية وتراث حجازي عريق مع ورد وبخور مروكي فاخر') : (b.settings.subtitleEn || 'Hand-carved wooden heritage plaques with authentic Maroki oud and fresh roses')}
          products={sectionProducts.mawajeeb}
          categorySlug="mawajeeb"
        />
      );
    }

    if (b.type === 'social_reels') return wrapBlock(<SocialReelsSection />);
    if (b.type === 'video_section') return wrapBlock(<VideoSection />);
    if (b.type === 'store_features_bar' || b.type === 'features') return wrapBlock(<StoreFeaturesBar />);
    if (b.type === 'metrics_section' || b.type === 'statistics') return wrapBlock(<MetricsSection />);
    if (b.type === 'reviews') return wrapBlock(<TestimonialsSection />);
    if (b.type === 'faq') return wrapBlock(<FaqSection />);
    if (b.type === 'magazine_section') return wrapBlock(<MagazineSection />);
    if (b.type === 'newsletter') return wrapBlock(<NewsletterSection />);
    if (b.type === 'footer') return wrapBlock(<Footer />);
    if (b.type === 'special_offer') return wrapBlock(<PromoCountdownBanner />);

    if (b.type === 'product_tabs') {
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.mainTitleAr || 'الباقات المميزة والأكثر طلباً') : (b.settings.mainTitleEn || 'Featured & Bestseller Bouquets')}
          subtitle={isAr ? (b.settings.subtitleAr || 'تشكيلة منتقاة بعناية تناسب جميع المناسبات') : (b.settings.subtitleEn || 'Carefully selected arrangements for every occasion')}
          products={sectionProducts.natural}
          categorySlug="natural-bouquets"
        />
      );
    }

    if (b.type === 'image_grid') return wrapBlock(<PromoBannersPair />);

    if (b.type === 'dynamic_product_row' || b.type === 'shortcode_widget') {
      const parsedConfig = b.settings.shortcode ? parseShortcode(b.settings.shortcode) : null;
      const rowConfig: Partial<ProductRowConfig> = {
        id: b.id,
        titleAr: b.settings.titleAr || b.settings.mainTitleAr || b.titleAr,
        titleEn: b.settings.titleEn || b.settings.mainTitleEn || b.titleEn,
        subtitleAr: b.settings.subtitleAr,
        subtitleEn: b.settings.subtitleEn,
        filterType: (b.settings.filterType || parsedConfig?.filterType || 'category') as any,
        categorySlug: b.settings.categorySlug || parsedConfig?.categorySlug || 'natural-bouquets',
        categoryName: b.settings.categoryName || parsedConfig?.categoryName,
        brandName: b.settings.brandName || parsedConfig?.brandName,
        collectionType: b.settings.collectionType || parsedConfig?.collectionType,
        selectedProductIds: b.settings.selectedProductIds || parsedConfig?.selectedProductIds,
        limit: b.settings.limit || parsedConfig?.limit || 6,
        columns: b.settings.columns || parsedConfig?.columns || 4,
        layout: b.settings.layout || parsedConfig?.layout || 'slider',
        badgeTextAr: b.settings.badgeTextAr,
        badgeTextEn: b.settings.badgeTextEn,
        viewAllLink: b.settings.viewAllLink || '#catalog',
      };

      return wrapBlock(<DynamicProductRow config={rowConfig} isBuilderPreview={true} />);
    }

    // Default Fallback Custom Row
    const cols = b.settings.layoutColumns || '1';
    const colGridClass =
      cols === '2' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' :
      cols === '3' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' :
      cols === '4' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' :
      cols === '5' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3' :
      cols === '8' ? 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2' :
      cols === '2-asym-left' ? 'grid grid-cols-1 lg:grid-cols-3 gap-4' :
      cols === '2-asym-right' ? 'grid grid-cols-1 lg:grid-cols-3 gap-4' :
      cols === 'bento' ? 'grid grid-cols-1 md:grid-cols-3 gap-4' :
      'grid grid-cols-1 gap-4';

    const colCount = cols === '8' ? 8 : cols === '5' ? 5 : cols === '4' ? 4 : cols === '3' ? 3 : cols === '2' ? 2 : 1;

    return wrapBlock(
      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                {b.templateStyle} · {cols} Columns
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1" style={{ fontSize: b.settings.titleFontSize ? `${b.settings.titleFontSize}px` : undefined }}>
                {isAr ? b.titleAr : b.titleEn}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {isAr ? 'شبكة قابلة للتخصيص' : 'Custom Grid Row'}
            </span>
          </div>

          <div className={colGridClass}>
            {[...Array(colCount)].map((_, colIdx) => (
              <div
                key={colIdx}
                className={`p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 flex flex-col items-center justify-center text-center min-h-[100px] ${
                  cols === '2-asym-left' && colIdx === 0 ? 'lg:col-span-2' : ''
                } ${
                  cols === '2-asym-right' && colIdx === 1 ? 'lg:col-span-2' : ''
                } ${
                  cols === 'bento' && colIdx === 0 ? 'md:col-span-2' : ''
                }`}
              >
                <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center mb-1">
                  {colIdx + 1}
                </span>
                <span className="text-xs font-bold text-indigo-900">
                  {isAr ? `عمود ${colIdx + 1}` : `Column ${colIdx + 1}`}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {isAr ? 'عنصر / محتوى قابل للتحرير' : 'Editable Widget Container'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

const VisualThemeBuilderInner: React.FC<VisualThemeBuilderProps> = ({
  isOpen,
  onClose,
  onPublishSuccess,
  themeId,
  initialPage,
}) => {
  const {
    activeStore,
    currentProducts,
    setStoreTheme,
    setStoreHomepageStyle,
    storeActiveTheme,
    storeActiveHomepage,
    themes,
  } = useTenant();
  const { locale, setLocale, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const liveStoreThemeId = storeActiveTheme[activeStore.id] || 'theme-flora-luxe';
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => themeId || liveStoreThemeId);
  const currentThemeObj = useMemo(
    () => themes.find((t) => t.id === currentThemeId) || themes[0],
    [themes, currentThemeId],
  );
  const isEditingActiveTheme = currentThemeId === liveStoreThemeId;
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync if themeId prop changes
  useEffect(() => {
    if (themeId && themeId !== currentThemeId) {
      setCurrentThemeId(themeId);
    }
  }, [themeId]);

  // Builder Viewport & Page Navigation
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [previewPage, setPreviewPage] = useState<PreviewPage>(() => initialPage || 'home');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('sec_natural_flowers');
  const [activeTab, setActiveTab] = useState<'content' | 'templates' | 'styling' | 'layout' | 'code' | 'ai'>('content');
  const [canvasDarkMode, setCanvasDarkMode] = useState(false);
  const [previewModeOnly, setPreviewModeOnly] = useState(false);
  const [leftTab, setLeftTab] = useState<'widgets' | 'layers'>('widgets');

  // Topbar Dropdown Menus State
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showIconLibrary, setShowIconLibrary] = useState(false);
  const [showShortcodeModal, setShowShortcodeModal] = useState(false);

  // Custom Templates Modal State
  const [showSaveCustomTplModal, setShowSaveCustomTplModal] = useState(false);
  const [customTplNameEn, setCustomTplNameEn] = useState('');
  const [customTplNameAr, setCustomTplNameAr] = useState('');
  const [customTplDescEn, setCustomTplDescEn] = useState('');
  const [customTplDescAr, setCustomTplDescAr] = useState('');
  const [tplTab, setTplTab] = useState<'builtin' | 'custom'>('builtin');
  const [customTemplatesList, setCustomTemplatesList] = useState<CustomSectionTemplate[]>([]);

  // Sidebars Width & Mouse Resizing State
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(280);
  const [leftSidebarVisible, setLeftSidebarVisible] = useState<boolean>(true);
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(370);
  const [rightSidebarVisible, setRightSidebarVisible] = useState<boolean>(true);
  const [isDraggingLeft, setIsDraggingLeft] = useState<boolean>(false);
  const [isDraggingRight, setIsDraggingRight] = useState<boolean>(false);
  const [draggedBlockIdx, setDraggedBlockIdx] = useState<number | null>(null);
  const [dragOverBlockIdx, setDragOverBlockIdx] = useState<number | null>(null);

  // Mobile Menu Icon & Typography Settings
  const [mobileMenuIcon, setMobileMenuIcon] = useState<string>('menu');
  const [typographySettings, setTypographySettings] = useState<TypographySettings>({
    fontFamily: 'Cairo',
    sizeDesktop: 16,
    sizeTablet: 15,
    sizeMobile: 14,
    weight: '600',
    transform: 'none',
    lineHeight: 1.6,
    letterSpacing: 0,
  });
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Seasonal Theme Preset Selection
  const [seasonalTheme, setSeasonalTheme] = useState<SeasonalPreset>(() => {
    const cur = storeActiveHomepage[activeStore.id] || '';
    if (cur.includes('Ramadan')) return 'Ramadan';
    if (cur.includes('Eid')) return 'Eid';
    if (cur.includes('Valentine')) return 'Valentine';
    return 'Default';
  });

  // Dynamic products per section derived from store catalog
  const sectionProducts = useMemo(() => {
    const list = currentProducts && currentProducts.length > 0 ? currentProducts.map((p) => {
      const isArName = /[\u0600-\u06FF]/.test(p.nameAr || p.name || '');
      const nameAr = p.nameAr || (isArName ? p.name : p.subtitleAr || p.name);
      const nameEn = (!isArName ? p.name : (p.subtitle || p.sku || p.name));
      const pAny = p as any;
      return {
        id: String(p.id),
        name: nameAr || 'باقة ورد طبيعي',
        nameEn: nameEn || 'Fresh Flower Bouquet',
        price: Number(p.discountedPrice || p.price || 0),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : (p.discountedPrice && p.discountedPrice < p.price ? Number(p.price) : undefined),
        rating: 4.9,
        reviewsCount: p.salesCount || 135,
        image: p.image || '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
        additionalImages: p.galleryUrls && p.galleryUrls.length > 0 ? p.galleryUrls : [p.image],
        category: p.category || 'باقات الورود الطبيعية',
        categoryEn: pAny.categoryEn || p.category || 'Natural Flower Bouquets',
        categorySlug: pAny.categorySlug || (p.category ? p.category.toLowerCase().replace(/\s+/g, '-') : 'bouquets'),
        occasions: p.tags || ['هدايا الحرم', 'مناسبات خاصة'],
        tags: p.tags || ['طبيعي', 'هولندي', 'فاخر'],
        badge: p.originalPrice ? 'عرض خاص' : undefined,
        badgeEn: p.originalPrice ? 'Special Offer' : undefined,
        description: p.descriptionAr || p.description || 'تنسيق فاخر من أجود أنواع الزهور والورود الطبيعية.',
        descriptionEn: p.description || p.descriptionAr || 'Luxury fresh floral arrangement crafted with premium blooms.',
        flowerTypes: pAny.flowerTypes || ['جوري هولندي فاخر', 'بيبي روز', 'يوكاليبتوس'],
        dimensions: pAny.dimensions || 'ارتفاع 50 سم × عرض 35 سم',
        inStock: p.stock !== undefined ? p.stock > 0 : true,
        featured: true,
      };
    }) : [];

    const filterByKeywords = (keywords: string[], fallback: Product[], maxLimit: number = 6) => {
      const matched = list.filter((p) => {
        const text = `${p.name} ${p.nameEn} ${p.category} ${p.categoryEn || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        return keywords.some((k) => text.includes(k.toLowerCase()));
      });
      if (matched.length >= maxLimit) return matched.slice(0, maxLimit);
      const existingIds = new Set(matched.map((m) => m.id));
      const rest = fallback.filter((f) => !existingIds.has(f.id));
      return [...matched, ...rest].slice(0, maxLimit);
    };

    return {
      natural: filterByKeywords(['طبيعي', 'باقة', 'rose', 'bouquet', 'peony', 'valent'], NATURAL_BOUQUETS, 6),
      luxury: filterByKeywords(['ملكي', 'سلة', 'طقم', 'vip', 'hamper', 'luxury', 'men', 'نساء'], LUXURY_SETS, 6),
      chocolate: filterByKeywords(['شوكول', 'باتشي', 'بستاني', 'choc'], CHOCOLATE_ROSES, 6),
      cake: filterByKeywords(['كيك', 'حلا', 'cake', 'ريد فيلفت', 'ميلاد'], CAKE_ROSES, 6),
      coffee: filterByKeywords(['قهوة', 'ضيافة', 'coffee'], COFFEE_SWEETS_ROSES, 6),
      vases: filterByKeywords(['فاز', 'كريستال', 'lily', 'orchid', 'vase'], FLOWER_VASES, 6),
      mawajeeb: filterByKeywords(['مواجيب', 'تراث', 'خشب', 'بخور'], MAWAJEEB_PRODUCTS, 4),
    };
  }, [currentProducts]);

  // Master Initial Blocks
  const [blocks, setBlocks] = useState<BlockElement[]>([
    {
      id: 'header',
      type: 'header',
      titleEn: 'Store Header & Navigation (Hadaya Makkah)',
      titleAr: 'رأس المتجر والقائمة الرئيسية (هدايا مكة)',
      visible: true,
      templateStyle: 'header-luxury-emerald',
      settings: {
        bgColor: '#102a1c',
        textColor: '#FAF9F5',
        accentColor: '#e6ca98',
        stickyHeader: true,
      },
    },
    {
      id: 'hero_slider',
      type: 'hero_slider',
      titleEn: '3D Motion Hero Slider (Hadaya Makkah)',
      titleAr: 'سلايدر الواجهة التفاعلي ثلاثي الأبعاد VIP',
      visible: true,
      templateStyle: 'hero-3d-motion',
      settings: {},
    },
    {
      id: 'marquee_banner',
      type: 'marquee_banner',
      titleEn: 'Luxury Running Marquee Announcement Bar',
      titleAr: 'شريط الإعلانات الترويجي المتحرك الفاخر',
      visible: true,
      templateStyle: 'marquee-pulsing-gold',
      settings: {},
    },
    {
      id: 'circle_categories',
      type: 'circle_categories',
      titleEn: 'Dedicated Circular Collections (Top 6)',
      titleAr: 'المجموعات والتصنيفات الدائرية الحصرية',
      visible: true,
      templateStyle: 'cats-gold-rings',
      settings: {
        titleEn: 'Shop by Sacred Occasion',
        titleAr: 'تسوق حسب المناسبة والتصنيف',
      },
    },
    {
      id: 'discounted_bouquets_3d',
      type: 'discounted_bouquets_3d',
      titleEn: 'Discounted Bouquets 3D Stack Gallery',
      titleAr: 'معرض باقات الورود الطبيعية المخفضة (3D)',
      visible: true,
      templateStyle: 'prod-3d-tilt-slider',
      settings: {
        titleEn: 'Discounted Fresh Flower Bouquets',
        titleAr: 'باقات ورود طبيعية مخفضة',
        subtitleEn: 'Finest arrangements at special prices with complimentary greeting card and express delivery',
        subtitleAr: 'أجمل التنسيقات بأسعار خاصة مع كرت إهداء مجاني وتوصيل سريع',
      },
    },
    {
      id: 'sec_natural_flowers',
      type: 'product_section_natural',
      titleEn: 'Natural Fresh Flower Bouquets',
      titleAr: 'باقات الورود الطبيعية',
      visible: true,
      templateStyle: 'prod-4col-luxury',
      settings: {
        titleEn: 'Natural Fresh Flower Bouquets',
        titleAr: 'باقات الورود الطبيعية',
        subtitleEn: 'Finest Dutch and Ecuadorian long-stem roses tailored by master florists',
        subtitleAr: 'أجود أنواع الجوري الهولندي والإكوادوري المنسق بأيدي أمهر الخبراء',
        limit: 6,
        columns: 4,
      },
    },
    {
      id: 'promo_banners_pair',
      type: 'promo_banners_pair',
      titleEn: 'Dual VIP Promotional Banners Pair',
      titleAr: 'البانرات الترويجية الثنائية VIP',
      visible: true,
      templateStyle: 'banner-dual-velvet',
      settings: {},
    },
    {
      id: 'promo_countdown_banner',
      type: 'promo_countdown_banner',
      titleEn: 'Special Flash Promo Countdown Banner',
      titleAr: 'بانر العرض الترويجي مع العداد التنازلي الحي',
      visible: true,
      templateStyle: 'countdown-urgent-emerald',
      settings: {},
    },
    {
      id: 'sec_luxury_gifts',
      type: 'product_section_luxury',
      titleEn: 'Royal Luxury Gift Sets (Men & Women)',
      titleAr: 'هدايا ملكية فاخرة (رجالية ونسائية)',
      visible: true,
      templateStyle: 'prod-4col-luxury',
      settings: {
        titleEn: 'Royal Luxury Gift Sets (Men & Women)',
        titleAr: 'هدايا ملكية فاخرة (رجالية ونسائية)',
        subtitleEn: 'Signature executive and feminine luxury gift sets with blooms and fine accessories',
        subtitleAr: 'أطقم هدايا استثنائية تضم عطوراً فاخرة، ساعات، أطقم مجوهرات وباقات زهور نضرة',
        limit: 6,
        columns: 4,
      },
    },
    {
      id: 'sec_chocolate_roses',
      type: 'product_section_chocolate',
      titleEn: 'Roses & Luxury Belgian Chocolates',
      titleAr: 'ورد وشوكولاتة بلجيكية فاخرة',
      visible: true,
      templateStyle: 'prod-4col-luxury',
      settings: {
        titleEn: 'Roses & Luxury Belgian Chocolates',
        titleAr: 'ورد وشوكولاتة بلجيكية فاخرة',
        subtitleEn: 'Signature Patchi and Bostani chocolate boxes paired with fresh roses',
        subtitleAr: 'أفخم تشكيلات باتشي وبستاني المنسقة مع باقات الجوري الساحرة',
        limit: 6,
        columns: 4,
      },
    },
    {
      id: 'sec_cake_roses',
      type: 'product_section_cake',
      titleEn: 'Roses & Gourmet Celebration Cakes',
      titleAr: 'ورد و كيك',
      visible: true,
      templateStyle: 'prod-4col-luxury',
      settings: {
        titleEn: 'Roses & Gourmet Celebration Cakes',
        titleAr: 'ورد و كيك',
        subtitleEn: 'Korean lunchbox cakes and artisan bakery paired with celebratory bouquets',
        subtitleAr: 'كيك كوري خاص وكعكات الريد فيلفيت الطازجة لمناسبات أعياد الميلاد والتخرج',
        limit: 6,
        columns: 4,
      },
    },
    {
      id: 'sec_coffee_sweets',
      type: 'product_section_coffee',
      titleEn: 'Roses, Arabic Coffee & Sweets',
      titleAr: 'ورد و قهوة و حلا',
      visible: true,
      templateStyle: 'prod-4col-luxury',
      settings: {
        titleEn: 'Roses, Arabic Coffee & Sweets',
        titleAr: 'ورد و قهوة و حلا',
        subtitleEn: 'Authentic Hijazi hospitality blending Arabic cardamom coffee with blooms',
        subtitleAr: 'أصالة الضيافة الحجازية مع القهوة العربية والتمور المحشوة والحلويات',
        limit: 6,
        columns: 4,
      },
    },
    {
      id: 'sec_flower_vases',
      type: 'product_section_vases',
      titleEn: 'Natural Flower Vases',
      titleAr: 'فازات ورود طبيعية',
      visible: true,
      templateStyle: 'prod-4col-luxury',
      settings: {
        titleEn: 'Natural Flower Vases',
        titleAr: 'فازات ورود طبيعية',
        subtitleEn: 'Hand-cut crystal and fluted ceramic vases elevating homes and offices',
        subtitleAr: 'فازات كريستالية وسيراميك راقية تدوم طويلاً لتزيين المجالس والمكاتب',
        limit: 6,
        columns: 4,
      },
    },
    {
      id: 'sec_mawajeeb',
      type: 'product_section_mawajeeb',
      titleEn: 'Mawajeeb Wooden Plaques & Heritage',
      titleAr: 'لوحات مواجيب وتراث حجازي',
      visible: true,
      templateStyle: 'prod-4col-luxury',
      settings: {
        titleEn: 'Mawajeeb Wooden Plaques & Heritage',
        titleAr: 'لوحات مواجيب وتراث حجازي',
        subtitleEn: 'Hand-carved wooden heritage plaques with authentic Maroki oud and fresh roses',
        subtitleAr: 'لوحات تذكارية وتراث حجازي عريق مع ورد وبخور مروكي فاخر',
        limit: 4,
        columns: 4,
      },
    },
    {
      id: 'social_reels',
      type: 'social_reels',
      titleEn: 'TikTok & Snapchat Social Reels',
      titleAr: 'ريلز وفيديوهات تنسيقات مكة',
      visible: true,
      templateStyle: 'reels-tiktok-slider',
      settings: {},
    },
    {
      id: 'video_section',
      type: 'video_section',
      titleEn: 'Hijazi Craftsmanship & Spirit Video',
      titleAr: 'فيديو الضيافة الملكية وروح الحجاز',
      visible: true,
      templateStyle: 'video-cinema-widescreen',
      settings: {},
    },
    {
      id: 'store_features_bar',
      type: 'store_features_bar',
      titleEn: 'Store Features & Express Delivery Bar',
      titleAr: 'مميزات وخدمات المتجر الملكية',
      visible: true,
      templateStyle: 'features-4col-pills',
      settings: {},
    },
    {
      id: 'metrics_section',
      type: 'metrics_section',
      titleEn: 'Metrics & Sacred Social Proof',
      titleAr: 'أرقام وإنجازات المتجر',
      visible: true,
      templateStyle: 'metrics-gold-counters',
      settings: {},
    },
    {
      id: 'reviews',
      type: 'reviews',
      titleEn: 'Verified Makkah Testimonials',
      titleAr: 'تقييمات ضيوفنا الموثقة في مكة',
      visible: true,
      templateStyle: 'reviews-verified-slider',
      settings: {},
    },
    {
      id: 'faq',
      type: 'faq',
      titleEn: 'Frequently Asked Questions',
      titleAr: 'الأسئلة الشائعة والأجوبة الفورية',
      visible: true,
      templateStyle: 'faq-accordion-emerald',
      settings: {},
    },
    {
      id: 'magazine_section',
      type: 'magazine_section',
      titleEn: 'Hadaya Makkah Magazine & Articles',
      titleAr: 'مقالات ومجلة هدايا مكة',
      visible: true,
      templateStyle: 'mag-editorial-3col',
      settings: {},
    },
    {
      id: 'newsletter',
      type: 'newsletter',
      titleEn: 'VIP Newsletter Subscription',
      titleAr: 'النشرة البريدية الحصرية VIP',
      visible: true,
      templateStyle: 'news-vip-gold-banner',
      settings: {},
    },
    {
      id: 'footer',
      type: 'footer',
      titleEn: 'Store Footer & Legal Identity',
      titleAr: 'تذييل المتجر والبيانات الضريبية',
      visible: true,
      templateStyle: 'footer-royal-emerald',
      settings: {},
    },
  ]);

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) || blocks[0],
    [blocks, selectedBlockId],
  );

  // Load Store Isolated Custom Templates on mount & block change
  useEffect(() => {
    const list = getCustomTemplatesForStore(activeStore.id, selectedBlock?.type);
    setCustomTemplatesList(list);
  }, [activeStore.id, selectedBlock?.type]);

  // Undo & Redo History
  const [history, setHistory] = useState<BlockElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  useEffect(() => {
    if (blocks.length > 0 && history.length === 0) {
      setHistory([blocks]);
      setHistoryIndex(0);
    }
  }, [blocks, history.length]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex((idx) => idx - 1);
      setBlocks(prev);
      toast(isAr ? 'تم التراجع خطوة للخلف' : 'Undo step', 'info');
    }
  }, [historyIndex, history, isAr, toast]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex((idx) => idx + 1);
      setBlocks(next);
      toast(isAr ? 'تمت إعادة الخطوة' : 'Redo step', 'info');
    }
  }, [historyIndex, history, isAr, toast]);

  // Optimized Throttled Mouse Dragging Listeners
  useEffect(() => {
    let animFrameId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (animFrameId !== null) return;
      animFrameId = requestAnimationFrame(() => {
        animFrameId = null;
        if (isDraggingLeft) {
          const newWidth = isAr ? window.innerWidth - e.clientX : e.clientX;
          if (newWidth >= 180 && newWidth <= 480) {
            setLeftSidebarWidth(newWidth);
          }
        } else if (isDraggingRight) {
          const newWidth = isAr ? e.clientX : window.innerWidth - e.clientX;
          if (newWidth >= 260 && newWidth <= 600) {
            setRightSidebarWidth(newWidth);
          }
        }
      });
    };

    const handleMouseUp = () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animFrameId !== null) cancelAnimationFrame(animFrameId);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingRight, isAr]);

  // Session Persistence & Debounced Auto-Save (Store & Theme Isolated)
  const draftStorageKey = `selia_builder_draft_${activeStore.id}_${currentThemeId}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setSaveStatus('saving');
        const draftData = {
          themeId: currentThemeId,
          blocks,
          seasonalTheme,
          typographySettings,
          mobileMenuIcon,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(draftStorageKey, JSON.stringify(draftData));
        setLastSavedTime(new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US'));
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
      } catch {
        setSaveStatus('error');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [blocks, seasonalTheme, typographySettings, mobileMenuIcon, activeStore.id, currentThemeId, draftStorageKey, isAr]);

  // Initial Restore on mount or when themeId changes (Store & Theme Isolated)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.blocks && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
          // Self-heal: ensure all blocks have required fields
          const healed = parsed.blocks.map((b: any) => ({
            id: b.id || `block_${Date.now()}`,
            type: b.type || 'generic',
            titleEn: b.titleEn || 'Section',
            titleAr: b.titleAr || 'قسم',
            visible: b.visible !== false,
            templateStyle: b.templateStyle || 'tpl-default-clean',
            settings: b.settings || {},
            customHtml: b.customHtml || '',
            customCss: b.customCss || '',
            customJs: b.customJs || '',
          }));
          setBlocks(healed);
        }
        if (parsed.seasonalTheme) setSeasonalTheme(parsed.seasonalTheme);
        if (parsed.typographySettings) setTypographySettings(parsed.typographySettings);
        if (parsed.mobileMenuIcon) setMobileMenuIcon(parsed.mobileMenuIcon);
      }
    } catch {
      // Auto-healed with defaults
    }
  }, [activeStore.id, currentThemeId, draftStorageKey]);

  // Add Widget from Library
  const handleAddWidget = useCallback((widget: WidgetDefinition) => {
    const newId = `widget_${widget.type}_${Date.now()}`;
    const newBlock: BlockElement = {
      id: newId,
      type: widget.type,
      titleAr: widget.titleAr,
      titleEn: widget.titleEn,
      visible: true,
      templateStyle: widget.templateStyle,
      settings: { ...widget.defaultSettings },
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newId);
    setHasUnsavedChanges(true);
    toast(
      isAr
        ? `تمت إضافة العنصر: "${widget.titleAr}" إلى الصفحة!`
        : `Added widget "${widget.titleEn}" to page!`,
      'success',
    );
  }, [isAr, toast]);

  // AI Content Application
  const handleAiApplyContent = useCallback((content: {
    titleAr?: string;
    titleEn?: string;
    subtitleAr?: string;
    subtitleEn?: string;
    contentAr?: string;
    contentEn?: string;
    seoTitleAr?: string;
    seoMetaDescAr?: string;
  }) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === selectedBlockId) {
          return {
            ...b,
            titleAr: content.titleAr || b.titleAr,
            titleEn: content.titleEn || b.titleEn,
            settings: {
              ...b.settings,
              ...(content.titleAr ? { titleAr: content.titleAr, headingAr: content.titleAr, mainTitleAr: content.titleAr } : {}),
              ...(content.titleEn ? { titleEn: content.titleEn, headingEn: content.titleEn, mainTitleEn: content.titleEn } : {}),
              ...(content.subtitleAr ? { subtitleAr: content.subtitleAr, subheadingAr: content.subtitleAr } : {}),
              ...(content.subtitleEn ? { subtitleEn: content.subtitleEn, subheadingEn: content.subtitleEn } : {}),
              ...(content.contentAr ? { textAr: content.contentAr } : {}),
              ...(content.contentEn ? { textEn: content.contentEn } : {}),
            },
          };
        }
        return b;
      }),
    );
    setHasUnsavedChanges(true);
    toast(
      isAr ? 'تم تطبيق اقتراح الذكاء الاصطناعي بنجاح!' : 'AI content applied successfully!',
      'success',
    );
  }, [selectedBlockId, isAr, toast]);

  // AI Add Section
  const handleAiAddSection = useCallback((sec: {
    type: string;
    titleAr: string;
    titleEn: string;
    templateStyle: string;
  }) => {
    const newId = `sec_ai_${sec.type}_${Date.now()}`;
    const newBlock: BlockElement = {
      id: newId,
      type: sec.type,
      titleAr: sec.titleAr,
      titleEn: sec.titleEn,
      visible: true,
      templateStyle: sec.templateStyle,
      settings: {},
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newId);
    setHasUnsavedChanges(true);
    toast(
      isAr ? `تمت إضافة القسم المقترح "${sec.titleAr}"` : `Added suggested section "${sec.titleEn}"`,
      'success',
    );
  }, [isAr, toast]);

  // Handle Updates to Settings
  const handleUpdateBlockSetting = useCallback((key: string, value: any) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === selectedBlockId) {
          return {
            ...b,
            settings: {
              ...b.settings,
              [key]: value,
            },
          };
        }
        return b;
      }),
    );
  }, [selectedBlockId]);

  // Handle Custom Code Update
  const handleUpdateBlockCode = useCallback((type: 'customHtml' | 'customCss' | 'customJs', code: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === selectedBlockId) {
          return {
            ...b,
            [type]: code,
          };
        }
        return b;
      }),
    );
  }, [selectedBlockId]);

  // Handle Instant Template Application
  const handleUpdateTemplateStyle = (templateKey: string, presetSettings?: Record<string, any>) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === selectedBlockId) {
          return {
            ...b,
            templateStyle: templateKey,
            settings: {
              ...b.settings,
              ...(presetSettings || {}),
              tabsStyle: b.id === 'product_tabs' ? templateKey : b.settings.tabsStyle,
            },
          };
        }
        return b;
      }),
    );
    toast(
      isAr
        ? `تم تطبيق النموذج المختار فوراً على القسم!`
        : `Applied template style in real-time!`,
      'success',
    );
  };

  // Handle Apply Custom Saved Template
  const handleApplyCustomTemplate = (tpl: CustomSectionTemplate) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === selectedBlockId) {
          return {
            ...b,
            templateStyle: tpl.templateStyle || b.templateStyle,
            settings: {
              ...b.settings,
              ...(tpl.settings || {}),
            },
            customHtml: tpl.customHtml || b.customHtml,
            customCss: tpl.customCss || b.customCss,
          };
        }
        return b;
      }),
    );
    toast(
      isAr ? `تم تطبيق قالبك المخصص: ${tpl.nameAr || tpl.nameEn}` : `Applied custom template: ${tpl.nameEn}`,
      'success',
    );
  };

  // Save Current Section as Custom Template
  const handleSaveAsCustomTemplate = () => {
    if (!selectedBlock) return;
    const nameEn = customTplNameEn.trim() || `${selectedBlock.titleEn} Template`;
    const nameAr = customTplNameAr.trim() || `${selectedBlock.titleAr} قالب`;
    
    saveCustomSectionTemplate(activeStore.id, {
      blockType: selectedBlock.type,
      nameEn,
      nameAr,
      badge: 'Custom',
      descEn: customTplDescEn || `Customized ${selectedBlock.titleEn} layout`,
      descAr: customTplDescAr || `تصميم مخصص لقسم ${selectedBlock.titleAr}`,
      templateStyle: selectedBlock.templateStyle,
      settings: selectedBlock.settings,
      customCss: selectedBlock.customCss,
      customHtml: selectedBlock.customHtml,
    });

    const updated = getCustomTemplatesForStore(activeStore.id, selectedBlock.type);
    setCustomTemplatesList(updated);
    setShowSaveCustomTplModal(false);
    setCustomTplNameEn('');
    setCustomTplNameAr('');
    setCustomTplDescEn('');
    setCustomTplDescAr('');
    toast(
      isAr ? 'تم حفظ القالب المخصص بنجاح في مكتبتك الخاصة بالمتجر!' : 'Saved custom template to store library!',
      'success',
    );
  };

  // Delete Custom Template
  const handleDeleteCustomTemplate = (id: string, name: string) => {
    deleteCustomSectionTemplate(activeStore.id, id);
    setCustomTemplatesList((prev) => prev.filter((t) => t.id !== id));
    toast(
      isAr ? `تم حذف القالب "${name}"` : `Deleted template "${name}"`,
      'info',
    );
  };

  const handleSelectBlock = useCallback((id: string) => {
    setSelectedBlockId(id);
    setRightSidebarVisible(true);
  }, []);

  const handleToggleBlockVisibility = useCallback((id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)),
    );
  }, []);

  const handleMoveBlock = useCallback((id: string, direction: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
  }, []);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBlockIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBlockIdx !== index) {
      setDragOverBlockIdx(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedBlockIdx === null || draggedBlockIdx === dropIndex) {
      setDraggedBlockIdx(null);
      setDragOverBlockIdx(null);
      return;
    }
    setBlocks((prev) => {
      const next = [...prev];
      const [movedItem] = next.splice(draggedBlockIdx, 1);
      next.splice(dropIndex, 0, movedItem);
      return next;
    });
    setDraggedBlockIdx(null);
    setDragOverBlockIdx(null);
    toast(isAr ? 'تم إعادة ترتيب القسم بالسحب والإفلات' : 'Section reordered via drag and drop', 'success');
  };

  const handleDuplicateBlock = (id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const target = prev[idx];
      const cloned: BlockElement = {
        ...target,
        id: `${target.id}_copy_${Date.now()}`,
        titleEn: `${target.titleEn} (Copy)`,
        titleAr: `${target.titleAr} (نسخة)`,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, cloned);
      return next;
    });
    toast(isAr ? 'تم تكرار القسم بنجاح' : 'Section duplicated successfully', 'success');
  };

  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      toast(isAr ? 'لا يمكن حذف كافة الأقسام' : 'Cannot delete all sections', 'info');
      return;
    }
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedBlockId((prev) => (prev === id ? blocks[0].id : prev));
    toast(isAr ? 'تم حذف القسم' : 'Section deleted', 'info');
  };

  const handleAddNewSection = (payload: NewSectionPayload) => {
    const newId = `section_${payload.blockType}_${Date.now()}`;
    const initialSettings: Record<string, any> = {
      topSpacing: 16,
      bottomSpacing: 24,
      layoutColumns: payload.layoutColumns,
    };

    if (payload.blockType === 'dynamic_product_row' || payload.blockType === 'shortcode_widget') {
      initialSettings.filterType = 'category';
      initialSettings.categorySlug = 'natural-bouquets';
      initialSettings.categoryName = 'باقات الورود الطبيعية';
      initialSettings.limit = 6;
      initialSettings.columns = 4;
      initialSettings.layout = 'slider';
      initialSettings.shortcode = '[products category="natural-bouquets" limit="6" layout="slider"]';
      initialSettings.titleAr = payload.titleAr || 'باقات الورود الطبيعية';
      initialSettings.titleEn = payload.titleEn || 'Natural Flower Bouquets';
      initialSettings.subtitleAr = 'أجود أنواع الجوري الهولندي والإكوادوري المنسق بأيدي أمهر الخبراء بمكة';
      initialSettings.subtitleEn = 'Finest Dutch and Ecuadorian long-stem roses tailored by master florists';
    }

    const newBlock: BlockElement = {
      id: newId,
      type: payload.blockType as any,
      titleEn: payload.titleEn,
      titleAr: payload.titleAr,
      visible: true,
      templateStyle: payload.templateStyle,
      settings: initialSettings,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newId);
    setActiveTab('content');
    setRightSidebarVisible(true);
    toast(
      isAr ? `تمت إضافة قسم ${payload.titleAr} بنجاح` : `Added ${payload.titleEn} successfully`,
      'success',
    );
  };

  // Seasonal Theme Switcher Handler
  const handleSeasonalChange = (season: SeasonalPreset) => {
    setSeasonalTheme(season);
    const styleKey =
      season === 'Default'
        ? 'Default Commerce'
        : season === 'Eid'
          ? 'Eid Home'
          : season === 'Ramadan'
            ? 'Ramadan Home'
            : 'Valentine Home';
    setStoreHomepageStyle(activeStore.id, styleKey);

    const colors = getSeasonalThemeColors(styleKey);
    setBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        settings: {
          ...b.settings,
          accentColor: colors.accent,
        },
      })),
    );

    toast(
      isAr
        ? `تم تفعيل قالب الموسم: ${season === 'Ramadan' ? 'رمضان كريم' : season === 'Eid' ? 'العيد المبارك' : season === 'Valentine' ? 'باقات الحب' : 'الافتراضي العصري'}`
        : `Switched seasonal style to: ${season} Edition!`,
      'success',
    );
  };

  // Real Database Publish Live Sync
  const handlePublishLive = () => {
    try {
      const full = readAllThemeSettings(activeStore.id, activeStore);
      const annBlock = blocks.find((b) => b.id === 'announcement');
      const tabsBlock = blocks.find((b) => b.id === 'product_tabs');
      const sliderBlock = blocks.find((b) => b.id === 'hero_slider');

      if (annBlock) {
        full.announcementBar.enabled = annBlock.visible;
        full.announcementBar.bgColor = annBlock.settings.bgColor;
        full.announcementBar.textColor = annBlock.settings.textColor;
        if (annBlock.settings.textEn) {
          full.announcementBar.messages[0] = {
            id: 'm1',
            text: isAr ? annBlock.settings.textAr : annBlock.settings.textEn,
            link: annBlock.settings.buttonUrl || '#',
            icon: 'Megaphone',
            active: true,
          };
        }
      }

      if (tabsBlock) {
        full.tabs.enabled = tabsBlock.visible;
        full.tabs.mainTitle = isAr ? tabsBlock.settings.mainTitleAr : tabsBlock.settings.mainTitleEn;
        full.tabs.subtitle = isAr ? tabsBlock.settings.subtitleAr : tabsBlock.settings.subtitleEn;
        full.tabs.tabsStyle = tabsBlock.settings.tabsStyle || 'buttons';
        full.tabs.displayType = tabsBlock.settings.displayType || 'grid';
        full.tabs.numberOfProducts = tabsBlock.settings.limit || 8;
        (full.tabs as any).cardStyle = tabsBlock.settings.cardStyle || '3d_tilt';
      }

      if (sliderBlock) {
        full.slider.slides[0] = {
          id: 'slide-1',
          type: 'image',
          image: sliderBlock.settings.bgImage || full.slider.slides[0]?.image || '',
          title: isAr ? sliderBlock.settings.headingAr : sliderBlock.settings.headingEn,
          subtitle: isAr ? sliderBlock.settings.subheadingAr : sliderBlock.settings.subheadingEn,
          buttonText: isAr ? sliderBlock.settings.ctaTextAr : sliderBlock.settings.ctaTextEn,
          buttonUrl: sliderBlock.settings.ctaLink || '#',
          badge: isAr ? sliderBlock.settings.badgeAr : sliderBlock.settings.badgeEn,
        };
      }

      // Save custom fonts and mobile icon into general
      full.general.fontFamily = typographySettings.fontFamily;
      full.general.customFontUrl = typographySettings.customFontUrl;
      full.general.mobileMenuIcon = mobileMenuIcon;

      // Activate published theme for this store
      setStoreTheme(activeStore.id, currentThemeId);
      setStoreHomepageStyle(activeStore.id, seasonalTheme);

      // Write to Store Isolated Theme Database
      writeAllThemeSettings(activeStore.id, full);

      // Save draft under isolated theme key
      const draftData = {
        themeId: currentThemeId,
        blocks,
        seasonalTheme,
        typographySettings,
        mobileMenuIcon,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(draftData));
      setLastSavedTime(new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US'));
      setHasUnsavedChanges(false);

      toast(
        isAr
          ? 'تم نشر التعديلات وتفعيل الثيم بنجاح على المتجر المباشر!'
          : 'Theme changes and configuration published live!',
        'success',
      );
      if (onPublishSuccess) onPublishSuccess();
    } catch (err: any) {
      toast(
        isAr ? `تعذر النشر المباشر: ${err?.message || 'خطأ غير معروف'}` : `Publish failed: ${err?.message || 'Unknown error'}`,
        'error',
      );
    }
  };

  const handleSaveDraft = () => {
    try {
      const draftData = {
        themeId: currentThemeId,
        blocks,
        seasonalTheme,
        typographySettings,
        mobileMenuIcon,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(draftData));
      setLastSavedTime(new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US'));
      setHasUnsavedChanges(false);
      toast(
        isAr ? 'تم حفظ مسودة التصميم بنجاح' : 'Design draft saved successfully!',
        'success',
      );
    } catch {
      toast('Draft saved', 'success');
    }
  };

  // All 11 Builder Pages Configuration
  const ALL_BUILDER_PAGES: Array<{
    id: PreviewPage;
    icon: React.ComponentType<{ className?: string }>;
    labelAr: string;
    labelEn: string;
    badge?: string;
  }> = [
    { id: 'home', icon: Home, labelAr: 'الرئيسية (Home Page)', labelEn: 'Home Page' },
    { id: 'catalog', icon: LayoutGrid, labelAr: 'كافة التشكيلات والكتالوج (All Collections)', labelEn: 'All Collections Catalog', badge: 'Shop' },
    { id: 'product', icon: ShoppingBag, labelAr: 'صفحة تفاصيل المنتج (Product Detail)', labelEn: 'Product Details Page', badge: 'VIP' },
    { id: 'cart', icon: ShoppingCart, labelAr: 'سلة المشتريات والهدايا (Shopping Cart)', labelEn: 'Shopping Bag / Cart' },
    { id: 'checkout', icon: CreditCard, labelAr: 'الدفع السريع وفاتورة زاتكا (Express Checkout)', labelEn: 'Saudi Checkout (ZATCA)', badge: 'KSA' },
    { id: 'thankyou', icon: CheckCircle2, labelAr: 'الفاتورة وتأكيد الطلب (Tax Invoice & Success)', labelEn: 'Thank You & Tax Invoice' },
    { id: 'crm', icon: Award, labelAr: 'بوابة كبار الشخصيات ونقاط الولاء (VIP CRM Portal)', labelEn: 'VIP CRM & Account', badge: 'VIP' },
    { id: 'about', icon: Info, labelAr: 'من نحن وبوتيك مكة (About Hadaya Makkah)', labelEn: 'About Hadaya Makkah' },
    { id: 'contact', icon: Phone, labelAr: 'اتصل بنا وفروع الحرم (VIP Concierge & Contact)', labelEn: 'VIP Concierge & Contact' },
    { id: 'location', icon: MapPin, labelAr: 'فروع مكة ومواقع المتاجر (Store Locator)', labelEn: 'Makkah Branches Locator' },
    { id: 'track-order', icon: Truck, labelAr: 'تتبع مسار التوصيل المباشر (Track Sacred Delivery)', labelEn: 'Live Delivery Tracker', badge: 'Live' },
    { id: 'privacy', icon: Lock, labelAr: 'سياسة الخصوصية والأمان (Privacy & Protection)', labelEn: 'Privacy Policy' },
    { id: 'return', icon: RotateCcw, labelAr: 'ضمان النضارة والاسترجاع (Freshness Guarantee)', labelEn: 'Return Policy' },
  ];

  const currentActivePageObj = ALL_BUILDER_PAGES.find((p) => p.id === previewPage) || ALL_BUILDER_PAGES[0];

  const visibleBlocks = useMemo(() => blocks.filter((b) => b.visible), [blocks]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-100 text-slate-900 select-none overflow-hidden font-sans"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: typographySettings.fontFamily }}
    >
      {/* ========================================================
          1. CLEAN COMPACT TOPBAR WITH SLEEK DROPDOWNS
          ======================================================== */}
      <header className="h-16 px-4 bg-white border-b border-slate-200/90 shadow-xs flex items-center justify-between shrink-0 z-30 gap-2 relative">
        {/* Left: Branding & All-Pages Dropdown */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title={isAr ? 'الرجوع للمتجر' : 'Back to Store'}
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-indigo-200 shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="hidden sm:block min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-extrabold text-xs text-slate-900 truncate">
                  {getStoreDisplayName(activeStore, locale)}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  Page Builder
                </span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

          {/* ALL PAGES SWITCHER DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPageDropdownOpen(!pageDropdownOpen);
                setSeasonDropdownOpen(false);
                setToolsDropdownOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              {(() => {
                const PageIcon = currentActivePageObj.icon;
                return <PageIcon className="w-4 h-4 text-indigo-600 shrink-0" />;
              })()}
              <span className="truncate max-w-[130px] sm:max-w-[180px]">
                {isAr ? currentActivePageObj.labelAr : currentActivePageObj.labelEn}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${pageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {pageDropdownOpen && (
              <div className="absolute top-full mt-1.5 start-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-50 space-y-0.5 max-h-96 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 mb-1">
                  {isAr ? 'صفحات المتجر (١١ صفحة)' : 'Store Pages (11 Pages)'}
                </div>
                {ALL_BUILDER_PAGES.map((p) => {
                  const isActive = previewPage === p.id;
                  const PIcon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPreviewPage(p.id);
                        setPageDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-start flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <PIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>{isAr ? p.labelAr : p.labelEn}</span>
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* THEME SELECTOR & ACTIVE STATUS */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setThemeDropdownOpen(!themeDropdownOpen);
                setPageDropdownOpen(false);
                setSeasonDropdownOpen(false);
                setToolsDropdownOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Palette className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate max-w-[110px] sm:max-w-[150px]">
                {currentThemeObj?.name || 'Theme'}
              </span>
              {isEditingActiveTheme ? (
                <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                  {isAr ? 'النشط' : 'Live'}
                </span>
              ) : (
                <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">
                  {isAr ? 'مسودة' : 'Draft'}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-indigo-400 transition-transform ${themeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {themeDropdownOpen && (
              <div className="absolute top-full mt-1.5 start-0 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                  {isAr ? 'اختر الثيم للتحرير والمعاينة:' : 'Select Theme to Customize:'}
                </div>
                {themes.map((t) => {
                  const isCurrent = t.id === currentThemeId;
                  const isLive = t.id === liveStoreThemeId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (hasUnsavedChanges) {
                          const proceed = window.confirm(
                            isAr
                              ? 'لديك تعديلات غير محفوظة في الثيم الحالي، هل تريد الانتقال لثيم آخر؟'
                              : 'You have unsaved changes. Switch theme anyway?',
                          );
                          if (!proceed) return;
                        }
                        setCurrentThemeId(t.id);
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-start flex flex-col gap-0.5 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span className="truncate">{t.name}</span>
                        {isLive && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            {isAr ? 'النشط بالمتجر' : 'Active Store'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate">{t.tagline}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Center: Device Viewport & Seasonal Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-0.5">
            {[
              { mode: 'desktop' as DeviceMode, icon: <Monitor className="w-3.5 h-3.5" />, label: 'Desktop' },
              { mode: 'laptop' as DeviceMode, icon: <Laptop className="w-3.5 h-3.5" />, label: 'Laptop' },
              { mode: 'tablet' as DeviceMode, icon: <Tablet className="w-3.5 h-3.5" />, label: 'Tablet' },
              { mode: 'mobile' as DeviceMode, icon: <Smartphone className="w-3.5 h-3.5" />, label: 'Mobile' },
            ].map((d) => (
              <button
                key={d.mode}
                type="button"
                onClick={() => setDevice(d.mode)}
                className={`p-1.5 px-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  device === d.mode
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={d.label}
              >
                {d.icon}
                <span className="hidden xl:inline text-[11px]">{d.label}</span>
              </button>
            ))}
          </div>

          {/* SEASONAL THEME PRESETS DROPDOWN */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => {
                setSeasonDropdownOpen(!seasonDropdownOpen);
                setPageDropdownOpen(false);
                setToolsDropdownOpen(false);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <span className="flex items-center gap-1.5">
                {seasonalTheme === 'Ramadan' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'رمضان المبارك' : 'Ramadan'}</span>
                  </>
                ) : seasonalTheme === 'Eid' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isAr ? 'العيد المبارك' : 'Eid'}</span>
                  </>
                ) : seasonalTheme === 'Valentine' ? (
                  <>
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isAr ? 'عيد الحب' : 'Valentine'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isAr ? 'الافتراضي' : 'Default'}</span>
                  </>
                )}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${seasonDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {seasonDropdownOpen && (
              <div className="absolute top-full mt-1.5 end-0 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-50 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-150">
                {[
                  { id: 'Default' as SeasonalPreset, icon: Zap, iconColor: 'text-indigo-500', labelAr: 'الافتراضي العصري', labelEn: 'Default Emerald' },
                  { id: 'Eid' as SeasonalPreset, icon: Sparkles, iconColor: 'text-emerald-500', labelAr: 'العيد المبارك', labelEn: 'Eid Royal' },
                  { id: 'Ramadan' as SeasonalPreset, icon: Moon, iconColor: 'text-amber-500', labelAr: 'رمضان المبارك', labelEn: 'Ramadan Kareem' },
                  { id: 'Valentine' as SeasonalPreset, icon: Heart, iconColor: 'text-rose-500', labelAr: 'عيد الحب والرومانسية', labelEn: 'Valentine Rose' },
                ].map((s) => {
                  const SIcon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        handleSeasonalChange(s.id);
                        setSeasonDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-start flex items-center justify-between cursor-pointer ${
                        seasonalTheme === s.id
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <SIcon className={`w-4 h-4 ${s.iconColor}`} />
                        <span>{isAr ? s.labelAr : s.labelEn}</span>
                      </span>
                      {seasonalTheme === s.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Toggle Sidebar Buttons */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}
              className={`p-1.5 px-2 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                leftSidebarVisible ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title={isAr ? 'إظهار / إخفاء أقسام الصفحة' : 'Toggle Left Blocks Outline'}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[10px]">{isAr ? 'الأقسام' : 'Blocks'}</span>
            </button>

            <button
              type="button"
              onClick={() => setRightSidebarVisible(!rightSidebarVisible)}
              className={`p-1.5 px-2 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                rightSidebarVisible ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title={isAr ? 'إظهار / إخفاء لوحة التعديل' : 'Toggle Right Inspector'}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-[10px]">{isAr ? 'المفتش' : 'Inspector'}</span>
            </button>
          </div>
        </div>

        {/* Right: Tools & Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setToolsDropdownOpen(!toolsDropdownOpen);
                setPageDropdownOpen(false);
                setSeasonDropdownOpen(false);
              }}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
              title={isAr ? 'أدوات العرض واللغة' : 'View Tools & Settings'}
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            </button>

            {toolsDropdownOpen && (
              <div className="absolute top-full mt-1.5 end-0 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 space-y-2 text-xs animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="font-bold text-slate-700">{isAr ? 'اللغة / الاتجاه' : 'Language'}</span>
                  <button
                    type="button"
                    onClick={() => setLocale(isAr ? 'en' : 'ar')}
                    className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] cursor-pointer"
                  >
                    {isAr ? 'English (LTR)' : 'العربية (RTL)'}
                  </button>
                </div>

                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="font-bold text-slate-700">{isAr ? 'خلفية المعاينة' : 'Canvas Mode'}</span>
                  <button
                    type="button"
                    onClick={() => setCanvasDarkMode(!canvasDarkMode)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    {canvasDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {lastSavedTime && (
                  <div className="text-[10px] text-slate-400 text-center font-mono pt-1 flex items-center justify-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>{isAr ? `حفظ تلقائي: ${lastSavedTime}` : `Auto-saved: ${lastSavedTime}`}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shortcode Generator */}
          <button
            type="button"
            onClick={() => setShowShortcodeModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-colors"
            title={isAr ? 'توليد ونسخ كود قصير للمنتجات' : 'Generate & Copy Product Shortcodes'}
          >
            <Code className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden md:inline">{isAr ? 'الأكواد القصيرة' : 'Shortcodes'}</span>
          </button>

          {/* Undo & Redo History */}
          <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title={isAr ? 'تراجع (Undo)' : 'Undo'}
            >
              <Undo2 className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title={isAr ? 'إعادة (Redo)' : 'Redo'}
            >
              <Redo2 className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
          </div>

          {/* Live Preview Mode Toggle */}
          <button
            type="button"
            onClick={() => setPreviewModeOnly(!previewModeOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
              previewModeOnly
                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title={isAr ? 'معاينة حية للمتجر كزائر حقيقي' : 'Live Store Preview'}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isAr ? (previewModeOnly ? 'إنهاء المعاينة' : 'معاينة المتجر') : (previewModeOnly ? 'Exit Preview' : 'Preview')}</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="hidden sm:inline-flex px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAr ? 'حفظ' : 'Save'}</span>
          </button>

          {/* Publish Live */}
          <button
            type="button"
            onClick={handlePublishLive}
            className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 cursor-pointer inline-flex items-center gap-1.5 transition-all hover:scale-[1.02]"
          >
            <Send className="w-3.5 h-3.5 rtl:-scale-x-100" />
            <span>{isAr ? 'نشر مباشر' : 'Publish Live'}</span>
          </button>
        </div>
      </header>

      {/* Live Preview Notification Banner */}
      {previewModeOnly && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md z-40 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{isAr ? 'وضع المعاينة الحية المباشرة — تصفح المتجر بكامل ميزاته كما يراه العملاء' : 'Live Store Preview Mode — Experience your store as customers see it'}</span>
          </div>
          <button
            type="button"
            onClick={() => setPreviewModeOnly(false)}
            className="px-3 py-1 bg-white text-amber-900 rounded-lg hover:bg-amber-50 cursor-pointer shadow-xs font-extrabold text-xs transition-all hover:scale-105"
          >
            {isAr ? 'إنهاء المعاينة والعودة للتعديل' : 'Exit Preview & Return to Editor'}
          </button>
        </div>
      )}

      {/* ========================================================
          2. THREE-PANEL ELEMENTOR WORKSPACE WITH MOUSE RESIZING
          ======================================================== */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* ========================================================
            LEFT SIDEBAR: BLOCKS & LAYOUT OUTLINE (RESIZABLE)
            ======================================================== */}
        {leftSidebarVisible && !previewModeOnly ? (
          <aside
            style={{ width: `${leftSidebarWidth}px` }}
            className="bg-white border-e border-slate-200 flex flex-col shrink-0 relative select-none"
          >
            {/* Header Tabs: Widgets Library vs Layers Outline */}
            <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setLeftTab('layers')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  leftTab === 'layers'
                    ? 'bg-white text-indigo-700 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isAr ? 'الطبقات' : 'Layers'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
                  {blocks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab('widgets')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  leftTab === 'widgets'
                    ? 'bg-white text-indigo-700 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isAr ? 'العناصر' : 'Widgets'}</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            {leftTab === 'widgets' ? (
              <div className="flex-1 overflow-y-auto">
                <BuilderWidgetLibrary onAddWidget={handleAddWidget} isAr={isAr} />
              </div>
            ) : (
              <>
                {/* Blocks List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {blocks.map((b, idx) => {
                    const isSelected = selectedBlockId === b.id;
                    const BIcon = getBlockIcon(b.type);
                    return (
                      <div
                        key={b.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onClick={() => handleSelectBlock(b.id)}
                        className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs font-bold'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        } ${!b.visible ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 cursor-grab shrink-0" />
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <BIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs truncate font-medium">
                            {isAr ? b.titleAr : b.titleEn}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBlockVisibility(b.id);
                            }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                            title={b.visible ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                          >
                            {b.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-rose-500" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateBlock(b.id);
                            }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                            title={isAr ? 'تكرار القسم' : 'Duplicate'}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBlock(b.id);
                            }}
                            className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 cursor-pointer"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Section Button */}
                <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddSectionModal(true)}
                    className="w-full py-2 px-3 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'إضافة قسم جديد (Elementor Grid)' : 'Add New Section'}</span>
                  </button>
                </div>
              </>
            )}

            {/* Left Resize Handle */}
            <div
              onMouseDown={() => setIsDraggingLeft(true)}
              className="absolute top-0 bottom-0 end-0 w-1.5 cursor-col-resize hover:bg-indigo-500 transition-colors z-30"
            />
          </aside>
        ) : !previewModeOnly ? (
          <button
            type="button"
            onClick={() => setLeftSidebarVisible(true)}
            className="absolute start-2 top-4 z-40 p-2 rounded-xl bg-white shadow-lg border border-slate-200 text-slate-700 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-all"
            title={isAr ? 'إظهار أقسام الصفحة' : 'Show Blocks'}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">{isAr ? 'الأقسام' : 'Blocks'}</span>
          </button>
        ) : null}

        {/* ========================================================
            CENTER CANVAS: LIVE INTERACTIVE PREVIEW
            ======================================================== */}
        <main
          className={`flex-1 overflow-y-auto flex flex-col items-center p-4 transition-colors ${
            canvasDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
          }`}
        >
          <div
            className={`transition-all duration-300 w-full ${
              device === 'mobile'
                ? 'max-w-[390px] shadow-2xl rounded-[40px] border-[10px] border-slate-900 overflow-hidden bg-white min-h-[780px]'
                : device === 'tablet'
                  ? 'max-w-[768px] shadow-xl rounded-3xl border border-slate-300 overflow-hidden bg-white min-h-[900px]'
                  : device === 'laptop'
                    ? 'max-w-[1180px] shadow-lg rounded-2xl border border-slate-200 overflow-hidden bg-white'
                    : 'max-w-[1400px] shadow-sm rounded-xl border border-slate-200 overflow-hidden bg-white'
            }`}
          >
            {/* Real Page Canvas Content */}
            {previewPage === 'home' ? (
              <div className="divide-y divide-slate-100">
                {visibleBlocks.map((b, idx) => (
                  <CanvasBlockItem
                    key={b.id}
                    b={b}
                    idx={idx}
                    totalBlocks={visibleBlocks.length}
                    isSelected={selectedBlockId === b.id}
                    isAr={isAr}
                    device={device}
                    sectionProducts={sectionProducts}
                    onSelect={handleSelectBlock}
                    onMove={handleMoveBlock}
                    onToggleVisibility={handleToggleBlockVisibility}
                  />
                ))}
              </div>
            ) : previewPage === 'catalog' ? (
              <CatalogPage />
            ) : previewPage === 'product' ? (
              <BuilderProductPage
                isAr={isAr}
                money={money}
                onNavigateHome={() => setPreviewPage('home')}
                onNavigatePage={(p) => setPreviewPage(p as PreviewPage)}
                isMobile={device === 'mobile'}
              />
            ) : previewPage === 'cart' ? (
              <BuilderCartPage
                isAr={isAr}
                money={money}
                onNavigateHome={() => setPreviewPage('home')}
                onNavigatePage={(p) => setPreviewPage(p as PreviewPage)}
                isMobile={device === 'mobile'}
              />
            ) : previewPage === 'checkout' ? (
              <BuilderCheckoutPage
                isAr={isAr}
                money={money}
                onNavigateHome={() => setPreviewPage('home')}
                onNavigatePage={(p) => setPreviewPage(p as PreviewPage)}
                isMobile={device === 'mobile'}
              />
            ) : previewPage === 'thankyou' ? (
              <BuilderThankYouPage
                isAr={isAr}
                money={money}
                onNavigateHome={() => setPreviewPage('home')}
                onNavigatePage={(p) => setPreviewPage(p as PreviewPage)}
                isMobile={device === 'mobile'}
              />
            ) : previewPage === 'about' ? (
              <BuilderAboutPage
                isAr={isAr}
                money={money}
                onNavigateHome={() => setPreviewPage('home')}
                onNavigatePage={(p) => setPreviewPage(p as PreviewPage)}
                isMobile={device === 'mobile'}
              />
            ) : previewPage === 'contact' ? (
              <BuilderContactPage
                isAr={isAr}
                money={money}
                onNavigateHome={() => setPreviewPage('home')}
                onNavigatePage={(p) => setPreviewPage(p as PreviewPage)}
                isMobile={device === 'mobile'}
              />
            ) : previewPage === 'location' ? (
              <BuilderStoreLocatorPage
                isAr={isAr}
                money={money}
                onNavigateHome={() => setPreviewPage('home')}
                onNavigatePage={(p) => setPreviewPage(p as PreviewPage)}
                isMobile={device === 'mobile'}
              />
            ) : previewPage === 'track-order' ? (
              <BuilderTrackOrderPage
                isAr={isAr}
                money={money}
                onNavigateHome={() => setPreviewPage('home')}
                onNavigatePage={(p) => setPreviewPage(p as PreviewPage)}
                isMobile={device === 'mobile'}
              />
            ) : previewPage === 'privacy' ? (
              <BuilderPrivacyPage
                isAr={isAr}
                money={money}
                onNavigateHome={() => setPreviewPage('home')}
                onNavigatePage={(p) => setPreviewPage(p as PreviewPage)}
                isMobile={device === 'mobile'}
              />
            ) : previewPage === 'return' ? (
              <BuilderReturnPolicyPage
                isAr={isAr}
                money={money}
                onNavigateHome={() => setPreviewPage('home')}
                onNavigatePage={(p) => setPreviewPage(p as PreviewPage)}
                isMobile={device === 'mobile'}
              />
            ) : null}
          </div>
        </main>

        {/* ========================================================
            RIGHT SIDEBAR: ELEMENTOR INSPECTOR (RESIZABLE)
            ======================================================== */}
        {rightSidebarVisible && !previewModeOnly ? (
          <aside
            style={{ width: `${rightSidebarWidth}px` }}
            className="bg-white border-s border-slate-200 flex flex-col shrink-0 relative select-none"
          >
            {/* Right Resize Handle */}
            <div
              onMouseDown={() => setIsDraggingRight(true)}
              className="absolute top-0 bottom-0 start-0 w-1.5 cursor-col-resize hover:bg-indigo-500 transition-colors z-30"
            />

            {/* Inspector Top Header */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {(() => {
                  const BIcon = getBlockIcon(selectedBlock.type);
                  return (
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <BIcon className="w-4 h-4" />
                    </span>
                  );
                })()}
                <div className="min-w-0">
                  <span className="font-extrabold text-xs text-slate-900 block truncate">
                    {isAr ? selectedBlock.titleAr : selectedBlock.titleEn}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedBlock.templateStyle}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowSaveCustomTplModal(true)}
                  className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                  title={isAr ? 'حفظ كقالب مخصص للمتجر' : 'Save as Custom Template'}
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRightSidebarVisible(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inspector Tabs (5 Elementor Tabs + AI Assistant) */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 text-xs font-bold">
              {[
                { id: 'content' as const, labelAr: 'المحتوى', labelEn: 'Content', icon: Type },
                { id: 'templates' as const, labelAr: 'النماذج', labelEn: 'Templates', icon: Layout },
                { id: 'styling' as const, labelAr: 'التنسيق', labelEn: 'Style', icon: Palette },
                { id: 'layout' as const, labelAr: 'المحاذاة', labelEn: 'Layout', icon: Sliders },
                { id: 'code' as const, labelAr: 'الأكواد', labelEn: 'Code', icon: Code },
                { id: 'ai' as const, labelAr: 'الذكاء', labelEn: 'AI', icon: Sparkles },
              ].map((tab) => {
                const TIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2.5 flex flex-col items-center justify-center gap-0.5 border-b-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-indigo-600 text-indigo-700 bg-white font-extrabold shadow-2xs'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <TIcon className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{isAr ? tab.labelAr : tab.labelEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Inspector Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* TAB 1: CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  {/* AI Quick Assistant Banner */}
                  <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                      <div>
                        <span className="text-xs font-bold text-indigo-950 block">
                          {isAr ? 'مساعد الذكاء الاصطناعي لكتابة النصوص' : 'AI Copywriting Assistant'}
                        </span>
                        <span className="text-[10px] text-indigo-600 block">
                          {isAr ? 'توليد نصوص ترويجية سعودية عالية التحويل' : 'Generate Saudi Arabic copy'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ai')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] cursor-pointer shadow-xs transition-all hover:scale-105"
                    >
                      {isAr ? 'فتح' : 'Open'}
                    </button>
                  </div>
                  {/* Dynamic Product Row Controls */}
                  {(selectedBlock.type === 'dynamic_product_row' || selectedBlock.type === 'shortcode_widget' || selectedBlock.type.startsWith('product_section_')) && (
                    <div className="border border-emerald-300 rounded-2xl p-4 bg-emerald-50/40 space-y-3.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-xs">
                          <ShoppingBag className="w-4 h-4 text-emerald-700" />
                          <span>{isAr ? 'إعدادات شبكة المنتجات' : 'Products Grid Settings'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowShortcodeModal(true)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Code className="w-3 h-3" />
                          <span>{isAr ? 'مولد الكود' : 'Generator'}</span>
                        </button>
                      </div>

                      {/* Products Limit, Columns & Layout */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            {isAr ? 'العدد (Products)' : 'Count'}
                          </label>
                          <select
                            value={selectedBlock.settings.limit || 6}
                            onChange={(e) => handleUpdateBlockSetting('limit', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold"
                          >
                            <option value={4}>4 {isAr ? 'منتجات' : 'items'}</option>
                            <option value={6}>6 {isAr ? 'منتجات' : 'items'}</option>
                            <option value={8}>8 {isAr ? 'منتجات' : 'items'}</option>
                            <option value={9}>9 {isAr ? 'منتجات' : 'items'}</option>
                            <option value={12}>12 {isAr ? 'منتجاً' : 'items'}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            {isAr ? 'الأعمدة' : 'Columns'}
                          </label>
                          <select
                            value={selectedBlock.settings.columns || 4}
                            onChange={(e) => handleUpdateBlockSetting('columns', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold"
                          >
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                            <option value={6}>6</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            {isAr ? 'النمط' : 'Layout'}
                          </label>
                          <select
                            value={selectedBlock.settings.layout || 'slider'}
                            onChange={(e) => handleUpdateBlockSetting('layout', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold"
                          >
                            <option value="slider">{isAr ? 'سلايدر' : 'Slider'}</option>
                            <option value="grid">{isAr ? 'شبكة' : 'Grid'}</option>
                            <option value="bento">{isAr ? 'بينتو' : 'Bento'}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General Block Headings */}
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
                    <span className="font-bold text-slate-800 block text-xs">
                      {isAr ? 'النصوص والعناوين الرئيسية' : 'Titles & Headings'}
                    </span>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {isAr ? 'العنوان العربي' : 'Arabic Title'}
                      </label>
                      <input
                        type="text"
                        value={
                          selectedBlock.settings.mainTitleAr ||
                          selectedBlock.settings.headingAr ||
                          selectedBlock.settings.titleAr ||
                          selectedBlock.settings.textAr ||
                          ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (selectedBlock.id === 'announcement') handleUpdateBlockSetting('textAr', val);
                          else if (selectedBlock.id === 'hero_slider') handleUpdateBlockSetting('headingAr', val);
                          else handleUpdateBlockSetting('titleAr', val);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {isAr ? 'العنوان الإنجليزي' : 'English Title'}
                      </label>
                      <input
                        type="text"
                        value={
                          selectedBlock.settings.mainTitleEn ||
                          selectedBlock.settings.headingEn ||
                          selectedBlock.settings.titleEn ||
                          selectedBlock.settings.textEn ||
                          ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (selectedBlock.id === 'announcement') handleUpdateBlockSetting('textEn', val);
                          else if (selectedBlock.id === 'hero_slider') handleUpdateBlockSetting('headingEn', val);
                          else handleUpdateBlockSetting('titleEn', val);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {isAr ? 'الوصف التوضيحي (عربي)' : 'Subtitle / Description (Arabic)'}
                      </label>
                      <textarea
                        rows={2}
                        value={selectedBlock.settings.subtitleAr || selectedBlock.settings.subheadingAr || ''}
                        onChange={(e) => handleUpdateBlockSetting('subtitleAr', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {isAr ? 'الوصف التوضيحي (إنجليزي)' : 'Subtitle / Description (English)'}
                      </label>
                      <textarea
                        rows={2}
                        value={selectedBlock.settings.subtitleEn || selectedBlock.settings.subheadingEn || ''}
                        onChange={(e) => handleUpdateBlockSetting('subtitleEn', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs resize-none"
                      />
                    </div>
                  </div>

                  {/* Buttons & Links */}
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
                    <span className="font-bold text-slate-800 block text-xs">
                      {isAr ? 'الأزرار والروابط' : 'Action Buttons & Links'}
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          {isAr ? 'نص الزر (عربي)' : 'Button Label (AR)'}
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.settings.buttonTextAr || selectedBlock.settings.ctaTextAr || ''}
                          onChange={(e) => {
                            handleUpdateBlockSetting('buttonTextAr', e.target.value);
                            handleUpdateBlockSetting('ctaTextAr', e.target.value);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          {isAr ? 'نص الزر (إنجليزي)' : 'Button Label (EN)'}
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.settings.buttonTextEn || selectedBlock.settings.ctaTextEn || ''}
                          onChange={(e) => {
                            handleUpdateBlockSetting('buttonTextEn', e.target.value);
                            handleUpdateBlockSetting('ctaTextEn', e.target.value);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'رابط التوجيه (URL)' : 'Target URL'}
                      </label>
                      <input
                        type="text"
                        value={selectedBlock.settings.buttonUrl || selectedBlock.settings.ctaLink || ''}
                        onChange={(e) => {
                          handleUpdateBlockSetting('buttonUrl', e.target.value);
                          handleUpdateBlockSetting('ctaLink', e.target.value);
                        }}
                        placeholder="https://... or #catalog"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TEMPLATES (SECTION SPECIFIC + CUSTOM SAVED TEMPLATES) */}
              {activeTab === 'templates' && (
                <div className="space-y-4">
                  {/* Built-in vs Custom Sub-tab */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTplTab('builtin')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tplTab === 'builtin'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {isAr ? 'النماذج الجاهزة' : 'Built-in Templates'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTplTab('custom')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        tplTab === 'custom'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <FolderHeart className="w-3 h-3 text-rose-500" />
                      <span>{isAr ? 'قوالبي المخصصة' : 'My Templates'}</span>
                      {customTemplatesList.length > 0 && (
                        <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[9px]">
                          {customTemplatesList.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {tplTab === 'builtin' ? (
                    <div className="grid grid-cols-1 gap-3">
                      {getTemplatesForSection(selectedBlock.type, isAr).length > 0 ? (
                        getTemplatesForSection(selectedBlock.type, isAr).map((tpl) => {
                          const isCurrent = selectedBlock.templateStyle === tpl.key;
                          return (
                            <div
                              key={tpl.key}
                              onClick={() => handleUpdateTemplateStyle(tpl.key, tpl.presetSettings)}
                              className={`p-3 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                                isCurrent
                                  ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-900">
                                    {isAr ? tpl.nameAr : tpl.nameEn}
                                  </span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                    {tpl.badge}
                                  </span>
                                </div>
                                {isCurrent && (
                                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">
                                    <Check className="w-3 h-3 text-white" />
                                  </span>
                                )}
                              </div>
                              {tpl.previewSvg}
                              <p className="text-[10px] text-slate-500 line-clamp-2">
                                {isAr ? tpl.descAr : tpl.descEn}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400 border-2 border-dashed rounded-2xl">
                          {isAr ? 'لا توجد نماذج إضافية متاحة لهذا القسم' : 'No Templates Available'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setShowSaveCustomTplModal(true)}
                        className="w-full py-2 px-3 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>{isAr ? 'حفظ التصميم الحالي كقالب جديد' : 'Save Current Style as Template'}</span>
                      </button>

                      {customTemplatesList.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2.5">
                          {customTemplatesList.map((tpl) => (
                            <div
                              key={tpl.id}
                              className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">
                                  {isAr ? tpl.nameAr : tpl.nameEn}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomTemplate(tpl.id, isAr ? tpl.nameAr : tpl.nameEn)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-500">
                                {isAr ? tpl.descAr : tpl.descEn}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleApplyCustomTemplate(tpl)}
                                className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] cursor-pointer"
                              >
                                {isAr ? 'تطبيق هذا القالب' : 'Apply Template'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400 border-2 border-dashed rounded-2xl">
                          {isAr ? 'لم تحفظ أي قوالب مخصصة لهذا القسم بعد.' : 'No custom templates saved yet for this section.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: STYLING */}
              {activeTab === 'styling' && (
                <div className="space-y-4">
                  {/* Colors & Background */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <span className="font-bold text-slate-800 block text-xs">
                      {isAr ? 'ألوان القسم والخلفية' : 'Section Colors & Background'}
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          {isAr ? 'لون الخلفية' : 'Background Color'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedBlock.settings.bgColor || '#ffffff'}
                            onChange={(e) => handleUpdateBlockSetting('bgColor', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                          />
                          <input
                            type="text"
                            value={selectedBlock.settings.bgColor || '#ffffff'}
                            onChange={(e) => handleUpdateBlockSetting('bgColor', e.target.value)}
                            className="flex-1 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          {isAr ? 'لون النصوص' : 'Text Color'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedBlock.settings.textColor || '#1e293b'}
                            onChange={(e) => handleUpdateBlockSetting('textColor', e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                          />
                          <input
                            type="text"
                            value={selectedBlock.settings.textColor || '#1e293b'}
                            onChange={(e) => handleUpdateBlockSetting('textColor', e.target.value)}
                            className="flex-1 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typography Control Component */}
                  <BuilderTypographyControl
                    value={typographySettings}
                    onChange={(newTypo) => setTypographySettings(newTypo)}
                    isAr={isAr}
                  />

                  {/* Shadows & Border Radius */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <span className="font-bold text-slate-800 block text-xs">
                      {isAr ? 'الظلال واستدارة الحواف' : 'Elevation & Corner Radius'}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>{isAr ? 'استدارة الحواف (Radius)' : 'Border Radius (px)'}</span>
                        <span className="font-mono text-indigo-600">{selectedBlock.settings.cardRadius ?? 16}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        step="2"
                        value={selectedBlock.settings.cardRadius ?? 16}
                        onChange={(e) => handleUpdateBlockSetting('cardRadius', Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LAYOUT */}
              {activeTab === 'layout' && (
                <div className="space-y-4">
                  {/* Grid Columns Structure */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <span className="font-bold text-slate-800 block text-xs flex items-center justify-between">
                      <span>{isAr ? 'تقسيم وبنية الأعمدة (Grid Columns)' : 'Grid Columns Structure'}</span>
                      <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                        {selectedBlock.settings.layoutColumns || '1'} {isAr ? 'أعمدة' : 'cols'}
                      </span>
                    </span>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-bold">
                      {[
                        { key: '1', labelAr: '١ عمود', labelEn: '1 Col' },
                        { key: '2', labelAr: '٢ عمود', labelEn: '2 Cols' },
                        { key: '3', labelAr: '٣ أعمدة', labelEn: '3 Cols' },
                        { key: '4', labelAr: '٤ أعمدة', labelEn: '4 Cols' },
                        { key: '5', labelAr: '٥ أعمدة', labelEn: '5 Cols' },
                        { key: '8', labelAr: '٨ أعمدة', labelEn: '8 Cols' },
                        { key: '2-asym-left', labelAr: '٦٦٪ / ٣٣٪', labelEn: 'Asym-L' },
                        { key: '2-asym-right', labelAr: '٣٣٪ / ٦٦٪', labelEn: 'Asym-R' },
                        { key: 'bento', labelAr: 'بينتو', labelEn: 'Bento' },
                      ].map((col) => {
                        const isCurrent = (selectedBlock.settings.layoutColumns || '1') === col.key;
                        return (
                          <button
                            key={col.key}
                            type="button"
                            onClick={() => handleUpdateBlockSetting('layoutColumns', col.key)}
                            className={`py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isAr ? col.labelAr : col.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pixel Responsive Spacing */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-800 text-xs">
                        {isAr ? 'التحكم بالمسافات بالبكسل (px Spacing)' : 'Pixel Responsive Controls'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>{isAr ? 'الهامش الداخلي العلوي (Padding Top)' : 'Padding Top (px)'}</span>
                        <span className="font-mono text-indigo-600">
                          {device === 'mobile' ? (selectedBlock.settings.mobilePaddingTop ?? 24) : (selectedBlock.settings.paddingTop ?? 40)}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="140"
                        step="4"
                        value={device === 'mobile' ? (selectedBlock.settings.mobilePaddingTop ?? 24) : (selectedBlock.settings.paddingTop ?? 40)}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (device === 'mobile') handleUpdateBlockSetting('mobilePaddingTop', val);
                          else handleUpdateBlockSetting('paddingTop', val);
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>{isAr ? 'الهامش الداخلي السفلي (Padding Bottom)' : 'Padding Bottom (px)'}</span>
                        <span className="font-mono text-indigo-600">
                          {device === 'mobile' ? (selectedBlock.settings.mobilePaddingBottom ?? 24) : (selectedBlock.settings.paddingBottom ?? 40)}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="140"
                        step="4"
                        value={device === 'mobile' ? (selectedBlock.settings.mobilePaddingBottom ?? 24) : (selectedBlock.settings.paddingBottom ?? 40)}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (device === 'mobile') handleUpdateBlockSetting('mobilePaddingBottom', val);
                          else handleUpdateBlockSetting('paddingBottom', val);
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: CUSTOM CODE (HTML / CSS / JS) */}
              {activeTab === 'code' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                    {isAr
                      ? 'يمكنك هنا إضافة أكواد HTML و CSS و JavaScript مخصصة يتم تنفيذها بأمان داخل نطاق هذا القسم فقط دون التأثير على بقية المتجر.'
                      : 'Add custom HTML, CSS, and JavaScript scoped safely to this section in an isolated runtime.'}
                  </div>

                  {/* Custom HTML */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                    <span className="font-bold text-slate-800 text-xs flex items-center justify-between">
                      <span>{isAr ? 'كود HTML مخصص' : 'Custom HTML'}</span>
                      <span className="text-[10px] font-mono text-slate-400">Sandbox</span>
                    </span>
                    <textarea
                      rows={4}
                      value={selectedBlock.customHtml || ''}
                      onChange={(e) => handleUpdateBlockCode('customHtml', e.target.value)}
                      placeholder="<div class='custom-badge'>Exclusive Offer</div>"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50"
                    />
                  </div>

                  {/* Custom CSS */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                    <span className="font-bold text-slate-800 text-xs flex items-center justify-between">
                      <span>{isAr ? 'كود CSS مخصص' : 'Custom CSS'}</span>
                      <span className="text-[10px] font-mono text-slate-400">Scoped</span>
                    </span>
                    <textarea
                      rows={5}
                      value={selectedBlock.customCss || ''}
                      onChange={(e) => handleUpdateBlockCode('customCss', e.target.value)}
                      placeholder={`#selia_block_${selectedBlock.id} {\n  transition: all 0.3s ease;\n}`}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50"
                    />
                  </div>

                  {/* Custom JS */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                    <span className="font-bold text-slate-800 text-xs flex items-center justify-between">
                      <span>{isAr ? 'كود JavaScript مخصص' : 'Custom JavaScript'}</span>
                      <span className="text-[10px] font-mono text-slate-400">Isolated</span>
                    </span>
                    <textarea
                      rows={4}
                      value={selectedBlock.customJs || ''}
                      onChange={(e) => handleUpdateBlockCode('customJs', e.target.value)}
                      placeholder="// console.log('Section mounted', sectionId);"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50"
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: AI ASSISTANT */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <BuilderAiAssistant
                    isAr={isAr}
                    storeName={activeStore.name}
                    selectedBlockId={selectedBlock.type}
                    selectedBlockTitle={isAr ? selectedBlock.titleAr : selectedBlock.titleEn}
                    onApplyContent={handleAiApplyContent}
                    onAddNewSection={handleAiAddSection}
                  />
                </div>
              )}
            </div>

            {/* Inspector Footer Publish Action */}
            <div className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePublishLive}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-100 cursor-pointer flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Send className="w-3.5 h-3.5 rtl:-scale-x-100" />
                <span>{isAr ? 'تطبيق ونشر التعديلات فوراً' : 'Apply & Publish Changes Live'}</span>
              </button>
            </div>
          </aside>
        ) : !previewModeOnly ? (
          <button
            type="button"
            onClick={() => setRightSidebarVisible(true)}
            className="absolute end-2 top-4 z-40 p-2 rounded-xl bg-white shadow-lg border border-slate-200 text-slate-700 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-all"
            title={isAr ? 'إظهار لوحة التعديل' : 'Show Inspector'}
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">{isAr ? 'المفتش' : 'Inspector'}</span>
          </button>
        ) : null}
      </div>

      {/* ========================================================
          3. ADD SECTION MODAL
          ======================================================== */}
      <BuilderAddSectionModal
        isOpen={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        onAddSection={handleAddNewSection}
        isAr={isAr}
      />

      {/* ========================================================
          4. ICON LIBRARY MODAL
          ======================================================== */}
      <IconLibraryModal
        isOpen={showIconLibrary}
        onClose={() => setShowIconLibrary(false)}
        selectedIconId={mobileMenuIcon}
        onSelectIcon={(id) => {
          setMobileMenuIcon(id);
          toast(isAr ? 'تم تحديث أيقونة القائمة بنجاح' : 'Mobile menu icon updated', 'success');
        }}
        isAr={isAr}
        title={isAr ? 'اختر أيقونة زر قائمة الموبايل' : 'Select Mobile Menu Toggle Icon'}
      />

      {/* ========================================================
          5. DYNAMIC SHORTCODE GENERATOR MODAL
          ======================================================== */}
      <ShortcodeGeneratorModal
        isOpen={showShortcodeModal}
        onClose={() => setShowShortcodeModal(false)}
        onInsertShortcode={(sc) => {
          const parsed = parseShortcode(sc);
          if (parsed && selectedBlock) {
            handleUpdateBlockSetting('shortcode', sc);
            if (parsed.filterType) handleUpdateBlockSetting('filterType', parsed.filterType);
            if (parsed.categorySlug) handleUpdateBlockSetting('categorySlug', parsed.categorySlug);
            if (parsed.brandName) handleUpdateBlockSetting('brandName', parsed.brandName);
            if (parsed.limit) handleUpdateBlockSetting('limit', parsed.limit);
            if (parsed.columns) handleUpdateBlockSetting('columns', parsed.columns);
            if (parsed.layout) handleUpdateBlockSetting('layout', parsed.layout);
            if (parsed.titleAr) handleUpdateBlockSetting('titleAr', parsed.titleAr);
          }
          setShowShortcodeModal(false);
        }}
      />

      {/* ========================================================
          6. SAVE AS CUSTOM TEMPLATE MODAL
          ======================================================== */}
      {showSaveCustomTplModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-indigo-600" />
                <span>{isAr ? 'حفظ التصميم كقالب مخصص للمتجر' : 'Save as Custom Template'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSaveCustomTplModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? `سيتم حفظ هذا التنسيق في مكتبة قوالب متجر (${activeStore.name}) لإعادة استخدامه في أي وقت وبشكل معزول تماماً.`
                : `This customized section style will be stored in ${activeStore.name}'s library for future reuse.`}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'اسم القالب (عربي):' : 'Template Name (Arabic):'}
                </label>
                <input
                  type="text"
                  value={customTplNameAr}
                  onChange={(e) => setCustomTplNameAr(e.target.value)}
                  placeholder={isAr ? selectedBlock.titleAr : 'قالب مخصص'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'اسم القالب (إنجليزي):' : 'Template Name (English):'}
                </label>
                <input
                  type="text"
                  value={customTplNameEn}
                  onChange={(e) => setCustomTplNameEn(e.target.value)}
                  placeholder={selectedBlock.titleEn}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'وصف القالب:' : 'Description:'}
                </label>
                <textarea
                  rows={2}
                  value={customTplDescAr}
                  onChange={(e) => {
                    setCustomTplDescAr(e.target.value);
                    setCustomTplDescEn(e.target.value);
                  }}
                  placeholder={isAr ? 'وصف اختياري لتسهيل معرفة القالب لاحقاً' : 'Optional description'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveCustomTplModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveAsCustomTemplate}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 cursor-pointer"
              >
                {isAr ? 'حفظ في مكتبتي' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const VisualThemeBuilder: React.FC<VisualThemeBuilderProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <AppProvider>
      <VisualThemeBuilderInner {...props} />
    </AppProvider>
  );
};

