import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig, InvoiceLineItem } from '../../../../types/invoices';
import { generateQrSvgDataUri } from '../../../../utils/zatca';
import { ShieldCheck, Building2, MapPin, Phone, Mail } from 'lucide-react';

interface TemplateProps {
  document: InvoiceDocument;
  config: InvoiceTemplateConfig;
  locale: 'en' | 'ar';
}

export const TaxInvoiceTemplate: React.FC<TemplateProps> = ({ document, config, locale }) => {
  const isAr = locale === 'ar';
  const isStandardB2B = document.zatca?.invoiceCategory === 'standard';
  const qrUri = document.zatca?.qrPayloadBase64
    ? generateQrSvgDataUri(document.zatca.qrPayloadBase64, 140)
    : null;

  return (
    <div
      className="bg-white text-slate-900 w-full min-h-[1050px] p-8 sm:p-12 flex flex-col justify-between select-text"
      style={{
        fontFamily: isAr ? 'Tajawal, Cairo, sans-serif' : 'Inter, sans-serif',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div>
        {/* Top ZATCA Tax Compliance Bilingual Header */}
        <div className="flex items-start justify-between border-b-2 pb-6" style={{ borderColor: '#0f172a' }}>
          <div className="space-y-1 max-w-[60%]">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  {document.seller.nameAr || document.seller.name}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {document.seller.name}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-0.5 pt-2">
              <p>{document.seller.addressAr || document.seller.address}</p>
              <p className="text-[11px] text-slate-500">{document.seller.address}</p>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-900 pt-1">
                <span>
                  الرقم الضريبي (VAT): <strong className="font-mono text-emerald-800">{document.seller.vatNumber || '300948215600003'}</strong>
                </span>
                <span>
                  السجل التجاري (CR): <strong className="font-mono">{document.seller.crNumber || '1010892341'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Document Title & Official ZATCA QR Code */}
          <div className="text-end flex flex-col items-end space-y-2">
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-end shadow-xs">
              <div className="text-xs font-black uppercase tracking-wider">
                {isStandardB2B ? 'فاتورة ضريبية (B2B)' : 'فاتورة ضريبية مبسطة (B2C)'}
              </div>
              <div className="text-[10px] text-slate-300 uppercase tracking-tight">
                {isStandardB2B ? 'TAX INVOICE' : 'SIMPLIFIED TAX INVOICE'}
              </div>
            </div>

            <div className="text-end">
              <p className="text-[10px] text-slate-500 uppercase font-bold">رقم الفاتورة / Invoice Number</p>
              <p className="text-base font-black font-mono text-slate-900">{document.documentNumber}</p>
            </div>

            {qrUri && (
              <div className="pt-1 flex flex-col items-center">
                <img src={qrUri} alt="ZATCA TLV Base64 QR" className="w-24 h-24 border-2 border-slate-300 rounded-lg p-1 bg-white shadow-2xs" />
                <span className="text-[9px] text-emerald-800 font-bold block text-center mt-0.5 font-mono">
                  ZATCA Phase 2 TLV
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Metadata & Buyer Information Grid */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b" style={{ borderColor: '#e2e8f0' }}>
          {/* Dates & Reference */}
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                تاريخ ووقت الإصدار / Issue Date & Time
              </span>
              <p className="text-sm font-semibold text-slate-800 font-mono mt-0.5">
                {new Date(document.issueDate).toISOString().replace('T', ' ').substring(0, 19)} UTC
              </p>
            </div>
            {document.orderNumber && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  الرقم المرجعي للطلب / Order Reference
                </span>
                <p className="text-xs font-bold font-mono text-blue-700 mt-0.5">{document.orderNumber}</p>
              </div>
            )}
          </div>

          {/* Buyer Details (Mandatory for Standard B2B) */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              بيانات المشتري (العميل) / Customer & Buyer Details
            </span>
            <p className="text-sm font-extrabold text-slate-900">
              {document.buyer.nameAr || document.buyer.name}
            </p>
            {document.buyer.companyName && (
              <p className="text-xs font-semibold text-slate-700">{document.buyer.companyName}</p>
            )}
            {document.buyer.vatNumber ? (
              <p className="text-xs font-bold text-emerald-800 font-mono">
                الرقم الضريبي للمشتري: {document.buyer.vatNumber}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 font-medium">مستهلك نهائي (B2C End Consumer)</p>
            )}
            {document.buyer.address && <p className="text-xs text-slate-500">{document.buyer.address}</p>}
          </div>
        </div>

        {/* Tax Itemized Table */}
        <div className="mt-6">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b-2 text-[10px] font-black uppercase text-slate-800" style={{ borderColor: '#0f172a' }}>
                <th className="py-2.5 px-1 text-start">#</th>
                <th className="py-2.5 px-2 text-start">
                  <div>السلع والخدمات</div>
                  <div className="text-[9px] text-slate-500 font-normal">Item Description</div>
                </th>
                <th className="py-2.5 px-2 text-center">
                  <div>الكمية</div>
                  <div className="text-[9px] text-slate-500 font-normal">Qty</div>
                </th>
                <th className="py-2.5 px-2 text-end">
                  <div>سعر الوحدة</div>
                  <div className="text-[9px] text-slate-500 font-normal">Unit Price</div>
                </th>
                <th className="py-2.5 px-2 text-end">
                  <div>الخصم</div>
                  <div className="text-[9px] text-slate-500 font-normal">Discount</div>
                </th>
                <th className="py-2.5 px-2 text-end">
                  <div>المبلغ الخاضع للضريبة</div>
                  <div className="text-[9px] text-slate-500 font-normal">Taxable Amount</div>
                </th>
                <th className="py-2.5 px-2 text-end">
                  <div>نسبة الضريبة</div>
                  <div className="text-[9px] text-slate-500 font-normal">VAT Rate</div>
                </th>
                <th className="py-2.5 px-2 text-end">
                  <div>مبلغ الضريبة</div>
                  <div className="text-[9px] text-slate-500 font-normal">VAT Amount</div>
                </th>
                <th className="py-2.5 px-2 text-end">
                  <div>الإجمالي شامل الضريبة</div>
                  <div className="text-[9px] text-slate-500 font-normal">Total Incl. VAT</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs text-slate-800" style={{ borderColor: '#f1f5f9' }}>
              {document.items.map((item: InvoiceLineItem, idx: number) => {
                const itemSubtotal = item.unitPrice * item.quantity - (item.discount || 0);
                const itemVat = item.taxAmount || itemSubtotal * 0.15;
                const itemTotalWithVat = itemSubtotal + itemVat;

                return (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-1 font-mono text-slate-400 text-center">{idx + 1}</td>
                    <td className="py-3 px-2 font-medium text-slate-900">
                      <div>{item.nameAr || item.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.sku}</div>
                    </td>
                    <td className="py-3 px-2 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-2 text-end font-mono">{item.unitPrice.toFixed(2)}</td>
                    <td className="py-3 px-2 text-end font-mono text-slate-500">
                      {(item.discount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-end font-mono font-medium">{itemSubtotal.toFixed(2)}</td>
                    <td className="py-3 px-2 text-end font-mono text-slate-600">{item.taxRate || 15}%</td>
                    <td className="py-3 px-2 text-end font-mono font-medium text-emerald-800">
                      {itemVat.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-end font-mono font-bold text-slate-900">
                      {itemTotalWithVat.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* VAT Totals Matrix Schedule */}
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-md space-y-1.5 text-xs p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between text-slate-700 pb-1 border-b border-slate-200">
              <span>الإجمالي الخاضع للضريبة (غير شامل الضريبة) / Total Taxable Amount:</span>
              <span className="font-mono font-bold">{document.subtotal.toFixed(2)} {document.currency}</span>
            </div>
            {document.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 pb-1 border-b border-slate-200">
                <span>إجمالي الخصومات / Total Discounts:</span>
                <span className="font-mono font-bold">-{document.discountAmount.toFixed(2)} {document.currency}</span>
              </div>
            )}
            {document.shippingFee > 0 && (
              <div className="flex justify-between text-slate-700 pb-1 border-b border-slate-200">
                <span>رسوم الشحن والتوصيل / Shipping:</span>
                <span className="font-mono font-bold">{document.shippingFee.toFixed(2)} {document.currency}</span>
              </div>
            )}
            <div className="flex justify-between text-emerald-900 font-bold pb-1 border-b border-slate-200">
              <span>مجموع ضريبة القيمة المضافة (15%) / Total VAT (15%):</span>
              <span className="font-mono">{document.taxAmount.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between py-2 font-black text-sm bg-slate-900 text-white px-3 rounded-lg">
              <span>الإجمالي المستحق شامل الضريبة / Grand Total (Incl. VAT):</span>
              <span className="font-mono text-base">{document.grandTotal.toFixed(2)} {document.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Tax Disclaimer */}
      <div className="pt-6 border-t mt-8 text-[10px] text-slate-500 space-y-1" style={{ borderColor: '#e2e8f0' }}>
        <p className="font-semibold text-slate-700">
          تعتبر هذه الفاتورة الإلكترونية صادرة بموجب متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA) في المملكة العربية السعودية ومتوافقة مع معايير الفوترة الإلكترونية (فاتورة - المرحلة الأولى والثانية).
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{document.seller.nameAr || document.seller.name} · ZATCA Phase 2 Tax Invoicing System</span>
          <span>الصفحة 1 من 1 / Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};
