import React, { forwardRef } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { generateZatcaTlvBase64, generateQrSvgDataUri } from '../../../utils/zatca';

export type StorefrontInvoiceLine = {
  id?: string;
  name: string;
  sku?: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  note?: string;
};

export type StorefrontInvoiceData = {
  storeName: string;
  storeNameAr?: string;
  storeSubtitleEn?: string;
  storeSubtitleAr?: string;
  storeAddressEn?: string;
  storeAddressAr?: string;
  storePhone?: string;
  storeEmail?: string;
  vatNumber?: string;
  crNumber?: string;
  logoUrl?: string;
  invoiceNumber: string;
  orderNumber?: string;
  invoiceDate: string;
  orderDate?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  city?: string;
  district?: string;
  street?: string;
  paymentMethodLabel: string;
  shippingLabel: string;
  warrantyLabel?: string;
  items: StorefrontInvoiceLine[];
  subtotal: number;
  shippingFee: number | null;
  vatAmount: number;
  grandTotal: number;
  currencyLabel?: string;
  notesEn?: string;
  notesAr?: string;
  /** Real checkout answers / merchant notes (city, shipping method, coupon, …) */
  checkoutNotes?: string;
};

type Props = {
  data: StorefrontInvoiceData;
  isAr: boolean;
  /** Compact screen preview vs print/PDF capture */
  mode?: 'screen' | 'capture';
};

function money(n: number, isAr: boolean, currency = '⃁'): string {
  const v = Number(n) || 0;
  const formatted = v.toLocaleString(isAr ? 'ar-SA' : 'en-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isAr ? `${formatted} ${currency}` : `${currency} ${formatted}`;
}

/**
 * Professional storefront tax invoice (A4 / PDF / WhatsApp).
 * Layout inspired by Saudi e-commerce tax invoices — not emoji WhatsApp text.
 */
export const StorefrontTaxInvoice = forwardRef<HTMLDivElement, Props>(
  function StorefrontTaxInvoice({ data, isAr, mode = 'screen' }, ref) {
    const currency = data.currencyLabel || '⃁';
    const sellerName = isAr
      ? data.storeNameAr || data.storeName
      : data.storeName;
    const sellerAddress = isAr
      ? data.storeAddressAr || data.storeAddressEn || 'المملكة العربية السعودية'
      : data.storeAddressEn || data.storeAddressAr || 'Kingdom of Saudi Arabia';
    const subtitle = isAr
      ? data.storeSubtitleAr || 'فاتورة ضريبية مبسطة معتمدة'
      : data.storeSubtitleEn || 'Official Simplified Tax Invoice';

    const vatNo = (data.vatNumber || '').trim();
    const crNo = (data.crNumber || '').trim();
    const qrUri = generateQrSvgDataUri(
      generateZatcaTlvBase64({
        sellerName,
        vatNumber: vatNo || '000000000000000',
        timestamp: new Date().toISOString(),
        invoiceTotal: data.grandTotal,
        vatTotal: data.vatAmount,
      }),
      140,
    );

    const destination = [data.city, data.district, data.street]
      .map((x) => (x || '').trim())
      .filter(Boolean)
      .join(isAr ? ' · ' : ' · ');

    const pad = mode === 'capture' ? 'p-6' : 'p-4 sm:p-6 md:p-8';

    return (
      <div
        ref={ref}
        dir={isAr ? 'rtl' : 'ltr'}
        className={`bg-white text-slate-900 w-full max-w-[800px] mx-auto rounded-2xl border border-slate-200 shadow-sm ${pad} select-text invoice-a4-sheet`}
        style={{
          fontFamily: isAr
            ? '"Segoe UI", Tahoma, "Noto Sans Arabic", Arial, sans-serif'
            : 'Inter, system-ui, sans-serif',
        }}
        data-invoice-sheet="tax"
      >
        {/* Accent */}
        <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-slate-800 mb-5" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-start border-b border-slate-200 pb-4">
          <div className="flex items-start gap-3 min-w-0">
            {data.logoUrl ? (
              <img
                src={data.logoUrl}
                alt=""
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-900 text-emerald-400 font-black text-lg flex items-center justify-center shrink-0">
                {sellerName.slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug break-words">
                {sellerName}
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-emerald-700 mt-0.5">
                {subtitle}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed break-words">
                {sellerAddress}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-600">
                {data.storePhone ? (
                  <span dir="ltr">{data.storePhone}</span>
                ) : null}
                {data.storeEmail ? <span>{data.storeEmail}</span> : null}
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-[10px] sm:text-[11px] font-semibold">
                {vatNo ? (
                  <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200">
                    {isAr ? 'الرقم الضريبي:' : 'VAT:'}{' '}
                    <span className="font-mono">{vatNo}</span>
                  </span>
                ) : null}
                {crNo ? (
                  <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200">
                    {isAr ? 'السجل التجاري:' : 'CR:'}{' '}
                    <span className="font-mono">{crNo}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
            <div className="space-y-1.5 text-start sm:text-end">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-black">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {isAr ? 'فاتورة ضريبية' : 'Tax Invoice'}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">
                  {isAr ? 'رقم الفاتورة' : 'Invoice No.'}
                </p>
                <p className="font-mono font-black text-base text-slate-900">
                  {data.invoiceNumber}
                </p>
              </div>
              {data.orderNumber && data.orderNumber !== data.invoiceNumber ? (
                <div>
                  <p className="text-[10px] font-bold text-slate-400">
                    {isAr ? 'رقم الطلب' : 'Order No.'}
                  </p>
                  <p className="font-mono text-xs font-bold text-slate-700">
                    {data.orderNumber}
                  </p>
                </div>
              ) : null}
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <p>
                  <span className="text-slate-400">{isAr ? 'تاريخ الفاتورة:' : 'Invoice date:'}</span>{' '}
                  <span className="font-mono font-semibold">{data.invoiceDate}</span>
                </p>
                {data.orderDate ? (
                  <p>
                    <span className="text-slate-400">{isAr ? 'تاريخ الطلب:' : 'Order date:'}</span>{' '}
                    <span className="font-mono font-semibold">{data.orderDate}</span>
                  </p>
                ) : null}
              </div>
            </div>
            <div className="p-1.5 rounded-xl border border-slate-200 bg-white flex flex-col items-center">
              <img
                src={qrUri}
                alt={isAr ? 'رمز التحقق الضريبي' : 'Tax QR'}
                className="w-[88px] h-[88px] object-contain"
              />
              <span className="text-[9px] font-bold text-emerald-700 mt-0.5 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {isAr ? 'رمز التحقق' : 'Tax QR'}
              </span>
            </div>
          </div>
        </div>

        {/* Parties + payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-1.5 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              {isAr ? 'صادرة من' : 'Issued from'}
            </p>
            <p className="text-sm font-black text-slate-900 break-words">{sellerName}</p>
            <p className="text-[11px] text-slate-600 break-words">{sellerAddress}</p>
            {data.storePhone ? (
              <p className="text-[11px] font-mono text-slate-700" dir="ltr">
                {data.storePhone}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-1.5 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              {isAr ? 'صادرة إلى' : 'Issued to'}
            </p>
            <p className="text-sm font-black text-slate-900 break-words">
              {data.customerName || (isAr ? 'عميل المتجر' : 'Store customer')}
            </p>
            {data.customerPhone ? (
              <p className="text-[11px] font-mono text-slate-700" dir="ltr">
                {data.customerPhone}
              </p>
            ) : null}
            {data.customerEmail ? (
              <p className="text-[11px] text-slate-600 break-all">{data.customerEmail}</p>
            ) : null}
            {destination ? (
              <p className="text-[11px] text-slate-600 break-words">
                <span className="text-slate-400">{isAr ? 'الوجهة:' : 'Destination:'}</span>{' '}
                {destination}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
            {isAr ? 'طريقة الدفع:' : 'Payment:'} {data.paymentMethodLabel}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
            {isAr ? 'التوصيل:' : 'Delivery:'} {data.shippingLabel}
          </span>
          {data.customerPhone ? (
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold" dir="ltr">
              {isAr ? 'الجوال:' : 'Mobile:'} {data.customerPhone}
            </span>
          ) : null}
          {destination ? (
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
              {isAr ? 'الموقع:' : 'Location:'} {destination}
            </span>
          ) : null}
          {data.warrantyLabel ? (
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
              {isAr ? 'الضمان:' : 'Warranty:'} {data.warrantyLabel}
            </span>
          ) : null}
        </div>
        {data.checkoutNotes ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-700 leading-relaxed break-words">
            <span className="font-bold text-slate-800">
              {isAr ? 'بيانات إتمام الشراء:' : 'Checkout details:'}{' '}
            </span>
            {data.checkoutNotes}
          </div>
        ) : null}

        {/* Items — stacked cards on mobile so Product/Qty/Price/Total never scroll off */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div
            className="hidden sm:grid grid-cols-[minmax(0,1.6fr)_0.5fr_0.7fr_0.7fr] gap-2 px-3 py-2.5 text-xs font-bold"
            style={{ backgroundColor: '#0f172a', color: '#fff' }}
          >
            <span className="text-start">{isAr ? 'المنتج' : 'Product'}</span>
            <span className="text-center">{isAr ? 'الكمية' : 'Qty'}</span>
            <span className="text-end">{isAr ? 'السعر' : 'Price'}</span>
            <span className="text-end">{isAr ? 'المجموع' : 'Total'}</span>
          </div>
          <div
            className="sm:hidden px-3 py-2 text-[11px] font-bold"
            style={{ backgroundColor: '#0f172a', color: '#fff' }}
          >
            {isAr ? 'بنود الطلب' : 'Order lines'}
          </div>
          {(!data.items || data.items.length === 0) ? (
            <div className="px-3 py-6 text-center text-xs text-slate-500 bg-slate-50">
              {isAr ? 'لا توجد بنود منتجات في هذه الفاتورة بعد.' : 'No product lines on this invoice yet.'}
            </div>
          ) : (
            data.items.map((it, idx) => {
              const lineTotal = (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0);
              return (
                <div
                  key={it.id || `${idx}-${it.name}`}
                  className={`px-3 py-3 text-xs border-t border-slate-100 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                  }`}
                >
                  <div className="sm:grid sm:grid-cols-[minmax(0,1.6fr)_0.5fr_0.7fr_0.7fr] sm:gap-2 sm:items-start">
                    <div className="flex items-start gap-2 min-w-0">
                      {it.image ? (
                        <img
                          src={it.image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-contain bg-slate-100 border border-slate-200 shrink-0"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 break-words">{it.name}</p>
                        {it.note ? (
                          <p className="text-[10px] text-slate-500 mt-0.5 break-words">{it.note}</p>
                        ) : null}
                        {it.sku ? (
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {isAr ? 'رمز المنتج:' : 'SKU:'} {it.sku}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 flex sm:block justify-between gap-3 text-slate-700">
                      <span className="sm:hidden text-slate-400 font-semibold">
                        {isAr ? 'الكمية' : 'Qty'}
                      </span>
                      <span className="font-mono font-bold text-slate-800 sm:text-center sm:block">
                        {it.quantity}
                      </span>
                    </div>
                    <div className="mt-1 sm:mt-0 flex sm:block justify-between gap-3 text-slate-700">
                      <span className="sm:hidden text-slate-400 font-semibold">
                        {isAr ? 'السعر' : 'Price'}
                      </span>
                      <span className="font-mono sm:text-end sm:block whitespace-nowrap">
                        {money(it.unitPrice, isAr, currency)}
                      </span>
                    </div>
                    <div className="mt-1 sm:mt-0 flex sm:block justify-between gap-3">
                      <span className="sm:hidden text-slate-400 font-semibold">
                        {isAr ? 'المجموع' : 'Total'}
                      </span>
                      <span className="font-mono font-black text-slate-900 sm:text-end sm:block whitespace-nowrap">
                        {money(lineTotal, isAr, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Totals */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 leading-relaxed order-2 sm:order-1">
            <p className="font-bold text-slate-800 mb-1">
              {isAr ? 'ملاحظات' : 'Notes'}
            </p>
            <p>
              {isAr
                ? data.notesAr ||
                  'تم إصدار هذه الفاتورة إلكترونياً وتُعد وثيقة رسمية وفق اشتراطات هيئة الزكاة والضريبة والجمارك. يُرجى الاحتفاظ بها للضمان والاستبدال.'
                : data.notesEn ||
                  'This electronic tax invoice is an official document under ZATCA requirements. Please keep it for warranty and exchange.'}
            </p>
          </div>
          <div className="space-y-1.5 text-xs order-1 sm:order-2">
            <div className="flex justify-between gap-3 text-slate-600">
              <span>{isAr ? 'مجموع السلة' : 'Basket total'}</span>
              <span className="font-mono font-semibold text-slate-900">
                {money(data.subtotal, isAr, currency)}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-slate-600">
              <span>{isAr ? 'الشحن' : 'Shipping'}</span>
              <span className="font-mono font-semibold text-slate-900">
                {data.shippingFee == null
                  ? '—'
                  : data.shippingFee <= 0
                    ? isAr
                      ? 'مجاناً'
                      : 'Free'
                    : money(data.shippingFee, isAr, currency)}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-slate-600">
              <span>{isAr ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}</span>
              <span className="font-mono font-semibold text-emerald-700">
                {money(data.vatAmount, isAr, currency)}
              </span>
            </div>
            <div className="flex justify-between gap-3 items-baseline border-t-2 border-slate-900 pt-2 mt-1">
              <span className="text-sm font-black text-slate-900">
                {isAr ? 'إجمالي الطلب' : 'Order total'}
              </span>
              <span className="text-lg font-black font-mono text-slate-900">
                {money(data.grandTotal, isAr, currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 text-center space-y-1">
          <p className="text-[10px] font-mono text-slate-400">
            * {data.invoiceNumber.replace('#', '')}
            {vatNo ? `-${vatNo.slice(-4)}` : ''} *
          </p>
          <p className="text-[10px] text-slate-500">
            {isAr
              ? 'شكراً لتسوقكم معنا — نتمنى لكم يوماً سعيداً.'
              : 'Thank you for shopping with us — have a wonderful day.'}
          </p>
        </div>
      </div>
    );
  },
);
