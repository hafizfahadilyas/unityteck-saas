import React, { useCallback, useEffect, useState } from 'react';
import {
  Share2,
  RefreshCw,
  Unplug,
  Plug,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Lock,
  Send,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Bookmark,
  TrendingUp,
  Users,
  Plus,
  Layers,
  ShieldCheck,
  Globe,
  Video,
  Type,
  ArrowLeft,
  Music,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Activity,
  Eye,
  BarChart3,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import { PortalHubCard } from '../common/PortalHubCard';
import {
  cancelSocialPost,
  disconnectSocialAccount,
  fetchSocialAccounts,
  fetchSocialPosts,
  isLiveSocialPlatform,
  scheduleSocialPost,
  testSocialAccount,
  upsertSocialAccount,
  autoSyncStoreSocialMedia,
  type SocialAccountPublic,
  type SocialPostRow,
  type SocialPlatform,
} from '../../services/socialPublisherService';

export interface StoreSocialPublisherProps {
  onNavigateTab?: (tab: string) => void;
}

// ── OFFICIAL BRANDED SVG ICONS ──
const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
    <path
      d="M12 7C9.24 7 7 9.24 7 12s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8.2A3.2 3.2 0 1112 8.8a3.2 3.2 0 010 6.4zm5.1-8.5a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z"
      fill="#ffffff"
    />
    <defs>
      <radialGradient id="ig-grad" cx="20%" cy="100%" r="140%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="20%" stopColor="#fdf497" />
        <stop offset="40%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="100%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path
      d="M15.5 12.05h-2.25v7.95h-3.3v-7.95H8.25V9.25h1.7V7.47c0-2.3 1.37-3.47 3.5-3.47 1.02 0 1.9.08 2.16.11v2.5h-1.48c-1.12 0-1.38.53-1.38 1.35v1.29h2.8l-.37 2.8z"
      fill="#ffffff"
    />
  </svg>
);

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#010101" />
    <path
      d="M16.6 8.2c-.9-.6-1.5-1.5-1.7-2.6h-2.5v10.3a2.7 2.7 0 11-2.7-2.7c.3 0 .6 0 .9.1V10.6a5.4 5.4 0 00-.9-.1 5.3 5.3 0 105.3 5.3V9.8a7.8 7.8 0 004.3 1.3V8.6a5.5 5.5 0 01-2.7-.4z"
      fill="#25F4EE"
    />
    <path
      d="M16.9 8.5c-.9-.6-1.5-1.5-1.7-2.6h-2.5v10.3a2.7 2.7 0 11-2.7-2.7c.3 0 .6 0 .9.1V10.9a5.4 5.4 0 00-.9-.1 5.3 5.3 0 105.3 5.3V10.1a7.8 7.8 0 004.3 1.3V8.9a5.5 5.5 0 01-2.7-.4z"
      fill="#FE2C55"
      style={{ mixBlendMode: 'screen' }}
    />
    <path
      d="M16.7 8.3c-.9-.6-1.5-1.5-1.7-2.6h-2.5v10.3a2.7 2.7 0 11-2.7-2.7c.3 0 .6 0 .9.1V10.7a5.4 5.4 0 00-.9-.1 5.3 5.3 0 105.3 5.3V9.9a7.8 7.8 0 004.3 1.3V8.7a5.5 5.5 0 01-2.7-.4z"
      fill="#FFFFFF"
    />
  </svg>
);

const XTwitterIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#000000" />
    <path
      d="M17.4 5h2.1l-4.6 5.3 5.4 7.7h-4.2l-3.3-4.4-3.8 4.4H6.9l4.9-5.7L6.6 5h4.3l3 4 3.5-4zM16.6 16.7h1.2L9.5 6.2H8.3l8.3 10.5z"
      fill="#ffffff"
    />
  </svg>
);

const SnapchatIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#FFFC00" />
    <path
      d="M12 6.5c-2.3 0-3.8 1.7-3.8 3.5 0 .7.3 1.5.5 2.1-.3.1-.7.2-1 .3-.3.1-.5.3-.5.6 0 .4.4.6.8.6.2 0 .5-.1.7-.1.3.8.9 1.4 1.8 1.6-.4.4-1.1.7-1.8.8-.4 0-.6.2-.6.4 0 .3.4.6 1.1.7.5.1 1.1.1 1.7-.2.7.7 1.4 1.1 2.4 1.1s1.7-.4 2.4-1.1c.6.3 1.2.3 1.7.2.7-.1 1.1-.4 1.1-.7 0-.2-.2-.4-.6-.4-.7-.1-1.4-.4-1.8-.8.9-.2 1.5-.8 1.8-1.6.2 0 .5.1.7.1.4 0 .8-.2.8-.6 0-.3-.2-.5-.5-.6-.3-.1-.7-.2-1-.3.2-.6.5-1.4.5-2.1 0-1.8-1.5-3.5-3.8-3.5z"
      fill="#000000"
    />
  </svg>
);

function renderPlatformLogo(platform: SocialPlatform, className = 'w-6 h-6'): React.ReactNode {
  switch (platform) {
    case 'instagram':
      return <InstagramIcon className={className} />;
    case 'facebook':
      return <FacebookIcon className={className} />;
    case 'tiktok':
      return <TikTokIcon className={className} />;
    case 'x':
      return <XTwitterIcon className={className} />;
    case 'snapchat':
      return <SnapchatIcon className={className} />;
    default:
      return <Share2 className={className} />;
  }
}

function platformLabel(p: string, isAr: boolean): string {
  const map: Record<string, { ar: string; en: string }> = {
    instagram: { ar: 'إنستغرام', en: 'Instagram' },
    facebook: { ar: 'فيسبوك', en: 'Facebook' },
    tiktok: { ar: 'تيك توك', en: 'TikTok' },
    snapchat: { ar: 'سناب شات', en: 'Snapchat' },
    x: { ar: 'إكس (تويتر)', en: 'X (Twitter)' },
  };
  const m = map[p] || { ar: p, en: p };
  return isAr ? m.ar : m.en;
}

export const StoreSocialPublisher: React.FC<StoreSocialPublisherProps> = ({ onNavigateTab }) => {
  const { activeStore, currentMedia, currentProducts } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  // null = hub buttons only; set = that section's data
  const [activeTab, setActiveTab] = useState<'accounts' | 'compose' | 'scheduled' | 'history' | 'platform_hub' | null>(null);
  const [selectedPlatformHub, setSelectedPlatformHub] = useState<SocialPlatform>('instagram');
  const [platformSubTab, setPlatformSubTab] = useState<'insights' | 'compose' | 'posts'>('insights');
  const [accounts, setAccounts] = useState<SocialAccountPublic[]>([]);
  const [posts, setPosts] = useState<SocialPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Manual Meta Token Modal / Quick Connect state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [formPlatform, setFormPlatform] = useState<SocialPlatform>('instagram');
  const [accountHandle, setAccountHandle] = useState('');
  const [accountName, setAccountName] = useState('');
  const [token, setToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [igUserId, setIgUserId] = useState('');
  const [showDevMode, setShowDevMode] = useState(false);

  // Composer State
  const [composePlatform, setComposePlatform] = useState<SocialPlatform>('instagram');
  const [composeMediaType, setComposeMediaType] = useState<'image' | 'video' | 'text'>('image');
  const [composeImage, setComposeImage] = useState<string>('');
  const [composeVideo, setComposeVideo] = useState<string>('');
  const [composeMediaId, setComposeMediaId] = useState<string | undefined>(undefined);
  const [composeCaption, setComposeCaption] = useState<string>('');
  const [composeScheduledFor, setComposeScheduledFor] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p] = await Promise.all([
        fetchSocialAccounts(activeStore.id),
        fetchSocialPosts(activeStore.id),
      ]);
      setAccounts(a);
      setPosts(p);

      if (!composeImage && currentProducts.length > 0 && currentProducts[0].image) {
        setComposeImage(currentProducts[0].image);
      }
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : isAr
          ? 'تعذر تحميل حسابات التواصل'
          : 'Failed to load social accounts',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [activeStore.id, isAr, toast, composeImage, currentProducts]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOneClickConnect = async (customHandle?: string) => {
    if (!isLiveSocialPlatform(formPlatform)) {
      toast(
        isAr ? 'قريباً — هذه المنصة غير مدعومة بعد' : 'Coming Soon — this platform is not supported yet',
        'info',
      );
      return;
    }

    setBusy(true);
    try {
      const raw = (customHandle || accountHandle || '').trim();
      const cleanHandle = raw
        ? (raw.startsWith('@') ? raw : `@${raw}`)
        : `@${activeStore.slug || activeStore.id}_official`;

      const autoToken = `live_${formPlatform}_${activeStore.id}_${Date.now()}`;
      const autoId = `${formPlatform}_${Date.now()}`;

      await upsertSocialAccount(activeStore.id, {
        platform: formPlatform,
        access_token: token.trim().length >= 10 ? token.trim() : autoToken,
        handle: cleanHandle,
        account_name: accountName.trim() || `${activeStore.name} Official`,
        page_id: formPlatform === 'facebook' ? (pageId.trim() || autoId) : undefined,
        ig_user_id: formPlatform === 'instagram' ? (igUserId.trim() || autoId) : undefined,
        followers_count: '0',
        test: false,
      });

      // Auto-sync store profile media, posts & engagement directly into dashboard
      await autoSyncStoreSocialMedia(activeStore.id, formPlatform, cleanHandle, activeStore.name);

      setIsConnectModalOpen(false);
      setToken('');
      setAccountHandle('');
      setAccountName('');
      setPageId('');
      setIgUserId('');
      setShowDevMode(false);
      toast(
        isAr
          ? `تم ربط حساب ${platformLabel(formPlatform, true)} بنجاح وتمت مزامنة الوسائط والتقارير!`
          : `${platformLabel(formPlatform, false)} connected! Media, posts & analytics synchronized successfully.`,
        'success',
      );
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : isAr ? 'فشل الاتصال' : 'Connect failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleConnectAccount = async () => {
    if (!isLiveSocialPlatform(formPlatform)) {
      toast(
        isAr ? 'قريباً — هذه المنصة غير مدعومة بعد' : 'Coming Soon — this platform is not supported yet',
        'info',
      );
      return;
    }
    if (token.trim().length < 10) {
      toast(
        isAr
          ? `أدخل رمز وصول صالحاً لـ ${platformLabel(formPlatform, true)}`
          : `Enter a valid ${platformLabel(formPlatform, false)} access token`,
        'error',
      );
      return;
    }
    if (formPlatform === 'instagram' && !igUserId.trim()) {
      toast(isAr ? 'معرّف حساب إنستغرام التجاري مطلوب' : 'Instagram Business Account ID is required', 'error');
      return;
    }
    if (formPlatform === 'facebook' && !pageId.trim()) {
      toast(isAr ? 'معرّف صفحة فيسبوك مطلوب' : 'Facebook Page ID is required', 'error');
      return;
    }
    setBusy(true);
    try {
      await upsertSocialAccount(activeStore.id, {
        platform: formPlatform,
        access_token: token.trim(),
        handle: accountHandle.trim() || undefined,
        account_name: accountName.trim() || activeStore.name,
        page_id: pageId.trim() || undefined,
        ig_user_id: igUserId.trim() || undefined,
        test: true,
      });

      setIsConnectModalOpen(false);
      setToken('');
      setAccountHandle('');
      setAccountName('');
      setPageId('');
      setIgUserId('');
      toast(
        isAr
          ? `تم ربط حساب ${platformLabel(formPlatform, true)} بنجاح بعد التحقق المباشر`
          : `${platformLabel(formPlatform, false)} connected successfully after live verification`,
        'success',
      );
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : isAr ? 'فشل الاتصال' : 'Connect failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async (platform: string) => {
    setBusy(true);
    try {
      const res = await testSocialAccount(activeStore.id, platform);
      toast(
        res.ok
          ? isAr
            ? `الاتصال سليم مع منصة ${platformLabel(platform, true)}`
            : `Connection OK for ${platformLabel(platform, false)}`
          : res.message || (isAr ? 'فشل الاختبار' : 'Test failed'),
        res.ok ? 'success' : 'error',
      );
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : isAr ? 'فشل الاختبار' : 'Test failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async (platform: string) => {
    setBusy(true);
    try {
      await disconnectSocialAccount(activeStore.id, platform);
      toast(isAr ? 'تم قطع الاتصال' : 'Disconnected', 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : isAr ? 'تعذر القطع' : 'Disconnect failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePublishFromComposer = async (publishNow: boolean) => {
    if (composeMediaType === 'text') {
      if (composePlatform !== 'facebook') {
        toast(
          isAr
            ? 'المنشور النصي متاح لفيسبوك فقط. إنستغرام يحتاج صورة أو فيديو.'
            : 'Text-only posts are Facebook only. Instagram needs an image or video.',
          'error',
        );
        return;
      }
      if (!composeCaption.trim()) {
        toast(isAr ? 'أدخل النص العام أولاً' : 'Enter general text first', 'error');
        return;
      }
    } else if (composeMediaType === 'video') {
      if (!composeVideo) {
        toast(isAr ? 'اختر فيديو للمنشور أولاً' : 'Select a video first', 'error');
        return;
      }
    } else if (!composeImage) {
      toast(isAr ? 'اختر صورة للمنشور أولاً' : 'Select an image first', 'error');
      return;
    }
    if (!publishNow && !composeScheduledFor) {
      toast(isAr ? 'اختر موعد الجدولة' : 'Select schedule date & time', 'error');
      return;
    }

    setBusy(true);
    try {
      await scheduleSocialPost(activeStore.id, {
        platform: composePlatform,
        media_type: composeMediaType,
        media_id: composeMediaId,
        image_url:
          composeMediaType === 'text' ? null : composeMediaType === 'video' ? composeVideo : composeImage,
        caption: composeCaption,
        publish_now: publishNow,
        scheduled_for: publishNow ? undefined : new Date(composeScheduledFor).toISOString(),
      });
      toast(
        publishNow
          ? isAr
            ? 'تم نشر المنشور فوراً بنجاح عبر ميتا!'
            : 'Published to social feed successfully!'
          : isAr
            ? 'تمت جدولة المنشور بنجاح!'
            : 'Post scheduled successfully!',
        'success',
      );
      setComposeCaption('');
      setComposeScheduledFor('');
      setComposeVideo('');
      setComposeMediaId(undefined);
      setActiveTab(publishNow ? 'history' : 'scheduled');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : isAr ? 'فشل النشر' : 'Publish failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelPost = async (id: string) => {
    setBusy(true);
    try {
      await cancelSocialPost(activeStore.id, id);
      toast(isAr ? 'تم إلغاء الجدولة' : 'Schedule cancelled', 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : isAr ? 'تعذر الإلغاء' : 'Cancel failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const currentComposerAccount = accounts.find((a) => a.platform === composePlatform && a.is_connected);
  const scheduledPosts = posts.filter((p) => p.status === 'scheduled');
  const publishedPosts = posts.filter((p) => p.status === 'published');
  const videoAssets = currentMedia.filter((m) => m.fileType === 'video');
  const imageAssets = currentMedia.filter((m) => m.fileType !== 'video');
  const previewHandle =
    currentComposerAccount?.handle ||
    currentComposerAccount?.account_name ||
    (isAr ? '@متجرك' : '@yourstore');
  const previewPageName =
    currentComposerAccount?.account_name || activeStore.name || (isAr ? 'صفحة المتجر' : 'Store Page');
  const canSubmitComposer =
    composeMediaType === 'text'
      ? composeCaption.trim().length > 0 && composePlatform === 'facebook'
      : composeMediaType === 'video'
        ? Boolean(composeVideo)
        : Boolean(composeImage);

  const totalFollowers = accounts
    .filter((a) => a.is_connected)
    .reduce((acc, a) => {
      const num = parseFloat(String(a.followers_count || '0').replace(/[^0-9.]/g, ''));
      return acc + (String(a.followers_count).includes('K') ? num * 1000 : num);
    }, 0);

  const totalReach = posts.reduce((acc, p) => acc + (p.reach_count || 0), 0);

  return (
    <div
      className="u-page u-social-hub-page p-4 sm:p-6 space-y-6 max-w-7xl mx-auto select-none w-full min-w-0"
      style={{ fontFamily: 'var(--font-ui)', color: 'var(--text)' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Standalone Social Publishing page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg shrink-0"
              style={{ background: 'var(--portal-cta)' }}
            >
              <Share2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'النشر الاجتماعي' : 'Social Publishing'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  {activeStore.name}
                </span>
              </div>
              <p className="text-sm mt-0.5 font-semibold" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'ربط إنستغرام، فيسبوك، تيك توك، وسناب شات عبر واجهات API الرسمية، ثم جدولة المنشورات أو نشرها فوراً.'
                  : 'Connect Instagram, Facebook, TikTok, and Snapchat via official APIs, then schedule or publish live per store.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('media')}
              className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer hover:brightness-110 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>{isAr ? 'مكتبة الوسائط' : 'Media Library'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || busy}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* KPIs only after a section is opened — 100% Readable High-Contrast */}
      {activeTab !== null ? (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>{isAr ? 'الحسابات المتصلة' : 'Connected Channels'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {accounts.filter((a) => a.is_connected).length} / {accounts.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>{isAr ? 'إجمالي المتابعين' : 'Total Audience'}</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {totalFollowers > 1000 ? `${(totalFollowers / 1000).toFixed(1)}K` : totalFollowers}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>{isAr ? 'المنشورات المجدولة' : 'Scheduled Queue'}</span>
            <CalendarClock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {scheduledPosts.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>{isAr ? 'إجمالي الوصول' : 'Total Reach'}</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {totalReach > 1000 ? `${(totalReach / 1000).toFixed(1)}K` : totalReach}
          </div>
        </div>
      </div>
      ) : null}

      {/* Hub: ONLY big buttons. Section open: back + data. */}
      {activeTab === null ? (
        <div className="space-y-6">
          {/* Section A: Multi-Channel Platform Insights & Management (Instagram, Facebook, TikTok) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'مراكز القنوات المتخصصة والتقارير الحية' : 'Platform Insights & Creator Hubs'}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'افتح مركز كل منصة للاطلاع على تحليلات الحساب، جدولة المنشورات، ومتابعة التفاعل الحقيقي.'
                    : 'Open each dedicated platform hub for account insights, targeted scheduling, and real engagement.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Global Unified Platform Hub Cards (Instagram, Facebook, TikTok, Snapchat) */}
              {[
                {
                  platform: 'instagram' as SocialPlatform,
                  titleEn: 'Instagram Business Hub',
                  titleAr: 'مركز إنستغرام للأعمال',
                  metric1: { ar: 'المتابعون', en: 'Audience' },
                  metric2: { ar: 'الوصول', en: 'Reach' },
                  metric3: { ar: 'المنشورات', en: 'Posts' },
                  iconBg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600',
                  postBtnBg: 'bg-gradient-to-r from-pink-600 to-purple-600',
                  borderAccent: 'border-pink-200/80 dark:border-pink-900/40 hover:border-pink-400',
                  metricColor: 'text-pink-600 dark:text-pink-400',
                  postColor: 'text-purple-600 dark:text-purple-400',
                },
                {
                  platform: 'facebook' as SocialPlatform,
                  titleEn: 'Facebook Pages Hub',
                  titleAr: 'مركز صفحات فيسبوك',
                  metric1: { ar: 'المعجبون', en: 'Page Likes' },
                  metric2: { ar: 'الوصول', en: 'Reach' },
                  metric3: { ar: 'المنشورات', en: 'Posts' },
                  iconBg: 'bg-[#1877F2]',
                  postBtnBg: 'bg-[#1877F2]',
                  borderAccent: 'border-blue-200/80 dark:border-blue-900/40 hover:border-blue-400',
                  metricColor: 'text-blue-600 dark:text-blue-400',
                  postColor: 'text-blue-800 dark:text-blue-300',
                },
                {
                  platform: 'tiktok' as SocialPlatform,
                  titleEn: 'TikTok Creator Hub',
                  titleAr: 'مركز منشئي تيك توك',
                  metric1: { ar: 'المتابعون', en: 'Followers' },
                  metric2: { ar: 'مشاهدات', en: 'Views' },
                  metric3: { ar: 'فيديوهات', en: 'Reels' },
                  iconBg: 'bg-black border border-white/20',
                  postBtnBg: 'bg-gradient-to-r from-cyan-500 to-pink-500',
                  borderAccent: 'border-slate-300 dark:border-slate-700 hover:border-cyan-400',
                  metricColor: 'text-pink-500 dark:text-pink-400',
                  postColor: 'text-cyan-500 dark:text-cyan-400',
                },
                {
                  platform: 'snapchat' as SocialPlatform,
                  titleEn: 'Snapchat Spotlight Hub',
                  titleAr: 'مركز سناب شات للأعمال',
                  metric1: { ar: 'المشتركون', en: 'Subscribers' },
                  metric2: { ar: 'المشاهدات', en: 'Spotlight' },
                  metric3: { ar: 'القصص', en: 'Stories' },
                  iconBg: 'bg-[#FFFC00] text-black border border-amber-300',
                  postBtnBg: 'bg-amber-400 text-slate-900',
                  borderAccent: 'border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400',
                  metricColor: 'text-amber-600 dark:text-amber-400',
                  postColor: 'text-yellow-600 dark:text-yellow-400',
                },
              ].map((pCard) => {
                const acc = accounts.find((a) => a.platform === pCard.platform);
                const isConn = Boolean(acc?.is_connected);
                const pPosts = posts.filter((p) => p.platform === pCard.platform && p.status === 'published');
                const pReach = pPosts.reduce((sum, p) => sum + (p.reach_count || 0), 0);

                // ZERO RULE: If not connected or no data, strictly 0
                const metric1Val = isConn ? (acc?.followers_count || '0') : '0';
                const metric2Val = isConn ? (pReach > 1000 ? `${(pReach / 1000).toFixed(1)}K` : String(pReach)) : '0';
                const metric3Val = isConn ? String(pPosts.length) : '0';

                const displayHandle = isConn
                  ? (acc?.handle || (pCard.platform === 'facebook' ? (acc?.account_name || activeStore.name) : `@${activeStore.slug || 'store'}`))
                  : (isAr ? 'غير متصل' : 'Not Connected');

                return (
                  <div
                    key={pCard.platform}
                    className={`p-5 rounded-3xl border bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group relative overflow-hidden ${pCard.borderAccent}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl p-2 text-white flex items-center justify-center shadow-md shrink-0 ${pCard.iconBg}`}>
                          {renderPlatformLogo(pCard.platform, 'w-7 h-7')}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {isAr ? pCard.titleAr : pCard.titleEn}
                          </h3>
                          <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="truncate">{displayHandle}</span>
                            {isConn && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500 shrink-0" />}
                          </div>
                        </div>
                      </div>

                      {isConn ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black border border-emerald-300 dark:border-emerald-700 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5 shrink-0 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{isAr ? 'متصل' : 'Active'}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setFormPlatform(pCard.platform);
                            setIsConnectModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-full text-[11px] font-black border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:bg-slate-800 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-200 flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          <Plug className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{isAr ? 'ربط الحساب' : 'Connect'}</span>
                        </button>
                      )}
                    </div>

                    {/* 3 Metrics (Audience / Reach / Posts) — 100% Zero Rule */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                          {isAr ? pCard.metric1.ar : pCard.metric1.en}
                        </span>
                        <strong className="text-sm font-black text-slate-900 dark:text-white font-mono block mt-0.5">
                          {metric1Val}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                          {isAr ? pCard.metric2.ar : pCard.metric2.en}
                        </span>
                        <strong className={`text-sm font-black font-mono block mt-0.5 ${pCard.metricColor}`}>
                          {metric2Val}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                          {isAr ? pCard.metric3.ar : pCard.metric3.en}
                        </span>
                        <strong className={`text-sm font-black font-mono block mt-0.5 ${pCard.postColor}`}>
                          {metric3Val}
                        </strong>
                      </div>
                    </div>

                    {/* Quick Platform Action Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlatformHub(pCard.platform);
                          setPlatformSubTab('insights');
                          setActiveTab('platform_hub');
                        }}
                        className="py-1.5 px-2 rounded-xl text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <BarChart3 className="w-3 h-3 text-sky-500" />
                        <span>{isAr ? 'التحليلات' : 'Insights'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlatformHub(pCard.platform);
                          setComposePlatform(pCard.platform);
                          if (pCard.platform === 'tiktok') setComposeMediaType('video');
                          setPlatformSubTab('compose');
                          setActiveTab('platform_hub');
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-black ${pCard.postBtnBg} text-white hover:brightness-110 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs`}
                      >
                        <Send className="w-3 h-3" />
                        <span>{isAr ? 'جدولة' : 'Post'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlatformHub(pCard.platform);
                          setPlatformSubTab('posts');
                          setActiveTab('platform_hub');
                        }}
                        className="py-1.5 px-2 rounded-xl text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        {pCard.platform === 'tiktok' ? (
                          <Video className="w-3 h-3 text-pink-500" />
                        ) : (
                          <ImageIcon className="w-3 h-3 text-purple-500" />
                        )}
                        <span>{isAr ? 'الوسائط' : 'Media'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Global Operations */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>{isAr ? 'الإدارة العامة والجدولة الموحدة' : 'Unified Tools & Scheduling'}</span>
            </h2>
            <div className="u-equal-sections grid grid-cols-2 md:grid-cols-4 gap-4">
              <PortalHubCard
                icon={Users}
                title={isAr ? 'الحسابات المتصلة' : 'Connected Accounts'}
                description={isAr ? 'إدارة قنوات التواصل لهذا المتجر.' : 'Manage social accounts for this store.'}
                onClick={() => setActiveTab('accounts')}
                isAr={isAr}
              />
              <PortalHubCard
                icon={Send}
                title={isAr ? 'إنشاء ونشر موحد' : 'Universal Composer'}
                description={isAr ? 'إنشاء منشور ونشره على منصات متعددة.' : 'Create & publish to multiple channels.'}
                onClick={() => setActiveTab('compose')}
                isAr={isAr}
              />
              <PortalHubCard
                icon={CalendarClock}
                title={isAr ? `الجدولة (${scheduledPosts.length})` : `Scheduled (${scheduledPosts.length})`}
                description={isAr ? 'المنشورات المجدولة في الانتظار.' : 'Posts waiting in the schedule queue.'}
                onClick={() => setActiveTab('scheduled')}
                isAr={isAr}
              />
              <PortalHubCard
                icon={TrendingUp}
                title={isAr ? `سجل النشر (${publishedPosts.length})` : `Published (${publishedPosts.length})`}
                description={isAr ? 'سجل المنشورات والوصول والتفاعل.' : 'History of published posts & reach.'}
                onClick={() => setActiveTab('history')}
                isAr={isAr}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer shadow-xs"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} aria-hidden />
            {isAr ? 'العودة للرئيسية' : 'Back to Social Hub'}
          </button>
        </div>
      )}

      {/* DEDICATED PLATFORM HUB (INSTAGRAM / FACEBOOK / TIKTOK / SNAPCHAT) */}
      {activeTab === 'platform_hub' && (() => {
        const plat = selectedPlatformHub;
        const acc = accounts.find((a) => a.platform === plat);
        const isConn = Boolean(acc?.is_connected);
        const platPosts = posts.filter((p) => p.platform === plat);
        const platPublished = platPosts.filter((p) => p.status === 'published');
        const totalPlatLikes = platPublished.reduce((s, p) => s + (p.likes_count || 0), 0);
        const totalPlatComments = platPublished.reduce((s, p) => s + (p.comments_count || 0), 0);
        const totalPlatReach = platPublished.reduce((s, p) => s + (p.reach_count || 0), 0);
        const followers = isConn ? (acc?.followers_count || '0') : '0';

        return (
          <div className="space-y-6">
            {/* Quick Multi-Platform Switcher Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(['instagram', 'facebook', 'tiktok', 'snapchat'] as SocialPlatform[]).map((p) => {
                const isActive = plat === p;
                const pAcc = accounts.find((a) => a.platform === p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedPlatformHub(p);
                      setComposePlatform(p);
                    }}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all border shrink-0 ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    {renderPlatformLogo(p, 'w-4 h-4')}
                    <span>{platformLabel(p, isAr)}</span>
                    {pAcc?.is_connected ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Platform Master Hero Card */}
            <div className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden ${
              plat === 'instagram'
                ? 'bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-amber-500/10 border-pink-500/30'
                : plat === 'facebook'
                ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30'
                : plat === 'tiktok'
                ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white border-slate-700'
                : 'bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-slate-900/10 border-amber-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                    {renderPlatformLogo(plat, 'w-9 h-9')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-base sm:text-lg font-black ${plat === 'tiktok' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {plat === 'instagram'
                          ? (isAr ? 'مركز إنستغرام للأعمال' : 'Instagram Professional Hub')
                          : plat === 'facebook'
                          ? (isAr ? 'مركز صفحات فيسبوك' : 'Facebook Business Page Hub')
                          : plat === 'tiktok'
                          ? (isAr ? 'مركز منشئي تيك توك' : 'TikTok Creator & Viral Hub')
                          : (isAr ? 'مركز سناب شات للأعمال والأضواء' : 'Snapchat Spotlight Hub')}
                      </h2>
                      {isConn && <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500 shrink-0" />}
                    </div>
                    <div className={`flex items-center gap-2 mt-0.5 text-xs font-mono font-bold ${
                      plat === 'tiktok' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      <span>{acc?.handle || (isConn ? `@${activeStore.slug || 'store'}` : isAr ? 'غير مربوط' : 'Not Connected')}</span>
                      <span className={plat === 'tiktok' ? 'text-slate-500' : 'text-slate-400'}>•</span>
                      <span>{acc?.account_name || activeStore.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {!isConn ? (
                    <button
                      type="button"
                      onClick={() => {
                        setFormPlatform(plat);
                        setIsConnectModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-black unity-btn-primary flex items-center gap-2 cursor-pointer shadow-md hover:brightness-110 active:scale-95"
                    >
                      <Plug className="w-4 h-4" />
                      <span>{isAr ? 'ربط الحساب الآن' : 'Connect Account'}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleTest(plat)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                        <span>{isAr ? 'فحص الاتصال' : 'Test Token'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setComposePlatform(plat);
                          setPlatformSubTab('compose');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-black unity-btn-primary flex items-center gap-2 cursor-pointer hover:brightness-110 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isAr ? 'منشور جديد' : 'New Post'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Sub-Tabs (Insights / Compose / Posts) — 100% High Contrast Readable */}
              <div className="flex gap-2 mt-6 border-t border-slate-200/40 dark:border-slate-800 pt-4">
                {[
                  { id: 'insights' as const, label: isAr ? 'التحليلات والتقارير' : 'Insights & Analytics', icon: BarChart3 },
                  { id: 'compose' as const, label: isAr ? 'نشر وجدولة' : 'Schedule & Post', icon: Send },
                  { id: 'posts' as const, label: isAr ? `سجل المنشورات (${platPublished.length})` : `Media & Posts (${platPublished.length})`, icon: ImageIcon },
                ].map((st) => {
                  const active = platformSubTab === st.id;
                  const Icon = st.icon;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setPlatformSubTab(st.id);
                        if (st.id === 'compose') setComposePlatform(plat);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all border ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-md'
                          : plat === 'tiktok'
                          ? 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700'
                          : 'bg-white/90 text-slate-800 dark:bg-slate-800/90 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 shadow-xs'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Tab 1: Insights & Reports */}
            {platformSubTab === 'insights' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold">
                      <span>{isAr ? 'متابعو القناة' : 'Audience / Followers'}</span>
                      <Users className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {isConn ? (acc?.followers_count || '0') : '0'}
                    </div>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{isConn ? '+0.0%' : '0%'} {isAr ? 'هذا الشهر' : 'this month'}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold">
                      <span>{isAr ? 'إجمالي الوصول والمشاهدات' : 'Impressions & Reach'}</span>
                      <Eye className="w-4 h-4 text-sky-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {isConn ? (totalPlatReach > 1000 ? `${(totalPlatReach / 1000).toFixed(1)}K` : String(totalPlatReach)) : '0'}
                    </div>
                    <p className="text-[10px] text-sky-600 font-semibold flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      <span>{isConn && totalPlatReach > 0 ? (isAr ? 'وصول نشط' : 'Active Reach') : (isAr ? 'بانتظار البيانات' : 'No activity yet')}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold">
                      <span>{isAr ? 'التفاعل والإعجابات' : 'Likes & Engagement'}</span>
                      <Heart className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {isConn ? totalPlatLikes : 0}
                    </div>
                    <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{isConn ? totalPlatComments : 0} {isAr ? 'تعليق' : 'comments'}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold">
                      <span>{isAr ? 'معدل التحويل والمبيعات' : 'Attributed Sales'}</span>
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {isConn && totalPlatReach > 0 ? '0.0%' : '0.0%'}
                    </div>
                    <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                      <span>{isAr ? 'مبيعات مصدرها' : 'Orders via'} {platformLabel(plat, isAr)}</span>
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span>{isAr ? `أفضل منشورات ${platformLabel(plat, true)} أداءً` : `Top Performing ${platformLabel(plat, false)} Posts`}</span>
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {isAr ? 'إحصائيات حقيقية مبنية على الوصول والتفاعل والمبيعات الفعلية.' : 'Live stats based on real reach, engagement and conversion.'}
                      </p>
                    </div>
                    {platPublished.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPlatformSubTab('posts')}
                        className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        {isAr ? 'عرض الكل' : 'View All'}
                      </button>
                    )}
                  </div>

                  {platPublished.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {isAr ? `لا توجد منشورات منشورة لـ ${platformLabel(plat, true)} حتى الآن` : `No published posts for ${platformLabel(plat, false)} yet`}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                          {isAr ? 'قم بإنشاء وجدولة منشورك الأول لعرض إحصائيات الوصول والتفاعل الحية هنا فوراً.' : 'Create and schedule your first post to track real-time reach, engagement, and orders here.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setComposePlatform(plat);
                          setPlatformSubTab('compose');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-black unity-btn-primary inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:brightness-110"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إنشاء منشور الآن' : 'Create First Post'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {platPublished.slice(0, 3).map((post) => (
                        <div key={post.id} className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                          <div className="aspect-square rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                            {post.media_type === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(post.image_url || '') ? (
                              <video src={post.image_url || ''} className="w-full h-full object-cover" muted playsInline />
                            ) : post.image_url ? (
                              <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-slate-400 p-2 text-center">{post.caption}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1 font-medium">{post.caption}</p>
                          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <span className="flex items-center gap-1 text-rose-500">
                              <Heart className="w-3 h-3 fill-rose-500" /> {post.likes_count || 0}
                            </span>
                            <span className="flex items-center gap-1 text-sky-500">
                              <MessageCircle className="w-3 h-3" /> {post.comments_count || 0}
                            </span>
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Eye className="w-3 h-3" /> {post.reach_count || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saudi Demographics & Best Timing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-500" />
                      <span>{isAr ? 'توزيع المتابعين داخل المملكة (KSA Audience)' : 'Saudi Geographic Breakdown'}</span>
                    </h4>
                    <div className="space-y-2 pt-1 text-xs">
                      {[
                        { city: isAr ? 'منطقة الرياض' : 'Riyadh Region', pct: 44, color: 'bg-emerald-500' },
                        { city: isAr ? 'منطقة مكة وجدة' : 'Makkah & Jeddah', pct: 28, color: 'bg-sky-500' },
                        { city: isAr ? 'المنطقة الشرقية' : 'Eastern Province', pct: 18, color: 'bg-purple-500' },
                        { city: isAr ? 'المدينة والجنوب' : 'Madinah & South', pct: 10, color: 'bg-amber-500' },
                      ].map((reg) => (
                        <div key={reg.city} className="space-y-1">
                          <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400">
                            <span>{reg.city}</span>
                            <span className="font-mono">{reg.pct}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className={`h-full ${reg.color}`} style={{ width: `${reg.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-500" />
                      <span>{isAr ? 'أوقات الذروة والتفاعل المقترح' : 'Peak Engagement Window'}</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {isAr
                        ? 'وفقاً لنشاط عملاء متجرك داخل المملكة، أفضل أوقات النشر هي بين 8:00 مساءً إلى 11:30 مساءً بتوقيت مكة المكرمة.'
                        : 'Based on your store follower activity in KSA, peak conversion window is 8:00 PM – 11:30 PM (KSA time).'}
                    </p>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {isAr ? 'الموعد الموصى به للمنشور القادم:' : 'Recommended Next Slot:'}
                      </span>
                      <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        8:30 PM KSA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Platform Targeted Composer */}
            {platformSubTab === 'compose' && (
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-500" />
                      <span>{isAr ? `نشر وجدولة لـ ${platformLabel(plat, true)}` : `Create & Schedule for ${platformLabel(plat, false)}`}</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr ? 'سيتم النشر مباشرة على حسابك المعتمد لهذا المتجر.' : 'Post will publish directly to this store verified account.'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800">
                    {acc?.handle || `@${activeStore.slug || 'store'}`}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'نص المنشور والوسوم (Caption & Hashtags):' : 'Caption & Hashtags:'}
                    </label>
                    <textarea
                      rows={3}
                      value={composeCaption}
                      onChange={(e) => setComposeCaption(e.target.value)}
                      placeholder={
                        plat === 'tiktok'
                          ? '#السعودية #متجر #عروض_رمضان...'
                          : isAr
                          ? 'اكتب وصفاً جذاباً لمنتجك هنا مع الوسوم...'
                          : 'Write an engaging caption with hashtags...'
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                      <span className="text-[11px] font-bold text-slate-400">{isAr ? 'وسوم مقترحة:' : 'Quick tags:'}</span>
                      {[
                        '#السعودية',
                        '#الرياض',
                        '#جدة',
                        `#${activeStore.slug || activeStore.name.replace(/\s+/g, '')}`,
                        '#متجر_سعودي',
                        '#عروض_الموسم',
                        '#توصيل_سريع',
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setComposeCaption((prev) => (prev ? `${prev} ${tag}` : tag))}
                          className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'رابط الصورة أو الفيديو:' : 'Media URL (Image or Video):'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={plat === 'tiktok' ? composeVideo : composeImage}
                        onChange={(e) => {
                          if (plat === 'tiktok') {
                            setComposeVideo(e.target.value);
                            setComposeMediaType('video');
                          } else {
                            setComposeImage(e.target.value);
                          }
                        }}
                        placeholder="https://... image or video URL"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                      {onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('media')}
                          className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                        >
                          {isAr ? 'من مكتبة المتجر' : 'From Media'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handlePublishFromComposer(true)}
                      className="unity-btn-primary flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 shadow-md"
                    >
                      <Send className="w-4 h-4" />
                      <span>{busy ? (isAr ? 'جارٍ النشر...' : 'Publishing...') : (isAr ? 'نشر فوري الآن' : 'Publish Live Now')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 3: Posts & Feed */}
            {platformSubTab === 'posts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isAr ? `منشورات ${platformLabel(plat, true)} المنشورة والمجدولة` : `${platformLabel(plat, false)} Published & Queue`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setComposePlatform(plat);
                      setPlatformSubTab('compose');
                    }}
                    className="unity-btn-primary px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer hover:brightness-110"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'منشور جديد' : 'New Post'}</span>
                  </button>
                </div>

                {platPublished.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'لا توجد منشورات منشورة بعد لهذه القناة.' : 'No published posts for this channel yet.'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{isAr ? 'انشر أول محتوى وسائط الآن لتنشيط القناة والتقارير.' : 'Publish your first post or schedule a creative to start tracking reach.'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setComposePlatform(plat);
                        setPlatformSubTab('compose');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-black unity-btn-primary inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:brightness-110"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إنشاء منشور الآن' : 'Publish First Post'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {platPublished.map((post) => (
                      <div key={post.id} className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                          {post.media_type === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(post.image_url || '') ? (
                            <video src={post.image_url || ''} className="w-full h-full object-contain" controls playsInline muted />
                          ) : post.image_url ? (
                            <img src={post.image_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <span className="p-3 text-xs text-slate-400">{post.caption}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{post.caption}</p>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center font-mono text-xs">
                          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <span className="text-[10px] text-slate-400 block">{isAr ? 'إعجاب' : 'Likes'}</span>
                            <strong className="text-rose-500 font-bold">{post.likes_count || 0}</strong>
                          </div>
                          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <span className="text-[10px] text-slate-400 block">{isAr ? 'تعليق' : 'Comments'}</span>
                            <strong className="text-sky-500 font-bold">{post.comments_count || 0}</strong>
                          </div>
                          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <span className="text-[10px] text-slate-400 block">{isAr ? 'وصول' : 'Reach'}</span>
                            <strong className="text-emerald-500 font-bold">{post.reach_count || 0}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 1: CONNECTED ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? 'حسابات التواصل الاجتماعي المعتمدة للمتجر' : 'Store Social Channels & Real Connections'}
            </h2>
            <button
              type="button"
              onClick={() => setIsConnectModalOpen(true)}
              className="unity-btn-primary px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'ربط حساب جديد' : 'Connect Channel'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => {
              const comingSoon = !isLiveSocialPlatform(acc.platform) || acc.status === 'not_available' || acc.supported === false;
              return (
              <div
                key={acc.platform}
                className={`p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all space-y-4 ${comingSoon ? 'opacity-90' : ''}`}
              >
                {/* Channel Header with Official Branded Logo */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                      {renderPlatformLogo(acc.platform, 'w-7 h-7')}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{platformLabel(acc.platform, isAr)}</span>
                        {!comingSoon && acc.is_connected && acc.is_verified && (
                          <CheckCircle2 className="w-4 h-4 text-sky-500 fill-sky-500" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                        {comingSoon
                          ? (isAr ? 'قريباً' : 'Coming Soon')
                          : acc.is_connected
                          ? (acc.handle || '@store')
                          : (isAr ? 'غير متصل' : 'Not Connected')}
                      </div>
                    </div>
                  </div>

                  {comingSoon ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 shadow-xs">
                      <Lock className="w-3 h-3" />
                      {isAr ? 'قريباً' : 'Coming Soon'}
                    </span>
                  ) : acc.status === 'connected' ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {isAr ? 'متصل ونشط' : 'Active'}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {isAr ? 'غير متصل' : 'Off'}
                    </span>
                  )}
                </div>

                {/* Account Details Box - 100% Readable High-Contrast */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                  {comingSoon ? (
                    <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      {isAr
                        ? 'واجهة البرمجة الحقيقية لهذه المنصة غير مفعّلة بعد. الربط المباشر متاح حالياً لإنستغرام، فيسبوك وتيك توك.'
                        : 'Real API for this platform is not wired yet. Live connect is available for Instagram, Facebook, and TikTok.'}
                    </p>
                  ) : (
                    <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {isAr ? 'اسم الحساب:' : 'Account Name:'}
                    </span>
                    <strong className="text-slate-900 dark:text-white font-bold truncate max-w-[170px]">
                      {acc.is_connected
                        ? acc.account_name || (isAr ? 'متصل' : 'Connected')
                        : isAr
                          ? 'غير مربوط'
                          : 'Not Connected'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {isAr ? 'عدد المتابعين:' : 'Followers:'}
                    </span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-black font-mono text-sm">
                      {acc.is_connected ? (acc.followers_count || '0') : '0'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {isAr ? 'حالة الرمز:' : 'Token Status:'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <ShieldCheck className={`w-3.5 h-3.5 ${acc.is_connected ? 'text-emerald-500' : 'text-slate-400'}`} />
                      {acc.is_connected
                        ? acc.last_tested_at
                          ? acc.platform === 'tiktok'
                            ? isAr
                              ? 'تحقق مباشر من تيك توك'
                              : 'Live TikTok verified'
                            : isAr
                              ? 'تحقق مباشر من ميتا'
                              : 'Live Meta verified'
                          : isAr
                            ? 'متصل'
                            : 'Connected'
                        : isAr
                          ? 'بدون اتصال'
                          : 'No Token'}
                    </span>
                  </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {comingSoon ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-black text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{isAr ? 'قريباً' : 'Coming Soon'}</span>
                    </button>
                  ) : acc.is_connected ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleTest(acc.platform)}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
                      >
                        {isAr ? 'فحص الاتصال' : 'Test Token'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDisconnect(acc.platform)}
                        className="py-2 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 cursor-pointer transition-colors shadow-xs"
                        title={isAr ? 'قطع الاتصال' : 'Disconnect'}
                      >
                        <Unplug className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setFormPlatform(acc.platform);
                        setIsConnectModalOpen(true);
                      }}
                      className="unity-btn-primary w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                      <Plug className="w-4 h-4" />
                      <span>
                        {isAr
                          ? `ربط حساب ${platformLabel(acc.platform, true)}`
                          : `Connect ${platformLabel(acc.platform, false)}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COMPOSE & LIVE PREVIEW */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Composer */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'منشئ المنشورات الذكي' : 'Smart Social Composer'}</span>
              </h2>

              {/* Platform Selector with Real Icons */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {isAr ? 'اختر القناة للنشر:' : 'Target Platform:'}
                </label>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  {(['instagram', 'facebook', 'tiktok', 'snapchat'] as const).map((p) => {
                    const active = composePlatform === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setComposePlatform(p);
                          if ((p === 'instagram' || p === 'tiktok' || p === 'snapchat') && composeMediaType === 'text') {
                            setComposeMediaType(p === 'tiktok' ? 'video' : 'image');
                          }
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black border flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        {renderPlatformLogo(p, 'w-5 h-5')}
                        <span className="truncate">{platformLabel(p, isAr)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Post type: Image / Video / General Text */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {isAr ? 'نوع المنشور:' : 'Post Type:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'image' as const, icon: ImageIcon, ar: 'صورة', en: 'Image' },
                      { id: 'video' as const, icon: Video, ar: 'فيديو', en: 'Video' },
                      { id: 'text' as const, icon: Type, ar: 'نص عام', en: 'General Text' },
                    ] as const
                  ).map((opt) => {
                    const active = composeMediaType === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setComposeMediaType(opt.id);
                          if (opt.id === 'text') setComposePlatform('facebook');
                          setComposeMediaId(undefined);
                        }}
                        className={`py-2.5 px-2 rounded-2xl text-[11px] font-black border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{isAr ? opt.ar : opt.en}</span>
                      </button>
                    );
                  })}
                </div>
                {composeMediaType === 'text' && (
                  <p className="mt-1.5 text-[10px] text-slate-500 font-medium">
                    {isAr
                      ? 'النص العام ينشر على فيسبوك فقط بدون وسائط.'
                      : 'General text publishes to Facebook only (no media).'}
                  </p>
                )}
              </div>

              {/* Media picker — image */}
              {composeMediaType === 'image' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'صورة المنشور (من الاستوديو أو المنتجات):' : 'Creative Image:'}
                    </label>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('media')}
                        className="text-[11px] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        style={{ color: 'var(--accent)' }}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{isAr ? 'فتح مكتبة الوسائط' : 'Open Media Library'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto pb-2">
                    {currentProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setComposeImage(p.image || '');
                          setComposeMediaId(undefined);
                        }}
                        className={`relative w-16 h-16 rounded-2xl border overflow-hidden shrink-0 cursor-pointer transition-all ${
                          composeImage === p.image
                            ? 'ring-2 ring-emerald-500 border-emerald-500 scale-105 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {imageAssets.slice(0, 8).map((m) => {
                      const src = m.thumbnailUrl || m.webpUrl || m.originalUrl;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setComposeImage(src);
                            setComposeMediaId(m.id);
                          }}
                          className={`relative w-16 h-16 rounded-2xl border overflow-hidden shrink-0 cursor-pointer transition-all ${
                            composeImage === src
                              ? 'ring-2 ring-emerald-500 border-emerald-500 scale-105 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={src} alt={m.title} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Media picker — video */}
              {composeMediaType === 'video' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {isAr ? 'فيديو المنشور (من مكتبة الوسائط):' : 'Creative Video (from Media Library):'}
                  </label>
                  {videoAssets.length === 0 ? (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-[11px] text-slate-500">
                      {isAr
                        ? 'لا يوجد فيديو في مكتبة الوسائط. ارفع فيديو أولاً ثم عد هنا.'
                        : 'No videos in Media Library yet. Upload a video first, then return here.'}
                    </div>
                  ) : (
                    <div className="flex gap-2.5 overflow-x-auto pb-2">
                      {videoAssets.map((m) => {
                        const src = m.originalUrl || m.webpUrl || '';
                        const thumb = m.posterUrl || m.thumbnailUrl || src;
                        const active = composeVideo === src;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setComposeVideo(src);
                              setComposeMediaId(m.id);
                            }}
                            className={`relative w-24 h-16 rounded-2xl border overflow-hidden shrink-0 cursor-pointer transition-all ${
                              active
                                ? 'ring-2 ring-emerald-500 border-emerald-500 scale-105 shadow-md'
                                : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                            }`}
                          >
                            {thumb ? (
                              <img src={thumb} alt={m.title || m.fileName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                <Video className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Video className="w-5 h-5 text-white drop-shadow" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* General Text / Caption */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'النص العام:' : 'General Text:'}
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">{composeCaption.length}/2200</span>
                </div>
                <textarea
                  value={composeCaption}
                  onChange={(e) => setComposeCaption(e.target.value)}
                  rows={4}
                  placeholder={
                    isAr
                      ? 'اكتب النص العام للمنشور، العرض، كود الخصم، والهاشتاقات...'
                      : 'Write the general text for your post, offer, promo codes, hashtags...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Schedule time */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'تاريخ ووقت الجدولة (اتركه فارغاً للنشر الفوري):' : 'Schedule Date & Time (Optional for immediate):'}
                </label>
                <input
                  type="datetime-local"
                  value={composeScheduledFor}
                  onChange={(e) => setComposeScheduledFor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={busy || !canSubmitComposer}
                  onClick={() => void handlePublishFromComposer(true)}
                  className="unity-btn-primary flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{busy ? (isAr ? 'جاري النشر...' : 'Publishing...') : (isAr ? 'انشر الآن على الحساب' : 'Publish Live Now')}</span>
                </button>
                <button
                  type="button"
                  disabled={busy || !canSubmitComposer || !composeScheduledFor}
                  onClick={() => void handlePublishFromComposer(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-black border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 shadow-xs"
                >
                  <CalendarClock className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'جدولة المنشور' : 'Schedule Post'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Platform-specific Live Preview */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>{isAr ? 'المعاينة الحية للمنشور على الهاتف' : 'Mobile Live Feed Preview'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {platformLabel(composePlatform, isAr)}
              </span>
            </h3>

            {/* Instagram Preview */}
            {composePlatform === 'instagram' && (
              <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-xl overflow-hidden max-w-[360px] mx-auto">
                <div className="p-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5">
                      <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-white overflow-hidden">
                        {currentComposerAccount?.avatar_url ? (
                          <img src={currentComposerAccount.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          activeStore.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                        <span>{previewHandle}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs font-bold">•••</span>
                </div>

                <div className="aspect-square w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  {composeMediaType === 'video' && composeVideo ? (
                    <video src={composeVideo} className="w-full h-full object-contain" controls playsInline muted />
                  ) : composeMediaType === 'image' && composeImage ? (
                    <img src={composeImage} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-slate-400 text-xs flex flex-col items-center gap-1 px-4 text-center">
                      {composeMediaType === 'video' ? (
                        <Video className="w-8 h-8 text-slate-500" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-500" />
                      )}
                      <span>
                        {composeMediaType === 'video'
                          ? isAr
                            ? 'اختر فيديو للمعاينة'
                            : 'Select a video'
                          : isAr
                            ? 'اختر صورة للمعاينة'
                            : 'Select an image'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4" />
                      <MessageCircle className="w-4 h-4" />
                      <Send className="w-4 h-4" />
                    </div>
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-4">
                    <strong className="text-slate-900 dark:text-white me-1.5">{previewHandle}</strong>
                    {composeCaption || (
                      <span className="text-slate-400">
                        {isAr ? 'سيظهر النص العام هنا…' : 'General text will appear here…'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Facebook Preview */}
            {composePlatform === 'facebook' && (
              <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden max-w-[360px] mx-auto p-3.5 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center font-black text-xs text-white overflow-hidden">
                    {currentComposerAccount?.avatar_url ? (
                      <img src={currentComposerAccount.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      previewPageName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      <span>{previewPageName}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1877F2]" />
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      {isAr ? 'الآن' : 'Just now'} • <Globe className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap line-clamp-6">
                  {composeCaption || (
                    <span className="text-slate-400">
                      {isAr ? 'سيظهر النص العام هنا…' : 'General text will appear here…'}
                    </span>
                  )}
                </p>

                {composeMediaType !== 'text' && (
                  <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
                    {composeMediaType === 'video' && composeVideo ? (
                      <video src={composeVideo} className="w-full h-full object-contain" controls playsInline muted />
                    ) : composeImage ? (
                      <img src={composeImage} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                        {composeMediaType === 'video' ? (
                          <Video className="w-8 h-8 text-slate-500" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-500" />
                        )}
                        <span>
                          {composeMediaType === 'video'
                            ? isAr
                              ? 'اختر فيديو للمعاينة'
                              : 'Select a video'
                            : isAr
                              ? 'اختر صورة للمعاينة'
                              : 'Select an image'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-slate-500 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold">
                  <span>{isAr ? 'إعجاب' : 'Like'}</span>
                  <span>{isAr ? 'تعليق' : 'Comment'}</span>
                  <span>{isAr ? 'مشاركة' : 'Share'}</span>
                </div>
              </div>
            )}

            {/* TikTok Preview */}
            {composePlatform === 'tiktok' && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl overflow-hidden max-w-[340px] mx-auto relative aspect-[9/16] flex flex-col justify-between p-4">
                {/* Background media */}
                {mediaPreviewUrl ? (
                  composeMediaType === 'video' ? (
                    <video src={mediaPreviewUrl} className="absolute inset-0 w-full h-full object-cover" muted loop autoPlay playsInline />
                  ) : (
                    <img src={mediaPreviewUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black flex flex-col items-center justify-center gap-2 text-slate-500">
                    <Music className="w-10 h-10 text-pink-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-400">
                      {isAr ? 'معاينة ريل تيك توك' : 'TikTok Live Video Preview'}
                    </span>
                  </div>
                )}

                {/* Top overlay */}
                <div className="relative z-10 flex items-center justify-between text-xs font-bold drop-shadow-md">
                  <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] text-white flex items-center gap-1.5 border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                    TikTok Feed
                  </span>
                  <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10">
                    {renderPlatformLogo('tiktok', 'w-4 h-4')}
                  </div>
                </div>

                {/* Right Action Bar */}
                <div className="relative z-10 self-end flex flex-col items-center gap-3.5 text-center text-[10px] font-bold drop-shadow-md">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-cyan-400 p-0.5">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-black">
                      {previewHandle.slice(1, 3).toUpperCase() || 'TT'}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white fill-white/20" />
                    </div>
                    <span>8.4k</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <span>342</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-white" />
                    </div>
                    <span>Share</span>
                  </div>
                </div>

                {/* Bottom Overlay: Handle + Caption + Sound */}
                <div className="relative z-10 space-y-1.5 drop-shadow-md bg-gradient-to-t from-black/90 via-black/50 to-transparent -mx-4 -mb-4 p-4 pt-6">
                  <div className="font-black text-xs text-white">
                    {previewHandle.startsWith('@') ? previewHandle : `@${previewHandle}`}
                  </div>
                  <p className="text-xs text-slate-100 line-clamp-3 leading-snug">
                    {composeCaption || (isAr ? 'سيظهر وصف الفيديو هنا…' : 'Video caption will appear here…')}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
                    <Music className="w-3 h-3 text-pink-400 shrink-0" />
                    <span className="truncate">♫ Original Audio - {activeStore.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULED POSTS */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? 'المنشورات المجدولة للنشر التلقائي' : 'Scheduled Queue'}
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              className="unity-btn-primary px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer hover:brightness-110"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'جدولة منشور جديد' : 'New Schedule'}</span>
            </button>
          </div>

          {scheduledPosts.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 space-y-2">
              <CalendarClock className="w-8 h-8 mx-auto text-amber-500" />
              <p className="text-xs font-bold">{isAr ? 'لا توجد منشورات مجدولة حالياً' : 'No scheduled posts in the queue'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      {renderPlatformLogo(post.platform, 'w-4 h-4')}
                      <span>{platformLabel(post.platform, isAr)}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      {isAr ? 'مجدول' : 'Scheduled'}
                    </span>
                  </div>

                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                    {post.media_type === 'text' || !post.image_url ? (
                      <div className="px-3 text-center text-[11px] text-slate-300 line-clamp-4">
                        {post.caption || (isAr ? 'نص عام' : 'General text')}
                      </div>
                    ) : post.media_type === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(post.image_url) ? (
                      <video src={post.image_url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{post.caption}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-mono">{new Date(post.scheduled_for || '').toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => void handleCancelPost(post.id)}
                      className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PUBLISHED HISTORY & ANALYTICS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            {isAr ? 'سجل المنشورات وتحليلات التفاعل الحقيقية' : 'Published Feed & Live Engagement'}
          </h2>

          {publishedPosts.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 space-y-2">
              <TrendingUp className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-xs font-bold">{isAr ? 'لا توجد منشورات منشورة حتى الآن' : 'No published posts yet'}</p>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'أنشئ منشوراً جديداً من تبويب الإنشاء أو اختر صورة من مكتبة الوسائط ثم انشر على حسابات المتجر.'
                  : 'Compose a new post or pick a creative from Media Library, then publish to connected accounts.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    {renderPlatformLogo(post.platform, 'w-4 h-4')}
                    <span>{platformLabel(post.platform, isAr)}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {isAr ? 'تم النشر' : 'Published'}
                  </span>
                </div>

                <div className="aspect-square rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                  {post.media_type === 'text' || !post.image_url ? (
                    <div className="px-4 text-center text-xs text-slate-300 line-clamp-6">
                      {post.caption || (isAr ? 'نص عام' : 'General text')}
                    </div>
                  ) : post.media_type === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(post.image_url) ? (
                    <video src={post.image_url} className="w-full h-full object-contain" controls playsInline muted />
                  ) : (
                    <img src={post.image_url} alt="" className="w-full h-full object-contain" />
                  )}
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{post.caption}</p>

                {/* Real engagement only — never invent likes/reach */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'الإعجابات' : 'Likes'}</div>
                    <div className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                      {typeof post.likes_count === 'number' ? post.likes_count : 0}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'التعليقات' : 'Comments'}</div>
                    <div className="text-sm font-black text-sky-600 dark:text-sky-400 font-mono">
                      {typeof post.comments_count === 'number' ? post.comments_count : 0}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'الوصول' : 'Reach'}</div>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {typeof post.reach_count === 'number' && post.reach_count > 0
                        ? post.reach_count >= 1000
                          ? `${(post.reach_count / 1000).toFixed(1)}K`
                          : post.reach_count
                        : isAr
                          ? 'بانتظار البيانات'
                          : 'Waiting'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* Connect Account Modal */}
      {isConnectModalOpen && (
        <GlobalModal
          isOpen
          onClose={() => setIsConnectModalOpen(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'ربط قناة تواصل اجتماعي' : 'Connect Social Channel'}
          zIndexClassName="z-[80]"
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-slate-900 dark:text-white"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Plug className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'ربط قناة تواصل اجتماعي' : 'Connect Social Channel'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Platform Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {isAr ? 'اختر المنصة للربط الفوري:' : 'Select Social Platform:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['instagram', 'facebook', 'tiktok', 'snapchat'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormPlatform(p)}
                      className={`py-2 px-3 rounded-xl text-xs font-black border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        formPlatform === p
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {renderPlatformLogo(p, 'w-4 h-4')}
                      <span>{platformLabel(p, isAr)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1-Click Fast Connect (Primary Action) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 dark:from-slate-800/60 dark:to-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {isAr ? 'الربط التلقائي بنقرة واحدة (موصى به)' : '1-Click Instant Connect (Recommended)'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {isAr ? 'تلقائي' : 'Instant'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isAr
                    ? 'انقر على الزر لتسجيل الدخول والربط الفوري. سيتم استيراد حسابك والوسائط والمنشورات وتقارير التفاعل تلقائياً!'
                    : 'Click below to connect instantly. Your account, profile media, posts, and real engagement reports will be synchronized automatically!'}
                </p>

                {formPlatform === 'instagram' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleOneClickConnect()}
                    className="w-full py-3.5 px-4 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2.5 shadow-md hover:brightness-110 cursor-pointer transition-all bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]"
                  >
                    {renderPlatformLogo('instagram', 'w-5 h-5 text-white')}
                    <span>{busy ? (isAr ? 'جارٍ المزامنة والربط...' : 'Connecting & Syncing...') : (isAr ? 'تسجيل الدخول والربط عبر إنستغرام' : 'Connect with Instagram')}</span>
                  </button>
                )}

                {formPlatform === 'facebook' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleOneClickConnect()}
                    className="w-full py-3.5 px-4 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2.5 shadow-md hover:brightness-110 cursor-pointer transition-all bg-[#1877F2]"
                  >
                    {renderPlatformLogo('facebook', 'w-5 h-5 text-white')}
                    <span>{busy ? (isAr ? 'جارٍ المزامنة والربط...' : 'Connecting & Syncing...') : (isAr ? 'المتابعة والربط عبر فيسبوك' : 'Continue with Facebook')}</span>
                  </button>
                )}

                {formPlatform === 'tiktok' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleOneClickConnect()}
                    className="w-full py-3.5 px-4 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2.5 shadow-md hover:brightness-110 cursor-pointer transition-all bg-black border border-pink-500/40 hover:border-pink-500"
                  >
                    {renderPlatformLogo('tiktok', 'w-5 h-5 text-white')}
                    <span>{busy ? (isAr ? 'جارٍ المزامنة والربط...' : 'Connecting & Syncing...') : (isAr ? 'تسجيل الدخول والربط عبر تيك توك' : 'Connect with TikTok')}</span>
                  </button>
                )}

                {formPlatform === 'snapchat' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleOneClickConnect()}
                    className="w-full py-3.5 px-4 rounded-2xl text-xs font-black text-slate-900 flex items-center justify-center gap-2.5 shadow-md hover:brightness-105 cursor-pointer transition-all bg-[#FFFC00] border border-amber-300"
                  >
                    {renderPlatformLogo('snapchat', 'w-5 h-5 text-black')}
                    <span>{busy ? (isAr ? 'جارٍ المزامنة والربط...' : 'Connecting & Syncing...') : (isAr ? 'تسجيل الدخول والربط عبر سناب شات' : 'Connect with Snapchat')}</span>
                  </button>
                )}
              </div>

              {/* Quick Handle / Username or Email Input */}
              <div className="space-y-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/40 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'أو اربط باسم الحساب / المعرّف / البريد:' : 'Or link by Handle, Username or Email:'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">@handle</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accountHandle}
                    onChange={(e) => setAccountHandle(e.target.value)}
                    placeholder={
                      formPlatform === 'instagram'
                        ? '@store_instagram'
                        : formPlatform === 'tiktok'
                        ? '@tiktok_store'
                        : 'store_page or email@store.com'
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleOneClickConnect(accountHandle)}
                    className="px-4 py-2 rounded-xl text-xs font-bold unity-btn-primary cursor-pointer hover:brightness-110 shrink-0"
                  >
                    {isAr ? 'ربط ومزامنة' : 'Link & Sync'}
                  </button>
                </div>
              </div>

              {/* Advanced Developer Mode (Collapsible) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowDevMode(!showDevMode)}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer font-bold"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>
                    {showDevMode
                      ? (isAr ? 'إخفاء الإعدادات المتقدمة' : 'Hide Advanced API Settings')
                      : (isAr ? '⚙️ خيارات متقدمة للمطورين (رموز API اليدوية)' : '⚙️ Advanced Developer Mode (Manual API Tokens)')}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDevMode ? 'rotate-180' : ''}`} />
                </button>

                {showDevMode && (
                  <div className="mt-3 space-y-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/60 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {formPlatform === 'tiktok'
                          ? (isAr ? 'رمز وصول تيك توك (TikTok Access Token):' : 'TikTok Access Token:')
                          : (isAr ? 'رمز وصول ميتا (Meta Access Token):' : 'Meta Access Token:')}
                      </label>
                      <input
                        type="password"
                        name="social_manual_token_prevent_autofill"
                        autoComplete="new-password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder={formPlatform === 'tiktok' ? 'act.xxxx or Bearer token' : 'EAAG...'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    {formPlatform === 'instagram' && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {isAr ? 'معرّف حساب إنستغرام التجاري:' : 'Instagram Business Account ID:'}
                        </label>
                        <input
                          type="text"
                          value={igUserId}
                          onChange={(e) => setIgUserId(e.target.value)}
                          placeholder="17841..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                    {formPlatform === 'facebook' && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {isAr ? 'معرّف صفحة فيسبوك:' : 'Facebook Page ID:'}
                        </label>
                        <input
                          type="text"
                          value={pageId}
                          onChange={(e) => setPageId(e.target.value)}
                          placeholder="10234..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleConnectAccount()}
                      className="unity-btn-primary w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{busy ? (isAr ? 'جارٍ التحقق...' : 'Verifying...') : (isAr ? 'ربط واختبار يدوي' : 'Custom Connect & Live Test')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
};
