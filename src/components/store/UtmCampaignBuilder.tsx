import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { storePublicHost } from './seo/storeSeoSetup';
import { isApiEnabled } from '../../api/client';
import {
  createStoreUtmLinkApi,
  deleteStoreUtmLinkApi,
  fetchStoreUtmLinksApi,
  type StoreUtmLinkRow,
} from '../../api/tenantApi';
import {
  FacebookBrandIcon,
  GoogleAdsIcon,
  InstagramBrandIcon,
  SnapchatIcon,
  TikTokIcon,
  WhatsAppBrandIcon,
} from '../common/BrandIcons';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  QrCode,
  Trash2,
  Plus,
  BarChart2,
  Layers,
  Zap,
  Smartphone,
  Share2,
} from 'lucide-react';

type SavedCampaign = StoreUtmLinkRow & { url?: string; createdAt?: string };

const PLATFORM_OPTIONS: Array<{
  key: string;
  labelEn: string;
  labelAr: string;
  source: string;
  medium: string;
  content: string;
}> = [
  { key: 'whatsapp_group', labelEn: 'WhatsApp Groups', labelAr: 'مجموعات واتساب', source: 'whatsapp', medium: 'group', content: 'group-link' },
  { key: 'whatsapp_broadcast', labelEn: 'WhatsApp Broadcast', labelAr: 'بث واتساب', source: 'whatsapp', medium: 'broadcast', content: 'broadcast-v1' },
  { key: 'facebook', labelEn: 'Facebook', labelAr: 'فيسبوك', source: 'facebook', medium: 'paid_social', content: 'feed-ad' },
  { key: 'instagram', labelEn: 'Instagram', labelAr: 'إنستغرام', source: 'instagram', medium: 'social', content: 'bio-link' },
  { key: 'snapchat', labelEn: 'Snapchat', labelAr: 'سناب شات', source: 'snapchat', medium: 'stories', content: 'story-card' },
  { key: 'tiktok', labelEn: 'TikTok', labelAr: 'تيك توك', source: 'tiktok', medium: 'paid_social', content: 'video-reel' },
  { key: 'telegram', labelEn: 'Telegram', labelAr: 'تيليجرام', source: 'telegram', medium: 'channel', content: 'channel-post' },
  { key: 'google_ads', labelEn: 'Google Ads', labelAr: 'إعلانات جوجل', source: 'google', medium: 'cpc', content: 'search-ad' },
  { key: 'email', labelEn: 'Email Marketing', labelAr: 'التسويق بالبريد', source: 'email', medium: 'newsletter', content: 'newsletter-v1' },
  { key: 'influencer', labelEn: 'Influencer Marketing', labelAr: 'تسويق المؤثرين', source: 'influencer', medium: 'partnership', content: 'creator-post' },
  { key: 'qr', labelEn: 'QR Codes', labelAr: 'رموز الاستجابة', source: 'qr_stand', medium: 'offline_print', content: 'qr-v1' },
  { key: 'other', labelEn: 'Other / Custom', labelAr: 'مصدر مخصص', source: 'referral', medium: 'custom', content: 'custom-link' },
];

type Preset = {
  id: string;
  labelEn: string;
  labelAr: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  Icon: React.FC<{ className?: string; title?: string }>;
  iconClass?: string;
};

const PRESETS: Preset[] = [
  {
    id: 'google-search',
    labelEn: 'Google Ads Search',
    labelAr: 'إعلانات بحث جوجل',
    source: 'google',
    medium: 'cpc',
    campaign: 'google-search-sales',
    content: 'ad-text-v1',
    Icon: GoogleAdsIcon,
  },
  {
    id: 'facebook-ads',
    labelEn: 'Facebook Ads / Feed',
    labelAr: 'إعلانات فيسبوك',
    source: 'facebook',
    medium: 'paid_social',
    campaign: 'facebook-feed-offers',
    content: 'feed-ad-v1',
    Icon: FacebookBrandIcon,
    iconClass: 'text-[#1877F2]',
  },
  {
    id: 'instagram-bio',
    labelEn: 'Instagram Bio / Ads',
    labelAr: 'إنستغرام · البايو والإعلانات',
    source: 'instagram',
    medium: 'social',
    campaign: 'instagram-offers',
    content: 'bio-link',
    Icon: InstagramBrandIcon,
    iconClass: 'text-[#E4405F]',
  },
  {
    id: 'whatsapp-share',
    labelEn: 'WhatsApp Share',
    labelAr: 'مشاركة واتساب',
    source: 'whatsapp',
    medium: 'social',
    campaign: 'whatsapp-broadcast',
    content: 'chat-link',
    Icon: WhatsAppBrandIcon,
    iconClass: 'text-[#25D366]',
  },
  {
    id: 'tiktok-reels',
    labelEn: 'TikTok Ads & Reels',
    labelAr: 'تيك توك · الإعلانات والريلز',
    source: 'tiktok',
    medium: 'paid_social',
    campaign: 'tiktok-reels',
    content: 'video-reel-v1',
    Icon: TikTokIcon,
  },
  {
    id: 'snapchat-story',
    labelEn: 'Snapchat Stories',
    labelAr: 'قصص سناب شات',
    source: 'snapchat',
    medium: 'stories',
    campaign: 'snap-stories',
    content: 'story-card-v1',
    Icon: SnapchatIcon,
    iconClass: 'text-amber-600',
  },
  {
    id: 'hotel-qr',
    labelEn: 'Hotel / Print QR',
    labelAr: 'رمز استقبال الفندق',
    source: 'qr_stand',
    medium: 'offline_print',
    campaign: 'lobby-qr',
    content: 'acrylic-stand-qr',
    Icon: ({ className }) => <Smartphone className={className} />,
    iconClass: 'text-[var(--accent)]',
  },
];

export const UtmCampaignBuilder: React.FC = () => {
  const { activeStore, allProducts } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const baseUrl = useMemo(() => {
    const host = storePublicHost(activeStore);
    if (host) return `https://${host}`;
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin.replace(/\/$/, '');
    }
    return '';
  }, [activeStore]);

  const [targetPath, setTargetPath] = useState('/');
  const [productId, setProductId] = useState('');
  const [platformKey, setPlatformKey] = useState('whatsapp_broadcast');
  const [customUrl, setCustomUrl] = useState('');
  const [utmSource, setUtmSource] = useState('whatsapp');
  const [utmMedium, setUtmMedium] = useState('broadcast');
  const [utmCampaign, setUtmCampaign] = useState('store_promo');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('chat-link');
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);

  const storeProducts = useMemo(
    () => (allProducts && activeStore?.id ? allProducts[activeStore.id] || [] : []),
    [allProducts, activeStore?.id],
  );

  const reloadSaved = async () => {
    if (!activeStore?.id || !isApiEnabled()) {
      setSavedCampaigns([]);
      return;
    }
    try {
      const res = await fetchStoreUtmLinksApi(activeStore.id);
      setSavedCampaigns(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSavedCampaigns([]);
    }
  };

  useEffect(() => {
    void reloadSaved();
  }, [activeStore.id]);

  useEffect(() => {
    const platform = PLATFORM_OPTIONS.find((p) => p.key === platformKey);
    if (!platform) return;
    setUtmSource(platform.source);
    setUtmMedium(platform.medium);
    setUtmContent(platform.content);
  }, [platformKey]);

  useEffect(() => {
    if (!productId) return;
    const product = storeProducts.find((p) => p.id === productId);
    if (!product) return;
    const slug = (product.slug || product.name || 'product')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    setTargetPath(`/product/${product.slug || product.id}`);
    setUtmCampaign(`${slug}_sale`);
  }, [productId, storeProducts]);

  const generatedUtmUrl = useMemo(() => {
    const root = customUrl.trim()
      ? customUrl.trim()
      : baseUrl
        ? `${baseUrl}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`
        : targetPath || '/';
    try {
      const url = new URL(root.startsWith('http') ? root : `https://${root}`);
      if (utmSource) url.searchParams.set('utm_source', utmSource.trim().toLowerCase());
      if (utmMedium) url.searchParams.set('utm_medium', utmMedium.trim().toLowerCase());
      if (utmCampaign) url.searchParams.set('utm_campaign', utmCampaign.trim().toLowerCase());
      if (utmTerm) url.searchParams.set('utm_term', utmTerm.trim());
      if (utmContent) url.searchParams.set('utm_content', utmContent.trim().toLowerCase());
      return url.toString();
    } catch {
      const glue = root.includes('?') ? '&' : '?';
      const params: string[] = [];
      if (utmSource) params.push(`utm_source=${encodeURIComponent(utmSource.trim().toLowerCase())}`);
      if (utmMedium) params.push(`utm_medium=${encodeURIComponent(utmMedium.trim().toLowerCase())}`);
      if (utmCampaign) params.push(`utm_campaign=${encodeURIComponent(utmCampaign.trim().toLowerCase())}`);
      if (utmTerm) params.push(`utm_term=${encodeURIComponent(utmTerm.trim())}`);
      if (utmContent) params.push(`utm_content=${encodeURIComponent(utmContent.trim().toLowerCase())}`);
      return `${root}${glue}${params.join('&')}`;
    }
  }, [baseUrl, targetPath, customUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  const canBuild = Boolean(utmSource.trim() && utmMedium.trim() && utmCampaign.trim() && generatedUtmUrl);

  const handleCopyUrl = async () => {
    if (!canBuild) {
      toast(
        isAr ? 'أكمل المصدر والوسيط واسم الحملة أولاً' : 'Fill source, medium, and campaign first',
        'error',
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedUtmUrl);
      setCopied(true);
      toast(
        isAr ? 'تم نسخ رابط التتبع بنجاح' : 'Tracking link copied',
        'success',
      );
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast(isAr ? 'تعذر النسخ' : 'Could not copy', 'error');
    }
  };

  const handleShareWhatsApp = () => {
    if (!canBuild) {
      toast(
        isAr ? 'أكمل المصدر والوسيط واسم الحملة أولاً' : 'Fill source, medium, and campaign first',
        'error',
      );
      return;
    }
    const text = isAr
      ? `تسوق من متجرنا:\n${generatedUtmUrl}`
      : `Shop our store:\n${generatedUtmUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleSaveCampaign = () => {
    if (!canBuild) {
      toast(
        isAr ? 'أكمل المصدر والوسيط واسم الحملة أولاً' : 'Fill source, medium, and campaign first',
        'error',
      );
      return;
    }
    if (!activeStore?.id || !isApiEnabled()) {
      toast(isAr ? 'الاتصال بالخادم غير متاح' : 'API not available', 'error');
      return;
    }
  void (async () => {
      try {
        await createStoreUtmLinkApi(activeStore.id, {
          name: `${utmSource} — ${utmCampaign}`,
          platform_key: platformKey,
          target_path: targetPath,
          product_id: productId || undefined,
          target_url: generatedUtmUrl,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_term: utmTerm || undefined,
          utm_content: utmContent || undefined,
        });
        await reloadSaved();
        toast(isAr ? 'تم حفظ رابط الحملة في السجل' : 'Campaign link saved', 'success');
      } catch {
        toast(isAr ? 'تعذر حفظ الرابط' : 'Could not save link', 'error');
      }
    })();
  };

  const handleDeleteCampaign = (id: string) => {
    if (!activeStore?.id || !isApiEnabled()) return;
    void (async () => {
      try {
        await deleteStoreUtmLinkApi(activeStore.id, id);
        await reloadSaved();
        toast(isAr ? 'تم حذف الرابط من السجل' : 'Campaign deleted', 'info');
      } catch {
        toast(isAr ? 'تعذر الحذف' : 'Could not delete', 'error');
      }
    })();
  };

  const applyPreset = (preset: Preset) => {
    setUtmSource(preset.source);
    setUtmMedium(preset.medium);
    setUtmCampaign(preset.campaign);
    setUtmContent(preset.content);
    toast(
      isAr
        ? `تم تطبيق قالب ${preset.labelAr}`
        : `Applied ${preset.labelEn} preset`,
      'success',
    );
  };

  const fieldClass =
    'w-full px-3 py-2.5 rounded-xl border text-xs font-mono font-semibold focus:outline-none focus:ring-2 transition-shadow';
  const fieldStyle: React.CSSProperties = {
    borderColor: 'var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    ['--tw-ring-color' as string]: 'var(--accent)',
  };

  return (
    <div className="space-y-6">
      {/* Header — global glass (no solid blue) */}
      <div
        className="u-card u-panel flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-7"
        style={{ color: 'var(--text)' }}
      >
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="u-icon-brand p-2.5 rounded-2xl shadow-inner shrink-0">
              <Link2 className="w-5 h-5" aria-hidden />
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {isAr ? 'مولد روابط الحملات والمتابعة' : 'UTM Campaign URL Builder & Tracker'}
            </h2>
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
              style={{
                background: 'color-mix(in srgb, #10b981 16%, transparent)',
                color: '#047857',
                borderColor: 'color-mix(in srgb, #10b981 40%, transparent)',
              }}
            >
              {isAr ? 'متزامن مع التحليلات' : 'Analytics sync'}
            </span>
          </div>
          <p className="text-xs max-w-2xl leading-relaxed" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'أنشئ رابط تتبع لواتساب وفيسبوك وإنستغرام وتيك توك وسناب شات وجوجل. عند فتح الرابط يظهر المصدر في تقرير الزيارات والطلبات لهذا المتجر فقط.'
              : 'Build tracked links for WhatsApp, Facebook, Instagram, TikTok, Snapchat, and Google. When a visitor opens the link, that source appears in this store’s traffic and order reports.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveCampaign}
          className="unity-btn-primary shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'حفظ الحملة' : 'Save Campaign'}</span>
        </button>
      </div>

      {/* Presets */}
      <div className="u-card u-panel p-5 space-y-3">
        <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
          <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span>{isAr ? 'قوالب سريعة بنقرة واحدة:' : '1-Click Quick Campaign Presets:'}</span>
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 text-xs">
          {PRESETS.map((pr) => {
            const Icon = pr.Icon;
            const active = utmSource === pr.source && utmMedium === pr.medium;
            return (
              <button
                key={pr.id}
                type="button"
                onClick={() => applyPreset(pr)}
                className="p-3 rounded-2xl border transition-all text-start cursor-pointer group flex flex-col justify-between gap-2 min-h-[76px]"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--surface)',
                  boxShadow: active ? '0 0 0 1px var(--accent)' : undefined,
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <Icon className={`w-5 h-5 shrink-0 ${pr.iconClass || ''}`} title={pr.source} />
                  <span
                    className="text-[9px] font-mono font-bold uppercase truncate"
                    style={{ color: 'var(--muted)' }}
                  >
                    {pr.source}
                  </span>
                </div>
                <span className="font-bold text-[11px] leading-snug" style={{ color: 'var(--text)' }}>
                  {isAr ? pr.labelAr : pr.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Builder workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="u-card u-panel lg:col-span-7 p-5 sm:p-6 space-y-4">
          <div
            className="flex items-center justify-between border-b pb-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span>{isAr ? 'إعداد معاملات التتبع' : 'Configure UTM Parameters'}</span>
            </h3>
            <span className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
              {activeStore.slug || activeStore.id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? 'منصة التسويق' : 'Marketing platform'}
              </label>
              <select
                value={platformKey}
                onChange={(e) => setPlatformKey(e.target.value)}
                className={`${fieldClass} w-full`}
                style={fieldStyle}
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {isAr ? p.labelAr : p.labelEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? 'منتج محدد (اختياري)' : 'Product (optional)'}
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className={`${fieldClass} w-full`}
                style={fieldStyle}
              >
                <option value="">{isAr ? 'بدون منتج — صفحة عامة' : 'No product — generic page'}</option>
                {storeProducts.slice(0, 200).map((p) => (
                  <option key={p.id} value={p.id}>
                    {isAr ? p.nameAr || p.name : p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? '١. صفحة الهبوط المستهدفة' : '1. Target Landing Page URL'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={targetPath}
                onChange={(e) => {
                  setTargetPath(e.target.value);
                  setCustomUrl('');
                }}
                className={`${fieldClass} sm:w-1/2`}
                style={fieldStyle}
              >
                <option value="/">{isAr ? 'الرئيسية' : 'Homepage (/)'}</option>
                <option value="/shop">{isAr ? 'المتجر' : 'Shop (/shop)'}</option>
                <option value="/catalog">{isAr ? 'الكتالوج' : 'Catalog (/catalog)'}</option>
                <option value="/cart">{isAr ? 'سلة التسوق' : 'Cart (/cart)'}</option>
                <option value="/checkout">{isAr ? 'إتمام الشراء' : 'Checkout (/checkout)'}</option>
              </select>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder={isAr ? 'أو رابط مخصص https://...' : 'Or custom URL https://...'}
                className={`${fieldClass} sm:w-1/2`}
                style={fieldStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? '٢. مصدر الحملة' : '2. Campaign Source (utm_source)'}
                <span className="text-rose-500 ms-1">*</span>
              </label>
              <input
                type="text"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="whatsapp, facebook, instagram..."
                className={fieldClass}
                style={fieldStyle}
              />
              <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'مثال: whatsapp · facebook · instagram · google'
                  : 'Platform referrer (whatsapp, facebook, instagram, google)'}
              </span>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? '٣. وسيط الحملة' : '3. Campaign Medium (utm_medium)'}
                <span className="text-rose-500 ms-1">*</span>
              </label>
              <input
                type="text"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="social, cpc, paid_social..."
                className={fieldClass}
                style={fieldStyle}
              />
              <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>
                {isAr ? 'مثال: social · cpc · paid_social · stories' : 'Marketing medium (social, cpc, paid_social)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? '٤. اسم الحملة' : '4. Campaign Name (utm_campaign)'}
                <span className="text-rose-500 ms-1">*</span>
              </label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="ramadan-sale, hotel-promo..."
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? '٥. محتوى الإعلان' : '5. Ad Content (utm_content)'}
              </label>
              <input
                type="text"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
                placeholder="banner-v1, chat-link..."
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? '٦. الكلمات المفتاحية' : '6. Campaign Keyword Term (utm_term)'}
            </label>
            <input
              type="text"
              value={utmTerm}
              onChange={(e) => setUtmTerm(e.target.value)}
              placeholder={isAr ? 'قهوة، توصيل سريع، عروض رمضان...' : 'coffee, express delivery, ramadan offers...'}
              className={fieldClass}
              style={fieldStyle}
            />
          </div>
        </div>

        {/* Live URL panel — global glass */}
        <div
          className="u-card u-panel lg:col-span-5 p-5 sm:p-6 space-y-4 flex flex-col justify-between"
          style={{ color: 'var(--text)' }}
        >
          <div className="space-y-3">
            <div
              className="flex items-center justify-between border-b pb-3 gap-2"
              style={{ borderColor: 'var(--glass-border, var(--border))' }}
            >
              <span className="font-bold text-xs flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                <span className="u-icon-brand w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" aria-hidden />
                </span>
                <span>{isAr ? 'الرابط النهائي للتتبع' : 'Generated Live Tracking URL'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border"
                style={{
                  background: 'var(--glass-fill-strong, var(--surface))',
                  color: 'var(--text)',
                  borderColor: 'var(--glass-border, var(--border))',
                }}
              >
                <QrCode className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                <span>{showQrCode ? (isAr ? 'إخفاء الرمز' : 'Hide QR') : (isAr ? 'رمز الاستجابة' : 'QR Code')}</span>
              </button>
            </div>

            <div
              className="p-3.5 rounded-2xl border font-mono text-xs break-all leading-relaxed select-all"
              style={{
                background: 'color-mix(in srgb, var(--accent) 8%, var(--glass-fill, var(--surface)))',
                borderColor: 'color-mix(in srgb, var(--accent) 28%, var(--border))',
                color: 'var(--accent)',
              }}
            >
              {generatedUtmUrl || (isAr ? 'أدخل نطاق المتجر أو رابطاً مخصصاً' : 'Add store domain or a custom URL')}
            </div>

            {showQrCode && generatedUtmUrl.startsWith('http') && (
              <div
                className="p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 border"
                style={{
                  background: 'var(--glass-fill-strong, #fff)',
                  borderColor: 'var(--glass-border, var(--border))',
                  color: 'var(--text)',
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(generatedUtmUrl)}`}
                  alt={isAr ? 'رمز تتبع الحملة' : 'UTM QR Code'}
                  className="w-36 h-36 rounded-lg border border-slate-200 bg-white"
                />
                <span className="text-[10px] font-bold text-center" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'امسح الرمز لتجربة رابط التتبع' : 'Scan to open the live tracking link'}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              {[
                { label: isAr ? 'المصدر' : 'Source', value: utmSource },
                { label: isAr ? 'الوسيط' : 'Medium', value: utmMedium },
                { label: isAr ? 'الحملة' : 'Campaign', value: utmCampaign },
                { label: isAr ? 'المحتوى' : 'Content', value: utmContent },
              ].map((row) => (
                <div
                  key={row.label}
                  className="p-2 rounded-xl border flex flex-col store-glass-card"
                  style={{ borderColor: 'var(--glass-border, var(--border))' }}
                >
                  <span style={{ color: 'var(--muted)' }}>{row.label}</span>
                  <span className="font-bold truncate" style={{ color: 'var(--text)' }}>
                    {row.value || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--glass-border, var(--border))' }}>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="w-full py-2.5 rounded-xl font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all unity-btn-primary"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>
                {copied
                  ? isAr
                    ? 'تم النسخ!'
                    : 'Copied!'
                  : isAr
                    ? 'نسخ رابط التتبع'
                    : 'Copy Tracking Link'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              <WhatsAppBrandIcon className="w-4 h-4" title="WhatsApp" />
              <Share2 className="w-3.5 h-3.5 opacity-90" />
              <span>{isAr ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}</span>
            </button>

            {generatedUtmUrl.startsWith('http') ? (
              <a
                href={generatedUtmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors border store-glass-card"
                style={{
                  color: 'var(--text)',
                  borderColor: 'var(--glass-border, var(--border))',
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'فتح الرابط للتجربة' : 'Test Open Live in New Tab'}</span>
              </a>
            ) : (
              <span
                className="w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border"
                style={{
                  color: 'var(--muted)',
                  borderColor: 'var(--glass-border, var(--border))',
                  background: 'var(--glass-fill, var(--surface))',
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isAr ? 'الرابط غير جاهز بعد' : 'Link not ready yet'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Saved library */}
      <div className="u-card u-panel p-5 sm:p-6 space-y-4">
        <div
          className="flex items-center justify-between border-b pb-3 gap-2 flex-wrap"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {isAr ? 'سجل روابط الحملات' : 'Saved Campaign Links'}
            </h3>
          </div>
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg border"
            style={{
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              color: 'var(--accent)',
              borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)',
            }}
          >
            {savedCampaigns.length} {isAr ? 'روابط محفوظة' : 'Saved links'}
          </span>
        </div>

        {savedCampaigns.length === 0 ? (
          <div className="py-10 text-center space-y-1">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'لا توجد سجلات' : 'No records found'}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'احفظ رابطاً بعد إنشائه — النقرات تظهر من زيارات المتجر الحقيقية فقط.'
                : 'Save a link after building it — clicks come from real storefront visits only.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr
                  className="border-b font-bold"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'color-mix(in srgb, var(--muted) 8%, transparent)' }}
                >
                  <th className="p-3 text-start">{isAr ? 'الحملة والمصدر' : 'Campaign & Source'}</th>
                  <th className="p-3 text-start">{isAr ? 'الوسيط' : 'Medium'}</th>
                  <th className="p-3 text-start">{isAr ? 'رابط التتبع' : 'Tracking Link'}</th>
                  <th className="p-3 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {savedCampaigns.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                    <td className="p-3">
                      <div className="font-bold" style={{ color: 'var(--text)' }}>
                        {c.name}
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                        {c.source} · {c.created_at || c.createdAt || '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        {c.medium}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <span className="text-[11px] font-mono truncate block" style={{ color: 'var(--muted)' }}>
                        {c.url || ''}
                      </span>
                    </td>
                    <td className="p-3 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(c.url || '');
                            toast(isAr ? 'تم نسخ الرابط' : 'Copied', 'success');
                          }}
                          className="p-1.5 rounded-lg cursor-pointer"
                          style={{ color: 'var(--muted)' }}
                          title={isAr ? 'نسخ الرابط' : 'Copy Link'}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={c.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg"
                          style={{ color: 'var(--muted)' }}
                          title={isAr ? 'فتح الرابط' : 'Open Link'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(c.id)}
                          className="p-1.5 rounded-lg text-rose-500 cursor-pointer"
                          title={isAr ? 'حذف الحملة' : 'Delete Campaign'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
