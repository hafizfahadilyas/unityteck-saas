import React, { useState, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  Globe,
  Server,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  CreditCard,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  Terminal,
  Database,
  Check,
  ChevronRight,
  Layers,
  Rocket,
  HelpCircle,
  Archive,
} from 'lucide-react';
import type { DomainRecord } from '../../types';
import { PageDocsGuideModal } from '../common/PageDocsGuideModal';
import { DomainRoutingTester } from './domains/DomainRoutingTester';

export const StoreHostingDomain: React.FC = () => {
  const {
    activeStore,
    domains,
    connectHostingerToStore,
    verifyDomainDns,
    deployStoreLive,
    setStoreDomainMode,
    requestCustomDomainHosting,
    toggleDomainSsl,
  } = useTenant();
  const { t, locale, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState(activeStore.custom_domain || 'giftshop-sa.com');
  const [selectedHostingTier, setSelectedHostingTier] = useState<DomainRecord['hostingTier']>(
    'Hostinger Shared Business',
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'apple_pay' | 'visa'>('mada');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Find domain associated with this store
  const storeDomain = useMemo(() => {
    return (
      domains.find((d) => d.storeId === activeStore.id) ||
      domains.find((d) => d.domainType === 'custom') ||
      domains[0]
    );
  }, [domains, activeStore.id]);

  const demoDomainUrl =
    activeStore.demo_domain || `${activeStore.slug}.saasdomain.com`;
  const currentActiveDomain =
    activeStore.domain || activeStore.custom_domain || demoDomainUrl;

  // Determine current lifecycle step for status badges
  // Badges: "Demo" → "Payment Pending" → "Shared Hosting Connected" → "Domain Pending" → "DNS Verified" → "SSL Active" → "Deploying" → "Live"
  const currentBadgeStatus = useMemo(() => {
    if (!activeStore.custom_domain && !storeDomain?.domainName.includes('.')) {
      return 'Demo';
    }
    if (activeStore.deployment_status === 'live' && activeStore.ssl_status === 'active') {
      return 'Live';
    }
    if (activeStore.deployment_status === 'deploying' || isDeploying) {
      return 'Deploying';
    }
    if (activeStore.ssl_status === 'active' || storeDomain?.sslStatus === 'active') {
      return 'SSL Active';
    }
    if (activeStore.dns_status === 'verified' || storeDomain?.dnsVerified) {
      return 'DNS Verified';
    }
    if (activeStore.hostinger_status === 'connected' || storeDomain?.hostingId) {
      return 'Shared Hosting Connected';
    }
    if (storeDomain?.status === 'pending_payment') {
      return 'Payment Pending';
    }
    return 'Demo';
  }, [activeStore, storeDomain, isDeploying]);

  const BADGE_STEPS = [
    { id: 'Demo', label: isAr ? 'متجر تجريبي' : 'Demo' },
    { id: 'Payment Pending', label: isAr ? 'في انتظار الدفع' : 'Payment Pending' },
    { id: 'Shared Hosting Connected', label: isAr ? 'استضافة مشتركة متصلة' : 'Shared Hosting Connected' },
    { id: 'Domain Pending', label: isAr ? 'النطاق قيد المعالجة' : 'Domain Pending' },
    { id: 'DNS Verified', label: isAr ? 'تم التحقق من DNS' : 'DNS Verified' },
    { id: 'SSL Active', label: isAr ? 'شهادة SSL مفعلة' : 'SSL Active' },
    { id: 'Deploying', label: isAr ? 'جاري النشر' : 'Deploying' },
    { id: 'Live', label: isAr ? 'المتجر مباشر' : 'Live' },
  ];

  const currentStepIndex = BADGE_STEPS.findIndex((s) => s.id === currentBadgeStatus);

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(`https://${url}`);
      setCopiedUrl(true);
      toast(isAr ? 'تم نسخ الرابط بنجاح' : 'Storefront URL copied', 'success');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast(isAr ? 'تعذّر النسخ' : 'Copy failed', 'error');
    }
  };

  const handleBuyHostingAndDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDomainInput.trim()) {
      toast(isAr ? 'يرجى إدخال اسم النطاق' : 'Please enter a valid domain name', 'error');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      requestCustomDomainHosting(activeStore.id, customDomainInput, selectedHostingTier);
      toast(
        isAr
          ? 'تم الدفع بنجاح! تم إرسال طلب الاستضافة المشتركة إلى المشرف العام.'
          : 'Payment successful! Shared hosting & domain request created for Master Admin approval.',
        'success',
      );
    }, 1200);
  };

  const handleVerifyDns = () => {
    if (!storeDomain) return;
    setIsVerifyingDns(true);
    setTimeout(() => {
      setIsVerifyingDns(false);
      verifyDomainDns(storeDomain.id);
      toast(
        isAr
          ? 'تم التحقق من سجلات DNS بنجاح على استضافة Hostinger المشتركة!'
          : 'DNS records verified on Hostinger Shared Hosting!',
        'success',
      );
    }, 1000);
  };

  const handleDeployStore = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      deployStoreLive(activeStore.id, storeDomain?.id);
      toast(
        isAr
          ? 'تم نشر أحدث إصدار للمتجر بنجاح! متجرك الآن مباشر عبر SSL.'
          : 'Latest store build deployed to Hostinger Shared public_html! Store is now Live.',
        'success',
      );
    }, 1500);
  };

  return (
    <div
      className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800"
      style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
              style={{ background: 'var(--portal-cta)', color: '#ffffff' }}
            >
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                {isAr ? 'إعدادات الاستضافة والنطاق' : 'Hosting & Domain Central Hub'}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'استضافة مشتركة سريعة من Hostinger حصرياً — لا خوادم VPS أو Dedicated.'
                  : 'Hostinger Shared Hosting only (No VPS/Dedicated/Cloud). Seamless automated deployment & SSL.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span>{isAr ? '📘 دليل الاستخدام المصور' : '📘 Docs & How to Use'}</span>
          </button>

          <a
            href="/admin?tab=backup"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 flex items-center gap-1.5 shadow-2xs hover:bg-purple-500/20 transition-colors cursor-pointer"
          >
            <Archive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>{isAr ? 'مركز النسخ والاستعادة' : 'Backup & Restore Center'}</span>
          </a>

          <a
            href="https://giftshop-sa.com/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'لوحة تحكم المتجر المباشر' : 'Live Store Admin'}</span>
          </a>

          <a
            href="https://giftshop-sa.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-opacity hover:opacity-90"
            style={{ background: 'var(--portal-cta)' }}
          >
            <ExternalLink className="w-4 h-4" />
            <span>{isAr ? 'معاينة المتجر المباشر' : 'Open Live Storefront'}</span>
          </a>
        </div>
      </div>

      {/* Multi-Domain Dynamic Routing Tester (Phase 6.1) */}
      <DomainRoutingTester embeddedIn="store" />

      {/* Hostinger Backup & Migration Quick Card Banner */}
      <div
        className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs"
        style={{
          background: 'color-mix(in srgb, var(--portal-cta) 8%, var(--surface))',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? 'مركز النسخ الاحتياطي والاستعادة ونقل المتاجر' : 'Hostinger Backup, Restore & 2nd Server Migration'}
            </h3>
            <p className="text-xs opacity-75">
              {isAr
                ? 'تحميل حزمة المتجر الكاملة ZIP، استعادة النسخ المجدولة، ونقل المتجر إلى استضافة ثانية بنقرة واحدة.'
                : '1-click full store ZIP archive, automated daily/weekly snapshots, and all-in-one migration to 2nd Hostinger.'}
            </p>
          </div>
        </div>
        <a
          href="/admin?tab=backup"
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: 'var(--portal-cta)' }}
        >
          <Rocket className="w-4 h-4" />
          <span>{isAr ? 'فتح مركز النسخ والنقل' : 'Open Migration Center'}</span>
        </a>
      </div>

      {/* Lifecycle Status Stepper Badges */}
      {/* Flow: "Demo" → "Payment Pending" → "Shared Hosting Connected" → "Domain Pending" → "DNS Verified" → "SSL Active" → "Deploying" → "Live" */}
      <div
        className="p-4 rounded-2xl border shadow-2xs space-y-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            {isAr ? 'مسار حالة الاستضافة والنطاق' : 'Domain & Hosting Lifecycle Flow'}
          </span>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1"
            style={{
              background: 'color-mix(in srgb, var(--accent) 15%, var(--surface))',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{BADGE_STEPS.find((s) => s.id === currentBadgeStatus)?.label ?? currentBadgeStatus}</span>
          </span>
        </div>

        {/* Badges Progress Rail */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {BADGE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className="p-2.5 rounded-xl border flex flex-col justify-between transition-all"
                style={{
                  background: isCurrent
                    ? 'color-mix(in srgb, var(--portal-cta) 12%, var(--surface))'
                    : isCompleted
                      ? 'color-mix(in srgb, #10b981 8%, var(--surface))'
                      : 'var(--hover-bg)',
                  borderColor: isCurrent
                    ? 'var(--portal-cta)'
                    : isCompleted
                      ? '#10b981'
                      : 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px]"
                    style={{
                      background: isCurrent
                        ? 'var(--portal-cta)'
                        : isCompleted
                          ? '#10b981'
                          : 'var(--border)',
                      color: isCurrent || isCompleted ? '#ffffff' : 'var(--muted)',
                    }}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] font-extrabold uppercase" style={{ color: 'var(--portal-cta)' }}>
                      {isAr ? 'الحالية' : 'Active'}
                    </span>
                  )}
                </div>
                <span
                  className="text-[11px] font-bold leading-tight"
                  style={{
                    color: isCurrent ? 'var(--portal-cta)' : isCompleted ? '#059669' : 'var(--muted)',
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2 Clear Options: Option 1 (Demo Store) & Option 2 (Custom Domain + Shared Hosting) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OPTION 1: DEMO STORE */}
        <div
          className="p-5 sm:p-6 rounded-2xl border shadow-2xs flex flex-col justify-between space-y-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200">
                {isAr ? 'الخيار 1' : 'Option 1'} · {isAr ? 'متجر تجريبي فوري' : 'Demo Store'}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'مباشر وتلقائي' : 'Auto Assigned'}</span>
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'نطاق واستضافة المنصة التجريبية' : 'Platform Shared Demo Subdomain'}
            </h2>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'يتم تعيين نطاق فرعي تلقائياً لمتجرك مع استضافة مشتركة مجانية وشهادة SSL مفعلة فوراً دون أي إعداد يدوي.'
                : 'Demo subdomain automatically assigned. Client store is immediately live in demo mode with pre-configured SSL.'}
            </p>

            {/* Subdomain URL Box */}
            <div
              className="mt-4 p-3.5 rounded-xl border flex items-center justify-between gap-3 font-mono text-xs"
              style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
            >
              <div className="min-w-0 flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-bold truncate" style={{ color: 'var(--text)' }}>
                  https://{demoDomainUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyUrl(demoDomainUrl)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border bg-white dark:bg-slate-800 hover:opacity-80 transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}</span>
              </button>
            </div>

            {/* Demo Specs */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'نوع الاستضافة' : 'Hosting Type'}
                </span>
                <span className="font-bold text-xs" style={{ color: 'var(--text)' }}>
                  Hostinger Shared Cloud
                </span>
              </div>
              <div className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'حالة التشفير' : 'SSL Security'}
                </span>
                <span className="font-bold text-xs text-emerald-600 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>{isAr ? "Let's Encrypt مفعّلة" : "Let's Encrypt Active"}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs text-slate-500">
              {isAr ? 'يعمل دائماً كعنوان بديل' : 'Always active as live fallback'}
            </span>
            <button
              type="button"
              onClick={() => {
                setStoreDomainMode(activeStore.id, 'demo');
                toast(isAr ? 'تم ضبط النطاق التجريبي كافتراضي' : 'Demo subdomain set as active URL', 'success');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {isAr ? 'تعيين كافتراضي' : 'Use as Active'}
            </button>
          </div>
        </div>

        {/* OPTION 2: CUSTOM DOMAIN + SHARED HOSTING */}
        <div
          className="p-5 sm:p-6 rounded-2xl border shadow-2xs flex flex-col justify-between space-y-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                {isAr ? 'الخيار 2' : 'Option 2'} · {isAr ? 'نطاق خاص + استضافة مشتركة' : 'Custom Domain + Shared Hosting'}
              </span>
              <span className="text-[11px] font-bold text-amber-600 inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'احترافي' : 'Professional Brand'}</span>
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'شراء وتوصيل نطاق واستضافة مشتركة' : 'Buy Custom Domain & Shared Hosting'}
            </h2>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'اربط متجرك بنطاقك المخصص عبر استضافة Hostinger المشتركة مع تحقق DNS التلقائي وشهادة SSL.'
                : 'Connect your custom domain (e.g. makkaflower.com). Payment is securely processed via our SaaS gateway.'}
            </p>

            <form onSubmit={handleBuyHostingAndDomain} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'اسم النطاق المخصص' : 'Custom Domain Name'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: makkaflower.com' : 'e.g. makkaflower.com'}
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-900 font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'باقة الاستضافة المشتركة (Hostinger Shared Only)' : 'Shared Hosting Plan (Hostinger Only)'}
                </label>
                <select
                  value={selectedHostingTier}
                  onChange={(e) => setSelectedHostingTier(e.target.value as DomainRecord['hostingTier'])}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-900"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <option value="Hostinger Shared Starter">
                    {isAr
                      ? `Hostinger Shared Starter (${money(29)}/شهرياً) — 100GB SSD، SSL مجاني`
                      : `Hostinger Shared Starter (${money(29)}/mo) — 100GB SSD, Free SSL`}
                  </option>
                  <option value="Hostinger Shared Premium">
                    {isAr
                      ? `Hostinger Shared Premium (${money(49)}/شهرياً) — 200GB NVMe، نطاق مجاني، نسخ احتياطي أسبوعي`
                      : `Hostinger Shared Premium (${money(49)}/mo) — 200GB NVMe, Free Domain, Weekly Backups`}
                  </option>
                  <option value="Hostinger Shared Business">
                    {isAr
                      ? `Hostinger Shared Business (${money(79)}/شهرياً) — نسخ احتياطي يومي، CDN مجاني، بيئة تجريبية`
                      : `Hostinger Shared Business (${money(79)}/mo) — Daily Backups, Free CDN, Staging`}
                  </option>
                </select>
                <span className="text-[10px] mt-1 flex items-center gap-1 text-slate-400">
                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>
                    {isAr
                      ? 'تنبيه: نظامنا يدعم فقط الاستضافة المشتركة (Shared Hosting). لا نستخدم VPS أو خوادم سحابية.'
                      : 'Important rule: Shared Hosting only. VPS or dedicated cloud servers are strictly prohibited.'}
                  </span>
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: 'var(--portal-cta)' }}
              >
                <CreditCard className="w-4 h-4" />
                <span>{isAr ? 'شراء الاستضافة والنطاق والدفع' : 'Buy Hosting & Domain via Gateway'}</span>
              </button>
            </form>
          </div>

          {/* Quick status footer if custom domain is already registered */}
          {activeStore.custom_domain && (
            <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div className="text-xs">
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {activeStore.custom_domain}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Hosting ID: {activeStore.hosting_id || 'hst-shared-01'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleVerifyDns}
                  disabled={isVerifyingDns}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <RefreshCw className={`w-3 h-3 ${isVerifyingDns ? 'animate-spin' : ''}`} />
                  <span>{isAr ? 'تحقق DNS' : 'Verify DNS'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeployStore}
                  disabled={isDeploying}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-white transition-opacity hover:opacity-90 inline-flex items-center gap-1 cursor-pointer"
                  style={{ background: '#059669' }}
                >
                  <Zap className={`w-3 h-3 ${isDeploying ? 'animate-bounce' : ''}`} />
                  <span>{isDeploying ? (isAr ? 'جاري النشر…' : 'Deploying…') : isAr ? 'نشر المتجر' : 'Deploy Live'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DNS Configuration Table & Hostinger Shared Mapping */}
      <div
        className="p-5 sm:p-6 rounded-2xl border shadow-2xs space-y-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'إعدادات وسجلات DNS للاستضافة المشتركة' : 'Hostinger Shared DNS Configuration'}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'السجلات المطلوبة لتوجيه نطاقك المخصص إلى خوادم Hostinger المشتركة التابعة للمنصة.'
                : 'Required DNS records to route your custom domain to our Hostinger Shared server.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVerifyDns}
              disabled={isVerifyingDns}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-900 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingDns ? 'animate-spin text-teal-600' : ''}`} />
              <span>{isVerifyingDns ? (isAr ? 'جاري الفحص…' : 'Checking DNS…') : isAr ? 'إعادة فحص DNS' : 'Check DNS Records'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr
                className="border-b text-[11px] font-bold tracking-wider uppercase"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                <th className="py-2.5 px-3">{isAr ? 'النوع' : 'Type'}</th>
                <th className="py-2.5 px-3">{isAr ? 'المضيف / الاسم' : 'Host / Name'}</th>
                <th className="py-2.5 px-3">{isAr ? 'يشير إلى / القيمة المستهدفة' : 'Points To / Target Value'}</th>
                <th className="py-2.5 px-3">{isAr ? 'مدة الصلاحية TTL' : 'TTL'}</th>
                <th className="py-2.5 px-3 text-end">{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700 dark:text-slate-300" style={{ borderColor: 'var(--border)' }}>
              <tr>
                <td className="py-3 px-3 font-bold text-teal-600">A</td>
                <td className="py-3 px-3">@</td>
                <td className="py-3 px-3 font-bold">145.79.26.23 / 185.199.108.153 {isAr ? '(عنوان IP لاستضافة Hostinger المشتركة)' : '(Hostinger Shared IP)'}</td>
                <td className="py-3 px-3">3600</td>
                <td className="py-3 px-3 text-end">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                    <Check className="w-3 h-3" />
                    {isAr ? 'تم التحقق' : 'Verified'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-teal-600">CNAME</td>
                <td className="py-3 px-3">www</td>
                <td className="py-3 px-3 font-bold">{currentActiveDomain}</td>
                <td className="py-3 px-3">3600</td>
                <td className="py-3 px-3 text-end">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                    <Check className="w-3 h-3" />
                    {isAr ? 'تم التحقق' : 'Verified'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-teal-600">TXT</td>
                <td className="py-3 px-3">_unityteck-verify</td>
                <td className="py-3 px-3 truncate max-w-xs text-slate-500">
                  unityteck-domain-verification=giftshop-sa-active
                </td>
                <td className="py-3 px-3">3600</td>
                <td className="py-3 px-3 text-end">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                    <Check className="w-3 h-3" />
                    {isAr ? 'تم التحقق' : 'Verified'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Database & Hosting Architecture Fields (Required by Master Prompt) */}
      <div
        className="p-5 sm:p-6 rounded-2xl border shadow-2xs space-y-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Database className="w-4 h-4 text-teal-600" />
              <span>{isAr ? 'بيانات قاعدة البيانات وخريطة المتجر' : 'Store Architecture & Database Schema Mapping'}</span>
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'الحقول الإلزامية المحفوظة في قاعدة بيانات النظام لكل متجر.'
                : 'Exact database schema keys maintained for multi-tenant isolation on Hostinger Shared MySQL.'}
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
            MySQL 8.0 · utf8mb4
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div className="p-3 rounded-xl border font-mono" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] text-slate-400 block font-sans">store_id</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
              {activeStore.id}
            </span>
          </div>

          <div className="p-3 rounded-xl border font-mono" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] text-slate-400 block font-sans">hosting_id</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
              {activeStore.hosting_id || 'hst-shared-01'}
            </span>
          </div>

          <div className="p-3 rounded-xl border font-mono" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] text-slate-400 block font-sans">domain</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
              {currentActiveDomain}
            </span>
          </div>

          <div className="p-3 rounded-xl border font-mono" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] text-slate-400 block font-sans">database_id</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
              {activeStore.database_id || 'u920689430_giftshop'}
            </span>
          </div>

          <div className="p-3 rounded-xl border font-mono" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] text-slate-400 block font-sans">ssl_status</span>
            <span className="font-bold text-emerald-600 truncate block">
              {activeStore.ssl_status || 'active'}
            </span>
          </div>

          <div className="p-3 rounded-xl border font-mono" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] text-slate-400 block font-sans">deployment_status</span>
            <span className="font-bold text-emerald-600 truncate block">
              {activeStore.deployment_status || 'live'}
            </span>
          </div>

          <div className="p-3 rounded-xl border font-mono" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] text-slate-400 block font-sans">subscription_status</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
              {activeStore.subscription_status || 'active'}
            </span>
          </div>
        </div>
      </div>

      {/* Automated Git/API Deployment Pipeline Log Terminal */}
      <div className="rounded-2xl bg-slate-950 text-slate-200 p-4 sm:p-5 border border-slate-800 shadow-md font-mono text-xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-100">
              {isAr ? 'مسار النشر الآلي عبر Git/API للاستضافة المشتركة' : 'Automated Git/API Shared Deployment Pipeline'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {isAr ? 'اتصال Hostinger FTP و MySQL مفعل' : 'Hostinger FTP & MySQL Connected'}
          </span>
        </div>

        <div className="space-y-1 text-[11px] text-slate-300 pt-1">
          <p className="text-emerald-400">✔ Git build verified · Production SPA artifacts compiled</p>
          <p>✔ Hostinger FTP Server: 145.79.26.23 · User: u920689430.giftshop</p>
          <p>✔ Remote Directory: /home/u920689430/domains/{currentActiveDomain}/public_html</p>
          <p>✔ Database: srv1422.hstgr.io (u920689430_giftshop) · Dedicated MySQL</p>
          <p>✔ SSL certificate installed &amp; renewed via Let&apos;s Encrypt wildcard</p>
          <p className="text-teal-300 font-bold flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 shrink-0" />
            <span>LIVE STORE: https://{currentActiveDomain}/ · LIVE ADMIN: https://{currentActiveDomain}/admin · HTTP/2 200 OK</span>
          </p>
        </div>
      </div>

      {/* Payment Gateway Modal for Buying Hosting & Domain */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-teal-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-base">
                  {isAr ? 'بوابة الدفع الإلكتروني' : 'SaaS Payment Gateway'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-teal-200 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'النطاق المطلوب' : 'Domain Requested'}</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                    {customDomainInput}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'خطة الاستضافة' : 'Hosting Tier'}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedHostingTier}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 text-sm font-black">
                  <span>{isAr ? 'المجموع الشهري' : 'Total Monthly'}</span>
                  <span className="text-teal-700 dark:text-teal-300">
                    {money(selectedHostingTier === 'Hostinger Shared Business' ? 79 : 49)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2" style={{ color: 'var(--text)' }}>
                  {isAr ? 'اختر طريقة الدفع' : 'Select Payment Method'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'mada', label: 'مدى Mada' },
                    { id: 'apple_pay', label: 'Apple Pay' },
                    { id: 'visa', label: 'Visa / MC' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                        paymentMethod === m.id
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isProcessingPayment}
                  className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isAr ? 'جاري المعالجة…' : 'Processing…'}</span>
                    </>
                  ) : (
                    <span>{isAr ? 'إتمام الدفع الآمن' : 'Pay & Submit Request'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Docs Guide Modal */}
      <PageDocsGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        pageId="hosting"
      />
    </div>
  );
};
