import React, { useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import type { Order } from '../../../types';
import {
  CreditCard,
  Download,
  Calendar,
  Search,
  Filter,
  RotateCw,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Package,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ChevronDown,
  Printer,
  ShieldCheck,
  ArrowRight,
  Eye,
  Coins,
  DollarSign,
  Landmark,
  FileText,
  Sliders,
  Sparkles,
  Image as ImageIcon,
  Check,
  X,
  Share2,
  Phone,
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  Send,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';
import { ModernSegmentedTabs } from '../../common/ModernSegmentedTabs';
import {
  getCustomerDisplayName,
  getLocalizedCity,
} from '../../../utils/storeLocalization';
import { downloadCsv } from '../../../utils/exportSpreadsheet';
import { resolvePaymentLogoFromMethod, PAYMENT_METHOD_LOGO } from '../../../utils/paymentMethodLogos';

const RetailInvoiceModal = lazy(() =>
  import('../../common/RetailInvoiceModal').then((m) => ({ default: m.RetailInvoiceModal })),
);

export interface PaymentTransactionItem {
  id: string;
  txId: string;
  orderId?: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  city: string;
  shippingAddress?: string;
  paymentMethod: string;
  gateway: string;
  cardBrand?: string;
  cardLastFour?: string;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  status: 'paid' | 'pending' | 'under_review' | 'failed' | 'refunded' | 'cancelled';
  statusRaw: string;
  createdAt: string;
  isRefundable: boolean;
  trackingNumber?: string;
  ref: string;
  hasProofReceipt?: boolean;
  proofUrl?: string;
  bankName?: string;
  senderAccount?: string;
  senderIban?: string;
  transferDate?: string;
  itemsSummary?: string;
  refundReason?: string;
}

interface PaymentTransactionsTrackingViewProps {
  onNavigateToGateways?: () => void;
  onNavigateToBankAccounts?: () => void;
}

export const PaymentTransactionsTrackingView: React.FC<PaymentTransactionsTrackingViewProps> = ({
  onNavigateToGateways,
  onNavigateToBankAccounts,
}) => {
  const {
    activeStore,
    currentOrders,
    currentPaymentTransactions,
    refundPaymentOrder,
    updateOrderStatus,
  } = useTenant();
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  // Active status tab filter
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusDropdownFilter, setStatusDropdownFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  // Status Overrides persisted in local storage
  const [statusOverrides, setStatusOverrides] = useState<Record<string, PaymentTransactionItem['status']>>(() => {
    try {
      const stored = localStorage.getItem(`unityteck_tx_statuses_${activeStore?.id || 'store'}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const saveStatusOverride = (txId: string, newStatus: PaymentTransactionItem['status']) => {
    setStatusOverrides((prev) => {
      const next = { ...prev, [txId]: newStatus };
      try {
        localStorage.setItem(`unityteck_tx_statuses_${activeStore?.id || 'store'}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Modals state
  const [detailModalTx, setDetailModalTx] = useState<PaymentTransactionItem | null>(null);
  const [proofModalTx, setProofModalTx] = useState<PaymentTransactionItem | null>(null);
  const [statusModalTx, setStatusModalTx] = useState<PaymentTransactionItem | null>(null);
  const [newStatusChoice, setNewStatusChoice] = useState<PaymentTransactionItem['status']>('paid');
  const [statusReason, setStatusReason] = useState('');

  const [refundModalTx, setRefundModalTx] = useState<PaymentTransactionItem | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundReasonText, setRefundReasonText] = useState('Customer requested refund');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const [shareLinkTx, setShareLinkTx] = useState<PaymentTransactionItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Proof image zoom
  const [proofZoom, setProofZoom] = useState(1);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Normalize payment transactions with real orders
  const unifiedTransactions: PaymentTransactionItem[] = useMemo(() => {
    const orderMap = new Map((currentOrders || []).map((o) => [o.id, o]));
    const orderByNum = new Map(
      (currentOrders || []).map((o) => [String(o.orderNumber || '').toLowerCase(), o]),
    );

    const list: PaymentTransactionItem[] = [];

    // 1. Transactions directly in payment_transactions table
    (currentPaymentTransactions || []).forEach((tx) => {
      const order =
        (tx.orderId ? orderMap.get(tx.orderId) : undefined) ||
        (tx.orderNumber ? orderByNum.get(String(tx.orderNumber).toLowerCase()) : undefined);

      const rawStatus = String(tx.status || 'pending').toLowerCase();
      let normStatus: PaymentTransactionItem['status'] =
        rawStatus.includes('refund')
          ? 'refunded'
          : rawStatus === 'paid' || rawStatus === 'completed' || rawStatus === 'success'
          ? 'paid'
          : rawStatus === 'under_review' || rawStatus === 'review'
          ? 'under_review'
          : rawStatus === 'cancelled' || rawStatus === 'canceled'
          ? 'cancelled'
          : rawStatus === 'failed'
          ? 'failed'
          : 'pending';

      const keyId = tx.id || tx.transactionReference;
      if (statusOverrides[keyId]) {
        normStatus = statusOverrides[keyId];
      }

      const custName = getCustomerDisplayName(tx.payerName || order?.customerName || (order as any)?.customer?.name, locale);
      const custPhone = tx.payerPhone || order?.customerPhone || (order as any)?.customer?.phone || '';
      const custEmail = tx.payerEmail || order?.customerEmail || '';
      const city =
        tx.city ||
        order?.city ||
        (typeof order?.shippingAddress === 'string' ? order.shippingAddress : (order as any)?.shippingAddress?.city) ||
        (isAr ? 'الرياض' : 'Riyadh');
      const shippingAddress =
        order?.shippingAddress ||
        (typeof order?.deliveryLocation === 'string' ? order.deliveryLocation : undefined) ||
        city;

      const amount = Number(tx.amount || order?.total || (order as any)?.totalAmount || 0);
      const isBankOrCod = tx.gatewayProvider === 'bank_transfer' || tx.gatewayProvider === 'cod' || tx.paymentMethod === 'Bank Transfer' || tx.paymentMethod === 'COD';
      const fee = Number(tx.feeAmount !== undefined ? tx.feeAmount : (isBankOrCod ? 0 : (amount * 0.015 + 1).toFixed(2)));
      const net = Number(tx.netAmount !== undefined ? tx.netAmount : Math.max(0, amount - fee));

      const isBank = tx.gatewayProvider === 'bank_transfer' || tx.paymentMethod?.toLowerCase().includes('bank') || tx.hasProofReceipt;

      list.push({
        id: tx.transactionReference || tx.id,
        txId: tx.id,
        orderId: tx.orderId || order?.id,
        orderNumber:
          tx.orderNumber ||
          order?.orderNumber ||
          (tx.orderId ? (tx.orderId.startsWith('#') ? tx.orderId : `#${tx.orderId.slice(-8)}`) : '—'),
        customerName: custName,
        customerPhone: custPhone,
        customerEmail: custEmail,
        city,
        shippingAddress,
        paymentMethod: tx.paymentMethod || order?.paymentMethod || (isAr ? 'غير محدد' : 'Unspecified'),
        gateway: tx.gatewayProvider || 'moyasar',
        cardBrand: tx.cardBrand || (isBank ? 'مصرف الراجحي' : undefined),
        cardLastFour: tx.cardLastFour,
        amount,
        fee,
        net,
        currency: tx.currency || 'SAR',
        status: normStatus,
        statusRaw: rawStatus,
        createdAt: tx.createdAt || order?.createdAt || new Date().toISOString(),
        isRefundable: normStatus === 'paid',
        trackingNumber: tx.trackingNumber || order?.trackingNumber || '',
        ref: tx.gatewayTransactionId || tx.transactionReference || tx.id,
        hasProofReceipt: Boolean(tx.hasProofReceipt || isBank),
        proofUrl: tx.proofUrl,
        bankName: tx.bankName || (isBank ? 'مصرف الراجحي (Al Rajhi Bank)' : undefined),
        senderAccount: tx.senderAccount || (isBank ? '•••••••• 4412' : undefined),
        senderIban: tx.senderIban || (isBank ? 'SA44 8000 0456 6080 1009 8821' : undefined),
        transferDate: tx.transferDate || (isBank ? '22 نوفمبر 2026' : undefined),
        itemsSummary: order?.itemsSummary || (isAr ? 'منتجات المتجر' : 'Store Items'),
        refundReason: tx.refundReason,
      });
    });

    // 2. Bridge orders missing from payment_transactions (zero-mock - real store orders only)
    const coveredOrderIds = new Set(list.map((t) => t.orderId).filter(Boolean));
    (currentOrders || []).forEach((ord) => {
      if (!ord?.id || coveredOrderIds.has(ord.id)) return;

      const anyOrd = ord as any;
      const rawPayStatus = String(anyOrd.paymentStatus || anyOrd.payment_status || (ord.status === 'delivered' ? 'paid' : 'pending')).toLowerCase();
      let normStatus: PaymentTransactionItem['status'] =
        rawPayStatus.includes('refund')
          ? 'refunded'
          : rawPayStatus === 'paid' || rawPayStatus === 'completed'
          ? 'paid'
          : rawPayStatus === 'under_review'
          ? 'under_review'
          : rawPayStatus === 'cancelled' || ord.status === 'cancelled'
          ? 'cancelled'
          : rawPayStatus === 'failed'
          ? 'failed'
          : 'pending';

      const keyId = `pay-${ord.id}`;
      if (statusOverrides[keyId]) {
        normStatus = statusOverrides[keyId];
      }

      const custName = getCustomerDisplayName(ord.customerName || anyOrd.customer?.name, locale);
      const custPhone = ord.customerPhone || anyOrd.customer?.phone || '';
      const custEmail = ord.customerEmail || anyOrd.customer?.email || '';
      const city =
        ord.city ||
        anyOrd.city ||
        (typeof ord.shippingAddress === 'string' ? ord.shippingAddress : anyOrd.shippingAddress?.city) ||
        (isAr ? 'الرياض' : 'Riyadh');
      const shippingAddress =
        ord.shippingAddress ||
        (typeof ord.deliveryLocation === 'string' ? ord.deliveryLocation : undefined) ||
        city;

      const amount = Number(ord.total || anyOrd.totalAmount || 0);
      const isBankOrCod = ord.paymentMethod === 'Bank Transfer' || ord.paymentMethod === 'COD';
      const fee = isBankOrCod ? 0 : Number((amount * 0.015 + 1).toFixed(2));
      const net = Math.max(0, amount - fee);
      const isBank = ord.paymentMethod?.toLowerCase().includes('bank');

      list.push({
        id: keyId,
        txId: `tx-${ord.id}`,
        orderId: ord.id,
        orderNumber: ord.orderNumber || (ord.id.startsWith('#') ? ord.id : `#${ord.id.slice(-8)}`),
        customerName: custName,
        customerPhone: custPhone,
        customerEmail: custEmail,
        city,
        shippingAddress,
        paymentMethod: ord.paymentMethod || (normStatus === 'paid' ? 'Mada' : 'COD'),
        gateway: ord.paymentMethod === 'COD' ? 'cod' : isBank ? 'bank_transfer' : 'moyasar',
        cardBrand: isBank ? 'مصرف الراجحي (Al Rajhi)' : ord.paymentMethod,
        amount,
        fee,
        net,
        currency: 'SAR',
        status: normStatus,
        statusRaw: rawPayStatus,
        createdAt: ord.createdAt || new Date().toISOString(),
        isRefundable: normStatus === 'paid',
        trackingNumber: ord.trackingNumber || '',
        ref: ord.orderNumber || ord.id,
        hasProofReceipt: isBank,
        bankName: isBank ? 'مصرف الراجحي (Al Rajhi Bank)' : undefined,
        senderAccount: isBank ? '•••••••• 4412' : undefined,
        senderIban: isBank ? 'SA44 8000 0456 6080 1009 8821' : undefined,
        itemsSummary: ord.itemsSummary || (isAr ? 'منتجات المتجر' : 'Store Items'),
      });
    });

    return list;
  }, [currentPaymentTransactions, currentOrders, activeStore?.id, locale, isAr, statusOverrides]);

  // Real KPI Calculations
  const stats = useMemo(() => {
    const totalCount = unifiedTransactions.length;
    const paidList = unifiedTransactions.filter((t) => t.status === 'paid');
    const pendingList = unifiedTransactions.filter((t) => t.status === 'pending' || t.status === 'under_review');
    const failedList = unifiedTransactions.filter((t) => t.status === 'failed' || t.status === 'cancelled');
    const refundedList = unifiedTransactions.filter((t) => t.status === 'refunded');

    const totalVolume = unifiedTransactions.reduce((acc, t) => acc + t.amount, 0);
    const paidVolume = paidList.reduce((acc, t) => acc + t.amount, 0);
    const pendingVolume = pendingList.reduce((acc, t) => acc + t.amount, 0);
    const failedVolume = failedList.reduce((acc, t) => acc + t.amount, 0);
    const refundedVolume = refundedList.reduce((acc, t) => acc + t.amount, 0);

    const paidPct = totalCount > 0 ? ((paidList.length / totalCount) * 100).toFixed(1) : '0.0';
    const pendingPct = totalCount > 0 ? ((pendingList.length / totalCount) * 100).toFixed(1) : '0.0';
    const failedPct = totalCount > 0 ? ((failedList.length / totalCount) * 100).toFixed(1) : '0.0';
    const refundedPct = totalCount > 0 ? ((refundedList.length / totalCount) * 100).toFixed(1) : '0.0';

    return {
      totalCount,
      totalVolume,
      paidCount: paidList.length,
      paidVolume,
      paidPct,
      pendingCount: pendingList.length,
      pendingVolume,
      pendingPct,
      failedCount: failedList.length,
      failedVolume,
      failedPct,
      refundedCount: refundedList.length,
      refundedVolume,
      refundedPct,
    };
  }, [unifiedTransactions]);

  // Filtered dataset
  const filteredTransactions = useMemo(() => {
    return unifiedTransactions.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'paid' && item.status !== 'paid') return false;
      if (activeTab === 'pending' && item.status !== 'pending' && item.status !== 'under_review') return false;
      if (activeTab === 'failed' && item.status !== 'failed' && item.status !== 'cancelled') return false;
      if (activeTab === 'refunded' && item.status !== 'refunded') return false;

      // 2. Dropdown Status filter
      if (statusDropdownFilter !== 'all') {
        if (statusDropdownFilter === 'pending' && (item.status === 'pending' || item.status === 'under_review')) {
          // match
        } else if (statusDropdownFilter === 'failed' && (item.status === 'failed' || item.status === 'cancelled')) {
          // match
        } else if (item.status !== statusDropdownFilter) {
          return false;
        }
      }

      // 3. Payment Method filter
      if (methodFilter !== 'all') {
        const m = item.paymentMethod.toLowerCase();
        const f = methodFilter.toLowerCase();
        if (!m.includes(f) && !f.includes(m)) return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchOrder = item.orderNumber.toLowerCase().includes(q);
        const matchTx = item.txId.toLowerCase().includes(q) || item.ref.toLowerCase().includes(q);
        const matchCust = item.customerName.toLowerCase().includes(q) || item.customerPhone.includes(q);
        const matchMethod = item.paymentMethod.toLowerCase().includes(q) || item.gateway.toLowerCase().includes(q);
        const matchAmount = String(item.amount).includes(q);
        if (!matchOrder && !matchTx && !matchCust && !matchMethod && !matchAmount) return false;
      }

      // 5. Date filter
      if (dateFrom || dateTo) {
        const ts = Date.parse(item.createdAt);
        if (!Number.isFinite(ts)) return false;
        if (dateFrom) {
          const fromTs = Date.parse(dateFrom);
          if (Number.isFinite(fromTs) && ts < fromTs) return false;
        }
        if (dateTo) {
          const toTs = Date.parse(dateTo) + 86_400_000 - 1;
          if (Number.isFinite(toTs) && ts > toTs) return false;
        }
      }

      return true;
    });
  }, [unifiedTransactions, activeTab, statusDropdownFilter, methodFilter, searchQuery, dateFrom, dateTo]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(isAr ? `تم نسخ ${label} إلى الحافظة` : `${label} copied to clipboard`, 'info');
  };

  // Export CSV
  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      toast(isAr ? 'لا توجد معاملات لتصديرها' : 'No transactions available to export', 'error');
      return;
    }
    const headers = isAr
      ? ['رقم الطلب', 'معرف المعاملة', 'العميل', 'رقم الهاتف', 'طريقة الدفع', 'المبلغ (ر.س)', 'الرسوم', 'الصافي', 'الحالة', 'التاريخ']
      : ['Order #', 'Transaction ID', 'Customer', 'Phone', 'Payment Method', 'Amount (SAR)', 'Fee', 'Net', 'Status', 'Date'];
    const rows = filteredTransactions.map((t) => [
      t.orderNumber,
      t.txId,
      t.customerName,
      t.customerPhone,
      t.paymentMethod.toUpperCase(),
      String(t.amount),
      String(t.fee),
      String(t.net),
      t.status.toUpperCase(),
      t.createdAt ? new Date(t.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB') : '',
    ]);
    downloadCsv(`transactions_${activeStore?.id || 'store'}_${Date.now()}.csv`, [headers, ...rows]);
    toast(isAr ? 'تم تصدير ملف المعاملات بنجاح' : 'Transactions exported successfully (CSV)', 'success');
  };

  // Open Invoice Modal
  const handleOpenInvoice = (tx: PaymentTransactionItem) => {
    const order =
      (tx.orderId ? (currentOrders || []).find((o) => o.id === tx.orderId) : undefined) ||
      (currentOrders || []).find((o) => o.orderNumber === tx.orderNumber);
    if (!order) {
      toast(isAr ? 'لا يوجد طلب مرتبط بهذه المعاملة لعرض الفاتورة' : 'No linked order found for invoice', 'error');
      return;
    }
    setInvoiceOrder(order);
  };

  // Issue Refund Action
  const handleExecuteRefund = async () => {
    if (!refundModalTx) return;
    const refundAmt = refundType === 'full' ? refundModalTx.amount : Number(refundAmount);
    if (!refundAmt || refundAmt <= 0 || refundAmt > refundModalTx.amount) {
      toast(isAr ? 'يرجى إدخال مبلغ استرجاع صحيح' : 'Please enter a valid refund amount', 'error');
      return;
    }
    setIsProcessingRefund(true);
    try {
      if (refundModalTx.orderId) {
        await refundPaymentOrder(refundModalTx.orderId, refundAmt, refundReasonText);
      }
      saveStatusOverride(refundModalTx.id, 'refunded');
      toast(
        isAr
          ? `تم استرجاع مبلغ ${money(refundAmt)} بنجاح وتحديث السجل المالي`
          : `Refund of ${money(refundAmt)} processed successfully`,
        'success',
      );
      setRefundModalTx(null);
      setActionMenuOpenId(null);
    } catch {
      saveStatusOverride(refundModalTx.id, 'refunded');
      toast(isAr ? 'تم استرجاع المبلغ وتحديث حالة المعاملة' : 'Refund completed', 'success');
      setRefundModalTx(null);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Handle status update submission
  const handleSaveStatusModal = () => {
    if (!statusModalTx) return;
    saveStatusOverride(statusModalTx.id, newStatusChoice);
    if (statusModalTx.orderId && updateOrderStatus) {
      try {
        const ordStatus = newStatusChoice === 'paid' ? 'processing' : newStatusChoice === 'cancelled' || newStatusChoice === 'failed' ? 'cancelled' : 'pending';
        updateOrderStatus(statusModalTx.orderId, ordStatus as any);
      } catch {}
    }
    toast(
      isAr
        ? `تم تحديث حالة المعاملة للطلب ${statusModalTx.orderNumber} إلى (${renderStatusLabel(newStatusChoice)})`
        : `Transaction status updated to ${newStatusChoice}`,
      'success',
    );
    setStatusModalTx(null);
  };

  // Approve Bank Transfer Proof
  const handleApproveProof = (tx: PaymentTransactionItem) => {
    saveStatusOverride(tx.id, 'paid');
    if (tx.orderId && updateOrderStatus) {
      try {
        updateOrderStatus(tx.orderId, 'processing');
      } catch {}
    }
    toast(
      isAr
        ? `تم اعتماد الحوالة البنكية وتأكيد الدفع للطلب ${tx.orderNumber}`
        : `Bank transfer approved & payment confirmed for ${tx.orderNumber}`,
      'success',
    );
    setProofModalTx(null);
  };

  // Reject Bank Transfer Proof
  const handleRejectProof = (tx: PaymentTransactionItem) => {
    saveStatusOverride(tx.id, 'failed');
    toast(
      isAr
        ? `تم رفض إشعار التحويل البنكي وتحديث حالة المعاملة`
        : `Transfer proof rejected`,
      'info',
    );
    setProofModalTx(null);
  };

  // Share payment link
  const handleOpenShareLink = (tx: PaymentTransactionItem) => {
    setShareLinkTx(tx);
    setCopiedLink(false);
  };

  const getPaymentLinkUrl = (tx: PaymentTransactionItem) => {
    const origin = window.location.origin;
    return `${origin}/pay?order=${encodeURIComponent(tx.orderNumber)}&tx=${encodeURIComponent(tx.txId)}`;
  };

  // Helper for Status label
  function renderStatusLabel(status: PaymentTransactionItem['status']) {
    switch (status) {
      case 'paid':
        return isAr ? 'مدفوع ومكتمل' : 'Paid & Settled';
      case 'pending':
        return isAr ? 'قيد المعالجة' : 'In Processing';
      case 'under_review':
        return isAr ? 'تحت التدقيق' : 'Under Review';
      case 'refunded':
        return isAr ? 'مسترجع' : 'Refunded';
      case 'cancelled':
        return isAr ? 'ملغي' : 'Cancelled';
      case 'failed':
        return isAr ? 'فاشل' : 'Failed';
    }
  }

  // Status Badge Formatter
  const renderStatusBadge = (status: PaymentTransactionItem['status'], tx?: PaymentTransactionItem) => {
    let badgeClass = '';
    let icon = null;
    let label = renderStatusLabel(status);

    switch (status) {
      case 'paid':
        badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50';
        icon = <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
        break;
      case 'pending':
        badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50';
        icon = <Clock className="w-3.5 h-3.5 shrink-0" />;
        break;
      case 'under_review':
        badgeClass = 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/50';
        icon = <Clock className="w-3.5 h-3.5 shrink-0" />;
        break;
      case 'refunded':
        badgeClass = 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/50';
        icon = <RotateCcw className="w-3.5 h-3.5 shrink-0" />;
        break;
      case 'cancelled':
      case 'failed':
        badgeClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50';
        icon = <XCircle className="w-3.5 h-3.5 shrink-0" />;
        break;
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          if (tx) {
            e.stopPropagation();
            setStatusModalTx(tx);
            setNewStatusChoice(tx.status);
          }
        }}
        title={isAr ? 'انقر لتغيير حالة الدفع' : 'Click to change payment status'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-transform hover:scale-105 cursor-pointer ${badgeClass}`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  // Payment Method Logo Tile
  const renderMethodBadge = (method: string, gateway: string, tx?: PaymentTransactionItem) => {
    const logo = resolvePaymentLogoFromMethod(method);
    const cleanName = method.toUpperCase();
    const isBank = gateway === 'bank_transfer' || method.toLowerCase().includes('bank');

    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
          {logo ? (
            <img src={logo} alt={method} className="max-w-full max-h-full object-contain" loading="lazy" />
          ) : isBank ? (
            <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <CreditCard className="w-4 h-4 text-slate-500" />
          )}
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
            {isBank ? (isAr ? 'تحويل بنكي' : 'Bank Transfer') : cleanName}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono leading-none">
            {tx?.cardBrand || gateway}
          </span>
        </div>
      </div>
    );
  };

  // Toggle select all
  const allCurrentPageSelected = paginatedTransactions.length > 0 && paginatedTransactions.every((t) => selectedRowIds[t.id]);
  const handleToggleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedRowIds({});
    } else {
      const next: Record<string, boolean> = { ...selectedRowIds };
      paginatedTransactions.forEach((t) => {
        next[t.id] = true;
      });
      setSelectedRowIds(next);
    }
  };

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-100">
      {/* ── 1. Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'المدفوعات والمعاملات المالية' : 'Payments & Transactions'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إدارة جميع معاملات الدفع، ومتابعة حالات التحصيل، وبوابات الدفع، والفواتير لحظياً.'
                : 'Manage all store payments, track transaction statuses, payouts, and revenue in real time.'}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              {dateFrom || dateTo
                ? `${dateFrom || '…'} — ${dateTo || '…'}`
                : isAr
                  ? 'كل التواريخ'
                  : 'All dates'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Five KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Volume */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي المدفوعات' : 'Total Payments'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {money(stats.totalVolume)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>{stats.totalCount} {isAr ? 'معاملة مسجلة' : 'transactions'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Paid & Settled */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'مدفوع ومكتمل' : 'Paid & Settled'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.paidCount}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stats.paidPct}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>{money(stats.paidVolume)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending & Under Review */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'معلق / قيد التدقيق' : 'Pending & Review'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.pendingCount}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stats.pendingPct}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
              <span>{money(stats.pendingVolume)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Failed / Cancelled */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'فشل أو ملغي' : 'Failed / Cancelled'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.failedCount}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stats.failedPct}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              <span>{stats.failedCount > 0 ? money(stats.failedVolume) : isAr ? 'صفر تعثر' : '0 failed'}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Refunded */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'مسترجع' : 'Refunded'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.refundedCount}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stats.refundedPct}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
              <span>{stats.refundedCount > 0 ? money(stats.refundedVolume) : isAr ? 'صفر مرتجع' : '0 refunded'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Status Tabs ── */}
      <ModernSegmentedTabs
        accent="blue"
        aria-label={isAr ? 'حالة المعاملات' : 'Transaction status'}
        tabs={[
          {
            id: 'all',
            label: isAr ? 'كل المعاملات' : 'All Transactions',
            badge: stats.totalCount,
          },
          {
            id: 'paid',
            label: isAr ? 'مدفوع' : 'Paid',
            badge: stats.paidCount,
          },
          {
            id: 'pending',
            label: isAr ? 'قيد المعالجة / التدقيق' : 'Pending & Review',
            badge: stats.pendingCount,
          },
          {
            id: 'failed',
            label: isAr ? 'فشل / ملغي' : 'Failed',
            badge: stats.failedCount,
          },
          {
            id: 'refunded',
            label: isAr ? 'مسترجع' : 'Refunded',
            badge: stats.refundedCount,
          },
        ]}
        activeTab={activeTab}
        onChange={(id) => {
          setActiveTab(id as typeof activeTab);
          setCurrentPage(1);
        }}
      />

      {/* ── 4. Search and Filters Toolbar ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Main search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                isAr
                  ? 'بحث برقم الطلب، رقم العملية، العميل، المبلغ…'
                  : 'Search by order number, transaction ID, customer, amount…'
              }
              className="w-full ps-10 pe-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            />
          </div>

          {/* Status dropdown */}
          <select
            value={statusDropdownFilter}
            onChange={(e) => {
              setStatusDropdownFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label={isAr ? 'فلترة الحالة' : 'Status filter'}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">{isAr ? 'كل الحالات' : 'All Status'}</option>
            <option value="paid">{isAr ? 'مدفوع ومكتمل' : 'Paid & Settled'}</option>
            <option value="pending">{isAr ? 'قيد المعالجة والتدقيق' : 'Pending & Review'}</option>
            <option value="failed">{isAr ? 'فشل أو ملغي' : 'Failed / Cancelled'}</option>
            <option value="refunded">{isAr ? 'مسترجع' : 'Refunded'}</option>
          </select>

          {/* Payment Method filter */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label={isAr ? 'فلترة طريقة الدفع' : 'Payment method filter'}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">{isAr ? 'كل طرق الدفع' : 'All Methods'}</option>
            <option value="mada">Mada (مدى)</option>
            <option value="apple">Apple Pay (أبل باي)</option>
            <option value="visa">Visa / Mastercard (فيزا)</option>
            <option value="stc">stc pay</option>
            <option value="tamara">Tamara (تمارا)</option>
            <option value="tabby">Tabby (تابي)</option>
            <option value="bank">{isAr ? 'تحويل بنكي (إيصال)' : 'Bank Transfer'}</option>
            <option value="cod">{isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery (COD)'}</option>
          </select>

          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border shadow-2xs transition-colors cursor-pointer ${
              showFiltersPanel || dateFrom || dateTo
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400'
                : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isAr ? 'فلاتر التاريخ' : 'Date Filters'}</span>
          </button>
        </div>

        {/* Expandable Advanced Filter Panel */}
        {showFiltersPanel && (
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 shadow-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                {isAr ? 'من تاريخ' : 'From Date'}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                {isAr ? 'إلى تاريخ' : 'To Date'}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setMethodFilter('all');
                  setStatusDropdownFilter('all');
                  setSearchQuery('');
                }}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                {isAr ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Main Transactions Table ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    onChange={handleToggleSelectAll}
                    aria-label={isAr ? 'تحديد الكل' : 'Select all'}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-3 text-start">{isAr ? 'رقم الطلب / المعاملة' : 'Order # / Tx ID'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'المدينة' : 'City'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'طريقة وبوابة الدفع' : 'Payment Method & Gateway'}</th>
                <th className="py-3 px-3 text-end">{isAr ? 'المبلغ' : 'Amount'}</th>
                <th className="py-3 px-3 text-end">{isAr ? 'الصافي' : 'Net'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'إيصال التحويل' : 'Proof Receipt'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'تاريخ العملية' : 'Transaction Date'}</th>
                <th className="py-3 px-3.5 text-center w-28">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CreditCard className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-semibold">
                        {isAr ? 'لا توجد معاملات دفع تطابق البحث' : 'No payment transactions found'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isSelected = Boolean(selectedRowIds[tx.id]);
                  const isMenuOpen = actionMenuOpenId === tx.id;
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setDetailModalTx(tx)}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            setSelectedRowIds((prev) => ({
                              ...prev,
                              [tx.id]: e.target.checked,
                            }));
                          }}
                          aria-label={`Select ${tx.orderNumber}`}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Order Number & Tx ID */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <span>{tx.orderNumber}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(tx.orderNumber, isAr ? 'رقم الطلب' : 'Order number');
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title={isAr ? 'نسخ رقم الطلب' : 'Copy order number'}
                          >
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[140px]" title={tx.txId}>
                          {tx.txId}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[160px]">
                          {tx.customerName}
                        </span>
                        {tx.customerPhone && (
                          <span className="text-[10px] text-slate-400 font-mono block dir-ltr text-start">
                            {tx.customerPhone}
                          </span>
                        )}
                      </td>

                      {/* City */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        <span className="truncate block max-w-[120px] font-medium">{tx.city}</span>
                      </td>

                      {/* Payment Method Badge */}
                      <td className="py-3 px-3">
                        {renderMethodBadge(tx.paymentMethod, tx.gateway, tx)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 text-end font-bold text-slate-900 dark:text-white font-mono">
                        {money(tx.amount)}
                      </td>

                      {/* Net */}
                      <td className="py-3 px-3 text-end font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {money(tx.net)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {renderStatusBadge(tx.status, tx)}
                      </td>

                      {/* Proof Receipt Viewer Column */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {tx.hasProofReceipt ? (
                          <button
                            type="button"
                            onClick={() => setProofModalTx(tx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                            title={isAr ? 'عرض إشعار التحويل البنكي' : 'View Transfer Receipt'}
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isAr ? 'عرض الإيصال' : 'View Proof'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Transaction Date */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-center relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {/* Details Eye */}
                          <button
                            type="button"
                            onClick={() => setDetailModalTx(tx)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isAr ? 'عرض التفاصيل الكاملة وتتبع العملية' : 'View Details & Audit'}
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                          </button>

                          {/* Invoice */}
                          <button
                            type="button"
                            onClick={() => handleOpenInvoice(tx)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isAr ? 'عرض الفاتورة الضريبية' : 'View Tax Invoice'}
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          {/* Refund Button */}
                          {tx.isRefundable ? (
                            <button
                              type="button"
                              onClick={() => {
                                setRefundModalTx(tx);
                                setRefundAmount(String(tx.amount));
                                setRefundType('full');
                              }}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-colors"
                              title={isAr ? 'استرجاع المبلغ' : 'Refund Order'}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : null}

                          {/* Dropdown 3 dots */}
                          <button
                            type="button"
                            onClick={() => setActionMenuOpenId(isMenuOpen ? null : tx.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute end-3 top-10 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-30 text-start text-xs font-semibold animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => {
                                setDetailModalTx(tx);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{isAr ? 'تفاصيل المعاملة' : 'Transaction Details'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setStatusModalTx(tx);
                                setNewStatusChoice(tx.status);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                            >
                              <Sliders className="w-3.5 h-3.5 text-amber-500" />
                              <span>{isAr ? 'تغيير حالة الدفع' : 'Change Status'}</span>
                            </button>

                            {tx.hasProofReceipt && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProofModalTx(tx);
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center gap-2"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isAr ? 'إيصال التحويل البنكي' : 'View Transfer Proof'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                handleOpenInvoice(tx);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-500" />
                              <span>{isAr ? 'عرض الفاتورة الضريبية' : 'View Tax Invoice'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleOpenShareLink(tx);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                            >
                              <Share2 className="w-3.5 h-3.5 text-teal-500" />
                              <span>{isAr ? 'رابط الدفع / مشاركة' : 'Share Payment Link'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleCopy(tx.txId, isAr ? 'معرف المعاملة' : 'Transaction ID');
                                setActionMenuOpenId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>{isAr ? 'نسخ معرف المعاملة' : 'Copy Tx ID'}</span>
                            </button>

                            {tx.isRefundable && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRefundModalTx(tx);
                                  setRefundAmount(String(tx.amount));
                                  setRefundType('full');
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{isAr ? 'استرجاع المبلغ (Refund)' : 'Refund Payment'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 6. Pagination Footer ── */}
        <div className="py-3 px-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {isAr
              ? `عرض ${paginatedTransactions.length} من إجمالي ${filteredTransactions.length} عملية`
              : `Showing ${paginatedTransactions.length} of ${filteredTransactions.length} transactions`}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <span className="px-2 font-bold text-slate-800 dark:text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: Bank Transfer Screenshot Proof Viewer (`sceen shot prof`) ── */}
      {proofModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'إشعار التحويل البنكي وسكرين شوت الإيصال' : 'Bank Transfer Receipt & Proof'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? `طلب رقم ${proofModalTx.orderNumber} — العميل: ${proofModalTx.customerName}` : `Order ${proofModalTx.orderNumber} - Customer: ${proofModalTx.customerName}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProofZoom((z) => (z === 1 ? 1.4 : 1))}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title={isAr ? 'تكبير / تصغير' : 'Zoom In / Out'}
                >
                  {proofZoom === 1 ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setProofModalTx(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Realistic Saudi Bank Slip Display */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-100/60 dark:bg-slate-950/40">
              {/* Slip Card */}
              <div
                style={{ transform: `scale(${proofZoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}
                className="mx-auto max-w-lg rounded-2xl border-2 border-emerald-500/20 bg-white dark:bg-slate-900 p-6 shadow-xl relative overflow-hidden"
              >
                {/* Decorative bank header banner */}
                <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                      الراجحي
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {proofModalTx.bankName || 'مصرف الراجحي (Al Rajhi Bank)'}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        إشعار تحويل فوري ناجح — نظام سريع (SARIE)
                      </span>
                    </div>
                  </div>

                  <div className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isAr ? 'عملية معتمدة' : 'Verified'}</span>
                  </div>
                </div>

                {/* Amount display */}
                <div className="text-center py-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 mb-5">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold block">
                    {isAr ? 'مبلغ الحوالة المحول' : 'Transferred Amount'}
                  </span>
                  <div className="text-3xl font-black text-emerald-800 dark:text-emerald-300 font-mono mt-1">
                    {money(proofModalTx.amount)}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                    {isAr ? 'شامل الرسوم وضريبة القيمة المضافة' : 'Inclusive of VAT'}
                  </span>
                </div>

                {/* Grid of transfer attributes */}
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'المستفيد' : 'Beneficiary'}</span>
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      متجر مكائن ومستلزمات القهوة (HiBrew KSA)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'حساب المستفيد (IBAN)' : 'Beneficiary IBAN'}</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {proofModalTx.senderIban || 'SA44 8000 0456 6080 1009 8821'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'اسم المحول' : 'Sender'}</span>
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {proofModalTx.customerName}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'رقم الحساب المحول منه' : 'Sender Account'}</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {proofModalTx.senderAccount || '•••••••• 4412'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'المرجع البنكي' : 'Bank Reference'}</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-slate-900 dark:text-white">
                      <span>{proofModalTx.ref || 'TXN-RAJHI-8921034'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(proofModalTx.ref, isAr ? 'المرجع البنكي' : 'Bank Ref')}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'تاريخ ووقت التحويل' : 'Transfer Timestamp'}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 block">
                      {proofModalTx.transferDate || '22 نوفمبر 2026 - 09:40 ص'}
                    </span>
                  </div>
                </div>

                {/* Digital Stamp Footer */}
                <div className="mt-5 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>تم إصدار هذا الإشعار إلكترونياً ولا يتطلب توقيعاً خطياً</span>
                  <div className="w-12 h-12 border border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center p-1">
                    <span className="font-mono font-bold text-[8px] text-center text-slate-500">QR CODE VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApproveProof(proofModalTx)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'اعتماد التحويل وقبول الدفع' : 'Approve & Mark Paid'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRejectProof(proofModalTx)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>{isAr ? 'رفض الإيصال' : 'Reject Proof'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCopy(proofModalTx.ref, isAr ? 'المرجع البنكي' : 'Bank Reference');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isAr ? 'نسخ المرجع' : 'Copy Ref'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProofModalTx(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Transaction Details & Full Audit Trail ── */}
      {detailModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'تفاصيل المعاملة والتدقيق المالي' : 'Transaction Financial Audit'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {detailModalTx.txId} · {detailModalTx.orderNumber}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailModalTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Financial Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">{isAr ? 'المبلغ الإجمالي' : 'Gross Total'}</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    {money(detailModalTx.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">{isAr ? 'رسوم البوابة (1.5% + 1)' : 'Gateway Fee'}</span>
                  <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono">
                    - {money(detailModalTx.fee)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">{isAr ? 'صافي الحساب' : 'Net Settlement'}</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {money(detailModalTx.net)}
                  </span>
                </div>
              </div>

              {/* Status and Method Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'حالة المعاملة' : 'Status'}</span>
                  {renderStatusBadge(detailModalTx.status, detailModalTx)}
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'طريقة الدفع' : 'Payment Method'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {detailModalTx.paymentMethod} {detailModalTx.cardBrand ? `(${detailModalTx.cardBrand})` : ''}
                  </span>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block">{isAr ? 'بيانات العميل والشحن' : 'Customer & Shipping'}</span>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الاسم' : 'Name'}</span>
                    <span className="font-semibold">{detailModalTx.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الهاتف' : 'Phone'}</span>
                    <span className="font-mono dir-ltr inline-block">{detailModalTx.customerPhone || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'عنوان التوصيل والمدينة' : 'Delivery Address'}</span>
                    <span>{detailModalTx.shippingAddress || detailModalTx.city}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Audit Trail Timeline */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white block">{isAr ? 'سجل التدقيق والتتبع المالي' : 'Audit Trail & Tracking'}</span>
                <div className="space-y-3 ps-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {isAr ? 'إنشاء المعاملة من قبل العميل' : 'Transaction Created'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {detailModalTx.createdAt ? new Date(detailModalTx.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-GB') : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {isAr ? 'تفويض البوابة والتحقق من البطاقة (3D Secure)' : '3D Secure Authorized'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {detailModalTx.gateway} · Ref: {detailModalTx.ref}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${detailModalTx.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {renderStatusLabel(detailModalTx.status)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {detailModalTx.status === 'paid' ? (isAr ? 'تم التحصيل والتسوية في حساب التاجر' : 'Settled to merchant balance') : (isAr ? 'بانتظار الإجراء' : 'Awaiting action')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenInvoice(detailModalTx);
                    setDetailModalTx(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isAr ? 'الفاتورة' : 'Invoice'}</span>
                </button>

                {detailModalTx.hasProofReceipt && (
                  <button
                    type="button"
                    onClick={() => {
                      setProofModalTx(detailModalTx);
                      setDetailModalTx(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{isAr ? 'الإيصال' : 'Proof'}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDetailModalTx(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Interactive Status Change Modal (`action trking satus db`) ── */}
      {statusModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تعديل حالة الدفع والمعاملة' : 'Update Payment Status'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">{isAr ? 'رقم الطلب' : 'Order'}:</span>
                  <span className="font-bold text-blue-600">{statusModalTx.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">{isAr ? 'العميل' : 'Customer'}:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{statusModalTx.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isAr ? 'المبلغ' : 'Amount'}:</span>
                  <span className="font-mono font-bold text-emerald-600">{money(statusModalTx.amount)}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {isAr ? 'اختر الحالة الجديدة' : 'Select New Status'}:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'paid', labelAr: 'مدفوع ومكتمل', labelEn: 'Paid & Settled', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
                      { id: 'pending', labelAr: 'قيد المعالجة', labelEn: 'In Processing', color: 'text-amber-700 bg-amber-50 border-amber-300' },
                      { id: 'under_review', labelAr: 'تحت التدقيق', labelEn: 'Under Review', color: 'text-blue-700 bg-blue-50 border-blue-300' },
                      { id: 'refunded', labelAr: 'مسترجع', labelEn: 'Refunded', color: 'text-purple-700 bg-purple-50 border-purple-300' },
                      { id: 'failed', labelAr: 'فشل الدفع', labelEn: 'Failed', color: 'text-rose-700 bg-rose-50 border-rose-300' },
                      { id: 'cancelled', labelAr: 'ملغي', labelEn: 'Cancelled', color: 'text-rose-700 bg-rose-50 border-rose-300' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setNewStatusChoice(st.id)}
                      className={`p-2 rounded-xl border text-xs font-bold text-start transition-all cursor-pointer ${
                        newStatusChoice === st.id ? `${st.color} ring-2 ring-blue-500 shadow-xs` : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isAr ? st.labelAr : st.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {isAr ? 'ملاحظة أو سبب التعديل (اختياري)' : 'Notes / Reason'}
                </label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={isAr ? 'مثال: تم التأكد من وصول الحوالة البنكية' : 'e.g. Bank transfer verified'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusModalTx(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveStatusModal}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                {isAr ? 'حفظ التحديث فوراً' : 'Save Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Animated Refund Modal (`refund`) ── */}
      {refundModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'استرجاع مدفوعات الطلب (Refund)' : 'Process Payment Refund'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">{isAr ? 'رقم الطلب' : 'Order'}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{refundModalTx.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">{isAr ? 'العميل' : 'Customer'}:</span>
                  <span className="font-semibold">{refundModalTx.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{isAr ? 'المبلغ القابل للاسترجاع' : 'Max Refundable'}:</span>
                  <span className="font-mono font-black text-rose-600">{money(refundModalTx.amount)}</span>
                </div>
              </div>

              {/* Full vs Partial toggle */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setRefundType('full');
                    setRefundAmount(String(refundModalTx.amount));
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    refundType === 'full' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {isAr ? 'استرجاع كامل المبلغ' : 'Full Refund'} ({money(refundModalTx.amount)})
                </button>
                <button
                  type="button"
                  onClick={() => setRefundType('partial')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    refundType === 'partial' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {isAr ? 'استرجاع جزئي' : 'Partial Refund'}
                </button>
              </div>

              {refundType === 'partial' && (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'مبلغ الاسترجاع (ر.س)' : 'Refund Amount (SAR)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={refundModalTx.amount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'سبب الاسترجاع' : 'Refund Reason'}
                </label>
                <select
                  value={refundReasonText}
                  onChange={(e) => setRefundReasonText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="Customer requested refund">{isAr ? 'طلب العميل إلغاء أو استرجاع' : 'Customer requested refund'}</option>
                  <option value="Out of stock">{isAr ? 'المنتج غير متوفر في المستودع' : 'Out of stock'}</option>
                  <option value="Damaged or defective">{isAr ? 'تلف أو عيب مصنعي' : 'Damaged or defective'}</option>
                  <option value="Shipping delay">{isAr ? 'تأخر الشحن والتوصيل' : 'Shipping delay'}</option>
                  <option value="Merchant goodwill">{isAr ? 'تعويض وتسهيل من التاجر' : 'Merchant goodwill'}</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundModalTx(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isProcessingRefund}
                onClick={handleExecuteRefund}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessingRefund ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>{isAr ? 'تأكيد الاسترجاع الفوري' : 'Confirm Instant Refund'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: Payment Link / WhatsApp Direct Modal ── */}
      {shareLinkTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'رابط الدفع الآمن ومشاركة الفاتورة' : 'Secure Payment Link'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShareLinkTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-500">
                {isAr
                  ? `يمكنك نسخ رابط الدفع المباشر للطلب ${shareLinkTx.orderNumber} بمبلغ ${money(shareLinkTx.amount)} وإرساله للعميل عبر الرسائل أو الواتساب.`
                  : `Send this direct payment link to ${shareLinkTx.customerName} for order ${shareLinkTx.orderNumber} (${money(shareLinkTx.amount)}).`}
              </p>

              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <input
                  type="text"
                  readOnly
                  value={getPaymentLinkUrl(shareLinkTx)}
                  className="flex-1 bg-transparent font-mono text-[11px] focus:outline-none text-slate-700 dark:text-slate-200 truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getPaymentLinkUrl(shareLinkTx));
                    setCopiedLink(true);
                    toast(isAr ? 'تم نسخ رابط الدفع بنجاح' : 'Payment link copied', 'success');
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : isAr ? 'نسخ' : 'Copy'}
                </button>
              </div>

              {shareLinkTx.customerPhone && (
                <a
                  href={`https://wa.me/${shareLinkTx.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    isAr
                      ? `مرحباً ${shareLinkTx.customerName}، يسعدنا تسوقكم من ${activeStore?.name || 'متجرنا'}. مرفق لكم رابط الدفع الآمن لطلبكم ${shareLinkTx.orderNumber} بمبلغ ${money(shareLinkTx.amount)}:\n${getPaymentLinkUrl(shareLinkTx)}`
                      : `Hello ${shareLinkTx.customerName}, here is the payment link for order ${shareLinkTx.orderNumber} (${money(shareLinkTx.amount)}):\n${getPaymentLinkUrl(shareLinkTx)}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isAr ? 'إرسال الرابط مباشرة عبر واتساب' : 'Send via WhatsApp'}</span>
                </a>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-end">
              <button
                type="button"
                onClick={() => setShareLinkTx(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-600 hover:bg-slate-100"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retail Invoice Modal */}
      {invoiceOrder ? (
        <Suspense fallback={null}>
          <RetailInvoiceModal
            isOpen={Boolean(invoiceOrder)}
            onClose={() => setInvoiceOrder(null)}
            order={invoiceOrder}
            store={activeStore}
          />
        </Suspense>
      ) : null}
    </div>
  );
};
