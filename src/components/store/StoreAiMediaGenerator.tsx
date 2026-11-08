import React, { useCallback, useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { CanvaSocialPostModal } from './CanvaSocialPostModal';
import {
  fetchAiMediaQuota,
  generateAiMedia,
  type AiMediaAspect,
  type AiMediaGenerated,
  type AiMediaKind,
  type AiMediaQuota,
} from '../../services/aiMediaGenerationService';

export interface StoreAiMediaGeneratorProps {
  onNavigateTab?: (tab: string) => void;
}

const ASPECTS: { id: AiMediaAspect; labelEn: string; labelAr: string }[] = [
  { id: '1:1', labelEn: 'Square 1:1', labelAr: 'مربع ١:١' },
  { id: '4:5', labelEn: 'Feed 4:5', labelAr: 'منشور ٤:٥' },
  { id: '9:16', labelEn: 'Reels 9:16', labelAr: 'مقطع عمودي ٩:١٦' },
  { id: '16:9', labelEn: 'Banner 16:9', labelAr: 'بانر ١٦:٩' },
];

export const StoreAiMediaGenerator: React.FC<StoreAiMediaGeneratorProps> = ({
  onNavigateTab,
}) => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [kind, setKind] = useState<AiMediaKind>('image');
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState<AiMediaAspect>('1:1');
  const [quota, setQuota] = useState<AiMediaQuota | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AiMediaGenerated | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const loadQuota = useCallback(async () => {
    if (!activeStore?.id) return;
    setLoadingQuota(true);
    try {
      const q = await fetchAiMediaQuota(activeStore.id);
      setQuota(q);
      setErrorCode(null);
    } catch (err: any) {
      setQuota(null);
      setErrorCode('quota_load_failed');
      toast(
        isAr ? 'تعذر تحميل حصة الذكاء الاصطناعي لهذا المتجر.' : 'Could not load AI quota for this store.',
        'error',
      );
    } finally {
      setLoadingQuota(false);
    }
  }, [activeStore?.id, isAr, toast]);

  useEffect(() => {
    void loadQuota();
  }, [loadQuota]);

  if (!activeStore) {
    return (
      <div className="p-8 text-sm" style={{ color: 'var(--muted)' }}>
        {isAr ? 'لا يوجد متجر نشط.' : 'No active store.'}
      </div>
    );
  }

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
            : 'مزود توليد الصور غير متصل. أضف مفتاح واجهة برمجة التطبيقات على الخادم.'
          : kind === 'video'
            ? 'Video generation is not connected yet — waiting for provider.'
            : 'Image provider is not connected. Set GEMINI_API_KEY on the API server.',
        'error',
      );
      return;
    }
    if (remaining <= 0) {
      toast(
        isAr
          ? 'انتهت الحصة الشهرية لهذا المتجر.'
          : 'Monthly quota exhausted for this store.',
        'error',
      );
      return;
    }

    setGenerating(true);
    setErrorCode(null);
    try {
      const data = await generateAiMedia(activeStore.id, {
        kind,
        prompt: trimmed,
        aspect,
        saveToLibrary: true,
        title: isAr ? 'إبداع بالذكاء الاصطناعي' : 'AI creative',
      });
      setResult(data);
      setQuota(data.quota);

      toast(
        isAr
          ? 'تم التوليد وحفظ الملف في مكتبة الوسائط.'
          : 'Generated and saved to Media Library.',
        'success',
      );
    } catch (err: any) {
      const code = err?.code || err?.payload?.code || 'generate_failed';
      const msg =
        err?.payload?.message ||
        err?.message ||
        (isAr ? 'فشل التوليد.' : 'Generation failed.');
      setErrorCode(String(code));
      if (err?.payload?.data?.quota) {
        setQuota(err.payload.data.quota);
      }
      toast(String(msg), 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-9 h-9 rounded-xl unity-icon-box text-white flex items-center justify-center shadow-xs">
              <Wand2 className="w-4 h-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isAr ? 'مولّد الصور والفيديو بالذكاء الاصطناعي' : 'AI Image & Video Generator'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `اكتب وصفاً، ولّد صورة أو فيديو لهذا المتجر فقط، ثم احفظ في مكتبة الوسائط أو انشر. الحصة شهرية حسب الخطة.`
              : `Prompt → generate image or video for this store only, then save to Media Library or post. Monthly plan limits apply.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadQuota()}
          disabled={loadingQuota}
          className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingQuota ? 'animate-spin' : ''}`} />
          {isAr ? 'تحديث الحصة' : 'Refresh quota'}
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

      {/* Kind tabs */}
      <div className="flex gap-2">
        {([
          { id: 'image' as const, Icon: ImageIcon, en: 'Image', ar: 'صورة' },
          { id: 'video' as const, Icon: Video, en: 'Video', ar: 'فيديو' },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setKind(tab.id)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all"
            style={{
              borderColor: kind === tab.id ? 'transparent' : 'var(--border)',
              background:
                kind === tab.id
                  ? 'linear-gradient(135deg, #059669, #0d9488)'
                  : 'var(--surface)',
              color: kind === tab.id ? '#fff' : 'var(--text)',
            }}
          >
            <tab.Icon className="w-4 h-4" />
            {isAr ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      {!providerReady && (
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
                ? 'توليد الفيديو غير مفعّل بعد على المنصة. الواجهة جاهزة؛ عند ربط المزود ستعمل بنفس الحصة لكل متجر.'
                : 'Video generation is not enabled on the platform yet. UI is ready; once the provider is wired it will use per-store video quotas.'
              : isAr
                ? 'مزود الصور غير متصل. ضع مفتاح جيميني على خادم واجهة البرمجة ثم أعد المحاولة. لن نعرض صوراً وهمية.'
                : 'Image provider not connected. Set GEMINI_API_KEY on the API server, then retry. We never show fake images.'}
          </div>
        </div>
      )}

      {/* Prompt */}
      <div
        className="rounded-2xl border p-4 space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <label className="text-xs font-black block">
          {isAr ? 'الوصف (الموجه)' : 'Prompt'}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={
            isAr
              ? 'مثال: باقة ورد جوري فاخرة على طاولة رخامية بإضاءة ناعمة لمتجر سعودي'
              : 'e.g. Luxury red rose bouquet on marble table, soft studio light, Saudi gift shop style'
          }
          className="w-full rounded-xl border px-3 py-2.5 text-sm resize-y min-h-[96px]"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
          }}
        />

        <div className="flex flex-wrap gap-2">
          {ASPECTS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAspect(a.id)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold border"
              style={{
                borderColor: aspect === a.id ? 'transparent' : 'var(--border)',
                background:
                  aspect === a.id
                    ? 'color-mix(in srgb, #0d9488 20%, transparent)'
                    : 'transparent',
                color: 'var(--text)',
              }}
            >
              {isAr ? a.labelAr : a.labelEn}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between pt-1">
          <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `المتبقي هذا الشهر:${remaining}من${limit}(مستخدم${used})`
              : `Remaining this month: ${remaining} of ${limit} (used ${used})`}
          </span>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={generating || remaining <= 0}
            aria-busy={generating}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2 disabled:opacity-50 unity-btn-primary"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating
              ? isAr
                ? 'جارٍ التوليد…'
                : 'Generating…'
              : isAr
                ? 'توليد وحفظ في المكتبة'
                : 'Generate & save to library'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && previewUrl ? (
        <div
          className="rounded-2xl border p-4 space-y-3"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div className="text-xs font-black">
            {isAr ? 'النتيجة' : 'Result'}
          </div>
          <div className="rounded-xl overflow-hidden border bg-black/5 max-h-[480px] flex items-center justify-center"
            style={{ borderColor: 'var(--border)' }}
          >
            <img
              src={previewUrl}
              alt={result.media.file_name}
              className="max-w-full max-h-[480px] object-contain"
            />
          </div>
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
        </div>
      ) : null}

      {errorCode ? (
        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
          {isAr ? 'رمز الحالة:' : 'Status code:'} {errorCode}
        </p>
      ) : null}

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
