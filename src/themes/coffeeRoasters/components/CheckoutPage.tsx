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
  const { cart, cartTotal, clearCart, navigateTo, language, setLastOrder } = useCart();
  const { addOrder } = useTenant();

  const [name, setName] = useState(language === 'AR' ? 'فهد العتيبي' : 'Fahad Al-Otaibi');
  const [phone, setPhone] = useState('0501234567');
  const [city, setCity] = useState(language === 'AR' ? 'الرياض' : 'Riyadh');
  const [district, setDistrict] = useState(language === 'AR' ? 'حي النرجس' : 'An Narjis');
  const [street, setStreet] = useState(language === 'AR' ? 'طريق أنس بن مالك' : 'Anas Ibn Malik Street');
  const [paymentMethod, setPaymentMethod] = useState<'tabby' | 'tamara' | 'mada' | 'apple_pay' | 'card' | 'cod'>('tabby');
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
          'store-coffee'
        );
      }

      setIsProcessing(false);
      clearCart();
      navigateTo('thankyou');
    }, 1000);
  };



  return (
    <div className="min-h-screen bg-white py-10 text-start text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="max-w-[1360px] mx-auto px-4 lg:px-8">
        <h1 className={`honor-heading text-2xl sm:text-3xl font-bold text-black mb-8 ${
          language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
        }`}>
          {language === 'AR' ? 'إتمام الشراء والدفع الآمن' : 'Express Secure Checkout'}
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Shipping + Payment (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Delivery Address */}
            <div className="bg-[#F8F9FA] rounded-3xl p-6 sm:p-8 space-y-5">
              <h3 className="font-extrabold text-base text-neutral-900 flex items-center gap-2 pb-3">
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
                    className="w-full bg-white rounded-xl p-3 text-neutral-900 focus:outline-hidden"
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
                    className="w-full bg-white rounded-xl p-3 text-neutral-900 font-mono focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {language === 'AR' ? 'المدينة' : 'City'}
                  </label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-white rounded-xl p-3 text-neutral-900 focus:outline-hidden cursor-pointer"
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
                    className="w-full bg-white rounded-xl p-3 text-neutral-900 focus:outline-hidden"
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
                    className="w-full bg-white rounded-xl p-3 text-neutral-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 2. Saudi Authorized Payment Gateways */}
            <div className="bg-[#F8F9FA] rounded-3xl p-6 sm:p-8">
              <PaymentGatewaySelector
                storeId="store-coffee"
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
            <div className="p-6 rounded-3xl bg-[#F8F9FA] space-y-5">
              <h2 className="text-lg font-bold text-neutral-900 pb-3">
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
                    <span className="font-bold font-sans text-neutral-900">
                      {language === 'AR' ? `${(item.unitPrice * item.quantity).toLocaleString()}.00 ر.س` : `SAR ${(item.unitPrice * item.quantity).toLocaleString()}.00`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 space-y-2 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>{language === 'AR' ? 'المجموع' : 'Subtotal'}</span>
                  <span className="font-sans font-semibold text-neutral-900">
                    {language === 'AR' ? `${cartTotal.toLocaleString()}.00 ر.س` : `SAR ${cartTotal.toLocaleString()}.00`}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>{language === 'AR' ? 'الشحن السريع لكافة المدن' : 'Express Delivery'}</span>
                  <span>{language === 'AR' ? 'مجاني' : 'FREE'}</span>
                </div>
                <div className="flex justify-between text-base font-black text-neutral-900 pt-2">
                  <span>{language === 'AR' ? 'المبلغ المطلوب سداده' : 'Total Amount'}</span>
                  <span className="font-sans text-lg text-neutral-900">
                    {language === 'AR' ? `${cartTotal.toLocaleString()}.00 ر.س` : `SAR ${cartTotal.toLocaleString()}.00`}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-extrabold text-sm rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <span>{language === 'AR' ? 'جاري تأكيد ومعالجة الطلب...' : 'Processing order...'}</span>
                ) : (
                  <>
                    <span>{language === 'AR' ? 'تأكيد الطلب الآن' : 'Place Order Now'}</span>
                    <ArrowRight className="w-4 h-4" />
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
