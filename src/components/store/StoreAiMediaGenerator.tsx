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
  Plus,
  Play,
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

/** Google AI Studio / Nano Banana aspect chips (same set). */
const ASPECTS: { id: AiMediaAspect; hintEn: string; hintAr: string }[] = [
  { id: '1:1', hintEn: 'Square', hintAr: 'مربع' },
  { id: '4:5', hintEn: 'Portrait', hintAr: 'عمودي' },
  { id: '5:4', hintEn: 'Landscape', hintAr: 'أفقي' },
  { id: '3:4', hintEn: 'Portrait', hintAr: 'عمودي' },
  { id: '4:3', hintEn: 'Landscape', hintAr: 'أفقي' },
  { id: '2:3', hintEn: 'Portrait', hintAr: 'عمودي' },
  { id: '3:2', hintEn: 'Landscape', hintAr: 'أفقي' },
  { id: '9:16', hintEn: 'Story', hintAr: 'قصة' },
  { id: '16:9', hintEn: 'Wide', hintAr: 'عريض' },
  { id: '21:9', hintEn: 'Cinema', hintAr: 'سينما' },
];

const STYLES: { id: AiMediaStyle; labelEn: string; labelAr: string }[] = [
  { id: 'default', labelEn: 'Auto', labelAr: 'تلقائي' },
  { id: 'studio', labelEn: 'Product studio', labelAr: 'استوديو منتجات' },
  { id: 'lifestyle', labelEn: 'Lifestyle', labelAr: 'أسلوب حياة' },
  { id: 'flat', labelEn: 'Flat illustration', labelAr: 'رسم مسطح' },
  { id: 'cinematic', labelEn: 'Cinematic', labelAr: 'سينمائي' },
  { id: 'minimal', labelEn: 'Minimal', labelAr: 'بسيط' },
];

const SIZES: { id: AiMediaImageSize; labelEn: string; labelAr: string }[] = [
  { id: '1K', labelEn: '1K', labelAr: '١ك' },
  { id: '2K', labelEn: '2K', labelAr: '٢ك' },
  { id: '4K', labelEn: '4K', labelAr: '٤ك' },
];

function aspectBoxClass(id: AiMediaAspect): string {
  switch (id) {
    case '9:16':
    case '2:3':
      return 'w-2.5 h-4';
    case '4:5':
    case '3:4':
      return 'w-3 h-4';
    case '16:9':
      return 'w-5 h-2.5';
    case '21:9':
      return 'w-6 h-2';
    case '3:2':
    case '5:4':
    case '4:3':
      return 'w-4 h-3';
    default:
      return 'w-3.5 h-3.5';
  }
}

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBrandSetup, setShowBrandSetup] = useState(false);
  const [showCampaignBox, setShowCampaignBox] = useState(false);
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
        return 'aspect-[9/16] max-w-[200px]';
      case '2:3':
        return 'aspect-[2/3] max-w-[220px]';
      case '4:5':
        return 'aspect-[4/5] max-w-[240px]';
      case '3:4':
        return 'aspect-[3/4] max-w-[240px]';
      case '16:9':
        return 'aspect-video max-w-full';
      case '21:9':
        return 'aspect-[21/9] max-w-full';
      case '3:2':
        return 'aspect-[3/2] max-w-full';
      case '5:4':
        return 'aspect-[5/4] max-w-full';
      case '4:3':
        return 'aspect-[4/3] max-w-full';
      default:
        return 'aspect-square max-w-[360px]';
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
    <div className="u-page w-full max-w-[1600px] mx-auto p-3 sm:p-5 space-y-4 min-w-0" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-9 h-9 rounded-xl unity-icon-box text-white flex items-center justify-center shadow-xs">
              <Wand2 className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {isAr ? 'استوديو الصور بالذكاء الاصطناعي' : 'AI Images Playground'}
            </h1>
          </div>
          <p className="text-xs max-w-xl" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'اكتب وصفاً وشغّل التوليد مع قفل العلامة وإعدادات التشغيل.'
              : 'Write a prompt and run generation with Brand Lock and run settings.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-full border text-[10px] font-bold" style={{ borderColor: 'var(--border)' }}>
            {isAr ? 'صور' : 'Images'}: {quota ? `${quota.images_used}/${quota.images_limit}` : '—'}
          </span>
          <span className="px-2.5 py-1 rounded-full border text-[10px] font-bold" style={{ borderColor: 'var(--border)' }}>
            {isAr ? 'فيديو' : 'Videos'}: {quota ? `${quota.videos_used}/${quota.videos_limit}` : '—'}
          </span>
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-black"
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
                : 'Provider ready'
              : isAr
                ? 'غير متصل'
                : 'Not connected'}
          </span>
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loadingQuota}
            className="px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingQuota ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Kind tabs */}
      <div
        className="inline-flex p-1 rounded-2xl border gap-1"
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
            className="min-w-[110px] px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all"
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

      {/* Playground: canvas + composer | run settings */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch min-h-0">
        {/* LEFT / CENTER — result canvas + prompt composer */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div
            className="flex-1 rounded-2xl border p-3 sm:p-4 flex flex-col min-h-[320px] sm:min-h-[420px]"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-black">{isAr ? 'النتيجة' : 'Result'}</span>
              {result?.media.model ? (
                <span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                  {result.media.model}
                </span>
              ) : null}
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[220px]">
              {result && previewUrl ? (
                <div
                  className={`rounded-xl overflow-hidden border bg-black/5 w-full mx-auto flex items-center justify-center ${aspectPreviewClass}`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  <img
                    src={previewUrl}
                    alt={result.media.file_name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className={`rounded-xl border border-dashed w-full mx-auto flex flex-col items-center justify-center gap-2 ${aspectPreviewClass}`}
                  style={{ borderColor: 'var(--border)', minHeight: 220, color: 'var(--muted)' }}
                >
                  <ImageIcon className="w-10 h-10 opacity-35" />
                  <p className="text-[11px] font-semibold text-center px-4">
                    {isAr
                      ? 'النتيجة تظهر هنا بعد التشغيل — بلا صور وهمية.'
                      : 'Result appears here after you run — no fake images.'}
                  </p>
                </div>
              )}
            </div>

            {result && previewUrl ? (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {(result.brand_lock || result.logo_overlay_applied) && (
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold me-auto">
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
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('media')}
                  className="px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  {isAr ? 'فتح مكتبة الوسائط' : 'Open Media Library'}
                </button>
                <button
                  type="button"
                  onClick={() => setPostOpen(true)}
                  className="px-3 py-2 rounded-xl text-[11px] font-black text-white flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                >
                  <Send className="w-3.5 h-3.5" />
                  {isAr ? 'نشر على وسائل التواصل' : 'Post to social'}
                </button>
              </div>
            ) : null}
          </div>

          {/* Prompt composer (Google-style bar) */}
          <div
            className="rounded-2xl border p-3 sm:p-3.5 space-y-2 sticky bottom-2 z-10"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              boxShadow: '0 -8px 28px -18px rgba(0,0,0,0.35)',
            }}
          >
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => productInputRef.current?.click()}
                title={isAr ? 'إرفاق صورة' : 'Attach image'}
                aria-label={isAr ? 'إرفاق صورة' : 'Attach image'}
                className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
              >
                <Plus className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <label className="sr-only">{isAr ? 'الوصف' : 'Prompt'}</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      if (!generating && !enhancing && providerReady && kind !== 'video' && remaining > 0) {
                        void handleGenerate();
                      }
                    }
                  }}
                  rows={3}
                  maxLength={2000}
                  placeholder={
                    isAr
                      ? 'اكتب وصفاً للصورة التي تريدها…'
                      : 'Describe the image you want… (Ctrl+Enter to Run)'
                  }
                  className="w-full rounded-xl border px-3 py-2.5 text-sm resize-y min-h-[72px] max-h-[160px]"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => void handleEnhanceOnly()}
                disabled={enhancing || generating || !providerReady}
                aria-busy={enhancing}
                className="px-3 h-11 rounded-xl border text-[11px] font-black flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
              >
                {enhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {enhancing ? (isAr ? 'جارٍ…' : '…') : isAr ? 'تحسين' : 'Enhance'}
              </button>
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
                className="px-4 h-11 rounded-xl text-[11px] font-black text-white flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {kind === 'video'
                  ? isAr
                    ? 'غير متصل'
                    : 'Not connected'
                  : generating
                    ? isAr
                      ? 'جارٍ…'
                      : 'Running…'
                    : isAr
                      ? 'تشغيل'
                      : 'Run'}
              </button>
            </div>

            {productDataUrl ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-2 rounded-xl border ps-1 pe-2 py-1 text-[10px] font-bold"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                >
                  <img
                    src={productDataUrl}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  {isAr ? 'صورة منتج مرفقة' : 'Product attached'}
                  <button
                    type="button"
                    onClick={() => setProductDataUrl(null)}
                    className="p-0.5 rounded-md"
                    style={{ color: 'var(--muted)' }}
                    aria-label={isAr ? 'إزالة' : 'Remove'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
                <div
                  className="flex items-center gap-2 rounded-xl border px-2.5 py-1.5"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                >
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text)' }}>
                    {isAr ? 'مطابقة المنظور' : 'Match perspective'}
                  </span>
                  <ToggleSwitch
                    checked={matchPerspective}
                    onChange={() => setMatchPerspective((v) => !v)}
                    label={isAr ? 'مطابقة المنظور والظل' : 'Match perspective & shadows'}
                  />
                </div>
              </div>
            ) : null}

            {brandLock && prompt.trim().length >= 4 ? (
              <div
                className="rounded-xl border px-3 py-2 text-[10px] leading-relaxed"
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
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
              <span>
                {isAr
                  ? '+ إرفاق صورة المنتج · الشعار من إعدادات التشغيل ← هوية العلامة'
                  : '+ Attach product photo · Logo lives in Run settings → Brand identity'}
              </span>
              <span>{prompt.length}/2000</span>
            </div>
          </div>
        </div>

        {/* RIGHT — Run settings */}
        <aside
          className="w-full lg:w-[340px] xl:w-[360px] shrink-0 rounded-2xl border flex flex-col max-h-[min(92vh,920px)] lg:sticky lg:top-3 overflow-hidden"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div
            className="px-4 py-3 border-b flex items-center gap-2 shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <Settings2 className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            <h2 className="text-sm font-black">
              {isAr ? 'إعدادات التشغيل' : 'Run settings'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* Model */}
            <div>
              {fieldLabel(isAr ? 'النموذج' : 'Model')}
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

            {/* Aspect ratio grid */}
            <div>
              {fieldLabel(isAr ? 'نسبة الأبعاد' : 'Aspect ratio')}
              <div className="grid grid-cols-5 gap-1.5">
                {ASPECTS.map((a) => {
                  const active = aspect === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      title={isAr ? a.hintAr : a.hintEn}
                      onClick={() => {
                        setAspect(a.id);
                        setOutputTemplate('');
                      }}
                      className="rounded-lg border px-1 py-2 flex flex-col items-center gap-1 transition-all"
                      style={{
                        borderColor: active
                          ? 'color-mix(in srgb, #0d9488 55%, var(--border))'
                          : 'var(--border)',
                        background: active
                          ? 'color-mix(in srgb, #0d9488 14%, var(--bg))'
                          : 'var(--bg)',
                      }}
                    >
                      <span
                        className={`${aspectBoxClass(a.id)} rounded-[2px] border-2`}
                        style={{
                          borderColor: active ? '#0d9488' : 'var(--muted)',
                          opacity: active ? 1 : 0.5,
                        }}
                      />
                      <span className="text-[9px] font-black leading-none" style={{ color: 'var(--text)' }}>
                        {a.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Media resolution */}
            <div>
              {fieldLabel(isAr ? 'دقة الوسائط' : 'Media resolution')}
              <div
                className="grid grid-cols-3 p-1 rounded-2xl border gap-1"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                role="radiogroup"
                aria-label={isAr ? 'دقة الوسائط' : 'Media resolution'}
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
                      className="px-2 py-2 rounded-xl text-[11px] font-black transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                      style={{
                        background: active
                          ? 'linear-gradient(135deg, #0f766e, #0d9488)'
                          : 'transparent',
                        color: active ? '#fff' : 'var(--text)',
                      }}
                      title={disabled ? (isAr ? 'يتطلب نموذج برو' : 'Requires Pro model') : undefined}
                    >
                      {isAr ? s.labelAr : s.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual style */}
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

            {/* Brand Lock */}
            <div
              className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
              style={{
                borderColor: brandLock
                  ? 'color-mix(in srgb, #0d9488 45%, var(--border))'
                  : 'var(--border)',
                background: brandLock
                  ? 'color-mix(in srgb, #0d9488 8%, var(--bg))'
                  : 'var(--bg)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {brandLock ? <Lock className="w-3.5 h-3.5 shrink-0" /> : <Unlock className="w-3.5 h-3.5 shrink-0" />}
                <div className="min-w-0">
                  <div className="text-[11px] font-black">{isAr ? 'قفل العلامة التجارية' : 'Brand Lock'}</div>
                  <div className="text-[9px] font-semibold" style={{ color: 'var(--muted)' }}>
                    {brandLock ? (isAr ? 'مفعّل' : 'On') : isAr ? 'معطّل' : 'Off'}
                  </div>
                </div>
              </div>
              <ToggleSwitch
                checked={brandLock}
                onChange={() => setBrandLock((v) => !v)}
                label={isAr ? 'قفل العلامة التجارية' : 'Brand Lock'}
              />
            </div>

            {/* Auto-enhance */}
            <div
              className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <div className="min-w-0">
                <div className="text-[11px] font-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isAr ? 'تحسين تلقائي' : 'Auto-enhance'}
                </div>
                <div className="text-[9px] font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'يُحسَّن الوصف قبل الإرسال' : 'Improve prompt before send'}
                </div>
              </div>
              <ToggleSwitch
                checked={autoEnhanceOnGenerate || promptMode === 'auto'}
                onChange={() => {
                  const next = !(autoEnhanceOnGenerate || promptMode === 'auto');
                  setAutoEnhanceOnGenerate(next);
                  setPromptMode(next ? 'auto' : 'manual');
                }}
                label={isAr ? 'تحسين تلقائي' : 'Auto-enhance'}
              />
            </div>

            {/* Campaign & templates */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setShowCampaignBox((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-black"
                style={{ color: 'var(--text)', background: 'var(--bg)' }}
              >
                <span className="flex items-center gap-1.5">
                  <PenLine className="w-3.5 h-3.5" />
                  {isAr ? 'الحملات والقوالب' : 'Campaign & templates'}
                </span>
                {showCampaignBox ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showCampaignBox ? (
                <div className="p-3 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    {fieldLabel(isAr ? 'إعداد الحملة' : 'Campaign preset')}
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
                    {fieldLabel(isAr ? 'قالب المخرجات' : 'Output template')}
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
              ) : null}
            </div>

            {/* Brand identity */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setShowBrandSetup((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-black"
                style={{ color: 'var(--text)', background: 'var(--bg)' }}
              >
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  {isAr ? 'هوية العلامة التجارية' : 'Brand identity'}
                </span>
                {showBrandSetup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showBrandSetup ? (
                <div className="p-3 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <label className="text-[11px] font-black block mb-1.5">
                      {isAr ? 'لوحة الألوان (سداسي)' : 'Palette (hex)'}
                    </label>
                    <input
                      value={paletteText}
                      onChange={(e) => setPaletteText(e.target.value)}
                      placeholder={isAr ? 'مثال: #1A2B3C, #E0E0E0' : 'e.g. #1A2B3C, #E0E0E0'}
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    />
                    {paletteHex.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {paletteHex.map((c) => (
                          <span
                            key={c}
                            title={c}
                            className="w-5 h-5 rounded-md border"
                            style={{ background: c, borderColor: 'var(--border)' }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    {fieldLabel(isAr ? 'الشخصية الفنية' : 'Persona')}
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
                    <div className="text-[11px] font-black mb-1 flex flex-wrap items-center justify-between gap-2">
                      <span>{isAr ? 'مراجع الأسلوب' : 'Style references'}</span>
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {styleStatusLabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => styleInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-xl border text-[10px] font-black flex items-center gap-1"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        <Upload className="w-3 h-3" />
                        {isAr ? 'رفع' : 'Upload'}
                      </button>
                      {styleRefs.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setStyleRefs([])}
                          className="px-2.5 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1"
                          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                        >
                          <Trash2 className="w-3 h-3" />
                          {isAr ? 'مسح' : 'Clear'}
                        </button>
                      ) : null}
                    </div>
                    {styleRefs.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {styleRefs.slice(0, 15).map((src, i) => (
                          <img
                            key={`${i}-${src.slice(0, 24)}`}
                            src={src}
                            alt=""
                            className="w-8 h-8 rounded-md object-cover border"
                            style={{ borderColor: 'var(--border)' }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div
                    className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-black">{isAr ? 'دمج الشعار' : 'Logo overlay'}</div>
                      <div className="text-[9px] font-semibold" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'يُضاف على الناتج' : 'Applied on output'}
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={logoOverlay}
                      onChange={() => setLogoOverlay((v) => !v)}
                      label={isAr ? 'دمج الشعار' : 'Logo overlay'}
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

                  <div>
                    <label className="text-[11px] font-black block mb-1.5">
                      {isAr ? 'رابط الشعار (اختياري)' : 'Logo URL (optional)'}
                    </label>
                    <input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder={isAr ? 'فارغ = شعار المتجر المحفوظ' : 'Empty = saved store logo'}
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSaveBrand()}
                    disabled={savingBrand}
                    aria-busy={savingBrand}
                    className="w-full px-3 py-2 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {savingBrand ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {isAr ? 'حفظ العلامة' : 'Save brand'}
                  </button>
                </div>
              ) : null}
            </div>

            {/* Advanced */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-black"
                style={{ color: 'var(--text)', background: 'var(--bg)' }}
              >
                <span className="flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" />
                  {isAr ? 'متقدم' : 'Advanced'}
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showAdvanced ? (
                <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
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
              ) : null}
            </div>
          </div>

          <div
            className="px-4 py-3 border-t text-[10px] font-semibold shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            {isAr
              ? `المتبقي هذا الشهر: ${remaining} من ${limit} (مستخدم ${used})`
              : `Remaining this month: ${remaining} of ${limit} (used ${used})`}
          </div>
        </aside>
      </div>

      {/* Hidden file inputs */}
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
