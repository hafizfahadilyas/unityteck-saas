import React, { useMemo } from 'react';
import type { Order, Store } from '../../../types';
import { generateCode128Svg } from '../../../utils/courierBarcode';
import { generateQrSvgDataUri } from '../../../utils/zatca';
import {
  getCustomerDisplayName,
  getLocalizedAddress,
  getLocalizedItemName,
} from '../../../utils/storeLocalization';
import { resolveStoreContact } from '../../../themes/settings/storeContact';

export interface ShippingOrderDetailsSheetProps {
  order: Order;
  store?: Partial<Store> | null;
  locale: 'en' | 'ar';
  labelUrl?: string | null;
  className?: string;
}

function moneySar(n: number, isAr: boolean): string {
  const v = Number.isFinite(n) ? n : 0;
  return `${v.toFixed(2)} ${isAr ? 'ر.س' : 'SAR'}`;
}

export const ShippingOrderDetailsSheet: React.FC<ShippingOrderDetailsSheetProps> = ({
  order,
  store,
  locale,
  labelUrl,
  className = '',
}) => {
  const isAr = locale === 'ar';
  const dash = '—';
  const orderNumber = String(order.orderNumber || order.id || '').trim() || dash;
  const orderDateRaw = order.date || order.createdAt || '';
  let orderDate = dash;
  if (orderDateRaw) {
    try {
      const d = new Date(orderDateRaw);
      if (!Number.isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        orderDate = dd + '/' + mm + '/' + d.getFullYear();
      } else {
        orderDate = orderDateRaw.slice(0, 10);
      }
    } catch {
      orderDate = orderDateRaw.slice(0, 10);
    }
  }

  const paymentStatus = (() => {
    const ps = String(order.paymentStatus || '').toLowerCase();
    const pm = String(order.paymentMethod || '').toLowerCase();
    if (ps === 'paid' || order.status === 'completed' || order.status === 'delivered') {
      return isAr ? 'مدفوع' : 'Paid';
    }
    if (pm.includes('cod') || pm.includes('cash') || order.codStatus === 'pending') {
      return isAr ? 'عند الاستلام' : 'COD';
    }
    if (ps === 'failed') return isAr ? 'فشل' : 'Failed';
    if (ps === 'refunded') return isAr ? 'مسترد' : 'Refunded';
    return isAr ? 'قيد الانتظار' : 'Pending';
  })();

  const vatNumber = String(store?.taxNumber || '').trim();
  const storeName = isAr
    ? store?.nameAr || store?.name || ''
    : store?.nameEn || store?.name || '';
  const storeLogo = store?.logo || '';
  const storeInitials = (storeName || 'UT').slice(0, 2).toUpperCase();

  const contact = store?.id ? resolveStoreContact(store.id, store) : null;
  const senderPhone =
    contact?.phone || contact?.whatsapp || store?.phone || store?.contactPhone || '';
  const senderName = storeName || (isAr ? 'المتجر' : 'Store');

  const customerName = getCustomerDisplayName(order.customerName, locale) || dash;
  const customerPhone = String(order.customerPhone || '').trim() || dash;
  const addrRaw =
    (typeof order.shippingAddress === 'string'
      ? order.shippingAddress
      : (order as { shippingAddress?: { address?: string } }).shippingAddress?.address) ||
    order.deliveryLocation ||
    '';
  const customerAddress = getLocalizedAddress(addrRaw, locale) || dash;

  const items = order.items || [];
  const currency = 'SAR';

  const lineRows = useMemo(() => {
    return items.map((it, idx) => {
      const qty = Number(it.quantity) || 1;
      const unit = Number(it.price) || 0;
      const lineGross = Number(it.total) || unit * qty;
      const lineDiscount = Number((it as { discount?: number }).discount) || 0;
      const taxable = Math.max(0, lineGross - lineDiscount);
      const tax = Math.round(taxable * (0.15 / 1.15) * 100) / 100;
      const priceExVat = Math.round((unit / 1.15) * 100) / 100;
      return {
        id: it.id || 'line-' + idx,
        sku: String(it.sku || dash).trim() || dash,
        name: getLocalizedItemName(it, locale) || it.name || dash,
        quantity: qty,
        price: priceExVat,
        tax,
        total: lineGross,
        discount: lineDiscount,
        subtotal: Math.max(0, lineGross - lineDiscount),
        currency,
      };
    });
  }, [items, locale]);

  const totals = useMemo(() => {
    const totalQty = lineRows.reduce((s, r) => s + r.quantity, 0);
    const subtotal = Number(order.subtotal);
    const discount = Number(order.discountAmount) || 0;
    const shipping =
      typeof order.shippingFee === 'number' && Number.isFinite(order.shippingFee)
        ? order.shippingFee
        : null;
    const tax = Number(order.tax) || lineRows.reduce((s, r) => s + r.tax, 0);
    const grand =
      Number(order.total) ||
      (Number.isFinite(subtotal)
        ? subtotal - discount + (shipping ?? 0) + (Number(order.tax) || 0)
        : 0);
    const resolvedSubtotal =
      Number.isFinite(subtotal) && subtotal > 0
        ? subtotal
        : lineRows.reduce((s, r) => s + r.subtotal, 0);
    const isCod =
      String(order.paymentMethod || '').toLowerCase().includes('cod') ||
      String(order.paymentMethod || '').toLowerCase().includes('cash') ||
      Boolean(order.codStatus && order.codStatus !== 'not_cod');
    const cashCollect =
      isCod && String(order.paymentStatus || '').toLowerCase() !== 'paid' ? grand : 0;
    return {
      totalQty: totalQty || items.length || 0,
      subtotal: resolvedSubtotal,
      discount,
      shipping,
      tax,
      paymentMethod: paymentStatus,
      cashCollect,
      grand,
    };
  }, [lineRows, order, paymentStatus, items.length]);

  const trackingOrOrder = String(
    (order as { awbNumber?: string }).awbNumber ||
      order.trackingNumber ||
      order.shippingLabelNumber ||
      orderNumber,
  ).trim();

  const barcodeSvg = useMemo(
    () =>
      generateCode128Svg(trackingOrOrder.replace(/[^0-9A-Za-z\-]/g, '') || orderNumber, {
        height: 42,
        barWidth: 1.6,
        showText: false,
      }),
    [trackingOrOrder, orderNumber],
  );

  const qrUri = useMemo(() => {
    const payload =
      (labelUrl && String(labelUrl).trim()) ||
      'ORDER:' + orderNumber + '|STORE:' + (store?.id || '') + '|TRACK:' + trackingOrOrder;
    return generateQrSvgDataUri(payload, 96);
  }, [labelUrl, orderNumber, store?.id, trackingOrOrder]);

  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <div
      id="shipping-order-details-sheet"
      className={
        'bg-white text-slate-900 w-full max-w-[820px] mx-auto border border-slate-300 shadow-sm select-text ' +
        className
      }
      style={{
        fontFamily: isAr
          ? '"Segoe UI", Tahoma, "Noto Sans Arabic", Arial, sans-serif'
          : 'Arial, Helvetica, sans-serif',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
      data-shipping-sheet="order-details"
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
        <div className="shrink-0 w-16 h-16 rounded-md bg-slate-900 text-white flex items-center justify-center overflow-hidden">
          {storeLogo ? (
            <img
              src={storeLogo}
              alt={storeName || (isAr ? 'المتجر' : 'Store')}
              className="w-full h-full object-contain bg-white"
            />
          ) : (
            <span className="text-lg font-black tracking-tight">{storeInitials}</span>
          )}
        </div>

        <div className="flex-1 text-center pt-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t('Order Details', 'تفاصيل الطلب')}
          </h1>
          {storeName ? (
            <p className="text-xs text-slate-500 mt-1 font-medium truncate">{storeName}</p>
          ) : null}
        </div>

        <div className="shrink-0 w-16 h-16 border border-slate-200 rounded-md p-0.5 bg-white">
          <img src={qrUri} alt={isAr ? 'رمز الاستجابة السريعة' : 'QR'} className="w-full h-full object-contain" />
        </div>
      </div>

      <div className="px-5 pb-3 flex flex-col items-center gap-1">
        <p className="text-sm font-semibold text-slate-800">
          {t('Order Number', 'رقم الطلب')}{' '}
          <span className="font-mono font-bold tracking-wide">{orderNumber}</span>
        </p>
        <div
          className="w-full max-w-md flex justify-center overflow-hidden"
          dangerouslySetInnerHTML={{ __html: barcodeSvg }}
        />
      </div>

      <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1.5">
          <p>
            <span className="font-semibold text-slate-800">{t('Order Date', 'تاريخ الطلب')}</span>
            {' : '}
            <span className="font-mono">{orderDate}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-800">{t('Payment Status', 'حالة الدفع')}</span>
            {' : '}
            <span>{paymentStatus}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-800">{t('VAT Number', 'الرقم الضريبي')}</span>
            {' : '}
            <span className="font-mono">{vatNumber || t('Not set', 'غير مسجل')}</span>
          </p>
        </div>

        <div className="space-y-1.5 sm:border-s sm:border-slate-200 sm:ps-4">
          <p className="font-bold text-slate-900 mb-1">{t('Customer Details', 'بيانات العميل')}</p>
          <p>
            <span className="font-semibold">{t('Full Name', 'الاسم الكامل')}</span>
            {' : '}
            {customerName}
          </p>
          <p>
            <span className="font-semibold">{t('Address', 'العنوان')}</span>
            {' : '}
            {customerAddress}
          </p>
          <p>
            <span className="font-semibold">{t('Telephone', 'الهاتف')}</span>
            {' : '}
            <span dir="ltr">{customerPhone}</span>
          </p>
          <p>
            <span className="font-semibold">{t('Sender Name', 'اسم المرسل')}</span>
            {' : '}
            {senderName}
            {senderPhone ? (
              <span className="text-slate-500 text-xs ms-1" dir="ltr">
                ({senderPhone})
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <hr className="border-slate-300 mx-5" />

      <div className="px-5 py-3">
        <h2 className="text-base font-bold text-slate-900 mb-2">{t('Order Items', 'أصناف الطلب')}</h2>
        {lineRows.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-lg">
            {t('No records found', 'لا توجد سجلات')}
          </p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-[11px] sm:text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="border border-slate-200 px-2 py-1.5 text-start font-bold">
                    {t('SKU', 'رمز المنتج')}
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5 text-start font-bold">
                    {t('Name', 'الاسم')}
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5 text-center font-bold">
                    {t('Qty', 'الكمية')}
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5 text-end font-bold">
                    {t('Price', 'السعر')}
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5 text-end font-bold">
                    {t('Tax', 'الضريبة')}
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5 text-end font-bold">
                    {t('Total', 'الإجمالي')}
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5 text-end font-bold">
                    {t('Discount', 'الخصم')}
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5 text-end font-bold">
                    {t('Subtotal', 'الصافي')}
                  </th>
                  <th className="border border-slate-200 px-2 py-1.5 text-center font-bold">
                    {t('Currency', 'العملة')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineRows.map((row) => (
                  <tr key={row.id} className="text-slate-800">
                    <td className="border border-slate-200 px-2 py-1.5 font-mono">{row.sku}</td>
                    <td className="border border-slate-200 px-2 py-1.5">{row.name}</td>
                    <td className="border border-slate-200 px-2 py-1.5 text-center font-mono">
                      {row.quantity}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-end font-mono">
                      {row.price.toFixed(2)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-end font-mono">
                      {row.tax.toFixed(2)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-end font-mono">
                      {row.total.toFixed(2)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-end font-mono">
                      {row.discount.toFixed(2)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-end font-mono">
                      {row.subtotal.toFixed(2)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-center">{row.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="px-5 pb-6 flex justify-end">
        <div className="w-full max-w-xs text-sm space-y-1.5">
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-800">{t('Total Quantity', 'إجمالي الكمية')}</span>
            <span className="font-mono">{totals.totalQty}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-800">{t('Subtotal', 'المجموع الفرعي')}</span>
            <span className="font-mono">{moneySar(totals.subtotal, isAr)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-800">{t('Discount Amount', 'مبلغ الخصم')}</span>
            <span className="font-mono">{moneySar(totals.discount, isAr)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-800">{t('Shipping', 'الشحن')}</span>
            <span className="font-mono">
              {totals.shipping == null
                ? '—'
                : totals.shipping === 0
                  ? t('Free', 'مجاني')
                  : moneySar(totals.shipping, isAr)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-800">{t('VAT Amount', 'مبلغ ضريبة القيمة المضافة')}</span>
            <span className="font-mono">{moneySar(totals.tax, isAr)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-800">{t('Payment Method', 'طريقة الدفع')}</span>
            <span>{totals.paymentMethod}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-800">
              {t('Cash to be Collected', 'المبلغ المطلوب تحصيله')}
            </span>
            <span className="font-mono">{moneySar(totals.cashCollect, isAr)}</span>
          </div>
          <div className="flex justify-between gap-4 pt-2 border-t-2 border-slate-900 mt-1">
            <span className="font-black text-slate-900">{t('Grand Total', 'الإجمالي النهائي')}</span>
            <span className="font-black font-mono text-base">{moneySar(totals.grand, isAr)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
