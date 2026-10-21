import React, { useState } from 'react';
import type { Order, OrderStatus, CodStatus } from '../../../types';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import { ReturnsManager } from './ReturnsManager';
import { CourierShippingLabelModal } from './CourierShippingLabelModal';
import type { ShippingLabelData, CourierCarrierCode } from '../../../utils/courierBarcode';
import {
  X,
  Printer,
  Edit,
  Truck,
  RotateCcw,
  CheckCircle,
  Clock,
  Package,
  Calendar,
  CreditCard,
  Banknote,
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  Tag,
} from 'lucide-react';
import { handleImageError, FALLBACK_PRODUCT_IMAGE, resolveProductThumbnail } from '../../../utils/imageFallback';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onPrintInvoice?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onPrintInvoice,
  onEditOrder,
}) => {
  const { locale, t } = usePrefs();
  const isAr = locale === 'ar';
  const { updateOrderStatus, updateOrder, updateOrderCodStatus, activeStore } = useTenant();
  const { toast } = useToast();

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [showShippingLabel, setShowShippingLabel] = useState(false);
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [courierName, setCourierName] = useState(order?.shippingCompany || 'SMSA Express');
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || '');

  if (!isOpen || !order) return null;

  const isCod = (order.paymentMethod || '').toLowerCase().includes('cod') ||
    (order.paymentMethod || '').toLowerCase().includes('cash') ||
    Boolean(order.codStatus && order.codStatus !== 'not_cod');

  const lifecycleSteps: { key: OrderStatus; labelAr: string; labelEn: string }[] = [
    { key: 'pending', labelAr: 'جديد / معلق', labelEn: 'Pending' },
    { key: 'processing', labelAr: 'قيد التجهيز', labelEn: 'Processing' },
    { key: 'shipped', labelAr: 'تم الشحن', labelEn: 'Shipped' },
    { key: 'out_for_delivery', labelAr: 'خرج للتوصيل', labelEn: 'Out for Delivery' },
    { key: 'delivered', labelAr: 'تم التوصيل', labelEn: 'Delivered' },
  ];

  const currentStepIndex = (() => {
    if (order.status === 'completed') return 4;
    return lifecycleSteps.findIndex((s) => s.key === order.status);
  })();

  const handleStepTransition = async (newStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      updateOrderStatus(order.id, newStatus, activeStore.id);
      toast(
        isAr
          ? `تم تحديث حالة الطلب إلى "${lifecycleSteps.find((s) => s.key === newStatus)?.labelAr || newStatus}" بنجاح`
          : `Order status updated to ${newStatus}`,
        'success'
      );
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل تحديث الحالة' : 'Failed to update status'), 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveTracking = () => {
    updateOrder(
      order.id,
      {
        shippingCompany: courierName,
        trackingNumber,
        shippingStatus: 'In Transit',
        status: order.status === 'pending' || order.status === 'processing' ? 'shipped' : order.status,
      },
      activeStore.id
    );
    setIsEditingTracking(false);
    toast(
      isAr ? 'تم حفظ رقم التتبع وتحديث شركة الشحن بنجاح ✓' : 'Tracking info saved successfully ✓',
      'success'
    );
  };

  const handleCodStatusUpdate = async (newCodStatus: CodStatus) => {
    try {
      await updateOrderCodStatus(order.id, newCodStatus, undefined, activeStore.id);
      toast(
        isAr ? 'تم تحديث حالة تحصيل الدفع عند الاستلام بنجاح ✓' : 'COD status updated successfully ✓',
        'success'
      );
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل التحديث' : 'Failed to update'), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isAr ? 'تفاصيل الطلب' : 'Order Details'} #{order.orderNumber}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">· {order.date}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {order.customerName} · {order.customerPhone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShippingLabel(true)}
              className="px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-800 dark:text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isAr ? 'طباعة بوليصة الشحن اللوجستية (AWB Barcode)' : 'Print Shipping Label'}
            >
              <Truck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'بوليصة الشحن (AWB)' : 'Shipping Label'}</span>
            </button>

            {onPrintInvoice && (
              <button
                type="button"
                onClick={() => onPrintInvoice(order)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* 1. Lifecycle Progression Pipeline Stepper */}
          {order.status !== 'cancelled' && order.status !== 'returned' ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
                <span>{isAr ? 'مراحل الطلب ومسار التجهيز' : 'Order Fulfillment Progression Pipeline'}</span>
                <span className="text-[11px] font-black text-teal-600 dark:text-teal-400 uppercase">
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 relative">
                {lifecycleSteps.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div
                      key={step.key}
                      onClick={() => handleStepTransition(step.key)}
                      className={`p-2.5 rounded-xl text-center cursor-pointer transition-all border ${
                        isCurrent
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm scale-[1.02]'
                          : isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {isDone && !isCurrent ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-current text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold truncate leading-tight">
                        {isAr ? step.labelAr : step.labelEn}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                order.status === 'returned'
                  ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-xs font-black">
                    {order.status === 'returned'
                      ? isAr
                        ? 'تم إرجاع هذا الطلب واسترداد قيمته'
                        : 'Order Returned & Refunded'
                      : isAr
                      ? 'هذا الطلب ملغي'
                      : 'This Order is Cancelled'}
                  </h4>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {order.returnReason || order.cancelReason
                      ? `"${order.returnReason || order.cancelReason}"`
                      : isAr
                      ? 'تمت التسوية وإعادة كميات المنتجات إلى المخزون تلقائياً.'
                      : 'Settled and inventory quantities restored to store catalog.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStepTransition('processing')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                {isAr ? 'إعادة تنشيط الطلب' : 'Reactivate Order'}
              </button>
            </div>
          )}

          {/* 2. Quick Action Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mark Processing */}
              {order.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => handleStepTransition('processing')}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  {isAr ? 'بدء التجهيز' : 'Start Processing'}
                </button>
              )}

              {/* Mark Shipped */}
              {(order.status === 'pending' || order.status === 'processing') && (
                <button
                  type="button"
                  onClick={() => setIsEditingTracking(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{isAr ? 'شحن الطلب وإضافة التتبع' : 'Mark Shipped'}</span>
                </button>
              )}

              {/* Mark Delivered */}
              {order.status === 'shipped' && (
                <button
                  type="button"
                  onClick={() => handleStepTransition('delivered')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تأكيد التوصيل' : 'Mark Delivered'}</span>
                </button>
              )}

              {/* Return / Refund button */}
              {order.status !== 'returned' && order.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => setShowReturnsModal(true)}
                  className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طلب إرجاع واسترداد' : 'Return / Refund'}</span>
                </button>
              )}
            </div>

            {onEditOrder && (
              <button
                type="button"
                onClick={() => onEditOrder(order)}
                className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{isAr ? 'تعديل البيانات' : 'Edit Order'}</span>
              </button>
            )}
          </div>

          {/* 3. Courier & Tracking Inline Editor */}
          {isEditingTracking && (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? 'بيانات شركة الشحن ورقم التتبع' : 'Shipping Carrier & Tracking Number'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingTracking(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isAr ? 'شركة الشحن' : 'Carrier'}
                  </label>
                  <select
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold outline-hidden"
                  >
                    <option value="SMSA Express">SMSA Express (سمسا)</option>
                    <option value="Aramex">Aramex (أرامكس)</option>
                    <option value="SPL (Saudi Post)">SPL - سبل (البريد السعودي)</option>
                    <option value="DHL Express">DHL Express</option>
                    <option value="J&T Express">J&T Express</option>
                    <option value="Store Courier">توصيل مندوب المتجر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isAr ? 'رقم التتبع (AWB / Tracking Number)' : 'Tracking / Waybill Number'}
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. 29384756201"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono font-bold outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveTracking}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  {isAr ? 'حفظ وتحديث التتبع' : 'Save & Update Tracking'}
                </button>
              </div>
            </div>
          )}

          {/* 4. COD Ledger Tracking Box (if COD) */}
          {isCod && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                    {isAr ? 'حالة تحصيل الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD) Status'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-900">
                    {order.codStatus || 'pending_collection'}
                  </span>
                </div>

                <div className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
                  {order.total} SAR
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => handleCodStatusUpdate('collected_by_courier')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-all"
                >
                  {isAr ? 'تم استلام الكاش من شركة الشحن' : 'Mark Collected by Courier'}
                </button>

                <button
                  type="button"
                  onClick={() => handleCodStatusUpdate('remitted_to_bank')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all"
                >
                  {isAr ? 'تم الإيداع بالحساب البنكي' : 'Mark Remitted to Bank'}
                </button>

                {order.codRemittedAt && (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تمت التسوية البنكية بنجاح' : 'Bank reconciled'}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 5. Products Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? 'المنتجات المطلوبة' : 'Ordered Items'}</span>
              <span className="text-slate-400 text-[11px]">({order.items?.length || 1})</span>
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3 font-bold text-start">{isAr ? 'المنتج' : 'Product'}</th>
                    <th className="py-2.5 px-3 font-bold text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="py-2.5 px-3 font-bold text-end">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th className="py-2.5 px-3 font-bold text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {(order.items && order.items.length > 0 ? order.items : [
                    {
                      id: 'it-default',
                      name: isAr ? 'باقة منتجات المتجر' : 'Store Catalog Package',
                      sku: 'SKU-001',
                      price: order.total,
                      quantity: 1,
                      total: order.total,
                    }
                  ]).map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={resolveProductThumbnail(item)}
                            onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.sku || 'SKU-STD'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold tabular-nums">
                        {item.quantity || 1}
                      </td>
                      <td className="py-3 px-3 text-end font-bold tabular-nums">
                        {item.price} SAR
                      </td>
                      <td className="py-3 px-3 text-end font-black tabular-nums text-slate-900 dark:text-white">
                        {item.total || ((item.price || 0) * (item.quantity || 1))} SAR
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <div className="text-end space-y-1 text-xs">
                  <div className="text-slate-500">
                    {isAr ? 'الإجمالي النهائي:' : 'Grand Total:'}{' '}
                    <strong className="text-slate-900 dark:text-white text-sm font-black tabular-nums">
                      {order.total} SAR
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Customer & Delivery Address Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'بيانات العميل' : 'Customer Info'}</span>
              </h5>
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{order.customerName}</div>
                <div className="text-slate-500 font-mono">{order.customerPhone}</div>
                {order.customerEmail && <div className="text-slate-400">{order.customerEmail}</div>}
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    <span>{isAr ? 'مراسلة عبر واتساب' : 'Chat via WhatsApp'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'عنوان التوصيل' : 'Delivery Address'}</span>
              </h5>
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {order.deliveryLocation || order.shippingAddress || (isAr ? 'مكة المكرمة - المملكة العربية السعودية' : 'Makkah, Saudi Arabia')}
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                {isAr ? 'شركة الشحن:' : 'Carrier:'}{' '}
                <strong className="text-slate-700 dark:text-slate-200">{order.shippingCompany || 'SMSA Express'}</strong>
                {order.trackingNumber && (
                  <span className="ms-2 font-mono text-teal-600">({order.trackingNumber})</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isAr ? 'معرف الطلب:' : 'Order ID:'} <span className="font-mono text-slate-700 dark:text-slate-300">{order.id}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            {isAr ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>
      </div>

      {/* Returns / Refund Manager Modal */}
      {showReturnsModal && (
        <ReturnsManager
          isOpen={showReturnsModal}
          onClose={() => setShowReturnsModal(false)}
          order={order}
        />
      )}

      {/* Courier Shipping Label Printable Barcode Modal */}
      {showShippingLabel && (
        <CourierShippingLabelModal
          isOpen={showShippingLabel}
          onClose={() => setShowShippingLabel(false)}
          labelData={{
            carrier: (courierName.toLowerCase().includes('spl') || courierName.toLowerCase().includes('post')
              ? 'spl'
              : courierName.toLowerCase().includes('aramex')
              ? 'aramex'
              : courierName.toLowerCase().includes('dhl')
              ? 'dhl'
              : 'smsa') as CourierCarrierCode,
            carrierName: courierName || 'SMSA Express',
            carrierNameAr: courierName.toLowerCase().includes('spl')
              ? 'سبل (البريد السعودي)'
              : courierName.toLowerCase().includes('aramex')
              ? 'أرامكس'
              : 'سمسا إكسبريس',
            trackingNumber: trackingNumber || order.trackingNumber || `TRK-SA-${order.orderNumber.replace(/[^0-9]/g, '') || '98421'}`,
            awbNumber: `AWB-${order.orderNumber.replace(/[^0-9]/g, '') || '98421'}-SA`,
            orderNumber: order.orderNumber,
            orderDate: order.date || new Date().toISOString().split('T')[0],
            sender: {
              name: activeStore.name || 'Makkah Gifts & Luxury Flowers Est.',
              nameAr: activeStore.nameAr || 'مؤسسة هدايا مكة والزهور الفاخرة',
              phone: '+966 12 555 8899',
              address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
              city: 'Makkah',
              country: 'Saudi Arabia',
            },
            recipient: {
              name: order.customerName,
              phone: order.customerPhone,
              address: order.shippingAddress || order.deliveryLocation || 'Al-Nuzha District, Makkah',
              city: order.deliveryLocation?.split(' ')[0] || 'Makkah',
              country: 'Saudi Arabia',
            },
            packageDetails: {
              weightKg: 2.5,
              pieces: order.items?.length || 1,
              contentDescription: 'Store Catalog Items & Luxury Gifts',
              contentDescriptionAr: 'منتجات متجر وهدايا فاخرة',
              declaredValueSar: Number(order.total) || 100,
            },
            payment: {
              method: isCod ? 'cod' : 'prepaid',
              codAmountSar: isCod ? Number(order.total) || 0 : undefined,
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
    </div>
  );
};
