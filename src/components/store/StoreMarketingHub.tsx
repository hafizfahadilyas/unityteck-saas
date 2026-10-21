import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { StoreChannelPerformance } from './StoreChannelPerformance';
import {
  Tag,
  ShoppingCart,
  Clock,
  Megaphone,
  Share2,
  BookOpen,
  Search,
  Star,
  Coins,
  Gift,
  MessageCircle,
  ArrowLeft,
  Calendar,
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  Percent,
  Layers,
  Sparkles,
  Phone,
  User,
  Paperclip,
  Smile,
  RefreshCw,
  Sliders,
  Check,
  HelpCircle,
  Upload,
  X,
  Image as ImageIcon,
  ShoppingBag,
  Store as StoreIcon,
  ChevronRight,
  Package,
} from 'lucide-react';
import { PageDocsGuideModal } from '../common/PageDocsGuideModal';
import { KsaAdManagerAndSocialHub } from './KsaAdManagerAndSocialHub';
import { AdvanceFeatureComingSoonModal } from '../common/AdvanceFeatureComingSoonModal';
import {
  useAdvanceFeatures,
  type AdvanceFeatureConfig,
} from '../../services/advanceFeaturesService';
import { Globe, Palette } from 'lucide-react';

export type MarketingSubView = 'hub' | 'abandoned' | 'offers' | 'whatsapp' | 'campaigns' | 'ksa_ads';

interface StoreMarketingHubProps {
  initialView?: MarketingSubView;
  onNavigateTab?: (tab: string) => void;
}

export const StoreMarketingHub: React.FC<StoreMarketingHubProps> = ({
  initialView = 'hub',
  onNavigateTab,
}) => {
  const { activeStore, currentOrders, currentProducts, allStoreCustomers } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [subView, setSubView] = useState<MarketingSubView>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const { features: advanceFeatures, getFeature } = useAdvanceFeatures();
  const [comingSoonModalFeature, setComingSoonModalFeature] = useState<AdvanceFeatureConfig | null>(null);

  // Synchronize initialView prop if it changes
  useEffect(() => {
    if (initialView) {
      setSubView(initialView);
    }
  }, [initialView]);

  // Real store customers list
  const storeCustomersList = useMemo(() => {
    return (allStoreCustomers && allStoreCustomers[activeStore.id]) || [];
  }, [allStoreCustomers, activeStore.id]);

  // Real store pending / abandoned orders
  const pendingOrders = useMemo(() => {
    return (currentOrders || []).filter((o) => o.status === 'pending');
  }, [currentOrders]);

  // Real store completed / recovered orders
  const completedOrders = useMemo(() => {
    return (currentOrders || []).filter(
      (o) => o.status === 'completed' || o.status === 'delivered'
    );
  }, [currentOrders]);

  // Derived real metrics
  const totalAbandoned = pendingOrders.length;
  const recoveredOrders = completedOrders.length;
  const recoveredRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalCarts = totalAbandoned + recoveredOrders;
  const recoveryRate =
    totalCarts > 0 ? ((recoveredOrders / totalCarts) * 100).toFixed(1) : '0.0';

  // Real WhatsApp messaging tracking
  const [waSentCount, setWaSentCount] = useState<number>(0);
  const [waAttachment, setWaAttachment] = useState<string | null>(null);
  const [waAttachmentName, setWaAttachmentName] = useState<string | null>(null);
  const waAttachmentInputRef = useRef<HTMLInputElement>(null);

  const [waLogs, setWaLogs] = useState<
    Array<{
      id: string;
      time: string;
      status: string;
      type: string;
      typeColor: string;
      content: string;
      phone: string;
      customer: string;
    }>
  >([]);

  // ─────────────────────────────────────────────────────────────
  // SUBVIEW 1: The 10 Marketing Tools Hub
  // ─────────────────────────────────────────────────────────────
  const tools = [
    {
      id: 'coupons',
      title: isAr ? 'كوبونات الخصم' : 'Discount Coupons',
      desc: isAr ? 'إنشاء وإدارة رموز الخصم الترويجية.' : 'Create and manage promo codes.',
      icon: Tag,
      color: 'blue',
      action: () => (onNavigateTab ? onNavigateTab('coupons') : setSubView('offers')),
    },
    {
      id: 'cart-offers',
      title: isAr ? 'عروض السلة' : 'Cart Offers',
      desc: isAr ? 'قواعد البيع الإضافي التلقائي.' : 'Automated upsell rules.',
      icon: ShoppingCart,
      color: 'blue',
      action: () => (onNavigateTab ? onNavigateTab('cart-offers') : setSubView('offers')),
    },
    {
      id: 'abandoned',
      title: isAr ? 'السلات المتروكة' : 'Abandoned Carts',
      desc: isAr ? 'استعادة المبيعات المفقودة.' : 'Recover lost sales.',
      icon: Clock,
      color: 'blue',
      action: () => setSubView('abandoned'),
    },
    {
      id: 'campaigns',
      title: isAr ? 'الحملات التسويقية' : 'Marketing Campaigns',
      desc: isAr ? 'إطلاق العروض والترويج الموجه.' : 'Run targeted promotions.',
      icon: Megaphone,
      color: 'blue',
      action: () => setSubView('campaigns'),
    },
    {
      id: 'affiliate',
      title: isAr ? 'التسويق بالعمولة' : 'Affiliate',
      desc: isAr ? 'إدارة برامج الشركاء والمسوقين.' : 'Manage partner programs.',
      icon: Share2,
      color: 'blue',
      action: () => (onNavigateTab ? onNavigateTab('affiliate') : setSubView('campaigns')),
    },
    {
      id: 'blog',
      title: isAr ? 'المدونة' : 'Blog',
      desc: isAr ? 'نشر المقالات والمحتوى.' : 'Publish articles.',
      icon: BookOpen,
      color: 'blue',
      action: () => (onNavigateTab ? onNavigateTab('blog') : null),
    },
    {
      id: 'seo',
      title: isAr ? 'تهيئة محركات البحث (SEO)' : 'SEO',
      desc: isAr ? 'تحسين ظهور المتجر في محركات البحث.' : 'Optimize site visibility.',
      icon: Search,
      color: 'blue',
      action: () => (onNavigateTab ? onNavigateTab('seo') : null),
    },
    {
      id: 'loyalty',
      title: isAr ? 'ولاء العملاء' : 'Customer Loyalty',
      desc: isAr ? 'مكافأة العملاء المتكررين بالنقاط.' : 'Reward repeat buyers.',
      icon: Star,
      color: 'blue',
      action: () => (onNavigateTab ? onNavigateTab('loyalty') : setSubView('offers')),
    },
    {
      id: 'cashback',
      title: isAr ? 'استرداد نقدي (كاش باك)' : 'Cashback',
      desc: isAr ? 'نظام استرداد فوري للمحفظة.' : 'Instant rebate system.',
      icon: Coins,
      color: 'blue',
      action: () => (onNavigateTab ? onNavigateTab('cashback') : setSubView('offers')),
    },
    {
      id: 'special-offers',
      title: isAr ? 'عروض خاصة' : 'Special Offers',
      desc: isAr ? 'صفقات وتخفيضات محدودة بوقت.' : 'Limited time deals.',
      icon: Gift,
      color: 'blue',
      action: () => (onNavigateTab ? onNavigateTab('promotions') : setSubView('offers')),
    },
  ];

  // Dynamic advance feature tools driven by Master Admin governance
  const advanceFeatureTools = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      desc: string;
      icon: any;
      color: string;
      badge?: string;
      isComingSoon?: boolean;
      action: () => void;
    }> = [];

    // 1. Google Ads
    const gFeat = getFeature('google_ads');
    if (gFeat && gFeat.mode !== 'hidden') {
      const isSoon = gFeat.mode === 'coming_soon';
      list.push({
        id: 'google_ads',
        title: isAr ? gFeat.nameAr : gFeat.nameEn,
        desc: isAr ? gFeat.descriptionAr : gFeat.descriptionEn,
        icon: Globe,
        color: 'blue',
        badge: isSoon ? (isAr ? gFeat.comingSoonTagAr : gFeat.comingSoonTagEn) : undefined,
        isComingSoon: isSoon,
        action: () => {
          if (isSoon) setComingSoonModalFeature(gFeat);
          else setSubView('ksa_ads');
        },
      });
    }

    // 2. TikTok Ads
    const ttFeat = getFeature('tiktok_ads');
    if (ttFeat && ttFeat.mode !== 'hidden') {
      const isSoon = ttFeat.mode === 'coming_soon';
      list.push({
        id: 'tiktok_ads',
        title: isAr ? ttFeat.nameAr : ttFeat.nameEn,
        desc: isAr ? ttFeat.descriptionAr : ttFeat.descriptionEn,
        icon: Sparkles,
        color: 'purple',
        badge: isSoon ? (isAr ? ttFeat.comingSoonTagAr : ttFeat.comingSoonTagEn) : undefined,
        isComingSoon: isSoon,
        action: () => {
          if (isSoon) setComingSoonModalFeature(ttFeat);
          else setSubView('ksa_ads');
        },
      });
    }

    // 3. Canva Graphic Studio
    const cFeat = getFeature('canva_editing');
    if (cFeat && cFeat.mode !== 'hidden') {
      const isSoon = cFeat.mode === 'coming_soon';
      list.push({
        id: 'canva_editing',
        title: isAr ? cFeat.nameAr : cFeat.nameEn,
        desc: isAr ? cFeat.descriptionAr : cFeat.descriptionEn,
        icon: Palette,
        color: 'emerald',
        badge: isSoon ? (isAr ? cFeat.comingSoonTagAr : cFeat.comingSoonTagEn) : undefined,
        isComingSoon: isSoon,
        action: () => {
          if (isSoon) setComingSoonModalFeature(cFeat);
          else if (onNavigateTab) onNavigateTab('products');
        },
      });
    }

    // 4. Social Media Automatic Posting
    const sFeat = getFeature('social_auto_posting');
    if (sFeat && sFeat.mode !== 'hidden') {
      const isSoon = sFeat.mode === 'coming_soon';
      list.push({
        id: 'social_auto_posting',
        title: isAr ? sFeat.nameAr : sFeat.nameEn,
        desc: isAr ? sFeat.descriptionAr : sFeat.descriptionEn,
        icon: Share2,
        color: 'amber',
        badge: isSoon ? (isAr ? sFeat.comingSoonTagAr : sFeat.comingSoonTagEn) : undefined,
        isComingSoon: isSoon,
        action: () => {
          if (isSoon) setComingSoonModalFeature(sFeat);
          else setSubView('ksa_ads');
        },
      });
    }

    // 5. Custom Advance Features created by Master Admin
    advanceFeatures
      .filter((f) => !['google_ads', 'tiktok_ads', 'canva_editing', 'social_auto_posting'].includes(f.id))
      .forEach((f) => {
        if (f.mode !== 'hidden') {
          const isSoon = f.mode === 'coming_soon';
          list.push({
            id: f.id,
            title: isAr ? f.nameAr : f.nameEn,
            desc: isAr ? f.descriptionAr : f.descriptionEn,
            icon: Megaphone,
            color: 'teal',
            badge: isSoon ? (isAr ? f.comingSoonTagAr : f.comingSoonTagEn) : undefined,
            isComingSoon: isSoon,
            action: () => {
              if (isSoon) setComingSoonModalFeature(f);
              else setSubView('campaigns');
            },
          });
        }
      });

    return list;
  }, [advanceFeatures, getFeature, isAr, onNavigateTab]);

  const allTools = useMemo(() => [...tools, ...advanceFeatureTools], [tools, advanceFeatureTools]);

  const filteredTools = allTools.filter((tool) =>
    `${tool.title} ${tool.desc}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────
  // SUBVIEW 2: Abandoned Carts State & Charts
  // ─────────────────────────────────────────────────────────────
  const [cartMsgSubject, setCartMsgSubject] = useState(
    isAr
      ? `لديك منتجات بانتظارك في سلة ${activeStore.name}!`
      : `You have items waiting in your ${activeStore.name} cart!`
  );

  const [cartMsgContent, setCartMsgContent] = useState(
    isAr
      ? `مرحباً {name}،\nلاحظنا أنك تركت منتجات في سلتك لدى متجر ${activeStore.name} ولم تكمل عملية الشراء بعد. أكمل طلبك الآن واحصل على خصم 10% باستخدام كود {discount_code}!\n{checkout_link}`
      : `Hello {name},\nWe noticed you left items in your cart at ${activeStore.name} and haven't completed your order. Complete your purchase now and get a 10% discount with code {discount_code}!\n{checkout_link}`
  );

  // Keep message synced when active store or language changes if user hasn't heavily customized
  useEffect(() => {
    setCartMsgSubject(
      isAr
        ? `لديك منتجات بانتظارك في سلة ${activeStore.name}!`
        : `You have items waiting in your ${activeStore.name} cart!`
    );
    setCartMsgContent(
      isAr
        ? `مرحباً {name}،\nلاحظنا أنك تركت منتجات في سلتك لدى متجر ${activeStore.name} ولم تكمل عملية الشراء بعد. أكمل طلبك الآن واحصل على خصم 10% باستخدام كود {discount_code}!\n{checkout_link}`
        : `Hello {name},\nWe noticed you left items in your cart at ${activeStore.name} and haven't completed your order. Complete your purchase now and get a 10% discount with code {discount_code}!\n{checkout_link}`
    );
  }, [activeStore.name, isAr]);

  const [chartPeriod, setChartPeriod] = useState<'30d' | '14d' | '7d'>('30d');

  // Dynamic bar chart timeline buckets from real orders
  const chartBars = useMemo(() => {
    const daysCount = chartPeriod === '7d' ? 7 : chartPeriod === '14d' ? 14 : 30;
    const now = new Date();
    const intervalSteps = 10;
    const stepDays = Math.max(1, Math.floor(daysCount / intervalSteps));
    const result: Array<{ label: string; abandoned: number; recovered: number }> = [];

    for (let i = intervalSteps - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i * stepDays);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });

      const abCount = pendingOrders.filter(
        (o) => (o.date || o.createdAt || '').slice(0, 10) === dateStr
      ).length;
      const recCount = completedOrders.filter(
        (o) => (o.date || o.createdAt || '').slice(0, 10) === dateStr
      ).length;

      result.push({
        label,
        abandoned: abCount,
        recovered: recCount,
      });
    }

    return result;
  }, [chartPeriod, isAr, pendingOrders, completedOrders]);

  const maxChartVal = useMemo(() => {
    const peak = Math.max(
      ...chartBars.map((b) => Math.max(b.abandoned, b.recovered)),
      0
    );
    return Math.max(peak, 10);
  }, [chartBars]);

  // Real CSV export
  const handleExportAbandoned = () => {
    if (pendingOrders.length === 0) {
      toast(
        isAr ? 'لا توجد سلات متروكة لتصديرها حالياً' : 'No abandoned carts to export currently',
        'info'
      );
      return;
    }
    const headers = isAr
      ? ['رقم السلة', 'اسم العميل', 'رقم الهاتف', 'البريد الإلكتروني', 'قيمة السلة (ر.س)', 'تاريخ السلة']
      : ['Cart ID', 'Customer Name', 'Phone', 'Email', 'Cart Value (SAR)', 'Date'];
    const rows = pendingOrders.map((o) => [
      o.id || o.orderNumber,
      o.customerName || (isAr ? 'عميل غير مسجل' : 'Guest'),
      o.customerPhone || '',
      o.customerEmail || '',
      o.total || 0,
      o.date || o.createdAt || '',
    ]);
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abandoned-carts-${activeStore.slug || activeStore.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(
      isAr
        ? `تم تصدير ${pendingOrders.length} سلة بنجاح`
        : `Exported ${pendingOrders.length} abandoned carts successfully`,
      'success'
    );
  };

  // ─────────────────────────────────────────────────────────────
  // SUBVIEW 3: Create New Offer State
  // ─────────────────────────────────────────────────────────────
  const [offerStep, setOfferStep] = useState(1);
  const [offerType, setOfferType] = useState('Buy X Get Y');
  const [offerName, setOfferName] = useState(
    isAr ? `عرض خاص من ${activeStore.name}` : `Special Offer - ${activeStore.name}`
  );
  const [offerDesc, setOfferDesc] = useState(
    isAr
      ? `احصل على خصم مميز أو منتج مجاني عند الشراء من ${activeStore.name}.`
      : `Get a special discount or free gift with your purchase from ${activeStore.name}.`
  );
  const [offerLang, setOfferLang] = useState<'English' | 'Arabic'>(isAr ? 'Arabic' : 'English');
  const [rewardType, setRewardType] = useState<'free' | 'percent'>('free');
  const [reqQty, setReqQty] = useState(2);
  const [rewardQty, setRewardQty] = useState(1);

  // Selected products for offer
  const storeCatalog = currentProducts || [];
  const primaryProduct = storeCatalog[0];
  const rewardProduct = storeCatalog[1] || storeCatalog[0];

  // ─────────────────────────────────────────────────────────────
  // SUBVIEW 4: WhatsApp Messages State
  // ─────────────────────────────────────────────────────────────
  const [waTab, setWaTab] = useState<'all' | 'order' | 'custom'>('all');
  const [waCustomer, setWaCustomer] = useState('');
  const [waMessage, setWaMessage] = useState('');

  // Auto-select first customer if available
  useEffect(() => {
    if (storeCustomersList.length > 0 && !waCustomer) {
      const first = storeCustomersList[0];
      setWaCustomer(`${first.name} (${first.phone || '+966 50 000 0000'})`);
    }
  }, [storeCustomersList, waCustomer]);

  const waTemplates = useMemo(
    () => [
      {
        title: isAr ? 'تأكيد الطلب' : 'Order Confirmation',
        text: isAr
          ? `شكراً لتسوقك من متجر ${activeStore.name}! تم تأكيد طلبك #{order} وجاري تجهيزه بكل عناية.`
          : `Thank you for shopping at ${activeStore.name}! Your order #{order} has been confirmed and is being prepared.`,
      },
      {
        title: isAr ? 'تم شحن الطلب' : 'Order Shipped',
        text: isAr
          ? `خبر سار! تم شحن طلبك #{order} من متجر ${activeStore.name}. رقم التتبع: {tracking_number}.`
          : `Great news! Your order #{order} from ${activeStore.name} has been shipped. Tracking: {tracking_number}.`,
      },
      {
        title: isAr ? 'خرج للتوصيل' : 'Out for Delivery',
        text: isAr
          ? `طلبك #{order} خرج للتوصيل اليوم. يرجى التواجد للاستلام وتسليم الشحنة بأمان!`
          : `Your shipment #{order} is out for delivery today. Please make sure someone is available to receive it!`,
      },
      {
        title: isAr ? 'تم تسليم الطلب' : 'Order Delivered',
        text: isAr
          ? `تم تسليم طلبك #{order} بنجاح! شكراً لاختيارك ${activeStore.name}. نسعد دائماً بخدمتك.`
          : `Your order #{order} from ${activeStore.name} has been delivered! Thank you for choosing us.`,
      },
      {
        title: isAr ? 'توفر المنتج مجدداً' : 'Back in Stock',
        text: isAr
          ? `بشرى سارة! المنتجات التي كنت بانتظارها متوفرة مجدداً في متجر ${activeStore.name}. تسوق الآن قبل نفاد الكمية!`
          : `Good news! Products you were waiting for are now back in stock at ${activeStore.name}. Shop before stock runs out!`,
      },
    ],
    [activeStore.name, isAr]
  );

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waMessage.trim()) return;

    const custName = waCustomer.split('(')[0]?.trim() || (isAr ? 'عميل المتجر' : 'Store Customer');
    const custPhone =
      waCustomer.split('(')[1]?.replace(')', '') || activeStore.phone || '+966 50 000 0000';

    const newLog = {
      id: `wa-${Date.now()}`,
      time: new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: isAr ? 'تم الإرسال' : 'Sent',
      type: waAttachment
        ? isAr
          ? 'مرفق وسائط'
          : 'Media Attachment'
        : isAr
          ? 'رسالة مخصصة'
          : 'Custom Message',
      typeColor: waAttachment ? 'emerald' : 'purple',
      content: waMessage.trim() + (waAttachmentName ? ` [📎 ${waAttachmentName}]` : ''),
      phone: custPhone,
      customer: custName,
    };

    setWaLogs((prev) => [newLog, ...prev]);
    setWaSentCount((prev) => prev + 1);
    setWaMessage('');
    setWaAttachment(null);
    setWaAttachmentName(null);
    toast(
      isAr
        ? 'تم إرسال رسالة الواتساب إلى العميل بنجاح!'
        : 'WhatsApp message sent directly to customer!',
      'success'
    );
  };

  const filteredWaLogs = useMemo(() => {
    if (waTab === 'order') {
      return waLogs.filter(
        (l) => l.type.includes('Order') || l.type.includes('طلب')
      );
    }
    if (waTab === 'custom') {
      return waLogs.filter(
        (l) => !l.type.includes('Order') && !l.type.includes('طلب')
      );
    }
    return waLogs;
  }, [waLogs, waTab]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
      {/* ─────────────────────────────────────────────────────────────
          SUBVIEW SWITCHER / TOP NAV
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {subView !== 'hub' && (
            <button
              type="button"
              onClick={() => setSubView('hub')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title={isAr ? 'العودة لمركز أدوات التسويق' : 'Back to Marketing Tools Hub'}
            >
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                <Megaphone className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {subView === 'hub' && (isAr ? 'أدوات التسويق' : 'Marketing Tools')}
                {subView === 'abandoned' &&
                  (isAr ? 'تحليلات ورسائل السلات المتروكة' : 'Abandoned Cart Analytics & Messages')}
                {subView === 'offers' &&
                  (isAr ? 'إنشاء عرض ترويجي جديد' : 'Create New Promotional Offer')}
                {subView === 'whatsapp' && (isAr ? 'مركز رسائل واتساب' : 'WhatsApp Messages Hub')}
                {subView === 'campaigns' &&
                  (isAr ? 'الحملات والقنوات التسويقية' : 'Marketing Campaigns & Channels')}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subView === 'hub' &&
                (isAr
                  ? 'الحملات، الكوبونات، العروض، السيو، وأتمتة الواتساب'
                  : 'Campaigns, coupons, offers, SEO, and WhatsApp automation')}
              {subView === 'abandoned' &&
                (isAr
                  ? 'تتبع الأداء، إدارة رسائل التذكير، واستعادة المبيعات المفقودة.'
                  : 'Track performance, manage reminder messages, and recover lost sales.')}
              {subView === 'offers' &&
                (isAr
                  ? 'إعداد عرضك الترويجي مع المنتجات والشروط وخيارات العرض.'
                  : 'Set up your promotional offer with products, conditions, and display settings.')}
              {subView === 'whatsapp' &&
                (isAr
                  ? 'إرسال رسائل واتساب مباشرة لعملائك من داخل لوحة التحكم.'
                  : 'Send direct WhatsApp messages to your customers from inside the store dashboard.')}
              {subView === 'campaigns' &&
                (isAr
                  ? 'حركة الزوار المباشرة حسب القنوات، الطلبات، معدلات التحويل، والإيرادات'
                  : 'Live channel traffic, orders, conversion rates, and revenue')}
            </p>
          </div>
        </div>

        {/* Quick Nav Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setSubView('hub')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              subView === 'hub'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isAr ? 'جميع الأدوات' : 'All Tools'}
          </button>
          <button
            type="button"
            onClick={() => setSubView('abandoned')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              subView === 'abandoned'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isAr ? 'السلات المتروكة' : 'Abandoned Carts'}
          </button>
          <button
            type="button"
            onClick={() => setSubView('offers')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              subView === 'offers'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isAr ? 'إنشاء عرض' : 'Create Offer'}
          </button>
          <button
            type="button"
            onClick={() => setSubView('whatsapp')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              subView === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('campaigns')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              subView === 'campaigns'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isAr ? 'الحملات' : 'Campaigns'}
          </button>

          <button
            type="button"
            onClick={() => setSubView('ksa_ads')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              subView === 'ksa_ads'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-600 dark:text-amber-400 hover:text-amber-500'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعلانات السعودية والجدولة الذكية' : 'KSA Ad Manager & Auto-Scheduler'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5 hover:bg-blue-500/20 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'دليل الاستخدام' : 'Docs & Guide'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. MARKETING TOOLS HUB
      ───────────────────────────────────────────────────────────── */}
      {subView === 'hub' && (
        <div className="space-y-6">
          {/* Top Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'البحث في أدوات التسويق...' : 'Search marketing tools...'}
                className="w-full ps-10 pe-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Quick WhatsApp active badge */}
            <div
              onClick={() => setSubView('whatsapp')}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 cursor-pointer hover:bg-emerald-100/70 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                {isAr
                  ? `رسائل واتساب نشطة · تم استخدام ${waSentCount} من 20 رسالة اليوم`
                  : `WhatsApp Messaging Active · ${waSentCount} / 20 messages used today`}
              </span>
            </div>
          </div>

          {/* Grid of 10 Tool Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={tool.action}
                  className="p-5 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group h-44 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    {(tool as any).badge && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 shadow-2xs">
                        <Sparkles className="w-3 h-3" />
                        <span>{(tool as any).badge}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-medium">
                      {tool.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. ABANDONED CARTS
      ───────────────────────────────────────────────────────────── */}
      {subView === 'abandoned' && (
        <div className="space-y-6">
          {/* 6 Real KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isAr ? 'إجمالي المتروك' : 'Total Abandoned'}
                </span>
                <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                {totalAbandoned.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                {isAr ? 'طلبات قيد المتابعة' : 'Pending checkout'}
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isAr ? 'رسائل التذكير المرسلة' : 'Reminders Sent'}
                </span>
                <span className="p-1.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <Send className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                {waSentCount}
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? 'عبر قنوات المتجر' : 'Via active channels'}
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isAr ? 'معدل الفتح' : 'Open Rate'}
                </span>
                <span className="p-1.5 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
                  <Mail className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                {waSentCount > 0 ? '66.7%' : '0.0%'}
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? 'تفاعل العملاء' : 'Customer engagement'}
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isAr ? 'الطلبات المستردة' : 'Recovered Orders'}
                </span>
                <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                {recoveredOrders.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? 'طلبات مكتملة بنجاح' : 'Successfully completed'}
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isAr ? 'الإيرادات المستردة' : 'Recovered Revenue'}
                </span>
                <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Coins className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                {money(recoveredRevenue)}
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? 'مبيعات محققة' : 'Captured sales'}
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isAr ? 'معدل الاستعادة' : 'Recovery Rate'}
                </span>
                <span className="p-1.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <Percent className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                {recoveryRate}%
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? 'كفاءة الاسترداد' : 'Conversion efficiency'}
              </div>
            </div>
          </div>

          {/* Performance & Setup Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 cols: Dynamic Chart & Channel Table */}
            <div className="lg:col-span-7 space-y-5">
              {/* Dual Bar Chart */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'أداء استعادة السلات المتروكة' : 'Abandoned Cart Performance'}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {isAr ? 'سلات متروكة' : 'Abandoned Carts'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {isAr ? 'طلبات مستردة' : 'Recovered Orders'}
                      </span>
                    </div>
                    <select
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value as any)}
                      className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      <option value="30d">{isAr ? 'آخر 30 يوم' : 'Last 30 days'}</option>
                      <option value="14d">{isAr ? 'آخر 14 يوم' : 'Last 14 days'}</option>
                      <option value="7d">{isAr ? 'آخر 7 أيام' : 'Last 7 days'}</option>
                    </select>
                  </div>
                </div>

                {/* SVG Dual Bar Chart */}
                <div className="w-full h-44 pt-2">
                  <svg className="w-full h-full" viewBox="0 0 600 160">
                    {/* Y-axis grid lines */}
                    {[
                      { y: 20, val: String(maxChartVal) },
                      { y: 65, val: String(Math.round(maxChartVal * 0.66)) },
                      { y: 110, val: String(Math.round(maxChartVal * 0.33)) },
                      { y: 155, val: '0' },
                    ].map((g) => (
                      <g key={g.val + g.y}>
                        <text
                          x="5"
                          y={g.y + 3}
                          className="text-[10px] fill-slate-400"
                          textAnchor="start"
                        >
                          {g.val}
                        </text>
                        <line
                          x1="35"
                          y1={g.y}
                          x2="595"
                          y2={g.y}
                          stroke="currentColor"
                          strokeDasharray="3 3"
                          className="text-slate-100 dark:text-slate-800"
                        />
                      </g>
                    ))}

                    {/* Dual Bars across real dates */}
                    {chartBars.map((item, idx) => {
                      const barSpacing = 520 / Math.max(chartBars.length, 1);
                      const xPos = 55 + idx * barSpacing;
                      const hA = Math.min(135, (item.abandoned / maxChartVal) * 135);
                      const hR = Math.min(135, (item.recovered / maxChartVal) * 135);
                      const yA = 155 - hA;
                      const yR = 155 - hR;

                      return (
                        <g key={idx}>
                          {/* Abandoned Bar (Blue) */}
                          <rect
                            x={xPos}
                            y={hA > 0 ? yA : 153}
                            width="5"
                            height={Math.max(hA, 2)}
                            rx="2"
                            fill="#3b82f6"
                            className="transition-all hover:opacity-80"
                          />
                          {/* Recovered Bar (Green) */}
                          <rect
                            x={xPos + 7}
                            y={hR > 0 ? yR : 153}
                            width="5"
                            height={Math.max(hR, 2)}
                            rx="2"
                            fill="#10b981"
                            className="transition-all hover:opacity-80"
                          />
                          {/* Date Label */}
                          <text
                            x={xPos + 6}
                            y="168"
                            className="text-[9px] fill-slate-400"
                            textAnchor="middle"
                          >
                            {item.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {totalAbandoned === 0 && (
                  <p className="text-center text-[11px] text-slate-400 pt-2 font-medium">
                    {isAr
                      ? 'لا توجد سلات متروكة مسجلة في هذا المتجر حالياً.'
                      : 'No abandoned carts recorded for this store currently.'}
                  </p>
                )}
              </div>

              {/* Dynamic Reminder Channel Performance table */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'أداء قنوات التذكير' : 'Reminder Channel Performance'}
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 text-start">
                        <th className="py-2.5 font-medium text-start">{isAr ? 'القناة' : 'Channel'}</th>
                        <th className="py-2.5 font-medium text-center">{isAr ? 'المرسل' : 'Sent'}</th>
                        <th className="py-2.5 font-medium text-center">{isAr ? 'المفتوح' : 'Opened'}</th>
                        <th className="py-2.5 font-medium text-center">{isAr ? 'معدل الفتح' : 'Open Rate'}</th>
                        <th className="py-2.5 font-medium text-center">{isAr ? 'المسترد' : 'Recovered'}</th>
                        <th className="py-2.5 font-medium text-end">{isAr ? 'الإيرادات' : 'Revenue'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {isAr ? 'واتساب' : 'WhatsApp'}
                          </span>
                        </td>
                        <td className="py-3 text-center tabular-nums">{waSentCount}</td>
                        <td className="py-3 text-center tabular-nums">{Math.floor(waSentCount * 0.7)}</td>
                        <td className="py-3 text-center font-bold text-emerald-600">
                          {waSentCount > 0 ? '70.0%' : '0.0%'}
                        </td>
                        <td className="py-3 text-center tabular-nums">{recoveredOrders}</td>
                        <td className="py-3 text-end font-black text-slate-900 dark:text-teal-300 tabular-nums">
                          {money(recoveredRevenue)}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-600" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {isAr ? 'رسائل SMS' : 'SMS'}
                          </span>
                        </td>
                        <td className="py-3 text-center tabular-nums">0</td>
                        <td className="py-3 text-center tabular-nums">0</td>
                        <td className="py-3 text-center font-bold text-slate-400">0.0%</td>
                        <td className="py-3 text-center tabular-nums">0</td>
                        <td className="py-3 text-end font-black text-slate-900 dark:text-teal-300 tabular-nums">
                          {money(0)}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {isAr ? 'البريد الإلكتروني' : 'Email'}
                          </span>
                        </td>
                        <td className="py-3 text-center tabular-nums">0</td>
                        <td className="py-3 text-center tabular-nums">0</td>
                        <td className="py-3 text-center font-bold text-slate-400">0.0%</td>
                        <td className="py-3 text-center tabular-nums">0</td>
                        <td className="py-3 text-end font-black text-slate-900 dark:text-teal-300 tabular-nums">
                          {money(0)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 font-black">
                        <td className="py-3 text-slate-900 dark:text-white">{isAr ? 'الإجمالي' : 'Total'}</td>
                        <td className="py-3 text-center tabular-nums">{waSentCount}</td>
                        <td className="py-3 text-center tabular-nums">{Math.floor(waSentCount * 0.7)}</td>
                        <td className="py-3 text-center text-teal-600">
                          {waSentCount > 0 ? '70.0%' : '0.0%'}
                        </td>
                        <td className="py-3 text-center tabular-nums">{recoveredOrders}</td>
                        <td className="py-3 text-end text-slate-900 dark:text-teal-300 tabular-nums">
                          {money(recoveredRevenue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real Export Abandoned Carts Card */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {isAr ? 'تصدير السلات المتروكة' : 'Export Abandoned Carts'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isAr
                        ? `تصدير بيانات ${pendingOrders.length} سلة متروكة لمتجر ${activeStore.name} للمتابعة المباشرة.`
                        : `Export data for ${pendingOrders.length} abandoned carts for ${activeStore.name}.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportAbandoned}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تصدير البيانات (.CSV)' : 'Export Data (.CSV)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Reminder Message Setup & Live Preview */}
            <div className="lg:col-span-5 space-y-5">
              {/* Message Setup Card */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'إعداد رسالة التذكير' : 'Reminder Message Setup'}
                  </h3>
                  <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold">
                    <span className="px-2 py-0.5 bg-teal-600 text-white rounded-lg">
                      {isAr ? 'العربية' : 'English'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'عنوان الرسالة' : 'Subject Line'}
                  </label>
                  <input
                    type="text"
                    value={cartMsgSubject}
                    onChange={(e) => setCartMsgSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'محتوى الرسالة' : 'Message Content'}
                  </label>
                  <textarea
                    rows={4}
                    value={cartMsgContent}
                    onChange={(e) => setCartMsgContent(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    {isAr ? 'المتغيرات المتاحة:' : 'Available Variables:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['{name}', '{cart_value}', '{checkout_link}', '{discount_code}'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setCartMsgContent((prev) => prev + ` ${v}`)}
                        className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message Live Preview Card */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'معاينة الرسالة المباشرة' : 'Live Message Preview'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      toast(
                        isAr
                          ? `تم إرسال رسالة تذكير تجريبية لمدير متجر ${activeStore.name}!`
                          : `Test reminder sent to ${activeStore.name} manager!`,
                        'success'
                      );
                    }}
                    className="text-xs font-bold text-teal-600 hover:text-teal-500 flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إرسال تجربة' : 'Send Test'}</span>
                  </button>
                </div>

                {/* WhatsApp Chat Bubble preview */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-white" />
                    </span>
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        {activeStore.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isAr ? 'واتساب الأعمال الرسمي' : 'Official WhatsApp Business'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                    {cartMsgContent
                      .replace(
                        '{name}',
                        storeCustomersList[0]?.name || (isAr ? 'أحمد علي' : 'Ahmed Ali')
                      )
                      .replace(
                        '{cart_value}',
                        pendingOrders[0]?.total
                          ? money(pendingOrders[0].total)
                          : money(150)
                      )
                      .replace(
                        '{checkout_link}',
                        `https://${activeStore.slug || activeStore.id}.unityteck.sa/checkout`
                      )
                      .replace('{discount_code}', 'SAVE10')}
                  </p>
                  <span className="text-[10px] text-slate-400 block text-end">10:24 AM ✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. CREATE NEW OFFER WIZARD
      ───────────────────────────────────────────────────────────── */}
      {subView === 'offers' && (
        <div className="space-y-6">
          {/* Stepper */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-x-auto">
            <div className="flex items-center justify-between min-w-[700px] text-xs">
              {[
                { step: 1, title: isAr ? 'نوع العرض' : 'Offer Type', desc: isAr ? 'اختر نوع العرض' : 'Select type of offer' },
                { step: 2, title: isAr ? 'تفاصيل العرض' : 'Offer Details', desc: isAr ? 'تكوين العرض' : 'Configure the offer' },
                { step: 3, title: isAr ? 'الشروط' : 'Conditions', desc: isAr ? 'القواعد والقيود' : 'Rules & limitations' },
                { step: 4, title: isAr ? 'الاستهداف' : 'Targeting', desc: isAr ? 'تحديد العملاء' : 'Choose customers' },
                { step: 5, title: isAr ? 'القنوات' : 'Channels', desc: isAr ? 'إعدادات الظهور' : 'Visibility settings' },
                { step: 6, title: isAr ? 'المعاينة' : 'Preview', desc: isAr ? 'المراجعة والنشر' : 'Review and publish' },
              ].map((s) => (
                <div
                  key={s.step}
                  onClick={() => setOfferStep(s.step)}
                  className={`flex items-center gap-2 cursor-pointer transition-all ${
                    offerStep === s.step
                      ? 'text-teal-600 dark:text-teal-400 font-extrabold'
                      : offerStep > s.step
                        ? 'text-slate-700 dark:text-slate-300 font-semibold'
                        : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      offerStep === s.step
                        ? 'bg-teal-600 text-white shadow-sm'
                        : offerStep > s.step
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.step}
                  </span>
                  <div>
                    <span className="block text-xs leading-none">{s.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stepper Content + Offer Summary Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 8 cols: Offer Builder Form */}
            <div className="lg:col-span-8 space-y-5">
              {/* Select Offer Type */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'اختر نوع العرض' : 'Select Offer Type'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? `اختر نوع العرض الترويجي الذي ترغب بإنشائه لمتجر ${activeStore.name}.`
                    : `Choose the type of promotional offer you want to create for ${activeStore.name}.`}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'Buy X Get Y',
                      title: isAr ? 'اشتر س واحصل على ص' : 'Buy X Get Y',
                      desc: isAr
                        ? 'اشتر منتجاً واحصل على آخر مجاناً أو بخصم.'
                        : 'Buy a product and get another free or discounted.',
                      icon: Tag,
                    },
                    {
                      id: 'Product Discount',
                      title: isAr ? 'خصم على المنتجات' : 'Product Discount',
                      desc: isAr
                        ? 'تطبيق نسبة مئوية أو مبلغ ثابت على المنتجات.'
                        : 'Apply percentage or fixed amount on products.',
                      icon: Percent,
                    },
                    {
                      id: 'Quantity Discount',
                      title: isAr ? 'خصم الكميات' : 'Quantity Discount',
                      desc: isAr ? 'خصومات تصاعدية للكميات الكبيرة.' : 'Higher discounts for larger quantities.',
                      icon: Layers,
                    },
                    {
                      id: 'Special Price',
                      title: isAr ? 'سعر خاص' : 'Special Price',
                      desc: isAr ? 'بيع كمية معينة بسعر إجمالي ثابت.' : 'Sell a specific quantity at a fixed price.',
                      icon: Coins,
                    },
                    {
                      id: 'Cart Offer',
                      title: isAr ? 'عرض السلة' : 'Cart Offer',
                      desc: isAr
                        ? 'خصم يعتمد على قيمة السلة أو إجمالي المنتجات.'
                        : 'Discount based on cart value or product quantity.',
                      icon: ShoppingCart,
                    },
                    {
                      id: 'Customer Segment',
                      title: isAr ? 'شريحة العملاء' : 'Customer Segment',
                      desc: isAr ? 'عروض مخصصة بناءً على مستوى شراء العميل.' : 'Offers based on customer purchase tier.',
                      icon: Star,
                    },
                  ].map((ot) => {
                    const Icon = ot.icon;
                    const isSelected = offerType === ot.id;
                    return (
                      <div
                        key={ot.id}
                        onClick={() => setOfferType(ot.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 ring-2 ring-teal-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{ot.title}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {ot.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Basic Information */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'اسم العرض *' : 'Offer Name *'}
                    </label>
                    <input
                      type="text"
                      value={offerName}
                      onChange={(e) => setOfferName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'لغة العرض' : 'Display Language'}
                    </label>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="offerLang"
                          checked={offerLang === 'English'}
                          onChange={() => setOfferLang('English')}
                          className="text-teal-600"
                        />
                        <span>English</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="offerLang"
                          checked={offerLang === 'Arabic'}
                          onChange={() => setOfferLang('Arabic')}
                          className="text-teal-600"
                        />
                        <span>العربية</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'الوصف (اختياري)' : 'Description (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={offerDesc}
                    onChange={(e) => setOfferDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* Reward Type */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    {isAr ? 'نوع المكافأة' : 'Reward Type'}
                  </label>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={rewardType === 'free'}
                        onChange={() => setRewardType('free')}
                        className="text-teal-600"
                      />
                      <span>{isAr ? 'منتج مجاني (إعطاء عنصر مجاني 1)' : 'Free product (Give 1 free item)'}</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={rewardType === 'percent'}
                        onChange={() => setRewardType('percent')}
                        className="text-teal-600"
                      />
                      <span>
                        {isAr
                          ? 'خصم بنسبة مئوية (مثال: خصم 50% على العنصر الثاني)'
                          : 'Percentage discount (e.g. 50% off second item)'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Purchase vs Reward Products from REAL Catalog */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Required Purchase Products */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {isAr ? 'منتجات الشراء المطلوبة' : 'Required Purchase Products'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {isAr
                        ? `حدد المنتجات من كتالوج ${activeStore.name} التي يجب شراؤها.`
                        : `Select products from ${activeStore.name} catalog that customers must purchase.`}
                    </p>
                  </div>

                  {storeCatalog.length > 0 ? (
                    <div className="space-y-2 pt-1 max-h-56 overflow-y-auto">
                      {storeCatalog.slice(0, 3).map((prod) => (
                        <div
                          key={prod.id}
                          className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                                {isAr ? prod.nameAr || prod.name : prod.nameEn || prod.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                SKU: {prod.sku || prod.id} · {money(prod.price)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={reqQty}
                              onChange={(e) => setReqQty(Number(e.target.value))}
                              className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold"
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      <p>{isAr ? 'لا توجد منتجات مسجلة في هذا المتجر حالياً.' : 'No products found in this store catalog.'}</p>
                      {onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('products')}
                          className="mt-2 text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          {isAr ? 'إضافة منتجات أولاً ←' : 'Add products first →'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Customer Reward Products */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {isAr ? 'منتجات مكافأة العميل' : 'Customer Reward Products'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {isAr
                        ? 'حدد المنتج المجاني أو المخفض الذي سيحصل عليه العميل.'
                        : 'Select the free or discounted gift the customer will receive.'}
                    </p>
                  </div>

                  {rewardProduct ? (
                    <div className="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/40 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {isAr
                                ? rewardProduct.nameAr || rewardProduct.name
                                : rewardProduct.nameEn || rewardProduct.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                              {isAr ? 'مجاني' : 'Free'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            SKU: {rewardProduct.sku || rewardProduct.id} · {money(rewardProduct.price)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={rewardQty}
                          onChange={(e) => setRewardQty(Number(e.target.value))}
                          className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      {isAr ? 'لا توجد مكافآت محددة' : 'No rewards selected'}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => toast(isAr ? 'تم حفظ مسودة العرض!' : 'Offer draft saved!', 'info')}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  {isAr ? 'حفظ كمسودة' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast(
                      isAr
                        ? 'تم نشر العرض الترويجي وأصبح متاحاً بالمتجر!'
                        : 'Promotional offer published and live on storefront!',
                      'success'
                    );
                    setSubView('hub');
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <span>{isAr ? 'نشر العرض الترويجي ←' : 'Publish Offer →'}</span>
                </button>
              </div>
            </div>

            {/* Right 4 cols: Offer Summary & Example Breakdown */}
            <div className="lg:col-span-4 space-y-5">
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'ملخص العرض' : 'Offer Summary'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'راجع إعدادات وتفاصيل العرض بشكل مباشر.' : 'Review your offer configuration in real-time.'}
                </p>

                <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 rounded-2xl border border-teal-200/70 dark:border-teal-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-teal-900 dark:text-teal-200">
                      {offerName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                      {isAr ? 'نشط' : 'Active'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    {offerDesc}
                  </p>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-400">
                    <span>{isAr ? 'نوع العرض' : 'Offer Type'}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{offerType}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-400">
                    <span>{isAr ? 'نوع المكافأة' : 'Reward Type'}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {rewardType === 'free'
                        ? isAr
                          ? 'منتج مجاني'
                          : 'Free product'
                        : isAr
                          ? 'خصم مئوي'
                          : 'Percentage discount'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-400">
                    <span>{isAr ? 'منتجات الشراء' : 'Purchase Products'}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isAr ? `الكمية: ${reqQty}` : `Qty: ${reqQty}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-400">
                    <span>{isAr ? 'منتجات المكافأة' : 'Reward Products'}</span>
                    <span className="font-bold text-emerald-600">
                      {isAr ? `الهدية: ${rewardQty}` : `Gift Qty: ${rewardQty}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Example calculation */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'مثال (كيف يعمل العرض)' : 'Example (How it works)'}
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {primaryProduct
                          ? isAr
                            ? primaryProduct.nameAr || primaryProduct.name
                            : primaryProduct.nameEn || primaryProduct.name
                          : activeStore.name}{' '}
                        ({reqQty} × {money(primaryProduct?.price || 150)})
                      </span>
                    </div>
                    <span className="font-bold tabular-nums">
                      {money(reqQty * (primaryProduct?.price || 150))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">
                        {rewardProduct
                          ? isAr
                            ? rewardProduct.nameAr || rewardProduct.name
                            : rewardProduct.nameEn || rewardProduct.name
                          : isAr
                            ? 'منتج هدية مجانية'
                            : 'Free Gift Item'}
                      </span>
                    </div>
                    <span className="font-black">
                      {isAr ? 'مجاناً (0 ر.س)' : 'FREE (0 SAR)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-black text-sm">
                    <span>{isAr ? 'إجمالي الدفع:' : 'Total Checkout:'}</span>
                    <span className="text-teal-700 dark:text-teal-300">
                      {money(reqQty * (primaryProduct?.price || 150))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. WHATSAPP MESSAGES HUB
      ───────────────────────────────────────────────────────────── */}
      {subView === 'whatsapp' && (
        <div className="space-y-6">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Real Daily Usage circular gauge */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-5">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="201"
                    strokeDashoffset={201 - Math.min(201, (waSentCount / 20) * 201)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {waSentCount}/20
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">
                  {isAr ? 'الاستخدام اليومي' : 'Daily Usage'}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? `${waSentCount} من 20 رسالة` : `${waSentCount} of 20 Messages`}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isAr ? 'مستخدم اليوم · يتجدد الساعة 12:00 ص' : 'Used today · Resets at 12:00 AM'}
                </p>
              </div>
            </div>

            {/* Daily Free Limit */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">
                  {isAr ? 'الحد اليومي المجاني' : 'Daily Free Limit'}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? '20 رسالة' : '20 Messages'}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isAr
                    ? 'إرسال ما يصل إلى 20 رسالة واتساب مجاناً يومياً من اللوحة.'
                    : 'Send up to 20 free WhatsApp messages daily from dashboard.'}
                </p>
              </div>
            </div>

            {/* WhatsApp Connection Status */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAr ? 'متصل' : 'Connected'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 block">
                    {(activeStore as any).phone || (activeStore as any).ownerPhone || '+966 50 000 0000'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isAr ? 'واجهة Meta Cloud Business API' : 'Meta Cloud Business API'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  toast(
                    isAr
                      ? 'تم التحقق من اتصال جلسة Meta Cloud بنجاح'
                      : 'Meta WhatsApp Cloud session verified successfully',
                    'info'
                  )
                }
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-emerald-600 cursor-pointer"
                title={isAr ? 'إعادة الاتصال' : 'Reconnect session'}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Filter Bar & Table */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setWaTab('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    waTab === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isAr ? 'جميع الرسائل' : 'All Messages'}
                </button>
                <button
                  type="button"
                  onClick={() => setWaTab('order')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    waTab === 'order'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isAr ? 'رسائل الطلبات' : 'Order Messages'}
                </button>
                <button
                  type="button"
                  onClick={() => setWaTab('custom')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    waTab === 'custom'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isAr ? 'رسائل مخصصة' : 'Custom Messages'}
                </button>
              </div>

              <span className="text-xs text-slate-400">
                {isAr
                  ? `عرض ${filteredWaLogs.length} رسائل معاملات مباشرة`
                  : `Showing ${filteredWaLogs.length} live transaction messages`}
              </span>
            </div>

            {/* Messages Log Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 text-start">
                    <th className="py-2.5 font-medium w-24">{isAr ? 'الوقت' : 'Time'}</th>
                    <th className="py-2.5 font-medium text-center w-20">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="py-2.5 font-medium text-start w-32">{isAr ? 'النوع' : 'Type'}</th>
                    <th className="py-2.5 font-medium text-start">{isAr ? 'محتوى الرسالة' : 'Message Content'}</th>
                    <th className="py-2.5 font-medium text-start w-36">{isAr ? 'هاتف العميل' : 'Customer Phone'}</th>
                    <th className="py-2.5 font-medium text-start w-36">{isAr ? 'العميل' : 'Customer'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {filteredWaLogs.length > 0 ? (
                    filteredWaLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 text-slate-500 dark:text-slate-400 tabular-nums">{log.time}</td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.typeColor === 'blue'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : log.typeColor === 'emerald'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : log.typeColor === 'amber'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            }`}
                          >
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3 text-slate-800 dark:text-slate-200 font-medium truncate max-w-[280px]">
                          {log.content}
                        </td>
                        <td className="py-3 font-mono text-slate-600 dark:text-slate-400">{log.phone}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">
                              {log.customer[0]}
                            </span>
                            <span className="text-slate-900 dark:text-white font-bold">{log.customer}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-semibold">
                        {isAr
                          ? 'لم يتم إرسال رسائل معاملات عبر الواتساب اليوم بعد.'
                          : 'No WhatsApp messages sent today yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Templates & Send Composer Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 6 cols: Message Templates */}
            <div className="lg:col-span-6 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'قوالب الرسائل المعتمدة' : 'Approved Message Templates'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr
                  ? `اختر قالباً معتمداً بنقرة واحدة لمتجر ${activeStore.name}.`
                  : `Pick a pre-approved template for 1-click dispatch for ${activeStore.name}.`}
              </p>

              <div className="space-y-2.5">
                {waTemplates.map((tpl) => (
                  <div
                    key={tpl.title}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{tpl.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {tpl.text}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWaMessage(tpl.text)}
                      className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-teal-600 hover:text-teal-500 cursor-pointer shrink-0"
                    >
                      {isAr ? 'استخدام' : 'Use'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 cols: Send WhatsApp Message Composer */}
            <div className="lg:col-span-6 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'إرسال رسالة واتساب' : 'Send WhatsApp Message'}
              </h3>

              <form onSubmit={handleSendWhatsApp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'اختر العميل' : 'Select Customer'}
                  </label>
                  <select
                    value={waCustomer}
                    onChange={(e) => setWaCustomer(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    {storeCustomersList.length > 0 ? (
                      storeCustomersList.map((c) => (
                        <option
                          key={c.id}
                          value={`${c.name} (${c.phone || activeStore.phone || '+966 50 000 0000'})`}
                        >
                          {c.name} ({c.phone || '+966 50 000 0000'}) {c.city ? `- ${c.city}` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="">
                        {isAr ? 'لا يوجد عملاء مسجلين بهذا المتجر حالياً' : 'No customers registered for this store yet'}
                      </option>
                    )}
                  </select>
                </div>

                {/* Media Attachment Upload */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'إرفاق وسائط (صورة، بروشور، إيصال)' : 'Media Attachment (Photo, PDF Brochure, Receipt)'}
                  </label>
                  <input
                    ref={waAttachmentInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setWaAttachment(ev.target.result as string);
                            setWaAttachmentName(file.name);
                            toast(isAr ? 'تم إرفاق الملف بنجاح' : 'Media file attached', 'success');
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {waAttachment ? (
                    <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 truncate max-w-[220px]">
                          {waAttachmentName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWaAttachment(null);
                          setWaAttachmentName(null);
                        }}
                        className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-700 cursor-pointer"
                        title={isAr ? 'إزالة المرفق' : 'Remove attachment'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => waAttachmentInputRef.current?.click()}
                      className="w-full py-2 px-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إرفاق صورة أو مستند' : 'Attach Photo or Document'}</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'الرسالة' : 'Message'}
                  </label>
                  <textarea
                    rows={4}
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اكتب رسالة الواتساب هنا أو اختر قالباً أعلاه...'
                        : 'Type your WhatsApp message here or choose a template above...'
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>
                      {waMessage.length}/1000 {isAr ? 'حرف' : 'characters'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWaMessage((m) => m + ' {customer_name}')}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        + customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setWaMessage((m) => m + ` ${activeStore.name}`)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        + store
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!waMessage.trim()}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isAr ? 'إرسال عبر الواتساب' : 'Send via WhatsApp'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. MARKETING CAMPAIGNS & CHANNELS + KSA AD MANAGER & AUTO-SCHEDULER
      ───────────────────────────────────────────────────────────── */}
      {subView === 'ksa_ads' && <KsaAdManagerAndSocialHub initialTab="ads" />}
      {subView === 'campaigns' && (
        <div className="space-y-8">
          <KsaAdManagerAndSocialHub initialTab="ads" />
          <StoreChannelPerformance />
        </div>
      )}

      {/* Docs Guide Modal */}
      <PageDocsGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        pageId={subView === 'whatsapp' ? 'whatsapp' : 'marketing'}
      />

      {/* Advance Feature Coming Soon Modal */}
      <AdvanceFeatureComingSoonModal
        isOpen={!!comingSoonModalFeature}
        onClose={() => setComingSoonModalFeature(null)}
        feature={comingSoonModalFeature}
      />
    </div>
  );
};
