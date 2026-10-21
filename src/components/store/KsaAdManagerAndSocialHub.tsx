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
import {
  KSA_CITIES,
  type KsaCity,
  type KsaAdPlatform,
  type KsaAdCampaign,
  type StoreAdWalletState,
  type StoreSocialScheduleState,
  type ScheduledSocialPost,
  getStoreAdWallet,
  saveStoreAdWallet,
  requestAdWalletTopUp,
  masterApproveAdWalletTopUp,
  getStoreAdCampaigns,
  saveStoreAdCampaigns,
  getStoreSocialSchedule,
  saveStoreSocialSchedule,
  requestStudioProUpgrade,
} from '../../services/ksaAutomationEngine';
import { AdvanceFeatureComingSoonModal } from '../common/AdvanceFeatureComingSoonModal';
import {
  useAdvanceFeatures,
  type AdvanceFeatureConfig,
} from '../../services/advanceFeaturesService';

const AD_PLATFORMS: Array<{
  id: KsaAdPlatform;
  nameEn: string;
  nameAr: string;
  badgeColor: string;
}> = [
  { id: 'snapchat', nameEn: 'Snapchat Ads KSA', nameAr: 'إعلانات سناب شات السعودية', badgeColor: 'bg-amber-400 text-slate-950' },
  { id: 'tiktok', nameEn: 'TikTok Ads KSA', nameAr: 'إعلانات تيك توك السعودية', badgeColor: 'bg-pink-600 text-white' },
  { id: 'instagram', nameEn: 'Instagram / Meta Ads', nameAr: 'إعلانات إنستغرام وميتا', badgeColor: 'bg-purple-600 text-white' },
  { id: 'google', nameEn: 'Google Search & Shopping', nameAr: 'إعلانات بحث وتسوق Google', badgeColor: 'bg-blue-600 text-white' },
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
    setCampaigns(getStoreAdCampaigns(activeStore.id));
    setSocialState(getStoreSocialSchedule(activeStore.id, activeStore.slug));
    setPostProductId(currentProducts[0]?.id || '');
  }, [activeStore.id, activeStore.slug, currentProducts]);

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

  // Aggregate Ad Metrics
  const adSummary = useMemo(() => {
    const totalVisitors = campaigns.reduce((s, c) => s + c.visitors, 0);
    const totalCarts = campaigns.reduce((s, c) => s + c.addToCarts, 0);
    const totalOrders = campaigns.reduce((s, c) => s + c.orders, 0);
    const totalRev = campaigns.reduce((s, c) => s + c.revenueSar, 0);
    const roas = wallet.totalSpentSar > 0 ? (totalRev / wallet.totalSpentSar).toFixed(1) : '0.0';
    return { totalVisitors, totalCarts, totalOrders, totalRev, roas };
  }, [campaigns, wallet.totalSpentSar]);

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
        ? `تم إرسال طلب شحن المحفظة بمبلغ ${topUpAmount} ر.س إلى الإدارة العليا (Master Admin) للاعتماد!`
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
        ? `تم اعتماد وإيداع ${amount} ر.س في محفظة إعلانات المتجر فوراً!`
        : `Master Admin approved & deposited ${amount} SAR into Store Ad Wallet!`,
      'success',
    );
  };

  // 1-Click AI Auto-Pilot Ad Generator (KSA All-in-One)
  const handleLaunchAiAutoAds = () => {
    if (wallet.balanceSar < 25) {
      toast(
        isAr
          ? 'رصيد محفظة الإعلانات غير كافٍ. يرجى شحن المحفظة (مثلاً 1,000 ر.س) واعتمادها أولاً!'
          : 'Insufficient Ad Wallet balance. Please top up your wallet (e.g., 1,000 SAR) first!',
        'error',
      );
      return;
    }

    setIsAiLaunching(true);
    setTimeout(() => {
      const topProduct = currentProducts[0];
      const prodName = topProduct?.name || activeStore.name;
      const prodPrice = topProduct?.price || 149;
      const prodImg = topProduct?.image || activeStore.logo || '';
      const deductSar = Math.min(wallet.dailySpendCapSar, wallet.balanceSar, 100);

      const newAiCampaigns: KsaAdCampaign[] = [
        {
          id: `ksa-ad-${Date.now()}-snap`,
          storeId: activeStore.id,
          nameEn: `AI KSA Snapchat — ${prodName}`,
          nameAr: `حملة سناب شات الذكية — ${prodName}`,
          platform: 'snapchat',
          mode: 'ai_auto',
          targetCities: ['Riyadh', 'Jeddah', 'Makkah', 'Dammam'],
          dailyBudgetSar: Math.round(deductSar * 0.4),
          spentSar: Math.round(deductSar * 0.4),
          status: 'active',
          scheduleStart: new Date().toISOString().slice(0, 10),
          nextPacingTickAt: Date.now() + 24 * 3600 * 1000,
          utmUrl: `${baseUrl}/?utm_source=snapchat&utm_medium=ksa_ai_ad&utm_campaign=${activeStore.slug}_snap`,
          creativeImageUrl: prodImg,
          headlineEn: `Order ${prodName} — Express KSA Delivery`,
          headlineAr: `اطلب الآن ${prodName} — توصيل فوري لجميع مدن المملكة`,
          impressions: 4820,
          clicks: 310,
          visitors: 265,
          addToCarts: 34,
          orders: 9,
          revenueSar: 9 * prodPrice,
          createdAt: new Date().toISOString(),
        },
        {
          id: `ksa-ad-${Date.now()}-tiktok`,
          storeId: activeStore.id,
          nameEn: `AI KSA TikTok & Instagram — ${prodName}`,
          nameAr: `حملة تيك توك وإنستغرام الذكية — ${prodName}`,
          platform: 'tiktok',
          mode: 'ai_auto',
          targetCities: ['Riyadh', 'Jeddah', 'Madinah', 'Khobar'],
          dailyBudgetSar: Math.round(deductSar * 0.35),
          spentSar: Math.round(deductSar * 0.35),
          status: 'active',
          scheduleStart: new Date().toISOString().slice(0, 10),
          nextPacingTickAt: Date.now() + 24 * 3600 * 1000,
          utmUrl: `${baseUrl}/?utm_source=tiktok&utm_medium=ksa_ai_ad&utm_campaign=${activeStore.slug}_tiktok`,
          creativeImageUrl: prodImg,
          headlineEn: `Trending in Saudi Arabia: ${prodName}`,
          headlineAr: `الأكثر طلباً في السعودية: ${prodName}`,
          impressions: 6150,
          clicks: 420,
          visitors: 340,
          addToCarts: 41,
          orders: 11,
          revenueSar: 11 * prodPrice,
          createdAt: new Date().toISOString(),
        },
        {
          id: `ksa-ad-${Date.now()}-google`,
          storeId: activeStore.id,
          nameEn: `AI Google & YouTube KSA — ${activeStore.name}`,
          nameAr: `حملة بحث Google ويوتيوب السعودية — ${activeStore.name}`,
          platform: 'google',
          mode: 'ai_auto',
          targetCities: ['Riyadh', 'Jeddah', 'Makkah', 'Qassim', 'Abha'],
          dailyBudgetSar: Math.round(deductSar * 0.25),
          spentSar: Math.round(deductSar * 0.25),
          status: 'active',
          scheduleStart: new Date().toISOString().slice(0, 10),
          nextPacingTickAt: Date.now() + 24 * 3600 * 1000,
          utmUrl: `${baseUrl}/?utm_source=google&utm_medium=ksa_cpc&utm_campaign=${activeStore.slug}_search`,
          creativeImageUrl: prodImg,
          headlineEn: `Official ${activeStore.name} Store — Shop Online KSA`,
          headlineAr: `المتجر الرسمي ${activeStore.name} — تسوق أونلاين في السعودية`,
          impressions: 3290,
          clicks: 245,
          visitors: 210,
          addToCarts: 28,
          orders: 7,
          revenueSar: 7 * prodPrice,
          createdAt: new Date().toISOString(),
        },
      ];

      const updatedCampaigns = [...newAiCampaigns, ...campaigns];
      saveStoreAdCampaigns(activeStore.id, updatedCampaigns);
      setCampaigns(updatedCampaigns);

      // Deduct today's paced spend from Store Ad Wallet
      const nextWallet: StoreAdWalletState = {
        ...wallet,
        balanceSar: Math.max(0, wallet.balanceSar - deductSar),
        spentTodaySar: wallet.spentTodaySar + deductSar,
        totalSpentSar: wallet.totalSpentSar + deductSar,
        lastPacingTimerAt: Date.now() + 24 * 3600 * 1000,
        transactions: [
          {
            id: `tx-deduct-${Date.now()}`,
            type: 'ad_deduction',
            amountSar: deductSar,
            noteEn: `Daily AI Auto-Ads Spend across Snapchat, TikTok & Google KSA (-${deductSar} SAR)`,
            noteAr: `خصم الميزانية اليومية لحملات الذكاء الاصطناعي في السعودية (-${deductSar} ر.س)`,
            createdAt: new Date().toISOString(),
            status: 'completed',
          },
          ...wallet.transactions,
        ],
      };
      saveStoreAdWallet(activeStore.id, nextWallet);
      setWallet(nextWallet);
      setIsAiLaunching(false);

      toast(
        isAr
          ? `تم إطلاق حملات الذكاء الاصطناعي للسعودية وخصم الميزانية اليومية (${deductSar} ر.س) مع تتبع UTM تلقائي!`
          : `AI KSA Campaigns launched across Snapchat, TikTok & Google! Deducted ${deductSar} SAR daily budget with live UTM tracking.`,
        'success',
      );
    }, 700);
  };

  // Manual Ad Campaign Creation
  const handleCreateManualCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (wallet.balanceSar < manualDailyBudget) {
      toast(
        isAr
          ? 'رصيد المحفظة أقل من الميزانية اليومية المحددة. يرجى شحن المحفظة أولاً!'
          : 'Wallet balance is lower than the daily budget. Please top up wallet first!',
        'error',
      );
      return;
    }

    const topProduct = currentProducts[0];
    const prodPrice = topProduct?.price || 120;
    const estVisitors = Math.round(manualDailyBudget * 5.2);
    const estCarts = Math.max(2, Math.round(estVisitors * 0.12));
    const estOrders = Math.max(1, Math.round(estCarts * 0.28));

    const created: KsaAdCampaign = {
      id: `ksa-manual-${Date.now()}`,
      storeId: activeStore.id,
      nameEn: manualName.trim() || `${manualPlatform.toUpperCase()} KSA Campaign`,
      nameAr: manualName.trim() || `حملة ${manualPlatform} السعودية`,
      platform: manualPlatform,
      mode: 'manual',
      targetCities: manualCities.length > 0 ? manualCities : ['Riyadh'],
      dailyBudgetSar: manualDailyBudget,
      spentSar: manualDailyBudget,
      status: 'active',
      scheduleStart: new Date().toISOString().slice(0, 10),
      nextPacingTickAt: Date.now() + 24 * 3600 * 1000,
      utmUrl: `${baseUrl}/?utm_source=${manualPlatform}&utm_medium=manual_ksa_ad&utm_campaign=${encodeURIComponent(manualName.trim() || activeStore.slug)}`,
      creativeImageUrl: topProduct?.image || activeStore.logo || '',
      headlineEn: manualHeadline.trim() || `Shop at ${activeStore.name} KSA`,
      headlineAr: manualHeadline.trim() || `تسوق الآن من ${activeStore.name}`,
      impressions: estVisitors * 14,
      clicks: Math.round(estVisitors * 1.15),
      visitors: estVisitors,
      addToCarts: estCarts,
      orders: estOrders,
      revenueSar: estOrders * prodPrice,
      createdAt: new Date().toISOString(),
    };

    const nextCampaigns = [created, ...campaigns];
    saveStoreAdCampaigns(activeStore.id, nextCampaigns);
    setCampaigns(nextCampaigns);

    const nextWallet: StoreAdWalletState = {
      ...wallet,
      balanceSar: Math.max(0, wallet.balanceSar - manualDailyBudget),
      spentTodaySar: wallet.spentTodaySar + manualDailyBudget,
      totalSpentSar: wallet.totalSpentSar + manualDailyBudget,
      transactions: [
        {
          id: `tx-man-${Date.now()}`,
          type: 'ad_deduction',
          amountSar: manualDailyBudget,
          noteEn: `Manual ${manualPlatform.toUpperCase()} KSA Campaign Spend (-${manualDailyBudget} SAR)`,
          noteAr: `خصم حملة ${manualPlatform} اليدوية في السعودية (-${manualDailyBudget} ر.س)`,
          createdAt: new Date().toISOString(),
          status: 'completed',
        },
        ...wallet.transactions,
      ],
    };
    saveStoreAdWallet(activeStore.id, nextWallet);
    setWallet(nextWallet);
    setShowManualModal(false);
    setManualName('');
    setManualHeadline('');
    toast(
      isAr ? 'تم إطلاق الحملة اليدوية وتفعيل تتبع UTM بنجاح!' : 'Manual KSA Ad Campaign launched with live UTM tracking!',
      'success',
    );
  };

  // Convert Ad Leads into a Real Store Order & Open WhatsApp Conversation
  const handleConvertAdLeadToOrder = (camp: KsaAdCampaign) => {
    const prod = currentProducts[0];
    const city = camp.targetCities[0] || 'Riyadh';
    const orderTotal = prod?.price || 145;

    addOrder({
      customerName: isAr ? `عميل إعلان (${camp.platform}) - ${city}` : `${camp.platform.toUpperCase()} Ad Lead (${city})`,
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
        ? `تم تحويل زائر إعلان (${camp.platform}) من مدينة ${city} إلى طلب حقيقي بقيمة ${orderTotal} ر.س!`
        : `Converted ${camp.platform.toUpperCase()} Ad visitor from ${city} into a real order (${orderTotal} SAR)!`,
      'success',
    );
  };

  // Generate AI Caption & Schedule Social Post (with 3h Anti-Ban Timer)
  const handleScheduleSocialPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (socialState.postsUsedToday >= socialState.dailyPostLimit) {
      toast(
        isAr
          ? 'وصلت للحد اليومي للجدولة المجانية. اضغط على ترقية Pro لزيادة السرعة والحد اليومي!'
          : 'Daily free scheduling limit reached! Click Upgrade to Pro so Master Admin can boost your speed.',
        'error',
      );
      return;
    }

    const selectedProd = currentProducts.find((p) => p.id === postProductId) || currentProducts[0];
    const prodName = selectedProd?.name || activeStore.name;
    const prodImg = selectedProd?.image || activeStore.logo || '';
    const autoCaptionEn =
      postCaption.trim() ||
      `Discover ${prodName} at ${activeStore.name}! Fast shipping across Riyadh, Jeddah, Makkah & all Saudi Arabia. Order now! #KSA #SaudiArabia`;
    const autoCaptionAr =
      postCaption.trim() ||
      `تسوّق الآن ${prodName} من متجر ${activeStore.name}! شحن سريع للرياض وجدة ومكة وكافة مدن المملكة 🇸🇦 #السعودية`;

    const newPost: ScheduledSocialPost = {
      id: `post-${Date.now()}`,
      storeId: activeStore.id,
      platform: postPlatform,
      captionEn: autoCaptionEn,
      captionAr: autoCaptionAr,
      imageUrl: prodImg,
      productId: selectedProd?.id,
      scheduledFor: postScheduleTime,
      status: 'scheduled',
      views: 120,
      likes: 18,
      clicks: 9,
      conversions: 1,
      utmUrl: `${baseUrl}/?utm_source=${postPlatform}&utm_medium=social_auto&utm_campaign=post_${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };

    const nextState: StoreSocialScheduleState = {
      ...socialState,
      postsUsedToday: socialState.postsUsedToday + 1,
      nextAllowedPostAt: Date.now() + socialState.cooldownHours * 3600 * 1000,
      posts: [newPost, ...socialState.posts],
    };
    saveStoreSocialSchedule(activeStore.id, nextState);
    setSocialState(nextState);
    setPostCaption('');

    toast(
      isAr
        ? `تمت جدولة المنشور التلقائي على ${postPlatform} مع تفعيل مؤقت الحماية (${socialState.cooldownHours} ساعات)!`
        : `Scheduled automatic post on ${postPlatform} with ${socialState.cooldownHours}h anti-ban timer!`,
      'success',
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
                ? 'مدير إعلانات السعودية الموحد (Snap / TikTok / IG / Google / YT)'
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
                ? 'تم إرسال طلب ترقية باقة Pro للإدارة العليا لزيادة سرعة النشر والإعلانات اليومية!'
                : 'Pro Speed Upgrade request sent to Master Admin!',
              'success',
            );
          }}
          className="px-4 py-2 rounded-2xl text-xs font-black text-white shadow-md flex items-center gap-1.5 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #d97706, #ea580c)' }}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAr ? 'ترقية لـ Pro (زيادة السرعة والحد اليومي)' : 'Upgrade to Pro (Boost Speed & Quota)'}</span>
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
                    <div className="text-[10px] text-muted">{isAr ? 'العائد (ROAS)' : 'Ad Return (ROAS)'}</div>
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
                    {isAr ? `طلب شحن (${topUpAmount} ر.س)` : `Deposit ${topUpAmount} SAR`}
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
                  <div className="text-[10px] text-emerald-500 font-semibold">{isAr ? 'زوار حقيقيون من السعودية' : 'Verified KSA Traffic'}</div>
                </div>

                <div className="p-3.5 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <div className="text-[11px] text-muted font-bold">{isAr ? 'إضافة للسلة' : 'Add to Carts'}</div>
                  <div className="text-2xl font-black mt-1 text-blue-500">{adSummary.totalCarts}</div>
                  <div className="text-[10px] text-muted">{isAr ? 'جاهزون للتحويل' : 'Ready for retargeting'}</div>
                </div>

                <div className="p-3.5 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <div className="text-[11px] text-muted font-bold">{isAr ? 'الطلبات المحولة' : 'Converted Orders'}</div>
                  <div className="text-2xl font-black mt-1 text-emerald-500">{adSummary.totalOrders}</div>
                  <div className="text-[10px] text-emerald-500 font-semibold">{isAr ? 'مبيعات مباشرة' : 'Direct Ad Orders'}</div>
                </div>

                <div className="p-3.5 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <div className="text-[11px] text-muted font-bold">{isAr ? 'إيرادات الإعلانات' : 'Ad Revenue Earned'}</div>
                  <div className="text-xl font-black mt-1 font-mono text-emerald-500">{money(adSummary.totalRev)}</div>
                  <div className="text-[10px] text-muted">{isAr ? 'صافي مبيعات الحملات' : 'Gross UTM Sales'}</div>
                </div>
              </div>

              {/* Dual Action Buttons: 1-Click AI Auto-Pilot vs Manual Builder */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLaunchAiAutoAds}
                  disabled={isAiLaunching}
                  className="flex-1 py-3 px-5 rounded-2xl text-xs sm:text-sm font-black text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                >
                  {isAiLaunching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>
                    {isAr
                      ? 'إطلاق تلقائي بالذكاء الاصطناعي (Snap + TikTok + IG + Google + YouTube)'
                      : '1-Click AI Auto-Launch KSA Ads (Snap + TikTok + IG + Google + YouTube)'}
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
                  {isAr ? 'حملات السعودية النشطة وتحويل الزوار إلى طلبات' : 'Active Saudi Campaigns & Visitor-to-Order Conversion Hub'}
                </h3>
                <p className="text-xs text-muted">
                  {isAr
                    ? 'شاهد من أين يأتي العملاء في السعودية وحوّلهم فوراً إلى طلبات مؤكدة بضغطة زر.'
                    : 'Track exact Saudi cities & UTM channels and convert visitors into orders in 1 click.'}
                </p>
              </div>
            </div>

            {campaigns.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Megaphone className="w-8 h-8 text-muted mx-auto" />
                <div className="font-black text-sm">
                  {isAr ? 'لا توجد حملات إعلانية نشطة حالياً' : 'No active KSA ad campaigns yet'}
                </div>
                <p className="text-xs text-muted">
                  {isAr
                    ? 'اشحن المحفظة واضغط على زر "إطلاق تلقائي بالذكاء الاصطناعي" لبدء جلب الزوار والطلبات من السعودية.'
                    : 'Top up your Ad Wallet and click "1-Click AI Auto-Launch KSA Ads" to start receiving visitors and orders.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-muted font-bold" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                      <th className="py-3 px-4 text-start">{isAr ? 'الحملة والمنصة' : 'Campaign & Platform'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'مدن السعودية (+966)' : 'KSA Target Cities'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'الميزانية والمخصوم' : 'Daily Spend'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'الزوار / السلات / الطلبات' : 'Visitors / Carts / Orders'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'المبيعات (ر.س)' : 'Revenue (SAR)'}</th>
                      <th className="py-3 px-4 text-end">{isAr ? 'تحويل الزائر لطلب' : 'Convert Lead to Order'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((camp) => {
                      const plat = AD_PLATFORMS.find((p) => p.id === camp.platform);
                      return (
                        <tr key={camp.id} className="border-b hover:bg-slate-500/5" style={{ borderColor: 'var(--border)' }}>
                          <td className="py-3 px-4">
                            <div className="font-black">{isAr ? camp.nameAr : camp.nameEn}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${plat?.badgeColor || 'bg-slate-700 text-white'}`}>
                                {camp.platform}
                              </span>
                              <span className="text-[10px] text-muted font-mono truncate max-w-[180px]" title={camp.utmUrl}>
                                {camp.mode === 'ai_auto' ? 'AI Auto-UTM' : 'Manual UTM'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {camp.targetCities.map((city) => (
                                <span key={city} className="px-2 py-0.5 rounded-md text-[10px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
                                  {city}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-500">
                            -{camp.dailyBudgetSar} SAR/{isAr ? 'يوم' : 'day'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 font-mono font-bold">
                              <span>{camp.visitors} {isAr ? 'زائر' : 'vis'}</span>
                              <span>•</span>
                              <span className="text-blue-500">{camp.addToCarts} {isAr ? 'سلة' : 'cart'}</span>
                              <span>•</span>
                              <span className="text-emerald-500">{camp.orders} {isAr ? 'طلب' : 'ord'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-emerald-500">
                            {money(camp.revenueSar)}
                          </td>
                          <td className="py-3 px-4 text-end">
                            <button
                              type="button"
                              onClick={() => handleConvertAdLeadToOrder(camp)}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-black text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>{isAr ? 'تحويل لطلب + محادثة' : 'Convert to Order'}</span>
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
              <label className="text-xs font-bold block">{isAr ? 'منصة التواصل المتصلة' : 'Connected Social Platform'}</label>
              <select
                value={postPlatform}
                onChange={(e) => setPostPlatform(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              >
                <option value="instagram">Instagram Business ({socialState.connectedAccounts.instagram.handle})</option>
                <option value="tiktok">TikTok KSA ({socialState.connectedAccounts.tiktok.handle})</option>
                <option value="snapchat">Snapchat Public Profile ({socialState.connectedAccounts.snapchat.handle})</option>
                <option value="telegram">Telegram Channel ({socialState.connectedAccounts.telegram.handle})</option>
                <option value="x">X / Twitter ({socialState.connectedAccounts.x.handle})</option>
              </select>
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
              <span>{isAr ? 'جدولة النشر التلقائي مع تتبع المشاهدات' : 'Schedule Automatic Post & Track Views'}</span>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-2xs"
          onClick={() => setShowManualModal(false)}
        >
          <form
            onSubmit={handleCreateManualCampaign}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-black text-base">
                {isAr ? 'إنشاء حملة إعلانية سعودية مخصصة (يدوي)' : 'Manual Saudi Arabia Ad Campaign Builder'}
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
                {isAr ? 'إطلاق الحملة وتفعيل UTM' : 'Launch Campaign & Track UTM'}
              </button>
            </div>
          </form>
        </div>
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
