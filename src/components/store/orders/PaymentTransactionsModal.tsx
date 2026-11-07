import React, { useMemo, useState } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import { GlobalModal } from '../../common/GlobalModal';
import {
  CreditCard,
  Search,
  XCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Download,
} from 'lucide-react';
import { downloadCsv } from '../../../utils/orderExport';
import { downloadXlsx } from '../../../utils/exportSpreadsheet';

interface PaymentTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentTransactionsModal: React.FC<PaymentTransactionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const { currentPaymentTransactions, refundPaymentOrder, activeStore } = useTenant();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all');
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const transactions = useMemo(() => {
    const list = (currentPaymentTransactions || []).filter((tx) => tx.storeId === activeStore?.id || !tx.storeId);
    return list.slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }, [currentPaymentTransactions, activeStore?.id]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (statusFilter !== 'all') {
        const s = String(tx.status || '').toLowerCase();
        if (statusFilter === 'refunded') {
          if (!s.includes('refund')) return false;
        } else if (s !== statusFilter) return false;
      }
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        String(tx.transactionReference || '').toLowerCase().includes(q) ||
        String(tx.gatewayTransactionId || '').toLowerCase().includes(q) ||
        String(tx.payerName || '').toLowerCase().includes(q) ||
        String(tx.orderId || '').toLowerCase().includes(q) ||
        String(tx.paymentMethod || '').toLowerCase().includes(q)
      );
    });
  }, [transactions, statusFilter, search]);

  const summary = useMemo(() => {
    const paid = transactions.filter((t) => t.status === 'paid');
    const pending = transactions.filter((t) => t.status === 'pending' || t.status === 'authorized');
    const failed = transactions.filter((t) => t.status === 'failed' || t.status === 'cancelled');
    const refunded = transactions.filter((t) => String(t.status).includes('refund'));
    return {
      total: transactions.length,
      paidCount: paid.length,
      paidAmount: paid.reduce((s, t) => s + (Number(t.amount) || 0), 0),
      pendingCount: pending.length,
      failedCount: failed.length,
      refundedCount: refunded.length,
      fees: transactions.reduce((s, t) => s + (Number(t.feeAmount) || 0), 0),
    };
  }, [transactions]);

  const statusLabel = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (isAr) {
      if (s === 'paid') return 'مدفوع';
      if (s === 'pending' || s === 'authorized') return 'قيد المعالجة';
      if (s === 'failed') return 'فشل';
      if (s === 'cancelled') return 'ملغي';
      if (s.includes('refund')) return 'مسترجع';
      return status || 'غير محدد';
    }
    if (s.includes('refund')) return 'Refunded';
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (filtered.length === 0) {
      toast(isAr ? 'لا توجد عمليات للتصدير' : 'No transactions to export', 'error');
      return;
    }
    const headers = isAr
      ? ['المرجع', 'التاريخ', 'البوابة', 'طريقة الدفع', 'المبلغ', 'الرسوم', 'الصافي', 'الحالة', 'رقم الطلب']
      : ['Reference', 'Date', 'Gateway', 'Method', 'Amount', 'Fee', 'Net', 'Status', 'Order ID'];
    const rows = filtered.map((tx) => [
      tx.transactionReference || tx.id,
      tx.createdAt ? new Date(tx.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-GB') : '',
      tx.gatewayProvider || '',
      tx.paymentMethod || '',
      String(tx.amount ?? ''),
      String(tx.feeAmount ?? ''),
      String(tx.netAmount ?? ''),
      statusLabel(tx.status),
      tx.orderId || '',
    ]);
    const table = [headers, ...rows];
    const stamp = Date.now();
    if (format === 'xlsx') {
      downloadXlsx(
        `payment_transactions_${stamp}.xlsx`,
        isAr ? 'عمليات الدفع' : 'Payments',
        table,
      );
    } else {
      downloadCsv(`payment_transactions_${stamp}.csv`, table);
    }
    toast(isAr ? 'تم تصدير عمليات الدفع بنجاح' : 'Payment transactions exported', 'success');
  };

  const handleRefund = async (txId: string, amount: number) => {
    setRefundingId(txId);
    try {
      const res = await refundPaymentOrder(txId, amount);
      toast(
        res?.message ||
          (isAr ? 'تم تسجيل الاسترجاع بنجاح' : 'Refund recorded successfully'),
        res?.success === false ? 'error' : 'success',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isAr ? 'فشل الاسترجاع' : 'Refund failed';
      toast(msg, 'error');
    } finally {
      setRefundingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <GlobalModal
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'عمليات الدفع الإلكتروني' : 'Electronic Payment Transactions'}
    >
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAr ? 'عمليات الدفع الإلكتروني' : 'Electronic Payment Transactions'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'معاملات البوابات الحقيقية لهذا المتجر فقط'
                  : 'Live gateway transactions for this store only'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير إكسل' : 'Export Excel'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <div className="text-xs font-bold text-slate-500 mb-1">{isAr ? 'إجمالي العمليات' : 'Total Transactions'}</div>
            <div className="text-lg font-black tabular-nums">{summary.total}</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr ? 'مدفوع' : 'Paid'}
            </div>
            <div className="text-lg font-black tabular-nums text-emerald-900 dark:text-emerald-200">
              {money(summary.paidAmount)}
            </div>
            <div className="text-[11px] font-bold text-emerald-700/80">{summary.paidCount}</div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {isAr ? 'قيد المعالجة' : 'Pending'}
            </div>
            <div className="text-lg font-black tabular-nums">{summary.pendingCount}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-bold text-slate-500 mb-1">{isAr ? 'إجمالي الرسوم' : 'Total Fees'}</div>
            <div className="text-lg font-black tabular-nums">{money(summary.fees)}</div>
            <div className="text-[11px] text-slate-500">
              {isAr ? `فشل ${summary.failedCount} · مسترجع ${summary.refundedCount}` : `Failed ${summary.failedCount} · Refunded ${summary.refundedCount}`}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {(
              [
                { key: 'all', ar: 'الكل', en: 'All' },
                { key: 'paid', ar: 'مدفوع', en: 'Paid' },
                { key: 'pending', ar: 'قيد المعالجة', en: 'Pending' },
                { key: 'failed', ar: 'فشل', en: 'Failed' },
                { key: 'refunded', ar: 'مسترجع', en: 'Refunded' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  statusFilter === tab.key
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {isAr ? tab.ar : tab.en}
              </button>
            ))}
          </div>
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'بحث بالمرجع أو العميل...' : 'Search by reference or payer...'}
              className="w-full ps-9 pe-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {isAr ? 'لا توجد عمليات دفع مطابقة' : 'No payment transactions found'}
            </div>
          ) : (
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2.5 px-3 font-bold text-start">{isAr ? 'المرجع' : 'Reference'}</th>
                  <th className="py-2.5 px-3 font-bold text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="py-2.5 px-3 font-bold text-start">{isAr ? 'البوابة' : 'Gateway'}</th>
                  <th className="py-2.5 px-3 font-bold text-start">{isAr ? 'المبلغ' : 'Amount'}</th>
                  <th className="py-2.5 px-3 font-bold text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-2.5 px-3 font-bold text-center">{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold">
                      {tx.transactionReference || tx.id}
                      {tx.payerName ? (
                        <div className="text-[10px] text-slate-500 font-sans font-medium">{tx.payerName}</div>
                      ) : null}
                    </td>
                    <td className="py-3 px-3">
                      {tx.createdAt
                        ? new Date(tx.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-GB')
                        : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold">{tx.gatewayProvider || '—'}</div>
                      <div className="text-[10px] text-slate-500">{tx.paymentMethod || ''}</div>
                    </td>
                    <td className="py-3 px-3 font-black tabular-nums">
                      {money(Number(tx.amount) || 0)}
                      {Number(tx.feeAmount) > 0 ? (
                        <div className="text-[10px] text-slate-500 font-medium">
                          {isAr ? 'رسوم' : 'Fee'}: {money(Number(tx.feeAmount) || 0)}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800">
                        {statusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {tx.status === 'paid' ? (
                        <button
                          type="button"
                          disabled={refundingId === tx.id}
                          onClick={() => handleRefund(tx.id, Number(tx.amount) || 0)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${refundingId === tx.id ? 'animate-spin' : ''}`} />
                          {isAr ? 'استرجاع' : 'Refund'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isAr ? 'المعروض:' : 'Showing:'}{' '}
            <strong className="text-slate-900 dark:text-white">{filtered.length}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};
