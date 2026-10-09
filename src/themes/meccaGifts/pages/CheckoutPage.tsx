import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Gift,
  MapPin,
  Calendar,
  Clock,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Tag,
  Sparkles
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const {
    language,
    cart,
    cartSubtotal,
    freeShippingRemaining,
    placeOrder,
    setCurrentPage,
    user,
    loginWithGoogle,
    appliedCoupon,
    appliedDiscount,
    applyCouponCode,
    removeAppliedCoupon
  } = useApp();

  const isAr = language === 'ar';
  const [promoCode, setPromoCode] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ msg: string; isError: boolean } | null>(null);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoFeedback(null);
    const res = applyCouponCode(promoCode);
    setPromoFeedback({ msg: res.message, isError: !res.success });
    if (res.success) setPromoCode('');
  };

  // Checkout form state
  const [recipientName, setRecipientName] = useState('سارة السالم');
  const [recipientPhone, setRecipientPhone] = useState('+966 50 123 4567');
  const [city, setCity] = useState('مكة المكرمة');
  const [district, setDistrict] = useState('حي العوالي');
  const [streetAddress, setStreetAddress] = useState('شارع إبراهيم الجفالي، فيلا 12');
  const [isAnonymousSender, setIsAnonymousSender] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('اليوم (توصيل فوري)');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('توصيل عاجل خلال 60 دقيقة');
  const [cardMessage, setCardMessage] = useState('ألف مبروك الترقية المباركة ومنها للأعلى دائماً يا غالية');
  const [paymentMethod, setPaymentMethod] = useState('mada');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shipping = freeShippingRemaining === 0 ? 0 : 35;
  const total = Math.max(0, cartSubtotal + shipping - appliedDiscount);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      placeOrder({
        recipientName,
        recipientPhone,
        city,
        address: `${district} - ${streetAddress}`,
        deliveryDate,
        deliveryTimeSlot,
        isAnonymousSender,
        paymentMethod: paymentMethod === 'mada' ? 'مدى (Mada)' : paymentMethod === 'applepay' ? 'Apple Pay' : paymentMethod === 'tabby' ? 'تابي (Tabby)' : 'الدفع عند الاستلام',
        cardMessage,
        discount: appliedDiscount
      });
      setIsSubmitting(false);
    }, 800);
  };

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto px-4">
        <h2 className="text-xl font-bold font-serif text-[#102a1c]">
          {isAr ? 'لا توجد منتجات في السلة لإتمام الطلب' : 'Your cart is empty'}
        </h2>
        <button
          onClick={() => setCurrentPage('catalog')}
          className="mt-4 px-6 py-2.5 rounded-full bg-[#102a1c] text-[#FAF9F5] text-xs font-bold cursor-pointer"
        >
          {isAr ? 'العودة للتسوق' : 'Continue Shopping'}
        </button>
      </div>
    );
  }

  const [isGuestCheckout, setIsGuestCheckout] = useState(false);

  // Protect checkout: If not logged in and didn't opt for guest checkout, show fast sign-in with option to continue as guest
  if (!user.isLoggedIn && !isGuestCheckout) {
    return (
      <div className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-md mx-auto text-center">
        <div className="bg-white rounded-3xl p-8 border border-[#e8e4dc] shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-[#102a1c] text-[#e6ca98] mx-auto flex items-center justify-center shadow-md">
            <Lock className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-[#102a1c]">
              {isAr ? 'تسجيل الدخول أو المتابعة كزائر' : 'Sign In or Continue as Guest'}
            </h2>
            <p className="text-xs text-[#8c8275] mt-2 leading-relaxed">
              {isAr
                ? 'سجّل دخولك السريع بحساب Google لحفظ وتتبع طلبك وجمع نقاط المكافآت، أو تابع كزائر لإتمام الطلب فوراً'
                : 'Sign in with Google to save & track your order, or continue directly as a guest.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loginWithGoogle()}
            className="w-full py-3.5 px-4 rounded-2xl border-2 border-[#e8e4dc] hover:border-[#4285F4] bg-white hover:bg-gray-50 flex items-center justify-center gap-3 transition-all duration-200 shadow-sm font-bold text-sm cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.26 21.36 7.36 24 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z" />
            </svg>
            <span className="text-[#333] font-bold">
              {isAr ? 'الدخول السريع بحساب Google' : 'Continue with Google'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsGuestCheckout(true)}
            className="w-full py-3 px-4 rounded-2xl bg-[#102a1c] hover:bg-[#1a3f2b] text-[#FAF9F5] text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {isAr ? 'المتابعة كزائر دون تسجيل دخول ←' : 'Continue as Guest ←'}
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('cart')}
            className="text-xs text-[#8c8275] hover:text-[#102a1c] font-medium block mx-auto underline cursor-pointer"
          >
            {isAr ? 'العودة إلى سلة المشتريات' : 'Back to Shopping Bag'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
          {isAr ? 'إتمام طلب الهدية' : 'Checkout & Delivery Details'}
        </h1>
        <p className="text-xs sm:text-sm text-[#7a7164] mt-1">
          {isAr
            ? 'خطوة واحدة بسيطة لتوصيل هديتك الاستثنائية بكل فخامة وسرية'
            : 'One effortless step to dispatch your royal gift with supreme discretion'}
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Main Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Recipient Information */}
          <div className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f0ede6]">
              <MapPin className="w-5 h-5 text-[#102a1c]" />
              <h3 className="text-base font-bold text-[#102a1c]">
                {isAr ? '1. بيانات مستلم الهدية والعنوان' : '1. Recipient & Destination Details'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#1a1f1b] block mb-1">
                  {isAr ? 'اسم المستلم الكريم *' : 'Recipient Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3.5 py-2.5 text-xs text-[#1a1f1b] focus:outline-none focus:border-[#102a1c]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1a1f1b] block mb-1">
                  {isAr ? 'رقم جوال المستلم للتنسيق *' : 'Recipient Phone Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  dir="ltr"
                  className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3.5 py-2.5 text-xs text-[#1a1f1b] focus:outline-none focus:border-[#102a1c]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1a1f1b] block mb-1">
                  {isAr ? 'المدينة *' : 'City *'}
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3.5 py-2.5 text-xs text-[#1a1f1b] focus:outline-none focus:border-[#102a1c]"
                >
                  <option value="مكة المكرمة">{isAr ? 'مكة المكرمة (توصيل فوري 60 دقيقة)' : 'Mecca (1-hr express)'}</option>
                  <option value="جدة">{isAr ? 'جدة (توصيل نفس اليوم)' : 'Jeddah (Same-day)'}</option>
                  <option value="الرياض">{isAr ? 'الرياض (شحن مبرد فاخر)' : 'Riyadh (Refrigerated)'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1a1f1b] block mb-1">
                  {isAr ? 'الحي *' : 'District *'}
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3.5 py-2.5 text-xs text-[#1a1f1b] focus:outline-none focus:border-[#102a1c]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1a1f1b] block mb-1">
                {isAr ? 'تفاصيل العنوان / المعلم البارز' : 'Street & Villa / Landmark Details'}
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3.5 py-2.5 text-xs text-[#1a1f1b] focus:outline-none focus:border-[#102a1c]"
              />
            </div>

            {/* Anonymous sender checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#efebe1] border border-[#ded8cb] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymousSender}
                  onChange={(e) => setIsAnonymousSender(e.target.checked)}
                  className="w-4 h-4 accent-[#102a1c] rounded"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-[#102a1c] block">
                    {isAr ? 'إرسال كهدية مجهولة الهوية (مفاجأة سرية)' : 'Send Anonymously (Secret Surprise)'}
                  </span>
                  <span className="text-[11px] text-[#7a7164]">
                    {isAr
                      ? 'لن يتم الإفصاح عن اسمك أو رقمك للمستلم نهائياً عند التوصيل.'
                      : 'Your name and contact details will remain completely confidential from the recipient.'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Delivery Date & Slot */}
          <div className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f0ede6]">
              <Clock className="w-5 h-5 text-[#102a1c]" />
              <h3 className="text-base font-bold text-[#102a1c]">
                {isAr ? '2. موعد وفترة التوصيل' : '2. Delivery Time Slot'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'express', title: isAr ? 'توصيل عاجل خلال ساعة' : '1-Hour Express Delivery', sub: isAr ? 'أسرع خدمة في مكة' : 'Fastest in Mecca' },
                { id: 'tonight', title: isAr ? 'الليلة (6:00 م - 10:00 م)' : 'Tonight (6:00 PM - 10:00 PM)', sub: isAr ? 'الأفضل للمفاجآت المنزلية' : 'Ideal for home surprises' },
                { id: 'tomorrow-morning', title: isAr ? 'صباح الغد (9:00 ص - 1:00 م)' : 'Tomorrow Morning (9 AM - 1 PM)', sub: isAr ? 'مناسب لبيئة العمل' : 'Perfect for office delivery' },
                { id: 'custom', title: isAr ? 'تحديد موعد مسبق محدد' : 'Pre-scheduled Date', sub: isAr ? 'احجز مناسبتك مقدماً' : 'Book ahead for event' },
              ].map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => setDeliveryTimeSlot(slot.title)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    deliveryTimeSlot === slot.title
                      ? 'border-[#102a1c] bg-[#102a1c]/5 font-semibold ring-1 ring-[#102a1c]'
                      : 'border-[#d6cfc0] bg-white hover:border-[#102a1c]/40'
                  }`}
                >
                  <p className="text-xs font-bold text-[#102a1c]">{slot.title}</p>
                  <p className="text-[11px] text-[#7a7164] mt-0.5">{slot.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f0ede6]">
              <CreditCard className="w-5 h-5 text-[#102a1c]" />
              <h3 className="text-base font-bold text-[#102a1c]">
                {isAr ? '3. وسيلة الدفع الآمنة' : '3. Secure Payment Method'}
              </h3>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'mada', name: isAr ? 'بطاقة مدى البنكية (Mada)' : 'Mada Debit Card', badge: isAr ? 'الأكثر استخداماً' : 'Most Popular' },
                { id: 'applepay', name: 'Apple Pay', badge: isAr ? 'دفع فوري سريع' : 'Instant' },
                { id: 'tabby', name: isAr ? 'تابي - قسّم فاتورتك على 4 دفعات (0% فوائد)' : 'Tabby - Split in 4 (0% interest)', badge: '0% Interest' },
                { id: 'cod', name: isAr ? 'الدفع عند الاستلام (داخل مكة فقط)' : 'Cash on Delivery (Mecca only)', badge: isAr ? 'نقدي' : 'Cash' },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === method.id
                      ? 'border-[#102a1c] bg-[#102a1c]/5 font-semibold ring-1 ring-[#102a1c]'
                      : 'border-[#d6cfc0] bg-white hover:border-[#102a1c]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="w-4 h-4 accent-[#102a1c]"
                    />
                    <span className="text-xs font-bold text-[#1a1f1b]">{method.name}</span>
                  </div>
                  <span className="text-[10px] bg-[#f0ede6] text-[#102a1c] font-bold px-2 py-0.5 rounded-full">
                    {method.badge}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#7a7164] pt-2">
              <Lock className="w-3.5 h-3.5 text-[#102a1c]" />
              <span>{isAr ? 'جميع المعاملات مشفرة ومحمية بنظام أمان 256-bit SSL' : 'All transactions are 256-bit SSL encrypted.'}</span>
            </div>
          </div>

        </div>

        {/* Order Summary Sidebar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-6 sm:p-7 shadow-sm sticky top-28 space-y-5">
            <h3 className="text-base font-bold text-[#102a1c] font-serif pb-3 border-b border-[#f0ede6]">
              {isAr ? 'ملخص الطلب' : 'Order Summary'}
            </h3>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-[#f0ede6]">
              {cart.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.product.image}
                      alt={isAr ? item.product.name : item.product.nameEn}
                      className="w-12 h-12 rounded-xl object-cover border border-[#e2ddd1]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="font-bold text-[#1a1f1b] line-clamp-1">{isAr ? item.product.name : item.product.nameEn}</p>
                      <p className="text-[11px] text-[#7a7164]">{item.selectedSize} × {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#102a1c]">
                    {(item.product.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity} {isAr ? 'ر.س' : 'SAR'}
                  </span>
                </div>
              ))}
            </div>

            {/* Promo Code Section */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <Tag className="w-4 h-4" />
                  <span>
                    {appliedCoupon.code} (
                    {appliedCoupon.discountType === 'percentage'
                      ? `${appliedCoupon.discountValue}% OFF`
                      : `${appliedCoupon.discountValue} SAR`}
                    )
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeAppliedCoupon}
                  className="text-[11px] text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Remove'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder={isAr ? 'كود الخصم (مثل MAKKAH15)' : 'Coupon Code (e.g. MAKKAH15)'}
                    className="flex-1 bg-white border border-[#d6cfc0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#102a1c] uppercase font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-[#102a1c] hover:bg-[#1a3f2b] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isAr ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
                {promoFeedback && (
                  <p
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      promoFeedback.isError ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{promoFeedback.msg}</span>
                  </p>
                )}
              </div>
            )}

            {/* Calculations */}
            <div className="pt-3 border-t border-[#f0ede6] space-y-2 text-xs text-[#555]">
              <div className="flex justify-between">
                <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span className="font-mono font-medium">{cartSubtotal} {isAr ? 'ر.س' : 'SAR'}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-[#8b263e] font-semibold">
                  <span>{isAr ? 'خصم الكوبون:' : 'Coupon Discount:'}</span>
                  <span className="font-mono">-{appliedDiscount} {isAr ? 'ر.س' : 'SAR'}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{isAr ? 'رسوم التوصيل المبرد السريع:' : 'Express Delivery:'}</span>
                <span className="font-mono font-medium">
                  {shipping === 0 ? (
                    <span className="text-[#102a1c] font-bold">{isAr ? 'مجاني' : 'Free'}</span>
                  ) : (
                    `${shipping} ${isAr ? 'ر.س' : 'SAR'}`
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-[#e2ddd1] flex justify-between text-base font-bold text-[#102a1c]">
                <span>{isAr ? 'المبلغ الإجمالي المستحق:' : 'Total Payable:'}</span>
                <span className="font-mono text-lg">{total} {isAr ? 'ر.س' : 'SAR'}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-full bg-[#102a1c] hover:bg-[#1a3f2b] active:scale-98 text-[#FAF9F5] text-sm font-bold flex items-center justify-center gap-2 shadow-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>{isAr ? 'جاري تأكيد وتجهيز الطلب...' : 'Processing your order...'}</span>
              ) : (
                <>
                  <span>{isAr ? `تأكيد الطلب والدفع (${total} ر.س)` : `Confirm & Place Order (${total} SAR)`}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>

            {/* Peace of Mind */}
            <div className="p-3 bg-[#efebe1] rounded-2xl text-[11px] text-[#555] space-y-1">
              <p className="font-bold text-[#102a1c]">{isAr ? 'خدمة عملاء VIP فورية:' : 'VIP Florist Assistance:'}</p>
              <p>{isAr ? 'سيصلك إشعار عبر الواتساب فور استلام الباقة وخروج مندوبنا الملكي.' : 'WhatsApp notifications will update you as soon as the bouquet departs.'}</p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
