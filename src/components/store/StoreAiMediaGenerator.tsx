import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Loader2,
  Send,
  FolderPlus,
  AlertCircle,
  RefreshCw,
  Wand2,
  Settings2,
  PenLine,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Palette,
  Upload,
  Trash2,
  Save,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { CanvaSocialPostModal } from './CanvaSocialPostModal';
import { ApiRequestError } from '../../api/client';
import {
  AI_CAMPAIGNS,
  AI_LOGO_POSITIONS,
  AI_OUTPUT_TEMPLATES,
  AI_PERSONAS,
  previewBrandLockedPrompt,
  type AiBrandPersona,
  type AiBrandProfile,
  type AiCampaignPreset,
  type AiLogoPosition,
  type AiOutputTemplate,
} from '../../services/aiBrandIdentity';
import {
  DEFAULT_AI_MODELS,
  enhanceAiMediaPrompt,
  fetchAiBrandProfile,
  fetchAiMediaQuota,
  generateAiMedia,
  saveAiBrandProfile,
  type AiMediaAspect,
  type AiMediaGenerated,
  type AiMediaImageSize,
  type AiMediaKind,
  type AiMediaModelOption,
  type AiMediaQuota,
  type AiMediaStyle,
} from '../../services/aiMediaGenerationService';

export interface StoreAiMediaGeneratorProps {
  onNavigateTab?: (tab: string) => void;
}

type PromptMode = 'manual' | 'auto';

const ASPECTS: { id: AiMediaAspect; labelEn: string; labelAr: string; hintEn: string; hintAr: string }[] = [
  { id: '1:1', labelEn: 'Square 1:1', labelAr: 'مربع ١:١', hintEn: 'Posts', hintAr: 'منشورات' },
  { id: '4:5', labelEn: 'Feed 4:5', labelAr: 'منشور ٤:٥', hintEn: 'Instagram', hintAr: 'إنستغرام' },
  { id: '3:4', labelEn: 'Portrait 3:4', labelAr: 'عمودي ٣:٤', hintEn: 'Catalog', hintAr: 'كتالوج' },
  { id: '9:16', labelEn: 'Reels 9:16', labelAr: 'مقطع ٩:١٦', hintEn: 'Stories', hintAr: 'قصص' },
  { id: '16:9', labelEn: 'Banner 16:9', labelAr: 'بانر ١٦:٩', hintEn: 'Hero', hintAr: 'واجهة' },
  { id: '4:3', labelEn: 'Landscape 4:3', labelAr: 'أفقي ٤:٣', hintEn: 'Web', hintAr: 'ويب' },
];

const STYLES: { id: AiMediaStyle; labelEn: string; labelAr: string }[] = [
  { id: 'default', labelEn: 'Auto style', labelAr: 'أسلوب تلقائي' },
  { id: 'studio', labelEn: 'Product studio', labelAr: 'استوديو منتجات' },
  { id: 'lifestyle', labelEn: 'Lifestyle', labelAr: 'أسلوب حياة' },
  { id: 'flat', labelEn: 'Flat illustration', labelAr: 'رسم مسطح' },
  { id: 'cinematic', labelEn: 'Cinematic', labelAr: 'سينمائي' },
  { id: 'minimal', labelEn: 'Minimal', labelAr: 'بسيط' },
];

const SIZES: { id: AiMediaImageSize; labelEn: string; labelAr: string }[] = [
  { id: '1K', labelEn: '1K · Standard', labelAr: '١ك · قياسي' },
  { id: '2K', labelEn: '2K · High', labelAr: '٢ك · عالي' },
  { id: '4K', labelEn: '4K · Pro only', labelAr: '٤ك · برو فقط' },
];

function friendlyAiCode(code: string | null | undefined, isAr: boolean): string | null {
  if (!code) return null;
  const map: Record<string, { en: string; ar: string }> = {
    provider_not_connected: {
      en: 'AI provider is not connected on the server.',
      ar: 'مزود الذكاء الاصطناعي غير متصل على الخادم.',
    },
    video_provider_not_connected: {
      en: 'Video generation is not connected yet.',
      ar: 'توليد الفيديو غير متصل بعد.',
    },
    provider_error: {
      en: 'AI provider rejected the request. Try another model or simplify the prompt.',
      ar: 'رفض مزود الذكاء الاصطناعي الطلب. جرّب نموذجاً آخر أو بسّط الوصف.',
    },
    empty_result: {
      en: 'No image was returned. Try a clearer prompt or another model.',
      ar: 'لم تُرجع أي صورة. جرّب وصفاً أوضح أو نموذجاً آخر.',
    },
    safety_blocked: {
      en: 'Prompt blocked by safety filters. Soften the wording and retry.',
      ar: 'حُظر الوصف بفلاتر الأمان. خفّف الصياغة ثم أعد المحاولة.',
    },
    image_quota_exhausted: {
      en: 'Monthly image quota exhausted for this store.',
      ar: 'انتهت الحصة الشهرية للصور لهذا المتجر.',
    },
    video_quota_exhausted: {
      en: 'Monthly video quota exhausted for this store.',
      ar: 'انتهت الحصة الشهرية للفيديو لهذا المتجر.',
    },
    decode_error: {
      en: 'Could not decode the generated image. Please retry.',
      ar: 'تعذر فك تشفير الصورة المولّدة. يرجى إعادة المحاولة.',
    },
    generate_failed: {
      en: 'Generation failed. Please try again.',
      ar: 'فشل التوليد. يرجى المحاولة مرة أخرى.',
    },
    provider_quota_exceeded: {
      en: 'Google AI free-tier image quota is 0 for this API key. Enable billing in Google AI Studio (or wait for daily reset), then retry.',
      ar: 'حصة الطبقة المجانية لتوليد الصور على مفتاح واجهة البرمجة = صفر. فعّل الفوترة في استوديو جوجل للذكاء الاصطناعي (أو انتظر إعادة التعيين اليومية) ثم أعد المحاولة.',
    },
  };
  const hit = map[code];
  return hit ? (isAr ? hit.ar : hit.en) : null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(file);
  });
}

export const StoreAiMediaGenerator: React.FC<StoreAiMediaGeneratorProps> = ({
  onNavigateTab,
}) => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const productInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<AiMediaKind>('image');
  const [promptMode, setPromptMode] = useState<PromptMode>('manual');
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState<AiMediaAspect>('1:1');
  const [model, setModel] = useState<string>('gemini-2.5-flash-image');
  const [imageSize, setImageSize] = useState<AiMediaImageSize>('1K');
  const [style, setStyle] = useState<AiMediaStyle>('default');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [autoEnhanceOnGenerate, setAutoEnhanceOnGenerate] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [showBrandSetup, setShowBrandSetup] = useState(true);
  const [models, setModels] = useState<AiMediaModelOption[]>(DEFAULT_AI_MODELS);
  const [quota, setQuota] = useState<AiMediaQuota | null>(null);
  const [brand, setBrand] = useState<AiBrandProfile | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [result, setResult] = useState<AiMediaGenerated | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // Brand-consistent controls
  const [brandLock, setBrandLock] = useState(true);
  const [persona, setPersona] = useState<AiBrandPersona>('modern');
  const [paletteText, setPaletteText] = useState('');
  const [campaign, setCampaign] = useState<AiCampaignPreset>('none');
  const [outputTemplate, setOutputTemplate] = useState<AiOutputTemplate | ''>('');
  const [logoOverlay, setLogoOverlay] = useState(false);
  const [logoPosition, setLogoPosition] = useState<AiLogoPosition>('bottom_end');
  const [logoUrl, setLogoUrl] = useState('');
  const [styleRefs, setStyleRefs] = useState<string[]>([]);
  const [productDataUrl, setProductDataUrl] = useState<string | null>(null);
  const [matchPerspective, setMatchPerspective] = useState(true);

  const loadAll = useCallback(async () => {
    if (!activeStore?.id) return;
    setLoadingQuota(true);
    try {
      const [q, b] = await Promise.all([
        fetchAiMediaQuota(activeStore.id),
        fetchAiBrandProfile(activeStore.id),
      ]);
      setQuota(q);
      if (q.models?.length) setModels(q.models);
      if (q.default_model) setModel((prev) => prev || q.default_model || prev);
      setBrand(b);
      setBrandLock(Boolean(b.brand_lock_default));
      setPersona(b.persona || 'modern');
      setPaletteText((b.palette_hex || []).join(', '));
      setLogoOverlay(Boolean(b.logo_overlay_enabled));
      setLogoPosition(b.logo_overlay_position || 'bottom_end');
      setLogoUrl(b.logo_url || '');
      setStyleRefs(b.style_reference_urls || []);
      setErrorCode(null);
      setErrorDetail(null);
    } catch {
      setQuota(null);
      setBrand(null);
      setErrorCode('quota_load_failed');
      toast(
        isAr ? 'تعذر تحميل حصة وهوية العلامة لهذا المتجر.' : 'Could not load AI quota / brand identity for this store.',
        'error',
      );
    } finally {
      setLoadingQuota(false);
    }
  }, [activeStore?.id, isAr, toast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (imageSize === '4K' && !String(model).includes('pro')) {
      setImageSize('2K');
    }
  }, [model, imageSize]);

  useEffect(() => {
    if (!outputTemplate) return;
    const hit = AI_OUTPUT_TEMPLATES.find((t) => t.id === outputTemplate);
    if (hit) setAspect(hit.aspect);
  }, [outputTemplate]);

  const remaining =
    kind === 'video'
      ? quota?.videos_remaining ?? 0
      : quota?.images_remaining ?? 0;
  const limit = kind === 'video' ? quota?.videos_limit ?? 0 : quota?.images_limit ?? 0;
  const used = kind === 'video' ? quota?.videos_used ?? 0 : quota?.images_used ?? 0;
  const providerReady =
    kind === 'video'
      ? Boolean(quota?.video_provider_ready)
      : Boolean(quota?.image_provider_ready);

  const previewUrl =
    result?.media.preview_data_url || result?.media.url || '';

  const paletteHex = useMemo(
    () =>
      paletteText
        .split(/[,|\s]+/)
        .map((s) => s.trim())
        .filter((s) => /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(s))
        .map((s) => (s.startsWith('#') ? s.toUpperCase() : `#${s.toUpperCase()}`))
        .slice(0, 8),
    [paletteText],
  );

  const mergedPreview = useMemo(
    () =>
      previewBrandLockedPrompt(prompt, {
        brandLock,
        paletteHex,
        persona,
        campaign,
      }),
    [prompt, brandLock, paletteHex, persona, campaign],
  );

  const aspectPreviewClass = useMemo(() => {
    switch (aspect) {
      case '9:16':
        return 'aspect-[9/16] max-w-[220px]';
      case '4:5':
        return 'aspect-[4/5] max-w-[260px]';
      case '3:4':
        return 'aspect-[3/4] max-w-[260px]';
      case '16:9':
        return 'aspect-video max-w-full';
      case '4:3':
        return 'aspect-[4/3] max-w-full';
      default:
        return 'aspect-square max-w-[320px]';
    }
  }, [aspect]);

  const styleStatusLabel = useMemo(() => {
    const n = styleRefs.length;
    if (n >= 10) return isAr ? 'مرجع الأسلوب جاهز' : 'Style references ready';
    if (n > 0) return isAr ? `جزئي (${n}/١٥)` : `Partial (${n}/15)`;
    return isAr ? 'بانتظار المراجع' : 'Waiting for references';
  }, [styleRefs.length, isAr]);

  if (!activeStore) {
    return (
      <div className="p-8 text-sm" style={{ color: 'var(--muted)' }}>
        {isAr ? 'لا يوجد متجر نشط.' : 'No active store.'}
      </div>
    );
  }

  const handleSaveBrand = async () => {
    setSavingBrand(true);
    try {
      const saved = await saveAiBrandProfile(activeStore.id, {
        palette_hex: paletteHex,
        persona,
        brand_lock_default: brandLock,
        logo_overlay_enabled: logoOverlay,
        logo_overlay_position: logoPosition,
        logo_url: logoUrl.trim() || null,
        style_reference_urls: styleRefs.slice(0, 15),
      });
      setBrand(saved);
      setStyleRefs(saved.style_reference_urls || []);
      setPaletteText((saved.palette_hex || []).join(', '));
      setLogoUrl(saved.logo_url || '');
      toast(
        isAr ? 'تم حفظ هوية العلامة لهذا المتجر.' : 'Brand identity saved for this store.',
        'success',
      );
    } catch (err: unknown) {
      const msg =
        (err instanceof Error ? err.message : null) ||
        (isAr ? 'فشل حفظ هوية العلامة.' : 'Failed to save brand identity.');
      toast(msg, 'error');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleEnhanceOnly = async () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 4) {
      toast(
        isAr ? 'اكتب فكرة قصيرة أولاً (٤ أحرف على الأقل).' : 'Write a short idea first (at least 4 characters).',
        'error',
      );
      return;
    }
    if (!providerReady) {
      toast(
        isAr ? 'مزود الذكاء الاصطناعي غير متصل.' : 'AI provider is not connected.',
        'error',
      );
      return;
    }
    setEnhancing(true);
    setErrorCode(null);
    setErrorDetail(null);
    try {
      const improved = await enhanceAiMediaPrompt(activeStore.id, {
        prompt: trimmed,
        locale: isAr ? 'ar' : 'en',
        aspect,
        style,
        brandLock,
        campaignPreset: campaign,
        persona,
        outputTemplate: outputTemplate || undefined,
      });
      setPrompt(improved.prompt);
      setPromptMode('auto');
      toast(
        isAr ? 'تم تحسين الموجه مع قفل العلامة. يمكنك تعديله قبل التوليد.' : 'Prompt enhanced with brand lock. You can still edit before generate.',
        'success',
      );
    } catch (err: unknown) {
      const code = err instanceof ApiRequestError ? err.code : 'enhance_failed';
      const mapped = friendlyAiCode(code, isAr);
      const msg =
        mapped ||
        (err instanceof Error ? err.message : null) ||
        (isAr ? 'فشل تحسين الموجه.' : 'Prompt enhance failed.');
      setErrorCode(String(code || 'enhance_failed'));
      setErrorDetail(msg);
      toast(msg, 'error');
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 8) {
      toast(
        isAr
          ? 'اكتب وصفاً أوضح (٨ أحرف على الأقل).'
          : 'Write a clearer prompt (at least 8 characters).',
        'error',
      );
      return;
    }
    if (!providerReady) {
      toast(
        isAr
          ? kind === 'video'
            ? 'توليد الفيديو غير متصل بعد — بانتظار المزود.'
            : 'مزود توليد الصور غير متصل. أضف مفتاح واجهة البرمجة على الخادم.'
          : kind === 'video'
            ? 'Video generation is not connected yet — waiting for provider.'
            : 'Image provider is not connected. Set GEMINI_API_KEY on the API server.',
        'error',
      );
      return;
    }
    if (remaining <= 0) {
      toast(
        isAr ? 'انتهت الحصة الشهرية لهذا المتجر.' : 'Monthly quota exhausted for this store.',
        'error',
      );
      return;
    }

    setGenerating(true);
    setErrorCode(null);
    setErrorDetail(null);
    try {
      // Persist brand identity quietly before generate when palette/persona changed
      if (paletteHex.length || persona) {
        try {
          const saved = await saveAiBrandProfile(activeStore.id, {
            palette_hex: paletteHex,
            persona,
            brand_lock_default: brandLock,
            logo_overlay_enabled: logoOverlay,
            logo_overlay_position: logoPosition,
            logo_url: logoUrl.trim() || null,
            style_reference_urls: styleRefs.slice(0, 15),
          });
          setBrand(saved);
        } catch {
          /* generate still proceeds with request-scoped brand fields */
        }
      }

      const data = await generateAiMedia(activeStore.id, {
        kind,
        prompt: trimmed,
        aspect,
        model,
        imageSize,
        style,
        negativePrompt: negativePrompt.trim() || undefined,
        autoEnhance: promptMode === 'auto' || autoEnhanceOnGenerate,
        locale: isAr ? 'ar' : 'en',
        saveToLibrary: true,
        title: isAr ? 'إبداع بالذكاء الاصطناعي' : 'AI creative',
        brandLock,
        campaignPreset: campaign,
        persona,
        outputTemplate: outputTemplate || undefined,
        logoOverlay,
        matchPerspective,
        productImageBase64: productDataUrl || undefined,
        productImageMime: productDataUrl?.match(/^data:(image\/[a-zA-Z0-9.+-]+);/)?.[1],
      });
      setResult(data);
      setQuota(data.quota);
      if (data.prompt_used && data.prompt_used !== trimmed) {
        setPrompt(data.prompt_used);
      }

      toast(
        isAr
          ? data.logo_overlay_applied
            ? 'تم التوليد مع شعار المتجر وحفظه في مكتبة الوسائط.'
            : 'تم التوليد وحفظ الملف في مكتبة الوسائط.'
          : data.logo_overlay_applied
            ? 'Generated with store logo and saved to Media Library.'
            : 'Generated and saved to Media Library.',
        'success',
      );
    } catch (err: unknown) {
      const code =
        (err instanceof ApiRequestError && err.code) ||
        (err as { code?: string; payload?: { code?: string } })?.code ||
        (err as { payload?: { code?: string } })?.payload?.code ||
        'generate_failed';
      const payloadQuota =
        err instanceof ApiRequestError &&
        err.payload &&
        typeof err.payload === 'object' &&
        (err.payload as { data?: { quota?: AiMediaQuota } }).data?.quota;
      if (payloadQuota) setQuota(payloadQuota);

      const mapped = friendlyAiCode(String(code), isAr);
      const payloadMsg =
        err instanceof ApiRequestError &&
        err.payload &&
        typeof err.payload === 'object' &&
        typeof (err.payload as { message?: unknown }).message === 'string'
          ? String((err.payload as { message: string }).message).trim()
          : '';
      const serverMsg =
        payloadMsg ||
        (err instanceof ApiRequestError && err.message) ||
        (err instanceof Error ? err.message : null) ||
        '';
      // Prefer raw API/provider message (payload) — generic HTTP wrappers hide Gemini details.
      const preferServer =
        serverMsg.length > 8 &&
        !/failed to fetch|networkerror|^api\s+\d{3}|bad gateway|internal server/i.test(serverMsg) &&
        (String(code) === 'provider_error' ||
          String(code) === 'provider_quota_exceeded' ||
          String(code) === 'empty_result' ||
          String(code) === 'generate_failed' ||
          !mapped);
      const msg =
        (preferServer ? serverMsg : null) ||
        mapped ||
        serverMsg ||
        (isAr ? 'فشل التوليد.' : 'Generation failed.');
      setErrorCode(String(code));
      setErrorDetail(msg);
      toast(msg, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const onProductFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast(isAr ? 'ارفع صورة منتج فقط.' : 'Upload a product image only.', 'error');
      return;
    }
    if (file.size > 8_000_000) {
      toast(isAr ? 'حجم صورة المنتج كبير جداً (حد ٨ ميجا).' : 'Product image too large (8MB max).', 'error');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setProductDataUrl(dataUrl);
      toast(
        isAr ? 'تم تجهيز صورة المنتج للوضع في خلفية متناسقة مع العلامة.' : 'Product photo ready for brand-consistent placement.',
        'success',
      );
    } catch {
      toast(isAr ? 'تعذر قراءة صورة المنتج.' : 'Could not read product image.', 'error');
    }
  };

  const onStyleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next = [...styleRefs];
    for (const file of Array.from(files)) {
      if (next.length >= 15) break;
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 4_000_000) continue;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        if (dataUrl && !next.includes(dataUrl)) next.push(dataUrl);
      } catch {
        /* skip */
      }
    }
    setStyleRefs(next.slice(0, 15));
    toast(
      isAr
        ? `مراجع الأسلوب: ${Math.min(next.length, 15)}/١٥ (ليست تدريباً وهمياً — توجيه بصري حقيقي).`
        : `Style references: ${Math.min(next.length, 15)}/15 (real visual guidance — not fake LoRA training).`,
      'success',
    );
  };

  const fieldLabel = (text: string) => (
    <span className="text-[11px] font-black tracking-wide block mb-1.5" style={{ color: 'var(--muted)' }}>
      {text}
    </span>
  );

  const selectClass =
    'w-full appearance-none rounded-xl border px-3.5 py-2.5 pe-9 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/35';

  const selectStyle: React.CSSProperties = {
    borderColor: 'var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: isAr ? 'left 0.75rem center' : 'right 0.75rem center',
    backgroundSize: '14px',
  };

  const ToggleSwitch = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: () => void;
    label: string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer"
      style={{
        background: checked
          ? 'linear-gradient(135deg, #0f766e, #14b8a6)'
          : 'color-mix(in srgb, var(--muted) 35%, var(--border))',
        boxShadow: checked ? '0 0 0 3px color-mix(in srgb, #14b8a6 18%, transparent)' : undefined,
      }}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
          checked ? 'start-5' : 'start-0.5'
        }`}
      />
    </button>
  );

  return (
    <div className="u-page w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-5 min-w-0" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-9 h-9 rounded-xl unity-icon-box text-white flex items-center justify-center shadow-xs">
              <Wand2 className="w-4 h-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isAr ? 'مولّد الصور المتوافق مع العلامة' : 'Brand-Consistent AI Image Generator'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm max-w-2xl" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'اكتب وصفاً بسيطاً؛ النظام يدمجه تلقائياً مع ألوان وأسلوب متجرك، مع قفل العلامة وقوالب الحملات ووضع المنتج.'
              : 'Type a simple prompt; the system merges it with this store’s colors & style — Brand Lock, campaigns, product placement.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAll()}
          disabled={loadingQuota}
          className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingQuota ? 'animate-spin' : ''}`} />
          {isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Quota strip */}
      <div
        className="rounded-2xl border p-4 flex flex-wrap gap-4 items-center justify-between"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="text-sm font-bold">
          {isAr ? 'حصة هذا المتجر' : 'This store quota'}{' '}
          <span style={{ color: 'var(--muted)' }} className="font-medium text-xs">
            ({quota?.period_key || '—'} · {quota?.plan_code || '—'})
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-full border" style={{ borderColor: 'var(--border)' }}>
            {isAr ? 'صور' : 'Images'}: {quota ? `${quota.images_used}/${quota.images_limit}` : '—'}
          </span>
          <span className="px-3 py-1.5 rounded-full border" style={{ borderColor: 'var(--border)' }}>
            {isAr ? 'فيديو' : 'Videos'}: {quota ? `${quota.videos_used}/${quota.videos_limit}` : '—'}
          </span>
          <span
            className="px-3 py-1.5 rounded-full font-black"
            style={{
              background: providerReady
                ? 'color-mix(in srgb, #34d399 22%, transparent)'
                : 'color-mix(in srgb, #f59e0b 22%, transparent)',
              color: providerReady ? '#059669' : '#b45309',
            }}
          >
            {providerReady
              ? isAr
                ? 'المزود متصل'
                : 'Provider connected'
              : isAr
                ? 'غير متصل / بانتظار البيانات'
                : 'Not Connected / Waiting'}
          </span>
        </div>
      </div>

      {/* Brand Lock toggle */}
      <div
        className="rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3"
        style={{
          borderColor: brandLock
            ? 'color-mix(in srgb, #0d9488 45%, var(--border))'
            : 'var(--border)',
          background: brandLock
            ? 'color-mix(in srgb, #0d9488 8%, var(--surface))'
            : 'var(--surface)',
        }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: brandLock
                ? 'linear-gradient(135deg, #0f766e, #0d9488)'
                : 'var(--bg)',
              color: brandLock ? '#fff' : 'var(--muted)',
            }}
          >
            {brandLock ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-black">
              {isAr ? 'قفل العلامة التجارية' : 'Brand Lock'}
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'عند التفعيل، أي وصف بسيط (مثل شاطئ ومحيط) يُرسم بألوان وأسلوب متجرك فقط.'
                : 'When on, a simple prompt like “beach and ocean” is rendered with this store’s colors & style only.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black" style={{ color: brandLock ? '#0f766e' : 'var(--muted)' }}>
            {brandLock ? (isAr ? 'مفعّل' : 'On') : isAr ? 'معطّل' : 'Off'}
          </span>
          <ToggleSwitch
            checked={brandLock}
            onChange={() => setBrandLock((v) => !v)}
            label={isAr ? 'قفل العلامة التجارية' : 'Brand Lock'}
          />
        </div>
      </div>

      {/* Kind tabs — segmented */}
      <div
        className="inline-flex p-1 rounded-2xl border gap-1 w-full sm:w-auto"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        role="tablist"
      >
        {([
          { id: 'image' as const, Icon: ImageIcon, en: 'Image', ar: 'صورة' },
          { id: 'video' as const, Icon: Video, en: 'Video', ar: 'فيديو' },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={kind === tab.id}
            onClick={() => setKind(tab.id)}
            className="flex-1 sm:flex-none min-w-[140px] px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all"
            style={{
              background:
                kind === tab.id
                  ? 'linear-gradient(135deg, #059669, #0d9488)'
                  : 'transparent',
              color: kind === tab.id ? '#fff' : 'var(--text)',
              boxShadow: kind === tab.id ? '0 6px 16px -8px rgba(13,148,136,0.55)' : undefined,
            }}
          >
            <tab.Icon className="w-4 h-4" />
            {isAr ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      {(kind === 'video' || !providerReady) && (
        <div
          className="rounded-xl border px-4 py-3 text-xs flex gap-2 items-start"
          style={{
            borderColor: 'color-mix(in srgb, #f59e0b 40%, var(--border))',
            background: 'color-mix(in srgb, #f59e0b 10%, transparent)',
            color: 'var(--text)',
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            {kind === 'video'
              ? isAr
                ? 'توليد الفيديو غير متصل بعد على المنصة — بانتظار المزود. حالياً يمكن توليد الصور فقط.'
                : 'Video generation is not connected yet — waiting for provider. Image generation only for now.'
              : isAr
                ? 'مزود الصور غير متصل. ضع مفتاح واجهة البرمجة على الخادم ثم أعد المحاولة. لن نعرض صوراً وهمية.'
                : 'Image provider not connected. Set the API key on the server, then retry. We never show fake images.'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: controls */}
        <div
          className="xl:col-span-7 rounded-2xl border p-4 sm:p-5 space-y-5"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          {/* Brand setup */}
          <button
            type="button"
            onClick={() => setShowBrandSetup((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-black py-1"
            style={{ color: 'var(--text)' }}
          >
            <span className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              {isAr ? 'مدخلات تدريب العلامة' : 'Brand training inputs'}
            </span>
            {showBrandSetup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showBrandSetup && (
            <div className="space-y-4 rounded-xl border p-3 sm:p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
              <div>
                <label className="text-[11px] font-black block mb-1.5">
                  {isAr ? 'لوحة ألوان العلامة (رموز سداسية)' : 'Brand color palette (hex)'}
                </label>
                <input
                  value={paletteText}
                  onChange={(e) => setPaletteText(e.target.value)}
                  placeholder={isAr ? 'مثال: #1A2B3C, #E0E0E0, #FFFFFF' : 'e.g. #1A2B3C, #E0E0E0, #FFFFFF'}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
                {paletteHex.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {paletteHex.map((c) => (
                      <span
                        key={c}
                        title={c}
                        className="w-6 h-6 rounded-md border"
                        style={{ background: c, borderColor: 'var(--border)' }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                {fieldLabel(isAr ? 'شخصية / أسلوب الفن' : 'Brand persona / art style')}
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value as AiBrandPersona)}
                  className={selectClass}
                  style={selectStyle}
                >
                  {AI_PERSONAS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isAr ? p.labelAr : p.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-[11px] font-black mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {isAr
                      ? 'مراجع الأسلوب (١٠–١٥ صورة حقيقية)'
                      : 'Style references (10–15 real photos)'}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                    {styleStatusLabel}
                    {brand && !brand.persisted ? (isAr ? ' · غير محفوظ بعد' : ' · not saved yet') : ''}
                  </span>
                </div>
                <p className="text-[10px] mb-2" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'توجيه بصري حقيقي للمتجر — لا ندّعي تدريب نموذج منفصل حتى يُربط فعلياً.'
                    : 'Real per-store visual guidance — we never claim a separate LoRA is trained until wired.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => styleInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl border text-[11px] font-black flex items-center gap-1.5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isAr ? 'رفع مراجع' : 'Upload references'}
                  </button>
                  {styleRefs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStyleRefs([])}
                      className="px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isAr ? 'مسح' : 'Clear'}
                    </button>
                  )}
                </div>
                <input
                  ref={styleInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void onStyleFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                {styleRefs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {styleRefs.slice(0, 15).map((src, i) => (
                      <img
                        key={`${i}-${src.slice(0, 24)}`}
                        src={src}
                        alt=""
                        className="w-10 h-10 rounded-md object-cover border"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-black" style={{ color: 'var(--text)' }}>
                      {isAr ? 'دمج شعار المتجر تلقائياً' : 'Auto logo overlay'}
                    </div>
                    <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'يُضاف الشعار على الناتج' : 'Watermark on generated output'}
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={logoOverlay}
                    onChange={() => setLogoOverlay((v) => !v)}
                    label={isAr ? 'دمج شعار المتجر تلقائياً' : 'Auto logo overlay'}
                  />
                </div>
                <div className={logoOverlay ? '' : 'opacity-45 pointer-events-none'}>
                  {fieldLabel(isAr ? 'موضع الشعار' : 'Logo position')}
                  <select
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value as AiLogoPosition)}
                    className={selectClass}
                    style={selectStyle}
                    disabled={!logoOverlay}
                  >
                    {AI_LOGO_POSITIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {isAr ? p.labelAr : p.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black block mb-1.5">
                  {isAr ? 'رابط شعار المتجر (اختياري)' : 'Store logo URL (optional)'}
                </label>
                <input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder={isAr ? 'اتركه فارغاً لاستخدام شعار المتجر المحفوظ' : 'Leave empty to use saved store logo'}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
              </div>

              <button
                type="button"
                onClick={() => void handleSaveBrand()}
                disabled={savingBrand}
                aria-busy={savingBrand}
                className="px-3 py-2 rounded-xl border text-[11px] font-black flex items-center gap-1.5 disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {savingBrand ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isAr ? 'حفظ هوية العلامة لهذا المتجر' : 'Save brand identity for this store'}
              </button>
            </div>
          )}

          {/* Prompt mode — segmented */}
          <div>
            {fieldLabel(isAr ? 'وضع الموجه' : 'Prompt mode')}
            <div
              className="grid grid-cols-2 p-1 rounded-2xl border gap-1"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                aria-selected={promptMode === 'manual'}
                onClick={() => {
                  setPromptMode('manual');
                  setAutoEnhanceOnGenerate(false);
                }}
                className="px-3 py-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background:
                    promptMode === 'manual'
                      ? 'linear-gradient(135deg, #0f766e, #0d9488)'
                      : 'transparent',
                  color: promptMode === 'manual' ? '#fff' : 'var(--text)',
                }}
              >
                <PenLine className="w-3.5 h-3.5" />
                {isAr ? 'موجه يدوي' : 'Manual'}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={promptMode === 'auto'}
                onClick={() => {
                  setPromptMode('auto');
                  setAutoEnhanceOnGenerate(true);
                }}
                className="px-3 py-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background:
                    promptMode === 'auto'
                      ? 'linear-gradient(135deg, #0f766e, #14b8a6)'
                      : 'transparent',
                  color: promptMode === 'auto' ? '#fff' : 'var(--text)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAr ? 'تحسين تلقائي' : 'Auto enhance'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-black block mb-1.5">
              {isAr ? 'الوصف (الموجه)' : 'Prompt'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={
                isAr
                  ? 'مثال: حقيبة نسائية على طاولة'
                  : 'e.g. A women\'s handbag on a table'
              }
              className="w-full rounded-xl border px-3 py-2.5 text-sm resize-y min-h-[100px]"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
              }}
            />
            {brandLock && prompt.trim().length >= 4 && (
              <div
                className="mt-2 rounded-xl border px-3 py-2 text-[10px] leading-relaxed"
                style={{
                  borderColor: 'color-mix(in srgb, #0d9488 35%, var(--border))',
                  background: 'color-mix(in srgb, #0d9488 6%, transparent)',
                  color: 'var(--muted)',
                }}
              >
                <span className="font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'معاينة الدمج مع العلامة: ' : 'Brand-merge preview: '}
                </span>
                {mergedPreview}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2 justify-between items-center">
              <span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                {prompt.length}/2000
              </span>
              <button
                type="button"
                onClick={() => void handleEnhanceOnly()}
                disabled={enhancing || generating || !providerReady}
                aria-busy={enhancing}
                className="px-3 py-2 rounded-xl border text-[11px] font-black flex items-center gap-1.5 disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {enhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {enhancing
                  ? isAr
                    ? 'جارٍ التحسين…'
                    : 'Enhancing…'
                  : isAr
                    ? 'تحسين الموجه الآن'
                    : 'Enhance prompt now'}
              </button>
            </div>
          </div>

          {/* Product injection */}
          <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            <div className="text-[11px] font-black">
              {isAr ? 'حقن المنتج / وضع العنصر' : 'Product injection / placement'}
            </div>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'ارفع صورة المنتج الحقيقية؛ النظام يزيل الخلفية ويولّد مشهداً متناسقاً مع العلامة مع مطابقة المنظور.'
                : 'Upload a real product photo; the system places it into a brand-consistent scene with perspective matching.'}
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => productInputRef.current?.click()}
                className="px-3 py-2 rounded-xl border text-[11px] font-black flex items-center gap-1.5"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <Upload className="w-3.5 h-3.5" />
                {isAr ? 'رفع صورة المنتج' : 'Upload product photo'}
              </button>
              {productDataUrl && (
                <button
                  type="button"
                  onClick={() => setProductDataUrl(null)}
                  className="px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isAr ? 'إزالة' : 'Remove'}
                </button>
              )}
              <div
                className="flex items-center gap-2 ms-auto rounded-xl border px-3 py-2"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                  {isAr ? 'مطابقة المنظور والظل' : 'Match perspective'}
                </span>
                <ToggleSwitch
                  checked={matchPerspective}
                  onChange={() => setMatchPerspective((v) => !v)}
                  label={isAr ? 'مطابقة المنظور والظل' : 'Match perspective & shadows'}
                />
              </div>
            </div>
            <input
              ref={productInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void onProductFile(e.target.files?.[0] || null);
                e.target.value = '';
              }}
            />
            {productDataUrl && (
              <img
                src={productDataUrl}
                alt=""
                className="w-20 h-20 rounded-lg object-cover border"
                style={{ borderColor: 'var(--border)' }}
              />
            )}
          </div>

          {/* Campaign + templates + aspect — aligned form grid */}
          <div
            className="rounded-2xl border p-3.5 sm:p-4 space-y-4"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                {fieldLabel(isAr ? 'إعدادات الحملات الموسمية' : 'Campaign preset')}
                <select
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value as AiCampaignPreset)}
                  className={selectClass}
                  style={selectStyle}
                >
                  {AI_CAMPAIGNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isAr ? c.labelAr : c.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {fieldLabel(isAr ? 'قوالب المقاس الجاهزة' : 'Output template')}
                <select
                  value={outputTemplate}
                  onChange={(e) => {
                    const v = e.target.value as AiOutputTemplate | '';
                    setOutputTemplate(v);
                    if (!v) return;
                    const hit = AI_OUTPUT_TEMPLATES.find((t) => t.id === v);
                    if (hit) setAspect(hit.aspect);
                  }}
                  className={selectClass}
                  style={selectStyle}
                >
                  <option value="">{isAr ? 'بدون قالب — يدوي' : 'No template — manual'}</option>
                  {AI_OUTPUT_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {isAr ? t.labelAr : t.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              {fieldLabel(isAr ? 'المقاس / النسبة' : 'Size / aspect ratio')}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ASPECTS.map((a) => {
                  const active = aspect === a.id;
                  const box =
                    a.id === '1:1'
                      ? 'w-5 h-5'
                      : a.id === '4:5' || a.id === '3:4'
                        ? 'w-4 h-5'
                        : a.id === '9:16'
                          ? 'w-3 h-5'
                          : a.id === '16:9'
                            ? 'w-6 h-3.5'
                            : 'w-5 h-4';
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setAspect(a.id);
                        setOutputTemplate('');
                      }}
                      className="rounded-xl border px-2 py-2.5 flex flex-col items-center gap-1.5 transition-all"
                      style={{
                        borderColor: active
                          ? 'color-mix(in srgb, #0d9488 55%, var(--border))'
                          : 'var(--border)',
                        background: active
                          ? 'color-mix(in srgb, #0d9488 14%, var(--surface))'
                          : 'var(--surface)',
                        boxShadow: active
                          ? 'inset 0 0 0 1px color-mix(in srgb, #0d9488 40%, transparent)'
                          : undefined,
                      }}
                    >
                      <span
                        className={`${box} rounded-[3px] border-2`}
                        style={{
                          borderColor: active ? '#0d9488' : 'var(--muted)',
                          opacity: active ? 1 : 0.55,
                        }}
                      />
                      <span className="text-[10px] font-black leading-tight text-center" style={{ color: 'var(--text)' }}>
                        {a.id}
                      </span>
                      <span className="text-[9px] font-semibold leading-tight text-center" style={{ color: 'var(--muted)' }}>
                        {isAr ? a.hintAr : a.hintEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Advanced */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-black py-1"
            style={{ color: 'var(--text)' }}
          >
            <span className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              {isAr ? 'إعدادات متقدمة' : 'Advanced settings'}
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="space-y-4 rounded-xl border p-3 sm:p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
              <div>
                {fieldLabel(isAr ? 'نموذج الذكاء الاصطناعي' : 'AI model')}
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={selectClass}
                  style={selectStyle}
                >
                  {models.map((m) => {
                    const tierLabel =
                      m.tier === 'pro'
                        ? isAr
                          ? 'برو'
                          : 'Pro'
                        : m.tier === 'balanced'
                          ? isAr
                            ? 'متوازن'
                            : 'Balanced'
                          : isAr
                            ? 'قياسي'
                            : 'Standard';
                    return (
                      <option key={m.id} value={m.id}>
                        {isAr ? m.label_ar : m.label_en} · {tierLabel}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  {fieldLabel(isAr ? 'دقة الصورة' : 'Output resolution')}
                  <div
                    className="grid grid-cols-3 p-1 rounded-2xl border gap-1"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                    role="radiogroup"
                    aria-label={isAr ? 'دقة الصورة' : 'Output resolution'}
                  >
                    {SIZES.map((s) => {
                      const disabled = s.id === '4K' && !String(model).includes('pro');
                      const active = imageSize === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={disabled}
                          onClick={() => setImageSize(s.id)}
                          className="px-2 py-2 rounded-xl text-[10px] sm:text-[11px] font-black transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                          style={{
                            background: active
                              ? 'linear-gradient(135deg, #0f766e, #0d9488)'
                              : 'transparent',
                            color: active ? '#fff' : 'var(--text)',
                          }}
                          title={disabled ? (isAr ? 'يتطلب نموذج برو' : 'Requires Pro model') : undefined}
                        >
                          {s.id}
                          <span className="block text-[9px] font-semibold opacity-80 mt-0.5">
                            {s.id === '1K'
                              ? isAr
                                ? 'قياسي'
                                : 'Standard'
                              : s.id === '2K'
                                ? isAr
                                  ? 'عالي'
                                  : 'High'
                                : isAr
                                  ? 'برو'
                                  : 'Pro'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  {fieldLabel(isAr ? 'الأسلوب البصري' : 'Visual style')}
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as AiMediaStyle)}
                    className={selectClass}
                    style={selectStyle}
                  >
                    {STYLES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {isAr ? s.labelAr : s.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black block mb-1.5">
                  {isAr ? 'ما يجب تجنبه (اختياري)' : 'Negative prompt (optional)'}
                </label>
                <input
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  maxLength={500}
                  placeholder={
                    isAr
                      ? 'مثال: بلا نص غير واضح، بلا وجوه مشوهة'
                      : 'e.g. no blurry text, no distorted faces'
                  }
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div
                className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-black" style={{ color: 'var(--text)' }}>
                    {isAr
                      ? 'تحسين الموجه تلقائياً عند التوليد'
                      : 'Auto-enhance on generate'}
                  </div>
                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'يُحسَّن الوصف قبل الإرسال' : 'Improves the prompt before sending'}
                  </div>
                </div>
                <ToggleSwitch
                  checked={autoEnhanceOnGenerate || promptMode === 'auto'}
                  onChange={() => {
                    const next = !(autoEnhanceOnGenerate || promptMode === 'auto');
                    setAutoEnhanceOnGenerate(next);
                    setPromptMode(next ? 'auto' : 'manual');
                  }}
                  label={
                    isAr
                      ? 'تحسين الموجه تلقائياً عند التوليد'
                      : 'Auto-enhance prompt when clicking Generate'
                  }
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 justify-between pt-1">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
              {isAr
                ? `المتبقي هذا الشهر: ${remaining} من ${limit} (مستخدم ${used})`
                : `Remaining this month: ${remaining} of ${limit} (used ${used})`}
            </span>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={
                generating ||
                enhancing ||
                remaining <= 0 ||
                kind === 'video' ||
                !providerReady
              }
              aria-busy={generating}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2 disabled:opacity-50 unity-btn-primary"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {kind === 'video'
                ? isAr
                  ? 'الفيديو غير متصل بعد'
                  : 'Video not connected yet'
                : generating
                  ? isAr
                    ? 'جارٍ التوليد… قد يستغرق دقيقة'
                    : 'Generating… may take up to a minute'
                  : isAr
                    ? 'توليد وحفظ في المكتبة'
                    : 'Generate & save to library'}
            </button>
          </div>
        </div>

        {/* Right: preview */}
        <div
          className="xl:col-span-5 rounded-2xl border p-4 sm:p-5 space-y-3 min-h-[280px] xl:sticky xl:top-4"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div className="text-xs font-black flex items-center justify-between gap-2">
            <span>{isAr ? 'المعاينة' : 'Preview'}</span>
            {result?.media.model ? (
              <span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                {result.media.model}
              </span>
            ) : null}
          </div>

          {result && previewUrl ? (
            <>
              <div
                className={`rounded-xl overflow-hidden border bg-black/5 mx-auto w-full flex items-center justify-center ${aspectPreviewClass}`}
                style={{ borderColor: 'var(--border)' }}
              >
                <img
                  src={previewUrl}
                  alt={result.media.file_name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              {(result.brand_lock || result.logo_overlay_applied) && (
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                  {result.brand_lock ? (
                    <span className="px-2 py-1 rounded-full border" style={{ borderColor: 'var(--border)' }}>
                      {isAr ? 'قفل العلامة' : 'Brand Lock'}
                    </span>
                  ) : null}
                  {result.logo_overlay_applied ? (
                    <span className="px-2 py-1 rounded-full border" style={{ borderColor: 'var(--border)' }}>
                      {isAr ? 'شعار مدمج' : 'Logo applied'}
                    </span>
                  ) : null}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('media')}
                  className="px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <FolderPlus className="w-4 h-4" />
                  {isAr ? 'فتح مكتبة الوسائط' : 'Open Media Library'}
                </button>
                <button
                  type="button"
                  onClick={() => setPostOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                >
                  <Send className="w-4 h-4" />
                  {isAr ? 'نشر على وسائل التواصل' : 'Post to social'}
                </button>
              </div>
            </>
          ) : (
            <div
              className={`rounded-xl border border-dashed mx-auto w-full flex flex-col items-center justify-center gap-2 ${aspectPreviewClass}`}
              style={{ borderColor: 'var(--border)', minHeight: 180, color: 'var(--muted)' }}
            >
              <ImageIcon className="w-8 h-8 opacity-40" />
              <p className="text-[11px] font-semibold text-center px-4">
                {isAr
                  ? 'النتيجة تظهر هنا بعد التوليد — بلا صور وهمية.'
                  : 'Result appears here after generate — no fake images.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {(errorCode || errorDetail) && (
        <div
          className="rounded-xl border px-4 py-3 text-xs flex gap-2 items-start"
          style={{
            borderColor: 'color-mix(in srgb, #ef4444 35%, var(--border))',
            background: 'color-mix(in srgb, #ef4444 8%, transparent)',
            color: 'var(--text)',
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div>
            <div className="font-bold">{errorDetail || friendlyAiCode(errorCode, isAr)}</div>
            {errorCode ? (
              <div className="mt-1 text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                {isAr ? 'رمز الحالة:' : 'Status code:'} {errorCode}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {postOpen && previewUrl ? (
        <CanvaSocialPostModal
          isOpen={postOpen}
          onClose={() => setPostOpen(false)}
          storeId={activeStore.id}
          imageUrl={result?.media.url || previewUrl}
          mediaId={result?.media.id}
          defaultCaption={prompt}
          onOpenSocialHub={() => onNavigateTab?.('social')}
        />
      ) : null}
    </div>
  );
};
