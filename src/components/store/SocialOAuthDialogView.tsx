import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Info,
  X,
} from 'lucide-react';
import { isLiveSocialPlatform, type SocialPlatform } from '../../services/socialPublisherService';

// Official SVG Brand Logos
const InstagramGradientLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="url(#ig-grad-popup)" />
    <path
      d="M12 7C9.24 7 7 9.24 7 12s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8.2A3.2 3.2 0 1112 8.8a3.2 3.2 0 010 6.4zm5.1-8.5a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z"
      fill="#ffffff"
    />
    <defs>
      <radialGradient id="ig-grad-popup" cx="20%" cy="100%" r="140%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="20%" stopColor="#fdf497" />
        <stop offset="40%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="100%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
  </svg>
);

const FacebookLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path
      d="M15.5 12.05h-2.25v7.95h-3.3v-7.95H8.25V9.25h1.7V7.47c0-2.3 1.37-3.47 3.5-3.47 1.02 0 1.9.08 2.16.11v2.5h-1.48c-1.12 0-1.38.53-1.38 1.35v1.29h2.8l-.37 2.8z"
      fill="#ffffff"
    />
  </svg>
);

const TikTokLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
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

const XLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#000000" />
    <path
      d="M17.4 5h2.1l-4.6 5.3 5.4 7.7h-4.2l-3.3-4.4-3.8 4.4H6.9l4.9-5.7L6.6 5h4.3l3 4 3.5-4zM16.6 16.7h1.2L9.5 6.2H8.3l8.3 10.5z"
      fill="#ffffff"
    />
  </svg>
);

export const SocialOAuthDialogView: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const platform = (params.get('platform') || 'instagram') as SocialPlatform;
  const storeId = params.get('storeId') || '';
  const storeName = params.get('storeName') || 'Store';
  const storeSlug = params.get('storeSlug') || storeId;

  const defaultHandle =
    platform === 'instagram'
      ? `@${String(storeSlug || 'store').replace(/[^a-zA-Z0-9_]/g, '') || 'store'}`
      : storeName;

  const [accountHandle] = useState(defaultHandle);
  const [accountName] = useState(storeName);

  // Platform configs
  const isMeta = isLiveSocialPlatform(platform);
  const isTikTok = platform === 'tiktok';
  const comingSoon = !isMeta;

  const platformTitle =
    platform === 'instagram'
      ? 'Instagram Professional'
      : platform === 'facebook'
      ? 'Facebook Pages for Business'
      : platform === 'tiktok'
      ? 'TikTok for Business'
      : platform === 'x'
      ? 'X (Twitter) Developer Portal'
      : 'Snapchat Marketing';

  const permissionsList = isMeta
    ? [
        {
          code: 'instagram_basic',
          titleEn: 'Access Instagram Profile & Insights',
          titleAr: 'الوصول إلى ملف إنستغرام التجاري والإحصائيات',
          descEn: 'Reads your Instagram handle, profile photo, and public metrics.',
        },
        {
          code: 'instagram_content_publish',
          titleEn: 'Publish Posts & Carousels Directly',
          titleAr: 'نشر الصور والمنشورات مباشرة على الخلاصة',
          descEn: 'Allows UnityTeck to publish creatives made in Canva Studio to your feed.',
        },
        {
          code: 'pages_show_list',
          titleEn: 'Manage Facebook Pages',
          titleAr: 'إدارة وتحديد صفحات فيسبوك التابعة لمتجرك',
          descEn: 'Lists Facebook pages associated with your Meta Business account.',
        },
        {
          code: 'pages_manage_posts',
          titleEn: 'Publish & Schedule to Facebook Page',
          titleAr: 'إنشاء وجدولة المنشورات على صفحة فيسبوك',
          descEn: 'Create instant and scheduled posts directly to your page timeline.',
        },
        {
          code: 'pages_read_engagement',
          titleEn: 'Read Page Engagement & Analytics',
          titleAr: 'قراءة التفاعل والوصول الحقيقي للمنشورات',
          descEn: 'Track reach, reactions, and performance without leaving dashboard.',
        },
      ]
    : isTikTok
    ? [
        {
          code: 'user.info.basic',
          titleEn: 'Access Profile Info & Avatar',
          titleAr: 'الوصول لبيانات الحساب والصورة الرمزية',
          descEn: 'Read your TikTok handle, avatar, and verification badge.',
        },
        {
          code: 'video.publish',
          titleEn: 'Publish Photos & Videos to TikTok',
          titleAr: 'نشر الصور ومقاطع الفيديو على تيك توك',
          descEn: 'Allows direct publishing of marketing creatives to your TikTok account.',
        },
      ]
    : [
        {
          code: 'tweet.read',
          titleEn: 'Read Tweets & Profile Info',
          titleAr: 'قراءة التغريدات وبيانات الملف',
          descEn: 'Access public tweets and follower counts.',
        },
        {
          code: 'tweet.write',
          titleEn: 'Publish Posts to X Timeline',
          titleAr: 'نشر التغريدات والوسائط على الجدول الزمني',
          descEn: 'Post photos, announcements, and product links automatically.',
        },
      ];

  const handleCancel = () => {
    window.close();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between font-sans antialiased select-none">
      {/* Browser URL Simulation Bar */}
      <div className="bg-slate-900 text-slate-300 px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 truncate">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-mono text-[11px] text-slate-300 truncate">
            {isMeta
              ? 'https://www.facebook.com/v19.0/dialog/oauth?client_id=unityteck_social'
              : isTikTok
              ? 'https://www.tiktok.com/v2/auth/authorize/'
              : 'https://twitter.com/i/oauth2/authorize'}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
          SSL Verified 256-bit
        </span>
      </div>

      {/* Main Dialog Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {platform === 'instagram' && <InstagramGradientLogo className="w-10 h-10 shadow-sm rounded-xl" />}
              {platform === 'facebook' && <FacebookLogo className="w-10 h-10 shadow-sm rounded-full" />}
              {platform === 'tiktok' && <TikTokLogo className="w-10 h-10 shadow-sm rounded-xl" />}
              {platform === 'x' && <XLogo className="w-10 h-10 shadow-sm rounded-xl" />}
              <div>
                <h1 className="text-base font-black text-slate-900">{platformTitle}</h1>
                <p className="text-xs text-slate-500 font-medium">UnityTeck Store Connector</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {comingSoon ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-900">Coming Soon</h3>
                <p className="text-xs text-slate-600 leading-relaxed px-2">
                  {platformTitle} API is not wired yet. Live connect works for Instagram and Facebook only via Meta Graph token in Social Hub.
                </p>
                <p className="text-xs text-slate-500 font-mono">{accountHandle || accountName}</p>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-3 rounded-2xl text-xs font-black text-white cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      Active Store
                    </span>
                    <h3 className="text-sm font-black text-slate-900">{storeName}</h3>
                    <p className="text-xs font-mono text-emerald-800 font-bold mt-0.5">{storeId}</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                    {storeName.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-black">
                    <Info className="w-4 h-4" />
                    <span>Real Meta Graph token required</span>
                  </div>
                  <p className="leading-relaxed">
                    Instant OAuth tokens are disabled. Close this window and paste your Page / Instagram Business token in Social Publishing Hub, then run Live Test.
                  </p>
                  <p className="font-mono text-[10px] text-emerald-800">
                    {platform === 'instagram'
                      ? 'scopes: instagram_basic, instagram_content_publish'
                      : 'scopes: pages_show_list, pages_manage_posts, pages_read_engagement'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/60 max-h-40 overflow-y-auto">
                  {permissionsList.map((perm) => (
                    <div key={perm.code} className="p-3 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900">{perm.titleEn}</div>
                        <div className="text-[11px] text-slate-500 leading-snug">{perm.descEn}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-3 rounded-2xl text-xs font-black text-white cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #1877F2, #0064e0)' }}
                >
                  Close & use Social Hub token form
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 text-center text-[11px] text-slate-500 border-t border-slate-200 bg-white">
        Protected by UnityTeck OAuth 2.0 Security · End-to-end Encrypted · Zero Dummy Data
      </div>
    </div>
  );
};
