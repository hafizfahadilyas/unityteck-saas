import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig, InvoiceLineItem } from '../../../../types/invoices';
import { Truck, CheckCircle, Clock, Building, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
import { getLocalizedItemName, getCustomerDisplayName, getLocalizedAddress } from '../../../../utils/storeLocalization';
import { formatInvoiceDate } from '../../../../utils/zatca';

interface TemplateProps {
  document: InvoiceDocument;
  config: InvoiceTemplateConfig;
  locale: 'en' | 'ar';
}

export const PurchaseInvoiceTemplate: React.FC<TemplateProps> = ({ document, config, locale }) => {
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
        {/* Header Section */}
        <div className="flex items-start justify-between border-b pb-8" style={{ borderColor: '#e2e8f0' }}>
          {/* Supplier Info (Seller in this context) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  {isAr ? document.seller.nameAr || document.seller.name : document.seller.nameEn || document.seller.name}
                </h1>
                <p className="text-xs text-indigo-700 font-semibold">
                  {isAr ? 'فاتورة توريد ومشتريات من المورد' : 'Supplier Purchase & Procurement Invoice'}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-0.5 pt-1">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {isAr
                    ? document.seller.addressAr || document.seller.address
                    : document.seller.addressEn || getLocalizedAddress(document.seller.address, 'en')}
                </span>
              </p>
              <div className="flex items-center gap-4 text-slate-500 pt-0.5">
                {document.seller.phone && <span dir="ltr">{document.seller.phone}</span>}
                {document.seller.email && <span>{document.seller.email}</span>}
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
                {document.seller.vatNumber && (
                  <span>
                    {isAr ? 'الرقم الضريبي للمورد:' : 'Supplier VAT:'}{' '}
                    <strong className="font-mono">{document.seller.vatNumber}</strong>
                  </span>
                )}
                {document.seller.crNumber && (
                  <span>
                    {isAr ? 'السجل التجاري للمورد:' : 'Supplier CR:'}{' '}
                    <strong className="font-mono">{document.seller.crNumber}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Document Meta */}
          <div className="text-end space-y-1.5">
            <span className="inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-indigo-950 text-white">
              {isAr ? 'فاتورة مشتريات' : 'PURCHASE INVOICE'}
            </span>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">{isAr ? 'رقم فاتورة الشراء' : 'Purchase Invoice #'}</p>
              <p className="text-base font-black font-mono text-slate-900">{document.documentNumber}</p>
            </div>
            {document.supplierReference && (
              <div>
                <p className="text-[11px] text-slate-500">{isAr ? 'الرقم المرجعي لدى المورد' : 'Supplier Bill Ref'}</p>
                <p className="text-xs font-bold font-mono text-indigo-700">{document.supplierReference}</p>
              </div>
            )}
          </div>
        </div>

        {/* Parties & Dates Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'تاريخ الشراء والاستلام' : 'Purchase Date'}
            </span>
            <p className="text-sm font-semibold text-slate-800 mt-1 whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>
              {formatInvoiceDate(document.issueDate, locale)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'حالة السداد للمورد' : 'Supplier Payment Status'}
            </span>
            <div className="mt-1">
              {document.outstandingBalance <= 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3 h-3" />
                  {isAr ? 'مسددة بالكامل' : 'Fully Settled'}
                </span>
              ) : document.amountPaid > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3" />
                  {isAr ? 'دفعة جزئية مسددة' : 'Partially Paid'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <Clock className="w-3 h-3" />
                  {isAr ? 'مستحقة السداد' : 'Unpaid Balance'}
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAr ? 'المتجر المشتري (المستلم)' : 'Procured By (Buyer Store)'}
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {isAr ? document.buyer.nameAr || document.buyer.name : document.buyer.nameEn || document.buyer.name}
            </p>
            {document.buyer.vatNumber && (
              <p className="text-xs text-slate-500 font-mono">
                {isAr ? 'الرقم الضريبي للمتجر:' : 'Store VAT:'} {document.buyer.vatNumber}
              </p>
            )}
          </div>
        </div>

        {/* Purchased Items Table */}
        <div className="mt-6">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b-2 text-[11px] font-black uppercase text-slate-700" style={{ borderColor: '#cbd5e1' }}>
                <th className="py-3 px-2 text-start">#</th>
                <th className="py-3 px-2 text-start">{isAr ? 'البند / المادة المشتراة' : 'Purchased Item / SKU'}</th>
                {config.columns.sku && <th className="py-3 px-2 text-start">{isAr ? 'الرمز SKU' : 'SKU'}</th>}
                <th className="py-3 px-2 text-center">{isAr ? 'الكمية المستلمة' : 'Qty Received'}</th>
                <th className="py-3 px-2 text-end">{isAr ? 'تكلفة الوحدة' : 'Unit Cost'}</th>
                <th className="py-3 px-2 text-end">{isAr ? 'ضريبة الشراء' : 'Input VAT'}</th>
                <th className="py-3 px-2 text-end">{isAr ? 'إجمالي التكلفة' : 'Total Cost'}</th>
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
                  <td className="py-3.5 px-2 text-end font-mono text-slate-500">
                    {item.taxAmount?.toFixed(2) || (item.unitPrice * item.quantity * 0.15).toFixed(2)} {document.currency}
                  </td>
                  <td className="py-3.5 px-2 text-end font-bold font-mono text-slate-900">
                    {item.total.toFixed(2)} {document.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Accounts Payable Balance */}
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-sm space-y-2 text-xs p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
              <span>{isAr ? 'مجموع تكلفة المشتريات الصافية' : 'Net Purchase Subtotal'}</span>
              <span className="font-mono font-medium">{document.subtotal.toFixed(2)} {document.currency}</span>
            </div>
            {document.shippingFee > 0 && (
              <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
                <span>{isAr ? 'تكلفة الشحن والتخليص الجمركي' : 'Freight & Clearance'}</span>
                <span className="font-mono font-medium">{document.shippingFee.toFixed(2)} {document.currency}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
              <span>{isAr ? 'ضريبة القيمة المضافة المدخلة (15%)' : 'Input VAT (15%)'}</span>
              <span className="font-mono font-medium">{document.taxAmount.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between py-2 font-black text-sm bg-indigo-950 text-white px-3 rounded-lg">
              <span>{isAr ? 'إجمالي تكلفة الفاتورة المستحقة للمورد' : 'Total Supplier Payable'}</span>
              <span className="font-mono text-base">{document.grandTotal.toFixed(2)} {document.currency}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-semibold pt-1">
              <span>{isAr ? 'المبلغ المسدد للمورد حتى الآن' : 'Amount Paid to Supplier'}</span>
              <span className="font-mono">{document.amountPaid.toFixed(2)} {document.currency}</span>
            </div>
            {document.outstandingBalance > 0 ? (
              <div className="flex justify-between text-rose-700 font-black text-sm border-t border-rose-200 pt-1">
                <span>{isAr ? 'الرصيد المتبقي المستحق للمورد' : 'Outstanding Supplier Balance'}</span>
                <span className="font-mono">{document.outstandingBalance.toFixed(2)} {document.currency}</span>
              </div>
            ) : (
              <div className="flex justify-between text-emerald-700 font-bold border-t border-emerald-200 pt-1">
                <span>{isAr ? 'حساب المورد مسوى بالكامل' : 'Account Fully Settled (0.00)'}</span>
                <span className="font-mono">0.00 {document.currency}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="pt-8 border-t mt-8 text-xs text-slate-500 space-y-2" style={{ borderColor: '#e2e8f0' }}>
        {(document.paymentTerms || document.paymentTermsEn || document.paymentTermsAr) && (
          <p className="text-slate-600">
            <strong>{isAr ? 'شروط السداد للمورد:' : 'Supplier Payment Terms:'}</strong>{' '}
            {isAr ? document.paymentTermsAr || document.paymentTerms : document.paymentTermsEn || document.paymentTerms}
          </p>
        )}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2">
          <span>{isAr ? 'سجل المشتريات والمخزون' : 'Purchasing & Accounts Payable Ledger'}</span>
          <span>{isAr ? 'الصفحة 1 من 1' : 'Page 1 of 1'}</span>
        </div>
      </div>
    </div>
  );
};
