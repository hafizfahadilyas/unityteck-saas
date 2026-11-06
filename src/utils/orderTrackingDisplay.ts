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
    courier: data.courier_code || (isAr ? 'SMSA Express / SPL' : 'SMSA Express / SPL'),
    trackingNumber: data.tracking_number || undefined,
    estimatedDelivery:
      data.estimated_delivery || (isAr ? 'خلال 24-48 ساعة' : 'Within 24-48 hours'),
    destination: data.delivery_location || (isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'),
    steps: trackingStepsFromApi(data, isAr),
  };
}

export function mapTrackApiToMeccaResult(data: StorefrontTrackOrderResult, isAr: boolean) {
  return {
    orderNumber: data.order_number,
    status: trackingStatusLabel(data.status, isAr),
    courier: data.courier_code || (isAr ? 'مندوب التوصيل المبرد' : 'Refrigerated Express Courier'),
    estimatedDelivery:
      data.estimated_delivery || (isAr ? 'اليوم خلال موعدك المفضل' : 'Today within selected slot'),
    destination: data.delivery_location || (isAr ? 'مكة المكرمة' : 'Makkah'),
    itemsCount: data.items_count || 1,
    steps: meccaTrackingStepsFromApi(data, isAr),
  };
}
