import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Wand2,
  Palette,
  Type,
  Check,
  X,
  Clock,
  Lock,
  Download,
  Save,
  RefreshCw,
  Sliders,
  Tag,
  Image as ImageIcon,
  Zap,
  ShieldCheck,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Copy,
  Move,
  Maximize2,
  Sun,
  Moon,
  Flame,
  Star,
  Award,
  Truck,
  Upload,
  Search,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Share2,
  CalendarClock,
  Phone,
  Heart,
  ShoppingBag,
  Send,
  ChevronDown,
  CheckCircle2,
  Square,
  Circle,
  Triangle,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  LockKeyhole,
  Unlock,
  Package,
  FolderKanban,
  Compass,
  ArrowRight,
  Sparkle,
  GripVertical,
  Eye,
  EyeOff,
  BringToFront,
  SendToBack,
  ArrowUp,
  ArrowDown,
  PanelLeft,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import type { MediaAsset } from '../../types/media';
import {
  getStudioQuota,
  type StudioQuotaState,
} from '../../services/ksaAutomationEngine';
import {
  CANVA_FONT_FAMILIES,
  getDefaultBlankTemplate,
  resolveCanvaLayerLabel,
  type CanvaDesignTemplate,
  type CanvaTemplateCategory,
  type CanvaTemplateElement,
} from '../../data/ksaCanvaTemplates';
import {
  CANVA_UPLOAD_CATEGORIES,
  importDesignFile,
  type ImportedStudioDesign,
  type ImportedStudioLayer,
} from '../../services/canvaPsdImport';
import {
  deleteMyCanvaTemplate,
  listMyCanvaTemplates,
  myTemplateToDesignPayload,
  saveMyCanvaTemplate,
  type CanvaMyTemplate,
} from '../../services/canvaMyTemplates';
import { saveStudioDesign, type StudioEditorType } from '../../services/storeStudioDesigns';
import { isApiEnabled } from '../../api/client';
import {
  ensureReadableTextStyle,
  resolveCanvasApproxColor,
} from '../../services/canvaTextContrast';
import {
  estimateElementBounds,
  rectContainsPoint,
  rectToPercentStyle,
  type StudioRect,
} from '../../services/canvaElementBounds';
import { CanvaTemplatesPanel } from './CanvaTemplatesPanel';
import { CanvaSocialPostModal } from './CanvaSocialPostModal';
import '../../styles/canva-studio-light.css';

export type CanvaEditorKind = 'banner' | 'logo' | 'product_card';

export interface CanvaImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** modal = overlay from Media Library; page = full store tab workspace */
  variant?: 'modal' | 'page';
  /** Dedicated banner / logo / product-card editor screen */
  editorKind?: CanvaEditorKind;
  lockCategory?: boolean;
  initialAsset?: MediaAsset | null;
  onSaveNewAsset: (dataUrl: string, title: string, width: number, height: number) => void;
  onReplaceAsset?: (assetId: string, dataUrl: string, width: number, height: number) => void;
  onOpenSocialHub?: () => void;
}

// Draggable & Resizable Element on canvas
export interface CanvasElement {
  id: string;
  type:
    | 'headline'
    | 'subtitle'
    | 'price'
    | 'badge'
    | 'custom_text'
    | 'sticker'
    | 'watermark'
    | 'shape'
    | 'icon'
    | 'image';
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  fontSize: number;
  fontColor: string;
  bgColor?: string;
  bgPadding?: number;
  borderRadius?: number;
  isBold?: boolean;
  isItalic?: boolean;
  /** light → black; preferred over isBold when set */
  fontWeight?: 'light' | 'regular' | 'medium' | 'bold' | 'black';
  underline?: boolean;
  strikethrough?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  badgeStyle?: 'pill' | 'solid' | 'gold_glow' | 'emerald_glow' | 'outline';
  icon?: string;
  fontFamily?: string;
  // Shape & decorative styling
  shapeType?: 'circle' | 'rectangle' | 'triangle' | 'star' | 'badge' | 'dot_grid' | 'wave_curve' | 'line';
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  imageUrl?: string;
  locked?: boolean;
  /** Text / image drop shadow (on design, not UI chrome) */
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  flipH?: boolean;
  flipV?: boolean;
  hidden?: boolean;
  /** Letter spacing in px (Canva Spacing → Letter) */
  letterSpacing?: number;
  /** Line height multiplier (Canva Spacing → Line Height), default 1.35 */
  lineHeight?: number;
  /** Vertical align inside text box */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** Optional image crop inset (0–0.45 each side) */
  cropInset?: { top: number; right: number; bottom: number; left: number };
}

// History snapshot for Undo / Redo
interface StudioHistorySnapshot {
  elements: CanvasElement[];
  productPos: { x: number; y: number; scale: number };
  selectedBackdrop: string;
  customSolidColor: string;
  bgRemoved: boolean;
  bgTolerance: number;
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
  };
}

const STUDIO_BACKDROPS = [
  { id: 'original', labelEn: 'Original BG', labelAr: 'الخلفية الأصلية', css: 'transparent', hex1: '', hex2: '' },
  { id: 'transparent', labelEn: 'Transparent (PNG)', labelAr: 'شفاف بدون خلفية', css: 'checker', hex1: '', hex2: '' },
  { id: 'pure-white', labelEn: 'Pure Clean White', labelAr: 'أبيض ناصع', css: '#ffffff', hex1: '#ffffff', hex2: '#f8fafc' },
  { id: 'soft-ivory', labelEn: 'Soft Ivory Studio', labelAr: 'عاجي ناعم', css: 'linear-gradient(145deg, #faf8f5, #ebe4da)', hex1: '#faf8f5', hex2: '#ebe4da' },
  { id: 'coffee-cream', labelEn: 'Warm Cream', labelAr: 'كريمي دافئ', css: 'linear-gradient(160deg, #f7f1e8, #e8d5b7)', hex1: '#f7f1e8', hex2: '#e8d5b7' },
  { id: 'espresso-lux', labelEn: 'Espresso Soft Luxury', labelAr: 'إسبريسو فاخر ناعم', css: 'linear-gradient(160deg, #2a170e, #8b5a2b)', hex1: '#2a170e', hex2: '#8b5a2b' },
  { id: 'floral-blush', labelEn: 'Floral Blush', labelAr: 'وردي زهري', css: 'linear-gradient(160deg, #fff5f7, #f9a8d4)', hex1: '#fff5f7', hex2: '#f9a8d4' },
  { id: 'petal-ivory', labelEn: 'Petal Ivory', labelAr: 'بتلة عاجية', css: 'linear-gradient(160deg, #fffaf8, #fce7f3)', hex1: '#fffaf8', hex2: '#fce7f3' },
  { id: 'sage-mist', labelEn: 'Sage Mist', labelAr: 'ضباب المريمية', css: 'linear-gradient(145deg, #f4f7f4, #c5d5c8)', hex1: '#f4f7f4', hex2: '#c5d5c8' },
  { id: 'ksa-emerald', labelEn: 'Saudi Royal Emerald', labelAr: 'زمردي ملكي سعودي', css: 'linear-gradient(135deg, #022c22, #059669)', hex1: '#022c22', hex2: '#059669' },
  { id: 'royal-gold', labelEn: 'Riyadh Luxury Gold', labelAr: 'ذهبي الرياض الفاخر', css: 'linear-gradient(135deg, #1c1917, #b45309)', hex1: '#1c1917', hex2: '#b45309' },
  { id: 'desert-sand', labelEn: 'AlUla Desert Warm', labelAr: 'رمال العلا الدافئة', css: 'linear-gradient(135deg, #451a03, #d97706)', hex1: '#451a03', hex2: '#d97706' },
  { id: 'velvet-rose', labelEn: 'Velvet Crimson', labelAr: 'وردي مخملي أنيق', css: 'linear-gradient(135deg, #4c0519, #e11d48)', hex1: '#4c0519', hex2: '#e11d48' },
  { id: 'ocean-blue', labelEn: 'Red Sea Deep Blue', labelAr: 'أزرق البحر الأحمر', css: 'linear-gradient(135deg, #082f49, #0284c7)', hex1: '#082f49', hex2: '#0284c7' },
  { id: 'obsidian', labelEn: 'Midnight Studio', labelAr: 'استوديو ليلي', css: 'linear-gradient(135deg, #090d16, #1e293b)', hex1: '#090d16', hex2: '#1e293b' },
];

const PRESET_BADGES = [
  { textEn: '50% OFF', textAr: 'خصم 50%', color: '#e11d48', style: 'pill' as const },
  { textEn: '30% OFF', textAr: 'خصم 30%', color: '#ea580c', style: 'pill' as const },
  { textEn: 'BEST SELLER', textAr: 'الأكثر مبيعاً', color: '#b45309', style: 'gold_glow' as const },
  { textEn: 'SAUDI MADE', textAr: 'صنع في السعودية', color: '#059669', style: 'emerald_glow' as const },
  { textEn: 'LIMITED OFFER', textAr: 'عرض محدود', color: '#7c3aed', style: 'pill' as const },
  { textEn: 'NEW ARRIVAL', textAr: 'وصل حديثاً', color: '#0d9488', style: 'pill' as const },
  { textEn: 'FREE DELIVERY', textAr: 'توصيل مجاني', color: '#2563eb', style: 'solid' as const },
];

const QUICK_ICONS = [
  { id: 'phone', labelEn: 'Phone Call', labelAr: 'هاتف وتواصل', glyph: '📞' },
  { id: 'star', labelEn: '5-Star Rating', labelAr: 'نجمة تقييم', glyph: '⭐' },
  { id: 'coffee', labelEn: 'Cup', labelAr: 'كوب', glyph: '☕' },
  { id: 'shopping-bag', labelEn: 'Bag', labelAr: 'حقيبة', glyph: '🛍️' },
  { id: 'heart', labelEn: 'Heart', labelAr: 'قلب', glyph: '❤️' },
  { id: 'flame', labelEn: 'Fire', labelAr: 'نار', glyph: '🔥' },
  { id: 'shield-check', labelEn: 'Shield', labelAr: 'درع', glyph: '🛡️' },
  { id: 'truck', labelEn: 'Truck', labelAr: 'شاحنة', glyph: '🚚' },
  { id: 'tag', labelEn: 'Tag', labelAr: 'وسم', glyph: '🏷️' },
  { id: 'sparkles', labelEn: 'Sparkles', labelAr: 'بريق', glyph: '✨' },
  { id: 'check', labelEn: 'Verified Check', labelAr: 'علامة توثيق', glyph: '✅' },
  { id: 'zap', labelEn: 'Fast Flash', labelAr: 'برق فوري', glyph: '⚡' },
  { id: 'whatsapp', labelEn: 'WhatsApp', labelAr: 'واتساب', glyph: '💬' },
];

const QUICK_KSA_TEXTS = [
  { textEn: 'Special Offer · Limited Stock', textAr: 'عرض خاص · الكمية محدودة جداً' },
  { textEn: 'Same-Day Delivery in Riyadh', textAr: 'توصيل خلال ٢٤ ساعة في الرياض' },
  { textEn: 'Cash on Delivery Available', textAr: 'الدفع عند الاستلام متاح لجميع المدن' },
  { textEn: '2-Year Official Saudi Warranty', textAr: 'ضمان رسمي سنتين في المملكة' },
  { textEn: 'Order Now via WhatsApp', textAr: 'اطلب الآن بسهولة عبر واتساب' },
  { textEn: '100% Original Guaranteed', textAr: 'منتج أصلي ١٠٠٪ ومفحوص مخبرياً' },
];

export const CanvaImageStudioModal: React.FC<CanvaImageStudioModalProps> = ({
  isOpen,
  onClose,
  variant = 'modal',
  editorKind,
  lockCategory = false,
  initialAsset = null,
  onSaveNewAsset,
  onReplaceAsset,
  onOpenSocialHub,
}) => {
  const { activeStore, currentProducts, currentMedia } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const layoutCacheRef = useRef<Record<string, StudioRect>>({});
  const productBoundsRef = useRef<StudioRect | null>(null);

  // Document Title (Canva style: editable at top)
  const [docTitle, setDocTitle] = useState('Untitled Design');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  /** True only after real Save to Media — never pretend "cloud saved" */
  const [savedToMediaLibrary, setSavedToMediaLibrary] = useState(false);

  // Loaded Product/Subject Image
  const [activeImageUrl, setActiveImageUrl] = useState<string>('');
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<
    | 'templates'
    | 'elements'
    | 'text'
    | 'layers'
    | 'store_assets'
    | 'colors'
    | 'media'
    | 'filters'
    | 'bg_remove'
  >('templates');
  /** Canva Position panel: Arrange vs Layers */
  const [layersSubTab, setLayersSubTab] = useState<'arrange' | 'layers'>('layers');
  /** Canva Layers filter: All vs Overlapping */
  const [layersFilter, setLayersFilter] = useState<'all' | 'overlapping'>('all');
  const [layerDragId, setLayerDragId] = useState<string | null>(null);
  const [showSpacingPopover, setShowSpacingPopover] = useState(false);

  // Quota & Timer State
  const [quota, setQuota] = useState<StudioQuotaState>(() => getStudioQuota(activeStore.id));
  const [slotCountdownText, setSlotCountdownText] = useState<string>('');

  // Canvas export size
  const [canvasW, setCanvasW] = useState(1080);
  const [canvasH, setCanvasH] = useState(1080);
  const [showResizeMenu, setShowResizeMenu] = useState(false);

  // Studio Lighting & Backdrop Presets (light luxury default — not heavy dark navy)
  const [selectedBackdrop, setSelectedBackdrop] = useState<string>('soft-ivory');
  const [customSolidColor, setCustomSolidColor] = useState('#faf8f5');

  // Custom Gradient Controls
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientAngle, setGradientAngle] = useState(145);
  const [gradientColor1, setGradientColor1] = useState('#faf8f5');
  const [gradientColor2, setGradientColor2] = useState('#ebe4da');
  const [gradientColor3, setGradientColor3] = useState('#e8d5b7');

  // Product Placement & Scale on Canvas
  const [productScale, setProductScale] = useState(0);
  const [productPosX, setProductPosX] = useState(540);
  const [productPosY, setProductPosY] = useState(540);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // 1-Click AI Background Removal
  const [bgRemoved, setBgRemoved] = useState(false);
  const [bgTolerance, setBgTolerance] = useState(38);
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Filters & Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blurAmount, setBlurAmount] = useState(0);

  // Interactive Elements List
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [isDraggingProduct, setIsDraggingProduct] = useState(false);
  const [productHeroSelected, setProductHeroSelected] = useState(false);
  const [isResizingProduct, setIsResizingProduct] = useState(false);
  const [isResizingElement, setIsResizingElement] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [viewZoom, setViewZoom] = useState(1);
  const [layoutEpoch, setLayoutEpoch] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialResizeState, setInitialResizeState] = useState<{
    startX: number;
    startY: number;
    elW: number;
    elH: number;
    fontSize: number;
    productScale?: number;
  }>({ startX: 0, startY: 0, elW: 0, elH: 0, fontSize: 24 });

  // Social Post & Publish Modal
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialExportDataUrl, setSocialExportDataUrl] = useState('');

  // Selected Template ID — blank by default (no consulting clutter)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>('blank-square');

  // PSD / image design upload → layers + My Templates (store_id)
  const [uploadCategory, setUploadCategory] = useState<CanvaTemplateCategory>('banner');
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [isImportingDesign, setIsImportingDesign] = useState(false);
  const [myTemplates, setMyTemplates] = useState<CanvaMyTemplate[]>([]);
  const [lastImported, setLastImported] = useState<ImportedStudioDesign | null>(null);
  const designFileInputRef = useRef<HTMLInputElement | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<StudioHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyIndexRef = useRef(0);

  const [flyoutOpen, setFlyoutOpen] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  );

  // Helper: Get candidate URL — store assets only, never another niche sample
  const resolveCandidateUrl = useCallback((asset?: MediaAsset | null): string => {
    if (!asset) {
      return currentProducts[0]?.image || activeStore.logo || '';
    }
    return (
      asset.originalUrl ||
      asset.webpUrl ||
      asset.thumbnailUrl ||
      asset.optimizedUrl ||
      currentProducts[0]?.image ||
      activeStore.logo ||
      ''
    );
  }, [currentProducts, activeStore.logo]);

  // Load Image — empty stays empty (no cross-tenant / coffee sample fallback)
  const loadStudioImage = useCallback((candidateUrl: string) => {
    if (!candidateUrl) {
      setLoadedImg(null);
      setActiveImageUrl('');
      setImageLoading(false);
      return;
    }
    setImageLoading(true);
    setActiveImageUrl(candidateUrl);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImg(img);
      setImageLoading(false);
    };
    img.onerror = () => {
      setLoadedImg(null);
      setImageLoading(false);
    };
    img.src = candidateUrl;
  }, []);

  // Countdown timer for next daily allowance slot
  useEffect(() => {
    const updateCountdown = () => {
      const q = getStudioQuota(activeStore.id);
      setQuota(q);
      const now = new Date();
      const nextTime = new Date(q.nextSlotUnlockTime);
      const diffMs = nextTime.getTime() - now.getTime();
      if (diffMs > 0) {
        const h = Math.floor(diffMs / (1000 * 60 * 60));
        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diffMs % (1000 * 60)) / 1000);
        setSlotCountdownText(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        );
      } else {
        setSlotCountdownText('00:00:00');
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activeStore.id]);

  useEffect(() => {
    if (!isOpen || !editorKind) return;
    if (editorKind === 'banner') {
      setUploadCategory('banner');
      setCanvasW(1600);
      setCanvasH(600);
      setDocTitle(isAr ? 'بانر المتجر' : 'Store Banner');
      setSelectedBackdrop('pure-white');
    } else if (editorKind === 'logo') {
      setUploadCategory('logo');
      setCanvasW(800);
      setCanvasH(800);
      setDocTitle(isAr ? 'شعار المتجر' : 'Store Logo');
      setSelectedBackdrop('transparent');
    } else if (editorKind === 'product_card') {
      setUploadCategory('product');
      setCanvasW(1080);
      setCanvasH(1080);
      setDocTitle(isAr ? 'بطاقة منتج' : 'Product Card');
      setSelectedBackdrop('soft-ivory');
    }
    setSavedDesignId(null);
  }, [isOpen, editorKind, isAr]);

  // Initialize on open:
  // - Media Library asset → single full-canvas editable image layer (Canva-like, no niche text overlap)
  // - Blank / dedicated editor → blank or niche starter only when no asset
  useEffect(() => {
    if (!isOpen) return;

    const initialUrl = resolveCandidateUrl(initialAsset);

    // Media image / PNG → open as editable layer design (same path as importImageAsDesign)
    if (initialAsset && initialUrl) {
      const name =
        (initialAsset.title || initialAsset.fileName || '').replace(/\.[^.]+$/, '') ||
        (isAr ? 'تصميم الوسائط' : 'Media Design');
      const assetKey = initialAsset.id || String(Date.now());

      const applyMediaLayer = (w0: number, h0: number) => {
        const w = Math.max(1, w0);
        const h = Math.max(1, h0);
        const layer: CanvasElement = {
          id: `img-media-${assetKey}`,
          type: 'image',
          text: name,
          imageUrl: initialUrl,
          x: Math.round(w / 2),
          y: Math.round(h / 2),
          width: w,
          height: h,
          fontSize: 16,
          fontColor: '#0f172a',
          borderRadius: 0,
          opacity: 1,
        };

        // Do NOT load as product hero — that stacked niche text + product on the same image (overlap / dead clicks)
        setLoadedImg(null);
        setActiveImageUrl('');
        setImageLoading(false);
        setProductScale(0);
        setProductPosX(Math.round(w / 2));
        setProductPosY(Math.round(h / 2));
        setProductHeroSelected(false);
        setCanvasW(w);
        setCanvasH(h);
        setSelectedBackdrop('transparent');
        setCustomSolidColor('#ffffff');
        setElements([layer]);
        setSelectedElementId(layer.id);
        setSelectedTemplateId(`media-${assetKey}`);
        setDocTitle(name);
        setActiveTab('layers');
        setLayersSubTab('layers');
        setViewZoom(1);

        const probe = new Image();
        probe.crossOrigin = 'anonymous';
        probe.onload = () => {
          imageCacheRef.current[initialUrl] = probe;
          setElements((prev) => [...prev]);
        };
        probe.src = initialUrl;
        imageCacheRef.current[initialUrl] = probe;

        setHistory([
          {
            elements: [layer],
            productPos: { x: Math.round(w / 2), y: Math.round(h / 2), scale: 0 },
            selectedBackdrop: 'transparent',
            customSolidColor: '#ffffff',
            bgRemoved: false,
            bgTolerance: 38,
            filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
          },
        ]);
        historyIndexRef.current = 0;
        setHistoryIndex(0);
      };

      const knownW = initialAsset.width || 0;
      const knownH = initialAsset.height || 0;
      if (knownW > 0 && knownH > 0) {
        applyMediaLayer(knownW, knownH);
        return;
      }

      setImageLoading(true);
      const dimProbe = new Image();
      dimProbe.onload = () => {
        applyMediaLayer(dimProbe.naturalWidth || 1080, dimProbe.naturalHeight || 1080);
        setImageLoading(false);
      };
      dimProbe.onerror = () => {
        applyMediaLayer(1080, 1080);
        setImageLoading(false);
      };
      dimProbe.src = initialUrl;
      return;
    }

    loadStudioImage(initialUrl);

    const starter = getDefaultBlankTemplate('square');

    const mapped: CanvasElement[] = starter.elements.map((layer, idx) => ({
      id: `el-${Date.now()}-${idx}`,
      type: layer.type,
      text: (isAr ? layer.textAr || layer.textEn : layer.textEn) || '',
      x: Math.round(layer.xPct * starter.width),
      y: Math.round(layer.yPct * starter.height),
      width: layer.widthPct ? Math.round(layer.widthPct * starter.width) : 120,
      height: layer.heightPct ? Math.round(layer.heightPct * starter.height) : 120,
      fontSize: layer.fontSize || 24,
      fontColor: layer.fontColor || '#0f172a',
      bgColor: layer.bgColor || 'transparent',
      bgPadding: layer.bgPadding ?? 14,
      borderRadius: layer.borderRadius ?? 16,
      isBold: layer.isBold ?? true,
      isItalic: layer.isItalic ?? false,
      textAlign: layer.textAlign || 'center',
      badgeStyle: layer.badgeStyle,
      fontFamily: layer.fontFamily || (isAr ? 'Tajawal' : 'Outfit'),
      shapeType: layer.shapeType,
      strokeColor: layer.strokeColor,
      strokeWidth: layer.strokeWidth,
      opacity: layer.opacity,
      icon: layer.icon,
      imageUrl: layer.imageUrl,
    }));

    const px = Math.round(starter.productPosPct.x * starter.width);
    const py = Math.round(starter.productPosPct.y * starter.height);

    setCanvasW(starter.width);
    setCanvasH(starter.height);
    setSelectedBackdrop(starter.backdropId || 'soft-ivory');
    setCustomSolidColor(starter.customSolidColor || '#faf8f5');
    setProductPosX(px);
    setProductPosY(py);
    setProductScale(0);
    setElements(mapped);
    setSelectedElementId(mapped[0]?.id || null);
    setSelectedTemplateId(starter.id);
    setDocTitle(
      isAr
        ? starter.nameAr
        : starter.niche === 'blank'
          ? 'Untitled Design'
          : starter.nameEn,
    );

    setHistory([
      {
        elements: mapped,
        productPos: { x: px, y: py, scale: 0 },
        selectedBackdrop: starter.backdropId || 'soft-ivory',
        customSolidColor: starter.customSolidColor || '#faf8f5',
        bgRemoved: false,
        bgTolerance: 38,
        filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
      },
    ]);
    historyIndexRef.current = 0;
    setHistoryIndex(0);
  }, [isOpen, initialAsset, resolveCandidateUrl, loadStudioImage, isAr]);

  // Snapshot State for Undo / Redo
  const pushHistorySnapshot = useCallback(
    (overrideElements?: CanvasElement[]) => {
      const snap: StudioHistorySnapshot = {
        elements: JSON.parse(JSON.stringify(overrideElements ?? elements)),
        productPos: { x: productPosX, y: productPosY, scale: productScale },
        selectedBackdrop,
        customSolidColor,
        bgRemoved,
        bgTolerance,
        filters: { brightness, contrast, saturation, blur: blurAmount },
      };
      setSavedToMediaLibrary(false);
      setHistory((prev) => {
        const idx = historyIndexRef.current;
        const next = [...prev.slice(0, idx + 1), snap].slice(-40);
        historyIndexRef.current = next.length - 1;
        setHistoryIndex(next.length - 1);
        return next;
      });
    },
    [
      elements,
      productPosX,
      productPosY,
      productScale,
      selectedBackdrop,
      customSolidColor,
      bgRemoved,
      bgTolerance,
      brightness,
      contrast,
      saturation,
      blurAmount,
    ],
  );

  const applyHistorySnap = useCallback((snap: StudioHistorySnapshot) => {
    setElements(JSON.parse(JSON.stringify(snap.elements)));
    setProductPosX(snap.productPos.x);
    setProductPosY(snap.productPos.y);
    setProductScale(snap.productPos.scale);
    setSelectedBackdrop(snap.selectedBackdrop);
    setCustomSolidColor(snap.customSolidColor);
    setBgRemoved(snap.bgRemoved);
    setBgTolerance(snap.bgTolerance);
    setBrightness(snap.filters.brightness);
    setContrast(snap.filters.contrast);
    setSaturation(snap.filters.saturation);
    setBlurAmount(snap.filters.blur);
  }, []);

  // Undo Handler
  const handleUndo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    const nextIdx = idx - 1;
    const snap = history[nextIdx];
    if (!snap) return;
    applyHistorySnap(snap);
    historyIndexRef.current = nextIdx;
    setHistoryIndex(nextIdx);
  }, [history, applyHistorySnap]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx >= history.length - 1) return;
    const nextIdx = idx + 1;
    const snap = history[nextIdx];
    if (!snap) return;
    applyHistorySnap(snap);
    historyIndexRef.current = nextIdx;
    setHistoryIndex(nextIdx);
  }, [history, applyHistorySnap]);

  // Keyboard Undo / Redo
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleUndo, handleRedo]);

  // Main Canvas Rendering Engine
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvasW;
    const H = canvasH;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);
    layoutCacheRef.current = {};
    productBoundsRef.current = null;

    // 1. Draw Selected Backdrop Preset / Gradient / Solid Color
    const preset = STUDIO_BACKDROPS.find((b) => b.id === selectedBackdrop);
    if (selectedBackdrop === 'custom') {
      ctx.fillStyle = customSolidColor;
      ctx.fillRect(0, 0, W, H);
    } else if (selectedBackdrop === 'custom_gradient') {
      let grad: CanvasGradient;
      if (gradientType === 'radial') {
        grad = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7);
      } else {
        const rad = (gradientAngle * Math.PI) / 180;
        const x2 = Math.cos(rad) * W;
        const y2 = Math.sin(rad) * H;
        grad = ctx.createLinearGradient(0, 0, Math.abs(x2), Math.abs(y2));
      }
      grad.addColorStop(0, gradientColor1);
      grad.addColorStop(0.5, gradientColor2);
      grad.addColorStop(1, gradientColor3);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (preset && preset.id !== 'original' && preset.id !== 'transparent') {
      if (preset.hex1 && preset.hex2 && preset.hex1 !== preset.hex2) {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, preset.hex1);
        grad.addColorStop(1, preset.hex2);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = preset.hex1 || '#ffffff';
      }
      ctx.fillRect(0, 0, W, H);

      // Subtle ambient radial light
      const radial = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.7);
      radial.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Draw Subject / Product Hero Image (with Filters & Cutout)
    if (loadedImg && loadedImg.width > 0 && loadedImg.height > 0) {
      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${
        blurAmount > 0 ? ` blur(${blurAmount}px)` : ''
      }`;

      const baseDim = Math.min(W, H) * 0.75;
      const aspect = loadedImg.width / loadedImg.height;
      let drawW = baseDim * (productScale / 100);
      let drawH = drawW / aspect;
      if (drawH > H * 0.85) {
        drawH = H * 0.85 * (productScale / 100);
        drawW = drawH * aspect;
      }

      let drawX = productPosX - drawW / 2;
      let drawY = productPosY - drawH / 2;

      // Handle Flip
      if (flipH || flipV) {
        ctx.translate(productPosX, productPosY);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        drawX = -drawW / 2;
        drawY = -drawH / 2;
      }

      if (bgRemoved) {
        const off = document.createElement('canvas');
        off.width = Math.round(drawW);
        off.height = Math.round(drawH);
        const offCtx = off.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(loadedImg, 0, 0, drawW, drawH);
          try {
            const imgData = offCtx.getImageData(0, 0, drawW, drawH);
            const d = imgData.data;
            const cR = (d[0] + d[(off.width - 1) * 4] + d[(off.height - 1) * off.width * 4]) / 3;
            const cG = (d[1] + d[(off.width - 1) * 4 + 1] + d[(off.height - 1) * off.width * 4 + 1]) / 3;
            const cB = (d[2] + d[(off.width - 1) * 4 + 2] + d[(off.height - 1) * off.width * 4 + 2]) / 3;

            const tol = bgTolerance * 2.8;
            for (let i = 0; i < d.length; i += 4) {
              const diff = Math.hypot(d[i] - cR, d[i + 1] - cG, d[i + 2] - cB);
              if (diff < tol) {
                d[i + 3] = Math.max(0, Math.min(255, (diff / tol - 0.7) * 850));
              }
            }
            offCtx.putImageData(imgData, 0, 0);
            ctx.drawImage(off, drawX, drawY);
          } catch {
            ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);
          }
        }
      } else {
        ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);
      }
      productBoundsRef.current = {
        x: drawX,
        y: drawY,
        w: drawW,
        h: drawH,
      };
      ctx.restore();
    }

    // 3. Draw All Interactive Draggable Elements (Shapes, Icons, Images, Text)
    elements.forEach((el) => {
      if (el.hidden) return;
      ctx.save();

      // Transform & Opacity (rotate / flip)
      if (el.rotation || el.flipH || el.flipV) {
        ctx.translate(el.x, el.y);
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.scale(el.flipH ? -1 : 1, el.flipV ? -1 : 1);
        ctx.translate(-el.x, -el.y);
      }
      if (el.opacity !== undefined) {
        ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity));
      }

      // --- SHAPE ELEMENT ---
      if (el.type === 'shape') {
        const w = el.width || 120;
        const h = el.height || 120;

        if (el.shapeType === 'circle') {
          ctx.beginPath();
          ctx.ellipse(el.x, el.y, w / 2, h / 2, 0, 0, Math.PI * 2);
          if (el.bgColor && el.bgColor !== 'transparent') {
            ctx.fillStyle = el.bgColor;
            ctx.fill();
          }
          if (el.strokeColor && (el.strokeWidth || 0) > 0) {
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.stroke();
          }
        } else if (el.shapeType === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(el.x, el.y - h / 2);
          ctx.lineTo(el.x + w / 2, el.y + h / 2);
          ctx.lineTo(el.x - w / 2, el.y + h / 2);
          ctx.closePath();
          if (el.bgColor && el.bgColor !== 'transparent') {
            ctx.fillStyle = el.bgColor;
            ctx.fill();
          }
          if (el.strokeColor && (el.strokeWidth || 0) > 0) {
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.stroke();
          }
        } else if (el.shapeType === 'star') {
          const spikes = 5;
          const outerRadius = Math.min(w, h) / 2;
          const innerRadius = outerRadius * 0.45;
          let rot = (Math.PI / 2) * 3;
          let cx = el.x;
          let cy = el.y;
          let step = Math.PI / spikes;

          ctx.beginPath();
          ctx.moveTo(cx, cy - outerRadius);
          for (let i = 0; i < spikes; i++) {
            let sx = cx + Math.cos(rot) * outerRadius;
            let sy = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(sx, sy);
            rot += step;
            sx = cx + Math.cos(rot) * innerRadius;
            sy = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(sx, sy);
            rot += step;
          }
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
          if (el.bgColor && el.bgColor !== 'transparent') {
            ctx.fillStyle = el.bgColor;
            ctx.fill();
          }
          if (el.strokeColor && (el.strokeWidth || 0) > 0) {
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.stroke();
          }
        } else if (el.shapeType === 'wave_curve') {
          // Organic curved wave (Canva Image 2 replica!)
          ctx.beginPath();
          const bx = el.x - w / 2;
          const by = el.y - h / 2;
          ctx.moveTo(bx + w, by);
          ctx.bezierCurveTo(bx + w * 0.35, by + h * 0.15, bx + w * 0.1, by + h * 0.65, bx + w * 0.45, by + h);
          ctx.lineTo(bx + w, by + h);
          ctx.closePath();
          if (el.bgColor && el.bgColor !== 'transparent') {
            ctx.fillStyle = el.bgColor;
            ctx.fill();
          }
          if (el.strokeColor && (el.strokeWidth || 0) > 0) {
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.stroke();
          }
        } else if (el.shapeType === 'dot_grid') {
          // 4x3 subtle dot matrix pattern (Canva Image 2 replica!)
          const cols = 4;
          const rows = 3;
          const dotR = 3;
          const gapX = w / (cols - 1 || 1);
          const gapY = h / (rows - 1 || 1);
          const startX = el.x - w / 2;
          const startY = el.y - h / 2;
          ctx.fillStyle = el.bgColor || 'rgba(255, 255, 255, 0.5)';
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              ctx.beginPath();
              ctx.arc(startX + c * gapX, startY + r * gapY, dotR, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (el.shapeType === 'line') {
          ctx.beginPath();
          ctx.moveTo(el.x - w / 2, el.y);
          ctx.lineTo(el.x + w / 2, el.y);
          ctx.strokeStyle = el.strokeColor || el.bgColor || '#0f172a';
          ctx.lineWidth = el.strokeWidth || 3;
          ctx.stroke();
          layoutCacheRef.current[el.id] = {
            x: el.x - w / 2,
            y: el.y - (el.strokeWidth || 3) - 6,
            w,
            h: (el.strokeWidth || 3) * 2 + 12,
          };
        } else {
          // Rounded Rectangle
          ctx.beginPath();
          const rx = el.x - w / 2;
          const ry = el.y - h / 2;
          ctx.roundRect(rx, ry, w, h, el.borderRadius ?? 16);
          if (el.bgColor && el.bgColor !== 'transparent') {
            ctx.fillStyle = el.bgColor;
            ctx.fill();
          }
          if (el.strokeColor && (el.strokeWidth || 0) > 0) {
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.stroke();
          }
        }
        if (el.shapeType !== 'line' && !layoutCacheRef.current[el.id]) {
          layoutCacheRef.current[el.id] = { x: el.x - w / 2, y: el.y - h / 2, w, h };
        }
        ctx.restore();
        return;
      }

      // --- ICON ELEMENT ---
      if (el.type === 'icon') {
        ctx.fillStyle = el.fontColor || '#0f172a';
        ctx.font = `${el.fontSize || 32}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const item = QUICK_ICONS.find((i) => i.id === el.icon);
        const glyph = item ? item.glyph : el.text || '★';
        ctx.fillText(glyph, el.x, el.y);
        const iconSide = Math.max(32, (el.fontSize || 32) * 1.4);
        layoutCacheRef.current[el.id] = {
          x: el.x - iconSide / 2,
          y: el.y - iconSide / 2,
          w: iconSide,
          h: iconSide,
        };
        ctx.restore();
        return;
      }

      // --- IMAGE ELEMENT (Store Product / Category / Logo / Upload) ---
      if (el.type === 'image' && el.imageUrl) {
        const w = el.width || 180;
        const h = el.height || 180;
        const cached = imageCacheRef.current[el.imageUrl];
        if (cached && cached.complete && cached.naturalWidth > 0) {
          if (el.shadowEnabled) {
            ctx.shadowColor = el.shadowColor || 'rgba(0,0,0,0.35)';
            ctx.shadowBlur = el.shadowBlur ?? 12;
            ctx.shadowOffsetX = el.shadowOffsetX ?? 0;
            ctx.shadowOffsetY = el.shadowOffsetY ?? 4;
          }
          if (el.borderRadius && el.borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(el.x - w / 2, el.y - h / 2, w, h, el.borderRadius);
            ctx.clip();
          }
          ctx.drawImage(cached, el.x - w / 2, el.y - h / 2, w, h);
          ctx.shadowColor = 'transparent';
          if (el.strokeColor && (el.strokeWidth || 0) > 0) {
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.beginPath();
            ctx.roundRect(el.x - w / 2, el.y - h / 2, w, h, el.borderRadius || 0);
            ctx.stroke();
          }
        } else if (!imageCacheRef.current[el.imageUrl]) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            imageCacheRef.current[el.imageUrl!] = img;
            renderCanvas();
          };
          img.src = el.imageUrl;
          imageCacheRef.current[el.imageUrl] = img;
        }
        layoutCacheRef.current[el.id] = { x: el.x - w / 2, y: el.y - h / 2, w, h };
        ctx.restore();
        return;
      }

      // --- TEXT / BADGE / HEADLINE / SUBTITLE ---
      if (!el.text || !el.text.trim()) {
        ctx.restore();
        return;
      }

      const canvasApprox = resolveCanvasApproxColor(
        selectedBackdrop,
        customSolidColor,
        gradientColor2,
      );
      const readable = ensureReadableTextStyle(el.fontColor, el.bgColor, canvasApprox, {
        preferPill: el.type === 'headline' || el.type === 'subtitle' || el.type === 'custom_text',
      });
      const drawFontColor = readable.fontColor;
      const drawBgColor = readable.bgColor;

      const family = el.fontFamily || (isAr ? 'Tajawal' : 'Outfit');
      const weightMap: Record<NonNullable<CanvasElement['fontWeight']>, number> = {
        light: 300,
        regular: 400,
        medium: 500,
        bold: 700,
        black: 900,
      };
      const numericWeight = el.fontWeight
        ? weightMap[el.fontWeight]
        : el.isBold
          ? 800
          : 500;
      ctx.font = `${el.isItalic ? 'italic ' : ''}${numericWeight} ${el.fontSize}px "${family}", sans-serif`;
      ctx.textAlign = el.textAlign || 'center';
      ctx.textBaseline = 'middle';

      const lines = el.text.split('\n');
      const lineMul = el.lineHeight && el.lineHeight > 0 ? el.lineHeight : 1.35;
      const lineH = el.fontSize * lineMul;
      const letterSp = el.letterSpacing ?? 0;
      const totalH = lines.length * lineH;

      const measureLineWidth = (line: string) => {
        if (!letterSp) return ctx.measureText(line).width;
        let w = 0;
        for (let i = 0; i < line.length; i++) {
          w += ctx.measureText(line[i]).width;
          if (i < line.length - 1) w += letterSp;
        }
        return w;
      };

      // Find max line width
      let maxLineWidth = 0;
      lines.forEach((line) => {
        const w = measureLineWidth(line);
        if (w > maxLineWidth) maxLineWidth = w;
      });

      const pad = el.bgPadding ?? 14;
      const boxW = maxLineWidth + pad * 2.2;
      const boxH = totalH + pad * 1.2;
      const rad = el.borderRadius ?? 16;

      let boxX = el.x;
      if (el.textAlign === 'center') {
        boxX = el.x - boxW / 2;
      } else if (el.textAlign === 'right') {
        boxX = el.x - boxW;
      }
      const boxY = el.y - boxH / 2;

      // Draw Element Background Box
      if (drawBgColor && drawBgColor !== 'transparent') {
        if (el.shadowEnabled) {
          ctx.shadowColor = el.shadowColor || 'rgba(0,0,0,0.35)';
          ctx.shadowBlur = el.shadowBlur ?? 10;
          ctx.shadowOffsetX = el.shadowOffsetX ?? 0;
          ctx.shadowOffsetY = el.shadowOffsetY ?? 3;
        }
        ctx.fillStyle = drawBgColor;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, rad);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        if (el.badgeStyle === 'gold_glow') {
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (el.badgeStyle === 'emerald_glow') {
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      // Text border (stroke) + optional text shadow
      if (el.shadowEnabled && (!drawBgColor || drawBgColor === 'transparent')) {
        ctx.shadowColor = el.shadowColor || 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = el.shadowBlur ?? 8;
        ctx.shadowOffsetX = el.shadowOffsetX ?? 1;
        ctx.shadowOffsetY = el.shadowOffsetY ?? 2;
      }

      const drawSpacedText = (
        line: string,
        cx: number,
        cy: number,
        mode: 'fill' | 'stroke',
      ) => {
        if (!letterSp) {
          if (mode === 'stroke') ctx.strokeText(line, cx, cy);
          else ctx.fillText(line, cx, cy);
          return;
        }
        const fullW = measureLineWidth(line);
        let startX = cx;
        if (el.textAlign === 'center') startX = cx - fullW / 2;
        else if (el.textAlign === 'right') startX = cx - fullW;
        const prevAlign = ctx.textAlign;
        ctx.textAlign = 'left';
        let xPos = startX;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (mode === 'stroke') ctx.strokeText(ch, xPos, cy);
          else ctx.fillText(ch, xPos, cy);
          xPos += ctx.measureText(ch).width + letterSp;
        }
        ctx.textAlign = prevAlign;
      };

      let startY = el.y - totalH / 2 + lineH / 2;
      if (el.verticalAlign === 'top') startY = el.y - boxH / 2 + pad + lineH / 2;
      else if (el.verticalAlign === 'bottom') startY = el.y + boxH / 2 - pad - totalH + lineH / 2;

      lines.forEach((line, idx) => {
        const ly = startY + idx * lineH;
        if (el.strokeColor && (el.strokeWidth || 0) > 0) {
          ctx.strokeStyle = el.strokeColor;
          ctx.lineWidth = el.strokeWidth || 2;
          ctx.lineJoin = 'round';
          drawSpacedText(line, el.x, ly, 'stroke');
        }
        ctx.fillStyle = drawFontColor;
        drawSpacedText(line, el.x, ly, 'fill');

        const metricsW = measureLineWidth(line);
        let lineLeft = el.x;
        if (el.textAlign === 'center') lineLeft = el.x - metricsW / 2;
        else if (el.textAlign === 'right') lineLeft = el.x - metricsW;
        const lineRight = lineLeft + metricsW;

        if (el.underline) {
          ctx.beginPath();
          ctx.strokeStyle = drawFontColor;
          ctx.lineWidth = Math.max(1, el.fontSize * 0.06);
          const uy = ly + el.fontSize * 0.45;
          ctx.moveTo(lineLeft, uy);
          ctx.lineTo(lineRight, uy);
          ctx.stroke();
        }
        if (el.strikethrough) {
          ctx.beginPath();
          ctx.strokeStyle = drawFontColor;
          ctx.lineWidth = Math.max(1, el.fontSize * 0.06);
          ctx.moveTo(lineLeft, ly);
          ctx.lineTo(lineRight, ly);
          ctx.stroke();
        }
      });
      ctx.shadowColor = 'transparent';

      // Box border around text block when stroke set without fill badge
      if (
        el.strokeColor &&
        (el.strokeWidth || 0) > 0 &&
        drawBgColor &&
        drawBgColor !== 'transparent' &&
        !el.badgeStyle
      ) {
        ctx.strokeStyle = el.strokeColor;
        ctx.lineWidth = el.strokeWidth || 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, rad);
        ctx.stroke();
      }

      layoutCacheRef.current[el.id] = { x: boxX, y: boxY, w: boxW, h: boxH };

      ctx.restore();
    });
    setLayoutEpoch((n) => n + 1);
  }, [
    canvasW,
    canvasH,
    selectedBackdrop,
    customSolidColor,
    gradientType,
    gradientAngle,
    gradientColor1,
    gradientColor2,
    gradientColor3,
    loadedImg,
    brightness,
    contrast,
    saturation,
    blurAmount,
    productPosX,
    productPosY,
    productScale,
    flipH,
    flipV,
    bgRemoved,
    bgTolerance,
    elements,
    isAr,
  ]);

  useEffect(() => {
    if (isOpen) {
      renderCanvas();
    }
  }, [isOpen, renderCanvas]);

  useEffect(() => {
    setShowSpacingPopover(false);
  }, [selectedElementId]);

  useEffect(() => {
    const approx = resolveCanvasApproxColor(selectedBackdrop, customSolidColor, gradientColor2);
    setElements((prev) => {
      let changed = false;
      const next = prev.map((el) => {
        if (el.type === 'shape' || el.type === 'image' || el.type === 'icon') return el;
        const readable = ensureReadableTextStyle(el.fontColor, el.bgColor, approx, {
          preferPill:
            el.type === 'headline' ||
            el.type === 'subtitle' ||
            el.type === 'custom_text' ||
            el.bgColor === 'transparent',
        });
        if (readable.fontColor === el.fontColor && readable.bgColor === el.bgColor) return el;
        changed = true;
        return { ...el, fontColor: readable.fontColor, bgColor: readable.bgColor };
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- backdrop palette only
  }, [selectedBackdrop, customSolidColor, gradientColor2]);

  // Keep drag / resize working when pointer leaves the design frame
  useEffect(() => {
    if (!isDraggingElement && !isDraggingProduct && !isResizingElement && !isResizingProduct) return;
    const onMove = (ev: MouseEvent | TouchEvent) => {
      handlePointerMove(ev as unknown as React.MouseEvent);
    };
    const onUp = () => handlePointerUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers close over latest state
  }, [isDraggingElement, isDraggingProduct, isResizingElement, isResizingProduct]);

  // Canvas-local background isolate (not a server AI cutout).
  // Real brand-consistent product placement lives in AI Media Generator (/ai-media).
  const handleAiRemoveBg = () => {
    setIsProcessingAi(true);
    setBgRemoved(true);
    if (selectedBackdrop === 'original') {
      setSelectedBackdrop('transparent');
    }
    setIsProcessingAi(false);
    pushHistorySnapshot();
    toast(
      isAr
        ? 'عزل خلفية محلي على اللوحة فقط. لوضع المنتج بخلفية متوافقة مع الهوية استخدم مولّد الصور بالذكاء الاصطناعي.'
        : 'Local canvas background isolate only. Use Brand AI Media Generator for brand-consistent product placement.',
      'info',
    );
  };

  const formatStudioPrice = (price: number | string | undefined | null): string => {
    if (price == null || price === '') return '';
    const n = typeof price === 'number' ? price : Number(price);
    if (!Number.isFinite(n)) return '';
    return `${n} ${isAr ? 'ر.س' : 'SAR'}`;
  };

  const studioDynamicContext = () => {
    const product = currentProducts[0];
    const storeName = (isAr ? activeStore.nameAr || activeStore.name : activeStore.name) || '';
    const productName = product
      ? (isAr ? product.nameAr || product.nameEn || product.name : product.nameEn || product.name) || ''
      : '';
    const priceLabel = product ? formatStudioPrice(product.discountedPrice ?? product.price) : '';
    const categoryName = product
      ? (isAr
          ? product.categoryAr || product.categoryEn || product.category
          : product.categoryEn || product.category) || ''
      : '';
    return { storeName, productName, priceLabel, categoryName, product };
  };

  const resolveDynamicLayerText = (layer: CanvaTemplateElement): string => {
    const ctx = studioDynamicContext();
    return resolveCanvaLayerLabel(layer, {
      isAr,
      storeName: ctx.storeName,
      productName: ctx.productName,
      priceLabel: ctx.priceLabel,
      categoryName: ctx.categoryName,
    });
  };

  // Apply Template
  const applyCanvaTemplate = (template: CanvaDesignTemplate) => {
    setSelectedTemplateId(template.id);
    setCanvasW(template.width);
    setCanvasH(template.height);
    setSelectedBackdrop(template.backdropId);
    if (template.customSolidColor) {
      setCustomSolidColor(template.customSolidColor);
    }
    setProductPosX(Math.round(template.productPosPct.x * template.width));
    setProductPosY(Math.round(template.productPosPct.y * template.height));
    setProductScale(template.productPosPct.scale);

    // Hero image = this store's live product only (never sample / other-tenant assets)
    const liveProductImg = currentProducts[0]?.image || currentProducts[0]?.imageUrl || '';
    if (template.productPosPct.scale > 0 && liveProductImg) {
      setActiveImageUrl(String(liveProductImg));
    } else if (template.productPosPct.scale <= 0) {
      setActiveImageUrl('');
      setLoadedImg(null);
    }

    const canvasApprox = resolveCanvasApproxColor(
      template.backdropId,
      template.customSolidColor || customSolidColor,
      gradientColor2,
    );

    const mapped: CanvasElement[] = template.elements
      .map((layer, idx) => {
        const text = resolveDynamicLayerText(layer);
        // Skip empty price / empty bound layers — no fake SAR placeholders
        if (!text.trim() && (layer.bind === 'price' || layer.type === 'price')) {
          return null;
        }
        const readable = ensureReadableTextStyle(
          layer.fontColor || '#0f172a',
          layer.bgColor || 'transparent',
          canvasApprox,
          { preferPill: layer.type === 'headline' || layer.type === 'subtitle' },
        );
        return {
          id: `el-${Date.now()}-${idx}`,
          type: layer.type,
          text,
          x: Math.round(layer.xPct * template.width),
          y: Math.round(layer.yPct * template.height),
          width: layer.widthPct ? Math.round(layer.widthPct * template.width) : undefined,
          height: layer.heightPct ? Math.round(layer.heightPct * template.height) : undefined,
          fontSize: layer.fontSize || 24,
          fontColor: readable.fontColor,
          bgColor: readable.bgColor,
          bgPadding: layer.bgPadding ?? 14,
          borderRadius: layer.borderRadius ?? 16,
          isBold: layer.isBold ?? true,
          isItalic: layer.isItalic ?? false,
          textAlign: layer.textAlign || 'center',
          badgeStyle: layer.badgeStyle,
          fontFamily: layer.fontFamily || (isAr ? 'Tajawal' : 'Outfit'),
          shapeType: layer.shapeType,
          strokeColor: layer.strokeColor,
          strokeWidth: layer.strokeWidth,
          opacity: layer.opacity,
          icon: layer.icon,
          imageUrl: layer.imageUrl,
        } as CanvasElement;
      })
      .filter((el): el is CanvasElement => el != null);

    setElements(mapped);
    setSelectedElementId(mapped[0]?.id || null);
    setProductHeroSelected(false);
    setSavedToMediaLibrary(false);
    setDocTitle(isAr ? template.nameAr || template.nameEn : template.nameEn);
    pushHistorySnapshot(mapped);
    toast(
      isAr ? `تم تطبيق القالب: ${template.nameAr}` : `Template applied: ${template.nameEn}`,
      'success',
    );
  };

  const mapImportedLayers = (layers: ImportedStudioLayer[]): CanvasElement[] => {
    const canvasApprox = '#ffffff';
    return layers.map((layer, idx) => {
      const isTextLayer =
        layer.type !== 'image' &&
        layer.type !== 'shape' &&
        layer.type !== 'icon' &&
        Boolean(layer.text?.trim());
      const readable = isTextLayer
        ? ensureReadableTextStyle(layer.fontColor, layer.bgColor, canvasApprox, {
            preferPill: true,
          })
        : {
            fontColor: layer.fontColor || '#0f172a',
            bgColor: layer.bgColor || 'transparent',
          };
      return {
        id: layer.id || `el-${Date.now()}-${idx}`,
        type: layer.type,
        text: layer.text || '',
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        fontSize: layer.fontSize || 24,
        fontColor: readable.fontColor,
        bgColor: readable.bgColor,
        isBold: layer.isBold ?? true,
        isItalic: layer.isItalic ?? false,
        textAlign: layer.textAlign || 'center',
        opacity: layer.opacity ?? 1,
        imageUrl: layer.imageUrl,
        locked: layer.locked,
        fontFamily: isAr ? 'Tajawal' : 'Outfit',
        borderRadius: 0,
        bgPadding: 14,
      };
    });
  };

  const preloadLayerImages = (layers: CanvasElement[]): Promise<void> => {
    const urls = layers.map((l) => l.imageUrl).filter((u): u is string => Boolean(u));
    if (!urls.length) return Promise.resolve();
    return Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resolve) => {
            const existing = imageCacheRef.current[url];
            if (existing?.complete && existing.naturalWidth > 0) {
              resolve();
              return;
            }
            const img = new Image();
            img.onload = () => {
              imageCacheRef.current[url] = img;
              resolve();
            };
            img.onerror = () => resolve();
            img.src = url;
            imageCacheRef.current[url] = img;
          }),
      ),
    ).then(() => undefined);
  };

  const applyImportedDesign = (
    design: ImportedStudioDesign,
    opts?: { templateId?: string; keepCategory?: boolean },
  ) => {
    setCanvasW(design.width);
    setCanvasH(design.height);
    setSelectedBackdrop('custom');
    setCustomSolidColor('#ffffff');
    setProductScale(0);
    setProductPosX(Math.round(design.width / 2));
    setProductPosY(Math.round(design.height / 2));

    const mapped = mapImportedLayers(design.layers);
    setElements(mapped);
    setSelectedElementId(mapped[0]?.id || null);
    setDocTitle(design.name);
    setSelectedTemplateId(opts?.templateId || `import-${design.source}`);
    setLastImported(design);
    if (design.categoryHint && !opts?.keepCategory) {
      setUploadCategory(design.categoryHint);
    }
    pushHistorySnapshot(mapped);
    void preloadLayerImages(mapped).then(() => {
      setElements((prev) => [...prev]);
    });
    toast(
      isAr
        ? `تم فتح التصميم · ${mapped.length} طبقة قابلة للتعديل`
        : `Design loaded · ${mapped.length} editable layer(s)`,
      'success',
    );
  };

  const refreshMyTemplates = useCallback(async () => {
    if (!activeStore?.id) {
      setMyTemplates([]);
      return;
    }
    const rows = await listMyCanvaTemplates(activeStore.id);
    setMyTemplates(rows);
  }, [activeStore?.id]);

  useEffect(() => {
    if (!isOpen) return;
    void refreshMyTemplates();
  }, [isOpen, refreshMyTemplates]);

  const handleSaveAsMyTemplate = async () => {
    if (!activeStore?.id) return;
    if (elements.length === 0) {
      toast(isAr ? 'أضف طبقات قبل الحفظ.' : 'Add layers before saving.', 'error');
      return;
    }
    try {
      const preview =
        canvasRef.current?.toDataURL('image/webp', 0.9) || lastImported?.previewDataUrl;
      const layers: ImportedStudioLayer[] = elements.map((el) => ({
        id: el.id,
        type: el.type,
        text: el.text,
        x: el.x,
        y: el.y,
        width: el.width || 120,
        height: el.height || 120,
        fontSize: el.fontSize,
        fontColor: el.fontColor,
        bgColor: el.bgColor,
        isBold: el.isBold,
        isItalic: el.isItalic,
        textAlign: el.textAlign,
        opacity: el.opacity,
        imageUrl: el.imageUrl,
        locked: el.locked,
      }));
      const saved = await saveMyCanvaTemplate({
        storeId: activeStore.id,
        category: uploadCategory,
        nameEn: docTitle || 'My template',
        nameAr: docTitle || 'قالبي',
        width: canvasW,
        height: canvasH,
        source: lastImported?.source || 'studio',
        layers,
        previewDataUrl: preview,
      });
      const editorType: StudioEditorType =
        editorKind ||
        (uploadCategory === 'logo'
          ? 'logo'
          : uploadCategory === 'product'
            ? 'product_card'
            : 'banner');
      if (isApiEnabled()) {
        const row = await saveStudioDesign(activeStore.id, {
          id: savedDesignId || undefined,
          editor_type: editorType,
          category: uploadCategory,
          title: docTitle || 'Design',
          width: canvasW,
          height: canvasH,
          design_json: {
            elements,
            productPos: { x: productPosX, y: productPosY, scale: productScale },
            backdrop: selectedBackdrop,
            customSolidColor,
            filters: { brightness, contrast, saturation, blur: blurAmount },
          },
          source: 'studio',
        });
        setSavedDesignId(row.id);
      }
      await refreshMyTemplates();
      setSelectedTemplateId(saved.id);
      toast(
        isAr
          ? 'تم حفظ التصميم في قاعدة بيانات المتجر.'
          : 'Design saved to your store database.',
        'success',
      );
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      toast(
        code === 'TEMPLATE_LIMIT'
          ? isAr
            ? 'وصلت للحد الأقصى من القوالب المرفوعة.'
            : 'Upload template limit reached.'
          : isAr
            ? 'تعذر حفظ القالب.'
            : 'Could not save template.',
        'error',
      );
    }
  };

  // Add Shape to Canvas
  const handleAddShape = (shapeType: CanvasElement['shapeType']) => {
    const isWave = shapeType === 'wave_curve';
    const isDots = shapeType === 'dot_grid';
    const newShape: CanvasElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shapeType,
      text: '',
      x: Math.round(canvasW / 2),
      y: Math.round(canvasH / 2),
      width: isWave ? 420 : isDots ? 120 : 160,
      height: isWave ? 600 : isDots ? 100 : 160,
      fontSize: 16,
      fontColor: '#ffffff',
      bgColor: isWave ? 'rgba(29, 78, 216, 0.5)' : isDots ? '#93c5fd' : '#2563eb',
      strokeColor: isWave ? '#60a5fa' : '#ffffff',
      strokeWidth: isDots ? 0 : 2,
      borderRadius: 16,
      opacity: 0.9,
    };
    setElements((prev) => [...prev, newShape]);
    setSelectedElementId(newShape.id);
    pushHistorySnapshot();
    toast(isAr ? 'تمت إضافة الشكل إلى التصميم!' : 'Shape added to canvas!', 'info');
  };

  // Add Icon to Canvas
  const handleAddIcon = (iconId: string) => {
    const newIcon: CanvasElement = {
      id: `icon-${Date.now()}`,
      type: 'icon',
      icon: iconId,
      text: '',
      x: Math.round(canvasW / 2),
      y: Math.round(canvasH / 2),
      fontSize: 48,
      fontColor: '#fbbf24',
    };
    setElements((prev) => [...prev, newIcon]);
    setSelectedElementId(newIcon.id);
    pushHistorySnapshot();
    toast(isAr ? 'تمت إضافة الأيقونة بنجاح!' : 'Icon added to canvas!', 'info');
  };

  // Quick Add Text Element — black text on light canvas (Canva default)
  const handleAddTextElement = (type: CanvasElement['type'], defaultText: string) => {
    const isFilled = type === 'price' || type === 'badge';
    const canvasApprox = resolveCanvasApproxColor(selectedBackdrop, customSolidColor, gradientColor2);
    const baseFont = isFilled ? '#ffffff' : '#0f172a';
    const baseBg = type === 'price' ? '#059669' : type === 'badge' ? '#e11d48' : 'transparent';
    const readable = ensureReadableTextStyle(baseFont, baseBg, canvasApprox);
    const newEl: CanvasElement = {
      id: `el-${Date.now()}`,
      type,
      text: defaultText,
      x: Math.round(canvasW / 2),
      y: Math.round(canvasH / 2) + (elements.length % 5) * 35,
      fontSize: type === 'headline' ? 38 : type === 'price' ? 30 : 20,
      fontColor: readable.fontColor,
      bgColor: readable.bgColor,
      bgPadding: 16,
      borderRadius: 20,
      isBold: true,
      textAlign: 'center',
      fontFamily: isAr ? 'Tajawal' : 'Outfit',
    };
    setElements((prev) => {
      const next = [...prev, newEl];
      queueMicrotask(() => pushHistorySnapshot(next));
      return next;
    });
    setSelectedElementId(newEl.id);
    toast(isAr ? 'تمت إضافة النص إلى التصميم!' : 'Text added to design!', 'info');
  };

  // Quick Add Badge Element
  const handleAddBadgeElement = (text: string, color: string, badgeStyle: CanvasElement['badgeStyle']) => {
    const newBadge: CanvasElement = {
      id: `badge-${Date.now()}`,
      type: 'badge',
      text,
      x: Math.round(canvasW / 2),
      y: Math.round(canvasH * 0.22) + (elements.length % 4) * 45,
      fontSize: 20,
      fontColor: '#ffffff',
      bgColor: color,
      bgPadding: 16,
      borderRadius: 28,
      isBold: true,
      badgeStyle,
      textAlign: 'center',
      fontFamily: isAr ? 'Tajawal' : 'Outfit',
    };
    setElements((prev) => {
      const next = [...prev, newBadge];
      queueMicrotask(() => pushHistorySnapshot(next));
      return next;
    });
    setSelectedElementId(newBadge.id);
    toast(isAr ? 'تمت إضافة الشارة!' : 'Badge sticker added!', 'info');
  };

  // Delete Selected Element
  const handleDeleteSelected = () => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const next = prev.filter((el) => el.id !== selectedElementId);
      queueMicrotask(() => pushHistorySnapshot(next));
      return next;
    });
    setSelectedElementId(null);
  };

  // Duplicate Selected Element
  const handleDuplicateSelected = () => {
    if (!selectedElementId) return;
    const target = elements.find((el) => el.id === selectedElementId);
    if (!target) return;
    const dup: CanvasElement = {
      ...target,
      id: `el-${Date.now()}`,
      x: Math.min(target.x + 35, canvasW - 50),
      y: Math.min(target.y + 35, canvasH - 50),
    };
    setElements((prev) => {
      const next = [...prev, dup];
      queueMicrotask(() => pushHistorySnapshot(next));
      return next;
    });
    setSelectedElementId(dup.id);
  };

  // Update selected element — commit=true pushes undo snapshot
  const updateSelectedElement = (updates: Partial<CanvasElement>, commit = true) => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const next = prev.map((el) =>
        el.id === selectedElementId ? { ...el, ...updates } : el,
      );
      if (commit) {
        queueMicrotask(() => pushHistorySnapshot(next));
      }
      return next;
    });
  };

  // Layer Ordering
  const bringElementForward = () => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === selectedElementId);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const item = next.splice(idx, 1)[0];
      next.splice(idx + 1, 0, item);
      return next;
    });
    pushHistorySnapshot();
  };

  const sendElementBackward = () => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === selectedElementId);
      if (idx <= 0) return prev;
      const next = [...prev];
      const item = next.splice(idx, 1)[0];
      next.splice(idx - 1, 0, item);
      return next;
    });
    pushHistorySnapshot();
  };

  const bringElementToFront = () => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === selectedElementId);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.push(item);
      return next;
    });
    pushHistorySnapshot();
  };

  const sendElementToBack = () => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === selectedElementId);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
    pushHistorySnapshot();
  };

  /** Drop layer `dragId` onto `targetId` (list shows top→bottom; array is bottom→top). */
  const reorderLayerByDrop = (dragId: string, targetId: string) => {
    if (!dragId || !targetId || dragId === targetId) return;
    setElements((prev) => {
      const from = prev.findIndex((e) => e.id === dragId);
      let to = prev.findIndex((e) => e.id === targetId);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      if (from < to) to -= 1;
      next.splice(to, 0, item);
      queueMicrotask(() => pushHistorySnapshot(next));
      return next;
    });
  };

  const alignSelectedToPage = (mode: 'h-center' | 'v-center' | 'left' | 'right' | 'top' | 'bottom') => {
    if (!selectedElementId) return;
    const el = elements.find((e) => e.id === selectedElementId);
    if (!el) return;
    const rect = layoutCacheRef.current[selectedElementId] ?? estimateElementBounds(el);
    let nx = rect.x + rect.w / 2;
    let ny = rect.y + rect.h / 2;
    if (mode === 'h-center') nx = canvasW / 2;
    if (mode === 'v-center') ny = canvasH / 2;
    if (mode === 'left') nx = rect.w / 2 + 16;
    if (mode === 'right') nx = canvasW - rect.w / 2 - 16;
    if (mode === 'top') ny = rect.h / 2 + 16;
    if (mode === 'bottom') ny = canvasH - rect.h / 2 - 16;
    updateSelectedElement({ x: Math.round(nx), y: Math.round(ny) });
  };

  // Pointer drag & resize handling
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const frame = canvasFrameRef.current || canvasRef.current;
    if (!frame) return { x: 0, y: 0 };
    const rect = frame.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = canvasW / rect.width;
    const scaleY = canvasH / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const startProductResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!loadedImg || productScale <= 0) return;
    const { x, y } = getCanvasCoords(e);
    setIsResizingProduct(true);
    setIsResizingElement(false);
    setIsDraggingElement(false);
    setIsDraggingProduct(false);
    setInitialResizeState({
      startX: x,
      startY: y,
      elW: 0,
      elH: 0,
      fontSize: productScale,
      productScale,
    });
  };

  const startElementResize = (
    corner: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w',
    e: React.MouseEvent | React.TouchEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedElementId) return;
    const el = elements.find((x) => x.id === selectedElementId);
    if (!el || el.locked) return;
    const { x, y } = getCanvasCoords(e);
    setIsResizingElement(true);
    setIsResizingProduct(false);
    setResizeCorner(corner);
    setIsDraggingElement(false);
    setProductHeroSelected(false);
    setInitialResizeState({
      startX: x,
      startY: y,
      elW: el.width || 120,
      elH: el.height || 120,
      fontSize: el.fontSize || 24,
    });
  };

  const nudgeSelected = (dx: number, dy: number) => {
    if (!selectedElementId) return;
    setElements((prev) =>
      prev.map((el) =>
        el.id === selectedElementId
          ? {
              ...el,
              x: Math.max(15, Math.min(canvasW - 15, el.x + dx)),
              y: Math.max(15, Math.min(canvasH - 15, el.y + dy)),
            }
          : el,
      ),
    );
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isResizingElement || isResizingProduct) return;
    const { x, y } = getCanvasCoords(e);

    // Hit test top → bottom (Canva-like). Select locked layers too; only skip drag when locked.
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.hidden) continue;
      const bounds = layoutCacheRef.current[el.id] || estimateElementBounds(el);
      if (rectContainsPoint(bounds, x, y, 8)) {
        setSelectedElementId(el.id);
        setProductHeroSelected(false);
        if (!el.locked) {
          setIsDraggingElement(true);
          setDragOffset({ x: x - el.x, y: y - el.y });
        }
        return;
      }
    }

    const productBounds = productBoundsRef.current;
    if (productBounds && productScale > 0 && rectContainsPoint(productBounds, x, y, 4)) {
      setProductHeroSelected(true);
      setSelectedElementId(null);
      setIsDraggingProduct(true);
      setDragOffset({ x: x - productPosX, y: y - productPosY });
      return;
    }

    setSelectedElementId(null);
    setProductHeroSelected(false);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingElement && !isDraggingProduct && !isResizingElement && !isResizingProduct) return;
    const { x, y } = getCanvasCoords(e);

    if (isResizingProduct) {
      const dx = x - initialResizeState.startX;
      const dy = y - initialResizeState.startY;
      const delta = Math.max(dx, dy);
      const base = initialResizeState.productScale ?? productScale;
      setProductScale(Math.max(18, Math.min(120, Math.round(base + delta * 0.12))));
      return;
    }

    if (isResizingElement && selectedElementId && resizeCorner) {
      const dx = x - initialResizeState.startX;
      const dy = y - initialResizeState.startY;
      let delta = 0;
      if (resizeCorner === 'e' || resizeCorner === 'w') {
        delta = dx * (resizeCorner === 'e' ? 1 : -1);
      } else if (resizeCorner === 'n' || resizeCorner === 's') {
        delta = dy * (resizeCorner === 's' ? 1 : -1);
      } else {
        const signX = resizeCorner.includes('e') ? 1 : -1;
        const signY = resizeCorner.includes('s') ? 1 : -1;
        delta = Math.max(dx * signX, dy * signY);
      }

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElementId) return el;
          if (el.type === 'image' || el.type === 'shape') {
            return {
              ...el,
              width: Math.max(40, Math.round(initialResizeState.elW + delta)),
              height: Math.max(40, Math.round(initialResizeState.elH + delta)),
            };
          }
          return {
            ...el,
            fontSize: Math.max(12, Math.min(160, Math.round(initialResizeState.fontSize + delta * 0.35))),
            width: Math.max(40, Math.round(initialResizeState.elW + delta)),
            height: Math.max(24, Math.round(initialResizeState.elH + delta * 0.5)),
          };
        }),
      );
      return;
    }

    if (isDraggingElement && selectedElementId) {
      const nextX = Math.max(15, Math.min(canvasW - 15, x - dragOffset.x));
      const nextY = Math.max(15, Math.min(canvasH - 15, y - dragOffset.y));
      setElements((prev) =>
        prev.map((el) => (el.id === selectedElementId ? { ...el, x: nextX, y: nextY } : el)),
      );
    } else if (isDraggingProduct) {
      const nextX = Math.max(30, Math.min(canvasW - 30, x - dragOffset.x));
      const nextY = Math.max(30, Math.min(canvasH - 30, y - dragOffset.y));
      setProductPosX(nextX);
      setProductPosY(nextY);
    }
  };

  const handlePointerUp = () => {
    if (isDraggingElement || isDraggingProduct || isResizingElement || isResizingProduct) {
      setIsDraggingElement(false);
      setIsDraggingProduct(false);
      setIsResizingElement(false);
      setIsResizingProduct(false);
      setResizeCorner(null);
      pushHistorySnapshot();
    }
  };

  // Upload PNG/JPG/WebP as one extra image layer on current canvas
  const handleUploadLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const probe = new Image();
      probe.onload = () => {
        const maxSide = Math.min(canvasW, canvasH) * 0.45;
        const ratio = Math.min(maxSide / probe.naturalWidth, maxSide / probe.naturalHeight, 1);
        const w = Math.max(80, Math.round(probe.naturalWidth * ratio));
        const h = Math.max(80, Math.round(probe.naturalHeight * ratio));
        imageCacheRef.current[dataUrl] = probe;
        const layer: CanvasElement = {
          id: `img-${Date.now()}`,
          type: 'image',
          text: file.name.replace(/\.[^.]+$/, '') || (isAr ? 'صورة' : 'Image'),
          imageUrl: dataUrl,
          x: Math.round(canvasW / 2),
          y: Math.round(canvasH / 2),
          width: w,
          height: h,
          fontSize: 16,
          fontColor: '#0f172a',
          borderRadius: 0,
          opacity: 1,
        };
        setElements((prev) => [...prev, layer]);
        setSelectedElementId(layer.id);
        pushHistorySnapshot();
        toast(
          isAr ? 'تمت إضافة الصورة كطبقة قابلة للتعديل!' : 'Image added as an editable layer!',
          'success',
        );
      };
      probe.onerror = () => {
        toast(isAr ? 'تعذر قراءة الصورة.' : 'Could not read that image.', 'error');
      };
      probe.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /** Full design import: Canva PSD / PNG → replace canvas with editable layers */
  const handleImportDesignFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsImportingDesign(true);
    try {
      const design = await importDesignFile(file);
      applyImportedDesign(design);
      setActiveTab('layers');
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      const msg =
        code === 'PSD_TOO_LARGE' || code === 'IMAGE_TOO_LARGE'
          ? isAr
            ? 'الملف كبير جداً.'
            : 'File is too large.'
          : code === 'PSD_NO_LAYERS'
            ? isAr
              ? 'لا توجد طبقات قابلة للقراءة في الملف.'
              : 'No readable layers in that file.'
            : code === 'UNSUPPORTED_FILE'
              ? isAr
                ? 'الصيغ المدعومة: بي إس دي، بي إن جي، جيه بي جيه، ويب بي.'
                : 'Supported: PSD, PNG, JPG, WebP.'
              : isAr
                ? 'تعذر استيراد التصميم.'
                : 'Could not import that design.';
      toast(msg, 'error');
    } finally {
      setIsImportingDesign(false);
    }
  };

  // Export Canvas as High-Res Data URL
  const exportCanvasDataUrl = (format: 'image/png' | 'image/webp' | 'image/jpeg' = 'image/webp') => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL(format, 0.95);
  };

  // Handle Export / Download
  const handleDownload = (format: 'webp' | 'png' | 'jpg' = 'png') => {
    const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const dataUrl = exportCanvasDataUrl(mime);
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${(docTitle || 'studio-design').toLowerCase().replace(/\s+/g, '-')}.${format}`;
    a.click();
    toast(isAr ? 'تم تنزيل التصميم بجودة عالية!' : 'Design downloaded in high quality!', 'success');
  };

  // Handle Open Social Media Modal
  const handleOpenSocialModal = () => {
    const dataUrl = exportCanvasDataUrl('image/webp');
    if (!dataUrl) return;
    setSocialExportDataUrl(dataUrl);
    setSocialModalOpen(true);
  };

  // Save to Media Library
  const handleSaveToMedia = () => {
    const dataUrl = exportCanvasDataUrl('image/webp');
    if (!dataUrl) return;
    onSaveNewAsset(dataUrl, docTitle, canvasW, canvasH);
    setSavedToMediaLibrary(true);
    toast(isAr ? 'تم حفظ التصميم في مكتبة وسائط المتجر!' : 'Saved to Store Media Library!', 'success');
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const elementSelectionRect = selectedElement
    ? layoutCacheRef.current[selectedElement.id] ?? estimateElementBounds(selectedElement)
    : null;
  const productSelectionRect =
    productHeroSelected && productBoundsRef.current ? productBoundsRef.current : null;
  void layoutEpoch;
  const isPage = variant === 'page';

  const resizeHandle = (
    corner: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w',
    style: React.CSSProperties,
    cursor: string,
    onResize: (c: typeof corner, e: React.MouseEvent | React.TouchEvent) => void,
    edge = false,
  ) => (
    <div
      key={corner}
      className={`cs-selection-handle ${edge ? 'cs-selection-handle-edge' : ''}`}
      style={{ ...style, cursor }}
      onMouseDown={(e) => onResize(corner, e)}
      onTouchStart={(e) => onResize(corner, e)}
    />
  );

  const studioTabs = [
    { id: 'templates' as const, label: isAr ? 'القوالب' : 'Templates', icon: FolderKanban },
    { id: 'elements' as const, label: isAr ? 'العناصر' : 'Elements', icon: Compass },
    { id: 'text' as const, label: isAr ? 'النص' : 'Text', icon: Type },
    { id: 'layers' as const, label: isAr ? 'الموضع' : 'Position', icon: Layers },
    { id: 'store_assets' as const, label: isAr ? 'المتجر' : 'Store', icon: Package },
    { id: 'colors' as const, label: isAr ? 'الألوان' : 'Brand', icon: Palette },
    { id: 'media' as const, label: isAr ? 'الرفع' : 'Uploads', icon: Upload },
    { id: 'filters' as const, label: isAr ? 'الضبط' : 'Adjust', icon: Sliders },
  ];

  const layerLabel = (el: CanvasElement) => {
    if (el.type === 'image') return el.text || (isAr ? 'صورة' : 'Image');
    if (el.type === 'shape') return isAr ? `شكل ·${el.shapeType || ''}` : `Shape · ${el.shapeType || ''}`;
    if (el.type === 'icon') return isAr ? 'أيقونة' : 'Icon';
    return (el.text || el.type).split('\n')[0].slice(0, 28) || el.type;
  };

  const rectsOverlap = (a: StudioRect, b: StudioRect) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const getLayerRect = (el: CanvasElement): StudioRect =>
    layoutCacheRef.current[el.id] ?? estimateElementBounds(el);

  const layersForPanel = (() => {
    const topFirst = [...elements].reverse();
    if (layersFilter !== 'overlapping' || !selectedElementId) return topFirst;
    const sel = elements.find((e) => e.id === selectedElementId);
    if (!sel) return topFirst;
    const selRect = getLayerRect(sel);
    return topFirst.filter((el) => el.id === sel.id || rectsOverlap(getLayerRect(el), selRect));
  })();

  const backdropPreviewCss = (() => {
    const bd = STUDIO_BACKDROPS.find((b) => b.id === selectedBackdrop);
    if (selectedBackdrop === 'custom') return customSolidColor;
    if (selectedBackdrop === 'custom_gradient') {
      return gradientType === 'radial'
        ? `radial-gradient(circle, ${gradientColor1}, ${gradientColor2}, ${gradientColor3})`
        : `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2}, ${gradientColor3})`;
    }
    if (!bd || bd.css === 'transparent' || bd.css === 'checker') return '#ffffff';
    return bd.css;
  })();

  const openPositionPanel = (sub: 'arrange' | 'layers' = 'layers') => {
    setActiveTab('layers');
    setLayersSubTab(sub);
  };

  if (!isOpen) return null;

  const studioPanel = (
      <div
        className={`canva-studio-light w-full overflow-hidden flex flex-col select-none ${
          isPage
            ? 'h-full min-h-0 rounded-none border-0'
            : 'max-w-7xl h-[95vh] rounded-xl border border-slate-200 bg-white text-slate-900'
        }`}
        style={{ background: '#ffffff', color: '#111827' }}
      >
        {/* ── TOP CANVA NAVBAR ── */}
        <div className="cs-header px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
          {/* Left: Studio Brand & Editable Title */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg text-white flex items-center justify-center font-black text-sm cs-btn-primary"
              style={{ background: 'var(--accent, #1d8b94)' }}
            >
              S
            </div>

            {/* Resize Button & Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowResizeMenu(!showResizeMenu)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-white text-slate-800"
              >
                <span>{canvasW}×{canvasH}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showResizeMenu && (
                <div className="absolute start-0 top-full mt-1.5 w-64 rounded-lg border border-slate-200 bg-white p-2 z-50 space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-500 px-2 py-1">
                    {isAr ? 'تغيير أبعاد التصميم' : 'Design size'}
                  </div>
                  {[
                    { label: 'Instagram Square (1:1)', w: 1080, h: 1080 },
                    { label: 'Instagram / TikTok Story (9:16)', w: 1080, h: 1920 },
                    { label: 'Feed Portrait (4:5)', w: 1080, h: 1350 },
                    { label: 'Store Hero Banner (16:9)', w: 1600, h: 600 },
                    { label: 'Meta & Google Ads Banner', w: 1200, h: 628 },
                    { label: 'Logo & Brand Badge (1:1)', w: 800, h: 800 },
                    { label: 'Category Wide Cover', w: 1200, h: 800 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setCanvasW(preset.w);
                        setCanvasH(preset.h);
                        setShowResizeMenu(false);
                        toast(isAr ? `تم تغيير المقاس إلى${preset.w}×${preset.h}` : `Resized to ${preset.w}×${preset.h}`, 'info');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-start text-xs font-bold hover:bg-slate-100 flex items-center justify-between cursor-pointer text-slate-800"
                    >
                      <span className="truncate">{preset.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{preset.w}×{preset.h}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Editable Title */}
            {isEditingTitle ? (
              <input
                type="text"
                value={docTitle}
                autoFocus
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                onChange={(e) => setDocTitle(e.target.value)}
                className="px-2 py-1 rounded-lg border bg-white text-xs font-bold text-slate-900 max-w-[220px] cs-accent-border"
                style={{ borderColor: 'var(--accent, #1d8b94)' }}
              />
            ) : (
              <span
                onClick={() => setIsEditingTitle(true)}
                title={isAr ? 'انقر لتعديل اسم التصميم' : 'Click to edit title'}
                className="text-xs font-bold text-slate-800 hover:text-slate-950 cursor-pointer px-1.5 py-1 rounded-md hover:bg-slate-100 transition-colors truncate max-w-[240px]"
              >
                {docTitle} ✎
              </span>
            )}

            {/* Honest save status — never claim cloud save without media write */}
            <span
              className={`hidden sm:flex items-center gap-1 text-[11px] ${
                savedToMediaLibrary ? 'cs-accent-text' : 'text-slate-500'
              }`}
              style={savedToMediaLibrary ? { color: 'var(--accent, #1d8b94)' } : undefined}
            >
              {savedToMediaLibrary ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAr ? 'محفوظ في مكتبة الوسائط' : 'Saved to media library'}</span>
                </>
              ) : (
                <span>{isAr ? 'مسودة — لم يُحفظ بعد' : 'Draft — not saved yet'}</span>
              )}
            </span>
          </div>

          {/* Center: Undo & Redo */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              title={isAr ? 'تراجع' : 'Undo (Ctrl+Z)'}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              title={isAr ? 'إعادة' : 'Redo (Ctrl+Y)'}
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Actions & Share/Post Button */}
          <div className="flex items-center gap-2">
            {/* Download dropdown */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleDownload('png')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer text-slate-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isAr ? 'تنزيل' : 'Export'}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveToMedia}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer cs-active-soft"
                style={{
                  borderColor: 'var(--accent, #1d8b94)',
                  color: 'var(--accent, #1d8b94)',
                  background: 'color-mix(in srgb, var(--accent, #1d8b94) 12%, white)',
                }}
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isAr ? 'حفظ بالمتجر' : 'Save to Media'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenSocialModal}
              className="px-3.5 py-1.5 rounded-lg text-xs font-black text-white flex items-center gap-1.5 cursor-pointer cs-btn-primary"
              style={{ background: 'var(--accent, #1d8b94)' }}
            >
              <Share2 className="w-4 h-4" />
              <span>{isAr ? 'نشر في وسائل التواصل' : 'Post to Social Media'}</span>
            </button>

            {!isPage && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN WORKSPACE (LEFT DOCK + LEFT FLYOUT PANEL + CANVAS) ── */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Vertical Icon Dock */}
          <div className="cs-dock w-16 border-e flex flex-col items-center py-2 gap-1 shrink-0 z-30">
            {studioTabs.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-14 py-2.5 px-1 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center ${
                    active ? 'cs-dock-active' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-[9.5px] font-bold truncate max-w-full leading-tight">
                    {tab.label}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              className="lg:hidden w-14 py-2 mt-1 rounded-lg flex flex-col items-center justify-center gap-0.5 cs-dock-active cursor-pointer"
              onClick={() => setFlyoutOpen((v) => !v)}
              title={isAr ? 'الأدوات' : 'Tools panel'}
            >
              <PanelLeft className="w-5 h-5" />
              <span className="text-[9px] font-bold">{isAr ? 'لوحة' : 'Panel'}</span>
            </button>
          </div>

          {flyoutOpen && (
            <button
              type="button"
              className="cs-flyout-backdrop lg:hidden border-0 p-0 cursor-pointer"
              aria-label={isAr ? 'إغلاق اللوحة' : 'Close panel'}
              onClick={() => setFlyoutOpen(false)}
            />
          )}

          {/* Left Flyout Subpanel — white / black like Canva */}
          <div
            className={`cs-flyout cs-flyout-drawer lg:static w-80 border-e border-slate-200 flex-col shrink-0 overflow-y-auto p-4 space-y-4 bg-white text-slate-900 ${
              flyoutOpen ? 'flex' : 'hidden'
            } lg:flex`}
            data-open={flyoutOpen ? 'true' : 'false'}
          >
            {/* 1. TEMPLATES TAB */}
            {activeTab === 'templates' && (
              <div className="cs-templates-panel">
                <CanvaTemplatesPanel
                  store={activeStore}
                  isAr={isAr}
                  selectedTemplateId={selectedTemplateId}
                  lockedCategory={
                    lockCategory
                      ? uploadCategory
                      : editorKind === 'logo'
                        ? 'logo'
                        : editorKind === 'product_card'
                          ? 'product'
                          : editorKind === 'banner'
                            ? 'banner'
                            : undefined
                  }
                  activeImageUrl={activeImageUrl}
                  previewProduct={currentProducts[0] || null}
                  myTemplates={myTemplates}
                  onApply={applyCanvaTemplate}
                  onApplyMyTemplate={(tpl) => {
                    const payload = myTemplateToDesignPayload(tpl);
                    applyImportedDesign(
                      {
                        width: payload.width,
                        height: payload.height,
                        name: isAr ? tpl.nameAr || tpl.nameEn : tpl.nameEn,
                        source: tpl.source === 'studio' ? 'image' : tpl.source,
                        layers: payload.layers,
                        previewDataUrl: payload.previewDataUrl,
                        categoryHint: tpl.category,
                      },
                      { templateId: tpl.id, keepCategory: true },
                    );
                    setUploadCategory(tpl.category);
                  }}
                  onDeleteMyTemplate={async (tplId) => {
                    await deleteMyCanvaTemplate(activeStore.id, tplId);
                    await refreshMyTemplates();
                    toast(isAr ? 'تم حذف القالب.' : 'Template deleted.', 'info');
                  }}
                  onOpenUploadTab={() => setActiveTab('media')}
                  onRequestPro={() => {
                    toast(
                      isAr ? 'القوالب الإضافية متاحة مع باقة برو.' : 'Extra templates unlock with Pro.',
                      'info',
                    );
                  }}
                  onSelectFormatPreset={(w, h, label) => {
                    setCanvasW(w);
                    setCanvasH(h);
                    toast(isAr ? `المقاس:${label}` : `Design size: ${label}`, 'info');
                  }}
                />
              </div>
            )}

            {/* 2. ELEMENTS TAB (Shapes, Icons, Badges) */}
            {activeTab === 'elements' && (
              <div className="space-y-4">
                {/* Shapes Subsection */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase text-slate-400">
                    {isAr ? 'الأشكال الهندسية والمنحنيات' : 'Shapes & Curves'}
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddShape('circle')}
                      className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <Circle className="w-5 h-5 text-sky-400" />
                      <span className="text-[9px] font-bold">{isAr ? 'دائرة' : 'Circle'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddShape('rectangle')}
                      className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <Square className="w-5 h-5 text-indigo-400" />
                      <span className="text-[9px] font-bold">{isAr ? 'مستطيل' : 'Rect'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddShape('triangle')}
                      className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <Triangle className="w-5 h-5 text-emerald-400" />
                      <span className="text-[9px] font-bold">{isAr ? 'مثلث' : 'Triangle'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddShape('star')}
                      className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <Star className="w-5 h-5 text-amber-400" />
                      <span className="text-[9px] font-bold">{isAr ? 'نجمة' : 'Star'}</span>
                    </button>
                  </div>

                  {/* Canva Modern Waves & Dot Grids */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAddShape('wave_curve')}
                      className="p-2.5 rounded-xl border border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/40 text-blue-300 flex items-center justify-center gap-2 cursor-pointer font-bold text-xs"
                    >
                      <Compass className="w-4 h-4 text-blue-400" />
                      <span>{isAr ? 'منحنى أزرق' : 'Wave curve'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddShape('dot_grid')}
                      className="p-2.5 rounded-xl border border-sky-500/40 bg-sky-950/30 hover:bg-sky-900/40 text-sky-300 flex items-center justify-center gap-2 cursor-pointer font-bold text-xs"
                    >
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>{isAr ? 'شبكة نقاط ديكور' : 'Dot Matrix'}</span>
                    </button>
                  </div>
                </div>

                {/* Icons Subsection */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-black uppercase text-slate-400">
                    {isAr ? 'الأيقونات والرموز التعبيرية' : 'Icons & Badges'}
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_ICONS.map((ic) => (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => handleAddIcon(ic.id)}
                        className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <span className="text-lg">{ic.glyph}</span>
                        <span className="text-[8.5px] text-slate-300 truncate max-w-full">
                          {isAr ? ic.labelAr : ic.labelEn}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Promotional Badges */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-black uppercase text-slate-400">
                    {isAr ? 'شارات وعروض التخفيض' : 'Sale Badges & KSA Seals'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_BADGES.map((b, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddBadgeElement(isAr ? b.textAr : b.textEn, b.color, b.style)}
                        className="p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-transform hover:scale-105"
                        style={{
                          borderColor: b.color,
                          background: `${b.color}20`,
                          color: b.color,
                        }}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{isAr ? b.textAr : b.textEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. TEXT TAB */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <span className="text-xs font-black uppercase text-slate-400">
                  {isAr ? 'إضافة نصوص جديدة' : 'Add text to design'}
                </span>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleAddTextElement('headline', isAr ? 'عنوان عريض وجذاب' : 'Add a heading')}
                    className="w-full py-3 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-base font-black text-slate-900 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? 'إضافة عنوان رئيسي' : 'Add a heading'}</span>
                    <Plus className="w-4 h-4 text-violet-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTextElement('subtitle', isAr ? 'وصف فرعي للمنتج والخدمة' : 'Add a subheading')}
                    className="w-full py-2.5 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-800 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? 'إضافة نص فرعي' : 'Add a subheading'}</span>
                    <Plus className="w-4 h-4 text-violet-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTextElement('custom_text', isAr ? 'نص توضيحي ومعلومات إضافية' : 'Add a little bit of body text')}
                    className="w-full py-2 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? 'إضافة نص توضيحي' : 'Add body text'}</span>
                    <Plus className="w-4 h-4 text-violet-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTextElement('custom_text', isAr ? '• ميزة أولى\n• ميزة ثانية\n• ميزة ثالثة' : '• First feature\n• Second feature\n• Third feature')}
                    className="w-full py-2 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? '• قائمة نقاط مميزات' : '• Bullet point list'}</span>
                    <Plus className="w-4 h-4 text-violet-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAddBadgeElement(isAr ? 'تواصل معنا' : "Let's Talk", '#1d8b94', 'pill')
                    }
                    className="w-full py-2 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? 'زر إجراء' : 'CTA button'}</span>
                    <Plus className="w-4 h-4 text-violet-600" />
                  </button>
                </div>

                {/* KSA Marketing Quotes */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-black uppercase text-slate-400">
                    {isAr ? 'عبارات تسويقية جاهزة' : 'Quick KSA Presets'}
                  </span>
                  <div className="space-y-1.5">
                    {QUICK_KSA_TEXTS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddTextElement('headline', isAr ? q.textAr : q.textEn)}
                        className="w-full p-2 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 text-[11px] font-bold text-start flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{isAr ? q.textAr : q.textEn}</span>
                        <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3b. POSITION — Arrange + Layers (Canva-style) */}
            {activeTab === 'layers' && (
              <div className="cs-position-panel space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500">
                    {isAr ? 'الموضع' : 'Position'}
                  </span>
                  <span className="text-[10px] text-slate-500">{elements.length}</span>
                </div>

                <div className="cs-position-tabs flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setLayersSubTab('arrange')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-md cursor-pointer ${
                      layersSubTab === 'arrange' ? 'cs-active' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    {isAr ? 'ترتيب' : 'Arrange'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayersSubTab('layers')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-md cursor-pointer ${
                      layersSubTab === 'layers' ? 'cs-active' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    {isAr ? 'الطبقات' : 'Layers'}
                  </button>
                </div>

                {layersSubTab === 'arrange' && (
                  <div className="space-y-3">
                    {!selectedElementId ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        {isAr
                          ? 'حدد عنصراً على اللوحة لترتيب موضعه.'
                          : 'Select an element on the canvas to arrange it.'}
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={bringElementForward}
                            className="cs-arrange-btn flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                            {isAr ? 'للأمام' : 'Forward'}
                          </button>
                          <button
                            type="button"
                            onClick={sendElementBackward}
                            className="cs-arrange-btn flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                            {isAr ? 'للخلف' : 'Backward'}
                          </button>
                          <button
                            type="button"
                            onClick={bringElementToFront}
                            className="cs-arrange-btn flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            <BringToFront className="w-3.5 h-3.5" />
                            {isAr ? 'إلى المقدمة' : 'To front'}
                          </button>
                          <button
                            type="button"
                            onClick={sendElementToBack}
                            className="cs-arrange-btn flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            <SendToBack className="w-3.5 h-3.5" />
                            {isAr ? 'إلى الخلفية' : 'To back'}
                          </button>
                        </div>

                        <div className="pt-1 border-t border-slate-200 space-y-2">
                          <span className="text-[10px] font-black uppercase text-slate-500">
                            {isAr ? 'محاذاة مع الصفحة' : 'Align to page'}
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(
                              [
                                ['left', isAr ? 'يسار' : 'Left'],
                                ['h-center', isAr ? 'وسط أفقي' : 'H center'],
                                ['right', isAr ? 'يمين' : 'Right'],
                                ['top', isAr ? 'أعلى' : 'Top'],
                                ['v-center', isAr ? 'وسط رأسي' : 'V center'],
                                ['bottom', isAr ? 'أسفل' : 'Bottom'],
                              ] as const
                            ).map(([mode, label]) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => alignSelectedToPage(mode)}
                                className="py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 cursor-pointer"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {selectedElement && (
                          <div className="pt-1 border-t border-slate-200 space-y-2">
                            <span className="text-[10px] font-black uppercase text-slate-500">
                              {isAr ? 'متقدم' : 'Advanced'}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {(
                                [
                                  ['x', isAr ? 'س' : 'X', selectedElement.x],
                                  ['y', isAr ? 'ص' : 'Y', selectedElement.y],
                                  [
                                    'width',
                                    isAr ? 'عرض' : 'W',
                                    selectedElement.width ||
                                      Math.round(getLayerRect(selectedElement).w),
                                  ],
                                  [
                                    'height',
                                    isAr ? 'ارتفاع' : 'H',
                                    selectedElement.height ||
                                      Math.round(getLayerRect(selectedElement).h),
                                  ],
                                  ['rotation', isAr ? 'دوران' : 'Rotate', selectedElement.rotation || 0],
                                ] as const
                              ).map(([key, label, val]) => (
                                <label
                                  key={key}
                                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1"
                                >
                                  <span className="text-[10px] text-slate-500 w-8 shrink-0">{label}</span>
                                  <input
                                    type="number"
                                    value={Math.round(Number(val))}
                                    onChange={(e) => {
                                      const n = Number(e.target.value);
                                      if (Number.isNaN(n)) return;
                                      if (key === 'x' || key === 'y' || key === 'rotation') {
                                        updateSelectedElement({ [key]: n }, false);
                                      } else {
                                        updateSelectedElement({ [key]: Math.max(8, n) }, false);
                                      }
                                    }}
                                    onBlur={() => pushHistorySnapshot()}
                                    className="w-full text-[11px] font-mono font-bold text-slate-800 bg-transparent outline-none"
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {layersSubTab === 'layers' && (
                  <div className="space-y-2">
                    <div className="cs-layers-filter flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setLayersFilter('all')}
                        className={`flex-1 py-1.5 text-[11px] font-bold cursor-pointer ${
                          layersFilter === 'all' ? 'cs-active-soft' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isAr ? 'الكل' : 'All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLayersFilter('overlapping')}
                        disabled={!selectedElementId}
                        className={`flex-1 py-1.5 text-[11px] font-bold cursor-pointer disabled:opacity-40 ${
                          layersFilter === 'overlapping'
                            ? 'cs-active-soft'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isAr ? 'المتداخلة' : 'Overlapping'}
                      </button>
                    </div>

                    {elements.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">
                        {isAr
                          ? 'لا توجد طبقات بعد. أضف نصاً أو صورة أو عنصراً.'
                          : 'No layers yet. Add text, an image, or an element.'}
                      </p>
                    ) : (
                      <div className="space-y-1 max-h-[min(480px,52vh)] overflow-y-auto pe-1">
                        {layersForPanel.map((el) => {
                          const active = selectedElementId === el.id;
                          return (
                            <div
                              key={el.id}
                              role="button"
                              tabIndex={0}
                              draggable={!el.locked}
                              onDragStart={(ev) => {
                                setLayerDragId(el.id);
                                ev.dataTransfer.effectAllowed = 'move';
                                ev.dataTransfer.setData('text/plain', el.id);
                              }}
                              onDragOver={(ev) => {
                                ev.preventDefault();
                                ev.dataTransfer.dropEffect = 'move';
                              }}
                              onDrop={(ev) => {
                                ev.preventDefault();
                                const dragId =
                                  layerDragId || ev.dataTransfer.getData('text/plain');
                                reorderLayerByDrop(dragId, el.id);
                                setLayerDragId(null);
                              }}
                              onDragEnd={() => setLayerDragId(null)}
                              onKeyDown={(ev) => {
                                if (ev.key === 'Enter' || ev.key === ' ') {
                                  ev.preventDefault();
                                  setSelectedElementId(el.id);
                                }
                              }}
                              onClick={() => setSelectedElementId(el.id)}
                              className={`cs-layer-row w-full px-2 py-1.5 rounded-lg text-start flex items-center gap-2 cursor-pointer ${
                                active ? 'cs-layer-active' : ''
                              } ${el.hidden ? 'opacity-45' : ''} ${
                                layerDragId === el.id ? 'cs-layer-dragging' : ''
                              }`}
                            >
                              <GripVertical
                                className="w-3.5 h-3.5 shrink-0 text-slate-400 cs-layer-grip"
                                aria-hidden
                              />
                              <div
                                className="cs-layer-thumb shrink-0 w-9 h-9 rounded-md border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50"
                                style={
                                  el.type === 'image' && el.imageUrl
                                    ? {
                                        backgroundImage: `url(${el.imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                      }
                                    : el.type === 'shape'
                                      ? {
                                          background:
                                            el.bgColor && el.bgColor !== 'transparent'
                                              ? el.bgColor
                                              : el.fontColor || '#94a3b8',
                                        }
                                      : el.bgColor && el.bgColor !== 'transparent'
                                        ? { background: el.bgColor }
                                        : undefined
                                }
                              >
                                {el.type !== 'image' && el.type !== 'shape' ? (
                                  <span
                                    className="text-[8px] font-black truncate px-0.5 max-w-full"
                                    style={{
                                      color: el.fontColor || '#0f172a',
                                      fontFamily: el.fontFamily || (isAr ? 'Tajawal' : 'Outfit'),
                                    }}
                                  >
                                    {layerLabel(el).slice(0, 6)}
                                  </span>
                                ) : null}
                              </div>
                              <span className="flex-1 text-[11px] font-bold truncate text-slate-800">
                                {layerLabel(el)}
                              </span>
                              <button
                                type="button"
                                className="p-1 rounded text-slate-500 hover:bg-slate-100"
                                title={el.hidden ? (isAr ? 'إظهار' : 'Show') : isAr ? 'إخفاء' : 'Hide'}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setElements((prev) =>
                                    prev.map((x) =>
                                      x.id === el.id ? { ...x, hidden: !x.hidden } : x,
                                    ),
                                  );
                                  pushHistorySnapshot();
                                }}
                              >
                                {el.hidden ? (
                                  <EyeOff className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                className="p-1 rounded text-slate-500 hover:bg-slate-100"
                                title={el.locked ? (isAr ? 'فتح القفل' : 'Unlock') : isAr ? 'قفل' : 'Lock'}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setElements((prev) =>
                                    prev.map((x) =>
                                      x.id === el.id ? { ...x, locked: !x.locked } : x,
                                    ),
                                  );
                                  pushHistorySnapshot();
                                }}
                              >
                                {el.locked ? (
                                  <LockKeyhole className="w-3 h-3 text-amber-500" />
                                ) : (
                                  <Unlock className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                className="p-1 rounded text-rose-500 hover:bg-rose-50"
                                title={isAr ? 'حذف' : 'Delete'}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setElements((prev) => prev.filter((x) => x.id !== el.id));
                                  if (selectedElementId === el.id) setSelectedElementId(null);
                                  pushHistorySnapshot();
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Background layer (always bottom, like Canva) */}
                        <button
                          type="button"
                          onClick={() => setActiveTab('colors')}
                          className="cs-layer-row cs-layer-bg w-full px-2 py-1.5 rounded-lg text-start flex items-center gap-2 cursor-pointer border border-dashed border-slate-200"
                        >
                          <span className="w-3.5 shrink-0" />
                          <div
                            className="cs-layer-thumb shrink-0 w-9 h-9 rounded-md border border-slate-200"
                            style={{ background: backdropPreviewCss }}
                          />
                          <span className="flex-1 text-[11px] font-bold truncate text-slate-700">
                            {isAr ? 'لون الخلفية' : 'Background color'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4. STORE ASSETS (Products & Categories) */}
            {activeTab === 'store_assets' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-500">
                      {isAr ? 'منتجات المتجر (نقرة واحدة للإدراج)' : 'Store Products'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">{currentProducts.length}</span>
                  </div>
                  {currentProducts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                      {isAr ? 'لا توجد منتجات في هذا المتجر' : 'No products in this store'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pe-1">
                      {currentProducts.map((p) => {
                        const label = isAr ? p.nameAr || p.name : p.name;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              loadStudioImage(p.image);
                              handleAddTextElement('headline', label);
                              if (p.price != null && p.price !== '') {
                                handleAddTextElement('price', formatStudioPrice(p.price));
                              }
                              toast(
                                isAr ? `تم إدراج منتج: ${label}` : `Product loaded: ${label}`,
                                'success',
                              );
                            }}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 text-start flex flex-col justify-between cursor-pointer transition-all group"
                          >
                            <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden mb-1.5 flex items-center justify-center p-1">
                              <img
                                src={p.image}
                                alt={label}
                                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-900 truncate w-full">{label}</span>
                            <span className="text-[9px] text-emerald-700 font-mono font-bold">
                              {formatStudioPrice(p.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-black uppercase text-slate-500">
                    {isAr ? 'تصنيفات المتجر' : 'Store Categories'}
                  </span>
                  <div className="space-y-1.5">
                    {(activeStore.categories?.length ?? 0) === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500">
                        {isAr ? 'لا توجد تصنيفات' : 'No categories'}
                      </div>
                    ) : (
                      activeStore.categories?.map((cat, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            handleAddTextElement('headline', cat);
                            handleAddTextElement(
                              'subtitle',
                              isAr ? 'تسوق تشكيلة التصنيف كاملة' : 'Browse full collection',
                            );
                            toast(
                              isAr ? `تم إدراج تصنيف: ${cat}` : `Category added: ${cat}`,
                              'info',
                            );
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 text-xs font-bold text-slate-800 text-start flex items-center justify-between cursor-pointer"
                        >
                          <span>{cat}</span>
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Store Logo */}
                {activeStore.logo && (
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        const newLogoEl: CanvasElement = {
                          id: `logo-${Date.now()}`,
                          type: 'image',
                          text: isAr ? activeStore.nameAr || activeStore.name : activeStore.name,
                          imageUrl: activeStore.logo,
                          x: Math.round(canvasW * 0.15),
                          y: Math.round(canvasH * 0.12),
                          width: 120,
                          height: 120,
                          fontSize: 16,
                          fontColor: '#0f172a',
                          borderRadius: 16,
                        };
                        setElements((prev) => {
                          const next = [...prev, newLogoEl];
                          queueMicrotask(() => pushHistorySnapshot(next));
                          return next;
                        });
                        setSelectedElementId(newLogoEl.id);
                        toast(isAr ? 'تمت إضافة شعار المتجر!' : 'Store logo added to canvas!', 'info');
                      }}
                      className="w-full p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>{isAr ? 'إدراج شعار المتجر على التصميم' : 'Insert store logo'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. BRAND & COLORS / GRADIENTS */}
            {activeTab === 'colors' && (
              <div className="space-y-4">
                <span className="text-xs font-black uppercase text-slate-400">
                  {isAr ? 'خلفيات وتدرجات لونية' : 'Background & Gradients'}
                </span>

                {/* Curated Gradients */}
                <div className="grid grid-cols-2 gap-2">
                  {STUDIO_BACKDROPS.map((bd) => (
                    <button
                      key={bd.id}
                      type="button"
                      onClick={() => {
                        setSelectedBackdrop(bd.id);
                        pushHistorySnapshot();
                      }}
                      className={`p-2.5 rounded-xl border text-start cursor-pointer transition-all flex flex-col justify-between h-16 ${
                        selectedBackdrop === bd.id
                          ? 'ring-2 ring-purple-500 border-purple-500'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                      style={{
                        background: bd.css === 'checker' ? '#1e293b' : bd.css,
                      }}
                    >
                      <span
                        className="text-[10px] font-black truncate"
                        style={{
                          color:
                            bd.id === 'soft-ivory' ||
                            bd.id === 'coffee-cream' ||
                            bd.id === 'checker' ||
                            bd.css.includes('#f') ||
                            bd.css.includes('#e') ||
                            bd.css.includes('#fff')
                              ? '#111827'
                              : '#ffffff',
                        }}
                      >
                        {isAr ? bd.labelAr : bd.labelEn}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Gradient Generator */}
                <div className="p-3 rounded-2xl border border-slate-800 bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {isAr ? 'مولّد تدرجات مخصص' : 'Custom Gradient Builder'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBackdrop('custom_gradient');
                        pushHistorySnapshot();
                      }}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-600 text-white cursor-pointer"
                    >
                      {isAr ? 'تطبيق التدرج' : 'Apply Gradient'}
                    </button>
                  </div>

                  {/* Gradient Angle */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{isAr ? 'زاوية التدرج' : 'Gradient Angle'}</span>
                      <span>{gradientAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={gradientAngle}
                      onChange={(e) => {
                        setGradientAngle(Number(e.target.value));
                        setSelectedBackdrop('custom_gradient');
                      }}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* 3 Color Pickers */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] text-slate-400">{isAr ? 'اللون 1' : 'Color 1'}</span>
                      <input
                        type="color"
                        value={gradientColor1}
                        onChange={(e) => {
                          setGradientColor1(e.target.value);
                          setSelectedBackdrop('custom_gradient');
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] text-slate-400">{isAr ? 'اللون 2' : 'Color 2'}</span>
                      <input
                        type="color"
                        value={gradientColor2}
                        onChange={(e) => {
                          setGradientColor2(e.target.value);
                          setSelectedBackdrop('custom_gradient');
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] text-slate-400">{isAr ? 'اللون 3' : 'Color 3'}</span>
                      <input
                        type="color"
                        value={gradientColor3}
                        onChange={(e) => {
                          setGradientColor3(e.target.value);
                          setSelectedBackdrop('custom_gradient');
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. MEDIA & UPLOADS */}
            {activeTab === 'media' && (
              <div className="space-y-4">
                <div className="space-y-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50/60">
                  <div className="text-[11px] font-black text-slate-900">
                    {isAr
                      ? 'رفع تصميم من كانفا أو فوتوشوب'
                      : 'Upload from Canva / Photoshop'}
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    {isAr
                      ? 'من كانفا: نزّل كملف بي إس دي أو صورة، ثم ارفعه هنا. الطبقات تُفتح للتعديل (بنر، إعلان، منشور، شعار، منتج…).'
                      : 'From Canva: download as PSD or image, then upload here. Layers open editable (banner, ads, post, logo, product…).'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {CANVA_UPLOAD_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setUploadCategory(c.id)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-black border cursor-pointer ${
                          uploadCategory === c.id
                            ? 'text-white border-transparent'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                        style={
                          uploadCategory === c.id
                            ? { background: 'var(--accent, #1d8b94)' }
                            : undefined
                        }
                      >
                        {isAr ? c.labelAr : c.labelEn}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={isImportingDesign}
                    onClick={() => designFileInputRef.current?.click()}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-white flex flex-col items-center justify-center text-center cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <input
                      ref={designFileInputRef}
                      type="file"
                      accept=".psd,image/vnd.adobe.photoshop,image/png,image/jpeg,image/webp,image/*"
                      className="hidden"
                      onChange={handleImportDesignFile}
                    />
                    <Upload className="w-6 h-6 text-emerald-700 mb-1.5" />
                    <span className="text-xs font-bold text-slate-900">
                      {isImportingDesign
                        ? isAr
                          ? 'جاري الاستيراد…'
                          : 'Importing…'
                        : isAr
                          ? 'رفع بي إس دي أو صورة كاملة كطبقات'
                          : 'Upload PSD / full image as layers'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {isAr
                        ? 'يستبدل اللوحة الحالية بطبقات قابلة للتعديل'
                        : 'Replaces canvas with editable layers'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveAsMyTemplate()}
                    className="w-full py-2 rounded-lg text-[11px] font-black text-white cursor-pointer"
                    style={{ background: 'var(--accent, #1d8b94)' }}
                  >
                    {isAr ? 'حفظ كقالب في قوالبي' : 'Save as My Template'}
                  </button>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-violet-500 bg-slate-50 hover:bg-violet-50 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/*"
                    className="hidden"
                    onChange={handleUploadLocalFile}
                  />
                  <Upload className="w-6 h-6 text-violet-600 mb-1.5" />
                  <span className="text-xs font-bold text-slate-900">
                    {isAr ? 'إضافة صورة كطبقة إضافية' : 'Add image as extra layer'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {isAr ? 'تُضاف فوق التصميم الحالي' : 'Adds on top of the current design'}
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={mediaSearchQuery}
                    onChange={(e) => setMediaSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث في الوسائط...' : 'Search media assets...'}
                    className="w-full ps-8 pe-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pe-1">
                  {currentMedia
                    .filter((asset) => {
                      if (!mediaSearchQuery.trim()) return true;
                      const q = mediaSearchQuery.toLowerCase();
                      return (
                        (asset.fileName || '').toLowerCase().includes(q) ||
                        (asset.title || '').toLowerCase().includes(q)
                      );
                    })
                    .map((asset) => {
                      const imgUrl = asset.thumbnailUrl || asset.webpUrl || asset.originalUrl;
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            const probe = new Image();
                            probe.onload = () => {
                              const maxSide = Math.min(canvasW, canvasH) * 0.4;
                              const ratio = Math.min(
                                maxSide / probe.naturalWidth,
                                maxSide / probe.naturalHeight,
                                1,
                              );
                              const w = Math.max(80, Math.round(probe.naturalWidth * ratio));
                              const h = Math.max(80, Math.round(probe.naturalHeight * ratio));
                              imageCacheRef.current[imgUrl] = probe;
                              const layer: CanvasElement = {
                                id: `img-${Date.now()}`,
                                type: 'image',
                                text: asset.title || asset.fileName || (isAr ? 'صورة' : 'Image'),
                                imageUrl: imgUrl,
                                x: Math.round(canvasW / 2),
                                y: Math.round(canvasH / 2),
                                width: w,
                                height: h,
                                fontSize: 16,
                                fontColor: '#0f172a',
                                borderRadius: 0,
                                opacity: 1,
                              };
                              setElements((prev) => [...prev, layer]);
                              setSelectedElementId(layer.id);
                              pushHistorySnapshot();
                              toast(
                                isAr ? 'تمت إضافة الصورة كطبقة!' : 'Image added as a layer!',
                                'success',
                              );
                            };
                            probe.src = imgUrl;
                          }}
                          className="aspect-square rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:border-violet-500 relative group bg-slate-50"
                        >
                          <img src={imgUrl} alt={asset.fileName} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                </div>
                {currentMedia.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">
                    {isAr ? 'لا توجد وسائط في هذا المتجر بعد.' : 'No media in this store yet.'}
                  </p>
                )}
              </div>
            )}

            {/* 7. FILTERS & ADJUST */}
            {activeTab === 'filters' && (
              <div className="space-y-4">
                {/* 1-Click AI Cutout Button */}
                <button
                  type="button"
                  onClick={handleAiRemoveBg}
                  disabled={isProcessingAi}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 cursor-pointer cs-btn-primary"
                  style={{ background: 'var(--accent, #1d8b94)' }}
                >
                  <Wand2 className="w-4 h-4" />
                  <span>
                    {isProcessingAi
                      ? isAr
                        ? 'جارٍ إزالة الخلفية...'
                        : 'Removing background...'
                      : bgRemoved
                        ? isAr
                          ? '✓ تمت إزالة الخلفية — إعادة'
                          : '✓ Background removed — re-run'
                        : isAr
                          ? 'إزالة خلفية الصورة'
                          : 'Remove image background'}
                  </span>
                </button>

                {/* Sliders */}
                <div className="space-y-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>{isAr ? 'السطوع' : 'Brightness'}</span>
                      <span className="font-mono">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={180}
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>{isAr ? 'التباين' : 'Contrast'}</span>
                      <span className="font-mono">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={180}
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>{isAr ? 'التشبع' : 'Saturation'}</span>
                      <span className="font-mono">{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>{isAr ? 'الضبابية' : 'Blur'}</span>
                      <span className="font-mono">{blurAmount}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={blurAmount}
                      onChange={(e) => setBlurAmount(Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setFlipH(!flipH)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${flipH ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 text-slate-700 bg-white'}`}
                    >
                      {isAr ? 'قلب أفقياً' : 'Flip horizontal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipV(!flipV)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${flipV ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 text-slate-700 bg-white'}`}
                    >
                      {isAr ? 'قلب رأسياً' : 'Flip vertical'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── CANVAS WORKSPACE & CONTEXTUAL TOOLBAR ── */}
          <div className="cs-workspace flex-1 flex flex-col justify-between p-3 sm:p-4 overflow-hidden min-w-0">
            {/* FLOATING CONTEXTUAL TOOLBAR ABOVE DESIGN */}
            <div className="cs-toolbar mb-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2 text-xs shrink-0 overflow-x-auto scrollbar-none">
              {selectedElement ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Text edit */}
                  {selectedElement.type !== 'shape' && selectedElement.type !== 'image' && (
                    <>
                      <input
                        type="text"
                        value={selectedElement.text}
                        onChange={(e) => updateSelectedElement({ text: e.target.value }, false)}
                        onBlur={() => pushHistorySnapshot()}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 min-w-[120px] max-w-[200px]"
                        placeholder={isAr ? 'تعديل النص...' : 'Edit text...'}
                      />
                      <select
                        value={selectedElement.fontFamily || 'Outfit'}
                        onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800"
                        title={isAr ? 'الخط' : 'Font'}
                      >
                        {CANVA_FONT_FAMILIES.map((f) => (
                          <option key={f.id} value={f.id}>
                            {isAr ? f.labelAr : f.labelEn}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedElement({ fontSize: Math.max(12, selectedElement.fontSize - 2) })
                          }
                          className="px-2 py-1 hover:bg-slate-100 text-slate-700 font-black cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 py-1 text-xs font-mono font-bold text-slate-900 min-w-[28px] text-center">
                          {selectedElement.fontSize}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedElement({ fontSize: Math.min(160, selectedElement.fontSize + 2) })
                          }
                          className="px-2 py-1 hover:bg-slate-100 text-slate-700 font-black cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-200 bg-white"
                        title={isAr ? 'لون النص' : 'Text color'}
                      >
                        <span className="text-[10px] text-slate-500">A</span>
                        <input
                          type="color"
                          value={selectedElement.fontColor}
                          onChange={(e) => updateSelectedElement({ fontColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-200 bg-white"
                        title={isAr ? 'خلفية النص' : 'Text fill'}
                      >
                        <span className="text-[10px] text-slate-500">{isAr ? 'خلفية' : 'Fill'}</span>
                        <input
                          type="color"
                          value={
                            !selectedElement.bgColor || selectedElement.bgColor === 'transparent'
                              ? '#ffffff'
                              : selectedElement.bgColor
                          }
                          onChange={(e) => updateSelectedElement({ bgColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ bgColor: 'transparent' })}
                          className="text-[9px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          {isAr ? 'إزالة' : 'Clear'}
                        </button>
                      </div>
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-200 bg-white"
                        title={isAr ? 'حدود النص' : 'Text border'}
                      >
                        <span className="text-[10px] text-slate-500">{isAr ? 'حد' : 'Border'}</span>
                        <input
                          type="color"
                          value={selectedElement.strokeColor || '#0f172a'}
                          onChange={(e) =>
                            updateSelectedElement({
                              strokeColor: e.target.value,
                              strokeWidth: Math.max(1, selectedElement.strokeWidth || 2),
                            })
                          }
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="range"
                          min={0}
                          max={12}
                          value={selectedElement.strokeWidth || 0}
                          onChange={(e) =>
                            updateSelectedElement({ strokeWidth: Number(e.target.value) })
                          }
                          className="w-12 accent-violet-600 cursor-pointer"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedElement({
                            shadowEnabled: !selectedElement.shadowEnabled,
                            shadowColor: selectedElement.shadowColor || 'rgba(0,0,0,0.4)',
                            shadowBlur: selectedElement.shadowBlur ?? 8,
                            shadowOffsetY: selectedElement.shadowOffsetY ?? 3,
                          })
                        }
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer ${
                          selectedElement.shadowEnabled
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        title={isAr ? 'ظل النص' : 'Text shadow'}
                      >
                        {isAr ? 'ظل' : 'Shadow'}
                      </button>
                      {selectedElement.shadowEnabled && (
                        <input
                          type="color"
                          value={(selectedElement.shadowColor || '#000000').slice(0, 7)}
                          onChange={(e) => updateSelectedElement({ shadowColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border border-slate-200"
                          title={isAr ? 'لون الظل' : 'Shadow color'}
                        />
                      )}
                      <select
                        value={
                          selectedElement.fontWeight ||
                          (selectedElement.isBold ? 'bold' : 'medium')
                        }
                        onChange={(e) => {
                          const fw = e.target.value as NonNullable<CanvasElement['fontWeight']>;
                          updateSelectedElement({
                            fontWeight: fw,
                            isBold: fw === 'bold' || fw === 'black',
                          });
                        }}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-800"
                        title={isAr ? 'سُمك الخط' : 'Font weight'}
                      >
                        <option value="light">{isAr ? 'خفيف' : 'Light'}</option>
                        <option value="regular">{isAr ? 'عادي' : 'Regular'}</option>
                        <option value="medium">{isAr ? 'متوسط' : 'Medium'}</option>
                        <option value="bold">{isAr ? 'عريض' : 'Bold'}</option>
                        <option value="black">{isAr ? 'ثقيل' : 'Black'}</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const nextBold = !(
                            selectedElement.fontWeight === 'bold' ||
                            selectedElement.fontWeight === 'black' ||
                            (!selectedElement.fontWeight && selectedElement.isBold)
                          );
                          updateSelectedElement({
                            isBold: nextBold,
                            fontWeight: nextBold ? 'bold' : 'regular',
                          });
                        }}
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          selectedElement.fontWeight === 'bold' ||
                          selectedElement.fontWeight === 'black' ||
                          (!selectedElement.fontWeight && selectedElement.isBold)
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        title={isAr ? 'عريض' : 'Bold'}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedElement({ isItalic: !selectedElement.isItalic })
                        }
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          selectedElement.isItalic
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        title={isAr ? 'مائل' : 'Italic'}
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedElement({ underline: !selectedElement.underline })
                        }
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          selectedElement.underline
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        title={isAr ? 'تسطير' : 'Underline'}
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedElement({
                            strikethrough: !selectedElement.strikethrough,
                          })
                        }
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          selectedElement.strikethrough
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        title={isAr ? 'شطب' : 'Strikethrough'}
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ textAlign: 'left' })}
                          className={`p-1.5 ${selectedElement.textAlign === 'left' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                          title={isAr ? 'محاذاة لليسار' : 'Align left'}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ textAlign: 'center' })}
                          className={`p-1.5 ${selectedElement.textAlign === 'center' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                          title={isAr ? 'توسيط' : 'Align center'}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ textAlign: 'right' })}
                          className={`p-1.5 ${selectedElement.textAlign === 'right' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                          title={isAr ? 'محاذاة لليمين' : 'Align right'}
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowSpacingPopover((v) => !v)}
                          className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer ${
                            showSpacingPopover
                              ? 'cs-active'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                          title={isAr ? 'المسافات' : 'Spacing'}
                        >
                          {isAr ? 'مسافات' : 'Spacing'}
                        </button>
                        {showSpacingPopover && (
                          <div className="cs-spacing-popover absolute start-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-slate-200 bg-white p-3 space-y-3">
                            <div className="flex gap-1 mb-1">
                              <span className="text-[10px] font-black uppercase text-slate-500">
                                {isAr ? 'المسافات' : 'Spacing'}
                              </span>
                            </div>
                            <label className="block space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                                <span>{isAr ? 'الحروف' : 'Letter'}</span>
                                <span className="font-mono">{selectedElement.letterSpacing ?? 0}</span>
                              </div>
                              <input
                                type="range"
                                min={-5}
                                max={40}
                                step={1}
                                value={selectedElement.letterSpacing ?? 0}
                                onChange={(e) =>
                                  updateSelectedElement(
                                    { letterSpacing: Number(e.target.value) },
                                    false,
                                  )
                                }
                                onMouseUp={() => pushHistorySnapshot()}
                                onTouchEnd={() => pushHistorySnapshot()}
                                className="w-full accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
                              />
                            </label>
                            <label className="block space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                                <span>{isAr ? 'ارتفاع السطر' : 'Line height'}</span>
                                <span className="font-mono">
                                  {(selectedElement.lineHeight ?? 1.35).toFixed(2)}
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0.8}
                                max={2.6}
                                step={0.05}
                                value={selectedElement.lineHeight ?? 1.35}
                                onChange={(e) =>
                                  updateSelectedElement(
                                    { lineHeight: Number(e.target.value) },
                                    false,
                                  )
                                }
                                onMouseUp={() => pushHistorySnapshot()}
                                onTouchEnd={() => pushHistorySnapshot()}
                                className="w-full accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
                              />
                            </label>
                            <div className="pt-1 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-slate-500 block mb-1.5">
                                {isAr ? 'محاذاة رأسية' : 'Anchor'}
                              </span>
                              <div className="flex gap-1">
                                {(
                                  [
                                    ['top', isAr ? 'أعلى' : 'Top'],
                                    ['middle', isAr ? 'وسط' : 'Middle'],
                                    ['bottom', isAr ? 'أسفل' : 'Bottom'],
                                  ] as const
                                ).map(([align, label]) => (
                                  <button
                                    key={align}
                                    type="button"
                                    onClick={() =>
                                      updateSelectedElement({ verticalAlign: align })
                                    }
                                    className={`flex-1 py-1 rounded-md border text-[9px] font-bold cursor-pointer ${
                                      (selectedElement.verticalAlign || 'middle') === align
                                        ? 'cs-active'
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Image resize / transform */}
                  {selectedElement.type === 'image' && (
                    <>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-200 bg-white">
                        <span className="text-[10px] text-slate-500">{isAr ? 'عرض' : 'W'}</span>
                        <input
                          type="range"
                          min={40}
                          max={Math.max(canvasW, 200)}
                          value={selectedElement.width || 180}
                          onChange={(e) =>
                            updateSelectedElement({ width: Number(e.target.value) }, false)
                          }
                          onMouseUp={() => pushHistorySnapshot()}
                          onTouchEnd={() => pushHistorySnapshot()}
                          className="w-16 accent-violet-600 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-200 bg-white">
                        <span className="text-[10px] text-slate-500">{isAr ? 'ارتفاع' : 'H'}</span>
                        <input
                          type="range"
                          min={40}
                          max={Math.max(canvasH, 200)}
                          value={selectedElement.height || 180}
                          onChange={(e) =>
                            updateSelectedElement({ height: Number(e.target.value) }, false)
                          }
                          onMouseUp={() => pushHistorySnapshot()}
                          onTouchEnd={() => pushHistorySnapshot()}
                          className="w-16 accent-violet-600 cursor-pointer"
                        />
                      </div>
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-200 bg-white"
                        title={isAr ? 'حدود الصورة' : 'Image border'}
                      >
                        <span className="text-[10px] text-slate-500">{isAr ? 'حد' : 'Border'}</span>
                        <input
                          type="color"
                          value={selectedElement.strokeColor || '#0f172a'}
                          onChange={(e) =>
                            updateSelectedElement({
                              strokeColor: e.target.value,
                              strokeWidth: Math.max(1, selectedElement.strokeWidth || 2),
                            })
                          }
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="range"
                          min={0}
                          max={16}
                          value={selectedElement.strokeWidth || 0}
                          onChange={(e) =>
                            updateSelectedElement({ strokeWidth: Number(e.target.value) })
                          }
                          className="w-12 accent-violet-600 cursor-pointer"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedElement({
                            shadowEnabled: !selectedElement.shadowEnabled,
                            shadowBlur: selectedElement.shadowBlur ?? 12,
                          })
                        }
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer ${
                          selectedElement.shadowEnabled
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        {isAr ? 'ظل' : 'Shadow'}
                      </button>
                    </>
                  )}

                  {/* Shape fill / border */}
                  {selectedElement.type === 'shape' && (
                    <>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-white">
                        <span className="text-[10px] text-slate-500">{isAr ? 'تعبئة' : 'Fill'}</span>
                        <input
                          type="color"
                          value={selectedElement.bgColor || '#2563eb'}
                          onChange={(e) => updateSelectedElement({ bgColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-white">
                        <span className="text-[10px] text-slate-500">{isAr ? 'حد' : 'Border'}</span>
                        <input
                          type="color"
                          value={selectedElement.strokeColor || '#0f172a'}
                          onChange={(e) => updateSelectedElement({ strokeColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="range"
                          min={0}
                          max={12}
                          value={selectedElement.strokeWidth || 0}
                          onChange={(e) =>
                            updateSelectedElement({ strokeWidth: Number(e.target.value) })
                          }
                          className="w-12 accent-violet-600 cursor-pointer"
                        />
                      </div>
                    </>
                  )}

                  {/* Transform: rotate / flip / nudge (transfer) */}
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-200 bg-white">
                    <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={selectedElement.rotation || 0}
                      onChange={(e) =>
                        updateSelectedElement({ rotation: Number(e.target.value) }, false)
                      }
                      onMouseUp={() => pushHistorySnapshot()}
                      onTouchEnd={() => pushHistorySnapshot()}
                      className="w-16 accent-violet-600 cursor-pointer"
                      title={isAr ? 'تدوير' : 'Rotate'}
                    />
                    <span className="text-[9px] font-mono text-slate-600 w-7">
                      {selectedElement.rotation || 0}°
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSelectedElement({ flipH: !selectedElement.flipH })}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer ${
                      selectedElement.flipH
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {isAr ? 'قلب أفقياً' : 'Flip H'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedElement({ flipV: !selectedElement.flipV })}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer ${
                      selectedElement.flipV
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {isAr ? 'قلب رأسياً' : 'Flip V'}
                  </button>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => nudgeSelected(-8, 0)}
                      className="px-1.5 py-1 text-slate-700 hover:bg-slate-100 font-bold"
                      title={isAr ? 'نقل يساراً' : 'Move left'}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeSelected(0, -8)}
                      className="px-1.5 py-1 text-slate-700 hover:bg-slate-100 font-bold"
                      title={isAr ? 'نقل لأعلى' : 'Move up'}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeSelected(0, 8)}
                      className="px-1.5 py-1 text-slate-700 hover:bg-slate-100 font-bold"
                      title={isAr ? 'نقل لأسفل' : 'Move down'}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeSelected(8, 0)}
                      className="px-1.5 py-1 text-slate-700 hover:bg-slate-100 font-bold"
                      title={isAr ? 'نقل يميناً' : 'Move right'}
                    >
                      →
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] text-slate-500">{isAr ? 'شفافية' : 'Opacity'}</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={Math.round((selectedElement.opacity ?? 1) * 100)}
                      onChange={(e) =>
                        updateSelectedElement({ opacity: Number(e.target.value) / 100 }, false)
                      }
                      onMouseUp={() => pushHistorySnapshot()}
                      onTouchEnd={() => pushHistorySnapshot()}
                      className="w-14 accent-violet-600 cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => openPositionPanel('arrange')}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer ${
                      activeTab === 'layers'
                        ? 'cs-active'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                    title={isAr ? 'الموضع والترتيب' : 'Position & arrange'}
                  >
                    {isAr ? 'الموضع' : 'Position'}
                  </button>
                  <button
                    type="button"
                    onClick={bringElementForward}
                    className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700"
                    title={isAr ? 'طبقة للأمام' : 'Bring forward'}
                  >
                    {isAr ? 'أمام' : 'Forward'}
                  </button>
                  <button
                    type="button"
                    onClick={sendElementBackward}
                    className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700"
                    title={isAr ? 'طبقة للخلف' : 'Send backward'}
                  >
                    {isAr ? 'خلف' : 'Backward'}
                  </button>
                  <button
                    type="button"
                    onClick={bringElementToFront}
                    className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700"
                    title={isAr ? 'إلى المقدمة' : 'To front'}
                  >
                    {isAr ? 'مقدمة' : 'To front'}
                  </button>
                  <button
                    type="button"
                    onClick={sendElementToBack}
                    className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700"
                    title={isAr ? 'إلى الخلفية' : 'To back'}
                  >
                    {isAr ? 'خلفية' : 'To back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicateSelected}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                    title={isAr ? 'تكرار' : 'Duplicate'}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white"
                    title={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <span>
                    {isAr
                      ? 'انقر على أي عنصر في التصميم للتعديل'
                      : 'Click any element on the design to edit'}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAiRemoveBg}
                  disabled={isProcessingAi}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white flex items-center gap-1 cursor-pointer disabled:opacity-60 cs-btn-primary"
                  style={{ background: 'var(--accent, #1d8b94)' }}
                  title={isAr ? 'إزالة خلفية الصورة' : 'Remove image background'}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>
                    {isProcessingAi
                      ? isAr
                        ? 'جارٍ الإزالة...'
                        : 'Removing...'
                      : bgRemoved
                        ? isAr
                          ? 'أُزيلت الخلفية'
                          : 'BG removed'
                        : isAr
                          ? 'إزالة الخلفية'
                          : 'Remove BG'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedElementId) {
                      updateSelectedElement({
                        x: Math.round(canvasW / 2),
                        y: Math.round(canvasH / 2),
                      });
                    } else {
                      setProductPosX(Math.round(canvasW / 2));
                      setProductPosY(Math.round(canvasH / 2));
                    }
                    toast(isAr ? 'تم التوسيط' : 'Centered', 'info');
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700"
                >
                  {isAr ? 'توسيط' : 'Center'}
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div
              ref={containerRef}
              className="flex-1 flex items-center justify-center min-h-[280px] sm:min-h-[350px] overflow-auto p-2 sm:p-4 pt-10"
            >
              <div
                ref={canvasFrameRef}
                className="cs-canvas-frame relative overflow-visible flex items-center justify-center is-pan-ready select-none w-full max-w-full"
                style={{
                  aspectRatio: `${canvasW} / ${canvasH}`,
                  maxHeight: isPage ? 'min(70vh, 720px)' : 'min(58vh, 560px)',
                  maxWidth: 'min(100%, 920px)',
                  width: '100%',
                  transform: `scale(${viewZoom})`,
                  transformOrigin: 'center center',
                }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              >
                <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />

                {imageLoading && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2 text-slate-800">
                    <RefreshCw className="w-7 h-7 text-violet-600 animate-spin" />
                    <span className="text-xs font-bold">
                      {isAr ? 'جارٍ تحميل الصورة...' : 'Loading image...'}
                    </span>
                  </div>
                )}

                {selectedElement && elementSelectionRect && (
                  <div
                    key={`sel-el-${selectedElement.id}-${layoutEpoch}`}
                    className="cs-selection-box absolute"
                    style={rectToPercentStyle(elementSelectionRect, canvasW, canvasH)}
                  >
                    <div
                      className="cs-selection-toolbar cs-selection-pill absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-lg px-2 py-1 whitespace-nowrap text-[11px] text-slate-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ locked: !selectedElement.locked })}
                        className="p-1 rounded text-slate-600 hover:bg-slate-100"
                        title={selectedElement.locked ? (isAr ? 'فتح القفل' : 'Unlock') : isAr ? 'قفل' : 'Lock'}
                      >
                        {selectedElement.locked ? (
                          <LockKeyhole className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleDuplicateSelected}
                        className="p-1 rounded text-slate-600 hover:bg-slate-100"
                        title={isAr ? 'تكرار' : 'Duplicate'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {resizeHandle('nw', { left: 0, top: 0 }, 'nwse-resize', startElementResize)}
                    {resizeHandle('ne', { left: '100%', top: 0 }, 'nesw-resize', startElementResize)}
                    {resizeHandle('sw', { left: 0, top: '100%' }, 'nesw-resize', startElementResize)}
                    {resizeHandle('se', { left: '100%', top: '100%' }, 'nwse-resize', startElementResize)}
                    {(selectedElement.type === 'image' || selectedElement.type === 'shape') && (
                      <>
                        {resizeHandle('n', { left: '50%', top: 0 }, 'ns-resize', startElementResize, true)}
                        {resizeHandle('e', { left: '100%', top: '50%' }, 'ew-resize', startElementResize, true)}
                        {resizeHandle('s', { left: '50%', top: '100%' }, 'ns-resize', startElementResize, true)}
                        {resizeHandle('w', { left: 0, top: '50%' }, 'ew-resize', startElementResize, true)}
                      </>
                    )}
                  </div>
                )}

                {productSelectionRect && (
                  <div
                    key={`sel-product-${layoutEpoch}`}
                    className="cs-selection-box absolute"
                    style={rectToPercentStyle(productSelectionRect, canvasW, canvasH)}
                  >
                    <div className="cs-selection-toolbar absolute -top-11 left-1/2 -translate-x-1/2 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-700 whitespace-nowrap">
                      {isAr ? 'صورة المنتج · اسحب الزاوية لتكبير' : 'Product · drag corner to resize'}
                    </div>
                    {resizeHandle('se', { left: '100%', top: '100%' }, 'nwse-resize', (_, e) => startProductResize(e))}
                  </div>
                )}
              </div>
            </div>

            <div className="cs-footer pt-2.5 mt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent, #1d8b94)' }} />
                <span>
                  {isAr ? 'استوديو التصميم' : 'Design Studio'} • {canvasW}×{canvasH} px
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() => setViewZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 100) / 100))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-700"
                  title={isAr ? 'تصغير' : 'Zoom out'}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="min-w-[42px] text-center font-mono font-bold text-slate-800">
                  {Math.round(viewZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setViewZoom((z) => Math.min(1.5, Math.round((z + 0.1) * 100) / 100))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-700"
                  title={isAr ? 'تكبير' : 'Zoom in'}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewZoom(1)}
                  className="px-1.5 py-0.5 text-[10px] font-bold hover:bg-slate-100 rounded text-slate-600"
                >
                  {isAr ? 'ملاءمة' : 'Fit'}
                </button>
              </div>
              {productHeroSelected && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-0.5">
                  <span className="text-[10px] text-slate-500">{isAr ? 'حجم المنتج' : 'Product size'}</span>
                  <input
                    type="range"
                    min={18}
                    max={120}
                    value={productScale}
                    onChange={(e) => setProductScale(Number(e.target.value))}
                    className="w-24 accent-violet-600"
                  />
                  <span className="text-[10px] font-mono text-slate-700 w-8">{productScale}%</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownload('png')}
                  className="hover:text-slate-900 cursor-pointer font-bold"
                >
                  PNG
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleDownload('jpg')}
                  className="hover:text-slate-900 cursor-pointer font-bold"
                >
                  JPG
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleDownload('webp')}
                  className="hover:text-slate-900 cursor-pointer font-bold text-emerald-700"
                >
                  WebP
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  const socialModal = (
      <CanvaSocialPostModal
        isOpen={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
        storeId={activeStore.id}
        imageUrl={socialExportDataUrl}
        defaultCaption={
          isAr
            ? 'عروض مميزة وحصرية من متجرنا! ✨ توصيل سريع لكافة مدن المملكة ودفع عند الاستلام. اطلب الآن!\n\n#متجر_سعودي #عروض_السعودية #الرياض'
            : 'Exclusive special offer from our store! ✨ Express shipping across KSA. Order now!\n\n#SaudiMade #KSAShop #Deals'
        }
        onOpenSocialHub={onOpenSocialHub}
      />
  );

  if (isPage) {
    return (
      <div className="canva-studio-shell relative flex w-full max-w-full min-w-0 h-[calc(100dvh-4.5rem)] min-h-[520px] font-sans overflow-hidden">
        {studioPanel}
        {socialModal}
      </div>
    );
  }

  return (
    <GlobalModal
      isOpen
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'استوديو التصميم' : 'Design Studio'}
      backdropClassName="!p-0 font-sans"
      zIndexClassName="z-[70]"
    >
      {studioPanel}
      {socialModal}
    </GlobalModal>
  );
};
