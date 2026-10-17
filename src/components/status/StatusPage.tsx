import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Construction,
  HardHat,
  Home,
  RefreshCw,
  ServerCrash,
  ShieldOff,
  WifiOff,
  Wrench,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { StatusKind } from '../../status/routes';
import { STATUS_HUB_LINKS } from '../../status/routes';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { usePrefs } from '../../i18n/PrefsContext';
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
  Exclude<StatusKind, 'hub' | 'redirect'>,
  { code: string; titleKey: DictKey; bodyKey: DictKey }
> = {
  '404': { code: '404', titleKey: 'status404Title', bodyKey: 'status404Body' },
  '500': { code: '500', titleKey: 'status500Title', bodyKey: 'status500Body' },
  '505': { code: '505', titleKey: 'status505Title', bodyKey: 'status505Body' },
  offline: { code: 'Offline', titleKey: 'statusOfflineTitle', bodyKey: 'statusOfflineBody' },
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

function StatusIcon({ kind }: { kind: StatusKind }) {
  const cls = 'w-6 h-6';
  switch (kind) {
    case 'offline':
      return <WifiOff className={cls} />;
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

  if (kind === 'hub') {
    return (
      <Shell theme={theme} dir={dir} locale={locale}>
        <div className="relative w-full max-w-lg rounded-2xl border p-7 shadow-xl space-y-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Header
            icon={<Construction className="w-5 h-5" />}
            title={t('statusHubTitle')}
            subtitle={t('statusHubSubtitle')}
            brand={t('brand')}
          />
          <ul className="space-y-2">
            {STATUS_HUB_LINKS.map((link) => (
              <li key={link.path}>
                <button
                  type="button"
                  onClick={() => onNavigate(link.path)}
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
          <PrimaryButton onClick={onHome} label={t('statusBackHome')} icon={<Home className="w-4 h-4" />} />
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
            brand={t('brand')}
            code="→"
          />
          <PrimaryButton onClick={() => onNavigate(redirectTo)} label={t('statusGoNow')} />
        </Card>
      </Shell>
    );
  }

  const copy = COPY[kind];
  const showRetry = kind === 'offline' || kind === '500';

  return (
    <Shell theme={theme} dir={dir} locale={locale}>
      <Card>
        <Header
          icon={<StatusIcon kind={kind} />}
          title={t(copy.titleKey)}
          subtitle={t(copy.bodyKey)}
          brand={t('brand')}
          code={copy.code}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <PrimaryButton onClick={onHome} label={t('statusBackHome')} icon={<Home className="w-4 h-4" />} />
          {showRetry && (
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
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full max-w-[400px] rounded-2xl border p-7 shadow-xl space-y-5 text-center"
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
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0"
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
      <h1 className="text-xl font-extrabold leading-tight">{title}</h1>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
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
      className="flex-1 w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity duration-150"
      style={{ background: 'var(--portal-cta)' }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
