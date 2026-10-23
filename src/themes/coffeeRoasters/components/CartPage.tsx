import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, Tag, Truck, Check, Coffee } from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    cart,
    cartTotal,
    cartVat,
    removeFromCart,
    updateQuantity,
    navigateTo,
    showToast,
    applyCoupon,
    removeCoupon,
    appliedCoupon: appliedCouponObj,
    couponDiscount,
    language
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const discountAmount = couponDiscount;
  const appliedCoupon = appliedCouponObj?.code || null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyCoupon(couponCode);
    showToast(res.message);
    if (res.success) setCouponCode('');
  };

  const finalTotal = Math.max(0, cartTotal - discountAmount);

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 mb-4">
          <Coffee className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {language === 'AR' ? 'سلة التسوق فارغة حالياً' : 'Your Shopping Bag is Empty'}
        </h2>
        <p className="text-sm text-neutral-500 max-w-sm mb-6">
          {language === 'AR'
            ? 'لم تضف أي معدات قهوة بعد. استكشف أحدث مكائن ومطاحن وأركان القهوة الفاخرة.'
            : "Looks like you haven't added any items yet. Explore our 20-bar espresso machines, titanium mills, and barista gear."}
        </p>
        <button
          onClick={() => navigateTo('products')}
          className="px-8 py-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-full transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>{language === 'AR' ? 'استكشف المنتجات' : 'Explore Products'}</span>
          <ArrowRight className={`w-4 h-4 shrink-0 ${language === 'AR' ? 'rotate-180' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div
      dir={language === 'AR' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-white py-6 sm:py-10 pb-28 lg:pb-12 text-start text-neutral-900 selection:bg-neutral-900 selection:text-white"
    >
      <div className="max-w-[1360px] mx-auto px-4 lg:px-8 space-y-6 sm:space-y-8">
        <div className="pb-2 sm:pb-4">
          <h1 className={`honor-heading text-2xl sm:text-3xl font-bold text-black ${
            language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
          }`}>
            {language === 'AR' ? 'سلة التسوق' : 'Shopping Bag'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {language === 'AR' ? 'معدات القهوة المحددة مع ضمان الوكيل سنتين والشحن المجاني' : 'Review your selected equipment before checking out'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Items List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-6 rounded-3xl bg-[#F8F9FA] flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center justify-between"
              >
                <div className="flex gap-3 sm:gap-4 items-start sm:items-center flex-1 min-w-0 w-full">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-16 h-16 sm:w-24 sm:h-24 object-contain rounded-2xl bg-white p-2 shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-bold text-sm sm:text-base text-neutral-900 truncate sm:whitespace-normal">
                      {item.productName}
                    </h3>
                    <div className="text-xs text-neutral-500 flex items-center gap-2">
                      <span>{language === 'AR' && item.selectedColor.nameAr ? item.selectedColor.nameAr : item.selectedColor.name}</span>
                      <span>·</span>
                      <span>{item.selectedStorage.capacity}</span>
                    </div>

                    {item.selectedWarranty && (
                      <div className="mt-1 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 w-fit font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'AR' && item.selectedWarranty.nameAr ? item.selectedWarranty.nameAr : item.selectedWarranty.name}</span>
                      </div>
                    )}

                    {item.customCornerSpecs && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-white border border-neutral-200/80 text-[11px] text-neutral-700 space-y-1.5 shadow-xs">
                        <div className="font-bold text-neutral-900 flex items-center gap-2 flex-wrap">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          <span>{language === 'AR' ? 'مواصفات التفصيل الهندسي:' : 'Bespoke Custom Specifications:'}</span>
                          <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded-md text-[10.5px] text-neutral-800 font-bold">
                            {item.customCornerSpecs.dimensions.width}×{item.customCornerSpecs.dimensions.depth}×{item.customCornerSpecs.dimensions.height} cm
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-neutral-600">
                          <div>
                            <span className="font-semibold text-neutral-800">{language === 'AR' ? 'الهيكل: ' : 'Structure: '}</span>
                            {language === 'AR' ? item.customCornerSpecs.woodTypeNameAr : item.customCornerSpecs.woodTypeName} · {language === 'AR' ? item.customCornerSpecs.edgeFinishingAr : item.customCornerSpecs.edgeFinishing} ({language === 'AR' ? item.customCornerSpecs.structureColor.nameAr : item.customCornerSpecs.structureColor.name})
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-800">{language === 'AR' ? 'السطح: ' : 'Top: '}</span>
                            {language === 'AR' ? item.customCornerSpecs.surfaceTypeNameAr : item.customCornerSpecs.surfaceTypeName} ({language === 'AR' ? item.customCornerSpecs.surfaceColor.nameAr : item.customCornerSpecs.surfaceColor.name})
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-800">{language === 'AR' ? 'التقسيم: ' : 'Division: '}</span>
                            {language === 'AR' ? item.customCornerSpecs.internalDivision.nameAr : item.customCornerSpecs.internalDivision.name}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-800">{language === 'AR' ? 'المقبض: ' : 'Handle: '}</span>
                            {language === 'AR' ? item.customCornerSpecs.handleType.nameAr : item.customCornerSpecs.handleType.name}
                          </div>
                        </div>
                        {item.customCornerSpecs.accessories.length > 0 && (
                          <div className="text-[10.5px] text-amber-900 bg-amber-50/90 px-2 py-1 rounded-md font-medium">
                            <span className="font-bold">{language === 'AR' ? 'الإضافات: ' : 'Add-ons: '}</span>
                            {item.customCornerSpecs.accessories.map(a => `${language === 'AR' ? a.nameAr : a.name} (×${a.quantity})`).join(' · ')}
                          </div>
                        )}
                        {item.customCornerSpecs.divisionNotes && (
                          <div className="text-[10px] text-neutral-500 italic">
                            <span className="font-bold not-italic">{language === 'AR' ? 'ملاحظات التقسيم: ' : 'Division Note: '}</span>
                            {item.customCornerSpecs.divisionNotes}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-sm font-black text-neutral-900 font-sans pt-1">
                      {language === 'AR' ? `${item.unitPrice.toLocaleString()}.00 ر.س` : `SAR ${item.unitPrice.toLocaleString()}.00`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t border-neutral-200/60 sm:border-t-0">
                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-xl bg-neutral-200/80">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-300 rounded-l-xl cursor-pointer transition-colors"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-neutral-900 font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-300 rounded-r-xl cursor-pointer transition-colors"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-sm sm:text-base font-black text-neutral-900 font-sans">
                      {language === 'AR' ? `${(item.unitPrice * item.quantity).toLocaleString()}.00 ر.س` : `SAR ${(item.unitPrice * item.quantity).toLocaleString()}.00`}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-neutral-400 hover:text-red-500 transition-colors rounded-lg cursor-pointer shrink-0"
                    aria-label={language === 'AR' ? 'حذف المنتج' : 'Remove item'}
                    title={language === 'AR' ? 'حذف المنتج' : 'Remove item'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl bg-[#F8F9FA] space-y-5">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 pb-2 sm:pb-3 border-b border-neutral-200/50">
                {language === 'AR' ? 'ملخص الطلب' : 'Order Summary'}
              </h2>

              <div className="space-y-3 text-xs text-neutral-600">
                <div className="flex justify-between items-center">
                  <span>{language === 'AR' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span className="font-sans text-neutral-900 font-semibold">
                    {language === 'AR' ? `${cartTotal.toLocaleString()}.00 ر.س` : `SAR ${cartTotal.toLocaleString()}.00`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{language === 'AR' ? 'ضريبة القيمة المضافة (15% مشمولة)' : 'VAT (15% inclusive)'}</span>
                  <span className="font-sans text-neutral-900 font-semibold">
                    {language === 'AR' ? `${cartVat.toLocaleString()}.00 ر.س` : `SAR ${cartVat.toLocaleString()}.00`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 font-medium">
                  <span>{language === 'AR' ? 'الشحن والتوصيل لكافة مدن المملكة' : 'Shipping'}</span>
                  <span>{language === 'AR' ? 'مجاني' : 'FREE'}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span className="flex items-center gap-2">
                      {language === 'AR' ? `خصم القسيمة (${appliedCoupon})` : `Discount (${appliedCoupon})`}
                      <button type="button" onClick={removeCoupon} className="text-[10px] underline text-neutral-500 cursor-pointer">
                        {language === 'AR' ? 'إزالة' : 'Remove'}
                      </button>
                    </span>
                    <span className="font-sans">
                      {language === 'AR' ? `-${discountAmount.toLocaleString()}.00 ر.س` : `-SAR ${discountAmount.toLocaleString()}.00`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm sm:text-base font-black text-neutral-900 pt-3 border-t border-neutral-200/60">
                  <span>{language === 'AR' ? 'الإجمالي النهائي' : 'Total Amount'}</span>
                  <span className="font-sans text-base sm:text-lg text-neutral-900">
                    {language === 'AR' ? `${finalTotal.toLocaleString()}.00 ر.س` : `SAR ${finalTotal.toLocaleString()}.00`}
                  </span>
                </div>
              </div>

              {/* Promo Code Form */}
              <form onSubmit={handleApplyCoupon} className="pt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Tag className={`w-4 h-4 text-neutral-400 absolute ${language === 'AR' ? 'right-3' : 'left-3'} top-3`} />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder={language === 'AR' ? 'كود الخصم' : 'Promo Code'}
                      className={`w-full ${language === 'AR' ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} py-2.5 rounded-xl bg-neutral-200/70 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden uppercase font-mono`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    {language === 'AR' ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
              </form>

              {/* Checkout Button */}
              <button
                onClick={() => navigateTo('checkout')}
                className="w-full py-3.5 sm:py-4 bg-black hover:bg-neutral-800 text-white font-extrabold text-xs sm:text-sm rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>{language === 'AR' ? 'متابعة الدفع وإنهاء الطلب' : 'Proceed to Checkout'}</span>
                <ArrowRight className={`w-4 h-4 shrink-0 ${language === 'AR' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Action Bar (<lg screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-3 px-4">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-neutral-500 font-medium">
              {language === 'AR' ? 'الإجمالي النهائي:' : 'Total Amount:'}
            </span>
            <span className="text-base font-black text-neutral-900 font-sans tracking-tight">
              {language === 'AR' ? `${finalTotal.toLocaleString()}.00 ر.س` : `SAR ${finalTotal.toLocaleString()}.00`}
            </span>
          </div>

          <button
            onClick={() => navigateTo('checkout')}
            className="px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
          >
            <span>{language === 'AR' ? 'إنهاء الطلب' : 'Checkout'}</span>
            <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${language === 'AR' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
