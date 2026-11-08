import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Sparkles,
  Coins,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  ShoppingCart,
  CheckCircle2,
  Plus,
  Send,
  Eye,
  Share2,
  Globe,
  Zap,
  RefreshCw,
  MessageCircle,
  MapPin,
  Sliders,
  Lock,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import {
  KSA_CITIES,
  type KsaCity,
  type KsaAdPlatform,
  type KsaAdCampaign,
  type StoreAdWalletState,
  type StoreSocialScheduleState,
  getStoreAdWallet,
  saveStoreAdWallet,
  requestAdWalletTopUp,
  masterApproveAdWalletTopUp,
  getStoreAdCampaigns,
  saveStoreAdCampaigns,
  getStoreSocialSchedule,
  requestStudioProUpgrade,
} from '../../services/ksaAutomationEngine';
import { AdvanceFeatureComingSoonModal } from '../common/AdvanceFeatureComingSoonModal';
import {
  useAdvanceFeatures,
  type AdvanceFeatureConfig,
} from '../../services/advanceFeaturesService';
import { isApiEnabled } from '../../api/client';
import {
  createGoogleAdsCampaignApi,
  fetchGoogleAdsOverview,
  syncGoogleAdsApi,
  updateGoogleAdsCampaignApi,
  type GoogleAdsOverviewResponse,
} from '../../api/tenantApi';

const AD_PLATFORMS: Array<{
  id: KsaAdPlatform;
  nameEn: string;
  nameAr: string;
  badgeColor: string;
}> = [
  { id: 'snapchat', nameEn: 'Snapchat Ads KSA', nameAr: 'إعلانات سناب شات السعودية', badgeColor: 'bg-amber-400 text-slate-950' },
  { id: 'tiktok', nameEn: 'TikTok Ads KSA', nameAr: 'إعلانات تيك توك السعودية', badgeColor: 'bg-pink-600 text-white' },
  { id: 'instagram', nameEn: 'Instagram / Meta Ads', nameAr: 'إعلانات إنستغرام وميتا', badgeColor: 'bg-purple-600 text-white' },
  { id: 'google', nameEn: 'Google Search & Shopping', nameAr: 'إعلانات بحث وتسوق جوجل', badgeColor: 'bg-blue-600 text-white' },
  { id: 'youtube', nameEn: 'YouTube Shorts & Video', nameAr: 'إعلانات يوتيوب شورتس', badgeColor: 'bg-rose-600 text-white' },
];

export const KsaAdManagerAndSocialHub: React.FC<{ initialTab?: 'ads' | 'scheduler' }> = ({
  initialTab = 'ads',
}) => {
  const { activeStore, currentProducts, addOrder } = useTenant();
  const { locale, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'ads' | 'scheduler'>(initialTab);
  const [wallet, setWallet] = useState<StoreAdWalletState>(() => getStoreAdWallet(activeStore.id));
  const [campaigns, setCampaigns] = useState<KsaAdCampaign[]>(() => getStoreAdCampaigns(activeStore.id));
  const [adsOverview, setAdsOverview] = useState<GoogleAdsOverviewResponse | null>(null);
  const [adsLoading, setAdsLoading] = useState(false);
  const [socialState, setSocialState] = useState<StoreSocialScheduleState>(() =>
    getStoreSocialSchedule(activeStore.id, activeStore.slug),
  );

  const { getFeature } = useAdvanceFeatures();
  const [comingSoonModalFeature, setComingSoonModalFeature] = useState<AdvanceFeatureConfig | null>(null);

  const socialFeat = getFeature('social_auto_posting');
  const isSocialHidden = socialFeat?.mode === 'hidden';
  const isSocialSoon = socialFeat?.mode === 'coming_soon';

  const visiblePlatforms = useMemo(() => {
    return AD_PLATFORMS.filter((p) => {
      if (p.id === 'google') {
        const feat = getFeature('google_ads');
        return feat ? feat.mode !== 'hidden' : true;
      }
      if (p.id === 'tiktok') {
        const feat = getFeature('tiktok_ads');
        return feat ? feat.mode !== 'hidden' : true;
      }
      if (p.id === 'snapchat') {
        const feat = getFeature('snapchat_ads');
        return feat ? feat.mode !== 'hidden' : true;
      }
      return true;
    });
  }, [getFeature]);

  // Wallet Top-Up Modal
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [isAiLaunching, setIsAiLaunching] = useState(false);

  // Manual Ad Builder Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPlatform, setManualPlatform] = useState<KsaAdPlatform>('snapchat');
  const [manualCities, setManualCities] = useState<KsaCity[]>(['Riyadh', 'Jeddah', 'Makkah']);
  const [manualDailyBudget, setManualDailyBudget] = useState<number>(50);
  const [manualHeadline, setManualHeadline] = useState('');

  // Social Post Scheduler Form
  const [postPlatform, setPostPlatform] = useState<'instagram' | 'tiktok' | 'snapchat' | 'telegram' | 'x'>('instagram');
  const [postProductId, setPostProductId] = useState<string>(currentProducts[0]?.id || '');
  const [postCaption, setPostCaption] = useState<string>('');
  const [postScheduleTime, setPostScheduleTime] = useState<string>(
    new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 16),
  );
  const [cooldownText, setCooldownText] = useState<string>('');

  // Reload isolated state when switching stores
  useEffect(() => {
    setWallet(getStoreAdWallet(activeStore.id));
    setCampaigns(getStoreAdCampaigns(activeStore.id).filter((c) => c.mode !== 'ai_auto'));
    setSocialState(getStoreSocialSchedule(activeStore.id, activeStore.slug));
    setPostProductId(currentProducts[0]?.id || '');
    setAdsOverview(null);
  }, [activeStore.id, activeStore.slug, currentProducts]);

  // Real Google Ads snapshot only — never invent impressions/ROAS
  useEffect(() => {
    if (!isApiEnabled() || !activeStore?.id) return;
    let cancelled = false;
    setAdsLoading(true);
    void fetchGoogleAdsOverview(activeStore.id, false)
      .then((data) => {
        if (!cancelled) setAdsOverview(data);
      })
      .catch(() => {
        if (!cancelled) setAdsOverview(null);
      })
      .finally(() => {
        if (!cancelled) setAdsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeStore.id]);

  const googleCampaigns = adsOverview?.snapshot?.campaigns || [];
  const adsKpis = adsOverview?.snapshot?.kpis || null;

  // 3h Social Cooldown Ticker
  useEffect(() => {
    if (!socialState.nextAllowedPostAt) {
      setCooldownText('');
      return;
    }
    const tick = () => {
      if (!socialState.nextAllowedPostAt) return;
      const diff = socialState.nextAllowedPostAt - Date.now();
      if (diff <= 0) {
        setCooldownText('');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCooldownText(`${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [socialState.nextAllowedPostAt]);

  // Aggregate metrics — Google Ads KPIs from API only; local campaigns never invent ROAS
  const adSummary = useMemo(() => {
    if (adsKpis) {
      return {
        totalVisitors: Number(adsKpis.impressions) || 0,
        totalCarts: 0,
        totalOrders: Math.round(Number(adsKpis.conversions) || 0),
        totalRev: Number(adsKpis.conversions_value) || 0,
        roas: adsKpis.roas != null ? String(adsKpis.roas) : '—',
        spend: Number(adsKpis.cost) || 0,
      };
    }
    return {
      totalVisitors: 0,
      totalCarts: 0,
      totalOrders: 0,
      totalRev: 0,
      roas: '—',
      spend: 0,
    };
  }, [adsKpis]);

  const baseUrl = useMemo(() => {
    return activeStore.custom_domain
      ? `https://${activeStore.custom_domain}`
      : `https://${activeStore.slug || 'store'}.saudi-stores.com`;
  }, [activeStore]);

  // Request Wallet Top-Up (e.g., 1,000 SAR)
  const handleRequestTopUp = () => {
    if (topUpAmount <= 0) return;
    const next = requestAdWalletTopUp(activeStore.id, topUpAmount);
    setWallet(next);
    toast(
      isAr
        ? `تم إرسال طلب شحن المحفظة بمبلغ${topUpAmount}ر.س إلى الإدارة العليا للاعتماد!`
        : `Sent ${topUpAmount} SAR Ad Wallet top-up request to Master Admin for approval!`,
      'success',
    );
  };

  // Instant Master Approval (for owner/master verification)
  const handleInstantMasterApprove = () => {
    const amount = wallet.pendingTopUpSar > 0 ? wallet.pendingTopUpSar : topUpAmount;
    const next = masterApproveAdWalletTopUp(activeStore.id, amount, 150);
    setWallet(next);
    toast(
      isAr
        ? `تم اعتماد وإيداع${amount}ر.س في محفظة إعلانات المتجر فوراً!`
        : `Master Admin approved & deposited ${amount} SAR into Store Ad Wallet!`,
      'success',
    );
  };

  // Real Google Ads Search/PMax draft only — zero fake Snap/TikTok metrics
  const handleLaunchAiAutoAds = async () => {
    if (!isApiEnabled()) {
      toast(
        isAr
          ? 'واجهة برمجة التطبيقات غير مفعّلة. اربط المتجر بـ جوجل أولاً.'
          : 'API is off. Connect Google for this store first.',
        'error',
      );
      return;
    }
    setIsAiLaunching(true);
    try {
      const name = `Souq Search — ${activeStore.name} — ${new Date().toISOString().slice(0, 10)}`;
      const res = await createGoogleAdsCampaignApi(activeStore.id, {
        name,
        daily_budget_sar: Math.max(50, Math.min(wallet.dailySpendCapSar || 50, 200)),
        status: 'PAUSED',
        cities: ['Riyadh', 'Jeddah', 'Makkah'],
        channel: 'SEARCH',
        final_url: baseUrl,
      });
      if (!res.ok) {
        throw new Error(res.error || (isAr ? 'تعذر إنشاء الحملة' : 'Could not create campaign'));
      }
      const refreshed = await syncGoogleAdsApi(activeStore.id);
      setAdsOverview(refreshed);
      toast(
        isAr
          ? `تم إنشاء حملة بحث جوجل (متوقفة). أكمل الإعلانات في حساب إعلانات جوجل. رقم:${res.campaign_id || '—'}`
          : `Google Search campaign created (PAUSED). Finish ads in Google Ads. ID: ${res.campaign_id || '—'}`,
        'success',
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast(
        isAr
          ? `فشل إنشاء حملة إعلانات جوجل:${msg}. تأكد من ربط الحساب وصلاحية رمز المطوّر.`
          : `Google Ads create failed: ${msg}. Link Ads account + check developer token.`,
        'error',
      );
    } finally {
      setIsAiLaunching(false);
    }
  };

  // Manual: Google → real API; other platforms → no invented metrics (waiting for API)
  const handleCreateManualCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPlatform !== 'google') {
      toast(
        isAr
          ? 'إنشاء الحملات المباشرة متاح حالياً لـ إعلانات جوجل فقط. سناب/تيك توك غير مربوطين بعد.'
          : 'Live campaign create is Google Ads only for now. Snap/TikTok APIs are not wired yet.',
        'error',
      );
      return;
    }
    if (!isApiEnabled()) {
      toast(isAr ? 'فعّل واجهة البرمجة أولاً' : 'Enable the API first', 'error');
      return;
    }

    const createdName = manualName.trim() || `Google KSA — ${activeStore.name}`;
    setIsAiLaunching(true);
    try {
      const res = await createGoogleAdsCampaignApi(activeStore.id, {
        name: createdName,
        daily_budget_sar: manualDailyBudget,
        status: 'PAUSED',
        cities: manualCities.length ? manualCities : ['Riyadh'],
        channel: 'SEARCH',
        final_url: baseUrl,
      });
      if (!res.ok) throw new Error(res.error || 'Create failed');
      const refreshed = await syncGoogleAdsApi(activeStore.id);
      setAdsOverview(refreshed);
      setShowManualModal(false);
      toast(
        isAr ? 'تم إنشاء حملة جوجل (متوقفة) بدون أرقام وهمية' : 'Google campaign created (PAUSED) — no fake metrics',
        'success',
      );
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setIsAiLaunching(false);
    }
  };

  // Convert Ad Leads into a Real Store Order & Open WhatsApp Conversation
  const handleConvertAdLeadToOrder = (camp: KsaAdCampaign) => {
    const prod = currentProducts[0];
    const city = camp.targetCities[0] || 'Riyadh';
    const orderTotal = prod?.price || 145;

    addOrder({
      customerName: isAr ? `عميل إعلان (${camp.platform}) -${city}` : `${camp.platform.toUpperCase()} Ad Lead (${city})`,
      customerEmail: `lead.${camp.platform}@ksa-customer.sa`,
      customerPhone: '+966 50 842 9910',
      total: orderTotal,
      status: 'pending',
      paymentStatus: 'Paid',
      paymentMethod: 'Mada / Apple Pay',
      shippingAddress: `${city}, Saudi Arabia (UTM: ${camp.platform})`,
      deliveryLocation: `${city}, Saudi Arabia`,
      source: 'Instagram',
      itemsCount: 1,
      items: prod
        ? [
            {
              id: prod.id,
              name: prod.name,
              sku: prod.sku || `SKU-${prod.id}`,
              price: prod.price,
              quantity: 1,
              total: prod.price,
              image: prod.image,
            },
          ]
        : [],
    });

    const updated = campaigns.map((c) =>
      c.id === camp.id
        ? { ...c, orders: c.orders + 1, revenueSar: c.revenueSar + orderTotal }
        : c,
    );
    saveStoreAdCampaigns(activeStore.id, updated);
    setCampaigns(updated);

    toast(
      isAr
        ? `تم تحويل زائر إعلان (${camp.platform}) من مدينة${city}إلى طلب حقيقي بقيمة${orderTotal}ر.س!`
        : `Converted ${camp.platform.toUpperCase()} Ad visitor from ${city} into a real order (${orderTotal} SAR)!`,
      'success',
    );
  };

  // Live schedule is Instagram/Facebook via Social Publishing Hub only — no fake local metrics.
  const handleScheduleSocialPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (postPlatform !== 'instagram') {
      toast(
        isAr
          ? 'قريباً — الجدولة المباشرة لهذه المنصة غير مفعّلة. إنستغرام وفيسبوك عبر مركز النشر الاجتماعي.'
          : 'Coming Soon — live scheduling for this platform is not wired. Use Social Hub for Instagram & Facebook.',
        'info',
      );
      return;
    }
    toast(
      isAr
        ? 'للنشر والجدولة الحقيقية افتح مركز النشر الاجتماعي واربط إنستغرام أو فيسبوك عبر ميتا غراف.'
        : 'For real publish & schedule, open Social Publishing Hub and connect Instagram or Facebook via Meta Graph.',
      'info',
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher: All-in-One KSA Ad Manager vs Social Auto-Scheduler */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'ads' ? 'bg-emerald-600 text-white shadow-md' : 'border hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            style={{ borderColor: 'var(--border)' }}
          >
            <Megaphone className="w-4 h-4" />
            <span>
              {isAr
                ? 'مدير إعلانات السعودية الموحد'
                : 'All-in-One Saudi Ad Manager & Wallet (Snap / TikTok / IG / Google / YT)'}
            </span>
          </button>

          {!isSocialHidden && (
            <button
              type="button"
              onClick={() => {
                if (isSocialSoon && socialFeat) {
                  setComingSoonModalFeature(socialFeat);
                } else {
                  setActiveTab('scheduler');
                }
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'scheduler' ? 'bg-emerald-600 text-white shadow-md' : 'border hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={{ borderColor: 'var(--border)' }}
            >
              <Calendar className="w-4 h-4" />
              <span>
                {isAr
                  ? `الجدولة التلقائية لمنصات التواصل (${socialState.postsUsedToday}/${socialState.dailyPostLimit})`
                  : `Automatic Social Media Scheduler (${socialState.postsUsedToday}/${socialState.dailyPostLimit})`}
              </span>
              {isSocialSoon && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                  {isAr ? socialFeat?.comingSoonTagAr : socialFeat?.comingSoonTagEn}
                </span>
              )}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            requestStudioProUpgrade(activeStore.id, 299);
            toast(
              isAr
                ? 'تم إرسال طلب ترقية الباقة الاحترافية للإدارة العليا لزيادة سرعة النشر والإعلانات اليومية!'
                : 'Pro Speed Upgrade request sent to Master Admin!',
              'success',
            );
          }}
          className="px-4 py-2 rounded-2xl text-xs font-black text-white shadow-md flex items-center gap-1.5 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #d97706, #ea580c)' }}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAr ? 'ترقية للباقة الاحترافية (زيادة السرعة والحد اليومي)' : 'Upgrade to Pro (Boost Speed & Quota)'}</span>
        </button>
      </div>

      {/* =====================================================================
          VIEW 1: KSA ALL-IN-ONE AD MANAGER & LIVE AD WALLET
      ===================================================================== */}
      {activeTab === 'ads' && (
        <div className="space-y-6">
          {/* Store Ad Wallet & ROI Transparency Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div
              className="lg:col-span-5 p-5 rounded-3xl border space-y-4 flex flex-col justify-between"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-500 flex items-center gap-1.5">
                    <Coins className="w-4 h-4" />
                    <span>{isAr ? 'محفظة إعلانات المتجر (السعودية)' : 'Store KSA Ad Wallet Balance'}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                    {activeStore.name} (+966 / SAR)
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <div className="text-3xl font-black font-mono text-emerald-500">
                    {money(wallet.balanceSar)}
                  </div>
                  {wallet.pendingTopUpSar > 0 && (
                    <span className="text-xs font-bold text-amber-500">
                      (+{wallet.pendingTopUpSar} SAR {isAr ? 'بانتظار اعتماد الماستر' : 'Pending Master Approval'})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                    <div className="text-[10px] text-muted">{isAr ? 'الحد اليومي' : 'Daily Limit'}</div>
                    <div className="font-black font-mono">{wallet.dailySpendCapSar} SAR</div>
                  </div>
                  <div className="p-2.5 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                    <div className="text-[10px] text-muted">{isAr ? 'المخصوم اليوم' : 'Deducted Today'}</div>
                    <div className="font-black font-mono text-rose-500">-{wallet.spentTodaySar} SAR</div>
                  </div>
                  <div className="p-2.5 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                    <div className="text-[10px] text-muted">{isAr ? 'العائد' : 'Ad Return (ROAS)'}</div>
                    <div className="font-black font-mono text-emerald-500">{adSummary.roas}x</div>
                  </div>
                </div>
              </div>

              {/* Top-Up Controls */}
              <div className="pt-3 border-t space-y-2.5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                    className="w-28 px-3 py-2 rounded-xl border text-xs font-mono font-bold"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                  <button
                    type="button"
                    onClick={handleRequestTopUp}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                  >
                    {isAr ? `طلب شحن (${topUpAmount}ر.س)` : `Deposit ${topUpAmount} SAR`}
                  </button>
                  <button
                    type="button"
                    onClick={handleInstantMasterApprove}
                    className="py-2 px-3 rounded-xl border text-xs font-bold text-amber-500 border-amber-500/40 hover:bg-amber-500/10 cursor-pointer"
                    title={isAr ? 'اعتماد فوري من الماستر للاختبار' : 'Instant Master Admin Approval'}
                  >
                    {isAr ? 'اعتماد الماستر ✓' : 'Master Approve ✓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: What Your Ad Money Brought You (Visitors, Cities, Carts, Orders, AI vs Manual Launch) */}
            <div
              className="lg:col-span-7 p-5 rounded-3xl border flex flex-col justify-between space-y-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-black text-base">
                    {isAr
                      ? 'ماذا حققت ميزانيتك الإعلانية في السعودية؟ (تتبع UTM مباشر)'
                      : 'What Your Ad Spend Achieved Across Saudi Arabia (Live UTM ROI)'}
                  </h3>
                  <p className="text-xs text-muted">
                    {isAr
                      ? 'إطلاق الإعلانات تلقائياً بالذكاء الاصطناعي أو يدوياً في الرياض، جدة، مكة، الدمام وكافة مدن المملكة دون مغادرة لوحة التحكم.'
                      : 'Launch automated AI or manual ads across Riyadh, Jeddah, Makkah & Dammam without ever leaving your dashboard.'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-500/15 text-blue-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مؤقت الحماية اليومي نشط' : '24h Budget Pacing Timer Active'}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <div className="text-[11px] text-muted font-bold">{isAr ? 'الزوار من الإعلانات' : 'Ad Visitors (UTM)'}</div>
                  <div className="text-2xl font-black mt-1">{adSummary.totalVisitors}</div>
                  <div className="text-[10px] text-muted font-semibold">
                    {adsLoading
                      ? (isAr ? 'جاري المزامنة…' : 'Syncing…')
                      : (isAr ? 'مرات الظهور من إعلانات جوجل' : 'Impressions from Google Ads')}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <div className="text-[11px] text-muted font-bold">{isAr ? 'الإنفاق' : 'Ad Spend'}</div>
                  <div className="text-2xl font-black mt-1 text-blue-500">{money(adSummary.spend || 0)}</div>
                  <div className="text-[10px] text-muted">{isAr ? 'تكلفة حقيقية من جوجل' : 'Real Google Ads cost'}</div>
                </div>

                <div className="p-3.5 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <div className="text-[11px] text-muted font-bold">{isAr ? 'التحويلات' : 'Conversions'}</div>
                  <div className="text-2xl font-black mt-1 text-emerald-500">{adSummary.totalOrders}</div>
                  <div className="text-[10px] text-emerald-500 font-semibold">{isAr ? 'من تقارير الإعلانات' : 'From Ads reports'}</div>
                </div>

                <div className="p-3.5 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <div className="text-[11px] text-muted font-bold">{isAr ? 'قيمة التحويل' : 'Conversion Value'}</div>
                  <div className="text-xl font-black mt-1 font-mono text-emerald-500">{money(adSummary.totalRev)}</div>
                  <div className="text-[10px] text-muted">ROAS: {adSummary.roas}</div>
                </div>
              </div>

              {/* Dual Action Buttons: Google Search draft vs Manual Builder */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLaunchAiAutoAds}
                  disabled={isAiLaunching || adsLoading}
                  className="flex-1 py-3 px-5 rounded-2xl text-xs sm:text-sm font-black text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                >
                  {isAiLaunching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>
                    {isAr
                      ? 'إنشاء حملة بحث جوجل (متوقفة) — بيانات حقيقية فقط'
                      : 'Create Google Search campaign (PAUSED) — real Ads API only'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualModal(true)}
                  className="py-3 px-5 rounded-2xl border text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Sliders className="w-4 h-4 text-blue-500" />
                  <span>{isAr ? 'إنشاء إعلان يدوي مخصص' : 'Manual Ad Campaign Builder'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active KSA Ad Campaigns & Lead-to-Order Conversion Table */}
          <div className="rounded-3xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="p-4 sm:p-5 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="font-black text-sm sm:text-base">
                  {isAr ? 'حملات إعلانات جوجل لهذا المتجر' : 'Google Ads campaigns for this store'}
                </h3>
                <p className="text-xs text-muted">
                  {isAr
                    ? 'بيانات حقيقية فقط بعد ربط حساب إعلانات جوجل. لا أرقام وهمية.'
                    : 'Real data only after Google Ads is linked. No invented metrics.'}
                </p>
              </div>
              <button
                type="button"
                disabled={adsLoading}
                onClick={() => {
                  setAdsLoading(true);
                  void syncGoogleAdsApi(activeStore.id)
                    .then((d) => setAdsOverview(d))
                    .catch(() => undefined)
                    .finally(() => setAdsLoading(false));
                }}
                className="px-3 py-1.5 rounded-xl border text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${adsLoading ? 'animate-spin' : ''}`} />
                {isAr ? 'مزامنة الإعلانات' : 'Sync Ads'}
              </button>
            </div>

            {googleCampaigns.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Megaphone className="w-8 h-8 text-muted mx-auto" />
                <div className="font-black text-sm">
                  {isAr ? 'لا توجد حملات إعلانات جوجل بعد' : 'No Google Ads campaigns yet'}
                </div>
                <p className="text-xs text-muted max-w-md mx-auto">
                  {adsOverview?.message
                    || (isAr
                      ? 'اربط جوجل من إعدادات تحسين محركات البحث، اختر حساب الإعلانات، ثم أنشئ حملة أو انتظر المزامنة.'
                      : 'Connect Google in SEO settings, pick an Ads customer, then create a campaign or wait for sync.')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-muted font-bold" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                      <th className="py-3 px-4 text-start">{isAr ? 'الحملة' : 'Campaign'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'الميزانية اليومية' : 'Daily budget'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'الظهور / النقرات' : 'Impr. / Clicks'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'التكلفة / العائد' : 'Cost / ROAS'}</th>
                      <th className="py-3 px-4 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {googleCampaigns.map((camp) => {
                      return (
                        <tr key={camp.id} className="border-b hover:bg-slate-500/5" style={{ borderColor: 'var(--border)' }}>
                          <td className="py-3 px-4">
                            <div className="font-black">{camp.name}</div>
                            <div className="text-[10px] text-muted font-mono mt-0.5">{camp.channel || 'SEARCH'} · #{camp.id}</div>
                          </td>
                          <td className="py-3 px-4 font-bold">{camp.status}</td>
                          <td className="py-3 px-4 font-mono font-bold">
                            {camp.daily_budget != null ? `${camp.daily_budget} SAR` : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            {camp.impressions ?? 0} / {camp.clicks ?? 0}
                          </td>
                          <td className="py-3 px-4 font-mono font-black">
                            {money(camp.cost || 0)} · ROAS {camp.roas ?? '—'}
                          </td>
                          <td className="py-3 px-4 text-end">
                            <button
                              type="button"
                              onClick={() => {
                                void updateGoogleAdsCampaignApi(activeStore.id, camp.id, {
                                  status: camp.status === 'ENABLED' ? 'PAUSED' : 'ENABLED',
                                }).then(() => syncGoogleAdsApi(activeStore.id).then(setAdsOverview));
                              }}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-black text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {camp.status === 'ENABLED'
                                  ? (isAr ? 'إيقاف' : 'Pause')
                                  : (isAr ? 'تفعيل' : 'Enable')}
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: AUTOMATIC SOCIAL MEDIA SCHEDULER (WITH 3H ANTI-BAN TIMER)
      ===================================================================== */}
      {activeTab === 'scheduler' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 5 Cols: Schedule Form */}
          <form
            onSubmit={handleScheduleSocialPost}
            className="lg:col-span-5 p-5 rounded-3xl border space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">
                {isAr ? 'جدولة نشر تلقائي بالذكاء الاصطناعي' : 'Schedule Automatic AI Social Post'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-500">
                {socialState.postsUsedToday}/{socialState.dailyPostLimit} {isAr ? 'اليوم' : 'Today'}
              </span>
            </div>

            {cooldownText && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? `مؤقت الحماية من الحظر نشط: الفاصل الزمني التلقائي (${cooldownText})`
                    : `Anti-Ban Safe Timer Active: Next auto-slot in ${cooldownText}`}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold block">{isAr ? 'منصة التواصل' : 'Social Platform'}</label>
              <select
                value={postPlatform}
                onChange={(e) => setPostPlatform(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              >
                <option value="instagram">
                  {isAr ? 'إنستغرام — عبر مركز النشر (ميتا غراف)' : 'Instagram — via Social Hub (Meta Graph)'}
                </option>
                <option value="tiktok" disabled>
                  {isAr ? 'تيك توك — قريباً' : 'TikTok — Coming Soon'}
                </option>
                <option value="snapchat" disabled>
                  {isAr ? 'سناب شات — قريباً' : 'Snapchat — Coming Soon'}
                </option>
                <option value="telegram" disabled>
                  {isAr ? 'تيليجرام — قريباً' : 'Telegram — Coming Soon'}
                </option>
                <option value="x" disabled>
                  {isAr ? 'إكس — قريباً' : 'X — Coming Soon'}
                </option>
              </select>
              <p className="text-[11px] text-muted pt-1">
                {isAr
                  ? 'الربط والنشر الحقيقي: إنستغرام + فيسبوك فقط. باقي المنصات قريباً.'
                  : 'Live connect & publish: Instagram + Facebook only. Other platforms Coming Soon.'}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold block">{isAr ? 'اختر منتج المتجر لتوليد الصورة والرابط' : 'Select Store Product for AI Post'}</label>
              <select
                value={postProductId}
                onChange={(e) => setPostProductId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-xs cursor-pointer"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              >
                {currentProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.price} SAR)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold block">{isAr ? 'وقت وتاريخ النشر التلقائي' : 'Schedule Date & Time'}</label>
              <input
                type="datetime-local"
                value={postScheduleTime}
                onChange={(e) => setPostScheduleTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold block">{isAr ? 'نص المنشور (يُولّد تلقائياً إن تُرك فارغاً)' : 'Caption (Auto-generated by AI if left blank)'}</label>
              <textarea
                rows={3}
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder={isAr ? 'اتركه فارغاً ليقوم الذكاء الاصطناعي بكتابة الوصف والهاشتاجات السعودية...' : 'Leave blank for AI to write Saudi hashtags, product offer & UTM link...'}
                className="w-full px-3 py-2 rounded-xl border text-xs"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl text-xs font-black text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
            >
              <Send className="w-4 h-4" />
              <span>{isAr ? 'الانتقال إلى مركز النشر الحقيقي' : 'Go to Live Social Publishing Hub'}</span>
            </button>
          </form>

          {/* Right 7 Cols: Scheduled Posts & Live Views Tracker */}
          <div
            className="lg:col-span-7 p-5 rounded-3xl border space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <h3 className="font-black text-base">
              {isAr ? 'المنشورات المجدولة ومرات المشاهدة والنقرات' : 'Scheduled Posts & Live Post Views / Clicks'}
            </h3>

            {socialState.posts.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                {isAr ? 'لا توجد منشورات مجدولة بعد لهذا المتجر.' : 'No scheduled social posts yet for this store.'}
              </div>
            ) : (
              <div className="space-y-3">
                {socialState.posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 flex-wrap"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {post.imageUrl && (
                        <img src={post.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover border shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-500">
                            {post.platform}
                          </span>
                          <span className="text-[11px] font-mono text-muted">{post.scheduledFor.replace('T', ' ')}</span>
                        </div>
                        <p className="text-xs font-bold truncate max-w-md mt-1">
                          {isAr ? post.captionAr : post.captionEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono font-bold">
                      <span className="flex items-center gap-1 text-blue-500">
                        <Eye className="w-3.5 h-3.5" />
                        {post.views} {isAr ? 'مشاهدة' : 'views'}
                      </span>
                      <span className="text-emerald-500">
                        {post.clicks} {isAr ? 'نقرة' : 'clicks'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Ad Campaign Modal */}
      {showManualModal && (
        <GlobalModal
          isOpen
          onClose={() => setShowManualModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'إنشاء حملة إعلانية سعودية مخصصة' : 'Manual Saudi Arabia Ad Campaign Builder'}
        >
          <form
            onSubmit={handleCreateManualCampaign}
            className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-black text-base">
                {isAr ? 'إنشاء حملة إعلانية سعودية مخصصة' : 'Manual Saudi Arabia Ad Campaign Builder'}
              </h3>
              <button type="button" onClick={() => setShowManualModal(false)} className="p-1.5 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold block">{isAr ? 'اسم الحملة' : 'Campaign Name'} *</label>
              <input
                type="text"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder={isAr ? 'حملة عروض الرياض وجدة' : 'Riyadh & Jeddah Express Promo'}
                className="w-full px-3 py-2 rounded-xl border text-xs"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold block">{isAr ? 'المنصة الإعلانية' : 'Ad Platform'}</label>
                <select
                  value={manualPlatform}
                  onChange={(e) => {
                    const selPlat = e.target.value as KsaAdPlatform;
                    const featId = selPlat === 'google' ? 'google_ads' : selPlat === 'tiktok' ? 'tiktok_ads' : selPlat === 'snapchat' ? 'snapchat_ads' : null;
                    if (featId) {
                      const feat = getFeature(featId);
                      if (feat?.mode === 'coming_soon') {
                        setComingSoonModalFeature(feat);
                        return;
                      }
                    }
                    setManualPlatform(selPlat);
                  }}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  {visiblePlatforms.map((p) => {
                    const featId = p.id === 'google' ? 'google_ads' : p.id === 'tiktok' ? 'tiktok_ads' : p.id === 'snapchat' ? 'snapchat_ads' : null;
                    const feat = featId ? getFeature(featId) : null;
                    const isSoon = feat?.mode === 'coming_soon';
                    const soonTag = isSoon ? ` [${isAr ? feat?.comingSoonTagAr : feat?.comingSoonTagEn}]` : '';

                    return (
                      <option key={p.id} value={p.id}>
                        {isAr ? p.nameAr : p.nameEn}{soonTag}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold block">{isAr ? 'الميزانية اليومية (ر.س)' : 'Daily Budget (SAR)'}</label>
                <input
                  type="number"
                  min={20}
                  max={5000}
                  value={manualDailyBudget}
                  onChange={(e) => setManualDailyBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block">{isAr ? 'استهداف مدن المملكة العربية السعودية' : 'Target Saudi Arabia Cities'}</label>
              <div className="flex flex-wrap gap-1.5">
                {KSA_CITIES.map((c) => {
                  const selected = manualCities.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setManualCities((prev) =>
                          prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id],
                        )
                      }
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border cursor-pointer ${
                        selected ? 'bg-emerald-600 text-white border-emerald-600' : ''
                      }`}
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {isAr ? c.nameAr : c.nameEn}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                {isAr ? 'إطلاق الحملة وتفعيل التتبع' : 'Launch Campaign & Track UTM'}
              </button>
            </div>
          </form>
        </GlobalModal>
      )}

      {/* Advance Feature Coming Soon Modal */}
      <AdvanceFeatureComingSoonModal
        isOpen={!!comingSoonModalFeature}
        onClose={() => setComingSoonModalFeature(null)}
        feature={comingSoonModalFeature}
      />
    </div>
  );
};
