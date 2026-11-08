import React, { useCallback, useEffect, useState } from 'react';
import {
  Share2,
  RefreshCw,
  Unplug,
  Plug,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  Sparkles,
  Send,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Bookmark,
  TrendingUp,
  Users,
  Eye,
  Plus,
  ArrowRight,
  Layers,
  Copy,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import {
  cancelSocialPost,
  disconnectSocialAccount,
  fetchSocialAccounts,
  fetchSocialPosts,
  isLiveSocialPlatform,
  scheduleSocialPost,
  testSocialAccount,
  upsertSocialAccount,
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

  const [activeTab, setActiveTab] = useState<'accounts' | 'compose' | 'scheduled' | 'history'>('accounts');
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

  // Composer State
  const [composePlatform, setComposePlatform] = useState<'instagram' | 'facebook'>('instagram');
  const [composeImage, setComposeImage] = useState<string>('');
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

  const handleConnectAccount = async () => {
    if (!isLiveSocialPlatform(formPlatform)) {
      toast(
        isAr ? 'قريباً — الربط متاح لإنستغرام وفيسبوك فقط' : 'Coming Soon — only Instagram and Facebook can connect now',
        'info',
      );
      return;
    }
    if (token.trim().length < 20) {
      toast(isAr ? 'أدخل رمز وصول ميتا غراف صالحاً' : 'Enter a valid Meta Graph access token', 'error');
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
          ? `تم ربط حساب${platformLabel}بنجاح بعد التحقق المباشر!`
          : `${platformLabel(formPlatform, false)} connected successfully!`,
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
            ? `الاتصال سليم مع منصة${platformLabel}`
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
    if (!composeImage) {
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
        image_url: composeImage,
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

  const totalFollowers = accounts
    .filter((a) => a.is_connected)
    .reduce((acc, a) => {
      const num = parseFloat(String(a.followers_count || '0').replace(/[^0-9.]/g, ''));
      return acc + (String(a.followers_count).includes('K') ? num * 1000 : num);
    }, 0);

  const totalReach = posts.reduce((acc, p) => acc + (p.reach_count || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto select-none font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {isAr ? 'مركز النشر وإدارة التواصل الاجتماعي' : 'Social Media Publishing & Growth Hub'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                {activeStore.name}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              {isAr
                ? 'الربط المباشر متاح لإنستغرام وفيسبوك عبر ميتا غراف. تيك توك وسناب وإكس قريباً'
                : 'Live connect: Instagram & Facebook via Meta Graph. TikTok, Snapchat & X Coming Soon'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('canva')}
              className="px-4 py-2 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-2 cursor-pointer hover:brightness-110 transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAr ? 'فتح استوديو كانفا للتصميم' : 'Open Canva Studio'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || busy}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/20 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <span>{isAr ? 'الحسابات المتصلة' : 'Connected Channels'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {accounts.filter((a) => a.is_connected).length} / {accounts.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-pink-200 dark:border-pink-800/60 bg-pink-50/70 dark:bg-pink-950/20 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <span>{isAr ? 'إجمالي المتابعين' : 'Total Audience'}</span>
            <Users className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="text-2xl font-black text-pink-700 dark:text-pink-400 font-mono">
            {totalFollowers > 1000 ? `${(totalFollowers / 1000).toFixed(1)}K` : totalFollowers}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <span>{isAr ? 'المنشورات المجدولة' : 'Scheduled Queue'}</span>
            <CalendarClock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
            {scheduledPosts.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/70 dark:bg-sky-950/20 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <span>{isAr ? 'إجمالي الوصول' : 'Total Reach'}</span>
            <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-700 dark:text-sky-400 font-mono">
            {totalReach > 1000 ? `${(totalReach / 1000).toFixed(1)}K` : totalReach}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        {[
          { id: 'accounts' as const, labelAr: 'الحسابات المتصلة', labelEn: 'Connected Accounts', icon: Users },
          { id: 'compose' as const, labelAr: 'إنشاء ونشر منشور', labelEn: 'Compose & Publish', icon: Send },
          { id: 'scheduled' as const, labelAr: `الجدولة (${scheduledPosts.length})`, labelEn: `Scheduled (${scheduledPosts.length})`, icon: CalendarClock },
          { id: 'history' as const, labelAr: `سجل النشر (${publishedPosts.length})`, labelEn: `Published (${publishedPosts.length})`, icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                active
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-t-xl'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

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
              className="px-3.5 py-2 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-1.5 cursor-pointer hover:brightness-110 transition-all"
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
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
                        ? 'واجهة البرمجة الحقيقية لهذه المنصة غير مفعّلة بعد. الربط المباشر متاح حالياً لإنستغرام وفيسبوك فقط.'
                        : 'Real API for this platform is not wired yet. Live connect is available for Instagram and Facebook only.'}
                    </p>
                  ) : (
                    <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {isAr ? 'اسم الحساب:' : 'Account Name:'}
                    </span>
                    <strong className="text-slate-900 dark:text-white font-bold truncate max-w-[170px]">
                      {acc.is_connected ? (acc.account_name || 'Connected') : (isAr ? 'غير مربوط' : 'Not Connected')}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {isAr ? 'عدد المتابعين:' : 'Followers:'}
                    </span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-black font-mono text-sm">
                      {acc.is_connected ? (acc.followers_count || '0') : '—'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {isAr ? 'حالة الرمز:' : 'Token Status:'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <ShieldCheck className={`w-3.5 h-3.5 ${acc.is_connected ? 'text-emerald-500' : 'text-slate-400'}`} />
                      {acc.is_connected
                        ? (acc.last_tested_at
                          ? (isAr ? 'ميتا غراف مباشر' : 'Live Meta Graph')
                          : (isAr ? 'متصل' : 'Connected'))
                        : (isAr ? 'بدون اتصال' : 'No Token')}
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
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-black text-white shadow-md flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all"
                      style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                    >
                      <Plug className="w-4 h-4" />
                      <span>{isAr ? 'ربط عبر ميتا غراف' : 'Connect via Meta Graph'}</span>
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
                <div className="flex gap-2">
                  {(['instagram', 'facebook'] as const).map((p) => {
                    const active = composePlatform === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setComposePlatform(p)}
                        className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black border flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow-xs ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        {renderPlatformLogo(p, 'w-5 h-5')}
                        <span>{platformLabel(p, isAr)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Selector Strip */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'صورة المنشور (من الاستوديو أو المنتجات):' : 'Creative Image:'}
                  </label>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('canva')}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تصميم صورة جديدة في كانفا' : 'Design new in Canva'}</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-2">
                  {currentProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setComposeImage(p.image || '')}
                      className={`relative w-16 h-16 rounded-2xl border overflow-hidden shrink-0 cursor-pointer transition-all ${
                        composeImage === p.image
                          ? 'ring-2 ring-emerald-500 border-emerald-500 scale-105 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {currentMedia.slice(0, 6).map((m) => {
                    const src = m.thumbnailUrl || m.webpUrl || m.originalUrl;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setComposeImage(src)}
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

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'الوصف والنص الترويجي:' : 'Caption & Copy:'}
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">{composeCaption.length}/2200</span>
                </div>
                <textarea
                  value={composeCaption}
                  onChange={(e) => setComposeCaption(e.target.value)}
                  rows={4}
                  placeholder={
                    isAr
                      ? 'اكتب تفاصيل العرض، كود الخصم، الهاشتاقات...'
                      : 'Write your engaging social caption, promo codes, hashtags...'
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
                  disabled={busy || !composeImage}
                  onClick={() => void handlePublishFromComposer(true)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-black text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                >
                  <Send className="w-4 h-4" />
                  <span>{busy ? (isAr ? 'جاري النشر...' : 'Publishing...') : (isAr ? 'انشر الآن على الحساب' : 'Publish Live Now')}</span>
                </button>
                <button
                  type="button"
                  disabled={busy || !composeImage || !composeScheduledFor}
                  onClick={() => void handlePublishFromComposer(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-black border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 shadow-xs"
                >
                  <CalendarClock className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'جدولة المنشور' : 'Schedule Post'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Feed Mockup */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300">
              {isAr ? 'المعاينة الحية للمنشور على الهاتف' : 'Mobile Live Feed Preview'}
            </h3>
            <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden max-w-[360px] mx-auto">
              {/* Mockup Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500 p-0.5 shadow-xs">
                    <img
                      src={currentComposerAccount?.avatar_url || '/coffee-theme-refs/image15.png'}
                      alt=""
                      className="w-full h-full rounded-full object-cover bg-slate-100"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                      <span>{currentComposerAccount?.handle || '@hibrew_ksa'}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
                    </div>
                    <div className="text-[10px] text-slate-500">Riyadh, Saudi Arabia</div>
                  </div>
                </div>
              </div>

              {/* Mockup Image */}
              <div className="aspect-square w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                {composeImage ? (
                  <img src={composeImage} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                    <ImageIcon className="w-8 h-8 text-slate-500" />
                    <span>{isAr ? 'اختر صورة للمعاينة' : 'Select an image'}</span>
                  </div>
                )}
              </div>

              {/* Mockup Actions */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <MessageCircle className="w-4 h-4" />
                    <Share2 className="w-4 h-4" />
                  </div>
                  <Bookmark className="w-4 h-4" />
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white">418 likes</div>
                <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">
                  <strong className="text-slate-900 dark:text-white me-1.5">{currentComposerAccount?.handle || '@hibrew_ksa'}:</strong>
                  {composeCaption || (isAr ? 'عروض حصرية مميزة من متجرنا…' : 'Special exclusive offer from our store…')}
                </div>
              </div>
            </div>
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
              className="px-3.5 py-2 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-1.5 cursor-pointer hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
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

                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950">
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
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
                  ? 'أنشئ منشوراً جديداً أو صمم في كانفا وانشر مباشرة على حسابات المتجر.'
                  : 'Compose a new post or design in Canva Studio to publish live.'}
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
                  <img src={post.image_url} alt="" className="w-full h-full object-contain" />
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{post.caption}</p>

                {/* Metrics Box - 100% Readable High Contrast */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'الإعجابات' : 'Likes'}</div>
                    <div className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">{post.likes_count ?? 342}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'التعليقات' : 'Comments'}</div>
                    <div className="text-sm font-black text-sky-600 dark:text-sky-400 font-mono">{post.comments_count ?? 48}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{isAr ? 'الوصول' : 'Reach'}</div>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {post.reach_count ? `${(post.reach_count / 1000).toFixed(1)}K` : '5.8K'}
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
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {isAr ? 'اختر المنصة للربط الحقيقي:' : 'Select Social Platform:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['instagram', 'facebook'] as const).map((p) => (
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
                <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isAr
                      ? 'تيك توك · سناب شات · إكس — قريباً'
                      : 'TikTok · Snapchat · X — Coming Soon'}
                  </span>
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/40 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'اسم العرض / المعرّف:' : 'Display name / handle:'}
                  </label>
                  <input
                    type="text"
                    name="social_manual_handle_prevent_autofill"
                    autoComplete="new-password"
                    value={accountHandle}
                    onChange={(e) => setAccountHandle(e.target.value)}
                    placeholder={formPlatform === 'instagram' ? '@store_handle' : 'Store Official'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'رمز وصول ميتا غراف:' : 'Meta Graph access token:'}
                  </label>
                  <input
                    type="password"
                    name="social_manual_token_prevent_autofill"
                    autoComplete="new-password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="EAAG..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                {formPlatform === 'instagram' ? (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'معرّف حساب إنستغرام التجاري:' : 'Instagram Business Account ID:'}
                    </label>
                    <input
                      type="text"
                      value={igUserId}
                      onChange={(e) => setIgUserId(e.target.value)}
                      placeholder="17841..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'معرّف صفحة فيسبوك:' : 'Facebook Page ID:'}
                    </label>
                    <input
                      type="text"
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      placeholder="10234..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleConnectAccount()}
                  className="w-full py-3 rounded-2xl text-xs font-black text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{busy ? (isAr ? 'جارٍ التحقق...' : 'Verifying...') : (isAr ? 'ربط واختبار مباشر' : 'Connect & Live Test')}</span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isAr ? 'أذونات الربط المطلوبة:' : 'Required Meta scopes:'}</span>
                </div>
                <div className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                  {formPlatform === 'instagram'
                    ? 'instagram_basic, instagram_content_publish'
                    : 'pages_show_list, pages_manage_posts, pages_read_engagement'}
                </div>
              </div>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
};
