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

export interface CanvaImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAsset?: MediaAsset | null;
  onSaveNewAsset: (dataUrl: string, title: string, width: number, height: number) => void;
  onReplaceAsset?: (assetId: string, dataUrl: string, width: number, height: number) => void;
}

// Draggable element on canvas
export interface CanvasElement {
  id: string;
  type: 'headline' | 'subtitle' | 'price' | 'badge' | 'custom_text' | 'sticker' | 'watermark';
  text: string;
  x: number; // 0 to 900
  y: number; // 0 to 900
  fontSize: number;
  fontColor: string;
  bgColor?: string;
  bgPadding?: number;
  borderRadius?: number;
  isBold?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  badgeStyle?: 'pill' | 'solid' | 'gold_glow' | 'emerald_glow' | 'outline';
  icon?: string;
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
  { id: 'ksa-emerald', labelEn: 'Saudi Royal Emerald', labelAr: 'زمردي ملكي سعودي', css: 'linear-gradient(135deg, #022c22, #059669)', hex1: '#022c22', hex2: '#059669' },
  { id: 'royal-gold', labelEn: 'Riyadh Luxury Gold', labelAr: 'ذهبي الرياض الفاخر', css: 'linear-gradient(135deg, #1c1917, #b45309)', hex1: '#1c1917', hex2: '#b45309' },
  { id: 'desert-sand', labelEn: 'AlUla Desert Warm', labelAr: 'رمال العلا الدافئة', css: 'linear-gradient(135deg, #451a03, #d97706)', hex1: '#451a03', hex2: '#d97706' },
  { id: 'obsidian', labelEn: 'Midnight Studio', labelAr: 'استوديو ليلي داكن', css: 'linear-gradient(135deg, #090d16, #1e293b)', hex1: '#090d16', hex2: '#1e293b' },
  { id: 'pure-white', labelEn: 'Pure Clean White', labelAr: 'أبيض ناصع للتجارة', css: '#ffffff', hex1: '#ffffff', hex2: '#f8fafc' },
  { id: 'velvet-rose', labelEn: 'Velvet Crimson', labelAr: 'وردي مخملي أنيق', css: 'linear-gradient(135deg, #4c0519, #e11d48)', hex1: '#4c0519', hex2: '#e11d48' },
  { id: 'ocean-blue', labelEn: 'Red Sea Deep Blue', labelAr: 'أزرق البحر الأحمر', css: 'linear-gradient(135deg, #082f49, #0284c7)', hex1: '#082f49', hex2: '#0284c7' },
];

const PRESET_BADGES = [
  { textEn: '50% OFF', textAr: 'خصم 50%', color: '#e11d48', style: 'pill' as const },
  { textEn: '30% OFF', textAr: 'خصم 30%', color: '#ea580c', style: 'pill' as const },
  { textEn: 'BEST SELLER', textAr: 'الأكثر مبيعاً', color: '#b45309', style: 'gold_glow' as const },
  { textEn: 'SAUDI MADE', textAr: 'صنع في السعودية', color: '#059669', style: 'emerald_glow' as const },
  { textEn: 'FREE DELIVERY', textAr: 'توصيل مجاني', color: '#2563eb', style: 'pill' as const },
  { textEn: '100% ORIGINAL', textAr: 'أصلي 100%', color: '#7c3aed', style: 'gold_glow' as const },
  { textEn: 'LIMITED EDITION', textAr: 'إصدار محدود', color: '#be123c', style: 'solid' as const },
  { textEn: 'NEW ARRIVAL', textAr: 'وصل حديثاً', color: '#0d9488', style: 'pill' as const },
];

const QUICK_KSA_TEXTS = [
  { textEn: 'Saudi National Day Special Offer', textAr: 'عرض خاص بمناسبة اليوم الوطني السعودي' },
  { textEn: 'Express Same-Day Delivery Across KSA', textAr: 'توصيل سريع بنفس اليوم لكافة مدن المملكة' },
  { textEn: 'Premium Specialty Blend — 100% Arabica', textAr: 'مزيج القهوة المختصة الفاخر — أرابيكا 100%' },
  { textEn: 'Exclusive Limited-Time Discount', textAr: 'خصم حصري لفترة محدودة حتى نفاد الكمية' },
  { textEn: 'Official 2-Year Golden Warranty', textAr: 'ضمان ذهبي رسمي لمدة سنتين شامل' },
];

export const CanvaImageStudioModal: React.FC<CanvaImageStudioModalProps> = ({
  isOpen,
  onClose,
  initialAsset,
  onSaveNewAsset,
  onReplaceAsset,
}) => {
  const { activeStore, currentProducts, currentMedia } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Loaded Product/Subject Image
  const [activeImageUrl, setActiveImageUrl] = useState<string>('');
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<'media' | 'text' | 'elements' | 'bg_remove' | 'colors' | 'filters' | 'ai_poster'>('media');

  // Quota & Timer State (Strict Morning 5 / Evening 5 = 10 Free daily)
  const [quota, setQuota] = useState<StudioQuotaState>(() => getStudioQuota(activeStore.id));
  const [slotCountdownText, setSlotCountdownText] = useState<string>('');

  // Backdrop & Lighting Adjustments
  const [selectedBackdrop, setSelectedBackdrop] = useState<string>('original');
  const [customSolidColor, setCustomSolidColor] = useState<string>(activeStore.accentColor || '#059669');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blurAmount, setBlurAmount] = useState(0);

  // Background Removal
  const [bgRemoved, setBgRemoved] = useState(false);
  const [bgTolerance, setBgTolerance] = useState(38);
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Product Image Transform
  const [productPosX, setProductPosX] = useState(450);
  const [productPosY, setProductPosY] = useState(450);
  const [productScale, setProductScale] = useState(88);

  // Interactive Elements List (Headlines, Subtitles, Price Tags, Stickers, etc.)
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Drag and Drop Mouse Tracking
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingProduct, setIsDraggingProduct] = useState(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<StudioHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryActionRef = useRef(false);

  // AI Poster Form State
  const [aiProductTitle, setAiProductTitle] = useState('');
  const [aiOfferTag, setAiOfferTag] = useState(isAr ? 'خصم خاص 40%' : 'SPECIAL 40% OFF');
  const [aiPriceSar, setAiPriceSar] = useState('189');
  const [aiSubtitle, setAiSubtitle] = useState(isAr ? 'توصيل مجاني لجميع مناطق المملكة' : 'Free Express Delivery Across KSA');
  const [aiTheme, setAiTheme] = useState('ksa-emerald');

  // Helper: Get best initial candidate URL
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

  // Load Image with Multiple Bulletproof Fallbacks
  const loadStudioImage = useCallback((candidateUrl: string) => {
    if (!candidateUrl) {
      setLoadedImg(null);
      return;
    }
    setImageLoading(true);
    setActiveImageUrl(candidateUrl);

    // List of alternate path variations to guarantee image loading
    const fallbackUrls: string[] = [candidateUrl];
    if (candidateUrl.startsWith('/src/assets/images/')) {
      const fileName = candidateUrl.replace('/src/assets/images/', '');
      fallbackUrls.push(`/images/${fileName}`);
      fallbackUrls.push(`/${fileName}`);
    } else if (candidateUrl.startsWith('/images/')) {
      const fileName = candidateUrl.replace('/images/', '');
      fallbackUrls.push(`/src/assets/images/${fileName}`);
      fallbackUrls.push(`/${fileName}`);
    }

    let currentAttempt = 0;

    const tryNext = () => {
      if (currentAttempt >= fallbackUrls.length) {
        setImageLoading(false);
        return;
      }
      const urlToTry = fallbackUrls[currentAttempt];
      currentAttempt++;

      // Try image load
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLoadedImg(img);
        setImageLoading(false);
      };
      img.onerror = () => {
        // Fallback without crossOrigin if CORS blocks
        const fallbackNoCors = new Image();
        fallbackNoCors.onload = () => {
          setLoadedImg(fallbackNoCors);
          setImageLoading(false);
        };
        fallbackNoCors.onerror = () => {
          tryNext();
        };
        fallbackNoCors.src = urlToTry;
      };
      img.src = urlToTry;
    };

    tryNext();
  }, []);

  // Initialize Elements & Image on Open
  useEffect(() => {
    if (!isOpen) return;

    // Refresh quota on modal open
    setQuota(getStudioQuota(activeStore.id));

    // Reset visual state
    setSelectedBackdrop('original');
    setBgRemoved(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlurAmount(0);
    setProductPosX(450);
    setProductPosY(450);
    setProductScale(88);

    const initialUrl = resolveCandidateUrl(initialAsset);
    loadStudioImage(initialUrl);

    // Initialize Default Draggable Elements
    const storeBrand = isAr
      ? (activeStore.nameAr || activeStore.name)
      : (activeStore.nameEn || activeStore.name);

    const titleText = initialAsset?.title || currentProducts[0]?.name || activeStore.name;

    const defaultElements: CanvasElement[] = [
      {
        id: 'store-watermark',
        type: 'watermark',
        text: storeBrand,
        x: 45,
        y: 45,
        fontSize: 20,
        fontColor: '#ffffff',
        bgColor: 'rgba(15, 23, 42, 0.75)',
        bgPadding: 16,
        borderRadius: 24,
        isBold: true,
        textAlign: 'left',
      },
      {
        id: 'promo-badge',
        type: 'badge',
        text: isAr ? 'خصم 30%' : '30% OFF',
        x: 720,
        y: 45,
        fontSize: 22,
        fontColor: '#ffffff',
        bgColor: '#e11d48',
        bgPadding: 16,
        borderRadius: 28,
        isBold: true,
        badgeStyle: 'pill',
        textAlign: 'center',
      },
      {
        id: 'headline-text',
        type: 'headline',
        text: titleText,
        x: 450,
        y: 810,
        fontSize: 32,
        fontColor: '#ffffff',
        bgColor: 'rgba(15, 23, 42, 0.85)',
        bgPadding: 20,
        borderRadius: 20,
        isBold: true,
        textAlign: 'center',
      },
    ];

    setElements(defaultElements);
    setSelectedElementId(null);

    // Initial Snapshot
    const initialSnapshot: StudioHistorySnapshot = {
      elements: defaultElements,
      productPos: { x: 450, y: 450, scale: 88 },
      selectedBackdrop: 'original',
      customSolidColor: activeStore.accentColor || '#059669',
      bgRemoved: false,
      bgTolerance: 38,
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
    };
    setHistory([initialSnapshot]);
    setHistoryIndex(0);
  }, [isOpen, initialAsset?.id, activeStore.id, resolveCandidateUrl, loadStudioImage]);

  // Live Slot Countdown Ticker
  useEffect(() => {
    if (!isOpen) return;
    const updateCountdown = () => {
      const q = getStudioQuota(activeStore.id);
      setQuota(q);

      if (q.isPro) {
        setSlotCountdownText('');
        return;
      }

      if (q.cooldownUntil && q.cooldownUntil > Date.now()) {
        const diff = q.cooldownUntil - Date.now();
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setSlotCountdownText(`${hrs}h ${mins}m ${secs}s`);
      } else {
        setSlotCountdownText('');
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [isOpen, activeStore.id]);

  // Push History State (Debounced or on Mouse Up)
  const pushHistorySnapshot = useCallback(() => {
    if (isHistoryActionRef.current) return;
    const currentSnapshot: StudioHistorySnapshot = {
      elements: JSON.parse(JSON.stringify(elements)),
      productPos: { x: productPosX, y: productPosY, scale: productScale },
      selectedBackdrop,
      customSolidColor,
      bgRemoved,
      bgTolerance,
      filters: { brightness, contrast, saturation, blur: blurAmount },
    };

    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, currentSnapshot].slice(-25); // keep last 25
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 24));
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
    const snapshot = history[nextIdx];
    if (snapshot) {
      setElements(JSON.parse(JSON.stringify(snapshot.elements)));
      setProductPosX(snapshot.productPos.x);
      setProductPosY(snapshot.productPos.y);
      setProductScale(snapshot.productPos.scale);
      setSelectedBackdrop(snapshot.selectedBackdrop);
      setCustomSolidColor(snapshot.customSolidColor);
      setBgRemoved(snapshot.bgRemoved);
      setBgTolerance(snapshot.bgTolerance);
      setBrightness(snapshot.filters.brightness);
      setContrast(snapshot.filters.contrast);
      setSaturation(snapshot.filters.saturation);
      setBlurAmount(snapshot.filters.blur);
      setHistoryIndex(nextIdx);
    }
    setTimeout(() => {
      isHistoryActionRef.current = false;
    }, 50);
  };

  // Redo Handler
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    isHistoryActionRef.current = true;
    const nextIdx = historyIndex + 1;
    const snapshot = history[nextIdx];
    if (snapshot) {
      setElements(JSON.parse(JSON.stringify(snapshot.elements)));
      setProductPosX(snapshot.productPos.x);
      setProductPosY(snapshot.productPos.y);
      setProductScale(snapshot.productPos.scale);
      setSelectedBackdrop(snapshot.selectedBackdrop);
      setCustomSolidColor(snapshot.customSolidColor);
      setBgRemoved(snapshot.bgRemoved);
      setBgTolerance(snapshot.bgTolerance);
      setBrightness(snapshot.filters.brightness);
      setContrast(snapshot.filters.contrast);
      setSaturation(snapshot.filters.saturation);
      setBlurAmount(snapshot.filters.blur);
      setHistoryIndex(nextIdx);
    }
    setTimeout(() => {
      isHistoryActionRef.current = false;
    }, 50);
  };

  // Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, historyIndex, history]);

  // Main Canvas Render
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 900;
    const H = 900;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    // 1. Draw Selected Backdrop Preset / Solid Color
    const preset = STUDIO_BACKDROPS.find((b) => b.id === selectedBackdrop);
    if (selectedBackdrop === 'custom') {
      ctx.fillStyle = customSolidColor;
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

      // Subtle luxury radial light
      const radial = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.65);
      radial.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Draw Product Subject Image (with Filters & Optional AI Isolation)
    if (loadedImg && loadedImg.width > 0 && loadedImg.height > 0) {
      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${
        blurAmount > 0 ? ` blur(${blurAmount}px)` : ''
      }`;

      const scaleFactor = (productScale / 100) * Math.min(W / loadedImg.width, H / loadedImg.height);
      const drawW = Math.round(loadedImg.width * scaleFactor);
      const drawH = Math.round(loadedImg.height * scaleFactor);
      const drawX = Math.round(productPosX - drawW / 2);
      const drawY = Math.round(productPosY - drawH / 2);

      if (bgRemoved) {
        // Smart AI Chroma Matting
        const off = document.createElement('canvas');
        off.width = drawW;
        off.height = drawH;
        const offCtx = off.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(loadedImg, 0, 0, drawW, drawH);
          try {
            const imgData = offCtx.getImageData(0, 0, drawW, drawH);
            const d = imgData.data;
            const r0 = d[0], g0 = d[1], b0 = d[2];
            const tol = bgTolerance * 1.8;
            for (let i = 0; i < d.length; i += 4) {
              const dr = Math.abs(d[i] - r0);
              const dg = Math.abs(d[i + 1] - g0);
              const db = Math.abs(d[i + 2] - b0);
              const dist = (dr + dg + db) / 3;
              const isNearWhite = d[i] > 238 && d[i + 1] > 238 && d[i + 2] > 238;
              if (dist < tol || isNearWhite) {
                d[i + 3] = 0;
              }
            }
            offCtx.putImageData(imgData, 0, 0);
            ctx.drawImage(off, drawX, drawY);
          } catch {
            // Smooth rounded frame fallback if CORS tainted
            ctx.beginPath();
            ctx.arc(W / 2, H / 2, Math.min(drawW, drawH) * 0.46, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);
          }
        }
      } else {
        ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);
      }
      ctx.restore();
    }

    // 3. Draw All Interactive Draggable Elements
    elements.forEach((el) => {
      if (!el.text.trim()) return;

      ctx.save();
      ctx.font = `${el.isBold ? '900' : '600'} ${el.fontSize}px sans-serif`;
      ctx.textAlign = el.textAlign || 'center';
      ctx.textBaseline = 'middle';

      const metrics = ctx.measureText(el.text);
      const textWidth = metrics.width;
      const pad = el.bgPadding ?? 14;
      const boxW = textWidth + pad * 2.4;
      const boxH = el.fontSize * 1.6 + pad;
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

        // Optional Luxury Glow Border for Gold or Emerald badges
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

      // Draw Element Text
      ctx.fillStyle = el.fontColor || '#ffffff';
      ctx.fillText(el.text, el.x, el.y);
      ctx.restore();
    });
  }, [
    selectedBackdrop,
    customSolidColor,
    loadedImg,
    brightness,
    contrast,
    saturation,
    blurAmount,
    productPosX,
    productPosY,
    productScale,
    bgRemoved,
    bgTolerance,
    elements,
  ]);

  // Re-render canvas whenever visual dependencies update
  useEffect(() => {
    if (isOpen) {
      renderCanvas();
    }
  }, [isOpen, renderCanvas]);

  // 1-Click AI Background Removal (Consumes 1 daily slot credit)
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
        isAr
          ? 'تم عزل خلفية المنتج بنجاح باستخدام الذكاء الاصطناعي!'
          : 'Product background isolated successfully with AI!',
        'success',
      );
    }, 550);
  };

  // Quick Add Text Element
  const handleAddTextElement = (type: CanvasElement['type'], defaultText: string) => {
    const newEl: CanvasElement = {
      id: `el-${Date.now()}`,
      type,
      text: defaultText,
      x: 450,
      y: 450 + (elements.length % 5) * 35,
      fontSize: type === 'headline' ? 34 : type === 'price' ? 28 : 22,
      fontColor: '#ffffff',
      bgColor: type === 'price' ? '#059669' : type === 'badge' ? '#e11d48' : 'rgba(15, 23, 42, 0.85)',
      bgPadding: 16,
      borderRadius: 20,
      isBold: true,
      textAlign: 'center',
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
    pushHistorySnapshot();
    toast(
      isAr ? 'تمت إضافة النص إلى التصميم. يمكنك سحبه بأي مكان!' : 'Text added! Drag with mouse anywhere on canvas.',
      'info',
    );
  };

  // Quick Add Badge Element
  const handleAddBadgeElement = (text: string, color: string, badgeStyle: CanvasElement['badgeStyle']) => {
    const newBadge: CanvasElement = {
      id: `badge-${Date.now()}`,
      type: 'badge',
      text,
      x: 450,
      y: 220 + (elements.length % 4) * 45,
      fontSize: 22,
      fontColor: '#ffffff',
      bgColor: color,
      bgPadding: 16,
      borderRadius: 28,
      isBold: true,
      badgeStyle,
      textAlign: 'center',
    };
    setElements((prev) => [...prev, newBadge]);
    setSelectedElementId(newBadge.id);
    pushHistorySnapshot();
    toast(isAr ? 'تمت إضافة الملصق إلى الكانفاس!' : 'Badge sticker added! Drag anywhere.', 'info');
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
      x: Math.min(target.x + 30, 850),
      y: Math.min(target.y + 30, 850),
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

  // Mouse & Touch Drag & Drop System
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = 900 / rect.width;
    const scaleY = 900 / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCanvasCoords(e);

    // Hit test elements in reverse order (top to bottom)
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const approxW = el.text.length * (el.fontSize * 0.6) + (el.bgPadding || 14) * 2;
      const approxH = el.fontSize * 1.8 + (el.bgPadding || 14);

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

      if (x >= minX - 10 && x <= maxX + 10 && y >= minY - 10 && y <= maxY + 10) {
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
      const nextX = Math.max(20, Math.min(880, x - dragOffset.x));
      const nextY = Math.max(20, Math.min(880, y - dragOffset.y));
      setElements((prev) =>
        prev.map((el) => (el.id === selectedElementId ? { ...el, x: nextX, y: nextY } : el)),
      );
    } else if (isDraggingProduct) {
      const nextX = Math.max(100, Math.min(800, x - dragOffset.x));
      const nextY = Math.max(100, Math.min(800, y - dragOffset.y));
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

  // Global window release to handle mouse release outside canvas
  useEffect(() => {
    if (!isDraggingElement && !isDraggingProduct) return;
    const handleGlobalUp = () => {
      setIsDraggingElement(false);
      setIsDraggingProduct(false);
      pushHistorySnapshot();
    };
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDraggingElement, isDraggingProduct, pushHistorySnapshot]);

  // Upload New Custom Image from Local Machine
  const handleUploadLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        loadStudioImage(dataUrl);
        toast(
          isAr ? 'تم تحميل صورتك بنجاح إلى استوديو التصميم!' : 'Your image uploaded successfully to Canva Studio!',
          'success',
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate AI Promotional Poster
  const handleGenerateAiPoster = (e: React.FormEvent) => {
    e.preventDefault();
    const res = consumeStudioAiCredit(activeStore.id);
    setQuota(res.state);

    if (!res.allowed) {
      toast(
        isAr
          ? `انتهت حصة الفترة الحالية. تفتح الحصة التالية بعد: ${slotCountdownText || 'قريباً'}!`
          : `Batch quota reached. Next 5 edits unlock in: ${slotCountdownText || 'soon'}!`,
        'error',
      );
      return;
    }

    setIsProcessingAi(true);
    setTimeout(() => {
      setSelectedBackdrop(aiTheme);
      setBgRemoved(true);

      const generatedElements: CanvasElement[] = [
        {
          id: 'store-watermark',
          type: 'watermark',
          text: activeStore.name,
          x: 45,
          y: 45,
          fontSize: 20,
          fontColor: '#ffffff',
          bgColor: 'rgba(15, 23, 42, 0.75)',
          bgPadding: 16,
          borderRadius: 24,
          isBold: true,
          textAlign: 'left',
        },
        {
          id: 'promo-badge',
          type: 'badge',
          text: aiOfferTag.trim() || (isAr ? 'خصم خاص' : 'SPECIAL OFFER'),
          x: 720,
          y: 45,
          fontSize: 22,
          fontColor: '#ffffff',
          bgColor: '#e11d48',
          bgPadding: 16,
          borderRadius: 28,
          isBold: true,
          badgeStyle: 'pill',
          textAlign: 'center',
        },
        {
          id: 'price-tag',
          type: 'price',
          text: `${aiPriceSar.trim()} SAR`,
          x: 720,
          y: 690,
          fontSize: 28,
          fontColor: '#ffffff',
          bgColor: '#059669',
          bgPadding: 18,
          borderRadius: 22,
          isBold: true,
          textAlign: 'center',
        },
        {
          id: 'headline-text',
          type: 'headline',
          text: aiProductTitle.trim() || currentProducts[0]?.name || activeStore.name,
          x: 450,
          y: 775,
          fontSize: 32,
          fontColor: '#ffffff',
          bgColor: 'rgba(15, 23, 42, 0.85)',
          bgPadding: 18,
          borderRadius: 20,
          isBold: true,
          textAlign: 'center',
        },
        {
          id: 'sub-text',
          type: 'subtitle',
          text: aiSubtitle.trim(),
          x: 450,
          y: 840,
          fontSize: 20,
          fontColor: '#cbd5e1',
          bgColor: 'rgba(15, 23, 42, 0.75)',
          bgPadding: 14,
          borderRadius: 16,
          isBold: false,
          textAlign: 'center',
        },
      ];

      setElements(generatedElements);
      setProductScale(78);
      setIsProcessingAi(false);
      pushHistorySnapshot();
      toast(
        isAr ? 'تم توليد وتطبيق بوستر إعلاني متكامل بالذكاء الاصطناعي!' : 'AI promotional poster generated and arranged!',
        'success',
      );
    }, 650);
  };

  // Request Pro Upgrade
  const handleRequestPro = () => {
    const next = requestStudioProUpgrade(activeStore.id, 199);
    setQuota(next);
    toast(
      isAr
        ? 'تم إرسال طلب ترقية باقة Pro (199 ر.س) إلى إدارة المنصة لفتح التعديل غير المحدود!'
        : 'Pro Upgrade request (199 SAR) sent to Master Admin for unlimited high-speed edits!',
      'success',
    );
  };

  // Export & Save to Media Library
  const handleSaveToMedia = (mode: 'new' | 'replace') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dataUrl = '';
    try {
      dataUrl = canvas.toDataURL('image/webp', 0.94);
    } catch {
      dataUrl = activeImageUrl;
    }
    if (!dataUrl) return;

    const mainTitle =
      elements.find((el) => el.type === 'headline')?.text ||
      (initialAsset ? `${initialAsset.title || initialAsset.fileName} (Canva Edit)` : `${activeStore.name} Studio Creative`);

    if (mode === 'replace' && initialAsset && onReplaceAsset) {
      onReplaceAsset(initialAsset.id, dataUrl, 900, 900);
      toast(isAr ? 'تم تحديث الصورة الحالية بنجاح!' : 'Current image updated successfully!', 'success');
    } else {
      onSaveNewAsset(dataUrl, mainTitle, 900, 900);
      toast(isAr ? 'تم حفظ التصميم الجديد في مكتبة الوسائط!' : 'Design saved to Media Library successfully!', 'success');
    }
    onClose();
  };

  // Direct Download to PC
  const handleDownloadDirect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `${activeStore.slug}-canva-creative-${Date.now()}.webp`;
    a.href = canvas.toDataURL('image/webp', 0.95);
    a.click();
    toast(isAr ? 'جاري تنزيل التصميم على جهازك...' : 'Downloading creative to your computer...', 'success');
  };

  if (!isOpen) return null;

  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const isLocked = !quota.isPro && Boolean(quota.cooldownUntil && quota.cooldownUntil > Date.now());

  // Filter Media List by Search
  const filteredMediaList = currentMedia.filter((m) => {
    if (m.fileType !== 'image') return false;
    if (!mediaSearchQuery.trim()) return true;
    const q = mediaSearchQuery.toLowerCase();
    return (
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.fileName && m.fileName.toLowerCase().includes(q)) ||
      (m.altText && m.altText.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-7xl h-[94vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col select-none"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── TOP MODERN STUDIO TOOLBAR ── */}
        <div
          className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          {/* Logo & Store Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-lg">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm sm:text-base">
                  {isAr ? 'استوديو كانفا الاحترافي (Canva Pro Studio)' : 'Canva Pro Media Studio & Creative Editor'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {activeStore.name}
                </span>
              </div>
              <p className="text-[11px] text-muted hidden sm:block">
                {isAr
                  ? 'سحب وإفلات النصوص، عزل الخلفية بالذكاء الاصطناعي، ملصقات وعروض فورية'
                  : 'Drag & Drop Typography, 1-Click AI BG Removal, KSA Badges, Undo/Redo & Direct Save'}
              </p>
            </div>
          </div>

          {/* Center: Undo / Redo Actions */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title={isAr ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
              className="p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            >
              <Undo2 className="w-4 h-4" />
              <span className="hidden md:inline">{isAr ? 'تراجع' : 'Undo'}</span>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title={isAr ? 'إعادة (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
              className="p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            >
              <Redo2 className="w-4 h-4" />
              <span className="hidden md:inline">{isAr ? 'إعادة' : 'Redo'}</span>
            </button>
          </div>

          {/* Right: Quota Batch Meter & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Free 10 Daily Allowance: 5 Morning + 5 Evening */}
            <div
              className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <Zap className={`w-4 h-4 ${quota.isPro ? 'text-amber-500' : 'text-emerald-500'}`} />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted">
                  {quota.currentSlot === 'morning' ? (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Sun className="w-3.5 h-3.5" />
                      <span>{isAr ? 'صباحاً:' : 'Morning:'}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-indigo-400">
                      <Moon className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مساءً:' : 'Evening:'}</span>
                    </span>
                  )}
                </span>
                <strong className="font-mono text-emerald-500">
                  {quota.slotUsed} / {quota.slotLimit}
                </strong>
                <span className="text-[10px] text-muted">
                  ({quota.usedToday}/{quota.dailyLimit} {isAr ? 'اليوم' : 'Today'})
                </span>
              </div>
              {quota.isPro && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 text-[10px] font-black">
                  PRO UNLIMITED
                </span>
              )}
            </div>

            {/* Lock / Slot Countdown */}
            {isLocked && slotCountdownText && (
              <div className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? `تفتح الحصة التالية بعد: ${slotCountdownText}`
                    : `Next 5 credits unlock in: ${slotCountdownText}`}
                </span>
              </div>
            )}

            {/* Pro Upgrade Button */}
            {!quota.isPro && (
              <button
                type="button"
                onClick={handleRequestPro}
                disabled={quota.proPendingApproval}
                className="px-3 py-1.5 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #d97706, #ea580c)' }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {quota.proPendingApproval
                    ? isAr
                      ? 'بانتظار موافقة الإدارة...'
                      : 'Pending Approval...'
                    : isAr
                    ? 'ترقية Pro (غير محدود)'
                    : 'Upgrade Pro (Unlimited)'}
                </span>
              </button>
            )}

            {/* Download Image Button */}
            <button
              type="button"
              onClick={handleDownloadDirect}
              className="p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              style={{ borderColor: 'var(--border)' }}
              title={isAr ? 'تنزيل على الجهاز' : 'Download to Computer'}
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              style={{ borderColor: 'var(--border)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── WORKSPACE BODY (Side Tools + Central Canvas) ── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
          {/* ── LEFT / START TOOLBAR TABS & CONTROLS (5 cols) ── */}
          <div
            className="lg:col-span-5 border-e flex flex-col overflow-hidden"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            {/* Horizontal Tool Tabs Strip */}
            <div
              className="flex items-center gap-1 p-2 border-b overflow-x-auto shrink-0"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              {[
                { id: 'media', label: isAr ? 'الصور والوسائط' : 'Media & Images', icon: ImageIcon },
                { id: 'text', label: isAr ? 'إضافة نصوص' : 'Typography', icon: Type },
                { id: 'elements', label: isAr ? 'الملصقات والشارات' : 'Badges & Stickers', icon: Award },
                { id: 'bg_remove', label: isAr ? 'عزل الخلفية' : 'AI Cutout', icon: Wand2 },
                { id: 'colors', label: isAr ? 'الخلفيات والألوان' : 'Backdrops', icon: Palette },
                { id: 'filters', label: isAr ? 'الفلاتر والإضاءة' : 'Filters', icon: Sliders },
                { id: 'ai_poster', label: isAr ? 'بوستر بالـ AI' : 'AI Poster', icon: Sparkles },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                      active
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/60 text-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT CONTAINER */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* ── TAB 1: MEDIA & IMAGES (Solves "Img show nhe ho rha side me") ── */}
              {activeTab === 'media' && (
                <div className="space-y-4">
                  {/* Upload from Local PC */}
                  <div
                    className="p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:border-emerald-500 hover:bg-emerald-500/5"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadLocalFile}
                    />
                    <Upload className="w-7 h-7 text-emerald-500 mb-2" />
                    <span className="text-xs font-black">
                      {isAr ? 'اضغط لرفع صورة من جهازك' : 'Upload Image from Computer'}
                    </span>
                    <span className="text-[11px] text-muted mt-0.5">
                      {isAr ? 'PNG, JPG, WebP حتى 10 ميجابايت' : 'PNG, JPG, WebP up to 10MB'}
                    </span>
                  </div>

                  {/* Search Media Library */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={mediaSearchQuery}
                      onChange={(e) => setMediaSearchQuery(e.target.value)}
                      placeholder={isAr ? 'ابحث في صور المتجر ومنتجاته...' : 'Search store images & products...'}
                      className="w-full ps-9 pe-3 py-2 rounded-xl border text-xs"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                  </div>

                  {/* Store Media Library Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-muted">
                      <span>
                        {isAr ? 'صور المتجر والمنتجات' : 'Store Catalog & Media Assets'} ({filteredMediaList.length})
                      </span>
                      <span className="text-[10px] text-emerald-500">
                        {isAr ? 'اضغط لتطبيق الصورة فوراً' : 'Click to load on canvas'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pe-1">
                      {filteredMediaList.map((asset) => {
                        const imgUrl = asset.thumbnailUrl || asset.webpUrl || asset.originalUrl;
                        const isCurrent = activeImageUrl === imgUrl || activeImageUrl === asset.originalUrl;
                        return (
                          <div
                            key={asset.id}
                            onClick={() => {
                              loadStudioImage(imgUrl);
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.type === 'headline'
                                    ? { ...el, text: asset.title || asset.fileName }
                                    : el,
                                ),
                              );
                              toast(
                                isAr ? 'تم تحميل الصورة على الكانفاس!' : 'Image loaded onto canvas!',
                                'info',
                              );
                            }}
                            className={`group relative aspect-square rounded-2xl border overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                              isCurrent ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
                            }`}
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                          >
                            <img
                              src={imgUrl}
                              alt={asset.fileName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = asset.originalUrl;
                              }}
                            />
                            {isCurrent && (
                              <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                                <span className="p-1 rounded-full bg-emerald-500 text-white shadow-xs">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 p-1 bg-black/70 text-[9px] text-white truncate text-center">
                              {asset.title || asset.fileName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: TYPOGRAPHY & TEXT ELEMENTS (Drag & Drop text on canvas) ── */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  {/* Quick Add Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddTextElement('headline', isAr ? 'عنوان عريض وجذاب' : 'Catchy Bold Headline')}
                      className="py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-500 hover:text-white transition-colors"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAr ? '+ عنوان رئيسي' : '+ Add Headline'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTextElement('subtitle', isAr ? 'وصف فرعي للمنتج' : 'Product Subtitle')}
                      className="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-500 hover:text-white transition-colors"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAr ? '+ نص فرعي' : '+ Add Subtitle'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTextElement('price', '199 SAR')}
                      className="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-500 hover:text-white transition-colors"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                    >
                      <Tag className="w-4 h-4" />
                      <span>{isAr ? '+ بطاقة سعر' : '+ Add Price Tag'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTextElement('custom_text', isAr ? 'نص مخصص' : 'Custom Text Box')}
                      className="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-500 hover:text-white transition-colors"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                    >
                      <Type className="w-4 h-4" />
                      <span>{isAr ? '+ نص حر' : '+ Custom Text'}</span>
                    </button>
                  </div>

                  {/* Selected Element Live Editor */}
                  {selectedElement ? (
                    <div className="p-4 rounded-2xl border space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black flex items-center gap-1 text-emerald-500">
                          <Move className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تعديل العنصر المحدد' : 'Edit Selected Element'}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleDuplicateSelected}
                            className="p-1.5 rounded-lg border hover:bg-slate-200 dark:hover:bg-slate-800"
                            title={isAr ? 'تكرار' : 'Duplicate'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteSelected}
                            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Text Input */}
                      <input
                        type="text"
                        value={selectedElement.text}
                        onChange={(e) => updateSelectedElement({ text: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                      />

                      {/* Font Size Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>{isAr ? 'حجم الخط' : 'Font Size'}</span>
                          <span className="font-mono">{selectedElement.fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={14}
                          max={72}
                          value={selectedElement.fontSize}
                          onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      {/* Color & Background Picker */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="flex items-center justify-between p-2 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                          <span className="text-[11px] font-bold">{isAr ? 'لون الخط' : 'Text Color'}</span>
                          <input
                            type="color"
                            value={selectedElement.fontColor}
                            onChange={(e) => updateSelectedElement({ fontColor: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer border-0"
                          />
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                          <span className="text-[11px] font-bold">{isAr ? 'لون الخلفية' : 'Box Fill'}</span>
                          <input
                            type="color"
                            value={selectedElement.bgColor?.startsWith('#') ? selectedElement.bgColor : '#0f172a'}
                            onChange={(e) => updateSelectedElement({ bgColor: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer border-0"
                          />
                        </div>
                      </div>

                      {/* Bold & Alignment */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => updateSelectedElement({ isBold: !selectedElement.isBold })}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                            selectedElement.isBold ? 'bg-emerald-600 text-white' : ''
                          }`}
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {isAr ? 'عريض (Bold)' : 'Bold'}
                        </button>
                        <div className="flex items-center gap-1">
                          {(['left', 'center', 'right'] as const).map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => updateSelectedElement({ textAlign: align })}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold capitalize ${
                                selectedElement.textAlign === align ? 'bg-emerald-600 text-white' : ''
                              }`}
                              style={{ borderColor: 'var(--border)' }}
                            >
                              {align}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl border text-center text-xs text-muted" style={{ borderColor: 'var(--border)' }}>
                      {isAr
                        ? '💡 اضغط على أي نص أو ملصق في الكانفاس لتحديده وتعديله أو سحبه بالماوس!'
                        : '💡 Click any text on the canvas to select, drag with mouse, or edit styling!'}
                    </div>
                  )}

                  {/* Saudi Commercial Templates */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-black block">
                      {isAr ? 'عبارات وعروض سعودية جاهزة' : 'Quick KSA Commercial Presets'}
                    </label>
                    <div className="space-y-1.5">
                      {QUICK_KSA_TEXTS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddTextElement('headline', isAr ? preset.textAr : preset.textEn)}
                          className="w-full p-2.5 rounded-xl border text-xs font-bold text-start flex items-center justify-between cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                        >
                          <span className="truncate">{isAr ? preset.textAr : preset.textEn}</span>
                          <Plus className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: ELEMENTS & STICKERS ── */}
              {activeTab === 'elements' && (
                <div className="space-y-3.5">
                  <span className="text-xs font-black block">
                    {isAr ? 'ملصقات وشارات الخصم والجودة' : 'Promotional Badges & KSA Seals'}
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {PRESET_BADGES.map((b, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddBadgeElement(isAr ? b.textAr : b.textEn, b.color, b.style)}
                        className="p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform hover:scale-105"
                        style={{
                          borderColor: b.color,
                          background: `${b.color}15`,
                          color: b.color,
                        }}
                      >
                        <Award className="w-4 h-4" />
                        <span>{isAr ? b.textAr : b.textEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 4: 1-CLICK AI BACKGROUND REMOVER ── */}
              {activeTab === 'bg_remove' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">
                        {isAr ? 'عزل المنتج الذكي بضغطة واحدة' : '1-Click Smart AI Product Cutout'}
                      </span>
                      {bgRemoved && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 text-[10px] font-bold">
                          {isAr ? 'تم العزل ✓' : 'Isolated ✓'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {isAr
                        ? 'يقوم الذكاء الاصطناعي بفصل المنتج عن خلفيته فوراً لإمكانية وضعه على خلفيات شفافة أو خلفيات فاخرة.'
                        : 'Instantly cuts out your product so you can place it seamlessly over luxury studio backgrounds.'}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleAiRemoveBg}
                        disabled={isProcessingAi || isLocked}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                      >
                        {isProcessingAi ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                        <span>
                          {isLocked
                            ? isAr
                              ? 'الحصة الحالية انتهت (مغلق مؤقتاً)'
                              : 'Batch Limit Reached (Locked)'
                            : isAr
                            ? 'إزالة الخلفية بالذكاء الاصطناعي'
                            : 'Isolate Background Now (1 Credit)'}
                        </span>
                      </button>

                      {bgRemoved && (
                        <button
                          type="button"
                          onClick={() => {
                            setBgRemoved(false);
                            setSelectedBackdrop('original');
                            pushHistorySnapshot();
                          }}
                          className="px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {isAr ? 'استعادة' : 'Reset'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Edge Tolerance */}
                  {bgRemoved && (
                    <div className="space-y-2 p-4 rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex justify-between text-xs font-bold">
                        <span>{isAr ? 'دقة عزل الحواف (Sensitivity)' : 'Edge Sensitivity (Tolerance)'}</span>
                        <span className="font-mono">{bgTolerance}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={80}
                        value={bgTolerance}
                        onChange={(e) => setBgTolerance(Number(e.target.value))}
                        onMouseUp={pushHistorySnapshot}
                        onTouchEnd={pushHistorySnapshot}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Product Scale */}
                  <div className="space-y-2 p-4 rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex justify-between text-xs font-bold">
                      <span>{isAr ? 'حجم المنتج داخل الإطار' : 'Product Scale inside Canvas'}</span>
                      <span className="font-mono">{productScale}%</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={140}
                      value={productScale}
                      onChange={(e) => setProductScale(Number(e.target.value))}
                      onMouseUp={pushHistorySnapshot}
                      onTouchEnd={pushHistorySnapshot}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* ── TAB 5: BACKDROPS & COLORS ── */}
              {activeTab === 'colors' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black block">
                      {isAr ? 'خلفيات الاستوديو الفاخرة' : 'Luxury Studio Gradients & Backdrops'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {STUDIO_BACKDROPS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedBackdrop(b.id);
                            pushHistorySnapshot();
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                            selectedBackdrop === b.id ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
                          }`}
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                        >
                          <span
                            className="w-5 h-5 rounded-lg border shrink-0"
                            style={{
                              background:
                                b.css === 'checker'
                                  ? 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 10px 10px'
                                  : b.css === 'transparent'
                                  ? '#64748b'
                                  : b.css,
                            }}
                          />
                          <span className="truncate">{isAr ? b.labelAr : b.labelEn}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Solid Color */}
                  <div className="p-3.5 rounded-2xl border flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xs font-bold">
                      {isAr ? 'لون خلفية مخصص (Hex)' : 'Custom Solid Backdrop'}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customSolidColor}
                        onChange={(e) => {
                          setCustomSolidColor(e.target.value);
                          setSelectedBackdrop('custom');
                        }}
                        onBlur={pushHistorySnapshot}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <span className="text-xs font-mono">{customSolidColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 6: FILTERS & LIGHTING ── */}
              {activeTab === 'filters' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border space-y-3.5" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isAr ? 'تعديل الإضاءة والألوان' : 'Color & Light Adjustments'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setBrightness(100);
                          setContrast(100);
                          setSaturation(100);
                          setBlurAmount(0);
                          pushHistorySnapshot();
                        }}
                        className="text-[11px] font-bold text-emerald-500 cursor-pointer"
                      >
                        {isAr ? 'إعادة ضبط' : 'Reset'}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span>{isAr ? 'السطوع (Brightness)' : 'Brightness'}</span>
                        <span className="font-mono">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={160}
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        onMouseUp={pushHistorySnapshot}
                        onTouchEnd={pushHistorySnapshot}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span>{isAr ? 'التباين (Contrast)' : 'Contrast'}</span>
                        <span className="font-mono">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={160}
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        onMouseUp={pushHistorySnapshot}
                        onTouchEnd={pushHistorySnapshot}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span>{isAr ? 'تشبع الألوان (Saturation)' : 'Saturation'}</span>
                        <span className="font-mono">{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={200}
                        value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        onMouseUp={pushHistorySnapshot}
                        onTouchEnd={pushHistorySnapshot}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 7: AI POSTER FORM ── */}
              {activeTab === 'ai_poster' && (
                <form onSubmit={handleGenerateAiPoster} className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                    <div className="font-black text-emerald-500 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>{isAr ? 'مولّد الإعلانات التلقائي' : 'Instant AI Creative Generator'}</span>
                    </div>
                    <p className="text-[11px] text-muted">
                      {isAr
                        ? 'املأ البيانات وسيقوم الذكاء الاصطناعي بتوليد بوستر إعلاني سعودي متكامل مع ترتيب العناصر تلقائياً.'
                        : 'Auto-compose a ready-to-post Saudi marketing creative with optimal element placement.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold block">{isAr ? 'اسم المنتج أو العنوان' : 'Campaign Title'}</label>
                    <input
                      type="text"
                      required
                      value={aiProductTitle}
                      onChange={(e) => setAiProductTitle(e.target.value)}
                      placeholder={currentProducts[0]?.name || activeStore.name}
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold block">{isAr ? 'شارة العرض' : 'Badge Text'}</label>
                      <input
                        type="text"
                        value={aiOfferTag}
                        onChange={(e) => setAiOfferTag(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border text-xs"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold block">{isAr ? 'السعر (ر.س)' : 'Price (SAR)'}</label>
                      <input
                        type="text"
                        value={aiPriceSar}
                        onChange={(e) => setAiPriceSar(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold block">{isAr ? 'النص التوضيحي' : 'Subtitle'}</label>
                    <input
                      type="text"
                      value={aiSubtitle}
                      onChange={(e) => setAiSubtitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessingAi || isLocked}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isLocked
                        ? isAr
                          ? 'الحصة الحالية انتهت'
                          : 'Batch Quota Reached'
                        : isAr
                        ? 'توليد البوستر بالذكاء الاصطناعي (1 نقطة)'
                        : 'Generate AI Creative (1 Credit)'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ── RIGHT / END INTERACTIVE CANVASES WORKSPACE (7 cols) ── */}
          <div className="lg:col-span-7 flex flex-col justify-between p-3 sm:p-5 bg-slate-950/60 overflow-hidden">
            {/* Canvas Container */}
            <div
              ref={containerRef}
              className="flex-1 flex items-center justify-center min-h-[350px] overflow-hidden"
            >
              <div
                className="relative w-full max-w-[500px] aspect-square rounded-3xl border shadow-2xl overflow-hidden flex items-center justify-center cursor-crosshair select-none"
                style={{
                  borderColor: 'var(--border)',
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
                {/* Real Canvas element */}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Loading Spinner */}
                {imageLoading && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                    <RefreshCw className="w-7 h-7 text-emerald-500 animate-spin" />
                    <span className="text-xs font-bold">
                      {isAr ? 'جاري تحميل الصورة في الاستوديو...' : 'Loading image into Studio...'}
                    </span>
                  </div>
                )}

                {/* Active Element Selection Box Guide */}
                {selectedElement && (
                  <div
                    className="absolute pointer-events-none border-2 border-emerald-400 border-dashed rounded-xl"
                    style={{
                      left: `${(selectedElement.x / 900) * 100}%`,
                      top: `${(selectedElement.y / 900) * 100}%`,
                      transform:
                        selectedElement.textAlign === 'center'
                          ? 'translate(-50%, -50%)'
                          : selectedElement.textAlign === 'right'
                          ? 'translate(-100%, -50%)'
                          : 'translate(0, -50%)',
                      width: `${Math.max(120, selectedElement.text.length * (selectedElement.fontSize * 0.72) * (100 / 900))}%`,
                      height: `${(selectedElement.fontSize * 2.2 * 100) / 900}%`,
                    }}
                  >
                    <span className="absolute -top-3 start-2 px-1.5 py-0.5 rounded-md bg-emerald-500 text-[9px] font-black text-white shadow-xs">
                      {isAr ? 'اسحب بالماوس ✥' : 'Drag ✥'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Status & Save Action Bar */}
            <div
              className="pt-3 mt-3 border-t flex flex-wrap items-center justify-between gap-3 shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="text-[11px] text-muted flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>
                  {isAr
                    ? `استوديو حصري لـ ${activeStore.name} • 900×900 WebP فائق الدقة`
                    : `Isolated Studio for ${activeStore.name} • 900×900 Ultra HD WebP`}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {initialAsset && onReplaceAsset && (
                  <button
                    type="button"
                    onClick={() => handleSaveToMedia('replace')}
                    className="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 text-white"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isAr ? 'تحديث واستبدال الصورة' : 'Replace Current Media'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveToMedia('new')}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                >
                  <Save className="w-4 h-4" />
                  <span>{isAr ? 'حفظ في مكتبة الوسائط' : 'Save to Media Library'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
