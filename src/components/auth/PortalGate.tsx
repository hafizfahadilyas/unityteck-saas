import React, { useEffect } from 'react';
import { ArrowRight, RefreshCw, ShieldCheck, Store, Flower2 } from 'lucide-react';
import { DEMO_CREDENTIALS, restoreDemoAuth } from '../../auth/api';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';

type PortalGateProps = {
  onOpenMaster: () => void;
  onOpenStore: () => void;
  onOpenStorefront?: () => void;
};

/** Project-start gate: both Master + Store login links with dummy email/password. */
export const PortalGate: React.FC<PortalGateProps> = ({
  onOpenMaster,
  onOpenStore,
  onOpenStorefront,
}) => {
  const { t, theme, locale, dir } = usePrefs();
  const storeBrand =
    locale === 'ar' ? t('storeDemoBrandAr') : t('storeDemoBrandEn');
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

      <div className="relative w-full max-w-3xl space-y-5">
        <div className="text-center space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">
            {t('brand')}
          </p>
          <h1 className="text-2xl font-extrabold">{t('gateTitle')}</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {t('gateSubtitle')}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PortalCard
            icon={<ShieldCheck className="w-5 h-5" />}
            title={t('masterAdmin')}
            subtitle={t('masterLoginSub')}
            email={DEMO_CREDENTIALS.master.email}
            password={DEMO_CREDENTIALS.master.password}
            cta={t('masterLogin')}
            onClick={onOpenMaster}
            emailLabel={t('email')}
            passwordLabel={t('password')}
          />
          <PortalCard
            icon={<Store className="w-5 h-5" />}
            title={storeBrand}
            subtitle={t('gateStoreSubtitle')}
            email={DEMO_CREDENTIALS.store.email}
            password={DEMO_CREDENTIALS.store.password}
            cta={t('storeLogin')}
            onClick={onOpenStore}
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
  return (
    <div
      className="rounded-2xl border p-6 shadow-xl flex flex-col gap-4"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0"
          style={{ background: 'var(--portal-cta)' }}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-base font-extrabold leading-tight">{title}</h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
            {subtitle}
          </p>
        </div>
      </div>

      <div
        className="rounded-xl border px-3 py-2.5 space-y-1.5 font-mono text-[11px]"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <p>
          <span className="opacity-60">{emailLabel}: </span>
          <span className="font-semibold">{email}</span>
        </p>
        <p>
          <span className="opacity-60">{passwordLabel}: </span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">•••••••••••• ({locale === 'ar' ? 'محمي ومشفّر' : 'Encrypted & Secure'})</span>
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-opacity duration-150 hover:opacity-90"
        style={{ background: 'var(--portal-cta)' }}
      >
        <span>{cta}</span>
        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
      </button>
    </div>
  );
}
