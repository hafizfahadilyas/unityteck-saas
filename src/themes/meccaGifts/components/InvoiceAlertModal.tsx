import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Printer, MessageCircle, CheckCircle, ShieldCheck, Download } from 'lucide-react';
import { MECCA_LOGO, MECCA_WHATSAPP } from '../data/mockData';

export const InvoiceAlertModal: React.FC = () => {
  const { language, lastOrder, showInvoiceModal, setShowInvoiceModal } = useApp();
  const isAr = language === 'ar';

  if (!showInvoiceModal || !lastOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = isAr
      ? `فاتورة طلب هدايا مكة رقم: *${lastOrder.orderId}*\nالمستلم: ${lastOrder.recipientName}\nالمدينة: ${lastOrder.city}\nالمبلغ الإجمالي: ${lastOrder.total} ر.س شامل الضريبة.\nشكراً لاختياركم هدايا مكة.`
      : `Hadaya Mecca Invoice #${lastOrder.orderId} - Total: ${lastOrder.total} SAR.`;
    window.open(`https://wa.me/${MECCA_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const vatAmount = (lastOrder.total * 0.15 / 1.15).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#e8e4dc] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="bg-[#102a1c] text-[#FAF9F5] p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={MECCA_LOGO}
              alt="Mecca Gifts Logo"
              className="h-10 w-auto object-contain filter brightness-110"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-base font-bold font-serif">
                {isAr ? 'فاتورة ضريبية رسمية مبسطة' : 'Official Simplified Tax Invoice'}
              </h3>
              <p className="text-[11px] text-[#e6ca98] font-mono">
                {isAr ? 'متجر هدايا مكة للزهور الفاخرة' : 'Hadaya Mecca Gifts and Flowers'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowInvoiceModal(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invoice Body */}
        <div className="p-6 sm:p-8 space-y-6 text-xs text-[#333]">
          
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF9F5] border border-[#e8e4dc]">
            <div>
              <span className="text-[#8c8275] block">{isAr ? 'رقم الفاتورة:' : 'Invoice No:'}</span>
              <span className="font-mono font-bold text-sm text-[#102a1c]">{lastOrder.orderId}</span>
            </div>
            <div>
              <span className="text-[#8c8275] block">{isAr ? 'تاريخ الإصدار:' : 'Date:'}</span>
              <span className="font-bold text-[#102a1c]">{lastOrder.date}</span>
            </div>
            <div>
              <span className="text-[#8c8275] block">{isAr ? 'الرقم الضريبي:' : 'VAT No:'}</span>
              <span className="font-mono font-bold text-[#102a1c]">314853306700003</span>
            </div>
            <div>
              <span className="text-[#8c8275] block">{isAr ? 'توثيق المنصة:' : 'Platform Reg:'}</span>
              <span className="font-bold text-[#2ecc71]">0000197484 ✓</span>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#e8e4dc] space-y-1">
            <span className="font-bold text-[#102a1c] block mb-1">
              {isAr ? 'تفاصيل التوصيل والمستلم:' : 'Delivery & Recipient Details:'}
            </span>
            <p><span className="text-[#8c8275]">{isAr ? 'المستلم:' : 'Recipient:'}</span> {lastOrder.recipientName} ({lastOrder.recipientPhone})</p>
            <p><span className="text-[#8c8275]">{isAr ? 'العنوان:' : 'Address:'}</span> {lastOrder.city} - {lastOrder.address}</p>
            <p><span className="text-[#8c8275]">{isAr ? 'فترة التوصيل:' : 'Slot:'}</span> {lastOrder.deliveryDate} - {lastOrder.deliveryTimeSlot}</p>
          </div>

          {/* Itemized Table */}
          <div className="border border-[#e8e4dc] rounded-2xl overflow-hidden">
            <table className="w-full text-start">
              <thead className="bg-[#f2efe6] text-[#102a1c] font-bold text-[11px]">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'المنتج / التنسيق' : 'Item Description'}</th>
                  <th className="p-3 text-center">{isAr ? 'الحجم' : 'Size'}</th>
                  <th className="p-3 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                  <th className="p-3 text-end">{isAr ? 'السعر' : 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ede6]">
                {lastOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 flex items-center gap-2.5">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#e8e4dc]"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="font-bold text-[#1a1f1b] block">{isAr ? item.product.name : item.product.nameEn}</span>
                        {item.addons.length > 0 && (
                          <span className="text-[10px] text-[#8c8275]">
                            +{item.addons.map((a) => (isAr ? a.name : a.nameEn)).join(', ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center text-[#555]">{item.selectedSize}</td>
                    <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="p-3 text-end font-mono font-bold text-[#102a1c]">
                      {(item.product.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity} {isAr ? 'ر.س' : 'SAR'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Breakdown Totals */}
          <div className="space-y-1.5 pt-2 text-xs border-t border-[#f0ede6]">
            <div className="flex justify-between">
              <span className="text-[#666]">{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span className="font-mono font-semibold">{lastOrder.subtotal} {isAr ? 'ر.س' : 'SAR'}</span>
            </div>
            {lastOrder.discount > 0 && (
              <div className="flex justify-between text-[#8b263e]">
                <span>{isAr ? 'الخصم الترويجي:' : 'Discount:'}</span>
                <span className="font-mono font-semibold">-{lastOrder.discount} {isAr ? 'ر.س' : 'SAR'}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#666]">{isAr ? 'رسوم التوصيل المبرد:' : 'Delivery:'}</span>
              <span className="font-mono font-semibold">
                {lastOrder.shipping === 0 ? (isAr ? 'مجاني' : 'Free') : `${lastOrder.shipping} SAR`}
              </span>
            </div>
            <div className="flex justify-between text-[#8c8275] text-[11px]">
              <span>{isAr ? 'منها ضريبة القيمة المضافة (15%):' : 'VAT (15% Included):'}</span>
              <span className="font-mono">{vatAmount} {isAr ? 'ر.س' : 'SAR'}</span>
            </div>
            <div className="pt-2 border-t border-[#102a1c] flex justify-between text-base font-bold text-[#102a1c]">
              <span>{isAr ? 'المبلغ الإجمالي المستحق:' : 'Total Amount:'}</span>
              <span className="font-mono text-lg">{lastOrder.total} {isAr ? 'ر.س' : 'SAR'}</span>
            </div>
          </div>

          {/* ZATCA Official Stamp & QR Code */}
          <div className="pt-4 border-t border-dashed border-[#d6cfc0] flex items-center justify-between gap-4">
            <div className="space-y-1 text-[11px] text-[#8c8275]">
              <div className="flex items-center gap-1.5 font-bold text-[#102a1c]">
                <ShieldCheck className="w-4 h-4 text-[#102a1c]" />
                <span>{isAr ? 'فاتورة إلكترونية معتمدة من هيئة الزكاة والضريبة والجمارك' : 'ZATCA Certified Electronic Tax Invoice'}</span>
              </div>
              <p className="text-[10px] text-[#666]">
                {isAr ? 'شكراً لاختياركم هدايا مكة. نحرص على تقديم أرقى المنتجات بأعلى معايير الجودة.' : 'Thank you for choosing Mecca Luxury Gifts. Premium quality guaranteed.'}
              </p>
            </div>
            <div className="p-1 rounded-xl border border-[#d6cfc0] bg-white shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=ZATCA-E-INVOICE-${lastOrder.orderId}-314853306700003-TOTAL-${lastOrder.total}&margin=2`}
                alt="ZATCA QR"
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-[#FAF9F5] p-5 border-t border-[#e8e4dc] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl border border-[#d6cfc0] bg-white hover:bg-[#102a1c] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>{isAr ? 'إرسال للواتساب' : 'Send to WhatsApp'}</span>
            </button>
          </div>

          <button
            onClick={() => setShowInvoiceModal(false)}
            className="px-5 py-2 rounded-xl bg-[#102a1c] text-[#FAF9F5] hover:bg-[#1a3f2b] text-xs font-bold transition-colors"
          >
            {isAr ? 'إغلاق الفاتورة' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
