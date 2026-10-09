import React, { useState } from 'react';
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
  Flower2,
  HelpCircle,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { PageDocsGuideModal } from '../common/PageDocsGuideModal';

export type MarketingSubView = 'hub' | 'abandoned' | 'offers' | 'whatsapp' | 'campaigns';

interface StoreMarketingHubProps {
  initialView?: MarketingSubView;
  onNavigateTab?: (tab: string) => void;
}

export const StoreMarketingHub: React.FC<StoreMarketingHubProps> = ({
  initialView = 'hub',
  onNavigateTab,
}) => {
  const { activeStore, allStoreCustomers } = useTenant();
  const { money, t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [subView, setSubView] = useState<MarketingSubView>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [waAttachment, setWaAttachment] = useState<string | null>(null);
  const [waAttachmentName, setWaAttachmentName] = useState<string | null>(null);
  const waAttachmentInputRef = React.useRef<HTMLInputElement>(null);
  const storeCustomersList = (allStoreCustomers && allStoreCustomers[activeStore.id]) || [];

  // ─────────────────────────────────────────────────────────────
  // SUBVIEW 1: The 10 Marketing Tools Hub (Screenshot 1: media_1790840219280.png)
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
      action: () => setSubView('offers'),
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
      action: () => toast(isAr ? 'شبكة التسويق بالعمولة نشطة لمتجر ' + activeStore.name : 'Affiliate Influencer Network active for ' + activeStore.name, 'info'),
    },
    {
      id: 'blog',
      title: isAr ? 'المدونة' : 'Blog',
      desc: isAr ? 'نشر المقالات والمحتوى.' : 'Publish articles.',
      icon: BookOpen,
      color: 'blue',
      action: () => toast(isAr ? 'تم تهيئة إدارة محتوى المدونة' : 'Blog content management initialized', 'info'),
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
      action: () => toast(isAr ? 'تم تكوين نقاط الولاء للمتجر' : 'Saudi Qitaf & Store Points configured', 'info'),
    },
    {
      id: 'cashback',
      title: isAr ? 'استرداد نقدي (كاش باك)' : 'Cashback',
      desc: isAr ? 'نظام استرداد فوري للمحفظة.' : 'Instant rebate system.',
      icon: Coins,
      color: 'blue',
      action: () => toast(isAr ? 'مكافآت الكاش باك الفورية نشطة' : 'Instant Cashback wallet rewards active', 'info'),
    },
    {
      id: 'special-offers',
      title: isAr ? 'عروض خاصة' : 'Special Offers',
      desc: isAr ? 'صفقات وتخفيضات محدودة بوقت.' : 'Limited time deals.',
      icon: Gift,
      color: 'blue',
      action: () => setSubView('offers'),
    },
  ];

  const filteredTools = tools.filter((tool) =>
    `${tool.title} ${tool.desc}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────
  // SUBVIEW 2: Abandoned Carts State (Screenshot 2: media_1790840243399.png)
  // ─────────────────────────────────────────────────────────────
  const [cartMsgSubject, setCartMsgSubject] = useState(
    isAr ? 'لقد تركت منتجات في سلتك!' : 'You left something in your cart!'
  );
  const [cartMsgContent, setCartMsgContent] = useState(
    isAr
      ? 'مرحباً {name}،\nلاحظنا أنك تركت باقة من الزهور الفاخرة في سلتك ولم تكمل طلبك. أكمل عملية الشراء الآن واحصل على خصم 10%!\n{checkout_link}'
      : 'Hello {name},\nWe noticed that you left fresh flowers in your cart and didn\'t complete your order. Complete your purchase now and get a 10% discount!\n{checkout_link}'
  );
  const [testSent, setTestSent] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // SUBVIEW 3: Create New Offer State (Screenshot 4: media_1790840284499.png)
  // ─────────────────────────────────────────────────────────────
  const [offerStep, setOfferStep] = useState(1);
  const [offerType, setOfferType] = useState('Buy X Get Y');
  const [offerName, setOfferName] = useState('Buy 2 Luxury Bouquets Get 1 Free Vase');
  const [offerDesc, setOfferDesc] = useState('Get 1 free ceramic vase when you buy 2 luxury flower arrangements.');
  const [offerLang, setOfferLang] = useState<'English' | 'Arabic'>('English');
  const [offerActive, setOfferActive] = useState(true);
  const [rewardType, setRewardType] = useState<'free' | 'percent'>('free');
  const [reqQty, setReqQty] = useState(2);
  const [rewardQty, setRewardQty] = useState(1);

  // ─────────────────────────────────────────────────────────────
  // SUBVIEW 4: WhatsApp Messages State (Screenshot 5: media_1790840365376.jpg)
  // ─────────────────────────────────────────────────────────────
  const [waTab, setWaTab] = useState<'all' | 'order' | 'custom'>('all');
  const [waCustomer, setWaCustomer] = useState('Ahmed Ali (+966 50 123 4567)');
  const [waMessage, setWaMessage] = useState('');
  const [waLogs, setWaLogs] = useState([
    {
      id: 'wa-1',
      time: '10:30 AM',
      status: 'Sent',
      type: 'Order Update',
      typeColor: 'blue',
      content: 'Your flower order #10284 has been dispatched with cooling courier...',
      phone: '+966 50 123 4567',
      customer: 'Ahmed Ali',
    },
    {
      id: 'wa-2',
      time: '09:15 AM',
      status: 'Sent',
      type: 'Order Confirmation',
      typeColor: 'emerald',
      content: 'Thank you! Your order #10283 has been confirmed for Jabal Omar delivery...',
      phone: '+966 55 987 6543',
      customer: 'Sara Mohammed',
    },
    {
      id: 'wa-3',
      time: '08:45 AM',
      status: 'Sent',
      type: 'Custom Message',
      typeColor: 'purple',
      content: 'Hi! We just wanted to remind you about the Mother\'s Day rose promotion...',
      phone: '+966 53 111 2222',
      customer: 'Mohammed Abdullah',
    },
    {
      id: 'wa-4',
      time: '07:30 AM',
      status: 'Sent',
      type: 'Delivery Update',
      typeColor: 'amber',
      content: 'Your bouquet is out for delivery with SMSA Express and will arrive by 12 PM...',
      phone: '+966 59 333 4444',
      customer: 'Nora Khaled',
    },
    {
      id: 'wa-5',
      time: '06:20 AM',
      status: 'Sent',
      type: 'Custom Message',
      typeColor: 'purple',
      content: 'We have a special 15% VIP floral arrangement offer just for you!',
      phone: '+966 56 555 6666',
      customer: 'Ali Hassan',
    },
  ]);

  const waTemplates = [
    {
      title: isAr ? 'تأكيد الطلب' : 'Order Confirmation',
      text: isAr
        ? 'شكراً لتسوقك معنا! تم تأكيد طلبك #{order}. نضمن لك أعلى جودة ونضارة.'
        : 'Thank you! Your flower order #{order} has been confirmed. Freshness guaranteed.',
    },
    {
      title: isAr ? 'تم شحن الطلب' : 'Order Shipped',
      text: isAr
        ? 'تم شحن باقتك #{order} مع مندوب التوصيل المبرد. رقم التتبع: {tracking_number}.'
        : 'Your bouquet #{order} has been shipped in a climate-controlled van. Tracking: {tracking_number}.',
    },
    {
      title: isAr ? 'خرج للتوصيل' : 'Out for Delivery',
      text: isAr
        ? 'مندوب التوصيل في طريقه إليك الآن لتسليم الطلب. يرجى التواجد للاستلام!'
        : 'Our courier is arriving shortly with your floral arrangement. Please be ready!',
    },
    {
      title: isAr ? 'تم تسليم الطلب' : 'Order Delivered',
      text: isAr
        ? `تم تسليم هديتك #{order} بنجاح! شكراً لاختيارك ${activeStore.name}.`
        : 'Your flower gift #{order} has been delivered! Thank you for choosing ' + activeStore.name + '.',
    },
    {
      title: isAr ? 'توفر المنتج مجدداً' : 'Back in Stock',
      text: isAr
        ? 'المنتجات التي طلبتها أصبحت متوفرة الآن في المتجر!'
        : 'The Royal Dutch Tulips you requested are now back in stock!',
    },
  ];

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waMessage.trim()) return;
    const newLog = {
      id: `wa-${Date.now()}`,
      time: isAr ? 'الآن' : 'Just now',
      status: isAr ? 'تم الإرسال' : 'Sent',
      type: waAttachment ? (isAr ? 'مرفق وسائط' : 'Media Attachment') : (isAr ? 'رسالة مخصصة' : 'Custom Message'),
      typeColor: waAttachment ? 'emerald' : 'purple',
      content: waMessage.trim() + (waAttachmentName ? ` [📎 ${waAttachmentName}]` : ''),
      phone: waCustomer.split('(')[1]?.replace(')', '') || '+966 50 123 4567',
      customer: waCustomer.split('(')[0]?.trim() || (isAr ? 'عميل مميز' : 'Valued Customer'),
    };
    setWaLogs([newLog, ...waLogs]);
    setWaMessage('');
    setWaAttachment(null);
    setWaAttachmentName(null);
    toast(isAr ? 'تم إرسال رسالة الواتساب إلى العميل بنجاح!' : 'WhatsApp message sent directly to customer!', 'success');
  };

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
                {subView === 'abandoned' && (isAr ? 'تحليلات ورسائل السلات المتروكة' : 'Abandoned Cart Analytics & Messages')}
                {subView === 'offers' && (isAr ? 'إنشاء عرض ترويجي جديد' : 'Create New Promotional Offer')}
                {subView === 'whatsapp' && (isAr ? 'مركز رسائل واتساب' : 'WhatsApp Messages Hub')}
                {subView === 'campaigns' && (isAr ? 'الحملات والقنوات التسويقية' : 'Marketing Campaigns & Channels')}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subView === 'hub' && (isAr ? 'الحملات، الكوبونات، العروض، السيو، وأتمتة الواتساب' : 'Campaigns, coupons, offers, SEO, and WhatsApp automation')}
              {subView === 'abandoned' && (isAr ? 'تتبع الأداء، إدارة رسائل التذكير، واستعادة المبيعات المفقودة.' : 'Track performance, manage reminder messages, and recover lost sales.')}
              {subView === 'offers' && (isAr ? 'إعداد عرضك الترويجي مع المنتجات والشروط وخيارات العرض.' : 'Set up your promotional offer with products, conditions, and display settings.')}
              {subView === 'whatsapp' && (isAr ? 'إرسال رسائل واتساب مباشرة لعملائك من داخل لوحة التحكم.' : 'Send direct WhatsApp messages to your customers from inside the store dashboard.')}
              {subView === 'campaigns' && (isAr ? 'حركة الزوار المباشرة حسب القنوات، الطلبات، معدلات التحويل، والإيرادات' : 'Live channel traffic, orders, conversion rates, and revenue')}
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
            onClick={() => setIsGuideOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5 hover:bg-blue-500/20 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'دليل الاستخدام' : 'Docs & Guide'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. MARKETING TOOLS HUB (Screenshot 1: media_1790840219280.png)
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

            {/* Quick banner card */}
            <div
              onClick={() => setSubView('whatsapp')}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 cursor-pointer hover:bg-emerald-100/70 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                {isAr ? 'رسائل واتساب نشطة · تم استخدام 8 من 20 رسالة اليوم' : 'WhatsApp Messaging Active · 8 / 20 messages used today'}
              </span>
            </div>
          </div>

          {/* Grid of 10 Tool Cards from Screenshot 1 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={tool.action}
                  className="p-5 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group h-44"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mb-3 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
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
          2. ABANDONED CARTS (Screenshot 2: media_1790840243399.png)
      ───────────────────────────────────────────────────────────── */}
      {subView === 'abandoned' && (
        <div className="space-y-6">
          {/* 6 KPI Cards */}
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
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">1,248</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? '↑ 12% مقارنة بالسابق' : '↑ 12% vs prev'}
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
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">2,500</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? '↑ 18% مقارنة بالسابق' : '↑ 18% vs prev'}
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
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">68.4%</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? '↑ 6% مقارنة بالسابق' : '↑ 6% vs prev'}
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
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">320</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? '↑ 24% مقارنة بالسابق' : '↑ 24% vs prev'}
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
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{money(85400)}</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? '↑ 28% مقارنة بالسابق' : '↑ 28% vs prev'}
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
              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">25.6%</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? '↑ 6% مقارنة بالسابق' : '↑ 6% vs prev'}
              </div>
            </div>
          </div>

          {/* Performance & Setup Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 cols: Chart, Channel Performance table & Export */}
            <div className="lg:col-span-7 space-y-5">
              {/* Abandoned Cart Performance Dual Bar Chart (Screenshot 2) */}
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
                    <select className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                      <option>{isAr ? 'آخر 30 يوم' : 'Last 30 days'}</option>
                      <option>{isAr ? 'آخر 14 يوم' : 'Last 14 days'}</option>
                      <option>{isAr ? 'آخر 7 أيام' : 'Last 7 days'}</option>
                    </select>
                  </div>
                </div>

                {/* SVG Dual Bar Chart */}
                <div className="w-full h-44 pt-2">
                  <svg className="w-full h-full" viewBox="0 0 600 160">
                    {/* Y-axis grid lines */}
                    {[
                      { y: 20, val: '200' },
                      { y: 55, val: '150' },
                      { y: 90, val: '100' },
                      { y: 125, val: '50' },
                      { y: 155, val: '0' },
                    ].map((g) => (
                      <g key={g.val}>
                        <text x="5" y={g.y + 3} className="text-[10px] fill-slate-400" textAnchor="start">
                          {g.val}
                        </text>
                        <line x1="35" y1={g.y} x2="595" y2={g.y} stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" />
                      </g>
                    ))}

                    {/* Dual Bars across Sep 1 - Sep 30 */}
                    {[
                      { x: 50, a: 110, r: 35, d: isAr ? '1 سبت' : 'Sep 1' },
                      { x: 95, a: 80, r: 25, d: isAr ? '4 سبت' : 'Sep 4' },
                      { x: 140, a: 140, r: 45, d: isAr ? '7 سبت' : 'Sep 7' },
                      { x: 185, a: 95, r: 30, d: isAr ? '10 سبت' : 'Sep 10' },
                      { x: 230, a: 120, r: 40, d: isAr ? '13 سبت' : 'Sep 13' },
                      { x: 275, a: 135, r: 42, d: isAr ? '16 سبت' : 'Sep 16' },
                      { x: 320, a: 100, r: 28, d: isAr ? '19 سبت' : 'Sep 19' },
                      { x: 365, a: 115, r: 38, d: isAr ? '22 سبت' : 'Sep 22' },
                      { x: 410, a: 90, r: 32, d: isAr ? '25 سبت' : 'Sep 25' },
                      { x: 455, a: 105, r: 36, d: isAr ? '28 سبت' : 'Sep 28' },
                      { x: 500, a: 130, r: 44, d: isAr ? '30 سبت' : 'Sep 30' },
                    ].map((item, idx) => {
                      const hA = (item.a / 200) * 135;
                      const hR = (item.r / 200) * 135;
                      const yA = 155 - hA;
                      const yR = 155 - hR;
                      return (
                        <g key={idx}>
                          {/* Abandoned Bar (Blue) */}
                          <rect
                            x={item.x}
                            y={yA}
                            width="5"
                            height={hA}
                            rx="2"
                            fill="#3b82f6"
                            className="transition-all hover:opacity-80"
                          />
                          {/* Recovered Bar (Green) */}
                          <rect
                            x={item.x + 7}
                            y={yR}
                            width="5"
                            height={hR}
                            rx="2"
                            fill="#10b981"
                            className="transition-all hover:opacity-80"
                          />
                          {/* Date Label */}
                          <text
                            x={item.x + 6}
                            y="168"
                            className="text-[9px] fill-slate-400"
                            textAnchor="middle"
                          >
                            {item.d}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Channel Performance table */}
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
                        <td className="py-3 text-center tabular-nums">1,200</td>
                        <td className="py-3 text-center tabular-nums">850</td>
                        <td className="py-3 text-center font-bold text-emerald-600">70.8%</td>
                        <td className="py-3 text-center tabular-nums">180</td>
                        <td className="py-3 text-end font-black text-slate-900 dark:text-teal-300 tabular-nums">
                          {money(25000)}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-600" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {isAr ? 'رسائل SMS' : 'SMS'}
                          </span>
                        </td>
                        <td className="py-3 text-center tabular-nums">800</td>
                        <td className="py-3 text-center tabular-nums">420</td>
                        <td className="py-3 text-center font-bold text-purple-600">52.5%</td>
                        <td className="py-3 text-center tabular-nums">90</td>
                        <td className="py-3 text-end font-black text-slate-900 dark:text-teal-300 tabular-nums">
                          {money(12000)}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {isAr ? 'البريد الإلكتروني' : 'Email'}
                          </span>
                        </td>
                        <td className="py-3 text-center tabular-nums">500</td>
                        <td className="py-3 text-center tabular-nums">250</td>
                        <td className="py-3 text-center font-bold text-blue-600">50.0%</td>
                        <td className="py-3 text-center tabular-nums">50</td>
                        <td className="py-3 text-end font-black text-slate-900 dark:text-teal-300 tabular-nums">
                          {money(8000)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 font-black">
                        <td className="py-3 text-slate-900 dark:text-white">{isAr ? 'الإجمالي' : 'Total'}</td>
                        <td className="py-3 text-center tabular-nums">2,500</td>
                        <td className="py-3 text-center tabular-nums">1,520</td>
                        <td className="py-3 text-center text-teal-600">60.8%</td>
                        <td className="py-3 text-center tabular-nums">320</td>
                        <td className="py-3 text-end text-slate-900 dark:text-teal-300 tabular-nums">
                          {money(85400)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export Abandoned Carts */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {isAr ? 'تصدير السلات المتروكة' : 'Export Abandoned Carts'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isAr
                        ? 'تصدير بيانات السلات المتروكة للعملاء للمتابعة التسويقية المخصصة.'
                        : 'Export abandoned customer cart data for custom marketing follow-up.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast(isAr ? 'جاري تصدير جهات اتصال السلات المتروكة (.XLSX)...' : 'Exporting abandoned cart contacts (.XLSX)...', 'success')}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تصدير البيانات' : 'Export Data'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-teal-600" />
                    <span>{isAr ? 'بيانات العميل' : 'Customer Information'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-teal-600" />
                    <span>{isAr ? 'المنتجات في السلة' : 'Products in Cart'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-teal-600" />
                    <span>{isAr ? 'قيمة السلة' : 'Cart Value'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-teal-600" />
                    <span>{isAr ? 'حالة السلة' : 'Cart Status'}</span>
                  </label>
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
                      setTestSent(true);
                      toast(isAr ? 'تم إرسال رسالة تجريبية لهاتف مدير المتجر!' : 'Test reminder sent to store manager phone!', 'success');
                      setTimeout(() => setTestSent(false), 2500);
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
                      <Flower2 className="w-4 h-4 text-white" />
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
                      .replace('{name}', isAr ? 'أحمد' : 'Ahmed')
                      .replace('{cart_value}', '420 SAR')
                      .replace('{checkout_link}', 'https://makkah-flowers.saudi-stores.com/checkout')
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
          3. CREATE NEW OFFER WIZARD (Screenshot 4: media_1790840284499.png)
      ───────────────────────────────────────────────────────────── */}
      {subView === 'offers' && (
        <div className="space-y-6">
          {/* Stepper matching Screenshot 4 */}
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
                      desc: isAr ? 'اشتر منتجاً واحصل على آخر مجاناً أو بخصم.' : 'Buy a product and get another free or discounted.',
                      icon: Tag,
                    },
                    {
                      id: 'Product Discount',
                      title: isAr ? 'خصم على المنتجات' : 'Product Discount',
                      desc: isAr ? 'تطبيق نسبة مئوية أو مبلغ ثابت على المنتجات.' : 'Apply percentage or fixed amount on products.',
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
                      desc: isAr ? 'خصم يعتمد على قيمة السلة أو إجمالي المنتجات.' : 'Discount based on cart value or product quantity.',
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
                      <span>{isAr ? 'خصم بنسبة مئوية (مثال: خصم 50% على العنصر الثاني)' : 'Percentage discount (e.g. 50% off second item)'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Purchase vs Reward Products Dual List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Required Purchase Products */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {isAr ? 'منتجات الشراء المطلوبة' : 'Required Purchase Products'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {isAr ? 'حدد المنتجات أو التصنيفات التي يجب على العميل شراؤها.' : 'Select the products or categories that customers must purchase.'}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked readOnly className="text-teal-600" />
                        <span>{isAr ? 'منتجات محددة' : 'Specific products'}</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-400">
                        <input type="radio" disabled />
                        <span>{isAr ? 'تصنيفات محددة' : 'Specific categories'}</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder={isAr ? 'البحث عن منتجات...' : 'Search for products...'}
                          className="w-full ps-8 pe-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => toast(isAr ? 'تم فتح كتالوج المنتجات' : 'Product catalog opened', 'info')}
                        className="px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إضافة منتجات' : 'Add Products'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Products List matching real floral catalog */}
                  <div className="space-y-2 pt-1">
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">
                          <Flower2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                            {isAr ? 'صندوق الورود الحمراء الملكي المخملي' : 'Royal Red Roses Velvet Box'}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">SKU: RR-001</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <span>{isAr ? 'الكمية المطلوبة' : 'Required Quantity'}</span>
                          <select className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold">
                            <option>2</option>
                            <option>1</option>
                            <option>3</option>
                          </select>
                        </div>
                        <button type="button" className="text-slate-400 hover:text-slate-600 cursor-pointer">×</button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400 flex items-center justify-center text-xs font-bold shrink-0">
                          <Flower2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                            {isAr ? 'باقة زنابق كازابلانكا البيضاء' : 'Casablanca White Lily Bouquet'}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">SKU: WL-002</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <span>{isAr ? 'الكمية المطلوبة' : 'Required Quantity'}</span>
                          <select className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold">
                            <option>2</option>
                            <option>1</option>
                            <option>3</option>
                          </select>
                        </div>
                        <button type="button" className="text-slate-400 hover:text-slate-600 cursor-pointer">×</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Reward Products */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {isAr ? 'منتجات مكافأة العميل' : 'Customer Reward Products'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {isAr ? 'حدد المنتجات المجانية أو المخفضة التي سيحصل عليها العميل.' : 'Select the free or discounted products that customers will receive.'}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked readOnly className="text-teal-600" />
                        <span>{isAr ? 'منتجات محددة' : 'Specific products'}</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-400">
                        <input type="radio" disabled />
                        <span>{isAr ? 'تصنيفات محددة' : 'Specific categories'}</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder={isAr ? 'البحث عن منتجات...' : 'Search for products...'}
                          className="w-full ps-8 pe-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => toast(isAr ? 'تم فتح كتالوج المكافآت' : 'Reward catalog opened', 'info')}
                        className="px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إضافة منتجات' : 'Add Products'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Reward Product item matching floral catalog */}
                  <div className="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {isAr ? 'فازة كريستال سيراميك فاخرة' : 'Crystal Floral Ceramic Vase'}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                            {isAr ? 'مجاني' : 'Free'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">SKU: CV-001</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <span>{isAr ? 'كمية المكافأة' : 'Reward Quantity'}</span>
                        <select className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold">
                          <option>1</option>
                          <option>2</option>
                        </select>
                      </div>
                      <button type="button" className="text-slate-400 hover:text-slate-600 cursor-pointer">×</button>
                    </div>
                  </div>
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
                    toast(isAr ? 'تم نشر العرض الترويجي وأصبح متاحاً بالمتجر!' : 'Promotional offer published and live on storefront!', 'success');
                    setSubView('hub');
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <span>{isAr ? 'الخطوة التالية ←' : 'Next Step →'}</span>
                </button>
              </div>
            </div>

            {/* Right 4 cols: Offer Summary & Example Breakdown */}
            <div className="lg:col-span-4 space-y-5">
              {/* Offer Summary */}
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
                      {rewardType === 'free' ? (isAr ? 'منتج مجاني' : 'Free product') : (isAr ? 'خصم مئوي' : 'Percentage discount')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-400">
                    <span>{isAr ? 'منتجات الشراء' : 'Purchase Products'}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isAr ? `منتج 1 (الكمية: ${reqQty})` : `1 product (Qty: ${reqQty})`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-400">
                    <span>{isAr ? 'منتجات المكافأة' : 'Reward Products'}</span>
                    <span className="font-bold text-emerald-600">
                      {isAr ? `هدية 1 (الكمية: ${rewardQty})` : `1 gift (Qty: ${rewardQty})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Example: How it works */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'مثال (كيف يعمل العرض)' : 'Example (How it works)'}
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Flower2 className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {isAr ? `باقة فاخرة (${reqQty} × 299 ر.س)` : `Luxury Bouquet (${reqQty} x 299 SAR)`}
                      </span>
                    </div>
                    <span className="font-bold tabular-nums">{money(reqQty * 299)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">
                        {isAr ? 'فازة سيراميك صناعة يدوية' : 'Handmade Ceramic Vase'}
                      </span>
                    </div>
                    <span className="font-black">
                      {isAr ? 'مجاناً (0 ر.س)' : 'FREE (0 SAR)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-black text-sm">
                    <span>{isAr ? 'إجمالي الدفع:' : 'Total Checkout:'}</span>
                    <span className="text-teal-700 dark:text-teal-300">{money(reqQty * 299)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. WHATSAPP MESSAGES HUB (Screenshot 5: media_1790840365376.jpg)
      ───────────────────────────────────────────────────────────── */}
      {subView === 'whatsapp' && (
        <div className="space-y-6">
          {/* Top Status Cards matching Screenshot 5 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Daily Usage circular gauge */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-5">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="201"
                    strokeDashoffset={201 - (8 / 20) * 201}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-900 dark:text-white">8/20</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">
                  {isAr ? 'الاستخدام اليومي' : 'Daily Usage'}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? '8 من 20 رسالة' : '8 of 20 Messages'}
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
                    +966 50 123 4567
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isAr ? 'واجهة Meta Cloud Business API' : 'Meta Cloud Business API'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast(isAr ? 'جاري إعادة مزامنة جلسة Meta Cloud...' : 'Re-syncing Meta WhatsApp Cloud session...', 'info')}
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
                {isAr ? `عرض ${waLogs.length} رسائل معاملات مباشرة` : `Showing ${waLogs.length} live transaction messages`}
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
                  {waLogs.map((log) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Templates & Send Composer Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 6 cols: Message Templates */}
            <div className="lg:col-span-6 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'قوالب الرسائل' : 'Message Templates'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'اختر قالباً معتمداً للإرسال بنقرة واحدة للمتسوقين.'
                  : 'Pick a pre-approved template for 1-click dispatch to shoppers.'}
              </p>

              <div className="space-y-2.5">
                {waTemplates.map((tpl) => (
                  <div
                    key={tpl.title}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                  >
                    <div>
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
                        <option key={c.id} value={`${c.name} (${c.phone || '+966 50 123 4567'})`}>
                          {c.name} ({c.phone || '+966 50 123 4567'}) {c.city ? `- ${c.city}` : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Sarah Al-Otaibi (+966 50 882 1920)">Sarah Al-Otaibi (سارة العتيبي) - +966 50 882 1920</option>
                        <option value="Eng. Mohammed Al-Harbi (+966 55 987 6543)">Eng. Mohammed Al-Harbi (م. محمد الحربي) - +966 55 987 6543</option>
                        <option value="Abdulrahman Al-Thaqafi (+966 53 111 2222)">Abdulrahman Al-Thaqafi (عبدالرحمن الثقفي) - +966 53 111 2222</option>
                        <option value="Ahmed Ali (+966 50 123 4567)">Ahmed Ali - +966 50 123 4567</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Media Attachment Upload with Live Preview */}
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
                            toast(isAr ? 'تم إرفاق الوسائط بنجاح' : 'Media file attached', 'success');
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
                    placeholder={isAr ? 'اكتب رسالة الواتساب هنا أو اختر قالباً...' : 'Type your WhatsApp message here or choose a template...'}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{waMessage.length}/1000 {isAr ? 'حرف' : 'characters'}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWaMessage((m) => m + ' {{customer_name}}')}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        + customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setWaMessage((m) => m + ' {{store_name}}')}
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
          5. MARKETING CAMPAIGNS & CHANNELS
      ───────────────────────────────────────────────────────────── */}
      {subView === 'campaigns' && <StoreChannelPerformance />}

      {/* Docs Guide Modal */}
      <PageDocsGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        pageId={subView === 'whatsapp' ? 'whatsapp' : 'marketing'}
      />
    </div>
  );
};
