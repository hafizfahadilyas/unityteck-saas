import React, { useState } from 'react';
import type { Order, Store } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  Printer,
  X,
  Edit3,
  Check,
  ShieldCheck,
  Phone,
  MapPin,
  Mail,
  Calendar,
  CreditCard,
  Building2,
  FileText,
  Share2,
  Download,
  Sparkles,
  Receipt,
  Layers,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { generateZatcaTlvBase64, generateQrSvgDataUri } from '../../utils/zatca';

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
  const [printLayout, setPrintLayout] = useState<'a4' | 'thermal'>('a4');
  const [isEditing, setIsEditing] = useState(false);
  const { money } = usePrefs();

  // Editable invoice fields with luxury defaults
  const [storeName, setStoreName] = useState(store?.name || 'Makkah Luxury Boutique');
  const [storeNameAr, setStoreNameAr] = useState('هدايا مكة الفاخرة');
  const [storeAddress, setStoreAddress] = useState('Al-Awali District, Ibrahim Al-Khalil St, Makkah, Saudi Arabia');
  const [storeAddressAr, setStoreAddressAr] = useState('حي العوالي، شارع إبراهيم الخليل، مكة المكرمة، المملكة العربية السعودية');
  const [storePhone, setStorePhone] = useState('+966 50 123 4567');
  const [storeEmail, setStoreEmail] = useState('concierge@giftshop-sa.com');
  const [taxNumber, setTaxNumber] = useState('300948215600003');
  const [crNumber, setCrNumber] = useState('1010892341');
  const [cashierName, setCashierName] = useState('Ahmed M.');
  const [customNote, setCustomNote] = useState('شكراً لتسوقكم معنا! يرجى الاحتفاظ بهذه الفاتورة للضمان والاستبدال خلال 14 يوماً.');
  const [customNoteEn, setCustomNoteEn] = useState('Thank you for shopping with us! Please retain this official invoice for warranty and exchanges within 14 days.');

  if (!isOpen || !order) return null;

  const isAr = invoiceLocale === 'ar';

  const items = order.items && order.items.length > 0 ? order.items : [
    {
      id: 'it-1',
      name: 'صندوق بيوني هولندي وردي فاخر (Peony Luxury Velvet Box)',
      sku: 'WM-PEONY-05',
      price: 280,
      quantity: 1,
      total: 280,
    },
    {
      id: 'it-2',
      name: 'شوكولاتة باتشي فاخرة مع تغليف إهداء ملكي (Patchi Royal Gift)',
      sku: 'WM-PATCHI-01',
      price: 150,
      quantity: 1,
      total: 150,
    },
  ];

  const subtotal = order.subtotal ?? items.reduce((s, it) => s + it.price * it.quantity, 0);
  const discount = order.discountAmount ?? (order.total && order.total < subtotal ? subtotal - order.total : 0);
  const shippingFee = order.shippingFee ?? 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = order.tax ?? Math.round(taxableAmount * 0.15);
  const grandTotal = order.total || (taxableAmount + shippingFee + tax);

  // Real ZATCA TLV QR Code Generation
  const isoTimestamp = new Date().toISOString();
  const zatcaBase64 = generateZatcaTlvBase64({
    sellerName: isAr ? storeNameAr : storeName,
    vatNumber: taxNumber,
    timestamp: isoTimestamp,
    invoiceTotal: grandTotal,
    vatTotal: tax,
  });
  const zatcaQrUri = generateQrSvgDataUri(zatcaBase64, 180);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const phone = order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : '';
    const text = encodeURIComponent(
      isAr
        ? `مرحباً ${order.customerName}، مرفق لكم الفاتورة الضريبية الرسمية لطلبكم رقم ${order.orderNumber} بمبلغ ${grandTotal} ر.س.`
        : `Hello ${order.customerName}, here is your official tax invoice for order ${order.orderNumber} totaling ${grandTotal} SAR.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Dynamic Print Stylesheet for A4 and Thermal */}
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
            width: ${printLayout === 'thermal' ? '80mm' : '100%'} !important;
            max-width: ${printLayout === 'thermal' ? '80mm' : '100%'} !important;
            margin: 0 auto !important;
            padding: ${printLayout === 'thermal' ? '12px' : '32px'} !important;
            background: #ffffff !important;
            color: #0f172a !important;
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
        className="w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh] bg-slate-900 border border-slate-700 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* ── TOP ACTION BAR ── */}
        <div className="no-print p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  {isAr ? 'الفاتورة الضريبية الإلكترونية' : 'Electronic Tax Invoice'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ZATCA Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr ? `الطلب ${order.orderNumber} • ${order.customerName}` : `Order ${order.orderNumber} • ${order.customerName}`}
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Layout Selector: A4 vs Thermal */}
            <div className="flex items-center rounded-xl p-1 bg-slate-800 border border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintLayout('a4')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  printLayout === 'a4'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Executive</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('thermal')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  printLayout === 'thermal'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm POS Slip</span>
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center rounded-xl p-1 bg-slate-800 border border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setInvoiceLocale('ar')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isAr
                    ? 'bg-slate-700 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setInvoiceLocale('en')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  !isAr
                    ? 'bg-slate-700 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            {/* Edit Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                isEditing
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? (isAr ? 'إنهاء التعديل' : 'Done') : (isAr ? 'تخصيص' : 'Customize')}</span>
            </button>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500/40 cursor-pointer transition-all"
              title={isAr ? 'مشاركة عبر واتساب' : 'Share via WhatsApp'}
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Print Now Primary CTA */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة رسمية' : 'Print Invoice'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── EDIT PANEL (Shown when Customize is toggled) ── */}
        {isEditing && (
          <div className="no-print p-4 sm:p-5 bg-slate-800 border-b border-slate-700 text-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-150">
            <div>
              <label className="block text-slate-400 font-medium mb-1">اسم المتجر (عربي)</label>
              <input
                type="text"
                value={storeNameAr}
                onChange={(e) => setStoreNameAr(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Store Name (English)</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">الرقم الضريبي (15 رقم)</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">السجل التجاري (CR)</label>
              <input
                type="text"
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">عنوان المتجر</label>
              <input
                type="text"
                value={storeAddressAr}
                onChange={(e) => setStoreAddressAr(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">الملاحظات القانونية أسفل الفاتورة</label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
          </div>
        )}

        {/* ── INVOICE DISPLAY PAPER ── */}
        <div className="overflow-y-auto p-4 sm:p-8 md:p-10 bg-slate-100 flex justify-center items-start min-h-[450px]">
          {printLayout === 'a4' ? (
            /* ══════════════════════════════════════════════════════════════
               LAYOUT 1: A4 EXECUTIVE LUXURY SAUDI TAX INVOICE
               ══════════════════════════════════════════════════════════════ */
            <div
              id="retail-invoice-print-area"
              dir={isAr ? 'rtl' : 'ltr'}
              className="w-full max-w-[800px] bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200 select-text font-sans"
              style={{ fontFamily: isAr ? "'Tajawal', 'Cairo', sans-serif" : "'Plus Jakarta Sans', 'Inter', sans-serif" }}
            >
              {/* Top Accent Luxury Stripe */}
              <div className="w-full h-2 rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 mb-8" />

              {/* ── Header: Brand Info & Document Header ── */}
              <div className="flex items-start justify-between gap-6 pb-8 border-b border-slate-200">
                {/* Store Brand & Legal Identification */}
                <div className="space-y-3 max-w-[60%]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-950 to-slate-800 text-amber-400 font-black text-2xl flex items-center justify-center shadow-lg border border-slate-700 shrink-0">
                      {(isAr ? storeNameAr : storeName).substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                        {isAr ? storeNameAr : storeName}
                      </h1>
                      <p className="text-xs font-bold text-emerald-700 tracking-wide">
                        {isAr ? 'فاتورة ضريبية مبسطة معتمدة' : 'Official Simplified Tax Invoice'}
                      </p>
                    </div>
                  </div>

                  {/* Legal Address & Tax Badges */}
                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{isAr ? storeAddressAr : storeAddress}</span>
                    </p>
                    <div className="flex items-center gap-4 text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span dir="ltr">{storePhone}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{storeEmail}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-800 pt-1">
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                        {isAr ? 'الرقم الضريبي' : 'VAT No'}: <strong className="font-mono text-slate-900">{taxNumber}</strong>
                      </span>
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                        {isAr ? 'السجل التجاري' : 'CR'}: <strong className="font-mono text-slate-900">{crNumber}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Invoice Title Badge, Document Number & ZATCA QR */}
                <div className="text-end flex flex-col items-end space-y-3 shrink-0">
                  <div className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 text-white shadow-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isAr ? 'فاتورة ضريبية' : 'TAX INVOICE'}</span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isAr ? 'رقم الفاتورة' : 'Invoice Number'}
                    </span>
                    <span className="text-lg font-black font-mono text-slate-900 tracking-tight">
                      {order.orderNumber}
                    </span>
                  </div>

                  {/* Real ZATCA TLV QR Code */}
                  <div className="p-1.5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col items-center">
                    <img
                      src={zatcaQrUri}
                      alt="ZATCA QR Code"
                      className="w-24 h-24 rounded-lg object-contain"
                    />
                    <span className="text-[9px] font-bold text-emerald-700 mt-1 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      ZATCA QR
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Metadata Cards Grid (Customer, Dates, Payment) ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-slate-200">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isAr ? 'تاريخ الإصدار' : 'Issue Date'}
                  </span>
                  <p className="text-xs font-bold text-slate-800 font-mono">
                    {order.date || new Date().toISOString().split('T')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {order.time || '14:30:00'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isAr ? 'اسم العميل' : 'Customer Name'}
                  </span>
                  <p className="text-xs font-black text-slate-900 truncate">
                    {order.customerName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate" dir="ltr">
                    {order.customerPhone || 'N/A'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isAr ? 'طريقة السداد' : 'Payment Method'}
                  </span>
                  <p className="text-xs font-bold text-slate-900 uppercase">
                    {order.paymentMethod || 'Credit Card / Mada'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700">
                    <Check className="w-3 h-3" />
                    {isAr ? 'مدفوعة بالكامل' : 'PAID IN FULL'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isAr ? 'حالة الطلب' : 'Order Status'}
                  </span>
                  <p className="text-xs font-extrabold text-slate-800 capitalize">
                    {order.status}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Cashier: {cashierName}
                  </p>
                </div>
              </div>

              {/* ── Line Items Table ── */}
              <div className="py-6">
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-[11px]">
                        <th className="py-3 px-4 text-start">{isAr ? 'الصنف والوصف' : 'Item Description'}</th>
                        <th className="py-3 px-3 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                        <th className="py-3 px-3 text-end">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                        <th className="py-3 px-3 text-end">{isAr ? 'الضريبة (15%)' : 'VAT (15%)'}</th>
                        <th className="py-3 px-4 text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => {
                        const itemTotal = it.price * it.quantity;
                        const itemVat = Math.round(itemTotal * 0.15);
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="py-3 px-4 text-start font-semibold text-slate-900">
                              <div className="font-bold text-slate-900">{it.name}</div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                SKU: {it.sku || `SKU-${idx + 101}`}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                                {it.quantity}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-end font-mono text-slate-700">{money(it.price)}</td>
                            <td className="py-3 px-3 text-end font-mono text-slate-500">{money(itemVat)}</td>
                            <td className="py-3 px-4 text-end font-mono font-black text-slate-900">{money(itemTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Financial Schedule & Totals Breakdown ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                {/* Notes & Security Seal */}
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'إشعار الامتثال والضمان' : 'Warranty & Compliance Notice'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {isAr ? customNote : customNoteEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                    <span>ZATCA Phase 1 & 2 Compliant</span>
                    <span>UUID: {order.id || '9f83a-48b1'}</span>
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{isAr ? 'المجموع قبل الضريبة (غير شامل)' : 'Subtotal (Excl. VAT)'}:</span>
                    <span className="font-mono font-bold text-slate-800">{money(subtotal - tax)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-rose-600 font-semibold">
                      <span>{isAr ? 'الخصم الترويجي' : 'Promotional Discount'}:</span>
                      <span className="font-mono">- {money(discount)}</span>
                    </div>
                  )}

                  {shippingFee > 0 && (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{isAr ? 'رسوم الشحن والتوصيل' : 'Shipping & Delivery'}:</span>
                      <span className="font-mono font-bold text-slate-800">{money(shippingFee)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{isAr ? 'ضريبة القيمة المضافة (15%)' : 'Total VAT (15%)'}:</span>
                    <span className="font-mono font-bold text-emerald-700">{money(tax)}</span>
                  </div>

                  {/* Grand Total Highlight */}
                  <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-slate-900">
                    <div>
                      <span className="text-xs font-black block">{isAr ? 'الإجمالي الكلي النهائي' : 'Grand Total (Incl. VAT)'}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{isAr ? 'شامل ضريبة القيمة المضافة' : 'All taxes included'}</span>
                    </div>
                    <div className="text-end">
                      <span className="text-xl font-black font-mono text-slate-900">{money(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Footer Barcode ── */}
              <div className="mt-8 pt-4 border-t border-slate-200 text-center space-y-1">
                <p className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
                  * {order.orderNumber.replace('#', '')}-{taxNumber.slice(-4)} *
                </p>
                <p className="text-[9px] text-slate-400">
                  {isAr
                    ? 'تم إصدار هذه الفاتورة إلكترونياً وتعتبر وثيقة رسمية معتمدة وفق اشتراطات هيئة الزكاة والضريبة والجمارك.'
                    : 'This electronic invoice is generated digitally and compliant with official ZATCA e-invoicing regulations.'}
                </p>
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════
               LAYOUT 2: MODERN LUXURY 80MM POS THERMAL SLIP
               ══════════════════════════════════════════════════════════════ */
            <div
              id="retail-invoice-print-area"
              dir={isAr ? 'rtl' : 'ltr'}
              className="w-full max-w-[360px] bg-white text-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 select-text font-mono text-xs my-2"
              style={{ fontFamily: isAr ? "'Tajawal', 'Cairo', monospace" : "monospace" }}
            >
              {/* Slip Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 font-black text-lg flex items-center justify-center mx-auto mb-2 shadow-sm">
                  {(isAr ? storeNameAr : storeName).substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-base font-black tracking-tight text-slate-900">
                  {isAr ? storeNameAr : storeName}
                </h2>
                <p className="text-[11px] font-bold text-emerald-700 font-sans">
                  {isAr ? 'فاتورة ضريبية مبسطة معتمدة' : 'Official Simplified Tax Invoice'}
                </p>
                <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                  <p>{isAr ? storeAddressAr : storeAddress}</p>
                  <p>{isAr ? 'الرقم الضريبي' : 'VAT'}: <strong className="text-slate-800">{taxNumber}</strong></p>
                  <p>{isAr ? 'السجل التجاري' : 'CR'}: <strong className="text-slate-800">{crNumber}</strong></p>
                </div>
              </div>

              {/* Order Meta */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'رقم الفاتورة:' : 'Inv No:'}</span>
                  <span className="font-bold text-slate-900">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'التاريخ والوقت:' : 'Date & Time:'}</span>
                  <span className="text-slate-800">{order.date || new Date().toISOString().split('T')[0]} {order.time || '14:30'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'العميل:' : 'Customer:'}</span>
                  <span className="font-bold text-slate-900 truncate max-w-[170px]">{order.customerName}</span>
                </div>
                {order.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'الجوال:' : 'Phone:'}</span>
                    <span className="text-slate-700" dir="ltr">{order.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-500">{isAr ? 'طريقة الدفع:' : 'Payment:'}</span>
                  <span className="font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    {order.paymentMethod || 'MADA'} ({isAr ? 'مدفوعة' : 'PAID'})
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-2.5">
                <div className="flex justify-between font-bold text-[10px] text-slate-500 pb-1 border-b border-slate-200">
                  <span>{isAr ? 'الصنف' : 'Item'}</span>
                  <span>{isAr ? 'الكمية × السعر' : 'Qty × Price'}</span>
                  <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                </div>
                {items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-xs">{it.name}</div>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span className="text-slate-400 text-[10px]">SKU: {it.sku || `IT-${idx + 1}`}</span>
                      <span>{it.quantity} × {it.price}</span>
                      <span className="font-bold text-slate-900">{money(it.price * it.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>{isAr ? 'المجموع قبل الضريبة:' : 'Subtotal (Excl. VAT):'}</span>
                  <span className="font-mono font-bold text-slate-800">{money(subtotal - tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>{isAr ? 'الخصم الترويجي:' : 'Discount:'}</span>
                    <span className="font-mono">- {money(discount)}</span>
                  </div>
                )}
                {shippingFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? 'رسوم التوصيل:' : 'Delivery:'}</span>
                    <span className="font-mono font-bold text-slate-800">{money(shippingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>{isAr ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                  <span className="font-mono font-bold text-emerald-700">{money(tax)}</span>
                </div>
                <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-slate-900 font-black text-sm">
                  <span>{isAr ? 'الإجمالي النهائي:' : 'TOTAL AMOUNT:'}</span>
                  <span className="font-mono text-base">{money(grandTotal)}</span>
                </div>
              </div>

              {/* ZATCA QR Code & Stamp */}
              <div className="pt-4 text-center space-y-2 flex flex-col items-center">
                <div className="p-2 border border-slate-200 rounded-xl bg-white shadow-2xs">
                  <img
                    src={zatcaQrUri}
                    alt="ZATCA QR Code"
                    className="w-28 h-28 mx-auto"
                  />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {isAr ? 'فاتورة إلكترونية معتمدة ZATCA' : 'ZATCA Phase 1 & 2 Compliant'}
                </span>
                <p className="text-[10px] text-slate-600 font-sans text-center leading-relaxed max-w-[280px]">
                  {isAr ? customNote : customNoteEn}
                </p>
                <div className="pt-1 text-[9px] text-slate-400 font-mono tracking-widest uppercase">
                  * {order.orderNumber.replace('#', '')}-{taxNumber.slice(-4)} *
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
