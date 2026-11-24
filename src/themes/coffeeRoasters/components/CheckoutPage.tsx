import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { cartChoiceLine } from '../cartLine';
import { useTenant } from '../../../context/TenantContext';
import { MapPin, Truck, ArrowRight, ArrowLeft } from 'lucide-react';
import { PaymentGatewaySelector, type PaymentMethodId } from '../../../components/storefront/checkout/PaymentGatewaySelector';
import {
  CheckoutShippingMethods,
  type CheckoutShippingMethodOption,
} from '../../../components/storefront/checkout/CheckoutShippingMethods';
import {
  CheckoutLocationPicker,
  type CheckoutGeoPoint,
} from '../../../components/storefront/checkout/CheckoutLocationPicker';
import { resolveCoffeeThemeSettings } from '../../settings/coffeeThemeDefaults';
import { submitPublicStorefrontOrder } from '../../../utils/submitStorefrontOrder';
import { buildCartLineSelectedOptions } from '../../../utils/storefrontPurchase';
import { readTrafficSource } from '../../../utils/trafficSource';
import { trackStorefrontEvent } from '../../../utils/storefrontAnalytics';
import { calculateShippingRates } from '../../../api/tenantApi';
import { isApiEnabled } from '../../../api/client';
import { useSaudiCityOptions } from '../../../hooks/useSaudiCityOptions';
import { SaudiMobileInput } from '../../../components/common/SaudiMobileInput';
import { isValidSaudiMobile, toSaudi00966 } from '../../../utils/phone';
import { mapApiLineToCartItem } from '../thankYouOrder';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartTotal,
    clearCart,
    navigateTo,
    language,
    setLastOrder,
    user,
    updateSignedInContact,
    products,
    appliedCoupon,
    couponDiscount,
    removeCoupon,
  } = useCart();
  const { addOrder, activeStore, syncOrderFromApi } = useTenant();
  const { cities: saudiCities } = useSaudiCityOptions(activeStore?.id);
  const [orderError, setOrderError] = useState('');

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(language === 'AR' ? 'الرياض' : 'Riyadh');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'tabby' | 'tamara' | 'mada' | 'apple_pay' | 'card' | 'cod' | 'bank_transfer'
  >('mada');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingHint, setShippingHint] = useState<string | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<CheckoutShippingMethodOption[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedMethodLabel, setSelectedMethodLabel] = useState<string>('');
  const [geo, setGeo] = useState<CheckoutGeoPoint | null>(null);
  const checkoutFields = activeStore?.id
    ? resolveCoffeeThemeSettings(activeStore.id, activeStore).checkoutFields
    : undefined;
  const showShipping = checkoutFields?.showShipping !== false;
  const showOrderNote = checkoutFields?.showOrderNote === true;
  // Locked: storefront checkout requires customer login (no guest orders).
  const guestBlocked = !user?.isLoggedIn;

  const discountedSubtotal = Math.max(0, cartTotal - (Number(couponDiscount) || 0));
  const orderGrandTotal = discountedSubtotal + (Number.isFinite(shippingFee) ? shippingFee : 0);

  const moneyFmt = useMemo(
    () => (n: number) =>
      language === 'AR' ? `${n.toLocaleString()}⃁` : `⃁ ${n.toLocaleString()}`,
    [language],
  );

  const distanceKm = useMemo(() => {
    if (!geo) return undefined;
    // Approx distance from Makkah Haram center as local-delivery reference
    const makkah = { lat: 21.4225, lng: 39.8262 };
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(geo.lat - makkah.lat);
    const dLng = toRad(geo.lng - makkah.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(makkah.lat)) * Math.cos(toRad(geo.lat)) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }, [geo]);

  useEffect(() => {
    if (!activeStore?.id || cart.length === 0) return;
    const first = cart[0];
    trackStorefrontEvent(activeStore.id, 'begin_checkout', {
      path: typeof location !== 'undefined' ? location.pathname : '/checkout',
      meta: {
        product_id: first?.productId || undefined,
        product_name: first?.productName || undefined,
        product_ids: cart.map((it) => it.productId).filter(Boolean),
        items_count: cart.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
        cart_total: cartTotal,
      },
    });
  }, [activeStore?.id]);

  useEffect(() => {
    if (!activeStore?.id || !selectedMethodId) return;
    trackStorefrontEvent(activeStore.id, 'add_shipping_info', {
      path: typeof location !== 'undefined' ? location.pathname : '/checkout',
      meta: {
        shipping_method_id: selectedMethodId,
        shipping_method: selectedMethodLabel || undefined,
        shipping_fee: shippingFee,
        city,
      },
    });
  }, [activeStore?.id, selectedMethodId]);

  useEffect(() => {
    if (!activeStore?.id || !paymentMethod) return;
    trackStorefrontEvent(activeStore.id, 'add_payment_info', {
      path: typeof location !== 'undefined' ? location.pathname : '/checkout',
      meta: { payment_method: paymentMethod },
    });
  }, [activeStore?.id, paymentMethod]);

  useEffect(() => {
    if (!showShipping || !activeStore?.id || !city.trim() || !isApiEnabled()) {
      setShippingFee(0);
      setShippingHint(null);
      setShippingMethods([]);
      return;
    }
    let cancelled = false;
    setShippingLoading(true);
    const productIds = cart.map((it) => it.productId).filter(Boolean) as string[];
    void calculateShippingRates(activeStore.id, {
      city: city.trim(),
      order_total: cartTotal,
      distance_km: distanceKm,
      product_ids: productIds.length ? productIds : undefined,
    })
      .then((res) => {
        if (cancelled) return;
        const methods = (Array.isArray(res?.available_methods) ? res.available_methods : [])
          .map((row: any) => ({
            id: String(row?.id || ''),
            name: String(row?.name || ''),
            name_ar: row?.name_ar ?? null,
            fee: Number(row?.fee ?? row?.rate ?? 0) || 0,
            is_free: Boolean(row?.is_free),
            estimated_delivery: row?.estimated_delivery ?? null,
            courier_code: row?.courier_code ?? null,
            fulfillment_mode: row?.fulfillment_mode ?? null,
            logo_url: row?.logo_url ?? null,
          }))
          .filter((m: CheckoutShippingMethodOption) => Boolean(m.id && m.name));
        setShippingMethods(methods);
        setShippingHint(res?.fulfillment_hint ? String(res.fulfillment_hint) : null);

        setSelectedMethodId((prevId) => {
          const still = prevId && methods.some((m) => m.id === prevId);
          const picked = still
            ? methods.find((m) => m.id === prevId)!
            : methods[0] || null;
          if (picked) {
            setShippingFee(Number(picked.fee) || 0);
            setSelectedMethodLabel(
              language === 'AR' ? picked.name_ar || picked.name : picked.name,
            );
            return picked.id;
          }
          const fee = Number(res?.calculated_shipping_fee);
          setSelectedMethodLabel('');
          setShippingFee(Number.isFinite(fee) ? fee : 0);
          return null;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setShippingFee(0);
        setShippingHint(null);
        setShippingMethods([]);
      })
      .finally(() => {
        if (!cancelled) setShippingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeStore?.id, city, cartTotal, showShipping, cart, distanceKm, language]);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestBlocked || !activeStore?.id) return;
    const normalizedPhone = toSaudi00966(phone);
    if (!isValidSaudiMobile(normalizedPhone)) {
      setOrderError(
        language === 'AR'
          ? 'أدخل رقم جوال صحيح يبدأ بـ 5 (9 أرقام بعد 00966).'
          : 'Enter a valid mobile number starting with 5 (9 digits after 00966).',
      );
      return;
    }
    setIsProcessing(true);
    setOrderError('');
    const traffic = readTrafficSource();
    const paymentLabel =
      paymentMethod === 'cod'
        ? 'Cash on Delivery'
        : paymentMethod === 'mada'
        ? 'Mada'
        : paymentMethod === 'apple_pay'
        ? 'Apple Pay'
        : paymentMethod === 'tabby'
        ? 'Tabby'
        : paymentMethod === 'tamara'
        ? 'Tamara'
        : paymentMethod === 'bank_transfer'
        ? 'Bank Transfer'
        : paymentMethod === 'card'
        ? 'Credit Card'
        : 'Credit Card';
    const cartSnapshot = cart.map((it) => ({ ...it }));
    const lineItems = cartSnapshot.map((it) => ({
      id: it.productId || it.id,
      sku: it.productId || it.id,
      name: it.productName || (language === 'AR' ? 'منتج' : 'Product'),
      price: it.unitPrice || 0,
      quantity: it.quantity || 1,
      total: (it.unitPrice || 0) * (it.quantity || 1),
      image: it.image || it.selectedColor?.image || '',
    }));
    const customerNotes = [
      language === 'AR' ? `المدينة: ${city}` : `City: ${city}`,
      language === 'AR' ? `الحي: ${district}` : `District: ${district}`,
      language === 'AR' ? `الشارع: ${street}` : `Street: ${street}`,
      selectedMethodLabel
        ? language === 'AR'
          ? `الشحن: ${selectedMethodLabel}`
          : `Shipping: ${selectedMethodLabel}`
        : null,
      geo ? `Geo: ${geo.lat.toFixed(5)},${geo.lng.toFixed(5)}` : null,
      distanceKm != null ? `DistanceKm: ${distanceKm}` : null,
      appliedCoupon?.code
        ? language === 'AR'
          ? `قسيمة: ${appliedCoupon.code}`
          : `Coupon: ${appliedCoupon.code}`
        : null,
      orderNote.trim()
        ? language === 'AR'
          ? `ملاحظة: ${orderNote.trim()}`
          : `Note: ${orderNote.trim()}`
        : null,
    ]
      .filter(Boolean)
      .join(' · ');
    const payload = {
      customerName: name,
      customerPhone: normalizedPhone,
      customerEmail: user?.email || undefined,
      deliveryLocation: `${city} - ${district}, ${street}${
        geo ? ` · ${geo.lat.toFixed(5)},${geo.lng.toFixed(5)}` : ''
      }`,
      itemsCount: cartSnapshot.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
      items: lineItems,
      subtotal: discountedSubtotal,
      shippingFee,
      total: orderGrandTotal,
      deliveryMode: shippingHint === 'own_delivery' ? ('own_delivery' as const) : undefined,
      shippingCompany: selectedMethodLabel || undefined,
      status: 'pending' as const,
      paymentMethod: paymentLabel as any,
      paymentStatus: 'Pending' as const,
      source: traffic.source as any,
      sourceDetails: traffic.details,
      medium: traffic.medium,
      campaign: traffic.campaign,
      utmTerm: traffic.utmTerm,
      utmContent: traffic.utmContent,
      customerNotes,
    };

    void submitPublicStorefrontOrder(
      activeStore.id,
      {
        customerName: name,
        customerPhone: normalizedPhone,
        customerEmail: user?.email || undefined,
        total: orderGrandTotal,
        deliveryLocation: payload.deliveryLocation,
        status: 'pending',
        paymentMethod: paymentLabel,
        paymentStatus: 'Pending',
        source: traffic.source,
        sourceDetails: traffic.details,
        medium: traffic.medium,
        campaign: traffic.campaign,
        utmTerm: traffic.utmTerm,
        utmContent: traffic.utmContent,
        shippingFee: Number.isFinite(shippingFee) ? Number(shippingFee) : undefined,
        deliveryMode: shippingHint === 'own_delivery' ? 'own_delivery' : undefined,
        customerNotes,
        couponCode: appliedCoupon?.code || undefined,
        items: cartSnapshot.map((it) => {
          const catalog = products.find((p) => String(p.id) === String(it.productId));
          const selected = buildCartLineSelectedOptions(it, language === 'AR');
          const optionBits = Object.values(selected).filter(Boolean);
          const displayName = optionBits.length
            ? `${it.productName} (${optionBits.slice(0, 3).join(' · ')})`
            : it.productName;
          return {
            id: it.productId,
            name: displayName,
            quantity: it.quantity || 1,
            price: it.unitPrice || 0,
            variationId: it.variationId || null,
            selectedOptions: Object.keys(selected).length ? selected : null,
            sku: (catalog as { sku?: string } | undefined)?.sku || null,
            brand: (catalog as { brand?: string } | undefined)?.brand || null,
            category: (catalog as { category?: string } | undefined)?.category || null,
            imageUrl: it.image || (catalog as { images?: string[] } | undefined)?.images?.[0] || null,
          };
        }),
      },
      {
        syncOrderFromApi,
        addOrder,
        toAddOrderPayload: () => payload,
      },
    )
      .then((order) => {
        const apiItems = Array.isArray(order.items)
          ? order.items.map((it: any, idx: number) => mapApiLineToCartItem(it, idx, language === 'AR'))
          : [];
        const placedItems = cartSnapshot.length > 0 ? cartSnapshot : apiItems;
        const placed = {
          id: order.id,
          orderNumber: order.orderNumber,
          date: order.date,
          items: placedItems,
          total: orderGrandTotal,
          shippingFee: Number.isFinite(shippingFee) ? Number(shippingFee) : order.shippingFee,
          // Prefer API canonical method (Mada / COD / Tabby / Tamara / Bank Transfer / Visa/MC)
          paymentMethod: String(order.paymentMethod || paymentLabel || paymentMethod),
          shippingMethodLabel: selectedMethodLabel || undefined,
          customerEmail: user?.email || undefined,
          customerNotes: customerNotes || undefined,
          shippingAddress: { name, phone: normalizedPhone, city, district, street },
          status: 'Confirmed',
        };
        // Prefer API lines when cart snapshot somehow empty but API has rows
        if ((!placed.items || placed.items.length === 0) && apiItems.length > 0) {
          placed.items = apiItems;
        }
        updateSignedInContact(name, normalizedPhone, city, placed);
        setLastOrder(placed);
        removeCoupon();
        clearCart();
        navigateTo('thankyou');
      })
      .catch(() => {
        setOrderError(language === 'AR' ? 'تعذر حفظ الطلب. حاول مرة أخرى.' : 'The order could not be saved. Try again.');
      })
      .finally(() => setIsProcessing(false));
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
      className="min-h-screen bg-white py-4 sm:py-10 text-start text-neutral-900 selection:bg-neutral-900 selection:text-white overflow-x-hidden"
    >
      <div className="max-w-[1360px] mx-auto px-3 sm:px-4 lg:px-8 w-full min-w-0">
        <button
          type="button"
          onClick={() => navigateTo('cart')}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 mb-4 sm:mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className={`w-3.5 h-3.5 shrink-0 ${language === 'AR' ? 'rotate-180' : ''}`} />
          <span>{language === 'AR' ? 'العودة إلى سلة المشتريات' : 'Back to Shopping Bag'}</span>
        </button>

        <h1 className={`honor-heading text-xl sm:text-3xl font-bold text-black mb-5 sm:mb-8 ${
          language === 'AR' ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
        }`}>
          {language === 'AR' ? 'إتمام الشراء والدفع الآمن' : 'Express Secure Checkout'}
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
          {/* Left Form: Shipping + Payment (8 cols) */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6 min-w-0 order-1">
            {/* 1. Delivery Address */}
            <div className="bg-[#F8F9FA] rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-5">
              <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 flex items-center gap-2 pb-3 border-b border-neutral-200/50">
                <MapPin className="w-4 h-4 text-neutral-700 shrink-0" />
                <span>{language === 'AR' ? 'بيانات الشحن والتوصيل' : 'Shipping & Delivery Address'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                <div className="min-w-0">
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {language === 'AR' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                    className="w-full min-w-0 bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {language === 'AR' ? 'رقم الجوال' : 'Mobile Number'}
                  </label>
                  <SaudiMobileInput
                    value={phone}
                    onChange={setPhone}
                    isAr={language === 'AR'}
                    required
                  />
                </div>

                {showShipping ? (
                  <div className="sm:col-span-2 space-y-5">
                    <CheckoutLocationPicker
                      isAr={language === 'AR'}
                      city={city}
                      district={district}
                      street={street}
                      onCityChange={setCity}
                      onDistrictChange={setDistrict}
                      onStreetChange={setStreet}
                      geo={geo}
                      onGeoChange={setGeo}
                      cities={saudiCities}
                    />
                    <CheckoutShippingMethods
                      isAr={language === 'AR'}
                      methods={shippingMethods}
                      selectedId={selectedMethodId}
                      loading={shippingLoading}
                      money={moneyFmt}
                      onSelect={(m) => {
                        setSelectedMethodId(m.id);
                        setShippingFee(Number(m.fee) || 0);
                        setSelectedMethodLabel(
                          language === 'AR' ? m.name_ar || m.name : m.name,
                        );
                        if (m.fulfillment_mode === 'own_delivery') {
                          setShippingHint('own_delivery');
                        }
                      }}
                    />
                  </div>
                ) : null}
              </div>
              {showOrderNote ? (
                <label className="block text-xs font-semibold text-neutral-700 space-y-1">
                  <span>{language === 'AR' ? 'ملاحظة الطلب' : 'Order note'}</span>
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    data-checkout-note="on"
                    className="w-full bg-white rounded-xl p-3 text-neutral-900 border border-neutral-200/90 focus:border-neutral-900 focus:outline-hidden"
                  />
                </label>
              ) : null}
            </div>

            {/* 2. Authorized Payment Gateways */}
            <div className="bg-[#F8F9FA] rounded-2xl sm:rounded-3xl p-4 sm:p-8 min-w-0">
              {activeStore?.id ? (
              <PaymentGatewaySelector
                storeId={activeStore.id}
                totalAmount={orderGrandTotal}
                selectedMethod={paymentMethod as PaymentMethodId}
                onMethodChange={(m) => setPaymentMethod(m)}
                language={language === 'AR' ? 'ar' : 'en'}
                customerName={name}
                customerPhone={phone}
              />
              ) : (
                <div className="text-sm text-neutral-500 py-4 text-center">
                  {language === 'AR' ? 'بانتظار بيانات المتجر' : 'Waiting for store data'}
                </div>
              )}
            </div>
          </div>

          {/* Right Summary Box (4 cols) — on mobile sits under address, before payment via order */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 min-w-0 order-2 lg:order-none lg:sticky lg:top-4">
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#F8F9FA] space-y-4 sm:space-y-5">
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
                        {item.quantity}x · {cartChoiceLine(item, language === 'AR')}
                        {item.purchaseNotes && item.purchaseNotes.length > 0 ? ` · ${item.purchaseNotes.join(' · ')}` : ''}
                      </span>
                      {item.customCornerSpecs && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono inline-block mt-0.5">
                          {item.customCornerSpecs.dimensions.width}×{item.customCornerSpecs.dimensions.depth}×{item.customCornerSpecs.dimensions.height} cm · {language === 'AR' ? item.customCornerSpecs.woodTypeNameAr : item.customCornerSpecs.woodTypeName}
                        </span>
                      )}
                    </div>
                    <span className="font-bold font-sans text-neutral-900 shrink-0">
                      {language === 'AR' ? `${(item.unitPrice * item.quantity).toLocaleString()}.00 ⃁` : `⃁ ${(item.unitPrice * item.quantity).toLocaleString()}.00`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 space-y-2 text-xs text-neutral-600 border-t border-neutral-200/60">
                <div className="flex justify-between items-center">
                  <span>{language === 'AR' ? 'المجموع' : 'Subtotal'}</span>
                  <span className="font-sans font-semibold text-neutral-900">
                    {language === 'AR' ? `${cartTotal.toLocaleString()}.00 ⃁` : `⃁ ${cartTotal.toLocaleString()}.00`}
                  </span>
                </div>
                {couponDiscount > 0 && appliedCoupon?.code ? (
                  <div className="flex justify-between items-center text-emerald-700 font-medium">
                    <span>
                      {language === 'AR'
                        ? `خصم القسيمة (${appliedCoupon.code})`
                        : `Discount (${appliedCoupon.code})`}
                    </span>
                    <span className="font-sans shrink-0">
                      {language === 'AR'
                        ? `−${couponDiscount.toLocaleString()}.00 ⃁`
                        : `−⃁ ${couponDiscount.toLocaleString()}.00`}
                    </span>
                  </div>
                ) : null}
                {showShipping ? (
                  <div className="flex justify-between items-start gap-2 text-emerald-700 font-medium">
                    <span className="min-w-0">
                      {selectedMethodLabel
                        || (shippingHint === 'own_delivery'
                          ? language === 'AR'
                            ? 'التوصيل بواسطة المتجر'
                            : 'Store delivery'
                          : language === 'AR'
                            ? 'الشحن'
                            : 'Shipping')}
                      {shippingLoading ? '…' : ''}
                    </span>
                    <span className="font-sans shrink-0">
                      {shippingLoading
                        ? '—'
                        : shippingFee <= 0
                          ? language === 'AR'
                            ? 'مجاني'
                            : 'FREE'
                          : language === 'AR'
                            ? `${shippingFee.toLocaleString()}⃁`
                            : `⃁ ${shippingFee.toLocaleString()}`}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center text-sm sm:text-base font-black text-neutral-900 pt-2 border-t border-neutral-200/60">
                  <span>{language === 'AR' ? 'المبلغ المطلوب سداده' : 'Total Amount'}</span>
                  <span className="font-sans text-base sm:text-lg text-neutral-900">
                    {language === 'AR'
                      ? `${orderGrandTotal.toLocaleString()}⃁`
                      : `⃁ ${orderGrandTotal.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {orderError ? (
                <p className="text-[11px] text-rose-700">{orderError}</p>
              ) : null}

              {guestBlocked ? (
                <div className="space-y-2" data-checkout-guest="blocked">
                  <p className="text-[11px] text-rose-700">
                    {language === 'AR' ? 'يلزم تسجيل الدخول قبل إتمام الشراء.' : 'Sign in before placing the order.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('profile')}
                    className="w-full py-3 rounded-full bg-neutral-900 text-white text-xs font-extrabold cursor-pointer"
                  >
                    {language === 'AR' ? 'تسجيل الدخول للمتابعة' : 'Sign in to continue'}
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
