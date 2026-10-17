import React, { useState, useMemo } from 'react';
import type { Order, CodStatus } from '../../../types';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import {
  Banknote,
  Truck,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Receipt,
  Check,
} from 'lucide-react';

interface CodLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const CodLedgerModal: React.FC<CodLedgerModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { updateOrderCodStatus, activeStore } = useTenant();
  const { toast } = useToast();

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending_collection' | 'collected_by_courier' | 'remitted_to_bank'>('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter COD orders
  const codOrders = useMemo(() => {
    return orders.filter((o) => {
      const pm = (o.paymentMethod || '').toLowerCase();
      const isCod = pm.includes('cod') || pm.includes('cash on delivery') || (o.codStatus && o.codStatus !== 'not_cod');
      return isCod;
    });
  }, [orders]);

  // Financial aggregates
  const summary = useMemo(() => {
    const totalAmount = codOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalCount = codOrders.length;

    const pendingOrders = codOrders.filter((o) => !o.codStatus || o.codStatus === 'not_cod' || o.codStatus === 'pending_collection');
    const pendingAmount = pendingOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const collectedOrders = codOrders.filter((o) => o.codStatus === 'collected_by_courier');
    const collectedAmount = collectedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const remittedOrders = codOrders.filter((o) => o.codStatus === 'remitted_to_bank');
    const remittedAmount = remittedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return {
      totalAmount,
      totalCount,
      pendingCount: pendingOrders.length,
      pendingAmount,
      collectedCount: collectedOrders.length,
      collectedAmount,
      remittedCount: remittedOrders.length,
      remittedAmount,
    };
  }, [codOrders]);

  const filteredOrders = useMemo(() => {
    return codOrders.filter((o) => {
      // Filter by status
      if (activeFilter === 'pending_collection') {
        const isPending = !o.codStatus || o.codStatus === 'not_cod' || o.codStatus === 'pending_collection';
        if (!isPending) return false;
      } else if (activeFilter === 'collected_by_courier') {
        if (o.codStatus !== 'collected_by_courier') return false;
      } else if (activeFilter === 'remitted_to_bank') {
        if (o.codStatus !== 'remitted_to_bank') return false;
      }

      // Filter by search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNum = o.orderNumber.toLowerCase().includes(q);
        const matchCust = o.customerName.toLowerCase().includes(q);
        const matchCourier = (o.shippingCompany || '').toLowerCase().includes(q);
        if (!matchNum && !matchCust && !matchCourier) return false;
      }

      return true;
    });
  }, [codOrders, activeFilter, search]);

  const handleStatusChange = async (orderId: string, newStatus: CodStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderCodStatus(
        orderId,
        newStatus,
        newStatus === 'collected_by_courier'
          ? (isAr ? 'تم استلام الكاش من شركة الشحن' : 'Cash collected by courier')
          : (isAr ? 'تم إيداع الكاش في الحساب البنكي' : 'Remitted into store bank account'),
        activeStore.id
      );

      toast(
        isAr
          ? newStatus === 'remitted_to_bank'
            ? 'تم اعتماد التحويل للحساب البنكي بنجاح ✓'
            : 'تم تسجيل تحصيل المبلغ من شركة الشحن بنجاح ✓'
          : 'COD status updated successfully ✓',
        'success'
      );
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل تحديث الحالة' : 'Failed to update COD status'), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAr ? 'سجل تحصيل الدفع عند الاستلام (COD Cash Ledger)' : 'COD Cash Collection & Bank Ledger'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'متابعة الكاش المحصل مع شركات الشحن والتسويات البنكية' : 'Track courier cash collections and bank remittances'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Financial KPI Summary Cards */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          {/* 1. Total COD */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              <span>{isAr ? 'إجمالي طلبات COD' : 'Total COD Orders'}</span>
              <Receipt className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
              {summary.totalAmount.toLocaleString()} SAR
            </div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              {summary.totalCount} {isAr ? 'طلب' : 'orders'}
            </div>
          </div>

          {/* 2. Pending Collection */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
              <span>{isAr ? 'بانتظار التحصيل' : 'Pending Collection'}</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-black text-amber-900 dark:text-amber-200 tabular-nums">
              {summary.pendingAmount.toLocaleString()} SAR
            </div>
            <div className="text-[11px] font-bold text-amber-700/80 dark:text-amber-400/80 mt-0.5">
              {summary.pendingCount} {isAr ? 'طلب قيد التوصيل' : 'in delivery'}
            </div>
          </div>

          {/* 3. Collected by Courier */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
              <span>{isAr ? 'مع شركات الشحن' : 'With Couriers'}</span>
              <Truck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-lg font-black text-blue-900 dark:text-blue-200 tabular-nums">
              {summary.collectedAmount.toLocaleString()} SAR
            </div>
            <div className="text-[11px] font-bold text-blue-700/80 dark:text-blue-400/80 mt-0.5">
              {summary.collectedCount} {isAr ? 'محصل بانتظار الإيداع' : 'awaiting remittance'}
            </div>
          </div>

          {/* 4. Remitted to Bank */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              <span>{isAr ? 'مودع في الحساب' : 'Remitted in Bank'}</span>
              <Building2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-lg font-black text-emerald-900 dark:text-emerald-200 tabular-nums">
              {summary.remittedAmount.toLocaleString()} SAR
            </div>
            <div className="text-[11px] font-bold text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              {summary.remittedCount} {isAr ? 'طلب مكتمل الإيداع' : 'completed'}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {(
              [
                { key: 'all', labelAr: 'الكل', labelEn: 'All' },
                { key: 'pending_collection', labelAr: 'قيد التحصيل', labelEn: 'Pending' },
                { key: 'collected_by_courier', labelAr: 'مع الشاحن', labelEn: 'With Courier' },
                { key: 'remitted_to_bank', labelAr: 'تم الإيداع', labelEn: 'Remitted' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeFilter === tab.key
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isAr ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'بحث برقم الطلب أو العميل...' : 'Search by order or customer...'}
              className="w-full ps-9 pe-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-y-auto flex-1 p-6">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {isAr ? 'لا توجد طلبات دفع عند الاستلام مطابقة للبحث' : 'No COD orders matching this filter'}
            </div>
          ) : (
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-bold text-start">{isAr ? 'رقم الطلب' : 'Order #'}</th>
                  <th className="py-2.5 px-3 font-bold text-start">{isAr ? 'العميل' : 'Customer'}</th>
                  <th className="py-2.5 px-3 font-bold text-start">{isAr ? 'شركة الشحن' : 'Courier'}</th>
                  <th className="py-2.5 px-3 font-bold text-start">{isAr ? 'المبلغ' : 'Amount'}</th>
                  <th className="py-2.5 px-3 font-bold text-start">{isAr ? 'حالة التحصيل' : 'COD Status'}</th>
                  <th className="py-2.5 px-3 font-bold text-center">{isAr ? 'إجراء التسوية' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredOrders.map((ord) => {
                  const status = ord.codStatus || 'pending_collection';
                  const isPending = status === 'pending_collection' || status === 'not_cod';
                  const isCollected = status === 'collected_by_courier';
                  const isRemitted = status === 'remitted_to_bank';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        #{ord.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {ord.customerName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{ord.customerPhone}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                        {ord.shippingCompany || 'SMSA Express'}
                      </td>
                      <td className="py-3 px-3 font-black tabular-nums text-slate-900 dark:text-white">
                        {ord.total} SAR
                      </td>
                      <td className="py-3 px-3">
                        {isRemitted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isAr ? 'تم الإيداع بالبنك' : 'Remitted to Bank'}</span>
                          </span>
                        )}
                        {isCollected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            <Truck className="w-3 h-3" />
                            <span>{isAr ? 'محصل مع الشاحن' : 'Collected by Courier'}</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>{isAr ? 'قيد التحصيل' : 'Pending Collection'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {isPending && (
                            <button
                              type="button"
                              disabled={updatingId === ord.id}
                              onClick={() => handleStatusChange(ord.id, 'collected_by_courier')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-all disabled:opacity-50"
                            >
                              {isAr ? 'تأكيد الاستلام' : 'Mark Collected'}
                            </button>
                          )}

                          {isCollected && (
                            <button
                              type="button"
                              disabled={updatingId === ord.id}
                              onClick={() => handleStatusChange(ord.id, 'remitted_to_bank')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all disabled:opacity-50"
                            >
                              {isAr ? 'تأكيد الإيداع بالبنك' : 'Mark Remitted'}
                            </button>
                          )}

                          {isRemitted && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>{isAr ? 'مسوى بالكامل' : 'Reconciled'}</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isAr ? 'إجمالي الطلبات المعروضة:' : 'Showing orders:'}{' '}
            <strong className="text-slate-900 dark:text-white">{filteredOrders.length}</strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            {isAr ? 'إغلاق السجل' : 'Close Ledger'}
          </button>
        </div>
      </div>
    </div>
  );
};
