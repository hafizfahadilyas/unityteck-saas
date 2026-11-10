import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import {
  UserCheck,
  Mail,
  X,
  ArrowRight,
  ShieldCheck,
  Flower2,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { PlanType } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { GlobalModal } from './GlobalModal';
import { useSaudiCityOptions } from '../../hooks/useSaudiCityOptions';
import { SaudiCitySelect } from './SaudiCitySelect';

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

export const ClientAuthModal: React.FC<ClientAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'login' 
}) => {
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const {
    switchToStore,
    registerNewClient,
    activeStore,
    canAccessMaster,
  } = useTenant();
  const {
    cities: saudiCities,
    addCity: addSaudiCity,
    removeCity: removeSaudiCity,
  } = useSaudiCityOptions(activeStore?.id || 'platform');

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Register form state
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('Makkah');
  const [category, setCategory] = useState('Real Fresh Flowers & Gifts');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const storeLoginSlug =
    activeStore?.id === 'store-coffee'
      ? 'coffee'
      : activeStore?.id === 'store-bleco'
        ? 'bleco'
        : activeStore?.id === 'store-1'
          ? 'flowers'
          : activeStore?.slug || '';

  const goOtpLogin = () => {
    onClose();
    const q = storeLoginSlug ? `?store=${encodeURIComponent(storeLoginSlug)}` : '';
    window.location.assign(`/store/login${q}`);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !email || !businessName) return;

    setRegisterSuccess(true);
    setTimeout(() => {
      const newStoreId = registerNewClient({
        clientName,
        email,
        businessName,
        category,
        plan: selectedPlan,
      });

      switchToStore(newStoreId);
      setRegisterSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'بوابة العميل والتاجر' : 'Client & Merchant Portal'}
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 text-white flex items-center justify-center shadow-md unity-icon-box"
            >
              <Flower2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {isAr ? 'بوابة العميل والتاجر' : 'Client & Merchant Portal'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'منصة سوق — التجارة الإلكترونية الشاملة' : 'Souq Platform — Complete e-commerce'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>{isAr ? 'تسجيل دخول صاحب المتجر' : 'Store Owner Sign In'}</span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? 'تسجيل متجر جديد' : 'Register New Store'}</span>
          </button>
        </div>

        {/* ================= TAB 1: LOGIN (OTP only) ================= */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            <div
              className="p-3 rounded-xl border text-xs font-semibold flex items-start gap-2"
              style={{
                background: 'color-mix(in srgb, var(--portal-50) 90%, white)',
                borderColor: 'var(--portal-200)',
                color: 'var(--portal-950)',
              }}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <span>
                {isAr
                  ? 'تسجيل الدخول بكلمة المرور مغلق. يجب إدخال البريد المسجّل ثم رمز التحقق المرسل إلى البريد.'
                  : 'Password login is closed. Use the registered store email, then the verification code sent to that inbox.'}
              </span>
            </div>

            <button
              type="button"
              onClick={goOtpLogin}
              className="w-full py-2.5 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer unity-btn-primary"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isAr ? 'متابعة عبر رمز التحقق بالبريد' : 'Continue with email verification code'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {canAccessMaster && (
              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.assign('/master/login');
                  }}
                  className="text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 hover:opacity-80"
                  style={{ color: 'var(--accent)' }}
                >
                  <span>{isAr ? 'تسجيل دخول منصة سوق (رمز التحقق)' : 'Souq Platform login (verification code)'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: REGISTER NEW CLIENT ================= */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Client / Owner Full Name
              </label>
              <input
                type="text"
                placeholder={isAr ? 'طارق المكي' : 'e.g. Tariq Al-Makki'}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="tariq@flowers.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Store / Boutique Name
              </label>
              <input
                type="text"
                placeholder={isAr ? 'مثال: اسم متجرك' : 'e.g. Your Store Name'}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Store Location
                </label>
                <SaudiCitySelect
                  value={city}
                  onChange={setCity}
                  cities={saudiCities}
                  isAr={isAr}
                  manageEnabled
                  onAddCity={(nameEn, nameAr) => addSaudiCity({ nameEn, nameAr })}
                  onRemoveCity={removeSaudiCity}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Store Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Real Fresh Flowers & Gifts">Real Fresh Flowers &amp; Gifts</option>
                  <option value="Luxury Perfumes & Oud">Luxury Perfumes &amp; Oud</option>
                  <option value="Dates & Saudi Confectionery">Dates &amp; Saudi Sweets</option>
                  <option value="Jewelry & Watches">Jewelry &amp; Watches</option>
                </select>
              </div>
            </div>

            {/* Plan selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Select Platform Plan
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  onClick={() => setSelectedPlan('free')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedPlan === 'free'
                      ? 'font-bold border-[var(--accent)]'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                  style={
                    selectedPlan === 'free'
                      ? {
                          borderColor: 'var(--accent)',
                          background: 'color-mix(in srgb, var(--portal-50) 80%, white)',
                          color: 'var(--portal-950)',
                        }
                      : undefined
                  }
                >
                  <span className="block font-bold">Starter Free</span>
                  <span className="text-[10px] text-slate-500">Shared MySQL 8</span>
                </div>

                <div
                  onClick={() => setSelectedPlan('pro')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedPlan === 'pro'
                      ? 'font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                  style={
                    selectedPlan === 'pro'
                      ? {
                          borderColor: 'var(--accent)',
                          background: 'color-mix(in srgb, var(--portal-50) 80%, white)',
                          color: 'var(--portal-950)',
                        }
                      : undefined
                  }
                >
                  <span className="block font-bold">Pro Cloud ({money(99)})</span>
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
                    Dedicated MySQL 8
                  </span>
                </div>
              </div>
            </div>

            {registerSuccess && (
              <div
                className="p-2.5 rounded-xl text-xs font-bold text-center border animate-fadeIn flex items-center justify-center gap-1.5"
                style={{
                  background: 'color-mix(in srgb, var(--portal-50) 90%, white)',
                  borderColor: 'var(--portal-200)',
                  color: 'var(--portal-800)',
                }}
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'تم تسجيل المتجر! جارٍ فتح لوحة التحكم...' : 'Store registered! Launching your custom dashboard...'}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={registerSuccess}
              className="w-full py-2.5 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 unity-btn-primary"
            >
              <span>{isAr ? 'إطلاق المتجر ولوحة التحكم فوراً' : 'Instant Launch Store & Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </GlobalModal>
  );
};
