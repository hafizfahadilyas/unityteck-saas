import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig } from '../../../../types/invoices';
import { QrCode, CheckCircle, Clock, ShieldCheck, Phone, Mail, MapPin, Building, Calendar } from 'lucide-react';
import { generateQrSvgDataUri } from '../../../../utils/zatca';

interface TemplateProps {
  document: InvoiceDocument;
  config: InvoiceTemplateConfig;
  locale: 'en' | 'ar';
}

export const OrderInvoiceTemplate: React.FC<TemplateProps> = ({ document, config, locale }) => {
  const isAr = locale === 'ar';
  const qrUri = document.zatca?.qrPayloadBase64
    ? generateQrSvgDataUri(document.zatca.qrPayloadBase64, 130)
    : null;

  return (
    <div
      className="bg-white text-slate-900 w-full min-h-[1050px] p-8 sm:p-12 flex flex-col justify-between select-text"
      style={{
        fontFamily: isAr ? 'Tajawal, Cairo, sans-serif' : 'Inter, sans-serif',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header Section */}
      <div>
        <div className="flex items-start justify-between border-b pb-8" style={{ borderColor: '#e2e8f0' }}>
          {/* Brand Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {config.showLogo && (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-md shrink-0"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {document.seller.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: config.primaryColor }}>
                  {isAr ? document.seller.nameAr || document.seller.name : document.seller.name}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'فاتورة مبيعات ضريبية رسمية' : 'Official Commercial Sales Invoice'}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-0.5 pt-2">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{isAr ? document.seller.addressAr || document.seller.address : document.seller.address}</span>
              </p>
              <div className="flex items-center gap-4 text-slate-500 pt-1">
                {document.seller.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span dir="ltr">{document.seller.phone}</span>
                  </span>
                )}
                {document.seller.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{document.seller.email}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
                {document.seller.vatNumber && (
                  <span>
                    {isAr ? 'الرقم الضريبي:' : 'VAT No:'}{' '}
                    <strong className="font-mono">{document.seller.vatNumber}</strong>
                  </span>
                )}
                {document.seller.crNumber && (
                  <span>
                    {isAr ? 'السجل التجاري:' : 'CR No:'}{' '}
                    <strong className="font-mono">{document.seller.crNumber}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Document Meta & QR Code */}
          <div className="text-end flex flex-col items-end space-y-2">
            <div className="inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-900 text-white shadow-xs">
              {isAr ? 'فاتورة مبيعات' : 'ORDER INVOICE'}
            </div>
            <div className="text-end">
              <p className="text-xs text-slate-500 font-medium">{isAr ? 'رقم الفاتورة' : 'Invoice Number'}</p>
              <p className="text-lg font-black font-mono text-slate-900 tracking-tight">{document.documentNumber}</p>
            </div>
            {document.orderNumber && (
              <div className="text-end">
                <p className="text-[11px] text-slate-500">{isAr ? 'رقم الطلب المرتبط' : 'Associated Order'}</p>
                <p className="text-xs font-bold font-mono text-blue-700">{document.orderNumber}</p>
              </div>
            )}
            {qrUri && config.showZatcaQr && (
              <div className="pt-1">
                <img src={qrUri} alt="ZATCA TLV QR Code" className="w-20 h-20 border rounded-lg p-1 bg-white shadow-2xs" />
                <span className="text-[9px] text-slate-400 block text-center font-mono">ZATCA Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Dates & Bill To Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'تاريخ الإصدار' : 'Issue Date'}
            </span>
            <p className="text-sm font-semibold text-slate-800 mt-1">
              {new Date(document.issueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'حالة السداد' : 'Payment Status'}
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              {document.amountPaid >= document.grandTotal ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3 h-3" />
                  {isAr ? 'مدفوعة بالكامل' : 'Paid in Full'}
                </span>
              ) : document.amountPaid > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3" />
                  {isAr ? 'مدفوعة جزئياً' : 'Partially Paid'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <Clock className="w-3 h-3" />
                  {isAr ? 'معلقة / غير مسددة' : 'Unpaid'}
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'بيانات العميل المستلم' : 'Billed To'}
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {isAr ? document.buyer.nameAr || document.buyer.name : document.buyer.name}
            </p>
            {document.buyer.phone && <p className="text-xs text-slate-600 dir-ltr">{document.buyer.phone}</p>}
            {document.buyer.address && <p className="text-xs text-slate-500">{document.buyer.address}</p>}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mt-6">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b-2 text-[11px] font-black uppercase text-slate-700" style={{ borderColor: '#cbd5e1' }}>
                <th className="py-3 px-2 text-start">#</th>
                <th className="py-3 px-2 text-start">{isAr ? 'المنتج / الوصف' : 'Item Description'}</th>
                {config.columns.sku && <th className="py-3 px-2 text-start">{isAr ? 'رمز SKU' : 'SKU'}</th>}
                <th className="py-3 px-2 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                {config.columns.unitPrice && <th className="py-3 px-2 text-end">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>}
                {config.columns.taxRate && <th className="py-3 px-2 text-end">{isAr ? 'الضريبة' : 'VAT'}</th>}
                <th className="py-3 px-2 text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs" style={{ borderColor: '#f1f5f9' }}>
              {document.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-2 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3.5 px-2 font-medium text-slate-900">
                    <div>{isAr ? item.nameAr || item.name : item.name}</div>
                  </td>
                  {config.columns.sku && (
                    <td className="py-3.5 px-2 text-slate-500 font-mono text-[11px]">{item.sku || '—'}</td>
                  )}
                  <td className="py-3.5 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                  {config.columns.unitPrice && (
                    <td className="py-3.5 px-2 text-end font-mono text-slate-700">
                      {item.unitPrice.toFixed(2)} {document.currency}
                    </td>
                  )}
                  {config.columns.taxRate && (
                    <td className="py-3.5 px-2 text-end font-mono text-slate-500">
                      {item.taxRate || 15}%
                    </td>
                  )}
                  <td className="py-3.5 px-2 text-end font-bold font-mono text-slate-900">
                    {item.total.toFixed(2)} {document.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-xs space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>{isAr ? 'المجموع الفرعي الخاضع للضريبة' : 'Taxable Subtotal'}</span>
              <span className="font-mono font-medium">{document.subtotal.toFixed(2)} {document.currency}</span>
            </div>
            {document.discountAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600">
                <span>{isAr ? 'الخصم المطبق' : 'Discount Applied'}</span>
                <span className="font-mono font-bold">-{document.discountAmount.toFixed(2)} {document.currency}</span>
              </div>
            )}
            {document.shippingFee > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>{isAr ? 'رسوم الشحن والتوصيل' : 'Shipping & Delivery'}</span>
                <span className="font-mono font-medium">{document.shippingFee.toFixed(2)} {document.currency}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>{isAr ? 'ضريبة القيمة المضافة (15%)' : 'Value Added Tax (15%)'}</span>
              <span className="font-mono font-medium">{document.taxAmount.toFixed(2)} {document.currency}</span>
            </div>
            <div
              className="flex justify-between py-2 px-3 rounded-lg font-black text-sm text-white"
              style={{ backgroundColor: config.primaryColor }}
            >
              <span>{isAr ? 'الإجمالي الكلي شامل الضريبة' : 'Grand Total (Incl. VAT)'}</span>
              <span className="font-mono text-base">{document.grandTotal.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-700 font-semibold pt-1">
              <span>{isAr ? 'المبلغ المسدد' : 'Amount Paid'}</span>
              <span className="font-mono">{document.amountPaid.toFixed(2)} {document.currency}</span>
            </div>
            {document.outstandingBalance > 0 && (
              <div className="flex justify-between py-1 text-rose-600 font-bold border-t border-rose-100">
                <span>{isAr ? 'الرصيد المتبقي المستحق' : 'Balance Due'}</span>
                <span className="font-mono">{document.outstandingBalance.toFixed(2)} {document.currency}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Notes & Legal Notice */}
      <div className="pt-8 border-t mt-8 text-xs text-slate-500 space-y-3" style={{ borderColor: '#e2e8f0' }}>
        {config.showPaymentInstructions && document.paymentMethod && (
          <p className="text-slate-600">
            <strong>{isAr ? 'طريقة الدفع:' : 'Payment Method:'}</strong> {document.paymentMethod}{' '}
            {document.paymentTransactionId && <span className="font-mono text-[11px]">({document.paymentTransactionId})</span>}
          </p>
        )}
        {config.showNotes && document.notes && (
          <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <strong>{isAr ? 'ملاحظات:' : 'Notes:'}</strong> {document.notes}
          </p>
        )}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2">
          <span>{isAr ? config.customTermsAr : config.customTermsEn}</span>
          <span>{isAr ? 'الصفحة 1 من 1' : 'Page 1 of 1'}</span>
        </div>
      </div>
    </div>
  );
};
