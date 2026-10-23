import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Order } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  CreditCard,
  Banknote,
  RotateCcw,
  Check,
  X,
  ChevronDown,
  Globe,
  Store,
  Layers,
  MessageCircle,
  Instagram,
  Facebook,
  Music2,
  Ghost,
  Mail,
  Building2,
  Share2,
  Smartphone,
} from 'lucide-react';
import { statusChipStyle } from '../../utils/liveSeries';

const OrderDetailsModal = React.lazy(() =>
  import('./orders/OrderDetailsModal').then((m) => ({ default: m.OrderDetailsModal })),
);

interface DashboardOrdersTableProps {
  orders: Order[];
  onNavigateTab: (tab: string) => void;
  className?: string;
  onOpenCreateOrder?: () => void;
}

const PAGE_SIZE = 5;

type SortKey = 'date_desc' | 'date_asc' | 'total_desc' | 'total_asc' | 'id_desc' | 'id_asc';

// ── Status Options ──
interface StatusItem {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: (cls?: string) => React.ReactNode;
}

const STATUS_ITEMS: StatusItem[] = [
  { id: 'all', labelEn: 'All Statuses', labelAr: 'كافة الحالات', icon: (c) => <Layers className={c || "w-3.5 h-3.5 text-slate-400"} /> },
  { id: 'completed', labelEn: 'Completed', labelAr: 'مكتمل', icon: (c) => <CheckCircle2 className={c || "w-3.5 h-3.5 text-emerald-500"} /> },
  { id: 'pending', labelEn: 'Pending', labelAr: 'قيد الانتظار', icon: (c) => <Clock className={c || "w-3.5 h-3.5 text-amber-500"} /> },
  { id: 'processing', labelEn: 'Processing', labelAr: 'جاري التجهيز', icon: (c) => <Package className={c || "w-3.5 h-3.5 text-blue-500"} /> },
  { id: 'shipped', labelEn: 'Shipped', labelAr: 'تم الشحن', icon: (c) => <Truck className={c || "w-3.5 h-3.5 text-purple-500"} /> },
  { id: 'delivered', labelEn: 'Delivered', labelAr: 'تم التوصيل', icon: (c) => <CheckCircle2 className={c || "w-3.5 h-3.5 text-teal-500"} /> },
  { id: 'cancelled', labelEn: 'Cancelled', labelAr: 'ملغي', icon: (c) => <XCircle className={c || "w-3.5 h-3.5 text-rose-500"} /> },
];

// ── Payment Categories & Methods (Matching Page 2 & 3 Specification) ──
interface PaymentMethodItem {
  id: string;
  labelEn: string;
  labelAr: string;
  badge: (isAr: boolean) => React.ReactNode;
}

interface PaymentCategoryGroup {
  groupNum: number;
  titleEn: string;
  titleAr: string;
  items: PaymentMethodItem[];
}

const PAYMENT_CATEGORIES: PaymentCategoryGroup[] = [
  {
    groupNum: 1,
    titleEn: '1. Bank Cards and Electronic Payments',
    titleAr: '١. البطاقات البنكية والدفع الإلكتروني',
    items: [
      {
        id: 'mada',
        labelEn: 'Mada',
        labelAr: 'مدى',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#008453] text-white text-[9px] font-black shrink-0 tracking-tight">
            mada
          </span>
        ),
      },
      {
        id: 'visa',
        labelEn: 'Visa',
        labelAr: 'فيزا',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#1A1F71] text-white text-[9px] font-black shrink-0 italic tracking-wider">
            VISA
          </span>
        ),
      },
      {
        id: 'mastercard',
        labelEn: 'Mastercard',
        labelAr: 'ماستركارد',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#EB001B] text-white text-[9px] font-black shrink-0 tracking-tight">
            MC
          </span>
        ),
      },
      {
        id: 'apple',
        labelEn: 'Apple Pay',
        labelAr: 'أبل باي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-slate-950 dark:bg-slate-800 text-white text-[9px] font-bold shrink-0 tracking-tight">
            Pay
          </span>
        ),
      },
    ],
  },
  {
    groupNum: 2,
    titleEn: '2. Digital Wallets',
    titleAr: '٢. المحافظ الرقمية',
    items: [
      {
        id: 'stc',
        labelEn: 'STC Pay',
        labelAr: 'اس تي سي باي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#4F008C] text-white text-[9px] font-black shrink-0 tracking-tight">
            stc
          </span>
        ),
      },
      {
        id: 'paypal',
        labelEn: 'PayPal',
        labelAr: 'باي بال',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#003087] text-white text-[9px] font-black shrink-0 tracking-tight">
            PayPal
          </span>
        ),
      },
      {
        id: 'googlepay',
        labelEn: 'Google Pay',
        labelAr: 'جوجل باي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-slate-900 dark:bg-slate-700 text-white text-[9px] font-black shrink-0 tracking-tight">
            GPay
          </span>
        ),
      },
    ],
  },
  {
    groupNum: 3,
    titleEn: '3. Buy Now, Pay Later (BNPL) & Installments',
    titleAr: '٣. اشترِ الآن وادفع لاحقاً والتقسيط',
    items: [
      {
        id: 'tabby',
        labelEn: 'Tabby',
        labelAr: 'تابي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#3EFE97] text-slate-950 text-[9px] font-black shrink-0 tracking-tight">
            Tabby
          </span>
        ),
      },
      {
        id: 'tamara',
        labelEn: 'Tamara',
        labelAr: 'تمارا',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#F7A738] text-slate-950 text-[9px] font-black shrink-0 tracking-tight">
            Tamara
          </span>
        ),
      },
      {
        id: 'mispay',
        labelEn: 'Mispay',
        labelAr: 'مسباي',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#6366F1] text-white text-[9px] font-black shrink-0 tracking-tight">
            Mispay
          </span>
        ),
      },
      {
        id: 'madfooat',
        labelEn: 'Madfooat',
        labelAr: 'مدفوعات',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#06B6D4] text-white text-[9px] font-black shrink-0 tracking-tight">
            Madfooat
          </span>
        ),
      },
      {
        id: 'emkan',
        labelEn: 'Emkan',
        labelAr: 'إمكان',
        badge: () => (
          <span className="px-1.5 py-0.5 rounded-xs bg-[#8B5CF6] text-white text-[9px] font-black shrink-0 tracking-tight">
            Emkan
          </span>
        ),
      },
    ],
  },
  {
    groupNum: 4,
    titleEn: '4. Other Payment Methods',
    titleAr: '٤. طرق دفع أخرى',
    items: [
      {
        id: 'bank',
        labelEn: 'Bank Transfer',
        labelAr: 'تحويل بنكي',
        badge: () => <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
      },
      {
        id: 'cash',
        labelEn: 'Cash on Delivery (COD)',
        labelAr: 'الدفع عند الاستلام',
        badge: () => <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      },
    ],
  },
];

// Flat list of all payment items for quick lookup
const ALL_PAYMENT_ITEMS = PAYMENT_CATEGORIES.flatMap((c) => c.items);

// ── Sales Channels (100% Match to Image 1 Right & Specifications) ──
interface ChannelItem {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: React.ReactNode;
}

const SALES_CHANNEL_ITEMS: ChannelItem[] = [
  {
    id: 'instagram',
    labelEn: 'Instagram',
    labelAr: 'انستغرام',
    icon: (
      <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
        <Instagram className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'google',
    labelEn: 'Google Ads',
    labelAr: 'إعلانات جوجل',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#1A73E8] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <Share2 className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'direct',
    labelEn: 'Direct Visits',
    labelAr: 'زيارات مباشرة',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#0D9488] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <Globe className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'tiktok',
    labelEn: 'TikTok',
    labelAr: 'تيك توك',
    icon: (
      <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-black flex items-center justify-center text-white shrink-0 shadow-2xs border border-slate-700">
        <Music2 className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'snapchat',
    labelEn: 'Snapchat',
    labelAr: 'سناب شات',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#FFFC00] flex items-center justify-center text-slate-950 shrink-0 shadow-2xs border border-amber-300">
        <Ghost className="w-3 h-3 text-slate-950 fill-current" />
      </span>
    ),
  },
  {
    id: 'whatsapp',
    labelEn: 'WhatsApp',
    labelAr: 'واتساب',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <MessageCircle className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'facebook',
    labelEn: 'Facebook',
    labelAr: 'فيسبوك',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <Facebook className="w-3 h-3 text-white" />
      </span>
    ),
  },
  {
    id: 'x',
    labelEn: 'X (formerly Twitter)',
    labelAr: 'إكس (تويتر سابقاً)',
    icon: (
      <span className="w-5 h-5 rounded-full bg-slate-950 dark:bg-slate-800 flex items-center justify-center text-white shrink-0 shadow-2xs font-black text-[10px]">
        𝕏
      </span>
    ),
  },
  {
    id: 'youtube',
    labelEn: 'YouTube',
    labelAr: 'يوتيوب',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#FF0000] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
          <path d="M10 15l5-3-5-3v6z" />
          <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19 26.27 26.27 0 0 0 2 12a26.27 26.27 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77c.28-1.56.42-3.18.42-4.81s-.14-3.25-.42-4.81z" />
        </svg>
      </span>
    ),
  },
  {
    id: 'email',
    labelEn: 'Email Marketing',
    labelAr: 'البريد الإلكتروني',
    icon: (
      <span className="w-5 h-5 rounded-full bg-[#EA4335] flex items-center justify-center text-white shrink-0 shadow-2xs">
        <Mail className="w-3 h-3 text-white" />
      </span>
    ),
  },
];

export const DashboardOrdersTable: React.FC<DashboardOrdersTableProps> = React.memo(({
  orders,
  onNavigateTab,
  className = '',
  onOpenCreateOrder,
}) => {
  const { money, locale, dir } = usePrefs();
  const isAr = locale === 'ar';
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Popover menus state
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<'status' | 'payment' | 'channel' | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
        setActiveSubMenu(null);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Selected filter helpers for active labels & icons
  const selectedStatusItem = useMemo(
    () => STATUS_ITEMS.find((s) => s.id === statusFilter) || STATUS_ITEMS[0],
    [statusFilter]
  );
  const selectedPaymentItem = useMemo(
    () => ALL_PAYMENT_ITEMS.find((p) => p.id === paymentFilter) || null,
    [paymentFilter]
  );
  const selectedChannelItem = useMemo(
    () => SALES_CHANNEL_ITEMS.find((c) => c.id === channelFilter) || null,
    [channelFilter]
  );

  // Filtered & Sorted orders
  const processedOrders = useMemo(() => {
    let list = orders.filter((ord) => !ord.isArchived);

    // 1. Search Query (order number, customer name, phone, email, payment, channel, items)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((ord) => {
        const orderNum = (ord.orderNumber || ord.id || '').toLowerCase();
        const custName = (ord.customerName || '').toLowerCase();
        const custPhone = (ord.customerPhone || '').toLowerCase();
        const custEmail = (ord.customerEmail || '').toLowerCase();
        const payment = (ord.paymentMethod || '').toLowerCase();
        const source = (ord.source || '').toLowerCase();
        const itemNames = (ord.items || []).map((it) => it.name.toLowerCase()).join(' ');
        return (
          orderNum.includes(q) ||
          custName.includes(q) ||
          custPhone.includes(q) ||
          custEmail.includes(q) ||
          payment.includes(q) ||
          source.includes(q) ||
          itemNames.includes(q)
        );
      });
    }

    // 2. Status filter
    if (statusFilter !== 'all') {
      list = list.filter((ord) => (ord.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    // 3. Payment filter (Matches all 14 payment methods in English & Arabic)
    if (paymentFilter !== 'all') {
      list = list.filter((ord) => {
        const pm = (ord.paymentMethod || '').toLowerCase();
        switch (paymentFilter) {
          case 'mada':
            return pm.includes('mada') || pm.includes('مدى');
          case 'visa':
            return pm.includes('visa') || pm.includes('فيزا');
          case 'mastercard':
            return pm.includes('master') || pm.includes('ماستر');
          case 'apple':
            return pm.includes('apple') || pm.includes('أبل') || pm.includes('ابل');
          case 'stc':
            return pm.includes('stc') || pm.includes('اس تي سي');
          case 'paypal':
            return pm.includes('paypal') || pm.includes('باي بال');
          case 'googlepay':
            return pm.includes('google') || pm.includes('جوجل') || pm.includes('gpay');
          case 'tabby':
            return pm.includes('tabby') || pm.includes('تابي');
          case 'tamara':
            return pm.includes('tamara') || pm.includes('تمارا');
          case 'mispay':
            return pm.includes('mispay') || pm.includes('مسباي');
          case 'madfooat':
            return pm.includes('madfooat') || pm.includes('مدفوعات');
          case 'emkan':
            return pm.includes('emkan') || pm.includes('إمكان') || pm.includes('امكان');
          case 'bank':
            return pm.includes('bank') || pm.includes('تحويل') || pm.includes('transfer');
          case 'cash':
            return pm.includes('cash') || pm.includes('cod') || pm.includes('استلام');
          default:
            return pm.includes(paymentFilter.toLowerCase());
        }
      });
    }

    // 4. Channel filter (Matches all 10 marketing & sales channels)
    if (channelFilter !== 'all') {
      list = list.filter((ord) => {
        const src = (ord.source || 'Storefront').toLowerCase();
        switch (channelFilter) {
          case 'instagram':
            return src.includes('instagram') || src.includes('انستغرام') || src.includes('انستقرام');
          case 'google':
            return src.includes('google') || src.includes('ads') || src.includes('جوجل') || src.includes('إعلان');
          case 'direct':
            return src.includes('direct') || src.includes('مباشر') || src.includes('website') || src.includes('storefront') || src.includes('متجر');
          case 'tiktok':
            return src.includes('tiktok') || src.includes('تيك');
          case 'snapchat':
            return src.includes('snapchat') || src.includes('سناب');
          case 'whatsapp':
            return src.includes('whatsapp') || src.includes('واتساب') || src.includes('واتس');
          case 'facebook':
            return src.includes('facebook') || src.includes('فيسبوك');
          case 'x':
            return src.includes('twitter') || src.includes('تويتر') || src.includes('إكس') || src.includes('اكس') || src === 'x';
          case 'youtube':
            return src.includes('youtube') || src.includes('يوتيوب');
          case 'email':
            return src.includes('email') || src.includes('mail') || src.includes('بريد');
          default:
            return src.includes(channelFilter.toLowerCase());
        }
      });
    }

    // 5. Sorting
    list.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      const totalA = Number(a.total) || 0;
      const totalB = Number(b.total) || 0;
      const idA = String(a.orderNumber || a.id);
      const idB = String(b.orderNumber || b.id);

      switch (sortKey) {
        case 'date_asc':
          return dateA - dateB;
        case 'total_desc':
          return totalB - totalA;
        case 'total_asc':
          return totalA - totalB;
        case 'id_desc':
          return idB.localeCompare(idA);
        case 'id_asc':
          return idA.localeCompare(idB);
        case 'date_desc':
        default:
          return dateB - dateA;
      }
    });

    return list;
  }, [orders, searchQuery, statusFilter, paymentFilter, channelFilter, sortKey]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentFilter, channelFilter, sortKey]);

  // Total pages
  const totalCount = processedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const validPage = Math.min(currentPage, totalPages);

  // Paginated slice
  const paginatedOrders = useMemo(() => {
    const start = (validPage - 1) * PAGE_SIZE;
    return processedOrders.slice(start, start + PAGE_SIZE);
  }, [processedOrders, validPage]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    channelFilter !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setChannelFilter('all');
    setSortKey('date_desc');
    setActiveSubMenu(null);
  };

  const getStatusIcon = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'delivered') return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
    if (s === 'pending') return <Clock className="w-3.5 h-3.5 shrink-0" />;
    if (s === 'shipped' || s === 'processing') return <Truck className="w-3.5 h-3.5 shrink-0" />;
    if (s === 'cancelled') return <XCircle className="w-3.5 h-3.5 shrink-0" />;
    return <Package className="w-3.5 h-3.5 shrink-0" />;
  };

  const getLocalizedStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    if (isAr) {
      if (s === 'completed') return 'مكتمل';
      if (s === 'pending') return 'قيد الانتظار';
      if (s === 'processing') return 'جاري التجهيز';
      if (s === 'shipped') return 'تم الشحن';
      if (s === 'delivered') return 'تم التوصيل';
      if (s === 'cancelled') return 'ملغي';
      return status;
    }
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
  };

  const getChannelBadge = (source?: string) => {
    const src = (source || 'Storefront').toLowerCase();
    if (src.includes('instagram') || src.includes('انستغرام')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-600/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
          <Instagram className="w-2.5 h-2.5" />
          {isAr ? 'انستغرام' : 'Instagram'}
        </span>
      );
    }
    if (src.includes('google') || src.includes('جوجل')) {
      const isAds = src.includes('ads') || src.includes('إعلان');
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
          <Search className="w-2.5 h-2.5" />
          {isAds ? (isAr ? 'إعلانات جوجل' : 'Google Ads') : (isAr ? 'بحث جوجل' : 'Google Organic')}
        </span>
      );
    }
    if (src.includes('tiktok') || src.includes('تيك')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900 text-white dark:bg-slate-800 border border-slate-700">
          <Music2 className="w-2.5 h-2.5" />
          {isAr ? 'تيك توك' : 'TikTok'}
        </span>
      );
    }
    if (src.includes('snapchat') || src.includes('سناب')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
          <Ghost className="w-2.5 h-2.5" />
          {isAr ? 'سناب شات' : 'Snapchat'}
        </span>
      );
    }
    if (src.includes('whatsapp') || src.includes('واتساب')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
          <MessageCircle className="w-2.5 h-2.5" />
          {isAr ? 'واتساب' : 'WhatsApp'}
        </span>
      );
    }
    if (src.includes('facebook') || src.includes('فيسبوك')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
          <Facebook className="w-2.5 h-2.5" />
          {isAr ? 'فيسبوك' : 'Facebook'}
        </span>
      );
    }
    if (src.includes('twitter') || src.includes('تويتر') || src.includes('x') || src.includes('إكس')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900 text-white dark:bg-slate-800 border border-slate-700">
          <span className="font-bold text-[10px]">𝕏</span>
          {isAr ? 'إكس (تويتر سابقاً)' : 'X (formerly Twitter)'}
        </span>
      );
    }
    if (src.includes('youtube') || src.includes('يوتيوب')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800/40">
          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
            <path d="M10 15l5-3-5-3v6z" />
            <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19 26.27 26.27 0 0 0 2 12a26.27 26.27 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77c.28-1.56.42-3.18.42-4.81s-.14-3.25-.42-4.81z" />
          </svg>
          {isAr ? 'يوتيوب' : 'YouTube'}
        </span>
      );
    }
    if (src.includes('direct') || src.includes('مباشر')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40">
          <Globe className="w-2.5 h-2.5" />
          {isAr ? 'زيارات مباشرة' : 'Direct Visits'}
        </span>
      );
    }
    if (src.includes('email') || src.includes('بريد')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40">
          <Mail className="w-2.5 h-2.5" />
          {isAr ? 'البريد الإلكتروني' : 'Email Marketing'}
        </span>
      );
    }
    if (src.includes('salla') || src.includes('سلة')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
          {isAr ? 'سلة' : 'Salla'}
        </span>
      );
    }
    if (src.includes('woo') || src.includes('ووكومرس')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
          {isAr ? 'ووكومرس' : 'WooCommerce'}
        </span>
      );
    }
    if (src.includes('app') || src.includes('تطبيق') || src.includes('mobile')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
          <Smartphone className="w-2.5 h-2.5" />
          {isAr ? 'تطبيق الجوال' : 'Mobile App'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <Store className="w-2.5 h-2.5" />
        {isAr ? 'المتجر الإلكتروني' : 'Online Store'}
      </span>
    );
  };

  const getPaymentBadge = (method?: string) => {
    const pm = (method || 'Online').toLowerCase();
    if (pm.includes('cash') || pm.includes('استلام') || pm.includes('cod')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-xs truncate">{isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</span>
        </div>
      );
    }
    if (pm.includes('apple')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <CreditCard className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0" />
          <span className="text-xs truncate">Apple Pay</span>
        </div>
      );
    }
    if (pm.includes('mada') || pm.includes('مدى')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="w-4 h-3 rounded-xs bg-emerald-600 text-white text-[8px] font-black flex items-center justify-center shrink-0">M</span>
          <span className="text-xs truncate">{isAr ? 'مدى' : 'Mada'}</span>
        </div>
      );
    }
    if (pm.includes('mastercard') || pm.includes('ماستركارد')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="w-4 h-3 rounded-xs bg-orange-600 text-white text-[8px] font-black flex items-center justify-center shrink-0">MC</span>
          <span className="text-xs truncate">{isAr ? 'ماستركارد' : 'Mastercard'}</span>
        </div>
      );
    }
    if (pm.includes('visa') || pm.includes('فيزا')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-xs truncate">{isAr ? 'فيزا' : 'Visa'}</span>
        </div>
      );
    }
    if (pm.includes('stc') || pm.includes('اس تي سي')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="px-1.5 py-0.5 rounded-xs bg-[#4F008C] text-white text-[9px] font-black shrink-0 tracking-tight">stc</span>
          <span className="text-xs truncate">{isAr ? 'اس تي سي باي' : 'STC Pay'}</span>
        </div>
      );
    }
    if (pm.includes('paypal') || pm.includes('باي بال')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="px-1.5 py-0.5 rounded-xs bg-[#003087] text-white text-[9px] font-black shrink-0 tracking-tight">PayPal</span>
          <span className="text-xs truncate">{isAr ? 'باي بال' : 'PayPal'}</span>
        </div>
      );
    }
    if (pm.includes('google') || pm.includes('جوجل') || pm.includes('gpay')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="px-1.5 py-0.5 rounded-xs bg-slate-900 dark:bg-slate-700 text-white text-[9px] font-black shrink-0 tracking-tight">GPay</span>
          <span className="text-xs truncate">{isAr ? 'جوجل باي' : 'Google Pay'}</span>
        </div>
      );
    }
    if (pm.includes('tamara') || pm.includes('تمارا')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="px-1.5 py-0.5 rounded-xs bg-[#F7A738] text-slate-950 text-[9px] font-black shrink-0 tracking-tight">Tamara</span>
          <span className="text-xs truncate">{isAr ? 'تمارا' : 'Tamara'}</span>
        </div>
      );
    }
    if (pm.includes('tabby') || pm.includes('تابي')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="px-1.5 py-0.5 rounded-xs bg-[#3EFE97] text-slate-950 text-[9px] font-black shrink-0 tracking-tight">Tabby</span>
          <span className="text-xs truncate">{isAr ? 'تابي' : 'Tabby'}</span>
        </div>
      );
    }
    if (pm.includes('mispay') || pm.includes('مسباي')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="px-1.5 py-0.5 rounded-xs bg-[#6366F1] text-white text-[9px] font-black shrink-0 tracking-tight">Mispay</span>
          <span className="text-xs truncate">{isAr ? 'مسباي' : 'Mispay'}</span>
        </div>
      );
    }
    if (pm.includes('madfooat') || pm.includes('مدفوعات')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="px-1.5 py-0.5 rounded-xs bg-[#06B6D4] text-white text-[9px] font-black shrink-0 tracking-tight">Madfooat</span>
          <span className="text-xs truncate">{isAr ? 'مدفوعات' : 'Madfooat'}</span>
        </div>
      );
    }
    if (pm.includes('emkan') || pm.includes('إمكان')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <span className="px-1.5 py-0.5 rounded-xs bg-[#8B5CF6] text-white text-[9px] font-black shrink-0 tracking-tight">Emkan</span>
          <span className="text-xs truncate">{isAr ? 'إمكان' : 'Emkan'}</span>
        </div>
      );
    }
    if (pm.includes('bank') || pm.includes('تحويل')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="text-xs truncate">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
        <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span className="text-xs truncate">{method || (isAr ? 'بطاقة بنكية' : 'Credit Card')}</span>
      </div>
    );
  };

  const startRange = totalCount === 0 ? 0 : (validPage - 1) * PAGE_SIZE + 1;
  const endRange = Math.min(validPage * PAGE_SIZE, totalCount);

  return (
    <div
      className={`u-panel rounded-2xl shadow-xs border transition-all duration-200 overflow-hidden ${className}`}
      data-panel="dashboard-orders-table"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* ── Top Header Toolbar (Exact Match to Image 1) ── */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-4 sm:p-5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Title side (Right in RTL, Left in LTR) */}
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40">
            <ShoppingCart className="w-4 h-4" />
          </span>
          <h3 className="font-extrabold text-base sm:text-lg tracking-tight" style={{ color: 'var(--text)' }}>
            {isAr ? 'أحدث الطلبات' : 'Recent Orders'}
          </h3>
        </div>

        {/* Controls Toolbar (Search, Filter, Sort, Add Order Action) */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Search Box */}
          <div className="relative min-w-[160px] sm:min-w-[200px] flex-1 sm:flex-initial">
            <Search
              className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              aria-hidden
            />
            <input
              type="text"
              placeholder={isAr ? 'بحث في الطلبات...' : 'Search in orders...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-8 pe-3 py-1.5 text-xs rounded-xl border outline-none transition-all focus:border-teal-500"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--input-fg)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Button & Popover */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setShowFilterMenu((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                hasActiveFilters
                  ? 'border-teal-500 text-teal-700 bg-teal-50/70 dark:bg-teal-950/40 dark:text-teal-300'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              style={!hasActiveFilters ? { borderColor: 'var(--border)', color: 'var(--text)' } : undefined}
            >
              <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'تصفية' : 'Filter'}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
              )}
            </button>

            {showFilterMenu && (
              <div
                className="absolute end-0 mt-2 w-72 sm:w-80 p-3.5 sm:p-4 rounded-2xl border shadow-2xl z-50 text-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {isAr ? 'تصفية الطلبات' : 'Filter Orders'}
                  </span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
                    </button>
                  )}
                </div>

                {/* 1. Status Dropdown */}
                <div className="relative">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveSubMenu((prev) => (prev === 'status' ? null : 'status'))}
                    className="w-full px-3 py-2 text-xs rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-2xs hover:border-teal-500/60"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: activeSubMenu === 'status' ? '#007b83' : 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {selectedStatusItem?.icon()}
                      <span className="truncate font-semibold">
                        {isAr ? selectedStatusItem?.labelAr : selectedStatusItem?.labelEn}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                        activeSubMenu === 'status' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {activeSubMenu === 'status' && (
                    <div
                      className="absolute start-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1 z-50 max-h-56 overflow-y-auto animate-in fade-in duration-100"
                      style={{
                        background: 'var(--surface)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      {STATUS_ITEMS.map((item) => {
                        const isSelected = statusFilter === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setStatusFilter(item.id);
                              setActiveSubMenu(null);
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-start flex items-center justify-between text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {item.icon(isSelected ? 'w-3.5 h-3.5 text-white' : undefined)}
                              <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Payment Method Dropdown (Grouped 100% same as Page 2 & 3 specification) */}
                <div className="relative">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                    {isAr ? 'طريقة الدفع' : 'Payment Method'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveSubMenu((prev) => (prev === 'payment' ? null : 'payment'))}
                    className="w-full px-3 py-2 text-xs rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-2xs hover:border-teal-500/60"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: activeSubMenu === 'payment' ? '#007b83' : 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {paymentFilter === 'all' ? (
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        selectedPaymentItem?.badge(isAr)
                      )}
                      <span className="truncate font-semibold">
                        {paymentFilter === 'all'
                          ? (isAr ? 'كافة طرق الدفع' : 'All Payment Methods')
                          : (isAr ? selectedPaymentItem?.labelAr : selectedPaymentItem?.labelEn)}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                        activeSubMenu === 'payment' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {activeSubMenu === 'payment' && (
                    <div
                      className="absolute start-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1 z-50 max-h-64 overflow-y-auto animate-in fade-in duration-100"
                      style={{
                        background: 'var(--surface)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      {/* All option */}
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentFilter('all');
                          setActiveSubMenu(null);
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-start flex items-center justify-between text-xs transition-colors cursor-pointer mb-1 ${
                          paymentFilter === 'all'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className={`w-3.5 h-3.5 shrink-0 ${paymentFilter === 'all' ? 'text-white' : 'text-slate-400'}`} />
                          <span>{isAr ? 'كافة طرق الدفع' : 'All Payment Methods'}</span>
                        </div>
                        {paymentFilter === 'all' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>

                      {/* Categories */}
                      {PAYMENT_CATEGORIES.map((category) => (
                        <div key={category.groupNum} className="mt-2 border-t pt-1.5" style={{ borderColor: 'var(--border)' }}>
                          <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {isAr ? category.titleAr : category.titleEn}
                          </div>
                          <div className="space-y-0.5">
                            {category.items.map((method) => {
                              const isSelected = paymentFilter === method.id;
                              return (
                                <button
                                  key={method.id}
                                  type="button"
                                  onClick={() => {
                                    setPaymentFilter(method.id);
                                    setActiveSubMenu(null);
                                  }}
                                  className={`w-full px-3 py-1.5 rounded-lg text-start flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-600 text-white font-bold'
                                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="shrink-0">{method.badge(isAr)}</span>
                                    <span className="truncate">{isAr ? method.labelAr : method.labelEn}</span>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Sales Channel Dropdown (100% Pixel Perfect to Image 1 Right) */}
                <div className="relative">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                    {isAr ? 'قناة البيع' : 'Sales Channel'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveSubMenu((prev) => (prev === 'channel' ? null : 'channel'))}
                    className="w-full px-3 py-2 text-xs rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-2xs hover:border-teal-500/60"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: activeSubMenu === 'channel' ? '#007b83' : 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {channelFilter === 'all' ? (
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        selectedChannelItem?.icon
                      )}
                      <span className="truncate font-semibold">
                        {channelFilter === 'all'
                          ? (isAr ? 'كافة القنوات' : 'All Channels')
                          : (isAr ? selectedChannelItem?.labelAr : selectedChannelItem?.labelEn)}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                        activeSubMenu === 'channel' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {activeSubMenu === 'channel' && (
                    <div
                      className="absolute start-0 top-full mt-1.5 w-full rounded-xl border shadow-2xl p-1 z-50 max-h-60 overflow-y-auto animate-in fade-in duration-100"
                      style={{
                        background: 'var(--surface)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      {/* All Channels Option (Selected in royal blue matching image 1 right) */}
                      <button
                        type="button"
                        onClick={() => {
                          setChannelFilter('all');
                          setActiveSubMenu(null);
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-start flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          channelFilter === 'all'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Layers className={`w-3.5 h-3.5 shrink-0 ${channelFilter === 'all' ? 'text-white' : 'text-slate-400'}`} />
                          <span>{isAr ? 'كافة القنوات' : 'All Channels'}</span>
                        </div>
                        {channelFilter === 'all' && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>

                      {/* Social & Marketing Channels with Branded Icons */}
                      <div className="pt-1 space-y-0.5">
                        {SALES_CHANNEL_ITEMS.map((ch) => {
                          const isSelected = channelFilter === ch.id;
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => {
                                setChannelFilter(ch.id);
                                setActiveSubMenu(null);
                              }}
                              className={`w-full px-3 py-1.5 rounded-lg text-start flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span className="shrink-0">{ch.icon}</span>
                                <span className="truncate">{isAr ? ch.labelAr : ch.labelEn}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sort Button & Popover */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setShowSortMenu((v) => !v)}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'ترتيب' : 'Sort'}</span>
            </button>

            {showSortMenu && (
              <div
                className="absolute end-0 mt-2 w-48 py-1 rounded-2xl border shadow-xl z-40 text-xs animate-in fade-in zoom-in-95 duration-150"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                {[
                  { id: 'date_desc' as const, labelEn: 'Date: Newest First', labelAr: 'التاريخ: الأحدث أولاً' },
                  { id: 'date_asc' as const, labelEn: 'Date: Oldest First', labelAr: 'التاريخ: الأقدم أولاً' },
                  { id: 'total_desc' as const, labelEn: 'Total: Highest First', labelAr: 'المبلغ: الأعلى أولاً' },
                  { id: 'total_asc' as const, labelEn: 'Total: Lowest First', labelAr: 'المبلغ: الأقل أولاً' },
                  { id: 'id_desc' as const, labelEn: 'Order #: Highest First', labelAr: 'رقم الطلب: تنازلي' },
                  { id: 'id_asc' as const, labelEn: 'Order #: Lowest First', labelAr: 'رقم الطلب: تصاعدي' },
                ].map((s) => {
                  const active = sortKey === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSortKey(s.id);
                        setShowSortMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-start flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <span className={active ? 'font-bold text-teal-600 dark:text-teal-400' : ''}>
                        {isAr ? s.labelAr : s.labelEn}
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manage Orders Button (+ إدارة الطلبات) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenCreateOrder) {
                onOpenCreateOrder();
              } else {
                onNavigateTab('orders');
              }
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{ background: '#007b83' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إدارة الطلبات' : 'Manage Orders'}</span>
          </button>
        </div>
      </div>

      {/* ── Active Filters Indicators ── */}
      {hasActiveFilters && (
        <div
          className="px-4 py-2 bg-slate-50/70 dark:bg-slate-900/50 border-b flex items-center gap-2 flex-wrap text-xs"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-[11px] font-semibold text-slate-500">{isAr ? 'الفلاتر النشطة:' : 'Active Filters:'}</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-[11px]">
              <span>&quot;{searchQuery}&quot;</span>
              <button type="button" onClick={() => setSearchQuery('')} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-[11px]">
              <span>{getLocalizedStatus(statusFilter)}</span>
              <button type="button" onClick={() => setStatusFilter('all')} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {paymentFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              {selectedPaymentItem?.badge(isAr)}
              <span>{selectedPaymentItem ? (isAr ? selectedPaymentItem.labelAr : selectedPaymentItem.labelEn) : paymentFilter}</span>
              <button type="button" onClick={() => setPaymentFilter('all')} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {channelFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              <span className="scale-75 origin-center">{selectedChannelItem?.icon}</span>
              <span>{selectedChannelItem ? (isAr ? selectedChannelItem.labelAr : selectedChannelItem.labelEn) : channelFilter}</span>
              <button type="button" onClick={() => setChannelFilter('all')} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer ms-auto"
          >
            {isAr ? 'مسح الكل' : 'Clear all'}
          </button>
        </div>
      )}

      {/* ── Table Content ── */}
      {processedOrders.length === 0 ? (
        /* Genuine Empty State (Zero Mock Data) */
        <div className="py-14 px-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm mb-1 text-slate-700 dark:text-slate-200">
            {hasActiveFilters
              ? (isAr ? 'لا توجد طلبات تطابق الفلتر المحدد' : 'No orders match the selected filter')
              : (isAr ? 'لا توجد سجلات حالياً' : 'No records found')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {hasActiveFilters
              ? (isAr ? 'جرّب تعديل خيارات التصفية أو مسح الفلاتر لعرض الطلبات.' : 'Try adjusting your filters or resetting them to view orders.')
              : (isAr ? 'لم يتم تسجيل أي طلبات في قاعدة البيانات لهذا المتجر حتى الآن.' : 'No customer orders have been recorded in the database for this store yet.')}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-start text-xs border-collapse min-w-[680px] lg:min-w-full">
            <thead>
              <tr
                className="border-b text-xs font-black text-slate-950 dark:text-slate-100 select-none bg-slate-100/90 dark:bg-slate-800/80"
                style={{ borderColor: 'var(--border)' }}
              >
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{isAr ? 'رقم الطلب' : 'Order ID'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden sm:table-cell">{isAr ? 'قناة البيع' : 'Sales Channel'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden md:table-cell">{isAr ? 'طريقة الدفع' : 'Payment Method'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden lg:table-cell">{isAr ? 'المنتجات' : 'Products'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{isAr ? 'الإجمالي' : 'Total'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden sm:table-cell">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-3 px-4 text-center font-black whitespace-nowrap">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {paginatedOrders.map((ord) => {
                const statusStyle = statusChipStyle(ord.status);
                const firstItem = ord.items?.[0];
                const rawItemName = firstItem ? (isAr ? (firstItem.nameAr || firstItem.name) : (firstItem.nameEn || firstItem.name)) : '';
                const firstItemName = rawItemName || (isAr ? 'باقة منتجات' : 'Standard Item');
                const itemsCount = ord.items?.length || 0;

                return (
                  <tr
                    key={ord.id}
                    className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* 1. Order Number */}
                    <td className="py-3.5 px-4 font-black tracking-tight whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('orders')}
                        className="font-mono text-xs font-black text-teal-700 hover:text-teal-900 dark:text-teal-400 hover:underline cursor-pointer text-start"
                      >
                        #{ord.orderNumber || ord.id.slice(0, 8)}
                      </button>
                    </td>

                    {/* 2. Customer */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="font-black text-xs text-slate-950 dark:text-white truncate">
                        {ord.customerName || (isAr ? 'عميل المتجر' : 'Store Customer')}
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        {ord.customerPhone || ord.customerEmail || '—'}
                      </div>
                    </td>

                    {/* 3. Sales Channel */}
                    <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap">
                      {getChannelBadge(ord.source)}
                    </td>

                    {/* 4. Payment Method */}
                    <td className="py-3.5 px-4 hidden md:table-cell whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                      {getPaymentBadge(ord.paymentMethod)}
                    </td>

                    {/* 5. Products */}
                    <td className="py-3.5 px-4 hidden lg:table-cell whitespace-nowrap max-w-[160px]">
                      <div className="truncate text-slate-900 dark:text-slate-100 font-bold text-xs" title={firstItemName}>
                        {firstItemName}
                      </div>
                      {itemsCount > 1 && (
                        <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                          {isAr ? `+ ${itemsCount - 1} منتجات إضافية` : `+ ${itemsCount - 1} more items`}
                        </div>
                      )}
                    </td>

                    {/* 6. Total Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-black tabular-nums text-xs text-slate-950 dark:text-white">
                      {money(Number(ord.total) || 0)}
                    </td>

                    {/* 7. Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-2xs shrink-0"
                        style={statusStyle}
                      >
                        {getStatusIcon(ord.status)}
                        <span>{getLocalizedStatus(ord.status)}</span>
                      </span>
                    </td>

                    {/* 8. Date */}
                    <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      {ord.date || '—'}
                    </td>

                    {/* 9. Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setInspectOrder(ord)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 hover:text-teal-700 dark:text-slate-200 dark:hover:text-teal-400 transition-colors cursor-pointer inline-flex items-center justify-center shadow-2xs"
                        title={isAr ? 'عرض تفاصيل الطلب السريعة' : 'Inspect order details'}
                        aria-label="View order"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination Bar (Matching Image 1: < [ 1 ] > and counter) ── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-t text-xs select-none"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Pagination navigation (< [1] [2] >) */}
        <div className="flex items-center gap-1.5">
          {/* Prev Button */}
          <button
            type="button"
            disabled={validPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-label="Previous Page"
          >
            {dir === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isActive = p === validPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'border hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                style={
                  !isActive
                    ? {
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }
                    : undefined
                }
              >
                {p}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            type="button"
            disabled={validPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-label="Next Page"
          >
            {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Counter Info: عرض 1-5 من أصل 12 طلب */}
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {isAr
            ? `عرض ${startRange}-${endRange} من أصل ${totalCount} طلب`
            : `Showing ${startRange}-${endRange} of ${totalCount} orders`}
        </div>
      </div>

      {inspectOrder && (
        <React.Suspense fallback={null}>
          <OrderDetailsModal
            isOpen={Boolean(inspectOrder)}
            onClose={() => setInspectOrder(null)}
            order={inspectOrder}
            onPrintInvoice={() => onNavigateTab('orders')}
            onEditOrder={() => onNavigateTab('orders')}
          />
        </React.Suspense>
      )}
    </div>
  );
});

DashboardOrdersTable.displayName = 'DashboardOrdersTable';
