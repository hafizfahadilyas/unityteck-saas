import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Server,
  Store,
  Sparkles,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Copy,
  Zap,
  AlertTriangle,
  X,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { registerStoreClient } from '../../auth/api';
import {
  checkInviteToken,
  readInviteFromLocation,
  redeemInviteToken,
} from '../../auth/invites';
import type { PlanType } from '../../types';
import { useToast } from '../common/ToastProvider';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { GlobalModal } from '../common/GlobalModal';
import { CENTRAL_HOST } from '../../services/domainRoutingService';

type PortalRegisterProps = {
  onSuccess: (storeId: string) => void;
  onGoLogin: () => void;
};

type WizardPlan = 'free' | 'starter' | 'pro' | 'premium';
type FieldErrors = Record<string, string>;
type AlertState = {
  kind: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
} | null;

const WIZARD_STEPS = [
  { id: 'business', label: 'Business Details', labelAr: 'تفاصيل النشاط' },
  { id: 'plan', label: 'Select Plan', labelAr: 'اختيار الباقة' },
  { id: 'domain', label: 'Domain & Hosting', labelAr: 'النطاق والاستضافة' },
  { id: 'installing', label: 'Installation Progress', labelAr: 'جاري التثبيت' },
  { id: 'ready', label: 'Store Ready', labelAr: 'المتجر جاهز' },
] as const;

/** Souq SAR tiers — docs/36 · no fake Instant unlock */
const SOUQ_PLANS: Array<{
  id: WizardPlan;
  priceSar: number;
  nameEn: string;
  nameAr: string;
  badgeEn: string;
  badgeAr: string;
  featuresEn: string[];
  featuresAr: string[];
}> = [
  {
    id: 'free',
    priceSar: 0,
    nameEn: 'Free',
    nameAr: 'مجاني',
    badgeEn: 'Starter',
    badgeAr: 'بداية',
    featuresEn: ['Up to 50 products', 'Basic theme', 'Platform subdomain', 'Free security certificate'],
    featuresAr: ['حتى ٥٠ منتجاً', 'ثيم أساسي', 'نطاق فرعي للمنصة', 'شهادة أمان مجانية'],
  },
  {
    id: 'starter',
    priceSar: 100,
    nameEn: 'Starter',
    nameAr: 'أساسي',
    badgeEn: '100 SAR',
    badgeAr: '١٠٠ ر.س',
    featuresEn: ['Catalog & orders', 'Basic SEO', '1 common theme', 'WhatsApp chrome'],
    featuresAr: ['كتالوج وطلبات', 'تحسين محركات بحث أساسي', 'ثيم مشترك واحد', 'واجهة واتساب'],
  },
  {
    id: 'pro',
    priceSar: 300,
    nameEn: 'Pro',
    nameAr: 'احترافي',
    badgeEn: 'Recommended',
    badgeAr: 'موصى به',
    featuresEn: ['Page builder', 'Full customize', 'Custom domain', 'Social (real connect)'],
    featuresAr: ['منشئ الصفحات', 'تخصيص كامل', 'نطاق مخصص', 'وسائل تواصل (ربط حقيقي)'],
  },
  {
    id: 'premium',
    priceSar: 500,
    nameEn: 'Premium',
    nameAr: 'مميز',
    badgeEn: 'Full pack',
    badgeAr: 'الحزمة الكاملة',
    featuresEn: ['All Pro features', 'Backups & ZATCA', 'Advanced analytics', 'Hosting slot (first 20)'],
    featuresAr: ['كل ميزات الاحترافي', 'نسخ احتياطي وهيئة الزكاة', 'تحليلات متقدمة', 'استضافة لأول ٢٠ متجراً'],
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?966[\s-]?\d{8,10}$|^\+?\d{9,15}$/;
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const URL_RE = /^https?:\/\/.+/i;

function periodTotal(monthly: number, months: 1 | 6 | 12): number {
  if (monthly <= 0) return 0;
  const pct = months === 12 ? 25 : months === 6 ? 15 : 0;
  return Math.round(monthly * months * (100 - pct) / 100);
}

export const PortalRegister: React.FC<PortalRegisterProps> = ({
  onSuccess,
  onGoLogin,
}) => {
  const { toast } = useToast();
  const { t, theme, dir, locale, money } = usePrefs();
  const { registerNewClient, requestCustomDomainHosting } = useTenant();
  const isAr = locale === 'ar';

  const inviteToken = useMemo(() => readInviteFromLocation(), []);
  const [inviteCheck, setInviteCheck] = useState<Awaited<ReturnType<typeof checkInviteToken>>>({
    ok: false,
    reason: inviteToken ? 'invalid' : 'missing',
  });
  const [inviteLoading, setInviteLoading] = useState(Boolean(inviteToken));

  useEffect(() => {
    if (!inviteToken) {
      setInviteCheck({ ok: false, reason: 'missing' });
      setInviteLoading(false);
      return;
    }
    let cancelled = false;
    setInviteLoading(true);
    void (async () => {
      const check = await checkInviteToken(inviteToken);
      if (!cancelled) {
        setInviteCheck(check);
        setInviteLoading(false);
        if (check.ok) {
          const invitePlan = String(check.invite.plan || 'free').toLowerCase() as WizardPlan;
          if (['free', 'starter', 'pro', 'premium'].includes(invitePlan)) {
            setPlan(invitePlan);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<AlertState>(null);
  const [stepAnimKey, setStepAnimKey] = useState(0);

  // STEP 1 — empty by default (zero mock / no fake prefill)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [businessDetails, setBusinessDetails] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');

  // STEP 2 — real Souq plans; paid only via Master invite (no fake Instant pay)
  const [plan, setPlan] = useState<WizardPlan>('free');
  const [billingMonths, setBillingMonths] = useState<1 | 6 | 12>(1);
  const [showPlanPaymentModal, setShowPlanPaymentModal] = useState(false);

  // STEP 3
  const [hostingOption, setHostingOption] = useState<'demo' | 'custom'>('demo');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [sharedHostingTier, setSharedHostingTier] = useState<
    'Hostinger Shared Starter' | 'Hostinger Shared Premium' | 'Hostinger Shared Business'
  >('Hostinger Shared Premium');

  // STEP 4–5
  const [installProgress, setInstallProgress] = useState(0);
  const [completedAnimationSteps, setCompletedAnimationSteps] = useState<number[]>([]);
  const [installedStoreId, setInstalledStoreId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<'dashboard' | 'storefront' | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const INSTALL_CHECKLIST = [
    { id: 1, text: isAr ? 'تفاصيل النشاط التجاري' : 'Business Details' },
    { id: 2, text: isAr ? 'إنشاء حساب المدير' : 'Account Created' },
    { id: 3, text: isAr ? 'تأكيد الباقة المختارة' : 'Plan Selected' },
    { id: 4, text: isAr ? 'إنشاء المتجر في النظام' : 'Store Created' },
    { id: 5, text: isAr ? 'اتصال قاعدة البيانات المشتركة' : 'Database Connected' },
    { id: 6, text: isAr ? 'تثبيت الثيم التجاري الافتراضي' : 'Theme Installed' },
    { id: 7, text: isAr ? 'تكوين النطاق وتوجيه النطاق' : 'Domain Configured' },
    { id: 8, text: isAr ? 'تفعيل شهادة الأمان' : 'Security Certificate Configured' },
    { id: 9, text: isAr ? 'اكتمل إعداد المتجر بنجاح' : 'Store Setup Completed' },
  ];

  useEffect(() => {
    document.documentElement.setAttribute('data-portal', 'store');
  }, []);

  const goStep = (next: number) => {
    setStep(next);
    setStepAnimKey((k) => k + 1);
  };

  const showAlert = (
    kind: NonNullable<AlertState>['kind'],
    title: string,
    message: string,
  ) => {
    setAlert({ kind, title, message });
    toast(message, kind === 'info' ? 'info' : kind === 'warning' ? 'warning' : kind);
  };

  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    if (!brandName.trim()) setBrandName(val);
    if (!storeName.trim()) setStoreName(val);
  };

  const storeSlug = useMemo(() => {
    const raw = (storeName || businessName || 'my-store').toLowerCase();
    return raw.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-store';
  }, [storeName, businessName]);

  const demoSubdomain = `${storeSlug}.${CENTRAL_HOST}`;
  const dashboardUrl = `https://${CENTRAL_HOST}/admin?store=${encodeURIComponent(installedStoreId || storeSlug)}`;
  const publicStorefrontUrl =
    hostingOption === 'custom' && customDomainInput.trim()
      ? `https://${customDomainInput.toLowerCase().trim()}`
      : `https://${demoSubdomain}`;

  const inviteAuthorizesPlan = inviteCheck.ok;
  const planLockedByInvite = inviteCheck.ok;
  const selectedPlanMeta = SOUQ_PLANS.find((p) => p.id === plan) || SOUQ_PLANS[0];
  const dueToday = periodTotal(selectedPlanMeta.priceSar, billingMonths);
  const planPaymentAuthorized = plan === 'free' || inviteAuthorizesPlan;

  const validateStep1 = (): boolean => {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = isAr ? 'الاسم الكامل مطلوب' : 'Full name is required';
    }
    if (!email.trim()) {
      errors.email = isAr ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!EMAIL_RE.test(email.trim())) {
      errors.email = isAr ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Enter a valid email address';
    }
    if (!phone.trim()) {
      errors.phone = isAr ? 'رقم الجوال مطلوب' : 'Phone / WhatsApp is required';
    } else if (!PHONE_RE.test(phone.trim().replace(/\s+/g, ' '))) {
      errors.phone = isAr
        ? 'أدخل رقماً سعودياً صالحاً مثل 9665xxxxxxxx'
        : 'Enter a valid Saudi phone e.g. +966 5XXXXXXXX';
    }
    if (!city.trim()) {
      errors.city = isAr ? 'المدينة مطلوبة' : 'City is required';
    }
    if (!businessName.trim()) {
      errors.businessName = isAr ? 'اسم النشاط مطلوب' : 'Business name is required';
    }
    if (!brandName.trim()) {
      errors.brandName = isAr ? 'اسم العلامة التجارية مطلوب' : 'Brand name is required';
    }
    if (!storeName.trim()) {
      errors.storeName = isAr ? 'اسم المتجر مطلوب' : 'Store name is required';
    }
    if (logoUrl.trim() && !URL_RE.test(logoUrl.trim())) {
      errors.logoUrl = isAr ? 'رابط الشعار يجب أن يبدأ بـ https://' : 'Logo URL must start with https://';
    }
    if (!businessDetails.trim() || businessDetails.trim().length < 10) {
      errors.businessDetails = isAr
        ? 'اكتب وصفاً قصيراً للمتجر (١٠ أحرف على الأقل)'
        : 'Add a short store description (min 10 characters)';
    }
    if (password.length < 8) {
      errors.password = isAr
        ? 'كلمة المرور ٨ أحرف على الأقل'
        : 'Password must be at least 8 characters';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      showAlert(
        'error',
        isAr ? 'تحقق من الحقول المطلوبة' : 'Required fields missing',
        isAr
          ? 'أكمل جميع الحقول المطلوبة بصيغة صحيحة قبل المتابعة.'
          : 'Complete all required fields with valid values before continuing.',
      );
      return false;
    }
    return true;
  };

  const handleNextFromStep1 = () => {
    if (!validateStep1()) return;
    goStep(1);
  };

  const handleSelectPlan = (selected: WizardPlan) => {
    if (planLockedByInvite) {
      showAlert(
        'info',
        isAr ? 'الباقة محددة من الدعوة' : 'Plan locked by invite',
        isAr
          ? 'باقتك محددة مسبقاً من دعوة المدير — لا يمكن تغييرها هنا.'
          : 'Your plan is set by the Master invite and cannot be changed here.',
      );
      return;
    }
    setPlan(selected);
    if (selected !== 'free') {
      setShowPlanPaymentModal(true);
    }
  };

  const handleNextFromStep2 = () => {
    if (!planPaymentAuthorized) {
      setShowPlanPaymentModal(true);
      showAlert(
        'warning',
        isAr ? 'الدفع غير مؤكد' : 'Payment not verified',
        isAr
          ? 'الباقات المدفوعة تُفعَّل فقط عبر دعوة المدير بعد الدفع الحقيقي. اختر المجاني أو أكمل الدعوة المدفوعة.'
          : 'Paid plans unlock only via a Master invite after real payment. Choose Free or use a paid invite link.',
      );
      return;
    }
    goStep(2);
  };

  const handleNextFromStep3 = () => {
    const errors: FieldErrors = {};
    if (hostingOption === 'custom') {
      const domain = customDomainInput.trim().toLowerCase();
      if (!domain) {
        errors.customDomain = isAr ? 'أدخل اسم النطاق المخصص' : 'Enter your custom domain';
      } else if (!DOMAIN_RE.test(domain)) {
        errors.customDomain = isAr
          ? 'نطاق غير صالح (مثال: mystore.sa)'
          : 'Invalid domain (e.g. mystore.sa)';
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      showAlert(
        'error',
        isAr ? 'تحقق من النطاق' : 'Domain check failed',
        errors.customDomain,
      );
      return;
    }
    if (!planPaymentAuthorized) {
      showAlert(
        'error',
        isAr ? 'الدفع مطلوب' : 'Payment required',
        isAr
          ? 'لا يمكن تثبيت باقة مدفوعة دون إثبات دفع حقيقي عبر دعوة المدير.'
          : 'Cannot install a paid plan without real payment proof via Master invite.',
      );
      return;
    }
    void startInstallation();
  };

  const startInstallation = async () => {
    setBusy(true);
    goStep(3);
    setInstallProgress(10);
    setCompletedAnimationSteps([1]);

    try {
      const reservedStoreId = inviteCheck.ok ? inviteCheck.invite.storeId : undefined;
      const business = (storeName || businessName).trim();
      const invitePlan: PlanType = inviteCheck.ok
        ? (inviteCheck.invite.plan as PlanType)
        : plan;
      const slugGuess = business
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      if (inviteToken && inviteCheck.ok && reservedStoreId) {
        const redeemed = await redeemInviteToken(inviteToken, reservedStoreId, {
          name: business,
          slug: slugGuess || undefined,
          owner_name: name.trim(),
          email: email.trim(),
          category: isAr ? 'عام' : 'General',
          phone: phone.trim() || undefined,
          city: city.trim() || undefined,
          seed_starter_catalog: true,
        });
        if (!redeemed.ok) {
          throw new Error(
            isAr
              ? 'تعذّر تفعيل الدعوة — تحقق من الرابط أو أنشئ دعوة جديدة من المدير'
              : 'Invite redeem failed — check the link or ask Master for a new invite',
          );
        }
      }

      const storeId = registerNewClient({
        clientName: name.trim(),
        email: email.trim(),
        businessName: business,
        category: isAr ? 'عام' : 'General',
        plan: invitePlan,
        storeId: reservedStoreId,
        currency: inviteCheck.ok ? inviteCheck.invite.currency : 'SAR',
        locale: (inviteCheck.ok ? inviteCheck.invite.locale : locale) as 'en' | 'ar',
        textDirection: inviteCheck.ok ? inviteCheck.invite.textDir : dir,
        timezone: inviteCheck.ok ? inviteCheck.invite.timezone : 'Asia/Riyadh',
        city: city.trim(),
        phone: phone.trim(),
      });

      await registerStoreClient({
        name: name.trim(),
        email: email.trim(),
        password,
        businessName: (storeName || businessName).trim(),
        storeId,
      });

      if (hostingOption === 'custom' && customDomainInput.trim()) {
        requestCustomDomainHosting(storeId, customDomainInput.trim(), sharedHostingTier);
      }

      setInstalledStoreId(storeId);

      const animationTimeline = [
        { progress: 25, stepId: 2, delay: 400 },
        { progress: 40, stepId: 3, delay: 800 },
        { progress: 55, stepId: 4, delay: 1200 },
        { progress: 70, stepId: 5, delay: 1600 },
        { progress: 80, stepId: 6, delay: 2000 },
        { progress: 90, stepId: 7, delay: 2400 },
        { progress: 95, stepId: 8, delay: 2800 },
        { progress: 100, stepId: 9, delay: 3200 },
      ];

      animationTimeline.forEach((item) => {
        window.setTimeout(() => {
          setInstallProgress(item.progress);
          setCompletedAnimationSteps((prev) =>
            prev.includes(item.stepId) ? prev : [...prev, item.stepId],
          );
        }, item.delay);
      });

      window.setTimeout(() => {
        goStep(4);
        setShowSuccessPopup(true);
        setBusy(false);
        toast(
          isAr ? 'مبروك! تم تثبيت متجرك وهو جاهز الآن' : 'Congratulations! Your store is ready',
          'success',
        );
      }, 3600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('regFailed');
      showAlert('error', isAr ? 'فشل التثبيت' : 'Installation failed', msg);
      setBusy(false);
      goStep(0);
    }
  };

  const handleCopy = async (text: string, type: 'dashboard' | 'storefront') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(type);
      toast(isAr ? 'تم نسخ الرابط بنجاح' : 'Link copied to clipboard', 'success');
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      toast(isAr ? 'تعذّر نسخ الرابط' : 'Copy failed', 'error');
    }
  };

  const clearError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <Shell theme={theme} dir={dir} locale={locale}>
      <div
        className="wizard-glass relative w-full max-w-4xl rounded-2xl sm:rounded-3xl border overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--glass-fill, rgba(255,255,255,0.72))',
          borderColor: 'var(--glass-border, rgba(255,255,255,0.55))',
          boxShadow: 'var(--glass-shadow, 0 20px 50px rgba(15,23,42,0.14))',
          backdropFilter: 'var(--glass-blur-shell, blur(20px) saturate(1.45))',
          WebkitBackdropFilter: 'var(--glass-blur-shell, blur(20px) saturate(1.45))',
        }}
      >
        {/* Header */}
        <div
          className="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            borderColor: 'var(--glass-border-soft, var(--border))',
            background: 'var(--glass-fill-strong, rgba(255,255,255,0.55))',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ background: 'var(--portal-cta)' }}
            >
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span
                className="text-[10px] font-bold uppercase tracking-wider block"
                style={{ color: 'var(--accent)' }}
              >
                {isAr ? 'معالج التثبيت' : 'Installation Wizard'}
              </span>
              <h1 className="text-base sm:text-lg font-black truncate" style={{ color: 'var(--text)' }}>
                {isAr ? 'معالج تثبيت المتجر الإلكتروني' : 'Store Setup & Installation Wizard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <PrefsSwitcher compact />
            <button
              type="button"
              onClick={onGoLogin}
              className="text-xs font-semibold hover:underline cursor-pointer"
              style={{ color: 'var(--accent)' }}
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div
          className="px-3 sm:px-6 py-3 border-b overflow-x-auto"
          style={{
            borderColor: 'var(--glass-border-soft, var(--border))',
            background: 'var(--glass-fill, rgba(255,255,255,0.4))',
          }}
        >
          <div className="flex items-center justify-between gap-2 min-w-[280px] text-[11px] font-bold">
            {WIZARD_STEPS.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center gap-1.5 min-w-0 transition-colors duration-300"
                style={{
                  color:
                    idx === step
                      ? 'var(--accent)'
                      : idx < step
                        ? '#059669'
                        : 'var(--muted)',
                }}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-all duration-300 ${
                    idx === step ? 'scale-110 shadow-sm' : ''
                  }`}
                  style={{
                    background:
                      idx === step
                        ? 'var(--portal-cta)'
                        : idx < step
                          ? '#059669'
                          : 'var(--hover-bg, #e2e8f0)',
                    color: idx <= step ? '#fff' : 'var(--muted)',
                  }}
                >
                  {idx < step ? '✓' : idx + 1}
                </span>
                <span className="hidden md:inline truncate">{isAr ? s.labelAr : s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {inviteLoading && (
          <div className="px-6 py-2 text-xs" style={{ color: 'var(--muted)' }}>
            {isAr ? 'جاري التحقق من رابط الدعوة…' : 'Checking invite link…'}
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-6 lg:p-8" key={stepAnimKey}>
          <div className="wizard-step-enter space-y-5">
            {/* ================= STEP 1 ================= */}
            {step === 0 && (
              <>
                <div>
                  <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الخطوة الأولى: تفاصيل النشاط والتاجر' : 'Step 1 — Business Details'}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'أدخل بياناتك ومعلومات المتجر وبيانات الدخول — كل الحقول المطلوبة إلزامية.'
                      : 'Enter your business identity, store branding, and admin login. All required fields are mandatory.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Field
                    label={isAr ? 'الاسم الكامل للعميل' : 'Client Full Name'}
                    required
                    error={fieldErrors.name}
                  >
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder={isAr ? 'مثال: طارق المكي' : 'e.g. Tariq Al-Makki'}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearError('name');
                      }}
                      className={inputClass(!!fieldErrors.name)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field
                    label={isAr ? 'البريد الإلكتروني' : 'Email Address'}
                    required
                    error={fieldErrors.email}
                  >
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder={isAr ? 'name@example.sa' : 'name@example.sa'}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError('email');
                      }}
                      className={inputClass(!!fieldErrors.email)}
                      style={inputStyle}
                      dir="ltr"
                    />
                  </Field>

                  <Field
                    label={isAr ? 'الجوال / واتساب' : 'Phone / WhatsApp'}
                    required
                    error={fieldErrors.phone}
                  >
                    <input
                      type="tel"
                      autoComplete="tel"
                      placeholder="+966 5XXXXXXXX"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearError('phone');
                      }}
                      className={inputClass(!!fieldErrors.phone)}
                      style={inputStyle}
                      dir="ltr"
                    />
                  </Field>

                  <Field label={isAr ? 'المدينة' : 'City'} required error={fieldErrors.city}>
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: الرياض' : 'e.g. Riyadh'}
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        clearError('city');
                      }}
                      className={inputClass(!!fieldErrors.city)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field
                    label={isAr ? 'اسم النشاط التجاري' : 'Business Name'}
                    required
                    error={fieldErrors.businessName}
                  >
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: مؤسسة أزهار مكة' : 'e.g. Your Establishment'}
                      value={businessName}
                      onChange={(e) => {
                        handleBusinessNameChange(e.target.value);
                        clearError('businessName');
                      }}
                      className={inputClass(!!fieldErrors.businessName)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field
                    label={isAr ? 'اسم العلامة التجارية' : 'Brand Name'}
                    required
                    error={fieldErrors.brandName}
                  >
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: اسم علامتك' : 'e.g. Your Brand'}
                      value={brandName}
                      onChange={(e) => {
                        setBrandName(e.target.value);
                        clearError('brandName');
                      }}
                      className={inputClass(!!fieldErrors.brandName)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field
                    label={isAr ? 'اسم المتجر' : 'Store Name'}
                    required
                    error={fieldErrors.storeName}
                  >
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: متجر الزهور' : 'e.g. My Store'}
                      value={storeName}
                      onChange={(e) => {
                        setStoreName(e.target.value);
                        clearError('storeName');
                      }}
                      className={inputClass(!!fieldErrors.storeName)}
                      style={inputStyle}
                    />
                  </Field>

                  <Field
                    label={isAr ? 'رابط الشعار (اختياري)' : 'Logo Image URL (optional)'}
                    error={fieldErrors.logoUrl}
                  >
                    <input
                      type="url"
                      placeholder="https://…"
                      value={logoUrl}
                      onChange={(e) => {
                        setLogoUrl(e.target.value);
                        clearError('logoUrl');
                      }}
                      className={inputClass(!!fieldErrors.logoUrl)}
                      style={inputStyle}
                      dir="ltr"
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field
                      label={isAr ? 'معلومات المتجر' : 'Business / Store Information'}
                      required
                      error={fieldErrors.businessDetails}
                    >
                      <textarea
                        rows={3}
                        placeholder={
                          isAr
                            ? 'صف نشاط متجرك باختصار…'
                            : 'Briefly describe your store…'
                        }
                        value={businessDetails}
                        onChange={(e) => {
                          setBusinessDetails(e.target.value);
                          clearError('businessDetails');
                        }}
                        className={inputClass(!!fieldErrors.businessDetails)}
                        style={inputStyle}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field
                      label={
                        isAr
                          ? 'كلمة مرور لوحة التحكم (٨ أحرف على الأقل)'
                          : 'Admin Password (min 8 characters)'
                      }
                      required
                      error={fieldErrors.password}
                    >
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            clearError('password');
                          }}
                          className={inputClass(!!fieldErrors.password)}
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 cursor-pointer"
                          style={{ color: 'var(--muted)' }}
                          aria-label={isAr ? 'إظهار كلمة المرور' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </Field>
                  </div>
                </div>

                <div
                  className="pt-4 border-t flex justify-end"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <button
                    type="button"
                    onClick={handleNextFromStep1}
                    className="unity-btn-primary px-6 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-sm cursor-pointer transition-transform active:scale-[0.98]"
                    style={{ background: 'var(--portal-cta)' }}
                  >
                    <span>{isAr ? 'التالي: اختيار الباقة' : 'Next: Select Plan'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* ================= STEP 2 ================= */}
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الخطوة الثانية: اختيار الباقة' : 'Step 2 — Select Plan'}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'أسعار منصة سوق الحقيقية بالريال. الباقات المدفوعة تُفعَّل بعد إثبات الدفع عبر دعوة المدير فقط.'
                      : 'Real Souq SAR pricing. Paid plans unlock only after verified payment via Master invite — no Instant fake unlock.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {([1, 6, 12] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBillingMonths(m)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all"
                      style={{
                        borderColor: billingMonths === m ? 'var(--accent)' : 'var(--border)',
                        background: billingMonths === m ? 'var(--accent)' : 'transparent',
                        color: billingMonths === m ? '#fff' : 'var(--text)',
                      }}
                    >
                      {m === 1
                        ? isAr
                          ? 'شهر واحد'
                          : '1 month'
                        : m === 6
                          ? isAr
                            ? '٦ أشهر (−١٥٪)'
                            : '6 months (−15%)'
                          : isAr
                            ? '١٢ شهراً (−٢٥٪)'
                            : '12 months (−25%)'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {SOUQ_PLANS.map((p) => {
                    const selected = plan === p.id;
                    const total = periodTotal(p.priceSar, billingMonths);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPlan(p.id)}
                        className="text-start p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden"
                        style={{
                          borderColor: selected ? 'var(--accent)' : 'var(--border)',
                          background: selected
                            ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                            : 'var(--glass-fill, transparent)',
                          boxShadow: selected ? '0 8px 24px rgba(15,23,42,0.08)' : undefined,
                        }}
                      >
                        {p.id === 'pro' && (
                          <span
                            className="absolute top-0 end-0 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl text-white"
                            style={{ background: 'var(--portal-cta)' }}
                          >
                            {isAr ? p.badgeAr : p.badgeEn}
                          </span>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--hover-bg)', color: 'var(--text)' }}
                          >
                            {isAr ? p.badgeAr : p.badgeEn}
                          </span>
                          {selected && <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
                        </div>
                        <h3 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                          {isAr ? p.nameAr : p.nameEn}
                        </h3>
                        <p className="text-xl font-black mt-1" style={{ color: 'var(--text)' }}>
                          {p.priceSar <= 0 ? money(0) : money(total)}
                          <span className="text-xs font-normal ms-1" style={{ color: 'var(--muted)' }}>
                            {p.priceSar <= 0
                              ? isAr
                                ? '/ دائماً'
                                : '/ forever'
                              : billingMonths === 1
                                ? isAr
                                  ? '/ شهر'
                                  : '/ month'
                                : isAr
                                  ? `/ ${billingMonths} أشهر`
                                  : `/ ${billingMonths} mo`}
                          </span>
                        </p>
                        <ul className="mt-3 space-y-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                          {(isAr ? p.featuresAr : p.featuresEn).map((f) => (
                            <li key={f} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <div className="pt-3 mt-3 border-t text-xs font-bold" style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
                          {selected
                            ? p.id === 'free' || inviteAuthorizesPlan
                              ? isAr
                                ? 'محدد وجاهز'
                                : 'Selected & ready'
                              : isAr
                                ? 'محدد — بانتظار إثبات الدفع'
                                : 'Selected — awaiting payment proof'
                            : isAr
                              ? 'اختيار'
                              : 'Select'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!planPaymentAuthorized && (
                  <div
                    className="flex items-start gap-2 p-3 rounded-xl text-xs border"
                    style={{
                      borderColor: '#f59e0b55',
                      background: 'color-mix(in srgb, #f59e0b 12%, transparent)',
                      color: 'var(--text)',
                    }}
                  >
                    <Lock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <p>
                      {isAr
                        ? 'لا يوجد تأكيد دفع وهمي. الباقة المدفوعة تُفتح فقط بعد دعوة المدير المرتبطة بدفع حقيقي.'
                        : 'No fake Instant payment. Paid tiers open only after a Master invite tied to real payment.'}
                    </p>
                  </div>
                )}

                <div
                  className="pt-4 border-t flex items-center justify-between gap-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <button
                    type="button"
                    onClick={() => goStep(0)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isAr ? 'السابق' : 'Back'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextFromStep2}
                    className="px-5 sm:px-6 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-sm cursor-pointer"
                    style={{ background: 'var(--portal-cta)' }}
                  >
                    <span>{isAr ? 'التالي: النطاق والاستضافة' : 'Next: Domain & Hosting'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* ================= STEP 3 ================= */}
            {step === 2 && (
              <>
                <div>
                  <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الخطوة الثالثة: النطاق والاستضافة' : 'Step 3 — Domain & Hosting'}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'اختر نطاقاً فرعياً للمنصة أو اطلب نطاقاً مخصصاً مع استضافة مشتركة (بدون خادم خاص).'
                      : 'Choose a platform subdomain or request a custom domain with shared hosting (no VPS).'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setHostingOption('demo')}
                    className="text-start p-5 rounded-2xl border-2 cursor-pointer transition-all"
                    style={{
                      borderColor: hostingOption === 'demo' ? 'var(--accent)' : 'var(--border)',
                      background:
                        hostingOption === 'demo'
                          ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                          : 'var(--glass-fill, transparent)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--hover-bg)', color: 'var(--text)' }}
                      >
                        {isAr ? 'الخيار أ' : 'Option A'}
                      </span>
                      {hostingOption === 'demo' && (
                        <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                      )}
                    </div>
                    <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                      {isAr ? 'استضافة المنصة المشتركة' : 'Platform Shared Hosting'}
                    </h3>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {isAr
                        ? 'نطاق فرعي فوري على المنصة بدون إعداد يدوي لنظام أسماء النطاقات.'
                        : 'Instant platform subdomain with no manual DNS setup.'}
                    </p>
                    <div
                      className="mt-4 p-3 rounded-xl border font-mono text-xs break-all"
                      style={{
                        borderColor: 'var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--accent)',
                      }}
                      dir="ltr"
                    >
                      https://{demoSubdomain}
                    </div>
                    <div className="pt-3 mt-3 border-t text-xs font-bold text-emerald-600" style={{ borderColor: 'var(--border)' }}>
                      {isAr ? 'مجاني · تفعيل فوري' : 'Free · Immediate activation'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostingOption('custom')}
                    className="text-start p-5 rounded-2xl border-2 cursor-pointer transition-all"
                    style={{
                      borderColor: hostingOption === 'custom' ? 'var(--accent)' : 'var(--border)',
                      background:
                        hostingOption === 'custom'
                          ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                          : 'var(--glass-fill, transparent)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--hover-bg)', color: 'var(--text)' }}
                      >
                        {isAr ? 'الخيار ب' : 'Option B'}
                      </span>
                      {hostingOption === 'custom' && (
                        <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                      )}
                    </div>
                    <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                      {isAr ? 'نطاق مخصص + استضافة مشتركة' : 'Custom Domain + Shared Hosting'}
                    </h3>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {isAr
                        ? 'يُراجع الطلب من المدير ويُنفَّذ على استضافة هوستنجر المشتركة.'
                        : 'Master reviews the request and fulfills on Hostinger shared hosting.'}
                    </p>

                    {hostingOption === 'custom' && (
                      <div
                        className="mt-3 space-y-3"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Field
                          label={isAr ? 'النطاق المخصص' : 'Custom Domain'}
                          required
                          error={fieldErrors.customDomain}
                        >
                          <input
                            type="text"
                            placeholder="mystore.sa"
                            value={customDomainInput}
                            onChange={(e) => {
                              setCustomDomainInput(e.target.value);
                              clearError('customDomain');
                            }}
                            className={inputClass(!!fieldErrors.customDomain)}
                            style={inputStyle}
                            dir="ltr"
                          />
                        </Field>
                        <Field label={isAr ? 'باقة الاستضافة المشتركة' : 'Shared Hosting Plan'}>
                          <select
                            value={sharedHostingTier}
                            onChange={(e) =>
                              setSharedHostingTier(
                                e.target.value as typeof sharedHostingTier,
                              )
                            }
                            className={inputClass(false)}
                            style={inputStyle}
                          >
                            <option value="Hostinger Shared Starter">
                              {isAr ? 'أساسي — ٤٩ ر.س / شهر' : 'Starter — SAR 49/mo'}
                            </option>
                            <option value="Hostinger Shared Premium">
                              {isAr ? 'مميز — ٦٩ ر.س / شهر' : 'Premium — SAR 69/mo'}
                            </option>
                            <option value="Hostinger Shared Business">
                              {isAr ? 'أعمال — ٧٩ ر.س / شهر' : 'Business — SAR 79/mo'}
                            </option>
                          </select>
                        </Field>
                      </div>
                    )}

                    <div className="pt-3 mt-3 border-t text-xs font-bold text-amber-700" style={{ borderColor: 'var(--border)' }}>
                      {isAr ? 'نطاق العلامة · استضافة مشتركة' : 'Branded domain · Shared hosting'}
                    </div>
                  </button>
                </div>

                <div
                  className="pt-4 border-t flex items-center justify-between gap-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <button
                    type="button"
                    onClick={() => goStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isAr ? 'السابق' : 'Back'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleNextFromStep3}
                    className="px-5 sm:px-7 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
                    style={{ background: 'var(--portal-cta)' }}
                  >
                    <Zap className="w-4 h-4 text-emerald-300" />
                    <span>{isAr ? 'تثبيت وإنشاء المتجر' : 'Install Store Now'}</span>
                  </button>
                </div>
              </>
            )}

            {/* ================= STEP 4 ================= */}
            {step === 3 && (
              <div className="py-4 sm:py-6 space-y-6 max-w-xl mx-auto text-center">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md animate-pulse"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  <Server className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>
                    {isAr ? 'جاري تثبيت وتكوين متجرك…' : 'Installing & Provisioning Your Store…'}
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'يرجى الانتظار بينما نعد قاعدة البيانات والنطاق والثيم.'
                      : 'Please wait while we set up database, domain, and theme.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div
                    className="h-3 w-full rounded-full overflow-hidden p-0.5 border"
                    style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${installProgress}%`,
                        background: 'linear-gradient(90deg, var(--portal-cta), #10b981)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono font-bold" style={{ color: 'var(--muted)' }}>
                    <span>{isAr ? 'حالة التثبيت' : 'Installation Status'}</span>
                    <span>{installProgress}%</span>
                  </div>
                </div>

                <div
                  className="text-start p-4 rounded-2xl border space-y-2"
                  style={{
                    background: 'var(--glass-fill, var(--hover-bg))',
                    borderColor: 'var(--border)',
                  }}
                >
                  {INSTALL_CHECKLIST.map((item) => {
                    const isDone = completedAnimationSteps.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                          isDone ? 'opacity-100 font-bold translate-x-0' : 'opacity-40'
                        }`}
                        style={{ color: isDone ? 'var(--text)' : 'var(--muted)' }}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            isDone ? 'bg-emerald-600 text-white scale-110' : ''
                          }`}
                          style={!isDone ? { background: 'var(--hover-bg)', color: 'var(--muted)' } : undefined}
                        >
                          {isDone ? '✓' : '•'}
                        </span>
                        <span>{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= STEP 5 ================= */}
            {step === 4 && (
              <div className="py-4 sm:py-6 space-y-6 max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-sm bg-emerald-100 text-emerald-600 animate-in zoom-in duration-300">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h2
                    className="text-2xl sm:text-3xl font-black flex items-center justify-center gap-2 flex-wrap"
                    style={{ color: 'var(--text)' }}
                  >
                    <span>{isAr ? 'متجرك جاهز الآن' : 'YOUR STORE IS READY'}</span>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </h2>
                  <p className="text-xs sm:text-sm mt-1 max-w-lg mx-auto" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'تم تثبيت متجرك بنجاح على الاستضافة المشتركة مع الروابط المباشرة.'
                      : 'Your store is installed on shared hosting with live links ready.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
                  <div
                    className="p-4 rounded-xl border space-y-2"
                    style={{ background: 'var(--glass-fill)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                        {isAr ? 'لوحة تحكم المتجر' : 'Store Dashboard'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(dashboardUrl, 'dashboard')}
                        className="text-xs flex items-center gap-1 cursor-pointer"
                        style={{ color: 'var(--muted)' }}
                      >
                        {copiedLink === 'dashboard' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedLink === 'dashboard'
                            ? isAr
                              ? 'تم النسخ'
                              : 'Copied'
                            : isAr
                              ? 'نسخ'
                              : 'Copy'}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs font-mono font-bold truncate" style={{ color: 'var(--text)' }} dir="ltr">
                      {dashboardUrl}
                    </p>
                  </div>

                  <div
                    className="p-4 rounded-xl border space-y-2"
                    style={{ background: 'var(--glass-fill)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        {hostingOption === 'custom'
                          ? isAr
                            ? 'المتجر العام (نطاق مخصص)'
                            : 'Public Store (Custom Domain)'
                          : isAr
                            ? 'المتجر العام'
                            : 'Public Storefront'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(publicStorefrontUrl, 'storefront')}
                        className="text-xs flex items-center gap-1 cursor-pointer"
                        style={{ color: 'var(--muted)' }}
                      >
                        {copiedLink === 'storefront' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedLink === 'storefront'
                            ? isAr
                              ? 'تم النسخ'
                              : 'Copied'
                            : isAr
                              ? 'نسخ'
                              : 'Copy'}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs font-mono font-bold truncate" style={{ color: 'var(--text)' }} dir="ltr">
                      {publicStorefrontUrl}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSuccess(installedStoreId || storeSlug)}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                    style={{ background: 'var(--portal-cta)' }}
                  >
                    <Store className="w-4 h-4" />
                    <span>{isAr ? 'الدخول إلى لوحة تحكم المتجر' : 'Go to Store Dashboard'}</span>
                  </button>
                  <a
                    href={publicStorefrontUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-xs border transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{isAr ? 'زيارة المتجر العام' : 'Visit Public Storefront'}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment info modal — NO fake confirm unlock */}
      <GlobalModal
        isOpen={showPlanPaymentModal}
        onClose={() => setShowPlanPaymentModal(false)}
        aria-label={isAr ? 'معلومات الدفع' : 'Payment information'}
        contentClassName="max-w-md"
      >
        <div
          className="w-full rounded-2xl border overflow-hidden shadow-2xl"
          style={{
            background: 'var(--glass-fill-strong, var(--surface))',
            borderColor: 'var(--glass-border, var(--border))',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div
            className="px-5 py-4 text-white flex items-center justify-between"
            style={{ background: 'var(--portal-cta)' }}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 opacity-90" />
              <h3 className="font-bold text-sm">
                {isAr ? 'دفع اشتراك الباقة' : 'Plan Subscription Payment'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowPlanPaymentModal(false)}
              className="opacity-80 hover:opacity-100 cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs" style={{ color: 'var(--text)' }}>
            <div
              className="p-3 rounded-xl border"
              style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex justify-between gap-2">
                <span style={{ color: 'var(--muted)' }}>{isAr ? 'الباقة' : 'Plan'}</span>
                <span className="font-bold">{isAr ? selectedPlanMeta.nameAr : selectedPlanMeta.nameEn}</span>
              </div>
              <div className="flex justify-between mt-1 pt-1 border-t font-black text-sm" style={{ borderColor: 'var(--border)' }}>
                <span>{isAr ? 'المبلغ المستحق' : 'Amount due'}</span>
                <span style={{ color: 'var(--accent)' }}>{money(dueToday)}</span>
              </div>
            </div>

            <div
              className="flex items-start gap-2 p-3 rounded-xl border"
              style={{
                borderColor: '#10b98155',
                background: 'color-mix(in srgb, #10b981 10%, transparent)',
              }}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                {isAr
                  ? 'لا يوجد تأكيد دفع وهمي هنا. بعد إتمام التحويل أو بوابة الدفع الحقيقية يُصدر المدير دعوة مدفوعة لتفعيل الباقة.'
                  : 'There is no fake Instant confirm here. After real bank transfer or gateway payment, Master issues a paid invite to unlock the plan.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPlan('free');
                  setShowPlanPaymentModal(false);
                  toast(
                    isAr ? 'تم اختيار الباقة المجانية' : 'Free plan selected',
                    'success',
                  );
                }}
                className="px-4 py-2 rounded-xl border font-semibold cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {isAr ? 'المتابعة بالمجاني' : 'Continue with Free'}
              </button>
              <button
                type="button"
                onClick={() => setShowPlanPaymentModal(false)}
                className="px-5 py-2 rounded-xl font-bold text-white cursor-pointer"
                style={{ background: 'var(--portal-cta)' }}
              >
                {isAr ? 'حسناً' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      </GlobalModal>

      {/* Validation / status popup */}
      <GlobalModal
        isOpen={Boolean(alert)}
        onClose={() => setAlert(null)}
        aria-label={alert?.title || (isAr ? 'تنبيه' : 'Alert')}
        contentClassName="max-w-sm"
        role="alertdialog"
      >
        {alert && (
          <div
            className="w-full rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 duration-200"
            style={{
              background: 'var(--glass-fill-strong, var(--surface))',
              borderColor: 'var(--glass-border, var(--border))',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  alert.kind === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : alert.kind === 'error'
                      ? 'bg-rose-100 text-rose-700'
                      : alert.kind === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                }`}
              >
                {alert.kind === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-sm" style={{ color: 'var(--text)' }}>
                  {alert.title}
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {alert.message}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAlert(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                style={{ background: 'var(--portal-cta)' }}
              >
                {isAr ? 'حسناً' : 'OK'}
              </button>
            </div>
          </div>
        )}
      </GlobalModal>

      {/* Success celebration popup */}
      <GlobalModal
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        aria-label={isAr ? 'نجاح التثبيت' : 'Installation success'}
        contentClassName="max-w-sm"
      >
        <div
          className="w-full rounded-2xl border p-6 text-center shadow-2xl animate-in zoom-in duration-300"
          style={{
            background: 'var(--glass-fill-strong, var(--surface))',
            borderColor: 'var(--glass-border, var(--border))',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black" style={{ color: 'var(--text)' }}>
            {isAr ? 'تم بنجاح!' : 'Success!'}
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'متجرك جاهز. يمكنك فتح لوحة التحكم أو زيارة الواجهة العامة.'
              : 'Your store is ready. Open the dashboard or visit the public storefront.'}
          </p>
          <button
            type="button"
            onClick={() => setShowSuccessPopup(false)}
            className="mt-4 px-6 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
            style={{ background: 'var(--portal-cta)' }}
          >
            {isAr ? 'متابعة' : 'Continue'}
          </button>
        </div>
      </GlobalModal>

      <style>{`
        .wizard-step-enter {
          animation: wizardFadeSlide 0.35s ease-out;
        }
        @keyframes wizardFadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .wizard-glass {
            border-radius: 1rem;
          }
        }
      `}</style>
    </Shell>
  );
};

function Shell({
  theme,
  dir,
  locale,
  children,
}: {
  theme: string;
  dir: 'ltr' | 'rtl';
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <div
      dir={dir}
      lang={locale}
      data-theme={theme}
      data-portal="store"
      className="portal-auth-shell min-h-screen flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            theme === 'dark'
              ? 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,96,111,0.55) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(16,185,129,0.12) 0%, transparent 50%)'
              : 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(152,216,208,0.85) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(16,185,129,0.18) 0%, transparent 50%)',
        }}
      />
      <div className="relative w-full flex justify-center">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text)' }}>
        {label}
        {required ? <span className="text-rose-500 ms-0.5">*</span> : null}
      </label>
      <div className="relative">{children}</div>
      {error ? <p className="mt-1 text-[10px] font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return `w-full px-3 py-2.5 text-xs rounded-xl border outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--accent)] ${
    hasError ? 'border-rose-500 ring-1 ring-rose-400' : ''
  }`;
}

const inputStyle: React.CSSProperties = {
  background: 'var(--glass-fill, var(--bg))',
  borderColor: 'var(--glass-border-soft, var(--border))',
  color: 'var(--text)',
  backdropFilter: 'blur(8px)',
};
