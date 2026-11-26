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
  Images,
  Zap,
  ShieldCheck,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Copy,
  ClipboardPaste,
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
  ChevronUp,
  CopyPlus,
  Group,
  Ungroup,
  FilePlus2,
  PanelLeft,
  Settings,
  FileJson,
  FileUp,
  Film,
  Play,
  Pause,
  SkipBack,
  Archive,
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
  getCanvaTemplate,
  getDefaultBlankTemplate,
  resolveCanvaLayerLabel,
  type CanvaDesignTemplate,
  type CanvaTemplateCategory,
  type CanvaTemplateElement,
} from '../../data/ksaCanvaTemplates';
import { StoreFontSelect } from './fonts/StoreFontSelect';
import { ensureStoreGoogleFontLoaded } from '../../data/storeGoogleFontsCatalog';
import {
  CANVA_UPLOAD_CATEGORIES,
  importDesignFile,
  type ImportedStudioDesign,
  type ImportedStudioLayer,
} from '../../services/canvaPsdImport';
import {
  buildCanvaDesignProject,
  downloadJsonFile,
  parseCanvaDesignProject,
  type CanvaProjectLayer,
} from '../../services/canvaDesignProject';
import {
  CANVA_ANIM_EASES,
  CANVA_ANIM_PRESETS,
  clipTextByTypeProgress,
  defaultTimelineMs,
  sampleLayerMotion,
  type CanvaAnimEase,
  type CanvaAnimPreset,
} from '../../services/canvaTimeline';
import { exportAnimatedGif, exportMotionVideo } from '../../services/canvaMotionExport';
import { downscaleDataUrlToPng, optimizeHomeThumb } from '../../services/canvaStudioPreview';
import { snapElementCenter, type SnapGuide } from '../../services/canvaSnapGuides';
import {
  MAGIC_RESIZE_PRESETS,
  magicResizeLayers,
  deriveBrandPalette,
} from '../../services/canvaMagicResize';
import JSZip from 'jszip';
import {
  deleteMyCanvaTemplate,
  listMyCanvaTemplates,
  myTemplateToDesignPayload,
  saveMyCanvaTemplate,
  type CanvaMyTemplate,
} from '../../services/canvaMyTemplates';
import {
  buildDraftProject,
  canvaDraftScope,
  clearCanvaStudioDraft,
  draftHasWork,
  loadCanvaStudioDraft,
  saveCanvaStudioDraft,
} from '../../services/canvaStudioDraft';
import {
  defaultPageName,
  insertAfterIndex,
  moveListItem,
  newStudioPageId,
  remapLayerIds,
  type CanvaStudioPageJson,
} from '../../services/canvaStudioPages';
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
import {
  CanvaContextMenu,
  clampContextMenuPos,
  type CanvaContextMenuPos,
} from './CanvaContextMenu';
import '../../styles/canva-studio-light.css';

export type CanvaEditorKind = 'banner' | 'logo' | 'product_card';

/** Full design snapshot for Master multi-store distribute (or advanced store save). */
export type CanvaSavePayload = {
  id?: string;
  /** Full-quality export (PNG preferred for transparency). */
  dataUrl: string;
  /** Optional downscaled PNG for template grid / last-saved thumbs. */
  previewDataUrl?: string;
  title: string;
  width: number;
  height: number;
  category: CanvaTemplateCategory;
  layers: ImportedStudioLayer[];
  designJson: Record<string, unknown>;
  source?: 'psd' | 'image' | 'pptx' | 'studio' | 'master';
};

/** Launch Design Studio editor from Canva home (template / blank / saved). */
export type CanvaHomeLaunch = {
  key: string;
  premadeId?: string;
  myTemplate?: CanvaMyTemplate;
  blank?: { width: number; height: number; blankId?: string; label?: string };
  /** Open file picker (PPTX / PSD / image) after editor boots */
  openImport?: boolean;
  /** Jump to Text tab + font picker after boot */
  openFonts?: boolean;
  /** Optional file already chosen on Canva home */
  importFile?: File;
};

export interface CanvaImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** modal = overlay from Media Library; page = full store tab workspace */
  variant?: 'modal' | 'page';
  /** Dedicated banner / logo / product-card editor screen */
  editorKind?: CanvaEditorKind;
  lockCategory?: boolean;
  initialAsset?: MediaAsset | null;
  /** From Canva home — open editor on this template / blank (skips stale draft). */
  homeLaunch?: CanvaHomeLaunch | null;
  onSaveNewAsset: (dataUrl: string, title: string, width: number, height: number) => void;
  onReplaceAsset?: (assetId: string, dataUrl: string, width: number, height: number) => void;
  onOpenSocialHub?: () => void;
  /** Master Admin: Save opens store picker via this payload (Media + Canva library). */
  masterMode?: boolean;
  onSaveDesignPayload?: (payload: CanvaSavePayload) => void | Promise<void>;
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
  shapeType?:
    | 'circle'
    | 'rectangle'
    | 'triangle'
    | 'star'
    | 'badge'
    | 'dot_grid'
    | 'wave_curve'
    | 'line'
    | 'arrow';
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  imageUrl?: string;
  locked?: boolean;
  /** Shared id when layers are grouped (Canva Group) */
  groupId?: string;
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
  /** Per-layer local background isolate (image / product cutout) */
  bgRemoved?: boolean;
  /** Per-layer image adjust (Canva-style) — % / px */
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  /** Timeline enter / exit animations */
  animIn?: CanvaAnimPreset;
  animOut?: CanvaAnimPreset;
  animDurationMs?: number;
  animOutDurationMs?: number;
  animDelayMs?: number;
  animEase?: CanvaAnimEase;
}

/** One Canva-style design page (content + lock / hide meta). */
type StudioPageLocal = {
  id: string;
  name: string;
  locked: boolean;
  hidden: boolean;
  backdrop: string;
  customSolidColor: string;
  productPos: { x: number; y: number; scale: number };
  flipH: boolean;
  flipV: boolean;
  bgRemoved: boolean;
  bgTolerance: number;
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
  };
  elements: CanvasElement[];
};

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
  pages: StudioPageLocal[];
  activePageId: string;
}

function makeBlankStudioPage(
  index: number,
  isAr: boolean,
  opts?: Partial<StudioPageLocal>,
): StudioPageLocal {
  return {
    id: opts?.id || newStudioPageId(),
    name: opts?.name || defaultPageName(index, isAr),
    locked: false,
    hidden: false,
    backdrop: opts?.backdrop ?? 'soft-ivory',
    customSolidColor: opts?.customSolidColor ?? '#faf8f5',
    productPos: opts?.productPos ?? { x: 540, y: 540, scale: 0 },
    flipH: false,
    flipV: false,
    bgRemoved: false,
    bgTolerance: 38,
    filters: opts?.filters ?? { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
    elements: opts?.elements ? JSON.parse(JSON.stringify(opts.elements)) : [],
  };
}

const STUDIO_BACKDROPS = [
  { id: 'original', labelEn: 'Original BG', labelAr: 'الخلفية الأصلية', css: 'transparent', hex1: '', hex2: '' },
  { id: 'transparent', labelEn: 'Transparent (PNG)', labelAr: 'شفاف بدون خلفية', css: 'checker', hex1: '', hex2: '' },
  { id: 'pure-white', labelEn: 'Pure Clean White', labelAr: 'أبيض ناصع', css: '#ffffff', hex1: '#ffffff', hex2: '#ffffff' },
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

/** Icons pack — FA-style names + emoji glyphs (export-safe on canvas) */
const QUICK_ICONS = [
  { id: 'phone', labelEn: 'Phone', labelAr: 'هاتف', glyph: '📞', fa: 'fa-phone' },
  { id: 'star', labelEn: 'Star', labelAr: 'نجمة', glyph: '⭐', fa: 'fa-star' },
  { id: 'coffee', labelEn: 'Cup', labelAr: 'كوب', glyph: '☕', fa: 'fa-coffee' },
  { id: 'shopping-bag', labelEn: 'Bag', labelAr: 'حقيبة', glyph: '🛍️', fa: 'fa-shopping-bag' },
  { id: 'heart', labelEn: 'Heart', labelAr: 'قلب', glyph: '❤️', fa: 'fa-heart' },
  { id: 'flame', labelEn: 'Fire', labelAr: 'نار', glyph: '🔥', fa: 'fa-fire' },
  { id: 'shield-check', labelEn: 'Shield', labelAr: 'درع', glyph: '🛡️', fa: 'fa-shield' },
  { id: 'truck', labelEn: 'Truck', labelAr: 'شاحنة', glyph: '🚚', fa: 'fa-truck' },
  { id: 'tag', labelEn: 'Tag', labelAr: 'وسم', glyph: '🏷️', fa: 'fa-tag' },
  { id: 'sparkles', labelEn: 'Sparkles', labelAr: 'بريق', glyph: '✨', fa: 'fa-sparkles' },
  { id: 'check', labelEn: 'Verified', labelAr: 'توثيق', glyph: '✅', fa: 'fa-check' },
  { id: 'zap', labelEn: 'Flash', labelAr: 'برق', glyph: '⚡', fa: 'fa-bolt' },
  { id: 'whatsapp', labelEn: 'Chat', labelAr: 'محادثة', glyph: '💬', fa: 'fa-comment' },
  { id: 'gift', labelEn: 'Gift', labelAr: 'هدية', glyph: '🎁', fa: 'fa-gift' },
  { id: 'percent', labelEn: 'Sale', labelAr: 'خصم', glyph: '٪', fa: 'fa-percent' },
  { id: 'location', labelEn: 'Pin', labelAr: 'موقع', glyph: '📍', fa: 'fa-location-dot' },
  { id: 'clock', labelEn: 'Clock', labelAr: 'وقت', glyph: '⏰', fa: 'fa-clock' },
  { id: 'camera', labelEn: 'Camera', labelAr: 'كاميرا', glyph: '📷', fa: 'fa-camera' },
  { id: 'cart', labelEn: 'Cart', labelAr: 'سلة', glyph: '🛒', fa: 'fa-cart-shopping' },
  { id: 'crown', labelEn: 'Crown', labelAr: 'تاج', glyph: '👑', fa: 'fa-crown' },
  { id: 'flower', labelEn: 'Flower', labelAr: 'زهرة', glyph: '🌸', fa: 'fa-spa' },
  { id: 'ksa', labelEn: 'Saudi', labelAr: 'السعودية', glyph: '🇸🇦', fa: 'fa-flag' },
  { id: 'package', labelEn: 'Box', labelAr: 'طرد', glyph: '📦', fa: 'fa-box' },
  { id: 'money', labelEn: 'Money', labelAr: 'مال', glyph: '💰', fa: 'fa-coins' },
  { id: 'trophy', labelEn: 'Trophy', labelAr: 'كأس', glyph: '🏆', fa: 'fa-trophy' },
  { id: 'megaphone', labelEn: 'Ads', labelAr: 'إعلان', glyph: '📢', fa: 'fa-bullhorn' },
  { id: 'user', labelEn: 'User', labelAr: 'مستخدم', glyph: '👤', fa: 'fa-user' },
  { id: 'home', labelEn: 'Home', labelAr: 'منزل', glyph: '🏠', fa: 'fa-house' },
  { id: 'envelope', labelEn: 'Email', labelAr: 'بريد', glyph: '✉️', fa: 'fa-envelope' },
  { id: 'globe', labelEn: 'Globe', labelAr: 'عالم', glyph: '🌐', fa: 'fa-globe' },
  { id: 'thumbs-up', labelEn: 'Like', labelAr: 'إعجاب', glyph: '👍', fa: 'fa-thumbs-up' },
  { id: 'bell', labelEn: 'Bell', labelAr: 'جرس', glyph: '🔔', fa: 'fa-bell' },
  { id: 'lock', labelEn: 'Lock', labelAr: 'قفل', glyph: '🔒', fa: 'fa-lock' },
  { id: 'wifi', labelEn: 'Wifi', labelAr: 'واي فاي', glyph: '📶', fa: 'fa-wifi' },
  { id: 'calendar', labelEn: 'Calendar', labelAr: 'تقويم', glyph: '📅', fa: 'fa-calendar' },
  { id: 'image', labelEn: 'Image', labelAr: 'صورة', glyph: '🖼️', fa: 'fa-image' },
];

/** Canva-style emoji sticker pack — each becomes its own editable layer */
const EMOJI_STICKERS = [
  '😀', '😍', '🤩', '😎', '🥳', '😇', '🙌', '👏', '👍', '🔥',
  '💯', '✨', '⭐', '🌟', '💫', '❤️', '💕', '💖', '🎉', '🎊',
  '🎁', '🛍️', '🛒', '💰', '💎', '🏆', '🥇', '📢', '💬', '✅',
  '☕', '🍰', '🌹', '🌸', '🌺', '💐', '🌴', '☀️', '🌙', '⚡',
  '🇸🇦', '🕌', '🕋', '🚚', '📦', '🏷️', '🧾', '📱', '📸', '🎨',
];

/** Local chroma-key cutout (Canva-like BG remove on canvas — not a fake cloud AI) */
function applyLocalBgCutout(
  source: HTMLImageElement | HTMLCanvasElement,
  destW: number,
  destH: number,
  tolerance: number,
): HTMLCanvasElement | null {
  const off = document.createElement('canvas');
  off.width = Math.max(1, Math.round(destW));
  off.height = Math.max(1, Math.round(destH));
  const offCtx = off.getContext('2d');
  if (!offCtx) return null;
  offCtx.drawImage(source, 0, 0, off.width, off.height);
  try {
    const imgData = offCtx.getImageData(0, 0, off.width, off.height);
    const d = imgData.data;
    const corners = [
      0,
      (off.width - 1) * 4,
      (off.height - 1) * off.width * 4,
      ((off.height - 1) * off.width + (off.width - 1)) * 4,
    ];
    let cR = 0;
    let cG = 0;
    let cB = 0;
    for (const idx of corners) {
      cR += d[idx];
      cG += d[idx + 1];
      cB += d[idx + 2];
    }
    cR /= corners.length;
    cG /= corners.length;
    cB /= corners.length;
    const tol = Math.max(8, tolerance * 2.8);
    for (let i = 0; i < d.length; i += 4) {
      const diff = Math.hypot(d[i] - cR, d[i + 1] - cG, d[i + 2] - cB);
      if (diff < tol) {
        d[i + 3] = Math.max(0, Math.min(255, (diff / tol - 0.55) * 900));
      }
    }
    offCtx.putImageData(imgData, 0, 0);
    return off;
  } catch {
    return null;
  }
}

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
  homeLaunch = null,
  onSaveNewAsset,
  onReplaceAsset,
  onOpenSocialHub,
  masterMode = false,
  onSaveDesignPayload,
}) => {
  const { activeStore, currentProducts, currentMedia } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);
  /** Canva vertical page stack — scroll active page into view */
  const pageBlockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const layoutCacheRef = useRef<Record<string, StudioRect>>({});
  const productBoundsRef = useRef<StudioRect | null>(null);

  // Document Title (Canva style: editable at top)
  const [docTitle, setDocTitle] = useState('Untitled Design');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  /** True only after real Save to Media — never pretend "cloud saved" */
  const [savedToMediaLibrary, setSavedToMediaLibrary] = useState(false);
  /** Local draft autosave (store_id scoped) — Survives soft-refresh / remount */
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved' | 'restored'>(
    'idle',
  );
  const [autoSaveAt, setAutoSaveAt] = useState<string | null>(null);
  const bootKeyRef = useRef<string | null>(null);
  const applyImportedDesignRef = useRef<
    | ((
        design: ImportedStudioDesign,
        opts?: { templateId?: string; keepCategory?: boolean },
      ) => void)
    | null
  >(null);
  const pendingHomeMineRef = useRef<{
    width: number;
    height: number;
    name: string;
    source: 'psd' | 'image' | 'pptx';
    layers: ImportedStudioLayer[];
    previewDataUrl?: string;
    categoryHint?: CanvaTemplateCategory;
    templateId: string;
  } | null>(null);
  const skipAutosaveRef = useRef(true);
  const applyProjectJsonRef = useRef<(
    project: ReturnType<typeof parseCanvaDesignProject>,
    opts?: { silent?: boolean; templateId?: string | null },
  ) => void>(() => undefined);

  // Loaded Product/Subject Image
  const [activeImageUrl, setActiveImageUrl] = useState<string>('');
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<
    | 'create'
    | 'templates'
    | 'elements'
    | 'text'
    | 'layers'
    | 'store_assets'
    | 'colors'
    | 'media'
    | 'filters'
    | 'settings'
    | 'timeline'
    | 'bg_remove'
  >('create');
  /** Canva Position panel: Arrange vs Layers */
  const [layersSubTab, setLayersSubTab] = useState<'arrange' | 'layers'>('layers');
  /** Canva Layers filter: All vs Overlapping */
  const [layersFilter, setLayersFilter] = useState<'all' | 'overlapping'>('all');
  const [layerDragId, setLayerDragId] = useState<string | null>(null);
  const [showSpacingPopover, setShowSpacingPopover] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showAddLayerMenu, setShowAddLayerMenu] = useState(false);
  /** Animation timeline (ms) — default end-state for editing */
  const [timelineDurationMs, setTimelineDurationMs] = useState(3000);
  const [playheadMs, setPlayheadMs] = useState(3000);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const [isExportingMotion, setIsExportingMotion] = useState(false);
  const timelineTimeRef = useRef(3000);
  const timelinePlayRafRef = useRef<number | null>(null);

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
  const [bgTolerance, setBgTolerance] = useState(42);
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Filters & Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blurAmount, setBlurAmount] = useState(0);

  // Interactive Elements List
  const [elements, setElements] = useState<CanvasElement[]>([]);
  /** Canva multi-page — active page content is mirrored in `elements` */
  const [studioPages, setStudioPages] = useState<StudioPageLocal[]>(() => [
    makeBlankStudioPage(0, false, { id: 'page-1', name: 'Page 1' }),
  ]);
  const [activePageId, setActivePageId] = useState('page-1');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  /** Multi-select (Shift+click) — drag moves all selected layers together */
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  /** Session uploads (My Files) — PNG/JPG added this session, one-click re-insert as layer */
  const [sessionUploads, setSessionUploads] = useState<
    Array<{ id: string; name: string; dataUrl: string; addedAt: string }>
  >([]);
  /** Custom create — emoji / badge / online image URL */
  const [customEmoji, setCustomEmoji] = useState('');
  const [customBadgeText, setCustomBadgeText] = useState('');
  const [customBadgeColor, setCustomBadgeColor] = useState('#e11d48');
  const [onlineImageUrl, setOnlineImageUrl] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const customIconInputRef = useRef<HTMLInputElement | null>(null);
  const multiDragOriginsRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  /** Temporary alignment guides while dragging */
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [isDraggingProduct, setIsDraggingProduct] = useState(false);
  const [productHeroSelected, setProductHeroSelected] = useState(false);
  const [isResizingProduct, setIsResizingProduct] = useState(false);
  const [isResizingElement, setIsResizingElement] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  /** Canva-like cursor over hit layers on the artboard */
  const [canvasHoverCursor, setCanvasHoverCursor] = useState<'default' | 'move' | 'grab' | 'grabbing'>(
    'default',
  );
  const canvasHoverCursorRef = useRef(canvasHoverCursor);
  const setCanvasHoverCursorSafe = (next: typeof canvasHoverCursor) => {
    if (canvasHoverCursorRef.current === next) return;
    canvasHoverCursorRef.current = next;
    setCanvasHoverCursor(next);
  };
  /** Comfortable default — tall Story (9:16) fits without looking like a square */
  const DEFAULT_VIEW_ZOOM = 0.6;
  const [viewZoom, setViewZoom] = useState(DEFAULT_VIEW_ZOOM);

  const canvasFrameBoxStyle = (w: number, h: number): React.CSSProperties => {
    const pageMode = variant === 'page';
    const portrait = h > w * 1.05;
    const landscape = w > h * 1.2;
    const maxH = pageMode ? 'min(72vh, 760px)' : 'min(60vh, 580px)';
    if (portrait) {
      return {
        aspectRatio: `${w} / ${h}`,
        height: maxH,
        width: 'auto',
        maxWidth: 'min(92%, 400px)',
        maxHeight: maxH,
        transform: `scale(${viewZoom})`,
        transformOrigin: 'center top',
      };
    }
    if (landscape) {
      return {
        aspectRatio: `${w} / ${h}`,
        width: '100%',
        maxWidth: 'min(100%, 920px)',
        maxHeight: maxH,
        height: 'auto',
        transform: `scale(${viewZoom})`,
        transformOrigin: 'center center',
      };
    }
    return {
      aspectRatio: '1 / 1',
      width: 'min(100%, 520px)',
      maxHeight: maxH,
      height: 'auto',
      transform: `scale(${viewZoom})`,
      transformOrigin: 'center center',
    };
  };
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
  /** Canva-style right-click menu */
  const [ctxMenu, setCtxMenu] = useState<CanvaContextMenuPos | null>(null);
  /** Copied layer(s) for Paste / Duplicate */
  const elementClipboardRef = useRef<CanvasElement[]>([]);
  /** Copied visual style (font/color/effects) — paste onto selection */
  const styleClipboardRef = useRef<Partial<CanvasElement> | null>(null);
  /** Live paste (layers + OS image) — set after handlers exist */
  const pasteLiveRef = useRef<() => void>(() => {});
  /** Prevent Ctrl+V + native paste from inserting the same image twice */
  const lastOsPasteAtRef = useRef(0);
  const [clipboardTick, setClipboardTick] = useState(0);
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [isImportingDesign, setIsImportingDesign] = useState(false);
  /** Default font for newly added text (Text tab / home Fonts launch) */
  const [studioDefaultFont, setStudioDefaultFont] = useState(() => (isAr ? 'Tajawal' : 'Outfit'));
  const [myTemplates, setMyTemplates] = useState<CanvaMyTemplate[]>([]);
  const [lastImported, setLastImported] = useState<ImportedStudioDesign | null>(null);
  const designFileInputRef = useRef<HTMLInputElement | null>(null);
  const projectJsonInputRef = useRef<HTMLInputElement | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<StudioHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyIndexRef = useRef(0);

  const [flyoutOpen, setFlyoutOpen] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  );

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

  // Dedicated editor presets — only when editorKind / open changes (NOT locale / product soft-refresh)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isAr only for initial titles on kind change
  }, [isOpen, editorKind]);

  // Bootstrap once per open + asset identity.
  // Do NOT depend on resolveCandidateUrl / products — soft-refresh was wiping canvas to blank.
  useEffect(() => {
    if (!isOpen) {
      bootKeyRef.current = null;
      skipAutosaveRef.current = true;
      return;
    }

    const storeId = activeStore?.id || '';
    const assetId = initialAsset?.id || null;
    const scope = canvaDraftScope({
      masterMode,
      editorKind: editorKind || null,
      assetId,
    });
    const launchKey = homeLaunch?.key || 'default';
    const bootKey = `${storeId}::${scope}::${launchKey}`;
    if (bootKeyRef.current === bootKey) return;
    bootKeyRef.current = bootKey;
    skipAutosaveRef.current = true;
    setAutoSaveState('idle');
    setAutoSaveAt(null);
    setSavedToMediaLibrary(false);

    const assetUrl = initialAsset
      ? initialAsset.originalUrl ||
        initialAsset.webpUrl ||
        initialAsset.thumbnailUrl ||
        initialAsset.optimizedUrl ||
        ''
      : '';

    // Restore local draft (template / layers) before blank bootstrap — fixes refresh data loss
    // Skip when launching from Canva home (explicit template / blank / saved design)
    if (!initialAsset && !homeLaunch && storeId) {
      const draft = loadCanvaStudioDraft(storeId, scope);
      if (draftHasWork(draft) && draft) {
        applyProjectJsonRef.current(draft.project, {
          silent: true,
          templateId: draft.selectedTemplateId,
        });
        setAutoSaveState('restored');
        setAutoSaveAt(draft.updatedAt);
        skipAutosaveRef.current = false;
        return;
      }
    }

    // Saved design from home → layers via applyProject path after import helper is ready
    if (!initialAsset && homeLaunch?.myTemplate) {
      const tpl = homeLaunch.myTemplate;
      const applyMine = (ready: typeof tpl) => {
        const payload = myTemplateToDesignPayload(ready);
        pendingHomeMineRef.current = {
          width: payload.width,
          height: payload.height,
          name: isAr ? ready.nameAr || ready.nameEn : ready.nameEn,
          source:
            ready.source === 'psd' ? 'psd' : ready.source === 'pptx' ? 'pptx' : 'image',
          layers: payload.layers,
          previewDataUrl: payload.previewDataUrl,
          categoryHint: ready.category,
          templateId: ready.id,
        };
        setCanvasW(payload.width);
        setCanvasH(payload.height);
        setElements([]);
        setSelectedTemplateId(ready.id);
        setSavedDesignId(ready.id);
        setLastImported(ready);
        setDocTitle(isAr ? ready.nameAr || ready.nameEn : ready.nameEn);
        setUploadCategory(ready.category);
        skipAutosaveRef.current = false;
        void Promise.resolve().then(() => {
          const pending = pendingHomeMineRef.current;
          if (!pending) return;
          pendingHomeMineRef.current = null;
          applyImportedDesignRef.current?.(
            {
              width: pending.width,
              height: pending.height,
              name: pending.name,
              source: pending.source,
              layers: pending.layers,
              previewDataUrl: pending.previewDataUrl,
              categoryHint: pending.categoryHint,
            },
            { templateId: pending.templateId, keepCategory: true },
          );
        });
      };

      if (!tpl.layers?.length && activeStore?.id) {
        setCanvasW(tpl.width || 1080);
        setCanvasH(tpl.height || 1080);
        setDocTitle(isAr ? tpl.nameAr || tpl.nameEn : tpl.nameEn);
        void (async () => {
          try {
            const { ensurePptxTemplateLayers } = await import('../../services/canvaPptxPackHydrate');
            const ready = await ensurePptxTemplateLayers(activeStore.id, tpl);
            applyMine(ready);
          } catch {
            applyMine(tpl);
          }
        })();
        return;
      }

      applyMine(tpl);
      return;
    }

    // Media image / PNG → open as editable layer design
    if (initialAsset && assetUrl) {
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
          imageUrl: assetUrl,
          x: Math.round(w / 2),
          y: Math.round(h / 2),
          width: w,
          height: h,
          fontSize: 16,
          fontColor: '#0f172a',
          borderRadius: 0,
          opacity: 1,
        };

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
        setViewZoom(DEFAULT_VIEW_ZOOM);

        const bootPage = makeBlankStudioPage(0, isAr, {
          backdrop: 'transparent',
          customSolidColor: '#ffffff',
          productPos: { x: Math.round(w / 2), y: Math.round(h / 2), scale: 0 },
          elements: [layer],
        });
        setStudioPages([bootPage]);
        setActivePageId(bootPage.id);

        const probe = new Image();
        probe.crossOrigin = 'anonymous';
        probe.onload = () => {
          imageCacheRef.current[assetUrl] = probe;
          setElements((prev) => [...prev]);
        };
        probe.src = assetUrl;
        imageCacheRef.current[assetUrl] = probe;

        setHistory([
          {
            elements: [layer],
            productPos: { x: Math.round(w / 2), y: Math.round(h / 2), scale: 0 },
            selectedBackdrop: 'transparent',
            customSolidColor: '#ffffff',
            bgRemoved: false,
            bgTolerance: 38,
            filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
            pages: [bootPage],
            activePageId: bootPage.id,
          },
        ]);
        historyIndexRef.current = 0;
        setHistoryIndex(0);
        skipAutosaveRef.current = false;
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
      dimProbe.src = assetUrl;
      return;
    }

    const fallbackUrl = currentProducts[0]?.image || activeStore.logo || '';
    loadStudioImage(fallbackUrl);

    let starter = getDefaultBlankTemplate('square');
    if (homeLaunch?.premadeId) {
      starter = getCanvaTemplate(homeLaunch.premadeId) || starter;
    } else if (homeLaunch?.blank) {
      const blankTpl =
        (homeLaunch.blank.blankId && getCanvaTemplate(homeLaunch.blank.blankId)) ||
        getDefaultBlankTemplate(
          homeLaunch.blank.height > homeLaunch.blank.width * 1.2
            ? 'story'
            : homeLaunch.blank.width > homeLaunch.blank.height * 1.2
              ? 'banner'
              : 'square',
        );
      starter = {
        ...blankTpl,
        width: homeLaunch.blank.width,
        height: homeLaunch.blank.height,
        nameEn: homeLaunch.blank.label || blankTpl.nameEn,
        nameAr: homeLaunch.blank.label || blankTpl.nameAr,
      };
    }

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

    const bootPage = makeBlankStudioPage(0, isAr, {
      backdrop: starter.backdropId || 'soft-ivory',
      customSolidColor: starter.customSolidColor || '#faf8f5',
      productPos: { x: px, y: py, scale: 0 },
      elements: mapped,
    });
    setStudioPages([bootPage]);
    setActivePageId(bootPage.id);

    setHistory([
      {
        elements: mapped,
        productPos: { x: px, y: py, scale: 0 },
        selectedBackdrop: starter.backdropId || 'soft-ivory',
        customSolidColor: starter.customSolidColor || '#faf8f5',
        bgRemoved: false,
        bgTolerance: 38,
        filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
        pages: [bootPage],
        activePageId: bootPage.id,
      },
    ]);
    historyIndexRef.current = 0;
    setHistoryIndex(0);
    skipAutosaveRef.current = false;
    // intentionally omit resolveCandidateUrl / currentProducts — product soft-refresh must not wipe canvas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialAsset?.id, activeStore?.id, editorKind, masterMode, homeLaunch?.key]);

  const activePageMeta = studioPages.find((p) => p.id === activePageId) || studioPages[0];
  const activePageLocked = Boolean(activePageMeta?.locked);
  const activePageHidden = Boolean(activePageMeta?.hidden);

  const flushPagesFromEditor = useCallback(
    (overrideElements?: CanvasElement[]): StudioPageLocal[] => {
      const els = overrideElements ?? elements;
      return studioPages.map((page) => {
        if (page.id !== activePageId) return page;
        return {
          ...page,
          backdrop: selectedBackdrop,
          customSolidColor,
          productPos: { x: productPosX, y: productPosY, scale: productScale },
          flipH,
          flipV,
          bgRemoved,
          bgTolerance,
          filters: { brightness, contrast, saturation, blur: blurAmount },
          elements: JSON.parse(JSON.stringify(els)) as CanvasElement[],
        };
      });
    },
    [
      studioPages,
      activePageId,
      elements,
      selectedBackdrop,
      customSolidColor,
      productPosX,
      productPosY,
      productScale,
      flipH,
      flipV,
      bgRemoved,
      bgTolerance,
      brightness,
      contrast,
      saturation,
      blurAmount,
    ],
  );

  const hydrateEditorFromPage = useCallback((page: StudioPageLocal) => {
    setActivePageId(page.id);
    setSelectedBackdrop(page.backdrop);
    setCustomSolidColor(page.customSolidColor);
    setProductPosX(page.productPos.x);
    setProductPosY(page.productPos.y);
    setProductScale(page.productPos.scale);
    setFlipH(Boolean(page.flipH));
    setFlipV(Boolean(page.flipV));
    setBgRemoved(Boolean(page.bgRemoved));
    setBgTolerance(page.bgTolerance ?? 38);
    setBrightness(page.filters.brightness);
    setContrast(page.filters.contrast);
    setSaturation(page.filters.saturation);
    setBlurAmount(page.filters.blur);
    setElements(JSON.parse(JSON.stringify(page.elements)) as CanvasElement[]);
    setSelectedElementId(null);
    setSelectedElementIds([]);
    setProductHeroSelected(false);
    setCtxMenu(null);
  }, []);

  // Snapshot State for Undo / Redo
  const pushHistorySnapshot = useCallback(
    (overrideElements?: CanvasElement[]) => {
      const pagesSnap = flushPagesFromEditor(overrideElements);
      const snap: StudioHistorySnapshot = {
        elements: JSON.parse(JSON.stringify(overrideElements ?? elements)),
        productPos: { x: productPosX, y: productPosY, scale: productScale },
        selectedBackdrop,
        customSolidColor,
        bgRemoved,
        bgTolerance,
        filters: { brightness, contrast, saturation, blur: blurAmount },
        pages: JSON.parse(JSON.stringify(pagesSnap)),
        activePageId,
      };
      setStudioPages(pagesSnap);
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
      flushPagesFromEditor,
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
      activePageId,
    ],
  );

  const applyHistorySnap = useCallback((snap: StudioHistorySnapshot) => {
    if (snap.pages?.length) {
      setStudioPages(JSON.parse(JSON.stringify(snap.pages)));
      setActivePageId(snap.activePageId || snap.pages[0].id);
    }
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

  // Main Canvas Rendering Engine
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvasW;
    const H = canvasH;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;

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
    } else if (preset?.id === 'transparent') {
      // Leave pixels alpha-clear — frame checker + fixed border show transparency in the editor
    } else if (preset && preset.id !== 'original' && preset.id !== 'transparent') {
      const isFlatWhite =
        preset.id === 'pure-white' ||
        (preset.hex1 === '#ffffff' && (!preset.hex2 || preset.hex2 === '#ffffff'));
      if (!isFlatWhite && preset.hex1 && preset.hex2 && preset.hex1 !== preset.hex2) {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, preset.hex1);
        grad.addColorStop(1, preset.hex2);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = preset.hex1 || '#ffffff';
      }
      ctx.fillRect(0, 0, W, H);

      // Ambient vignette — never on Pure White (user wants full white, no shadow)
      if (!isFlatWhite) {
        const radial = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.7);
        radial.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        radial.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, W, H);
      }
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
        const cut = applyLocalBgCutout(loadedImg, drawW, drawH, bgTolerance);
        if (cut) ctx.drawImage(cut, drawX, drawY);
        else ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);
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
    const motionTime = timelineTimeRef.current;
    elements.forEach((el) => {
      if (el.hidden) return;
      const motion = sampleLayerMotion(el, motionTime, timelineDurationMs);
      if (!motion.visible) return;
      ctx.save();

      // Timeline motion + rotate / flip (around layer center)
      ctx.translate(el.x + motion.offsetX, el.y + motion.offsetY);
      ctx.scale(motion.scale * (el.flipH ? -1 : 1), motion.scale * (el.flipV ? -1 : 1));
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-el.x, -el.y);

      const baseOpacity = el.opacity !== undefined ? el.opacity : 1;
      const isTextLike =
        el.type === 'headline' ||
        el.type === 'subtitle' ||
        el.type === 'custom_text' ||
        el.type === 'badge' ||
        el.type === 'price';
      // Text stays fully readable — never wash out below ~90% when visible
      const opacityFloor = isTextLike && motion.visible ? 0.9 : 0;
      ctx.globalAlpha = Math.max(
        opacityFloor,
        Math.min(1, baseOpacity * motion.opacity),
      );
      const typeProgress = motion.typeProgress;

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
        } else if (el.shapeType === 'line' || el.shapeType === 'arrow') {
          const stroke = el.strokeColor || el.bgColor || '#0f172a';
          const lw = el.strokeWidth || 3;
          ctx.beginPath();
          ctx.moveTo(el.x - w / 2, el.y);
          ctx.lineTo(el.x + w / 2 - (el.shapeType === 'arrow' ? Math.min(18, w * 0.12) : 0), el.y);
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lw;
          ctx.lineCap = 'round';
          ctx.stroke();
          if (el.shapeType === 'arrow') {
            const head = Math.min(22, Math.max(12, w * 0.14));
            ctx.beginPath();
            ctx.moveTo(el.x + w / 2, el.y);
            ctx.lineTo(el.x + w / 2 - head, el.y - head * 0.55);
            ctx.lineTo(el.x + w / 2 - head, el.y + head * 0.55);
            ctx.closePath();
            ctx.fillStyle = stroke;
            ctx.fill();
          }
          layoutCacheRef.current[el.id] = {
            x: el.x - w / 2,
            y: el.y - Math.max(lw, 12) - 6,
            w,
            h: Math.max(lw, 12) * 2 + 12,
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

      // --- ICON / EMOJI STICKER ELEMENT ---
      if (el.type === 'icon' || el.type === 'sticker') {
        ctx.fillStyle = el.fontColor || '#0f172a';
        ctx.font = `${el.fontSize || 48}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const item = QUICK_ICONS.find((i) => i.id === el.icon);
        const glyph = el.type === 'sticker' ? el.text || '✨' : item ? item.glyph : el.text || '★';
        if (el.shadowEnabled) {
          ctx.shadowColor = el.shadowColor || 'rgba(0,0,0,0.35)';
          ctx.shadowBlur = el.shadowBlur ?? 8;
          ctx.shadowOffsetX = el.shadowOffsetX ?? 0;
          ctx.shadowOffsetY = el.shadowOffsetY ?? 2;
        }
        ctx.fillText(glyph, el.x, el.y);
        ctx.shadowColor = 'transparent';
        const iconSide = Math.max(32, (el.fontSize || 48) * 1.45);
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
          const layerBright = el.brightness ?? 100;
          const layerContrast = el.contrast ?? 100;
          const layerSat = el.saturation ?? 100;
          const layerBlur = el.blur ?? 0;
          if (
            layerBright !== 100 ||
            layerContrast !== 100 ||
            layerSat !== 100 ||
            layerBlur > 0
          ) {
            ctx.filter = `brightness(${layerBright}%) contrast(${layerContrast}%) saturate(${layerSat}%)${
              layerBlur > 0 ? ` blur(${layerBlur}px)` : ''
            }`;
          }
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
          if (el.bgRemoved) {
            const cut = applyLocalBgCutout(cached, w, h, bgTolerance);
            if (cut) ctx.drawImage(cut, el.x - w / 2, el.y - h / 2);
            else ctx.drawImage(cached, el.x - w / 2, el.y - h / 2, w, h);
          } else {
            ctx.drawImage(cached, el.x - w / 2, el.y - h / 2, w, h);
          }
          ctx.filter = 'none';
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
      // Full readable: flip ink first (black/white); pill only if still weak
      const readable = ensureReadableTextStyle(el.fontColor, el.bgColor, canvasApprox, {
        preferPill: true,
        minRatio: 4.5,
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

      const animText =
        typeProgress < 0.999 ? clipTextByTypeProgress(el.text, typeProgress) : el.text;
      if (!animText.trim() && typeProgress < 0.999) {
        ctx.restore();
        return;
      }
      const lines = animText.split('\n');
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
    timelineDurationMs,
  ]);

  useEffect(() => {
    timelineTimeRef.current = playheadMs;
    if (isOpen) renderCanvas();
  }, [isOpen, playheadMs, renderCanvas]);

  useEffect(() => {
    if (!isPlayingTimeline) {
      if (timelinePlayRafRef.current != null) {
        cancelAnimationFrame(timelinePlayRafRef.current);
        timelinePlayRafRef.current = null;
      }
      return;
    }
    let start = performance.now();
    const from = playheadMs >= timelineDurationMs - 16 ? 0 : playheadMs;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(timelineDurationMs, from + elapsed);
      timelineTimeRef.current = t;
      setPlayheadMs(t);
      renderCanvas();
      if (t >= timelineDurationMs) {
        setIsPlayingTimeline(false);
        return;
      }
      timelinePlayRafRef.current = requestAnimationFrame(tick);
    };
    timelinePlayRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (timelinePlayRafRef.current != null) {
        cancelAnimationFrame(timelinePlayRafRef.current);
        timelinePlayRafRef.current = null;
      }
    };
    // intentionally only restart when play toggled / duration changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayingTimeline, timelineDurationMs]);

  useEffect(() => {
    setShowSpacingPopover(false);
  }, [selectedElementId]);

  useEffect(() => {
    const approx = resolveCanvasApproxColor(selectedBackdrop, customSolidColor, gradientColor2);
    setElements((prev) => {
      let changed = false;
      const next = prev.map((el) => {
        if (
          el.type === 'shape' ||
          el.type === 'image' ||
          el.type === 'icon' ||
          el.type === 'sticker'
        ) {
          return el;
        }
        const readable = ensureReadableTextStyle(el.fontColor, el.bgColor, approx, {
          preferPill: true,
          minRatio: 4.5,
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
  // Applies to selected image layer first; otherwise the product hero.
  const handleAiRemoveBg = () => {
    setIsProcessingAi(true);
    const sel = elements.find((e) => e.id === selectedElementId);
    if (sel && sel.type === 'image' && sel.imageUrl) {
      const nextOn = !sel.bgRemoved;
      updateSelectedElement({ bgRemoved: nextOn });
      setIsProcessingAi(false);
      toast(
        nextOn
          ? isAr
            ? 'تم عزل خلفية الطبقة محلياً (قطع لوني).'
            : 'Layer background isolated locally (chroma cutout).'
          : isAr
            ? 'أُعيدت خلفية الطبقة.'
            : 'Layer background restored.',
        'success',
      );
      return;
    }
    const next = !bgRemoved;
    setBgRemoved(next);
    if (next && selectedBackdrop === 'original') {
      setSelectedBackdrop('transparent');
    }
    setIsProcessingAi(false);
    pushHistorySnapshot();
    toast(
      next
        ? isAr
          ? 'تم عزل خلفية صورة المنتج محلياً — ليس ذكاء اصطناعي.'
          : 'Product background isolated locally — not AI.'
        : isAr
          ? 'أُعيدت خلفية صورة المنتج.'
          : 'Product image background restored.',
      'success',
    );
  };

  const formatStudioPrice = (price: number | string | undefined | null): string => {
    if (price == null || price === '') return '';
    const n = typeof price === 'number' ? price : Number(price);
    if (!Number.isFinite(n)) return '';
    return `${n} ${'⃁'}`;
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
    setLastImported(null); // clear prior PNG/PSD so old layers never bleed into premade
    setCanvasW(template.width);
    setCanvasH(template.height);
    setViewZoom(DEFAULT_VIEW_ZOOM);
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
          { preferPill: true, minRatio: 4.5 },
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

    const page = makeBlankStudioPage(0, isAr, {
      backdrop: template.backdropId,
      customSolidColor: template.customSolidColor || customSolidColor,
      productPos: {
        x: Math.round(template.productPosPct.x * template.width),
        y: Math.round(template.productPosPct.y * template.height),
        scale: template.productPosPct.scale,
      },
      elements: mapped,
    });
    setStudioPages([page]);
    setActivePageId(page.id);
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
            minRatio: 4.5,
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
        // Imported text: keep fully opaque so white-on-white never looks “ghost”
        opacity: isTextLayer
          ? Math.max(0.95, layer.opacity ?? 1)
          : layer.opacity ?? 1,
        imageUrl: layer.imageUrl,
        locked: layer.locked,
        fontFamily: isAr ? 'Tajawal' : 'Outfit',
        borderRadius: 0,
        bgPadding: 14,
        shapeType: layer.type === 'shape' ? 'rectangle' : undefined,
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
    setViewZoom(DEFAULT_VIEW_ZOOM);
    setSelectedBackdrop('custom');
    setCustomSolidColor('#ffffff');
    setProductScale(0);
    setProductPosX(Math.round(design.width / 2));
    setProductPosY(Math.round(design.height / 2));

    const mapped = mapImportedLayers(design.layers);
    const page = makeBlankStudioPage(0, isAr, {
      backdrop: 'custom',
      customSolidColor: '#ffffff',
      productPos: {
        x: Math.round(design.width / 2),
        y: Math.round(design.height / 2),
        scale: 0,
      },
      elements: mapped,
    });
    setStudioPages([page]);
    setActivePageId(page.id);
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
      design.source === 'pptx'
        ? isAr
          ? `تم استيراد كانفا / باوربوينت · ${mapped.length} طبقة — انسخ والصق بحرية`
          : `Canva / PowerPoint imported · ${mapped.length} layers — copy & paste freely`
        : isAr
          ? `تم فتح التصميم · ${mapped.length} طبقة قابلة للتعديل`
          : `Design loaded · ${mapped.length} editable layer(s)`,
      'success',
    );
  };
  applyImportedDesignRef.current = applyImportedDesign;

  const refreshMyTemplates = useCallback(async () => {
    if (!activeStore?.id) {
      setMyTemplates([]);
      return;
    }
    try {
      const { hydratePptxStudioPackForStore } = await import('../../services/canvaPptxPackHydrate');
      // Lean stubs only — top 10 page, never download full ~200MB pack / every design on open
      if (masterMode) {
        await hydratePptxStudioPackForStore('master-platform', { page: 1, perPage: 10 });
      }
      await hydratePptxStudioPackForStore(activeStore.id, { page: 1, perPage: 10 });
    } catch {
      /* pack optional */
    }
    if (masterMode) {
      const masterRows = await listMyCanvaTemplates('master-platform');
      // Panel filters by activeStore.id — remap display only; IndexedDB stays master-platform
      setMyTemplates(
        masterRows.map((r) => ({
          ...r,
          storeId: activeStore.id,
          fromMaster: true,
          source: 'master' as const,
        })),
      );
      return;
    }
    const rows = await listMyCanvaTemplates(activeStore.id);
    setMyTemplates(rows);
  }, [activeStore?.id, masterMode]);

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
      const rawPng = canvasRef.current?.toDataURL('image/png') || lastImported?.previewDataUrl || '';
      const preview = rawPng ? await optimizeHomeThumb(rawPng) : undefined;
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
            pages: pagesToProjectJson(flushPagesFromEditor()),
            activePageId,
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
    const isLine = shapeType === 'line' || shapeType === 'arrow';
    const newShape: CanvasElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shapeType,
      text: '',
      x: Math.round(canvasW / 2),
      y: Math.round(canvasH / 2),
      width: isWave ? 420 : isDots ? 120 : isLine ? 280 : 160,
      height: isWave ? 600 : isDots ? 100 : isLine ? 12 : 160,
      fontSize: 16,
      fontColor: '#ffffff',
      bgColor: isWave
        ? 'rgba(29, 139, 148, 0.55)'
        : isDots
          ? '#4fb8b4'
          : isLine
            ? 'transparent'
            : '#1d8b94',
      strokeColor: isWave ? '#4fb8b4' : isLine ? '#1d8b94' : '#ffffff',
      strokeWidth: isDots ? 0 : isLine ? 4 : 2,
      borderRadius: 16,
      opacity: 0.95,
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
      opacity: 1,
    };
    setElements((prev) => [...prev, newIcon]);
    setSelectedElementId(newIcon.id);
    pushHistorySnapshot();
    toast(isAr ? 'تمت إضافة الأيقونة بنجاح!' : 'Icon added to canvas!', 'info');
  };

  /** Add emoji as its own editable sticker layer (Canva Elements → Stickers) */
  const handleAddEmojiSticker = (emoji: string) => {
    const layer: CanvasElement = {
      id: `emoji-${Date.now()}`,
      type: 'sticker',
      text: emoji,
      x: Math.round(canvasW / 2 + (elements.length % 5) * 18),
      y: Math.round(canvasH / 2 + (elements.length % 4) * 18),
      fontSize: 72,
      fontColor: '#0f172a',
      opacity: 1,
    };
    setElements((prev) => [...prev, layer]);
    setSelectedElementId(layer.id);
    pushHistorySnapshot();
    toast(isAr ? 'تمت إضافة الرمز كطبقة قابلة للتعديل!' : 'Emoji added as editable layer!', 'info');
  };

  // Quick Add Text Element — high-contrast readable ink (Canva default)
  const handleAddTextElement = (type: CanvasElement['type'], defaultText: string) => {
    const isFilled = type === 'price' || type === 'badge';
    const canvasApprox = resolveCanvasApproxColor(selectedBackdrop, customSolidColor, gradientColor2);
    const baseFont = isFilled ? '#ffffff' : '#0f172a';
    const baseBg = type === 'price' ? '#059669' : type === 'badge' ? '#e11d48' : 'transparent';
    const readable = ensureReadableTextStyle(baseFont, baseBg, canvasApprox, {
      preferPill: true,
      minRatio: 4.5,
    });
    const newEl: CanvasElement = {
      id: `el-${Date.now()}`,
      type,
      text: defaultText,
      x: Math.round(canvasW / 2),
      y: Math.round(canvasH / 2) + (elements.length % 5) * 35,
      fontSize: type === 'headline' ? 44 : type === 'price' ? 34 : type === 'subtitle' ? 26 : 22,
      fontColor: readable.fontColor,
      bgColor: readable.bgColor,
      bgPadding: 16,
      borderRadius: 20,
      isBold: true,
      textAlign: 'center',
      fontFamily: studioDefaultFont || (isAr ? 'Tajawal' : 'Outfit'),
    };
    ensureStoreGoogleFontLoaded(newEl.fontFamily || studioDefaultFont);
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

  // Delete Selected Element(s) — supports multi-select
  const handleDeleteSelected = () => {
    if (activePageLocked) {
      toast(isAr ? 'الصفحة مقفلة' : 'Page is locked', 'info');
      return;
    }
    const ids = selectedElementIds.length
      ? selectedElementIds
      : selectedElementId
        ? [selectedElementId]
        : [];
    if (!ids.length) return;
    const idSet = new Set(ids);
    setElements((prev) => {
      const next = prev.filter((el) => !idSet.has(el.id));
      queueMicrotask(() => pushHistorySnapshot(next));
      return next;
    });
    setSelectedElementId(null);
    setSelectedElementIds([]);
  };

  const getSelectedElements = (): CanvasElement[] => {
    const ids = selectedElementIds.length
      ? selectedElementIds
      : selectedElementId
        ? [selectedElementId]
        : [];
    if (!ids.length) return [];
    const idSet = new Set(ids);
    return elements.filter((el) => idSet.has(el.id));
  };

  const STUDIO_CLIP_MIME = 'application/x-unityteck-canva-layers';

  const handleCopySelected = () => {
    const targets = getSelectedElements();
    if (!targets.length) return;
    elementClipboardRef.current = targets.map((t) => ({ ...t }));
    setClipboardTick((n) => n + 1);

    // Also push to OS clipboard — paste text into other apps OR re-paste layers here
    const textParts = targets
      .map((t) => (t.text || '').trim())
      .filter(Boolean);
    const plain = textParts.join('\n');
    const payload = JSON.stringify({
      v: 1,
      kind: 'unityteck-canva-layers',
      layers: targets,
    });
    try {
      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(plain || payload);
      }
      // Prefer rich clipboard when available (Chromium)
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const parts: Record<string, Blob> = {
          'text/plain': new Blob([plain || ' '], { type: 'text/plain' }),
        };
        try {
          parts[STUDIO_CLIP_MIME] = new Blob([payload], { type: STUDIO_CLIP_MIME });
        } catch {
          /* custom MIME may be blocked */
        }
        void navigator.clipboard.write([new ClipboardItem(parts)]).catch(() => undefined);
      }
    } catch {
      /* clipboard permission — in-app paste still works via ref */
    }

    toast(
      isAr
        ? `تم النسخ · ${targets.length} عنصر — يمكن اللصق هنا أو لصق النص في مكان آخر`
        : `Copied · ${targets.length} layer(s) — paste here or paste text elsewhere`,
      'info',
    );
  };

  const handleCopyStyleSelected = () => {
    const target = getSelectedElements()[0];
    if (!target) return;
    styleClipboardRef.current = {
      fontSize: target.fontSize,
      fontColor: target.fontColor,
      bgColor: target.bgColor,
      bgPadding: target.bgPadding,
      borderRadius: target.borderRadius,
      isBold: target.isBold,
      isItalic: target.isItalic,
      fontWeight: target.fontWeight,
      underline: target.underline,
      strikethrough: target.strikethrough,
      textAlign: target.textAlign,
      fontFamily: target.fontFamily,
      strokeColor: target.strokeColor,
      strokeWidth: target.strokeWidth,
      opacity: target.opacity,
      shadowEnabled: target.shadowEnabled,
      shadowColor: target.shadowColor,
      shadowBlur: target.shadowBlur,
      shadowOffsetX: target.shadowOffsetX,
      shadowOffsetY: target.shadowOffsetY,
      letterSpacing: target.letterSpacing,
      lineHeight: target.lineHeight,
      verticalAlign: target.verticalAlign,
    };
    setClipboardTick((n) => n + 1);
    toast(isAr ? 'تم نسخ النمط' : 'Style copied', 'info');
  };

  const pasteElementsFromClipboard = (mode: 'paste' | 'duplicate') => {
    const clip = elementClipboardRef.current;
    if (!clip.length) {
      const style = styleClipboardRef.current;
      if (style && selectedElementId && mode === 'paste') {
        updateSelectedElement(style);
        toast(isAr ? 'تم لصق النمط' : 'Style pasted', 'success');
      }
      return;
    }
    const offset = mode === 'duplicate' ? 35 : 40;
    const stamp = Date.now();
    const dups: CanvasElement[] = clip.map((t, i) => ({
      ...t,
      id: `el-${stamp}-${i}`,
      x: Math.min(t.x + offset, canvasW - 50),
      y: Math.min(t.y + offset, canvasH - 50),
      locked: false,
    }));
    setElements((prev) => {
      const next = [...prev, ...dups];
      queueMicrotask(() => pushHistorySnapshot(next));
      return next;
    });
    setSelectedElementIds(dups.map((d) => d.id));
    setSelectedElementId(dups[dups.length - 1]?.id || null);
    toast(
      mode === 'duplicate'
        ? isAr
          ? `تم التكرار · ${dups.length} طبقة`
          : `Duplicated · ${dups.length} layer(s)`
        : isAr
          ? `تم اللصق · ${dups.length} طبقة`
          : `Pasted · ${dups.length} layer(s)`,
      'success',
    );
  };

  const handlePasteClipboard = () => pasteElementsFromClipboard('paste');

  // Duplicate Selected Element(s) — same as Canva Ctrl+D
  const handleDuplicateSelected = () => {
    if (activePageLocked) {
      toast(isAr ? 'الصفحة مقفلة' : 'Page is locked', 'info');
      return;
    }
    const targets = getSelectedElements();
    if (!targets.length) return;
    elementClipboardRef.current = targets.map((t) => ({ ...t }));
    setClipboardTick((n) => n + 1);
    pasteElementsFromClipboard('duplicate');
  };

  const handleToggleLockSelected = () => {
    if (activePageLocked) {
      toast(isAr ? 'الصفحة مقفلة' : 'Page is locked', 'info');
      return;
    }
    const targets = getSelectedElements();
    if (!targets.length) return;
    const lockNext = !targets.every((t) => t.locked);
    const idSet = new Set(targets.map((t) => t.id));
    setElements((prev) => {
      const next = prev.map((el) =>
        idSet.has(el.id) ? { ...el, locked: lockNext } : el,
      );
      queueMicrotask(() => pushHistorySnapshot(next));
      return next;
    });
  };

  const pushPageHistory = (pagesNext: StudioPageLocal[], nextActiveId: string) => {
    const active = pagesNext.find((p) => p.id === nextActiveId) || pagesNext[0];
    if (!active) return;
    const snap: StudioHistorySnapshot = {
      elements: JSON.parse(JSON.stringify(active.elements)),
      productPos: { ...active.productPos },
      selectedBackdrop: active.backdrop,
      customSolidColor: active.customSolidColor,
      bgRemoved: active.bgRemoved,
      bgTolerance: active.bgTolerance,
      filters: { ...active.filters },
      pages: JSON.parse(JSON.stringify(pagesNext)),
      activePageId: active.id,
    };
    setSavedToMediaLibrary(false);
    setHistory((prev) => {
      const idx = historyIndexRef.current;
      const next = [...prev.slice(0, idx + 1), snap].slice(-40);
      historyIndexRef.current = next.length - 1;
      setHistoryIndex(next.length - 1);
      return next;
    });
  };

  /** Canva: blank page inserted below the given (or active) page */
  const handleAddBlankPage = (afterPageId?: string) => {
    const flushed = flushPagesFromEditor();
    const afterId = afterPageId || activePageId;
    const afterIdx = Math.max(
      0,
      flushed.findIndex((p) => p.id === afterId),
    );
    const blank = makeBlankStudioPage(afterIdx + 1, isAr, {
      backdrop: selectedBackdrop === 'original' ? 'soft-ivory' : selectedBackdrop,
      customSolidColor,
      productPos: { x: Math.round(canvasW / 2), y: Math.round(canvasH / 2), scale: 0 },
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
      elements: [],
    });
    const pagesNext = insertAfterIndex(flushed, afterIdx, blank);
    setStudioPages(pagesNext);
    hydrateEditorFromPage(blank);
    pushPageHistory(pagesNext, blank.id);
    toast(isAr ? 'تمت إضافة صفحة فارغة' : 'Blank page added below', 'success');
  };

  /** Canva: duplicate page design as a new page below it */
  const handleDuplicatePage = (pageId?: string) => {
    const flushed = flushPagesFromEditor();
    const tid = pageId || activePageId;
    const srcIdx = Math.max(
      0,
      flushed.findIndex((p) => p.id === tid),
    );
    const src = flushed[srcIdx] || flushed.find((p) => p.id === tid);
    if (!src) return;
    const clone: StudioPageLocal = {
      ...JSON.parse(JSON.stringify(src)),
      id: newStudioPageId(),
      name: isAr ? `${src.name} · نسخة` : `${src.name} · copy`,
      locked: false,
      elements: remapLayerIds(JSON.parse(JSON.stringify(src.elements)) as CanvasElement[]),
    };
    const pagesNext = insertAfterIndex(flushed, srcIdx, clone);
    setStudioPages(pagesNext);
    hydrateEditorFromPage(clone);
    pushPageHistory(pagesNext, clone.id);
    toast(isAr ? 'تم تكرار الصفحة' : 'Page duplicated below', 'success');
  };

  const handleDeletePage = (pageId?: string) => {
    if (studioPages.length <= 1) {
      toast(isAr ? 'لا يمكن حذف الصفحة الوحيدة' : 'Cannot delete the only page', 'info');
      return;
    }
    const flushed = flushPagesFromEditor();
    const tid = pageId || activePageId;
    const delIdx = flushed.findIndex((p) => p.id === tid);
    if (delIdx < 0) return;
    const pagesNext = flushed.filter((p) => p.id !== tid);
    const nextIdx = Math.min(Math.max(0, delIdx), pagesNext.length - 1);
    const nextPage = pagesNext[nextIdx];
    setStudioPages(pagesNext);
    hydrateEditorFromPage(nextPage);
    pushPageHistory(pagesNext, nextPage.id);
    toast(isAr ? 'تم حذف الصفحة' : 'Page deleted', 'success');
  };

  const handleTogglePageLock = (pageId?: string) => {
    const flushed = flushPagesFromEditor();
    const tid = pageId || activePageId;
    const pagesNext = flushed.map((p) =>
      p.id === tid ? { ...p, locked: !p.locked } : p,
    );
    setStudioPages(pagesNext);
    pushPageHistory(pagesNext, activePageId === tid ? tid : activePageId);
    const nowLocked = pagesNext.find((p) => p.id === tid)?.locked;
    toast(
      nowLocked
        ? isAr
          ? 'تم قفل الصفحة'
          : 'Page locked'
        : isAr
          ? 'تم فتح قفل الصفحة'
          : 'Page unlocked',
      'info',
    );
  };

  const handleTogglePageHidden = (pageId?: string) => {
    const flushed = flushPagesFromEditor();
    const tid = pageId || activePageId;
    const pagesNext = flushed.map((p) =>
      p.id === tid ? { ...p, hidden: !p.hidden } : p,
    );
    setStudioPages(pagesNext);
    pushPageHistory(pagesNext, activePageId === tid ? tid : activePageId);
    const nowHidden = pagesNext.find((p) => p.id === tid)?.hidden;
    toast(
      nowHidden
        ? isAr
          ? 'تم إخفاء الصفحة'
          : 'Page hidden'
        : isAr
          ? 'تم إظهار الصفحة'
          : 'Page visible',
      'info',
    );
  };

  const handleRenamePage = (pageId: string, raw: string) => {
    const name = raw.replace(/\s+/g, ' ').trim().slice(0, 80);
    const flushed = flushPagesFromEditor();
    const pagesNext = flushed.map((p) => (p.id === pageId ? { ...p, name } : p));
    setStudioPages(pagesNext);
    if (pageId === activePageId) {
      pushPageHistory(pagesNext, activePageId);
    }
  };

  const handleGroupSelected = () => {
    const ids =
      selectedElementIds.length > 1
        ? selectedElementIds
        : selectedElementId
          ? [selectedElementId]
          : [];
    if (ids.length < 2) {
      toast(
        isAr ? 'حدد طبقتين أو أكثر للتجميع (Shift).' : 'Select 2+ layers to group (Shift).',
        'info',
      );
      return;
    }
    const gid = `grp-${Date.now()}`;
    setElements((prev) => {
      const next = prev.map((el) => (ids.includes(el.id) ? { ...el, groupId: gid } : el));
      queueMicrotask(() => pushHistorySnapshot(next));
      return next;
    });
    toast(isAr ? 'تم تجميع الطبقات' : 'Layers grouped', 'success');
  };

  const handleUngroupSelected = () => {
    const ids = new Set(
      selectedElementIds.length
        ? selectedElementIds
        : selectedElementId
          ? [selectedElementId]
          : [],
    );
    const gid =
      elements.find((el) => ids.has(el.id) && el.groupId)?.groupId ||
      elements.find((el) => el.id === selectedElementId)?.groupId;
    if (!gid) {
      toast(isAr ? 'لا توجد مجموعة محددة' : 'No group selected', 'info');
      return;
    }
    setElements((prev) => {
      const next = prev.map((el) =>
        el.groupId === gid ? { ...el, groupId: undefined } : el,
      );
      queueMicrotask(() => pushHistorySnapshot(next));
      return next;
    });
    toast(isAr ? 'تم فك التجميع' : 'Ungrouped', 'success');
  };

  const handleMagicResize = (toW: number, toH: number, label: string) => {
    const nextLayers = magicResizeLayers(elements, canvasW, canvasH, toW, toH);
    setCanvasW(toW);
    setCanvasH(toH);
    setViewZoom(DEFAULT_VIEW_ZOOM);
    setElements(nextLayers);
    setProductPosX(Math.round(productPosX * (toW / Math.max(1, canvasW))));
    setProductPosY(Math.round(productPosY * (toH / Math.max(1, canvasH))));
    queueMicrotask(() => pushHistorySnapshot(nextLayers));
    setShowExportMenu(false);
    toast(
      isAr
        ? `تم تغيير المقاس إلى ${label} (${toW}×${toH}) — تحجيم نسبي، بدون ذكاء اصطناعي.`
        : `Resized to ${label} (${toW}×${toH}) — proportional scale, not AI.`,
      'success',
    );
  };

  const handleExportPagesZip = async () => {
    setShowExportMenu(false);
    try {
      const zip = new JSZip();
      const activePng = exportCanvasDataUrl('image/png');
      if (activePng) {
        const b64 = activePng.split(',')[1] || '';
        zip.file(`page-active-${canvasW}x${canvasH}.png`, b64, { base64: true });
      }
      const flushed = flushPagesFromEditor();
      const project = buildCanvaDesignProject({
        title: docTitle || (isAr ? 'تصميم' : 'Design'),
        width: canvasW,
        height: canvasH,
        category: uploadCategory,
        backdrop: selectedBackdrop,
        customSolidColor,
        gradient: {
          type: gradientType,
          angle: gradientAngle,
          c1: gradientColor1,
          c2: gradientColor2,
          c3: gradientColor3,
        },
        product: { x: productPosX, y: productPosY, scale: productScale, flipH, flipV },
        filters: { brightness, contrast, saturation, blur: blurAmount },
        layers: layersToProjectPayload(elements),
        pages: pagesToProjectJson(flushed),
        activePageId,
      });
      zip.file('project.json', JSON.stringify(project, null, 2));
      zip.file(
        'README.txt',
        isAr
          ? `حزمة تصميم Unityteck\nالصفحات: ${flushed.length}\nPNG = الصفحة النشطة فقط.\nproject.json يحتوي كل الصفحات والطبقات.`
          : `Unityteck design pack\nPages: ${flushed.length}\nPNG = active page only.\nproject.json holds all pages and layers.`,
      );
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(docTitle || 'studio-design').toLowerCase().replace(/\s+/g, '-')}-pages.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast(
        isAr
          ? `تم تنزيل الحزمة: PNG للصفحة النشطة + ملف المشروع (${flushed.length} صفحة).`
          : `ZIP downloaded: active PNG + project JSON (${flushed.length} pages).`,
        'success',
      );
    } catch {
      toast(isAr ? 'فشل تصدير الحزمة.' : 'ZIP export failed.', 'error');
    }
  };

  const handleMovePage = (dir: -1 | 1, pageId?: string) => {
    const flushed = flushPagesFromEditor();
    const tid = pageId || activePageId;
    const from = flushed.findIndex((p) => p.id === tid);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= flushed.length) return;
    const pagesNext = moveListItem(flushed, from, to);
    setStudioPages(pagesNext);
    pushPageHistory(pagesNext, tid);
  };

  const handleSelectPage = (pageId: string) => {
    if (pageId === activePageId) return;
    const flushed = flushPagesFromEditor();
    const target = flushed.find((p) => p.id === pageId);
    if (!target) return;
    setStudioPages(flushed);
    hydrateEditorFromPage(target);
  };

  useEffect(() => {
    if (!isOpen || !activePageId) return;
    const block = pageBlockRefs.current[activePageId];
    if (!block) return;
    block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activePageId, isOpen, studioPages.length]);

  const hitTestElementAt = (x: number, y: number): CanvasElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.hidden) continue;
      const bounds = layoutCacheRef.current[el.id] || estimateElementBounds(el);
      if (rectContainsPoint(bounds, x, y, 8)) return el;
    }
    return null;
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = getCanvasCoords(e);
    const hit = hitTestElementAt(x, y);
    if (hit) {
      const keepGroup =
        selectedElementIds.length > 1 && selectedElementIds.includes(hit.id);
      if (!keepGroup) selectSingleLayer(hit.id);
      else setSelectedElementId(hit.id);
    }
    const pos = clampContextMenuPos(e.clientX, e.clientY);
    setCtxMenu({
      clientX: e.clientX,
      clientY: e.clientY,
      x: pos.x,
      y: pos.y,
      elementId: hit?.id || selectedElementId,
    });
  };

  // Keyboard: Undo / Redo / Copy / Paste / Duplicate / Delete / Lock (Canva-like)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if ((e.key === 'Delete' || e.key === 'Backspace') && !mod) {
        if (selectedElementId || selectedElementIds.length) {
          e.preventDefault();
          handleDeleteSelected();
          setCtxMenu(null);
        }
        return;
      }

      if (e.altKey && e.shiftKey && key === 'l') {
        e.preventDefault();
        handleToggleLockSelected();
        return;
      }

      if (!mod) return;

      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      } else if (key === 'c' && e.altKey) {
        e.preventDefault();
        handleCopyStyleSelected();
      } else if (key === 'c') {
        e.preventDefault();
        handleCopySelected();
      } else if (key === 'v') {
        // Studio layer clipboard → paste here. Empty → allow native paste for OS/PowerPoint images.
        if (elementClipboardRef.current.length || styleClipboardRef.current) {
          e.preventDefault();
          pasteLiveRef.current();
        }
      } else if (key === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Update selected element — commit=true pushes undo snapshot
  const updateSelectedElement = (updates: Partial<CanvasElement>, commit = true) => {
    if (!selectedElementId || activePageLocked) return;
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

  const selectSingleLayer = (id: string | null) => {
    setSelectedElementId(id);
    setSelectedElementIds(id ? [id] : []);
  };

  const nudgeSelected = (dx: number, dy: number) => {
    const ids = selectedElementIds.length
      ? selectedElementIds
      : selectedElementId
        ? [selectedElementId]
        : [];
    if (!ids.length) return;
    const idSet = new Set(ids);
    setElements((prev) =>
      prev.map((el) =>
        idSet.has(el.id) && !el.locked
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
    if (activePageLocked) {
      // Allow selection only — no drag / resize while page is locked
      const { x, y } = getCanvasCoords(e);
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.hidden) continue;
        const bounds = layoutCacheRef.current[el.id] || estimateElementBounds(el);
        if (rectContainsPoint(bounds, x, y, 8)) {
          selectSingleLayer(el.id);
          return;
        }
      }
      selectSingleLayer(null);
      return;
    }
    const { x, y } = getCanvasCoords(e);
    const shift =
      'shiftKey' in e
        ? Boolean((e as React.MouseEvent).shiftKey)
        : Boolean((e as React.TouchEvent).nativeEvent && false);

    // Hit test top → bottom (Canva-like). Select locked layers too; only skip drag when locked.
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.hidden) continue;
      const bounds = layoutCacheRef.current[el.id] || estimateElementBounds(el);
      if (rectContainsPoint(bounds, x, y, 8)) {
        setProductHeroSelected(false);
        let dragIds: string[] = [el.id];
        if (shift) {
          const next = selectedElementIds.includes(el.id)
            ? selectedElementIds.filter((id) => id !== el.id)
            : [...selectedElementIds, el.id];
          setSelectedElementIds(next);
          setSelectedElementId(next[next.length - 1] || null);
          dragIds = next.length ? next : [el.id];
        } else {
          const keepGroup =
            selectedElementIds.length > 1 && selectedElementIds.includes(el.id);
          if (keepGroup) {
            setSelectedElementId(el.id);
            dragIds = selectedElementIds;
          } else if (el.groupId) {
            const mates = elements.filter((row) => row.groupId === el.groupId).map((row) => row.id);
            setSelectedElementIds(mates);
            setSelectedElementId(el.id);
            dragIds = mates;
          } else {
            selectSingleLayer(el.id);
            dragIds = [el.id];
          }
        }
        const unlocked = dragIds.filter((id) => {
          const row = elements.find((row) => row.id === id);
          return row && !row.locked;
        });
        if (unlocked.length && !el.locked) {
          setIsDraggingElement(true);
          setDragOffset({ x: x - el.x, y: y - el.y });
          const origins: Record<string, { x: number; y: number }> = {};
          for (const id of unlocked) {
            const row = elements.find((row) => row.id === id);
            if (row) origins[id] = { x: row.x, y: row.y };
          }
          multiDragOriginsRef.current = origins;
        } else {
          multiDragOriginsRef.current = null;
        }
        return;
      }
    }

    const productBounds = productBoundsRef.current;
    if (productBounds && productScale > 0 && rectContainsPoint(productBounds, x, y, 4)) {
      setProductHeroSelected(true);
      selectSingleLayer(null);
      setIsDraggingProduct(true);
      setDragOffset({ x: x - productPosX, y: y - productPosY });
      return;
    }

    selectSingleLayer(null);
    setProductHeroSelected(false);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCanvasCoords(e);

    if (!isDraggingElement && !isDraggingProduct && !isResizingElement && !isResizingProduct) {
      const hit = hitTestElementAt(x, y);
      if (hit) {
        setCanvasHoverCursorSafe(hit.locked ? 'default' : 'grab');
      } else if (productBoundsRef.current && rectContainsPoint(productBoundsRef.current, x, y, 6)) {
        setCanvasHoverCursorSafe('grab');
      } else {
        setCanvasHoverCursorSafe('default');
      }
      return;
    }

    if (isDraggingElement || isDraggingProduct) {
      setCanvasHoverCursorSafe('grabbing');
    }

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
      let nextX = Math.max(15, Math.min(canvasW - 15, x - dragOffset.x));
      let nextY = Math.max(15, Math.min(canvasH - 15, y - dragOffset.y));
      const moving = elements.find((el) => el.id === selectedElementId);
      const bounds = moving
        ? layoutCacheRef.current[moving.id] || estimateElementBounds(moving)
        : null;
      const mw = bounds?.w || moving?.width || 120;
      const mh = bounds?.h || moving?.height || 40;
      const others = elements
        .filter((el) => {
          if (el.id === selectedElementId || el.hidden) return false;
          const origins = multiDragOriginsRef.current;
          if (origins && origins[el.id]) return false;
          return true;
        })
        .map((el) => {
          const b = layoutCacheRef.current[el.id] || estimateElementBounds(el);
          return { id: el.id, cx: el.x, cy: el.y, w: b.w, h: b.h };
        });
      const snapped = snapElementCenter({
        cx: nextX,
        cy: nextY,
        w: mw,
        h: mh,
        canvasW,
        canvasH,
        others,
      });
      nextX = Math.max(15, Math.min(canvasW - 15, snapped.cx));
      nextY = Math.max(15, Math.min(canvasH - 15, snapped.cy));
      setSnapGuides(snapped.guides);
      const origins = multiDragOriginsRef.current;
      if (origins && Object.keys(origins).length > 1 && origins[selectedElementId]) {
        const ox = origins[selectedElementId].x;
        const oy = origins[selectedElementId].y;
        const dx = nextX - ox;
        const dy = nextY - oy;
        setElements((prev) =>
          prev.map((el) => {
            const o = origins[el.id];
            if (!o) return el;
            return {
              ...el,
              x: Math.max(15, Math.min(canvasW - 15, o.x + dx)),
              y: Math.max(15, Math.min(canvasH - 15, o.y + dy)),
            };
          }),
        );
      } else {
        setElements((prev) =>
          prev.map((el) => (el.id === selectedElementId ? { ...el, x: nextX, y: nextY } : el)),
        );
      }
    } else if (isDraggingProduct) {
      let nextX = Math.max(30, Math.min(canvasW - 30, x - dragOffset.x));
      let nextY = Math.max(30, Math.min(canvasH - 30, y - dragOffset.y));
      const snapped = snapElementCenter({
        cx: nextX,
        cy: nextY,
        w: 120,
        h: 120,
        canvasW,
        canvasH,
        others: elements
          .filter((el) => !el.hidden)
          .map((el) => {
            const b = layoutCacheRef.current[el.id] || estimateElementBounds(el);
            return { id: el.id, cx: el.x, cy: el.y, w: b.w, h: b.h };
          }),
      });
      nextX = snapped.cx;
      nextY = snapped.cy;
      setSnapGuides(snapped.guides);
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
      multiDragOriginsRef.current = null;
      setSnapGuides([]);
      setCanvasHoverCursorSafe('grab');
      pushHistorySnapshot();
    }
  };

  const insertImageDataUrlAsLayer = (
    dataUrl: string,
    name: string,
    opts?: { trackSession?: boolean },
  ) => {
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
        text: name || (isAr ? 'صورة' : 'Image'),
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
      selectSingleLayer(layer.id);
      pushHistorySnapshot();
      if (opts?.trackSession !== false) {
        setSessionUploads((prev) => {
          if (prev.some((u) => u.dataUrl === dataUrl)) return prev;
          return [
            {
              id: `up-${Date.now()}`,
              name: name || (isAr ? 'ملف' : 'File'),
              dataUrl,
              addedAt: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 48);
        });
      }
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

  const insertPlainTextAsLayer = (raw: string) => {
    const text = raw.replace(/\r\n/g, '\n').trim();
    if (!text) return false;
    const canvasApprox = resolveCanvasApproxColor(selectedBackdrop, customSolidColor, gradientColor2);
    const readable = ensureReadableTextStyle('#0f172a', 'transparent', canvasApprox, {
      preferPill: true,
      minRatio: 4.5,
    });
    const el: CanvasElement = {
      id: `el-paste-${Date.now()}`,
      type: text.length > 40 || text.includes('\n') ? 'subtitle' : 'custom_text',
      text,
      x: Math.round(canvasW / 2),
      y: Math.round(canvasH / 2),
      width: Math.min(canvasW * 0.7, 520),
      height: Math.max(48, Math.min(220, 28 + text.split('\n').length * 28)),
      fontSize: 28,
      fontColor: readable.fontColor,
      bgColor: readable.bgColor,
      bgPadding: 12,
      borderRadius: 12,
      isBold: true,
      textAlign: 'center',
      fontFamily: isAr ? 'Tajawal' : 'Outfit',
    };
    setElements((prev) => {
      const next = [...prev, el];
      queueMicrotask(() => pushHistorySnapshot(next));
      return next;
    });
    setSelectedElementId(el.id);
    setSelectedElementIds([el.id]);
    toast(isAr ? 'تم لصق النص كطبقة' : 'Text pasted as a layer', 'success');
    return true;
  };

  /** Live OS clipboard: layers JSON → image → plain text (Canva/PowerPoint copy) */
  const pasteFromOsClipboard = async (): Promise<boolean> => {
    try {
      if (!navigator.clipboard?.read) {
        // Fallback: try readText for plain content copied from Canva
        if (navigator.clipboard?.readText) {
          const t = await navigator.clipboard.readText();
          if (t?.trim()) {
            try {
              const parsed = JSON.parse(t);
              if (parsed?.kind === 'unityteck-canva-layers' && Array.isArray(parsed.layers)) {
                elementClipboardRef.current = parsed.layers;
                handlePasteClipboard();
                return true;
              }
            } catch {
              /* plain text */
            }
            return insertPlainTextAsLayer(t);
          }
        }
        return false;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        // Custom studio layers mime
        if (item.types.includes('application/x-unityteck-canva-layers')) {
          try {
            const blob = await item.getType('application/x-unityteck-canva-layers');
            const raw = await blob.text();
            const parsed = JSON.parse(raw);
            if (parsed?.kind === 'unityteck-canva-layers' && Array.isArray(parsed.layers)) {
              elementClipboardRef.current = parsed.layers;
              handlePasteClipboard();
              return true;
            }
          } catch {
            /* continue */
          }
        }
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          if (Date.now() - lastOsPasteAtRef.current < 500) return true;
          const blob = await item.getType(imageType);
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('CLIPBOARD_READ_FAIL'));
            reader.readAsDataURL(blob);
          });
          if (dataUrl) {
            lastOsPasteAtRef.current = Date.now();
            insertImageDataUrlAsLayer(dataUrl, isAr ? 'لصق من الحافظة' : 'Pasted image');
            return true;
          }
        }
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const t = (await blob.text()).trim();
          if (!t) continue;
          try {
            const parsed = JSON.parse(t);
            if (parsed?.kind === 'unityteck-canva-layers' && Array.isArray(parsed.layers)) {
              elementClipboardRef.current = parsed.layers;
              handlePasteClipboard();
              return true;
            }
          } catch {
            /* plain */
          }
          return insertPlainTextAsLayer(t);
        }
      }
    } catch {
      /* permission denied / empty — fall through */
    }
    return false;
  };

  const handlePasteLive = async () => {
    if (elementClipboardRef.current.length || styleClipboardRef.current) {
      handlePasteClipboard();
      return;
    }
    const fromOs = await pasteFromOsClipboard();
    if (!fromOs) {
      toast(
        isAr
          ? 'لا يوجد شيء للصق. انسخ طبقة هنا، أو انسخ نصاً / صورة من كانفا أو باوربوينت ثم الصق (Ctrl+V).'
          : 'Nothing to paste. Copy a layer here, or copy text/image from Canva or PowerPoint then Ctrl+V.',
        'info',
      );
    }
  };
  pasteLiveRef.current = () => {
    void handlePasteLive();
  };

  // Native paste (Canva / PowerPoint / OS → text or image layer) when not typing in an input
  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      // Studio layer clipboard is handled on keydown Ctrl+V
      if (elementClipboardRef.current.length || styleClipboardRef.current) return;
      const items = e.clipboardData?.items;
      if (!items?.length) return;

      // Prefer image, then plain text (Canva text copy → new layer)
      for (const item of Array.from(items)) {
        if (!item.type.startsWith('image/')) continue;
        e.preventDefault();
        if (Date.now() - lastOsPasteAtRef.current < 500) return;
        const file = item.getAsFile();
        if (!file) continue;
        lastOsPasteAtRef.current = Date.now();
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result || '');
          if (dataUrl) {
            insertImageDataUrlAsLayer(dataUrl, isAr ? 'لصق من الحافظة' : 'Pasted image');
          }
        };
        reader.readAsDataURL(file);
        return;
      }
      for (const item of Array.from(items)) {
        if (item.type !== 'text/plain') continue;
        e.preventDefault();
        item.getAsString((raw) => {
          const t = String(raw || '').trim();
          if (!t) return;
          try {
            const parsed = JSON.parse(t);
            if (parsed?.kind === 'unityteck-canva-layers' && Array.isArray(parsed.layers)) {
              elementClipboardRef.current = parsed.layers;
              handlePasteClipboard();
              return;
            }
          } catch {
            /* plain text from Canva / Word / browser */
          }
          insertPlainTextAsLayer(t);
        });
        return;
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isOpen, isAr]);

  // Upload PNG/JPG/WebP as one extra image layer on current canvas
  const handleUploadLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      insertImageDataUrlAsLayer(dataUrl, file.name.replace(/\.[^.]+$/, '') || file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /** Full design import: PPTX / PSD / PNG → replace canvas with editable layers */
  const importDesignFromFile = async (file: File) => {
    setIsImportingDesign(true);
    const IMPORT_TIMEOUT_MS = 45000;
    try {
      const design = await Promise.race([
        importDesignFile(file),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('PPTX_TIMEOUT')), IMPORT_TIMEOUT_MS);
        }),
      ]);
      applyImportedDesign(design);
      setActiveTab('layers');
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      const msg =
        code === 'PSD_TOO_LARGE' ||
        code === 'IMAGE_TOO_LARGE' ||
        code === 'PPTX_TOO_LARGE'
          ? isAr
            ? 'الملف كبير جداً.'
            : 'File is too large.'
          : code === 'PSD_NO_LAYERS' || code === 'PPTX_NO_LAYERS' || code === 'PPTX_NO_SLIDES'
            ? isAr
              ? 'لا توجد طبقات قابلة للقراءة في الملف.'
              : 'No readable layers in that file.'
            : code === 'PPT_LEGACY'
              ? isAr
                ? 'صيغة باوربوينت القديمة غير مدعومة. احفظ العرض بالصيغة الحديثة ثم ارفعه.'
                : 'Legacy PPT is not supported. Save as PPTX in PowerPoint, then upload.'
              : code === 'PPTX_TIMEOUT'
                ? isAr
                  ? 'استيراد العرض استغرق وقتاً طويلاً. جرّب ملفاً أصغر أو صدّر من كانفا كصورة ثم ارفعها.'
                  : 'Import timed out. Try a smaller file, or download PNG from Canva and upload that.'
                : code === 'UNSUPPORTED_FILE'
                  ? isAr
                    ? 'الصيغ المدعومة: عرض باوربوينت، ملف فوتوشوب، بي إن جي، جيه بي جيه، ويب.'
                    : 'Supported: PPTX, PSD, PNG, JPG, WebP.'
                  : code === 'PSD_LOADER_FAIL' || code === 'PPTX_LOADER_FAIL'
                    ? isAr
                      ? 'تعذر تحميل قارئ الملف. أعد تحميل الصفحة.'
                      : 'Could not load the file reader. Refresh the page.'
                    : code === 'PPTX_BAD_ARCHIVE'
                      ? isAr
                        ? 'ملف باوربوينت تالف أو غير صالح.'
                        : 'That PowerPoint file is damaged or invalid.'
                      : isAr
                        ? 'تعذر استيراد التصميم.'
                        : 'Could not import that design.';
      toast(msg, 'error');
    } finally {
      setIsImportingDesign(false);
    }
  };

  const handleImportDesignFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await importDesignFromFile(file);
  };

  // Home → Import / Fonts intents (per launch key only once)
  useEffect(() => {
    if (!isOpen || !homeLaunch?.key) return;
    if (!homeLaunch.openImport && !homeLaunch.openFonts) return;
    const t = window.setTimeout(() => {
      if (homeLaunch.openFonts) {
        setActiveTab('text');
      }
      if (homeLaunch.importFile) {
        void importDesignFromFile(homeLaunch.importFile);
      } else if (homeLaunch.openImport) {
        designFileInputRef.current?.click();
      }
    }, 280);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, homeLaunch?.key]);

  const layersToProjectPayload = (els: CanvasElement[] = elements): CanvaProjectLayer[] =>
    els.map((el) => ({
      id: el.id,
      type: el.type,
      text: el.text,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      rotation: el.rotation,
      fontSize: el.fontSize,
      fontColor: el.fontColor,
      bgColor: el.bgColor,
      bgPadding: el.bgPadding,
      borderRadius: el.borderRadius,
      isBold: el.isBold,
      isItalic: el.isItalic,
      fontWeight: el.fontWeight,
      underline: el.underline,
      strikethrough: el.strikethrough,
      textAlign: el.textAlign,
      fontFamily: el.fontFamily,
      shapeType: el.shapeType,
      strokeColor: el.strokeColor,
      strokeWidth: el.strokeWidth,
      opacity: el.opacity,
      imageUrl: el.imageUrl,
      locked: el.locked,
      hidden: el.hidden,
      shadowEnabled: el.shadowEnabled,
      shadowColor: el.shadowColor,
      shadowBlur: el.shadowBlur,
      shadowOffsetX: el.shadowOffsetX,
      shadowOffsetY: el.shadowOffsetY,
      flipH: el.flipH,
      flipV: el.flipV,
      letterSpacing: el.letterSpacing,
      lineHeight: el.lineHeight,
      verticalAlign: el.verticalAlign,
      icon: el.icon,
      badgeStyle: el.badgeStyle,
      groupId: el.groupId,
      bgRemoved: el.bgRemoved,
      brightness: el.brightness,
      contrast: el.contrast,
      saturation: el.saturation,
      blur: el.blur,
      animIn: el.animIn,
      animOut: el.animOut,
      animDurationMs: el.animDurationMs,
      animOutDurationMs: el.animOutDurationMs,
      animDelayMs: el.animDelayMs,
      animEase: el.animEase,
    }));

  const pagesToProjectJson = (pages: StudioPageLocal[]): CanvaStudioPageJson[] =>
    pages.map((page) => ({
      id: page.id,
      name: page.name,
      locked: page.locked,
      hidden: page.hidden,
      backdrop: page.backdrop,
      customSolidColor: page.customSolidColor,
      product: {
        x: page.productPos.x,
        y: page.productPos.y,
        scale: page.productPos.scale,
        flipH: page.flipH,
        flipV: page.flipV,
      },
      filters: { ...page.filters },
      bgRemoved: page.bgRemoved,
      bgTolerance: page.bgTolerance,
      layers: layersToProjectPayload(page.elements),
    }));

  const mapProjectLayersToElements = (projectLayers: CanvaProjectLayer[]): CanvasElement[] =>
    mapImportedLayers(
      projectLayers.map((layer) => ({
        id: layer.id,
        type: layer.type as ImportedStudioLayer['type'],
        text: layer.text,
        x: layer.x,
        y: layer.y,
        width: layer.width || 120,
        height: layer.height || 120,
        fontSize: layer.fontSize,
        fontColor: layer.fontColor,
        bgColor: layer.bgColor,
        isBold: layer.isBold,
        isItalic: layer.isItalic,
        textAlign: layer.textAlign,
        opacity: layer.opacity,
        imageUrl: layer.imageUrl,
        locked: layer.locked,
      })),
    ).map((el, idx) => {
      const src = projectLayers[idx];
      if (!src) return el;
      return {
        ...el,
        rotation: src.rotation,
        fontFamily: src.fontFamily || el.fontFamily,
        fontWeight: src.fontWeight as CanvasElement['fontWeight'],
        underline: src.underline,
        strikethrough: src.strikethrough,
        shapeType: src.shapeType as CanvasElement['shapeType'],
        strokeColor: src.strokeColor,
        strokeWidth: src.strokeWidth,
        hidden: src.hidden,
        shadowEnabled: src.shadowEnabled,
        shadowColor: src.shadowColor,
        shadowBlur: src.shadowBlur,
        shadowOffsetX: src.shadowOffsetX,
        shadowOffsetY: src.shadowOffsetY,
        flipH: src.flipH,
        flipV: src.flipV,
        letterSpacing: src.letterSpacing,
        lineHeight: src.lineHeight,
        verticalAlign: src.verticalAlign,
        icon: src.icon,
        badgeStyle: src.badgeStyle as CanvasElement['badgeStyle'],
        groupId: src.groupId,
        bgRemoved: src.bgRemoved,
        borderRadius: src.borderRadius,
        bgPadding: src.bgPadding,
        brightness: src.brightness,
        contrast: src.contrast,
        saturation: src.saturation,
        blur: src.blur,
        animIn: src.animIn as CanvasElement['animIn'],
        animOut: src.animOut as CanvasElement['animOut'],
        animDurationMs: src.animDurationMs,
        animOutDurationMs: src.animOutDurationMs,
        animDelayMs: src.animDelayMs,
        animEase: src.animEase as CanvasElement['animEase'],
      };
    });

  const handleExportProjectJson = () => {
    const flushed = flushPagesFromEditor();
    const project = buildCanvaDesignProject({
      title: docTitle || (isAr ? 'تصميم' : 'Design'),
      width: canvasW,
      height: canvasH,
      category: uploadCategory,
      backdrop: selectedBackdrop,
      customSolidColor,
      gradient: {
        type: gradientType,
        angle: gradientAngle,
        c1: gradientColor1,
        c2: gradientColor2,
        c3: gradientColor3,
      },
      product: { x: productPosX, y: productPosY, scale: productScale, flipH, flipV },
      filters: { brightness, contrast, saturation, blur: blurAmount },
      layers: layersToProjectPayload(),
      pages: pagesToProjectJson(flushed),
      activePageId,
    });
    const slug = (docTitle || 'studio-design').toLowerCase().replace(/\s+/g, '-').slice(0, 48);
    downloadJsonFile(`${slug}.canva-project.json`, project);
    setShowExportMenu(false);
    toast(isAr ? 'تم تصدير ملف المشروع — يمكن استيراده لاحقاً.' : 'Project JSON exported — re-import anytime.', 'success');
  };

  const applyProjectJson = (
    project: ReturnType<typeof parseCanvaDesignProject>,
    opts?: { silent?: boolean; templateId?: string | null },
  ) => {
    setCanvasW(project.width);
    setViewZoom(DEFAULT_VIEW_ZOOM);
    setCanvasH(project.height);
    setDocTitle(project.title);
    setSelectedBackdrop(project.backdrop || 'custom');
    setCustomSolidColor(project.customSolidColor || '#ffffff');
    if (project.gradient) {
      setGradientType(project.gradient.type);
      setGradientAngle(project.gradient.angle);
      setGradientColor1(project.gradient.c1);
      setGradientColor2(project.gradient.c2);
      setGradientColor3(project.gradient.c3);
    }
    if (project.product) {
      setProductPosX(project.product.x);
      setProductPosY(project.product.y);
      setProductScale(project.product.scale);
      setFlipH(Boolean(project.product.flipH));
      setFlipV(Boolean(project.product.flipV));
    }
    if (project.filters) {
      setBrightness(project.filters.brightness);
      setContrast(project.filters.contrast);
      setSaturation(project.filters.saturation);
      setBlurAmount(project.filters.blur);
    }
    if (project.category) {
      setUploadCategory(project.category as CanvaTemplateCategory);
    }
    if (opts?.templateId !== undefined) {
      setSelectedTemplateId(opts.templateId);
    }
    const mapped = mapImportedLayers(
      project.layers.map((layer) => ({
        id: layer.id,
        type: layer.type as ImportedStudioLayer['type'],
        text: layer.text,
        x: layer.x,
        y: layer.y,
        width: layer.width || 120,
        height: layer.height || 120,
        fontSize: layer.fontSize,
        fontColor: layer.fontColor,
        bgColor: layer.bgColor,
        isBold: layer.isBold,
        isItalic: layer.isItalic,
        textAlign: layer.textAlign,
        opacity: layer.opacity,
        imageUrl: layer.imageUrl,
        locked: layer.locked,
      })),
    ).map((el, idx) => {
      const src = project.layers[idx];
      if (!src) return el;
      return {
        ...el,
        rotation: src.rotation,
        fontFamily: src.fontFamily || el.fontFamily,
        fontWeight: src.fontWeight as CanvasElement['fontWeight'],
        underline: src.underline,
        strikethrough: src.strikethrough,
        shapeType: src.shapeType as CanvasElement['shapeType'],
        strokeColor: src.strokeColor,
        strokeWidth: src.strokeWidth,
        hidden: src.hidden,
        shadowEnabled: src.shadowEnabled,
        shadowColor: src.shadowColor,
        shadowBlur: src.shadowBlur,
        shadowOffsetX: src.shadowOffsetX,
        shadowOffsetY: src.shadowOffsetY,
        flipH: src.flipH,
        flipV: src.flipV,
        letterSpacing: src.letterSpacing,
        lineHeight: src.lineHeight,
        verticalAlign: src.verticalAlign,
        icon: src.icon,
        badgeStyle: src.badgeStyle as CanvasElement['badgeStyle'],
        groupId: src.groupId,
        bgRemoved: src.bgRemoved,
        borderRadius: src.borderRadius,
        bgPadding: src.bgPadding,
        brightness: src.brightness,
        contrast: src.contrast,
        saturation: src.saturation,
        blur: src.blur,
        animIn: src.animIn as CanvasElement['animIn'],
        animOut: src.animOut as CanvasElement['animOut'],
        animDurationMs: src.animDurationMs,
        animOutDurationMs: src.animOutDurationMs,
        animDelayMs: src.animDelayMs,
        animEase: src.animEase as CanvasElement['animEase'],
      };
    });
    setElements(mapped);
    setSelectedElementId(mapped[0]?.id || null);
    setSavedToMediaLibrary(false);
    const dur = defaultTimelineMs(mapped);
    setTimelineDurationMs(dur);
    setPlayheadMs(dur);
    timelineTimeRef.current = dur;
    pushHistorySnapshot(mapped);
    void preloadLayerImages(mapped).then(() => setElements((prev) => [...prev]));
    setActiveTab('layers');
    if (!opts?.silent) {
      toast(
        isAr
          ? `تم استيراد المشروع · ${mapped.length} طبقة`
          : `Project imported · ${mapped.length} layer(s)`,
        'success',
      );
    }
  };
  applyProjectJsonRef.current = applyProjectJson;

  const flushCanvaDraftRef = useRef<() => ReturnType<typeof saveCanvaStudioDraft>>(() => null);
  flushCanvaDraftRef.current = () => {
    if (!activeStore?.id || skipAutosaveRef.current) return null;
    const storeId = activeStore.id;
    const scope = canvaDraftScope({
      masterMode,
      editorKind: editorKind || null,
      assetId: initialAsset?.id || null,
    });
    const flushed = flushPagesFromEditor();
    const project = buildDraftProject({
      title: docTitle || 'Untitled Design',
      width: canvasW,
      height: canvasH,
      category: uploadCategory,
      backdrop: selectedBackdrop,
      customSolidColor,
      gradient: {
        type: gradientType,
        angle: gradientAngle,
        c1: gradientColor1,
        c2: gradientColor2,
        c3: gradientColor3,
      },
      product: { x: productPosX, y: productPosY, scale: productScale, flipH, flipV },
      filters: { brightness, contrast, saturation, blur: blurAmount },
      layers: layersToProjectPayload(),
      pages: pagesToProjectJson(flushed),
      activePageId,
    });
    return saveCanvaStudioDraft({
      storeId,
      scope,
      selectedTemplateId,
      project,
    });
  };

  // Debounced local autosave — store_id + editor scope (survives soft-refresh / tab remount)
  useEffect(() => {
    if (!isOpen || !activeStore?.id || skipAutosaveRef.current) return;
    setAutoSaveState('saving');
    const timer = window.setTimeout(() => {
      const saved = flushCanvaDraftRef.current();
      if (saved) {
        setAutoSaveState('saved');
        setAutoSaveAt(saved.updatedAt);
      } else {
        setAutoSaveState('idle');
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [
    isOpen,
    activeStore?.id,
    masterMode,
    editorKind,
    initialAsset?.id,
    elements,
    docTitle,
    canvasW,
    canvasH,
    uploadCategory,
    selectedBackdrop,
    customSolidColor,
    gradientType,
    gradientAngle,
    gradientColor1,
    gradientColor2,
    gradientColor3,
    productPosX,
    productPosY,
    productScale,
    flipH,
    flipV,
    brightness,
    contrast,
    saturation,
    blurAmount,
    selectedTemplateId,
    studioPages,
    activePageId,
  ]);

  // Persist before tab hide / page unload / unmount (stable listeners via ref)
  useEffect(() => {
    if (!isOpen) return;
    const onHide = () => {
      flushCanvaDraftRef.current();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      flushCanvaDraftRef.current();
    };
  }, [isOpen, activeStore?.id]);

  const handleImportProjectJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const project = parseCanvaDesignProject(text);
      applyProjectJson(project);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      toast(
        code === 'PROJECT_JSON_INVALID' || code === 'PROJECT_JSON_UNSUPPORTED'
          ? isAr
            ? 'ملف المشروع غير صالح.'
            : 'Invalid project file.'
          : isAr
            ? 'تعذر استيراد المشروع.'
            : 'Could not import project.',
        'error',
      );
    }
  };

  // Export Canvas as High-Res Data URL
  const exportCanvasDataUrl = (format: 'image/png' | 'image/webp' | 'image/jpeg' = 'image/webp') => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    // JPG has no alpha — flatten transparent designs onto pure white
    if (format === 'image/jpeg' && selectedBackdrop === 'transparent') {
      const flat = document.createElement('canvas');
      flat.width = canvas.width;
      flat.height = canvas.height;
      const fctx = flat.getContext('2d');
      if (!fctx) return canvas.toDataURL(format, 0.95);
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, flat.width, flat.height);
      fctx.drawImage(canvas, 0, 0);
      return flat.toDataURL(format, 0.95);
    }
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
    setShowExportMenu(false);
    toast(isAr ? 'تم تنزيل التصميم بجودة عالية!' : 'Design downloaded in high quality!', 'success');
  };

  const renderMotionFrameTo = async (timeMs: number, target: HTMLCanvasElement) => {
    const prev = timelineTimeRef.current;
    timelineTimeRef.current = timeMs;
    renderCanvas();
    const src = canvasRef.current;
    const tctx = target.getContext('2d');
    if (src && tctx) {
      tctx.clearRect(0, 0, target.width, target.height);
      tctx.drawImage(src, 0, 0, target.width, target.height);
    }
    timelineTimeRef.current = prev;
  };

  const handleExportGif = async () => {
    setShowExportMenu(false);
    setIsExportingMotion(true);
    try {
      const slug = (docTitle || 'studio-design').toLowerCase().replace(/\s+/g, '-').slice(0, 48);
      await exportAnimatedGif({
        width: canvasW,
        height: canvasH,
        timelineMs: timelineDurationMs,
        fps: 10,
        filename: `${slug}.gif`,
        renderFrame: renderMotionFrameTo,
      });
      toast(isAr ? 'تم تصدير ملف متحرك.' : 'Animated GIF exported.', 'success');
    } catch {
      toast(isAr ? 'تعذر تصدير الملف المتحرك.' : 'Could not export GIF.', 'error');
    } finally {
      timelineTimeRef.current = playheadMs;
      renderCanvas();
      setIsExportingMotion(false);
    }
  };

  const handleExportMp4 = async () => {
    setShowExportMenu(false);
    setIsExportingMotion(true);
    try {
      const slug = (docTitle || 'studio-design').toLowerCase().replace(/\s+/g, '-').slice(0, 48);
      const res = await exportMotionVideo({
        width: canvasW,
        height: canvasH,
        timelineMs: timelineDurationMs,
        fps: 15,
        filename: slug,
        preferMp4: true,
        renderFrame: renderMotionFrameTo,
      });
      toast(
        isAr
          ? `تم تصدير الفيديو (${res.ext}).`
          : `Video exported (.${res.ext}).`,
        'success',
      );
    } catch {
      toast(
        isAr
          ? 'تعذر تصدير الفيديو في هذا المتصفح.'
          : 'Could not export video in this browser.',
        'error',
      );
    } finally {
      timelineTimeRef.current = playheadMs;
      renderCanvas();
      setIsExportingMotion(false);
    }
  };

  // Handle Open Social Media Modal
  const handleOpenSocialModal = () => {
    const dataUrl = exportCanvasDataUrl('image/webp');
    if (!dataUrl) return;
    setSocialExportDataUrl(dataUrl);
    setSocialModalOpen(true);
  };

  const buildSavePayload = (dataUrl: string): CanvaSavePayload => {
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
    return {
      id: savedDesignId || lastImported?.id || (homeLaunch?.myTemplate?.id ?? undefined),
      dataUrl,
      title: docTitle || (isAr ? 'تصميم' : 'Design'),
      width: canvasW,
      height: canvasH,
      category: uploadCategory,
      layers,
      source: lastImported?.source || 'studio',
      designJson: {
        elements,
        productPos: { x: productPosX, y: productPosY, scale: productScale },
        backdrop: selectedBackdrop,
        customSolidColor,
        gradient: {
          type: gradientType,
          angle: gradientAngle,
          c1: gradientColor1,
          c2: gradientColor2,
          c3: gradientColor3,
        },
        filters: { brightness, contrast, saturation, blur: blurAmount },
        flipH,
        flipV,
        pages: pagesToProjectJson(flushPagesFromEditor()),
        activePageId,
      },
    };
  };

  // Save: Master → destinations picker (All / Multiple / Local PC). Store → own store_id (+ optional local).
  const handleSaveToMedia = (opts?: { alsoLocal?: boolean }) => {
    setShowSaveMenu(false);
    const dataUrl = exportCanvasDataUrl('image/png');
    if (!dataUrl) return;
    const run = async () => {
      const thumb = (await optimizeHomeThumb(dataUrl)) || (await downscaleDataUrlToPng(dataUrl));
      const fullPayload: CanvaSavePayload = {
        ...buildSavePayload(dataUrl),
        previewDataUrl: thumb,
      };
      if (opts?.alsoLocal) {
        handleDownload('png');
      }
      if (onSaveDesignPayload) {
        await Promise.resolve(onSaveDesignPayload(fullPayload));
        setSavedToMediaLibrary(true);
        await refreshMyTemplates();
        if (!masterMode) {
          toast(
            isAr ? 'تم الحفظ — معاينة PNG في آخر المحفوظات.' : 'Saved — PNG preview in last saved.',
            'success',
          );
        }
        return;
      }
      onSaveNewAsset(dataUrl, docTitle, canvasW, canvasH);
      setSavedToMediaLibrary(true);
      toast(isAr ? 'تم حفظ التصميم في مكتبة وسائط المتجر!' : 'Saved to Store Media Library!', 'success');
    };
    void run();
  };

  const handleSaveLocalPcOnly = () => {
    setShowSaveMenu(false);
    handleDownload('png');
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

  /** Canva-like: Create (+) first, Templates (القوالب) second */
  const studioTabs = [
    { id: 'create' as const, label: isAr ? 'إنشاء' : 'Create', icon: Plus, create: true },
    { id: 'templates' as const, label: isAr ? 'القوالب' : 'Templates', icon: FolderKanban },
    { id: 'elements' as const, label: isAr ? 'العناصر' : 'Elements', icon: Compass },
    { id: 'text' as const, label: isAr ? 'النص' : 'Text', icon: Type },
    { id: 'layers' as const, label: isAr ? 'الطبقات' : 'Layers', icon: Layers },
    { id: 'timeline' as const, label: isAr ? 'الخط الزمني' : 'Timeline', icon: Film },
    { id: 'store_assets' as const, label: isAr ? 'المتجر' : 'Store', icon: Package },
    { id: 'colors' as const, label: isAr ? 'الخلفية' : 'Background', icon: Palette },
    { id: 'media' as const, label: isAr ? 'الرفع' : 'Uploads', icon: Upload },
    { id: 'filters' as const, label: isAr ? 'الضبط' : 'Adjust', icon: Sliders },
    { id: 'settings' as const, label: isAr ? 'الإعدادات' : 'Settings', icon: Settings },
  ];

  const openCreatePanel = () => {
    setActiveTab('create');
    setFlyoutOpen(true);
    setShowAddLayerMenu(true);
    setLayersSubTab('layers');
  };

  const layerLabel = (el: CanvasElement) => {
    if (el.type === 'image') return el.text || (isAr ? 'صورة' : 'Image');
    if (el.type === 'shape') return isAr ? `شكل ·${el.shapeType || ''}` : `Shape · ${el.shapeType || ''}`;
    if (el.type === 'icon') return isAr ? 'أيقونة' : 'Icon';
    if (el.type === 'sticker') return `${el.text || '✨'} ${isAr ? 'ملصق' : 'Sticker'}`.trim();
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
        className={`canva-studio-light w-full overflow-x-hidden overflow-y-visible flex flex-col select-none isolate ${
          isPage
            ? 'h-full min-h-0 rounded-none border-0'
            : 'max-w-7xl h-[95vh] rounded-xl border'
        }`}
      >
        {/* Always-mounted file pickers (top bar + Uploads tab share these) */}
        <input
          ref={designFileInputRef}
          type="file"
          accept=".pptx,.ppt,.psd,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,image/vnd.adobe.photoshop,image/png,image/jpeg,image/webp,image/*"
          className="hidden"
          onChange={handleImportDesignFile}
        />
        <input
          ref={projectJsonInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void handleImportProjectJson(e)}
        />

        {/* ── TOP CANVA NAVBAR ── */}
        <div className="cs-header cs-glass px-3 sm:px-4 py-2 sm:py-2.5 border-b shrink-0">
          {/* Left: Studio Brand & Editable Title */}
          <div className="cs-header-left flex items-center gap-2 sm:gap-3 min-w-0">
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
                className="cs-header-chip px-2.5 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
              >
                <span>{canvasW}×{canvasH}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {showResizeMenu && (
                <div className="cs-dropdown absolute start-0 top-full mt-1.5 w-64 p-2 space-y-1">
                  <div className="cs-dropdown-muted text-[10px] font-black uppercase px-2 py-1">
                    {isAr ? 'تغيير أبعاد التصميم' : 'Design size'}
                  </div>
                  {[
                    { label: isAr ? 'مربع (١:١)' : 'Square (1:1)', w: 1080, h: 1080 },
                    { label: isAr ? 'ستوري (٩:١٦)' : 'Story (9:16)', w: 1080, h: 1920 },
                    { label: isAr ? 'عمودي (٤:٥)' : 'Portrait (4:5)', w: 1080, h: 1350 },
                    { label: isAr ? 'بنر المتجر' : 'Store banner', w: 1600, h: 600 },
                    { label: isAr ? 'إعلان ميتا / جوجل' : 'Meta / Google ads', w: 1200, h: 628 },
                    { label: isAr ? 'شعار' : 'Logo', w: 800, h: 800 },
                    { label: isAr ? 'غلاف تصنيف' : 'Category cover', w: 1200, h: 800 },
                    { label: isAr ? 'أفقي (١٦:٩)' : 'Landscape (16:9)', w: 1920, h: 1080 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setCanvasW(preset.w);
                        setCanvasH(preset.h);
                        setViewZoom(DEFAULT_VIEW_ZOOM);
                        setShowResizeMenu(false);
                        toast(
                          isAr
                            ? `تم تغيير المقاس إلى ${preset.w}×${preset.h}`
                            : `Resized to ${preset.w}×${preset.h}`,
                          'info',
                        );
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-start text-xs font-bold flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{preset.label}</span>
                      <span className="cs-dropdown-muted text-[10px] font-mono">{preset.w}×{preset.h}</span>
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
                className="cs-header-chip cs-header-title-input px-2.5 py-1.5 rounded-lg text-[13px] font-bold cs-accent-border"
                style={{ borderColor: 'var(--accent, #1d8b94)' }}
              />
            ) : (
              <span
                onClick={() => setIsEditingTitle(true)}
                title={isAr ? 'انقر لتعديل اسم التصميم' : 'Click to edit title'}
                className="cs-header-title text-[13px] cursor-pointer px-2 py-1 rounded-md truncate"
              >
                {docTitle} ✎
              </span>
            )}

            {/* Autosave + media save status */}
            <span
              className={`cs-header-status hidden sm:flex items-center gap-1 text-[12px] ${
                savedToMediaLibrary || autoSaveState === 'saved' || autoSaveState === 'restored'
                  ? 'is-ok'
                  : ''
              }`}
              title={
                autoSaveAt
                  ? isAr
                    ? `آخر حفظ تلقائي: ${new Date(autoSaveAt).toLocaleString('ar-SA')}`
                    : `Last auto-save: ${new Date(autoSaveAt).toLocaleString()}`
                  : undefined
              }
            >
              {savedToMediaLibrary ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAr ? 'محفوظ في مكتبة الوسائط' : 'Saved to media library'}</span>
                </>
              ) : autoSaveState === 'saving' ? (
                <span>{isAr ? 'جاري الحفظ التلقائي…' : 'Auto-saving…'}</span>
              ) : autoSaveState === 'restored' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تمت استعادة المسودة' : 'Draft restored'}</span>
                </>
              ) : autoSaveState === 'saved' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حفظ تلقائي' : 'Auto-saved'}</span>
                </>
              ) : (
                <span>{isAr ? 'مسودة — حفظ تلقائي مفعّل' : 'Draft — autosave on'}</span>
              )}
            </span>
          </div>

          {/* Center: Undo / Redo / Copy / Paste (live) */}
          <div className="cs-header-center cs-header-chip flex items-center gap-0.5 p-0.5 rounded-lg shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-md disabled:opacity-35 cursor-pointer hover:opacity-100"
              title={isAr ? 'تراجع' : 'Undo (Ctrl+Z)'}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-md disabled:opacity-35 cursor-pointer"
              title={isAr ? 'إعادة' : 'Redo (Ctrl+Y)'}
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <span className="w-px h-4 mx-0.5 opacity-30 bg-current" aria-hidden />
            <button
              type="button"
              onClick={handleCopySelected}
              disabled={!selectedElementId && selectedElementIds.length === 0}
              className="p-1.5 rounded-md disabled:opacity-35 cursor-pointer"
              title={isAr ? 'نسخ الطبقة' : 'Copy layer (Ctrl+C)'}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => void handlePasteLive()}
              className="p-1.5 rounded-md cursor-pointer"
              title={
                isAr
                  ? 'لصق — طبقات أو نص أو صورة من كانفا (Ctrl+V)'
                  : 'Paste — layers, text, or image from Canva (Ctrl+V)'
              }
            >
              <ClipboardPaste className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Actions & Share/Post Button */}
          <div className="cs-header-right flex items-center gap-1.5 sm:gap-2 min-w-0 justify-end">
            <button
              type="button"
              disabled={isImportingDesign}
              onClick={() => designFileInputRef.current?.click()}
              className="cs-header-chip px-2.5 sm:px-3 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5 shrink-0"
              title={
                isAr
                  ? 'رفع من كانفا: تنزيل PPTX ثم ارفعه هنا — طبقات قابلة للنسخ واللصق'
                  : 'Import from Canva: Download PPTX, then upload — editable layers + copy/paste'
              }
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {isImportingDesign
                  ? isAr
                    ? 'جاري الرفع…'
                    : 'Importing…'
                  : isAr
                    ? 'رفع قالب'
                    : 'Upload'}
              </span>
            </button>

            {/* Export dropdown: PNG / JPG / WebP / Project JSON */}
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowExportMenu((v) => !v)}
                className="cs-header-chip px-3 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isAr ? 'تصدير' : 'Export'}</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>
              {showExportMenu && (
                <div
                  className="cs-dropdown absolute end-0 top-full mt-1.5 w-52 p-1.5 space-y-0.5"
                  role="menu"
                >
                  {(
                    [
                      ['png', isAr ? 'صورة عالية الجودة' : 'PNG image'],
                      ['jpg', isAr ? 'صورة مضغوطة' : 'JPG image'],
                      ['webp', isAr ? 'ويب للجودة/الحجم' : 'WebP image'],
                    ] as const
                  ).map(([fmt, label]) => (
                    <button
                      key={fmt}
                      type="button"
                      role="menuitem"
                      onClick={() => handleDownload(fmt)}
                      className="w-full px-2.5 py-2 rounded-lg text-start text-xs font-bold cursor-pointer flex items-center justify-between"
                    >
                      <span>{label}</span>
                      <span className="cs-dropdown-muted text-[10px] font-mono uppercase">{fmt}</span>
                    </button>
                  ))}
                  <div className="border-t border-slate-200/80 my-1" />
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isExportingMotion}
                    onClick={() => void handleExportGif()}
                    className="w-full px-2.5 py-2 rounded-lg text-start text-xs font-bold cursor-pointer flex items-center justify-between disabled:opacity-50"
                  >
                    <span>{isAr ? 'ملف متحرك' : 'Animated GIF'}</span>
                    <span className="cs-dropdown-muted text-[10px] font-mono">GIF</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isExportingMotion}
                    onClick={() => void handleExportMp4()}
                    className="w-full px-2.5 py-2 rounded-lg text-start text-xs font-bold cursor-pointer flex items-center justify-between disabled:opacity-50"
                  >
                    <span>{isAr ? 'فيديو متحرك' : 'Motion video'}</span>
                    <span className="cs-dropdown-muted text-[10px] font-mono">MP4</span>
                  </button>
                  <div className="border-t border-slate-200/80 my-1" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleExportProjectJson}
                    className="w-full px-2.5 py-2 rounded-lg text-start text-xs font-bold cursor-pointer flex items-center gap-2"
                  >
                    <FileJson className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                    {isAr ? 'ملف المشروع (طبقات)' : 'Project JSON (layers)'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleExportPagesZip()}
                    className="w-full px-2.5 py-2 rounded-lg text-start text-xs font-bold cursor-pointer flex items-center gap-2"
                  >
                    <Archive className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                    {isAr ? 'حزمة صفحات (مضغوط)' : 'Pages pack (ZIP)'}
                  </button>
                  <div className="border-t border-slate-200/80 my-1" />
                  <p className="px-2.5 pt-1 pb-0.5 text-[9px] font-black uppercase tracking-wide cs-dropdown-muted">
                    {isAr ? 'تغيير المقاس (نسبي)' : 'Resize (proportional)'}
                  </p>
                  {MAGIC_RESIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      role="menuitem"
                      onClick={() =>
                        handleMagicResize(
                          preset.width,
                          preset.height,
                          isAr ? preset.labelAr : preset.labelEn,
                        )
                      }
                      className="w-full px-2.5 py-2 rounded-lg text-start text-xs font-bold cursor-pointer flex items-center justify-between"
                    >
                      <span>{isAr ? preset.labelAr : preset.labelEn}</span>
                      <span className="cs-dropdown-muted text-[10px] font-mono">
                        {preset.width}×{preset.height}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    setShowSaveMenu((v) => !v);
                  }}
                  className="cs-header-chip px-3 py-1.5 rounded-lg text-[13px] flex items-center gap-1.5 cs-active-soft"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    {masterMode
                      ? isAr
                        ? 'حفظ · وجهات'
                        : 'Save · destinations'
                      : isAr
                        ? 'حفظ'
                        : 'Save'}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-80" />
                </button>
                {showSaveMenu && (
                  <div
                    className="cs-dropdown absolute end-0 top-full mt-1.5 w-64 p-1.5 space-y-0.5 z-50"
                    role="menu"
                  >
                    {masterMode ? (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleSaveToMedia()}
                          className="w-full px-2.5 py-2 rounded-lg text-start text-[13px] font-bold cursor-pointer flex items-center gap-2"
                        >
                          <Images className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                          <span className="flex-1">
                            {isAr
                              ? 'ماستر + كل / عدة متاجر'
                              : 'Master + All / Multiple stores'}
                          </span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleSaveLocalPcOnly}
                          className="w-full px-2.5 py-2 rounded-lg text-start text-[13px] font-bold cursor-pointer flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                          {isAr ? 'تصدير PNG للجهاز' : 'Export PNG to PC'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleSaveToMedia()}
                          className="w-full px-2.5 py-2 rounded-lg text-start text-[13px] font-bold cursor-pointer flex items-center gap-2"
                        >
                          <Package className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                          {isAr ? 'حفظ في متجري فقط' : 'Save to my store only'}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleSaveLocalPcOnly}
                          className="w-full px-2.5 py-2 rounded-lg text-start text-[13px] font-bold cursor-pointer flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                          {isAr ? 'تصدير PNG للجهاز' : 'Export PNG to PC'}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleSaveToMedia({ alsoLocal: true })}
                          className="w-full px-2.5 py-2 rounded-lg text-start text-[13px] font-bold cursor-pointer flex items-center gap-2"
                        >
                          <Save className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                          {isAr ? 'متجري + تصدير محلي' : 'My store + export to PC'}
                        </button>
                      </>
                    )}
                    <div className="border-t border-slate-200/80 my-1" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowSaveMenu(false);
                        designFileInputRef.current?.click();
                      }}
                      className="w-full px-2.5 py-2 rounded-lg text-start text-[13px] font-bold cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                      {isAr ? 'استيراد PPTX / PSD / صورة' : 'Import PPTX / PSD / image'}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowSaveMenu(false);
                        handleDownload('jpg');
                      }}
                      className="w-full px-2.5 py-2 rounded-lg text-start text-[13px] font-bold cursor-pointer flex items-center justify-between"
                    >
                      <span>{isAr ? 'تصدير JPG' : 'Export JPG'}</span>
                      <span className="cs-dropdown-muted text-[10px] font-mono">JPG</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowSaveMenu(false);
                        handleDownload('webp');
                      }}
                      className="w-full px-2.5 py-2 rounded-lg text-start text-[13px] font-bold cursor-pointer flex items-center justify-between"
                    >
                      <span>{isAr ? 'تصدير WebP' : 'Export WebP'}</span>
                      <span className="cs-dropdown-muted text-[10px] font-mono">WebP</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowSaveMenu(false);
                        handleExportProjectJson();
                      }}
                      className="w-full px-2.5 py-2 rounded-lg text-start text-[13px] font-bold cursor-pointer flex items-center gap-2"
                    >
                      <FileJson className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                      {isAr ? 'تصدير ملف المشروع' : 'Export project JSON'}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowSaveMenu(false);
                        projectJsonInputRef.current?.click();
                      }}
                      className="w-full px-2.5 py-2 rounded-lg text-start text-[13px] font-bold cursor-pointer flex items-center gap-2"
                    >
                      <FileUp className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                      {isAr ? 'استيراد ملف المشروع' : 'Import project JSON'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenSocialModal}
              className="cs-header-share px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[13px] font-black text-white flex items-center gap-1.5 cursor-pointer cs-btn-primary shrink-0"
              style={{ background: 'var(--accent, #1d8b94)' }}
              title={isAr ? 'نشر في وسائل التواصل' : 'Post to Social Media'}
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span className="cs-header-share-label">
                {isAr ? 'نشر في وسائل التواصل' : 'Post to Social Media'}
              </span>
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
          <div className="cs-dock cs-glass w-16 border-e flex flex-col items-center py-2 gap-1 shrink-0 z-30">
            {studioTabs.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              const isCreate = Boolean((tab as { create?: boolean }).create);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (isCreate) openCreatePanel();
                    else setActiveTab(tab.id);
                  }}
                  className={`w-14 py-2.5 px-1 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center ${
                    isCreate ? 'cs-dock-create' : ''
                  } ${active ? 'cs-dock-active' : ''}`}
                >
                  {isCreate ? (
                    <span className="cs-dock-create-orb flex items-center justify-center w-8 h-8 rounded-full">
                      <Plus className="w-4 h-4 text-white" strokeWidth={2.75} />
                    </span>
                  ) : (
                    <Icon className="w-5 h-5 shrink-0" />
                  )}
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
            className={`cs-flyout cs-flyout-drawer cs-glass lg:static w-80 border-e flex-col shrink-0 overflow-y-auto p-4 space-y-4 ${
              flyoutOpen ? 'flex' : 'hidden'
            } lg:flex`}
            data-open={flyoutOpen ? 'true' : 'false'}
          >
            {/* 0+1. CREATE / TEMPLATES — create tools + all templates (no extra Browse click) */}
            {(activeTab === 'create' || activeTab === 'templates') && (
              <div className="cs-create-panel space-y-4">
                {activeTab === 'create' && (
                  <>
                    <div>
                      <h3 className="text-sm font-black" style={{ color: 'var(--cs-text)' }}>
                        {isAr ? 'إنشاء تصميم' : 'Create design'}
                      </h3>
                      <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--cs-muted)' }}>
                        {isAr
                          ? 'أضف طبقات أو اختر قالباً جاهزاً من الأسفل مباشرة.'
                          : 'Add layers or pick a ready template below — no extra browse step.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleAddTextElement(
                            'headline',
                            isAr ? 'عنوان عريض وجذاب' : 'Add a heading',
                          );
                          openPositionPanel('layers');
                        }}
                        className="cs-create-tile flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer"
                      >
                        <Type className="w-5 h-5" style={{ color: 'var(--cs-accent,#1d8b94)' }} />
                        <span className="text-[11px] font-black">{isAr ? 'نص' : 'Text'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleAddShape('rectangle');
                          openPositionPanel('layers');
                        }}
                        className="cs-create-tile flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer"
                      >
                        <Square className="w-5 h-5" style={{ color: 'var(--cs-accent,#1d8b94)' }} />
                        <span className="text-[11px] font-black">{isAr ? 'شكل' : 'Shape'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('media');
                          designFileInputRef.current?.click();
                        }}
                        className="cs-create-tile flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer"
                      >
                        <ImageIcon className="w-5 h-5" style={{ color: 'var(--cs-accent,#1d8b94)' }} />
                        <span className="text-[11px] font-black">{isAr ? 'صورة' : 'Image'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const blank = getDefaultBlankTemplate('square');
                          applyCanvaTemplate(blank);
                          openPositionPanel('layers');
                        }}
                        className="cs-create-tile flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer"
                      >
                        <FilePlus2 className="w-5 h-5" style={{ color: 'var(--cs-accent,#1d8b94)' }} />
                        <span className="text-[11px] font-black">{isAr ? 'لوحة فارغة' : 'Blank'}</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => openPositionPanel('layers')}
                      className="cs-btn-primary w-full py-2.5 rounded-xl text-[12px] font-black text-white flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Layers className="w-4 h-4" />
                      {isAr ? 'فتح الطبقات' : 'Open layers'}
                    </button>
                    <div className="pt-1 border-t border-slate-200/80">
                      <h4 className="text-[11px] font-black mb-2" style={{ color: 'var(--cs-text)' }}>
                        {isAr ? 'كل القوالب' : 'All templates'}
                      </h4>
                    </div>
                  </>
                )}
                {activeTab === 'templates' && (
                  <div>
                    <h3 className="text-sm font-black" style={{ color: 'var(--cs-text)' }}>
                      {isAr ? 'القوالب' : 'Templates'}
                    </h3>
                    <p className="text-[11px] mt-1 mb-2 leading-relaxed" style={{ color: 'var(--cs-muted)' }}>
                      {isAr
                        ? 'كل القوالب الجاهزة لهذا المتجر — الماستر والمرفوعة والمعدة مسبقاً.'
                        : 'All ready designs for this store — Master, uploads, and premades.'}
                    </p>
                  </div>
                )}
                <div className="cs-templates-panel">
                  <CanvaTemplatesPanel
                    store={activeStore}
                    isAr={isAr}
                    selectedTemplateId={selectedTemplateId}
                    defaultNiche="library"
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
                    onApplyMyTemplate={async (tpl) => {
                      let ready = tpl;
                      if (!tpl.layers?.length && activeStore?.id) {
                        try {
                          const { getMyCanvaTemplate } = await import('../../services/canvaMyTemplates');
                          const local = await getMyCanvaTemplate(activeStore.id, tpl.id);
                          if (local?.layers?.length) {
                            ready = local;
                          } else {
                            const { ensurePptxTemplateLayers } = await import('../../services/canvaPptxPackHydrate');
                            ready = await ensurePptxTemplateLayers(activeStore.id, tpl);
                          }
                        } catch {
                          /* keep stub */
                        }
                      }
                      const payload = myTemplateToDesignPayload(ready);
                      applyImportedDesign(
                        {
                          width: payload.width,
                          height: payload.height,
                          name: isAr ? ready.nameAr || ready.nameEn : ready.nameEn,
                          source:
                            ready.source === 'psd'
                              ? 'psd'
                              : ready.source === 'pptx'
                                ? 'pptx'
                                : 'image',
                          layers: payload.layers,
                          previewDataUrl: payload.previewDataUrl,
                          categoryHint: ready.category,
                        },
                        { templateId: ready.id, keepCategory: true },
                      );
                      setUploadCategory(ready.category);
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
                      setViewZoom(DEFAULT_VIEW_ZOOM);
                      toast(isAr ? `المقاس: ${label}` : `Design size: ${label}`, 'info');
                    }}
                  />
                </div>
              </div>
            )}

            {/* 2. ELEMENTS TAB — Canva-like shapes / icons / emoji / badges */}
            {activeTab === 'elements' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="cs-section-label">
                    {isAr ? 'الأشكال' : 'Shapes'}
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        ['circle', Circle, isAr ? 'دائرة' : 'Circle'],
                        ['rectangle', Square, isAr ? 'مستطيل' : 'Rect'],
                        ['triangle', Triangle, isAr ? 'مثلث' : 'Triangle'],
                        ['star', Star, isAr ? 'نجمة' : 'Star'],
                        ['line', Minus, isAr ? 'خط' : 'Line'],
                        ['arrow', ArrowRight, isAr ? 'سهم' : 'Arrow'],
                        ['wave_curve', Compass, isAr ? 'منحنى' : 'Wave'],
                        ['dot_grid', Sparkles, isAr ? 'نقاط' : 'Dots'],
                        ['badge', Award, isAr ? 'شارة' : 'Badge'],
                      ] as const
                    ).map(([shape, Icon, label]) => (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => handleAddShape(shape)}
                        className="cs-element-tile flex flex-col items-center gap-1 p-2.5 cursor-pointer"
                      >
                        <Icon className="w-5 h-5 cs-accent-text" />
                        <span className="text-[9px] font-bold text-slate-700">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <span className="cs-section-label">
                    {isAr ? 'الرموز التعبيرية' : 'Emojis'}
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value.slice(0, 8))}
                      placeholder={isAr ? 'رمز مخصص…' : 'Custom emoji…'}
                      className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const e = customEmoji.trim();
                        if (!e) return;
                        handleAddEmojiSticker(e);
                        setCustomEmoji('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-black text-white cursor-pointer shrink-0"
                      style={{ background: 'var(--accent, #1d8b94)' }}
                    >
                      {isAr ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                  <div className="cs-emoji-grid grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pe-0.5">
                    {EMOJI_STICKERS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleAddEmojiSticker(emoji)}
                        className="cs-element-tile aspect-square flex items-center justify-center text-xl cursor-pointer"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <span className="cs-section-label">
                    {isAr ? 'أيقونات (مثل فونت أوسم)' : 'Icons (Font Awesome style)'}
                  </span>
                  <input
                    type="text"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder={isAr ? 'بحث أيقونة…' : 'Search icons…'}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                  />
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pe-0.5">
                    {QUICK_ICONS.filter((ic) => {
                      if (!iconSearch.trim()) return true;
                      const q = iconSearch.toLowerCase();
                      return (
                        ic.id.includes(q) ||
                        ic.labelEn.toLowerCase().includes(q) ||
                        ic.labelAr.includes(iconSearch) ||
                        (ic.fa || '').includes(q)
                      );
                    }).map((ic) => (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => handleAddIcon(ic.id)}
                        className="cs-element-tile flex flex-col items-center gap-1 p-2 cursor-pointer"
                        title={ic.fa || ic.id}
                      >
                        <span className="text-lg leading-none">{ic.glyph}</span>
                        <span className="text-[8.5px] text-slate-600 truncate max-w-full">
                          {isAr ? ic.labelAr : ic.labelEn}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => customIconInputRef.current?.click()}
                    className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-[10px] font-black text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isAr ? 'رفع أيقونة مخصصة (بي إن جي)' : 'Upload custom icon (PNG)'}
                  </button>
                  <input
                    ref={customIconInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleUploadLocalFile}
                  />
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <span className="cs-section-label">
                    {isAr ? 'شارات وعروض' : 'Sale badges'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <input
                      type="text"
                      value={customBadgeText}
                      onChange={(e) => setCustomBadgeText(e.target.value.slice(0, 40))}
                      placeholder={isAr ? 'نص الشارة المخصص…' : 'Custom badge text…'}
                      className="flex-1 min-w-[8rem] px-2 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                    />
                    <input
                      type="color"
                      value={customBadgeColor}
                      onChange={(e) => setCustomBadgeColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                      title={isAr ? 'لون الشارة' : 'Badge color'}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const t = customBadgeText.trim();
                        if (!t) {
                          toast(
                            isAr ? 'اكتب نص الشارة أولاً.' : 'Enter badge text first.',
                            'error',
                          );
                          return;
                        }
                        handleAddBadgeElement(t, customBadgeColor, 'pill');
                        setCustomBadgeText('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-black text-white cursor-pointer"
                      style={{ background: 'var(--accent, #1d8b94)' }}
                    >
                      {isAr ? 'إنشاء' : 'Create'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_BADGES.map((b, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          handleAddBadgeElement(isAr ? b.textAr : b.textEn, b.color, b.style)
                        }
                        className="p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-transform hover:scale-[1.02]"
                        style={{
                          borderColor: b.color,
                          background: `${b.color}18`,
                          color: b.color,
                        }}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{isAr ? b.textAr : b.textEn}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <span className="cs-section-label">
                    {isAr ? 'رفع أو رابط صورة أونلاين' : 'Upload or online image URL'}
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={onlineImageUrl}
                      onChange={(e) => setOnlineImageUrl(e.target.value)}
                      placeholder="https://…"
                      className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = onlineImageUrl.trim();
                        if (!url || !/^https?:\/\//i.test(url)) {
                          toast(
                            isAr ? 'أدخل رابط صورة صالح.' : 'Enter a valid image URL.',
                            'error',
                          );
                          return;
                        }
                        insertImageDataUrlAsLayer(url, isAr ? 'صورة أونلاين' : 'Online image', {
                          trackSession: true,
                        });
                        setOnlineImageUrl('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-black text-white cursor-pointer shrink-0"
                      style={{ background: 'var(--accent, #1d8b94)' }}
                    >
                      {isAr ? 'إدراج' : 'Insert'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-[10px] font-black text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isAr ? 'رفع من الجهاز (بي إن جي / جيه بي جيه)' : 'Upload from device (PNG / JPG)'}
                  </button>
                </div>
              </div>
            )}

            {/* 3. TEXT TAB */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="cs-section-label">
                    {isAr ? 'الخطوط' : 'Fonts'}
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {isAr
                      ? 'اختر الخط للنصوص الجديدة، أو حدّد طبقة نص لتغيير خطها.'
                      : 'Pick a font for new text, or select a text layer to change its font.'}
                  </p>
                  <StoreFontSelect
                    isAr={isAr}
                    value={
                      selectedElement &&
                      selectedElement.type !== 'shape' &&
                      selectedElement.type !== 'image' &&
                      selectedElement.type !== 'sticker' &&
                      selectedElement.type !== 'icon'
                        ? selectedElement.fontFamily || studioDefaultFont
                        : studioDefaultFont
                    }
                    searchable
                    onChange={(fontFamily) => {
                      ensureStoreGoogleFontLoaded(fontFamily);
                      setStudioDefaultFont(fontFamily);
                      if (
                        selectedElement &&
                        selectedElement.type !== 'shape' &&
                        selectedElement.type !== 'image' &&
                        selectedElement.type !== 'sticker' &&
                        selectedElement.type !== 'icon'
                      ) {
                        updateSelectedElement({ fontFamily });
                      }
                    }}
                  />
                </div>
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
                    <Plus className="w-4 h-4 text-[var(--cs-accent,#1d8b94)]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTextElement('subtitle', isAr ? 'وصف فرعي للمنتج والخدمة' : 'Add a subheading')}
                    className="w-full py-2.5 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-800 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? 'إضافة نص فرعي' : 'Add a subheading'}</span>
                    <Plus className="w-4 h-4 text-[var(--cs-accent,#1d8b94)]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTextElement('custom_text', isAr ? 'نص توضيحي ومعلومات إضافية' : 'Add a little bit of body text')}
                    className="w-full py-2 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? 'إضافة نص توضيحي' : 'Add body text'}</span>
                    <Plus className="w-4 h-4 text-[var(--cs-accent,#1d8b94)]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTextElement('custom_text', isAr ? '• ميزة أولى\n• ميزة ثانية\n• ميزة ثالثة' : '• First feature\n• Second feature\n• Third feature')}
                    className="w-full py-2 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? '• قائمة نقاط مميزات' : '• Bullet point list'}</span>
                    <Plus className="w-4 h-4 text-[var(--cs-accent,#1d8b94)]" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAddBadgeElement(isAr ? 'تواصل معنا' : "Let's Talk", '#1d8b94', 'pill')
                    }
                    className="w-full py-2 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 text-start flex items-center justify-between cursor-pointer"
                  >
                    <span>{isAr ? 'زر إجراء' : 'CTA button'}</span>
                    <Plus className="w-4 h-4 text-[var(--cs-accent,#1d8b94)]" />
                  </button>
                </div>

                {/* KSA Marketing Quotes */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-black uppercase text-slate-400">
                    {isAr ? 'عبارات تسويقية جاهزة' : 'Quick Saudi Presets'}
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
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAddLayerMenu((v) => !v)}
                        className="cs-add-layer-btn w-full py-2.5 px-3 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        {isAr ? 'إضافة طبقة جديدة' : 'Add new layer'}
                        <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                      </button>
                      {showAddLayerMenu && (
                        <div className="cs-dropdown absolute start-0 end-0 top-full mt-1.5 p-1.5 z-50 space-y-0.5">
                          {(
                            [
                              {
                                id: 'headline',
                                label: isAr ? 'نص · عنوان' : 'Text · Heading',
                                run: () =>
                                  handleAddTextElement(
                                    'headline',
                                    isAr ? 'عنوان واضح وجذاب' : 'Clear bold heading',
                                  ),
                              },
                              {
                                id: 'body',
                                label: isAr ? 'نص · فقرة' : 'Text · Body',
                                run: () =>
                                  handleAddTextElement(
                                    'custom_text',
                                    isAr ? 'اكتب نصك هنا' : 'Type your text here',
                                  ),
                              },
                              {
                                id: 'rect',
                                label: isAr ? 'شكل · مستطيل' : 'Shape · Rectangle',
                                run: () => handleAddShape('rectangle'),
                              },
                              {
                                id: 'circle',
                                label: isAr ? 'شكل · دائرة' : 'Shape · Circle',
                                run: () => handleAddShape('circle'),
                              },
                              {
                                id: 'image',
                                label: isAr ? 'صورة / رفع' : 'Image / Upload',
                                run: () => {
                                  setActiveTab('media');
                                  setShowAddLayerMenu(false);
                                },
                              },
                              {
                                id: 'dup',
                                label: isAr ? 'تكرار الطبقة المحددة' : 'Duplicate selected',
                                run: () => handleDuplicateSelected(),
                                disabled: !selectedElementId && selectedElementIds.length === 0,
                              },
                            ] as const
                          ).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              disabled={'disabled' in item ? Boolean(item.disabled) : false}
                              onClick={() => {
                                item.run();
                                if (item.id !== 'image') setShowAddLayerMenu(false);
                                openPositionPanel('layers');
                              }}
                              className="w-full px-3 py-2 rounded-lg text-start text-[13px] font-bold cursor-pointer disabled:opacity-40 flex items-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="cs-layer-hint text-[12px] font-semibold leading-relaxed">
                      {isAr
                        ? 'Shift + نقرة = تحديد طبقات متعددة · اسحب للتحريك معاً.'
                        : 'Shift + click = multi-select · hover shows grab cursor · drag to reorder.'}
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleGroupSelected}
                        disabled={selectedElementIds.length < 2}
                        className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-700 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1"
                      >
                        <Group className="w-3.5 h-3.5" style={{ color: 'var(--accent, #1d8b94)' }} />
                        {isAr ? 'تجميع' : 'Group'}
                      </button>
                      <button
                        type="button"
                        onClick={handleUngroupSelected}
                        disabled={
                          !elements.some(
                            (el) =>
                              el.groupId &&
                              (el.id === selectedElementId || selectedElementIds.includes(el.id)),
                          )
                        }
                        className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-700 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1"
                      >
                        <Ungroup className="w-3.5 h-3.5" style={{ color: 'var(--accent, #1d8b94)' }} />
                        {isAr ? 'فك التجميع' : 'Ungroup'}
                      </button>
                    </div>
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
                      <p className="cs-layer-hint text-sm py-6 text-center font-semibold">
                        {isAr
                          ? 'لا توجد طبقات بعد. أضف نصاً أو صورة أو عنصراً.'
                          : 'No layers yet. Add text, an image, or an element.'}
                      </p>
                    ) : (
                      <div className="cs-layers-list space-y-1.5 max-h-[min(480px,52vh)] overflow-y-auto pe-1">
                        {layersForPanel.map((el) => {
                          const active =
                            selectedElementId === el.id || selectedElementIds.includes(el.id);
                          const label = layerLabel(el);
                          return (
                            <div
                              key={el.id}
                              role="button"
                              tabIndex={0}
                              title={label}
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
                                  selectSingleLayer(el.id);
                                }
                              }}
                              onClick={(ev) => {
                                if (ev.shiftKey) {
                                  setSelectedElementIds((prev) => {
                                    const next = prev.includes(el.id)
                                      ? prev.filter((id) => id !== el.id)
                                      : [...prev, el.id];
                                    setSelectedElementId(next[next.length - 1] || null);
                                    return next;
                                  });
                                } else {
                                  selectSingleLayer(el.id);
                                }
                              }}
                              className={`cs-layer-row w-full px-2.5 py-2 rounded-xl text-start flex items-center gap-2.5 ${
                                active ? 'cs-layer-active' : ''
                              } ${el.hidden ? 'cs-layer-hidden' : ''} ${
                                layerDragId === el.id ? 'cs-layer-dragging' : ''
                              } ${el.locked ? 'cs-layer-locked' : ''}`}
                            >
                              <span
                                className="cs-layer-grip shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md"
                                title={isAr ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
                                aria-hidden
                              >
                                <GripVertical className="w-4 h-4" />
                              </span>
                              <div
                                className="cs-layer-thumb shrink-0 w-10 h-10 rounded-lg border overflow-hidden flex items-center justify-center"
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
                                        : { background: '#ffffff' }
                                }
                              >
                                {el.type !== 'image' && el.type !== 'shape' ? (
                                  <span
                                    className="cs-layer-thumb-text text-[9px] font-black truncate px-0.5 max-w-full"
                                    style={{
                                      color: ensureReadableTextStyle(
                                        el.fontColor,
                                        el.bgColor,
                                        '#ffffff',
                                        { minRatio: 4.5 },
                                      ).fontColor,
                                      fontFamily: el.fontFamily || (isAr ? 'Tajawal' : 'Outfit'),
                                    }}
                                  >
                                    {label.slice(0, 6)}
                                  </span>
                                ) : null}
                              </div>
                              <span className="cs-layer-name flex-1 text-[13px] font-bold truncate leading-snug">
                                {label}
                              </span>
                              <button
                                type="button"
                                className="cs-layer-action p-1.5 rounded-lg"
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
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                className="cs-layer-action p-1.5 rounded-lg"
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
                                  <LockKeyhole className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <Unlock className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                className="cs-layer-action cs-layer-action-danger p-1.5 rounded-lg"
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
                          className="cs-layer-row cs-layer-bg w-full px-2.5 py-2 rounded-xl text-start flex items-center gap-2.5 border border-dashed"
                        >
                          <span className="w-6 shrink-0" />
                          <div
                            className="cs-layer-thumb shrink-0 w-10 h-10 rounded-lg border"
                            style={{ background: backdropPreviewCss }}
                          />
                          <span className="cs-layer-name flex-1 text-[13px] font-bold truncate">
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
                              if (p.price != null && Number(p.price) > 0) {
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

                {/* Categories — from product catalog of this store_id only */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-black uppercase text-slate-500">
                    {isAr ? 'تصنيفات المتجر' : 'Store Categories'}
                  </span>
                  <div className="space-y-1.5">
                    {(() => {
                      const cats = [
                        ...new Set(
                          currentProducts
                            .map((p) =>
                              String(
                                (isAr
                                  ? (p as { categoryAr?: string }).categoryAr || p.category
                                  : p.category) || '',
                              ).trim(),
                            )
                            .filter(Boolean),
                        ),
                      ];
                      if (cats.length === 0 && activeStore.category) {
                        cats.push(
                          isAr
                            ? activeStore.categoryAr || activeStore.category
                            : activeStore.category,
                        );
                      }
                      if (cats.length === 0) {
                        return (
                          <div className="py-4 text-center text-xs text-slate-500">
                            {isAr ? 'لا توجد تصنيفات' : 'No categories'}
                          </div>
                        );
                      }
                      return cats.map((cat, idx) => (
                        <button
                          key={`${cat}-${idx}`}
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
                      ));
                    })()}
                  </div>
                </div>

                {/* Brand Kit — real store logo + accent only */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="text-xs font-black uppercase text-slate-500">
                    {isAr ? 'طقم العلامة' : 'Brand Kit'}
                  </span>
                  {(() => {
                    const accent = String(activeStore.accentColor || '').trim();
                    const palette = deriveBrandPalette(accent);
                    const logoUrl = String(activeStore.logo || '').trim();
                    return (
                      <>
                        {logoUrl ? (
                          <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-white">
                            <img
                              src={logoUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold truncate" style={{ color: 'var(--text)' }}>
                                {isAr ? activeStore.nameAr || activeStore.name : activeStore.name}
                              </p>
                              <p className="text-[9px]" style={{ color: 'var(--muted)' }}>
                                {isAr ? 'شعار المتجر' : 'Store logo'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500">
                            {isAr ? 'لا يوجد شعار للمتجر بعد.' : 'No store logo yet.'}
                          </p>
                        )}
                        {palette.length > 0 ? (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-500">
                              {isAr ? 'ألوان مشتقة من لون العلامة' : 'Palette from store accent'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {palette.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  title={color}
                                  onClick={() => {
                                    if (!selectedElementId) {
                                      toast(
                                        isAr ? 'حدد طبقة أولاً' : 'Select a layer first',
                                        'info',
                                      );
                                      return;
                                    }
                                    const isShape = selectedElement?.type === 'shape';
                                    const isText =
                                      selectedElement?.type === 'headline' ||
                                      selectedElement?.type === 'subtitle' ||
                                      selectedElement?.type === 'custom_text' ||
                                      selectedElement?.type === 'badge' ||
                                      selectedElement?.type === 'price';
                                    updateSelectedElement({
                                      ...(isText ? { fontColor: color } : {}),
                                      ...(isShape
                                        ? { bgColor: color, strokeColor: color }
                                        : !isText
                                          ? { fontColor: color, bgColor: color }
                                          : {}),
                                    });
                                    toast(
                                      isAr ? 'تم تطبيق لون العلامة' : 'Brand color applied',
                                      'info',
                                    );
                                  }}
                                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer shadow-sm"
                                  style={{ background: color }}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500">
                            {isAr
                              ? 'لا يوجد لون علامة محفوظ لهذا المتجر.'
                              : 'No store accent color saved yet.'}
                          </p>
                        )}
                        {logoUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              const newLogoEl: CanvasElement = {
                                id: `logo-${Date.now()}`,
                                type: 'image',
                                text: isAr
                                  ? activeStore.nameAr || activeStore.name
                                  : activeStore.name,
                                imageUrl: logoUrl,
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
                              toast(
                                isAr ? 'تمت إضافة شعار المتجر!' : 'Store logo added to canvas!',
                                'info',
                              );
                            }}
                            className="w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer text-white"
                            style={{ background: 'var(--accent, #1d8b94)' }}
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span>
                              {isAr ? 'تطبيق الشعار كطبقة صورة' : 'Apply logo as image layer'}
                            </span>
                          </button>
                        ) : null}
                      </>
                    );
                  })()}
                </div>
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
                  {STUDIO_BACKDROPS.map((bd) => {
                    const isChecker = bd.css === 'checker' || bd.id === 'transparent';
                    const isLightSwatch =
                      bd.id === 'pure-white' ||
                      bd.id === 'soft-ivory' ||
                      bd.id === 'coffee-cream' ||
                      bd.id === 'original' ||
                      bd.id === 'petal-ivory' ||
                      bd.id === 'sage-mist' ||
                      bd.id === 'floral-blush' ||
                      isChecker;
                    return (
                      <button
                        key={bd.id}
                        type="button"
                        onClick={() => {
                          setSelectedBackdrop(bd.id);
                          pushHistorySnapshot();
                        }}
                        className={`p-2.5 rounded-xl border text-start cursor-pointer transition-all flex flex-col justify-between h-16 ${
                          selectedBackdrop === bd.id
                            ? 'ring-2 ring-[var(--accent,#1d8b94)] border-[var(--accent,#1d8b94)]'
                            : isChecker
                              ? 'border-slate-400 border-2'
                              : 'border-slate-300 hover:border-slate-500'
                        }`}
                        style={{
                          background: isChecker
                            ? 'repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%) 50% / 12px 12px'
                            : bd.css === 'transparent'
                              ? '#e2e8f0'
                              : bd.css,
                          boxShadow: bd.id === 'pure-white' ? 'none' : undefined,
                        }}
                      >
                        <span
                          className="text-[10px] font-black truncate"
                          style={{
                            color: isLightSwatch ? '#111827' : '#ffffff',
                            textShadow: isChecker
                              ? '0 0 4px #fff, 0 0 2px #fff'
                              : undefined,
                          }}
                        >
                          {isAr ? bd.labelAr : bd.labelEn}
                        </span>
                      </button>
                    );
                  })}
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
                <div className="cs-tip-card space-y-2 p-3 rounded-xl">
                  <div className="text-[11px] font-black" style={{ color: 'var(--cs-text)' }}>
                    {isAr
                      ? 'استيراد من كانفا أو باوربوينت أو فوتوشوب'
                      : 'Import from Canva / PowerPoint / Photoshop'}
                  </div>
                  <p className="cs-tip-body text-[10px] leading-relaxed">
                    {isAr
                      ? 'من كانفا: مشاركة ← تنزيل ← نوع الملف بصيغة العرض الحديثة ← ارفع الملف هنا. كل نص وصورة وشكل يصبح طبقة قابلة للتعديل. انسخ الطبقة والصقها هنا أو الصق النص من كانفا مباشرة. صورة مسطحة = طبقة واحدة.'
                      : 'From Canva: Share → Download → File type PPTX → upload here. Text, images, and shapes become editable layers. Copy a layer (Ctrl+C) and paste here, or paste text/images copied from Canva (Ctrl+V). Flat PNG/JPG = one layer.'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {CANVA_UPLOAD_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setUploadCategory(c.id)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-black border cursor-pointer ${
                          uploadCategory === c.id
                            ? 'text-white border-transparent cs-btn-primary'
                            : ''
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
                    className="cs-upload-zone w-full p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <Upload className="w-6 h-6 cs-accent-text mb-1.5" />
                    <span className="cs-upload-title text-xs">
                      {isImportingDesign
                        ? isAr
                          ? 'جاري الاستيراد…'
                          : 'Importing…'
                        : isAr
                          ? 'رفع ملف كانفا أو فوتوشوب أو صورة'
                          : 'Upload Canva PPTX / PSD / image'}
                    </span>
                    <span className="cs-upload-sub text-[10px] mt-0.5">
                      {isAr
                        ? 'عرض كانفا = طبقات كاملة · نسخ ولصق مثل كانفا'
                        : 'Canva PPTX = full layers · copy/paste like Canva'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveAsMyTemplate()}
                    className="w-full py-2 rounded-lg text-[11px] font-black text-white cursor-pointer cs-btn-primary"
                    style={{ background: 'var(--accent, #1d8b94)' }}
                  >
                    {isAr ? 'حفظ كقالب في قوالبي' : 'Save as My Template'}
                  </button>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className="cs-upload-zone p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/*"
                    className="hidden"
                    onChange={handleUploadLocalFile}
                  />
                  <Upload className="w-6 h-6 cs-accent-text mb-1.5" />
                  <span className="cs-upload-title text-xs">
                    {isAr ? 'رفع بي إن جي أو جيه بي جيه' : 'Upload PNG / JPG'}
                  </span>
                  <span className="cs-upload-sub text-[10px] mt-0.5">
                    {isAr
                      ? 'طبقة مستقلة قابلة للتعديل — تظهر في ملفاتي'
                      : 'Editable layer — also listed under My Files'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="cs-section-label">
                      {isAr ? 'ملفاتي' : 'My Files'}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--cs-muted)' }}>
                      {sessionUploads.length}
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: 'var(--cs-muted)' }}>
                    {isAr
                      ? 'نقرة واحدة = إدراج كطبقة. كل صورة طبقة منفصلة للتحريك وتغيير الحجم.'
                      : 'One click = insert as layer. Each image is its own move/resize layer.'}
                  </p>
                  {sessionUploads.length === 0 ? (
                    <div className="cs-empty-hint py-4 text-center text-[11px] rounded-xl">
                      {isAr ? 'لا ملفات مرفوعة بعد في هذه الجلسة.' : 'No uploads in this session yet.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pe-1">
                      {sessionUploads.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() =>
                            insertImageDataUrlAsLayer(f.dataUrl, f.name, { trackSession: false })
                          }
                          className="aspect-square rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:border-emerald-500 relative group bg-slate-50"
                          title={f.name}
                        >
                          <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                          <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[8px] font-bold px-1 py-0.5 truncate">
                            {f.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
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
                          className="aspect-square rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:border-[var(--cs-accent,#1d8b94)] relative group bg-slate-50"
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
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <span className="cs-section-label">
                    {isAr ? 'عزل الخلفية (محلي)' : 'Background isolate (local)'}
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {isAr
                      ? 'قطع لوني محلي على الجهاز — ليس ذكاءً اصطناعياً سحابياً. حدد طبقة صورة أو صورة المنتج ثم اضبط الحساسية.'
                      : 'On-device chroma cutout — not cloud AI. Select an image layer or product hero, then tune sensitivity.'}
                  </p>
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
                          ? 'جارٍ العزل المحلي...'
                          : 'Running local cutout...'
                        : selectedElement?.type === 'image' && selectedElement.bgRemoved
                          ? isAr
                            ? '✓ عُزلت الطبقة — استعادة'
                            : '✓ Layer isolated — restore'
                          : bgRemoved && selectedElement?.type !== 'image'
                            ? isAr
                              ? '✓ عُزلت صورة المنتج — استعادة'
                              : '✓ Product isolated — restore'
                            : isAr
                              ? 'عزل الخلفية (محلي)'
                              : 'Isolate background (local)'}
                    </span>
                  </button>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>{isAr ? 'تسامح العزل' : 'Cutout tolerance'}</span>
                      <span className="font-mono">{bgTolerance}</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={96}
                      step={1}
                      value={bgTolerance}
                      onChange={(e) => setBgTolerance(Number(e.target.value))}
                      onMouseUp={() => pushHistorySnapshot()}
                      onTouchEnd={() => pushHistorySnapshot()}
                      className="w-full accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
                    />
                    <p className="text-[9px] text-slate-500">
                      {isAr
                        ? 'أقل = حواف أدق · أعلى = عزل أوسع للخلفيات المتشابهة.'
                        : 'Lower = tighter edges · Higher = wider cutout for similar backgrounds.'}
                    </p>
                  </div>
                </div>

                {selectedElement?.type === 'image' ? (
                  <div className="space-y-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                    <span className="cs-section-label">
                      {isAr ? 'ضبط طبقة الصورة المحددة' : 'Selected image layer adjust'}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {isAr
                        ? 'السطوع والتباين والتشبع والضبابية لهذه الطبقة فقط — مثل كانفا.'
                        : 'Brightness, contrast, saturation, blur for this layer only — Canva-style.'}
                    </p>
                    {(
                      [
                        ['brightness', isAr ? 'السطوع' : 'Brightness', 40, 180, selectedElement.brightness ?? 100],
                        ['contrast', isAr ? 'التباين' : 'Contrast', 50, 180, selectedElement.contrast ?? 100],
                        ['saturation', isAr ? 'التشبع' : 'Saturation', 0, 200, selectedElement.saturation ?? 100],
                        ['blur', isAr ? 'الضبابية' : 'Blur', 0, 20, selectedElement.blur ?? 0],
                      ] as const
                    ).map(([key, label, min, max, val]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-700">
                          <span>{label}</span>
                          <span className="font-mono">
                            {key === 'blur' ? `${val}px` : `${val}%`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={min}
                          max={max}
                          value={val}
                          onChange={(e) =>
                            updateSelectedElement(
                              { [key]: Number(e.target.value) } as Partial<CanvasElement>,
                              false,
                            )
                          }
                          onMouseUp={() => pushHistorySnapshot()}
                          onTouchEnd={() => pushHistorySnapshot()}
                          className="w-full accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedElement({
                          brightness: 100,
                          contrast: 100,
                          saturation: 100,
                          blur: 0,
                        })
                      }
                      className="w-full py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-white cursor-pointer"
                    >
                      {isAr ? 'إعادة ضبط الطبقة' : 'Reset layer adjust'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="cs-section-label">
                      {isAr ? 'ضبط صورة المنتج' : 'Product image adjust'}
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {isAr
                        ? 'حدد طبقة صورة من لوحة الطبقات لضبط تلك الطبقة مباشرة.'
                        : 'Select an image layer in Layers to adjust that layer directly.'}
                    </p>
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
                        className="w-full accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
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
                        className="w-full accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
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
                        className="w-full accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
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
                        className="w-full accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setFlipH(!flipH)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${flipH ? 'cs-active' : 'border-slate-200 text-slate-700 bg-white'}`}
                      >
                        {isAr ? 'قلب أفقياً' : 'Flip horizontal'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlipV(!flipV)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${flipV ? 'cs-active' : 'border-slate-200 text-slate-700 bg-white'}`}
                      >
                        {isAr ? 'قلب رأسياً' : 'Flip vertical'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 8. SETTINGS — size, import/export project, clear */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <span className="cs-section-label">
                    {isAr ? 'أبعاد التصميم' : 'Design size'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">
                        {isAr ? 'العرض' : 'Width'}
                      </span>
                      <input
                        type="number"
                        min={64}
                        max={4000}
                        value={canvasW}
                        onChange={(e) =>
                          setCanvasW(Math.max(64, Math.min(4000, Number(e.target.value) || 1080)))
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">
                        {isAr ? 'الارتفاع' : 'Height'}
                      </span>
                      <input
                        type="number"
                        min={64}
                        max={4000}
                        value={canvasH}
                        onChange={(e) =>
                          setCanvasH(Math.max(64, Math.min(4000, Number(e.target.value) || 1080)))
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {isAr
                      ? 'أو استخدم قائمة المقاس أعلى الشريط.'
                      : 'Or use the size menu in the top bar.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="cs-section-label">
                    {isAr ? 'استيراد / تصدير المشروع' : 'Import / export project'}
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {isAr
                      ? 'ملف المشروع يحفظ كل الطبقات والنصوص والصور والتنسيق — استورده لاحقاً للتعديل الكامل.'
                      : 'Project file keeps every layer, text, image, and formatting — re-import for full edit.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleExportProjectJson}
                    className="w-full py-2 rounded-lg text-[11px] font-black text-white cursor-pointer flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--accent, #1d8b94)' }}
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    {isAr ? 'تصدير ملف المشروع' : 'Export project JSON'}
                  </button>
                  <button
                    type="button"
                    onClick={() => projectJsonInputRef.current?.click()}
                    className="w-full py-2 rounded-lg text-[11px] font-black border border-slate-200 bg-white text-slate-800 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    {isAr ? 'استيراد ملف المشروع' : 'Import project JSON'}
                  </button>
                  <button
                    type="button"
                    disabled={isImportingDesign}
                    onClick={() => designFileInputRef.current?.click()}
                    className="w-full py-2 rounded-lg text-[11px] font-black border border-emerald-300 bg-emerald-50 text-emerald-900 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isAr ? 'رفع قالب (باوربوينت / فوتوشوب / صورة)' : 'Upload template (PPTX / PSD / image)'}
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="cs-section-label">
                    {isAr ? 'لوحة العمل' : 'Canvas'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setElements([]);
                      setSelectedElementId(null);
                      setSelectedElementIds([]);
                      setProductScale(0);
                      setSavedToMediaLibrary(false);
                      pushHistorySnapshot([]);
                      if (activeStore?.id) {
                        clearCanvaStudioDraft(
                          activeStore.id,
                          canvaDraftScope({
                            masterMode,
                            editorKind: editorKind || null,
                            assetId: initialAsset?.id || null,
                          }),
                        );
                      }
                      setAutoSaveState('idle');
                      setAutoSaveAt(null);
                      toast(isAr ? 'تم مسح الطبقات.' : 'Layers cleared.', 'info');
                    }}
                    className="w-full py-2 rounded-lg text-[11px] font-black border border-rose-200 bg-rose-50 text-rose-800 cursor-pointer"
                  >
                    {isAr ? 'مسح كل الطبقات' : 'Clear all layers'}
                  </button>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    {canvasW}×{canvasH} · {elements.length}{' '}
                    {isAr ? 'طبقة' : 'layer(s)'}
                  </div>
                </div>
              </div>
            )}

            {/* 9. TIMELINE — text animations + transitions */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <span className="cs-section-label">
                    {isAr ? 'الخط الزمني' : 'Timeline'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlayingTimeline(false);
                        setPlayheadMs(0);
                        timelineTimeRef.current = 0;
                        renderCanvas();
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer"
                      title={isAr ? 'إلى البداية' : 'To start'}
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPlayingTimeline((v) => !v)}
                      className="p-1.5 rounded-lg text-white cursor-pointer"
                      style={{ background: 'var(--accent, #1d8b94)' }}
                      title={isAr ? (isPlayingTimeline ? 'إيقاف' : 'تشغيل') : isPlayingTimeline ? 'Pause' : 'Play'}
                    >
                      {isPlayingTimeline ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-[10px] font-mono text-slate-600 ms-1">
                      {(playheadMs / 1000).toFixed(2)}s / {(timelineDurationMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={timelineDurationMs}
                    value={playheadMs}
                    onChange={(e) => {
                      setIsPlayingTimeline(false);
                      const v = Number(e.target.value);
                      setPlayheadMs(v);
                      timelineTimeRef.current = v;
                      renderCanvas();
                    }}
                    className="w-full accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
                  />
                  <label className="block space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                      <span>{isAr ? 'مدة المقطع' : 'Clip length'}</span>
                      <span className="font-mono">{(timelineDurationMs / 1000).toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min={1500}
                      max={12000}
                      step={100}
                      value={timelineDurationMs}
                      onChange={(e) => {
                        const d = Number(e.target.value);
                        setTimelineDurationMs(d);
                        setPlayheadMs((p) => Math.min(p, d));
                      }}
                      className="w-full accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      disabled={isExportingMotion}
                      onClick={() => void handleExportGif()}
                      className="py-1.5 rounded-lg text-[10px] font-black border border-slate-200 bg-white cursor-pointer disabled:opacity-50"
                    >
                      {isAr ? 'حفظ متحرك' : 'Save GIF'}
                    </button>
                    <button
                      type="button"
                      disabled={isExportingMotion}
                      onClick={() => void handleExportMp4()}
                      className="py-1.5 rounded-lg text-[10px] font-black text-white cursor-pointer disabled:opacity-50"
                      style={{ background: 'var(--accent, #1d8b94)' }}
                    >
                      {isAr ? 'حفظ فيديو' : 'Save MP4'}
                    </button>
                  </div>
                </div>

                {selectedElement ? (
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                    <span className="cs-section-label">
                      {isAr ? 'حركة الطبقة المحددة' : 'Selected layer motion'}
                    </span>
                    <label className="block space-y-1">
                      <span className="text-[10px] font-bold text-slate-600">
                        {isAr ? 'دخول' : 'Enter'}
                      </span>
                      <select
                        value={selectedElement.animIn || 'none'}
                        onChange={(e) => {
                          const animIn = e.target.value as CanvaAnimPreset;
                          updateSelectedElement({
                            animIn,
                            animDurationMs: selectedElement.animDurationMs || 600,
                          });
                          setTimelineDurationMs((d) =>
                            Math.max(
                              d,
                              defaultTimelineMs([
                                ...elements.map((x) =>
                                  x.id === selectedElement.id ? { ...x, animIn } : x,
                                ),
                              ]),
                            ),
                          );
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                      >
                        {CANVA_ANIM_PRESETS.filter((p) =>
                          selectedElement.type === 'image' || selectedElement.type === 'shape'
                            ? p.id !== 'typewriter'
                            : true,
                        ).map((p) => (
                          <option key={p.id} value={p.id}>
                            {isAr ? p.labelAr : p.labelEn}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] font-bold text-slate-600">
                        {isAr ? 'خروج' : 'Exit'}
                      </span>
                      <select
                        value={selectedElement.animOut || 'none'}
                        onChange={(e) =>
                          updateSelectedElement({
                            animOut: e.target.value as CanvaAnimPreset,
                            animOutDurationMs: selectedElement.animOutDurationMs || 450,
                          })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                      >
                        {CANVA_ANIM_PRESETS.filter((p) => p.id !== 'typewriter').map((p) => (
                          <option key={p.id} value={p.id}>
                            {isAr ? p.labelAr : p.labelEn}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] font-bold text-slate-600">
                        {isAr ? 'انتقال' : 'Transition ease'}
                      </span>
                      <select
                        value={selectedElement.animEase || 'easeOut'}
                        onChange={(e) =>
                          updateSelectedElement({ animEase: e.target.value as CanvaAnimEase })
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                      >
                        {CANVA_ANIM_EASES.map((p) => (
                          <option key={p.id} value={p.id}>
                            {isAr ? p.labelAr : p.labelEn}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(
                      [
                        ['animDelayMs', isAr ? 'تأخير' : 'Delay', 0, 4000, selectedElement.animDelayMs ?? 0],
                        [
                          'animDurationMs',
                          isAr ? 'مدة الدخول' : 'Enter duration',
                          120,
                          3000,
                          selectedElement.animDurationMs ?? 600,
                        ],
                        [
                          'animOutDurationMs',
                          isAr ? 'مدة الخروج' : 'Exit duration',
                          120,
                          3000,
                          selectedElement.animOutDurationMs ?? 450,
                        ],
                      ] as const
                    ).map(([key, label, min, max, val]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600">
                          <span>{label}</span>
                          <span className="font-mono">{val}ms</span>
                        </div>
                        <input
                          type="range"
                          min={min}
                          max={max}
                          step={20}
                          value={val}
                          onChange={(e) =>
                            updateSelectedElement(
                              { [key]: Number(e.target.value) } as Partial<CanvasElement>,
                              false,
                            )
                          }
                          onMouseUp={() => pushHistorySnapshot()}
                          onTouchEnd={() => pushHistorySnapshot()}
                          className="w-full accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 leading-relaxed px-1">
                    {isAr
                      ? 'حدد أي طبقة لتطبيق حركة الدخول/الخروج والانتقال.'
                      : 'Select any layer to set enter/exit animation and transition.'}
                  </p>
                )}

                {/* Simple track list */}
                <div className="space-y-1.5">
                  <span className="cs-section-label">
                    {isAr ? 'مسارات الطبقات' : 'Layer tracks'}
                  </span>
                  {elements.length === 0 ? (
                    <p className="text-[10px] text-slate-500 py-3 text-center border border-dashed border-slate-200 rounded-xl">
                      {isAr ? 'لا طبقات بعد.' : 'No layers yet.'}
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1 pe-0.5">
                      {[...elements].reverse().map((el) => {
                        const delay = el.animDelayMs ?? 0;
                        const din = el.animDurationMs ?? 600;
                        const left = (delay / timelineDurationMs) * 100;
                        const width = Math.max(4, (din / timelineDurationMs) * 100);
                        const active = el.id === selectedElementId;
                        return (
                          <button
                            key={el.id}
                            type="button"
                            onClick={() => {
                              setSelectedElementId(el.id);
                              setSelectedElementIds([el.id]);
                            }}
                            className={`w-full text-start px-2 py-1.5 rounded-lg border cursor-pointer ${
                              active ? 'cs-active-soft' : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="text-[10px] font-bold truncate text-slate-800">
                              {layerLabel(el)}
                              {(el.animIn && el.animIn !== 'none') ||
                              (el.animOut && el.animOut !== 'none')
                                ? ` · ${el.animIn || '—'}/${el.animOut || '—'}`
                                : ''}
                            </div>
                            <div className="mt-1 h-2 rounded-full bg-slate-100 relative overflow-hidden">
                              <span
                                className="absolute top-0 bottom-0 rounded-full"
                                style={{
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  background: 'var(--accent, #1d8b94)',
                                  opacity: 0.85,
                                }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── CANVAS WORKSPACE & CONTEXTUAL TOOLBAR ── */}
          <div className="cs-workspace flex-1 flex flex-col justify-between p-3 sm:p-4 overflow-hidden min-w-0">
            {/* FLOATING CONTEXTUAL TOOLBAR ABOVE DESIGN */}
            <div className="cs-toolbar cs-glass mb-2 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 text-xs shrink-0">
              {selectedElement ? (
                <div className="cs-toolbar-scroll flex items-center gap-1.5 sm:gap-2 scrollbar-none">
                  {/* Text edit */}
                  {(selectedElement.type === 'sticker' || selectedElement.type === 'icon') && (
                    <>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-200 bg-white">
                        <span className="text-[10px] text-slate-500">{isAr ? 'حجم' : 'Size'}</span>
                        <input
                          type="range"
                          min={24}
                          max={180}
                          value={selectedElement.fontSize || 48}
                          onChange={(e) =>
                            updateSelectedElement({ fontSize: Number(e.target.value) }, false)
                          }
                          onMouseUp={() => pushHistorySnapshot()}
                          onTouchEnd={() => pushHistorySnapshot()}
                          className="w-20 accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-600 w-7">
                          {selectedElement.fontSize || 48}
                        </span>
                      </div>
                      {selectedElement.type === 'sticker' && (
                        <input
                          type="text"
                          value={selectedElement.text}
                          onChange={(e) => updateSelectedElement({ text: e.target.value }, false)}
                          onBlur={() => pushHistorySnapshot()}
                          className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-sm min-w-[64px] max-w-[100px] text-center"
                          placeholder="✨"
                          title={isAr ? 'تغيير الرمز' : 'Change emoji'}
                        />
                      )}
                    </>
                  )}
                  {selectedElement.type !== 'shape' &&
                    selectedElement.type !== 'image' &&
                    selectedElement.type !== 'sticker' &&
                    selectedElement.type !== 'icon' && (
                    <>
                      <input
                        type="text"
                        value={selectedElement.text}
                        onChange={(e) => updateSelectedElement({ text: e.target.value }, false)}
                        onBlur={() => pushHistorySnapshot()}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 min-w-[120px] max-w-[200px]"
                        placeholder={isAr ? 'تعديل النص...' : 'Edit text...'}
                      />
                      <div className="min-w-[160px] max-w-[220px]" title={isAr ? 'الخط' : 'Font'}>
                        <StoreFontSelect
                          isAr={isAr}
                          value={selectedElement.fontFamily || (isAr ? 'Tajawal' : 'Outfit')}
                          searchable={false}
                          onChange={(fontFamily) => {
                            ensureStoreGoogleFontLoaded(fontFamily);
                            updateSelectedElement({ fontFamily });
                          }}
                          className="!py-1 !rounded-lg !text-xs"
                        />
                      </div>
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
                          className="w-12 accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
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
                            ? 'cs-active'
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
                            ? 'cs-active'
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
                            ? 'cs-active'
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
                            ? 'cs-active'
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
                            ? 'cs-active'
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
                          className={`p-1.5 ${selectedElement.textAlign === 'left' ? 'cs-active' : 'text-slate-600 hover:bg-slate-100'}`}
                          title={isAr ? 'محاذاة لليسار' : 'Align left'}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ textAlign: 'center' })}
                          className={`p-1.5 ${selectedElement.textAlign === 'center' ? 'cs-active' : 'text-slate-600 hover:bg-slate-100'}`}
                          title={isAr ? 'توسيط' : 'Align center'}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ textAlign: 'right' })}
                          className={`p-1.5 ${selectedElement.textAlign === 'right' ? 'cs-active' : 'text-slate-600 hover:bg-slate-100'}`}
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
                          <div className="cs-spacing-popover absolute start-0 bottom-full mb-1.5 z-50 w-56 rounded-xl border border-slate-200 bg-white p-3 space-y-3 shadow-lg">
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

                  {/* Image resize / transform / BG remove */}
                  {selectedElement.type === 'image' && (
                    <>
                      <button
                        type="button"
                        onClick={handleAiRemoveBg}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer flex items-center gap-1 ${
                          selectedElement.bgRemoved
                            ? 'cs-active'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        title={isAr ? 'إزالة خلفية هذه الطبقة' : 'Remove this layer background'}
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        {selectedElement.bgRemoved
                          ? isAr
                            ? 'عزل مفعّل'
                            : 'Isolated'
                          : isAr
                            ? 'عزل محلي'
                            : 'Local cutout'}
                      </button>
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
                          className="w-16 accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
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
                          className="w-16 accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-200 bg-white">
                        <span className="text-[10px] text-slate-500">{isAr ? 'زوايا' : 'Radius'}</span>
                        <input
                          type="range"
                          min={0}
                          max={80}
                          value={selectedElement.borderRadius || 0}
                          onChange={(e) =>
                            updateSelectedElement({ borderRadius: Number(e.target.value) }, false)
                          }
                          onMouseUp={() => pushHistorySnapshot()}
                          onTouchEnd={() => pushHistorySnapshot()}
                          className="w-14 accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
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
                          className="w-12 accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
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
                            ? 'cs-active'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        {isAr ? 'ظل' : 'Shadow'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('filters');
                          setFlyoutOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold cursor-pointer text-slate-700 hover:bg-slate-50"
                        title={isAr ? 'ضبط الصورة' : 'Image adjust'}
                      >
                        {isAr ? 'ضبط' : 'Adjust'}
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
                          className="w-12 accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
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
                      className="w-16 accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
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
                        ? 'cs-active'
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
                        ? 'cs-active'
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
                      className="w-14 accent-[var(--cs-accent,#1d8b94)] cursor-pointer"
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
                <div className="cs-toolbar-scroll flex items-center gap-2 text-slate-500 text-xs min-w-0">
                  <span className="truncate">
                    {isAr
                      ? 'انقر على أي عنصر في التصميم للتعديل'
                      : 'Click any element on the design to edit'}
                  </span>
                </div>
              )}

              <div className="cs-toolbar-end flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAiRemoveBg}
                  disabled={isProcessingAi}
                  className="px-2 sm:px-2.5 py-1 rounded-lg text-[10px] font-black text-white flex items-center gap-1 cursor-pointer disabled:opacity-60 cs-btn-primary"
                  style={{ background: 'var(--accent, #1d8b94)' }}
                  title={
                    isAr
                      ? 'عزل الخلفية محلياً (ليس ذكاء اصطناعي)'
                      : 'Local background cutout (not AI)'
                  }
                >
                  <Wand2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="cs-toolbar-end-label">
                    {isProcessingAi
                      ? isAr
                        ? 'جارٍ العزل...'
                        : 'Cutting out...'
                      : bgRemoved
                        ? isAr
                          ? 'عزل مفعّل'
                          : 'Isolated'
                        : isAr
                          ? 'عزل محلي'
                          : 'Local cutout'}
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
                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700 whitespace-nowrap"
                >
                  {isAr ? 'توسيط' : 'Center'}
                </button>
              </div>
            </div>

            {/* Canvas Container — Canva multi-page vertical stack (toolbar floats on top of each page) */}
            <div
              ref={containerRef}
              className="cs-page-stack flex-1 flex flex-col items-center min-h-[280px] sm:min-h-[350px] overflow-auto p-2 sm:p-4 pt-4 gap-8"
            >
              {studioPages.map((page, idx) => {
                const isActive = page.id === activePageId;
                const pageLocked = Boolean(page.locked);
                const pageHidden = Boolean(page.hidden);
                const pageLabel =
                  page.name || defaultPageName(idx, isAr) || (isAr ? `الصفحة ${idx + 1}` : `Page ${idx + 1}`);
                return (
                  <div
                    key={page.id}
                    ref={(el) => {
                      pageBlockRefs.current[page.id] = el;
                    }}
                    className={`cs-page-stack-item relative w-full max-w-[920px] flex flex-col items-center gap-2${
                      isActive ? ' is-active' : ''
                    }`}
                    data-page-id={page.id}
                  >
                    {/* One Canva-style bar: tools + page title on the SAME line */}
                    <div
                      className={`cs-page-toolbar cs-page-toolbar-float w-full${
                        isActive ? ' is-active' : ''
                      }`}
                      dir={isAr ? 'rtl' : 'ltr'}
                    >
                      <div
                        className="cs-page-tools cs-page-bar flex flex-nowrap items-center gap-1 w-full min-w-0 px-1.5 py-1 rounded-2xl"
                        role="toolbar"
                        aria-label={isAr ? 'أدوات الصفحة' : 'Page tools'}
                      >
                        <div className="cs-page-bar-tools flex flex-nowrap items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddBlankPage(page.id)}
                            className="cs-page-tool-btn"
                            title={isAr ? 'إضافة صفحة فارغة أسفل الحالية' : 'Add blank page below'}
                          >
                            <FilePlus2 className="w-4 h-4" strokeWidth={2.25} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePage(page.id)}
                            className="cs-page-tool-btn cs-page-tool-danger"
                            title={isAr ? 'حذف الصفحة' : 'Delete page'}
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2.25} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicatePage(page.id)}
                            className="cs-page-tool-btn"
                            title={isAr ? 'تكرار الصفحة أسفل الحالية' : 'Duplicate page below'}
                          >
                            <CopyPlus className="w-4 h-4" strokeWidth={2.25} />
                          </button>
                          <span className="cs-page-tool-sep" aria-hidden />
                          <button
                            type="button"
                            onClick={() => handleTogglePageLock(page.id)}
                            className={`cs-page-tool-btn ${pageLocked ? 'is-on is-lock' : ''}`}
                            title={
                              pageLocked
                                ? isAr
                                  ? 'فتح قفل الصفحة'
                                  : 'Unlock page'
                                : isAr
                                  ? 'قفل الصفحة'
                                  : 'Lock page'
                            }
                          >
                            {pageLocked ? (
                              <LockKeyhole className="w-4 h-4" strokeWidth={2.25} />
                            ) : (
                              <Unlock className="w-4 h-4" strokeWidth={2.25} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePageHidden(page.id)}
                            className={`cs-page-tool-btn ${pageHidden ? 'is-on is-hide' : ''}`}
                            title={
                              pageHidden
                                ? isAr
                                  ? 'إظهار الصفحة'
                                  : 'Show page'
                                : isAr
                                  ? 'إخفاء الصفحة'
                                  : 'Hide page'
                            }
                          >
                            {pageHidden ? (
                              <EyeOff className="w-4 h-4" strokeWidth={2.25} />
                            ) : (
                              <Eye className="w-4 h-4" strokeWidth={2.25} />
                            )}
                          </button>
                          <span className="cs-page-tool-sep" aria-hidden />
                          <button
                            type="button"
                            onClick={() => handleMovePage(1, page.id)}
                            disabled={idx >= studioPages.length - 1}
                            className="cs-page-tool-btn"
                            title={isAr ? 'نقل الصفحة لأسفل' : 'Move page down'}
                          >
                            <ChevronDown className="w-4 h-4" strokeWidth={2.25} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePage(-1, page.id)}
                            disabled={idx <= 0}
                            className="cs-page-tool-btn"
                            title={isAr ? 'نقل الصفحة لأعلى' : 'Move page up'}
                          >
                            <ChevronUp className="w-4 h-4" strokeWidth={2.25} />
                          </button>
                        </div>
                        <div className="cs-page-bar-title flex flex-nowrap items-center gap-1.5 min-w-0 flex-1 justify-end ms-auto">
                          <span className="cs-page-toolbar-label shrink-0 text-[12px] font-semibold whitespace-nowrap">
                            {isAr ? `الصفحة ${idx + 1}` : `Page ${idx + 1}`}
                            <span className="opacity-50 mx-1">-</span>
                          </span>
                          <input
                            type="text"
                            className="cs-page-toolbar-title-input min-w-0 flex-1 max-w-[220px] text-[12px] font-semibold bg-transparent border-0 outline-none truncate text-end"
                            value={page.name || ''}
                            placeholder={isAr ? 'إضافة عنوان للصفحة' : 'Add a page title'}
                            onFocus={() => handleSelectPage(page.id)}
                            onChange={(e) => handleRenamePage(page.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            title={pageLabel}
                            aria-label={isAr ? 'عنوان الصفحة' : 'Page title'}
                          />
                        </div>
                      </div>
                    </div>

                    {isActive ? (
                      <div
                        ref={canvasFrameRef}
                        className={`cs-canvas-frame relative overflow-visible flex items-center justify-center select-none w-full max-w-full${
                          selectedBackdrop === 'transparent' ? ' cs-canvas-transparent-border' : ''
                        }${selectedBackdrop === 'pure-white' ? ' cs-canvas-pure-white' : ''}${
                          canvasHoverCursor === 'grab' || canvasHoverCursor === 'grabbing'
                            ? ' is-layer-hover'
                            : ' is-pan-ready'
                        }${pageHidden ? ' cs-page-hidden' : ''}${pageLocked ? ' cs-page-locked' : ''}`}
                        style={{
                          ...canvasFrameBoxStyle(canvasW, canvasH),
                          cursor: pageLocked
                            ? 'not-allowed'
                            : isDraggingElement || isDraggingProduct
                              ? 'grabbing'
                              : isResizingElement || isResizingProduct
                                ? 'nwse-resize'
                                : canvasHoverCursor === 'grab'
                                  ? 'grab'
                                  : canvasHoverCursor === 'move'
                                    ? 'move'
                                    : 'default',
                          opacity: pageHidden ? 0.35 : 1,
                        }}
                        onMouseDown={(e) => {
                          if (ctxMenu) setCtxMenu(null);
                          handlePointerDown(e);
                        }}
                        onMouseMove={handlePointerMove}
                        onMouseUp={handlePointerUp}
                        onMouseLeave={() => {
                          if (!isDraggingElement && !isDraggingProduct) setCanvasHoverCursorSafe('default');
                        }}
                        onTouchStart={handlePointerDown}
                        onTouchMove={handlePointerMove}
                        onTouchEnd={handlePointerUp}
                        onContextMenu={handleCanvasContextMenu}
                      >
                        <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />
                        {snapGuides.length > 0 && (
                          <div className="absolute inset-0 pointer-events-none z-20">
                            {snapGuides.map((g, i) =>
                              g.axis === 'v' ? (
                                <div
                                  key={`sg-v-${i}-${g.at}`}
                                  className="absolute top-0 bottom-0 w-px"
                                  style={{
                                    left: `${(g.at / Math.max(1, canvasW)) * 100}%`,
                                    background: 'var(--accent, #1d8b94)',
                                    boxShadow: '0 0 0 1px rgba(255,255,255,0.55)',
                                  }}
                                />
                              ) : (
                                <div
                                  key={`sg-h-${i}-${g.at}`}
                                  className="absolute left-0 right-0 h-px"
                                  style={{
                                    top: `${(g.at / Math.max(1, canvasH)) * 100}%`,
                                    background: 'var(--accent, #1d8b94)',
                                    boxShadow: '0 0 0 1px rgba(255,255,255,0.55)',
                                  }}
                                />
                              ),
                            )}
                          </div>
                        )}
                        {pageHidden && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <span className="px-3 py-1.5 rounded-lg bg-slate-900/70 text-white text-xs font-bold">
                              {isAr ? 'الصفحة مخفية' : 'Page hidden'}
                            </span>
                          </div>
                        )}
                        {pageLocked && !pageHidden && (
                          <div className="absolute top-2 end-2 pointer-events-none z-10">
                            <span className="px-2 py-1 rounded-md bg-amber-500/90 text-white text-[10px] font-bold flex items-center gap-1">
                              <LockKeyhole className="w-3 h-3" />
                              {isAr ? 'مقفل' : 'Locked'}
                            </span>
                          </div>
                        )}

                        {imageLoading && (
                          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2 text-slate-800">
                            <RefreshCw className="w-7 h-7 text-[var(--cs-accent,#1d8b94)] animate-spin" />
                            <span className="text-xs font-bold">
                              {isAr ? 'جارٍ تحميل الصورة...' : 'Loading image...'}
                            </span>
                          </div>
                        )}

                        {snapGuides.length > 0 &&
                          (isDraggingElement || isDraggingProduct) &&
                          snapGuides.map((g, gi) =>
                            g.v != null ? (
                              <div
                                key={`snap-v-${gi}-${g.v}`}
                                className="absolute top-0 bottom-0 pointer-events-none z-20"
                                style={{
                                  left: `${(g.v / canvasW) * 100}%`,
                                  width: 1,
                                  background: 'var(--accent, #1d8b94)',
                                  boxShadow: '0 0 0 0.5px rgba(255,255,255,0.7)',
                                }}
                              />
                            ) : g.h != null ? (
                              <div
                                key={`snap-h-${gi}-${g.h}`}
                                className="absolute start-0 end-0 pointer-events-none z-20"
                                style={{
                                  top: `${(g.h / canvasH) * 100}%`,
                                  height: 1,
                                  background: 'var(--accent, #1d8b94)',
                                  boxShadow: '0 0 0 0.5px rgba(255,255,255,0.7)',
                                }}
                              />
                            ) : null,
                          )}

                        {selectedElementIds
                          .filter((id) => id !== selectedElementId)
                          .map((id) => {
                            const el = elements.find((x) => x.id === id);
                            if (!el || el.hidden) return null;
                            const r = layoutCacheRef.current[id] ?? estimateElementBounds(el);
                            return (
                              <div
                                key={`sel-multi-${id}`}
                                className="cs-selection-box absolute pointer-events-none opacity-70"
                                style={rectToPercentStyle(r, canvasW, canvasH)}
                              />
                            );
                          })}

                        {selectedElement && elementSelectionRect && (
                          <div
                            key={`sel-el-${selectedElement.id}`}
                            className="cs-selection-box absolute"
                            style={rectToPercentStyle(elementSelectionRect, canvasW, canvasH)}
                          >
                            <div
                              className="cs-selection-toolbar cs-selection-pill absolute left-1/2 flex items-center gap-1 rounded-lg px-2 py-1 whitespace-nowrap text-[11px] text-slate-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => updateSelectedElement({ locked: !selectedElement.locked })}
                                className="p-1 rounded text-slate-600 hover:bg-slate-100"
                                title={
                                  selectedElement.locked
                                    ? isAr
                                      ? 'فتح القفل'
                                      : 'Unlock'
                                    : isAr
                                      ? 'قفل'
                                      : 'Lock'
                                }
                              >
                                {selectedElement.locked ? (
                                  <LockKeyhole className="w-3.5 h-3.5 text-amber-500" />
                                ) : (
                                  <Unlock className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateSelectedElement({ hidden: !selectedElement.hidden })
                                }
                                className="p-1 rounded text-slate-600 hover:bg-slate-100"
                                title={
                                  selectedElement.hidden
                                    ? isAr
                                      ? 'إظهار الطبقة'
                                      : 'Show layer'
                                    : isAr
                                      ? 'إخفاء الطبقة'
                                      : 'Hide layer'
                                }
                              >
                                {selectedElement.hidden ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
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
                              {selectedElementIds.length >= 2 ? (
                                <button
                                  type="button"
                                  onClick={handleGroupSelected}
                                  className="p-1 rounded text-slate-600 hover:bg-slate-100"
                                  title={isAr ? 'تجميع' : 'Group'}
                                >
                                  <Group className="w-3.5 h-3.5" style={{ color: 'var(--accent, #1d8b94)' }} />
                                </button>
                              ) : null}
                              {selectedElement.groupId ? (
                                <button
                                  type="button"
                                  onClick={handleUngroupSelected}
                                  className="p-1 rounded text-slate-600 hover:bg-slate-100"
                                  title={isAr ? 'فك التجميع' : 'Ungroup'}
                                >
                                  <Ungroup className="w-3.5 h-3.5" style={{ color: 'var(--accent, #1d8b94)' }} />
                                </button>
                              ) : null}
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
                                {resizeHandle(
                                  'e',
                                  { left: '100%', top: '50%' },
                                  'ew-resize',
                                  startElementResize,
                                  true,
                                )}
                                {resizeHandle(
                                  's',
                                  { left: '50%', top: '100%' },
                                  'ns-resize',
                                  startElementResize,
                                  true,
                                )}
                                {resizeHandle('w', { left: 0, top: '50%' }, 'ew-resize', startElementResize, true)}
                              </>
                            )}
                          </div>
                        )}

                        {productSelectionRect && (
                          <div
                            key="sel-product"
                            className="cs-selection-box absolute"
                            style={rectToPercentStyle(productSelectionRect, canvasW, canvasH)}
                          >
                            <div className="cs-selection-toolbar absolute left-1/2 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-700 whitespace-nowrap">
                              {isAr
                                ? 'صورة المنتج · اسحب الزاوية لتكبير'
                                : 'Product · drag corner to resize'}
                            </div>
                            {resizeHandle('se', { left: '100%', top: '100%' }, 'nwse-resize', (_, e) =>
                              startProductResize(e),
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`cs-page-inactive-frame cs-canvas-frame relative overflow-hidden flex items-center justify-center select-none w-full max-w-full border-0 p-0 cursor-pointer${
                          pageHidden ? ' cs-page-hidden' : ''
                        }${pageLocked ? ' cs-page-locked' : ''}`}
                        style={{
                          ...canvasFrameBoxStyle(canvasW, canvasH),
                          opacity: pageHidden ? 0.35 : 0.92,
                        }}
                        onClick={() => handleSelectPage(page.id)}
                        title={isAr ? 'انقر لفتح الصفحة' : 'Click to edit page'}
                        aria-label={isAr ? `فتح ${pageLabel}` : `Open ${pageLabel}`}
                      >
                        <span className="cs-page-inactive-hint pointer-events-none px-3 py-1.5 rounded-lg text-[11px] font-bold">
                          {pageLocked ? (isAr ? 'مقفل · ' : 'Locked · ') : ''}
                          {isAr ? 'انقر للتعديل' : 'Click to edit'}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="cs-footer cs-glass pt-2 mt-2 border-t border-slate-200 text-xs">
              <div className="cs-footer-meta flex items-center gap-2 font-bold min-w-0" style={{ color: 'var(--cs-text, #f8fafc)' }}>
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--accent, #1d8b94)' }} />
                <span className="truncate">
                  {isAr ? 'استوديو التصميم' : 'Design Studio'} • {canvasW}×{canvasH} px
                </span>
              </div>
              <div className="cs-footer-actions relative flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    openPositionPanel('layers');
                    setShowAddLayerMenu(true);
                  }}
                  className="cs-add-layer-btn px-3 py-1.5 rounded-xl text-[12px] font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title={isAr ? 'إضافة طبقة' : 'Add layer'}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="cs-footer-add-label">{isAr ? 'إضافة طبقة' : 'Add layer'}</span>
                </button>
              </div>
              <div className="cs-footer-zoom flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewZoom((z) => Math.max(0.3, Math.round((z - 0.1) * 100) / 100))}
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
                  onClick={() => setViewZoom(DEFAULT_VIEW_ZOOM)}
                  className="px-1.5 py-0.5 text-[10px] font-bold hover:bg-slate-100 rounded text-slate-600"
                >
                  {isAr ? 'ملاءمة' : 'Fit'}
                </button>
              </div>
              {productHeroSelected && (
                <div className="cs-footer-product flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-0.5 shrink-0">
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{isAr ? 'حجم المنتج' : 'Product size'}</span>
                  <input
                    type="range"
                    min={18}
                    max={120}
                    value={productScale}
                    onChange={(e) => setProductScale(Number(e.target.value))}
                    className="w-20 sm:w-24 accent-[var(--cs-accent,#1d8b94)]"
                  />
                  <span className="text-[10px] font-mono text-slate-700 w-8">{productScale}%</span>
                </div>
              )}
              <div className="cs-footer-formats flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload('png')}
                  className="hover:text-slate-900 cursor-pointer font-bold"
                >
                  PNG
                </button>
                <span aria-hidden>•</span>
                <button
                  type="button"
                  onClick={() => handleDownload('jpg')}
                  className="hover:text-slate-900 cursor-pointer font-bold"
                >
                  JPG
                </button>
                <span aria-hidden>•</span>
                <button
                  type="button"
                  onClick={() => handleDownload('webp')}
                  className="hover:text-slate-900 cursor-pointer font-bold text-emerald-700"
                >
                  WebP
                </button>
                <span aria-hidden>•</span>
                <button
                  type="button"
                  disabled={isExportingMotion}
                  onClick={() => void handleExportGif()}
                  className="hover:text-slate-900 cursor-pointer font-bold disabled:opacity-50"
                >
                  GIF
                </button>
                <span aria-hidden>•</span>
                <button
                  type="button"
                  disabled={isExportingMotion}
                  onClick={() => void handleExportMp4()}
                  className="hover:text-slate-900 cursor-pointer font-bold disabled:opacity-50"
                  style={{ color: 'var(--accent, #1d8b94)' }}
                >
                  MP4
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
            : 'Exclusive special offer from our store! ✨ Express shipping across Saudi Arabia. Order now!\n\n#SaudiMade #SaudiShop #Deals'
        }
        onOpenSocialHub={onOpenSocialHub}
      />
  );

  const ctxMenuNode =
    ctxMenu != null ? (
      <CanvaContextMenu
        isAr={isAr}
        menu={ctxMenu}
        locked={Boolean(
          elements.find((el) => el.id === (ctxMenu.elementId || selectedElementId))?.locked,
        )}
        hasClipboard={
          elementClipboardRef.current.length > 0 || styleClipboardRef.current != null
        }
        hasSelection={Boolean(selectedElementId || selectedElementIds.length)}
        canGroup={selectedElementIds.length >= 2}
        canUngroup={elements.some(
          (el) =>
            el.groupId &&
            (el.id === selectedElementId || selectedElementIds.includes(el.id)),
        )}
        onClose={() => setCtxMenu(null)}
        onCopy={handleCopySelected}
        onCopyStyle={handleCopyStyleSelected}
        onPaste={() => void handlePasteLive()}
        onDuplicate={handleDuplicateSelected}
        onDelete={handleDeleteSelected}
        onToggleLock={handleToggleLockSelected}
        onGroup={handleGroupSelected}
        onUngroup={handleUngroupSelected}
        onLayer={(action) => {
          if (action === 'forward') bringElementForward();
          else if (action === 'backward') sendElementBackward();
          else if (action === 'front') bringElementToFront();
          else sendElementToBack();
        }}
        onAlign={alignSelectedToPage}
      />
    ) : null;
  // Keep clipboardTick referenced so paste enablement re-renders after copy
  void clipboardTick;

  if (isPage) {
    return (
      <div className="canva-studio-shell relative flex w-full max-w-full min-w-0 h-[calc(100dvh-4.5rem)] min-h-[520px] font-sans overflow-visible">
        {studioPanel}
        {socialModal}
        {ctxMenuNode}
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
      {ctxMenuNode}
    </GlobalModal>
  );
};
