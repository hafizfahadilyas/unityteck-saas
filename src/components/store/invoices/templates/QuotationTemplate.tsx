import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig, InvoiceLineItem } from '../../../../types/invoices';
import { Send, CheckCircle2, Clock, Calendar, Sparkles, MapPin, Phone, Mail, Building } from 'lucide-react';
import { getLocalizedItemName, getCustomerDisplayName, getLocalizedAddress } from '../../../../utils/storeLocalization';
import { formatInvoiceDate } from '../../../../utils/zatca';

interface TemplateProps {
  document: InvoiceDocument;
  config: InvoiceTemplateConfig;
  locale: 'en' | 'ar';
}

export const QuotationTemplate: React.FC<TemplateProps> = ({ document, config, locale }) => {
  const isAr = locale === 'ar';
  const status = document.quotationStatus || 'sent';

  return (
    <div
      className="bg-white text-slate-900 w-full min-h-[1050px] p-8 sm:p-12 flex flex-col justify-between select-text"
      style={{
        fontFamily: isAr ? "'Cairo', 'Tajawal', sans-serif" : 'Inter, sans-serif',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div>
        {/* Top Proposal Header Banner */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between text-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black">
                {isAr ? 'عرض أسعار تجاري رسمي معتمد' : 'OFFICIAL COMMERCIAL PRICE QUOTATION'}
              </h2>
              <p className="text-xs text-blue-800">
                {isAr
                  ? 'عرض أسعار معتمد موجه للعميل الموضح أدناه مع الالتزام بكافة الشروط المذكورة خلال فترة الصلاحية.'
                  : 'Official price quotation issued with guaranteed pricing terms during the stated validity window.'}
              </p>
            </div>
          </div>
          <div className="text-end">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase text-white shadow-xs ${
                status === 'converted' || status === 'accepted'
                  ? 'bg-emerald-600'
                  : status === 'sent'
                  ? 'bg-blue-600'
                  : status === 'draft'
                  ? 'bg-slate-600'
                  : 'bg-rose-600'
              }`}
            >
              {status === 'converted'
                ? isAr ? 'تم التحويل إلى طلب' : 'CONVERTED TO ORDER'
                : status === 'accepted'
                ? isAr ? 'مقبول من العميل' : 'ACCEPTED'
                : status === 'sent'
                ? isAr ? 'مرسل للعميل' : 'SENT PROPOSAL'
                : status === 'draft'
                ? isAr ? 'مسودة عرض' : 'DRAFT QUOTE'
                : isAr ? 'منتهي الصلاحية' : 'EXPIRED'}
            </span>
          </div>
        </div>

        {/* Business & Quote Header */}
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
              <p className="text-[11px] text-slate-500 font-semibold">{isAr ? 'رقم عرض الأسعار' : 'Quotation #'}</p>
              <p className="text-base font-mono font-black text-blue-700">{document.documentNumber}</p>
            </div>
            {document.convertedOrderId && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'رقم الطلب المحول إليه' : 'Converted Order #'}</p>
                <p className="text-xs font-mono font-bold text-emerald-700">{document.convertedOrderId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dates & Proposal Customer Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'تاريخ تقديم العرض' : 'Quotation Date'}
            </span>
            <p className="text-sm font-semibold text-slate-800 mt-1 whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
              {formatInvoiceDate(document.issueDate, locale)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'صلاحية الأسعار حتى' : 'Offer Valid Until'}
            </span>
            <p className="text-sm font-bold text-blue-800 mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {document.validUntil
                  ? formatInvoiceDate(document.validUntil, locale)
                  : isAr
                  ? 'صالح لمدة 21 يوماً'
                  : 'Valid for 21 days'}
              </span>
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'العميل الموجه له العرض' : 'Quotation Recipient'}
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {isAr ? document.buyer.nameAr || document.buyer.name : document.buyer.nameEn || getCustomerDisplayName(document.buyer.name, 'en')}
            </p>
            {document.buyer.companyName && (
              <p className="text-xs font-semibold text-slate-700">
                {isAr ? document.buyer.companyNameAr || document.buyer.companyName : document.buyer.companyNameEn || document.buyer.companyName}
              </p>
            )}
            {document.buyer.phone && <p className="text-xs text-slate-600 dir-ltr">{document.buyer.phone}</p>}
          </div>
        </div>

        {/* Quotation Line Items Table */}
        <div className="mt-6">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b-2 text-[11px] font-black uppercase text-slate-700" style={{ borderColor: '#cbd5e1' }}>
                <th className="py-3 px-2 text-start">#</th>
                <th className="py-3 px-2 text-start">{isAr ? 'المنتجات والخدمات المقترحة' : 'Item Proposal'}</th>
                {config.columns.sku && <th className="py-3 px-2 text-start">{isAr ? 'رمز الصنف' : 'SKU'}</th>}
                <th className="py-3 px-2 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                <th className="py-3 px-2 text-end">{isAr ? 'سعر الوحدة المقترح' : 'Proposed Unit Price'}</th>
                <th className="py-3 px-2 text-end">{isAr ? 'الخصم الخاص' : 'Special Discount'}</th>
                <th className="py-3 px-2 text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs" style={{ borderColor: '#f1f5f9' }}>
              {document.items.map((item: InvoiceLineItem, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="py-3.5 px-2 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3.5 px-2 font-medium text-slate-900">
                    <div>{getLocalizedItemName(item, locale)}</div>
                  </td>
                  {config.columns.sku && <td className="py-3.5 px-2 text-slate-500 font-mono">{item.sku || '—'}</td>}
                  <td className="py-3.5 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-3.5 px-2 text-end font-mono text-slate-700">
                    {item.unitPrice.toFixed(2)} {document.currency}
                  </td>
                  <td className="py-3.5 px-2 text-end font-mono text-emerald-600">
                    {(item.discount || 0) > 0 ? `-${item.discount?.toFixed(2)}` : '—'}
                  </td>
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
              <span>{isAr ? 'المجموع الفرعي لعرض الأسعار' : 'Quotation Subtotal'}</span>
              <span className="font-mono">{document.subtotal.toFixed(2)} {document.currency}</span>
            </div>
            {document.discountAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600">
                <span>{isAr ? 'الخصم التجاري الممنوح' : 'Commercial Discount'}</span>
                <span className="font-mono font-bold">-{document.discountAmount.toFixed(2)} {document.currency}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>{isAr ? 'ضريبة القيمة المضافة المقدرة (15%)' : 'Estimated VAT (15%)'}</span>
              <span className="font-mono">{document.taxAmount.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg font-black text-sm bg-blue-700 text-white shadow-xs">
              <span>{isAr ? 'إجمالي قيمة العرض المقترح' : 'Total Proposed Value'}</span>
              <span className="font-mono text-base">{document.grandTotal.toFixed(2)} {document.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Acceptance Box */}
      <div className="pt-6 border-t mt-8 text-xs text-slate-600 space-y-3" style={{ borderColor: '#e2e8f0' }}>
        {(document.paymentTerms || document.paymentTermsEn || document.paymentTermsAr) && (
          <p className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <strong>{isAr ? 'شروط السداد المعتمدة في العرض:' : 'Payment Terms:'}</strong>{' '}
            {isAr ? document.paymentTermsAr || document.paymentTerms : document.paymentTermsEn || document.paymentTerms}
          </p>
        )}
        {(document.termsAndConditions || document.termsAndConditionsEn || document.termsAndConditionsAr) && (
          <p className="text-[11px] text-slate-500">
            <strong>{isAr ? 'الشروط والأحكام العامة:' : 'General Terms:'}</strong>{' '}
            {isAr ? document.termsAndConditionsAr || document.termsAndConditions : document.termsAndConditionsEn || document.termsAndConditions}
          </p>
        )}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2">
          <span>{isAr ? document.seller.nameAr || document.seller.name : document.seller.nameEn || document.seller.name} · {isAr ? 'عرض أسعار غير ملزم حتى التعميد الرسمي' : 'Commercial Proposal Document'}</span>
          <span>{isAr ? 'الصفحة 1 من 1' : 'Page 1 of 1'}</span>
        </div>
      </div>
    </div>
  );
};
