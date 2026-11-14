import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { fetchHealth } from '../../api/tenantApi';
import { RefreshCw, Server, Cloud, HardDrive } from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine, masterGhostBtnClass } from './MasterUiKit';

type ProbeId = 'hostinger' | 'vercel' | 'r2';

type HealthRow = { ok: boolean | null; label: string };

/** SOUQ PLUS Phase 1 §4.6 — real health probe only; never fake Connected. */
export const MasterIntegrationsHub: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [checking, setChecking] = useState<ProbeId | null>(null);
  const [lastChecked, setLastChecked] = useState<Partial<Record<ProbeId, string>>>({});
  const [health, setHealth] = useState<Partial<Record<ProbeId, HealthRow>>>({});
  const autoProbed = useRef(false);

  const integrations: Array<{
    id: ProbeId;
    title: string;
    sub: string;
    desc: string;
    canProbe: boolean;
    icon: typeof Server;
  }> = [
    {
      id: 'hostinger',
      title: isAr ? 'هوستنجر وقاعدة البيانات' : 'Hostinger & MySQL',
      sub: isAr ? 'فحص عبر واجهة صحة المنصة' : 'Probe via platform health API',
      desc: isAr
        ? 'خادم MySQL مشترك مع عزل الصفوف حسب معرّف المتجر. الحالة تظهر فقط بعد فحص حقيقي.'
        : 'Shared MySQL with store_id row isolation. Status only after a real health probe.',
      canProbe: true,
      icon: Server,
    },
    {
      id: 'vercel',
      title: isAr ? 'واجهات متاجر الحافة' : 'Edge storefronts',
      sub: isAr ? 'لا يوجد فحص صحة مربوط' : 'No health probe wired',
      desc: isAr
        ? 'عرض المتاجر العامة. بدون أداة مراقبة مربوطة تبقى الحالة غير معروفة.'
        : 'Public storefront rendering. Without a wired monitor this stays Unknown.',
      canProbe: false,
      icon: Cloud,
    },
    {
      id: 'r2',
      title: isAr ? 'تخزين الكائنات' : 'Object storage',
      sub: isAr ? 'لا يوجد فحص صحة مربوط' : 'No health probe wired',
      desc: isAr
        ? 'وسائط بإصدارات. بدون فحص مزود حقيقي لا تُعرض حالة متصل.'
        : 'Versioned media. No Connected status without a real provider probe.',
      canProbe: false,
      icon: HardDrive,
    },
  ];

  const runHealthCheck = useCallback(
    async (id: ProbeId, title: string, canProbe: boolean, opts?: { silent?: boolean }) => {
      setChecking(id);
      const ts = new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      try {
        if (!canProbe || id !== 'hostinger') {
          setHealth((prev) => ({
            ...prev,
            [id]: {
              ok: null,
              label: isAr ? 'الحالة: غير معروف (لا فحص مربوط)' : 'Status: Unknown (no probe wired)',
            },
          }));
          if (!opts?.silent) {
            toast(
              isAr
                ? `${title}: لا يوجد فحص صحة مربوط — غير معروف`
                : `${title}: no health probe wired — Unknown`,
              'warning',
            );
          }
          return;
        }
        const res = await fetchHealth();
        const mode = String((res as { mode?: string })?.mode || '');
        const db = String((res as { database?: string })?.database || '');
        const ok =
          mode.includes('active_live_mysql') ||
          db.includes('active_live_mysql') ||
          String((res as { status?: string })?.status || '').toLowerCase() === 'ok' ||
          Boolean((res as { ok?: boolean })?.ok);
        setHealth((prev) => ({
          ...prev,
          [id]: {
            ok,
            label: ok
              ? isAr
                ? 'الحالة: يعمل (فحص صحة المنصة)'
                : 'Status: Operational (platform health)'
              : isAr
                ? 'الحالة: متوقف أو متدهور'
                : 'Status: Down or Degraded',
          },
        }));
        if (!opts?.silent) {
          toast(
            ok
              ? isAr
                ? `فحص ${title}: يعمل`
                : `${title} check: Operational`
              : isAr
                ? `فحص ${title}: غير سليم`
                : `${title} check: not healthy`,
            ok ? 'success' : 'error',
          );
        }
      } catch {
        setHealth((prev) => ({
          ...prev,
          [id]: {
            ok: false,
            label: isAr ? 'الحالة: فشل الفحص' : 'Status: Check failed',
          },
        }));
        if (!opts?.silent) {
          toast(isAr ? `فشل فحص ${title}` : `${title} health check failed`, 'error');
        }
      } finally {
        setLastChecked((prev) => ({ ...prev, [id]: ts }));
        setChecking(null);
      }
    },
    [isAr, toast],
  );

  useEffect(() => {
    if (autoProbed.current) return;
    autoProbed.current = true;
    const hostinger = integrations.find((x) => x.id === 'hostinger');
    if (hostinger) {
      void runHealthCheck(hostinger.id, hostinger.title, true, { silent: true });
    }
    // Mount-only live MySQL probe — no fake Connected for unwired channels.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional once-per-mount
  }, [runHealthCheck]);

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'التكاملات والإضافات' : 'Integrations & Add-ons'}
        subtitle={
          isAr
            ? 'لا تُعرض حالة متصل إلا بعد فحص حقيقي — وإلا غير معروف'
            : 'Never show Connected unless a real probe ran — otherwise Unknown'
        }
      />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((it) => {
          const Icon = it.icon;
          const row = health[it.id];
          const statusLabel = row?.label || (isAr ? 'الحالة: غير معروف' : 'Status: Unknown');
          const tone =
            row?.ok === true
              ? { color: '#059669', bg: 'color-mix(in srgb, #10b981 12%, transparent)' }
              : row?.ok === false
                ? { color: '#e11d48', bg: 'color-mix(in srgb, #e11d48 10%, transparent)' }
                : { color: 'var(--muted)', bg: 'color-mix(in srgb, var(--muted) 10%, transparent)' };
          return (
            <MasterLuxePanel key={it.id} interactive className="space-y-3" padding="lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                    color: 'var(--accent)',
                  }}
                >
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {it.title}
                  </h4>
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {it.sub}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {it.desc}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1.5"
                  style={{ color: tone.color, background: tone.bg }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background:
                        row?.ok === true ? '#10b981' : row?.ok === false ? '#e11d48' : 'var(--muted)',
                    }}
                  />
                  {statusLabel}
                </span>
                <button
                  type="button"
                  className={masterGhostBtnClass}
                  disabled={checking === it.id}
                  aria-busy={checking === it.id}
                  onClick={() => void runHealthCheck(it.id, it.title, it.canProbe)}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checking === it.id ? 'animate-spin' : ''}`} aria-hidden />
                  {checking === it.id
                    ? isAr
                      ? 'جارٍ الفحص…'
                      : 'Checking…'
                    : isAr
                      ? 'فحص الحالة'
                      : 'Run Health Check'}
                </button>
              </div>
              {lastChecked[it.id] ? (
                <MasterMetaLine>
                  {isAr ? `آخر فحص: ${lastChecked[it.id]}` : `Last checked: ${lastChecked[it.id]}`}
                </MasterMetaLine>
              ) : null}
            </MasterLuxePanel>
          );
        })}
      </div>
    </AdminPageShell>
  );
};
