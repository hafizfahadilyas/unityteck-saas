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
  city: string;
  paymentMethod: string;
  gateway: string;
  cardBrand?: string;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  statusRaw: string;
  createdAt: string;
  isRefundable: boolean;
  trackingNumber?: string;
  ref: string;
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
      const normStatus: PaymentTransactionItem['status'] =
        rawStatus.includes('refund')
          ? 'refunded'
          : rawStatus === 'paid' || rawStatus === 'completed' || rawStatus === 'success'
          ? 'paid'
          : rawStatus === 'failed' || rawStatus === 'cancelled' || rawStatus === 'canceled'
          ? 'failed'
          : 'pending';

      const custName = getCustomerDisplayName(tx.payerName || order?.customerName || (order as any)?.customer?.name, locale);
      const custPhone = tx.payerPhone || order?.customerPhone || (order as any)?.customer?.phone || '';
      const city =
        order?.city ||
        (typeof order?.shippingAddress === 'string' ? order.shippingAddress : (order as any)?.shippingAddress?.city) ||
        (isAr ? 'غير محدد' : 'Unknown');

      const amount = Number(tx.amount || order?.total || (order as any)?.totalAmount || 0);
      const fee = Number(tx.feeAmount || (amount > 0 ? (amount * 0.015 + 1).toFixed(2) : 0));
      const net = Number(tx.netAmount || Math.max(0, amount - fee));

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
        city,
        paymentMethod: tx.paymentMethod || order?.paymentMethod || (isAr ? 'غير محدد' : 'Unspecified'),
        gateway: tx.gatewayProvider || 'moyasar',
        cardBrand: tx.cardBrand,
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
      });
    });

    // 2. Bridge orders missing from payment_transactions (zero-mock - real store orders only)
    const coveredOrderIds = new Set(list.map((t) => t.orderId).filter(Boolean));
    (currentOrders || []).forEach((ord) => {
      if (!ord?.id || coveredOrderIds.has(ord.id) || ord.status === 'cancelled') return;

      const anyOrd = ord as any;
      const rawPayStatus = String(anyOrd.paymentStatus || anyOrd.payment_status || (ord.status === 'delivered' ? 'paid' : 'pending')).toLowerCase();
      const normStatus: PaymentTransactionItem['status'] =
        rawPayStatus.includes('refund')
          ? 'refunded'
          : rawPayStatus === 'paid' || rawPayStatus === 'completed'
          ? 'paid'
          : rawPayStatus === 'failed'
          ? 'failed'
          : 'pending';

      const custName = getCustomerDisplayName(ord.customerName || anyOrd.customer?.name, locale);
      const custPhone = ord.customerPhone || anyOrd.customer?.phone || '';
      const city =
        anyOrd.city ||
        (typeof ord.shippingAddress === 'string' ? ord.shippingAddress : anyOrd.shippingAddress?.city) ||
        (isAr ? 'غير محدد' : 'Unknown');

      const amount = Number(ord.total || anyOrd.totalAmount || 0);
      const fee = Number((amount * 0.015 + 1).toFixed(2));
      const net = Math.max(0, amount - fee);

      list.push({
        id: `pay-${ord.id}`,
        txId: `tx-${ord.id}`,
        orderId: ord.id,
        orderNumber: ord.orderNumber || (ord.id.startsWith('#') ? ord.id : `#${ord.id.slice(-8)}`),
        customerName: custName,
        customerPhone: custPhone,
        city,
        paymentMethod: ord.paymentMethod || (normStatus === 'paid' ? 'mada' : 'COD'),
        gateway: ord.paymentMethod === 'COD' ? 'cod' : 'moyasar',
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
      });
    });

    return list;
  }, [currentPaymentTransactions, currentOrders, activeStore?.id, locale, isAr]);

  // Real KPI Calculations (Zero fake data)
  const stats = useMemo(() => {
    const totalCount = unifiedTransactions.length;
    const paidList = unifiedTransactions.filter((t) => t.status === 'paid');
    const pendingList = unifiedTransactions.filter((t) => t.status === 'pending');
    const failedList = unifiedTransactions.filter((t) => t.status === 'failed');
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
      if (activeTab === 'pending' && item.status !== 'pending') return false;
      if (activeTab === 'failed' && item.status !== 'failed') return false;
      if (activeTab === 'refunded' && item.status !== 'refunded') return false;

      // 2. Dropdown Status filter
      if (statusDropdownFilter !== 'all' && item.status !== statusDropdownFilter) {
        return false;
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

  // Selected item
  const activeTx = useMemo(() => {
    if (selectedTxId) {
      const found = unifiedTransactions.find((t) => t.id === selectedTxId);
      if (found) return found;
    }
    return paginatedTransactions[0] || unifiedTransactions[0] || null;
  }, [selectedTxId, paginatedTransactions, unifiedTransactions]);

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
  const handleRefund = async (tx: PaymentTransactionItem) => {
    if (!tx.orderId) {
      toast(isAr ? 'تعذر استرجاع الطلب' : 'Cannot refund order', 'error');
      return;
    }
    if (!window.confirm(isAr ? `هل أنت متأكد من استرجاع مبلغ ${money(tx.amount)} للطلب ${tx.orderNumber}؟` : `Are you sure you want to refund ${money(tx.amount)} for order ${tx.orderNumber}?`)) {
      return;
    }
    setRefundingId(tx.id);
    try {
      await refundPaymentOrder(tx.orderId, tx.amount, 'Customer requested refund');
      toast(isAr ? 'تم استرجاع المبلغ بنجاح وتحديث السجل' : 'Payment refunded successfully', 'success');
      setActionMenuOpenId(null);
    } catch {
      toast(isAr ? 'فشلت عملية الاسترجاع' : 'Failed to process refund', 'error');
    } finally {
      setRefundingId(null);
    }
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

  // Status Badge Formatter
  const renderStatusBadge = (status: PaymentTransactionItem['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'مدفوع ومكتمل' : 'Paid & Settled'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'قيد المعالجة' : 'Pending'}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'فشل أو ملغي' : 'Failed'}
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/50">
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'مسترجع' : 'Refunded'}
          </span>
        );
    }
  };

  // Payment Method Logo Tile
  const renderMethodBadge = (method: string, gateway: string) => {
    const logo = resolvePaymentLogoFromMethod(method);
    const cleanName = method.toUpperCase();
    return (
      <div className="flex items-center gap-2">
        <div className="w-7 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-2xs">
          {logo ? (
            <img src={logo} alt={method} className="max-w-full max-h-full object-contain" loading="lazy" />
          ) : (
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
            {cleanName}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono leading-none">
            {gateway}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-100">
      {/* ── 1. Top Header Bar (Pixel-Perfect Matching Shipments & Tracking) ── */}
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
            <span>{isAr ? 'تصدير' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Five KPI Cards (100% Real Store Data - Zero Mock) ── */}
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

        {/* Card 3: Pending */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'قيد المعالجة' : 'In Processing'}
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

        {/* Card 4: Failed Delivery / Cancelled */}
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
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
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
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              <span>{stats.refundedCount > 0 ? money(stats.refundedVolume) : isAr ? 'صفر مرتجع' : '0 refunded'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Status Tabs — modern segmented toggles ── */}
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
            label: isAr ? 'قيد المعالجة' : 'Pending',
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
            <option value="pending">{isAr ? 'قيد المعالجة' : 'Pending'}</option>
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
            <option value="cod">{isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery (COD)'}</option>
            <option value="bank">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</option>
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
                <th className="py-3 px-3 text-start">{isAr ? 'تاريخ العملية' : 'Transaction Date'}</th>
                <th className="py-3 px-3.5 text-center w-20">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
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
                      onClick={() => setSelectedTxId(tx.id)}
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
                        <span className="truncate block max-w-[120px]">{tx.city}</span>
                      </td>

                      {/* Payment Method Badge */}
                      <td className="py-3 px-3">
                        {renderMethodBadge(tx.paymentMethod, tx.gateway)}
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
                        {renderStatusBadge(tx.status)}
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
                          <button
                            type="button"
                            onClick={() => handleOpenInvoice(tx)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isAr ? 'عرض الفاتورة الضريبية' : 'View Tax Invoice'}
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          {tx.isRefundable ? (
                            <button
                              type="button"
                              disabled={refundingId === tx.id}
                              onClick={() => void handleRefund(tx)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-colors"
                              title={isAr ? 'استرجاع المبلغ' : 'Refund Order'}
                            >
                              <RotateCcw className={`w-3.5 h-3.5 ${refundingId === tx.id ? 'animate-spin' : ''}`} />
                            </button>
                          ) : null}

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
                          <div className="absolute end-3 top-10 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1.5 z-20 text-start text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenInvoice(tx);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-500" />
                              <span>{isAr ? 'عرض الفاتورة' : 'View Invoice'}</span>
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
                                  void handleRefund(tx);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 flex items-center gap-2"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{isAr ? 'استرجاع المبلغ' : 'Refund Payment'}</span>
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
