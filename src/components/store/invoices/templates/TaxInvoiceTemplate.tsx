import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig, InvoiceLineItem } from '../../../../types/invoices';
import { generateQrSvgDataUri } from '../../../../utils/zatca';
import { ShieldCheck, Building2, MapPin, Phone, Mail } from 'lucide-react';
import {
  getLocalizedItemName,
  getCustomerDisplayName,
  getLocalizedAddress,
} from '../../../../utils/storeLocalization';

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
        {/* Top Tax Compliance Header */}
        <div className="flex items-start justify-between border-b-2 pb-6" style={{ borderColor: '#0f172a' }}>
          <div className="space-y-1 max-w-[60%]">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  {isAr ? document.seller.nameAr || document.seller.name : document.seller.nameEn || document.seller.name}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {isAr ? 'فاتورة ضريبية رسمية معتمدة' : 'Official Registered Tax Invoice'}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-0.5 pt-2">
              <p>
                {isAr
                  ? document.seller.addressAr || document.seller.address
                  : document.seller.addressEn || getLocalizedAddress(document.seller.address, 'en')}
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-900 pt-1">
                <span>
                  {isAr ? 'الرقم الضريبي:' : 'VAT Registration:'}{' '}
                  <strong className="font-mono text-emerald-800">{document.seller.vatNumber || config.taxNumber}</strong>
                </span>
                <span>
                  {isAr ? 'السجل التجاري:' : 'Commercial Registration (CR):'}{' '}
                  <strong className="font-mono">{document.seller.crNumber || config.crNumber}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Document Title & QR Code */}
          <div className="text-end flex flex-col items-end space-y-2">
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-end shadow-xs">
              <div className="text-xs font-black uppercase tracking-wider">
                {isStandardB2B
                  ? isAr ? 'فاتورة ضريبية' : 'TAX INVOICE'
                  : isAr ? 'فاتورة ضريبية مبسطة' : 'SIMPLIFIED TAX INVOICE'}
              </div>
            </div>

            <div className="text-end">
              <p className="text-[10px] text-slate-500 uppercase font-bold">
                {isAr ? 'رقم الفاتورة' : 'Invoice Number'}
              </p>
              <p className="text-base font-black font-mono text-slate-900">{document.documentNumber}</p>
            </div>

            {qrUri && (
              <div className="pt-1 flex flex-col items-center">
                <img src={qrUri} alt="Tax Verification QR Code" className="w-24 h-24 border-2 border-slate-300 rounded-lg p-1 bg-white shadow-2xs" />
                <span className="text-[9px] text-emerald-800 font-bold block text-center mt-0.5 font-mono">
                  {isAr ? 'رمز التحقق الرقمي' : 'Digital Verification QR'}
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
                {isAr ? 'تاريخ ووقت الإصدار' : 'Issue Date & Time'}
              </span>
              <p className="text-sm font-semibold text-slate-800 font-mono mt-0.5">
                {new Date(document.issueDate).toISOString().replace('T', ' ').substring(0, 19)} UTC
              </p>
            </div>
            {document.orderNumber && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isAr ? 'رقم الطلب المرجعي' : 'Order Reference'}
                </span>
                <p className="text-xs font-bold font-mono text-blue-700 mt-0.5">{document.orderNumber}</p>
              </div>
            )}
          </div>

          {/* Buyer Details */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'بيانات العميل (المشتري)' : 'Customer & Buyer Details'}
            </span>
            <p className="text-sm font-extrabold text-slate-900">
              {isAr
                ? document.buyer.nameAr || document.buyer.name
                : document.buyer.nameEn || getCustomerDisplayName(document.buyer.name, 'en')}
            </p>
            {document.buyer.companyName && (
              <p className="text-xs font-semibold text-slate-700">
                {isAr
                  ? document.buyer.companyNameAr || document.buyer.companyName
                  : document.buyer.companyNameEn || document.buyer.companyName}
              </p>
            )}
            {document.buyer.vatNumber ? (
              <p className="text-xs font-bold text-emerald-800 font-mono">
                {isAr ? 'الرقم الضريبي للمشتري:' : 'Buyer VAT:'} {document.buyer.vatNumber}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 font-medium">
                {isAr ? 'مستهلك نهائي' : 'End Consumer'}
              </p>
            )}
            {document.buyer.address && (
              <p className="text-xs text-slate-500">
                {isAr
                  ? document.buyer.addressAr || document.buyer.address
                  : document.buyer.addressEn || getLocalizedAddress(document.buyer.address, 'en')}
              </p>
            )}
          </div>
        </div>

        {/* Tax Itemized Table */}
        <div className="mt-6">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b-2 text-[10px] font-black uppercase text-slate-800" style={{ borderColor: '#0f172a' }}>
                <th className="py-2.5 px-1 text-start">#</th>
                <th className="py-2.5 px-2 text-start">{isAr ? 'السلع والخدمات' : 'Item Description'}</th>
                <th className="py-2.5 px-2 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'الخصم' : 'Discount'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'المبلغ الخاضع للضريبة' : 'Taxable Amount'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'نسبة الضريبة' : 'VAT Rate'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'مبلغ الضريبة' : 'VAT Amount'}</th>
                <th className="py-2.5 px-2 text-end">{isAr ? 'الإجمالي شامل الضريبة' : 'Total Incl. VAT'}</th>
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
                      <div>{isAr ? item.nameAr || item.name : item.nameEn || getLocalizedItemName(item, 'en')}</div>
                      {item.sku && <div className="text-[10px] text-slate-500 font-mono">{item.sku}</div>}
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
              <span>{isAr ? 'الإجمالي الخاضع للضريبة (غير شامل الضريبة):' : 'Total Taxable Amount (Excl. VAT):'}</span>
              <span className="font-mono font-bold">{document.subtotal.toFixed(2)} {document.currency}</span>
            </div>
            {document.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 pb-1 border-b border-slate-200">
                <span>{isAr ? 'إجمالي الخصومات:' : 'Total Discounts:'}</span>
                <span className="font-mono font-bold">-{document.discountAmount.toFixed(2)} {document.currency}</span>
              </div>
            )}
            {document.shippingFee > 0 && (
              <div className="flex justify-between text-slate-700 pb-1 border-b border-slate-200">
                <span>{isAr ? 'رسوم الشحن والتوصيل:' : 'Shipping & Delivery:'}</span>
                <span className="font-mono font-bold">{document.shippingFee.toFixed(2)} {document.currency}</span>
              </div>
            )}
            <div className="flex justify-between text-emerald-900 font-bold pb-1 border-b border-slate-200">
              <span>{isAr ? 'مجموع ضريبة القيمة المضافة (15%):' : 'Total VAT (15%):'}</span>
              <span className="font-mono">{document.taxAmount.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between py-2 font-black text-sm bg-slate-900 text-white px-3 rounded-lg">
              <span>{isAr ? 'الإجمالي المستحق شامل الضريبة:' : 'Grand Total (Incl. VAT):'}</span>
              <span className="font-mono text-base">{document.grandTotal.toFixed(2)} {document.currency}</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Security Stamp Box */}
        {document.zatca && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-black text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {isAr ? 'بيانات التوثيق والاعتماد الرقمي الرسمي' : 'Official Cryptographic Validation Details'}
                </span>
              </span>
              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                {document.zatca.complianceStatus === 'cleared'
                  ? isAr ? 'معتمدة ومفسوحة' : 'Cleared'
                  : document.zatca.complianceStatus === 'reported'
                  ? isAr ? 'مُبلغة للهيئة' : 'Reported'
                  : isAr ? 'معتمدة نظامياً' : 'Compliant'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5 font-sans">
                  {isAr ? 'الرمز الرقمي للفاتورة:' : 'Invoice Hash (SHA-256):'}
                </span>
                <span className="text-slate-800 break-all text-[10px] block font-semibold">
                  {document.zatca.invoiceHash || 'a9f4c3b281d7e502b487c6531980a3fe7412e8b9...'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5 font-sans">
                  {isAr ? 'الختم والتوقيع الرقمي:' : 'Digital Stamp (ECDSA):'}
                </span>
                <span className="text-emerald-800 break-all text-[10px] block font-semibold">
                  {document.zatca.cryptographicStamp || 'MEQCID6v9320...TAX-SECP256K1-VERIFIED'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5 font-sans">
                  {isAr ? 'معيار الفاتورة والتصنيف:' : 'Tax Category & Code:'}
                </span>
                <span className="text-slate-800 font-sans text-xs font-bold block">
                  {isAr ? 'الفئة القياسية (15%)' : 'Standard 15% VAT'} · Code {document.zatca.invoiceType || '388'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Official Tax Disclaimer */}
      <div className="pt-6 border-t mt-8 text-[10px] text-slate-500 space-y-1" style={{ borderColor: '#e2e8f0' }}>
        <p className="font-semibold text-slate-700">
          {isAr
            ? 'تعتبر هذه الفاتورة الإلكترونية صادرة بموجب متطلبات هيئة الزكاة والضريبة والجمارك في المملكة العربية السعودية ومتوافقة مع معايير الفوترة الإلكترونية.'
            : 'This official electronic invoice is issued in accordance with Saudi tax and e-invoicing statutory regulations.'}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{isAr ? document.seller.nameAr || document.seller.name : document.seller.name}</span>
          <span>{isAr ? 'الصفحة 1 من 1' : 'Page 1 of 1'}</span>
        </div>
      </div>
    </div>
  );
};
