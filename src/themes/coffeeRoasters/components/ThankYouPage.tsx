import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  CheckCircle2,
  Package,
  Share2,
  Download,
  ArrowRight,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  Copy,
  Check,
  Coffee,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

import { useTenant } from '../../../context/TenantContext';

export const ThankYouPage: React.FC = () => {
  const { lastOrder, navigateTo, language, showToast } = useCart();
  const { activeStore, currentOrders } = useTenant();
  const [copied, setCopied] = useState(false);

  // Authentic order resolution: real session order > real store recent order > null
  const order = lastOrder || (currentOrders && currentOrders.length > 0 ? {
    id: currentOrders[0].orderNumber || currentOrders[0].id,
    orderNumber: currentOrders[0].orderNumber || currentOrders[0].id,
    date: currentOrders[0].date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    items: (currentOrders[0].items || []).map((it: any) => ({
      id: it.id || 'item',
      productId: it.sku || it.id,
      productName: it.name,
      unitPrice: it.price || 0,
      quantity: it.quantity || 1,
      image: it.image || '/src/assets/images/hibrew_h7a_flagship_machine.png',
      selectedColor: { name: 'Standard', nameAr: 'قياسي', hex: '#333', image: it.image || '' },
      selectedStorage: { capacity: 'Standard', ram: '', priceDelta: 0 },
    })),
    total: currentOrders[0].total || 0,
    paymentMethod: String(currentOrders[0].paymentMethod || 'mada'),
    shippingAddress: {
      name: currentOrders[0].customerName || (language === 'AR' ? 'عميل المتجر' : 'Store Customer'),
      phone: currentOrders[0].customerPhone || '',
      city: currentOrders[0].deliveryLocation || '',
      district: '',
      street: '',
    },
    status: currentOrders[0].status || 'Confirmed'
  } : null);

  const handleCopyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    showToast(language === 'AR' ? 'تم نسخ رقم الطلب!' : 'Order ID copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const storeName = activeStore?.name || (language === 'AR' ? 'متجر القهوة المختصة' : 'Specialty Coffee Store');

  const shareViaWhatsApp = () => {
    if (!order) return;
    const itemsList = order.items
      .map(
        i =>
          `• ${i.productName} (${language === 'AR' && i.selectedColor.nameAr ? i.selectedColor.nameAr : i.selectedColor.name}) x${i.quantity} = ${language === 'AR' ? `${(i.unitPrice * i.quantity).toLocaleString()}.00 ر.س` : `SAR ${(i.unitPrice * i.quantity).toLocaleString()}`}`
      )
      .join('\n');

    const message =
      language === 'AR'
        ? `☕ *فاتورة ${storeName} الرسمية* 🇸🇦\n\n` +
          `📦 *رقم الطلب:* ${order.orderNumber}\n` +
          `📅 *التاريخ:* ${order.date}\n` +
          `👤 *العميل:* ${order.shippingAddress.name}\n` +
          `📱 *الجوال:* ${order.shippingAddress.phone}\n` +
          `📍 *المدينة:* ${order.shippingAddress.city}\n\n` +
          `🛒 *تفاصيل المنتجات:*\n${itemsList}\n\n` +
          `💳 *طريقة الدفع:* ${order.paymentMethod.toUpperCase()}\n` +
          `💰 *المجموع الإجمالي:* ${order.total.toLocaleString()}.00 ر.س (شامل الضريبة 15%)\n` +
          `🚚 *الشحن:* فوري لكافة مدن المملكة\n` +
          `🛡️ *الضمان:* سنتين شامل الوكيل المعتمد بالسعودية\n\n` +
          `شكراً لتسوقك من ${storeName}!`
        : `☕ *Official ${storeName} Store Invoice* 🇸🇦\n\n` +
          `📦 *Order ID:* ${order.orderNumber}\n` +
          `📅 *Date:* ${order.date}\n` +
          `👤 *Customer:* ${order.shippingAddress.name}\n` +
          `📱 *Mobile:* ${order.shippingAddress.phone}\n` +
          `📍 *Destination:* ${order.shippingAddress.city}\n\n` +
          `🛒 *Items:*\n${itemsList}\n\n` +
          `💳 *Payment:* ${order.paymentMethod.toUpperCase()}\n` +
          `💰 *Total Amount:* SAR ${order.total.toLocaleString()}.00 (15% VAT included)\n` +
          `🚚 *Delivery:* Express Doorstep Delivery across KSA\n` +
          `🛡️ *Warranty:* 2-Year Official Agency Warranty\n\n` +
          `Thank you for choosing ${storeName}!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-[#F8F9FA]">
        <Package className="w-16 h-16 text-neutral-400 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          {language === 'AR' ? 'لا يوجد طلب حديث لعرضه' : 'No Recent Order Found'}
        </h2>
        <p className="text-xs text-neutral-500 mb-6 max-w-sm">
          {language === 'AR' ? 'لم يتم العثور على تفاصيل طلب في جلستك الحالية. يمكنك تصفح المنتجات وإجراء طلبك الآن.' : 'No active order details were found in your current session. Browse our catalog and place your order.'}
        </p>
        <button
          onClick={() => navigateTo('products')}
          className="px-6 py-2.5 bg-black text-white text-xs font-bold rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {language === 'AR' ? 'تصفح المنتجات' : 'Browse Products'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 sm:py-12 text-start text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6">
        {/* Success Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-neutral-100 text-center space-y-4 mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold inline-block">
              {language === 'AR' ? 'تم تأكيد طلبك بنجاح' : 'Order Confirmed'}
            </span>
            <h1 className={`honor-heading text-2xl sm:text-4xl font-extrabold text-neutral-950 ${
              language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
            }`}>
              {language === 'AR' ? 'شكراً لطلبك من هاي برو السعودية!' : 'Thank You for Your Order!'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto leading-relaxed">
              {language === 'AR'
                ? `تم استلام طلبك وجاري تجهيزه للشحن السريع. تم إرسال رسالة نصية وبريد إلكتروني برقم التتبع والتفاصيل.`
                : `Your order has been received and is being prepared for express delivery. We've sent confirmation to your email and phone.`}
            </p>
          </div>

          {/* Quick Actions Header: WhatsApp & Print */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={shareViaWhatsApp}
              className="px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>{language === 'AR' ? 'مشاركة الفاتورة عبر واتساب' : 'Share Invoice on WhatsApp'}</span>
            </button>

            <button
              onClick={handlePrintInvoice}
              className="px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'AR' ? 'طباعة أو تحميل الفاتورة' : 'Print / Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Detailed Invoice Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-neutral-100 space-y-8">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
            <div>
              <div className="text-2xl font-black tracking-tighter text-black uppercase">
                {language === 'AR' ? 'هايبرو' : 'HIBREW'}{' '}
                <span className="text-xs font-semibold text-neutral-500 tracking-normal">
                  {language === 'AR' ? 'المتجر الرسمي بالمملكة' : 'KSA OFFICIAL'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {language === 'AR' ? 'المتجر الرسمي المعتمد لمكائن ومستلزمات القهوة بالمملكة' : 'Official Authorized Coffee Equipment Store KSA'}
              </p>
            </div>

            <div className="text-start sm:text-end space-y-1">
              <div className="flex items-center sm:justify-end gap-2">
                <span className="text-xs text-neutral-500">{language === 'AR' ? 'رقم الفاتورة:' : 'Invoice No:'}</span>
                <span className="font-mono font-black text-sm text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                  {order.orderNumber}
                </span>
                <button
                  onClick={handleCopyOrderId}
                  className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer"
                  title="Copy ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5 text-xs text-neutral-500 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>{order.date}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-[#F8F9FA] text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                <MapPin className="w-4 h-4 text-neutral-700" />
                <span>{language === 'AR' ? 'عنوان التوصيل' : 'Delivery Address'}</span>
              </div>
              <div className="space-y-0.5 text-neutral-600">
                <p className="font-semibold text-neutral-900">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.city} - {order.shippingAddress.district}</p>
                <p>{order.shippingAddress.street}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                <CreditCard className="w-4 h-4 text-neutral-700" />
                <span>{language === 'AR' ? 'طريقة الدفع والشحن' : 'Payment & Delivery Mode'}</span>
              </div>
              <div className="space-y-0.5 text-neutral-600">
                <p>
                  <span className="text-neutral-500">{language === 'AR' ? 'الدفع:' : 'Payment:'}</span>{' '}
                  <span className="font-bold text-neutral-900 uppercase">{order.paymentMethod}</span>
                </p>
                <p>
                  <span className="text-neutral-500">{language === 'AR' ? 'الشحن:' : 'Delivery:'}</span>{' '}
                  <span className="font-semibold text-emerald-700">{language === 'AR' ? 'شحن فوري مجاني (24-48 ساعة)' : 'Free Express (24-48h)'}</span>
                </p>
                <p>
                  <span className="text-neutral-500">{language === 'AR' ? 'الضمان:' : 'Warranty:'}</span>{' '}
                  <span className="font-semibold text-neutral-900">{language === 'AR' ? 'سنتين شامل الوكيل المعتمد' : '2-Year Official Agency'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Purchased Items Table */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-neutral-900">
              {language === 'AR' ? 'تفاصيل المنتجات المطلوبة' : 'Purchased Items'}
            </h3>

            <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-14 h-14 object-contain rounded-xl bg-[#F8F9FA] p-1.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        {language === 'AR' && item.selectedColor.nameAr ? item.selectedColor.nameAr : item.selectedColor.name} · {item.selectedStorage.capacity}
                      </p>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {item.quantity} x {language === 'AR' ? `${item.unitPrice.toLocaleString()}.00 ر.س` : `SAR ${item.unitPrice.toLocaleString()}.00`}
                      </span>
                    </div>
                  </div>

                  <div className="text-end shrink-0">
                    <span className="font-mono font-bold text-sm text-neutral-900">
                      {language === 'AR' ? `${(item.unitPrice * item.quantity).toLocaleString()}.00 ر.س` : `SAR ${(item.unitPrice * item.quantity).toLocaleString()}.00`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Breakdown */}
          <div className="p-5 rounded-2xl bg-[#F8F9FA] space-y-2 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>{language === 'AR' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span className="font-mono font-semibold text-neutral-900">
                {language === 'AR' ? `${order.total.toLocaleString()}.00 ر.س` : `SAR ${order.total.toLocaleString()}.00`}
              </span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>{language === 'AR' ? 'ضريبة القيمة المضافة (15% مشمولة):' : 'VAT (15% inclusive):'}</span>
              <span className="font-mono font-semibold text-neutral-900">
                {language === 'AR' ? `${Math.round((order.total * 0.15) / 1.15).toLocaleString()}.00 ر.س` : `SAR ${Math.round((order.total * 0.15) / 1.15).toLocaleString()}.00`}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>{language === 'AR' ? 'رسوم الشحن والتوصيل:' : 'Delivery Fee:'}</span>
              <span>{language === 'AR' ? 'مجاني' : 'FREE'}</span>
            </div>
            <div className="border-t border-neutral-200 pt-2 flex justify-between items-baseline text-base font-extrabold text-neutral-950">
              <span>{language === 'AR' ? 'المجموع الكلي المدفوع:' : 'Total Amount Paid:'}</span>
              <span className="font-mono text-xl">
                {language === 'AR' ? `${order.total.toLocaleString()}.00 ر.س` : `SAR ${order.total.toLocaleString()}.00`}
              </span>
            </div>
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100">
            <button
              onClick={() => navigateTo('profile')}
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-neutral-300 hover:border-black text-xs font-bold text-neutral-900 transition-colors cursor-pointer text-center"
            >
              {language === 'AR' ? 'عرض حسابي وسجل الطلبات' : 'View Profile & Orders'}
            </button>

            <button
              onClick={() => navigateTo('home')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-95"
            >
              <span>{language === 'AR' ? 'متابعة التسوق' : 'Continue Shopping'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
