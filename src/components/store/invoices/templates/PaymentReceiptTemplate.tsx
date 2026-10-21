import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig, InvoiceLineItem } from '../../../../types/invoices';
import { CreditCard, CheckCircle2, Clock, ShieldCheck, MapPin, Phone, Mail, Building, Landmark } from 'lucide-react';
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

export const PaymentReceiptTemplate: React.FC<TemplateProps> = ({ document, config, locale }) => {
  const isAr = locale === 'ar';
  const previouslyPaid = document.previouslyPaidAmount || 0;
  const currentPayment = document.amountPaid;
  const totalPaidCumulative = previouslyPaid + currentPayment;
  const remainingBalance = Math.max(0, document.grandTotal - totalPaidCumulative);
  const isFullySettled = remainingBalance <= 0.01;

  return (
    <div
      className="bg-white text-slate-900 w-full min-h-[1050px] p-8 sm:p-12 flex flex-col justify-between select-text"
      style={{
        fontFamily: isAr ? "'Cairo', 'Tajawal', sans-serif" : 'Inter, sans-serif',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div>
        {/* Top Payment Receipt Stamp Header */}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 mb-6 flex items-center justify-between text-emerald-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black">
                {isAr ? 'سند قبض وإيصال سداد مالي معتمد' : 'OFFICIAL PAYMENT RECEIPT VOUCHER'}
              </h2>
              <p className="text-xs text-emerald-800">
                {isAr
                  ? 'إيصال رسمي يثبت استلام وتسوية الدفعة المالية الموضحة أدناه.'
                  : 'Official receipt confirming verified receipt of the payment settlement transaction.'}
              </p>
            </div>
          </div>
          <div className="text-end">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr ? 'مدفوع ومؤكد' : 'VERIFIED PAID'}
            </span>
          </div>
        </div>

        {/* Business & Receipt Header */}
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
              <p className="text-[11px] text-slate-500 font-semibold">{isAr ? 'رقم سند القبض' : 'Receipt Voucher #'}</p>
              <p className="text-base font-mono font-black text-emerald-700">{document.documentNumber}</p>
            </div>
            {document.orderNumber && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'رقم الطلب' : 'Order Ref'}</p>
                <p className="text-xs font-mono font-bold text-blue-700">{document.orderNumber}</p>
              </div>
            )}
            {document.originalInvoiceNumber && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'الفاتورة المرتبطة' : 'Linked Invoice #'}</p>
                <p className="text-xs font-mono font-bold text-slate-800">{document.originalInvoiceNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Key Payment Transaction Information Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 my-6 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'تاريخ ووقت السداد' : 'Payment Timestamp'}
            </span>
            <p className="font-bold text-slate-800 mt-0.5 whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
              {formatInvoiceDate(document.issueDate, locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'وسيلة الدفع' : 'Payment Method'}
            </span>
            <p className="font-bold text-slate-900 mt-0.5">{document.paymentMethod || (isAr ? 'مدى / دفع إلكتروني' : 'Card / Electronic')}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'رقم العملية البنكية' : 'Transaction ID'}
            </span>
            <p className="font-mono font-bold text-slate-800 mt-0.5 truncate" title={document.paymentTransactionId}>
              {document.paymentTransactionId || 'txn_moyasar_auth_9842'}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'الدافع (العميل)' : 'Received From'}
            </span>
            <p className="font-extrabold text-slate-900 mt-0.5">
              {isAr
                ? document.buyer.nameAr || document.buyer.name
                : document.buyer.nameEn || getCustomerDisplayName(document.buyer.name, 'en')}
            </p>
          </div>
        </div>

        {/* Big Received Amount Callout */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex items-center justify-between mb-8">
          <div>
            <span className="text-xs uppercase font-bold text-emerald-100 tracking-wider block">
              {isAr ? 'المبلغ المستلم بموجب هذا السند' : 'Amount Received on this Receipt'}
            </span>
            <div className="text-3xl font-black font-mono mt-1">
              {currentPayment.toFixed(2)} <span className="text-xl font-normal">{document.currency}</span>
            </div>
          </div>
          <div className="text-end">
            <span className="text-xs text-emerald-100 block">{isAr ? 'حالة السداد' : 'Settlement Status'}</span>
            <span className="text-base font-bold">
              {isFullySettled
                ? isAr ? 'خالص السداد بالكامل' : 'Paid in Full'
                : isAr ? 'دفعة جزئية معتمدة' : 'Partial Payment'}
            </span>
          </div>
        </div>

        {/* Ledger Balance Breakdown Table */}
        <div>
          <h3 className="text-xs font-black uppercase text-slate-600 mb-2">
            {isAr ? 'كشف وتسوية رصيد الفاتورة والمدفوعات' : 'Invoice Payment Ledger & Balance Reconciliation'}
          </h3>
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b-2 text-[11px] font-black uppercase text-slate-700" style={{ borderColor: '#cbd5e1' }}>
                <th className="py-2.5 px-2 text-start">{isAr ? 'البيان' : 'Description'}</th>
                <th className="py-2.5 px-2 text-center">{isAr ? 'العملة' : 'Currency'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'المبلغ' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs text-slate-700">
              <tr>
                <td className="py-3 px-2 font-medium">
                  {isAr ? 'إجمالي قيمة الطلب الأصلية' : 'Total Original Order Amount'}
                </td>
                <td className="py-3 px-2 text-center font-mono">{document.currency}</td>
                <td className="py-3 px-2 text-end font-mono font-bold text-slate-900">
                  {document.grandTotal.toFixed(2)}
                </td>
              </tr>
              {previouslyPaid > 0 && (
                <tr>
                  <td className="py-3 px-2 font-medium text-slate-600">
                    {isAr ? 'إجمالي المبالغ المسددة سابقاً' : 'Previously Received Payments'}
                  </td>
                  <td className="py-3 px-2 text-center font-mono">{document.currency}</td>
                  <td className="py-3 px-2 text-end font-mono font-semibold text-emerald-700">
                    {previouslyPaid.toFixed(2)}
                  </td>
                </tr>
              )}
              <tr className="bg-emerald-50/50">
                <td className="py-3 px-2 font-bold text-emerald-950">
                  {isAr ? 'المبلغ المسدد الحالي (المقبوض في هذا السند)' : 'Current Payment Amount (This Voucher)'}
                </td>
                <td className="py-3 px-2 text-center font-mono font-bold text-emerald-950">{document.currency}</td>
                <td className="py-3 px-2 text-end font-mono font-black text-emerald-700 text-sm">
                  {currentPayment.toFixed(2)}
                </td>
              </tr>
              <tr className="font-bold border-t-2" style={{ borderColor: '#e2e8f0' }}>
                <td className="py-3.5 px-2 text-slate-900">
                  {isAr ? 'الرصيد المتبقي المستحق بعد هذا السداد' : 'Remaining Balance After Payment'}
                </td>
                <td className="py-3.5 px-2 text-center font-mono">{document.currency}</td>
                <td className={`py-3.5 px-2 text-end font-mono text-sm ${remainingBalance > 0 ? 'text-rose-600 font-black' : 'text-emerald-700'}`}>
                  {remainingBalance.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Notes & Legal */}
      <div className="pt-6 border-t mt-8 text-[11px] text-slate-500 space-y-2" style={{ borderColor: '#e2e8f0' }}>
        <p>
          {isAr
            ? 'تم استلام الدفعة الموضحة أعلاه وقيدها في سجل المدفوعات. هذا السند معتمد وموثق إلكترونياً.'
            : 'Payment received and reconciled against financial ledger. This electronic receipt voucher is officially verified.'}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{document.seller.name} · {isAr ? 'إيصالات السداد الإلكترونية' : 'Electronic Payment Vouchers'}</span>
          <span>{isAr ? 'الصفحة 1 من 1' : 'Page 1 of 1'}</span>
        </div>
      </div>
    </div>
  );
};
