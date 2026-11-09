import React, { useState } from 'react';
import { useSignIn, useSignUp, useClerk } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { isClerkConfigured } from '../../../auth/clerkSession';
import {
  rememberPendingCustomer,
  saveStorefrontCustomer,
  sendClerkEmailCode,
  startClerkGoogle,
  verifyClerkEmailCode,
} from '../../../auth/storefrontCustomer';
import {
  X,
  CheckCircle,
  ShieldCheck,
  Mail,
  Phone,
  Sparkles,
  LogOut,
  ArrowRight,
  ArrowLeft,
  Key,
  Check,
  User,
  Award,
} from 'lucide-react';
import { MECCA_LOGO } from '../data/mockData';
import { useSaudiCityOptions } from '../../../hooks/useSaudiCityOptions';
import { SaudiCitySelect } from '../../../components/common/SaudiCitySelect';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = (props) => {
  if (!isClerkConfigured()) return <AuthModalBody {...props} clerk={null} />;
  return <AuthModalClerk {...props} />;
};

function AuthModalClerk(props: AuthModalProps) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { signOut } = useClerk();
  return (
    <AuthModalBody
      {...props}
      clerk={{
        isLoaded,
        signIn,
        signUp,
        setActive,
        setSignUpActive,
        signOut,
      }}
    />
  );
}

function AuthModalBody({
  isOpen: propIsOpen,
  onClose: propOnClose,
  clerk,
}: AuthModalProps & {
  clerk: {
    isLoaded: boolean;
    signIn: ReturnType<typeof useSignIn>['signIn'];
    signUp: ReturnType<typeof useSignUp>['signUp'];
    setActive: ReturnType<typeof useSignIn>['setActive'];
    setSignUpActive: ReturnType<typeof useSignUp>['setActive'];
    signOut: (opts?: { redirectUrl?: string }) => Promise<void>;
  } | null;
}) {
  const { language, user, loginWithGoogle, logout, setCurrentPage, isAuthModalOpen, setIsAuthModalOpen, cart } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const storeId = activeStore?.id || '';
  const {
    cities: saudiCities,
    addCity: addSaudiCity,
    removeCity: removeSaudiCity,
  } = useSaudiCityOptions(storeId || 'platform');

  const isOpen = propIsOpen !== undefined ? propIsOpen : isAuthModalOpen;
  const onClose = propOnClose || (() => setIsAuthModalOpen(false));

  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [cityInput, setCityInput] = useState('Makkah');
  const [emailInput, setEmailInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailMode, setEmailMode] = useState<'signIn' | 'signUp'>('signIn');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);

  if (!isOpen) return null;

  const detailsReady = nameInput.trim() && phoneInput.trim() && cityInput.trim();

  const handleGoogleAuth = () => {
    setFeedback(null);
    setFeedbackError(false);
    if (!storeId) {
      setFeedbackError(true);
      setFeedback(isAr ? 'المتجر غير معروف.' : 'Store is not known.');
      return;
    }
    if (!detailsReady) {
      setFeedbackError(true);
      setFeedback(isAr ? 'الاسم ورقم الجوال والمدينة مطلوبة قبل المتابعة.' : 'Name, mobile number, and city are required.');
      return;
    }
    if (!clerk?.isLoaded || !clerk.signIn) {
      setFeedbackError(true);
      setFeedback(isAr ? 'تسجيل جوجل غير جاهز بعد.' : 'Google sign-in is not ready yet.');
      return;
    }
    setLoading(true);
    rememberPendingCustomer({
      storeId,
      name: nameInput.trim(),
      email: emailInput.trim(),
      phone: phoneInput.trim(),
      city: cityInput.trim(),
      source: 'google',
    });
    void startClerkGoogle(clerk.signIn, 'crm').catch(() => {
      setLoading(false);
      setFeedbackError(true);
      setFeedback(isAr ? 'تعذر فتح تسجيل جوجل.' : 'Could not open Google sign-in.');
    });
  };

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setFeedbackError(false);
    if (!storeId || !emailInput.trim() || !detailsReady) {
      setFeedbackError(true);
      setFeedback(isAr ? 'الاسم ورقم الجوال والمدينة والبريد مطلوبة.' : 'Name, mobile, city, and email are required.');
      return;
    }
    if (!clerk?.isLoaded || !clerk.signIn || !clerk.signUp) {
      setFeedbackError(true);
      setFeedback(isAr ? 'إرسال رمز التحقق غير جاهز.' : 'Email verification is not ready.');
      return;
    }
    setLoading(true);
    try {
      const mode = await sendClerkEmailCode(clerk.signIn, clerk.signUp, emailInput.trim());
      setEmailMode(mode);
      setOtpSent(true);
      setFeedback(isAr ? 'تم إرسال رمز التحقق إلى بريدك. راجع الوارد.' : 'Verification code sent to your email. Check the inbox.');
    } catch {
      setFeedbackError(true);
      setFeedback(isAr ? 'تعذر إرسال رمز التحقق إلى هذا البريد.' : 'Could not send a verification code to this email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !clerk?.signIn || !clerk.signUp || !clerk.setActive || !clerk.setSignUpActive) return;
    setLoading(true);
    setFeedbackError(false);
    try {
      await verifyClerkEmailCode(emailMode, otpCode.trim(), clerk.signIn, clerk.signUp, clerk.setActive, clerk.setSignUpActive);
      const saved = await saveStorefrontCustomer({
        storeId,
        name: nameInput.trim(),
        email: emailInput.trim(),
        phone: phoneInput.trim(),
        city: cityInput.trim(),
        source: 'email',
      });
      loginWithGoogle(saved.email, saved.name, undefined, saved.phone, saved.city);
      onClose();
      setCurrentPage('crm');
      void clerk.signOut({ redirectUrl: window.location.href }).catch(() => undefined);
    } catch {
      setFeedbackError(true);
      setFeedback(isAr ? 'الرمز غير صحيح أو تعذر حفظ بيانات العميل.' : 'The code is wrong, or the customer could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e8e4dc] overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#0a1f14] via-[#102a1c] to-[#0a1f14] text-[#FAF9F5] p-6 text-center relative border-b border-[#e6ca98]/30">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rtl:right-4 rtl:left-auto ltr:left-4 ltr:right-auto w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <img
            src={MECCA_LOGO}
            alt="Mecca Gifts"
            className="h-12 w-auto mx-auto object-contain filter brightness-110 mb-2"
            referrerPolicy="no-referrer"
          />

          <h3 className="text-lg font-bold font-serif">
            {user.isLoggedIn
              ? (isAr ? 'حسابك في هدايا مكة' : 'Your Mecca Gifts Account')
              : (isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register')}
          </h3>
          <p className="text-xs text-[#e6ca98] mt-1">
            {isAr ? 'تمتع بتجربة إهداء ملكية مع نقاط المكافآت وتتبع الطلبات' : 'Enjoy royal gifting with VIP loyalty points & order tracking'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {user.isLoggedIn ? (
            /* Logged In State */
            <div className="space-y-5 text-center">
              <div className="w-20 h-20 rounded-full mx-auto border-2 border-[#102a1c] p-1 overflow-hidden shadow-lg relative bg-[#102a1c]/5">
                <img
                  src={user.avatar || 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png'}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-full"
                />
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
              </div>

              <div>
                <h4 className="text-base font-bold text-[#102a1c]">{user.name}</h4>
                <p className="text-xs text-[#8c8275] font-mono">{user.email}</p>
                {(user.phone || user.city) && (
                  <p className="text-xs text-[#8c8275] mt-1">
                    {[user.phone, user.city].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#102a1c]/10 text-[#102a1c] text-xs font-semibold mt-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{isAr ? 'عضوية النخبة الملكية' : 'Royal Elite Member (VIP)'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('crm');
                    onClose();
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-loyalty-modal'));
                    }, 80);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0d3822] to-[#055130] hover:brightness-110 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border border-[#d4af37]/30"
                >
                  <Award className="w-4 h-4 text-[#d4af37]" />
                  <span>{isAr ? 'بطاقة الولاء والعملات والمكافآت' : 'Loyalty Card, Coins & Rewards'}</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage('crm');
                      onClose();
                    }}
                    className="py-3 px-4 rounded-2xl bg-[#102a1c] hover:bg-[#1a3f2b] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-[#e6ca98]" />
                    <span>{isAr ? 'لوحة التحكم والطلبات' : 'My Orders & Profile'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="py-3 px-4 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('checkout');
                    onClose();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#102a1c] to-[#1c4830] hover:brightness-110 text-[#f3e5ab] text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border border-[#e6ca98]/40 mt-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{isAr ? 'متابعة إتمام الطلب' : 'Proceed to Checkout'}</span>
                </button>
              )}
            </div>
          ) : (
            /* Logged Out / Sign In Options */
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#102a1c]">
                  {isAr ? 'الاسم' : 'Full name'}
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="mt-1 w-full py-2.5 px-4 rounded-xl border border-[#d6cfc0] text-sm focus:outline-none focus:border-[#102a1c]"
                  />
                </label>
                <label className="block text-xs font-bold text-[#102a1c]">
                  {isAr ? 'رقم الجوال' : 'Mobile number'}
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="mt-1 w-full py-2.5 px-4 rounded-xl border border-[#d6cfc0] text-sm focus:outline-none focus:border-[#102a1c]"
                    dir="ltr"
                  />
                </label>
                <label className="block text-xs font-bold text-[#102a1c]">
                  {isAr ? 'المدينة' : 'City'}
                  <div className="mt-1">
                    <SaudiCitySelect
                      value={cityInput}
                      onChange={setCityInput}
                      cities={saudiCities}
                      isAr={isAr}
                      manageEnabled
                      onAddCity={(nameEn, nameAr) => addSaudiCity({ nameEn, nameAr })}
                      onRemoveCity={removeSaudiCity}
                      className="w-full py-2.5 px-4 rounded-xl border border-[#d6cfc0] text-sm focus:outline-none focus:border-[#102a1c] bg-white"
                    />
                  </div>
                </label>
              </div>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl border-2 border-[#e8e4dc] hover:border-[#4285F4] bg-white hover:bg-slate-50 flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-98 group cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                <span className="text-sm font-bold text-slate-800 group-hover:text-[#102a1c]">
                  {isAr ? 'المتابعة باستخدام جوجل' : 'Continue with Google'}
                </span>
              </button>

              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-[#e8e4dc]" />
                <span className="px-3 text-xs text-[#8c8275]">{isAr ? 'أو عبر البريد الإلكتروني' : 'or with Email'}</span>
                <div className="flex-1 border-t border-[#e8e4dc]" />
              </div>

              {feedback && (
                <div className={`p-3 border rounded-xl text-xs font-semibold flex items-center gap-2 ${feedbackError ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                  <CheckCircle className={`w-4 h-4 shrink-0 ${feedbackError ? 'text-rose-600' : 'text-emerald-600'}`} />
                  <span>{feedback}</span>
                </div>
              )}

              {/* Email verification */}
              {!otpSent ? (
                <form onSubmit={handleSendEmailOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#102a1c] mb-1">
                      {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="e.g. yourname@example.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full py-2.5 px-4 rounded-xl border border-[#d6cfc0] text-sm focus:outline-none focus:border-[#102a1c] rtl:pr-10 ltr:pl-10 font-mono"
                        dir="ltr"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-[#102a1c] hover:bg-[#1a3f2b] active:scale-98 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isAr ? 'إرسال رمز التحقق' : 'Send verification code'}</span>
                        {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#102a1c]">
                        {isAr ? 'أدخل رمز التحقق' : 'Enter the verification code'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[11px] text-[#8b263e] hover:underline cursor-pointer"
                      >
                        {isAr ? 'تغيير البريد' : 'Change Email'}
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full py-2.5 px-4 rounded-xl border border-[#102a1c] text-center text-lg font-mono tracking-widest font-bold focus:outline-none bg-slate-50"
                      dir="ltr"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-98 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isAr ? 'تأكيد ودخول الحساب' : 'Verify & Enter Profile'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Secure Notice */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8c8275] pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'تسجيل آمن ومشفر 100% متوافق مع معايير الأمان السعودية' : '100% Secure & Encrypted Customer Login'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
