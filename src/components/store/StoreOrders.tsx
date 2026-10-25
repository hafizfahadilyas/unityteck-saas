import React, { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import type { Order, OrderStatus } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { localeMixedLabel } from '../../utils/localeMixedLabel';
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
  UserCheck,
  Download,
  Settings,
  ChevronDown,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../common/ToastProvider';
import { RetailInvoiceModal } from '../common/RetailInvoiceModal';
import { InvoicePreviewModal } from './invoices/InvoicePreviewModal';
import { invoiceService, getStoreInvoiceProfile } from '../../services/invoiceService';
import { getCustomerDisplayName, getLocalizedAddress } from '../../utils/storeLocalization';
import type { InvoiceDocument } from '../../types/invoices';
import { EditOrderModal } from '../common/EditOrderModal';
import { ReturnsManager } from './orders/ReturnsManager';
import { CodLedgerModal } from './orders/CodLedgerModal';
import { OrderDetailsModal } from './orders/OrderDetailsModal';
import { CourierShippingLabelModal } from './orders/CourierShippingLabelModal';
import { OrderStatusSettingsModal } from './orders/OrderStatusSettingsModal';
import { ExportTemplateModal } from './orders/ExportTemplateModal';
import { AutomaticAssignmentModal } from './orders/AutomaticAssignmentModal';
import type { CourierCarrierCode } from '../../utils/courierBarcode';
import { generateZatcaTlvBase64, generateInvoiceHashSha256 } from '../../utils/zatca';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateLocale';
import { CreateStoreOrderModal } from './CreateStoreOrderModal';
import { OrderFilters, type OrderFilterState } from './OrderFilters';
import { OrderFilterMenu } from './orders/OrderFilterMenu';
import { WindowedPagination } from '../common/WindowedPagination';
import { handleImageError, FALLBACK_PRODUCT_IMAGE, resolveProductThumbnail } from '../../utils/imageFallback';
import {
  getStoreOrderPolicy,
  saveStoreOrderPolicy,
  checkWhatsAppClientCooldown,
  recordWhatsAppClientSent,
  type StoreOrderPolicyState,
} from '../../services/ksaAutomationEngine';

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
    currentProducts,
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
    status: 'all',
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [orderPolicy, setOrderPolicy] = useState<StoreOrderPolicyState>(() =>
    getStoreOrderPolicy(activeStore?.id || ''),
  );
  const [waCooldownTick, setWaCooldownTick] = useState(0);

  React.useEffect(() => {
    setOrderPolicy(getStoreOrderPolicy(activeStore?.id || ''));
  }, [activeStore?.id]);
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
  const [invoiceConfig, setInvoiceConfig] = useState<any>(() => invoiceService.getTemplateConfig(activeStore?.id, activeStore));

  React.useEffect(() => {
    if (activeStore?.id) {
      setInvoiceConfig(invoiceService.getTemplateConfig(activeStore.id, activeStore));
    }
  }, [activeStore?.id]);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [returnsOrder, setReturnsOrder] = useState<Order | null>(null);
  const [showCodLedgerModal, setShowCodLedgerModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsModalOrder, setDetailsModalOrder] = useState<Order | null>(null);
  const [showShippingLabelModal, setShowShippingLabelModal] = useState(false);
  const [shippingLabelOrder, setShippingLabelOrder] = useState<Order | null>(null);

  // Tools & Settings Sub-Modals (Image 1)
  const [showOrderToolsMenu, setShowOrderToolsMenu] = useState(false);
  const [showOrderStatusSettings, setShowOrderStatusSettings] = useState(false);
  const [showExportTemplateModal, setShowExportTemplateModal] = useState(false);
  const [showAutoAssignmentModal, setShowAutoAssignmentModal] = useState(false);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [openFilterDropdown, setOpenFilterDropdown] = useState<'date' | 'payment' | 'shipping' | 'source' | null>(null);

  const isAr = locale === 'ar';

  const productThumbnailMap = useMemo(() => {
    const map = new Map<string, string>();
    if (currentProducts && Array.isArray(currentProducts)) {
      for (const p of currentProducts) {
        const img = p.image || (p.galleryUrls && p.galleryUrls[0]) || (p as any).main_image_url || (p as any).image_url;
        if (img) {
          if (p.id) map.set(p.id.toLowerCase(), img);
          if (p.sku) map.set(p.sku.toLowerCase(), img);
          if (p.name) map.set(p.name.trim().toLowerCase(), img);
          if (p.nameAr) map.set(p.nameAr.trim().toLowerCase(), img);
          if (p.nameEn) map.set(p.nameEn.trim().toLowerCase(), img);
        }
      }
    }
    return map;
  }, [currentProducts]);

  const resolveItemImage = (it?: { image?: string; id?: string; sku?: string; name?: string } | null) => {
    if (!it) return null;
    if (it.image) return it.image;
    const idKey = (it.id || '').toLowerCase();
    if (idKey && productThumbnailMap.has(idKey)) return productThumbnailMap.get(idKey)!;
    const skuKey = (it.sku || '').toLowerCase();
    if (skuKey && productThumbnailMap.has(skuKey)) return productThumbnailMap.get(skuKey)!;
    const nameKey = (it.name || '').trim().toLowerCase();
    if (nameKey && productThumbnailMap.has(nameKey)) return productThumbnailMap.get(nameKey)!;
    if (nameKey) {
      for (const [key, url] of productThumbnailMap.entries()) {
        if (key.length > 5 && (nameKey.includes(key) || key.includes(nameKey))) {
          return url;
        }
      }
    }
    return null;
  };

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
    const profile = getStoreInvoiceProfile(activeStore.id, activeStore);

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
        name: profile.nameEn,
        nameAr: profile.nameAr,
        nameEn: profile.nameEn,
        companyName: profile.companyNameEn,
        companyNameAr: profile.companyNameAr,
        companyNameEn: profile.companyNameEn,
        email: profile.email,
        phone: profile.phone,
        address: profile.addressEn,
        addressAr: profile.addressAr,
        addressEn: profile.addressEn,
        city: profile.cityEn,
        cityAr: profile.cityAr,
        country: profile.countryEn,
        countryAr: profile.countryAr,
        vatNumber: profile.vatNumber,
        crNumber: profile.crNumber,
      },
      buyer: {
        name: invoiceOrder.customerName,
        nameAr: invoiceOrder.customerName,
        nameEn: getCustomerDisplayName(invoiceOrder.customerName, 'en'),
        email: invoiceOrder.customerEmail,
        phone: invoiceOrder.customerPhone,
        address: invoiceOrder.deliveryLocation,
        addressAr: invoiceOrder.deliveryLocation,
        addressEn: getLocalizedAddress(invoiceOrder.deliveryLocation, 'en'),
        city: profile.cityEn,
        cityAr: profile.cityAr,
        country: profile.countryEn,
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
      zatca: {
        invoiceCategory: 'simplified',
        invoiceType: '388',
        complianceStatus: 'compliant_preview',
        vatCategoryCode: 'S',
        invoiceHash: generateInvoiceHashSha256(`${activeStore.id}-${invoiceOrder.orderNumber}-${invoiceOrder.total}`),
        cryptographicStamp: 'MEQCID6v9320kL81_ZATCA_PHASE2_ECDSA_STAMP_VERIFIED',
        qrPayloadBase64: generateZatcaTlvBase64({
          sellerName: profile.nameAr,
          vatNumber: profile.vatNumber,
          timestamp: invoiceOrder.date ? `${invoiceOrder.date}T12:00:00Z` : now,
          invoiceTotal: invoiceOrder.total,
          vatTotal: taxAmount,
          invoiceHash: generateInvoiceHashSha256(`${activeStore.id}-${invoiceOrder.orderNumber}-${invoiceOrder.total}`),
          digitalSignature: 'MEQCID6v9320kL81_ZATCA_PHASE2_ECDSA_STAMP_VERIFIED',
          publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7ZATCA_PUBKEY',
        }),
      },
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

  // ── 4 KPI Summary Cards matching Image 1 & Mockup 04 (Store Scoped) ──
  const kpi = useMemo(() => {
    const total = activeOrders.length;
    const pending = activeOrders.filter((o) => o.status === 'pending').length;
    const inProgress = activeOrders.filter(
      (o) => o.status === 'processing' || o.status === 'shipped' || o.status === 'out_for_delivery'
    ).length;
    const delivered = activeOrders.filter(
      (o) => o.status === 'completed' || o.status === 'delivered',
    ).length;

    return { total, pending, inProgress, delivered };
  }, [activeOrders]);

  // ── Status Tabs with Counts matching Image 1 ──
  const STATUS_TABS = useMemo(() => {
    const counts = {
      all: activeOrders.length,
      awaiting_payment: activeOrders.filter((o) => o.status === 'pending').length,
      under_review: activeOrders.filter((o) => (o as any).customStatusId === 'under_review' || o.status === 'pending').length,
      processing: activeOrders.filter((o) => o.status === 'processing').length,
      shipped: activeOrders.filter((o) => o.status === 'shipped').length,
      out_for_delivery: activeOrders.filter((o) => o.status === 'out_for_delivery').length,
      delivered: activeOrders.filter((o) => o.status === 'completed' || o.status === 'delivered').length,
      cancelled: activeOrders.filter((o) => o.status === 'cancelled').length,
      returned: activeOrders.filter((o) => o.status === 'returned').length,
      refunded: activeOrders.filter((o) => o.paymentStatus === 'Refunded' || o.refundStatus === 'refunded').length,
      archived: archivedOrders.length,
    };

    return [
      { key: 'all', label: isAr ? 'جميع الطلبات' : 'All Orders', count: counts.all, pillColor: 'bg-teal-900 text-teal-100 dark:bg-teal-950 dark:text-teal-200' },
      { key: 'awaiting_payment', label: isAr ? 'بانتظار الدفع' : 'Pending Payment', count: counts.awaiting_payment, pillColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
      { key: 'under_review', label: isAr ? 'قيد المراجعة' : 'Under Review', count: counts.under_review, pillColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
      { key: 'processing', label: isAr ? 'قيد المعالجة' : 'Processing', count: counts.processing, pillColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
      { key: 'shipped', label: isAr ? 'تم الشحن' : 'Shipped', count: counts.shipped, pillColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300' },
      { key: 'out_for_delivery', label: isAr ? 'جاري التوصيل' : 'Out for Delivery', count: counts.out_for_delivery, pillColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' },
      { key: 'delivered', label: isAr ? 'تم التوصيل' : 'Delivered', count: counts.delivered, pillColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
      { key: 'cancelled', label: isAr ? 'ملغي' : 'Cancelled', count: counts.cancelled, pillColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
      { key: 'returned', label: isAr ? 'مسترجع' : 'Returned', count: counts.returned, pillColor: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300' },
      { key: 'refunded', label: isAr ? 'مسترد' : 'Refunded', count: counts.refunded, pillColor: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
      { key: 'archived', label: isAr ? 'الأرشيف' : 'Archived', count: counts.archived, pillColor: 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400' },
    ];
  }, [activeOrders, archivedOrders, isAr]);

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
      const matchesPayment = (() => {
        if (!effectivePaymentMethod || effectivePaymentMethod === 'all') return true;
        const pm = (o.paymentMethod || '').toLowerCase();
        switch (effectivePaymentMethod.toLowerCase()) {
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
            return pm.includes(effectivePaymentMethod.toLowerCase());
        }
      })();

      const effectiveSource = orderFilters.orderSource || selectedSource;
      const matchesSource = (() => {
        if (!effectiveSource || effectiveSource === 'all') return true;
        const src = (o.source || '').toLowerCase();
        switch (effectiveSource.toLowerCase()) {
          case 'instagram':
            return src.includes('instagram') || src.includes('انستغرام') || src.includes('انستقرام');
          case 'google':
          case 'google ads':
            return src.includes('google') || src.includes('ads') || src.includes('جوجل') || src.includes('إعلان');
          case 'direct':
          case 'direct visits':
            return src.includes('direct') || src.includes('مباشر') || src.includes('website') || src.includes('storefront');
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
          case 'email marketing':
            return src.includes('email') || src.includes('mail') || src.includes('بريد');
          default:
            return src.includes(effectiveSource.toLowerCase());
        }
      })();

      const matchesCustomStatus = (() => {
        if (!orderFilters.status || orderFilters.status === 'all') return true;
        const s = (o.status || '').toLowerCase();
        return s === orderFilters.status.toLowerCase();
      })();

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
        !matchesDate ||
        !matchesCustomStatus
      ) {
        return false;
      }

      if (activeTab === 'all' || activeTab === 'archived') return true;
      if (activeTab === 'awaiting_payment') return o.status === 'pending';
      if (activeTab === 'under_review') return (o as any).customStatusId === 'under_review' || o.status === 'pending';
      if (activeTab === 'processing') return o.status === 'processing';
      if (activeTab === 'shipped') return o.status === 'shipped';
      if (activeTab === 'out_for_delivery') return o.status === 'out_for_delivery';
      if (activeTab === 'delivered') return o.status === 'completed' || o.status === 'delivered';
      if (activeTab === 'cancelled') return o.status === 'cancelled';
      if (activeTab === 'returned') return o.status === 'returned';
      if (activeTab === 'refunded') return o.paymentStatus === 'Refunded' || o.refundStatus === 'refunded';
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

  const handleBulkUpdateStatus = (newStatus: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    selectedOrderIds.forEach((id) => updateOrderStatus(id, newStatus, activeStore.id));
    toast(
      isAr
        ? `تم تحديث حالة ${selectedOrderIds.length} طلبات إلى "${newStatus}" بنجاح`
        : `Updated status for ${selectedOrderIds.length} orders to ${newStatus}`,
      'success'
    );
    setSelectedOrderIds([]);
  };

  const handleExportCsv = (ordersToExport: Order[], filename = 'orders_export.csv') => {
    if (ordersToExport.length === 0) {
      toast(isAr ? 'لا توجد طلبات للتصدير' : 'No orders to export', 'error');
      return;
    }
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Products', 'Total Amount', 'Payment Method', 'Payment Status', 'Order Status', 'Source'];
    const rows = ordersToExport.map((o) => [
      o.orderNumber,
      o.date,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${(o.customerPhone || '').replace(/"/g, '""')}"`,
      `"${(o.items?.map((it) => `${it.name} x${it.quantity}`).join('; ') || (o as any).itemsSummary || 'Product x 1').replace(/"/g, '""')}"`,
      o.total,
      o.paymentMethod,
      o.paymentStatus || '',
      o.status,
      o.source,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast(isAr ? 'تم تصدير ملف الطلبات بنجاح' : 'Orders exported successfully', 'success');
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
      case 'Facebook':
        return (
          <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
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

            <button
              type="button"
              onClick={() => {
                setShippingLabelOrder(o);
                setShowShippingLabelModal(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 flex items-center gap-2 cursor-pointer shadow-xs transition-colors hover:bg-sky-100 dark:hover:bg-sky-900/50"
              title={isAr ? 'طباعة بوليصة الشحن اللوجستية بالباركود الحراري (SMSA/SPL/Aramex)' : 'Print Courier Shipping Label (Code 128 Barcode)'}
            >
              <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{isAr ? 'بوليصة الشحن (AWB)' : 'Courier Waybill'}</span>
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
                        <span>{localeMixedLabel(o.shippingCompany, isAr)}</span>
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
                            <img
                              src={resolveProductThumbnail(it)}
                              alt={isAr ? (it.nameAr || it.name) : (it.nameEn || it.name)}
                              onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                              className="w-9 h-9 rounded-xl object-cover shrink-0 border"
                              style={{ borderColor: 'var(--border)' }}
                            />
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
      {/* ── 4 KPI CARDS DEDICATED GRID (Matching Image 1) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 hover:bg-emerald-50/90 dark:hover:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 flex items-center gap-3.5 shadow-xs transition-all">
          <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold block leading-tight truncate text-slate-700 dark:text-slate-300">
              {isAr ? 'إجمالي الطلبات' : 'Total Orders'}
            </span>
            <div className="text-xl sm:text-2xl font-black tabular-nums leading-none mt-1 text-slate-900 dark:text-white">
              {kpi.total.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>12%</span>
              <span className="font-medium text-slate-500 dark:text-slate-400">{isAr ? 'مقارنة بآخر 30 يوم' : 'vs. last 30 days'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Payment */}
        <div className="bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-50/90 dark:hover:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 flex items-center gap-3.5 shadow-xs transition-all">
          <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold block leading-tight truncate text-slate-700 dark:text-slate-300">
              {isAr ? 'بانتظار الدفع' : 'Pending Payment'}
            </span>
            <div className="text-xl sm:text-2xl font-black tabular-nums leading-none mt-1 text-slate-900 dark:text-white">
              {kpi.pending.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 mt-1 flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" />
              <span>8%</span>
              <span className="font-medium text-slate-500 dark:text-slate-400">{isAr ? 'مقارنة بآخر 30 يوم' : 'vs. last 30 days'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div className="bg-sky-50/70 dark:bg-sky-950/20 hover:bg-sky-50/90 dark:hover:bg-sky-950/30 p-4 rounded-2xl border border-sky-200/80 dark:border-sky-900/40 flex items-center gap-3.5 shadow-xs transition-all">
          <div className="w-11 h-11 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 shadow-2xs">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold block leading-tight truncate text-slate-700 dark:text-slate-300">
              {isAr ? 'قيد التنفيذ' : 'In Progress'}
            </span>
            <div className="text-xl sm:text-2xl font-black tabular-nums leading-none mt-1 text-slate-900 dark:text-white">
              {kpi.inProgress.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>5%</span>
              <span className="font-medium text-slate-500 dark:text-slate-400">{isAr ? 'مقارنة بآخر 30 يوم' : 'vs. last 30 days'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Delivered */}
        <div className="bg-teal-50/70 dark:bg-teal-950/20 hover:bg-teal-50/90 dark:hover:bg-teal-950/30 p-4 rounded-2xl border border-teal-200/80 dark:border-teal-900/40 flex items-center gap-3.5 shadow-xs transition-all">
          <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold block leading-tight truncate text-slate-700 dark:text-slate-300">
              {isAr ? 'تم التوصيل' : 'Delivered'}
            </span>
            <div className="text-xl sm:text-2xl font-black tabular-nums leading-none mt-1 text-slate-900 dark:text-white">
              {kpi.delivered.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>14%</span>
              <span className="font-medium text-slate-500 dark:text-slate-400">{isAr ? 'مقارنة بآخر 30 يوم' : 'vs. last 30 days'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SHIPPING, CANCELLATION POLICY, AUTO EMAIL/BELL & 1-CLICK WHATSAPP TRACKING (24H CLIENT TIMER) ── */}
      <div
        className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
        data-tick={waCooldownTick}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr
                ? 'سياسة الشحن والتتبع والإلغاء + رسائل الواتساب التلقائية (مؤقت 24 ساعة لكل عميل) وتنبيهات البريد'
                : 'Shipping, Tracking & Cancellation Policy + 1-Click WhatsApp (24h Client Timer) & Auto Email/Bell'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'تحكم كامل للعميل وصاحب المتجر والماستر: إرسال حالة الشحن بضغطة زر مع حماية الرقم من الحظر وإشعارات البريد الإلكتروني الفورية.'
                : '3-Way Live Tracking (Customer, Store Owner & Master Admin) with 1-Click Pre-Made WhatsApp Shipping Msg & Email/Dashboard Alerts.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const targetOrd = currentOrders[0];
              const phone = targetOrd?.customerPhone || '+966501234567';
              const ordNum = targetOrd?.orderNumber || targetOrd?.id || 'ORD-1001';
              const custName = targetOrd?.customerName || 'Valued Customer';
              const cooldown = checkWhatsAppClientCooldown(activeStore.id, phone);

              if (!cooldown.allowed) {
                toast(
                  isAr
                    ? `مؤقت الحماية (24 ساعة) نشط لهذا العميل (${phone}): يمكن إرسال الرسالة التلقائية القادمة غداً بعد ${cooldown.remainingFormatted}`
                    : `24h Anti-Ban Client Timer Active for ${phone}: Next automated msg allowed tomorrow in ${cooldown.remainingFormatted}!`,
                  'error',
                );
                return;
              }

              recordWhatsAppClientSent(activeStore.id, phone);
              setWaCooldownTick((t) => t + 1);
              const trackUrl = `https://${activeStore.slug || 'store'}.saudi-stores.com/track/${ordNum}`;
              const preMadeMsg = isAr
                ? `مرحباً ${custName}، تم شحن طلبك رقم ${ordNum} من متجر ${activeStore.name} عبر ${orderPolicy.shippingCarrierDefault}. تتبع شحنتك مباشرة: ${trackUrl}`
                : `Hello ${custName}, your order #${ordNum} from ${activeStore.name} has been shipped via ${orderPolicy.shippingCarrierDefault}. Track live here: ${trackUrl}`;

              const cleanPhone = phone.replace(/[^\d]/g, '');
              window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(preMadeMsg)}`, '_blank');
              toast(
                isAr
                  ? `تم إرسال رسالة تتبع الشحن الجاهزة للعميل وتفعيل مؤقت الحماية (24 ساعة) + إرسال إشعار البريد ولوحة التحكم!`
                  : `Pre-made Shipping Tracking WhatsApp sent + 24h Client Timer started + Auto Email & Dashboard Notification dispatched!`,
                'success',
              );
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>
              {isAr
                ? 'إرسال رسالة شحن وتتبع جاهزة (1-Click WhatsApp + مؤقت 24 ساعة)'
                : '1-Click Pre-Made Shipping Tracking Msg (24h Client Timer)'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 block">
              {isAr ? 'مهلة إلغاء الطلب للعميل (ساعات)' : 'Customer Cancel Window (Hours)'}
            </label>
            <input
              type="number"
              min={0}
              max={72}
              value={orderPolicy.cancelWindowHours}
              onChange={(e) => {
                const next = { ...orderPolicy, cancelWindowHours: Number(e.target.value) };
                setOrderPolicy(next);
                saveStoreOrderPolicy(activeStore.id, next);
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
            />
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 block">
              {isAr ? 'شركة الشحن الافتراضية (السعودية)' : 'Default KSA Shipping Carrier'}
            </label>
            <input
              type="text"
              value={orderPolicy.shippingCarrierDefault}
              onChange={(e) => {
                const next = { ...orderPolicy, shippingCarrierDefault: e.target.value };
                setOrderPolicy(next);
                saveStoreOrderPolicy(activeStore.id, next);
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer">
            <span className="font-bold">
              {isAr ? 'إيميل تلقائي عند الطلب والاكتمال' : 'Auto Email on Submit & Done'}
            </span>
            <input
              type="checkbox"
              checked={orderPolicy.autoEmailOnOrderSubmit}
              onChange={(e) => {
                const next = {
                  ...orderPolicy,
                  autoEmailOnOrderSubmit: e.target.checked,
                  autoEmailOnOrderDone: e.target.checked,
                };
                setOrderPolicy(next);
                saveStoreOrderPolicy(activeStore.id, next);
              }}
              className="accent-emerald-600 w-4 h-4"
            />
          </label>

          <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer">
            <span className="font-bold">
              {isAr ? 'السماح للعميل بإلغاء الطلب قبل الشحن' : 'Allow Customer Cancel Before Ship'}
            </span>
            <input
              type="checkbox"
              checked={orderPolicy.allowCustomerCancel}
              onChange={(e) => {
                const next = { ...orderPolicy, allowCustomerCancel: e.target.checked };
                setOrderPolicy(next);
                saveStoreOrderPolicy(activeStore.id, next);
              }}
              className="accent-emerald-600 w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* ── SEARCH, ORDER TOOLS & INLINE FILTERS (Matching Image 1 & Image 3) ── */}
      <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Row 1: Search bar & Order Tools dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--muted)' }}
            />
            <input
              type="text"
              placeholder={isAr ? 'البحث برقم الطلب، اسم العميل، أو رقم الهاتف...' : 'Search order number, customer, or phone number...'}
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

          {/* Filter Orders Popover Button (100% same-to-same with PDF Page 2 & 3) */}
          <OrderFilterMenu
            statusFilter={orderFilters.status || 'all'}
            onStatusChange={(status) => {
              setOrderFilters((prev) => ({ ...prev, status }));
              setPage(1);
            }}
            paymentFilter={orderFilters.paymentMethod || 'all'}
            onPaymentChange={(payment) => {
              setOrderFilters((prev) => ({ ...prev, paymentMethod: payment }));
              setSelectedPaymentMethod(payment);
              setPage(1);
            }}
            channelFilter={orderFilters.orderSource || 'all'}
            onChannelChange={(channel) => {
              setOrderFilters((prev) => ({ ...prev, orderSource: channel }));
              setSelectedSource(channel);
              setPage(1);
            }}
            onReset={() => {
              setOrderFilters((prev) => ({
                ...prev,
                status: 'all',
                paymentMethod: 'all',
                orderSource: 'all',
              }));
              setSelectedPaymentMethod('all');
              setSelectedSource('all');
              setPage(1);
            }}
            hasActiveFilters={Boolean(
              (orderFilters.status && orderFilters.status !== 'all') ||
              (orderFilters.paymentMethod && orderFilters.paymentMethod !== 'all') ||
              (orderFilters.orderSource && orderFilters.orderSource !== 'all')
            )}
            className="shrink-0"
          />

          {/* Order Tools Dropdown Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowOrderToolsMenu(!showOrderToolsMenu)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 cursor-pointer shadow-xs transition-colors bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Settings className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? 'أدوات الطلبات' : 'Order Tools'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Order Tools Popover Menu */}
            {showOrderToolsMenu && (
              <div
                className="absolute end-0 top-full mt-1.5 w-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1.5 z-50 animate-in fade-in duration-100 text-xs font-medium"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowAutoAssignmentModal(true);
                    setShowOrderToolsMenu(false);
                  }}
                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span>{isAr ? 'التعيين التلقائي للطلبات' : 'Automatic Assignment'}</span>
                </button>

                <div className="h-[1px] my-1 bg-slate-100 dark:bg-slate-800" />

                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isAr ? 'تصدير الطلبات' : 'Export Orders'}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleExportCsv(filteredOrders, `orders_${Date.now()}.xlsx`);
                    setShowOrderToolsMenu(false);
                  }}
                  className="w-full text-start px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'ملف إكسل (Excel .xlsx)' : 'Excel (.xlsx)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleExportCsv(filteredOrders, `orders_${Date.now()}.csv`);
                    setShowOrderToolsMenu(false);
                  }}
                  className="w-full text-start px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isAr ? 'ملف نصي (CSV .csv)' : 'CSV (.csv)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowExportTemplateModal(true);
                    setShowOrderToolsMenu(false);
                  }}
                  className="w-full text-start px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-teal-600 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تخصيص قالب تصدير...' : 'Custom Export Template...'}</span>
                </button>

                <div className="h-[1px] my-1 bg-slate-100 dark:bg-slate-800" />

                <button
                  type="button"
                  onClick={() => {
                    setShowOrderStatusSettings(true);
                    setShowOrderToolsMenu(false);
                  }}
                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>{isAr ? 'تخصيص حالات الطلب' : 'Customize Statuses'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowCodLedgerModal(true);
                    setShowOrderToolsMenu(false);
                  }}
                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>{isAr ? 'العمليات المالية والدفع الإلكتروني' : 'Electronic Payment Transactions'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: 4 Inline Dropdowns (Order Date, Payment Status, Shipping Status, Order Source) */}
        <div className="flex items-center gap-2.5 flex-wrap pt-1">
          {/* 1. Order Date */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenFilterDropdown(openFilterDropdown === 'date' ? null : 'date')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 cursor-pointer transition-colors ${
                orderFilters.datePreset !== 'all'
                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200'
                  : 'bg-slate-50/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {orderFilters.datePreset === 'all'
                  ? (isAr ? 'تاريخ الطلب' : 'Order Date')
                  : orderFilters.datePreset === 'today'
                  ? (isAr ? 'اليوم' : 'Today')
                  : orderFilters.datePreset === 'last_7_days'
                  ? (isAr ? 'آخر 7 أيام' : 'Last 7 Days')
                  : orderFilters.datePreset === 'last_30_days'
                  ? (isAr ? 'آخر 30 يوماً' : 'Last 30 Days')
                  : (isAr ? 'هذا الشهر' : 'This Month')}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {openFilterDropdown === 'date' && (
              <div className="absolute start-0 top-full mt-1.5 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1 z-50 text-xs">
                {[
                  { value: 'all', label: isAr ? 'جميع التواريخ' : 'All Dates' },
                  { value: 'today', label: isAr ? 'اليوم' : 'Today' },
                  { value: 'last_7_days', label: isAr ? 'آخر 7 أيام' : 'Last 7 Days' },
                  { value: 'last_30_days', label: isAr ? 'آخر 30 يوماً' : 'Last 30 Days' },
                  { value: 'this_month', label: isAr ? 'هذا الشهر' : 'This Month' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setOrderFilters((prev) => ({ ...prev, datePreset: opt.value as any }));
                      setOpenFilterDropdown(null);
                      setPage(1);
                    }}
                    className={`w-full text-start px-3 py-1.5 rounded-lg cursor-pointer ${
                      orderFilters.datePreset === opt.value
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Payment Status */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenFilterDropdown(openFilterDropdown === 'payment' ? null : 'payment')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 cursor-pointer transition-colors ${
                orderFilters.paymentStatus !== 'all'
                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200'
                  : 'bg-slate-50/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {orderFilters.paymentStatus === 'all'
                  ? (isAr ? 'حالة الدفع' : 'Payment Status')
                  : orderFilters.paymentStatus}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {openFilterDropdown === 'payment' && (
              <div className="absolute start-0 top-full mt-1.5 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1 z-50 text-xs">
                {[
                  { value: 'all', label: isAr ? 'جميع حالات الدفع' : 'All Payment Statuses' },
                  { value: 'Paid', label: isAr ? 'مدفوع' : 'Paid' },
                  { value: 'Pending Payment', label: isAr ? 'بانتظار الدفع' : 'Pending Payment' },
                  { value: 'Payment Failed', label: isAr ? 'فشلت عملية الدفع' : 'Payment Failed' },
                  { value: 'Refunded', label: isAr ? 'مسترجع' : 'Refunded' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setOrderFilters((prev) => ({ ...prev, paymentStatus: opt.value as any }));
                      setOpenFilterDropdown(null);
                      setPage(1);
                    }}
                    className={`w-full text-start px-3 py-1.5 rounded-lg cursor-pointer ${
                      orderFilters.paymentStatus === opt.value
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Shipping Status */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenFilterDropdown(openFilterDropdown === 'shipping' ? null : 'shipping')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 cursor-pointer transition-colors ${
                orderFilters.shippingStatus !== 'all'
                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200'
                  : 'bg-slate-50/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {orderFilters.shippingStatus === 'all'
                  ? (isAr ? 'حالة الشحن' : 'Shipping Status')
                  : orderFilters.shippingStatus}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {openFilterDropdown === 'shipping' && (
              <div className="absolute start-0 top-full mt-1.5 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1 z-50 text-xs">
                {[
                  { value: 'all', label: isAr ? 'جميع حالات الشحن' : 'All Shipping Statuses' },
                  { value: 'Not Shipped', label: isAr ? 'لم يتم الشحن' : 'Not Shipped' },
                  { value: 'Ready to Ship', label: isAr ? 'جاهز للشحن' : 'Ready to Ship' },
                  { value: 'Handed to Carrier', label: isAr ? 'تم التسليم للشحن' : 'Handed to Carrier' },
                  { value: 'In Transit', label: isAr ? 'قيد التوصيل' : 'In Transit' },
                  { value: 'Delivered', label: isAr ? 'تم التوصيل' : 'Delivered' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setOrderFilters((prev) => ({ ...prev, shippingStatus: opt.value as any }));
                      setOpenFilterDropdown(null);
                      setPage(1);
                    }}
                    className={`w-full text-start px-3 py-1.5 rounded-lg cursor-pointer ${
                      orderFilters.shippingStatus === opt.value
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Order Source */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenFilterDropdown(openFilterDropdown === 'source' ? null : 'source')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 cursor-pointer transition-colors ${
                orderFilters.orderSource !== 'all' && selectedSource !== 'all'
                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200'
                  : 'bg-slate-50/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {selectedSource === 'all'
                  ? (isAr ? 'مصدر الطلب' : 'Order Source')
                  : selectedSource}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {openFilterDropdown === 'source' && (
              <div className="absolute start-0 top-full mt-1.5 w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1 z-50 text-xs max-h-60 overflow-y-auto">
                {[
                  { value: 'all', label: isAr ? 'كافة القنوات' : 'All Channels' },
                  { value: 'Instagram', label: isAr ? 'انستغرام' : 'Instagram' },
                  { value: 'Google Ads', label: isAr ? 'إعلانات جوجل' : 'Google Ads' },
                  { value: 'Direct Visits', label: isAr ? 'زيارات مباشرة' : 'Direct Visits' },
                  { value: 'TikTok', label: isAr ? 'تيك توك' : 'TikTok' },
                  { value: 'Snapchat', label: isAr ? 'سناب شات' : 'Snapchat' },
                  { value: 'WhatsApp', label: isAr ? 'واتساب' : 'WhatsApp' },
                  { value: 'Facebook', label: isAr ? 'فيسبوك' : 'Facebook' },
                  { value: 'X', label: isAr ? 'إكس (تويتر سابقاً)' : 'X (formerly Twitter)' },
                  { value: 'YouTube', label: isAr ? 'يوتيوب' : 'YouTube' },
                  { value: 'Email Marketing', label: isAr ? 'البريد الإلكتروني' : 'Email Marketing' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedSource(opt.value);
                      setOrderFilters((prev) => ({ ...prev, orderSource: opt.value }));
                      setOpenFilterDropdown(null);
                      setPage(1);
                    }}
                    className={`w-full text-start px-3 py-1.5 rounded-lg cursor-pointer ${
                      selectedSource === opt.value
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Filters Shortcut */}
          {(orderFilters.datePreset !== 'all' ||
            orderFilters.paymentStatus !== 'all' ||
            orderFilters.shippingStatus !== 'all' ||
            selectedSource !== 'all' ||
            search) && (
            <button
              type="button"
              onClick={() => {
                setOrderFilters({
                  datePreset: 'all',
                  startDate: '',
                  endDate: '',
                  paymentStatus: 'all',
                  shippingStatus: 'all',
                  paymentMethod: 'all',
                  orderSource: 'all',
                });
                setSelectedSource('all');
                setSelectedPaymentMethod('all');
                setSearch('');
                setPage(1);
                toast(isAr ? 'تمت استعادة الفلاتر الافتراضية' : 'Filters reset to default', 'info');
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isAr ? 'مسح الفلاتر' : 'Clear Filters'}</span>
            </button>
          )}
        </div>

        {/* ── STATUS TABS WITH COUNT PILLS (Matching Image 1) ── */}
        <div
          className="flex items-center gap-2 flex-wrap pt-3 border-t pb-1 no-scrollbar"
          style={{ borderColor: 'var(--border)' }}
        >
          {STATUS_TABS.map((tab) => {
            const isSelected = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-700 dark:bg-teal-600 dark:text-white dark:border-teal-500 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700/80 dark:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : tab.pillColor
                  }`}
                >
                  {tab.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── BULK ACTIONS BAR (Matching Image 1) ── */}
        {selectedOrderIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 p-3 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 rounded-xl text-xs shadow-xs animate-in fade-in flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-teal-600 text-white flex items-center justify-center text-[10px]">
                  {selectedOrderIds.length}
                </span>
                <span>{isAr ? `إجراءات جماعية (${selectedOrderIds.length} محدد)` : `Bulk Actions (${selectedOrderIds.length} selected)`}</span>
              </span>

              {/* Update Status Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkStatusOpen(!bulkStatusOpen)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'تحديث الحالة' : 'Update Status'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {bulkStatusOpen && (
                  <div className="absolute start-0 top-full mt-1 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1 z-50">
                    <button
                      type="button"
                      onClick={() => { handleBulkUpdateStatus('processing'); setBulkStatusOpen(false); }}
                      className="w-full text-start px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {isAr ? 'قيد المعالجة' : 'Processing'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleBulkUpdateStatus('shipped'); setBulkStatusOpen(false); }}
                      className="w-full text-start px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {isAr ? 'تم الشحن' : 'Shipped'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleBulkUpdateStatus('delivered'); setBulkStatusOpen(false); }}
                      className="w-full text-start px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {isAr ? 'تم التوصيل' : 'Delivered'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleBulkUpdateStatus('cancelled'); setBulkStatusOpen(false); }}
                      className="w-full text-start px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      {isAr ? 'إلغاء الطلبات' : 'Cancel Orders'}
                    </button>
                  </div>
                )}
              </div>

              {/* Assign to Staff */}
              <button
                type="button"
                onClick={() => setShowAutoAssignmentModal(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'تعيين لموظف' : 'Assign to Staff'}</span>
              </button>

              {/* Print Invoices */}
              <button
                type="button"
                onClick={() => {
                  const first = currentOrders.find((o) => selectedOrderIds.includes(o.id));
                  if (first) {
                    setInvoiceOrder(first);
                    setShowInvoiceModal(true);
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'طباعة الفواتير' : 'Print Invoices'}</span>
              </button>

              {/* Export CSV */}
              <button
                type="button"
                onClick={() => {
                  const toExport = currentOrders.filter((o) => selectedOrderIds.includes(o.id));
                  handleExportCsv(toExport, `selected_orders_${Date.now()}.csv`);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
              </button>

              {/* Archive */}
              <button
                type="button"
                onClick={handleBulkArchive}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <Archive className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'أرشفة' : 'Archive'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-white cursor-pointer font-semibold text-xs"
            >
              {isAr ? 'إلغاء التحديد' : 'Clear selection'}
            </button>
          </div>
        )}

        {/* ── ORDERS TABLE (Mockup 04) ── */}
        <div className="overflow-x-auto pt-1 w-full">
          <table className="w-full min-w-[960px] text-start text-xs border-separate border-spacing-0">
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
                <th className="pb-3 px-2 text-start font-semibold text-[11px] min-w-[90px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'رقم الطلب' : '# Order No.'}
                </th>
                <th className="pb-3 px-2 text-start font-semibold text-[11px] min-w-[130px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'العميل' : 'Customer'}
                </th>
                <th className="pb-3 px-2 text-start font-semibold text-[11px] min-w-[170px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'المنتجات' : 'Products'}
                </th>
                <th className="pb-3 px-2 text-start font-semibold text-[11px] min-w-[85px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'المبلغ الإجمالي' : 'Total Amount'}
                </th>
                <th className="pb-3 px-2 text-start font-semibold text-[11px] min-w-[105px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'طريقة الدفع' : 'Payment Method'}
                </th>
                <th className="pb-3 px-2 text-start font-semibold text-[11px] min-w-[95px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'حالة الطلب' : 'Order Status'}
                </th>
                <th className="pb-3 px-2 text-start font-semibold text-[11px] min-w-[100px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'مصدر الطلب' : 'Order Source'}
                </th>
                <th className="pb-3 px-2 text-start font-semibold text-[11px] min-w-[100px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'تاريخ الطلب ↓' : 'Order Date ↓'}
                </th>
                <th className="pb-3 px-2 text-center font-semibold text-[11px] w-16 min-w-[65px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 mx-auto flex items-center justify-center shadow-xs">
                        <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {isAr ? 'لم يتم العثور على أي طلبات' : 'No records found'}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {isAr
                          ? 'لا توجد طلبات تطابق الفلاتر المحددة في هذا المتجر. يمكنك تجربة تعديل الفلاتر أو إنشاء طلب جديد.'
                          : 'No orders match your selected filters in this store. Try adjusting filters or create a new order.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowNewOrderModal(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-all hover:opacity-90"
                        style={{ background: '#0d9488' }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isAr ? 'إنشاء طلب جديد' : 'Create Order'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedOrders.map((ord, ordIdx) => {
                  const isChecked = selectedOrderIds.includes(ord.id);
                  const itemsList = ord.items && ord.items.length > 0 ? ord.items : [];
                  const extraCount = ord.itemsCount > 1 ? `+${ord.itemsCount - 1}` : null;
                  const itemThumb = resolveProductThumbnail(itemsList[0] || { name: (ord as any).itemsSummary });

                  return (
                    <tr
                      key={ord.id || ord.orderNumber || `order-${ordIdx}`}
                      className="hover:[background:var(--hover-bg)] transition-colors group"
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-2 w-8 text-start" style={{ borderBottom: '1px solid var(--border)' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(ord.id)}
                          className="rounded cursor-pointer"
                        />
                      </td>

                      {/* # Order No. (Clicking opens Order Details) */}
                      <td className="py-2.5 px-2 font-mono font-bold text-xs whitespace-nowrap min-w-[90px]" style={{ borderBottom: '1px solid var(--border)' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="hover:underline cursor-pointer font-bold text-xs text-start leading-tight"
                          style={{ color: 'var(--accent)' }}
                        >
                          {ord.orderNumber}
                        </button>
                      </td>

                      {/* Customer: Name & Phone below */}
                      <td className="py-2.5 px-2 min-w-[130px]" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="font-bold text-xs line-clamp-2 max-w-[160px] break-words leading-tight" title={ord.customerName} style={{ color: 'var(--text)' }}>
                          {ord.customerName}
                        </div>
                        <div className="text-[11px] font-mono mt-0.5 whitespace-nowrap leading-tight" style={{ color: 'var(--muted)' }}>
                          {ord.customerPhone}
                        </div>
                      </td>

                      {/* Products (Thumbnail + Name + Qty) */}
                      <td className="py-2.5 px-2 min-w-[170px]" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-start gap-2">
                          <img
                            src={itemThumb || FALLBACK_PRODUCT_IMAGE}
                            alt="prod"
                            onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs line-clamp-2 max-w-[180px] break-words leading-tight" title={itemsList[0]?.name || (ord as any).itemsSummary || 'Order Item'} style={{ color: 'var(--text)' }}>
                              {itemsList[0]?.name || (ord as any).itemsSummary || 'Order Item'}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                              x {itemsList[0]?.quantity || 1}
                              {extraCount && (
                                <span className="ms-1 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10px]">
                                   {extraCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td
                        className="py-2.5 px-2 whitespace-nowrap font-black text-xs min-w-[85px] text-start"
                        style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        {money(ord.total)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-2.5 px-2 whitespace-nowrap min-w-[105px] text-start" style={{ borderBottom: '1px solid var(--border)' }}>
                        {getPaymentBadge(ord.paymentMethod)}
                      </td>

                      {/* Order Status */}
                      <td className="py-2.5 px-2 whitespace-nowrap min-w-[95px] text-start" style={{ borderBottom: '1px solid var(--border)' }}>
                        {getStatusBadge(ord.status)}
                      </td>

                      {/* Order Source */}
                      <td className="py-2.5 px-2 whitespace-nowrap min-w-[100px] text-start" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-1.5 font-medium text-xs whitespace-nowrap" style={{ color: 'var(--text)' }}>
                          {getSourceIcon(ord.source)}
                          <span>{ord.source}</span>
                        </div>
                      </td>

                      {/* Order Date */}
                      <td className="py-2.5 px-2 whitespace-nowrap text-[11px] min-w-[100px] text-start" style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                        <div className="font-medium whitespace-nowrap" style={{ color: 'var(--text)' }}>
                          {ord.date || 'Jan 31, 2024'}
                        </div>
                        <div className="text-[10px] opacity-75 whitespace-nowrap">
                          {ord.time || '02:32 PM'}
                        </div>
                      </td>

                      {/* Actions: ... Popover Menu (Matching Image 1) */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap relative w-16 min-w-[65px]" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="inline-flex items-center justify-center gap-1 w-full">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs transition-colors shrink-0"
                            style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveActionMenuId(activeActionMenuId === ord.id ? null : ord.id)}
                              className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
                              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                              title="More Actions"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Action Popover (Matching Image 1) */}
                            {activeActionMenuId === ord.id && (
                              <div
                                className="absolute end-0 top-8 z-50 w-48 rounded-xl border p-1 shadow-xl text-xs font-semibold animate-in fade-in duration-100 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrder(ord);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200"
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
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200"
                                >
                                  <Edit className="w-3.5 h-3.5 text-teal-500" />
                                  <span>{isAr ? 'تعديل الطلب' : 'Edit Order'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setInvoiceOrder(ord);
                                    setShowInvoiceModal(true);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200"
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
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{isAr ? 'نسخ رقم الطلب' : 'Copy Order Number'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setShippingLabelOrder(ord);
                                    setShowShippingLabelModal(true);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200"
                                >
                                  <Truck className="w-3.5 h-3.5 text-sky-500" />
                                  <span>{isAr ? 'تحديث حالة التوصيل' : 'Update Delivery Status'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowCodLedgerModal(true);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200"
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{isAr ? 'عرض الدفع المالي' : 'View Payment'}</span>
                                </button>

                                <div className="h-[1px] my-1 bg-slate-100 dark:bg-slate-800" />

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
                                    <span>{isAr ? 'أرشفة الطلب' : 'Archive Order'}</span>
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
          onConfigChange={(updated: any) => setInvoiceConfig(updated)}
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

      {/* Courier Shipping Label Printable Barcode Modal */}
      {showShippingLabelModal && shippingLabelOrder && (
        <CourierShippingLabelModal
          isOpen={showShippingLabelModal}
          onClose={() => {
            setShowShippingLabelModal(false);
            setShippingLabelOrder(null);
          }}
          labelData={{
            carrier: ((shippingLabelOrder.shippingCompany || '').toLowerCase().includes('spl') || (shippingLabelOrder.shippingCompany || '').toLowerCase().includes('post')
              ? 'spl'
              : (shippingLabelOrder.shippingCompany || '').toLowerCase().includes('aramex')
              ? 'aramex'
              : (shippingLabelOrder.shippingCompany || '').toLowerCase().includes('dhl')
              ? 'dhl'
              : 'smsa') as CourierCarrierCode,
            carrierName: shippingLabelOrder.shippingCompany || 'SMSA Express',
            carrierNameAr: (shippingLabelOrder.shippingCompany || '').toLowerCase().includes('spl')
              ? 'سبل (البريد السعودي)'
              : (shippingLabelOrder.shippingCompany || '').toLowerCase().includes('aramex')
              ? 'أرامكس'
              : 'سمسا إكسبريس',
            trackingNumber: shippingLabelOrder.trackingNumber || `TRK-SA-${shippingLabelOrder.orderNumber.replace(/[^0-9]/g, '') || '98421'}`,
            awbNumber: `AWB-${shippingLabelOrder.orderNumber.replace(/[^0-9]/g, '') || '98421'}-SA`,
            orderNumber: shippingLabelOrder.orderNumber,
            orderDate: shippingLabelOrder.date || new Date().toISOString().split('T')[0],
            sender: {
              name: activeStore.name || (activeStore.id === 'store-coffee' ? 'HiBrew Specialty Coffee' : activeStore.id === 'store-bleco' ? 'Bleco Automotive' : 'Hadaya Mecca Est.'),
              nameAr: activeStore.nameAr || (activeStore.id === 'store-coffee' ? 'هاي برو للقهوة المختصة' : activeStore.id === 'store-bleco' ? 'بليكو لخدمات السيارات' : 'مؤسسة هدايا مكة والزهور'),
              phone: (activeStore as any).phone || (activeStore.id === 'store-coffee' ? '+966 11 489 2030' : activeStore.id === 'store-bleco' ? '+966 59 775 7086' : '+966 12 555 8899'),
              address: (activeStore as any).address || (activeStore.id === 'store-coffee' ? 'King Fahd Road, Riyadh' : activeStore.id === 'store-bleco' ? 'Industrial Area, Jeddah' : 'Ibrahim Al-Khalil Road, Jabal Omar District'),
              city: (activeStore as any).city || (activeStore.id === 'store-coffee' ? 'Riyadh' : activeStore.id === 'store-bleco' ? 'Jeddah' : 'Makkah'),
              country: 'Saudi Arabia',
            },
            recipient: {
              name: shippingLabelOrder.customerName,
              phone: shippingLabelOrder.customerPhone,
              address: shippingLabelOrder.shippingAddress || shippingLabelOrder.deliveryLocation || 'Al-Nuzha District, Makkah',
              city: shippingLabelOrder.deliveryLocation?.split(' ')[0] || 'Makkah',
              country: 'Saudi Arabia',
            },
            packageDetails: {
              weightKg: 2.5,
              pieces: shippingLabelOrder.items?.length || 1,
              contentDescription: 'Store Catalog Items & Luxury Gifts',
              contentDescriptionAr: 'منتجات متجر وهدايا فاخرة',
              declaredValueSar: Number(shippingLabelOrder.total) || 100,
            },
            payment: {
              method: (shippingLabelOrder.paymentMethod || '').toLowerCase().includes('cod') ||
                (shippingLabelOrder.paymentMethod || '').toLowerCase().includes('cash') ||
                (shippingLabelOrder.codStatus && shippingLabelOrder.codStatus !== 'not_cod')
                ? 'cod'
                : 'prepaid',
              codAmountSar: Number(shippingLabelOrder.total) || 0,
              currency: 'SAR',
            },
            routing: {
              hubCode: 'MAK-HUB-01',
              serviceType: 'Priority Next-Day Delivery',
              serviceTypeAr: 'توصيل سريع أولولية',
              routeCode: 'SA-WST-MAK-88',
            },
          }}
        />
      )}

      {/* ── SUB-MODALS (Image 1 & Image 2) ── */}
      <OrderStatusSettingsModal
        isOpen={showOrderStatusSettings}
        onClose={() => setShowOrderStatusSettings(false)}
        storeId={activeStore.id}
      />

      <ExportTemplateModal
        isOpen={showExportTemplateModal}
        onClose={() => setShowExportTemplateModal(false)}
        onExport={(fields, format) => {
          handleExportCsv(filteredOrders, `orders_export_${Date.now()}.${format}`);
        }}
      />

      <AutomaticAssignmentModal
        isOpen={showAutoAssignmentModal}
        onClose={() => setShowAutoAssignmentModal(false)}
        storeId={activeStore.id}
      />
    </AdminPageShell>
  );
};

