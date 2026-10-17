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
  Archive,
  RotateCcw,
  ArchiveRestore,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../common/ToastProvider';
import { RetailInvoiceModal } from '../common/RetailInvoiceModal';
import { InvoicePreviewModal } from './invoices/InvoicePreviewModal';
import { invoiceService } from '../../services/invoiceService';
import type { InvoiceDocument } from '../../types/invoices';
import { EditOrderModal } from '../common/EditOrderModal';
import { ReturnsManager } from './orders/ReturnsManager';
import { CodLedgerModal } from './orders/CodLedgerModal';
import { OrderDetailsModal } from './orders/OrderDetailsModal';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateLocale';
import { CreateStoreOrderModal } from './CreateStoreOrderModal';
import { OrderFilters, type OrderFilterState } from './OrderFilters';
import { WindowedPagination } from '../common/WindowedPagination';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';

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
    archiveOrder,
    restoreOrder,
    permanentDeleteOrder,
    addOrder,
    createShipmentForOrder,
  } = useTenant();
  const { t, money, locale, dir } = usePrefs();
  const { toast, confirm } = useToast();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [orderFilters, setOrderFilters] = useState<OrderFilterState>({
    datePreset: 'all',
    startDate: '',
    endDate: '',
    paymentStatus: 'all',
    shippingStatus: 'all',
    paymentMethod: 'all',
    orderSource: 'all',
  });
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
  const [invoiceConfig, setInvoiceConfig] = useState<any>(() => invoiceService.getTemplateConfig(activeStore.id));
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [returnsOrder, setReturnsOrder] = useState<Order | null>(null);
  const [showCodLedgerModal, setShowCodLedgerModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsModalOrder, setDetailsModalOrder] = useState<Order | null>(null);
  const isAr = locale === 'ar';

  const previewInvoiceDoc = useMemo<InvoiceDocument | null>(() => {
    if (!invoiceOrder) return null;
    const existing = invoiceService.getDocuments(activeStore.id).find(
      (d) => d.orderNumber === invoiceOrder.orderNumber || d.orderId === invoiceOrder.id
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const items = (invoiceOrder.items || []).map((it, idx) => ({
      id: `it-${idx + 1}`,
      name: it.name,
      sku: it.sku || `SKU-${idx + 1}`,
      quantity: it.quantity || 1,
      unitPrice: it.price,
      discount: 0,
      taxRate: 15,
      taxAmount: it.price * (it.quantity || 1) * 0.15,
      total: (it.price * (it.quantity || 1)) * 1.15,
      image: it.image,
    }));
    const subtotal = invoiceOrder.subtotal || invoiceOrder.total / 1.15;
    const taxAmount = invoiceOrder.tax || subtotal * 0.15;

    return {
      id: `doc-${invoiceOrder.id}`,
      storeId: activeStore.id,
      documentType: invoiceOrder.status === 'cancelled' ? 'cancelled_order_invoice' : 'order_invoice',
      documentNumber: `INV-2026-${invoiceOrder.orderNumber.replace(/[^0-9]/g, '') || '0100'}`,
      title: 'Commercial Sales Invoice',
      titleAr: 'فاتورة مبيعات تجارية',
      orderId: invoiceOrder.id,
      orderNumber: invoiceOrder.orderNumber,
      issueDate: invoiceOrder.date || now,
      seller: {
        name: activeStore.name || 'Makkah Gifts Est.',
        nameAr: activeStore.nameAr || 'مؤسسة هدايا مكة والزهور الفاخرة',
        email: 'billing@makkah-gifts.sa',
        phone: '+966 12 555 8899',
        address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
        addressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        vatNumber: '300948215600003',
        crNumber: '1010892341',
      },
      buyer: {
        name: invoiceOrder.customerName,
        email: invoiceOrder.customerEmail,
        phone: invoiceOrder.customerPhone,
        address: invoiceOrder.deliveryLocation,
        city: 'Makkah',
        country: 'Saudi Arabia',
      },
      items,
      subtotal,
      discountAmount: invoiceOrder.discountAmount || 0,
      shippingFee: invoiceOrder.shippingFee || 0,
      taxRate: 15,
      taxAmount,
      grandTotal: invoiceOrder.total,
      amountPaid: invoiceOrder.paymentStatus === 'Paid' ? invoiceOrder.total : 0,
      outstandingBalance: invoiceOrder.paymentStatus === 'Paid' ? 0 : invoiceOrder.total,
      currency: 'SAR',
      status: invoiceOrder.paymentStatus === 'Paid' ? 'paid' : 'issued',
      isLocked: true,
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: now,
          action: 'issued',
          actorName: 'Store Administrator',
          actorRole: 'admin',
          details: 'Invoice rendered from live store order data.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
  }, [invoiceOrder, activeStore]);

  const handleSaveEditedOrder = (orderId: string, updates: Partial<Order>) => {
    updateOrder(orderId, updates, activeStore?.id);
    toast(isAr ? 'تم تحديث بيانات الطلب بنجاح' : 'Order updated successfully', 'success');
  };

  // Editable notes state for Order Details
  const [isEditingCustomerNotes, setIsEditingCustomerNotes] = useState(false);
  const [customerNotesDraft, setCustomerNotesDraft] = useState('');
  const [isEditingInternalNotes, setIsEditingInternalNotes] = useState(false);
  const [internalNotesDraft, setInternalNotesDraft] = useState('');

  // Active vs Archived separation
  const activeOrders = useMemo(() => currentOrders.filter((o) => !o.isArchived), [currentOrders]);
  const archivedOrders = useMemo(() => currentOrders.filter((o) => Boolean(o.isArchived)), [currentOrders]);

  // Keep selectedOrder in sync with DB state
  const currentSelectedOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return currentOrders.find((o) => o.id === selectedOrder.id) || selectedOrder;
  }, [currentOrders, selectedOrder]);

  // ── 4 KPI Summary Cards matching Mockup 04 (Store Scoped) ──
  const kpi = useMemo(() => {
    const total = activeOrders.length;
    const completed = activeOrders.filter(
      (o) => o.status === 'completed' || o.status === 'delivered',
    ).length;
    const pending = activeOrders.filter((o) => o.status === 'pending').length;
    const inDelivery = activeOrders.filter(
      (o) => o.status === 'shipped' || o.status === 'out_for_delivery' || (o as any).fulfillmentStatus === 'out_for_delivery',
    ).length;

    return { total, completed, pending, inDelivery };
  }, [activeOrders]);

  // ── Status Tabs with Counts ──
  const STATUS_TABS = useMemo(() => {
    const counts = {
      all: activeOrders.length,
      awaiting_payment: activeOrders.filter((o) => o.status === 'pending').length,
      processing: activeOrders.filter((o) => o.status === 'processing').length,
      shipped: activeOrders.filter((o) => o.status === 'shipped').length,
      out_for_delivery: activeOrders.filter((o) => o.status === 'out_for_delivery').length,
      delivered: activeOrders.filter((o) => o.status === 'completed' || o.status === 'delivered').length,
      cancelled: activeOrders.filter((o) => o.status === 'cancelled').length,
      returned: activeOrders.filter((o) => o.status === 'returned').length,
      archived: archivedOrders.length,
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
      { key: 'archived', label: t('archivedOrdersTab') || (isAr ? 'الأرشيف / المحذوفات' : 'Archived / Trash'), count: counts.archived },
    ];
  }, [activeOrders, archivedOrders, t, isAr]);

  // ── Filtered & Paginated orders ──
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sourceList = activeTab === 'archived' ? archivedOrders : activeOrders;

    return sourceList.filter((o) => {
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q);

      const effectivePaymentMethod = orderFilters.paymentMethod || selectedPaymentMethod;
      const matchesPayment =
        effectivePaymentMethod === 'all' ||
        o.paymentMethod.toLowerCase().includes(effectivePaymentMethod.toLowerCase());

      const effectiveSource = orderFilters.orderSource || selectedSource;
      const matchesSource = effectiveSource === 'all' || o.source === effectiveSource;

      // Payment Status filter
      const matchesPaymentStatus = (() => {
        if (orderFilters.paymentStatus === 'all') return true;
        const ps = (o.paymentStatus || '').toLowerCase();
        const target = orderFilters.paymentStatus.toLowerCase();
        if (ps === target) return true;
        if (target === 'paid') return ps.includes('paid') || o.status === 'completed';
        if (target === 'pending payment') return ps.includes('pending') || o.status === 'pending';
        if (target === 'payment failed') return ps.includes('fail');
        if (target === 'refunded') return ps.includes('refund');
        if (target === 'partially refunded') return ps.includes('partially');
        return false;
      })();

      // Shipping Status filter
      const matchesShippingStatus = (() => {
        if (orderFilters.shippingStatus === 'all') return true;
        const ss = (o.shippingStatus || (o as any).fulfillmentStatus || '').toLowerCase();
        const target = orderFilters.shippingStatus.toLowerCase();
        if (ss === target) return true;
        if (target === 'not shipped') return !ss || ss.includes('not') || ss === 'pending';
        if (target === 'ready to ship') return ss.includes('ready') || o.status === 'processing';
        if (target === 'handed to carrier') return ss.includes('carrier') || ss.includes('dispatched');
        if (target === 'in transit') return ss.includes('transit') || o.status === 'shipped';
        if (target === 'delivered') return ss.includes('delivered') || o.status === 'delivered' || o.status === 'completed';
        if (target === 'delivery failed') return ss.includes('fail');
        if (target === 'delayed') return ss.includes('delay');
        return false;
      })();

      // Date Range filter
      const matchesDate = (() => {
        if (orderFilters.datePreset === 'all') return true;
        const orderDate = new Date(o.date);
        const now = new Date();
        if (isNaN(orderDate.getTime())) return true;

        if (orderFilters.datePreset === 'today') {
          return orderDate.toDateString() === now.toDateString();
        }
        if (orderFilters.datePreset === 'last_7_days') {
          const past = new Date();
          past.setDate(now.getDate() - 7);
          return orderDate >= past && orderDate <= now;
        }
        if (orderFilters.datePreset === 'last_30_days') {
          const past = new Date();
          past.setDate(now.getDate() - 30);
          return orderDate >= past && orderDate <= now;
        }
        if (orderFilters.datePreset === 'this_month') {
          return (
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear()
          );
        }
        if (orderFilters.datePreset === 'custom') {
          if (!orderFilters.startDate && !orderFilters.endDate) return true;
          const from = orderFilters.startDate
            ? new Date(orderFilters.startDate)
            : new Date(0);
          const to = orderFilters.endDate
            ? new Date(new Date(orderFilters.endDate).setHours(23, 59, 59, 999))
            : new Date(8640000000000000);
          return orderDate >= from && orderDate <= to;
        }
        return true;
      })();

      if (
        !matchesSearch ||
        !matchesPayment ||
        !matchesSource ||
        !matchesPaymentStatus ||
        !matchesShippingStatus ||
        !matchesDate
      ) {
        return false;
      }

      if (activeTab === 'all' || activeTab === 'archived') return true;
      if (activeTab === 'awaiting_payment') return o.status === 'pending';
      if (activeTab === 'processing') return o.status === 'processing';
      if (activeTab === 'shipped') return o.status === 'shipped';
      if (activeTab === 'out_for_delivery') return o.status === 'out_for_delivery';
      if (activeTab === 'delivered') return o.status === 'completed' || o.status === 'delivered';
      if (activeTab === 'cancelled') return o.status === 'cancelled';
      if (activeTab === 'returned') return o.status === 'returned';
      return true;
    });
  }, [activeOrders, archivedOrders, search, selectedPaymentMethod, selectedSource, orderFilters, activeTab]);

  const handleArchiveSingleOrder = async (ord: Order) => {
    const ok = await confirm({
      title: t('archiveOrderConfirmTitle') || (isAr ? 'أرشفة الطلب' : 'Archive Order'),
      message: (t('archiveOrderConfirmMsg') || (isAr ? 'هل أنت متأكد من نقل الطلب {number} إلى الأرشيف؟ يمكنك استعادته في أي وقت من قسم الأرشيف.' : 'Are you sure you want to move order {number} to the archive? You can restore it anytime.')).replace('{number}', ord.orderNumber),
      confirmLabel: t('archiveOrder') || (isAr ? 'نقل إلى الأرشيف' : 'Move to Archive'),
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      danger: false,
    });
    if (ok) {
      archiveOrder(ord.id, ord.storeId);
      if (selectedOrder?.id === ord.id) {
        setSelectedOrder(null);
      }
      toast(t('archiveOrderSuccess') || (isAr ? 'تم نقل الطلب إلى الأرشيف بنجاح' : 'Order moved to archive successfully'), 'success');
    }
  };

  const handleRestoreSingleOrder = async (ord: Order) => {
    const ok = await confirm({
      title: t('restoreOrderConfirmTitle') || (isAr ? 'استعادة الطلب' : 'Restore Order'),
      message: (t('restoreOrderConfirmMsg') || (isAr ? 'هل أنت متأكد من استعادة الطلب {number} إلى قائمة الطلبات النشطة؟' : 'Are you sure you want to restore order {number} back to active orders?')).replace('{number}', ord.orderNumber),
      confirmLabel: t('restoreOrder') || (isAr ? 'استعادة الطلب' : 'Restore Order'),
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      danger: false,
    });
    if (ok) {
      restoreOrder(ord.id, ord.storeId);
      if (selectedOrder?.id === ord.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, isArchived: false } : null));
      }
      toast(t('restoreOrderSuccess') || (isAr ? 'تمت استعادة الطلب بنجاح' : 'Order restored successfully'), 'success');
    }
  };

  const handlePermanentDeleteSingleOrder = async (ord: Order) => {
    const ok = await confirm({
      title: t('permanentDeleteOrderConfirmTitle') || (isAr ? 'حذف الطلب نهائياً' : 'Permanently Delete Order'),
      message: (t('permanentDeleteOrderConfirmMsg') || (isAr ? 'هل أنت متأكد من الحذف النهائي للطلب {number}؟ هذا الإجراء نهائي ولا يمكن التراجع عنه أبداً!' : 'Are you sure you want to permanently delete order {number}? This action cannot be undone!')).replace('{number}', ord.orderNumber),
      confirmLabel: t('permanentDeleteOrder') || (isAr ? 'حذف نهائي' : 'Delete Permanently'),
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      danger: true,
    });
    if (ok) {
      permanentDeleteOrder(ord.id, ord.storeId);
      if (selectedOrder?.id === ord.id) {
        setSelectedOrder(null);
      }
      toast(t('permanentDeleteOrderSuccess') || (isAr ? 'تم حذف الطلب نهائياً بنجاح' : 'Order permanently deleted'), 'success');
    }
  };

  const handleBulkArchive = async () => {
    if (selectedOrderIds.length === 0) return;
    const count = selectedOrderIds.length;
    const ok = await confirm({
      title: t('archiveOrderConfirmTitle') || (isAr ? 'أرشفة الطلبات المحددة' : 'Archive Selected Orders'),
      message: isAr ? `هل أنت متأكد من نقل ${count} طلبات محددة إلى الأرشيف؟` : `Are you sure you want to move ${count} selected orders to the archive?`,
      confirmLabel: t('bulkArchiveOrders') || (isAr ? 'أرشفة المحدد' : 'Archive Selected'),
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      danger: false,
    });
    if (ok) {
      selectedOrderIds.forEach((id) => archiveOrder(id, activeStore.id));
      setSelectedOrderIds([]);
      toast(isAr ? `تم نقل ${count} طلبات إلى الأرشيف بنجاح` : `${count} orders moved to archive`, 'success');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedOrderIds.length === 0) return;
    const count = selectedOrderIds.length;
    const ok = await confirm({
      title: t('restoreOrderConfirmTitle') || (isAr ? 'استعادة الطلبات المحددة' : 'Restore Selected Orders'),
      message: isAr ? `هل أنت متأكد من استعادة ${count} طلبات محددة إلى القائمة النشطة؟` : `Are you sure you want to restore ${count} selected orders?`,
      confirmLabel: t('bulkRestoreOrders') || (isAr ? 'استعادة المحدد' : 'Restore Selected'),
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      danger: false,
    });
    if (ok) {
      selectedOrderIds.forEach((id) => restoreOrder(id, activeStore.id));
      setSelectedOrderIds([]);
      toast(isAr ? `تمت استعادة ${count} طلبات بنجاح` : `${count} orders restored successfully`, 'success');
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    const count = selectedOrderIds.length;
    const ok = await confirm({
      title: t('permanentDeleteOrderConfirmTitle') || (isAr ? 'حذف نهائي للطلبات المحددة' : 'Permanently Delete Selected Orders'),
      message: isAr ? `هل أنت متأكد من حذف ${count} طلبات محددة نهائياً؟ هذا الإجراء لا يمكن التراجع عنه!` : `Are you sure you want to permanently delete ${count} selected orders? This cannot be undone!`,
      confirmLabel: t('bulkPermanentDeleteOrders') || (isAr ? 'حذف نهائي للمحدد' : 'Permanently Delete Selected'),
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      danger: true,
    });
    if (ok) {
      selectedOrderIds.forEach((id) => permanentDeleteOrder(id, activeStore.id));
      setSelectedOrderIds([]);
      toast(isAr ? `تم الحذف النهائي لـ ${count} طلبات` : `${count} orders permanently deleted`, 'success');
    }
  };

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
              {o.isArchived && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200">
                  <Archive className="w-3 h-3" />
                  {isAr ? 'مؤرشف' : 'Archived'}
                </span>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {t('orderPlacedAt')
                .replace('{date}', formatDisplayDate(o.date || '2026-09-29', locale))
                .replace('{time}', formatDisplayTime(o.time || '02:32 PM', locale))
                .replace('{store}', activeStore.name)}
            </p>
          </div>

          {/* Action buttons */}
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

            {o.isArchived ? (
              <>
                <button
                  type="button"
                  onClick={() => handleRestoreSingleOrder(o)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors hover:bg-emerald-100"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('restoreOrder') || (isAr ? 'استعادة الطلب' : 'Restore Order')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePermanentDeleteSingleOrder(o)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-200 text-rose-600 bg-rose-50/60 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors hover:bg-rose-100"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('permanentDeleteOrder') || (isAr ? 'حذف نهائي' : 'Delete Permanently')}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleArchiveSingleOrder(o)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <Archive className="w-4 h-4 text-slate-500" />
                <span>{t('archiveOrder') || (isAr ? 'نقل إلى الأرشيف' : 'Move to Archive')}</span>
              </button>
            )}

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

            {/* Return / Refund button */}
            {o.status !== 'returned' && o.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => {
                  setReturnsOrder(o);
                  setShowReturnsModal(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إرجاع واسترداد' : 'Return / Refund'}</span>
              </button>
            )}
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
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 font-black text-sm text-slate-950 dark:text-white">
                  <User className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span>{t('customerInfo')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast(t('customerInfo'), 'info')}
                  className="text-xs font-black text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3" />
                  <span>{t('edit')}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 font-black flex items-center justify-center text-sm border border-teal-200">
                    {o.customerAvatar || (o.customerName ? o.customerName.slice(0, 2).toUpperCase() : 'AQ')}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-950 dark:text-white leading-tight">
                      {o.customerName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 mt-1 inline-block">
                      {o.customerType ? (o.customerType.toLowerCase().includes('return') ? t('returningCustomer') : o.customerType) : t('returningCustomer')}
                    </span>
                  </div>
                </div>

                <div className="text-end text-xs">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">{t('totalOrders')}</span>
                  <span className="font-black font-mono text-sm text-slate-950 dark:text-white">12</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                  <Phone className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
                  <span className="font-mono">{o.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                  <Mail className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
                  <span>{o.customerEmail || 'ahmed@example.com'}</span>
                </div>
                <div className="flex items-start gap-2 pt-1 font-semibold text-slate-800 dark:text-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
                  <span>{o.deliveryLocation || (isAr ? 'الرياض، حي العليا، طريق الملك فهد، مبنى 123' : 'Riyadh, Al Olaya District, King Fahd Road, Building 123')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t mt-4 text-[11px] flex justify-between border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              <span>{t('customerSince')}</span>
              <span className="font-black text-slate-950 dark:text-white">{formatDisplayDate(o.customerSince || 'Jan 2023', locale)}</span>
            </div>
          </div>

          {/* Card 2: Shipping Information */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 font-black text-sm text-slate-950 dark:text-white">
                  <Truck className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span>{t('shippingInfo')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast(t('shippingInfo'), 'info')}
                  className="text-xs font-black text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3" />
                  <span>{t('edit')}</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{t('shippingCompany')}</span>
                  <span className="font-black flex items-center gap-1.5 text-slate-950 dark:text-white">
                    {o.shippingCompany ? (
                      <>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">
                          {o.shippingCompany.substring(0, 4).toUpperCase()}
                        </span>
                        <span>{o.shippingCompany}</span>
                      </>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400 font-bold italic">{isAr ? 'لم تحدد شركة الشحن' : 'Not Assigned'}</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{t('trackingNumber')}</span>
                  {o.trackingNumber ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-slate-950 dark:text-white">
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
                          <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
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
                      className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-[11px] hover:bg-blue-700 cursor-pointer shadow-2xs"
                    >
                      {isAr ? 'إصدار بوليصة AWB' : 'Dispatch / Create AWB'}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{t('shippingStatus')}</span>
                  {getStatusBadge(o.shippingStatus || (o.trackingNumber ? 'in_transit' : 'pending'))}
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('shippingAddress')}
                  </span>
                  <p className="leading-relaxed text-xs font-bold text-slate-950 dark:text-white">
                    {o.shippingAddress || o.deliveryLocation || (isAr ? 'الرياض، حي العليا، طريق الملك فهد، مبنى 123، المملكة العربية السعودية' : 'Riyadh, Al Olaya District, King Fahd Road, Building 123, Riyadh 12211, Saudi Arabia')}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t mt-4 text-[11px] flex justify-between border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              <span>{t('deliveryGuarantee')}</span>
              <span className="font-black text-emerald-700 dark:text-emerald-400">{t('onTimeGuaranteed')}</span>
            </div>
          </div>

          {/* Card 3: Payment Information */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 font-black text-sm text-slate-950 dark:text-white">
                  <CreditCard className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span>{t('paymentInfo')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast(t('paymentInfo'), 'info')}
                  className="text-xs font-black text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3" />
                  <span>{t('edit')}</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{t('paymentMethod')}</span>
                  {getPaymentBadge(o.paymentMethod || 'mada')}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{t('paymentStatus')}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {o.paymentStatus?.toLowerCase() === 'unpaid' ? t('unpaidStatus') : t('paidStatus')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{t('transactionId')}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-slate-950 dark:text-white">
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
                        <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{t('paymentDate')}</span>
                  <span className="font-black text-slate-950 dark:text-white">
                    {formatDisplayDate(o.paymentDate || `${o.date || '2026-09-29'} at ${o.time || '02:34 PM'}`, locale)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t mt-4 text-[11px] flex justify-between border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              <span>{t('gatewaySettlement')}</span>
              <span className="font-black flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
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
                      <th className="pb-3 text-start font-black text-xs text-slate-950 dark:text-slate-100">
                        #
                      </th>
                      <th className="pb-3 text-start font-black text-xs text-slate-950 dark:text-slate-100">
                        {t('product')}
                      </th>
                      <th className="pb-3 text-end font-black text-xs text-slate-950 dark:text-slate-100">
                        {t('price')}
                      </th>
                      <th className="pb-3 text-center font-black text-xs text-slate-950 dark:text-slate-100">
                        {t('quantity')}
                      </th>
                      <th className="pb-3 text-end font-black text-xs text-slate-950 dark:text-slate-100">
                        {t('total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr
                        key={it.id || idx}
                        className="border-b hover:bg-slate-100/60 dark:hover:bg-slate-900/50 transition-colors"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <td
                          className="py-3 px-1 text-start font-mono text-xs font-black text-slate-800 dark:text-slate-200"
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          {idx + 1}
                        </td>
                        <td className="py-3 px-2" style={{ borderBottom: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-2.5">
                            {it.image ? (
                              <img
                                src={it.image}
                                alt={isAr ? (it.nameAr || it.name) : (it.nameEn || it.name)}
                                onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                                className="w-9 h-9 rounded-xl object-cover shrink-0 border"
                                style={{ borderColor: 'var(--border)' }}
                              />
                            ) : (
                              <span className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-slate-700" />
                              </span>
                            )}
                            <div className="min-w-0">
                              <span className="font-black text-xs block truncate max-w-[140px] text-slate-950 dark:text-white">
                                {isAr ? (it.nameAr || it.name) : (it.nameEn || it.name)}
                              </span>
                              <span className="text-[10px] font-mono font-bold block text-slate-700 dark:text-slate-300 mt-0.5">
                                SKU: {it.sku || `SKU-${idx + 1}`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td
                          className="py-3 px-2 text-end font-bold text-xs text-slate-900 dark:text-slate-100"
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          {money(it.price)}
                        </td>
                        <td
                          className="py-3 px-2 text-center font-black text-xs text-slate-950 dark:text-white"
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          {it.quantity}
                        </td>
                        <td
                          className="py-3 px-2 text-end font-black text-xs text-slate-950 dark:text-white"
                          style={{ borderBottom: '1px solid var(--border)' }}
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
          <div className="lg:col-span-3 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-black text-sm mb-4 text-slate-950 dark:text-white">
                {t('orderSummary')}
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>{t('subtotalLabel')} ({items.length} {t('items')})</span>
                  <span className="font-black text-slate-950 dark:text-white">
                    {money(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-rose-600">
                  <span>{t('discountLabel')} ({o.discountCode || 'WELCOME10'})</span>
                  <span className="font-black">- {money(discount)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>{t('shippingFeeLabel')}</span>
                  <span className="font-black text-slate-950 dark:text-white">
                    {money(shipping)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>{t('taxVatLabel')}</span>
                  <span className="font-black text-slate-950 dark:text-white">
                    {money(tax)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="pt-4 border-t mt-4 flex items-center justify-between"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-sm font-black text-slate-950 dark:text-white">
                {t('grandTotalLabel')}
              </span>
              <span
                className="text-lg font-black px-3 py-1 rounded-xl bg-blue-100 text-blue-950 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-900"
              >
                {money(grandTotal)}
              </span>
            </div>
          </div>

          {/* Column 3: Order History Vertical Stepper (Mockup 05 -> 4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <h3 className="font-black text-sm mb-4 flex items-center gap-2 text-slate-950 dark:text-white">
              <Clock className="w-4 h-4 text-blue-600" />
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

        {showReturnsModal && (
          <ReturnsManager
            isOpen={showReturnsModal}
            onClose={() => setShowReturnsModal(false)}
            order={returnsOrder || currentSelectedOrder}
          />
        )}
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

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* COD Cash Ledger Button */}
          <button
            type="button"
            onClick={() => setShowCodLedgerModal(true)}
            className="py-2.5 px-3.5 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center gap-2 shadow-2xs cursor-pointer transition-all shrink-0"
            aria-label="COD Cash Ledger"
          >
            <Banknote className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{isAr ? 'سجل تحصيل COD' : 'COD Cash Ledger'}</span>
          </button>

          {/* + New Order Primary CTA Button */}
          <button
            type="button"
            onClick={() => setShowNewOrderModal(true)}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:opacity-95 shrink-0"
            style={{ background: 'var(--portal-cta, #0284c7)' }}
            aria-label="Create new order"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t('newOrder')}</span>
          </button>
        </div>
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
          <OrderFilters
            filters={orderFilters}
            onChange={(newFilters) => {
              setOrderFilters(newFilters);
              if (newFilters.paymentMethod) setSelectedPaymentMethod(newFilters.paymentMethod);
              if (newFilters.orderSource) setSelectedSource(newFilters.orderSource);
              setPage(1);
            }}
            onReset={() => {
              const resetState: OrderFilterState = {
                datePreset: 'all',
                startDate: '',
                endDate: '',
                paymentStatus: 'all',
                shippingStatus: 'all',
                paymentMethod: 'all',
                orderSource: 'all',
              };
              setOrderFilters(resetState);
              setSelectedPaymentMethod('all');
              setSelectedSource('all');
              setSearch('');
              toast('Filters reset to default', 'info');
            }}
            isOpen={showMoreFilters}
          />
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
              archived: { bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', activeBg: 'bg-slate-700', activeText: 'text-white' },
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

        {/* ── BULK ACTIONS BAR ── */}
        {selectedOrderIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 p-3.5 bg-blue-50 dark:bg-slate-800/90 border border-blue-200 dark:border-slate-700 rounded-2xl shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[11px]">
                {selectedOrderIds.length}
              </span>
              <span>
                {isAr ? `تم تحديد ${selectedOrderIds.length} طلبات` : `${selectedOrderIds.length} orders selected`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'archived' ? (
                <>
                  <button
                    type="button"
                    onClick={handleBulkRestore}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('bulkRestoreOrders') || (isAr ? 'استعادة المحدد' : 'Restore Selected')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkPermanentDelete}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('bulkPermanentDeleteOrders') || (isAr ? 'حذف نهائي للمحدد' : 'Permanently Delete Selected')}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleBulkArchive}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{t('bulkArchiveOrders') || (isAr ? 'أرشفة المحدد' : 'Archive Selected')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrderIds([])}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                {isAr ? 'إلغاء التحديد' : 'Clear'}
              </button>
            </div>
          </div>
        )}

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
                              onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
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
                              onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
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
                                    setDetailsModalOrder(ord);
                                    setShowDetailsModal(true);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-teal-500" />
                                  <span>{isAr ? 'نافذة سريعة' : 'Quick Inspector'}</span>
                                </button>
                                {ord.status !== 'returned' && ord.status !== 'cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReturnsOrder(ord);
                                      setShowReturnsModal(true);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-start px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>{isAr ? 'معالجة الإرجاع' : 'Process Return'}</span>
                                  </button>
                                )}
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
                                {ord.isArchived ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveActionMenuId(null);
                                        handleRestoreSingleOrder(ord);
                                      }}
                                      className="w-full text-start px-3 py-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 cursor-pointer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>{t('restoreOrder') || (isAr ? 'استعادة الطلب' : 'Restore Order')}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveActionMenuId(null);
                                        handlePermanentDeleteSingleOrder(ord);
                                      }}
                                      className="w-full text-start px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>{t('permanentDeleteOrder') || (isAr ? 'حذف نهائي' : 'Delete Permanently')}</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleArchiveSingleOrder(ord);
                                    }}
                                    className="w-full text-start px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Archive className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{t('archiveOrder') || (isAr ? 'نقل إلى الأرشيف' : 'Move to Archive')}</span>
                                  </button>
                                )}
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
        <WindowedPagination
          currentPage={safePage}
          totalPages={pageCount}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          isAr={isAr}
          itemLabel={isAr ? 'طلب' : 'orders'}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* ── NEW ORDER MODAL (Store scoped) ── */}
      {showNewOrderModal && (
        <CreateStoreOrderModal
          storeName={activeStore.name}
          storeId={activeStore.id}
          onClose={() => setShowNewOrderModal(false)}
          onCreate={(orderData) => {
            addOrder({ ...orderData, storeId: activeStore.id } as any, activeStore.id);
            setShowNewOrderModal(false);
            toast(t('orderCreatedSuccess'), 'success');
          }}
        />
      )}

      {/* ── MODALS (Invoice Print & Edit Order) ── */}
      {showInvoiceModal && previewInvoiceDoc && (
        <InvoicePreviewModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          document={previewInvoiceDoc}
          config={invoiceConfig}
          onConfigChange={(updated) => setInvoiceConfig(updated)}
        />
      )}

      <EditOrderModal
        isOpen={showEditOrderModal}
        onClose={() => setShowEditOrderModal(false)}
        order={editingOrder}
        onSave={handleSaveEditedOrder}
      />

      {showReturnsModal && (
        <ReturnsManager
          isOpen={showReturnsModal}
          onClose={() => setShowReturnsModal(false)}
          order={returnsOrder}
        />
      )}

      {showCodLedgerModal && (
        <CodLedgerModal
          isOpen={showCodLedgerModal}
          onClose={() => setShowCodLedgerModal(false)}
          orders={activeOrders}
        />
      )}

      {showDetailsModal && (
        <OrderDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setDetailsModalOrder(null);
          }}
          order={detailsModalOrder}
          onPrintInvoice={(ord) => {
            setInvoiceOrder(ord);
            setShowInvoiceModal(true);
          }}
          onEditOrder={(ord) => {
            setEditingOrder(ord);
            setShowEditOrderModal(true);
          }}
        />
      )}
    </AdminPageShell>
  );
};

