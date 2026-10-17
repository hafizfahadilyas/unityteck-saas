import React, { useState } from 'react';
import type { Order, OrderReturn, ReturnReason } from '../../../types';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Info,
  DollarSign,
  FileText,
  Clock,
  Check,
} from 'lucide-react';

interface ReturnsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess?: () => void;
}

export const ReturnsManager: React.FC<ReturnsManagerProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { processOrderReturn, activeStore } = useTenant();
  const { toast } = useToast();

  const [reason, setReason] = useState<ReturnReason>('defective');
  const [reasonDetails, setReasonDetails] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(order ? order.total : 0);
  const [restockInventory, setRestockInventory] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const returnReasons: { value: ReturnReason; labelEn: string; labelAr: string }[] = [
    { value: 'defective', labelEn: 'Defective / Damaged Item', labelAr: 'منتج تالف أو به عيب مصنعي' },
    { value: 'wrong_item', labelEn: 'Wrong Item Sent', labelAr: 'تم إرسال منتج غير مطابق بالخطأ' },
    { value: 'customer_mind_change', labelEn: 'Customer Changed Mind', labelAr: 'تراجع العميل عن الشراء' },
    { value: 'not_as_described', labelEn: 'Item Not as Described', labelAr: 'المنتج لا يطابق الوصف بالمتجر' },
    { value: 'size_mismatch', labelEn: 'Size / Color Mismatch', labelAr: 'عدم تطابق المقاس أو اللون' },
    { value: 'late_delivery', labelEn: 'Delayed Delivery', labelAr: 'تأخر التوصيل من شركة الشحن' },
    { value: 'other', labelEn: 'Other Reason', labelAr: 'سبب آخر' },
  ];

  const handleApproveReturn = async (withRestock: boolean) => {
    setIsSubmitting(true);
    try {
      await processOrderReturn(
        order.id,
        {
          reason,
          reasonDetails,
          refundAmount: Number(refundAmount) || order.total,
          restockInventory: withRestock,
          adminNotes,
          status: 'approved',
        },
        activeStore.id
      );

      toast(
        isAr
          ? `تم قبول طلب الإرجاع بنجاح${withRestock ? ' وإعادة المنتجات للمخزون تلقائياً ✓' : ' ✓'}`
          : `Return approved successfully${withRestock ? ' and items restocked to inventory ✓' : ' ✓'}`,
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشلت معالجة الإرجاع' : 'Failed to process return'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectReturn = async () => {
    setIsSubmitting(true);
    try {
      await processOrderReturn(
        order.id,
        {
          reason,
          reasonDetails,
          refundAmount: 0,
          restockInventory: false,
          adminNotes: adminNotes || (isAr ? 'تم رفض طلب الإرجاع من الإدارة' : 'Return rejected by store admin'),
          status: 'rejected',
        },
        activeStore.id
      );

      toast(isAr ? 'تم رفض طلب الإرجاع' : 'Return request rejected', 'info');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل رفض الإرجاع' : 'Failed to reject return'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalItemsCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAr ? 'معالجة إرجاع واسترداد الطلب' : 'Process Order Return & Refund'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                #{order.orderNumber} · {order.customerName}
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

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Order Summary Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'قيمة الطلب الإجمالية' : 'Order Total Value'}
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {order.total} SAR
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'طريقة الدفع' : 'Payment Method'}
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {order.paymentMethod || 'COD'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'المنتجات المؤهلة للإرجاع' : 'Eligible Return Items'}
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {totalItemsCount} {isAr ? 'قطع' : 'units'}
              </div>
            </div>
          </div>

          {/* Return Reason Select */}
          <div>
            <label className="block text-xs font-black text-slate-900 dark:text-slate-100 mb-2">
              {isAr ? 'سبب طلب الإرجاع' : 'Return Reason'} <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReason)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-hidden"
            >
              {returnReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {isAr ? r.labelAr : r.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Reason Details */}
          <div>
            <label className="block text-xs font-black text-slate-900 dark:text-slate-100 mb-1.5">
              {isAr ? 'تفاصيل وملاحظات العميل' : 'Customer Notes & Reason Details'}
            </label>
            <textarea
              rows={2}
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              placeholder={
                isAr
                  ? 'اكتب أي ملاحظات ذكرها العميل بخصوص العيب أو سبب الإرجاع...'
                  : 'Enter specific details about the issue or customer comments...'
              }
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 outline-hidden resize-none"
            />
          </div>

          {/* Refund Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'المبلغ المسترد للعميل (SAR)' : 'Refund Amount (SAR)'}</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRefundAmount(order.total)}
                  className="text-[11px] font-bold text-teal-600 hover:underline"
                >
                  {isAr ? 'استرداد كامل (100%)' : 'Full Refund (100%)'}
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setRefundAmount(Math.round(order.total * 0.5))}
                  className="text-[11px] font-bold text-teal-600 hover:underline"
                >
                  {isAr ? 'استرداد 50%' : '50% Refund'}
                </button>
              </div>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              max={order.total}
              value={refundAmount}
              onChange={(e) => setRefundAmount(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-black tabular-nums focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Auto Restock Inventory Switch */}
          <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={restockInventory}
                onChange={(e) => setRestockInventory(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <div className="flex-1">
                <div className="text-xs font-black text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-teal-600" />
                  <span>
                    {isAr
                      ? 'إعادة المنتجات تلقائياً إلى مخزون المتجر (Auto-Restock)'
                      : 'Auto-Restock Returned Items back to Store Inventory'}
                  </span>
                </div>
                <p className="text-[11px] text-teal-800 dark:text-teal-400 mt-0.5 leading-relaxed">
                  {isAr
                    ? `عند تفعيل هذا الخيار، ستتم إضافة (+${totalItemsCount} قطع) فوراً إلى رصيد المخزون في قاعدة البيانات وسيتم إلغاء علامة "نفد المخزون" إن وجدت.`
                    : `When checked, (+${totalItemsCount} units) will be immediately credited back to store product inventory in MySQL, and out-of-stock badges cleared.`}
                </p>
              </div>
            </label>
          </div>

          {/* Admin Internal Notes */}
          <div>
            <label className="block text-xs font-black text-slate-900 dark:text-slate-100 mb-1.5">
              {isAr ? 'ملاحظات الإدارة الداخلية (Audit Log)' : 'Internal Admin Resolution Notes'}
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: تم فحص الشحنة في المستودع والموافقة على الإرجاع...'
                  : 'E.g., Inspected item at warehouse, approved full refund...'
              }
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-slate-500 outline-hidden"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRejectReturn}
              className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isAr ? 'رفض الإرجاع' : 'Reject Return'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleApproveReturn(restockInventory)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (isAr ? 'جاري المعالجة...' : 'Processing...')
                  : isAr
                  ? 'اعتماد الإرجاع والاسترداد'
                  : 'Approve Return & Refund'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
