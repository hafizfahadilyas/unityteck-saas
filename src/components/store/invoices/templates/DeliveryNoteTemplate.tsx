import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig, InvoiceLineItem } from '../../../../types/invoices';
import { Truck, Package, MapPin, Phone, CheckCircle2, Clock, UserCheck, ShieldCheck, Barcode } from 'lucide-react';
import { generateCode128Svg } from '../../../../utils/courierBarcode';
import {
  getLocalizedItemName,
  getCustomerDisplayName,
  getLocalizedAddress,
} from '../../../../utils/storeLocalization';
import { formatInvoiceDate } from '../../../../utils/zatca';

interface TemplateProps {
  document: InvoiceDocument;
  config: InvoiceTemplateConfig;
  locale: 'en' | 'ar';
}

export const DeliveryNoteTemplate: React.FC<TemplateProps> = ({ document, config, locale }) => {
  const isAr = locale === 'ar';

  return (
    <div
      className="bg-white text-slate-900 w-full min-h-[1050px] p-8 sm:p-12 flex flex-col justify-between select-text"
      style={{
        fontFamily: isAr ? "'Cairo', 'Tajawal', sans-serif" : 'Inter, sans-serif',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div>
        {/* Top Logistics Header */}
        <div className="flex items-start justify-between border-b-2 pb-6" style={{ borderColor: '#0284c7' }}>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  {isAr ? document.seller.nameAr || document.seller.name : document.seller.nameEn || document.seller.name}
                </h1>
                <p className="text-xs font-bold text-sky-700">
                  {isAr ? 'بوليصة وسند تسليم لوجستي (سند شحن)' : 'Logistics Dispatch & Delivery Waybill'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              {isAr
                ? document.seller.addressAr || document.seller.address
                : document.seller.addressEn || getLocalizedAddress(document.seller.address, 'en')}
            </p>
          </div>

          <div className="text-end space-y-1">
            <span className="inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-sky-600 text-white shadow-xs">
              {isAr ? 'سند تسليم' : 'DELIVERY NOTE'}
            </span>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">{isAr ? 'رقم سند التسليم' : 'Delivery Note #'}</p>
              <p className="text-base font-mono font-black text-sky-900">{document.documentNumber}</p>
            </div>
            {document.orderNumber && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'رقم الطلب' : 'Order Ref'}</p>
                <p className="text-xs font-mono font-bold text-slate-900">{document.orderNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Courier & Tracking Details Box with Barcode */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 my-6 rounded-xl bg-sky-50/60 border border-sky-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
              {isAr ? 'شركة الشحن والتوصيل' : 'Carrier & Courier'}
            </span>
            <p className="font-extrabold text-slate-900 mt-0.5">{document.courierCompany || 'SMSA Express'}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
              {isAr ? 'رقم التتبع' : 'Tracking Number (AWB)'}
            </span>
            <p className="font-mono font-bold text-sky-800 mt-0.5">{document.trackingNumber || 'MKH-VIP-TRK-8849'}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
              {isAr ? 'تاريخ التجهيز والشحن' : 'Dispatch Date'}
            </span>
            <p className="font-semibold text-slate-800 mt-0.5 whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
              {formatInvoiceDate(document.dispatchDate || document.issueDate, locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
              {isAr ? 'عدد الطرود والوزن' : 'Parcels & Weight'}
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {document.packageCount || 1} {isAr ? 'طرد' : 'Parcel(s)'} · {document.packageWeightKg || '3.5'} kg
            </p>
          </div>
        </div>

        {/* Printable Barcode Banner for Courier Scanner */}
        <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              {isAr ? 'رمز الباركود اللوجستي (Code 128 Barcode)' : 'Logistics Carrier Barcode (Code 128)'}
            </span>
            <p className="text-xs font-mono font-bold text-slate-800">
              {document.trackingNumber || document.documentNumber}
            </p>
          </div>
          <div
            className="overflow-hidden flex justify-center"
            dangerouslySetInnerHTML={{
              __html: generateCode128Svg(document.trackingNumber || document.documentNumber, {
                height: 40,
                barWidth: 1.6,
                showText: false,
              }),
            }}
          />
        </div>

        {/* Recipient & Destination Details */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs space-y-1.5">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            {isAr ? 'عنوان وبيانات المستلم والتوصيل' : 'Delivery Recipient & Destination'}
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
            <div>
              <p className="text-sm font-extrabold text-slate-900">
                {isAr
                  ? document.buyer.nameAr || document.buyer.name
                  : document.buyer.nameEn || getCustomerDisplayName(document.buyer.name, 'en')}
              </p>
              {document.buyer.phone && (
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5 dir-ltr">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{document.buyer.phone}</span>
                </p>
              )}
            </div>
            <div className="text-start sm:text-end">
              <p className="text-xs font-medium text-slate-800 flex items-center gap-1 sm:justify-end">
                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>
                  {isAr
                    ? document.buyer.addressAr || document.buyer.address || 'مكة المكرمة'
                    : document.buyer.addressEn || getLocalizedAddress(document.buyer.address, 'en')}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {isAr ? document.buyer.cityAr || document.buyer.city : document.buyer.cityEn || document.buyer.city}
              </p>
            </div>
          </div>

          {document.deliveryInstructions && (
            <div className="mt-2 pt-2 border-t border-slate-200 text-slate-700 bg-white p-2.5 rounded-lg border">
              <strong className="text-sky-900">{isAr ? 'تعليمات التوصيل الخاصة:' : 'Special Delivery Instructions:'}</strong>{' '}
              {document.deliveryInstructions}
            </div>
          )}
        </div>

        {/* Dispatched Items Table (NO Financial Totals columns) */}
        <div>
          <h3 className="text-xs font-black uppercase text-slate-600 mb-2">
            {isAr ? 'محتويات الشحنة والطرود' : 'Package Contents & Dispatched Items'}
          </h3>
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b-2 text-[11px] font-black uppercase text-slate-700" style={{ borderColor: '#cbd5e1' }}>
                <th className="py-2.5 px-2 text-start">#</th>
                <th className="py-2.5 px-2 text-start">{isAr ? 'اسم المنتج والوصف اللوجستي' : 'Product Item & Logistics Description'}</th>
                <th className="py-2.5 px-2 text-start">{isAr ? 'رمز الصنف' : 'SKU'}</th>
                <th className="py-2.5 px-2 text-center">{isAr ? 'الكمية المشحونة' : 'Dispatched Qty'}</th>
                <th className="py-2.5 px-2 text-center">{isAr ? 'فحص الاستلام' : 'Check'}</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs text-slate-700">
              {document.items.map((item: InvoiceLineItem, idx: number) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-2 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-2 font-semibold text-slate-900">
                    <div>{isAr ? item.nameAr || item.name : item.nameEn || getLocalizedItemName(item, 'en')}</div>
                  </td>
                  <td className="py-3 px-2 font-mono text-slate-500">{item.sku || '—'}</td>
                  <td className="py-3 px-2 text-center font-black text-sm text-sky-900">{item.quantity}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-block w-4 h-4 border-2 border-slate-300 rounded-xs"></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Handover & Recipient Sign-Off Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-3">
            <span className="text-xs font-black uppercase text-slate-500 block">
              {isAr ? 'إقرار وتوقيع المستلم عند التسليم' : 'Recipient Handover & Signature'}
            </span>
            <p className="text-xs text-slate-600">
              {isAr
                ? 'أقر أنا المستلم أدناه باستلام الطرود المبينة أعلاه بحالة سليمة ومطابقة للمواصفات المطلوبة.'
                : 'I hereby acknowledge receiving the parcels listed above in complete, sealed, and undamaged condition.'}
            </p>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-slate-700 border-t border-slate-200">
              <span>{isAr ? 'اسم المستلم:' : 'Recipient Name:'} {document.recipientSignature || '_______________________'}</span>
              <span>{isAr ? 'التوقيع:' : 'Sign:'} __________________</span>
            </div>
          </div>

          <div className="space-y-3 border-t sm:border-t-0 sm:border-s sm:ps-6 border-slate-200">
            <span className="text-xs font-black uppercase text-slate-500 block">
              {isAr ? 'اعتماد مسؤول التجهيز والشحن' : 'Fulfillment Officer Sign-Off'}
            </span>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isAr ? 'تم الفحص والتغليف ومطابقة الطرد بنجاح' : 'Inspected, packed & verified'}</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-2">
              {isAr ? 'رمز تأكيد التسليم الإلكتروني:' : 'Digital OTP Verification Ref:'}{' '}
              <span className="font-mono font-bold text-slate-800">MKH-DLV-VERIFIED</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="pt-6 border-t mt-8 text-[11px] text-slate-500 space-y-1" style={{ borderColor: '#e2e8f0' }}>
        <p className="font-bold text-slate-700">
          {isAr
            ? 'تنبيه: هذا المستند بوليصة وسند تسليم لوجستي للمنتجات ولا يعد إيصال سداد مالي أو فاتورة ضريبية.'
            : 'IMPORTANT: This document is a logistics delivery waybill and does NOT serve as proof of payment or a tax invoice.'}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{document.seller.name} · {isAr ? 'قسم العمليات واللوجستيات' : 'Operations & Logistics Department'}</span>
          <span>{isAr ? 'الصفحة 1 من 1' : 'Page 1 of 1'}</span>
        </div>
      </div>
    </div>
  );
};
