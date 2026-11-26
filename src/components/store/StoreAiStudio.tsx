import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Wand2,
  SlidersHorizontal,
  Download,
  FolderPlus,
  RefreshCw,
  History,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
  Upload,
  Zap,
  Clock,
  Maximize2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchStudioQuota,
  generateStudioImage,
  fetchStudioHistory,
  saveStudioImageToMedia,
  type StoreStudioQuota,
  type StudioGeneratedImage,
  type StudioHistoryItem,
} from '../../services/storeAiStudioApi';

type StudioMode =
  | 'product_photography'
  | 'text_to_image'
  | 'replace_bg'
  | 'lifestyle'
  | 'banner';

export const StoreAiStudio: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [quota, setQuota] = useState<StoreStudioQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [historyItems, setHistoryItems] = useState<StudioHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<StudioMode>('product_photography');

  // Form State
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedAspect, setSelectedAspect] = useState<string>('1:1');
  const [selectedResolution, setSelectedResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [selectedStyle, setSelectedStyle] = useState<string>('studio');

  // Product Image Upload (for background replacement / lifestyle staging)
  const [productImageBase64, setProductImageBase64] = useState<string | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result state
  const [generatedImage, setGeneratedImage] = useState<StudioGeneratedImage | null>(null);
  const [savingMedia, setSavingMedia] = useState(false);

  // Translations
  const t = useMemo(() => ({
    title: isAr ? 'استوديو الذكاء الاصطناعي لصور المنتجات' : 'AI Product Image Studio',
    subtitle: isAr
      ? 'توليد وتعديل صور منتجات متجرك بدقة فائقة وبخلفيات تسويقية مخصصة للسوق السعودي عبر Google Gemini'
      : 'Generate and edit high-impact commercial product imagery tailored for Saudi commerce using Google Gemini',
    modes: {
      product_photography: isAr ? 'تصوير استوديو المنتجات' : 'Product Studio Photography',
      text_to_image: isAr ? 'توليد من الوصف' : 'Text to Image',
      replace_bg: isAr ? 'استبدال الخلفية' : 'Background Staging',
      lifestyle: isAr ? 'مشاهد أسلوب الحياة' : 'Lifestyle Scenes',
      banner: isAr ? 'بنرات ترويجية' : 'Marketing Banners',
    },
    credits: isAr ? 'الرصيد المتبقي' : 'Remaining Credits',
    dailyUsage: isAr ? 'استهلاك اليوم' : 'Daily Usage',
    monthlyUsage: isAr ? 'استهلاك الشهر' : 'Monthly Usage',
    generateBtn: isAr ? 'توليد الصورة الآن' : 'Generate Image Now',
    generating: isAr ? 'جاري المعالجة والتوليد...' : 'Rendering with Gemini...',
    saveToMedia: isAr ? 'حفظ في مكتبة الوسائط' : 'Save to Media Library',
    download: isAr ? 'تحميل الصورة' : 'Download High-Res',
    historyTitle: isAr ? 'سجل الصور المولدة' : 'Recent AI Generations',
  }), [isAr]);

  const loadQuota = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStudioQuota();
      setQuota(res.data);
      if (res.data.default_model) {
        setSelectedModel(res.data.default_model);
      }
      if (res.data.default_aspect) {
        setSelectedAspect(res.data.default_aspect);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetchStudioHistory(1);
      setHistoryItems(res.data || []);
    } catch {
      // Quiet fail on history load
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuota();
    loadHistory();
  }, [loadQuota, loadHistory]);

  // Handle local image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast(isAr ? 'حجم الملف يتجاوز 10 ميغابايت' : 'File exceeds 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProductImageBase64(result);
      setProductImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  // Run Generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast(isAr ? 'يرجى كتابة وصف الصورة المطلوب توليدها' : 'Please provide a prompt description', 'error');
      return;
    }

    if (!quota?.ai_enabled || quota?.is_paused) {
      toast(quota?.pause_reason || (isAr ? 'خدمة الذكاء الاصطناعي موقوفة لهذا المتجر' : 'AI is paused for this store'), 'error');
      return;
    }

    if (quota?.remaining_credits <= 0) {
      toast(isAr ? 'نفد رصيد الذكاء الاصطناعي. يرجى طلب شحن رصيد.' : 'AI credits exhausted.', 'error');
      return;
    }

    setGenerating(true);
    try {
      const res = await generateStudioImage({
        prompt: prompt.trim(),
        model_id: selectedModel,
        aspect_ratio: selectedAspect,
        image_size: selectedResolution,
        style: selectedStyle,
        action_type: activeMode,
        product_image_base64: productImageBase64 || undefined,
      });

      if (res.ok) {
        setGeneratedImage(res.image);
        setQuota(res.quota);
        toast(isAr ? 'تم توليد الصورة بنجاح!' : 'Image generated successfully!', 'success');
        loadHistory();
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Save to Media Library
  const handleSaveToMedia = async () => {
    if (!generatedImage) return;
    setSavingMedia(true);
    try {
      const res = await saveStudioImageToMedia(generatedImage.id, 'ai-studio');
      if (res.ok) {
        toast(isAr ? 'تم حفظ الصورة بنجاح في مكتبة الوسائط.' : 'Saved to store media library.', 'success');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSavingMedia(false);
    }
  };

  if (loading && !quota) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
        <span className="text-sm font-medium text-slate-400">
          {isAr ? 'جاري تهيئة استوديو الصور...' : 'Initializing AI Image Studio...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-12 font-[var(--font-ui)]" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {t.title}
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeStore?.name || 'Store'}
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              {t.subtitle}
            </p>
          </div>

          {/* Real Credits Widget */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/30 shadow-md">
              <span className="text-[11px] text-slate-400 font-medium block">
                {t.credits}
              </span>
              <div className="text-2xl font-black text-purple-400 tabular-nums">
                {quota?.remaining_credits ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
              <span className="text-[11px] text-slate-400 font-medium block">
                {t.dailyUsage}
              </span>
              <div className="text-base font-bold text-white tabular-nums">
                {quota?.daily_used ?? 0} / <span className="text-slate-500">{quota?.daily_limit ?? 25}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
              <span className="text-[11px] text-slate-400 font-medium block">
                {t.monthlyUsage}
              </span>
              <div className="text-base font-bold text-white tabular-nums">
                {quota?.monthly_used ?? 0} / <span className="text-slate-500">{quota?.monthly_limit ?? 200}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selection Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-sidebar-scroll">
        {[
          { id: 'product_photography', label: t.modes.product_photography, icon: Sparkles },
          { id: 'text_to_image', label: t.modes.text_to_image, icon: Wand2 },
          { id: 'replace_bg', label: t.modes.replace_bg, icon: Layers },
          { id: 'lifestyle', label: t.modes.lifestyle, icon: ImageIcon },
          { id: 'banner', label: t.modes.banner, icon: Maximize2 },
        ].map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMode(m.id as StudioMode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Studio Grid: Studio Controls (Left) vs Real-time Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Parameters & Prompt */}
        <div className="lg:col-span-7 space-y-5 p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          {/* Product Image Attachment if background staging or lifestyle */}
          {(activeMode === 'replace_bg' || activeMode === 'lifestyle' || activeMode === 'product_photography') && (
            <div className="space-y-2 p-4 rounded-xl bg-slate-950 border border-dashed border-slate-700/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-purple-400" />
                  {isAr ? 'صورة المنتج الأصلية (اختياري للدمج والعزل)' : 'Product Image (Optional for staging & cutout)'}
                </span>
                {productImagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductImageBase64(null);
                      setProductImagePreview(null);
                    }}
                    className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    {isAr ? 'إزالة الصورة' : 'Remove image'}
                  </button>
                )}
              </div>

              {productImagePreview ? (
                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={productImagePreview}
                    alt="Product preview"
                    className="w-16 h-16 rounded-lg object-contain bg-slate-900 border border-slate-800"
                  />
                  <div className="text-xs text-slate-400">
                    <p className="text-white font-medium">{isAr ? 'تم تحميل صورة المنتج بنجاح' : 'Product uploaded'}</p>
                    <p>{isAr ? 'سيتم الحفاظ على أبعاد وشعار المنتج بدقة' : 'Product proportions and identity preserved'}</p>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="py-4 text-center cursor-pointer hover:bg-slate-900/50 rounded-lg transition-colors"
                >
                  <p className="text-xs text-slate-400 font-medium">
                    {isAr ? 'انقر هنا لرفع صورة المنتج (PNG أو JPEG حتى 10MB)' : 'Click to upload product image (PNG/JPEG up to 10MB)'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                {isAr ? 'وصف المشهد الإعلاني والمحتوى المطلوب' : 'Scene Description & Prompt'}
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {prompt.length} / 2000
              </span>
            </div>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: علبة عطر فاخرة فوق منصة من الرخام الأسود مع إضاءة خافتة ذهبية وخلفية استوديو ناعمة...'
                  : 'Example: Luxury Arabian perfume bottle on a polished black marble pedestal with golden softbox ambient lighting...'
              }
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>

          {/* Parameter Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Model Selector (Only models enabled by Super Admin) */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                {isAr ? 'نموذج الذكاء الاصطناعي' : 'AI Model'}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {(quota?.models || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {isAr ? m.name_ar : m.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                {isAr ? 'الأبعاد (Aspect Ratio)' : 'Aspect Ratio'}
              </label>
              <select
                value={selectedAspect}
                onChange={(e) => setSelectedAspect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="1:1">1:1 (مربع / منتجات)</option>
                <option value="4:5">4:5 (عمودي / إنستغرام)</option>
                <option value="9:16">9:16 (طولي / ستوري)</option>
                <option value="16:9">16:9 (عريض / بنرات)</option>
                <option value="21:9">21:9 (سينمائي / هيرو)</option>
              </select>
            </div>

            {/* Style Preset */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                {isAr ? 'نمط الإضاءة' : 'Lighting Style'}
              </label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="studio">{isAr ? 'استوديو تجاري ناعم' : 'Soft Studio Box'}</option>
                <option value="lifestyle">{isAr ? 'طبيعي دافئ (سعودي)' : 'Warm Saudi Ambient'}</option>
                <option value="cinematic">{isAr ? 'سينمائي درامي' : 'Dramatic Cinematic'}</option>
                <option value="minimal">{isAr ? 'بسيط وعصري (Minimal)' : 'Clean Minimal'}</option>
              </select>
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.generating}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.generateBtn}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Preview Canvas */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                {isAr ? 'لوحة المعاينة المباشرة' : 'Live Canvas Preview'}
              </span>
              {generatedImage && (
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-500/20 text-purple-300">
                  {generatedImage.model}
                </span>
              )}
            </h3>

            {/* Generated Image Box */}
            <div className="relative aspect-square w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group">
              {generating ? (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 animate-pulse">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">
                    {isAr ? 'جاري رسم المشهد بواسطة Gemini AI...' : 'Rendering with Gemini AI...'}
                  </span>
                  <span className="text-[11px] text-slate-500 max-w-xs">
                    {isAr ? 'يتم تطبيق معايير الإضاءة والعزل بدقة فائقة' : 'Applying commercial studio grading and perspective'}
                  </span>
                </div>
              ) : generatedImage ? (
                <>
                  <img
                    src={generatedImage.url || generatedImage.preview_data_url}
                    alt={generatedImage.prompt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end justify-between">
                    <p className="text-xs text-slate-200 line-clamp-2 max-w-[70%]">
                      {generatedImage.prompt}
                    </p>
                    <a
                      href={generatedImage.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur"
                      title={isAr ? 'عرض الحجم الكامل' : 'Full View'}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-500">
                  <ImageIcon className="w-10 h-10 opacity-30" />
                  <p className="text-xs font-medium">
                    {isAr ? 'لم يتم توليد أي صورة بعد في هذه الجلسة' : 'No image generated yet in this session'}
                  </p>
                  <p className="text-[11px] text-slate-600 max-w-xs">
                    {isAr ? 'اكتب وصف المشهد وانقر على زر التوليد لتشاهد النتيجة هنا فوراً' : 'Write a prompt and trigger generation to view results here'}
                  </p>
                </div>
              )}
            </div>

            {/* Canvas Actions */}
            {generatedImage && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveToMedia}
                  disabled={savingMedia}
                  className="px-3 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>{savingMedia ? (isAr ? 'جاري الحفظ...' : 'Saving...') : t.saveToMedia}</span>
                </button>

                <a
                  href={generatedImage.url}
                  download={`product-ai-${Date.now()}.webp`}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.download}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generation History Gallery */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            {t.historyTitle}
          </h2>
          <span className="text-xs text-slate-500">
            {historyItems.length} {isAr ? 'صورة في السجل' : 'items recorded'}
          </span>
        </div>

        {historyItems.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            {isAr ? 'لا يوجد سجل سابق لهذا المتجر' : 'No generation history recorded yet'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-sm hover:border-purple-500/40 transition-all cursor-pointer"
                onClick={() => {
                  setGeneratedImage({
                    id: item.id,
                    media_id: item.media_id || '',
                    url: item.image_url,
                    preview_data_url: item.image_url,
                    prompt: item.prompt,
                    model: item.model_id,
                    aspect_ratio: item.aspect_ratio,
                    action_type: item.action_type,
                    created_at: item.created_at,
                  });
                }}
              >
                <img
                  src={item.image_url}
                  alt={item.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                  <p className="text-[11px] text-white line-clamp-1 font-medium">{item.prompt}</p>
                  <span className="text-[9px] text-purple-300 font-mono">{item.model_id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
