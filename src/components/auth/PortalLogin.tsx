import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Layers,
  Lock,
  User,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react';
import { loginPortal } from '../../auth/api';
import type { AuthPortal } from '../../auth/session';
import {
  evaluatePasswordStrength,
  getRateLimitStatus,
  recordFailedAttempt,
  resetRateLimit,
  validateAuthInput,
  type RateLimitStatus,
} from '../../auth/security';
import { useToast } from '../common/ToastProvider';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { usePrefs } from '../../i18n/PrefsContext';
import { MasterLoginArt, SaudiCommerceHeroArt, StoreLoginArt } from './LoginHeroArt';

type PortalLoginProps = {
  portal: AuthPortal;
  onSuccess: (portal: AuthPortal, storeId?: string | null) => void;
  onSwitchPortal: (portal: AuthPortal) => void;
  onForgotPassword?: () => void;
};

export const PortalLogin: React.FC<PortalLoginProps> = ({
  portal,
  onSuccess,
  onSwitchPortal,
  onForgotPassword,
}) => {
  const { toast } = useToast();
  const { t, theme, locale, dir } = usePrefs();
  const isMaster = portal === 'master';
  const isAr = locale === 'ar';

  // Check URL store parameter for targeted context (without prefilling credentials)
  const storeParam =
    typeof window !== 'undefined'
      ? (
          new URLSearchParams(window.location.search).get('store') ||
          new URLSearchParams(window.location.search).get('demo') ||
          ''
        )
          .toLowerCase()
          .trim()
      : '';

  const isCoffee = storeParam === 'coffee' || storeParam === 'store-coffee';
  const isBleco =
    storeParam === 'bleco' ||
    storeParam === 'store-bleco' ||
    storeParam === 'car' ||
    storeParam === 'tanjeed';
  const isFlowers =
    storeParam === 'store-1' ||
    storeParam === 'makkah' ||
    storeParam === 'giftshop' ||
    storeParam === 'flowers';

  // General Saudi Multi-Store SaaS Identity
  const portalInfo = useMemo(() => {
    if (isMaster) {
      return {
        title: isAr ? 'لوحة تحكم المنصة المركزية' : 'Platform Master SuperAdmin',
        subtitle: isAr
          ? 'بوابة التحكم الرئيسية لإدارة المنصة السحابية والمتاجر'
          : 'Central Cloud Administration & Store Operations',
        badge: isAr ? 'إدارة المنصة المركزية' : 'Master Control Plane',
        scopeNote: isAr
          ? 'صلاحيات الإشراف الشامل على جميع المتاجر والاشتراكات في المملكة'
          : 'Global master scope across all merchant stores and Saudi infrastructure',
      };
    }

    if (isBleco) {
      return {
        title: isAr ? 'مؤسسة بلاكو للتجارة · السعودية' : 'Blacko Trading Est. · Saudi Arabia',
        subtitle: isAr
          ? 'بوابة إدارة متجر تنجيد ودعاسات السيارات الفاخرة'
          : 'Luxury Automotive & Car Accessories Merchant Portal',
        badge: isAr ? 'مؤسسة بلاكو (الرياض)' : 'Blacko Trading (Riyadh)',
        scopeNote: isAr
          ? 'حساب التاجر معزول تماماً ومخصص لمؤسسة بلاكو للتجارة (store-bleco)'
          : 'Isolated tenant session strictly scoped to store-bleco',
      };
    }

    if (isCoffee) {
      return {
        title: isAr ? 'متجر القهوة المختصة · السعودية' : 'Specialty Coffee Roasters · KSA',
        subtitle: isAr
          ? 'بوابة إدارة متجر القهوة المختصة ومعدات الباريستا'
          : 'Specialty Coffee & Barista Tools Merchant Portal',
        badge: isAr ? 'متجر القهوة المختصة' : 'Specialty Coffee KSA',
        scopeNote: isAr
          ? 'حساب التاجر معزول ومخصص لمتجر القهوة المختصة (store-coffee)'
          : 'Isolated tenant session strictly scoped to store-coffee',
      };
    }

    if (isFlowers) {
      return {
        title: isAr ? 'هدايا وزهور مكة المكرمة' : 'Makkah Fresh Flowers & Luxury Gifts',
        subtitle: isAr
          ? 'بوابة إدارة متجر الأزهار الفاخرة والهدايا بمكة وجدة'
          : 'Makkah & Jeddah Luxury Floral Boutique Portal',
        badge: isAr ? 'هدايا مكة المكرمة' : 'Makkah Flowers KSA',
        scopeNote: isAr
          ? 'حساب التاجر معزول ومخصص لمتجر هدايا مكة (store-1)'
          : 'Isolated tenant session strictly scoped to store-1',
      };
    }

    // Default General Saudi SaaS Merchant Portal (Mission 100 Stores)
    return {
      title: isAr
        ? 'بوابة المتاجر السعودية الموحدة'
        : 'Saudi Unified Merchants Portal',
      subtitle: isAr
        ? 'مبادرة تمكين 100 متجر سعودي في التجارة الإلكترونية السحابية'
        : 'Empowering 100+ Saudi Stores in Cloud E-Commerce',
      badge: isAr ? 'مبادرة 100 متجر سعودي 🇸🇦' : 'KSA 100 Stores Mission 🇸🇦',
      scopeNote: isAr
        ? 'كل تاجر يفتح لوحة تحكم مستقلة ومحمية بالكامل ومعزولة برقم المتجر store_id'
        : 'Every merchant accesses a strictly isolated, encrypted vault scoped to store_id',
    };
  }, [isMaster, isBleco, isCoffee, isFlowers, isAr]);

  // Input states — initialized clean and empty so no one else's information is prefilled
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  // Rate Limiting state for anti-brute-force
  const [rateLimit, setRateLimit] = useState<RateLimitStatus>({
    isLocked: false,
    remainingSeconds: 0,
    attempts: 0,
    maxAttempts: 5,
  });

  // Password Strength Evaluation
  const passwordStrength = useMemo(
    () => evaluatePasswordStrength(password),
    [password],
  );

  // Synchronize portal attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-portal', portal);
  }, [portal]);

  // Clean inputs on portal change
  useEffect(() => {
    setIdentifier('');
    setPassword('');
    setSecurityWarning(null);
  }, [portal]);

  // Real-time Rate Limit Countdown Timer
  useEffect(() => {
    if (!rateLimit.isLocked || rateLimit.remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRateLimit((prev) => {
        if (prev.remainingSeconds <= 1) {
          return { ...prev, isLocked: false, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimit.isLocked, rateLimit.remainingSeconds]);

  // Live anti-SQLi & threat inspection as user inputs username or email
  const handleIdentifierChange = (val: string) => {
    setIdentifier(val);
    const check = validateAuthInput(val, password);
    if (!check.isSecure) {
      setSecurityWarning(
        isAr
          ? check.messageAr || '⚠️ تم رصد نمط إدخال غير آمن (تم تفعيل درع الحماية ضد الاختراق)'
          : check.messageEn || '⚠️ Insecure input pattern detected (Anti-SQLi active)',
      );
    } else {
      setSecurityWarning(null);
      if (val.trim()) {
        const rl = getRateLimitStatus(val);
        setRateLimit(rl);
      }
    }
  };

  // Dedicated Username / Email + Password Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password;

    if (!cleanIdentifier || !cleanPassword) {
      toast(
        isAr
          ? 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور'
          : 'Please enter your username or email and password',
        'error',
      );
      return;
    }

    // 1. Deep Anti-SQLi & Threat Check
    const secCheck = validateAuthInput(cleanIdentifier, cleanPassword);
    if (!secCheck.isSecure) {
      setSecurityWarning(secCheck.messageAr || secCheck.messageEn || 'Security check failed.');
      toast(
        isAr
          ? 'تم حظر الإدخال لحماية النظام من هجمات الاختراق وحقن SQL.'
          : 'Input blocked for system protection against SQL injection attacks.',
        'error',
      );
      return;
    }

    // 2. Anti-Brute-Force Check
    const currentRate = getRateLimitStatus(cleanIdentifier);
    if (currentRate.isLocked) {
      setRateLimit(currentRate);
      toast(
        isAr
          ? `الحساب مؤمن مؤقتاً ضد محاولات التخمين. يرجى الانتظار ${currentRate.remainingSeconds} ثانية.`
          : `Account locked temporarily against brute force. Please wait ${currentRate.remainingSeconds}s.`,
        'error',
      );
      return;
    }

    setBusy(true);
    setSecurityWarning(null);

    try {
      const session = await loginPortal(portal, cleanIdentifier, cleanPassword);

      // Reset rate limit on successful authentication
      resetRateLimit(cleanIdentifier);

      // Save identifier if user requested "Remember me"
      if (rememberMe) {
        try {
          localStorage.setItem('unityteck_last_login_email', cleanIdentifier);
        } catch {}
      } else {
        try {
          localStorage.removeItem('unityteck_last_login_email');
        } catch {}
      }

      toast(
        isMaster
          ? isAr
            ? 'مرحباً بك! تم تسجيل الدخول إلى لوحة إدارة المنصة بنجاح.'
            : 'Welcome! Master Administrator authenticated successfully.'
          : isAr
          ? `تم تسجيل الدخول بنجاح · ${session.storeName ?? portalInfo.title}`
          : `Signed in successfully · ${session.storeName ?? portalInfo.title}`,
        'success',
      );

      onSuccess(session.portal, session.storeId);
    } catch (err) {
      // Record failed attempt for anti-brute-force defense
      const nextRate = recordFailedAttempt(cleanIdentifier);
      setRateLimit(nextRate);

      const msg = err instanceof Error ? err.message : t('signInFailed');
      toast(msg, 'error');

      if (nextRate.isLocked) {
        setSecurityWarning(
          isAr
            ? `تم قفل محاولات تسجيل الدخول مؤقتاً لحماية الحساب من هجمات التخمين. يرجى الانتظار ${nextRate.remainingSeconds} ثانية.`
            : `Login attempts locked for account protection against brute force. Wait ${nextRate.remainingSeconds}s.`,
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      dir={dir}
      lang={locale}
      data-theme={theme}
      data-portal={portal}
      className="portal-auth-shell min-h-screen flex flex-col selection:bg-emerald-500 selection:text-white"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Top Header Bar */}
      <header
        className="shrink-0 z-20 border-b px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 backdrop-blur-md"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ring-1 ring-white/10"
            style={{
              background: isMaster
                ? 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)'
                : 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
              color: '#FFFFFF',
            }}
          >
            {isMaster ? <Layers className="w-5 h-5" /> : <Store className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p
                className="text-[10px] font-black uppercase tracking-wider leading-none"
                style={{ color: 'var(--muted)' }}
              >
                {isMaster
                  ? 'UNITYTECK ENTERPRISE'
                  : isAr
                  ? 'منصة التجارة الإلكترونية السحابية للمتاجر السعودية'
                  : 'SAUDI COMMERCE CLOUD'}
              </p>
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span>🇸🇦</span>
                <span>{isAr ? 'مبادرة 100 متجر' : '100 Stores Mission'}</span>
              </span>
            </div>
            <p
              className="text-sm font-extrabold truncate leading-tight mt-1"
              style={{ color: 'var(--text)' }}
            >
              {portalInfo.title}
            </p>
          </div>
        </div>

        {/* Portal Scope Pill */}
        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 border shadow-xs"
          style={{
            background: 'var(--active-bg)',
            borderColor: 'var(--border)',
            color: 'var(--active-fg)',
          }}
        >
          {isMaster ? (
            <ShieldCheck className="w-4 h-4 text-teal-500" />
          ) : (
            <Shield className="w-4 h-4 text-emerald-500" />
          )}
          <span className="hidden sm:inline">{portalInfo.badge}</span>
          <span className="sm:hidden">{isMaster ? 'Master' : '100 Stores'}</span>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <PrefsSwitcher showCurrency={!isMaster} />
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="portal-auth-split flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Side: Enterprise Saudi Commerce Cloud Hero */}
        <aside
          className="portal-auth-hero relative lg:w-[48%] xl:w-[50%] px-6 sm:px-12 py-10 lg:py-14 flex flex-col justify-between overflow-hidden border-b lg:border-b-0"
          style={{
            borderColor: 'var(--border)',
            background:
              'linear-gradient(155deg, #022018 0%, #064E3B 40%, #047857 85%, #0B5345 100%)',
            color: '#F0FDF4',
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 20% 15%, #34D399 0%, transparent 60%)',
            }}
          />

          {/* Hero Header Content */}
          <div className="relative z-10 space-y-4 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {portalInfo.badge}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/15">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {isAr ? 'حماية فائقة ضد الاختراق' : 'Anti-Hack Shield Active'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black leading-tight tracking-tight text-white">
              {isMaster
                ? isAr
                  ? 'لوحة الإشراف المركزية لمنصة يونيتيك'
                  : 'Unityteck Central Master Platform'
                : isAr
                ? 'بوابة دخول المتاجر السعودية الموحدة'
                : 'Saudi Unified Merchants Portal'}
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-emerald-100/90 font-medium">
              {portalInfo.subtitle}
            </p>

            {/* Highlights List */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-100/90 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isAr
                    ? 'تسجيل دخول آمن ومباشر باسم المستخدم أو البريد الإلكتروني الرسمي لمتجرك'
                    : 'Secure sign-in with your username or store business email'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-100/90 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isAr
                    ? 'فحص استباقي ضد هجمات SQL Injection و Cross-Site Scripting (XSS)'
                    : 'Active real-time defense against SQL Injection & XSS attacks'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-100/90 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isAr
                    ? 'حساب تاجر مستقل ومحمي سحابياً ومعزول بـ store_id في المملكة'
                    : 'Strictly isolated multi-tenant architecture scoped to store_id in KSA'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-100/90 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isAr
                    ? 'مبادرة دعم 100 متجر سعودي في الرياض، مكة، جدة، والمنطقة الشرقية'
                    : 'Targeting 100+ high-growth Saudi stores in Riyadh, Makkah, Jeddah & Eastern Province'}
                </span>
              </div>
            </div>
          </div>

          {/* Hero Vector Graphic */}
          <div className="relative z-10 my-6 flex justify-center lg:justify-start">
            {isMaster ? (
              <MasterLoginArt className="w-full max-w-[340px] drop-shadow-2xl" />
            ) : isBleco || isCoffee ? (
              <SaudiCommerceHeroArt className="w-full max-w-[360px] drop-shadow-2xl" />
            ) : (
              <SaudiCommerceHeroArt className="w-full max-w-[360px] drop-shadow-2xl" />
            )}
          </div>

          {/* Saudi Mission 2030 Cloud Compliance Footnote */}
          <div className="relative z-10 pt-4 border-t border-emerald-400/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-200/80">
            <span>
              {isAr
                ? '🇸🇦 بنية سحابية متوافقة مع معايير الأمن السيبراني السعودي (NCA ECC)'
                : '🇸🇦 Cloud infrastructure compliant with Saudi Cybersecurity standards'}
            </span>
            <span className="font-bold text-white">SSL 256-Bit TLS 1.3</span>
          </div>
        </aside>

        {/* Right Side: High-Security Modern Login Card */}
        <main
          className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-y-auto"
          style={{ background: 'var(--bg)', color: 'var(--text)' }}
        >
          <div
            className="relative w-full max-w-[460px] rounded-3xl border p-6 sm:p-9 shadow-2xl transition-all"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            {/* Form Top Title */}
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p
                    className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400"
                  >
                    {isMaster
                      ? 'SUPERADMIN ACCESS'
                      : isAr
                      ? 'بوابة تسجيل دخول المتجر'
                      : 'MERCHANT AUTHENTICATION'}
                  </p>
                </div>
                <h2 className="text-xl sm:text-2xl font-black mt-1 text-[var(--text)]">
                  {isAr ? 'تسجيل الدخول الآمن' : 'Secure Sign-In'}
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {isAr
                    ? 'أدخل اسم المستخدم أو البريد الإلكتروني وكلمة المرور الخاصة بمتجرك'
                    : 'Enter your username or email and password to access your dashboard'}
                </p>
              </div>

              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-500/20"
                style={{
                  background: isMaster
                    ? 'linear-gradient(135deg, #0F766E, #14B8A6)'
                    : 'linear-gradient(135deg, #065F46, #10B981)',
                  color: '#FFFFFF',
                }}
              >
                {isMaster ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
            </div>

            {/* Security Alert Banner (Anti-SQLi / Rate Limiting Notice) */}
            {securityWarning && (
              <div
                className="mb-5 p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 animate-shake"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  color: '#EF4444',
                }}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1">
                  <p className="font-bold">{isAr ? 'تنبيه أمان سيبراني' : 'Security Alert'}</p>
                  <p className="mt-0.5">{securityWarning}</p>
                </div>
              </div>
            )}

            {/* Brute Force Lockout Active Warning */}
            {rateLimit.isLocked && (
              <div
                className="mb-5 p-4 rounded-2xl border text-xs leading-relaxed flex items-center justify-between gap-3 bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500 animate-spin" />
                  <span className="font-bold">
                    {isAr
                      ? `تم حظر المحاولات مؤقتاً لحماية المتجر`
                      : `Account temporarily locked for protection`}
                  </span>
                </div>
                <span className="font-black px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs">
                  {rateLimit.remainingSeconds}s
                </span>
              </div>
            )}

            {/* Quick 1-Click Access for Development & Store Admins */}
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center justify-between">
                <span>{isAr ? '⚡ دخول فوري بضغطة زر إلى لوحة التحكم:' : '⚡ 1-Click Quick Sign-In to Dashboard:'}</span>
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('admin@giftshop-sa.com');
                    setPassword('MakkahStore@2026!Secure');
                    if (portal !== 'store') onSwitchPortal?.('store');
                  }}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-[#102a1c] dark:text-emerald-300 transition-all text-start truncate shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>🌸</span>
                  <span className="truncate">{isAr ? 'متجر هدايا مكة' : 'Makkah Flowers'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('rayan@specialtycoffee.sa');
                    setPassword('CoffeeStore@2026!Secure');
                    if (portal !== 'store') onSwitchPortal?.('store');
                  }}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-[#102a1c] dark:text-emerald-300 transition-all text-start truncate shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>☕</span>
                  <span className="truncate">{isAr ? 'متجر القهوة' : 'Coffee Roasters'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('admin@bleco.sa');
                    setPassword('BlackoStore@2026!Secure');
                    if (portal !== 'store') onSwitchPortal?.('store');
                  }}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-[#102a1c] dark:text-emerald-300 transition-all text-start truncate shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>🚗</span>
                  <span className="truncate">{isAr ? 'مؤسسة بلاكو' : 'Bleco Automotive'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('master@unityteck.com');
                    setPassword('UnityMaster@2026!Secure');
                    if (portal !== 'master') onSwitchPortal?.('master');
                  }}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-[#102a1c] dark:text-emerald-300 transition-all text-start truncate shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>👑</span>
                  <span className="truncate">{isAr ? 'الماستر أدمن' : 'Master SuperAdmin'}</span>
                </button>
              </div>
            </div>

            {/* Dedicated Username or Email + Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* Username / Email Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="text-xs font-bold block"
                    style={{ color: 'var(--text)' }}
                  >
                    {isAr ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email Address'}
                  </label>
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    {isAr ? 'فحص ضد SQLi نشط' : 'SQLi Protected'}
                  </span>
                </div>

                <div className="relative">
                  <User
                    className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--muted)' }}
                  />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => handleIdentifierChange(e.target.value)}
                    placeholder={
                      isMaster
                        ? isAr
                          ? 'اسم المستخدم أو البريد الإلكتروني (master)'
                          : 'Username or email (master)'
                        : isAr
                        ? 'اسم المستخدم أو بريد المتجر'
                        : 'Enter username or email'
                    }
                    required
                    autoComplete="username"
                    className="w-full ps-10 pe-3 py-3 text-sm rounded-2xl border outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-medium"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: securityWarning ? '#EF4444' : 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="text-xs font-bold block"
                    style={{ color: 'var(--text)' }}
                  >
                    {isAr ? 'كلمة المرور' : 'Password'}
                  </label>
                  {onForgotPassword && (
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Lock
                    className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--muted)' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full ps-10 pe-11 py-3 text-sm rounded-2xl border outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-medium"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--input-fg)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                    style={{ color: 'var(--muted)' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span style={{ color: 'var(--muted)' }}>
                        {isAr ? 'مقياس قوة كلمة المرور (معايير NCA):' : 'Password Strength:'}
                      </span>
                      <span style={{ color: passwordStrength.color }}>
                        {isAr ? passwordStrength.labelAr : passwordStrength.labelEn}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className="rounded-full transition-all duration-300"
                          style={{
                            background:
                              passwordStrength.score >= step
                                ? passwordStrength.color
                                : 'rgba(148, 163, 184, 0.25)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                  />
                  <span style={{ color: 'var(--text)' }}>
                    {isAr ? 'تذكر بياناتي بأمان' : 'Remember my login securely'}
                  </span>
                </label>
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={busy || rateLimit.isLocked}
                aria-busy={busy}
                className="w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all duration-200 hover:opacity-95 shadow-lg shadow-emerald-600/25 active:scale-[0.99] mt-2"
                style={{
                  background: isMaster
                    ? 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)'
                    : 'linear-gradient(135deg, #065F46 0%, #059669 100%)',
                  color: '#FFFFFF',
                }}
              >
                {busy ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>{isAr ? 'جارِ التحقق وتأمين الجلسة...' : 'Authenticating Securely...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isMaster ? (isAr ? 'تسجيل الدخول للإدارة المركزية' : 'Sign In as Master') : (isAr ? 'تسجيل الدخول للمتجر' : 'Sign In Securely')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180 ms-1" />
                  </>
                )}
              </button>
            </form>

            {/* Security Guarantee Badges Footer */}
            <div
              className="mt-6 pt-5 border-t text-center space-y-2.5"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  {isAr ? 'تشفير 256-Bit SSL' : '256-Bit SSL'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  {isAr ? 'حماية ضد SQL Injection' : 'Anti-SQLi Protected'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span>🇸🇦</span>
                  {isAr ? 'خوادم سعودية معزولة' : 'KSA Isolated Vault'}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {portalInfo.scopeNote}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
