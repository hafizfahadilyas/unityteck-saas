import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { 
  Store, 
  UserCheck, 
  Lock, 
  Mail, 
  MapPin, 
  Sparkles, 
  Check, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Flower2, 
  Layers,
  Building,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { PlanType } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { initiateRealGoogleOAuth } from '../../utils/googleRealAuth';

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
    stores, 
    switchToStore, 
    switchToMaster, 
    registerNewClient, 
    activeStore,
    canAccessMaster,
  } = useTenant();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState(activeStore.ownerEmail || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState(isAr ? 'مكة المكرمة' : 'Makkah Al-Mukarramah');
  const [category, setCategory] = useState('Real Fresh Flowers & Gifts');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    setTimeout(() => {
      setLoginLoading(false);
      // Find store by email or default to primary store
      const matchingStore = stores.find(s => s.ownerEmail.toLowerCase() === loginEmail.toLowerCase());
      if (matchingStore) {
        switchToStore(matchingStore.id);
      } else {
        switchToStore(stores[0].id);
      }
      onClose();
    }, 600);
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
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
                Client &amp; Merchant Portal
              </h3>
              <p className="text-[11px] text-slate-400">
                Unityteck Multi-Store SaaS Platform
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
            <span>Store Owner Sign In</span>
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
            <span>Register New Store</span>
          </button>
        </div>

        {/* ================= TAB 1: LOGIN ================= */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Merchant Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-medium"
                  required
                />
              </div>
            </div>

            {/* Quick Demo Credentials Box */}
            <div
              className="p-3 rounded-2xl text-[11px] space-y-1 border"
              style={{
                background: 'color-mix(in srgb, var(--portal-50) 90%, white)',
                borderColor: 'var(--portal-200)',
                color: 'var(--portal-950)',
              }}
            >
              <span className="font-bold block" style={{ color: 'var(--portal-800)' }}>
                Demo Store Credentials (1-Click Ready):
              </span>
              <div className="font-mono" style={{ color: 'var(--portal-800)' }}>
                Store: <strong>Makkah Gifts Store</strong> (giftshop-sa.com)<br/>
                Email: <strong>admin@giftshop-sa.com</strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 unity-btn-primary"
            >
              <span>{loginLoading ? 'Authenticating...' : 'Sign In to Store Admin'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Real Official Google Sign-In */}
            <button
              type="button"
              disabled={loginLoading}
              onClick={() => {
                setLoginLoading(true);
                initiateRealGoogleOAuth({
                  storeSlug: activeStore.slug,
                  onSuccess: (_token, profile) => {
                    setLoginLoading(false);
                    const matchingStore = stores.find(s => s.ownerEmail.toLowerCase() === profile.email.toLowerCase());
                    if (matchingStore) {
                      switchToStore(matchingStore.id);
                    } else {
                      switchToStore(stores[0].id);
                    }
                    onClose();
                  },
                  onError: (err) => {
                    setLoginLoading(false);
                    setLoginError(err || 'Google sign-in cancelled');
                  },
                });
              }}
              className="w-full py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 bg-white"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google Account</span>
            </button>

            {loginError && (
              <p className="text-[11px] font-bold text-rose-600 text-center">{loginError}</p>
            )}

            {canAccessMaster && (
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  switchToMaster();
                  onClose();
                }}
                className="text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                <span>Switch to Platform Master Admin Panel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            )}
          </form>
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
                placeholder={isAr ? 'زهور مكة الفاخرة' : 'e.g. Makkah Fresh Flowers'}
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
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Makkah Al-Mukarramah">{isAr ? 'مكة المكرمة' : 'Makkah Al-Mukarramah'}</option>
                  <option value="Jeddah">{isAr ? 'جدة' : 'Jeddah'}</option>
                  <option value="Riyadh">{isAr ? 'الرياض' : 'Riyadh'}</option>
                  <option value="Madinah">{isAr ? 'المدينة المنورة' : 'Madinah'}</option>
                  <option value="Dammam">{isAr ? 'الدمام' : 'Dammam'}</option>
                </select>
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
                <span>Store registered! Launching your custom dashboard...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={registerSuccess}
              className="w-full py-2.5 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 unity-btn-primary"
            >
              <span>Instant Launch Store &amp; Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
