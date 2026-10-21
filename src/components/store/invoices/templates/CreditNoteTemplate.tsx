import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig, InvoiceLineItem } from '../../../../types/invoices';
import { RefreshCw, FileText, CheckCircle, ShieldCheck, MapPin, Phone, Mail, Building } from 'lucide-react';
import { getLocalizedItemName, getCustomerDisplayName, getLocalizedAddress } from '../../../../utils/storeLocalization';
import { formatInvoiceDate } from '../../../../utils/zatca';

interface TemplateProps {
  document: InvoiceDocument;
  config: InvoiceTemplateConfig;
  locale: 'en' | 'ar';
}

export const CreditNoteTemplate: React.FC<TemplateProps> = ({ document, config, locale }) => {
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
        {/* Top Header Banner */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6 flex items-center justify-between text-purple-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black">
                {isAr ? 'إشعار دائن ضريبي معتمد' : 'OFFICIAL TAX CREDIT ADJUSTMENT NOTE'}
              </h2>
              <p className="text-xs text-purple-800">
                {isAr
                  ? 'مستند تسوية وتعديل محاسبي معتمد مقيد على الفاتورة الأصلية.'
                  : 'Official accounting adjustment & VAT correction note referenced to original invoice.'}
              </p>
            </div>
          </div>
          <div className="text-end">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase bg-purple-700 text-white shadow-xs">
              {isAr ? 'إشعار دائن' : 'CREDIT NOTE'}
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
              {isAr ? document.seller.addressAr || document.seller.address : document.seller.addressEn || getLocalizedAddress(document.seller.address, 'en')}
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
              <p className="text-[11px] text-slate-500 font-semibold">{isAr ? 'رقم الإشعار الدائن' : 'Credit Note #'}</p>
              <p className="text-base font-mono font-black text-purple-800">{document.documentNumber}</p>
            </div>
            {document.originalInvoiceNumber && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'رقم الفاتورة الأصلية المعدلة' : 'Adjusted Invoice #'}</p>
                <p className="text-xs font-mono font-bold text-slate-900">{document.originalInvoiceNumber}</p>
              </div>
            )}
            {document.orderNumber && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'رقم الطلب' : 'Order Ref'}</p>
                <p className="text-xs font-mono font-bold text-blue-700">{document.orderNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dates & Buyer Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'تاريخ إصدار الإشعار' : 'Credit Note Date'}
            </span>
            <p className="text-sm font-semibold text-slate-800 mt-1 whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
              {formatInvoiceDate(document.issueDate, locale)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'العميل المستفيد' : 'Credited Customer'}
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {isAr ? document.buyer.nameAr || document.buyer.name : document.buyer.nameEn || getCustomerDisplayName(document.buyer.name, 'en')}
            </p>
            {document.buyer.phone && (
              <p className="text-xs text-slate-600 font-mono text-start mt-0.5">
                <span dir="ltr" className="inline-block">{document.buyer.phone}</span>
              </p>
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'حالة الرصيد الدائن' : 'Credit Status'}
            </span>
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                <CheckCircle className="w-3 h-3" />
                {document.creditStatus === 'applied'
                  ? isAr ? 'تم تطبيق الرصيد' : 'Applied to Account'
                  : isAr ? 'رصيد دائن معتمد' : 'Credit Issued'}
              </span>
            </div>
          </div>
        </div>

        {/* Credit Reason Banner */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-black uppercase text-slate-500 tracking-wider block mb-1">
            {isAr ? 'سبب إصدار الإشعار الدائن:' : 'Reason for Credit Note Issuance:'}
          </span>
          <p className="text-sm font-semibold text-slate-900">
            {isAr
              ? document.creditReasonAr || document.creditReason || 'تسوية وتعديل أسعار ترويجي بعد إتمام عملية الشراء.'
              : document.creditReasonEn || document.creditReason || 'Post-purchase price adjustment and promotional account credit.'}
          </p>
        </div>

        {/* Credited Items Table */}
        <div>
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b-2 text-[11px] font-black uppercase text-slate-700" style={{ borderColor: '#cbd5e1' }}>
                <th className="py-2.5 px-2 text-start">#</th>
                <th className="py-2.5 px-2 text-start">{isAr ? 'البند المعدل' : 'Adjusted Line Description'}</th>
                {config.columns.sku && <th className="py-2.5 px-2 text-start">{isAr ? 'الرمز SKU' : 'SKU'}</th>}
                <th className="py-2.5 px-2 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'المبلغ الدائن الصافي' : 'Net Credited'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'الضريبة المعدلة' : 'Credited VAT'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'إجمالي الرصيد' : 'Total Credit'}</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs text-slate-700">
              {document.items.map((item: InvoiceLineItem, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="py-3 px-2 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-2 font-medium text-slate-900">
                    <div>{getLocalizedItemName(item, locale)}</div>
                  </td>
                  {config.columns.sku && <td className="py-3 px-2 font-mono text-slate-500">{item.sku || '—'}</td>}
                  <td className="py-3 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-3 px-2 text-end font-mono text-slate-700">
                    {(item.unitPrice * item.quantity).toFixed(2)} {document.currency}
                  </td>
                  <td className="py-3 px-2 text-end font-mono text-purple-700">
                    {(item.taxAmount || 0).toFixed(2)} {document.currency}
                  </td>
                  <td className="py-3 px-2 text-end font-mono font-bold text-purple-900">
                    {item.total.toFixed(2)} {document.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Credit Breakdown Box */}
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-sm p-4 rounded-xl bg-purple-50 border-2 border-purple-200 text-purple-950 space-y-2">
            <div className="flex justify-between text-xs pb-1 border-b border-purple-200">
              <span>{isAr ? 'إجمالي المبلغ الدائن قبل الضريبة' : 'Net Credited Amount'}</span>
              <span className="font-mono font-bold">{document.subtotal.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between text-xs pb-1 border-b border-purple-200">
              <span>{isAr ? 'ضريبة القيمة المضافة الدائنة (15%)' : 'Credited VAT (15%)'}</span>
              <span className="font-mono font-bold">{document.taxAmount.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between items-center pt-1 font-black text-sm text-purple-900">
              <span>{isAr ? 'إجمالي الرصيد الدائن المعتمد' : 'Total Credited Amount'}</span>
              <span className="text-lg font-mono">
                {(document.totalCreditedAmount || document.grandTotal).toFixed(2)} {document.currency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="pt-6 border-t mt-8 text-[11px] text-slate-500 space-y-2" style={{ borderColor: '#e2e8f0' }}>
        <p className="font-medium text-slate-600">
          {isAr
            ? 'تنبيه: إصدار الإشعار الدائن يعد تسوية محاسبية لحساب العميل أو تعديلاً على الفاتورة الضريبية، ولا يعني بالضرورة استرجاعاً نقدياً فوري إلا إذا تم سدادها عبر سند استرجاع منفصل.'
            : 'NOTE: Issuing a Credit Note constitutes an accounting balance adjustment against the tax invoice and does not automatically imply cash refund without an authoritative refund voucher.'}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{isAr ? document.seller.nameAr || document.seller.name : document.seller.nameEn || document.seller.name} · {isAr ? 'إشعار دائن رسمي' : 'Official Credit Note Ledger'}</span>
          <span>{isAr ? 'الصفحة 1 من 1' : 'Page 1 of 1'}</span>
        </div>
      </div>
    </div>
  );
};
