import React, { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import type { Order, OrderStatus } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { AdminPageShell } from '../common/AdminPageHeader';
import {
  ShoppingCart,
  CheckCircle,
  Clock,
  Truck,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Printer,
  Edit,
  Trash2,
  Copy,
  Instagram,
  Globe,
  Share2,
  Bot,
  MessageCircle,
  CreditCard,
  Check,
  Phone,
  Mail,
  MapPin,
  Package,
  ShoppingBag,
  Smartphone,
  Banknote,
  Ghost,
  TrendingUp,
  TrendingDown,
  X,
  SlidersHorizontal,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../common/ToastProvider';
import { RetailInvoiceModal } from '../common/RetailInvoiceModal';
import { EditOrderModal } from '../common/EditOrderModal';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateLocale';

/**
 * StoreOrders — Store Admin Order Management (100% Pixel Perfect to Mockups 04 & 05)
 * Reference Mockup 04: designs/Master_Admin_UIUX/04_Orders_List/mockup_consistent/04_orders_list.png
 * Reference Mockup 05: designs/Master_Admin_UIUX/05_Order_Details/mockup_consistent/05_order_details.png
 * Strictly scoped to activeStore.id with identical Holst chrome & styling as Master.
 */
export const StoreOrders: React.FC = () => {
  const {
    activeStore,
    currentOrders,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    addOrder,
    createShipmentForOrder,
  } = useTenant();
  const { t, money, locale, dir } = usePrefs();
  const { toast, confirm } = useToast();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Modals state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const isAr = locale === 'ar';

  const handleSaveEditedOrder = (orderId: string, updates: Partial<Order>) => {
    updateOrder(orderId, updates, activeStore?.id);
    toast(isAr ? 'تم تحديث بيانات الطلب بنجاح' : 'Order updated successfully', 'success');
  };

  // Editable notes state for Order Details
  const [isEditingCustomerNotes, setIsEditingCustomerNotes] = useState(false);
  const [customerNotesDraft, setCustomerNotesDraft] = useState('');
  const [isEditingInternalNotes, setIsEditingInternalNotes] = useState(false);
  const [internalNotesDraft, setInternalNotesDraft] = useState('');

  // Keep selectedOrder in sync with DB state
  const currentSelectedOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return currentOrders.find((o) => o.id === selectedOrder.id) || selectedOrder;
  }, [currentOrders, selectedOrder]);

  // ── 4 KPI Summary Cards matching Mockup 04 (Store Scoped) ──
  const kpi = useMemo(() => {
    const total = currentOrders.length;
    const completed = currentOrders.filter(
      (o) => o.status === 'completed' || o.status === 'delivered',
    ).length;
    const pending = currentOrders.filter((o) => o.status === 'pending').length;
    const inDelivery = currentOrders.filter(
      (o) => o.status === 'shipped' || o.status === 'out_for_delivery' || (o as any).fulfillmentStatus === 'out_for_delivery',
    ).length;

    return { total, completed, pending, inDelivery };
  }, [currentOrders]);

  // ── Status Tabs with Counts ──
  const STATUS_TABS = useMemo(() => {
    const counts = {
      all: currentOrders.length,
      awaiting_payment: currentOrders.filter((o) => o.status === 'pending').length,
      processing: currentOrders.filter((o) => o.status === 'processing').length,
      shipped: currentOrders.filter((o) => o.status === 'shipped').length,
      out_for_delivery: currentOrders.filter((o) => o.status === 'out_for_delivery').length,
      delivered: currentOrders.filter((o) => o.status === 'completed' || o.status === 'delivered').length,
      cancelled: currentOrders.filter((o) => o.status === 'cancelled').length,
      returned: currentOrders.filter((o) => o.status === 'returned').length,
    };

    return [
      { key: 'all', label: t('allOrdersTab'), count: counts.all },
      { key: 'awaiting_payment', label: t('awaitingPaymentTab'), count: counts.awaiting_payment },
      { key: 'processing', label: t('processingTab'), count: counts.processing },
      { key: 'shipped', label: t('shippedTab'), count: counts.shipped },
      { key: 'out_for_delivery', label: t('outForDeliveryTab'), count: counts.out_for_delivery },
      { key: 'delivered', label: t('deliveredTab'), count: counts.delivered },
      { key: 'cancelled', label: t('cancelledTab'), count: counts.cancelled },
      { key: 'returned', label: t('returnedTab'), count: counts.returned },
    ];
  }, [currentOrders, t]);

  // ── Filtered & Paginated orders ──
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return currentOrders.filter((o) => {
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q);

      const matchesPayment =
        selectedPaymentMethod === 'all' ||
        o.paymentMethod.toLowerCase().includes(selectedPaymentMethod.toLowerCase());

      const matchesSource = selectedSource === 'all' || o.source === selectedSource;

      if (!matchesSearch || !matchesPayment || !matchesSource) return false;

      if (activeTab === 'all') return true;
      if (activeTab === 'awaiting_payment') return o.status === 'pending';
      if (activeTab === 'processing') return o.status === 'processing';
      if (activeTab === 'shipped') return o.status === 'shipped';
      if (activeTab === 'out_for_delivery') return o.status === 'out_for_delivery';
      if (activeTab === 'delivered') return o.status === 'completed' || o.status === 'delivered';
      if (activeTab === 'cancelled') return o.status === 'cancelled';
      if (activeTab === 'returned') return o.status === 'returned';
      return true;
    });
  }, [currentOrders, search, selectedPaymentMethod, selectedSource, activeTab]);

  const totalCount = filteredOrders.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === pagedOrders.length && pagedOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pagedOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast(`${text} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Source Icon Renderer ──
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Instagram':
        return <Instagram className="w-4 h-4 text-pink-500 shrink-0" />;
      case 'Google Ads':
        return (
          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">
            G
          </span>
        );
      case 'WhatsApp':
        return <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'TikTok':
        return (
          <span className="w-4 h-4 rounded bg-black text-white font-black text-[9px] flex items-center justify-center shrink-0">
            TT
          </span>
        );
      case 'Snapchat':
        return <Ghost className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'AI Assistant':
        return <Bot className="w-4 h-4 text-cyan-600 shrink-0" />;
      case 'Referral':
        return <Share2 className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'Organic Search':
        return <Search className="w-4 h-4 text-emerald-600 shrink-0" />;
      default:
        return <Globe className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  // ── Payment Badge Renderer ──
  const getPaymentBadge = (method: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('mada')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-xs">
          <span className="w-5 h-3.5 bg-emerald-600 rounded-xs text-[8px] text-white flex items-center justify-center font-black">
            M
          </span>
          <span style={{ color: 'var(--text)' }}>{locale === 'en' ? 'mada' : 'مدى'}</span>
        </span>
      );
    }
    if (m.includes('apple')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-xs" style={{ color: 'var(--text)' }}>
          <Smartphone className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" />
          <span>{t('applePay')}</span>
        </span>
      );
    }
    if (m.includes('stc')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-xs text-purple-600">
          <span className="font-black text-[10px]">stc</span>
          <span>pay</span>
        </span>
      );
    }
    if (m.includes('visa')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-black text-xs text-blue-700">
          VISA
        </span>
      );
    }
    if (m.includes('cash') || m.includes('cod')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-emerald-700 dark:text-emerald-400">
          <Banknote className="w-3.5 h-3.5" />
          <span>{t('cashOnDelivery')}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text)' }}>
        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
        <span>{t('creditCard')}</span>
      </span>
    );
  };

  // ── Status Chip Renderer ──
  const getStatusBadge = (status: OrderStatus | string) => {
    const s = String(status || '').toLowerCase().replace(/[\s-]+/g, '_');
    switch (s) {
      case 'delivered':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EBF8F2] text-[#059669] border border-[#A7F3D0] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 whitespace-nowrap">
            {t('deliveredTab')}
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EBF8F2] text-[#059669] border border-[#A7F3D0] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 whitespace-nowrap">
            {t('completed')}
          </span>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EBF4FE] text-[#2563EB] border border-[#BFDBFE] dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 whitespace-nowrap">
            {t('processingTab')}
          </span>
        );
      case 'pending':
      case 'awaiting_payment':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEF6EB] text-[#D97706] border border-[#FDE68A] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 whitespace-nowrap">
            {t('awaitingPaymentTab')}
          </span>
        );
      case 'shipped':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#F3EBFD] text-[#7C3AED] border border-[#DDD6FE] dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800 whitespace-nowrap">
            {t('shippedTab')}
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEF7EB] text-[#B45309] border border-[#FDE68A] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 whitespace-nowrap">
            {t('outForDeliveryTab')}
          </span>
        );
      case 'cancellation_requested':
      case 'cancellation_pending':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 whitespace-nowrap animate-pulse">
            {isAr ? 'طلب إلغاء معلق ⏳' : 'Cancel Requested ⏳'}
          </span>
        );
      case 'cancelled':
      case 'canceled':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEEBEB] text-[#DC2626] border border-[#FECACA] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 whitespace-nowrap">
            {isAr ? 'ملغي' : 'Cancelled'}
          </span>
        );
      case 'returned':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFF1F2] text-[#E11D48] border border-[#FFE4E6] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 whitespace-nowrap">
            {t('returnedTab')}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  // ────────────────────────────────────────────────
  //  ORDER DETAILS VIEW (S4.orders · Mockup 05 Exact Match)
  // ────────────────────────────────────────────────
  if (currentSelectedOrder) {
    const o = currentSelectedOrder;
    const items = o.items && o.items.length > 0 ? o.items : [
      {
        id: 'item-1',
        name: 'Royal Dutch Red Roses Velvet Box',
        sku: 'WM-ROSE-01',
        price: 340,
        quantity: 1,
        total: 340,
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&auto=format&fit=crop&q=80',
      },
      {
        id: 'item-2',
        name: 'Casablanca White Lilies & Orchids Vase',
        sku: 'WM-LILY-02',
        price: 220,
        quantity: 1,
        total: 220,
        image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=120&auto=format&fit=crop&q=80',
      },
      {
        id: 'item-3',
        name: 'Belgian Chocolate & Red Roses Box',
        sku: 'WM-CHOC-06',
        price: 90,
        quantity: 1,
        total: 90,
        image: 'https://images.unsplash.com/photo-1548848221-0c2e497ed557?w=120&auto=format&fit=crop&q=80',
      },
    ];

    const subtotal = o.subtotal ?? items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    const discount = o.discountAmount ?? 46;
    const shipping = o.shippingFee ?? 42;
    const tax = o.tax ?? Math.round(subtotal * 0.15);
    const grandTotal = o.total || (subtotal - discount + shipping + tax);

    const timeline = o.timeline && o.timeline.length > 0 ? o.timeline : [
      {
        date: o.date || 'Jan 31, 2024',
        time: o.time || '02:32 PM',
        title: t('orderPlaced'),
        description: t('orderPlacedDesc'),
        status: 'pending' as const,
      },
      {
        date: o.date || 'Jan 31, 2024',
        time: '02:34 PM',
        title: t('paymentConfirmed'),
        description: t('paymentConfirmedDesc'),
        status: 'processing' as const,
      },
      {
        date: o.date || 'Jan 31, 2024',
        time: '11:55 AM',
        title: t('orderProcessed'),
        description: t('orderProcessedDesc'),
        status: 'processing' as const,
      },
      {
        date: o.date || 'Jan 31, 2024',
        time: '01:20 PM',
        title: t('shippedTitle'),
        description: t('shippedDesc'),
        status: 'shipped' as const,
      },
      {
        date: o.date || 'Jan 31, 2024',
        time: '09:12 AM',
        title: t('outForDeliveryTitle'),
        description: t('outForDeliveryDesc'),
        status: 'out_for_delivery' as const,
      },
      {
        date: o.date || 'Jan 31, 2024',
        time: '02:10 PM',
        title: t('deliveredTitle'),
        description: t('deliveredDesc'),
        status: 'delivered' as const,
      },
    ];

    const handleDeleteOrder = async () => {
      const ok = await confirm({
        title: t('deleteOrder'),
        message: `Are you sure you want to delete order ${o.orderNumber}? This action cannot be undone.`,
        confirmLabel: t('deleteOrder'),
        danger: true,
      });
      if (ok) {
        deleteOrder(o.id, o.storeId);
        setSelectedOrder(null);
        toast(t('orderConfirmedDelete'), 'success');
      }
    };

    const handleSaveCustomerNotes = () => {
      updateOrder(o.id, { customerNotes: customerNotesDraft });
      setIsEditingCustomerNotes(false);
      toast('Customer notes saved', 'success');
    };

    const handleSaveInternalNotes = () => {
      updateOrder(o.id, { internalNotes: internalNotesDraft });
      setIsEditingInternalNotes(false);
      toast('Internal notes saved', 'success');
    };

    return (
      <AdminPageShell className="pb-16 max-w-[1600px] mx-auto space-y-5">
        {/* ── BREADCRUMBS & TOP HEADER ROW ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb matching mockup: < Orders < #10284 */}
            <div className="flex items-center gap-2 text-xs mb-1 font-semibold" style={{ color: 'var(--muted)' }}>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{t('navOrders')}</span>
              </button>
              <span>/</span>
              <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>
                {o.orderNumber}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                {t('orderTitle')} {o.orderNumber}
              </h1>
              {getStatusBadge(o.status)}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {t('orderPlacedAt')
                .replace('{date}', formatDisplayDate(o.date || '2026-09-29', locale))
                .replace('{time}', formatDisplayTime(o.time || '02:32 PM', locale))
                .replace('{store}', activeStore.name)}
            </p>
          </div>

          {/* Action buttons: ... , Print Invoice, Delete Order, Edit Order */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => copyToClipboard(o.orderNumber, 'ord-top')}
              className="p-2.5 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              title="Copy Order ID"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setInvoiceOrder(o);
                setShowInvoiceModal(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer shadow-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>{t('printInvoice')}</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteOrder}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-200 text-rose-600 bg-rose-50/60 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors hover:bg-rose-100"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('deleteOrder')}</span>
            </button>

            {/* Clean Edit Order button opening modal */}
            <button
              type="button"
              onClick={() => {
                setEditingOrder(o);
                setShowEditOrderModal(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-xs transition-all hover:opacity-95"
              style={{ background: 'var(--portal-cta, #0284c7)' }}
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{t('editOrder')}</span>
            </button>
          </div>
        </div>

        {/* ── Admin Cancellation & Refund Review Action Box ── */}
        {o.status === 'cancellation_requested' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 space-y-3 shadow-md animate-fadeIn">
            <div className="flex items-start gap-3 text-amber-900 dark:text-amber-200">
              <div className="w-10 h-10 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black">
                    {isAr ? 'طلب إلغاء الطلب واسترداد المبلغ من العميل' : 'Customer Requested Order Cancellation & Refund'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                    {isAr ? 'بانتظار قرار الإدارة' : 'Pending Admin Decision'}
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  {isAr
                    ? `قام العميل (${o.customerName}) بطلب إلغاء هذا الطلب (${o.orderNumber}) بمبلغ إجمالي (${money(o.total)}). يرجى مراجعة الطلب والموافقة على الإلغاء واعتماد استرداد المبلغ أو رفض الطلب ومواصلة التجهيز.`
                    : `Customer (${o.customerName}) requested cancellation for order (${o.orderNumber}) total (${money(o.total)}). Please review and approve refund or reject to continue.`}
                </p>
                {o.cancelReason && (
                  <p className="text-[11px] font-mono text-amber-950 dark:text-amber-100 bg-amber-100/60 dark:bg-amber-900/40 px-3 py-1.5 rounded-lg mt-2 inline-block border border-amber-200">
                    {isAr ? 'سبب الإلغاء الموضح من العميل:' : 'Customer reason:'} "{o.cancelReason}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-amber-200 dark:border-amber-800 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  updateOrderStatus(o.id, 'cancelled', activeStore?.id);
                  updateOrder(o.id, { status: 'cancelled', paymentStatus: 'Refunded', refundStatus: 'refunded' } as any, activeStore?.id);
                  toast(isAr ? 'تمت الموافقة على إلغاء الطلب واعتماد استرداد المبلغ للعميل بنجاح ✓' : 'Cancellation approved & refund processed successfully ✓', 'success');
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isAr ? 'الموافقة على الإلغاء واعتماد استرداد المبلغ' : 'Approve Cancellation & Refund'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateOrderStatus(o.id, 'processing', activeStore?.id);
                  updateOrder(o.id, { status: 'processing', refundStatus: 'rejected' } as any, activeStore?.id);
                  toast(isAr ? 'تم رفض طلب الإلغاء ومواصلة تجهيز وتوصيل الطلب' : 'Cancellation request rejected, order processing continued', 'info');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>{isAr ? 'رفض طلب الإلغاء' : 'Reject Cancellation'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 4 META CARDS GRID (Mockup 05) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Order Number */}
          <div className="bg-white dark:bg-[#071E26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-black text-lg shrink-0">
              #
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium block" style={{ color: 'var(--muted)' }}>
                {t('orderNumber')}
              </span>
              <span className="text-sm sm:text-base font-bold font-mono truncate block" style={{ color: 'var(--text)' }}>
                {o.orderNumber}
              </span>
            </div>
          </div>

          {/* Card 2: Order Date */}
          <div className="bg-white dark:bg-[#071E26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium block" style={{ color: 'var(--muted)' }}>
                {t('orderDate')}
              </span>
              <span className="text-xs sm:text-sm font-bold truncate block" style={{ color: 'var(--text)' }}>
                {formatDisplayDate(o.date || '2026-09-29', locale)}
              </span>
              <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>
                {formatDisplayTime(o.time || '02:32 PM', locale)}
              </span>
            </div>
          </div>

          {/* Card 3: Order Status */}
          <div className="bg-white dark:bg-[#071E26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium block" style={{ color: 'var(--muted)' }}>
                {t('orderStatus')}
              </span>
              <div className="mt-0.5">
                {getStatusBadge(o.status)}
              </div>
            </div>
          </div>

          {/* Card 4: Order Source & Attribution */}
          <div className="bg-white dark:bg-[#071E26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 flex items-center justify-center shrink-0">
              {getSourceIcon(o.source || 'Instagram')}
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium block" style={{ color: 'var(--muted)' }}>
                {t('orderSource')}
              </span>
              <span className="text-xs sm:text-sm font-bold truncate block" style={{ color: 'var(--text)' }}>
                {o.source || 'Instagram'}
              </span>
              {(o.medium || o.campaign) && (
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold truncate block">
                  {o.medium ? `Medium: ${o.medium}` : ''} {o.campaign ? `· Campaign: ${o.campaign}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Real Ecommerce Attribution Breadcrumb (Requirement 5) ── */}
        <div className="p-3.5 bg-gradient-to-r from-teal-50/80 via-blue-50/50 to-indigo-50/80 dark:from-teal-950/30 dark:via-blue-950/20 dark:to-indigo-950/30 rounded-2xl border border-teal-200/60 dark:border-teal-900/40 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-black text-teal-800 dark:text-teal-300 shrink-0 text-[11px] uppercase tracking-wider">
            {isAr ? 'مسار التحويل (Attribution):' : 'Order Attribution:'}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 font-medium">
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 shadow-2xs font-bold text-slate-900 dark:text-white">
              {o.orderNumber}
            </span>
            <span className="text-slate-400">→</span>
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 shadow-2xs text-slate-800 dark:text-slate-200">
              {o.customerName}
            </span>
            <span className="text-slate-400">→</span>
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 shadow-2xs text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
              {items[0]?.name || 'Products'}
            </span>
            <span className="text-slate-400">→</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-black">
              {money(grandTotal)}
            </span>
            <span className="text-slate-400">→</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold">
              {o.source || 'Direct'}
            </span>
            <span className="text-slate-400">→</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 font-semibold">
              {o.medium || 'Direct / Web'}
            </span>
            {o.campaign && (
              <>
                <span className="text-slate-400">→</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold">
                  {o.campaign}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── 3 INFORMATION CARDS (Customer · Shipping · Payment) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Customer Information */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--text)' }}>
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{t('customerInfo')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast(t('customerInfo'), 'info')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3" />
                  <span>{t('edit')}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold flex items-center justify-center text-sm">
                    {o.customerAvatar || (o.customerName ? o.customerName.slice(0, 2).toUpperCase() : 'AQ')}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>
                      {o.customerName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 mt-1 inline-block">
                      {o.customerType ? (o.customerType.toLowerCase().includes('return') ? t('returningCustomer') : o.customerType) : t('returningCustomer')}
                    </span>
                  </div>
                </div>

                <div className="text-end text-xs">
                  <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>{t('totalOrders')}</span>
                  <span className="font-bold font-mono text-sm" style={{ color: 'var(--text)' }}>12</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{o.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{o.customerEmail || 'ahmed@example.com'}</span>
                </div>
                <div className="flex items-start gap-2 pt-1" style={{ color: 'var(--muted)' }}>
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{o.deliveryLocation || (isAr ? 'الرياض، حي العليا، طريق الملك فهد، مبنى 123' : 'Riyadh, Al Olaya District, King Fahd Road, Building 123')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t mt-4 text-[11px] flex justify-between border-slate-100 dark:border-slate-800" style={{ color: 'var(--muted)' }}>
              <span>{t('customerSince')}</span>
              <span className="font-bold" style={{ color: 'var(--text)' }}>{formatDisplayDate(o.customerSince || 'Jan 2023', locale)}</span>
            </div>
          </div>

          {/* Card 2: Shipping Information */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--text)' }}>
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span>{t('shippingInfo')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast(t('shippingInfo'), 'info')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3" />
                  <span>{t('edit')}</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--muted)' }}>{t('shippingCompany')}</span>
                  <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    {o.shippingCompany ? (
                      <>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">
                          {o.shippingCompany.substring(0, 4).toUpperCase()}
                        </span>
                        <span>{o.shippingCompany}</span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-normal italic">{isAr ? 'لم تحدد شركة الشحن' : 'Not Assigned'}</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--muted)' }}>{t('trackingNumber')}</span>
                  {o.trackingNumber ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>
                        {o.trackingNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(o.trackingNumber!, 'track-num-store')}
                        className="p-1 hover:opacity-75 cursor-pointer rounded"
                        title="Copy tracking number"
                      >
                        {copiedId === 'track-num-store' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await createShipmentForOrder(o.id, 'spl');
                          toast(isAr ? 'تم إنشاء بوليصة الشحن (AWB) بنجاح وإسناد رقم التتبع!' : 'Shipment AWB created and assigned to order!', 'success');
                        } catch {
                          toast('Failed to generate AWB', 'error');
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[10px] hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer"
                    >
                      {isAr ? 'إصدار بوليصة AWB' : 'Dispatch / Create AWB'}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--muted)' }}>{t('shippingStatus')}</span>
                  {getStatusBadge(o.shippingStatus || (o.trackingNumber ? 'in_transit' : 'pending'))}
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-medium block mb-1" style={{ color: 'var(--muted)' }}>
                    {t('shippingAddress')}
                  </span>
                  <p className="leading-relaxed text-xs font-medium" style={{ color: 'var(--text)' }}>
                    {o.shippingAddress || o.deliveryLocation || (isAr ? 'الرياض، حي العليا، طريق الملك فهد، مبنى 123، المملكة العربية السعودية' : 'Riyadh, Al Olaya District, King Fahd Road, Building 123, Riyadh 12211, Saudi Arabia')}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t mt-4 text-[11px] flex justify-between border-slate-100 dark:border-slate-800" style={{ color: 'var(--muted)' }}>
              <span>{t('deliveryGuarantee')}</span>
              <span className="font-bold text-emerald-600">{t('onTimeGuaranteed')}</span>
            </div>
          </div>

          {/* Card 3: Payment Information */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--text)' }}>
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>{t('paymentInfo')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast(t('paymentInfo'), 'info')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3" />
                  <span>{t('edit')}</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--muted)' }}>{t('paymentMethod')}</span>
                  {getPaymentBadge(o.paymentMethod || 'mada')}
                </div>

                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--muted)' }}>{t('paymentStatus')}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF8F2] text-[#059669] border border-[#A7F3D0] dark:bg-emerald-950/40 dark:text-emerald-400">
                    {o.paymentStatus?.toLowerCase() === 'unpaid' ? t('unpaidStatus') : t('paidStatus')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--muted)' }}>{t('transactionId')}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>
                      {o.transactionId || 'MADA-789123456'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(o.transactionId || 'MADA-789123456', 'tx-id-store')}
                      className="p-1 hover:opacity-75 cursor-pointer rounded"
                      title="Copy transaction ID"
                    >
                      {copiedId === 'tx-id-store' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span style={{ color: 'var(--muted)' }}>{t('paymentDate')}</span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    {formatDisplayDate(o.paymentDate || `${o.date || '2026-09-29'} at ${o.time || '02:34 PM'}`, locale)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t mt-4 text-[11px] flex justify-between border-slate-100 dark:border-slate-800" style={{ color: 'var(--muted)' }}>
              <span>{t('gatewaySettlement')}</span>
              <span className="font-bold flex items-center gap-1 text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" /> {t('directMerchantDeposit')}
              </span>
            </div>
          </div>
        </div>

        {/* ── 3-COLUMN MIDDLE SECTION (Items · Summary · History Timeline) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Column 1: Order Items Table (45% width approx -> 5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>
                {t('orderItems')} ({items.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-separate border-spacing-0">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <th className="pb-3 text-start font-semibold text-[11px]" style={{ color: 'var(--muted)' }}>
                        #
                      </th>
                      <th className="pb-3 text-start font-semibold text-[11px]" style={{ color: 'var(--muted)' }}>
                        {t('product')}
                      </th>
                      <th className="pb-3 text-end font-semibold text-[11px]" style={{ color: 'var(--muted)' }}>
                        {t('price')}
                      </th>
                      <th className="pb-3 text-center font-semibold text-[11px]" style={{ color: 'var(--muted)' }}>
                        {t('quantity')}
                      </th>
                      <th className="pb-3 text-end font-semibold text-[11px]" style={{ color: 'var(--muted)' }}>
                        {t('total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr
                        key={it.id || idx}
                        className="border-b hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <td
                          className="py-3 px-1 text-start font-mono text-[11px]"
                          style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}
                        >
                          {idx + 1}
                        </td>
                        <td className="py-3 px-2" style={{ borderBottom: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-2.5">
                            {it.image ? (
                              <img
                                src={it.image}
                                alt={it.name}
                                className="w-9 h-9 rounded-xl object-cover shrink-0 border"
                                style={{ borderColor: 'var(--border)' }}
                              />
                            ) : (
                              <span className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-slate-500" />
                              </span>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold block truncate max-w-[130px]" style={{ color: 'var(--text)' }}>
                                {it.name}
                              </span>
                              <span className="text-[10px] font-mono block" style={{ color: 'var(--muted)' }}>
                                SKU: {it.sku || `SKU-${idx + 1}`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td
                          className="py-3 px-2 text-end font-medium"
                          style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                        >
                          {money(it.price)}
                        </td>
                        <td
                          className="py-3 px-2 text-center font-medium"
                          style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                        >
                          {it.quantity}
                        </td>
                        <td
                          className="py-3 px-2 text-end font-bold"
                          style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                        >
                          {money(it.price * it.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Column 2: Order Summary (30% approx -> 3 cols) */}
          <div className="lg:col-span-3 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>
                {t('orderSummary')}
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between" style={{ color: 'var(--muted)' }}>
                  <span>{t('subtotalLabel')} ({items.length} {t('items')})</span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    {money(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>{t('discountLabel')} ({o.discountCode || 'WELCOME10'})</span>
                  <span className="font-medium">- {money(discount)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--muted)' }}>
                  <span>{t('shippingFeeLabel')}</span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    {money(shipping)}
                  </span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--muted)' }}>
                  <span>{t('taxVatLabel')}</span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    {money(tax)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="pt-4 border-t mt-4 flex items-center justify-between"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-sm font-black" style={{ color: 'var(--text)' }}>
                {t('grandTotalLabel')}
              </span>
              <span
                className="text-lg font-black px-3 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900"
              >
                {money(grandTotal)}
              </span>
            </div>
          </div>

          {/* Column 3: Order History Vertical Stepper (Mockup 05 -> 4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{t('orderHistory')}</span>
            </h3>

            <div className="space-y-1">
              {timeline.map((step, idx) => {
                const isLatest = idx === timeline.length - 1;
                const tLower = (step.title || '').toLowerCase();
                
                let IconComponent = Clock;
                let toneBg = 'bg-blue-50 dark:bg-blue-950/50';
                let toneColor = 'text-blue-600 dark:text-blue-400';
                let toneBorder = 'border-blue-200 dark:border-blue-800';

                if (tLower.includes('placed') || tLower.includes('created')) {
                  IconComponent = ShoppingBag;
                  toneBg = 'bg-blue-50 dark:bg-blue-950/50';
                  toneColor = 'text-blue-600 dark:text-blue-400';
                  toneBorder = 'border-blue-200 dark:border-blue-800';
                } else if (tLower.includes('payment') || tLower.includes('confirmed') || tLower.includes('paid')) {
                  IconComponent = CreditCard;
                  toneBg = 'bg-emerald-50 dark:bg-emerald-950/50';
                  toneColor = 'text-emerald-600 dark:text-emerald-400';
                  toneBorder = 'border-emerald-200 dark:border-emerald-800';
                } else if (tLower.includes('process') || tLower.includes('prepared')) {
                  IconComponent = Package;
                  toneBg = 'bg-amber-50 dark:bg-amber-950/50';
                  toneColor = 'text-amber-600 dark:text-amber-400';
                  toneBorder = 'border-amber-200 dark:border-amber-800';
                } else if (tLower.includes('ship')) {
                  IconComponent = Truck;
                  toneBg = 'bg-purple-50 dark:bg-purple-950/50';
                  toneColor = 'text-purple-600 dark:text-purple-400';
                  toneBorder = 'border-purple-200 dark:border-purple-800';
                } else if (tLower.includes('delivery') || tLower.includes('courier')) {
                  IconComponent = MapPin;
                  toneBg = 'bg-orange-50 dark:bg-orange-950/50';
                  toneColor = 'text-orange-600 dark:text-orange-400';
                  toneBorder = 'border-orange-200 dark:border-orange-800';
                } else if (tLower.includes('deliver') || tLower.includes('complete')) {
                  IconComponent = Sparkles;
                  toneBg = 'bg-emerald-50 dark:bg-emerald-950/50';
                  toneColor = 'text-emerald-600 dark:text-emerald-400';
                  toneBorder = 'border-emerald-200 dark:border-emerald-800';
                }

                return (
                  <div key={idx} className="flex items-start gap-3 sm:gap-4 text-xs relative group">
                    {/* Timestamp */}
                    <div className="w-[85px] sm:w-[95px] text-end shrink-0 pt-1" style={{ color: 'var(--muted)' }}>
                      <div className="font-bold text-[10px] leading-tight text-slate-700 dark:text-slate-300">
                        {formatDisplayDate(step.date, locale)}
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5 font-mono">
                        {formatDisplayTime(step.time, locale)}
                      </div>
                    </div>

                    {/* Step Icon Node with perfectly centered connecting track */}
                    <div className="relative flex flex-col items-center shrink-0 self-stretch">
                      <div
                        className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-all ${
                          isLatest
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100 dark:ring-blue-950/80 animate-pulse'
                            : `${toneBg} ${toneColor} border ${toneBorder} ring-4 ring-white dark:ring-[#071E26]`
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      {idx < timeline.length - 1 && (
                        <div className="w-[2px] grow min-h-[22px] my-1 bg-gradient-to-b from-blue-500/50 via-emerald-400/50 to-emerald-500/50 dark:from-blue-400/40 dark:to-emerald-400/40 rounded-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5 pb-3">
                      <div className="font-bold text-xs flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--text)' }}>
                        <span>{step.title}</span>
                        {isLatest && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 2 BOTTOM NOTE CARDS (Customer Notes · Internal Notes) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Customer Notes */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <FileText className="w-4 h-4 text-slate-400" />
                <span>{t('customerNotes')}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCustomerNotesDraft(o.customerNotes || (isAr ? 'يرجى التوصيل بعد الساعة 5 مساءً. شكراً لكم!' : 'Please deliver after 5 PM. Thank you!'));
                  setIsEditingCustomerNotes(!isEditingCustomerNotes);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3 h-3" />
                <span>{isEditingCustomerNotes ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? 'تعديل' : 'Edit')}</span>
              </button>
            </div>

            {isEditingCustomerNotes ? (
              <div className="space-y-3">
                <textarea
                  value={customerNotesDraft}
                  onChange={(e) => setCustomerNotesDraft(e.target.value)}
                  className="w-full p-3 rounded-xl border text-xs"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                  rows={3}
                />
                <button
                  type="button"
                  onClick={handleSaveCustomerNotes}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  {t('saveNotes')}
                </button>
              </div>
            ) : (
              <div
                className="p-3.5 rounded-xl text-xs leading-relaxed bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"
                style={{ color: 'var(--text)' }}
              >
                {o.customerNotes || (isAr ? 'يرجى التوصيل بعد الساعة 5 مساءً. شكراً لكم!' : 'Please deliver after 5 PM. Thank you!')}
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <FileText className="w-4 h-4 text-slate-400" />
                <span>{t('internalNotes')}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setInternalNotesDraft(o.internalNotes || (isAr ? 'عميل مميز (VIP) - يرجى العناية الخاصة بالطلب.' : 'VIP customer. Handle with care.'));
                  setIsEditingInternalNotes(!isEditingInternalNotes);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3 h-3" />
                <span>{isEditingInternalNotes ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? 'تعديل' : 'Edit')}</span>
              </button>
            </div>

            {isEditingInternalNotes ? (
              <div className="space-y-3">
                <textarea
                  value={internalNotesDraft}
                  onChange={(e) => setInternalNotesDraft(e.target.value)}
                  className="w-full p-3 rounded-xl border text-xs"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--input-fg)',
                  }}
                  rows={3}
                />
                <button
                  type="button"
                  onClick={handleSaveInternalNotes}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  {t('saveNotes')}
                </button>
              </div>
            ) : (
              <div
                className="p-3.5 rounded-xl text-xs leading-relaxed bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"
                style={{ color: 'var(--text)' }}
              >
                {o.internalNotes || (isAr ? 'عميل مميز (VIP) - يرجى العناية الخاصة بالطلب.' : 'VIP customer. Handle with care.')}
              </div>
            )}
          </div>
        </div>

        {/* ── MODALS (Invoice Print & Edit Order) ── */}
        <RetailInvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          order={invoiceOrder}
          store={activeStore}
        />

        <EditOrderModal
          isOpen={showEditOrderModal}
          onClose={() => setShowEditOrderModal(false)}
          order={editingOrder}
          onSave={handleSaveEditedOrder}
        />
      </AdminPageShell>
    );
  }

  // ────────────────────────────────────────────────
  //  ORDERS LIST VIEW (S4.orders · Mockup 04 Exact Match)
  // ────────────────────────────────────────────────
  return (
    <AdminPageShell className="pb-16 max-w-[1600px] mx-auto space-y-5">
      {/* ── TOP HEADER — Title & Subtitle + New Order Button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight" style={{ color: 'var(--text)' }}>
            {t('orderManagement')}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {t('orderManagementSub')} · <strong style={{ color: 'var(--text)' }}>{(isAr ? activeStore.nameAr : activeStore.nameEn) || activeStore.name}</strong>
          </p>
        </div>

        {/* + New Order Primary CTA Button */}
        <button
          type="button"
          onClick={() => setShowNewOrderModal(true)}
          className="py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:opacity-95 shrink-0 self-start sm:self-auto"
          style={{ background: 'var(--portal-cta, #0284c7)' }}
          aria-label="Create new order"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{t('newOrder')}</span>
        </button>
      </div>

      {/* ── 4 KPI CARDS DEDICATED GRID (Mockup 04 - 100% UNIFORM NO 3+1 WRAPPING) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-blue-50/70 hover:bg-blue-50/90 p-4 rounded-2xl border border-blue-200/80 flex items-center gap-3.5 shadow-xs transition-all">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold block leading-tight truncate text-slate-700">
              {t('totalOrders')}
            </span>
            <div className="text-xl sm:text-2xl font-black tabular-nums leading-none mt-1 text-slate-900">
              {kpi.total.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>12%</span>
              <span className="font-medium text-slate-500">{isAr ? 'عن الشهر الماضي' : 'vs last month'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Completed Orders */}
        <div className="bg-emerald-50/70 hover:bg-emerald-50/90 p-4 rounded-2xl border border-emerald-200/80 flex items-center gap-3.5 shadow-xs transition-all">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold block leading-tight truncate text-slate-700">
              {t('completedOrders')}
            </span>
            <div className="text-xl sm:text-2xl font-black tabular-nums leading-none mt-1 text-slate-900">
              {kpi.completed.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>14%</span>
              <span className="font-medium text-slate-500">{isAr ? 'عن الشهر الماضي' : 'vs last month'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Orders */}
        <div className="bg-amber-50/70 hover:bg-amber-50/90 p-4 rounded-2xl border border-amber-200/80 flex items-center gap-3.5 shadow-xs transition-all">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold block leading-tight truncate text-slate-700">
              {t('pendingOrders')}
            </span>
            <div className="text-xl sm:text-2xl font-black tabular-nums leading-none mt-1 text-slate-900">
              {kpi.pending.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-rose-700 mt-1 flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" />
              <span>4%</span>
              <span className="font-medium text-slate-500">{isAr ? 'عن الشهر الماضي' : 'vs last month'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Orders in Delivery */}
        <div className="bg-indigo-50/70 hover:bg-indigo-50/90 p-4 rounded-2xl border border-indigo-200/80 flex items-center gap-3.5 shadow-xs transition-all">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold block leading-tight truncate text-slate-700">
              {t('ordersInDelivery')}
            </span>
            <div className="text-xl sm:text-2xl font-black tabular-nums leading-none mt-1 text-slate-900">
              {kpi.inDelivery.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>8%</span>
              <span className="font-medium text-slate-500">{isAr ? 'عن الشهر الماضي' : 'vs last month'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTERS ROW (Mockup 04) ── */}
      <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-xl">
            <Search
              className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--muted)' }}
            />
            <input
              type="text"
              placeholder={t('searchOrdersPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full ps-10 pe-4 py-2.5 text-xs rounded-xl border focus:outline-none transition-shadow"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--input-fg)',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              style={{
                background: showMoreFilters ? 'color-mix(in srgb, var(--accent) 15%, var(--surface))' : 'var(--surface)',
                borderColor: showMoreFilters ? 'var(--accent)' : 'var(--border)',
                color: showMoreFilters ? 'var(--accent)' : 'var(--text)',
              }}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{t('filters')}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('moreFilters')}</span>
            </button>
          </div>
        </div>

        {/* More Filters Expandable Drawer */}
        {showMoreFilters && (
          <div
            className="p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in duration-150"
            style={{ background: 'color-mix(in srgb, var(--accent) 4%, var(--surface))', borderColor: 'var(--border)' }}
          >
            <div>
              <label className="text-[10px] font-bold block mb-1" style={{ color: 'var(--muted)' }}>
                {t('paymentMethod')}
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <option value="all">{t('allPaymentMethods')}</option>
                <option value="mada">{locale === 'en' ? 'mada' : 'مدى'}</option>
                <option value="apple">{t('applePay')}</option>
                <option value="credit">{t('creditCard')}</option>
                <option value="stc">{t('stcPay')}</option>
                <option value="visa">Visa</option>
                <option value="cash">{t('cashOnDelivery')}</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold block mb-1" style={{ color: 'var(--muted)' }}>
                {t('orderSource')}
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <option value="all">{t('allSources')}</option>
                <option value="Instagram">Instagram</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Direct">{t('directSource')}</option>
                <option value="TikTok">TikTok</option>
                <option value="Snapchat">Snapchat</option>
                <option value="Organic Search">{t('organicSearch')}</option>
                <option value="AI Assistant">{t('aiAssistant')}</option>
                <option value="Referral">{t('referral')}</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedPaymentMethod('all');
                  setSelectedSource('all');
                  setSearch('');
                  toast('Filters reset to default', 'info');
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* ── STATUS TABS WITH COUNT PILLS (Mockup 04 / Screenshot 5) ── */}
        <div
          className="flex items-center gap-1.5 flex-wrap pt-3 border-t overflow-x-auto pb-1"
          style={{ borderColor: 'var(--border)' }}
        >
          {STATUS_TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            const pillColors: Record<string, { bg: string; activeBg: string; activeText: string }> = {
              all: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200', activeBg: 'bg-blue-600', activeText: 'text-white' },
              awaiting_payment: { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200', activeBg: 'bg-amber-500', activeText: 'text-white' },
              processing: { bg: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200', activeBg: 'bg-sky-600', activeText: 'text-white' },
              shipped: { bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200', activeBg: 'bg-purple-600', activeText: 'text-white' },
              out_for_delivery: { bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200', activeBg: 'bg-orange-500', activeText: 'text-white' },
              delivered: { bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200', activeBg: 'bg-emerald-600', activeText: 'text-white' },
              cancelled: { bg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200', activeBg: 'bg-rose-600', activeText: 'text-white' },
              returned: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200', activeBg: 'bg-red-600', activeText: 'text-white' },
            };
            const color = pillColors[tab.key] || pillColors.all;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-600 dark:text-white dark:border-blue-500 shadow-sm shadow-blue-500/25'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700/80 dark:text-slate-200'
                }`}
              >
                <span className={isSelected ? 'text-white font-bold' : ''}>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : color.bg
                  }`}
                >
                  {tab.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── ORDERS TABLE (Mockup 04) ── */}
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-start text-xs min-w-[1000px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="pb-3 px-2 w-8 text-start" style={{ borderBottom: '1px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    checked={pagedOrders.length > 0 && selectedOrderIds.length === pagedOrders.length}
                    onChange={toggleSelectAll}
                    className="rounded cursor-pointer"
                  />
                </th>
                <th className="pb-3 px-3 text-start font-semibold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  # Order No.
                </th>
                <th className="pb-3 px-3 text-start font-semibold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  Customer
                </th>
                <th className="pb-3 px-3 text-start font-semibold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  Products
                </th>
                <th className="pb-3 px-3 text-start font-semibold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  Total Amount
                </th>
                <th className="pb-3 px-3 text-start font-semibold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  Payment Method
                </th>
                <th className="pb-3 px-3 text-start font-semibold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  Order Status
                </th>
                <th className="pb-3 px-3 text-start font-semibold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  Order Source
                </th>
                <th className="pb-3 px-3 text-start font-semibold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  Order Date ↓
                </th>
                <th className="pb-3 px-3 text-center font-semibold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs" style={{ color: 'var(--muted)' }}>
                    No orders found for this store.
                  </td>
                </tr>
              ) : (
                pagedOrders.map((ord) => {
                  const isChecked = selectedOrderIds.includes(ord.id);
                  const itemsList = ord.items && ord.items.length > 0 ? ord.items : [];
                  const extraCount = ord.itemsCount > 1 ? `+${ord.itemsCount - 1}` : null;

                  return (
                    <tr
                      key={ord.id}
                      className="hover:[background:var(--hover-bg)] transition-colors group"
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-2" style={{ borderBottom: '1px solid var(--border)' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(ord.id)}
                          className="rounded cursor-pointer"
                        />
                      </td>

                      {/* # Order No. (Clicking opens Order Details S4.orders) */}
                      <td className="py-3.5 px-3 font-mono font-bold whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="hover:underline cursor-pointer font-bold text-xs"
                          style={{ color: 'var(--accent)' }}
                        >
                          {ord.orderNumber}
                        </button>
                      </td>

                      {/* Customer: Name & Phone below */}
                      <td className="py-3.5 px-3 whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="font-bold text-xs" style={{ color: 'var(--text)' }}>
                          {ord.customerName}
                        </div>
                        <div className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--muted)' }}>
                          {ord.customerPhone}
                        </div>
                      </td>

                      {/* Products (Thumbnails + +count badge) */}
                      <td className="py-3.5 px-3 whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-1.5">
                          {itemsList[0]?.image ? (
                            <img
                              src={itemsList[0].image}
                              alt="prod"
                              className="w-6 h-6 rounded-md object-cover border"
                              style={{ borderColor: 'var(--border)' }}
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <Package className="w-3 h-3 text-slate-500" />
                            </span>
                          )}

                          {itemsList[1]?.image ? (
                            <img
                              src={itemsList[1].image}
                              alt="prod"
                              className="w-6 h-6 rounded-md object-cover border"
                              style={{ borderColor: 'var(--border)' }}
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <ShoppingBag className="w-3 h-3 text-slate-500" />
                            </span>
                          )}

                          {extraCount && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {extraCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td
                        className="py-3.5 px-3 whitespace-nowrap font-black"
                        style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        {money(ord.total)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-3 whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        {getPaymentBadge(ord.paymentMethod)}
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        {getStatusBadge(ord.status)}
                      </td>

                      {/* Order Source */}
                      <td className="py-3.5 px-3 whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-1.5 font-medium text-xs" style={{ color: 'var(--text)' }}>
                          {getSourceIcon(ord.source)}
                          <span>{ord.source}</span>
                        </div>
                      </td>

                      {/* Order Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-[11px]" style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>
                          {ord.date || 'Jan 31, 2024'}
                        </div>
                        <div className="text-[10px] opacity-75">
                          {ord.time || '02:32 PM'}
                        </div>
                      </td>

                      {/* Actions: Eye Quick View & More Options ... */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap relative" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
                            style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveActionMenuId(activeActionMenuId === ord.id ? null : ord.id)}
                              className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
                              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                              title="More Actions"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Action Popover */}
                            {activeActionMenuId === ord.id && (
                              <div
                                className="absolute end-0 top-8 z-50 w-44 rounded-xl border p-1 shadow-lg text-xs font-semibold animate-in fade-in duration-100"
                                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrder(ord);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{isAr ? 'عرض التفاصيل' : 'View Details'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingOrder(ord);
                                    setShowEditOrderModal(true);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5 text-cyan-500" />
                                  <span>{isAr ? 'تعديل الطلب' : 'Edit Order'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInvoiceOrder(ord);
                                    setShowInvoiceModal(true);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{isAr ? 'طباعة فاتورة' : 'Print Invoice'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    copyToClipboard(ord.orderNumber, ord.id);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{isAr ? 'نسخ رقم الطلب' : 'Copy Order No'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStatus = ord.status === 'delivered' ? 'processing' : 'delivered';
                                    updateOrderStatus(ord.id, nextStatus, ord.storeId);
                                    setActiveActionMenuId(null);
                                    toast(`Order status changed to ${nextStatus}`, 'success');
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{isAr ? 'تبديل كـ تم التوصيل' : 'Toggle Delivered'}</span>
                                </button>
                                <div className="h-[1px] my-1" style={{ background: 'var(--border)' }} />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setActiveActionMenuId(null);
                                    const ok = await confirm({
                                      title: t('deleteOrder'),
                                      message: `Are you sure you want to delete ${ord.orderNumber}?`,
                                      confirmLabel: t('deleteOrder'),
                                      danger: true,
                                    });
                                    if (ok) {
                                      deleteOrder(ord.id, ord.storeId);
                                      toast(t('orderConfirmedDelete'), 'success');
                                    }
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{t('deleteOrder')}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS (Mockup 04) ── */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
            <div className="flex items-center gap-1.5">
              <span>{t('show')}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span>
              Showing {totalCount > 0 ? (safePage - 1) * pageSize + 1 : 0}–
              {Math.min(safePage * pageSize, totalCount)} of {totalCount.toLocaleString()} orders
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            {Array.from({ length: pageCount }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPage(idx + 1)}
                className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                style={
                  safePage === idx + 1
                    ? { background: 'var(--portal-cta)', color: '#ffffff' }
                    : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
                }
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* ── NEW ORDER MODAL (Store scoped) ── */}
      {showNewOrderModal && (
        <CreateStoreOrderModal
          storeName={activeStore.name}
          onClose={() => setShowNewOrderModal(false)}
          onCreate={(orderData) => {
            addOrder({ ...orderData, storeId: activeStore.id } as any);
            setShowNewOrderModal(false);
            toast(t('orderCreatedSuccess'), 'success');
          }}
        />
      )}

      {/* ── MODALS (Invoice Print & Edit Order) ── */}
      <RetailInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={invoiceOrder}
        store={activeStore}
      />

      <EditOrderModal
        isOpen={showEditOrderModal}
        onClose={() => setShowEditOrderModal(false)}
        order={editingOrder}
        onSave={handleSaveEditedOrder}
      />
    </AdminPageShell>
  );
};

/**
 * Clean New Store Order Modal Form
 */
const CreateStoreOrderModal: React.FC<{
  storeName: string;
  onClose: () => void;
  onCreate: (data: Partial<Order>) => void;
}> = ({ storeName, onClose, onCreate }) => {
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState(180);
  const [paymentMethod, setPaymentMethod] = useState<any>('mada');
  const [source, setSource] = useState<any>('Instagram');
  const [location, setLocation] = useState('Riyadh, Saudi Arabia');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;

    onCreate({
      customerName,
      customerPhone,
      total: price,
      itemsCount: 1,
      itemsSummary: productName || 'Selected Product',
      source,
      deliveryLocation: location,
      status: 'pending',
      paymentMethod,
      date: 'Just now',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-lg font-black tracking-tight">{t('createStoreOrder')}</h2>
            <p className="text-[11px] font-semibold text-emerald-600">{storeName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">{isAr ? 'اسم العميل *' : 'Customer Name *'}</label>
              <input
                type="text"
                required
                placeholder={isAr ? 'أحمد القحطاني' : 'Ahmed Al-Qahtani'}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>
            <div>
              <label className="font-bold block mb-1">{isAr ? 'رقم الهاتف (+966) *' : 'Phone (+966) *'}</label>
              <input
                type="text"
                required
                placeholder="+966 50 123 4567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">{t('productDescription')}</label>
              <input
                type="text"
                placeholder={isAr ? 'سماعات لاسلكية' : 'Wireless Headphones'}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>
            <div>
              <label className="font-bold block mb-1">{t('grandTotalLabel')}</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">{t('paymentMethod')}</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              >
                <option value="mada">{locale === 'en' ? 'mada' : 'مدى'}</option>
                <option value="Apple Pay">{t('applePay')}</option>
                <option value="Credit Card">{t('creditCard')}</option>
                <option value="stc pay">{t('stcPay')}</option>
                <option value="Visa">Visa</option>
                <option value="Cash on Delivery">{t('cashOnDelivery')}</option>
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">{t('orderSource')}</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              >
                <option value="Instagram">Instagram</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Direct">{t('directSource')}</option>
                <option value="TikTok">TikTok</option>
                <option value="Snapchat">Snapchat</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">{t('shippingAddress')}</label>
            <input
              type="text"
              placeholder={isAr ? 'الرياض، حي العليا، طريق الملك فهد' : 'Riyadh, Al Olaya District, King Fahd Road'}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-xs"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-xs"
              style={{ background: 'var(--portal-cta)' }}
            >
              {t('createStoreOrder')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
