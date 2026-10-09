import React, { useState } from 'react';
import type { Order, Store } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { Printer, X, Globe, Edit3, Check, QrCode, Building, ShieldCheck, Phone, MapPin, Mail, Calendar, FileText } from 'lucide-react';

interface RetailInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  store?: Store;
}

export const RetailInvoiceModal: React.FC<RetailInvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  store,
}) => {
  const [invoiceLocale, setInvoiceLocale] = useState<'en' | 'ar'>('ar');
  const [isEditing, setIsEditing] = useState(false);
  const { money } = usePrefs();

  // Editable invoice fields
  const [storeName, setStoreName] = useState(store?.name || 'Makkah Fresh Flowers');
  const [taxNumber, setTaxNumber] = useState('300948215600003');
  const [crNumber, setCrNumber] = useState('1010892341');
  const [cashierName, setCashierName] = useState('Ahmed M.');
  const [customNote, setCustomNote] = useState('Thank you for shopping with us! Please keep this receipt for returns/warranty.');

  if (!isOpen || !order) return null;

  const isAr = invoiceLocale === 'ar';

  const items = order.items && order.items.length > 0 ? order.items : [
    {
      id: 'it-1',
      name: 'Royal Dutch Red Roses Velvet Box',
      sku: 'WM-ROSE-01',
      price: 340,
      quantity: 1,
      total: 340,
    },
    {
      id: 'it-2',
      name: 'Casablanca White Lilies & Orchids Vase',
      sku: 'WM-LILY-02',
      price: 220,
      quantity: 1,
      total: 220,
    },
    {
      id: 'it-3',
      name: 'Belgian Chocolate & Red Roses Box',
      sku: 'WM-CHOC-06',
      price: 90,
      quantity: 1,
      total: 90,
    },
  ];

  const subtotal = order.subtotal ?? items.reduce((s, it) => s + it.price * it.quantity, 0);
  const discount = order.discountAmount ?? 46;
  const shippingFee = order.shippingFee ?? 42;
  const tax = order.tax ?? Math.round(subtotal * 0.15);
  const grandTotal = order.total || (subtotal - discount + shippingFee + tax);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #retail-invoice-print-area, #retail-invoice-print-area * {
            visibility: visible !important;
          }
          #retail-invoice-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
      >
        {/* ── MODAL HEADER / CONTROLS (Hidden during print) ── */}
        <div
          className="no-print p-4 border-b flex items-center justify-between gap-3 flex-wrap bg-slate-50 dark:bg-slate-900/60"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-extrabold tracking-tight">
              {isAr ? 'طباعة الفاتورة الضريبية الرسمية' : 'Print Official Retail Tax Invoice'}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Runtime Language Switcher */}
            <div className="flex items-center rounded-xl p-1 border text-xs font-bold bg-white dark:bg-slate-800" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setInvoiceLocale('en')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  !isAr ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setInvoiceLocale('ar')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  isAr ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                العربية
              </button>
            </div>

            {/* Edit Invoice Toggle */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-100"
              style={{ borderColor: 'var(--border)', color: isEditing ? 'var(--accent)' : 'var(--text)' }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? (isAr ? 'معاينة' : 'Preview') : (isAr ? 'تعديل الفاتورة' : 'Edit')}</span>
            </button>

            {/* Print CTA */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm bg-teal-600 hover:bg-teal-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة فورية' : 'Print Now'}</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* ── PRINTABLE INVOICE PAPER (Target of @media print) ── */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="retail-invoice-print-area"
            dir={isAr ? 'rtl' : 'ltr'}
            className="w-full max-w-[580px] bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-md border border-slate-200 text-xs font-sans print:shadow-none print:border-none print:p-0"
            style={{ fontFamily: isAr ? "'Cairo', 'Tajawal', sans-serif" : 'sans-serif' }}
          >
            {/* Header / Store Brand Info */}
            <div className="text-center pb-4 border-b-2 border-slate-800">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-xl mb-2">
                UT
              </div>
              {isEditing ? (
                <div className="space-y-1 max-w-sm mx-auto my-2">
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full text-center font-black text-base border rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    value={taxNumber}
                    placeholder="Tax Number"
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full text-center text-xs border rounded px-2 py-0.5 font-mono"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-lg font-black tracking-tight text-slate-900">{storeName}</h1>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    {isAr ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {isAr ? 'الرقم الضريبي' : 'VAT No'}: {taxNumber} | {isAr ? 'السجل التجاري' : 'CR'}: {crNumber}
                  </p>
                </>
              )}
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500 block">{isAr ? 'رقم الفاتورة' : 'Invoice Number'}:</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{order.orderNumber}</span>
              </div>
              <div className="text-end">
                <span className="text-slate-500 block">{isAr ? 'تاريخ ووقت الإصدار' : 'Invoice Date & Time'}:</span>
                <span className="font-mono font-semibold text-slate-900">{order.date || '2024-01-31'} {order.time || '14:32'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{isAr ? 'اسم العميل' : 'Customer Name'}:</span>
                <span className="font-bold text-slate-900">{order.customerName}</span>
                <span className="block font-mono text-[10px] text-slate-600">{order.customerPhone}</span>
              </div>
              <div className="text-end">
                <span className="text-slate-500 block">{isAr ? 'طريقة الدفع' : 'Payment Method'}:</span>
                <span className="font-bold text-slate-900 uppercase">{order.paymentMethod}</span>
                <span className="block font-mono text-[10px] text-emerald-700">{order.paymentStatus || 'PAID'}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-3">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-700 font-bold">
                    <th className="py-2 text-start">{isAr ? 'الصنف' : 'Item Description'}</th>
                    <th className="py-2 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="py-2 text-end">{isAr ? 'السعر' : 'Unit Price'}</th>
                    <th className="py-2 text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx} className="py-1.5">
                      <td className="py-1.5 text-start font-medium text-slate-900">
                        <div>{it.name}</div>
                        <div className="text-[9px] font-mono text-slate-500">SKU: {it.sku || `ITEM-${idx + 1}`}</div>
                      </td>
                      <td className="py-1.5 text-center font-mono">{it.quantity}</td>
                      <td className="py-1.5 text-end font-mono">{money(it.price)}</td>
                      <td className="py-1.5 text-end font-mono font-bold">{money(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Tax Calculation Breakdown */}
            <div className="pt-2 border-t-2 border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>{isAr ? 'المجموع قبل الضريبة' : 'Subtotal (Excl. VAT)'}:</span>
                <span className="font-mono">{money(subtotal - tax)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>{isAr ? 'الخصم الترويجي' : 'Discount'}:</span>
                  <span className="font-mono">- {money(discount)}</span>
                </div>
              )}
              {shippingFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{isAr ? 'أجور التوصيل' : 'Delivery Fee'}:</span>
                  <span className="font-mono">{money(shippingFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>{isAr ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}:</span>
                <span className="font-mono">{money(tax)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-b border-slate-800 text-sm font-black text-slate-900">
                <span>{isAr ? 'المجموع الكلي مع الضريبة' : 'Total Amount (Incl. VAT)'}:</span>
                <span className="font-mono text-base">{money(grandTotal)}</span>
              </div>
            </div>

            {/* ZATCA QR Code & Security Stamp */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300 flex items-center justify-between gap-4">
              <div className="space-y-1 text-[10px] text-slate-600">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'معتمد وفق هيئة الزكاة والضريبة والجمارك (ZATCA)' : 'ZATCA Tax Compliant Invoice'}</span>
                </div>
                <p className="text-[9px] leading-tight">
                  {isAr ? customNote : customNote}
                </p>
                <p className="text-[9px] font-mono text-slate-400">
                  Auth Hash: e8b9f1...489c · Station: POS-01 · {cashierName}
                </p>
              </div>

              {/* Mock ZATCA QR Code SVG */}
              <div className="w-20 h-20 border border-slate-300 rounded p-1 flex items-center justify-center shrink-0 bg-white">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                  <rect x="5" y="5" width="30" height="30" fill="black" />
                  <rect x="10" y="10" width="20" height="20" fill="white" />
                  <rect x="15" y="15" width="10" height="10" fill="black" />
                  <rect x="65" y="5" width="30" height="30" fill="black" />
                  <rect x="70" y="10" width="20" height="20" fill="white" />
                  <rect x="75" y="15" width="10" height="10" fill="black" />
                  <rect x="5" y="65" width="30" height="30" fill="black" />
                  <rect x="10" y="70" width="20" height="20" fill="white" />
                  <rect x="15" y="75" width="10" height="10" fill="black" />
                  <rect x="45" y="15" width="10" height="20" fill="black" />
                  <rect x="45" y="45" width="20" height="20" fill="black" />
                  <rect x="75" y="45" width="20" height="10" fill="black" />
                  <rect x="75" y="75" width="15" height="15" fill="black" />
                  <rect x="45" y="75" width="10" height="15" fill="black" />
                </svg>
              </div>
            </div>

            {/* Footer Barcode */}
            <div className="mt-4 pt-2 text-center text-[9px] text-slate-400 font-mono">
              * {order.orderNumber.replace('#', '')}-{taxNumber.slice(-4)} *
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
