import React, { useEffect, useState } from 'react';
import type { Order, OrderStatus, CodStatus } from '../../../types';
import { usePrefs } from '../../../i18n/PrefsContext';
import { commerceTerm } from '../../../i18n/commerceTerms';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import { GlobalModal } from '../../common/GlobalModal';
import { ReturnsManager } from './ReturnsManager';
import { CourierShippingLabelModal } from './CourierShippingLabelModal';
import type { CourierCarrierCode } from '../../../utils/courierBarcode';
import {
  fetchOrderInstallmentsApi,
  createOrderInstallmentsApi,
  recordInstallmentPaymentApi,
  fetchStoreBankAccountsApi,
  type OrderInstallmentRow,
  type StoreBankAccountRow,
} from '../../../api/tenantApi';
import { sendWhatsAppMessageApi } from '../../../services/whatsappManagerService';
import {
  X,
  Printer,
  Edit,
  Truck,
  RotateCcw,
  CheckCircle,
  Package,
  CreditCard,
  Banknote,
  Phone,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Check,
  MessageCircle,
} from 'lucide-react';
import { handleImageError, FALLBACK_PRODUCT_IMAGE, resolveProductThumbnail } from '../../../utils/imageFallback';
import {
  getCustomerDisplayName,
  getLocalizedAddress,
} from '../../../utils/storeLocalization';

function digitsOnlyPhone(phone?: string | null): string {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function openWhatsAppChat(phone: string, message: string) {
  const digits = digitsOnlyPhone(phone);
  if (!digits) return false;
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

function localizeInstallmentStatus(status: string, isAr: boolean): string {
  const key = String(status || '').toLowerCase();
  if (key === 'pending') return isAr ? 'بانتظار الدفع' : 'Pending Payment';
  if (key === 'paid' || key === 'completed') {
    return isAr ? 'مدفوع' : 'Paid';
  }
  if (key === 'overdue' || key === 'late') {
    return isAr ? 'متأخر' : 'Overdue';
  }
  if (key === 'partial') return commerceTerm('partialPayment', isAr);
  return status || '—';
}

function splitEqualAmounts(total: number, count: number): number[] {
  const n = Math.max(1, count);
  const cents = Math.round(Number(total) * 100);
  const base = Math.floor(cents / n);
  const amounts: number[] = [];
  let allocated = 0;
  for (let i = 0; i < n - 1; i++) {
    amounts.push(base / 100);
    allocated += base;
  }
  amounts.push((cents - allocated) / 100);
  return amounts;
}

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
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { updateOrderStatus, updateOrder, updateOrderCodStatus, activeStore } = useTenant();
  const { toast } = useToast();

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [showShippingLabel, setShowShippingLabel] = useState(false);
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [courierName, setCourierName] = useState(order?.shippingCompany || '');
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || '');
  const [installments, setInstallments] = useState<OrderInstallmentRow[]>([]);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const [installmentsError, setInstallmentsError] = useState<string | null>(null);
  const [generatingInstallments, setGeneratingInstallments] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(3);
  const [recordingInstallmentId, setRecordingInstallmentId] = useState<string | null>(null);
  const [waSending, setWaSending] = useState(false);
  const [bankAccount, setBankAccount] = useState<StoreBankAccountRow | null>(null);

  const lifecycleSteps: { key: OrderStatus; labelAr: string; labelEn: string }[] = [
    { key: 'pending', labelAr: 'بانتظار الدفع', labelEn: 'Pending Payment' },
    { key: 'processing', labelAr: 'قيد التنفيذ', labelEn: 'Processing' },
    { key: 'shipped', labelAr: 'تم الشحن', labelEn: 'Shipped' },
    { key: 'out_for_delivery', labelAr: 'جاري التوصيل', labelEn: 'Out for Delivery' },
    { key: 'delivered', labelAr: 'تم التوصيل', labelEn: 'Delivered' },
  ];

  const reloadInstallments = async (storeId: string, orderId: string) => {
    setInstallmentsLoading(true);
    setInstallmentsError(null);
    try {
      const rows = await fetchOrderInstallmentsApi(storeId, orderId);
      setInstallments(Array.isArray(rows) ? rows : []);
    } catch (err: any) {
      setInstallments([]);
      setInstallmentsError(
        err?.message || (isAr ? 'تعذر تحميل الأقساط' : 'Failed to load installments'),
      );
    } finally {
      setInstallmentsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !order?.id || !activeStore?.id) {
      return;
    }
    setCourierName(order.shippingCompany || '');
    setTrackingNumber(order.trackingNumber || '');
    void reloadInstallments(activeStore.id, order.id);

    const bankId = order.bankAccountId;
    if (!bankId) {
      setBankAccount(null);
      return;
    }
    let cancelled = false;
    void fetchStoreBankAccountsApi(activeStore.id)
      .then((rows) => {
        if (cancelled) return;
        setBankAccount(rows.find((b) => b.id === bankId) || null);
      })
      .catch(() => {
        if (!cancelled) setBankAccount(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when modal/order/store opens
  }, [isOpen, order?.id, order?.bankAccountId, activeStore?.id]);

  // ALL hooks must stay above this early return
  if (!isOpen || !order) return null;

  const isCod = (order.paymentMethod || '').toLowerCase().includes('cod') ||
    (order.paymentMethod || '').toLowerCase().includes('cash') ||
    Boolean(order.codStatus && order.codStatus !== 'not_cod');

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

  const currencyLabel = commerceTerm('currencySar', isAr);
  const customerPhoneDigits = digitsOnlyPhone(order.customerPhone);
  const orderTotalNum = Number(order.total);
  const hasRealOrderTotal = Number.isFinite(orderTotalNum) && orderTotalNum > 0;
  const isInstallmentPlan = order.paymentPlan === 'installment';
  const canGenerateInstallments =
    isInstallmentPlan && installments.length === 0 && hasRealOrderTotal && Boolean(activeStore?.id);

  const handleGenerateInstallments = async () => {
    if (!activeStore?.id || !canGenerateInstallments || generatingInstallments) return;
    const count = installmentCount === 4 ? 4 : 3;
    const amounts = splitEqualAmounts(orderTotalNum, count);
    setGeneratingInstallments(true);
    try {
      const base = new Date();
      for (let i = 0; i < count; i++) {
        const due = new Date(base);
        due.setDate(due.getDate() + 30 * (i + 1));
        await createOrderInstallmentsApi(activeStore.id, order.id, {
          installment_number: i + 1,
          amount: amounts[i],
          due_date: due.toISOString().slice(0, 10),
        });
      }
      await reloadInstallments(activeStore.id, order.id);
      toast(
        isAr ? 'تم إنشاء جدول الأقساط بنجاح' : 'Installment schedule created successfully',
        'success',
      );
    } catch (err: any) {
      toast(
        err?.message || (isAr ? 'تعذر إنشاء الأقساط' : 'Failed to create installments'),
        'error',
      );
    } finally {
      setGeneratingInstallments(false);
    }
  };

  const handleRecordInstallmentPayment = async (row: OrderInstallmentRow) => {
    if (!activeStore?.id || recordingInstallmentId) return;
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast(isAr ? 'مبلغ القسط غير صالح' : 'Invalid installment amount', 'error');
      return;
    }
    setRecordingInstallmentId(row.id);
    try {
      await recordInstallmentPaymentApi(activeStore.id, order.id, {
        installment_id: row.id,
        recorded_amount: amount,
      });
      await reloadInstallments(activeStore.id, order.id);
      toast(isAr ? 'تم تسجيل الدفعة بنجاح' : 'Payment recorded successfully', 'success');
    } catch (err: any) {
      toast(
        err?.message || (isAr ? 'تعذر تسجيل الدفعة' : 'Failed to record payment'),
        'error',
      );
    } finally {
      setRecordingInstallmentId(null);
    }
  };

  const openWaAction = async (kind: 'order' | 'invoice' | 'payment' | 'status') => {
    if (!customerPhoneDigits) {
      toast(isAr ? 'لا يوجد رقم جوال للعميل' : 'Customer phone is missing', 'error');
      return;
    }
    if (waSending || !activeStore?.id) return;

    const storeLabel = activeStore?.name || '';
    const orderRef = order.orderNumber || order.id;
    const totalLine =
      order.total != null ? `${order.total} ${currencyLabel}` : '';
    const paidLine =
      order.amountPaid != null
        ? `${commerceTerm('amountPaid', isAr)}: ${order.amountPaid} ${currencyLabel}`
        : '';
    const remainingLine =
      order.remainingBalance != null
        ? `${commerceTerm('remainingBalance', isAr)}: ${order.remainingBalance} ${currencyLabel}`
        : '';
    const bankLine = bankAccount
      ? [
          `${commerceTerm('bankAccount', isAr)}: ${(isAr && bankAccount.bank_name_ar) || bankAccount.bank_name}`,
          `${isAr ? 'اسم الحساب' : 'Account'}: ${(isAr && bankAccount.account_title_ar) || bankAccount.account_title}`,
          `IBAN: ${bankAccount.iban}`,
        ].join('\n')
      : order.bankAccountId
        ? `${commerceTerm('bankAccount', isAr)}: ${order.bankAccountId}`
        : '';
    const statusLabel = isAr
      ? lifecycleSteps.find((s) => s.key === order.status)?.labelAr || order.status
      : lifecycleSteps.find((s) => s.key === order.status)?.labelEn || order.status;

    let message = '';
    if (kind === 'order') {
      message = isAr
        ? `طلبك${orderRef}من${storeLabel}. الإجمالي:${totalLine}`
        : `Your order ${orderRef} from ${storeLabel}. Total: ${totalLine}`;
    } else if (kind === 'invoice') {
      message = isAr
        ? `فاتورة الطلب${orderRef}\nالإجمالي:${totalLine}\nطريقة الدفع:${order.paymentMethod || '—'}`
        : `Invoice for order ${orderRef}\nTotal: ${totalLine}\nPayment method: ${order.paymentMethod || '—'}`;
    } else if (kind === 'payment') {
      message = [
        isAr ? `تفاصيل الدفع للطلب${orderRef}` : `Payment details for order ${orderRef}`,
        totalLine ? (isAr ? `الإجمالي:${totalLine}` : `Total: ${totalLine}`) : '',
        paidLine,
        remainingLine,
        bankLine,
      ]
        .filter(Boolean)
        .join('\n');
    } else {
      message = isAr
        ? `حالة طلبك${orderRef}:${statusLabel}`
        : `Your order ${orderRef} status: ${statusLabel}`;
    }

    const openedChatToast = () =>
      toast(isAr ? 'تم فتح المحادثة' : 'Opened chat', 'info');

    setWaSending(true);
    try {
      const res = await sendWhatsAppMessageApi(activeStore.id, {
        phone_number: order.customerPhone || customerPhoneDigits,
        customer_name: order.customerName,
        order_id: order.id,
        order_number: order.orderNumber,
        message_content: message,
        message_type:
          kind === 'invoice'
            ? 'Order Invoice'
            : kind === 'payment'
              ? 'Payment Details'
              : kind === 'status'
                ? 'Order Status'
                : 'Order Details',
        category: 'order',
        send_mode: 'api',
      });

      if (res?.direct_url || res?.is_direct_free) {
        const url =
          res.direct_url ||
          `https://wa.me/${customerPhoneDigits}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        openedChatToast();
        return;
      }

      if (res?.success) {
        toast(isAr ? 'تم إرسال رسالة واتساب بنجاح' : 'WhatsApp message sent successfully', 'success');
        return;
      }

      // API returned without confirmed cloud send — open chat only
      openWhatsAppChat(order.customerPhone, message);
      openedChatToast();
    } catch (err: any) {
      const opened = openWhatsAppChat(order.customerPhone, message);
      if (opened) {
        openedChatToast();
      } else {
        toast(
          err?.message || (isAr ? 'تعذر إرسال الرسالة' : 'Failed to send message'),
          'error',
        );
      }
    } finally {
      setWaSending(false);
    }
  };

  const hasPaymentSummary =
    order.subtotal != null ||
    order.discountAmount != null ||
    order.shippingFee != null ||
    order.tax != null ||
    order.total != null ||
    order.amountPaid != null ||
    order.remainingBalance != null ||
    Boolean(order.bankAccountId);

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? `تفاصيل الطلب #${order.orderNumber}` : `Order Details #${order.orderNumber}`}
    >
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[min(92vh,92dvh)]">
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
                {getCustomerDisplayName(order.customerName, locale)} · {order.customerPhone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const number = (trackingNumber || order.trackingNumber || '').trim();
                if (!number) {
                  toast(isAr ? 'أضف رقم التتبع قبل طباعة البوليصة' : 'Add a tracking number before printing the label', 'error');
                  return;
                }
                setShowShippingLabel(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-800 dark:text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isAr ? 'طباعة بوليصة الشحن' : 'Print shipping label'}
            >
              <Truck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'بوليصة الشحن' : 'Shipping label'}</span>
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
                    <option value="">{isAr ? 'غير محدد' : 'Not set'}</option>
                    <option value="Free Shipping">{isAr ? 'شحن مجاني' : 'Free Shipping'}</option>
                    <option value="J&T Express">{isAr ? 'جي اند تي اكسبريس' : 'J&T Express'}</option>
                    <option value="DHL Express">{isAr ? 'DHL Express' : 'DHL Express'}</option>
                    <option value="Aymakan">{isAr ? 'أي مكان' : 'Aymakan'}</option>
                    <option value="SMSA">{isAr ? 'سمسا' : 'SMSA'}</option>
                    <option value="Aramex">{isAr ? 'أرامكس' : 'Aramex'}</option>
                    <option value="Redbox">{isAr ? 'ريدبوكس' : 'Redbox'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {commerceTerm('trackingNumber', isAr)}
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
                    {isAr ? 'حالة تحصيل الدفع عند الاستلام' : 'Cash on Delivery Status'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-900">
                    {order.codStatus || 'pending_collection'}
                  </span>
                </div>

                <div className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
                  {order.total} {currencyLabel}
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
                        {item.price} {currencyLabel}
                      </td>
                      <td className="py-3 px-3 text-end font-black tabular-nums text-slate-900 dark:text-white">
                        {item.total || ((item.price || 0) * (item.quantity || 1))} {currencyLabel}
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
                      {order.total} {currencyLabel}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary — only real fields from order */}
          {hasPaymentSummary && (
            <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/50 space-y-2">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                <span>{commerceTerm('paymentSummary', isAr)}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                {order.subtotal != null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">{commerceTerm('subtotal', isAr)}</span>
                    <span className="font-bold tabular-nums">{order.subtotal} {currencyLabel}</span>
                  </div>
                )}
                {order.discountAmount != null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">{commerceTerm('discount', isAr)}</span>
                    <span className="font-bold tabular-nums">{order.discountAmount} {currencyLabel}</span>
                  </div>
                )}
                {order.shippingFee != null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">{commerceTerm('shipping', isAr)}</span>
                    <span className="font-bold tabular-nums">{order.shippingFee} {currencyLabel}</span>
                  </div>
                )}
                {order.tax != null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">{commerceTerm('taxVat', isAr)}</span>
                    <span className="font-bold tabular-nums">{order.tax} {currencyLabel}</span>
                  </div>
                )}
                {order.total != null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">{commerceTerm('total', isAr)}</span>
                    <span className="font-black tabular-nums text-teal-700 dark:text-teal-300">
                      {order.total} {currencyLabel}
                    </span>
                  </div>
                )}
                {order.amountPaid != null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">{commerceTerm('amountPaid', isAr)}</span>
                    <span className="font-bold tabular-nums">{order.amountPaid} {currencyLabel}</span>
                  </div>
                )}
                {order.remainingBalance != null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">{commerceTerm('remainingBalance', isAr)}</span>
                    <span className="font-bold tabular-nums text-amber-700 dark:text-amber-300">
                      {order.remainingBalance} {currencyLabel}
                    </span>
                  </div>
                )}
                {(order.bankAccountId || bankAccount) && (
                  <div className="sm:col-span-2 rounded-xl border border-teal-200/70 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20 p-3 space-y-1.5">
                    <p className="text-[11px] font-black text-teal-800 dark:text-teal-200">
                      {isAr ? 'تفاصيل التحويل البنكي' : 'Bank transfer details'}
                    </p>
                    {bankAccount ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{isAr ? 'البنك' : 'Bank'}</span>
                        <span className="font-bold sm:text-end break-words">
                          {(isAr && bankAccount.bank_name_ar) || bankAccount.bank_name}
                        </span>
                        <span className="font-semibold">{isAr ? 'اسم الحساب' : 'Account title'}</span>
                        <span className="font-bold sm:text-end break-words">
                          {(isAr && bankAccount.account_title_ar) || bankAccount.account_title}
                        </span>
                        <span className="font-semibold">IBAN</span>
                        <span className="font-mono font-bold sm:text-end break-all" dir="ltr">
                          {bankAccount.iban}
                        </span>
                        {bankAccount.account_number ? (
                          <>
                            <span className="font-semibold">
                              {isAr ? 'رقم الحساب' : 'Account number'}
                            </span>
                            <span className="font-mono font-bold sm:text-end" dir="ltr">
                              {bankAccount.account_number}
                            </span>
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <p className="font-mono text-[11px] font-bold break-all">{order.bankAccountId}</p>
                    )}
                  </div>
                )}
                {order.paymentPlan && (
                  <div className="flex justify-between gap-3 sm:col-span-2">
                    <span className="text-slate-500">{isAr ? 'خطة الدفع' : 'Payment Plan'}</span>
                    <span className="font-bold">
                      {order.paymentPlan === 'full'
                        ? commerceTerm('fullPayment', isAr)
                        : order.paymentPlan === 'partial'
                          ? commerceTerm('partialPayment', isAr)
                          : order.paymentPlan === 'installment'
                            ? commerceTerm('installmentPayment', isAr)
                            : order.paymentPlan}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Installment Schedule — real API only */}
          {(isInstallmentPlan || installments.length > 0 || installmentsLoading || installmentsError) && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                  <span>{commerceTerm('installmentSchedule', isAr)}</span>
                </h4>
                {canGenerateInstallments && (
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-500">
                      {isAr ? 'عدد الأقساط' : 'Installments'}
                    </label>
                    <select
                      value={installmentCount}
                      onChange={(e) => setInstallmentCount(Number(e.target.value) === 4 ? 4 : 3)}
                      className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold"
                    >
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </select>
                    <button
                      type="button"
                      disabled={generatingInstallments}
                      onClick={() => void handleGenerateInstallments()}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-[11px] font-bold transition-all"
                    >
                      {generatingInstallments
                        ? isAr
                          ? 'جاري الإنشاء...'
                          : 'Generating...'
                        : isAr
                          ? 'إنشاء الأقساط'
                          : 'Generate installments'}
                    </button>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                <span>{commerceTerm('dueDates', isAr)}</span>
                <span>·</span>
                <span>{commerceTerm('paymentHistory', isAr)}</span>
              </div>

              {installmentsLoading ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  {isAr ? 'جاري التحميل...' : 'Loading...'}
                </p>
              ) : installmentsError ? (
                <p className="text-xs text-rose-600 dark:text-rose-400 py-2">{installmentsError}</p>
              ) : installments.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  {isAr ? 'لا توجد سجلات' : 'No records found'}
                </p>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <tr>
                        <th className="py-2 px-3 font-bold text-start">#</th>
                        <th className="py-2 px-3 font-bold text-end">{commerceTerm('total', isAr)}</th>
                        <th className="py-2 px-3 font-bold text-start">{commerceTerm('dueDates', isAr)}</th>
                        <th className="py-2 px-3 font-bold text-start">
                          {isAr ? 'الحالة' : 'Status'}
                        </th>
                        <th className="py-2 px-3 font-bold text-end">
                          {isAr ? 'إجراء' : 'Action'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {installments.map((row) => {
                        const statusKey = String(row.status || '').toLowerCase();
                        const isPaid = statusKey === 'paid' || statusKey === 'completed' || Boolean(row.paid_at);
                        return (
                          <tr key={row.id}>
                            <td className="py-2.5 px-3 font-bold tabular-nums">
                              {row.installment_number}
                            </td>
                            <td className="py-2.5 px-3 text-end font-bold tabular-nums">
                              {row.amount} {currencyLabel}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {row.due_date || '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                                }`}
                              >
                                {localizeInstallmentStatus(row.status, isAr)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-end">
                              {!isPaid ? (
                                <button
                                  type="button"
                                  disabled={recordingInstallmentId === row.id}
                                  onClick={() => void handleRecordInstallmentPayment(row)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[10px] font-bold"
                                >
                                  {recordingInstallmentId === row.id
                                    ? isAr
                                      ? 'جاري التسجيل...'
                                      : 'Recording...'
                                    : isAr
                                      ? 'تسجيل دفعة'
                                      : 'Record payment'}
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* WhatsApp actions — Cloud send with honest status (never fake "sent") */}
          {customerPhoneDigits ? (
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'إجراءات واتساب' : 'WhatsApp Actions'}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={waSending}
                  onClick={() => void openWaAction('order')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-bold transition-all"
                >
                  {isAr ? 'إرسال الطلب' : 'Send Order'}
                </button>
                <button
                  type="button"
                  disabled={waSending}
                  onClick={() => void openWaAction('invoice')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-bold transition-all"
                >
                  {commerceTerm('sendInvoice', isAr)}
                </button>
                <button
                  type="button"
                  disabled={waSending}
                  onClick={() => void openWaAction('payment')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-bold transition-all"
                >
                  {isAr ? 'إرسال تفاصيل الدفع' : 'Send Payment Details'}
                </button>
                <button
                  type="button"
                  disabled={waSending}
                  onClick={() => void openWaAction('status')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-bold transition-all"
                >
                  {isAr ? 'إرسال الحالة' : 'Send Status'}
                </button>
              </div>
            </div>
          ) : null}

          {/* 6. Customer & Delivery Address Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'بيانات العميل' : 'Customer Info'}</span>
              </h5>
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{getCustomerDisplayName(order.customerName, locale)}</div>
                <div className="text-slate-500 font-mono">{order.customerPhone}</div>
                {order.customerEmail && <div className="text-slate-400">{order.customerEmail}</div>}
                {customerPhoneDigits ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={waSending}
                      onClick={() => void openWaAction('order')}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer disabled:opacity-60"
                    >
                      <span>{isAr ? 'مراسلة عبر واتساب' : 'Chat via WhatsApp'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'عنوان التوصيل' : 'Delivery Address'}</span>
              </h5>
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {getLocalizedAddress(order.deliveryLocation || order.shippingAddress, locale) ||
                  (isAr ? 'العنوان غير محفوظ' : 'Address not saved')}
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                {order.deliveryMode === 'own_delivery'
                  ? commerceTerm('ownDelivery', isAr)
                  : order.deliveryMode === 'shipping_company'
                    ? commerceTerm('shippingCompany', isAr)
                    : isAr
                      ? 'شركة الشحن:'
                      : 'Carrier:'}{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {order.shippingCompany || (order.driverId ? order.driverId : '—')}
                </strong>
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
              : courierName.toLowerCase().includes('smsa')
              ? 'smsa'
              : 'generic') as CourierCarrierCode,
            carrierName: courierName || (isAr ? 'غير محدد' : 'Not set'),
            carrierNameAr: courierName.toLowerCase().includes('spl')
              ? 'البريد السعودي'
              : courierName.toLowerCase().includes('aramex')
              ? 'أرامكس'
              : courierName.toLowerCase().includes('dhl')
              ? 'دي إتش إل'
              : courierName.toLowerCase().includes('smsa')
              ? 'سمسا'
              : (courierName || 'غير محدد'),
            trackingNumber: trackingNumber || order.trackingNumber || '',
            awbNumber: trackingNumber || order.trackingNumber || '',
            orderNumber: order.orderNumber,
            orderDate: order.date || '',
            sender: {
              name: activeStore.name || '',
              nameAr: activeStore.nameAr || activeStore.name || '',
              phone: activeStore.contactPhone || activeStore.phone || '',
              address: '',
              city: '',
              country: isAr ? 'السعودية' : 'Saudi Arabia',
            },
            recipient: {
              name: order.customerName,
              phone: order.customerPhone,
              address: order.shippingAddress || order.deliveryLocation || '',
              city: '',
              country: isAr ? 'السعودية' : 'Saudi Arabia',
            },
            packageDetails: {
              weightKg: 0,
              pieces: order.items?.length || 1,
              contentDescription: isAr ? 'منتجات الطلب' : 'Order items',
              contentDescriptionAr: 'منتجات الطلب',
              declaredValueSar: Number(order.total) || 0,
            },
            payment: {
              method: isCod ? 'cod' : 'prepaid',
              codAmountSar: isCod ? Number(order.total) || 0 : undefined,
              currency: 'SAR',
            },
            routing: {
              hubCode: '',
              serviceType: '',
              serviceTypeAr: '',
              routeCode: '',
            },
          }}
        />
      )}
    </GlobalModal>
  );
};
