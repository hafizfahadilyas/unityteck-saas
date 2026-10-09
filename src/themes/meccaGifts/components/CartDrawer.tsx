import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Truck,
  Tag
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    language,
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    freeShippingRemaining,
    setCurrentPage,
    user,
    setIsAuthModalOpen,
    appliedCoupon,
    appliedDiscount,
    applyCouponCode,
    removeAppliedCoupon
  } = useApp();

  const isAr = language === 'ar';
  const [promoCode, setPromoCode] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ msg: string; isError: boolean } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoFeedback(null);
    const res = applyCouponCode(promoCode);
    setPromoFeedback({ msg: res.message, isError: !res.success });
    if (res.success) {
      setPromoCode('');
    }
  };

  const shipping = freeShippingRemaining === 0 ? 0 : 35;
  const finalTotal = Math.max(0, cartSubtotal - appliedDiscount + (cart.length > 0 ? shipping : 0));
  const freeShippingPercent = Math.min(100, Math.round(((299 - freeShippingRemaining) / 299) * 100));

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    setCurrentPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewCart = () => {
    setIsCartOpen(false);
    setCurrentPage('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
      />

      <div className="absolute inset-y-0 max-w-full flex ltr:right-0 rtl:left-0">
        <div className="w-screen max-w-md bg-[#FAF9F5] shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out">
          
          {/* Top Bar Header */}
          <div className="p-5 border-b border-[#e8e4dc] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#102a1c]" />
              <h3 className="text-base font-bold text-[#102a1c] font-serif">
                {isAr ? 'حقيبة التسوق' : 'Shopping Bag'}
              </h3>
              <span className="text-xs bg-[#f0ede6] text-[#6c757d] font-bold px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full text-[#6c757d] hover:text-[#102a1c] hover:bg-[#ede9df] transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[#f2efe6] px-5 py-3 border-b border-[#e2dcd0]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 text-[#102a1c] font-semibold">
                <Truck className="w-4 h-4 text-[#102a1c]" />
                {freeShippingRemaining > 0 ? (
                  <span>
                    {isAr
                      ? `تبقّى ${freeShippingRemaining} ر.س للحصول على شحن مجاني`
                      : `Add ${freeShippingRemaining} SAR more for free delivery`}
                  </span>
                ) : (
                  <span className="text-[#102a1c] font-bold">
                    {isAr ? 'تهانينا! حصلت على شحن مجاني' : 'Congratulations! You unlocked free shipping'}
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] text-[#6c757d]">{freeShippingPercent}%</span>
            </div>

            <div className="w-full bg-[#dfd8cb] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#102a1c] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${freeShippingPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-[#f0ede6]">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#ede8df] flex items-center justify-center mx-auto text-[#8c8275]">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#102a1c]">
                    {isAr ? 'حقيبة التسوق فارغة' : 'Your bag is empty'}
                  </h4>
                  <p className="text-xs text-[#7d7568] mt-1 max-w-xs mx-auto">
                    {isAr
                      ? 'اختر باقة استثنائية أو هدية ملكية من مجموعتنا الفاخرة'
                      : 'Choose an exceptional floral arrangement or royal gift from our boutique.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setCurrentPage('catalog');
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#102a1c] text-[#f5f1e8] text-xs font-bold hover:bg-[#1a3f2b] transition-all"
                >
                  {isAr ? 'تصفح باقات الورد' : 'Browse Collections'}
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                  {/* Thumbnail */}
                  <img
                    src={item.product.image}
                    alt={isAr ? item.product.name : item.product.nameEn}
                    className="w-20 h-20 rounded-xl object-cover border border-[#e8e4dc] shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-[#1a1f1b] leading-tight truncate">
                        {isAr ? item.product.name : item.product.nameEn}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[#999] hover:text-[#8b263e] transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.selectedSize && (
                      <p className="text-[11px] text-[#7d7568] mt-0.5 font-medium">
                        {item.selectedSize}
                      </p>
                    )}

                    {/* Addons summary */}
                    {item.addons.length > 0 && (
                      <div className="text-[10px] text-[#102a1c] bg-[#eef5f0] rounded-md px-1.5 py-0.5 mt-1 inline-block">
                        +{item.addons.map((a) => (isAr ? a.name : a.nameEn)).join(', ')}
                      </div>
                    )}

                    {/* Price and Quantity Stepper */}
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-xs sm:text-sm font-bold font-mono text-[#102a1c]">
                        {item.product.price + item.addons.reduce((sum, a) => sum + a.price, 0)}{' '}
                        {isAr ? 'ر.س' : 'SAR'}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#d6cfc0] rounded-lg bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-[#f0ede6] text-[#495057] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-mono font-bold text-[#1a1f1b]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-[#f0ede6] text-[#495057] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Area with Promo & Total */}
          {cart.length > 0 && (
            <div className="p-5 bg-white border-t border-[#e8e4dc] space-y-3.5">
              
              {/* Promo code input or active badge */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      {appliedCoupon.code} (
                      {appliedCoupon.discountType === 'percentage'
                        ? `${appliedCoupon.discountValue}% OFF`
                        : `${appliedCoupon.discountValue} SAR FLAT`}
                      )
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeAppliedCoupon}
                    className="text-[11px] text-red-600 hover:text-red-800 font-bold px-1.5 py-0.5 rounded hover:bg-red-50"
                  >
                    {isAr ? 'إلغاء الكود' : 'Remove'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder={isAr ? 'أدخل كود الخصم (مثل MAKKAH15)' : 'Enter coupon code (e.g. MAKKAH15)'}
                      className="w-full bg-[#f8f6f0] border border-[#d6cfc0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#102a1c] uppercase font-mono"
                    />
                    <Tag className="w-3.5 h-3.5 text-[#8c8275] absolute left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto top-2.5" />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#102a1c] hover:bg-[#1a3f2b] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isAr ? 'تطبيق' : 'Apply'}
                  </button>
                </form>
              )}

              {promoFeedback && (
                <div
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    promoFeedback.isError ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{promoFeedback.msg}</span>
                </div>
              )}

              {/* Subtotal breakdown */}
              <div className="space-y-1.5 text-xs text-[#555]">
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
                  <span>{isAr ? 'رسوم التوصيل:' : 'Delivery:'}</span>
                  <span className="font-mono font-medium">
                    {shipping === 0 ? (
                      <span className="text-[#102a1c] font-bold">{isAr ? 'مجاني' : 'Free'}</span>
                    ) : (
                      `${shipping} ${isAr ? 'ر.س' : 'SAR'}`
                    )}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#f0ede6] flex justify-between text-sm sm:text-base font-bold text-[#102a1c]">
                  <span>{isAr ? 'الإجمالي النهائي:' : 'Final Total:'}</span>
                  <span className="font-mono">{finalTotal} {isAr ? 'ر.س' : 'SAR'}</span>
                </div>
              </div>

              {/* Proceed to checkout button */}
              <button
                type="button"
                onClick={handleProceedCheckout}
                className="w-full py-3.5 rounded-full bg-[#102a1c] hover:bg-[#1a3f2b] active:scale-95 text-[#FAF9F5] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
              >
                <span>{isAr ? 'إتمام الطلب وتحديد موعد التوصيل' : 'Proceed to Checkout'}</span>
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>

              {/* View Full Cart Page */}
              <button
                type="button"
                onClick={handleViewCart}
                className="w-full py-2.5 rounded-full border border-[#102a1c]/30 hover:bg-[#102a1c]/10 text-[#102a1c] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#102a1c]" />
                <span>{isAr ? 'عرض صفحة السلة الكاملة' : 'View Full Shopping Bag'}</span>
              </button>

              {/* Order via WhatsApp */}
              <a
                href={`https://wa.me/966581617712?text=${encodeURIComponent(
                  isAr
                    ? `مرحباً متجر هدايا مكة، أود طلب محتويات السلة:\n${cart
                        .map((i) => `• ${i.product.name} (عدد: ${i.quantity}) - ${i.selectedSize}`)
                        .join('\n')}\nالمجموع الإجمالي: ${finalTotal} ر.س. أرجو التنسيق للتوصيل المبرد في مكة.`
                    : `Hello Hadaya Mecca, I want to order my bag items for ${finalTotal} SAR.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-full bg-[#25D366]/15 hover:bg-[#25D366] text-[#128C7E] hover:text-white border border-[#25D366]/30 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>{isAr ? 'طلب محتويات السلة عبر واتساب' : 'Order Bag via WhatsApp'}</span>
              </a>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
