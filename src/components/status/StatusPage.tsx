import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Construction,
  HardHat,
  Home,
  RefreshCw,
  ServerCrash,
  ShieldOff,
  ShieldCheck,
  WifiOff,
  Wifi,
  CheckCircle2,
  Wrench,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Radio,
  Globe,
  Plane,
} from 'lucide-react';
import type { StatusKind } from '../../status/routes';
import { STATUS_HUB_LINKS } from '../../status/routes';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import type { DictKey } from '../../i18n/dict';

type StatusPageProps = {
  kind: StatusKind;
  onHome: () => void;
  onNavigate: (path: string) => void;
  redirectTo?: string;
  error?: Error | unknown;
  errorInfo?: React.ErrorInfo;
};

const COPY: Record<
  Exclude<StatusKind, 'hub' | 'redirect' | 'offline'>,
  { code: string; titleKey: DictKey; bodyKey: DictKey }
> = {
  '404': { code: '404', titleKey: 'status404Title', bodyKey: 'status404Body' },
  '500': { code: '500', titleKey: 'status500Title', bodyKey: 'status500Body' },
  '505': { code: '505', titleKey: 'status505Title', bodyKey: 'status505Body' },
  'under-construction': {
    code: 'Soon',
    titleKey: 'statusConstructionTitle',
    bodyKey: 'statusConstructionBody',
  },
  'coming-soon': {
    code: 'Soon',
    titleKey: 'statusComingTitle',
    bodyKey: 'statusComingBody',
  },
  maintenance: {
    code: 'Pause',
    titleKey: 'statusMaintenanceTitle',
    bodyKey: 'statusMaintenanceBody',
  },
};

function StatusIcon({ kind }: { kind: Exclude<StatusKind, 'hub' | 'redirect' | 'offline'> }) {
  const cls = 'w-6 h-6';
  switch (kind) {
    case '500':
      return <ServerCrash className={cls} />;
    case '505':
      return <ShieldOff className={cls} />;
    case 'under-construction':
      return <Construction className={cls} />;
    case 'coming-soon':
      return <HardHat className={cls} />;
    case 'maintenance':
      return <Wrench className={cls} />;
    default:
      return <Construction className={cls} />;
  }
}

export const StatusPage: React.FC<StatusPageProps> = ({
  kind,
  onHome,
  onNavigate,
  redirectTo = '/',
  error,
  errorInfo,
}) => {
  const { t, theme, dir, locale } = usePrefs();
  const { activeStore } = useTenant();
  const [secs, setSecs] = useState(3);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-portal', 'master');
  }, []);

  useEffect(() => {
    if (kind !== 'redirect') return;
    setSecs(3);
    const tick = window.setInterval(() => {
      setSecs((s) => Math.max(0, s - 1));
    }, 1000);
    const go = window.setTimeout(() => onNavigate(redirectTo), 3000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(go);
    };
  }, [kind, redirectTo, onNavigate]);

  if (kind === 'offline') {
    return (
      <Shell theme={theme} dir={dir} locale={locale}>
        <OfflineStatusCard
          activeStoreName={activeStore?.name}
          onHome={onHome}
          onNavigate={onNavigate}
        />
      </Shell>
    );
  }

  if (kind === 'hub') {
    return (
      <Shell theme={theme} dir={dir} locale={locale}>
        <div
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border p-5 sm:p-7 shadow-xl space-y-4 no-scrollbar"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {/* Prominent Direct Storefront Action Buttons at TOP */}
          <div className="space-y-2 pb-3 border-b border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => onNavigate('/coffee')}
              className="w-full py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <span>☕</span>
              <span>{locale === 'ar' ? 'الذهاب لمتجر القهوة (HiBrew Coffee Store)' : 'Go to Coffee Storefront (HiBrew)'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="py-2 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{locale === 'ar' ? 'الرئيسية' : 'Home'}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/car')}
                className="py-2 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>🚗</span>
                <span>{locale === 'ar' ? 'متجر السيارات' : 'Car Store'}</span>
              </button>
            </div>
          </div>

          <Header
            icon={<Construction className="w-5 h-5" />}
            title={t('statusHubTitle')}
            subtitle={t('statusHubSubtitle')}
            brand={activeStore?.name || t('brand')}
          />
          <ul className="space-y-2">
            {STATUS_HUB_LINKS.map((link) => (
              <li key={link.path}>
                <button
                  type="button"
                  onClick={() => onNavigate(link.path === '/status/redirect' ? '/coffee' : link.path)}
                  className="w-full text-start px-3 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-150 flex items-center justify-between gap-2"
                  style={{
                    background: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 shrink-0 rtl:rotate-180 opacity-60" />
                </button>
              </li>
            ))}
          </ul>
          <PrimaryButton
            onClick={() => onNavigate('/coffee')}
            label={t('statusBackHome')}
            icon={<Home className="w-4 h-4" />}
          />
        </div>
      </Shell>
    );
  }

  if (kind === 'redirect') {
    return (
      <Shell theme={theme} dir={dir} locale={locale}>
        <Card>
          <Header
            icon={<RefreshCw className="w-5 h-5" />}
            title={t('statusRedirectTitle')}
            subtitle={t('statusRedirectBody').replace('{n}', String(secs))}
            brand={activeStore?.name || t('brand')}
            code="→"
          />
          <PrimaryButton onClick={() => onNavigate(redirectTo)} label={t('statusGoNow')} />
        </Card>
      </Shell>
    );
  }

  const copy = COPY[kind];

  return (
    <Shell theme={theme} dir={dir} locale={locale}>
      <Card>
        <Header
          icon={<StatusIcon kind={kind} />}
          title={t(copy.titleKey)}
          subtitle={t(copy.bodyKey)}
          brand={activeStore?.name || t('brand')}
          code={copy.code}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <PrimaryButton onClick={onHome} label={t('statusBackHome')} icon={<Home className="w-4 h-4" />} />
          {kind === '500' && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border cursor-pointer inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity duration-150"
              style={{
                background: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <RefreshCw className="w-4 h-4" />
              {t('statusRetry')}
            </button>
          )}
        </div>
        {kind === '500' && !!error && (
          <div className="mt-4 pt-4 border-t text-left" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-mono font-medium flex items-center gap-1.5 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{showDetails ? 'Hide technical error details' : 'Show technical error details'}</span>
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  const errText = [
                    error instanceof Error ? error.name + ': ' + error.message : String(error),
                    error instanceof Error ? error.stack : '',
                    errorInfo?.componentStack ? 'Component stack:\n' + errorInfo.componentStack : '',
                  ]
                    .filter(Boolean)
                    .join('\n\n');
                  if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(errText);
                  }
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
                title="Copy full crash details to clipboard"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Error'}</span>
              </button>
            </div>

            {showDetails && (
              <div className="p-3 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto max-h-60 overflow-y-auto space-y-2 border border-slate-800 dir-ltr select-text">
                <div className="text-rose-400 font-bold whitespace-pre-wrap">
                  {error instanceof Error ? `${error.name}: ${error.message}` : String(error)}
                </div>
                {error instanceof Error && error.stack && (
                  <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
                {errorInfo?.componentStack && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Component Stack
                    </div>
                    <pre className="text-[10px] text-slate-400 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => onNavigate('/status')}
          className="mt-3 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity duration-150 inline-flex items-center gap-1 mx-auto"
          style={{ color: 'var(--accent)' }}
        >
          {t('statusAllPages')}
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </Card>
    </Shell>
  );
};

/* ── Dedicated Enterprise Offline Status Card ── */
function OfflineStatusCard({
  activeStoreName,
  onHome,
  onNavigate,
}: {
  activeStoreName?: string | null;
  onHome: () => void;
  onNavigate: (path: string) => void;
}) {
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const [connState, setConnState] = useState<'offline' | 'probing' | 'online'>(
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'probing',
  );
  const [showTips, setShowTips] = useState(true);

  const prevPath = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('unityteck_pre_offline');
      if (stored && stored !== '/offline' && stored !== '/status/offline' && stored !== '/status/network') {
        return stored;
      }
    } catch {}
    return null;
  }, []);

  const checkConnectivity = useCallback(
    async (isManual = false) => {
      setConnState('probing');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        // Ping root / favicon cache-busted probe
        const res = await fetch('/favicon.ico?probe=' + Date.now(), {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok || res.type === 'opaque') {
          setConnState('online');
          setTimeout(() => {
            let dest = '/';
            try {
              dest = sessionStorage.getItem('unityteck_pre_offline') || '/';
              sessionStorage.removeItem('unityteck_pre_offline');
            } catch {}
            onNavigate(dest);
          }, 900);
          return;
        }
        setConnState('offline');
      } catch {
        setConnState('offline');
      }
    },
    [onNavigate],
  );

  useEffect(() => {
    // Initial check on mount
    void checkConnectivity();

    const onOnlineEvent = () => {
      void checkConnectivity();
    };
    const onOfflineEvent = () => {
      setConnState('offline');
    };

    window.addEventListener('online', onOnlineEvent);
    window.addEventListener('offline', onOfflineEvent);

    const interval = setInterval(() => {
      if (connState !== 'online') {
        void checkConnectivity();
      }
    }, 7000);

    return () => {
      window.removeEventListener('online', onOnlineEvent);
      window.removeEventListener('offline', onOfflineEvent);
      clearInterval(interval);
    };
  }, [checkConnectivity, connState]);

  const brand = activeStoreName || t('brand');

  return (
    <div
      className="relative w-full max-w-xl mx-auto rounded-3xl border p-6 sm:p-9 shadow-2xl space-y-6 text-center transition-all duration-300"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* ── Animated Radar Beacon ── */}
      <div className="relative mx-auto flex items-center justify-center w-24 h-24">
        {connState === 'offline' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500/20 duration-1000" />
        )}
        {connState === 'probing' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500/20 duration-700" />
        )}
        {connState === 'online' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/25 duration-1000" />
        )}

        <div
          className={`relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-transform duration-300 ${
            connState === 'online'
              ? 'bg-emerald-600 text-white scale-105'
              : connState === 'probing'
              ? 'bg-amber-600 text-white'
              : 'bg-rose-600/95 text-white'
          }`}
        >
          {connState === 'online' ? (
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          ) : connState === 'probing' ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : (
            <WifiOff className="w-10 h-10" />
          )}
        </div>
      </div>

      {/* ── Live Status Pill ── */}
      <div className="flex justify-center">
        {connState === 'online' && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('statusOfflineReconnected')}</span>
          </div>
        )}
        {connState === 'probing' && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{t('statusOfflineChecking')}</span>
          </div>
        )}
        {connState === 'offline' && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{isAr ? 'لا يوجد اتصال بالإنترنت' : 'No Internet Connection'}</span>
          </div>
        )}
      </div>

      {/* ── Brand, Title & Description ── */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider opacity-60">{brand}</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {t('statusOfflineTitle')}
        </h1>
        <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--muted)' }}>
          {t('statusOfflineBody')}
        </p>
      </div>

      {/* ── Data Preservation Guarantee ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs leading-relaxed text-start"
        style={{
          background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
          borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)',
        }}
      >
        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
        <span className="font-medium opacity-90">{t('statusOfflineDataSaved')}</span>
      </div>

      {/* ── Action Buttons ── */}
      <div className="space-y-2.5 pt-1">
        <button
          type="button"
          onClick={() => void checkConnectivity(true)}
          disabled={connState === 'probing' || connState === 'online'}
          className="w-full py-3 px-5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 disabled:opacity-60 shadow-lg hover:shadow-xl hover:opacity-95"
          style={{ background: 'var(--portal-cta)' }}
        >
          <RefreshCw className={`w-4 h-4 ${connState === 'probing' ? 'animate-spin' : ''}`} />
          <span>{connState === 'probing' ? t('statusOfflineChecking') : t('statusRetry')}</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          {prevPath && (
            <button
              type="button"
              onClick={() => onNavigate(prevPath)}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border cursor-pointer inline-flex items-center justify-center gap-2 hover:opacity-85 transition-opacity"
              style={{
                background: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{t('statusOfflineBackPrevious')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onHome}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border cursor-pointer inline-flex items-center justify-center gap-2 hover:opacity-85 transition-opacity"
            style={{
              background: 'var(--bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t('statusBackHome')}</span>
          </button>
        </div>
      </div>

      {/* ── Troubleshooting Diagnostic Checklist ── */}
      <div
        className="rounded-2xl border p-4 text-start transition-all duration-200"
        style={{
          background: 'var(--bg)',
          borderColor: 'var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => setShowTips((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-bold cursor-pointer opacity-85 hover:opacity-100"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            {t('statusOfflineTipsTitle')}
          </span>
          {showTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTips && (
          <ul className="mt-3.5 space-y-2.5 text-[12px] opacity-85">
            <li className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 shrink-0 text-cyan-500" />
              <span>{t('statusOfflineTipWifi')}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 shrink-0 text-indigo-500" />
              <span>{t('statusOfflineTipRouter')}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldOff className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{t('statusOfflineTipVpn')}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Plane className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{t('statusOfflineTipAirplane')}</span>
            </li>
          </ul>
        )}
      </div>

      {/* ── Bottom All Status Pages Link ── */}
      <button
        type="button"
        onClick={() => onNavigate('/status')}
        className="text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity duration-150 inline-flex items-center gap-1.5 mx-auto"
        style={{ color: 'var(--accent)' }}
      >
        <span>{t('statusAllPages')}</span>
        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
      </button>
    </div>
  );
}

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
      data-portal="master"
      className="portal-auth-shell min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-x-hidden selection:bg-purple-600 selection:text-white"
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
      <div className="absolute top-4 end-4 z-20">
        <PrefsSwitcher />
      </div>
      <div className="w-full flex items-center justify-center relative z-10 my-auto">
        {children}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full max-w-[420px] mx-auto rounded-3xl border p-7 shadow-xl space-y-5 text-center"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  );
}

function Header({
  icon,
  title,
  subtitle,
  brand,
  code,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  brand: string;
  code?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
          style={{ background: 'var(--portal-cta)' }}
        >
          {icon}
        </div>
      </div>
      {code && (
        <p
          className="text-sm font-extrabold tracking-wide"
          style={{ color: 'var(--accent)' }}
        >
          {code}
        </p>
      )}
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{brand}</p>
      <h1 className="text-xl sm:text-2xl font-extrabold leading-tight">{title}</h1>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
        {subtitle}
      </p>
    </div>
  );
}

function PrimaryButton({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity duration-150 shadow"
      style={{ background: 'var(--portal-cta)' }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
