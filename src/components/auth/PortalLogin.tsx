import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Clock,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useSignIn, useSignUp, useClerk } from '@clerk/clerk-react';
import { readAuthSession, type AuthPortal } from '../../auth/session';
import { sessionFromClerkUser, isClerkConfigured } from '../../auth/clerkSession';
import {
  assertStoreLoginEmailAllowed,
  exchangeClerkForSanctum,
  isMasterLoginEmail,
  resolveStoreIdFromLoginParam,
} from '../../auth/api';
import { isApiEnabled } from '../../api/client';
import {
  getRateLimitStatus,
  recordFailedAttempt,
  resetRateLimit,
  validateAuthInput,
  type RateLimitStatus,
} from '../../auth/security';
import { useToast } from '../common/ToastProvider';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  DEFAULT_LOGIN_SIDE_IMAGE,
  resolveLoginSideImageUrl,
} from '../../themes/settings/storeIdentity';

type PortalLoginProps = {
  portal: AuthPortal;
  onSuccess: (portal: AuthPortal, storeId?: string | null) => void;
  onSwitchPortal: (portal: AuthPortal) => void;
  onForgotPassword?: () => void;
};

type OtpStep = 'email' | 'otp';

const OTP_LOCK_SECONDS = 60;

function clerkErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err || '');
  const e = err as {
    errors?: Array<{ message?: string; longMessage?: string; code?: string }>;
    message?: string;
  };
  const first = e.errors?.[0];
  return (first?.longMessage || first?.message || e.message || String(err)).trim();
}

function isAlreadySignedInError(err: unknown): boolean {
  const e = err as { errors?: Array<{ code?: string }> } | null;
  const code = e?.errors?.[0]?.code || '';
  if (code === 'session_exists' || code === 'identifier_already_signed_in') return true;
  return /already signed in|already logged in|session exists/i.test(clerkErrorMessage(err));
}

/** Outer shell — Clerk hooks only run when publishable key is present. */
export const PortalLogin: React.FC<PortalLoginProps> = (props) => {
  const { locale, theme, dir } = usePrefs();
  const isAr = locale === 'ar';

  if (!isClerkConfigured()) {
    return (
      <div
        dir={dir}
        lang={locale}
        data-theme={theme}
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}
      >
        <div className="max-w-md w-full rounded-3xl border p-6 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h1 className="text-lg font-black">{isAr ? 'نظام المصادقة غير مهيأ' : 'Authentication not configured'}</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'أضف مفتاح النشر في ملف البيئة ثم أعد تشغيل الخادم المحلي.'
              : 'Add the publishable key in .env and restart the local server.'}
          </p>
          <code className="block text-[11px] p-2 rounded-xl bg-slate-100 dark:bg-slate-900 break-all">
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_…
          </code>
        </div>
      </div>
    );
  }

  return <ClerkPortalLoginInner {...props} />;
};

const ClerkPortalLoginInner: React.FC<PortalLoginProps> = ({
  portal,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { t, theme, locale, dir } = usePrefs();
  const isMaster = portal === 'master';
  const isAr = locale === 'ar';
  const clerkOn = true;

  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const clerk = useClerk();

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

  const resolvedStoreId = useMemo(
    () => (isMaster ? null : resolveStoreIdFromLoginParam(storeParam)),
    [isMaster, storeParam],
  );
  const isCoffee = resolvedStoreId === 'store-coffee';
  const isBleco = resolvedStoreId === 'store-bleco';
  const isFlowers = resolvedStoreId === 'store-1';

  const [loginSideImageUrl, setLoginSideImageUrl] = useState(DEFAULT_LOGIN_SIDE_IMAGE);

  useEffect(() => {
    if (isMaster || !resolvedStoreId) {
      setLoginSideImageUrl(DEFAULT_LOGIN_SIDE_IMAGE);
      return;
    }
    setLoginSideImageUrl(resolveLoginSideImageUrl(resolvedStoreId));
    const onIdentity = (e: Event) => {
      const detail = (e as CustomEvent<{ storeId?: string }>).detail;
      if (detail?.storeId && detail.storeId !== resolvedStoreId) return;
      setLoginSideImageUrl(resolveLoginSideImageUrl(resolvedStoreId));
    };
    window.addEventListener('unityteck-theme-identity', onIdentity);
    return () => window.removeEventListener('unityteck-theme-identity', onIdentity);
  }, [isMaster, resolvedStoreId]);

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
          ? 'حساب التاجر معزول تماماً ومخصص لمؤسسة بلاكو للتجارة فقط'
          : 'Isolated tenant session strictly scoped to the Bleco store',
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
          ? 'حساب التاجر معزول ومخصص لمتجر القهوة المختصة فقط'
          : 'Isolated tenant session strictly scoped to the coffee store',
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
          ? 'حساب التاجر معزول ومخصص لمتجر هدايا مكة فقط'
          : 'Isolated tenant session strictly scoped to the flowers store',
      };
    }
    return {
      title: isAr ? 'بوابة المتاجر السعودية الموحدة' : 'Saudi Unified Merchants Portal',
      subtitle: isAr
        ? 'مبادرة تمكين 100 متجر سعودي في التجارة الإلكترونية السحابية'
        : 'Empowering 100+ Saudi Stores in Cloud E-Commerce',
      badge: isAr ? 'مبادرة 100 متجر سعودي 🇸🇦' : 'KSA 100 Stores Mission 🇸🇦',
      scopeNote: isAr
        ? 'كل تاجر يفتح لوحة تحكم مستقلة ومحمية بالكامل ومعزولة برقم متجره الخاص'
        : 'Every merchant accesses a strictly isolated, encrypted vault scoped to their store',
    };
  }, [isMaster, isBleco, isCoffee, isFlowers, isAr]);

  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('email');
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [flowMode, setFlowMode] = useState<'signIn' | 'signUp'>('signIn');
  const [busy, setBusy] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus>({
    isLocked: false,
    remainingSeconds: 0,
    attempts: 0,
    maxAttempts: 5,
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-portal', portal);
  }, [portal]);

  useEffect(() => {
    setIdentifier('');
    setOtpCode('');
    setOtpStep('email');
    setSecurityWarning(null);
    setFlowMode('signIn');
  }, [portal]);

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

  useEffect(() => {
    if (clerk.loaded === false) return;
    if (readAuthSession()) return;
    if (!clerk.session && !clerk.user) return;
    void clerk.signOut().catch(() => undefined);
  }, [clerk]);

  useEffect(() => {
    if (otpExpiresIn <= 0) return;
    const interval = setInterval(() => {
      setOtpExpiresIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpExpiresIn]);

  const handleIdentifierChange = (val: string) => {
    setIdentifier(val);
    const check = validateAuthInput(val, '000000');
    if (!check.isSecure) {
      setSecurityWarning(
        isAr
          ? check.messageAr || 'تم رصد نمط إدخال غير آمن'
          : check.messageEn || 'Insecure input pattern detected',
      );
    } else {
      setSecurityWarning(null);
      if (val.trim()) setRateLimit(getRateLimitStatus(val));
    }
  };

  const gateEmailForPortal = (email: string): void => {
    if (isMaster) {
      if (!isMasterLoginEmail(email)) {
        throw new Error(
          isAr
            ? 'لوحة الماستر تقبل فقط البريد الإلكتروني المسجّل لإدارة المنصة.'
            : 'Master portal accepts only the registered platform admin email.',
        );
      }
      return;
    }
    try {
      assertStoreLoginEmailAllowed(email, storeParam || null);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'STORE_EMAIL_INACTIVE' || /inactive|غير نشط/i.test(code)) {
        throw new Error(
          isAr
            ? 'بريد الدخول لهذا المتجر غير نشط حالياً. يرجى تفعيله من لوحة تحكم الماستر أدمن.'
            : 'This store login email is inactive. Ask Master Admin to activate it.',
        );
      }
      if (code === 'STORE_EMAIL_WRONG_STORE') {
        throw new Error(
          isAr
            ? 'هذا البريد يتبع متجراً آخر. استخدم البريد المسجّل لهذا المتجر فقط.'
            : 'This email belongs to another store. Use only this store’s registered email.',
        );
      }
      throw new Error(
        isAr
          ? 'هذا البريد غير مسجّل لهذا المتجر. كل متجر يُفتح فقط ببريده المسجّل الخاص به (مثال: متجر الورود ≠ متجر القهوة).'
          : 'This email is not registered for this store. Each store opens only with its own registered email (e.g. flowers ≠ coffee).',
      );
    }
  };

  const finishWithClerkUser = async (fallbackEmail: string, sessionId?: string | null) => {
    // Clerk user can lag a moment after setActive
    for (let i = 0; i < 25 && !clerk.user; i++) {
      await new Promise((r) => setTimeout(r, 80));
    }

    const email = fallbackEmail.trim().toLowerCase();
    gateEmailForPortal(email);

    const user =
      clerk.user ||
      ({
        id: `clerk-${email}`,
        primaryEmailAddress: { emailAddress: email },
        fullName: email.split('@')[0],
      } as const);

    let token: string | null = sessionId || null;
    try {
      token = (await clerk.session?.getToken()) || token;
    } catch {
      /* keep sessionId */
    }

    const localSession = sessionFromClerkUser(portal, user as any, token, {
      storeParam: storeParam || null,
    });
    // Clerk JWT ≠ Sanctum — exchange only with verified Clerk session token (OTP proof)
    if (!token) {
      throw new Error(
        isAr
          ? 'تعذّر إثبات جلسة التحقق. أعد إرسال رمز التحقق.'
          : 'Could not prove OTP session. Request a new verification code.',
      );
    }
    const exchanged = await exchangeClerkForSanctum(
      portal,
      email,
      localSession.storeId,
      token,
    );
    if (isApiEnabled() && !exchanged) {
      throw new Error(
        isAr
          ? 'تعذّر تأكيد رمز التحقق على الخادم. أكمل رمز التحقق من البريد ثم أعد المحاولة.'
          : 'Could not confirm OTP with the server. Finish the email verification code and try again.',
      );
    }
    const liveSession = exchanged || localSession;
    resetRateLimit(email);
    try {
      localStorage.setItem('unityteck_last_login_email', email);
    } catch {
      /* ignore */
    }
    toast(
      isMaster
        ? isAr
          ? 'مرحباً بك! تم تسجيل الدخول بنجاح.'
          : 'Welcome! Signed in successfully.'
        : isAr
          ? `تم تسجيل الدخول بنجاح · ${liveSession.storeName ?? portalInfo.title}`
          : `Signed in successfully · ${liveSession.storeName ?? portalInfo.title}`,
      'success',
    );
    onSuccess(liveSession.portal, liveSession.storeId);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const email = identifier.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email', 'error');
      return;
    }

    const secCheck = validateAuthInput(email, '000000');
    if (!secCheck.isSecure) {
      setSecurityWarning(
        isAr
          ? secCheck.messageAr || 'تم رصد إدخال غير آمن.'
          : secCheck.messageEn || 'Insecure input detected.',
      );
      toast(isAr ? 'تم حظر الإدخال لحماية النظام.' : 'Input blocked for protection.', 'error');
      return;
    }

    const currentRate = getRateLimitStatus(email);
    if (currentRate.isLocked) {
      setRateLimit(currentRate);
      toast(
        isAr
          ? `الحساب مؤمن مؤقتاً. انتظر ${currentRate.remainingSeconds}ث`
          : `Account locked. Wait ${currentRate.remainingSeconds}s`,
        'error',
      );
      return;
    }

    if (!clerkOn || !signInLoaded || !signUpLoaded || !signIn || !signUp) {
      toast(
        isAr
          ? 'نظام المصادقة غير مهيأ. أضف مفتاح النشر في ملف البيئة ثم أعد التشغيل.'
          : 'Auth is not configured. Add the publishable key in .env and restart.',
        'error',
      );
      return;
    }

    try {
      gateEmailForPortal(email);
    } catch (gateErr) {
      const msg =
        gateErr instanceof Error
          ? gateErr.message
          : isAr
            ? 'هذا البريد غير مسموح به لهذا المتجر.'
            : 'This email is not allowed for this store.';
      setSecurityWarning(msg);
      toast(msg, 'error');
      return;
    }

    setBusy(true);
    setSecurityWarning(null);

    const clearClerkThenContinue = async (): Promise<void> => {
      try {
        await clerk.signOut();
      } catch {
        /* ignore */
      }
    };

    const startEmailCodeSignIn = async () => {
      const created = await signIn.create({ identifier: email });
      const emailFactor = created.supportedFirstFactors?.find(
        (f) => f.strategy === 'email_code',
      ) as { emailAddressId?: string; strategy: string } | undefined;

      if (!emailFactor?.emailAddressId) {
        throw new Error('EMAIL_CODE_UNAVAILABLE');
      }

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });
      setFlowMode('signIn');
    };

    try {
      if (clerk.session || clerk.user) {
        await clearClerkThenContinue();
      }

      // Prefer sign-in. Sign-up only for emails already registered to this store
      // (first Clerk visit) — never for random/unregistered addresses.
      try {
        await startEmailCodeSignIn();
      } catch (signInErr) {
        if (isAlreadySignedInError(signInErr)) {
          await clearClerkThenContinue();
          try {
            await startEmailCodeSignIn();
          } catch (retryErr) {
            if (isAlreadySignedInError(retryErr)) {
              throw new Error(
                isAr
                  ? 'جلسة سابقة ما زالت نشطة. أعد تحميل الصفحة ثم حاول مرة أخرى.'
                  : 'A previous session is still active. Refresh the page and try again.',
              );
            }
            throw retryErr;
          }
        } else {
          // Registered merchant, but no Clerk account yet → one-time sign-up OTP
          try {
            await signUp.create({ emailAddress: email });
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setFlowMode('signUp');
          } catch {
            throw signInErr instanceof Error
              ? new Error(clerkErrorMessage(signInErr) || signInErr.message)
              : new Error(
                  isAr ? 'فشل إرسال رمز التحقق إلى البريد' : 'Failed to send email verification code',
                );
          }
        }
      }

      setOtpStep('otp');
      setOtpCode('');
      setOtpExpiresIn(OTP_LOCK_SECONDS);
      toast(
        isAr
          ? 'تم إرسال رمز التحقق إلى بريدك — تحقق من صندوق الوارد'
          : 'Verification code sent to your email — check your inbox',
        'success',
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isAr
            ? 'فشل إرسال رمز التحقق إلى البريد'
            : 'Failed to send email verification code';
      toast(isAlreadySignedInError(err) ? clerkErrorMessage(err) || msg : msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const email = identifier.trim().toLowerCase();
    const code = otpCode.trim();
    if (code.length !== 6) {
      toast(isAr ? 'أدخل رمز التحقق المكون من 6 أرقام' : 'Enter the 6-digit code', 'error');
      return;
    }

    if (!signIn || !signUp || !setSignInActive || !setSignUpActive) {
      toast(isAr ? 'نظام المصادقة غير جاهز بعد' : 'Authentication is not ready yet', 'error');
      return;
    }

    setBusy(true);
    try {
      if (flowMode === 'signIn') {
        const result = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code,
        });
        if (result.status === 'complete' && result.createdSessionId) {
          await setSignInActive({ session: result.createdSessionId });
          await finishWithClerkUser(email, result.createdSessionId);
          return;
        }
        throw new Error(isAr ? 'التحقق غير مكتمل' : 'Verification incomplete');
      }

      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });
        await finishWithClerkUser(email, result.createdSessionId);
        return;
      }
      throw new Error(isAr ? 'التحقق غير مكتمل' : 'Verification incomplete');
    } catch (err) {
      const nextRate = recordFailedAttempt(email);
      setRateLimit(nextRate);
      const msg = err instanceof Error ? err.message : t('signInFailed');
      toast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const clerkReady = clerkOn && signInLoaded && signUpLoaded;

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
              <p className="text-[10px] font-black uppercase tracking-wider leading-none" style={{ color: 'var(--muted)' }}>
                {isMaster
                  ? isAr
                    ? 'منصة يونيتيك للمؤسسات'
                    : 'UNITYTECK ENTERPRISE'
                  : isAr
                    ? 'منصة التجارة الإلكترونية السحابية للمتاجر السعودية'
                    : 'SAUDI COMMERCE CLOUD'}
              </p>
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <span>{isAr ? 'مصادقة سحابية' : 'Cloud Auth'}</span>
              </span>
            </div>
            <p className="text-sm font-extrabold truncate leading-tight mt-1" style={{ color: 'var(--text)' }}>
              {portalInfo.title}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 border shadow-xs"
          style={{ background: 'var(--active-bg)', borderColor: 'var(--border)', color: 'var(--active-fg)' }}
        >
          {isMaster ? <ShieldCheck className="w-4 h-4 text-teal-500" /> : <Shield className="w-4 h-4 text-emerald-500" />}
          <span className="hidden sm:inline">{portalInfo.badge}</span>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <PrefsSwitcher showCurrency={!isMaster} />
        </div>
      </header>

      <div className="portal-auth-split flex-1 flex min-h-0 relative overflow-hidden">
        <aside
          className="portal-auth-hero relative lg:w-[48%] xl:w-[50%] min-h-[220px] sm:min-h-[280px] lg:min-h-0 overflow-hidden border-b lg:border-b-0"
          style={{
            borderColor: 'var(--border)',
            background: '#022018',
          }}
          aria-hidden
        >
          <img
            src={loginSideImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src.endsWith(DEFAULT_LOGIN_SIDE_IMAGE)) return;
              img.src = DEFAULT_LOGIN_SIDE_IMAGE;
            }}
          />
        </aside>

        <main
          className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-y-auto"
          style={{ background: 'var(--bg)', color: 'var(--text)' }}
        >
          <div
            className="relative w-full max-w-[460px] rounded-3xl border p-6 sm:p-9 shadow-2xl"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                    {isMaster
                      ? isAr
                        ? 'مشرف المنصة · مصادقة آمنة'
                        : 'SUPERADMIN · SECURE AUTH'
                      : isAr
                        ? 'مصادقة التاجر السحابية'
                        : 'MERCHANT CLOUD AUTH'}
                  </p>
                </div>
                <h2 className="text-xl sm:text-2xl font-black mt-1">{isAr ? 'تسجيل الدخول الآمن' : 'Secure Sign-In'}</h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {otpStep === 'email'
                    ? isMaster
                      ? isAr
                        ? 'أدخل البريد الإلكتروني المسجّل لإدارة المنصة فقط.'
                        : 'Enter only the registered platform admin email.'
                      : isAr
                        ? 'أدخل البريد المسجّل لهذا المتجر فقط — بريد متجر آخر لن يفتح تسجيل الدخول.'
                        : 'Enter only this store’s registered email — another store’s email will not open login.'
                    : isAr
                      ? 'أدخل رمز التحقق الذي وصلك على البريد الإلكتروني (لا يظهر هنا).'
                      : 'Enter the verification code from your email (not shown here).'}
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
                <Mail className="w-6 h-6" />
              </div>
            </div>

            {!clerkReady && (
              <div className="mb-5 p-3.5 rounded-2xl border text-xs bg-amber-500/10 border-amber-500/30 text-amber-700">
                {isAr
                  ? 'جارٍ تحميل نظام المصادقة… تأكد من إعداد مفتاح النشر في ملف البيئة.'
                  : 'Loading authentication… ensure the publishable key is set in .env.'}
              </div>
            )}

            {securityWarning && (
              <div
                className="mb-5 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5"
                style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#EF4444' }}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{isAr ? 'تنبيه أمان' : 'Security Alert'}</p>
                  <p className="mt-0.5">{securityWarning}</p>
                </div>
              </div>
            )}

            {rateLimit.isLocked && (
              <div className="mb-5 p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 bg-red-500/10 border-red-500/30 text-red-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span className="font-bold">{isAr ? 'حظر مؤقت' : 'Temporarily locked'}</span>
                </div>
                <span className="font-black px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs">{rateLimit.remainingSeconds}s</span>
              </div>
            )}

            {otpStep === 'email' ? (
              <form onSubmit={handleSendOtp} className="space-y-4" autoComplete="off">
                <div>
                  <label className="text-xs font-bold block mb-1.5">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => handleIdentifierChange(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoComplete="email"
                      className="w-full ps-10 pe-3 py-3 text-sm rounded-2xl border outline-none focus:ring-2 focus:ring-emerald-500/40 font-medium"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy || rateLimit.isLocked || !clerkReady}
                  className="w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-600/25"
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
                      <span>{isAr ? 'جارٍ إرسال رمز التحقق...' : 'Sending verification code...'}</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>{isAr ? 'إرسال رمز التحقق للبريد' : 'Send email code'}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180 ms-1" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4" autoComplete="off">
                <div
                  className="p-3 rounded-2xl border text-xs flex items-center justify-between gap-2"
                  style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate">{identifier}</p>
                    <p style={{ color: 'var(--muted)' }}>
                      {otpExpiresIn > 0
                        ? isAr
                          ? `يمكنك تغيير البريد بعد 0:${String(otpExpiresIn).padStart(2, '0')}`
                          : `Change email after 0:${String(otpExpiresIn).padStart(2, '0')}`
                        : isAr
                          ? 'يمكنك الآن تغيير البريد أو إعادة الإرسال'
                          : 'You can change email or resend now'}
                    </p>
                  </div>
                  {otpExpiresIn <= 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('email');
                        setOtpCode('');
                      }}
                      className="text-[11px] font-bold text-emerald-600 hover:underline shrink-0 cursor-pointer"
                    >
                      {isAr ? 'تغيير البريد' : 'Change email'}
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold shrink-0 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700">
                      {isAr ? `انتظر ${otpExpiresIn}ث` : `Wait ${otpExpiresIn}s`}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1.5">
                    {isAr ? 'رمز التحقق من البريد (6 أرقام)' : 'Email verification code (6 digits)'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      required
                      autoComplete="one-time-code"
                      className="w-full ps-10 pe-3 py-3 text-sm rounded-2xl border outline-none focus:ring-2 focus:ring-emerald-500/40 font-black tracking-[0.35em] text-center"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                  </div>
                  <p className="mt-2 text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'الرمز يُرسل فقط إلى بريدك — ولن يظهر على هذه الشاشة.'
                      : 'The code is emailed only — it is never displayed on this screen.'}
                  </p>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    disabled={busy || otpExpiresIn > 0}
                    onClick={(e) => handleSendOtp(e as unknown as React.FormEvent)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer disabled:opacity-40"
                  >
                    {isAr ? 'إعادة إرسال' : 'Resend'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={busy || rateLimit.isLocked || otpCode.length !== 6}
                  className="w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-600/25"
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
                      <span>{isAr ? 'جارٍ التحقق من الرمز...' : 'Verifying code...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isAr ? 'تسجيل الدخول للمتجر' : 'Verify & Sign In'}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180 ms-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t text-center space-y-2.5" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  {isAr ? 'رمز تحقق بالبريد' : 'Email verification'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  {isAr ? 'لا يظهر الرمز على الشاشة' : 'Code never on-screen'}
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
