import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig, InvoiceLineItem } from '../../../../types/invoices';
import { FileText, Calendar, Clock, AlertTriangle, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';

interface TemplateProps {
  document: InvoiceDocument;
  config: InvoiceTemplateConfig;
  locale: 'en' | 'ar';
}

export const ProformaInvoiceTemplate: React.FC<TemplateProps> = ({ document, config, locale }) => {
  const isAr = locale === 'ar';

  return (
    <div
      className="bg-white text-slate-900 w-full min-h-[1050px] p-8 sm:p-12 flex flex-col justify-between relative select-text"
      style={{
        fontFamily: isAr ? 'Tajawal, Cairo, sans-serif' : 'Inter, sans-serif',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Background Watermark */}
      {config.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
          <span className="text-8xl font-black rotate-[-30deg] tracking-widest text-slate-900 uppercase">
            PROFORMA
          </span>
        </div>
      )}

      <div>
        {/* Top Disclaimer Banner */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 mb-6 flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs font-bold">
              {isAr
                ? 'فاتورة شكلية أولية (بروفورما) — هذه الفاتورة تقديرية ولا تعتبر فاتورة ضريبية نهائية أو سند سداد.'
                : 'PROFORMA ESTIMATE — This is a preliminary quotation and does not constitute a final tax invoice or receipt.'}
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-amber-500 text-white shrink-0">
            {isAr ? 'فاتورة أولية' : 'PROFORMA'}
          </span>
        </div>

        {/* Header Section */}
        <div className="flex items-start justify-between border-b pb-6" style={{ borderColor: '#e2e8f0' }}>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900">
              {isAr ? document.seller.nameAr || document.seller.name : document.seller.name}
            </h1>
            <p className="text-xs text-slate-500">
              {isAr ? document.seller.addressAr || document.seller.address : document.seller.address}
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
              <p className="text-[11px] text-slate-500 font-semibold">{isAr ? 'رقم الفاتورة الأولية' : 'Proforma Invoice #'}</p>
              <p className="text-base font-mono font-black text-amber-700">{document.documentNumber}</p>
            </div>
            {document.customerReference && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'مرجع العميل' : 'Customer Ref'}</p>
                <p className="text-xs font-mono font-bold text-slate-700">{document.customerReference}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dates & Validity & Customer Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'تاريخ التقدير' : 'Issue Date'}
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
              {isAr ? 'صالح حتى تاريخ' : 'Validity Period'}
            </span>
            <p className="text-sm font-bold text-amber-700 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {document.validUntil
                  ? new Date(document.validUntil).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : isAr
                  ? 'صالح لمدة 15 يوماً'
                  : 'Valid for 15 days'}
              </span>
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'العميل الموجه له التقدير' : 'Proposed To'}
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {isAr ? document.buyer.nameAr || document.buyer.name : document.buyer.name}
            </p>
            {document.buyer.companyName && (
              <p className="text-xs font-semibold text-slate-700">{document.buyer.companyName}</p>
            )}
            {document.buyer.phone && <p className="text-xs text-slate-600 dir-ltr">{document.buyer.phone}</p>}
          </div>
        </div>

        {/* Proposed Products Table */}
        <div className="mt-6">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b-2 text-[11px] font-black uppercase text-slate-700" style={{ borderColor: '#cbd5e1' }}>
                <th className="py-3 px-2 text-start">#</th>
                <th className="py-3 px-2 text-start">{isAr ? 'المنتجات والخدمات المقترحة' : 'Proposed Products / Services'}</th>
                {config.columns.sku && <th className="py-3 px-2 text-start">{isAr ? 'الرمز SKU' : 'SKU'}</th>}
                <th className="py-3 px-2 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                {config.columns.unitPrice && <th className="py-3 px-2 text-end">{isAr ? 'السعر التقديري' : 'Estimated Unit Price'}</th>}
                {config.columns.discount && <th className="py-3 px-2 text-end">{isAr ? 'الخصم' : 'Discount'}</th>}
                <th className="py-3 px-2 text-end">{isAr ? 'الإجمالي التقديري' : 'Estimated Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs" style={{ borderColor: '#f1f5f9' }}>
              {document.items.map((item: InvoiceLineItem, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="py-3.5 px-2 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3.5 px-2 font-medium text-slate-900">
                    <div>{isAr ? item.nameAr || item.name : item.name}</div>
                  </td>
                  {config.columns.sku && <td className="py-3.5 px-2 text-slate-500 font-mono">{item.sku || '—'}</td>}
                  <td className="py-3.5 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                  {config.columns.unitPrice && (
                    <td className="py-3.5 px-2 text-end font-mono text-slate-700">
                      {item.unitPrice.toFixed(2)} {document.currency}
                    </td>
                  )}
                  {config.columns.discount && (
                    <td className="py-3.5 px-2 text-end font-mono text-emerald-600">
                      {(item.discount || 0) > 0 ? `-${item.discount?.toFixed(2)}` : '—'}
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
              <span>{isAr ? 'المجموع الفرعي التقديري' : 'Estimated Subtotal'}</span>
              <span className="font-mono">{document.subtotal.toFixed(2)} {document.currency}</span>
            </div>
            {document.discountAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600">
                <span>{isAr ? 'إجمالي الخصم التقديري' : 'Estimated Discounts'}</span>
                <span className="font-mono font-bold">-{document.discountAmount.toFixed(2)} {document.currency}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>{isAr ? 'ضريبة القيمة المضافة المقدرة (15%)' : 'Estimated VAT (15%)'}</span>
              <span className="font-mono">{document.taxAmount.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg font-black text-sm bg-slate-900 text-white">
              <span>{isAr ? 'الإجمالي الكلي التقديري' : 'Estimated Grand Total'}</span>
              <span className="font-mono text-base">{document.grandTotal.toFixed(2)} {document.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notes & Payment Terms */}
      <div className="pt-8 border-t mt-8 text-xs text-slate-600 space-y-3" style={{ borderColor: '#e2e8f0' }}>
        {document.paymentTerms && (
          <p className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
            <strong>{isAr ? 'شروط السداد والتوريد المقترحة:' : 'Proposed Payment & Delivery Terms:'}</strong> {document.paymentTerms}
          </p>
        )}
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{isAr ? 'فاتورة شكلية أولية غير ملزمة ضريبياً' : 'Non-Binding Preliminary Proforma Invoice'}</span>
          <span>{isAr ? 'الصفحة 1 من 1' : 'Page 1 of 1'}</span>
        </div>
      </div>
    </div>
  );
};
