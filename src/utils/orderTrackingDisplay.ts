import type { StorefrontTrackOrderResult } from '../api/tenantApi';

export function trackingStatusLabel(status: string, isAr: boolean): string {
  const s = status.toLowerCase();
  const delivered = s === 'delivered' || s === 'completed';
  const shipped = delivered || s === 'shipped' || s === 'out_for_delivery';
  if (isAr) {
    if (delivered) return 'تم تسليم الشحنة بنجاح';
    if (shipped) return 'الشحنة في طريقها للتوصيل';
    return 'جاري تجهيز وتغليف الطلب';
  }
  if (delivered) return 'Package Delivered Successfully';
  if (shipped) return 'Package in Transit';
  return 'Order Being Prepared & Packed';
}

export function trackingStepsFromApi(data: StorefrontTrackOrderResult, isAr: boolean) {
  const s = data.status.toLowerCase();
  const isDelivered = s === 'delivered' || s === 'completed';
  const isShipped = isDelivered || s === 'shipped' || s === 'out_for_delivery';
  const isProcessing = isShipped || s === 'processing' || s === 'preparing' || s === 'pending';
  const dateLabel = data.order_date || (isAr ? 'اليوم' : 'Today');

  return [
    {
      titleAr: 'تم تأكيد الطلب وسداد القيمة',
      titleEn: 'Order Confirmed & Paid',
      date: dateLabel,
      done: true,
    },
    {
      titleAr: 'تجهيز الطلب',
      titleEn: 'Order Preparation',
      date: isAr ? 'المستودع' : 'Warehouse',
      done: isProcessing,
    },
    {
      titleAr: 'انطلاق الشحنة',
      titleEn: 'Dispatched for Delivery',
      date: isAr ? 'في الطريق' : 'In Transit',
      done: isShipped,
    },
    {
      titleAr: 'اكتمال التسليم',
      titleEn: 'Delivered',
      date: isDelivered ? (isAr ? 'تم' : 'Done') : isAr ? 'متوقع قريباً' : 'Expected soon',
      done: isDelivered,
    },
  ];
}

export function meccaTrackingStepsFromApi(data: StorefrontTrackOrderResult, isAr: boolean) {
  const s = data.status.toLowerCase();
  const isDelivered = s === 'delivered' || s === 'completed';
  const isShipped = isDelivered || s === 'shipped' || s === 'out_for_delivery';

  return [
    { titleAr: 'تم استلام وتأكيد الطلب', titleEn: 'Order Received & Confirmed', done: true },
    { titleAr: 'تنسيق وتجهيز الطلب', titleEn: 'Preparation & Arrangement', done: true },
    {
      titleAr: 'فحص الجودة والتغليف',
      titleEn: 'Quality Inspection & Packing',
      done: isShipped,
    },
    { titleAr: 'انطلاق مندوب التوصيل', titleEn: 'Dispatched with Courier', done: isShipped },
    { titleAr: 'اكتمال التسليم', titleEn: 'Delivered', done: isDelivered },
  ];
}

export function mapTrackApiToCoffeeResult(data: StorefrontTrackOrderResult, isAr: boolean) {
  return {
    orderNumber: data.order_number,
    status: trackingStatusLabel(data.status, isAr),
    paymentStatus: data.payment_status || undefined,
    courier: data.courier_code || undefined,
    trackingNumber: data.tracking_number || undefined,
    estimatedDelivery: data.estimated_delivery || undefined,
    destination: data.delivery_location || undefined,
    steps: trackingStepsFromApi(data, isAr),
  };
}

export function mapTrackApiToMeccaResult(data: StorefrontTrackOrderResult, isAr: boolean) {
  return {
    orderNumber: data.order_number,
    status: trackingStatusLabel(data.status, isAr),
    paymentStatus: data.payment_status || undefined,
    courier: data.courier_code || undefined,
    estimatedDelivery: data.estimated_delivery || undefined,
    destination: data.delivery_location || undefined,
    itemsCount: data.items_count || 0,
    steps: meccaTrackingStepsFromApi(data, isAr),
  };
}

/** Customer-facing order / payment / shipping labels — real status only. */
export function customerOrderStatusLabel(status: string, isAr: boolean): string {
  const s = String(status || '').toLowerCase();
  if (isAr) {
    if (s === 'delivered' || s === 'completed') return 'تم التسليم';
    if (s === 'shipped' || s === 'out_for_delivery') return 'في الطريق';
    if (s === 'processing' || s === 'preparing') return 'قيد التجهيز';
    if (s === 'cancelled') return 'ملغى';
    if (s === 'returned' || s === 'refunded') return 'مرتجع';
    if (s === 'pending') return 'قيد الانتظار';
    return status || '—';
  }
  if (s === 'delivered' || s === 'completed') return 'Delivered';
  if (s === 'shipped' || s === 'out_for_delivery') return 'In transit';
  if (s === 'processing' || s === 'preparing') return 'Processing';
  if (s === 'cancelled') return 'Cancelled';
  if (s === 'returned' || s === 'refunded') return 'Returned';
  if (s === 'pending') return 'Pending';
  return status || '—';
}

export function customerPaymentStatusLabel(status: string, isAr: boolean): string {
  const s = String(status || '').toLowerCase();
  if (isAr) {
    if (s === 'paid' || s === 'completed' || s === 'captured') return 'مدفوع';
    if (s === 'pending' || s === 'unpaid' || s === 'awaiting_payment') return 'بانتظار الدفع';
    if (s === 'failed') return 'فشل الدفع';
    if (s === 'refunded') return 'مسترد';
    return status || '—';
  }
  if (s === 'paid' || s === 'completed' || s === 'captured') return 'Paid';
  if (s === 'pending' || s === 'unpaid' || s === 'awaiting_payment') return 'Awaiting payment';
  if (s === 'failed') return 'Failed';
  if (s === 'refunded') return 'Refunded';
  return status || '—';
}

export function customerShippingStatusLabel(status: string, isAr: boolean): string {
  const s = String(status || '').toLowerCase();
  if (!s) return isAr ? 'لم يُشحن بعد' : 'Not shipped yet';
  if (isAr) {
    if (s === 'delivered') return 'تم التسليم';
    if (s === 'shipped' || s === 'in_transit' || s === 'out_for_delivery') return 'الشحنة في الطريق';
    if (s === 'label_created' || s === 'ready') return 'تم إنشاء بوليصة الشحن';
    return status;
  }
  if (s === 'delivered') return 'Delivered';
  if (s === 'shipped' || s === 'in_transit' || s === 'out_for_delivery') return 'In transit';
  if (s === 'label_created' || s === 'ready') return 'Label created';
  return status;
}

export function customerNotificationEventLabel(event: string, isAr: boolean): string {
  const e = String(event || '').toLowerCase();
  const mapAr: Record<string, string> = {
    order_placed: 'تم استلام الطلب',
    order_processing: 'جاري تجهيز الطلب',
    order_preparing: 'جاري تجهيز الطلب',
    order_shipped: 'تم شحن الطلب',
    order_delivered: 'تم تسليم الطلب',
    order_cancelled: 'تم إلغاء الطلب',
    order_refunded: 'تم استرداد المبلغ',
    payment_received: 'تم تأكيد الدفع',
    payment_pending: 'بانتظار الدفع',
    payment_confirmed: 'تم تأكيد الدفع',
    invoice_ready: 'الفاتورة جاهزة',
  };
  const mapEn: Record<string, string> = {
    order_placed: 'Order received',
    order_processing: 'Order processing',
    order_preparing: 'Order preparing',
    order_shipped: 'Order shipped',
    order_delivered: 'Order delivered',
    order_cancelled: 'Order cancelled',
    order_refunded: 'Order refunded',
    payment_received: 'Payment confirmed',
    payment_pending: 'Payment pending',
    payment_confirmed: 'Payment confirmed',
    invoice_ready: 'Invoice ready',
  };
  return (isAr ? mapAr[e] : mapEn[e]) || event || (isAr ? 'تحديث' : 'Update');
}
