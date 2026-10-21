import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { CreditCard, MapPin, Truck, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { MadaIcon, ApplePayIcon, TabbyIcon, TamaraIcon, VisaIcon, MastercardIcon, CodIcon } from './PaymentIcons';
import { PaymentGatewaySelector, type PaymentMethodId } from '../../../components/storefront/checkout/PaymentGatewaySelector';

const SAUDI_CITIES = [
  { en: 'Riyadh', ar: 'الرياض' },
  { en: 'Jeddah', ar: 'جدة' },
  { en: 'Makkah', ar: 'مكة المكرمة' },
  { en: 'Madinah', ar: 'المدينة المنورة' },
  { en: 'Dammam', ar: 'الدمام' },
  { en: 'Khobar', ar: 'الخبر' },
  { en: 'Dhahran', ar: 'الظهران' },
  { en: 'Al Ahsa', ar: 'الأحساء' },
  { en: 'Tabuk', ar: 'تبوك' },
  { en: 'Abha', ar: 'أبها' },
  { en: 'Taif', ar: 'الطائف' },
  { en: 'Buraidah', ar: 'بريدة' },
  { en: 'Hail', ar: 'حائل' },
  { en: 'Jazan', ar: 'جازان' },
  { en: 'Yanbu', ar: 'ينبع' }
];

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotal, clearCart, navigateTo, language, setLastOrder, user } = useCart();
  const { addOrder, activeStore } = useTenant();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(language === 'AR' ? 'الرياض' : 'Riyadh');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'tabby' | 'tamara' | 'mada' | 'apple_pay' | 'card' | 'cod'>('mada');
  const [isProcessing, setIsProcessing] = useState(false);

  const installmentSAR = Math.round(cartTotal / 4);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const orderId = `HB-${Math.floor(100000 + Math.random() * 900000)}`;
      const newOrder = {
        id: orderId,
        orderNumber: orderId,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        items: [...cart],
        total: cartTotal,
        paymentMethod,
        shippingAddress: {
          name,
          phone,
          city,
          district,
          street
        },
        status: 'Confirmed'
      };

      // 1. Theme-level state for receipt rendering in ThankYouPage
      setLastOrder(newOrder);

      // 2. Central Multi-Store SaaS persistence (store-coffee isolated)
      if (typeof addOrder === 'function') {
        const paymentLabel =
          paymentMethod === 'cod'
            ? 'Cash on Delivery'
            : paymentMethod === 'mada'
            ? 'mada'
            : paymentMethod === 'apple_pay'
            ? 'Apple Pay'
            : paymentMethod === 'tabby'
            ? 'Tabby'
            : paymentMethod === 'tamara'
            ? 'Tamara'
            : 'Credit Card';

        addOrder(
          {
            customerName: name,
            customerPhone: phone,
            customerEmail: `${phone.replace(/[^0-9]/g, '')}@specialtycoffee.sa`,
            deliveryLocation: `${city} - ${district}, ${street}`,
            itemsCount: cart.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
            items: cart.map((it) => ({
              id: it.productId || it.id,
              sku: it.productId || it.id,
              name: it.productName || 'HiBrew Coffee Product',
              price: it.unitPrice || 0,
              quantity: it.quantity || 1,
              total: (it.unitPrice || 0) * (it.quantity || 1),
              image: it.image || it.selectedColor?.image || '',
            })),
            subtotal: cartTotal,
            total: cartTotal,
            status: 'pending',
            paymentMethod: paymentLabel as any,
            paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid',
            source: 'Coffee Store Online' as any,
            customerNotes: `City: ${city}, District: ${district}, Street: ${street}`,
          },
          activeStore?.id || 'store-coffee'
        );
      }

      setIsProcessing(false);
      clearCart();
      navigateTo('thankyou');
    }, 1000);
  };

  if (cart.length === 0) {
    return (
      <div
        dir={language === 'AR' ? 'rtl' : 'ltr'}
        className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white"
      >
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 mb-4">
          <Truck className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {language === 'AR' ? 'سلة التسوق فارغة' : 'Your Shopping Bag is Empty'}
        </h2>
        <p className="text-sm text-neutral-500 max-w-sm mb-6">
          {language === 'AR'
            ? 'يرجى إضافة منتجات إلى السلة قبل إتمام عملية الدفع.'
            : 'Please add equipment to your shopping bag before proceeding to checkout.'}
        </p>
        <button
          onClick={() => navigateTo('products')}
          className="px-8 py-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-md"
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
      className="min-h-screen bg-white py-6 sm:py-10 text-start text-neutral-900 selection:bg-neutral-900 selection:text-white"
    >
      <div className="max-w-[1360px] mx-auto px-4 lg:px-8">
        <button
          type="button"
          onClick={() => navigateTo('cart')}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 mb-4 sm:mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className={`w-3.5 h-3.5 shrink-0 ${language === 'AR' ? 'rotate-180' : ''}`} />
          <span>{language === 'AR' ? 'العودة إلى سلة المشتريات' : 'Back to Shopping Bag'}</span>
        </button>

        <h1 className={`honor-heading text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8 ${
          language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
        }`}>
          {language === 'AR' ? 'إتمام الشراء والدفع الآمن' : 'Express Secure Checkout'}
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Form: Shipping + Payment (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Delivery Address */}
            <div className="bg-[#F8F9FA] rounded-3xl p-5 sm:p-8 space-y-5">
              <h3 className="font-extrabold text-base text-neutral-900 flex items-center gap-2 pb-3 border-b border-neutral-200/50">
                <MapPin className="w-4 h-4 text-neutral-700" />
                <span>{language === 'AR' ? 'بيانات الشحن والتوصيل بالمملكة' : 'Shipping & Delivery Address'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {language === 'AR' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {language === 'AR' ? 'رقم الجوال السعودي' : 'Mobile Number (KSA)'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-white rounded-xl p-3 text-neutral-900 font-mono border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {language === 'AR' ? 'المدينة' : 'City'}
                  </label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden cursor-pointer"
                  >
                    {SAUDI_CITIES.map(c => (
                      <option key={c.en} value={language === 'AR' ? c.ar : c.en} className="bg-white text-neutral-900">
                        {language === 'AR' ? c.ar : c.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {language === 'AR' ? 'الحي' : 'District'}
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {language === 'AR' ? 'الشارع ورقم المبنى' : 'Street & Building Details'}
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 2. Saudi Authorized Payment Gateways */}
            <div className="bg-[#F8F9FA] rounded-3xl p-5 sm:p-8">
              <PaymentGatewaySelector
                storeId={activeStore?.id || 'store-coffee'}
                totalAmount={cartTotal}
                selectedMethod={paymentMethod as PaymentMethodId}
                onMethodChange={(m) => setPaymentMethod(m)}
                language={language === 'AR' ? 'ar' : 'en'}
                customerName={name}
                customerPhone={phone}
              />
            </div>
          </div>

          {/* Right Summary Box (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl bg-[#F8F9FA] space-y-5">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 pb-2 sm:pb-3 border-b border-neutral-200/50">
                {language === 'AR' ? 'ملخص ومحتويات الطلب' : 'Order Summary'}
              </h2>

              <div className="space-y-3 max-h-56 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-12 h-12 object-contain rounded-xl bg-white p-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-neutral-900 truncate">{item.productName}</h4>
                      <span className="text-[11px] text-neutral-500 block">
                        {item.quantity}x · {language === 'AR' && item.selectedColor.nameAr ? item.selectedColor.nameAr : item.selectedColor.name} · {item.selectedStorage.capacity}
                      </span>
                      {item.customCornerSpecs && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono inline-block mt-0.5">
                          {item.customCornerSpecs.dimensions.width}×{item.customCornerSpecs.dimensions.depth}×{item.customCornerSpecs.dimensions.height} cm · {language === 'AR' ? item.customCornerSpecs.woodTypeNameAr : item.customCornerSpecs.woodTypeName}
                        </span>
                      )}
                    </div>
                    <span className="font-bold font-sans text-neutral-900 shrink-0">
                      {language === 'AR' ? `${(item.unitPrice * item.quantity).toLocaleString()}.00 ر.س` : `SAR ${(item.unitPrice * item.quantity).toLocaleString()}.00`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 space-y-2 text-xs text-neutral-600 border-t border-neutral-200/60">
                <div className="flex justify-between items-center">
                  <span>{language === 'AR' ? 'المجموع' : 'Subtotal'}</span>
                  <span className="font-sans font-semibold text-neutral-900">
                    {language === 'AR' ? `${cartTotal.toLocaleString()}.00 ر.س` : `SAR ${cartTotal.toLocaleString()}.00`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 font-medium">
                  <span>{language === 'AR' ? 'الشحن السريع لكافة المدن' : 'Express Delivery'}</span>
                  <span>{language === 'AR' ? 'مجاني' : 'FREE'}</span>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base font-black text-neutral-900 pt-2 border-t border-neutral-200/60">
                  <span>{language === 'AR' ? 'المبلغ المطلوب سداده' : 'Total Amount'}</span>
                  <span className="font-sans text-base sm:text-lg text-neutral-900">
                    {language === 'AR' ? `${cartTotal.toLocaleString()}.00 ر.س` : `SAR ${cartTotal.toLocaleString()}.00`}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 sm:py-4 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-extrabold text-xs sm:text-sm rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {isProcessing ? (
                  <span>{language === 'AR' ? 'جاري تأكيد ومعالجة الطلب...' : 'Processing order...'}</span>
                ) : (
                  <>
                    <span>{language === 'AR' ? 'تأكيد الطلب الآن' : 'Place Order Now'}</span>
                    <ArrowRight className={`w-4 h-4 shrink-0 ${language === 'AR' ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
