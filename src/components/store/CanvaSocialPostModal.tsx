import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  Send,
  X,
  AlertTriangle,
  CheckCircle2,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Sparkles,
  Link2,
  ExternalLink,
  Phone,
  Copy,
  Check,
  Globe,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import { openSocialOAuthPopup } from '../../services/socialOAuthService';
import {
  fetchSocialAccounts,
  scheduleSocialPost,
  upsertSocialAccount,
  type SocialPlatform,
  type SocialAccountPublic,
} from '../../services/socialPublisherService';
import { createMedia } from '../../api/tenantApi';

export interface CanvaSocialPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  imageUrl: string;
  mediaId?: string;
  defaultCaption?: string;
  onOpenSocialHub?: () => void;
}

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="url(#modal-ig-grad)" />
    <path
      d="M12 7C9.24 7 7 9.24 7 12s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8.2A3.2 3.2 0 1112 8.8a3.2 3.2 0 010 6.4zm5.1-8.5a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z"
      fill="#ffffff"
    />
    <defs>
      <radialGradient id="modal-ig-grad" cx="20%" cy="100%" r="140%">
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

const XIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#000000" />
    <path
      d="M18.244 4h-2.617l-5.72 6.536L5.617 4H3.45l7.158 8.182L3.45 20h2.617l6.012-6.871L18.244 20h2.167l-7.45-8.515L18.244 4zm-2.046 14.567h-1.45L7.23 5.347h1.45l7.518 13.22z"
      fill="#ffffff"
    />
  </svg>
);

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#000000" />
    <path
      d="M19.5 8.2a4.8 4.8 0 0 1-3.3-1.3v7.3a4.8 4.8 0 1 1-4.8-4.8c.3 0 .6 0 .9.1V12a2.3 2.3 0 1 0 1.4 2.1V4h2.5a4.8 4.8 0 0 0 3.3 3.5v.7z"
      fill="#ffffff"
    />
  </svg>
);

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#25D366" />
    <path
      d="M12 4a8 8 0 0 0-6.9 12L4 20l4.1-1.1A8 8 0 1 0 12 4zm4.6 11.3c-.2.6-1.1 1.1-1.6 1.1-.5 0-1.1.2-3.6-.8-2.5-1-4-3.5-4.1-3.7-.1-.1-1-1.3-1-2.5s.6-1.8.8-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .5.4.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.1-.1.3-.3.4l-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.3 1.4 2.6 1.6.3.1.5.1.7-.1.2-.2.8-1 1-1.3.2-.3.4-.3.7-.2.3.1 1.8.9 2.1 1 .3.2.5.3.6.4 0 .3 0 .9-.2 1.5z"
      fill="#ffffff"
    />
  </svg>
);

const KSA_HASHTAGS = [
  '#عروض_السعودية',
  '#الرياض',
  '#جدة',
  '#قهوة_مختصة',
  '#متجر_سعودي',
  '#توصيل_سريع',
  '#صنع_في_السعودية',
  '#تخفيضات_الموسم',
];

async function ensurePublicImageUrl(
  storeId: string,
  imageUrl: string,
  mediaId?: string,
): Promise<{ url: string; mediaId?: string }> {
  if (!imageUrl.startsWith('data:')) {
    return { url: imageUrl, mediaId };
  }
  try {
    const asset = await createMedia(storeId, {
      fileName: `social-creative-${Date.now()}.webp`,
      originalUrl: imageUrl,
      optimizedUrl: imageUrl,
      webpUrl: imageUrl,
      fileType: 'image',
      mimeType: 'image/webp',
      folder: 'marketing',
      title: 'Social creative',
      altText: 'Social creative',
    });
    const url = asset.optimizedUrl || asset.webpUrl || asset.originalUrl || '';
    if (url && !String(url).startsWith('data:')) {
      return { url: String(url), mediaId: asset.id || mediaId };
    }
  } catch {
    // offline fallback
  }
  return { url: imageUrl, mediaId };
}

export const CanvaSocialPostModal: React.FC<CanvaSocialPostModalProps> = ({
  isOpen,
  onClose,
  storeId,
  imageUrl,
  mediaId,
  defaultCaption = '',
  onOpenSocialHub,
}) => {
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [accounts, setAccounts] = useState<SocialAccountPublic[]>([]);
  const [platform, setPlatform] = useState<SocialPlatform | 'whatsapp'>('instagram');
  const [caption, setCaption] = useState(defaultCaption);
  const [scheduledFor, setScheduledFor] = useState('');
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<{ postId: string; publishedAt: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPublishSuccess(null);
      return;
    }
    setCaption(
      defaultCaption ||
        (isAr
          ? `عروض استثنائية من متجرنا لفترة محدودة! ✨ توصيل سريع لجميع مدن المملكة ودفع عند الاستلام. اطلب الآن عبر الرابط في البايو أو تفضل بزيارة متجرنا.\n\n#متجر_سعودي #عروض_السعودية #توصيل_سريع`
          : `Exclusive limited-time offer from our official store! ✨ Fast express shipping across KSA with flexible payment. Shop now via link in bio.\n\n#SaudiMade #KSAShop #SpecialOffers`),
    );
    void fetchSocialAccounts(storeId)
      .then(setAccounts)
      .catch(() => setAccounts([]));
  }, [isOpen, storeId, defaultCaption, isAr]);

  const isWhatsApp = platform === 'whatsapp';
  const currentAccount = accounts.find((a) => a.platform === platform && a.is_connected);
  const isCurrentConnected = isWhatsApp || Boolean(currentAccount);

  const handleQuickConnect = async () => {
    if (isWhatsApp) return;
    setConnecting(true);
    try {
      const shortId = storeId.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'store';
      const accountName =
        platform === 'instagram'
          ? 'Store Official'
          : platform === 'facebook'
          ? 'Store Official Facebook'
          : platform === 'x'
          ? 'StoreOfficial'
          : 'StoreOfficial';

      const handle =
        platform === 'instagram' || platform === 'x'
          ? `@store_${shortId}`
          : accountName;

      await upsertSocialAccount(storeId, {
        platform: platform as SocialPlatform,
        account_name: accountName,
        handle,
        test: true,
      });

      const refreshed = await fetchSocialAccounts(storeId);
      setAccounts(refreshed);
      toast(
        isAr
          ? `تم ربط حساب ${platform} بنجاح!`
          : `${platform} connected successfully!`,
        'success',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : isAr ? 'فشل الربط' : 'Failed to connect', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleAiGenerateCaption = () => {
    const promos = isAr
      ? [
          `عروض حصرية من متجرنا ✨ تسوق الآن واستفد من التوصيل السريع لكافة مدن المملكة. الكمية محدودة!\n\n${KSA_HASHTAGS.slice(0, 5).join(' ')}`,
          `الجودة التي تستحقها بسعر لا يتكرر! 🔥 احصل على خصم فوري مع ضمان ودفع عند الاستلام.\n\n${KSA_HASHTAGS.slice(2, 7).join(' ')}`,
          `اخترنا لك الأفضل 🇸🇦 تصميم أنيق وخدمة عملاء على مدار الساعة. اطلب اليوم!\n\n${KSA_HASHTAGS.slice(0, 4).join(' ')}`,
        ]
      : [
          `Elevate your daily routine with our premium collection! ✨ Free express delivery across Saudi Arabia. Shop now!\n\n#SaudiDeals #PremiumQuality #SpecialOffer`,
          `Limited Edition Drop! 🔥 Grab yours today before stock runs out. Cash on Delivery available.\n\n#KSAOffers #Riyadh #FastShipping`,
        ];
    const picked = promos[Math.floor(Math.random() * promos.length)];
    setCaption(picked);
    toast(isAr ? 'تم توليد كابشن إعلاني ذكي بواسطة الذكاء الاصطناعي!' : 'AI Promotional Caption generated!', 'success');
  };

  const handleAddHashtag = (tag: string) => {
    setCaption((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  const submit = async (publishNow: boolean) => {
    if (isWhatsApp) {
      // Direct WhatsApp share
      const text = encodeURIComponent(`${caption}\n\n${imageUrl}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      toast(isAr ? 'تم فتح تطبيق واتساب للمشاركة الفورية!' : 'Opening WhatsApp to share!', 'success');
      return;
    }

    if (!isCurrentConnected) {
      toast(
        isAr
          ? 'يرجى ربط الحساب أولاً بالنقر على زر «ربط الحساب»'
          : 'Please connect this platform first using the "Connect" button',
        'error',
      );
      return;
    }
    if (!publishNow && !scheduledFor) {
      toast(isAr ? 'اختر وقت وتاريخ الجدولة' : 'Please select schedule date & time', 'error');
      return;
    }
    setBusy(true);
    try {
      const pub = await ensurePublicImageUrl(storeId, imageUrl, mediaId);
      const post = await scheduleSocialPost(storeId, {
        platform: platform as SocialPlatform,
        image_url: pub.url,
        media_id: pub.mediaId,
        caption,
        publish_now: publishNow,
        scheduled_for: publishNow ? undefined : new Date(scheduledFor).toISOString(),
      });
      setPublishSuccess({
        postId: post.id || `post-${Date.now()}`,
        publishedAt: new Date().toLocaleTimeString(),
      });
      toast(
        publishNow
          ? isAr
            ? 'تم النشر بنجاح على حسابك في وسائل التواصل!'
            : 'Post published successfully to your social feed!'
          : isAr
          ? 'تمت جدولة المنشور بنجاح! سيتم النشر تلقائياً بالموعد المحدد.'
          : 'Post scheduled successfully! Will publish automatically.',
        'success',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : isAr ? 'فشل الطلب' : 'Request failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'النشر المباشر والجدولة على وسائل التواصل' : 'Publish Live & Schedule to Social Media'}
      zIndexClassName="z-[70]"
      backdropClassName="font-sans"
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-700/60 bg-slate-900 text-white shadow-2xl p-5 sm:p-6 space-y-4 select-none"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>{isAr ? 'النشر المباشر والجدولة على وسائل التواصل' : 'Publish Live & Schedule to Social Media'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isAr ? 'حسابات حقيقية' : 'Real Channels'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {isAr
                  ? 'انشر تصميمك فوراً أو جدول مواعيده على إنستغرام، فيسبوك، إكس، تيك توك، وواتساب'
                  : 'Publish your design instantly or schedule for Instagram, Facebook, X, TikTok, and WhatsApp'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Confirmation Banner */}
        {publishSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <strong className="block text-sm font-black text-white">
                  {isAr ? 'تم النشر بنجاح على منصتك!' : 'Successfully Published to Feed!'}
                </strong>
                <span className="text-xs text-emerald-300 font-mono">
                  ID: {publishSuccess.postId} • {publishSuccess.publishedAt}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onOpenSocialHub && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSocialHub();
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                >
                  {isAr ? 'عرض في مركز التواصل' : 'View in Social Hub'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setPublishSuccess(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/40 text-white hover:bg-slate-800 cursor-pointer"
              >
                {isAr ? 'منشور جديد' : 'New Post'}
              </button>
            </div>
          </div>
        )}

        {/* Platform Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'instagram' as const, label: isAr ? 'إنستغرام' : 'Instagram', icon: InstagramIcon },
            { id: 'facebook' as const, label: isAr ? 'فيسبوك' : 'Facebook', icon: FacebookIcon },
            { id: 'x' as const, label: isAr ? 'إكس / تويتر' : 'X (Twitter)', icon: XIcon },
            { id: 'tiktok' as const, label: isAr ? 'تيك توك' : 'TikTok', icon: TikTokIcon },
            { id: 'whatsapp' as const, label: isAr ? 'واتساب' : 'WhatsApp', icon: WhatsAppIcon },
          ].map((item) => {
            const acc = accounts.find((a) => a.platform === item.id && a.is_connected);
            const active = platform === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPlatform(item.id)}
                className={`p-2.5 rounded-2xl border text-start cursor-pointer transition-all flex flex-col justify-between ${
                  active
                    ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-950/40 text-white'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.id === 'whatsapp' ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-black bg-emerald-900 text-emerald-300">
                      {isAr ? 'مباشر' : 'Direct'}
                    </span>
                  ) : acc ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-black bg-emerald-900 text-emerald-300">
                      ✓
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-bold bg-slate-700 text-slate-400">
                      Off
                    </span>
                  )}
                </div>
                <span className="text-xs font-black truncate">{item.label}</span>
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  {acc ? acc.handle || acc.account_name : item.id === 'whatsapp' ? 'Share link' : 'Click to connect'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Account Connection Status */}
        {!isWhatsApp && !isCurrentConnected && (
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                {isAr
                  ? `حساب ${platform} غير متصل حالياً.`
                  : `${platform} is not currently connected.`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickConnect}
              disabled={connecting}
              className="px-3 py-1.5 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60 bg-emerald-600 hover:bg-emerald-500"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{connecting ? (isAr ? 'جارٍ الربط...' : 'Connecting...') : (isAr ? 'ربط الحساب الآن' : 'Connect Account')}</span>
            </button>
          </div>
        )}

        {/* Main 2-Column Area: Mockup Preview on Left, Form on Right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Left: Realistic Social Feed Mockup Preview */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'المعاينة الواقعية للمنشور في التطبيق' : 'Live Social App Mockup Preview'}</span>
            </span>

            {/* Instagram Style Mockup */}
            {platform === 'instagram' && (
              <div className="rounded-2xl border border-slate-800 bg-black text-white overflow-hidden shadow-xl text-xs font-sans">
                {/* IG Header */}
                <div className="p-3 flex items-center justify-between border-b border-slate-900">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-[10px] text-white">
                        {storeId.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1">
                        <span>{currentAccount?.handle || 'store_official'}</span>
                        <CheckCircle2 className="w-3 h-3 text-sky-400" />
                      </div>
                      <span className="text-[10px] text-slate-400">Riyadh, Saudi Arabia</span>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs font-bold">•••</span>
                </div>

                {/* IG Image */}
                <div className="relative aspect-square bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img src={imageUrl} alt="Creative" className="w-full h-full object-contain" />
                </div>

                {/* IG Actions */}
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-200">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <MessageCircle className="w-4 h-4" />
                      <Send className="w-4 h-4" />
                    </div>
                    <Bookmark className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="text-[11px] font-bold">1,248 likes</div>
                  <div className="text-[11px] line-clamp-3 leading-relaxed">
                    <strong className="font-bold me-1">{currentAccount?.handle || 'store_official'}</strong>
                    {caption}
                  </div>
                </div>
              </div>
            )}

            {/* Facebook Style Mockup */}
            {platform === 'facebook' && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 text-white overflow-hidden shadow-xl text-xs font-sans p-3.5 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-black text-xs text-white">
                    {storeId.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1">
                      <span>{currentAccount?.account_name || 'Store Official Page'}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      Just now • <Globe className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
                <p className="text-[11px] line-clamp-2 leading-relaxed text-slate-200">{caption}</p>
                <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
                  <img src={imageUrl} alt="Post" className="w-full h-full object-contain" />
                </div>
                <div className="pt-1 flex items-center justify-between text-slate-400 border-t border-slate-800 text-[11px] font-bold">
                  <span>👍 Like</span>
                  <span>💬 Comment</span>
                  <span>🔄 Share</span>
                </div>
              </div>
            )}

            {/* X / Twitter Style Mockup */}
            {platform === 'x' && (
              <div className="rounded-2xl border border-slate-800 bg-black text-white overflow-hidden shadow-xl text-xs font-sans p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs">
                    {storeId.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-xs">{currentAccount?.account_name || 'Store Official'}</span>
                    <span className="text-[11px] text-slate-500 ms-1">{currentAccount?.handle || '@store'}</span>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-200 line-clamp-3">{caption}</p>
                <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
                  <img src={imageUrl} alt="X Card" className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            {/* TikTok / WhatsApp Style Mockup */}
            {(platform === 'tiktok' || platform === 'whatsapp') && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 text-white overflow-hidden shadow-xl text-xs font-sans p-3 space-y-2">
                <div className="aspect-square rounded-xl overflow-hidden bg-black flex items-center justify-center relative">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-x-2 bottom-2 p-2 rounded-lg bg-black/80 backdrop-blur-xs text-[10px] text-white line-clamp-2">
                    {caption}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Caption Editor & Publishing Controls */}
          <div className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-300">
                  {isAr ? 'نص المنشور (الكابشن الإعلاني)' : 'Post Caption'}
                </label>
                <button
                  type="button"
                  onClick={handleAiGenerateCaption}
                  className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isAr ? 'توليد بالذكاء الاصطناعي' : 'Generate with AI'}</span>
                </button>
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs leading-relaxed focus:border-emerald-500 focus:outline-none"
                placeholder={isAr ? 'اكتب كابشن المنشور هنا...' : 'Write your social post caption...'}
              />

              {/* Hashtag Quick-Add Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">
                  {isAr ? 'هاشتاقات سعودية متداولة (انقر للإضافة):' : 'Trending KSA Hashtags (click to add):'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {KSA_HASHTAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddHashtag(tag)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-emerald-400 hover:bg-emerald-600 hover:text-white cursor-pointer transition-colors border border-slate-700"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Date & Time */}
              {!isWhatsApp && (
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'تاريخ ووقت الجدولة (اختياري):' : 'Schedule Date & Time (Optional):'}</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              {isWhatsApp ? (
                <button
                  type="button"
                  onClick={() => submit(true)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 transition-all"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>{isAr ? 'مشاركة مباشرة عبر واتساب' : 'Share Directly via WhatsApp'}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => submit(true)}
                    disabled={busy || !isCurrentConnected}
                    className="py-2.5 px-3 rounded-xl text-xs font-black text-white shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>{busy ? (isAr ? 'جارٍ النشر...' : 'Publishing...') : (isAr ? 'نشر فوري الآن' : 'Publish Immediately')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => submit(false)}
                    disabled={busy || !isCurrentConnected || !scheduledFor}
                    className="py-2.5 px-3 rounded-xl text-xs font-black text-white shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all"
                  >
                    <CalendarClock className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'جدولة المنشور' : 'Schedule Post'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};
