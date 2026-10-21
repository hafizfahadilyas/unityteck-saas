import React, { useState, useEffect } from 'react';
import type { Order, OrderStatus } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  X,
  Check,
  Truck,
  CreditCard,
  Package,
  ShieldCheck,
  FileText,
  Link2,
  ExternalLink,
  UserCheck,
  RotateCcw,
  RefreshCw,
  History,
  AlertCircle,
} from 'lucide-react';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (orderId: string, updates: Partial<Order>) => void;
}

const EMPLOYEES = [
  { id: 'emp-1', name: 'Sarah Ahmed', nameAr: 'سارة أحمد', initials: 'SA' },
  { id: 'emp-2', name: 'Mohammed Ali', nameAr: 'محمد علي', initials: 'MA' },
  { id: 'emp-3', name: 'Fahad Al-Otaibi', nameAr: 'فهد العتيبي', initials: 'FA' },
  { id: 'emp-4', name: 'Lina Khaled', nameAr: 'لينا خالد', initials: 'LK' },
];

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onSave,
}) => {
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';

  const [status, setStatus] = useState<OrderStatus>('processing');
  const [paymentStatus, setPaymentStatus] = useState<string>('Paid');
  const [shippingCompany, setShippingCompany] = useState<string>('SMSA Express');
  const [shippingStatus, setShippingStatus] = useState<string>('Delivered');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [shippingLabelNumber, setShippingLabelNumber] = useState<string>('');
  const [shippingTrackingUrl, setShippingTrackingUrl] = useState<string>('');
  const [assignedEmployee, setAssignedEmployee] = useState<string>('Sarah Ahmed');
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [refundStatus, setRefundStatus] = useState<string>('none');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status || 'processing');
      setPaymentStatus(order.paymentStatus || 'Paid');
      setShippingCompany(order.shippingCompany || 'SMSA Express');
      setShippingStatus(order.shippingStatus || 'Delivered');
      setTrackingNumber(order.trackingNumber || '');
      setShippingLabelNumber((order as any).shippingLabelNumber || '');
      setShippingTrackingUrl(
        (order as any).shippingTrackingUrl ||
          (order.trackingNumber ? `https://www.smsaexpress.com/track/${order.trackingNumber}` : '')
      );
      setAssignedEmployee((order as any).assignedEmployee || 'Sarah Ahmed');
      setCancellationReason(order.cancelReason || order.returnReason || '');
      setRefundStatus(order.refundStatus || 'none');
      setInternalNotes(order.internalNotes || '');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(order.id, {
      status,
      paymentStatus: paymentStatus as any,
      shippingCompany,
      shippingStatus: shippingStatus as any,
      trackingNumber,
      shippingLabelNumber,
      shippingTrackingUrl,
      assignedEmployee,
      cancelReason: cancellationReason,
      refundStatus: refundStatus as any,
      internalNotes,
    });
    onClose();
  };

  const isCancelOrReturn = status === 'cancelled' || status === 'returned';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#071E26] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header matching Image 2 */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {isAr ? `تعديل الطلب #${order.orderNumber}` : `Edit Order #${order.orderNumber}`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr ? 'تحديث تفاصيل الطلب، الشحن، وحالة الدفع' : 'Update order, shipping, and payment details'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body matching Image 2 Grid */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Row 1: Order Status & Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'حالة الطلب' : 'Order Status'}</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
              >
                <option value="pending">{isAr ? 'بانتظار الدفع' : 'Pending Payment'}</option>
                <option value="processing">{isAr ? 'قيد المعالجة' : 'Processing'}</option>
                <option value="shipped">{isAr ? 'تم الشحن' : 'Shipped'}</option>
                <option value="out_for_delivery">{isAr ? 'جاري التوصيل' : 'Out for Delivery'}</option>
                <option value="delivered">{isAr ? 'تم التوصيل' : 'Delivered'}</option>
                <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                <option value="cancelled">{isAr ? 'ملغي' : 'Cancelled'}</option>
                <option value="returned">{isAr ? 'مسترجع' : 'Returned'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'حالة الدفع' : 'Payment Status'}</span>
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
              >
                <option value="Paid">{isAr ? 'مدفوع' : 'Paid'}</option>
                <option value="Pending">{isAr ? 'قيد الانتظار' : 'Pending Payment'}</option>
                <option value="Refunded">{isAr ? 'مسترد' : 'Refunded'}</option>
                <option value="Failed">{isAr ? 'فشلت العملية' : 'Payment Failed'}</option>
              </select>
            </div>
          </div>

          {/* Row 2: Shipping Company & Shipping Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'شركة الشحن' : 'Shipping Company'}</span>
              </label>
              <select
                value={shippingCompany}
                onChange={(e) => setShippingCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
              >
                <option value="SMSA Express">SMSA Express (سمسا)</option>
                <option value="Aramex">Aramex (أرامكس)</option>
                <option value="Saudi Post SPL">SPL (البريد السعودي)</option>
                <option value="DHL Express">DHL Express</option>
                <option value="RedBox">RedBox (ريدبوكس)</option>
                <option value="Torod">Torod (طرود)</option>
                <option value="J&T Express">J&T Express</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'حالة الشحن' : 'Shipping Status'}</span>
              </label>
              <select
                value={shippingStatus}
                onChange={(e) => setShippingStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
              >
                <option value="Delivered">{isAr ? 'تم التوصيل' : 'Delivered'}</option>
                <option value="Out for Delivery">{isAr ? 'جاري التوصيل' : 'Out for Delivery'}</option>
                <option value="In Transit">{isAr ? 'قيد النقل والتوصيل' : 'In Transit'}</option>
                <option value="Handed to Carrier">{isAr ? 'تم التسليم لشركة الشحن' : 'Handed to Carrier'}</option>
                <option value="Ready to Ship">{isAr ? 'جاهز للشحن' : 'Ready to Ship'}</option>
                <option value="Not Shipped">{isAr ? 'لم يتم الشحن' : 'Not Shipped'}</option>
                <option value="Delivery Failed">{isAr ? 'تعذر التوصيل' : 'Delivery Failed'}</option>
              </select>
            </div>
          </div>

          {/* Row 3: Tracking Number & Shipping Label Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'رقم التتبع' : 'Tracking Number'}</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => {
                  setTrackingNumber(e.target.value);
                  if (e.target.value && !shippingTrackingUrl) {
                    setShippingTrackingUrl(`https://www.smsaexpress.com/track/${e.target.value}`);
                  }
                }}
                placeholder="e.g. MKK-EXP-112"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'رقم بوليصة الشحن' : 'Shipping Label Number'}</span>
              </label>
              <input
                type="text"
                value={shippingLabelNumber}
                onChange={(e) => setShippingLabelNumber(e.target.value)}
                placeholder="e.g. SL-778899"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
              />
            </div>
          </div>

          {/* Row 4: Shipment Tracking URL & Assigned Employee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'رابط تتبع الشحنة' : 'Shipment Tracking URL'}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={shippingTrackingUrl}
                  onChange={(e) => setShippingTrackingUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full ps-3.5 pe-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
                />
                {shippingTrackingUrl && (
                  <a
                    href={shippingTrackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-teal-600 hover:text-teal-700 p-1"
                    title={isAr ? 'فتح الرابط' : 'Open URL'}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'الموظف المعين' : 'Assigned Employee'}</span>
              </label>
              <select
                value={assignedEmployee}
                onChange={(e) => setAssignedEmployee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
              >
                {EMPLOYEES.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.initials} - {isAr ? emp.nameAr : emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Cancellation / Return Reason & Refund Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'سبب الإلغاء / الإرجاع' : 'Cancellation / Return Reason'}</span>
                </label>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isCancelOrReturn
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCancelOrReturn ? (isAr ? 'مطلوب' : 'Required') : (isAr ? 'اختياري' : 'Optional')}
                </span>
              </div>
              <select
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
              >
                <option value="">{isAr ? '-- اختر السبب --' : 'Select reason'}</option>
                <option value="Customer Mind Change">{isAr ? 'تراجع العميل عن الشراء' : 'Customer Mind Change'}</option>
                <option value="Defective Product">{isAr ? 'منتج معيب أو تالف' : 'Defective Product'}</option>
                <option value="Wrong Item Delivered">{isAr ? 'تم تسليم منتج خاطئ' : 'Wrong Item Delivered'}</option>
                <option value="Delayed Delivery">{isAr ? 'تأخر التوصيل' : 'Delayed Delivery'}</option>
                <option value="Out of Stock">{isAr ? 'نفاد الكمية من المخزون' : 'Out of Stock'}</option>
                <option value="Other">{isAr ? 'أخرى' : 'Other'}</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                {isAr ? 'مطلوب عندما تكون حالة الطلب ملغي أو مسترجع' : 'Required when order status is Cancelled or Returned'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'حالة الاسترداد المالي' : 'Refund Status'}</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {isAr ? 'اختياري' : 'Optional'}
                </span>
              </div>
              <select
                value={refundStatus}
                onChange={(e) => setRefundStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
              >
                <option value="none">{isAr ? 'لا يوجد استرداد' : 'Select refund status'}</option>
                <option value="pending">{isAr ? 'قيد المراجعة' : 'Pending Review'}</option>
                <option value="approved">{isAr ? 'تمت الموافقة' : 'Approved'}</option>
                <option value="refunded">{isAr ? 'تم الاسترداد' : 'Refunded'}</option>
                <option value="rejected">{isAr ? 'مرفوض' : 'Rejected'}</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                {isAr ? 'مطلوب عند إصدار استرداد مالي' : 'Required when a refund is issued'}
              </p>
            </div>
          </div>

          {/* Row 6: Internal Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'ملاحظات داخلية' : 'Internal Notes'}</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                {isAr ? 'اختياري' : 'Optional'}
              </span>
            </div>
            <textarea
              value={internalNotes}
              maxLength={500}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder={isAr ? 'أضف ملاحظات داخلية (مرئية للموظفين فقط)...' : 'Add internal notes (visible to staff only)...'}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500 resize-none"
            />
            <div className="text-end text-[10px] font-mono text-slate-400 mt-0.5">
              {internalNotes.length}/500
            </div>
          </div>

          {/* Row 7: View Change History Link matching Image 2 */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 cursor-pointer transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض سجل التغييرات' : 'View Change History'}</span>
            </button>
          </div>

          {/* Footer Actions matching Image 2 */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer transition-all hover:opacity-95 flex items-center gap-1.5"
              style={{ background: '#0d9488' }}
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Change History Sub-Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#071E26] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                <span>{isAr ? 'سجل تدقيق وتغييرات الطلب' : 'Order Change Audit History'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs max-h-60 overflow-y-auto">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
                  <span>{order.date || 'Today'}</span>
                  <span>{isAr ? 'النظام' : 'System'}</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {isAr ? 'تم إنشاء الطلب بنجاح' : 'Order placed successfully'}
                </p>
              </div>
              {order.timeline?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
                    <span>{item.date} {item.time}</span>
                    <span>Admin</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
            <div className="text-end pt-2">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
