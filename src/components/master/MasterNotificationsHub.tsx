import React, { useMemo } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { Bell, AlertTriangle } from 'lucide-react';
import { formatRelativeTime } from '../../notification-system/utils/dateFilters';
import { getStoreDisplayName } from '../../utils/storeLocalization';

/**
 * SOUQ PLUS Phase 1 §4.10 — platform alerts from real store/subscription signals.
 * No fake ticket/outage rows.
 */
export const MasterNotificationsHub: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { stores } = useTenant();

  const events = useMemo(() => {
    const out: Array<{
      id: string;
      title: string;
      desc: string;
      severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
      source: string;
      at?: string;
    }> = [];

    stores.forEach((s) => {
      if (s.status === 'suspended') {
        out.push({
          id: `sus-${s.id}`,
          title: isAr ? 'متجر موقوف' : 'Store suspended',
          desc: getStoreDisplayName(s, locale),
          severity: 'High',
          source: 'stores',
          at: s.lastActivity || s.createdAt,
        });
      }
      if (s.loginEmailActive === false) {
        out.push({
          id: `login-${s.id}`,
          title: isAr ? 'بريد الدخول غير نشط' : 'Login email inactive',
          desc: `${getStoreDisplayName(s, locale)} · ${s.ownerEmail || ''}`,
          severity: 'Critical',
          source: 'security',
          at: s.lastActivity,
        });
      }
      if (s.status === 'pending') {
        out.push({
          id: `pend-${s.id}`,
          title: isAr ? 'متجر بانتظار المراجعة' : 'Store pending review',
          desc: getStoreDisplayName(s, locale),
          severity: 'Medium',
          source: 'onboarding',
          at: s.createdAt,
        });
      }
    });

    return out;
  }, [stores, locale, isAr]);

  const unread = events.length;

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'مركز الإشعارات' : 'Notifications Center'}
        subtitle={
          isAr
            ? 'أحداث المنصة من الوحدات الحقيقية فقط'
            : 'Platform events from real modules only'
        }
        badge={
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg"
            style={{
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              color: 'var(--accent)',
            }}
          >
            <Bell className="w-3.5 h-3.5" aria-hidden />
            {unread} {isAr ? 'غير مقروء' : 'open'}
          </span>
        }
      />

      <div
        className="mt-4 rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        {events.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
            {isAr ? 'بانتظار البيانات' : 'Waiting for Data'}
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {events.map((ev) => (
              <li
                key={ev.id}
                className="p-4 flex gap-3 items-start"
                style={{ borderColor: 'var(--border)' }}
              >
                <AlertTriangle
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{
                    color:
                      ev.severity === 'Critical' || ev.severity === 'High'
                        ? '#e11d48'
                        : 'var(--accent)',
                  }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                      {ev.title}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--muted)' }}>
                      {ev.severity}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      {ev.source}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {ev.desc}
                  </p>
                  {ev.at ? (
                    <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                      {formatRelativeTime(ev.at, locale)}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-[11px]" style={{ color: 'var(--muted)' }}>
        {isAr
          ? 'المصدر: حالة المتاجر وبريد الدخول · لا تذاكر دعم وهمية'
          : 'Source: store status + login email · no fake support tickets'}
      </p>
    </AdminPageShell>
  );
};
