import React, { useState, useMemo, useEffect } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import type {
  InvoiceDocument,
  InvoiceDocumentType,
  InvoiceDocumentStatus,
  InvoiceTemplateConfig,
} from '../../../types/invoices';
import { invoiceService } from '../../../services/invoiceService';
import { getCustomerDisplayName } from '../../../utils/storeLocalization';
import { formatInvoiceDate } from '../../../utils/zatca';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { InvoiceCreateModal } from './InvoiceCreateModal';
import { InvoiceTemplateDesigner } from './InvoiceTemplateDesigner';
import { InvoiceAuditDrawer } from './InvoiceAuditDrawer';
import {
  FileText,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Printer,
  Download,
  Eye,
  MoreHorizontal,
  CreditCard,
  Truck,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  TrendingUp,
  Coins,
  ReceiptText,
  Calendar,
  Layers,
  ArrowUpRight,
  Palette,
} from 'lucide-react';

interface StoreInvoicesProps {
  onNavigateTab?: (tab: string) => void;
}

export const StoreInvoices: React.FC<StoreInvoicesProps> = ({ onNavigateTab }) => {
  const { activeStore, currentOrders, addOrder } = useTenant();
  const storeId = activeStore?.id || 'store-1';
  const { t, locale, money } = usePrefs();
  const { toast, confirm } = useToast();
  const isAr = locale === 'ar';

  // State
  const [documents, setDocuments] = useState<InvoiceDocument[]>(() => {
    if (currentOrders && currentOrders.length > 0) {
      return invoiceService.syncWithStoreOrders(storeId, currentOrders, activeStore);
    }
    return invoiceService.getDocuments(storeId, activeStore);
  });

  const [templateConfig, setTemplateConfig] = useState<InvoiceTemplateConfig>(() =>
    invoiceService.getTemplateConfig(storeId, activeStore)
  );

  // Reload documents when active store changes or real orders update
  useEffect(() => {
    const load = () => {
      if (currentOrders && currentOrders.length > 0) {
        const synced = invoiceService.syncWithStoreOrders(storeId, currentOrders, activeStore);
        setDocuments(synced);
      } else {
        setDocuments(invoiceService.getDocuments(storeId, activeStore));
      }
      setTemplateConfig(invoiceService.getTemplateConfig(storeId, activeStore));
    };
    load();

    const handleUpdate = (e: any) => {
      if (!e.detail || e.detail.storeId === storeId) {
        load();
      }
    };

    window.addEventListener('unityteck-invoices-updated', handleUpdate);
    window.addEventListener('unityteck-template-updated', handleUpdate);
    return () => {
      window.removeEventListener('unityteck-invoices-updated', handleUpdate);
      window.removeEventListener('unityteck-template-updated', handleUpdate);
    };
  }, [storeId, currentOrders, activeStore]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'month'>('all');

  // Modals & Drawers State
  const [previewDoc, setPreviewDoc] = useState<InvoiceDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<InvoiceDocumentType>('order_invoice');
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [auditDoc, setAuditDoc] = useState<InvoiceDocument | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Overview Statistics KPI Calculations
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalTax = 0;
    let totalOutstanding = 0;
    let activeQuotesCount = 0;
    let activeQuotesValue = 0;
    let creditNotesTotal = 0;

    documents.forEach((d) => {
      if (d.documentType === 'delivery_note') return; // no financial numbers

      if (d.documentType === 'quotation' || d.documentType === 'proforma_invoice') {
        if (d.status === 'pending' || d.status === 'issued') {
          activeQuotesCount++;
          activeQuotesValue += d.grandTotal;
        }
        return;
      }

      if (d.documentType === 'credit_note') {
        creditNotesTotal += d.totalCreditedAmount || d.grandTotal;
        return;
      }

      if (d.documentType === 'cancelled_order_invoice') {
        return;
      }

      totalInvoiced += d.grandTotal;
      totalPaid += d.amountPaid;
      totalTax += d.taxAmount;
      totalOutstanding += d.outstandingBalance;
    });

    return {
      totalInvoiced,
      totalPaid,
      totalTax,
      totalOutstanding,
      activeQuotesCount,
      activeQuotesValue,
      creditNotesTotal,
      documentsCount: documents.length,
    };
  }, [documents]);

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Type filter
      if (selectedType !== 'all' && doc.documentType !== selectedType) return false;

      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'paid' && doc.status !== 'paid') return false;
        if (selectedStatus === 'unpaid' && (doc.status === 'paid' || doc.outstandingBalance <= 0)) return false;
        if (selectedStatus === 'cancelled' && doc.status !== 'cancelled') return false;
        if (selectedStatus === 'refunded' && doc.status !== 'refunded') return false;
        if (selectedStatus === 'converted' && doc.status !== 'converted') return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const docTime = new Date(doc.issueDate).getTime();
        const now = Date.now();
        if (dateFilter === 'today' && now - docTime > 24 * 60 * 60 * 1000) return false;
        if (dateFilter === '7days' && now - docTime > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === 'month' && now - docTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = doc.documentNumber.toLowerCase().includes(q);
        const matchOrder = (doc.orderNumber || '').toLowerCase().includes(q);
        const matchCustomer = (doc.buyer.name || '').toLowerCase().includes(q);
        const matchEmail = (doc.buyer.email || '').toLowerCase().includes(q);
        const matchPhone = (doc.buyer.phone || '').includes(q);
        const matchSupplier = (doc.seller.name || '').toLowerCase().includes(q);
        if (!matchNum && !matchOrder && !matchCustomer && !matchEmail && !matchPhone && !matchSupplier) {
          return false;
        }
      }

      return true;
    });
  }, [documents, selectedType, selectedStatus, dateFilter, searchQuery]);

  // Document Type Metadata Helper
  const getDocTypeBadge = (type: InvoiceDocumentType) => {
    switch (type) {
      case 'order_invoice':
        return { label: isAr ? 'فاتورة مبيعات' : 'Order Invoice', color: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30', icon: FileText };
      case 'tax_invoice':
        return { label: isAr ? 'فاتورة ضريبية معتمدة' : 'Tax Invoice', color: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30', icon: ShieldCheck };
      case 'quotation':
        return { label: isAr ? 'عرض أسعار' : 'Quotation', color: 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30', icon: Sparkles };
      case 'proforma_invoice':
        return { label: isAr ? 'فاتورة أولية' : 'Proforma', color: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30', icon: FileSpreadsheet };
      case 'payment_receipt':
        return { label: isAr ? 'سند قبض' : 'Receipt', color: 'bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/30', icon: Receipt };
      case 'delivery_note':
        return { label: isAr ? 'سند تسليم' : 'Delivery Note', color: 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30', icon: Truck };
      case 'credit_note':
        return { label: isAr ? 'إشعار دائن' : 'Credit Note', color: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30', icon: CreditCard };
      case 'refund_receipt':
        return { label: isAr ? 'إيصال استرجاع' : 'Refund Receipt', color: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30', icon: RotateCcw };
      case 'cancelled_order_invoice':
        return { label: isAr ? 'سجل إلغاء' : 'Cancellation', color: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30', icon: AlertTriangle };
      case 'purchase_invoice':
        return { label: isAr ? 'فاتورة مشتريات' : 'Purchase Invoice', color: 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30', icon: Building };
      default:
        return { label: type, color: 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30', icon: FileText };
    }
  };

  // Convert Quotation to Live Order
  const handleConvertQuotation = async (quotationId: string) => {
    const confirmed = await confirm({
      title: isAr ? 'تحويل عرض الأسعار إلى طلب مؤكد' : 'Convert Quotation to Live Order',
      message: isAr
        ? 'هل ترغب في تحويل عرض الأسعار هذا إلى طلب بيع معتمد وإضافته لقائمة الطلبات فوراً؟'
        : 'Do you want to convert this quotation into an authoritative confirmed order?',
    });
    if (!confirmed) return;

    const res = invoiceService.convertQuotationToOrder(storeId, quotationId, 'Store Administrator');
    if (res) {
      addOrder(res.newOrderPayload as any);
      setDocuments(invoiceService.getDocuments(storeId));
      toast(
        isAr
          ? `تم تحويل العرض بنجاح وإنشاء الطلب #${res.newOrderPayload.orderNumber}`
          : `Quotation converted to Order #${res.newOrderPayload.orderNumber}`,
        'success'
      );
    }
  };

  // Open Preview Modal
  const handleOpenPreview = (doc: InvoiceDocument) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
    setActiveActionMenuId(null);
  };

  // Open Audit Drawer
  const handleOpenAudit = (doc: InvoiceDocument) => {
    setAuditDoc(doc);
    setIsAuditOpen(true);
    setActiveActionMenuId(null);
  };

  // Navigate to Related record
  const handleNavigateToRecord = (type: 'order' | 'customer' | 'supplier' | 'invoice', id: string) => {
    setIsPreviewOpen(false);
    if (type === 'order' && onNavigateTab) {
      onNavigateTab('orders');
    } else if (type === 'customer' && onNavigateTab) {
      onNavigateTab('customers');
    }
  };

  // If Template Designer is open, show full designer view
  if (isDesignerOpen) {
    return (
      <InvoiceTemplateDesigner
        documents={documents}
        onBack={() => setIsDesignerOpen(false)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center font-bold">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'إدارة الفواتير والمستندات' : 'Invoice & Document Management'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'إصدار ومعاينة وطباعة نماذج الفواتير والمستندات التجارية والضريبية المعتمدة'
                  : 'Manage, issue, print & export dedicated commercial & tax invoices'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsDesignerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>{isAr ? 'تخصيص القوالب' : 'Template Designer'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCreateInitialType('order_invoice');
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء مستند جديد' : 'Generate Document'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Invoiced */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isAr ? 'إجمالي المبيعات المفوترة' : 'Total Invoiced'}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{money(stats.totalInvoiced)}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{stats.documentsCount} {isAr ? 'مستند مسجل' : 'documents issued'}</p>
        </div>

        {/* Collected / Paid */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isAr ? 'المدفوعات المحصلة' : 'Collected Revenue'}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{money(stats.totalPaid)}</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-500/80 mt-1">{isAr ? 'مدفوعات مؤكدة بنكياً' : 'Verified settlements'}</p>
        </div>

        {/* Tax Liability */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isAr ? 'ضريبة القيمة المضافة (15%)' : 'Value Added Tax (15%)'}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{money(stats.totalTax)}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{isAr ? 'إقرارات ضريبية مطابقة' : 'Compliant tax schedule'}</p>
        </div>

        {/* Active Quotations / Estimates */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isAr ? 'عروض الأسعار النشطة' : 'Active Quotes'}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{money(stats.activeQuotesValue)}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{stats.activeQuotesCount} {isAr ? 'عروض تسعير مرسلة' : 'proposals pending'}</p>
        </div>
      </div>

      {/* Filter Toolbar & Document Types Filter Strip */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
        {/* Document Type Horizontal Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', labelEn: 'All Documents', labelAr: 'جميع المستندات' },
            { id: 'order_invoice', labelEn: 'Sales Invoices', labelAr: 'فواتير المبيعات' },
            { id: 'tax_invoice', labelEn: 'Tax Invoices', labelAr: 'الفواتير الضريبية' },
            { id: 'quotation', labelEn: 'Quotations', labelAr: 'عروض الأسعار' },
            { id: 'proforma_invoice', labelEn: 'Proforma', labelAr: 'الفواتير الأولية' },
            { id: 'payment_receipt', labelEn: 'Payment Receipts', labelAr: 'سندات القبض' },
            { id: 'delivery_note', labelEn: 'Delivery Notes', labelAr: 'سندات التسليم' },
            { id: 'credit_note', labelEn: 'Credit Notes', labelAr: 'الإشعارات الدائنة' },
            { id: 'refund_receipt', labelEn: 'Refund Receipts', labelAr: 'إيصالات الاسترجاع' },
            { id: 'cancelled_order_invoice', labelEn: 'Cancellations', labelAr: 'سجلات الإلغاء' },
            { id: 'purchase_invoice', labelEn: 'Purchases', labelAr: 'المشتريات والتوريد' },
          ].map((tab) => {
            const isSelected = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {isAr ? tab.labelAr : tab.labelEn}
              </button>
            );
          })}
        </div>

        {/* Search & Sub-Filters Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث برقم الفاتورة، رقم الطلب، اسم العميل، الجوال، أو المورد...'
                  : 'Search by document #, order #, customer name, phone, or supplier...'
              }
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl ps-9 pe-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-44 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-hidden focus:bg-white dark:focus:bg-slate-800"
          >
            <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="paid">{isAr ? 'مسددة / مدفوعة' : 'Paid / Settled'}</option>
            <option value="unpaid">{isAr ? 'غير مسددة / رصيد معلق' : 'Unpaid / Balance Due'}</option>
            <option value="cancelled">{isAr ? 'ملغاة' : 'Cancelled'}</option>
            <option value="refunded">{isAr ? 'مسترجعة' : 'Refunded'}</option>
            <option value="converted">{isAr ? 'محولة لطلب' : 'Converted to Order'}</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="w-full sm:w-36 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-hidden focus:bg-white dark:focus:bg-slate-800"
          >
            <option value="all">{isAr ? 'كل الفترات' : 'All Dates'}</option>
            <option value="today">{isAr ? 'اليوم' : 'Today'}</option>
            <option value="7days">{isAr ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
            <option value="month">{isAr ? 'آخر شهر' : 'Last 30 Days'}</option>
          </select>
        </div>
      </div>

      {/* Main Documents Table */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 opacity-50" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'لم يتم العثور على مستندات مطابقة' : 'No documents matching criteria'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {isAr
                ? 'جرب تغيير خيارات البحث أو الفلترة، أو قم بإنشاء مستند جديد.'
                : 'Try adjusting your filters or search keywords, or generate a new document.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-950/40">
                  <th className="py-3.5 px-4 text-start">{isAr ? 'رقم المستند' : 'Document #'}</th>
                  <th className="py-3.5 px-3 text-start">{isAr ? 'النوع' : 'Type'}</th>
                  <th className="py-3.5 px-3 text-start">{isAr ? 'الطرف المستفيد / العميل' : 'Customer / Party'}</th>
                  <th className="py-3.5 px-3 text-start">{isAr ? 'الطلب المرتبط' : 'Linked Order'}</th>
                  <th className="py-3.5 px-3 text-start">{isAr ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                  <th className="py-3.5 px-3 text-end">{isAr ? 'القيمة الإجمالية' : 'Total Amount'}</th>
                  <th className="py-3.5 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredDocuments.map((doc) => {
                  const badge = getDocTypeBadge(doc.documentType);
                  const TypeIcon = badge.icon;
                  const isQuotation = doc.documentType === 'quotation';
                  const isDelivery = doc.documentType === 'delivery_note';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                      {/* Doc # */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(doc)}
                          className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>{doc.documentNumber}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-blue-600 dark:text-blue-400 transition-opacity" />
                        </button>
                      </td>

                      {/* Document Type Badge */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          <TypeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Customer / Party */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {isAr
                            ? doc.buyer.nameAr || doc.buyer.name
                            : doc.buyer.nameEn || getCustomerDisplayName(doc.buyer.name, 'en')}
                        </div>
                        {doc.buyer.phone && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono dir-ltr">{doc.buyer.phone}</div>
                        )}
                      </td>

                      {/* Linked Order */}
                      <td className="py-3.5 px-3">
                        {doc.orderNumber ? (
                          <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {doc.orderNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {formatInvoiceDate(doc.issueDate, isAr ? 'ar' : 'en', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-3 text-end font-mono font-bold">
                        {isDelivery ? (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        ) : (
                          <span className={doc.status === 'cancelled' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}>
                            {money(doc.grandTotal)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        {doc.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            {isAr ? 'مسدد' : 'Paid'}
                          </span>
                        ) : doc.status === 'refunded' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                            <RotateCcw className="w-3 h-3" />
                            {isAr ? 'مسترجع' : 'Refunded'}
                          </span>
                        ) : doc.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            {isAr ? 'ملغي' : 'Cancelled'}
                          </span>
                        ) : doc.status === 'converted' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            {isAr ? 'تم التحويل لطلب' : 'Converted'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            {isAr ? 'معلق / صادر' : 'Pending'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Quotation Convert Button */}
                          {isQuotation && doc.status !== 'converted' && (
                            <button
                              type="button"
                              onClick={() => handleConvertQuotation(doc.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-600/20 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200 transition-all text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              title={isAr ? 'تحويل إلى طلب فوري' : 'Convert to live order'}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{isAr ? 'تحويل لطلب' : 'Convert'}</span>
                            </button>
                          )}

                          {/* Preview Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(doc)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={isAr ? 'معاينة المستند' : 'Preview Document'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewDoc(doc);
                              setIsPreviewOpen(true);
                              setTimeout(() => window.print(), 200);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={isAr ? 'طباعة سريعة' : 'Quick Print'}
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Audit History Drawer */}
                          <button
                            type="button"
                            onClick={() => handleOpenAudit(doc)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={isAr ? 'سجل التدقيق' : 'Audit Trail'}
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Modals */}
      {isPreviewOpen && previewDoc && (
        <InvoicePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          document={previewDoc}
          config={templateConfig}
          onConfigChange={(updated) => setTemplateConfig(updated)}
          onNavigateToRecord={handleNavigateToRecord}
        />
      )}

      {isCreateOpen && (
        <InvoiceCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          initialType={createInitialType}
          onCreated={(newDoc) => {
            setDocuments(invoiceService.getDocuments(storeId));
            setPreviewDoc(newDoc);
            setIsPreviewOpen(true);
          }}
        />
      )}

      {isAuditOpen && auditDoc && (
        <InvoiceAuditDrawer
          isOpen={isAuditOpen}
          onClose={() => setIsAuditOpen(false)}
          document={auditDoc}
        />
      )}
    </div>
  );
};
