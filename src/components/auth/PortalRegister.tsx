import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Store,
  User,
  Sparkles,
  Globe,
  Server,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Copy,
  Layers,
  Image as ImageIcon,
  Clock,
  Zap,
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

type PortalRegisterProps = {
  onSuccess: (storeId: string) => void;
  onGoLogin: () => void;
};

// 5-Step Software Installation Wizard
const WIZARD_STEPS = [
  { id: 'business', label: '1. Business Details', labelAr: '١. تفاصيل النشاط' },
  { id: 'plan', label: '2. Select Plan', labelAr: '٢. اختيار الباقة' },
  { id: 'domain', label: '3. Domain & Hosting', labelAr: '٣. النطاق والاستضافة' },
  { id: 'installing', label: '4. Installation Progress', labelAr: '٤. جاري التثبيت' },
  { id: 'ready', label: '5. Store Ready', labelAr: '٥. المتجر جاهز' },
];

export const PortalRegister: React.FC<PortalRegisterProps> = ({
  onSuccess,
  onGoLogin,
}) => {
  const { toast } = useToast();
  const { t, theme, dir, locale, setLocale, setCurrency, money } = usePrefs();
  const { registerNewClient, requestCustomDomainHosting } = useTenant();
  const isAr = locale === 'ar';

  const inviteToken = useMemo(() => readInviteFromLocation(), []);
  const inviteCheck = useMemo(
    () => checkInviteToken(inviteToken),
    [inviteToken],
  );

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // STEP 1 — Business Details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+966 5');
  const [businessName, setBusinessName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [businessDetails, setBusinessDetails] = useState('');
  const [logoUrl, setLogoUrl] = useState(
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=200&q=80',
  );
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Makkah');
  const [category, setCategory] = useState('Real Fresh Flowers & Gifts');

  // STEP 2 — PLAN (Strictly FREE vs PRO)
  const [plan, setPlan] = useState<'free' | 'pro'>('pro');
  const [showPlanPaymentModal, setShowPlanPaymentModal] = useState(false);
  const [planPaid, setPlanPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'applepay' | 'card'>('mada');

  // STEP 3 — DOMAIN & HOSTING (A. Demo vs B. Custom Domain + Shared Hosting)
  const [hostingOption, setHostingOption] = useState<'demo' | 'custom'>('demo');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [sharedHostingTier, setSharedHostingTier] = useState<
    'Hostinger Shared Starter' | 'Hostinger Shared Premium' | 'Hostinger Shared Business'
  >('Hostinger Shared Premium');
  const [domainPaid, setDomainPaid] = useState(false);

  // STEP 4 — INSTALLATION ANIMATION
  const [installProgress, setInstallProgress] = useState(0);
  const [completedAnimationSteps, setCompletedAnimationSteps] = useState<number[]>([]);
  const [installedStoreId, setInstalledStoreId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<'dashboard' | 'storefront' | null>(null);

  const INSTALL_CHECKLIST = [
    { id: 1, text: isAr ? 'تفاصيل النشاط التجاري' : 'Business Details' },
    { id: 2, text: isAr ? 'إنشاء حساب المدير' : 'Account Created' },
    { id: 3, text: isAr ? 'تأكيد الباقة المختارة' : 'Plan Selected' },
    { id: 4, text: isAr ? 'إنشاء المتجر في النظام' : 'Store Created' },
    { id: 5, text: isAr ? 'اتصال قاعدة البيانات المشتركة' : 'Database Connected' },
    { id: 6, text: isAr ? 'تثبيت الثيم التجاري الافتراضي' : 'Theme Installed' },
    { id: 7, text: isAr ? 'تكوين النطاق وتوجيه DNS' : 'Domain Configured' },
    { id: 8, text: isAr ? 'تفعيل شهادة SSL للأمان' : 'SSL Configured' },
    { id: 9, text: isAr ? 'اكتمل إعداد المتجر بنجاح' : 'Store Setup Completed' },
  ];

  useEffect(() => {
    document.documentElement.setAttribute('data-portal', 'store');
  }, []);

  // When businessName changes, auto-suggest brand and store names if empty
  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    if (!brandName) setBrandName(val);
    if (!storeName) setStoreName(val);
  };

  const storeSlug = useMemo(() => {
    const raw = (storeName || businessName || 'my-store').toLowerCase();
    return raw.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-store';
  }, [storeName, businessName]);

  const demoSubdomain = `${storeSlug}.saasdomain.com`;
  const dashboardUrl = `https://dashboard.saasdomain.com/store/${installedStoreId || storeSlug}`;
  const publicStorefrontUrl =
    hostingOption === 'custom' && customDomainInput
      ? `https://${customDomainInput.toLowerCase().trim()}`
      : `https://${demoSubdomain}`;

  const validateStep1 = (): boolean => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      toast(t('regFillAccount'), 'error');
      return false;
    }
    if (!businessName.trim() || !phone.trim() || !city.trim()) {
      toast(t('regFillBusiness'), 'error');
      return false;
    }
    return true;
  };

  const handleNextFromStep1 = () => {
    if (!validateStep1()) return;
    setStep(1); // Go to Step 2: Plan
  };

  const handleSelectPlan = (selected: 'free' | 'pro') => {
    setPlan(selected);
    if (selected === 'pro' && !planPaid) {
      setShowPlanPaymentModal(true);
    }
  };

  const handleConfirmPlanPayment = () => {
    setPlanPaid(true);
    setShowPlanPaymentModal(false);
    toast(isAr ? 'تم تأكيد دفع اشتراك باقة برو بنجاح!' : 'Pro plan payment verified successfully!', 'success');
  };

  const handleNextFromStep2 = () => {
    setStep(2); // Go to Step 3: Domain & Hosting
  };

  const handleNextFromStep3 = () => {
    if (hostingOption === 'custom' && !customDomainInput.trim()) {
      toast(isAr ? 'يرجى إدخال اسم النطاق المخصص' : 'Please enter your custom domain name', 'error');
      return;
    }
    // Launch installation wizard
    startInstallation();
  };

  // STEP 4 & 5: Run Automated Software Installation Animation
  const startInstallation = async () => {
    setStep(3); // Switch to animation screen
    setInstallProgress(10);
    setCompletedAnimationSteps([1]);

    try {
      // Step A: Provision Store in TenantContext
      const storeId = registerNewClient({
        clientName: name.trim(),
        email: email.trim(),
        businessName: (storeName || businessName).trim(),
        category: category.trim() || 'General',
        plan: plan,
        currency: 'SAR',
        locale: locale as any,
        textDirection: dir,
        timezone: 'Asia/Riyadh',
        city: city.trim(),
        phone: phone.trim(),
      });

      // If invite token exists, redeem it
      if (inviteToken && inviteCheck.ok) {
        redeemInviteToken(inviteToken, storeId);
      }

      // Register Auth user
      await registerStoreClient({
        name: name.trim(),
        email: email.trim(),
        password,
        businessName: (storeName || businessName).trim(),
        storeId,
      });

      // If custom domain selected, submit hosting request
      if (hostingOption === 'custom' && customDomainInput.trim()) {
        requestCustomDomainHosting(storeId, customDomainInput.trim(), sharedHostingTier);
      }

      setInstalledStoreId(storeId);

      // Realistic step-by-step installation progress animation
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
        setTimeout(() => {
          setInstallProgress(item.progress);
          setCompletedAnimationSteps((prev) => [...prev, item.stepId]);
        }, item.delay);
      });

      // After complete, transition to Final Ready Screen (Step 4 index = step 5)
      setTimeout(() => {
        setStep(4);
        toast(isAr ? 'مبروك! تم تثبيت متجرك وهو جاهز الآن' : 'Congratulations! Your store is ready', 'success');
      }, 3600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('regFailed');
      toast(msg, 'error');
      setStep(0);
    }
  };

  const handleCopy = async (text: string, type: 'dashboard' | 'storefront') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(type);
      toast(isAr ? 'تم نسخ الرابط بنجاح' : 'Link copied to clipboard', 'success');
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      toast('Copy failed', 'error');
    }
  };

  return (
    <Shell theme={theme} dir={dir} locale={locale}>
      <div
        className="relative w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Top Software Installation Header */}
        <div
          className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ borderColor: 'var(--border)', background: 'var(--hover-bg)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ background: 'var(--portal-cta)' }}
            >
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block">
                Software Installation Wizard
              </span>
              <h1 className="text-base sm:text-lg font-black" style={{ color: 'var(--text)' }}>
                {isAr ? 'معالج تثبيت المتجر الإلكتروني' : 'Store Setup & Installation Wizard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PrefsSwitcher compact />
            <button
              type="button"
              onClick={onGoLogin}
              className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="px-6 py-3 border-b bg-white dark:bg-slate-900" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between text-[11px] font-bold">
            {WIZARD_STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`flex items-center gap-1.5 ${
                  idx === step
                    ? 'text-teal-700 dark:text-teal-400 font-extrabold'
                    : idx < step
                      ? 'text-emerald-600 font-semibold'
                      : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    idx === step
                      ? 'bg-teal-800 text-white'
                      : idx < step
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {idx < step ? '✓' : idx + 1}
                </span>
                <span className="hidden sm:inline">{isAr ? s.labelAr : s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Body by Step */}
        <div className="p-6 sm:p-8">
          {/* ================= STEP 1: BUSINESS DETAILS ================= */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'الخطوة الأولى: تفاصيل النشاط والتاجر' : 'Step 1 — Business Details'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'أدخل بياناتك ومعلومات المتجر لإنشاء الحساب وقاعدة البيانات المخصصة.'
                    : 'Enter your business identity, store branding, and admin login credentials.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={isAr ? 'اسم التاجر / المسؤول' : 'Client Full Name'}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Al-Makki"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClassPlain}
                    style={inputStyle}
                  />
                </Field>

                <Field label={isAr ? 'البريد الإلكتروني' : 'Email Address'}>
                  <input
                    type="email"
                    required
                    placeholder="tariq@example.sa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassPlain}
                    style={inputStyle}
                  />
                </Field>

                <Field label={isAr ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}>
                  <input
                    type="tel"
                    required
                    placeholder="+966 50 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClassPlain}
                    style={inputStyle}
                  />
                </Field>

                <Field label={isAr ? 'المدينة' : 'City'}>
                  <input
                    type="text"
                    required
                    placeholder="Makkah"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputClassPlain}
                    style={inputStyle}
                  />
                </Field>

                <Field label={isAr ? 'اسم النشاط التجاري' : 'Business Name'}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Makkah Blooms Establishment"
                    value={businessName}
                    onChange={(e) => handleBusinessNameChange(e.target.value)}
                    className={inputClassPlain}
                    style={inputStyle}
                  />
                </Field>

                <Field label={isAr ? 'اسم العلامة التجارية' : 'Brand Name'}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Makkah Fresh Flowers"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className={inputClassPlain}
                    style={inputStyle}
                  />
                </Field>

                <Field label={isAr ? 'اسم المتجر' : 'Store Name'}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Makkah Flowers"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className={inputClassPlain}
                    style={inputStyle}
                  />
                </Field>

                <Field label={isAr ? 'رابط الشعار' : 'Logo Image URL'}>
                  <input
                    type="url"
                    placeholder="https://... logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className={inputClassPlain}
                    style={inputStyle}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label={isAr ? 'معلومات وتفاصيل المتجر' : 'Business / Store Information'}>
                    <textarea
                      rows={2}
                      placeholder="Specialized in luxury natural flowers, bridal bouquets, and express hotel deliveries in Makkah."
                      value={businessDetails}
                      onChange={(e) => setBusinessDetails(e.target.value)}
                      className={inputClassPlain}
                      style={inputStyle}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label={isAr ? 'كلمة مرور لوحة التحكم' : 'Admin Password (min 6 characters)'}>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClassPlain}
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="px-6 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-xs cursor-pointer"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  <span>{isAr ? 'التالي: اختيار الباقة' : 'Next: Select Plan'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PLAN SELECTION ================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'الخطوة الثانية: اختيار الباقة' : 'Step 2 — Select Plan'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'خطتان واضحتان لتلبية احتياجاتك مع تجربة متكاملة.'
                    : 'Choose between the Free starter tier and the Pro commercial tier.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* FREE PLAN */}
                <div
                  onClick={() => handleSelectPlan('free')}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    plan === 'free'
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Starter
                      </span>
                      {plan === 'free' && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                    </div>
                    <h3 className="text-xl font-black">FREE</h3>
                    <p className="text-2xl font-black mt-2 text-slate-900 dark:text-slate-100">
                      {money(0)} <span className="text-xs font-normal text-slate-500">/ forever</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {isAr ? 'الميزات الأساسية لبدء المبيعات' : 'Basic features to launch your online presence'}
                    </p>

                    <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <li className="flex items-center gap-2">✓ Up to 50 Products</li>
                      <li className="flex items-center gap-2">✓ Basic E-Commerce Theme</li>
                      <li className="flex items-center gap-2">✓ Platform Demo Subdomain</li>
                      <li className="flex items-center gap-2">✓ Free SSL Security</li>
                    </ul>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                      {plan === 'free' ? 'Selected' : 'Select Free Plan'}
                    </span>
                  </div>
                </div>

                {/* PRO PLAN */}
                <div
                  onClick={() => handleSelectPlan('pro')}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    plan === 'pro'
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="absolute top-0 end-0 bg-teal-800 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl">
                    Recommended
                  </span>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        Commercial
                      </span>
                      {plan === 'pro' && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                    </div>
                    <h3 className="text-xl font-black">PRO / PAID</h3>
                    <p className="text-2xl font-black mt-2 text-slate-900 dark:text-slate-100">
                      {money(149)} <span className="text-xs font-normal text-slate-500">/ month</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {isAr ? 'الميزات المتقدمة وتوصيل النطاق الخاص' : 'Premium features & custom domain integration'}
                    </p>

                    <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <li className="flex items-center gap-2">✓ Unlimited Products & Variations</li>
                      <li className="flex items-center gap-2">✓ Full Theme Catalog & Visual Builder</li>
                      <li className="flex items-center gap-2">✓ Custom Domain + Hostinger Shared Hosting</li>
                      <li className="flex items-center gap-2">✓ Automated Invoices with Zatca QR Code</li>
                      <li className="flex items-center gap-2">✓ Marketing Channels & Advanced SEO</li>
                    </ul>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                      {plan === 'pro' ? (planPaid ? 'Paid & Active' : 'Selected (Click to Pay)') : 'Select Pro Plan'}
                    </span>
                    {plan === 'pro' && !planPaid && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        Payment Open
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isAr ? 'السابق' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  className="px-6 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-xs cursor-pointer"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  <span>{isAr ? 'التالي: النطاق والاستضافة' : 'Next: Domain & Hosting'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: DOMAIN & HOSTING ================= */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'الخطوة الثالثة: النطاق والاستضافة' : 'Step 3 — Domain & Hosting'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'اختر بين النطاق التجريبي المجاني أو ربط نطاق مخصص واستضافة مشتركة.'
                    : 'Choose your hosting option. Strictly Hostinger Shared Hosting (No VPS/Dedicated).'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* OPTION A: DEMO / PLATFORM HOSTING */}
                <div
                  onClick={() => setHostingOption('demo')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    hostingOption === 'demo'
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                        Option A
                      </span>
                      {hostingOption === 'demo' && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                    </div>

                    <h3 className="text-base font-bold">Demo / Platform Shared Hosting</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {isAr
                        ? 'نطاق فرعي تلقائي واستضافة مشتركة مجانية مشمولة بالكامل بدون أي إعداد يدوي.'
                        : 'Free instant demo subdomain with pre-configured shared hosting. No manual DNS configuration needed.'}
                    </p>

                    <div className="mt-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-teal-700 dark:text-teal-300">
                      https://{demoSubdomain}
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-emerald-600">✓ 100% Free · Immediate Activation</span>
                  </div>
                </div>

                {/* OPTION B: CUSTOM DOMAIN + SHARED HOSTING */}
                <div
                  onClick={() => setHostingOption('custom')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    hostingOption === 'custom'
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        Option B
                      </span>
                      {hostingOption === 'custom' && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                    </div>

                    <h3 className="text-base font-bold">Custom Domain + Shared Hosting</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {isAr
                        ? 'أدخل نطاقك المخصص وشراء استضافة Hostinger المشتركة مع توجيه تلقائي وشهادة SSL.'
                        : 'Connect your branded domain (e.g. makkaflower.com). Workflow processed by Master Admin / Hostinger API.'}
                    </p>

                    {hostingOption === 'custom' && (
                      <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="text-[10px] font-bold block mb-1">Custom Domain</label>
                          <input
                            type="text"
                            required
                            placeholder="makkaflower.com"
                            value={customDomainInput}
                            onChange={(e) => setCustomDomainInput(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border font-mono bg-white dark:bg-slate-900"
                            style={{ borderColor: 'var(--border)' }}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold block mb-1">Shared Hosting Plan</label>
                          <select
                            value={sharedHostingTier}
                            onChange={(e) => setSharedHostingTier(e.target.value as any)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-900"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <option value="Hostinger Shared Starter">Hostinger Shared Starter (SAR 29/mo)</option>
                            <option value="Hostinger Shared Premium">Hostinger Shared Premium (SAR 49/mo)</option>
                            <option value="Hostinger Shared Business">Hostinger Shared Business (SAR 79/mo)</option>
                          </select>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            * Strictly Hostinger Shared. VPS/Dedicated servers not permitted.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-amber-600">★ Branded Domain · Hostinger Shared</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isAr ? 'السابق' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextFromStep3}
                  className="px-7 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-xs cursor-pointer"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'تثبيت وإنشاء المتجر' : 'Install Store Now'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: INSTALLATION ANIMATION ================= */}
          {step === 3 && (
            <div className="py-6 space-y-6 max-w-xl mx-auto text-center">
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
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'يرجى الانتظار بينما نقوم بإعداد قاعدة البيانات، النطاق، والثيم التجاري.'
                    : 'Setting up database partition, Hostinger shared hosting, SSL certificates, and default theme.'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-300"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 font-bold">
                  <span>{isAr ? 'حالة التثبيت' : 'Installation Status'}</span>
                  <span>{installProgress}%</span>
                </div>
              </div>

              {/* 9-Step Animated Installation Checklist */}
              <div className="text-start bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                {INSTALL_CHECKLIST.map((item) => {
                  const isDone = completedAnimationSteps.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2.5 text-xs transition-opacity ${
                        isDone ? 'opacity-100 font-bold text-slate-900 dark:text-slate-100' : 'opacity-40 text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}
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

          {/* ================= STEP 5: FINAL READY SCREEN ================= */}
          {step === 4 && (
            <div className="py-6 space-y-6 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <span>{isAr ? 'متجرك جاهز الآن' : 'YOUR STORE IS READY'}</span>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 inline-block" />
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
                  {isAr
                    ? 'تم تثبيت متجرك بنجاح وتجهيز بيئة الاستضافة المشتركة والروابط المباشرة.'
                    : 'Your store has been installed on Hostinger Shared infrastructure and is now ready.'}
                </p>
              </div>

              {/* Two Clear Links Cards (Dashboard URL + Public Storefront URL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
                {/* 1. Dashboard URL */}
                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-300">
                      {isAr ? 'لوحة تحكم SaaS' : 'SaaS Dashboard'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(dashboardUrl, 'dashboard')}
                      title={isAr ? 'نسخ الرابط' : 'Copy link'}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedLink === 'dashboard' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink === 'dashboard' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                    </button>
                  </div>
                  <p className="text-xs font-mono font-bold truncate text-slate-800 dark:text-slate-200" dir="ltr">
                    {dashboardUrl}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isAr
                      ? 'إدارة المنتجات والطلبات والمخزون وإعدادات الثيم.'
                      : 'Manage products, orders, inventory, and theme settings.'}
                  </p>
                </div>

                {/* 2. Public Storefront URL */}
                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
                      {hostingOption === 'custom'
                        ? (isAr ? 'المتجر العام (نطاق مخصص)' : 'Public Store (Custom Domain)')
                        : (isAr ? 'المتجر العام التجريبي' : 'Demo Public Store')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(publicStorefrontUrl, 'storefront')}
                      title={isAr ? 'نسخ الرابط' : 'Copy link'}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedLink === 'storefront' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink === 'storefront' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                    </button>
                  </div>
                  <p className="text-xs font-mono font-bold truncate text-slate-800 dark:text-slate-200" dir="ltr">
                    {publicStorefrontUrl}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {hostingOption === 'custom'
                      ? (isAr ? 'رابط احتياطي مباشر: ' : 'Live fallback: ') + demoSubdomain
                      : (isAr ? 'متاح فوراً مع شهادة SSL مجانية.' : 'Live immediately with free SSL certificate.')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
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
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-xs border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
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

      {/* Plan Pro Payment Simulation Modal */}
      {showPlanPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-teal-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-sm">
                  {isAr ? 'دفع اشتراك باقة برو' : 'Pro Plan Subscription Payment'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPlanPaymentModal(false)}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                title={isAr ? 'إغلاق' : 'Close'}
                className="text-teal-200 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الباقة المختارة' : 'Plan Selected'}</span>
                  <span className="font-bold">{isAr ? 'برو التجارية' : 'PRO Commercial'}</span>
                </div>
                <div className="flex justify-between mt-1 pt-1 border-t border-slate-200 dark:border-slate-700 font-black text-sm">
                  <span>{isAr ? 'المبلغ المستحق اليوم' : 'Total Due Today'}</span>
                  <span className="text-teal-700 dark:text-teal-300">{money(149)}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold block mb-2">
                  {isAr ? 'اختر طريقة الدفع' : 'Select Payment Method'}
                </span>
                <div className="grid grid-cols-3 gap-2 text-center font-bold text-xs" role="radiogroup">
                  {([
                    { id: 'mada', label: isAr ? 'مدى' : 'Mada' },
                    { id: 'applepay', label: 'Apple Pay' },
                    { id: 'card', label: isAr ? 'فيزا / ماستركارد' : 'Visa / MC' },
                  ] as const).map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        paymentMethod === pm.id
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-500/15 text-teal-800 dark:text-teal-200'
                          : 'border-slate-200 dark:border-slate-700 hover:border-teal-400'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlanPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPlanPayment}
                  className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold cursor-pointer shadow-sm"
                >
                  {isAr ? 'تأكيد ومتابعة' : 'Confirm & Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
      className="portal-auth-shell min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-35"
        style={{
          background:
            theme === 'dark'
              ? 'radial-gradient(ellipse 70% 40% at 50% 0%, #10606f 0%, transparent 55%)'
              : 'radial-gradient(ellipse 70% 40% at 50% 0%, #98d8d0 0%, transparent 55%)',
        }}
      />
      <div className="relative w-full flex justify-center">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text)' }}>
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}

const inputClassPlain =
  'w-full px-3 py-2 text-xs rounded-xl border outline-none focus:ring-2 focus:ring-[var(--accent)] transition-shadow duration-150';
const inputStyle: React.CSSProperties = {
  background: 'var(--bg)',
  borderColor: 'var(--border)',
  color: 'var(--text)',
};
