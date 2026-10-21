import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PRODUCTS } from '../data/mockData';
import { ProductCard } from '../components/ProductCard';
import { useTenant } from '../../../context/TenantContext';
import {
  fetchCartInterceptCustomerProfileApi,
  CartInterceptCustomerRewards,
} from '../../../api/tenantApi';
import { CustomerLoyaltyProfileSection } from '../../../components/storefront/CustomerLoyaltyProfileSection';

import {
  User,
  ShoppingBag,
  Calendar,
  MapPin,
  Heart,
  Crown,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  Truck,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Gift,
  FileText,
  LogOut,
  LogIn,
  AlertCircle,
  X,
  Copy,
  Tag,
  Check,
  RotateCcw,
  Percent,
} from 'lucide-react';

export const UserCrmPage: React.FC = () => {
  const {
    language,
    orders,
    loyaltyPoints,
    savedAddresses,
    savedOccasions,
    addOccasion,
    removeOccasion,
    addAddress,
    removeAddress,
    wishlist,
    setCurrentPage,
    user,
    loginWithGoogle,
    logout,
    setShowInvoiceModal,
    cancelOrderRequest,
    applyCouponCode,
    addToCart,
  } = useApp();
  const { activeStore } = useTenant();

  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'orders' | 'loyalty' | 'gift_cards' | 'saved_cart' | 'occasions' | 'addresses' | 'wishlist'>('orders');
  const [customerRewards, setCustomerRewards] = useState<CartInterceptCustomerRewards>({
    loyalty_points: 0,
    claimed_coupons: [],
    saved_carts: [],
    points_history: [],
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadRewards = async () => {
      try {
        const storeId = activeStore?.id || 'store-1';
        const customerId = user.isLoggedIn && user.email ? user.email : 'guest';
        const res = await fetchCartInterceptCustomerProfileApi(storeId, customerId);
        if (res && isMounted) {
          setCustomerRewards(res);
        }
      } catch {}
    };
    loadRewards();
  }, [activeStore?.id, user.isLoggedIn, user.email]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Cancel order modal state
  const [cancelModalOrder, setCancelModalOrder] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // New Occasion Form state
  const [showAddOccasion, setShowAddOccasion] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newRelationship, setNewRelationship] = useState('الزوجة');

  // New Address Form state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddrTitle, setNewAddrTitle] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('مكة المكرمة');
  const [newAddrDistrict, setNewAddrDistrict] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('+966 50 ');

  const handleCreateOccasion = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle && newDate && newRecipient) {
      addOccasion({
        title: newTitle,
        date: newDate,
        recipient: newRecipient,
        relationship: newRelationship
      });
      setNewTitle('');
      setNewDate('');
      setNewRecipient('');
      setShowAddOccasion(false);
    }
  };

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAddrTitle && newAddrDistrict && newAddrStreet) {
      addAddress({
        title: newAddrTitle,
        city: newAddrCity,
        district: newAddrDistrict,
        street: newAddrStreet,
        recipientName: user.name || 'محمد الشهري',
        recipientPhone: newAddrPhone,
        isDefault: false
      });
      setNewAddrTitle('');
      setNewAddrDistrict('');
      setNewAddrStreet('');
      setShowAddAddress(false);
    }
  };

  // Wishlist products
  const wishlistProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

  return (
    <div className="py-8 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* VIP Profile Banner with Google Sign-In */}
      <div className="bg-[#102a1c] text-[#FAF9F5] rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#e6ca98]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1b3d2b] border-2 border-[#e6ca98]/40 flex items-center justify-center text-[#e6ca98] shrink-0 overflow-hidden">
              {user.isLoggedIn ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-8 h-8 sm:w-10 sm:h-10" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#faf7f2]">
                  {user.isLoggedIn ? user.name : (isAr ? 'زائر كريم' : 'Guest User')}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e6ca98] text-[#102a1c] text-[11px] font-bold">
                  <Crown className="w-3 h-3" />
                  <span>{isAr ? 'عضوية النخبة الملكية' : 'Royal VIP Member'}</span>
                </span>
              </div>
              <p className="text-xs text-[#a9bcae] mt-1 font-mono">
                {user.isLoggedIn ? user.email : (isAr ? 'سجّل دخولك لحفظ الطلبات والنقاط' : 'Sign in to save orders')}
              </p>
              
              {/* Google Log In / Out Button */}
              <div className="pt-2">
                {user.isLoggedIn ? (
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => loginWithGoogle()}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white text-[#102a1c] hover:bg-[#e6ca98] text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <span className="text-[#4285F4] font-black">G</span>
                    <span>{isAr ? 'تسجيل الدخول السريع بحساب Google' : 'Sign in with Google'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Loyalty Wallet Stat */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex items-center gap-4 self-stretch md:self-auto">
            <div className="w-12 h-12 rounded-xl bg-[#e6ca98] text-[#102a1c] flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-[#ded7c8] uppercase tracking-wider block">
                {isAr ? 'رصيد نقاط هدايا مكة' : 'Hadaya Reward Points'}
              </span>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-[#e6ca98]">
                {loyaltyPoints} {isAr ? 'نقطة' : 'pts'}
              </p>
              <span className="text-[11px] text-[#ded7c8]">
                {isAr ? `تعادل ${(loyaltyPoints * 0.1).toFixed(0)} ر.س رصيد خصم متاح` : `Worth ${(loyaltyPoints * 0.1).toFixed(0)} SAR discount`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-[#e8e4dc] no-scrollbar">
        {[
          { id: 'orders', label: isAr ? 'طلباتي ومتابعة التوصيل' : 'Orders & Live Tracking', icon: ShoppingBag, count: orders.length },
          { id: 'loyalty', label: isAr ? 'كارت ولاء العملاء والنقاط' : 'Loyalty Points Card', icon: Sparkles, count: loyaltyPoints },
          { id: 'gift_cards', label: isAr ? 'كروت الهدايا والخصومات' : 'Gift Cards & Coupons', icon: Gift, count: customerRewards.claimed_coupons.length },
          { id: 'saved_cart', label: isAr ? 'السلات المحفوظة' : 'Saved Carts', icon: ShoppingBag, count: customerRewards.saved_carts.length },
          { id: 'occasions', label: isAr ? 'مفكرة المناسبات الذكية' : 'Occasion Reminders', icon: Calendar, count: savedOccasions.length },
          { id: 'addresses', label: isAr ? 'العناوين المحفوظة' : 'Saved Addresses', icon: MapPin, count: savedAddresses.length },
          { id: 'wishlist', label: isAr ? 'قائمة الأمنيات' : 'Wishlist', icon: Heart, count: wishlist.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#102a1c] text-[#e6ca98] shadow-md'
                  : 'bg-[#FAF9F5] border border-[#e8e4dc] text-[#555] hover:bg-[#ede9df]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#e5dfd3] text-[#555]'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-serif text-[#102a1c]">
              {isAr ? 'سجل الطلبات وتتبع التوصيل المباشر' : 'Order History & Real-Time Tracking'}
            </h2>
          </div>

          {orders.length === 0 ? (
            /* Clean Empty State when no orders placed */
            <div className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#102a1c]/10 text-[#102a1c] flex items-center justify-center mx-auto shadow-inner">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif text-[#102a1c]">
                  {isAr ? 'لا توجد طلبات سابقة حتى الآن' : 'No Orders Placed Yet'}
                </h3>
                <p className="text-xs text-[#8c8275] max-w-md mx-auto mt-1.5 leading-relaxed">
                  {isAr
                    ? 'لم تقم بتقديم أي طلب حتى الآن. تصفح تشكيلاتنا الفاخرة من باقات الورد الطبيعي والهدايا الملكية وقدّم أول طلب لك ليصلك أينما كنت!'
                    : 'You have not placed any orders yet. Explore our luxury fresh flower arrangements and royal gifts to place your first order!'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setCurrentPage('catalog')}
                  className="px-6 py-3 rounded-2xl bg-[#102a1c] hover:bg-[#1a3f2b] text-[#e6ca98] text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  <span>{isAr ? 'تصفح باقات الورد والهدايا الآن' : 'Browse Flower Bouquets Now'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isCancellationRequested = order.status === 'cancellation_requested';
                const isCancelled = order.status === 'cancelled';
                const canRequestCancel = !isCancelled && !isCancellationRequested && order.status !== 'delivered';

                return (
                  <div
                    key={order.orderId}
                    className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-5 sm:p-7 shadow-sm space-y-4 hover:border-[#102a1c]/30 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#f0ede6] gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${isCancelled ? 'bg-rose-500' : isCancellationRequested ? 'bg-amber-500 animate-pulse' : 'bg-[#102a1c] animate-ping'}`} />
                        <div>
                          <span className="text-xs text-[#8c8275]">{isAr ? 'رقم الطلب:' : 'Order ID:'}</span>
                          <p className="text-sm font-bold font-mono text-[#102a1c]">{order.orderId}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                          order.status === 'delivered'
                            ? 'bg-[#2ecc71]/15 text-[#27ae60]'
                            : isCancellationRequested
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isCancelled
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : order.status === 'on_delivery'
                            ? 'bg-[#f39c12]/15 text-[#d35400]'
                            : 'bg-[#102a1c]/10 text-[#102a1c]'
                        }`}>
                          {order.status === 'delivered'
                            ? (isAr ? 'تم التسليم بنجاح ✓' : 'Delivered')
                            : isCancellationRequested
                            ? (isAr ? 'طلب إلغاء معلق (بانتظار موافقة الإدارة) ⏳' : 'Cancellation Pending Admin Approval ⏳')
                            : isCancelled
                            ? (isAr ? 'تم إلغاء الطلب من الإدارة ✕' : 'Order Cancelled')
                            : order.status === 'on_delivery'
                            ? (isAr ? 'في الطريق مع المندوب 🚚' : 'Out for Delivery')
                            : (isAr ? 'جاري تجهيز وتنسيق الباقة 💐' : 'Preparing')}
                        </span>
                        <span className="text-xs text-[#8c8275] font-mono">{order.date}</span>
                      </div>
                    </div>

                    {/* Cancellation & Refund Alert Status Banner */}
                    {isCancellationRequested && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            {isAr ? 'طلب إلغاء الطلب قيد المراجعة' : 'Cancellation Request in Review'}
                          </p>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            {isAr
                              ? 'تم إرسال طلب الإلغاء إلى إدارة المتجر بنجاح. سيقوم المسؤول بمراجعة الطلب والموافقة على استرداد المبلغ إلى وسيلة الدفع الخاصة بك.'
                              : 'Cancellation request has been sent to store administration. Admin will review and process your refund.'}
                          </p>
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-950 font-bold text-[10px]">
                            <span>{isAr ? 'حالة استرداد المبلغ: قيد انتظار موافقة الإدارة 💳' : 'Refund Status: Pending Admin Approval 💳'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isCancelled && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                        <CheckCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            {isAr ? 'تم إلغاء الطلب رسمياً من قبل الإدارة' : 'Order Officially Cancelled by Admin'}
                          </p>
                          <p className="text-[11px] text-rose-800 mt-0.5">
                            {isAr
                              ? `تمت معالجة استرداد كامل المبلغ (${order.total} ر.س) إلى حسابك عبر ${order.paymentMethod}.`
                              : `Full refund of (${order.total} SAR) has been approved and refunded to your ${order.paymentMethod}.`}
                          </p>
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                            <span>{isAr ? 'حالة استرداد المبلغ: تم الاسترداد بنجاح ✓' : 'Refund Status: Refunded Successfully ✓'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Items in this order */}
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-14 h-14 rounded-xl object-cover border border-[#e2ddd1]"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-bold text-[#1a1f1b] text-sm">{isAr ? item.product.name : item.product.nameEn}</p>
                              <p className="text-xs text-[#7a7164]">{item.selectedSize} × {item.quantity}</p>
                              {item.cardMessage && (
                                <p className="text-[11px] text-[#8b263e] italic mt-0.5">"{item.cardMessage}"</p>
                              )}
                            </div>
                          </div>

                          <span className="font-mono font-bold text-[#102a1c]">
                            {(item.product.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity} {isAr ? 'ر.س' : 'SAR'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer with actions: View Invoice, Cancel Order, WhatsApp */}
                    <div className="pt-3 border-t border-[#f0ede6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-[#6c757d]">
                        <MapPin className="w-4 h-4 text-[#102a1c]" />
                        <span>{order.city} - {order.address} ({order.recipientName})</span>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        {canRequestCancel && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelModalOrder(order.orderId);
                              setCancelReasonInput('');
                            }}
                            className="px-3.5 py-1.5 rounded-full border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'طلب إلغاء الطلب واسترداد المبلغ' : 'Request Order Cancellation'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowInvoiceModal(true)}
                          className="px-3.5 py-1.5 rounded-full border border-[#102a1c] text-[#102a1c] hover:bg-[#102a1c] hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isAr ? 'عرض الفاتورة الرسمية' : 'View Tax Invoice'}</span>
                        </button>

                        <a
                          href={`https://wa.me/966581617712?text=استفسار عن طلبي ${order.orderId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-1.5 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{isAr ? 'محادثة المنسق' : 'Chat Florist'}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Cancellation Request Modal */}
          {cancelModalOrder && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp border border-slate-100">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="font-bold text-base text-slate-900">
                      {isAr ? 'طلب إلغاء الطلب واسترداد المبلغ' : 'Request Order Cancellation & Refund'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setCancelModalOrder(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr
                    ? `هل ترغب في طلب إلغاء الطلب رقم (${cancelModalOrder})؟ سيتم إرسال الطلب لإدارة المتجر للموافقة عليه واعتماد استرداد المبلغ.`
                    : `Do you want to request cancellation for order (${cancelModalOrder})? Admin will review and approve refund.`}
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'سبب الإلغاء (اختياري):' : 'Reason for Cancellation (optional):'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={isAr ? 'مثال: تغيير موعد المناسبة / تغيير العنوان...' : 'e.g. Rescheduling occasion / address change...'}
                    value={cancelReasonInput}
                    onChange={(e) => setCancelReasonInput(e.target.value)}
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102a1c] bg-slate-50"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSubmittingCancel}
                    onClick={() => {
                      setIsSubmittingCancel(true);
                      setTimeout(() => {
                        cancelOrderRequest(cancelModalOrder, cancelReasonInput);
                        setIsSubmittingCancel(false);
                        setCancelModalOrder(null);
                      }, 400);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingCancel ? (isAr ? 'جارٍ الإرسال...' : 'Submitting...') : (isAr ? 'تأكيد إرسال طلب الإلغاء' : 'Confirm Cancel Request')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelModalOrder(null)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    {isAr ? 'تراجع' : 'Back'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Loyalty Points Card & Rewards */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          <CustomerLoyaltyProfileSection
            storeId={activeStore?.id || 'store-1'}
            customerId={user?.email || 'customer'}
            customerName={user?.name}
            customerEmail={user?.email}
          />

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#102a1c]">
                {isAr ? 'كارت ولاء العملاء والمكافآت الملكية' : 'VIP Loyalty Card & Reward Balance'}
              </h2>
              <p className="text-xs text-[#7a7164] mt-0.5">
                {isAr
                  ? 'اكسب النقاط الذهبية مع كل طلب واستبدلها بخصومات حقيقية وفورية على مشترياتك القادمة'
                  : 'Earn reward points with every purchase and redeem them for instant discounts.'}
              </p>
            </div>
          </div>

          {/* Premium Loyalty Card matching Image 1 styling */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#102a1c] via-[#153825] to-[#0a1e13] text-[#FAF9F5] border border-[#d4af37]/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#e6ca98] text-[#102a1c] flex items-center justify-center shadow-lg shrink-0">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#d4af37] font-bold block">
                    {isAr ? 'برنامج مكافآت هدايا مكة' : 'Hadaya Makkah Rewards'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif text-white mt-0.5">
                    {user.name || (isAr ? 'عميل النخبة' : 'VIP Member')}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 text-[#f3e5ab] text-[10px] font-bold border border-[#d4af37]/40">
                      <Crown className="w-3 h-3 text-[#d4af37]" />
                      <span>{isAr ? 'المستوى الذهبي الملكي' : 'Royal Gold Tier'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 text-center min-w-[200px]">
                <span className="text-[11px] text-[#ded7c8] uppercase block">
                  {isAr ? 'الرصيد المتاح' : 'Available Balance'}
                </span>
                <p className="text-3xl font-black font-mono text-[#e6ca98] mt-1">
                  {loyaltyPoints}
                </p>
                <span className="text-xs text-[#faf7f2]/90 block mt-0.5 font-medium">
                  {isAr ? `تعادل ${(loyaltyPoints * 0.1).toFixed(0)} ر.س خصم` : `Worth ${(loyaltyPoints * 0.1).toFixed(0)} SAR`}
                </span>
              </div>
            </div>
          </div>

          {/* Points Transactions History */}
          <div className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#102a1c]">
              {isAr ? 'سجل حركات واكتساب النقاط' : 'Points Activity Ledger'}
            </h4>

            {customerRewards.points_history && customerRewards.points_history.length > 0 ? (
              <div className="divide-y divide-[#e8e4dc]">
                {customerRewards.points_history.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#102a1c]">
                        {isAr ? item.reason_ar || item.reason : item.reason}
                      </p>
                      <span className="text-[11px] text-[#7a7164]">
                        {new Date(item.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      +{item.points} {isAr ? 'نقطة' : 'pts'}
                    </span>
                  </div>
                ))}
              </div>
            ) : loyaltyPoints > 0 ? (
              <div className="divide-y divide-[#e8e4dc]">
                <div className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#102a1c]">
                      {isAr ? 'مكافأة التقاط السلة الترحيبية' : 'Cart Intercept Welcome Reward'}
                    </p>
                    <span className="text-[11px] text-[#7a7164]">
                      {new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    +{loyaltyPoints} {isAr ? 'نقطة' : 'pts'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#7a7164]">
                {isAr ? 'لا توجد حركات نقاط مسجلة بعد. أضف باقاتك إلى السلة واجمع أول نقاطك!' : 'No points activity recorded yet. Add items to cart to earn your first points!'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Gift Cards & Claimed Coupons */}
      {activeTab === 'gift_cards' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#102a1c]">
                {isAr ? 'كروت الهدايا وأكواد الخصم المفعلة' : 'Gift Cards & Active Coupons'}
              </h2>
              <p className="text-xs text-[#7a7164] mt-0.5">
                {isAr
                  ? 'أكواد الخصم المكتسبة من عروض السلة والمكافآت الترويجية الجاهزة للاستخدام'
                  : 'Claimed coupon vouchers from cart offers ready to be applied.'}
              </p>
            </div>
          </div>

          {customerRewards.claimed_coupons && customerRewards.claimed_coupons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerRewards.claimed_coupons.map((coupon, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl p-5 bg-white border border-[#e8e4dc] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center">
                      <Gift className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                      {isAr ? 'نشط وصالح' : 'Active'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-[#102a1c]">
                      {coupon.discount_percent}% {isAr ? 'خصم فوري' : 'OFF'}
                    </h3>
                    <p className="text-xs text-[#7a7164] mt-1">
                      {isAr ? 'هدية سلة المشتريات الترويجية' : 'Cart Intercept Gift Reward'}
                    </p>
                  </div>

                  <div className="p-3 bg-[#fcfbf7] rounded-2xl border border-dashed border-[#d6cfc0] flex items-center justify-between">
                    <span className="font-mono font-bold text-sm tracking-wider text-[#102a1c]">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-[#102a1c] transition-colors cursor-pointer"
                      title={isAr ? 'نسخ الكود' : 'Copy code'}
                    >
                      {copiedCode === coupon.code ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      applyCouponCode(coupon.code);
                      setCurrentPage('cart');
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#102a1c] hover:bg-[#1a3f2b] text-[#e6ca98] text-xs font-bold transition-all cursor-pointer"
                  >
                    {isAr ? 'تطبيق الكود على السلة الآن' : 'Apply Code to Bag'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#102a1c]/10 text-[#102a1c] flex items-center justify-center mx-auto shadow-inner">
                <Gift className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif text-[#102a1c]">
                  {isAr ? 'لا توجد كروت هدايا نشطة حالياً' : 'No Active Gift Cards Found'}
                </h3>
                <p className="text-xs text-[#8c8275] max-w-md mx-auto mt-1.5 leading-relaxed">
                  {isAr
                    ? 'عندما تضغط على "أضف للسلة" لأول مرة وتختار كارت الهدية، ستظهر جميع أكواد الخصم الترويجية الخاصة بك هنا.'
                    : 'When you interact with our first-click cart gift offer, your vouchers will automatically appear here.'}
                </p>
              </div>
              <button
                onClick={() => setCurrentPage('catalog')}
                className="px-6 py-2.5 rounded-2xl bg-[#102a1c] text-[#e6ca98] text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>{isAr ? 'تسوق الآن واكتشف العروض' : 'Shop Now'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB: Saved Carts Across Devices */}
      {activeTab === 'saved_cart' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#102a1c]">
                {isAr ? 'السلات المحفوظة عبر الأجهزة' : 'Saved Carts Across Devices'}
              </h2>
              <p className="text-xs text-[#7a7164] mt-0.5">
                {isAr
                  ? 'سلاتك التي تم حفظها عند تسجيل الدخول لاستعادتها ومتابعة الشراء في أي وقت'
                  : 'Carts backed up to your account to restore across any browser or mobile device.'}
              </p>
            </div>
          </div>

          {customerRewards.saved_carts && customerRewards.saved_carts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerRewards.saved_carts.map((sc) => (
                <div
                  key={sc.id}
                  className="rounded-3xl p-5 bg-white border border-[#e8e4dc] shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#102a1c]">
                      {sc.product_preview || (isAr ? 'سلة هدايا مكة' : 'Hadaya Cart')}
                    </span>
                    <span className="text-[11px] text-[#7a7164]">
                      {new Date(sc.saved_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>

                  <div className="p-3 bg-[#fcfbf7] rounded-2xl text-xs text-[#555] space-y-1">
                    <p>{isAr ? `تحتوي على ${sc.items?.length || 1} منتجات محفوظة` : `Contains ${sc.items?.length || 1} saved items`}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (sc.items && sc.items.length > 0) {
                        sc.items.forEach((it: any) => {
                          if (it.product) addToCart(it.product, it.quantity || 1);
                        });
                      }
                      setCurrentPage('cart');
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#102a1c] hover:bg-[#1a3f2b] text-[#e6ca98] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'استعادة السلة والمتابعة للشراء' : 'Restore Cart & Proceed'}</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#102a1c]/10 text-[#102a1c] flex items-center justify-center mx-auto shadow-inner">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif text-[#102a1c]">
                  {isAr ? 'لا توجد سلات محفوظة حالياً' : 'No Saved Carts Found'}
                </h3>
                <p className="text-xs text-[#8c8275] max-w-md mx-auto mt-1.5 leading-relaxed">
                  {isAr
                    ? 'عند تفعيل خيار "حفظ السلة"، سيتم حفظ محتويات سلتك تلقائياً هنا عبر جميع أجهزتك.'
                    : 'When you save your cart at first click, it will be safely synchronized here.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Occasion Reminders Calendar */}
      {activeTab === 'occasions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#102a1c]">
                {isAr ? 'مفكرة المناسبات السنوية الذكية' : 'Smart Occasion Reminder Calendar'}
              </h2>
              <p className="text-xs text-[#7a7164] mt-0.5">
                {isAr
                  ? 'سجل مناسبات أحبائك وسيقوم المتجر بتذكيرك واقتراح أجمل الباقات قبلها بيومين'
                  : 'Save special milestones and our concierge will remind you ahead with custom gift curation.'}
              </p>
            </div>

            <button
              onClick={() => setShowAddOccasion(!showAddOccasion)}
              className="px-4 py-2 rounded-xl bg-[#102a1c] text-[#FAF9F5] text-xs font-bold flex items-center gap-1.5 hover:bg-[#1a3f2b] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة مناسبة جديدة' : 'Add Occasion'}</span>
            </button>
          </div>

          {/* Form to add occasion */}
          {showAddOccasion && (
            <form onSubmit={handleCreateOccasion} className="bg-[#FAF9F5] border border-[#102a1c]/30 rounded-3xl p-6 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-[#102a1c]">
                {isAr ? 'إضافة مناسبة للتذكير التلقائي' : 'Add New Occasion Milestone'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#1a1f1b] block mb-1">{isAr ? 'عنوان المناسبة' : 'Title'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: عيد ميلاد الغالية' : 'e.g. Birthday'}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#102a1c]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1a1f1b] block mb-1">{isAr ? 'التاريخ' : 'Date'}</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#102a1c]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1a1f1b] block mb-1">{isAr ? 'اسم الشخص' : 'Recipient'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'سارة' : 'Sarah'}
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#102a1c]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1a1f1b] block mb-1">{isAr ? 'صلة القرابة' : 'Relationship'}</label>
                  <select
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#102a1c]"
                  >
                    <option value="الزوجة">{isAr ? 'الزوجة' : 'Wife'}</option>
                    <option value="الأم">{isAr ? 'الأم' : 'Mother'}</option>
                    <option value="الأب">{isAr ? 'الأب' : 'Father'}</option>
                    <option value="الأخت">{isAr ? 'الأخت' : 'Sister'}</option>
                    <option value="الأخ">{isAr ? 'الأخ' : 'Brother'}</option>
                    <option value="صديق">{isAr ? 'صديق مقرب' : 'Friend'}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOccasion(false)}
                  className="px-4 py-1.5 text-xs text-[#555] hover:text-[#102a1c]"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#102a1c] text-white text-xs font-bold"
                >
                  {isAr ? 'حفظ المناسبة' : 'Save Occasion'}
                </button>
              </div>
            </form>
          )}

          {/* Occasions List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedOccasions.map((occ) => (
              <div
                key={occ.id}
                className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-5 shadow-sm space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#102a1c]/10 text-[#102a1c] font-semibold">
                    {occ.relationship}
                  </span>
                  <button
                    onClick={() => removeOccasion(occ.id)}
                    className="text-[#999] hover:text-[#8b263e] transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-[#102a1c] font-serif">
                  {occ.title}
                </h3>
                <p className="text-xs text-[#555]">
                  {isAr ? 'المهدى إليه:' : 'For:'} <span className="font-semibold text-[#1a1f1b]">{occ.recipient}</span>
                </p>

                <div className="pt-2 border-t border-[#f0ede6] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#102a1c] font-mono font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-[#e6ca98]" />
                    <span>{occ.date}</span>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage('catalog');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3 py-1 rounded-lg bg-[#102a1c] text-white text-[10px] font-bold hover:bg-[#1a3f2b]"
                  >
                    {isAr ? 'حجز باقة الورد' : 'Book Flowers'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#102a1c]">
                {isAr ? 'دفتر العناوين المحفوظة في مكة والمدن' : 'Saved Delivery Destinations'}
              </h2>
            </div>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="px-4 py-2 rounded-xl bg-[#102a1c] text-[#FAF9F5] text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة عنوان جديد' : 'Add New Address'}</span>
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleCreateAddress} className="bg-[#FAF9F5] border border-[#102a1c]/30 rounded-3xl p-6 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-[#102a1c]">{isAr ? 'إضافة موقع توصيل جديد' : 'Add Destination'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">{isAr ? 'تسمية العنوان' : 'Label'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: فيلا مكة العوالي' : 'e.g. Mecca Villa'}
                    value={newAddrTitle}
                    onChange={(e) => setNewAddrTitle(e.target.value)}
                    className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">{isAr ? 'الحي' : 'District'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'حي الشوقية' : 'District name'}
                    value={newAddrDistrict}
                    onChange={(e) => setNewAddrDistrict(e.target.value)}
                    className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">{isAr ? 'الشارع والمعلم' : 'Street Details'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'شارع عبدالله خياط' : 'Street details'}
                    value={newAddrStreet}
                    onChange={(e) => setNewAddrStreet(e.target.value)}
                    className="w-full bg-white border border-[#d6cfc0] rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-4 py-1.5 text-xs text-[#555]"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#102a1c] text-white text-xs font-bold">
                  {isAr ? 'حفظ العنوان' : 'Save Address'}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-5 shadow-sm space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#102a1c]" />
                    <h3 className="text-sm font-bold text-[#102a1c]">{addr.title}</h3>
                  </div>
                  <button
                    onClick={() => removeAddress(addr.id)}
                    className="text-[#999] hover:text-[#8b263e] p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#1a1f1b] font-medium">{addr.city} - {addr.district}</p>
                <p className="text-[11px] text-[#7a7164]">{addr.street}</p>
                <p className="text-[11px] text-[#8c8275]">{addr.recipientName} ({addr.recipientPhone})</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-serif text-[#102a1c]">
              {isAr ? 'باقاتي وهداياي المفضلة' : 'My Saved Wishlist'}
            </h2>
          </div>

          {wishlistProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {wishlistProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-[#7d7568]">
              {isAr ? 'لم تقم بحفظ أي باقات في المفضلة بعد.' : 'No saved bouquets in wishlist yet.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
