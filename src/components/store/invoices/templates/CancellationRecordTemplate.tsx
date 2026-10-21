import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig, InvoiceLineItem } from '../../../../types/invoices';
import { AlertOctagon, XCircle, Clock, ShieldAlert, Phone, Mail, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
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

export const CancellationRecordTemplate: React.FC<TemplateProps> = ({ document, config, locale }) => {
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
        {/* Top Cancellation Warning Banner */}
        <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-rose-900">
                {isAr ? 'سجل إلغاء طلب رسمي - إشعار إلغاء' : 'OFFICIAL ORDER CANCELLATION RECORD'}
              </h2>
              <p className="text-xs text-rose-700">
                {isAr
                  ? 'تم إلغاء هذا الطلب رسمياً في النظام. يرجى الاطلاع على حالة الاسترجاع المالي المرفقة أدناه.'
                  : 'This order has been formally cancelled. Please review the financial refund status below.'}
              </p>
            </div>
          </div>
          <div className="text-end">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-600 text-white shadow-xs">
              {isAr ? 'ملغي' : 'CANCELLED'}
            </span>
          </div>
        </div>

        {/* Header Section */}
        <div className="flex items-start justify-between border-b pb-6" style={{ borderColor: '#e2e8f0' }}>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900">
              {isAr ? document.seller.nameAr || document.seller.name : document.seller.nameEn || document.seller.name}
            </h1>
            <p className="text-xs text-slate-500">
              {isAr
                ? document.seller.addressAr || document.seller.address
                : document.seller.addressEn || getLocalizedAddress(document.seller.address, 'en')}
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
              {document.seller.vatNumber && (
                <span>
                  {isAr ? 'الرقم الضريبي:' : 'VAT:'} <span className="font-mono">{document.seller.vatNumber}</span>
                </span>
              )}
              {document.seller.crNumber && (
                <span>
                  {isAr ? 'السجل التجاري:' : 'CR:'} <span className="font-mono">{document.seller.crNumber}</span>
                </span>
              )}
            </div>
          </div>

          <div className="text-end space-y-1">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">{isAr ? 'رقم سجل الإلغاء' : 'Cancellation Record #'}</p>
              <p className="text-base font-mono font-black text-rose-700">{document.documentNumber}</p>
            </div>
            {document.orderNumber && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'رقم الطلب الأصلي' : 'Original Order Reference'}</p>
                <p className="text-xs font-mono font-bold text-slate-900">{document.orderNumber}</p>
              </div>
            )}
            {document.originalInvoiceNumber && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'رقم الفاتورة الأصلية' : 'Original Invoice #'}</p>
                <p className="text-xs font-mono font-bold text-slate-700">{document.originalInvoiceNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'تاريخ الإلغاء' : 'Cancellation Date'}
            </span>
            <p className="text-sm font-semibold text-slate-800 mt-1 whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
              {formatInvoiceDate(document.cancellationDate || document.issueDate, locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'بيانات العميل' : 'Customer Details'}
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {isAr
                ? document.buyer.nameAr || document.buyer.name
                : document.buyer.nameEn || getCustomerDisplayName(document.buyer.name, 'en')}
            </p>
            {document.buyer.phone && (
              <p className="text-xs text-slate-600 font-mono text-start mt-0.5">
                <span dir="ltr" className="inline-block">{document.buyer.phone}</span>
              </p>
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'حالة الاسترجاع المالي' : 'Financial Refund Status'}
            </span>
            <div className="mt-1">
              {document.refundStatus === 'succeeded' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  {isAr ? 'تم استرجاع المبلغ' : 'Refund Succeeded'}
                </span>
              ) : document.refundStatus === 'pending' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3" />
                  {isAr ? 'جاري معالجة الاسترجاع' : 'Refund Pending Gateway'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  <AlertCircle className="w-3 h-3" />
                  {isAr ? 'لم يتم الاسترجاع بعد' : 'No Refund Processed'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Prominent Cancellation Reason Block */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-black uppercase text-slate-500 tracking-wider block mb-1">
            {isAr ? 'سبب الإلغاء الرسمي المسجل:' : 'Official Cancellation Reason:'}
          </span>
          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
            {document.cancellationReason ||
              (isAr
                ? 'تم الإلغاء رسمياً بناءً على طلب العميل قبل بدء تجهيز الشحنة.'
                : 'Officially cancelled per customer request prior to dispatch processing.')}
          </p>
        </div>

        {/* Cancelled Items Table */}
        <div>
          <h3 className="text-xs font-black uppercase text-slate-600 mb-2">
            {isAr ? 'المنتجات التي تم إلغاؤها' : 'Cancelled Items'}
          </h3>
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b-2 text-[11px] font-black uppercase text-slate-700" style={{ borderColor: '#cbd5e1' }}>
                <th className="py-2.5 px-2 text-start">#</th>
                <th className="py-2.5 px-2 text-start">{isAr ? 'المنتج الملغي' : 'Cancelled Item'}</th>
                <th className="py-2.5 px-2 text-start">{isAr ? 'الرمز SKU' : 'SKU'}</th>
                <th className="py-2.5 px-2 text-center">{isAr ? 'الكمية الملغاة' : 'Cancelled Qty'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'القيمة الأصلية' : 'Original Value'}</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs text-slate-600">
              {document.items.map((item: InvoiceLineItem, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="py-3 px-2 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-2 font-medium text-slate-800 line-through">
                    {isAr ? item.nameAr || item.name : item.nameEn || getLocalizedItemName(item, 'en')}
                  </td>
                  <td className="py-3 px-2 font-mono text-slate-500">{item.sku || '—'}</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-3 px-2 text-end font-mono font-bold text-slate-700">
                    {item.total.toFixed(2)} {document.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Settlement Summary */}
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-sm p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
              <span>{isAr ? 'إجمالي قيمة الطلب الأصلي' : 'Original Order Value'}</span>
              <span className="font-mono font-bold">
                {(document.originalOrderValue || document.grandTotal).toFixed(2)} {document.currency}
              </span>
            </div>
            <div className="flex justify-between text-slate-700 pb-1 border-b border-slate-200">
              <span>{isAr ? 'المبلغ المدفوع قبل الإلغاء' : 'Amount Paid Before Cancellation'}</span>
              <span className="font-mono font-bold">{document.amountPaid.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-extrabold text-sm pt-1">
              <span>{isAr ? 'مبلغ الاسترجاع المالي المستحق' : 'Applicable Refund Amount'}</span>
              <span className="font-mono">
                {(document.refundAmount || document.amountPaid).toFixed(2)} {document.currency}
              </span>
            </div>
            {document.refundTransactionRef && (
              <p className="text-[10px] text-slate-500 pt-1 font-mono">
                {isAr ? 'المرجع البنكي للاسترجاع:' : 'Refund Gateway Ref:'} {document.refundTransactionRef}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Legal Notice */}
      <div className="pt-6 border-t mt-8 text-[11px] text-slate-500 space-y-2" style={{ borderColor: '#e2e8f0' }}>
        <p className="font-semibold text-slate-600">
          {isAr
            ? 'تنبيه: سجل الإلغاء يؤكد إيقاف تجهيز وتسليم الطلب رسمياً. لا يعد هذا المستند بمفرده إيصال استرجاع بنكي إلا في حال تأكيد العملية من بوابة الدفع.'
            : 'DISCLAIMER: This cancellation record confirms the formal cessation of order fulfillment. It does not constitute a bank refund receipt unless authoritative gateway settlement is completed.'}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{document.seller.name} · {isAr ? 'سجل الإلغاءات الإلكتروني' : 'Electronic Cancellation Ledger'}</span>
          <span>{isAr ? 'الصفحة 1 من 1' : 'Page 1 of 1'}</span>
        </div>
      </div>
    </div>
  );
};
