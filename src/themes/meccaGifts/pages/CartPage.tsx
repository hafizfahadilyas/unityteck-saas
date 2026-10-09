import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ArrowRight, Truck, Gift, Tag, Sparkles } from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    language,
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    freeShippingRemaining,
    setCurrentPage,
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

  const shipping = freeShippingRemaining === 0 ? 0 : 35;
  const total = Math.max(0, cartSubtotal - appliedDiscount + (cart.length > 0 ? shipping : 0));

  if (cart.length === 0) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4 space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#f0ede6] flex items-center justify-center mx-auto text-[#8c8275]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-[#102a1c]">
          {isAr ? 'حقيبة التسوق فارغة حالياً' : 'Your Shopping Bag is Empty'}
        </h2>
        <p className="text-xs text-[#7d7568]">
          {isAr ? 'اختر باقة استثنائية أو هدية ملكية لتسعد أحبائك' : 'Choose a bespoke floral arrangement to celebrate.'}
        </p>
        <button
          onClick={() => setCurrentPage('catalog')}
          className="px-7 py-3 rounded-full bg-[#102a1c] text-[#FAF9F5] text-xs font-bold shadow-md hover:bg-[#1a3f2b]"
        >
          {isAr ? 'تصفح باقات الزهور' : 'Explore Collections'}
        </button>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c] mb-8">
        {isAr ? 'حقيبة التسوق والهدايا' : 'Shopping Bag'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.product.image}
                  alt={isAr ? item.product.name : item.product.nameEn}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[#e2ddd1] shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#102a1c]">
                    {isAr ? item.product.name : item.product.nameEn}
                  </h3>
                  <p className="text-xs text-[#7a7164] mt-0.5">{item.selectedSize}</p>
                  {item.addons.length > 0 && (
                    <p className="text-[11px] text-[#102a1c] mt-1">
                      +{item.addons.map((a) => (isAr ? a.name : a.nameEn)).join(', ')}
                    </p>
                  )}
                  {item.cardMessage && (
                    <p className="text-[11px] text-[#8b263e] italic mt-1 line-clamp-1">"{item.cardMessage}"</p>
                  )}
                </div>
              </div>

              {/* Quantity and Price */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#f0ede6]">
                <div className="flex items-center border border-[#d6cfc0] rounded-full bg-white px-2 py-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 hover:bg-[#ede9df] rounded-full"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-xs">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 hover:bg-[#ede9df] rounded-full"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-end">
                  <span className="font-mono font-bold text-sm sm:text-base text-[#102a1c] block">
                    {(item.product.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity} {isAr ? 'ر.س' : 'SAR'}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-[11px] text-[#999] hover:text-[#8b263e] mt-1"
                  >
                    {isAr ? 'حذف' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-6 shadow-sm space-y-4 sticky top-28">
            <h3 className="text-base font-bold text-[#102a1c] font-serif pb-3 border-b border-[#f0ede6]">
              {isAr ? 'ملخص الفاتورة' : 'Order Breakdown'}
            </h3>

            {/* Coupon Code Section */}
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
                  className="text-[11px] text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded hover:bg-red-50"
                >
                  {isAr ? 'إلغاء' : 'Remove'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder={isAr ? 'أدخل كود الخصم (مثل MAKKAH15)' : 'Coupon code (e.g. MAKKAH15)'}
                    className="flex-1 bg-white border border-[#d6cfc0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#102a1c] uppercase font-mono"
                  />
                  <button
                    type="submit"
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
              </form>
            )}

            <div className="space-y-2 text-xs text-[#555] pt-2">
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
                <span>{isAr ? 'رسوم التوصيل المبرد:' : 'Delivery:'}</span>
                <span className="font-mono font-medium">
                  {shipping === 0 ? <span className="text-[#102a1c] font-bold">{isAr ? 'مجاني' : 'Free'}</span> : `${shipping} ${isAr ? 'ر.س' : 'SAR'}`}
                </span>
              </div>
              <div className="pt-2 border-t border-[#e2ddd1] flex justify-between text-base font-bold text-[#102a1c]">
                <span>{isAr ? 'الإجمالي المستحق:' : 'Total Payable:'}</span>
                <span className="font-mono text-lg">{total} {isAr ? 'ر.س' : 'SAR'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCurrentPage('checkout');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3.5 rounded-full bg-[#102a1c] hover:bg-[#1a3f2b] text-[#FAF9F5] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>{isAr ? 'متابعة إلى إتمام الطلب' : 'Proceed to Checkout'}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
