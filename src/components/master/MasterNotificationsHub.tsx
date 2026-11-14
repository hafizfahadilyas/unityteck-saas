import React, { useCallback, useEffect, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { Bell, AlertTriangle } from 'lucide-react';
import { formatRelativeTime } from '../../notification-system/utils/dateFilters';
import { fetchMasterNotifications, markMasterNotifications } from '../../api/tenantApi';

/** SOUQ PLUS Phase 1 §4.10 — persisted platform_notifications (MySQL). */
export const MasterNotificationsHub: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([]);
  const [meta, setMeta] = useState<{ new?: number; source?: string }>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetchMasterNotifications();
      setEvents(Array.isArray(res?.data) ? res.data : []);
      setMeta(res?.meta || {});
    } catch {
      toast(isAr ? 'تعذر تحميل الإشعارات' : 'Failed to load notifications', 'error');
      setEvents([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const mark = async (ids: string[], status: string) => {
    try {
      await markMasterNotifications({ ids, status });
      await load();
    } catch {
      toast(isAr ? 'فشل التحديث' : 'Update failed', 'error');
    }
  };

  const markAll = async () => {
    try {
      await markMasterNotifications({ all: true, status: 'Acknowledged' });
      toast(isAr ? 'تم تعليم الكل كمقروء' : 'Marked all as read', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل التحديث' : 'Update failed', 'error');
    }
  };

  const unread = Number(meta.new ?? events.filter((e) => e.status === 'New').length);

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'مركز الإشعارات' : 'Notifications Center'}
        subtitle={
          isAr
            ? 'إشعارات محفوظة في قاعدة البيانات'
            : 'Persisted platform notifications from MySQL'
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
            {unread} {isAr ? 'جديد' : 'new'}
          </span>
        }
        actions={
          <button type="button" className="unity-btn-primary text-sm" onClick={() => void markAll()} disabled={busy || unread === 0}>
            {isAr ? 'تعليمليم الكل كمقروء' : 'Mark all read'}
          </button>
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
            {events.map((ev) => {
              const severity = String(ev.severity || 'Informational');
              const id = String(ev.id);
              return (
                <li key={id} className="p-4 flex gap-3 items-start" style={{ borderColor: 'var(--border)' }}>
                  <AlertTriangle
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{
                      color: severity === 'Critical' || severity === 'High' ? '#e11d48' : 'var(--accent)',
                    }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                        {String(ev.title || '')}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--muted)' }}>
                        {severity}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                        {String(ev.status)} · {String(ev.category || ev.source || '')}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {String(ev.description || '')}
                    </p>
                    {ev.created_at ? (
                      <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                        {formatRelativeTime(String(ev.created_at), locale)}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {String(ev.status) === 'New' ? (
                        <button
                          type="button"
                          className="text-[11px] font-bold"
                          style={{ color: 'var(--accent)' }}
                          onClick={() => void mark([id], 'Acknowledged')}
                        >
                          {isAr ? 'تأكيد' : 'Acknowledge'}
                        </button>
                      ) : null}
                      {String(ev.status) !== 'Archived' ? (
                        <button
                          type="button"
                          className="text-[11px] font-bold"
                          style={{ color: 'var(--muted)' }}
                          onClick={() => void mark([id], 'Archived')}
                        >
                          {isAr ? 'أرشفة' : 'Archive'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="mt-3 text-[11px]" style={{ color: 'var(--muted)' }}>
        {isAr ? 'المصدر' : 'Source'}: {meta.source || 'platform_notifications'}
      </p>
    </AdminPageShell>
  );
};
