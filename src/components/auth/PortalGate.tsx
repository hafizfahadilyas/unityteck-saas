import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Store,
  Flower2,
  Coffee,
  Car,
  Copy,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DEMO_CREDENTIALS, restoreDemoAuth } from '../../auth/api';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';

type PortalGateProps = {
  onOpenMaster: () => void;
  onOpenStore: (slug?: string) => void;
  onOpenStorefront?: () => void;
};

/** Project-start gate: Master + All Dedicated Stores login with individual secure original passwords. */
export const PortalGate: React.FC<PortalGateProps> = ({
  onOpenMaster,
  onOpenStore,
  onOpenStorefront,
}) => {
  const { t, theme, locale, dir } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.setAttribute('data-portal', 'master');
  }, []);

  const handleRestore = () => {
    restoreDemoAuth();
    toast(t('restoreDone'), 'success');
  };

  return (
    <div
      dir={dir}
      lang={locale}
      data-theme={theme}
      data-portal="master"
      className="portal-auth-shell min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            theme === 'dark'
              ? 'radial-gradient(ellipse 80% 50% at 50% -20%, #10606f 0%, transparent 55%)'
              : 'radial-gradient(ellipse 80% 50% at 50% -20%, #98d8d0 0%, transparent 55%)',
        }}
      />

      <div className="absolute top-4 end-4 z-10">
        <PrefsSwitcher />
      </div>

      <div className="relative w-full max-w-4xl space-y-5 my-8">
        <div className="text-center space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">
            {t('brand')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{t('gateTitle')}</h1>
          <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'لكل متجر كلمة مرور أصلية خاصة به ومختلفة عن باقي المتاجر. تم إلغاء كلمة المرور الموحدة "password" لضمان عزل وأمان كل متجر.'
              : 'Each store has its own dedicated original password distinct from others. Generic "password" has been disabled for multi-store isolation.'}
          </p>
        </div>

        {onOpenStorefront && (
          <div
            className="rounded-2xl border p-4.5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 96, 111, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
            }}
          >
            <div className="flex items-center gap-3.5 text-center sm:text-left rtl:sm:text-right">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
              >
                <Flower2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start rtl:sm:justify-start">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    {locale === 'ar' ? 'متجر الورود المباشر للزبائن' : 'Public Live Flowers Storefront'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {locale === 'ar' ? 'واجهة الشراء والطلب' : 'Customer Shop & Order'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {locale === 'ar'
                    ? 'تصفح باقات الورد، الشوكولاتة، إضافة للسلة، تسجيل دخول جوجل أو OTP، وإتمام الطلب مباشرة'
                    : 'Browse bouquets, vases, combos, Google/OTP login and test full checkout & invoice'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenStorefront}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
            >
              <span>{locale === 'ar' ? 'فتح المتجر المباشر' : 'Open Live Storefront'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        )}

        {/* 4 Dedicated Cards: Master + 3 Individual Stores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Master SuperAdmin */}
          <PortalCard
            icon={<ShieldCheck className="w-5 h-5" />}
            badge={isAr ? 'الإدارة المركزية' : 'Platform Master'}
            badgeColor="blue"
            title={t('masterAdmin')}
            subtitle={t('masterLoginSub')}
            email={DEMO_CREDENTIALS.master.email}
            password={DEMO_CREDENTIALS.master.password}
            cta={t('masterLogin')}
            onClick={onOpenMaster}
            emailLabel={t('email')}
            passwordLabel={t('password')}
          />

          {/* Card 2: Makkah Flowers Store */}
          <PortalCard
            icon={<Flower2 className="w-5 h-5" />}
            badge={isAr ? 'متجر هدايا وزهور' : 'Flowers & Gifts'}
            badgeColor="emerald"
            title={isAr ? 'هدايا مكة للزهور والهدايا' : 'Makkah Fresh Flowers'}
            subtitle={isAr ? 'بوابة إدارة متجر زهور وهدايا مكة المكرمة' : 'Makkah Flowers Merchant Admin'}
            email={DEMO_CREDENTIALS.store.email}
            password={DEMO_CREDENTIALS.store.password}
            cta={isAr ? 'دخول متجر هدايا مكة' : 'Login to Flowers Store'}
            onClick={() => onOpenStore('flowers')}
            emailLabel={t('email')}
            passwordLabel={t('password')}
          />

          {/* Card 3: Specialty Coffee Roasters */}
          <PortalCard
            icon={<Coffee className="w-5 h-5" />}
            badge={isAr ? 'متجر قهوة مختصة' : 'Specialty Coffee'}
            badgeColor="amber"
            title={isAr ? 'متجر القهوة المختصة' : 'Specialty Coffee Roasters'}
            subtitle={isAr ? 'بوابة إدارة محمصة القهوة وأدوات الباريستا' : 'Specialty Coffee & Barista Tools Admin'}
            email={DEMO_CREDENTIALS.coffee.email}
            password={DEMO_CREDENTIALS.coffee.password}
            cta={isAr ? 'دخول متجر القهوة' : 'Login to Coffee Store'}
            onClick={() => onOpenStore('coffee')}
            emailLabel={t('email')}
            passwordLabel={t('password')}
          />

          {/* Card 4: Al-Saeedi Car Services */}
          <PortalCard
            icon={<Car className="w-5 h-5" />}
            badge={isAr ? 'خدمات واكسسوارات سيارات' : 'Car Accessories'}
            badgeColor="sky"
            title={isAr ? 'متجر السعيدي لخدمات السيارات' : 'Al-Saeedi Car Services (Blacko)'}
            subtitle={isAr ? 'بوابة إدارة تنجيد ودعاسات السيارات الفاخرة' : 'Precision Car Upholstery & Floor Mats'}
            email={DEMO_CREDENTIALS.car.email}
            password={DEMO_CREDENTIALS.car.password}
            cta={isAr ? 'دخول متجر السيارات' : 'Login to Car Store'}
            onClick={() => onOpenStore('bleco')}
            emailLabel={t('email')}
            passwordLabel={t('password')}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRestore}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer hover:opacity-90 transition-opacity duration-150"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('restoreDemo')}
          </button>
          <a
            href="/clear-cache"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer hover:opacity-90 transition-opacity duration-150"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            {t('clearCache')}
          </a>
          <a
            href="/status"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/status');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity duration-150 inline-flex items-center gap-1"
            style={{ color: 'var(--muted)' }}
          >
            {t('statusAllPages')}
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </a>
        </div>
        <p className="text-center text-[11px]" style={{ color: 'var(--muted)' }}>
          {t('regOnlyViaInvite')}
        </p>
      </div>
    </div>
  );
};

function PortalCard({
  icon,
  badge,
  badgeColor = 'blue',
  title,
  subtitle,
  email,
  password,
  cta,
  onClick,
  emailLabel,
  passwordLabel,
}: {
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: 'blue' | 'emerald' | 'amber' | 'sky';
  title: string;
  subtitle: string;
  email: string;
  password: string;
  cta: string;
  onClick: () => void;
  emailLabel: string;
  passwordLabel: string;
}) {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const badgeStyles = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    sky: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  }[badgeColor];

  return (
    <div
      className="rounded-2xl border p-5 shadow-xl flex flex-col justify-between gap-4 transition-all hover:border-[var(--portal-400)]"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ background: 'var(--portal-cta)' }}
            >
              {icon}
            </div>
            <div>
              <h2 className="text-sm font-extrabold leading-tight text-slate-900 dark:text-slate-100">{title}</h2>
              <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'var(--muted)' }}>
                {subtitle}
              </p>
            </div>
          </div>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badgeStyles}`}>
              {badge}
            </span>
          )}
        </div>

        <div
          className="rounded-xl border px-3 py-2 space-y-1.5 font-mono text-[11px]"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between gap-2 overflow-hidden">
            <span className="opacity-60 text-[10px] shrink-0">{emailLabel}:</span>
            <span className="font-semibold truncate text-[11px] select-all">{email}</span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-1 min-w-0">
              <span className="opacity-60 text-[10px] shrink-0">{passwordLabel}:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] select-all truncate">
                {showPassword ? password : '••••••••••••••••'}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                title={isAr ? 'نسخ كلمة المرور الأصلية' : 'Copy original password'}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-opacity duration-150 hover:opacity-90 shadow-xs"
        style={{ background: 'var(--portal-cta)' }}
      >
        <span>{cta}</span>
        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
      </button>
    </div>
  );
}
