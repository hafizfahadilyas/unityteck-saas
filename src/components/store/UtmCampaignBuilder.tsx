import React, { useState, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  QrCode,
  Share2,
  Trash2,
  Plus,
  BarChart2,
  Globe,
  Filter,
  Layers,
  Send,
  Smartphone,
  Eye,
  Zap,
} from 'lucide-react';

interface SavedCampaign {
  id: string;
  name: string;
  url: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  createdAt: string;
  clicks: number;
  conversions: number;
}

export const UtmCampaignBuilder: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const baseUrl = useMemo(() => {
    if (activeStore.custom_domain) return `https://${activeStore.custom_domain}`;
    return `https://${activeStore.slug || 'giftshop'}.saudi-stores.com`;
  }, [activeStore]);

  // Form State
  const [targetPath, setTargetPath] = useState('/');
  const [customUrl, setCustomUrl] = useState('');
  const [utmSource, setUtmSource] = useState('google');
  const [utmMedium, setUtmMedium] = useState('cpc');
  const [utmCampaign, setUtmCampaign] = useState('ramadan-offers-2026');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('banner-ad-v1');
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Stored Campaign History
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>(() => {
    try {
      const saved = localStorage.getItem(`utm_campaigns_${activeStore.id}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'camp-1',
        name: isAr ? 'حملة إعلانات جوجل سيرش - ورد مكة' : 'Google Search - Mecca Flowers',
        url: `${baseUrl}/catalog?utm_source=google&utm_medium=cpc&utm_campaign=makkah-flowers&utm_term=ورد-مكة&utm_content=search-v1`,
        source: 'google',
        medium: 'cpc',
        campaign: 'makkah-flowers',
        term: 'ورد-مكة',
        content: 'search-v1',
        createdAt: '2026-10-07',
        clicks: 342,
        conversions: 28,
      },
      {
        id: 'camp-2',
        name: isAr ? 'ريلز تيك توك - باقات هدايا الفنادق' : 'TikTok Reels - Hotel Gift Sets',
        url: `${baseUrl}/?utm_source=tiktok&utm_medium=reels&utm_campaign=hotel-gifts-promo&utm_content=video-story-1`,
        source: 'tiktok',
        medium: 'reels',
        campaign: 'hotel-gifts-promo',
        content: 'video-story-1',
        createdAt: '2026-10-06',
        clicks: 814,
        conversions: 62,
      },
      {
        id: 'camp-3',
        name: isAr ? 'سناب شات - عروض التوصيل السريع لساعتين' : 'Snapchat Ads - 2-Hour Express Delivery',
        url: `${baseUrl}/catalog?utm_source=snapchat&utm_medium=stories&utm_campaign=express-delivery-2h&utm_content=snap-ad-gold`,
        source: 'snapchat',
        medium: 'stories',
        campaign: 'express-delivery-2h',
        content: 'snap-ad-gold',
        createdAt: '2026-10-05',
        clicks: 520,
        conversions: 41,
      },
      {
        id: 'camp-4',
        name: isAr ? 'واتساب ستاند فنادق الحرم (QR Code)' : 'Haram Hotels Concierge WhatsApp QR',
        url: `${baseUrl}/?utm_source=whatsapp&utm_medium=qr_stand&utm_campaign=hotel-concierge-reception&utm_content=qr-card-stand`,
        source: 'whatsapp',
        medium: 'qr_stand',
        campaign: 'hotel-concierge-reception',
        content: 'qr-card-stand',
        createdAt: '2026-10-04',
        clicks: 195,
        conversions: 37,
      },
    ];
  });

  const saveToLocalStorage = (list: SavedCampaign[]) => {
    try {
      localStorage.setItem(`utm_campaigns_${activeStore.id}`, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  // Generate Real Full UTM URL
  const generatedUtmUrl = useMemo(() => {
    const root = customUrl.trim() ? customUrl.trim() : `${baseUrl}${targetPath}`;
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
      if (utmSource) params.push(`utm_source=${encodeURIComponent(utmSource)}`);
      if (utmMedium) params.push(`utm_medium=${encodeURIComponent(utmMedium)}`);
      if (utmCampaign) params.push(`utm_campaign=${encodeURIComponent(utmCampaign)}`);
      if (utmTerm) params.push(`utm_term=${encodeURIComponent(utmTerm)}`);
      if (utmContent) params.push(`utm_content=${encodeURIComponent(utmContent)}`);
      return `${root}${glue}${params.join('&')}`;
    }
  }, [baseUrl, targetPath, customUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(generatedUtmUrl);
    setCopied(true);
    toast(isAr ? 'تم نسخ الرابط المتبع مع معاملات UTM بنجاح!' : 'UTM tracking URL copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCampaign = () => {
    const newCamp: SavedCampaign = {
      id: `camp_${Date.now()}`,
      name: `${utmSource.toUpperCase()} — ${utmCampaign || 'Campaign'}`,
      url: generatedUtmUrl,
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
      term: utmTerm,
      content: utmContent,
      createdAt: new Date().toISOString().split('T')[0],
      clicks: 0,
      conversions: 0,
    };
    const updated = [newCamp, ...savedCampaigns];
    setSavedCampaigns(updated);
    saveToLocalStorage(updated);
    toast(isAr ? 'تم حفظ الحملة الإعلانية بنجاح في السجل!' : 'Campaign link saved to your tracking library!', 'success');
  };

  const handleDeleteCampaign = (id: string) => {
    const updated = savedCampaigns.filter((c) => c.id !== id);
    setSavedCampaigns(updated);
    saveToLocalStorage(updated);
    toast(isAr ? 'تم حذف الرابط من السجل' : 'Campaign deleted', 'info');
  };

  // Preset Handlers
  const applyPreset = (preset: {
    source: string;
    medium: string;
    campaign: string;
    content: string;
  }) => {
    setUtmSource(preset.source);
    setUtmMedium(preset.medium);
    setUtmCampaign(preset.campaign);
    setUtmContent(preset.content);
    toast(
      isAr
        ? `تم تطبيق قالب إعلانات (${preset.source.toUpperCase()}) بنجاح!`
        : `Applied (${preset.source.toUpperCase()}) campaign preset!`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Intro Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-md border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Link2 className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'مولد ومتبع روابط الحملات الإعلانية (UTM Campaign Tracking)' : 'UTM Campaign URL Builder & Tracker'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              GA4 & GTM Sync
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {isAr
              ? 'قم بإنشاء روابط مخصصة لإعلانات جوجل، سناب شات، تيك توك، واتساب، وإنستغرام لتتبع مصادر الزوار والمبيعات بدقة ١٠٠٪ داخل Google Analytics 4 ولوحة تحكم المتجر.'
              : 'Generate custom campaign tracking links for Google Ads, TikTok, Snapchat, Instagram, and WhatsApp to track traffic sources, orders, and ROI in GA4.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSaveCampaign}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1.5 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'حفظ الرابط بالسجل' : 'Save Campaign'}</span>
          </button>
        </div>
      </div>

      {/* 2. One-Click Quick Campaign Presets */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs space-y-3">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{isAr ? 'قوالب سريعة بنقرة واحدة (1-Click Presets):' : '1-Click Quick Campaign Presets:'}</span>
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {[
            {
              id: 'google-search',
              label: 'Google Ads Search',
              icon: '🔍',
              source: 'google',
              medium: 'cpc',
              campaign: 'google-search-sales',
              content: 'ad-text-v1',
            },
            {
              id: 'tiktok-reels',
              label: 'TikTok Ads & Reels',
              icon: '🎵',
              source: 'tiktok',
              medium: 'reels',
              campaign: 'tiktok-viral-gifts',
              content: 'video-reel-v1',
            },
            {
              id: 'snapchat-story',
              label: 'Snapchat Stories',
              icon: '👻',
              source: 'snapchat',
              medium: 'stories',
              campaign: 'snap-express-delivery',
              content: 'story-card-v1',
            },
            {
              id: 'instagram-bio',
              label: 'Instagram Bio / Ads',
              icon: '📸',
              source: 'instagram',
              medium: 'bio_link',
              campaign: 'instagram-luxury-sets',
              content: 'carousel-ad',
            },
            {
              id: 'whatsapp-hotel',
              label: 'WhatsApp Concierge',
              icon: '💬',
              source: 'whatsapp',
              medium: 'chat_direct',
              campaign: 'hotel-guests-vip',
              content: 'reception-card',
            },
            {
              id: 'hotel-qr',
              label: 'Hotel Reception QR',
              icon: '📱',
              source: 'qr_stand',
              medium: 'offline_print',
              campaign: 'hotel-lobby-stands',
              content: 'acrylic-stand-qr',
            },
          ].map((pr) => (
            <button
              key={pr.id}
              type="button"
              onClick={() => applyPreset(pr)}
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-all text-start cursor-pointer group flex flex-col justify-between space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-base">{pr.icon}</span>
                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {pr.source}
                </span>
              </div>
              <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                {pr.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Two-Column Builder Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Parameters Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{isAr ? 'إعداد معاملات الرابط (UTM Parameters)' : 'Configure UTM Parameters'}</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              {activeStore.slug || 'store'}
            </span>
          </div>

          {/* 1. Destination URL / Store Page Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? '١. صفحة الهبوط المستهدفة (Destination URL):' : '1. Target Landing Page URL:'}
            </label>
            <div className="flex gap-2">
              <select
                value={targetPath}
                onChange={(e) => {
                  setTargetPath(e.target.value);
                  setCustomUrl('');
                }}
                className="w-1/2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="/">{isAr ? 'الرئيسية (Home Page)' : 'Homepage (/)'}</option>
                <option value="/catalog">{isAr ? 'كتالوج المنتجات الكامل (Catalog)' : 'Catalog (/catalog)'}</option>
                <option value="/catalog?category=natural-bouquets">{isAr ? 'باقات الورد الطبيعي' : 'Natural Bouquets'}</option>
                <option value="/catalog?category=roses-patchi">{isAr ? 'ورد وشوكليت باتشي' : 'Patchi & Roses'}</option>
                <option value="/catalog?category=roses-cake">{isAr ? 'ورد وكيك المناسبات' : 'Cakes & Blooms'}</option>
                <option value="/catalog?category=mawajeeb">{isAr ? 'لوحات مواجيب وتراث' : 'Mawajeeb Heritage'}</option>
                <option value="/cart">{isAr ? 'سلة المشتريات (Cart)' : 'Cart (/cart)'}</option>
              </select>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder={isAr ? 'أو اكتب رابطاً مخصصاً https://...' : 'Or enter custom URL https://...'}
                className="w-1/2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Campaign Source & Medium */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {isAr ? '٢. مصدر الحملة (Campaign Source - utm_source):' : '2. Campaign Source (utm_source):'}
                <span className="text-rose-500 ms-1">*</span>
              </label>
              <input
                type="text"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="google, tiktok, snapchat, whatsapp, instagram..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                {isAr ? 'المنصة التي تعرض الإعلان (Google, TikTok, Snapchat)' : 'Platform referrer (google, facebook, etc.)'}
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {isAr ? '٣. نوع الإعلان (Campaign Medium - utm_medium):' : '3. Campaign Medium (utm_medium):'}
                <span className="text-rose-500 ms-1">*</span>
              </label>
              <input
                type="text"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="cpc, reels, stories, banner, email, qr_stand..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                {isAr ? 'نوع الوسيط الإعلاني (cpc, stories, reels, bio_link)' : 'Marketing medium (cpc, banner, email)'}
              </span>
            </div>
          </div>

          {/* 3. Campaign Name & Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {isAr ? '٤. اسم الحملة (Campaign Name - utm_campaign):' : '4. Campaign Name (utm_campaign):'}
                <span className="text-rose-500 ms-1">*</span>
              </label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="ramadan-sale, hotel-promo, eid-gifts..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {isAr ? '٥. محتوى الإعلان (Ad Content - utm_content):' : '5. Ad Content (utm_content):'}
              </label>
              <input
                type="text"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
                placeholder="video-v1, red-roses, discount-20..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Campaign Term (Keywords) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {isAr ? '٦. الكلمات المفتاحية (Campaign Term - utm_term):' : '6. Campaign Keyword Term (utm_term):'}
            </label>
            <input
              type="text"
              value={utmTerm}
              onChange={(e) => setUtmTerm(e.target.value)}
              placeholder={isAr ? 'ورد مكة, توصيل فنادق الحرم, هدايا فاخرة...' : 'makkah flowers, luxury gift sets, express delivery...'}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Side: Live Generated Link & QR Code (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-xs text-indigo-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'الرابط النهائي الجاهز للإعلان' : 'Generated Live Tracking URL'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>{showQrCode ? (isAr ? 'إخفاء QR' : 'Hide QR') : (isAr ? 'عرض QR' : 'QR Code')}</span>
              </button>
            </div>

            {/* Generated Link Box */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-indigo-500/30 text-emerald-400 font-mono text-xs break-all leading-relaxed select-all">
              {generatedUtmUrl}
            </div>

            {/* QR Code Container if enabled */}
            {showQrCode && (
              <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center text-slate-900 space-y-2 border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(generatedUtmUrl)}`}
                  alt="UTM QR Code"
                  className="w-36 h-36 rounded-lg border border-slate-200 shadow-xs"
                />
                <span className="text-[10px] font-bold text-slate-500 text-center">
                  {isAr ? 'امسح الرمز بالجوال لتجربة الرابط المتبع' : 'Scan to test live UTM tracking link'}
                </span>
              </div>
            )}

            {/* Breakdown Badges */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 flex flex-col">
                <span className="text-slate-400">Source:</span>
                <span className="text-white font-bold truncate">{utmSource || '—'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 flex flex-col">
                <span className="text-slate-400">Medium:</span>
                <span className="text-white font-bold truncate">{utmMedium || '—'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 flex flex-col">
                <span className="text-slate-400">Campaign:</span>
                <span className="text-indigo-300 font-bold truncate">{utmCampaign || '—'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 flex flex-col">
                <span className="text-slate-400">Content:</span>
                <span className="text-emerald-300 font-bold truncate">{utmContent || '—'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (isAr ? 'تم النسخ إلى الحافظة!' : 'Copied to Clipboard!') : (isAr ? 'نسخ رابط التتبع' : 'Copy Tracking Link')}</span>
            </button>

            <a
              href={generatedUtmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isAr ? 'تجربة فتح الرابط مباشرة' : 'Test Open Live in New Tab'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4. Campaign Library & Click Tracker Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? 'سجل روابط الحملات النشطة وإحصائيات الزيارات' : 'Saved Campaign Links & Live Attribution'}
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800">
            {savedCampaigns.length} {isAr ? 'حملات نشطة' : 'Active Links'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold">
                <th className="p-3 text-start">{isAr ? 'اسم الحملة والمنصة' : 'Campaign & Source'}</th>
                <th className="p-3 text-start">{isAr ? 'الوسيط (Medium)' : 'Medium'}</th>
                <th className="p-3 text-start">{isAr ? 'الرابط المتبع' : 'Tracking Link'}</th>
                <th className="p-3 text-center">{isAr ? 'النقرات' : 'Clicks'}</th>
                <th className="p-3 text-center">{isAr ? 'الطلبات' : 'Conversions'}</th>
                <th className="p-3 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {savedCampaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {c.source} · {c.createdAt}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px]">
                      {c.medium}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate block">
                      {c.url}
                    </span>
                  </td>
                  <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {c.clicks}
                  </td>
                  <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {c.conversions}
                  </td>
                  <td className="p-3 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(c.url);
                          toast(isAr ? 'تم نسخ الرابط!' : 'Copied!', 'success');
                        }}
                        className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer"
                        title={isAr ? 'نسخ الرابط' : 'Copy Link'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer"
                        title={isAr ? 'فتح الرابط' : 'Open Link'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(c.id)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-slate-400 cursor-pointer"
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
      </div>
    </div>
  );
};
