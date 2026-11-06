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
  LockKeyhole,
  Unlock,
  Package,
  FolderKanban,
  Compass,
  ArrowRight,
  Sparkle,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import type { MediaAsset } from '../../types/media';
import {
  getStudioQuota,
  consumeStudioAiCredit,
  requestStudioProUpgrade,
  type StudioQuotaState,
} from '../../services/ksaAutomationEngine';
import {
  CANVA_FONT_FAMILIES,
  getDefaultBlankTemplate,
  getDefaultNicheStarterTemplate,
  type CanvaDesignTemplate,
} from '../../data/ksaCanvaTemplates';
import { CanvaTemplatesPanel } from './CanvaTemplatesPanel';
import { CanvaSocialPostModal } from './CanvaSocialPostModal';

export interface CanvaImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** modal = overlay from Media Library; page = full store tab workspace */
  variant?: 'modal' | 'page';
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
  { id: 'coffee-cream', labelEn: 'Coffee Cream Luxury', labelAr: 'كريمي قهوة فاخر', css: 'linear-gradient(160deg, #f7f1e8, #e8d5b7)', hex1: '#f7f1e8', hex2: '#e8d5b7' },
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
  { id: 'coffee', labelEn: 'Coffee Cup', labelAr: 'كوب قهوة', glyph: '☕' },
  { id: 'shopping-bag', labelEn: 'Shopping Bag', labelAr: 'حقيبة تسوق', glyph: '🛍️' },
  { id: 'heart', labelEn: 'Favorite Heart', labelAr: 'قلب إعجاب', glyph: '❤️' },
  { id: 'flame', labelEn: 'Hot Trend', labelAr: 'عرض ناري', glyph: '🔥' },
  { id: 'shield-check', labelEn: 'Guarantee', labelAr: 'ضمان معتمد', glyph: '🛡️' },
  { id: 'truck', labelEn: 'Fast Truck', labelAr: 'شحن سريع', glyph: '🚚' },
  { id: 'tag', labelEn: 'Discount Tag', labelAr: 'وسم تخفيض', glyph: '🏷️' },
  { id: 'sparkles', labelEn: 'Magic Sparkles', labelAr: 'بريق الذكاء', glyph: '✨' },
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  // Document Title (Canva style: editable at top)
  const [docTitle, setDocTitle] = useState('Untitled Design');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Loaded Product/Subject Image
  const [activeImageUrl, setActiveImageUrl] = useState<string>('');
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<
    'templates' | 'elements' | 'text' | 'store_assets' | 'colors' | 'media' | 'filters' | 'bg_remove'
  >('templates');

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
  const [isResizingElement, setIsResizingElement] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialResizeState, setInitialResizeState] = useState<{ startX: number; startY: number; elW: number; elH: number; fontSize: number }>({ startX: 0, startY: 0, elW: 0, elH: 0, fontSize: 24 });

  // Social Post & Publish Modal
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialExportDataUrl, setSocialExportDataUrl] = useState('');

  // Selected Template ID — blank by default (no consulting clutter)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>('blank-square');

  // Undo / Redo History Stack
  const [history, setHistory] = useState<StudioHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryActionRef = useRef(false);

  // Helper: Get candidate URL
  const resolveCandidateUrl = useCallback((asset?: MediaAsset | null): string => {
    if (!asset) {
      return currentProducts[0]?.image || activeStore.logo || '/coffee-theme-refs/image15.png';
    }
    return (
      asset.originalUrl ||
      asset.webpUrl ||
      asset.thumbnailUrl ||
      asset.optimizedUrl ||
      currentProducts[0]?.image ||
      activeStore.logo ||
      '/coffee-theme-refs/image15.png'
    );
  }, [currentProducts, activeStore.logo]);

  // Load Image with Fallbacks
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
      // Graceful fallback
      const fallback = new Image();
      fallback.crossOrigin = 'anonymous';
      fallback.onload = () => {
        setLoadedImg(fallback);
        setImageLoading(false);
      };
      fallback.onerror = () => {
        setImageLoading(false);
      };
      fallback.src = '/coffee-theme-refs/image15.png';
    };
    img.src = candidateUrl;
  }, []);

  // Countdown timer for next daily allowance slot
  useEffect(() => {
    const updateCountdown = () => {
      const q = getStudioQuota(activeStore.id);
      setQuota(q);
      const now = new Date();
      const nextTime = new Date(q.nextSlotTime);
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

  // Initialize on open: Blank canvas (or niche starter if editing an asset)
  useEffect(() => {
    if (!isOpen) return;

    const initialUrl = resolveCandidateUrl(initialAsset);
    loadStudioImage(initialUrl);

    const starter = initialAsset
      ? getDefaultNicheStarterTemplate(activeStore)
      : getDefaultBlankTemplate('square');

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

    const scale = initialAsset
      ? starter.productPosPct.scale
      : 0;
    const px = Math.round(starter.productPosPct.x * starter.width);
    const py = Math.round(starter.productPosPct.y * starter.height);

    setCanvasW(starter.width);
    setCanvasH(starter.height);
    setSelectedBackdrop(starter.backdropId || 'soft-ivory');
    setCustomSolidColor(starter.customSolidColor || '#faf8f5');
    setProductPosX(px);
    setProductPosY(py);
    setProductScale(scale);
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
        productPos: { x: px, y: py, scale },
        selectedBackdrop: starter.backdropId || 'soft-ivory',
        customSolidColor: starter.customSolidColor || '#faf8f5',
        bgRemoved: false,
        bgTolerance: 38,
        filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
      },
    ]);
    setHistoryIndex(0);
  }, [isOpen, initialAsset, resolveCandidateUrl, loadStudioImage, isAr, activeStore]);

  // Snapshot State for Undo / Redo
  const pushHistorySnapshot = useCallback(() => {
    if (isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }
    const snap: StudioHistorySnapshot = {
      elements: JSON.parse(JSON.stringify(elements)),
      productPos: { x: productPosX, y: productPosY, scale: productScale },
      selectedBackdrop,
      customSolidColor,
      bgRemoved,
      bgTolerance,
      filters: { brightness, contrast, saturation, blur: blurAmount },
    };
    setHistory((prev) => {
      const next = [...prev.slice(0, historyIndex + 1), snap];
      return next.slice(-30);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
  }, [
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
    historyIndex,
  ]);

  // Undo Handler
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    isHistoryActionRef.current = true;
    const nextIdx = historyIndex - 1;
    const snap = history[nextIdx];
    if (snap) {
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
      setHistoryIndex(nextIdx);
    }
  };

  // Redo Handler
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    isHistoryActionRef.current = true;
    const nextIdx = historyIndex + 1;
    const snap = history[nextIdx];
    if (snap) {
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
      setHistoryIndex(nextIdx);
    }
  };

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
      ctx.restore();
    }

    // 3. Draw All Interactive Draggable Elements (Shapes, Icons, Images, Text)
    elements.forEach((el) => {
      ctx.save();

      // Transform & Opacity
      if (el.rotation) {
        ctx.translate(el.x, el.y);
        ctx.rotate((el.rotation * Math.PI) / 180);
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
          ctx.strokeStyle = el.strokeColor || el.bgColor || '#ffffff';
          ctx.lineWidth = el.strokeWidth || 3;
          ctx.stroke();
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
        ctx.restore();
        return;
      }

      // --- ICON ELEMENT ---
      if (el.type === 'icon') {
        ctx.fillStyle = el.fontColor || '#ffffff';
        ctx.font = `${el.fontSize || 32}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const item = QUICK_ICONS.find((i) => i.id === el.icon);
        const glyph = item ? item.glyph : el.text || '★';
        ctx.fillText(glyph, el.x, el.y);
        ctx.restore();
        return;
      }

      // --- IMAGE ELEMENT (Store Product / Category / Logo / Upload) ---
      if (el.type === 'image' && el.imageUrl) {
        const w = el.width || 180;
        const h = el.height || 180;
        const cached = imageCacheRef.current[el.imageUrl];
        if (cached && cached.complete && cached.naturalWidth > 0) {
          if (el.borderRadius && el.borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(el.x - w / 2, el.y - h / 2, w, h, el.borderRadius);
            ctx.clip();
          }
          ctx.drawImage(cached, el.x - w / 2, el.y - h / 2, w, h);
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
        ctx.restore();
        return;
      }

      // --- TEXT / BADGE / HEADLINE / SUBTITLE ---
      if (!el.text || !el.text.trim()) {
        ctx.restore();
        return;
      }

      const family = el.fontFamily || (isAr ? 'Tajawal' : 'Outfit');
      ctx.font = `${el.isItalic ? 'italic ' : ''}${el.isBold ? '800' : '600'} ${el.fontSize}px "${family}", sans-serif`;
      ctx.textAlign = el.textAlign || 'center';
      ctx.textBaseline = 'middle';

      const lines = el.text.split('\n');
      const lineH = el.fontSize * 1.35;
      const totalH = lines.length * lineH;

      // Find max line width
      let maxLineWidth = 0;
      lines.forEach((line) => {
        const met = ctx.measureText(line);
        if (met.width > maxLineWidth) maxLineWidth = met.width;
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
      if (el.bgColor && el.bgColor !== 'transparent') {
        ctx.fillStyle = el.bgColor;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, rad);
        ctx.fill();

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

      // Draw Each Line of Text
      ctx.fillStyle = el.fontColor || '#ffffff';
      const startY = el.y - totalH / 2 + lineH / 2;
      lines.forEach((line, idx) => {
        ctx.fillText(line, el.x, startY + idx * lineH);
      });

      ctx.restore();
    });
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

  // 1-Click AI Background Removal
  const handleAiRemoveBg = () => {
    const res = consumeStudioAiCredit(activeStore.id);
    setQuota(res.state);

    if (!res.allowed) {
      toast(
        isAr
          ? `انتهت الحصة الحالية (${quota.slotUsed}/${quota.slotLimit}). تفتح الحصة التالية بعد: ${slotCountdownText || 'قريباً'}!`
          : `Current batch limit reached (${quota.slotUsed}/${quota.slotLimit}). Next slot opens in: ${slotCountdownText || 'soon'}!`,
        'error',
      );
      return;
    }

    setIsProcessingAi(true);
    setTimeout(() => {
      setBgRemoved(true);
      if (selectedBackdrop === 'original') {
        setSelectedBackdrop('transparent');
      }
      setIsProcessingAi(false);
      pushHistorySnapshot();
      toast(
        isAr ? 'تم عزل خلفية المنتج بنجاح باستخدام الذكاء الاصطناعي!' : 'Product background isolated successfully with AI!',
        'success',
      );
    }, 600);
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

    const mapped: CanvasElement[] = template.elements.map((layer, idx) => ({
      id: `el-${Date.now()}-${idx}`,
      type: layer.type,
      text: (isAr ? layer.textAr || layer.textEn : layer.textEn) || '',
      x: Math.round(layer.xPct * template.width),
      y: Math.round(layer.yPct * template.height),
      width: layer.widthPct ? Math.round(layer.widthPct * template.width) : 120,
      height: layer.heightPct ? Math.round(layer.heightPct * template.height) : 120,
      fontSize: layer.fontSize || 24,
      fontColor: layer.fontColor || '#ffffff',
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

    setElements(mapped);
    setSelectedElementId(mapped[0]?.id || null);
    setDocTitle(template.nameEn);
    pushHistorySnapshot();
    toast(
      isAr ? `تم تطبيق القالب: ${template.nameAr}` : `Template applied: ${template.nameEn}`,
      'success',
    );
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

  // Quick Add Text Element
  const handleAddTextElement = (type: CanvasElement['type'], defaultText: string) => {
    const newEl: CanvasElement = {
      id: `el-${Date.now()}`,
      type,
      text: defaultText,
      x: Math.round(canvasW / 2),
      y: Math.round(canvasH / 2) + (elements.length % 5) * 35,
      fontSize: type === 'headline' ? 38 : type === 'price' ? 30 : 20,
      fontColor: '#ffffff',
      bgColor: type === 'price' ? '#059669' : type === 'badge' ? '#e11d48' : 'transparent',
      bgPadding: 16,
      borderRadius: 20,
      isBold: true,
      textAlign: 'center',
      fontFamily: isAr ? 'Tajawal' : 'Outfit',
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
    pushHistorySnapshot();
    toast(isAr ? 'تمت إضافة النص إلى الكانفاس!' : 'Text added to canvas!', 'info');
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
    setElements((prev) => [...prev, newBadge]);
    setSelectedElementId(newBadge.id);
    pushHistorySnapshot();
    toast(isAr ? 'تمت إضافة الشارة!' : 'Badge sticker added!', 'info');
  };

  // Delete Selected Element
  const handleDeleteSelected = () => {
    if (!selectedElementId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
    setSelectedElementId(null);
    pushHistorySnapshot();
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
    setElements((prev) => [...prev, dup]);
    setSelectedElementId(dup.id);
    pushHistorySnapshot();
  };

  // Update selected element property
  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedElementId ? { ...el, ...updates } : el)),
    );
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

  // Pointer drag & resize handling
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = canvasW / rect.width;
    const scaleY = canvasH / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCanvasCoords(e);

    // Hit test elements in reverse order
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.locked) continue;

      let approxW = el.width || 120;
      let approxH = el.height || 120;

      if (el.type !== 'shape' && el.type !== 'image') {
        const textLen = Math.max(1, (el.text || '').split('\n')[0].length);
        approxW = textLen * (el.fontSize * 0.65) + (el.bgPadding || 14) * 2;
        approxH = (el.text || '').split('\n').length * (el.fontSize * 1.35) + (el.bgPadding || 14);
      }

      let minX = el.x - approxW / 2;
      let maxX = el.x + approxW / 2;
      if (el.textAlign === 'left') {
        minX = el.x;
        maxX = el.x + approxW;
      } else if (el.textAlign === 'right') {
        minX = el.x - approxW;
        maxX = el.x;
      }
      const minY = el.y - approxH / 2;
      const maxY = el.y + approxH / 2;

      if (x >= minX - 15 && x <= maxX + 15 && y >= minY - 15 && y <= maxY + 15) {
        setSelectedElementId(el.id);
        setIsDraggingElement(true);
        setDragOffset({ x: x - el.x, y: y - el.y });
        return;
      }
    }

    // Hit test product image
    const imgDist = Math.hypot(x - productPosX, y - productPosY);
    if (imgDist < (300 * productScale) / 100) {
      setIsDraggingProduct(true);
      setDragOffset({ x: x - productPosX, y: y - productPosY });
      setSelectedElementId(null);
      return;
    }

    setSelectedElementId(null);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingElement && !isDraggingProduct) return;
    const { x, y } = getCanvasCoords(e);

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
    if (isDraggingElement || isDraggingProduct) {
      setIsDraggingElement(false);
      setIsDraggingProduct(false);
      pushHistorySnapshot();
    }
  };

  // Upload Local File
  const handleUploadLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      loadStudioImage(dataUrl);
      setBgRemoved(false);
      toast(isAr ? 'تم رفع صورتك بنجاح على الكانفاس!' : 'Image uploaded to canvas!', 'success');
    };
    reader.readAsDataURL(file);
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
    a.download = `${(docTitle || 'canva-design').toLowerCase().replace(/\s+/g, '-')}.${format}`;
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
    toast(isAr ? 'تم حفظ التصميم في مكتبة وسائط المتجر!' : 'Saved to Store Media Library!', 'success');
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const isPage = variant === 'page';

  const studioTabs = [
    { id: 'templates' as const, label: isAr ? 'القوالب' : 'Templates', icon: Layers },
    { id: 'elements' as const, label: isAr ? 'العناصر' : 'Elements', icon: Compass },
    { id: 'text' as const, label: isAr ? 'النص' : 'Text', icon: Type },
    { id: 'store_assets' as const, label: isAr ? 'المتجر' : 'Store Assets', icon: Package },
    { id: 'colors' as const, label: isAr ? 'الألوان' : 'Brand & Gradients', icon: Palette },
    { id: 'media' as const, label: isAr ? 'الرفع' : 'Uploads', icon: Upload },
    { id: 'filters' as const, label: isAr ? 'الضبط' : 'Adjust', icon: Sliders },
  ];

  if (!isOpen) return null;

  return (
    <div
      className={
        isPage
          ? 'relative flex w-full h-[calc(100dvh-4.5rem)] min-h-[560px] font-sans'
          : 'fixed inset-0 z-50 flex items-center justify-center p-0 font-sans bg-slate-950/80 backdrop-blur-md'
      }
    >
      <div
        className={`w-full overflow-hidden flex flex-col select-none ${
          isPage
            ? 'h-full min-h-0 rounded-none border-0'
            : 'max-w-7xl h-[95vh] rounded-3xl border border-slate-700/60 shadow-2xl bg-slate-950 text-white'
        }`}
        style={{ background: '#090d16', color: '#f8fafc' }}
      >
        {/* ── TOP CANVA NAVBAR ── */}
        <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90 shrink-0">
          {/* Left: Canva / Studio Brand & Editable Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 text-white flex items-center justify-center shadow-md font-black text-sm">
              C
            </div>

            {/* Resize Button & Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowResizeMenu(!showResizeMenu)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-slate-800/80 text-slate-200"
              >
                <span>{canvasW}×{canvasH}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showResizeMenu && (
                <div className="absolute start-0 top-full mt-1.5 w-64 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-2 z-50 space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1">
                    {isAr ? 'تغيير أبعاد التصميم (كانفا)' : 'Canvas Resize Presets'}
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
                        toast(isAr ? `تم تغيير المقاس إلى ${preset.w}×${preset.h}` : `Resized to ${preset.w}×${preset.h}`, 'info');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-start text-xs font-bold hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{preset.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{preset.w}×{preset.h}</span>
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
                className="px-2 py-1 rounded-lg border border-purple-500 bg-slate-950 text-xs font-bold text-white max-w-[220px]"
              />
            ) : (
              <span
                onClick={() => setIsEditingTitle(true)}
                title={isAr ? 'انقر لتعديل اسم التصميم' : 'Click to edit title'}
                className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer px-1.5 py-1 rounded-md hover:bg-slate-800 transition-colors truncate max-w-[240px]"
              >
                {docTitle} ✎
              </span>
            )}

            {/* Cloud Status */}
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>{isAr ? 'محفوظ بالسحابة' : 'Saved to cloud'}</span>
            </span>
          </div>

          {/* Center: Undo & Redo */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl border border-slate-800 bg-slate-800/50">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 disabled:opacity-30 cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 disabled:opacity-30 cursor-pointer"
              title="Redo (Ctrl+Y)"
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
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer text-slate-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isAr ? 'تنزيل' : 'Export'}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveToMedia}
                className="px-3 py-1.5 rounded-xl border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isAr ? 'حفظ بالمتجر' : 'Save to Media'}</span>
              </button>
            </div>

            {/* REAL SOCIAL MEDIA PUBLISH BUTTON (CANVA SHARE STYLE) */}
            <button
              type="button"
              onClick={handleOpenSocialModal}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white shadow-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102 hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
            >
              <Share2 className="w-4 h-4" />
              <span>{isAr ? 'نشر في وسائل التواصل' : 'Post to Social Media'}</span>
            </button>

            {!isPage && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN WORKSPACE (LEFT DOCK + LEFT FLYOUT PANEL + CANVAS) ── */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Vertical Icon Dock (Canva Image 2 Style) */}
          <div className="w-16 bg-slate-900 border-e border-slate-800 flex flex-col items-center py-2 gap-1 shrink-0 z-30">
            {studioTabs.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-14 py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center ${
                    active
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-[9.5px] font-bold truncate max-w-full leading-tight">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Left Flyout Subpanel */}
          <div className="w-80 bg-slate-900/60 border-e border-slate-800/80 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
            {/* 1. TEMPLATES TAB */}
            {activeTab === 'templates' && (
              <CanvaTemplatesPanel
                store={activeStore}
                isAr={isAr}
                selectedTemplateId={selectedTemplateId}
                activeImageUrl={activeImageUrl}
                onApply={applyCanvaTemplate}
                onRequestPro={() => {
                  toast(
                    isAr ? 'القوالب الإضافية متاحة مع باقة برو.' : 'Extra templates unlock with Pro.',
                    'info',
                  );
                }}
                onSelectFormatPreset={(w, h, label) => {
                  setCanvasW(w);
                  setCanvasH(h);
                  toast(isAr ? `المقاس: ${label}` : `Canvas set to ${label}`, 'info');
                }}
              />
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
                      <span>{isAr ? 'منحنى كانفا أزرق' : 'Canva Wave'}</span>
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
                  {isAr ? 'إضافة نصوص جديدة' : 'Add Text to Canvas'}
                </span>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleAddTextElement('headline', isAr ? 'عنوان عريض وجذاب' : 'Add a heading')}
                    className="w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-base font-black text-white text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? 'إضافة عنوان رئيسي' : 'Add a heading'}</span>
                    <Plus className="w-4 h-4 text-purple-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTextElement('subtitle', isAr ? 'وصف فرعي للمنتج والخدمة' : 'Add a subheading')}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-sm font-semibold text-slate-200 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? 'إضافة نص فرعي' : 'Add a subheading'}</span>
                    <Plus className="w-4 h-4 text-purple-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTextElement('custom_text', isAr ? 'نص توضيحي ومعلومات إضافية' : 'Add a little bit of body text')}
                    className="w-full py-2 px-4 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-xs text-slate-300 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? 'إضافة نص توضيحي' : 'Add body text'}</span>
                    <Plus className="w-4 h-4 text-purple-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTextElement('custom_text', isAr ? '• ميزة أولى\n• ميزة ثانية\n• ميزة ثالثة' : '• First feature\n• Second feature\n• Third feature')}
                    className="w-full py-2 px-4 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-xs text-slate-300 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? '• قائمة نقاط مميزات' : '• Bullet point list'}</span>
                    <Plus className="w-4 h-4 text-purple-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBadgeElement(isAr ? 'تواصل معنا' : "Let's Talk", '#ffffff', 'pill')}
                    className="w-full py-2 px-4 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-xs text-slate-300 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? 'زر إجراء Call to Action' : 'CTA Button Pill'}</span>
                    <Plus className="w-4 h-4 text-purple-400" />
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

            {/* 4. STORE ASSETS (Products & Categories) */}
            {activeTab === 'store_assets' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-400">
                      {isAr ? 'منتجات المتجر (نقرة واحدة للإدراج)' : 'Store Products'}
                    </span>
                    <span className="text-[10px] text-emerald-400">{currentProducts.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pe-1">
                    {currentProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          loadStudioImage(p.image);
                          handleAddTextElement('headline', p.name);
                          if (p.price) {
                            handleAddTextElement('price', `${p.price} SAR`);
                          }
                          toast(isAr ? `تم إدراج منتج: ${p.name}` : `Product loaded: ${p.name}`, 'success');
                        }}
                        className="p-2 rounded-xl border border-slate-800 bg-slate-800/60 hover:border-emerald-500 text-start flex flex-col justify-between cursor-pointer transition-all group"
                      >
                        <div className="aspect-square rounded-lg bg-black/40 overflow-hidden mb-1.5 flex items-center justify-center p-1">
                          <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                        </div>
                        <span className="text-[10px] font-bold text-white truncate w-full">{p.name}</span>
                        <span className="text-[9px] text-emerald-400 font-mono font-bold">{p.price} SAR</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-black uppercase text-slate-400">
                    {isAr ? 'تصنيفات المتجر' : 'Store Categories'}
                  </span>
                  <div className="space-y-1.5">
                    {activeStore.categories?.map((cat, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          handleAddTextElement('headline', cat);
                          handleAddTextElement('subtitle', isAr ? 'تسوق تشكيلة التصنيف كاملة' : 'Browse full collection');
                          toast(isAr ? `تم إدراج تصنيف: ${cat}` : `Category added: ${cat}`, 'info');
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-xs font-bold text-start flex items-center justify-between cursor-pointer"
                      >
                        <span>{cat}</span>
                        <Plus className="w-3.5 h-3.5 text-purple-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Store Logo */}
                {activeStore.logo && (
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        const newLogoEl: CanvasElement = {
                          id: `logo-${Date.now()}`,
                          type: 'image',
                          text: activeStore.name,
                          imageUrl: activeStore.logo,
                          x: Math.round(canvasW * 0.15),
                          y: Math.round(canvasH * 0.12),
                          width: 120,
                          height: 120,
                          fontSize: 16,
                          fontColor: '#ffffff',
                          borderRadius: 16,
                        };
                        setElements((prev) => [...prev, newLogoEl]);
                        setSelectedElementId(newLogoEl.id);
                        pushHistorySnapshot();
                        toast(isAr ? 'تمت إضافة شعار المتجر!' : 'Store logo added to canvas!', 'info');
                      }}
                      className="w-full p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>{isAr ? 'إدراج شعار المتجر على الكانفاس' : 'Insert Store Logo'}</span>
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
                      <span className="text-[10px] font-black text-white drop-shadow-sm truncate">
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
                      <span className="text-[9px] text-slate-400">Color 1</span>
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
                      <span className="text-[9px] text-slate-400">Color 2</span>
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
                      <span className="text-[9px] text-slate-400">Color 3</span>
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
                {/* Upload Button */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-purple-500 bg-slate-800/40 hover:bg-purple-950/20 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadLocalFile}
                  />
                  <Upload className="w-6 h-6 text-purple-400 mb-1.5" />
                  <span className="text-xs font-bold text-white">
                    {isAr ? 'رفع صورة من جهازك' : 'Upload from Computer'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP</span>
                </div>

                {/* Media Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={mediaSearchQuery}
                    onChange={(e) => setMediaSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث في الوسائط...' : 'Search media assets...'}
                    className="w-full ps-8 pe-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white"
                  />
                </div>

                {/* Assets Grid */}
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pe-1">
                  {currentMedia.map((asset) => {
                    const imgUrl = asset.thumbnailUrl || asset.webpUrl || asset.originalUrl;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => {
                          loadStudioImage(imgUrl);
                          toast(isAr ? 'تم تحميل الصورة!' : 'Image loaded on canvas!', 'info');
                        }}
                        className="aspect-square rounded-xl border border-slate-800 overflow-hidden cursor-pointer hover:border-purple-500 hover:scale-105 transition-all relative group bg-black/40"
                      >
                        <img src={imgUrl} alt={asset.fileName} className="w-full h-full object-cover" />
                      </div>
                    );
                  })}
                </div>
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
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white shadow-md flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>
                    {isProcessingAi
                      ? isAr ? 'جارٍ العزل الذكي...' : 'Removing BG...'
                      : bgRemoved
                      ? isAr ? '✓ تم العزل الذكي (إعادة)' : '✓ Isolated (Re-run)'
                      : isAr ? 'عزل الخلفية بالذكاء الاصطناعي' : '1-Click AI BG Removal'}
                  </span>
                </button>

                {/* Sliders */}
                <div className="space-y-3 p-3 rounded-2xl border border-slate-800 bg-slate-800/40">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>{isAr ? 'السطوع (Brightness)' : 'Brightness'}</span>
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
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>{isAr ? 'التباين (Contrast)' : 'Contrast'}</span>
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
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>{isAr ? 'التشبع (Saturation)' : 'Saturation'}</span>
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
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>{isAr ? 'الضبابية (Blur)' : 'Blur'}</span>
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

                  {/* Flip Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setFlipH(!flipH)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border ${flipH ? 'bg-purple-600 text-white' : 'border-slate-700 text-slate-300'}`}
                    >
                      Flip Horizontal
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipV(!flipV)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border ${flipV ? 'bg-purple-600 text-white' : 'border-slate-700 text-slate-300'}`}
                    >
                      Flip Vertical
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── CANVAS WORKSPACE & CONTEXTUAL TOOLBAR ── */}
          <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 bg-slate-800/90 overflow-hidden min-w-0">
            {/* FLOATING CONTEXTUAL TOOLBAR ABOVE CANVAS (CANVA IMAGE 2 STYLE) */}
            <div className="mb-2 px-3 py-1.5 rounded-2xl border border-slate-800 bg-slate-900 shadow-md flex items-center justify-between gap-2 text-xs shrink-0 overflow-x-auto scrollbar-none">
              {selectedElement ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Text Controls */}
                  {selectedElement.type !== 'shape' && selectedElement.type !== 'image' && (
                    <>
                      {/* Font Family Selector */}
                      <select
                        value={selectedElement.fontFamily || 'Outfit'}
                        onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                        className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-white"
                      >
                        {CANVA_FONT_FAMILIES.map((f) => (
                          <option key={f.id} value={f.id}>
                            {isAr ? f.labelAr : f.labelEn}
                          </option>
                        ))}
                      </select>

                      {/* Font Size Decrement / Value / Increment */}
                      <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ fontSize: Math.max(12, selectedElement.fontSize - 2) })}
                          className="px-2 py-1 hover:bg-slate-700 text-slate-300 font-black cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 py-1 text-xs font-mono font-bold text-white min-w-[28px] text-center">
                          {selectedElement.fontSize}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ fontSize: Math.min(130, selectedElement.fontSize + 2) })}
                          className="px-2 py-1 hover:bg-slate-700 text-slate-300 font-black cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Font Color */}
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-700 bg-slate-800" title="Text Color">
                        <span className="text-[10px] text-slate-400">A</span>
                        <input
                          type="color"
                          value={selectedElement.fontColor}
                          onChange={(e) => updateSelectedElement({ fontColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>

                      {/* Bold & Italic */}
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ isBold: !selectedElement.isBold })}
                        className={`p-1.5 rounded-lg border cursor-pointer ${selectedElement.isBold ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ isItalic: !selectedElement.isItalic })}
                        className={`p-1.5 rounded-lg border cursor-pointer ${selectedElement.isItalic ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>

                      {/* Alignment */}
                      <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ textAlign: 'left' })}
                          className={`p-1.5 ${selectedElement.textAlign === 'left' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ textAlign: 'center' })}
                          className={`p-1.5 ${selectedElement.textAlign === 'center' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ textAlign: 'right' })}
                          className={`p-1.5 ${selectedElement.textAlign === 'right' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Shape Fill & Border Controls */}
                  {selectedElement.type === 'shape' && (
                    <>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-700 bg-slate-800">
                        <span className="text-[10px] text-slate-400">Fill</span>
                        <input
                          type="color"
                          value={selectedElement.bgColor || '#2563eb'}
                          onChange={(e) => updateSelectedElement({ bgColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-700 bg-slate-800">
                        <span className="text-[10px] text-slate-400">Border</span>
                        <input
                          type="color"
                          value={selectedElement.strokeColor || '#ffffff'}
                          onChange={(e) => updateSelectedElement({ strokeColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                    </>
                  )}

                  {/* Opacity Slider */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-700 bg-slate-800">
                    <span className="text-[10px] text-slate-400">Opacity</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={Math.round((selectedElement.opacity ?? 1) * 100)}
                      onChange={(e) => updateSelectedElement({ opacity: Number(e.target.value) / 100 })}
                      className="w-14 accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Layer Ordering */}
                  <button
                    type="button"
                    onClick={bringElementForward}
                    className="px-2 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-[10px] font-bold text-slate-300"
                    title="Bring Forward"
                  >
                    Forward
                  </button>
                  <button
                    type="button"
                    onClick={sendElementBackward}
                    className="px-2 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-[10px] font-bold text-slate-300"
                    title="Send Backward"
                  >
                    Backward
                  </button>

                  {/* Duplicate & Delete */}
                  <button
                    type="button"
                    onClick={handleDuplicateSelected}
                    className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* When nothing selected: Quick Canvas Tools */
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <span>✨ {isAr ? 'انقر على أي عنصر بالكانفاس للتحكم' : 'Click any element on canvas to edit'}</span>
                </div>
              )}

              {/* Product Scale / Center Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setProductPosX(Math.round(canvasW / 2));
                    setProductPosY(Math.round(canvasH / 2));
                    toast(isAr ? 'تم توسيط المنتج' : 'Product centered', 'info');
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-[10px] font-bold text-slate-300"
                >
                  {isAr ? 'توسيط المنتج' : 'Center Product'}
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div
              ref={containerRef}
              className="flex-1 flex items-center justify-center min-h-[350px] overflow-hidden"
            >
              <div
                className="relative rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex items-center justify-center cursor-crosshair select-none"
                style={{
                  aspectRatio: `${canvasW} / ${canvasH}`,
                  maxHeight: isPage ? 'min(76vh, 720px)' : 'min(64vh, 580px)',
                  maxWidth: '100%',
                  background:
                    'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 20px 20px',
                }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              >
                {/* HTML5 Canvas */}
                <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />

                {/* Loading state */}
                {imageLoading && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                    <RefreshCw className="w-7 h-7 text-purple-400 animate-spin" />
                    <span className="text-xs font-bold">
                      {isAr ? 'جارٍ تحميل الصورة في الاستوديو...' : 'Loading image into Studio...'}
                    </span>
                  </div>
                )}

                {/* ACTIVE SELECTION BOUNDING BOX (CANVA IMAGE 2 STYLE) */}
                {selectedElement && (
                  <div
                    className="absolute border-2 border-purple-500 rounded-xl pointer-events-auto"
                    style={{
                      left: `${(selectedElement.x / canvasW) * 100}%`,
                      top: `${(selectedElement.y / canvasH) * 100}%`,
                      transform:
                        selectedElement.textAlign === 'center'
                          ? 'translate(-50%, -50%)'
                          : selectedElement.textAlign === 'right'
                          ? 'translate(-100%, -50%)'
                          : 'translate(0, -50%)',
                      width: `${Math.max(
                        10,
                        (selectedElement.width ||
                          (selectedElement.text || '').split('\n')[0].length * (selectedElement.fontSize * 0.72) + 30) *
                          (100 / canvasW),
                      )}%`,
                      height: `${Math.max(
                        6,
                        ((selectedElement.height ||
                          (selectedElement.text || '').split('\n').length * (selectedElement.fontSize * 1.4) + 20) *
                          100) /
                          canvasH,
                      )}%`,
                      boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.6), 0 8px 24px rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    {/* Floating Pill on Element (Canva Image 2 replica: Ask Canva, Lock, Copy, Delete) */}
                    <div
                      className="absolute -top-10 start-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 border border-purple-500/60 shadow-2xl rounded-xl px-2 py-0.5 text-white z-40 whitespace-nowrap text-[11px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          toast(isAr ? 'تحسين ذكي للعنصر بالذكاء الاصطناعي' : 'Element AI Refined', 'info');
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-purple-300 hover:text-white hover:bg-slate-800 font-bold"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Ask AI</span>
                      </button>
                      <span className="w-px h-3 bg-slate-700 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => updateSelectedElement({ locked: !selectedElement.locked })}
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
                        title={selectedElement.locked ? 'Unlock' : 'Lock'}
                      >
                        {selectedElement.locked ? <LockKeyhole className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleDuplicateSelected}
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/60"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Corner Handles for Canva-like Resizing */}
                    <div className="absolute -top-1.5 -start-1.5 w-3 h-3 rounded-full bg-purple-400 border-2 border-slate-950 cursor-nwse-resize" />
                    <div className="absolute -top-1.5 -end-1.5 w-3 h-3 rounded-full bg-purple-400 border-2 border-slate-950 cursor-nesw-resize" />
                    <div className="absolute -bottom-1.5 -start-1.5 w-3 h-3 rounded-full bg-purple-400 border-2 border-slate-950 cursor-nesw-resize" />
                    <div className="absolute -bottom-1.5 -end-1.5 w-3 h-3 rounded-full bg-purple-400 border-2 border-slate-950 cursor-nwse-resize" />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Bar: Store Info & Quick Status */}
            <div className="pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {activeStore.name} • {canvasW}×{canvasH} px WebP
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownload('png')}
                  className="hover:text-white cursor-pointer font-bold"
                >
                  PNG
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleDownload('jpg')}
                  className="hover:text-white cursor-pointer font-bold"
                >
                  JPG
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleDownload('webp')}
                  className="hover:text-white cursor-pointer font-bold text-emerald-400"
                >
                  WebP (Ultra)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── REAL SOCIAL MEDIA POST & SCHEDULE MODAL ── */}
      <CanvaSocialPostModal
        isOpen={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
        storeId={activeStore.id}
        imageUrl={socialExportDataUrl}
        defaultCaption={
          isAr
            ? `عروض مميزة وحصرية من متجر ${activeStore.name}! ✨ توصيل سريع لكافة مدن المملكة ودفع عند الاستلام. اطلب الآن!\n\n#متجر_سعودي #عروض_السعودية #الرياض`
            : `Exclusive special offer from ${activeStore.name}! ✨ Express shipping across KSA. Order now!\n\n#SaudiMade #KSAShop #Deals`
        }
        onOpenSocialHub={onOpenSocialHub}
      />
    </div>
  );
};
