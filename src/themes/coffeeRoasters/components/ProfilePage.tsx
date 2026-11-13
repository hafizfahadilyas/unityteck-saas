import React, { useEffect, useState } from 'react';
import { useClerk, useSignIn, useSignUp, useUser } from '@clerk/clerk-react';
import { isClerkConfigured } from '../../../auth/clerkSession';
import {
  establishStorefrontSession,
  rememberPendingCustomer,
  sendClerkEmailCode,
  startClerkGoogle,
  verifyClerkEmailCode,
} from '../../../auth/storefrontCustomer';
import {
  getStoredGoogleClientId,
  hasRealGoogleClientId,
  preloadCustomerGoogleScript,
  startCustomerGoogleSignIn,
} from '../../../utils/googleRealAuth';
import { useCart } from '../context/CartContext';
import { cartChoiceLine } from '../cartLine';
import {
  Package,
  Award,
  LogOut,
  CheckCircle2,
  Truck,
  Coffee,
  Mail,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

import { useTenant } from '../../../context/TenantContext';
import { CustomerLoyaltyProfileSection } from '../../../components/storefront/CustomerLoyaltyProfileSection';
import { fetchStorefrontLoyaltyBalanceApi } from '../../../api/tenantApi';
import { readSfCustomer } from '../../flowersPremium/sfCustomerSession';

type ClerkCustomerBridge = {
  isLoaded: boolean;
  signIn: {
    create: (params: { identifier: string }) => Promise<{ supportedFirstFactors?: Array<{ strategy?: string; emailAddressId?: string }> | null }>;
    prepareFirstFactor: (params: { strategy: 'email_code'; emailAddressId: string }) => Promise<unknown>;
    attemptFirstFactor: (params: { strategy: 'email_code'; code: string }) => Promise<{ status?: string | null; createdSessionId?: string | null }>;
    authenticateWithRedirect: (params: {
      strategy: 'oauth_google';
      redirectUrl: string;
      redirectUrlComplete: string;
    }) => Promise<void>;
  } | null | undefined;
  signUp: {
    create: (params: { emailAddress: string }) => Promise<unknown>;
    prepareEmailAddressVerification: (params: { strategy: 'email_code' }) => Promise<unknown>;
    attemptEmailAddressVerification: (params: { code: string }) => Promise<{ status?: string | null; createdSessionId?: string | null }>;
  } | null | undefined;
  setActive: ((params: { session: string }) => Promise<void>) | undefined;
  setSignUpActive: ((params: { session: string }) => Promise<void>) | undefined;
  isSignedIn: boolean;
  email: string;
  name: string;
  signOut: (opts?: { redirectUrl?: string }) => Promise<void>;
};

function ProfilePageBody({ clerk }: { clerk: ClerkCustomerBridge | null }) {
  const { user, logoutUser, language, showToast, lastOrder, navigateTo } = useCart();
  const { activeStore, currentOrders } = useTenant();

  const [emailInput, setEmailInput] = useState('');
  const [emailMode, setEmailMode] = useState<'signIn' | 'signUp'>('signIn');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authErrorCode, setAuthErrorCode] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(user.points || 0);
  const sfCustomer = activeStore?.id ? readSfCustomer(activeStore.id) : null;

  const storeDisplayName = activeStore?.name || (language === 'AR' ? 'متجر القهوة المختصة' : 'Specialty Coffee Roasters');
  const isAr = language === 'AR';

  useEffect(() => {
    preloadCustomerGoogleScript();
  }, []);

  useEffect(() => {
    if (!activeStore?.id || !sfCustomer?.customerId || !user.isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStorefrontLoyaltyBalanceApi(activeStore.id, sfCustomer.customerId);
        if (cancelled) return;
        setLoyaltyPoints(Number(data.loyalty_points || 0));
      } catch {
        /* keep existing points — never invent */
      }
    })();
    const onBalance = (e: Event) => {
      const d = (e as CustomEvent<{ storeId?: string; points?: number }>).detail;
      if (d?.storeId === activeStore.id && typeof d.points === 'number') {
        setLoyaltyPoints(d.points);
      }
    };
    window.addEventListener('unityteck-loyalty-balance', onBalance);
    return () => {
      cancelled = true;
      window.removeEventListener('unityteck-loyalty-balance', onBalance);
    };
  }, [activeStore?.id, sfCustomer?.customerId, user.isLoggedIn]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAuthErrorCode('EMAIL_INVALID');
      return;
    }
    if (!clerk?.signIn || !clerk.signUp) {
      setAuthErrorCode('EMAIL_NOT_READY');
      return;
    }
    setIsSubmitting(true);
    setAuthErrorCode('');
    try {
      const mode = await sendClerkEmailCode(clerk.signIn, clerk.signUp, email);
      setEmailMode(mode);
      setOtpStep(true);
      showToast(isAr ? 'تم إرسال رمز التحقق إلى بريدك.' : 'Verification code sent to your email.');
    } catch {
      setAuthErrorCode('EMAIL_SEND_FAILED');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerk?.signIn || !clerk.signUp || !clerk.setActive || !clerk.setSignUpActive) return;
    setIsSubmitting(true);
    setAuthErrorCode('');
    try {
      await verifyClerkEmailCode(
        emailMode,
        otpCode.trim(),
        clerk.signIn,
        clerk.signUp,
        clerk.setActive,
        clerk.setSignUpActive,
      );
      if (!activeStore?.id) {
        setAuthErrorCode('CODE_WRONG');
        return;
      }
      establishStorefrontSession({
        storeId: activeStore.id,
        name: '',
        email: emailInput.trim(),
        phone: '',
        city: '',
        source: 'email',
      });
      setOtpStep(false);
      setOtpCode('');
      void clerk.signOut({ redirectUrl: window.location.href }).catch(() => undefined);
    } catch {
      setAuthErrorCode('CODE_WRONG');
    } finally {
      setIsSubmitting(false);
    }
  };

  const googleErrorText = (code: string) => {
    if (isAr) {
      if (code === 'GOOGLE_SCRIPT_LOADING') return 'خدمة جوجل ما زالت تُحمَّل. أعد المحاولة.';
      if (code === 'GOOGLE_CANCELLED') return 'تم إلغاء تسجيل الدخول عبر جوجل.';
      if (code === 'GOOGLE_NO_EMAIL') return 'جوجل لم يُرجع بريداً لهذا الحساب.';
      if (code === 'GOOGLE_NOT_READY') return 'تسجيل جوجل غير جاهز بعد. أعد المحاولة.';
      return 'تعذر فتح تسجيل جوجل على هذا النطاق. حاول مرة أخرى.';
    }
    if (code === 'GOOGLE_SCRIPT_LOADING') return 'Google is still loading. Try again.';
    if (code === 'GOOGLE_CANCELLED') return 'Google sign-in was cancelled.';
    if (code === 'GOOGLE_NO_EMAIL') return 'Google did not return an email for this account.';
    if (code === 'GOOGLE_NOT_READY') return 'Google sign-in is not ready yet. Try again.';
    return 'Could not open Google sign-in on this domain. Try again.';
  };

  const authError = (() => {
    if (!authErrorCode) return '';
    if (authErrorCode === 'EMAIL_INVALID') return isAr ? 'أدخل بريداً إلكترونياً صحيحاً.' : 'Enter a valid email address.';
    if (authErrorCode === 'EMAIL_NOT_READY') return isAr ? 'إرسال رمز التحقق غير جاهز.' : 'Email verification is not ready.';
    if (authErrorCode === 'EMAIL_SEND_FAILED') return isAr ? 'تعذر إرسال رمز التحقق.' : 'Could not send the verification code.';
    if (authErrorCode === 'CODE_WRONG') return isAr ? 'الرمز غير صحيح.' : 'The code is wrong.';
    if (authErrorCode === 'RESEND_FAILED') return isAr ? 'تعذر إعادة الإرسال.' : 'Could not resend the code.';
    return googleErrorText(authErrorCode);
  })();

  const openClerkGoogle = (storeId: string) => {
    const signIn = clerk?.signIn;
    if (!clerk?.isLoaded || !signIn) {
      setIsSubmitting(false);
      setAuthErrorCode('GOOGLE_NOT_READY');
      return;
    }
    rememberPendingCustomer({
      storeId,
      name: '',
      email: emailInput.trim(),
      phone: '',
      city: '',
      source: 'google',
    });
    void startClerkGoogle(signIn, 'profile').catch(() => {
      clearPendingOnFail();
      setIsSubmitting(false);
      setAuthErrorCode('GOOGLE_FAILED');
    });
  };

  const handleGoogleSignIn = () => {
    setAuthErrorCode('');
    const storeId = activeStore?.id;
    if (!storeId) {
      setAuthErrorCode('GOOGLE_FAILED');
      return;
    }
    setIsSubmitting(true);
    const clientId = getStoredGoogleClientId();
    if (hasRealGoogleClientId(clientId)) {
      startCustomerGoogleSignIn(clientId, {
        onSuccess: (profile) => {
          establishStorefrontSession({
            storeId,
            name: profile.name || '',
            email: profile.email,
            phone: '',
            city: '',
            source: 'google',
          });
          setIsSubmitting(false);
        },
        onError: (code) => {
          if (code === 'GOOGLE_CANCELLED' || code === 'GOOGLE_NO_EMAIL') {
            setIsSubmitting(false);
            setAuthErrorCode(code);
            return;
          }
          openClerkGoogle(storeId);
        },
      });
      return;
    }
    openClerkGoogle(storeId);
  };

  const clearPendingOnFail = () => {
    try {
      sessionStorage.removeItem('unityteck_sf_customer_pending');
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    try {
      const s = sessionStorage.getItem('coffee_profile_section') || 'account';
      sessionStorage.removeItem('coffee_profile_section');
      const el = document.getElementById(`coffee-profile-${s}`);
      if (el) {
        window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Real store orders for this customer — this store_id only
  const matchedTenantOrders = (currentOrders || [])
    .filter((o) => !o.storeId || !activeStore?.id || o.storeId === activeStore.id)
    .filter(
      (o) =>
        (user.phone && o.customerPhone && o.customerPhone.includes(user.phone)) ||
        (user.email && o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase()),
    )
    .map((o: any) => ({
      id: o.orderNumber || o.id,
      orderNumber: o.orderNumber || o.id,
      date: o.date || new Date().toLocaleDateString('en-GB'),
      paymentStatus: o.paymentStatus || 'Pending',
      items: (o.items || []).map((it: any) => ({
        id: it.id || 'item',
        productId: it.sku || it.id,
        productName: it.name,
        unitPrice: it.price || 0,
        quantity: it.quantity || 1,
        image: it.image || '/images/coffee_hero_flagship_machine_1791218907782.jpg',
        selectedColor: { name: 'Standard', nameAr: 'قياسي', hex: '#333', image: it.image || '' },
        selectedStorage: { capacity: 'Standard', ram: '', priceDelta: 0 },
      })),
      total: o.total || 0,
      paymentMethod: String(o.paymentMethod || 'mada'),
      shippingAddress: {
        name: o.customerName || user.name,
        phone: o.customerPhone || user.phone,
        city: o.deliveryLocation || '',
        district: '',
        street: '',
      },
      status: o.status || 'Confirmed',
    }));

  const allOrders = [
    ...(lastOrder ? [lastOrder] : []),
    ...(user.orders || []),
    ...matchedTenantOrders,
  ].filter((v, i, a) => a.findIndex((t) => t.orderNumber === v.orderNumber) === i);

  const pendingPaymentOrders = allOrders.filter((o: any) => {
    const ps = String(o.paymentStatus || o.status || '').toLowerCase();
    return ps === 'pending' || ps === 'unpaid' || ps === 'awaiting_payment';
  });

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-white text-neutral-900 text-start selection:bg-neutral-900 selection:text-white">
        <div className="max-w-md w-full bg-[#F8F9FA] rounded-3xl p-6 sm:p-8 space-y-6 border border-neutral-100 shadow-sm">
          {/* Header Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-md">
              <Coffee className="w-7 h-7" />
            </div>
            <h2 className="honor-heading text-xl sm:text-2xl font-black text-neutral-900">
              {language === 'AR'
                ? `تسجيل الدخول إلى${storeDisplayName}`
                : `Sign in to ${storeDisplayName}`}
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {language === 'AR'
                ? 'سجل دخولك بنقرة واحدة بحساب جوجل أو عبر رمز التحقق للبريد الإلكتروني للوصول إلى طلباتك وفواتيرك.'
                : 'Sign in with Google or email to track orders, download invoices, and redeem rewards.'}
            </p>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            {/* Official Google G Icon */}
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {language === 'AR'
                ? 'المتابعة والتسجيل باستخدام جوجل'
                : 'Continue with Google Account'}
            </span>
          </button>
          {authError ? (
            <p className="text-[11px] font-semibold text-red-600 text-center" role="alert">
              {authError}
            </p>
          ) : null}

          {/* Divider with OR */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-[11px] font-semibold text-neutral-400 uppercase">
              {language === 'AR' ? 'أو عبر البريد الإلكتروني' : 'or with email'}
            </span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Step 1: Request OTP */}
          {!otpStep ? (
            <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {language === 'AR' ? 'البريد الإلكتروني' : 'Email address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 rtl:left-auto rtl:right-3" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white rounded-xl py-3 pl-9 pr-3 rtl:pl-3 rtl:pr-9 text-neutral-900 border border-neutral-200 focus:border-black focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold text-xs rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {isSubmitting
                  ? language === 'AR' ? 'جارٍ الإرسال...' : 'Sending...'
                  : language === 'AR' ? 'إرسال رمز التحقق' : 'Send verification code'}
              </button>
            </form>
          ) : (
            /* Step 2: Enter OTP Code */
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                {language === 'AR'
                  ? `تم إرسال رمز التحقق إلى${emailInput}. راجِع الوارد.`
                  : `Verification code sent to ${emailInput}. Check your inbox.`}
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {language === 'AR' ? 'أدخل رمز التحقق' : 'Enter the verification code'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5 rtl:left-auto rtl:right-3" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="482910"
                    className="w-full bg-white rounded-xl py-3 pl-9 pr-3 rtl:pl-3 rtl:pr-9 text-neutral-900 font-mono font-bold tracking-widest text-center border border-neutral-200 focus:border-black focus:outline-hidden text-base"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    if (!clerk?.signIn || !clerk.signUp) return;
                    void sendClerkEmailCode(clerk.signIn, clerk.signUp, emailInput.trim())
                      .then((mode) => {
                        setEmailMode(mode);
                        showToast(language === 'AR' ? 'أُعيد إرسال رمز التحقق.' : 'Verification code sent again.');
                      })
                      .catch(() => setAuthErrorCode('RESEND_FAILED'));
                  }}
                  className="text-blue-600 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{language === 'AR' ? 'إعادة إرسال الرمز' : 'Resend Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOtpStep(false)}
                  className="text-neutral-500 hover:text-black cursor-pointer"
                >
                  {language === 'AR' ? 'تعديل البريد' : 'Change Email'}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {language === 'AR' ? 'تأكيد الرمز وتسجيل الدخول' : 'Verify & Sign In'}
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10 text-start text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="max-w-[1360px] mx-auto px-4 lg:px-8 space-y-8">
        {/* User Card Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#F8F9FA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-neutral-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {(user.name || user.email || '?').charAt(0)}
            </div>
            <div className="space-y-1">
              <h1 className="honor-heading text-xl sm:text-2xl font-bold text-black tracking-normal">
                {user.name || user.email}
              </h1>
              <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono">
                {user.name ? <span>{user.email}</span> : null}
                {user.phone ? <span>{user.name ? '· ' : ''}{user.phone}</span> : null}
                {user.city ? <span>· {user.city}</span> : null}
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{language === 'AR' ? 'عضوية موثقة' : 'Verified Member'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                  <Award className="w-3 h-3 text-amber-600" />
                  <span>{loyaltyPoints} {language === 'AR' ? 'نقطة مكافآت' : 'Points'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigateTo('thankyou')}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-semibold text-neutral-800 hover:text-black transition-colors cursor-pointer bg-neutral-200 hover:bg-neutral-300"
            >
              {language === 'AR' ? 'آخر فاتورة' : 'Latest Invoice'}
            </button>

            <button
              onClick={logoutUser}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer bg-red-50 hover:bg-red-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'AR' ? 'تسجيل الخروج' : 'Log Out'}</span>
            </button>
          </div>
        </div>

        <div id="coffee-profile-account" className="scroll-mt-24" />
        <div id="coffee-profile-settings" className="scroll-mt-24" />
        <div id="coffee-profile-notifications" className="rounded-2xl border border-neutral-100 bg-[#F8F9FA] p-5 scroll-mt-24">
          <h2 className="text-sm font-bold text-neutral-900 mb-1">
            {language === 'AR' ? 'الإشعارات' : 'Notifications'}
          </h2>
          <p className="text-xs text-neutral-500">
            {language === 'AR'
              ? 'لا توجد إشعارات جديدة لهذا المتجر.'
              : 'No new notifications for this store.'}
          </p>
        </div>

        <div id="coffee-profile-wishlist" className="rounded-2xl border border-neutral-100 bg-[#F8F9FA] p-5 scroll-mt-24">
          <h2 className="text-sm font-bold text-neutral-900 mb-1">
            {language === 'AR' ? 'المفضلة' : 'Wishlist'}
          </h2>
          <p className="text-xs text-neutral-500">
            {language === 'AR' ? 'قائمة المفضلة فارغة لهذا المتجر.' : 'Wishlist is empty for this store.'}
          </p>
        </div>

        <div id="coffee-profile-wallet" className="rounded-2xl border border-neutral-100 bg-[#F8F9FA] p-5 scroll-mt-24">
          <h2 className="text-sm font-bold text-neutral-900 mb-1">
            {language === 'AR' ? 'محفظتي' : 'My wallet'}
          </h2>
          <p className="text-xs text-neutral-500">
            {language === 'AR'
              ? 'رصيد المحفظة يظهر هنا بعد عمليات حقيقية في هذا المتجر.'
              : 'Wallet balance appears here after real activity in this store.'}
          </p>
        </div>

        <div id="coffee-profile-loyalty" className="scroll-mt-24">
          {activeStore?.id && sfCustomer?.customerId ? (
            <CustomerLoyaltyProfileSection
              storeId={activeStore.id}
              customerId={sfCustomer.customerId}
              customerName={user.name || sfCustomer.name}
              customerEmail={user.email || sfCustomer.email}
              customerPhone={user.phone || sfCustomer.phone}
            />
          ) : (
            <div className="rounded-2xl border border-neutral-100 bg-[#F8F9FA] p-5">
              <h2 className="text-sm font-bold text-neutral-900 mb-1">
                {language === 'AR' ? 'نقاط الولاء' : 'Loyalty points'}
              </h2>
              <p className="text-xs text-neutral-500">
                {loyaltyPoints} {language === 'AR' ? 'نقطة في هذا المتجر' : 'points in this store'}
              </p>
            </div>
          )}
        </div>

        <div id="coffee-profile-pending_payment" className="space-y-3 scroll-mt-24">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <span>{language === 'AR' ? 'بانتظار الدفع' : 'Pending payment'}</span>
          </h2>
          {pendingPaymentOrders.length === 0 ? (
            <p className="text-xs text-neutral-500 rounded-2xl border border-neutral-100 bg-[#F8F9FA] p-4">
              {language === 'AR' ? 'لا توجد طلبات بانتظار الدفع.' : 'No orders awaiting payment.'}
            </p>
          ) : (
            <p className="text-xs font-mono text-amber-800">
              {pendingPaymentOrders.length}{' '}
              {language === 'AR' ? 'طلبات بانتظار الدفع' : 'orders awaiting payment'}
            </p>
          )}
        </div>

        {/* Order History */}
        <div id="coffee-profile-orders" className="space-y-4 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-neutral-700" />
              <span>{language === 'AR' ? 'سجل الطلبات والفواتير' : 'Order & Invoice History'}</span>
            </h2>
            <span className="text-xs text-neutral-500 font-mono">
              {allOrders.length} {language === 'AR' ? 'طلبات' : 'Orders'}
            </span>
          </div>

          <div className="space-y-4">
            {allOrders.map((order, oIdx) => (
              <div
                key={order.id || oIdx}
                className="p-5 sm:p-6 rounded-2xl bg-[#F8F9FA] border border-neutral-100 space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/70 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-neutral-900 bg-white px-2.5 py-1 rounded-md border border-neutral-200">
                      {order.orderNumber}
                    </span>
                    <span className="text-neutral-500 font-mono">{order.date}</span>
                    <span className="text-neutral-500 uppercase font-semibold">· {order.paymentMethod}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{order.status}</span>
                    </span>

                    <button
                      onClick={() => navigateTo('thankyou')}
                      className="text-xs font-bold text-black underline hover:text-neutral-600 cursor-pointer"
                    >
                      {language === 'AR' ? 'عرض الفاتورة ومشاركتها' : 'View & Share Invoice'}
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {(Array.isArray(order.items) ? order.items : []).map((item: any, iIdx: number) => (
                    <div key={iIdx} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-12 h-12 object-contain rounded-xl bg-white p-1 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-neutral-900 truncate">{item.productName}</h4>
                          <span className="text-[11px] text-neutral-500 block">
                            {cartChoiceLine(item, language === 'AR')}
                          </span>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <span className="font-mono font-bold text-neutral-900">
                          {language === 'AR' ? `${(item.unitPrice * item.quantity).toLocaleString()}.00 ر.س` : `SAR ${(item.unitPrice * item.quantity).toLocaleString()}.00`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-200/70 text-xs">
                  <span className="text-neutral-500">
                    {order.shippingAddress?.city} · {language === 'AR' ? 'شحن فوري مجاني' : 'Free Express Delivery'}
                  </span>
                  <div className="text-end">
                    <span className="text-neutral-500 mr-2">{language === 'AR' ? 'الإجمالي:' : 'Total:'}</span>
                    <span className="font-mono font-black text-sm text-neutral-950">
                      {language === 'AR' ? `${Number(order.total || 0).toLocaleString()}.00 ر.س` : `SAR ${Number(order.total || 0).toLocaleString()}.00`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePageClerk() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  return (
    <ProfilePageBody
      clerk={{
        isLoaded,
        signIn,
        signUp,
        setActive: setActive ? (params) => setActive({ session: params.session }) : undefined,
        setSignUpActive: setSignUpActive ? (params) => setSignUpActive({ session: params.session }) : undefined,
        isSignedIn: Boolean(isSignedIn),
        email: user?.primaryEmailAddress?.emailAddress || '',
        name: user?.fullName || user?.firstName || '',
        signOut,
      }}
    />
  );
}

export const ProfilePage: React.FC = () => {
  if (!isClerkConfigured()) return <ProfilePageBody clerk={null} />;
  return <ProfilePageClerk />;
};
