import React from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  Package,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export const ThankYouPage: React.FC = () => {
  const { language, lastOrder, setCurrentPage } = useApp();
  const isAr = language === 'ar';

  const order = lastOrder;

  if (!order) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto px-4">
        <h2 className="text-xl font-bold font-serif text-[#102a1c]">
          {isAr ? 'لم يتم العثور على طلب أخير' : 'No recent order found'}
        </h2>
        <button
          onClick={() => setCurrentPage('home')}
          className="mt-4 px-6 py-2.5 rounded-full bg-[#102a1c] text-[#FAF9F5] text-xs font-bold"
        >
          {isAr ? 'العودة للرئيسية' : 'Return Home'}
        </button>
      </div>
    );
  }

  const steps = [
    { title: isAr ? 'تم استلام وتأكيد الطلب' : 'Order Confirmed', completed: true, active: false },
    { title: isAr ? 'جاري التنسيق بأنامل خبرائنا' : 'Master Florist Arranging', completed: true, active: true },
    { title: isAr ? 'خرج مع مندوب التوصيل المبرد' : 'Out for Express Delivery', completed: false, active: false },
    { title: isAr ? 'تم التسليم للمستلم الكريم' : 'Delivered with Royal Touch', completed: false, active: false },
  ];

  return (
    <div className="py-12 md:py-18 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Success Badge & Headline */}
      <div className="text-center space-y-3 mb-10">
        <div className="w-16 h-16 rounded-full bg-[#102a1c] text-[#e6ca98] flex items-center justify-center mx-auto shadow-lg animate-bounce">
          <CheckCircle className="w-8 h-8 stroke-[2]" />
        </div>

        <span className="text-xs uppercase tracking-widest text-[#8c8275] font-semibold">
          {isAr ? 'تم تأكيد طلبك بنجاح' : 'Order Confirmed Successfully'}
        </span>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-[#102a1c]">
          {isAr ? 'شكراً لاختيارك هدايا مكة' : 'Thank You for Choosing Hadaya Mecca'}
        </h1>

        <p className="text-xs sm:text-sm text-[#7a7164] max-w-md mx-auto">
          {isAr
            ? `رقم طلبك الخاص هو ${order.orderId}، وسيتولى خبير الزهور تجهيز باقتك الملكية حالاً.`
            : `Your order reference is ${order.orderId}. Our master florist has commenced crafting your royal arrangement.`}
        </p>
      </div>

      {/* Live Order Tracker Pipeline */}
      <div className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <h3 className="text-sm font-bold text-[#102a1c] font-serif mb-6 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#e6ca98]" />
          <span>{isAr ? 'متابعة حالة تجهيز وتوصيل الهدية' : 'Live Gift Preparation Tracker'}</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step.active
                    ? 'bg-[#102a1c] text-[#e6ca98] ring-4 ring-[#102a1c]/20'
                    : step.completed
                    ? 'bg-[#102a1c] text-white'
                    : 'bg-[#e5dfd3] text-[#8c8275]'
                }`}
              >
                {step.completed ? '✓' : idx + 1}
              </div>
              <p className="text-xs font-semibold text-[#1a1f1b] leading-tight">
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary & Destination Breakdown */}
      <div className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-6 sm:p-8 shadow-sm mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#f0ede6] gap-2">
          <div>
            <span className="text-xs text-[#8c8275]">{isAr ? 'رقم الطلب:' : 'Order ID:'}</span>
            <p className="text-base font-bold font-mono text-[#102a1c]">{order.orderId}</p>
          </div>
          <div>
            <span className="text-xs text-[#8c8275]">{isAr ? 'تاريخ ووقت التوصيل:' : 'Delivery Slot:'}</span>
            <p className="text-sm font-bold text-[#102a1c]">{order.deliveryDate} ({order.deliveryTimeSlot})</p>
          </div>
        </div>

        {/* Recipient details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#efebe1] p-4 rounded-2xl">
          <div>
            <span className="text-[#8c8275] block">{isAr ? 'المستلم الكريم:' : 'Recipient:'}</span>
            <p className="font-bold text-[#1a1f1b]">{order.recipientName} ({order.recipientPhone})</p>
          </div>
          <div>
            <span className="text-[#8c8275] block">{isAr ? 'عنوان التوصيل في مكة:' : 'Delivery Address:'}</span>
            <p className="font-bold text-[#1a1f1b]">{order.city} - {order.address}</p>
          </div>
          {order.cardMessage && (
            <div className="sm:col-span-2 pt-2 border-t border-[#ded8cb]">
              <span className="text-[#8c8275] block">{isAr ? 'نص بطاقة الإهداء الملكية:' : 'Greeting Card Note:'}</span>
              <p className="font-serif italic text-sm text-[#102a1c] mt-0.5">"{order.cardMessage}"</p>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-[#102a1c] uppercase tracking-wider">
            {isAr ? 'محتويات الطلب:' : 'Arrangements Included:'}
          </h4>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-[#f0ede6]">
              <div className="flex items-center gap-3">
                <img
                  src={item.product.image}
                  alt={isAr ? item.product.name : item.product.nameEn}
                  className="w-12 h-12 rounded-xl object-cover border border-[#e2ddd1]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="font-bold text-[#1a1f1b]">{isAr ? item.product.name : item.product.nameEn}</p>
                  <p className="text-[11px] text-[#7a7164]">{item.selectedSize} × {item.quantity}</p>
                </div>
              </div>
              <span className="font-mono font-bold text-[#102a1c]">
                {(item.product.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity} {isAr ? 'ر.س' : 'SAR'}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="pt-2 flex justify-between items-center text-base font-bold text-[#102a1c]">
          <span>{isAr ? 'المبلغ الإجمالي المدفوع:' : 'Total Amount Paid:'}</span>
          <span className="font-mono text-xl">{order.total} {isAr ? 'ر.س' : 'SAR'}</span>
        </div>
      </div>

      {/* Buttons: WhatsApp Concierge + CRM Portal */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href={`https://wa.me/966508894433?text=مرحباً، أود الاستفسار عن حالة طلبي رقم ${order.orderId}`}
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{isAr ? 'متابعة عبر واتساب مع المنسق' : 'Live WhatsApp Concierge'}</span>
        </a>

        <button
          onClick={() => {
            setCurrentPage('crm');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#102a1c] hover:bg-[#1a3f2b] text-[#FAF9F5] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <span>{isAr ? 'فتح بوابة العميل ومتابعة الطلب' : 'Open VIP Customer Portal'}</span>
          {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
