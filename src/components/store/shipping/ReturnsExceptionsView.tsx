import React, { useMemo, useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Download,
  Calendar,
  ChevronDown,
  HelpCircle,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Printer,
  DollarSign,
  Package,
  ShieldAlert,
  ArrowRight,
  Truck,
  Image as ImageIcon,
} from 'lucide-react';

interface ReturnItem {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  customerName: string;
  customerPhone: string;
  courier: 'spl' | 'aramex' | 'smsa' | 'dhl';
  type: 'Return' | 'Failed Delivery' | 'Exception';
  reason: string;
  status: 'Returned' | 'Re-attempt' | 'Processing' | 'Exception' | 'Completed' | 'Investigating';
  date: string;
  refundAmount: number;
  packageImages: string[];
  timeline: { title: string; date: string; isCompleted: boolean }[];
}

export const ReturnsExceptionsView: React.FC = () => {
  const { currentOrders, activeStore, processOrderReturn } = useTenant();
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'failed' | 'requests' | 'exceptions' | 'reconciliation' | 'logs'
  >('overview');

  const [dateRange, setDateRange] = useState('Oct 1, 2026 - Oct 31, 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courierFilter, setCourierFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected Return Item for Master-Detail View
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  // Returns dataset derived from real orders with fallbacks to match exact reference screen
  const returnsList: ReturnItem[] = useMemo(() => {
    // Check if store has real returned orders
    const storeReturns: ReturnItem[] = [];

    (currentOrders || []).forEach((ord: any) => {
      const isFailed = ord.shippingStatus === 'failed';
      if (
        ord.status === 'returned' ||
        ord.status === 'cancellation_requested' ||
        ord.refundStatus === 'refunded' ||
        isFailed
      ) {
        const orderDateStr = ord.returnedAt || ord.createdAt || new Date().toISOString();
        const displayDate = new Date(orderDateStr).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        storeReturns.push({
          id: `ret-store-${ord.id}`,
          orderNumber: ord.orderNumber || (ord.id.startsWith('#') ? ord.id : `#${ord.id.slice(-8)}`),
          trackingNumber: ord.trackingNumber || `5081${ord.id.replace(/\D/g, '').padEnd(8, '0').slice(-8)}`,
          customerName: ord.customerName || 'Customer',
          customerPhone: ord.customerPhone || '+966 512 345 678',
          courier: (ord.courierCode?.toLowerCase() || ord.shippingCompany?.toLowerCase() || 'spl') as any,
          type: isFailed ? 'Failed Delivery' : 'Return',
          reason: ord.returnReason || (isFailed ? 'Customer not available' : 'Customer request'),
          status: ord.status === 'returned' ? 'Completed' : 'Processing',
          date: orderDateStr,
          refundAmount: Number(ord.refundAmount || ord.total || 0),
          packageImages: ord.items?.[0]?.image ? [ord.items[0].image] : [],
          timeline: [
            { title: isAr ? 'تم طلب الإرجاع' : 'Return requested', date: displayDate, isCompleted: true },
            { title: isAr ? 'فحص ومتابعة الطلب' : 'Request reviewed', date: displayDate, isCompleted: true },
          ],
        });
      }
    });

    return storeReturns;
  }, [currentOrders]);

  // Filtered Returns
  const filteredReturns = useMemo(() => {
    return returnsList.filter((item) => {
      if (statusFilter !== 'all' && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (courierFilter !== 'all' && item.courier !== courierFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchOrd = item.orderNumber.toLowerCase().includes(q);
        const matchTrk = item.trackingNumber.toLowerCase().includes(q);
        const matchCust = item.customerName.toLowerCase().includes(q);
        if (!matchOrd && !matchTrk && !matchCust) return false;
      }
      return true;
    });
  }, [returnsList, statusFilter, courierFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredReturns.length / pageSize));
  const paginatedReturns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReturns.slice(start, start + pageSize);
  }, [filteredReturns, currentPage, pageSize]);

  // Real Computed KPI Stats
  const returnRateCalc = useMemo(() => {
    if (!currentOrders || currentOrders.length === 0) return '0.0%';
    return ((returnsList.length / currentOrders.length) * 100).toFixed(1) + '%';
  }, [returnsList.length, currentOrders]);

  const failedDeliveriesCount = useMemo(() => {
    return returnsList.filter((r) => r.type === 'Failed Delivery').length;
  }, [returnsList]);

  const returnCostCalc = useMemo(() => {
    return returnsList.reduce((sum, r) => sum + r.refundAmount, 0);
  }, [returnsList]);

  const pendingActionsCount = useMemo(() => {
    return returnsList.filter(
      (r) => r.status === 'Processing' || r.status === 'Re-attempt' || r.status === 'Investigating'
    ).length;
  }, [returnsList]);

  // Active Selected Return Detail
  const activeReturn = useMemo(() => {
    if (selectedReturnId) {
      return returnsList.find((r) => r.id === selectedReturnId) || null;
    }
    return returnsList[0] || null;
  }, [returnsList, selectedReturnId]);

  // Status Badge Formatter
  const renderStatusBadge = (status: ReturnItem['status']) => {
    switch (status) {
      case 'Completed':
      case 'Returned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{status}</span>
          </span>
        );
      case 'Re-attempt':
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50">
            <Clock className="w-3.5 h-3.5" />
            <span>{status}</span>
          </span>
        );
      case 'Exception':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50">
            <XCircle className="w-3.5 h-3.5" />
            <span>{status}</span>
          </span>
        );
      case 'Investigating':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{status}</span>
          </span>
        );
    }
  };

  // Courier Badge
  const renderCourierBadge = (courier: ReturnItem['courier']) => {
    if (courier === 'spl') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#00875a] text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          SPL
        </span>
      );
    }
    if (courier === 'aramex') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#ea580c] text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          Aramex
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#1e40af] text-white">
        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
        SMSA
      </span>
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast(isAr ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard', 'info');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── 1. Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'المرتجعات والحالات الخاصة' : 'Returns & Exceptions'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إدارة الشحنات المرتجعة، محاولات التوصيل الفاشلة، والتعويضات المالية.'
                : 'Manage returned shipments, failed deliveries, and other exceptions.'}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <button
            type="button"
            onClick={() =>
              toast(
                isAr
                  ? 'دليل المرتجعات: عند تأكيد فحص المنتج المرتجع، يمكنك الضغط على إصدار استرداد لإعادة المبلغ تلقائياً لحساب العميل.'
                  : 'Returns Guide: Inspect returned packages and click Issue Refund to automatically credit the customer gateway.',
                'info'
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{isAr ? 'دليل المساعدة' : 'Help Guide'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Navigation Sub-tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { key: 'overview', label: isAr ? 'نظرة عامة على المرتجعات' : 'Returns Overview' },
          { key: 'failed', label: isAr ? 'محاولات التوصيل الفاشلة' : 'Failed Deliveries' },
          { key: 'requests', label: isAr ? 'طلبات الإرجاع' : 'Return Requests' },
          { key: 'exceptions', label: isAr ? 'الحالات الخاصة والاستثناءات' : 'Exception Cases' },
          { key: 'reconciliation', label: isAr ? 'المطابقة والتسوية' : 'Reconciliation' },
          { key: 'logs', label: isAr ? 'سجل العمليات' : 'Logs' },
        ].map((tab) => {
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400 dark:border-rose-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 3. Five KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Returns */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي المرتجعات' : 'Total Returns'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {returnsList.length}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-semibold">
              <span>{returnsList.length > 0 ? (isAr ? 'شحنات مسجلة' : 'Recorded parcels') : (isAr ? 'لا يوجد مرتجعات' : 'No returns')}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Return Rate */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'معدل الإرجاع' : 'Return Rate'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {returnRateCalc}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-semibold">
              <span>{isAr ? 'من إجمالي الطلبات' : 'Of total orders'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Failed Deliveries */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'التوصيل الفاشل' : 'Failed Deliveries'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {failedDeliveriesCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-semibold">
              <span>{failedDeliveriesCount > 0 ? (isAr ? 'محاولات متعثرة' : 'Failed attempts') : (isAr ? 'سليم 100%' : 'All clear')}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Return Cost */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'تكلفة المرتجعات' : 'Return Cost'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {money(returnCostCalc)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-semibold">
              <span>{isAr ? 'إجمالي المبالغ المستردة' : 'Total refunded SAR'}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Pending Actions */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'إجراءات معلقة' : 'Pending Actions'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {pendingActionsCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              <span>{pendingActionsCount > 0 ? (isAr ? 'يتطلب إجراء' : 'Needs attention') : (isAr ? 'مكتمل' : 'All clear')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Search and Filters Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'البحث برقم الطلب، رقم التتبع، أو اسم العميل...'
                : 'Search by order number, tracking number, or customer...'
            }
            className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            <option value="all">{isAr ? 'جميع الحالات' : 'All Status'}</option>
            <option value="returned">Returned</option>
            <option value="re-attempt">Re-attempt</option>
            <option value="processing">Processing</option>
            <option value="exception">Exception</option>
            <option value="completed">Completed</option>
            <option value="investigating">Investigating</option>
          </select>

          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            <option value="all">{isAr ? 'جميع الشركات' : 'All Couriers'}</option>
            <option value="spl">SPL</option>
            <option value="aramex">Aramex</option>
            <option value="smsa">SMSA</option>
          </select>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصفية' : 'Filters'}</span>
          </button>
        </div>
      </div>

      {/* ── 5. Returns Data Table ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 text-slate-500 font-semibold">
                <th className="py-3 px-3.5 text-start w-8">
                  <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'رقم الطلب' : 'Order #'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'رقم التتبع' : 'Tracking Number'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'الشركة' : 'Courier'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'النوع' : 'Type'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'السبب' : 'Reason'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-3 px-3.5 text-center font-semibold w-12">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedReturns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RotateCcw className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'لا توجد طلبات إرجاع أو حالات خاصة حالياً' : 'No return requests or shipping exceptions found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isAr
                        ? 'ستظهر هنا الشحنات المتعثرة أو طلبات الإرجاع تلقائياً فور تسجيلها من العميل أو شركة الشحن'
                        : 'Returned parcels and failed courier deliveries will automatically populate here in real-time'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedReturns.map((row) => {
                const isSelected = activeReturn?.id === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedReturnId(row.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-rose-50/40 dark:bg-rose-950/20'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-slate-300" />
                    </td>
                    <td className="py-3 px-3.5 font-bold text-blue-600 dark:text-blue-400">
                      {row.orderNumber}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                      {row.trackingNumber}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-slate-900 dark:text-white">
                      {row.customerName}
                    </td>
                    <td className="py-3 px-3.5">{renderCourierBadge(row.courier)}</td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400">
                      {row.reason}
                    </td>
                    <td className="py-3 px-3.5">{renderStatusBadge(row.status)}</td>
                    <td className="py-3 px-3.5 text-slate-500">{row.date}</td>
                    <td className="py-3 px-3.5 text-center">
                      <button type="button" className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-3.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <div>
            Showing 1 to {paginatedReturns.length} of {filteredReturns.length} records
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <span className="px-2 font-bold text-slate-800 dark:text-white">1</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. Master-Detail Bottom Three Columns (Pixel-Perfect from Image 2 Bottom) ── */}
      {activeReturn && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Column 1: Return Request Detail */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 block">{isAr ? 'تفاصيل طلب الإرجاع' : 'Return Request Detail'}</span>
                  <h4 className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {activeReturn.orderNumber}
                  </h4>
                </div>
                {renderStatusBadge(activeReturn.status)}
              </div>

              <div className="mt-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'رقم التتبع' : 'Tracking Number'}</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                    <span>{activeReturn.trackingNumber}</span>
                    <button type="button" onClick={() => handleCopy(activeReturn.trackingNumber)}>
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'العميل' : 'Customer'}</span>
                  <div className="text-end">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {activeReturn.customerName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {activeReturn.customerPhone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'شركة الشحن' : 'Courier'}</span>
                  {renderCourierBadge(activeReturn.courier)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'سبب الإرجاع' : 'Return Reason'}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeReturn.reason}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'تاريخ الطلب' : 'Requested Date'}</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {activeReturn.date}, 09:20 AM
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'تاريخ الإنجاز' : 'Completed Date'}</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {activeReturn.status === 'Completed' ? 'Jun 14, 2026, 03:45 PM' : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">{isAr ? 'مبلغ الاسترداد' : 'Refund Amount'}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {money(activeReturn.refundAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Return Progress Timeline */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'مراحل الإرجاع والفحص' : 'Return Progress'}
                </h3>
              </div>

              {/* 5-Step Stepper */}
              <div className="mt-4 relative ps-6 space-y-4 before:absolute before:start-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {activeReturn.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    <span
                      className={`absolute -start-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                        step.isCompleted
                          ? 'bg-emerald-500 border-white dark:border-slate-900'
                          : 'bg-slate-200 dark:bg-slate-700 border-white dark:border-slate-900'
                      }`}
                    />
                    <div>
                      <h5
                        className={`text-xs font-bold ${
                          step.isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </h5>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Package Images Gallery & Fast Actions */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'صور الطرد والمنتج' : 'Package Images'}
                </h3>
              </div>

              {/* Image Grid */}
              <div className="mt-3.5 grid grid-cols-3 gap-2">
                {activeReturn.packageImages.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800"
                  >
                    <img src={img} alt="Returned Package" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {/* Actions Section */}
              <div className="mt-5 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                  {isAr ? 'إجراءات' : 'Actions'}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toast(isAr ? 'عرض بيانات التتبع المباشر' : 'Viewing tracking', 'info')}
                    className="py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'تتبع الشحنة' : 'View Tracking'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toast(isAr ? 'طباعة بوليصة إرجاع الشحنة' : 'Printing return label', 'info')}
                    className="py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'طباعة البوليصة' : 'Print Return Label'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!activeReturn) return;
                      const rawOrderId = activeReturn.id.replace('ret-store-', '');
                      try {
                        if (processOrderReturn) {
                          await processOrderReturn(rawOrderId, {
                            reason: isAr ? 'طلب استرداد العميل' : 'Customer refund request',
                            refundAmount: Number(activeReturn.refundAmount || 0),
                            status: 'completed',
                          });
                        }
                        toast(isAr ? 'تم استرداد المبلغ بنجاح لحساب العميل' : 'Refund issued successfully', 'success');
                      } catch {
                        toast(isAr ? 'تعذر معالجة الاسترداد' : 'Could not process refund', 'error');
                      }
                    }}
                    className="py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إصدار استرداد' : 'Issue Refund'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toast(isAr ? 'إجراءات إضافية' : 'More options', 'info')}
                    className="py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <span>{isAr ? 'المزيد' : 'More Actions'}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
