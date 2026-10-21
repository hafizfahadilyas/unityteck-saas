import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig, InvoiceLineItem } from '../../../../types/invoices';
import { RotateCcw, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Phone, Mail, Building } from 'lucide-react';
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

export const RefundReceiptTemplate: React.FC<TemplateProps> = ({ document, config, locale }) => {
  const isAr = locale === 'ar';
  const isSucceeded = document.refundStatus === 'succeeded';
  const isPending = document.refundStatus === 'pending';

  return (
    <div
      className="bg-white text-slate-900 w-full min-h-[1050px] p-8 sm:p-12 flex flex-col justify-between select-text"
      style={{
        fontFamily: isAr ? "'Cairo', 'Tajawal', sans-serif" : 'Inter, sans-serif',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div>
        {/* Top Verified Refund Header Banner */}
        <div
          className={`p-4 rounded-xl border-2 mb-6 flex items-center justify-between ${
            isSucceeded
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : isPending
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm text-white ${
                isSucceeded ? 'bg-emerald-600' : isPending ? 'bg-amber-600' : 'bg-rose-600'
              }`}
            >
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {isAr ? 'إيصال استرجاع مالي رسمي معتمد' : 'OFFICIAL REFUND CONFIRMATION RECEIPT'}
              </h2>
              <p className="text-xs font-medium opacity-90">
                {isSucceeded
                  ? isAr
                    ? 'تمت تسوية استرجاع المبلغ بنجاح عبر بوابة الدفع البنكية.'
                    : 'The refund has been successfully settled via the authorized payment gateway.'
                  : isPending
                  ? isAr
                    ? 'الاسترجاع قيد المعالجة البنكية لدى مزود خدمة الدفع.'
                    : 'The refund request is currently processing with the financial provider.'
                  : isAr
                  ? 'عملية الاسترجاع غير مؤكدة أو بانتظار التحقق.'
                  : 'Refund is unverified or pending transaction authorization.'}
              </p>
            </div>
          </div>
          <div className="text-end">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase text-white shadow-xs ${
                isSucceeded ? 'bg-emerald-600' : isPending ? 'bg-amber-600' : 'bg-rose-600'
              }`}
            >
              {isSucceeded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isAr ? 'مسترجع بنجاح' : 'SETTLED & REFUNDED'}
                </>
              ) : isPending ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  {isAr ? 'قيد المعالجة' : 'PENDING GATEWAY'}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isAr ? 'غير مكتمل' : 'UNVERIFIED'}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Business & Document Header */}
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
              <p className="text-[11px] text-slate-500 font-semibold">{isAr ? 'رقم إيصال الاسترجاع' : 'Refund Receipt #'}</p>
              <p className="text-base font-mono font-black text-emerald-700">{document.documentNumber}</p>
            </div>
            {document.originalInvoiceNumber && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'رقم الفاتورة الأصلية' : 'Original Invoice #'}</p>
                <p className="text-xs font-mono font-bold text-slate-700">{document.originalInvoiceNumber}</p>
              </div>
            )}
            {document.orderNumber && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'رقم الطلب' : 'Order Reference'}</p>
                <p className="text-xs font-mono font-bold text-blue-700">{document.orderNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'تاريخ الاسترجاع' : 'Refund Date'}
            </span>
            <p className="text-sm font-semibold text-slate-800 mt-1 whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
              {formatInvoiceDate(document.refundDate || document.issueDate, locale, {
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
              {isAr ? 'العميل المستفيد' : 'Beneficiary Customer'}
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {isAr
                ? document.buyer.nameAr || document.buyer.name
                : document.buyer.nameEn || getCustomerDisplayName(document.buyer.name, 'en')}
            </p>
            {document.buyer.phone && <p className="text-xs text-slate-600 dir-ltr">{document.buyer.phone}</p>}
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'طريقة الاسترجاع' : 'Refund Method'}
            </span>
            <p className="text-sm font-semibold text-slate-800 mt-1">
              {document.refundMethod || (isAr ? 'إعادة إلى البطاقة البنكية' : 'Card Reversal')}
            </p>
            {document.refundTransactionRef && (
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">{document.refundTransactionRef}</p>
            )}
          </div>
        </div>

        {/* Refunded Items Table */}
        <div className="mt-6">
          <h3 className="text-xs font-black uppercase text-slate-600 mb-2">
            {isAr ? 'المنتجات والبنود المسترجعة' : 'Refunded Line Items'}
          </h3>
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b-2 text-[11px] font-black uppercase text-slate-700" style={{ borderColor: '#cbd5e1' }}>
                <th className="py-2.5 px-2 text-start">#</th>
                <th className="py-2.5 px-2 text-start">{isAr ? 'المنتج وسبب الاسترجاع' : 'Refunded Item & Reason'}</th>
                <th className="py-2.5 px-2 text-start">{isAr ? 'رمز الصنف' : 'SKU'}</th>
                <th className="py-2.5 px-2 text-center">{isAr ? 'الكمية المسترجعة' : 'Refunded Qty'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'المبلغ المسترجع' : 'Refunded Amount'}</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs text-slate-700">
              {document.items.map((item: InvoiceLineItem, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="py-3 px-2 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-2 font-medium text-slate-900">
                    <div>{isAr ? item.nameAr || item.name : item.nameEn || getLocalizedItemName(item, 'en')}</div>
                  </td>
                  <td className="py-3 px-2 font-mono text-slate-500">{item.sku || '—'}</td>
                  <td className="py-3 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-3 px-2 text-end font-mono font-bold text-emerald-700">
                    {item.total.toFixed(2)} {document.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Big Total Refund Badge Box */}
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-sm p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-950 space-y-2">
            <div className="flex justify-between text-xs pb-1 border-b border-emerald-200">
              <span>{isAr ? 'المجموع المسترجع قبل الضريبة' : 'Subtotal Refunded'}</span>
              <span className="font-mono font-bold">{document.subtotal.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between text-xs pb-1 border-b border-emerald-200">
              <span>{isAr ? 'ضريبة القيمة المضافة المسترجعة (15%)' : 'VAT Reversal (15%)'}</span>
              <span className="font-mono font-bold">{document.taxAmount.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between items-center pt-1 font-black text-sm">
              <span>{isAr ? 'إجمالي المبلغ المسترجع للعميل' : 'Total Amount Refunded'}</span>
              <span className="text-lg font-mono text-emerald-700">
                {(document.refundAmount || document.grandTotal).toFixed(2)} {document.currency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="pt-6 border-t mt-8 text-[11px] text-slate-500 space-y-2" style={{ borderColor: '#e2e8f0' }}>
        <p>
          {isAr
            ? 'ملاحظة: تعتمد مدة ظهور المبلغ المسترجع في كشف حساب البطاقة على البنك المصدر للبطاقة (عادةً من 3 إلى 7 أيام عمل في المملكة العربية السعودية).'
            : 'NOTE: The settlement timeline into your bank account depends on the card issuing bank (typically 3 to 7 business days in Saudi Arabia).'}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{document.seller.name} · {isAr ? 'إيصال استرجاع معتمد' : 'Authoritative Refund Voucher'}</span>
          <span>{isAr ? 'الصفحة 1 من 1' : 'Page 1 of 1'}</span>
        </div>
      </div>
    </div>
  );
};
