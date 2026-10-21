import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Package,
  Car,
  MapPin,
  LogOut,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  Calendar,
  ExternalLink,
  Plus,
  Trash2,
  KeyRound,
  ArrowRight,
  Check,
  Award,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import type { Order } from '../../../types';
import { CAR_BRANDS, CAR_MODELS_MAP, BLECO_STORE_INFO, CarModelDef } from '../../../data/blecoStoreData';
import { CustomerLoyaltyProfileSection } from '../../../components/storefront/CustomerLoyaltyProfileSection';


export interface TransportCustomerSession {
  storeId: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  garageBrand?: string;
  garageModel?: string;
  garageYear?: string;
  savedAddresses?: Array<{
    id: string;
    label: string;
    city: string;
    district: string;
    street: string;
  }>;
  loggedInAt: string;
}

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr?: boolean;
  onApplyGarageVehicle?: (brand: string, model: string, year: string) => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  isAr = true,
  onApplyGarageVehicle
}) => {
  const { activeStore, currentOrders } = useTenant();
  const { money } = usePrefs();

  const sessionKey = `unityteck_transport_customer_${activeStore?.id || 'store-bleco'}`;

  // Session state
  const [customer, setCustomer] = useState<TransportCustomerSession | null>(() => {
    try {
      const raw = localStorage.getItem(sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Active tab inside modal
  const [activeTab, setActiveTab] = useState<'orders' | 'garage' | 'addresses' | 'loyalty'>('orders');

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('+966 5');
  const [emailInput, setEmailInput] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('583921');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Garage states
  const [editBrand, setEditBrand] = useState(customer?.garageBrand || 'Toyota');
  const [editModel, setEditModel] = useState(customer?.garageModel || 'Land Cruiser');
  const [editYear, setEditYear] = useState(customer?.garageYear || '2024');

  // New address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrCity, setAddrCity] = useState('الرياض');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrStreet, setAddrStreet] = useState('');

  // Persist session
  const saveSession = (sess: TransportCustomerSession | null) => {
    setCustomer(sess);
    if (sess) {
      localStorage.setItem(sessionKey, JSON.stringify(sess));
    } else {
      localStorage.removeItem(sessionKey);
    }
  };

  // Google 1-Click Login
  const handleGoogleSignIn = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const defaultEmail = emailInput.trim() || 'customer@gmail.com';
      const defaultName = nameInput.trim() || (isAr ? 'عميل مميز' : 'VIP Customer');
      const newSession: TransportCustomerSession = {
        storeId: activeStore?.id || 'store-bleco',
        id: `google-${Date.now().toString().slice(-6)}`,
        name: defaultName,
        email: defaultEmail,
        phone: phoneInput.trim().length > 7 ? phoneInput.trim() : '+966 55 000 0000',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
        garageBrand: 'Toyota',
        garageModel: 'Land Cruiser',
        garageYear: '2024',
        savedAddresses: [
          {
            id: 'addr-1',
            label: isAr ? 'المنزل' : 'Home',
            city: isAr ? 'الرياض' : 'Riyadh',
            district: isAr ? 'حي النرجس' : 'Al Narjis',
            street: isAr ? 'طريق الملك سلمان' : 'King Salman Rd',
          }
        ],
        loggedInAt: new Date().toISOString(),
      };
      saveSession(newSession);
      setIsSubmitting(false);
      setAuthMessage(isAr ? 'تم تسجيل الدخول بنجاح!' : 'Signed in successfully!');
      setTimeout(() => setAuthMessage(null), 3000);
    }, 600);
  };

  // OTP Request handler
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim() || phoneInput.length < 8) {
      setAuthMessage(isAr ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(code);
      setOtpStep(true);
      setIsSubmitting(false);
      setAuthMessage(isAr ? `رمز التحقق المرسل هو: ${code}` : `Your verification code is: ${code}`);
    }, 500);
  };

  // Verify OTP handler
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== generatedOtp && otpCode !== '123456') {
      setAuthMessage(isAr ? 'رمز التحقق غير صحيح، حاول مرة أخرى' : 'Invalid code, please try again');
      return;
    }
    const newSession: TransportCustomerSession = {
      storeId: activeStore?.id || 'store-bleco',
      id: `cust-${Date.now().toString().slice(-6)}`,
      name: nameInput.trim() || (isAr ? 'عميل بليكو المتميز' : 'Valued Customer'),
      email: emailInput.trim() || 'customer@bleco.sa',
      phone: phoneInput.trim(),
      garageBrand: 'Toyota',
      garageModel: 'Land Cruiser',
      garageYear: '2024',
      savedAddresses: [
        {
          id: 'addr-1',
          label: isAr ? 'المنزل الرئيسي' : 'Main Residence',
          city: isAr ? 'الرياض' : 'Riyadh',
          district: isAr ? 'حي حطين' : 'Hittin',
          street: isAr ? 'شارع التحلية' : 'Tahlia St',
        }
      ],
      loggedInAt: new Date().toISOString(),
    };
    saveSession(newSession);
    setOtpStep(false);
    setOtpCode('');
    setAuthMessage(isAr ? 'أهلاً بك! تم تسجيل الدخول بنجاح' : 'Welcome! You have signed in');
    setTimeout(() => setAuthMessage(null), 3000);
  };

  // Logout
  const handleLogout = () => {
    saveSession(null);
    setOtpStep(false);
    setAuthMessage(isAr ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully');
    setTimeout(() => setAuthMessage(null), 2500);
  };

  // Filter store orders for this customer
  const customerOrders: Order[] = useMemo(() => {
    if (!customer) return [];
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '').slice(-9);
    const cleanEmail = (customer.email || '').toLowerCase().trim();

    return (currentOrders || []).filter((o: Order) => {
      const oPhone = (o.customerPhone || '').replace(/[^0-9]/g, '');
      const oEmail = (o.customerEmail || '').toLowerCase().trim();
      const phoneMatch = cleanPhone && oPhone.includes(cleanPhone);
      const emailMatch = cleanEmail && oEmail === cleanEmail;
      return phoneMatch || emailMatch;
    });
  }, [currentOrders, customer]);

  // Save Garage updates
  const handleSaveGarage = () => {
    if (!customer) return;
    const updated: TransportCustomerSession = {
      ...customer,
      garageBrand: editBrand,
      garageModel: editModel,
      garageYear: editYear,
    };
    saveSession(updated);
    if (onApplyGarageVehicle) {
      onApplyGarageVehicle(editBrand, editModel, editYear);
    }
    setAuthMessage(isAr ? 'تم حفظ السيارة وتطبيقها على تصفية المتجر!' : 'Vehicle saved and applied to filter!');
    setTimeout(() => setAuthMessage(null), 3000);
  };

  // Add Address handler
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !addrDistrict.trim() || !addrStreet.trim()) return;
    const newAddr = {
      id: `addr-${Date.now()}`,
      label: addrLabel.trim() || (isAr ? 'عنوان إضافي' : 'Additional Address'),
      city: addrCity,
      district: addrDistrict.trim(),
      street: addrStreet.trim(),
    };
    const updated: TransportCustomerSession = {
      ...customer,
      savedAddresses: [...(customer.savedAddresses || []), newAddr],
    };
    saveSession(updated);
    setShowAddAddress(false);
    setAddrLabel('');
    setAddrDistrict('');
    setAddrStreet('');
    setAuthMessage(isAr ? 'تمت إضافة العنوان بنجاح' : 'Address added successfully');
    setTimeout(() => setAuthMessage(null), 2500);
  };

  // Remove Address handler
  const handleRemoveAddress = (id: string) => {
    if (!customer) return;
    const updated: TransportCustomerSession = {
      ...customer,
      savedAddresses: (customer.savedAddresses || []).filter(a => a.id !== id),
    };
    saveSession(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#120224] text-white rounded-3xl border border-[#d5a027]/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#16032e] via-[#210545] to-[#16032e] border-b border-[#d5a027]/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#d5a027]/20 border border-[#d5a027]/40 flex items-center justify-center text-[#f6c344] shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{customer ? customer.name : (isAr ? 'بوابة العميل المتميز' : 'VIP Customer Portal')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d5a027]/20 text-[#f6c344] font-black border border-[#d5a027]/40">
                  {isAr ? 'بليكو VIP' : 'BLECO VIP'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                {customer 
                  ? (customer.phone || customer.email) 
                  : (isAr ? 'متابعة الطلبات، إدارة مرآب سيارتك وعناوين الشحن' : 'Track orders, vehicle garage, and addresses')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Notification Banner */}
        {authMessage && (
          <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{authMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-5">
          {!customer ? (
            /* ─── AUTHENTICATION VIEW (LOGIN / REGISTER) ─── */
            <div className="space-y-5 max-w-md mx-auto py-2">
              <div className="text-center space-y-1">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isAr ? 'تسجيل الدخول إلى حسابك' : 'Sign in to your account'}
                </h3>
                <p className="text-xs text-slate-300">
                  {isAr 
                    ? 'سجل دخولك بنقرة واحدة بحساب Google أو عبر رقم الهاتف لمتابعة طلبياتك وتفصيل سيارتك.' 
                    : 'Sign in to access your custom vehicle specs and track active orders.'}
                </p>
              </div>

              {/* 1-Click Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg active:scale-98"
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isAr ? 'المتابعة بنقرة واحدة باستخدام Google' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {isAr ? 'أو عبر رقم الجوال والرمز' : 'OR VIA MOBILE & OTP'}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Mobile OTP Form */}
              {!otpStep ? (
                <form onSubmit={handleRequestOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                      {isAr ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder={isAr ? 'فهد العتيبي' : 'e.g. Fahad Al-Otaibi'}
                        className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#d5a027] text-white text-xs outline-none transition-colors"
                      />
                      <User className={`w-4 h-4 text-slate-400 absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                      {isAr ? 'رقم الجوال (لإرسال كود التحقق)' : 'Mobile Number (SMS verification)'}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+966 50 123 4567"
                        required
                        className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#d5a027] text-white text-xs outline-none transition-colors font-mono"
                        dir="ltr"
                      />
                      <Phone className={`w-4 h-4 text-slate-400 absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl btn-bashayer-gold font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:brightness-110 active:scale-98 transition-all"
                  >
                    <span>{isSubmitting ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إرسال رمز التحقق (OTP)' : 'Send Verification OTP')}</span>
                    {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
                  <div className="p-3 rounded-xl bg-[#d5a027]/10 border border-[#d5a027]/30 text-center space-y-1">
                    <p className="text-xs text-slate-200">
                      {isAr ? `أدخل الرمز المكون من 6 أرقام المرسل إلى` : 'Enter the 6-digit code sent to'}
                    </p>
                    <p className="text-xs font-mono font-black text-[#f6c344]" dir="ltr">
                      {phoneInput}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5 text-center">
                      {isAr ? 'رمز التحقق (أدخل 123456 أو الرمز التجريبي)' : 'Verification Code (Use 123456 or sent code)'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="• • • • • •"
                      className="w-full h-12 text-center text-lg font-mono font-black tracking-widest rounded-xl bg-white/5 border border-[#d5a027] text-[#f6c344] outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="w-1/3 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                    >
                      {isAr ? 'تعديل الرقم' : 'Edit Number'}
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 h-11 rounded-xl btn-bashayer-gold font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isAr ? 'تأكيد ودخول' : 'Verify & Enter'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ─── LOGGED IN PROFILE DASHBOARD ─── */
            <div className="space-y-5">
              {/* Profile Top Bar Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'orders'
                        ? 'bg-[#d5a027] text-[#120224] shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{isAr ? 'طلباتي' : 'Orders'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                      {customerOrders.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('garage')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'garage'
                        ? 'bg-[#d5a027] text-[#120224] shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>{isAr ? 'كراج سيارتي' : 'My Garage'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('addresses')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'addresses'
                        ? 'bg-[#d5a027] text-[#120224] shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isAr ? 'عناويني' : 'Addresses'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('loyalty')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'loyalty'
                        ? 'bg-[#d5a027] text-[#120224] shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{isAr ? 'بطاقة الولاء والعملات' : 'Loyalty & Coins'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تسجيل الخروج' : 'Log Out'}</span>
                </button>
              </div>

              {/* TAB 1: MY ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {customerOrders.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <Package className="w-10 h-10 mx-auto text-slate-500" />
                      <h4 className="text-sm font-black text-white">
                        {isAr ? 'لا توجد طلبات مسجلة بهذا الرقم حالياً' : 'No orders found for this account'}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {isAr 
                          ? 'عند قيامك بطلب تفصيل مقاعد أو أرضيات ليزر ستظهر تفاصيل وحالة الشحن هنا فوراً.' 
                          : 'Custom floor mats and seat cover orders will appear here automatically.'}
                      </p>
                    </div>
                  ) : (
                    customerOrders.map((order: Order) => {
                      const isDelivered = order.status === 'delivered';
                      const isShipped = order.status === 'shipped';
                      return (
                        <div 
                          key={order.id}
                          className="p-4 rounded-2xl bg-[#16032e]/90 border border-[#d5a027]/25 hover:border-[#d5a027]/50 transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-[#f6c344]">
                                #{order.id.slice(-6).toUpperCase()}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(order.date || (order as any).createdAt || Date.now()).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                isDelivered 
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                  : isShipped 
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}>
                                {isAr 
                                  ? (isDelivered ? 'تم التوصيل' : isShipped ? 'جاري الشحن والتركيب' : 'قيد التفصيل والتجهيز') 
                                  : order.status}
                              </span>
                              <span className="text-xs font-black text-white">
                                {money(order.total)}
                              </span>
                            </div>
                          </div>

                          {/* Ordered items preview */}
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            {order.items?.map((it: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                                <span className="truncate max-w-[70%]">
                                  {it.product?.name || (isAr ? 'تفصيل فاخر بليكو' : 'Bleco Custom Item')}
                                </span>
                                <span className="font-mono text-[11px] text-slate-400">
                                  x{it.quantity} · {money(it.price * it.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* WhatsApp inquiry button */}
                          <div className="pt-2 flex justify-end">
                            <a
                              href={`https://wa.me/${BLECO_STORE_INFO.whatsapp}?text=${encodeURIComponent(
                                `مرحباً بليكو، أرغب بالاستفسار عن طلبي رقم: #${order.id.slice(-6).toUpperCase()}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-colors"
                            >
                              <span>{isAr ? 'تتبع الطلب عبر واتساب المتجر' : 'Track via WhatsApp'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: MY GARAGE */}
              {activeTab === 'garage' && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#d5a027]/20 border border-[#d5a027]/40 flex items-center justify-center text-[#f6c344]">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">
                        {isAr ? 'مرآب سيارتك الخاص' : 'Your Garage Vehicle'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {isAr 
                          ? 'حدد نوع وموديل سيارتك ليتم تصفية منتجات المتجر المتطابقة معها تلقائياً بنسبة 100%.' 
                          : 'Set your car brand and model for instant 100% laser fit filtering.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Brand Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {isAr ? 'الشركة المصنعة (Brand)' : 'Brand'}
                      </label>
                      <select
                        value={editBrand}
                        onChange={(e) => {
                          setEditBrand(e.target.value);
                          const models = CAR_MODELS_MAP[e.target.value] || [];
                          if (models.length > 0) setEditModel(models[0].modelEn);
                        }}
                        className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none focus:border-[#d5a027]"
                      >
                        {CAR_BRANDS.map(b => (
                          <option key={b.id} value={b.name} className="bg-[#120224] text-white">
                            {isAr ? b.nameAr : b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Model Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {isAr ? 'الموديل (Model)' : 'Model'}
                      </label>
                      <select
                        value={editModel}
                        onChange={(e) => setEditModel(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none focus:border-[#d5a027]"
                      >
                        {(CAR_MODELS_MAP[editBrand] || []).map((m: CarModelDef) => (
                          <option key={m.modelEn} value={m.modelEn} className="bg-[#120224] text-white">
                            {isAr ? m.modelAr : m.modelEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {isAr ? 'سنة الصنع (Year)' : 'Year'}
                      </label>
                      <select
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none focus:border-[#d5a027]"
                      >
                        {Array.from({ length: 15 }, (_, i) => 2026 - i).map(yr => (
                          <option key={yr} value={String(yr)} className="bg-[#120224] text-white">
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveGarage}
                      className="px-5 py-2.5 rounded-xl btn-bashayer-gold font-black text-xs flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isAr ? 'حفظ وتطبيق التصفية على المتجر' : 'Save & Apply Filter'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: SAVED ADDRESSES */}
              {activeTab === 'addresses' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#f6c344]" />
                      <span>{isAr ? 'عناوين التوصيل والاستلام' : 'Delivery Addresses'}</span>
                    </h4>

                    <button
                      type="button"
                      onClick={() => setShowAddAddress(prev => !prev)}
                      className="text-xs font-bold text-[#f6c344] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إضافة عنوان جديد' : 'Add New Address'}</span>
                    </button>
                  </div>

                  {/* Add Address Form */}
                  {showAddAddress && (
                    <form onSubmit={handleAddAddress} className="p-4 rounded-2xl bg-white/5 border border-[#d5a027]/30 space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            {isAr ? 'اسم العنوان (مثال: البيت)' : 'Label'}
                          </label>
                          <input
                            type="text"
                            value={addrLabel}
                            onChange={(e) => setAddrLabel(e.target.value)}
                            placeholder={isAr ? 'المنزل' : 'Home'}
                            className="w-full h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            {isAr ? 'المدينة' : 'City'}
                          </label>
                          <input
                            type="text"
                            value={addrCity}
                            onChange={(e) => setAddrCity(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            {isAr ? 'الحي' : 'District'}
                          </label>
                          <input
                            type="text"
                            value={addrDistrict}
                            onChange={(e) => setAddrDistrict(e.target.value)}
                            placeholder={isAr ? 'حي النرجس' : 'District'}
                            required
                            className="w-full h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          {isAr ? 'الشارع / رقم المبنى' : 'Street / Building'}
                        </label>
                        <input
                          type="text"
                          value={addrStreet}
                          onChange={(e) => setAddrStreet(e.target.value)}
                          placeholder={isAr ? 'شارع أنس بن مالك، فيلا 12' : 'Street address'}
                          required
                          className="w-full h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddAddress(false)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold cursor-pointer"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-xl btn-bashayer-gold text-xs font-black cursor-pointer"
                        >
                          {isAr ? 'حفظ العنوان' : 'Save Address'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Saved Address Cards */}
                  <div className="space-y-2">
                    {(customer.savedAddresses || []).map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#d5a027]/15 border border-[#d5a027]/30 flex items-center justify-center text-[#f6c344] shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-white flex items-center gap-2">
                              <span>{addr.label}</span>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/10 text-slate-300">
                                {addr.city}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {addr.district} - {addr.street}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAddress(addr.id)}
                          className="p-2 text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
                          title={isAr ? 'حذف العنوان' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: DIGITAL LOYALTY CARD & COIN REWARDS */}
              {activeTab === 'loyalty' && (
                <div className="space-y-4">
                  <CustomerLoyaltyProfileSection
                    storeId={activeStore?.id || 'store-bleco'}
                    customerId={customer?.phone || customer?.email || 'customer'}
                    customerName={customer?.name}
                    customerEmail={customer?.email}
                    customerPhone={customer?.phone}
                    className="bg-[#190432] border-[#d5a027]/30 text-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
