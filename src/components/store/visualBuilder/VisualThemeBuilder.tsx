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
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink as UnlinkIcon,
  BookOpen,
  Folder,
  Megaphone,
  Crown,
  FileText,
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
import { ConnectedWorkspaceBanner } from '../../common/ConnectedWorkspaceBanner';
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
import { Footer } from '../../../themes/meccaGifts/components/Footer';
import { HeaderElementInspector } from './header/HeaderElementInspector';
import {
  HeaderCustomSettings,
  HeaderSubElementKey,
  DEFAULT_HEADER_SETTINGS,
  getDefaultHeaderSettings,
} from '../../../themes/settings/headerCustomSettings';
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
import { CategoryGrid } from '../../../themes/meccaGifts/components/CategoryGrid';
import { BestSellersSection } from '../../../themes/meccaGifts/components/BestSellersSection';
import { ShopByCategorySection } from '../../../themes/meccaGifts/components/ShopByCategorySection';
import { FeaturedCollectionsSection } from '../../../themes/meccaGifts/components/FeaturedCollectionsSection';
import { OccasionAndWhyUsSection } from '../../../themes/meccaGifts/components/OccasionAndWhyUsSection';
import { CustomGiftBanner } from '../../../themes/meccaGifts/components/CustomGiftBanner';
import { TrendingThisWeekSection } from '../../../themes/meccaGifts/components/TrendingThisWeekSection';
import { TestimonialsSection } from '../../../themes/meccaGifts/components/TestimonialsSection';
import { FaqSection } from '../../../themes/meccaGifts/components/FaqSection';
import { NewsletterSection } from '../../../themes/meccaGifts/components/NewsletterSection';
import { MagazineSection } from '../../../themes/meccaGifts/components/MagazineSection';
import { OfferVideoBanner } from '../../../themes/meccaGifts/components/OfferVideoBanner';

// Official Coffee Roasters (HiBrew KSA) Theme Components
import { Header as CoffeeHeader } from '../../../themes/coffeeRoasters/components/Header';
import { Footer as CoffeeFooter } from '../../../themes/coffeeRoasters/components/Footer';
import { HeroSlider3D as CoffeeHeroSlider3D } from '../../../themes/coffeeRoasters/components/HeroSlider3D';
import { FlagshipThreeJsSection as CoffeeFlagshipSection } from '../../../themes/coffeeRoasters/components/FlagshipThreeJsSection';
import { MachineStoryCinematic as CoffeeMachineStory } from '../../../themes/coffeeRoasters/components/MachineStoryCinematic';
import { CartProvider as CoffeeCartProvider } from '../../../themes/coffeeRoasters/context/CartContext';

import {
  createCanonicalBlocks,
  getLiveOrStoredBlocks,
  saveThemeBlocks,
  syncThemeWithLive,
  OBSOLETE_FLORA_BLOCK_IDS,
} from '../../../services/liveThemeSyncService';
import { AppProvider, useApp } from '../../../themes/meccaGifts/context/AppContext';
import { resolveStoreTheme, getThemeManifest } from '../../../themes/registry';
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
  ARTICLES,
} from '../../../themes/meccaGifts/data/mockData';
import { BuilderAiAssistant } from './ai/BuilderAiAssistant';
import { BuilderWidgetLibrary, type WidgetDefinition } from './widgets/BuilderWidgetLibrary';
import { UniversalSectionInspector } from './inspectors/UniversalSectionInspector';

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
    case 'featured_posts':
    case 'typer_articles': return BookOpen;
    default: return Layout;
  }
};

export const FeaturedPostsBlock: React.FC<{
  settings: Record<string, any>;
  isAr: boolean;
  compact?: boolean;
}> = ({ settings, isAr, compact = false }) => {
  const label = settings.columnLabel || '1';
  const labelFontSize = settings.labelFontSize ?? 82;
  const headingText = isAr
    ? (settings.headingAr || settings.headingText || 'قصص وتجارب حصرية')
    : (settings.headingEn || settings.headingText || 'Travel Stories');
  const HeadingTag = (settings.headingLevel || 'h3') as 'h1' | 'h2' | 'h3' | 'h4';
  const postSource = settings.postSource || 'latest';
  const maxPosts = settings.maxPosts || (compact ? 2 : 3);
  const showImage = settings.showImage !== false;
  const showCategory = settings.showCategory !== false;
  const showMeta = settings.showMeta !== false;
  const showTag = settings.showTag !== false;

  const displayedArticles = useMemo(() => {
    let list = [...(ARTICLES || [])];
    if (postSource === 'most_liked') {
      list = [...list].reverse();
    }
    return list.slice(0, maxPosts);
  }, [postSource, maxPosts]);

  return (
    <div className={`w-full ${compact ? 'p-2' : 'p-6 max-w-7xl mx-auto'}`}>
      {/* Step 3: Big Number/Label (82px) */}
      {label && (
        <div
          style={{ fontSize: `${labelFontSize}px` }}
          className="font-black text-slate-900 leading-none select-none tracking-tight font-serif"
        >
          {label}
        </div>
      )}

      {/* Step 3: Category Heading (H3) */}
      <HeadingTag className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-4 tracking-tight border-b pb-2 border-slate-200/80 flex items-center justify-between">
        <span>{headingText}</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-100 text-pink-700 font-bold uppercase">
          {postSource === 'latest' ? (isAr ? 'الأحدث' : 'Latest') : (isAr ? 'الأكثر إعجاباً' : 'Most Liked')}
        </span>
      </HeadingTag>

      {/* Step 3: Typer Articles Module */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {displayedArticles.map((art) => (
          <article
            key={art.id}
            className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg hover:border-indigo-400 transition-all flex flex-col justify-between"
          >
            {showImage && (
              <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 relative">
                <img
                  src={art.image}
                  alt={isAr ? art.title : art.titleEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                {showCategory && (
                  <span className="absolute top-2.5 start-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {isAr ? art.category : art.categoryEn}
                  </span>
                )}
              </div>
            )}
            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
              <div>
                {showMeta && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{art.readTime || '3 min'}</span>
                    </span>
                    <span>•</span>
                    <span>{isAr ? 'بواسطة الكاتب' : 'By Sarah'}</span>
                    <span>•</span>
                    <span>💬 12</span>
                  </div>
                )}
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                  {isAr ? art.title : art.titleEn}
                </h4>
              </div>

              {showTag && (
                <div className="flex items-center gap-1 pt-1 flex-wrap">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">#Featured</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-50 text-pink-700">#TopPick</span>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

interface CanvasBlockItemProps {
  b: BlockElement;
  idx: number;
  totalBlocks: number;
  isSelected: boolean;
  headerSubElement?: HeaderSubElementKey;
  heroSlideIndex?: number | null;
  heroSubElement?: 'slide' | 'title' | 'subtitle' | 'btn1' | 'btn2' | 'image' | null;
  onSelectHeroSubElement?: (blockId: string, subKey: 'slide' | 'title' | 'subtitle' | 'btn1' | 'btn2' | 'image', slideIdx: number) => void;
  selectedCategoryIndex?: number | null;
  onSelectCategory?: (blockId: string, catIdx: number) => void;
  footerSubElement?: string | null;
  onSelectFooterSubElement?: (blockId: string, subKey: string) => void;
  isAr: boolean;
  device: DeviceMode;
  sectionProducts: any;
  onSelect: (id: string) => void;
  onSelectHeaderSubElement?: (blockId: string, subKey: HeaderSubElementKey) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onInsertAbove: (idx: number) => void;
  onDragStart: (e: React.DragEvent, idx: number) => void;
  onDropOnColumnWidget?: (blockId: string, colIdx: number, widget: any) => void;
  onAddColumnWidgetClick?: (blockId: string, colIdx: number) => void;
  isDraggingThisBlock?: boolean;
  onDropOnBlock?: (targetIdx: number, position: 'above' | 'below', e: React.DragEvent) => void;
}

const CanvasBlockItem: React.FC<CanvasBlockItemProps> = React.memo(
  ({
    b,
    idx,
    totalBlocks,
    isSelected,
    headerSubElement,
    heroSlideIndex,
    heroSubElement,
    onSelectHeroSubElement,
    selectedCategoryIndex,
    onSelectCategory,
    footerSubElement,
    onSelectFooterSubElement,
    isAr,
    device,
    sectionProducts,
    onSelect,
    onSelectHeaderSubElement,
    onMove,
    onToggleVisibility,
    onDelete,
    onDuplicate,
    onInsertAbove,
    onDragStart,
    onDropOnColumnWidget,
    onAddColumnWidgetClick,
    isDraggingThisBlock,
    onDropOnBlock,
  }) => {
    const { activeStore } = useTenant();
    const isCoffeeStore = activeStore?.id === 'store-coffee' || activeStore?.domain?.includes('coffee');
    const [canvasDropTarget, setCanvasDropTarget] = useState<'above' | 'below' | null>(null);

    const handleBlockDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      const rect = e.currentTarget.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      const pos = relY < rect.height / 2 ? 'above' : 'below';
      if (canvasDropTarget !== pos) {
        setCanvasDropTarget(pos);
      }
    };

    const handleBlockDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCanvasDropTarget(null);
    };

    const handleBlockDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = canvasDropTarget || 'below';
      setCanvasDropTarget(null);
      onDropOnBlock?.(idx, pos, e);
    };

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
      <>
        {/* Elementor Pro Top Tab Handle [ + | ::: | x ] */}
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            onDragStart(e, idx);
          }}
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all z-40 flex items-center shadow-md rounded-md bg-cyan-600 hover:bg-cyan-700 text-white text-xs overflow-hidden border border-cyan-400 cursor-grab active:cursor-grabbing select-none"
          title={isAr ? 'اسحب القسم لنقله مباشرة على الصفحة (Drag & Drop)' : 'Drag to reorder section directly on canvas'}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInsertAbove(idx);
            }}
            className="p-1 hover:bg-cyan-700 cursor-pointer"
            title={isAr ? 'إدراج قسم بالأعلى (+)' : 'Add Section Above (+)'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div
            className="px-2 py-1 hover:bg-cyan-700 cursor-grab active:cursor-grabbing flex items-center gap-0.5"
            title={isAr ? 'اسحب لإعادة الترتيب (Drag & Drop)' : 'Drag to Reorder Section'}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(b.id);
            }}
            className="p-1 hover:bg-rose-600 cursor-pointer"
            title={isAr ? 'حذف القسم' : 'Delete Section'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Side Toolbar */}
        <div className="absolute top-2 start-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity z-40 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-lg backdrop-blur-xs">
            <span
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                onDragStart(e, idx);
              }}
              className="text-slate-400 cursor-grab active:cursor-grabbing p-0.5"
            >
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
                onDuplicate(b.id);
              }}
              className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg cursor-pointer"
              title={isAr ? 'تكرار القسم' : 'Duplicate Section'}
            >
              <Copy className="w-3.5 h-3.5" />
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
      </>
    );

    const wrapBlock = (content: React.ReactNode, extraClass: string = '') => {
      const bgPositionValue = b.settings.bgPosition === 'custom'
        ? `${b.settings.bgCustomX ?? 70}${b.settings.bgCustomXUnit || 'px'} ${b.settings.bgCustomY ?? 66}${b.settings.bgCustomYUnit || 'px'}`
        : (b.settings.bgPosition && b.settings.bgPosition !== 'default' ? b.settings.bgPosition : undefined);
      const bgRepeatValue = b.settings.bgRepeat || (b.settings.bgImage ? 'no-repeat' : undefined);
      const bgSizeValue = b.settings.bgSize && b.settings.bgSize !== 'default' ? b.settings.bgSize : (b.settings.bgPosition === 'custom' ? 'auto' : undefined);
      const bgAttachmentValue = b.settings.bgAttachment && b.settings.bgAttachment !== 'default' ? b.settings.bgAttachment : undefined;
      const bgImageValue = b.settings.bgImage ? `url("${b.settings.bgImage}")` : undefined;
      const isFullWidth = b.settings.contentWidth === 'full' || b.settings.isFullWidth;

      return (
        <div
          id={`selia_block_${b.id}`}
          key={b.id}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(b.id);
          }}
          onDragOver={handleBlockDragOver}
          onDragLeave={handleBlockDragLeave}
          onDrop={handleBlockDrop}
          className={`group relative transition-all cursor-pointer ${extraClass} ${
            isDraggingThisBlock ? 'opacity-35 grayscale ring-2 ring-dashed ring-cyan-400 scale-[0.99]' : ''
          } ${
            isSelected
              ? 'ring-2 ring-cyan-500 ring-offset-2 z-20 shadow-md outline-cyan-500'
              : 'hover:ring-1 hover:ring-cyan-300'
          }`}
          style={{
            paddingTop: device === 'mobile' && b.settings.mobilePaddingTop ? `${b.settings.mobilePaddingTop}px` : (b.settings.paddingTop ? `${b.settings.paddingTop}px` : undefined),
            paddingBottom: device === 'mobile' && b.settings.mobilePaddingBottom ? `${b.settings.mobilePaddingBottom}px` : (b.settings.paddingBottom ? `${b.settings.paddingBottom}px` : undefined),
            marginTop: b.settings.marginTop ? `${b.settings.marginTop}px` : undefined,
            marginBottom: b.settings.marginBottom ? `${b.settings.marginBottom}px` : undefined,
            backgroundColor: b.settings.bgColor || undefined,
            backgroundImage: bgImageValue,
            backgroundPosition: bgPositionValue,
            backgroundRepeat: bgRepeatValue,
            backgroundSize: bgSizeValue,
            backgroundAttachment: bgAttachmentValue,
          }}
        >
          {/* Active Canvas Drop Indicator: Above */}
          {canvasDropTarget === 'above' && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 z-50 shadow-[0_0_14px_rgba(6,182,212,0.95)] pointer-events-none flex items-center justify-center animate-pulse">
              <span className="px-3 py-0.5 rounded-full bg-cyan-600 text-white text-[10px] font-black shadow-md -translate-y-3 flex items-center gap-1 border border-cyan-300">
                <GripVertical className="w-3 h-3" />
                <span>{isAr ? 'إفلات هنا للإدراج بالأعلى' : 'Drop Here to Insert Above'}</span>
              </span>
            </div>
          )}

          {/* Active Canvas Drop Indicator: Below */}
          {canvasDropTarget === 'below' && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 z-50 shadow-[0_0_14px_rgba(6,182,212,0.95)] pointer-events-none flex items-center justify-center animate-pulse">
              <span className="px-3 py-0.5 rounded-full bg-cyan-600 text-white text-[10px] font-black shadow-md translate-y-3 flex items-center gap-1 border border-cyan-300">
                <GripVertical className="w-3 h-3" />
                <span>{isAr ? 'إفلات هنا للإدراج بالأسفل' : 'Drop Here to Insert Below'}</span>
              </span>
            </div>
          )}

          {renderSectionToolbar()}
          <div className={isFullWidth ? 'w-full' : 'max-w-7xl mx-auto'}>
            {content}
          </div>
          {b.customHtml && (
            <div
              className="custom-html-container my-2"
              dangerouslySetInnerHTML={{ __html: b.customHtml }}
            />
          )}
        </div>
      );
    };

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

    if (b.type === 'header' || b.type === 'navbar') {
      if (isCoffeeStore) {
        return wrapBlock(
          <div className="hibrew-theme-root w-full">
            <CoffeeHeader />
          </div>
        );
      }
      const headerSettings = b.settings?.headerCustom || getDefaultHeaderSettings(activeStore);
      return wrapBlock(
        <Header
          isBuilderMode={true}
          customSettings={headerSettings}
          selectedSubElement={isSelected ? headerSubElement : undefined}
          onSelectSubElement={(subKey) => {
            onSelect(b.id);
            onSelectHeaderSubElement?.(b.id, subKey);
          }}
        />
      );
    }
    // Helper to filter and sort products per block settings
    const getBlockProducts = (fallbackList: any[]) => {
      let list = [...fallbackList];
      if (b.settings.categoryFilter && b.settings.categoryFilter !== 'all') {
        const cat = b.settings.categoryFilter.toLowerCase();
        const filtered = list.filter((p) =>
          (p.category && p.category.toLowerCase().includes(cat)) ||
          (p.categorySlug && p.categorySlug.toLowerCase().includes(cat))
        );
        if (filtered.length > 0) list = filtered;
      }
      if (b.settings.sortBy === 'newest') {
        list = [...list].reverse();
      } else if (b.settings.sortBy === 'price_low') {
        list = [...list].sort((x, y) => x.price - y.price);
      } else if (b.settings.sortBy === 'price_high') {
        list = [...list].sort((x, y) => y.price - x.price);
      } else if (b.settings.sortBy === 'rating') {
        list = [...list].sort((x, y) => (y.rating || 0) - (x.rating || 0));
      }
      return list;
    };

    if (b.type === 'hero_slider' || b.type === 'hero') {
      if (isCoffeeStore) {
        return wrapBlock(
          <div className="hibrew-theme-root w-full">
            <CoffeeHeroSlider3D />
          </div>
        );
      }
      return wrapBlock(
        <MotionHeroSlider
          isBuilderMode={true}
          slides={b.settings?.slides}
          activeSlideIndex={isSelected ? (heroSlideIndex ?? undefined) : undefined}
          selectedSubElement={isSelected ? heroSubElement : null}
          onSelectSubElement={(subKey, slideIdx) => {
            onSelect(b.id);
            onSelectHeroSubElement?.(b.id, subKey, slideIdx);
          }}
          onSlideChange={(slideIdx) => {
            onSelectHeroSubElement?.(b.id, heroSubElement || 'slide', slideIdx);
          }}
        />
      );
    }
    if (b.type === 'marquee_banner') return wrapBlock(<MarqueeBanner />);
    if (b.type === 'circle_categories') {
      return wrapBlock(
        <TopCircularCategories
          isBuilderMode={true}
          categories={b.settings?.categories}
          columns={b.settings?.columns}
          titleAr={b.settings?.titleAr || b.settings?.mainTitleAr}
          titleEn={b.settings?.titleEn || b.settings?.mainTitleEn}
          selectedCategoryIndex={isSelected ? selectedCategoryIndex : null}
          onSelectCategory={(catIdx) => {
            onSelect(b.id);
            onSelectCategory?.(b.id, catIdx);
          }}
        />
      );
    }
    if (b.type === 'discounted_bouquets_3d') return wrapBlock(<DiscountedBouquets3DGallery />);

    if (b.type === 'product_section_natural') {
      const defaultTitle = isCoffeeStore
        ? (isAr ? 'حبوب القهوة المختصة الطازجة' : 'Fresh Specialty Coffee Beans')
        : (isAr ? 'باقات الورود الطبيعية' : 'Natural Fresh Flower Bouquets');
      const defaultSub = isCoffeeStore
        ? (isAr ? 'محاصيل مختصة فردية المصدر ومحمصة حديثاً بأعلى معايير الجودة العالمية' : 'Freshly roasted single-origin micro-lots meeting world specialty standards')
        : (isAr ? 'أجود أنواع الجوري الهولندي والإكوادوري المنسق بأيدي أمهر الخبراء' : 'Finest Dutch and Ecuadorian long-stem roses tailored by master florists');
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || b.settings.mainTitleAr || defaultTitle) : (b.settings.titleEn || b.settings.mainTitleEn || defaultTitle)}
          titleEn={b.settings.titleEn || b.settings.mainTitleEn || defaultTitle}
          subtitle={isAr ? (b.settings.subtitleAr || defaultSub) : (b.settings.subtitleEn || defaultSub)}
          subtitleEn={b.settings.subtitleEn || defaultSub}
          products={getBlockProducts(sectionProducts.natural)}
          categorySlug={b.settings.categoryFilter || (isCoffeeStore ? "coffee-beans" : "natural-bouquets")}
          limit={b.settings.limit || 6}
          columns={b.settings.columns || 4}
          layout={b.settings.layout || 'slider'}
          badgeText={b.settings.badgeText}
          badgeTextEn={b.settings.badgeTextEn}
        />
      );
    }

    if (b.type === 'promo_banners_pair') return wrapBlock(<PromoBannersPair settings={b.settings} isBuilderMode={true} />);
    if (b.type === 'promo_countdown_banner') return wrapBlock(<PromoCountdownBanner />);

    if (b.type === 'product_section_luxury') {
      const defaultTitle = isCoffeeStore
        ? (isAr ? 'مجموعات وأطقم التحضير الاحترافية' : 'Professional Brewing Kits & Gear')
        : (isAr ? 'هدايا ملكية فاخرة (رجالية ونسائية)' : 'Royal Luxury Gift Sets (Men & Women)');
      const defaultSub = isCoffeeStore
        ? (isAr ? 'أطقم باريستا متكاملة، موازين دقيقة ومطاحن يدوية احترافية' : 'Complete barista kits, precision scales, and premium hand grinders')
        : (isAr ? 'أطقم هدايا استثنائية تضم عطوراً فاخرة، ساعات، أطقم مجوهرات وباقات زهور نضرة' : 'Signature executive and feminine luxury gift sets with blooms and fine accessories');
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || b.settings.mainTitleAr || defaultTitle) : (b.settings.titleEn || b.settings.mainTitleEn || defaultTitle)}
          titleEn={b.settings.titleEn || b.settings.mainTitleEn || defaultTitle}
          subtitle={isAr ? (b.settings.subtitleAr || defaultSub) : (b.settings.subtitleEn || defaultSub)}
          subtitleEn={b.settings.subtitleEn || defaultSub}
          products={getBlockProducts(sectionProducts.luxury)}
          categorySlug={b.settings.categoryFilter || (isCoffeeStore ? "brewing-gear" : "luxury-gifts")}
          limit={b.settings.limit || 6}
          columns={b.settings.columns || 4}
          layout={b.settings.layout || 'slider'}
          badgeText={b.settings.badgeText}
          badgeTextEn={b.settings.badgeTextEn}
        />
      );
    }

    if (b.type === 'product_section_chocolate') {
      const defaultTitle = isCoffeeStore
        ? (isAr ? 'محاصيل مميزة وميكرولوت نادر' : 'Signature Micro-lots & Reserve Roasts')
        : (isAr ? 'ورد وشوكولاتة بلجيكية فاخرة' : 'Roses & Luxury Belgian Chocolates');
      const defaultSub = isCoffeeStore
        ? (isAr ? 'إيحاءات غنية بالشوكولاتة الداكنة والمكسرات المحمصة والفواكه المجففة' : 'Rich tasting notes of dark chocolate, roasted nuts, and dried fruit')
        : (isAr ? 'أفخم تشكيلات باتشي وبستاني المنسقة مع باقات الجوري الساحرة' : 'Signature Patchi and Bostani chocolate boxes paired with fresh roses');
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || b.settings.mainTitleAr || defaultTitle) : (b.settings.titleEn || b.settings.mainTitleEn || defaultTitle)}
          titleEn={b.settings.titleEn || b.settings.mainTitleEn || defaultTitle}
          subtitle={isAr ? (b.settings.subtitleAr || defaultSub) : (b.settings.subtitleEn || defaultSub)}
          subtitleEn={b.settings.subtitleEn || defaultSub}
          products={getBlockProducts(sectionProducts.chocolate)}
          categorySlug={b.settings.categoryFilter || (isCoffeeStore ? "signature-lots" : "chocolate-roses")}
          limit={b.settings.limit || 6}
          columns={b.settings.columns || 4}
          layout={b.settings.layout || 'slider'}
          badgeText={b.settings.badgeText}
          badgeTextEn={b.settings.badgeTextEn}
        />
      );
    }

    if (b.type === 'product_section_cake') {
      const defaultTitle = isCoffeeStore
        ? (isAr ? 'أدوات ومكائن الإسبريسو والفلتر' : 'Espresso & Filter Brewing Equipment')
        : (isAr ? 'ورد و كيك' : 'Roses & Gourmet Celebration Cakes');
      const defaultSub = isCoffeeStore
        ? (isAr ? 'أحدث معدات استخلاص القهوة والمكائن المنزلية والتجارية المعتمدة' : 'Advanced coffee extraction gear, certified home & commercial machines')
        : (isAr ? 'كيك كوري خاص وكعكات الريد فيلفيت الطازجة لمناسبات أعياد الميلاد والتخرج' : 'Korean lunchbox cakes and artisan bakery paired with celebratory bouquets');
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || b.settings.mainTitleAr || defaultTitle) : (b.settings.titleEn || b.settings.mainTitleEn || defaultTitle)}
          titleEn={b.settings.titleEn || b.settings.mainTitleEn || defaultTitle}
          subtitle={isAr ? (b.settings.subtitleAr || defaultSub) : (b.settings.subtitleEn || defaultSub)}
          subtitleEn={b.settings.subtitleEn || defaultSub}
          products={getBlockProducts(sectionProducts.cake)}
          categorySlug={b.settings.categoryFilter || (isCoffeeStore ? "espresso-machines" : "cake-roses")}
          limit={b.settings.limit || 6}
          columns={b.settings.columns || 4}
          layout={b.settings.layout || 'slider'}
          badgeText={b.settings.badgeText}
          badgeTextEn={b.settings.badgeTextEn}
        />
      );
    }

    if (b.type === 'product_section_coffee') {
      const defaultTitle = isCoffeeStore
        ? (isAr ? 'خلطات الإسبريسو الحرفية الأكثر طلباً' : 'Top-Rated Artisan Espresso Blends')
        : (isAr ? 'ورد و قهوة و حلا' : 'Roses, Arabic Coffee & Sweets');
      const defaultSub = isCoffeeStore
        ? (isAr ? 'قوام حريري كريمي متوازن ومثالي لمشروبات الحليب واللاتيه والكورتادو' : 'Silky, balanced crema ideal for milk drinks, lattes, and cortados')
        : (isAr ? 'أصالة الضيافة الحجازية مع القهوة العربية والتمور المحشوة والحلويات' : 'Authentic Hijazi hospitality blending Arabic cardamom coffee with blooms');
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || b.settings.mainTitleAr || defaultTitle) : (b.settings.titleEn || b.settings.mainTitleEn || defaultTitle)}
          titleEn={b.settings.titleEn || b.settings.mainTitleEn || defaultTitle}
          subtitle={isAr ? (b.settings.subtitleAr || defaultSub) : (b.settings.subtitleEn || defaultSub)}
          subtitleEn={b.settings.subtitleEn || defaultSub}
          products={getBlockProducts(sectionProducts.coffee)}
          categorySlug={b.settings.categoryFilter || (isCoffeeStore ? "espresso-blends" : "coffee-sweets")}
          limit={b.settings.limit || 6}
          columns={b.settings.columns || 4}
          layout={b.settings.layout || 'slider'}
          badgeText={b.settings.badgeText}
          badgeTextEn={b.settings.badgeTextEn}
        />
      );
    }

    if (b.type === 'product_section_vases') {
      const defaultTitle = isCoffeeStore
        ? (isAr ? 'أكواب وسيرفرات زجاجية وسيراميك' : 'Ceramic & Glass Barista Drinkware')
        : (isAr ? 'فازات ورود طبيعية' : 'Natural Flower Vases');
      const defaultSub = isCoffeeStore
        ? (isAr ? 'سيرفرات مقاومة للحرارة وأكواب مصممة لإبراز النكهات العطرية' : 'Heat-resistant servers and sensory cups crafted to highlight aromatics')
        : (isAr ? 'فازات كريستالية وسيراميك راقية تدوم طويلاً لتزيين المجالس والمكاتب' : 'Hand-cut crystal and fluted ceramic vases elevating homes and offices');
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || b.settings.mainTitleAr || defaultTitle) : (b.settings.titleEn || b.settings.mainTitleEn || defaultTitle)}
          titleEn={b.settings.titleEn || b.settings.mainTitleEn || defaultTitle}
          subtitle={isAr ? (b.settings.subtitleAr || defaultSub) : (b.settings.subtitleEn || defaultSub)}
          subtitleEn={b.settings.subtitleEn || defaultSub}
          products={getBlockProducts(sectionProducts.vases)}
          categorySlug={b.settings.categoryFilter || (isCoffeeStore ? "drinkware-servers" : "flower-vases")}
          limit={b.settings.limit || 6}
          columns={b.settings.columns || 4}
          layout={b.settings.layout || 'slider'}
          badgeText={b.settings.badgeText}
          badgeTextEn={b.settings.badgeTextEn}
        />
      );
    }

    if (b.type === 'product_section_mawajeeb') {
      const defaultTitle = isCoffeeStore
        ? (isAr ? 'بوكسات ومحاصيل الضيافة الفاخرة' : 'Hospitality Reserve & Gift Boxes')
        : (isAr ? 'لوحات مواجيب وتراث حجازي' : 'Mawajeeb Wooden Plaques & Heritage');
      const defaultSub = isCoffeeStore
        ? (isAr ? 'مجموعات تذوق راقية تجمع أندر المحاصيل العالمية للضيافة والإهداء' : 'Exquisite tasting sets gathering the rarest world coffees for gifting')
        : (isAr ? 'لوحات تذكارية وتراث حجازي عريق مع ورد وبخور مروكي فاخر' : 'Hand-carved wooden heritage plaques with authentic Maroki oud and fresh roses');
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.titleAr || b.settings.mainTitleAr || defaultTitle) : (b.settings.titleEn || b.settings.mainTitleEn || defaultTitle)}
          titleEn={b.settings.titleEn || b.settings.mainTitleEn || defaultTitle}
          subtitle={isAr ? (b.settings.subtitleAr || defaultSub) : (b.settings.subtitleEn || defaultSub)}
          subtitleEn={b.settings.subtitleEn || defaultSub}
          products={getBlockProducts(sectionProducts.mawajeeb)}
          categorySlug={b.settings.categoryFilter || (isCoffeeStore ? "reserve-boxes" : "mawajeeb")}
          limit={b.settings.limit || 4}
          columns={b.settings.columns || 4}
          layout={b.settings.layout || 'slider'}
          badgeText={b.settings.badgeText}
          badgeTextEn={b.settings.badgeTextEn}
        />
      );
    }

    if (b.type === 'category_grid' || b.type === 'categories_grid') {
      return wrapBlock(
        <TopCircularCategories
          isBuilderMode={true}
          categories={b.settings?.categories}
          columns={b.settings?.columns}
          titleAr={b.settings?.titleAr || b.settings?.mainTitleAr}
          titleEn={b.settings?.titleEn || b.settings?.mainTitleEn}
          selectedCategoryIndex={isSelected ? selectedCategoryIndex : null}
          onSelectCategory={(catIdx) => {
            onSelect(b.id);
            onSelectCategory?.(b.id, catIdx);
          }}
        />
      );
    }
    if (b.type === 'featured_machines' || b.type === 'barista_tools' || b.type === 'seat_covers' || b.type === 'floor_mats') {
      if (isCoffeeStore && b.type === 'featured_machines') {
        return wrapBlock(
          <div className="hibrew-theme-root w-full">
            <CoffeeFlagshipSection />
          </div>
        );
      }
      const defaultTitle = isAr ? b.titleAr : b.titleEn;
      const catSlug = b.type === 'featured_machines' ? 'coffee-machines' :
                      b.type === 'barista_tools' ? 'barista-tools' :
                      b.type === 'seat_covers' ? 'seat-covers' : 'floor-mats';
      return wrapBlock(
        <ProductSectionSlider
          title={defaultTitle}
          titleEn={b.titleEn}
          subtitle={isAr ? (b.settings.subtitleAr || `أفضل تشكيلة ${b.titleAr} بضمان الجودة`) : (b.settings.subtitleEn || `Top collection of ${b.titleEn} with quality guarantee`)}
          subtitleEn={b.settings.subtitleEn}
          products={getBlockProducts(sectionProducts.natural)}
          categorySlug={b.settings.categoryFilter || catSlug}
          limit={b.settings.limit || 6}
          columns={b.settings.columns || 4}
          layout={b.settings.layout || 'slider'}
          badgeText={b.settings.badgeText}
          badgeTextEn={b.settings.badgeTextEn}
        />
      );
    }
    if (b.type === 'categories' || b.type === 'vehicle_filter') return wrapBlock(<ShopByCategorySection />);
    if (b.type === 'workshop_features') return wrapBlock(<StoreFeaturesBar />);
    if (b.type === 'customer_reviews') return wrapBlock(<TestimonialsSection />);
    if (b.type === 'video_showcase') {
      if (isCoffeeStore) {
        return wrapBlock(
          <div className="hibrew-theme-root w-full">
            <CoffeeMachineStory />
          </div>
        );
      }
      return wrapBlock(<VideoSection />);
    }
    if (b.type === 'best_sellers') return wrapBlock(<BestSellersSection settings={b.settings} isBuilderMode={true} />);
    if (b.type === 'shop_by_category') return wrapBlock(<ShopByCategorySection />);
    if (b.type === 'featured_collections' || b.type === 'metrics_section' || b.type === 'statistics') return wrapBlock(<FeaturedCollectionsSection settings={b.settings} isBuilderMode={true} />);
    if (b.type === 'store_features_bar' || b.type === 'features') return wrapBlock(<StoreFeaturesBar />);
    if (b.type === 'occasion_why_us') return wrapBlock(<OccasionAndWhyUsSection settings={b.settings} isBuilderMode={true} />);
    if (b.type === 'custom_gift_banner') {
      return wrapBlock(
        <CustomGiftBanner
          settings={b.settings}
          titleAr={b.settings?.titleAr || b.titleAr}
          titleEn={b.settings?.titleEn || b.titleEn}
          subtitleAr={b.settings?.subtitleAr}
          subtitleEn={b.settings?.subtitleEn}
          imageUrl={b.settings?.imageUrl}
          buttonTextAr={b.settings?.buttonTextAr}
          buttonTextEn={b.settings?.buttonTextEn}
          buttonUrl={b.settings?.buttonUrl}
          isBuilderMode={true}
        />
      );
    }
    if (b.type === 'offer_video_banner') return wrapBlock(<OfferVideoBanner />);
    if (b.type === 'trending_this_week') {
      return wrapBlock(
        <TrendingThisWeekSection
          blockId={b.id}
          settings={b.settings}
          titleAr={b.settings?.titleAr || b.titleAr}
          titleEn={b.settings?.titleEn || b.titleEn}
          subtitleAr={b.settings?.subtitleAr}
          subtitleEn={b.settings?.subtitleEn}
          isBuilderMode={true}
        />
      );
    }
    if (b.type === 'social_reels') return wrapBlock(<SocialReelsSection />);
    if (b.type === 'video_section') {
      if (isCoffeeStore) {
        return wrapBlock(
          <div className="hibrew-theme-root w-full">
            <CoffeeMachineStory />
          </div>
        );
      }
      return wrapBlock(<VideoSection />);
    }
    if (b.type === 'reviews' || b.type === 'testimonials') return wrapBlock(<TestimonialsSection />);
    if (b.type === 'faq') return wrapBlock(<FaqSection />);
    if (b.type === 'magazine_section') return wrapBlock(<MagazineSection />);
    if (b.type === 'newsletter') return wrapBlock(<NewsletterSection />);
    if (b.type === 'footer') {
      if (isCoffeeStore) {
        return wrapBlock(
          <div className="hibrew-theme-root w-full">
            <CoffeeFooter />
          </div>
        );
      }
      return wrapBlock(
        <Footer
          isBuilderMode={true}
          settings={b.settings}
          selectedSubElement={isSelected ? (footerSubElement || 'brand') : undefined}
          onSelectSubElement={(subKey) => {
            onSelect(b.id);
            onSelectFooterSubElement?.(b.id, subKey);
          }}
        />
      );
    }
    if (b.type === 'special_offer') return wrapBlock(<PromoCountdownBanner />);

    if (b.type === 'product_tabs') {
      const defaultTitle = isCoffeeStore
        ? (isAr ? 'محاصيل مختصة مميزة والأكثر طلباً' : 'Featured & Bestseller Specialty Roasts')
        : (isAr ? 'الباقات المميزة والأكثر طلباً' : 'Featured & Bestseller Bouquets');
      const defaultSub = isCoffeeStore
        ? (isAr ? 'تشكيلة منتقاة بعناية لمحبي القهوة الفاخرة وعشاق الإسبريسو والفلتر' : 'Carefully selected coffees for specialty lovers, filter, and espresso')
        : (isAr ? 'تشكيلة منتقاة بعناية تناسب جميع المناسبات' : 'Carefully selected arrangements for every occasion');
      return wrapBlock(
        <ProductSectionSlider
          title={isAr ? (b.settings.mainTitleAr || defaultTitle) : (b.settings.mainTitleEn || defaultTitle)}
          titleEn={b.settings.mainTitleEn || defaultTitle}
          subtitle={isAr ? (b.settings.subtitleAr || defaultSub) : (b.settings.subtitleEn || defaultSub)}
          subtitleEn={b.settings.subtitleEn || defaultSub}
          products={getBlockProducts(sectionProducts.natural)}
          categorySlug={b.settings.categoryFilter || (isCoffeeStore ? "coffee-beans" : "natural-bouquets")}
          limit={b.settings.limit || 6}
          columns={b.settings.columns || 4}
          layout={b.settings.layout || 'slider'}
          badgeText={b.settings.badgeText}
          badgeTextEn={b.settings.badgeTextEn}
        />
      );
    }

    if (b.type === 'heading' || b.type === 'w_heading') {
      const textAlign = b.settings.textAlign || 'center';
      const fontSize = b.settings.fontSize || b.settings.titleFontSize || (device === 'mobile' ? 22 : 30);
      const fontWeight = b.settings.fontWeight || 'font-black';
      const textColor = b.settings.textColor || '#102a1c';
      const accentColor = b.settings.accentColor || '#e6ca98';
      const title = isAr ? (b.settings.titleAr || b.settings.textAr || b.titleAr) : (b.settings.titleEn || b.settings.textEn || b.titleEn);
      const subtitle = isAr ? (b.settings.subtitleAr || '') : (b.settings.subtitleEn || '');
      const showCrown = b.settings.showCrown ?? (b.templateStyle?.includes('gold') || b.templateStyle?.includes('luxury'));
      const showAccentBar = b.settings.showAccentBar ?? (b.templateStyle?.includes('bar') || b.templateStyle?.includes('accent'));

      return wrapBlock(
        <div className="py-6 px-4 max-w-7xl mx-auto">
          <div className={`flex flex-col ${textAlign === 'center' ? 'items-center text-center' : textAlign === 'end' ? 'items-end text-end' : 'items-start text-start'}`}>
            {showCrown && (
              <span className="text-[10px] font-serif tracking-widest uppercase mb-1.5 flex items-center gap-1 font-bold" style={{ color: accentColor }}>
                ✦ HADAYA MAKKAH LUXURY ✦
              </span>
            )}
            <div className="flex items-center gap-3 w-full justify-inherit">
              {showAccentBar && (
                <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: accentColor || '#4f46e5' }} />
              )}
              <h2
                className={`tracking-tight ${fontWeight}`}
                style={{
                  fontSize: `${fontSize}px`,
                  color: textColor,
                  lineHeight: 1.25,
                }}
              >
                {title || (isAr ? 'عنوان القسم الفاخر' : 'Signature Section Heading')}
              </h2>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1.5 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (b.type === 'text_editor' || b.type === 'w_text') {
      const isCallout = b.templateStyle?.includes('callout') || b.settings.boxStyle === 'callout';
      const isTwoCol = b.settings.columns === 2 || b.templateStyle?.includes('two') || b.templateStyle?.includes('editorial');
      const storeDisplayName = (isAr ? activeStore?.nameAr : activeStore?.nameEn) || activeStore?.name || (isAr ? 'المتجر' : 'Store');
      const text = isAr ? (b.settings.textAr || b.settings.contentAr || `تفاصيل ومحتوى مخصص للقسم بتنسيق متقدم يعكس فخامة ${storeDisplayName} وخدماته المميزة...`) : (b.settings.textEn || b.settings.contentEn || `Custom formatted editorial paragraph text reflecting the quality and services of ${storeDisplayName}...`);
      const fontSize = b.settings.fontSize || 15;
      const textColor = b.settings.textColor || (isCallout ? '#FAF9F5' : '#334155');
      const bgColor = isCallout ? (b.settings.bgColor || '#102a1c') : undefined;

      return wrapBlock(
        <div className="py-4 px-4 max-w-5xl mx-auto">
          {isCallout ? (
            <div className="p-6 rounded-2xl border flex items-start gap-4 shadow-sm" style={{ backgroundColor: bgColor, borderColor: b.settings.accentColor || '#e6ca98' }}>
              <span className="text-3xl font-serif leading-none" style={{ color: b.settings.accentColor || '#e6ca98' }}>“</span>
              <p className="text-sm font-medium leading-relaxed" style={{ color: textColor }}>
                {text}
              </p>
            </div>
          ) : (
            <div
              className={`leading-relaxed ${isTwoCol ? 'md:columns-2 gap-8' : ''}`}
              style={{ fontSize: `${fontSize}px`, color: textColor }}
            >
              <p>{text}</p>
            </div>
          )}
        </div>
      );
    }

    if (b.type === 'button_cta' || b.type === 'w_button') {
      const isDual = b.settings.layout === 'dual_buttons' || b.templateStyle?.includes('dual');
      const btnText = isAr ? (b.settings.buttonTextAr || 'تسوّق الآن واحصل على باقتك') : (b.settings.buttonTextEn || 'Shop Now & Get Your Bouquet');
      const btnBg = b.settings.bgColor || '#102a1c';
      const btnTextCol = b.settings.textColor || '#e6ca98';
      const btnBorder = b.settings.borderColor || '#e6ca98';
      const radius = b.settings.borderRadius ?? 9999;

      return wrapBlock(
        <div className="py-4 px-4 flex items-center justify-center">
          {isDual ? (
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <a
                href={b.settings.buttonUrl || '#catalog'}
                onClick={(e) => e.preventDefault()}
                className="px-6 py-3 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:bg-emerald-800 transition-all hover:scale-105 cursor-pointer"
              >
                <span>💬</span>
                <span>{isAr ? 'مستشار الهدايا عبر الواتساب' : 'WhatsApp Concierge'}</span>
              </a>
              <a
                href={b.settings.buttonUrl || '#catalog'}
                onClick={(e) => e.preventDefault()}
                className="px-6 py-3 rounded-xl bg-[#102a1c] text-[#e6ca98] border border-[#e6ca98] font-bold text-xs flex items-center gap-2 shadow-md hover:bg-slate-900 transition-all hover:scale-105 cursor-pointer"
              >
                <span>🛍</span>
                <span>{btnText}</span>
              </a>
            </div>
          ) : (
            <a
              href={b.settings.buttonUrl || '#catalog'}
              onClick={(e) => e.preventDefault()}
              style={{
                backgroundColor: btnBg,
                color: btnTextCol,
                borderColor: btnBorder,
                borderRadius: `${radius}px`,
              }}
              className="px-8 py-3.5 border-2 font-black text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105 hover:shadow-xl cursor-pointer"
            >
              <span>🛍</span>
              <span>{btnText}</span>
            </a>
          )}
        </div>
      );
    }

    // FEATURED POSTS / TYPER ARTICLES WIDGET
    if (b.type === 'featured_posts' || b.type === 'typer_articles') {
      return wrapBlock(
        <FeaturedPostsBlock
          settings={b.settings}
          isAr={isAr}
          compact={false}
        />
      );
    }

    if (b.type === 'columns_container' || b.type === 'w_columns' || b.type.startsWith('cols_') || b.type === 'custom_grid') {
      const cols = b.settings.layoutColumns || '3';
      const colGap = b.settings.columnGap === 'wide' ? 32 : (typeof b.settings.columnGap === 'number' ? b.settings.columnGap : 16);
      const rowGap = b.settings.rowGap ?? 16;
      const autoFlow = b.settings.autoFlow || 'row';
      const justifyItems = b.settings.justifyItems || 'stretch';
      const alignItems = b.settings.alignItems || 'stretch';
      const justifyContent = b.settings.justifyContent || 'start';
      const alignContent = b.settings.alignContent || 'start';
      const gridOutline = b.settings.gridOutline ?? true;

      const colCount =
        cols === '25-25-50' || cols === '50-25-25' || cols === '25-50-25' || cols === '16-66-16' || cols === '3' || cols === '33-33-33' ? 3 :
        cols === '8' ? 8 : cols === '6' ? 6 : cols === '5' ? 5 : cols === '4' ? 4 : cols === '2' || cols === '2-asym-left' || cols === '2-asym-right' || cols === 'bento' ? 2 : 1;
      
      const gridTemplateCols = 
        cols === '1' ? '1fr' :
        cols === '2' ? 'repeat(2, 1fr)' :
        cols === '3' || cols === '33-33-33' ? 'repeat(3, 1fr)' :
        cols === '25-25-50' ? '25% 25% 50%' :
        cols === '50-25-25' ? '50% 25% 25%' :
        cols === '25-50-25' ? '25% 50% 25%' :
        cols === '16-66-16' ? '16.66% 66.66% 16.66%' :
        cols === '4' ? 'repeat(4, 1fr)' :
        cols === '5' ? 'repeat(5, 1fr)' :
        cols === '6' ? 'repeat(6, 1fr)' :
        cols === '8' ? 'repeat(8, 1fr)' :
        cols === '2-asym-left' ? '2fr 1fr' :
        cols === '2-asym-right' ? '1fr 2fr' :
        cols === 'bento' ? '2fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))';

      return wrapBlock(
        <div className={`p-6 rounded-2xl transition-all ${b.settings.bgColor ? '' : 'bg-white'} ${gridOutline ? 'outline-2 outline-dashed outline-pink-400 bg-pink-50/10 shadow-xs' : 'border border-slate-200'}`}>
          <div className="w-full space-y-3">
            {gridOutline && (
              <div className="flex items-center justify-between text-[10px] font-mono text-pink-600 font-bold bg-pink-100/80 px-2.5 py-1 rounded-lg">
                <span>✦ Elementor Container Grid: {cols} Cols</span>
                <span>Gap: {colGap}px (Wide)</span>
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: device === 'mobile' ? '1fr' : gridTemplateCols,
                columnGap: `${colGap}px`,
                rowGap: `${rowGap}px`,
                gridAutoFlow: autoFlow as any,
                justifyItems: justifyItems as any,
                alignItems: alignItems as any,
                justifyContent: justifyContent as any,
                alignContent: alignContent as any,
              }}
            >
              {[...Array(colCount)].map((_, colIdx) => {
                const colWidgets = b.settings.columnWidgets?.[colIdx] || [];
                return (
                  <div
                    key={colIdx}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
                        if (raw) {
                          const parsed = JSON.parse(raw);
                          if (parsed.type === 'builder-widget' && parsed.widget) {
                            onDropOnColumnWidget?.(b.id, colIdx, parsed.widget);
                          }
                        }
                      } catch {}
                    }}
                    className={`p-4 rounded-2xl border-2 border-dashed flex flex-col justify-between min-h-[170px] transition-all relative ${
                      gridOutline
                        ? 'border-pink-300 hover:border-pink-500 bg-pink-50/20 text-pink-950 shadow-2xs'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/40 text-slate-800'
                    }`}
                  >
                    {/* Header badge */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-dashed border-slate-200/80">
                      <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shadow-2xs ${gridOutline ? 'bg-pink-600 text-white' : 'bg-slate-700 text-white'}`}>
                        {colIdx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {isAr ? `العمود ${colIdx + 1}` : `Column ${colIdx + 1}`}
                      </span>
                    </div>

                    {/* Column Content if populated */}
                    <div className="space-y-3 w-full flex-1">
                      {colWidgets.length > 0 ? (
                        colWidgets.map((cw: any, cwIdx: number) => (
                          <div key={cw.id || cwIdx} className="w-full">
                            {cw.type === 'featured_posts' ? (
                              <FeaturedPostsBlock settings={cw.settings} isAr={isAr} compact={true} />
                            ) : cw.type === 'text_editor' ? (
                              <div style={{ fontSize: `${cw.settings.fontSize || 82}px`, fontWeight: cw.settings.fontWeight || 900 }} className="text-slate-900 leading-none font-serif select-none">
                                {cw.settings.text || String(colIdx + 1)}
                              </div>
                            ) : cw.type === 'heading' ? (
                              <h3 className="text-base font-bold text-slate-900 border-b pb-1 border-slate-200">{cw.settings.text || 'Category Heading'}</h3>
                            ) : (
                              <div className="p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">{cw.title || cw.type}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                          <span className="text-xs font-bold text-slate-600">
                            {isAr ? 'حاوية العمود (فارغ)' : 'Empty Column Container'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {isAr ? 'اسحب عنصراً أو انقر علامة (+)' : 'Drag widget here or click (+)'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dashed dropzone with (+) button - exactly matching Image 3! */}
                    <div className="mt-3 w-full pt-2.5 border-t border-dashed border-slate-200 flex flex-col items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddColumnWidgetClick?.(b.id, colIdx);
                        }}
                        className="w-8 h-8 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center shadow-md transition-all hover:scale-115 cursor-pointer"
                        title={isAr ? `إضافة ويدجت في العمود ${colIdx + 1} (+)` : `Add widget to Column ${colIdx + 1} (+)`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-[9px] text-slate-400 mt-1 font-bold">
                        {isAr ? 'إدراج محتوى' : 'Add Widget'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

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

const ELEMENTOR_STRUCTURE_PRESETS = [
  {
    id: '1',
    titleAr: '١ عمود (١٠٠٪)',
    titleEn: '1 Column (100%)',
    preview: <div className="h-5 w-full bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />,
  },
  {
    id: '2',
    titleAr: 'عمودان متساويان (٥٠٪ / ٥٠٪)',
    titleEn: '2 Columns (50% / 50%)',
    preview: (
      <div className="flex gap-1 h-5 w-full">
        <div className="flex-1 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="flex-1 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
      </div>
    ),
  },
  {
    id: '3',
    titleAr: '٣ أعمدة (٣٣٪ / ٣٣٪ / ٣٣٪)',
    titleEn: '3 Columns (33% each)',
    preview: (
      <div className="flex gap-1 h-5 w-full">
        <div className="flex-1 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="flex-1 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="flex-1 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
      </div>
    ),
  },
  {
    id: '25-25-50',
    titleAr: '٣ أعمدة (٢٥٪ / ٢٥٪ / ٥٠٪) - Elementor Featured',
    titleEn: '3 Columns (25%, 25%, 50%) - Featured Posts',
    preview: (
      <div className="flex gap-1 h-5 w-full">
        <div className="w-1/4 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="w-1/4 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="w-1/2 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
      </div>
    ),
  },
  {
    id: '50-25-25',
    titleAr: '٣ أعمدة (٥٠٪ / ٢٥٪ / ٢٥٪)',
    titleEn: '3 Columns (50%, 25%, 25%)',
    preview: (
      <div className="flex gap-1 h-5 w-full">
        <div className="w-1/2 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="w-1/4 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="w-1/4 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
      </div>
    ),
  },
  {
    id: '25-50-25',
    titleAr: '٣ أعمدة (٢٥٪ / ٥٠٪ / ٢٥٪)',
    titleEn: '3 Columns (25%, 50%, 25%)',
    preview: (
      <div className="flex gap-1 h-5 w-full">
        <div className="w-1/4 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="w-1/2 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="w-1/4 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
      </div>
    ),
  },
  {
    id: '16-66-16',
    titleAr: '٣ أعمدة (١٦٪ / ٦٦٪ / ١٦٪)',
    titleEn: '3 Columns (16%, 66%, 16%)',
    preview: (
      <div className="flex gap-1 h-5 w-full">
        <div className="w-[16%] bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="w-[68%] bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="w-[16%] bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
      </div>
    ),
  },
  {
    id: '4',
    titleAr: '٤ أعمدة (٢٥٪)',
    titleEn: '4 Columns (25% each)',
    preview: (
      <div className="flex gap-0.5 h-5 w-full">
        <div className="flex-1 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="flex-1 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="flex-1 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="flex-1 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
      </div>
    ),
  },
  {
    id: '2-asym-left',
    titleAr: 'عريض + جانبي (٦٦٪ / ٣٣٪)',
    titleEn: 'Asymmetric Left (66% / 33%)',
    preview: (
      <div className="flex gap-1 h-5 w-full">
        <div className="flex-2 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="flex-1 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
      </div>
    ),
  },
  {
    id: 'bento',
    titleAr: 'شبكة بينتو العصرية',
    titleEn: 'Modern Bento Grid',
    preview: (
      <div className="grid grid-cols-3 gap-1 h-5 w-full">
        <div className="col-span-2 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
        <div className="col-span-1 bg-slate-300 rounded-xs group-hover:bg-pink-500 transition-colors" />
      </div>
    ),
  },
];

const CanvasSectionInserter: React.FC<{
  isAr: boolean;
  insertIndex: number;
  activeOpenIndex: number | null;
  setActiveOpenIndex: (idx: number | null) => void;
  onSelectStructure: (cols: string, targetIndex: number) => void;
  onOpenSectionModal: (targetIndex: number) => void;
  onDropItem: (targetIndex: number, e: React.DragEvent) => void;
  isDragging: boolean;
}> = ({
  isAr,
  insertIndex,
  activeOpenIndex,
  setActiveOpenIndex,
  onSelectStructure,
  onOpenSectionModal,
  onDropItem,
  isDragging,
}) => {
  const [isOver, setIsOver] = useState(false);
  const isOpen = activeOpenIndex === insertIndex;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        setIsOver(false);
        onDropItem(insertIndex, e);
      }}
      className={`relative transition-all py-1.5 px-4 my-1 z-30 ${
        isOver
          ? 'py-8 border-2 border-dashed border-pink-500 bg-pink-100/60 rounded-2xl shadow-lg ring-4 ring-pink-300/30'
          : isDragging
            ? 'py-4 border-2 border-dashed border-indigo-300 bg-indigo-50/40 rounded-xl'
            : ''
      }`}
    >
      {isOver ? (
        <div className="flex items-center justify-center gap-2 text-pink-700 font-extrabold text-xs animate-bounce">
          <Plus className="w-4 h-4" />
          <span>{isAr ? `أفلت القسم أو العنصر هنا (الموقع #${insertIndex})` : `Drop section / widget here (Position #${insertIndex})`}</span>
        </div>
      ) : isOpen ? (
        <div className="p-6 border-2 border-dashed border-pink-500 rounded-3xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-pink-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                +
              </span>
              <div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  {isAr ? 'اختر بنية وتقسيم الأعمدة (SELECT YOUR STRUCTURE)' : 'SELECT YOUR STRUCTURE / CONTAINER'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  {isAr ? `إدراج حاوية أو قسم جديد في الموضع #${insertIndex}` : `Insert new container or section at position #${insertIndex}`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveOpenIndex(null)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
            {ELEMENTOR_STRUCTURE_PRESETS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  onSelectStructure(st.id, insertIndex);
                }}
                className={`group p-2.5 rounded-xl border bg-white hover:border-pink-500 hover:shadow-md transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  st.id === '25-25-50' ? 'border-pink-500 ring-2 ring-pink-300/40 bg-pink-50/20' : 'border-slate-200'
                }`}
                title={isAr ? st.titleAr : st.titleEn}
              >
                {st.preview}
                <span className="text-[9px] font-bold text-slate-600 group-hover:text-pink-600 truncate max-w-full">
                  {st.id}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onSelectStructure('25-25-50', insertIndex)}
              className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-pink-200 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isAr ? 'إدراج قسم المقالات المميزة (Featured Posts 25, 25, 50)' : 'Insert Featured Posts (25, 25, 50)'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenSectionModal(insertIndex)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصفح مكتبة القوالب الكاملة...' : 'Browse Full Template Library...'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="group/inserter flex items-center justify-center relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-slate-200 group-hover/inserter:border-pink-400 transition-colors" />
          </div>
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveOpenIndex(insertIndex)}
              className="w-7 h-7 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center shadow-md transition-all hover:scale-125 cursor-pointer"
              title={isAr ? `إضافة قسم هنا (#${insertIndex})` : `Add section here (#${insertIndex})`}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenSectionModal(insertIndex)}
              className="opacity-0 group-hover/inserter:opacity-100 transition-opacity w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center shadow-md hover:scale-110 cursor-pointer"
              title={isAr ? 'إدراج من القوالب' : 'Add from Templates'}
            >
              <FolderHeart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CanvasStructurePicker: React.FC<{
  isAr: boolean;
  onSelectStructure: (cols: string) => void;
}> = ({ isAr, onSelectStructure }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6 my-6 mx-4 border-2 border-dashed border-slate-300 hover:border-pink-500 rounded-3xl bg-slate-50/70 transition-all text-center">
      {!isOpen ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
            title={isAr ? 'إدراج بنية تقسيم جديدة' : 'Select Structure'}
          >
            <Plus className="w-6 h-6" />
          </button>
          <span className="text-xs font-black text-slate-800">
            {isAr ? 'اختر البنية أو أضف حاوية جديدة (SELECT YOUR STRUCTURE)' : 'SELECT YOUR STRUCTURE / CONTAINER'}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {isAr ? 'انقر على علامة (+) لاختيار تقسيم الأعمدة المناسب فوراً مثل Elementor' : 'Click (+) to pick a column layout structure like Elementor Pro'}
          </span>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {isAr ? 'حدد بنية وتقسيم الأعمدة (SELECT YOUR STRUCTURE)' : 'SELECT YOUR STRUCTURE'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
            {ELEMENTOR_STRUCTURE_PRESETS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  onSelectStructure(st.id);
                  setIsOpen(false);
                }}
                className={`group p-2.5 rounded-xl border bg-white hover:border-pink-500 hover:shadow-md transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  st.id === '25-25-50' ? 'border-pink-500 ring-2 ring-pink-300/40 bg-pink-50/20' : 'border-slate-200'
                }`}
                title={isAr ? st.titleAr : st.titleEn}
              >
                {st.preview}
                <span className="text-[9px] font-bold text-slate-600 group-hover:text-pink-600 truncate max-w-full">
                  {st.id}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function createInitialBlocksForTheme(themeId: string, store?: any): BlockElement[] {
  return createCanonicalBlocks(themeId, store) as BlockElement[];
}

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
  const { language, setLanguage } = useApp();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const handleToggleLanguage = (newLang: 'ar' | 'en') => {
    setLocale(newLang);
    setLanguage(newLang);
  };

  // Keep preview context synced with active locale
  useEffect(() => {
    if (language !== locale) {
      setLanguage(locale as any);
    }
  }, [locale, language, setLanguage]);

  const cleanPropThemeId = useMemo(() => {
    if (
      typeof themeId === 'string' &&
      themeId.trim() &&
      !themeId.includes('[object') &&
      themeId !== 'undefined' &&
      themeId !== 'null'
    ) {
      return themeId.trim();
    }
    return undefined;
  }, [themeId]);

  const liveStoreThemeId =
    storeActiveTheme[activeStore.id] ||
    themes[0]?.id ||
    'theme-flora-luxe';

  const [currentThemeId, setCurrentThemeId] = useState<string>(
    () => cleanPropThemeId || liveStoreThemeId
  );
  const currentThemeObj = useMemo(
    () => themes.find((t) => t.id === currentThemeId) || themes[0],
    [themes, currentThemeId],
  );
  const isEditingActiveTheme = currentThemeId === liveStoreThemeId;
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isCoffeeStore =
    activeStore.id === 'store-coffee' ||
    activeStore.domain?.includes('coffee') ||
    currentThemeId.includes('coffee');

  const isCarStore =
    activeStore.id === 'store-bleco' ||
    activeStore.domain?.includes('bleco') ||
    currentThemeId.includes('saudia') ||
    currentThemeId.includes('transport');

  const activeThemeManifest = useMemo(() => {
    return resolveStoreTheme(activeStore.id, currentThemeId, activeStore.category);
  }, [activeStore.id, currentThemeId, activeStore.category]);

  const themeDisplayLabel = useMemo(() => {
    if (activeThemeManifest) {
      return isAr ? activeThemeManifest.nameAr : activeThemeManifest.name;
    }
    if (isCarStore) {
      return isAr ? 'ثيم بلاكو للنقل والسيارات' : 'Blacko Saudi Transport';
    }
    if (isCoffeeStore) {
      return isAr ? 'ثيم الباريستا' : 'Artisan Roastery';
    }
    if (currentThemeObj?.name?.includes('—')) {
      return currentThemeObj.name.split('—')[1]?.trim() || currentThemeObj.name;
    }
    return currentThemeObj?.name || 'Theme';
  }, [activeThemeManifest, isCarStore, isCoffeeStore, isAr, currentThemeObj]);

  // Sync if themeId prop changes or activeStore changes
  useEffect(() => {
    const nextThemeId =
      cleanPropThemeId ||
      storeActiveTheme[activeStore.id] ||
      themes[0]?.id ||
      'theme-flora-luxe';
    if (nextThemeId && nextThemeId !== currentThemeId) {
      setCurrentThemeId(nextThemeId);
    }
  }, [cleanPropThemeId, activeStore.id, storeActiveTheme, themes]);

  // Keep themeId synced to URL & sessionStorage (strictly clean theme string)
  useEffect(() => {
    if (currentThemeId && !currentThemeId.includes('[object')) {
      try {
        sessionStorage.setItem(`unityteck_visual_builder_theme_${activeStore.id}`, currentThemeId);
        sessionStorage.setItem('unityteck_visual_builder_theme', currentThemeId);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('themeId', currentThemeId);
          window.history.replaceState({}, '', url.toString());
        }
      } catch {}
    }
  }, [currentThemeId, activeStore.id]);

  // Real-world screen size detection for responsive Page Builder UI
  const [screenSize, setScreenSize] = useState<{ isMobile: boolean; isTablet: boolean }>(() => {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      return { isMobile: w < 768, isTablet: w >= 768 && w < 1024 };
    }
    return { isMobile: false, isTablet: false };
  });

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      setScreenSize({ isMobile: w < 768, isTablet: w >= 768 && w < 1024 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Builder Viewport & Page Navigation
  const [device, setDevice] = useState<DeviceMode>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 'mobile';
      if (window.innerWidth < 1024) return 'tablet';
    }
    return 'desktop';
  });

  // Sync active viewport device with AppContext so all theme components adapt immediately
  const { setBuilderDevice } = useApp();
  useEffect(() => {
    setBuilderDevice?.(device);
  }, [device, setBuilderDevice]);

  const [previewPage, setPreviewPage] = useState<PreviewPage>(() => {
    try {
      if (typeof window !== 'undefined') {
        const q = new URLSearchParams(window.location.search).get('builderPage') as PreviewPage | null;
        if (q && ['home', 'catalog', 'product', 'cart', 'checkout', 'thankyou', 'crm', 'about', 'contact', 'location', 'track-order', 'privacy', 'return'].includes(q)) {
          return q;
        }
        const saved = sessionStorage.getItem('unityteck_visual_builder_page') as PreviewPage | null;
        if (saved && ['home', 'catalog', 'product', 'cart', 'checkout', 'thankyou', 'crm', 'about', 'contact', 'location', 'track-order', 'privacy', 'return'].includes(saved)) {
          return saved;
        }
      }
    } catch {}
    return initialPage || 'home';
  });

  // Keep previewPage synced to URL & sessionStorage so reloads stay on active subpage
  useEffect(() => {
    try {
      sessionStorage.setItem('unityteck_visual_builder_page', previewPage);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('builderPage', previewPage);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, [previewPage]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('sec_natural_flowers');
  const [activeTab, setActiveTab] = useState<'content' | 'templates' | 'styling' | 'layout' | 'code' | 'ai'>('content');
  const [canvasDarkMode, setCanvasDarkMode] = useState(false);
  const [previewModeOnly, setPreviewModeOnly] = useState(false);
  const [leftTab, setLeftTab] = useState<'widgets' | 'layers'>('widgets');
  const [headerSubElement, setHeaderSubElement] = useState<HeaderSubElementKey>('general');
  const [headerLayerExpanded, setHeaderLayerExpanded] = useState<boolean>(true);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);
  const [footerSubElement, setFooterSubElement] = useState<string | null>('brand');
  const [heroSlideIndex, setHeroSlideIndex] = useState<number>(0);
  const [heroSubElement, setHeroSubElement] = useState<'slide' | 'title' | 'subtitle' | 'btn1' | 'btn2' | 'image' | null>('image');

  // Topbar Dropdown Menus State & Refs
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const pageDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const seasonDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  // Close topbar dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (pageDropdownOpen && pageDropdownRef.current && !pageDropdownRef.current.contains(target)) {
        setPageDropdownOpen(false);
      }
      if (themeDropdownOpen && themeDropdownRef.current && !themeDropdownRef.current.contains(target)) {
        setThemeDropdownOpen(false);
      }
      if (seasonDropdownOpen && seasonDropdownRef.current && !seasonDropdownRef.current.contains(target)) {
        setSeasonDropdownOpen(false);
      }
      if (toolsDropdownOpen && toolsDropdownRef.current && !toolsDropdownRef.current.contains(target)) {
        setToolsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPageDropdownOpen(false);
        setThemeDropdownOpen(false);
        setSeasonDropdownOpen(false);
        setToolsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pageDropdownOpen, themeDropdownOpen, seasonDropdownOpen, toolsDropdownOpen]);

  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showIconLibrary, setShowIconLibrary] = useState(false);
  const [showShortcodeModal, setShowShortcodeModal] = useState(false);

  // Canvas Inserter & Column Picker States (Elementor Section & Column (+) Buttons)
  const [activeOpenInserterIndex, setActiveOpenInserterIndex] = useState<number | null>(null);
  const [insertTargetIndex, setInsertTargetIndex] = useState<number | null>(null);
  const [columnPickerTarget, setColumnPickerTarget] = useState<{ blockId: string; colIdx: number } | null>(null);

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
  const [leftSidebarVisible, setLeftSidebarVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return false;
    return true;
  });
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(370);
  const [rightSidebarVisible, setRightSidebarVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return false;
    return true;
  });
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
    const isCoffeeStore =
      activeStore.id === 'store-coffee' ||
      activeStore.domain?.includes('coffee') ||
      currentThemeId.includes('coffee');
    const isFlowerStore =
      activeStore.id === 'store-mecca' ||
      activeStore.domain?.includes('gift') ||
      activeStore.slug?.includes('flower') ||
      currentThemeId.includes('flower') ||
      currentThemeId.includes('luxury_gifts');

    const list = currentProducts && currentProducts.length > 0 ? currentProducts.map((p) => {
      const isArName = /[\u0600-\u06FF]/.test(p.nameAr || p.name || '');
      const nameAr = p.nameAr || (isArName ? p.name : p.subtitleAr || p.name);
      const nameEn = (!isArName ? p.name : (p.subtitle || p.sku || p.name));
      const pAny = p as any;

      const defaultNameAr = isCoffeeStore ? 'محصول بن مختص' : isFlowerStore ? 'باقة ورد طبيعي' : 'منتج مميز';
      const defaultNameEn = isCoffeeStore ? 'Specialty Coffee Beans' : isFlowerStore ? 'Fresh Flower Bouquet' : 'Featured Product';
      const defaultImg = isCoffeeStore
        ? 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80'
        : isFlowerStore
        ? '/images/hadaya_red_roses_bouquet_1791276749666.jpg'
        : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
      const defaultCatAr = isCoffeeStore ? 'حبوب القهوة المختصة' : isFlowerStore ? 'باقات الورود الطبيعية' : 'منتجات المتجر';
      const defaultCatEn = isCoffeeStore ? 'Specialty Coffee Beans' : isFlowerStore ? 'Natural Flower Bouquets' : 'Store Products';
      const defaultCatSlug = isCoffeeStore ? 'coffee-beans' : isFlowerStore ? 'bouquets' : 'products';
      const defaultOccasions = isCoffeeStore ? ['قهوة الصباح', 'ركن القهوة'] : isFlowerStore ? ['هدايا الحرم', 'مناسبات خاصة'] : ['عروض حصرية', 'منتجات مميزة'];
      const defaultTags = isCoffeeStore ? ['مختص', 'تحميص طازج', 'إسبريسو'] : isFlowerStore ? ['طبيعي', 'هولندي', 'فاخر'] : ['أصلي', 'جودة عالية', 'توصيل سريع'];
      const defaultDescAr = isCoffeeStore ? 'حبوب بن فاخرة منتقاة بعناية ومحمصة بحرفية.' : isFlowerStore ? 'تنسيق فاخر من أجود أنواع الزهور والورود الطبيعية.' : 'منتج عالي الجودة بأفضل المواصفات وضمان الجودة.';
      const defaultDescEn = isCoffeeStore ? 'Specialty roasted coffee beans carefully selected.' : isFlowerStore ? 'Luxury fresh floral arrangement crafted with premium blooms.' : 'Premium quality product with authentic craftsmanship.';

      return {
        id: String(p.id),
        name: nameAr || defaultNameAr,
        nameEn: nameEn || defaultNameEn,
        price: Number(p.discountedPrice || p.price || 0),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : (p.discountedPrice && p.discountedPrice < p.price ? Number(p.price) : undefined),
        rating: 4.9,
        reviewsCount: p.salesCount || 135,
        image: p.image || defaultImg,
        additionalImages: p.galleryUrls && p.galleryUrls.length > 0 ? p.galleryUrls : [p.image || defaultImg],
        category: p.category || defaultCatAr,
        categoryEn: pAny.categoryEn || p.category || defaultCatEn,
        categorySlug: pAny.categorySlug || (p.category ? p.category.toLowerCase().replace(/\s+/g, '-') : defaultCatSlug),
        occasions: p.tags || defaultOccasions,
        tags: p.tags || defaultTags,
        badge: p.originalPrice ? 'عرض خاص' : undefined,
        badgeEn: p.originalPrice ? 'Special Offer' : undefined,
        description: p.descriptionAr || p.description || defaultDescAr,
        descriptionEn: p.description || p.descriptionAr || defaultDescEn,
        flowerTypes: pAny.flowerTypes || (isCoffeeStore ? ['سلالة بوربون', 'كاتورا', 'غيشا'] : isFlowerStore ? ['جوري هولندي فاخر', 'بيبي روز', 'يوكاليبتوس'] : undefined),
        dimensions: pAny.dimensions || (isCoffeeStore ? 'كيس 250 جرام صمام تفريغ' : isFlowerStore ? 'ارتفاع 50 سم × عرض 35 سم' : undefined),
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
      // Fallback strictly to store's own items unless explicitly a flower store
      const safeFallback = isFlowerStore ? fallback : list;
      const rest = safeFallback.filter((f) => !existingIds.has(f.id));
      return [...matched, ...rest].slice(0, maxLimit);
    };

    if (isCoffeeStore) {
      return {
        natural: filterByKeywords(['إثيوبيا', 'غيشا', 'مختص', 'beans', 'حبوب', 'filter'], list, 6),
        luxury: filterByKeywords(['طقم', 'v60', 'kit', 'إسبريسو', 'ماكينة', 'gear'], list, 6),
        chocolate: filterByKeywords(['كولومبيا', 'reserve', 'محصول', 'roast', 'blend'], list, 6),
        cake: filterByKeywords(['ميزان', 'طاحونة', 'grinder', 'scale', 'kettle', 'إبريق'], list, 6),
        coffee: filterByKeywords(['قهوة', 'إسبريسو', 'coffee', 'espresso', 'باريستا'], list, 6),
        vases: filterByKeywords(['سيرفر', 'أكواب', 'server', 'cup', 'glass'], list, 6),
        mawajeeb: filterByKeywords(['حصري', 'مايكرولوت', 'micro-lot'], list, 4),
      };
    }

    if (!isFlowerStore) {
      return {
        natural: filterByKeywords(['جديد', 'new', 'مميز', 'featured'], list, 6),
        luxury: filterByKeywords(['فاخر', 'vip', 'luxury', 'طقم', 'pro'], list, 6),
        chocolate: filterByKeywords(['عرض', 'sale', 'offer', 'خصم'], list, 6),
        cake: filterByKeywords(['أفضل', 'best', 'top', 'شائع'], list, 6),
        coffee: filterByKeywords(['إكسسوار', 'ملحق', 'accessory'], list, 6),
        vases: filterByKeywords(['منتج', 'أصلي', 'standard'], list, 6),
        mawajeeb: filterByKeywords(['حصري', 'خاص', 'exclusive'], list, 4),
      };
    }

    return {
      natural: filterByKeywords(['طبيعي', 'باقة', 'rose', 'bouquet', 'peony', 'valent'], NATURAL_BOUQUETS, 6),
      luxury: filterByKeywords(['ملكي', 'سلة', 'طقم', 'vip', 'hamper', 'luxury', 'men', 'نساء'], LUXURY_SETS, 6),
      chocolate: filterByKeywords(['شوكول', 'باتشي', 'بستاني', 'choc'], CHOCOLATE_ROSES, 6),
      cake: filterByKeywords(['كيك', 'حلا', 'cake', 'ريد فيلفت', 'ميلاد'], CAKE_ROSES, 6),
      coffee: filterByKeywords(['قهوة', 'ضيافة', 'coffee'], COFFEE_SWEETS_ROSES, 6),
      vases: filterByKeywords(['فاز', 'كريستال', 'lily', 'orchid', 'vase'], FLOWER_VASES, 6),
      mawajeeb: filterByKeywords(['مواجيب', 'تراث', 'خشب', 'بخور'], MAWAJEEB_PRODUCTS, 4),
    };
  }, [currentProducts, activeStore.id, activeStore.domain, currentThemeId]);

  // Master Initial Blocks per store & theme
  const [blocks, setBlocks] = useState<BlockElement[]>(() =>
    (getLiveOrStoredBlocks(activeStore.id, currentThemeId, activeStore, { forBuilderDraft: true }) as BlockElement[]) ||
    createInitialBlocksForTheme(currentThemeId, activeStore),
  );

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
          // Self-heal: ensure all blocks have required fields & isolate header per store
          const isCoffeeNow = (currentThemeId && currentThemeId.includes('coffee')) || activeStore.id === 'store-coffee';
          const isCarNow = (currentThemeId && (currentThemeId.includes('saudia') || currentThemeId.includes('transport'))) || activeStore.id === 'store-bleco';
          const isNotHadayaNow = isCoffeeNow || isCarNow || (activeStore.id && activeStore.id !== 'store-1');

          const healed = parsed.blocks.map((b: any) => {
            let bSettings = b.settings || {};
            if (b.type === 'header' || b.id === 'header') {
              const hCustom = bSettings.headerCustom;
              const hasWrongFlowerDefaults = isNotHadayaNow && (
                !hCustom ||
                hCustom.logo?.titleAr === 'هدايا مكة' ||
                hCustom.logo?.titleEn === 'Hadaya Makkah' ||
                hCustom.announcement?.messages?.some((m: any) => m.textEn?.includes('Holland') || m.textEn?.includes('Flowers')) ||
                hCustom.navigation?.links?.some((l: any) => l.labelEn?.includes('Flower') || l.labelAr?.includes('باقات الورد'))
              );
              if (hasWrongFlowerDefaults) {
                bSettings = {
                  ...bSettings,
                  headerCustom: getDefaultHeaderSettings(activeStore, currentThemeId),
                };
              }
            }

            return {
              id: b.id || `block_${Date.now()}_${Math.random()}`,
              type: b.type || 'generic',
              titleEn: b.titleEn || 'Section',
              titleAr: b.titleAr || 'قسم',
              visible: b.visible !== false,
              templateStyle: b.templateStyle || 'tpl-default-clean',
              settings: bSettings,
              customHtml: b.customHtml || '',
              customCss: b.customCss || '',
              customJs: b.customJs || '',
            };
          });

          const defaultBlocks = createInitialBlocksForTheme(currentThemeId, activeStore);
          let finalBlocks = healed;

          // If flora-luxe draft has obsolete removed sections from the old design, purge them and ensure fresh live sections
          if (currentThemeId === 'theme-flora-luxe' || (!currentThemeId.includes('coffee') && !currentThemeId.includes('transport') && !currentThemeId.includes('saudia'))) {
            const hasObsolete = healed.some((b: any) => OBSOLETE_FLORA_BLOCK_IDS.includes(b.id || b.type));
            if (hasObsolete) {
              const cleaned = healed.filter((b: any) => !OBSOLETE_FLORA_BLOCK_IDS.includes(b.id || b.type));
              const existingTypes = new Set(cleaned.map((b: any) => b.type));
              const missing = defaultBlocks.filter((db: any) => !existingTypes.has(db.type));
              finalBlocks = [...cleaned, ...missing];
            }
          }

          // If draft has fewer than 6 sections, automatically merge missing essential theme sections
          // so that Category Grid, Products, Best Sellers, Footer, etc. are never missing!
          if (finalBlocks.length < 6) {
            const existingTypes = new Set(finalBlocks.map((b: any) => b.type));
            const missing = defaultBlocks.filter((db: any) => !existingTypes.has(db.type));
            finalBlocks = [...finalBlocks, ...missing];
          }

          setBlocks(finalBlocks);
          if (parsed.seasonalTheme) setSeasonalTheme(parsed.seasonalTheme);
          if (parsed.typographySettings) setTypographySettings(parsed.typographySettings);
          if (parsed.mobileMenuIcon) setMobileMenuIcon(parsed.mobileMenuIcon);
          setHasUnsavedChanges(false);
          return;
        }
      }
    } catch {
      // Auto-healed with defaults
    }

    // When no draft exists for this specific store & theme, dynamically load tailored defaults
    setBlocks(createInitialBlocksForTheme(currentThemeId, activeStore));
    setHasUnsavedChanges(false);
  }, [activeStore.id, currentThemeId, draftStorageKey]);

  // Restore all 24 default storefront sections
  const handleResetAllBlocksToDefault = useCallback(() => {
    const full = createInitialBlocksForTheme(currentThemeId, activeStore);
    setBlocks(full);
    setSelectedBlockId(full[0]?.id || 'header');
    setHasUnsavedChanges(true);
    toast(
      isAr
        ? 'تمت استعادة كافة أقسام المتجر (24 قسماً) وتفعيل التمرير الكامل بنجاح!'
        : 'All 24 storefront sections restored with full scrolling enabled!',
      'success',
    );
  }, [currentThemeId, activeStore, isAr]);

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

  // Quick 1-Click Structure Inserter (Elementor Grid Container with 25-25-50 Support)
  const handleQuickAddStructure = useCallback((cols: string, targetIndex?: number) => {
    const newId = `sec_grid_${Date.now()}`;
    const isFeaturedLayout = cols === '25-25-50';

    const defaultColumnsData = isFeaturedLayout
      ? {
          0: [
            { id: `cw_label_1_${Date.now()}`, type: 'counter_label', title: '1', settings: { text: '1', fontSize: 82 } },
            { id: `cw_head_1_${Date.now()}`, type: 'heading', title: 'Featured Category', settings: { text: 'Featured Category', htmlTag: 'h3' } },
            { id: `cw_art_1_${Date.now()}`, type: 'featured_posts', title: 'Typer Articles', settings: { postSource: 'latest', maxPosts: 2, showImage: true, showMeta: true } },
          ],
          1: [
            { id: `cw_label_2_${Date.now()}`, type: 'counter_label', title: '2', settings: { text: '2', fontSize: 82 } },
            { id: `cw_head_2_${Date.now()}`, type: 'heading', title: 'Popular Stories', settings: { text: 'Popular Stories', htmlTag: 'h3' } },
            { id: `cw_art_2_${Date.now()}`, type: 'featured_posts', title: 'Typer Articles', settings: { postSource: 'most_liked', maxPosts: 2, showImage: true, showMeta: true } },
          ],
          2: [
            { id: `cw_label_3_${Date.now()}`, type: 'counter_label', title: '3', settings: { text: '3', fontSize: 82 } },
            { id: `cw_head_3_${Date.now()}`, type: 'heading', title: 'Editor Picks', settings: { text: 'Editor Picks', htmlTag: 'h3' } },
            { id: `cw_art_3_${Date.now()}`, type: 'featured_posts', title: 'Typer Articles', settings: { postSource: 'latest', maxPosts: 4, showImage: true, showMeta: true } },
          ],
        }
      : undefined;

    const newBlock: BlockElement = {
      id: newId,
      type: 'columns_container',
      titleAr: isFeaturedLayout ? 'قسم المقالات المميزة (Featured Posts 25, 25, 50)' : `حاوية أعمدة شبكية (${cols})`,
      titleEn: isFeaturedLayout ? 'Featured Posts Section (25, 25, 50)' : `Grid Container (${cols})`,
      visible: true,
      templateStyle: isFeaturedLayout ? 'cols-3-featured' : 'cols-2-equal',
      settings: {
        layoutColumns: cols,
        gridOutline: true,
        columnGap: isFeaturedLayout ? 32 : 16,
        rowGap: 24,
        paddingTop: isFeaturedLayout ? 48 : 32,
        paddingBottom: isFeaturedLayout ? 48 : 32,
        contentWidth: isFeaturedLayout ? 'full' : 'boxed',
        bgType: isFeaturedLayout ? 'classic' : 'none',
        bgImage: isFeaturedLayout
          ? 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=80'
          : undefined,
        bgPosition: isFeaturedLayout ? 'custom' : 'center',
        bgCustomX: isFeaturedLayout ? 70 : 0,
        bgCustomY: isFeaturedLayout ? 66 : 0,
        bgRepeat: isFeaturedLayout ? 'no-repeat' : 'repeat',
        columnsData: defaultColumnsData,
      },
    };

    setBlocks((prev) => {
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= prev.length) {
        const copy = [...prev];
        copy.splice(targetIndex, 0, newBlock);
        return copy;
      }
      return [...prev, newBlock];
    });

    setSelectedBlockId(newId);
    setActiveTab(isFeaturedLayout ? 'content' : 'layout');
    setActiveOpenInserterIndex(null);
    setHasUnsavedChanges(true);
    toast(
      isAr
        ? isFeaturedLayout
          ? 'تم إدراج قسم المقالات المميزة بتوزيع (25, 25, 50) وإعدادات الخلفية!'
          : 'تم إدراج الحاوية وتقسيم الأعمدة بنجاح!'
        : isFeaturedLayout
          ? 'Inserted Featured Posts (25, 25, 50) with Elementor background settings!'
          : 'Inserted grid container structure!',
      'success',
    );
  }, [isAr, toast]);

  // Handle dropping a widget or reordered section onto a canvas inserter
  const handleDropOnCanvasInserter = useCallback(
    (targetIndex: number, e: React.DragEvent) => {
      e.preventDefault();
      // Check if dropped from widget library
      const rawWidget = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (rawWidget) {
        try {
          const parsed = JSON.parse(rawWidget);
          if (parsed.type === 'builder-widget' && parsed.widget) {
            const w = parsed.widget as WidgetDefinition;
            const newId = `widget_${w.type}_${Date.now()}`;
            const newBlock: BlockElement = {
              id: newId,
              type: w.type,
              titleAr: w.titleAr,
              titleEn: w.titleEn,
              visible: true,
              templateStyle: w.templateStyle,
              settings: { ...w.defaultSettings },
            };
            setBlocks((prev) => {
              const copy = [...prev];
              copy.splice(targetIndex, 0, newBlock);
              return copy;
            });
            setSelectedBlockId(newId);
            setHasUnsavedChanges(true);
            toast(
              isAr ? `تم إفلات وإضافة "${w.titleAr}"!` : `Dropped widget "${w.titleEn}"!`,
              'success',
            );
            return;
          }
        } catch {
          // not json, proceed
        }
      }

      // Check if dragging another section to reorder
      if (draggedBlockIdx !== null) {
        if (draggedBlockIdx === targetIndex || draggedBlockIdx === targetIndex - 1) {
          setDraggedBlockIdx(null);
          return;
        }
        setBlocks((prev) => {
          const copy = [...prev];
          const [moved] = copy.splice(draggedBlockIdx, 1);
          const adjTarget = targetIndex > draggedBlockIdx ? targetIndex - 1 : targetIndex;
          copy.splice(adjTarget, 0, moved);
          return copy;
        });
        setDraggedBlockIdx(null);
        toast(isAr ? 'تم نقل القسم بنجاح' : 'Section moved successfully', 'success');
      }
    },
    [draggedBlockIdx, isAr, toast],
  );

  // Handle dropping a widget or reordered section directly onto any canvas section
  const handleDropOnCanvasBlock = useCallback(
    (targetBlockIdx: number, position: 'above' | 'below', e: React.DragEvent) => {
      e.preventDefault();

      // 1. Check if dropped from widget library
      const rawWidget = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (rawWidget) {
        try {
          const parsed = JSON.parse(rawWidget);
          if (parsed.type === 'builder-widget' && parsed.widget) {
            const w = parsed.widget as WidgetDefinition;
            const newId = `widget_${w.type}_${Date.now()}`;
            const newBlock: BlockElement = {
              id: newId,
              type: w.type,
              titleAr: w.titleAr,
              titleEn: w.titleEn,
              visible: true,
              templateStyle: w.templateStyle,
              settings: { ...w.defaultSettings },
            };
            const insertIdx = position === 'above' ? targetBlockIdx : targetBlockIdx + 1;
            setBlocks((prev) => {
              const copy = [...prev];
              copy.splice(insertIdx, 0, newBlock);
              return copy;
            });
            setSelectedBlockId(newId);
            setHasUnsavedChanges(true);
            toast(
              isAr
                ? `تم إفلات وإدراج العنصر "${w.titleAr}" مباشرة على الصفحة!`
                : `Dropped widget "${w.titleEn}" directly onto canvas!`,
              'success',
            );
            return;
          }
        } catch {
          // not widget JSON, continue to section reorder
        }
      }

      // 2. Direct on-canvas section reorder:
      let sourceIdx = draggedBlockIdx;
      if (sourceIdx === null) {
        const rawText = e.dataTransfer.getData('text/plain');
        if (rawText && !isNaN(Number(rawText))) {
          sourceIdx = Number(rawText);
        }
      }

      if (sourceIdx !== null && sourceIdx !== undefined && !isNaN(sourceIdx)) {
        let destIdx = position === 'above' ? targetBlockIdx : targetBlockIdx + 1;
        if (sourceIdx === destIdx || (sourceIdx + 1 === destIdx && position === 'below')) {
          setDraggedBlockIdx(null);
          return;
        }
        setBlocks((prev) => {
          const copy = [...prev];
          const [moved] = copy.splice(sourceIdx!, 1);
          const adjustedDest = destIdx > sourceIdx! ? destIdx - 1 : destIdx;
          copy.splice(adjustedDest, 0, moved);
          return copy;
        });
        setDraggedBlockIdx(null);
        setHasUnsavedChanges(true);
        toast(
          isAr
            ? 'تم إعادة ترتيب القسم بالسحب والإفلات المباشر على الصفحة!'
            : 'Section reordered via direct on-canvas drag & drop!',
          'success',
        );
      }
    },
    [draggedBlockIdx, isAr, toast],
  );

  // Handle dropping a widget into a specific column of a container
  const handleDropOnColumnWidget = useCallback(
    (blockId: string, colIdx: number, widgetData: any) => {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== blockId) return b;
          const currentCols = b.settings?.columnsData || {};
          const currentList = currentCols[colIdx] || [];
          const newWidget = {
            id: `cw_${widgetData.type || 'widget'}_${Date.now()}`,
            type: widgetData.type || 'widget',
            title: widgetData.titleEn || widgetData.titleAr || widgetData.type,
            settings: widgetData.defaultSettings || widgetData.settings || {},
          };
          return {
            ...b,
            settings: {
              ...b.settings,
              columnsData: {
                ...currentCols,
                [colIdx]: [...currentList, newWidget],
              },
            },
          };
        }),
      );
      setHasUnsavedChanges(true);
      toast(isAr ? `تم إضافة العنصر للعمود ${colIdx + 1}` : `Widget added to Column ${colIdx + 1}`, 'success');
    },
    [isAr, toast],
  );

  // Quick add widget to column from ColumnWidgetPickerModal
  const handleAddWidgetToColumn = useCallback(
    (blockId: string, colIdx: number, widgetType: string, label?: string, customSettings?: any) => {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== blockId) return b;
          const currentCols = b.settings?.columnsData || {};
          const currentList = currentCols[colIdx] || [];
          const newWidget = {
            id: `cw_${widgetType}_${Date.now()}`,
            type: widgetType,
            title: label || widgetType,
            settings: customSettings || {},
          };
          return {
            ...b,
            settings: {
              ...b.settings,
              columnsData: {
                ...currentCols,
                [colIdx]: [...currentList, newWidget],
              },
            },
          };
        }),
      );
      setHasUnsavedChanges(true);
      setColumnPickerTarget(null);
      toast(isAr ? `تمت إضافة العنصر في العمود ${colIdx + 1}` : `Widget added to Column ${colIdx + 1}`, 'success');
    },
    [isAr, toast],
  );

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
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setLeftSidebarVisible(false);
    }
    if (previewPage !== 'home') {
      setPreviewPage('home');
    }
    // Smooth scroll to section in canvas
    setTimeout(() => {
      const el = document.getElementById(`selia_block_${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-2');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-2');
        }, 1200);
      }
    }, 100);
  }, [previewPage]);

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

    if (payload.blockType === 'featured_posts') {
      initialSettings.titleAr = payload.titleAr || 'المقالات المميزة';
      initialSettings.titleEn = payload.titleEn || 'Featured Posts';
      initialSettings.subtitleAr = 'أحدث مقالات وتغطيات متجرنا الحصرية';
      initialSettings.subtitleEn = 'Top trending stories & editorial reviews';
      initialSettings.counterLabel = '1';
      initialSettings.counterFontSize = 82;
      initialSettings.postCategory = 'Trending Category';
      initialSettings.postSource = 'latest';
      initialSettings.maxPosts = 3;
      initialSettings.showImage = true;
      initialSettings.showMeta = true;
      initialSettings.showTag = true;
      initialSettings.contentWidth = 'full';
      initialSettings.bgType = 'classic';
      initialSettings.bgPosition = 'custom';
      initialSettings.bgCustomX = 70;
      initialSettings.bgCustomY = 66;
      initialSettings.bgRepeat = 'no-repeat';
    }

    if (payload.blockType === 'columns_container') {
      const isFeatured = payload.layoutColumns === '25-25-50';
      initialSettings.columnGap = isFeatured ? 32 : 16;
      initialSettings.contentWidth = isFeatured ? 'full' : 'boxed';
      initialSettings.bgType = isFeatured ? 'classic' : 'none';
      initialSettings.bgPosition = isFeatured ? 'custom' : 'center';
      initialSettings.bgCustomX = isFeatured ? 70 : 0;
      initialSettings.bgCustomY = isFeatured ? 66 : 0;
      initialSettings.bgRepeat = isFeatured ? 'no-repeat' : 'repeat';
      if (isFeatured) {
        initialSettings.columnsData = {
          0: [
            { id: `cw_l_1_${Date.now()}`, type: 'counter_label', title: '1', settings: { text: '1', fontSize: 82 } },
            { id: `cw_h_1_${Date.now()}`, type: 'heading', title: 'Category 1', settings: { text: 'Category 1', htmlTag: 'h3' } },
            { id: `cw_a_1_${Date.now()}`, type: 'featured_posts', title: 'Typer Articles', settings: { postSource: 'latest', maxPosts: 2, showImage: true, showMeta: true } },
          ],
          1: [
            { id: `cw_l_2_${Date.now()}`, type: 'counter_label', title: '2', settings: { text: '2', fontSize: 82 } },
            { id: `cw_h_2_${Date.now()}`, type: 'heading', title: 'Category 2', settings: { text: 'Category 2', htmlTag: 'h3' } },
            { id: `cw_a_2_${Date.now()}`, type: 'featured_posts', title: 'Typer Articles', settings: { postSource: 'most_liked', maxPosts: 2, showImage: true, showMeta: true } },
          ],
          2: [
            { id: `cw_l_3_${Date.now()}`, type: 'counter_label', title: '3', settings: { text: '3', fontSize: 82 } },
            { id: `cw_h_3_${Date.now()}`, type: 'heading', title: 'Category 3', settings: { text: 'Category 3', htmlTag: 'h3' } },
            { id: `cw_a_3_${Date.now()}`, type: 'featured_posts', title: 'Typer Articles', settings: { postSource: 'latest', maxPosts: 4, showImage: true, showMeta: true } },
          ],
        };
      }
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

    setBlocks((prev) => {
      if (typeof insertTargetIndex === 'number' && insertTargetIndex >= 0 && insertTargetIndex <= prev.length) {
        const copy = [...prev];
        copy.splice(insertTargetIndex, 0, newBlock);
        return copy;
      }
      return [...prev, newBlock];
    });

    setInsertTargetIndex(null);
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
      const headerBlock = blocks.find((b) => b.id === 'header');

      if (headerBlock?.settings?.headerCustom) {
        full.customHeader = headerBlock.settings.headerCustom;
      }

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
      writeAllThemeSettings(activeStore.id, full, currentThemeId);

      // Save draft and published blocks with live sync broadcast across all store themes
      saveThemeBlocks(activeStore.id, currentThemeId, blocks as any, {
        isPublished: true,
        seasonalTheme,
        typographySettings,
        mobileMenuIcon,
      });
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
      saveThemeBlocks(activeStore.id, currentThemeId, blocks as any, {
        isPublished: false,
        seasonalTheme,
        typographySettings,
        mobileMenuIcon,
      });
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

  const handleSyncWithLive = useCallback(() => {
    const liveBlocks = syncThemeWithLive(activeStore.id, currentThemeId, activeStore);
    setBlocks(liveBlocks as BlockElement[]);
    setSelectedBlockId(liveBlocks[0]?.id || 'header');
    setHasUnsavedChanges(false);
    toast(
      isAr
        ? 'تمت مزامنة واستعادة تصميم وأقسام المتجر المباشر بنجاح مع giftshop-sa.com!'
        : 'Store design and sections synced successfully with live giftshop-sa.com!',
      'success',
    );
  }, [activeStore, currentThemeId, isAr, toast]);

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
      className="fixed inset-0 z-50 flex flex-col bg-slate-100 text-slate-900 overflow-hidden font-sans animate-in fade-in zoom-in-[0.99] duration-150 ease-out"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: typographySettings.fontFamily }}
    >
      {/* ========================================================
          1. CLEAN, ORGANIZED & FULLY RESPONSIVE TOPBAR (NO OVERLAP / NO SCROLL)
          ======================================================== */}
      <header className="h-14 sm:h-15 px-2 sm:px-4 bg-white border-b border-slate-200/90 shadow-2xs flex items-center justify-between shrink-0 z-[100] gap-1.5 sm:gap-2.5 relative w-full overflow-visible select-none">
        {/* Left: Branding & All-Pages & Theme Dropdown */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title={isAr ? 'الرجوع للمتجر' : 'Back to Store'}
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>

          <div className="hidden 2xl:flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shadow-indigo-200 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div className="truncate max-w-[120px]">
              <span className="font-extrabold text-xs text-slate-900 truncate block">
                {getStoreDisplayName(activeStore, locale)}
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-0.5 hidden 2xl:block" />

          {/* ALL PAGES SWITCHER DROPDOWN */}
          <div className="relative" ref={pageDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setPageDropdownOpen(!pageDropdownOpen);
                setThemeDropdownOpen(false);
                setSeasonDropdownOpen(false);
                setToolsDropdownOpen(false);
              }}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
              title={isAr ? 'تغيير صفحة المتجر' : 'Switch Store Page'}
            >
              {(() => {
                const PageIcon = currentActivePageObj.icon;
                return <PageIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
              })()}
              <span className="truncate max-w-[70px] sm:max-w-[110px] md:max-w-[140px]">
                {isAr ? currentActivePageObj.labelAr : currentActivePageObj.labelEn}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${pageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {pageDropdownOpen && (
              <div className="absolute top-full mt-2 start-0 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/10 border border-slate-200/90 p-1.5 z-[130] space-y-0.5 max-h-[75vh] overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150">
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
                      <span className="flex items-center gap-2 truncate">
                        <PIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="truncate">{isAr ? p.labelAr : p.labelEn}</span>
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* THEME SELECTOR & ACTIVE STATUS */}
          <div className="relative" ref={themeDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setThemeDropdownOpen(!themeDropdownOpen);
                setPageDropdownOpen(false);
                setSeasonDropdownOpen(false);
                setToolsDropdownOpen(false);
              }}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
              title={isAr ? 'اختيار الثيم' : 'Select Theme'}
            >
              <Palette className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate max-w-[85px] sm:max-w-[110px] md:max-w-[140px]">
                {themeDisplayLabel}
              </span>
              {isEditingActiveTheme ? (
                <span className="hidden sm:inline-block text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold shrink-0">
                  {isAr ? 'النشط' : 'Live'}
                </span>
              ) : (
                <span className="hidden sm:inline-block text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-bold shrink-0">
                  {isAr ? 'مسودة' : 'Draft'}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-indigo-400 transition-transform shrink-0 ${themeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {themeDropdownOpen && (
              <div className="absolute top-full mt-2 start-0 w-72 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/10 border border-slate-200/90 p-2 z-[130] space-y-1 max-h-[75vh] overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150">
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
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold shrink-0">
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

        {/* Center: Device Viewport & Editor Undo/Redo & Season (Centered & Responsive) */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 shrink-0">
          {/* Device Viewport Switcher (Always accessible on all screen sizes) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 gap-0.5 shrink-0">
            {[
              { mode: 'desktop' as DeviceMode, icon: <Monitor className="w-3.5 h-3.5" />, label: 'Desktop', showClass: 'flex' },
              { mode: 'laptop' as DeviceMode, icon: <Laptop className="w-3.5 h-3.5" />, label: 'Laptop', showClass: 'hidden xl:flex' },
              { mode: 'tablet' as DeviceMode, icon: <Tablet className="w-3.5 h-3.5" />, label: 'Tablet', showClass: 'flex' },
              { mode: 'mobile' as DeviceMode, icon: <Smartphone className="w-3.5 h-3.5" />, label: 'Mobile', showClass: 'flex' },
            ].map((d) => (
              <button
                key={d.mode}
                type="button"
                onClick={() => setDevice(d.mode)}
                className={`p-1.5 px-2 rounded-lg text-xs font-semibold items-center gap-1 transition-all cursor-pointer ${d.showClass} ${
                  device === d.mode
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={d.label}
              >
                {d.icon}
                <span className="hidden 2xl:inline text-[11px]">{d.label}</span>
              </button>
            ))}
          </div>

          {/* Undo & Redo History in Center Context */}
          <div className="hidden sm:flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title={isAr ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            >
              <Undo2 className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title={isAr ? 'إعادة (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
            >
              <Redo2 className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
          </div>

          {/* SEASONAL THEME PRESETS DROPDOWN (Shown on xl+, accessible via Tools on smaller screens) */}
          <div className="relative hidden xl:block" ref={seasonDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setSeasonDropdownOpen(!seasonDropdownOpen);
                setPageDropdownOpen(false);
                setThemeDropdownOpen(false);
                setToolsDropdownOpen(false);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
              title={isAr ? 'الثيم الموسمي' : 'Seasonal Theme'}
            >
              <span className="flex items-center gap-1.5">
                {seasonalTheme === 'Ramadan' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAr ? 'رمضان' : 'Ramadan'}</span>
                  </>
                ) : seasonalTheme === 'Eid' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isAr ? 'العيد' : 'Eid'}</span>
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
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${seasonDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {seasonDropdownOpen && (
              <div className="absolute top-full mt-2 start-0 w-52 sm:w-56 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/10 border border-slate-200/90 p-1.5 z-[130] space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-150">
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
        </div>

        {/* Right: Tools & Action Buttons (Aligned to End) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ms-auto">
          {/* Toggle Sidebar Buttons (Accessible across all screens) */}
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs shrink-0">
            <button
              type="button"
              onClick={() => {
                setLeftSidebarVisible(!leftSidebarVisible);
                if (screenSize.isMobile || screenSize.isTablet) setRightSidebarVisible(false);
              }}
              className={`p-1.5 px-2 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                leftSidebarVisible ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={isAr ? 'إظهار / إخفاء أقسام الصفحة' : 'Toggle Left Blocks Outline'}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">{isAr ? 'الأقسام' : 'Blocks'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRightSidebarVisible(!rightSidebarVisible);
                if (screenSize.isMobile || screenSize.isTablet) setLeftSidebarVisible(false);
              }}
              className={`p-1.5 px-2 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                rightSidebarVisible ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={isAr ? 'إظهار / إخفاء لوحة التعديل' : 'Toggle Right Inspector'}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">{isAr ? 'المفتش' : 'Inspector'}</span>
            </button>
          </div>

          {/* Sleek 1-Click Bilingual Language Switcher (Saves 110px compared to dual buttons) */}
          <button
            type="button"
            onClick={() => handleToggleLanguage(isAr ? 'en' : 'ar')}
            className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0"
            title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-extrabold text-[11px]">{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* Shortcode Generator (Visible on 2xl+, in Tools dropdown on < 2xl) */}
          <button
            type="button"
            onClick={() => setShowShortcodeModal(true)}
            className="hidden 2xl:inline-flex px-2.5 py-1.5 rounded-xl text-xs font-bold border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 cursor-pointer items-center gap-1 shadow-2xs transition-colors shrink-0"
            title={isAr ? 'توليد ونسخ كود قصير للمنتجات' : 'Generate & Copy Product Shortcodes'}
          >
            <Code className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isAr ? 'الأكواد' : 'Shortcodes'}</span>
          </button>

          {/* Tools & View Settings Dropdown */}
          <div className="relative" ref={toolsDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setToolsDropdownOpen(!toolsDropdownOpen);
                setPageDropdownOpen(false);
                setThemeDropdownOpen(false);
                setSeasonDropdownOpen(false);
              }}
              className="p-1.5 sm:p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs shrink-0"
              title={isAr ? 'أدوات العرض والخيارات' : 'View Tools & Options'}
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            </button>

            {toolsDropdownOpen && (
              <div className="absolute top-full mt-2 end-0 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/10 border border-slate-200/90 p-3 z-[130] space-y-2.5 text-xs animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-1 py-0.5 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                  {isAr ? 'إعدادات وأدوات المحرر' : 'Editor Tools & Settings'}
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-700">{isAr ? 'خلفية مساحة العمل' : 'Canvas Theme'}</span>
                  <button
                    type="button"
                    onClick={() => setCanvasDarkMode(!canvasDarkMode)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
                    title={canvasDarkMode ? 'Switch to Light' : 'Switch to Dark'}
                  >
                    {canvasDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Seasonal themes selector inside Tools menu (for tablets/laptops) */}
                <div className="py-1 border-b border-slate-100 space-y-1.5">
                  <span className="font-bold text-slate-700 block">{isAr ? 'الثيم الموسمي:' : 'Seasonal Theme:'}</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'Default' as SeasonalPreset, icon: Zap, label: isAr ? 'الافتراضي' : 'Default' },
                      { id: 'Eid' as SeasonalPreset, icon: Sparkles, label: isAr ? 'العيد' : 'Eid' },
                      { id: 'Ramadan' as SeasonalPreset, icon: Moon, label: isAr ? 'رمضان' : 'Ramadan' },
                      { id: 'Valentine' as SeasonalPreset, icon: Heart, label: isAr ? 'الحب' : 'Valentine' },
                    ].map((s) => {
                      const Icon = s.icon;
                      const isSel = seasonalTheme === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            handleSeasonalChange(s.id);
                            setToolsDropdownOpen(false);
                          }}
                          className={`p-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                            isSel ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shortcode modal trigger */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowShortcodeModal(true);
                      setToolsDropdownOpen(false);
                    }}
                    className="w-full py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAr ? 'مولد الأكواد المختصرة' : 'Product Shortcodes'}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180 text-emerald-600" />
                  </button>
                </div>

                {/* Restore All Default Sections Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleResetAllBlocksToDefault();
                      setToolsDropdownOpen(false);
                    }}
                    className="w-full py-2 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isAr ? 'استعادة كافة أقسام المتجر (24 قسماً)' : 'Restore All Store Sections (24)'}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180 text-indigo-600" />
                  </button>
                </div>

                {lastSavedTime && (
                  <div className="text-[10px] text-slate-400 text-center font-mono pt-1 flex items-center justify-center gap-1 border-t border-slate-100">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>{isAr ? `حفظ تلقائي: ${lastSavedTime}` : `Auto-saved: ${lastSavedTime}`}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Preview Mode Toggle */}
          <button
            type="button"
            onClick={() => setPreviewModeOnly(!previewModeOnly)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs shrink-0 ${
              previewModeOnly
                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title={isAr ? 'معاينة حية للمتجر كزائر حقيقي' : 'Live Store Preview'}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isAr ? (previewModeOnly ? 'إنهاء' : 'معاينة') : (previewModeOnly ? 'Exit' : 'Preview')}</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer inline-flex items-center gap-1 shadow-2xs transition-colors shrink-0"
            title={isAr ? 'حفظ المسودة' : 'Save Draft'}
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden lg:inline">{isAr ? 'حفظ' : 'Save'}</span>
          </button>

          {/* Publish Live */}
          <button
            type="button"
            onClick={handlePublishLive}
            className="px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-xs shadow-indigo-200 cursor-pointer inline-flex items-center gap-1.5 transition-colors shrink-0"
            title={isAr ? 'نشر التعديلات للمتجر مباشرة' : 'Publish Live to Store'}
          >
            <Send className="w-3.5 h-3.5 rtl:-scale-x-100" />
            <span className="whitespace-nowrap">{isAr ? 'نشر مباشر' : 'Publish Live'}</span>
          </button>
        </div>
      </header>

      {/* ── Connected Workspace Bar in Builder ── */}
      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200">
        <ConnectedWorkspaceBanner page="builder" compact={true} />
      </div>

      {/* Live Preview Notification Banner */}
      {previewModeOnly && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md z-[90] animate-in fade-in">
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
      <div className="flex-1 flex overflow-hidden min-h-0 relative z-0">
        {/* ========================================================
            LEFT SIDEBAR: BLOCKS & LAYOUT OUTLINE (RESIZABLE & DRAWER)
            ======================================================== */}
        {leftSidebarVisible && !previewModeOnly ? (
          <>
            {/* Mobile / Tablet Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-200"
              onClick={() => setLeftSidebarVisible(false)}
            />
            <aside
              style={{
                width: screenSize.isMobile ? '88vw' : `${Math.min(leftSidebarWidth, 400)}px`,
                maxWidth: '420px',
              }}
              className="fixed top-0 bottom-0 start-0 z-50 bg-white shadow-2xl flex flex-col select-none lg:static lg:z-0 lg:shadow-none border-e border-slate-200 animate-in slide-in-from-start duration-200"
            >
              {/* Drawer Mobile Top Close Header */}
              <div className="lg:hidden flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50 shrink-0">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? 'أقسام وطبقات الصفحة' : 'Page Blocks & Layers'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {blocks.length}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setLeftSidebarVisible(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

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
                    const isHeaderBlock = b.type === 'header' || b.id === 'header';
                    return (
                      <div key={b.id} className="space-y-1">
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDrop={(e) => handleDrop(e, idx)}
                          onClick={() => {
                            handleSelectBlock(b.id);
                            if (isHeaderBlock) setHeaderSubElement('general');
                          }}
                          className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs font-bold'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          } ${!b.visible ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isHeaderBlock && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHeaderLayerExpanded(!headerLayerExpanded);
                                }}
                                className="p-0.5 hover:bg-indigo-100 rounded text-indigo-700 cursor-pointer shrink-0"
                                title={headerLayerExpanded ? (isAr ? 'طي' : 'Collapse') : (isAr ? 'توسيع' : 'Expand')}
                              >
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    headerLayerExpanded ? 'rotate-0' : '-rotate-90'
                                  }`}
                                />
                              </button>
                            )}
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

                        {/* Nested Header Sub-Elements Tree */}
                        {isHeaderBlock && headerLayerExpanded && (
                          <div className="ms-4 ps-2 border-s-2 border-indigo-200 space-y-1 py-0.5">
                            {[
                              { id: 'announcement' as const, labelAr: '📢 شريط الإعلانات', labelEn: '📢 Top Bar', icon: Megaphone },
                              { id: 'logo' as const, labelAr: '👑 شعار المتجر', labelEn: '👑 Logo & Brand', icon: Crown },
                              { id: 'navigation' as const, labelAr: '🧭 القائمة الرئيسية', labelEn: '🧭 Navigation', icon: Menu },
                              { id: 'actions' as const, labelAr: '🛒 الأيقونات والسلة', labelEn: '🛒 Actions & Cart', icon: ShoppingBag },
                              { id: 'language' as const, labelAr: '🌐 تبديل اللغة', labelEn: '🌐 Language', icon: Globe },
                              { id: 'general' as const, labelAr: '⚙️ حاوية الهيدر', labelEn: '⚙️ Header Container', icon: Sliders },
                            ].map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubSelected = isSelected && headerSubElement === sub.id;
                              return (
                                <div
                                  key={sub.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectBlock(b.id);
                                    setHeaderSubElement(sub.id);
                                  }}
                                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                    isSubSelected
                                      ? 'bg-indigo-600 text-white shadow-xs font-extrabold'
                                      : 'hover:bg-indigo-50 text-slate-600 hover:text-indigo-950'
                                  }`}
                                >
                                  <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubSelected ? 'text-amber-300' : 'text-slate-400'}`} />
                                  <span className="truncate">{isAr ? sub.labelAr : sub.labelEn}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Section & Restore All Buttons */}
                <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddSectionModal(true)}
                    className="w-full py-2 px-3 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'إضافة قسم جديد (Elementor Grid)' : 'Add New Section'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAllBlocksToDefault}
                    className="w-full py-1.5 px-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 text-slate-600 hover:text-indigo-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    title={isAr ? 'استعادة كافة أقسام الصفحة الافتراضية كاملة (24 قسماً)' : 'Restore All Default Sections (24)'}
                  >
                    <RotateCcw className="w-3 h-3 text-indigo-500" />
                    <span>{isAr ? `استعادة كافة الأقسام (${blocks.length}/24)` : `Restore All Sections (${blocks.length}/24)`}</span>
                  </button>
                </div>
              </>
            )}

            {/* Left Resize Handle (desktop only) */}
            <div
              onMouseDown={() => setIsDraggingLeft(true)}
              className="hidden lg:block absolute top-0 bottom-0 end-0 w-1.5 cursor-col-resize hover:bg-indigo-500 transition-colors z-30"
            />
          </aside>
        </>
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
            CENTER CANVAS: LIVE INTERACTIVE PREVIEW (SMOOTH SCROLL)
            ======================================================== */}
        <main
          id="theme-builder-canvas-scroll"
          tabIndex={0}
          className={`flex-1 overflow-y-auto overscroll-contain flex flex-col items-center transition-colors scroll-smooth focus:outline-none ${
            screenSize.isMobile ? 'p-1 pb-24' : 'p-2 sm:p-6'
          } ${canvasDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            className={`transition-all duration-300 w-full ${
              device === 'mobile'
                ? screenSize.isMobile
                  ? 'w-full rounded-none border-0 shadow-none my-0 bg-white builder-device-mobile'
                  : 'max-w-[420px] shadow-2xl rounded-[40px] border-[10px] border-slate-900 bg-white my-6 builder-device-mobile relative'
                : device === 'tablet'
                  ? screenSize.isTablet || screenSize.isMobile
                    ? 'w-full rounded-none border-0 shadow-none my-0 bg-white builder-device-tablet'
                    : 'max-w-[768px] shadow-xl rounded-2xl border-[6px] border-slate-700 bg-white my-6 builder-device-tablet relative'
                  : device === 'laptop'
                    ? 'max-w-[1024px] shadow-lg rounded-xl border border-slate-200 bg-white my-4 builder-device-laptop relative'
                    : 'max-w-[1400px] shadow-sm rounded-xl border border-slate-200 bg-white my-4 builder-device-desktop relative'
            }`}
          >
            {/* Authentic Mobile Phone Notch & Dynamic Island Header */}
            {device === 'mobile' && !screenSize.isMobile && (
              <div className="h-7 bg-slate-900 flex items-center justify-center shrink-0 rounded-t-[28px] select-none sticky top-0 z-40 shadow-xs -mt-[1px]">
                <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-2 border border-slate-800 shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <div className="w-2 h-2 rounded-full bg-indigo-950 border border-slate-800 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-indigo-400" />
                  </div>
                </div>
              </div>
            )}

            {previewPage === 'home' ? (
              <div className="relative">
                {/* Alert banner if fewer than 6 sections are loaded */}
                {visibleBlocks.length < 6 && (
                  <div className="m-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        {isAr
                          ? `يوجد حالياً ${visibleBlocks.length} أقسام فقط. هل ترغب في إظهار كافة أقسام المتجر (24 قسماً) وتفعيل التمرير الكامل؟`
                          : `Only ${visibleBlocks.length} sections loaded. Would you like to restore all 24 storefront sections with full scrolling?`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetAllBlocksToDefault}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs cursor-pointer shrink-0 transition-transform hover:scale-105 active:scale-95"
                    >
                      {isAr ? 'إظهار كافة الأقسام الآن ✦' : 'Show All Sections ✦'}
                    </button>
                  </div>
                )}

                {/* Canvas Inserter at Top of Canvas (Position #0) */}
                <CanvasSectionInserter
                  isAr={isAr}
                  insertIndex={0}
                  activeOpenIndex={activeOpenInserterIndex}
                  setActiveOpenIndex={setActiveOpenInserterIndex}
                  onSelectStructure={(cols, targetIdx) => handleQuickAddStructure(cols, targetIdx)}
                  onOpenSectionModal={(targetIdx) => {
                    setInsertTargetIndex(targetIdx);
                    setShowAddSectionModal(true);
                  }}
                  onDropItem={handleDropOnCanvasInserter}
                  isDragging={draggedBlockIdx !== null}
                />

                <div className="divide-y divide-slate-100">
                  {visibleBlocks.map((b, idx) => (
                    <React.Fragment key={b.id}>
                      <CanvasBlockItem
                        b={b}
                        idx={idx}
                        totalBlocks={visibleBlocks.length}
                        isSelected={selectedBlockId === b.id}
                        headerSubElement={headerSubElement}
                        onSelectHeaderSubElement={(blockId, subKey) => {
                          setSelectedBlockId(blockId);
                          setHeaderSubElement(subKey);
                        }}
                        heroSlideIndex={heroSlideIndex}
                        heroSubElement={heroSubElement}
                        onSelectHeroSubElement={(blockId, subKey, slideIdx) => {
                          setSelectedBlockId(blockId);
                          setHeroSlideIndex(slideIdx);
                          setHeroSubElement(subKey);
                          setActiveTab('content');
                          setRightSidebarVisible(true);
                        }}
                        selectedCategoryIndex={selectedCategoryIndex}
                        onSelectCategory={(blockId, catIdx) => {
                          setSelectedBlockId(blockId);
                          setSelectedCategoryIndex(catIdx);
                          setActiveTab('content');
                          setRightSidebarVisible(true);
                        }}
                        footerSubElement={footerSubElement}
                        onSelectFooterSubElement={(blockId, subKey) => {
                          setSelectedBlockId(blockId);
                          setFooterSubElement(subKey);
                          setActiveTab('content');
                          setRightSidebarVisible(true);
                        }}
                        isAr={isAr}
                        device={device}
                        sectionProducts={sectionProducts}
                        onSelect={handleSelectBlock}
                        onMove={handleMoveBlock}
                        onToggleVisibility={handleToggleBlockVisibility}
                        onDelete={handleDeleteBlock}
                        onDuplicate={handleDuplicateBlock}
                        onInsertAbove={(insertIdx) => {
                          setInsertTargetIndex(insertIdx);
                          setActiveOpenInserterIndex(insertIdx);
                        }}
                        onDragStart={handleDragStart}
                        onDropOnColumnWidget={handleDropOnColumnWidget}
                        onAddColumnWidgetClick={(blockId, colIdx) => {
                          setColumnPickerTarget({ blockId, colIdx });
                        }}
                        isDraggingThisBlock={draggedBlockIdx === idx}
                        onDropOnBlock={handleDropOnCanvasBlock}
                      />

                      {/* Canvas Inserter Option AFTER Every Section (Full Drag & Drop support) */}
                      <CanvasSectionInserter
                        isAr={isAr}
                        insertIndex={idx + 1}
                        activeOpenIndex={activeOpenInserterIndex}
                        setActiveOpenIndex={setActiveOpenInserterIndex}
                        onSelectStructure={(cols, targetIdx) => handleQuickAddStructure(cols, targetIdx)}
                        onOpenSectionModal={(targetIdx) => {
                          setInsertTargetIndex(targetIdx);
                          setShowAddSectionModal(true);
                        }}
                        onDropItem={handleDropOnCanvasInserter}
                        isDragging={draggedBlockIdx !== null}
                      />
                    </React.Fragment>
                  ))}
                </div>

                {/* Elementor Structure Inserter (1-Click Add & Structure Picker) */}
                <CanvasStructurePicker
                  isAr={isAr}
                  onSelectStructure={(cols) => handleQuickAddStructure(cols, visibleBlocks.length)}
                />
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

            {/* Authentic Mobile Phone Bottom Home Indicator Bar */}
            {device === 'mobile' && !screenSize.isMobile && (
              <div className="h-7 bg-slate-900 flex items-center justify-center shrink-0 rounded-b-[28px] select-none sticky bottom-0 z-40 shadow-xs -mb-[1px]">
                <div className="w-32 h-1 bg-slate-600 rounded-full" />
              </div>
            )}
          </div>
        </main>

        {/* ========================================================
            RIGHT SIDEBAR: ELEMENTOR INSPECTOR (RESIZABLE & DRAWER)
            ======================================================== */}
        {rightSidebarVisible && !previewModeOnly ? (
          <>
            {/* Mobile / Tablet Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-200"
              onClick={() => setRightSidebarVisible(false)}
            />
            <aside
              style={{
                width: screenSize.isMobile ? '92vw' : `${Math.min(rightSidebarWidth, 440)}px`,
                maxWidth: '460px',
              }}
              className="fixed top-0 bottom-0 end-0 z-50 bg-white shadow-2xl flex flex-col select-none lg:static lg:z-0 lg:shadow-none border-s border-slate-200 animate-in slide-in-from-end duration-200"
            >
              {/* Drawer Mobile Top Close Header */}
              <div className="lg:hidden flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50 shrink-0">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? 'مفتش خصائص القسم' : 'Block Inspector'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setRightSidebarVisible(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Right Resize Handle (desktop only) */}
              <div
                onMouseDown={() => setIsDraggingRight(true)}
                className="hidden lg:block absolute top-0 bottom-0 start-0 w-1.5 cursor-col-resize hover:bg-indigo-500 transition-colors z-30"
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
              {/* Header Block Granular Element Inspector */}
              {(selectedBlock.type === 'header' || selectedBlock.id === 'header') &&
              (activeTab === 'content' || activeTab === 'templates' || activeTab === 'styling' || activeTab === 'layout') ? (
                <HeaderElementInspector
                  settings={selectedBlock.settings?.headerCustom || getDefaultHeaderSettings(activeStore, currentThemeId)}
                  activeSubElement={headerSubElement}
                  onSelectSubElement={(subElem) => setHeaderSubElement(subElem)}
                  onUpdateSettings={(newSettings) => {
                    handleUpdateBlockSetting('headerCustom', newSettings);
                  }}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isAr={isAr}
                />
              ) : (
                <>
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

                      {/* Universal Granular Inspector for this section */}
                      <UniversalSectionInspector
                        block={selectedBlock}
                        onUpdateSetting={handleUpdateBlockSetting}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        isAr={isAr}
                        selectedSubIndex={
                          selectedBlock.type === 'hero_slider' || selectedBlock.type === 'hero'
                            ? heroSlideIndex
                            : selectedCategoryIndex
                        }
                        selectedSubKey={
                          selectedBlock.type === 'hero_slider' || selectedBlock.type === 'hero'
                            ? heroSubElement
                            : footerSubElement
                        }
                        onSelectSubIndex={(idx) => {
                          if (selectedBlock.type === 'hero_slider' || selectedBlock.type === 'hero') {
                            setHeroSlideIndex(idx ?? 0);
                          } else {
                            setSelectedCategoryIndex(idx);
                          }
                        }}
                        onSelectSubKey={(key) => {
                          if (selectedBlock.type === 'hero_slider' || selectedBlock.type === 'hero') {
                            setHeroSubElement(key as any);
                          } else {
                            setFooterSubElement(key);
                          }
                        }}
                      />
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

                  {/* Elementor Background Panel (Step 1 & Screenshot 2) */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-pink-600" />
                        <span>{isAr ? 'صورة وخلفية القسم (Elementor Style)' : 'Background (Classic / Custom X & Y)'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-pink-600 bg-pink-50 px-2 py-0.5 rounded font-bold">
                        Style Tab
                      </span>
                    </div>

                    {/* Background Type: Classic / Gradient / None */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'نوع الخلفية (Background Type)' : 'Background Type'}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'none', labelAr: 'بدون', labelEn: 'None' },
                          { id: 'classic', labelAr: 'كلاسيك (صورة)', labelEn: 'Classic (Image)' },
                          { id: 'gradient', labelAr: 'تدرج', labelEn: 'Gradient' },
                        ].map((bt) => {
                          const isAct = (selectedBlock.settings.bgType || 'none') === bt.id;
                          return (
                            <button
                              key={bt.id}
                              type="button"
                              onClick={() => handleUpdateBlockSetting('bgType', bt.id)}
                              className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer truncate ${
                                isAct
                                  ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {isAr ? bt.labelAr : bt.labelEn}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedBlock.settings.bgType === 'classic' && (
                      <div className="space-y-3 pt-1 border-t border-slate-100">
                        {/* Image URL & Quick Presets */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            {isAr ? 'رابط صورة الخلفية (Image URL > 1280px)' : 'Background Image URL'}
                          </label>
                          <input
                            type="text"
                            value={selectedBlock.settings.bgImage || ''}
                            onChange={(e) => handleUpdateBlockSetting('bgImage', e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                          />
                          <div className="flex gap-1.5 mt-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateBlockSetting(
                                  'bgImage',
                                  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=80'
                                )
                              }
                              className="text-[9px] font-bold text-pink-700 hover:text-pink-900 underline cursor-pointer"
                            >
                              {isAr ? 'استخدام صورة تجريبية (1600px)' : 'Use Demo 1600px Image'}
                            </button>
                            {selectedBlock.settings.bgImage && (
                              <button
                                type="button"
                                onClick={() => handleUpdateBlockSetting('bgImage', '')}
                                className="text-[9px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer ms-auto"
                              >
                                {isAr ? 'إزالة الصورة' : 'Clear'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Position (Center / Custom) */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            {isAr ? 'الموضع (Position)' : 'Position'}
                          </label>
                          <select
                            value={selectedBlock.settings.bgPosition || 'custom'}
                            onChange={(e) => handleUpdateBlockSetting('bgPosition', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                          >
                            <option value="custom">{isAr ? 'مخصص (Custom X & Y)' : 'Custom (X & Y)'}</option>
                            <option value="center">{isAr ? 'وسط (Center Center)' : 'Center Center'}</option>
                            <option value="top">{isAr ? 'أعلى (Top Center)' : 'Top Center'}</option>
                            <option value="bottom">{isAr ? 'أسفل (Bottom Center)' : 'Bottom Center'}</option>
                          </select>
                        </div>

                        {/* Custom X & Y Position sliders (Step 1: X 70px, Y 66px) */}
                        {selectedBlock.settings.bgPosition === 'custom' && (
                          <div className="p-2.5 rounded-xl bg-pink-50/50 border border-pink-200 space-y-2.5">
                            <div>
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 mb-1">
                                <span>{isAr ? 'موضع X الأفقي (X Position)' : 'X Position (px)'}</span>
                                <span className="font-mono text-pink-600 font-extrabold">{selectedBlock.settings.bgCustomX ?? 70}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="300"
                                step="2"
                                value={selectedBlock.settings.bgCustomX ?? 70}
                                onChange={(e) => handleUpdateBlockSetting('bgCustomX', Number(e.target.value))}
                                className="w-full accent-pink-600 cursor-pointer"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 mb-1">
                                <span>{isAr ? 'موضع Y الرأسي (Y Position)' : 'Y Position (px)'}</span>
                                <span className="font-mono text-pink-600 font-extrabold">{selectedBlock.settings.bgCustomY ?? 66}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="300"
                                step="2"
                                value={selectedBlock.settings.bgCustomY ?? 66}
                                onChange={(e) => handleUpdateBlockSetting('bgCustomY', Number(e.target.value))}
                                className="w-full accent-pink-600 cursor-pointer"
                              />
                            </div>
                          </div>
                        )}

                        {/* Repeat: No Repeat (Step 1) */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">
                              {isAr ? 'تكرار الصورة (Repeat)' : 'Repeat'}
                            </label>
                            <select
                              value={selectedBlock.settings.bgRepeat || 'no-repeat'}
                              onChange={(e) => handleUpdateBlockSetting('bgRepeat', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                            >
                              <option value="no-repeat">{isAr ? 'بدون تكرار (No repeat)' : 'No repeat'}</option>
                              <option value="repeat">{isAr ? 'تكرار (Repeat)' : 'Repeat'}</option>
                              <option value="repeat-x">Repeat-x</option>
                              <option value="repeat-y">Repeat-y</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">
                              {isAr ? 'حجم العرض (Display Size)' : 'Display Size'}
                            </label>
                            <select
                              value={selectedBlock.settings.bgSize || 'auto'}
                              onChange={(e) => handleUpdateBlockSetting('bgSize', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                            >
                              <option value="auto">{isAr ? 'تلقائي (Auto)' : 'Auto'}</option>
                              <option value="cover">{isAr ? 'تغطية (Cover)' : 'Cover'}</option>
                              <option value="contain">{isAr ? 'احتواء (Contain)' : 'Contain'}</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
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

              {/* TAB 4: LAYOUT (FULL ELEMENTOR GRID & FLEXBOX SYSTEM) */}
              {activeTab === 'layout' && (
                <div className="space-y-4">
                  {/* Content Width: Boxed vs Full Width (Step 1 & Screenshot 2) */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-900 text-xs">
                        {isAr ? 'عرض المحتوى (Content Width)' : 'Content Width'}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                        {selectedBlock.settings.contentWidth || 'boxed'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'boxed', labelAr: 'محدد (Boxed)', labelEn: 'Boxed' },
                        { id: 'full', labelAr: 'عرض كامل (Full Width)', labelEn: 'Full Width' },
                      ].map((cw) => {
                        const isAct = (selectedBlock.settings.contentWidth || 'boxed') === cw.id;
                        return (
                          <button
                            key={cw.id}
                            type="button"
                            onClick={() => handleUpdateBlockSetting('contentWidth', cw.id)}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isAct
                                ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isAr ? cw.labelAr : cw.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Columns Gap Presets (Step 2: "ensure column gaps are set to wide") */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-900 text-xs">
                        {isAr ? 'المسافة بين الأعمدة (Columns Gap)' : 'Columns Gap'}
                      </span>
                      <span className="font-mono text-pink-600 text-xs font-extrabold">
                        {selectedBlock.settings.columnGap ?? 16}px
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                      {[
                        { labelAr: 'بدون (0px)', labelEn: 'No Gap', val: 0 },
                        { labelAr: 'ضيق (8px)', labelEn: 'Narrow', val: 8 },
                        { labelAr: 'افتراضي (16px)', labelEn: 'Default', val: 16 },
                        { labelAr: 'ممتد (24px)', labelEn: 'Extended', val: 24 },
                        { labelAr: 'عريض (32px)', labelEn: 'Wide (32px)', val: 32 },
                        { labelAr: 'أعرض (48px)', labelEn: 'Wider (48px)', val: 48 },
                      ].map((gap) => {
                        const isCurrent = (selectedBlock.settings.columnGap ?? 16) === gap.val;
                        return (
                          <button
                            key={gap.val}
                            type="button"
                            onClick={() => {
                              handleUpdateBlockSetting('columnGap', gap.val);
                              if (selectedBlock.settings.gapLinked !== false) {
                                handleUpdateBlockSetting('rowGap', gap.val);
                              }
                            }}
                            className={`py-2 px-1 rounded-xl border transition-all cursor-pointer truncate ${
                              isCurrent
                                ? 'bg-pink-600 text-white border-pink-600 shadow-xs font-black'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isAr ? gap.labelAr : gap.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Elementor Structure Selector (Screenshot 3 & Step 2: 25, 25, 50) */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-pink-600" />
                        <span>{isAr ? 'هيكل وبنية الأعمدة (Structure)' : 'Structure (25, 25, 50)'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded">
                        {selectedBlock.settings.layoutColumns || '1'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: '3', labelAr: '33, 33, 33', labelEn: '33, 33, 33' },
                        { id: '25-25-50', labelAr: '25, 25, 50 (Featured)', labelEn: '25, 25, 50 (Featured)' },
                        { id: '50-25-25', labelAr: '50, 25, 25', labelEn: '50, 25, 25' },
                        { id: '25-50-25', labelAr: '25, 50, 25', labelEn: '25, 50, 25' },
                        { id: '16-66-16', labelAr: '16, 66, 16', labelEn: '16, 66, 16' },
                        { id: '4', labelAr: '25, 25, 25, 25', labelEn: '25, 25, 25, 25' },
                      ].map((st) => {
                        const isCurrent = (selectedBlock.settings.layoutColumns || '1') === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleUpdateBlockSetting('layoutColumns', st.id)}
                            className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer truncate ${
                              isCurrent
                                ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isAr ? st.labelAr : st.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grid Outline Toggle */}
                  <div className="border border-slate-200 rounded-2xl p-3.5 bg-white shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 text-xs block">
                        {isAr ? 'مخطط الشبكة التفاعلي (Grid Outline)' : 'Grid Outline'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {isAr ? 'إظهار حدود وأعمدة الـ Grid بوضوح' : 'Highlight container & column grid lines'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateBlockSetting('gridOutline', !selectedBlock.settings.gridOutline)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer shadow-xs ${
                        selectedBlock.settings.gridOutline
                          ? 'bg-pink-600 text-white ring-2 ring-pink-300'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {selectedBlock.settings.gridOutline ? 'SHOW' : 'HIDE'}
                    </button>
                  </div>

                  {/* Grid Columns Structure & Device Selector */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isAr ? 'تقسيم وبنية الأعمدة (Columns)' : 'Columns & Container Structure'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                        {selectedBlock.settings.layoutColumns || '1'} {isAr ? 'أعمدة' : 'cols'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-bold">
                      {[
                        { key: '1', labelAr: '١ عمود (١٠٠٪)', labelEn: '1 Col (100%)' },
                        { key: '2', labelAr: '٢ متساويان (٥٠/٥٠)', labelEn: '2 Cols (50/50)' },
                        { key: '3', labelAr: '٣ أعمدة (٣٣٪)', labelEn: '3 Cols (33%)' },
                        { key: '4', labelAr: '٤ أعمدة (٢٥٪)', labelEn: '4 Cols (25%)' },
                        { key: '5', labelAr: '٥ أعمدة (٢٠٪)', labelEn: '5 Cols (20%)' },
                        { key: '6', labelAr: '٦ أعمدة (١٦٪)', labelEn: '6 Cols (16%)' },
                        { key: '8', labelAr: '٨ أعمدة (١٢٪)', labelEn: '8 Cols (12%)' },
                        { key: '2-asym-left', labelAr: '٦٦٪ / ٣٣٪', labelEn: 'Asym-L (66/33)' },
                        { key: '2-asym-right', labelAr: '٣٣٪ / ٦٦٪', labelEn: 'Asym-R (33/66)' },
                        { key: 'bento', labelAr: 'بينتو (Bento)', labelEn: 'Bento Grid' },
                      ].map((col) => {
                        const isCurrent = (selectedBlock.settings.layoutColumns || '1') === col.key;
                        return (
                          <button
                            key={col.key}
                            type="button"
                            onClick={() => handleUpdateBlockSetting('layoutColumns', col.key)}
                            className={`py-2 px-1 rounded-xl border transition-all cursor-pointer truncate ${
                              isCurrent
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-black'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                            }`}
                          >
                            {isAr ? col.labelAr : col.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Elementor Rows & Flow Controls */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-black text-slate-900 text-xs">
                        {isAr ? 'الصفوف والتدفق التلقائي (Rows & Auto Flow)' : 'Rows & Auto Flow'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {selectedBlock.settings.gridRows || 1} fr
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          {isAr ? 'عدد الصفوف (Rows fr)' : 'Rows (fr)'}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          step="1"
                          value={selectedBlock.settings.gridRows || 1}
                          onChange={(e) => handleUpdateBlockSetting('gridRows', Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          {isAr ? 'التدفق التلقائي (Auto Flow)' : 'Auto Flow'}
                        </label>
                        <select
                          value={selectedBlock.settings.autoFlow || 'row'}
                          onChange={(e) => handleUpdateBlockSetting('autoFlow', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold bg-slate-50"
                        >
                          <option value="row">Row</option>
                          <option value="column">Column</option>
                          <option value="dense">Dense</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Elementor Gaps (Column & Row Gap + Link) */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-black text-slate-900 text-xs">
                        {isAr ? 'المسافات الفاصلة بين العناصر (Gaps px)' : 'Gaps (px)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateBlockSetting('gapLinked', !selectedBlock.settings.gapLinked)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          selectedBlock.settings.gapLinked !== false
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title={isAr ? 'ربط / فصل المسافات' : 'Link/Unlink Gaps'}
                      >
                        {selectedBlock.settings.gapLinked !== false ? (
                          <LinkIcon className="w-3.5 h-3.5" />
                        ) : (
                          <UnlinkIcon className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>{isAr ? 'مسافة الأعمدة (Column Gap)' : 'Column Gap'}</span>
                          <span className="font-mono text-indigo-600">{selectedBlock.settings.columnGap ?? 16}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="64"
                          step="2"
                          value={selectedBlock.settings.columnGap ?? 16}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleUpdateBlockSetting('columnGap', val);
                            if (selectedBlock.settings.gapLinked !== false) {
                              handleUpdateBlockSetting('rowGap', val);
                            }
                          }}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>{isAr ? 'مسافة الصفوف (Row Gap)' : 'Row Gap'}</span>
                          <span className="font-mono text-indigo-600">{selectedBlock.settings.rowGap ?? 16}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="64"
                          step="2"
                          value={selectedBlock.settings.rowGap ?? 16}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleUpdateBlockSetting('rowGap', val);
                            if (selectedBlock.settings.gapLinked !== false) {
                              handleUpdateBlockSetting('columnGap', val);
                            }
                          }}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Elementor Items Alignment & Justification (Screenshot 3) */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <span className="font-black text-slate-900 text-xs block border-b border-slate-100 pb-2">
                      {isAr ? 'المحاذاة وتوزيع العناصر (Justify & Align)' : 'Items Alignment & Distribution'}
                    </span>

                    {/* Justify Items */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                        <span>{isAr ? 'محاذاة العناصر أفقياً (Justify Items)' : 'Justify Items'}</span>
                        <span className="font-mono text-indigo-600 text-[9px]">{selectedBlock.settings.justifyItems || 'stretch'}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: 'start', label: 'Start', icon: AlignLeft },
                          { id: 'center', label: 'Center', icon: AlignCenter },
                          { id: 'end', label: 'End', icon: AlignRight },
                          { id: 'stretch', label: 'Stretch', icon: AlignJustify },
                        ].map((btn) => {
                          const isAct = (selectedBlock.settings.justifyItems || 'stretch') === btn.id;
                          const BIcon = btn.icon;
                          return (
                            <button
                              key={btn.id}
                              type="button"
                              onClick={() => handleUpdateBlockSetting('justifyItems', btn.id)}
                              className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                isAct ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <BIcon className="w-3 h-3" />
                              <span>{btn.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Align Items */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                        <span>{isAr ? 'محاذاة العناصر عمودياً (Align Items)' : 'Align Items'}</span>
                        <span className="font-mono text-indigo-600 text-[9px]">{selectedBlock.settings.alignItems || 'stretch'}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: 'start', label: 'Top' },
                          { id: 'center', label: 'Middle' },
                          { id: 'end', label: 'Bottom' },
                          { id: 'stretch', label: 'Stretch' },
                        ].map((btn) => {
                          const isAct = (selectedBlock.settings.alignItems || 'stretch') === btn.id;
                          return (
                            <button
                              key={btn.id}
                              type="button"
                              onClick={() => handleUpdateBlockSetting('alignItems', btn.id)}
                              className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                                isAct ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{btn.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Justify Content */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                        <span>{isAr ? 'توزيع المحتوى (Justify Content)' : 'Justify Content'}</span>
                        <span className="font-mono text-indigo-600 text-[9px]">{selectedBlock.settings.justifyContent || 'start'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'start', label: 'Start' },
                          { id: 'center', label: 'Center' },
                          { id: 'end', label: 'End' },
                          { id: 'space-between', label: 'Between' },
                          { id: 'space-around', label: 'Around' },
                          { id: 'space-evenly', label: 'Evenly' },
                        ].map((btn) => {
                          const isAct = (selectedBlock.settings.justifyContent || 'start') === btn.id;
                          return (
                            <button
                              key={btn.id}
                              type="button"
                              onClick={() => handleUpdateBlockSetting('justifyContent', btn.id)}
                              className={`py-1 px-1.5 rounded-lg border text-[9px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                                isAct ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{btn.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Pixel Responsive Spacing (Padding & Margins) */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-black text-slate-900 text-xs">
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
                </>
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
        </>
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
          MOBILE BOTTOM ACTION BAR (Touch-first for Mobile/Tablet)
          ======================================================== */}
      {screenSize.isMobile && !previewModeOnly && (
        <div className="fixed bottom-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-3 flex items-center justify-between shadow-xl lg:hidden">
          {/* Toggle Blocks Sheet */}
          <button
            type="button"
            onClick={() => {
              setLeftSidebarVisible(!leftSidebarVisible);
              setRightSidebarVisible(false);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold cursor-pointer transition-colors ${
              leftSidebarVisible ? 'text-indigo-600 font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isAr ? 'الأقسام' : 'Blocks'}</span>
          </button>

          {/* Toggle Inspector Sheet */}
          <button
            type="button"
            onClick={() => {
              setRightSidebarVisible(!rightSidebarVisible);
              setLeftSidebarVisible(false);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold cursor-pointer transition-colors ${
              rightSidebarVisible ? 'text-indigo-600 font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isAr ? 'المفتش' : 'Inspector'}</span>
          </button>

          {/* Device Switcher Quick Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-0.5">
            {[
              { mode: 'mobile' as DeviceMode, icon: <Smartphone className="w-3.5 h-3.5" />, title: 'Mobile' },
              { mode: 'tablet' as DeviceMode, icon: <Tablet className="w-3.5 h-3.5" />, title: 'Tablet' },
              { mode: 'desktop' as DeviceMode, icon: <Monitor className="w-3.5 h-3.5" />, title: 'Desktop' },
            ].map((d) => (
              <button
                key={d.mode}
                type="button"
                onClick={() => setDevice(d.mode)}
                className={`p-1 rounded-md cursor-pointer transition-all ${
                  device === d.mode
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={d.title}
              >
                {d.icon}
              </button>
            ))}
          </div>

          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 text-slate-600 disabled:opacity-20 cursor-pointer"
            title={isAr ? 'تراجع' : 'Undo'}
          >
            <Undo2 className="w-4 h-4 rtl:-scale-x-100" />
          </button>

          {/* Quick Publish Live */}
          <button
            type="button"
            onClick={handlePublishLive}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-200 cursor-pointer active:scale-95 transition-transform"
          >
            <Send className="w-3.5 h-3.5 rtl:-scale-x-100" />
            <span>{isAr ? 'نشر' : 'Publish'}</span>
          </button>
        </div>
      )}

      {/* ========================================================
          3. ADD SECTION MODAL
          ======================================================== */}
      <BuilderAddSectionModal
        isOpen={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        onAddSection={handleAddNewSection}
        isAr={isAr}
        supportedSections={activeThemeManifest?.supportedSections}
        storeCategory={activeStore.category}
        themeName={isAr ? activeThemeManifest?.nameAr : activeThemeManifest?.name}
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

      {/* ========================================================
          7. COLUMN WIDGET PICKER MODAL (Elementor Pro Column Module (+)
          ======================================================== */}
      {columnPickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  +
                </span>
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block">
                    {isAr
                      ? `إدراج عنصر في العمود رقم (${columnPickerTarget.colIdx + 1})`
                      : `Insert Module in Column #${columnPickerTarget.colIdx + 1}`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {isAr ? 'اختر الويدجت المطلوب إضافته داخل هذا العمود مباشرة' : 'Choose a module to drop into this column'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setColumnPickerTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto p-1">
              {/* Step 3 Module 1: Counter Number Label 82px */}
              <button
                type="button"
                onClick={() =>
                  handleAddWidgetToColumn(
                    columnPickerTarget.blockId,
                    columnPickerTarget.colIdx,
                    'counter_label',
                    String(columnPickerTarget.colIdx + 1),
                    { text: String(columnPickerTarget.colIdx + 1), fontSize: 82 }
                  )
                }
                className="p-3 rounded-2xl border-2 border-slate-200 hover:border-pink-500 hover:bg-pink-50/20 text-start flex flex-col gap-1 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-pink-600 group-hover:scale-110 transition-transform">
                    {columnPickerTarget.colIdx + 1}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-100 text-pink-700">82px</span>
                </div>
                <span className="text-xs font-black text-slate-800">
                  {isAr ? 'رقم تسلسلي كبير (Number 82px)' : 'Counter Number (82px)'}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {isAr ? 'رقم الترتيب المخصص 82px كما في الخطوة ٣' : 'Huge 82px counter label as per tutorial Step 3'}
                </span>
              </button>

              {/* Step 3 Module 2: Heading H3 */}
              <button
                type="button"
                onClick={() =>
                  handleAddWidgetToColumn(
                    columnPickerTarget.blockId,
                    columnPickerTarget.colIdx,
                    'heading',
                    'Featured Category',
                    { text: isAr ? 'تصنيف المقال المميز' : 'Featured Category', htmlTag: 'h3' }
                  )
                }
                className="p-3 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 text-start flex flex-col gap-1 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <Type className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">H3 Tag</span>
                </div>
                <span className="text-xs font-black text-slate-800">
                  {isAr ? 'عنوان التصنيف (Heading H3)' : 'Category Heading (H3)'}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {isAr ? 'عنوان رئيسي للتصنيف بوسم H3' : 'Section / category heading with H3 tag'}
                </span>
              </button>

              {/* Step 3 Module 3: Typer Articles */}
              <button
                type="button"
                onClick={() =>
                  handleAddWidgetToColumn(
                    columnPickerTarget.blockId,
                    columnPickerTarget.colIdx,
                    'featured_posts',
                    'Typer Articles',
                    { postSource: 'latest', maxPosts: 2, showImage: true, showMeta: true, showTag: true }
                  )
                }
                className="p-3 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-start flex flex-col gap-1 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <BookOpen className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Articles</span>
                </div>
                <span className="text-xs font-black text-slate-800">
                  {isAr ? 'مقالات Typer Articles' : 'Typer Articles Module'}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {isAr ? 'أحدث أو أشهر المقالات مع الصور وبيانات الميتا' : 'Latest or Most Liked articles with thumbnails & meta'}
                </span>
              </button>

              {/* General Text */}
              <button
                type="button"
                onClick={() =>
                  handleAddWidgetToColumn(
                    columnPickerTarget.blockId,
                    columnPickerTarget.colIdx,
                    'text_editor',
                    'Text Editor',
                    { content: isAr ? 'أدخل النص التوضيحي هنا...' : 'Enter your column paragraph here...' }
                  )
                }
                className="p-3 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/20 text-start flex flex-col gap-1 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <FileText className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Text</span>
                </div>
                <span className="text-xs font-black text-slate-800">
                  {isAr ? 'محرر نصوص (Text Editor)' : 'Text Editor Module'}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {isAr ? 'فقرة نصية حرة قابلة للتعديل' : 'Rich paragraph block'}
                </span>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setColumnPickerTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Close'}
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
      <CoffeeCartProvider>
        <VisualThemeBuilderInner {...props} />
      </CoffeeCartProvider>
    </AppProvider>
  );
};

